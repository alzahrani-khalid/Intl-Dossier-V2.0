/**
 * ActivityFeed — Recent activity list
 * Phase 10: Operations Hub Dashboard
 *
 * Shows recent actions in reverse chronological order.
 * Max 10 items displayed. Handles loading, error, and empty states.
 */

import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ActivityFeedItem } from './ActivityFeedItem'
import type { ActivityItemData } from '@/domains/operations-hub/types/operations-hub.types'

// ============================================================================
// Constants
// ============================================================================

const MAX_VISIBLE_ITEMS = 10

// ============================================================================
// Component
// ============================================================================

interface ActivityFeedProps {
  items: ActivityItemData[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

export function ActivityFeed({
  items,
  isLoading,
  isError,
  onRetry,
}: ActivityFeedProps): React.ReactElement {
  const { t } = useTranslation('operations-hub')

  // Loading state
  if (isLoading) {
    return (
      <div role="region" aria-label={t('zones.activity.title')} className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-start gap-3 py-2">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div
        role="region"
        aria-label={t('zones.activity.title')}
        className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
      >
        <p className="text-sm text-destructive mb-2">
          {t('error.load_failed', { zone: t('zones.activity.title') })}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('error.retry')}
        </Button>
      </div>
    )
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div role="region" aria-label={t('zones.activity.title')}>
        <p className="text-sm text-muted-foreground py-4">
          {t('zones.activity.empty')}
        </p>
      </div>
    )
  }

  // Data state — max 10 items
  const visibleItems = items.slice(0, MAX_VISIBLE_ITEMS)

  return (
    <div role="region" aria-label={t('zones.activity.title')} className="divide-y">
      {visibleItems.map((item) => (
        <ActivityFeedItem key={item.id} item={item} />
      ))}
    </div>
  )
}
