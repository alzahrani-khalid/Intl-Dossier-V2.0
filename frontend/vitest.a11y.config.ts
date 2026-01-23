import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: true,
    // Only include accessibility test files
    include: [
      'tests/a11y/**/*.test.{ts,tsx}',
      'tests/accessibility/**/*.test.{ts,tsx}',
      'tests/unit/skeleton.test.tsx',
      'tests/unit/content-skeletons.test.tsx',
      'tests/unit/components/Dossier/DossierLoadingSkeletons.test.tsx',
      'tests/unit/accessibility.settings.test.tsx'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'build/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});
