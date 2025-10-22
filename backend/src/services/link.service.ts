/**
 * Link Service - Handles entity linking operations for intake tickets
 * Feature: 024-intake-entity-linking
 */

import { supabaseAdmin } from '../config/supabase';
import type {
  EntityLink,
  CreateLinkRequest,
  UpdateLinkRequest,
  LinkType,
  EntityType,
  LinkValidationResult,
} from '../types/intake-entity-links.types';

// Anchor entity types that can have primary links
const ANCHOR_ENTITY_TYPES: EntityType[] = ['dossier', 'country', 'organization', 'forum'];

// Entity types that can have requested links
const REQUESTABLE_ENTITY_TYPES: EntityType[] = ['position', 'mou', 'engagement'];

// Entity types that can have assigned_to links
const ASSIGNABLE_ENTITY_TYPES: EntityType[] = ['assignment'];

/**
 * Creates a new entity link for an intake ticket
 * Handles validation, clearance checks, and audit logging
 *
 * @param intakeId - The intake ticket ID
 * @param userId - The user creating the link
 * @param data - Link creation request data
 * @returns Created EntityLink
 * @throws Error with code, message, and statusCode
 */
export async function createEntityLink(
  intakeId: string,
  userId: string,
  data: CreateLinkRequest
): Promise<EntityLink> {
  try {
    // Step 1: Validate link type constraints
    const validationResult = validateLinkTypeConstraints(data.entity_type, data.link_type);
    if (!validationResult.valid) {
      throw {
        code: 'INVALID_LINK_TYPE',
        message: validationResult.errors[0],
        statusCode: 400,
      };
    }

    // Step 2: Get user profile for clearance and organization checks
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

    // Step 3: Check entity existence and get its metadata
    const entityMetadata = await getEntityMetadata(data.entity_type, data.entity_id);

    if (!entityMetadata.exists) {
      throw {
        code: 'ENTITY_NOT_FOUND',
        message: `${data.entity_type} with ID ${data.entity_id} not found`,
        statusCode: 404,
      };
    }

    // Step 4: Check if entity is archived
    if (entityMetadata.isArchived) {
      throw {
        code: 'ENTITY_ARCHIVED',
        message: `Cannot link to archived ${data.entity_type}`,
        statusCode: 400,
      };
    }

    // Step 5: Enforce clearance level
    if (entityMetadata.classificationLevel &&
        entityMetadata.classificationLevel > userProfile.clearance_level) {
      throw {
        code: 'INSUFFICIENT_CLEARANCE',
        message: `Insufficient clearance level to link to this ${data.entity_type}`,
        statusCode: 403,
      };
    }

    // Step 6: Enforce organization boundary (for entities with org_id)
    if (entityMetadata.organizationId &&
        entityMetadata.organizationId !== userProfile.organization_id) {
      throw {
        code: 'ORGANIZATION_MISMATCH',
        message: `Cannot link to ${data.entity_type} from different organization`,
        statusCode: 403,
      };
    }

    // Step 7: Check for duplicate primary link
    if (data.link_type === 'primary') {
      const { data: existingPrimary, error: primaryCheckError } = await supabaseAdmin
        .from('intake_entity_links')
        .select('id')
        .eq('intake_id', intakeId)
        .eq('link_type', 'primary')
        .is('deleted_at', null)
        .single();

      if (existingPrimary && !primaryCheckError) {
        throw {
          code: 'DUPLICATE_PRIMARY_LINK',
          message: 'Intake already has a primary link',
          statusCode: 400,
        };
      }
    }

    // Step 8: Check for duplicate assigned_to link
    if (data.link_type === 'assigned_to') {
      const { data: existingAssigned, error: assignedCheckError } = await supabaseAdmin
        .from('intake_entity_links')
        .select('id')
        .eq('intake_id', intakeId)
        .eq('link_type', 'assigned_to')
        .is('deleted_at', null)
        .single();

      if (existingAssigned && !assignedCheckError) {
        throw {
          code: 'DUPLICATE_ASSIGNED_LINK',
          message: 'Intake already has an assigned_to link',
          statusCode: 400,
        };
      }
    }

    // Step 9: Auto-increment link_order
    const { data: maxOrderResult, error: orderError } = await supabaseAdmin
      .from('intake_entity_links')
      .select('link_order')
      .eq('intake_id', intakeId)
      .order('link_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrderResult?.link_order || 0) + 1;

    // Step 10: Validate notes field (max 1000 chars)
    if (data.notes && data.notes.length > 1000) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Notes exceeds maximum length of 1000 characters',
        statusCode: 400,
        details: { field: 'notes', maxLength: 1000 },
      };
    }

    // Step 11: Create the link
    const { data: newLink, error: insertError } = await supabaseAdmin
      .from('intake_entity_links')
      .insert({
        intake_id: intakeId,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        link_type: data.link_type,
        source: data.source || 'human',
        confidence: data.confidence || null,
        notes: data.notes || null,
        link_order: data.link_order || nextOrder,
        suggested_by: data.suggested_by || null,
        linked_by: userId,
        _version: 1,
      })
      .select()
      .single();

    if (insertError || !newLink) {
      throw {
        code: 'CREATE_FAILED',
        message: `Failed to create link: ${insertError?.message}`,
        statusCode: 500,
      };
    }

    return newLink as EntityLink;
  } catch (error: any) {
    // Re-throw if already formatted
    if (error.code && error.statusCode) {
      throw error;
    }
    // Format unexpected errors
    throw {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      statusCode: 500,
    };
  }
}

