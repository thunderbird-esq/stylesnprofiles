/**
 * Test Executor - Intelligent Parallel Test Execution Engine
 *
 * Handles parallel test execution with resource management,
 * worker threads, and performance optimization
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { performance } = require('perf_hooks');
const EventEmitter = require('events');
const chalk = require('chalk');

class TestExecutor extends EventEmitter {
  constructor(resourcePool, options = {}) {
    super();
    this.resourcePool = resourcePool;
    this.options = {
      maxConcurrent: options.maxWorkers || require('os').cpus().length,
      timeout: options.timeout || 30000,
      retries: options.retries || 1,
      ...options
    };

    this.workers = new Map();
    this.runningTests = new Map();
    this.completedTests = [];
    this.metrics = {
      totalTests: 0,
      completedTests: 0,
      failedTests: 0,
      totalDuration: 0,
      averageTestTime: 0
    };
  }

  /**
   * Execute a test phase with parallel optimization
   */
  async executePhase(phase) {
    console.log(chalk.blue(`🚀 Executing ${phase.type} phase: ${phase.tests.length} tests`));

    this.metrics.totalTests += phase.tests.length;

    // Create execution batches based on test type and resources
    const batches = await this.createBatches(phase);

    console.log(chalk.cyan(`📦 Created ${batches.length} execution batches`));

    const results = [];
    const phaseStartTime = performance.now();

    for (const [batchIndex, batch] of batches.entries()) {
      console.log(chalk.white(`🔄 Running batch ${batchIndex + 1}/${batches.length} (${batch.tests.length} tests)`));

      const batchResults = await this.executeBatch(batch, batchIndex);
      results.push(...batchResults);

      // Check if we should continue based on critical failures
      const criticalFailures = batchResults.filter(r => r.status === 'failed' && r.critical);
      if (criticalFailures.length > 0 && !phase.continueOnFailure) {
        console.log(chalk.red(`⛔ ${criticalFailures.length} critical failures detected, stopping phase`));
        break;
      }
    }

    const phaseDuration = performance.now() - phaseStartTime;
    this.metrics.totalDuration += phaseDuration;

    console.log(chalk.green(`✅ Phase completed in ${(phaseDuration / 1000).toFixed(2)}s`));

    return results;
  }

  /**
   * Create optimized execution batches
   */
  async createBatches(phase) {
    const { type, tests } = phase;
    const config = this.getPhaseConfig(type);

    // Sort tests by estimated duration (longest first for better load balancing)
    const sortedTests = [...tests].sort((a, b) => (b.estimatedTime || 0) - (a.estimatedTime || 0));

    const batches = [];
    const batchSize = Math.min(config.batchSize, Math.ceil(sortedTests.length / config.maxWorkers));

    // Create batches based on estimated execution time and resources
    for (let i = 0; i < sortedTests.length; i += batchSize) {
      const batchTests = sortedTests.slice(i, i + batchSize);
      const totalEstimatedTime = batchTests.reduce((sum, test) => sum + (test.estimatedTime || 0), 0);

      batches.push({
        id: `batch-${Math.floor(i / batchSize)}`,
        type,
        tests: batchTests,
        estimatedDuration: totalEstimatedTime,
        maxConcurrency: Math.min(config.maxWorkers, batchTests.length),
        resources: {
          memory: config.memoryPerWorker * Math.min(config.maxWorkers, batchTests.length),
          timeout: config.timeout
        }
      });
    }

    // Optimize batch order based on dependencies and estimated time
    return this.optimizeBatchOrder(batches);
  }

  /**
   * Get phase configuration
   */
  getPhaseConfig(type) {
    const configs = {
      unit: { maxWorkers: 4, batchSize: 10, memoryPerWorker: 256, timeout: 10000 },
      integration: { maxWorkers: 2, batchSize: 5, memoryPerWorker: 512, timeout: 60000 },
      e2e: { maxWorkers: 1, batchSize: 1, memoryPerWorker: 1024, timeout: 180000 },
      api: { maxWorkers: 2, batchSize: 3, memoryPerWorker: 256, timeout: 45000 },
      database: { maxWorkers: 1, batchSize: 1, memoryPerWorker: 384, timeout: 90000 },
      performance: { maxWorkers: 1, batchSize: 1, memoryPerWorker: 1024, timeout: 600000 }
    };

    return configs[type] || configs.unit;
  }

  /**
   * Optimize batch execution order
   */
  optimizeBatchOrder(batches) {
    // Sort by estimated duration (shortest first for faster feedback)
    return batches.sort((a, b) => a.estimatedDuration - b.estimatedDuration);
  }

  /**
   * Execute a batch of tests with worker threads
   */
  async executeBatch(batch, batchIndex) {
    return new Promise((resolve, reject) => {
      const results = [];
      const startTime = performance.now();
      let completedTests = 0;
      let hasErrors = false;

      // Acquire resources for this batch
      const resourceAcquired = this.resourcePool.acquire(batch.resources);
      if (!resourceAcquired) {
        console.log(chalk.yellow(`⚠️  Waiting for resources for batch ${batchIndex + 1}`));
        await this.waitForResources(batch.resources);
      }

      console.log(chalk.cyan(`🧵 Starting ${batch.tests.length} workers for batch ${batchIndex + 1}`));

      // Create worker for each test (or group small tests)
      const workers = [];
      const workerPromises = [];

      for (const test of batch.tests) {
        const workerPromise = this.runTestInWorker(test, batchIndex);
        workers.push(workerPromise);
      }

      // Wait for all workers to complete
      Promise.allSettled(workers)
        .then((results) => {
          const testResults = results.map((result, index) => {
            if (result.status === 'fulfilled') {
              return result.value;
            } else {
              console.error(chalk.red(`❌ Worker error for ${batch.tests[index].id}: ${result.reason}`));
              return {
                test: batch.tests[index],
                status: 'failed',
                error: result.reason.message,
                duration: 0,
                critical: false
              };
            }
          });

          this.resourcePool.release(batch.resources);

          const batchDuration = performance.now() - startTime;
          console.log(chalk.green(`✅ Batch ${batchIndex + 1} completed in ${(batchDuration / 1000).toFixed(2)}s`));

          resolve(testResults);
        })
        .catch((error) => {
          this.resourcePool.release(batch.resources);
          console.error(chalk.red(`❌ Batch ${batchIndex + 1} failed: ${error.message}`));
          reject(error);
        });
    });
  }

  /**
   * Run a single test in a worker thread
   */
  async runTestInWorker(test, batchIndex) {
    return new Promise((resolve, reject) => {
      const testStartTime = performance.now();

      // Create worker data
      const workerData = {
        testId: test.id,
        testPath: test.file,
        testType: test.type,
        timeout: this.options.timeout,
        retries: this.options.retries,
        options: {
          coverage: this.options.coverage !== false,
          verbose: this.options.verbose
        }
      };

      // Create worker thread
      const worker = new Worker(__dirname + '/worker.js', { workerData });

      let workerResult = null;

      // Handle worker messages
      worker.on('message', (message) => {
        switch (message.type) {
          case 'started':
            console.log(chalk.white(`  🧪 ${test.id} started`));
            break;
          case 'progress':
            if (this.options.verbose) {
              console.log(chalk.gray(`    ${message.message}`));
            }
            break;
          case 'completed':
            workerResult = message.data;
            break;
          case 'error':
            workerResult = {
              status: 'failed',
              error: message.error,
              stack: message.stack
            };
            break;
        }
      });

      // Handle worker completion
      worker.on('exit', (code) => {
        const testDuration = performance.now() - testStartTime;

        if (code !== 0 && !workerResult) {
          workerResult = {
            status: 'failed',
            error: `Worker exited with code ${code}`,
            stack: null
          };
        }

        // Normalize result
        const result = {
          test: test,
          status: workerResult?.status || 'failed',
          error: workerResult?.error || null,
          stack: workerResult?.stack || null,
          duration: testDuration,
          coverage: workerResult?.coverage || null,
          metrics: workerResult?.metrics || {},
          batchIndex,
          critical: test.type === 'database' || test.type === 'api'
        };

        // Update metrics
        this.updateMetrics(result);

        // Clean up worker
        if (!worker.exited) {
          worker.terminate();
        }

        resolve(result);
      });

      // Handle worker errors
      worker.on('error', (error) => {
        console.error(chalk.red(`❌ Worker error for ${test.id}: ${error.message}`));
        worker.terminate();
        resolve({
          test: test,
          status: 'failed',
          error: error.message,
          stack: error.stack,
          duration: performance.now() - testStartTime,
          critical: test.type === 'database' || test.type === 'api'
        });
      });

      // Set timeout
      const timeoutId = setTimeout(() => {
        console.error(chalk.red(`⏰ Test ${test.id} timed out after ${this.options.timeout}ms`));
        worker.terminate();
        resolve({
          test: test,
          status: 'failed',
          error: `Test timed out after ${this.options.timeout}ms`,
          stack: null,
          duration: this.options.timeout,
          critical: test.type === 'database' || test.type === 'api'
        });
      }, this.options.timeout);

      // Clear timeout on completion
      worker.on('exit', () => {
        clearTimeout(timeoutId);
      });

      // Store worker reference
      this.workers.set(test.id, worker);
    });
  }

  /**
   * Wait for resources to become available
   */
  async waitForResources(resources, timeout = 60000) {
    const startTime = performance.now();

    while (!this.resourcePool.acquire(resources)) {
      if (performance.now() - startTime > timeout) {
        throw new Error(`Resource timeout after ${timeout}ms`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Update execution metrics
   */
  updateMetrics(result) {
    this.metrics.completedTests++;

    if (result.status === 'failed') {
      this.metrics.failedTests++;
    }

    this.metrics.totalDuration += result.duration;
    this.metrics.averageTestTime = this.metrics.totalDuration / this.metrics.completedTests;

    // Emit progress event
    this.emit('test-completed', {
      progress: this.metrics.completedTests / this.metrics.totalTests,
      test: result,
      metrics: this.metrics
    });
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      runningTests: this.runningTests.size,
      activeWorkers: this.workers.size,
      resourceUtilization: this.resourcePool.getUtilization()
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log(chalk.yellow('🛑 Shutting down test executor...'));

    // Terminate all running workers
    const terminationPromises = [];
    for (const [testId, worker] of this.workers) {
      if (!worker.exited) {
        terminationPromises.push(
          new Promise((resolve) => {
            worker.terminate();
            worker.on('exit', resolve);
          })
        );
      }
    }

    await Promise.all(terminationPromises);
    this.workers.clear();

    console.log(chalk.green('✅ Test executor shutdown complete'));
  }
}

module.exports = TestExecutor;