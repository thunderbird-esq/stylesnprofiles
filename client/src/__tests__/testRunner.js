/**
 * Test Runner Script
 * Orchestrates running all tests with coverage reporting
 * Runs unit tests, integration tests, and generates coverage reports
 */

/* eslint-disable */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  coverageThreshold: 85,
  testTimeout: 30000,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`  ${title}`, colors.cyan);
  log(`${'='.repeat(60)}`, colors.cyan);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

function runCommand(command, description, options = {}) {
  log(`\n🔄 ${description}...`, colors.blue);

  try {
    const result = execSync(command, {
      stdio: TEST_CONFIG.verbose ? 'inherit' : 'pipe',
      encoding: 'utf8',
      ...options,
    });

    logSuccess(`${description} completed successfully`);
    return result;
  } catch (error) {
    logError(`${description} failed`);
    if (!TEST_CONFIG.verbose) {
      console.error(error.stdout || error.message);
    }
    throw error;
  }
}

function checkTestCoverage() {
  logSection('Checking Test Coverage');

  const coverageFile = path.join(__dirname, '../../coverage/coverage-summary.json');

  if (!fs.existsSync(coverageFile)) {
    logWarning('Coverage file not found. Run tests with coverage first.');
    return false;
  }

  try {
    const coverageData = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
    const totalCoverage = coverageData.total;

    logInfo('Coverage Summary:');
    log(`  Lines: ${totalCoverage.lines.pct}%`, colors.cyan);
    log(`  Functions: ${totalCoverage.functions.pct}%`, colors.cyan);
    log(`  Branches: ${totalCoverage.branches.pct}%`, colors.cyan);
    log(`  Statements: ${totalCoverage.statements.pct}%`, colors.cyan);

    const overallCoverage = totalCoverage.lines.pct;

    if (overallCoverage >= TEST_CONFIG.coverageThreshold) {
      logSuccess(`Coverage threshold met: ${overallCoverage}% >= ${TEST_CONFIG.coverageThreshold}%`);
      return true;
    } else {
      logError(`Coverage threshold not met: ${overallCoverage}% < ${TEST_CONFIG.coverageThreshold}%`);
      return false;
    }
  } catch (error) {
    logError('Failed to parse coverage data');
    return false;
  }
}

function generateCoverageReport() {
  logSection('Generating Coverage Report');

  const coverageDir = path.join(__dirname, '../../coverage');
  const htmlReport = path.join(coverageDir, 'lcov-report/index.html');

  if (fs.existsSync(htmlReport)) {
    logSuccess(`HTML coverage report generated: ${htmlReport}`);
    logInfo('Open the report in your browser to view detailed coverage information');
  }

  // Generate a summary text file
  try {
    const coverageFile = path.join(coverageDir, 'coverage-summary.json');
    if (fs.existsSync(coverageFile)) {
      const coverageData = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      const summary = `
Coverage Report Summary
======================
Generated: ${new Date().toISOString()}
Threshold: ${TEST_CONFIG.coverageThreshold}%

Overall Coverage:
- Lines: ${coverageData.total.lines.pct}% (${coverageData.total.lines.covered}/${coverageData.total.lines.total})
- Functions: ${coverageData.total.functions.pct}% (${coverageData.total.functions.covered}/${coverageData.total.functions.total})
- Branches: ${coverageData.total.branches.pct}% (${coverageData.total.branches.covered}/${coverageData.total.branches.total})
- Statements: ${coverageData.total.statements.pct}% (${coverageData.total.statements.covered}/${coverageData.total.statements.total})

Files Coverage:
${Object.entries(coverageData)
          .filter(([key]) => key !== 'total')
          .map(([file, data]) => `- ${file}: ${data.lines.pct}%`)
          .join('\n')}
      `;

      fs.writeFileSync(path.join(coverageDir, 'coverage-summary.txt'), summary);
      logSuccess('Coverage summary saved to coverage/coverage-summary.txt');
    }
  } catch (error) {
    logWarning('Failed to generate coverage summary file');
  }
}

function runUnitTests() {
  logSection('Running Unit Tests');

  const command = `
    npm test -- \
      --testPathPattern=__tests__ \
      --testPathIgnorePatterns=integration \
      --collectCoverage=${TEST_CONFIG.collectCoverage} \
      --coverageReporters="${TEST_CONFIG.coverageReporters.join(',')}" \
      --coverageDirectory="${TEST_CONFIG.coverageDirectory}" \
      --testTimeout=${TEST_CONFIG.testTimeout} \
      --verbose=${TEST_CONFIG.verbose} \
      --passWithNoTests
  `;

  runCommand(command, 'Unit Tests');
}

function runIntegrationTests() {
  logSection('Running Integration Tests');

  logInfo('Note: Integration tests require the server to be running on localhost:3001');
  logInfo('Start the server with: cd server && npm start');

  // Check if server is running
  try {
    execSync('curl -f http://localhost:3001/health', { stdio: 'pipe', timeout: 5000 });
    logSuccess('Server is running');
  } catch (error) {
    logWarning('Server is not running or not responding');
    logInfo('Skipping integration tests...');
    return;
  }

  const command = `
    npm test -- \
      --testPathPattern=integration \
      --testTimeout=${TEST_CONFIG.testTimeout} \
      --verbose=${TEST_CONFIG.verbose} \
      --passWithNoTests
  `;

  runCommand(command, 'Integration Tests');
}

function runAllTests() {
  const startTime = Date.now();

  try {
    logSection('User Resources Test Suite');
    logInfo(`Coverage Threshold: ${TEST_CONFIG.coverageThreshold}%`);
    logInfo(`Test Timeout: ${TEST_CONFIG.testTimeout}ms`);

    // Run unit tests
    runUnitTests();

    // Run integration tests
    runIntegrationTests();

    // Check coverage
    const coveragePassed = checkTestCoverage();

    // Generate coverage report
    generateCoverageReport();

    const duration = Date.now() - startTime;
    logSection('Test Suite Complete');

    if (coveragePassed) {
      logSuccess(`All tests completed successfully in ${duration}ms`);
      process.exit(0);
    } else {
      logError(`Tests completed but coverage threshold not met (${duration}ms)`);
      process.exit(1);
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    logError(`Test suite failed after ${duration}ms`);
    process.exit(1);
  }
}

// Command line argument handling
const args = process.argv.slice(2);
const command = args[0] || 'all';

switch (command) {
  case 'unit':
    runUnitTests();
    break;
  case 'integration':
    runIntegrationTests();
    break;
  case 'coverage':
    checkTestCoverage();
    generateCoverageReport();
    break;
  case 'all':
  default:
    runAllTests();
    break;
}

// Export functions for use in other scripts
module.exports = {
  runAllTests,
  runUnitTests,
  runIntegrationTests,
  checkTestCoverage,
  generateCoverageReport,
  TEST_CONFIG,
};