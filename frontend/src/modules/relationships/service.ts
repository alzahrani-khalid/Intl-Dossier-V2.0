/**
 * Relationships Module - Service
 *
 * Business logic layer for the Relationships module.
 * Orchestrates repository calls, applies validation, and handles events.
 *
 * @module relationships/service
 */

import type { ModuleResult, ModuleError, ModuleRequestContext, ModuleId } from '../core/types'
import type {
  RelationshipDTO,
  RelationshipCreateParams as ContractCreateParams,
  RelationshipUpdateParams as ContractUpdateParams,
  RelationshipHealthDTO,
  NetworkGraphParams as ContractNetworkParams,
  NetworkGraphDTO,
} from '../core/contracts'
import { RELATIONSHIP_EVENTS } from '../core/contracts'
import { moduleOk, moduleErr, createModuleError } from '../core/types'
import { getEventBus, createModuleEvent } from '../core/event-bus'
import { relationshipRepository } from './repository'
import type { Relationship, RelationshipHealth, RelationshipCreateParams } from './types'

// ============================================================================
// DTO Mappers
// ============================================================================

/**
 * Map internal Relationship to public RelationshipDTO
 */
function toRelationshipDTO(rel: Relationship): RelationshipDTO {
  return {
    id: rel.id,
    type: rel.relationship_type,
    sourceEntity: {
      moduleId: rel.source_module as ModuleId,
      entityType: rel.source_entity_type,
      entityId: rel.source_entity_id,
      displayName: rel.source_display_name_en || rel.source_entity_id,
    },
    targetEntity: {
      moduleId: rel.target_module as ModuleId,
      entityType: rel.target_entity_type,
      entityId: rel.target_entity_id,
      displayName: rel.target_display_name_en || rel.target_entity_id,
    },
    strength: rel.strength,
    status: rel.status,
    notes: rel.notes,
    createdAt: rel.created_at,
    updatedAt: rel.updated_at,
  }
}

/**
 * Map internal RelationshipHealth to public RelationshipHealthDTO
 */
function toHealthDTO(health: RelationshipHealth): RelationshipHealthDTO {
  return {
    relationshipId: health.relationship_id,
    score: health.overall_score,
    level: health.health_level,
    trend: health.trend,
    factors: health.factors.map((f) => ({
      name: f.name,
      score: f.score,
      weight: f.weight,
    })),
    lastUpdated: health.calculated_at,
  }
}

/**
 * Map contract CreateParams to internal CreateParams
 */
function toCreateParams(params: ContractCreateParams): RelationshipCreateParams {
  return {
    relationship_type: params.type as RelationshipCreateParams['relationship_type'],
    source_module: params.sourceEntity.moduleId,
    source_entity_type: params.sourceEntity.entityType,
    source_entity_id: params.sourceEntity.entityId,
    target_module: params.targetEntity.moduleId,
    target_entity_type: params.targetEntity.entityType,
    target_entity_id: params.targetEntity.entityId,
    strength: params.strength,
    notes: params.notes,
  }
}

// ============================================================================
// Relationship Service
// ============================================================================

