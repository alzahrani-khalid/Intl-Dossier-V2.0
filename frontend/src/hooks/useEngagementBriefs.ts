/**
 * Engagement Briefs Management Hooks
 * @module hooks/useEngagementBriefs
 * @feature engagement-brief-linking
 * @feature 033-ai-brief-generation
 *
 * TanStack Query hooks for managing briefs linked to engagement dossiers with automatic
 * caching, AI brief generation, and context gathering.
 *
 * @description
 * This module provides comprehensive React hooks for engagement brief management:
 * - Query hooks for fetching lists of briefs and brief generation context
 * - Mutation hooks for generating AI briefs with fallback to manual templates
 * - Link/unlink operations for managing brief-engagement relationships
 * - Support for both legacy briefs and AI-generated briefs
 * - Automatic toast notifications for all mutation operations
 * - Context gathering for AI brief generation (participants, agenda, positions, etc.)
 *
 * All hooks use Supabase Edge Functions for server-side AI integration.
 *
 * @example
 * // Fetch briefs for an engagement
 * const { data } = useEngagementBriefs('engagement-uuid', {
 *   type: 'ai',
 *   status: 'completed',
 *   limit: 10,
 * });
 *
 * @example
 * // Get context for brief generation
 * const { data: context } = useEngagementBriefContext('engagement-uuid');
 * // context includes participants, agenda, positions, commitments, etc.
 *
 * @example
 * // Generate an AI brief
 * const { mutate } = useGenerateEngagementBrief();
 * mutate({
 *   engagementId: 'engagement-uuid',
 *   language: 'en',
 *   custom_prompt: 'Focus on bilateral relations',
 * });
 *
 * @example
 * // Link existing brief to engagement
 * const { mutate } = useLinkBriefToEngagement();
 * mutate({
 *   engagementId: 'engagement-uuid',
 *   briefId: 'brief-uuid',
 *   brief_type: 'legacy',
 * });
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

// ============================================================================
// Types
// ============================================================================

export type BriefType = 'legacy' | 'ai'
export type BriefStatus = 'completed' | 'generating' | 'failed'

export interface EngagementBrief {
  id: string
  brief_type: BriefType
  title: string
  summary: string
  status: BriefStatus
  source: 'ai' | 'manual'
  created_at: string
  completed_at?: string
  created_by: string
  has_citations: boolean
}

export interface EngagementBriefsListResponse {
  data: EngagementBrief[]
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
}

export interface BriefGenerationContext {
  engagement: {
    id: string
    name_en: string
    name_ar: string
    engagement_type: string
    engagement_category: string
    start_date: string
    end_date: string
    objectives_en?: string
    objectives_ar?: string
  }
  participants: Array<{
    id: string
    role: string
    participant_type: string
    name_en?: string
    name_ar?: string
    dossier_id?: string
    dossier_type?: string
  }>
  agenda: Array<{
    id: string
    order_number: number
    title_en: string
    title_ar?: string
    description_en?: string
    item_status: string
  }>
  host_country?: {
    id: string
    name_en: string
    name_ar: string
  }
  host_organization?: {
    id: string
    name_en: string
    name_ar: string
  }
  positions: Array<{
    id: string
    title_en: string
    title_ar?: string
    stance: string
    dossier_id: string
    dossier_name_en: string
  }>
  commitments: Array<{
    id: string
    title_en: string
    title_ar?: string
    status: string
    deadline?: string
    source_dossier_id: string
    source_name_en: string
  }>
  recent_interactions: Array<{
    id: string
    event_type: string
    event_title_en: string
    event_date: string
    dossier_id: string
    dossier_name_en: string
  }>
  previous_briefs_count: number
}

export interface GenerateBriefParams {
  engagementId: string
  custom_prompt?: string
  language?: 'en' | 'ar'
  date_range_start?: string
  date_range_end?: string
}

export interface LinkBriefParams {
  engagementId: string
  briefId: string
  brief_type: BriefType
}

export interface BriefsSearchParams {
  type?: 'all' | 'legacy' | 'ai'
  status?: BriefStatus
  limit?: number
  offset?: number
}

// ============================================================================
// API Base URL
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

// ============================================================================
// Auth Helper
// ============================================================================

/**
 * Helper function to get authenticated headers for Edge Function requests
 *
 * @description
 * Retrieves the current Supabase session and constructs headers with
 * the access token for authenticated API requests to Edge Functions.
 *
 * @returns {Promise<Object>} Headers object with Content-Type and Authorization
 * @private
 */
const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }
}

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query Keys Factory for engagement brief-related queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation for brief lists
 * and brief generation context.
 *
 * @example
 * // Invalidate all brief queries
 * queryClient.invalidateQueries({ queryKey: engagementBriefKeys.all });
 *
 * @example
 * // Invalidate briefs for a specific engagement
 * queryClient.invalidateQueries({ queryKey: engagementBriefKeys.list('uuid') });
 *
 * @example
 * // Invalidate brief generation context
 * queryClient.invalidateQueries({ queryKey: engagementBriefKeys.context('uuid') });
 */
