/**
 * StakeholderTimelineCard Component
 *
 * Individual timeline event card with:
 * - Event icon and type indicator
 * - Title and description
 * - Metadata (participants, attachments, sentiment)
 * - Annotation badges
 * - Expandable details
 * - Mobile-first responsive design
 * - RTL support
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Mail,
  Users,
  Phone,
  FileText,
  MessageSquare,
  MessageCircle,
  MapPin,
  Video,
  Presentation,
  Handshake,
  Activity,
  Calendar,
  ChevronDown,
  ChevronUp,
  Paperclip,
  ExternalLink,
  Flag,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type {
  InteractionCardProps,
  TimelineAnnotation,
} from '@/types/stakeholder-interaction.types'

// Icon mapping for event types
const eventIcons: Record<string, React.ElementType> = {
  email: Mail,
  meeting: Users,
  phone_call: Phone,
  document_exchange: FileText,
  comment: MessageSquare,
  message: MessageCircle,
  visit: MapPin,
  conference: Video,
  workshop: Presentation,
  negotiation: Handshake,
  calendar: Calendar,
  interaction: Activity,
  document: FileText,
}

// Color mapping for event types
const eventColors: Record<string, string> = {
  email: 'bg-blue-500',
  meeting: 'bg-purple-500',
  phone_call: 'bg-cyan-500',
  document_exchange: 'bg-orange-500',
  comment: 'bg-gray-500',
  message: 'bg-indigo-500',
  visit: 'bg-green-500',
  conference: 'bg-violet-500',
  workshop: 'bg-teal-500',
  negotiation: 'bg-amber-500',
  calendar: 'bg-blue-500',
  interaction: 'bg-purple-500',
  document: 'bg-orange-500',
}

// Sentiment colors
const sentimentColors: Record<string, { bg: string; text: string }> = {
  positive: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  neutral: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400' },
  negative: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  mixed: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
}

/**
 * Annotation badge component
 */
function AnnotationBadge({
  annotation,
  onClick,
}: {
  annotation: TimelineAnnotation
  onClick?: () => void
}) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
  }

  const typeIcons: Record<string, React.ElementType> = {
    note: MessageSquare,
    marker: Flag,
    highlight: Star,
    milestone: Star,
    turning_point: Activity,
    breakthrough: Star,
    concern: Flag,
  }

  const Icon = typeIcons[annotation.annotation_type] || MessageSquare

  return (
    <Badge
      variant="outline"
      className={cn(
        'cursor-pointer hover:opacity-80 transition-opacity',
        colorMap[annotation.color] || colorMap.blue,
      )}
      onClick={onClick}
    >
      <Icon className="h-3 w-3 me-1" />
      <span className="max-w-20 truncate text-xs">
        {isRTL && annotation.content_ar ? annotation.content_ar : annotation.content_en}
      </span>
      {annotation.is_key_moment && <Star className="h-3 w-3 ms-1 fill-current" />}
    </Badge>
  )
}

