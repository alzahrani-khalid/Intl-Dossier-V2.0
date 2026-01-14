/**
 * ActionableErrorSummary Component
 * Displays a summary of all form errors with actionable fix buttons
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { XCircle, ChevronDown, ChevronUp, Wand2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  ActionableErrorSummaryProps,
  ActionableError,
  ErrorAction,
} from '@/types/actionable-error.types'

// =============================================================================
// ERROR ITEM COMPONENT
// =============================================================================

interface ErrorItemProps {
  error: ActionableError
  onAction: (action: ErrorAction) => void
  onFieldFocus: () => void
  isRTL: boolean
  index: number
}

function ErrorItem({ error, onAction, onFieldFocus, isRTL, index }: ErrorItemProps) {
  const { t } = useTranslation('actionable-errors')

  const primaryAction = error.actions.find((a) => a.primary) || error.actions[0]

  const severityColors = {
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-400',
    info: 'text-blue-600 dark:text-blue-400',
  }

  return (
    <motion.li
      initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-3 py-2"
    >
      {/* Field link */}
      <button
        type="button"
        onClick={onFieldFocus}
        className={cn(
          'flex-1 text-start text-sm hover:underline underline-offset-2',
          'flex items-start gap-2 min-w-0',
          severityColors[error.severity],
        )}
      >
        {error.fieldName && (
          <span className="font-medium shrink-0">
            {t(`fields.${error.fieldName}`, error.fieldName)}:
          </span>
        )}
        <span className="truncate">{t(error.titleKey, error.params)}</span>
      </button>

      {/* Quick fix button */}
      {primaryAction && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onAction(primaryAction)}
          className={cn(
            'h-7 px-2 text-xs shrink-0',
            'bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900',
            'text-red-700 dark:text-red-300',
          )}
        >
          <Wand2 className="h-3 w-3 me-1" />
          <span className="hidden sm:inline">{t(primaryAction.labelKey)}</span>
          <span className="sm:hidden">{t('fix')}</span>
        </Button>
      )}
    </motion.li>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ActionableErrorSummary({
  errors,
  onAction,
  onFieldFocus,
  onFixAll,
  maxVisible = 3,
  className,
}: ActionableErrorSummaryProps) {
  const { t, i18n } = useTranslation('actionable-errors')
  const isRTL = i18n.language === 'ar'

  const [isExpanded, setIsExpanded] = useState(false)

  // Filter to only show actual errors (not warnings/info)
  const errorItems = useMemo(() => errors.filter((e) => e.severity === 'error'), [errors])

  const warningItems = useMemo(() => errors.filter((e) => e.severity === 'warning'), [errors])

  // Get auto-fixable errors
  const autoFixableErrors = useMemo(
    () =>
      errorItems.filter((e) =>
        e.actions.some((a) => a.type === 'auto_fix' || a.type === 'suggest_value'),
      ),
    [errorItems],
  )

  const visibleErrors = isExpanded ? errorItems : errorItems.slice(0, maxVisible)
  const hasMoreErrors = errorItems.length > maxVisible

  if (errorItems.length === 0 && warningItems.length === 0) {
    return null
  }

  const handleAction = (errorCode: string, action: ErrorAction) => {
    onAction?.(errorCode, action)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'rounded-lg border',
        'bg-red-50 dark:bg-red-950/30',
        'border-red-200 dark:border-red-800',
        'p-4 sm:p-5',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="alert"
      aria-labelledby="error-summary-title"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3
              id="error-summary-title"
              className="font-medium text-red-800 dark:text-red-200 text-sm sm:text-base"
            >
              {t('summary.title', { count: errorItems.length })}
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 opacity-80 mt-1">
              {t('summary.description')}
            </p>
          </div>
        </div>

        {/* Fix All button - only if there are auto-fixable errors */}
        {autoFixableErrors.length > 1 && onFixAll && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onFixAll}
            className={cn('shrink-0 gap-2', 'bg-red-600 hover:bg-red-700 text-white')}
          >
            <Wand2 className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t('fixAll', { count: autoFixableErrors.length })}
            </span>
            <span className="sm:hidden">{t('fixAll.short')}</span>
          </Button>
        )}
      </div>

      {/* Error list */}
      <ul className="mt-4 divide-y divide-red-200 dark:divide-red-800">
        <AnimatePresence mode="popLayout">
          {visibleErrors.map((error, index) => (
            <ErrorItem
              key={error.code}
              error={error}
              onAction={(action) => handleAction(error.code, action)}
              onFieldFocus={() => error.fieldName && onFieldFocus?.(error.fieldName)}
              isRTL={isRTL}
              index={index}
            />
          ))}
        </AnimatePresence>
      </ul>

      {/* Show more/less button */}
      {hasMoreErrors && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'w-full mt-2 text-red-700 dark:text-red-300',
            'hover:bg-red-100 dark:hover:bg-red-900/50',
          )}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 me-1" />
              {t('showLess')}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 me-1" />
              {t('showMore', { count: errorItems.length - maxVisible })}
            </>
          )}
        </Button>
      )}

      {/* Warnings section */}
      {warningItems.length > 0 && (
        <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{t('warnings.count', { count: warningItems.length })}</span>
          </div>
        </div>
      )}

      {/* Success state when all fixed */}
      {errorItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">{t('allFixed')}</span>
        </motion.div>
      )}
    </motion.div>
  )
}

export default ActionableErrorSummary
