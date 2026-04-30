/**
 * AttentionItem — Individual attention card with cva severity variants
 * Phase 10: Operations Hub Dashboard
 *
 * Renders a single attention item (overdue, due-soon, SLA-at-risk, stalled)
 * with severity-based coloring per UI-SPEC color contract.
 */

import { useTranslation } from 'react-i18next'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import type {
  AttentionItemData,
  AttentionSeverity,
} from '@/domains/operations-hub/types/operations-hub.types'

// ============================================================================
// Severity Variants (cva)
// ============================================================================

const attentionItemVariants = cva(
  'flex items-center gap-3 rounded-[var(--radius-sm)] border p-3 sm:p-4 transition-colors cursor-pointer min-h-11',
  {
    variants: {
      severity: {
        red: 'border-destructive/50 bg-destructive/5 hover:bg-destructive/10',
        orange: 'border-warning/50 bg-warning/5 hover:bg-warning/10',
        yellow: 'border-yellow-500/50 bg-yellow-500/5 hover:bg-yellow-500/10',
      },
    },
    defaultVariants: {
      severity: 'yellow',
    },
  },
)

// ============================================================================
// Severity Badge Color Map
// ============================================================================

const severityBadgeColor: Record<AttentionSeverity, string> = {
  red: 'text-destructive',
  orange: 'text-warning',
  yellow: 'text-yellow-600',
}

// ============================================================================
// Item Type to Severity Key Map
// ============================================================================

const itemTypeSeverityKey: Record<string, string> = {
  overdue_work: 'overdue',
  due_soon_work: 'due_soon',
  sla_at_risk: 'sla_at_risk',
  stalled_engagement: 'stalled',
}

// ============================================================================
// Component
// ============================================================================

interface AttentionItemProps extends VariantProps<typeof attentionItemVariants> {
  item: AttentionItemData
  onClick: () => void
}

export function AttentionItem({ item, onClick }: AttentionItemProps): React.ReactElement {
  const { t, i18n } = useTranslation('operations-hub')

  const title =
    i18n.language === 'ar' && item.title_ar != null && item.title_ar !== ''
      ? item.title_ar
      : item.title

  const severityKey = itemTypeSeverityKey[item.item_type] ?? 'due_soon'
  const badgeLabel = t(`severity.${severityKey}`)

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  const detailText =
    item.item_type === 'stalled_engagement'
      ? t('severity.stalled_detail', {
          days: Math.floor(item.days_in_stage ?? 0),
          stage: t(`stages.${item.lifecycle_stage ?? 'intake'}`),
        })
      : item.deadline != null
        ? (() => {
            const deadlineDate = new Date(item.deadline)
            return deadlineDate.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
              month: 'short',
              day: 'numeric',
            })
          })()
        : null

  return (
    <div
      className={cn(attentionItemVariants({ severity: item.severity }))}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`${badgeLabel}: ${title}`}
    >
      <Badge
        className={cn(
          'shrink-0 border-transparent bg-transparent text-xs font-semibold',
          severityBadgeColor[item.severity],
        )}
      >
        {badgeLabel}
      </Badge>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-normal truncate block">{title}</span>
        {detailText != null && (
          <span className="text-xs text-muted-foreground block mt-0.5">
            {item.item_type === 'stalled_engagement' ? (
              detailText
            ) : (
              <LtrIsolate className="inline">{detailText}</LtrIsolate>
            )}
          </span>
        )}
      </div>
    </div>
  )
}

export { attentionItemVariants }
