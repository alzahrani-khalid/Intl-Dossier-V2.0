/**
 * Recurrence Types
 * Feature: recurring-event-patterns
 *
 * Type definitions for recurring calendar events with complex patterns,
 * exception handling, series editing, and participant notifications.
 */

// ==============================================================================
// ENUMS
// ==============================================================================

/**
 * Frequency options for recurring events
 */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

/**
 * Position within month for monthly recurrence (e.g., "second Tuesday")
 */
export type MonthWeekPosition = 'first' | 'second' | 'third' | 'fourth' | 'last'

/**
 * Days of the week (0 = Sunday, 6 = Saturday)
 * Note: Saudi Arabia weekend is Friday (5) and Saturday (6)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * Scope of changes when editing a recurring event series
 */
export type SeriesEditScope = 'single' | 'this_and_future' | 'all'

/**
 * Types of exceptions to a recurring series
 */
export type ExceptionType = 'cancelled' | 'rescheduled' | 'modified'

/**
 * Types of notifications sent for event changes
 */
export type EventNotificationType =
  | 'created'
  | 'updated'
  | 'cancelled'
  | 'rescheduled'
  | 'exception_added'
  | 'series_modified'

// ==============================================================================
// RECURRENCE RULE
// ==============================================================================

/**
 * Recurrence rule definition (iCalendar RRULE-like)
 */
export interface RecurrenceRule {
  id: string

  /** Base frequency of recurrence */
  frequency: RecurrenceFrequency

  /** Interval between occurrences (e.g., 2 = every 2 weeks) */
  interval_count: number

  /** For weekly recurrence: which days of the week */
  days_of_week?: DayOfWeek[]

  /** For monthly recurrence: specific day of month (1-31) */
  day_of_month?: number

  /** For monthly recurrence: which week of the month */
  week_of_month?: MonthWeekPosition

  /** For monthly recurrence: day of week within the specified week */
  day_of_week_monthly?: DayOfWeek

  /** For yearly recurrence: which month (1-12) */
  month_of_year?: number

  /** End date for the series (null = ongoing) */
  end_date?: string | null

  /** Maximum number of occurrences */
  occurrence_count?: number | null

  created_at: string
  updated_at: string
}

/**
 * Input for creating a new recurrence rule
 */
export interface CreateRecurrenceRuleInput {
  frequency: RecurrenceFrequency
  interval_count?: number
  days_of_week?: DayOfWeek[]
  day_of_month?: number
  week_of_month?: MonthWeekPosition
  day_of_week_monthly?: DayOfWeek
  month_of_year?: number
  end_date?: string
  occurrence_count?: number
}

// ==============================================================================
// EVENT SERIES
// ==============================================================================

/**
 * A series of recurring events
 */
export interface EventSeries {
  id: string

  /** Link to the recurrence pattern */
  recurrence_rule_id: string
  recurrence_rule?: RecurrenceRule

  /** The master/template event for this series */
  master_event_id?: string | null

  /** Series titles */
  series_title_en?: string
  series_title_ar?: string

  /** Date range for the series */
  series_start_date: string
  series_end_date?: string | null

  /** Tracking */
  total_occurrences: number
  version: number

  /** Audit fields */
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Input for creating a recurring event series
 */
export interface CreateRecurringEventInput {
  /** Base event data */
  entry_type: string
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  start_datetime: string
  end_datetime?: string
  location?: string
  participants?: Array<{
    participant_type: 'person_dossier' | 'organization_dossier' | 'user'
    participant_id: string
  }>

  /** Recurrence pattern */
  recurrence: CreateRecurrenceRuleInput

  /** Generate occurrences up to this date (default: 1 year) */
  generate_until?: string
}

// ==============================================================================
// SERIES EXCEPTIONS
// ==============================================================================

/**
 * An exception to a recurring event series (cancellation, reschedule, modification)
 */
export interface SeriesException {
  id: string
  series_id: string

  /** The original date that was modified/cancelled */
  exception_date: string

  /** If modified/rescheduled, the replacement event */
  replacement_event_id?: string | null

  exception_type: ExceptionType
  reason_en?: string
  reason_ar?: string

  created_by: string
  created_at: string
}

/**
 * Input for creating an exception
 */
export interface CreateExceptionInput {
  series_id: string
  exception_date: string
  exception_type: ExceptionType
  reason_en?: string
  reason_ar?: string
  /** For reschedule/modify: new event data */
  replacement_event?: Partial<CreateRecurringEventInput>
}

// ==============================================================================
// EVENT NOTIFICATIONS
// ==============================================================================

/**
 * A notification sent to a participant about an event change
 */
export interface EventNotification {
  id: string
  event_id?: string
  series_id?: string

  participant_id: string
  participant_type: 'user' | 'external_contact' | 'person_dossier'

  notification_type: EventNotificationType
  title_en: string
  title_ar?: string
  message_en: string
  message_ar?: string

