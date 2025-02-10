/**
 * base jest configuration file
 */

import { JestConfigWithTsJest, pathsToModuleNameMapper } from "ts-jest";

const projectRoot = process.env.WS_DIR;

export const esmModules = [];

const jestConfig: JestConfigWithTsJest = {
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "node",
  globalSetup: `${projectRoot}/tests/test.globalSetup.ts`,
  globalTeardown: `${projectRoot}/tests/test.globalTeardown.ts`,
  setupFiles: [`${projectRoot}/tests/test.setupBeforeEnv.ts`],
  setupFilesAfterEnv: [
    `${projectRoot}/tests/test.setupAfterEnv.ts`, // runs before every test suite
  ],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {}],
  },
  roots: ["<rootDir>"],
  modulePaths: ["./"],
  moduleNameMapper: {
    ...pathsToModuleNameMapper({}),
  },
  transformIgnorePatterns: [`.*/node_modules/(?!(${esmModules.join("|")})/)`],
  modulePathIgnorePatterns: ["dist"],
  testTimeout: 120_000,
  coverageDirectory: ".coverage",
  coverageReporters: ["lcov"],
  maxWorkers: "50%",
  randomize: true,
};

export default jestConfig;
