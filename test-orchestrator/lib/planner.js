/**
 * Test Execution Planner - Intelligent Test Scheduling and Optimization
 *
 * Creates optimized execution plans considering:
 * - Test dependencies and ordering
 * - Resource allocation and constraints
 * - Parallel execution strategies
 * - Performance optimization
 */

const EventEmitter = require('events');
const chalk = require('chalk');

class ExecutionPlanner extends EventEmitter {
  constructor(testRegistry, dependencyGraph, config) {
    super();
    this.testRegistry = testRegistry;
    this.dependencyGraph = dependencyGraph;
    this.config = config;

    this.executionStrategies = {
      fastFeedback: this.createFastFeedbackPlan.bind(this),
      comprehensive: this.createComprehensivePlan.bind(this),
      smokeTest: this.createSmokeTestPlan.bind(this),
      performance: this.createPerformancePlan.bind(this),
      smartSelection: this.createSmartSelectionPlan.bind(this)
    };
  }

  /**
   * Create optimized execution plan
   */
  async createPlan(options = {}) {
    const strategy = options.strategy || this.config.execution.defaults.strategy;
    const customFilters = options.filters || [];

    console.log(chalk.cyan(`📋 Creating execution plan with strategy: ${strategy}`));

    // Get tests matching filters
    const filteredTests = this.filterTests(customFilters);

    if (filteredTests.length === 0) {
      console.log(chalk.yellow('⚠️  No tests match the specified filters'));
      return { phases: [], summary: { totalTests: 0, estimatedDuration: 0 } };
    }

    // Create plan using selected strategy
    const planFunction = this.executionStrategies[strategy];
    if (!planFunction) {
      throw new Error(`Unknown execution strategy: ${strategy}`);
    }

    const plan = await planFunction(filteredTests, options);

    // Optimize plan further
    this.optimizePlan(plan);

    // Generate plan summary
    plan.summary = this.generatePlanSummary(plan);

    this.emit('plan-created', plan);

    return plan;
  }

  /**
   * Filter tests based on criteria
   */
  filterTests(filters) {
    let tests = Array.from(this.testRegistry.values());

    for (const filter of filters) {
      tests = tests.filter(test => this.matchesFilter(test, filter));
    }

    return tests;
  }

  /**
   * Check if test matches filter
   */
  matchesFilter(test, filter) {
    if (typeof filter === 'string') {
      // Simple string filter (test type)
      return test.type === filter;
    }

    if (typeof filter === 'object') {
      // Advanced filter object
      if (filter.type && test.type !== filter.type) return false;
      if (filter.pattern && !test.relativePath.includes(filter.pattern)) return false;
      if (filter.tags && !filter.tags.every(tag => test.tags?.includes(tag))) return false;
      if (filter.maxDuration && test.estimatedTime > filter.maxDuration) return false;
      return true;
    }

    return true;
  }

  /**
   * Create fast feedback execution plan
   */
  async createFastFeedbackPlan(tests, options) {
    console.log(chalk.blue('🏃 Creating fast feedback plan...'));

    const phases = [];

    // Phase 1: Unit tests (fastest feedback)
    const unitTests = tests.filter(t => t.type === 'UNIT');
    if (unitTests.length > 0) {
      phases.push({
        name: 'Unit Tests',
        type: 'unit',
        tests: unitTests,
        priority: 1,
        parallel: true,
        continueOnFailure: false,
        estimatedDuration: this.estimatePhaseDuration(unitTests)
      });
    }

    // Phase 2: Integration tests
    const integrationTests = tests.filter(t => t.type === 'INTEGRATION' || t.type === 'API');
    if (integrationTests.length > 0) {
      phases.push({
        name: 'Integration Tests',
        type: 'integration',
        tests: integrationTests,
        priority: 2,
        parallel: true,
        continueOnFailure: true,
        estimatedDuration: this.estimatePhaseDuration(integrationTests)
      });
    }

    // Phase 3: E2E tests (slowest)
    const e2eTests = tests.filter(t => t.type === 'E2E');
    if (e2eTests.length > 0) {
      phases.push({
        name: 'E2E Tests',
        type: 'e2e',
        tests: e2eTests,
        priority: 3,
        parallel: false,
        continueOnFailure: true,
        estimatedDuration: this.estimatePhaseDuration(e2eTests)
      });
    }

    return { phases, strategy: 'fastFeedback' };
  }

