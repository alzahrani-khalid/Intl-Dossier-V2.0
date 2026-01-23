/**
 * DossierSearchPage Component
 * Feature: Dossier-first search experience
 *
 * Redesigned search page that emphasizes dossier discovery.
 * Search results are organized in two sections:
 * - DOSSIERS: Matching dossiers with type badges and key stats
 * - RELATED WORK: Items linked to matching dossiers
 *
 * Filters include: All Types dropdown, Status (Active/Archived), My Dossiers toggle
 *
 * Mobile-first, RTL-compatible design.
 */

import React, { useRef, useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Search, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getDossierRouteSegment } from '@/lib/dossier-routes'
import { DossierFirstSearchResults } from '@/components/Search/DossierFirstSearchResults'
import { DossierSearchFilters, DossierTypeChips } from '@/components/Search/DossierSearchFilters'
import { useDossierFirstSearch, DEFAULT_FILTERS } from '@/hooks/useDossierFirstSearch'
import type {
  DossierSearchResult,
  RelatedWorkItem,
  DossierSearchFilters as FilterState,
} from '@/types/dossier-search.types'
import type { DossierType } from '@/lib/dossier-type-guards'

interface SearchParams {
  q?: string
  type?: DossierType | 'all'
  status?: 'all' | 'active' | 'archived'
  myDossiers?: string
}

export function DossierSearchPage() {
  const { t, i18n } = useTranslation('dossier-search')
  const navigate = useNavigate()
  const searchParams = useSearch({ from: '/_protected/search' }) as SearchParams
  const isRTL = i18n.language === 'ar'
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize filters from URL params
  const initialFilters: Partial<FilterState> = {
    types: searchParams.type && searchParams.type !== 'all' ? [searchParams.type] : 'all',
    status: searchParams.status || 'all',
    myDossiersOnly: searchParams.myDossiers === 'true',
  }

  // Use the dossier-first search hook
  const {
    query,
    filters,
    dossiers,
    relatedWork,
    dossiersTotal,
    relatedWorkTotal,
    hasMoreDossiers,
    hasMoreWork,
    typeCounts,
    isLoading,
    isFetching,
    tookMs,
    setQuery,
    updateFilters,
    loadMoreDossiers,
    loadMoreWork,
    clearSearch,
  } = useDossierFirstSearch(searchParams.q || '', initialFilters)

  // Sync URL params with search state
  useEffect(() => {
    const newParams: Record<string, string | undefined> = {
      q: query || undefined,
      type: filters.types !== 'all' && Array.isArray(filters.types) ? filters.types[0] : undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
      myDossiers: filters.myDossiersOnly ? 'true' : undefined,
    }

    // Only update if something changed
    if (
      newParams.q !== searchParams.q ||
      newParams.type !== searchParams.type ||
      newParams.status !== searchParams.status ||
      newParams.myDossiers !== searchParams.myDossiers
    ) {
      navigate({
        to: '/search',
        search: newParams,
        replace: true,
      })
    }
  }, [query, filters, navigate, searchParams])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Handle search input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  // Handle search submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Query is already updated via setQuery, just need to blur
    inputRef.current?.blur()
  }

  // Handle clear
  const handleClear = () => {
    clearSearch()
    inputRef.current?.focus()
  }

  // Handle dossier click
  const handleDossierClick = (dossier: DossierSearchResult) => {
    const routeSegment = getDossierRouteSegment(dossier.type)
    navigate({ to: `/dossiers/${routeSegment}/${dossier.id}` })
  }

  // Handle work item click
  const handleWorkItemClick = (item: RelatedWorkItem) => {
    // Navigate based on work item type
    switch (item.type) {
      case 'position':
        navigate({ to: `/positions/${item.id}` })
        break
      case 'document':
        navigate({ to: `/documents/${item.id}` })
        break
      case 'engagement':
        navigate({ to: `/engagements/${item.id}` })
        break
      case 'task':
        navigate({ to: `/my-work?taskId=${item.id}` })
        break
      case 'commitment':
        navigate({ to: `/my-work?commitmentId=${item.id}` })
        break
      case 'intake':
        navigate({ to: `/intake/${item.id}` })
        break
      case 'mou':
        navigate({ to: `/mous/${item.id}` })
        break
      default:
        // Navigate to parent dossier context
        navigate({
          to: `/dossiers/${getDossierRouteSegment(item.dossier_context.type)}/${item.dossier_context.id}`,
        })
    }
  }

  // Has results
  const hasResults = dossiers.length > 0 || relatedWork.length > 0
  const hasQuery = query.trim().length > 0

  return (
    <div
      className="container mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
          {t('page.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t('page.description')}</p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <Search
            className={cn(
              'absolute top-1/2 -translate-y-1/2 size-5 text-gray-400',
              isRTL ? 'end-3' : 'start-3',
            )}
          />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={t('search.placeholder')}
            className={cn('h-12 text-lg', isRTL ? 'pe-12 ps-10' : 'ps-12 pe-10')}
            aria-label={t('search.label')}
          />
          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600',
                isRTL ? 'start-3' : 'end-3',
              )}
              aria-label={t('search.clear')}
            >
              <X className="size-5" />
            </button>
          )}
          {/* Loading indicator */}
          {(isLoading || isFetching) && (
            <div className={cn('absolute top-1/2 -translate-y-1/2', isRTL ? 'start-10' : 'end-10')}>
              <Loader2 className="size-5 animate-spin text-blue-500" />
            </div>
          )}
        </div>
      </form>

      {/* Filters */}
      <div className="mb-6">
        <DossierSearchFilters
          filters={filters}
          onChange={updateFilters}
          typeCounts={typeCounts}
          disabled={isLoading}
        />
      </div>

      {/* Alternative: Type chips (uncomment to use instead of dropdown) */}
      {/*
      <div className="mb-6">
        <DossierTypeChips
          selectedType={Array.isArray(filters.types) ? filters.types[0] : 'all'}
          onChange={(type) => updateFilters({
            types: type === 'all' ? 'all' : [type],
          })}
          counts={typeCounts}
          disabled={isLoading}
        />
      </div>
      */}

      {/* Results */}
      {hasQuery ? (
        <>
          {/* Results summary */}
          {hasResults && !isLoading && (
            <div className="mb-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>
                {t('results.summary', {
                  dossiers: dossiersTotal,
                  work: relatedWorkTotal,
                })}
              </span>
              {tookMs !== undefined && process.env.NODE_ENV === 'development' && (
                <span className="text-xs">{t('results.time', { ms: tookMs })}</span>
              )}
            </div>
          )}

          <DossierFirstSearchResults
            dossiers={dossiers}
            relatedWork={relatedWork}
            dossiersTotal={dossiersTotal}
            relatedWorkTotal={relatedWorkTotal}
            isLoading={isLoading}
            searchQuery={query}
            hasMoreDossiers={hasMoreDossiers}
            hasMoreWork={hasMoreWork}
            onLoadMoreDossiers={loadMoreDossiers}
            onLoadMoreWork={loadMoreWork}
            onDossierClick={handleDossierClick}
            onWorkItemClick={handleWorkItemClick}
          />
        </>
      ) : (
        /* Empty state - no query */
        <div className="py-12 text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('empty.noQuery.title')}
          </h3>
          <p className="mx-auto max-w-md text-gray-600 dark:text-gray-400">
            {t('empty.noQuery.description')}
          </p>
          {/* Quick action suggestions */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['Saudi Arabia', 'UN', 'G20', 'climate'].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => setQuery(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard shortcut hint */}
      <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
        {t('hints.keyboard')}
      </div>
    </div>
  )
}
