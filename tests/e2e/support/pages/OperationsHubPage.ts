import type { Locator, Page } from '@playwright/test'

export type OperationsZone = 'attention' | 'timeline' | 'engagements' | 'stats' | 'activity'
export type DashboardRole = 'leadership' | 'officer' | 'analyst'

export const ZONE_ORDER: Record<DashboardRole, OperationsZone[]> = {
  leadership: ['engagements', 'stats', 'attention', 'timeline', 'activity'],
  officer: ['attention', 'timeline', 'stats', 'engagements', 'activity'],
  analyst: ['timeline', 'activity', 'attention', 'engagements', 'stats'],
}

export default class OperationsHubPage {
  constructor(public readonly page: Page) {}

  zone(name: OperationsZone): Locator {
    return this.page.getByTestId(`ops-zone-${name}`)
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard')
  }

  async expectZoneVisible(zone: OperationsZone): Promise<void> {
    await this.zone(zone).waitFor({ state: 'visible' })
  }

  async getZoneOrder(): Promise<string[]> {
    const zones = this.page.locator('[data-testid^="ops-zone-"]')
    await zones.first().waitFor({ state: 'visible', timeout: 15_000 })
    const count = await zones.count()
    const order: string[] = []
    for (let i = 0; i < count; i++) {
      const testId = await zones.nth(i).getAttribute('data-testid')
      if (testId) {
        order.push(testId.replace('ops-zone-', ''))
      }
    }
    return order
  }

  async switchRole(role: DashboardRole): Promise<void> {
    await this.page.getByTestId('role-switcher').click()
    await this.page.getByRole('menuitem', { name: new RegExp(role, 'i') }).click()
    // Wait for zones to re-render after role switch
    await this.page.locator('[data-testid^="ops-zone-"]').first().waitFor({ state: 'visible' })
  }

  async clickItem(zone: OperationsZone, itemTitle: string): Promise<void> {
    await this.zone(zone).getByRole('link', { name: itemTitle }).first().click()
  }
}
