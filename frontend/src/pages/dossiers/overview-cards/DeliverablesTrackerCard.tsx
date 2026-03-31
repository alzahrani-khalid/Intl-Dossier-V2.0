/**
 * DeliverablesTrackerCard
 *
 * Working-group-specific card showing deliverable status summary.
 * Per D-11: summary-level, NOT full CRUD. Shows counts by status.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { Skeleton } from '@/components/ui/skeleton'
import { ClipboardCheck } from 'lucide-react'

interface DeliverablesTrackerCardProps {
  dossierId: string
}

interface StatusCount {
  label: string
  count: number
  colorClass: string
}

export function DeliverablesTrackerCard({
  dossierId,
}: DeliverablesTrackerCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const { data, isLoading } = useDossierOverview(dossierId, {
    includeSections: ['work_items'],
  })

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-16" />
          ))}
        </div>
      </div>
    )
  }

  const breakdown = data?.work_items?.status_breakdown

  const statuses: StatusCount[] = [
    {
      label: t('overview.deliverables.completed', { defaultValue: 'Completed' }),
      count: breakdown?.completed ?? 0,
      colorClass: 'text-success',
    },
    {
      label: t('overview.deliverables.inProgress', { defaultValue: 'In Progress' }),
      count: breakdown?.in_progress ?? 0,
      colorClass: 'text-warning',
    },
    {
      label: t('overview.deliverables.pending', { defaultValue: 'Pending' }),
      count: breakdown?.pending ?? 0,
      colorClass: 'text-muted-foreground',
    },
  ]

  const totalCount = statuses.reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-4">
        <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold leading-tight text-start">
          {t('overview.deliverables.title', { defaultValue: 'Deliverables' })}
        </h3>
      </div>

      {totalCount === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('overview.deliverables.empty', { defaultValue: 'No deliverables tracked' })}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {statuses.map((status) => (
            <div
              key={status.label}
              className="flex flex-col items-center rounded-md bg-muted/50 p-3"
            >
              <span className={`text-lg font-semibold ${status.colorClass}`}>
                {status.count}
              </span>
              <span className="text-xs text-muted-foreground text-center mt-1">
                {status.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
