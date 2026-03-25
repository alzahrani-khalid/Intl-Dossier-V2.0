/**
 * UnifiedKanbanHeader - Board header with Tabs view toggle and Command palette filters
 * Feature: 034-unified-kanban (redesigned)
 */

import { useTranslation } from 'react-i18next'
import {
  LayoutGrid,
  List,
  Table2,
  Filter,
  RefreshCw,
  Columns3,
  Signal,
  AlertTriangle,
  Search,
  X,
  Check,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import type { KanbanColumnMode, WorkSource, Priority } from '@/types/work-item.types'
import { useDirection } from '@/hooks/useDirection'

interface UnifiedKanbanHeaderProps {
  columnMode: KanbanColumnMode
  onColumnModeChange: (mode: KanbanColumnMode) => void
  viewMode?: 'list' | 'board' | 'table'
  onViewModeChange?: (mode: 'list' | 'board' | 'table') => void
  sourceFilter?: WorkSource[]
  onSourceFilterChange?: (sources: WorkSource[]) => void
  priorityFilter?: Priority[]
  onPriorityFilterChange?: (priorities: Priority[]) => void
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

const SOURCES: WorkSource[] = ['task', 'commitment', 'intake']
const PRIORITIES: Priority[] = ['urgent', 'high', 'medium', 'low']

export function UnifiedKanbanHeader({
  columnMode,
  onColumnModeChange,
  viewMode = 'board',
  onViewModeChange,
  sourceFilter = [],
  onSourceFilterChange,
  priorityFilter = [],
  onPriorityFilterChange,
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
  const { t } = useTranslation('unified-kanban')
  const { isRTL } = useDirection()
const [filtersOpen, setFiltersOpen] = useState(false)

  const toggleSource = (source: WorkSource) => {
    if (!onSourceFilterChange) return

    if (sourceFilter.includes(source)) {
      onSourceFilterChange(sourceFilter.filter((s) => s !== source))
    } else {
      onSourceFilterChange([...sourceFilter, source])
    }
  }

  const togglePriority = (priority: Priority) => {
    if (!onPriorityFilterChange) return

    if (priorityFilter.includes(priority)) {
      onPriorityFilterChange(priorityFilter.filter((p) => p !== priority))
    } else {
      onPriorityFilterChange([...priorityFilter, priority])
    }
  }

  const clearAllFilters = () => {
    onSourceFilterChange?.([])
    onPriorityFilterChange?.([])
  }

  const activeFilterCount = sourceFilter.length + priorityFilter.length

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
    >
      {/* Top row: Title, badges, refresh, view toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-semibold">{t('title')}</h1>
          {totalCount > 0 && (
            <Badge variant="outline" className="text-xs tabular-nums">
              {totalCount}
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

          {/* View toggle tabs */}
          {showViewToggle && onViewModeChange && (
            <Tabs
              value={viewMode}
              onValueChange={(value) => onViewModeChange(value as 'list' | 'board' | 'table')}
            >
              <TabsList className="h-9">
                <TabsTrigger value="board" className="h-7 px-2.5 gap-1">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">{t('viewModes.board')}</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="h-7 px-2.5 gap-1">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">{t('viewModes.list')}</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="h-7 px-2.5 gap-1">
                  <Table2 className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">{t('viewModes.table')}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      {/* Bottom row: Group by, search, filters */}
      <div className="flex flex-wrap items-center gap-3">
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

        {/* Filters button with Command palette */}
        {showFilters && onSourceFilterChange && (
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">{t('filters.title')}</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-5 px-1 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align={isRTL ? 'end' : 'start'}>
              <Command>
                <CommandList>
                  <CommandGroup heading={t('filters.source')}>
                    {SOURCES.map((source) => (
                      <CommandItem
                        key={source}
                        onSelect={() => toggleSource(source)}
                        className="gap-2"
                      >
                        <div
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded-sm border',
                            sourceFilter.includes(source)
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'opacity-50',
                          )}
                        >
                          {sourceFilter.includes(source) && <Check className="h-3 w-3" />}
                        </div>
                        {t(`sources.${source}`)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading={t('filters.priority')}>
                    {PRIORITIES.map((priority) => (
                      <CommandItem
                        key={priority}
                        onSelect={() => togglePriority(priority)}
                        className="gap-2"
                      >
                        <div
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded-sm border',
                            priorityFilter.includes(priority)
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'opacity-50',
                          )}
                        >
                          {priorityFilter.includes(priority) && <Check className="h-3 w-3" />}
                        </div>
                        {t(`priority.${priority}`)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {activeFilterCount > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={clearAllFilters}
                          className="justify-center text-center text-sm text-muted-foreground"
                        >
                          {t('filters.clearFilters')}
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                  <CommandEmpty>{t('filters.searchPlaceholder')}</CommandEmpty>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
}
