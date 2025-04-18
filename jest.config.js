/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    // Gestisce i percorsi di alias se necessario
    "^@/(.*)$": "<rootDir>/src/$1",
    "^gun$": "<rootDir>/src/__mocks__/gun.ts",
    "^gun/sea$": "<rootDir>/src/__mocks__/gun.ts",
  },
  testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/__tests__/",
    "/examples/",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/dist/types/",
    "\\.d\\.ts$",
  ],
  setupFilesAfterEnv: ["./jest.setup.js"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  testTimeout: 60000, // Aumenta il timeout per i test più lenti
  detectOpenHandles: true,
  forceExit: true,
  // Configurazione esplicita per la copertura
  collectCoverage: true,
  coverageReporters: ["lcov", "text", "html"],
  coverageDirectory: "coverage",
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
};
