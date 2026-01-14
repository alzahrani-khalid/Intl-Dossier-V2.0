/**
 * Supabase Calendar Adapter
 *
 * Anti-Corruption Layer (ACL) adapter that implements ICalendarService
 * using Supabase as the underlying calendar storage.
 *
 * This adapter translates domain calendar requests to Supabase-specific
 * database operations and transforms responses back to domain models.
 *
 * @module adapters/external/calendar/supabase.calendar.adapter
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type {
  ICalendarService,
  CalendarEvent,
  CreateEventRequest,
  UpdateEventRequest,
  CalendarQueryParams,
  CalendarQueryResult,
  AvailabilityResponse,
  CalendarEventResult,
  CalendarSyncState,
  CalendarWebhookEvent,
  CalendarInfo,
  FreeBusyResult,
} from '../../../core/ports/services'

/**
 * Supabase calendar adapter configuration
 */
export interface SupabaseCalendarAdapterConfig {
  supabaseUrl: string
  supabaseKey: string
  tableName?: string
  defaultTimezone?: string
}

/**
 * Database calendar event model (external/DB model)
 */
interface DBCalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  start_time: string
  end_time: string
  all_day: boolean
  timezone: string
  attendees?: Array<{
    id?: string
    email: string
    name?: string
    status?: string
    optional?: boolean
    organizer?: boolean
  }>
  organizer_id?: string
  organizer_email?: string
  organizer_name?: string
  recurrence?: {
    frequency: string
    interval?: number
    until?: string
    count?: number
    byDay?: string[]
    byMonthDay?: number[]
    byMonth?: number[]
  }
  reminders?: Array<{
    method: string
    minutes: number
  }>
  visibility: string
  status: string
  color?: string
  metadata?: Record<string, unknown>
  conference_link?: string
  attachments?: Array<{
    name: string
    url: string
    mimeType?: string
  }>
  created_at: string
  updated_at: string
  deleted_at?: string
  calendar_id: string
  tenant_id?: string
}

/**
 * Supabase Calendar Adapter
 *
 * Implements ICalendarService using Supabase for calendar storage.
 * Acts as an Anti-Corruption Layer protecting the domain from database schema changes.
 */
export class SupabaseCalendarAdapter implements ICalendarService {
  private readonly client: SupabaseClient
  private readonly config: SupabaseCalendarAdapterConfig
  private readonly tableName: string

  constructor(config: SupabaseCalendarAdapterConfig) {
    this.config = config
    this.tableName = config.tableName ?? 'calendar_events'
    this.client = createClient(config.supabaseUrl, config.supabaseKey)
  }

  /**
   * Transform domain CalendarEvent to database model
   */
  private transformToDB(
    event: Omit<CalendarEvent, 'id'>,
    calendarId: string,
  ): Partial<DBCalendarEvent> {
    return {
      title: event.title,
      description: event.description,
      location: event.location,
      start_time: event.startTime.toISOString(),
      end_time: event.endTime.toISOString(),
      all_day: event.allDay ?? false,
      timezone: event.timezone ?? this.config.defaultTimezone ?? 'UTC',
      attendees: event.attendees?.map((a) => ({
        id: a.id,
        email: a.email,
        name: a.name,
        status: a.status,
        optional: a.optional,
        organizer: a.organizer,
      })),
      organizer_email: event.organizer?.email,
      organizer_name: event.organizer?.name,
      recurrence: event.recurrence
        ? {
            frequency: event.recurrence.frequency,
            interval: event.recurrence.interval,
            until: event.recurrence.until?.toISOString(),
            count: event.recurrence.count,
            byDay: event.recurrence.byDay,
            byMonthDay: event.recurrence.byMonthDay,
            byMonth: event.recurrence.byMonth,
          }
        : undefined,
      reminders: event.reminders?.map((r) => ({
        method: r.method,
        minutes: r.minutes,
      })),
      visibility: event.visibility ?? 'private',
      status: event.status ?? 'confirmed',
      color: event.color,
      metadata: event.metadata,
      conference_link: event.conferenceLink,
      attachments: event.attachments,
      calendar_id: calendarId,
    }
  }

