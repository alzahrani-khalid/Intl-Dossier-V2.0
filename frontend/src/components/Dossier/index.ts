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
export {
  DossierContextIndicator,
  type DossierContextIndicatorProps,
} from './DossierContextIndicator'
export { DossierTypeIcon, type DossierTypeIconProps } from './DossierTypeIcon'
export { DossierSelector, type DossierSelectorProps, type SelectedDossier } from './DossierSelector'
export {
  DossierActivityTimeline,
  type DossierActivityTimelineProps,
} from './DossierActivityTimeline'
export { ActivityTimelineItem, type ActivityTimelineItemProps } from './ActivityTimelineItem'

// Add to Dossier Menu (Feature 035 - Standardized "Add to Dossier" mental model)
export {
  AddToDossierMenu,
  AddToDossierButton,
  AddToDossierFAB,
  AddToDossierCard,
  type AddToDossierMenuProps,
  type AddToDossierActionType,
  type AddToDossierAction,
  type DossierContext,
} from './AddToDossierMenu'

export { AddToDossierDialogs, type AddToDossierDialogsProps } from './AddToDossierDialogs'

// Detail Layout
export { DossierDetailLayout } from './DossierDetailLayout'

// Export Dialog (Feature: dossier-export-pack)
export { ExportDossierDialog, default as ExportDossierDialogDefault } from './ExportDossierDialog'

// Dossier Links Widget (Reusable for entity detail pages)
export { DossierLinksWidget, type DossierLinksWidgetProps } from './DossierLinksWidget'

// Mini Relationship Graph Widget (Sidebar widget showing 1-degree connections)
export { MiniRelationshipGraph, type MiniRelationshipGraphProps } from './MiniRelationshipGraph'

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

// Dossier Type Guide (contextual help for dossier types)
export {
  DossierTypeGuide,
  DossierTypeGuideGrid,
  // Backward compatibility aliases
  EntityTypeGuide,
  EntityTypeGuideGrid,
  type DossierTypeGuideProps,
  type EntityTypeGuideProps,
} from './DossierTypeGuide'
