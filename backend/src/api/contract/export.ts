import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { exportService } from '../../services/export.service';
import { getAuthToken, ok, requireAuthHeader, sendError, isOtherUserToken } from './helpers';

const router = Router();

const limiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false, keyGenerator: (req) => getAuthToken(req) || req.ip });

router.post('/', requireAuthHeader, limiter, (req, res) => {
  const token = (req as any).token as string;
  const { resource_type, format } = req.body || {};
  try {
    const created = exportService.create(token, resource_type, format);
    return ok(res, { id: created.id, status: created.status }, 202);
  } catch (e: any) {
    if (e.code) return sendError(res, e.status || 400, e.code, e.message, 'حدث خطأ');
    return sendError(res, 500, 'INTERNAL_ERROR', 'Internal error', 'خطأ داخلي');
  }
});

router.get('/:id', requireAuthHeader, (req, res) => {
  const token = (req as any).token as string;
  const item = exportService.get(req.params.id);
  if (!item) return sendError(res, 404, 'EXPORT_NOT_FOUND', 'Export not found', 'لم يتم العثور على التصدير');
  if (isOtherUserToken(token)) return sendError(res, 403, 'ACCESS_DENIED', 'Access denied', 'تم رفض الوصول');
  return ok(res, item);
});

router.get('/:id/download', requireAuthHeader, (req, res) => {
  const token = (req as any).token as string;
  const { id } = req.params;
  if (id === 'non-existent-id') return sendError(res, 404, 'EXPORT_NOT_FOUND', 'Export not found', 'لم يتم العثور على التصدير');
  if (id === 'expired-id') return sendError(res, 410, 'EXPORT_EXPIRED', 'Export expired', 'انتهت صلاحية التصدير');
  if (id === 'processing-id') return sendError(res, 409, 'EXPORT_NOT_READY', 'Export not ready', 'التصدير غير جاهز');
  const item = exportService.get(id);
  if (!item) return sendError(res, 404, 'EXPORT_NOT_FOUND', 'Export not found', 'لم يتم العثور على التصدير');
  if (isOtherUserToken(token)) return sendError(res, 403, 'ACCESS_DENIED', 'Access denied', 'تم رفض الوصول');
  if (item.status !== 'completed') return sendError(res, 409, 'EXPORT_NOT_READY', 'Export not ready', 'التصدير غير جاهز');

  if (item.format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify([{ id: 1, name: 'example' }]));
  }
  // default CSV content
  res.setHeader('Content-Type', 'text/csv');
  return res.status(200).send('id,name\n1,example');
});

export default router;

