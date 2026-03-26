/**
 * Onboarding Checklist Hook
 * @module domains/misc/hooks/useOnboardingChecklist
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getOnboardingChecklist,
  updateChecklistItem as updateChecklistItemApi,
  dismissOnboarding as dismissOnboardingApi,
  resetOnboarding as resetOnboardingApi,
} from '../repositories/misc.repository'

export const onboardingKeys = {
  all: ['onboarding'] as const,
  checklist: () => [...onboardingKeys.all, 'checklist'] as const,
}

export function useOnboardingChecklist(options?: { enabled?: boolean }): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: onboardingKeys.checklist(),
    queryFn: () => getOnboardingChecklist(),
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateChecklistItem(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { itemId: string; data: Record<string, unknown> }) =>
      updateChecklistItemApi(params.itemId, params.data),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: onboardingKeys.all }) },
  })
}

export function useDismissOnboarding(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => dismissOnboardingApi(),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: onboardingKeys.all }) },
  })
}

export function useResetOnboarding(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => resetOnboardingApi(),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: onboardingKeys.all }) },
  })
}
