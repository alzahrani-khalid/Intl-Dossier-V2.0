// @covers TEST-10
import { test, expect } from './support/fixtures'
import OperationsHubPage, {
  type OperationsZone,
} from './support/pages/OperationsHubPage'

const ADMIN_ZONES: readonly OperationsZone[] = [
  'intake',
  'queue',
  'in-progress',
  'review',
  'completed',
]

test.describe('TEST-10 Operations Hub', () => {
  test('renders all zones for admin role', async ({ adminPage }) => {
    const hub = new OperationsHubPage(adminPage)
    await hub.goto()

    for (const zone of ADMIN_ZONES) {
      await hub.expectZoneVisible(zone)
    }
  })

  test('different role sees a different zone composition', async ({ analystPage }) => {
    // DECISION (per plan): role scoping is driven by JWT claims, so we
    // re-enter the hub with a different storageState (analystPage) rather
    // than toggling an in-app role switcher. This exercises the real
    // authorization path.
    const hub = new OperationsHubPage(analystPage)
    await hub.goto()

    // Analyst must see the in-progress zone at minimum; the intake zone
    // is admin/intake-officer only and must NOT be visible.
    await hub.expectZoneVisible('in-progress')
    await expect(hub.zone('intake')).toBeHidden()
  })

  test('clicking a zone item navigates to its detail view', async ({ adminPage }) => {
    const hub = new OperationsHubPage(adminPage)
    await hub.goto()
    await hub.expectZoneVisible('queue')

    // Click the first link inside the queue zone (whatever it is) and
    // assert we land on a work-item / dossier / engagement detail URL.
    const firstLink = hub.zone('queue').getByRole('link').first()
    const count = await firstLink.count()
    test.skip(count === 0, 'Operations Hub queue empty in this environment')
    await firstLink.click()
    await expect(adminPage).toHaveURL(
      /\/(work-items|dossiers|engagements|intake)\/[0-9a-f-]+/i,
    )
  })
})
