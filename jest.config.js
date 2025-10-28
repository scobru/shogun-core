module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  testPathIgnorePatterns: [
    '.*complete-integration\\.test\\.ts$',
    '.*user_manager\\.integration\\.test\\.ts$',
    '.*saveUser\\.integration\\.test\\.ts$',
    '.*oauthPlugin\\.integration\\.test\\.ts$',
    '.*gun-Instance\\.integration\\.test\\.ts$',
    '.*robust-integration\\.test\\.ts$',
    '.*final-integration\\.test\\.ts$',
    '.*quick-integration\\.test\\.ts$'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/examples/**',
    '!src/**/ship/**',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(ts-mls|@noble|mlkem|hpke|@zk-kit|@semaphore-protocol|ffjavascript)/)'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  maxWorkers: 1,
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 15,
      lines: 20,
      statements: 20
    }
  },
  // Mock problematic modules
  moduleNameMapper: {
    '^gun/sea$': '<rootDir>/src/__tests__/__mocks__/gun-sea.js',
    '^gun$': '<rootDir>/src/__tests__/__mocks__/gun.js',
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
