/**
 * Search Components Index
 * Feature: Cross-Entity Search Disambiguation + Dossier-First Search
 *
 * Exports all search-related components for easy importing.
 */

// Legacy search components
export { SearchResultCard } from './SearchResultCard'
export type {
  SearchResultData,
  MatchReason,
  MatchField,
  RelationshipPathSegment,
} from './SearchResultCard'

export { EntityTypeFilterChips } from './EntityTypeFilterChips'
export type { FilterableEntityType } from './EntityTypeFilterChips'

export { GroupedSearchResults } from './GroupedSearchResults'

// Dossier-first search components (new)
export { DossierFirstSearchResults } from './DossierFirstSearchResults'
export { DossierSearchFilters, DossierTypeChips } from './DossierSearchFilters'
