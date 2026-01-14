/**
 * Duplicate Detection Hook
 * Feature: entity-duplicate-detection
 *
 * React Query hooks for duplicate detection and entity merging
 */

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  DuplicateCandidate,
  DuplicateCandidateListItem,
  DuplicateCandidatesListParams,
  DuplicateCandidatesListResponse,
  DuplicateDetectionSettings,
  DuplicateEntityType,
  DuplicateSearchResponse,
  DuplicateScanRequest,
  DuplicateScanResponse,
  FieldResolution,
  MergeHistoryRecord,
  MergeResponse,
  SettingsUpdateRequest,
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

// API base URL
const API_BASE = '/functions/v1/entity-duplicates'

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

      const { data, error } = await supabase.functions.invoke('entity-duplicates', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: null,
      })

      // Since functions.invoke doesn't support query params well, use RPC directly
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
 * Hook for infinite scroll of duplicate candidates
 */
export function useDuplicateCandidatesInfinite(
  params: Omit<DuplicateCandidatesListParams, 'offset'> = {},
) {
  const pageSize = params.limit || 20

  return useInfiniteQuery({
    queryKey: [...duplicateKeys.candidates(), 'infinite', params],
    queryFn: async ({ pageParam = 0 }): Promise<DuplicateCandidatesListResponse> => {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_pending_duplicates', {
        p_entity_type: params.entity_type || null,
        p_confidence_level: params.confidence_level || null,
        p_limit: pageSize,
        p_offset: pageParam,
      })

      if (rpcError) throw new Error(rpcError.message)

      return {
        data: rpcData || [],
        pagination: {
          total: 0,
          limit: pageSize,
          offset: pageParam,
          has_more: (rpcData?.length || 0) === pageSize,
        },
      }
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_more
        ? lastPage.pagination.offset + lastPage.pagination.limit
        : undefined,
    initialPageParam: 0,
    staleTime: 30000,
  })
}

/**
 * Hook to get a single duplicate candidate with entity details
 */
export function useDuplicateCandidate(id: string | undefined) {
  return useQuery({
    queryKey: duplicateKeys.candidate(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Candidate ID is required')

      const { data, error } = await supabase
        .from('entity_duplicate_candidates')
        .select(
          `
          *,
          source_dossier:dossiers!source_entity_id(id, name_en, name_ar, type, status),
          target_dossier:dossiers!target_entity_id(id, name_en, name_ar, type, status)
        `,
        )
        .eq('id', id)
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Hook to search for duplicates of a specific entity
 */
export function useDuplicateSearch(
  entityId: string | undefined,
  entityType: DuplicateEntityType,
  options?: { threshold?: number; limit?: number; enabled?: boolean },
) {
  return useQuery({
    queryKey: duplicateKeys.search(entityId || '', entityType),
    queryFn: async (): Promise<DuplicateSearchResponse> => {
      if (!entityId) throw new Error('Entity ID is required')

      const rpcName =
        entityType === 'person' ? 'find_duplicate_persons' : 'find_duplicate_organizations'
      const paramName = entityType === 'person' ? 'p_person_id' : 'p_org_id'

      const { data, error } = await supabase.rpc(rpcName, {
        [paramName]: entityId,
        p_threshold: options?.threshold || 0.6,
        p_limit: options?.limit || 10,
      })

      if (error) throw new Error(error.message)

      return {
        entity_id: entityId,
        entity_type: entityType,
        candidates: data || [],
      }
    },
    enabled: !!entityId && options?.enabled !== false,
    staleTime: 60000, // 1 minute
  })
}

/**
 * Hook to get merge history for an entity
 */
export function useMergeHistory(entityId: string | undefined) {
  return useQuery({
    queryKey: duplicateKeys.history(entityId || ''),
    queryFn: async (): Promise<MergeHistoryRecord[]> => {
      if (!entityId) throw new Error('Entity ID is required')

      const { data, error } = await supabase.rpc('get_entity_merge_history', {
        p_entity_id: entityId,
      })

      if (error) throw new Error(error.message)
      return data || []
    },
    enabled: !!entityId,
  })
}

/**
 * Hook to get duplicate detection settings
 */
export function useDuplicateSettings() {
  return useQuery({
    queryKey: duplicateKeys.settings(),
    queryFn: async (): Promise<DuplicateDetectionSettings[]> => {
      const { data, error } = await supabase
        .from('duplicate_detection_settings')
        .select('*')
        .order('entity_type')

      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: 300000, // 5 minutes
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
      queryClient.invalidateQueries({ queryKey: duplicateKeys.candidates() })
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
      queryClient.invalidateQueries({ queryKey: duplicateKeys.candidates() })
      if (data.candidate_id) {
        queryClient.invalidateQueries({
          queryKey: duplicateKeys.candidate(data.candidate_id),
        })
      }
      queryClient.invalidateQueries({
        queryKey: duplicateKeys.history(data.primary_entity_id),
      })
      // Also invalidate entity queries
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
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
      queryClient.invalidateQueries({ queryKey: duplicateKeys.candidates() })
      queryClient.invalidateQueries({
        queryKey: duplicateKeys.candidate(data.candidate_id),
      })
    },
  })
}

/**
 * Hook to update duplicate detection settings
 */
export function useUpdateDuplicateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      entityType,
      settings,
    }: {
      entityType: DuplicateEntityType
      settings: SettingsUpdateRequest
    }): Promise<DuplicateDetectionSettings> => {
      const { data, error } = await supabase
        .from('duplicate_detection_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('entity_type', entityType)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: duplicateKeys.settings() })
    },
  })
}

