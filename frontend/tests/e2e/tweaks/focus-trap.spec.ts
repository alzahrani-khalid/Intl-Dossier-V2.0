import { test, expect, type Page } from '@playwright/test'

async function authBypass(page: Page): Promise<void> {
  await page.addInitScript((): void => {
    const now = Math.floor(Date.now() / 1000)
    const user = {
      id: '11111111-1111-1111-1111-111111111111',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { name: 'Test' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    localStorage.setItem(
      'sb-zkrcjzdemdmwhearhfgg-auth-token',
      JSON.stringify({
        access_token: 'fake-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: now + 3600,
        refresh_token: 'fake-refresh-token',
        user,
      }),
    )
    const payload = {
      state: {
        user: { id: user.id, email: user.email, name: 'Test' },
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

    const gear = page.getByRole('button', { name: 'Tweaks' })
    await gear.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Design direction')).toBeVisible()

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

    const gear = page.getByRole('button', { name: 'تخصيص' })
    await gear.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('الاتجاه التصميمي')).toBeVisible()

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
