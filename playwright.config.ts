import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Load test-only environment variables (never committed). See .env.test.example.
dotenv.config({ path: '.env.test' })

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['blob'], ['github'], ['./tests/e2e/support/flake-reporter.ts']]
    : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium-en',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/support/storage/admin.json',
      },
      dependencies: ['setup'],
      testIgnore: ['**/ar-smoke/**'],
    },
    {
      name: 'chromium-ar-smoke',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/support/storage/admin.json',
        locale: 'ar-SA',
      },
      testMatch: ['**/ar-smoke/**'],
      dependencies: ['setup'],
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 7'],
        storageState: 'tests/e2e/support/storage/admin.json',
      },
      grep: /@mobile/,
      dependencies: ['setup'],
    },
  ],

  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'NODE_ENV=development pnpm dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
