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

import { STORAGE_STATE_PATH } from './tests/e2e/global-setup'

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
  // Plan 43-12: pre-authenticate ONCE per Playwright run; qa-sweep specs
  // consume the persisted storageState so parallel workers never race the
  // login form into a route's render assertions (43-VERIFICATION Class D).
  globalSetup: './tests/e2e/global-setup.ts',
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
      // Plan 40-17 (G7): suppress caret blink in screenshots so focused inputs
      // do not introduce one-pixel drift between replays.
      caret: 'hide',
      // Cap absolute pixel diffs as a safety net beyond the ratio.
      maxDiffPixels: 100,
    },
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Plan 40-17 (G7): emulate reduced-motion for the whole project so any
    // `@media (prefers-reduced-motion)` branches in the app render the static
    // variant.  Combined with the per-test addInitScript that kills CSS
    // animations, this is the belt-and-braces layer.
    reducedMotion: 'reduce',
    forcedColors: 'none',
    // Plan 43-12: every project inherits the pre-authenticated session
    // unless explicitly overridden (see `chromium-no-auth` below).
    storageState: STORAGE_STATE_PATH,
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /dashboard-widgets-visual\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-dashboard-widgets',
      testMatch: /dashboard-widgets-visual\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
      expect: {
        toHaveScreenshot: {
          pathTemplate: '{testDir}/__snapshots__/dashboard-widgets/{arg}{ext}',
          maxDiffPixelRatio: 0.02,
          threshold: 0.2,
          animations: 'disabled',
          caret: 'hide',
          maxDiffPixels: 100,
        },
      },
    },
    // Plan 43-12: auth-bypass project for specs that NEED to render the
    // login form (override storageState back to an empty session). No such
    // specs exist today; the project is wired so future `login*.spec.ts`
    // can opt out of the global session without further config changes.
    {
      name: 'chromium-no-auth',
      use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } },
      testMatch: /login.*\.spec\.ts$/,
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
