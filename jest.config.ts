import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: [
    "**/__tests__/**/*.test.(ts|tsx|js)",
    "**/*.(test|spec).(ts|tsx|js)",
  ],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
    "^canvas$": "<rootDir>/jest.setup.ts",
  },
  moduleDirectories: ["node_modules", "src"],
  transformIgnorePatterns: ["node_modules/(?!(ky)/)"],
  testEnvironmentOptions: {
    customExportConditions: [""],
  },
  // Override canvas dependency for tests
};

export default createJestConfig(config);
