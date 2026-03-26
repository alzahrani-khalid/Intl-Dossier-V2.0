/**
 * @deprecated Import from '@/domains/dossiers' instead.
 * Backward-compat re-export for existing consumers.
 */
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
} from '@/domains/dossiers'

export type {
  DossierRecommendation,
  DossierRecommendationListItem,
  DossierRecommendationListParams,
  DossierRecommendationListResponse,
  DossierRecommendationUpdateParams,
  GenerateDossierRecommendationsParams,
  GenerateDossierRecommendationsResponse,
  TrackInteractionParams,
  RecommendationInteractionType,
} from '@/domains/dossiers'
