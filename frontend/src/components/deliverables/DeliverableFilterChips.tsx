/**
 * DeliverableFilterChips Component
 * Feature: commitment-deliverables
 *
 * Displays active filters as removable chips.
 * Mobile-first, RTL-aware design.
 */

import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { DeliverableFilters } from '@/types/deliverable.types'

interface DeliverableFilterChipsProps {
  filters: DeliverableFilters
  onRemoveFilter: (key: keyof DeliverableFilters, value?: string) => void
  onClearAll: () => void
}

export function DeliverableFilterChips({
  filters,
  onRemoveFilter,
  onClearAll,
}: DeliverableFilterChipsProps) {
  const { t, i18n } = useTranslation('deliverables')
  const isRTL = i18n.language === 'ar'

  const chips: Array<{ key: keyof DeliverableFilters; value: string; label: string }> = []

  // Status chips
  filters.status?.forEach((status) => {
    chips.push({
      key: 'status',
      value: status,
      label: t(`status.${status}`),
    })
  })

  // Priority chips
  filters.priority?.forEach((priority) => {
    chips.push({
      key: 'priority',
      value: priority,
      label: t(`priority.${priority}`),
    })
  })

  // Responsible user chip
  if (filters.responsibleUserId) {
    chips.push({
      key: 'responsibleUserId',
      value: filters.responsibleUserId,
      label: t('filters.assignedUser'),
    })
  }

  // Overdue chip
  if (filters.overdue) {
    chips.push({
      key: 'overdue',
      value: 'true',
      label: t('filters.overdueOnly'),
    })
  }

  // Date range chips
  if (filters.dueDateFrom) {
    chips.push({
      key: 'dueDateFrom',
      value: filters.dueDateFrom,
      label: `${t('filters.from')}: ${filters.dueDateFrom}`,
    })
  }

  if (filters.dueDateTo) {
    chips.push({
      key: 'dueDateTo',
      value: filters.dueDateTo,
      label: `${t('filters.to')}: ${filters.dueDateTo}`,
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 px-1 mb-3" dir={isRTL ? 'rtl' : 'ltr'}>
      {chips.map((chip, index) => (
        <Badge
          key={`${chip.key}-${chip.value}-${index}`}
          variant="secondary"
          className="ps-2 pe-1 py-1 gap-1 text-xs"
        >
          <span>{chip.label}</span>
          <button
            onClick={() => onRemoveFilter(chip.key, chip.value)}
            className={cn(
              'p-0.5 rounded hover:bg-muted-foreground/20 transition-colors',
              'focus:outline-none focus:ring-1 focus:ring-ring',
            )}
            aria-label={t('filters.removeFilter', { filter: chip.label })}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {chips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {t('filters.clearAll')}
        </Button>
      )}
    </div>
  )
}

export default DeliverableFilterChips
