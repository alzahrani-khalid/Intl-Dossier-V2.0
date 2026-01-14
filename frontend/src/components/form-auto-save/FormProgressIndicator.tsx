/**
 * FormProgressIndicator Component
 *
 * Displays form completion progress with:
 * - Progress bar with percentage
 * - Estimated time remaining
 * - Step indicator for multi-step forms
 * - Mobile-first, RTL-compatible layout
 *
 * @module components/form-auto-save/FormProgressIndicator
 */

import { useTranslation } from 'react-i18next'
import { Clock, CheckCircle2, Circle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { FormProgressIndicatorProps } from '@/types/form-auto-save.types'

export function FormProgressIndicator({
  progress,
  showTimeEstimate = true,
  showSteps = true,
  className,
  size = 'default',
}: FormProgressIndicatorProps) {
  const { t, i18n } = useTranslation('form-auto-save')
  const isRTL = i18n.language === 'ar'

  const {
    percentage,
    completedFields,
    totalFields,
    currentStep,
    totalSteps,
    estimatedMinutesRemaining,
  } = progress

  const isComplete = percentage === 100
  const hasSteps = typeof currentStep === 'number' && typeof totalSteps === 'number'

  // Size variants
  const sizeClasses = {
    sm: {
      container: 'p-2 sm:p-3',
      text: 'text-xs',
      progress: 'h-1.5',
      icon: 'size-3',
    },
    default: {
      container: 'p-3 sm:p-4',
      text: 'text-sm',
      progress: 'h-2',
      icon: 'size-4',
    },
    lg: {
      container: 'p-4 sm:p-5',
      text: 'text-base',
      progress: 'h-2.5',
      icon: 'size-5',
    },
  }

  const classes = sizeClasses[size]

  return (
    <div
      className={cn('rounded-lg border bg-card', classes.container, className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="status"
      aria-label={t('progress.ariaLabel', { percentage })}
    >
      {/* Header with percentage and time estimate */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        {/* Progress percentage */}
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className={cn(classes.icon, 'text-green-500')} />
          ) : (
            <Circle className={cn(classes.icon, 'text-muted-foreground')} />
          )}
          <span className={cn(classes.text, 'font-medium')}>
            {t('progress.percentage', { value: percentage })}
          </span>
          <span className={cn(classes.text, 'text-muted-foreground')}>
            ({t('progress.fieldsCompleted', { completed: completedFields, total: totalFields })})
          </span>
        </div>

        {/* Time estimate */}
        {showTimeEstimate && !isComplete && estimatedMinutesRemaining > 0 && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className={cn(classes.icon, 'shrink-0')} />
            <span className={classes.text}>
              {estimatedMinutesRemaining === 1
                ? t('progress.minuteRemaining')
                : t('progress.minutesRemaining', { minutes: estimatedMinutesRemaining })}
            </span>
          </div>
        )}

        {/* Complete indicator */}
        {isComplete && (
          <span className={cn(classes.text, 'text-green-600 font-medium')}>
            {t('progress.complete')}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <Progress
        value={percentage}
        className={cn(classes.progress, 'mb-2')}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* Step indicator for multi-step forms */}
      {showSteps && hasSteps && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <span className={cn(classes.text, 'text-muted-foreground')}>
            {t('progress.step', { current: currentStep! + 1, total: totalSteps })}
          </span>

          {/* Step dots */}
          <div className="flex items-center gap-1.5" role="group" aria-label={t('progress.steps')}>
            {Array.from({ length: totalSteps! }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  'size-2 rounded-full transition-colors',
                  index < currentStep!
                    ? 'bg-primary'
                    : index === currentStep
                      ? 'bg-primary ring-2 ring-primary/30'
                      : 'bg-muted',
                )}
                aria-current={index === currentStep ? 'step' : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FormProgressIndicator
