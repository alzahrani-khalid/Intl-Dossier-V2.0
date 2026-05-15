/**
 * ActionableErrorMessage Component
 * Displays an error with specific guidance and one-click fix buttons
 */

import { useTranslation } from 'react-i18next'
import { m, AnimatePresence } from 'motion/react'
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
import { useDirection } from '@/hooks/useDirection'

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
    container: 'bg-danger/10 dark:bg-danger/30 border-danger/30 dark:border-danger',
    icon: 'text-danger',
    text: 'text-danger dark:text-danger',
    button:
      'bg-danger/10 hover:bg-danger/10 dark:bg-danger/50 dark:hover:bg-danger text-danger dark:text-danger',
    primaryButton: 'bg-danger hover:bg-danger dark:bg-danger dark:hover:bg-danger text-white',
  },
  warning: {
    container: 'bg-warning/10 dark:bg-warning/30 border-warning/30 dark:border-warning',
    icon: 'text-warning',
    text: 'text-warning dark:text-warning',
    button:
      'bg-warning/10 hover:bg-warning/10 dark:bg-warning/50 dark:hover:bg-warning text-warning dark:text-warning',
    primaryButton: 'bg-warning hover:bg-warning dark:bg-warning dark:hover:bg-warning text-white',
  },
  info: {
    container: 'bg-info/10 dark:bg-info/30 border-info/30 dark:border-info',
    icon: 'text-info',
    text: 'text-info dark:text-info',
    button:
      'bg-info/10 hover:bg-info/10 dark:bg-info/50 dark:hover:bg-info text-info dark:text-info',
    primaryButton: 'bg-info hover:bg-info dark:bg-info dark:hover:bg-info text-white',
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
    <m.div
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
          <m.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <RotateCcw className="h-4 w-4" />
          </m.div>
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
    </m.div>
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
  const { t } = useTranslation('actionable-errors')
  const { isRTL } = useDirection()
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
      <m.div
        key={error.code}
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.2 }}
        className={cn('overflow-hidden', className)}
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
      </m.div>
    </AnimatePresence>
  )
}
