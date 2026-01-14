/**
 * EnhancedSearchInput Component
 * Feature: Enhanced search with real-time suggestions, fuzzy matching, search history
 * Description: Search input with real-time suggestions dropdown, keyboard navigation,
 *              search history, and fuzzy matching for typos
 */

import { forwardRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, Clock, TrendingUp, FileText, Tag, User, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useEnhancedSearch, highlightMatch } from '@/hooks/useEnhancedSearch'
import type {
  SearchSuggestion,
  HistorySuggestion,
  CategorizedSuggestions,
  SuggestionType,
} from '@/types/enhanced-search.types'
import { isSearchSuggestion } from '@/types/enhanced-search.types'

// =============================================================================
// Types
// =============================================================================

interface EnhancedSearchInputProps {
  onSearch: (query: string) => void
  onSuggestionSelect?: (suggestion: SearchSuggestion | HistorySuggestion) => void
  entityTypes?: string[]
  placeholder?: string
  autoFocus?: boolean
  debounceMs?: number
  className?: string
  initialValue?: string
}

// =============================================================================
// Suggestion Icon Component
// =============================================================================

function SuggestionIcon({
  type,
  className,
}: {
  type: SuggestionType | 'history'
  className?: string
}) {
  const iconProps = { className: cn('h-4 w-4', className) }

  switch (type) {
    case 'history':
      return <Clock {...iconProps} />
    case 'popular':
      return <TrendingUp {...iconProps} />
    case 'tag':
      return <Tag {...iconProps} />
    case 'name':
      return <User {...iconProps} />
    default:
      return <FileText {...iconProps} />
  }
}

// =============================================================================
// Highlighted Text Component
// =============================================================================

function HighlightedText({ text, query }: { text: string; query: string }) {
  const parts = useMemo(() => highlightMatch(text, query), [text, query])

  return (
    <span>
      {parts.map((part, index) => (
        <span
          key={index}
          className={cn(
            part.isMatch && 'bg-yellow-200 dark:bg-yellow-800 font-medium rounded px-0.5',
          )}
        >
          {part.text}
        </span>
      ))}
    </span>
  )
}

// =============================================================================
// Suggestion Item Component
// =============================================================================

interface SuggestionItemProps {
  suggestion: SearchSuggestion | HistorySuggestion
  query: string
  isSelected: boolean
  onClick: () => void
  isRTL: boolean
}

function SuggestionItem({ suggestion, query, isSelected, onClick, isRTL }: SuggestionItemProps) {
  const { t } = useTranslation('enhanced-search')

  const displayText = isSearchSuggestion(suggestion) ? suggestion.suggestion : suggestion.query
  const displayTextAr = isSearchSuggestion(suggestion) ? suggestion.suggestion_ar : null
  const suggestionType: SuggestionType = isSearchSuggestion(suggestion)
    ? suggestion.suggestion_type
    : 'history'

  // For history items, show result count
  const resultCount = !isSearchSuggestion(suggestion) ? suggestion.result_count : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 text-start transition-colors min-h-11',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        isSelected && 'bg-gray-100 dark:bg-gray-800',
      )}
    >
      <SuggestionIcon
        type={suggestionType}
        className={cn(
          'flex-shrink-0',
          suggestionType === 'history' && 'text-gray-400',
          suggestionType === 'popular' && 'text-orange-500',
          suggestionType === 'tag' && 'text-blue-500',
          suggestionType === 'title' && 'text-green-500',
        )}
      />

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          <HighlightedText
            text={isRTL && displayTextAr ? displayTextAr : displayText}
            query={query}
          />
        </div>
        {isSearchSuggestion(suggestion) && suggestion.entity_type && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {t(`entityTypes.${suggestion.entity_type}`)}
          </div>
        )}
      </div>

      {resultCount !== null && resultCount >= 0 && (
        <Badge variant="secondary" className="flex-shrink-0 text-xs">
          {resultCount} {t('results.count')}
        </Badge>
      )}

      {isSearchSuggestion(suggestion) && suggestion.similarity_score < 1 && (
        <Badge variant="outline" className="flex-shrink-0 text-xs">
          {t('suggestions.fuzzyMatch')}
        </Badge>
      )}
    </button>
  )
}

// =============================================================================
// Suggestion Section Component
// =============================================================================

interface SuggestionSectionProps {
  title: string
  items: (SearchSuggestion | HistorySuggestion)[]
  query: string
  startIndex: number
  selectedIndex: number
  onSelect: (suggestion: SearchSuggestion | HistorySuggestion) => void
  isRTL: boolean
}

function SuggestionSection({
  title,
  items,
  query,
  startIndex,
  selectedIndex,
  onSelect,
  isRTL,
}: SuggestionSectionProps) {
  if (items.length === 0) return null

  return (
    <div className="py-1">
      <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </div>
      {items.map((item, index) => (
        <SuggestionItem
          key={isSearchSuggestion(item) ? `${item.suggestion}-${index}` : item.query}
          suggestion={item}
          query={query}
          isSelected={startIndex + index === selectedIndex}
          onClick={() => onSelect(item)}
          isRTL={isRTL}
        />
      ))}
    </div>
  )
}

// =============================================================================
// Suggestions Dropdown Component
// =============================================================================

interface SuggestionsDropdownProps {
  suggestions: CategorizedSuggestions | null
  query: string
  selectedIndex: number
  onSelect: (suggestion: SearchSuggestion | HistorySuggestion) => void
  isLoading: boolean
  isRTL: boolean
}

