/**
 * Misc Domain Types
 * @module domains/misc/types
 */

export interface Comment {
  id: string
  entity_type: string
  entity_id: string
  content: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface StakeholderEvent {
  id: string
  stakeholder_id: string
  event_type: string
  description: string
  timestamp: string
}
