/**
 * Delegation Management Hooks
 * TanStack Query hooks for delegation operations
 *
 * Feature: 019-user-management-access
 * Task: T053
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  delegatePermissions,
  revokeDelegation,
  validateDelegation,
  getMyDelegations,
  type DelegatePermissionsRequest,
  type DelegatePermissionsResponse,
  type RevokeDelegationRequest,
  type RevokeDelegationResponse,
  type ValidateDelegationRequest,
  type ValidateDelegationResponse,
  type MyDelegationsResponse,
} from '@/services/user-management-api';

// ============================================================================
// Query Keys
// ============================================================================

export const delegationKeys = {
  all: ['delegations'] as const,
  myDelegations: (params?: {
    type?: 'granted' | 'received' | 'all';
    active_only?: boolean;
    expiring_within_days?: number;
  }) => ['delegations', 'my', params] as const,
  validate: (granteeId: string, resourceType?: string, resourceId?: string) =>
    ['delegations', 'validate', granteeId, resourceType, resourceId] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to create a new delegation
 *
 * @returns Mutation for creating delegation
 *
 * @example
 * ```tsx
 * const { mutate: delegate, isPending } = useDelegatePermissions();
 *
 * delegate({
 *   grantee_id: 'user-uuid',
 *   valid_until: '2025-12-31T23:59:59Z',
 *   reason: 'Vacation coverage',
 * });
 * ```
 */
export function useDelegatePermissions() {
  const queryClient = useQueryClient();

  return useMutation<DelegatePermissionsResponse, Error, DelegatePermissionsRequest>({
    mutationFn: delegatePermissions,
    onSuccess: () => {
      // Invalidate my delegations query to refetch updated list
      queryClient.invalidateQueries({
        queryKey: delegationKeys.all,
      });
    },
  });
}

/**
 * Hook to revoke an active delegation
 *
 * @returns Mutation for revoking delegation
 *
 * @example
 * ```tsx
 * const { mutate: revoke, isPending } = useRevokeDelegation();
 *
 * revoke({
 *   delegation_id: 'delegation-uuid',
 *   reason: 'User returned early',
 * });
 * ```
 */
export function useRevokeDelegation() {
  const queryClient = useQueryClient();

  return useMutation<RevokeDelegationResponse, Error, RevokeDelegationRequest>({
    mutationFn: revokeDelegation,
    onSuccess: () => {
      // Invalidate my delegations query to refetch updated list
      queryClient.invalidateQueries({
        queryKey: delegationKeys.all,
      });
    },
  });
}

/**
 * Hook to validate if delegation can be created
 *
 * @param data - Validation request data
 * @param options - Query options (enabled, etc.)
 * @returns Query with validation result
 *
 * @example
 * ```tsx
 * const { data: validation, isLoading } = useValidateDelegation({
 *   grantee_id: 'user-uuid',
 * }, {
 *   enabled: !!granteeId, // Only validate when grantee is selected
 * });
 *
 * if (validation?.valid) {
 *   // Show delegation form
 * } else {
 *   // Show validation errors
 * }
 * ```
 */
export function useValidateDelegation(
  data: ValidateDelegationRequest,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery<ValidateDelegationResponse, Error>({
    queryKey: delegationKeys.validate(data.grantee_id, data.resource_type, data.resource_id),
    queryFn: () => validateDelegation(data),
    enabled: options?.enabled ?? !!data.grantee_id,
    staleTime: 30000, // 30 seconds - validation should be relatively fresh
  });
}

/**
 * Hook to get user's delegations (granted and received)
 *
 * @param params - Query parameters (type, active_only, expiring_within_days)
 * @param options - Query options (enabled, etc.)
 * @returns Query with delegations list
 *
 * @example
 * ```tsx
 * // Get all active delegations
 * const { data: delegations } = useMyDelegations({
 *   active_only: true,
 * });
 *
 * // Get delegations expiring within 7 days
 * const { data: expiring } = useMyDelegations({
 *   active_only: true,
 *   expiring_within_days: 7,
 * });
 *
 * // Get only granted delegations
 * const { data: granted } = useMyDelegations({
 *   type: 'granted',
 * });
 * ```
 */
export function useMyDelegations(
  params?: {
    type?: 'granted' | 'received' | 'all';
    active_only?: boolean;
    expiring_within_days?: number;
  },
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery<MyDelegationsResponse, Error>({
    queryKey: delegationKeys.myDelegations(params),
    queryFn: () => getMyDelegations(params),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval, // Optional auto-refresh for expiry warnings
    staleTime: 60000, // 1 minute - allow some staleness for better UX
  });
}

/**
 * Hook to get delegations expiring soon (within 7 days)
 *
 * Convenience hook that auto-refetches every 5 minutes to keep expiry warnings fresh.
 *
 * @returns Query with delegations expiring soon
 *
 * @example
 * ```tsx
 * const { data: expiringSoon, isLoading } = useDelegationsExpiringSoon();
 *
 * if (expiringSoon && expiringSoon.total > 0) {
 *   // Show expiry warning banner
 * }
 * ```
 */
export function useDelegationsExpiringSoon() {
  return useMyDelegations(
    {
      active_only: true,
      expiring_within_days: 7,
    },
    {
      refetchInterval: 300000, // Refetch every 5 minutes
    }
  );
}