  /** JSON object with change details */
  change_summary?: {
    changes: Array<{
      field: string
      old: string
      new: string
    }>
  }

  is_sent: boolean
  sent_at?: string
  is_read: boolean
  read_at?: string

  email_sent: boolean
  email_sent_at?: string

  created_at: string
}

// ==============================================================================
// SERIES EDIT
// ==============================================================================

/**
 * Options for editing a recurring event series
 */
export interface SeriesEditOptions {
  /** Which occurrences to affect */
  scope: SeriesEditScope

  /** The occurrence being edited (for 'single' and 'this_and_future') */
  occurrence_date?: string

  /** Notify participants about the change */
  notify_participants?: boolean
}

/**
 * Request to update a series
 */
export interface UpdateSeriesRequest {
  series_id: string
  edit_options: SeriesEditOptions

  /** Updated event data */
  updates: {
    title_en?: string
    title_ar?: string
    description_en?: string
    description_ar?: string
    start_time?: string // HH:mm format - time component only
    end_time?: string
    duration_minutes?: number
    location?: string
  }

  /** Updated recurrence pattern (only for 'all' scope) */
  recurrence_updates?: Partial<CreateRecurrenceRuleInput>
}

/**
 * Request to delete occurrences from a series
 */
export interface DeleteOccurrenceRequest {
  series_id: string
  edit_options: SeriesEditOptions
  reason_en?: string
  reason_ar?: string
}

// ==============================================================================
// UI HELPERS
// ==============================================================================

/**
 * Human-readable recurrence pattern summary
 */
export interface RecurrenceSummary {
  /** Short description: "Every week on Mon, Wed, Fri" */
  short_en: string
  short_ar: string

  /** Long description with end date: "Every week on Monday, Wednesday, Friday until Dec 31, 2026" */
  long_en: string
  long_ar: string

  /** Next N occurrence dates */
  next_occurrences: string[]
}

/**
 * Preset recurrence patterns for quick selection
 */
export type RecurrencePreset =
  | 'daily'
  | 'weekdays'
  | 'weekly'
  | 'biweekly'
  | 'monthly_same_day'
  | 'monthly_same_weekday'
  | 'yearly'
  | 'custom'

/**
 * Map of preset to recurrence rule
 */
export const RECURRENCE_PRESETS: Record<
  RecurrencePreset,
  Partial<CreateRecurrenceRuleInput> | null
> = {
  daily: { frequency: 'daily', interval_count: 1 },
  weekdays: { frequency: 'weekly', interval_count: 1, days_of_week: [0, 1, 2, 3, 4] }, // Sun-Thu for Saudi Arabia
  weekly: { frequency: 'weekly', interval_count: 1 },
  biweekly: { frequency: 'weekly', interval_count: 2 },
  monthly_same_day: { frequency: 'monthly', interval_count: 1 },
  monthly_same_weekday: { frequency: 'monthly', interval_count: 1 },
  yearly: { frequency: 'yearly', interval_count: 1 },
  custom: null,
}

/**
 * Day of week labels
 */
export const DAY_OF_WEEK_LABELS = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
}

/**
 * Month labels
 */
export const MONTH_LABELS = {
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  ar: [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ],
}

/**
 * Week position labels
 */
export const WEEK_POSITION_LABELS: Record<MonthWeekPosition, { en: string; ar: string }> = {
  first: { en: 'First', ar: 'الأول' },
  second: { en: 'Second', ar: 'الثاني' },
  third: { en: 'Third', ar: 'الثالث' },
  fourth: { en: 'Fourth', ar: 'الرابع' },
  last: { en: 'Last', ar: 'الأخير' },
}

// ==============================================================================
// API RESPONSES
// ==============================================================================

/**
 * Response from creating a recurring event
 */
export interface CreateRecurringEventResponse {
  series: EventSeries
  master_event: CalendarEventWithRecurrence
  generated_occurrences: number
  next_occurrences: Array<{
    date: string
    event_id?: string
  }>
}

/**
 * Calendar event extended with recurrence information
 */
export interface CalendarEventWithRecurrence {
  id: string
  dossier_id: string
  event_type: string
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  start_datetime: string
  end_datetime: string
  timezone: string
  location_en?: string
  location_ar?: string
  status: string

  /** Recurrence fields */
  series_id?: string
  series?: EventSeries
  occurrence_date?: string
  is_exception: boolean
  exception_type?: ExceptionType
  original_start_datetime?: string
  is_master: boolean

  created_at: string
  updated_at: string
}

/**
 * Response for getting series occurrences
 */
export interface SeriesOccurrencesResponse {
  series: EventSeries
  recurrence_rule: RecurrenceRule
  exceptions: SeriesException[]
  occurrences: Array<{
    date: string
    event_id?: string
    is_exception: boolean
    exception_type?: ExceptionType
    status: 'scheduled' | 'cancelled' | 'modified'
  }>
  total_count: number
}
