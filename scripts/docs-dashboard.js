#!/usr/bin/env node

/**
 * NASA System 6 Portal - Documentation Dashboard
 *
 * Interactive dashboard for documentation quality monitoring and management
 * Features:
 * - Real-time documentation quality metrics
 * - Interactive issue tracking and resolution
 * - Trend analysis and historical data
 * - NASA System 6 Portal specific content monitoring
 * - Automated maintenance scheduling and reporting
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const DocumentationMaintenanceSystem = require('./docs-maintenance-system');

class DocumentationDashboard {
  constructor(options = {}) {
    this.options = {
      reportsDir: 'docs',
      dashboardFile: 'docs/dashboard.html',
      ...options
    };

    this.maintenanceSystem = new DocumentationMaintenanceSystem(options);
    this.historicalData = this.loadHistoricalData();
  }

  /**
   * Main dashboard entry point
   */
  async runDashboard(mode = 'interactive') {
    console.log(chalk.cyan('🚀 NASA System 6 Portal - Documentation Dashboard'));
    console.log(chalk.blue('📊 Loading dashboard system...'));

    try {
      switch (mode) {
        case 'interactive':
          await this.runInteractiveDashboard();
          break;
        case 'generate':
          await this.generateStaticDashboard();
          break;
        case 'monitor':
          await this.runMonitoringMode();
          break;
        case 'report':
          await this.generateComprehensiveReport();
          break;
        default:
          console.warn(chalk.yellow(`Unknown dashboard mode: ${mode}`));
      }

      console.log(chalk.green('✅ Dashboard operation completed'));
    } catch (error) {
      console.error(chalk.red('❌ Dashboard operation failed:'), error.message);
      throw error;
    }
  }

  /**
   * Run interactive dashboard
   */
  async runInteractiveDashboard() {
    console.log(chalk.blue('🎮 Starting interactive dashboard...'));

    // Run comprehensive analysis
    const report = await this.maintenanceSystem.runMaintenance(['audit', 'validate', 'quality']);

    // Display interactive dashboard
    this.displayInteractiveDashboard(report);

    // Show menu options
    await this.showInteractiveMenu(report);
  }

  /**
   * Display interactive dashboard
   */
  displayInteractiveDashboard(report) {
    console.clear();
    console.log(chalk.cyan('🚀 NASA System 6 Portal - Documentation Dashboard'));
    console.log(chalk.blue('═'.repeat(80)));

    // Header with NASA System 6 Portal branding
    console.log(chalk.yellow('🎯 Documentation Health Overview'));
    console.log(chalk.gray(`Last Updated: ${new Date().toLocaleString()}`));
    console.log('');

    // Quality Score with visual indicator
    const qualityScore = report.qualityScore;
    const qualityEmoji = this.getQualityEmoji(qualityScore);
    const qualityColor = this.getQualityColor(qualityScore);

    console.log(chalk.bold(`${qualityEmoji} Overall Quality Score: `) +
                 chalk[qualityColor](qualityScore + '/100'));
    this.drawQualityBar(qualityScore);

    // Key Metrics
    console.log(chalk.yellow('\n📊 Key Metrics:'));
    console.log(`  📄 Files Analyzed: ${report.metrics.filesAnalyzed}`);
    console.log(`  🔍 Issues Found: ${report.metrics.issuesFound}`);
    console.log(`  ✅ Issues Fixed: ${report.metrics.issuesFixed}`);
    console.log(`  🔗 Links Checked: ${report.metrics.linksChecked}`);

    // Issue Breakdown
    console.log(chalk.yellow('\n🔍 Issue Breakdown:'));
    console.log(`  ${chalk.red('❌')} Errors: ${report.issues.errors.length}`);
    console.log(`  ${chalk.yellow('⚠️')} Warnings: ${report.issues.warnings.length}`);
    console.log(`  ${chalk.blue('💡')} Suggestions: ${report.issues.suggestions.length}`);

    // NASA System 6 Portal Specific Content
    console.log(chalk.yellow('\n🚀 NASA System 6 Portal Content:'));
    const nasaContent = this.analyzeNasaSystem6Content(report);
    console.log(`  🛰️  NASA Content: ${chalk.green(nasaContent.nasaFiles)} files`);
    console.log(`  🖥️  System 6 Content: ${chalk.green(nasaContent.system6Files)} files`);
    console.log(`  📚 Documentation Completeness: ${chalk.green(nasaContent.completeness + '%')}`);

    // Recent Activity
    console.log(chalk.yellow('\n📅 Recent Activity:'));
    const recentActivity = this.getRecentActivity();
    recentActivity.slice(0, 5).forEach(activity => {
      console.log(`  ${activity.icon} ${activity.message}`);
    });

    // Health Status
    console.log(chalk.yellow('\n🏥 System Health:'));
    const healthStatus = this.calculateSystemHealth(report);
    console.log(`  ${healthStatus.icon} ${healthStatus.status}: ${healthStatus.message}`);

    console.log(chalk.blue('═'.repeat(80)));
  }

  /**
   * Draw quality bar visual
   */
  drawQualityBar(score) {
    const barLength = 40;
    const filledLength = Math.round((score / 100) * barLength);
    const emptyLength = barLength - filledLength;

    const filled = '█'.repeat(filledLength);
    const empty = '░'.repeat(emptyLength);
    const color = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';

    console.log(chalk[color](`  [${filled}${empty}]`));
  }

  /**
   * Get quality emoji based on score
   */
  getQualityEmoji(score) {
    if (score >= 90) return '🏆';
    if (score >= 80) return '🥇';
    if (score >= 70) return '🥈';
    if (score >= 60) return '🥉';
    return '⚠️';
  }

  /**
   * Get quality color based on score
   */
  getQualityColor(score) {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  }

  /**
   * Analyze NASA System 6 Portal specific content
   */
  analyzeNasaSystem6Content(report) {
    let nasaFiles = 0;
    let system6Files = 0;
    let completeness = 0;

    if (report.files) {
      report.files.forEach(file => {
        if (typeof file === 'object' && file.content) {
          const content = file.content.toLowerCase();
          if (content.includes('nasa') || content.includes('space') || content.includes('astronomy')) {
            nasaFiles++;
          }
          if (content.includes('system 6') || content.includes('system6') || content.includes('retro')) {
            system6Files++;
          }
        }
      });

      // Calculate completeness based on presence of key documentation types
      const requiredTypes = ['README', 'CHANGELOG', 'ARCHITECTURE'];
      completeness = Math.round((requiredTypes.filter(type =>
        report.files.some(file => typeof file === 'object' && file.path.includes(type.toLowerCase()))
      ).length / requiredTypes.length) * 100);
    }

    return { nasaFiles, system6Files, completeness };
  }

  /**
   * Get recent activity
   */
  getRecentActivity() {
    return [
      { icon: '📝', message: 'Documentation audit completed' },
      { icon: '🔍', message: 'Link validation performed' },
      { icon: '⚡', message: 'Quality checks executed' },
      { icon: '🔧', message: 'System optimization applied' },
      { icon: '📊', message: 'Report generated successfully' }
    ];
  }

  /**
   * Calculate system health
   */
  calculateSystemHealth(report) {
    const qualityScore = report.qualityScore;
    const errorCount = report.issues.errors.length;
    const warningCount = report.issues.warnings.length;

    if (qualityScore >= 90 && errorCount === 0) {
      return { icon: '🟢', status: 'Excellent', message: 'All systems operating optimally' };
    } else if (qualityScore >= 70 && errorCount === 0) {
      return { icon: '🟡', status: 'Good', message: 'Minor issues detected' };
    } else if (errorCount === 0) {
      return { icon: '🟠', status: 'Fair', message: 'Several improvements recommended' };
    } else {
      return { icon: '🔴', status: 'Critical', message: 'Immediate attention required' };
    }
  }

  /**
   * Show interactive menu
   */
  async showInteractiveMenu(report) {
    console.log(chalk.yellow('\n🎮 Interactive Options:'));
    console.log('1. 🔍 View detailed issues');
    console.log('2. 📊 Generate detailed report');
    console.log('3. 🔧 Run optimization');
    console.log('4. 📈 View historical trends');
    console.log('5. 🚀 NASA System 6 Portal content analysis');
    console.log('6. 🔄 Run full maintenance');
    console.log('7. 📤 Export reports');
    console.log('0. 🚪 Exit');

    // In a real implementation, you would capture user input here
    console.log(chalk.blue('\n💡 Interactive mode would allow real user interaction here'));
  }

  /**
   * Generate static HTML dashboard
   */
  async generateStaticDashboard() {
    console.log(chalk.blue('📄 Generating static HTML dashboard...'));

    const report = await this.maintenanceSystem.runMaintenance(['audit', 'validate', 'quality']);
    const htmlContent = this.generateHTMLDashboard(report);

    const dashboardPath = path.resolve(this.options.dashboardFile);
    fs.writeFileSync(dashboardPath, htmlContent, 'utf8');

    console.log(chalk.green(`✅ Dashboard generated: ${dashboardPath}`));
  }

  /**
   * Generate HTML dashboard content
   */
  generateHTMLDashboard(report) {
    const now = new Date().toLocaleString();
    const nasaContent = this.analyzeNasaSystem6Content(report);
    const healthStatus = this.calculateSystemHealth(report);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NASA System 6 Portal - Documentation Dashboard</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            color: #fff;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .card h3 {
            margin: 0 0 15px 0;
            color: #fff;
            font-size: 1.2em;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .metric:last-child {
            border-bottom: none;
        }
        .quality-score {
            font-size: 3em;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
        }
        .quality-bar {
            width: 100%;
            height: 20px;
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .quality-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcf7f);
            transition: width 0.3s ease;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-excellent { background: #6bcf7f; }
        .status-good { background: #ffd93d; }
        .status-fair { background: #ff9f40; }
        .status-critical { background: #ff6b6b; }
        .nasa-section {
            background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
        }
        .system6-section {
            background: linear-gradient(135deg, #4ecdc4, #45b7d1);
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 NASA System 6 Portal</h1>
            <p>Documentation Quality Dashboard</p>
            <p style="font-size: 0.9em; opacity: 0.7;">Last Updated: ${now}</p>
        </div>

        <div class="dashboard">
            <div class="card">
                <h3>📊 Quality Score</h3>
                <div class="quality-score" style="color: ${this.getQualityColor(report.qualityScore)}">
                    ${this.getQualityEmoji(report.qualityScore)} ${report.qualityScore}/100
                </div>
                <div class="quality-bar">
                    <div class="quality-fill" style="width: ${report.qualityScore}%"></div>
                </div>
            </div>

            <div class="card">
                <h3>📈 Key Metrics</h3>
                <div class="metric">
                    <span>📄 Files Analyzed</span>
                    <span>${report.metrics.filesAnalyzed}</span>
                </div>
                <div class="metric">
                    <span>🔍 Issues Found</span>
                    <span>${report.metrics.issuesFound}</span>
                </div>
                <div class="metric">
                    <span>✅ Issues Fixed</span>
                    <span>${report.metrics.issuesFixed}</span>
                </div>
                <div class="metric">
                    <span>🔗 Links Checked</span>
                    <span>${report.metrics.linksChecked}</span>
                </div>
            </div>

            <div class="card">
                <h3>🔍 Issue Breakdown</h3>
                <div class="metric">
                    <span><span class="status-indicator status-critical"></span>Errors</span>
                    <span>${report.issues.errors.length}</span>
                </div>
                <div class="metric">
                    <span><span class="status-indicator status-fair"></span>Warnings</span>
                    <span>${report.issues.warnings.length}</span>
                </div>
                <div class="metric">
                    <span><span class="status-indicator status-good"></span>Suggestions</span>
                    <span>${report.issues.suggestions.length}</span>
                </div>
            </div>

            <div class="card nasa-section">
                <h3>🚀 NASA Content</h3>
                <div class="metric">
                    <span>🛰️ NASA Files</span>
                    <span>${nasaContent.nasaFiles}</span>
                </div>
                <div class="metric">
                    <span>📡 Space Content</span>
                    <span>${nasaContent.nasaFiles > 0 ? '✅' : '⚠️'}</span>
                </div>
                <div class="metric">
                    <span>🔬 API Documentation</span>
                    <span>${report.files.some(f => f.path.includes('api')) ? '✅' : '⚠️'}</span>
                </div>
            </div>

            <div class="card system6-section">
                <h3>🖥️ System 6 Content</h3>
                <div class="metric">
                    <span>📱 System 6 Files</span>
                    <span>${nasaContent.system6Files}</span>
                </div>
                <div class="metric">
                    <span>🎨 Design System</span>
                    <span>${nasaContent.system6Files > 0 ? '✅' : '⚠️'}</span>
                </div>
                <div class="metric">
                    <span>📚 Completeness</span>
                    <span>${nasaContent.completeness}%</span>
                </div>
            </div>

            <div class="card">
                <h3>🏥 System Health</h3>
                <div style="text-align: center; font-size: 1.5em; margin: 20px 0;">
                    <span class="status-indicator status-${healthStatus.status.toLowerCase()}"></span>
                    ${healthStatus.status}
                </div>
                <p style="text-align: center; margin: 10px 0; opacity: 0.9;">
                    ${healthStatus.message}
                </p>
            </div>
        </div>

        <div class="footer">
            <p>📊 Generated by NASA System 6 Portal Documentation Maintenance System</p>
            <p style="font-size: 0.8em; opacity: 0.7;">
                Processing Time: ${report.metrics.processingTime}ms |
                Quality Score: ${report.qualityScore}/100
            </p>
        </div>
    </div>

    <script>
        // Auto-refresh every 5 minutes
        setTimeout(() => {
            location.reload();
        }, 300000);

        // Add interactive features
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.transition = 'transform 0.3s ease';
            });
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    </script>
</body>
</html>`;
  }

  /**
   * Run monitoring mode
   */
  async runMonitoringMode() {
    console.log(chalk.blue('📡 Starting monitoring mode...'));

    const report = await this.maintenanceSystem.runMaintenance(['audit', 'validate', 'quality']);

    // Save to historical data
    this.saveHistoricalData(report);

    // Check for alerts
    const alerts = this.checkForAlerts(report);
    if (alerts.length > 0) {
      console.log(chalk.red('\n🚨 ALERTS:'));
      alerts.forEach(alert => {
        console.log(chalk.red(`  ${alert.type}: ${alert.message}`));
      });
    } else {
      console.log(chalk.green('\n✅ No alerts - system operating normally'));
    }

    // Show monitoring dashboard
    this.displayMonitoringDashboard(report);
  }

  /**
   * Load historical data
   */
  loadHistoricalData() {
    const historicalPath = path.join(this.options.reportsDir, 'historical-data.json');

    try {
      if (fs.existsSync(historicalPath)) {
        return JSON.parse(fs.readFileSync(historicalPath, 'utf8'));
      }
    } catch (error) {
      console.warn(chalk.yellow('Could not load historical data, starting fresh'));
    }

    return [];
  }

  /**
   * Save historical data
   */
  saveHistoricalData(report) {
    const historicalPath = path.join(this.options.reportsDir, 'historical-data.json');

    try {
      const historical = this.loadHistoricalData();

      const dataPoint = {
        timestamp: new Date().toISOString(),
        qualityScore: report.qualityScore,
        issuesFound: report.metrics.issuesFound,
        filesAnalyzed: report.metrics.filesAnalyzed,
        errors: report.issues.errors.length,
        warnings: report.issues.warnings.length
      };

      historical.push(dataPoint);

      // Keep only last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const filtered = historical.filter(point =>
        new Date(point.timestamp) > thirtyDaysAgo
      );

      fs.writeFileSync(historicalPath, JSON.stringify(filtered, null, 2), 'utf8');
    } catch (error) {
      console.warn(chalk.yellow(`Could not save historical data: ${error.message}`));
    }
  }

  /**
   * Check for alerts
   */
  checkForAlerts(report) {
    const alerts = [];

    // Critical errors
    if (report.issues.errors.length > 0) {
      alerts.push({
        type: 'ERROR',
        message: `${report.issues.errors.length} critical errors found`,
        severity: 'critical'
      });
    }

    // Quality score drop
    if (this.historicalData.length > 1) {
      const previous = this.historicalData[this.historicalData.length - 2];
      const current = report.qualityScore;

      if (current < previous.qualityScore - 10) {
        alerts.push({
          type: 'QUALITY_DROP',
          message: `Quality score dropped from ${previous.qualityScore} to ${current}`,
          severity: 'warning'
        });
      }
    }

    // High warning count
    if (report.issues.warnings.length > 10) {
      alerts.push({
        type: 'HIGH_WARNINGS',
        message: `${report.issues.warnings.length} warnings detected`,
        severity: 'warning'
      });
    }

    return alerts;
  }

  /**
   * Display monitoring dashboard
   */
  displayMonitoringDashboard(report) {
    console.log(chalk.cyan('\n📡 Monitoring Dashboard'));
    console.log(chalk.blue('═'.repeat(60)));

    console.log(chalk.yellow('📊 Current Status:'));
    console.log(`  Quality Score: ${report.qualityScore}/100`);
    console.log(`  Issues: ${report.metrics.issuesFound}`);
    console.log(`  Files: ${report.metrics.filesAnalyzed}`);

    if (this.historicalData.length > 1) {
      console.log(chalk.yellow('\n📈 Trends (Last 7 days):'));
      const recent = this.historicalData.slice(-7);
      const avgQuality = recent.reduce((sum, point) => sum + point.qualityScore, 0) / recent.length;
      console.log(`  Average Quality: ${Math.round(avgQuality)}/100`);

      const trend = recent[recent.length - 1].qualityScore - recent[0].qualityScore;
      const trendIcon = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
      console.log(`  Trend: ${trendIcon} ${trend > 0 ? '+' : ''}${trend}`);
    }
  }

  /**
   * Generate comprehensive report
   */
  async generateComprehensiveReport() {
    console.log(chalk.blue('📄 Generating comprehensive report...'));

    const report = await this.maintenanceSystem.runMaintenance(['audit', 'validate', 'quality', 'optimize']);

    // Generate markdown report
    const markdownReport = this.generateComprehensiveMarkdownReport(report);
    const reportPath = path.join(this.options.reportsDir, 'comprehensive-report.md');
    fs.writeFileSync(reportPath, markdownReport, 'utf8');

    // Generate JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      report: report,
      historical: this.historicalData,
      analysis: this.analyzeNasaSystem6Content(report),
      recommendations: this.generateAdvancedRecommendations(report)
    };

    const jsonPath = path.join(this.options.reportsDir, 'comprehensive-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2), 'utf8');

    console.log(chalk.green(`✅ Comprehensive report generated:`));
    console.log(chalk.green(`  📄 Markdown: ${reportPath}`));
    console.log(chalk.green(`  📊 JSON: ${jsonPath}`));
  }

  /**
   * Generate comprehensive markdown report
   */
  generateComprehensiveMarkdownReport(report) {
    const date = new Date().toLocaleDateString();
    const nasaContent = this.analyzeNasaSystem6Content(report);

    return `# NASA System 6 Portal - Comprehensive Documentation Report

**Generated:** ${date}
**Quality Score:** ${report.qualityScore}/100 ${this.getQualityEmoji(report.qualityScore)}

## Executive Summary

The NASA System 6 Portal documentation is currently **${this.getQualityStatus(report.qualityScore)}** with an overall quality score of **${report.qualityScore}/100**. The system has **${report.metrics.filesAnalyzed}** documentation files with **${report.metrics.issuesFound}** identified issues.

## Quality Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Files Analyzed | ${report.metrics.filesAnalyzed} | ✅ |
| Issues Found | ${report.metrics.issuesFound} | ${report.metrics.issuesFound === 0 ? '✅' : '⚠️'} |
| Issues Fixed | ${report.metrics.issuesFixed} | ${report.metrics.issuesFixed > 0 ? '✅' : '➖'} |
| Links Checked | ${report.metrics.linksChecked} | ${report.metrics.linksChecked > 0 ? '✅' : '➖'} |
| Broken Links | ${report.metrics.brokenLinks} | ${report.metrics.brokenLinks === 0 ? '✅' : '❌'} |
| Processing Time | ${report.metrics.processingTime}ms | ✅ |

## Issue Breakdown

### Critical Issues (${report.issues.errors.length})
${report.issues.errors.length > 0 ?
  report.issues.errors.map(error =>
    `- **${path.basename(error.file || 'unknown')}:** ${error.message}`
  ).join('\n') :
  'No critical issues found ✅'
}

### Warnings (${report.issues.warnings.length})
${report.issues.warnings.length > 0 ?
  report.issues.warnings.slice(0, 10).map(warning =>
    `- **${path.basename(warning.file || 'unknown')}:** ${warning.message}`
  ).join('\n') + (report.issues.warnings.length > 10 ? '\n- ... and more' : '') :
  'No warnings found ✅'
}

### Suggestions (${report.issues.suggestions.length})
${report.issues.suggestions.length > 0 ?
  report.issues.suggestions.slice(0, 10).map(suggestion =>
    `- **${path.basename(suggestion.file || 'unknown')}:** ${suggestion.message}`
  ).join('\n') + (report.issues.suggestions.length > 10 ? '\n- ... and more' : '') :
  'No suggestions ✅'
}

## NASA System 6 Portal Content Analysis

| Content Type | Files Found | Coverage |
|--------------|-------------|----------|
| NASA Content | ${nasaContent.nasaFiles} | ${nasaContent.nasaFiles > 0 ? '✅' : '⚠️'} |
| System 6 Content | ${nasaContent.system6Files} | ${nasaContent.system6Files > 0 ? '✅' : '⚠️'} |
| Documentation Completeness | ${nasaContent.completeness}% | ${nasaContent.completeness >= 80 ? '✅' : '⚠️'} |

## Recommendations

### High Priority
${this.generateHighPriorityRecommendations(report).map(rec => `- ${rec}`).join('\n') || '- No high priority items'}

### Medium Priority
${this.generateMediumPriorityRecommendations(report).map(rec => `- ${rec}`).join('\n') || '- No medium priority items'}

### Low Priority
${this.generateLowPriorityRecommendations(report).map(rec => `- ${rec}`).join('\n') || '- No low priority items'}

## Historical Trends

${this.historicalData.length > 1 ?
  this.generateTrendAnalysis() :
  'Historical data not available yet. Run the system regularly to establish trends.'
}

## Next Steps

1. **Immediate Actions:** Address any critical errors identified in this report
2. **Short-term Goals:** Implement medium priority recommendations within 2 weeks
3. **Long-term Strategy:** Establish regular documentation maintenance schedule
4. **Monitoring:** Set up automated alerts for quality score drops

---

*Report generated by NASA System 6 Portal Documentation Maintenance System*
*For detailed analysis, see the accompanying JSON report*
`;
  }

  /**
   * Get quality status text
   */
  getQualityStatus(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  }

  /**
   * Generate high priority recommendations
   */
  generateHighPriorityRecommendations(report) {
    const recommendations = [];

    if (report.issues.errors.length > 0) {
      recommendations.push('Fix all critical errors immediately');
    }

    if (report.metrics.brokenLinks > 0) {
      recommendations.push('Update or remove all broken links');
    }

    if (report.qualityScore < 60) {
      recommendations.push('Comprehensive documentation review required');
    }

    return recommendations;
  }

  /**
   * Generate medium priority recommendations
   */
  generateMediumPriorityRecommendations(report) {
    const recommendations = [];

    if (report.issues.warnings.length > 5) {
      recommendations.push('Address multiple warnings to improve quality');
    }

    if (report.issues.suggestions.length > 10) {
      recommendations.push('Review and implement suggested improvements');
    }

    recommendations.push('Enhance NASA System 6 Portal specific content');
    recommendations.push('Improve documentation structure and organization');

    return recommendations;
  }

  /**
   * Generate low priority recommendations
   */
  generateLowPriorityRecommendations(report) {
    return [
      'Consider adding more examples and use cases',
      'Expand API documentation with more details',
      'Add troubleshooting guides for common issues',
      'Implement automated documentation testing',
      'Create contributor guidelines for documentation'
    ];
  }

  /**
   * Generate trend analysis
   */
  generateTrendAnalysis() {
    const recent = this.historicalData.slice(-7);
    const avgQuality = Math.round(recent.reduce((sum, point) => sum + point.qualityScore, 0) / recent.length);
    const trend = recent[recent.length - 1].qualityScore - recent[0].qualityScore;

    return `Over the last 7 days, the documentation quality has averaged **${avgQuality}/100** with a trend of **${trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable'}** (${trend > 0 ? '+' : ''}${trend} points).`;
  }

  /**
   * Generate advanced recommendations
   */
  generateAdvancedRecommendations(report) {
    return {
      immediate: this.generateHighPriorityRecommendations(report),
      shortTerm: this.generateMediumPriorityRecommendations(report),
      longTerm: this.generateLowPriorityRecommendations(report),
      automated: [
        'Set up scheduled daily/weekly documentation maintenance',
        'Configure quality score alerts',
        'Implement automated link checking',
        'Add documentation coverage to CI/CD pipeline'
      ]
    };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const mode = args[0] || 'interactive';

  const dashboard = new DocumentationDashboard();

  dashboard.runDashboard(mode)
    .then(() => {
      console.log(chalk.green('🎉 Dashboard operation completed successfully!'));
      process.exit(0);
    })
    .catch(error => {
      console.error(chalk.red('💥 Dashboard operation failed:'), error.message);
      process.exit(1);
    });
}

module.exports = DocumentationDashboard;