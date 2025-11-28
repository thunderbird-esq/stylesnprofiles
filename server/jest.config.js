module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/__tests__/helpers.js'],

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Coverage configuration
  collectCoverageFrom: [
    '*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    'services/**/*.js',
    '!*.config.js',
    '!jest.setup.js',
    '!__tests__/helpers.js',
    '!**/*.test.js',
    '!**/*.spec.js',
    '!node_modules/**',
  ],

  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },

  // Test match patterns
  testMatch: ['<rootDir>/**/__tests__/**/*.test.js', '<rootDir>/**/*.{test,spec}.js'],

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Reset modules between tests
  resetModules: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Test timeout
  testTimeout: 10000,

  // Force exit after tests complete
  forceExit: true,
};
