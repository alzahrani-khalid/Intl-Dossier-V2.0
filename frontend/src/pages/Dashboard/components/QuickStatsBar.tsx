/**
 * QuickStatsBar — 4-card stats grid with navigation
 * Phase 10: Operations Hub Dashboard
 *
 * Renders 4 metric cards: Active Engagements, Open Tasks,
 * SLA At Risk, Upcoming This Week. Responsive 2-col to 4-col grid.
 */

import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Briefcase, CheckSquare, AlertTriangle, CalendarDays } from 'lucide-react'
import { QuickStatCard } from './QuickStatCard'
import type { DashboardStats } from '@/domains/operations-hub/types/operations-hub.types'

// ============================================================================
// Component
// ============================================================================

interface QuickStatsBarProps {
  stats: DashboardStats
  isLoading: boolean
}

export function QuickStatsBar({
  stats,
  isLoading,
}: QuickStatsBarProps): React.ReactElement {
  const { t } = useTranslation('operations-hub')
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <QuickStatCard
        label={t('zones.stats.active_engagements')}
        value={stats.active_engagements}
        icon={Briefcase}
        isLoading={isLoading}
        onClick={(): void => {
          void navigate({ to: '/engagements' })
        }}
      />
      <QuickStatCard
        label={t('zones.stats.open_tasks')}
        value={stats.open_tasks}
        icon={CheckSquare}
        isLoading={isLoading}
        onClick={(): void => {
          void navigate({ to: '/tasks' })
        }}
      />
      <QuickStatCard
        label={t('zones.stats.sla_at_risk')}
        value={stats.sla_at_risk}
        icon={AlertTriangle}
        alertBadge={true}
        isLoading={isLoading}
        onClick={(): void => {
          void navigate({ to: '/intake' })
        }}
      />
      <QuickStatCard
        label={t('zones.stats.upcoming_week')}
        value={stats.upcoming_week}
        icon={CalendarDays}
        isLoading={isLoading}
        onClick={(): void => {
          void navigate({ to: '/calendar' })
        }}
      />
    </div>
  )
}
