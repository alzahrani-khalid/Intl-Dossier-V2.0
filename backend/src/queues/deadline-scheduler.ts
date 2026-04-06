import { createClient } from '@supabase/supabase-js'
import { notificationQueue } from './notification.queue'
import { logInfo, logError } from '../utils/logger'

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
)

/**
 * Scan tasks for approaching and overdue deadlines, enqueue notifications.
 *
 * - Approaching: sla_deadline within 24 hours from now
 * - Overdue: sla_deadline in the past
 * - Skips completed and cancelled tasks
 * - Uses jobId-based dedup to prevent duplicate notifications
 */
export async function processDeadlineCheck(): Promise<void> {
  const now = new Date()
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000)

  try {
    // Query approaching deadlines (within 24h)
    const { data: approaching, error: approachError } = await supabase
      .from('tasks')
      .select('id, title, assignee_id, sla_deadline')
      .eq('is_deleted', false)
      .not('sla_deadline', 'is', null)
      .not('assignee_id', 'is', null)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .lte('sla_deadline', in24h.toISOString())
      .gt('sla_deadline', now.toISOString())

    if (approachError) {
      logError('Deadline check: failed to query approaching tasks', approachError as unknown as Error)
    }

    // Query overdue tasks
    const { data: overdue, error: overdueError } = await supabase
      .from('tasks')
      .select('id, title, assignee_id, sla_deadline')
      .eq('is_deleted', false)
      .not('sla_deadline', 'is', null)
      .not('assignee_id', 'is', null)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .lte('sla_deadline', now.toISOString())

    if (overdueError) {
      logError('Deadline check: failed to query overdue tasks', overdueError as unknown as Error)
    }

    // Enqueue approaching deadline notifications with dedup
    for (const task of approaching ?? []) {
      try {
        await notificationQueue.add('deadline-approaching', {
          userId: task.assignee_id,
          type: 'deadline_approaching',
          title: 'Deadline approaching',
          message: `"${task.title}" is due within 24 hours`,
          category: 'deadlines',
          priority: 'high',
          actionUrl: `/tasks/${task.id}`,
          sourceType: 'task',
          sourceId: task.id,
        }, { jobId: `deadline-24h-${task.id}` })
      } catch (err) {
        logError(`Failed to enqueue approaching deadline for task ${task.id}`, err as Error)
      }
    }

    // Enqueue overdue notifications with dedup
    for (const task of overdue ?? []) {
      try {
        await notificationQueue.add('deadline-overdue', {
          userId: task.assignee_id,
          type: 'deadline_overdue',
          title: 'Task overdue',
          message: `"${task.title}" is past its deadline`,
          category: 'deadlines',
          priority: 'urgent',
          actionUrl: `/tasks/${task.id}`,
          sourceType: 'task',
          sourceId: task.id,
        }, { jobId: `deadline-overdue-${task.id}` })
      } catch (err) {
        logError(`Failed to enqueue overdue notification for task ${task.id}`, err as Error)
      }
    }

    logInfo(`Deadline check: ${approaching?.length ?? 0} approaching, ${overdue?.length ?? 0} overdue`)
  } catch (err) {
    logError('Deadline check failed', err as Error)
  }
}

/**
 * Register the deadline checker as a repeatable BullMQ job (every 15 minutes).
 */
export async function registerDeadlineChecker(): Promise<void> {
  await notificationQueue.add('check-deadlines', {} as never, {
    repeat: { every: 15 * 60 * 1000 },
    jobId: 'deadline-checker',
  })
  logInfo('Deadline checker registered (every 15 minutes)')
}
