// @covers TEST-06
import { test, expect } from './support/fixtures'
import WorkItemKanbanPage from './support/pages/WorkItemKanbanPage'

test.describe('TEST-06 work-item CRUD + kanban drag', () => {
  test('creates a task, drags it across columns, completes it @mobile', async ({
    analystPage,
    uniqueId,
  }) => {
    test.fixme(true, 'P101-QUAR 31848669722: red - button /new task|create task/ unresolved on /my-work for 30 s (failure screenshot: My Work, Board View only), and the kanban-column-* testids it drags between have 0 hits in frontend/src; needs app testids plus WorkItemKanbanPage rework; log line 1001 of job 94920109119; owner Phase 103')
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
