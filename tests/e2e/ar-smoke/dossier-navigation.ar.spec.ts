// @covers TEST-03 (ar-smoke)
import { test, expect } from '../support/fixtures'
import { switchLanguage } from '../support/helpers/language'
import DossierListPage from '../support/pages/DossierListPage'
import DossierDetailPage, {
  type DossierTabName,
} from '../support/pages/DossierDetailPage'

const SEED_DOSSIER_NAME = process.env.E2E_SEED_DOSSIER_NAME ?? 'Saudi Arabia'
const TABS: readonly DossierTabName[] = ['overview', 'docs', 'work-items', 'calendar', 'relationships']

test.describe('TEST-03 dossier navigation (ar-smoke)', () => {
  test('navigates list -> detail -> tabs in Arabic, dir=rtl preserved', async ({
    analystPage,
  }) => {
    const list = new DossierListPage(analystPage)
    const detail = new DossierDetailPage(analystPage)

    await list.goto()
    await switchLanguage(analystPage, 'ar')
    await expect(analystPage.locator('html')).toHaveAttribute('dir', 'rtl')

    // Seed dossier names are bilingual / stable — search still works in AR.
    await list.searchByName(SEED_DOSSIER_NAME)
    await expect(
      analystPage.getByRole('link', { name: SEED_DOSSIER_NAME }).first(),
    ).toBeVisible()
    await list.openDossier(SEED_DOSSIER_NAME)
    await expect(analystPage).toHaveURL(/\/dossiers\/[0-9a-f-]+/i)
    // dir=rtl survives route change.
    await expect(analystPage.locator('html')).toHaveAttribute('dir', 'rtl')

    for (const tab of TABS) {
      await detail.openTab(tab)
      await expect(detail.tab(tab)).toHaveAttribute('aria-selected', 'true')
    }
    // Final RTL assertion after all tab switches.
    await expect(analystPage.locator('html')).toHaveAttribute('dir', 'rtl')
  })
})
