/**
 * useProgressiveDisclosure Hook
 *
 * Manages progressive hint disclosure based on user experience level,
 * tracks interactions to avoid repetition, and adapts content based
 * on user progress.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { v4 as uuidv4 } from 'uuid'
import type {
  ProgressiveDisclosureState,
  HintInteraction,
  DisclosurePreferences,
  SessionHintTracking,
  HintContextType,
  HintInteractionStatus,
  ShouldShowHintResult,
  HintDefinition,
  UserExperienceLevel,
} from '@/types/progressive-disclosure.types'

// Query keys
const DISCLOSURE_QUERY_KEY = ['progressive-disclosure']
const INTERACTIONS_QUERY_KEY = ['hint-interactions']

// Local storage keys
const LOCAL_STORAGE_KEY = 'intl-dossier-disclosure-prefs'
const SESSION_STORAGE_KEY = 'intl-dossier-session-hints'

// Session ID storage key
const SESSION_ID_KEY = 'intl-dossier-session-id'

interface UseProgressiveDisclosureOptions {
  /** Page context for filtering hints */
  pageContext?: string
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean
  /** Whether to persist to localStorage as fallback */
  persistLocal?: boolean
  /** Whether to record visit on mount */
  recordVisit?: boolean
}

interface UseProgressiveDisclosureReturn {
  // State
  preferences: DisclosurePreferences | null
  interactions: Record<string, HintInteraction>
  session: SessionHintTracking | null
  isLoading: boolean
  error: string | null
  experienceLevel: UserExperienceLevel
  sessionId: string

  // Computed values
  hintsEnabled: boolean
  totalVisits: number
  totalInteractions: number
  canShowHint: boolean
  hintsShownThisSession: number
  isFirstVisit: boolean
  hasInteractedBefore: boolean

  // Actions
  shouldShowHint: (hintId: string, hintContext?: HintContextType) => ShouldShowHintResult
  recordHintShown: (
    hintId: string,
    hintContext: HintContextType,
    pageContext?: string,
  ) => Promise<void>
  recordHintDismissed: (hintId: string) => Promise<void>
  recordHintExpanded: (hintId: string) => Promise<void>
  recordActionTaken: (hintId: string) => Promise<void>
  updatePreferences: (updates: Partial<DisclosurePreferences>) => Promise<void>
  toggleHints: (enabled: boolean) => Promise<void>
  resetAllInteractions: () => Promise<void>
  getHintsForContext: (pageContext: string, hintContext?: HintContextType) => HintInteraction[]
  isHintDismissed: (hintId: string) => boolean
  getHintInteraction: (hintId: string) => HintInteraction | undefined
  refreshPreferences: () => Promise<void>
}

// Generate or retrieve session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY)
  if (!sessionId) {
    sessionId = uuidv4()
    sessionStorage.setItem(SESSION_ID_KEY, sessionId)
  }
  return sessionId
}

// Get local preferences fallback
function getLocalPreferences(): DisclosurePreferences | null {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Get local session fallback
function getLocalSession(): SessionHintTracking | null {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// API functions
async function fetchDisclosureData(): Promise<{
  preferences: DisclosurePreferences
  interactions: HintInteraction[]
  session: SessionHintTracking
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const sessionId = getSessionId()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/progressive-disclosure?sessionId=${sessionId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error('Failed to fetch disclosure data')
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch disclosure data')
  }

  return result.data
}

async function recordInteraction(
  hintId: string,
  hintContext: HintContextType,
  pageContext: string | undefined,
  status: HintInteractionStatus,
): Promise<HintInteraction> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const sessionId = getSessionId()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/progressive-disclosure/interaction`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        hintId,
        hintContext,
        pageContext,
        status,
        sessionId,
      }),
    },
  )

  if (!response.ok) {
    throw new Error('Failed to record interaction')
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Failed to record interaction')
  }

  return result.data
}

async function updatePreferencesApi(
  updates: Partial<DisclosurePreferences>,
): Promise<DisclosurePreferences> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/progressive-disclosure/preferences`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(updates),
    },
  )

  if (!response.ok) {
    throw new Error('Failed to update preferences')
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Failed to update preferences')
  }

  return result.data
}

