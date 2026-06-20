import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  root: __dirname, // Prevent looking up parent directories for config
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks', // Use forked processes for complete isolation
    setupFiles: [path.resolve(__dirname, './tests/setup.ts')], // Absolute path to backend test setup
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'tests/', 'dist/', '**/*.d.ts', '**/*.config.*', '**/mockData.ts'],
      include: ['src/**/*.ts'],
      all: true,
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
    include: [
      'tests/unit/**/*.test.ts',
      'tests/services/**/*.test.ts',
      'tests/security/**/*.test.ts',
      'tests/intelligence/**/*.test.ts',
      'tests/{deadline-checker,digest-scheduler,email-notifications,notification-queue,push-notifications}.test.ts',
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'tests/contract/**',
      'tests/contracts/**',
      'tests/integration/**',
      'tests/performance/**',
      // Real-service integration tests (need live SUPABASE_URL + SERVICE_ROLE_KEY) live
      // alongside unit tests under tests/intelligence/ etc. — route them out of this
      // required unit job by their *.integration.test.ts suffix. They run in the
      // non-required "Tests (integration)" job (vitest.integration.config.ts).
      'tests/**/*.integration.test.ts',
    ],
    testTimeout: 30000, // 30s for integration tests with database
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
})
