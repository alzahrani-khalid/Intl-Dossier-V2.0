// T052: UnifiedCalendar component
import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useCalendarEvents, type CalendarEvent } from '@/hooks/useCalendarEvents'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { CalendarEmptyWizard, type EventTemplate } from './CalendarEmptyWizard'
import { CalendarEntryForm } from './CalendarEntryForm'

interface UnifiedCalendarProps {
  linkedItemType?: string
  linkedItemId?: string
  /** Optional: Pass events directly (for backwards compatibility with pages/calendar) */
  events?: CalendarEvent[]
  /** Optional: Callback when an event is clicked */
  onEventClick?: (event: CalendarEvent) => void
  /** Optional: Pass loading state directly (for backwards compatibility with pages/calendar) */
  isLoading?: boolean
  /** Optional: View mode (month, week, day) - currently only month is supported */
  viewMode?: 'month' | 'week' | 'day'
}

export function UnifiedCalendar({
  linkedItemType,
  linkedItemId,
  events: propEvents,
  onEventClick,
  isLoading: propIsLoading,
  viewMode: _viewMode = 'month', // eslint-disable-line @typescript-eslint/no-unused-vars
}: UnifiedCalendarProps) {
  const { t, i18n } = useTranslation('calendar')
  const isRTL = i18n.language === 'ar'

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [entryTypeFilter, setEntryTypeFilter] = useState<string | undefined>(undefined)
  const [showWizard, setShowWizard] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  // Use internal hook when events are not provided as props
  const {
    events: hookEvents,
    isLoading: hookIsLoading,
    error,
    refetch,
  } = useCalendarEvents({
    start_date: monthStart.toISOString(),
    end_date: monthEnd.toISOString(),
    event_type: entryTypeFilter,
    dossier_id: linkedItemId,
  })

  // Use prop events if provided, otherwise use hook events
  const events = propEvents ?? hookEvents
  const isLoading = propIsLoading ?? hookIsLoading

  // Generate calendar days
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
  }, [monthStart, monthEnd])

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, typeof events>()
    events.forEach((event) => {
      const day = format(new Date(event.start_datetime), 'yyyy-MM-dd')
      if (!grouped.has(day)) {
        grouped.set(day, [])
      }
      grouped.get(day)?.push(event)
    })
    return grouped
  }, [events])

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleToday = () => {
    setCurrentMonth(new Date())
  }

  // Handle template selection from wizard
  const handleCreateFromTemplate = useCallback((template: EventTemplate) => {
    setSelectedTemplate(template)
    setShowCreateForm(true)
    setShowWizard(false)
  }, [])

  // Handle form success
  const handleFormSuccess = useCallback(() => {
    setShowCreateForm(false)
    setSelectedTemplate(null)
    refetch()
  }, [refetch])

  // Handle form cancel
  const handleFormCancel = useCallback(() => {
    setShowCreateForm(false)
    setSelectedTemplate(null)
  }, [])

  // Handle wizard dismiss
  const handleWizardDismiss = useCallback(() => {
    setShowWizard(false)
  }, [])

  // Check if calendar is empty (no events at all, not just in current month)
  const isCalendarEmpty = events.length === 0 && !entryTypeFilter

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-destructive">{t('errors.failed_to_load')}</p>
      </Card>
    )
  }

  // Show create form if triggered from wizard
  if (showCreateForm) {
    return (
      <div className="flex flex-col gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <CalendarEntryForm
          initialData={
            selectedTemplate
              ? {
                  entry_type: selectedTemplate.defaults.entry_type,
                  all_day: selectedTemplate.defaults.all_day,
                  reminder_minutes: selectedTemplate.defaults.reminder_minutes,
                }
              : undefined
          }
          linkedItemType={linkedItemType}
          linkedItemId={linkedItemId}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    )
  }

  // Show wizard if calendar is empty and user hasn't dismissed it
  if (isCalendarEmpty && showWizard) {
    return (
      <div className="flex flex-col gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <CalendarEmptyWizard
          onCreateEvent={handleCreateFromTemplate}
          onDismiss={handleWizardDismiss}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header & Controls */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousMonth}
              className={isRTL ? 'rotate-180' : ''}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base sm:text-lg font-semibold flex-1 text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              className={isRTL ? 'rotate-180' : ''}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleToday} className="w-full sm:w-auto">
              {t('today')}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => setShowCreateForm(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 me-1" />
              {t('form.create_event')}
            </Button>

            <Select
              value={entryTypeFilter}
              onValueChange={(v) => setEntryTypeFilter(v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('all_types')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_types')}</SelectItem>
                <SelectItem value="internal_meeting">{t('types.internal_meeting')}</SelectItem>
                <SelectItem value="deadline">{t('types.deadline')}</SelectItem>
                <SelectItem value="reminder">{t('types.reminder')}</SelectItem>
                <SelectItem value="holiday">{t('types.holiday')}</SelectItem>
                <SelectItem value="training">{t('types.training')}</SelectItem>
                <SelectItem value="review">{t('types.review')}</SelectItem>
                <SelectItem value="other">{t('types.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="p-2 sm:p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <div
              key={day}
              className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-2"
            >
              {format(new Date(2024, 0, day + 1), 'EEE')}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayEvents = eventsByDay.get(dateKey) || []
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={dateKey}
                className={`
 min-h-16 sm:min-h-24 p-1 sm:p-2 border rounded-lg
 ${!isSameMonth(day, currentMonth) ? 'opacity-40' : ''}
 ${isToday ? 'border-primary bg-primary/5' : 'border-border'}
 `}
              >
                <div className="flex flex-col h-full">
                  <div
                    className={`
 text-xs sm:text-sm font-medium mb-1
 ${isToday ? 'text-primary' : 'text-foreground'}
 `}
                  >
                    {format(day, 'd')}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        className="w-full text-start text-xs px-1 py-0.5 rounded bg-accent hover:bg-accent/80 cursor-pointer truncate"
                        title={
                          isRTL
                            ? event.title_ar || event.title_en
                            : event.title_en || event.title_ar
                        }
                        onClick={() => onEventClick?.(event)}
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="h-2 w-2 sm:h-3 sm:w-3 shrink-0" />
                          <span className="truncate">
                            {isRTL
                              ? event.title_ar || event.title_en
                              : event.title_en || event.title_ar}
                          </span>
                        </div>
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground ps-1">
                        +{dayEvents.length - 3} {t('more')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Events List (Mobile-friendly alternative view) */}
      <div className="sm:hidden">
        <h3 className="text-sm font-semibold mb-2">{t('upcoming_events')}</h3>
        <div className="flex flex-col gap-2">
          {events.slice(0, 5).map((event) => (
            <Card
              key={event.id}
              className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onEventClick?.(event)}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    {isRTL ? event.title_ar || event.title_en : event.title_en || event.title_ar}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.start_datetime), 'PPp')}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {t(`types.${event.event_type}`)}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
