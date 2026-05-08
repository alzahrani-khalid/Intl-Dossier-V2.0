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

import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export interface OptimisticLockRequest extends Request {
  body: {
    last_known_updated_at?: string
    [key: string]: any
  }
}

export interface OptimisticLockConflict {
  error: 'optimistic_lock_conflict'
  message: string
  current_state: any
  client_timestamp: string
  server_timestamp: string
}

/**
 * Optimistic locking middleware for tasks table
 * Usage: app.put('/tasks/:id', optimisticLockingMiddleware('tasks'), taskController.update)
 */
export function optimisticLockingMiddleware(table: 'tasks' | 'task_contributors') {
  return async (req: OptimisticLockRequest, res: Response, next: NextFunction) => {
    try {
      const resourceId = req.params.id
      const { last_known_updated_at } = req.body

      // Skip optimistic lock check if client didn't provide timestamp
      if (!last_known_updated_at) {
        return next()
      }

      if (!resourceId) {
        return res.status(400).json({ error: 'missing_resource_id' })
      }

      // Fetch current resource from database
      const { data: currentResource, error } = await supabase
        .from(table)
        .select('updated_at')
        .eq('id', resourceId)
        .eq('is_deleted' as never, false as never)
        .single()

      if (error || !currentResource) {
        return res.status(404).json({
          error: 'resource_not_found',
          message: `${table} resource with id ${resourceId} not found`,
        })
      }

      const cur = currentResource as unknown as { updated_at?: string }

      // Compare timestamps (convert both to UTC milliseconds for comparison)
      const clientTimestamp = new Date(last_known_updated_at).getTime()
      const serverTimestamp = new Date(cur.updated_at ?? 0).getTime()

      // Allow small clock skew (100ms) to account for network/processing delays
      const CLOCK_SKEW_MS = 100

      if (Math.abs(serverTimestamp - clientTimestamp) > CLOCK_SKEW_MS) {
        // Timestamps don't match - resource was modified by another user
        // Fetch full current state for client to merge/retry
        const { data: fullResource } = await supabase
          .from(table)
          .select('*')
          .eq('id', resourceId)
          .eq('is_deleted' as never, false as never)
          .single()

        const conflict: OptimisticLockConflict = {
          error: 'optimistic_lock_conflict',
          message: `Resource was modified by another user. Please refresh and try again.`,
          current_state: fullResource,
          client_timestamp: last_known_updated_at,
          server_timestamp: cur.updated_at ?? '',
        }

        return res.status(409).json(conflict)
      }

      // Timestamps match - allow update to proceed
      return next()
    } catch (err) {
      console.error('Optimistic locking middleware error:', err)
      res.status(500).json({
        error: 'internal_server_error',
        message: 'Failed to validate optimistic lock',
      })
    }
  }
}
