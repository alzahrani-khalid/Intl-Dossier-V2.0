import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Search, X, Filter } from 'lucide-react'
import type { DossierFilters, DossierType, DossierStatus, SensitivityLevel } from '../types/dossier'

interface FilterPanelProps {
  filters: DossierFilters
  onFilterChange: (filters: DossierFilters) => void
  onSearch?: (query: string) => void
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function FilterPanel({ filters, onFilterChange, onSearch }: FilterPanelProps) {
  const { t } = useTranslation('dossiers')

  // Local search state for debouncing
  const [searchQuery, setSearchQuery] = useState(filters.search || '')
  const debouncedSearch = useDebounce(searchQuery, 500)

  // Available options
  const typeOptions: DossierType[] = ['country', 'organization', 'forum', 'theme']
  const statusOptions: DossierStatus[] = ['active', 'inactive', 'archived']
  const sensitivityOptions: SensitivityLevel[] = ['low', 'medium', 'high']

  // Apply debounced search
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearch)
    } else {
      onFilterChange({ ...filters, search: debouncedSearch })
    }
  }, [debouncedSearch])

  // Toggle filter value
  const toggleFilter = useCallback(
    (filterKey: keyof DossierFilters, value: string) => {
      const currentValue = filters[filterKey]

      if (filterKey === 'type' || filterKey === 'status' || filterKey === 'sensitivity') {
        // Single select
        onFilterChange({
          ...filters,
          [filterKey]: currentValue === value ? undefined : value,
        })
      } else if (filterKey === 'tags') {
        // Multi-select for tags
        const currentTags = (currentValue as string[]) || []
        const newTags = currentTags.includes(value)
          ? currentTags.filter((t) => t !== value)
          : [...currentTags, value]
        onFilterChange({
          ...filters,
          tags: newTags.length > 0 ? newTags : undefined,
        })
      }
    },
    [filters, onFilterChange],
  )

  // Reset all filters
  const handleReset = () => {
    setSearchQuery('')
    onFilterChange({
      limit: filters.limit,
    })
  }

  // Count active filters
  const activeFilterCount = [
    filters.type,
    filters.status,
    filters.sensitivity,
    filters.owner_id,
    filters.tags?.length,
    filters.search,
  ].filter(Boolean).length

  // Check if filter is active
  const isFilterActive = (filterKey: keyof DossierFilters, value: string): boolean => {
    const currentValue = filters[filterKey]
    if (Array.isArray(currentValue)) {
      return currentValue.includes(value)
    }
    return currentValue === value
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4" />
            {t('filters.title')}
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ms-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 text-xs"
              aria-label={t('filters.reset')}
            >
              {t('filters.reset')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium">
            {t('filters.search')}
          </Label>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder={t('filters.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pe-9 ps-9"
              aria-label={t('filters.search')}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute end-1 top-1/2 size-7 -translate-y-1/2 p-0"
                onClick={() => setSearchQuery('')}
                aria-label={t('clear', { ns: 'translation' })}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Type Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('filters.type')}</Label>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((type) => (
              <Badge
                key={type}
                variant={isFilterActive('type', type) ? 'default' : 'outline'}
                className="cursor-pointer transition-colors hover:bg-primary/90"
                onClick={() => toggleFilter('type', type)}
                role="checkbox"
                aria-checked={isFilterActive('type', type)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleFilter('type', type)
                  }
                }}
              >
                {t(`types.${type}`)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('filters.status')}</Label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <Badge
                key={status}
                variant={isFilterActive('status', status) ? 'default' : 'outline'}
                className="cursor-pointer transition-colors hover:bg-primary/90"
                onClick={() => toggleFilter('status', status)}
                role="checkbox"
                aria-checked={isFilterActive('status', status)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleFilter('status', status)
                  }
                }}
              >
                {t(`statuses.${status}`)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Sensitivity Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('filters.sensitivity')}</Label>
          <div className="flex flex-wrap gap-2">
            {sensitivityOptions.map((sensitivity) => (
              <Badge
                key={sensitivity}
                variant={isFilterActive('sensitivity', sensitivity) ? 'default' : 'outline'}
                className="cursor-pointer transition-colors hover:bg-primary/90"
                onClick={() => toggleFilter('sensitivity', sensitivity)}
                role="checkbox"
                aria-checked={isFilterActive('sensitivity', sensitivity)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleFilter('sensitivity', sensitivity)
                  }
                }}
              >
                {t(`sensitivity.${sensitivity}`)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <div className="border-t pt-4">
            <p className="mb-2 text-xs text-muted-foreground">
              {t('activeFilters', { ns: 'translation' }) || 'Active filters'}:
            </p>
            <div className="flex flex-wrap gap-2">
              {filters.type && (
                <Badge variant="secondary" className="gap-1">
                  {t('filters.type')}: {t(`types.${filters.type}`)}
                  <X
                    className="size-3 cursor-pointer"
                    onClick={() => toggleFilter('type', filters.type!)}
                  />
                </Badge>
              )}
              {filters.status && (
                <Badge variant="secondary" className="gap-1">
                  {t('filters.status')}: {t(`statuses.${filters.status}`)}
                  <X
                    className="size-3 cursor-pointer"
                    onClick={() => toggleFilter('status', filters.status!)}
                  />
                </Badge>
              )}
              {filters.sensitivity && (
                <Badge variant="secondary" className="gap-1">
                  {t('filters.sensitivity')}: {t(`sensitivity.${filters.sensitivity}`)}
                  <X
                    className="size-3 cursor-pointer"
                    onClick={() => toggleFilter('sensitivity', filters.sensitivity!)}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
