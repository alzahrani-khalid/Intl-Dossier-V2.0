import { Router } from 'express'
import type { Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import { authenticateToken } from '../middleware/auth'
import { isValidPushEndpoint } from '../services/push.service'
import { logInfo, logError } from '../utils/logger'

const router = Router()

const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
)

/**
 * GET /api/push-subscriptions/vapid-public-key
 * Returns the VAPID public key for client-side subscription.
 * No auth required -- frontend needs this before subscription.
 * Security: T-16-08 -- only public key is exposed.
 */
router.get('/vapid-public-key', (_req: Request, res: Response): void => {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  if (publicKey == null || publicKey === '') {
    res.status(503).json({ error: 'Push notifications not configured' })
    return
  }
  res.json({ publicKey })
})

// All routes below require authentication
router.use(authenticateToken)

/**
 * POST /api/push-subscriptions
 * Register a new push subscription for the authenticated user.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    if (userId == null) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { endpoint, keys, userAgent } = req.body as {
      endpoint?: string
      keys?: { p256dh?: string; auth?: string }
      userAgent?: string
    }

    // Validate required fields
    if (endpoint == null || typeof endpoint !== 'string' || endpoint === '') {
      res.status(400).json({ error: 'Missing required field: endpoint' })
      return
    }
    if (keys?.p256dh == null || typeof keys.p256dh !== 'string' || keys.p256dh === '') {
      res.status(400).json({ error: 'Missing required field: keys.p256dh' })
      return
    }
    if (keys?.auth == null || typeof keys.auth !== 'string' || keys.auth === '') {
      res.status(400).json({ error: 'Missing required field: keys.auth' })
      return
    }

    // Security: T-16-07 -- validate endpoint is HTTPS from trusted push service
    if (!isValidPushEndpoint(endpoint)) {
      res.status(400).json({ error: 'Invalid push endpoint: must be HTTPS from a known push service' })
      return
    }

    // Upsert: if same user+endpoint exists, reactivate and update keys
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint,
          keys_p256dh: keys.p256dh,
          keys_auth: keys.auth,
          user_agent: userAgent ?? null,
          is_active: true,
          failed_attempts: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,endpoint' },
      )

    if (error != null) {
      logError('Failed to upsert push subscription', error as unknown as Error)
      res.status(500).json({ error: 'Failed to save push subscription' })
      return
    }

    logInfo(`Push subscription registered for user ${userId}`)
    res.status(201).json({ success: true })
  } catch (err) {
    logError(
      'Push subscription registration error',
      err instanceof Error ? err : new Error(String(err)),
    )
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * DELETE /api/push-subscriptions
 * Deactivate a push subscription for the authenticated user.
 */
router.delete('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    if (userId == null) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const { endpoint } = req.body as { endpoint?: string }

    if (endpoint == null || typeof endpoint !== 'string' || endpoint === '') {
      res.status(400).json({ error: 'Missing required field: endpoint' })
      return
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('endpoint', endpoint)

    if (error != null) {
      logError('Failed to deactivate push subscription', error as unknown as Error)
      res.status(500).json({ error: 'Failed to remove push subscription' })
      return
    }

    logInfo(`Push subscription deactivated for user ${userId}`)
    res.json({ success: true })
  } catch (err) {
    logError(
      'Push subscription deletion error',
      err instanceof Error ? err : new Error(String(err)),
    )
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
