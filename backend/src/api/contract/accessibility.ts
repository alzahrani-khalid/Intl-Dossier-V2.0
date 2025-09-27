import { Router } from 'express';
import { accessibilityService } from '../../services/accessibility.service';
import { ok, requireAuthHeader } from './helpers';

const router = Router();

router.get('/preferences', requireAuthHeader, (req, res) => {
  const token = (req as any).token as string;
  return ok(res, accessibilityService.get(token));
});

router.post('/preferences', requireAuthHeader, (req, res) => {
  const token = (req as any).token as string;
  const prefs = accessibilityService.set(token, req.body || {});
  return ok(res, prefs);
});

export default router;

