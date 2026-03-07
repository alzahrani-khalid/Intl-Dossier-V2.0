/**
 * SideEventCard Component
 *
 * Displays a single side event with its details, status, and logistics summary.
 * Mobile-first responsive, RTL support.
 */

import { useTranslation } from 'react-i18next'
import {
  Clock,
  MapPin,
  Users,
  Globe,
  Lock,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type {
  SideEventWithStats,
  SideEventType,
  SideEventStatus,
  SideEventPriority,
} from '@/types/forum-extended.types'

interface SideEventCardProps {
  event: SideEventWithStats
  isRTL: boolean
  onEdit?: (event: SideEventWithStats) => void
  onDelete?: (event: SideEventWithStats) => void
  onViewDetails?: (event: SideEventWithStats) => void
}

export function SideEventCard({
  event,
  isRTL,
  onEdit,
  onDelete,
  onViewDetails,
}: SideEventCardProps) {
  const { t, i18n } = useTranslation('forum-management')
  const [showActions, setShowActions] = useState(false)

  const title = isRTL ? event.title_ar || event.title_en : event.title_en || event.title_ar
  const venue = isRTL ? event.venue_ar || event.venue_en : event.venue_en || event.venue_ar

  // Status badge config
  const statusConfig = getStatusConfig(event.status, t)
  const priorityConfig = getPriorityConfig(event.priority, t)
  const typeConfig = getTypeConfig(event.event_type, t)

  // Format time
  const formatTime = (time: string | null | undefined) => {
    if (!time) return null
    try {
      const [hours, minutes] = time.split(':')
      const date = new Date()
      date.setHours(parseInt(hours!), parseInt(minutes!))
      return date.toLocaleTimeString(i18n.language, {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return time
    }
  }

  const startTime = formatTime(event.start_time)
  const endTime = formatTime(event.end_time)
  const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : startTime

  // Logistics summary
  const logistics = event.logistics_status || { total: 0, pending: 0, confirmed: 0 }
  const hasLogistics = logistics.total > 0

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group rounded-lg border bg-card transition-all duration-200',
        'hover:border-primary/30 hover:shadow-sm cursor-pointer',
      )}
      onClick={() => onViewDetails?.(event)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onViewDetails?.(event)
        }
      }}
    >
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start gap-3">
          {/* Date Badge */}
          <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary">
            <span className="text-xs font-medium uppercase">
              {new Date(event.scheduled_date).toLocaleDateString(i18n.language, { month: 'short' })}
            </span>
            <span className="text-lg font-bold leading-none">
              {new Date(event.scheduled_date).getDate()}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-card-foreground text-start leading-tight truncate group-hover:text-primary transition-colors">
                  {title}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">{typeConfig.label}</p>
              </div>

              {/* Status & Priority Badges */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {event.priority !== 'normal' && (
                  <Badge variant={priorityConfig.variant} className="text-xs">
                    {priorityConfig.label}
                  </Badge>
                )}
                <Badge variant={statusConfig.variant} className="text-xs">
                  {statusConfig.icon}
                  <span className="ms-1">{statusConfig.label}</span>
                </Badge>
              </div>
            </div>

            {/* Meta Row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              {/* Time */}
              {(timeRange || event.all_day) && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {event.all_day ? t('sideEvents.allDay', 'All Day') : timeRange}
                </span>
              )}

              {/* Venue */}
              {venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[150px]">{venue}</span>
                </span>
              )}

              {/* Participants */}
              {event.participants && event.participants.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {event.participants.length}
                </span>
              )}

              {/* Public/Private */}
              <span className="flex items-center gap-1">
                {event.is_public ? (
                  <>
                    <Globe className="h-3 w-3" />
                    {t('common.public', 'Public')}
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" />
                    {t('common.private', 'Private')}
                  </>
                )}
              </span>
            </div>

            {/* Logistics Summary */}
            {hasLogistics && (
              <div className="mt-3 flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">{t('logistics.title', 'Logistics')}:</span>
                <div className="flex items-center gap-2">
                  {logistics.confirmed > 0 && (
                    <Badge variant="outline" className="text-xs gap-1 text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      {logistics.confirmed}
                    </Badge>
                  )}
                  {logistics.pending > 0 && (
                    <Badge variant="outline" className="text-xs gap-1 text-amber-600">
                      <Loader2 className="h-3 w-3" />
                      {logistics.pending}
                    </Badge>
                  )}
                  <span className="text-muted-foreground">/ {logistics.total}</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <div
            className="relative shrink-0"
            role="presentation"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              onClick={() => setShowActions(!showActions)}
              aria-label="Actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  role="presentation"
                  onClick={() => setShowActions(false)}
                />
                <div
                  className={cn(
                    'absolute z-20 mt-1 w-36 rounded-md border bg-popover p-1 shadow-md',
                    isRTL ? 'start-0' : 'end-0',
                  )}
                >
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                    onClick={() => {
                      onEdit?.(event)
                      setShowActions(false)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t('sideEvents.edit', 'Edit')}
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      onDelete?.(event)
                      setShowActions(false)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('sideEvents.delete', 'Delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions for badge configurations
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

function getStatusConfig(status: SideEventStatus, t: ReturnType<typeof useTranslation>['t']) {
  const configs: Record<
    SideEventStatus,
    { label: string; variant: BadgeVariant; icon: React.ReactNode }
  > = {
    planned: {
      label: t('sideEventStatus.planned', 'Planned'),
      variant: 'outline',
      icon: <Clock className="h-3 w-3" />,
    },
    confirmed: {
      label: t('sideEventStatus.confirmed', 'Confirmed'),
      variant: 'default',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    tentative: {
      label: t('sideEventStatus.tentative', 'Tentative'),
      variant: 'secondary',
      icon: <AlertCircle className="h-3 w-3" />,
    },
    cancelled: {
      label: t('sideEventStatus.cancelled', 'Cancelled'),
      variant: 'destructive',
      icon: <AlertCircle className="h-3 w-3" />,
    },
    postponed: {
      label: t('sideEventStatus.postponed', 'Postponed'),
      variant: 'secondary',
      icon: <Clock className="h-3 w-3" />,
    },
    completed: {
      label: t('sideEventStatus.completed', 'Completed'),
      variant: 'outline',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
  }

  return configs[status] || configs.planned
}

function getPriorityConfig(priority: SideEventPriority, t: ReturnType<typeof useTranslation>['t']) {
  const configs: Record<SideEventPriority, { label: string; variant: BadgeVariant }> = {
    low: { label: t('sideEventPriority.low', 'Low'), variant: 'outline' },
    normal: { label: t('sideEventPriority.normal', 'Normal'), variant: 'secondary' },
    high: { label: t('sideEventPriority.high', 'High'), variant: 'default' },
    vip: { label: t('sideEventPriority.vip', 'VIP'), variant: 'destructive' },
  }

  return configs[priority] || configs.normal
}

function getTypeConfig(type: SideEventType, t: ReturnType<typeof useTranslation>['t']) {
  return {
    label: t(`sideEventTypes.${type}`, type.replace(/_/g, ' ')),
  }
}

export default SideEventCard
