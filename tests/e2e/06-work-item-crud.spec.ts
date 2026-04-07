// @covers TEST-06
import { test, expect } from './support/fixtures'
import WorkItemKanbanPage from './support/pages/WorkItemKanbanPage'

test.describe('TEST-06 work-item CRUD + kanban drag', () => {
  test('creates a task, drags it across columns, completes it @mobile', async ({
    analystPage,
    uniqueId,
  }) => {
    const kanban = new WorkItemKanbanPage(analystPage)
    const title = uniqueId('task')

    await kanban.goto()
    await kanban.createTask({ title, assigneeRole: 'analyst', priority: 'high' })

    // Initial state: card lives in the `todo` column.
    await expect(kanban.column('todo').getByRole('article', { name: title })).toBeVisible()

    // todo -> in_progress
    await kanban.dragCardToColumn(title, 'in_progress')
    await expect(
      kanban.column('in_progress').getByRole('article', { name: title }),
    ).toBeVisible()

    // in_progress -> review
    await kanban.dragCardToColumn(title, 'review')
    await expect(kanban.column('review').getByRole('article', { name: title })).toBeVisible()

    // review -> done (completion)
    await kanban.dragCardToColumn(title, 'done')
    await expect(kanban.column('done').getByRole('article', { name: title })).toBeVisible()
  })
})
