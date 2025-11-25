const baseConfig = require('./jest.preset');

module.exports = {
  ...baseConfig,
  displayName: 'integration',
  testMatch: ['**/tests/integration/**/*.spec.ts'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],
  testTimeout: 60000, // 60 seconds for integration tests
  maxWorkers: 1, // Run integration tests sequentially
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.base.json',
    },
  },
  moduleNameMapper: {
    '^@funnelagents/(.*)$': '<rootDir>/libs/$1/src',
  },
};
