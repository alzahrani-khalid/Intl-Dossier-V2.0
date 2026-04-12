/**
 * Dossiers Domain Barrel
 * @module domains/dossiers
 *
 * Re-exports all hooks, repository, and types for the dossiers domain.
 * Canonical import path for consumers: `@/domains/dossiers`
 */

// Query Key Factory (canonical source)
export { dossierKeys } from './keys'

// Hooks
export { useDossiers } from './hooks/useDossiers'
export {
  useDossier,
  useDossiers as useDossiersFromDetail,
  useDossiersByType,
  useCreateDossier,
  useUpdateDossier,
  useDeleteDossier,
  usePrefetchDossier,
  useInvalidateDossiers,
  useDocumentLinks,
  useLinkDocument,
  useUnlinkDocument,
  useTypedDossier,
  useDossierCounts,
  useDossierCountByType,
  dossierKeys as dossierDetailKeys, // legacy alias from useDossier hook
  documentLinksKeys,
  dossierCountsKeys,
} from './hooks/useDossier'
export {
  useDossierActivityTimeline,
  type UseDossierActivityTimelineOptions,
  type UseDossierActivityTimelineReturn,
  type TimelineActivity,
  type TimelineFilters,
  type DossierActivityTimelineResponse,
} from './hooks/useDossierActivityTimeline'
export {
  useDossierRecommendations,
  useDossierRecommendation,
  useUpdateDossierRecommendation,
  useTrackRecommendationInteraction,
  useAcceptDossierRecommendation,
  useDismissDossierRecommendation,
  useTrackWhyRecommendedExpand,
  useSubmitRecommendationFeedback,
  useGenerateDossierRecommendations,
  useHighPriorityDossierRecommendations,
  usePrefetchDossierRecommendations,
  dossierRecommendationKeys,
} from './hooks/useDossierRecommendations'
export { useDossierFirstSearch, DEFAULT_FILTERS } from './hooks/useDossierFirstSearch'
export {
  useQuickSwitcherSearch,
  type QuickSwitcherDossier,
  type QuickSwitcherWorkItem,
  type RecentItem,
} from './hooks/useQuickSwitcherSearch'
export {
  useNoResultsSuggestions,
  useCreateEntityRoute,
  formatEntityTypeLabel,
  noResultsKeys,
} from './hooks/useNoResultsSuggestions'

// Repository
export * as dossiersRepo from './repositories/dossiers.repository'

// Types
export * from './types'
