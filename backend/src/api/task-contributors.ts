/**
 * Task Contributors API Routes
 * Part of: 025-unified-tasks-model implementation
 *
 * REST API for managing task contributors (team collaboration):
 * - Add/remove contributors
 * - List contributors for tasks
 * - List tasks where user is a contributor
 * - Bulk operations
 * - RLS-aware (only task owners can manage contributors)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, idParamSchema } from '../utils/validation';
import { authenticateToken } from '../middleware/auth';
import { taskContributorsService } from '../services/task-contributors.service';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const addContributorSchema = z.object({
  user_id: z.string().uuid(),
  role: z.string().optional(),
});

const addMultipleContributorsSchema = z.object({
  user_ids: z.array(z.string().uuid()).min(1),
  role: z.string().optional(),
});

const removeContributorSchema = z.object({
  user_id: z.string().uuid(),
});

const removeMultipleContributorsSchema = z.object({
  user_ids: z.array(z.string().uuid()).min(1),
});

const replaceContributorsSchema = z.object({
  user_ids: z.array(z.string().uuid()),
  role: z.string().optional(),
});

// ============================================================================
// CONTRIBUTOR ENDPOINTS
// ============================================================================

/**
 * POST /task-contributors/:taskId
 * Add a contributor to a task
 * RLS: Only task assignee or creator can add contributors
 */
router.post(
  '/:taskId',
  validate({
    params: z.object({ taskId: z.string().uuid() }),
    body: addContributorSchema,
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const contributor = await taskContributorsService.addContributor({
        task_id: req.params.taskId,
        user_id: req.body.user_id,
        added_by: userId,
        role: req.body.role,
      });

      res.status(201).json(contributor);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * POST /task-contributors/:taskId/bulk
 * Add multiple contributors to a task
 * RLS: Only task assignee or creator can add contributors
 */
router.post(
  '/:taskId/bulk',
  validate({
    params: z.object({ taskId: z.string().uuid() }),
    body: addMultipleContributorsSchema,
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const contributors = await taskContributorsService.addMultipleContributors(
        req.params.taskId,
        req.body.user_ids,
        userId,
        req.body.role
      );

      res.status(201).json({ contributors, total_count: contributors.length });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /task-contributors/:taskId
 * Get all active contributors for a task
 */
router.get(
  '/:taskId',
  validate({ params: z.object({ taskId: z.string().uuid() }) }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contributors = await taskContributorsService.getTaskContributors(req.params.taskId);

      res.json({ contributors, total_count: contributors.length });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /task-contributors/:taskId/history
 * Get contributor history for a task (including removed)
 */
router.get(
  '/:taskId/history',
  validate({ params: z.object({ taskId: z.string().uuid() }) }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contributors = await taskContributorsService.getContributorHistory(req.params.taskId);

      res.json({ contributors, total_count: contributors.length });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /task-contributors/user/:userId/tasks
 * Get all tasks where user is a contributor
 */
router.get(
  '/user/:userId/tasks',
  validate({ params: z.object({ userId: z.string().uuid() }) }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contributorTasks = await taskContributorsService.getContributorTasks(
        req.params.userId
      );

      res.json({ contributor_tasks: contributorTasks, total_count: contributorTasks.length });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /task-contributors/me/tasks
 * Get all tasks where current user is a contributor
 */
router.get(
  '/me/tasks',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const contributorTasks = await taskContributorsService.getContributorTasks(userId);

      res.json({ contributor_tasks: contributorTasks, total_count: contributorTasks.length });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /task-contributors/:taskId/count
 * Get contributor count for a task
 */
router.get(
  '/:taskId/count',
  validate({ params: z.object({ taskId: z.string().uuid() }) }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await taskContributorsService.getContributorCount(req.params.taskId);

      res.json({ count });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * DELETE /task-contributors/:taskId/:userId
 * Remove a contributor from a task (soft delete)
 * RLS: Only task assignee or creator can remove contributors
 */
router.delete(
  '/:taskId/:userId',
  validate({
    params: z.object({
      taskId: z.string().uuid(),
      userId: z.string().uuid(),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const removedBy = req.user?.id;
      if (!removedBy) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      await taskContributorsService.removeContributor({
        task_id: req.params.taskId,
        user_id: req.params.userId,
        removed_by: removedBy,
      });

      res.json({ success: true, message: 'Contributor removed successfully' });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * DELETE /task-contributors/:taskId/bulk
 * Remove multiple contributors from a task
 * RLS: Only task assignee or creator can remove contributors
 */
router.delete(
  '/:taskId/bulk',
  validate({
    params: z.object({ taskId: z.string().uuid() }),
    body: removeMultipleContributorsSchema,
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const removedBy = req.user?.id;
      if (!removedBy) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      await taskContributorsService.removeMultipleContributors(
        req.params.taskId,
        req.body.user_ids,
        removedBy
      );

      res.json({ success: true, message: 'Contributors removed successfully' });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * PUT /task-contributors/:taskId/replace
 * Replace all contributors for a task
 * Removes all existing and adds new ones
 * RLS: Only task assignee or creator can replace contributors
 */
router.put(
  '/:taskId/replace',
  validate({
    params: z.object({ taskId: z.string().uuid() }),
    body: replaceContributorsSchema,
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updatedBy = req.user?.id;
      if (!updatedBy) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const contributors = await taskContributorsService.replaceContributors(
        req.params.taskId,
        req.body.user_ids,
        updatedBy,
        req.body.role
      );

      res.json({ contributors, total_count: contributors.length });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /task-contributors/:taskId/is-contributor/:userId
 * Check if user is a contributor on a task
 */
router.get(
  '/:taskId/is-contributor/:userId',
  validate({
    params: z.object({
      taskId: z.string().uuid(),
      userId: z.string().uuid(),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isContributor = await taskContributorsService.isContributor(
        req.params.taskId,
        req.params.userId
      );

      res.json({ is_contributor: isContributor });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
