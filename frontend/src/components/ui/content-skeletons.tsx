/**
 * Content-Aware Skeleton Components
 *
 * Pre-built skeleton components that mirror the structure of common data patterns.
 * These provide visual continuity and set accurate expectations during loading.
 *
 * Mobile-first, RTL-compatible
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ============================================================================
// Base Types
// ============================================================================

interface BaseSkeletonProps {
  className?: string
  /** Number of items to show */
  count?: number
  /** Animate the skeleton */
  animate?: boolean
}

// ============================================================================
// List Item Skeletons
// ============================================================================

/**
 * Skeleton for a work item / task card
 */
export function WorkItemSkeleton({ className }: BaseSkeletonProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <Card className={cn('overflow-hidden', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status/Type icon */}
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title */}
            <Skeleton className="h-4 w-3/4" />
            {/* Subtitle */}
            <Skeleton className="h-3 w-1/2" />
            {/* Tags/badges row */}
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
          {/* Actions */}
          <Skeleton className="h-8 w-8 rounded shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton for a list of work items
 */
export function WorkItemListSkeleton({ count = 5, className }: BaseSkeletonProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div className={cn('space-y-3', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {Array.from({ length: count }).map((_, i) => (
        <WorkItemSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for a person/contact card
 */
export function PersonCardSkeleton({ className }: BaseSkeletonProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <Card className={cn('overflow-hidden', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            {/* Name */}
            <Skeleton className="h-4 w-2/3" />
            {/* Title/Role */}
            <Skeleton className="h-3 w-1/2" />
            {/* Organization */}
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton for a data table row
 */
export function TableRowSkeleton({
  columns = 5,
  className,
}: BaseSkeletonProps & { columns?: number }) {
  return (
    <div className={cn('flex items-center gap-4 py-3 border-b last:border-b-0', className)}>
      {/* Checkbox */}
      <Skeleton className="h-4 w-4 rounded shrink-0" />
      {/* Columns */}
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4 flex-1', i === 0 && 'w-1/4', i === columns - 1 && 'w-1/6')}
        />
      ))}
    </div>
  )
}

/**
 * Skeleton for a data table
 */
export function TableSkeleton({
  rows = 10,
  columns = 5,
  showHeader = true,
  className,
}: BaseSkeletonProps & { rows?: number; columns?: number; showHeader?: boolean }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div className={cn('rounded-lg border overflow-hidden', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center gap-4 px-4 py-3 bg-muted/50 border-b">
          <Skeleton className="h-4 w-4 rounded shrink-0" />
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      )}
      {/* Rows */}
      <div className="px-4 divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} columns={columns} />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Dashboard Skeletons
// ============================================================================

/**
 * Skeleton for a metric/KPI card
 */
export function MetricCardSkeleton({ className }: BaseSkeletonProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <Card className={cn('overflow-hidden', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-20" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton for a grid of metric cards
 */
export function MetricsGridSkeleton({
  count = 4,
  columns = 4,
  className,
}: BaseSkeletonProps & { columns?: number }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const gridCols =
    {
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'

  return (
    <div className={cn('grid gap-4', gridCols, className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {Array.from({ length: count }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for a chart/graph area
 */
export function ChartSkeleton({
  className,
  height = 'h-64 sm:h-80',
}: BaseSkeletonProps & { height?: string }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <Card className={cn('overflow-hidden', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className={cn('w-full rounded-lg', height)} />
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Timeline Skeletons
// ============================================================================

/**
 * Skeleton for a timeline item
 */
export function TimelineItemSkeleton({ className }: BaseSkeletonProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div className={cn('flex gap-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <Skeleton className="h-3 w-3 rounded-full shrink-0" />
        <Skeleton className="w-0.5 h-full min-h-[40px] mt-1" />
      </div>
      {/* Content */}
      <div className="flex-1 pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

/**
 * Skeleton for a timeline
 */
export function TimelineSkeleton({ count = 5, className }: BaseSkeletonProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div className={cn('', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {Array.from({ length: count }).map((_, i) => (
        <TimelineItemSkeleton key={i} />
      ))}
    </div>
  )
}

// ============================================================================
// Form Skeletons
// ============================================================================

/**
 * Skeleton for a form field
 */
export function FormFieldSkeleton({ className }: BaseSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  )
}

/**
 * Skeleton for a form
 */
export function FormSkeleton({
  fields = 4,
  columns = 1,
  showSubmit = true,
  className,
}: BaseSkeletonProps & { fields?: number; columns?: number; showSubmit?: boolean }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const gridCols =
    {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    }[columns] || 'grid-cols-1'

  return (
    <div className={cn('space-y-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={cn('grid gap-4', gridCols)}>
        {Array.from({ length: fields }).map((_, i) => (
          <FormFieldSkeleton key={i} />
        ))}
      </div>
      {showSubmit && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Detail Page Skeletons
// ============================================================================

/**
 * Skeleton for a detail page header
 */
export function DetailHeaderSkeleton({ className }: BaseSkeletonProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div className={cn('space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 sm:h-10 w-3/4 max-w-md" />
          <Skeleton className="h-4 w-1/2 max-w-xs" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for a tabbed content area
 */
export function TabbedContentSkeleton({
  tabs = 4,
  className,
}: BaseSkeletonProps & { tabs?: number }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div className={cn('space-y-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Tab list */}
      <div className="flex items-center gap-1 border-b pb-1 overflow-x-auto">
        {Array.from({ length: tabs }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn('h-9 rounded-md', i === 0 ? 'w-24 bg-primary/20' : 'w-20')}
          />
        ))}
      </div>
      {/* Tab content */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}

// ============================================================================
// Kanban Board Skeleton
// ============================================================================

/**
 * Skeleton for a kanban card
 */
export function KanbanCardSkeleton({ className }: BaseSkeletonProps) {
  return (
    <div className={cn('p-3 rounded-lg border bg-card space-y-2', className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

/**
 * Skeleton for a kanban column
 */
export function KanbanColumnSkeleton({
  cards = 4,
  className,
}: BaseSkeletonProps & { cards?: number }) {
  return (
    <div className={cn('w-72 shrink-0 rounded-lg bg-muted/50 p-3 space-y-3', className)}>
      {/* Column header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-6 rounded-full" />
      </div>
      {/* Cards */}
      <div className="space-y-2">
        {Array.from({ length: cards }).map((_, i) => (
          <KanbanCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton for a kanban board
 */
export function KanbanBoardSkeleton({
  columns = 4,
  cardsPerColumn = 4,
  className,
}: BaseSkeletonProps & { columns?: number; cardsPerColumn?: number }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {Array.from({ length: columns }).map((_, i) => (
        <KanbanColumnSkeleton key={i} cards={cardsPerColumn} />
      ))}
    </div>
  )
}

// ============================================================================
// Calendar Skeleton
// ============================================================================

/**
 * Skeleton for a calendar grid
 */
export function CalendarSkeleton({ className }: BaseSkeletonProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <Card className={cn('overflow-hidden', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 rounded" />
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-16 sm:h-20 rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Network Graph Skeleton
// ============================================================================

/**
 * Skeleton for a network/relationship graph
 */
export function NetworkGraphSkeleton({
  className,
  height = 'h-96',
}: BaseSkeletonProps & { height?: string }) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <Card className={cn('overflow-hidden', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn('relative rounded-lg bg-muted/30', height)}>
          {/* Simulated nodes */}
          <Skeleton className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full" />
          <Skeleton className="absolute top-1/4 left-1/4 h-12 w-12 rounded-full" />
          <Skeleton className="absolute top-1/4 right-1/4 h-12 w-12 rounded-full" />
          <Skeleton className="absolute bottom-1/4 left-1/3 h-10 w-10 rounded-full" />
          <Skeleton className="absolute bottom-1/4 right-1/3 h-10 w-10 rounded-full" />
          <Skeleton className="absolute top-1/3 left-1/6 h-8 w-8 rounded-full" />
          <Skeleton className="absolute bottom-1/3 right-1/6 h-8 w-8 rounded-full" />
        </div>
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// All components are exported inline via `export function`
