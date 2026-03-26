/**
 * @deprecated Import from '@/domains/search' instead.
 * Backward-compatible re-export.
 */
export {
  advancedSearchKeys,
  useAdvancedSearchMutation,
  getSearchHistory,
  defaultSearchState,
  buildSearchRequest,
  searchReducer,
  hasActiveFilters,
  countActiveFilters,
} from '@/domains/search'
export type { SearchState, SearchAction } from '@/domains/search'
