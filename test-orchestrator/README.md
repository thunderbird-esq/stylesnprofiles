# NASA System 6 Portal - Intelligent Test Automation Orchestrator

🚀 **Advanced test orchestration system with intelligent execution, parallel processing, and comprehensive monitoring**

## Overview

The Test Orchestrator is a sophisticated test execution engine designed specifically for the NASA System 6 Portal project. It provides intelligent test discovery, parallel execution optimization, resource management, and comprehensive analytics.

## Features

### 🧠 **Intelligence & Optimization**
- **Smart Test Discovery**: Automatically discovers and classifies all tests
- **Intelligent Scheduling**: Optimizes test execution order based on dependencies
- **Smart Selection**: Runs only relevant tests based on code changes
- **Predictive Analysis**: Learns from historical execution patterns

### ⚡ **Performance & Parallelization**
- **Multi-threaded Execution**: Utilizes worker threads for true parallelization
- **Resource Pooling**: Intelligent memory, CPU, and connection management
- **Adaptive Batching**: Dynamically adjusts batch sizes for optimal performance
- **Load Balancing**: Distributes tests across available resources

### 📊 **Monitoring & Analytics**
- **Real-time Monitoring**: Live performance metrics and resource usage tracking
- **Comprehensive Reporting**: HTML, JSON, JUnit, and Markdown reports
- **Trend Analysis**: Historical performance tracking and pattern detection
- **Alert System**: Proactive notifications for performance issues

### 🔧 **Flexibility & Extensibility**
- **Multiple Strategies**: Fast Feedback, Comprehensive, Smoke Test, Performance modes
- **CI/CD Integration**: Seamless GitHub Actions integration
- **Configurable**: Extensive configuration options for different environments
- **Plugin Architecture**: Easy to extend with custom reporters and analyzers

## Quick Start

### Installation

```bash
cd test-orchestrator
npm install
```

### Basic Usage

```bash
# Discover and classify all tests
node index.js discover

# Run fast feedback tests (default strategy)
node index.js run

# Run comprehensive test suite
node index.js run --strategy=comprehensive

# Run with specific options
node index.js run --strategy=fastFeedback --parallel=true --coverage=true

# Generate reports only
node index.js report

# Analyze performance and get recommendations
node index.js optimize

# Run full orchestration cycle
node index.js full
```

### Command Line Options

```bash
Usage: node index.js [command] [options]

Commands:
  discover     - Discover and classify all tests
  run         - Execute optimized test suite
  monitor     - Monitor test performance
  report      - Generate detailed reports
  optimize    - Analyze and suggest optimizations
  full        - Run full orchestration cycle

Options:
  --strategy=<name>       Execution strategy (fastFeedback|comprehensive|smokeTest|performance)
  --parallel=<boolean>     Enable parallel execution (default: true)
  --coverage=<boolean>     Generate coverage reports (default: true)
  --verbose=<boolean>      Verbose logging (default: false)
  --max-workers=<number>   Maximum concurrent workers (default: CPU count)
  --timeout=<number>       Test timeout in milliseconds (default: 30000)
```

## Execution Strategies

### 🏃 **Fast Feedback (Default)**
- **Phase 1**: Unit tests (quick feedback)
- **Phase 2**: Integration tests
- **Phase 3**: E2E tests
- **Best for**: Development, pull requests

### 🔍 **Comprehensive**
- **Phase 1**: Database setup
- **Phase 2**: API server setup
- **Phase 3**: Unit tests
- **Phase 4**: Integration tests
- **Phase 5**: E2E tests
- **Phase 6**: Performance tests
- **Best for**: Full validation, release candidates

### 💨 **Smoke Test**
- **Critical tests only**
- **Quick validation**
- **Best for**: Production deployment checks

### ⚡ **Performance**
- **Focus on performance metrics**
- **Include performance benchmarks**
- **Best for**: Performance validation, optimization

## Test Classification

The orchestrator automatically classifies tests into these types:

| Type | Description | Parallel | Isolation | Max Memory |
|------|-------------|----------|-----------|------------|
| **UNIT** | Individual component tests | ✅ | ✅ | 256MB |
| **INTEGRATION** | API integration tests | ✅ | ✅ | 512MB |
| **E2E** | End-to-end tests | ❌ | ✅ | 1GB |
| **API** | API endpoint tests | ✅ | ✅ | 256MB |
| **DATABASE** | Database tests | ❌ | ✅ | 384MB |
| **PERFORMANCE** | Performance benchmarks | ❌ | ✅ | 1GB |

## Configuration

### Configuration File

Create `test-orchestrator.config.js` in your project root:

```javascript
module.exports = {
  discovery: {
    testDirectories: [
      'client/src/__tests__',
      'client/src/components/**/__tests__',
      'server/__tests__'
    ],
    excludePatterns: [
      '**/node_modules/**',
      '**/coverage/**'
    ]
  },

  parallel: {
    enabled: true,
    byType: {
      unit: { maxWorkers: 4, batchSize: 10 },
      integration: { maxWorkers: 2, batchSize: 5 },
      e2e: { maxWorkers: 1, batchSize: 1 }
    }
  },

  thresholds: {
    testTimeout: 30000,
    coverageThreshold: 80,
    maxMemoryUsage: 2048
  },

  reporting: {
    formats: ['json', 'html', 'junit'],
    outputDir: 'test-results',
    includeCoverage: true,
    includePerformance: true
  }
};
```

### Environment Variables

