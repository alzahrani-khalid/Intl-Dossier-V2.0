/**
 * LifecycleTimeline
 * Audit trail timeline for engagement lifecycle transitions.
 *
 * Features:
 * - Reverse chronological display of stage transitions
 * - Duration badges showing time spent in each stage
 * - Optional notes displayed with transitions
 * - Collapsible container (collapsed on mobile, expanded on md+)
 * - Loading and empty states
 * - RTL-safe with logical CSS properties
 * - All text from lifecycle i18n namespace
 */

import { type ReactElement, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { LifecycleStage, LifecycleTransition } from '@/types/lifecycle.types'

// ============================================================================
// Props
// ============================================================================

export interface LifecycleTimelineProps {
  transitions: LifecycleTransition[]
  isLoading?: boolean
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Formats a duration in seconds to a human-readable string.
 * < 60s: "<1m"
 * < 3600s: "{m}m"
 * < 86400s: "{h}h {m}m"
 * >= 86400s: "{d}d {h}h"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return '<1m'
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    return `${String(m)}m`
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${String(h)}h ${String(m)}m`
  }
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  return `${String(d)}d ${String(h)}h`
}

function formatTransitionDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Detect if screen is md+ (768px) for default open state.
 * Uses window.matchMedia for SSR safety.
 */
function getDefaultOpen(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(min-width: 768px)').matches
}

// ============================================================================
// Component
// ============================================================================

export function LifecycleTimeline({
  transitions,
  isLoading = false,
}: LifecycleTimelineProps): ReactElement {
  const { t } = useTranslation('lifecycle')
  const [open, setOpen] = useState<boolean>(getDefaultOpen)

  // Sort transitions by transitioned_at descending (most recent first)
  const sortedTransitions = useMemo(
    (): LifecycleTransition[] =>
      [...transitions].sort(
        (a, b) =>
          new Date(b.transitioned_at).getTime() - new Date(a.transitioned_at).getTime(),
      ),
    [transitions],
  )

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* Header / Trigger */}
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-11">
        <span>{t('timeline.heading')}</span>
        {open ? (
          <ChevronUp className="size-4 text-base-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="size-4 text-base-400" aria-hidden="true" />
        )}
      </CollapsibleTrigger>

      {/* Content */}
      <CollapsibleContent>
        <div className="ps-3 pe-3 pb-3 pt-1">
          {/* Loading state */}
          {isLoading && (
            <div className="space-y-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-base-200 animate-pulse mt-1.5" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3.5 w-32 bg-base-200 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-base-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && sortedTransitions.length === 0 && (
            <p className="text-sm text-base-400 text-start">
              {t('timeline.empty')}
            </p>
          )}

          {/* Timeline entries */}
          {!isLoading && sortedTransitions.length > 0 && (
            <div className="relative">
              {sortedTransitions.map((transition, index) => {
                const isFirst = index === 0
                const isLast = index === sortedTransitions.length - 1
                const isInitial = transition.from_stage === null
                const hasNote =
                  transition.note !== null &&
                  transition.note !== undefined &&
                  transition.note.trim() !== ''
                const hasDuration =
                  transition.duration_in_stage_seconds !== null &&
                  transition.duration_in_stage_seconds !== undefined &&
                  transition.from_stage !== null

                return (
                  <div key={transition.id} className="flex items-start gap-3 relative">
                    {/* Dot and vertical line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                          isFirst ? 'bg-primary-500' : 'bg-base-300',
                        )}
                        aria-hidden="true"
                      />
                      {/* Vertical connector line (not on last entry) */}
                      {!isLast && (
                        <div
                          className="w-px flex-1 min-h-4 bg-base-200"
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    {/* Entry content */}
                    <div className={cn('flex-1 pb-3', isLast && 'pb-0')}>
                      {/* Header row: stage label, user, date */}
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-semibold text-foreground">
                          {t(`stages.${transition.to_stage as LifecycleStage}`)}
                        </span>
                        {transition.user_name != null && transition.user_name !== '' && (
                          <span className="text-xs text-base-500">
                            {transition.user_name}
                          </span>
                        )}
                        <span className="text-xs text-base-400">
                          {formatTransitionDate(transition.transitioned_at)}
                        </span>
                      </div>

                      {/* Note (if non-null/non-empty) */}
                      {hasNote && (
                        <p className="text-xs text-base-500 italic mt-0.5 text-start">
                          {transition.note}
                        </p>
                      )}

                      {/* Initial stage marker */}
                      {isInitial && !hasNote && (
                        <p className="text-xs text-base-400 italic mt-0.5 text-start">
                          {t('timeline.initial')}
                        </p>
                      )}

                      {/* Duration badge */}
                      {hasDuration && (
                        <span className="inline-block text-xs bg-base-100 rounded-full px-2 py-0.5 mt-1 text-base-500">
                          {t('timeline.duration', {
                            duration: formatDuration(
                              transition.duration_in_stage_seconds as number,
                            ),
                            stage: t(
                              `stages.${transition.from_stage as LifecycleStage}`,
                            ),
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
