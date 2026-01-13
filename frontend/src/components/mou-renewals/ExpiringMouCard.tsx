/**
 * ExpiringMouCard Component
 * Feature: commitment-renewal-workflow
 *
 * Displays an expiring MoU with urgency indicator, renewal status, and actions.
 * Mobile-first, RTL-aware design.
 */

import { useTranslation } from 'react-i18next'
import { format, differenceInDays } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
  Calendar,
  Clock,
  AlertTriangle,
  Building2,
  RefreshCw,
  ChevronRight,
  Bell,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

import {
  type ExpiringMou,
  getExpiryUrgency,
  RENEWAL_STATUS_COLORS,
} from '@/types/mou-renewal.types'

interface ExpiringMouCardProps {
  mou: ExpiringMou
  onInitiateRenewal?: (mouId: string) => void
  onViewDetails?: (mouId: string) => void
  onViewRenewal?: (renewalId: string) => void
  compact?: boolean
}

export function ExpiringMouCard({
  mou,
  onInitiateRenewal,
  onViewDetails,
  onViewRenewal,
  compact = false,
}: ExpiringMouCardProps) {
  const { t, i18n } = useTranslation('mou-renewals')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  // Determine title based on language
  const title = isRTL ? mou.title_ar : mou.title_en

  // Get urgency level and colors
  const urgency = getExpiryUrgency(mou.days_until_expiry)
  const renewalStatusColors = mou.renewal_status ? RENEWAL_STATUS_COLORS[mou.renewal_status] : null

  // Calculate expiry progress (inverse - fills as time runs out)
  const totalDays = 90 // Assuming 90 day window for alerts
  const daysRemaining = Math.max(0, mou.days_until_expiry)
  const progressValue = Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100))

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md',
        urgency.level === 'expired' && 'border-red-300 dark:border-red-800',
        urgency.level === 'critical' && 'border-red-200 dark:border-red-900',
        urgency.level === 'high' && 'border-orange-200 dark:border-orange-900',
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <CardHeader className={cn('pb-2', compact && 'p-3 pb-1')}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2">
            {/* Urgency indicator */}
            <div
              className={cn(
                'mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                urgency.color.bg,
              )}
            >
              {urgency.level === 'expired' || urgency.level === 'critical' ? (
                <AlertTriangle className={cn('h-4 w-4', urgency.color.text)} />
              ) : (
                <Clock className={cn('h-4 w-4', urgency.color.text)} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <CardTitle
                className={cn(
                  'line-clamp-2 text-sm font-semibold sm:text-base',
                  compact && 'text-sm',
                )}
              >
                {title}
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">{mou.reference_number}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Urgency badge */}
            <Badge
              variant="outline"
              className={cn('text-xs', urgency.color.bg, urgency.color.text)}
            >
              {mou.days_until_expiry <= 0
                ? t('status.expired')
                : t('expiresIn', { days: mou.days_until_expiry })}
            </Badge>

            {/* Renewal status badge */}
            {mou.renewal_status && renewalStatusColors && (
              <Badge
                variant="outline"
                className={cn('text-xs', renewalStatusColors.bg, renewalStatusColors.text)}
              >
                {t(`renewalStatus.${mou.renewal_status}`)}
              </Badge>
            )}

            {/* Auto-renewal badge */}
            {mou.auto_renewal && (
              <Badge variant="secondary" className="text-xs">
                <RefreshCw className="me-1 h-3 w-3" />
                {t('autoRenewal')}
              </Badge>
            )}

            {/* Pending alerts badge */}
            {mou.pending_alert_count > 0 && (
              <Badge variant="destructive" className="text-xs">
                <Bell className="me-1 h-3 w-3" />
                {mou.pending_alert_count}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn('space-y-3', compact && 'p-3 pt-0')}>
        {/* Progress bar showing time remaining */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('timeRemaining')}</span>
            <span>{format(new Date(mou.expiry_date), 'PP', { locale: dateLocale })}</span>
          </div>
          <Progress
            value={progressValue}
            className={cn(
              'h-1.5',
              urgency.level === 'expired' && '[&>div]:bg-red-500',
              urgency.level === 'critical' && '[&>div]:bg-red-400',
              urgency.level === 'high' && '[&>div]:bg-orange-400',
              urgency.level === 'medium' && '[&>div]:bg-yellow-400',
            )}
          />
        </div>

        {/* Parties */}
        {!compact && (mou.primary_party_name || mou.secondary_party_name) && (
          <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:gap-4">
            {mou.primary_party_name && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{mou.primary_party_name}</span>
              </div>
            )}
            {mou.secondary_party_name && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{mou.secondary_party_name}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          {/* Initiate renewal button - show if no active renewal */}
          {!mou.renewal_status ||
          mou.renewal_status === 'pending' ||
          mou.renewal_status === 'expired' ? (
            <Button
              size="sm"
              onClick={() => onInitiateRenewal?.(mou.mou_id)}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
              {t('actions.initiateRenewal')}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => mou.renewal_id && onViewRenewal?.(mou.renewal_id)}
              className="flex-1 sm:flex-none"
            >
              {t('actions.viewRenewal')}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails?.(mou.mou_id)}
            className="flex-1 sm:flex-none"
          >
            {t('actions.viewMou')}
            <ChevronRight className={cn('h-4 w-4', isRTL ? 'rotate-180 me-2' : 'ms-2')} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ExpiringMouCard
