import type { Locator, Page } from '@playwright/test'

export type EngagementStage = 'planning' | 'active' | 'completed'

export interface CreateEngagementInput {
  readonly title: string
  readonly dossierId: string
  readonly type: string
}

export default class EngagementPage {
  constructor(public readonly page: Page) {}

  get newEngagementButton(): Locator {
    return this.page.getByRole('button', { name: /new engagement|create engagement|تفاعل جديد/i })
  }

  async goto(): Promise<void> {
    await this.page.goto('/engagements')
  }

  async create(input: CreateEngagementInput): Promise<void> {
    await this.newEngagementButton.click()
    await this.page.getByLabel(/title|العنوان/i).fill(input.title)
    await this.page.getByLabel(/dossier|الملف/i).fill(input.dossierId)
    await this.page.getByLabel(/type|النوع/i).fill(input.type)
    await this.page.getByRole('button', { name: /save|create|حفظ/i }).click()
  }

  async transitionTo(stage: EngagementStage): Promise<void> {
    await this.page.getByRole('button', { name: new RegExp(stage, 'i') }).click()
  }
}
