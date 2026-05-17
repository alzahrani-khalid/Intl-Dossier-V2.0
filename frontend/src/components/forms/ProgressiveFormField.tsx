/**
 * ProgressiveFormField Component
 * Enhanced form field with clear required/optional distinction
 * Mobile-first and RTL-compatible
 */

import { useTranslation } from 'react-i18next'
import { useId, type ReactNode } from 'react'
import { m, AnimatePresence } from 'motion/react'
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
      className: 'bg-danger/10 text-danger dark:bg-danger/30 dark:text-danger',
      icon: <AlertCircle className="w-3 h-3" />,
    },
    recommended: {
      label: t('importance.recommended'),
      className: 'bg-warning/10 text-warning dark:bg-warning/30 dark:text-warning',
      icon: <CircleDot className="w-3 h-3" />,
    },
    optional: {
      label: t('importance.optional'),
      className: 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground',
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
          <div className="w-4 h-4 rounded-full border-2 border-danger dark:border-danger" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-line dark:border-line" />
        ),
      label: t('status.empty'),
      color: importance === 'required' ? 'text-danger' : 'text-muted-foreground',
    },
    partial: {
      icon: (
        <div className="w-4 h-4 rounded-full border-2 border-warning bg-warning/10 dark:border-warning dark:bg-warning/30">
          <div className="w-1/2 h-full bg-warning rounded-s-full" />
        </div>
      ),
      label: t('status.partial'),
      color: 'text-warning',
    },
    complete: {
      icon: <CheckCircle2 className="w-4 h-4 text-success" />,
      label: t('status.complete'),
      color: 'text-success',
    },
    error: {
      icon: <AlertCircle className="w-4 h-4 text-danger" />,
      label: t('status.error'),
      color: 'text-danger',
    },
  }

  const config = statusConfig[status]

  return (
    <m.div
      className={cn('flex items-center', config.color, className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      aria-label={config.label}
      title={config.label}
    >
      {config.icon}
    </m.div>
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
  const { t } = useTranslation(['progressive-form', 'common'])
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
    'bg-white dark:bg-muted',
    // Shadow for elevation
    'shadow-sm',
    // Hover effect
    'transition-all duration-200',
    'hover:shadow-md',
    className,
  )

  return (
    <m.div
      className={containerClasses}
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
              'text-muted-foreground dark:text-muted-foreground',
              currentStatus === 'error' && 'text-danger dark:text-danger',
            )}
          >
            {label}
            {importance === 'required' && (
              <span className="text-danger ms-1" aria-label={t('common:validation.required')}>
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
          <m.p
            key="error"
            id={errorId}
            className="mt-2 text-sm text-danger dark:text-danger text-start flex items-center gap-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </m.p>
        ) : helpText ? (
          <m.p
            key="help"
            id={helpId}
            className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground text-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {helpText}
          </m.p>
        ) : null}
      </AnimatePresence>
    </m.div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export { ImportanceBadge, StatusIndicator }
