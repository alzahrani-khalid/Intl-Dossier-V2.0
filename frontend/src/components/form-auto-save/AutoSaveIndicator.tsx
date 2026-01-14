/**
 * AutoSaveIndicator Component
 *
 * Displays the current auto-save status with visual feedback:
 * - Saving in progress (spinner)
 * - Last saved timestamp
 * - Error state
 * - Unsaved changes warning
 *
 * Features:
 * - Compact and full modes
 * - Mobile-first, RTL-compatible layout
 * - Animated state transitions
 * - Accessible status announcements
 *
 * @module components/form-auto-save/AutoSaveIndicator
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Cloud, CloudOff, Check, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import type { AutoSaveIndicatorProps } from '@/types/form-auto-save.types'

export function AutoSaveIndicator({ status, className, compact = false }: AutoSaveIndicatorProps) {
  const { t, i18n } = useTranslation('form-auto-save')
  const isRTL = i18n.language === 'ar'

  const { isSaving, hasUnsavedChanges, lastSavedAt, error, isStorageAvailable } = status

  // Format the last saved time
  const lastSavedText = React.useMemo(() => {
    if (!lastSavedAt) return null
    try {
      return formatDistanceToNow(new Date(lastSavedAt), {
        addSuffix: true,
        locale: isRTL ? ar : enUS,
      })
    } catch {
      return t('indicator.recently')
    }
  }, [lastSavedAt, isRTL, t])

  // Determine the current state
  const getState = (): 'saving' | 'saved' | 'unsaved' | 'error' | 'unavailable' => {
    if (!isStorageAvailable) return 'unavailable'
    if (error) return 'error'
    if (isSaving) return 'saving'
    if (hasUnsavedChanges) return 'unsaved'
    if (lastSavedAt) return 'saved'
    return 'unsaved'
  }

  const state = getState()

  // State-specific configurations
  const stateConfig = {
    saving: {
      icon: Loader2,
      iconClass: 'animate-spin text-primary',
      text: t('indicator.saving'),
      containerClass: 'text-muted-foreground',
    },
    saved: {
      icon: Check,
      iconClass: 'text-green-500',
      text: compact ? t('indicator.saved') : t('indicator.savedTime', { time: lastSavedText }),
      containerClass: 'text-green-600 dark:text-green-400',
    },
    unsaved: {
      icon: Cloud,
      iconClass: 'text-muted-foreground',
      text: t('indicator.unsaved'),
      containerClass: 'text-muted-foreground',
    },
    error: {
      icon: AlertCircle,
      iconClass: 'text-red-500',
      text: compact ? t('indicator.error') : t('indicator.errorDetail'),
      containerClass: 'text-red-600 dark:text-red-400',
    },
    unavailable: {
      icon: CloudOff,
      iconClass: 'text-muted-foreground',
      text: t('indicator.unavailable'),
      containerClass: 'text-muted-foreground',
    },
  }

  const config = stateConfig[state]
  const Icon = config.icon

  // Screen reader announcement
  const ariaLive = state === 'error' ? 'assertive' : 'polite'

  if (compact) {
    return (
      <div
        className={cn('flex items-center gap-1.5', className)}
        dir={isRTL ? 'rtl' : 'ltr'}
        role="status"
        aria-live={ariaLive}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center"
          >
            <Icon className={cn('size-4', config.iconClass)} />
          </motion.div>
        </AnimatePresence>
        <span className="sr-only">{config.text}</span>
      </div>
    )
  }

  return (
    <div
      className={cn('flex items-center gap-2 text-sm', config.containerClass, className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="status"
      aria-live={ariaLive}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-2"
        >
          <Icon className={cn('size-4 shrink-0', config.iconClass)} />
          <span className="truncate">{config.text}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default AutoSaveIndicator
