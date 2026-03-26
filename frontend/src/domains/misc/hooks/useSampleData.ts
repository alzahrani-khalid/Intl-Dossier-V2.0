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

export const sampleDataKeys = {
  all: ['sample-data'] as const,
  sets: () => [...sampleDataKeys.all, 'sets'] as const,
  status: () => [...sampleDataKeys.all, 'status'] as const,
}

export function useSampleDataSets(): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: sampleDataKeys.sets(),
    queryFn: () => getSampleDataSets(),
    staleTime: 10 * 60 * 1000,
  })
}

export function useSampleDataStatus(): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: sampleDataKeys.status(),
    queryFn: () => getSampleDataStatus(),
    staleTime: 30 * 1000,
  })
}

export function useLoadSampleData(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => loadSampleDataApi(data),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: sampleDataKeys.all }) },
  })
}

export function useClearSampleData(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => clearSampleDataApi(),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: sampleDataKeys.all }) },
  })
}
