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

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { OptimisticLockConflictError } from '@/services/tasks-api';
import type { Database } from '../../../backend/src/types/database.types';
import { useToast } from './use-toast';

type Task = Database['public']['Tables']['tasks']['Row'];

export interface ConflictResolutionStrategy {
  type: 'use_server' | 'keep_local' | 'manual_merge';
  label: string;
  description: string;
}

export interface OptimisticLockConflict {
  task_id: string;
  local_changes: Partial<Task>;
  server_state: Task;
  client_timestamp: string;
  server_timestamp: string;
  strategies: ConflictResolutionStrategy[];
}

export interface UseOptimisticLockingOptions {
  /**
   * Callback when conflict is detected
   * Return strategy to auto-resolve, or undefined to show dialog
   */
  onConflict?: (
    conflict: OptimisticLockConflict
  ) => ConflictResolutionStrategy | undefined | Promise<ConflictResolutionStrategy | undefined>;

  /**
   * Auto-retry with server state after conflict
   * Default: false (show dialog instead)
   */
  autoRetryWithServerState?: boolean;

  /**
   * Show toast notifications for conflicts
   * Default: true
   */
  showNotifications?: boolean;
}

export function useOptimisticLocking(options: UseOptimisticLockingOptions = {}) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [currentConflict, setCurrentConflict] = useState<OptimisticLockConflict | null>(null);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);

  // Store resolution callback for current conflict
  const resolveConflictRef = useRef<
    ((strategy: ConflictResolutionStrategy) => void) | null
  >(null);

  /**
   * Handle an optimistic lock conflict
   * Returns a promise that resolves with the chosen resolution strategy
   */
  const handleConflict = useCallback(
    async (
      error: OptimisticLockConflictError,
      local_changes: Partial<Task>
    ): Promise<ConflictResolutionStrategy> => {
      const conflict: OptimisticLockConflict = {
        task_id: error.current_state.id,
        local_changes,
        server_state: error.current_state,
        client_timestamp: error.client_timestamp,
        server_timestamp: error.server_timestamp,
        strategies: [
          {
            type: 'use_server',
            label: t('optimistic_locking.use_server'),
            description: t('optimistic_locking.use_server_description'),
          },
          {
            type: 'keep_local',
            label: t('optimistic_locking.keep_local'),
            description: t('optimistic_locking.keep_local_description'),
          },
          {
            type: 'manual_merge',
            label: t('optimistic_locking.manual_merge'),
            description: t('optimistic_locking.manual_merge_description'),
          },
        ],
      };

      // Show toast notification if enabled
      if (options.showNotifications !== false) {
        toast({
          title: t('optimistic_locking.conflict_detected'),
          description: t('optimistic_locking.conflict_message'),
          variant: 'default',
        });
      }

      // Try custom conflict handler first
      if (options.onConflict) {
        const customStrategy = await options.onConflict(conflict);
        if (customStrategy) {
          return customStrategy;
        }
      }

      // Auto-retry with server state if enabled
      if (options.autoRetryWithServerState) {
        return conflict.strategies[0]; // Use server state
      }

      // Show conflict resolution dialog
      setCurrentConflict(conflict);
      setIsConflictDialogOpen(true);

      // Wait for user to choose resolution strategy
      return new Promise<ConflictResolutionStrategy>((resolve) => {
        resolveConflictRef.current = resolve;
      });
    },
    [options, t, toast]
  );

  /**
   * Resolve the current conflict with chosen strategy
   */
  const resolveConflict = useCallback(
    (strategy: ConflictResolutionStrategy) => {
      if (resolveConflictRef.current) {
        resolveConflictRef.current(strategy);
        resolveConflictRef.current = null;
      }

      setIsConflictDialogOpen(false);
      setCurrentConflict(null);
    },
    []
  );

  /**
   * Cancel/dismiss the conflict dialog
   * Defaults to using server state
   */
  const dismissConflict = useCallback(() => {
    if (currentConflict) {
      resolveConflict(currentConflict.strategies[0]); // Use server state
    }
  }, [currentConflict, resolveConflict]);

  /**
   * Apply resolution strategy to get updated data for retry
   */
  const applyStrategy = useCallback(
    (
      strategy: ConflictResolutionStrategy,
      conflict: OptimisticLockConflict
    ): Partial<Task> & { last_known_updated_at: string } => {
      switch (strategy.type) {
        case 'use_server':
          // Use server state, keep updated_at for next attempt
          return {
            ...conflict.server_state,
            last_known_updated_at: conflict.server_state.updated_at,
          };

        case 'keep_local':
          // Keep local changes, use server's updated_at for retry
          return {
            ...conflict.local_changes,
            last_known_updated_at: conflict.server_state.updated_at,
          };

        case 'manual_merge':
          // Manual merge - return current state, user will manually edit
          // and retry with updated_at from server
          return {
            ...conflict.server_state,
            ...conflict.local_changes,
            last_known_updated_at: conflict.server_state.updated_at,
          };

        default:
          return {
            ...conflict.server_state,
            last_known_updated_at: conflict.server_state.updated_at,
          };
      }
    },
    []
  );

  /**
   * Wrapper for mutations that handles conflicts automatically
   */
  const withConflictHandling = useCallback(
    <TArgs extends any[], TResult>(
      mutationFn: (...args: TArgs) => Promise<TResult>,
      getLocalChanges: (...args: TArgs) => Partial<Task>
    ) => {
      return async (...args: TArgs): Promise<TResult> => {
        try {
          return await mutationFn(...args);
        } catch (error) {
          if (error instanceof OptimisticLockConflictError) {
            const localChanges = getLocalChanges(...args);
            const strategy = await handleConflict(error, localChanges);
            const resolvedData = applyStrategy(strategy, {
              task_id: error.current_state.id,
              local_changes: localChanges,
              server_state: error.current_state,
              client_timestamp: error.client_timestamp,
              server_timestamp: error.server_timestamp,
              strategies: [],
            });

            // Retry with resolved data
            // Note: Caller should handle this by re-calling mutation with resolvedData
            throw new Error('CONFLICT_RESOLVED'); // Signal to retry
          }
          throw error;
        }
      };
    },
    [handleConflict, applyStrategy]
  );

  return {
    // Current conflict state
    currentConflict,
    isConflictDialogOpen,

    // Conflict resolution handlers
    handleConflict,
    resolveConflict,
    dismissConflict,
    applyStrategy,

    // Utility wrapper
    withConflictHandling,
  };
}

/**
 * Get human-readable conflict summary for display
 */
export function getConflictSummary(conflict: OptimisticLockConflict): {
  title: string;
  description: string;
  changes: Array<{ field: string; local: any; server: any }>;
} {
  const changes: Array<{ field: string; local: any; server: any }> = [];

  // Compare local changes with server state
  Object.entries(conflict.local_changes).forEach(([field, localValue]) => {
    const serverValue = conflict.server_state[field as keyof Task];
    if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
      changes.push({
        field,
        local: localValue,
        server: serverValue,
      });
    }
  });

  const timeDiff = new Date(conflict.server_timestamp).getTime() -
                   new Date(conflict.client_timestamp).getTime();
  const secondsAgo = Math.floor(timeDiff / 1000);

  return {
    title: 'Conflict Detected',
    description: `This task was modified by another user ${secondsAgo} seconds ago. Choose how to resolve the conflict.`,
    changes,
  };
}

/**
 * Format field name for display
 */
export function formatFieldName(field: string): string {
  return field
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format field value for display
 */
export function formatFieldValue(value: any): string {
  if (value === null || value === undefined) {
    return 'None';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  if (typeof value === 'string' && value.length > 50) {
    return value.substring(0, 50) + '...';
  }

  return String(value);
}
