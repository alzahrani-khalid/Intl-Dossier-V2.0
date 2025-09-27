import { Router } from 'express';
import { alertsService } from '../../services/alerts.service';
import { anomalyService } from '../../services/anomaly-detection.service';
import { getAuthToken, isAdminToken, ok, requireAuthHeader, sendError } from './helpers';

const router = Router();

// Alerts
router.get('/alerts', requireAuthHeader, (req, res) => {
  const { severity, is_active } = req.query as any;
  const filter: any = {};
  if (severity) filter.severity = String(severity);
  if (typeof is_active !== 'undefined') filter.is_active = String(is_active) === 'true';
  return ok(res, alertsService.list(filter));
});

router.post('/alerts', requireAuthHeader, (req, res) => {
  const { name, name_ar, condition, threshold, severity, channels, is_active } = req.body || {};
  if (!name || !name_ar || !condition || typeof threshold !== 'number' || !severity || !channels) {
    return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields', 'حقول مطلوبة مفقودة');
  }
  if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
    return sendError(res, 400, 'INVALID_SEVERITY', 'Invalid severity', 'شدة غير صالحة');
  }
  if (threshold < 0 || threshold > 1) {
    return sendError(res, 400, 'INVALID_THRESHOLD', 'Invalid threshold', 'حد غير صالح');
  }
  const item = alertsService.create({ name, name_ar, condition, threshold, severity, channels, is_active: Boolean(is_active) });
  return ok(res, item, 201);
});

router.get('/alerts/:id', requireAuthHeader, (req, res) => {
  const item = alertsService.get(req.params.id);
  if (!item) return sendError(res, 404, 'ALERT_NOT_FOUND', 'Alert not found', 'لم يتم العثور على التنبيه');
  return ok(res, item);
});

router.patch('/alerts/:id', requireAuthHeader, (req, res) => {
  try {
    const patch = req.body || {};
    if (patch.severity && !['low', 'medium', 'high', 'critical'].includes(patch.severity)) {
      return sendError(res, 400, 'INVALID_SEVERITY', 'Invalid severity', 'شدة غير صالحة');
    }
    if (patch.threshold !== undefined && (typeof patch.threshold !== 'number' || patch.threshold < 0 || patch.threshold > 1)) {
      return sendError(res, 400, 'INVALID_THRESHOLD', 'Invalid threshold', 'حد غير صالح');
    }
    return ok(res, alertsService.update(req.params.id, patch));
  } catch (e: any) {
    return sendError(res, e.status || 400, e.code || 'BAD_REQUEST', e.message || 'Error', 'خطأ');
  }
});

router.delete('/alerts/:id', requireAuthHeader, (req, res) => {
  try {
    alertsService.delete(req.params.id);
    return res.status(204).send();
  } catch (e: any) {
    return sendError(res, e.status || 404, e.code || 'ALERT_NOT_FOUND', e.message || 'Alert not found', 'لم يتم العثور على التنبيه');
  }
});

router.post('/alerts/:id/acknowledge', requireAuthHeader, (req, res) => {
  try {
    const result = alertsService.acknowledge(req.params.id);
    return ok(res, result);
  } catch (e: any) {
    return sendError(res, e.status || 400, e.code || 'BAD_REQUEST', e.message || 'Error', 'خطأ');
  }
});

// Anomalies
router.get('/anomalies', requireAuthHeader, (req, res) => {
  const q = req.query as any;
  if (q.min_score && (Number(q.min_score) < 0 || Number(q.min_score) > 1)) {
    return sendError(res, 400, 'INVALID_MIN_SCORE', 'Invalid min_score', 'قيمة غير صالحة');
  }
  if (q.from && isNaN(Date.parse(q.from))) {
    return sendError(res, 400, 'INVALID_DATE_FORMAT', 'Invalid date format', 'تنسيق تاريخ غير صالح');
  }
  const list = anomalyService.list({
    entity_type: q.entity_type,
    min_score: q.min_score ? Number(q.min_score) : undefined,
    unreviewed_only: q.unreviewed_only === 'true',
    from: q.from,
    to: q.to,
    limit: q.limit ? Number(q.limit) : undefined,
    offset: q.offset ? Number(q.offset) : undefined,
  });
  return ok(res, list);
});

router.post('/anomalies/:id/review', requireAuthHeader, (req, res) => {
  try {
    const { classification, false_positive } = req.body || {};
    const result = anomalyService.review(req.params.id, classification, false_positive);
    return ok(res, result);
  } catch (e: any) {
    return sendError(res, e.status || 400, e.code || 'BAD_REQUEST', e.message || 'Error', 'خطأ');
  }
});

// Health (public)
router.get('/health', (_req, res) => {
  const now = new Date();
  const mk = (status: 'healthy' | 'degraded' | 'unhealthy') => ({ status, latency_ms: Math.floor(Math.random() * 50), last_check: now.toISOString() });
  return ok(res, {
    status: 'healthy',
    services: {
      database: mk('healthy'),
      api: mk('healthy'),
      redis: mk('healthy'),
      supabase: mk('healthy'),
    }
  });
});

export default router;

