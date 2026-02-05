/**
 * Calendar Types
 * Types for calendar event display components.
 */

export interface CalendarEvent {
  id: string
  title_en?: string | null
  title_ar?: string | null
  description?: string | null
  description_en?: string | null
  description_ar?: string | null
  entry_type: string
  status?: string | null
  start_datetime: string
  end_datetime?: string | null
  location?: string | null
  location_en?: string | null
  location_ar?: string | null
  participants?: string[] | null
  is_all_day?: boolean
  linked_item_type?: string | null
  linked_item_id?: string | null
  dossier_id?: string | null
  created_at?: string
  updated_at?: string
}
