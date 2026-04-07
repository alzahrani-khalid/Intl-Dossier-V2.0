import type { Locator, Page } from '@playwright/test'

export default class CommandPalettePage {
  constructor(public readonly page: Page) {}

  get root(): Locator {
    return this.page.getByRole('dialog', { name: /command.*palette|لوحة.*الأوامر/i })
  }

  get searchInput(): Locator {
    return this.root.getByRole('combobox')
  }

  async open(): Promise<void> {
    const accelerator = process.platform === 'darwin' ? 'Meta+K' : 'Control+K'
    await this.page.keyboard.press(accelerator)
    await this.root.waitFor({ state: 'visible' })
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query)
  }

  async selectResult(label: string): Promise<void> {
    await this.root.getByRole('option', { name: label }).first().click()
  }

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape')
  }
}
