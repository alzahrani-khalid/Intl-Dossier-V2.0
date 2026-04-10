/**
 * LifecycleStepperBar
 * CRM pipeline-style horizontal stepper for engagement lifecycle stages.
 *
 * Features:
 * - 6 stages with completed/current/upcoming visual states
 * - Popover summaries on completed stages (who transitioned, when, note, time in stage)
 * - Click upcoming stages to transition (adjacent = immediate, non-adjacent = note prompt)
 * - "Revert to this stage" button inside completed stage popovers
 * - "Next" suggestion chip below current stage
 * - LtrIsolate wrapper for consistent LTR rendering in both LTR/RTL
 * - Mobile horizontal scroll with snap, desktop flex fill
 * - Full keyboard and screen reader accessibility
 */

import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import type { LifecycleStage, LifecycleTransition } from '@/types/lifecycle.types'
import { LIFECYCLE_STAGES } from '@/types/lifecycle.types'
import { useLifecycleHistory, useLifecycleTransition } from '@/domains/engagements/hooks/useLifecycle'

// ============================================================================
// Props
// ============================================================================

export interface LifecycleStepperBarProps {
  engagementId: string
  currentStage: LifecycleStage
  onTransition?: (stage: LifecycleStage) => void
  compact?: boolean
  disabled?: boolean
}

// ============================================================================
// Stage button variants via cva
// ============================================================================

const stageButtonVariants = cva(
  'relative flex flex-1 min-w-[72px] min-h-11 min-w-11 items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
  {
    variants: {
      state: {
        completed:
          'bg-primary/15 border border-primary-300 text-primary-700 cursor-pointer hover:bg-primary/25',
        current: 'bg-primary/15 border-2 border-primary text-primary-600 cursor-default',
        upcoming:
          'bg-base-100 border border-base-200 text-base-400 cursor-pointer hover:bg-base-200/50',
      },
      disabled: {
        true: 'opacity-50 pointer-events-none cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: {
      state: 'upcoming',
      disabled: false,
    },
  },
)

const connectorVariants = cva('h-0.5 flex-shrink-0 w-4 sm:w-6 self-center rounded-full', {
  variants: {
    state: {
      completed: 'bg-primary-300',
      upcoming: 'bg-base-200',
    },
  },
  defaultVariants: {
    state: 'upcoming',
  },
})

// ============================================================================
// Helpers
// ============================================================================

function formatEntryDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return hours > 0 ? `${String(days)}d ${String(hours)}h` : `${String(days)}d`
  }
  if (hours > 0) {
    return minutes > 0 ? `${String(hours)}h ${String(minutes)}m` : `${String(hours)}h`
  }
  return `${String(minutes)}m`
}

function getStageState(
  stageIndex: number,
  currentIndex: number,
): 'completed' | 'current' | 'upcoming' {
  if (stageIndex < currentIndex) return 'completed'
  if (stageIndex === currentIndex) return 'current'
  return 'upcoming'
}

// ============================================================================
// Component
// ============================================================================

