/**
 * AI Module - Service
 *
 * Business logic layer for the AI module.
 * Orchestrates AI operations and handles events.
 *
 * @module ai/service
 */

import type { ModuleResult, ModuleError, ModuleRequestContext, ModuleId } from '../core/types'
import type {
  SemanticSearchResult,
  ExtractedEntity,
  BriefDTO,
  RecommendationDTO,
  SummaryOptions,
  BriefOptions,
  SemanticSearchParams,
  RecommendationParams,
} from '../core/contracts'
import { AI_EVENTS } from '../core/contracts'
import { moduleOk, moduleErr, createModuleError } from '../core/types'
import { getEventBus, createModuleEvent } from '../core/event-bus'
import { apiPost, apiGet } from '@/domains/shared'
import type { Brief, Recommendation, ExtractedEntityType } from './types'

// ============================================================================
// DTO Mappers
// ============================================================================

function toBriefDTO(brief: Brief): BriefDTO {
  return {
    id: brief.id,
    entityRef: {
      moduleId: brief.source_module as ModuleId,
      entityType: brief.source_entity_type,
      entityId: brief.source_entity_id,
    },
    summary: brief.summary,
    keyPoints: brief.key_points,
    sections: brief.sections.map((s) => ({
      title: s.title,
      content: s.content,
    })),
    generatedAt: brief.generated_at,
    expiresAt: brief.expires_at,
  }
}

function toRecommendationDTO(rec: Recommendation): RecommendationDTO {
  return {
    id: rec.id,
    type: rec.recommendation_type as RecommendationDTO['type'],
    title: rec.title,
    description: rec.description,
    confidence: rec.confidence,
    suggestedEntity: rec.suggested_entity_id
      ? {
          moduleId: rec.suggested_module as ModuleId,
          entityType: rec.suggested_entity_type!,
          entityId: rec.suggested_entity_id,
          displayName: rec.suggested_display_name || '',
        }
      : undefined,
    actionUrl: rec.action_url,
    metadata: rec.metadata,
  }
}

// ============================================================================
// AI Service
// ============================================================================

