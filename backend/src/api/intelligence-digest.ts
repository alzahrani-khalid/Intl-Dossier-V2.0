import { createClient } from '@supabase/supabase-js'
import { Router } from 'express'
import type { Request, Response } from 'express'
import {
  listSubscriptions,
  subscribeToDigest,
  unsubscribeFromDigest,
  type DigestFrequency,
  type DossierType,
} from '../services/intelligence-digest.service'

const router = Router()

const dossierTypes = new Set<DossierType>([
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person',
])
const frequencies = new Set<DigestFrequency>(['daily', 'weekly', 'monthly'])

function getAuth(req: Request) {
  const userId = req.user?.id
  const organizationId = req.user?.organization_id
  if (userId == null || organizationId == null) {
    throw Object.assign(new Error('Authentication required'), { status: 401 })
  }
  return { userId, organizationId }
}

function isDossierType(value: unknown): value is DossierType {
  return typeof value === 'string' && dossierTypes.has(value as DossierType)
}

function parseFrequency(value: unknown): DigestFrequency {
  return typeof value === 'string' && frequencies.has(value as DigestFrequency)
    ? (value as DigestFrequency)
    : 'daily'
}

function callerSupabase(req: Request) {
  return createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_ANON_KEY ?? '', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: { Authorization: req.headers.authorization ?? '' },
    },
  })
}

function sendError(res: Response, error: unknown) {
  const statusValue = (error as { status?: unknown }).status
  const status = typeof statusValue === 'number' ? statusValue : 400
  return res.status(status).json({
    error: status === 401 ? 'Unauthorized' : 'Bad Request',
    message: (error as Error).message ?? 'Invalid request',
  })
}

router.get('/subscriptions', async (req, res) => {
  try {
    const { userId } = getAuth(req)
    const subscriptions = await listSubscriptions(userId)
    return res.json(subscriptions)
  } catch (error) {
    return sendError(res, error)
  }
})

router.post('/subscribe', async (req, res) => {
  try {
    const { userId, organizationId } = getAuth(req)
    const { dossier_id, dossier_type, frequency, frequency_config } = req.body ?? {}

    if (!isDossierType(dossier_type)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid dossier type' })
    }
    if (typeof dossier_id !== 'string' || dossier_id.length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'Missing dossier_id' })
    }

    const subscription = await subscribeToDigest({
      organization_id: organizationId,
      subscriber_id: userId,
      dossier_id,
      dossier_type,
      frequency: parseFrequency(frequency),
      frequency_config: frequency_config ?? { channels: ['in_app'] },
    })

    return res.status(201).json(subscription)
  } catch (error) {
    return sendError(res, error)
  }
})

async function handleUnsubscribe(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req)
    const dossierId =
      req.params.dossierId ?? String(req.body?.dossier_id ?? req.query.dossier_id ?? '')

    if (dossierId.length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'Missing dossier_id' })
    }

    await unsubscribeFromDigest(userId, dossierId)
    return res.status(204).send()
  } catch (error) {
    return sendError(res, error)
  }
}

router.delete('/unsubscribe', handleUnsubscribe)
router.delete('/unsubscribe/:dossierId', handleUnsubscribe)
router.delete('/subscribe/:dossierId', handleUnsubscribe)

router.get('/generate', async (req, res) => {
  try {
    getAuth(req)
    const dossierId = String(req.query.dossier_id ?? '')
    const period = parseFrequency(req.query.period)
    if (dossierId.length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'Missing dossier_id' })
    }

    const { data, error } = await callerSupabase(req).rpc('generate_digest', {
      p_dossier_id: dossierId,
      p_period: period,
    })

    if (error != null) throw error
    return res.json(data)
  } catch (error) {
    return sendError(res, error)
  }
})

router.post('/publish', async (req, res) => {
  try {
    getAuth(req)
    const dossierId = String(req.body?.dossier_id ?? '')
    const summary = String(req.body?.summary ?? '')
    const clearanceLevel = Number(req.body?.clearance_level_at_generation ?? 1)
    const period = parseFrequency(req.body?.period)

    if (dossierId.length === 0 || summary.length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'Missing digest fields' })
    }

    const { data, error } = await callerSupabase(req).rpc('publish_digest', {
      p_dossier_id: dossierId,
      p_period: period,
      p_summary: summary,
      p_clearance_level_at_generation: clearanceLevel,
    })

    if (error != null) throw error
    return res.status(201).json({ id: data })
  } catch (error) {
    return sendError(res, error)
  }
})

export default router
