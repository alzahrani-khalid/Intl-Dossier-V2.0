// @covers TEST-04 (ar-smoke)
import { test, expect } from '../support/fixtures'
import { switchLanguage } from '../support/helpers/language'
import CommandPalettePage from '../support/pages/CommandPalettePage'

const SEED_DOSSIER_NAME = process.env.E2E_SEED_DOSSIER_NAME ?? 'Saudi Arabia'

test.describe('TEST-04 command palette (ar-smoke)', () => {
  test('Cmd+K opens with dir=rtl and navigates to a dossier', async ({
    adminPage,
  }) => {
    await adminPage.goto('/')
    await switchLanguage(adminPage, 'ar')
    await expect(adminPage.locator('html')).toHaveAttribute('dir', 'rtl')

    const palette = new CommandPalettePage(adminPage)
    await palette.open()

    // The palette overlay inherits dir=rtl from the html root.
    await expect(adminPage.locator('html')).toHaveAttribute('dir', 'rtl')

    // Seed dossier names are bilingual — English query still matches in AR UI.
    await palette.search(SEED_DOSSIER_NAME)
    await expect(
      adminPage.getByRole('option', { name: SEED_DOSSIER_NAME }).first(),
    ).toBeVisible()
    await adminPage.keyboard.press('Enter')

    await expect(adminPage).toHaveURL(/\/dossiers\/[0-9a-f-]+/i)
    await expect(adminPage.locator('html')).toHaveAttribute('dir', 'rtl')
  })
})
