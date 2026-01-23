/**
 * Approve Position Hook
 * @module hooks/useApprovePosition
 * @feature position-approval-workflow
 *
 * TanStack Query mutation hook for approving positions with step-up authentication
 * and automatic cache invalidation.
 *
 * @description
 * This module provides a React hook for approving position documents:
 * - Mutation hook for approving positions at their current workflow stage
 * - Step-up authentication requirement for security (elevated token)
 * - Automatic cache invalidation of positions and approvals on success
 * - Authorization checks for approval stage eligibility
 * - Optional approval comments/notes
 * - Integration with approval workflow state machine
 *
 * @example
 * // Approve a position with elevated token
 * const { mutate: approvePosition, isPending } = useApprovePosition();
 * approvePosition({
 *   id: 'uuid-123',
 *   elevatedToken: token,
 *   comments: 'Approved after review',
 * });
 *
 * @example
 * // Handle step-up auth requirement
 * const { mutate, error } = useApprovePosition();
 * if (error?.message.includes('Step-up authentication required')) {
 *   // Prompt user to re-authenticate
 * }
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Position } from '../types/position';

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

/**
 * Helper to get authentication headers with optional elevated token
 *
 * @private
 * @param elevatedToken - Optional elevated token from step-up auth
 * @returns Promise resolving to headers object with auth token
 */
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

/**
 * Approve position mutation variables
 */
interface ApprovePositionVariables {
  /** Position UUID to approve */
  id: string;
  /** Optional approval comments/notes */
  comments?: string;
  /** Required elevated token from step-up authentication */
  elevatedToken: string;
}

/**
 * Hook to approve a position at current stage
 *
 * @description
 * Approves a position at its current workflow stage, advancing it to the next stage
 * in the approval workflow. Requires an elevated authentication token obtained via
 * step-up authentication for security. Automatically invalidates position and approval
 * queries on success. Validates that the user is authorized for the current approval stage.
 *
 * @returns TanStack Mutation result with mutate function accepting ApprovePositionVariables
 *
 * @example
 * const { mutate: approvePosition, isPending } = useApprovePosition();
 *
 * // Approve with step-up token
 * const handleApprove = async () => {
 *   const elevatedToken = await performStepUpAuth();
 *   approvePosition({
 *     id: 'uuid-123',
 *     elevatedToken,
 *     comments: 'Reviewed and approved. Ready for next stage.',
 *   });
 * };
 *
 * @example
 * // Handle approval with loading state
 * const { mutate, isPending, isError, error } = useApprovePosition();
 *
 * const handleApproveClick = async () => {
 *   try {
 *     const token = await requestStepUpAuth();
 *     mutate(
 *       { id: positionId, elevatedToken: token, comments: reviewNotes },
 *       {
 *         onSuccess: () => {
 *           toast.success('Position approved successfully');
 *           navigate('/approvals/pending');
 *         },
 *       }
 *     );
 *   } catch (err) {
 *     toast.error('Step-up authentication failed');
 *   }
 * };
 *
 * @example
 * // Handle authorization errors
 * const { mutate, error, isError } = useApprovePosition();
 *
 * useEffect(() => {
 *   if (isError && error.message.includes('not authorized')) {
 *     showAlert({
 *       title: 'Not Authorized',
 *       message: 'You are not authorized to approve at this stage.',
 *     });
 *   }
 * }, [isError, error]);
 *
 * @example
 * // Approve with confirmation dialog
 * const { mutate, isPending } = useApprovePosition();
 *
 * const confirmAndApprove = () => {
 *   showConfirmDialog({
 *     title: 'Approve Position',
 *     message: 'Are you sure you want to approve this position?',
 *     onConfirm: async () => {
 *       const token = await getElevatedToken();
 *       mutate({ id: positionId, elevatedToken: token });
 *     },
 *   });
 * };
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