  /**
   * Create comprehensive execution plan
   */
  async createComprehensivePlan(tests, options) {
    console.log(chalk.blue('🔍 Creating comprehensive plan...'));

    const phases = [];

    // Phase 1: Database setup (dependencies)
    const dbTests = tests.filter(t => t.type === 'DATABASE');
    if (dbTests.length > 0) {
      phases.push({
        name: 'Database Setup',
        type: 'database',
        tests: dbTests,
        priority: 1,
        parallel: false,
        continueOnFailure: false,
        estimatedDuration: this.estimatePhaseDuration(dbTests)
      });
    }

    // Phase 2: API server setup
    const apiTests = tests.filter(t => t.type === 'API');
    if (apiTests.length > 0) {
      phases.push({
        name: 'API Tests',
        type: 'api',
        tests: apiTests,
        priority: 2,
        parallel: true,
        continueOnFailure: false,
        estimatedDuration: this.estimatePhaseDuration(apiTests)
      });
    }

    // Phase 3: Unit tests
    const unitTests = tests.filter(t => t.type === 'UNIT');
    if (unitTests.length > 0) {
      phases.push({
        name: 'Unit Tests',
        type: 'unit',
        tests: unitTests,
        priority: 3,
        parallel: true,
        continueOnFailure: false,
        estimatedDuration: this.estimatePhaseDuration(unitTests)
      });
    }

    // Phase 4: Integration tests
    const integrationTests = tests.filter(t => t.type === 'INTEGRATION');
    if (integrationTests.length > 0) {
      phases.push({
        name: 'Integration Tests',
        type: 'integration',
        tests: integrationTests,
        priority: 4,
        parallel: true,
        continueOnFailure: true,
        estimatedDuration: this.estimatePhaseDuration(integrationTests)
      });
    }

    // Phase 5: E2E tests
    const e2eTests = tests.filter(t => t.type === 'E2E');
    if (e2eTests.length > 0) {
      phases.push({
        name: 'E2E Tests',
        type: 'e2e',
        tests: e2eTests,
        priority: 5,
        parallel: false,
        continueOnFailure: true,
        estimatedDuration: this.estimatePhaseDuration(e2eTests)
      });
    }

    // Phase 6: Performance tests
    const perfTests = tests.filter(t => t.type === 'PERFORMANCE');
    if (perfTests.length > 0) {
      phases.push({
        name: 'Performance Tests',
        type: 'performance',
        tests: perfTests,
        priority: 6,
        parallel: false,
        continueOnFailure: true,
        estimatedDuration: this.estimatePhaseDuration(perfTests)
      });
    }

    return { phases, strategy: 'comprehensive' };
  }

  /**
   * Create smoke test execution plan
   */
  async createSmokeTestPlan(tests, options) {
    console.log(chalk.blue('💨 Creating smoke test plan...'));

    const phases = [];

    // Select critical tests only
    const criticalTests = tests.filter(test =>
      this.isCriticalTest(test) ||
      test.file.includes('server.test.js') ||
      test.file.includes('db.test.js')
    );

    if (criticalTests.length > 0) {
      phases.push({
        name: 'Critical Tests',
        type: 'smoke',
        tests: criticalTests,
        priority: 1,
        parallel: true,
        continueOnFailure: false,
        estimatedDuration: this.estimatePhaseDuration(criticalTests)
      });
    }

    return { phases, strategy: 'smokeTest' };
  }

  /**
   * Create performance-focused execution plan
   */
  async createPerformancePlan(tests, options) {
    console.log(chalk.blue('⚡ Creating performance plan...'));

    const phases = [];

    // Phase 1: Quick unit tests (should be fast)
    const unitTests = tests.filter(t => t.type === 'UNIT' && t.estimatedTime < 1000);
    if (unitTests.length > 0) {
      phases.push({
        name: 'Quick Unit Tests',
        type: 'unit',
        tests: unitTests,
        priority: 1,
        parallel: true,
        continueOnFailure: true,
        estimatedDuration: this.estimatePhaseDuration(unitTests)
      });
    }

    // Phase 2: Performance tests
    const perfTests = tests.filter(t => t.type === 'PERFORMANCE');
    if (perfTests.length > 0) {
      phases.push({
        name: 'Performance Tests',
        type: 'performance',
        tests: perfTests,
        priority: 2,
        parallel: false,
        continueOnFailure: false,
        estimatedDuration: this.estimatePhaseDuration(perfTests)
      });
    }

    return { phases, strategy: 'performance' };
  }

  /**
   * Create smart selection execution plan
   */
  async createSmartSelectionPlan(tests, options) {
    console.log(chalk.blue('🧠 Creating smart selection plan...'));

    // Analyze test history and code changes to select relevant tests
    const selectedTests = await this.selectRelevantTests(tests, options);

    return this.createFastFeedbackPlan(selectedTests, options);
  }

  /**
   * Select relevant tests based on code changes and history
   */
  async selectRelevantTests(tests, options) {
    const changedFiles = options.changedFiles || [];
    const selectedTests = [];

    for (const test of tests) {
      if (this.shouldRunTest(test, changedFiles)) {
        selectedTests.push(test);
      }
    }

    console.log(chalk.cyan(`🎯 Smart selection: ${selectedTests.length}/${tests.length} tests selected`));

    return selectedTests;
  }

  /**
   * Determine if a test should run based on changes
   */
  shouldRunTest(test, changedFiles) {
    // Always run critical tests
    if (this.isCriticalTest(test)) {
      return true;
    }

    // Check if test file was changed
    if (changedFiles.includes(test.relativePath)) {
      return true;
    }

    // Check if related source files were changed
    for (const changedFile of changedFiles) {
      if (this.isFileRelated(test, changedFile)) {
        return true;
      }
    }

    // Run some percentage of tests to catch regressions
    return Math.random() < 0.2; // 20% random selection
  }

