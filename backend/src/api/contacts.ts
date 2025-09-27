import { Router } from 'express';
import { z } from 'zod';
import { validate, paginationSchema, idParamSchema } from '../utils/validation';
import { requirePermission } from '../middleware/auth';
import { ContactService } from '../services/ContactService';

const router = Router();

const contactService = new ContactService();

const createContactSchema = z.object({
  first_name: z.string().min(2).max(100),
  last_name: z.string().min(2).max(100),
  name_ar: z.string().optional(),
  organization_id: z.string().uuid(),
  country_id: z.string().uuid(),
  position: z.string().min(2).max(200),
  department: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  preferred_language: z.enum(['ar', 'en']).default('en'),
  expertise_areas: z.array(z.string()).default([]),
  communication_preferences: z.object({
    email: z.boolean().default(true),
    whatsapp: z.boolean().default(false),
    sms: z.boolean().default(false)
  }).default({ email: true, whatsapp: false, sms: false })
});

const updateContactSchema = createContactSchema.partial();

const contactSearchSchema = z.object({
  organization_id: z.string().uuid().optional(),
  country_id: z.string().uuid().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  expertise_areas: z.array(z.string()).optional(),
  influence_score_min: z.number().min(0).max(100).optional(),
  influence_score_max: z.number().min(0).max(100).optional(),
  active: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
});

// CRUD operations for contacts
router.get('/', validate({ query: contactSearchSchema }), async (req, res, next) => {
  try {
    const result = await contactService.findAll(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const contact = await contactService.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

router.post('/', requirePermission(['manage_contacts']),
  validate({ body: createContactSchema }),
  async (req, res, next) => {
    try {
      const contact = await contactService.create(req.body, req.user?.id);
      res.status(201).json(contact);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', requirePermission(['manage_contacts']),
  validate({ params: idParamSchema, body: updateContactSchema }),
  async (req, res, next) => {
    try {
      const contact = await contactService.update(req.params.id, req.body, req.user?.id);
      res.json(contact);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', requirePermission(['manage_contacts']),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      await contactService.delete(req.params.id, req.user?.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Add interaction to contact
router.post('/:id/interactions', requirePermission(['manage_contacts']),
  validate({ 
    params: idParamSchema,
    body: z.object({
      type: z.enum(['email', 'meeting', 'call', 'event']),
      summary: z.string().min(1).max(500),
      sentiment: z.enum(['positive', 'neutral', 'negative']).default('neutral')
    })
  }),
  async (req, res, next) => {
    try {
      const contact = await contactService.addInteraction(
        req.params.id,
        req.body,
        req.user?.id
      );
      res.json(contact);
    } catch (error) {
      next(error);
    }
  }
);

// Get contacts by organization
router.get('/organization/:organizationId', 
  validate({ params: z.object({ organizationId: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      const contacts = await contactService.findByOrganization(req.params.organizationId);
      res.json({ data: contacts });
    } catch (error) {
      next(error);
    }
  }
);

// Get contacts by country
router.get('/country/:countryId',
  validate({ params: z.object({ countryId: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      const contacts = await contactService.findByCountry(req.params.countryId);
      res.json({ data: contacts });
    } catch (error) {
      next(error);
    }
  }
);

// Get high-influence contacts
router.get('/high-influence/:threshold',
  validate({ params: z.object({ threshold: z.string().transform(val => parseInt(val)) }) }),
  async (req, res, next) => {
    try {
      const threshold = parseInt(req.params.threshold) || 70;
      const contacts = await contactService.getHighInfluenceContacts(threshold);
      res.json({ data: contacts });
    } catch (error) {
      next(error);
    }
  }
);

// Get high-influence contacts with default threshold
router.get('/high-influence',
  async (req, res, next) => {
    try {
      const contacts = await contactService.getHighInfluenceContacts(70);
      res.json({ data: contacts });
    } catch (error) {
      next(error);
    }
  }
);

// Get contact statistics
router.get('/stats/overview', async (req, res, next) => {
  try {
    const stats = await contactService.getStatistics();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
