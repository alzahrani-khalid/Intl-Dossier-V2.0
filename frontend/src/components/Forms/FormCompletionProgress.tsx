/**
 * FormCompletionProgress Component
 * Shows form completion progress with breakdown by field importance
 * Mobile-first and RTL-compatible
 */

import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
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
      if (percentage === 100) return 'bg-emerald-500'
      if (percentage >= 75) return 'bg-amber-500'
      return 'bg-red-500'
    }
    // Overall
    if (percentage === 100) return 'bg-emerald-500'
    if (percentage >= 75) return 'bg-emerald-400'
    if (percentage >= 50) return 'bg-amber-500'
    if (percentage >= 25) return 'bg-amber-400'
    return 'bg-gray-400'
  }

  return (
    <div
      className={cn(
        'relative w-full h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
        className,
      )}
    >
      <motion.div
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
  const { t } = useTranslation('progressive-form')
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 100

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className={cn('flex-shrink-0', colorClass)}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completed}/{total}
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <motion.div
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
  const { t, i18n } = useTranslation('progressive-form')
  const isRTL = i18n.language === 'ar'
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
      return <CheckCircle2 className="size-5 text-emerald-500" />
    }
    if (fieldsWithErrors.length > 0) {
      return <AlertCircle className="size-5 text-red-500" />
    }
    if (emptyRequiredFields.length > 0) {
      return <AlertTriangle className="size-5 text-amber-500" />
    }
    return <CircleDot className="size-5 text-blue-500" />
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        {getStatusIcon()}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {overallPercentage}%
        </span>
      </div>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div
        className={cn('flex items-center gap-3 sm:gap-4', className)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {getStatusIcon()}
        <div className="flex-1">
          <ProgressBar percentage={requiredPercentage} variant="required" />
        </div>
        <span className="shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300">
          {requiredPercentage}%
        </span>
      </div>
    )
  }

  // Default variant
  return (
    <motion.div
      className={cn(
        'rounded-xl',
        'bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        'shadow-sm',
        'overflow-hidden',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Progress Section */}
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium text-gray-900 dark:text-white sm:text-base">
              {getStatusMessage()}
            </span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
            {overallPercentage}%
          </span>
        </div>

        {/* Main Progress Bar */}
        <ProgressBar percentage={overallPercentage} />

        {/* Field Count Summary */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 sm:gap-4">
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
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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
              'bg-gray-50 dark:bg-gray-900/50',
              'border-t border-gray-200 dark:border-gray-700',
              'text-sm text-gray-600 dark:text-gray-400',
              'hover:bg-gray-100 dark:hover:bg-gray-800/50',
              'transition-colors duration-200',
            )}
          >
            <span>{t('progress.viewDetails')}</span>
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="size-4" />
            </motion.div>
          </button>

          {/* Details Content */}
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3 bg-gray-50 px-4 pb-4 dark:bg-gray-900/50 sm:space-y-4 sm:px-5 sm:pb-5"
            >
              {/* Required Fields */}
              {requiredFields > 0 && (
                <StatItem
                  icon={<AlertCircle className="size-4" />}
                  label={t('importance.required')}
                  completed={completedRequiredFields}
                  total={requiredFields}
                  colorClass="text-red-500"
                />
              )}

              {/* Recommended Fields */}
              {recommendedFields > 0 && (
                <StatItem
                  icon={<CircleDot className="size-4" />}
                  label={t('importance.recommended')}
                  completed={completedRecommendedFields}
                  total={recommendedFields}
                  colorClass="text-amber-500"
                />
              )}

              {/* Optional Fields */}
              {optionalFields > 0 && (
                <StatItem
                  icon={<Info className="size-4" />}
                  label={t('importance.optional')}
                  completed={completedOptionalFields}
                  total={optionalFields}
                  colorClass="text-gray-500"
                />
              )}
            </motion.div>
          )}
        </>
      )}

      {/* Warnings Section */}
      {showWarnings && (emptyRequiredFields.length > 0 || fieldsWithErrors.length > 0) && (
        <div className="space-y-2 border-t border-gray-200 bg-amber-50/50 px-4 pb-4 dark:border-gray-700 dark:bg-amber-900/10 sm:px-5 sm:pb-5">
          <div className="pt-3 sm:pt-4">
            {/* Empty Required Fields Warning */}
            {emptyRequiredFields.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  {t('progress.emptyRequiredWarning', {
                    count: emptyRequiredFields.length,
                  })}
                </span>
              </div>
            )}

            {/* Fields with Errors Warning */}
            {fieldsWithErrors.length > 0 && (
              <div className="mt-2 flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
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
    </motion.div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export { ProgressBar }
export default FormCompletionProgress
