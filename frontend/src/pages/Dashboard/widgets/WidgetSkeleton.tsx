import { type ReactElement } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export interface WidgetSkeletonProps {
  rows?: number
}

export function WidgetSkeleton({ rows = 3 }: WidgetSkeletonProps): ReactElement {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, idx) => (
        <Skeleton key={idx} className="h-10 w-full min-h-[40px]" />
      ))}
    </div>
  )
}