export function LifecycleStepperBar({
  engagementId,
  currentStage,
  onTransition,
  compact = false,
  disabled = false,
}: LifecycleStepperBarProps): ReactElement {
  const { t } = useTranslation('lifecycle')
  const [pendingStage, setPendingStage] = useState<LifecycleStage | null>(null)
  const [noteValue, setNoteValue] = useState('')
  const [isRevert, setIsRevert] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentIndex = LIFECYCLE_STAGES.indexOf(currentStage)

  // Fetch lifecycle history for popover data
  const { data: historyData } = useLifecycleHistory(engagementId)

  // Transition mutation
  const transitionMutation = useLifecycleTransition(engagementId)

  // Build lookup map: stage -> most recent transition TO that stage
  const transitionMap = useMemo((): Map<LifecycleStage, LifecycleTransition> => {
    const map = new Map<LifecycleStage, LifecycleTransition>()
    if (historyData == null) return map
    for (const tr of historyData) {
      const existing = map.get(tr.to_stage)
      if (
        existing == null ||
        new Date(tr.transitioned_at) > new Date(existing.transitioned_at)
      ) {
        map.set(tr.to_stage, tr)
      }
    }
    return map
  }, [historyData])

  // Auto-focus textarea when note prompt opens
  useEffect(() => {
    if (pendingStage !== null && textareaRef.current !== null) {
      textareaRef.current.focus()
    }
  }, [pendingStage])

  // Escape key cancels note prompt
  const handleNoteKeyDown = useCallback((e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') {
      setPendingStage(null)
      setNoteValue('')
      setIsRevert(false)
    }
  }, [])

  const handleStageClick = useCallback(
    (stage: LifecycleStage, stageIndex: number): void => {
      if (disabled) return
      if (stageIndex === currentIndex) return
      // Completed stages use popover — click is handled by popover trigger
      if (stageIndex < currentIndex) return

      const diff = Math.abs(stageIndex - currentIndex)
      if (diff === 1) {
        // Adjacent transition -- immediate
        transitionMutation.mutate(
          { to_stage: stage },
          {
            onSuccess: () => {
              onTransition?.(stage)
            },
          },
        )
      } else {
        // Non-adjacent -- show note prompt
        setPendingStage(stage)
        setNoteValue('')
        setIsRevert(false)
      }
    },
    [currentIndex, disabled, onTransition, transitionMutation],
  )

  const handleRevertClick = useCallback(
    (stage: LifecycleStage): void => {
      if (disabled) return
      setPendingStage(stage)
      setNoteValue('')
      setIsRevert(true)
    },
    [disabled],
  )

  const handleConfirmTransition = useCallback((): void => {
    if (pendingStage === null) return
    transitionMutation.mutate(
      {
        to_stage: pendingStage,
        note: noteValue.trim() !== '' ? noteValue.trim() : undefined,
      },
      {
        onSuccess: () => {
          onTransition?.(pendingStage)
          setPendingStage(null)
          setNoteValue('')
          setIsRevert(false)
        },
      },
    )
  }, [pendingStage, noteValue, onTransition, transitionMutation])

  const handleCancelTransition = useCallback((): void => {
    setPendingStage(null)
    setNoteValue('')
    setIsRevert(false)
  }, [])

  // Next stage for suggestion chip
  const nextStage: LifecycleStage | null =
    currentIndex < LIFECYCLE_STAGES.length - 1
      ? LIFECYCLE_STAGES[currentIndex + 1] ?? null
      : null

  return (
    <div className="w-full space-y-2">
      {/* Stepper bar wrapped in LtrIsolate for consistent LTR rendering */}
      <LtrIsolate className="w-full overflow-x-auto scrollbar-hide pb-2 sm:overflow-x-visible sm:pb-0">
        <div
          role="group"
          aria-label={t('stepper.ariaLabel')}
          className="flex min-w-[480px] snap-x snap-mandatory items-center gap-1 sm:min-w-0"
        >
          {LIFECYCLE_STAGES.map((stage, index) => {
            const state = getStageState(index, currentIndex)
            const isCompleted = state === 'completed'
            const isCurrent = state === 'current'
            const transition = transitionMap.get(stage)

            const stageButton = (
              <button
                key={stage}
                type="button"
                className={cn(
                  stageButtonVariants({ state, disabled }),
                  'snap-center',
                )}
                aria-current={isCurrent ? 'step' : undefined}
                disabled={disabled}
                onClick={(): void => handleStageClick(stage, index)}
              >
                <span className="truncate text-center">
                  {compact ? t(`stages.${stage}`).slice(0, 3) : t(`stages.${stage}`)}
                </span>
              </button>
            )

            return (
              <div key={stage} className="flex flex-1 min-w-[72px] items-center gap-1">
                {/* Connector before stage (except first) */}
                {index > 0 && (
                  <div
                    className={connectorVariants({
                      state: index <= currentIndex ? 'completed' : 'upcoming',
                    })}
                    aria-hidden="true"
                  />
                )}

                {/* Completed stages: Popover with transition summary */}
                {isCompleted && transition != null ? (
                  <Popover>
                    <PopoverTrigger asChild>{stageButton}</PopoverTrigger>
                    <PopoverContent className="w-64 p-3">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">
                          {t(`stages.${stage}`)}
                        </p>
                        {transition.user_name != null &&
                          transition.user_name !== '' && (
                            <p className="text-sm text-muted-foreground">
                              {t('stepper.transitionedBy', {
                                name: transition.user_name,
                              })}
                            </p>
                          )}
                        <p className="text-sm text-muted-foreground">
                          {formatEntryDate(transition.transitioned_at)}
                        </p>
                        {transition.note != null && transition.note !== '' && (
                          <p className="text-sm italic">{transition.note}</p>
                        )}
                        {transition.duration_in_stage_seconds != null &&
                          transition.duration_in_stage_seconds > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {t('stepper.timeInStage', {
                                duration: formatDuration(
                                  transition.duration_in_stage_seconds,
                                ),
                              })}
                            </p>
                          )}
                        {/* Revert button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full min-h-11 mt-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(): void => handleRevertClick(stage)}
                        >
                          {t('stepper.revertToStage')}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  stageButton
                )}
              </div>
            )
          })}
        </div>
      </LtrIsolate>

      {/* "Next" suggestion chip */}
      {nextStage !== null && !disabled && pendingStage === null && (
        <div className="flex justify-center">
          <button
            type="button"
            className="text-xs bg-primary/10 text-primary-600 rounded-full px-2 py-0.5 min-h-7 transition-colors hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring outline-none"
            onClick={(): void => handleStageClick(nextStage, currentIndex + 1)}
          >
            {t('stepper.nextSuggestion', { stage: t(`stages.${nextStage}`) })}
          </button>
        </div>
      )}

      {/* Inline note prompt for non-adjacent / backward transitions */}
      {pendingStage !== null && (
        <div
          className={cn(
            'rounded-md border border-base-200 bg-base-50 p-3 space-y-2',
            'motion-safe:animate-in motion-safe:slide-in-from-top-2 motion-safe:duration-200',
          )}
          onKeyDown={handleNoteKeyDown}
        >
          {isRevert && (
            <p className="text-sm text-destructive font-medium">
              {t('stepper.backwardWarning')}
            </p>
          )}
          <label className="sr-only" htmlFor="lifecycle-transition-note">
            {t('stepper.transitionNote')}
          </label>
          <textarea
            id="lifecycle-transition-note"
            ref={textareaRef}
            value={noteValue}
            onChange={(e): void => setNoteValue(e.target.value)}
            placeholder={t('transition.notePlaceholder')}
            aria-label={t('stepper.transitionNote')}
            className="w-full min-h-[60px] rounded-md border border-base-200 bg-background px-3 py-2 text-sm placeholder:text-base-400 focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11"
              onClick={handleCancelTransition}
            >
              {t('transition.cancel')}
            </Button>
            <Button
              variant={isRevert ? 'destructive' : 'default'}
              size="sm"
              className="min-h-11"
              disabled={transitionMutation.isPending}
              onClick={handleConfirmTransition}
            >
              {transitionMutation.isPending && (
                <span className="me-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {t('stepper.confirmTransition')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
