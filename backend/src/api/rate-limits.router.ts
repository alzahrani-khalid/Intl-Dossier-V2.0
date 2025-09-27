import { Router, Request, Response, NextFunction } from 'express';
import { RateLimitService } from '../services/rate-limit.service';
import { RateLimitPolicyInput } from '../models/rate-limit-policy.model';

const router = Router();

const rateLimitService = new RateLimitService(
  process.env.REDIS_URL || 'redis://localhost:6379',
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// GET /api/rate-limits/policies
router.get('/policies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applies_to } = req.query;
    
    const policies = await rateLimitService.getAllPolicies(
      applies_to as any
    );
    
    res.json({ data: policies });
  } catch (error) {
    next(error);
  }
});

// POST /api/rate-limits/policies
router.post('/policies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: RateLimitPolicyInput = req.body;
    
    const policy = await rateLimitService.createPolicy(input);
    
    res.status(201).json(policy);
  } catch (error) {
    if ((error as Error).message.includes('Validation failed')) {
      return res.status(400).json({
        error: (error as Error).message,
        details: {}
      });
    }
    next(error);
  }
});

// PUT /api/rate-limits/policies/:id
router.put('/policies/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const input: Partial<RateLimitPolicyInput> = req.body;
    
    const policy = await rateLimitService.updatePolicy(id, input);
    
    res.json(policy);
  } catch (error) {
    if ((error as Error).message.includes('Validation failed')) {
      return res.status(400).json({
        error: (error as Error).message,
        details: {}
      });
    }
    if ((error as Error).message.includes('not found')) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    next(error);
  }
});

// DELETE /api/rate-limits/policies/:id
router.delete('/policies/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    await rateLimitService.deletePolicy(id);
    
    res.status(204).send();
  } catch (error) {
    if ((error as Error).message.includes('not found')) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    next(error);
  }
});

// GET /api/rate-limits/status
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    
    const status = await rateLimitService.getRateLimitStatus(
      userId,
      ipAddress
    );
    
    res.json(status);
  } catch (error) {
    next(error);
  }
});

export default router;