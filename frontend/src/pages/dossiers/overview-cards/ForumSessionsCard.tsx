/**
 * ForumSessionsCard
 *
 * Forum-specific card showing recent/upcoming forum sessions
 * from Phase 9 lifecycle engine. Compact list, max 5 sessions.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { Layers } from 'lucide-react'

interface ForumSessionsCardProps {
  dossierId: string
}

const MAX_SESSIONS = 5

export function ForumSessionsCard({ dossierId }: ForumSessionsCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  const { data, isLoading } = useDossierOverview(dossierId, {
    includeSections: ['related_dossiers', 'calendar_events'],
  })

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

  // Sessions are child engagements of the forum
  const engagementDossiers = data?.related_dossiers?.by_dossier_type?.engagement ?? []
  const childRelations = data?.related_dossiers?.by_relationship_type?.child ?? []
  const sessionDossiers = engagementDossiers.length > 0
    ? engagementDossiers.slice(0, MAX_SESSIONS)
    : childRelations.slice(0, MAX_SESSIONS)

  // Fall back to calendar events if no session relations
  const calendarSessions = sessionDossiers.length === 0
    ? (data?.calendar_events?.upcoming ?? []).slice(0, MAX_SESSIONS)
    : []

  const hasItems = sessionDossiers.length > 0 || calendarSessions.length > 0

  function getStageBadgeClass(stage?: string): string {
    switch (stage) {
      case 'active':
      case 'in_progress':
        return 'bg-success/10 text-success'
      case 'planning':
      case 'upcoming':
        return 'bg-primary/10 text-primary'
      case 'completed':
      case 'concluded':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold leading-tight text-start">
          {t('overview.sessions.title', { defaultValue: 'Sessions' })}
        </h3>
      </div>

      {!hasItems ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('overview.sessions.empty', { defaultValue: 'No sessions recorded' })}
        </p>
      ) : (
        <div className="space-y-2">
          {sessionDossiers.map((session) => (
            <div
              key={session.id}
              className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {isRTL
                    ? (session.name_ar ?? session.name_en)
                    : session.name_en}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(session.created_at), 'PP', { locale: dateLocale })}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${getStageBadgeClass(session.status)}`}
              >
                {session.status}
              </span>
            </div>
          ))}
          {calendarSessions.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {isRTL ? (event.title_ar ?? event.title_en) : event.title_en}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(event.start_datetime), 'PP', { locale: dateLocale })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