/**
 * Retrieves entity links for an intake ticket
 *
 * @param intakeId - The intake ticket ID
 * @param includeDeleted - Whether to include soft-deleted links
 * @returns Array of EntityLink objects
 */
export async function getEntityLinks(
  intakeId: string,
  includeDeleted: boolean = false
): Promise<EntityLink[]> {
  try {
    let query = supabaseAdmin
      .from('intake_entity_links')
      .select('*')
      .eq('intake_id', intakeId)
      .order('link_order', { ascending: true });

    // Exclude deleted links unless specifically requested
    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data: links, error } = await query;

    if (error) {
      throw {
        code: 'FETCH_FAILED',
        message: `Failed to fetch links: ${error.message}`,
        statusCode: 500,
      };
    }

    return (links || []) as EntityLink[];
  } catch (error: any) {
    // Re-throw if already formatted
    if (error.code && error.statusCode) {
      throw error;
    }
    // Format unexpected errors
    throw {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      statusCode: 500,
    };
  }
}

/**
 * Updates an existing entity link
 * Implements optimistic locking with _version field
 *
 * @param linkId - The link ID to update
 * @param userId - The user performing the update
 * @param data - Update request data
 * @returns Updated EntityLink
 * @throws Error with code, message, and statusCode
 */
export async function updateEntityLink(
  linkId: string,
  userId: string,
  data: UpdateLinkRequest
): Promise<EntityLink> {
  try {
    // Step 1: Get current link with version check
    const { data: currentLink, error: fetchError } = await supabaseAdmin
      .from('intake_entity_links')
      .select('*')
      .eq('id', linkId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !currentLink) {
      throw {
        code: 'LINK_NOT_FOUND',
        message: 'Link not found',
        statusCode: 404,
      };
    }

    // Step 2: Check version for optimistic locking
    if (currentLink._version !== data._version) {
      throw {
        code: 'VERSION_CONFLICT',
        message: 'The link has been modified by another user. Please refresh and try again.',
        statusCode: 409,
      };
    }

    // Step 3: Validate notes field if provided
    if (data.notes !== undefined && data.notes !== null && data.notes.length > 1000) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Notes exceeds maximum length of 1000 characters',
        statusCode: 400,
        details: { field: 'notes', maxLength: 1000 },
      };
    }

    // Step 4: Update the link with version increment
    const updateData: any = {
      _version: currentLink._version + 1,
      updated_at: new Date().toISOString(),
    };

    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.link_order !== undefined) updateData.link_order = data.link_order;

    const { data: updatedLink, error: updateError } = await supabaseAdmin
      .from('intake_entity_links')
      .update(updateData)
      .eq('id', linkId)
      .eq('_version', data._version) // Double-check version in WHERE clause
      .select()
      .single();

    if (updateError || !updatedLink) {
      // Check if it's a version conflict
      const { data: checkLink } = await supabaseAdmin
        .from('intake_entity_links')
        .select('_version')
        .eq('id', linkId)
        .single();

      if (checkLink && checkLink._version !== data._version) {
        throw {
          code: 'VERSION_CONFLICT',
          message: 'The link has been modified by another user. Please refresh and try again.',
          statusCode: 409,
        };
      }

      throw {
        code: 'UPDATE_FAILED',
        message: `Failed to update link: ${updateError?.message}`,
        statusCode: 500,
      };
    }

    return updatedLink as EntityLink;
  } catch (error: any) {
    // Re-throw if already formatted
    if (error.code && error.statusCode) {
      throw error;
    }
    // Format unexpected errors
    throw {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      statusCode: 500,
    };
  }
}