export const relationshipService = {
  /**
   * Get a relationship by ID
   */
  async getRelationship(
    id: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<RelationshipDTO, ModuleError>> {
    if (!id) {
      return moduleErr(
        createModuleError('VALIDATION_ERROR', 'Relationship ID is required', 'relationships'),
      )
    }

    try {
      const relationship = await relationshipRepository.getById(id)
      return moduleOk(toRelationshipDTO(relationship))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      if (message.includes('not found')) {
        return moduleErr(
          createModuleError('NOT_FOUND', `Relationship ${id} not found`, 'relationships'),
        )
      }

      return moduleErr(
        createModuleError('INTERNAL_ERROR', message, 'relationships', undefined, error as Error),
      )
    }
  },

  /**
   * Get relationships for an entity
   */
  async getRelationshipsForEntity(
    entityRef: { moduleId: ModuleId; entityType: string; entityId: string },
    context: ModuleRequestContext,
  ): Promise<ModuleResult<RelationshipDTO[], ModuleError>> {
    try {
      const relationships = await relationshipRepository.getForEntity(
        entityRef.moduleId,
        entityRef.entityType,
        entityRef.entityId,
      )

      return moduleOk(relationships.map(toRelationshipDTO))
    } catch (error) {
      return moduleErr(
        createModuleError(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to get relationships',
          'relationships',
        ),
      )
    }
  },

  /**
   * Create a new relationship
   */
  async createRelationship(
    data: ContractCreateParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<RelationshipDTO, ModuleError>> {
    // Validation
    if (!data.type) {
      return moduleErr(
        createModuleError('VALIDATION_ERROR', 'Relationship type is required', 'relationships'),
      )
    }

    if (!data.sourceEntity?.entityId || !data.targetEntity?.entityId) {
      return moduleErr(
        createModuleError(
          'VALIDATION_ERROR',
          'Source and target entities are required',
          'relationships',
        ),
      )
    }

    if (data.sourceEntity.entityId === data.targetEntity.entityId) {
      return moduleErr(
        createModuleError(
          'VALIDATION_ERROR',
          'Cannot create a relationship with the same entity',
          'relationships',
        ),
      )
    }

    try {
      const createParams = toCreateParams(data)
      const relationship = await relationshipRepository.create(createParams, context.userId)
      const dto = toRelationshipDTO(relationship)

      // Publish event
      const eventBus = getEventBus()
      await eventBus.publish(
        createModuleEvent(
          RELATIONSHIP_EVENTS.CREATED,
          'relationships',
          {
            relationshipId: relationship.id,
            type: relationship.relationship_type,
            sourceEntity: data.sourceEntity,
            targetEntity: data.targetEntity,
          },
          context.correlationId,
        ),
      )

      return moduleOk(dto)
    } catch (error) {
      return moduleErr(
        createModuleError(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to create relationship',
          'relationships',
        ),
      )
    }
  },

  /**
   * Update a relationship
   */
  async updateRelationship(
    id: string,
    data: ContractUpdateParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<RelationshipDTO, ModuleError>> {
    if (!id) {
      return moduleErr(
        createModuleError('VALIDATION_ERROR', 'Relationship ID is required', 'relationships'),
      )
    }

    try {
      const updateParams = {
        relationship_type: data.type as RelationshipCreateParams['relationship_type'],
        strength: data.strength,
        status: data.status,
        notes: data.notes,
      }

      const relationship = await relationshipRepository.update(id, updateParams, context.userId)
      const dto = toRelationshipDTO(relationship)

      // Publish event
      const eventBus = getEventBus()
      await eventBus.publish(
        createModuleEvent(
          RELATIONSHIP_EVENTS.UPDATED,
          'relationships',
          {
            relationshipId: relationship.id,
            updates: data,
          },
          context.correlationId,
        ),
      )

      return moduleOk(dto)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update relationship'

      if (message.includes('not found')) {
        return moduleErr(createModuleError('NOT_FOUND', message, 'relationships'))
      }

      return moduleErr(createModuleError('INTERNAL_ERROR', message, 'relationships'))
    }
  },

  /**
   * Delete a relationship
   */
  async deleteRelationship(
    id: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<void, ModuleError>> {
    if (!id) {
      return moduleErr(
        createModuleError('VALIDATION_ERROR', 'Relationship ID is required', 'relationships'),
      )
    }

    try {
      // Get relationship info before deletion for event
      const relationship = await relationshipRepository.getById(id)

      await relationshipRepository.delete(id)

      // Publish event
      const eventBus = getEventBus()
      await eventBus.publish(
        createModuleEvent(
          RELATIONSHIP_EVENTS.DELETED,
          'relationships',
          {
            relationshipId: id,
            type: relationship.relationship_type,
          },
          context.correlationId,
        ),
      )

      return moduleOk(undefined)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete relationship'

      if (message.includes('not found')) {
        return moduleErr(createModuleError('NOT_FOUND', message, 'relationships'))
      }

      return moduleErr(createModuleError('INTERNAL_ERROR', message, 'relationships'))
    }
  },

  /**
   * Get health score for a relationship
   */
  async getHealthScore(
    id: string,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<RelationshipHealthDTO, ModuleError>> {
    if (!id) {
      return moduleErr(
        createModuleError('VALIDATION_ERROR', 'Relationship ID is required', 'relationships'),
      )
    }

    try {
      const health = await relationshipRepository.getHealthScore(id)

      if (!health) {
        return moduleErr(
          createModuleError(
            'NOT_FOUND',
            `Health score for relationship ${id} not found`,
            'relationships',
          ),
        )
      }

      return moduleOk(toHealthDTO(health))
    } catch (error) {
      return moduleErr(
        createModuleError(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to get health score',
          'relationships',
        ),
      )
    }
  },

  /**
   * Get network graph data
   */
  async getNetworkGraph(
    params: ContractNetworkParams,
    context: ModuleRequestContext,
  ): Promise<ModuleResult<NetworkGraphDTO, ModuleError>> {
    if (!params.centerEntityId) {
      return moduleErr(
        createModuleError('VALIDATION_ERROR', 'Center entity ID is required', 'relationships'),
      )
    }

    try {
      // Parse the center entity ID to extract module and type
      // Assuming format: moduleId:entityType:entityId or just entityId
      let centerModuleId = 'engagements' // default
      let centerEntityType = 'dossier' // default

      const parts = params.centerEntityId.split(':')
      let actualEntityId = params.centerEntityId

      if (parts.length >= 3) {
        centerModuleId = parts[0]
        centerEntityType = parts[1]
        actualEntityId = parts.slice(2).join(':')
      }

      const graphData = await relationshipRepository.getNetworkGraph({
        centerEntityId: actualEntityId,
        centerModuleId,
        centerEntityType,
        depth: params.depth,
        includeTypes: params.includeTypes as ContractNetworkParams['includeTypes'],
        excludeTypes: params.excludeTypes as ContractNetworkParams['excludeTypes'],
        maxNodes: params.maxNodes,
      })

      return moduleOk({
        nodes: graphData.nodes.map((n) => ({
          id: n.id,
          label: n.label,
          type: n.type,
          moduleId: n.moduleId as ModuleId,
          metadata: n.metadata,
        })),
        edges: graphData.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.type,
          strength: e.strength as RelationshipDTO['strength'],
        })),
      })
    } catch (error) {
      return moduleErr(
        createModuleError(
          'INTERNAL_ERROR',
          error instanceof Error ? error.message : 'Failed to get network graph',
          'relationships',
        ),
      )
    }
  },
}

export type RelationshipService = typeof relationshipService
