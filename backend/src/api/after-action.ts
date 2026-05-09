/**
 * After-Action API Router (T052-T057)
 * User Story 1: Quick After-Action Creation
 *
 * Endpoints for creating, updating, publishing, listing, viewing, and deleting
 * after-action records with nested entities (decisions, commitments, risks, etc.)
 */

import { Router } from 'express'
import { z } from 'zod'
import { validate, idParamSchema } from '../utils/validation'
import { requirePermission } from '../middleware/auth'
import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'
import {
  afterActionCreateSchema,
  afterActionUpdateSchema,
  editRequestSchema,
  editApprovalSchema,
  AfterActionStatus,
} from '../types/after-action.types'
import { createTaskCreationService, TaskCreationService } from '../services/tasks.service'
import { createNotificationService, NotificationService } from '../services/notification.service'
import logger from '../utils/logger'

const router = Router()

// Initialize services
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)
const taskCreationService: TaskCreationService = createTaskCreationService(
  supabaseUrl,
  supabaseServiceKey,
)
const notificationService: NotificationService = createNotificationService(
  supabaseUrl,
  supabaseServiceKey,
)

/**
 * List query schema
 */
const listQuerySchema = z.object({
  dossier_id: z.string().uuid().optional(),
  engagement_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'published', 'edit_pending']).optional(),
  created_by: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  confidentiality_level: z.enum(['public', 'internal', 'confidential', 'secret']).optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
})

/**
 * T055: GET /after-action/list
 * List after-action records with filtering, pagination, and RLS enforcement
 */
router.get(
  '/list',
  requirePermission(['view_after_actions']),
  validate({ query: listQuerySchema }),
  async (req, res, next) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      logger.info('Fetching after-action list', {
        userId,
        filters: req.query,
      })

      const q = req.query as unknown as z.infer<typeof listQuerySchema>

      let query = supabase.from('after_action_records').select(
        `
          *,
          decisions:decisions(count),
          commitments:commitments(count),
          risks:risks(count),
          follow_up_actions:follow_up_actions(count),
          attachments:attachments(count)
        `,
        { count: 'exact' },
      )

      // Apply filters
      if (q.dossier_id) {
        query = query.eq('dossier_id', q.dossier_id)
      }
      if (q.engagement_id) {
        query = query.eq('engagement_id', q.engagement_id)
      }
      if (q.status) {
        query = query.eq('publication_status', q.status)
      }
      if (q.created_by) {
        query = query.eq('created_by', q.created_by)
      }
      if (q.confidentiality_level) {
        // The schema column is `is_confidential: boolean`; the request enum is a
        // four-state UX classifier (`public | internal | confidential | secret`).
        // Until the schema is migrated to a true four-state column, map any non-
        // public value to `is_confidential = true`.
        const isConfidential = q.confidentiality_level !== 'public'
        query = query.eq('is_confidential', isConfidential)
      }
      if (q.date_from) {
        query = query.gte('created_at', q.date_from)
      }
      if (q.date_to) {
        query = query.lte('created_at', q.date_to)
      }
      if (q.search) {
        query = query.or(`title.ilike.%${q.search}%,description.ilike.%${q.search}%`)
      }

      // Pagination and sorting
      const limit = q.limit || 20
      const offset = q.offset || 0
      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        logger.error('Failed to list after-action records', {
          error: error.message,
          userId,
        })
        return res.status(500).json({
          error: 'Failed to fetch after-action records',
          details: error.message,
        })
      }

      logger.info('After-action list fetched successfully', {
        userId,
        count: data?.length || 0,
        totalCount: count,
      })

      return res.json({
        data: data || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
      })
    } catch (error) {
      logger.error('Error listing after-action records', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return next(error)
    }
  },
)

/**
 * T056: GET /after-action/:id
 * Get single after-action record with all nested entities and signed URLs
 */
