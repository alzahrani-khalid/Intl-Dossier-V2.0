/**
 * AdvancedSearchFilters Component
 * Feature: advanced-search-filters
 * Description: Main filter panel for advanced search with all filter options
 */

import { useReducer, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  RotateCcw,
  Folder,
  Calendar,
  FileText,
  Users,
  Building,
  Globe,
  Tag,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { DateRangeFilter } from './DateRangeFilter'
import { BooleanLogicBuilder } from './BooleanLogicBuilder'
import { SavedSearchTemplates } from './SavedSearchTemplates'
import {
  searchReducer,
  defaultSearchState,
  buildSearchRequest,
  hasActiveFilters,
  countActiveFilters,
  type SearchState,
  type SearchAction,
} from '@/hooks/useAdvancedSearch'
import type { SearchableEntityType, TemplateDefinition } from '@/types/advanced-search.types'
import { ENTITY_TYPE_LABELS } from '@/types/advanced-search.types'

// Icon mapping for entity types
const entityIcons: Record<SearchableEntityType, React.ComponentType<{ className?: string }>> = {
  dossier: Folder,
  engagement: Calendar,
  position: FileText,
  document: FileText,
  person: User,
  organization: Building,
  forum: Users,
  country: Globe,
  theme: Tag,
}

interface AdvancedSearchFiltersProps {
  onSearch: (state: SearchState) => void
  onSaveTemplate?: (state: SearchState) => void
  className?: string
  initialState?: Partial<SearchState>
}

export function AdvancedSearchFilters({
  onSearch,
  onSaveTemplate,
  className,
  initialState,
}: AdvancedSearchFiltersProps) {
  const { t, i18n } = useTranslation('advanced-search')
  const isRTL = i18n.language === 'ar'

  const [state, dispatch] = useReducer(
    searchReducer,
    initialState ? { ...defaultSearchState, ...initialState } : defaultSearchState,
  )

  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true)
  const [isTemplatesExpanded, setIsTemplatesExpanded] = useState(false)

  const activeFilterCount = countActiveFilters(state)
  const hasFilters = hasActiveFilters(state)

  const handleSearch = useCallback(() => {
    onSearch(state)
  }, [state, onSearch])

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const handleEntityTypeToggle = useCallback((entityType: SearchableEntityType) => {
    dispatch({ type: 'TOGGLE_ENTITY_TYPE', payload: entityType })
  }, [])

  const handleApplyTemplate = useCallback((template: TemplateDefinition) => {
    dispatch({
      type: 'LOAD_STATE',
      payload: {
        entityTypes: template.entity_types || ['dossier'],
        query: template.query || '',
        conditions: template.conditions || [],
        conditionGroups: template.condition_groups || [],
        relationships: template.relationships || [],
        dateRange: template.date_range || null,
        status: template.status || [],
        tags: template.tags || [],
        filterLogic: template.filter_logic || 'AND',
        includeArchived: template.include_archived || false,
        sortBy: template.sort_by || 'relevance',
        sortOrder: template.sort_order || 'desc',
      },
    })
    setIsTemplatesExpanded(false)
  }, [])

  const statusOptions = [
    { value: 'active', label: t('status.active') },
    { value: 'inactive', label: t('status.inactive') },
    { value: 'archived', label: t('status.archived') },
    { value: 'draft', label: t('status.draft') },
    { value: 'published', label: t('status.published') },
  ]

  return (
    <div
      className={cn('flex flex-col gap-4 bg-background', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="search"
      aria-label={t('a11y.searchForm')}
    >
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={state.query}
          onChange={(e) => dispatch({ type: 'SET_QUERY', payload: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={t('search.placeholder')}
          className="ps-10 pe-4 min-h-12 text-base"
        />
        {state.query && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_QUERY', payload: '' })}
            className="absolute end-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label={t('search.clear')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick Templates */}
      <Collapsible open={isTemplatesExpanded} onOpenChange={setIsTemplatesExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-3 min-h-10">
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t('templates.title')}
            </span>
            {isTemplatesExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <SavedSearchTemplates onApply={handleApplyTemplate} />
        </CollapsibleContent>
      </Collapsible>

      {/* Entity Types */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('entityTypes.label')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ENTITY_TYPE_LABELS) as SearchableEntityType[]).map((entityType) => {
            const IconComponent = entityIcons[entityType]
            const isSelected = state.entityTypes.includes(entityType)
            const labels = ENTITY_TYPE_LABELS[entityType]

            return (
              <button
                key={entityType}
                type="button"
                onClick={() => handleEntityTypeToggle(entityType)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all min-h-10',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary',
                )}
              >
                <IconComponent className="h-4 w-4" />
                {isRTL ? labels.label_ar : labels.label_en}
              </button>
            )
          })}
        </div>
      </div>

      {/* Filters Section */}
      <Collapsible open={isFiltersExpanded} onOpenChange={setIsFiltersExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-3 min-h-10">
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t('filters.title')}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ms-2">
                  {activeFilterCount}
                </Badge>
              )}
            </span>
            {isFiltersExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-4 space-y-6" aria-label={t('a11y.filterSection')}>
          {/* Boolean Logic Builder */}
          <BooleanLogicBuilder
            conditions={state.conditions}
            entityTypes={state.entityTypes}
            logic={state.filterLogic}
            onConditionAdd={(condition) => dispatch({ type: 'ADD_CONDITION', payload: condition })}
            onConditionUpdate={(index, condition) =>
              dispatch({ type: 'UPDATE_CONDITION', payload: { index, condition } })
            }
            onConditionRemove={(index) => dispatch({ type: 'REMOVE_CONDITION', payload: index })}
            onLogicChange={(logic) => dispatch({ type: 'SET_FILTER_LOGIC', payload: logic })}
            onClear={() => dispatch({ type: 'CLEAR_CONDITIONS' })}
          />

          {/* Date Range */}
          <DateRangeFilter
            value={state.dateRange}
            onChange={(dateRange) => dispatch({ type: 'SET_DATE_RANGE', payload: dateRange })}
          />

          {/* Status Filter */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('status.title')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => {
                const isSelected = state.status.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => dispatch({ type: 'TOGGLE_STATUS', payload: option.value })}
                    className={cn(
                      'px-3 py-1.5 rounded-full border text-sm transition-all min-h-8',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary',
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Include Archived */}
          <div className="flex items-center gap-3 py-2">
            <Checkbox
              id="include-archived"
              checked={state.includeArchived}
              onCheckedChange={(checked) =>
                dispatch({ type: 'SET_INCLUDE_ARCHIVED', payload: checked === true })
              }
            />
            <label
              htmlFor="include-archived"
              className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              {t('options.includeArchived')}
            </label>
          </div>

          {/* Sorting */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('sorting.title')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(['relevance', 'date', 'title'] as const).map((sortOption) => (
                <button
                  key={sortOption}
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: 'SET_SORT',
                      payload: { sortBy: sortOption, sortOrder: state.sortOrder },
                    })
                  }
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-sm transition-all min-h-8',
                    state.sortBy === sortOption
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary',
                  )}
                >
                  {t(`sorting.${sortOption === 'title' ? 'title_sort' : sortOption}`)}
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: 'SET_SORT',
                    payload: {
                      sortBy: state.sortBy,
                      sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
                    },
                  })
                }
                className="px-3 py-1.5 rounded-full border text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary transition-all min-h-8"
              >
                {state.sortOrder === 'asc' ? t('sorting.ascending') : t('sorting.descending')}
              </button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <Button
          onClick={handleSearch}
          className="flex-1 min-h-11"
          disabled={state.entityTypes.length === 0}
        >
          <Search className="h-4 w-4 me-2" />
          {t('actions.search')}
        </Button>

        {hasFilters && (
          <Button variant="outline" onClick={handleReset} className="min-h-11">
            <RotateCcw className="h-4 w-4 me-2" />
            {t('actions.reset')}
          </Button>
        )}

        {onSaveTemplate && hasFilters && (
          <Button variant="outline" onClick={() => onSaveTemplate(state)} className="min-h-11">
            <Save className="h-4 w-4 me-2" />
            {t('templates.create')}
          </Button>
        )}
      </div>
    </div>
  )
}

export default AdvancedSearchFilters
