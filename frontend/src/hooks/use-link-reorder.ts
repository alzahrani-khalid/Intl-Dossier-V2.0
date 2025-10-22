/**
 * use-link-reorder Hook
 * Manages drag-and-drop state for entity link reordering
 * Feature: 024-intake-entity-linking
 * Task: T115 [US5]
 */

import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { entityLinksApi } from '@/services/entity-links-api';
import type { EntityLink } from '@/types/database.types';

interface ReorderMutationParams {
  intakeId: string;
  linkOrders: Array<{ link_id: string; link_order: number }>;
}

/**
 * Hook for managing link reordering with drag-and-drop
 * Implements debounced API calls (500ms) and optimistic updates
 *
 * @param intakeId - The intake ticket ID
 * @returns Reorder state and mutation functions
 */
export function useLinkReorder(intakeId: string) {
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Mutation for reordering links with API call
  const reorderMutation = useMutation({
    mutationFn: async ({ intakeId, linkOrders }: ReorderMutationParams) => {
      return entityLinksApi.reorderLinks(intakeId, linkOrders);
    },

    // Optimistic update: immediately update UI
    onMutate: async ({ linkOrders }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['intake-links', intakeId] });

      // Snapshot current state for rollback
      const previousLinks = queryClient.getQueryData<EntityLink[]>(['intake-links', intakeId]);

      // Optimistically update cache with new order
      if (previousLinks) {
        const linkOrderMap = new Map(linkOrders.map(lo => [lo.link_id, lo.link_order]));

        const updatedLinks = [...previousLinks].sort((a, b) => {
          const orderA = linkOrderMap.get(a.id) ?? a.link_order;
          const orderB = linkOrderMap.get(b.id) ?? b.link_order;
          return orderA - orderB;
        });

        queryClient.setQueryData(['intake-links', intakeId], updatedLinks);
      }

      return { previousLinks };
    },

    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(['intake-links', intakeId], context.previousLinks);
      }
      console.error('Failed to reorder links:', error);
    },

    // Refetch on success to ensure consistency
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake-links', intakeId] });
    },
  });

  /**
   * Debounced reorder function
   * Waits 500ms after user stops dragging before calling API
   * T117: Debounced API call for reorder operations
   */
  const debouncedReorder = useCallback(
    (linkOrders: Array<{ link_id: string; link_order: number }>) => {
      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Set new timer for 500ms debounce
      const timer = setTimeout(() => {
        reorderMutation.mutate({ intakeId, linkOrders });
      }, 500);

      setDebounceTimer(timer);
    },
    [intakeId, reorderMutation, debounceTimer]
  );

  /**
   * Immediate optimistic update without debounce
   * Used for drag-and-drop UI updates
   */
  const optimisticReorder = useCallback(
    (newOrder: EntityLink[]) => {
      queryClient.setQueryData<EntityLink[]>(['intake-links', intakeId], newOrder);
    },
    [intakeId, queryClient]
  );

  /**
   * Cancel pending reorder operation
   */
  const cancelReorder = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
  }, [debounceTimer]);

  /**
   * Set dragging state
   */
  const setDragging = useCallback((dragging: boolean) => {
    setIsDragging(dragging);
  }, []);

  // Cleanup timer on unmount
  useMemo(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    isDragging,
    setDragging,
    reorderMutation,
    debouncedReorder,
    optimisticReorder,
    cancelReorder,
    isPending: reorderMutation.isPending,
    isError: reorderMutation.isError,
    error: reorderMutation.error,
  };
}
