/**
 * RenewalAlertCard Component
 * Feature: commitment-renewal-workflow
 *
 * Displays an expiration alert with type-specific styling and actions.
 * Mobile-first, RTL-aware design.
 */

import { useTranslation } from 'react-i18next'
import { format, formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import {
  Bell,
  BellOff,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Play,
  Clock,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import {
  type MouExpirationAlertWithRelations,
  type AlertType,
  ALERT_TYPE_COLORS,
  ALERT_STATUS_COLORS,
} from '@/types/mou-renewal.types'

interface RenewalAlertCardProps {
  alert: MouExpirationAlertWithRelations
  onAcknowledge?: (alertId: string) => void
  onDismiss?: (alertId: string) => void
  onViewMou?: (mouId: string) => void
  isAcknowledging?: boolean
  isDismissing?: boolean
}

const ALERT_ICONS: Record<AlertType, typeof AlertCircle> = {
  expiration_90_days: Info,
  expiration_60_days: Clock,
  expiration_30_days: AlertTriangle,
  expiration_7_days: AlertCircle,
  expired: XCircle,
  renewal_initiated: Play,
  renewal_approved: CheckCircle,
  renewal_completed: CheckCircle,
}

export function RenewalAlertCard({
  alert,
  onAcknowledge,
  onDismiss,
  onViewMou,
  isAcknowledging = false,
  isDismissing = false,
}: RenewalAlertCardProps) {
  const { t, i18n } = useTranslation('mou-renewals')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  const Icon = ALERT_ICONS[alert.alert_type] || Bell
  const typeColors = ALERT_TYPE_COLORS[alert.alert_type]
  const statusColors = ALERT_STATUS_COLORS[alert.alert_status]

  const message = isRTL ? alert.message_ar : alert.message_en
  const mouTitle = isRTL ? alert.mou?.title_ar : alert.mou?.title_en

  const isPendingOrSent = alert.alert_status === 'pending' || alert.alert_status === 'sent'

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        isPendingOrSent && 'border-s-4',
        alert.alert_status === 'pending' && 'border-s-yellow-500',
        alert.alert_status === 'sent' && 'border-s-blue-500',
        alert.alert_status === 'acknowledged' && 'opacity-75',
        alert.alert_status === 'dismissed' && 'opacity-50',
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {/* Icon */}
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              typeColors.bg,
            )}
          >
            <Icon className={cn('h-5 w-5', typeColors.text)} />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-2">
            {/* Header */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn('text-xs', typeColors.bg, typeColors.text)}>
                  {t(`alertType.${alert.alert_type}`)}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn('text-xs', statusColors.bg, statusColors.text)}
                >
                  {t(`alertStatus.${alert.alert_status}`)}
                </Badge>
              </div>

              <span className="text-xs text-muted-foreground">
                {alert.sent_at
                  ? formatDistanceToNow(new Date(alert.sent_at), {
                      addSuffix: true,
                      locale: dateLocale,
                    })
                  : format(new Date(alert.scheduled_for), 'PP', {
                      locale: dateLocale,
                    })}
              </span>
            </div>

            {/* MoU reference */}
            {alert.mou && (
              <div className="text-sm font-medium">
                <span className="text-muted-foreground">{alert.mou.reference_number}</span>
                {mouTitle && (
                  <>
                    <span className="mx-1">-</span>
                    <span>{mouTitle}</span>
                  </>
                )}
              </div>
            )}

            {/* Message */}
            {message && <p className="text-sm text-muted-foreground">{message}</p>}

            {/* Actions */}
            {isPendingOrSent && (
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                {alert.alert_status !== 'acknowledged' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAcknowledge?.(alert.id)}
                    disabled={isAcknowledging}
                  >
                    <Check className={cn('h-4 w-4', isRTL ? 'ms-1.5' : 'me-1.5')} />
                    {t('actions.acknowledge')}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDismiss?.(alert.id)}
                  disabled={isDismissing}
                >
                  <BellOff className={cn('h-4 w-4', isRTL ? 'ms-1.5' : 'me-1.5')} />
                  {t('actions.dismiss')}
                </Button>

                {alert.mou_id && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onViewMou?.(alert.mou_id)}
                    className="sm:ms-auto"
                  >
                    {t('actions.viewMou')}
                  </Button>
                )}
              </div>
            )}

            {/* Acknowledged info */}
            {alert.alert_status === 'acknowledged' && alert.acknowledged_at && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3 w-3" />
                <span>
                  {t('acknowledgedAt', {
                    date: format(new Date(alert.acknowledged_at), 'PP p', {
                      locale: dateLocale,
                    }),
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RenewalAlertCard
