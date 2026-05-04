/**
 * Phase 43 Plan 12 — Playwright globalSetup.
 *
 * Performs login ONCE per Playwright run, persisting the post-login session
 * (cookies + localStorage) to `.auth/storageState.json`. The qa-sweep test
 * projects consume this storageState so parallel workers never race the
 * login form into a route's render assertions (43-VERIFICATION Class D).
 *
 * Tour-dismissal localStorage entries mirror `support/list-pages-auth.ts` so
 * guided overlays cannot intercept clicks or visual diffs.
 *
 * SECURITY: `.auth/storageState.json` is gitignored (T-43-12-01). The test
 * user is a non-production fixture account (CLAUDE.md → Test Credentials).
 *
 * Specs that NEED to render the login form (e.g. login auth-flow specs) run
 * under the `chromium-no-auth` project which overrides storageState back to
 * an empty session.
 */

import { chromium, type FullConfig } from '@playwright/test'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const STORAGE_STATE_PATH = path.resolve(__dirname, '..', '.auth', 'storageState.json')

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL ?? 'http://localhost:5173'
  const email = process.env.TEST_USER_EMAIL ?? ''
  const password = process.env.TEST_USER_PASSWORD ?? ''
  if (email === '' || password === '') {
    throw new Error(
      'TEST_USER_EMAIL / TEST_USER_PASSWORD missing — see .env.test (Doppler dev config).',
    )
  }

  const browser = await chromium.launch()
  const context = await browser.newContext({ baseURL })
  const page = await context.newPage()

  await page.goto('/login')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|operations|home|my-work|engagements|dossiers)/, {
    timeout: 30_000,
  })

  // Pre-dismiss tour overlays (mirrors support/list-pages-auth.ts so the
  // sweep specs never have a guided-tour scrim intercepting clicks).
  await page.evaluate(() => {
    localStorage.setItem('intl-dossier-onboarding-seen', 'true')
    localStorage.setItem('intl-dossier-onboarding-completed', 'true')
    localStorage.setItem('intl-dossier-tours-enabled', 'false')
    localStorage.setItem(
      'intl-dossier-tours-dismissed',
      JSON.stringify(['onboarding', 'dossier-hub', 'engagement-wizard']),
    )
  })

  await context.storageState({ path: STORAGE_STATE_PATH })
  await browser.close()
}
