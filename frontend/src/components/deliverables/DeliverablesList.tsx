/**
 * DeliverablesList Component
 * Feature: commitment-deliverables
 *
 * Displays a list of MoU deliverables with:
 * - DeliverableCard components
 * - Bulk selection and status update
 * - Filter drawer and chips
 * - Empty state handling
 * - Pagination support
 * - Mobile-first, RTL-compatible design
 */

import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  CheckCircle,
  Plus,
  Filter,
  SearchX,
  Loader2,
  CheckSquare,
  XSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { DeliverableCard } from './DeliverableCard'
import { DeliverableFilterDrawer } from './DeliverableFilterDrawer'
import { DeliverableForm } from './DeliverableForm'
import { DeliverableDetailDrawer } from './DeliverableDetailDrawer'
import { DeliverableFilterChips } from './DeliverableFilterChips'

import {
  useDeliverables,
  useBulkUpdateDeliverableStatus,
  useDeleteDeliverable,
  useUpdateDeliverableStatus,
} from '@/hooks/useDeliverables'

import type {
  DeliverableStatus,
  DeliverablePriority,
  DeliverableWithRelations,
  DeliverableFilters,
} from '@/types/deliverable.types'

export interface DeliverablesListProps {
  mouId?: string
  status?: DeliverableStatus[]
  priority?: DeliverablePriority[]
  responsibleUserId?: string
  overdue?: boolean
  dueDateFrom?: string
  dueDateTo?: string
  showFilters?: boolean
  showCreateButton?: boolean
  showBulkActions?: boolean
  compact?: boolean
  onFiltersChange?: (filters: DeliverableFilters) => void
  onViewDetails?: (id: string) => void
}