  /**
   * Check if a file is related to a test
   */
  isFileRelated(test, changedFile) {
    const testDir = path.dirname(test.relativePath);
    const changedDir = path.dirname(changedFile);

    // Same directory
    if (testDir === changedDir) {
      return true;
    }

    // Client-server relationship
    if (testDir.startsWith('client/') && changedDir.startsWith('client/')) {
      return true;
    }
    if (testDir.startsWith('server/') && changedDir.startsWith('server/')) {
      return true;
    }

    return false;
  }

  /**
   * Check if test is critical
   */
  isCriticalTest(test) {
    const criticalPatterns = [
      'server.test.js',
      'db.test.js',
      'apiProxy.test.js',
      'Window.test.js',
      'Desktop.test.js'
    ];

    return criticalPatterns.some(pattern => test.file.includes(pattern));
  }

  /**
   * Estimate phase execution duration
   */
  estimatePhaseDuration(tests) {
    const baseTime = tests.reduce((sum, test) => sum + (test.estimatedTime || 1000), 0);

    // Add overhead for parallel execution setup
    const overhead = 1000;

    // Account for parallel execution (faster than serial sum)
    const parallelFactor = Math.max(0.3, 1 - (tests.length * 0.05));

    return Math.ceil(baseTime * parallelFactor + overhead);
  }

  /**
   * Optimize execution plan
   */
  optimizePlan(plan) {
    console.log(chalk.blue('⚡ Optimizing execution plan...'));

    // Optimize phase order based on dependencies
    this.orderPhasesByDependencies(plan.phases);

    // Merge small phases of same type
    this.mergeSmallPhases(plan.phases);

    // Optimize test ordering within phases
    plan.phases.forEach(phase => this.optimizePhase(phase));

    console.log(chalk.green('✅ Plan optimization complete'));
  }

  /**
   * Order phases by dependencies
   */
  orderPhasesByDependencies(phases) {
    const dependencyOrder = ['database', 'api', 'unit', 'integration', 'e2e', 'performance'];

    phases.sort((a, b) => {
      const aIndex = dependencyOrder.indexOf(a.type);
      const bIndex = dependencyOrder.indexOf(b.type);

      // If types not in order list, use priority
      if (aIndex === -1 && bIndex === -1) {
        return a.priority - b.priority;
      }

      return aIndex - bIndex;
    });
  }

  /**
   * Merge small phases of same type
   */
  mergeSmallPhases(phases) {
    const merged = [];
    const typeGroups = {};

    // Group phases by type
    phases.forEach(phase => {
      if (!typeGroups[phase.type]) {
        typeGroups[phase.type] = [];
      }
      typeGroups[phase.type].push(phase);
    });

    // Merge phases
    Object.entries(typeGroups).forEach(([type, group]) => {
      if (group.length === 1) {
        merged.push(group[0]);
      } else {
        // Merge multiple phases of same type
        const mergedPhase = {
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Tests`,
          type: type,
          tests: group.flatMap(p => p.tests),
          priority: Math.min(...group.map(p => p.priority)),
          parallel: group.every(p => p.parallel),
          continueOnFailure: group.every(p => p.continueOnFailure),
          estimatedDuration: group.reduce((sum, p) => sum + p.estimatedDuration, 0)
        };
        merged.push(mergedPhase);
      }
    });

    phases.length = 0;
    phases.push(...merged);
  }

  /**
   * Optimize individual phase
   */
  optimizePhase(phase) {
    // Sort tests by estimated duration (longest first for better parallelism)
    phase.tests.sort((a, b) => (b.estimatedTime || 0) - (a.estimatedTime || 0));

    // Group tests by dependencies within phase
    phase.testGroups = this.groupTestsByDependencies(phase.tests);
  }

  /**
   * Group tests by dependencies within a phase
   */
  groupTestsByDependencies(tests) {
    const groups = [];
    const processed = new Set();

    tests.forEach(test => {
      if (processed.has(test.id)) return;

      const group = [test];
      processed.add(test.id);

      // Find dependent tests
      const dependencies = this.dependencyGraph.get(test.id) || [];
      dependencies.forEach(depId => {
        const depTest = tests.find(t => t.id === depId);
        if (depTest && !processed.has(depId)) {
          group.push(depTest);
          processed.add(depId);
        }
      });

      groups.push(group);
    });

    return groups;
  }

  /**
   * Generate plan summary
   */
  generatePlanSummary(plan) {
    const totalTests = plan.phases.reduce((sum, phase) => sum + phase.tests.length, 0);
    const totalDuration = plan.phases.reduce((sum, phase) => sum + (phase.estimatedDuration || 0), 0);

    const testTypeSummary = {};
    plan.phases.forEach(phase => {
      testTypeSummary[phase.type] = (testTypeSummary[phase.type] || 0) + phase.tests.length;
    });

    return {
      totalTests,
      totalDuration: Math.ceil(totalDuration / 1000),
      phases: plan.phases.length,
      testTypes: Object.keys(testTypeSummary),
      strategy: plan.strategy,
      parallelPhases: plan.phases.filter(p => p.parallel).length
    };
  }
}

module.exports = ExecutionPlanner;