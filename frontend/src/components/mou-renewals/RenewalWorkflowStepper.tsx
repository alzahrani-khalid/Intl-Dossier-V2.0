/**
 * RenewalWorkflowStepper Component
 * Feature: commitment-renewal-workflow
 *
 * Visual stepper showing renewal workflow progress with status-based styling.
 * Mobile-first, RTL-aware design.
 */

import { useTranslation } from 'react-i18next'
import { Play, Users, CheckCircle, FileSignature, Flag, XCircle, Clock } from 'lucide-react'

import { cn } from '@/lib/utils'
import { type RenewalStatus, RENEWAL_STATUS_COLORS } from '@/types/mou-renewal.types'

interface RenewalWorkflowStepperProps {
  currentStatus: RenewalStatus
  onStepClick?: (status: RenewalStatus) => void
  allowedTransitions?: RenewalStatus[]
  compact?: boolean
}

const WORKFLOW_STEPS: { status: RenewalStatus; icon: typeof Play }[] = [
  { status: 'initiated', icon: Play },
  { status: 'negotiation', icon: Users },
  { status: 'approved', icon: CheckCircle },
  { status: 'signed', icon: FileSignature },
  { status: 'completed', icon: Flag },
]

const TERMINAL_STATES: RenewalStatus[] = ['declined', 'expired']

function getStepState(
  stepStatus: RenewalStatus,
  currentStatus: RenewalStatus,
): 'completed' | 'current' | 'pending' | 'terminal' {
  if (TERMINAL_STATES.includes(currentStatus)) {
    return 'terminal'
  }

  const stepIndex = WORKFLOW_STEPS.findIndex((s) => s.status === stepStatus)
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.status === currentStatus)

  if (currentStatus === 'pending') {
    return 'pending'
  }

  if (stepIndex < currentIndex) {
    return 'completed'
  }

  if (stepIndex === currentIndex) {
    return 'current'
  }

  return 'pending'
}

export function RenewalWorkflowStepper({
  currentStatus,
  onStepClick,
  allowedTransitions = [],
  compact = false,
}: RenewalWorkflowStepperProps) {
  const { t, i18n } = useTranslation('mou-renewals')
  const isRTL = i18n.language === 'ar'

  const isTerminal = TERMINAL_STATES.includes(currentStatus)

  return (
    <div className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Terminal state message */}
      {isTerminal && (
        <div
          className={cn(
            'mb-4 flex items-center gap-2 rounded-lg p-3',
            currentStatus === 'declined' &&
              'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
            currentStatus === 'expired' &&
              'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
          )}
        >
          {currentStatus === 'declined' ? (
            <XCircle className="h-5 w-5" />
          ) : (
            <Clock className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{t(`renewalStatus.${currentStatus}`)}</span>
        </div>
      )}

      {/* Stepper */}
      <div className="relative">
        {/* Progress line (background) */}
        <div
          className={cn(
            'absolute top-5 h-0.5 bg-muted',
            isRTL ? 'end-5 start-5' : 'start-5 end-5',
            compact && 'top-4',
          )}
        />

        {/* Progress line (filled) */}
        <div
          className={cn(
            'absolute top-5 h-0.5 bg-primary transition-all duration-300',
            isRTL ? 'end-5' : 'start-5',
            compact && 'top-4',
            isTerminal && 'bg-muted',
          )}
          style={{
            width: `${
              (WORKFLOW_STEPS.findIndex((s) => s.status === currentStatus) /
                (WORKFLOW_STEPS.length - 1)) *
              100
            }%`,
          }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {WORKFLOW_STEPS.map((step) => {
            const stepState = getStepState(step.status, currentStatus)
            const Icon = step.icon
            const isClickable = onStepClick && allowedTransitions.includes(step.status)
            const colors = RENEWAL_STATUS_COLORS[step.status]

            return (
              <button
                key={step.status}
                type="button"
                onClick={() => isClickable && onStepClick(step.status)}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default',
                )}
              >
                {/* Circle with icon */}
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full border-2 transition-all',
                    compact ? 'h-8 w-8' : 'h-10 w-10',
                    stepState === 'completed' &&
                      'border-primary bg-primary text-primary-foreground',
                    stepState === 'current' &&
                      'border-primary bg-background text-primary ring-4 ring-primary/20',
                    stepState === 'pending' && 'border-muted bg-background text-muted-foreground',
                    stepState === 'terminal' && 'border-muted bg-muted text-muted-foreground',
                    isClickable && 'hover:border-primary/80 hover:bg-primary/10',
                  )}
                >
                  {stepState === 'completed' ? (
                    <CheckCircle className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
                  ) : (
                    <Icon className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
                  )}
                </div>

                {/* Label */}
                {!compact && (
                  <span
                    className={cn(
                      'mt-2 text-xs font-medium',
                      stepState === 'current' && 'text-primary',
                      stepState === 'completed' && 'text-primary',
                      stepState === 'pending' && 'text-muted-foreground',
                      stepState === 'terminal' && 'text-muted-foreground',
                    )}
                  >
                    {t(`renewalStatus.${step.status}`)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Compact labels */}
      {compact && (
        <div className="mt-2 text-center">
          <span className="text-xs font-medium text-muted-foreground">
            {t(`renewalStatus.${currentStatus}`)}
          </span>
        </div>
      )}
    </div>
  )
}

export default RenewalWorkflowStepper
