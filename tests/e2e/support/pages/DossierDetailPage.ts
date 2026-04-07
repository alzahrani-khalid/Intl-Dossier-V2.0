import type { Locator, Page } from '@playwright/test'

export type DossierTabName = 'overview' | 'docs' | 'work-items' | 'calendar' | 'relationships'

export default class DossierDetailPage {
  constructor(public readonly page: Page) {}

  tab(name: DossierTabName): Locator {
    return this.page.getByRole('tab', { name: new RegExp(name.replace('-', '.?'), 'i') })
  }

  get relationshipSidebar(): Locator {
    return this.page.getByTestId('dossier-relationship-sidebar')
  }

  async gotoById(id: string): Promise<void> {
    await this.page.goto(`/dossiers/${id}`)
  }

  async openTab(name: DossierTabName): Promise<void> {
    await this.tab(name).click()
  }

  async openRelationshipSidebar(): Promise<void> {
    await this.page.getByRole('button', { name: /relationships|علاقات/i }).click()
  }

  async closeRelationshipSidebar(): Promise<void> {
    await this.page.getByRole('button', { name: /close.*relationships|إغلاق/i }).click()
  }
}
