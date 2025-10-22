/**
 * AnythingLLM API Configuration
 * Feature: 024-intake-entity-linking
 *
 * Configuration for AnythingLLM API integration used for AI-powered
 * link suggestions and entity embeddings generation.
 */

import dotenv from 'dotenv';
import { AIConfig } from '../types/ai-suggestions.types';

dotenv.config();

/**
 * AnythingLLM API Configuration
 */
export const anythingLLMConfig: AIConfig = {
  // API connection
  api_url: process.env.ANYTHINGLLM_API_URL || 'http://localhost:3001/api',
  api_key: process.env.ANYTHINGLLM_API_KEY || '',
  workspace_slug: process.env.ANYTHINGLLM_WORKSPACE || 'intake-entity-linking',

  // Embedding model configuration
  embedding_model: process.env.ANYTHINGLLM_EMBEDDING_MODEL || 'text-embedding-ada-002',
  embedding_dimensions: parseInt(process.env.ANYTHINGLLM_EMBEDDING_DIMS || '1536', 10),

  // Suggestion parameters
  max_suggestions: parseInt(process.env.AI_MAX_SUGGESTIONS || '5', 10),
  min_confidence_threshold: parseFloat(process.env.AI_MIN_CONFIDENCE || '0.70'),

  // Rate limiting (3 requests per minute per user)
  rate_limit_per_minute: parseInt(process.env.AI_RATE_LIMIT || '3', 10),

  // Timeout (3 seconds)
  timeout_ms: parseInt(process.env.AI_TIMEOUT_MS || '3000', 10),
};

/**
 * Validate AnythingLLM configuration
 */
export function validateAnythingLLMConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!anythingLLMConfig.api_url) {
    errors.push('ANYTHINGLLM_API_URL environment variable is required');
  }

  if (!anythingLLMConfig.api_key) {
    errors.push('ANYTHINGLLM_API_KEY environment variable is required');
  }

  if (!anythingLLMConfig.workspace_slug) {
    errors.push('ANYTHINGLLM_WORKSPACE environment variable is required');
  }

  if (anythingLLMConfig.embedding_dimensions <= 0) {
    errors.push('Invalid embedding dimensions');
  }

  if (anythingLLMConfig.max_suggestions <= 0 || anythingLLMConfig.max_suggestions > 10) {
    errors.push('max_suggestions must be between 1 and 10');
  }

  if (anythingLLMConfig.min_confidence_threshold < 0 || anythingLLMConfig.min_confidence_threshold > 1) {
    errors.push('min_confidence_threshold must be between 0 and 1');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if AnythingLLM service is available
 */
export async function checkAnythingLLMAvailability(): Promise<boolean> {
  try {
    const response = await fetch(`${anythingLLMConfig.api_url}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${anythingLLMConfig.api_key}`,
      },
      signal: AbortSignal.timeout(anythingLLMConfig.timeout_ms),
    });

    return response.ok;
  } catch (error) {
    console.error('AnythingLLM availability check failed:', error);
    return false;
  }
}

/**
 * Generate embedding using AnythingLLM API
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch(`${anythingLLMConfig.api_url}/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anythingLLMConfig.api_key}`,
      },
      body: JSON.stringify({
        text,
        model: anythingLLMConfig.embedding_model
      }),
      signal: AbortSignal.timeout(anythingLLMConfig.timeout_ms),
    });

    if (!response.ok) {
      throw new Error(`AnythingLLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding || null;
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return null;
  }
}

/**
 * Get reasoning for a link suggestion using AnythingLLM
 */
export async function generateLinkReasoning(
  intakeText: string,
  entityName: string,
  entityDescription: string
): Promise<string> {
  try {
    const prompt = `Explain why this intake ticket should be linked to this entity:

Intake: ${intakeText}

Entity: ${entityName}
Description: ${entityDescription}

Provide a brief 1-2 sentence explanation of the relationship.`;

    const response = await fetch(`${anythingLLMConfig.api_url}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anythingLLMConfig.api_key}`,
      },
      body: JSON.stringify({
        message: prompt,
        mode: 'query',
        workspace_slug: anythingLLMConfig.workspace_slug
      }),
      signal: AbortSignal.timeout(anythingLLMConfig.timeout_ms),
    });

    if (!response.ok) {
      throw new Error(`AnythingLLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || 'AI reasoning unavailable';
  } catch (error) {
    console.error('Reasoning generation failed:', error);
    return 'AI reasoning unavailable';
  }
}

/**
 * Entity linking cache key prefixes
 */
export const ENTITY_LINKING_CACHE_KEYS = {
  ENTITY_METADATA: (entityType: string, entityId: string) => `entity:metadata:${entityType}:${entityId}`,
  AI_SUGGESTIONS: (intakeId: string) => `ai:suggestions:${intakeId}`,
  EMBEDDING: (type: 'intake' | 'entity', id: string) => `embedding:${type}:${id}`,
} as const;

/**
 * Cache TTL values (in seconds)
 */
export const ENTITY_LINKING_CACHE_TTL = {
  ENTITY_METADATA: 300, // 5 minutes
  AI_SUGGESTIONS: 60,   // 1 minute
  EMBEDDING: 3600,      // 1 hour
} as const;

export default anythingLLMConfig;
