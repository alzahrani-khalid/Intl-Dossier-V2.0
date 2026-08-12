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
  testDir: path.resolve(__dirname, 'tests'),
  // Only pick up E2E and Playwright-owned accessibility specs.
  testMatch: ['e2e/**/*.spec.ts', 'accessibility/**/*.spec.ts'],
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
          // Phase 77-01 (VERIFY-01) fix: was `{testDir}/__snapshots__/...`.
          // `testDir` was widened from `frontend/tests/e2e` to `frontend/tests`
          // (for a11y discovery), which silently moved this template's output to
          // frontend/tests/__snapshots__/ and orphaned the committed baselines at
          // frontend/tests/e2e/__snapshots__/. `{testDir}/{testFileDir}` (=
          // frontend/tests + e2e) pins the output back to that committed,
          // git-tracked location.
          pathTemplate: '{testDir}/{testFileDir}/__snapshots__/dashboard-widgets/{arg}{ext}',
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
    // Accessibility gate (CI job "Accessibility Tests (RTL + WCAG AA)").
    // The global `testMatch` only covers `e2e/**` and `accessibility/**`, so the
    // axe specs under `tests/a11y/` were silently discovered as 0 tests ("No
    // tests found" → false-green). This project gives the a11y tree its OWN
    // testMatch so `--project=a11y` discovers and runs them. It inherits the
    // shared baseURL, webServer, and pre-authenticated storageState from `use`.
    //
    // The gate now admits all 13 intended specs: the five originally verified
    // specs below plus the eight specs whose repairs land later in this same
    // run. Admission here is a gating/configuration change, not evidence that
    // those eight specs have already been repaired; their repair work must be
    // read alongside this change. They share the SAME stale-login root cause
    // (a manual /login form fill that never matched the real `#email` form, so
    // every test 30s-timed-out in beforeEach) plus genuine app a11y debt (the
    // position rich-text editor and the intake form). The repaired specs are
    // admitted so the full intended gate is visible while that work lands.
    // (focus-indicators passes standalone but is kept out of the gate: adding it
    // raised dev-server concurrency enough to flake two `networkidle` waits in
    // dossiers-a11y. Re-include it — and any quarantined spec — once verified
    // stable in the full run.)
    {
      name: 'a11y',
      testMatch: [
        'a11y/dossiers-a11y.spec.ts',
        'a11y/dossiers-rtl-a11y.spec.ts',
        'a11y/positions-a11y-en.spec.ts',
        'a11y/positions-a11y-ar.spec.ts',
        'a11y/intake-accessibility.spec.ts',
        'a11y/editor-keyboard-nav.spec.ts',
        'a11y/positions-keyboard-nav.spec.ts',
        'a11y/positions-screen-reader-bilingual.spec.ts',
        'a11y/screen-reader-en.spec.ts',
        'a11y/screen-reader-ar.spec.ts',
        'a11y/keyboard-navigation.spec.ts',
        'a11y/color-contrast.spec.ts',
        'a11y/wcag-aa-comprehensive-audit.spec.ts',
      ],
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
