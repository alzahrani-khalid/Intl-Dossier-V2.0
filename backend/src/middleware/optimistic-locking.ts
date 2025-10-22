/**
 * Optimistic Locking Middleware
 * Part of: 025-unified-tasks-model implementation
 *
 * Strategy: Compare updated_at timestamps (not version column)
 * - Client sends last_known_updated_at in request body
 * - Middleware fetches current updated_at from database
 * - Returns 409 Conflict if timestamps don't match
 * - Includes current resource state in conflict response for auto-retry
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface OptimisticLockRequest extends Request {
  body: {
    last_known_updated_at?: string;
    [key: string]: any;
  };
}

export interface OptimisticLockConflict {
  error: 'optimistic_lock_conflict';
  message: string;
  current_state: any;
  client_timestamp: string;
  server_timestamp: string;
}

/**
 * Optimistic locking middleware for tasks table
 * Usage: app.put('/tasks/:id', optimisticLockingMiddleware('tasks'), taskController.update)
 */
export function optimisticLockingMiddleware(
  table: 'tasks' | 'task_contributors'
) {
  return async (
    req: OptimisticLockRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const resourceId = req.params.id;
      const { last_known_updated_at } = req.body;

      // Skip optimistic lock check if client didn't provide timestamp
      if (!last_known_updated_at) {
        return next();
      }

      // Fetch current resource from database
      const { data: currentResource, error } = await supabase
        .from(table)
        .select('updated_at')
        .eq('id', resourceId)
        .eq('is_deleted', false)
        .single();

      if (error || !currentResource) {
        return res.status(404).json({
          error: 'resource_not_found',
          message: `${table} resource with id ${resourceId} not found`,
        });
      }

      // Compare timestamps (convert both to UTC milliseconds for comparison)
      const clientTimestamp = new Date(last_known_updated_at).getTime();
      const serverTimestamp = new Date(currentResource.updated_at).getTime();

      // Allow small clock skew (100ms) to account for network/processing delays
      const CLOCK_SKEW_MS = 100;

      if (Math.abs(serverTimestamp - clientTimestamp) > CLOCK_SKEW_MS) {
        // Timestamps don't match - resource was modified by another user
        // Fetch full current state for client to merge/retry
        const { data: fullResource } = await supabase
          .from(table)
          .select('*')
          .eq('id', resourceId)
          .eq('is_deleted', false)
          .single();

        const conflict: OptimisticLockConflict = {
          error: 'optimistic_lock_conflict',
          message: `Resource was modified by another user. Please refresh and try again.`,
          current_state: fullResource,
          client_timestamp: last_known_updated_at,
          server_timestamp: currentResource.updated_at,
        };

        return res.status(409).json(conflict);
      }

      // Timestamps match - allow update to proceed
      next();
    } catch (err) {
      console.error('Optimistic locking middleware error:', err);
      res.status(500).json({
        error: 'internal_server_error',
        message: 'Failed to validate optimistic lock',
      });
    }
  };
}

/**
 * Auto-retry helper for optimistic lock conflicts
 * Usage: const result = await autoRetryOnConflict(() => updateTask(taskId, data))
 *
 * @param operation - Async function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param delayMs - Base delay between retries in milliseconds (default: 100ms)
 * @returns Operation result or throws error after max retries
 */
export async function autoRetryOnConflict<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Only retry on 409 Conflict
      if (error.status !== 409 || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 50;
      const delay = delayMs * Math.pow(2, attempt - 1) + jitter;
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(
        `Optimistic lock conflict - retry ${attempt}/${maxRetries} after ${delay}ms`
      );
    }
  }

  throw lastError || new Error('Auto-retry failed');
}
