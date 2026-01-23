/**
 * FormErrorDisplay Component
 *
 * Standardized error display components for forms with:
 * - Inline field errors
 * - Form-level error summaries
 * - Contextual recovery suggestions
 * - Mobile-first, RTL-compatible design
 *
 * @module components/Forms/FormErrorDisplay
 */

import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { AlertCircle, AlertTriangle, Info, X, ChevronRight, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { FieldErrors, FieldError } from 'react-hook-form'

// =============================================================================
// TYPES
// =============================================================================

export type ErrorSeverity = 'error' | 'warning' | 'info'

export interface FormError {
  field?: string
  message: string
  severity?: ErrorSeverity
  suggestion?: string
  recoveryAction?: {
    label: string
    onClick: () => void
  }
}

interface InlineErrorProps {
  /** Error message to display */
  error?: FieldError | string
  /** Error severity */
  severity?: ErrorSeverity
  /** Show icon */
  showIcon?: boolean
  /** Additional class names */
  className?: string
}

interface ErrorSummaryProps {
  /** Array of errors to display */
  errors: FormError[]
  /** Title for the summary */
  title?: string
  /** Whether the summary is dismissible */
  dismissible?: boolean
  /** Callback when dismissed */
  onDismiss?: () => void
  /** Callback when an error field is clicked */
  onFieldClick?: (field: string) => void
  /** Additional class names */
  className?: string
}

interface FieldErrorListProps {
  /** react-hook-form errors object */
  errors: FieldErrors
  /** Field names to include (all if not specified) */
  fields?: string[]
  /** Field label mapping */
  fieldLabels?: Record<string, string>
  /** Callback when an error field is clicked */
  onFieldClick?: (field: string) => void
  /** Additional class names */
  className?: string
}

// =============================================================================
// UTILITIES
// =============================================================================

function getSeverityStyles(severity: ErrorSeverity) {
  switch (severity) {
    case 'error':
      return {
        container: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
        text: 'text-red-700 dark:text-red-400',
        icon: 'text-red-500',
        IconComponent: AlertCircle,
      }
    case 'warning':
      return {
        container: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
        text: 'text-amber-700 dark:text-amber-400',
        icon: 'text-amber-500',
        IconComponent: AlertTriangle,
      }
    case 'info':
      return {
        container: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-400',
        icon: 'text-blue-500',
        IconComponent: Info,
      }
  }
}

function getErrorMessage(error: FieldError | string | undefined): string | undefined {
  if (!error) return undefined
  if (typeof error === 'string') return error
  return error.message
}

// =============================================================================
// INLINE ERROR COMPONENT
// =============================================================================

/**
 * Inline error display for individual form fields
 */
export function InlineError({
  error,
  severity = 'error',
  showIcon = true,
  className,
}: InlineErrorProps) {
  const message = getErrorMessage(error)

  if (!message) return null

  const styles = getSeverityStyles(severity)
  const IconComponent = styles.IconComponent

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, height: 0, y: -5 }}
        animate={{ opacity: 1, height: 'auto', y: 0 }}
        exit={{ opacity: 0, height: 0, y: -5 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={cn('overflow-hidden', className)}
        role="alert"
        aria-live="polite"
      >
        <div className={cn('flex items-start gap-1.5 pt-1', styles.text)}>
          {showIcon && <IconComponent className={cn('h-4 w-4 mt-0.5 shrink-0', styles.icon)} />}
          <span className="text-sm">{message}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// =============================================================================
// ERROR WITH SUGGESTION
// =============================================================================

interface ErrorWithSuggestionProps extends InlineErrorProps {
  /** Recovery suggestion */
  suggestion?: string
  /** Recovery action */
  recoveryAction?: {
    label: string
    onClick: () => void
  }
}

/**
 * Error display with recovery suggestion and action
 */
export function ErrorWithSuggestion({
  error,
  severity = 'error',
  suggestion,
  recoveryAction,
  className,
}: ErrorWithSuggestionProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const message = getErrorMessage(error)

  if (!message) return null

  const styles = getSeverityStyles(severity)
  const IconComponent = styles.IconComponent

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className={cn('overflow-hidden', className)}
        role="alert"
      >
        <div
          className={cn('rounded-lg border p-3 mt-2', styles.container)}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Error message */}
          <div className={cn('flex items-start gap-2', styles.text)}>
            <IconComponent className={cn('h-4 w-4 mt-0.5 shrink-0', styles.icon)} />
            <span className="text-sm font-medium">{message}</span>
          </div>

          {/* Suggestion */}
          {suggestion && (
            <div className="flex items-start gap-2 mt-2 ps-6">
              <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{suggestion}</span>
            </div>
          )}

          {/* Recovery action */}
          {recoveryAction && (
            <div className="mt-2 ps-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={recoveryAction.onClick}
                className="text-xs"
              >
                {recoveryAction.label}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// =============================================================================
// ERROR SUMMARY COMPONENT
// =============================================================================

/**
 * Summary display for multiple form errors
 */
export function ErrorSummary({
  errors,
  title,
  dismissible = false,
  onDismiss,
  onFieldClick,
  className,
}: ErrorSummaryProps) {
  const { t, i18n } = useTranslation('validation')
  const isRTL = i18n.language === 'ar'

  if (errors.length === 0) return null

  const errorCount = errors.filter((e) => e.severity !== 'warning' && e.severity !== 'info').length
  const warningCount = errors.filter((e) => e.severity === 'warning').length

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'rounded-lg border',
          'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
          className,
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
        role="alert"
        aria-live="assertive"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="font-medium text-red-700 dark:text-red-400">
              {title || t('form_errors', { count: errorCount })}
            </span>
          </div>

          {dismissible && onDismiss && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Error list */}
        <ul className="divide-y divide-red-200 dark:divide-red-800">
          {errors.map((error, index) => {
            const styles = getSeverityStyles(error.severity || 'error')
            const IconComponent = styles.IconComponent

            return (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'px-4 py-2',
                  error.field &&
                    onFieldClick &&
                    'cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30',
                )}
                onClick={error.field && onFieldClick ? () => onFieldClick(error.field!) : undefined}
              >
                <div className="flex items-start gap-2">
                  <IconComponent className={cn('h-4 w-4 mt-0.5 shrink-0', styles.icon)} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', styles.text)}>
                      {error.field && <span className="font-medium">{error.field}: </span>}
                      {error.message}
                    </p>
                    {error.suggestion && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {error.suggestion}
                      </p>
                    )}
                  </div>
                  {error.field && onFieldClick && (
                    <ChevronRight className={cn('h-4 w-4 text-red-400', isRTL && 'rotate-180')} />
                  )}
                </div>
              </motion.li>
            )
          })}
        </ul>

        {/* Summary footer */}
        {(errorCount > 0 || warningCount > 0) && (
          <div className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400 border-t border-red-200 dark:border-red-800">
            {errorCount > 0 && t('error_count', { count: errorCount })}
            {errorCount > 0 && warningCount > 0 && ', '}
            {warningCount > 0 && t('warning_count', { count: warningCount })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// =============================================================================
// FIELD ERROR LIST
// =============================================================================

/**
 * Convert react-hook-form errors to FormError array
 */
export function FieldErrorList({
  errors,
  fields,
  fieldLabels = {},
  onFieldClick,
  className,
}: FieldErrorListProps) {
  const formErrors: FormError[] = []

  const processErrors = (obj: FieldErrors, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key

      // Skip if not in fields list (when specified)
      if (fields && !fields.some((f) => fieldPath.startsWith(f))) {
        continue
      }

      if (value && typeof value === 'object') {
        if ('message' in value && typeof value.message === 'string') {
          formErrors.push({
            field: fieldLabels[fieldPath] || fieldPath,
            message: value.message,
            severity: 'error',
          })
        } else {
          processErrors(value as FieldErrors, fieldPath)
        }
      }
    }
  }

  processErrors(errors)

  if (formErrors.length === 0) return null

  return <ErrorSummary errors={formErrors} onFieldClick={onFieldClick} className={className} />
}

// =============================================================================
// TOAST-STYLE ERROR
// =============================================================================

interface ToastErrorProps {
  /** Error message */
  message: string
  /** Whether the toast is visible */
  visible: boolean
  /** Callback when closed */
  onClose: () => void
  /** Auto-dismiss timeout in ms (0 to disable) */
  autoDismiss?: number
  /** Error severity */
  severity?: ErrorSeverity
}

/**
 * Toast-style floating error notification
 */
export function ToastError({
  message,
  visible,
  onClose,
  autoDismiss = 5000,
  severity = 'error',
}: ToastErrorProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const styles = getSeverityStyles(severity)
  const IconComponent = styles.IconComponent

  // Auto-dismiss
  if (visible && autoDismiss > 0) {
    setTimeout(onClose, autoDismiss)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn('fixed bottom-4 z-50', isRTL ? 'start-4' : 'end-4', 'max-w-sm w-full')}
          dir={isRTL ? 'rtl' : 'ltr'}
          role="alert"
        >
          <div
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border',
              styles.container,
            )}
          >
            <IconComponent className={cn('h-5 w-5 shrink-0', styles.icon)} />
            <p className={cn('flex-1 text-sm', styles.text)}>{message}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default InlineError
