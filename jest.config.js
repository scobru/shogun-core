module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    // Gestisce i percorsi di alias se necessario
    "^@/(.*)$": "<rootDir>/src/$1",
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
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        isolatedModules: true,
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
};
