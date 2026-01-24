// T141, T147, T148 - Push sync with conflict detection and resolution
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { validateJWT, createServiceClient } from '../_shared/auth.ts'
import {
  errorResponse,
  successResponse,
  parseBody,
  validateRequiredFields,
  log,
  checkRateLimit,
  createHandler
} from '../_shared/utils.ts'

interface SyncEntity {
  id: string
  _entity_type: string
  _version: number
  _local_updated_at: string
  [key: string]: any
}

interface SyncPushRequest {
  entities: SyncEntity[]
  device_id?: string
}

interface ConflictInfo {
  entity_id: string
  entity_type: string
  local_version: number
  server_version: number
  conflicting_fields: string[]
  server_entity: any
  local_entity: any
}

interface SyncPushResponse {
  success: SyncEntity[]
  conflicts: ConflictInfo[]
  errors: { entity_id: string; error: string }[]
}

/**
 * Get explicit column list for each syncable entity type
 * Replaces .select('*') for better performance and security
 */
function getEntityColumns(entityType: string): string {
  const columnMaps: Record<string, string> = {
    dossiers: 'id, type, name_en, name_ar, description_en, description_ar, status, sensitivity_level, tags, metadata, created_at, updated_at, created_by, updated_by, version',
    positions: 'id, position_type_id, title_en, title_ar, content_en, content_ar, rationale_en, rationale_ar, alignment_notes_en, alignment_notes_ar, thematic_category, status, current_stage, approval_chain_config, consistency_score, emergency_correction, corrected_at, corrected_by, correction_reason, corrected_version_id, author_id, created_at, updated_at, version',
    tasks: 'id, title, description, assignee_id, engagement_id, status, workflow_stage, priority, sla_deadline, work_item_type, work_item_id, source, created_by, updated_by, completed_by, created_at, updated_at, completed_at, is_deleted, version',
    intake_tickets: 'id, ticket_number, request_type, title, title_ar, description, description_ar, type_specific_fields, sensitivity, urgency, priority, dossier_id, parent_ticket_id, converted_to_type, converted_to_id, assigned_to, assigned_unit, status, resolution, resolution_ar, created_at, created_by, updated_at, updated_by, submitted_at, triaged_at, assigned_at, resolved_at, closed_at, source, client_metadata, version',
    documents: 'id, title, description, file_path, file_size, mime_type, created_at, updated_at, created_by, version',
    calendar_entries: 'id, dossier_id, event_type, title_en, title_ar, description_en, description_ar, start_datetime, end_datetime, timezone, location_en, location_ar, is_virtual, virtual_link, room_en, room_ar, status, created_at, updated_at, version',
    calendar_events: 'id, dossier_id, event_type, title_en, title_ar, description_en, description_ar, start_datetime, end_datetime, timezone, location_en, location_ar, is_virtual, virtual_link, room_en, room_ar, status, created_at, updated_at, version'
  }

  // Return explicit columns for known types, fallback to common columns for unknown types
  return columnMaps[entityType] || 'id, created_at, updated_at, version'
}

/**
 * T147 - Detect conflicts between local and server entities
 */
async function detectConflicts(
  supabase: any,
  entity: SyncEntity
): Promise<ConflictInfo | null> {
  try {
    // Get current server version
    const { data: serverEntity, error } = await supabase
      .from(entity._entity_type)
      .select('id, created_at, updated_at')
      .eq('id', entity.id)
      .single()

    if (error || !serverEntity) {
      // Entity doesn't exist on server, no conflict
      return null
    }

    // Check version mismatch
    const serverVersion = serverEntity.version || 0
    const localVersion = entity._version || 0

    if (serverVersion !== localVersion) {
      // Compare timestamps
      const serverUpdatedAt = new Date(serverEntity.updated_at).getTime()
      const localUpdatedAt = new Date(entity._local_updated_at).getTime()

      // Find conflicting fields
      const conflictingFields: string[] = []
      const ignoredFields = ['_entity_type', '_version', '_local_updated_at', 'updated_at', 'created_at']

      for (const key of Object.keys(entity)) {
        if (ignoredFields.includes(key)) continue

        const localValue = entity[key]
        const serverValue = serverEntity[key]

        // Check if values differ
        if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
          conflictingFields.push(key)
        }
      }

      if (conflictingFields.length > 0) {
        return {
          entity_id: entity.id,
          entity_type: entity._entity_type,
          local_version: localVersion,
          server_version: serverVersion,
          conflicting_fields: conflictingFields,
          server_entity: serverEntity,
          local_entity: entity
        }
      }
    }

    return null
  } catch (error) {
    log('error', 'Conflict detection failed', {
      entityId: entity.id,
      entityType: entity._entity_type,
      error: error.message
    })
    throw error
  }
}

/**
 * T148 - Resolve timestamp conflicts with server authority
 */
