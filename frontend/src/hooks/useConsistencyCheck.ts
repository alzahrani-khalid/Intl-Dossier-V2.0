/**
 * TanStack Query mutation for manual consistency checking
 *
 * Includes loading state during async AI processing
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { ConsistencyCheck } from '../types/position';

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
 * Hook to trigger manual consistency check
 * AI processing may take several seconds
 */
export const useConsistencyCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<ConsistencyCheck> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/positions-consistency-check?id=${id}`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Failed to check consistency: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data, id) => {
      // Update the position to reflect new consistency score
      queryClient.invalidateQueries({ queryKey: ['positions', 'detail', id] });
    },
  });
};

interface ReconcileConflictsVariables {
  positionId: string;
  checkId: string;
  resolvedConflicts: Array<{
    conflict_id: string;
    resolution_action: string;
    notes?: string;
  }>;
}

/**
 * Hook to reconcile consistency conflicts
 */
export const useReconcileConflicts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ positionId, checkId, resolvedConflicts }: ReconcileConflictsVariables) => {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/positions-consistency-reconcile?id=${positionId}&check_id=${checkId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ resolved_conflicts: resolvedConflicts }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Failed to reconcile conflicts: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data, { positionId }) => {
      // Invalidate position to refetch with updated consistency score
      queryClient.invalidateQueries({ queryKey: ['positions', 'detail', positionId] });
    },
  });
};
