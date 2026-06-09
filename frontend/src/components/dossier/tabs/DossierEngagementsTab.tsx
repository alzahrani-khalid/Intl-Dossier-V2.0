/**
 * DossierEngagementsTab
 *
 * Type-agnostic tab listing the engagements related to a dossier: related
 * engagement dossiers plus past calendar events, combined and sorted newest-first
 * (uncapped — mirrors EngagementHistoryCard's mapping without the recent-entries
 * cap). Dossier rows link to their engagement detail page; event rows render as a
 * plain title row. Fetched under a dedicated per-tab query key. Reusable across
 * every dossier type — takes only { dossierId }.
 */

import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { History } from 'lucide-react'
import { fetchDossierOverview } from '@/services/dossier-overview.service'
import { STALE_TIME } from '@/lib/query-tiers'
import { formatDayFirst } from '@/lib/format-date'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

interface DossierEngagementsTabProps {
  dossierId: string
}

interface EngagementEntry {
  id: string
  kind: 'dossier' | 'event'
  name: string
  date: string
  badge: string
}

export function DossierEngagementsTab({ dossierId }: DossierEngagementsTabProps): ReactElement {
  const { t, i18n } = useTranslation('dossier-shell')
  const isRTL = i18n.language === 'ar'

  const { data, isLoading } = useQuery({
    queryKey: ['dossier-tab', 'engagements', dossierId],
    queryFn: () =>
      fetchDossierOverview({
        dossier_id: dossierId,
        include_sections: ['related_dossiers', 'calendar_events'],
      }),
    staleTime: STALE_TIME.NORMAL,
  })

  if (isLoading) {
    return <TabSkeleton type="list" />
  }

  const engagementDossiers = data?.related_dossiers?.by_dossier_type?.engagement ?? []
  const pastEvents = data?.calendar_events?.past ?? []

  // Combine related engagement dossiers + past calendar events, newest-first.
  const entries: EngagementEntry[] = [
    ...engagementDossiers.map((d) => ({
      id: d.id,
      kind: 'dossier' as const,
      name: isRTL ? (d.name_ar ?? d.name_en) : d.name_en,
      date: d.created_at,
      badge: d.relationship_type as string,
    })),
    ...pastEvents.map((e) => ({
      id: `event-${e.id}`,
      kind: 'event' as const,
      name: isRTL ? (e.title_ar ?? e.title_en) : e.title_en,
      date: e.start_datetime,
      badge: e.event_type as string,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-4">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold leading-tight text-start">
          {t('tabs.engagements', { defaultValue: 'Engagements' })}
        </h3>
      </div>

      {entries.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('empty.engagements.title')}
        </p>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute top-0 bottom-0 start-2 border-s-2 border-border" />

          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 relative ps-6">
                {/* Dot marker */}
                <div className="absolute start-0.5 top-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                <div className="flex-1 min-w-0">
                  {entry.kind === 'dossier' ? (
                    <Link
                      to={getDossierDetailPath(entry.id, 'engagement')}
                      className="text-sm truncate block text-start hover:underline"
                    >
                      {entry.name}
                    </Link>
                  ) : (
                    <p className="text-sm truncate text-start">{entry.name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatDayFirst(entry.date, i18n.language)}
                    </span>
                    {entry.badge !== '' && (
                      <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                        {entry.badge}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
