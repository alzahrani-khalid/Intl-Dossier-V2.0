/**
 * TypeScript type definitions for AI Link Suggestions
 * Feature: 024-intake-entity-linking
 */

import { EntityType, LinkType } from './intake-entity-links.types'

// AI link suggestion status
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected'

// AI link suggestion record from database
export interface AILinkSuggestion {
  id: string
  intake_id: string
  suggested_entity_type: EntityType
  suggested_entity_id: string
  suggested_link_type: LinkType
  confidence: number
  reasoning: string
  status: SuggestionStatus
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

// Request to generate AI suggestions
export interface GenerateSuggestionsRequest {
  intake_id: string
  max_suggestions?: number // Default: 5
  min_confidence?: number // Default: 0.70
}

// Request to accept a suggestion
export interface AcceptSuggestionRequest {
  suggestion_id: string
  notes?: string // Optional user notes when accepting
}

// Vector embedding
export interface VectorEmbedding {
  intake_id?: string
  entity_type?: EntityType
  entity_id?: string
  embedding: number[] // Array of 1536 floats
  text_hash: string
  model_version: string
  updated_at: string
}

// AI suggestion generation result
export interface SuggestionGenerationResult {
  intake_id: string
  suggestions: AILinkSuggestion[]
  generation_time_ms: number
  ai_service_available: boolean
}