/**
 * Hook to check for duplicates when creating an entity
 */
export function useCheckDuplicatesOnCreate(entityType: DuplicateEntityType) {
  return useMutation({
    mutationFn: async ({
      name_en,
      name_ar,
      email,
      phone,
    }: {
      name_en: string
      name_ar?: string
      email?: string
      phone?: string
    }) => {
      // Use direct SQL for pre-creation check
      // This searches by name similarity without needing an existing ID
      const { data, error } = await supabase
        .from('dossiers')
        .select(
          `
          id,
          name_en,
          name_ar,
          type,
          status
        `,
        )
        .eq('type', entityType)
        .neq('status', 'archived')
        .or(`name_en.ilike.%${name_en}%,name_ar.ilike.%${name_ar || name_en}%`)
        .limit(5)

      if (error) throw new Error(error.message)

      // For each potential match, calculate a rough similarity score
      const candidates = (data || []).map((entity) => {
        const nameSim = calculateSimpleSimilarity(
          name_en.toLowerCase(),
          entity.name_en.toLowerCase(),
        )
        const nameArSim = name_ar ? calculateSimpleSimilarity(name_ar, entity.name_ar || '') : 0

        return {
          ...entity,
          overall_score: Math.max(nameSim, nameArSim),
          name_similarity: nameSim,
          name_ar_similarity: nameArSim,
        }
      })

      // Filter and sort by score
      return candidates
        .filter((c) => c.overall_score >= 0.5)
        .sort((a, b) => b.overall_score - a.overall_score)
    },
  })
}

/**
 * Simple string similarity calculation (Dice coefficient approximation)
 * Used for client-side pre-check before entity creation
 */
function calculateSimpleSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0
  if (str1 === str2) return 1

  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1 === s2) return 1

  // Create bigrams
  const getBigrams = (str: string): Set<string> => {
    const bigrams = new Set<string>()
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2))
    }
    return bigrams
  }

  const bigrams1 = getBigrams(s1)
  const bigrams2 = getBigrams(s2)

  // Calculate intersection
  let intersection = 0
  bigrams1.forEach((bigram) => {
    if (bigrams2.has(bigram)) intersection++
  })

  // Dice coefficient
  return (2 * intersection) / (bigrams1.size + bigrams2.size)
}

export default {
  useDuplicateCandidates,
  useDuplicateCandidatesInfinite,
  useDuplicateCandidate,
  useDuplicateSearch,
  useMergeHistory,
  useDuplicateSettings,
  useDuplicateScan,
  useMergeDuplicates,
  useDismissDuplicate,
  useUpdateDuplicateSettings,
  useCheckDuplicatesOnCreate,
}
