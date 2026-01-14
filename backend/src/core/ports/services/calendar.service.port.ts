/**
 * Calendar Service Port
 *
 * Defines the contract for calendar operations.
 * This is an Anti-Corruption Layer (ACL) port that abstracts
 * calendar provider implementations (Google Calendar, Outlook, Exchange, etc.)
 *
 * @module core/ports/services/calendar.service.port
 */

/**
 * Calendar attendee - domain model
 */
export interface CalendarAttendee {
  id?: string
  email: string
  name?: string
  status?: 'pending' | 'accepted' | 'declined' | 'tentative'
  optional?: boolean
  organizer?: boolean
}

/**
 * Calendar recurrence rule
 */
export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval?: number // Every n frequency (e.g., every 2 weeks)
  until?: Date
  count?: number
  byDay?: Array<'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA'>
  byMonthDay?: number[]
  byMonth?: number[]
}

/**
 * Calendar reminder
 */
export interface CalendarReminder {
  method: 'email' | 'popup' | 'sms'
  minutes: number // Minutes before event
}

/**
 * Calendar event - domain model
 */
export interface CalendarEvent {
  id?: string
  title: string
  description?: string
  location?: string
  startTime: Date
  endTime: Date
  allDay?: boolean
  timezone?: string
  attendees?: CalendarAttendee[]
  organizer?: CalendarAttendee
  recurrence?: RecurrenceRule
  reminders?: CalendarReminder[]
  visibility?: 'public' | 'private' | 'confidential'
  status?: 'confirmed' | 'tentative' | 'cancelled'
  color?: string
  metadata?: Record<string, unknown>
  conferenceLink?: string
  attachments?: Array<{
    name: string
    url: string
    mimeType?: string
  }>
}

/**
 * Calendar event create request
 */
export interface CreateEventRequest {
  event: Omit<CalendarEvent, 'id'>
  calendarId?: string
  sendNotifications?: boolean
  conferenceType?: 'none' | 'meet' | 'teams' | 'zoom'
}

/**
 * Calendar event update request
 */
export interface UpdateEventRequest {
  eventId: string
  calendarId?: string
  updates: Partial<CalendarEvent>
  sendNotifications?: boolean
  updateSeries?: boolean // For recurring events
}

/**
 * Calendar query parameters
 */
export interface CalendarQueryParams {
  calendarId?: string
  startDate: Date
  endDate: Date
  query?: string
  attendeeEmail?: string
  showDeleted?: boolean
  maxResults?: number
  pageToken?: string
}

/**
 * Calendar query result
 */
export interface CalendarQueryResult {
  events: CalendarEvent[]
  nextPageToken?: string
  totalCount?: number
}

/**
 * Free/busy time slot
 */
export interface FreeBusySlot {
  start: Date
  end: Date
  status: 'busy' | 'tentative' | 'free'
}

/**
 * Free/busy query result
 */
export interface FreeBusyResult {
  email: string
  slots: FreeBusySlot[]
  error?: string
}

/**
 * Calendar availability response
 */
export interface AvailabilityResponse {
  calendars: Map<string, FreeBusyResult>
  conflicts: Array<{
    start: Date
    end: Date
    attendees: string[]
  }>
}

/**
 * Calendar event result
 */
export interface CalendarEventResult {
  success: boolean
  eventId?: string
  provider: string
  conferenceLink?: string
  error?: {
    code: string
    message: string
    retryable: boolean
  }
}

/**
 * Calendar sync token for incremental sync
 */
export interface CalendarSyncState {
  syncToken: string
  lastSyncAt: Date
  calendarId: string
}

/**
 * Calendar webhook event
 */
export interface CalendarWebhookEvent {
  eventType: 'event_created' | 'event_updated' | 'event_deleted' | 'attendee_response'
  calendarId: string
  eventId: string
  timestamp: Date
  data: {
    changes?: Partial<CalendarEvent>
    attendeeEmail?: string
    responseStatus?: 'accepted' | 'declined' | 'tentative'
  }
  rawPayload: unknown
}

/**
 * Calendar information
 */
export interface CalendarInfo {
  id: string
  name: string
  description?: string
  timezone: string
  isPrimary: boolean
  accessRole: 'owner' | 'writer' | 'reader' | 'freeBusyReader'
  color?: string
}

/**
 * Calendar Service Port
 *
 * Contract for calendar operations. Implementations can use
 * Google Calendar, Microsoft Outlook, Exchange, or internal calendars.
 *
 * This serves as an Anti-Corruption Layer (ACL) to prevent
 * external calendar API changes from affecting the domain.
 */
export interface ICalendarService {
  /**
   * Create a calendar event
   */
  createEvent(request: CreateEventRequest): Promise<CalendarEventResult>

  /**
   * Update a calendar event
   */
  updateEvent(request: UpdateEventRequest): Promise<CalendarEventResult>

  /**
   * Delete a calendar event
   */
  deleteEvent(
    eventId: string,
    calendarId?: string,
    options?: {
      sendNotifications?: boolean
      deleteSeries?: boolean
    },
  ): Promise<CalendarEventResult>

  /**
   * Get a calendar event by ID
   */
  getEvent(eventId: string, calendarId?: string): Promise<CalendarEvent | null>

  /**
   * Query calendar events
   */
  queryEvents(params: CalendarQueryParams): Promise<CalendarQueryResult>

  /**
   * Get free/busy information for attendees
   */
  getAvailability(
    attendeeEmails: string[],
    startTime: Date,
    endTime: Date,
  ): Promise<AvailabilityResponse>

  /**
   * Find next available slot for all attendees
   */
  findAvailableSlot(
    attendeeEmails: string[],
    durationMinutes: number,
    startAfter: Date,
    endBefore: Date,
    workingHoursOnly?: boolean,
  ): Promise<{ start: Date; end: Date } | null>

  /**
   * Get list of accessible calendars
   */
  listCalendars(): Promise<CalendarInfo[]>

  /**
   * Sync calendar events (incremental sync)
   */
  syncEvents(syncState?: CalendarSyncState): Promise<{
    events: CalendarEvent[]
    deletedEventIds: string[]
    newSyncState: CalendarSyncState
  }>

  /**
   * Parse webhook event from provider
   */
  parseWebhookEvent(payload: unknown, headers?: Record<string, string>): CalendarWebhookEvent

  /**
   * Subscribe to calendar changes (webhook setup)
   */
  subscribeToChanges(
    calendarId: string,
    webhookUrl: string,
    expiresAt?: Date,
  ): Promise<{
    subscriptionId: string
    expiresAt: Date
  }>

  /**
   * Unsubscribe from calendar changes
   */
  unsubscribeFromChanges(subscriptionId: string): Promise<boolean>

  /**
   * Check if the calendar service is available
   */
  isAvailable(): Promise<boolean>

  /**
   * Get provider name
   */
  getProviderName(): string

  /**
   * Test connection to calendar provider
   */
  testConnection(): Promise<boolean>
}

/**
 * Calendar service token for dependency injection
 */
export const CALENDAR_SERVICE_TOKEN = Symbol('ICalendarService')
