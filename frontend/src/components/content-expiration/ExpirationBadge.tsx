/**
 * ExpirationBadge Component
 * Feature: content-expiration-dates
 * Displays the freshness status and expiration information for content
 */

import { useTranslation } from 'react-i18next'
import { Clock, CheckCircle, AlertTriangle, AlertCircle, RefreshCw, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { ContentFreshnessStatus, ExpirationBadgeProps } from '@/types/content-expiration.types'
import { FRESHNESS_STATUS_COLORS } from '@/types/content-expiration.types'

// Icon mapping for status
const STATUS_ICONS = {
  current: CheckCircle,
  review_pending: AlertTriangle,
  outdated: AlertCircle,
  refreshing: RefreshCw,
  archived: Archive,
} as const

export function ExpirationBadge({
  status,
  expiresAt,
  daysUntilExpiration,
  size = 'md',
  showDays = true,
  className,
}: ExpirationBadgeProps) {
  const { t, i18n } = useTranslation('content-expiration')
  const isRTL = i18n.language === 'ar'

  const colors = FRESHNESS_STATUS_COLORS[status]
  const Icon = STATUS_ICONS[status]

  // Calculate days until expiration if not provided
  let days = daysUntilExpiration
  if (days === undefined && expiresAt) {
    const now = new Date()
    const expiry = new Date(expiresAt)
    days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Generate badge text
  const getBadgeText = (): string => {
    if (!showDays) {
      return t(`status.${status}`)
    }

    if (days === undefined) {
      return t('badge.noExpiration')
    }

    if (days > 0) {
      return t('badge.expiresIn', { days })
    } else if (days === 0) {
      return status === 'outdated' ? t('badge.expiredToday') : t('badge.expiresToday')
    } else {
      return t('badge.expired', { days: Math.abs(days) })
    }
  }

  // Size classes
  const sizeClasses = {
    sm: 'h-5 px-1.5 text-xs gap-1',
    md: 'h-6 px-2 text-sm gap-1.5',
    lg: 'h-7 px-2.5 text-sm gap-2',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'inline-flex items-center font-medium border transition-colors',
              colors.bg,
              colors.text,
              colors.border,
              sizeClasses[size],
              className,
            )}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <Icon
              className={cn(
                iconSizes[size],
                colors.icon,
                status === 'refreshing' && 'animate-spin',
              )}
            />
            <span className="truncate">{getBadgeText()}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side={isRTL ? 'left' : 'right'}>
          <p className="font-medium">{t(`status.${status}`)}</p>
          <p className="text-xs text-muted-foreground">{t(`statusDescription.${status}`)}</p>
          {expiresAt && (
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(expiresAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Simple status dot indicator (for compact displays)
export function ExpirationStatusDot({
  status,
  size = 'md',
  className,
}: {
  status: ContentFreshnessStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const { t } = useTranslation('content-expiration')
  const colors = FRESHNESS_STATUS_COLORS[status]

  const dotSizes = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-block rounded-full',
              dotSizes[size],
              colors.bg.replace('bg-', 'bg-'),
              status === 'current' && 'bg-green-500',
              status === 'review_pending' && 'bg-yellow-500',
              status === 'outdated' && 'bg-red-500',
              status === 'refreshing' && 'bg-blue-500 animate-pulse',
              status === 'archived' && 'bg-gray-500',
              className,
            )}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{t(`status.${status}`)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Countdown timer for urgent expirations
export function ExpirationCountdown({
  expiresAt,
  showIcon = true,
  className,
}: {
  expiresAt: string
  showIcon?: boolean
  className?: string
}) {
  const { t, i18n } = useTranslation('content-expiration')
  const isRTL = i18n.language === 'ar'

  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  const isExpired = days <= 0
  const isCritical = days <= 7
  const isWarning = days <= 30

  const getColor = () => {
    if (isExpired) return 'text-red-600 dark:text-red-400'
    if (isCritical) return 'text-orange-600 dark:text-orange-400'
    if (isWarning) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  return (
    <div
      className={cn('inline-flex items-center gap-1.5', getColor(), className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {showIcon && <Clock className="h-4 w-4" />}
      <span className="text-sm font-medium">
        {isExpired ? t('badge.expired', { days: Math.abs(days) }) : t('badge.expiresIn', { days })}
      </span>
    </div>
  )
}

export default ExpirationBadge
