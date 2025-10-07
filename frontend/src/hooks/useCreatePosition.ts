/**
 * TanStack Query mutation for creating a new position
 *
 * Invalidates positions list on success
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { CreatePositionRequest, Position } from '../types/position';

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

/**
 * Hook to create a new position
 */
export const useCreatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePositionRequest): Promise<Position> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/positions-create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Failed to create position: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate positions list to refetch with new position
      queryClient.invalidateQueries({ queryKey: ['positions', 'list'] });
    },
  });
};
