import { Router } from 'express'
import type { Request, Response } from 'express'
import { sendInAppNotification } from '../services/notification.service'
import { supabaseAdmin } from '../config/supabase.js'

const router = Router()

/** Coerce RPC / PostgREST numeric fields to a non-negative integer (avoids NaN in JSON responses). */
const nonNegativeCount = (value: unknown): number => {
  if (typeof value === 'bigint') {
    const n = Number(value)
    return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value))
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0
  }
  return 0
}

/** `mark_category_as_read` returns INTEGER; PostgREST may surface null, string, or bigint. */
const markedCountFromRpc = (value: unknown): number => nonNegativeCount(value)

// GET /counts — proxy for get_notification_counts RPC
router.get('/counts', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { data, error } = await supabaseAdmin.rpc('get_notification_counts', {
      p_user_id: userId,
    })

    if (error) {
      // Fallback to simple unread count when RPC is unavailable
      const { count, error: fallbackError } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)
        .or('expires_at.is.null,expires_at.gt.now()')

      if (fallbackError) {
        res.status(500).json({ error: 'Failed to fetch notification counts' })
        return
      }

      res.json({ total: nonNegativeCount(count ?? 0), byCategory: {} })
      return
    }

    const byCategory: Record<string, { total: number; unread: number }> = {}
    let total = 0

    for (const raw of data || []) {
      const row = raw as Record<string, unknown>
      const categoryRaw = row.category
      const categoryKey =
        typeof categoryRaw === 'string' && categoryRaw.length > 0
          ? categoryRaw
          : typeof categoryRaw === 'number' && Number.isFinite(categoryRaw)
            ? String(Math.trunc(categoryRaw))
            : 'unknown'

      const rowTotal = nonNegativeCount(row.total_count)
      const rowUnread = nonNegativeCount(row.unread_count)

      byCategory[categoryKey] = { total: rowTotal, unread: rowUnread }
      total += rowUnread
    }

    res.json({ total: Number.isFinite(total) ? total : 0, byCategory })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notification counts' })
  }
})

// POST /mark-read — proxy for marking notifications as read
router.post('/mark-read', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { notificationIds, category, markAll } = req.body as {
      notificationIds?: string[]
      category?: string
      markAll?: boolean
    }

    if (markAll) {
      const { data, error } = await supabaseAdmin.rpc('mark_category_as_read', {
        p_user_id: userId,
        p_category: category || null,
      })

      if (error) {
        res.status(500).json({ error: 'Failed to mark as read' })
        return
      }
      res.json({ marked: markedCountFromRpc(data) })
      return
    }

    if (notificationIds && notificationIds.length > 0) {
      const { data: updatedRows, error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .in('id', notificationIds)
        .select('id')

      if (error) {
        res.status(500).json({ error: 'Failed to mark notifications as read' })
        return
      }
      res.json({ marked: updatedRows?.length ?? 0 })
      return
    }

    res.status(400).json({ error: 'No notifications specified' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' })
  }
})

// T-22-01: Test-only endpoint — register only when NODE_ENV is explicitly `development` or `test`.
// `NODE_ENV !== 'production'` is unsafe: undefined (common in misconfigured deploys) would expose this route.
const notificationTestTriggerEnabled =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'

if (notificationTestTriggerEnabled) {
  router.post('/test-trigger', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      const { title, body, category } = req.body as {
        title?: string
        body?: string
        category?: string
      }
      const notification = await sendInAppNotification(
        userId,
        title ?? 'Test Notification',
        body ?? 'This is a test notification triggered by E2E tests',
        { type: (category as any) ?? 'general' },
      )
      res.status(201).json(notification)
    } catch (err) {
      res.status(500).json({ error: 'Failed to create test notification' })
    }
  })
}

export default router
