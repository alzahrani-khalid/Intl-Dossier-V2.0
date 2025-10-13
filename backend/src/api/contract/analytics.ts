import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { clusteringService } from '../../services/clustering.service';
import { ok, requireAuthHeader, sendError, getAuthToken } from './helpers';

const router = Router();

const limiter = rateLimit({ windowMs: 60_000, max: 6, standardHeaders: true, legacyHeaders: false, keyGenerator: (req) => getAuthToken(req) || req.ip || 'unknown' });

router.post('/cluster', requireAuthHeader, limiter, (req, res) => {
  try {
    const result = clusteringService.run(req.body || {});
    return ok(res, result);
  } catch (e: any) {
    if (e.code) return sendError(res, e.status || 400, e.code, e.message, 'حدث خطأ');
    return sendError(res, 500, 'INTERNAL_ERROR', 'Internal error', 'خطأ داخلي');
  }
});

export default router;

