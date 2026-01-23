/**
 * SavedSearchesManager Component
 * Feature: saved-searches-feature
 * Description: Main component for managing saved searches with sharing and alerts
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Plus,
  Star,
  Share2,
  Bell,
  MoreVertical,
  Trash2,
  Edit,
  Pin,
  PinOff,
  Users,
  User,
  Building,
  Globe,
  Clock,
  Sparkles,
  ChevronRight,
  Filter,
  PlayCircle,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import {
  useSavedSearches,
  usePinnedSearches,
  useSmartFilters,
  useDeleteSavedSearch,
  useToggleSearchPin,
  useExecuteSavedSearch,
  getSavedSearchColorClasses,
} from '@/hooks/useSavedSearches'
import type { SavedSearch, SmartFilter, SavedSearchCategory } from '@/types/saved-search.types'
import type { TemplateDefinition } from '@/types/advanced-search.types'

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  search: Search,
  user: User,
  users: Users,
  building: Building,
  globe: Globe,
  clock: Clock,
  sparkles: Sparkles,
  filter: Filter,
  star: Star,
  bell: Bell,
}

const categoryIcons: Record<SavedSearchCategory, React.ComponentType<{ className?: string }>> = {
  personal: User,
  team: Users,
  organization: Building,
  smart: Sparkles,
  recent: Clock,
}

interface SavedSearchesManagerProps {
  onApply: (definition: TemplateDefinition) => void
  onCreateNew?: () => void
  onEdit?: (search: SavedSearch) => void
  onShare?: (search: SavedSearch) => void
  onConfigureAlert?: (search: SavedSearch) => void
  className?: string
  compact?: boolean
}

export function SavedSearchesManager({
  onApply,
  onCreateNew,
  onEdit,
  onShare,
  onConfigureAlert,
  className,
  compact = false,
}: SavedSearchesManagerProps) {
  const { t, i18n } = useTranslation('saved-searches')
  const isRTL = i18n.language === 'ar'

  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'smart'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteSearchId, setDeleteSearchId] = useState<string | null>(null)

  // Queries
  const { data: allSearches, isLoading: loadingAll } = useSavedSearches({ limit: 50 })
  const { data: pinnedSearches, isLoading: loadingPinned } = usePinnedSearches()
  const { data: smartFilters, isLoading: loadingSmart } = useSmartFilters()

  // Mutations
  const deleteMutation = useDeleteSavedSearch()
  const togglePinMutation = useToggleSearchPin()
  const executeMutation = useExecuteSavedSearch()

  // Filter searches by query
  const filterSearches = useCallback(
    (searches: SavedSearch[] | undefined) => {
      if (!searches || !searchQuery.trim()) return searches || []
      const query = searchQuery.toLowerCase()
      return searches.filter(
        (s) =>
          s.name_en.toLowerCase().includes(query) ||
          s.name_ar.includes(query) ||
          s.description_en?.toLowerCase().includes(query) ||
          s.description_ar?.includes(query),
      )
    },
    [searchQuery],
  )

  const filteredSearches = filterSearches(allSearches?.data)
  const filteredPinned = filterSearches(pinnedSearches?.data)

  // Handlers
  const handleApply = (search: SavedSearch | SmartFilter) => {
    const definition =
      'search_definition' in search ? search.search_definition : search.template_definition
    onApply(definition)
  }

  const handleExecute = async (search: SavedSearch) => {
    try {
      await executeMutation.mutateAsync(search.id)
      handleApply(search)
    } catch (error) {
      console.error('Execute search error:', error)
    }
  }

  const handleTogglePin = async (search: SavedSearch) => {
    try {
      await togglePinMutation.mutateAsync({
        id: search.id,
        is_pinned: !search.is_pinned,
      })
    } catch (error) {
      console.error('Toggle pin error:', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteSearchId) return
    try {
      await deleteMutation.mutateAsync(deleteSearchId)
      setDeleteSearchId(null)
    } catch (error) {
      console.error('Delete search error:', error)
    }
  }

  // Render saved search card
  const renderSearchCard = (search: SavedSearch, showActions = true) => {
    const IconComponent = iconMap[search.icon] || Search
    const colorClasses = getSavedSearchColorClasses(search.color)
    const isOwner = !search.is_shared

    return (
      <div
        key={search.id}
        className={cn(
          'group flex items-start gap-3 p-3 rounded-lg border transition-all',
          colorClasses.border,
          colorClasses.bg,
          colorClasses.hover,
          'cursor-pointer',
        )}
        onClick={() => handleApply(search)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleApply(search)}
      >
        {/* Icon */}
        <div className={cn('p-2 rounded-lg shrink-0', colorClasses.bg)}>
          <IconComponent className={cn('h-4 w-4', colorClasses.text)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {isRTL ? search.name_ar : search.name_en}
            </h4>
            {search.is_pinned && <Pin className="size-3 shrink-0 text-amber-500" />}
            {search.is_shared && <Share2 className="size-3 shrink-0 text-blue-500" />}
            {search.alert?.is_enabled && <Bell className="size-3 shrink-0 text-green-500" />}
          </div>
          {(search.description_en || search.description_ar) && (
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
              {isRTL ? search.description_ar : search.description_en}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            {search.use_count > 0 && (
              <Badge variant="outline" className="text-xs">
                {t('useCount', { count: search.use_count })}
              </Badge>
            )}
            {search.last_result_count !== null && (
              <Badge variant="secondary" className="text-xs">
                {t('resultCount', { count: search.last_result_count })}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              className="size-8 p-0"
              onClick={(e) => {
                e.stopPropagation()
                handleExecute(search)
              }}
              title={t('execute')}
            >
              <PlayCircle className="size-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="size-8 p-0">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTogglePin(search)
                  }}
                >
                  {search.is_pinned ? (
                    <>
                      <PinOff className="me-2 size-4" />
                      {t('actions.unpin')}
                    </>
                  ) : (
                    <>
                      <Pin className="me-2 size-4" />
                      {t('actions.pin')}
                    </>
                  )}
                </DropdownMenuItem>

                {isOwner && onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(search)
                    }}
                  >
                    <Edit className="me-2 size-4" />
                    {t('actions.edit')}
                  </DropdownMenuItem>
                )}

                {isOwner && onShare && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onShare(search)
                    }}
                  >
                    <Share2 className="me-2 size-4" />
                    {t('actions.share')}
                  </DropdownMenuItem>
                )}

                {onConfigureAlert && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onConfigureAlert(search)
                    }}
                  >
                    <Bell className="me-2 size-4" />
                    {t('actions.configureAlert')}
                  </DropdownMenuItem>
                )}

                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 dark:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteSearchId(search.id)
                      }}
                    >
                      <Trash2 className="me-2 size-4" />
                      {t('actions.delete')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <ChevronRight
          className={cn(
            'h-4 w-4 text-gray-400 shrink-0 self-center',
            isRTL && 'rotate-180',
            showActions && 'group-hover:hidden',
          )}
        />
      </div>
    )
  }

  // Render smart filter card
  const renderSmartFilterCard = (filter: SmartFilter) => {
    const IconComponent = iconMap[filter.icon] || Sparkles
    const colorClasses = getSavedSearchColorClasses(filter.color)

    return (
      <button
        key={filter.id}
        type="button"
        onClick={() => onApply(filter.template_definition)}
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg border text-start w-full transition-all',
          colorClasses.border,
          colorClasses.bg,
          colorClasses.hover,
        )}
      >
        <div className={cn('p-2 rounded-lg shrink-0', colorClasses.bg)}>
          <IconComponent className={cn('h-4 w-4', colorClasses.text)} />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {isRTL ? filter.name_ar : filter.name_en}
          </h4>
          {(filter.description_en || filter.description_ar) && (
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
              {isRTL ? filter.description_ar : filter.description_en}
            </p>
          )}
        </div>

        <ChevronRight
          className={cn('h-4 w-4 text-gray-400 shrink-0 self-center', isRTL && 'rotate-180')}
        />
      </button>
    )
  }

  // Render loading skeletons
  const renderSkeletons = (count: number) => (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-lg" />
      ))}
    </>
  )

  // Render empty state
  const renderEmpty = (message: string) => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Search className="mb-3 size-12 text-gray-300 dark:text-gray-600" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      {onCreateNew && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onCreateNew}>
          <Plus className="me-2 size-4" />
          {t('createNew')}
        </Button>
      )}
    </div>
  )

  return (
    <div className={cn('flex flex-col gap-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('title')}</h2>
        {onCreateNew && !compact && (
          <Button onClick={onCreateNew} size="sm">
            <Plus className="me-2 size-4" />
            {t('createNew')}
          </Button>
        )}
      </div>

      {/* Search */}
      {!compact && (
        <div className="relative">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="ps-10"
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Filter className="size-4" />
            {!compact && t('tabs.all')}
          </TabsTrigger>
          <TabsTrigger value="pinned" className="flex items-center gap-2">
            <Star className="size-4" />
            {!compact && t('tabs.pinned')}
          </TabsTrigger>
          <TabsTrigger value="smart" className="flex items-center gap-2">
            <Sparkles className="size-4" />
            {!compact && t('tabs.smart')}
          </TabsTrigger>
        </TabsList>

        {/* All Searches */}
        <TabsContent value="all" className="mt-4">
          <ScrollArea className={compact ? 'h-[300px]' : 'h-[400px]'}>
            <div className="flex flex-col gap-2">
              {loadingAll
                ? renderSkeletons(4)
                : filteredSearches.length > 0
                  ? filteredSearches.map((search) => renderSearchCard(search))
                  : renderEmpty(t('empty.all'))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Pinned Searches */}
        <TabsContent value="pinned" className="mt-4">
          <ScrollArea className={compact ? 'h-[300px]' : 'h-[400px]'}>
            <div className="flex flex-col gap-2">
              {loadingPinned
                ? renderSkeletons(3)
                : filteredPinned.length > 0
                  ? filteredPinned.map((search) => renderSearchCard(search))
                  : renderEmpty(t('empty.pinned'))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Smart Filters */}
        <TabsContent value="smart" className="mt-4">
          <ScrollArea className={compact ? 'h-[300px]' : 'h-[400px]'}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {loadingSmart ? (
                renderSkeletons(6)
              ) : smartFilters?.data && smartFilters.data.length > 0 ? (
                smartFilters.data.map((filter) => renderSmartFilterCard(filter))
              ) : (
                <div className="col-span-2">{renderEmpty(t('empty.smart'))}</div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSearchId} onOpenChange={() => setDeleteSearchId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              {t('deleteDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('deleteDialog.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('deleteDialog.deleting') : t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default SavedSearchesManager
