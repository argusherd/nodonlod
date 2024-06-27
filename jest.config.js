const { configDotenv } = require("dotenv");

configDotenv({ path: [".env.test", ".env"] });

/** @type {import('ts-jest').JestConfigWithTsJest} */
const general = {
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testEnvironment: "node",
  testMatch: ["**/*.test.*"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tests/tsconfig.json",
      },
    ],
  },
};

/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  projects: [
    {
      ...general,
      displayName: "feature",
      roots: ["<rootDir>/tests/feature"],
      setupFilesAfterEnv: ["<rootDir>/tests/feature/setup/index.ts"],
    },
    {
      ...general,
      displayName: "unit",
      modulePathIgnorePatterns: ["<rootDir>/tests/unit/src/media-player/"],
      roots: ["<rootDir>/tests/unit"],
    },
    {
      ...general,
      displayName: "media-player",
      roots: ["<rootDir>/tests/unit/src/media-player"],
      setupFilesAfterEnv: ["<rootDir>/tests/unit/src/media-player/setup.ts"],
    },
  ],
};

module.exports = config;
