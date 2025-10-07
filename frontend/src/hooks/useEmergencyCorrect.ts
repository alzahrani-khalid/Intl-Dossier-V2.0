/**
 * TanStack Query mutation for emergency corrections
 *
 * Admin-only: Creates corrected version with audit trail
 * Invalidates position and triggers notifications
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Position } from '../types/position';

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

// Helper to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  // Check if user has admin role
  const isAdmin = user?.user_metadata?.role === 'admin' ||
                  user?.app_metadata?.role === 'admin';

  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    isAdmin,
  };
};

interface EmergencyCorrectionVariables {
  id: string;
  reason: string;
  correctedData: {
    title_en?: string;
    title_ar?: string;
    content_en?: string;
    content_ar?: string;
    rationale_en?: string;
    rationale_ar?: string;
  };
}

/**
 * Hook to perform emergency correction on published position
 * Admin-only operation
 */
export const useEmergencyCorrect = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason, correctedData }: EmergencyCorrectionVariables): Promise<Position> => {
      const { headers, isAdmin } = await getAuthHeaders();

      if (!isAdmin) {
        throw new Error('Emergency correction requires admin privileges');
      }

      if (!reason || reason.trim().length === 0) {
        throw new Error('Correction reason is required');
      }

      const response = await fetch(`${API_BASE_URL}/positions-emergency-correct?id=${id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reason,
          ...correctedData,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));

        // Special handling for admin-only (403)
        if (response.status === 403) {
          throw new Error('Emergency correction requires admin privileges');
        }

        throw new Error(error.message || `Failed to perform emergency correction: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data, { id }) => {
      // Update the position cache with corrected version
      queryClient.setQueryData(['positions', 'detail', id], data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['positions', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['positions', 'versions', id] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] }); // User notifications
    },
  });
};
