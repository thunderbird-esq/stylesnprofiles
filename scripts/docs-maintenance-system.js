#!/usr/bin/env node

/**
 * NASA System 6 Portal - Documentation Maintenance System
 *
 * Comprehensive documentation maintenance and quality assurance framework
 * Features:
 * - Automated documentation audit and validation
 * - Link checking and reference validation
 * - Content quality and consistency analysis
 * - Style checking and formatting validation
 * - Automated synchronization and version control
 * - Quality assurance reporting and monitoring
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const glob = require('glob');

class DocumentationMaintenanceSystem {
  constructor(options = {}) {
    this.options = {
      rootDir: process.cwd(),
      docsDir: 'docs',
      excludePatterns: ['**/node_modules/**', '**/coverage/**', '**/dist/**'],
      maxFileSize: 1024 * 1024, // 1MB
      maxLinkRetries: 3,
      timeout: 30000,
      ...options
    };

    this.metrics = {
      filesAnalyzed: 0,
      issuesFound: 0,
      issuesFixed: 0,
      linksChecked: 0,
      brokenLinks: 0,
      processingTime: 0
    };

    this.issues = {
      errors: [],
      warnings: [],
      suggestions: [],
      fixed: []
    };

    this.documentationFiles = [];
    this.internalLinks = new Map();
    this.externalLinks = new Set();
    this.imageReferences = new Set();

    this.qualityThresholds = {
      maxWarningsPerFile: 5,
      maxSuggestionsPerFile: 10,
      minReadabilityScore: 60,
      maxFileAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      minSectionCount: 3
    };
  }

  /**
   * Main entry point for documentation maintenance
   */
  async runMaintenance(modes = ['audit', 'validate', 'quality', 'sync']) {
    console.log(chalk.cyan('🚀 NASA System 6 Portal - Documentation Maintenance System'));
    console.log(chalk.blue('📚 Running comprehensive documentation analysis...'));

    const startTime = Date.now();

    try {
      // Step 1: Discover and catalog documentation
      await this.discoverDocumentation();

      // Step 2: Run selected maintenance modes
      for (const mode of modes) {
        console.log(chalk.blue(`\n🔄 Running ${mode.toUpperCase()} mode...`));

        switch (mode) {
          case 'audit':
            await this.runAudit();
            break;
          case 'validate':
            await this.runValidation();
            break;
          case 'quality':
            await this.runQualityCheck();
            break;
          case 'sync':
            await this.runSynchronization();
            break;
          case 'optimize':
            await this.runOptimization();
            break;
          default:
            console.warn(chalk.yellow(`Unknown maintenance mode: ${mode}`));
        }
      }

      // Step 3: Generate comprehensive report
      const report = this.generateMaintenanceReport();

      // Step 4: Save report and metrics
      await this.saveReport(report);

      this.metrics.processingTime = Date.now() - startTime;

      console.log(chalk.green('\n✅ Documentation maintenance completed successfully!'));
      return report;

    } catch (error) {
      console.error(chalk.red('❌ Documentation maintenance failed:'), error.message);
      throw error;
    }
  }

  /**
   * Discover and catalog all documentation files
   */
  async discoverDocumentation() {
    console.log(chalk.blue('🔍 Discovering documentation files...'));

    const patterns = [
      '**/*.md',
      '**/*.rst',
      '**/*.txt',
      '**/README*',
      '**/CHANGELOG*',
      '**/CONTRIBUTING*',
      '**/LICENSE*'
    ];

    this.documentationFiles = [];

    for (const pattern of patterns) {
      const files = glob.sync(pattern, {
        cwd: this.options.rootDir,
        ignore: this.options.excludePatterns,
        absolute: true
      });

      this.documentationFiles.push(...files);
    }

    // Remove duplicates and sort
    this.documentationFiles = [...new Set(this.documentationFiles)].sort();

    console.log(chalk.green(`📄 Discovered ${this.documentationFiles.length} documentation files`));

    // Analyze each file
    for (const filePath of this.documentationFiles) {
      try {
        const fileInfo = await this.analyzeFile(filePath);
        this.documentationFiles = this.documentationFiles.map(f =>
          f === filePath ? fileInfo : f
        );
      } catch (error) {
        this.issues.errors.push({
          type: 'file_analysis_error',
          file: filePath,
          message: error.message,
          severity: 'high'
        });
      }
    }
  }

  /**
   * Analyze individual documentation file
   */
  async analyzeFile(filePath) {
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    const fileInfo = {
      path: filePath,
      size: stats.size,
      modified: stats.mtime,
      content,
      lines: content.split('\n').length,
      words: content.split(/\s+/).length,
      sections: this.countSections(content),
      internalLinks: this.extractInternalLinks(content, filePath),
      externalLinks: this.extractExternalLinks(content),
      images: this.extractImageReferences(content),
      codeBlocks: this.extractCodeBlocks(content),
      todos: this.extractTodos(content)
    };

    // Track links and images for validation
    fileInfo.internalLinks.forEach(link => {
      this.internalLinks.set(link.target, { source: filePath, text: link.text });
    });

    fileInfo.externalLinks.forEach(link => this.externalLinks.add(link));
    fileInfo.images.forEach(img => this.imageReferences.add(img));

    return fileInfo;
  }

  /**
   * Count markdown sections (headers)
   */
  countSections(content) {
    const headers = content.match(/^#{1,6}\s+.*$/gm) || [];
    return headers.length;
  }

  /**
   * Extract internal markdown links
   */
  extractInternalLinks(content, sourceFile) {
    const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    const links = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const [full, text, target] = match;

      // Skip external links
      if (target.match(/^https?:\/\//) || target.startsWith('mailto:')) {
        continue;
      }

      links.push({ text, target, full, sourceFile });
    }

    return links;
  }

  /**
   * Extract external links
   */
  extractExternalLinks(content) {
    const linkRegex = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
    const links = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const [full, text, url] = match;
      links.push({ text, url, full });
    }

    return links;
  }

  /**
   * Extract image references
   */
  extractImageReferences(content) {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [];
    let match;

    while ((match = imageRegex.exec(content)) !== null) {
      const [full, alt, src] = match;
      images.push({ alt, src, full });
    }

    return images;
  }

  /**
   * Extract code blocks
   */
  extractCodeBlocks(content) {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const codeBlocks = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const [full, language, code] = match;
      codeBlocks.push({ language: language || 'text', code: code.trim() });
    }

    return codeBlocks;
  }

  /**
   * Extract TODO/FIXME markers
   */
  extractTodos(content) {
    const todoRegex = /(TODO|FIXME|XXX|HACK)\s*[:\s]*(.*)$/gim;
    const todos = [];
    let match;

    while ((match = todoRegex.exec(content)) !== null) {
      const [full, type, description] = match;
      todos.push({ type, description: description.trim() });
    }

    return todos;
  }

  /**
   * Run comprehensive documentation audit
   */
  async runAudit() {
    console.log(chalk.blue('🔬 Running documentation audit...'));

    let auditIssues = 0;

    for (const file of this.documentationFiles) {
      if (typeof file !== 'object') continue;

      const fileIssues = [];

      // File size check
      if (file.size > this.options.maxFileSize) {
        fileIssues.push({
          type: 'large_file',
          message: `File is ${Math.round(file.size / 1024)}KB, consider splitting`,
          severity: 'warning'
        });
      }

      // File age check
      const age = Date.now() - file.modified.getTime();
      if (age > this.qualityThresholds.maxFileAge) {
        fileIssues.push({
          type: 'old_file',
          message: `File hasn't been updated in ${Math.round(age / (24 * 60 * 60 * 1000))} days`,
          severity: 'suggestion'
        });
      }

      // Content structure check
      if (file.sections < this.qualityThresholds.minSectionCount) {
        fileIssues.push({
          type: 'minimal_structure',
          message: `Only ${file.sections} sections found, consider adding more structure`,
          severity: 'suggestion'
        });
      }

      // TODO/FIXME check
      if (file.todos.length > 0) {
        fileIssues.push({
          type: 'unfinished_tasks',
          message: `${file.todos.length} TODO/FIXME items found`,
          severity: 'warning',
          data: file.todos
        });
      }

      // Empty sections check
      if (file.content.match(/#{1,6}\s+\n*$/gm)) {
        fileIssues.push({
          type: 'empty_sections',
          message: 'Empty section headers found',
          severity: 'warning'
        });
      }

      auditIssues += fileIssues.length;

      // Categorize issues
      fileIssues.forEach(issue => {
        issue.file = file.path;
        if (issue.severity === 'error') this.issues.errors.push(issue);
        else if (issue.severity === 'warning') this.issues.warnings.push(issue);
        else this.issues.suggestions.push(issue);
      });
    }

    console.log(chalk.green(`📊 Audit completed - found ${auditIssues} issues`));
  }

  /**
   * Run validation checks
   */
  async runValidation() {
    console.log(chalk.blue('🔍 Running validation checks...'));

    // Validate internal links
    await this.validateInternalLinks();

    // Validate external links (with rate limiting)
    await this.validateExternalLinks();

    // Validate image references
    await this.validateImages();

    // Validate markdown syntax
    await this.validateMarkdownSyntax();

    console.log(chalk.green(`✅ Validation completed - checked ${this.metrics.linksChecked} links`));
  }

  /**
   * Validate internal links
   */
  async validateInternalLinks() {
    console.log(chalk.blue('🔗 Validating internal links...'));

    let brokenInternalLinks = 0;

    for (const [target, info] of this.internalLinks) {
      const resolvedPath = path.resolve(path.dirname(info.source), target);

      if (!fs.existsSync(resolvedPath)) {
        this.issues.errors.push({
          type: 'broken_internal_link',
          file: info.source,
          target,
          message: `Internal link target not found: ${target}`,
          severity: 'error'
        });
        brokenInternalLinks++;
      }

      this.metrics.linksChecked++;
    }

    if (brokenInternalLinks > 0) {
      console.log(chalk.red(`❌ Found ${brokenInternalLinks} broken internal links`));
    } else {
      console.log(chalk.green('✅ All internal links are valid'));
    }
  }

  /**
   * Validate external links (with rate limiting)
   */
  async validateExternalLinks() {
    console.log(chalk.blue('🌐 Validating external links...'));

    if (this.externalLinks.size === 0) {
      console.log(chalk.blue('ℹ️  No external links to validate'));
      return;
    }

    let validLinks = 0;
    let brokenLinks = 0;

    // Check a sample of links to avoid overwhelming external servers
    const linksToCheck = Array.from(this.externalLinks).slice(0, 20);

    for (const link of linksToCheck) {
      try {
        // Simple HEAD request simulation (in real implementation, use axios or node-fetch)
        await this.checkExternalLink(link.url);
        validLinks++;
      } catch (error) {
        this.issues.warnings.push({
          type: 'broken_external_link',
          url: link.url,
          message: `External link may be broken: ${link.url}`,
          severity: 'warning'
        });
        brokenLinks++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.metrics.linksChecked += linksToCheck.length;
    this.metrics.brokenLinks = brokenLinks;

    console.log(chalk.green(`✅ External link validation: ${validLinks} valid, ${brokenLinks} potentially broken`));
  }

  /**
   * Check external link (placeholder implementation)
   */
  async checkExternalLink(url) {
    // In a real implementation, this would use axios or node-fetch
    // For now, we'll just check if it's a valid URL format
    if (!url.match(/^https?:\/\/.+/)) {
      throw new Error('Invalid URL format');
    }
    return true;
  }

  /**
   * Validate image references
   */
  async validateImages() {
    console.log(chalk.blue('🖼️  Validating image references...'));

    let missingImages = 0;

    for (const image of this.imageReferences) {
      if (image.src.startsWith('http')) {
        // External image - skip validation for now
        continue;
      }

      // Resolve relative image paths
      const imagePath = path.resolve(this.options.rootDir, image.src);

      if (!fs.existsSync(imagePath)) {
        this.issues.errors.push({
          type: 'missing_image',
          src: image.src,
          message: `Image file not found: ${image.src}`,
          severity: 'error'
        });
        missingImages++;
      }

      // Check alt text
      if (!image.alt || image.alt.trim().length === 0) {
        this.issues.suggestions.push({
          type: 'missing_alt_text',
          src: image.src,
          message: `Image missing alt text: ${image.src}`,
          severity: 'suggestion'
        });
      }
    }

    if (missingImages > 0) {
      console.log(chalk.red(`❌ Found ${missingImages} missing images`));
    } else {
      console.log(chalk.green('✅ All image references are valid'));
    }
  }

  /**
   * Validate markdown syntax
   */
  async validateMarkdownSyntax() {
    console.log(chalk.blue('📝 Validating markdown syntax...'));

    let syntaxErrors = 0;

    for (const file of this.documentationFiles) {
      if (typeof file !== 'object') continue;

      const content = file.content;

      // Check for common markdown syntax issues
      const issues = [];

      // Unmatched brackets
      const openBrackets = (content.match(/\[/g) || []).length;
      const closeBrackets = (content.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        issues.push({
          type: 'unmatched_brackets',
          message: 'Unmatched square brackets found'
        });
      }

      // Check for improper header spacing
      if (content.match(/^#{1,6}\S/m)) {
        issues.push({
          type: 'improper_header_spacing',
          message: 'Headers should have space after #'
        });
      }

      // Check for trailing whitespace
      if (content.match(/\s+$/gm)) {
        issues.push({
          type: 'trailing_whitespace',
          message: 'Trailing whitespace found'
        });
      }

      syntaxErrors += issues.length;

      issues.forEach(issue => {
        issue.file = file.path;
        issue.severity = 'warning';
        this.issues.warnings.push(issue);
      });
    }

    console.log(chalk.green(`📝 Syntax validation completed - ${syntaxErrors} issues found`));
  }

  /**
   * Run quality checks
   */
  async runQualityCheck() {
    console.log(chalk.blue('📊 Running quality checks...'));

    for (const file of this.documentationFiles) {
      if (typeof file !== 'object') continue;

      await this.checkFileQuality(file);
    }

    console.log(chalk.green('📊 Quality checks completed'));
  }

  /**
   * Check individual file quality
   */
  async checkFileQuality(file) {
    const qualityIssues = [];

    // Readability analysis
    const readabilityScore = this.calculateReadability(file.content);
    if (readabilityScore < this.qualityThresholds.minReadabilityScore) {
      qualityIssues.push({
        type: 'low_readability',
        message: `Readability score: ${readabilityScore}/100 - consider simplifying`,
        severity: 'suggestion'
      });
    }

    // Content length analysis
    const wordsPerSection = file.words / Math.max(file.sections, 1);
    if (wordsPerSection < 20) {
      qualityIssues.push({
        type: 'sparse_content',
        message: `Average ${wordsPerSection.toFixed(1)} words per section - consider expanding`,
        severity: 'suggestion'
      });
    }

    // Header hierarchy analysis
    const headerHierarchy = this.analyzeHeaderHierarchy(file.content);
    if (!headerHierarchy.valid) {
      qualityIssues.push({
        type: 'improper_header_hierarchy',
        message: headerHierarchy.message,
        severity: 'warning'
      });
    }

    // Categorize quality issues
    qualityIssues.forEach(issue => {
      issue.file = file.path;
      if (issue.severity === 'error') this.issues.errors.push(issue);
      else if (issue.severity === 'warning') this.issues.warnings.push(issue);
      else this.issues.suggestions.push(issue);
    });
  }

  /**
   * Calculate readability score (simplified Flesch Reading Ease)
   */
  calculateReadability(content) {
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const syllables = this.countSyllables(content);

    if (sentences === 0 || words === 0) return 0;

    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Count syllables (simplified)
   */
  countSyllables(text) {
    const words = text.toLowerCase().split(/\s+/);
    const syllableCount = words.reduce((count, word) => {
      const cleanWord = word.replace(/[^a-z]/g, '');
      const syllables = cleanWord.match(/[aeiouy]+/g) || [];
      return count + Math.max(1, syllables.length);
    }, 0);
    return syllableCount;
  }

  /**
   * Analyze header hierarchy
   */
  analyzeHeaderHierarchy(content) {
    const headers = content.match(/^#{1,6}\s+.*$/gm) || [];
    const levels = headers.map(h => h.match(/^#+/)[0].length);

    // Check for proper hierarchy (no skipped levels)
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i - 1] > 1) {
        return {
          valid: false,
          message: `Header level跳过 detected: H${levels[i - 1]} -> H${levels[i]}`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Run synchronization
   */
  async runSynchronization() {
    console.log(chalk.blue('🔄 Running synchronization...'));

    // Check for git changes
    const gitStatus = this.getGitStatus();

    if (gitStatus.modified.length > 0) {
      console.log(chalk.yellow(`⚠️  ${gitStatus.modified.length} files have uncommitted changes`));

      this.issues.suggestions.push({
        type: 'uncommitted_changes',
        message: `${gitStatus.modified.length} documentation files have uncommitted changes`,
        severity: 'suggestion',
        data: gitStatus.modified
      });
    }

    // Check for documentation consistency
    await this.checkDocumentationConsistency();

    console.log(chalk.green('🔄 Synchronization completed'));
  }

  /**
   * Get git status for documentation files
   */
  getGitStatus() {
    try {
      const output = execSync('git status --porcelain', { encoding: 'utf8' });
      const lines = output.trim().split('\n');

      return {
        modified: lines.filter(line => line.startsWith(' M') && line.match(/\.(md|rst|txt)$/i)),
        untracked: lines.filter(line => line.startsWith('??') && line.match(/\.(md|rst|txt)$/i))
      };
    } catch (error) {
      return { modified: [], untracked: [] };
    }
  }

  /**
   * Check documentation consistency
   */
  async checkDocumentationConsistency() {
    // Check for duplicate sections across files
    const sections = new Map();

    for (const file of this.documentationFiles) {
      if (typeof file !== 'object') continue;

      const fileSections = file.content.match(/^#{1,6}\s+(.+)$/gm) || [];

      fileSections.forEach(section => {
        const title = section.replace(/^#{1,6}\s+/, '').trim();
        if (!sections.has(title)) {
          sections.set(title, []);
        }
        sections.get(title).push(file.path);
      });
    }

    // Find sections that appear in multiple files
    for (const [title, files] of sections) {
      if (files.length > 1) {
        this.issues.suggestions.push({
          type: 'duplicate_section',
          message: `Section "${title}" appears in ${files.length} files`,
          severity: 'suggestion',
          data: { title, files }
        });
      }
    }
  }

  /**
   * Run optimization
   */
  async runOptimization() {
    console.log(chalk.blue('⚡ Running optimization...'));

    let fixesApplied = 0;

    for (const file of this.documentationFiles) {
      if (typeof file !== 'object') continue;

      const fixes = await this.optimizeFile(file);
      fixesApplied += fixes;
    }

    console.log(chalk.green(`⚡ Optimization completed - applied ${fixesApplied} fixes`));
  }

  /**
   * Optimize individual file
   */
  async optimizeFile(file) {
    let fixes = 0;
    let content = file.content;

    // Remove trailing whitespace
    const originalLength = content.length;
    content = content.replace(/\s+$/gm, '');
    if (content.length !== originalLength) fixes++;

    // Fix header spacing
    content = content.replace(/^#{1,6}([^\s#])/gm, (match, char) => {
      fixes++;
      return match.replace(/^(#{1,6})(.+)$/, '$1 $2');
    });

    // Save if changes were made
    if (content !== file.content) {
      try {
        fs.writeFileSync(file.path, content, 'utf8');
        this.issues.fixed.push({
          type: 'file_optimization',
          file: file.path,
          message: `Applied ${fixes} optimizations`,
          severity: 'info'
        });
        this.metrics.issuesFixed += fixes;
      } catch (error) {
        this.issues.errors.push({
          type: 'optimization_error',
          file: file.path,
          message: `Failed to save optimizations: ${error.message}`,
          severity: 'error'
        });
      }
    }

    return fixes;
  }

  /**
   * Generate comprehensive maintenance report
   */
  generateMaintenanceReport() {
    this.metrics.filesAnalyzed = this.documentationFiles.length;
    this.metrics.issuesFound = this.issues.errors.length + this.issues.warnings.length + this.issues.suggestions.length;

    console.log(chalk.cyan('\n📊 NASA System 6 Portal - Documentation Maintenance Report'));
    console.log(chalk.blue('═'.repeat(70)));

    // Summary metrics
    console.log(chalk.yellow('📈 Summary Metrics:'));
    console.log(`  📄 Files Analyzed: ${this.metrics.filesAnalyzed}`);
    console.log(`  🔍 Issues Found: ${this.metrics.issuesFound}`);
    console.log(`  ✅ Issues Fixed: ${this.metrics.issuesFixed}`);
    console.log(`  🔗 Links Checked: ${this.metrics.linksChecked}`);
    console.log(`  ❌ Broken Links: ${this.metrics.brokenLinks}`);
    console.log(`  ⏱️  Processing Time: ${this.metrics.processingTime}ms`);

    // Issue breakdown
    console.log(chalk.yellow('\n🔍 Issue Breakdown:'));
    console.log(`  ❌ Errors: ${this.issues.errors.length}`);
    console.log(`  ⚠️  Warnings: ${this.issues.warnings.length}`);
    console.log(`  💡 Suggestions: ${this.issues.suggestions.length}`);
    console.log(`  ✅ Fixed: ${this.issues.fixed.length}`);

    // Quality score
    const qualityScore = this.calculateQualityScore();
    console.log(chalk.green(`\n🏆 Documentation Quality Score: ${qualityScore}/100`));

    // Top issues
    this.displayTopIssues();

    // File-specific metrics
    this.displayFileMetrics();

    console.log(chalk.blue('═'.repeat(70)));

    return {
      metrics: this.metrics,
      issues: this.issues,
      qualityScore,
      files: this.documentationFiles,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Calculate overall documentation quality score
   */
  calculateQualityScore() {
    let score = 100;

    // Deduct for errors
    score -= this.issues.errors.length * 10;

    // Deduct for warnings
    score -= this.issues.warnings.length * 5;

    // Deduct for suggestions
    score -= this.issues.suggestions.length;

    // Bonus for fixes
    score += this.metrics.issuesFixed * 2;

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Display top issues
   */
  displayTopIssues() {
    console.log(chalk.yellow('\n🎯 Top Issues:'));

    const allIssues = [
      ...this.issues.errors.slice(0, 3).map(i => ({ ...i, prefix: '❌' })),
      ...this.issues.warnings.slice(0, 2).map(i => ({ ...i, prefix: '⚠️' }))
    ];

    allIssues.forEach(issue => {
      const fileName = path.basename(issue.file || 'unknown');
      console.log(`  ${issue.prefix} ${fileName}: ${issue.message}`);
    });

    if (allIssues.length === 0) {
      console.log('  ✅ No critical issues found');
    }
  }

  /**
   * Display file-specific metrics
   */
  displayFileMetrics() {
    console.log(chalk.yellow('\n📄 File Metrics:'));

    const fileStats = {
      largestFiles: [],
      oldestFiles: [],
      mostSections: []
    };

    for (const file of this.documentationFiles) {
      if (typeof file !== 'object') continue;

      fileStats.largestFiles.push({ path: file.path, size: file.size });
      fileStats.oldestFiles.push({ path: file.path, modified: file.modified });
      fileStats.mostSections.push({ path: file.path, sections: file.sections });
    }

    // Sort and display top 3
    const sortBy = (arr, key, order = 'desc') => {
      return arr.sort((a, b) => order === 'desc' ? b[key] - a[key] : a[key] - b[key]);
    };

    console.log(`  📊 Largest files:`);
    sortBy(fileStats.largestFiles, 'size').slice(0, 3).forEach((file, i) => {
      const fileName = path.basename(file.path);
      console.log(`    ${i + 1}. ${fileName} (${Math.round(file.size / 1024)}KB)`);
    });

    console.log(`  📅 Most recently updated files:`);
    sortBy(fileStats.oldestFiles, 'modified', 'asc').slice(0, 3).forEach((file, i) => {
      const fileName = path.basename(file.path);
      const daysAgo = Math.round((Date.now() - file.modified) / (24 * 60 * 60 * 1000));
      console.log(`    ${i + 1}. ${fileName} (${daysAgo} days ago)`);
    });
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.issues.errors.length > 0) {
      recommendations.push('Fix critical errors - broken links and missing files');
    }

    if (this.issues.warnings.length > 10) {
      recommendations.push('Review warnings - consider addressing style and content issues');
    }

    if (this.metrics.brokenLinks > 0) {
      recommendations.push('Update or remove broken external links');
    }

    if (this.metrics.filesAnalyzed > 0) {
      const avgIssues = this.metrics.issuesFound / this.metrics.filesAnalyzed;
      if (avgIssues > 5) {
        recommendations.push('Consider improving documentation quality standards');
      }
    }

    // NASA System 6 Portal specific recommendations
    if (!this.hasNasaSystem6Content()) {
      recommendations.push('Add more NASA System 6 Portal specific content and examples');
    }

    return recommendations;
  }

  /**
   * Check for NASA System 6 Portal specific content
   */
  hasNasaSystem6Content() {
    const nasaKeywords = ['nasa', 'space', 'astronomy', 'apod', 'neows'];
    const system6Keywords = ['system 6', 'system6', 'retro', 'chicago'];

    let hasNasaContent = false;
    let hasSystem6Content = false;

    for (const file of this.documentationFiles) {
      if (typeof file !== 'object') continue;

      const content = file.content.toLowerCase();

      if (nasaKeywords.some(keyword => content.includes(keyword))) {
        hasNasaContent = true;
      }

      if (system6Keywords.some(keyword => content.includes(keyword))) {
        hasSystem6Content = true;
      }
    }

    return hasNasaContent && hasSystem6Content;
  }

  /**
   * Save maintenance report
   */
  async saveReport(report) {
    const reportPath = path.join(this.options.rootDir, 'docs', 'maintenance-report.json');
    const markdownPath = path.join(this.options.rootDir, 'docs', 'maintenance-report.md');

    try {
      // Save JSON report
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

      // Save Markdown report
      const markdownReport = this.generateMarkdownReport(report);
      fs.writeFileSync(markdownPath, markdownReport, 'utf8');

      console.log(chalk.green(`📄 Reports saved to ${reportPath} and ${markdownPath}`));
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not save reports: ${error.message}`));
    }
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report) {
    const date = new Date().toISOString().split('T')[0];

    return `# NASA System 6 Portal - Documentation Maintenance Report

**Generated:** ${date}
**Processing Time:** ${report.metrics.processingTime}ms

## Summary

- **Files Analyzed:** ${report.metrics.filesAnalyzed}
- **Issues Found:** ${report.metrics.issuesFound}
- **Issues Fixed:** ${report.metrics.issuesFixed}
- **Links Checked:** ${report.metrics.linksChecked}
- **Broken Links:** ${report.metrics.brokenLinks}
- **Quality Score:** ${report.qualityScore}/100

## Issue Breakdown

- **Errors:** ${report.issues.errors.length}
- **Warnings:** ${report.issues.warnings.length}
- **Suggestions:** ${report.issues.suggestions.length}
- **Fixed:** ${report.issues.fixed.length}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n') || '- No specific recommendations'}

## Issues Details

### Errors (${report.issues.errors.length})

${report.issues.errors.map(error =>
  `**${path.basename(error.file || 'unknown')}:** ${error.message}`
).join('\n') || '- No errors found'}

### Warnings (${report.issues.warnings.length})

${report.issues.warnings.map(warning =>
  `**${path.basename(warning.file || 'unknown')}:** ${warning.message}`
).join('\n') || '- No warnings found'}

### Suggestions (${report.issues.suggestions.length})

${report.issues.suggestions.map(suggestion =>
  `**${path.basename(suggestion.file || 'unknown')}:** ${suggestion.message}`
).join('\n') || '- No suggestions found'}

---

*Report generated by NASA System 6 Portal Documentation Maintenance System*
`;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const modes = args.length > 0 ? args : ['audit', 'validate', 'quality'];

  const options = {
    docsDir: process.env.DOCS_DIR || 'docs'
  };

  const maintenanceSystem = new DocumentationMaintenanceSystem(options);

  maintenanceSystem.runMaintenance(modes)
    .then(report => {
      if (report.metrics.issuesFound === 0 || report.qualityScore >= 80) {
        console.log(chalk.green('🎉 Documentation maintenance completed successfully!'));
        process.exit(0);
      } else {
        console.log(chalk.yellow('⚠️  Documentation maintenance completed with issues found'));
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(chalk.red('💥 Documentation maintenance failed:'), error.message);
      process.exit(1);
    });
}

module.exports = DocumentationMaintenanceSystem;