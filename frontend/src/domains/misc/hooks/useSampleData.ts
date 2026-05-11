/**
 * Sample Data Hook
 * @module domains/misc/hooks/useSampleData
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getSampleDataSets,
  loadSampleData as loadSampleDataApi,
  clearSampleData as clearSampleDataApi,
  getSampleDataStatus,
} from '../repositories/misc.repository'
import type {
  SampleDataTemplate,
  SampleDataInstance,
  SampleDataStatus,
} from '@/types/sample-data.types'

export const sampleDataKeys = {
  all: ['sample-data'] as const,
  sets: () => [...sampleDataKeys.all, 'sets'] as const,
  status: () => [...sampleDataKeys.all, 'status'] as const,
}

export function useSampleDataSets() {
  return useQuery({
    queryKey: sampleDataKeys.sets(),
    queryFn: () => getSampleDataSets(),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}

export function useSampleDataStatus() {
  return useQuery({
    queryKey: sampleDataKeys.status(),
    queryFn: () => getSampleDataStatus(),
    staleTime: 30 * 1000,
    retry: 1,
  })
}

export function useLoadSampleData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => loadSampleDataApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sampleDataKeys.all })
    },
  })
}

export function useClearSampleData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => clearSampleDataApi(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sampleDataKeys.all })
    },
  })
}

interface UseSampleDataReturn {
  templates: SampleDataTemplate[]
  isLoadingTemplates: boolean
  hasSampleData: boolean
  activeInstances: SampleDataInstance[]
  populateSampleData: (templateSlug: string) => void
  isPopulating: boolean
  removeSampleData: () => void
  isRemoving: boolean
}

export function useSampleData(): UseSampleDataReturn {
  const setsQuery = useSampleDataSets()
  const statusQuery = useSampleDataStatus()
  const loadMutation = useLoadSampleData()
  const clearMutation = useClearSampleData()

  const setsResponse = setsQuery.data as
    | { templates?: SampleDataTemplate[] }
    | SampleDataTemplate[]
    | undefined
  const templates = Array.isArray(setsResponse) ? setsResponse : (setsResponse?.templates ?? [])
  const status = statusQuery.data as SampleDataStatus | undefined

  return {
    templates,
    isLoadingTemplates: setsQuery.isLoading,
    hasSampleData: status?.has_sample_data ?? false,
    activeInstances: status?.instances ?? [],
    populateSampleData: (templateSlug: string) =>
      loadMutation.mutate({ template_slug: templateSlug }),
    isPopulating: loadMutation.isPending,
    removeSampleData: () => clearMutation.mutate(),
    isRemoving: clearMutation.isPending,
  }
}
