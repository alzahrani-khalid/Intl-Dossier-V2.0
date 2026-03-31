/**
 * QuickStatCard — Individual stat metric card
 * Phase 10: Operations Hub Dashboard
 *
 * Renders a single stat with icon, metric value, and label.
 * Alert badge shown when alertBadge=true and value > 0.
 */

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

// ============================================================================
// Component
// ============================================================================

interface QuickStatCardProps {
  label: string
  value: number
  icon: LucideIcon
  onClick: () => void
  alertBadge?: boolean
  isLoading?: boolean
}

export function QuickStatCard({
  label,
  value,
  icon: IconComponent,
  onClick,
  alertBadge = false,
  isLoading = false,
}: QuickStatCardProps): React.ReactElement {
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <CardContent className="p-0 space-y-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'relative cursor-pointer hover:bg-muted/50 transition-colors min-h-11 p-4',
      )}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`${value} ${label}`}
    >
      <CardContent className="p-0 space-y-2">
        <IconComponent className="text-primary" size={24} />
        <LtrIsolate className="text-4xl sm:text-[56px] font-semibold leading-tight">
          {value}
        </LtrIsolate>
        <p className="text-sm font-normal text-muted-foreground">
          {label}
        </p>
      </CardContent>
      {alertBadge && value > 0 && (
        <span
          className="absolute top-3 end-3 h-2.5 w-2.5 rounded-full bg-destructive"
          aria-hidden="true"
        />
      )}
    </Card>
  )
}
