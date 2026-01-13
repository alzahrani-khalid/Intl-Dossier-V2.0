/**
 * Tour Context & Provider
 *
 * Global state management for guided tours.
 * Persists tour progress in localStorage.
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import type { TourState, TourActions, TourContextValue, TourId, TourProgress } from './types'
import { getTour } from './tour-definitions'

// Storage key for persisting tour progress
const TOUR_STORAGE_KEY = 'intl-dossier-tour-progress'
const TOUR_ENABLED_KEY = 'intl-dossier-tours-enabled'
const TOUR_DISMISSED_KEY = 'intl-dossier-tours-dismissed'

// Initial state
const initialState: TourState = {
  activeTour: null,
  currentStepIndex: 0,
  isActive: false,
  progress: {} as Record<TourId, TourProgress>,
  toursEnabled: true,
}

// Action types
type TourAction =
  | { type: 'START_TOUR'; tourId: TourId }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; stepIndex: number }
  | { type: 'SKIP_TOUR' }
  | { type: 'COMPLETE_TOUR' }
  | { type: 'RESET_TOUR'; tourId: TourId }
  | { type: 'RESET_ALL_TOURS' }
  | { type: 'SET_TOURS_ENABLED'; enabled: boolean }
  | { type: 'LOAD_PROGRESS'; progress: Record<TourId, TourProgress> }
  | { type: 'DISMISS_TOUR_PROMPT'; tourId: TourId }

// Reducer
function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    case 'START_TOUR': {
      const tour = getTour(action.tourId)
      if (!tour) return state

      return {
        ...state,
        activeTour: tour,
        currentStepIndex: 0,
        isActive: true,
      }
    }

    case 'NEXT_STEP': {
      if (!state.activeTour) return state

      const nextIndex = state.currentStepIndex + 1
      if (nextIndex >= state.activeTour.steps.length) {
        // Complete tour if we've reached the end
        const tourId = state.activeTour.id
        return {
          ...state,
          activeTour: null,
          currentStepIndex: 0,
          isActive: false,
          progress: {
            ...state.progress,
            [tourId]: {
              tourId,
              currentStep: state.activeTour.steps.length,
              isCompleted: true,
              completedAt: new Date().toISOString(),
            },
          },
        }
      }

      return {
        ...state,
        currentStepIndex: nextIndex,
      }
    }

    case 'PREV_STEP': {
      if (!state.activeTour || state.currentStepIndex === 0) return state

      return {
        ...state,
        currentStepIndex: state.currentStepIndex - 1,
      }
    }

    case 'GO_TO_STEP': {
      if (!state.activeTour) return state

      const stepIndex = Math.max(0, Math.min(action.stepIndex, state.activeTour.steps.length - 1))

      return {
        ...state,
        currentStepIndex: stepIndex,
      }
    }

    case 'SKIP_TOUR': {
      if (!state.activeTour) return state

      const tourId = state.activeTour.id
      state.activeTour.onSkip?.()

      return {
        ...state,
        activeTour: null,
        currentStepIndex: 0,
        isActive: false,
        progress: {
          ...state.progress,
          [tourId]: {
            tourId,
            currentStep: state.currentStepIndex,
            isCompleted: false,
            wasSkipped: true,
          },
        },
      }
    }

    case 'COMPLETE_TOUR': {
      if (!state.activeTour) return state

      const tourId = state.activeTour.id
      state.activeTour.onComplete?.()

      return {
        ...state,
        activeTour: null,
        currentStepIndex: 0,
        isActive: false,
        progress: {
          ...state.progress,
          [tourId]: {
            tourId,
            currentStep: state.activeTour.steps.length,
            isCompleted: true,
            completedAt: new Date().toISOString(),
          },
        },
      }
    }

    case 'RESET_TOUR': {
      const { [action.tourId]: _, ...restProgress } = state.progress
      return {
        ...state,
        progress: restProgress as Record<TourId, TourProgress>,
      }
    }

    case 'RESET_ALL_TOURS': {
      return {
        ...state,
        activeTour: null,
        currentStepIndex: 0,
        isActive: false,
        progress: {} as Record<TourId, TourProgress>,
      }
    }

    case 'SET_TOURS_ENABLED': {
      return {
        ...state,
        toursEnabled: action.enabled,
        // If disabling, also stop any active tour
        ...(action.enabled
          ? {}
          : {
              activeTour: null,
              currentStepIndex: 0,
              isActive: false,
            }),
      }
    }

    case 'LOAD_PROGRESS': {
      return {
        ...state,
        progress: action.progress,
      }
    }

    case 'DISMISS_TOUR_PROMPT': {
      // Mark the tour as "seen" so it doesn't auto-prompt again
      return {
        ...state,
        progress: {
          ...state.progress,
          [action.tourId]: {
            tourId: action.tourId,
            currentStep: 0,
            isCompleted: false,
            wasSkipped: true,
          },
        },
      }
    }

    default:
      return state
  }
}

// Create context
const TourContext = createContext<TourContextValue | undefined>(undefined)

// Storage helpers
function loadProgress(): Record<TourId, TourProgress> {
  try {
    const stored = localStorage.getItem(TOUR_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {} as Record<TourId, TourProgress>
  }
}

function saveProgress(progress: Record<TourId, TourProgress>) {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Ignore storage errors
  }
}

function loadToursEnabled(): boolean {
  try {
    const stored = localStorage.getItem(TOUR_ENABLED_KEY)
    return stored === null ? true : stored === 'true'
  } catch {
    return true
  }
}

function saveToursEnabled(enabled: boolean) {
  try {
    localStorage.setItem(TOUR_ENABLED_KEY, String(enabled))
  } catch {
    // Ignore storage errors
  }
}

function loadDismissedTours(): Set<TourId> {
  try {
    const stored = localStorage.getItem(TOUR_DISMISSED_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function saveDismissedTour(tourId: TourId) {
  try {
    const dismissed = loadDismissedTours()
    dismissed.add(tourId)
    localStorage.setItem(TOUR_DISMISSED_KEY, JSON.stringify([...dismissed]))
  } catch {
    // Ignore storage errors
  }
}

// Provider component
export function TourProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tourReducer, {
    ...initialState,
    toursEnabled: loadToursEnabled(),
  })

  // Load progress from storage on mount
  useEffect(() => {
    const progress = loadProgress()
    dispatch({ type: 'LOAD_PROGRESS', progress })
  }, [])

  // Persist progress to storage on change
  useEffect(() => {
    saveProgress(state.progress)
  }, [state.progress])

  // Persist enabled state
  useEffect(() => {
    saveToursEnabled(state.toursEnabled)
  }, [state.toursEnabled])

  // Actions
  const startTour = useCallback((tourId: TourId) => {
    dispatch({ type: 'START_TOUR', tourId })
  }, [])

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' })
  }, [])

  const prevStep = useCallback(() => {
    dispatch({ type: 'PREV_STEP' })
  }, [])

  const skipTour = useCallback(() => {
    dispatch({ type: 'SKIP_TOUR' })
  }, [])

  const completeTour = useCallback(() => {
    dispatch({ type: 'COMPLETE_TOUR' })
  }, [])

  const goToStep = useCallback((stepIndex: number) => {
    dispatch({ type: 'GO_TO_STEP', stepIndex })
  }, [])

  const resetTour = useCallback((tourId: TourId) => {
    dispatch({ type: 'RESET_TOUR', tourId })
  }, [])

  const resetAllTours = useCallback(() => {
    dispatch({ type: 'RESET_ALL_TOURS' })
    localStorage.removeItem(TOUR_DISMISSED_KEY)
  }, [])

  const setToursEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_TOURS_ENABLED', enabled })
  }, [])

  const shouldShowTour = useCallback(
    (tourId: TourId, isEmpty: boolean): boolean => {
      // Don't show if tours are disabled
      if (!state.toursEnabled) return false

      // Don't show if section is not empty
      if (!isEmpty) return false

      // Don't show if tour is completed or was skipped/dismissed
      const progress = state.progress[tourId]
      if (progress?.isCompleted || progress?.wasSkipped) return false

      // Check if tour was dismissed in storage
      const dismissed = loadDismissedTours()
      if (dismissed.has(tourId)) return false

      return true
    },
    [state.toursEnabled, state.progress],
  )

  const dismissTourPrompt = useCallback((tourId: TourId) => {
    dispatch({ type: 'DISMISS_TOUR_PROMPT', tourId })
    saveDismissedTour(tourId)
  }, [])

  const value: TourContextValue = {
    ...state,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    goToStep,
    resetTour,
    resetAllTours,
    setToursEnabled,
    shouldShowTour,
    dismissTourPrompt,
  }

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

// Custom hook to use tour context
export function useTour(): TourContextValue {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}

// Hook to check if a specific tour should be shown
export function useShouldShowTour(tourId: TourId, isEmpty: boolean): boolean {
  const { shouldShowTour } = useTour()
  return shouldShowTour(tourId, isEmpty)
}
