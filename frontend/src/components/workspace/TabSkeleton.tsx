/**
 * TabSkeleton
 * Loading skeleton variants for workspace tab content.
 *
 * Provides visual feedback while lazy-loaded tab components resolve.
 * Four layout variants match the expected content shape of each tab.
 */

import type { ReactElement } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// ============================================================================
// Props
// ============================================================================

interface TabSkeletonProps {
  type: 'summary' | 'kanban' | 'list' | 'cards'
}

// ============================================================================
// Variant renderers
// ============================================================================

function SummarySkeleton(): ReactElement {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-md" />
        ))}
      </div>
      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-md" />
        <Skeleton className="h-48 rounded-md" />
      </div>
    </div>
  )
}

function KanbanSkeleton(): ReactElement {
  return (
    <div className="flex gap-4 overflow-x-auto scrollbar-hide p-4 sm:p-6">
      {Array.from({ length: 4 }, (_, col) => (
        <div key={col} className="min-w-[250px] flex-1 space-y-3">
          {/* Column header */}
          <Skeleton className="h-8 rounded-md" />
          {/* Card skeletons */}
          {Array.from({ length: 3 }, (_, card) => (
            <Skeleton key={card} className="h-16 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  )
}

function ListSkeleton(): ReactElement {
  const widths = ['100%', '85%', '90%', '75%', '95%', '80%']

  return (
    <div className="space-y-3 p-4 sm:p-6">
      {widths.map((width, i) => (
        <Skeleton key={i} className="h-12 rounded-md" style={{ width }} />
      ))}
    </div>
  )
}

function CardsSkeleton(): ReactElement {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {Array.from({ length: 3 }, (_, section) => (
        <div key={section} className="space-y-3">
          {/* Section header */}
          <Skeleton className="h-6 w-40 rounded-md" />
          {/* Badge cards */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }, (_, badge) => (
              <Skeleton key={badge} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Component
// ============================================================================

export function TabSkeleton({ type }: TabSkeletonProps): ReactElement {
  switch (type) {
    case 'summary':
      return <SummarySkeleton />
    case 'kanban':
      return <KanbanSkeleton />
    case 'list':
      return <ListSkeleton />
    case 'cards':
      return <CardsSkeleton />
  }
}
