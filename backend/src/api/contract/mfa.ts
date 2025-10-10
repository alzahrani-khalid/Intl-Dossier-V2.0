import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { mfaService } from '../../services/mfa.service';
import { ok, requireAuthHeader, sendError, getAuthToken } from './helpers';

const router = Router();

const enrollLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false, keyGenerator: (req) => getAuthToken(req) || req.ip || 'unknown' });
const verifyLimiter = rateLimit({ windowMs: 60_000, max: 6, standardHeaders: true, legacyHeaders: false, keyGenerator: (req) => getAuthToken(req) || req.ip || 'unknown' });
const codesLimiter = rateLimit({ windowMs: 60_000, max: 3, standardHeaders: true, legacyHeaders: false, keyGenerator: (req) => getAuthToken(req) || req.ip || 'unknown' });

// POST /auth/mfa/enroll
router.post('/enroll', requireAuthHeader, enrollLimiter, async (req, res) => {
  const token = (req as any).token as string;
  const { factor_type } = req.body || {};
  try {
    const enr = await mfaService.enroll(token, factor_type);
    return ok(res, {
      factor_id: enr.factorId,
      secret: enr.secret,
      qr_code: enr.qrCodeDataUrl,
      backup_codes: enr.backupCodes
    });
  } catch (e: any) {
    if (e.code) {
      return sendError(res, e.status || 400, e.code, e.message, 'حدث خطأ');
    }
    return sendError(res, 500, 'INTERNAL_ERROR', 'Internal error', 'خطأ داخلي');
  }
});

// POST /auth/mfa/verify
router.post('/verify', requireAuthHeader, verifyLimiter, async (req, res) => {
  const token = (req as any).token as string;
  const { code, factor_id } = req.body || {};
  if (!('code' in (req.body || {}))) {
    return sendError(res, 400, 'MISSING_CODE', 'Missing code', 'الرمز مفقود');
  }
  try {
    const result = mfaService.verifyCode(token, String(code), factor_id);
    if ((result as any).verified) {
      return ok(res, {
        verified: true,
        access_token: 'access_token_mock',
        refresh_token: 'refresh_token_mock'
      });
    }
    return sendError(res, 401, 'INVALID_MFA_CODE', 'Invalid MFA code', 'رمز المصادقة غير صالح');
  } catch (e: any) {
    if (e.code === 'TOO_MANY_ATTEMPTS') {
      return sendError(res, 429, e.code, 'Too many attempts', 'عدد كبير من المحاولات', { 'Retry-After': e.retryAfter || 60 });
    }
    if (e.code) {
      return sendError(res, e.status || 400, e.code, e.message, 'حدث خطأ');
    }
    return sendError(res, 500, 'INTERNAL_ERROR', 'Internal error', 'خطأ داخلي');
  }
});

// GET /auth/mfa/backup-codes
router.get('/backup-codes', requireAuthHeader, async (req, res) => {
  const token = (req as any).token as string;
  try {
    const { codes, generatedAt } = mfaService.getBackupCodes(token);
    return ok(res, { codes, generated_at: generatedAt });
  } catch (e: any) {
    if (e.code) {
      return sendError(res, e.status || 400, e.code, e.message, 'حدث خطأ');
    }
    return sendError(res, 500, 'INTERNAL_ERROR', 'Internal error', 'خطأ داخلي');
  }
});

// POST /auth/mfa/backup-codes
router.post('/backup-codes', requireAuthHeader, codesLimiter, async (req, res) => {
  const token = (req as any).token as string;
  try {
    const { codes, generatedAt } = mfaService.regenerateBackupCodes(token);
    return ok(res, { codes, generated_at: generatedAt });
  } catch (e: any) {
    if (e.code) {
      return sendError(res, e.status || 400, e.code, e.message, 'حدث خطأ');
    }
    return sendError(res, 500, 'INTERNAL_ERROR', 'Internal error', 'خطأ داخلي');
  }
});

// POST /auth/mfa/recover
router.post('/recover', requireAuthHeader, verifyLimiter, async (req, res) => {
  const token = (req as any).token as string;
  const { backup_code } = req.body || {};
  if (!('backup_code' in (req.body || {}))) {
    return sendError(res, 400, 'MISSING_BACKUP_CODE', 'Missing backup_code', 'رمز النسخ الاحتياطي مفقود');
  }
  try {
    const result = mfaService.recoverWithBackupCode(token, String(backup_code));
    return ok(res, result);
  } catch (e: any) {
    if (e.code === 'TOO_MANY_ATTEMPTS') {
      return sendError(res, 429, e.code, 'Too many attempts', 'عدد كبير من المحاولات', { 'Retry-After': e.retryAfter || 60 });
    }
    if (e.code) {
      return sendError(res, e.status || 400, e.code, e.message, 'حدث خطأ');
    }
    return sendError(res, 500, 'INTERNAL_ERROR', 'Internal error', 'خطأ داخلي');
  }
});

export default router;

