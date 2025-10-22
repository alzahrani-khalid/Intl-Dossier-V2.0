/**
 * Entity Search Service - Handles entity search operations across multiple tables
 * Feature: 024-intake-entity-linking
 */

import { supabaseAdmin } from '../config/supabase';
import { redis, cacheHelpers } from '../config/redis';
import type {
  EntitySearchResult,
  EntityType,
  EntityMetadata,
} from '../types/intake-entity-links.types';

// Cache TTL in seconds (5 minutes)
const ENTITY_CACHE_TTL = 300;

/**
 * Entity search filters
 */
export interface EntitySearchFilters {
  entity_types?: EntityType[];
  min_confidence?: number;
  limit?: number;
  offset?: number;
}

/**
 * Searches for entities across multiple tables based on query and filters
 * Implements ranking formula: AI confidence (50%) + Recency (30%) + Alphabetical (20%)
 *
 * @param query - Search query string
 * @param filters - Search filters
 * @param userId - User performing the search (for clearance checks)
 * @returns Array of EntitySearchResult objects
 */
export async function searchEntities(
  query: string,
  filters: EntitySearchFilters,
  userId: string
): Promise<EntitySearchResult[]> {
  try {
    // Step 1: Get user profile for clearance and organization checks
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('clearance_level, organization_id')
      .eq('user_id', userId)
      .single();

    if (userError || !userProfile) {
      throw {
        code: 'USER_NOT_FOUND',
        message: 'User profile not found',
        statusCode: 404,
      };
    }

    // Step 2: Determine which entity types to search
    const entityTypes = filters.entity_types || getAllEntityTypes();

    // Step 3: Search across all specified entity types
    const searchPromises = entityTypes.map(entityType =>
      searchEntityType(
        entityType,
        query,
        userProfile.clearance_level,
        userProfile.organization_id,
        filters.limit || 10
      )
    );

    const searchResults = await Promise.all(searchPromises);

    // Step 4: Combine and flatten results
    let allResults = searchResults.flat();

    // Step 5: Calculate combined scores for each result
    allResults = calculateCombinedScores(allResults, query);

    // Step 6: Sort by combined score (descending)
    allResults.sort((a, b) => b.combined_score - a.combined_score);

    // Step 7: Apply limit (default 10, max 50)
    const limit = Math.min(filters.limit || 10, 50);
    const offset = filters.offset || 0;
    allResults = allResults.slice(offset, offset + limit);

    return allResults;
  } catch (error: any) {
    // Re-throw if already formatted
    if (error.code && error.statusCode) {
      throw error;
    }
    // Format unexpected errors
    throw {
      code: 'SEARCH_FAILED',
      message: error.message || 'Failed to search entities',
      statusCode: 500,
    };
  }
}

/**
 * Searches a specific entity type table
 *
 * @param entityType - The entity type to search
 * @param query - Search query
 * @param clearanceLevel - User's clearance level
 * @param organizationId - User's organization ID
 * @param limit - Maximum results per entity type
 * @returns Array of EntitySearchResult objects
 */
