/**
 * AttentionZone — Attention items list with severity grouping
 * Phase 10: Operations Hub Dashboard
 *
 * Renders overdue, due-soon, SLA-at-risk, and stalled items
 * sorted by severity (red > orange > yellow per D-13).
 * Handles loading, error, and empty states.
 */

import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AttentionItem } from './AttentionItem'
import { EmptyAttention } from './EmptyAttention'
import type {
  AttentionItemData,
  AttentionSeverity,
} from '@/domains/operations-hub/types/operations-hub.types'

// ============================================================================
// Severity Sort Order
// ============================================================================

const SEVERITY_ORDER: Record<AttentionSeverity, number> = {
  red: 0,
  orange: 1,
  yellow: 2,
}

// ============================================================================
// Entity Route Map
// ============================================================================

function getEntityRoute(entityType: string, entityId: string): string {
  switch (entityType) {
    case 'task':
    case 'commitment':
      return `/tasks/${entityId}`
    case 'intake':
      return `/intake/${entityId}`
    case 'engagement':
      return `/engagements/${entityId}`
    default:
      return `/tasks/${entityId}`
  }
}

// ============================================================================
// Component
// ============================================================================

interface AttentionZoneProps {
  items: AttentionItemData[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

export function AttentionZone({
  items,
  isLoading,
  isError,
  onRetry,
}: AttentionZoneProps): React.ReactElement {
  const { t } = useTranslation('operations-hub')
  const navigate = useNavigate()

  // Loading state
  if (isLoading) {
    return (
      <div
        role="region"
        aria-label={t('zones.attention.title')}
        aria-live="polite"
        className="space-y-3"
      >
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton
            key={i}
            /* eslint-disable no-restricted-syntax -- Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#AttentionZone */
            className={`h-16 rounded-[var(--radius-sm)] ${
              i === 0
                ? 'border border-destructive/20'
                : i === 1
                  ? 'border border-warning/20'
                  : 'border border-yellow-500/20'
            }`}
            /* eslint-enable no-restricted-syntax */
          />
        ))}
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div
        role="region"
        aria-label={t('zones.attention.title')}
        aria-live="polite"
        className="rounded-[var(--radius)] border border-destructive/30 bg-destructive/5 p-4"
      >
        <p className="text-sm text-destructive mb-2">
          {t('error.load_failed', { zone: t('zones.attention.title') })}
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
      <div role="region" aria-label={t('zones.attention.title')} aria-live="polite">
        <EmptyAttention />
      </div>
    )
  }

  // Sort by severity: red > orange > yellow
  const sortedItems = [...items].sort((a, b) => {
    const orderA = SEVERITY_ORDER[a.severity] ?? 2
    const orderB = SEVERITY_ORDER[b.severity] ?? 2
    return orderA - orderB
  })

  return (
    <div
      role="region"
      aria-label={t('zones.attention.title')}
      aria-live="polite"
      className="space-y-2"
    >
      {sortedItems.map((item) => (
        <AttentionItem
          key={item.id}
          item={item}
          onClick={(): void => {
            void navigate({ to: getEntityRoute(item.entity_type, item.entity_id) })
          }}
        />
      ))}
    </div>
  )
}
