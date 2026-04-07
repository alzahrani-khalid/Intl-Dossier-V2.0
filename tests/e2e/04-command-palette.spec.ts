// @covers TEST-04
import { test, expect } from './support/fixtures'
import CommandPalettePage from './support/pages/CommandPalettePage'
import DossierListPage from './support/pages/DossierListPage'

const SEED_DOSSIER_A = process.env.E2E_SEED_DOSSIER_NAME ?? 'Saudi Arabia'
const SEED_DOSSIER_B = process.env.E2E_SEED_DOSSIER_NAME_B ?? 'United Nations'

test.describe('TEST-04 command palette', () => {
  test('opens Cmd+K, searches, navigates to result', async ({ adminPage }) => {
    await adminPage.goto('/')
    const palette = new CommandPalettePage(adminPage)
    await palette.open()
    await palette.search(SEED_DOSSIER_A)
    await expect(palette.root.getByRole('option', { name: new RegExp(SEED_DOSSIER_A, 'i') }).first()).toBeVisible()
    await adminPage.keyboard.press('Enter')
    await expect(adminPage).toHaveURL(/\/dossiers\/[0-9a-f-]+/i)
  })

  test('Cmd+K shows recent items after navigation', async ({ adminPage }) => {
    const list = new DossierListPage(adminPage)
    const palette = new CommandPalettePage(adminPage)

    await list.goto()
    await list.openDossier(SEED_DOSSIER_A)
    await expect(adminPage).toHaveURL(/\/dossiers\/[0-9a-f-]+/i)
    await list.goto()
    await list.openDossier(SEED_DOSSIER_B)
    await expect(adminPage).toHaveURL(/\/dossiers\/[0-9a-f-]+/i)

    await palette.open()
    const recentSection = palette.root.getByRole('group', { name: /recent|الأخيرة/i })
    await expect(recentSection).toBeVisible()
    await expect(recentSection.getByText(new RegExp(SEED_DOSSIER_A, 'i'))).toBeVisible()
    await expect(recentSection.getByText(new RegExp(SEED_DOSSIER_B, 'i'))).toBeVisible()
    await palette.close()
  })
})
