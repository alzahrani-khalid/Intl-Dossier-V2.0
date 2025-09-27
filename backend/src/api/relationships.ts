import { Router } from 'express';
import { RelationshipHealthService } from '../services/RelationshipHealthService';
import { validate, idParamSchema } from '../utils/validation';
import { logInfo } from '../utils/logger';

const router = Router();
const healthService = new RelationshipHealthService();

// GET /api/relationships/:id/health
router.get('/:id/health', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params;
    logInfo('Fetching relationship health', { relationshipId: id });

    // Pass entity type and ID instead of just ID
    const health = await healthService.getRelationshipHealth('relationship', id);
    res.json(health);
  } catch (error) {
    next(error);
  }
});

// GET /api/relationships/:id/recommendations
router.get('/:id/recommendations', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params;
    const recommendations = await healthService.getRecommendations(id);
    res.json({ recommendations });
  } catch (error) {
    next(error);
  }
});

export default router;
