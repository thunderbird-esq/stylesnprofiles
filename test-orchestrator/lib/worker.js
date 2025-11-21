/**
 * Test Worker Thread - Isolated Test Execution Environment
 *
 * Runs individual tests in isolated worker threads with
 * proper cleanup, timeout handling, and resource management
 */

const { performance } = require('perf_hooks');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load test worker data
const { testId, testPath, testType, timeout, retries, options } = workerData;

class TestWorker {
  constructor(workerData) {
    this.testId = workerData.testId;
    this.testPath = workerData.testPath;
    this.testType = workerData.testType;
    this.timeout = workerData.timeout;
    this.retries = workerData.retries;
    this.options = workerData.options;

    this.startTime = performance.now();
    this.result = null;
  }

  /**
   * Execute the test with proper isolation and cleanup
   */
  async execute() {
    try {
      this.sendMessage('started', { testId: this.testId });

      // Set up test environment
      await this.setupEnvironment();

      // Execute test with retries
      const result = await this.executeWithRetries();

      // Generate coverage if requested
      if (this.options.coverage) {
        result.coverage = await this.generateCoverage();
      }

      // Collect performance metrics
      result.metrics = this.collectMetrics();

      this.sendMessage('completed', result);
      return result;

    } catch (error) {
      const errorResult = {
        status: 'failed',
        error: error.message,
        stack: error.stack,
        duration: performance.now() - this.startTime
      };

      this.sendMessage('error', {
        error: error.message,
        stack: error.stack
      });

      return errorResult;

    } finally {
      // Cleanup resources
      await this.cleanup();
    }
  }

  /**
   * Set up isolated test environment
   */
  async setupEnvironment() {
    // Set test-specific environment variables
    process.env.NODE_ENV = 'test';
    process.env.TEST_WORKER_ID = this.testId;
    process.env.TEST_TYPE = this.testType;

    // Override some configurations for isolation
    if (this.testType === 'integration') {
      process.env.TEST_INTEGRATION = 'true';
      process.env.API_BASE_URL = 'http://localhost:3001';
    }

    if (this.testType === 'unit') {
      process.env.TEST_ISOLATION = 'true';
    }

    // Setup test database for database tests
    if (this.testType === 'database') {
      process.env.TEST_DB = 'true';
      process.env.DB_NAME = 'nasa_system6_test';
    }
  }

