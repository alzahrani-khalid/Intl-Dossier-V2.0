/**
 * ProgressiveFormField Component
 * Enhanced form field with clear required/optional distinction
 * Mobile-first and RTL-compatible
 */

import { useTranslation } from 'react-i18next'
import { useId, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { CheckCircle2, AlertCircle, CircleDot, Info } from 'lucide-react'
import type { FieldImportance, FieldStatus } from '@/types/progressive-form.types'

// =============================================================================
// TYPES
// =============================================================================

export interface ProgressiveFormFieldProps {
  /** Field name for accessibility */
  name: string
  /** Label text */
  label: string
  /** Field importance level */
  importance: FieldImportance
  /** Field status */
  status?: FieldStatus
  /** Help text shown below the field */
  helpText?: string
  /** Error message */
  error?: string
  /** Whether field has been touched */
  touched?: boolean
  /** Additional class names */
  className?: string
  /** Children (input element) */
  children: ReactNode
  /** Whether to show status indicator */
  showStatusIndicator?: boolean
  /** Whether to show importance badge */
  showImportanceBadge?: boolean
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ImportanceBadgeProps {
  importance: FieldImportance
  className?: string
}

function ImportanceBadge({ importance, className }: ImportanceBadgeProps) {
  const { t } = useTranslation('progressive-form')

  const badgeConfig = {
    required: {
      label: t('importance.required'),
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      icon: <AlertCircle className="w-3 h-3" />,
    },
    recommended: {
      label: t('importance.recommended'),
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      icon: <CircleDot className="w-3 h-3" />,
    },
    optional: {
      label: t('importance.optional'),
      className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      icon: <Info className="w-3 h-3" />,
    },
  }

  const config = badgeConfig[importance]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className,
      )}
    >
      {config.icon}
      {config.label}
    </span>
  )
}

interface StatusIndicatorProps {
  status: FieldStatus
  importance: FieldImportance
  className?: string
}

function StatusIndicator({ status, importance, className }: StatusIndicatorProps) {
  const { t } = useTranslation('progressive-form')

  const statusConfig = {
    empty: {
      icon:
        importance === 'required' ? (
          <div className="w-4 h-4 rounded-full border-2 border-red-400 dark:border-red-500" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
        ),
      label: t('status.empty'),
      color: importance === 'required' ? 'text-red-500' : 'text-gray-400',
    },
    partial: {
      icon: (
        <div className="w-4 h-4 rounded-full border-2 border-amber-400 bg-amber-100 dark:border-amber-500 dark:bg-amber-900/30">
          <div className="w-1/2 h-full bg-amber-400 rounded-s-full" />
        </div>
      ),
      label: t('status.partial'),
      color: 'text-amber-500',
    },
    complete: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      label: t('status.complete'),
      color: 'text-emerald-500',
    },
    error: {
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      label: t('status.error'),
      color: 'text-red-500',
    },
  }

  const config = statusConfig[status]

  return (
    <motion.div
      className={cn('flex items-center', config.color, className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      aria-label={config.label}
      title={config.label}
    >
      {config.icon}
    </motion.div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ProgressiveFormField({
  name,
  label,
  importance,
  status = 'empty',
  helpText,
  error,
  touched = false,
  className,
  children,
  showStatusIndicator = true,
  showImportanceBadge = true,
}: ProgressiveFormFieldProps) {
  const { t, i18n } = useTranslation(['progressive-form', 'common'])
  const isRTL = i18n.language === 'ar'
  const uniqueId = useId()

  const inputId = `${name}-${uniqueId}`
  const errorId = `${name}-error-${uniqueId}`
  const helpId = `${name}-help-${uniqueId}`

  // Determine current status
  const currentStatus = error ? 'error' : status

  // Should show validation state
  const shouldShowStatus = touched || currentStatus === 'complete' || currentStatus === 'error'

  // Container styling based on importance and status
  const containerClasses = cn(
    'relative',
    // Mobile-first spacing
    'p-3 sm:p-4',
    // Rounded corners
    'rounded-lg',
    // Border styling based on importance
    importance === 'required' &&
      currentStatus !== 'complete' &&
      'border-s-4 border-s-red-400 dark:border-s-red-500',
    importance === 'recommended' && 'border-s-4 border-s-amber-300 dark:border-s-amber-600',
    importance === 'optional' && 'border-s-4 border-s-gray-200 dark:border-s-gray-700',
    // Success state
    currentStatus === 'complete' && 'border-s-4 border-s-emerald-400 dark:border-s-emerald-500',
    // Error state
    currentStatus === 'error' && 'border-s-4 border-s-red-500 dark:border-s-red-400',
    // Background
    'bg-white dark:bg-gray-800',
    // Shadow for elevation
    'shadow-sm',
    // Hover effect
    'transition-all duration-200',
    'hover:shadow-md',
    className,
  )

  return (
    <motion.div
      className={containerClasses}
      dir={isRTL ? 'rtl' : 'ltr'}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Label Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <label
            htmlFor={inputId}
            className={cn(
              'block font-medium text-start',
              'text-sm sm:text-base',
              'text-gray-700 dark:text-gray-300',
              currentStatus === 'error' && 'text-red-700 dark:text-red-400',
            )}
          >
            {label}
            {importance === 'required' && (
              <span className="text-red-500 ms-1" aria-label={t('common:validation.required')}>
                *
              </span>
            )}
          </label>

          {showImportanceBadge && importance !== 'required' && (
            <ImportanceBadge importance={importance} />
          )}
        </div>

        {/* Status Indicator */}
        {showStatusIndicator && shouldShowStatus && (
          <StatusIndicator status={currentStatus} importance={importance} />
        )}
      </div>

      {/* Input Field */}
      <div className="relative">{children}</div>

      {/* Help Text / Error Message */}
      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="error"
            id={errorId}
            className="mt-2 text-sm text-red-600 dark:text-red-400 text-start flex items-center gap-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.p>
        ) : helpText ? (
          <motion.p
            key="help"
            id={helpId}
            className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {helpText}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export { ImportanceBadge, StatusIndicator }
export default ProgressiveFormField
