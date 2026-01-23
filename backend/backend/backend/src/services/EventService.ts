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

const EVENT_COLUMNS = 'id, title_en, title_ar, description_en, description_ar, type, start_datetime, end_datetime, timezone, location_en, location_ar, venue_en, venue_ar, is_virtual, virtual_link, country_id, organizer_id, max_participants, registration_required, registration_deadline, status, created_by, created_at, updated_at';

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
        .select(EVENT_COLUMNS);

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
        .select(EVENT_COLUMNS)
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
        .select(EVENT_COLUMNS)
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
      const { data, error } = await supabaseAdmin
        .from('events')
        .update(updates)
        .eq('id', id)
        .select(EVENT_COLUMNS)
        .single();

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del(`${this.cachePrefix}${id}`);
      await cacheHelpers.del(`${this.cachePrefix}list:*`);

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
      await cacheHelpers.del(`${this.cachePrefix}${id}`);
      await cacheHelpers.del(`${this.cachePrefix}list:*`);

      logInfo('Event deleted', { eventId: id, deletedBy });
      return true;
    } catch (error) {
      logError('EventService.delete error', error as Error);
      throw error;
    }
  }

  /**
   * Get events for calendar view
   */
  async getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    try {
      const cacheKey = `${this.cachePrefix}calendar:${startDate}:${endDate}`;
      const cached = await cacheHelpers.get<CalendarEvent[]>(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabaseAdmin
        .from('event_details')
        .select('id, title_en, title_ar, start_datetime, end_datetime, type, venue_en, venue_ar, is_virtual')
        .gte('start_datetime', startDate)
        .lte('start_datetime', endDate)
        .order('start_datetime');

      if (error) throw error;

      await cacheHelpers.set(cacheKey, data || [], this.cacheTTL);
      return data || [];
    } catch (error) {
      logError('EventService.getCalendarEvents error', error as Error);
      throw error;
    }
  }

  /**
   * Check for event conflicts
   */
  async checkConflicts(
    venueEn: string,
    venueAr: string,
    startDatetime: string,
    endDatetime: string,
    excludeEventId?: string
  ): Promise<Event[]> {
    try {
      let query = supabaseAdmin
        .from('event_details')
        .select(EVENT_COLUMNS)
        .in('status', ['scheduled', 'ongoing'])
        .or(`venue_en.eq.${venueEn},venue_ar.eq.${venueAr}`)
        .gte('end_datetime', startDatetime)
        .lte('start_datetime', endDatetime);

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

  /**
   * Get upcoming events
   */
  async getUpcoming(limit: number = 10): Promise<Event[]> {
    try {
      const cacheKey = `${this.cachePrefix}upcoming:${limit}`;
      const cached = await cacheHelpers.get<Event[]>(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabaseAdmin
        .from('event_details')
        .select(EVENT_COLUMNS)
        .gte('start_datetime', new Date().toISOString())
        .in('status', ['scheduled', 'draft'])
        .order('start_datetime')
        .limit(limit);

      if (error) throw error;

      await cacheHelpers.set(cacheKey, data || [], 300); // 5 minutes cache
      return data || [];
    } catch (error) {
      logError('EventService.getUpcoming error', error as Error);
      throw error;
    }
  }

  /**
   * Get event statistics
   */
  async getStatistics(): Promise<{
    total: number;
    upcoming: number;
    ongoing: number;
    completed: number;
  }> {
    try {
      const cacheKey = `${this.cachePrefix}statistics`;
      const cached = await cacheHelpers.get(cacheKey);
      if (cached) return cached;

      const now = new Date().toISOString();

      const [totalResult, upcomingResult, ongoingResult, completedResult] = await Promise.all([
        supabaseAdmin.from('events').select('id', { count: 'exact', head: true }),
        supabaseAdmin
          .from('events')
          .select('id', { count: 'exact', head: true })
          .gte('start_datetime', now)
          .eq('status', 'scheduled'),
        supabaseAdmin
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'ongoing'),
        supabaseAdmin
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed')
      ]);

      const stats = {
        total: totalResult.count || 0,
        upcoming: upcomingResult.count || 0,
        ongoing: ongoingResult.count || 0,
        completed: completedResult.count || 0
      };

      await cacheHelpers.set(cacheKey, stats, 300); // 5 minutes cache
      return stats;
    } catch (error) {
      logError('EventService.getStatistics error', error as Error);
      throw error;
    }
  }

  /**
   * Get events by entity
   */
  async getByEntity(entityType: string, entityId: string): Promise<Event[]> {
    try {
      const cacheKey = `${this.cachePrefix}entity:${entityType}:${entityId}`;
      const cached = await cacheHelpers.get<Event[]>(cacheKey);
      if (cached) return cached;

      // This assumes there's a linking table or a field that relates events to entities
      const { data, error } = await supabaseAdmin
        .from('event_details')
        .select(EVENT_COLUMNS)
        .eq(`${entityType}_id`, entityId)
        .order('start_datetime', { ascending: false });

      if (error) throw error;

      await cacheHelpers.set(cacheKey, data || [], this.cacheTTL);
      return data || [];
    } catch (error) {
      logError('EventService.getByEntity error', error as Error);
      throw error;
    }
  }
}

export default EventService;
