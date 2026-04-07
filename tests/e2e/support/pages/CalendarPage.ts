import type { Locator, Page } from '@playwright/test'

export interface CreateEventInput {
  readonly title: string
  readonly start: string
  readonly end: string
}

export default class CalendarPage {
  constructor(public readonly page: Page) {}

  get newEventButton(): Locator {
    return this.page.getByRole('button', { name: /new event|create event|حدث جديد/i })
  }

  async goto(): Promise<void> {
    await this.page.goto('/calendar')
  }

  async createEvent(input: CreateEventInput): Promise<void> {
    await this.newEventButton.click()
    await this.page.getByLabel(/title|العنوان/i).fill(input.title)
    await this.page.getByLabel(/start|البداية/i).fill(input.start)
    await this.page.getByLabel(/end|النهاية/i).fill(input.end)
    await this.page.getByRole('button', { name: /save|حفظ/i }).click()
  }

  async viewEvent(title: string): Promise<void> {
    await this.page.getByRole('button', { name: title }).first().click()
  }
}