router.get(
  '/:id',
  requirePermission(['view_after_actions']),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { id } = req.params as { id: string }

      logger.info('Fetching after-action record', { id, userId })

      // Fetch main record with all nested entities
      const { data: record, error: recordError } = await supabase
        .from('after_action_records')
        .select(
          `
          *,
          decisions(*),
          commitments(*),
          risks(*),
          follow_up_actions(*),
          attachments(*)
        `,
        )
        .eq('id', id)
        .single()

      if (recordError) {
        if (recordError.code === 'PGRST116') {
          return res.status(404).json({ error: 'After-action record not found' })
        }
        logger.error('Failed to fetch after-action record', {
          error: recordError.message,
          id,
        })
        return res.status(500).json({
          error: 'Failed to fetch after-action record',
          details: recordError.message,
        })
      }

      if (!record) {
        return res.status(404).json({ error: 'After-action record not found' })
      }

      // Generate signed URLs for attachments
      if (record.attachments && record.attachments.length > 0) {
        const attachmentsWithUrls = await Promise.all(
          record.attachments.map(async (attachment: any) => {
            try {
              const { data: signedUrlData } = await supabase.storage
                .from('after-action-attachments')
                .createSignedUrl(attachment.storage_path, 86400) // 24 hours

              return {
                ...attachment,
                storage_url: signedUrlData?.signedUrl || null,
              }
            } catch (error) {
              logger.error('Failed to generate signed URL for attachment', {
                attachmentId: attachment.id,
                error: error instanceof Error ? error.message : 'Unknown error',
              })
              return attachment
            }
          }),
        )
        record.attachments = attachmentsWithUrls
      }

      logger.info('After-action record fetched successfully', { id, userId })

      res.json({ data: record })
    } catch (error) {
      logger.error('Error fetching after-action record', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return next(error)
    }
  },
)

/**
 * T052: POST /after-action/create
 * Create new after-action record with nested entities in transaction
 */
router.post(
  '/create',
  requirePermission(['create_after_actions']),
  validate({ body: afterActionCreateSchema }),
  async (req, res, next) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      logger.info('Creating after-action record', {
        userId,
        dossierId: req.body.dossier_id,
        engagementId: req.body.engagement_id,
      })

      // Validate engagement and dossier exist and user has access
      const { data: engagement, error: engagementError } = await supabase
        .from('engagements')
        .select('id, dossier_id')
        .eq('id', req.body.engagement_id)
        .single()

      if (engagementError || !engagement) {
        return res.status(404).json({ error: 'Engagement not found' })
      }

      const engagementRow = engagement as unknown as { id: string; dossier_id: string }
      if (engagementRow.dossier_id !== req.body.dossier_id) {
        return res.status(400).json({
          error: 'Engagement does not belong to the specified dossier',
        })
      }

      // Create after-action record (draft status by default)
      const afterActionData = {
        engagement_id: req.body.engagement_id,
        dossier_id: req.body.dossier_id,
        title: req.body.title,
        description: req.body.description,
        confidentiality_level: req.body.confidentiality_level,
        attendance_list: req.body.attendance_list || [],
        status: AfterActionStatus.DRAFT,
        created_by: userId,
        _version: 1,
      }

      const { data: afterAction, error: afterActionError } = await supabase
        .from('after_action_records')
        .insert(afterActionData)
        .select()
        .single()

      if (afterActionError || !afterAction) {
        logger.error('Failed to create after-action record', {
          error: afterActionError?.message,
          userId,
        })
        return res.status(500).json({
          error: 'Failed to create after-action record',
          details: afterActionError?.message,
        })
      }

      const afterActionId = afterAction.id

      // Create nested entities in parallel
      const promises = []

      if (req.body.decisions && req.body.decisions.length > 0) {
        const decisionsData = req.body.decisions.map((d: Record<string, unknown>) => ({
          ...d,
          after_action_id: afterActionId,
        }))
        promises.push(supabase.from('decisions').insert(decisionsData).select())
      }

      if (req.body.commitments && req.body.commitments.length > 0) {
        const commitmentsData = req.body.commitments.map((c: Record<string, unknown>) => ({
          ...c,
          after_action_id: afterActionId,
          dossier_id: req.body.dossier_id,
        }))
        promises.push(supabase.from('commitments').insert(commitmentsData).select())
      }

      if (req.body.risks && req.body.risks.length > 0) {
        const risksData = req.body.risks.map((r: Record<string, unknown>) => ({
          ...r,
          after_action_id: afterActionId,
        }))
        promises.push(supabase.from('risks').insert(risksData).select())
      }

      if (req.body.follow_up_actions && req.body.follow_up_actions.length > 0) {
        const followUpsData = req.body.follow_up_actions.map((f: Record<string, unknown>) => ({
          ...f,
          after_action_id: afterActionId,
        }))
        promises.push(supabase.from('follow_up_actions').insert(followUpsData).select())
      }

      const results = await Promise.all(promises)

      // Check for errors in nested inserts
      const errors = results.filter((r) => r.error)
      if (errors.length > 0) {
        logger.error('Failed to create nested entities', {
          errors: errors.map((e) => e.error?.message),
          afterActionId,
        })
        // Rollback: delete after-action record
        await supabase.from('after_action_records').delete().eq('id', afterActionId)
        return res.status(500).json({
          error: 'Failed to create nested entities',
          details: errors.map((e) => e.error?.message),
        })
      }

      logger.info('After-action record created successfully', {
        afterActionId,
        userId,
      })

      res.status(201).json({ data: afterAction })
    } catch (error) {
      logger.error('Error creating after-action record', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return next(error)
    }
  },
)

