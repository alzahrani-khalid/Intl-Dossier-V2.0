/**
 * OperationsHub — Main dashboard page
 * Phase 10: Operations Hub Dashboard
 *
 * Orchestrates all 5 dashboard zones with role-adaptive ordering (D-09).
 * Wires data hooks (Wave 1) to zone components (Wave 2) with ActionBar
 * and ZoneCollapsible wrappers.
 *
 * Layout rules:
 * - Officer: Attention (full), Timeline + Engagements (2-col), Stats (full), Activity (full)
 * - Leadership/Analyst: all zones full-width in D-09 order
 * - Mobile: all zones stacked, each in ZoneCollapsible
 */

import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useResponsive } from '@/hooks/useResponsive'
import { useRolePreference } from '@/domains/operations-hub/hooks/useRolePreference'
import { useDashboardScope } from '@/domains/operations-hub/hooks/useDashboardScope'
import { useAttentionRealtime } from '@/domains/operations-hub/hooks/useAttentionRealtime'
import { useAttentionItems } from '@/domains/operations-hub/hooks/useAttentionItems'
import {
  useGroupedEvents,
  useUpcomingEvents,
} from '@/domains/operations-hub/hooks/useUpcomingEvents'
import { useEngagementStages } from '@/domains/operations-hub/hooks/useEngagementStages'
import { useDashboardStats } from '@/domains/operations-hub/hooks/useDashboardStats'
import { useActivityFeed } from '@/domains/operations-hub/hooks/useActivityFeed'
import { ZONE_ORDER } from '@/domains/operations-hub/types/operations-hub.types'
import type { DashboardRole } from '@/domains/operations-hub/types/operations-hub.types'
import { ActionBar } from './components/ActionBar'
import { ZoneCollapsible } from './components/ZoneCollapsible'
import { AttentionZone } from './components/AttentionZone'
import { TimelineZone } from './components/TimelineZone'
import { EngagementsZone } from './components/EngagementsZone'
import { QuickStatsBar } from './components/QuickStatsBar'
import { ActivityFeed } from './components/ActivityFeed'
import { AnalyticsWidget } from './components/AnalyticsWidget'

// ============================================================================
// Layout Helpers
// ============================================================================

/**
 * Returns the CSS grid column class for a zone based on role and position.
 * Officer view has 2-column pairing for Timeline + Engagements at positions 1-2.
 * Leadership and Analyst use full-width for all zones.
 */
function getZoneColSpan(role: DashboardRole, zoneKey: string, index: number): string {
  if (role === 'officer') {
    // Officer layout: pos 0 = full, pos 1 (timeline) + pos 2 (engagements) = half each, rest = full
    if (index === 0) return 'md:col-span-2'
    if (index === 1 && zoneKey === 'timeline') return 'md:col-span-1'
    if (index === 2 && zoneKey === 'engagements') return 'md:col-span-1'
    // stats at index 3, activity at index 4
    return 'md:col-span-2'
  }
  // Leadership and Analyst: all zones full-width
  return 'md:col-span-2'
}

// ============================================================================
// Zone Title Map
// ============================================================================

const ZONE_TITLE_KEY: Record<string, string> = {
  attention: 'zones.attention.title',
  timeline: 'zones.timeline.title',
  engagements: 'zones.engagements.title',
  stats: 'zones.stats.title',
  activity: 'zones.activity.title',
}

// ============================================================================
// Component
// ============================================================================

export function OperationsHub(): ReactElement {
  const { t, i18n } = useTranslation('operations-hub')
  const isRTL = i18n.language === 'ar'
  const { isMobile } = useResponsive()
  const { role, setRole } = useRolePreference()
  const { userId } = useDashboardScope()

  // Realtime subscription for Attention zone — invalidates query on task/lifecycle changes
  useAttentionRealtime(userId ?? undefined)

  // Zone data hooks — each fetches independently (progressive loading)
  const attention = useAttentionItems(userId ?? undefined)
  const events = useGroupedEvents(userId ?? undefined)
  const eventsQuery = useUpcomingEvents(userId ?? undefined)
  const stages = useEngagementStages(userId ?? undefined)
  const stats = useDashboardStats(userId ?? undefined)
  const activity = useActivityFeed()

  // Role-based zone ordering per D-09
  const orderedZones = ZONE_ORDER[role]

  /**
   * Renders a zone component by key, passing the appropriate data.
   */
  function renderZone(zoneKey: string): ReactElement {
    switch (zoneKey) {
      case 'attention':
        return (
          <AttentionZone
            items={attention.data ?? []}
            isLoading={attention.isLoading}
            isError={attention.isError}
            onRetry={(): void => {
              void attention.refetch()
            }}
          />
        )
      case 'timeline':
        return (
          <TimelineZone
            events={events.data ?? { today: [], tomorrow: [], this_week: [], next_week: [] }}
            isLoading={events.isLoading}
            isError={events.isError}
            onRetry={(): void => {
              void eventsQuery.refetch()
            }}
          />
        )
      case 'engagements':
        return (
          <EngagementsZone
            stages={stages.data ?? []}
            isLoading={stages.isLoading}
            isError={stages.isError}
            onRetry={(): void => {
              void stages.refetch()
            }}
          />
        )
      case 'stats':
        return (
          <QuickStatsBar
            stats={
              stats.data ?? {
                active_engagements: 0,
                open_tasks: 0,
                sla_at_risk: 0,
                upcoming_week: 0,
              }
            }
            isLoading={stats.isLoading}
          />
        )
      case 'activity':
        return (
          <ActivityFeed
            items={activity.data ?? []}
            isLoading={activity.isLoading}
            isError={activity.isError}
            onRetry={(): void => {
              void activity.refetch()
            }}
          />
        )
      default:
        return <div />
    }
  }

  /**
   * Returns the badge count for a zone (used by ZoneCollapsible on mobile).
   */
  function getZoneBadgeCount(zoneKey: string): number | undefined {
    switch (zoneKey) {
      case 'attention':
        return attention.data?.length
      case 'engagements': {
        if (stages.data == null) return undefined
        return stages.data.reduce((sum, s) => sum + s.stage_count, 0)
      }
      case 'activity':
        return activity.data?.length
      default:
        return undefined
    }
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} role="main" className="min-h-screen">
      <div>
        <ActionBar role={role} onRoleChange={setRole} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        {/* Analytics KPI overview -- always first zone (Phase 13) */}
        <div className="col-span-1 md:col-span-2">
          <ZoneCollapsible title={t('zones.overview')} defaultExpanded={true}>
            <AnalyticsWidget />
          </ZoneCollapsible>
        </div>

        {orderedZones.map((zoneKey, index) => {
          const colSpan = isMobile ? '' : getZoneColSpan(role, zoneKey, index)

          return (
            <div
              key={zoneKey}
              className={`col-span-1 ${colSpan}`}
              data-testid={`ops-zone-${zoneKey}`}
            >
              <ZoneCollapsible
                title={t(ZONE_TITLE_KEY[zoneKey] ?? zoneKey)}
                defaultExpanded={index === 0}
                badgeCount={getZoneBadgeCount(zoneKey)}
              >
                {renderZone(zoneKey)}
              </ZoneCollapsible>
            </div>
          )
        })}
      </div>
    </div>
  )
}
