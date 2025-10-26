import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

type EventType = 'main_event' | 'session' | 'plenary' | 'working_session' | 'ceremony' | 'reception';
type EventStatus = 'planned' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
type ParticipantType = 'user' | 'external_contact' | 'person_dossier';
type ParticipantRole = 'organizer' | 'speaker' | 'moderator' | 'panelist' | 'attendee' | 'observer' | 'vip' | 'support_staff';
type AttendanceStatus = 'invited' | 'confirmed' | 'tentative' | 'declined' | 'attended' | 'no_show';

interface CreateCalendarEventInput {
  dossier_id: string;
  event_type: EventType;
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  start_datetime: string; // ISO 8601 format
  end_datetime: string; // ISO 8601 format
  timezone?: string; // IANA timezone (e.g., "Asia/Riyadh")
  location_en?: string;
  location_ar?: string;
  is_virtual?: boolean;
  virtual_link?: string;
  room_en?: string;
  room_ar?: string;
  status?: EventStatus;
}

interface UpdateCalendarEventInput {
  event_type?: EventType;
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  start_datetime?: string;
  end_datetime?: string;
  timezone?: string;
  location_en?: string;
  location_ar?: string;
  is_virtual?: boolean;
  virtual_link?: string;
  room_en?: string;
  room_ar?: string;
  status?: EventStatus;
}

interface AddParticipantInput {
  event_id: string;
  participant_type: ParticipantType;
  participant_id: string;
  role: ParticipantRole;
  attendance_status?: AttendanceStatus;
}

/**
 * CalendarService - Manages calendar events and participants
 *
 * This service separates temporal event instances from dossier identity, enabling:
 * - Multi-event dossiers (e.g., forum with multiple sessions)
 * - Calendar-specific metadata (location, virtual link, room)
 * - Participant tracking with roles and attendance
 * - Date range queries for calendar views
 *
 * @example
 * // Create a forum with multiple sessions
 * const mainEvent = await calendarService.createCalendarEvent({
 *   dossier_id: 'g20-summit-uuid',
 *   event_type: 'main_event',
 *   title_en: 'G20 Summit 2025',
 *   start_datetime: '2025-06-15T09:00:00Z',
 *   end_datetime: '2025-06-17T18:00:00Z'
 * });
 *
 * const session1 = await calendarService.createCalendarEvent({
 *   dossier_id: 'g20-summit-uuid',
 *   event_type: 'session',
 *   title_en: 'Opening Ceremony',
 *   start_datetime: '2025-06-15T09:00:00Z',
 *   end_datetime: '2025-06-15T10:00:00Z'
 * });
 */
