import { expect, type Page } from '@playwright/test'

const SETTLE_TIMEOUT = 20_000

/**
 * Waits for the rendered surface to hydrate before an oracle reads it.
 *
 * This sequence is intentionally mechanism-identical to the law-conformant pair in
 * 98-copy04-voice.spec.ts: main visible, best-effort network idle, then the proven 3 s dwell.
 */
export const settle = async (page: Page): Promise<void> => {
  await expect(page.getByRole('main')).toBeVisible({ timeout: SETTLE_TIMEOUT })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(3_000)
}

/** The capture's locale is asserted, never inherited from navigation or browser defaults. */
export const expectLocale = async (
  page: Page,
  lng: 'en' | 'ar',
  surface: string,
): Promise<void> => {
  const lang = await page.evaluate(() => document.documentElement.lang)
  expect(lang, `${surface} must render under an ASSERTED ${lng}, not an inherited locale`).toBe(lng)
}
