/**
 * MilestoneCard Component
 *
 * Displays a single planned milestone with visual indicators for type,
 * priority, and due date status. Mobile-first with RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
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

// Color mapping for milestone types
const typeColors: Record<MilestoneType, string> = {
  engagement: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  policy_deadline: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  relationship_review: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  document_due: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  follow_up: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  renewal: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  custom: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

// Priority colors
const priorityColors: Record<TimelinePriority, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

// Status colors
const statusColors = {
  planned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  postponed: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-400',
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
  const isRTL = i18n.language === 'ar'
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'transition-all duration-200 hover:shadow-md',
          isOverdue && 'border-red-300 dark:border-red-700',
          milestone.status === 'completed' && 'opacity-75',
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
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
                    isOverdue && 'text-red-600 dark:text-red-400',
                    isDueToday && 'text-amber-600 dark:text-amber-400',
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
                    <motion.div
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
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
