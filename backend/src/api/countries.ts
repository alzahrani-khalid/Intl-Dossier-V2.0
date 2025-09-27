import { Router } from 'express';
import { z } from 'zod';
import { CountryService } from '../services/CountryService';
import { validate, paginationSchema, idParamSchema, createBilingualError, getRequestLanguage } from '../utils/validation';
import { requireRole, requirePermission } from '../middleware/auth';
import { logInfo, logError } from '../utils/logger';

const router = Router();
const countryService = new CountryService();

// Validation schemas
const createCountrySchema = z.object({
  code: z.string().length(2),
  code3: z.string().length(3),
  name_en: z.string().min(2).max(100),
  name_ar: z.string().min(2).max(100),
  region: z.enum(['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Middle East']),
  capital: z.string().optional(),
  currency: z.string().optional(),
  languages: z.array(z.string()).optional(),
  timezone: z.string().optional(),
  flag_url: z.string().url().optional(),
  map_coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

const updateCountrySchema = createCountrySchema.partial();

const countryFiltersSchema = z.object({
  region: z.string().optional(),
  hasActiveMoUs: z.coerce.boolean().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).or(z.string()).optional(),
  ...paginationSchema.shape
});

const relationshipUpdateSchema = z.object({
  status: z.enum(['active', 'developing', 'dormant']),
  notes: z.string().optional()
});

/**
 * @route GET /api/countries
 * @desc Get all countries with filters and pagination
 * @access Private
 */
router.get('/', validate({ query: countryFiltersSchema }), async (req, res, next) => {
  try {
    const filters = req.query;
    const userId = req.user?.id;

    logInfo('Fetching countries', { filters, userId });

    const result = await countryService.getCountries(filters as any);

    res.json({
      data: result.data,
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total
      },
      total: result.total
    });
  } catch (error) {
    logError('Failed to fetch countries', error as Error);
    next(error);
  }
});

/**
 * @route GET /api/countries/stats
 * @desc Get country statistics
 * @access Private
 */
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user?.id;

    logInfo('Fetching country statistics', { userId });

    const stats = await countryService.getStatistics();

    res.json(stats);
  } catch (error) {
    logError('Failed to fetch country statistics', error as Error);
    next(error);
  }
});

/**
 * @route GET /api/countries/:id
 * @desc Get country by ID with full details
 * @access Private
 */
router.get('/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    logInfo('Fetching country details', { countryId: id, userId });

    const country = await countryService.getCountryById(id);

    if (!country) {
      const lang = getRequestLanguage(req);
      return res.status(404).json({
        error: createBilingualError(
          'Country not found',
          'الدولة غير موجودة',
          lang
        )
      });
    }

    res.json(country);
  } catch (error) {
    logError('Failed to fetch country', error as Error);
    next(error);
  }
});

/**
 * @route POST /api/countries
 * @desc Create new country
 * @access Admin only
 */
router.post(
  '/',
  requireRole(['admin']),
  validate({ body: createCountrySchema }),
  async (req, res, next) => {
    try {
      const countryData = req.body;
      const userId = req.user?.id;
      const lang = getRequestLanguage(req);

      logInfo('Creating new country', { countryData, userId });

      const country = await countryService.createCountry({
        ...countryData,
        code: countryData.code.toUpperCase(),
        code3: countryData.code3.toUpperCase(),
        created_at: new Date(),
        updated_at: new Date(),
        created_by: userId,
      });

      logInfo('Country created successfully', { countryId: country.id });

      res.status(201).json({
        data: country,
        message: createBilingualError(
          'Country created successfully',
          'تم إنشاء الدولة بنجاح',
          lang
        )
      });
    } catch (error) {
      logError('Failed to create country', error as Error);
      next(error);
    }
  }
);

/**
 * @route PUT /api/countries/:id
 * @desc Update country
 * @access Admin only
 */
router.put(
  '/:id',
  requireRole(['admin']),
  validate({
    params: idParamSchema,
    body: updateCountrySchema
  }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user?.id;
      const lang = getRequestLanguage(req);

      logInfo('Updating country', { countryId: id, updates, userId });

      const country = await countryService.updateCountry(id, {
        ...updates,
        updated_by: userId
      });

      if (!country) {
        return res.status(404).json({
          error: createBilingualError(
            'Country not found',
            'الدولة غير موجودة',
            lang
          )
        });
      }

      logInfo('Country updated successfully', { countryId: id });

      res.json({
        data: country,
        message: createBilingualError(
          'Country updated successfully',
          'تم تحديث الدولة بنجاح',
          lang
        )
      });
    } catch (error) {
      logError('Failed to update country', error as Error);
      next(error);
    }
  }
);

/**
 * @route DELETE /api/countries/:id
 * @desc Delete country
 * @access Admin only
 */
