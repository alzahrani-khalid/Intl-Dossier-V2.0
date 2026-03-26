/**
 * @deprecated Import from '@/domains/dossiers' instead.
 * Backward-compat re-export for existing consumers.
 */
export {
  useNoResultsSuggestions,
  useCreateEntityRoute,
  formatEntityTypeLabel,
  noResultsKeys,
} from '@/domains/dossiers'

export { default } from '@/domains/dossiers/hooks/useNoResultsSuggestions'
