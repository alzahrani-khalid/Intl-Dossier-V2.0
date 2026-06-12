/**
 * SharedRecentActivityCard
 *
 * Shows the last N activities in a compact list for any dossier type.
 * Used in all overview tabs.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useDossierActivityTimeline } from '@/hooks/useDossierActivityTimeline'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { CheckCircle2, Clock, AlertCircle, FileText, GitPullRequest } from 'lucide-react'

interface SharedRecentActivityCardProps {
  dossierId: string
  maxItems?: number
}

// Defensive relative-time formatter. The edge function emits `activity_timestamp`;
// guard nullish / invalid values before date-fns so a malformed timestamp renders
// a neutral em-dash placeholder instead of throwing RangeError: Invalid time value.
function formatActivityTime(timestamp: string | null | undefined, isRTL: boolean): string {
  if (timestamp === undefined || timestamp === null || timestamp === '') return '—'
  const d = new Date(timestamp)
  if (Number.isNaN(d.getTime())) return '—'
  return formatDistanceToNow(d, { addSuffix: true, locale: isRTL ? ar : enUS })
}

function getActivityIcon(status: string): React.ReactNode {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
    case 'in_progress':
      return <Clock className="h-4 w-4 text-warning flex-shrink-0" />
    case 'overdue':
      return <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
    case 'review':
      return <GitPullRequest className="h-4 w-4 text-primary flex-shrink-0" />
    default:
      return <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
  }
}

export function SharedRecentActivityCard({
  dossierId,
  maxItems = 5,
}: SharedRecentActivityCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const { activities, isLoading, isError } = useDossierActivityTimeline({
    dossierId,
    pageSize: maxItems,
  })

  const recentActivities = activities.slice(0, maxItems)

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-10" />
          ))}
        </div>
      </div>
    )
  }

  // Error before empty (OVRERR-01): only when no cached activities — stale-while-error
  // retains last-good rows on a background refetch failure.
  if (isError && recentActivities.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <h3 className="text-base font-semibold leading-tight text-start mb-4">
          {t('overview.recentActivity', { defaultValue: 'Recent Activity' })}
        </h3>
        <p role="alert" className="text-sm text-[var(--danger)] text-center py-8">
          {t('overview.sectionError', {
            defaultValue: 'Failed to load this section. Check your connection and try again.',
          })}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className="text-base font-semibold leading-tight text-start mb-4">
        {t('overview.recentActivity', { defaultValue: 'Recent Activity' })}
      </h3>

      {recentActivities.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('overview.noRecentActivity', { defaultValue: 'No recent activity' })}
        </p>
      ) : (
        <div className="space-y-2">
          {recentActivities.map((activity) => (
            <div
              key={activity.link_id}
              className="flex items-start gap-2 rounded-md p-2 hover:bg-muted/50 transition-colors"
            >
              {getActivityIcon(activity.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {isRTL && activity.activity_title_ar
                    ? activity.activity_title_ar
                    : activity.activity_title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatActivityTime(activity.activity_timestamp, isRTL)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