router.delete(
  '/:id',
  requireRole(['admin']),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const lang = getRequestLanguage(req);

      logInfo('Deleting country', { countryId: id, userId });

      const success = await countryService.deleteCountry(id);

      if (!success) {
        return res.status(404).json({
          error: createBilingualError(
            'Country not found',
            'الدولة غير موجودة',
            lang
          )
        });
      }

      logInfo('Country deleted successfully', { countryId: id });

      res.json({
        message: createBilingualError(
          'Country deleted successfully',
          'تم حذف الدولة بنجاح',
          lang
        )
      });
    } catch (error) {
      logError('Failed to delete country', error as Error);
      next(error);
    }
  }
);

/**
 * @route GET /api/countries/:id/relationships
 * @desc Get country relationships and connections
 * @access Private
 */
router.get('/:id/relationships', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params;

    logInfo('Fetching country relationships', { countryId: id });

    const relationships = await countryService.getCountryRelationships(id);

    res.json(relationships);
  } catch (error) {
    logError('Failed to fetch country relationships', error as Error);
    next(error);
  }
});

/**
 * @route PUT /api/countries/:id/relationship
 * @desc Update country relationship status
 * @access Private - requires permission
 */
router.put(
  '/:id/relationship',
  requirePermission(['manage_relationships']),
  validate({
    params: idParamSchema,
    body: relationshipUpdateSchema
  }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user?.id;
      const lang = getRequestLanguage(req);

      logInfo('Updating country relationship', { countryId: id, updates, userId });

      const relationship = await countryService.updateRelationshipStatus(id, updates.relationshipId, updates.status);

      res.json({
        data: relationship,
        message: createBilingualError(
          'Relationship updated successfully',
          'تم تحديث العلاقة بنجاح',
          lang
        )
      });
    } catch (error) {
      logError('Failed to update country relationship', error as Error);
      next(error);
    }
  }
);

/**
 * @route GET /api/countries/:id/mous
 * @desc Get all MoUs for a country
 * @access Private
 */
router.get('/:id/mous', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params;

    logInfo('Fetching country MoUs', { countryId: id });

    const mous = await countryService.getMoUs(id);

    res.json({
      data: mous,
      total: mous.length
    });
  } catch (error) {
    logError('Failed to fetch country MoUs', error as Error);
    next(error);
  }
});

/**
 * @route GET /api/countries/:id/events
 * @desc Get all events related to a country
 * @access Private
 */
router.get('/:id/events', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params;

    logInfo('Fetching country events', { countryId: id });

    const events = await countryService.getEvents(id);

    res.json({
      data: events,
      total: events.length
    });
  } catch (error) {
    logError('Failed to fetch country events', error as Error);
    next(error);
  }
});

/**
 * @route GET /api/countries/:id/contacts
 * @desc Get all contacts for a country
 * @access Private
 */
router.get('/:id/contacts', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params;

    logInfo('Fetching country contacts', { countryId: id });

    const contacts = await countryService.getContacts(id);

    res.json({
      data: contacts,
      total: contacts.length
    });
  } catch (error) {
    logError('Failed to fetch country contacts', error as Error);
    next(error);
  }
});

/**
 * @route GET /api/countries/:id/timeline
 * @desc Get timeline of activities for a country
 * @access Private
 */
router.get('/:id/timeline', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params;

    logInfo('Fetching country timeline', { countryId: id });

    const timeline = await countryService.getTimeline(id);

    res.json({
      data: timeline,
      total: timeline.length
    });
  } catch (error) {
    logError('Failed to fetch country timeline', error as Error);
    next(error);
  }
});

/**
 * @route POST /api/countries/:id/tags
 * @desc Add tags to a country
 * @access Private
 */
router.post(
  '/:id/tags',
  requirePermission(['manage_countries']),
  validate({
    params: idParamSchema,
    body: z.object({
      tags: z.array(z.string())
    })
  }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { tags } = req.body;
      const lang = getRequestLanguage(req);

      logInfo('Adding tags to country', { countryId: id, tags });

      const country = await countryService.addTags(id, tags);

      res.json({
        data: country,
        message: createBilingualError(
          'Tags added successfully',
          'تمت إضافة العلامات بنجاح',
          lang
        )
      });
    } catch (error) {
      logError('Failed to add tags to country', error as Error);
      next(error);
    }
  }
);

/**
 * @route DELETE /api/countries/:id/tags
 * @desc Remove tags from a country
 * @access Private
 */
router.delete(
  '/:id/tags',
  requirePermission(['manage_countries']),
  validate({
    params: idParamSchema,
    body: z.object({
      tags: z.array(z.string())
    })
  }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { tags } = req.body;
      const lang = getRequestLanguage(req);

      logInfo('Removing tags from country', { countryId: id, tags });

      const country = await countryService.removeTags(id, tags);

      res.json({
        data: country,
        message: createBilingualError(
          'Tags removed successfully',
          'تمت إزالة العلامات بنجاح',
          lang
        )
      });
    } catch (error) {
      logError('Failed to remove tags from country', error as Error);
      next(error);
    }
  }
);

export default router;
