/**
 * Test Reporter - Comprehensive Test Reporting and Analytics
 *
 * Generates detailed reports including:
 * - HTML interactive reports
 * - JSON structured data
 * - JUnit XML for CI/CD
 * - Markdown summaries
 * - Performance analysis
 * - Coverage reports
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class TestReporter {
  constructor(config = {}) {
    this.config = {
      outputDir: config.outputDir || 'test-results',
      formats: config.formats || ['json', 'html', 'junit'],
      includeCoverage: config.includeCoverage !== false,
      includePerformance: config.includePerformance !== false,
      ...config
    };

    this.ensureOutputDirectory();
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport(testResults, options = {}) {
    console.log(chalk.cyan('📋 Generating comprehensive test reports...'));

    const reportData = await this.prepareReportData(testResults, options);

    const reports = [];

    // Generate reports in requested formats
    for (const format of this.config.formats) {
      try {
        const report = await this.generateReportFormat(reportData, format);
        reports.push({ format, report });
        console.log(chalk.green(`  ✅ ${format.toUpperCase()} report generated`));
      } catch (error) {
        console.error(chalk.red(`  ❌ Failed to generate ${format} report: ${error.message}`));
      }
    }

    // Generate additional reports if enabled
    if (this.config.includeCoverage) {
      await this.generateCoverageReport();
    }

    if (this.config.includePerformance) {
      await this.generatePerformanceReport(testResults);
    }

    // Generate summary index
    await this.generateReportIndex(reports);

    console.log(chalk.green(`✅ All reports generated in ${this.config.outputDir}/`));

    return { reports, summary: reportData.summary };
  }

  /**
   * Prepare comprehensive report data
   */
  async prepareReportData(testResults, options = {}) {
    const timestamp = new Date().toISOString();

    // Calculate summary statistics
    const summary = this.calculateSummary(testResults);

    // Group tests by type
    const testsByType = this.groupTestsByType(testResults);

    // Analyze failures
    const failureAnalysis = this.analyzeFailures(testResults);

    // Performance analysis
    const performanceAnalysis = this.analyzePerformance(testResults);

    // Coverage analysis
    const coverageAnalysis = this.config.includeCoverage ? await this.analyzeCoverage() : null;

    // Trend analysis
    const trendAnalysis = await this.analyzeTrends();

    return {
      metadata: {
        timestamp,
        orchestrator: 'NASA System 6 Portal Test Orchestrator v1.0.0',
        environment: process.env.NODE_ENV || 'development',
        platform: process.platform,
        nodeVersion: process.version
      },
      summary,
      testsByType,
      testResults,
      failureAnalysis,
      performanceAnalysis,
      coverageAnalysis,
      trendAnalysis,
      options
    };
  }

  /**
   * Calculate test summary statistics
   */
  calculateSummary(testResults) {
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.status === 'passed').length;
    const failedTests = testResults.filter(r => r.status === 'failed').length;
    const skippedTests = testResults.filter(r => r.status === 'skipped').length;

    const totalDuration = testResults.reduce((sum, r) => sum + (r.duration || 0), 0);
    const averageDuration = totalTests > 0 ? totalDuration / totalTests : 0;

    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // Test type breakdown
    const typeBreakdown = {};
    testResults.forEach(result => {
      const type = result.test?.type || 'unknown';
      typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
    });

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      successRate,
      totalDuration,
      averageDuration,
      typeBreakdown,
      executionTime: performance.now()
    };
  }

  /**
   * Group tests by type
   */
  groupTestsByType(testResults) {
    const grouped = {};

    testResults.forEach(result => {
      const type = result.test?.type || 'unknown';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(result);
    });

    // Calculate statistics for each type
    Object.keys(grouped).forEach(type => {
      const typeTests = grouped[type];
      const passed = typeTests.filter(t => t.status === 'passed').length;
      const failed = typeTests.filter(t => t.status === 'failed').length;
      const duration = typeTests.reduce((sum, t) => sum + t.duration, 0);

      grouped[type] = {
        tests: typeTests,
        statistics: {
          total: typeTests.length,
          passed,
          failed,
          successRate: (passed / typeTests.length) * 100,
          totalDuration: duration,
          averageDuration: duration / typeTests.length
        }
      };
    });

    return grouped;
  }

  /**
   * Analyze test failures
   */
  analyzeFailures(testResults) {
    const failures = testResults.filter(r => r.status === 'failed');

    // Categorize failures by error type
    const errorCategories = {};
    failures.forEach(failure => {
      const category = this.categorizeError(failure.error);
      if (!errorCategories[category]) {
        errorCategories[category] = [];
      }
      errorCategories[category].push(failure);
    });

    // Find most common errors
    const commonErrors = failures
      .reduce((acc, failure) => {
        const key = failure.error?.substring(0, 100) || 'Unknown error';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

    const sortedCommonErrors = Object.entries(commonErrors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));

    return {
      totalFailures: failures.length,
      failureRate: (failures.length / testResults.length) * 100,
      errorCategories,
      commonErrors: sortedCommonErrors,
      criticalFailures: failures.filter(f => f.critical).length
    };
  }

  /**
   * Categorize test errors
   */
  categorizeError(error) {
    if (!error) return 'unknown';

    const lowerError = error.toLowerCase();

    if (lowerError.includes('timeout')) return 'timeout';
    if (lowerError.includes('connection') || lowerError.includes('econnrefused')) return 'connection';
    if (lowerError.includes('assertion') || lowerError.includes('expect')) return 'assertion';
    if (lowerError.includes('type') || lowerError.includes('undefined')) return 'type';
    if (lowerError.includes('network') || lowerError.includes('fetch')) return 'network';
    if (lowerError.includes('database') || lowerError.includes('sql')) return 'database';
    if (lowerError.includes('syntax') || lowerError.includes('parse')) return 'syntax';

    return 'other';
  }

  /**
   * Analyze test performance
   */
  analyzePerformance(testResults) {
    const durations = testResults.map(r => r.duration).filter(d => d > 0);

    if (durations.length === 0) {
      return null;
    }

    // Calculate statistics
    const sortedDurations = durations.sort((a, b) => a - b);
    const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const median = sortedDurations[Math.floor(sortedDurations.length / 2)];
    const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)];
    const p99 = sortedDurations[Math.floor(sortedDurations.length * 0.99)];

    // Identify slow tests
    const slowTests = testResults
      .filter(r => r.duration > 5000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Performance by test type
    const performanceByType = {};
    this.groupTestsByType(testResults).forEach((group, type) => {
      performanceByType[type] = {
        averageDuration: group.statistics.averageDuration,
        slowestTest: group.tests.reduce((max, test) => test.duration > max.duration ? test : max)
      };
    });

    return {
      statistics: {
        count: durations.length,
        mean,
        median,
        p95,
        p99,
        min: Math.min(...durations),
        max: Math.max(...durations),
        standardDeviation: this.calculateStandardDeviation(durations, mean)
      },
      slowTests,
      performanceByType,
      recommendations: this.generatePerformanceRecommendations(testResults)
    };
  }

  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation(values, mean) {
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Generate performance recommendations
   */
  generatePerformanceRecommendations(testResults) {
    const recommendations = [];

    // Check for slow tests
    const slowTests = testResults.filter(r => r.duration > 10000);
    if (slowTests.length > 0) {
      recommendations.push({
        priority: 'high',
        type: 'performance',
        message: `${slowTests.length} tests take more than 10 seconds`,
        suggestion: 'Consider optimizing test setup and teardown'
      });
    }

    // Check for memory issues
    const memoryIntensiveTests = testResults.filter(r =>
      r.metrics?.memory && r.metrics.memory.used > 100 * 1024 * 1024
    );
    if (memoryIntensiveTests.length > 0) {
      recommendations.push({
        priority: 'medium',
        type: 'memory',
        message: `${memoryIntensiveTests.length} tests use more than 100MB memory`,
        suggestion: 'Consider optimizing test data and cleanup'
      });
    }

    return recommendations;
  }

  /**
   * Analyze test coverage
   */
  async analyzeCoverage() {
    try {
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      if (!fs.existsSync(coveragePath)) {
        return null;
      }

      const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const total = coverageData.total;

      return {
        statements: {
          covered: total.statements.covered,
          total: total.statements.total,
          percentage: total.statements.pct
        },
        branches: {
          covered: total.branches.covered,
          total: total.branches.total,
          percentage: total.branches.pct
        },
        functions: {
          covered: total.functions.covered,
          total: total.functions.total,
          percentage: total.functions.pct
        },
        lines: {
          covered: total.lines.covered,
          total: total.lines.total,
          percentage: total.lines.pct
        },
        overall: total.lines.pct
      };
    } catch (error) {
      console.warn('Could not analyze coverage:', error.message);
      return null;
    }
  }

  /**
   * Analyze historical trends
   */
  async analyzeTrends() {
    try {
      const trendFile = path.join(this.config.outputDir, 'trends.json');
      if (!fs.existsSync(trendFile)) {
        return null;
      }

      const trendsData = JSON.parse(fs.readFileSync(trendFile, 'utf8'));
      return trendsData;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate report in specific format
   */
  async generateReportFormat(reportData, format) {
    switch (format) {
      case 'json':
        return await this.generateJSONReport(reportData);
      case 'html':
        return await this.generateHTMLReport(reportData);
      case 'junit':
        return await this.generateJUnitReport(reportData);
      case 'markdown':
        return await this.generateMarkdownReport(reportData);
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  /**
   * Generate JSON report
   */
  async generateJSONReport(reportData) {
    const filePath = path.join(this.config.outputDir, 'test-results.json');
    fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2));
    return { path: filePath, format: 'json' };
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(reportData) {
    const template = await this.getHTMLTemplate();
    const html = template
      .replace('{{TITLE}}', 'NASA System 6 Portal - Test Report')
      .replace('{{DATA}}', JSON.stringify(reportData, null, 2))
      .replace('{{TIMESTAMP}}', new Date().toLocaleString());

    const filePath = path.join(this.config.outputDir, 'test-report.html');
    fs.writeFileSync(filePath, html);
    return { path: filePath, format: 'html' };
  }

  /**
   * Generate JUnit XML report
   */
  async generateJUnitReport(reportData) {
    const xml = this.generateJUnitXML(reportData);
    const filePath = path.join(this.config.outputDir, 'junit.xml');
    fs.writeFileSync(filePath, xml);
    return { path: filePath, format: 'junit' };
  }

  /**
   * Generate Markdown report
   */
  async generateMarkdownReport(reportData) {
    const markdown = this.generateMarkdown(reportData);
    const filePath = path.join(this.config.outputDir, 'test-report.md');
    fs.writeFileSync(filePath, markdown);
    return { path: filePath, format: 'markdown' };
  }

  /**
   * Generate JUnit XML format
   */
  generateJUnitXML(reportData) {
    const { testResults, summary, metadata } = reportData;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuites name="${metadata.orchestrator}" tests="${summary.totalTests}" failures="${summary.failedTests}" time="${summary.totalDuration / 1000}">\n`;

    // Group tests by suite (type)
    const testsBySuite = {};
    testResults.forEach(test => {
      const suiteName = test.test?.type || 'default';
      if (!testsBySuite[suiteName]) {
        testsBySuite[suiteName] = [];
      }
      testsBySuite[suiteName].push(test);
    });

    Object.entries(testsBySuite).forEach(([suiteName, tests]) => {
      const suiteDuration = tests.reduce((sum, test) => sum + test.duration, 0);
      const suiteFailures = tests.filter(t => t.status === 'failed').length;

      xml += `  <testsuite name="${suiteName}" tests="${tests.length}" failures="${suiteFailures}" time="${suiteDuration / 1000}">\n`;

      tests.forEach(test => {
        const className = test.test?.relativePath || 'unknown';
        const testName = test.test?.id || 'unknown';
        const time = (test.duration || 0) / 1000;

        xml += `    <testcase classname="${className}" name="${testName}" time="${time}">\n`;

        if (test.status === 'failed') {
          xml += `      <failure message="${this.escapeXML(test.error || 'Test failed')}">\n`;
          if (test.stack) {
            xml += `        ${this.escapeXML(test.stack)}\n`;
          }
          xml += `      </failure>\n`;
        }

        xml += `    </testcase>\n`;
      });

      xml += `  </testsuite>\n`;
    });

    xml += '</testsuites>';
    return xml;
  }

  /**
   * Generate Markdown report
   */
  generateMarkdown(reportData) {
    const { metadata, summary, testsByType, failureAnalysis, performanceAnalysis, coverageAnalysis } = reportData;

    let markdown = `# ${metadata.orchestrator} - Test Report\n\n`;
    markdown += `**Generated:** ${new Date(metadata.timestamp).toLocaleString()}\n`;
    markdown += `**Environment:** ${metadata.environment}\n`;
    markdown += `**Platform:** ${metadata.platform}\n\n`;

    // Summary section
    markdown += `## 📊 Test Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| **Total Tests** | ${summary.totalTests} |\n`;
    markdown += `| **Passed** | ✅ ${summary.passedTests} |\n`;
    markdown += `| **Failed** | ❌ ${summary.failedTests} |\n`;
    markdown += `| **Success Rate** | ${summary.successRate.toFixed(1)}% |\n`;
    markdown += `| **Total Duration** | ${(summary.totalDuration / 1000).toFixed(2)}s |\n`;
    markdown += `| **Average Duration** | ${(summary.averageDuration / 1000).toFixed(2)}s |\n\n`;

    // Test types
    markdown += `## 🧪 Test Results by Type\n\n`;
    Object.entries(testsByType).forEach(([type, data]) => {
      const stats = data.statistics;
      const emoji = type === 'UNIT' ? '🟢' :
                   type === 'INTEGRATION' ? '🔵' :
                   type === 'E2E' ? '🟣' : '⚪';

      markdown += `### ${emoji} ${type} Tests\n\n`;
      markdown += `- **Total:** ${stats.total}\n`;
      markdown += `- **Passed:** ${stats.passed}\n`;
      markdown += `- **Failed:** ${stats.failed}\n`;
      markdown += `- **Success Rate:** ${stats.successRate.toFixed(1)}%\n`;
      markdown += `- **Duration:** ${(stats.totalDuration / 1000).toFixed(2)}s\n\n`;
    });

    // Failures
    if (failureAnalysis.totalFailures > 0) {
      markdown += `## ❌ Failure Analysis\n\n`;
      markdown += `**Total Failures:** ${failureAnalysis.totalFailures} (${failureAnalysis.failureRate.toFixed(1)}%)\n\n`;

      if (failureAnalysis.commonErrors.length > 0) {
        markdown += `### Common Errors\n\n`;
        failureAnalysis.commonErrors.forEach(({ error, count }, index) => {
          markdown += `${index + 1}. **${count} occurrences:** ${error.substring(0, 100)}...\n`;
        });
        markdown += `\n`;
      }
    }

    // Performance
    if (performanceAnalysis) {
      markdown += `## ⚡ Performance Analysis\n\n`;
      const stats = performanceAnalysis.statistics;
      markdown += `- **Mean Duration:** ${(stats.mean / 1000).toFixed(2)}s\n`;
      markdown += `- **Median Duration:** ${(stats.median / 1000).toFixed(2)}s\n`;
      markdown += `- **95th Percentile:** ${(stats.p95 / 1000).toFixed(2)}s\n`;
      markdown += `- **99th Percentile:** ${(stats.p99 / 1000).toFixed(2)}s\n\n`;

      if (performanceAnalysis.slowTests.length > 0) {
        markdown += `### Slow Tests (>5s)\n\n`;
        performanceAnalysis.slowTests.slice(0, 5).forEach((test, index) => {
          markdown += `${index + 1}. **${test.test.id}**: ${(test.duration / 1000).toFixed(2)}s\n`;
        });
        markdown += `\n`;
      }
    }

    // Coverage
    if (coverageAnalysis) {
      markdown += `## 📈 Code Coverage\n\n`;
      markdown += `- **Statements:** ${coverageAnalysis.statements.percentage}% (${coverageAnalysis.statements.covered}/${coverageAnalysis.statements.total})\n`;
      markdown += `- **Branches:** ${coverageAnalysis.branches.percentage}% (${coverageAnalysis.branches.covered}/${coverageAnalysis.branches.total})\n`;
      markdown += `- **Functions:** ${coverageAnalysis.functions.percentage}% (${coverageAnalysis.functions.covered}/${coverageAnalysis.functions.total})\n`;
      markdown += `- **Lines:** ${coverageAnalysis.lines.percentage}% (${coverageAnalysis.lines.covered}/${coverageAnalysis.lines.total})\n\n`;
    }

    return markdown;
  }

  /**
   * Get HTML template for report
   */
  async getHTMLTemplate() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #007acc; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 10px; }
        .metric-label { color: #666; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .section { margin-bottom: 30px; }
        .section h2 { border-bottom: 1px solid #eee; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
        .progress-bar { background: #e9ecef; border-radius: 4px; height: 20px; overflow: hidden; }
        .progress-fill { height: 100%; background: #28a745; transition: width 0.3s ease; }
        .timestamp { color: #666; font-size: 0.9em; }
        .chart { margin: 20px 0; }
        .error { color: #dc3545; }
        .success { color: #28a745; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 NASA System 6 Portal Test Report</h1>
            <p class="timestamp">Generated: {{TIMESTAMP}}</p>
        </div>

        <div class="summary" id="summary">
            <!-- Summary metrics will be populated by JavaScript -->
        </div>

        <div class="section">
            <h2>📊 Test Execution Chart</h2>
            <div class="chart">
                <canvas id="testChart" width="400" height="200"></canvas>
            </div>
        </div>

        <div class="section">
            <h2>🧪 Test Results by Type</h2>
            <div class="chart">
                <canvas id="typeChart" width="400" height="200"></canvas>
            </div>
        </div>

        <div class="section">
            <h2>📋 Detailed Test Results</h2>
            <table id="testTable">
                <thead>
                    <tr>
                        <th>Test</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Error</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Test results will be populated by JavaScript -->
                </tbody>
            </table>
        </div>
    </div>

    <script>
        const reportData = {{DATA}};

        // Populate summary metrics
        function populateSummary() {
            const summary = reportData.summary;
            const summaryContainer = document.getElementById('summary');

            const metrics = [
                { label: 'Total Tests', value: summary.totalTests, class: '' },
                { label: 'Passed', value: summary.passedTests, class: 'passed' },
                { label: 'Failed', value: summary.failedTests, class: 'failed' },
                { label: 'Success Rate', value: summary.successRate.toFixed(1) + '%', class: summary.successRate >= 80 ? 'passed' : 'failed' },
                { label: 'Duration', value: (summary.totalDuration / 1000).toFixed(2) + 's', class: '' }
            ];

            summaryContainer.innerHTML = metrics.map(metric => \`
                <div class="metric-card">
                    <div class="metric-value \${metric.class}">\${metric.value}</div>
                    <div class="metric-label">\${metric.label}</div>
                </div>
            \`).join('');
        }

        // Create test results chart
        function createTestChart() {
            const ctx = document.getElementById('testChart').getContext('2d');
            const summary = reportData.summary;

            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Passed', 'Failed'],
                    datasets: [{
                        data: [summary.passedTests, summary.failedTests],
                        backgroundColor: ['#28a745', '#dc3545']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Test Results Overview'
                        }
                    }
                }
            });
        }

        // Create test type chart
        function createTypeChart() {
            const ctx = document.getElementById('typeChart').getContext('2d');
            const typesByType = reportData.testsByType;

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(typesByType),
                    datasets: [{
                        label: 'Tests by Type',
                        data: Object.values(typesByType).map(type => type.statistics.total),
                        backgroundColor: ['#007acc', '#28a745', '#ffc107', '#dc3545', '#6f42c1']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Tests by Type'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Populate test results table
        function populateTestTable() {
            const tbody = document.querySelector('#testTable tbody');
            const testResults = reportData.testResults;

            tbody.innerHTML = testResults.map(test => {
                const statusClass = test.status === 'passed' ? 'success' : 'error';
                const duration = (test.duration / 1000).toFixed(2);
                const error = test.error ? test.error.substring(0, 100) + '...' : '';

                return \`
                    <tr>
                        <td>\${test.test?.id || 'Unknown'}</td>
                        <td>\${test.test?.type || 'Unknown'}</td>
                        <td class="\${statusClass}">\${test.status}</td>
                        <td>\${duration}s</td>
                        <td class="error">\${error}</td>
                    </tr>
                \`;
            }).join('');
        }

        // Initialize report
        document.addEventListener('DOMContentLoaded', function() {
            populateSummary();
            createTestChart();
            createTypeChart();
            populateTestTable();
        });
    </script>
</body>
</html>
    `;
  }

  /**
   * Generate coverage report
   */
  async generateCoverageReport() {
    const coverageDir = path.join(process.cwd(), 'coverage');
    const outputDir = path.join(this.config.outputDir, 'coverage');

    if (!fs.existsSync(coverageDir)) {
      return;
    }

    // Copy coverage reports to output directory
    this.copyDirectory(coverageDir, outputDir);

    console.log(chalk.green('  ✅ Coverage report generated'));
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(testResults) {
    const performanceData = this.analyzePerformance(testResults);

    if (!performanceData) {
      return;
    }

    const report = {
      timestamp: new Date().toISOString(),
      performance: performanceData
    };

    const filePath = path.join(this.config.outputDir, 'performance-report.json');
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));

    console.log(chalk.green('  ✅ Performance report generated'));
  }

  /**
   * Generate report index
   */
  async generateReportIndex(reports) {
    const index = {
      timestamp: new Date().toISOString(),
      reports: reports.map(r => ({
        format: r.format,
        path: path.relative(this.config.outputDir, r.report.path)
      }))
    };

    const indexPath = path.join(this.config.outputDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDirectory() {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Copy directory recursively
   */
  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });
    entries.forEach(entry => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  /**
   * Escape XML special characters
   */
  escapeXML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

module.exports = TestReporter;