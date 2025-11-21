# User Resources Test Suite

This comprehensive test suite provides complete coverage testing for user resources functionality including favorites and collections services.

## Overview

The test suite is designed to achieve 85%+ code coverage without using mocks, testing actual API endpoints with real database connections.

## Test Structure

```
src/
├── services/
│   ├── __tests__/
│   │   ├── favoritesService.test.js     # Unit tests for favorites service
│   │   └── collectionsService.test.js   # Unit tests for collections service
├── __integration__/
│   ├── userResources.integration.test.js # Integration tests for all endpoints
│   └── integrationTestHelpers.js         # Helper utilities
└── __tests__/
    ├── testRunner.js                     # Test orchestration script
    └── README.md                         # This file
```

## Test Categories

### Unit Tests

**Location:** `src/services/__tests__/`

- **favoritesService.test.js**: Tests all favorites service methods
- **collectionsService.test.js**: Tests all collections service methods

**Coverage:**
- Input validation
- Error handling
- Method behavior
- Edge cases
- API client interaction patterns

### Integration Tests

**Location:** `src/__integration__/userResources.integration.test.js`

**Endpoints Tested:**

#### Favorites API (4 endpoints)
- `GET /api/v1/users/favorites` - List favorites with pagination and filtering
- `POST /api/v1/users/favorites` - Add new favorite
- `GET /api/v1/users/favorites/:id` - Get specific favorite
- `DELETE /api/v1/users/favorites/:id` - Remove favorite

#### Collections API (8 endpoints)
- `GET /api/v1/users/collections` - List collections
- `POST /api/v1/users/collections` - Create collection
- `GET /api/v1/users/collections/:id` - Get specific collection
- `PATCH /api/v1/users/collections/:id` - Update collection
- `DELETE /api/v1/users/collections/:id` - Delete collection
- `GET /api/v1/users/collections/:id/items` - List collection items
- `POST /api/v1/users/collections/:id/items` - Add item to collection
- `DELETE /api/v1/users/collections/:id/items/:itemId` - Remove item from collection

**Features Tested:**
- CRUD operations end-to-end
- Authentication enforcement
- Pagination logic
- Input validation
- Error handling
- Database constraints
- Data relationships

## Prerequisites

### For Unit Tests
- Node.js and npm installed
- Project dependencies installed (`npm install`)

### For Integration Tests
- Server running on `localhost:3001`
- Database accessible
- Authentication system configured
- Environment variables set

### Starting the Server for Integration Tests

```bash
# Navigate to server directory
cd server

# Start the server
npm start

# Or in development mode
npm run dev
```

## Running Tests

### Quick Start

```bash
# Run all user resource tests with coverage
npm run test:user-resources

# Run only unit tests
npm run test:user-resources:unit

# Run only integration tests
npm run test:user-resources:integration

# Check coverage only
npm run test:user-resources:coverage
```

### Individual Test Categories

```bash
# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage

# Run in watch mode for development
npm run test:watch
```

### Using Test Runner Directly

```bash
# Run all tests
node src/__tests__/testRunner.js all

# Run specific test types
node src/__tests__/testRunner.js unit
node src/__tests__/testRunner.js integration
node src/__tests__/testRunner.js coverage
```

### Using Jest Configuration

```bash
# Run with custom Jest configuration
npx jest --config jest.user-resources.config.json
```

## Coverage Requirements

- **Target:** 85% minimum coverage
- **Metrics Tracked:**
  - Lines: 85%+
  - Functions: 85%+
  - Branches: 85%+
  - Statements: 85%+

### Coverage Reports

After running tests with coverage:

- **Text Report:** Displayed in console
- **HTML Report:** `coverage/lcov-report/index.html`
- **LCOV Report:** `coverage/lcov.info`
- **JSON Summary:** `coverage/coverage-summary.json`
- **Text Summary:** `coverage/coverage-summary.txt`

## Test Environment

### Configuration Files

- `jest.user-resources.config.json` - Jest configuration for user resources tests
- `jest.integration.config.json` - Integration test configuration
- `src/setupIntegrationTests.js` - Integration test setup

### Environment Variables

