/**
 * Guided Tours Type Definitions
 *
 * Type system for the interactive guided tour feature that helps users
 * learn the application by walking them through empty sections.
 */

import { LucideIcon } from 'lucide-react'

/**
 * Unique identifier for different tour types
 */
export type TourId =
  | 'dossier-first'
  | 'relationship-first'
  | 'document-first'
  | 'engagement-first'
  | 'brief-first'
  | 'position-first'
  | 'mou-first'
  | 'commitment-first'

/**
 * Tour step placement relative to target element
 */
export type TourStepPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end'

/**
 * Individual step in a tour
 */
export interface TourStep {
  /** Unique identifier for the step */
  id: string
  /** Target element selector (CSS selector or ref name) */
  target?: string
  /** Title of the step */
  title: string
  /** Main content/description of the step */
  content: string
  /** Optional hint or tip */
  hint?: string
  /** Placement of the tooltip relative to target */
  placement?: TourStepPlacement
  /** Optional icon to display */
  icon?: LucideIcon
  /** Whether this step requires an action before proceeding */
  requiresAction?: boolean
  /** Custom action button text (overrides default "Next") */
  actionText?: string
  /** Whether to highlight the target element */
  highlightTarget?: boolean
  /** Disable backdrop click to dismiss */
  disableBackdropClick?: boolean
  /** Optional callback when step is shown */
  onShow?: () => void
  /** Optional callback when step is completed */
  onComplete?: () => void
}

/**
 * Complete tour definition
 */
export interface Tour {
  /** Unique identifier for the tour */
  id: TourId
  /** Display name of the tour */
  name: string
  /** Description of what this tour covers */
  description: string
  /** Entity type this tour is for */
  entityType: string
  /** Steps in the tour */
  steps: TourStep[]
  /** Optional icon for the tour */
  icon?: LucideIcon
  /** Estimated time to complete (in minutes) */
  estimatedTime?: number
  /** Callback when tour is completed */
  onComplete?: () => void
  /** Callback when tour is skipped */
  onSkip?: () => void
}

/**
 * Tour progress tracking
 */
export interface TourProgress {
  /** Tour ID */
  tourId: TourId
  /** Current step index */
  currentStep: number
  /** Whether the tour is completed */
  isCompleted: boolean
  /** Timestamp when completed */
  completedAt?: string
  /** Whether the tour was skipped */
  wasSkipped?: boolean
}

/**
 * Tour state for the provider
 */
export interface TourState {
  /** Currently active tour */
  activeTour: Tour | null
  /** Current step index */
  currentStepIndex: number
  /** Whether any tour is active */
  isActive: boolean
  /** All tour progress records */
  progress: Record<TourId, TourProgress>
  /** Whether tours are enabled globally */
  toursEnabled: boolean
}

/**
 * Tour context actions
 */
export interface TourActions {
  /** Start a specific tour */
  startTour: (tourId: TourId) => void
  /** Move to next step */
  nextStep: () => void
  /** Move to previous step */
  prevStep: () => void
  /** Skip the current tour */
  skipTour: () => void
  /** Complete the current tour */
  completeTour: () => void
  /** Go to a specific step */
  goToStep: (stepIndex: number) => void
  /** Reset a specific tour's progress */
  resetTour: (tourId: TourId) => void
  /** Reset all tour progress */
  resetAllTours: () => void
  /** Enable/disable tours globally */
  setToursEnabled: (enabled: boolean) => void
  /** Check if a tour should be shown (first time in empty section) */
  shouldShowTour: (tourId: TourId, isEmpty: boolean) => boolean
  /** Mark a tour as seen (user dismissed "start tour" prompt) */
  dismissTourPrompt: (tourId: TourId) => void
}

/**
 * Combined tour context value
 */
export interface TourContextValue extends TourState, TourActions {}

/**
 * Props for tour trigger component
 */
export interface TourTriggerProps {
  /** Tour ID to trigger */
  tourId: TourId
  /** Whether the section is empty (triggers tour suggestion) */
  isEmpty: boolean
  /** Optional callback when tour starts */
  onTourStart?: () => void
  /** Children to render */
  children?: React.ReactNode
}

/**
 * Props for tour step overlay
 */
export interface TourStepOverlayProps {
  /** The current step */
  step: TourStep
  /** Current step number (1-indexed for display) */
  stepNumber: number
  /** Total number of steps */
  totalSteps: number
  /** Whether this is the last step */
  isLastStep: boolean
  /** Whether this is the first step */
  isFirstStep: boolean
  /** Callback to go to next step */
  onNext: () => void
  /** Callback to go to previous step */
  onPrev: () => void
  /** Callback to skip tour */
  onSkip: () => void
  /** Callback to complete tour */
  onComplete: () => void
}

/**
 * Props for guided tour wrapper
 */
export interface GuidedTourProps {
  /** Children to wrap */
  children: React.ReactNode
}
