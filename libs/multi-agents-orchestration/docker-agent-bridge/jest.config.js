module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 30000 // 30 seconds for Docker operations
};
