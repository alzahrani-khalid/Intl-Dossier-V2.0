/**
 * Engagement Context - Agenda Types
 *
 * Types for engagement agenda items and outcomes.
 */

/**
 * Status of an agenda item
 */
export type AgendaItemStatus = 'planned' | 'in_progress' | 'completed' | 'skipped' | 'postponed'

/**
 * Agenda item record
 */
export interface EngagementAgendaItem {
  id: string
  engagement_id: string
  order_number: number
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
  item_status: AgendaItemStatus
  notes_en?: string
  notes_ar?: string
  outcome_en?: string
  outcome_ar?: string
  created_at: string
  updated_at: string
  created_by?: string
}

/**
 * Input for adding an agenda item
 */
export interface EngagementAgendaItemCreate {
  order_number?: number
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
  item_status?: AgendaItemStatus
  notes_en?: string
  notes_ar?: string
  outcome_en?: string
  outcome_ar?: string
}

/**
 * Input for updating an agenda item
 */
export interface EngagementAgendaItemUpdate {
  order_number?: number
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
  item_status?: AgendaItemStatus
  notes_en?: string
  notes_ar?: string
  outcome_en?: string
  outcome_ar?: string
}

/**
 * Calculate total duration of agenda items in minutes
 */
export function calculateTotalDuration(items: EngagementAgendaItem[]): number {
  return items.reduce((total, item) => total + (item.duration_minutes || 0), 0)
}

/**
 * Get completed items count
 */
export function getCompletedCount(items: EngagementAgendaItem[]): number {
  return items.filter((item) => item.item_status === 'completed').length
}

/**
 * Get progress percentage
 */
export function getProgressPercentage(items: EngagementAgendaItem[]): number {
  if (items.length === 0) return 0
  return Math.round((getCompletedCount(items) / items.length) * 100)
}

/**
 * Sort agenda items by order number
 */
export function sortAgendaItems(items: EngagementAgendaItem[]): EngagementAgendaItem[] {
  return [...items].sort((a, b) => a.order_number - b.order_number)
}
