/**
 * DossierEngagementsTab
 *
 * Type-agnostic tab listing the engagements related to a dossier: related
 * engagement dossiers plus past calendar events, combined and sorted newest-first
 * (uncapped — mirrors EngagementHistoryCard's mapping without the recent-entries
 * cap). Dossier rows link to their engagement detail page; event rows render as a
 * plain title row. Fetched under a dedicated per-tab query key.
 *
 * Per-type contract sections (Phase 67):
 * - organization → "Hosted engagements" (engagement_dossiers.host_organization_id)
 * - person / elected_official → "Participation" (engagement_participants)
 * Each per-type branch is its own query and honours the Phase 66 error contract
 * (throw, never swallow): success + 0 rows → section ABSENT; error + no cached data
 * → heading + role="alert" line, never impersonating absence. The generic branch
 * adopts the same contract on its empty-line slot (OVRERR-01 closed on this tab).
 */

import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { History } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fetchDossierOverview, DossierOverviewAPIError } from '@/services/dossier-overview.service'
import { STALE_TIME } from '@/lib/query-tiers'
import { formatDayFirst } from '@/lib/format-date'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

type DossierType = 'organization' | 'person' | 'elected_official'

interface DossierEngagementsTabProps {
  dossierId: string
  dossierType?: DossierType
}

interface EngagementEntry {
  id: string
  kind: 'dossier' | 'event'
  name: string
  date: string
  badge: string
}

interface PerTypeRow {
  id: string
  name: string
  date: string
  badge: string
}

interface ExtRow {
  id: string
  engagement_type: string | null
  start_date: string | null
}

interface NameRow {
  id: string
  name_en: string
  name_ar: string | null
  created_at: string
}

interface ParticipantRow {
  engagement_id: string
  role: string | null
}

function pickName(row: NameRow, isRTL: boolean): string {
  return isRTL ? (row.name_ar ?? row.name_en) : row.name_en
}

