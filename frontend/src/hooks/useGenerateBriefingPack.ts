/**
 * Briefing Pack Generation Hook
 * @module hooks/useGenerateBriefingPack
 * @feature briefing-pack-generator
 * @task T040
 *
 * TanStack Mutation hook for initiating asynchronous briefing pack generation.
 *
 * @description
 * This hook initiates the generation of a briefing pack for an engagement and returns
 * a job ID for status polling via useBriefingPackStatus. The generation process is
 * asynchronous and may take several seconds to minutes depending on the number of positions.
 *
 * Features:
 * - Async job initiation with job ID response
 * - Automatic cache invalidation on success
 * - Position analytics tracking
 * - Bilingual support (EN/AR)
 * - Error handling for common failure scenarios
 * - Support for specific position selection or all attached positions
 *
 * @example
 * // Generate briefing pack for all positions in an engagement
 * const { mutate, isPending } = useGenerateBriefingPack();
 * mutate({
 *   engagementId: 'engagement-uuid',
 *   language: 'en'
 * });
 *
 * @example
 * // Generate for specific positions only
 * const { mutateAsync } = useGenerateBriefingPack();
 * const result = await mutateAsync({
 *   engagementId: 'engagement-uuid',
 *   language: 'ar',
 *   positionIds: ['pos-1', 'pos-2', 'pos-3']
 * });
 * // Use result.job_id with useBriefingPackStatus
 *
 * @example
 * // Handle errors
 * const { mutate } = useGenerateBriefingPack();
 * try {
 *   mutate({
 *     engagementId: 'uuid',
 *     language: 'en'
 *   });
 * } catch (error) {
 *   // Error messages:
 *   // - "No positions are attached to this engagement..."
 *   // - "Too many positions attached (max 100)..."
 * }
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Parameters for briefing pack generation request
 *
 * @description
 * Configuration for initiating a briefing pack generation job.
 */
export interface GenerateBriefingPackParams {
  /** Engagement ID to generate briefing pack for */
  engagementId: string;
  /** Target language for generated content */
  language: 'en' | 'ar';
  /** Optional: specific position IDs to include (otherwise all attached positions) */
  positionIds?: string[];
}

/**
 * Result from briefing pack generation initiation
 *
 * @description
 * Contains job ID and initial status for polling with useBriefingPackStatus.
 */
export interface GenerateBriefingPackResult {
  /** Job ID for status polling */
  job_id: string;
  /** Initial job status */
  status: 'pending' | 'generating';
  /** Estimated seconds until completion */
  estimated_completion_seconds: number;
}

/**
 * Initiate briefing pack generation via Supabase Edge Function
 *
 * @description
 * Calls the briefing-packs edge function to start async generation of a briefing pack.
 * Returns immediately with a job ID for status polling.
 *
 * Error codes:
 * - NO_POSITIONS_ATTACHED: No positions linked to engagement
 * - TOO_MANY_POSITIONS: More than 100 positions attached
 * - Authentication required: No valid session token
 *
 * @param params - Generation parameters (engagementId, language, positionIds)
 * @returns Promise resolving to job information
 * @throws Error with descriptive message for known error scenarios
 *
 * @internal
 */
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

/**
 * Hook to initiate briefing pack generation
 *
 * @description
 * TanStack Mutation hook that initiates asynchronous briefing pack generation for
 * an engagement. Returns a job ID that should be used with useBriefingPackStatus
 * to poll for completion.
 *
 * On success, automatically:
 * - Invalidates briefing packs list cache for the engagement
 * - Invalidates position analytics cache for all included positions
 *
 * @returns TanStack Mutation result with mutate/mutateAsync functions
 *
 * @example
 * // Basic usage with mutation
 * const { mutate, isPending, error } = useGenerateBriefingPack();
 *
 * const handleGenerate = () => {
 *   mutate({
 *     engagementId: 'uuid-123',
 *     language: 'en'
 *   });
 * };
 *
 * @example
 * // Async usage with job ID
 * const { mutateAsync } = useGenerateBriefingPack();
 *
 * const generateAndPoll = async () => {
 *   const result = await mutateAsync({
 *     engagementId: 'uuid-123',
 *     language: 'en'
 *   });
 *
 *   // Now poll for status
 *   const { briefingPack } = useBriefingPackStatus({
 *     jobId: result.job_id,
 *     onCompleted: (pack) => {
 *       window.open(pack.file_url, '_blank');
 *     }
 *   });
 * };
 *
 * @example
 * // Generate for specific positions only
 * const { mutate } = useGenerateBriefingPack();
 *
 * mutate({
 *   engagementId: 'uuid-123',
 *   language: 'ar',
 *   positionIds: ['pos-1', 'pos-2', 'pos-3'] // Only these 3 positions
 * });
 *
 * @example
 * // Error handling
 * const { mutate, error } = useGenerateBriefingPack();
 *
 * {error && (
 *   <Alert variant="destructive">
 *     {error.message}
 *   </Alert>
 * )}
 */
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
