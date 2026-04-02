/**
 * useAnalyticsForDossier -- Per-dossier analytics hook
 * Phase 13: Feature Absorption -- Analytics into Dossier Overview
 *
 * Fetches dossier overview data and extracts type-specific analytics metrics.
 * Uses existing useDossierOverview to avoid new API endpoints.
 */

import { useDossierOverview } from '@/hooks/useDossierOverview'

// ============================================================================
// Types
// ============================================================================

export interface DossierMetric {
  label: string
  value: number | string
  i18nKey: string
}

export interface DossierAnalyticsResult {
  metrics: DossierMetric[]
  isLoading: boolean
  isError: boolean
}

type DossierType =
  | 'country'
  | 'organization'
  | 'forum'
  | 'topic'
  | 'working_group'
  | 'person'
  | 'elected_official'

// ============================================================================
// Metric Extractors
// ============================================================================

interface OverviewStats {
  related_dossiers_count?: number
  pending_work_items?: number
  upcoming_events_count?: number
  recent_activities_count?: number
}

function extractMetrics(
  dossierType: DossierType,
  stats: OverviewStats | undefined,
): DossierMetric[] {
  const s = stats ?? {}

  switch (dossierType) {
    case 'country':
      return [
        { label: 'Engagements', value: s.upcoming_events_count ?? 0, i18nKey: 'analytics.engagementCount' },
        { label: 'Active Topics', value: s.related_dossiers_count ?? 0, i18nKey: 'analytics.activeTopics' },
      ]
    case 'organization':
      return [
        { label: 'Member Countries', value: s.related_dossiers_count ?? 0, i18nKey: 'analytics.memberCountries' },
        { label: 'Open Work Items', value: s.pending_work_items ?? 0, i18nKey: 'analytics.openWorkItems' },
      ]
    case 'forum':
      return [
        { label: 'Sessions', value: s.upcoming_events_count ?? 0, i18nKey: 'analytics.sessionCount' },
        { label: 'Linked Dossiers', value: s.related_dossiers_count ?? 0, i18nKey: 'analytics.linkedDossiers' },
      ]
    case 'topic':
      return [
        { label: 'Connected Anchors', value: s.related_dossiers_count ?? 0, i18nKey: 'analytics.connectedAnchors' },
        { label: 'Open Work Items', value: s.pending_work_items ?? 0, i18nKey: 'analytics.openWorkItems' },
      ]
    case 'working_group':
      return [
        { label: 'Members', value: s.related_dossiers_count ?? 0, i18nKey: 'analytics.memberCount' },
        { label: 'Deliverables', value: s.pending_work_items ?? 0, i18nKey: 'analytics.deliverableCount' },
      ]
    case 'person':
      return [
        { label: 'Interactions', value: s.recent_activities_count ?? 0, i18nKey: 'analytics.interactionCount' },
        { label: 'Affiliations', value: s.related_dossiers_count ?? 0, i18nKey: 'analytics.affiliationCount' },
      ]
    case 'elected_official':
      return [
        { label: 'Committees', value: s.related_dossiers_count ?? 0, i18nKey: 'analytics.committeeCount' },
        { label: 'Recent Activity', value: s.recent_activities_count ?? 0, i18nKey: 'analytics.recentActivity' },
      ]
    default:
      return []
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useAnalyticsForDossier(
  dossierId: string,
  dossierType: DossierType,
): DossierAnalyticsResult {
  const { data, isLoading, isError } = useDossierOverview(dossierId, {
    includeSections: ['related_dossiers', 'work_items', 'calendar_events', 'activity_timeline'],
  })

  const metrics = extractMetrics(dossierType, data?.stats)

  return { metrics, isLoading, isError }
}
