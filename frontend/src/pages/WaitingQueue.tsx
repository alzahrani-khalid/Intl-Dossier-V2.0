/**
 * Waiting Queue Page (FR-033)
 *
 * Work-Queue-First: Priority page for blocked/waiting items
 * Features:
 * - List of assignments waiting for dependencies
 * - Categorized by waiting reason (approval, response, capacity)
 * - Aging indicators
 * - Escalation actions
 * - Follow-up reminders
 *
 * Mobile-first responsive design with RTL support
 */

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { supabase } from '../lib/supabase'
import { Clock, AlertTriangle, Mail, UserCheck, Zap, Loader2, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Checkbox } from '../components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { SkeletonCard } from '../components/ui/skeleton'
import { ReminderButton } from '../components/waiting-queue/ReminderButton'
import { BulkActionToolbar } from '../components/waiting-queue/BulkActionToolbar'
import FilterPanel from '../components/waiting-queue/FilterPanel'
import { useBulkReminderAction, useBulkReminderJobStatus } from '../hooks/use-waiting-queue-actions'
import { useBulkSelection } from '../hooks/use-bulk-selection'
import { useQueueFilters, useFilteredAssignments } from '../hooks/use-queue-filters'
import { useToast } from '../hooks/use-toast'
import QueryErrorBoundary from '../components/QueryErrorBoundary'

interface LinkedEntity {
 type: 'dossier' | 'position' | 'ticket'
 id: string
 name_en?: string
 name_ar?: string
 title_en?: string
 title_ar?: string
 ticket_number?: string
 status?: string
}

interface WorkItemDetails {
 title_en: string
 title_ar: string
 description?: string
 status?: string
 source_type?: 'dossier' | 'position' | 'ticket'
 linked_entities?: LinkedEntity[]
 // Legacy fields (for backward compatibility)
 ticket_number?: string
 type?: string
}

interface WaitingItem {
 id: string
 work_item_id: string
 work_item_type: string
 assignee_id: string | null
 assignee_name: string
 workflow_stage: string
 assigned_at: string
 priority: 'low' | 'medium' | 'high' | 'urgent'
 status: string
 last_reminder_sent_at: string | null
 work_item: WorkItemDetails | null
}

