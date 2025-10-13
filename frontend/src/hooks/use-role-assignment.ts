/**
 * Role Assignment Hooks
 * TanStack Query hooks for role assignment and approval operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignRole,
  approveRoleChange,
  getPendingApprovals,
  getUserPermissions,
  type AssignRoleRequest,
  type ApproveRoleChangeRequest,
} from '@/services/user-management-api';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// Assign Role Hook
// ============================================================================

/**
 * Hook for assigning or changing user roles (admin only)
 *
 * Features:
 * - Handles both immediate role changes and dual approval workflow
 * - Automatic cache invalidation
 * - Toast notifications with appropriate messaging
 * - Session termination notification for immediate changes
 * - Approval request tracking for admin role assignments
 *
 * @example
 * const { mutate: assignRole, isPending } = useRoleAssignment();
 *
 * assignRole({
 *   user_id: 'uuid',
 *   new_role: 'editor',
 *   reason: 'Promotion to editor role'
 * });
 */
export function useRoleAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: assignRole,
    onSuccess: (data) => {
      // Invalidate users and permissions cache
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });

      // Check if it's an immediate change or approval required
      if ('role_changed' in data && data.role_changed) {
        // Immediate role change (non-admin roles)
        toast({
          title: 'Role changed successfully',
          description: `Role updated to ${data.new_role}. ${data.sessions_terminated} active session(s) terminated.`,
          variant: 'success',
        });

        // Invalidate pending approvals as this might affect them
        queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      } else if ('requires_approval' in data && data.requires_approval) {
        // Admin role requires approval
        toast({
          title: 'Approval request created',
          description: `Admin role assignment requires ${data.pending_approvals} approval(s). Request ID: ${data.approval_request_id}`,
          variant: 'default',
        });

        // Invalidate pending approvals to show the new request
        queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      }
    },
    onError: (error: any) => {
      // Show error toast with details
      const errorMessage = error.error || error.message || 'Failed to assign role';
      const errorCode = error.code || '';
      const errorDetails = error.details?.join(', ') || '';

      let description = errorMessage;
      if (errorCode === 'SAME_ROLE') {
        description = 'User already has this role';
      } else if (errorCode === 'USER_NOT_FOUND') {
        description = 'User not found';
      } else if (errorCode === 'SELF_ASSIGNMENT') {
        description = 'Cannot change your own role';
      } else if (errorDetails) {
        description = `${errorMessage}: ${errorDetails}`;
      }

      toast({
        title: 'Failed to assign role',
        description,
        variant: 'destructive',
      });

      console.error('Assign role error:', error);
    },
  });
}

// ============================================================================
// Approve Role Change Hook
// ============================================================================

/**
 * Hook for approving or rejecting admin role assignment requests (admin only)
 *
 * Features:
 * - Handles dual approval workflow
 * - Shows appropriate messages for first/second approval
 * - Rejection reason tracking
 * - Automatic cache invalidation
 * - Toast notifications
 *
 * @example
 * const { mutate: approveRole, isPending } = useRoleApproval();
 *
 * approveRole({
 *   approval_request_id: 'uuid',
 *   approved: true
 * });
 */
export function useRoleApproval() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: approveRoleChange,
    onSuccess: (data) => {
      // Invalidate pending approvals and users cache
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });

      // Handle different approval statuses
      if (data.status === 'first_approved') {
        toast({
          title: 'First approval recorded',
          description: `${data.remaining_approvals} more approval(s) needed`,
          variant: 'default',
        });
      } else if (data.status === 'approved' && 'role_applied' in data) {
        toast({
          title: 'Role change approved',
          description: `User ${data.user_id} role updated to ${data.new_role}`,
          variant: 'success',
        });
      } else if (data.status === 'rejected' && 'rejection_reason' in data) {
        toast({
          title: 'Request rejected',
          description: data.rejection_reason,
          variant: 'default',
        });
      }
    },
    onError: (error: any) => {
      // Show error toast with details
      const errorMessage = error.error || error.message || 'Failed to process approval';
      const errorCode = error.code || '';
      const errorDetails = error.details?.join(', ') || '';

      let description = errorMessage;
      if (errorCode === 'ALREADY_APPROVED') {
        description = 'Already approved by this administrator';
      } else if (errorCode === 'SELF_APPROVAL') {
        description = 'Cannot approve your own role change request';
      } else if (errorCode === 'DUPLICATE_APPROVER') {
        description = 'Both approvals must be from different administrators';
      } else if (errorDetails) {
        description = `${errorMessage}: ${errorDetails}`;
      }

      toast({
        title: 'Approval failed',
        description,
        variant: 'destructive',
      });

      console.error('Approve role change error:', error);
    },
  });
}

// ============================================================================
// Pending Approvals Query Hook
// ============================================================================

/**
 * Hook for fetching pending role approval requests (admin only)
 *
 * Features:
 * - Automatic refetch on interval (30 seconds)
 * - Filtering by status
 * - Pagination support
 * - Error handling
 *
 * @example
 * const { data, isLoading, error } = usePendingApprovals({
 *   status: 'pending',
 *   limit: 50,
 *   offset: 0
 * });
 */
export function usePendingApprovals(params?: {
  status?: 'pending' | 'first_approved' | 'approved' | 'rejected';
  limit?: number;
  offset?: number;
}) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['pending-approvals', params],
    queryFn: () => getPendingApprovals(params),
    refetchInterval: 30000, // Refetch every 30 seconds
    onError: (error: any) => {
      const errorMessage = error.error || error.message || 'Failed to fetch pending approvals';
      toast({
        title: 'Failed to load approvals',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Pending approvals error:', error);
    },
  });
}

// ============================================================================
// User Permissions Query Hook
// ============================================================================

/**
 * Hook for fetching user permissions (role + delegations)
 *
 * Features:
 * - Automatic cache management
 * - Permission caching per user
 * - Error handling
 * - Loading states
 *
 * @example
 * const { data, isLoading, error } = useUserPermissions('user-uuid');
 */
export function useUserPermissions(userId: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: () => getUserPermissions(userId),
    enabled: !!userId, // Only fetch if userId is provided
    staleTime: 60000, // Consider data fresh for 1 minute
    onError: (error: any) => {
      const errorMessage = error.error || error.message || 'Failed to fetch user permissions';
      toast({
        title: 'Failed to load permissions',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('User permissions error:', error);
    },
  });
}
