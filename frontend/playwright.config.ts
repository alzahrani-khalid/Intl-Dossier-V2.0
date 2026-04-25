/**
 * Phase 38 (Plan 38-09) Playwright config for the Dashboard E2E suite that
 * lives under `frontend/tests/e2e/`.
 *
 * The repo-root `playwright.config.ts` points at the legacy `./tests/e2e`
 * tree at the repo root. When Playwright is invoked from the `frontend/`
 * workspace (`pnpm -C frontend exec playwright test`) it walks up and finds
 * the root config — which ignores our Phase-38 specs. This file gives the
 * frontend workspace its own config so `dashboard*.spec.ts` under
 * `frontend/tests/e2e/` is discovered.
 *
 * Visual-regression threshold honors 38-CONTEXT D-12:
 *   maxDiffPixelRatio: 0.01  (plus `threshold: 0.2` for per-pixel tolerance).
 */

import { defineConfig, devices } from '@playwright/test'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

// ESM-safe __dirname (frontend/package.json declares "type": "module").
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load test-only env vars from repo root .env.test (same file the root config uses).
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') })

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173'

export default defineConfig({
  testDir: path.resolve(__dirname, 'tests/e2e'),
  // Only pick up spec files — not mocks, fixtures, __screenshots__, etc.
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list']] : [['list'], ['html', { open: 'never' }]],
  expect: {
    toHaveScreenshot: {
      // D-12: 1% pixel-ratio drift tolerance for dashboard visual regression.
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
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