```bash
# Required for server connection
REACT_APP_API_URL=http://localhost:3001

# Required for authentication
JWT_SECRET=your-jwt-secret

# Optional test configuration
NODE_ENV=test
CI=true  # For continuous integration
```

## Test Data Management

### Test Data Lifecycle

1. **Creation:** Tests create their own data with unique IDs
2. **Isolation:** Each test uses unique timestamps for data isolation
3. **Cleanup:** Automatic cleanup in `afterAll` hooks
4. **Tracking:** Created items are tracked for proper cleanup

### Test Authentication

Integration tests use JWT tokens for authentication:

```javascript
// Test user payload
const testUser = {
  id: 'test-user-integration',
  email: 'test@example.com',
  role: 'user'
};
```

## Writing New Tests

### Unit Test Template

```javascript
import { functionName } from '../services/serviceName';
import apiClient from '../services/apiClient';

describe('Service Name Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle valid input', async () => {
    // Arrange
    const mockData = { /* test data */ };
    apiClient.method = jest.fn().mockResolvedValue({ data: mockData });

    // Act
    const result = await functionName(validInput);

    // Assert
    expect(result).toEqual(mockData);
    expect(apiClient.method).toHaveBeenCalledWith(expectedArgs);
  });

  test('should handle errors', async () => {
    // Arrange
    apiClient.method = jest.fn().mockRejectedValue(new Error('Test error'));

    // Act & Assert
    await expect(functionName(invalidInput)).rejects.toThrow('Test error');
  });
});
```

### Integration Test Template

```javascript
describe('API Endpoint Integration Tests', () => {
  let createdItemId;

  afterAll(async () => {
    // Cleanup created data
    if (createdItemId) {
      await axios.delete(`${API_BASE_URL}/endpoint/${createdItemId}`);
    }
  });

  test('should create and retrieve item', async () => {
    // Create
    const createResponse = await axios.post(`${API_BASE_URL}/endpoint`, testData);
    expect(createResponse.status).toBe(201);

    createdItemId = createResponse.data.id;

    // Retrieve
    const getResponse = await axios.get(`${API_BASE_URL}/endpoint/${createdItemId}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.data).toMatchObject(testData);
  });
});
```

## Troubleshooting

### Common Issues

1. **Server Not Running**
   ```bash
   # Check server status
   curl http://localhost:3001/health

   # Start server
   cd server && npm start
   ```

2. **Database Connection Issues**
   - Check database server is running
   - Verify connection string in server environment
   - Check database permissions

3. **Authentication Failures**
   - Verify JWT_SECRET is set
   - Check token generation logic
   - Verify auth middleware is properly configured

4. **Coverage Below Threshold**
   - Run tests with verbose output to see uncovered lines
   - Add tests for uncovered branches and functions
   - Check for unreachable code

5. **Test Timeouts**
   - Increase timeout in test configuration
   - Check for infinite loops or long-running operations
   - Verify server response times

### Debug Mode

```bash
# Run tests with verbose output
DEBUG=* npm run test:user-resources

# Run with Node.js debugging
node --inspect-brk src/__tests__/testRunner.js all
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: User Resources Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v2

    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'

    - name: Install dependencies
      run: |
        npm install
        cd server && npm install

    - name: Start server
      run: |
        cd server
        npm start &
        sleep 10

    - name: Run user resources tests
      run: npm run test:user-resources

    - name: Upload coverage
      uses: codecov/codecov-action@v1
      with:
        file: ./coverage/lcov.info
```

## Best Practices

1. **Test Isolation:** Each test should be independent
2. **Data Cleanup:** Always clean up created test data
3. **Error Scenarios:** Test both success and failure cases
4. **Edge Cases:** Test boundary conditions and invalid inputs
5. **Authentication:** Test both authenticated and unauthorized access
6. **Performance:** Monitor test execution time
7. **Coverage:** Maintain 85%+ coverage threshold
8. **Documentation:** Keep test descriptions clear and specific

## Contributing

When adding new tests:

1. Follow existing test patterns and naming conventions
2. Ensure new tests achieve adequate coverage
3. Update this README if adding new test categories
4. Run the full test suite before submitting changes
5. Verify coverage meets the 85% threshold

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [Integration Testing Best Practices](https://martinfowler.com/articles/integration-testing-paradox.html)