/**
 * Validates link type constraints based on entity type
 *
 * @param entityType - The entity type
 * @param linkType - The link type
 * @returns LinkValidationResult
 */
function validateLinkTypeConstraints(
  entityType: EntityType,
  linkType: LinkType
): LinkValidationResult {
  const errors: string[] = [];

  // Primary links only for anchor entities
  if (linkType === 'primary' && !ANCHOR_ENTITY_TYPES.includes(entityType)) {
    errors.push(`Link type 'primary' is only allowed for anchor entities: ${ANCHOR_ENTITY_TYPES.join(', ')}`);
  }

  // Requested links only for position/mou/engagement
  if (linkType === 'requested' && !REQUESTABLE_ENTITY_TYPES.includes(entityType)) {
    errors.push(`Link type 'requested' is only allowed for: ${REQUESTABLE_ENTITY_TYPES.join(', ')}`);
  }

  // Assigned_to links only for assignment
  if (linkType === 'assigned_to' && !ASSIGNABLE_ENTITY_TYPES.includes(entityType)) {
    errors.push(`Link type 'assigned_to' is only allowed for: ${ASSIGNABLE_ENTITY_TYPES.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets metadata for an entity from its respective table
 *
 * @param entityType - The entity type
 * @param entityId - The entity ID
 * @returns Entity metadata
 */
async function getEntityMetadata(
  entityType: EntityType,
  entityId: string
): Promise<{
  exists: boolean;
  isArchived: boolean;
  classificationLevel?: number;
  organizationId?: string;
}> {
  // Map entity types to their respective tables and fields
  const tableMapping: Record<EntityType, {
    table: string;
    archivedField: string;
    classificationField?: string;
    organizationField?: string;
  }> = {
    dossier: {
      table: 'dossiers',
      archivedField: 'status',
      classificationField: 'classification_level',
      organizationField: 'organization_id',
    },
    position: {
      table: 'positions',
      archivedField: 'archived_at',
      classificationField: 'classification_level',
      organizationField: 'organization_id',
    },
    mou: {
      table: 'mous',
      archivedField: 'archived_at',
      classificationField: 'classification_level',
      organizationField: 'organization_id',
    },
    engagement: {
      table: 'engagements',
      archivedField: 'archived_at',
      classificationField: 'classification_level',
      organizationField: 'organization_id',
    },
    assignment: {
      table: 'assignments',
      archivedField: 'archived_at',
      classificationField: 'classification_level',
      organizationField: 'organization_id',
    },
    commitment: {
      table: 'commitments',
      archivedField: 'archived_at',
      classificationField: 'classification_level',
      organizationField: 'organization_id',
    },
    intelligence_signal: {
      table: 'intelligence_signals',
      archivedField: 'archived_at',
      classificationField: 'classification_level',
      organizationField: 'organization_id',
    },
    organization: {
      table: 'organizations',
      archivedField: 'archived_at',
      organizationField: 'id', // Organization's own ID
    },
    country: {
      table: 'countries',
      archivedField: 'archived_at',
    },
    forum: {
      table: 'forums',
      archivedField: 'archived_at',
      organizationField: 'organization_id',
    },
    working_group: {
      table: 'working_groups',
      archivedField: 'archived_at',
      organizationField: 'organization_id',
    },
    topic: {
      table: 'topics',
      archivedField: 'archived_at',
      organizationField: 'organization_id',
    },
  };

  const mapping = tableMapping[entityType];
  if (!mapping) {
    return { exists: false, isArchived: false };
  }

  // Build select query based on available fields
  const selectFields = ['id'];
  if (mapping.classificationField) selectFields.push(mapping.classificationField);
  if (mapping.organizationField) selectFields.push(mapping.organizationField);
  selectFields.push(mapping.archivedField);

  const { data: entityData, error } = await supabaseAdmin
    .from(mapping.table)
    .select(selectFields.join(', '))
    .eq('id', entityId)
    .single();

  if (error || !entityData) {
    return { exists: false, isArchived: false };
  }

  // Type assertion to work around Supabase type inference issues
  const entity = entityData as any;

  // Special handling for dossier status field
  const isArchived = entityType === 'dossier'
    ? entity.status === 'archived'
    : entity[mapping.archivedField] !== null;

  return {
    exists: true,
    isArchived,
    classificationLevel: mapping.classificationField ? entity[mapping.classificationField] : undefined,
    organizationId: mapping.organizationField ? entity[mapping.organizationField] : undefined,
  };
}

/**
 * Soft deletes an entity link
 *
 * @param linkId - The link ID to delete
 * @param userId - The user performing the deletion
 * @returns Deleted EntityLink
 */
export async function deleteEntityLink(
  linkId: string,
  userId: string
): Promise<EntityLink> {
  try {
    const { data: deletedLink, error } = await supabaseAdmin
      .from('intake_entity_links')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error || !deletedLink) {
      throw {
        code: 'DELETE_FAILED',
        message: `Failed to delete link: ${error?.message || 'Link not found'}`,
        statusCode: error ? 500 : 404,
      };
    }

    return deletedLink as EntityLink;
  } catch (error: any) {
    // Re-throw if already formatted
    if (error.code && error.statusCode) {
      throw error;
    }
    // Format unexpected errors
    throw {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      statusCode: 500,
    };
  }
}

/**
 * Restores a soft-deleted entity link
 *
 * @param linkId - The link ID to restore
 * @param userId - The user performing the restoration
 * @returns Restored EntityLink
 */
export async function restoreEntityLink(
  linkId: string,
  userId: string
): Promise<EntityLink> {
  try {
    const { data: restoredLink, error} = await supabaseAdmin
      .from('intake_entity_links')
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkId)
      .not('deleted_at', 'is', null)
      .select()
      .single();

    if (error || !restoredLink) {
      throw {
        code: 'RESTORE_FAILED',
        message: `Failed to restore link: ${error?.message || 'Link not found'}`,
        statusCode: error ? 500 : 404,
      };
    }

    return restoredLink as EntityLink;
  } catch (error: any) {
    // Re-throw if already formatted
    if (error.code && error.statusCode) {
      throw error;
    }
    // Format unexpected errors
    throw {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      statusCode: 500,
    };
  }
}

/**
 * Gets all intake tickets linked to a specific entity (reverse lookup)
 * T092 [US4]: Reverse lookup with pagination and filtering
 *
 * Performance target: <2 seconds for 1000+ intakes (SC-004)
 *
 * @param entityType - The entity type
 * @param entityId - The entity ID
 * @param options - Query options (pagination, filtering, clearance)
 * @returns Paginated list of intake tickets linked to the entity
 */
export async function getEntityIntakes(
  entityType: EntityType,
  entityId: string,
  options: {
    page?: number;
    pageSize?: number;
    linkType?: LinkType;
    userClearanceLevel?: number;
  } = {}
): Promise<{
  intakes: Array<{
    intake_id: string;
    link_id: string;
    link_type: LinkType;
    source: 'human' | 'ai';
    confidence: number | null;
    notes: string | null;
    link_order: number;
    linked_by: string;
    linked_at: string;
    intake_data?: any; // Optional: Include intake ticket metadata
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}> {
  try {
    const page = options.page || 1;
    const pageSize = Math.min(options.pageSize || 50, 100); // Max 100 per page
    const offset = (page - 1) * pageSize;

    // Build query with performance optimization
    let query = supabaseAdmin
      .from('intake_entity_links')
      .select('intake_id, id, link_type, source, confidence, notes, link_order, linked_by, created_at, updated_at', { count: 'exact' })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .is('deleted_at', null);

    // T094: Add link type filtering
    if (options.linkType) {
      query = query.eq('link_type', options.linkType);
    }

    // T095: Add clearance level filtering (requires joining with intake tickets)
    // For now, we'll filter after fetching to avoid complex joins
    // In production, this should be done via a database view or function

    // Add pagination
    query = query
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false }); // Most recent first

    const { data: links, error, count } = await query;

    if (error) {
      throw {
        code: 'FETCH_FAILED',
        message: `Failed to fetch entity intakes: ${error.message}`,
        statusCode: 500,
      };
    }

    // Transform results
    const intakes = (links || []).map(link => ({
      intake_id: link.intake_id,
      link_id: link.id,
      link_type: link.link_type as LinkType,
      source: link.source as 'human' | 'ai',
      confidence: link.confidence,
      notes: link.notes,
      link_order: link.link_order,
      linked_by: link.linked_by,
      linked_at: link.created_at,
    }));

    // T095: Filter by clearance level if specified
    // This is a simplified implementation - in production, use a database function
    let filteredIntakes = intakes;
    if (options.userClearanceLevel !== undefined) {
      // Fetch intake classification levels for filtering
      const intakeIds = intakes.map(i => i.intake_id);
      if (intakeIds.length > 0) {
        const { data: intakeData } = await supabaseAdmin
          .from('intake_tickets')
          .select('id, classification_level')
          .in('id', intakeIds);

        if (intakeData) {
          const intakeClassMap = new Map(
            intakeData.map(i => [i.id, i.classification_level || 0])
          );

          filteredIntakes = intakes.filter(
            intake => (intakeClassMap.get(intake.intake_id) || 0) <= options.userClearanceLevel!
          );
        }
      }
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      intakes: filteredIntakes,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    };
  } catch (error: any) {
    // Re-throw if already formatted
    if (error.code && error.statusCode) {
      throw error;
    }
    // Format unexpected errors
    throw {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      statusCode: 500,
    };
  }
}

/**
 * Reorders entity links for an intake ticket
 * T109 [US5]: Reorder links with link_order field
 *
 * @param intakeId - The intake ticket ID
 * @param userId - The user performing the reorder
 * @param linkOrders - Array of {link_id, link_order} to update
 * @returns Array of updated EntityLink objects
 * @throws Error with code, message, and statusCode
 */
export async function reorderEntityLinks(
  intakeId: string,
  userId: string,
  linkOrders: Array<{ link_id: string; link_order: number }>
): Promise<EntityLink[]> {
  try {
    // Step 1: Validate input
    if (!linkOrders || linkOrders.length === 0) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'At least one link order is required',
        statusCode: 400,
      };
    }

    // Step 2: Verify all links belong to the intake
    const linkIds = linkOrders.map(lo => lo.link_id);
    const { data: existingLinks, error: fetchError } = await supabaseAdmin
      .from('intake_entity_links')
      .select('id, intake_id, link_order, _version')
      .in('id', linkIds)
      .is('deleted_at', null);

    if (fetchError) {
      throw {
        code: 'FETCH_FAILED',
        message: `Failed to fetch links: ${fetchError.message}`,
        statusCode: 500,
      };
    }

    if (!existingLinks || existingLinks.length !== linkIds.length) {
      throw {
        code: 'LINK_NOT_FOUND',
        message: 'One or more links not found',
        statusCode: 404,
      };
    }

    // Verify all links belong to the same intake
    const invalidLinks = existingLinks.filter(link => link.intake_id !== intakeId);
    if (invalidLinks.length > 0) {
      throw {
        code: 'INVALID_LINK',
        message: 'One or more links do not belong to this intake',
        statusCode: 400,
      };
    }

    // Step 3: Update each link's order (batch update)
    const updatedLinks: EntityLink[] = [];

    for (const orderUpdate of linkOrders) {
      const existingLink = existingLinks.find(l => l.id === orderUpdate.link_id);
      if (!existingLink) continue;

      const { data: updatedLink, error: updateError } = await supabaseAdmin
        .from('intake_entity_links')
        .update({
          link_order: orderUpdate.link_order,
          _version: existingLink._version + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderUpdate.link_id)
        .select()
        .single();

      if (updateError || !updatedLink) {
        throw {
          code: 'UPDATE_FAILED',
          message: `Failed to update link order: ${updateError?.message}`,
          statusCode: 500,
        };
      }

      updatedLinks.push(updatedLink as EntityLink);
    }

    return updatedLinks;
  } catch (error: any) {
    // Re-throw if already formatted
    if (error.code && error.statusCode) {
      throw error;
    }
    // Format unexpected errors
    throw {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      statusCode: 500,
    };
  }
}

/**
 * Creates multiple entity links in a single batch operation
 * T082 [US3]: Batch link creation with partial failure support
 *
 * Performance target: <500ms for 50 links (SC-003)
 *
 * @param intakeId - The intake ticket ID
 * @param userId - The user creating the links
 * @param links - Array of link creation requests (max 50)
 * @returns Batch creation result with succeeded and failed links
 * @throws Error with code, message, and statusCode
 */
export async function createBatchLinks(
  intakeId: string,
  userId: string,
  links: CreateLinkRequest[]
): Promise<{
  succeeded: EntityLink[];
  failed: Array<{
    index: number;
    entity_type: string;
    entity_id: string;
    error: {
      code: string;
      message: string;
      details?: any;
    };
  }>;
}> {
  try {
    // Step 1: Validate batch size
    if (links.length < 1) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'At least 1 link is required',
        statusCode: 400,
      };
    }

    if (links.length > 50) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Maximum 50 links allowed per batch',
        statusCode: 400,
      };
    }

    const succeeded: EntityLink[] = [];
    const failed: Array<{
      index: number;
      entity_type: string;
      entity_id: string;
      error: {
        code: string;
        message: string;
        details?: any;
      };
    }> = [];

    // Step 2: Process each link individually (allows partial failures)
    for (let i = 0; i < links.length; i++) {
      const linkData = links[i];

      try {
        // Use existing createEntityLink function for each link
        // This ensures all validation rules are applied consistently
        const createdLink = await createEntityLink(intakeId, userId, {
          ...linkData,
          intake_id: intakeId,
        });

        succeeded.push(createdLink);
      } catch (linkError: any) {
        // Capture individual link failures
        failed.push({
          index: i,
          entity_type: linkData.entity_type,
          entity_id: linkData.entity_id,
          error: {
            code: linkError.code || 'CREATE_FAILED',
            message: linkError.message || 'Failed to create link',
            details: linkError.details || {},
          },
        });
      }
    }

    // Step 3: Return results (always succeeds, even if all links failed)
    return {
      succeeded,
      failed,
    };
  } catch (error: any) {
    // Re-throw if already formatted
    if (error.code && error.statusCode) {
      throw error;
    }
    // Format unexpected errors
    throw {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      statusCode: 500,
    };
  }
}