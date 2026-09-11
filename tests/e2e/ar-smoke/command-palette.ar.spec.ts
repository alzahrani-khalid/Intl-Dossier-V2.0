// @covers TEST-04 (ar-smoke)
import { test, expect } from '../support/fixtures'
import { switchLanguage } from '../support/helpers/language'
import CommandPalettePage from '../support/pages/CommandPalettePage'

const SEED_DOSSIER_NAME = process.env.E2E_SEED_DOSSIER_NAME ?? 'Saudi Arabia'

test.describe('TEST-04 command palette (ar-smoke)', () => {
  test('Cmd+K opens with dir=rtl and navigates to a dossier', async ({
    adminPage,
  }) => {
    // prettier-ignore
    test.fixme(true, 'P101-QUAR 31848669722: spec drift in the shared helper - switchLanguage (tests/e2e/support/helpers/language.ts, outside this unit) sets ?lang=ar, a key the app does not read (the detector reads ?lng= since 05271fb43, and id.locale), so html dir stayed ltr; the next step is red on the same run too - the EN mirror 04-command-palette timed out waiting for the palette dialog (log line 798 of job 94920109119); log line 958 of job 94920109185; owner Phase 102')
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
