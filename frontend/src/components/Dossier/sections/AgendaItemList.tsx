/**
 * AgendaItemList Component
 *
 * Displays hierarchical list of forum agenda items with filtering and actions.
 * Mobile-first responsive, RTL support.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Filter, ChevronDown, FileText, Printer, Download, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { AgendaItemCard } from './AgendaItemCard'
import { useForumAgendaItems, useDeleteForumAgendaItem } from '@/hooks/useForumAgendaItems'
import type {
  ForumAgendaItemWithStats,
  AgendaItemType,
  AgendaItemStatus,
  AgendaItemPriority,
  AgendaFilters,
} from '@/types/forum-extended.types'

interface AgendaItemListProps {
  sessionId: string
  onCreateItem?: () => void
  onEditItem?: (item: ForumAgendaItemWithStats) => void
}

export function AgendaItemList({ sessionId, onCreateItem, onEditItem }: AgendaItemListProps) {
  const { t, i18n } = useTranslation('forum-management')
  const isRTL = i18n.language === 'ar'

  // Filter state
  const [filters, setFilters] = useState<Partial<AgendaFilters>>({})
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Data fetching
  const { data, isLoading, error, refetch } = useForumAgendaItems(sessionId, filters)
  const deleteItem = useDeleteForumAgendaItem()

  // Filter options
  const itemTypes: AgendaItemType[] = [
    'discussion',
    'decision',
    'information',
    'election',
    'procedural',
    'report',
    'adoption',
  ]
  const statuses: AgendaItemStatus[] = [
    'pending',
    'in_progress',
    'completed',
    'deferred',
    'withdrawn',
    'adopted',
    'rejected',
  ]
  const priorities: AgendaItemPriority[] = ['low', 'normal', 'high', 'urgent']

  // Filter agenda items by search query
  const filteredItems = useMemo(() => {
    if (!data?.data || !searchQuery.trim()) return data?.data || []

    const query = searchQuery.toLowerCase()
    const filterRecursive = (items: ForumAgendaItemWithStats[]): ForumAgendaItemWithStats[] => {
      return items.reduce<ForumAgendaItemWithStats[]>((acc, item) => {
        const matchesSearch =
          item.title_en?.toLowerCase().includes(query) ||
          item.title_ar?.toLowerCase().includes(query) ||
          item.item_number?.toLowerCase().includes(query) ||
          item.description_en?.toLowerCase().includes(query) ||
          item.description_ar?.toLowerCase().includes(query)

        // Check children
        const matchingChildren = item.children ? filterRecursive(item.children) : []

        if (matchesSearch || matchingChildren.length > 0) {
          acc.push({
            ...item,
            children: matchingChildren.length > 0 ? matchingChildren : item.children,
          })
        }

        return acc
      }, [])
    }

    return filterRecursive(data.data)
  }, [data?.data, searchQuery])

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  // Handle delete
  const handleDelete = async (item: ForumAgendaItemWithStats) => {
    if (
      window.confirm(t('agendaItems.confirmDelete', 'Are you sure you want to delete this item?'))
    ) {
      await deleteItem.mutateAsync(item.id)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-start">
              {t('agendaItems.title', 'Agenda Items')}
            </h3>
            <p className="text-sm text-muted-foreground text-start">
              {t('agendaItems.description', 'Manage forum session agenda')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Export/Print Actions */}
            <Button variant="outline" size="sm" className="hidden sm:flex gap-2 min-h-10">
              <Printer className="h-4 w-4" />
              {t('actions.printAgenda', 'Print')}
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex gap-2 min-h-10">
              <Download className="h-4 w-4" />
              {t('actions.exportAgenda', 'Export')}
            </Button>

            {/* Create Button */}
            <Button variant="default" size="sm" className="gap-2 min-h-10" onClick={onCreateItem}>
              <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              <span className="hidden sm:inline">{t('agendaItems.create', 'Create')}</span>
            </Button>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('common.search', 'Search...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full h-10 ps-9 pe-9 rounded-md border bg-background text-sm',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            size="sm"
            className="gap-2 min-h-10 shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            {t('common.filters', 'Filters')}
            {activeFilterCount > 0 && (
              <Badge variant="default" className="h-5 min-w-5 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')}
            />
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('common.type', 'Type')}
                </label>
                <select
                  value={filters.item_type || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      item_type: (e.target.value as AgendaItemType) || undefined,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                >
                  <option value="">{t('common.all', 'All')}</option>
                  {itemTypes.map((type) => (
                    <option key={type} value={type}>
                      {t(`agendaItemTypes.${type}`, type)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('common.status', 'Status')}
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: (e.target.value as AgendaItemStatus) || undefined,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                >
                  <option value="">{t('common.all', 'All')}</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {t(`agendaItemStatus.${status}`, status)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block text-start">
                  {t('common.priority', 'Priority')}
                </label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priority: (e.target.value as AgendaItemPriority) || undefined,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                >
                  <option value="">{t('common.all', 'All')}</option>
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {t(`agendaItemPriority.${priority}`, priority)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  {t('common.clearFilters', 'Clear Filters')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8 sm:py-12">
          <div className="rounded-full bg-destructive/10 p-4 w-fit mx-auto mb-4">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h4 className="text-lg font-medium mb-2 text-destructive">
            {t('common.error', 'Error')}
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || t('agendaItems.loadError', 'Failed to load agenda items')}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            {t('common.retry', 'Try Again')}
          </Button>
        </div>
      )}

      {/* Items List */}
      {!isLoading && !error && filteredItems.length > 0 && (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <AgendaItemCard
              key={item.id}
              item={item}
              isRTL={isRTL}
              onEdit={onEditItem}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredItems.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h4 className="text-lg font-medium mb-2">
            {searchQuery || activeFilterCount > 0
              ? t('common.noResults', 'No Results Found')
              : t('agendaItems.empty', 'No Agenda Items')}
          </h4>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {searchQuery || activeFilterCount > 0
              ? t('common.adjustFilters', 'Try adjusting your search or filters')
              : t('agendaItems.emptyDescription', 'Create your first agenda item to get started')}
          </p>

          {searchQuery || activeFilterCount > 0 ? (
            <Button variant="outline" onClick={clearFilters}>
              {t('common.clearFilters', 'Clear Filters')}
            </Button>
          ) : (
            <Button variant="default" onClick={onCreateItem} className="gap-2 min-h-11">
              <Plus className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              {t('agendaItems.create', 'Create Agenda Item')}
            </Button>
          )}
        </div>
      )}

      {/* Summary */}
      {!isLoading && !error && data?.data && data.data.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm text-muted-foreground">
          <span>
            {t('common.total', 'Total')}: {countAllItems(data.data)}{' '}
            {t('agendaItems.items', 'items')}
          </span>
          {searchQuery && (
            <span>
              {t('common.showing', 'Showing')}: {countAllItems(filteredItems)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Helper to count all items including children
function countAllItems(items: ForumAgendaItemWithStats[]): number {
  return items.reduce((count, item) => {
    return count + 1 + (item.children ? countAllItems(item.children) : 0)
  }, 0)
}

export default AgendaItemList
