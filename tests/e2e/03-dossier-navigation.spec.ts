// @covers TEST-03
import { test, expect } from './support/fixtures'
import DossierListPage from './support/pages/DossierListPage'
import DossierDetailPage, { type DossierTabName } from './support/pages/DossierDetailPage'

const SEED_DOSSIER_NAME = process.env.E2E_SEED_DOSSIER_NAME ?? 'Saudi Arabia'
const TABS: readonly DossierTabName[] = ['overview', 'docs', 'work-items', 'calendar', 'relationships']

test.describe('TEST-03 dossier navigation', () => {
  test('navigates list -> detail -> tabs -> RelationshipSidebar', async ({ analystPage }) => {
    const list = new DossierListPage(analystPage)
    const detail = new DossierDetailPage(analystPage)

    await list.goto()
    await list.searchByName(SEED_DOSSIER_NAME)
    await expect(analystPage.getByRole('link', { name: SEED_DOSSIER_NAME }).first()).toBeVisible()
    await list.openDossier(SEED_DOSSIER_NAME)
    await expect(analystPage).toHaveURL(/\/dossiers\/[0-9a-f-]+/i)

    for (const tab of TABS) {
      await detail.openTab(tab)
      await expect(detail.tab(tab)).toHaveAttribute('aria-selected', 'true')
    }

    await detail.openRelationshipSidebar()
    await expect(detail.relationshipSidebar).toBeVisible()
    await expect(detail.relationshipSidebar.getByRole('listitem').first()).toBeVisible()
    await detail.closeRelationshipSidebar()
    await expect(detail.relationshipSidebar).toBeHidden()
  })
})
