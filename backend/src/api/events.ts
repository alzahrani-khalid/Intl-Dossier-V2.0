import { Router } from 'express';
import { z } from 'zod';
import { EventService } from '../services/EventService';
import { validate, paginationSchema, idParamSchema, createBilingualError, getRequestLanguage, dateRangeSchema } from '../utils/validation';
import { requirePermission } from '../middleware/auth';
import { logInfo, logError } from '../utils/logger';

const router = Router();
const eventService = new EventService();

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  type: z.enum(['meeting', 'conference', 'workshop', 'ceremony', 'visit', 'other']),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  location: z.string(),
  virtual_link: z.string().url().optional(),
  attendees: z.array(z.object({
    type: z.enum(['country', 'organization', 'contact']),
    id: z.string().uuid(),
    role: z.enum(['host', 'participant', 'observer', 'speaker']).default('participant'),
    confirmed: z.boolean().default(false)
  })).optional(),
  agenda: z.array(z.object({
    time: z.string(),
    topic: z.string(),
    presenter: z.string().optional()
  })).optional(),
  documents: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['public', 'internal', 'restricted']).default('internal'),
  metadata: z.record(z.string(), z.any()).optional()
});

const updateEventSchema = createEventSchema.partial();

const eventFiltersSchema = z.object({
  type: z.enum(['meeting', 'conference', 'workshop', 'ceremony', 'visit', 'other']).optional(),
  upcoming: z.coerce.boolean().optional(),
  past: z.coerce.boolean().optional(),
  country_id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
  search: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  visibility: z.enum(['public', 'internal', 'restricted']).optional(),
  created_by: z.string().uuid().optional(),
  ...paginationSchema.shape,
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional()
});

/**
 * @route GET /api/events
 * @desc Get all events with filters
 * @access Private
 */
router.get('/', validate({ query: eventFiltersSchema }), async (req, res, next) => {
  try {
    const filters = req.query;
    const userId = req.user?.id;

    logInfo('Fetching events', { filters, userId });

    const result = await eventService.findAll({
      ...filters,
      limit: Number(filters.limit) || 20,
      offset: Number(filters.offset) || 0
    });

    res.json({
      data: result.data,
      pagination: {
        page: Math.floor((Number(filters.offset) || 0) / (Number(filters.limit) || 20)) + 1,
        limit: Number(filters.limit) || 20,
        total: result.total,
        pages: Math.ceil(result.total / (Number(filters.limit) || 20))
      }
    });
  } catch (error) {
    logError('Failed to fetch events', error as Error);
    next(error);
  }
});

/**
 * @route GET /api/events/calendar
 * @desc Get events in calendar format
 * @access Private
 */
router.get('/calendar', async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const userId = req.user?.id;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: createBilingualError(
          'Start date and end date are required',
          'تاريخ البداية وتاريخ النهاية مطلوبان',
          getRequestLanguage(req)
        )
      });
    }

    const events = await eventService.getCalendarEvents(
      start_date as string,
      end_date as string,
      userId
    );

    res.json({ data: events });
  } catch (error) {
    logError('Failed to fetch calendar events', error as Error);
    next(error);
  }
});

/**
 * @route GET /api/events/upcoming
 * @desc Get upcoming events
 * @access Private
 */
router.get('/upcoming', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const events = await eventService.getUpcomingEvents(limit);
    res.json({ data: events });
  } catch (error) {
    logError('Failed to fetch upcoming events', error as Error);
    next(error);
  }
});

/**
 * @route GET /api/events/country/:countryId
 * @desc Get events by country
 * @access Private
 */
router.get('/country/:countryId', validate({
  params: z.object({ countryId: z.string().uuid() })
}), async (req, res, next) => {
  try {
    const events = await eventService.findByCountry(req.params.countryId);
    res.json({ data: events });
  } catch (error) {
    logError('Failed to fetch events by country', error as Error);
    next(error);
  }
});

/**
 * @route GET /api/events/organization/:organizationId
 * @desc Get events by organization
 * @access Private
 */
router.get('/organization/:organizationId', validate({
  params: z.object({ organizationId: z.string().uuid() })
}), async (req, res, next) => {
  try {
    const events = await eventService.findByOrganization(req.params.organizationId);
    res.json({ data: events });
  } catch (error) {
    logError('Failed to fetch events by organization', error as Error);
    next(error);
  }
});

/**
 * @route GET /api/events/conflicts
 * @desc Check for scheduling conflicts
 * @access Private
 */
