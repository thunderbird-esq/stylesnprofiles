#!/usr/bin/env node

/**
 * NASA System 6 Portal - Changelog Quality Assurance Framework
 *
 * Advanced quality assurance system for changelog automation
 * Features:
 * - Comprehensive quality metrics and analysis
 * - Content validation and consistency checking
 * - Performance monitoring and optimization
 * - Compliance verification with standards
 * - Automated quality reports and recommendations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class ChangelogQualityAssurance {
  constructor(options = {}) {
    this.options = {
      changelogPath: 'CHANGELOG.md',
      strictMode: false,
      coverageThreshold: 80,
      entryCountThreshold: 10,
      ...options
    };

    this.metrics = {
      formatCompliance: 0,
      contentQuality: 0,
      consistencyScore: 0,
      performanceRating: 0,
      overallQuality: 0
    };

    this.issues = {
      errors: [],
      warnings: [],
      recommendations: []
    };

    this.nasaKeywords = ['nasa', 'space', 'astronomy', 'apod', 'neows', 'api'];
    this.system6Keywords = ['system 6', 'system6', 'retro', 'chicago', 'geneva'];
    this.qualityStandards = {
      minEntriesPerSection: 2,
      maxEmptySections: 1,
      requiredSections: ['added', 'fixed', 'security'],
      acceptableLength: { min: 500, max: 10000 }
    };
  }

  /**
   * Run comprehensive quality assurance analysis
   */
  async runQualityAssurance() {
    console.log(chalk.cyan('🚀 NASA System 6 Portal - Changelog Quality Assurance'));
    console.log(chalk.blue('🔬 Running comprehensive quality analysis...'));

    try {
      // Step 1: Load and validate changelog
      const changelogContent = this.loadChangelog();

      // Step 2: Format compliance analysis
      await this.analyzeFormatCompliance(changelogContent);

      // Step 3: Content quality assessment
      await this.assessContentQuality(changelogContent);

      // Step 4: Consistency checking
      await this.checkConsistency(changelogContent);

      // Step 5: Performance evaluation
      await this.evaluatePerformance();

      // Step 6: Calculate overall quality score
      this.calculateOverallQuality();

      // Step 7: Generate quality report
      const report = this.generateQualityReport();

      console.log(chalk.green('✅ Quality assurance analysis completed!'));
      return report;

    } catch (error) {
      console.error(chalk.red('❌ Quality assurance failed:'), error.message);
      throw error;
    }
  }

  /**
   * Load and validate changelog file
   */
  loadChangelog() {
    const changelogPath = path.resolve(process.cwd(), this.options.changelogPath);

    if (!fs.existsSync(changelogPath)) {
      throw new Error(`Changelog file not found: ${changelogPath}`);
    }

    const content = fs.readFileSync(changelogPath, 'utf8');

    if (content.length < this.qualityStandards.acceptableLength.min) {
      this.issues.warnings.push('Changelog appears to be too short');
    }

    if (content.length > this.qualityStandards.acceptableLength.max) {
      this.issues.warnings.push('Changelog is extremely long, consider summarizing');
    }

    return content;
  }

  /**
   * Analyze format compliance with Keep a Changelog standard
   */
  async analyzeFormatCompliance(content) {
    console.log(chalk.blue('📝 Analyzing format compliance...'));

    let complianceScore = 0;
    const maxScore = 100;

    // Check for required headers
    const requiredHeaders = [
      '# Changelog',
      'The format is based on [Keep a Changelog]',
      '## [Unreleased]'
    ];

    requiredHeaders.forEach(header => {
      if (content.includes(header)) {
        complianceScore += 20;
      } else {
        this.issues.errors.push(`Missing required header: ${header}`);
      }
    });

    // Check for proper section structure
    const sectionPattern = /^### (Added|Changed|Deprecated|Removed|Fixed|Security)$/gm;
    const sections = content.match(sectionPattern) || [];

    if (sections.length >= 3) {
      complianceScore += 20;
    } else {
      this.issues.warnings.push('Fewer than 3 changelog sections found');
    }

    // Check entry formatting
    const entryPattern = /^- .+$/gm;
    const entries = content.match(entryPattern) || [];

    if (entries.length >= this.qualityStandards.minEntriesPerSection) {
      complianceScore += 30;
    } else {
      this.issues.warnings.push('Insufficient number of changelog entries');
    }

    // Check semantic versioning
    const versionPattern = /## \[v?\d+\.\d+\.\d+\]/g;
    const versions = content.match(versionPattern) || [];

    if (versions.length > 0) {
      complianceScore += 30;
    } else {
      this.issues.warnings.push('No semantic version tags found');
    }

    this.metrics.formatCompliance = Math.min(complianceScore, maxScore);
  }

  /**
   * Assess content quality and relevance
   */
  async assessContentQuality(content) {
    console.log(chalk.blue('📊 Assessing content quality...'));

    let qualityScore = 0;
    const maxScore = 100;

    // Check NASA System 6 Portal specific content
    const lowerContent = content.toLowerCase();
    let nasaScore = 0;
    let system6Score = 0;

    this.nasaKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        nasaScore += 10;
      }
    });

    this.system6Keywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        system6Score += 15;
      }
    });

    const portalContentScore = Math.min((nasaScore + system6Score), 40);
    qualityScore += portalContentScore;

    // Check for meaningful content
    const entries = content.match(/^- .+$/gm) || [];
    let meaningfulEntries = 0;

    entries.forEach(entry => {
      // Check for non-generic content
      if (entry.length > 20 &&
          !entry.match(/^(fix|add|update|remove) (a|the|some)/i)) {
        meaningfulEntries++;
      }
    });

    const meaningfulRatio = entries.length > 0 ? meaningfulEntries / entries.length : 0;
    if (meaningfulRatio >= 0.7) {
      qualityScore += 30;
    } else {
      this.issues.warnings.push('Many changelog entries appear to be generic');
    }

    // Check for security content
    const securityEntries = content.match(/^- .*security.*$/gim) || [];
    if (securityEntries.length > 0) {
      qualityScore += 15;
    } else {
      this.issues.recommendations.push('Consider adding security-related entries if applicable');
    }

    // Check for testing content
    const testingEntries = content.match(/^- .*test.*$/gim) || [];
    if (testingEntries.length > 0) {
      qualityScore += 15;
    }

    this.metrics.contentQuality = Math.min(qualityScore, maxScore);
  }

  /**
   * Check consistency across changelog
   */
  async checkConsistency(content) {
    console.log(chalk.blue('🔍 Checking consistency...'));

    let consistencyScore = 0;
    const maxScore = 100;

    // Check section ordering consistency
    const expectedOrder = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];
    const foundSections = [];
    const sectionMatches = content.match(/^### (.+)$/gm) || [];

    sectionMatches.forEach(section => {
      const sectionName = section.replace('### ', '');
      if (expectedOrder.includes(sectionName)) {
        foundSections.push(sectionName);
      }
    });

    // Check if sections are in expected order
    let orderConsistent = true;
    for (let i = 0; i < foundSections.length - 1; i++) {
      const currentIndex = expectedOrder.indexOf(foundSections[i]);
      const nextIndex = expectedOrder.indexOf(foundSections[i + 1]);
      if (currentIndex > nextIndex) {
        orderConsistent = false;
        break;
      }
    }

    if (orderConsistent) {
      consistencyScore += 30;
    } else {
      this.issues.warnings.push('Changelog sections are not in standard order');
    }

    // Check entry format consistency
    const entries = content.match(/^- .+$/gm) || [];
    let consistentFormat = 0;
    const formatPatterns = [
      /^[a-z].*\([^)]+\)$/, // Ends with commit hash
      /^[A-Z][^.]*\./, // Starts with capital, ends with period
      /^[a-z].*\.$/ // Starts with lowercase, ends with period
    ];

    entries.forEach(entry => {
      if (formatPatterns.some(pattern => pattern.test(entry))) {
        consistentFormat++;
      }
    });

    const formatRatio = entries.length > 0 ? consistentFormat / entries.length : 0;
    if (formatRatio >= 0.8) {
      consistencyScore += 40;
    } else {
      this.issues.warnings.push('Inconsistent entry formatting detected');
    }

    // Check for empty sections
    const emptySections = content.match(/^### (Added|Changed|Deprecated|Removed|Fixed|Security)\s*$/gm) || [];
    if (emptySections.length <= this.qualityStandards.maxEmptySections) {
      consistencyScore += 30;
    } else {
      this.issues.warnings.push(`Too many empty sections (${emptySections.length})`);
    }

    this.metrics.consistencyScore = Math.min(consistencyScore, maxScore);
  }

  /**
   * Evaluate performance metrics
   */
  async evaluatePerformance() {
    console.log(chalk.blue('⚡ Evaluating performance...'));

    let performanceScore = 0;
    const maxScore = 100;

    // Measure file size performance
    const changelogPath = path.resolve(process.cwd(), this.options.changelogPath);
    const stats = fs.statSync(changelogPath);
    const fileSizeKB = stats.size / 1024;

    if (fileSizeKB < 50) {
      performanceScore += 25;
    } else if (fileSizeKB < 200) {
      performanceScore += 20;
    } else if (fileSizeKB < 500) {
      performanceScore += 15;
    } else {
      this.issues.warnings.push('Large changelog file may impact performance');
    }

    // Measure parsing performance
    const startTime = Date.now();
    const content = fs.readFileSync(changelogPath, 'utf8');
    const lines = content.split('\n');
    const entries = lines.filter(line => line.match(/^- .+$/));
    const parseTime = Date.now() - startTime;

    if (parseTime < 100) {
      performanceScore += 25;
    } else if (parseTime < 500) {
      performanceScore += 20;
    } else {
      this.issues.warnings.push('Slow changelog parsing detected');
    }

    // Check for optimization opportunities
    const duplicateEntries = this.findDuplicateEntries(content);
    if (duplicateEntries.length === 0) {
      performanceScore += 25;
    } else {
      this.issues.warnings.push(`Found ${duplicateEntries.length} potential duplicate entries`);
    }

    // Check for maintainability
    const sections = content.match(/^### (.+)$/gm) || [];
    const entriesPerSection = entries.length / Math.max(sections.length, 1);

    if (entriesPerSection <= 20) {
      performanceScore += 25;
    } else {
      this.issues.recommendations.push('Consider splitting large changelog into multiple files');
    }

    this.metrics.performanceRating = Math.min(performanceScore, maxScore);
  }

  /**
   * Find potential duplicate entries
   */
  findDuplicateEntries(content) {
    const entries = content.match(/^- .+$/gm) || [];
    const normalized = entries.map(entry =>
      entry.toLowerCase().replace(/^\s*-\s*/, '').replace(/\([^)]*\)$/, '').trim()
    );

    const duplicates = [];
    const seen = new Set();

    normalized.forEach((entry, index) => {
      if (seen.has(entry)) {
        duplicates.push({ entry: entries[index], index });
      } else {
        seen.add(entry);
      }
    });

    return duplicates;
  }

  /**
   * Calculate overall quality score
   */
  calculateOverallQuality() {
    const weights = {
      formatCompliance: 0.25,
      contentQuality: 0.30,
      consistencyScore: 0.25,
      performanceRating: 0.20
    };

    this.metrics.overallQuality = Object.keys(weights).reduce((total, metric) => {
      return total + (this.metrics[metric] * weights[metric]);
    }, 0);

    // Apply strict mode penalties
    if (this.options.strictMode) {
      if (this.issues.errors.length > 0) {
        this.metrics.overallQuality = Math.max(0, this.metrics.overallQuality - 20);
      }
      if (this.issues.warnings.length > 3) {
        this.metrics.overallQuality = Math.max(0, this.metrics.overallQuality - 10);
      }
    }
  }

  /**
   * Generate comprehensive quality report
   */
  generateQualityReport() {
    console.log(chalk.cyan('\n📊 NASA System 6 Portal - Changelog Quality Report'));
    console.log(chalk.blue('═'.repeat(60)));

    // Quality scores
    console.log(chalk.yellow('📈 Quality Scores:'));
    console.log(`  📝 Format Compliance: ${this.metrics.formatCompliance}%`);
    console.log(`  📊 Content Quality: ${this.metrics.contentQuality}%`);
    console.log(`  🔍 Consistency Score: ${this.metrics.consistencyScore}%`);
    console.log(`  ⚡ Performance Rating: ${this.metrics.performanceRating}%`);
    console.log(chalk.green(`  🎯 Overall Quality: ${Math.round(this.metrics.overallQuality)}%`));

    // Issues summary
    console.log(chalk.yellow('\n🔍 Issues Summary:'));
    console.log(`  ❌ Errors: ${this.issues.errors.length}`);
    console.log(`  ⚠️  Warnings: ${this.issues.warnings.length}`);
    console.log(`  💡 Recommendations: ${this.issues.recommendations.length}`);

    // Detailed issues
    if (this.issues.errors.length > 0) {
      console.log(chalk.red('\n❌ Errors:'));
      this.issues.errors.forEach(error => console.log(`  • ${error}`));
    }

    if (this.issues.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'));
      this.issues.warnings.forEach(warning => console.log(`  • ${warning}`));
    }

    if (this.issues.recommendations.length > 0) {
      console.log(chalk.blue('\n💡 Recommendations:'));
      this.issues.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }

    // Quality rating
    const rating = this.getQualityRating();
    console.log(chalk.cyan(`\n🏆 Quality Rating: ${rating.emoji} ${rating.text}`));

    console.log(chalk.blue('═'.repeat(60)));

    return {
      metrics: this.metrics,
      issues: this.issues,
      rating,
      passed: this.metrics.overallQuality >= this.options.coverageThreshold
    };
  }

  /**
   * Get quality rating based on score
   */
  getQualityRating() {
    const score = this.metrics.overallQuality;

    if (score >= 90) {
      return { emoji: '🏆', text: 'Excellent', color: 'green' };
    } else if (score >= 80) {
      return { emoji: '🥇', text: 'Very Good', color: 'green' };
    } else if (score >= 70) {
      return { emoji: '🥈', text: 'Good', color: 'yellow' };
    } else if (score >= 60) {
      return { emoji: '🥉', text: 'Fair', color: 'yellow' };
    } else {
      return { emoji: '⚠️', text: 'Needs Improvement', color: 'red' };
    }
  }

  /**
   * Fix common quality issues automatically
   */
  async autoFixIssues() {
    console.log(chalk.blue('🔧 Attempting automatic fixes...'));

    let fixesApplied = 0;
    const changelogPath = path.resolve(process.cwd(), this.options.changelogPath);
    let content = fs.readFileSync(changelogPath, 'utf8');

    // Fix missing newline at end of file
    if (!content.endsWith('\n')) {
      content += '\n';
      fixesApplied++;
    }

    // Fix section spacing
    content = content.replace(/^(### .+)$/gm, '$1\n');
    content = content.replace(/\n{3,}/g, '\n\n');

    // Write back fixes
    fs.writeFileSync(changelogPath, content, 'utf8');

    console.log(chalk.green(`✅ Applied ${fixesApplied} automatic fixes`));
    return fixesApplied;
  }
}

// CLI interface
if (require.main === module) {
  const options = {
    strictMode: process.argv.includes('--strict'),
    changelogPath: process.argv.includes('--path')
      ? process.argv[process.argv.indexOf('--path') + 1]
      : 'CHANGELOG.md'
  };

  const qa = new ChangelogQualityAssurance(options);

  qa.runQualityAssurance()
    .then(report => {
      if (!report.passed) {
        console.log(chalk.yellow('\n⚠️  Quality threshold not met'));
        process.exit(1);
      }
      console.log(chalk.green('\n🎉 Quality assurance passed!'));
      process.exit(0);
    })
    .catch(error => {
      console.error(chalk.red('💥 Quality assurance failed:'), error.message);
      process.exit(1);
    });
}

module.exports = ChangelogQualityAssurance;