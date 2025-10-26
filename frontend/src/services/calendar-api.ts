/**
 * Calendar API Client
 * Part of: 026-unified-dossier-architecture implementation
 *
 * Typed API client for calendar event operations separated from entity identity.
 * Handles temporal event instances that can be linked to any dossier type.
 */

import { supabase } from '@/lib/supabase';
import type { Database } from '../../../backend/src/types/database.types';

// Get Supabase URL for Edge Functions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'];
type EventParticipant = Database['public']['Tables']['event_participants']['Row'];

/**
 * Event Types and Statuses
 */
export type EventType = 'session' | 'meeting' | 'deadline' | 'ceremony';
export type EventStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
export type ParticipantType = 'country_dossier' | 'organization_dossier' | 'person_dossier';

/**
 * API Request types
 */
export interface CreateCalendarEventRequest {
  dossier_id: string; // The dossier this event belongs to
  event_type: EventType;
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  location_en?: string;
  location_ar?: string;
  datetime_start: string; // ISO 8601 format
  datetime_end: string; // ISO 8601 format
  timezone?: string;
  status?: EventStatus;
  metadata?: Record<string, unknown>;
  participants?: Array<{
    participant_type: ParticipantType;
    participant_id: string;
    role?: string;
  }>;
}

export interface UpdateCalendarEventRequest {
  event_type?: EventType;
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  location_en?: string;
  location_ar?: string;
  datetime_start?: string;
  datetime_end?: string;
  timezone?: string;
  status?: EventStatus;
  metadata?: Record<string, unknown>;
}

export interface CalendarEventFilters {
  dossier_id?: string;
  event_type?: EventType;
  status?: EventStatus;
  datetime_start_from?: string;
  datetime_start_to?: string;
  datetime_end_from?: string;
  datetime_end_to?: string;
  page?: number;
  page_size?: number;
  sort_by?: 'datetime_start' | 'datetime_end' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface CalendarEventWithDetails extends CalendarEvent {
  dossier?: {
    id: string;
    type: string;
    name_en: string;
    name_ar: string;
  };
  participants?: Array<EventParticipant & {
    participant_info?: {
      id: string;
      type: string;
      name_en: string;
      name_ar: string;
    };
  }>;
}

export interface CalendarEventsListResponse {
  events: CalendarEventWithDetails[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface AddParticipantRequest {
  participant_type: ParticipantType;
  participant_id: string;
  role?: string;
}

/**
 * API Error class
 */
export class CalendarAPIError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(message: string, status: number, code: string, details?: any) {
    super(message);
    this.name = 'CalendarAPIError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Helper function to get auth headers
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new CalendarAPIError('Not authenticated', 401, 'AUTH_REQUIRED');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

/**
 * Helper function to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let error: any;
    try {
      error = await response.json();
    } catch {
      error = { message: response.statusText };
    }

    throw new CalendarAPIError(
      error.message || 'API request failed',
      response.status,
      error.code || 'API_ERROR',
      error.details
    );
  }

  return response.json();
}

/**
 * Create a new calendar event
 */
export async function createCalendarEvent(
  request: CreateCalendarEventRequest
): Promise<CalendarEventWithDetails> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${supabaseUrl}/functions/v1/calendar`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  return handleResponse<CalendarEventWithDetails>(response);
}

/**
 * Get a calendar event by ID
 */
export async function getCalendarEvent(id: string): Promise<CalendarEventWithDetails> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${supabaseUrl}/functions/v1/calendar/${id}`, {
    method: 'GET',
    headers,
  });

  return handleResponse<CalendarEventWithDetails>(response);
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  id: string,
  request: UpdateCalendarEventRequest
): Promise<CalendarEventWithDetails> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${supabaseUrl}/functions/v1/calendar/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(request),
  });

  return handleResponse<CalendarEventWithDetails>(response);
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${supabaseUrl}/functions/v1/calendar/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new CalendarAPIError(
      error.message || 'Failed to delete calendar event',
      response.status,
      error.code || 'DELETE_FAILED',
      error.details
    );
  }
}

/**
 * List calendar events with filters
 */
export async function listCalendarEvents(
  filters?: CalendarEventFilters
): Promise<CalendarEventsListResponse> {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }

  const url = `${supabaseUrl}/functions/v1/calendar${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  return handleResponse<CalendarEventsListResponse>(response);
}

/**
 * Get events for a specific dossier
 */
export async function getEventsForDossier(
  dossierId: string,
  page?: number,
  page_size?: number
): Promise<CalendarEventsListResponse> {
  return listCalendarEvents({
    dossier_id: dossierId,
    page,
    page_size,
    sort_by: 'datetime_start',
    sort_order: 'asc',
  });
}

/**
 * Get events in a date range
 */
export async function getEventsInDateRange(
  startDate: string,
  endDate: string,
  page?: number,
  page_size?: number
): Promise<CalendarEventsListResponse> {
  return listCalendarEvents({
    datetime_start_from: startDate,
    datetime_end_to: endDate,
    page,
    page_size,
    sort_by: 'datetime_start',
    sort_order: 'asc',
  });
}

/**
 * Add a participant to an event
 */
export async function addEventParticipant(
  eventId: string,
  request: AddParticipantRequest
): Promise<EventParticipant> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${supabaseUrl}/functions/v1/calendar/${eventId}/participants`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  return handleResponse<EventParticipant>(response);
}

/**
 * Remove a participant from an event
 */
export async function removeEventParticipant(
  eventId: string,
  participantId: string
): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${supabaseUrl}/functions/v1/calendar/${eventId}/participants/${participantId}`,
    {
      method: 'DELETE',
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new CalendarAPIError(
      error.message || 'Failed to remove participant',
      response.status,
      error.code || 'DELETE_FAILED',
      error.details
    );
  }
}

/**
 * Get upcoming events (convenience method)
 */
export async function getUpcomingEvents(
  page?: number,
  page_size?: number
): Promise<CalendarEventsListResponse> {
  const now = new Date().toISOString();
  return listCalendarEvents({
    datetime_start_from: now,
    status: 'scheduled',
    page,
    page_size,
    sort_by: 'datetime_start',
    sort_order: 'asc',
  });
}
