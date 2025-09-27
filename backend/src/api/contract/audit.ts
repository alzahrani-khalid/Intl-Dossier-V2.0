import { Router } from 'express';
import { ok, requireAuthHeader, sendError, getAuthToken, isAdminToken } from './helpers';

const router = Router();

interface AuditLog {
  id: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id: string;
  created_at: string;
}

function rid() { return Math.random().toString(36).slice(2, 10); }

const logs: AuditLog[] = Array.from({ length: 50 }).map((_, i) => ({
  id: rid(),
  action: 'login',
  severity: (['low','medium','high','critical'] as const)[Math.floor(Math.random()*4)],
  user_id: `user_${i%3}`,
  created_at: new Date(Date.now() - (50 - i) * 60_000).toISOString(),
}));

router.get('/logs', requireAuthHeader, (req, res) => {
  const token = getAuthToken(req)!;
  if (!isAdminToken(token)) return sendError(res, 403, 'INSUFFICIENT_PERMISSIONS', 'Insufficient permissions', 'أذونات غير كافية');
  const q = req.query as any;
  if (q.limit && Number(q.limit) > 1000) return sendError(res, 400, 'INVALID_LIMIT', 'Invalid limit', 'حد غير صالح');
  const from = q.from ? new Date(q.from) : new Date(0);
  const to = q.to ? new Date(q.to) : new Date();
  let data = logs.filter(l => new Date(l.created_at) >= from && new Date(l.created_at) <= to);
  if (q.severity) data = data.filter(l => l.severity === q.severity);
  if (q.user_id) data = data.filter(l => l.user_id === q.user_id);
  data = data.sort((a, b) => a.created_at.localeCompare(b.created_at));
  const limit = q.limit ? Number(q.limit) : undefined;
  if (limit) data = data.slice(0, limit);
  return ok(res, data);
});

export default router;