function mergePerTypeRows(
  ext: ExtRow[],
  names: NameRow[],
  isRTL: boolean,
  roleByEngagement?: Map<string, string>,
): PerTypeRow[] {
  const nameById = new Map(names.map((n) => [n.id, n]))
  return ext
    .map((e) => {
      const nameRow = nameById.get(e.id)
      const date = e.start_date ?? nameRow?.created_at ?? ''
      const badge = roleByEngagement?.get(e.id) ?? e.engagement_type ?? ''
      return {
        id: e.id,
        name: nameRow !== undefined ? pickName(nameRow, isRTL) : e.id,
        date,
        badge,
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

async function fetchHostedEngagements(dossierId: string, isRTL: boolean): Promise<PerTypeRow[]> {
  const { data: ext, error: extError } = await supabase
    .from('engagement_dossiers')
    .select('id, engagement_type, start_date')
    .eq('host_organization_id', dossierId)
  if (extError !== null) {
    throw new DossierOverviewAPIError(
      'Failed to fetch hosted engagements',
      500,
      'HOSTED_ENGAGEMENTS_FETCH_FAILED',
      extError.message,
    )
  }
  const extRows = (ext ?? []) as ExtRow[]
  if (extRows.length === 0) {
    return []
  }
  const ids = extRows.map((e) => e.id)
  const { data: names, error: namesError } = await supabase
    .from('dossiers')
    .select('id, name_en, name_ar, created_at')
    .in('id', ids)
  if (namesError !== null) {
    throw new DossierOverviewAPIError(
      'Failed to fetch hosted engagement names',
      500,
      'HOSTED_ENGAGEMENTS_FETCH_FAILED',
      namesError.message,
    )
  }
  return mergePerTypeRows(extRows, (names ?? []) as NameRow[], isRTL)
}

async function fetchParticipation(dossierId: string, isRTL: boolean): Promise<PerTypeRow[]> {
  const { data: participants, error: partError } = await supabase
    .from('engagement_participants')
    .select('engagement_id, role')
    .eq('participant_dossier_id', dossierId)
  if (partError !== null) {
    throw new DossierOverviewAPIError(
      'Failed to fetch participation',
      500,
      'PARTICIPATION_FETCH_FAILED',
      partError.message,
    )
  }
  const partRows = (participants ?? []) as ParticipantRow[]
  if (partRows.length === 0) {
    return []
  }
  const engagementIds = partRows.map((p) => p.engagement_id)
  const roleByEngagement = new Map(partRows.map((p) => [p.engagement_id, p.role ?? '']))

  const { data: ext, error: extError } = await supabase
    .from('engagement_dossiers')
    .select('id, engagement_type, start_date')
    .in('id', engagementIds)
  if (extError !== null) {
    throw new DossierOverviewAPIError(
      'Failed to fetch participation engagements',
      500,
      'PARTICIPATION_FETCH_FAILED',
      extError.message,
    )
  }

  const { data: names, error: namesError } = await supabase
    .from('dossiers')
    .select('id, name_en, name_ar, created_at')
    .in('id', engagementIds)
  if (namesError !== null) {
    throw new DossierOverviewAPIError(
      'Failed to fetch participation names',
      500,
      'PARTICIPATION_FETCH_FAILED',
      namesError.message,
    )
  }

  return mergePerTypeRows(
    (ext ?? []) as ExtRow[],
    (names ?? []) as NameRow[],
    isRTL,
    roleByEngagement,
  )
}

export function DossierEngagementsTab({
  dossierId,
  dossierType,
}: DossierEngagementsTabProps): ReactElement {
  const { t, i18n } = useTranslation('dossier-shell')
  const isRTL = i18n.language === 'ar'

  const {
    data,
    isLoading: genericLoading,
    isError: genericError,
  } = useQuery({
    queryKey: ['dossier-tab', 'engagements', dossierId],
    queryFn: () =>
      fetchDossierOverview({
        dossier_id: dossierId,
        include_sections: ['related_dossiers', 'calendar_events'],
      }),
    staleTime: STALE_TIME.NORMAL,
  })

  const isOrg = dossierType === 'organization'
  const isPersonLike = dossierType === 'person' || dossierType === 'elected_official'

  const hostedQuery = useQuery({
    queryKey: ['dossier-tab', 'engagements-hosted', dossierId],
    queryFn: () => fetchHostedEngagements(dossierId, isRTL),
    enabled: isOrg,
    staleTime: STALE_TIME.NORMAL,
  })

  const participationQuery = useQuery({
    queryKey: ['dossier-tab', 'engagements-participation', dossierId],
    queryFn: () => fetchParticipation(dossierId, isRTL),
    enabled: isPersonLike,
    staleTime: STALE_TIME.NORMAL,
  })

  const perTypeQuery = isOrg ? hostedQuery : isPersonLike ? participationQuery : undefined
  const perTypeHeadingKey = isOrg ? 'sections.hostedEngagements' : 'sections.participation'
  const perTypeBadgeNamespace = isOrg ? 'engagements:types.' : 'engagements:participantRoles.'

  // A disabled query reports isLoading: true, so only the enabled queries gate the skeleton.
  const anyLoading =
    genericLoading ||
    (isOrg && hostedQuery.isLoading) ||
    (isPersonLike && participationQuery.isLoading)

  if (anyLoading) {
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

  const perTypeRows = perTypeQuery?.data ?? []
  const perTypeErrored = perTypeQuery?.isError === true && (perTypeQuery.data ?? null) === null
  const perTypeRendered = perTypeRows.length > 0 || perTypeErrored

  const genericErrored = genericError && (data ?? null) === null
  const genericRendered = entries.length > 0 || genericErrored

  const sectionErrorLine = (
    <p role="alert" className="text-sm text-[var(--danger)] text-center py-8">
      {t('dossier:overview.sectionError', {
        defaultValue: 'Failed to load this section. Check your connection and try again.',
      })}
    </p>
  )

  const sectionHeadingClass = 'text-xs font-semibold text-muted-foreground uppercase tracking-wider'

  return (
    <div className="p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-4">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold leading-tight text-start">
          {t('tabs.engagements', { defaultValue: 'Engagements' })}
        </h3>
      </div>

      {/* Per-type contract section (org → Hosted engagements; person/EO → Participation). */}
      {perTypeRendered && (
        <div className="space-y-2 mb-4">
          <h3 className={sectionHeadingClass}>{t(perTypeHeadingKey)}</h3>
          {perTypeErrored ? (
            sectionErrorLine
          ) : (
            <div className="rounded-md border divide-y">
              {perTypeRows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 px-3 min-h-[var(--row-h)]"
                >
                  <Link
                    to={getDossierDetailPath(row.id, 'engagement')}
                    className="text-sm font-medium truncate min-w-0 text-start hover:underline"
                  >
                    {row.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    {row.date !== '' && (
                      <span className="text-xs text-muted-foreground">
                        {formatDayFirst(row.date, i18n.language)}
                      </span>
                    )}
                    {row.badge !== '' && (
                      <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                        {t(`${perTypeBadgeNamespace}${row.badge}`, { defaultValue: row.badge })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History sub-heading only when a per-type section AND the generic block both render. */}
      {perTypeRendered && genericRendered && (
        <h3 className={`${sectionHeadingClass} mb-2`}>{t('sections.history')}</h3>
      )}

      {genericErrored ? (
        sectionErrorLine
      ) : entries.length === 0 ? (
        // Tab-level empty copy only when nothing rendered above and nothing errored.
        !perTypeRendered ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            {t('empty.engagements.title')}
          </p>
        ) : null
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
                        {t(
                          `dossier-overview:${entry.kind === 'dossier' ? 'relationshipType' : 'eventType'}.${entry.badge}`,
                          { defaultValue: entry.badge },
                        )}
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
