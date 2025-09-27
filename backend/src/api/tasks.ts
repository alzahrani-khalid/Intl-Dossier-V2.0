import { Router } from 'express';
import { z } from 'zod';
import { validate, paginationSchema, idParamSchema } from '../utils/validation';
import { requirePermission } from '../middleware/auth';
import { TaskService } from '../services/TaskService';

const router = Router();

const taskService = new TaskService();

const createTaskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  type: z.enum(['action', 'review', 'approval', 'follow-up']).default('action'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assigned_to: z.string().uuid(),
  related_entity: z.object({
    type: z.enum(['mou', 'activity', 'commitment', 'document']),
    id: z.string().uuid()
  }),
  due_date: z.string().datetime(),
  dependencies: z.array(z.string().uuid()).default([]),
  escalation_rules: z.array(z.object({
    days_before_due: z.number().min(1),
    escalate_to: z.string().uuid()
  })).default([])
});

const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']).optional(),
  completed_at: z.string().datetime().optional()
});

const taskSearchSchema = z.object({
  assigned_to: z.string().uuid().optional(),
  assigned_by: z.string().uuid().optional(),
  status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  type: z.enum(['action', 'review', 'approval', 'follow-up']).optional(),
  related_entity_type: z.enum(['mou', 'activity', 'commitment', 'document']).optional(),
  related_entity_id: z.string().uuid().optional(),
  due_date_from: z.string().datetime().optional(),
  due_date_to: z.string().datetime().optional(),
  overdue: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
});

// Task management endpoints
router.get('/', validate({ query: taskSearchSchema }), async (req, res, next) => {
  try {
    const result = await taskService.findAll(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const task = await taskService.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    next(error);
  }
});

router.post('/', requirePermission(['manage_tasks']),
  validate({ body: createTaskSchema }),
  async (req, res, next) => {
    try {
      const task = await taskService.create(req.body, req.user?.id);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', requirePermission(['manage_tasks']),
  validate({ params: idParamSchema, body: updateTaskSchema }),
  async (req, res, next) => {
    try {
      const task = await taskService.update(req.params.id, req.body, req.user?.id);
      res.json(task);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', requirePermission(['manage_tasks']),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      await taskService.delete(req.params.id, req.user?.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Update task status
router.patch('/:id/status', requirePermission(['manage_tasks']),
  validate({ 
    params: idParamSchema,
    body: z.object({
      status: z.enum(['pending', 'in-progress', 'completed', 'cancelled'])
    })
  }),
  async (req, res, next) => {
    try {
      const task = await taskService.updateStatus(
        req.params.id,
        req.body.status,
        req.user?.id
      );
      res.json(task);
    } catch (error) {
      next(error);
    }
  }
);

// Add comment to task
router.post('/:id/comments', requirePermission(['manage_tasks']),
  validate({
    params: idParamSchema,
    body: z.object({
      text: z.string().min(1).max(1000)
    })
  }),
  async (req, res, next) => {
    try {
      const task = await taskService.addComment(
        req.params.id,
        req.body,
        req.user?.id
      );
      res.json(task);
    } catch (error) {
      next(error);
    }
  }
);

// Get tasks assigned to user
router.get('/assigned/:userId', 
  validate({ 
    params: z.object({ userId: z.string().uuid() }),
    query: z.object({ include_completed: z.boolean().optional() })
  }),
  async (req, res, next) => {
    try {
      const includeCompleted = req.query.include_completed === 'true';
      const tasks = await taskService.findByAssignee(req.params.userId, includeCompleted);
      res.json({ data: tasks });
    } catch (error) {
      next(error);
    }
  }
);

// Get overdue tasks
router.get('/overdue/list', async (req, res, next) => {
  try {
    const tasks = await taskService.getOverdueTasks();
    res.json({ data: tasks });
  } catch (error) {
    next(error);
  }
});

// Get tasks due soon
router.get('/due-soon/:days',
  validate({ params: z.object({ days: z.string().transform(val => parseInt(val)) }) }),
  async (req, res, next) => {
    try {
      const days = parseInt(req.params.days) || 7;
      const tasks = await taskService.getTasksDueSoon(days);
      res.json({ data: tasks });
    } catch (error) {
      next(error);
    }
  }
);

// Get tasks due soon with default days
router.get('/due-soon',
  async (req, res, next) => {
    try {
      const tasks = await taskService.getTasksDueSoon(7);
      res.json({ data: tasks });
    } catch (error) {
      next(error);
    }
  }
);

// Get tasks by related entity
router.get('/related/:entityType/:entityId',
  validate({ 
    params: z.object({
      entityType: z.enum(['mou', 'activity', 'commitment', 'document']),
      entityId: z.string().uuid()
    })
  }),
  async (req, res, next) => {
    try {
      const tasks = await taskService.findByRelatedEntity(
        req.params.entityType,
        req.params.entityId
      );
      res.json({ data: tasks });
    } catch (error) {
      next(error);
    }
  }
);

// Get task statistics
router.get('/stats/overview', async (req, res, next) => {
  try {
    const userId = req.query.user_id as string;
    const stats = await taskService.getStatistics(userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Check for escalations
router.get('/escalations/check', requirePermission(['manage_tasks']),
  async (req, res, next) => {
    try {
      const tasks = await taskService.checkEscalations();
      res.json({ data: tasks });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
