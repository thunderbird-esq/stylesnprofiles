module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/src/services/__tests__/testSetup.js',
    '@testing-library/jest-dom'
  ],
  testMatch: [
    '<rootDir>/src/services/__tests__/**/*.test.js'
  ],
  collectCoverageFrom: [
    "src/services/favoritesService.js",
    "src/services/collectionsService.js",
    "!src/services/apiClient.js",
    "!src/services/__tests__/**",
    "!src/**/__tests__/**",
    "!src/**/__integration__/**"
  ],
  coverageThreshold: {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  },
  coverageReporters: [
    "text",
    "lcov",
    "html",
    "json-summary"
  ],
  coverageDirectory: "coverage",
  transformIgnorePatterns: [
    "node_modules/(?!(axios|@babel)/)"
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/src/__mocks__/fileMock.js",
    "./authService": "<rootDir>/src/services/__mocks__/authService.js"
  },
  testTimeout: 30000,
  verbose: true,
  collectCoverage: true,
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  };