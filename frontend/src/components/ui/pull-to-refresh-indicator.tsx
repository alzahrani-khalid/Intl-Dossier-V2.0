/**
 * PullToRefreshIndicator Component
 *
 * Visual feedback component for pull-to-refresh gesture.
 * Features:
 * - Animated pull indicator with progress ring
 * - Last sync timestamp display
 * - Items synced count
 * - Offline queue status badge
 * - Mobile-first design
 * - RTL support with logical properties
 *
 * @example
 * <PullToRefreshIndicator
 *   pullDistance={pullDistance}
 *   progress={progress}
 *   status={status}
 *   lastSyncTime={lastSyncTime}
 *   itemsSynced={itemCount}
 *   offlineQueueCount={5}
 * />
 */

import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Check, WifiOff, Clock, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PullToRefreshState } from '@/hooks/usePullToRefresh'

export interface PullToRefreshIndicatorProps {
  /** Current pull distance in pixels */
  pullDistance: number
  /** Progress percentage (0-1) */
  progress: number
  /** Current pull-to-refresh state */
  status: PullToRefreshState
  /** Last sync timestamp (ISO string or Date) */
  lastSyncTime?: string | Date | null
  /** Number of items synced in last refresh */
  itemsSynced?: number
  /** Number of items waiting in offline queue */
  offlineQueueCount?: number
  /** Additional class names */
  className?: string
}

export function PullToRefreshIndicator({
  pullDistance,
  progress,
  status,
  lastSyncTime,
  itemsSynced,
  offlineQueueCount = 0,
  className,
}: PullToRefreshIndicatorProps) {
  const { t, i18n } = useTranslation('common')
  const isRTL = i18n.language === 'ar'

  // Format relative time
  const formatLastSync = (time: string | Date | null | undefined) => {
    if (!time) return null

    const date = new Date(time)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)

    if (diffSeconds < 60) {
      return t('pullToRefresh.justNow', 'Just now')
    } else if (diffMinutes < 60) {
      return t('pullToRefresh.minutesAgo', '{{count}}m ago', { count: diffMinutes })
    } else if (diffHours < 24) {
      return t('pullToRefresh.hoursAgo', '{{count}}h ago', { count: diffHours })
    } else {
      return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  // Calculate indicator visibility and position
  const isVisible = pullDistance > 10 || status === 'refreshing' || status === 'complete'
  const indicatorHeight = Math.min(pullDistance, 80)

  // SVG ring progress
  const ringRadius = 16
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference * (1 - progress)

  // Status-specific content
  const getStatusContent = () => {
    switch (status) {
      case 'pulling':
        return {
          text: t('pullToRefresh.pullToRefresh', 'Pull to refresh'),
          icon: RefreshCw,
          iconClass: '',
        }
      case 'ready':
        return {
          text: t('pullToRefresh.releaseToRefresh', 'Release to refresh'),
          icon: RefreshCw,
          iconClass: 'text-primary',
        }
      case 'refreshing':
        return {
          text: t('pullToRefresh.refreshing', 'Refreshing...'),
          icon: RefreshCw,
          iconClass: 'animate-spin text-primary',
        }
      case 'complete':
        return {
          text:
            itemsSynced !== undefined
              ? t('pullToRefresh.updatedItems', 'Updated {{count}} items', { count: itemsSynced })
              : t('pullToRefresh.updated', 'Updated'),
          icon: Check,
          iconClass: 'text-green-500',
        }
      default:
        return {
          text: '',
          icon: RefreshCw,
          iconClass: '',
        }
    }
  }

  const statusContent = getStatusContent()
  const StatusIcon = statusContent.icon

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: status === 'refreshing' || status === 'complete' ? 80 : indicatorHeight,
            opacity: 1,
          }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={cn(
            'flex flex-col items-center justify-center overflow-hidden',
            'bg-gradient-to-b from-muted/50 to-transparent',
            className,
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Main indicator */}
          <div className="flex items-center gap-3">
            {/* Progress ring with icon */}
            <div className="relative flex h-10 w-10 items-center justify-center">
              {/* Background ring */}
              <svg className="absolute h-10 w-10 -rotate-90" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r={ringRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted-foreground/20"
                />
                {/* Progress ring */}
                <motion.circle
                  cx="20"
                  cy="20"
                  r={ringRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="text-primary"
                  strokeDasharray={ringCircumference}
                  initial={{ strokeDashoffset: ringCircumference }}
                  animate={{ strokeDashoffset: ringOffset }}
                  transition={{ duration: 0.1 }}
                />
              </svg>
              {/* Icon */}
              <StatusIcon className={cn('h-4 w-4', statusContent.iconClass)} />
            </div>

            {/* Status text */}
            <div className="flex flex-col">
              <motion.span
                key={status}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="text-sm font-medium text-foreground"
              >
                {statusContent.text}
              </motion.span>

              {/* Last sync time */}
              {lastSyncTime && status !== 'refreshing' && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatLastSync(lastSyncTime)}
                </span>
              )}
            </div>
          </div>

          {/* Offline queue badge */}
          {offlineQueueCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2 flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 dark:bg-amber-900/30"
            >
              <WifiOff className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                {t('pullToRefresh.offlineQueue', '{{count}} pending sync', {
                  count: offlineQueueCount,
                })}
              </span>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Compact sync status bar for list headers
 */
export interface SyncStatusBarProps {
  /** Last sync timestamp */
  lastSyncTime?: string | Date | null
  /** Number of items in current view */
  itemCount?: number
  /** Whether currently syncing */
  isSyncing?: boolean
  /** Number of items in offline queue */
  offlineQueueCount?: number
  /** Additional class names */
  className?: string
}

export function SyncStatusBar({
  lastSyncTime,
  itemCount,
  isSyncing = false,
  offlineQueueCount = 0,
  className,
}: SyncStatusBarProps) {
  const { t, i18n } = useTranslation('common')
  const isRTL = i18n.language === 'ar'

  // Format relative time
  const formatTime = (time: string | Date | null | undefined) => {
    if (!time) return t('pullToRefresh.neverSynced', 'Never synced')

    const date = new Date(time)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)

    if (diffSeconds < 60) {
      return t('pullToRefresh.justNow', 'Just now')
    } else if (diffMinutes < 60) {
      return t('pullToRefresh.minutesAgo', '{{count}}m ago', { count: diffMinutes })
    } else {
      return date.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 px-4 py-2',
        'border-b border-border/50 bg-muted/30',
        'text-xs text-muted-foreground',
        className,
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Left side - item count */}
      <div className="flex items-center gap-1.5">
        <Package className="h-3 w-3" />
        <span>
          {itemCount !== undefined
            ? t('pullToRefresh.itemCount', '{{count}} items', { count: itemCount })
            : t('pullToRefresh.loading', 'Loading...')}
        </span>
      </div>

      {/* Right side - sync status */}
      <div className="flex items-center gap-2">
        {/* Offline queue indicator */}
        {offlineQueueCount > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 dark:bg-amber-900/30">
            <WifiOff className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span className="text-amber-700 dark:text-amber-300">{offlineQueueCount}</span>
          </div>
        )}

        {/* Sync status */}
        <div className="flex items-center gap-1">
          {isSyncing ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>{t('pullToRefresh.syncing', 'Syncing...')}</span>
            </>
          ) : (
            <>
              <Clock className="h-3 w-3" />
              <span>{formatTime(lastSyncTime)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PullToRefreshIndicator
