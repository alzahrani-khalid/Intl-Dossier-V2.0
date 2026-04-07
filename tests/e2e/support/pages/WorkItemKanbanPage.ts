import type { Locator, Page } from '@playwright/test'

export type KanbanColumn = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'

export interface CreateTaskInput {
  readonly title: string
  readonly assigneeRole?: 'admin' | 'analyst' | 'intake'
  readonly priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export default class WorkItemKanbanPage {
  constructor(public readonly page: Page) {}

  column(name: KanbanColumn): Locator {
    return this.page.getByTestId(`kanban-column-${name}`)
  }

  card(title: string): Locator {
    return this.page.getByRole('article', { name: title })
  }

  async goto(): Promise<void> {
    await this.page.goto('/my-work')
  }

  async createTask(input: CreateTaskInput): Promise<void> {
    await this.page.getByRole('button', { name: /new task|create task|مهمة جديدة/i }).click()
    await this.page.getByLabel(/title|العنوان/i).fill(input.title)
    if (input.priority !== undefined) {
      await this.page.getByLabel(/priority|الأولوية/i).click()
      await this.page.getByRole('option', { name: new RegExp(input.priority, 'i') }).click()
    }
    await this.page.getByRole('button', { name: /save|create|حفظ/i }).click()
  }

  /**
   * Drag a card to a target column using a manual pointer sequence.
   *
   * @dnd-kit listens for `pointermove` events with a minimum activation
   * distance (8px by default) and does NOT respond to Playwright's
   * `locator.dragTo()` (which emits HTML5 drag events). The documented
   * workaround is a manual `mouse.down` → small move (to cross activation
   * distance) → large move (to destination) → `mouse.up` sequence.
   */
  async dragCardToColumn(cardTitle: string, targetColumn: KanbanColumn): Promise<void> {
    const card = this.card(cardTitle)
    const target = this.column(targetColumn)
    const cardBox = await card.boundingBox()
    const targetBox = await target.boundingBox()
    if (!cardBox || !targetBox) {
      throw new Error(
        `dragCardToColumn: missing bounding box (card=${cardBox != null}, target=${targetBox != null})`,
      )
    }
    const startX = cardBox.x + cardBox.width / 2
    const startY = cardBox.y + cardBox.height / 2
    const endX = targetBox.x + targetBox.width / 2
    const endY = targetBox.y + targetBox.height / 2

    await this.page.mouse.move(startX, startY)
    await this.page.mouse.down()
    // Small nudge to cross @dnd-kit's 8px activation distance.
    await this.page.mouse.move(startX + 10, startY + 10, { steps: 5 })
    // Large, smoothly-stepped move to the destination.
    await this.page.mouse.move(endX, endY, { steps: 20 })
    await this.page.mouse.up()
    // @dnd-kit drop animation / state settle.
    await this.page.waitForTimeout(200)
  }
}
