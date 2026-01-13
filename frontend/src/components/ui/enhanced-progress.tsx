/**
 * Enhanced Progress Indicator
 *
 * A comprehensive progress component that shows:
 * - Percentage progress with visual bar
 * - Estimated time remaining (ETA)
 * - Current processing step description
 * - Cancel/pause controls for long operations
 *
 * Mobile-first, RTL-compatible
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, X, Pause, Play, CheckCircle2, AlertCircle, Clock, Info } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export type ProgressStatus =
  | 'idle'
  | 'pending'
  | 'processing'
  | 'paused'
  | 'completed'
  | 'error'
  | 'cancelled'

export interface EnhancedProgressProps {
  /** Current progress percentage (0-100) */
  progress: number
  /** Current status */
  status: ProgressStatus
  /** Title of the operation */
  title?: string
  /** Description of what's currently being processed */
  currentStep?: string
  /** Total items to process */
  totalItems?: number
  /** Items processed so far */
  processedItems?: number
  /** Start time of the operation (for ETA calculation) */
  startTime?: Date
  /** Whether the operation can be cancelled */
  canCancel?: boolean
  /** Whether the operation can be paused */
  canPause?: boolean
  /** Callback when cancel is clicked */
  onCancel?: () => void
  /** Callback when pause/resume is clicked */
  onPauseResume?: () => void
  /** Additional CSS classes */
  className?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show in compact mode */
  compact?: boolean
  /** Custom color for the progress bar */
  color?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

