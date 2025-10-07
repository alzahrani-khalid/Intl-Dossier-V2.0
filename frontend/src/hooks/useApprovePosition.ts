/**
 * TanStack Query mutation for approving a position
 *
 * Requires elevated token from step-up authentication
 * Invalidates position and approvals on success
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Position } from '../types/position';

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

// Helper to get auth headers with optional elevated token
const getAuthHeaders = async (elevatedToken?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (elevatedToken) {
    headers['Authorization'] = `Bearer ${elevatedToken}`;
  } else {
    const { data: { session } } = await supabase.auth.getSession();
    headers['Authorization'] = `Bearer ${session?.access_token}`;
  }

  return headers;
};

interface ApprovePositionVariables {
  id: string;
  comments?: string;
  elevatedToken: string; // Required elevated token from step-up
}

/**
 * Hook to approve a position at current stage
 * Requires elevated token from step-up authentication
 */
export const useApprovePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, comments, elevatedToken }: ApprovePositionVariables): Promise<Position> => {
      if (!elevatedToken) {
        throw new Error('Step-up authentication required. Please verify your identity first.');
      }

      const headers = await getAuthHeaders(elevatedToken);
      const response = await fetch(`${API_BASE_URL}/positions-approve?id=${id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'approve',
          comments: comments || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));

        // Special handling for step-up required (403)
        if (response.status === 403) {
          throw new Error('Step-up authentication required or you are not authorized for this approval stage.');
        }

        throw new Error(error.message || `Failed to approve position: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data, { id }) => {
      // Update the position cache
      queryClient.setQueryData(['positions', 'detail', id], data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['positions', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] }); // My approvals dashboard
    },
  });
};
