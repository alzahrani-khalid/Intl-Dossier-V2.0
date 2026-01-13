/**
 * EntityComparisonPage
 * @feature entity-comparison-view
 *
 * Main page component for entity comparison feature.
 * Provides a two-step flow: entity selection -> comparison view.
 */

import { memo, useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, GitCompare, Loader2, AlertCircle, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  EntityComparisonSelector,
  EntityComparisonTable,
  ComparisonExport,
} from '@/components/entity-comparison'
import {
  useEntityComparison,
  useEntitySelection,
  useComparisonFilters,
} from '@/hooks/useEntityComparison'
import type { DossierType } from '@/lib/dossier-type-guards'
import type { ComparisonViewMode, ComparisonUrlState } from '@/types/entity-comparison.types'

/**
 * Props for EntityComparisonPage
 */
interface EntityComparisonPageProps {
  /** Initial URL state from route search params */
  initialState?: ComparisonUrlState
  className?: string
}

/**
 * Main EntityComparisonPage component
 */
export const EntityComparisonPage = memo(function EntityComparisonPage({
  initialState,
  className,
}: EntityComparisonPageProps) {
  const { t, i18n } = useTranslation('entity-comparison')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()

  // Entity selection state
  const {
    selectedType,
    setSelectedType,
    selectedIds,
    setSelectedIds,
    searchQuery,
    setSearchQuery,
    maxSelections,
    minSelections,
  } = useEntitySelection()

  // Comparison filters state
  const { filters, setFilters, filteredComparisons } = useComparisonFilters({
    showOnlyDifferences: initialState?.diff || false,
  })

  // View mode state
  const [viewMode, setViewMode] = useState<ComparisonViewMode>(initialState?.view || 'table')

  // Step tracking (1 = selection, 2 = comparison)
  const [step, setStep] = useState<1 | 2>(1)

  // Initialize from URL state
  useEffect(() => {
    if (initialState?.type) {
      setSelectedType(initialState.type)
    }
    if (initialState?.ids) {
      const ids = initialState.ids.split(',').filter(Boolean)
      if (ids.length >= 2) {
        setSelectedIds(ids)
        // If we have valid IDs and type, go directly to comparison
        if (initialState.type) {
          setStep(2)
        }
      }
    }
  }, [initialState, setSelectedType, setSelectedIds])

  // Fetch comparison data when in step 2
  const {
    comparisonResult,
    isLoading: isComparing,
    isError: hasComparisonError,
    errors,
  } = useEntityComparison(step === 2 ? selectedType : null, step === 2 ? selectedIds : [])

  // Filtered fields based on current filters
  const filteredFields = useMemo(() => {
    if (!comparisonResult) return []
    return filteredComparisons(comparisonResult.fieldComparisons)
  }, [comparisonResult, filteredComparisons])

  // Update URL when state changes
  const updateUrl = useCallback(
    (type: DossierType | null, ids: string[], view: ComparisonViewMode, diff: boolean) => {
      navigate({
        to: '/compare',
        search: {
          type: type || undefined,
          ids: ids.length > 0 ? ids.join(',') : undefined,
          view: view !== 'table' ? view : undefined,
          diff: diff || undefined,
        },
        replace: true,
      })
    },
    [navigate],
  )

  // Handle compare button click
  const handleCompare = useCallback(() => {
    if (selectedType && selectedIds.length >= minSelections) {
      setStep(2)
      updateUrl(selectedType, selectedIds, viewMode, filters.showOnlyDifferences)
    }
  }, [selectedType, selectedIds, minSelections, viewMode, filters, updateUrl])

  // Handle back to selection
  const handleBack = useCallback(() => {
    setStep(1)
    updateUrl(selectedType, [], viewMode, filters.showOnlyDifferences)
  }, [selectedType, viewMode, filters, updateUrl])

  // Handle view mode change
  const handleViewModeChange = useCallback(
    (mode: ComparisonViewMode) => {
      setViewMode(mode)
      updateUrl(selectedType, selectedIds, mode, filters.showOnlyDifferences)
    },
    [selectedType, selectedIds, filters, updateUrl],
  )

  // Handle filters change
  const handleFiltersChange = useCallback(
    (newFilters: typeof filters) => {
      setFilters(newFilters)
      updateUrl(selectedType, selectedIds, viewMode, newFilters.showOnlyDifferences)
    },
    [selectedType, selectedIds, viewMode, updateUrl, setFilters],
  )

  // Handle refresh comparison
  const handleRefresh = useCallback(() => {
    setStep(1)
    setSelectedIds([])
    setSearchQuery('')
    setSelectedType(null)
    navigate({ to: '/compare', search: {}, replace: true })
  }, [navigate, setSelectedIds, setSearchQuery, setSelectedType])

  return (
    <div
      className={cn('container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            {step === 2 && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="flex-shrink-0">
                <ArrowLeft className={cn('h-5 w-5', isRTL && 'rotate-180')} />
              </Button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                <GitCompare className="h-6 w-6 sm:h-7 sm:w-7" />
                {t('title')}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">{t('subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {step === 2 && comparisonResult && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4 me-2" />
              <span className="hidden sm:inline">{t('actions.refresh')}</span>
            </Button>
            <ComparisonExport comparisonResult={comparisonResult} />
          </div>
        )}
      </div>

      {/* Step 1: Entity Selection */}
      {step === 1 && (
        <EntityComparisonSelector
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCompare={handleCompare}
          minSelections={minSelections}
          maxSelections={maxSelections}
        />
      )}

      {/* Step 2: Comparison View */}
      {step === 2 && (
        <>
          {/* Loading state */}
          {isComparing && (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">
                {t('loading.comparison')}
              </p>
            </div>
          )}

          {/* Error state */}
          {hasComparisonError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('errors.compareFailed')}</AlertTitle>
              <AlertDescription>
                {errors?.[0]?.message || t('errors.networkError')}
              </AlertDescription>
            </Alert>
          )}

          {/* Comparison table */}
          {comparisonResult && !isComparing && (
            <EntityComparisonTable
              comparisonResult={comparisonResult}
              viewMode={viewMode}
              filters={filters}
              filteredFields={filteredFields}
              onViewModeChange={handleViewModeChange}
              onFiltersChange={handleFiltersChange}
            />
          )}

          {/* Empty state (no comparison data) */}
          {!comparisonResult && !isComparing && !hasComparisonError && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('errors.compareFailed')}</AlertTitle>
              <AlertDescription>{t('errors.typeMismatch')}</AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  )
})

export default EntityComparisonPage
