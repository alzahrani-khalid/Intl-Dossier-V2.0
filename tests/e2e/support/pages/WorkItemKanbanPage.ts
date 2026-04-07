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
   * Drag a card to a target column.
   *
   * NOTE: Wave 3 will replace this stub with a manual mouse sequence
   * (mouse.move + down + up) because @dnd-kit does not respond reliably
   * to `locator.dragTo()`. Keeping the stub here so spec waves compile.
   */
  async dragCardToColumn(_cardTitle: string, _targetColumn: KanbanColumn): Promise<void> {
    throw new Error('dragCardToColumn: not implemented — see Wave 3 manual-mouse implementation')
  }
}
