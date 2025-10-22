/**
 * Tasks API Routes
 * Part of: 025-unified-tasks-model implementation
 *
 * REST API for unified tasks with:
 * - Optimistic locking (updated_at comparison)
 * - Work item linking (dossier/position/ticket/generic)
 * - Engagement context for kanban boards
 * - Team collaboration via contributors
 * - SLA monitoring and warnings
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, idParamSchema } from '../utils/validation';
import { authenticateToken } from '../middleware/auth';
import { optimisticLockingMiddleware } from '../middleware/optimistic-locking';
import { tasksService } from '../services/tasks.service';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  assignee_id: z.string().uuid(),
  engagement_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  workflow_stage: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).default('todo'),
  sla_deadline: z.string().datetime().optional(),
  work_item_type: z.enum(['dossier', 'position', 'ticket', 'generic']).optional(),
  work_item_id: z.string().uuid().optional(),
  source: z.record(z.any()).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  assignee_id: z.string().uuid().optional(),
  engagement_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  workflow_stage: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).optional(),
  status: z.enum(['pending', 'in_progress', 'review', 'completed', 'cancelled']).optional(),
  sla_deadline: z.string().datetime().optional(),
  work_item_type: z.enum(['dossier', 'position', 'ticket', 'generic']).optional(),
  work_item_id: z.string().uuid().optional(),
  source: z.record(z.any()).optional(),
  completed_by: z.string().uuid().optional(),
  completed_at: z.string().datetime().optional(),
  last_known_updated_at: z.string().datetime().optional(), // For optimistic locking
});

const taskFiltersSchema = z.object({
  assignee_id: z.string().uuid().optional(),
  engagement_id: z.string().uuid().optional(),
  workflow_stage: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).optional(),
  status: z.enum(['pending', 'in_progress', 'review', 'completed', 'cancelled']).optional(),
  work_item_type: z.enum(['dossier', 'position', 'ticket', 'generic']).optional(),
  work_item_id: z.string().uuid().optional(),
  sla_deadline_before: z.string().datetime().optional(),
  is_overdue: z.boolean().optional(),
  page: z.number().min(1).default(1),
  page_size: z.number().min(1).max(100).default(50),
  sort_by: z.enum(['created_at', 'updated_at', 'sla_deadline', 'priority']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// CRUD ENDPOINTS
// ============================================================================

/**
 * POST /tasks
 * Create a new task
 */
router.post(
  '/',
  validate({ body: createTaskSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const task = await tasksService.createTask({
        ...req.body,
        created_by: userId,
        tenant_id: req.user.tenantId,
      });

      res.status(201).json(task);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /tasks/:id
 * Get a single task by ID
 */
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const task = await tasksService.getTaskById(req.params.id, userId);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /tasks
 * List tasks with filtering, sorting, and pagination
 */
router.get(
  '/',
  validate({ query: taskFiltersSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await tasksService.listTasks({
        filters: {
          assignee_id: req.query.assignee_id as string,
          engagement_id: req.query.engagement_id as string,
          workflow_stage: req.query.workflow_stage as any,
          status: req.query.status as any,
          work_item_type: req.query.work_item_type as any,
          work_item_id: req.query.work_item_id as string,
          sla_deadline_before: req.query.sla_deadline_before as string,
          is_overdue: req.query.is_overdue === 'true',
        },
        page: parseInt(req.query.page as string) || 1,
        page_size: parseInt(req.query.page_size as string) || 50,
        sort_by: (req.query.sort_by as any) || 'created_at',
        sort_order: (req.query.sort_order as any) || 'desc',
      });

      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * PUT /tasks/:id
 * Update a task with optimistic locking
 */
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateTaskSchema }),
  optimisticLockingMiddleware('tasks'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const task = await tasksService.updateTask(req.params.id, {
        ...req.body,
        updated_by: userId,
      });

      res.json(task);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * DELETE /tasks/:id
 * Soft delete a task
 */
router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      await tasksService.deleteTask(req.params.id, userId);

      res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error: any) {
      next(error);
    }
  }
);

// ============================================================================
// SPECIALIZED ENDPOINTS
// ============================================================================

/**
 * GET /tasks/my-tasks
 * Get tasks assigned to the current user
 */
router.get(
  '/my-tasks',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const result = await tasksService.getMyTasks(userId, {
        page: parseInt(req.query.page as string) || 1,
        page_size: parseInt(req.query.page_size as string) || 50,
      });

      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /tasks/engagement/:engagementId
 * Get tasks for an engagement (kanban board)
 */
router.get(
  '/engagement/:engagementId',
  validate({ params: z.object({ engagementId: z.string().uuid() }) }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await tasksService.getEngagementTasks(req.params.engagementId);

      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /tasks/work-item/:workItemType/:workItemId
 * Get tasks linked to a work item (reverse lookup)
 */
router.get(
  '/work-item/:workItemType/:workItemId',
  validate({
    params: z.object({
      workItemType: z.enum(['dossier', 'position', 'ticket', 'generic']),
      workItemId: z.string().uuid(),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tasks = await tasksService.getWorkItemTasks(
        req.params.workItemType as any,
        req.params.workItemId
      );

      res.json({ tasks, total_count: tasks.length });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /tasks/overdue
 * Get overdue tasks (SLA breach detection)
 */
router.get(
  '/overdue',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assigneeId = req.query.assignee_id as string | undefined;
      const tasks = await tasksService.getOverdueTasks(assigneeId);

      res.json({ tasks, total_count: tasks.length });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /tasks/approaching-deadline
 * Get tasks approaching SLA deadline (for warnings)
 */
router.get(
  '/approaching-deadline',
  validate({
    query: z.object({
      hours: z.number().min(1).default(4),
      assignee_id: z.string().uuid().optional(),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hours = parseInt(req.query.hours as string) || 4;
      const assigneeId = req.query.assignee_id as string | undefined;

      const tasks = await tasksService.getTasksApproachingDeadline(hours, assigneeId);

      res.json({ tasks, total_count: tasks.length });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * PATCH /tasks/:id/workflow-stage
 * Update task workflow stage (for kanban drag-and-drop)
 */
router.patch(
  '/:id/workflow-stage',
  validate({
    params: idParamSchema,
    body: z.object({
      workflow_stage: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']),
      last_known_updated_at: z.string().datetime().optional(),
    }),
  }),
  optimisticLockingMiddleware('tasks'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const task = await tasksService.updateTask(req.params.id, {
        workflow_stage: req.body.workflow_stage,
        updated_by: userId,
      });

      res.json(task);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * PATCH /tasks/:id/complete
 * Mark task as completed
 */
router.patch(
  '/:id/complete',
  validate({
    params: idParamSchema,
    body: z.object({
      last_known_updated_at: z.string().datetime().optional(),
    }),
  }),
  optimisticLockingMiddleware('tasks'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const task = await tasksService.updateTask(req.params.id, {
        status: 'completed',
        workflow_stage: 'done',
        completed_by: userId,
        completed_at: new Date().toISOString(),
        updated_by: userId,
      });

      res.json(task);
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
