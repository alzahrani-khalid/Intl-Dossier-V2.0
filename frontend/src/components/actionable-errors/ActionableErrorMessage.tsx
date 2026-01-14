/**
 * ActionableErrorMessage Component
 * Displays an error with specific guidance and one-click fix buttons
 */

import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import {
  XCircle,
  AlertCircle,
  Info,
  X,
  Wand2,
  Copy,
  ExternalLink,
  RotateCcw,
  Lightbulb,
  MousePointerClick,
  Headphones,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  ActionableErrorMessageProps,
  ErrorAction,
  ErrorActionType,
} from '@/types/actionable-error.types'
import { useState, useCallback } from 'react'

// =============================================================================
// ICON MAPPING
// =============================================================================

const actionIcons: Record<ErrorActionType, React.ComponentType<{ className?: string }>> = {
  auto_fix: Wand2,
  suggest_value: Lightbulb,
  focus_field: MousePointerClick,
  copy_correct: Copy,
  open_modal: ExternalLink,
  navigate: ExternalLink,
  retry: RotateCcw,
  contact_support: Headphones,
  dismiss: X,
}

// =============================================================================
// SEVERITY STYLES
// =============================================================================

const severityStyles = {
  error: {
    container: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    icon: 'text-red-500',
    text: 'text-red-800 dark:text-red-200',
    button:
      'bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 text-red-700 dark:text-red-300',
    primaryButton: 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white',
  },
  warning: {
    container: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    icon: 'text-amber-500',
    text: 'text-amber-800 dark:text-amber-200',
    button:
      'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300',
    primaryButton:
      'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 text-white',
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500',
    text: 'text-blue-800 dark:text-blue-200',
    button:
      'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300',
    primaryButton:
      'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white',
  },
}

const severityIcons = {
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

// =============================================================================
// ACTION BUTTON COMPONENT
// =============================================================================

interface ActionButtonProps {
  action: ErrorAction
  severity: 'error' | 'warning' | 'info'
  onClick: () => void
  isRTL: boolean
  compact?: boolean
  isExecuting?: boolean
  isCompleted?: boolean
}

function ActionButton({
  action,
  severity,
  onClick,
  isRTL,
  compact = false,
  isExecuting = false,
  isCompleted = false,
}: ActionButtonProps) {
  const { t } = useTranslation('actionable-errors')
  const styles = severityStyles[severity]

  const IconComponent = action.icon
    ? actionIcons[action.type] || Wand2
    : actionIcons[action.type] || Wand2

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
    >
      <Button
        type="button"
        variant="ghost"
        size={compact ? 'sm' : 'default'}
        onClick={onClick}
        disabled={isExecuting || isCompleted}
        className={cn(
          'min-h-9 min-w-9 gap-2',
          action.primary ? styles.primaryButton : styles.button,
          compact && 'h-8 px-2 text-xs',
          isCompleted && 'opacity-60',
        )}
      >
        {isExecuting ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <RotateCcw className="h-4 w-4" />
          </motion.div>
        ) : isCompleted ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <IconComponent className="h-4 w-4" />
        )}
        <span className={compact ? 'hidden sm:inline' : ''}>{t(action.labelKey)}</span>
        {action.primary && !compact && (
          <ChevronRight className={cn('h-3 w-3', isRTL && 'rotate-180')} />
        )}
      </Button>
    </motion.div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ActionableErrorMessage({
  error,
  onAction,
  onDismiss,
  compact = false,
  className,
}: ActionableErrorMessageProps) {
  const { t, i18n } = useTranslation('actionable-errors')
  const isRTL = i18n.language === 'ar'

  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set())
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())

  const styles = severityStyles[error.severity]
  const SeverityIcon = severityIcons[error.severity]

  // Get visible actions (filter by mobile if needed)
  const visibleActions = error.actions.filter((action) => action.showOnMobile !== false || !compact)

  // Primary action comes first
  const sortedActions = [...visibleActions].sort((a, b) => {
    if (a.primary && !b.primary) return -1
    if (!a.primary && b.primary) return 1
    return 0
  })

  const handleAction = useCallback(
    async (action: ErrorAction) => {
      setExecutingActions((prev) => new Set([...prev, action.id]))

      try {
        // Simulate async action
        await new Promise((resolve) => setTimeout(resolve, 300))
        onAction?.(action)
        setCompletedActions((prev) => new Set([...prev, action.id]))

        // Clear completed state after animation
        setTimeout(() => {
          setCompletedActions((prev) => {
            const next = new Set(prev)
            next.delete(action.id)
            return next
          })
        }, 1500)
      } finally {
        setExecutingActions((prev) => {
          const next = new Set(prev)
          next.delete(action.id)
          return next
        })
      }
    },
    [onAction],
  )

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={error.code}
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.2 }}
        className={cn('overflow-hidden', className)}
        dir={isRTL ? 'rtl' : 'ltr'}
        role="alert"
        aria-live="polite"
      >
        <div className={cn('rounded-lg border p-3 sm:p-4', styles.container)}>
          {/* Header with icon, title, and dismiss */}
          <div className="flex items-start gap-3">
            <SeverityIcon
              className={cn('h-5 w-5 shrink-0 mt-0.5', styles.icon)}
              aria-hidden="true"
            />

            <div className="flex-1 min-w-0">
              {/* Title */}
              <h4 className={cn('font-medium text-sm sm:text-base', styles.text)}>
                {t(error.titleKey, error.params)}
              </h4>

              {/* Message */}
              {!compact && (
                <p className={cn('mt-1 text-sm opacity-80', styles.text)}>
                  {t(error.messageKey, error.params)}
                </p>
              )}

              {/* Actions */}
              {sortedActions.length > 0 && (
                <div className={cn('mt-3 flex flex-wrap gap-2', compact && 'mt-2')}>
                  {sortedActions.map((action) => (
                    <ActionButton
                      key={action.id}
                      action={action}
                      severity={error.severity}
                      onClick={() => handleAction(action)}
                      isRTL={isRTL}
                      compact={compact}
                      isExecuting={executingActions.has(action.id)}
                      isCompleted={completedActions.has(action.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Dismiss button */}
            {error.dismissible && onDismiss && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className={cn('h-8 w-8 shrink-0 opacity-60 hover:opacity-100', styles.text)}
                aria-label={t('dismiss')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ActionableErrorMessage