/**
 * T053: PUT /after-action/:id
 * Update draft after-action record with optimistic locking via updated_at comparison
 */
router.put(
  '/:id',
  requirePermission(['edit_after_actions']),
  validate({ params: idParamSchema, body: afterActionUpdateSchema }),
  async (req, res, next) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { id } = req.params as { id: string }
      const clientUpdatedAt = req.body.updated_at as string | undefined

      logger.info('Updating after-action record', { id, userId })

      // Fetch current record for validation
      const { data: currentRecord, error: fetchError } = await supabase
        .from('after_action_records')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !currentRecord) {
        return res.status(404).json({ error: 'After-action record not found' })
      }

      // Cast to wider shape: hand-authored after-action types use legacy `_version`
      // and `status` field names that haven't been merged back into Supabase generated types.
      const current = currentRecord as unknown as {
        status?: string
        _version?: number
        updated_at?: string | null
      }

      // Validate status is draft
      if (current.status !== AfterActionStatus.DRAFT) {
        return res.status(400).json({
          error: 'Only draft records can be updated without approval',
        })
      }

      // Validate optimistic locking via _version (legacy)
      if (current._version !== req.body._version) {
        return res.status(409).json({
          error: 'CONFLICT',
          message: 'This record was modified by another user.',
          serverUpdatedAt: current.updated_at,
          currentVersion: current._version,
          providedVersion: req.body._version,
        })
      }

      // Validate optimistic locking via updated_at timestamp (D-41)
      if (
        typeof clientUpdatedAt === 'string' &&
        clientUpdatedAt.length > 0 &&
        current.updated_at != null
      ) {
        const clientTime = new Date(clientUpdatedAt).getTime()
        const serverTime = new Date(current.updated_at as string).getTime()
        if (clientTime !== serverTime) {
          logger.warn('Optimistic lock conflict via updated_at', {
            id,
            userId,
            clientUpdatedAt,
            serverUpdatedAt: current.updated_at,
          })
          return res.status(409).json({
            error: 'CONFLICT',
            message: 'This record was modified by another user.',
            serverUpdatedAt: current.updated_at,
          })
        }
      }

      // Build update payload
      const now = new Date().toISOString()
      const { updated_at: _clientTs, ...bodyWithoutTimestamp } = req.body
      const updateData = {
        ...bodyWithoutTimestamp,
        _version: (current._version ?? 0) + 1,
        updated_by: userId,
        updated_at: now,
      }

      // Server-side WHERE clause for TOCTOU protection (D-41)
      // Even if the pre-check above passed, another request could have
      // modified the record between our SELECT and this UPDATE.
      let updateQuery = supabase.from('after_action_records').update(updateData).eq('id', id)

      // Add updated_at guard to close TOCTOU gap
      if (current.updated_at != null) {
        updateQuery = updateQuery.eq('updated_at', current.updated_at as string)
      }

      const { data: updatedRecord, error: updateError } = await updateQuery.select().single()

      // If no rows matched, another concurrent write slipped through
      if (updateError?.code === 'PGRST116' || (!updateError && !updatedRecord)) {
        // Re-fetch to get current server state
        const { data: freshRecord } = await supabase
          .from('after_action_records')
          .select('updated_at')
          .eq('id', id)
          .single()

        logger.warn('TOCTOU conflict detected during UPDATE', { id, userId })
        return res.status(409).json({
          error: 'CONFLICT',
          message: 'This record was modified by another user.',
          serverUpdatedAt: freshRecord?.updated_at ?? null,
        })
      }

      if (updateError) {
        logger.error('Failed to update after-action record', {
          error: updateError?.message,
          id,
        })
        return res.status(500).json({
          error: 'Failed to update after-action record',
          details: updateError?.message,
        })
      }

      // Update nested entities if provided
      // For simplicity, we'll delete existing and recreate
      // In production, use diff logic to minimize database operations

      if (req.body.decisions) {
        await supabase.from('decisions').delete().eq('after_action_id', id)
        if (req.body.decisions.length > 0) {
          const decisionsData = req.body.decisions.map((d: Record<string, unknown>) => ({
            ...d,
            after_action_id: id,
          }))
          await supabase.from('decisions').insert(decisionsData)
        }
      }

      if (req.body.commitments) {
        await supabase.from('aa_commitments').delete().eq('after_action_id', id)
        if (req.body.commitments.length > 0) {
          const commitmentsData = req.body.commitments.map((c: Record<string, unknown>) => ({
            ...c,
            after_action_id: id,
            dossier_id: currentRecord.dossier_id,
          })) as Database['public']['Tables']['aa_commitments']['Insert'][]
          await supabase.from('aa_commitments').insert(commitmentsData)
        }
      }

      if (req.body.risks) {
        await supabase.from('risks').delete().eq('after_action_id', id)
        if (req.body.risks.length > 0) {
          const risksData = req.body.risks.map((r: Record<string, unknown>) => ({
            ...r,
            after_action_id: id,
          }))
          await supabase.from('risks').insert(risksData)
        }
      }

      if (req.body.follow_up_actions) {
        await supabase.from('follow_up_actions').delete().eq('after_action_id', id)
        if (req.body.follow_up_actions.length > 0) {
          const followUpsData = req.body.follow_up_actions.map((f: Record<string, unknown>) => ({
            ...f,
            after_action_id: id,
          }))
          await supabase.from('follow_up_actions').insert(followUpsData)
        }
      }

      logger.info('After-action record updated successfully', { id, userId })

      res.json({ data: updatedRecord })
    } catch (error) {
      logger.error('Error updating after-action record', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return next(error)
    }
  },
)

