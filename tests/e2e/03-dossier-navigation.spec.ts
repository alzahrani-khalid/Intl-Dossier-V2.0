// @covers TEST-03
import { test, expect } from './support/fixtures'
import DossierListPage from './support/pages/DossierListPage'
import DossierDetailPage, { type DossierTabName } from './support/pages/DossierDetailPage'

const SEED_DOSSIER_NAME = process.env.E2E_SEED_DOSSIER_NAME ?? 'Saudi Arabia'
const TABS: readonly DossierTabName[] = ['overview', 'engagements', 'docs', 'tasks', 'timeline']

test.describe('TEST-03 dossier navigation', () => {
  test('navigates list -> detail -> tabs -> RelationshipSidebar', async ({ analystPage }) => {
    const list = new DossierListPage(analystPage)
    const detail = new DossierDetailPage(analystPage)

    await list.goto()
    await list.searchByName(SEED_DOSSIER_NAME)
    await expect(list.card(SEED_DOSSIER_NAME).first()).toBeVisible()
    await list.openDossier(SEED_DOSSIER_NAME)
    // Country dossiers open at the type-segmented detail route (redirects to /overview).
    await expect(analystPage).toHaveURL(/\/dossiers\/countries\/[0-9a-f-]+/i)

    for (const tab of TABS) {
      await detail.openTab(tab)
      await expect(detail.tab(tab)).toHaveAttribute('aria-selected', 'true')
    }

    // The RelationshipSidebar is a persistent desktop aside (role="complementary"),
    // open by default and collapsible via its toggle button.
    await expect(detail.relationshipSidebar).toBeVisible()
    await expect(detail.relationshipSidebar).toHaveAttribute('aria-expanded', 'true')
    await detail.collapseRelationshipSidebar()
    await expect(detail.relationshipSidebar).toHaveAttribute('aria-expanded', 'false')
    await detail.expandRelationshipSidebar()
    await expect(detail.relationshipSidebar).toHaveAttribute('aria-expanded', 'true')
  })
})