async function recordVisitApi(): Promise<DisclosurePreferences> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/progressive-disclosure/visit`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error('Failed to record visit')
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Failed to record visit')
  }

  return result.data
}

export function useProgressiveDisclosure(
  options: UseProgressiveDisclosureOptions = {},
): UseProgressiveDisclosureReturn {
  const { pageContext, autoFetch = true, persistLocal = true, recordVisit = true } = options

  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const sessionId = useMemo(() => getSessionId(), [])
  const visitRecorded = useRef(false)

  // Local state for session tracking
  const [localSession, setLocalSession] = useState<SessionHintTracking | null>(() =>
    getLocalSession(),
  )

  // Query for fetching data
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: [...DISCLOSURE_QUERY_KEY, pageContext],
    queryFn: fetchDisclosureData,
    enabled: autoFetch && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  })

  const preferences = data?.preferences ?? getLocalPreferences()
  const interactions = useMemo(() => {
    const map: Record<string, HintInteraction> = {}
    ;(data?.interactions ?? []).forEach((i) => {
      map[i.hintId] = i
    })
    return map
  }, [data?.interactions])
  const session = data?.session ?? localSession

  // Record visit on mount
  useEffect(() => {
    if (recordVisit && isAuthenticated && !visitRecorded.current) {
      visitRecorded.current = true
      recordVisitApi().catch(console.error)
    }
  }, [recordVisit, isAuthenticated])

  // Persist to localStorage
  useEffect(() => {
    if (persistLocal && preferences) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferences))
      } catch {
        // Ignore
      }
    }
  }, [preferences, persistLocal])

  // Persist session to sessionStorage
  useEffect(() => {
    if (session) {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
        setLocalSession(session)
      } catch {
        // Ignore
      }
    }
  }, [session])

  // Computed values
  const hintsEnabled = preferences?.hintsEnabled ?? true
  const totalVisits = preferences?.totalVisits ?? 0
  const totalInteractions = preferences?.totalInteractions ?? 0
  const experienceLevel = preferences?.experienceLevel ?? 'beginner'
  const hintsShownThisSession = session?.hintsShown ?? 0
  const maxHintsPerSession = preferences?.maxHintsPerSession ?? 5
  const isFirstVisit = totalVisits <= 1
  const hasInteractedBefore = totalInteractions > 0

  const canShowHint = useMemo(() => {
    if (!hintsEnabled) return false
    if (hintsShownThisSession >= maxHintsPerSession) return false

    // Check cooldown
    if (session?.lastHintAt && preferences?.hintCooldownMinutes) {
      const lastHint = new Date(session.lastHintAt)
      const cooldownMs = preferences.hintCooldownMinutes * 60 * 1000
      if (Date.now() - lastHint.getTime() < cooldownMs) {
        return false
      }
    }

    return true
  }, [
    hintsEnabled,
    hintsShownThisSession,
    maxHintsPerSession,
    session?.lastHintAt,
    preferences?.hintCooldownMinutes,
  ])

  // Check if a specific hint should be shown
  const shouldShowHint = useCallback(
    (hintId: string, hintContext: HintContextType = 'empty_state'): ShouldShowHintResult => {
      // Check global settings
      if (!hintsEnabled) {
        return { shouldShow: false, reason: 'hidden_disabled' }
      }

      // Check session limits
      if (hintsShownThisSession >= maxHintsPerSession) {
        return { shouldShow: false, reason: 'hidden_session_limit' }
      }

      // Check specific context settings
      if (hintContext === 'keyboard_shortcut' && !preferences?.showKeyboardShortcuts) {
        return { shouldShow: false, reason: 'hidden_disabled' }
      }

      if (hintContext === 'advanced_feature' && !preferences?.showAdvancedFeatures) {
        return { shouldShow: false, reason: 'hidden_experience_level' }
      }

      // Get existing interaction
      const interaction = interactions[hintId]

      // If never shown, show it
      if (!interaction) {
        return { shouldShow: true, reason: 'show_new' }
      }

      // Check status
      if (interaction.status === 'action_taken') {
        return {
          shouldShow: false,
          reason: 'hidden_action_taken',
          interaction,
        }
      }

      if (interaction.status === 'dismissed') {
        // Check if re-show time has passed
        if (interaction.shouldReshowAfter) {
          const reshowDate = new Date(interaction.shouldReshowAfter)
          if (Date.now() >= reshowDate.getTime()) {
            return { shouldShow: true, reason: 'show_reshow', interaction }
          }
        }
        return { shouldShow: false, reason: 'hidden_dismissed', interaction }
      }

      // Default: show for empty_state and first_interaction contexts
      return { shouldShow: true, reason: 'show_new', interaction }
    },
    [
      hintsEnabled,
      hintsShownThisSession,
      maxHintsPerSession,
      preferences?.showKeyboardShortcuts,
      preferences?.showAdvancedFeatures,
      interactions,
    ],
  )

  // Mutations
  const recordInteractionMutation = useMutation({
    mutationFn: ({
      hintId,
      hintContext,
      pageContext,
      status,
    }: {
      hintId: string
      hintContext: HintContextType
      pageContext?: string
      status: HintInteractionStatus
    }) => recordInteraction(hintId, hintContext, pageContext, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCLOSURE_QUERY_KEY })
    },
  })

  const updatePreferencesMutation = useMutation({
    mutationFn: (updates: Partial<DisclosurePreferences>) => updatePreferencesApi(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCLOSURE_QUERY_KEY })
    },
  })

  // Actions
  const recordHintShown = useCallback(
    async (hintId: string, hintContext: HintContextType, pageCtx?: string) => {
      await recordInteractionMutation.mutateAsync({
        hintId,
        hintContext,
        pageContext: pageCtx ?? pageContext,
        status: 'shown',
      })
    },
    [recordInteractionMutation, pageContext],
  )

  const recordHintDismissed = useCallback(
    async (hintId: string) => {
      const interaction = interactions[hintId]
      await recordInteractionMutation.mutateAsync({
        hintId,
        hintContext: interaction?.hintContext ?? 'empty_state',
        pageContext: interaction?.pageContext ?? pageContext,
        status: 'dismissed',
      })
    },
    [recordInteractionMutation, interactions, pageContext],
  )

  const recordHintExpanded = useCallback(
    async (hintId: string) => {
      const interaction = interactions[hintId]
      await recordInteractionMutation.mutateAsync({
        hintId,
        hintContext: interaction?.hintContext ?? 'empty_state',
        pageContext: interaction?.pageContext ?? pageContext,
        status: 'expanded',
      })
    },
    [recordInteractionMutation, interactions, pageContext],
  )

  const recordActionTaken = useCallback(
    async (hintId: string) => {
      const interaction = interactions[hintId]
      await recordInteractionMutation.mutateAsync({
        hintId,
        hintContext: interaction?.hintContext ?? 'empty_state',
        pageContext: interaction?.pageContext ?? pageContext,
        status: 'action_taken',
      })
    },
    [recordInteractionMutation, interactions, pageContext],
  )

  const updatePreferences = useCallback(
    async (updates: Partial<DisclosurePreferences>) => {
      await updatePreferencesMutation.mutateAsync(updates)
    },
    [updatePreferencesMutation],
  )

  const toggleHints = useCallback(
    async (enabled: boolean) => {
      await updatePreferences({ hintsEnabled: enabled })
    },
    [updatePreferences],
  )

  const resetAllInteractions = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/progressive-disclosure/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    queryClient.invalidateQueries({ queryKey: DISCLOSURE_QUERY_KEY })
  }, [queryClient])

  const getHintsForContext = useCallback(
    (pageCtx: string, hintContext?: HintContextType): HintInteraction[] => {
      return Object.values(interactions).filter((i) => {
        if (i.pageContext !== pageCtx) return false
        if (hintContext && i.hintContext !== hintContext) return false
        return true
      })
    },
    [interactions],
  )

  const isHintDismissed = useCallback(
    (hintId: string): boolean => {
      const interaction = interactions[hintId]
      if (!interaction) return false
      if (interaction.status !== 'dismissed') return false

      // Check if re-show time has passed
      if (interaction.shouldReshowAfter) {
        const reshowDate = new Date(interaction.shouldReshowAfter)
        if (Date.now() >= reshowDate.getTime()) {
          return false // Time to re-show
        }
      }

      return true
    },
    [interactions],
  )

  const getHintInteraction = useCallback(
    (hintId: string): HintInteraction | undefined => {
      return interactions[hintId]
    },
    [interactions],
  )

  const refreshPreferences = useCallback(async () => {
    await refetch()
  }, [refetch])

  return {
    // State
    preferences,
    interactions,
    session,
    isLoading,
    error: queryError?.message ?? null,
    experienceLevel,
    sessionId,

    // Computed values
    hintsEnabled,
    totalVisits,
    totalInteractions,
    canShowHint,
    hintsShownThisSession,
    isFirstVisit,
    hasInteractedBefore,

    // Actions
    shouldShowHint,
    recordHintShown,
    recordHintDismissed,
    recordHintExpanded,
    recordActionTaken,
    updatePreferences,
    toggleHints,
    resetAllInteractions,
    getHintsForContext,
    isHintDismissed,
    getHintInteraction,
    refreshPreferences,
  }
}

export default useProgressiveDisclosure
