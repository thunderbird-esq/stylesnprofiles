/**
 * Test Monitoring and Analytics System
 *
 * Provides comprehensive monitoring, metrics collection,
 * and performance analytics for test execution
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class TestMonitor extends EventEmitter {
  constructor(metrics) {
    super();
    this.metrics = metrics || new TestMetrics();
    this.alerts = new AlertSystem();
    this.analyzer = new PerformanceAnalyzer();
    this.dashboard = new MonitoringDashboard();
    this.recorders = new Map();

    this.setupEventHandlers();
  }

  /**
   * Start monitoring test execution
   */
  async startMonitoring() {
    console.log(chalk.cyan('📊 Starting test monitoring...'));

    // Initialize all monitoring components
    await this.alerts.initialize();
    await this.analyzer.initialize();
    await this.dashboard.initialize();

    this.emit('monitoring-started');

    console.log(chalk.green('✅ Test monitoring started'));
  }

  /**
   * Setup event handlers for monitoring
   */
  setupEventHandlers() {
    // Handle test completion events
    this.on('test-completed', (data) => {
      this.recordTestCompletion(data.test);
      this.analyzer.analyzeTestResult(data.test);
      this.checkAlerts(data);
    });

    // Handle phase completion events
    this.on('phase-completed', (data) => {
      this.recordPhaseCompletion(data);
      this.analyzer.analyzePhaseResults(data);
    });

    // Handle resource events
    this.on('resource-warning', (warning) => {
      this.alerts.checkResourceAlert(warning);
    });

    // Handle performance events
    this.on('performance-issue', (issue) => {
      this.alerts.checkPerformanceAlert(issue);
    });
  }

  /**
   * Record test completion
   */
  recordTestCompletion(testResult) {
    this.metrics.recordTest(testResult);

    // Update dashboard
    this.dashboard.updateTestMetrics(testResult);

    // Log to file
    this.logTestResult(testResult);
  }

  /**
   * Record phase completion
   */
  recordPhaseCompletion(phaseData) {
    this.metrics.recordPhase(phaseData);

    // Update dashboard
    this.dashboard.updatePhaseMetrics(phaseData);

    // Log to file
    this.logPhaseResult(phaseData);
  }

  /**
   * Check for alerts
   */
  checkAlerts(data) {
    const test = data.test;

    // Slow test alert
    if (test.duration > 10000) {
      this.alerts.trigger({
        type: 'slow-test',
        severity: 'warning',
        message: `Slow test detected: ${test.id} (${test.duration}ms)`,
        data: { testId: test.id, duration: test.duration }
      });
    }

    // Failed test alert
    if (test.status === 'failed') {
      this.alerts.trigger({
        type: 'test-failure',
        severity: 'error',
        message: `Test failed: ${test.id}`,
        data: { testId: test.id, error: test.error }
      });
    }

    // Memory usage alert
    if (test.metrics && test.metrics.memory) {
      const memoryMB = test.metrics.memory.used / 1024 / 1024;
      if (memoryMB > 100) {
        this.alerts.trigger({
          type: 'high-memory',
          severity: 'warning',
          message: `High memory usage in test: ${test.id} (${memoryMB.toFixed(1)}MB)`,
          data: { testId: test.id, memoryUsage: memoryMB }
        });
      }
    }
  }

  /**
   * Log test result to file
   */
  logTestResult(testResult) {
    const logFile = path.join(process.cwd(), 'test-results', 'test-execution.log');
    const logEntry = {
      timestamp: new Date().toISOString(),
      testId: testResult.test.id,
      testType: testResult.test.type,
      status: testResult.status,
      duration: testResult.duration,
      error: testResult.error,
      memory: testResult.metrics?.memory
    };

    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  /**
   * Log phase result to file
   */
  logPhaseResult(phaseData) {
    const logFile = path.join(process.cwd(), 'test-results', 'phase-execution.log');
    const logEntry = {
      timestamp: new Date().toISOString(),
      phaseType: phaseData.type,
      phaseName: phaseData.name,
      testsCount: phaseData.tests.length,
      duration: phaseData.duration,
      passed: phaseData.results?.filter(r => r.status === 'passed').length || 0,
      failed: phaseData.results?.filter(r => r.status === 'failed').length || 0
    };

    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  /**
   * Generate monitoring report
   */
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.metrics.getSummary(),
      alerts: this.alerts.getActiveAlerts(),
      performance: this.analyzer.getPerformanceAnalysis(),
      trends: this.analyzer.getTrends(),
      recommendations: this.analyzer.getRecommendations()
    };

    // Save report to file
    const reportFile = path.join(process.cwd(), 'test-results', 'monitoring-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    return report;
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring() {
    console.log(chalk.cyan('🛑 Stopping test monitoring...'));

    // Generate final report
    await this.generateReport();

    // Shutdown components
    await this.alerts.shutdown();
    await this.analyzer.shutdown();
    await this.dashboard.shutdown();

    this.emit('monitoring-stopped');

    console.log(chalk.green('✅ Test monitoring stopped'));
  }
}

/**
 * Test Metrics Collection
 */
class TestMetrics {
  constructor() {
    this.testResults = [];
    this.phaseResults = [];
    this.sessionStart = performance.now();
    this.aggregatedMetrics = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0,
      averageTestTime: 0,
      memoryUsage: []
    };
  }

  recordTest(testResult) {
    this.testResults.push({
      ...testResult,
      timestamp: performance.now() - this.sessionStart
    });

    this.updateAggregatedMetrics();
  }

  recordPhase(phaseData) {
    this.phaseResults.push({
      ...phaseData,
      timestamp: performance.now() - this.sessionStart
    });
  }

  updateAggregatedMetrics() {
    this.aggregatedMetrics.totalTests = this.testResults.length;
    this.aggregatedMetrics.passedTests = this.testResults.filter(r => r.status === 'passed').length;
    this.aggregatedMetrics.failedTests = this.testResults.filter(r => r.status === 'failed').length;
    this.aggregatedMetrics.totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    if (this.testResults.length > 0) {
      this.aggregatedMetrics.averageTestTime = this.aggregatedMetrics.totalDuration / this.testResults.length;
    }
  }

  getSummary() {
    const successRate = this.aggregatedMetrics.totalTests > 0 ?
      (this.aggregatedMetrics.passedTests / this.aggregatedMetrics.totalTests * 100) : 0;

    return {
      ...this.aggregatedMetrics,
      successRate,
      sessionDuration: performance.now() - this.sessionStart,
      testCountByType: this.getTestCountByType(),
      slowTests: this.getSlowTests(),
      failedTests: this.getFailedTests()
    };
  }

  getTestCountByType() {
    const counts = {};
    this.testResults.forEach(result => {
      const type = result.test.type;
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }

  getSlowTests() {
    return this.testResults
      .filter(r => r.duration > 5000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  }

  getFailedTests() {
    return this.testResults
      .filter(r => r.status === 'failed')
      .map(r => ({
        testId: r.test.id,
        error: r.error,
        duration: r.duration
      }));
  }
}

/**
 * Alert System
 */
class AlertSystem {
  constructor() {
    this.alerts = [];
    this.alertRules = this.initializeAlertRules();
    this.notificationChannels = [];
  }

  async initialize() {
    // Setup notification channels
    this.setupNotificationChannels();
  }

  initializeAlertRules() {
    return {
      slowTest: { threshold: 10000, severity: 'warning' },
      testFailure: { threshold: 1, severity: 'error' },
      highMemory: { threshold: 100, severity: 'warning' },
      highFailureRate: { threshold: 0.1, severity: 'error' },
      resourceExhaustion: { threshold: 0.9, severity: 'critical' }
    };
  }

  setupNotificationChannels() {
    // Add notification channels as needed
    // e.g., Slack, email, etc.
  }

  trigger(alert) {
    const enrichedAlert = {
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      ...alert
    };

    this.alerts.push(enrichedAlert);
    this.notifyChannels(enrichedAlert);

    console.log(chalk.yellow(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`));
  }

  checkResourceAlert(warning) {
    this.trigger({
      type: 'resource-warning',
      severity: 'warning',
      message: `Resource warning: ${warning.type} usage at ${(warning.usage * 100).toFixed(1)}%`,
      data: warning
    });
  }

  checkPerformanceAlert(issue) {
    this.trigger({
      type: 'performance-issue',
      severity: 'warning',
      message: `Performance issue detected: ${issue.description}`,
      data: issue
    });
  }

  getActiveAlerts() {
    return this.alerts.filter(alert => !alert.resolved);
  }

  resolveAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
    }
  }

  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  notifyChannels(alert) {
    this.notificationChannels.forEach(channel => {
      try {
        channel.send(alert);
      } catch (error) {
        console.error(`Failed to send alert to channel:`, error);
      }
    });
  }

  async shutdown() {
    // Cleanup notification channels
    this.notificationChannels.forEach(channel => {
      if (channel.close) {
        channel.close();
      }
    });
  }
}

/**
 * Performance Analyzer
 */
class PerformanceAnalyzer {
  constructor() {
    this.performanceData = [];
    this.benchmarks = {};
    this.trends = [];
  }

  async initialize() {
    this.loadBenchmarks();
  }

  analyzeTestResult(testResult) {
    const analysis = {
      testId: testResult.test.id,
      timestamp: performance.now(),
      duration: testResult.duration,
      memoryUsage: testResult.metrics?.memory,
      performanceScore: this.calculatePerformanceScore(testResult),
      issues: this.detectPerformanceIssues(testResult)
    };

    this.performanceData.push(analysis);

    // Update benchmarks
    this.updateBenchmarks(testResult.test.type, analysis);

    return analysis;
  }

  analyzePhaseResults(phaseData) {
    const analysis = {
      phaseType: phaseData.type,
      timestamp: performance.now(),
      duration: phaseData.duration,
      testsCount: phaseData.tests.length,
      averageTestTime: phaseData.duration / phaseData.tests.length,
      parallelizationEfficiency: this.calculateParallelizationEfficiency(phaseData),
      issues: this.detectPhaseIssues(phaseData)
    };

    return analysis;
  }

  calculatePerformanceScore(testResult) {
    let score = 100;

    // Duration penalty
    if (testResult.duration > 5000) {
      score -= Math.min(30, (testResult.duration - 5000) / 100);
    }

    // Memory penalty
    if (testResult.metrics?.memory) {
      const memoryMB = testResult.metrics.memory.used / 1024 / 1024;
      if (memoryMB > 50) {
        score -= Math.min(20, (memoryMB - 50) / 5);
      }
    }

    // Failure penalty
    if (testResult.status === 'failed') {
      score -= 50;
    }

    return Math.max(0, score);
  }

  detectPerformanceIssues(testResult) {
    const issues = [];

    // Slow test
    if (testResult.duration > 10000) {
      issues.push({
        type: 'slow-test',
        severity: 'warning',
        description: `Test took ${testResult.duration}ms (threshold: 10000ms)`
      });
    }

    // High memory usage
    if (testResult.metrics?.memory) {
      const memoryMB = testResult.metrics.memory.used / 1024 / 1024;
      if (memoryMB > 100) {
        issues.push({
          type: 'high-memory',
          severity: 'warning',
          description: `Test used ${memoryMB.toFixed(1)}MB memory`
        });
      }
    }

    // Test timeout
    if (testResult.error?.includes('timeout')) {
      issues.push({
        type: 'timeout',
        severity: 'error',
        description: 'Test timed out'
      });
    }

    return issues;
  }

  calculateParallelizationEfficiency(phaseData) {
    // Calculate how efficiently tests were run in parallel
    const totalTime = phaseData.duration;
    const estimatedSerialTime = phaseData.tests.reduce((sum, test) => sum + (test.estimatedTime || 1000), 0);

    if (estimatedSerialTime === 0) return 1;

    return Math.min(1, estimatedSerialTime / totalTime);
  }

  detectPhaseIssues(phaseData) {
    const issues = [];

    // Low parallelization efficiency
    const efficiency = this.calculateParallelizationEfficiency(phaseData);
    if (efficiency < 0.5) {
      issues.push({
        type: 'low-parallelization',
        severity: 'warning',
        description: `Low parallelization efficiency: ${(efficiency * 100).toFixed(1)}%`
      });
    }

    // High failure rate
    const failureRate = phaseData.results?.filter(r => r.status === 'failed').length / phaseData.tests.length || 0;
    if (failureRate > 0.1) {
      issues.push({
        type: 'high-failure-rate',
        severity: 'error',
        description: `High failure rate: ${(failureRate * 100).toFixed(1)}%`
      });
    }

    return issues;
  }

  updateBenchmarks(testType, analysis) {
    if (!this.benchmarks[testType]) {
      this.benchmarks[testType] = {
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        sampleCount: 0
      };
    }

    const benchmark = this.benchmarks[testType];
    benchmark.sampleCount++;

    // Update average duration
    benchmark.averageDuration = (benchmark.averageDuration * (benchmark.sampleCount - 1) + analysis.duration) / benchmark.sampleCount;

    // Update min/max
    benchmark.minDuration = Math.min(benchmark.minDuration, analysis.duration);
    benchmark.maxDuration = Math.max(benchmark.maxDuration, analysis.duration);
  }

  getPerformanceAnalysis() {
    return {
      benchmarks: this.benchmarks,
      recentPerformance: this.performanceData.slice(-20),
      overallStats: this.calculateOverallStats()
    };
  }

  calculateOverallStats() {
    if (this.performanceData.length === 0) {
      return null;
    }

    const durations = this.performanceData.map(d => d.duration);
    const scores = this.performanceData.map(d => d.performanceScore);

    return {
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      medianDuration: this.median(durations),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      averageScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      sampleSize: this.performanceData.length
    };
  }

  getTrends() {
    // Calculate performance trends over time
    return this.calculateTrends();
  }

  getRecommendations() {
    const recommendations = [];

    // Analyze patterns and suggest optimizations
    const stats = this.calculateOverallStats();
    if (stats) {
      if (stats.averageDuration > 5000) {
        recommendations.push({
          type: 'optimization',
          priority: 'high',
          description: 'Consider optimizing slow tests - average duration is high',
          action: 'Review test implementation and optimize test data setup'
        });
      }

      if (stats.averageScore < 70) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          description: 'Overall test performance score could be improved',
          action: 'Investigate slow tests and high memory usage'
        });
      }
    }

    return recommendations;
  }

  median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ?
      (sorted[mid - 1] + sorted[mid]) / 2 :
      sorted[mid];
  }

  calculateTrends() {
    // Simplified trend calculation
    const recentData = this.performanceData.slice(-10);
    if (recentData.length < 5) {
      return { trend: 'insufficient_data' };
    }

    const firstHalf = recentData.slice(0, Math.floor(recentData.length / 2));
    const secondHalf = recentData.slice(Math.floor(recentData.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.duration, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.duration, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(change) < 5) {
      return { trend: 'stable', change: change.toFixed(1) };
    } else if (change > 0) {
      return { trend: 'degrading', change: change.toFixed(1) };
    } else {
      return { trend: 'improving', change: change.toFixed(1) };
    }
  }

  loadBenchmarks() {
    // Load historical benchmarks from file
    const benchmarkFile = path.join(process.cwd(), 'test-results', 'benchmarks.json');
    if (fs.existsSync(benchmarkFile)) {
      try {
        this.benchmarks = JSON.parse(fs.readFileSync(benchmarkFile, 'utf8'));
      } catch (error) {
        console.warn('Could not load benchmarks:', error.message);
      }
    }
  }

  saveBenchmarks() {
    const benchmarkFile = path.join(process.cwd(), 'test-results', 'benchmarks.json');
    fs.writeFileSync(benchmarkFile, JSON.stringify(this.benchmarks, null, 2));
  }

  async shutdown() {
    this.saveBenchmarks();
  }
}

/**
 * Monitoring Dashboard
 */
class MonitoringDashboard {
  constructor() {
    this.metrics = {};
    this.realtimeData = [];
  }

  async initialize() {
    // Initialize dashboard data structures
    console.log('📊 Initializing monitoring dashboard...');
  }

  updateTestMetrics(testResult) {
    // Update real-time dashboard data
    this.realtimeData.push({
      timestamp: Date.now(),
      type: 'test',
      data: {
        testId: testResult.test.id,
        status: testResult.status,
        duration: testResult.duration,
        type: testResult.test.type
      }
    });

    // Keep data size bounded
    if (this.realtimeData.length > 1000) {
      this.realtimeData = this.realtimeData.slice(-500);
    }
  }

  updatePhaseMetrics(phaseData) {
    this.realtimeData.push({
      timestamp: Date.now(),
      type: 'phase',
      data: {
        phaseType: phaseData.type,
        testsCount: phaseData.tests.length,
        duration: phaseData.duration
      }
    });
  }

  getDashboardData() {
    return {
      realtime: this.realtimeData.slice(-100),
      summary: this.calculateDashboardSummary()
    };
  }

  calculateDashboardSummary() {
    const recentTests = this.realtimeData
      .filter(d => d.type === 'test')
      .slice(-50);

    const passed = recentTests.filter(d => d.data.status === 'passed').length;
    const failed = recentTests.filter(d => d.data.status === 'failed').length;
    const avgDuration = recentTests.reduce((sum, d) => sum + d.data.duration, 0) / recentTests.length;

    return {
      recentTests: recentTests.length,
      passRate: recentTests.length > 0 ? (passed / recentTests.length * 100).toFixed(1) : 0,
      averageDuration: Math.round(avgDuration),
      activePhases: this.realtimeData.filter(d => d.type === 'phase').length
    };
  }

  async shutdown() {
    console.log('📊 Shutting down monitoring dashboard...');
  }
}

module.exports = {
  TestMonitor,
  TestMetrics,
  AlertSystem,
  PerformanceAnalyzer,
  MonitoringDashboard
};