router.post('/conflicts', validate({
  body: z.object({
    start_date: z.string().datetime(),
    end_date: z.string().datetime(),
    exclude_event_id: z.string().uuid().optional()
  })
}), async (req, res, next) => {
  try {
    const { start_date, end_date, exclude_event_id } = req.body;

    const conflicts = await eventService.checkConflicts(
      start_date,
      end_date,
      exclude_event_id
    );

    res.json({
      hasConflicts: conflicts.length > 0,
      conflicts
    });
  } catch (error) {
    logError('Failed to check event conflicts', error as Error);
    next(error);
  }
});

/**
 * @route GET /api/events/stats
 * @desc Get event statistics
 * @access Private
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await eventService.getStatistics();
    res.json(stats);
  } catch (error) {
    logError('Failed to fetch event statistics', error as Error);
    next(error);
  }
});

/**
 * @route GET /api/events/:id
 * @desc Get event by ID
 * @access Private
 */
router.get('/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await eventService.findById(id);

    if (!event) {
      const lang = getRequestLanguage(req);
      return res.status(404).json({
        error: createBilingualError(
          'Event not found',
          'الحدث غير موجود',
          lang
        )
      });
    }

    res.json(event);
  } catch (error) {
    logError('Failed to fetch event', error as Error);
    next(error);
  }
});

/**
 * @route POST /api/events
 * @desc Create new event
 * @access Private - requires permission
 */
router.post(
  '/',
  requirePermission(['create_event']),
  validate({ body: createEventSchema }),
  async (req, res, next) => {
    try {
      const eventData = req.body;
      const userId = req.user?.id;
      const lang = getRequestLanguage(req);

      logInfo('Creating new event', { eventData, userId });

      const event = await eventService.create(eventData, userId!);

      res.status(201).json({
        data: event,
        message: createBilingualError(
          'Event created successfully',
          'تم إنشاء الحدث بنجاح',
          lang
        )
      });
    } catch (error) {
      logError('Failed to create event', error as Error);
      next(error);
    }
  }
);

/**
 * @route PUT /api/events/:id
 * @desc Update event
 * @access Private - requires permission
 */
router.put(
  '/:id',
  requirePermission(['manage_event']),
  validate({
    params: idParamSchema,
    body: updateEventSchema
  }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user?.id;
      const lang = getRequestLanguage(req);

      const event = await eventService.update(id, updates, userId!);

      res.json({
        data: event,
        message: createBilingualError(
          'Event updated successfully',
          'تم تحديث الحدث بنجاح',
          lang
        )
      });
    } catch (error) {
      logError('Failed to update event', error as Error);
      next(error);
    }
  }
);

/**
 * @route DELETE /api/events/:id
 * @desc Delete event
 * @access Private - requires permission
 */
router.delete(
  '/:id',
  requirePermission(['delete_event']),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const lang = getRequestLanguage(req);

      await eventService.delete(id, userId!);

      res.json({
        message: createBilingualError(
          'Event deleted successfully',
          'تم حذف الحدث بنجاح',
          lang
        )
      });
    } catch (error) {
      logError('Failed to delete event', error as Error);
      next(error);
    }
  }
);

/**
 * @route POST /api/events/:id/attendees
 * @desc Add attendee to event
 * @access Private
 */
router.post(
  '/:id/attendees',
  requirePermission(['manage_event']),
  validate({
    params: idParamSchema,
    body: z.object({
      type: z.enum(['country', 'organization', 'contact']),
      id: z.string().uuid(),
      role: z.enum(['host', 'participant', 'observer', 'speaker']),
      confirmed: z.boolean().optional()
    })
  }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const attendee = req.body;
      const userId = req.user?.id;
      const lang = getRequestLanguage(req);

      const event = await eventService.addAttendee(id, attendee, userId!);

      res.json({
        data: event,
        message: createBilingualError(
          'Attendee added successfully',
          'تمت إضافة الحضور بنجاح',
          lang
        )
      });
    } catch (error) {
      logError('Failed to add attendee', error as Error);
      next(error);
    }
  }
);

/**
 * @route DELETE /api/events/:id/attendees/:attendeeId
 * @desc Remove attendee from event
 * @access Private
 */
router.delete(
  '/:id/attendees/:attendeeId',
  requirePermission(['manage_event']),
  validate({
    params: z.object({
      id: z.string().uuid(),
      attendeeId: z.string().uuid()
    })
  }),
  async (req, res, next) => {
    try {
      const { id, attendeeId } = req.params;
      const userId = req.user?.id;
      const lang = getRequestLanguage(req);

      const event = await eventService.removeAttendee(id, attendeeId, userId!);

      res.json({
        data: event,
        message: createBilingualError(
          'Attendee removed successfully',
          'تمت إزالة الحضور بنجاح',
          lang
        )
      });
    } catch (error) {
      logError('Failed to remove attendee', error as Error);
      next(error);
    }
  }
);

export default router;