/**
 * ThemeList Component
 * Feature: themes-entity-management
 *
 * Displays a list of themes with search, filtering, and pagination.
 * Mobile-first, RTL-aware design.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Filter, FolderTree, Loader2, AlertCircle, RefreshCw } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import { ThemeCard } from './ThemeCard'
import { useThemes } from '@/hooks/useThemes'
import type { Theme, ThemeWithContext, ThemeFilters } from '@/types/theme.types'
import type { DossierStatus } from '@/types/dossier'

interface ThemeListProps {
  onCreateTheme?: () => void
  onEditTheme?: (theme: Theme | ThemeWithContext) => void
  onDeleteTheme?: (id: string) => void
  onViewThemeDetails?: (id: string) => void
  onViewHierarchy?: (id: string) => void
  onAddChildTheme?: (parentId: string) => void
  className?: string
}

export function ThemeList({
  onCreateTheme,
  onEditTheme,
  onDeleteTheme,
  onViewThemeDetails,
  onViewHierarchy,
  onAddChildTheme,
  className,
}: ThemeListProps) {
  const { t, i18n } = useTranslation('themes')
  const isRTL = i18n.language === 'ar'

  // Filter state
  const [filters, setFilters] = useState<ThemeFilters>({
    search: '',
    status: undefined,
    is_standard: undefined,
    page: 1,
    limit: 20,
  })

  // Debounced search
  const [searchInput, setSearchInput] = useState('')

  // Update search with debounce
  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    // Simple debounce
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }))
    }, 300)
    return () => clearTimeout(timeoutId)
  }

  // Fetch themes
  const { data, isLoading, isError, error, refetch } = useThemes(filters)

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === 'all' ? undefined : (value as DossierStatus),
      page: 1,
    }))
  }

  // Handle standard filter toggle
  const handleStandardChange = (checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      is_standard: checked ? true : undefined,
      page: 1,
    }))
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  // Memoized themes
  const themes = useMemo(() => data?.data || [], [data])
  const pagination = data?.pagination

  return (
    <div className={cn('space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">{t('title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>

        {onCreateTheme && (
          <Button onClick={onCreateTheme} className="w-full sm:w-auto min-h-11">
            <Plus className="me-2 h-4 w-4" />
            {t('actions.create')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('tree.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="ps-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t('filters.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('tree.showAll')}</SelectItem>
            <SelectItem value="active">{t('status.active')}</SelectItem>
            <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
            <SelectItem value="archived">{t('status.archived')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Standard Only Toggle */}
        <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
          <Switch
            id="standard-filter"
            checked={filters.is_standard || false}
            onCheckedChange={handleStandardChange}
          />
          <Label htmlFor="standard-filter" className="text-sm whitespace-nowrap">
            {t('tree.showStandardOnly')}
          </Label>
        </div>

        {/* View Hierarchy Button */}
        {onViewHierarchy && (
          <Button variant="outline" onClick={() => onViewHierarchy('')} className="min-h-11">
            <FolderTree className="me-2 h-4 w-4" />
            {t('actions.viewHierarchy')}
          </Button>
        )}
      </div>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('errors.loadFailed')}</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error?.message || 'Unknown error'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="me-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && themes.length === 0 && (
        <div className="text-center py-12 px-4 border rounded-lg bg-muted/50">
          <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">
            {filters.search || filters.status || filters.is_standard
              ? t('list.emptyFiltered')
              : t('list.empty')}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            {filters.search || filters.status || filters.is_standard
              ? t('list.emptyFilteredDescription')
              : t('list.emptyDescription')}
          </p>
          {onCreateTheme && !filters.search && !filters.status && !filters.is_standard && (
            <Button onClick={onCreateTheme} className="mt-4">
              <Plus className="me-2 h-4 w-4" />
              {t('actions.create')}
            </Button>
          )}
        </div>
      )}

      {/* Theme Grid */}
      {!isLoading && !isError && themes.length > 0 && (
        <>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                onEdit={onEditTheme}
                onDelete={onDeleteTheme}
                onViewDetails={onViewThemeDetails}
                onViewHierarchy={onViewHierarchy}
                onAddChild={onAddChildTheme}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
                {pagination.total && ` (${pagination.total} total)`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ThemeList
