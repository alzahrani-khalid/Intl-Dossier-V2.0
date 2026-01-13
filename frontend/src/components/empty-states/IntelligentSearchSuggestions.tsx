/**
 * IntelligentSearchSuggestions Component
 * Feature: Intelligent search suggestions when search returns no results
 * Description: Displays typo corrections, related terms, popular searches,
 *              recent content, and entity creation options
 */

import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import {
  Search,
  Lightbulb,
  TrendingUp,
  Clock,
  Plus,
  SpellCheck,
  ArrowRight,
  ChevronRight,
  Globe,
  Building2,
  Users,
  FileText,
  Loader2,
  History,
  Filter,
  Layers,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useNoResultsSuggestions, formatEntityTypeLabel } from '@/hooks/useNoResultsSuggestions'
import { useFilterPresets } from '@/hooks/useFilterPresets'
import { FilterPresetsSection } from './FilterPresetsSection'
import type {
  TypoCorrection,
  RelatedTerm,
  PopularSearchSuggestion,
  RecentContent,
  CreateEntitySuggestion,
  IntelligentSearchSuggestionsProps,
  WorkspaceSearchHistory,
  ActionableSearchTip,
  FilterPreset,
} from '@/types/enhanced-search.types'

/**
 * Get icon for entity type
 */
function getEntityIcon(entityType: string) {
  const icons: Record<string, React.ElementType> = {
    country: Globe,
    organization: Building2,
    forum: Users,
    theme: Lightbulb,
    engagement: Users,
    position: FileText,
    document: FileText,
    dossier: FileText,
  }
  return icons[entityType] || FileText
}

/**
 * Typo Corrections Section
 */
function TypoCorrectionsSection({
  corrections,
  onSelect,
  isRTL,
}: {
  corrections: TypoCorrection[]
  onSelect: (term: string) => void
  isRTL: boolean
}) {
  const { t } = useTranslation('enhanced-search')

  if (corrections.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <SpellCheck className="h-4 w-4" />
        <span>{t('noResults.didYouMean')}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {corrections.map((correction, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(correction.corrected)}
            className="min-h-9 min-w-9"
          >
            <span className="font-medium">{correction.corrected}</span>
            <ChevronRight className={cn('h-4 w-4 ms-1', isRTL && 'rotate-180')} />
          </Button>
        ))}
      </div>
    </div>
  )
}

/**
 * Related Terms Section
 */