  /**
   * Execute test with retry logic
   */
  async executeWithRetries() {
    let lastError = null;

    for (let attempt = 1; attempt <= this.retries + 1; attempt++) {
      try {
        if (attempt > 1) {
          this.sendMessage('progress', {
            message: `Retry attempt ${attempt - 1}`
          });
        }

        const result = await this.runTest();
        return result;

      } catch (error) {
        lastError = error;

        if (attempt <= this.retries) {
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Run the actual test
   */
  async runTest() {
    const testStartTime = performance.now();

    try {
      // Determine test runner based on file location and type
      const runner = this.getTestRunner();

      // Execute the test
      const result = await runner.run(this.testPath, {
        timeout: this.timeout,
        coverage: this.options.coverage,
        verbose: this.options.verbose
      });

      const testDuration = performance.now() - testStartTime;

      return {
        status: result.success ? 'passed' : 'failed',
        error: result.error,
        stack: result.stack,
        duration: testDuration,
        testResults: result.results,
        assertions: result.assertions,
        coverage: result.coverage
      };

    } catch (error) {
      const testDuration = performance.now() - testStartTime;

      return {
        status: 'failed',
        error: error.message,
        stack: error.stack,
        duration: testDuration
      };
    }
  }

  /**
   * Get appropriate test runner for the test
   */
  getTestRunner() {
    // Client-side tests (React components)
    if (this.testPath.includes('client/')) {
      return new JestRunner({
        configPath: this.getJestConfigPath(),
        testEnvironment: 'jsdom',
        setupFiles: this.getSetupFiles()
      });
    }

    // Server-side tests
    if (this.testPath.includes('server/')) {
      return new JestRunner({
        configPath: this.getJestConfigPath(),
        testEnvironment: 'node',
        setupFiles: this.getSetupFiles()
      });
    }

    // Default fallback
    return new JestRunner({
      testEnvironment: 'node'
    });
  }

  /**
   * Get Jest configuration path
   */
  getJestConfigPath() {
    if (this.testPath.includes('client/')) {
      return path.join(process.cwd(), 'client', 'package.json');
    }
    if (this.testPath.includes('server/')) {
      return path.join(process.cwd(), 'server', 'jest.config.js');
    }
    return null;
  }

  /**
   * Get setup files for the test
   */
  getSetupFiles() {
    const setupFiles = [];

    if (this.testPath.includes('client/')) {
      setupFiles.push(path.join(process.cwd(), 'client', 'src', 'setupTests.js'));
    }

    if (this.testPath.includes('server/')) {
      setupFiles.push(path.join(process.cwd(), 'server', 'jest.setup.js'));
    }

    return setupFiles.filter(fs.existsSync);
  }

  /**
   * Generate coverage report
   */
  async generateCoverage() {
    try {
      // For Jest tests, coverage is generated automatically
      const coverageDir = path.join(process.cwd(), 'coverage');

      if (fs.existsSync(coverageDir)) {
        const coverageSummaryPath = path.join(coverageDir, 'coverage-summary.json');

        if (fs.existsSync(coverageSummaryPath)) {
          const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
          return coverageData.total;
        }
      }

      return null;
    } catch (error) {
      console.warn(`Warning: Could not generate coverage for ${this.testId}:`, error.message);
      return null;
    }
  }

  /**
   * Collect performance metrics
   */
  collectMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        external: memUsage.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      duration: performance.now() - this.startTime
    };
  }

  /**
   * Cleanup resources after test execution
   */
  async cleanup() {
    // Close database connections
    if (global.testDatabasePool) {
      await global.testDatabasePool.end();
    }

    // Close HTTP servers
    if (global.testServer) {
      await global.testServer.close();
    }

    // Clear timers
    clearTimeout(this.cleanupTimer);
    clearTimeout(this.timeoutTimer);

    // Clear global test state
    delete process.env.TEST_WORKER_ID;
    delete process.env.TEST_TYPE;
    delete process.env.TEST_INTEGRATION;
    delete process.env.TEST_ISOLATION;
    delete process.env.TEST_DB;
  }

  /**
   * Send message to parent thread
   */
  sendMessage(type, data) {
    if (parentPort) {
      parentPort.postMessage({
        type,
        data,
        timestamp: performance.now()
      });
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Jest Test Runner Wrapper
 */
class JestRunner {
  constructor(options = {}) {
    this.options = options;
  }

  async run(testPath, runOptions = {}) {
    try {
      const jestConfig = this.buildJestConfig(runOptions);
      const jestArgs = this.buildJestArgs(testPath, runOptions);

      // Run Jest and capture results
      const result = this.runJestCommand(jestArgs, jestConfig);

      return {
        success: result.exitCode === 0,
        results: this.parseJestResults(result),
        assertions: this.extractAssertions(result),
        coverage: this.extractCoverage(result),
        error: result.exitCode !== 0 ? this.extractJestError(result) : null
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  buildJestConfig(runOptions) {
    const config = {
      testEnvironment: this.options.testEnvironment || 'node',
      verbose: runOptions.verbose || false,
      collectCoverage: runOptions.coverage || false,
      coverageReporters: ['json-summary'],
      testTimeout: runOptions.timeout || 30000
    };

    if (this.options.setupFiles) {
      config.setupFilesAfterEnv = this.options.setupFiles;
    }

    return config;
  }

  buildJestArgs(testPath, runOptions) {
    const args = [
      '--testPathPattern=' + testPath,
      '--json',
      '--useStderr',
      '--passWithNoTests'
    ];

    if (runOptions.coverage) {
      args.push('--coverage', '--coverageReporters=json-summary');
    }

    if (this.options.configPath) {
      args.push('--config=' + this.options.configPath);
    }

    return args;
  }

  runJestCommand(args, config) {
    try {
      const jestPath = require.resolve('jest/bin/jest.js');
      const command = `node "${jestPath}" ${args.join(' ')}`;

      return {
        stdout: execSync(command, {
          encoding: 'utf8',
          stdio: 'pipe',
          cwd: process.cwd()
        }),
        stderr: '',
        exitCode: 0
      };
    } catch (error) {
      return {
        stdout: error.stdout,
        stderr: error.stderr,
        exitCode: error.status
      };
    }
  }

  parseJestResults(result) {
    try {
      // Extract JSON results from Jest output
      const jsonMatch = result.stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.warn('Could not parse Jest results:', error.message);
      return null;
    }
  }

  extractAssertions(result) {
    try {
      const jestResults = this.parseJestResults(result);
      if (jestResults && jestResults.numTotalTests) {
        return {
          total: jestResults.numTotalTests,
          passed: jestResults.numPassedTests,
          failed: jestResults.numFailedTests,
          skipped: jestResults.numPendingTests
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  extractCoverage(result) {
    try {
      // Coverage is extracted from coverage files in generateCoverage()
      return null;
    } catch (error) {
      return null;
    }
  }

  extractJestError(result) {
    if (result.stderr) {
      return result.stderr;
    }

    if (result.exitCode !== 0) {
      return `Test failed with exit code ${result.exitCode}`;
    }

    return 'Unknown test error';
  }
}

// Execute test worker if running as worker thread
if (!isMainThread) {
  const worker = new TestWorker(workerData);
  worker.execute()
    .then(() => {
      if (parentPort) {
        parentPort.postMessage({
          type: 'worker-exit',
          timestamp: performance.now()
        });
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('Worker execution failed:', error);
      process.exit(1);
    });
}

module.exports = { TestWorker, JestRunner };