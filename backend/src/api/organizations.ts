import { Router } from 'express';
import { z } from 'zod';
import { OrganizationService } from '../services/OrganizationService';
import { validate, paginationSchema, idParamSchema } from '../utils/validation';
import { requirePermission } from '../middleware/auth';

const router = Router();
const organizationService = new OrganizationService();

const createOrgSchema = z.object({
  name: z.string().min(2).max(200),
  type: z.enum(['government', 'ngo', 'private', 'academic', 'international']),
  country_id: z.string().uuid().optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  parent_id: z.string().uuid().optional()
});

// GET /api/organizations
router.get('/', validate({ query: paginationSchema }), async (req, res, next) => {
  try {
    const result = await organizationService.findAll(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/organizations/:id
router.get('/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const org = await organizationService.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json(org);
  } catch (error) {
    next(error);
  }
});

// POST /api/organizations
router.post('/', requirePermission(['manage_organizations']), 
  validate({ body: createOrgSchema }),
  async (req, res, next) => {
    try {
      const org = await organizationService.create({
        ...req.body,
        created_by: req.user?.id
      });
      res.status(201).json(org);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/organizations/:id
router.put('/:id', requirePermission(['manage_organizations']),
  validate({ params: idParamSchema, body: createOrgSchema.partial() }),
  async (req, res, next) => {
    try {
      const org = await organizationService.update(req.params.id, req.body);
      res.json(org);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/organizations/:id
router.delete('/:id', requirePermission(['manage_organizations']),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      await organizationService.delete(req.params.id);
      res.json({ message: 'Organization deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
