/**
 * UnifiedKanbanHeader - Board header with mode switcher and filters
 * Feature: 034-unified-kanban
 */

import { useTranslation } from 'react-i18next'
import {
  LayoutGrid,
  List,
  Filter,
  RefreshCw,
  Columns3,
  Signal,
  AlertTriangle,
  Search,
  X,
} from 'lucide-react'
import { useState, useCallback } from 'react'
import { useDebouncedCallback } from 'use-debounce'
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
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { KanbanColumnMode, WorkSource } from '@/types/work-item.types'

interface UnifiedKanbanHeaderProps {
  columnMode: KanbanColumnMode
  onColumnModeChange: (mode: KanbanColumnMode) => void
  viewMode?: 'list' | 'board'
  onViewModeChange?: (mode: 'list' | 'board') => void
  sourceFilter?: WorkSource[]
  onSourceFilterChange?: (sources: WorkSource[]) => void
  showFilters?: boolean
  showModeSwitch?: boolean
  showViewToggle?: boolean
  isRefreshing?: boolean
  onRefresh?: () => void
  totalCount?: number
  overdueCount?: number
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export function UnifiedKanbanHeader({
  columnMode,
  onColumnModeChange,
  viewMode = 'board',
  onViewModeChange,
  sourceFilter = [],
  onSourceFilterChange,
  showFilters = true,
  showModeSwitch = true,
  showViewToggle = true,
  isRefreshing = false,
  onRefresh,
  totalCount = 0,
  overdueCount = 0,
  searchQuery = '',
  onSearchChange,
}: UnifiedKanbanHeaderProps) {
  const { t, i18n } = useTranslation('unified-kanban')
  const isRTL = i18n.language === 'ar'

  const toggleSource = (source: WorkSource) => {
    if (!onSourceFilterChange) return

    if (sourceFilter.includes(source)) {
      onSourceFilterChange(sourceFilter.filter((s) => s !== source))
    } else {
      onSourceFilterChange([...sourceFilter, source])
    }
  }

  // Search with 300ms debounce
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const debouncedSearch = useDebouncedCallback((value: string) => {
    onSearchChange?.(value)
  }, 300)

  const handleSearchInput = useCallback(
    (value: string) => {
      setLocalSearch(value)
      debouncedSearch(value)
    },
    [debouncedSearch],
  )

  const clearSearch = useCallback(() => {
    setLocalSearch('')
    onSearchChange?.('')
  }, [onSearchChange])

  return (
    <div
      className={cn(
        'flex flex-col gap-3 px-4 sm:px-6 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top row: Title and View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-semibold">{t('title')}</h1>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalCount} {t('accessibility.itemCount', { count: totalCount })}
            </Badge>
          )}
          {overdueCount > 0 && (
            <Badge variant="destructive" className="text-xs flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {overdueCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-9 w-9"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              <span className="sr-only">{t('actions.refresh')}</span>
            </Button>
          )}

          {/* View toggle */}
          {showViewToggle && onViewModeChange && (
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && onViewModeChange(value as 'list' | 'board')}
              className="bg-muted rounded-md p-0.5"
            >
              <ToggleGroupItem
                value="list"
                aria-label={t('viewModes.list')}
                className="h-8 px-2.5 data-[state=on]:bg-background"
              >
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="board"
                aria-label={t('viewModes.board')}
                className="h-8 px-2.5 data-[state=on]:bg-background"
              >
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
      </div>

      {/* Bottom row: Search, Column mode, and filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        {onSearchChange && (
          <div className="relative w-full sm:w-auto sm:min-w-[200px] sm:max-w-[280px]">
            <Search
              className={cn(
                'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
                isRTL ? 'end-3' : 'start-3',
              )}
            />
            <Input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder={t('filters.searchPlaceholder', 'Search work items...')}
              className={cn('h-9 text-sm', isRTL ? 'pe-10 ps-8' : 'ps-10 pe-8')}
            />
            {localSearch && (
              <button
                type="button"
                onClick={clearSearch}
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 p-1 rounded-sm hover:bg-muted',
                  isRTL ? 'start-1.5' : 'end-1.5',
                )}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* Column mode selector */}
        {showModeSwitch && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('columnModes.label')}:</span>
            <Select
              value={columnMode}
              onValueChange={(value) => onColumnModeChange(value as KanbanColumnMode)}
            >
              <SelectTrigger className="w-[140px] sm:w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">
                  <div className="flex items-center gap-2">
                    <Columns3 className="h-4 w-4" />
                    {t('columnModes.status')}
                  </div>
                </SelectItem>
                <SelectItem value="priority">
                  <div className="flex items-center gap-2">
                    <Signal className="h-4 w-4" />
                    {t('columnModes.priority')}
                  </div>
                </SelectItem>
                <SelectItem value="tracking_type">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {t('columnModes.trackingType')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Source filter chips */}
        {showFilters && onSourceFilterChange && (
          <div className="flex items-center gap-2 ms-auto sm:ms-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {t('filters.source')}:
            </span>
            <div className="flex gap-1">
              <Button
                variant={sourceFilter.length === 0 ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => onSourceFilterChange([])}
                className="h-7 px-2 text-xs"
              >
                {t('filters.allSources')}
              </Button>
              <Button
                variant={sourceFilter.includes('task') ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => toggleSource('task')}
                className="h-7 px-2 text-xs"
              >
                {t('sources.task')}
              </Button>
              <Button
                variant={sourceFilter.includes('commitment') ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => toggleSource('commitment')}
                className="h-7 px-2 text-xs"
              >
                {t('sources.commitment')}
              </Button>
              <Button
                variant={sourceFilter.includes('intake') ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => toggleSource('intake')}
                className="h-7 px-2 text-xs"
              >
                {t('sources.intake')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