function WaitingQueuePageInner() {
 const { t, i18n } = useTranslation()
 const isRTL = i18n.language === 'ar'
 const { toast } = useToast()
 const queryClient = useQueryClient()

 const [activeTab, setActiveTab] = useState<string>('all')
 const [bulkJobId, setBulkJobId] = useState<string | null>(null)
 const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)

 // Ref for virtualization scroll container
 const parentRef = useRef<HTMLDivElement>(null)

 // Filter state management (T084-T088)
 const { filters, updateFilters, clearFilters, filterCount, hasFilters } = useQueueFilters()

 // Bulk selection state
 const {
 selectedIds,
 selectedCount,
 isSelected,
 toggleSelection,
 clearSelection,
 maxReached,
 } = useBulkSelection()

 // Bulk reminder action
 const { sendBulk } = useBulkReminderAction()

 // Poll bulk job status
 const { data: bulkJobStatus, isLoading: isJobLoading } = useBulkReminderJobStatus(
 bulkJobId,
 !!bulkJobId
 )

 const handleNavigateToTask = (workItemId: string) => {
 // Navigate to task detail page
 window.location.href = `/tasks/${workItemId}`
 }

 // Bulk action handlers
 const handleSendBulkReminders = async () => {
 const assignmentIds = Array.from(selectedIds)

 // Filter out assignments with no assignee
 const itemsWithAssignee = filteredItems?.filter(item =>
 assignmentIds.includes(item.id) && item.assignee_id
 ) || []

 const skippedCount = assignmentIds.length - itemsWithAssignee.length

 if (itemsWithAssignee.length === 0) {
 toast({
 variant: 'destructive',
 title: t('waitingQueue.bulkActions.noAssignees'),
 description: t('waitingQueue.bulkActions.noAssigneesDesc'),
 })
 return
 }

 try {
 const response = await sendBulk.mutateAsync({
 assignmentIds: itemsWithAssignee.map(item => item.id),
 })

 setBulkJobId(response.job_id)

 if (skippedCount > 0) {
 toast({
 title: t('waitingQueue.bulkActions.processing'),
 description: t('waitingQueue.bulkActions.skippedSome', {
 sent: itemsWithAssignee.length,
 skipped: skippedCount,
 }),
 })
 } else {
 toast({
 title: t('waitingQueue.bulkActions.processing'),
 description: t('waitingQueue.bulkActions.jobCreated', {
 count: itemsWithAssignee.length,
 }),
 })
 }
 } catch (error: any) {
 toast({
 variant: 'destructive',
 title: t('waitingQueue.bulkActions.error'),
 description: error.message || t('waitingQueue.bulkActions.errorDesc'),
 })
 }
 }

 const handleClearSelection = () => {
 clearSelection()
 toast({
 title: t('waitingQueue.bulkActions.selectionCleared'),
 description: t('waitingQueue.bulkActions.selectionClearedDesc'),
 })
 }

 // Monitor bulk job completion
 useEffect(() => {
 if (!bulkJobStatus) return

 if (bulkJobStatus.status === 'completed') {
 clearSelection()
 setBulkJobId(null)

 const successCount = bulkJobStatus.successful_items
 const failedCount = bulkJobStatus.failed_items

 toast({
 title: t('waitingQueue.bulkActions.completed'),
 description: t('waitingQueue.bulkActions.summary', {
 success: successCount,
 failed: failedCount,
 total: bulkJobStatus.total_items,
 }),
 variant: failedCount > 0 ? 'default' : 'default',
 })
 } else if (bulkJobStatus.status === 'failed') {
 setBulkJobId(null)
 toast({
 variant: 'destructive',
 title: t('waitingQueue.bulkActions.failed'),
 description: t('waitingQueue.bulkActions.failedDesc'),
 })
 }
 }, [bulkJobStatus, clearSelection, t, toast])

 // Fetch filtered assignments (T085: Update assignment list query to use filters)
 const { data: response, isLoading } = useFilteredAssignments(filters)

 // Extract items and pagination from response
 const items = response?.data || []
 const pagination = response?.pagination

 // T089: Supabase Realtime subscriptions for assignment status changes
 useEffect(() => {
 // Subscribe to changes on the assignments table
 const channel = supabase
 .channel('waiting-queue-changes')
 .on(
 'postgres_changes',
 {
 event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
 schema: 'public',
 table: 'assignments',
 filter: 'status=in.(pending,assigned,completed,cancelled)',
 },
 (payload) => {
 console.log('Realtime change detected:', payload)

 // Handle different event types
 if (payload.eventType === 'UPDATE') {
 const updatedAssignment = payload.new as any

 // If assignment was completed or cancelled, remove from queue
 if (updatedAssignment.status === 'completed' || updatedAssignment.status === 'cancelled') {
 // Deselect if selected for bulk action
 if (isSelected(updatedAssignment.id)) {
 toggleSelection(updatedAssignment.id)
 }

 // Show toast notification
 toast({
 title: t('waiting.assignmentUpdated'),
 description: t('waiting.assignmentCompletedDesc', {
 id: updatedAssignment.work_item_id,
 }),
 })
 }

 // Invalidate and refetch query to update UI
 queryClient.invalidateQueries({ queryKey: ['waiting-queue'] })
 }

 if (payload.eventType === 'INSERT') {
 // New assignment added to queue
 queryClient.invalidateQueries({ queryKey: ['waiting-queue'] })
 }

 if (payload.eventType === 'DELETE') {
 // Assignment deleted
 queryClient.invalidateQueries({ queryKey: ['waiting-queue'] })
 }
 }
 )
 .subscribe()

 // Cleanup subscription on unmount
 return () => {
 supabase.removeChannel(channel)
 }
 }, [isSelected, toggleSelection, queryClient, t, toast])

 const getAgingStatus = (assignedAt: string) => {
 const now = new Date()
 const since = new Date(assignedAt)
 const daysInReview = Math.floor((now.getTime() - since.getTime()) / (1000 * 60 * 60 * 24))

 if (daysInReview >= 7) return { color: 'text-red-600', severity: 'critical', days: daysInReview }
 if (daysInReview >= 3) return { color: 'text-orange-600', severity: 'warning', days: daysInReview }
 return { color: 'text-yellow-600', severity: 'normal', days: daysInReview }
 }

 const getTypeIcon = (type: string) => {
 switch (type) {
 case 'dossier':
 return UserCheck
 case 'ticket':
 return Mail
 case 'position':
 return Zap
 default:
 return Clock
 }
 }

 const getWorkItemTitle = (item: WaitingItem): string => {
 if (!item.work_item) {
 return item.work_item_id.substring(0, 8) + '...'
 }

 // Show task title (which already includes context like "Review and process: Dossier Name")
 const title = isRTL ? item.work_item.title_ar : item.work_item.title_en
 return title || item.work_item_id.substring(0, 8) + '...'
 }

 // Get linked entity names for display (e.g., "Related to: Germany Trade Statistics Agreement")
 const getLinkedEntitiesText = (item: WaitingItem): string | null => {
 if (!item.work_item?.linked_entities || item.work_item.linked_entities.length === 0) {
 return null
 }

 const entities = item.work_item.linked_entities.map(entity => {
 if (entity.type === 'dossier') {
 return isRTL ? entity.name_ar : entity.name_en
 } else if (entity.type === 'position') {
 return isRTL ? entity.title_ar : entity.title_en
 } else if (entity.type === 'ticket') {
 return entity.ticket_number || (isRTL ? entity.title_ar : entity.title_en)
 }
 return null
 }).filter(Boolean)

 if (entities.length === 0) return null

 return t('waitingQueue.relatedTo', 'Related to: ') + entities.join(', ')
 }

 const filteredItems =
 activeTab === 'all' ? items : items?.filter((item) => item.work_item_type === activeTab)

 const groupedCounts = items?.reduce(
 (acc, item) => {
 acc[item.work_item_type] = (acc[item.work_item_type] || 0) + 1
 return acc
 },
 {} as Record<string, number>
 ) || {}

 // T093: Performance optimization - Virtualize long lists (>100 items)
 const shouldVirtualize = (filteredItems?.length || 0) > 100

 // Setup virtualizer for long lists
 const virtualizer = useVirtualizer({
 count: filteredItems?.length || 0,
 getScrollElement: () => parentRef.current,
 estimateSize: () => 120, // Estimated row height in pixels
 overscan: 5, // Render 5 extra items above/below visible area
 enabled: shouldVirtualize, // Only enable when list is long
 })

 return (
 <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Header */}
 <div className="border-b border-border bg-card">
 <div className="container mx-auto p-4 sm:p-6 lg:px-8">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-center gap-3">
 <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500/10 sm:size-12">
 <Clock className="size-5 text-orange-600 sm:size-6" />
 </div>
 <div>
 <h1 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
 {t('navigation.waitingQueue', 'Waiting Queue')}
 </h1>
 <p className="mt-1 text-sm text-muted-foreground">
 {t('waiting.description', 'Items pending or assigned but not yet started')}
 </p>
 </div>
 </div>
 {/* T086: Filter button and count, T088: Sorting controls */}
 <div className="flex items-center gap-2">
 {/* Sort selector (desktop) */}
 <Select
 value={filters.sort_by || 'assigned_at_desc'}
 onValueChange={(value) => updateFilters({ sort_by: value as any })}
 >
 <SelectTrigger className="hidden min-h-9 w-[180px] sm:flex" aria-label={t('waitingQueue.filters.sortBy')}>
 <ArrowUpDown className="me-2 size-4" />
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="assigned_at_desc">
 {t('waitingQueue.filters.sort.oldestFirst')}
 </SelectItem>
 <SelectItem value="assigned_at_asc">
 {t('waitingQueue.filters.sort.newestFirst')}
 </SelectItem>
 <SelectItem value="priority_desc">
 {t('waitingQueue.filters.sort.highPriorityFirst')}
 </SelectItem>
 <SelectItem value="priority_asc">
 {t('waitingQueue.filters.sort.lowPriorityFirst')}
 </SelectItem>
 </SelectContent>
 </Select>

 {/* Filter button with popover (T084) */}
 <FilterPanel
 filters={filters}
 onFiltersChange={updateFilters}
 onClearFilters={clearFilters}
 isOpen={isFilterPanelOpen}
 onOpenChange={setIsFilterPanelOpen}
 resultCount={pagination?.total_count}
 isLoading={isLoading}
 hasFilters={hasFilters}
 filterCount={filterCount}
 />
 </div>
 </div>
 </div>
 </div>

 {/* Bulk Action Toolbar */}
 <BulkActionToolbar
 selectedCount={selectedCount}
 onSendReminders={handleSendBulkReminders}
 onClearSelection={handleClearSelection}
 isProcessing={sendBulk.isPending || !!bulkJobId}
 />

 {/* Bulk Job Progress Indicator */}
 {bulkJobId && bulkJobStatus && (
 <div className="border-b border-border bg-blue-50 dark:bg-blue-950" dir={isRTL ? 'rtl' : 'ltr'}>
 <div className="container mx-auto px-4 py-3 sm:px-6 lg:px-8">
 <div className="flex items-center gap-3">
 <Loader2 className="size-4 animate-spin text-blue-600" />
 <div className="flex-1">
 <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
 {t('waitingQueue.bulkActions.sending')}
 </p>
 <p className="text-xs text-blue-700 dark:text-blue-300">
 {bulkJobStatus.processed_items} / {bulkJobStatus.total_items} {t('waitingQueue.bulkActions.completed')}
 </p>
 </div>
 <div className="text-sm text-blue-900 dark:text-blue-100">
 {Math.round((bulkJobStatus.processed_items / bulkJobStatus.total_items) * 100)}%
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Main Content (T084) */}
 <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
 <main className="w-full">
 <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
 {/* Tabs Navigation */}
 <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-5">
 <TabsTrigger value="all" className="min-h-9 text-xs sm:text-sm">
 {t('common.all', 'All')} ({items?.length || 0})
 </TabsTrigger>
 <TabsTrigger value="dossier" className="min-h-9 text-xs sm:text-sm">
 {t('waiting.dossiers', 'Dossiers')} ({groupedCounts['dossier'] || 0})
 </TabsTrigger>
 <TabsTrigger value="ticket" className="min-h-9 text-xs sm:text-sm">
 {t('waiting.tickets', 'Tickets')} ({groupedCounts['ticket'] || 0})
 </TabsTrigger>
 <TabsTrigger value="position" className="min-h-9 text-xs sm:text-sm">
 {t('waiting.positions', 'Positions')} ({groupedCounts['position'] || 0})
 </TabsTrigger>
 <TabsTrigger value="task" className="min-h-9 text-xs sm:text-sm">
 {t('waiting.tasks', 'Tasks')} ({groupedCounts['task'] || 0})
 </TabsTrigger>
 </TabsList>

 {/* Tab Content */}
 <TabsContent value={activeTab} className="mt-4 space-y-3">
 {/* Loading State (T096: Improved loading skeletons) */}
 {isLoading && (
 <div className="space-y-4" data-testid="loading-skeletons">
 {[1, 2, 3].map((i) => (
 <SkeletonCard key={i} />
 ))}
 </div>
 )}

 {/* Empty State (T087: filter-specific empty state) */}
 {!isLoading && (!filteredItems || filteredItems.length === 0) && (
 <Card className="p-8 text-center sm:p-12">
 <Clock className="mx-auto mb-4 size-12 text-muted-foreground sm:size-16" />
 <h3 className="mb-2 text-lg font-semibold text-foreground sm:text-xl">
 {hasFilters
 ? t('waitingQueue.filters.noResults')
 : t('waiting.empty', 'No waiting items')}
 </h3>
 <p className="mb-4 text-sm text-muted-foreground">
 {hasFilters
 ? t('waitingQueue.filters.noResultsDesc')
 : (activeTab === 'all'
 ? t('waiting.emptyDescription', 'All work items are progressing')
 : t('waiting.emptyCategory', 'No items waiting for this reason'))}
 </p>
 {hasFilters && (
 <Button
 variant="outline"
 size="sm"
 onClick={clearFilters}
 className="min-h-9"
 >
 {t('waitingQueue.filters.clearFilters')}
 </Button>
 )}
 </Card>
 )}

 {/* Items List - T093: Virtualized for lists >100 items */}
 {!isLoading && filteredItems && filteredItems.length > 0 && (
 <>
 {!shouldVirtualize ? (
 /* Regular rendering for short lists (<100 items) */
 <div className="space-y-3">
 {filteredItems.map((item) => {
 const agingStatus = getAgingStatus(item.assigned_at)
 const TypeIcon = getTypeIcon(item.work_item_type)

 const linkedEntitiesText = getLinkedEntitiesText(item)
 const engagement = item.work_item?.engagement

 return (
 <Card
 key={item.id}
 className="group cursor-pointer p-4 transition-all hover:shadow-lg sm:p-6"
 data-testid="assignment-row"
 data-has-reminder="false"
 onClick={() => handleNavigateToTask(item.work_item_id)}
 >
 <div className="flex gap-3 sm:gap-4">
 {/* Checkbox for bulk selection */}
 <div className="flex items-start pt-1">
 <Checkbox
 checked={isSelected(item.id)}
 onCheckedChange={(e) => {
 e.stopPropagation()
 if (!isSelected(item.id) && maxReached) {
 toast({
 variant: 'destructive',
 title: t('waitingQueue.bulkActions.maxReached'),
 description: t('waitingQueue.bulkActions.maxReachedDesc'),
 })
 return
 }
 toggleSelection(item.id)
 }}
 onClick={(e) => e.stopPropagation()}
 aria-label={t('waitingQueue.bulkActions.selectItem', { id: item.work_item_id })}
 className="mt-0.5 size-5"
 />
 </div>

 {/* Main Content */}
 <div className="min-w-0 flex-1">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
 <div className="flex-1 space-y-3">
 <div className="flex flex-wrap items-center gap-2">
 <h3
 className="text-base font-semibold text-foreground transition-colors group-hover:text-primary sm:text-lg"
 data-testid="row-work-item-id"
 >
 {getWorkItemTitle(item)}
 </h3>
 <Badge variant="outline" className="capitalize">{item.priority}</Badge>
 {agingStatus.severity === 'critical' && (
 <Badge variant="destructive" className="gap-1">
 <AlertTriangle className="size-3" />
 {agingStatus.days}d
 </Badge>
 )}
 </div>

 {/* Engagement Info */}
 {engagement && (
 <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-sm dark:bg-blue-950">
 <UserCheck className="size-4 text-blue-600 dark:text-blue-400" />
 <span className="font-medium text-blue-900 dark:text-blue-100">
 {engagement.title}
 </span>
 {engagement.dossiers && (
 <>
 <span className="text-blue-600 dark:text-blue-400">•</span>
 <span className="text-xs text-blue-700 dark:text-blue-300">
 {isRTL ? engagement.dossiers.name_ar : engagement.dossiers.name_en}
 </span>
 </>
 )}
 </div>
 )}

 {/* Linked Entities */}
 {linkedEntitiesText && (
 <div className="text-sm text-muted-foreground">
 {linkedEntitiesText}
 </div>
 )}

 {/* Waiting Status */}
 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 <TypeIcon className="size-4" />
 <span className="capitalize">
 {item.status}
 </span>
 <span>•</span>
 <span className={agingStatus.color}>
 {t('waiting.waitingFor', 'Waiting for')} {agingStatus.days}{' '}
 {agingStatus.days === 1 ? t('waiting.day', 'day') : t('waiting.days', 'days')}
 </span>
 </div>

 {/* Metadata */}
 <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
 <span data-testid="row-assignee-name">
 {t('waiting.assignee', 'Assignee')}: {item.assignee_name}
 </span>
 <span>•</span>
 <span>
 {t('waiting.status', 'Status')}: {item.status}
 </span>
 <span>•</span>
 <span>ID: {item.work_item_id.substring(0, 8)}...</span>
 </div>
 </div>

 {/* Actions */}
 <div className="flex gap-2 sm:flex-col">
 <ReminderButton
 assignmentId={item.id}
 assigneeId={item.assignee_id}
 lastReminderSentAt={item.last_reminder_sent_at}
 workItemId={item.work_item_id}
 variant="outline"
 size="sm"
 className="flex-1 sm:flex-none"
 onClick={(e) => e.stopPropagation()}
 />
 </div>
 </div>
 </div>
 </div>
 </Card>
 )
 })}
 </div>
 ) : (
 /* Virtualized rendering for long lists (>100 items) */
 <div
 ref={parentRef}
 className="overflow-auto"
 style={{
 height: '600px', // Fixed height for virtual scrolling
 }}
 >
 <div
 style={{
 height: `${virtualizer.getTotalSize()}px`,
 width: '100%',
 position: 'relative',
 }}
 >
 {virtualizer.getVirtualItems().map((virtualItem) => {
 const item = filteredItems[virtualItem.index]
 const agingStatus = getAgingStatus(item.assigned_at)
 const TypeIcon = getTypeIcon(item.work_item_type)
 const linkedEntitiesText = getLinkedEntitiesText(item)
 const engagement = item.work_item?.engagement

 return (
 <div
 key={item.id}
 data-index={virtualItem.index}
 ref={virtualizer.measureElement}
 style={{
 position: 'absolute',
 top: 0,
 left: 0,
 width: '100%',
 transform: `translateY(${virtualItem.start}px)`,
 }}
 >
 <Card
 className="group mb-3 cursor-pointer p-4 transition-all hover:shadow-lg sm:p-6"
 data-testid="assignment-row"
 data-has-reminder="false"
 onClick={() => handleNavigateToTask(item.work_item_id)}
 >
 <div className="flex gap-3 sm:gap-4">
 {/* Checkbox for bulk selection */}
 <div className="flex items-start pt-1">
 <Checkbox
 checked={isSelected(item.id)}
 onCheckedChange={(e) => {
 e.stopPropagation()
 if (!isSelected(item.id) && maxReached) {
 toast({
 variant: 'destructive',
 title: t('waitingQueue.bulkActions.maxReached'),
 description: t('waitingQueue.bulkActions.maxReachedDesc'),
 })
 return
 }
 toggleSelection(item.id)
 }}
 onClick={(e) => e.stopPropagation()}
 aria-label={t('waitingQueue.bulkActions.selectItem', { id: item.work_item_id })}
 className="mt-0.5 size-5"
 />
 </div>

 {/* Main Content */}
 <div className="min-w-0 flex-1">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
 <div className="flex-1 space-y-3">
 <div className="flex flex-wrap items-center gap-2">
 <h3
 className="text-base font-semibold text-foreground transition-colors group-hover:text-primary sm:text-lg"
 data-testid="row-work-item-id"
 >
 {getWorkItemTitle(item)}
 </h3>
 <Badge variant="outline" className="capitalize">{item.priority}</Badge>
 {agingStatus.severity === 'critical' && (
 <Badge variant="destructive" className="gap-1">
 <AlertTriangle className="size-3" />
 {agingStatus.days}d
 </Badge>
 )}
 </div>

 {/* Engagement Info */}
 {engagement && (
 <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-sm dark:bg-blue-950">
 <UserCheck className="size-4 text-blue-600 dark:text-blue-400" />
 <span className="font-medium text-blue-900 dark:text-blue-100">
 {engagement.title}
 </span>
 {engagement.dossiers && (
 <>
 <span className="text-blue-600 dark:text-blue-400">•</span>
 <span className="text-xs text-blue-700 dark:text-blue-300">
 {isRTL ? engagement.dossiers.name_ar : engagement.dossiers.name_en}
 </span>
 </>
 )}
 </div>
 )}

 {/* Linked Entities */}
 {linkedEntitiesText && (
 <div className="text-sm text-muted-foreground">
 {linkedEntitiesText}
 </div>
 )}

 {/* Waiting Status */}
 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 <TypeIcon className="size-4" />
 <span className="capitalize">
 {item.status}
 </span>
 <span>•</span>
 <span className={agingStatus.color}>
 {t('waiting.waitingFor', 'Waiting for')} {agingStatus.days}{' '}
 {agingStatus.days === 1 ? t('waiting.day', 'day') : t('waiting.days', 'days')}
 </span>
 </div>

 {/* Metadata */}
 <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
 <span data-testid="row-assignee-name">
 {t('waiting.assignee', 'Assignee')}: {item.assignee_name}
 </span>
 <span>•</span>
 <span>
 {t('waiting.status', 'Status')}: {item.status}
 </span>
 <span>•</span>
 <span>ID: {item.work_item_id.substring(0, 8)}...</span>
 </div>
 </div>

 {/* Actions */}
 <div className="flex gap-2 sm:flex-col">
 <ReminderButton
 assignmentId={item.id}
 assigneeId={item.assignee_id}
 lastReminderSentAt={item.last_reminder_sent_at}
 workItemId={item.work_item_id}
 variant="outline"
 size="sm"
 className="flex-1 sm:flex-none"
 onClick={(e) => e.stopPropagation()}
 />
 </div>
 </div>
 </div>
 </div>
 </Card>
 </div>
 )
 })}
 </div>
 </div>
 )}
 </>
 )}
 </TabsContent>
 </Tabs>
 </main>
 </div>

 </div>
 )
}

/**
 * Exported component wrapped with QueryErrorBoundary (T095)
 * Provides graceful error handling for query errors
 */
export function WaitingQueuePage() {
 return (
 <QueryErrorBoundary>
 <WaitingQueuePageInner />
 </QueryErrorBoundary>
 )
}
