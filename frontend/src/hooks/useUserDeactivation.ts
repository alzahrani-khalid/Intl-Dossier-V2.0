import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  deactivateUser,
  reactivateUser,
  DeactivateUserRequest,
  DeactivateUserResponse,
  ReactivateUserRequest,
  ReactivateUserResponse,
} from '@/services/user-management-api';

/**
 * Hook for deactivating user accounts
 *
 * Handles:
 * - User deactivation with reason tracking
 * - Session termination
 * - Delegation revocation
 * - Orphaned items summary display
 * - Query cache invalidation
 * - Success/error notifications
 */
export function useDeactivateUser() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<DeactivateUserResponse, Error, DeactivateUserRequest>({
    mutationFn: deactivateUser,
    onSuccess: (data, variables) => {
      // Invalidate user queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });

      // Show success notification with orphaned items summary
      const orphanedSummary = data.orphanedItems
        ? `${data.orphanedItems.dossiers} dossiers, ${data.orphanedItems.delegations} delegations`
        : '';

      toast.success(
        t('userManagement.deactivation.success', {
          sessions: data.sessionsTerminated || 0,
          orphaned: orphanedSummary,
        })
      );
    },
    onError: (error) => {
      toast.error(
        t('userManagement.deactivation.error', {
          message: error.message,
        })
      );
    },
  });
}

/**
 * Hook for reactivating deactivated user accounts
 *
 * Handles:
 * - User reactivation with security review approval (for admin roles)
 * - Role restoration
 * - Query cache invalidation
 * - Success/error notifications
 */
export function useReactivateUser() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<ReactivateUserResponse, Error, ReactivateUserRequest>({
    mutationFn: reactivateUser,
    onSuccess: (data, variables) => {
      // Invalidate user queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });

      // Show success notification with restored role
      toast.success(
        t('userManagement.reactivation.success', {
          role: data.roleRestored || 'N/A',
        })
      );
    },
    onError: (error) => {
      toast.error(
        t('userManagement.reactivation.error', {
          message: error.message,
        })
      );
    },
  });
}
