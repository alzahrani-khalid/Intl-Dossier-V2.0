/**
 * DrawerSkeleton — body-level placeholder rendered while the dossier overview
 * query is loading. Mirrors the per-section shapes so the eventual swap to
 * real content is visually stable.
 *
 * 4 mini-kpi placeholders + 1 summary + 2 upcoming + 4 activity + 2 commitments
 * (counts asserted by Wave 0 unit test).
 */
import type * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function DrawerSkeleton(): React.JSX.Element {
  return (
    <div
      className="flex flex-col gap-[var(--space-6)]"
      data-testid="dossier-drawer-skeleton"
    >
      {/* mini KPI strip x4 */}
      <div className="kpi-mini-strip" data-testid="skeleton-kpi-row">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="kpi-mini" data-testid="skeleton-kpi-cell">
            <Skeleton className="h-[22px] w-8" />
            <Skeleton className="h-[11px] w-16 mt-2" />
          </div>
        ))}
      </div>
      {/* summary x1 */}
      <Skeleton className="h-12 w-full" data-testid="skeleton-summary-row" />
      {/* upcoming x2 */}
      <div className="flex flex-col gap-2" data-testid="skeleton-upcoming-row">
        <Skeleton className="h-10 w-full" data-testid="skeleton-upcoming-item" />
        <Skeleton className="h-10 w-full" data-testid="skeleton-upcoming-item" />
      </div>
      {/* recent activity x4 */}
      <div className="act-list" data-testid="skeleton-activity-row">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" data-testid="skeleton-activity-item" />
        ))}
      </div>
      {/* commitments x2 */}
      <div className="flex flex-col gap-2" data-testid="skeleton-commitments-row">
        <Skeleton className="h-10 w-full" data-testid="skeleton-commitments-item" />
        <Skeleton className="h-10 w-full" data-testid="skeleton-commitments-item" />
      </div>
    </div>
  )
}
