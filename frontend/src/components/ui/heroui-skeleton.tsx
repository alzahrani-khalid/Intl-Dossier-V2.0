/**
 * HeroUI Skeleton Wrapper + presets — Phase 33-05 (Wave 3)
 *
 * Real @heroui/react Skeleton primitive for the base loader. Preset
 * compositions (SkeletonCard / SkeletonText / SkeletonTable / SkeletonAvatar
 * / SkeletonButton) have been moved here from components/ui/skeleton.tsx so
 * that file can become a pure re-export shim (matching card.tsx / badge.tsx).
 *
 * Token model (SC-5): semantic utilities only — `bg-muted` (D-16 remap),
 * `border-border`, `bg-card`. No literal color utilities.
 */

import type * as React from 'react'
import { Skeleton as HeroUISkeletonPrimitive } from '@heroui/react'
import { cn } from '@/lib/utils'

function HeroUISkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <HeroUISkeletonPrimitive
      data-slot="skeleton"
      className={cn('animate-pulse rounded-[var(--radius-sm)] bg-[var(--line-soft)]', className)}
      {...props}
    />
  )
}

function SkeletonCard(): React.JSX.Element {
  return (
    <div className="card space-y-3">
      <div className="flex items-start gap-3">
        <HeroUISkeleton className="h-5 w-5" />
        <div className="flex-1 space-y-2">
          <HeroUISkeleton className="h-5 w-3/4" />
          <HeroUISkeleton className="h-4 w-full" />
          <HeroUISkeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  )
}

function SkeletonText({ lines = 3 }: { lines?: number }): React.JSX.Element {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, n) => n).map((n) => (
        <HeroUISkeleton key={n} className={cn('h-4', n === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

function SkeletonTable({
  rows = 5,
  columns = 4,
}: {
  rows?: number
  columns?: number
}): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 border-b border-[var(--line)] pb-3">
        {Array.from({ length: columns }, (_, n) => n).map((n) => (
          <HeroUISkeleton key={n} className="h-5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, n) => n).map((n) => (
        <div key={n} className="flex gap-4">
          {Array.from({ length: columns }, (_, c) => c).map((c) => (
            <HeroUISkeleton key={c} className="h-9 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }): React.JSX.Element {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }
  return <HeroUISkeleton className={cn('rounded-full', sizeClasses[size])} />
}

function SkeletonButton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }): React.JSX.Element {
  const sizeClasses = {
    sm: 'h-9 w-20',
    md: 'h-10 w-24',
    lg: 'h-11 w-28',
  }
  return <HeroUISkeleton className={cn('rounded-[var(--radius-sm)]', sizeClasses[size])} />
}

export { HeroUISkeleton, SkeletonCard, SkeletonText, SkeletonTable, SkeletonAvatar, SkeletonButton }
export default HeroUISkeleton