  /**
   * Transform database model to domain CalendarEvent
   */
  private transformFromDB(dbEvent: DBCalendarEvent): CalendarEvent {
    return {
      id: dbEvent.id,
      title: dbEvent.title,
      description: dbEvent.description,
      location: dbEvent.location,
      startTime: new Date(dbEvent.start_time),
      endTime: new Date(dbEvent.end_time),
      allDay: dbEvent.all_day,
      timezone: dbEvent.timezone,
      attendees: dbEvent.attendees?.map((a) => ({
        id: a.id,
        email: a.email,
        name: a.name,
        status: a.status as 'pending' | 'accepted' | 'declined' | 'tentative',
        optional: a.optional,
        organizer: a.organizer,
      })),
      organizer: dbEvent.organizer_email
        ? {
            email: dbEvent.organizer_email,
            name: dbEvent.organizer_name,
          }
        : undefined,
      recurrence: dbEvent.recurrence
        ? {
            frequency: dbEvent.recurrence.frequency as 'daily' | 'weekly' | 'monthly' | 'yearly',
            interval: dbEvent.recurrence.interval,
            until: dbEvent.recurrence.until ? new Date(dbEvent.recurrence.until) : undefined,
            count: dbEvent.recurrence.count,
            byDay: dbEvent.recurrence.byDay as Array<
              'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA'
            >,
            byMonthDay: dbEvent.recurrence.byMonthDay,
            byMonth: dbEvent.recurrence.byMonth,
          }
        : undefined,
      reminders: dbEvent.reminders?.map((r) => ({
        method: r.method as 'email' | 'popup' | 'sms',
        minutes: r.minutes,
      })),
      visibility: dbEvent.visibility as 'public' | 'private' | 'confidential',
      status: dbEvent.status as 'confirmed' | 'tentative' | 'cancelled',
      color: dbEvent.color,
      metadata: dbEvent.metadata,
      conferenceLink: dbEvent.conference_link,
      attachments: dbEvent.attachments,
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(request: CreateEventRequest): Promise<CalendarEventResult> {
    try {
      const calendarId = request.calendarId ?? 'default'
      const dbEvent = this.transformToDB(request.event, calendarId)

      const { data, error } = await this.client
        .from(this.tableName)
        .insert(dbEvent)
        .select('id')
        .single()

      if (error) {
        return {
          success: false,
          provider: 'supabase',
          error: {
            code: error.code,
            message: error.message,
            retryable: this.isRetryableError(error),
          },
        }
      }

      return {
        success: true,
        eventId: data.id,
        provider: 'supabase',
        conferenceLink: request.event.conferenceLink,
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      return {
        success: false,
        provider: 'supabase',
        error: {
          code: 'CREATE_EVENT_FAILED',
          message: err.message,
          retryable: false,
        },
      }
    }
  }

  /**
   * Update a calendar event
   */
  async updateEvent(request: UpdateEventRequest): Promise<CalendarEventResult> {
    try {
      const updates: Partial<DBCalendarEvent> = {}

      if (request.updates.title !== undefined) updates.title = request.updates.title
      if (request.updates.description !== undefined)
        updates.description = request.updates.description
      if (request.updates.location !== undefined) updates.location = request.updates.location
      if (request.updates.startTime !== undefined)
        updates.start_time = request.updates.startTime.toISOString()
      if (request.updates.endTime !== undefined)
        updates.end_time = request.updates.endTime.toISOString()
      if (request.updates.allDay !== undefined) updates.all_day = request.updates.allDay
      if (request.updates.timezone !== undefined) updates.timezone = request.updates.timezone
      if (request.updates.attendees !== undefined)
        updates.attendees = request.updates.attendees?.map((a) => ({
          id: a.id,
          email: a.email,
          name: a.name,
          status: a.status,
          optional: a.optional,
          organizer: a.organizer,
        }))
      if (request.updates.visibility !== undefined) updates.visibility = request.updates.visibility
      if (request.updates.status !== undefined) updates.status = request.updates.status
      if (request.updates.color !== undefined) updates.color = request.updates.color
      if (request.updates.conferenceLink !== undefined)
        updates.conference_link = request.updates.conferenceLink

      const { error } = await this.client
        .from(this.tableName)
        .update(updates)
        .eq('id', request.eventId)

      if (error) {
        return {
          success: false,
          eventId: request.eventId,
          provider: 'supabase',
          error: {
            code: error.code,
            message: error.message,
            retryable: this.isRetryableError(error),
          },
        }
      }

      return {
        success: true,
        eventId: request.eventId,
        provider: 'supabase',
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      return {
        success: false,
        eventId: request.eventId,
        provider: 'supabase',
        error: {
          code: 'UPDATE_EVENT_FAILED',
          message: err.message,
          retryable: false,
        },
      }
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(
    eventId: string,
    _calendarId?: string,
    _options?: { sendNotifications?: boolean; deleteSeries?: boolean },
  ): Promise<CalendarEventResult> {
    try {
      // Soft delete by setting deleted_at
      const { error } = await this.client
        .from(this.tableName)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', eventId)

      if (error) {
        return {
          success: false,
          eventId,
          provider: 'supabase',
          error: {
            code: error.code,
            message: error.message,
            retryable: this.isRetryableError(error),
          },
        }
      }

      return {
        success: true,
        eventId,
        provider: 'supabase',
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      return {
        success: false,
        eventId,
        provider: 'supabase',
        error: {
          code: 'DELETE_EVENT_FAILED',
          message: err.message,
          retryable: false,
        },
      }
    }
  }

  /**
   * Get a calendar event by ID
   */
  async getEvent(eventId: string, _calendarId?: string): Promise<CalendarEvent | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', eventId)
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      return null
    }

    return this.transformFromDB(data as DBCalendarEvent)
  }

  /**
   * Query calendar events
   */
  async queryEvents(params: CalendarQueryParams): Promise<CalendarQueryResult> {
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .gte('start_time', params.startDate.toISOString())
      .lte('end_time', params.endDate.toISOString())
      .order('start_time', { ascending: true })

    if (params.calendarId) {
      query = query.eq('calendar_id', params.calendarId)
    }

    if (params.query) {
      query = query.or(`title.ilike.%${params.query}%,description.ilike.%${params.query}%`)
    }

    if (params.attendeeEmail) {
      query = query.contains('attendees', [{ email: params.attendeeEmail }])
    }

    if (params.maxResults) {
      query = query.limit(params.maxResults)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to query events: ${error.message}`)
    }

    return {
      events: (data as DBCalendarEvent[]).map((e) => this.transformFromDB(e)),
      totalCount: count ?? undefined,
    }
  }

  /**
   * Get free/busy information
   */
  async getAvailability(
    attendeeEmails: string[],
    startTime: Date,
    endTime: Date,
  ): Promise<AvailabilityResponse> {
    const calendars = new Map<string, FreeBusyResult>()
    const conflicts: Array<{ start: Date; end: Date; attendees: string[] }> = []

    // Query events for each attendee
    for (const email of attendeeEmails) {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('start_time, end_time, status')
        .is('deleted_at', null)
        .gte('start_time', startTime.toISOString())
        .lte('end_time', endTime.toISOString())
        .contains('attendees', [{ email }])

      if (error) {
        calendars.set(email, {
          email,
          slots: [],
          error: error.message,
        })
        continue
      }

      const slots = (data || []).map(
        (event: { start_time: string; end_time: string; status: string }) => ({
          start: new Date(event.start_time),
          end: new Date(event.end_time),
          status: event.status === 'tentative' ? ('tentative' as const) : ('busy' as const),
        }),
      )

      calendars.set(email, { email, slots })
    }

    // Find conflicts (overlapping busy times)
    // Simple algorithm - compare all pairs of attendees
    const emailList = Array.from(calendars.keys())
    for (let i = 0; i < emailList.length; i++) {
      const email1 = emailList[i] as string
      const slots1 = calendars.get(email1)?.slots || []

      for (let j = i + 1; j < emailList.length; j++) {
        const email2 = emailList[j] as string
        const slots2 = calendars.get(email2)?.slots || []

        for (const slot1 of slots1) {
          for (const slot2 of slots2) {
            if (slot1.start < slot2.end && slot2.start < slot1.end) {
              conflicts.push({
                start: new Date(Math.max(slot1.start.getTime(), slot2.start.getTime())),
                end: new Date(Math.min(slot1.end.getTime(), slot2.end.getTime())),
                attendees: [email1, email2],
              })
            }
          }
        }
      }
    }

    return { calendars, conflicts }
  }

  /**
   * Find next available slot
   */
  async findAvailableSlot(
    attendeeEmails: string[],
    durationMinutes: number,
    startAfter: Date,
    endBefore: Date,
    workingHoursOnly?: boolean,
  ): Promise<{ start: Date; end: Date } | null> {
    const availability = await this.getAvailability(attendeeEmails, startAfter, endBefore)

    // Collect all busy slots
    const allBusySlots: Array<{ start: Date; end: Date }> = []
    for (const result of availability.calendars.values()) {
      allBusySlots.push(...result.slots.filter((s) => s.status === 'busy'))
    }

    // Sort by start time
    allBusySlots.sort((a, b) => a.start.getTime() - b.start.getTime())

    // Find gaps
    let currentTime = startAfter
    const durationMs = durationMinutes * 60 * 1000

    for (const slot of allBusySlots) {
      // Check if there's a gap before this busy slot
      if (slot.start.getTime() - currentTime.getTime() >= durationMs) {
        const proposedEnd = new Date(currentTime.getTime() + durationMs)

        // Check working hours if required
        if (workingHoursOnly) {
          const hour = currentTime.getHours()
          if (hour >= 9 && hour < 17) {
            return { start: currentTime, end: proposedEnd }
          }
        } else {
          return { start: currentTime, end: proposedEnd }
        }
      }

      // Move current time past this busy slot
      if (slot.end > currentTime) {
        currentTime = slot.end
      }
    }

    // Check the remaining time after all busy slots
    if (endBefore.getTime() - currentTime.getTime() >= durationMs) {
      const proposedEnd = new Date(currentTime.getTime() + durationMs)
      if (proposedEnd <= endBefore) {
        return { start: currentTime, end: proposedEnd }
      }
    }

    return null
  }

  /**
   * List accessible calendars
   */
  async listCalendars(): Promise<CalendarInfo[]> {
    // For Supabase adapter, we use a simple calendar structure
    return [
      {
        id: 'default',
        name: 'Default Calendar',
        description: 'Main calendar',
        timezone: this.config.defaultTimezone ?? 'UTC',
        isPrimary: true,
        accessRole: 'owner',
      },
    ]
  }

  /**
   * Sync calendar events
   */
  async syncEvents(syncState?: CalendarSyncState): Promise<{
    events: CalendarEvent[]
    deletedEventIds: string[]
    newSyncState: CalendarSyncState
  }> {
    const lastSync = syncState?.lastSyncAt ?? new Date(0)

    // Get updated events
    const { data: updatedData } = await this.client
      .from(this.tableName)
      .select('*')
      .is('deleted_at', null)
      .gt('updated_at', lastSync.toISOString())

    // Get deleted events
    const { data: deletedData } = await this.client
      .from(this.tableName)
      .select('id')
      .not('deleted_at', 'is', null)
      .gt('deleted_at', lastSync.toISOString())

    return {
      events: ((updatedData as DBCalendarEvent[]) || []).map((e) => this.transformFromDB(e)),
      deletedEventIds: (deletedData || []).map((e: { id: string }) => e.id),
      newSyncState: {
        syncToken: `sync_${Date.now()}`,
        lastSyncAt: new Date(),
        calendarId: syncState?.calendarId ?? 'default',
      },
    }
  }

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: unknown, _headers?: Record<string, string>): CalendarWebhookEvent {
    const event = payload as {
      type: string
      table: string
      record: DBCalendarEvent
      old_record?: DBCalendarEvent
    }

    const eventTypeMap: Record<string, CalendarWebhookEvent['eventType']> = {
      INSERT: 'event_created',
      UPDATE: 'event_updated',
      DELETE: 'event_deleted',
    }

    return {
      eventType: eventTypeMap[event.type] || 'event_updated',
      calendarId: event.record.calendar_id,
      eventId: event.record.id,
      timestamp: new Date(),
      data: {
        changes: event.old_record ? this.transformFromDB(event.record) : undefined,
      },
      rawPayload: payload,
    }
  }

  /**
   * Subscribe to calendar changes (Supabase Realtime)
   */
  async subscribeToChanges(
    calendarId: string,
    _webhookUrl: string,
    expiresAt?: Date,
  ): Promise<{ subscriptionId: string; expiresAt: Date }> {
    // Supabase uses realtime subscriptions, not webhooks
    // This would be handled differently in a real implementation
    const subscriptionId = `sub_${calendarId}_${Date.now()}`
    const defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    return {
      subscriptionId,
      expiresAt: expiresAt ?? defaultExpiry,
    }
  }

  /**
   * Unsubscribe from calendar changes
   */
  async unsubscribeFromChanges(_subscriptionId: string): Promise<boolean> {
    // Would need to track and remove Supabase realtime subscriptions
    return true
  }

  /**
   * Check if service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const { error } = await this.client.from(this.tableName).select('id').limit(1)
      return !error
    } catch {
      return false
    }
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'supabase'
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    return this.isAvailable()
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: { code: string; message: string }): boolean {
    const retryableCodes = ['PGRST301', 'PGRST502', '503']
    return retryableCodes.includes(error.code) || error.message.includes('timeout')
  }
}

/**
 * Factory function to create SupabaseCalendarAdapter
 */
export function createSupabaseCalendarAdapter(
  config: SupabaseCalendarAdapterConfig,
): SupabaseCalendarAdapter {
  return new SupabaseCalendarAdapter(config)
}
