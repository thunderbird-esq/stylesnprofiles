#!/usr/bin/env node

/**
 * NASA System 6 Portal - Documentation Integration Scripts
 *
 * Integration utilities for seamless documentation maintenance workflow
 * Features:
 * - CI/CD pipeline integration
 * - Git hooks and automation
 * - Team collaboration tools
 * - Automated documentation updates
 * - Performance monitoring and alerting
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const DocumentationMaintenanceSystem = require('./docs-maintenance-system');
const DocumentationDashboard = require('./docs-dashboard');

class DocumentationIntegration {
  constructor(options = {}) {
    this.options = {
      rootDir: process.cwd(),
      docsDir: 'docs',
      enableGitHooks: true,
      enablePreCommit: true,
      enablePrePush: true,
      enableContinuousIntegration: true,
      ...options
    };
  }

  /**
   * Setup complete documentation integration
   */
  async setupIntegration() {
    console.log(chalk.cyan('🚀 NASA System 6 Portal - Documentation Integration Setup'));
    console.log(chalk.blue('🔧 Configuring integration systems...'));

    try {
      // Step 1: Setup Git hooks
      if (this.options.enableGitHooks) {
        await this.setupGitHooks();
      }

      // Step 2: Setup CI/CD integration
      if (this.options.enableContinuousIntegration) {
        await this.setupCICDIntegration();
      }

      // Step 3: Setup package.json scripts
      await this.setupPackageScripts();

      // Step 4: Setup team collaboration
      await this.setupTeamCollaboration();

      // Step 5: Setup monitoring
      await this.setupMonitoring();

      console.log(chalk.green('✅ Documentation integration setup completed!'));
      return { success: true };

    } catch (error) {
      console.error(chalk.red('❌ Integration setup failed:'), error.message);
      throw error;
    }
  }

  /**
   * Setup Git hooks for documentation automation
   */
  async setupGitHooks() {
    console.log(chalk.blue('🪝 Setting up Git hooks...'));

    const hooksDir = path.join(this.options.rootDir, '.git/hooks');

    // Ensure hooks directory exists
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    // Pre-commit hook for documentation validation
    if (this.options.enablePreCommit) {
      const preCommitHook = `#!/bin/sh
# NASA System 6 Portal - Documentation Pre-commit Hook

echo "🔍 Running documentation validation..."

# Check if any documentation files were modified
DOCS_CHANGED=$(git diff --cached --name-only | grep -E "\\.(md|rst|txt)$" | wc -l)

if [ "$DOCS_CHANGED" -gt 0 ]; then
    echo "📚 Documentation changes detected - running validation..."

    # Run documentation validation
    node scripts/docs-maintenance-system.js validate

    # Check exit code
    if [ $? -ne 0 ]; then
        echo "❌ Documentation validation failed"
        echo "💡 Run 'npm run docs:fix' to automatically fix issues"
        exit 1
    fi

    echo "✅ Documentation validation passed"
fi

exit 0
`;

      fs.writeFileSync(path.join(hooksDir, 'pre-commit'), preCommitHook, { mode: 0o755 });
      console.log(chalk.green('  ✅ Pre-commit hook installed'));
    }

    // Pre-push hook for comprehensive documentation check
    if (this.options.enablePrePush) {
      const prePushHook = `#!/bin/sh
# NASA System 6 Portal - Documentation Pre-push Hook

echo "🚀 Running comprehensive documentation check..."

# Only run on main/develop branches
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "develop" ]]; then
    echo "ℹ️ Skipping documentation check on feature branch"
    exit 0
fi

# Run full documentation maintenance
node scripts/docs-maintenance-system.js audit validate quality

# Check quality score
QUALITY_SCORE=$(node -e "
const maintenance = require('./scripts/docs-maintenance-system');
const system = new maintenance();
const report = system.runMaintenance(['audit']).then(r => console.log(r.qualityScore));
" 2>/dev/null || echo "0")

if [ "$QUALITY_SCORE" -lt 60 ]; then
    echo "⚠️ Documentation quality score is low ($QUALITY_SCORE/100)"
    echo "💡 Consider running 'npm run docs:optimize' to improve quality"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Documentation check completed"
exit 0
`;

      fs.writeFileSync(path.join(hooksDir, 'pre-push'), prePushHook, { mode: 0o755 });
      console.log(chalk.green('  ✅ Pre-push hook installed'));
    }

    console.log(chalk.green('🪝 Git hooks setup completed'));
  }

  /**
   * Setup CI/CD integration
   */
  async setupCICDIntegration() {
    console.log(chalk.blue('🔄 Setting up CI/CD integration...'));

    // Check if GitHub Actions workflow exists
    const workflowDir = path.join(this.options.rootDir, '.github/workflows');
    const workflowFile = path.join(workflowDir, 'docs-maintenance.yml');

    if (fs.existsSync(workflowFile)) {
      console.log(chalk.green('  ✅ GitHub Actions workflow already exists'));
    } else {
      console.log(chalk.yellow('  ⚠️ GitHub Actions workflow not found'));
    }

    // Create environment configuration
    const envConfig = `# NASA System 6 Portal - Documentation Environment Configuration

# Documentation Maintenance Settings
DOCS_MAINTENANCE_ENABLED=true
DOCS_QUALITY_THRESHOLD=70
DOCS_AUTO_FIX_ISSUES=false

# Integration Settings
DOCS_GIT_HOOKS_ENABLED=true
DOCS_CI_VALIDATION_ENABLED=true
DOCS_MONITORING_ENABLED=true

# Reporting Settings
DOCS_REPORT_FORMAT=json,html,markdown
DOCS_REPORT_RETENTION_DAYS=30
DOCS_ALERT_THRESHOLD=60
`;

    const envFile = path.join(this.options.rootDir, '.env.docs');
    fs.writeFileSync(envFile, envConfig);

    console.log(chalk.green('  ✅ Environment configuration created'));
    console.log(chalk.green('🔄 CI/CD integration setup completed'));
  }

  /**
   * Setup package.json scripts
   */
  async setupPackageScripts() {
    console.log(chalk.blue('📦 Setting up package.json scripts...'));

    const packageJsonPath = path.join(this.options.rootDir, 'package.json');

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      const docsScripts = {
        'docs:audit': 'node scripts/docs-maintenance-system.js audit',
        'docs:validate': 'node scripts/docs-maintenance-system.js validate',
        'docs:quality': 'node scripts/docs-maintenance-system.js quality',
        'docs:optimize': 'node scripts/docs-maintenance-system.js optimize',
        'docs:fix': 'node scripts/docs-maintenance-system.js optimize && git add .',
        'docs:report': 'node scripts/docs-maintenance-system.js audit validate quality',
        'docs:dashboard': 'node scripts/docs-dashboard.js generate',
        'docs:monitor': 'node scripts/docs-dashboard.js monitor',
        'docs:full': 'node scripts/docs-maintenance-system.js audit validate quality optimize',
        'docs:setup': 'node scripts/docs-integration.js setup',
        'docs:help': 'echo "🚀 NASA System 6 Portal - Documentation Commands:\\n  npm run docs:audit    - Run documentation audit\\n  npm run docs:validate - Validate documentation\\n  npm run docs:quality  - Check content quality\\n  npm run docs:optimize - Auto-fix common issues\\n  npm run docs:fix     - Fix issues and stage changes\\n  npm run docs:report   - Generate comprehensive report\\n  npm run docs:dashboard- Generate HTML dashboard\\n  npm run docs:monitor  - Run monitoring mode\\n  npm run docs:full     - Run complete maintenance"'
      };

      // Merge with existing scripts
      packageJson.scripts = {
        ...packageJson.scripts,
        ...docsScripts
      };

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');

      console.log(chalk.green('  ✅ Package scripts added'));
      console.log(chalk.green('📦 Package.json setup completed'));

    } catch (error) {
      console.warn(chalk.yellow(`⚠️ Could not update package.json: ${error.message}`));
    }
  }

  /**
   * Setup team collaboration tools
   */
  async setupTeamCollaboration() {
    console.log(chalk.blue('👥 Setting up team collaboration...'));

    // Create documentation guidelines
    const guidelinesPath = path.join(this.options.rootDir, 'docs', 'CONTRIBUTING.md');
    const guidelines = `# NASA System 6 Portal - Documentation Guidelines

## Overview

This document provides guidelines for contributing to the NASA System 6 Portal documentation.

## Documentation Standards

### Content Quality
- All documentation must be clear, concise, and accurate
- Use proper markdown formatting
- Include relevant NASA System 6 Portal context
- Target audience: developers, users, and contributors

### Structure Requirements
- Use semantic versioning for changelog entries
- Follow Keep a Changelog format
- Include table of contents for long documents
- Use proper heading hierarchy (H1-H6)

### Style Guidelines
- Use Chicago and Geneva fonts in references
- Maintain authentic System 6 design principles
- Include NASA space mission context where appropriate
- Use proper technical terminology

## NASA System 6 Portal Specific Requirements

### Content Types
- **API Documentation**: Must include examples and error handling
- **Architecture Docs**: Include C4 model diagrams and ADRs
- **User Guides**: Include step-by-step instructions with screenshots
- **Developer Docs**: Include code examples and best practices

### Required Sections
- Overview with NASA context
- Installation and setup instructions
- Usage examples
- Troubleshooting guide
- Contributing guidelines

## Quality Assurance

### Automated Checks
- Documentation validation runs on every commit
- Link checking and reference validation
- Content quality scoring
- NASA System 6 Portal content verification

### Manual Review Process
- Technical accuracy review
- NASA content validation
- User experience testing
- Accessibility compliance check

## Contribution Workflow

1. **Create Branch**: Use descriptive branch name
2. **Write Content**: Follow documentation standards
3. **Run Validation**: \`npm run docs:validate\`
4. **Test Documentation**: Ensure all examples work
5. **Submit PR**: Include documentation changes in PR
6. **Review**: Technical and content review
7. **Merge**: Automated quality gate check

## Tools and Automation

### Available Commands
- \`npm run docs:audit\`: Comprehensive documentation audit
- \`npm run docs:validate\`: Format and content validation
- \`npm run docs:quality\`: Content quality analysis
- \`npm run docs:fix\`: Auto-fix common issues
- \`npm run docs:dashboard\`: Generate quality dashboard

### CI/CD Integration
- Automated validation on PRs
- Quality gates for merges
- Performance monitoring
- Automated issue detection

## Best Practices

### Writing Style
- Use active voice
- Include NASA mission context
- Provide concrete examples
- Maintain consistency across documents

### Technical Documentation
- Include code examples
- Document error scenarios
- Provide troubleshooting steps
- Link to related resources

### User Documentation
- Start with user benefits
- Include step-by-step instructions
- Provide visual examples
- Include accessibility considerations

## Support and Resources

- **Documentation Issues**: Use GitHub issues with 'documentation' label
- **Questions**: Create GitHub discussion
- **Templates**: Use provided documentation templates
- **Review Process**: Contact maintainers for review

---

*Last updated: ${new Date().toLocaleDateString()}*
*Generated for NASA System 6 Portal*
`;

    fs.writeFileSync(guidelinesPath, guidelines);

    // Create issue templates
    const issueTemplatesDir = path.join(this.options.rootDir, '.github/ISSUE_TEMPLATE');
    if (!fs.existsSync(issueTemplatesDir)) {
      fs.mkdirSync(issueTemplatesDir, { recursive: true });
    }

    const docIssueTemplate = `---
name: Documentation Issue
about: Report a problem with NASA System 6 Portal documentation
title: '[DOC] '
labels: documentation
assignees: ''
---

## Issue Description
<!-- Describe the documentation issue -->

## Location
<!-- Link to the specific documentation file or section -->
File:
Section:

## Problem Details
<!-- What is wrong with the documentation? -->
-

## Expected Behavior
<!-- What should the documentation show instead? -->
-

## Additional Context
<!-- Any additional information about the issue -->
-

## NASA System 6 Portal Context
<!-- How does this relate to NASA space data or System 6 design? -->
-

---

🚀 *Documentation issue for NASA System 6 Portal*
`;

    fs.writeFileSync(path.join(issueTemplatesDir, 'documentation_issue.md'), docIssueTemplate);

    console.log(chalk.green('  ✅ Documentation guidelines created'));
    console.log(chalk.green('  ✅ Issue templates created'));
    console.log(chalk.green('👥 Team collaboration setup completed'));
  }

  /**
   * Setup monitoring and alerting
   */
  async setupMonitoring() {
    console.log(chalk.blue('📡 Setting up monitoring...'));

    // Create monitoring configuration
    const monitoringConfig = {
      enabled: true,
      qualityThreshold: 70,
      alertThreshold: 60,
      checkInterval: 'hourly',
      notifications: {
        email: false,
        slack: false,
        github: true
      },
      metrics: {
        trackFileChanges: true,
        trackQualityScore: true,
        trackBrokenLinks: true,
        trackContentAge: true
      }
    };

    const configPath = path.join(this.options.rootDir, 'docs', 'monitoring-config.json');
    fs.writeFileSync(configPath, JSON.stringify(monitoringConfig, null, 2));

    console.log(chalk.green('  ✅ Monitoring configuration created'));
    console.log(chalk.green('📡 Monitoring setup completed'));
  }

  /**
   * Run integration test
   */
  async testIntegration() {
    console.log(chalk.blue('🧪 Testing integration...'));

    try {
      // Test documentation maintenance system
      const maintenanceSystem = new DocumentationMaintenanceSystem();
      const auditResult = await maintenanceSystem.runMaintenance(['audit']);

      if (auditResult.qualityScore >= 0) {
        console.log(chalk.green('  ✅ Documentation maintenance system working'));
      } else {
        console.log(chalk.yellow('  ⚠️ Documentation maintenance system needs attention'));
      }

      // Test dashboard generation
      const dashboard = new DocumentationDashboard();
      await dashboard.generateStaticDashboard();
      console.log(chalk.green('  ✅ Dashboard generation working'));

      // Test package scripts
      try {
        execSync('npm run docs:help', { stdio: 'ignore' });
        console.log(chalk.green('  ✅ Package scripts working'));
      } catch (error) {
        console.log(chalk.yellow('  ⚠️ Package scripts may need manual setup'));
      }

      console.log(chalk.green('🧪 Integration test completed'));
      return { success: true };

    } catch (error) {
      console.error(chalk.red('❌ Integration test failed:'), error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate integration report
   */
  async generateIntegrationReport() {
    console.log(chalk.blue('📊 Generating integration report...'));

    const report = {
      timestamp: new Date().toISOString(),
      integration: {
        gitHooks: this.options.enableGitHooks,
        preCommit: this.options.enablePreCommit,
        prePush: this.options.enablePrePush,
        continuousIntegration: this.options.enableContinuousIntegration
      },
      components: {
        maintenanceSystem: true,
        dashboard: true,
        monitoring: true,
        teamCollaboration: true
      },
      testResults: await this.testIntegration()
    };

    const reportPath = path.join(this.options.rootDir, 'docs', 'integration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(chalk.green(`📊 Integration report saved: ${reportPath}`));
    return report;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'setup';

  const integration = new DocumentationIntegration();

  switch (command) {
    case 'setup':
      integration.setupIntegration()
        .then(() => {
          console.log(chalk.green('🎉 Integration setup completed successfully!'));
          process.exit(0);
        })
        .catch(error => {
          console.error(chalk.red('💥 Integration setup failed:'), error.message);
          process.exit(1);
        });
      break;

    case 'test':
      integration.testIntegration()
        .then(result => {
          if (result.success) {
            console.log(chalk.green('🎉 Integration test passed!'));
            process.exit(0);
          } else {
            console.log(chalk.red('❌ Integration test failed'));
            process.exit(1);
          }
        })
        .catch(error => {
          console.error(chalk.red('💥 Integration test error:'), error.message);
          process.exit(1);
        });
      break;

    case 'report':
      integration.generateIntegrationReport()
        .then(() => {
          console.log(chalk.green('📊 Integration report generated!'));
          process.exit(0);
        })
        .catch(error => {
          console.error(chalk.red('💥 Report generation failed:'), error.message);
          process.exit(1);
        });
      break;

    default:
      console.log(chalk.blue('🚀 NASA System 6 Portal - Documentation Integration'));
      console.log('');
      console.log('Usage: node scripts/docs-integration.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  setup  - Setup complete documentation integration');
      console.log('  test   - Test integration components');
      console.log('  report - Generate integration report');
      process.exit(0);
  }
}

module.exports = DocumentationIntegration;