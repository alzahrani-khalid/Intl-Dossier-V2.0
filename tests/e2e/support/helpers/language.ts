import { expect, type Page } from '@playwright/test'

/**
 * Switch the application language and assert the `dir` attribute flips
 * accordingly. Tries the `?lang=` query param first (fast, deterministic)
 * and falls back to clicking the in-app language selector if present.
 */
export const switchLanguage = async (page: Page, lang: 'en' | 'ar'): Promise<void> => {
  const currentUrl = new URL(page.url())
  currentUrl.searchParams.set('lang', lang)
  await page.goto(currentUrl.toString())

  const expectedDir = lang === 'ar' ? 'rtl' : 'ltr'
  try {
    await expect(page.locator('html')).toHaveAttribute('dir', expectedDir, { timeout: 2_000 })
    return
  } catch {
    // Fall through to UI-driven switch.
  }

  const selector = page.getByRole('button', { name: new RegExp(lang === 'ar' ? 'arabic|العربية' : 'english', 'i') })
  if ((await selector.count()) > 0) {
    await selector.first().click()
  }
  await expect(page.locator('html')).toHaveAttribute('dir', expectedDir, { timeout: 5_000 })
}
