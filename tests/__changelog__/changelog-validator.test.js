/**
 * NASA System 6 Portal - Changelog Validation Tests
 *
 * Comprehensive test suite for changelog automation system
 * Tests format validation, content validation, and automation reliability
 */

const fs = require('fs');
const path = require('path');
const ChangelogGenerator = require('../../scripts/changelog-generator');

describe('NASA System 6 Portal - Changelog Validation', () => {
  const testChangelogPath = path.join(__dirname, 'test-CHANGELOG.md');
  const changelogGenerator = new ChangelogGenerator({ changelogPath: testChangelogPath });

  beforeEach(() => {
    // Clean up test changelog
    if (fs.existsSync(testChangelogPath)) {
      fs.unlinkSync(testChangelogPath);
    }
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testChangelogPath)) {
      fs.unlinkSync(testChangelogPath);
    }
  });

  describe('Changelog Format Validation', () => {
    test('should validate Keep a Changelog format', () => {
      const validContent = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature implementation

### Fixed
- Critical bug resolution
`;

      fs.writeFileSync(testChangelogPath, validContent);
      const validation = ChangelogGenerator.validateExisting(testChangelogPath);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect missing required sections', () => {
      const invalidContent = `# Project Changelog

## Latest Changes

- Some change
- Another change
`;

      fs.writeFileSync(testChangelogPath, invalidContent);
      const validation = ChangelogGenerator.validateExisting(testChangelogPath);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing changelog header');
      expect(validation.errors).toContain('Missing unreleased section');
    });

    test('should detect incomplete section coverage', () => {
      const partialContent = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature
`;

      fs.writeFileSync(testChangelogPath, partialContent);
      const validation = ChangelogGenerator.validateExisting(testChangelogPath);

      expect(validation.coverage).toBeLessThan(100);
      expect(validation.valid).toBe(true); // Still valid as it has minimum required sections
    });
  });

  describe('Commit Categorization', () => {
    test('should categorize conventional commits correctly', () => {
      const testCommits = [
        { subject: 'feat: add user authentication system', body: '', author: 'Test', date: '2024-01-01' },
        { subject: 'fix: resolve memory leak in components', body: '', author: 'Test', date: '2024-01-01' },
        { subject: 'docs: update API documentation', body: '', author: 'Test', date: '2024-01-01' },
        { subject: 'security: patch vulnerability in NASA API', body: '', author: 'Test', date: '2024-01-01' }
      ];

      testCommits.forEach(commit => {
        const category = changelogGenerator.categorizeCommit(commit);

        if (commit.subject.startsWith('feat:')) {
          expect(category).toBe('added');
        } else if (commit.subject.startsWith('fix:')) {
          expect(category).toBe('fixed');
        } else if (commit.subject.startsWith('docs:')) {
          expect(category).toBe('changed');
        } else if (commit.subject.startsWith('security:')) {
          expect(category).toBe('security');
        }
      });
    });

    test('should handle NASA System 6 Portal specific patterns', () => {
      const testCommits = [
        { subject: 'test: add integration tests for NASA API', body: '', author: 'Test', date: '2024-01-01' },
        { subject: 'deprecated: remove old System 6 components', body: '', author: 'Test', date: '2024-01-01' },
        { subject: 'remove: delete deprecated functionality', body: '', author: 'Test', date: '2024-01-01' },
        { subject: 'v1.2.3: Release version 1.2.3', body: '', author: 'Test', date: '2024-01-01' }
      ];

      const categories = testCommits.map(commit => changelogGenerator.categorizeCommit(commit));

      expect(categories).toContain('changed'); // test: commits
      expect(categories).toContain('deprecated'); // deprecated: commits
      expect(categories).toContain('removed'); // remove: commits
      expect(categories).toContain('version'); // version tags
    });

    test('should handle unknown commit patterns gracefully', () => {
      const unknownCommit = {
        subject: 'some random commit message',
        body: '',
        author: 'Test',
        date: '2024-01-01'
      };

      const category = changelogGenerator.categorizeCommit(unknownCommit);
      expect(category).toBe('changed'); // Default fallback
    });
  });

  describe('Entry Formatting', () => {
    test('should format conventional commits properly', () => {
      const commit = {
        subject: 'feat: implement NASA APOD integration',
        body: 'Added support for astronomy picture of the day with proper error handling',
        hash: 'abc123def456',
        author: 'Test Author'
      };

      const formatted = changelogGenerator.formatCommitEntry(commit);

      expect(formatted).toContain('implement NASA APOD integration');
      expect(formatted).toContain('abc123d');
      expect(formatted).not.toContain('feat:');
    });

    test('should include body content when available', () => {
      const commit = {
        subject: 'fix: resolve API timeout issues',
        body: 'Added retry logic and improved error messages',
        hash: 'xyz789abc123',
        author: 'Test Author'
      };

      const formatted = changelogGenerator.formatCommitEntry(commit);

      expect(formatted).toContain('resolve API timeout issues');
      expect(formatted).toContain('Added retry logic');
    });

    test('should handle commits without body', () => {
      const commit = {
        subject: 'docs: update README',
        body: '',
        hash: 'def456ghi789',
        author: 'Test Author'
      };

      const formatted = changelogGenerator.formatCommitEntry(commit);

      expect(formatted).toContain('update README');
      expect(formatted).toContain('def456g');
      expect(formatted).toMatch(/^- \w+.*\(def456g\)$/);
    });
  });

  describe('Changelog Generation', () => {
    test('should generate changelog from commits', async () => {
      // Mock git history analysis
      changelogGenerator.analyzeGitHistory = jest.fn().mockReturnValue([
        {
          subject: 'feat: add NASA System 6 Portal',
          body: 'Complete nostalgic web application',
          hash: 'abc123',
          author: 'Test',
          date: '2024-01-01'
        },
        {
          subject: 'fix: resolve security vulnerability',
          body: 'Fixed NASA API proxy',
          hash: 'def456',
          author: 'Test',
          date: '2024-01-01'
        }
      ]);

      const result = await changelogGenerator.generate();

      expect(result.success).toBe(true);
      expect(result.entries).toBeDefined();
      expect(result.validation).toBeDefined();
    });

    test('should handle empty commit history', async () => {
      changelogGenerator.analyzeGitHistory = jest.fn().mockReturnValue([]);

      const result = await changelogGenerator.generate();

      expect(result.success).toBe(true);
      expect(result.validation.warnings).toContain('No new entries found for changelog');
    });

    test('should validate NASA System 6 Portal content', async () => {
      changelogGenerator.analyzeGitHistory = jest.fn().mockReturnValue([
        {
          subject: 'feat: NASA System 6 Portal integration',
          body: 'Added complete API support',
          hash: 'abc123',
          author: 'Test',
          date: '2024-01-01'
        }
      ]);

      const result = await changelogGenerator.generate();

      expect(result.validation.warnings).not.toContain(
        'Changelog may not contain NASA System 6 Portal specific content'
      );
    });
  });

  describe('Performance Metrics', () => {
    test('should track generation metrics', async () => {
      changelogGenerator.analyzeGitHistory = jest.fn().mockReturnValue([
        {
          subject: 'feat: add feature',
          body: '',
          hash: 'abc123',
          author: 'Test',
          date: '2024-01-01'
        }
      ]);

      await changelogGenerator.generate();

      expect(changelogGenerator.metrics.commitsProcessed).toBe(1);
      expect(changelogGenerator.metrics.entriesGenerated).toBeGreaterThan(0);
      expect(changelogGenerator.metrics.executionTime).toBeGreaterThan(0);
    });

    test('should calculate generation efficiency', async () => {
      changelogGenerator.analyzeGitHistory = jest.fn().mockReturnValue([
        { subject: 'feat: feature 1', body: '', hash: 'abc1', author: 'Test', date: '2024-01-01' },
        { subject: 'fix: bug 1', body: '', hash: 'def2', author: 'Test', date: '2024-01-01' }
      ]);

      // Capture console output
      const consoleSpy = jest.spyOn(console, 'log');
      await changelogGenerator.generate();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generation Efficiency')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('should handle git analysis errors gracefully', async () => {
      changelogGenerator.analyzeGitHistory = jest.fn().mockImplementation(() => {
        throw new Error('Git command failed');
      });

      await expect(changelogGenerator.generate()).rejects.toThrow();
    });

    test('should handle file system errors', async () => {
      // Test with invalid path
      const invalidGenerator = new ChangelogGenerator({
        changelogPath: '/invalid/path/CHANGELOG.md'
      });

      changelogGenerator.analyzeGitHistory = jest.fn().mockReturnValue([]);

      await expect(invalidGenerator.generate()).rejects.toThrow();
    });
  });

  describe('NASA System 6 Portal Specific Tests', () => {
    test('should recognize NASA-specific commit patterns', () => {
      const nasaCommits = [
        { subject: 'feat: integrate APOD API', body: '', author: 'Test', date: '2024-01-01' },
        { subject: 'security: enhance NASA API proxy', body: '', author: 'Test', date: '2024-01-01' },
        { subject: 'test: add NeoWS integration tests', body: '', author: 'Test', date: '2024-01-01' }
      ];

      const categories = nasaCommits.map(commit => changelogGenerator.categorizeCommit(commit));

      expect(categories).toContain('added'); // APOD API integration
      expect(categories).toContain('security'); // NASA API security
      expect(categories).toContain('changed'); // test commits
    });

    test('should validate NASA System 6 Portal changelog content', () => {
      const nasaContent = `# Changelog

## [Unreleased]

### Added
- NASA APOD API integration with daily space imagery
- Near Earth Object Tracking system
- Authentic System 6 UI components

### Security
- Enhanced NASA API key protection through proxy server
- Implemented proper input sanitization

### Fixed
- Memory leaks in System 6 window management
- API timeout issues with NASA services
`;

      fs.writeFileSync(testChangelogPath, nasaContent);
      const validation = ChangelogGenerator.validateExisting(testChangelogPath);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
});

describe('Changelog Automation Integration', () => {
  test('should integrate with npm scripts', () => {
    // Verify that package.json has the necessary scripts
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    expect(packageJson.scripts).toHaveProperty('changelog');
    expect(packageJson.scripts).toHaveProperty('changelog:all');
    expect(packageJson.scripts).toHaveProperty('version');
  });

  test('should have required dependencies installed', () => {
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    expect(packageJson.devDependencies).toHaveProperty('conventional-changelog-cli');
    expect(packageJson.devDependencies).toHaveProperty('conventional-commits-detector');
    expect(packageJson.devDependencies).toHaveProperty('cz-conventional-changelog');
  });
});