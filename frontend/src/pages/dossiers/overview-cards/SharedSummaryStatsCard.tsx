/**
 * SharedSummaryStatsCard
 *
 * Displays key metrics for any dossier type in a compact stat grid.
 * Used in all overview tabs (Country, Organization, Topic, etc.).
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  FileText,
  CalendarDays,
  Activity,
} from 'lucide-react'

interface SharedSummaryStatsCardProps {
  dossierId: string
}

interface StatItem {
  label: string
  value: number
  icon: React.ReactNode
}

export function SharedSummaryStatsCard({ dossierId }: SharedSummaryStatsCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const { data, isLoading } = useDossierOverview(dossierId, {
    includeSections: ['related_dossiers', 'work_items', 'calendar_events', 'activity_timeline'],
  })

  const stats: StatItem[] = [
    {
      label: t('overview.stats.linkedDossiers', { defaultValue: 'Linked Dossiers' }),
      value: data?.stats.related_dossiers_count ?? 0,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: t('overview.stats.openWorkItems', { defaultValue: 'Open Work Items' }),
      value: data?.stats.pending_work_items ?? 0,
      icon: <FileText className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: t('overview.stats.upcomingEvents', { defaultValue: 'Upcoming Events' }),
      value: data?.stats.upcoming_events_count ?? 0,
      icon: <CalendarDays className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: t('overview.stats.recentActivity', { defaultValue: 'Recent Activity' }),
      value: data?.stats.recent_activities_count ?? 0,
      icon: <Activity className="h-4 w-4 text-muted-foreground" />,
    },
  ]

  const allZero = stats.every((s) => s.value === 0)

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-24 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-16" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className="text-base font-semibold leading-tight text-start mb-4">
        {t('overview.summary', { defaultValue: 'Summary' })}
      </h3>

      {!data || allZero ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('overview.noData', { defaultValue: 'No data available' })}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 rounded-md bg-muted/50 p-3"
            >
              <div className="flex items-center gap-2">
                {stat.icon}
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <span className="text-base font-semibold">{stat.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
