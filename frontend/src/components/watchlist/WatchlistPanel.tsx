// WatchlistPanel Component
// Main watchlist view with filtering and management
// Feature: personal-watchlist

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Eye,
  Filter,
  Loader2,
  MoreHorizontal,
  Search,
  Trash2,
  Settings,
  Bell,
  BellOff,
  ExternalLink,
  File,
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useWatchlist } from '@/hooks/useWatchlist'
import type {
  WatchableEntityType,
  WatchlistItem,
  WatchPriority,
  WatchlistFilters,
} from '@/types/watchlist.types'
import { ENTITY_TYPE_INFO, PRIORITY_INFO } from '@/types/watchlist.types'

interface WatchlistPanelProps {
  className?: string
  onEntityClick?: (entityType: WatchableEntityType, entityId: string) => void
}

export function WatchlistPanel({ className, onEntityClick }: WatchlistPanelProps) {
  const { t, i18n } = useTranslation('watchlist')
  const isRTL = i18n.language === 'ar'

  const [filters, setFilters] = useState<WatchlistFilters>({
    active_only: true,
    include_details: true,
    limit: 20,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null)

  const {
    watchlist,
    summary,
    totals,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
    removeById,
    toggleActive,
  } = useWatchlist(filters)

  // Filter watchlist by search query
  const filteredWatchlist = useMemo(() => {
    if (!searchQuery) return watchlist
    const query = searchQuery.toLowerCase()
    return watchlist.filter(
      (item) =>
        item.custom_label?.toLowerCase().includes(query) ||
        item.entity_details?.name?.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query),
    )
  }, [watchlist, searchQuery])

  // Get icon component
  const getEntityIcon = (entityType: WatchableEntityType) => {
    const iconName = ENTITY_TYPE_INFO[entityType]?.icon || 'File'
    const IconComponent = (
      Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>
    )[iconName]
    return IconComponent || File
  }

  // Handle entity navigation
  const handleEntityClick = (item: WatchlistItem) => {
    if (onEntityClick) {
      onEntityClick(item.entity_type, item.entity_id)
    }
  }

  // Handle remove
  const handleRemove = (item: WatchlistItem) => {
    removeById(item.id)
  }

  // Handle toggle active
  const handleToggleActive = (item: WatchlistItem) => {
    toggleActive(item.id)
  }

  return (
    <div className={cn('flex flex-col h-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="px-4 py-3 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">{t('title')}</h2>
            {totals.total > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totals.active}/{totals.total}
              </Badge>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 h-9"
            />
          </div>

          <div className="flex gap-2">
            {/* Entity Type Filter */}
            <Select
              value={filters.entity_type || 'all'}
              onValueChange={(value) =>
                setFilters((f) => ({
                  ...f,
                  entity_type: value === 'all' ? undefined : (value as WatchableEntityType),
                }))
              }
            >
              <SelectTrigger className="w-[140px] h-9">
                <Filter className="h-4 w-4 me-2" />
                <SelectValue placeholder={t('filters.entityType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
                {Object.entries(ENTITY_TYPE_INFO).map(([type, info]) => (
                  <SelectItem key={type} value={type}>
                    {t(info.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select
              value={filters.priority || 'all'}
              onValueChange={(value) =>
                setFilters((f) => ({
                  ...f,
                  priority: value === 'all' ? undefined : (value as WatchPriority),
                }))
              }
            >
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder={t('filters.priority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allPriorities')}</SelectItem>
                {Object.entries(PRIORITY_INFO).map(([priority, info]) => (
                  <SelectItem key={priority} value={priority}>
                    <span className={info.color}>{t(info.labelKey)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary chips */}
        {summary.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {summary.map((s) => {
              const info = ENTITY_TYPE_INFO[s.entity_type]
              return (
                <Badge
                  key={s.entity_type}
                  variant={filters.entity_type === s.entity_type ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      entity_type: f.entity_type === s.entity_type ? undefined : s.entity_type,
                    }))
                  }
                >
                  {t(info.labelKey)}: {s.active_count}
                </Badge>
              )
            })}
          </div>
        )}
      </div>

      {/* Watchlist Items */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </Card>
            ))
          ) : filteredWatchlist.length === 0 ? (
            // Empty state
            <div className="text-center py-12 px-4">
              <Eye className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg">{t('empty.title')}</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
                {t('empty.description')}
              </p>
            </div>
          ) : (
            // Watchlist items
            filteredWatchlist.map((item) => {
              const entityInfo = ENTITY_TYPE_INFO[item.entity_type]
              const priorityInfo = PRIORITY_INFO[item.priority]
              const IconComponent = getEntityIcon(item.entity_type)

              return (
                <Card
                  key={item.id}
                  className={cn(
                    'group transition-colors hover:bg-muted/50',
                    !item.is_active && 'opacity-60',
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Entity Icon */}
                      <div
                        className={cn(
                          'flex items-center justify-center h-10 w-10 rounded-lg',
                          `bg-${entityInfo.color}-100 text-${entityInfo.color}-600`,
                        )}
                        style={{
                          backgroundColor: `var(--${entityInfo.color}-100, #f3f4f6)`,
                          color: `var(--${entityInfo.color}-600, #4b5563)`,
                        }}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <button
                              onClick={() => handleEntityClick(item)}
                              className="font-medium text-sm hover:text-primary transition-colors text-start truncate block max-w-full"
                            >
                              {item.custom_label || item.entity_details?.name || t('unknown')}
                            </button>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                {t(entityInfo.labelKey)}
                              </Badge>
                              <Badge
                                className={cn(
                                  'text-xs px-1.5 py-0',
                                  priorityInfo.bgColor,
                                  priorityInfo.color,
                                )}
                              >
                                {t(priorityInfo.labelKey)}
                              </Badge>
                            </div>
                          </div>

                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                              <DropdownMenuItem onClick={() => handleEntityClick(item)}>
                                <ExternalLink className="h-4 w-4 me-2" />
                                {t('actions.viewEntity')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSelectedItem(item)}>
                                <Settings className="h-4 w-4 me-2" />
                                {t('actions.settings')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(item)}>
                                {item.is_active ? (
                                  <>
                                    <BellOff className="h-4 w-4 me-2" />
                                    {t('actions.pauseNotifications')}
                                  </>
                                ) : (
                                  <>
                                    <Bell className="h-4 w-4 me-2" />
                                    {t('actions.resumeNotifications')}
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRemove(item)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 me-2" />
                                {t('actions.remove')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Notes preview */}
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {item.notes}
                          </p>
                        )}

                        {/* Recent events indicator */}
                        {item.recent_events_count && item.recent_events_count > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                            <Bell className="h-3 w-3" />
                            <span>{t('recentEvents', { count: item.recent_events_count })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}

          {/* Load more */}
          {hasNextPage && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetching}
              >
                {isFetching ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                {t('loadMore')}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Settings Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent side={isRTL ? 'left' : 'right'} className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t('settings.title')}</SheetTitle>
            <SheetDescription>
              {selectedItem?.custom_label || selectedItem?.entity_details?.name || t('unknown')}
            </SheetDescription>
          </SheetHeader>
          {selectedItem && (
            <WatchItemSettings item={selectedItem} onClose={() => setSelectedItem(null)} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Settings component for individual watch item
function WatchItemSettings({ item, onClose }: { item: WatchlistItem; onClose: () => void }) {
  const { t } = useTranslation('watchlist')
  const { updateWatch, isUpdating } = useWatchlist()

  const [settings, setSettings] = useState({
    custom_label: item.custom_label || '',
    notes: item.notes || '',
    priority: item.priority,
    notify_on_modification: item.notify_on_modification,
    notify_on_relationship_change: item.notify_on_relationship_change,
    notify_on_deadline: item.notify_on_deadline,
    notify_on_status_change: item.notify_on_status_change,
    notify_on_comment: item.notify_on_comment,
    notify_on_document: item.notify_on_document,
    deadline_reminder_days: item.deadline_reminder_days,
  })

  const handleSave = () => {
    updateWatch(
      { id: item.id, ...settings },
      {
        onSuccess: () => onClose(),
      },
    )
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Label */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('settings.customLabel')}</label>
        <Input
          value={settings.custom_label}
          onChange={(e) => setSettings((s) => ({ ...s, custom_label: e.target.value }))}
          placeholder={t('settings.customLabelPlaceholder')}
        />
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('settings.priority')}</label>
        <Select
          value={settings.priority}
          onValueChange={(value) =>
            setSettings((s) => ({ ...s, priority: value as WatchPriority }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRIORITY_INFO).map(([key, info]) => (
              <SelectItem key={key} value={key}>
                <span className={info.color}>{t(info.labelKey)}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('settings.notes')}</label>
        <textarea
          value={settings.notes}
          onChange={(e) => setSettings((s) => ({ ...s, notes: e.target.value }))}
          placeholder={t('settings.notesPlaceholder')}
          className="w-full min-h-[80px] p-2 text-sm border rounded-md resize-none"
        />
      </div>

      {/* Notification settings */}
      <div className="space-y-3">
        <label className="text-sm font-medium">{t('settings.notifications')}</label>
        {[
          { key: 'notify_on_modification', label: 'notifyModification' },
          { key: 'notify_on_relationship_change', label: 'notifyRelationship' },
          { key: 'notify_on_deadline', label: 'notifyDeadline' },
          { key: 'notify_on_status_change', label: 'notifyStatus' },
          { key: 'notify_on_comment', label: 'notifyComment' },
          { key: 'notify_on_document', label: 'notifyDocument' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm">{t(`settings.${label}`)}</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings[key as keyof typeof settings] as boolean}
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  [key]: !s[key as keyof typeof s],
                }))
              }
              className={cn(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                settings[key as keyof typeof settings] ? 'bg-primary' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  settings[key as keyof typeof settings] ? 'translate-x-4' : 'translate-x-1',
                )}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onClose} className="flex-1">
          {t('common:cancel')}
        </Button>
        <Button onClick={handleSave} disabled={isUpdating} className="flex-1">
          {isUpdating && <Loader2 className="h-4 w-4 animate-spin me-2" />}
          {t('common:save')}
        </Button>
      </div>
    </div>
  )
}

export default WatchlistPanel
