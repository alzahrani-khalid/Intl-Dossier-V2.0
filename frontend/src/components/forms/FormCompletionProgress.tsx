/**
 * FormCompletionProgress Component
 * Shows form completion progress with breakdown by field importance
 * Mobile-first and RTL-compatible
 */

import { useTranslation } from 'react-i18next'
import { m } from 'motion/react'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  AlertCircle,
  CircleDot,
  Info,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'
import type { FormCompletionState } from '@/types/progressive-form.types'
import { useState } from 'react'

// =============================================================================
// TYPES
// =============================================================================

export interface FormCompletionProgressProps {
  /** Completion state from useProgressiveForm hook */
  completionState: FormCompletionState
  /** Whether to show detailed breakdown */
  showDetails?: boolean
  /** Whether to show warnings for empty required fields */
  showWarnings?: boolean
  /** Whether to expand details by default */
  defaultExpanded?: boolean
  /** Variant style */
  variant?: 'default' | 'compact' | 'minimal'
  /** Additional class names */
  className?: string
  /** Callback when ready to submit */
  onReadyToSubmit?: () => void
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ProgressBarProps {
  percentage: number
  variant?: 'required' | 'overall'
  className?: string
}

function ProgressBar({ percentage, variant = 'overall', className }: ProgressBarProps) {
  // Color based on percentage and variant
  const getBarColor = () => {
    if (variant === 'required') {
      if (percentage === 100) return 'bg-success'
      if (percentage >= 75) return 'bg-warning'
      return 'bg-danger'
    }
    // Overall
    if (percentage === 100) return 'bg-success'
    if (percentage >= 75) return 'bg-success'
    if (percentage >= 50) return 'bg-warning'
    if (percentage >= 25) return 'bg-warning'
    return 'bg-muted'
  }

  return (
    <div
      className={cn(
        'relative w-full h-2 sm:h-3 bg-muted dark:bg-muted rounded-full overflow-hidden',
        className,
      )}
    >
      <m.div
        className={cn('absolute inset-y-0 start-0 rounded-full', getBarColor())}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  )
}

interface StatItemProps {
  icon: React.ReactNode
  label: string
  completed: number
  total: number
  colorClass: string
}

function StatItem({ icon, label, completed, total, colorClass }: StatItemProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 100

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className={cn('flex-shrink-0', colorClass)}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
            {label}
          </span>
          <span className="text-sm text-muted-foreground dark:text-muted-foreground">
            {completed}/{total}
          </span>
        </div>
        <div className="mt-1 h-1.5 bg-muted dark:bg-muted rounded-full overflow-hidden">
          <m.div
            className={cn('h-full rounded-full', colorClass.replace('text-', 'bg-'))}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FormCompletionProgress({
  completionState,
  showDetails = true,
  showWarnings = true,
  defaultExpanded = false,
  variant = 'default',
  className,
}: FormCompletionProgressProps) {
  const { t } = useTranslation('progressive-form')
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const {
    totalFields,
    completedFields,
    requiredFields,
    completedRequiredFields,
    optionalFields,
    completedOptionalFields,
    recommendedFields,
    completedRecommendedFields,
    overallPercentage,
    requiredPercentage,
    canSubmit,
    fieldsWithErrors,
    emptyRequiredFields,
  } = completionState

  // Status message
  const getStatusMessage = () => {
    if (canSubmit) {
      return t('progress.readyToSubmit')
    }
    if (fieldsWithErrors.length > 0) {
      return t('progress.hasErrors', { count: fieldsWithErrors.length })
    }
    if (emptyRequiredFields.length > 0) {
      return t('progress.missingRequired', { count: emptyRequiredFields.length })
    }
    return t('progress.inProgress')
  }

  // Status icon
  const getStatusIcon = () => {
    if (canSubmit) {
      return <CheckCircle2 className="w-5 h-5 text-success" />
    }
    if (fieldsWithErrors.length > 0) {
      return <AlertCircle className="w-5 h-5 text-danger" />
    }
    if (emptyRequiredFields.length > 0) {
      return <AlertTriangle className="w-5 h-5 text-warning" />
    }
    return <CircleDot className="w-5 h-5 text-info" />
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {getStatusIcon()}
        <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
          {overallPercentage}%
        </span>
      </div>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 sm:gap-4', className)}>
        {getStatusIcon()}
        <div className="flex-1">
          <ProgressBar percentage={requiredPercentage} variant="required" />
        </div>
        <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground flex-shrink-0">
          {requiredPercentage}%
        </span>
      </div>
    )
  }

  // Default variant
  return (
    <m.div
      className={cn(
        'rounded-xl',
        'bg-white dark:bg-muted',
        'border border-line dark:border-line',
        'shadow-sm',
        'overflow-hidden',
        className,
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Progress Section */}
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium text-foreground dark:text-white text-sm sm:text-base">
              {getStatusMessage()}
            </span>
          </div>
          <span className="text-lg sm:text-xl font-bold text-foreground dark:text-white">
            {overallPercentage}%
          </span>
        </div>

        {/* Main Progress Bar */}
        <ProgressBar percentage={overallPercentage} />

        {/* Field Count Summary */}
        <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground dark:text-muted-foreground">
          <span>
            {t('progress.fieldsCompleted', {
              completed: completedFields,
              total: totalFields,
            })}
          </span>
          {requiredFields > 0 && (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                requiredPercentage === 100
                  ? 'bg-success/10 text-success dark:bg-success/30 dark:text-success'
                  : 'bg-danger/10 text-danger dark:bg-danger/30 dark:text-danger',
              )}
            >
              {t('progress.requiredStatus', {
                completed: completedRequiredFields,
                total: requiredFields,
              })}
            </span>
          )}
        </div>
      </div>

      {/* Expandable Details Section */}
      {showDetails && (requiredFields > 0 || recommendedFields > 0 || optionalFields > 0) && (
        <>
          {/* Toggle Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'w-full px-4 py-2 sm:px-5 sm:py-3',
              'flex items-center justify-between',
              'bg-muted dark:bg-muted/50',
              'border-t border-line dark:border-line',
              'text-sm text-muted-foreground dark:text-muted-foreground',
              'hover:bg-muted dark:hover:bg-muted/50',
              'transition-colors duration-200',
            )}
          >
            <span>{t('progress.viewDetails')}</span>
            <m.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4" />
            </m.div>
          </button>

          {/* Details Content */}
          {isExpanded && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3 sm:space-y-4 bg-muted dark:bg-muted/50"
            >
              {/* Required Fields */}
              {requiredFields > 0 && (
                <StatItem
                  icon={<AlertCircle className="w-4 h-4" />}
                  label={t('importance.required')}
                  completed={completedRequiredFields}
                  total={requiredFields}
                  colorClass="text-danger"
                />
              )}

              {/* Recommended Fields */}
              {recommendedFields > 0 && (
                <StatItem
                  icon={<CircleDot className="w-4 h-4" />}
                  label={t('importance.recommended')}
                  completed={completedRecommendedFields}
                  total={recommendedFields}
                  colorClass="text-warning"
                />
              )}

              {/* Optional Fields */}
              {optionalFields > 0 && (
                <StatItem
                  icon={<Info className="w-4 h-4" />}
                  label={t('importance.optional')}
                  completed={completedOptionalFields}
                  total={optionalFields}
                  colorClass="text-muted-foreground"
                />
              )}
            </m.div>
          )}
        </>
      )}

      {/* Warnings Section */}
      {showWarnings && (emptyRequiredFields.length > 0 || fieldsWithErrors.length > 0) && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-2 border-t border-line dark:border-line bg-warning/50 dark:bg-warning/10">
          <div className="pt-3 sm:pt-4">
            {/* Empty Required Fields Warning */}
            {emptyRequiredFields.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-warning dark:text-warning">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  {t('progress.emptyRequiredWarning', {
                    count: emptyRequiredFields.length,
                  })}
                </span>
              </div>
            )}

            {/* Fields with Errors Warning */}
            {fieldsWithErrors.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-danger dark:text-danger mt-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  {t('progress.errorsWarning', {
                    count: fieldsWithErrors.length,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </m.div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export { ProgressBar }
