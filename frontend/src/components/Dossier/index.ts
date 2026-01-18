/**
 * Dossier Components
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * Exports all dossier-related components for the smart context feature.
 */

// Error Boundary
export { DossierErrorBoundary, withDossierErrorBoundary } from './DossierErrorBoundary'

// Core Components
export { DossierContextBadge, type DossierContextBadgeProps } from './DossierContextBadge'
export { DossierTypeIcon, type DossierTypeIconProps } from './DossierTypeIcon'
export { DossierSelector, type DossierSelectorProps, type SelectedDossier } from './DossierSelector'
export {
  DossierActivityTimeline,
  type DossierActivityTimelineProps,
} from './DossierActivityTimeline'
export { ActivityTimelineItem, type ActivityTimelineItemProps } from './ActivityTimelineItem'

// Pre-wrapped components with error boundaries
import { withDossierErrorBoundary } from './DossierErrorBoundary'
import { DossierSelector as _DossierSelector } from './DossierSelector'
import { DossierActivityTimeline as _DossierActivityTimeline } from './DossierActivityTimeline'

export const SafeDossierSelector = withDossierErrorBoundary(_DossierSelector, {
  componentType: 'selector',
})

export const SafeDossierActivityTimeline = withDossierErrorBoundary(_DossierActivityTimeline, {
  componentType: 'timeline',
})
