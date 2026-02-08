/**
 * AI Suggestions Types
 *
 * Type definitions for AI-powered entity link suggestions.
 * Used by AISuggestionPanel component and use-ai-suggestions hook.
 */

/**
 * A single AI-generated link suggestion
 */
export interface AILinkSuggestion {
  /** Unique suggestion ID */
  suggestion_id: string
  /** Target entity ID */
  entity_id: string
  /** Target entity type */
  entity_type: string
  /** Display name of the entity */
  entity_name: string
  /** Confidence score (0-1) */
  confidence_score: number
  /** Suggested link type */
  suggested_link_type: string
  /** AI reasoning for the suggestion */
  reasoning: string
  /** Rank/position of the suggestion */
  rank: number
}

/**
 * Request payload for generating AI suggestions
 */
export interface GenerateSuggestionsRequest {
  /** Types of entities to suggest */
  entity_types?: string[]
  /** Maximum number of suggestions to return */
  max_suggestions?: number
}

/**
 * Response payload for AI suggestion generation
 */
export interface GenerateSuggestionsResponse {
  /** List of AI suggestions */
  suggestions: AILinkSuggestion[]
  /** Metadata about the generation */
  metadata?: {
    /** Whether the result was served from cache */
    cache_hit?: boolean
    /** Processing time in milliseconds */
    processing_time_ms?: number
  }
}

/**
 * Request payload for accepting an AI suggestion
 */
export interface AcceptSuggestionRequest {
  /** The suggestion ID being accepted */
  suggestion_id: string
  /** Entity to link to */
  entity_id: string
  /** Entity type */
  entity_type: string
  /** Link type to create */
  link_type: string
}

/**
 * Response payload for accepting an AI suggestion
 */
export interface AcceptSuggestionResponse {
  /** The created link */
  link: {
    id: string
    intake_id: string
    entity_id: string
    entity_type: string
    link_type: string
    created_at: string
  }
}