export function StakeholderTimelineCard({
  event,
  isLast = false,
  onAnnotate,
  onViewDetails,
  showAnnotations = true,
}: InteractionCardProps) {
  const { t, i18n } = useTranslation('stakeholder-interactions')
  const isRTL = i18n.language === 'ar'
  const [isExpanded, setIsExpanded] = useState(false)

  // Get icon and color
  const eventType =
    (event.metadata?.interaction_type as string) || event.source_table || 'interaction'
  const Icon = eventIcons[eventType] || Activity
  const bgColor = eventColors[eventType] || 'bg-gray-500'

  // Format date
  const eventDate = new Date(event.event_date)
  const formattedDate = eventDate.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const formattedTime = eventDate.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Get sentiment styling
  const sentiment = event.metadata?.sentiment as string
  const sentimentStyle = sentiment ? sentimentColors[sentiment] : undefined

  // Get participants
  const participants = (event.metadata?.participants || []) as Array<{
    name_en: string
    name_ar?: string
    avatar_url?: string
  }>

  // Get attachments
  const attachments = (event.metadata?.attachments || []) as Array<{
    filename: string
    url?: string
  }>

  return (
    <motion.div
      className="flex gap-4"
      initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        {/* Event icon */}
        <div
          className={cn(
            'flex items-center justify-center h-11 w-11 rounded-full text-white shadow-md',
            bgColor,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {/* Connector line */}
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-2 min-h-8" />}
      </div>

      {/* Event card */}
      <Card className="flex-1 mb-4 overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
            <div className="flex-1">
              {/* Event type badge */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {t(`types.${eventType}`)}
                </Badge>
                {sentiment && sentimentStyle && (
                  <Badge className={cn('text-xs', sentimentStyle.bg, sentimentStyle.text)}>
                    {t(`sentiment.${sentiment}`)}
                  </Badge>
                )}
                {event.metadata?.direction && (
                  <Badge variant="outline" className="text-xs">
                    {t(`direction.${event.metadata.direction}`)}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h3 className="text-base sm:text-lg font-semibold text-start">
                {isRTL && event.title_ar ? event.title_ar : event.title_en}
              </h3>
            </div>

            {/* Date and time */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
              <span className="hidden sm:inline">{formattedTime}</span>
            </div>
          </div>

          {/* Description */}
          {(event.description_en || event.description_ar) && (
            <p
              className={cn(
                'text-sm text-muted-foreground text-start mb-3',
                !isExpanded && 'line-clamp-2',
              )}
            >
              {isRTL && event.description_ar ? event.description_ar : event.description_en}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {/* Location */}
            {(event.metadata?.location_en || event.metadata?.location_ar) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>
                  {isRTL && event.metadata.location_ar
                    ? event.metadata.location_ar
                    : event.metadata.location_en}
                </span>
              </div>
            )}

            {/* Virtual link */}
            {event.metadata?.is_virtual && event.metadata?.virtual_link && (
              <a
                href={event.metadata.virtual_link as string}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Video className="h-3 w-3" />
                <span>{t('join_virtual')}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {/* Duration */}
            {event.metadata?.duration_minutes && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>
                  {event.metadata.duration_minutes} {t('minutes')}
                </span>
              </div>
            )}

            {/* Impact score */}
            {event.metadata?.impact_score && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>
                  {t('impact')}: {event.metadata.impact_score}/5
                </span>
              </div>
            )}
          </div>

          {/* Participants */}
          {participants.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">{t('participants')}:</span>
              <div className="flex -space-x-2">
                {participants.slice(0, 5).map((participant, idx) => (
                  <TooltipProvider key={idx}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Avatar className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={participant.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {(participant.name_en || '?').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {isRTL && participant.name_ar ? participant.name_ar : participant.name_en}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {participants.length > 5 && (
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs">
                    +{participants.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Paperclip className="h-3 w-3 text-muted-foreground" />
              {attachments.slice(0, 3).map((attachment, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {attachment.filename}
                </Badge>
              ))}
              {attachments.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{attachments.length - 3} {t('more')}
                </span>
              )}
            </div>
          )}

          {/* Annotations */}
          {showAnnotations && event.annotations && event.annotations.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-3 pt-3 border-t">
              {event.annotations.map((annotation) => (
                <AnnotationBadge key={annotation.id} annotation={annotation} />
              ))}
            </div>
          )}

          {/* Outcome (expanded) */}
          {isExpanded && (event.metadata?.outcome_en || event.metadata?.outcome_ar) && (
            <div className="mt-3 pt-3 border-t">
              <h4 className="text-sm font-medium mb-1 text-start">{t('outcome')}</h4>
              <p className="text-sm text-muted-foreground text-start">
                {isRTL && event.metadata.outcome_ar
                  ? event.metadata.outcome_ar
                  : event.metadata.outcome_en}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t">
            {/* Expand/collapse */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1')} />
                  {t('show_less')}
                </>
              ) : (
                <>
                  <ChevronDown className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1')} />
                  {t('show_more')}
                </>
              )}
            </Button>

            {/* Annotate */}
            {onAnnotate && (
              <Button variant="ghost" size="sm" onClick={() => onAnnotate(event)} className="h-8">
                <Flag className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1')} />
                {t('annotate')}
              </Button>
            )}

            {/* View details */}
            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(event)}
                className="h-8"
              >
                <ExternalLink className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1')} />
                {t('view_details')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
