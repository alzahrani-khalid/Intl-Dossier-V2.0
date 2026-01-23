/**
 * Update Position Hook
 * @module hooks/useUpdatePosition
 * @feature position-management
 *
 * TanStack Query mutation hook for updating position documents with optimistic updates,
 * version conflict detection, and automatic rollback on failure.
 *
 * @description
 * This module provides a React hook for updating position documents:
 * - Mutation hook for updating positions via edge function
 * - Optimistic UI updates for instant feedback (onMutate)
 * - Automatic rollback to previous state on error (onError)
 * - Version conflict detection (HTTP 409) with user-friendly messaging
 * - Cache invalidation of position lists on success
 * - Snapshot and restore pattern for data consistency
 *
 * @example
 * // Update a position
 * const { mutate: updatePosition, isPending } = useUpdatePosition();
 * updatePosition({
 *   id: 'uuid-123',
 *   data: { title_en: 'Updated Title', status: 'published' },
 * });
 *
 * @example
 * // Handle version conflicts
 * const { mutate, isError, error } = useUpdatePosition();
 * if (error?.message.includes('Version conflict')) {
 *   return <Alert>Please refresh and try again</Alert>;
 * }
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Position, UpdatePositionRequest } from '../types/position';

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

/**
 * Helper to get authentication headers for API requests
 *
 * @private
 * @returns Promise resolving to headers object with auth token
 * @throws Error if session is not available
 */
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
};

/**
 * Update position mutation variables
 */
interface UpdatePositionVariables {
  /** Position UUID to update */
  id: string;
  /** Partial position data to update */
  data: UpdatePositionRequest;
}

/**
 * Hook to update a position with optimistic updates
 *
 * @description
 * Updates an existing position with optimistic UI updates for instant feedback.
 * Implements TanStack Query's optimistic update pattern:
 * 1. Immediately updates the cache with new values (onMutate)
 * 2. Rolls back to previous state if the mutation fails (onError)
 * 3. Updates cache with server response on success (onSuccess)
 * 4. Detects version conflicts (HTTP 409) when another user modified the position
 *
 * @returns TanStack Mutation result with mutate function accepting { id, data }
 *
 * @example
 * const { mutate: updatePosition, isPending } = useUpdatePosition();
 *
 * // Update position title and status
 * updatePosition({
 *   id: 'uuid-123',
 *   data: {
 *     title_en: 'Updated Climate Policy',
 *     status: 'under_review',
 *   },
 * });
 *
 * @example
 * // Update with optimistic UI feedback
 * const { mutate, isPending } = useUpdatePosition();
 *
 * const handleSave = () => {
 *   mutate(
 *     { id: positionId, data: updatedFields },
 *     {
 *       onSuccess: () => {
 *         toast.success('Position updated successfully');
 *       },
 *       onError: (error) => {
 *         toast.error(`Update failed: ${error.message}`);
 *       },
 *     }
 *   );
 * };
 *
 * @example
 * // Handle version conflicts
 * const { mutate, error, isError } = useUpdatePosition();
 *
 * useEffect(() => {
 *   if (isError && error.message.includes('Version conflict')) {
 *     showDialog({
 *       title: 'Conflict Detected',
 *       message: 'Another user has modified this position. Please refresh and try again.',
 *       action: () => window.location.reload(),
 *     });
 *   }
 * }, [isError, error]);
 *
 * @example
 * // Auto-save with debounce
 * const { mutate } = useUpdatePosition();
 * const debouncedSave = useDebouncedCallback(
 *   (data) => mutate({ id: positionId, data }),
 *   1000
 * );
 *
 * const handleFieldChange = (field, value) => {
 *   debouncedSave({ [field]: value });
 * };
 */
export const useUpdatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdatePositionVariables): Promise<Position> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/positions-update?id=${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));

        // Special handling for version conflict (409)
        if (response.status === 409) {
          throw new Error('Version conflict: The position has been modified by another user. Please refresh and try again.');
        }

        throw new Error(error.message || `Failed to update position: ${response.status}`);
      }

      return response.json();
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['positions', 'detail', id] });

      // Snapshot the previous value
      const previousPosition = queryClient.getQueryData<Position>(['positions', 'detail', id]);

      // Optimistically update to the new value
      if (previousPosition) {
        queryClient.setQueryData<Position>(['positions', 'detail', id], {
          ...previousPosition,
          ...data,
          updated_at: new Date().toISOString(),
        });
      }

      // Return context with the previous value
      return { previousPosition };
    },
    onError: (err, { id }, context) => {
      // Rollback to the previous value on error
      if (context?.previousPosition) {
        queryClient.setQueryData(['positions', 'detail', id], context.previousPosition);
      }
    },
    onSuccess: (data, { id }) => {
      // Update the cache with the server response
      queryClient.setQueryData(['positions', 'detail', id], data);

      // Invalidate positions list to show updated position
      queryClient.invalidateQueries({ queryKey: ['positions', 'list'] });
    },
  });
};
