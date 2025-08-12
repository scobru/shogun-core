module.exports = {
  displayName: "integration",
  testMatch: ["**/__tests__/integration/success-test.test.ts"],
  env: {
    JEST_INTEGRATION: "true",
  },
  testPathIgnorePatterns: [
    ".*gundb.*gun-Instance.integration.test.ts",
    ".*plugins.*oauth.*oauthPlugin.integration.test.ts",
    ".*saveUser.integration.test.ts",
    ".*user_manager.integration.test.ts",
    ".*complete-integration.test.ts",
  ],
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/setup.integration.ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/__tests__/**"],
  coverageDirectory: "coverage/integration",
  testTimeout: 10000, // Reduced timeout for faster tests
  verbose: true,
  silent: false,
  testEnvironmentOptions: {
    url: "http://localhost",
  },
  // Force Jest to exit after tests complete
  forceExit: true,
  // Detect open handles
  detectOpenHandles: true,
  // Disable workers to avoid child process issues
  maxWorkers: 1,
};
