// @covers TEST-10
import { test, expect } from './support/fixtures'
import OperationsHubPage, {
  ZONE_ORDER,
  type OperationsZone,
} from './support/pages/OperationsHubPage'

const ALL_ZONES: readonly OperationsZone[] = [
  'attention',
  'timeline',
  'engagements',
  'stats',
  'activity',
]

test.describe('TEST-10 Operations Hub', () => {
  test('renders all 5 zones for leadership role', async ({ adminPage }) => {
    const hub = new OperationsHubPage(adminPage)
    await hub.goto()

    for (const zone of ALL_ZONES) {
      await hub.expectZoneVisible(zone)
    }
  })

  test('leadership role sees zones in correct order', async ({ adminPage }) => {
    const hub = new OperationsHubPage(adminPage)
    await hub.goto()

    const order = await hub.getZoneOrder()
    const expected = ZONE_ORDER.leadership
    expect(order[0]).toBe(expected[0])
    expect(order[1]).toBe(expected[1])
  })

  test('analyst role sees all zones in analyst order', async ({ analystPage }) => {
    const hub = new OperationsHubPage(analystPage)
    await hub.goto()

    // All 5 zones are visible for analyst
    for (const zone of ALL_ZONES) {
      await hub.expectZoneVisible(zone)
    }

    // Verify analyst-specific ordering
    const order = await hub.getZoneOrder()
    const expected = ZONE_ORDER.analyst
    expect(order[0]).toBe(expected[0])
    expect(order[1]).toBe(expected[1])
  })

  test('clicking a zone item navigates to its detail view', async ({ adminPage }) => {
    const hub = new OperationsHubPage(adminPage)
    await hub.goto()
    await hub.expectZoneVisible('engagements')

    // Click the first link inside the engagements zone and
    // assert we land on a work-item / dossier / engagement detail URL.
    const firstLink = hub.zone('engagements').getByRole('link').first()
    const count = await firstLink.count()
    test.skip(count === 0, 'Operations Hub engagements zone empty in this environment')
    await firstLink.click()
    await expect(adminPage).toHaveURL(
      /\/(work-items|dossiers|engagements|intake)\/[0-9a-f-]+/i,
    )
  })
})
