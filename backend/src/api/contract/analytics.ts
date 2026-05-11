import { Router } from 'express'
import type { Request } from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { clusteringService } from '../../services/clustering.service'
import { ok, requireAuthHeader, sendError, getAuthToken } from './helpers'

const router = Router()
const getRequestKey = (req: Request) => getAuthToken(req) || ipKeyGenerator(req.ip || 'unknown')

const limiter = rateLimit({
  windowMs: 60_000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRequestKey,
})

router.post('/cluster', requireAuthHeader, limiter, (req, res) => {
  try {
    const result = clusteringService.run(req.body || {})
    return ok(res, result)
  } catch (e: any) {
    if (e.code) return sendError(res, e.status || 400, e.code, e.message, 'حدث خطأ')
    return sendError(res, 500, 'INTERNAL_ERROR', 'Internal error', 'خطأ داخلي')
  }
})

export default router
