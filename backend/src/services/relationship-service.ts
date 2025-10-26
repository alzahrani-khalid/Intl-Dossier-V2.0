import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

type RelationshipStatus = 'active' | 'historical' | 'terminated';

interface CreateRelationshipInput {
  source_dossier_id: string;
  target_dossier_id: string;
  relationship_type: string;
  relationship_metadata?: Record<string, unknown>;
  notes_en?: string;
  notes_ar?: string;
  effective_from?: string;
  effective_to?: string;
  status?: RelationshipStatus;
}

interface UpdateRelationshipInput {
  relationship_type?: string;
  relationship_metadata?: Record<string, unknown>;
  notes_en?: string;
  notes_ar?: string;
  effective_from?: string;
  effective_to?: string;
  status?: RelationshipStatus;
}

/**
 * RelationshipService - Manages relationships between dossiers in the unified architecture
 *
 * This service handles the universal relationship model where ANY dossier can connect to ANY other dossier.
 * Supports:
 * - Bidirectional relationship queries (find relationships from both source and target)
 * - Temporal validity (effective_from/effective_to dates)
 * - Relationship types (bilateral_relation, membership, partnership, etc.)
 * - Graph traversal foundation for network queries
 *
 * @example
 * // Create bilateral relationship between countries
 * const relationship = await relationshipService.createRelationship({
 *   source_dossier_id: 'saudi-arabia-uuid',
 *   target_dossier_id: 'china-uuid',
 *   relationship_type: 'bilateral_relation',
 *   notes_en: 'Strategic partnership established 2023'
 * });
 *
 * @example
 * // Get all relationships for an engagement
 * const relationships = await relationshipService.getRelationshipsForDossier('engagement-uuid');
 * // Returns both outgoing (source) and incoming (target) relationships
 */
