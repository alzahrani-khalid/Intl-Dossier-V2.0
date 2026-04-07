import type { Locator, Page } from '@playwright/test'

export default class BriefingPage {
  constructor(public readonly page: Page) {}

  get docsTab(): Locator {
    return this.page.getByRole('tab', { name: /docs|مستندات/i })
  }

  get generateBriefingButton(): Locator {
    return this.page.getByRole('button', { name: /generate.*briefing|توليد.*الموجز/i })
  }

  get briefingReadyIndicator(): Locator {
    return this.page.getByTestId('briefing-ready')
  }

  async gotoForDossier(id: string): Promise<void> {
    await this.page.goto(`/dossiers/${id}`)
  }

  async openDocsTab(): Promise<void> {
    await this.docsTab.click()
  }

  async clickGenerateBriefing(): Promise<void> {
    await this.generateBriefingButton.click()
  }

  /**
   * Wait for the briefing to reach a "ready" state.
   * Wave 3 will back this with `page.route()` stubs to avoid AnythingLLM flake.
   */
  async waitForBriefingReady(): Promise<void> {
    await this.briefingReadyIndicator.waitFor({ state: 'visible', timeout: 60_000 })
  }
}