function RelatedTermsSection({
  terms,
  onSelect,
  isRTL,
  language,
}: {
  terms: RelatedTerm[]
  onSelect: (term: string) => void
  isRTL: boolean
  language: string
}) {
  const { t } = useTranslation('enhanced-search')

  if (terms.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Lightbulb className="h-4 w-4" />
        <span>{t('noResults.relatedTerms')}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {terms.map((term, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => onSelect(language === 'ar' && term.term_ar ? term.term_ar : term.term)}
            className="min-h-9 min-w-9"
          >
            <Search className="h-3 w-3 me-1 text-muted-foreground" />
            <span>{language === 'ar' && term.term_ar ? term.term_ar : term.term}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}

/**
 * Popular Searches Section
 */
function PopularSearchesSection({
  searches,
  onSelect,
  isRTL,
}: {
  searches: PopularSearchSuggestion[]
  onSelect: (term: string) => void
  isRTL: boolean
}) {
  const { t } = useTranslation('enhanced-search')

  if (searches.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <TrendingUp className="h-4 w-4" />
        <span>{t('noResults.popularSearches')}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((search, index) => (
          <Button
            key={index}
            variant="secondary"
            size="sm"
            onClick={() => onSelect(search.query)}
            className="min-h-9 min-w-9"
          >
            <span>{search.query}</span>
            <Badge variant="outline" className="ms-2 text-xs">
              {search.result_count}
            </Badge>
          </Button>
        ))}
      </div>
    </div>
  )
}

/**
 * Recent Content Section
 */
function RecentContentSection({
  content,
  onContentClick,
  isRTL,
  language,
}: {
  content: RecentContent[]
  onContentClick?: (content: RecentContent) => void
  isRTL: boolean
  language: string
}) {
  const { t } = useTranslation('enhanced-search')
  const navigate = useNavigate()

  if (content.length === 0) return null

  const handleClick = (item: RecentContent) => {
    if (onContentClick) {
      onContentClick(item)
    } else {
      // Default navigation based on entity type
      const routes: Record<string, string> = {
        dossier: '/dossiers',
        country: '/dossiers',
        organization: '/dossiers',
        forum: '/dossiers',
        theme: '/dossiers',
        engagement: '/engagements',
      }
      const baseRoute = routes[item.entity_type] || '/dossiers'
      navigate({ to: `${baseRoute}/${item.id}` as any })
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>{t('noResults.recentlyAdded')}</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {content.map((item) => {
          const Icon = getEntityIcon(item.entity_type)
          const title = language === 'ar' && item.title_ar ? item.title_ar : item.title_en

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border bg-card text-card-foreground',
                'hover:bg-accent hover:text-accent-foreground transition-colors',
                'text-start min-h-11',
              )}
            >
              <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatEntityTypeLabel(item.entity_type, language)}
                </p>
              </div>
              <ArrowRight className={cn('h-4 w-4 text-muted-foreground', isRTL && 'rotate-180')} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Create Entity Section
 */
function CreateEntitySection({
  suggestion,
  onCreateEntity,
  isRTL,
  language,
}: {
  suggestion?: CreateEntitySuggestion
  onCreateEntity?: (suggestion: CreateEntitySuggestion) => void
  isRTL: boolean
  language: string
}) {
  const { t } = useTranslation('enhanced-search')
  const navigate = useNavigate()

  if (!suggestion) return null

  const handleCreate = () => {
    if (onCreateEntity) {
      onCreateEntity(suggestion)
    } else {
      // Build URL with prefill params
      const params = new URLSearchParams(suggestion.prefill_params || {})
      const queryString = params.toString()
      const url = queryString
        ? `${suggestion.route}${suggestion.route.includes('?') ? '&' : '?'}${queryString}`
        : suggestion.route
      navigate({ to: url as any })
    }
  }

  return (
    <Card className="border-dashed border-2 bg-muted/30">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium">
              {t('noResults.createNew', {
                type: formatEntityTypeLabel(suggestion.entity_type, language),
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('noResults.createNewHint', { name: suggestion.suggested_name })}
            </p>
          </div>
          <Button onClick={handleCreate} size="sm" className="min-h-10 min-w-10">
            <Plus className="h-4 w-4 me-2" />
            {t('noResults.createButton', {
              type: formatEntityTypeLabel(suggestion.entity_type, language),
            })}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Workspace Search History Section
 * Shows successful searches from the workspace that returned results
 */
function WorkspaceHistorySection({
  history,
  onSelect,
  isRTL,
}: {
  history: WorkspaceSearchHistory[]
  onSelect: (term: string) => void
  isRTL: boolean
}) {
  const { t } = useTranslation('enhanced-search')

  if (!history || history.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <History className="h-4 w-4" />
        <span>{t('noResults.workspaceHistory')}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {history.map((item, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(item.query)}
            className="min-h-9 min-w-9 flex items-center gap-2"
          >
            <span>{item.query}</span>
            <Badge variant="secondary" className="text-xs">
              {item.result_count} {t('noResults.results')}
            </Badge>
          </Button>
        ))}
      </div>
    </div>
  )
}

/**
 * Actionable Tips Section
 * Shows specific actionable suggestions like removing filters, trying different entity types
 */
function ActionableTipsSection({
  tips,
  activeFiltersCount,
  onClearFilters,
  onChangeEntityType,
  isRTL,
  language,
}: {
  tips?: ActionableSearchTip[]
  activeFiltersCount?: number
  onClearFilters?: () => void
  onChangeEntityType?: (entityType: string) => void
  isRTL: boolean
  language: string
}) {
  const { t } = useTranslation('enhanced-search')

  // Build tips from available actions
  const actionTips: ActionableSearchTip[] = tips || []

  // Add filter removal tip if there are active filters
  const hasFilters = activeFiltersCount && activeFiltersCount > 0

  if (actionTips.length === 0 && !hasFilters) return null

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spelling':
        return SpellCheck
      case 'broader':
        return Layers
      case 'filters':
        return Filter
      case 'entity_specific':
        return Layers
      default:
        return Lightbulb
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <span>{t('noResults.actionableTips')}</span>
      </div>

      {/* Show filter removal button if filters are active */}
      {hasFilters && onClearFilters && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <Filter className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {t('noResults.filtersActive', { count: activeFiltersCount })}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t('noResults.tryRemovingFilters')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="min-h-9 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
          >
            <X className="h-4 w-4 me-1" />
            {t('noResults.clearFilters')}
          </Button>
        </div>
      )}

      {/* Render actionable tips */}
      <div className="space-y-2">
        {actionTips.map((tip, index) => {
          const Icon = getCategoryIcon(tip.category)
          return (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
              <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? tip.tip_ar : tip.tip}
              </p>
              {tip.action && tip.action.type === 'change_entity_type' && onChangeEntityType && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChangeEntityType(tip.action!.payload?.entityType as string)}
                  className="min-h-8 ms-auto"
                >
                  {t('noResults.tryThis')}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Search Tips Section
 */
function SearchTipsSection({ tips, isRTL }: { tips: string[]; isRTL: boolean }) {
  const { t } = useTranslation('enhanced-search')

  if (tips.length === 0) return null

  return (
    <div className="space-y-2 pt-4 border-t">
      <p className="text-sm font-medium text-muted-foreground">{t('noResults.searchTips')}</p>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ps-2">
        {tips.map((tip, index) => (
          <li key={index}>{tip}</li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Main IntelligentSearchSuggestions Component
 */
export function IntelligentSearchSuggestions({
  query,
  entityTypes,
  onSearchSuggestion,
  onCreateEntity,
  onContentClick,
  onClearFilters,
  onChangeEntityType,
  activeFiltersCount,
  className,
  onApplyPreset,
  showFilterPresets = true,
}: IntelligentSearchSuggestionsProps) {
  const { t, i18n } = useTranslation('enhanced-search')
  const isRTL = i18n.language === 'ar'
  const language = i18n.language

  const {
    data: suggestions,
    isLoading,
    error,
  } = useNoResultsSuggestions(query, entityTypes, {
    enabled: true,
    language,
  })

  // Get filter presets based on context
  const { presets: filterPresets, getRecommendedPresets } = useFilterPresets({
    entityTypes,
    limit: 4,
    activeFiltersCount,
  })

  // Get recommended presets for this context
  const recommendedPresets = getRecommendedPresets({
    hasFilters: (activeFiltersCount || 0) > 0,
    noResults: true,
    entityTypes,
  })

  // Determine if we should show filter presets
  // Show when: there are active filters OR when the search returned no results
  const shouldShowPresets =
    showFilterPresets &&
    onApplyPreset &&
    recommendedPresets.length > 0 &&
    ((activeFiltersCount && activeFiltersCount > 0) || !query || query.trim().length < 2)

  if (isLoading) {
    return (
      <div
        className={cn('flex flex-col items-center justify-center py-8', className)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">{t('noResults.findingSuggestions')}</p>
      </div>
    )
  }

  if (error || !suggestions) {
    // Even if suggestions failed, show filter presets if available
    if (shouldShowPresets) {
      return (
        <div
          className={cn('space-y-6', className)}
          dir={isRTL ? 'rtl' : 'ltr'}
          data-testid="intelligent-search-suggestions"
        >
          <FilterPresetsSection
            presets={recommendedPresets}
            onApplyPreset={onApplyPreset}
            maxVisible={4}
          />
        </div>
      )
    }
    return null
  }

  const hasAnySuggestions =
    suggestions.typo_corrections.length > 0 ||
    suggestions.related_terms.length > 0 ||
    suggestions.popular_searches.length > 0 ||
    suggestions.recent_content.length > 0 ||
    (suggestions.workspace_history && suggestions.workspace_history.length > 0) ||
    suggestions.create_suggestion ||
    (activeFiltersCount && activeFiltersCount > 0) ||
    shouldShowPresets

  if (!hasAnySuggestions) {
    return null
  }

  return (
    <div
      className={cn('space-y-6', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid="intelligent-search-suggestions"
    >
      {/* Actionable Tips - Show first if there are filters to clear */}
      <ActionableTipsSection
        tips={suggestions.actionable_tips}
        activeFiltersCount={activeFiltersCount || suggestions.active_filters_count}
        onClearFilters={onClearFilters}
        onChangeEntityType={onChangeEntityType}
        isRTL={isRTL}
        language={language}
      />

      {/* Smart Filter Presets - Show when complex filters return no results */}
      {shouldShowPresets && (
        <FilterPresetsSection
          presets={recommendedPresets}
          onApplyPreset={onApplyPreset}
          maxVisible={4}
        />
      )}

      {/* Typo Corrections - Most prominent */}
      <TypoCorrectionsSection
        corrections={suggestions.typo_corrections}
        onSelect={onSearchSuggestion}
        isRTL={isRTL}
      />

      {/* Related Terms */}
      <RelatedTermsSection
        terms={suggestions.related_terms}
        onSelect={onSearchSuggestion}
        isRTL={isRTL}
        language={language}
      />

      {/* Workspace Search History */}
      <WorkspaceHistorySection
        history={suggestions.workspace_history || []}
        onSelect={onSearchSuggestion}
        isRTL={isRTL}
      />

      {/* Popular Searches */}
      <PopularSearchesSection
        searches={suggestions.popular_searches}
        onSelect={onSearchSuggestion}
        isRTL={isRTL}
      />

      {/* Recently Added Content */}
      <RecentContentSection
        content={suggestions.recent_content}
        onContentClick={onContentClick}
        isRTL={isRTL}
        language={language}
      />

      {/* Create New Entity */}
      <CreateEntitySection
        suggestion={suggestions.create_suggestion}
        onCreateEntity={onCreateEntity}
        isRTL={isRTL}
        language={language}
      />

      {/* Search Tips */}
      <SearchTipsSection tips={suggestions.search_tips} isRTL={isRTL} />
    </div>
  )
}

export default IntelligentSearchSuggestions
