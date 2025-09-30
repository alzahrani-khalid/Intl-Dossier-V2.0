import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AfterActionRecord } from './useAfterAction';

export interface RequestEditRequest {
  reason: string; // 10-500 chars
  changes: Record<string, unknown>; // JSON patch format
}

export interface ApproveEditRequest {
  approval_notes?: string; // Optional, max 500 chars
}

export interface RejectEditRequest {
  rejection_reason: string; // 10-500 chars
}

// Request edit to published after-action
export function useRequestEdit(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: RequestEditRequest) => {
      // Validate reason length
      if (request.reason.length < 10 || request.reason.length > 500) {
        throw new Error('Edit reason must be between 10 and 500 characters');
      }

      const { data, error } = await supabase.functions.invoke('after-actions-request-edit', {
        body: { id, ...request },
      });

      if (error) throw error;
      return data as AfterActionRecord;
    },
    onSuccess: (data) => {
      // Update cache with edit_requested status
      queryClient.setQueryData(['after-action', id], data);
      // Invalidate list to reflect new status
      queryClient.invalidateQueries({ queryKey: ['after-actions', data.dossier_id] });
    },
  });
}

// Approve edit request (supervisor only)
export function useApproveEdit(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request?: ApproveEditRequest) => {
      const { data, error } = await supabase.functions.invoke('after-actions-approve-edit', {
        body: { id, ...request },
      });

      if (error) {
        // Check for insufficient permissions
        if (error.message?.includes('permission') || error.message?.includes('supervisor')) {
          throw new Error('Insufficient permissions. Supervisor role required.');
        }
        throw error;
      }
      return data as AfterActionRecord;
    },
    onSuccess: (data) => {
      // Update cache with new version
      queryClient.setQueryData(['after-action', id], data);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['after-actions', data.dossier_id] });
      // Invalidate versions list to show new version
      queryClient.invalidateQueries({ queryKey: ['after-action-versions', id] });
    },
  });
}

// Reject edit request (supervisor only)
export function useRejectEdit(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: RejectEditRequest) => {
      // Validate rejection reason length
      if (request.rejection_reason.length < 10 || request.rejection_reason.length > 500) {
        throw new Error('Rejection reason must be between 10 and 500 characters');
      }

      const { data, error } = await supabase.functions.invoke('after-actions-reject-edit', {
        body: { id, ...request },
      });

      if (error) {
        // Check for insufficient permissions
        if (error.message?.includes('permission') || error.message?.includes('supervisor')) {
          throw new Error('Insufficient permissions. Supervisor role required.');
        }
        throw error;
      }
      return data as AfterActionRecord;
    },
    onSuccess: (data) => {
      // Update cache with published status (no version increment)
      queryClient.setQueryData(['after-action', id], data);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['after-actions', data.dossier_id] });
    },
  });
}

// Helper hook to check edit workflow permissions and status
export function useEditWorkflowStatus(afterAction: AfterActionRecord | undefined) {
  return {
    canRequestEdit:
      afterAction?.publication_status === 'published' || afterAction?.publication_status === 'edit_rejected',
    canApproveEdit: afterAction?.publication_status === 'edit_requested',
    canRejectEdit: afterAction?.publication_status === 'edit_requested',
    isPendingApproval: afterAction?.publication_status === 'edit_requested',
  };
}
