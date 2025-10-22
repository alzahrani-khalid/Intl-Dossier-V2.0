import { defineConfig } from 'vitest/config';
import path from 'path';

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
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
      include: ['src/**/*.ts'],
      all: true,
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules/', 'dist/'],
    testTimeout: 30000, // 30s for integration tests with database
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