export const engagementBriefKeys = {
  all: ['engagement-briefs'] as const,
  lists: () => [...engagementBriefKeys.all, 'list'] as const,
  list: (engagementId: string, params?: BriefsSearchParams) =>
    [...engagementBriefKeys.lists(), engagementId, params] as const,
  contexts: () => [...engagementBriefKeys.all, 'context'] as const,
  context: (engagementId: string) => [...engagementBriefKeys.contexts(), engagementId] as const,
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to list briefs for an engagement dossier
 *
 * @description
 * Fetches a paginated list of briefs linked to a specific engagement, with optional
 * filtering by brief type (legacy/AI), status (completed/generating/failed), and pagination.
 * Results are cached and automatically refreshed when brief mutations occur.
 *
 * @param {string} engagementId - The UUID of the engagement
 * @param {BriefsSearchParams} [params] - Optional search and filter parameters
 * @param {string} [params.type] - Filter by brief type: 'all', 'legacy', or 'ai'
 * @param {BriefStatus} [params.status] - Filter by status: 'completed', 'generating', or 'failed'
 * @param {number} [params.limit] - Number of items per page (defaults to 20)
 * @param {number} [params.offset] - Offset for pagination (defaults to 0)
 * @param {UseQueryOptions} [options] - Additional TanStack Query options
 * @returns {UseQueryResult<EngagementBriefsListResponse>} TanStack Query result with briefs array and pagination
 *
 * @example
 * // Fetch all briefs
 * const { data } = useEngagementBriefs('engagement-uuid');
 *
 * @example
 * // Fetch only AI briefs with pagination
 * const { data } = useEngagementBriefs('engagement-uuid', {
 *   type: 'ai',
 *   status: 'completed',
 *   limit: 10,
 *   offset: 0,
 * });
 */
export function useEngagementBriefs(
  engagementId: string,
  params?: BriefsSearchParams,
  options?: Omit<UseQueryOptions<EngagementBriefsListResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: engagementBriefKeys.list(engagementId, params),
    queryFn: async (): Promise<EngagementBriefsListResponse> => {
      const headers = await getAuthHeaders()
      const searchParams = new URLSearchParams()

      if (params?.type) searchParams.set('type', params.type)
      if (params?.status) searchParams.set('status', params.status)
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.offset) searchParams.set('offset', String(params.offset))

      const response = await fetch(
        `${API_BASE_URL}/engagement-briefs/${engagementId}?${searchParams}`,
        { headers },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch briefs')
      }

      return response.json()
    },
    enabled: !!engagementId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  })
}

/**
 * Hook to get brief generation context for an engagement
 *
 * @description
 * Fetches comprehensive context data for AI brief generation including engagement details,
 * participants, agenda items, positions, commitments, recent interactions, and previous brief count.
 * This context is used by the AI to generate informed, comprehensive briefing documents.
 *
 * @param {string} engagementId - The UUID of the engagement
 * @param {UseQueryOptions} [options] - Additional TanStack Query options
 * @returns {UseQueryResult<BriefGenerationContext>} TanStack Query result with context object
 *
 * @example
 * // Fetch brief generation context
 * const { data: context } = useEngagementBriefContext('engagement-uuid');
 * if (context) {
 *   console.log(context.participants); // Array of participants
 *   console.log(context.agenda); // Array of agenda items
 *   console.log(context.positions); // Related positions
 *   console.log(context.commitments); // Active commitments
 * }
 */
