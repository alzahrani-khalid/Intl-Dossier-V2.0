import { Router } from 'express'
import type { Request, Response } from 'express'
import { sendInAppNotification } from '../services/notification.service'

const router = Router()

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
