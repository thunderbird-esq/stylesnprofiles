#!/usr/bin/env node

/**
 * NASA System 6 Portal - Changelog Automation System
 *
 * Advanced changelog generation with validation, testing, and CI/CD integration
 * Features:
 * - Automated changelog generation from git commits
 * - Format validation and quality checks
 * - Semantic versioning integration
 * - CI/CD pipeline integration
 * - Performance monitoring and reporting
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class ChangelogGenerator {
  constructor(options = {}) {
    this.options = {
      changelogPath: 'CHANGELOG.md',
      template: 'keepachangelog',
      preset: 'angular',
      versionPrefix: 'v',
      dateFormat: 'YYYY-MM-DD',
      ...options
    };

    this.metrics = {
      commitsProcessed: 0,
      entriesGenerated: 0,
      validationErrors: 0,
      executionTime: 0
    };

    this.startTime = Date.now();
  }

  /**
   * Main entry point for changelog generation
   */
  async generate(options = {}) {
    console.log(chalk.cyan('🚀 NASA System 6 Portal - Changelog Automation System'));
    console.log(chalk.blue('📝 Generating comprehensive changelog...'));

    try {
      const config = { ...this.options, ...options };

      // Step 1: Analyze git history
      const commitHistory = this.analyzeGitHistory();

      // Step 2: Generate changelog entries
      const changelogEntries = this.generateEntries(commitHistory);

      // Step 3: Validate format and content
      const validationResults = this.validateChangelog(changelogEntries);

      // Step 4: Update changelog file
      await this.updateChangelog(changelogEntries, config);

      // Step 5: Generate metrics report
      this.generateReport();

      console.log(chalk.green('✅ Changelog generation completed successfully!'));
      return { success: true, entries: changelogEntries, validation: validationResults };

    } catch (error) {
      console.error(chalk.red('❌ Changelog generation failed:'), error.message);
      throw error;
    }
  }

  /**
   * Analyze git history for changelog generation
   */
  analyzeGitHistory() {
    console.log(chalk.blue('🔍 Analyzing git history...'));

    try {
      // Get all commits since last version
      const lastVersion = this.getLastVersion();
      const commitRange = lastVersion ? `${lastVersion}..HEAD` : '';

      const commits = execSync(`git log ${commitRange} --pretty=format:'%H|%s|%b|%an|%ad' --date=short`,
        { encoding: 'utf8', cwd: process.cwd() })
        .trim()
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [hash, subject, body, author, date] = line.split('|');
          return { hash, subject, body: body.trim(), author, date };
        });

      this.metrics.commitsProcessed = commits.length;
      console.log(chalk.green(`📊 Analyzed ${commits.length} commits`));

      return commits;
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not analyze git history, using empty history'));
      return [];
    }
  }

  /**
   * Generate changelog entries from commit history
   */
  generateEntries(commits) {
    console.log(chalk.blue('📝 Generating changelog entries...'));

    const entries = {
      unreleased: {
        added: [],
        changed: [],
        deprecated: [],
        removed: [],
        fixed: [],
        security: []
      },
      versions: []
    };

    // Categorize commits based on conventional commit format
    commits.forEach(commit => {
      const category = this.categorizeCommit(commit);
      const entry = this.formatCommitEntry(commit);

      if (category === 'version') {
        // Handle version releases
        entries.versions.push(entry);
      } else if (entries.unreleased[category]) {
        entries.unreleased[category].push(entry);
      }
    });

    this.metrics.entriesGenerated = Object.values(entries.unreleased)
      .reduce((total, section) => total + section.length, 0) + entries.versions.length;

    console.log(chalk.green(`📋 Generated ${this.metrics.entriesGenerated} entries`));

    return entries;
  }

  /**
   * Categorize commit based on conventional commit format
   */
  categorizeCommit(commit) {
    const { subject } = commit;

    // Check for version tags
    if (subject.match(/^(v?\d+\.\d+\.\d+)/)) {
      return 'version';
    }

    // Conventional commit types
    if (subject.startsWith('feat:')) return 'added';
    if (subject.startsWith('fix:')) return 'fixed';
    if (subject.startsWith('perf:')) return 'changed';
    if (subject.startsWith('refactor:')) return 'changed';
    if (subject.startsWith('docs:')) return 'changed';
    if (subject.startsWith('style:')) return 'changed';
    if (subject.startsWith('test:')) return 'changed';
    if (subject.startsWith('build:')) return 'changed';
    if (subject.startsWith('ci:')) return 'changed';
    if (subject.startsWith('chore:')) return 'changed';
    if (subject.startsWith('security:')) return 'security';

    // NASA System 6 Portal specific patterns
    if (subject.match(/^(chore|setup|config):/)) return 'changed';
    if (subject.match(/^security:/)) return 'security';
    if (subject.match(/^(deprecated|deprecate):/)) return 'deprecated';
    if (subject.match(/^(remove|delete):/)) return 'removed';

    // Default to 'changed' for unknown patterns
    return 'changed';
  }

  /**
   * Format commit entry for changelog
   */
  formatCommitEntry(commit) {
    const { subject, body, hash, author } = commit;

    // Extract clean message without conventional commit prefix
    const cleanSubject = subject.replace(/^(feat|fix|perf|refactor|docs|style|test|build|ci|chore|security)(\(.+\))?:\s*/, '');

    let entry = `- ${cleanSubject}`;

    // Add additional context from body if available
    if (body && body.trim()) {
      const bodyLines = body.trim().split('\n');
      const firstLine = bodyLines[0].trim();
      if (firstLine && firstLine !== cleanSubject) {
        entry += ` - ${firstLine}`;
      }
    }

    // Add commit hash reference for detailed tracking
    entry += ` (${hash.substring(0, 7)})`;

    return entry;
  }

  /**
   * Validate changelog format and content
   */
  validateChangelog(entries) {
    console.log(chalk.blue('🔍 Validating changelog format and content...'));

    const validationResults = {
      format: true,
      content: true,
      structure: true,
      errors: [],
      warnings: []
    };

    // Check if we have meaningful entries
    const totalEntries = Object.values(entries.unreleased)
      .reduce((total, section) => total + section.length, 0);

    if (totalEntries === 0) {
      validationResults.warnings.push('No new entries found for changelog');
    }

    // Validate Keep a Changelog format
    const requiredSections = ['added', 'changed', 'deprecated', 'removed', 'fixed', 'security'];
    const presentSections = Object.keys(entries.unreleased).filter(key =>
      entries.unreleased[key].length > 0
    );

    if (presentSections.length === 0) {
      validationResults.warnings.push('No changelog sections have entries');
    }

    // Check for NASA System 6 Portal specific content
    const allText = Object.values(entries.unreleased).flat().join(' ').toLowerCase();
    const portalKeywords = ['nasa', 'system6', 'test', 'api', 'security', 'documentation'];

    if (!portalKeywords.some(keyword => allText.includes(keyword))) {
      validationResults.warnings.push('Changelog may not contain NASA System 6 Portal specific content');
    }

    // Count validation errors
    this.metrics.validationErrors = validationResults.errors.length;

    console.log(chalk.green(`✅ Validation completed - ${validationResults.errors.length} errors, ${validationResults.warnings.length} warnings`));

    return validationResults;
  }

  /**
   * Update changelog file with new entries
   */
  async updateChangelog(entries, config) {
    console.log(chalk.blue('📄 Updating changelog file...'));

    const changelogPath = path.resolve(process.cwd(), config.changelogPath);

    try {
      // Read existing changelog or create new one
      let existingContent = '';
      if (fs.existsSync(changelogPath)) {
        existingContent = fs.readFileSync(changelogPath, 'utf8');
      }

      // Generate new changelog content
      const newContent = this.generateChangelogContent(entries, existingContent);

      // Write updated changelog
      fs.writeFileSync(changelogPath, newContent, 'utf8');

      console.log(chalk.green(`📝 Updated changelog at ${config.changelogPath}`));

    } catch (error) {
      throw new Error(`Failed to update changelog file: ${error.message}`);
    }
  }

  /**
   * Generate complete changelog content
   */
  generateChangelogContent(entries, existingContent) {
    const today = new Date().toISOString().split('T')[0];

    let content = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

`;

    // Add unreleased sections
    const sections = ['added', 'changed', 'deprecated', 'removed', 'fixed', 'security'];

    sections.forEach(section => {
      if (entries.unreleased[section].length > 0) {
        content += `### ${section.charAt(0).toUpperCase() + section.slice(1)}\n\n`;
        entries.unreleased[section].forEach(entry => {
          content += `${entry}\n`;
        });
        content += '\n';
      }
    });

    // Find where to insert new content in existing changelog
    if (existingContent) {
      const unreleasedMatch = existingContent.match(/## \[Unreleased\]/);
      if (unreleasedMatch) {
        // Replace existing unreleased section
        const afterUnreleased = existingContent.indexOf('\n\n', unreleasedMatch.index);
        if (afterUnreleased > 0) {
          return content + existingContent.substring(afterUnreleased + 2);
        }
      }
    }

    return content;
  }

  /**
   * Get the last version from git tags
   */
  getLastVersion() {
    try {
      const output = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' });
      return output.trim();
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate performance and metrics report
   */
  generateReport() {
    this.metrics.executionTime = Date.now() - this.startTime;

    console.log(chalk.cyan('\n📊 Changelog Generation Report'));
    console.log(chalk.blue('═'.repeat(40)));
    console.log(`📝 Commits Processed: ${this.metrics.commitsProcessed}`);
    console.log(`📋 Entries Generated: ${this.metrics.entriesGenerated}`);
    console.log(`🔍 Validation Errors: ${this.metrics.validationErrors}`);
    console.log(`⏱️  Execution Time: ${this.metrics.executionTime}ms`);

    const efficiency = this.metrics.commitsProcessed > 0
      ? Math.round((this.metrics.entriesGenerated / this.metrics.commitsProcessed) * 100)
      : 0;
    console.log(`📈 Generation Efficiency: ${efficiency}%`);

    console.log(chalk.blue('═'.repeat(40)));
  }

  /**
   * Validate existing changelog file
   */
  static validateExisting(changelogPath = 'CHANGELOG.md') {
    const fullPath = path.resolve(process.cwd(), changelogPath);

    if (!fs.existsSync(fullPath)) {
      return { valid: false, errors: ['Changelog file does not exist'] };
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const errors = [];

    // Check for required sections
    if (!content.includes('# Changelog')) {
      errors.push('Missing changelog header');
    }

    if (!content.includes('## [Unreleased]')) {
      errors.push('Missing unreleased section');
    }

    // Check Keep a Changelog format
    const requiredHeaders = ['### Added', '### Changed', '### Fixed', '### Security'];
    const missingHeaders = requiredHeaders.filter(header => !content.includes(header));

    if (missingHeaders.length > 0) {
      errors.push(`Missing required sections: ${missingHeaders.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
      coverage: Math.round((requiredHeaders.length - missingHeaders.length) / requiredHeaders.length * 100)
    };
  }
}

// CLI interface
if (require.main === module) {
  const options = {
    changelogPath: process.argv.includes('--path')
      ? process.argv[process.argv.indexOf('--path') + 1]
      : 'CHANGELOG.md'
  };

  const generator = new ChangelogGenerator(options);

  generator.generate()
    .then(result => {
      if (result.success) {
        console.log(chalk.green('🎉 Changelog automation completed successfully!'));
        process.exit(0);
      } else {
        console.log(chalk.yellow('⚠️  Changelog generation completed with warnings'));
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(chalk.red('💥 Changelog generation failed:'), error.message);
      process.exit(1);
    });
}

module.exports = ChangelogGenerator;