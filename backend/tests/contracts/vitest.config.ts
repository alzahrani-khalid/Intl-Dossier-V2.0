/**
 * Vitest configuration for contract tests
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'contract-tests',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    setupFiles: ['./test-utils.ts'],
    coverage: {
      enabled: false, // Contract tests don't need coverage
    },
    // Run tests in parallel for better performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
    // Retry failed tests
    retry: 2,
    // Reporters
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/contract-tests.json',
      html: './test-results/contract-tests.html',
    },
  },
});