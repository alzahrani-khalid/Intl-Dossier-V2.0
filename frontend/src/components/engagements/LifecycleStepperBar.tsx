/**
 * LifecycleStepperBar
 * CRM pipeline-style horizontal stepper for engagement lifecycle stages.
 *
 * Features:
 * - 6 stages with completed/current/upcoming visual states
 * - Click any stage to transition (adjacent = immediate, non-adjacent = note prompt)
 * - Tooltips on completed stages showing entry date
 * - "Next" suggestion chip below current stage
 * - LtrIsolate wrapper for consistent LTR rendering in both LTR/RTL
 * - Mobile horizontal scroll with snap, desktop flex fill
 * - Full keyboard and screen reader accessibility
 */

import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import type { LifecycleStage, LifecycleTransition } from '@/types/lifecycle.types'
import { LIFECYCLE_STAGES } from '@/types/lifecycle.types'

// ============================================================================
// Props
// ============================================================================

export interface LifecycleStepperBarProps {
  currentStage: LifecycleStage
  transitions: LifecycleTransition[]
  onTransition: (toStage: LifecycleStage, note?: string) => void
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
        completed: 'bg-primary/15 border border-primary-300 text-primary-700 cursor-pointer hover:bg-primary/25',
        current: 'bg-primary/15 border-2 border-primary text-primary-600 cursor-default',
        upcoming: 'bg-base-100 border border-base-200 text-base-400 cursor-pointer hover:bg-base-200/50',
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
  currentStage,
  transitions,
  onTransition,
  disabled = false,
}: LifecycleStepperBarProps): ReactElement {
  const { t } = useTranslation('lifecycle')
  const [pendingStage, setPendingStage] = useState<LifecycleStage | null>(null)
  const [noteValue, setNoteValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentIndex = LIFECYCLE_STAGES.indexOf(currentStage)

  // Auto-focus textarea when note prompt opens
  useEffect(() => {
    if (pendingStage !== null && textareaRef.current !== null) {
      textareaRef.current.focus()
    }
  }, [pendingStage])

  // Escape key cancels note prompt
  const handleNoteKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setPendingStage(null)
        setNoteValue('')
      }
    },
    [],
  )

  const handleStageClick = useCallback(
    (stage: LifecycleStage, stageIndex: number): void => {
      if (disabled) return
      if (stageIndex === currentIndex) return

      const diff = Math.abs(stageIndex - currentIndex)
      if (diff === 1) {
        // Adjacent transition — immediate
        onTransition(stage)
      } else {
        // Non-adjacent — show note prompt
        setPendingStage(stage)
        setNoteValue('')
      }
    },
    [currentIndex, disabled, onTransition],
  )

  const handleConfirmTransition = useCallback((): void => {
    if (pendingStage === null) return
    onTransition(pendingStage, noteValue.trim() !== '' ? noteValue.trim() : undefined)
    setPendingStage(null)
    setNoteValue('')
  }, [pendingStage, noteValue, onTransition])

  const handleCancelTransition = useCallback((): void => {
    setPendingStage(null)
    setNoteValue('')
  }, [])

  // Find the transition entry for a completed stage (to get entry date)
  const getTransitionForStage = useCallback(
    (stage: LifecycleStage): LifecycleTransition | undefined => {
      return transitions.find((tr) => tr.to_stage === stage)
    },
    [transitions],
  )

  // Next stage for suggestion chip
  const nextStage: LifecycleStage | null =
    currentIndex < LIFECYCLE_STAGES.length - 1
      ? LIFECYCLE_STAGES[currentIndex + 1] ?? null
      : null

  return (
    <div className="w-full space-y-2">
      {/* Stepper bar wrapped in LtrIsolate for consistent LTR rendering */}
      <LtrIsolate className="w-full overflow-x-auto pb-2 sm:overflow-x-visible sm:pb-0">
        <div
          role="group"
          aria-label={t('stepper.ariaLabel')}
          className="flex min-w-[480px] snap-x snap-mandatory items-center gap-1 sm:min-w-0"
        >
          {LIFECYCLE_STAGES.map((stage, index) => {
            const state = getStageState(index, currentIndex)
            const isCompleted = state === 'completed'
            const isCurrent = state === 'current'
            const transition = isCompleted ? getTransitionForStage(stage) : undefined

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
                  {t(`stages.${stage}`)}
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

                {/* Stage button with optional tooltip for completed stages */}
                {isCompleted && transition != null ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {stageButton}
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('stepper.entered', {
                        date: formatEntryDate(transition.transitioned_at),
                      })}
                    </TooltipContent>
                  </Tooltip>
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

      {/* Inline note prompt for non-adjacent transitions */}
      {pendingStage !== null && (
        <div
          className={cn(
            'rounded-md border border-base-200 bg-base-50 p-3 space-y-2',
            'motion-safe:animate-in motion-safe:slide-in-from-top-2 motion-safe:duration-200',
          )}
          onKeyDown={handleNoteKeyDown}
        >
          <textarea
            ref={textareaRef}
            value={noteValue}
            onChange={(e): void => setNoteValue(e.target.value)}
            placeholder={t('transition.notePlaceholder')}
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
              variant="default"
              size="sm"
              className="min-h-11"
              onClick={handleConfirmTransition}
            >
              {t('transition.confirm')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