export const aiService = {
  /**
   * Generate embeddings for text
   */
  async generateEmbeddings(
    text: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<number[], ModuleError>> {
    if (!text?.trim()) {
      return moduleErr(
        createModuleError('VALIDATION_ERROR', 'Text is required for embedding generation', 'ai'),
      )
    }

    try {
      const response = await apiPost('ai-embeddings', {
        text,
        locale: context.locale,
      })

      if (!response.ok) {
        throw new Error(response.error?.message || 'Failed to generate embeddings')
      }

      return moduleOk(response.data.embedding)
    } catch (error) {
      return moduleErr(
        createModuleError(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to generate embeddings',
          'ai',
        ),
      )
    }
  },

  /**
   * Perform semantic search
   */
  async semanticSearch(
    params: SemanticSearchParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<SemanticSearchResult[], ModuleError>> {
    if (!params.query?.trim()) {
      return moduleErr(createModuleError('VALIDATION_ERROR', 'Search query is required', 'ai'))
    }

    try {
      const response = await apiPost('ai-search', {
        query: params.query,
        modules: params.modules,
        entityTypes: params.entityTypes,
        limit: params.limit || 10,
        threshold: params.threshold || 0.7,
        locale: context.locale,
      })

      if (!response.ok) {
        throw new Error(response.error?.message || 'Failed to perform semantic search')
      }

      const results: SemanticSearchResult[] = response.data.results.map(
        (r: {
          moduleId: string
          entityType: string
          entityId: string
          score: number
          snippet: string
          highlights?: string[]
        }) => ({
          entityRef: {
            moduleId: r.moduleId as ModuleId,
            entityType: r.entityType,
            entityId: r.entityId,
          },
          score: r.score,
          snippet: r.snippet,
          highlights: r.highlights,
        }),
      )

      return moduleOk(results)
    } catch (error) {
      return moduleErr(
        createModuleError(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to perform semantic search',
          'ai',
        ),
      )
    }
  },

  /**
   * Extract entities from text
   */
  async extractEntities(
    text: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<ExtractedEntity[], ModuleError>> {
    if (!text?.trim()) {
      return moduleErr(
        createModuleError('VALIDATION_ERROR', 'Text is required for entity extraction', 'ai'),
      )
    }

    try {
      const response = await apiPost('ai-extract-entities', {
        text,
        locale: context.locale,
      })

      if (!response.ok) {
        throw new Error(response.error?.message || 'Failed to extract entities')
      }

      const entities: ExtractedEntity[] = response.data.entities.map(
        (e: {
          type: ExtractedEntityType
          value: string
          confidence: number
          position: { start: number; end: number }
        }) => ({
          type: e.type as ExtractedEntity['type'],
          value: e.value,
          confidence: e.confidence,
          position: e.position,
        }),
      )

      // Publish event
      const eventBus = getEventBus()
      await eventBus.publish(
        createModuleEvent(
          AI_EVENTS.ENTITIES_EXTRACTED,
          'ai',
          {
            entityCount: entities.length,
            types: [...new Set(entities.map((e) => e.type))],
          },
          context.correlationId,
        ),
      )

      return moduleOk(entities)
    } catch (error) {
      return moduleErr(
        createModuleError(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to extract entities',
          'ai',
        ),
      )
    }
  },

  /**
   * Generate a summary
   */
  async generateSummary(
    text: string,
    options: SummaryOptions,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<string, ModuleError>> {
    if (!text?.trim()) {
      return moduleErr(
        createModuleError('VALIDATION_ERROR', 'Text is required for summary generation', 'ai'),
      )
    }

    try {
      const response = await apiPost('ai-summarize', {
        text,
        maxLength: options.maxLength || 500,
        style: options.style || 'brief',
        language: options.language || context.locale,
      })

      if (!response.ok) {
        throw new Error(response.error?.message || 'Failed to generate summary')
      }

      return moduleOk(response.data.summary)
    } catch (error) {
      return moduleErr(
        createModuleError(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to generate summary',
          'ai',
        ),
      )
    }
  },

  /**
   * Generate a brief for an entity
   */
  async generateBrief(
    entityRef: { moduleId: ModuleId; entityType: string; entityId: string },
    options: BriefOptions,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<BriefDTO, ModuleError>> {
    if (!entityRef.entityId) {
      return moduleErr(
        createModuleError('VALIDATION_ERROR', 'Entity ID is required for brief generation', 'ai'),
      )
    }

    try {
      const response = await apiPost('ai-generate-brief', {
        moduleId: entityRef.moduleId,
        entityType: entityRef.entityType,
        entityId: entityRef.entityId,
        includeRelationships: options.includeRelationships ?? true,
        includeDocuments: options.includeDocuments ?? true,
        includeTimeline: options.includeTimeline ?? true,
        maxLength: options.maxLength || 2000,
        language: options.language || context.locale,
      })

      if (!response.ok) {
        throw new Error(response.error?.message || 'Failed to generate brief')
      }

      const brief: Brief = response.data.brief
      const dto = toBriefDTO(brief)

      // Publish event
      const eventBus = getEventBus()
      await eventBus.publish(
        createModuleEvent(
          AI_EVENTS.BRIEF_GENERATED,
          'ai',
          {
            briefId: brief.id,
            entityRef,
            keyPointsCount: brief.key_points.length,
            sectionsCount: brief.sections.length,
          },
          context.correlationId,
        ),
      )

      return moduleOk(dto)
    } catch (error) {
      return moduleErr(
        createModuleError(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to generate brief',
          'ai',
        ),
      )
    }
  },

  /**
   * Get AI recommendations
   */
  async getRecommendations(
    params: RecommendationParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<RecommendationDTO[], ModuleError>> {
    if (!params.entityRef?.entityId) {
      return moduleErr(createModuleError('VALIDATION_ERROR', 'Entity reference is required', 'ai'))
    }

    try {
      const response = await apiGet('ai-recommendations', {
        moduleId: params.entityRef.moduleId,
        entityType: params.entityRef.entityType,
        entityId: params.entityRef.entityId,
        types: params.types?.join(','),
        limit: params.limit || 5,
      })

      if (!response.ok) {
        throw new Error(response.error?.message || 'Failed to get recommendations')
      }

      const recommendations: RecommendationDTO[] = response.data.recommendations.map(
        (r: Recommendation) => toRecommendationDTO(r),
      )

      return moduleOk(recommendations)
    } catch (error) {
      return moduleErr(
        createModuleError(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to get recommendations',
          'ai',
        ),
      )
    }
  },

  /**
   * Update embeddings for an entity
   * Called when entity content changes
   */
  async updateEmbeddings(
    entityRef: { moduleId: string; entityType: string; entityId: string },
    content: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<void, ModuleError>> {
    try {
      const response = await apiPost('ai-update-embeddings', {
        moduleId: entityRef.moduleId,
        entityType: entityRef.entityType,
        entityId: entityRef.entityId,
        content,
      })

      if (!response.ok) {
        throw new Error(response.error?.message || 'Failed to update embeddings')
      }

      // Publish event
      const eventBus = getEventBus()
      await eventBus.publish(
        createModuleEvent(AI_EVENTS.EMBEDDINGS_UPDATED, 'ai', { entityRef }, context.correlationId),
      )

      return moduleOk(undefined)
    } catch (error) {
      return moduleErr(
        createModuleError(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to update embeddings',
          'ai',
        ),
      )
    }
  },
}

export type AIService = typeof aiService
