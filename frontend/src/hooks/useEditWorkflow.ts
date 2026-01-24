/**
 * Edit Workflow Hooks
 * @module hooks/useEditWorkflow
 *
 * TanStack Query mutation hooks for managing edit approval workflow on after-action records.
 *
 * @description
 * This module provides workflow mutation hooks for:
 * - Requesting edit permission on locked after-actions
 * - Approving edit requests (manager action)
 * - Rejecting edit requests with reason (manager action)
 * - Automatic cache invalidation on workflow state changes
 *
 * Workflow states:
 * 1. After-action is locked → User requests edit with reason
 * 2. Manager approves → After-action becomes editable
 * 3. Manager rejects with reason → After-action remains locked
 *
 * @example
 * // Request edit permission
 * const { mutate: requestEdit } = useRequestEdit();
 * requestEdit({
 *   afterActionId: 'uuid-123',
 *   reason: 'Need to update participant list',
 * });
 *
 * @example
 * // Approve edit request
 * const { mutate: approveEdit } = useApproveEdit();
 * approveEdit({ afterActionId: 'uuid-123' });
 *
 * @example
 * // Reject edit request
 * const { mutate: rejectEdit } = useRejectEdit();
 * rejectEdit({
 *   afterActionId: 'uuid-123',
 *   reason: 'Changes not justified, use new after-action instead',
 * });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface EditRequestParams {
  afterActionId: string;
  reason: string;
}

/**
 * Hook to request edit permission on a locked after-action
 *
 * @description
 * Submits an edit request with justification reason. Triggers notification
 * to managers for approval. Automatically invalidates after-action cache on success.
 *
 * @returns TanStack Mutation with mutate function accepting EditRequestParams
 *
 * @example
 * const { mutate: requestEdit, isPending } = useRequestEdit();
 *
 * const handleRequestEdit = () => {
 *   requestEdit({
 *     afterActionId: afterAction.id,
 *     reason: 'Forgot to include critical commitment',
 *   }, {
 *     onSuccess: () => toast.success('Edit request submitted'),
 *     onError: (error) => toast.error(error.message),
 *   });
 * };
 */
export function useRequestEdit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ afterActionId, reason }: EditRequestParams) => {
      const { data, error } = await supabase.functions.invoke(
        'after-actions-request-edit',
        {
          body: { after_action_id: afterActionId, reason },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { afterActionId }) => {
      queryClient.invalidateQueries({ queryKey: ['after-action', afterActionId] });
    },
  });
}

/**
 * Hook to approve an edit request (manager action)
 *
 * @description
 * Approves a pending edit request, unlocking the after-action for editing.
 * Triggers notification to the requester. Automatically invalidates cache.
 *
 * @returns TanStack Mutation with mutate function accepting afterActionId
 *
 * @example
 * const { mutate: approveEdit, isPending } = useApproveEdit();
 *
 * const handleApprove = () => {
 *   approveEdit({ afterActionId: request.after_action_id }, {
 *     onSuccess: () => toast.success('Edit request approved'),
 *   });
 * };
 */
export function useApproveEdit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ afterActionId }: { afterActionId: string }) => {
      const { data, error } = await supabase.functions.invoke(
        'after-actions-approve-edit',
        {
          body: { after_action_id: afterActionId },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { afterActionId }) => {
      queryClient.invalidateQueries({ queryKey: ['after-action', afterActionId] });
    },
  });
}

/**
 * Hook to reject an edit request (manager action)
 *
 * @description
 * Rejects a pending edit request with a reason, keeping the after-action locked.
 * Triggers notification to the requester with rejection reason. Invalidates cache.
 *
 * @returns TanStack Mutation with mutate function accepting EditRequestParams
 *
 * @example
 * const { mutate: rejectEdit, isPending } = useRejectEdit();
 *
 * const handleReject = () => {
 *   rejectEdit({
 *     afterActionId: request.after_action_id,
 *     reason: 'Please create a new after-action instead',
 *   }, {
 *     onSuccess: () => toast.success('Edit request rejected'),
 *   });
 * };
 */
export function useRejectEdit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ afterActionId, reason }: EditRequestParams) => {
      const { data, error } = await supabase.functions.invoke(
        'after-actions-reject-edit',
        {
          body: { after_action_id: afterActionId, reason },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { afterActionId }) => {
      queryClient.invalidateQueries({ queryKey: ['after-action', afterActionId] });
    },
  });
}
