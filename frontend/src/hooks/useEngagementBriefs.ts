/**
 * Engagement Briefs Hooks
 * Feature: engagement-brief-linking
 *
 * TanStack Query hooks for managing briefs linked to engagement dossiers:
 * - List briefs for an engagement
 * - Generate AI briefs with context gathering
 * - Link/unlink existing briefs
 * - Get brief generation context
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
