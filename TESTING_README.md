# Testing Guide for NASA System 6 Portal

This document explains the testing setup and how to run tests in the NASA System 6 Portal project.

## Overview

The project has been configured to use real implementations without any mocking infrastructure. All tests interact with actual APIs, databases, and services to ensure the application works as expected in production.

## Project Structure

```
stylesnprofiles/
├── client/                 # React frontend
│   ├── src/
│   │   ├── __tests__/     # Unit tests
│   │   └── __integration__/ # Integration tests (requires server)
│   └── package.json
├── server/                 # Node.js backend
│   ├── __tests__/         # Unit and integration tests
│   └── package.json
├── test-orchestrator/     # Intelligent test automation
└── package.json           # Root configuration
```

## Testing Commands

### From Root Directory

```bash
# Install all dependencies
npm run install:all

# Run all tests (client + server)
npm test

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests (requires server running)
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Use the intelligent test orchestrator
npm run test:orchestrator

# Run comprehensive test suite
npm run test:orchestrator:comprehensive

# Run smoke tests only
npm run test:orchestrator:smoke

# Monitor test performance
npm run test:orchestrator:monitor

# Generate test reports
npm run test:orchestrator:report
```

### Running Client and Server for Testing

```bash
# Start both client and server for development
npm start

# Start in development mode with hot reload
npm run dev

# Start only the server (required for integration tests)
npm run start:server

# Start only the client
npm run start:client
```

### Testing Individual Modules

```bash
# Test only the client
npm run test:client

# Test only the server
npm run test:server

# Run client tests with coverage
npm run test:client:coverage

# Run server tests with coverage
npm run test:server:coverage
```

## Test Types

### 1. Unit Tests
- Test individual functions and components in isolation
- Fast execution
- No external dependencies required
- Located in `src/__tests__/` directories

### 2. Integration Tests
- Test interaction between components and APIs
- Require the server to be running on `localhost:3001`
- Located in `src/__integration__/` directories
- Use real API endpoints

### 3. End-to-End Tests
- Full application workflow testing
- Not yet configured (placeholder exists)

## Prerequisites for Running Tests

1. **Node.js** >= 16.0.0
2. **npm** >= 8.0.0
3. **PostgreSQL** (for server tests)
4. **Redis** (optional, for caching tests)

## Setup Instructions

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Set up environment variables:
   ```bash
   # In server directory
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. Initialize the database:
   ```bash
   cd server
   npm run db:init
   ```

4. Start the server (for integration tests):
   ```bash
   cd server
   npm start
   ```

## Coverage Requirements

The project enforces minimum code coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Test Configuration

### Client Tests
- Environment: jsdom
- Framework: Jest + React Testing Library
- Timeout: 10 seconds (for real API calls)
- Coverage: Excludes setup files and mocks

### Server Tests
- Environment: Node
- Framework: Jest + Supertest
- Timeout: 10 seconds
- Coverage: Excludes test files and legacy code

## Intelligent Test Orchestrator

The project includes an intelligent test orchestrator that optimizes test execution:

### Features
- Parallel test execution
- Smart test selection based on changes
- Performance monitoring
- Comprehensive reporting
- Multiple execution strategies

### Strategies
1. **Fast Feedback**: Runs only tests affected by changes
2. **Comprehensive**: Runs all tests
3. **Smoke Test**: Runs critical tests only
4. **Performance**: Focuses on performance-related tests

## Troubleshooting

### Integration Tests Fail
- Ensure the server is running on `localhost:3001`
- Check database connection
- Verify API endpoints are accessible

### Tests Time Out
- Increase timeout in test configuration
- Check network connectivity
- Verify API response times

### Coverage Reports
- Reports are generated in `coverage/` directories
- HTML reports available at `coverage/lcov-report/index.html`
- JSON reports for CI/CD integration

## CI/CD Integration

The test suite is configured to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm run install:all
    npm run test:orchestrator:comprehensive
    npm run test:coverage
```

## Best Practices

1. Write tests for all new features
2. Maintain coverage thresholds
3. Use descriptive test names
4. Test both happy path and error cases
5. Mock only unavoidable external dependencies
6. Keep tests fast and independent
7. Use the test orchestrator for optimized execution