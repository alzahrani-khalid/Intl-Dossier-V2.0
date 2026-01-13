/**
 * Guided Tours Module
 *
 * Interactive guided tours that activate when users first encounter
 * empty sections. Provides step-by-step overlays to walk users through
 * creating their first item.
 */

// Context & Provider
export { TourProvider, useTour, useShouldShowTour } from './TourContext'

// Components
export { TourOverlay } from './TourOverlay'
export { TourTrigger, useTourTrigger } from './TourTrigger'

// Tour definitions
export {
  getTour,
  getAllTours,
  tourRegistry,
  dossierFirstTour,
  relationshipFirstTour,
  documentFirstTour,
  engagementFirstTour,
  briefFirstTour,
  positionFirstTour,
  mouFirstTour,
  commitmentFirstTour,
} from './tour-definitions'

// Types
export type {
  TourId,
  Tour,
  TourStep,
  TourStepPlacement,
  TourProgress,
  TourState,
  TourActions,
  TourContextValue,
  TourTriggerProps,
  TourStepOverlayProps,
  GuidedTourProps,
} from './types'