export function DeliverablesList({
  mouId,
  status,
  priority,
  responsibleUserId,
  overdue,
  dueDateFrom,
  dueDateTo,
  showFilters = true,
  showCreateButton = true,
  showBulkActions = true,
  compact = false,
  onFiltersChange,
  onViewDetails,
}: DeliverablesListProps) {
  const { t, i18n } = useTranslation('deliverables')
  const isRTL = i18n.language === 'ar'

  // Pagination state
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<DeliverableStatus | ''>('')

  // Dialog/drawer states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingDeliverable, setEditingDeliverable] = useState<DeliverableWithRelations | null>(
    null,
  )
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | null>(null)

  // Build filters from props
  const filters: DeliverableFilters = useMemo(
    () => ({
      mouId,
      status,
      priority,
      responsibleUserId,
      overdue,
      dueDateFrom,
      dueDateTo,
    }),
    [mouId, status, priority, responsibleUserId, overdue, dueDateFrom, dueDateTo],
  )

  // Local filter state for the drawer
  const [localFilters, setLocalFilters] = useState<DeliverableFilters>(filters)

  // Fetch deliverables
  const { data, isLoading, isError, error, isFetching } = useDeliverables({
    ...filters,
    page,
    limit: pageSize,
  })

  // Mutations
  const bulkUpdateMutation = useBulkUpdateDeliverableStatus()
  const deleteMutation = useDeleteDeliverable()
  const statusMutation = useUpdateDeliverableStatus()

  const deliverables = data?.data ?? []
  const pagination = data?.pagination
  const totalCount = pagination?.total ?? 0
  const totalPages = pagination?.totalPages ?? 1
  const hasMore = pagination?.hasMore ?? false

  // Selection handlers
  const handleSelectionChange = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === deliverables.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(deliverables.map((d) => d.id)))
    }
  }, [selectedIds.size, deliverables])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setBulkStatus('')
  }, [])

  // Bulk status update
  const handleBulkStatusUpdate = useCallback(async () => {
    if (!bulkStatus || selectedIds.size === 0) return

    await bulkUpdateMutation.mutateAsync({
      deliverableIds: Array.from(selectedIds),
      status: bulkStatus,
      mouId,
    })

    handleClearSelection()
  }, [bulkStatus, selectedIds, bulkUpdateMutation, mouId, handleClearSelection])

  // Status change handler
  const handleStatusChange = useCallback(
    (id: string, newStatus: DeliverableStatus) => {
      statusMutation.mutate({
        deliverableId: id,
        status: newStatus,
        mouId,
      })
    },
    [statusMutation, mouId],
  )

  // Edit handler
  const handleEdit = useCallback((deliverable: DeliverableWithRelations) => {
    setEditingDeliverable(deliverable)
  }, [])

  // Delete handler
  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm(t('confirmDelete'))) {
        await deleteMutation.mutateAsync({ deliverableId: id, mouId })
      }
    },
    [deleteMutation, mouId, t],
  )

  // View details handler
  const handleViewDetails = useCallback(
    (id: string) => {
      if (onViewDetails) {
        onViewDetails(id)
      } else {
        setSelectedDeliverableId(id)
      }
    },
    [onViewDetails],
  )

  // Form success handler
  const handleFormSuccess = useCallback(() => {
    setShowCreateDialog(false)
    setEditingDeliverable(null)
  }, [])

  // Filter handlers
  const handleFiltersChange = useCallback((newFilters: DeliverableFilters) => {
    setLocalFilters(newFilters)
  }, [])

  const handleApplyFilters = useCallback(() => {
    setPage(1)
    onFiltersChange?.(localFilters)
    setShowFilterDrawer(false)
  }, [localFilters, onFiltersChange])

  const handleClearFilters = useCallback(() => {
    const clearedFilters: DeliverableFilters = { mouId }
    setLocalFilters(clearedFilters)
    onFiltersChange?.(clearedFilters)
    setPage(1)
  }, [mouId, onFiltersChange])

  const handleRemoveFilter = useCallback(
    (key: keyof DeliverableFilters, value?: string) => {
      const newFilters = { ...filters }

      if (key === 'status' && value) {
        newFilters.status = filters.status?.filter((s) => s !== value)
        if (newFilters.status?.length === 0) newFilters.status = undefined
      } else if (key === 'priority' && value) {
        newFilters.priority = filters.priority?.filter((p) => p !== value)
        if (newFilters.priority?.length === 0) newFilters.priority = undefined
      } else {
        ;(newFilters as Record<string, unknown>)[key] = undefined
      }

      setLocalFilters(newFilters)
      onFiltersChange?.(newFilters)
      setPage(1)
    },
    [filters, onFiltersChange],
  )

  // Check if any filters are active
  const hasActiveFilters = useMemo(
    () =>
      (filters.status?.length || 0) > 0 ||
      (filters.priority?.length || 0) > 0 ||
      !!filters.responsibleUserId ||
      !!filters.overdue ||
      !!filters.dueDateFrom ||
      !!filters.dueDateTo,
    [filters],
  )

  // Pagination handlers
  const handlePrevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setPage((p) => Math.min(totalPages, p + 1))
  }, [totalPages])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'}>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            {t('errors.loadFailed')}
            {error?.message && `: ${error.message}`}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Empty state
  if (deliverables.length === 0) {
    const isFiltered = hasActiveFilters

    return (
      <div dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-start">
              {t('title')}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-11"
                onClick={() => setShowFilterDrawer(true)}
              >
                <Filter className={cn('size-4', isRTL ? 'ms-2' : 'me-2')} />
                {t('filters.title')}
              </Button>
              {showCreateButton && mouId && (
                <Button onClick={() => setShowCreateDialog(true)} size="sm" className="min-h-11">
                  <Plus className={cn('size-4', isRTL ? 'ms-2' : 'me-2')} />
                  {t('actions.create')}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Filter chips when empty but filtered */}
        {isFiltered && (
          <DeliverableFilterChips
            filters={filters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearFilters}
          />
        )}

        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          {isFiltered ? (
            <>
              <SearchX className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {t('list.emptyFiltered')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                {t('list.emptyFilteredDescription')}
              </p>
              <Button variant="outline" onClick={handleClearFilters} className="min-h-11">
                {t('filters.clear')}
              </Button>
            </>
          ) : (
            <>
              <CheckCircle className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{t('list.empty')}</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                {t('list.emptyDescription')}
              </p>
              {showCreateButton && mouId && (
                <Button onClick={() => setShowCreateDialog(true)} className="min-h-11">
                  <Plus className={cn('size-4', isRTL ? 'ms-2' : 'me-2')} />
                  {t('actions.create')}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Filter Drawer */}
        <DeliverableFilterDrawer
          open={showFilterDrawer}
          onOpenChange={setShowFilterDrawer}
          filters={localFilters}
          onFiltersChange={handleFiltersChange}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />

        {/* Create Dialog */}
        {mouId && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent
              className="max-w-lg max-h-[90vh] overflow-y-auto"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <DialogHeader>
                <DialogTitle className="text-start">{t('actions.create')}</DialogTitle>
              </DialogHeader>
              <DeliverableForm
                mouId={mouId}
                onSuccess={handleFormSuccess}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with count and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground text-start">
          {t('title')}
          <span className="ms-2 text-sm font-normal text-muted-foreground">({totalCount})</span>
        </h2>

        <div className="flex items-center gap-2 flex-wrap">
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => setShowFilterDrawer(true)}
            >
              <Filter className={cn('size-4', isRTL ? 'ms-2' : 'me-2')} />
              {t('filters.title')}
              {hasActiveFilters && (
                <Badge variant="secondary" className="ms-1">
                  {(filters.status?.length || 0) +
                    (filters.priority?.length || 0) +
                    (filters.responsibleUserId ? 1 : 0) +
                    (filters.overdue ? 1 : 0) +
                    (filters.dueDateFrom ? 1 : 0) +
                    (filters.dueDateTo ? 1 : 0)}
                </Badge>
              )}
            </Button>
          )}
          {showCreateButton && mouId && (
            <Button onClick={() => setShowCreateDialog(true)} size="sm" className="min-h-11">
              <Plus className={cn('size-4', isRTL ? 'ms-2' : 'me-2')} />
              {t('actions.create')}
            </Button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      {hasActiveFilters && (
        <DeliverableFilterChips
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearFilters}
        />
      )}

      {/* Bulk actions bar */}
      {showBulkActions && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll} className="min-h-9">
              {selectedIds.size === deliverables.length ? (
                <>
                  <XSquare className={cn('size-4', isRTL ? 'ms-1' : 'me-1')} />
                  {t('bulkActions.deselectAll')}
                </>
              ) : (
                <>
                  <CheckSquare className={cn('size-4', isRTL ? 'ms-1' : 'me-1')} />
                  {t('bulkActions.selectAll')}
                </>
              )}
            </Button>
            {selectedIds.size > 0 && (
              <Badge variant="secondary">
                {t('bulkActions.selected', { count: selectedIds.size })}
              </Badge>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 flex-1">
              <Select
                value={bulkStatus}
                onValueChange={(v) => setBulkStatus(v as DeliverableStatus)}
              >
                <SelectTrigger className="w-40 min-h-9">
                  <SelectValue placeholder={t('bulkActions.selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
                  <SelectItem value="completed">{t('status.completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="min-h-9"
                onClick={handleBulkStatusUpdate}
                disabled={!bulkStatus || bulkUpdateMutation.isPending}
              >
                {bulkUpdateMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  t('bulkActions.apply')
                )}
              </Button>
              <Button variant="ghost" size="sm" className="min-h-9" onClick={handleClearSelection}>
                {t('bulkActions.cancel')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Deliverables Grid */}
      <div className="grid grid-cols-1 gap-4">
        {deliverables.map((deliverable) => (
          <DeliverableCard
            key={deliverable.id}
            deliverable={deliverable}
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
            selectable={showBulkActions}
            selected={selectedIds.has(deliverable.id)}
            onSelectionChange={handleSelectionChange}
            compact={compact}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <Button
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={handlePrevPage}
            disabled={page <= 1 || isFetching}
          >
            <ChevronLeft className={cn('size-4', isRTL && 'rotate-180')} />
            <span className="ms-1">{t('pagination.previous')}</span>
          </Button>

          <span className="text-sm text-muted-foreground">
            {t('pagination.page', { current: page, total: totalPages })}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={handleNextPage}
            disabled={!hasMore || isFetching}
          >
            <span className="me-1">{t('pagination.next')}</span>
            <ChevronRight className={cn('size-4', isRTL && 'rotate-180')} />
          </Button>
        </div>
      )}

      {/* Loading overlay for pagination */}
      {isFetching && !isLoading && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Filter Drawer */}
      <DeliverableFilterDrawer
        open={showFilterDrawer}
        onOpenChange={setShowFilterDrawer}
        filters={localFilters}
        onFiltersChange={handleFiltersChange}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {/* Create Dialog */}
      {mouId && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent
            className="max-w-lg max-h-[90vh] overflow-y-auto"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <DialogHeader>
              <DialogTitle className="text-start">{t('actions.create')}</DialogTitle>
            </DialogHeader>
            <DeliverableForm
              mouId={mouId}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Sheet */}
      <Sheet
        open={!!editingDeliverable}
        onOpenChange={(open) => !open && setEditingDeliverable(null)}
      >
        <SheetContent
          side={isRTL ? 'left' : 'right'}
          className="w-full sm:max-w-lg overflow-y-auto"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <SheetHeader>
            <SheetTitle className="text-start">{t('actions.edit')}</SheetTitle>
          </SheetHeader>
          {editingDeliverable && mouId && (
            <div className="mt-6">
              <DeliverableForm
                mouId={mouId}
                deliverable={editingDeliverable}
                onSuccess={handleFormSuccess}
                onCancel={() => setEditingDeliverable(null)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Detail Drawer */}
      <DeliverableDetailDrawer
        deliverableId={selectedDeliverableId}
        open={!!selectedDeliverableId}
        onOpenChange={(open) => !open && setSelectedDeliverableId(null)}
        onEdit={handleEdit}
      />
    </div>
  )
}

export default DeliverablesList
