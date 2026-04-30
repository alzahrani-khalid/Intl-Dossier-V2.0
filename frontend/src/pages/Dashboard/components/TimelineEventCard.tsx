/**
 * TimelineEventCard — Individual timeline event card
 * Phase 10: Operations Hub Dashboard
 *
 * Renders a single timeline event with time, title, engagement name,
 * and type icon. Click navigates to the engagement.
 */

import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Calendar, Users, FileText, Globe } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import type { TimelineEvent } from '@/domains/operations-hub/types/operations-hub.types'
import type { LucideIcon } from 'lucide-react'

// ============================================================================
// Event Type Icons
// ============================================================================

const EVENT_TYPE_ICONS: Record<string, LucideIcon> = {
  meeting: Users,
  deadline: Calendar,
  report: FileText,
  conference: Globe,
}

// ============================================================================
// Component
// ============================================================================

interface TimelineEventCardProps {
  event: TimelineEvent
  onClick: () => void
}

export function TimelineEventCard({ event, onClick }: TimelineEventCardProps): React.ReactElement {
  const { i18n } = useTranslation('operations-hub')
  const navigate = useNavigate()

  const title =
    i18n.language === 'ar' && event.title_ar != null && event.title_ar !== ''
      ? event.title_ar
      : event.title

  const engagementName =
    i18n.language === 'ar' && event.engagement_name_ar != null && event.engagement_name_ar !== ''
      ? event.engagement_name_ar
      : event.engagement_name

  const timeStr = format(parseISO(event.start_date), 'HH:mm')
  const IconComponent = EVENT_TYPE_ICONS[event.event_type] ?? Calendar

  const handleClick = (): void => {
    if (event.engagement_id != null) {
      void navigate({ to: `/engagements/${event.engagement_id}` })
    }
    onClick()
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] hover:bg-muted/50 cursor-pointer min-h-11 transition-colors"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${timeStr} - ${title}`}
    >
      <IconComponent className="text-muted-foreground shrink-0" size={18} />
      <LtrIsolate className="text-sm font-semibold text-muted-foreground shrink-0 min-w-[3rem]">
        {timeStr}
      </LtrIsolate>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-normal truncate block">{title}</span>
        {engagementName != null && (
          <span className="text-xs text-muted-foreground truncate block mt-0.5">
            {engagementName}
          </span>
        )}
      </div>
    </div>
  )
}
