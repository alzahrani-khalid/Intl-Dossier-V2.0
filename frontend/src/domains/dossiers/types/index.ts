/**
 * Dossier Domain Types
 * @module domains/dossiers/types
 *
 * Re-exports all dossier-related types from their canonical locations.
 * Types remain in @/types/ (shared across domains); this barrel
 * provides a convenient domain-scoped import path.
 */

export type { DossierFilters, DossierListResponse } from '@/types/dossier'

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
} from '@/types/dossier-recommendation.types'

export type {
  DossierSearchFilters,
  DossierFirstSearchResponse,
  DossierSearchResult,
  RelatedWorkItem,
} from '@/types/dossier-search.types'

export type { NoResultsSuggestions, CreateEntitySuggestion } from '@/types/enhanced-search.types'
