/**
 * Search Domain Types
 * @module domains/search/types
 *
 * Re-exports search types from central type definitions.
 */

// Advanced search types come from @/types/advanced-search.types
export type {
  AdvancedSearchRequest,
  AdvancedSearchResponse,
  FilterCondition,
  FilterGroup,
  RelationshipQuery,
  DateRange,
  SearchableEntityType,
  LogicOperator,
  SortBy,
  SortOrder,
} from '@/types/advanced-search.types'

// Enhanced search types come from @/types/enhanced-search.types
export type {
  CategorizedSuggestions,
  SearchHistoryItem,
  FilterCount,
  SearchSuggestion,
  HistorySuggestion,
} from '@/types/enhanced-search.types'
