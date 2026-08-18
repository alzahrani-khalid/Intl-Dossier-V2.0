/**
 * Optimistic Locking Hook
 * Part of: 025-unified-tasks-model implementation
 * Task: T025
 *
 * Hook for handling optimistic lock conflicts with:
 * - Conflict detection and resolution dialog
 * - Auto-merge strategies (use server, keep local, manual merge)
 * - User-friendly conflict notifications
 * - Integration with use-tasks mutations
 */

import type { Database } from '../../../backend/src/types/database.types'

type Task = Database['public']['Tables']['tasks']['Row']

export interface ConflictResolutionStrategy {
  type: 'use_server' | 'keep_local' | 'manual_merge'
  label: string
  description: string
}

export interface OptimisticLockConflict {
  task_id: string
  local_changes: Partial<Task>
  server_state: Task
  client_timestamp: string
  server_timestamp: string
  strategies: ConflictResolutionStrategy[]
}

export interface UseOptimisticLockingOptions {
  /**
   * Callback when conflict is detected
   * Return strategy to auto-resolve, or undefined to show dialog
   */
  onConflict?: (
    conflict: OptimisticLockConflict,
  ) => ConflictResolutionStrategy | undefined | Promise<ConflictResolutionStrategy | undefined>

  /**
   * Auto-retry with server state after conflict
   * Default: false (show dialog instead)
   */
  autoRetryWithServerState?: boolean

  /**
   * Show toast notifications for conflicts
   * Default: true
   */
  showNotifications?: boolean
}

import type { ConflictField, JsonValue } from '@/types/common.types'
import { formatRelativeTime } from '@/lib/format-date'

/**
 * Get human-readable conflict summary for display
 */
export function getConflictSummary(conflict: OptimisticLockConflict): {
  title: string
  description: string
  changes: ConflictField[]
} {
  const changes: ConflictField[] = []

  // Compare local changes with server state
  Object.entries(conflict.local_changes).forEach(([field, localValue]) => {
    const serverValue = conflict.server_state[field as keyof Task]
    if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
      changes.push({
        field,
        local: localValue as JsonValue,
        server: serverValue as JsonValue,
      })
    }
  })

  // D-25 / RULING-P98A2-17 B-4: the recency phrase was a hardcoded English
  // literal built from a server-vs-client timestamp DELTA — English under `ar`,
  // and it claimed relativeness to NOW while measuring a fixed interval. It now
  // states the server edit's real recency through the ONE shared localized helper.
  const modifiedAgo = formatRelativeTime(conflict.server_timestamp)

  return {
    title: 'Conflict Detected',
    description: `This task was modified by another user ${modifiedAgo}. Choose how to resolve the conflict.`,
    changes,
  }
}

/**
 * Format field name for display
 */
export function formatFieldName(field: string): string {
  return field
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format field value for display
 */
export function formatFieldValue(value: JsonValue): string {
  if (value === null) {
    return 'None'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  if (typeof value === 'string' && value.length > 50) {
    return value.substring(0, 50) + '...'
  }

  return String(value)
}
