/**
 * phase-36-shell-smoke.spec.ts — Wave 2 Plan 36-05 GREEN Playwright smoke.
 *
 * 4 directions × 2 locales = 8 'shell chrome smoke' describe blocks.
 * VALIDATION.md task id 36-05-06 grep target: 'shell chrome smoke'.
 * Do NOT rename the describe strings — CI --grep depends on them.
 */

import { expect } from '@playwright/test'
import { test } from './support/fixtures'

type Direction = 'chancery' | 'situation' | 'ministerial' | 'bureau'
type Locale = 'en' | 'ar'

const LS_DIR = 'id.dir'
const LS_LOCALE = 'id.locale'

const smokeCheck = async (
  page: import('@playwright/test').Page,
  direction: Direction,
  locale: Locale,
): Promise<void> => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  // Prime localStorage BEFORE the app boots so DesignProvider / LanguageProvider
  // pick up the desired state on first render.
  await page.goto('/')
  await page.evaluate(
    ({ dirKey, d, locKey, l }: { dirKey: string; d: string; locKey: string; l: string }) => {
      localStorage.setItem(dirKey, d)
      localStorage.setItem(locKey, l)
    },
    { dirKey: LS_DIR, d: direction, locKey: LS_LOCALE, l: locale },
  )
  await page.reload()
  await page.waitForSelector('.appshell', { timeout: 10000 })

  // Capture a screenshot clipped to the shell chrome (topbar + classification
  // ribbon + sidebar column).
  const buffer = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 1280, height: 240 },
    path: `test-results/phase-36-shell-smoke/${direction}-${locale}.png`,
  })
  expect(buffer.length).toBeGreaterThan(1000)

  // No page errors allowed. Console errors from ad-network / analytics etc.
  // are filtered at the emitter level in CI config, but we still fail on
  // anything that surfaced in THIS test.
  if (errors.length > 0) {
    throw new Error(`Unexpected errors in ${direction}/${locale} smoke: ${errors.join(' | ')}`)
  }
}

test.describe('shell chrome smoke chancery en', () => {
  test('renders shell chrome for chancery × en', async ({ adminPage: page }) => {
    await smokeCheck(page, 'chancery', 'en')
  })
})

test.describe('shell chrome smoke chancery ar', () => {
  test('renders shell chrome for chancery × ar', async ({ adminPage: page }) => {
    await smokeCheck(page, 'chancery', 'ar')
  })
})

test.describe('shell chrome smoke situation en', () => {
  test('renders shell chrome for situation × en', async ({ adminPage: page }) => {
    await smokeCheck(page, 'situation', 'en')
  })
})

test.describe('shell chrome smoke situation ar', () => {
  test('renders shell chrome for situation × ar', async ({ adminPage: page }) => {
    await smokeCheck(page, 'situation', 'ar')
  })
})

test.describe('shell chrome smoke ministerial en', () => {
  test('renders shell chrome for ministerial × en', async ({ adminPage: page }) => {
    await smokeCheck(page, 'ministerial', 'en')
  })
})

test.describe('shell chrome smoke ministerial ar', () => {
  test('renders shell chrome for ministerial × ar', async ({ adminPage: page }) => {
    await smokeCheck(page, 'ministerial', 'ar')
  })
})

test.describe('shell chrome smoke bureau en', () => {
  test('renders shell chrome for bureau × en', async ({ adminPage: page }) => {
    await smokeCheck(page, 'bureau', 'en')
  })
})

test.describe('shell chrome smoke bureau ar', () => {
  test('renders shell chrome for bureau × ar', async ({ adminPage: page }) => {
    await smokeCheck(page, 'bureau', 'ar')
  })
})
