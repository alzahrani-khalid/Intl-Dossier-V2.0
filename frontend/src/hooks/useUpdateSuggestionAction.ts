/**
 * TanStack Query Hook: useUpdateSuggestionAction (T039)
 * Updates user action on position suggestions (accepted/rejected/ignored)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface UpdateSuggestionActionParams {
  engagementId: string;
  suggestionId: string;
  action: 'accepted' | 'rejected' | 'ignored';
}

export interface UpdateSuggestionActionResult {
  suggestion: {
    id: string;
    user_action: string;
    actioned_at: string;
  };
}

async function updateSuggestionAction(
  params: UpdateSuggestionActionParams
): Promise<UpdateSuggestionActionResult> {
  const { engagementId, suggestionId, action } = params;

  // Call edge function to update suggestion action
  const { data: authData } = await supabase.auth.getSession();
  const token = authData.session?.access_token;

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${process.env.VITE_SUPABASE_URL}/functions/v1/engagements/${engagementId}/positions/suggestions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        suggestion_id: suggestionId,
        action,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update suggestion action');
  }

  return await response.json();
}

export function useUpdateSuggestionAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSuggestionAction,
    onSuccess: (_data, variables) => {
      // Invalidate suggestions query to refetch
      queryClient.invalidateQueries({
        queryKey: ['position-suggestions', variables.engagementId],
      });

      // If action is 'accepted', invalidate engagement positions list
      if (variables.action === 'accepted') {
        queryClient.invalidateQueries({
          queryKey: ['engagement-positions', variables.engagementId],
        });
      }
    },
    onError: (error) => {
      console.error('Failed to update suggestion action:', error);
    },
  });
}