const STATUS_CONFIG = {
  idle: { icon: null, color: 'bg-muted', textColor: 'text-muted-foreground' },
  pending: {
    icon: Loader2,
    color: 'bg-blue-500',
    textColor: 'text-blue-600 dark:text-blue-400',
    animate: true,
  },
  processing: {
    icon: Loader2,
    color: 'bg-blue-500',
    textColor: 'text-blue-600 dark:text-blue-400',
    animate: true,
  },
  paused: { icon: Pause, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
  completed: {
    icon: CheckCircle2,
    color: 'bg-green-500',
    textColor: 'text-green-600 dark:text-green-400',
  },
  error: { icon: AlertCircle, color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400' },
  cancelled: { icon: X, color: 'bg-gray-500', textColor: 'text-gray-600 dark:text-gray-400' },
} as const

const COLOR_CONFIG = {
  default: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
} as const

const SIZE_CONFIG = {
  sm: {
    container: 'p-3',
    title: 'text-sm',
    description: 'text-xs',
    progress: 'h-1.5',
    icon: 'h-4 w-4',
    button: 'h-7 w-7',
  },
  md: {
    container: 'p-4',
    title: 'text-base',
    description: 'text-sm',
    progress: 'h-2',
    icon: 'h-5 w-5',
    button: 'h-8 w-8',
  },
  lg: {
    container: 'p-5 sm:p-6',
    title: 'text-lg',
    description: 'text-base',
    progress: 'h-3',
    icon: 'h-6 w-6',
    button: 'h-10 w-10',
  },
} as const

/**
 * Calculate estimated time remaining
 */
function calculateETA(
  progress: number,
  startTime?: Date,
  processedItems?: number,
  totalItems?: number,
): { eta: string; etaSeconds: number } | null {
  if (!startTime || progress === 0 || progress >= 100) return null

  const elapsed = Date.now() - startTime.getTime()
  let etaMs: number

  if (processedItems !== undefined && totalItems !== undefined && processedItems > 0) {
    // Calculate based on items
    const msPerItem = elapsed / processedItems
    const remainingItems = totalItems - processedItems
    etaMs = msPerItem * remainingItems
  } else {
    // Calculate based on percentage
    const msPerPercent = elapsed / progress
    const remainingPercent = 100 - progress
    etaMs = msPerPercent * remainingPercent
  }

  const etaSeconds = Math.ceil(etaMs / 1000)

  if (etaSeconds < 60) {
    return { eta: `${etaSeconds}s`, etaSeconds }
  } else if (etaSeconds < 3600) {
    const minutes = Math.floor(etaSeconds / 60)
    const seconds = etaSeconds % 60
    return { eta: `${minutes}m ${seconds}s`, etaSeconds }
  } else {
    const hours = Math.floor(etaSeconds / 3600)
    const minutes = Math.floor((etaSeconds % 3600) / 60)
    return { eta: `${hours}h ${minutes}m`, etaSeconds }
  }
}

export function EnhancedProgress({
  progress,
  status,
  title,
  currentStep,
  totalItems,
  processedItems,
  startTime,
  canCancel = false,
  canPause = false,
  onCancel,
  onPauseResume,
  className,
  size = 'md',
  compact = false,
  color = 'default',
}: EnhancedProgressProps) {
  const { t, i18n } = useTranslation('loading')
  const isRTL = i18n.language === 'ar'

  const statusConfig = STATUS_CONFIG[status]
  const sizeConfig = SIZE_CONFIG[size]
  const progressColor = color !== 'default' ? COLOR_CONFIG[color] : statusConfig.color

  const eta = calculateETA(progress, startTime, processedItems, totalItems)
  const isActive = status === 'processing' || status === 'pending'
  const isPaused = status === 'paused'

  const StatusIcon = statusConfig.icon

  if (status === 'idle') {
    return null
  }

  // Compact mode - inline progress bar
  if (compact) {
    return (
      <div
        className={cn('flex items-center gap-2 sm:gap-3', className)}
        dir={isRTL ? 'rtl' : 'ltr'}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={title || t('loading.progress')}
      >
        {StatusIcon && (
          <StatusIcon
            className={cn(
              sizeConfig.icon,
              statusConfig.textColor,
              statusConfig.animate && 'animate-spin',
            )}
          />
        )}
        <div className="flex-1 min-w-0">
          <Progress value={progress} className={cn(sizeConfig.progress)} />
        </div>
        <span className={cn('text-xs tabular-nums shrink-0', statusConfig.textColor)}>
          {progress}%
        </span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn('rounded-lg border bg-card shadow-sm', sizeConfig.container, className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={title || t('loading.progress')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
          {StatusIcon && (
            <div className={cn('shrink-0 mt-0.5', statusConfig.textColor)}>
              <StatusIcon className={cn(sizeConfig.icon, statusConfig.animate && 'animate-spin')} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className={cn('font-medium truncate', sizeConfig.title)}>
              {title || t(`status.${status}`)}
            </h4>
            <AnimatePresence mode="wait">
              {currentStep && (
                <motion.p
                  key={currentStep}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn('text-muted-foreground truncate mt-0.5', sizeConfig.description)}
                >
                  {currentStep}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        {(canPause || canCancel) && isActive && (
          <div className="flex items-center gap-1 shrink-0">
            {canPause && onPauseResume && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPauseResume}
                className={cn(sizeConfig.button, 'rounded-full')}
                aria-label={isPaused ? t('controls.resume') : t('controls.pause')}
              >
                {isPaused ? (
                  <Play className={sizeConfig.icon} />
                ) : (
                  <Pause className={sizeConfig.icon} />
                )}
              </Button>
            )}
            {canCancel && onCancel && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className={cn(
                  sizeConfig.button,
                  'rounded-full text-muted-foreground hover:text-destructive',
                )}
                aria-label={t('controls.cancel')}
              >
                <X className={sizeConfig.icon} />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="relative">
          <Progress
            value={progress}
            className={cn(sizeConfig.progress, 'transition-all duration-300')}
          />
          {/* Animated shimmer effect for active states */}
          {isActive && (
            <div
              className="absolute inset-0 overflow-hidden rounded-full"
              style={{ pointerEvents: 'none' }}
            >
              <div
                className={cn(
                  'absolute inset-0 -translate-x-full animate-shimmer',
                  'bg-gradient-to-r from-transparent via-white/20 to-transparent',
                )}
              />
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-muted-foreground">
            {/* Items count */}
            {totalItems !== undefined && processedItems !== undefined && (
              <span className={cn('tabular-nums', sizeConfig.description)}>
                {processedItems} / {totalItems}
              </span>
            )}

            {/* ETA */}
            {eta && isActive && (
              <span className={cn('flex items-center gap-1', sizeConfig.description)}>
                <Clock className="h-3 w-3" />
                <span className="tabular-nums">{eta.eta}</span>
              </span>
            )}
          </div>

          {/* Percentage */}
          <span
            className={cn(
              'tabular-nums font-medium',
              sizeConfig.description,
              statusConfig.textColor,
            )}
          >
            {progress}%
          </span>
        </div>
      </div>

      {/* Status message for completed/error states */}
      {(status === 'completed' || status === 'error' || status === 'cancelled') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={cn(
            'mt-3 pt-3 border-t flex items-center gap-2',
            sizeConfig.description,
            statusConfig.textColor,
          )}
        >
          <Info className="h-3 w-3 shrink-0" />
          <span>{t(`statusMessage.${status}`)}</span>
        </motion.div>
      )}
    </motion.div>
  )
}

export default EnhancedProgress
