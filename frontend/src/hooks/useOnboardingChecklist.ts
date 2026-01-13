/**
 * useOnboardingChecklist Hook
 *
 * Manages user onboarding progress with role-specific checklists,
 * milestone celebrations, and progress persistence.
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type {
  OnboardingProgress,
  OnboardingChecklistItem,
  RoleChecklist,
  MilestoneCelebration,
  MilestoneAchievement,
  ChecklistItemProgress,
  UserRole,
} from '@/types/onboarding.types'

// Query keys
const ONBOARDING_QUERY_KEY = ['onboarding-progress']

// Milestone celebration configurations
const MILESTONE_CELEBRATIONS: Record<number, MilestoneCelebration> = {
  25: {
    percentage: 25,
    titleKey: 'onboarding:milestones.celebration.25.title',
    messageKey: 'onboarding:milestones.celebration.25.message',
    animationType: 'sparkle',
    duration: 3000,
    badgeIcon: 'Zap',
  },
  50: {
    percentage: 50,
    titleKey: 'onboarding:milestones.celebration.50.title',
    messageKey: 'onboarding:milestones.celebration.50.message',
    animationType: 'confetti',
    duration: 4000,
    badgeIcon: 'Star',
  },
  75: {
    percentage: 75,
    titleKey: 'onboarding:milestones.celebration.75.title',
    messageKey: 'onboarding:milestones.celebration.75.message',
    animationType: 'fireworks',
    duration: 4000,
    badgeIcon: 'Trophy',
  },
  100: {
    percentage: 100,
    titleKey: 'onboarding:milestones.celebration.100.title',
    messageKey: 'onboarding:milestones.celebration.100.message',
    animationType: 'confetti',
    duration: 5000,
    badgeIcon: 'Award',
  },
}

// Fallback localStorage key for offline support
const LOCAL_STORAGE_KEY = 'intl-dossier-onboarding-progress'

interface UseOnboardingChecklistOptions {
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean
  /** Whether to persist to localStorage as fallback */
  persistLocal?: boolean
}

interface UseOnboardingChecklistReturn {
  // State
  progress: OnboardingProgress | null
  checklist: RoleChecklist | null
  isLoading: boolean
  error: string | null
  activeCelebration: MilestoneCelebration | null

  // Computed values
  completedCount: number
  totalCount: number
  completionPercentage: number
  requiredCompletedCount: number
  requiredTotalCount: number
  estimatedTimeRemaining: number
  nextItem: OnboardingChecklistItem | null
  isFullyCompleted: boolean
  isDismissed: boolean

  // Actions
  completeItem: (itemId: string) => Promise<void>
  skipItem: (itemId: string) => Promise<void>
  uncompleteItem: (itemId: string) => Promise<void>
  resetProgress: () => Promise<void>
  dismissOnboarding: () => Promise<void>
  resumeOnboarding: () => Promise<void>
  markCelebrationShown: (percentage: number) => Promise<void>
  triggerCelebration: (celebration: MilestoneCelebration) => void
  clearCelebration: () => void
  refreshProgress: () => Promise<void>
  isItemCompleted: (itemId: string) => boolean
  isItemSkipped: (itemId: string) => boolean
  isItemLocked: (itemId: string) => boolean
  getItemProgress: (itemId: string) => ChecklistItemProgress | undefined
}

async function fetchOnboardingProgress(): Promise<{
  progress: OnboardingProgress
  checklist: RoleChecklist
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarding-progress`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error('Failed to fetch onboarding progress')
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch onboarding progress')
  }

  return {
    progress: result.data.progress,
    checklist: result.data.checklist,
  }
}

async function updateItemProgress(
  itemId: string,
  action: 'complete' | 'skip' | 'uncomplete',
): Promise<OnboardingProgress> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarding-progress/item`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ itemId, action }),
    },
  )

  if (!response.ok) {
    throw new Error('Failed to update item progress')
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Failed to update item progress')
  }

  return result.data
}

