import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { RotateCcw, X, Loader2 } from 'lucide-react'
import type { BulkActionType } from '@/types/bulk-actions.types'
import { cn } from '@/lib/utils'

export interface UndoToastProps {
  /** Whether toast is visible */
  visible: boolean
  /** Action that was performed */
  action: BulkActionType
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
}

/**
 * UndoToast - Toast notification with undo capability
 *
 * Features:
 * - Countdown timer visualization
 * - Progress bar showing remaining time
 * - One-click undo functionality
 * - Auto-dismiss after TTL expires
 * - Mobile-first responsive design
 * - RTL support
 */
export function UndoToast({
  visible,
  action,
  itemCount,
  undoTtl,
  onUndo,
  onDismiss,
  className,
}: UndoToastProps) {
  const { t, i18n } = useTranslation('bulk-actions')
  const isRTL = i18n.language === 'ar'

  const [remainingTime, setRemainingTime] = useState(undoTtl)
  const [isUndoing, setIsUndoing] = useState(false)

  // Calculate progress percentage
  const progressPercent = (remainingTime / undoTtl) * 100
  const remainingSeconds = Math.ceil(remainingTime / 1000)

  // Countdown timer
  useEffect(() => {
    if (!visible) {
      setRemainingTime(undoTtl)
      return
    }

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 100
        if (newTime <= 0) {
          clearInterval(interval)
          onDismiss()
          return 0
        }
        return newTime
      })
    }, 100)

    return () => clearInterval(interval)
  }, [visible, undoTtl, onDismiss])

  // Reset remaining time when toast becomes visible
  useEffect(() => {
    if (visible) {
      setRemainingTime(undoTtl)
      setIsUndoing(false)
    }
  }, [visible, undoTtl])

  // Handle undo click
  const handleUndo = useCallback(async () => {
    setIsUndoing(true)
    try {
      await onUndo()
    } finally {
      setIsUndoing(false)
    }
  }, [onUndo])

  // Get action label
  const actionLabel = t(`actions.${action.replace(/-/g, '')}`)

  if (!visible) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 start-4 end-4 sm:start-auto sm:end-4 sm:w-96',
        'z-50 animate-in slide-in-from-bottom-4 fade-in-0',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="alert"
      aria-live="polite"
    >
      <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg shadow-lg overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-700 dark:bg-gray-300">
          <div
            className="h-full bg-blue-500 transition-all duration-100 ease-linear"
            style={{
              width: `${progressPercent}%`,
              transformOrigin: isRTL ? 'right' : 'left',
            }}
          />
        </div>

        {/* Content */}
        <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {t('undo.message', {
                action: actionLabel,
                count: itemCount,
              })}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600">
              {t('undo.timeRemaining', { seconds: remainingSeconds })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleUndo}
              disabled={isUndoing}
              className="h-8 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isUndoing ? (
                <>
                  <Loader2 className="h-4 w-4 me-1 animate-spin" />
                  {t('undo.undoing')}
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 me-1" />
                  {t('undo.undo')}
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              disabled={isUndoing}
              className="h-8 w-8 text-gray-400 hover:text-white dark:text-gray-600 dark:hover:text-gray-900"
              aria-label={t('accessibility.closeDialog')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UndoToast
