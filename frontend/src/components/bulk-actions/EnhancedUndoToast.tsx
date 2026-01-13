import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { RotateCcw, X, Loader2, CheckCircle, Clock } from 'lucide-react'
import type { BulkActionType, BulkActionEntityType } from '@/types/bulk-actions.types'
import { cn } from '@/lib/utils'

export interface EnhancedUndoToastProps {
  /** Whether toast is visible */
  visible: boolean
  /** Action that was performed */
  action: BulkActionType
  /** Entity type affected (reserved for future use) */
  entityType?: BulkActionEntityType
  /** Number of items affected */
  itemCount: number
  /** Total time for undo (ms) */
  undoTtl: number
  /** Callback to undo the action */
  onUndo: () => Promise<void>
  /** Callback when toast is dismissed */
  onDismiss: () => void
  /** Additional CSS classes */
  className?: string
  /** Show success message briefly before countdown */
  showSuccessFirst?: boolean
}

/**
 * EnhancedUndoToast - Improved toast with countdown timer and immediate undo
 *
 * Features:
 * - Circular countdown timer visualization
 * - Success state animation before countdown
 * - Prominent undo button with keyboard shortcut hint
 * - Countdown timer in seconds
 * - Progress bar visualization
 * - Mobile-first responsive design
 * - RTL support
 * - Pause countdown on hover (optional)
 */
export function EnhancedUndoToast({
  visible,
  action,
  entityType: _entityType = 'entity',
  itemCount,
  undoTtl,
  onUndo,
  onDismiss,
  className,
  showSuccessFirst = true,
}: EnhancedUndoToastProps) {
  // entityType is kept for future use in custom messages
  void _entityType
  const { t, i18n } = useTranslation('bulk-actions')
  const isRTL = i18n.language === 'ar'

  const [remainingTime, setRemainingTime] = useState(undoTtl)
  const [isUndoing, setIsUndoing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(showSuccessFirst)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate progress percentage
  const progressPercent = (remainingTime / undoTtl) * 100
  const remainingSeconds = Math.ceil(remainingTime / 1000)

  // Calculate stroke dash for circular progress
  const circumference = 2 * Math.PI * 18 // radius = 18
  const strokeDashoffset = circumference * (1 - remainingTime / undoTtl)

  // Get urgency level for styling
  const urgencyLevel =
    remainingSeconds <= 5 ? 'urgent' : remainingSeconds <= 10 ? 'warning' : 'normal'

  // Reset state when toast becomes visible
  useEffect(() => {
    if (visible) {
      setRemainingTime(undoTtl)
      setIsUndoing(false)
      setShowSuccess(showSuccessFirst)
      setIsPaused(false)

      // Show success briefly before starting countdown
      if (showSuccessFirst) {
        const successTimeout = setTimeout(() => {
          setShowSuccess(false)
        }, 1000)
        return () => clearTimeout(successTimeout)
      }
    }
    return undefined
  }, [visible, undoTtl, showSuccessFirst])

  // Countdown timer
  useEffect(() => {
    if (!visible || showSuccess || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 100
        if (newTime <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
          onDismiss()
          return 0
        }
        return newTime
      })
    }, 100)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [visible, showSuccess, isPaused, onDismiss])

  // Handle undo click
  const handleUndo = useCallback(async () => {
    setIsUndoing(true)
    setIsPaused(true)
    try {
      await onUndo()
    } finally {
      setIsUndoing(false)
    }
  }, [onUndo])

  // Handle keyboard shortcut (Ctrl/Cmd + Z)
  useEffect(() => {
    if (!visible || isUndoing) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible, isUndoing, handleUndo])

  // Get action label
  const actionLabel = t(`actions.${action.replace(/-/g, '')}`)

  if (!visible) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 start-4 end-4 sm:start-auto sm:end-4 sm:w-[420px]',
        'z-50 animate-in slide-in-from-bottom-4 fade-in-0 duration-300',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => !showSuccess && setIsPaused(true)}
      onMouseLeave={() => !showSuccess && setIsPaused(false)}
    >
      <div
        className={cn(
          'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg shadow-2xl overflow-hidden',
          'border border-gray-700 dark:border-gray-300',
        )}
      >
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-700 dark:bg-gray-300">
          <div
            className={cn(
              'h-full transition-all duration-100 ease-linear',
              urgencyLevel === 'urgent' && 'bg-red-500 animate-pulse',
              urgencyLevel === 'warning' && 'bg-yellow-500',
              urgencyLevel === 'normal' && 'bg-blue-500',
            )}
            style={{
              width: `${progressPercent}%`,
              transformOrigin: isRTL ? 'right' : 'left',
            }}
          />
        </div>

        {/* Content */}
        <div className="flex items-center gap-3 p-4">
          {/* Circular timer or success icon */}
          <div className="relative shrink-0">
            {showSuccess ? (
              <div className="w-12 h-12 flex items-center justify-center bg-green-500/20 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-500 animate-in zoom-in-50 duration-300" />
              </div>
            ) : (
              <div className="w-12 h-12 flex items-center justify-center">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                  {/* Background circle */}
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-gray-700 dark:text-gray-300"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className={cn(
                      'transition-all duration-100',
                      urgencyLevel === 'urgent' && 'text-red-500',
                      urgencyLevel === 'warning' && 'text-yellow-500',
                      urgencyLevel === 'normal' && 'text-blue-500',
                    )}
                    style={{
                      stroke: 'currentColor',
                      strokeDasharray: circumference,
                      strokeDashoffset: strokeDashoffset,
                    }}
                  />
                </svg>
                {/* Center text */}
                <span
                  className={cn(
                    'absolute inset-0 flex items-center justify-center text-sm font-bold',
                    urgencyLevel === 'urgent' && 'text-red-500 animate-pulse',
                  )}
                >
                  {remainingSeconds}
                </span>
              </div>
            )}
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {showSuccess
                ? t('result.success', {
                    action: actionLabel.toLowerCase(),
                    count: itemCount,
                  })
                : t('undo.message', {
                    action: actionLabel,
                    count: itemCount,
                  })}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-400 dark:text-gray-600">
                {showSuccess
                  ? t('undo.immediateUndo', { defaultValue: 'Click to undo' })
                  : isPaused
                    ? t('undo.paused', { defaultValue: 'Paused' })
                    : t('undo.countdown', {
                        seconds: remainingSeconds,
                        defaultValue: `${remainingSeconds}s to undo`,
                      })}
              </p>
              {!showSuccess && !isPaused && (
                <Clock className="h-3 w-3 text-gray-500 dark:text-gray-500" />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="default"
              size="sm"
              onClick={handleUndo}
              disabled={isUndoing}
              className={cn(
                'h-9 px-4 font-medium transition-all',
                'bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900',
                urgencyLevel === 'urgent' && 'animate-pulse',
              )}
            >
              {isUndoing ? (
                <>
                  <Loader2 className="h-4 w-4 me-1.5 animate-spin" />
                  {t('undo.undoing')}
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 me-1.5" />
                  {t('undo.undo')}
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              disabled={isUndoing}
              className="h-9 w-9 text-gray-400 hover:text-white dark:text-gray-600 dark:hover:text-gray-900"
              aria-label={t('accessibility.closeDialog')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Keyboard shortcut hint */}
        {!showSuccess && !isUndoing && (
          <div className="px-4 pb-3 -mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {t('undo.keyboardHint', {
                defaultValue: 'Press Ctrl+Z to undo',
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedUndoToast
