/**
 * Calendar Domain Types
 * @module domains/calendar/types
 *
 * Re-exports existing calendar types and defines domain-specific interfaces.
 */

export type {
  ConflictCheckRequest,
  ConflictCheckResponse,
  ConflictsListResponse,
  ConflictListFilters,
  ReschedulingSuggestionRequest,
  ReschedulingSuggestionResponse,
  ReschedulingSuggestion,
  CreateScenarioRequest,
  WhatIfScenario,
  BulkRescheduleRequest,
  BulkRescheduleResponse,
  ResolveConflictRequest,
} from '@/types/calendar-conflict.types'

export type {
  CreateRecurringEventInput,
  CreateRecurringEventResponse,
  EventSeries,
  SeriesOccurrencesResponse,
  UpdateSeriesRequest,
  DeleteOccurrenceRequest,
  CreateExceptionInput,
  SeriesException,
  EventNotification,
} from '@/types/recurrence.types'

// ============================================================================
// Calendar Event Types (from useCalendarEvents)
// ============================================================================

export interface CalendarEvent {
  id: string
  dossier_id: string
  event_type: 'main_event' | 'session' | 'plenary' | 'working_session' | 'ceremony' | 'reception'
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  start_datetime: string
  end_datetime: string
  timezone: string
  location_en?: string
  location_ar?: string
  is_virtual: boolean
  virtual_link?: string
  room_en?: string
  room_ar?: string
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled' | 'postponed'
  created_at: string
  updated_at: string
  dossier?: {
    id: string
    type: string
    name_en: string
    name_ar: string
  }
}

export interface CalendarEventsFilters {
  start_date?: string
  end_date?: string
  event_type?: string
  dossier_id?: string
  status?: string
}

export interface CalendarEventsResponse {
  entries: CalendarEvent[]
  total_count: number
}

// ============================================================================
// Create Calendar Event Types (from useCreateCalendarEvent)
// ============================================================================

export interface CreateCalendarEventInput {
  entry_type:
    | 'internal_meeting'
    | 'deadline'
    | 'reminder'
    | 'holiday'
    | 'training'
    | 'review'
    | 'other'
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  start_datetime: string
  end_datetime?: string
  all_day?: boolean
  location?: string
  recurrence_pattern?: string
  linked_item_type?: string
  linked_item_id?: string
  attendee_ids?: string[]
  reminder_minutes?: number
}

// ============================================================================
// Update Calendar Event Types (from useUpdateCalendarEvent)
// ============================================================================

export interface UpdateCalendarEventInput {
  entryId: string
  entry_type?:
    | 'internal_meeting'
    | 'deadline'
    | 'reminder'
    | 'holiday'
    | 'training'
    | 'review'
    | 'other'
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  start_datetime?: string
  end_datetime?: string
  all_day?: boolean
  location?: string
  recurrence_pattern?: string
  linked_item_type?: string
  linked_item_id?: string
  attendee_ids?: string[]
  reminder_minutes?: number
}
