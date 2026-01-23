/**
 * User Management Hooks
 * TanStack Query hooks for user lifecycle operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser, activateAccount, type CreateUserRequest, type ActivateAccountRequest } from '@/services/user-management-api';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// Create User Hook
// ============================================================================

/**
 * Hook for creating new user accounts (admin only)
 *
 * Features:
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Toast notifications
 * - Error handling
 *
 * @example
 * const { mutate: createUser, isPending } = useCreateUser();
 *
 * createUser({
 *   email: 'user@example.com',
 *   username: 'username',
 *   full_name: 'Full Name',
 *   role: 'editor'
 * });
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      // Invalidate users list cache
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // Show success toast
      toast({
        title: 'User created successfully',
        description: `Activation email sent to ${data.user_id}. Expires at ${new Date(data.activation_expires_at).toLocaleString()}`,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      // Show error toast with details
      const errorMessage = error.error || error.message || 'Failed to create user';
      const errorDetails = error.details?.join(', ') || '';

      toast({
        title: 'Failed to create user',
        description: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage,
        variant: 'destructive',
      });

      console.error('Create user error:', error);
    },
  });
}

// ============================================================================
// Activate Account Hook
// ============================================================================

/**
 * Hook for activating user accounts
 *
 * Features:
 * - Password strength validation
 * - Automatic redirect on success
 * - Toast notifications
 * - Error handling
 *
 * @example
 * const { mutate: activateAccount, isPending } = useActivateAccount();
 *
 * activateAccount({
 *   activation_token: 'token-uuid',
 *   password: 'StrongP@ssw0rd'
 * });
 */
export function useActivateAccount() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: activateAccount,
    onSuccess: (data) => {
      // Show success toast
      toast({
        title: 'Account activated',
        description: data.message,
        variant: 'success',
      });

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    },
    onError: (error: any) => {
      // Show error toast with details
      const errorMessage = error.error || error.message || 'Failed to activate account';
      const errorDetails = error.details?.join(', ') || '';

      toast({
        title: 'Activation failed',
        description: errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage,
        variant: 'destructive',
      });

      console.error('Activate account error:', error);
    },
  });
}
