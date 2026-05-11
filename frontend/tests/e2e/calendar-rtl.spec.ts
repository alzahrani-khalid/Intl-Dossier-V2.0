import { test, expect } from '@playwright/test'

// Phase 39 Plan 39-05: activate Arabic dow + Arabic-Indic day-digit assertions.
// i18next localStorage key is `id.locale` per frontend/src/i18n/index.ts (lookupLocalStorage).
test.describe('Phase 39: Calendar RTL — Arabic dow + Indic digits', () => {
  test('renders Arabic short labels and Arabic-Indic day digits in ar', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('id.locale', 'ar')
      } catch {
        // ignore — non-browser context
      }
    })
    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')

    const dow = page.locator('.cal-dow')
    await expect(dow).toHaveCount(7)
    const labels = await dow.allTextContents()
    const hasArabicDow = labels.some((s) => /أحد|إثن|ثلا|أرب|خمي|جمع|سبت/.test(s))
    expect(hasArabicDow).toBe(true)

    const dayCells = page.locator('.cal-d')
    const dayCount = await dayCells.count()
    expect(dayCount).toBeGreaterThanOrEqual(28)

    const allDayText = (await dayCells.allTextContents()).join('')
    expect(/[٠-٩]/.test(allDayText)).toBe(true)
    // No Western digits should appear in day-number cells in ar locale
    expect(/[0-9]/.test(allDayText)).toBe(false)
  })
})
