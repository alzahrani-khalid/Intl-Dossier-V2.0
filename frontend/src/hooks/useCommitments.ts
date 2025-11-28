/**
 * useCommitments Hooks v1.1
 * Feature: 031-commitments-management
 *
 * TanStack Query hooks for full commitment CRUD operations with:
 * - Infinite scroll pagination
 * - Optimistic updates for status changes
 * - Cache invalidation on mutations
 */

import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  getCommitments,
  getCommitment,
  createCommitment,
  updateCommitment,
  updateCommitmentStatus,
  cancelCommitment,
  getCommitmentStatusHistory,
  uploadEvidence,
  type Commitment,
  type CommitmentFilters,
  type CommitmentsListResponse,
  type CreateCommitmentInput,
  type UpdateCommitmentInput,
  type PaginationCursor,
} from '@/services/commitments.service';
import {
  commitmentKeys,
  type CommitmentStatusHistory,
  type CommitmentStatus,
} from '@/types/commitment.types';

// Re-export for convenience
export { commitmentKeys };

// ============================================================================
// Query Options
// ============================================================================

export interface UseCommitmentsOptions extends CommitmentFilters {
  enabled?: boolean;
}

export interface UseCommitmentOptions {
  enabled?: boolean;
}

// ============================================================================
// List Query Hook (Standard Pagination)
// ============================================================================

/**
 * Hook to fetch commitments list with standard pagination
 *
 * @param options - Hook options with filters
 * @returns TanStack Query result
 */
export function useCommitments(options?: UseCommitmentsOptions) {
  const { enabled = true, ...filters } = options ?? {};

  return useQuery<CommitmentsListResponse, Error>({
    queryKey: commitmentKeys.list(filters),
    queryFn: () => getCommitments(filters),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000,
    enabled,
  });
}

// ============================================================================
// Infinite Query Hook (Cursor-Based Pagination)
// ============================================================================

/**
 * Hook to fetch commitments with infinite scroll pagination
 *
 * @param options - Hook options with filters
 * @returns TanStack Infinite Query result
 */
export function useInfiniteCommitments(options?: UseCommitmentsOptions) {
  const { enabled = true, ...filters } = options ?? {};

  return useInfiniteQuery<
    CommitmentsListResponse,
    Error,
    InfiniteData<CommitmentsListResponse>,
    ReturnType<typeof commitmentKeys.list>,
    PaginationCursor | undefined
  >({
    queryKey: commitmentKeys.list(filters),
    queryFn: ({ pageParam }) => getCommitments(filters, pageParam, 20),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled,
  });
}

// ============================================================================
// Detail Query Hook
// ============================================================================

/**
 * Hook to fetch a single commitment by ID
 *
 * @param commitmentId - UUID of the commitment
 * @param options - Hook options
 * @returns TanStack Query result
 */
export function useCommitment(commitmentId: string, options?: UseCommitmentOptions) {
  const { enabled = true } = options ?? {};

  return useQuery<Commitment, Error>({
    queryKey: commitmentKeys.detail(commitmentId),
    queryFn: () => getCommitment(commitmentId),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: enabled && !!commitmentId,
  });
}

// ============================================================================
// Status History Query Hook
// ============================================================================

/**
 * Hook to fetch status history for a commitment
 *
 * @param commitmentId - UUID of the commitment
 * @returns TanStack Query result
 */
export function useCommitmentStatusHistory(commitmentId: string) {
  return useQuery<CommitmentStatusHistory[], Error>({
    queryKey: commitmentKeys.history(commitmentId),
    queryFn: () => getCommitmentStatusHistory(commitmentId),
    staleTime: 30 * 1000, // 30 seconds - history may update frequently
    gcTime: 5 * 60 * 1000,
    enabled: !!commitmentId,
  });
}

// ============================================================================
// Create Mutation Hook
// ============================================================================

/**
 * Hook to create a new commitment
 *
 * @returns TanStack Mutation result
 */
export function useCreateCommitment() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('commitments');

  return useMutation<Commitment, Error, CreateCommitmentInput>({
    mutationFn: createCommitment,
    onSuccess: () => {
      // Invalidate list queries to refetch with new item
      queryClient.invalidateQueries({ queryKey: commitmentKeys.lists() });
      toast.success(t('success.created'));
    },
    onError: (error) => {
      toast.error(t('errors.createFailed'));
      console.error('Create commitment error:', error);
    },
  });
}

// ============================================================================
// Update Mutation Hook
// ============================================================================

/**
 * Hook to update an existing commitment
 *
 * @returns TanStack Mutation result
 */