/**
 * T054: POST /after-action/:id/publish
 * Publish after-action record, create tasks, queue notifications
 */
router.post(
  '/:id/publish',
  requirePermission(['publish_after_actions']),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { id } = req.params as { id: string }

      logger.info('Publishing after-action record', { id, userId })

      // Fetch record with nested entities
      const { data: record, error: fetchError } = await supabase
        .from('after_action_records')
        .select(
          `
          *,
          commitments(*)
        `,
        )
        .eq('id', id)
        .single()

      if (fetchError || !record) {
        return res.status(404).json({ error: 'After-action record not found' })
      }

      // Cast to wider shape: legacy `_version`/`status`/`title` field names not in
      // current Supabase generated types. Same wrapper as the update handler above.
      const rec = record as unknown as {
        status?: string
        title?: string
        engagement_id?: string
        dossier_id?: string
        _version?: number
        commitments?: Array<{ owner_id?: string; description?: string }>
      }

      // Validate status is draft
      if (rec.status !== AfterActionStatus.DRAFT) {
        return res.status(400).json({
          error: 'Only draft records can be published',
        })
      }

      // Validate completeness (basic validation - customize as needed)
      if (!rec.title || !rec.engagement_id || !rec.dossier_id) {
        return res.status(400).json({
          error: 'Record is incomplete - title, engagement, and dossier are required',
        })
      }

      // Update status to published
      const { data: publishedRecord, error: publishError } = await supabase
        .from('after_action_records')
        .update({
          status: AfterActionStatus.PUBLISHED,
          published_by: userId,
          published_at: new Date().toISOString(),
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (publishError || !publishedRecord) {
        logger.error('Failed to publish after-action record', {
          error: publishError?.message,
          id,
        })
        return res.status(500).json({
          error: 'Failed to publish after-action record',
          details: publishError?.message,
        })
      }

      // Create tasks from commitments
      const recCommitments = rec.commitments
      if (recCommitments && recCommitments.length > 0) {
        const taskResult = (await taskCreationService.createTasksFromCommitments({
          afterActionId: id,
          dossierId: rec.dossier_id!,
          commitments: recCommitments as never,
          createdBy: userId,
        })) as unknown as { success: boolean; tasksCreated?: number; errors?: string[] }

        if (!taskResult.success) {
          logger.warn('Task creation had errors during publish', {
            afterActionId: id,
            errors: taskResult.errors,
          })
        } else {
          logger.info('Tasks created successfully', {
            afterActionId: id,
            tasksCreated: taskResult.tasksCreated,
          })
        }

        // Queue notifications for commitment owners
        const notificationResult = (await notificationService.notifyCommitmentOwners(
          id,
          rec.title!,
          recCommitments,
        )) as unknown as {
          success: boolean
          totalQueued?: number
          errors?: string[]
        }

        if (!notificationResult.success) {
          logger.warn('Notification queueing had errors during publish', {
            afterActionId: id,
            errors: notificationResult.errors,
          })
        } else {
          logger.info('Notifications queued successfully', {
            afterActionId: id,
            notificationsQueued: notificationResult.totalQueued,
          })
        }
      }

      // Create version snapshot
      const snapshotData = {
        after_action_id: id,
        version_number: rec._version,
        snapshot_data: record,
        version_reason: 'Initial publication',
        created_by: userId,
      }

      await supabase.from('version_snapshots' as never).insert(snapshotData as never)

      logger.info('After-action record published successfully', { id, userId })

      return res.json({
        data: publishedRecord,
        message: 'After-action record published successfully',
      })
    } catch (error) {
      logger.error('Error publishing after-action record', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return next(error)
    }
  },
)

/**
 * T057: DELETE /after-action/:id
 * Delete draft after-action record (creator only)
 */
router.delete(
  '/:id',
  requirePermission(['delete_after_actions']),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { id } = req.params as { id: string }

      logger.info('Deleting after-action record', { id, userId })

      // Fetch record to validate
      const { data: record, error: fetchError } = await supabase
        .from('after_action_records')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !record) {
        return res.status(404).json({ error: 'After-action record not found' })
      }

      const recDel = record as unknown as { status?: string; created_by?: string }

      // Validate status is draft
      if (recDel.status !== AfterActionStatus.DRAFT) {
        return res.status(400).json({
          error: 'Only draft records can be deleted',
        })
      }

      // Validate user is creator
      if (recDel.created_by !== userId) {
        return res.status(403).json({
          error: 'Only the creator can delete this record',
        })
      }

      // Delete nested entities (cascade)
      await Promise.all([
        supabase.from('decisions').delete().eq('after_action_id', id),
        supabase.from('aa_commitments').delete().eq('after_action_id', id),
        supabase.from('risks').delete().eq('after_action_id', id),
        supabase.from('follow_up_actions').delete().eq('after_action_id', id),
        supabase.from('attachments').delete().eq('after_action_id', id),
      ])

      // Delete main record
      const { error: deleteError } = await supabase
        .from('after_action_records')
        .delete()
        .eq('id', id)

      if (deleteError) {
        logger.error('Failed to delete after-action record', {
          error: deleteError.message,
          id,
        })
        return res.status(500).json({
          error: 'Failed to delete after-action record',
          details: deleteError.message,
        })
      }

      logger.info('After-action record deleted successfully', { id, userId })

      res.json({ success: true, message: 'After-action record deleted' })
    } catch (error) {
      logger.error('Error deleting after-action record', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return next(error)
    }
  },
)

/**
 * Edit request and approval endpoints (User Story 4)
 * These will be implemented in Phase 6
 */

/**
 * POST /after-action/:id/request-edit
 * Request permission to edit published record
 */
router.post(
  '/:id/request-edit',
  requirePermission(['edit_after_actions']),
  validate({ params: idParamSchema, body: editRequestSchema }),
  async (_req, res, next) => {
    try {
      return res.status(501).json({
        error: 'Edit request feature not yet implemented (User Story 4)',
      })
    } catch (error) {
      return next(error)
    }
  },
)

/**
 * POST /after-action/:id/approve-edit
 * Approve or reject edit request (supervisor only)
 */
router.post(
  '/:id/approve-edit',
  requirePermission(['approve_edits']),
  validate({ params: idParamSchema, body: editApprovalSchema }),
  async (_req, res, next) => {
    try {
      return res.status(501).json({
        error: 'Edit approval feature not yet implemented (User Story 4)',
      })
    } catch (error) {
      return next(error)
    }
  },
)

export default router
