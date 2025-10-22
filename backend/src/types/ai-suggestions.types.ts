/**
 * TypeScript type definitions for AI Link Suggestions
 * Feature: 024-intake-entity-linking
 */

import { EntityType, LinkType } from './intake-entity-links.types';

// AI link suggestion status
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

// AI link suggestion record from database
export interface AILinkSuggestion {
  id: string;
  intake_id: string;
  suggested_entity_type: EntityType;
  suggested_entity_id: string;
  suggested_link_type: LinkType;
  confidence: number;
  reasoning: string;
  status: SuggestionStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

// Request to generate AI suggestions
export interface GenerateSuggestionsRequest {
  intake_id: string;
  max_suggestions?: number; // Default: 5
  min_confidence?: number;  // Default: 0.70
}

// Request to accept a suggestion
export interface AcceptSuggestionRequest {
  suggestion_id: string;
  notes?: string; // Optional user notes when accepting
}

// AI configuration
export interface AIConfig {
  // AnythingLLM API configuration
  api_url: string;
  api_key: string;
  workspace_slug: string;

  // Embedding configuration
  embedding_model: string; // e.g., 'text-embedding-ada-002'
  embedding_dimensions: number; // e.g., 1536

  // Chat configuration
  chat_model?: string; // e.g., 'gpt-3.5-turbo'

  // Suggestion parameters
  max_suggestions: number;
  min_confidence_threshold: number;

  // Rate limiting
  rate_limit_per_minute: number;

  // Timeout
  timeout_ms: number;
}

// Vector embedding
export interface VectorEmbedding {
  intake_id?: string;
  entity_type?: EntityType;
  entity_id?: string;
  embedding: number[]; // Array of 1536 floats
  text_hash: string;
  model_version: string;
  updated_at: string;
}

// Intake embedding
export interface IntakeEmbedding extends VectorEmbedding {
  intake_id: string;
}

// Entity embedding
export interface EntityEmbedding extends VectorEmbedding {
  entity_type: EntityType;
  entity_id: string;
  metadata: {
    name: string;
    description?: string;
    classification_level?: number;
    last_linked_at?: string;
    org_id: string;
  };
}

// Vector similarity search result
export interface VectorSearchResult {
  entity_type: EntityType;
  entity_id: string;
  entity_name: string;
  entity_description?: string;
  entity_updated_at?: string;
  similarity_score: number; // Cosine similarity (0-1)
  metadata?: {
    name?: string;
    description?: string;
    classification_level?: number;
    last_linked_at?: string;
  };
}

// AI suggestion generation result
export interface SuggestionGenerationResult {
  intake_id: string;
  suggestions: AILinkSuggestion[];
  generation_time_ms: number;
  ai_service_available: boolean;
}

// AnythingLLM API request
export interface AnythingLLMRequest {
  message: string;
  mode: 'chat' | 'query';
  workspace_slug: string;
}

// AnythingLLM API response
export interface AnythingLLMResponse {
  success: boolean;
  response?: string;
  error?: string;
}

// Embedding generation request
export interface EmbeddingRequest {
  text: string;
  model?: string;
}

// Embedding generation response
export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  dimensions: number;
  data?: Array<{
    embedding: number[];
    index: number;
  }>;
}

// Ranked suggestion with combined scoring
export interface RankedSuggestion {
  entity_type: EntityType;
  entity_id: string;
  entity_name: string;
  entity_description?: string;
  entity_updated_at?: string;
  suggested_link_type: LinkType;
  confidence_score: number; // AI confidence (0-1)
  recency_score: number; // Recency score (0-1)
  alphabetical_score: number; // Alphabetical score (0-1)
  combined_score: number; // Weighted combination
  rank: number; // Final ranking (1, 2, 3...)
  reasoning: string; // AI-generated explanation
}
