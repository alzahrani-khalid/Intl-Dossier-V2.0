/**
 * Meeting Minutes Card
 * Feature: meeting-minutes-capture
 *
 * Displays a summary card for meeting minutes in list views.
 * Mobile-first with RTL support.
 */

import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import {
  Calendar,
  MapPin,
  Users,
  CheckSquare,
  Video,
  FileText,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { MeetingMinutesListItem, MeetingMinutesStatus } from '@/types/meeting-minutes.types'
import { STATUS_COLORS } from '@/types/meeting-minutes.types'

interface MeetingMinutesCardProps {
  minutes: MeetingMinutesListItem
  onClick?: (minutes: MeetingMinutesListItem) => void
  className?: string
}

export function MeetingMinutesCard({ minutes, onClick, className }: MeetingMinutesCardProps) {
  const { t, i18n } = useTranslation('meeting-minutes')
  const isRTL = i18n.language === 'ar'

  const statusColors = STATUS_COLORS[minutes.status as MeetingMinutesStatus] || STATUS_COLORS.draft

  const handleClick = () => {
    onClick?.(minutes)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.(minutes)
    }
  }

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-primary/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className,
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${minutes.title_en || minutes.title_ar} - ${t(`status.${minutes.status}`)}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <CardContent className="p-4 sm:p-5">
        {/* Header: Title and Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
              {isRTL ? minutes.title_ar || minutes.title_en : minutes.title_en}
            </h3>
            {minutes.dossier_name_en && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {minutes.dossier_name_en}
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 capitalize',
              statusColors.bg,
              statusColors.text,
              statusColors.border,
            )}
          >
            {t(`status.${minutes.status}`)}
          </Badge>
        </div>

        {/* Meeting Details */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
          {/* Date */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{format(new Date(minutes.meeting_date), 'MMM d, yyyy')}</span>
          </div>

          {/* Location or Virtual */}
          {minutes.is_virtual ? (
            <div className="flex items-center gap-1.5">
              <Video className="h-4 w-4 shrink-0 text-blue-500" />
              <span>{t('fields.isVirtual')}</span>
            </div>
          ) : minutes.location_en ? (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-[150px]">{minutes.location_en}</span>
            </div>
          ) : null}
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {/* Attendees */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {minutes.attendee_count} {t('stats.attendees')}
            </span>
          </div>

          {/* Action Items */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CheckSquare className="h-4 w-4 shrink-0" />
            <span>
              {minutes.action_item_count} {t('stats.actionItems')}
            </span>
          </div>

          {/* AI Summary indicator */}
          {minutes.ai_summary_en && (
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="text-xs">{t('ai.title')}</span>
            </div>
          )}
        </div>

        {/* AI Summary Preview */}
        {minutes.ai_summary_en && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground line-clamp-2">{minutes.ai_summary_en}</p>
            </div>
          </div>
        )}

        {/* View Arrow */}
        <div
          className={cn(
            'flex items-center justify-end mt-3 pt-3 border-t border-border/50',
            'text-sm text-primary font-medium',
          )}
        >
          <span>{t('actions.view')}</span>
          <ChevronRight className={cn('h-4 w-4 ms-1', isRTL && 'rotate-180')} />
        </div>
      </CardContent>
    </Card>
  )
}

export default MeetingMinutesCard
