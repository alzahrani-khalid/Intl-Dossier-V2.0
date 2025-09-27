import { supabaseAdmin } from '../config/supabase';
import { cacheHelpers } from '../config/redis';
import { logInfo, logError } from '../utils/logger';

export interface Event {
  id: string;
  title: string;
  description?: string;
  type: 'meeting' | 'conference' | 'workshop' | 'ceremony' | 'visit' | 'other';
  start_date: string;
  end_date: string;
  location: string;
  virtual_link?: string;
  attendees: Array<{
    type: 'country' | 'organization' | 'contact';
    id: string;
    role: 'host' | 'participant' | 'observer' | 'speaker';
    confirmed: boolean;
  }>;
  agenda: Array<{
    time: string;
    topic: string;
    presenter?: string;
  }>;
  documents: string[];
  tags: string[];
  visibility: 'public' | 'internal' | 'restricted';
  metadata?: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  type: 'meeting' | 'conference' | 'workshop' | 'ceremony' | 'visit' | 'other';
  location: string;
  visibility: 'public' | 'internal' | 'restricted';
  attendees: Array<{
    id: string;
    type: 'country' | 'organization' | 'contact';
    entity_id: string;
    role: 'host' | 'participant' | 'observer' | 'speaker';
    confirmed: boolean;
  }>;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  type: 'meeting' | 'conference' | 'workshop' | 'ceremony' | 'visit' | 'other';
  start_date: string;
  end_date: string;
  location: string;
  virtual_link?: string;
  attendees?: Array<{
    type: 'country' | 'organization' | 'contact';
    id: string;
    role: 'host' | 'participant' | 'observer' | 'speaker';
    confirmed: boolean;
  }>;
  agenda?: Array<{
    time: string;
    topic: string;
    presenter?: string;
  }>;
  documents?: string[];
  tags?: string[];
  visibility: 'public' | 'internal' | 'restricted';
  metadata?: Record<string, any>;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {}

export interface EventSearchParams {
  type?: string;
  upcoming?: boolean;
  past?: boolean;
  country_id?: string;
  organization_id?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  visibility?: string;
  created_by?: string;
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
        .from('events')
        .select(`
          *,
          attendees:event_attendees(
            id,
            type,
            entity_id,
            role,
            confirmed,
            entity:countries(name_en, name_ar, code),
            organization:organizations(name_en, name_ar),
            contact:contacts(first_name, last_name, email)
          )
        `);

      // Apply filters
      if (params.type) {
        query = query.eq('type', params.type);
      }
      if (params.upcoming) {
        query = query.gte('start_date', new Date().toISOString());
      }
      if (params.past) {
        query = query.lt('end_date', new Date().toISOString());
      }
      if (params.start_date) {
        query = query.gte('start_date', params.start_date);
      }
      if (params.end_date) {
        query = query.lte('end_date', params.end_date);
      }
      if (params.visibility) {
        query = query.eq('visibility', params.visibility);
      }
      if (params.created_by) {
        query = query.eq('created_by', params.created_by);
      }
      if (params.search) {
        query = query.or(`
          title.ilike.%${params.search}%,
          description.ilike.%${params.search}%,
          location.ilike.%${params.search}%
        `);
      }

      // Apply pagination
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Apply sorting
      const sortField = params.sort || 'start_date';
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
        .from('events')
        .select(`
          *,
          attendees:event_attendees(
            id,
            type,
            entity_id,
            role,
            confirmed,
            entity:countries(name_en, name_ar, code),
            organization:organizations(name_en, name_ar),
            contact:contacts(first_name, last_name, email)
          )
        `)
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
      const event = {
        ...eventData,
        attendees: eventData.attendees || [],
        agenda: eventData.agenda || [],
        documents: eventData.documents || [],
        tags: eventData.tags || [],
        created_by: createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('events')
        .insert(event)
        .select(`
          *,
          attendees:event_attendees(
            id,
            type,
            entity_id,
            role,
            confirmed,
            entity:countries(name_en, name_ar, code),
            organization:organizations(name_en, name_ar),
            contact:contacts(first_name, last_name, email)
          )
        `)
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
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          attendees:event_attendees(
            id,
            type,
            entity_id,
            role,
            confirmed,
            entity:countries(name_en, name_ar, code),
            organization:organizations(name_en, name_ar),
            contact:contacts(first_name, last_name, email)
          )
        `)
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
        .from('events')
        .select(`
          id,
          title,
          start_date,
          end_date,
          type,
          location,
          visibility,
          attendees:event_attendees(
            id,
            type,
            entity_id,
            role,
            confirmed
          )
        `)
        .gte('start_date', startDate)
        .lte('end_date', endDate);

      if (userId) {
        query = query.or(`
          created_by.eq.${userId},
          attendees.entity_id.eq.${userId}
        `);
      }

      const { data, error } = await query.order('start_date', { ascending: true });

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
        .from('events')
        .select(`
          *,
          attendees:event_attendees(
            id,
            type,
            entity_id,
            role,
            confirmed
          )
        `)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
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
        .from('events')
        .select(`
          *,
          attendees:event_attendees(
            id,
            type,
            entity_id,
            role,
            confirmed
          )
        `)
        .eq('attendees.type', 'country')
        .eq('attendees.entity_id', countryId)
        .order('start_date', { ascending: false });

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
        .from('events')
        .select(`
          *,
          attendees:event_attendees(
            id,
            type,
            entity_id,
            role,
            confirmed
          )
        `)
        .eq('attendees.type', 'organization')
        .eq('attendees.entity_id', organizationId)
        .order('start_date', { ascending: false });

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
        .from('events')
        .select('id, type, visibility, start_date, end_date');

      if (error) throw error;

      const events = data || [];
      const now = new Date().toISOString();
      const upcoming = events.filter(e => e.start_date >= now).length;
      const past = events.filter(e => e.end_date < now).length;

      const byType: Record<string, number> = {};
      const byVisibility: Record<string, number> = {};

      events.forEach(event => {
        byType[event.type] = (byType[event.type] || 0) + 1;
        byVisibility[event.visibility] = (byVisibility[event.visibility] || 0) + 1;
      });

      // Get total attendees count
      const { count: attendeesCount } = await supabaseAdmin
        .from('event_attendees')
        .select('*', { count: 'exact', head: true });

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
          and(start_date.lte.${startDate},end_date.gte.${startDate}),
          and(start_date.lte.${endDate},end_date.gte.${endDate}),
          and(start_date.gte.${startDate},end_date.lte.${endDate})
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
