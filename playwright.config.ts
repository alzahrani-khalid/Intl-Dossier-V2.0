import { defineConfig, devices } from '@playwright/test'
import { loadTestEnv } from './tests/e2e/support/load-env.mjs'

// Load test-only environment variables (never committed). See .env.test.example.
loadTestEnv()

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
        // The lease writer (RULING-P99-50, F2): `pw-run-reaped.mjs --lease-exec` writes this
        // web-server session's identity to `.pw-leases/<nonce>.lease` INSIDE the session, then
        // supervises the same `env NODE_ENV=development pnpm dev` stack it leased. Only a session
        // carrying OUR nonce is ever reaped at finish; a new port holder without one is a refusal,
        // never a target. With no PW_LEASE_* env (ad-hoc `pnpm exec playwright test`) the writer
        // warns and runs the stack unleased — never sabotaging the run it observes.
        command: 'node scripts/pw-run-reaped.mjs --lease-exec -- env NODE_ENV=development pnpm dev',
        url: baseURL,
        // Reuse is OPT-IN (`PW_REUSE=1`), never implicit. A reused server serves whatever tree it
        // was started in; a server Playwright starts serves THIS config's directory. When a run
        // verifies per-worktree changes, an implicitly reused stray dev server renders the wrong
        // tree and reports a pass — measured 2026-08-18: a 42-hour-old main-checkout server
        // answered this exact baseURL in 2.7 ms while `CI` was unset (`RULING-P99-17`).
        reuseExistingServer: process.env.PW_REUSE === '1',
        timeout: 120_000,
      },
})
