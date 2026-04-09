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
    await this.page.getByRole('button', { name: /role|الدور/i }).click()
    await this.page.getByRole('option', { name: new RegExp(role, 'i') }).click()
  }

  async clickItem(zone: OperationsZone, itemTitle: string): Promise<void> {
    await this.zone(zone).getByRole('link', { name: itemTitle }).first().click()
  }
}
