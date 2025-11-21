#!/usr/bin/env node

/**
 * NASA System 6 Portal - Intelligent Test Automation Orchestrator
 *
 * Advanced test orchestration system with:
 * - Intelligent test discovery and classification
 * - Parallel execution optimization
 * - Resource management and pooling
 * - Dependency resolution and ordering
 * - CI/CD pipeline integration
 * - Performance monitoring and analytics
 *
 * Usage:
 *   node test-orchestrator/index.js [command] [options]
 *
 * Commands:
 *   discover     - Discover and classify all tests
 *   run         - Execute optimized test suite
 *   monitor     - Monitor test performance
 *   report      - Generate detailed reports
 *   optimize    - Analyze and suggest optimizations
 */

const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');
const { performance } = require('perf_hooks');
const chalk = require('chalk');

class TestOrchestrator {
  constructor(options = {}) {
    this.projectRoot = path.resolve(__dirname, '..');
    this.options = {
      maxWorkers: options.maxWorkers || require('os').cpus().length,
      timeout: options.timeout || 30000,
      verbose: options.verbose || false,
      parallel: options.parallel !== false,
      coverage: options.coverage !== false,
      ...options
    };

    this.testRegistry = new Map();
    this.dependencyGraph = new Map();
    this.resourcePool = new ResourcePool(this.options.maxWorkers);
    this.metrics = new TestMetrics();
    this.cache = new TestCache();

    this.initializeTestTypes();
    this.loadConfiguration();
  }

  /**
   * Initialize test type classifications
   */
  initializeTestTypes() {
    this.testTypes = {
      UNIT: {
        priority: 1,
        parallelizable: true,
        isolation: true,
        maxMemory: 128,
        estimatedTime: 100,
        patterns: ['**/*.test.js', '!**/*.integration.test.js', '!**/*.e2e.test.js']
      },
      INTEGRATION: {
        priority: 2,
        parallelizable: true,
        isolation: false,
        maxMemory: 256,
        estimatedTime: 500,
        patterns: ['**/*.integration.test.js']
      },
      E2E: {
        priority: 3,
        parallelizable: false,
        isolation: true,
        maxMemory: 512,
        estimatedTime: 3000,
        patterns: ['**/*.e2e.test.js', '**/*.spec.js']
      },
      API: {
        priority: 2,
        parallelizable: true,
        isolation: true,
        maxMemory: 256,
        estimatedTime: 200,
        patterns: ['**/api/*.test.js', '**/*api*.test.js']
      },
      DATABASE: {
        priority: 2,
        parallelizable: false,
        isolation: true,
        maxMemory: 384,
        estimatedTime: 1500,
        patterns: ['**/db.test.js', '**/*database*.test.js']
      },
      PERFORMANCE: {
        priority: 4,
        parallelizable: false,
        isolation: true,
        maxMemory: 1024,
        estimatedTime: 10000,
        patterns: ['**/*perf*.test.js', '**/*performance*.test.js']
      }
    };
  }

