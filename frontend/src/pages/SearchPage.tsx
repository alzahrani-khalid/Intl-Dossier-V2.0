/**
 * SearchPage Component
 * Feature: 015-search-retrieval-spec
 * Task: T046
 *
 * Integrates search components:
 * - GlobalSearchInput
 * - SearchSuggestions
 * - EntityTypeTabs
 * - SearchResultsList
 * - TanStack Router integration
 * - Error boundary
 * - Loading & error states
 * - URL query params support
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { GlobalSearchInput } from '@/components/GlobalSearchInput';
import { SearchSuggestions } from '@/components/SearchSuggestions';
import { EntityTypeTabs, EntityType } from '@/components/EntityTypeTabs';
import { SearchResultsList } from '@/components/SearchResultsList';
import { SearchErrorBoundary } from '@/components/SearchErrorBoundary';
import { useSearch as useSearchQuery } from '@/hooks/useSearch';
import { useSuggestions } from '@/hooks/useSuggestions';
import { useSemanticSearch } from '@/hooks/useSemanticSearch';
import { useSearchKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

export function SearchPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const searchParams = useSearch({ from: '/search' });
  const isRTL = i18n.language === 'ar';

  // Local state
  const [query, setQuery] = useState<string>(searchParams.q || '');
  const [selectedType, setSelectedType] = useState<EntityType>(
    (searchParams.type as EntityType) || 'all'
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [useSemanticMode, setUseSemanticMode] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search queries
  const {
    data: searchData,
    isLoading: isSearchLoading,
    error: searchError,
    refetch: refetchSearch,
  } = useSearchQuery(query, {
    entityTypes: selectedType === 'all' ? undefined : [selectedType],
    limit: 20,
    includeArchived: searchParams.includeArchived === 'true',
  });

  const { suggestions, isLoading: isSuggestionsLoading } = useSuggestions(query);

  const {
    data: semanticData,
    isLoading: isSemanticLoading,
    mutate: performSemanticSearch,
  } = useSemanticSearch();

  // Keyboard navigation
  useSearchKeyboardNavigation({
    searchInputRef,
    isOpen: showSuggestions,
    onClose: () => setShowSuggestions(false),
    onSubmit: handleSearchSubmit,
    onNavigate: (direction) => {
      if (direction === 'down') {
        setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      } else {
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }
    },
    onSelect: () => {
      if (suggestions[activeIndex]) {
        handleSuggestionSelect(suggestions[activeIndex]);
      }
    },
  });

  // Update URL params when search changes
  useEffect(() => {
    if (query) {
      navigate({
        to: '/search',
        search: {
          q: query,
          type: selectedType !== 'all' ? selectedType : undefined,
          includeArchived: searchParams.includeArchived,
        },
      });
    }
  }, [query, selectedType, navigate, searchParams.includeArchived]);

  // Handlers
  function handleSearchSubmit() {
    setShowSuggestions(false);

    if (useSemanticMode) {
      performSemanticSearch({
        query,
        entityTypes:
          selectedType === 'all' ? ['positions', 'documents'] : [selectedType],
        includeKeywordResults: true,
      });
    } else {
      refetchSearch();
    }
  }

  function handleSuggestionSelect(suggestion: any) {
    setQuery(isRTL ? suggestion.title_ar : suggestion.title_en);
    setShowSuggestions(false);
    handleSearchSubmit();
  }

  function handleQueryChange(newQuery: string) {
    setQuery(newQuery);
    setShowSuggestions(newQuery.length > 0);
    setActiveIndex(0);
  }

  function handleTypeChange(type: EntityType) {
    setSelectedType(type);
    if (query) {
      refetchSearch();
    }
  }

  // Determine which data to display
  const displayData = useSemanticMode ? semanticData : searchData;
  const isLoading = useSemanticMode ? isSemanticLoading : isSearchLoading;

  return (
    <SearchErrorBoundary>
      <div className="container mx-auto max-w-6xl px-4 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('search.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('search.description')}</p>
        </div>

        {/* Search Input with Suggestions */}
        <div className="relative mb-6">
          <GlobalSearchInput
            ref={searchInputRef}
            value={query}
            onChange={handleQueryChange}
            onSubmit={handleSearchSubmit}
            onFocus={() => query && setShowSuggestions(true)}
            placeholder={t('search.placeholder')}
            isLoading={isSuggestionsLoading}
          />

          <SearchSuggestions
            suggestions={suggestions}
            isOpen={showSuggestions}
            activeIndex={activeIndex}
            onSelect={handleSuggestionSelect}
            onClose={() => setShowSuggestions(false)}
            onActiveIndexChange={setActiveIndex}
            isLoading={isSuggestionsLoading}
          />
        </div>

        {/* Search Mode Toggle */}
        {query && (
          <div className="mb-4 flex items-center gap-4">
            <button
              onClick={() => setUseSemanticMode(false)}
              className={`rounded-md px-4 py-2 transition-colors ${
                !useSemanticMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {t('search.modes.keyword')}
            </button>
            <button
              onClick={() => setUseSemanticMode(true)}
              className={`rounded-md px-4 py-2 transition-colors ${
                useSemanticMode
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {t('search.modes.semantic')}
            </button>

            {/* Include archived toggle */}
            <label className="ms-auto flex items-center gap-2">
              <input
                type="checkbox"
                checked={searchParams.includeArchived === 'true'}
                onChange={(e) => {
                  navigate({
                    to: '/search',
                    search: {
                      ...searchParams,
                      includeArchived: e.target.checked ? 'true' : undefined,
                    },
                  });
                }}
                className="size-4 rounded text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('search.includeArchived')}
              </span>
            </label>
          </div>
        )}

        {/* Entity Type Tabs */}
        {displayData && (
          <div className="mb-6">
            <EntityTypeTabs
              selectedType={selectedType}
              counts={{
                all: displayData.counts?.total || 0,
                dossiers: displayData.counts?.dossiers || 0,
                people: displayData.counts?.people || 0,
                engagements: displayData.counts?.engagements || 0,
                positions: displayData.counts?.positions || 0,
                mous: displayData.counts?.mous || 0,
                documents: displayData.counts?.documents || 0,
              }}
              onTypeChange={handleTypeChange}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Search Results */}
        {searchError ? (
          <div className="py-12 text-center">
            <div className="mb-4 text-4xl">❌</div>
            <h3 className="mb-2 text-lg font-semibold text-red-600 dark:text-red-400">
              {t('search.error.title')}
            </h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              {searchError instanceof Error ? searchError.message : t('search.error.generic')}
            </p>
            <button
              onClick={() => refetchSearch()}
              className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              {t('search.error.retry')}
            </button>
          </div>
        ) : (
          <SearchResultsList
            results={displayData?.results || []}
            exactMatches={displayData?.exactMatches}
            isLoading={isLoading}
            hasMore={displayData?.hasMore}
            onLoadMore={() => {
              // Implement pagination
            }}
            typoSuggestions={displayData?.typoSuggestions}
            searchTips={
              query && !isLoading && !displayData?.results?.length
                ? [
                    t('search.tips.tryDifferentKeywords'),
                    t('search.tips.useOrOperator'),
                    t('search.tips.checkSpelling'),
                  ]
                : []
            }
          />
        )}

        {/* Performance metrics (dev mode) */}
        {process.env.NODE_ENV === 'development' && displayData?.tookMs && (
          <div className="mt-6 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <div>Search took: {displayData.tookMs}ms</div>
              {displayData.cacheHit !== undefined && (
                <div>Cache hit: {displayData.cacheHit ? 'Yes' : 'No'}</div>
              )}
              {displayData.counts?.restricted && (
                <div className="text-orange-600 dark:text-orange-400">
                  Restricted results: {displayData.counts.restricted}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SearchErrorBoundary>
  );
}
