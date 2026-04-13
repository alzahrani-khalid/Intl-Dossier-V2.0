/**
 * EngagementsByStageCard
 *
 * Country-specific card grouping engagements linked to this dossier
 * by lifecycle stage with color-coded chips.
 * Stage colors match Phase 9 lifecycle stage colors.
 * Mobile-first, RTL-compatible.
 */

import { useTranslation } from 'react-i18next'
import { useDossierOverview } from '@/hooks/useDossierOverview'
import { Skeleton } from '@/components/ui/skeleton'

interface EngagementsByStageCardProps {
  dossierId: string
}

/**
 * Lifecycle stage color mapping from Phase 9
 */
const STAGE_COLORS: Record<string, string> = {
  intake: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  preparation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  briefing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  execution: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  follow_up: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  closed: 'bg-muted text-foreground/30',
}

const STAGE_ORDER = ['intake', 'preparation', 'briefing', 'execution', 'follow_up', 'closed']

export function EngagementsByStageCard({
  dossierId,
}: EngagementsByStageCardProps): React.ReactElement {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const { data, isLoading } = useDossierOverview(dossierId, {
    includeSections: ['related_dossiers'],
  })

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-7 w-24" />
          ))}
        </div>
      </div>
    )
  }

  // Extract engagement-type related dossiers and group by metadata lifecycle_stage
  const engagements = data?.related_dossiers?.by_dossier_type?.engagement ?? []

  // Group engagements by lifecycle stage from metadata
  const stageGroups: Record<string, number> = {}
  for (const eng of engagements) {
    const stage = (eng as Record<string, unknown>).notes_en?.toString()?.toLowerCase() ?? 'intake'
    const normalizedStage = STAGE_ORDER.includes(stage) ? stage : 'intake'
    stageGroups[normalizedStage] = (stageGroups[normalizedStage] ?? 0) + 1
  }

  // If no engagements found, count total from overview stats
  const totalEngagements = engagements.length

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className="text-base font-semibold leading-tight text-start mb-4">
        {t('overview.engagements.title', { defaultValue: 'Engagements by Stage' })}
      </h3>

      {totalEngagements === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t('overview.engagements.empty', { defaultValue: 'No engagements linked' })}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {STAGE_ORDER.map((stage) => {
              const count = stageGroups[stage]
              if (!count) return null

              const colorClass = STAGE_COLORS[stage] ?? STAGE_COLORS.closed

              return (
                <span
                  key={stage}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${colorClass}`}
                >
                  {t(`overview.engagements.stage.${stage}`, { defaultValue: stage })}
                  <span className="font-semibold">{count}</span>
                </span>
              )
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            {t('overview.engagements.total', {
              count: totalEngagements,
              defaultValue: '{{count}} total engagements',
            })}
          </p>
        </div>
      )}
    </div>
  )
}
