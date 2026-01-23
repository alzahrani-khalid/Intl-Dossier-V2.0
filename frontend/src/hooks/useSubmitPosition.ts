/**
 * Submit Position Hook
 * @module hooks/useSubmitPosition
 * @feature position-approval-workflow
 *
 * TanStack Query mutation hook for submitting positions for review with automatic
 * consistency checking and cache invalidation.
 *
 * @description
 * This module provides a React hook for submitting position documents for review:
 * - Mutation hook for submitting positions via edge function
 * - Automatic consistency check execution on submission
 * - Returns both updated position and consistency check results
 * - Automatic cache invalidation of position queries
 * - Workflow state transition from draft to under_review
 * - Integration with approval workflow and consistency checking system
 *
 * @example
 * // Submit a position for review
 * const { mutate: submitPosition, isPending } = useSubmitPosition();
 * submitPosition('position-uuid-123');
 *
 * @example
 * // Handle consistency check results
 * const { mutate, data } = useSubmitPosition();
 * mutate(positionId, {
 *   onSuccess: (result) => {
 *     console.log('Consistency score:', result.consistency_check.overall_score);
 *   },
 * });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Position, ConsistencyCheck } from '../types/position';

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
 * Submit position response with consistency check results
 */
interface SubmitPositionResponse {
  /** Updated position entity with new status */
  position: Position;
  /** Consistency check results from AI analysis */
  consistency_check: ConsistencyCheck;
}

/**
 * Hook to submit a position for review
 *
 * @description
 * Submits a position for review, transitioning it from draft to under_review status.
 * Automatically runs a consistency check as part of the submission process and returns
 * both the updated position and the check results. Updates the position cache and
 * invalidates list queries on success.
 *
 * The consistency check analyzes the position for:
 * - Conflicts with existing positions
 * - Redundancies and gaps
 * - Overall consistency score
 * - Risk level assessment
 *
 * @returns TanStack Mutation result with mutate function accepting position ID
 *
 * @example
 * const { mutate: submitPosition, isPending, data } = useSubmitPosition();
 *
 * // Submit for review
 * submitPosition('uuid-123', {
 *   onSuccess: (result) => {
 *     console.log('Position submitted:', result.position);
 *     console.log('Consistency score:', result.consistency_check.overall_score);
 *     if (result.consistency_check.requires_human_review) {
 *       toast.info('Position requires manual review');
 *     } else {
 *       toast.success('Position submitted successfully');
 *     }
 *   },
 * });
 *
 * @example
 * // Submit with loading indicator
 * const { mutate, isPending } = useSubmitPosition();
 *
 * return (
 *   <Button
 *     onClick={() => mutate(positionId)}
 *     disabled={isPending}
 *   >
 *     {isPending ? 'Submitting...' : 'Submit for Review'}
 *   </Button>
 * );
 *
 * @example
 * // Handle consistency check results
 * const { mutate, data, isSuccess } = useSubmitPosition();
 *
 * const handleSubmit = () => {
 *   mutate(positionId);
 * };
 *
 * useEffect(() => {
 *   if (isSuccess && data) {
 *     const { consistency_check } = data;
 *     if (consistency_check.risk_level === 'high' || consistency_check.risk_level === 'critical') {
 *       showWarningDialog({
 *         title: 'High Risk Detected',
 *         message: `Consistency score: ${consistency_check.overall_score}`,
 *         conflicts: consistency_check.conflicts,
 *       });
 *     }
 *   }
 * }, [isSuccess, data]);
 *
 * @example
 * // Navigate after submission
 * const navigate = useNavigate();
 * const { mutate } = useSubmitPosition();
 *
 * const handleSubmitAndNavigate = () => {
 *   mutate(positionId, {
 *     onSuccess: () => {
 *       toast.success('Position submitted for review');
 *       navigate('/positions/pending-review');
 *     },
 *     onError: (error) => {
 *       toast.error(`Submission failed: ${error.message}`);
 *     },
 *   });
 * };
 *
 * @example
 * // Display consistency results after submission
 * const { mutate, data, isSuccess } = useSubmitPosition();
 *
 * return (
 *   <div>
 *     <Button onClick={() => mutate(positionId)}>Submit</Button>
 *     {isSuccess && data && (
 *       <ConsistencyResultsCard
 *         score={data.consistency_check.overall_score}
 *         riskLevel={data.consistency_check.risk_level}
 *         conflicts={data.consistency_check.conflicts}
 *       />
 *     )}
 *   </div>
 * );
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
