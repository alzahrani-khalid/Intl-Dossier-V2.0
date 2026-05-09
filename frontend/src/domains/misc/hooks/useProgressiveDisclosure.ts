/**
 * Progressive Disclosure Hook
 * @module domains/misc/hooks/useProgressiveDisclosure
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getDisclosureState,
  updateDisclosureState as updateDisclosureStateApi,
  getFeatureGates,
  unlockFeature as unlockFeatureApi,
  getUserProgress,
  recordInteraction as recordInteractionApi,
} from '../repositories/misc.repository'

export const disclosureKeys = {
  all: ['progressive-disclosure'] as const,
  state: (params?: Record<string, unknown>) => [...disclosureKeys.all, 'state', params] as const,
  gates: () => [...disclosureKeys.all, 'gates'] as const,
  progress: () => [...disclosureKeys.all, 'progress'] as const,
}

export function useProgressiveDisclosure(params?: { featureArea?: string; enabled?: boolean }) {
  const searchParams = new URLSearchParams()
  if (params?.featureArea) searchParams.set('feature_area', params.featureArea)

  return useQuery({
    queryKey: disclosureKeys.state(params),
    queryFn: () => getDisclosureState(searchParams),
    enabled: params?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateDisclosureState() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => updateDisclosureStateApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: disclosureKeys.all })
    },
  })
}

export function useFeatureGates() {
  return useQuery({
    queryKey: disclosureKeys.gates(),
    queryFn: () => getFeatureGates(),
    staleTime: 10 * 60 * 1000,
  })
}

export function useUnlockFeature() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => unlockFeatureApi(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: disclosureKeys.all })
    },
  })
}

export function useUserProgress() {
  return useQuery({
    queryKey: disclosureKeys.progress(),
    queryFn: () => getUserProgress(),
    staleTime: 60 * 1000,
  })
}

export function useRecordInteraction() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => recordInteractionApi(data),
  })
}
