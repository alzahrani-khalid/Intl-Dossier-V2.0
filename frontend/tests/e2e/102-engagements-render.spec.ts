// @covers ENGREAD-01
//
// Phase 102 plan 05 — the /engagements render probe (102-CONTEXT.md D-19, research §5).
//
// ENGREAD-01 recorded "/engagements renders the shared query-ERROR state while engagement rows
// exist" (observed 2026-08-17). Research §5.2 found BOTH API read paths 200 with 5 rows, so the
// open question is the RENDER: does the list page show the 5 rows the API returns, in each locale?
//
// Each test signs in with the TEST_USER pair in its own session (the global storageState is
// emptied, so the sign-in is this spec's, not global-setup's), visits /engagements with the locale
// stated on the navigation, SETTLES, and only then reads the surface. The settle is
// tests/e2e/98-copy04-voice.spec.ts's (main visible, best-effort networkidle, fixed 3 s dwell) plus
// a gate on "rows or error chrome, whichever appears" — never the pre-law 95/96 helpers.
//
// On failure the test prints what the surface actually showed: the error-chrome text (soft, first,
// so it leads the report's error message) or the visible body text beside the row count. That is
// how the SUMMARY names a cause. No repair lives here (D-19: none is planned for an unseen cause).
import { test, expect, type Locator, type Page } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'

type Locale = 'en' | 'ar'

const SETTLE_TIMEOUT = 20_000
const EXPECTED_ROWS = 5

/** `common:errors.queryFailed.title` per locale — the shared error title ENGREAD-01 recorded. */
const ERROR_TITLE: Readonly<Record<Locale, string>> = {
  en: 'Unable to load data',
  ar: 'تعذر تحميل البيانات',
}

const engagementRows = (page: Page): Locator => page.locator('[data-testid="engagement-row"]')

/** QueryErrorState (both variants) or the shared title from any error surface, incl. the router's. */
const errorChrome = (page: Page, lng: Locale): Locator =>
  page
    .locator('[data-testid="query-error-state"], [data-testid="query-error-inline"]')
    .or(page.getByText(ERROR_TITLE[lng]))

const squash = (text: string): string => text.replace(/\s+/g, ' ').trim()

/**
 * Settle before capture. None of the waits throws: a surface that never shows `main`, rows or error
 * chrome is exactly what the probe must REPORT, and the row assertion below does so with the
 * visible text attached — a settle timeout would name the locator instead of the cause.
 */
const settle = async (page: Page, lng: Locale): Promise<void> => {
  await page
    .getByRole('main')
    .waitFor({ state: 'visible', timeout: SETTLE_TIMEOUT })
    .catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await engagementRows(page)
    .or(errorChrome(page, lng))
    .first()
    .waitFor({ state: 'visible', timeout: SETTLE_TIMEOUT })
    .catch(() => {})
  await page.waitForTimeout(3_000)
}

const probe = async (page: Page, lng: Locale): Promise<void> => {
  await loginForListPages(page, lng)
  await page.goto(`/engagements?lng=${lng}`)
  await settle(page, lng)

  const errorText = squash((await errorChrome(page, lng).allInnerTexts()).join(' | '))
  if (errorText !== '') console.error(`[P102-05] /engagements ${lng} error chrome: ${errorText}`)
  expect.soft(errorText, `ERROR-CHROME ${lng}: ${errorText}`).toBe('')

  const lang = await page.evaluate(() => document.documentElement.lang)
  expect.soft(lang, `/engagements must render under an ASSERTED ${lng}, got "${lang}"`).toBe(lng)

  const rows = await engagementRows(page).count()
  const shown = rows === EXPECTED_ROWS ? '' : squash(await page.locator('body').innerText())
  if (shown !== '') console.error(`[P102-05] /engagements ${lng} rows=${rows} body: ${shown}`)
  expect(rows, `ROWS ${lng}: ${rows} of ${EXPECTED_ROWS}; body reads: ${shown.slice(0, 300)}`).toBe(
    EXPECTED_ROWS,
  )
}

test.describe('ENGREAD-01 — /engagements render probe', () => {
  test.use({ viewport: { width: 1400, height: 900 }, storageState: { cookies: [], origins: [] } })

  // Login + settle can take a cold dev server well past the 30 s default; wall-clock here measures
  // the machine, not the surface.
  test.beforeEach(() => {
    test.setTimeout(180_000)
  })

  test('renders 5 engagement rows on a settled en surface', async ({ page }) => {
    await probe(page, 'en')
  })

  test('renders 5 engagement rows on a settled ar surface', async ({ page }) => {
    await probe(page, 'ar')
  })
})
