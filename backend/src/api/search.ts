import { Router } from 'express';
import { z } from 'zod';
import { SearchService } from '../services/SearchService';
import { validate, searchQuerySchema } from '../utils/validation';
import { optionalAuth } from '../middleware/auth';
import { logInfo } from '../utils/logger';

const router = Router();
const searchService = new SearchService();

// Apply optional auth for personalized results
router.use(optionalAuth);

// POST /api/search - Global search
router.post('/', validate({ body: searchQuerySchema }), async (req, res, next) => {
  try {
    const { q, lang, page, limit } = req.body;
    const userId = req.user?.id;
    
    logInfo('Search request', { query: q, lang, userId });
    
    const results = await searchService.search(String(req.query.q || ""), {
      query: q,
      language: lang,
      userId,
      pagination: { page, limit }
    });
    
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// GET /api/search/suggestions
router.get('/suggestions', async (req, res, next) => {
  try {
    const { q } = req.query;
    const suggestions = await searchService.getSuggestions(q as string);
    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
});

export default router;