```bash
# Test environment
NODE_ENV=test
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/test_db
NASA_API_KEY=your_test_api_key

# Orchestrator settings
ORCHESTRATOR_MAX_WORKERS=8
ORCHESTRATOR_TIMEOUT=30000
ORCHESTRATOR_VERBOSE=true
```

## Resource Management

### Memory Management
- **Memory Pooling**: Efficient memory allocation and cleanup
- **Garbage Collection**: Automatic GC triggering on high usage
- **Memory Monitoring**: Real-time memory usage tracking

### Connection Pooling
- **Database Connections**: Configurable connection pool for database tests
- **HTTP Clients**: Reusable HTTP client instances for API tests
- **Resource Limits**: Configurable limits to prevent resource exhaustion

### CPU Optimization
- **Worker Threads**: True parallel execution with isolated environments
- **Load Balancing**: Intelligent distribution of test load
- **Adaptive Scaling**: Dynamic adjustment based on system resources

## Reports and Analytics

### Report Formats

| Format | Description | Use Case |
|--------|-------------|----------|
| **HTML** | Interactive dashboard with charts | Development review |
| **JSON** | Machine-readable structured data | CI/CD integration |
| **JUnit** | Standard XML format for CI systems | Jenkins, GitHub Actions |
| **Markdown** | Human-readable summary | Documentation |

### Performance Metrics

- **Execution Time**: Per-test and phase-level timing
- **Memory Usage**: Memory consumption tracking
- **Resource Utilization**: CPU and connection monitoring
- **Parallelization Efficiency**: Parallel execution effectiveness
- **Success Rate**: Test pass/fail statistics
- **Coverage Metrics**: Code coverage analysis

### Trend Analysis

- **Historical Performance**: Track performance over time
- **Failure Patterns**: Identify recurring test failures
- **Optimization Recommendations**: AI-powered suggestions
- **Resource Trends**: Monitor resource usage patterns

## CI/CD Integration

### GitHub Actions

The orchestrator includes a comprehensive GitHub Actions workflow:

```yaml
# .github/workflows/test-orchestration.yml
name: Test Orchestration
on: [push, pull_request, workflow_dispatch]

jobs:
  test-orchestration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: node test-orchestrator/index.js run --strategy=fastFeedback
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Features

- **Smart Selection**: Run only tests affected by code changes
- **Parallel Execution**: Optimized for CI environments
- **Artifact Upload**: Automatic test result upload
- **PR Comments**: Detailed test results in pull requests
- **Coverage Integration**: Automatic coverage reporting
- **Performance Tracking**: Performance trend monitoring

## Advanced Features

### Smart Test Selection

```bash
# Run only tests affected by recent changes
node index.js run --strategy=smartSelection --changed-files
```

The orchestrator analyzes:
- **File Dependencies**: Test files related to changed source files
- **Import Graph**: Module dependency analysis
- **Test History**: Historical failure patterns
- **Critical Tests**: Always run critical infrastructure tests

### Predictive Execution

```bash
# Enable predictive execution optimizations
node index.js run --predictive=true
```

- **Learning Algorithm**: Adapts based on execution history
- **Confidence Scoring**: Prioritizes high-impact tests
- **Risk Assessment**: Identifies potential failure points
- **Dynamic Reordering**: Optimizes test order for speed

### Fault Tolerance

```javascript
// Circuit breaker configuration
const config = {
  faultTolerance: {
    enabled: true,
    retries: 3,
    circuitBreaker: {
      failureThreshold: 5,
      timeout: 60000,
      resetTimeout: 30000
    }
  }
};
```

## Troubleshooting

### Common Issues

**Issue: Tests timing out**
```bash
# Increase timeout
node index.js run --timeout=60000
```

**Issue: Out of memory errors**
```bash
# Reduce parallel workers
node index.js run --max-workers=2
```

**Issue: Database connection errors**
```bash
# Ensure test database is running
npm run db:test:up
node index.js run
```

### Debug Mode

```bash
# Enable verbose logging
node index.js run --verbose --debug

# Monitor resources in real-time
node index.js monitor
```

### Performance Tuning

```javascript
// Performance optimization settings
const config = {
  parallel: {
    global: {
      maxWorkers: 'auto', // or specific number
      memoryLimit: 2048,
      timeout: 30000
    },
    byType: {
      unit: { maxWorkers: 4, batchSize: 10 },
      integration: { maxWorkers: 2, batchSize: 5 }
    }
  }
};
```

## API Reference

### TestOrchestrator Class

```javascript
const TestOrchestrator = require('./index.js');

const orchestrator = new TestOrchestrator({
  maxWorkers: 8,
  timeout: 30000,
  parallel: true,
  coverage: true,
  verbose: true
});

// Run tests
await orchestrator.runTests({
  strategy: 'fastFeedback',
  filters: ['unit']
});

// Generate reports
await orchestrator.generateReports();

// Monitor performance
const monitor = await orchestrator.monitorTests();
```

### Events

```javascript
orchestrator.on('test-completed', (data) => {
  console.log(`Test ${data.test.id} completed: ${data.test.status}`);
});

orchestrator.on('resource-warning', (warning) => {
  console.warn(`Resource warning: ${warning.type}`);
});

orchestrator.on('performance-issue', (issue) => {
  console.error(`Performance issue: ${issue.description}`);
});
```

## Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd nasa-system6-portal

# Install dependencies
npm install
cd test-orchestrator
npm install

# Run in development mode
npm run dev
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions and support:

- **GitHub Issues**: Create an issue for bugs or questions
- **Discussions**: Use GitHub Discussions for general questions
- **Documentation**: Check the full documentation in the `/docs` directory

---

*Built with ❤️ for the NASA System 6 Portal project*