async function searchEntityType(
  entityType: EntityType,
  query: string,
  clearanceLevel: number,
  organizationId: string,
  limit: number
): Promise<EntitySearchResult[]> {
  // Check cache first for entity metadata
  const cacheKey = `entity-search:${entityType}:${query}:${clearanceLevel}:${organizationId}`;
  const cached = await cacheHelpers.get<EntitySearchResult[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Map entity types to their respective tables and search fields
  const searchConfig = getEntitySearchConfig(entityType);
  if (!searchConfig) {
    return [];
  }

  // Build the query with type assertion to avoid deep type instantiation
  let searchQuery: any = supabaseAdmin.from(searchConfig.table).select(searchConfig.selectFields);

  // Apply text search based on entity type
  const searchPattern = `%${query}%`;
  searchQuery = searchQuery.or(
    searchConfig.searchFields.map((field: string) => `${field}.ilike.${searchPattern}`).join(',')
  );

  // Apply archived filter (exclude archived entities)
  if (searchConfig.archivedField === 'status') {
    // Special handling for dossiers
    searchQuery = searchQuery.neq('status', 'archived');
  } else if (searchConfig.archivedField) {
    searchQuery = searchQuery.is(searchConfig.archivedField, null);
  }

  // Apply clearance level filter
  if (searchConfig.classificationField) {
    searchQuery = searchQuery.lte(searchConfig.classificationField, clearanceLevel);
  }

  // Apply organization filter (for entities with organization_id)
  if (searchConfig.organizationField && !searchConfig.isGlobal) {
    searchQuery = searchQuery.eq(searchConfig.organizationField, organizationId);
  }

  // Apply limit
  searchQuery = searchQuery.limit(limit);

  // Execute query
  const { data: entities, error } = await searchQuery;

  if (error) {
    console.error(`Error searching ${entityType}:`, error);
    return [];
  }

  if (!entities || entities.length === 0) {
    return [];
  }

  // Transform to EntitySearchResult format
  const results: EntitySearchResult[] = entities.map((entity: any) => {
    const name = searchConfig.nameExtractor(entity);
    const description = searchConfig.descriptionExtractor ? searchConfig.descriptionExtractor(entity) : undefined;

    // Calculate match type and similarity score
    const matchType = calculateMatchType(name, description, query);
    const similarityScore = calculateSimilarityScore(name, description, query, matchType);

    return {
      entity_type: entityType,
      entity_id: entity.id as string,
      name,
      description,
      classification_level: searchConfig.classificationField ? Number(entity[searchConfig.classificationField]) : undefined,
      last_linked_at: (entity.last_linked_at || entity.updated_at || entity.created_at) as string | undefined,
      similarity_score: similarityScore,
      combined_score: 0, // Will be calculated later
    };
  });

  // Cache the results
  await cacheHelpers.set(cacheKey, results, ENTITY_CACHE_TTL);

  return results;
}

/**
 * Gets search configuration for an entity type
 */
function getEntitySearchConfig(entityType: EntityType) {
  const configs: Record<EntityType, any> = {
    dossier: {
      table: 'dossiers',
      selectFields: 'id, title, description, classification_level, status, created_at, updated_at',
      searchFields: ['title', 'description'],
      nameExtractor: (e: any) => e.title,
      descriptionExtractor: (e: any) => e.description,
      archivedField: 'status',
      classificationField: 'classification_level',
      organizationField: 'organization_id',
      isGlobal: false,
    },
    position: {
      table: 'positions',
      selectFields: 'id, title_en, title_ar, description_en, description_ar, classification_level, archived_at, created_at, updated_at',
      searchFields: ['title_en', 'title_ar', 'description_en', 'description_ar'],
      nameExtractor: (e: any) => e.title_en || e.title_ar,
      descriptionExtractor: (e: any) => e.description_en || e.description_ar,
      archivedField: 'archived_at',
      classificationField: 'classification_level',
      organizationField: 'organization_id',
      isGlobal: false,
    },
    mou: {
      table: 'mous',
      selectFields: 'id, title_en, title_ar, description_en, description_ar, classification_level, archived_at, created_at, updated_at',
      searchFields: ['title_en', 'title_ar', 'description_en', 'description_ar'],
      nameExtractor: (e: any) => e.title_en || e.title_ar,
      descriptionExtractor: (e: any) => e.description_en || e.description_ar,
      archivedField: 'archived_at',
      classificationField: 'classification_level',
      organizationField: 'organization_id',
      isGlobal: false,
    },
    engagement: {
      table: 'engagements',
      selectFields: 'id, title_en, title_ar, description_en, description_ar, classification_level, archived_at, created_at, updated_at',
      searchFields: ['title_en', 'title_ar', 'description_en', 'description_ar'],
      nameExtractor: (e: any) => e.title_en || e.title_ar,
      descriptionExtractor: (e: any) => e.description_en || e.description_ar,
      archivedField: 'archived_at',
      classificationField: 'classification_level',
      organizationField: 'organization_id',
      isGlobal: false,
    },
    assignment: {
      table: 'assignments',
      selectFields: 'id, title, description, classification_level, archived_at, created_at, updated_at',
      searchFields: ['title', 'description'],
      nameExtractor: (e: any) => e.title,
      descriptionExtractor: (e: any) => e.description,
      archivedField: 'archived_at',
      classificationField: 'classification_level',
      organizationField: 'organization_id',
      isGlobal: false,
    },
    commitment: {
      table: 'commitments',
      selectFields: 'id, title, description, classification_level, archived_at, created_at, updated_at',
      searchFields: ['title', 'description'],
      nameExtractor: (e: any) => e.title,
      descriptionExtractor: (e: any) => e.description,
      archivedField: 'archived_at',
      classificationField: 'classification_level',
      organizationField: 'organization_id',
      isGlobal: false,
    },
    intelligence_signal: {
      table: 'intelligence_signals',
      selectFields: 'id, title, content, classification_level, archived_at, created_at, updated_at',
      searchFields: ['title', 'content'],
      nameExtractor: (e: any) => e.title,
      descriptionExtractor: (e: any) => e.content,
      archivedField: 'archived_at',
      classificationField: 'classification_level',
      organizationField: 'organization_id',
      isGlobal: false,
    },
    organization: {
      table: 'organizations',
      selectFields: 'id, name_en, name_ar, description, archived_at, created_at, updated_at',
      searchFields: ['name_en', 'name_ar', 'description'],
      nameExtractor: (e: any) => e.name_en || e.name_ar,
      descriptionExtractor: (e: any) => e.description,
      archivedField: 'archived_at',
      classificationField: null,
      organizationField: 'id',
      isGlobal: true, // Organizations are visible across the system
    },
    country: {
      table: 'countries',
      selectFields: 'id, name_en, name_ar, iso_code, archived_at, created_at, updated_at',
      searchFields: ['name_en', 'name_ar', 'iso_code'],
      nameExtractor: (e: any) => e.name_en || e.name_ar,
      descriptionExtractor: (e: any) => e.iso_code,
      archivedField: 'archived_at',
      classificationField: null,
      organizationField: null,
      isGlobal: true, // Countries are global entities
    },
    forum: {
      table: 'forums',
      selectFields: 'id, name_en, name_ar, description, archived_at, created_at, updated_at',
      searchFields: ['name_en', 'name_ar', 'description'],
      nameExtractor: (e: any) => e.name_en || e.name_ar,
      descriptionExtractor: (e: any) => e.description,
      archivedField: 'archived_at',
      classificationField: null,
      organizationField: 'organization_id',
      isGlobal: false,
    },
    working_group: {
      table: 'working_groups',
      selectFields: 'id, name_en, name_ar, description, archived_at, created_at, updated_at',
      searchFields: ['name_en', 'name_ar', 'description'],
      nameExtractor: (e: any) => e.name_en || e.name_ar,
      descriptionExtractor: (e: any) => e.description,
      archivedField: 'archived_at',
      classificationField: null,
      organizationField: 'organization_id',
      isGlobal: false,
    },
    topic: {
      table: 'topics',
      selectFields: 'id, name_en, name_ar, description, archived_at, created_at, updated_at',
      searchFields: ['name_en', 'name_ar', 'description'],
      nameExtractor: (e: any) => e.name_en || e.name_ar,
      descriptionExtractor: (e: any) => e.description,
      archivedField: 'archived_at',
      classificationField: null,
      organizationField: 'organization_id',
      isGlobal: false,
    },
  };

  return configs[entityType];
}

/**
 * Calculates match type (exact, partial, or ai_suggested)
 */
function calculateMatchType(name: string, description: string | undefined, query: string): 'exact' | 'partial' | 'ai_suggested' {
  const lowerQuery = query.toLowerCase();
  const lowerName = name.toLowerCase();
  const lowerDescription = description?.toLowerCase() || '';

  // Exact match in name
  if (lowerName === lowerQuery) {
    return 'exact';
  }

  // Partial match in name or description
  if (lowerName.includes(lowerQuery) || lowerDescription.includes(lowerQuery)) {
    return 'partial';
  }

  // Default to AI suggested (would be determined by vector similarity in production)
  return 'ai_suggested';
}

/**
 * Calculates similarity score based on match type and text similarity
 */
function calculateSimilarityScore(
  name: string,
  description: string | undefined,
  query: string,
  matchType: 'exact' | 'partial' | 'ai_suggested'
): number {
  if (matchType === 'exact') {
    return 1.0;
  }

  if (matchType === 'partial') {
    // Calculate based on position and frequency of match
    const lowerQuery = query.toLowerCase();
    const lowerName = name.toLowerCase();
    const lowerDescription = description?.toLowerCase() || '';

    let score = 0;

    // Name match scores higher than description
    if (lowerName.includes(lowerQuery)) {
      const position = lowerName.indexOf(lowerQuery);
      // Earlier matches score higher
      score = 0.8 - (position / lowerName.length) * 0.2;
    } else if (lowerDescription.includes(lowerQuery)) {
      const position = lowerDescription.indexOf(lowerQuery);
      score = 0.5 - (position / lowerDescription.length) * 0.1;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  // AI suggested would use vector similarity
  // For now, return a low default score
  return 0.2;
}

/**
 * Calculates combined scores using the ranking formula:
 * AI confidence (50%) + Recency (30%) + Alphabetical (20%)
 */
function calculateCombinedScores(results: EntitySearchResult[], query: string): EntitySearchResult[] {
  if (results.length === 0) return results;

  // Calculate recency scores
  const now = new Date().getTime();
  const recencyScores = results.map(result => {
    if (!result.last_linked_at) return 0;
    const lastLinked = new Date(result.last_linked_at).getTime();
    const daysSinceLinked = (now - lastLinked) / (1000 * 60 * 60 * 24);
    // Exponential decay: recent items score higher
    return Math.exp(-daysSinceLinked / 30); // 30-day half-life
  });

  // Normalize recency scores
  const maxRecency = Math.max(...recencyScores);
  const normalizedRecencyScores = recencyScores.map(score =>
    maxRecency > 0 ? score / maxRecency : 0
  );

  // Calculate alphabetical scores
  const sortedByName = [...results].sort((a, b) => a.name.localeCompare(b.name));
  const alphabeticalScores = results.map(result => {
    const index = sortedByName.findIndex(r => r.entity_id === result.entity_id);
    return 1 - (index / results.length);
  });

  // Calculate combined scores
  return results.map((result, index) => ({
    ...result,
    combined_score: (
      (result.similarity_score || 0) * 0.5 + // AI confidence: 50%
      normalizedRecencyScores[index] * 0.3 + // Recency: 30%
      alphabeticalScores[index] * 0.2         // Alphabetical: 20%
    ),
  }));
}

/**
 * Gets all entity types
 */
function getAllEntityTypes(): EntityType[] {
  return [
    'dossier',
    'position',
    'mou',
    'engagement',
    'assignment',
    'commitment',
    'intelligence_signal',
    'organization',
    'country',
    'forum',
    'working_group',
    'topic',
  ];
}

/**
 * Gets entity metadata from cache or database
 * Used for quick entity lookups with caching
 *
 * @param entityType - The entity type
 * @param entityId - The entity ID
 * @returns EntityMetadata or null
 */
export async function getEntityMetadata(
  entityType: EntityType,
  entityId: string
): Promise<EntityMetadata | null> {
  // Check cache first
  const cacheKey = `entity:${entityType}:${entityId}`;
  const cached = await cacheHelpers.get<EntityMetadata>(cacheKey);
  if (cached) {
    return cached;
  }

  // Get from database
  const searchConfig = getEntitySearchConfig(entityType);
  if (!searchConfig) {
    return null;
  }

  const { data: entityData, error } = await supabaseAdmin
    .from(searchConfig.table)
    .select(searchConfig.selectFields)
    .eq('id', entityId)
    .single();

  if (error || !entityData) {
    return null;
  }

  // Type assertion to work around Supabase type inference issues
  const entity = entityData as any;

  const metadata: EntityMetadata = {
    entity_type: entityType,
    entity_id: entityId,
    name: searchConfig.nameExtractor(entity),
    description: searchConfig.descriptionExtractor ? searchConfig.descriptionExtractor(entity) : undefined,
    classification_level: searchConfig.classificationField ? Number(entity[searchConfig.classificationField]) : undefined,
    last_linked_at: (entity.last_linked_at || entity.updated_at || entity.created_at) as string | undefined,
    is_archived: searchConfig.archivedField === 'status'
      ? entity.status === 'archived'
      : entity[searchConfig.archivedField] !== null,
    organization_id: searchConfig.organizationField ? entity[searchConfig.organizationField] as string : '',
  };

  // Cache the metadata
  await cacheHelpers.set(cacheKey, metadata, ENTITY_CACHE_TTL);

  return metadata;
}

/**
 * Invalidates entity cache
 * Called when entity is updated or deleted
 *
 * @param entityType - The entity type
 * @param entityId - The entity ID
 */
export async function invalidateEntityCache(
  entityType: EntityType,
  entityId: string
): Promise<void> {
  const cacheKey = `entity:${entityType}:${entityId}`;
  await cacheHelpers.del(cacheKey);

  // Also clear search cache patterns that might include this entity
  await cacheHelpers.clearPattern(`entity-search:${entityType}:*`);
}