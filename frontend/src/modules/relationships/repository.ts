/**
 * Relationships Module - Repository
 *
 * Data access layer for the Relationships module.
 * All database operations are encapsulated here.
 *
 * @module relationships/repository
 */

import { supabase } from '@/lib/supabase-client'
import type {
  Relationship,
  RelationshipHealth,
  RelationshipSearchParams,
  RelationshipCreateParams,
  RelationshipUpdateParams,
  RelationshipListResponse,
  NetworkGraphParams,
} from './types'
import { getHealthLevelFromScore } from './types'

// ============================================================================
// Relationship Repository
// ============================================================================

export const relationshipRepository = {
  /**
   * List relationships with filters and pagination
   */
  async list(params: RelationshipSearchParams = {}): Promise<RelationshipListResponse> {
    const {
      search,
      types,
      strengths,
      statuses,
      sourceModuleId,
      sourceEntityType,
      sourceEntityId,
      targetModuleId,
      targetEntityType,
      targetEntityId,
      entityId,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortDirection = 'desc',
    } = params

    let query = supabase
      .from('relationships')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortDirection === 'asc' })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (search) {
      query = query.or(
        `source_display_name_en.ilike.%${search}%,source_display_name_ar.ilike.%${search}%,target_display_name_en.ilike.%${search}%,target_display_name_ar.ilike.%${search}%`,
      )
    }

    if (types?.length) {
      query = query.in('relationship_type', types)
    }

    if (strengths?.length) {
      query = query.in('strength', strengths)
    }

    if (statuses?.length) {
      query = query.in('status', statuses)
    }

    // Source filters
    if (sourceModuleId) {
      query = query.eq('source_module', sourceModuleId)
    }
    if (sourceEntityType) {
      query = query.eq('source_entity_type', sourceEntityType)
    }
    if (sourceEntityId) {
      query = query.eq('source_entity_id', sourceEntityId)
    }

    // Target filters
    if (targetModuleId) {
      query = query.eq('target_module', targetModuleId)
    }
    if (targetEntityType) {
      query = query.eq('target_entity_type', targetEntityType)
    }
    if (targetEntityId) {
      query = query.eq('target_entity_id', targetEntityId)
    }

    // Search both source and target by entity ID
    if (entityId) {
      query = query.or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to list relationships: ${error.message}`)
    }

    return {
      relationships: data || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    }
  },

  /**
   * Get a relationship by ID
   */
  async getById(id: string): Promise<Relationship> {
    const { data, error } = await supabase.from('relationships').select('*').eq('id', id).single()

    if (error) {
      throw new Error(`Relationship not found: ${error.message}`)
    }

    return data
  },

  /**
   * Get relationships for an entity (both source and target)
   */
  async getForEntity(
    moduleId: string,
    entityType: string,
    entityId: string,
  ): Promise<Relationship[]> {
    const { data, error } = await supabase
      .from('relationships')
      .select('*')
      .or(
        `and(source_module.eq.${moduleId},source_entity_type.eq.${entityType},source_entity_id.eq.${entityId}),and(target_module.eq.${moduleId},target_entity_type.eq.${entityType},target_entity_id.eq.${entityId})`,
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get relationships: ${error.message}`)
    }

    return data || []
  },

  /**
   * Create a new relationship
   */
  async create(params: RelationshipCreateParams, userId: string): Promise<Relationship> {
    const { data, error } = await supabase
      .from('relationships')
      .insert({
        ...params,
        strength: params.strength || 'moderate',
        direction: params.direction || 'bidirectional',
        status: 'active',
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create relationship: ${error.message}`)
    }

    // Initialize health score
    await this.initializeHealthScore(data.id, userId)

    return data
  },

  /**
   * Update a relationship
   */
  async update(
    id: string,
    params: RelationshipUpdateParams,
    userId: string,
  ): Promise<Relationship> {
    const { data, error } = await supabase
      .from('relationships')
      .update({
        ...params,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update relationship: ${error.message}`)
    }

    return data
  },

  /**
   * Delete a relationship
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('relationships').delete().eq('id', id)

    if (error) {
      throw new Error(`Failed to delete relationship: ${error.message}`)
    }

    // Also delete health score
    await supabase.from('relationship_health_scores').delete().eq('relationship_id', id)
  },

  /**
   * Get health score for a relationship
   */
  async getHealthScore(relationshipId: string): Promise<RelationshipHealth | null> {
    const { data, error } = await supabase
      .from('relationship_health_scores')
      .select('*')
      .eq('relationship_id', relationshipId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to get health score: ${error.message}`)
    }

    return data
  },

  /**
   * Initialize health score for a new relationship
   */
  async initializeHealthScore(relationshipId: string, userId: string): Promise<void> {
    const initialScore = 50 // Start at fair
    const { error } = await supabase.from('relationship_health_scores').insert({
      relationship_id: relationshipId,
      overall_score: initialScore,
      health_level: getHealthLevelFromScore(initialScore),
      trend: 'stable',
      factors: [
        { name: 'Communication Frequency', score: 50, weight: 0.3 },
        { name: 'Commitment Fulfillment', score: 50, weight: 0.3 },
        { name: 'Engagement Quality', score: 50, weight: 0.2 },
        { name: 'Relationship Age', score: 50, weight: 0.2 },
      ],
      calculated_at: new Date().toISOString(),
    })

    if (error) {
      console.warn(`Failed to initialize health score: ${error.message}`)
    }
  },

  /**
   * Update health score
   */
  async updateHealthScore(
    relationshipId: string,
    score: number,
    factors: { name: string; score: number; weight: number }[],
    trend: 'declining' | 'stable' | 'improving',
  ): Promise<void> {
    const { error } = await supabase
      .from('relationship_health_scores')
      .update({
        overall_score: score,
        health_level: getHealthLevelFromScore(score),
        trend,
        factors,
        calculated_at: new Date().toISOString(),
      })
      .eq('relationship_id', relationshipId)

    if (error) {
      throw new Error(`Failed to update health score: ${error.message}`)
    }
  },

  /**
   * Get network graph data
   */
  async getNetworkGraph(params: NetworkGraphParams): Promise<{
    nodes: Array<{
      id: string
      label: string
      type: string
      moduleId: string
      metadata?: Record<string, unknown>
    }>
    edges: Array<{
      id: string
      source: string
      target: string
      type: string
      strength: string
    }>
  }> {
    const {
      centerEntityId,
      centerModuleId,
      centerEntityType,
      depth,
      includeTypes,
      excludeTypes,
      maxNodes = 50,
    } = params

    // Get all relationships connected to the center entity
    const visited = new Set<string>()
    const nodes: Map<
      string,
      {
        id: string
        label: string
        type: string
        moduleId: string
        metadata?: Record<string, unknown>
      }
    > = new Map()
    const edges: Array<{
      id: string
      source: string
      target: string
      type: string
      strength: string
    }> = []

    // BFS to explore relationships up to specified depth
    const queue: Array<{ entityId: string; currentDepth: number }> = [
      { entityId: centerEntityId, currentDepth: 0 },
    ]

    // Add center node
    const centerKey = `${centerModuleId}:${centerEntityType}:${centerEntityId}`
    nodes.set(centerKey, {
      id: centerKey,
      label: 'Center Entity',
      type: centerEntityType,
      moduleId: centerModuleId,
    })

    while (queue.length > 0 && nodes.size < maxNodes) {
      const { entityId, currentDepth } = queue.shift()!

      if (currentDepth >= depth) continue
      if (visited.has(entityId)) continue

      visited.add(entityId)

      // Get relationships for this entity
      let query = supabase
        .from('relationships')
        .select('*')
        .eq('status', 'active')
        .or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`)

      if (includeTypes?.length) {
        query = query.in('relationship_type', includeTypes)
      }

      if (excludeTypes?.length) {
        query = query.not('relationship_type', 'in', `(${excludeTypes.join(',')})`)
      }

      const { data: relationships } = await query

      if (!relationships) continue

      for (const rel of relationships) {
        // Add edge
        edges.push({
          id: rel.id,
          source: `${rel.source_module}:${rel.source_entity_type}:${rel.source_entity_id}`,
          target: `${rel.target_module}:${rel.target_entity_type}:${rel.target_entity_id}`,
          type: rel.relationship_type,
          strength: rel.strength,
        })

        // Add source node if not exists
        const sourceKey = `${rel.source_module}:${rel.source_entity_type}:${rel.source_entity_id}`
        if (!nodes.has(sourceKey)) {
          nodes.set(sourceKey, {
            id: sourceKey,
            label: rel.source_display_name_en || rel.source_entity_id,
            type: rel.source_entity_type,
            moduleId: rel.source_module,
          })

          if (rel.source_entity_id !== entityId) {
            queue.push({
              entityId: rel.source_entity_id,
              currentDepth: currentDepth + 1,
            })
          }
        }

        // Add target node if not exists
        const targetKey = `${rel.target_module}:${rel.target_entity_type}:${rel.target_entity_id}`
        if (!nodes.has(targetKey)) {
          nodes.set(targetKey, {
            id: targetKey,
            label: rel.target_display_name_en || rel.target_entity_id,
            type: rel.target_entity_type,
            moduleId: rel.target_module,
          })

          if (rel.target_entity_id !== entityId) {
            queue.push({
              entityId: rel.target_entity_id,
              currentDepth: currentDepth + 1,
            })
          }
        }

        if (nodes.size >= maxNodes) break
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges,
    }
  },
}

export type RelationshipRepository = typeof relationshipRepository
