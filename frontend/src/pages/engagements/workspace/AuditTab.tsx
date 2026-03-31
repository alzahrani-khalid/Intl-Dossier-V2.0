/**
 * AuditTab — Lifecycle transition timeline + activity log
 *
 * Shows engagement lifecycle history via LifecycleTimeline component
 * and a simplified activity log of all transitions.
 *
 * Data source: useLifecycleHistory hook (lifecycle_transitions table).
 * Per RESEARCH Open Question 2: lifecycle transitions serve as the
 * sole audit data source for MVP (no dedicated activity stream yet).
 */

import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from '@tanstack/react-router'
import { ClipboardList, Clock } from 'lucide-react'
import { useLifecycleHistory } from '@/domains/engagements/hooks/useLifecycle'
import { LifecycleTimeline } from '@/components/engagements/LifecycleTimeline'
import { useDirection } from '@/hooks/useDirection'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LifecycleStage } from '@/types/lifecycle.types'

export default function AuditTab(): ReactElement {
  const { t } = useTranslation('workspace')
  const { t: tLifecycle } = useTranslation('lifecycle')
  const { isRTL } = useDirection()
  const { engagementId } = useParams({
    from: '/_protected/engagements/$engagementId',
  })

  const { data: transitions, isLoading } = useLifecycleHistory(engagementId)

  const hasTransitions = Array.isArray(transitions) && transitions.length > 0

  // Empty state
  if (!isLoading && !hasTransitions) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="size-12 text-base-300 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-foreground">{t('empty.audit.heading')}</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">{t('empty.audit.body')}</p>
        </div>
      </div>
    )
  }

  // Sort transitions for activity log (most recent first)
  const sortedForLog = hasTransitions
    ? [...transitions].sort(
        (a, b) => new Date(b.transitioned_at).getTime() - new Date(a.transitioned_at).getTime(),
      )
    : []

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Section 1: Lifecycle Transitions Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-start">
            {tLifecycle('timeline.heading', 'Lifecycle Transitions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LifecycleTimeline transitions={transitions ?? []} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* Section 2: Activity Log (simplified view of transitions) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-start">
            <span className="flex items-center gap-2">
              <Clock className="size-5" aria-hidden="true" />
              {t('tabs.audit', 'Activity Log')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 bg-base-100 rounded animate-pulse" />
              ))}
            </div>
          )}
          {!isLoading && sortedForLog.length > 0 && (
            <div className="space-y-3">
              {sortedForLog.map((transition) => {
                const isInitial = transition.from_stage === null
                const fromLabel = isInitial
                  ? null
                  : tLifecycle(`stages.${transition.from_stage as LifecycleStage}`)
                const toLabel = tLifecycle(`stages.${transition.to_stage as LifecycleStage}`)
                const date = new Date(transition.transitioned_at)
                const timeStr = date.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })

                return (
                  <div
                    key={transition.id}
                    className="flex flex-col gap-0.5 border-b border-base-100 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-xs text-muted-foreground">{timeStr}</span>
                      {transition.user_name != null && transition.user_name !== '' && (
                        <span className="text-sm font-medium text-foreground">
                          {transition.user_name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-base-500 text-start">
                      {isInitial
                        ? tLifecycle('timeline.initial', `Created at ${toLabel}`)
                        : `${fromLabel} \u2192 ${toLabel}`}
                    </p>
                    {transition.note != null && transition.note.trim() !== '' && (
                      <p className="text-xs text-base-400 italic text-start">{transition.note}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