export function useUpdateCommitment() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('commitments');

  return useMutation<
    Commitment,
    Error,
    { commitmentId: string; input: UpdateCommitmentInput }
  >({
    mutationFn: ({ commitmentId, input }) => updateCommitment(commitmentId, input),
    onSuccess: (data) => {
      // Update the specific commitment in cache
      queryClient.setQueryData(commitmentKeys.detail(data.id), data);
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: commitmentKeys.lists() });
      toast.success(t('success.updated'));
    },
    onError: (error) => {
      toast.error(t('errors.updateFailed'));
      console.error('Update commitment error:', error);
    },
  });
}

// ============================================================================
// Status Update Mutation Hook (with Optimistic Updates)
// ============================================================================

interface UpdateStatusInput {
  id: string;
  status: CommitmentStatus;
  notes?: string;
}

/**
 * Hook to update commitment status with optimistic updates
 *
 * Features:
 * - Immediate UI update before server response
 * - Automatic rollback on error
 * - Toast notifications
 *
 * @returns TanStack Mutation result
 */
export function useUpdateCommitmentStatus() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('commitments');

  return useMutation<Commitment, Error, UpdateStatusInput, { previous: unknown }>({
    mutationFn: (input) => updateCommitmentStatus(input),

    onMutate: async (input) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: commitmentKeys.lists() });

      // Snapshot the previous value
      const previous = queryClient.getQueryData(commitmentKeys.lists());

      // Optimistically update the list cache
      queryClient.setQueriesData<CommitmentsListResponse>(
        { queryKey: commitmentKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            commitments: old.commitments.map((c) =>
              c.id === input.id
                ? { ...c, status: input.status, status_changed_at: new Date().toISOString() }
                : c
            ),
          };
        }
      );

      // Also update infinite query data if present
      queryClient.setQueriesData<InfiniteData<CommitmentsListResponse>>(
        { queryKey: commitmentKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              commitments: page.commitments.map((c) =>
                c.id === input.id
                  ? { ...c, status: input.status, status_changed_at: new Date().toISOString() }
                  : c
              ),
            })),
          };
        }
      );

      return { previous };
    },

    onError: (error, _input, context) => {
      // Rollback to previous value on error
      if (context?.previous) {
        queryClient.setQueryData(commitmentKeys.lists(), context.previous);
      }

      // Show appropriate error message
      if (error.message.includes('INVALID_STATUS_TRANSITION')) {
        toast.error(t('errors.invalidTransition'));
      } else {
        toast.error(t('errors.statusUpdateFailed'));
      }
      console.error('Status update error:', error);
    },

    onSuccess: (data) => {
      // Update the specific commitment detail
      queryClient.setQueryData(commitmentKeys.detail(data.id), data);
      // Invalidate history to refresh
      queryClient.invalidateQueries({ queryKey: commitmentKeys.history(data.id) });
      toast.success(t('status.updated'));
    },

    onSettled: () => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: commitmentKeys.lists() });
    },
  });
}

// ============================================================================
// Cancel Mutation Hook
// ============================================================================

interface CancelInput {
  id: string;
  reason: string;
}

/**
 * Hook to cancel a commitment
 *
 * @returns TanStack Mutation result
 */
export function useCancelCommitment() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('commitments');

  return useMutation<Commitment, Error, CancelInput>({
    mutationFn: (input) => cancelCommitment(input),
    onSuccess: (data) => {
      queryClient.setQueryData(commitmentKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: commitmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: commitmentKeys.history(data.id) });
      toast.success(t('success.deleted'));
    },
    onError: (error) => {
      toast.error(t('errors.deleteFailed'));
      console.error('Cancel commitment error:', error);
    },
  });
}

// ============================================================================
// Evidence Upload Mutation Hook
// ============================================================================

interface UploadEvidenceInput {
  commitmentId: string;
  file: File;
}

/**
 * Hook to upload evidence for a commitment
 *
 * @returns TanStack Mutation result
 */
export function useUploadEvidence() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('commitments');

  return useMutation<
    { proof_url: string; evidence_submitted_at: string },
    Error,
    UploadEvidenceInput
  >({
    mutationFn: ({ commitmentId, file }) => uploadEvidence(commitmentId, file),
    onSuccess: (_data, variables) => {
      // Invalidate the specific commitment to refresh
      queryClient.invalidateQueries({
        queryKey: commitmentKeys.detail(variables.commitmentId),
      });
      queryClient.invalidateQueries({ queryKey: commitmentKeys.lists() });
      toast.success(t('evidence.uploadSuccess'));
    },
    onError: (error) => {
      toast.error(t('evidence.uploadFailed'));
      console.error('Evidence upload error:', error);
    },
  });
}
