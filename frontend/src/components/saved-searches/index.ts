/**
 * Saved Searches Components
 * Feature: saved-searches-feature
 * Description: Export all saved search components
 */

export { SavedSearchesManager } from './SavedSearchesManager'
export { SaveSearchDialog } from './SaveSearchDialog'
export { ShareSearchDialog } from './ShareSearchDialog'
export { AlertConfigDialog } from './AlertConfigDialog'

// Re-export types for convenience
export type {
  SavedSearch,
  SavedSearchShare,
  SavedSearchAlert,
  SavedSearchCategory,
  ShareType,
  SharePermission,
  AlertFrequency,
  AlertTrigger,
  CreateSavedSearchRequest,
  UpdateSavedSearchRequest,
  SmartFilter,
} from '@/types/saved-search.types'

// Re-export hooks
export {
  useSavedSearches,
  usePinnedSearches,
  useSmartFilters,
  useSavedSearch,
  useCreateSavedSearch,
  useUpdateSavedSearch,
  useDeleteSavedSearch,
  useExecuteSavedSearch,
  useToggleSearchPin,
  useShareSavedSearch,
  useDeleteShare,
  useCreateSearchAlert,
  useUpdateSearchAlert,
  useDeleteSearchAlert,
  getSavedSearchColorClasses,
  savedSearchKeys,
} from '@/hooks/useSavedSearches'