async function postOnboardingAction(endpoint: string, body?: object): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarding-progress${endpoint}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to ${endpoint.replace('/', '')}`)
  }
}

export function useOnboardingChecklist(
  options: UseOnboardingChecklistOptions = {},
): UseOnboardingChecklistReturn {
  const { autoFetch = true, persistLocal = true } = options
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()

  // State for active celebration
  const [activeCelebration, setActiveCelebration] = useState<MilestoneCelebration | null>(null)

  // Query for fetching progress
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ONBOARDING_QUERY_KEY,
    queryFn: fetchOnboardingProgress,
    enabled: autoFetch && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  })

  const progress = data?.progress ?? null
  const checklist = data?.checklist ?? null

  // Persist to localStorage as fallback
  useEffect(() => {
    if (persistLocal && progress) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress))
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [progress, persistLocal])

  // Computed values
  const checklistItems = useMemo(() => {
    return checklist?.items ?? []
  }, [checklist])

  const completedCount = useMemo(() => {
    if (!progress?.items) return 0
    return Object.values(progress.items).filter((item) => item.isCompleted).length
  }, [progress?.items])

  const totalCount = checklistItems.length

  const completionPercentage = useMemo(() => {
    if (totalCount === 0) return 0
    return Math.round((completedCount / totalCount) * 100)
  }, [completedCount, totalCount])

  const requiredItems = useMemo(() => {
    return checklistItems.filter((item) => item.isRequired)
  }, [checklistItems])

  const requiredCompletedCount = useMemo(() => {
    if (!progress?.items) return 0
    return requiredItems.filter((item) => progress.items[item.id]?.isCompleted).length
  }, [progress?.items, requiredItems])

  const requiredTotalCount = requiredItems.length

  const estimatedTimeRemaining = useMemo(() => {
    return checklistItems
      .filter((item) => !progress?.items?.[item.id]?.isCompleted)
      .reduce((sum, item) => sum + (item.estimatedMinutes ?? 0), 0)
  }, [checklistItems, progress?.items])

  const nextItem = useMemo(() => {
    const incompleteItems = checklistItems
      .filter((item) => {
        const itemProgress = progress?.items?.[item.id]
        return !itemProgress?.isCompleted && !itemProgress?.wasSkipped
      })
      .filter((item) => {
        // Check prerequisites
        if (!item.prerequisites || item.prerequisites.length === 0) return true
        return item.prerequisites.every((prereqId) => progress?.items?.[prereqId]?.isCompleted)
      })
      .sort((a, b) => a.order - b.order)

    return incompleteItems[0] ?? null
  }, [checklistItems, progress?.items])

  const isFullyCompleted = progress?.isCompleted ?? false
  const isDismissed = progress?.isDismissed ?? false

  // Helper functions
  const isItemCompleted = useCallback(
    (itemId: string): boolean => {
      return progress?.items?.[itemId]?.isCompleted ?? false
    },
    [progress?.items],
  )

  const isItemSkipped = useCallback(
    (itemId: string): boolean => {
      return progress?.items?.[itemId]?.wasSkipped ?? false
    },
    [progress?.items],
  )

  const isItemLocked = useCallback(
    (itemId: string): boolean => {
      const item = checklistItems.find((i) => i.id === itemId)
      if (!item?.prerequisites || item.prerequisites.length === 0) return false
      return !item.prerequisites.every((prereqId) => progress?.items?.[prereqId]?.isCompleted)
    },
    [checklistItems, progress?.items],
  )

  const getItemProgress = useCallback(
    (itemId: string): ChecklistItemProgress | undefined => {
      return progress?.items?.[itemId]
    },
    [progress?.items],
  )

  // Check for new milestones
  const checkMilestones = useCallback(
    (newPercentage: number) => {
      const milestones = checklist?.milestones ?? [25, 50, 75, 100]
      const achievedMilestones = progress?.milestones ?? []

      for (const milestone of milestones) {
        if (newPercentage >= milestone) {
          const alreadyAchieved = achievedMilestones.some((m) => m.percentage === milestone)
          const celebrationShown = achievedMilestones.find(
            (m) => m.percentage === milestone,
          )?.celebrationShown

          if (!alreadyAchieved || !celebrationShown) {
            const celebration = MILESTONE_CELEBRATIONS[milestone]
            if (celebration) {
              setActiveCelebration(celebration)
              // Record milestone achievement
              postOnboardingAction('/milestone', { percentage: milestone }).catch(console.error)
              break
            }
          }
        }
      }
    },
    [checklist?.milestones, progress?.milestones],
  )

  // Mutations
  const completeItemMutation = useMutation({
    mutationFn: (itemId: string) => updateItemProgress(itemId, 'complete'),
    onSuccess: (_, itemId) => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY })
      // Calculate new percentage and check milestones
      const newCompletedCount = completedCount + 1
      const newPercentage = Math.round((newCompletedCount / totalCount) * 100)
      checkMilestones(newPercentage)
    },
  })

  const skipItemMutation = useMutation({
    mutationFn: (itemId: string) => updateItemProgress(itemId, 'skip'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY })
    },
  })

  const uncompleteItemMutation = useMutation({
    mutationFn: (itemId: string) => updateItemProgress(itemId, 'uncomplete'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY })
    },
  })

  const resetMutation = useMutation({
    mutationFn: () => postOnboardingAction('/reset'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY })
    },
  })

  const dismissMutation = useMutation({
    mutationFn: () => postOnboardingAction('/dismiss'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY })
    },
  })

  const resumeMutation = useMutation({
    mutationFn: () => postOnboardingAction('/resume'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY })
    },
  })

  const markCelebrationShownMutation = useMutation({
    mutationFn: (percentage: number) => postOnboardingAction('/celebration-shown', { percentage }),
  })

  // Actions
  const completeItem = useCallback(
    async (itemId: string) => {
      await completeItemMutation.mutateAsync(itemId)
    },
    [completeItemMutation],
  )

  const skipItem = useCallback(
    async (itemId: string) => {
      await skipItemMutation.mutateAsync(itemId)
    },
    [skipItemMutation],
  )

  const uncompleteItem = useCallback(
    async (itemId: string) => {
      await uncompleteItemMutation.mutateAsync(itemId)
    },
    [uncompleteItemMutation],
  )

  const resetProgress = useCallback(async () => {
    await resetMutation.mutateAsync()
  }, [resetMutation])

  const dismissOnboarding = useCallback(async () => {
    await dismissMutation.mutateAsync()
  }, [dismissMutation])

  const resumeOnboarding = useCallback(async () => {
    await resumeMutation.mutateAsync()
  }, [resumeMutation])

  const markCelebrationShown = useCallback(
    async (percentage: number) => {
      await markCelebrationShownMutation.mutateAsync(percentage)
      setActiveCelebration(null)
    },
    [markCelebrationShownMutation],
  )

  const triggerCelebration = useCallback((celebration: MilestoneCelebration) => {
    setActiveCelebration(celebration)
  }, [])

  const clearCelebration = useCallback(() => {
    setActiveCelebration(null)
  }, [])

  const refreshProgress = useCallback(async () => {
    await refetch()
  }, [refetch])

  return {
    // State
    progress,
    checklist,
    isLoading,
    error: queryError?.message ?? null,
    activeCelebration,

    // Computed values
    completedCount,
    totalCount,
    completionPercentage,
    requiredCompletedCount,
    requiredTotalCount,
    estimatedTimeRemaining,
    nextItem,
    isFullyCompleted,
    isDismissed,

    // Actions
    completeItem,
    skipItem,
    uncompleteItem,
    resetProgress,
    dismissOnboarding,
    resumeOnboarding,
    markCelebrationShown,
    triggerCelebration,
    clearCelebration,
    refreshProgress,
    isItemCompleted,
    isItemSkipped,
    isItemLocked,
    getItemProgress,
  }
}

export default useOnboardingChecklist
