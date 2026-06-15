import { Router } from 'express'
import type { Request, Response } from 'express'
import {
  createAlertRule,
  deleteAlertRule,
  listAlertRules,
  updateAlertRule,
  type UpdateAlertRuleInput,
} from '../services/alerts.service'
import type { DossierType, IntelligenceChannel } from '../services/intelligence-digest.service'

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
const channels = new Set<IntelligenceChannel>(['in_app', 'smtp', 'webhook'])

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

function parseChannels(value: unknown): IntelligenceChannel[] {
  if (value == null) return ['in_app']
  if (!Array.isArray(value) || !value.every((item) => channels.has(item as IntelligenceChannel))) {
    throw Object.assign(new Error('Invalid channels'), { status: 400 })
  }
  return value as IntelligenceChannel[]
}

function sendError(res: Response, error: unknown) {
  const statusValue = (error as { status?: unknown }).status
  const status = typeof statusValue === 'number' ? statusValue : 400
  return res.status(status).json({
    error: status === 401 ? 'Unauthorized' : 'Bad Request',
    message: (error as Error).message ?? 'Invalid request',
  })
}

router.get('/rules', async (req, res) => {
  try {
    const { userId } = getAuth(req)
    const rules = await listAlertRules(userId)
    return res.json(rules)
  } catch (error) {
    return sendError(res, error)
  }
})

router.post('/rules', async (req, res) => {
  try {
    const { userId, organizationId } = getAuth(req)
    const {
      dossier_type,
      dossier_id,
      condition_type,
      condition_config,
      channels: ruleChannels,
    } = req.body ?? {}

    if (!isDossierType(dossier_type)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid dossier type' })
    }
    if (typeof dossier_id !== 'string' || dossier_id.length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'Missing dossier_id' })
    }
    if (condition_type != null && condition_type !== 'new_signal') {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid condition_type' })
    }

    const rule = await createAlertRule({
      organization_id: organizationId,
      owner_id: userId,
      dossier_type,
      dossier_id,
      condition_type: 'new_signal',
      condition_config: condition_config ?? {},
      channels: parseChannels(ruleChannels),
    })

    return res.status(201).json(rule)
  } catch (error) {
    return sendError(res, error)
  }
})

router.put('/rules/:id', async (req, res) => {
  try {
    const { userId } = getAuth(req)
    const patch: UpdateAlertRuleInput = {}
    const body = req.body ?? {}

    if (body.dossier_type != null) {
      if (!isDossierType(body.dossier_type)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid dossier type' })
      }
      patch.dossier_type = body.dossier_type
    }
    if (body.dossier_id != null) patch.dossier_id = String(body.dossier_id)
    if (body.condition_type != null) {
      if (body.condition_type !== 'new_signal') {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid condition_type' })
      }
      patch.condition_type = 'new_signal'
    }
    if (body.condition_config != null) patch.condition_config = body.condition_config
    if (body.channels != null) patch.channels = parseChannels(body.channels)
    if (body.is_active != null) patch.is_active = Boolean(body.is_active)

    const rule = await updateAlertRule(req.params.id ?? '', userId, patch)
    return res.json(rule)
  } catch (error) {
    return sendError(res, error)
  }
})

router.delete('/rules/:id', async (req, res) => {
  try {
    const { userId } = getAuth(req)
    await deleteAlertRule(req.params.id ?? '', userId)
    return res.status(204).send()
  } catch (error) {
    return sendError(res, error)
  }
})

export default router
