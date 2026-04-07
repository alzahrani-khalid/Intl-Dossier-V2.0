import type { Locator, Page } from '@playwright/test'

export type OperationsZone = 'intake' | 'queue' | 'in-progress' | 'review' | 'completed'
export type OperationsRole = 'admin' | 'analyst' | 'intake'

export default class OperationsHubPage {
  constructor(public readonly page: Page) {}

  zone(name: OperationsZone): Locator {
    return this.page.getByTestId(`ops-zone-${name}`)
  }

  async goto(): Promise<void> {
    await this.page.goto('/operations')
  }

  async expectZoneVisible(zone: OperationsZone): Promise<void> {
    await this.zone(zone).waitFor({ state: 'visible' })
  }

  async switchRole(role: OperationsRole): Promise<void> {
    await this.page.getByRole('button', { name: /role|الدور/i }).click()
    await this.page.getByRole('option', { name: new RegExp(role, 'i') }).click()
  }

  async clickItem(zone: OperationsZone, itemTitle: string): Promise<void> {
    await this.zone(zone).getByRole('link', { name: itemTitle }).first().click()
  }
}
