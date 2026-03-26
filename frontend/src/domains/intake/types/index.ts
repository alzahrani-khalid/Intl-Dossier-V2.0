/**
 * Intake Domain Types
 * @module domains/intake/types
 */

export interface IntakeTicket {
  id: string
  title: string
  description?: string
  status: string
  urgency: string
  request_type?: string
  sensitivity?: string
  created_at: string
  updated_at: string
}

export interface SLAConfiguration {
  id: string
  urgency: string
  request_type?: string
  sensitivity?: string
  response_hours: number
  resolution_hours: number
  escalation_hours: number
}

export interface FilterCriteria {
  status?: string
  urgency?: string
  assignee?: string
  dateRange?: { from: string; to: string }
  search?: string
}
