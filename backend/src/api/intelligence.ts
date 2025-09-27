import { Router } from 'express';
import { IntelligenceService } from '../services/IntelligenceService';
import { validate, idParamSchema } from '../utils/validation';
import { z } from 'zod';
import { logInfo, logError } from '../utils/logger';
import { requirePermission } from '../middleware/auth';

const router = Router();
const intelligenceService = new IntelligenceService();

const insightSchema = z.object({
  entityType: z.string(),
  entityId: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

// GET /api/intelligence/insights/:entityType/:entityId
router.get('/insights/:entityType/:entityId', async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const insights = await intelligenceService.getInsights(entityType, entityId);
    res.json(insights);
  } catch (error) {
    next(error);
  }
});

// POST /api/intelligence/insights
router.post('/insights', validate({ body: insightSchema }), async (req, res, next) => {
  try {
    const insight = await intelligenceService.createInsight(req.body);
    res.status(201).json(insight);
  } catch (error) {
    next(error);
  }
});

// GET /api/intelligence/signals/:type
router.get('/signals/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    const signals = await intelligenceService.detectSignals(type);
    res.json({ signals });
  } catch (error) {
    next(error);
  }
});

// GET /api/intelligence/opportunities/:countryId
router.get('/opportunities', async (req, res, next) => {
  try {
    const opportunities = await intelligenceService.identifyOpportunities(undefined);
    res.json({ opportunities });
  } catch (error) {
    next(error);
  }
});

router.get('/opportunities/:countryId', async (req, res, next) => {
  try {
    const { countryId } = req.params;
    const opportunities = await intelligenceService.identifyOpportunities(countryId);
    res.json({ opportunities });
  } catch (error) {
    next(error);
  }
});

// GET /api/intelligence/trends/:metric
router.get('/trends/:metric', async (req, res, next) => {
  try {
    const { metric } = req.params;
    const { period } = req.query;
    const trends = await intelligenceService.analyzeTrends(metric, Number(period) || 90);
    res.json(trends);
  } catch (error) {
    next(error);
  }
});

// POST /api/intelligence/feedback
router.post('/feedback', requirePermission(['view_intelligence']), async (req, res, next) => {
  try {
    req.body.userId = req.user?.id;
    await intelligenceService.storeFeedback(req.body);
    res.status(201).json({ message: 'Feedback stored successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