function SuggestionsDropdown({
  suggestions,
  query,
  selectedIndex,
  onSelect,
  isLoading,
  isRTL,
}: SuggestionsDropdownProps) {
  const { t } = useTranslation('enhanced-search')

  const isEmpty =
    !suggestions ||
    (suggestions.titles.length === 0 &&
      suggestions.tags.length === 0 &&
      suggestions.popular.length === 0 &&
      suggestions.history.length === 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ms-2 text-sm text-muted-foreground">{t('suggestions.loading')}</span>
      </div>
    )
  }

  if (isEmpty && query.length >= 2) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        {t('suggestions.noResults')}
      </div>
    )
  }

  if (isEmpty) {
    return null
  }

  let currentIndex = 0

  return (
    <ScrollArea className="max-h-80">
      {/* History Section */}
      {suggestions.history.length > 0 && (
        <>
          <SuggestionSection
            title={t('suggestions.sections.history')}
            items={suggestions.history}
            query={query}
            startIndex={currentIndex}
            selectedIndex={selectedIndex}
            onSelect={onSelect}
            isRTL={isRTL}
          />
          {((currentIndex += suggestions.history.length), null)}
        </>
      )}

      {/* Titles Section */}
      {suggestions.titles.length > 0 && (
        <>
          <SuggestionSection
            title={t('suggestions.sections.titles')}
            items={suggestions.titles}
            query={query}
            startIndex={currentIndex}
            selectedIndex={selectedIndex}
            onSelect={onSelect}
            isRTL={isRTL}
          />
          {((currentIndex += suggestions.titles.length), null)}
        </>
      )}

      {/* Tags Section */}
      {suggestions.tags.length > 0 && (
        <>
          <SuggestionSection
            title={t('suggestions.sections.tags')}
            items={suggestions.tags}
            query={query}
            startIndex={currentIndex}
            selectedIndex={selectedIndex}
            onSelect={onSelect}
            isRTL={isRTL}
          />
          {((currentIndex += suggestions.tags.length), null)}
        </>
      )}

      {/* Popular Section */}
      {suggestions.popular.length > 0 && (
        <SuggestionSection
          title={t('suggestions.sections.popular')}
          items={suggestions.popular}
          query={query}
          startIndex={currentIndex}
          selectedIndex={selectedIndex}
          onSelect={onSelect}
          isRTL={isRTL}
        />
      )}
    </ScrollArea>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export const EnhancedSearchInput = forwardRef<HTMLDivElement, EnhancedSearchInputProps>(
  function EnhancedSearchInput(
    {
      onSearch,
      onSuggestionSelect,
      entityTypes = ['dossier'],
      placeholder,
      autoFocus = false,
      debounceMs = 300,
      className,
      initialValue = '',
    },
    ref,
  ) {
    const { t, i18n } = useTranslation('enhanced-search')
    const isRTL = i18n.language === 'ar'

    const {
      query,
      isLoading,
      showSuggestions,
      suggestions,
      selectedSuggestionIndex,
      inputRef,
      handleQueryChange,
      handleSearch,
      handleSuggestionSelect,
      handleKeyDown,
      handleFocus,
      handleBlur,
      clearQuery,
    } = useEnhancedSearch(entityTypes, {
      debounceMs,
      onSearch,
      onSuggestionSelect,
    })

    // Handle submit
    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
          handleSearch(query)
        }
      },
      [query, handleSearch],
    )

    return (
      <div ref={ref} className={cn('relative w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <form onSubmit={handleSubmit} className="relative">
          {/* Search Icon */}
          <Search
            className={cn(
              'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
              'start-3',
            )}
          />

          {/* Input Field */}
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder || t('search.placeholder')}
            autoFocus={autoFocus}
            className={cn(
              'ps-10 pe-20 min-h-12 text-base',
              'focus-visible:ring-2 focus-visible:ring-primary',
            )}
            aria-label={t('a11y.searchInput')}
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            role="combobox"
          />

          {/* Clear & Search Buttons */}
          <div className={cn('absolute top-1/2 -translate-y-1/2 flex items-center gap-1', 'end-2')}>
            {/* Loading Indicator */}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground me-1" />}

            {/* Clear Button */}
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearQuery}
                className="h-7 w-7 p-0 rounded-full"
                aria-label={t('search.clear')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {/* Search Button */}
            <Button type="submit" size="sm" className="h-8 px-3" disabled={!query.trim()}>
              <Search className="h-4 w-4 me-1" />
              <span className="hidden sm:inline">{t('search.button')}</span>
            </Button>
          </div>
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div
            className={cn(
              'absolute z-50 w-full mt-1',
              'bg-background border border-border rounded-lg shadow-lg',
              'overflow-hidden',
            )}
            role="listbox"
            aria-label={t('a11y.suggestionsList')}
          >
            <SuggestionsDropdown
              suggestions={suggestions}
              query={query}
              selectedIndex={selectedSuggestionIndex}
              onSelect={handleSuggestionSelect}
              isLoading={isLoading}
              isRTL={isRTL}
            />

            {/* Keyboard Hints */}
            {suggestions && (
              <div className="px-3 py-2 border-t border-border bg-muted/50 text-xs text-muted-foreground flex items-center justify-between">
                <span>{t('suggestions.keyboardHints.navigate')}</span>
                <span>{t('suggestions.keyboardHints.select')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  },
)

export default EnhancedSearchInput