async function resolveTimestampConflict(
  supabase: any,
  entity: SyncEntity,
  conflict: ConflictInfo
): Promise<SyncEntity> {
  try {
    const serverUpdatedAt = new Date(conflict.server_entity.updated_at).getTime()
    const localUpdatedAt = new Date(entity._local_updated_at).getTime()

    // Server wins on tie or if more recent
    if (serverUpdatedAt >= localUpdatedAt) {
      // Return server version with incremented version number
      return {
        ...conflict.server_entity,
        _entity_type: entity._entity_type,
        _version: conflict.server_version
      }
    }

    // Local wins - update server with local changes
    const updateData = { ...entity }
    delete updateData._entity_type
    delete updateData._version
    delete updateData._local_updated_at
    delete updateData.id

    // Increment version atomically
    updateData.version = conflict.server_version + 1
    updateData.updated_at = new Date().toISOString()

    // Get column list for this entity type
    const selectColumns = getEntityColumns(entity._entity_type)

    const { data: updatedEntity, error } = await supabase
      .from(entity._entity_type)
      .update(updateData)
      .eq('id', entity.id)
      .select(selectColumns)
      .single()

    if (error) {
      throw error
    }

    return {
      ...updatedEntity,
      _entity_type: entity._entity_type,
      _version: updatedEntity.version
    }
  } catch (error) {
    log('error', 'Timestamp conflict resolution failed', {
      entityId: entity.id,
      entityType: entity._entity_type,
      error: error.message
    })
    throw error
  }
}

/**
 * Process a single entity push
 */
async function processEntityPush(
  supabase: any,
  entity: SyncEntity,
  userId: string
): Promise<{ success?: SyncEntity; conflict?: ConflictInfo; error?: string }> {
  try {
    // Detect conflicts
    const conflict = await detectConflicts(supabase, entity)

    if (conflict) {
      // Try automatic resolution for timestamp conflicts
      if (conflict.conflicting_fields.length === 1 &&
          conflict.conflicting_fields[0] === 'updated_at') {
        const resolved = await resolveTimestampConflict(supabase, entity, conflict)
        return { success: resolved }
      }

      // Return conflict for client resolution
      return { conflict }
    }

    // No conflict - proceed with update/insert
    const entityData = { ...entity }
    delete entityData._entity_type
    delete entityData._version
    delete entityData._local_updated_at

    // Check if entity exists
    const { data: existing } = await supabase
      .from(entity._entity_type)
      .select('id')
      .eq('id', entity.id)
      .single()

    let result
    if (existing) {
      // Update existing entity
      entityData.version = (entityData.version || 0) + 1
      entityData.updated_at = new Date().toISOString()
      entityData.updated_by = userId

      const selectColumns = getEntityColumns(entity._entity_type)
      result = await supabase
        .from(entity._entity_type)
        .update(entityData)
        .eq('id', entity.id)
        .select(selectColumns)
        .single()
    } else {
      // Insert new entity
      entityData.version = 1
      entityData.created_at = new Date().toISOString()
      entityData.created_by = userId
      entityData.updated_at = entityData.created_at
      entityData.updated_by = userId

      const selectColumns = getEntityColumns(entity._entity_type)
      result = await supabase
        .from(entity._entity_type)
        .insert(entityData)
        .select(selectColumns)
        .single()
    }

    if (result.error) {
      throw result.error
    }

    return {
      success: {
        ...result.data,
        _entity_type: entity._entity_type,
        _version: result.data.version
      }
    }
  } catch (error) {
    log('error', 'Entity push failed', {
      entityId: entity.id,
      entityType: entity._entity_type,
      error: error.message
    })
    return { error: error.message }
  }
}

const handler = createHandler(async (req: Request): Promise<Response> => {
  try {
    // Validate JWT
    const authHeader = req.headers.get('authorization')
    const user = await validateJWT(authHeader)

    // Rate limiting
    if (!checkRateLimit(user.id, 50, 60000)) {
      return errorResponse('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED')
    }

    // Parse request body
    const body = await parseBody<SyncPushRequest>(req)
    validateRequiredFields(body, ['entities'])

    if (!Array.isArray(body.entities) || body.entities.length === 0) {
      return errorResponse('Entities must be a non-empty array', 400, 'INVALID_REQUEST')
    }

    log('info', 'Sync push request', {
      userId: user.id,
      deviceId: body.device_id,
      entityCount: body.entities.length
    })

    // Create Supabase client
    const supabase = createServiceClient()

    // Process entities in batches
    const batchSize = 10
    const success: SyncEntity[] = []
    const conflicts: ConflictInfo[] = []
    const errors: { entity_id: string; error: string }[] = []

    for (let i = 0; i < body.entities.length; i += batchSize) {
      const batch = body.entities.slice(i, i + batchSize)

      // Process batch in parallel
      const results = await Promise.all(
        batch.map(entity => processEntityPush(supabase, entity, user.id))
      )

      // Categorize results
      results.forEach((result, index) => {
        const entity = batch[index]

        if (result.success) {
          success.push(result.success)
        } else if (result.conflict) {
          conflicts.push(result.conflict)
        } else if (result.error) {
          errors.push({
            entity_id: entity.id,
            error: result.error
          })
        }
      })
    }

    const response: SyncPushResponse = {
      success,
      conflicts,
      errors
    }

    // Log sync results
    log('info', 'Sync push completed', {
      userId: user.id,
      successCount: success.length,
      conflictCount: conflicts.length,
      errorCount: errors.length
    })

    // Return 409 if there are conflicts
    const status = conflicts.length > 0 ? 409 : 200

    return successResponse(response, status,
      conflicts.length > 0 ? 'Conflicts detected' : 'Sync completed successfully'
    )

  } catch (error) {
    log('error', 'Sync push failed', { error: error.message })

    if (error.message.includes('JWT')) {
      return errorResponse(error.message, 401, 'UNAUTHORIZED')
    }

    return errorResponse(
      'Failed to push sync data',
      500,
      'SYNC_PUSH_FAILED',
      { error: error.message }
    )
  }
})

serve(handler)