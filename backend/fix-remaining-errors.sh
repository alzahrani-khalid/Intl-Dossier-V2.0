#!/bin/bash

echo "🔧 Fixing remaining TypeScript errors..."

# Fix RelationshipHealthService API call
echo "Fixing RelationshipHealthService API call..."
cat > src/api/relationships-fix.ts << 'EOF'
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
EOF
mv src/api/relationships-fix.ts src/api/relationships.ts

# Fix migrate.ts logger imports
echo "Fixing migrate.ts logger..."
sed -i '' '1i\
import { logInfo as logger } from "../utils/logger";\
' src/db/migrate.ts

# Fix seed.ts logger imports
echo "Fixing seed.ts logger..."
sed -i '' '1i\
import { logInfo as logger } from "../utils/logger";\
' src/db/seed.ts

# Fix AppError import in errorHandler
echo "Fixing AppError import..."
sed -i '' '1a\
import { AppError } from "../utils/errors";\
' src/middleware/errorHandler.ts

# Fix nodemailer typo
echo "Fixing nodemailer typo..."
sed -i '' 's/createTransporter/createTransport/g' src/services/NotificationService.ts

# Fix search API call
echo "Fixing search API call..."
sed -i '' 's/await searchService.search({/await searchService.search(req.query.q || "", {/g' src/api/search.ts

# Fix events validation
echo "Fixing events validation..."
sed -i '' 's/validate(createEventSchema)/validate({ body: createEventSchema })/g' src/api/events.ts

# Fix intelligence API calls
echo "Fixing intelligence API calls..."
cat > src/api/intelligence-fix.ts << 'EOF'
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
  metadata: z.record(z.any()).optional()
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

// GET /api/intelligence/opportunities/:countryId?
router.get('/opportunities/:countryId?', async (req, res, next) => {
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
EOF
mv src/api/intelligence-fix.ts src/api/intelligence.ts

# Install missing node-pg-migrate types
echo "Installing node-pg-migrate..."
npm install --save-dev @types/node-pg-migrate

echo "✅ Fixed most common errors. Run 'npx tsc --noEmit' to check remaining issues."