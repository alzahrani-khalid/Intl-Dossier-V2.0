import { test, expect, type Page } from '@playwright/test'

async function authBypass(page: Page): Promise<void> {
  await page.addInitScript((): void => {
    const payload = {
      state: {
        user: { id: 'test-user', email: 'test@example.com', name: 'Test' },
        isAuthenticated: true,
      },
      version: 0,
    }
    localStorage.setItem('auth-storage', JSON.stringify(payload))
  })
}

async function seedLocale(page: Page, locale: 'en' | 'ar'): Promise<void> {
  await page.addInitScript((l: 'en' | 'ar'): void => {
    localStorage.setItem('id.locale', l)
  }, locale)
}

test.describe('Tweaks drawer focus trap (SC-4)', () => {
  test('LTR: focus trap inside drawer; ESC dismisses; focus returns to trigger', async ({
    page,
  }) => {
    await authBypass(page)
    await seedLocale(page, 'en')
    await page.goto('/')

    const gear = page.getByRole('button', { name: 'Open tweaks' })
    await gear.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Direction')).toBeVisible()

    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab')
      const focusedInsideDialog = await dialog.evaluate((el: Element) =>
        el.contains(document.activeElement),
      )
      expect(focusedInsideDialog).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(gear).toBeFocused()
  })

  test('RTL: focus trap inside drawer; ESC dismisses; focus returns to trigger', async ({
    page,
  }) => {
    await authBypass(page)
    await seedLocale(page, 'ar')
    await page.goto('/')

    const gear = page.getByRole('button', { name: 'فتح التعديلات' })
    await gear.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('الاتجاه')).toBeVisible()

    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab')
      const focusedInsideDialog = await dialog.evaluate((el: Element) =>
        el.contains(document.activeElement),
      )
      expect(focusedInsideDialog).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(gear).toBeFocused()
  })
})
