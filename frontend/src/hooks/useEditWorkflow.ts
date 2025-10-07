/**
 * useEditWorkflow Hooks
 *
 * Hooks for managing edit approval workflow for after-actions
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface EditRequestParams {
  afterActionId: string;
  reason: string;
}

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
