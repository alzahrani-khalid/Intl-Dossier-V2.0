/**
 * TanStack Query Hook: useGenerateBriefingPack (T040)
 * Initiates briefing pack generation and returns job ID for status polling
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface GenerateBriefingPackParams {
  engagementId: string;
  language: 'en' | 'ar';
  positionIds?: string[]; // Optional: specific positions, otherwise all attached
}

export interface GenerateBriefingPackResult {
  job_id: string;
  status: 'pending' | 'generating';
  estimated_completion_seconds: number;
}

async function generateBriefingPack(
  params: GenerateBriefingPackParams
): Promise<GenerateBriefingPackResult> {
  const { engagementId, language, positionIds } = params;

  // Call edge function to initiate generation
  const { data: authData } = await supabase.auth.getSession();
  const token = authData.session?.access_token;

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${process.env.VITE_SUPABASE_URL}/functions/v1/engagements/${engagementId}/briefing-packs`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language,
        ...(positionIds && { position_ids: positionIds }),
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();

    // Handle specific error codes
    if (error.error === 'NO_POSITIONS_ATTACHED') {
      throw new Error('No positions are attached to this engagement. Please attach positions first.');
    } else if (error.error === 'TOO_MANY_POSITIONS') {
      throw new Error('Too many positions attached (max 100). Please reduce the number of positions.');
    }

    throw new Error(error.message || 'Failed to generate briefing pack');
  }

  return await response.json();
}

export function useGenerateBriefingPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateBriefingPack,
    onSuccess: (_data, variables) => {
      // Invalidate briefing packs list to show new generation
      queryClient.invalidateQueries({
        queryKey: ['briefing-packs', variables.engagementId],
      });

      // Increment analytics for all positions in the pack
      if (variables.positionIds) {
        variables.positionIds.forEach((positionId) => {
          queryClient.invalidateQueries({
            queryKey: ['position-analytics', positionId],
          });
        });
      }
    },
    onError: (error) => {
      console.error('Failed to generate briefing pack:', error);
    },
  });
}
