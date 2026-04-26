/**
 * Phase 40 list-pages — shared login helper for E2E specs.
 *
 * The 6 list-pages specs (40-10) all hit `_protected/*` routes that
 * redirect to /login if no session exists. This helper logs in via the
 * single TEST_USER_EMAIL/PASSWORD pair (Doppler dev config) and waits
 * for the post-login redirect to settle.
 *
 * Why a separate helper file (vs reusing dashboard.spec's exported one):
 *   - Imports across spec files are brittle (Playwright treats each .spec.ts
 *     as an entry point; cross-imports can confuse test discovery).
 *   - This helper has no `test()` calls — pure utility.
 */

import type { Page } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? ''
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? ''

export async function loginForListPages(
  page: Page,
  locale: 'en' | 'ar' = 'en',
): Promise<void> {
  if (TEST_EMAIL === '' || TEST_PASSWORD === '') {
    throw new Error(
      'Missing TEST_USER_EMAIL or TEST_USER_PASSWORD. Source from Doppler: ' +
        'doppler run -- pnpm exec playwright test',
    )
  }

  await page.goto('/login')
  await page.fill('[name="email"], input[type="email"]', TEST_EMAIL)
  await page.fill('[name="password"], #password, input[type="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')

  // Wait for post-login redirect — accept any of the canonical landing routes.
  await page.waitForURL(/\/(dashboard|operations|home|my-work|engagements|dossiers)/, {
    timeout: 15_000,
  })

  if (locale === 'ar') {
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl')
      document.documentElement.setAttribute('lang', 'ar')
      window.localStorage.setItem('i18nextLng', 'ar')
    })
    await page.reload()
  }

  // Pre-dismiss guided-tour overlays that can intercept clicks / break visual diffs.
  await page.evaluate(() => {
    localStorage.setItem('intl-dossier-onboarding-seen', 'true')
    localStorage.setItem('intl-dossier-onboarding-completed', 'true')
    localStorage.setItem('intl-dossier-tours-enabled', 'false')
    localStorage.setItem(
      'intl-dossier-tours-dismissed',
      JSON.stringify(['onboarding', 'dossier-hub', 'engagement-wizard']),
    )
  })
}
