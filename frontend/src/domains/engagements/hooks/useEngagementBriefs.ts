/**
 * Engagement Briefs Hook (Domain)
 * @module domains/engagements/hooks/useEngagementBriefs
 *
 * TanStack Query hooks for managing briefs linked to engagement dossiers.
 * Delegates API calls to engagements.repository.
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import * as engagementsRepo from '../repositories/engagements.repository'
import type {
  EngagementBriefsListResponse,
  BriefGenerationContext,
  GenerateBriefParams,
  LinkBriefParams,
  BriefsSearchParams,
  BriefType,
  BriefStatus,
  EngagementBrief,
} from '../types'

// Re-export types for backward compatibility
export type { BriefType, BriefStatus, EngagementBrief, EngagementBriefsListResponse, BriefGenerationContext, GenerateBriefParams, LinkBriefParams, BriefsSearchParams }

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

export function useEngagementBriefs(
  engagementId: string,
  params?: BriefsSearchParams,
  options?: Omit<UseQueryOptions<EngagementBriefsListResponse, Error>, 'queryKey' | 'queryFn'>,
): ReturnType<typeof useQuery<EngagementBriefsListResponse, Error>> {
  return useQuery({
    queryKey: engagementBriefKeys.list(engagementId, params),
    queryFn: async (): Promise<EngagementBriefsListResponse> => {
      return engagementsRepo.getEngagementBriefs(engagementId, params)
    },
    enabled: !!engagementId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  })
}

export function useEngagementBriefContext(
  engagementId: string,
  options?: Omit<UseQueryOptions<BriefGenerationContext, Error>, 'queryKey' | 'queryFn'>,
): ReturnType<typeof useQuery<BriefGenerationContext, Error>> {
  return useQuery({
    queryKey: engagementBriefKeys.context(engagementId),
    queryFn: async (): Promise<BriefGenerationContext> => {
      return engagementsRepo.getEngagementBriefContext(engagementId)
    },
    enabled: !!engagementId,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    ...options,
  })
}

export function useGenerateEngagementBrief() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('engagement-briefs')

  return useMutation({
    mutationFn: async (params: GenerateBriefParams) => {
      const data = await engagementsRepo.generateEngagementBrief(params)
      return { success: true, brief: data }
    },
    onSuccess: (data, params) => {
      if (data.success) {
        queryClient.invalidateQueries({
          queryKey: engagementBriefKeys.list(params.engagementId),
        })
        toast.success(t('messages.generated', 'Brief generated successfully'))
      }
    },
    onError: (error: Error) => {
      toast.error(t('messages.generateError', { error: error.message }))
    },
  })
}

export function useLinkBriefToEngagement() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('engagement-briefs')

  return useMutation({
    mutationFn: async (params: LinkBriefParams) => {
      return engagementsRepo.linkBriefToEngagement(params)
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

export function useUnlinkBriefFromEngagement() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('engagement-briefs')

  return useMutation({
    mutationFn: async (params: LinkBriefParams) => {
      return engagementsRepo.unlinkBriefFromEngagement(params)
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

export function useInvalidateEngagementBriefs(): (engagementId?: string) => void {
  const queryClient = useQueryClient()

  return (engagementId?: string) => {
    if (engagementId) {
      queryClient.invalidateQueries({ queryKey: engagementBriefKeys.list(engagementId) })
      queryClient.invalidateQueries({ queryKey: engagementBriefKeys.context(engagementId) })
    } else {
      queryClient.invalidateQueries({ queryKey: engagementBriefKeys.all })
    }
  }
}
