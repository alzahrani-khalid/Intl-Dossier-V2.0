/**
 * Onboarding Checklist Hook
 * @module domains/misc/hooks/useOnboardingChecklist
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  updateChecklistItem as updateChecklistItemApi,
  dismissOnboarding as dismissOnboardingApi,
  resetOnboarding as resetOnboardingApi,
} from '../repositories/misc.repository'
import type { RoleChecklist } from '@/types/onboarding.types'

export const onboardingKeys = {
  all: ['onboarding'] as const,
  checklist: () => [...onboardingKeys.all, 'checklist'] as const,
}

export interface OnboardingChecklistState {
  checklist: RoleChecklist | null
  isLoading: boolean
  completedCount: number
  totalCount: number
  completionPercentage: number
  estimatedTimeRemaining: number
  isFullyCompleted: boolean
  isDismissed: boolean
  completeItem: (itemId: string) => Promise<void>
  skipItem: (itemId: string) => Promise<void>
  dismissOnboarding: () => Promise<void>
  resumeOnboarding: () => Promise<void>
  resetProgress: () => Promise<void>
  isItemCompleted: (itemId: string) => boolean
  isItemSkipped: (itemId: string) => boolean
  isItemLocked: (itemId: string) => boolean
}

const NOOP_ONBOARDING_ASYNC = (): Promise<void> => Promise.resolve()

export function useOnboardingChecklist(_options?: { enabled?: boolean }): OnboardingChecklistState {
  return {
    checklist: null,
    isLoading: false,
    completedCount: 0,
    totalCount: 0,
    completionPercentage: 0,
    estimatedTimeRemaining: 0,
    isFullyCompleted: false,
    isDismissed: false,
    completeItem: NOOP_ONBOARDING_ASYNC,
    skipItem: NOOP_ONBOARDING_ASYNC,
    dismissOnboarding: NOOP_ONBOARDING_ASYNC,
    resumeOnboarding: NOOP_ONBOARDING_ASYNC,
    resetProgress: NOOP_ONBOARDING_ASYNC,
    isItemCompleted: () => false,
    isItemSkipped: () => false,
    isItemLocked: () => false,
  }
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { itemId: string; data: Record<string, unknown> }) =>
      updateChecklistItemApi(params.itemId, params.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: onboardingKeys.all })
    },
  })
}

export function useDismissOnboarding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => dismissOnboardingApi(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: onboardingKeys.all })
    },
  })
}

export function useResetOnboarding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => resetOnboardingApi(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: onboardingKeys.all })
    },
  })
}
