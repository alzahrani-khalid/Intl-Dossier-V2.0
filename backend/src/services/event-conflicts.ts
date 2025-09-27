import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';

type Event = Database['public']['Tables']['events']['Row'];

export interface ConflictCheckRequest {
  eventId?: string;
  start_datetime: string;
  end_datetime: string;
  venue_en?: string;
  venue_ar?: string;
  organizer_id?: string;
  participantIds?: string[];
  countryId?: string;
}

export interface EventConflict {
  type: 'venue' | 'participant' | 'organizer' | 'holiday' | 'resource';
  severity: 'high' | 'medium' | 'low';
  conflictingEvent?: Event;
  message: string;
  details: {
    overlappingTime?: {
      start: string;
      end: string;
      durationMinutes: number;
    };
    affectedResources?: string[];
    participantConflicts?: Array<{
      participantId: string;
      eventId: string;
      eventTitle: string;
    }>;
  };
}

export interface ConflictCheckResult {
  hasConflicts: boolean;
  conflicts: EventConflict[];
  warnings: string[];
  suggestions?: {
    alternativeTimeSlots?: Array<{
      start: string;
      end: string;
      available: boolean;
    }>;
    alternativeVenues?: string[];
  };
}

export class EventConflictService {
  private supabase: ReturnType<typeof createClient<Database>>;
  private nationalHolidays: Map<string, Date[]> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
    this.loadNationalHolidays();
  }

  private async loadNationalHolidays(): Promise<void> {
    // In production, this would load from a database table
    // For now, using hardcoded major holidays
    const currentYear = new Date().getFullYear();
    this.nationalHolidays.set('SA', [
      new Date(currentYear, 8, 23), // Saudi National Day
      new Date(currentYear, 1, 22), // Founding Day
      // Add Eid dates dynamically based on lunar calendar
    ]);
  }

  async checkConflicts(request: ConflictCheckRequest): Promise<ConflictCheckResult> {
    const conflicts: EventConflict[] = [];
    const warnings: string[] = [];

    // Parse dates
    const requestStart = new Date(request.start_datetime);
    const requestEnd = new Date(request.end_datetime);

    // 1. Check venue conflicts
    if (request.venue_en || request.venue_ar) {
      const venueConflicts = await this.checkVenueConflicts(request);
      conflicts.push(...venueConflicts);
    }

    // 2. Check participant conflicts
    if (request.participantIds && request.participantIds.length > 0) {
      const participantConflicts = await this.checkParticipantConflicts(request);
      conflicts.push(...participantConflicts);
    }

    // 3. Check organizer conflicts
    if (request.organizer_id) {
      const organizerConflicts = await this.checkOrganizerConflicts(request);
      conflicts.push(...organizerConflicts);
    }

    // 4. Check holiday conflicts
    if (request.countryId) {
      const holidayConflicts = await this.checkHolidayConflicts(request);
      conflicts.push(...holidayConflicts);
    }

    // 5. Check resource conflicts (conference rooms, equipment)
    const resourceConflicts = await this.checkResourceConflicts(request);
    conflicts.push(...resourceConflicts);

    // Generate warnings for soft conflicts
    if (this.isWeekend(requestStart) || this.isWeekend(requestEnd)) {
      warnings.push('Event scheduled during weekend');
    }

    if (this.isOutsideWorkingHours(requestStart) || this.isOutsideWorkingHours(requestEnd)) {
      warnings.push('Event scheduled outside standard working hours');
    }

    // Generate suggestions if conflicts exist
    let suggestions = undefined;
    if (conflicts.length > 0) {
      suggestions = await this.generateSuggestions(request, conflicts);
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      warnings,
      suggestions
    };
  }

  private async checkVenueConflicts(request: ConflictCheckRequest): Promise<EventConflict[]> {
    const conflicts: EventConflict[] = [];
    
    // Query overlapping events at the same venue
    let query = this.supabase
      .from('events')
      .select('*')
      .lte('start_datetime', request.end_datetime)
      .gte('end_datetime', request.start_datetime)
      .neq('status', 'cancelled');

    if (request.eventId) {
      query = query.neq('id', request.eventId);
    }

    if (request.venue_en) {
      query = query.eq('venue_en', request.venue_en);
    } else if (request.venue_ar) {
      query = query.eq('venue_ar', request.venue_ar);
    }

    const { data: overlappingEvents, error } = await query;

    if (error) {
      console.error('Failed to check venue conflicts:', error);
      return conflicts;
    }

    for (const event of overlappingEvents || []) {
      const overlap = this.calculateOverlap(
        new Date(request.start_datetime),
        new Date(request.end_datetime),
        new Date(event.start_datetime),
        new Date(event.end_datetime)
      );

      conflicts.push({
        type: 'venue',
        severity: 'high',
        conflictingEvent: event,
        message: `Venue already booked for "${event.title_en || event.title_ar}"`,
        details: {
          overlappingTime: overlap
        }
      });
    }

    return conflicts;
  }

  private async checkParticipantConflicts(request: ConflictCheckRequest): Promise<EventConflict[]> {
    const conflicts: EventConflict[] = [];
    
    if (!request.participantIds || request.participantIds.length === 0) {
      return conflicts;
    }

    // Get all events in the time range
    let query = this.supabase
      .from('events')
      .select('*')
      .lte('start_datetime', request.end_datetime)
      .gte('end_datetime', request.start_datetime)
      .neq('status', 'cancelled');

    if (request.eventId) {
      query = query.neq('id', request.eventId);
    }

    const { data: overlappingEvents } = await query;

    // For each overlapping event, check if any participants are double-booked
    // Note: This assumes a event_participants junction table exists
    const participantConflictDetails: any[] = [];

    for (const event of overlappingEvents || []) {
      // In a real implementation, we'd query the event_participants table
      // For now, we'll simulate this check
      const overlap = this.calculateOverlap(
        new Date(request.start_datetime),
        new Date(request.end_datetime),
        new Date(event.start_datetime),
        new Date(event.end_datetime)
      );

      // Simulated participant conflict
      if (Math.random() > 0.7) { // 30% chance of participant conflict
        participantConflictDetails.push({
          participantId: request.participantIds[0],
          eventId: event.id,
          eventTitle: event.title_en || event.title_ar
        });
      }
    }

    if (participantConflictDetails.length > 0) {
      conflicts.push({
        type: 'participant',
        severity: 'medium',
        message: `${participantConflictDetails.length} participant(s) have scheduling conflicts`,
        details: {
          participantConflicts: participantConflictDetails
        }
      });
    }

    return conflicts;
  }

  private async checkOrganizerConflicts(request: ConflictCheckRequest): Promise<EventConflict[]> {
    const conflicts: EventConflict[] = [];
    
    if (!request.organizer_id) {
      return conflicts;
    }

    // Check if organizer has other events at the same time
    let query = this.supabase
      .from('events')
      .select('*')
      .eq('organizer_id', request.organizer_id)
      .lte('start_datetime', request.end_datetime)
      .gte('end_datetime', request.start_datetime)
      .neq('status', 'cancelled');

    if (request.eventId) {
      query = query.neq('id', request.eventId);
    }

    const { data: organizerEvents } = await query;

    for (const event of organizerEvents || []) {
      const overlap = this.calculateOverlap(
        new Date(request.start_datetime),
        new Date(request.end_datetime),
        new Date(event.start_datetime),
        new Date(event.end_datetime)
      );

      conflicts.push({
        type: 'organizer',
        severity: 'medium',
        conflictingEvent: event,
        message: `Organizer already has event "${event.title_en || event.title_ar}"`,
        details: {
          overlappingTime: overlap
        }
      });
    }

    return conflicts;
  }

  private async checkHolidayConflicts(request: ConflictCheckRequest): Promise<EventConflict[]> {
    const conflicts: EventConflict[] = [];
    
    if (!request.countryId) {
      return conflicts;
    }

    // Get country ISO code
    const { data: country } = await this.supabase
      .from('countries')
      .select('iso_code_2')
      .eq('id', request.countryId)
      .single();

    if (!country) {
      return conflicts;
    }

    const holidays = this.nationalHolidays.get(country.iso_code_2) || [];
    const eventStart = new Date(request.start_datetime);
    const eventEnd = new Date(request.end_datetime);

    for (const holiday of holidays) {
      if (this.dateOverlapsRange(holiday, eventStart, eventEnd)) {
        conflicts.push({
          type: 'holiday',
          severity: 'low',
          message: `Event scheduled on national holiday`,
          details: {
            overlappingTime: {
              start: holiday.toISOString(),
              end: holiday.toISOString(),
              durationMinutes: 0
            }
          }
        });
      }
    }

    return conflicts;
  }

  private async checkResourceConflicts(request: ConflictCheckRequest): Promise<EventConflict[]> {
    const conflicts: EventConflict[] = [];
    
    // Check for resource conflicts (e.g., AV equipment, interpreters)
    // This would typically involve checking a resources table
    
    // Simulated check: High-demand time slots
    const eventStart = new Date(request.start_datetime);
    const hour = eventStart.getHours();
    
    if (hour >= 9 && hour <= 11) { // Peak morning hours
      const { count } = await this.supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .lte('start_datetime', request.end_datetime)
        .gte('end_datetime', request.start_datetime)
        .neq('status', 'cancelled');

      if ((count || 0) > 5) {
        conflicts.push({
          type: 'resource',
          severity: 'low',
          message: 'High demand time slot - limited resources available',
          details: {
            affectedResources: ['Conference rooms', 'AV equipment', 'Support staff']
          }
        });
      }
    }

    return conflicts;
  }

  private async generateSuggestions(
    request: ConflictCheckRequest,
    conflicts: EventConflict[]
  ): Promise<any> {
    const suggestions: any = {
      alternativeTimeSlots: [],
      alternativeVenues: []
    };

    // Find alternative time slots
    const duration = this.getDurationMinutes(
      new Date(request.start_datetime),
      new Date(request.end_datetime)
    );

    // Check next 5 business days for available slots
    const baseDate = new Date(request.start_datetime);
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const checkDate = new Date(baseDate);
      checkDate.setDate(checkDate.getDate() + dayOffset);
      
      // Skip weekends
      if (this.isWeekend(checkDate)) continue;

      // Check morning and afternoon slots
      const slots = [
        { hour: 9, minute: 0 },
        { hour: 14, minute: 0 }
      ];

      for (const slot of slots) {
        const slotStart = new Date(checkDate);
        slotStart.setHours(slot.hour, slot.minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);

        const slotCheck = await this.checkConflicts({
          ...request,
          start_datetime: slotStart.toISOString(),
          end_datetime: slotEnd.toISOString()
        });

        suggestions.alternativeTimeSlots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: !slotCheck.hasConflicts
        });

        // Only suggest up to 3 available slots
        const availableSlots = suggestions.alternativeTimeSlots.filter((s: any) => s.available);
        if (availableSlots.length >= 3) break;
      }
    }

    // Suggest alternative venues if venue conflict exists
    if (conflicts.some(c => c.type === 'venue')) {
      // In production, this would query available venues
      suggestions.alternativeVenues = [
        'Conference Room B',
        'Main Auditorium',
        'Virtual Meeting Room'
      ];
    }

    return suggestions;
  }

  private calculateOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): { start: string; end: string; durationMinutes: number } | undefined {
    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
    const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));

    if (overlapStart < overlapEnd) {
      return {
        start: overlapStart.toISOString(),
        end: overlapEnd.toISOString(),
        durationMinutes: Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 60000)
      };
    }

    return undefined;
  }

  private dateOverlapsRange(date: Date, rangeStart: Date, rangeEnd: Date): boolean {
    const dateDay = new Date(date);
    dateDay.setHours(0, 0, 0, 0);
    
    const startDay = new Date(rangeStart);
    startDay.setHours(0, 0, 0, 0);
    
    const endDay = new Date(rangeEnd);
    endDay.setHours(23, 59, 59, 999);

    return dateDay >= startDay && dateDay <= endDay;
  }

  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 5 || day === 6; // Friday and Saturday for Saudi Arabia
  }

  private isOutsideWorkingHours(date: Date): boolean {
    const hour = date.getHours();
    return hour < 8 || hour >= 17;
  }

  private getDurationMinutes(start: Date, end: Date): number {
    return Math.floor((end.getTime() - start.getTime()) / 60000);
  }

  async findAvailableSlot(
    duration: number,
    constraints: {
      earliestDate?: Date;
      latestDate?: Date;
      preferredTimes?: Array<{ hour: number; minute: number }>;
      requiredVenue?: string;
      requiredParticipants?: string[];
      avoidWeekends?: boolean;
    }
  ): Promise<{ start: Date; end: Date } | null> {
    const startSearch = constraints.earliestDate || new Date();
    const endSearch = constraints.latestDate || new Date(startSearch.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (let d = new Date(startSearch); d < endSearch; d.setDate(d.getDate() + 1)) {
      if (constraints.avoidWeekends && this.isWeekend(d)) continue;

      const times = constraints.preferredTimes || [
        { hour: 9, minute: 0 },
        { hour: 14, minute: 0 }
      ];

      for (const time of times) {
        const slotStart = new Date(d);
        slotStart.setHours(time.hour, time.minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);

        const conflicts = await this.checkConflicts({
          start_datetime: slotStart.toISOString(),
          end_datetime: slotEnd.toISOString(),
          venue_en: constraints.requiredVenue,
          participantIds: constraints.requiredParticipants
        });

        if (!conflicts.hasConflicts) {
          return { start: slotStart, end: slotEnd };
        }
      }
    }

    return null;
  }
}

// Export factory function
export function createEventConflictService(
  supabaseUrl: string,
  supabaseKey: string
): EventConflictService {
  return new EventConflictService(supabaseUrl, supabaseKey);
}