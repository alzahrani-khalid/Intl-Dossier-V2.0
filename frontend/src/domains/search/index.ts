/**
 * Search Domain Barrel
 * @module domains/search
 */

// Hooks
export {
  advancedSearchKeys,
  useAdvancedSearchMutation,
  getSearchHistory,
  defaultSearchState,
  buildSearchRequest,
  searchReducer,
  hasActiveFilters,
  countActiveFilters,
} from './hooks/useAdvancedSearch'
export type { SearchState, SearchAction } from './hooks/useAdvancedSearch'

export {
  enhancedSearchKeys,
  useSearchSuggestions,
  useFilterCounts,
  useEnhancedSearch,
  highlightMatch,
} from './hooks/useEnhancedSearch'

export {
  templateKeys,
  usePopularTemplates,
  useQuickTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  getTemplateColorClasses,
} from './hooks/useSavedSearchTemplates'

// Repository
export * as searchRepo from './repositories/search.repository'

// Types
export * from './types'
