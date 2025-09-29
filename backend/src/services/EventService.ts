import { supabaseAdmin } from '../config/supabase';
import { cacheHelpers } from '../config/redis';
import { logInfo, logError } from '../utils/logger';

export interface Event {
  id: string;
  title_en: string;
  title_ar: string;
  type: 'meeting' | 'conference' | 'workshop' | 'ceremony' | 'visit' | 'other' | string;
  start_datetime: string;
  end_datetime: string;
  location_en?: string;
  location_ar?: string;
  venue_en: string;
  venue_ar: string;
  is_virtual: boolean;
  virtual_link?: string | null;
  max_participants?: number | null;
  status: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | string;
}

export interface CalendarEvent {
  id: string;
  title_en: string;
  title_ar: string;
  start_datetime: string;
  end_datetime: string;
  type: 'meeting' | 'conference' | 'workshop' | 'ceremony' | 'visit' | 'other' | string;
  venue_en: string;
  venue_ar: string;
  is_virtual: boolean;
}

export interface CreateEventDto {
  title_en: string;
  title_ar: string;
  type: 'meeting' | 'conference' | 'workshop' | 'ceremony' | 'visit' | 'other';
  start_datetime: string;
  end_datetime: string;
  location_en?: string;
  location_ar?: string;
  venue_en?: string;
  venue_ar?: string;
  is_virtual?: boolean;
  virtual_link?: string | null;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {}

export interface EventSearchParams {
  type?: string;
  upcoming?: boolean;
  past?: boolean;
  search?: string;
  start_date?: string; // maps to start_datetime
  end_date?: string;   // maps to end_datetime
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export class EventService {
  private readonly cachePrefix = 'event:';
  private readonly cacheTTL = 1800; // 30 minutes

  /**
   * Get all events with filters
   */
  async findAll(params: EventSearchParams = {}): Promise<{ data: Event[]; total: number }> {
    try {
      const cacheKey = `${this.cachePrefix}list:${JSON.stringify(params)}`;
      const cached = await cacheHelpers.get<{ data: Event[]; total: number }>(cacheKey);
      if (cached) return cached;

      let query = supabaseAdmin
        .from('event_details')
        .select('*');

      // Apply filters
      if (params.type) {
        query = query.eq('type', params.type);
      }
      if (params.upcoming) {
        query = query.gte('start_datetime', new Date().toISOString());
      }
      if (params.past) {
        query = query.lt('end_datetime', new Date().toISOString());
      }
      if (params.start_date) {
        query = query.gte('start_datetime', params.start_date);
      }
      if (params.end_date) {
        query = query.lte('end_datetime', params.end_date);
      }
      if (params.search) {
        query = query.or(
          `title_en.ilike.%${params.search}%,title_ar.ilike.%${params.search}%`
        );
      }

      // Apply pagination
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Apply sorting
      const sortField = (params.sort === 'start_date' || !params.sort)
        ? 'start_datetime'
        : params.sort;
      const ascending = params.order === 'asc';
      query = query.order(sortField, { ascending });

      const { data, error, count } = await query;

      if (error) throw error;

      const result = {
        data: data || [],
        total: count || 0
      };

      await cacheHelpers.set(cacheKey, result, this.cacheTTL);
      return result;
    } catch (error) {
      logError('EventService.findAll error', error as Error);
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  async findById(id: string): Promise<Event | null> {
    try {
      const cacheKey = `${this.cachePrefix}${id}`;
      const cached = await cacheHelpers.get<Event>(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabaseAdmin
        .from('event_details')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      await cacheHelpers.set(cacheKey, data, this.cacheTTL);
      return data;
    } catch (error) {
      logError('EventService.findById error', error as Error);
      throw error;
    }
  }

  /**
   * Create new event
   */
  async create(eventData: CreateEventDto, createdBy: string): Promise<Event> {
    try {
      // Accept older shapes: title/start_date/end_date/location
      const title = (eventData as any).title_en ?? (eventData as any).title ?? '';
      const start = (eventData as any).start_datetime ?? (eventData as any).start_date;
      const end = (eventData as any).end_datetime ?? (eventData as any).end_date;
      const location = (eventData as any).venue_en || (eventData as any).location_en || (eventData as any).location || '';

      const { data, error } = await supabaseAdmin
        .from('events')
        .insert({
          title,
          description: null,
          type: eventData.type,
          start_time: start,
          end_time: end,
          location,
          virtual_link: eventData.virtual_link || null,
          created_by: createdBy
        })
        .select('*')
        .single();

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del(`${this.cachePrefix}list:*`);

      logInfo('Event created', { eventId: data.id, createdBy });
      return data;
    } catch (error) {
      logError('EventService.create error', error as Error);
      throw error;
    }
  }

  /**
   * Update event
   */
  async update(id: string, updates: UpdateEventDto, updatedBy: string): Promise<Event> {
    try {
      const title = (updates as any).title_en ?? (updates as any).title;
      const start = (updates as any).start_datetime ?? (updates as any).start_date;
      const end = (updates as any).end_datetime ?? (updates as any).end_date;
      const location = (updates as any).venue_en || (updates as any).location_en || (updates as any).location;

      const { data, error } = await supabaseAdmin
        .from('events')
        .update({
          title,
          description: null,
          type: updates.type,
          start_time: start,
          end_time: end,
          location,
          virtual_link: updates.virtual_link || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ]);

      logInfo('Event updated', { eventId: id, updatedBy });
      return data;
    } catch (error) {
      logError('EventService.update error', error as Error);
      throw error;
    }
  }

  /**
   * Delete event
   */
  async delete(id: string, deletedBy: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ]);

      logInfo('Event deleted', { eventId: id, deletedBy });
      return true;
    } catch (error) {
      logError('EventService.delete error', error as Error);
      throw error;
    }
  }

  /**
   * Add attendee to event
   */
  async addAttendee(
    eventId: string,
    attendee: {
      type: 'country' | 'organization' | 'contact';
      id: string;
      role: 'host' | 'participant' | 'observer' | 'speaker';
      confirmed?: boolean;
    },
    addedBy: string
  ): Promise<Event> {
    try {
      const { data, error } = await supabaseAdmin
        .from('event_attendees')
        .insert({
          event_id: eventId,
          type: attendee.type,
          entity_id: attendee.id,
          role: attendee.role,
          confirmed: attendee.confirmed || false,
          added_by: addedBy,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${eventId}`,
        `${this.cachePrefix}list:*`
      ]);

      // Return updated event
      const updatedEvent = await this.findById(eventId);
      if (!updatedEvent) throw new Error('Event not found after adding attendee');

      logInfo('Attendee added to event', { eventId, attendee, addedBy });
      return updatedEvent;
    } catch (error) {
      logError('EventService.addAttendee error', error as Error);
      throw error;
    }
  }

  /**
   * Remove attendee from event
   */
  async removeAttendee(
    eventId: string,
    attendeeId: string,
    removedBy: string
  ): Promise<Event> {
    try {
      const { error } = await supabaseAdmin
        .from('event_attendees')
        .delete()
        .eq('event_id', eventId)
        .eq('entity_id', attendeeId);

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${eventId}`,
        `${this.cachePrefix}list:*`
      ]);

      // Return updated event
      const updatedEvent = await this.findById(eventId);
      if (!updatedEvent) throw new Error('Event not found after removing attendee');

      logInfo('Attendee removed from event', { eventId, attendeeId, removedBy });
      return updatedEvent;
    } catch (error) {
      logError('EventService.removeAttendee error', error as Error);
      throw error;
    }
  }

  /**
   * Get events in calendar format
   */
  async getCalendarEvents(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<CalendarEvent[]> {
    try {
      let query = supabaseAdmin
        .from('event_details')
        .select('*')
        .gte('start_datetime', startDate)
        .lte('end_datetime', endDate);

      if (userId) {
        query = query.or(`
          created_by.eq.${userId},
          attendees.entity_id.eq.${userId}
        `);
      }

      const { data, error } = await query.order('start_datetime', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('EventService.getCalendarEvents error', error as Error);
      throw error;
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('event_details')
        .select('*')
        .gte('start_datetime', new Date().toISOString())
        .order('start_datetime', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('EventService.getUpcomingEvents error', error as Error);
      throw error;
    }
  }

  /**
   * Get events by country
   */
  async findByCountry(countryId: string): Promise<Event[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('event_details')
        .select('*')
        .eq('country_id', countryId)
        .order('start_datetime', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('EventService.findByCountry error', error as Error);
      throw error;
    }
  }

  /**
   * Get events by organization
   */
  async findByOrganization(organizationId: string): Promise<Event[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('event_details')
        .select('*')
        .eq('organizer_id', organizationId)
        .order('start_datetime', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('EventService.findByOrganization error', error as Error);
      throw error;
    }
  }

  /**
   * Get event statistics
   */
  async getStatistics(): Promise<{
    total: number;
    upcoming: number;
    past: number;
    by_type: Record<string, number>;
    by_visibility: Record<string, number>;
    total_attendees: number;
  }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('event_details')
        .select('id, type, status, start_datetime, end_datetime');

      if (error) throw error;

      const events = (data || []) as any[];
      const now = new Date().toISOString();
      const upcoming = events.filter(e => e.start_datetime >= now).length;
      const past = events.filter(e => e.end_datetime < now).length;

      const byType: Record<string, number> = {};
      const byVisibility: Record<string, number> = {};

      events.forEach((event: any) => {
        byType[event.type] = (byType[event.type] || 0) + 1;
        byVisibility[event.status] = (byVisibility[event.status] || 0) + 1;
      });

      // Get total attendees count
      const attendeesCount = 0;

      return {
        total: events.length,
        upcoming,
        past,
        by_type: byType,
        by_visibility: byVisibility,
        total_attendees: attendeesCount || 0
      };
    } catch (error) {
      logError('EventService.getStatistics error', error as Error);
      throw error;
    }
  }

  /**
   * Check for event conflicts
   */
  async checkConflicts(
    startDate: string,
    endDate: string,
    excludeEventId?: string
  ): Promise<Event[]> {
    try {
      let query = supabaseAdmin
        .from('events')
        .select('*')
        .or(`
          and(start_time.lte.${startDate},end_time.gte.${startDate}),
          and(start_time.lte.${endDate},end_time.gte.${endDate}),
          and(start_time.gte.${startDate},end_time.lte.${endDate})
        `);

      if (excludeEventId) {
        query = query.neq('id', excludeEventId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('EventService.checkConflicts error', error as Error);
      throw error;
    }
  }
}

export default EventService;
