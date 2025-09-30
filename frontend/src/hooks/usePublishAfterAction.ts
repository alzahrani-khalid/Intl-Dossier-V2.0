import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AfterActionRecord } from './useAfterAction';

export interface PublishAfterActionRequest {
  mfa_token?: string;
}

export interface PublishAfterActionError {
  error: string;
  message: string;
  requires_mfa?: boolean;
}

// Publish after-action mutation with step-up MFA support
export function usePublishAfterAction(id: string) {
  const queryClient = useQueryClient();

  return useMutation<AfterActionRecord, PublishAfterActionError, PublishAfterActionRequest>({
    mutationFn: async (request) => {
      const { data, error } = await supabase.functions.invoke('after-actions-publish', {
        body: { id, ...request },
      });

      if (error) {
        // Check if step-up MFA is required
        if (error.message?.includes('step_up_required') || error.message?.includes('MFA')) {
          throw {
            error: 'step_up_required',
            message: 'This record is confidential. MFA verification required.',
            requires_mfa: true,
          } as PublishAfterActionError;
        }
        throw {
          error: error.message || 'unknown_error',
          message: error.message || 'Failed to publish after-action',
        } as PublishAfterActionError;
      }
      return data as AfterActionRecord;
    },
    onSuccess: (data) => {
      // Update cache with published record
      queryClient.setQueryData(['after-action', id], data);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['after-actions', data.dossier_id] });
      // Invalidate versions list to show new version
      queryClient.invalidateQueries({ queryKey: ['after-action-versions', id] });
    },
  });
}

// Helper hook to check if MFA is required before publishing
export function useCheckMFARequired(afterAction: AfterActionRecord | undefined) {
  return {
    mfaRequired: afterAction?.is_confidential ?? false,
    canPublish: afterAction?.publication_status === 'draft' || afterAction?.publication_status === 'edit_approved',
  };
}

// Hook to request MFA challenge from Supabase Auth
export function useRequestMFAChallenge() {
  return useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Request MFA challenge from Supabase
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: user.factors?.[0]?.id || '', // Use first factor
      });

      if (error) throw error;
      return data;
    },
  });
}

// Hook to verify MFA token
export function useVerifyMFAToken() {
  return useMutation({
    mutationFn: async ({ challengeId, code }: { challengeId: string; code: string }) => {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: challengeId,
        challengeId,
        code,
      });

      if (error) {
        throw new Error('Invalid MFA code. Please try again.');
      }

      return data;
    },
  });
}