  /**
   * Load orchestration configuration
   */
  loadConfiguration() {
    const configPath = path.join(this.projectRoot, 'test-orchestrator.config.js');

    if (fs.existsSync(configPath)) {
      try {
        this.config = require(configPath);
      } catch (error) {
        console.warn(chalk.yellow('⚠️  Could not load config file, using defaults'));
        this.config = this.getDefaultConfiguration();
      }
    } else {
      this.config = this.getDefaultConfiguration();
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfiguration() {
    return {
      testDirectories: [
        'client/src/__tests__',
        'client/src/__integration__',
        'server/__tests__'
      ],
      excludePatterns: [
        '**/node_modules/**',
        '**/coverage/**',
        '**/dist/**',
        '**/build/**'
      ],
      parallel: {
        unit: { maxWorkers: 4, batchSize: 10 },
        integration: { maxWorkers: 2, batchSize: 5 },
        e2e: { maxWorkers: 1, batchSize: 1 }
      },
      resources: {
        maxMemory: 2048,
        maxCpu: 80,
        diskSpace: 1024
      },
      thresholds: {
        testTimeout: 30000,
        suiteTimeout: 300000,
        memoryLimit: 1024,
        coverageThreshold: 80
      },
      reporting: {
        formats: ['json', 'html', 'junit'],
        outputDir: 'test-results',
        includeCoverage: true,
        includePerformance: true
      }
    };
  }

  /**
   * Main execution method
   */
  async run(command, args = {}) {
    const startTime = performance.now();

    try {
      console.log(chalk.blue('🚀 NASA System 6 Portal - Test Orchestrator'));
      console.log(chalk.blue('='.repeat(50)));

      switch (command) {
        case 'discover':
          await this.discoverTests();
          break;
        case 'run':
          await this.runTests(args);
          break;
        case 'monitor':
          await this.monitorTests();
          break;
        case 'report':
          await this.generateReports();
          break;
        case 'optimize':
          await this.optimizeSuite();
          break;
        case 'full':
          await this.runFullOrchestration();
          break;
        default:
          throw new Error(`Unknown command: ${command}`);
      }

      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log(chalk.green(`\n✅ Orchestrator completed in ${duration}s`));

    } catch (error) {
      console.error(chalk.red(`❌ Orchestrator failed: ${error.message}`));
      process.exit(1);
    }
  }

  /**
   * Discover and classify all tests
   */
  async discoverTests() {
    console.log(chalk.cyan('🔍 Discovering and classifying tests...'));

    const discovery = new TestDiscovery(this.projectRoot, this.config);
    const testFiles = await discovery.findTestFiles();

    console.log(chalk.white(`Found ${testFiles.length} test files`));

    for (const testFile of testFiles) {
      const classification = await this.classifyTest(testFile);
      this.registerTest(testFile, classification);
    }

    await this.buildDependencyGraph();
    this.printDiscoverySummary();

    return this.testRegistry;
  }

  /**
   * Classify individual test file
   */
  async classifyTest(testFile) {
    const content = await fs.promises.readFile(testFile, 'utf8');
    const relativePath = path.relative(this.projectRoot, testFile);

    // Analyze content for test type indicators
    const indicators = {
      isUnit: /test\(/i.test(content) && !/integration/i.test(relativePath),
      isIntegration: /integration/i.test(relativePath) || /req\.|res\./.test(content),
      isE2E: /e2e|spec\.js/i.test(relativePath) || /cy\.|page\./.test(content),
      isAPI: /api|proxy|route/i.test(relativePath) || /express|router/.test(content),
      isDatabase: /db|database|pool/i.test(relativePath) || /postgres|sql/.test(content),
      isPerformance: /performance|perf|benchmark/i.test(content)
    };

    // Determine test type based on indicators
    let testType = 'UNIT';
    if (indicators.isE2E) testType = 'E2E';
    else if (indicators.isPerformance) testType = 'PERFORMANCE';
    else if (indicators.isDatabase) testType = 'DATABASE';
    else if (indicators.isAPI || indicators.isIntegration) testType = 'INTEGRATION';

    // Estimate execution time based on test type and content
    const estimatedTime = this.estimateExecutionTime(testFile, content, testType);

    // Detect dependencies
    const dependencies = await this.detectDependencies(testFile, content);

    return {
      type: testType,
      path: testFile,
      relativePath,
      estimatedTime,
      dependencies,
      indicators,
      size: content.length,
      lineCount: content.split('\n').length
    };
  }

  /**
   * Estimate test execution time
   */
  estimateExecutionTime(filePath, content, testType) {
    const baseTime = this.testTypes[testType].estimatedTime;
    const testCount = (content.match(/test\(|it\(/g) || []).length;
    const complexityMultiplier = content.length / 1000;

    return Math.ceil(baseTime + (testCount * 50) + (complexityMultiplier * 100));
  }

  /**
   * Detect test dependencies
   */
  async detectDependencies(filePath, content) {
    const dependencies = {
      files: [],
      services: [],
      database: false,
      network: false,
      external: []
    };

    // File dependencies
    const requireMatches = content.match(/require\(['"]([^'"]+)['"]\)/g) || [];
    dependencies.files = requireMatches.map(match =>
      match.match(/require\(['"]([^'"]+)['"]\)/)[1]
    );

    // Service dependencies
    if (/fetch|axios|http/i.test(content)) {
      dependencies.services.push('http');
      dependencies.network = true;
    }

    // Database dependencies
    if (/postgres|sql|pool|db/i.test(content)) {
      dependencies.services.push('database');
      dependencies.database = true;
    }

    // External service dependencies
    if (/api\.nasa\.gov|localhost:3001/i.test(content)) {
      dependencies.external.push('nasa-api', 'api-proxy');
    }

    return dependencies;
  }

  /**
   * Register test in registry
   */
  registerTest(testFile, classification) {
    const testId = path.relative(this.projectRoot, testFile);

    this.testRegistry.set(testId, {
      id: testId,
      file: testFile,
      ...classification,
      status: 'pending',
      lastRun: null,
      history: []
    });
  }

  /**
   * Build dependency graph for test ordering
   */
  async buildDependencyGraph() {
    console.log(chalk.cyan('🔗 Building dependency graph...'));

    for (const [testId, test] of this.testRegistry) {
      const dependencies = [];

      // Add dependencies based on test type
      if (test.dependencies.database) {
        dependencies.push(...this.findDatabaseSetupTests());
      }

      if (test.dependencies.services.includes('api-proxy')) {
        dependencies.push(...this.findAPISetupTests());
      }

      this.dependencyGraph.set(testId, dependencies);
    }

    console.log(chalk.green(`✅ Built dependency graph with ${this.dependencyGraph.size} nodes`));
  }

  /**
   * Find database setup tests
   */
  findDatabaseSetupTests() {
    const dbTests = [];
    for (const [testId, test] of this.testRegistry) {
      if (test.type === 'DATABASE' || test.file.includes('db.test.js')) {
        dbTests.push(testId);
      }
    }
    return dbTests;
  }

  /**
   * Find API setup tests
   */
  findAPISetupTests() {
    const apiTests = [];
    for (const [testId, test] of this.testRegistry) {
      if (test.type === 'API' && test.file.includes('server.test.js')) {
        apiTests.push(testId);
      }
    }
    return apiTests;
  }

  /**
   * Print discovery summary
   */
  printDiscoverySummary() {
    console.log(chalk.white('\n📊 Test Discovery Summary:'));

    const summary = {};
    for (const test of this.testRegistry.values()) {
      summary[test.type] = (summary[test.type] || 0) + 1;
    }

    for (const [type, count] of Object.entries(summary)) {
      const color = this.getTypeColor(type);
      console.log(color(`  ${type}: ${count} tests`));
    }

    const totalTime = Array.from(this.testRegistry.values())
      .reduce((sum, test) => sum + test.estimatedTime, 0);
    console.log(chalk.white(`  Estimated total time: ${(totalTime / 1000).toFixed(1)}s`));
  }

  /**
   * Get color for test type
   */
  getTypeColor(type) {
    const colors = {
      UNIT: chalk.green,
      INTEGRATION: chalk.blue,
      E2E: chalk.magenta,
      API: chalk.cyan,
      DATABASE: chalk.yellow,
      PERFORMANCE: chalk.red
    };
    return colors[type] || chalk.white;
  }

  /**
   * Run tests with intelligent orchestration
   */
  async runTests(options = {}) {
    console.log(chalk.cyan('🧪 Running optimized test suite...'));

    if (this.testRegistry.size === 0) {
      await this.discoverTests();
    }

    const executionPlan = await this.createExecutionPlan(options);
    const results = await this.executePlan(executionPlan);

    await this.generateResultsReport(results);
    return results;
  }

  /**
   * Create intelligent execution plan
   */
  async createExecutionPlan(options) {
    console.log(chalk.cyan('📋 Creating execution plan...'));

    const planner = new ExecutionPlanner(this.testRegistry, this.dependencyGraph, this.config);
    const plan = await planner.createPlan(options);

    console.log(chalk.green(`✅ Created execution plan with ${plan.phases.length} phases`));

    if (this.options.verbose) {
      console.log(chalk.white('Execution plan:'));
      plan.phases.forEach((phase, index) => {
        console.log(`  Phase ${index + 1}: ${phase.tests.length} tests (${phase.type})`);
      });
    }

    return plan;
  }

  /**
   * Execute test plan
   */
  async executePlan(plan) {
    const executor = new TestExecutor(this.resourcePool, this.options);
    const results = [];

    for (const [phaseIndex, phase] of plan.phases.entries()) {
      console.log(chalk.blue(`\n🔄 Executing Phase ${phaseIndex + 1}: ${phase.type} (${phase.tests.length} tests)`));

      const phaseResults = await executor.executePhase(phase);
      results.push(...phaseResults);

      // Check if phase failed and should stop
      if (phaseResults.some(r => r.status === 'failed' && r.critical)) {
        console.log(chalk.red('⛔ Critical test failure detected, stopping execution'));
        break;
      }
    }

    return results;
  }

  /**
   * Generate results report
   */
  async generateResultsReport(results) {
    console.log(chalk.cyan('\n📊 Generating results report...'));

    const reporter = new TestReporter(this.config.reporting);
    const report = await reporter.generateReport(results);

    console.log(chalk.green(`✅ Report generated: ${report.summary}`));

    // Print summary
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    console.log(chalk.white('\n📈 Execution Summary:'));
    console.log(chalk.green(`  ✅ Passed: ${passed}`));
    if (failed > 0) console.log(chalk.red(`  ❌ Failed: ${failed}`));
    if (skipped > 0) console.log(chalk.yellow(`  ⏭️  Skipped: ${skipped}`));

    const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
    console.log(chalk.white(`  ⏱️  Total time: ${(totalTime / 1000).toFixed(2)}s`));

    return report;
  }

  /**
   * Run full orchestration cycle
   */
  async runFullOrchestration() {
    console.log(chalk.cyan('🎯 Running full test orchestration cycle...'));

    await this.discoverTests();
    const results = await this.runTests();
    await this.optimizeSuite(results);
    await this.generateReports(results);

    return results;
  }

  /**
   * Optimize test suite based on results
   */
  async optimizeSuite(results = []) {
    console.log(chalk.cyan('⚡ Analyzing performance and suggesting optimizations...'));

    const optimizer = new TestOptimizer(this.testRegistry, results, this.config);
    const optimizations = await optimizer.analyzeAndSuggest();

    if (optimizations.length > 0) {
      console.log(chalk.white('\n💡 Optimization Suggestions:'));
      optimizations.forEach((opt, index) => {
        const color = opt.priority === 'high' ? chalk.red :
                     opt.priority === 'medium' ? chalk.yellow : chalk.blue;
        console.log(color(`  ${index + 1}. [${opt.priority.toUpperCase()}] ${opt.message}`));
      });
    } else {
      console.log(chalk.green('✅ No major optimizations needed'));
    }

    return optimizations;
  }

  /**
   * Generate comprehensive reports
   */
  async generateReports(results = []) {
    console.log(chalk.cyan('📋 Generating comprehensive reports...'));

    if (results.length === 0) {
      // Get latest results from cache or run tests
      results = await this.runTests();
    }

    const reporter = new TestReporter(this.config.reporting);
    await reporter.generateAllReports(results, this.testRegistry, this.metrics);

    console.log(chalk.green('✅ All reports generated successfully'));
  }

  /**
   * Monitor test performance
   */
  async monitorTests() {
    console.log(chalk.cyan('📊 Monitoring test performance...'));

    const monitor = new TestMonitor(this.metrics);
    await monitor.startMonitoring();

    console.log(chalk.green('✅ Test monitoring started'));
    return monitor;
  }
}

// Export orchestrator
module.exports = TestOrchestrator;

// CLI interface
if (require.main === module) {
  const [command, ...args] = process.argv.slice(2);

  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    parallel: !args.includes('--no-parallel'),
    coverage: !args.includes('--no-coverage'),
    maxWorkers: parseInt(args.find(arg => arg.startsWith('--max-workers='))?.split('=')[1]) || undefined
  };

  const orchestrator = new TestOrchestrator(options);
  orchestrator.run(command, options).catch(console.error);
}