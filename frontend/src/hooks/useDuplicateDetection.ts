/**
 * Duplicate Detection Hook
 * Feature: entity-duplicate-detection
 *
 * React Query hooks for duplicate detection and entity merging
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  DuplicateCandidatesListParams,
  DuplicateCandidatesListResponse,
  DuplicateEntityType,
  DuplicateScanRequest,
  DuplicateScanResponse,
  FieldResolution,
  MergeResponse,
} from '@/types/duplicate-detection.types'

// Query keys
export const duplicateKeys = {
  all: ['duplicates'] as const,
  candidates: () => [...duplicateKeys.all, 'candidates'] as const,
  candidatesList: (params: DuplicateCandidatesListParams) =>
    [...duplicateKeys.candidates(), params] as const,
  candidate: (id: string) => [...duplicateKeys.candidates(), id] as const,
  search: (entityId: string, type: DuplicateEntityType) =>
    [...duplicateKeys.all, 'search', entityId, type] as const,
  history: (entityId: string) => [...duplicateKeys.all, 'history', entityId] as const,
  settings: () => [...duplicateKeys.all, 'settings'] as const,
}

/**
 * Hook to list pending duplicate candidates
 */
export function useDuplicateCandidates(params: DuplicateCandidatesListParams = {}) {
  return useQuery({
    queryKey: duplicateKeys.candidatesList(params),
    queryFn: async (): Promise<DuplicateCandidatesListResponse> => {
      const searchParams = new URLSearchParams()
      if (params.entity_type) searchParams.append('entity_type', params.entity_type)
      if (params.confidence_level) searchParams.append('confidence_level', params.confidence_level)
      if (params.status) searchParams.append('status', params.status)
      if (params.limit) searchParams.append('limit', params.limit.toString())
      if (params.offset) searchParams.append('offset', params.offset.toString())

      // Use RPC directly (functions.invoke doesn't support query params well)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_pending_duplicates', {
        p_entity_type: params.entity_type || null,
        p_confidence_level: params.confidence_level || null,
        p_limit: params.limit || 50,
        p_offset: params.offset || 0,
      })

      if (rpcError) throw new Error(rpcError.message)

      // Get count
      let countQuery = supabase
        .from('entity_duplicate_candidates')
        .select('*', { count: 'exact', head: true })

      if (params.status) {
        countQuery = countQuery.eq('status', params.status || 'pending')
      }
      if (params.entity_type) {
        countQuery = countQuery.eq('entity_type', params.entity_type)
      }
      if (params.confidence_level) {
        countQuery = countQuery.eq('confidence_level', params.confidence_level)
      }

      const { count } = await countQuery

      return {
        data: rpcData || [],
        pagination: {
          total: count || 0,
          limit: params.limit || 50,
          offset: params.offset || 0,
          has_more: (rpcData?.length || 0) === (params.limit || 50),
        },
      }
    },
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to trigger duplicate scan
 */
export function useDuplicateScan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: DuplicateScanRequest): Promise<DuplicateScanResponse> => {
      const { data, error } = await supabase.rpc('scan_for_duplicates', {
        p_entity_type: request.entity_type,
        p_days_back: request.days_back || 90,
        p_batch_size: request.batch_size || 100,
      })

      if (error) throw new Error(error.message)

      return {
        success: true,
        candidates_found: data || 0,
        entity_type: request.entity_type,
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: duplicateKeys.candidates() })
    },
  })
}

/**
 * Hook to merge duplicate entities
 */
export function useMergeDuplicates() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      primaryId,
      duplicateId,
      entityType,
      fieldResolutions,
      candidateId,
    }: {
      primaryId: string
      duplicateId: string
      entityType: DuplicateEntityType
      fieldResolutions?: Record<string, FieldResolution>
      candidateId?: string
    }): Promise<MergeResponse> => {
      const rpcName =
        entityType === 'person' ? 'merge_duplicate_persons' : 'merge_duplicate_organizations'

      const { data, error } = await supabase.rpc(rpcName, {
        p_primary_id: primaryId,
        p_duplicate_id: duplicateId,
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_field_resolutions: fieldResolutions || {},
      })

      if (error) throw new Error(error.message)

      return {
        success: true,
        merge_id: data,
        candidate_id: candidateId,
        primary_entity_id: primaryId,
        merged_entity_id: duplicateId,
      }
    },
    onSuccess: (data) => {
      // Invalidate related queries
      void queryClient.invalidateQueries({ queryKey: duplicateKeys.candidates() })
      if (data.candidate_id) {
        void queryClient.invalidateQueries({
          queryKey: duplicateKeys.candidate(data.candidate_id),
        })
      }
      void queryClient.invalidateQueries({
        queryKey: duplicateKeys.history(data.primary_entity_id),
      })
      // Also invalidate entity queries
      void queryClient.invalidateQueries({ queryKey: ['persons'] })
      void queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })
}

/**
 * Hook to dismiss a duplicate candidate
 */
export function useDismissDuplicate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      candidateId,
      reason,
    }: {
      candidateId: string
      reason?: string
    }): Promise<{ success: boolean; candidate_id: string }> => {
      const { data, error } = await supabase.rpc('dismiss_duplicate_candidate', {
        p_candidate_id: candidateId,
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_reason: reason || null,
      })

      if (error) throw new Error(error.message)
      if (!data) throw new Error('Candidate not found or already resolved')

      return {
        success: true,
        candidate_id: candidateId,
      }
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: duplicateKeys.candidates() })
      void queryClient.invalidateQueries({
        queryKey: duplicateKeys.candidate(data.candidate_id),
      })
    },
  })
}
