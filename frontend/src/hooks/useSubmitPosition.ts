/**
 * TanStack Query mutation for submitting a position for review
 *
 * Invalidates position on success and returns consistency check results
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Position, ConsistencyCheck } from '../types/position';

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

interface SubmitPositionResponse {
  position: Position;
  consistency_check: ConsistencyCheck;
}

/**
 * Hook to submit a position for review
 * Returns position + consistency check results
 */
export const useSubmitPosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<SubmitPositionResponse> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/positions-submit?id=${id}`, {
        method: 'PUT',
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Failed to submit position: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data, id) => {
      // Update the position cache
      queryClient.setQueryData(['positions', 'detail', id], data.position);

      // Invalidate positions list
      queryClient.invalidateQueries({ queryKey: ['positions', 'list'] });
    },
  });
};
