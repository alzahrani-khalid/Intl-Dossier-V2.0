import type { Download, Locator, Page } from '@playwright/test'

/**
 * Page object for the dossier hub at `/dossiers`.
 *
 * The hub (`DossierListPage` component) lists every dossier type as an
 * `ExpandableDossierCard`. A card's collapsed state is a clickable `<div>` (not a
 * link) whose name is rendered in a heading; clicking it expands an overlay that
 * exposes a "View dossier" action which navigates to the type-segmented detail
 * route (e.g. `/dossiers/countries/<id>`).
 */
export default class DossierListPage {
  constructor(public readonly page: Page) {}

  // Hub search is a text input (role=textbox). The global Topbar/Sidebar searches
  // are role=searchbox, so scoping to textbox avoids matching them.
  get searchInput(): Locator {
    return this.page.getByRole('textbox', { name: /search dossiers|البحث في الدوسيهات/i })
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

  /** The card heading for a dossier, used to open its expandable card. */
  card(name: string): Locator {
    return this.page.getByRole('heading', { name })
  }

  async searchByName(name: string): Promise<void> {
    await this.searchInput.fill(name)
    // The hub commits the search query on Enter (onKeyDown), not on every keystroke.
    await this.searchInput.press('Enter')
  }

  async openDossier(name: string): Promise<void> {
    // Expand the card, then trigger its "View dossier" action to navigate to detail.
    await this.card(name).first().click()
    await this.page.getByRole('button', { name: /view dossier|عرض الدوسيه/i }).click()
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
