/**
 * Tags Domain Types
 * @module domains/tags/types
 */

export interface Tag {
  id: string
  name: string
  parent_id?: string
  color?: string
  usage_count: number
}

export interface EntityTemplate {
  id: string
  name: string
  entity_type: string
  fields: Record<string, unknown>
  is_default: boolean
  created_at: string
}

export interface ContextualSuggestion {
  id: string
  text: string
  confidence: number
  source: string
}
