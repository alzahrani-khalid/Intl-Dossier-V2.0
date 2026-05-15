/**
 * FormDraftBanner Component
 *
 * Displays a banner when a saved draft is detected with options to:
 * - Restore the draft and continue where user left off
 * - Discard the draft and start fresh
 * - Dismiss the banner temporarily
 *
 * Features:
 * - Mobile-first, RTL-compatible layout
 * - Animated appearance
 * - Touch-friendly buttons (44x44px)
 * - Shows when draft was saved
 *
 * @module components/form-auto-save/FormDraftBanner
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { m, AnimatePresence } from 'framer-motion'
import { FileText, RotateCcw, Trash2, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import type { FormDraftBannerProps } from '@/types/form-auto-save.types'
import { useDirection } from '@/hooks/useDirection'

export function FormDraftBanner({
  draft,
  onRestore,
  onDismiss,
  onDiscard,
  isRestoring = false,
  className,
}: FormDraftBannerProps) {
  const { t } = useTranslation('form-auto-save')
  const { isRTL } = useDirection()
  // Format the saved time relative to now
  const savedTimeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(draft.savedAt), {
        addSuffix: true,
        locale: isRTL ? ar : enUS,
      })
    } catch {
      return t('banner.recently')
    }
  }, [draft.savedAt, isRTL, t])

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          'overflow-hidden rounded-lg border bg-warning/10 border-warning/30 dark:bg-warning/20 dark:border-warning',
          className,
        )}
        role="alert"
        aria-live="polite"
      >
        <div className="p-4 sm:p-5">
          {/* Header with icon and dismiss button */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-2 rounded-full bg-warning/10 dark:bg-warning/30">
                <FileText className="size-5 text-warning dark:text-warning" />
              </div>
              <div>
                <h3 className="font-medium text-warning dark:text-warning">{t('banner.title')}</h3>
                <p className="text-sm text-warning dark:text-warning mt-0.5">
                  {t('banner.savedTime', { time: savedTimeAgo })}
                </p>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              type="button"
              onClick={onDismiss}
              className="min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-warning/10 dark:hover:bg-warning/30 transition-colors"
              aria-label={t('banner.dismiss')}
            >
              <X className="size-5 text-warning dark:text-warning" />
            </button>
          </div>

          {/* Progress info */}
          <div className="flex items-center gap-4 mb-4 text-sm text-warning dark:text-warning">
            <span>{t('banner.progress', { percentage: draft.progress })}</span>
            {typeof draft.currentStep === 'number' && typeof draft.totalSteps === 'number' && (
              <span>
                {t('banner.stepInfo', {
                  current: draft.currentStep + 1,
                  total: draft.totalSteps,
                })}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Restore button - primary action */}
            <Button
              type="button"
              onClick={onRestore}
              disabled={isRestoring}
              className="min-h-11 flex-1 bg-warning hover:bg-warning text-white"
            >
              {isRestoring ? (
                <Loader2 className="size-4 me-2 animate-spin" />
              ) : (
                <RotateCcw className="size-4 me-2" />
              )}
              {isRestoring ? t('banner.restoring') : t('banner.restore')}
            </Button>

            {/* Discard button - destructive action */}
            <Button
              type="button"
              variant="outline"
              onClick={onDiscard}
              disabled={isRestoring}
              className="min-h-11 border-warning/30 text-warning hover:bg-warning/10 dark:border-warning dark:text-warning dark:hover:bg-warning/30"
            >
              <Trash2 className="size-4 me-2" />
              {t('banner.discard')}
            </Button>
          </div>
        </div>
      </m.div>
    </AnimatePresence>
  )
}
