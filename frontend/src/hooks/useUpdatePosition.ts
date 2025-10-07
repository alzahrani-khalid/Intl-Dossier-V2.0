/**
 * TanStack Query mutation for updating a position
 *
 * Includes optimistic updates and rollback on version conflict (409)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Position, UpdatePositionRequest } from '../types/position';

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

// Helper to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
};

interface UpdatePositionVariables {
  id: string;
  data: UpdatePositionRequest;
}

/**
 * Hook to update a position with optimistic updates
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
