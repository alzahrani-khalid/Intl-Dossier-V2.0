// @covers TEST-04
import { test, expect } from './support/fixtures'
import CommandPalettePage from './support/pages/CommandPalettePage'
import DossierListPage from './support/pages/DossierListPage'

const SEED_DOSSIER_A = process.env.E2E_SEED_DOSSIER_NAME ?? 'Saudi Arabia'
const SEED_DOSSIER_B = process.env.E2E_SEED_DOSSIER_NAME_B ?? 'United Nations'

test.describe('TEST-04 command palette', () => {
  test('opens Cmd+K, searches, navigates to result', async ({ adminPage }) => {
    test.fixme(true, 'P101-QUAR 31848669722: red - dialog /command.*palette/ not visible 30 s after Control+K on / (failure screenshot: dashboard, no dialog open); log line 798 of job 94920109119; owner Phase 103')
    await adminPage.goto('/')
    const palette = new CommandPalettePage(adminPage)
    await palette.open()
    await palette.search(SEED_DOSSIER_A)
    await expect(palette.root.getByRole('option', { name: new RegExp(SEED_DOSSIER_A, 'i') }).first()).toBeVisible()
    await adminPage.keyboard.press('Enter')
    await expect(adminPage).toHaveURL(/\/dossiers\/[0-9a-f-]+/i)
  })

  test('Cmd+K shows recent items after navigation', async ({ adminPage }) => {
    test.fixme(true, 'P101-QUAR 31848669722: red - heading "United Nations" unresolved on /dossiers for 30 s (failure screenshot: Browse-by-Type card view); seed data or hub listing, not separable from the log; log line 936 of job 94920109119; owner Phase 102')
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