export class CalendarService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.supabase = createClient<Database>(
      supabaseUrl || process.env.SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_ANON_KEY!
    );
  }

  /**
   * Create a calendar event linked to a dossier
   * @param input - Event details including dates, location, etc.
   * @returns Created calendar event
   * @throws Error if datetime validation fails
   */
  async createCalendarEvent(input: CreateCalendarEventInput) {
    // Validate datetime range
    const start = new Date(input.start_datetime);
    const end = new Date(input.end_datetime);

    if (end <= start) {
      throw new Error('Cannot create calendar event: end_datetime must be > start_datetime');
    }

    // Validate virtual event requirements
    if (input.is_virtual && !input.virtual_link) {
      throw new Error('Cannot create virtual event: virtual_link is required when is_virtual = true');
    }

    const { data, error } = await this.supabase
      .from('calendar_events')
      .insert({
        ...input,
        timezone: input.timezone || 'Asia/Riyadh',
        is_virtual: input.is_virtual || false,
        status: input.status || 'planned',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all calendar events for a dossier
   * @param dossierId - UUID of the dossier
   * @param options - Filter options (status, event_type)
   * @returns Array of calendar events
   */
  async getEventsForDossier(
    dossierId: string,
    options: {
      status?: EventStatus;
      event_type?: EventType;
    } = {}
  ) {
    const { status, event_type } = options;

    let query = this.supabase
      .from('calendar_events')
      .select('*')
      .eq('dossier_id', dossierId)
      .order('start_datetime', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (event_type) {
      query = query.eq('event_type', event_type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get calendar events in a date range
   * @param startDate - Start of date range (ISO 8601)
   * @param endDate - End of date range (ISO 8601)
   * @param options - Filter options
   * @returns Array of calendar events within range
   */
  async getEventsInDateRange(
    startDate: string,
    endDate: string,
    options: {
      status?: EventStatus[];
      event_type?: EventType;
      dossier_id?: string;
    } = {}
  ) {
    const { status, event_type, dossier_id } = options;

    let query = this.supabase
      .from('calendar_events')
      .select(`
        *,
        dossier:dossier_id(id, type, name_en, name_ar, status)
      `)
      .gte('start_datetime', startDate)
      .lte('end_datetime', endDate)
      .order('start_datetime', { ascending: true });

    if (status && status.length > 0) {
      query = query.in('status', status);
    }

    if (event_type) {
      query = query.eq('event_type', event_type);
    }

    if (dossier_id) {
      query = query.eq('dossier_id', dossier_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Update a calendar event
   * @param eventId - UUID of the calendar event
   * @param input - Fields to update
   * @returns Updated calendar event
   */
  async updateCalendarEvent(eventId: string, input: UpdateCalendarEventInput) {
    // Validate datetime range if both provided
    if (input.start_datetime && input.end_datetime) {
      const start = new Date(input.start_datetime);
      const end = new Date(input.end_datetime);

      if (end <= start) {
        throw new Error('Cannot update calendar event: end_datetime must be > start_datetime');
      }
    }

    const { data, error } = await this.supabase
      .from('calendar_events')
      .update(input)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a calendar event
   * @param eventId - UUID of the calendar event
   * @returns Success status
   */
  async deleteCalendarEvent(eventId: string) {
    const { error } = await this.supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Cancel a calendar event (soft delete via status change)
   * @param eventId - UUID of the calendar event
   * @returns Updated calendar event with cancelled status
   */
  async cancelCalendarEvent(eventId: string) {
    return this.updateCalendarEvent(eventId, { status: 'cancelled' });
  }

  /**
   * Add a participant to a calendar event
   * @param input - Participant details including type, id, role
   * @returns Created event participant record
   */
  async addEventParticipant(input: AddParticipantInput) {
    const { data, error } = await this.supabase
      .from('event_participants')
      .insert({
        ...input,
        attendance_status: input.attendance_status || 'invited',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all participants for a calendar event
   * @param eventId - UUID of the calendar event
   * @param options - Filter options (role, attendance_status)
   * @returns Array of event participants
   */
  async getEventParticipants(
    eventId: string,
    options: {
      role?: ParticipantRole;
      attendance_status?: AttendanceStatus;
    } = {}
  ) {
    const { role, attendance_status } = options;

    let query = this.supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', eventId);

    if (role) {
      query = query.eq('role', role);
    }

    if (attendance_status) {
      query = query.eq('attendance_status', attendance_status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Update participant attendance status
   * @param participantId - UUID of the event participant record
   * @param attendanceStatus - New attendance status
   * @returns Updated participant record
   */
  async updateParticipantStatus(
    participantId: string,
    attendanceStatus: AttendanceStatus
  ) {
    const { data, error } = await this.supabase
      .from('event_participants')
      .update({ attendance_status: attendanceStatus })
      .eq('id', participantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove a participant from a calendar event
   * @param participantId - UUID of the event participant record
   * @returns Success status
   */
  async removeEventParticipant(participantId: string) {
    const { error } = await this.supabase
      .from('event_participants')
      .delete()
      .eq('id', participantId);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Get upcoming events (next N days)
   * @param days - Number of days to look ahead (default 7)
   * @param options - Filter options
   * @returns Array of upcoming calendar events
   */
  async getUpcomingEvents(
    days: number = 7,
    options: {
      status?: EventStatus[];
      dossier_id?: string;
    } = {}
  ) {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.getEventsInDateRange(
      now.toISOString(),
      future.toISOString(),
      options
    );
  }

  /**
   * Get event statistics for a dossier
   * @param dossierId - UUID of the dossier
   * @returns Event count by status and type
   */
  async getEventStats(dossierId: string) {
    const { data, error } = await this.supabase
      .from('calendar_events')
      .select('status, event_type')
      .eq('dossier_id', dossierId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      by_status: {} as Record<string, number>,
      by_type: {} as Record<string, number>,
    };

    data?.forEach((event) => {
      stats.by_status[event.status] = (stats.by_status[event.status] || 0) + 1;
      stats.by_type[event.event_type] = (stats.by_type[event.event_type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get participant statistics for an event
   * @param eventId - UUID of the calendar event
   * @returns Participant count by role and attendance status
   */
  async getParticipantStats(eventId: string) {
    const { data, error } = await this.supabase
      .from('event_participants')
      .select('role, attendance_status')
      .eq('event_id', eventId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      by_role: {} as Record<string, number>,
      by_status: {} as Record<string, number>,
    };

    data?.forEach((participant) => {
      stats.by_role[participant.role] = (stats.by_role[participant.role] || 0) + 1;
      stats.by_status[participant.attendance_status] = (stats.by_status[participant.attendance_status] || 0) + 1;
    });

    return stats;
  }
}

export default CalendarService;
