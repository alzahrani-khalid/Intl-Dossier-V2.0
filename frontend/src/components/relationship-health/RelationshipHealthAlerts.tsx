/**
 * RelationshipHealthAlerts Component
 * Feature: relationship-health-scoring
 *
 * Displays alerts for relationship health issues with
 * ability to mark as read or dismiss.
 *
 * Mobile-first, RTL-compatible design following project conventions.
 */

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertCircle,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  Users,
  CheckCircle2,
  X,
  Bell,
  BellOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  RelationshipHealthAlert,
  AlertType,
  AlertSeverity,
} from '@/types/relationship-health.types'
import { getAlertSeverityColor, getAlertSeverityBgColor } from '@/types/relationship-health.types'
import { useDismissAlert, useMarkAlertRead } from '@/hooks/useRelationshipHealth'

// ============================================================================
// Component Props
// ============================================================================

interface RelationshipHealthAlertsProps {
  /** Alerts to display */
  alerts: RelationshipHealthAlert[]
  /** Loading state */
  isLoading?: boolean
  /** Show header */
  showHeader?: boolean
  /** Compact mode for sidebar */
  compact?: boolean
  /** Additional class names */
  className?: string
}

interface AlertItemProps {
  alert: RelationshipHealthAlert
  compact?: boolean
  onMarkRead?: (id: string) => void
  onDismiss?: (id: string) => void
}

// ============================================================================
// Helper Functions
// ============================================================================

function getAlertIcon(type: AlertType): React.ComponentType<{ className?: string }> {
  const icons: Record<AlertType, React.ComponentType<{ className?: string }>> = {
    score_critical: AlertCircle,
    score_declining: TrendingDown,
    engagement_gap: Clock,
    commitment_overdue: AlertTriangle,
    reciprocity_imbalance: Users,
    score_improving: TrendingUp,
  }
  return icons[type]
}

// ============================================================================
// Sub-components
// ============================================================================

function AlertItem({ alert, compact, onMarkRead, onDismiss }: AlertItemProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const title = isRTL ? alert.title_ar : alert.title_en
  const description = isRTL ? alert.description_ar : alert.description_en

  const Icon = getAlertIcon(alert.alert_type)
  const timeAgo = getTimeAgo(alert.created_at, isRTL)

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-start gap-2 p-2 rounded-lg transition-colors',
          getAlertSeverityBgColor(alert.severity),
          !alert.is_read && 'border-s-2 border-current',
        )}
      >
        <Icon
          className={cn('h-4 w-4 mt-0.5 flex-shrink-0', getAlertSeverityColor(alert.severity))}
        />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate', !alert.is_read && 'font-semibold')}>
            {title}
          </p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
        {!alert.is_dismissed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              onDismiss?.(alert.id)
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 sm:p-4 rounded-lg transition-colors',
        getAlertSeverityBgColor(alert.severity),
        !alert.is_read && 'border-s-4 border-current',
      )}
    >
      <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', getAlertSeverityColor(alert.severity))} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className={cn('text-sm sm:text-base font-medium', !alert.is_read && 'font-semibold')}
            >
              {title}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <Badge
            variant="outline"
            className={cn('flex-shrink-0 text-xs', getAlertSeverityColor(alert.severity))}
          >
            {alert.severity}
          </Badge>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-current/10">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          <div className="flex items-center gap-1">
            {!alert.is_read && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onMarkRead?.(alert.id)}
              >
                <Bell className="h-3 w-3 me-1" />
                Mark read
              </Button>
            )}
            {!alert.is_dismissed && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onDismiss?.(alert.id)}
              >
                <BellOff className="h-3 w-3 me-1" />
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(dateStr: string, isRTL: boolean): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) {
    return isRTL ? 'الآن' : 'Just now'
  }
  if (diffMins < 60) {
    return isRTL ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`
  }
  if (diffHours < 24) {
    return isRTL ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`
  }
  return isRTL ? `منذ ${diffDays} يوم` : `${diffDays}d ago`
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function AlertsSkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-2 p-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function RelationshipHealthAlerts({
  alerts,
  isLoading = false,
  showHeader = true,
  compact = false,
  className,
}: RelationshipHealthAlertsProps) {
  const { t, i18n } = useTranslation('relationship-health')
  const isRTL = i18n.language === 'ar'

  const markReadMutation = useMarkAlertRead()
  const dismissMutation = useDismissAlert()

  const handleMarkRead = (alertId: string) => {
    markReadMutation.mutate(alertId)
  }

  const handleDismiss = (alertId: string) => {
    dismissMutation.mutate(alertId)
  }

  // Sort alerts by severity and date
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder: Record<AlertSeverity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    }
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (severityDiff !== 0) return severityDiff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const unreadCount = alerts.filter((a) => !a.is_read).length

  if (isLoading) {
    return (
      <Card className={className} dir={isRTL ? 'rtl' : 'ltr'}>
        {showHeader && (
          <CardHeader className="p-4 sm:p-6 pb-2">
            <Skeleton className="h-5 w-1/3" />
          </CardHeader>
        )}
        <CardContent className={cn('p-4 sm:p-6', showHeader && 'pt-2')}>
          <AlertsSkeleton compact={compact} />
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card className={className} dir={isRTL ? 'rtl' : 'ltr'}>
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
          <p className="text-muted-foreground">{t('alerts.noAlerts')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      {showHeader && (
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {t('alerts.title')}
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
      )}

      <CardContent className={cn('p-4 sm:p-6', showHeader && 'pt-2')}>
        <div className={cn('space-y-2', !compact && 'space-y-3')}>
          {sortedAlerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              compact={compact}
              onMarkRead={handleMarkRead}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Exports
// ============================================================================

export { AlertItem, AlertsSkeleton }
