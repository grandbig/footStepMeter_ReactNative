module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.(js|jsx|ts|tsx)'],
  collectCoverageFrom: [
    'utils/**/*.{js,jsx,ts,tsx}',
    'services/**/*.{js,jsx,ts,tsx}',
    'stores/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/*.config.{js,ts}',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],
  coverageReporters: [
    'text',
    'text-summary', 
    'html',
    'lcov'
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};