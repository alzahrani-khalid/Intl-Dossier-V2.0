/**
 * MilestoneCard Component
 *
 * Displays a single planned milestone with visual indicators for type,
 * priority, and due date status. Mobile-first with RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { m } from 'framer-motion'
import {
  Users,
  FileText,
  RefreshCw,
  FileCheck,
  ArrowRight,
  RotateCcw,
  Flag,
  Calendar,
  Clock,
  Bell,
  MoreVertical,
  Edit,
  Trash2,
  Check,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { PlannedMilestone, MilestoneType } from '@/types/milestone-planning.types'
import type { TimelinePriority } from '@/types/timeline.types'
import { useDirection } from '@/hooks/useDirection'

interface MilestoneCardProps {
  milestone: PlannedMilestone
  onEdit: (milestone: PlannedMilestone) => void
  onDelete: (milestoneId: string) => void
  onMarkComplete: (milestoneId: string) => void
  onConvertToEvent: (milestone: PlannedMilestone) => void
}

// Icon mapping for milestone types
const typeIcons: Record<MilestoneType, typeof Users> = {
  engagement: Users,
  policy_deadline: FileText,
  relationship_review: RefreshCw,
  document_due: FileCheck,
  follow_up: ArrowRight,
  renewal: RotateCcw,
  custom: Flag,
}

// Color mapping for milestone types.
// D-07 collision: engagement=accent (blue), document_due=secondary (purple);
// policy_deadline & renewal both → warning; relationship_review → success;
// follow_up → info (cyan); custom → muted. Token-collapse acceptable.
const typeColors: Record<MilestoneType, string> = {
  engagement: 'bg-accent/10 text-accent dark:bg-accent/30',
  policy_deadline: 'bg-warning/10 text-warning dark:bg-warning/30',
  relationship_review: 'bg-success/10 text-success dark:bg-success/30',
  document_due: 'bg-secondary/10 text-secondary dark:bg-secondary/30',
  follow_up: 'bg-info/10 text-info dark:bg-info/30',
  renewal: 'bg-warning/10 text-warning dark:bg-warning/30',
  custom: 'bg-muted text-muted-foreground',
}

// Priority colors
const priorityColors: Record<TimelinePriority, string> = {
  high: 'bg-destructive/10 text-destructive dark:bg-destructive/30',
  medium: 'bg-warning/10 text-warning dark:bg-warning/30',
  low: 'bg-success/10 text-success dark:bg-success/30',
}

// Status colors (postponed visually collapses to warning alongside in_progress)
const statusColors = {
  planned: 'bg-accent/10 text-accent dark:bg-accent/30',
  in_progress: 'bg-warning/10 text-warning dark:bg-warning/30',
  completed: 'bg-success/10 text-success dark:bg-success/30',
  postponed: 'bg-warning/10 text-warning dark:bg-warning/30',
  cancelled: 'bg-muted text-muted-foreground',
}

function getDaysUntil(targetDate: string): number {
  const target = new Date(targetDate)
  const now = new Date()
  const diffTime = target.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function MilestoneCard({
  milestone,
  onEdit,
  onDelete,
  onMarkComplete,
  onConvertToEvent,
}: MilestoneCardProps) {
  const { t, i18n } = useTranslation('milestone-planning')
  const { isRTL } = useDirection()
  const [isExpanded, setIsExpanded] = useState(false)

  const TypeIcon = typeIcons[milestone.milestone_type]
  const daysUntil = getDaysUntil(milestone.target_date)
  const isOverdue =
    daysUntil < 0 && milestone.status !== 'completed' && milestone.status !== 'cancelled'
  const isDueToday = daysUntil === 0
  const isDueTomorrow = daysUntil === 1

  const title = isRTL ? milestone.title_ar : milestone.title_en
  const description = isRTL ? milestone.description_ar : milestone.description_en
  const notes = isRTL ? milestone.notes_ar : milestone.notes_en
  const expectedOutcome = isRTL ? milestone.expected_outcome_ar : milestone.expected_outcome_en

  // Get due in text
  const getDueText = () => {
    if (isOverdue) {
      return t('dueIn.overdue')
    }
    if (isDueToday) {
      return t('dueIn.today')
    }
    if (isDueTomorrow) {
      return t('dueIn.tomorrow')
    }
    if (daysUntil <= 7) {
      return t('dueIn.days', { count: daysUntil })
    }
    if (daysUntil <= 30) {
      const weeks = Math.ceil(daysUntil / 7)
      return t('dueIn.weeks', { count: weeks })
    }
    const months = Math.ceil(daysUntil / 30)
    return t('dueIn.months', { count: months })
  }

  const activeReminders = milestone.reminders.filter((r) => r.enabled)

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'transition-all duration-200 hover:shadow-md',
          isOverdue && 'border-destructive/20 dark:border-destructive/70',
          milestone.status === 'completed' && 'opacity-75',
        )}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            {/* Type Icon */}
            <div
              className={cn(
                'flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center',
                typeColors[milestone.milestone_type],
              )}
            >
              <TypeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-semibold text-foreground truncate">
                    {title}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {t(`types.${milestone.milestone_type}`)}
                  </p>
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">{t('actions.viewDetails')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                    <DropdownMenuItem onClick={() => onEdit(milestone)}>
                      <Edit className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                      {t('actions.edit')}
                    </DropdownMenuItem>
                    {milestone.status !== 'completed' && (
                      <DropdownMenuItem onClick={() => onMarkComplete(milestone.id)}>
                        <Check className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                        {t('actions.markComplete')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onConvertToEvent(milestone)}>
                      <CalendarPlus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                      {t('actions.convertToEvent')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(milestone.id)}
                    >
                      <Trash2 className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                      {t('actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <Badge
                  variant="secondary"
                  className={cn('text-xs', priorityColors[milestone.priority])}
                >
                  {t(`priority.${milestone.priority}`)}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn('text-xs', statusColors[milestone.status])}
                >
                  {t(`status.${milestone.status}`)}
                </Badge>
                {activeReminders.length > 0 && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Bell className="h-3 w-3" />
                    {activeReminders.length}
                  </Badge>
                )}
              </div>

              {/* Date and Due Info */}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(milestone.target_date, i18n.language)}
                </span>
                {milestone.target_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {milestone.target_time}
                  </span>
                )}
                <span
                  className={cn(
                    'font-medium',
                    isOverdue && 'text-destructive',
                    isDueToday && 'text-warning',
                  )}
                >
                  {getDueText()}
                </span>
              </div>

              {/* Description (always show if exists) */}
              {description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">
                  {description}
                </p>
              )}

              {/* Expandable Section */}
              {(notes || expectedOutcome) && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 px-2 text-xs"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5 me-1" />
                        {t('common:showLess', 'Show less')}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5 me-1" />
                        {t('common:showMore', 'Show more')}
                      </>
                    )}
                  </Button>

                  {isExpanded && (
                    <m.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-3"
                    >
                      {notes && (
                        <div className="bg-muted/50 rounded-md p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            {t('form.notesEn', 'Notes')}
                          </p>
                          <p className="text-xs sm:text-sm text-foreground">{notes}</p>
                        </div>
                      )}
                      {expectedOutcome && (
                        <div className="bg-muted/50 rounded-md p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            {t('form.expectedOutcomeEn', 'Expected Outcome')}
                          </p>
                          <p className="text-xs sm:text-sm text-foreground">{expectedOutcome}</p>
                        </div>
                      )}
                    </m.div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </m.div>
  )
}
