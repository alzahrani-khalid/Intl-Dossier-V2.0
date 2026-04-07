import type { Download, Locator, Page } from '@playwright/test'

export default class DossierListPage {
  constructor(public readonly page: Page) {}

  get searchInput(): Locator {
    return this.page.getByRole('searchbox', { name: /search|ابحث/i })
  }

  get exportCsvButton(): Locator {
    return this.page.getByRole('button', { name: /export.*csv/i })
  }

  get importCsvInput(): Locator {
    return this.page.getByTestId('dossier-import-csv-input')
  }

  async goto(): Promise<void> {
    await this.page.goto('/dossiers')
  }

  async searchByName(name: string): Promise<void> {
    await this.searchInput.fill(name)
  }

  async openDossier(name: string): Promise<void> {
    await this.page.getByRole('link', { name }).first().click()
  }

  async exportCsv(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.exportCsvButton.click(),
    ])
    return download
  }

  async importCsv(filePath: string): Promise<void> {
    await this.importCsvInput.setInputFiles(filePath)
  }
}