export function useEngagementBriefContext(
  engagementId: string,
  options?: Omit<UseQueryOptions<BriefGenerationContext, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: engagementBriefKeys.context(engagementId),
    queryFn: async (): Promise<BriefGenerationContext> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/engagement-briefs/${engagementId}/context`, {
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch brief context')
      }

      return response.json()
    },
    enabled: !!engagementId,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    ...options,
  })
}

/**
 * Hook to generate a new AI brief for an engagement
 *
 * @description
 * Generates a new AI-powered brief for an engagement using the AnythingLLM integration.
 * Gathers context from the engagement and generates a comprehensive briefing document.
 * If AI service is unavailable, returns a fallback response with manual template suggestion.
 * Displays success/warning/error toast notifications.
 *
 * @returns {UseMutationResult} TanStack Mutation result
 *
 * @example
 * // Generate AI brief
 * const { mutate, isPending } = useGenerateEngagementBrief();
 * mutate({
 *   engagementId: 'engagement-uuid',
 *   language: 'en',
 * });
 *
 * @example
 * // Generate with custom prompt
 * const { mutate } = useGenerateEngagementBrief();
 * mutate({
 *   engagementId: 'engagement-uuid',
 *   language: 'ar',
 *   custom_prompt: 'Focus on bilateral relations and trade agreements',
 *   date_range_start: '2024-01-01',
 *   date_range_end: '2024-12-31',
 * });
 */
export function useGenerateEngagementBrief() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('engagement-briefs')

  return useMutation({
    mutationFn: async (params: GenerateBriefParams) => {
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_BASE_URL}/engagement-briefs/${params.engagementId}/generate`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            custom_prompt: params.custom_prompt,
            language: params.language,
            date_range_start: params.date_range_start,
            date_range_end: params.date_range_end,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        // Check if it's a fallback response (AI unavailable)
        if (data.fallback) {
          return {
            success: false,
            fallback: data.fallback,
            error: data.error,
          }
        }
        throw new Error(data.error?.message_en || 'Failed to generate brief')
      }

      return { success: true, brief: data }
    },
    onSuccess: (data, params) => {
      if (data.success) {
        queryClient.invalidateQueries({
          queryKey: engagementBriefKeys.list(params.engagementId),
        })
        toast.success(t('messages.generated', 'Brief generated successfully'))
      } else {
        toast.warning(
          t('messages.aiUnavailable', 'AI unavailable. Use the template to create a manual brief.'),
        )
      }
    },
    onError: (error: Error) => {
      toast.error(t('messages.generateError', { error: error.message }))
    },
  })
}

/**
 * Hook to link an existing brief to an engagement
 *
 * @description
 * Links an existing brief (legacy or AI) to an engagement, creating a relationship
 * in the database. On success, invalidates brief list queries to reflect the change.
 *
 * @returns {UseMutationResult} TanStack Mutation result
 *
 * @example
 * // Link a legacy brief
 * const { mutate } = useLinkBriefToEngagement();
 * mutate({
 *   engagementId: 'engagement-uuid',
 *   briefId: 'brief-uuid',
 *   brief_type: 'legacy',
 * });
 */
export function useLinkBriefToEngagement() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('engagement-briefs')

  return useMutation({
    mutationFn: async (params: LinkBriefParams) => {
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_BASE_URL}/engagement-briefs/${params.engagementId}/link/${params.briefId}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ brief_type: params.brief_type }),
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to link brief')
      }

      return response.json()
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({
        queryKey: engagementBriefKeys.list(params.engagementId),
      })
      toast.success(t('messages.linked', 'Brief linked successfully'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.linkError', { error: error.message }))
    },
  })
}

/**
 * Hook to unlink a brief from an engagement
 *
 * @description
 * Removes the link between a brief and an engagement without deleting the brief itself.
 * On success, invalidates brief list queries to reflect the change.
 *
 * @returns {UseMutationResult} TanStack Mutation result
 *
 * @example
 * // Unlink a brief
 * const { mutate } = useUnlinkBriefFromEngagement();
 * mutate({
 *   engagementId: 'engagement-uuid',
 *   briefId: 'brief-uuid',
 *   brief_type: 'ai',
 * });
 */
export function useUnlinkBriefFromEngagement() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('engagement-briefs')

  return useMutation({
    mutationFn: async (params: LinkBriefParams) => {
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_BASE_URL}/engagement-briefs/${params.engagementId}/link/${params.briefId}?brief_type=${params.brief_type}`,
        {
          method: 'DELETE',
          headers,
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to unlink brief')
      }

      return response.json()
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({
        queryKey: engagementBriefKeys.list(params.engagementId),
      })
      toast.success(t('messages.unlinked', 'Brief unlinked successfully'))
    },
    onError: (error: Error) => {
      toast.error(t('messages.unlinkError', { error: error.message }))
    },
  })
}

/**
 * Hook to invalidate all engagement brief queries
 *
 * @description
 * Returns a function that invalidates brief queries either for a specific engagement
 * (including briefs list and context) or all brief queries across all engagements.
 * Useful for manual cache refresh after external operations.
 *
 * @returns {Function} Function to call with optional engagementId parameter
 *
 * @example
 * // Invalidate briefs for specific engagement
 * const invalidateBriefs = useInvalidateEngagementBriefs();
 * invalidateBriefs('engagement-uuid');
 *
 * @example
 * // Invalidate all brief queries
 * const invalidateBriefs = useInvalidateEngagementBriefs();
 * invalidateBriefs(); // No parameter invalidates everything
 */
export function useInvalidateEngagementBriefs() {
  const queryClient = useQueryClient()

  return (engagementId?: string) => {
    if (engagementId) {
      queryClient.invalidateQueries({
        queryKey: engagementBriefKeys.list(engagementId),
      })
      queryClient.invalidateQueries({
        queryKey: engagementBriefKeys.context(engagementId),
      })
    } else {
      queryClient.invalidateQueries({
        queryKey: engagementBriefKeys.all,
      })
    }
  }
}
