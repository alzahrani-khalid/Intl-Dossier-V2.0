import { Router } from 'express'
import type { Request, Response } from 'express'
import { sendInAppNotification } from '../services/notification.service'
import { supabaseAdmin } from '../config/supabase.js'

const router = Router()

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
      // Fallback to simple unread count
      const { count } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)
        .or('expires_at.is.null,expires_at.gt.now()')

      res.json({ total: count || 0, byCategory: {} })
      return
    }

    const byCategory: Record<string, { total: number; unread: number }> = {}
    let total = 0

    for (const row of data || []) {
      byCategory[row.category as string] = {
        total: row.total_count,
        unread: row.unread_count,
      }
      total += row.unread_count
    }

    res.json({ total, byCategory })
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
      res.json({ marked: data })
      return
    }

    if (notificationIds && notificationIds.length > 0) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .in('id', notificationIds)

      if (error) {
        res.status(500).json({ error: 'Failed to mark notifications as read' })
        return
      }
      res.json({ marked: notificationIds.length })
      return
    }

    res.status(400).json({ error: 'No notifications specified' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' })
  }
})

// T-22-01: Test-only endpoint -- MUST NOT be available in production
if (process.env.NODE_ENV !== 'production') {
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
