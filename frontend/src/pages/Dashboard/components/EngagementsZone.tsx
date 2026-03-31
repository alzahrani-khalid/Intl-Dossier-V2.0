/**
 * EngagementsZone — Lifecycle stage groups with collapsible sections
 * Phase 10: Operations Hub Dashboard
 *
 * Shows engagement counts per lifecycle stage in order:
 * intake -> preparation -> briefing -> execution -> follow_up -> closed.
 * Skips stages with 0 count. Handles loading, error, and empty states.
 */

import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { EngagementStageGroup } from './EngagementStageGroup'
import { LIFECYCLE_STAGES } from '@/types/lifecycle.types'
import type { StageGroup } from '@/domains/operations-hub/types/operations-hub.types'

// ============================================================================
// Component
// ============================================================================

interface EngagementsZoneProps {
  stages: StageGroup[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

export function EngagementsZone({
  stages,
  isLoading,
  isError,
  onRetry,
}: EngagementsZoneProps): React.ReactElement {
  const { t } = useTranslation('operations-hub')

  // Loading state
  if (isLoading) {
    return (
      <div role="region" aria-label={t('zones.engagements.title')} className="space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div
        role="region"
        aria-label={t('zones.engagements.title')}
        className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
      >
        <p className="text-sm text-destructive mb-2">
          {t('error.load_failed', { zone: t('zones.engagements.title') })}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('error.retry')}
        </Button>
      </div>
    )
  }

  // Build a map for quick lookup
  const stageMap = new Map(stages.map((s) => [s.stage, s]))

  // Filter to non-empty stages in lifecycle order
  const orderedStages = LIFECYCLE_STAGES
    .map((stage) => stageMap.get(stage))
    .filter((sg): sg is StageGroup => sg != null && sg.stage_count > 0)

  // Empty state
  if (orderedStages.length === 0) {
    return (
      <div role="region" aria-label={t('zones.engagements.title')} className="py-4">
        <p className="text-sm text-muted-foreground mb-3">
          {t('zones.engagements.empty')}
        </p>
        <Button variant="outline" size="sm">
          {t('actions.new_engagement')}
        </Button>
      </div>
    )
  }

  return (
    <div role="region" aria-label={t('zones.engagements.title')} className="space-y-1">
      {orderedStages.map((stageGroup) => (
        <EngagementStageGroup
          key={stageGroup.stage}
          stage={stageGroup.stage}
          engagements={stageGroup.top_engagements}
          count={stageGroup.stage_count}
        />
      ))}
    </div>
  )
}
