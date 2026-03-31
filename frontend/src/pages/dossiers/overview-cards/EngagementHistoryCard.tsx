/**
 * EngagementHistoryCard
 *
 * Person-specific card showing chronological timeline of engagements.
 * Vertical line with dot markers (border-s-2 per UI-SPEC).
 * Max 5 recent, "View all" link.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { History } from 'lucide-react'

interface EngagementHistoryCardProps {
  dossierId: string
}

const MAX_ENTRIES = 5

export function EngagementHistoryCard({
  dossierId,
}: EngagementHistoryCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  const { data, isLoading } = useDossierOverview(dossierId, {
    includeSections: ['related_dossiers', 'calendar_events'],
  })

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-10" />
          ))}
        </div>
      </div>
    )
  }

  // Use related engagements from dossier relationships
  const engagementDossiers = data?.related_dossiers?.by_dossier_type?.engagement ?? []
  const pastEvents = data?.calendar_events?.past ?? []

  // Combine and sort by date descending
  const timelineEntries = [
    ...engagementDossiers.map((d) => ({
      id: d.id,
      name: isRTL ? (d.name_ar ?? d.name_en) : d.name_en,
      date: d.created_at,
      stage: d.relationship_type as string,
    })),
    ...pastEvents.map((e) => ({
      id: `event-${e.id}`,
      name: isRTL ? (e.title_ar ?? e.title_en) : e.title_en,
      date: e.start_datetime,
      stage: e.event_type as string,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, MAX_ENTRIES)

  const hasMore =
    engagementDossiers.length + pastEvents.length > MAX_ENTRIES

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-4">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold leading-tight text-start">
          {t('overview.engagementHistory.title', { defaultValue: 'Engagement History' })}
        </h3>
      </div>

      {timelineEntries.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('overview.engagementHistory.empty', { defaultValue: 'No engagement history' })}
        </p>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute top-0 bottom-0 start-2 border-s-2 border-border" />

          <div className="space-y-3">
            {timelineEntries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 relative ps-6">
                {/* Dot marker */}
                <div className="absolute start-0.5 top-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{entry.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {entry.date !== ''
                        ? format(new Date(entry.date), 'PP', { locale: dateLocale })
                        : '-'}
                    </span>
                    {entry.stage != null && entry.stage !== '' && (
                      <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                        {entry.stage}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <p className="text-xs text-primary cursor-pointer hover:underline pt-3 ps-6">
              {t('overview.engagementHistory.viewAll', {
                defaultValue: 'View all engagements',
              })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