export class RelationshipService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.supabase = createClient<Database>(
      supabaseUrl || process.env.SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_ANON_KEY!
    );
  }

  /**
   * Create a relationship between two dossiers
   * @param input - Relationship details including source, target, type
   * @returns Created relationship
   * @throws Error if source === target (self-reference) or if validation fails
   */
  async createRelationship(input: CreateRelationshipInput) {
    // Validate no self-reference
    if (input.source_dossier_id === input.target_dossier_id) {
      throw new Error('Cannot create relationship: source and target cannot be the same dossier');
    }

    // Validate temporal range
    if (input.effective_from && input.effective_to) {
      const from = new Date(input.effective_from);
      const to = new Date(input.effective_to);
      if (to < from) {
        throw new Error('Cannot create relationship: effective_to must be >= effective_from');
      }
    }

    // Insert relationship
    const { data, error } = await this.supabase
      .from('dossier_relationships')
      .insert({
        ...input,
        status: input.status || 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all relationships for a dossier (bidirectional query)
   * Returns relationships where dossier is either source OR target
   * @param dossierId - UUID of the dossier
   * @param options - Filter options (relationship_type, status)
   * @returns Array of relationships with related dossier info
   */
  async getRelationshipsForDossier(
    dossierId: string,
    options: {
      relationship_type?: string;
      status?: RelationshipStatus;
      includeHistorical?: boolean;
    } = {}
  ) {
    const { relationship_type, status, includeHistorical = false } = options;

    // Build query for both source and target
    let query = this.supabase
      .from('dossier_relationships')
      .select(`
        *,
        source:source_dossier_id(id, type, name_en, name_ar, status),
        target:target_dossier_id(id, type, name_en, name_ar, status)
      `)
      .or(`source_dossier_id.eq.${dossierId},target_dossier_id.eq.${dossierId}`);

    // Apply filters
    if (relationship_type) {
      query = query.eq('relationship_type', relationship_type);
    }

    if (status) {
      query = query.eq('status', status);
    } else if (!includeHistorical) {
      // Default: only show active relationships
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data to indicate direction
    return (data || []).map((rel) => ({
      ...rel,
      direction: rel.source_dossier_id === dossierId ? 'outgoing' : 'incoming',
      related_dossier: rel.source_dossier_id === dossierId ? rel.target : rel.source,
    }));
  }

  /**
   * Get bidirectional relationships (both directions) for graph queries
   * @param dossierId - UUID of the dossier
   * @param options - Filter options
   * @returns Relationships in both directions
   */
  async getBidirectionalRelationships(
    dossierId: string,
    options: {
      relationship_type?: string;
      status?: RelationshipStatus;
    } = {}
  ) {
    const { relationship_type, status = 'active' } = options;

    let query = this.supabase
      .from('dossier_relationships')
      .select('*')
      .or(`source_dossier_id.eq.${dossierId},target_dossier_id.eq.${dossierId}`)
      .eq('status', status);

    if (relationship_type) {
      query = query.eq('relationship_type', relationship_type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Update a relationship
   * @param relationshipId - UUID of the relationship
   * @param input - Fields to update
   * @returns Updated relationship
   */
  async updateRelationship(relationshipId: string, input: UpdateRelationshipInput) {
    // Validate temporal range if both provided
    if (input.effective_from && input.effective_to) {
      const from = new Date(input.effective_from);
      const to = new Date(input.effective_to);
      if (to < from) {
        throw new Error('Cannot update relationship: effective_to must be >= effective_from');
      }
    }

    const { data, error } = await this.supabase
      .from('dossier_relationships')
      .update(input)
      .eq('id', relationshipId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a relationship (hard delete)
   * @param relationshipId - UUID of the relationship
   * @returns Success status
   */
  async deleteRelationship(relationshipId: string) {
    const { error } = await this.supabase
      .from('dossier_relationships')
      .delete()
      .eq('id', relationshipId);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Terminate a relationship (soft delete via status change)
   * @param relationshipId - UUID of the relationship
   * @returns Updated relationship with terminated status
   */
  async terminateRelationship(relationshipId: string) {
    return this.updateRelationship(relationshipId, {
      status: 'terminated',
      effective_to: new Date().toISOString(),
    });
  }

  /**
   * Get all relationships by type across the system
   * @param relationshipType - Type of relationship to filter
   * @param options - Additional filter options
   * @returns Array of relationships
   */
  async getRelationshipsByType(
    relationshipType: string,
    options: {
      status?: RelationshipStatus;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { status = 'active', limit = 50, offset = 0 } = options;

    const { data, error, count } = await this.supabase
      .from('dossier_relationships')
      .select(`
        *,
        source:source_dossier_id(id, type, name_en, name_ar),
        target:target_dossier_id(id, type, name_en, name_ar)
      `, { count: 'exact' })
      .eq('relationship_type', relationshipType)
      .eq('status', status)
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data || [],
      count,
      limit,
      offset,
    };
  }

  /**
   * Validate parent/child relationship to prevent circular hierarchies
   * This is called before creating parent_of or subsidiary_of relationships
   * @param parentId - Proposed parent dossier ID
   * @param childId - Proposed child dossier ID
   * @returns true if valid, throws error if circular dependency detected
   */
  async validateHierarchy(parentId: string, childId: string): Promise<boolean> {
    // Check if childId is already an ancestor of parentId
    const ancestors = await this.getAncestors(parentId);

    if (ancestors.some(ancestor => ancestor.id === childId)) {
      throw new Error('Cannot create relationship: circular hierarchy detected');
    }

    return true;
  }

  /**
   * Get all ancestors for a dossier (recursive parent relationships)
   * @param dossierId - UUID of the dossier
   * @param maxDepth - Maximum depth to traverse (default 10)
   * @returns Array of ancestor dossiers
   */
  private async getAncestors(dossierId: string, maxDepth: number = 10): Promise<Array<{ id: string }>> {
    const ancestors: Array<{ id: string }> = [];
    let currentId = dossierId;
    let depth = 0;

    while (depth < maxDepth) {
      // Find parent relationship
      const { data, error } = await this.supabase
        .from('dossier_relationships')
        .select('source_dossier_id')
        .eq('target_dossier_id', currentId)
        .in('relationship_type', ['parent_of', 'subsidiary_of'])
        .eq('status', 'active')
        .limit(1)
        .single();

      if (error || !data) break;

      ancestors.push({ id: data.source_dossier_id });
      currentId = data.source_dossier_id;
      depth++;
    }

    return ancestors;
  }

  /**
   * Get relationship statistics for a dossier
   * @param dossierId - UUID of the dossier
   * @returns Count of relationships by type and direction
   */
  async getRelationshipStats(dossierId: string) {
    const { data, error } = await this.supabase
      .from('dossier_relationships')
      .select('relationship_type, source_dossier_id, target_dossier_id')
      .or(`source_dossier_id.eq.${dossierId},target_dossier_id.eq.${dossierId}`)
      .eq('status', 'active');

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      outgoing: 0,
      incoming: 0,
      by_type: {} as Record<string, number>,
    };

    data?.forEach((rel) => {
      if (rel.source_dossier_id === dossierId) {
        stats.outgoing++;
      } else {
        stats.incoming++;
      }

      stats.by_type[rel.relationship_type] = (stats.by_type[rel.relationship_type] || 0) + 1;
    });

    return stats;
  }

  /**
   * List all relationships with pagination
   * @param options - Filter and pagination options
   * @returns Paginated list of relationships
   */
  async listRelationships(options: {
    status?: RelationshipStatus;
    relationship_type?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { status, relationship_type, limit = 50, offset = 0 } = options;

    let query = this.supabase
      .from('dossier_relationships')
      .select(`
        *,
        source:source_dossier_id(id, type, name_en, name_ar),
        target:target_dossier_id(id, type, name_en, name_ar)
      `, { count: 'exact' })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (relationship_type) query = query.eq('relationship_type', relationship_type);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      count,
      limit,
      offset,
    };
  }
}

export default RelationshipService;
