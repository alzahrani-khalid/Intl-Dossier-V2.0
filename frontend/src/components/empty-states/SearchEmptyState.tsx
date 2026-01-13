import { useTranslation } from 'react-i18next'
import { Search, Filter, RefreshCw } from 'lucide-react'
import { EmptyState, EmptyStateProps, EmptyStateVariant, EmptyStateSize } from './EmptyState'
import { IntelligentSearchSuggestions } from './IntelligentSearchSuggestions'
import type {
  CreateEntitySuggestion,
  RecentContent,
  FilterPreset,
} from '@/types/enhanced-search.types'

export type SearchEmptyStateType = 'no-query' | 'no-results' | 'error'

interface SearchEmptyStateProps {
  /** Type of empty state to display */
  type: SearchEmptyStateType
  /** Current search query (used for context in messages) */
  searchQuery?: string
  /** Number of active filters (used for context) */
  activeFilters?: number
  /** Callback to clear filters */
  onClearFilters?: () => void
  /** Callback to retry search */
  onRetry?: () => void
  /** Custom title override */
  title?: string
  /** Custom description override */
  description?: string
  /** Visual variant */
  variant?: EmptyStateVariant
  /** Size variant */
  size?: EmptyStateSize
  /** Additional CSS classes */
  className?: string
  /** Entity types being searched (for intelligent suggestions) */
  entityTypes?: string[]
  /** Callback when user selects a search suggestion */
  onSearchSuggestion?: (term: string) => void
  /** Callback when user wants to create a new entity */
  onCreateEntity?: (suggestion: CreateEntitySuggestion) => void
  /** Callback when user clicks on recent content */
  onContentClick?: (content: RecentContent) => void
  /** Show intelligent suggestions for no-results state */
  showIntelligentSuggestions?: boolean
  /** Callback to change entity type filter */
  onChangeEntityType?: (entityType: string) => void
  /** Callback when user selects a filter preset */
  onApplyPreset?: (preset: FilterPreset) => void
  /** Show filter presets when no results */
  showFilterPresets?: boolean
}

/**
 * Specialized empty state for search interfaces.
 * Handles three scenarios: no query entered, no results found, and search errors.
 * Now includes intelligent suggestions when search returns no results.
 *
 * @example
 * // No search query entered
 * <SearchEmptyState type="no-query" />
 *
 * @example
 * // No results found with intelligent suggestions
 * <SearchEmptyState
 *   type="no-results"
 *   searchQuery="annual report"
 *   activeFilters={3}
 *   onClearFilters={() => clearFilters()}
 *   showIntelligentSuggestions={true}
 *   entityTypes={['dossier', 'document']}
 *   onSearchSuggestion={(term) => handleSearch(term)}
 * />
 *
 * @example
 * // Search error with retry
 * <SearchEmptyState
 *   type="error"
 *   onRetry={() => retrySearch()}
 * />
 */
export function SearchEmptyState({
  type,
  searchQuery,
  activeFilters = 0,
  onClearFilters,
  onRetry,
  title: customTitle,
  description: customDescription,
  variant = 'default',
  size = 'md',
  className,
  entityTypes = ['dossier'],
  onSearchSuggestion,
  onCreateEntity,
  onContentClick,
  showIntelligentSuggestions = true,
  onChangeEntityType,
  onApplyPreset,
  showFilterPresets = true,
}: SearchEmptyStateProps) {
  const { t, i18n } = useTranslation('empty-states')
  const isRTL = i18n.language === 'ar'

  const getProps = (): Partial<EmptyStateProps> => {
    switch (type) {
      case 'no-query':
        return {
          icon: Search,
          title: customTitle || t('search.noQuery.title'),
          description: customDescription || t('search.noQuery.description'),
          hint: t('search.noQuery.hint'),
        }

      case 'no-results':
        const hasFilters = activeFilters > 0
        return {
          icon: Search,
          title: customTitle || t('search.noResults.title'),
          description:
            customDescription ||
            (searchQuery
              ? t('search.noResults.descriptionWithQuery', { query: searchQuery })
              : t('search.noResults.description')),
          hint: hasFilters
            ? t('search.noResults.hintWithFilters', { count: activeFilters })
            : undefined, // Remove hint when showing intelligent suggestions
          primaryAction:
            hasFilters && onClearFilters
              ? {
                  label: t('search.noResults.clearFilters'),
                  icon: Filter,
                  onClick: onClearFilters,
                  variant: 'outline' as const,
                }
              : undefined,
        }

      case 'error':
        return {
          icon: Search,
          title: customTitle || t('search.error.title'),
          description: customDescription || t('search.error.description'),
          primaryAction: onRetry
            ? {
                label: t('search.error.retry'),
                icon: RefreshCw,
                onClick: onRetry,
              }
            : undefined,
        }

      default:
        return {
          icon: Search,
          title: t('search.noResults.title'),
          description: t('search.noResults.description'),
        }
    }
  }

  const props = getProps()

  // Show intelligent suggestions for no-results state
  const shouldShowIntelligentSuggestions =
    type === 'no-results' &&
    showIntelligentSuggestions &&
    searchQuery &&
    searchQuery.trim().length >= 2 &&
    onSearchSuggestion

  return (
    <div
      className={className}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid={`search-empty-state-${type}`}
    >
      <EmptyState
        icon={props.icon || Search}
        title={props.title || ''}
        description={props.description || ''}
        hint={shouldShowIntelligentSuggestions ? undefined : props.hint}
        primaryAction={props.primaryAction}
        variant={variant}
        size={size}
        testId={`search-empty-state-base-${type}`}
      />

      {/* Intelligent Suggestions Section with Filter Presets */}
      {shouldShowIntelligentSuggestions && (
        <div className="mt-8 max-w-2xl mx-auto px-4">
          <IntelligentSearchSuggestions
            query={searchQuery}
            entityTypes={entityTypes}
            onSearchSuggestion={onSearchSuggestion}
            onCreateEntity={onCreateEntity}
            onContentClick={onContentClick}
            onClearFilters={onClearFilters}
            onChangeEntityType={onChangeEntityType}
            activeFiltersCount={activeFilters}
            onApplyPreset={onApplyPreset}
            showFilterPresets={showFilterPresets}
          />
        </div>
      )}
    </div>
  )
}
