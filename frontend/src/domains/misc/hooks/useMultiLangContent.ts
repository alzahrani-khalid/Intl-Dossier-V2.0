/**
 * Multi-Language Content Hook
 * @module domains/misc/hooks/useMultiLangContent
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTranslations,
  saveTranslation as saveTranslationApi,
} from '../repositories/misc.repository'

export const multiLangKeys = {
  all: ['multi-lang'] as const,
  translations: (entityType: string, entityId: string) =>
    [...multiLangKeys.all, entityType, entityId] as const,
}

export function useMultiLangContent(entityType: string, entityId: string, params?: {
  language?: string
  enabled?: boolean
}): ReturnType<typeof useQuery> {
  const searchParams = new URLSearchParams()
  searchParams.set('entity_type', entityType)
  searchParams.set('entity_id', entityId)
  if (params?.language) searchParams.set('language', params.language)

  return useQuery({
    queryKey: multiLangKeys.translations(entityType, entityId),
    queryFn: () => getTranslations(searchParams),
    enabled: params?.enabled !== false && Boolean(entityType) && Boolean(entityId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSaveTranslation(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => saveTranslationApi(data),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: multiLangKeys.all }) },
  })
}
