/**
 * Briefings Domain Types
 * @module domains/briefings/types
 */

export interface BriefingPackJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  created_at: string
  completed_at?: string
  file_url?: string
  error_message?: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  source: string
  synced: boolean
}
