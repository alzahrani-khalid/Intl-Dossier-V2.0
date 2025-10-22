/**
 * Supabase Edge Function: waiting-queue-escalation
 * Feature: User Story 4 - Assignment Escalation (023-specs-waiting-queue)
 * Endpoints:
 *   - POST /escalate - Escalate single assignment
 *   - POST /escalate-bulk - Escalate multiple assignments (max 100)
 *   - POST /{escalation_id}/acknowledge - Acknowledge escalation
 *   - POST /{escalation_id}/resolve - Resolve escalation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import {
  validateAssignmentId,
  validateUUIDArray,
  validateReason,
  validateResolution,
  validateNotes,
  sanitizeNotificationContent,
  createSafeErrorResponse,
  validateContentType,
} from '../_shared/security.ts';

// Types
interface EscalationRequest {
  assignment_id: string;
  reason?: string;
}

interface BulkEscalationRequest {
  assignment_ids: string[];
  reason?: string;
}

interface AcknowledgeRequest {
  notes?: string;
}

interface ResolveRequest {
  resolution: string;
}

// In-memory job store for bulk operations (Edge Functions are stateless)
const bulkJobs = new Map<string, {
  total_items: number;
  processed: number;
  succeeded: number;
  failed: number;
  status: 'processing' | 'completed' | 'failed';
  results: Array<{ assignment_id: string; success: boolean; error?: string }>;
}>();

serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace('/waiting-queue-escalation', '');

    // Route handlers
    if (req.method === 'POST' && path === '/escalate') {
      return await handleEscalate(req, supabase, user.id);
    }

    if (req.method === 'POST' && path === '/escalate-bulk') {
      return await handleEscalateBulk(req, supabase, user.id);
    }

    if (req.method === 'GET' && path.startsWith('/status/')) {
      const jobId = path.replace('/status/', '');
      return handleGetJobStatus(jobId);
    }

    if (req.method === 'POST' && path.match(/^\/[\w-]+\/acknowledge$/)) {
      const escalationId = path.split('/')[1];
      return await handleAcknowledge(req, supabase, user.id, escalationId);
    }

    if (req.method === 'POST' && path.match(/^\/[\w-]+\/resolve$/)) {
      const escalationId = path.split('/')[1];
      return await handleResolve(req, supabase, user.id, escalationId);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const safeError = createSafeErrorResponse(error, 'Failed to process escalation request');
    return new Response(JSON.stringify(safeError), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

/**
 * POST /escalate - Escalate single assignment
 */
async function handleEscalate(req: Request, supabase: any, userId: string) {
  // Validate Content-Type
  if (!validateContentType(req)) {
    return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
      status: 415,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body: EscalationRequest = await req.json();

  // Validate assignment_id
  const idValidation = validateAssignmentId(body.assignment_id);
  if (!idValidation.valid) {
    return new Response(JSON.stringify({ error: idValidation.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate and sanitize reason
  const reasonValidation = validateReason(body.reason);
  if (!reasonValidation.valid) {
    return new Response(JSON.stringify({ error: reasonValidation.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get assignment details
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('id, work_item_id, work_item_type, assignee_id, status, workflow_stage, assigned_at, priority')
    .eq('id', body.assignment_id)
    .single();

  if (assignmentError || !assignment) {
    return new Response(JSON.stringify({ error: 'ASSIGNMENT_NOT_FOUND' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Prevent escalation of completed assignments
  if (assignment.status === 'completed') {
    return new Response(JSON.stringify({ error: 'CANNOT_ESCALATE_COMPLETED' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get escalation path using the new function
  const { data: escalationPath, error: pathError } = await supabase
    .rpc('get_escalation_path', { p_user_id: assignment.assignee_id });

  if (pathError) {
    return new Response(JSON.stringify({ error: 'Failed to resolve escalation path', details: pathError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Find the next level in hierarchy (level 2)
  const nextLevel = escalationPath?.find((level: any) => level.level === 2);

  if (!nextLevel) {
    return new Response(JSON.stringify({
      error: 'NO_ESCALATION_PATH',
      message: 'No escalation path configured for this user'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create escalation record with sanitized reason
  const { data: escalationRecord, error: escalationError } = await supabase
    .from('escalation_records')
    .insert({
      assignment_id: assignment.id,
      escalated_by: userId,
      escalated_to: nextLevel.user_id,
      reason: reasonValidation.reason || `Assignment overdue - escalated after ${calculateDaysPending(assignment.assigned_at)} days`,
      status: 'pending',
      escalated_at: new Date().toISOString(),
    })
    .select('*, escalated_to_profile:profiles!escalated_to(full_name)')
    .single();

  if (escalationError) {
    return new Response(JSON.stringify({ error: 'Failed to create escalation record', details: escalationError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Send notification (T065)
  await sendEscalationNotification(supabase, escalationRecord, assignment, nextLevel, userId);

  return new Response(JSON.stringify({
    escalation_id: escalationRecord.id,
    escalated_to_id: nextLevel.user_id,
    escalated_to_name: nextLevel.full_name,
    message: `Assignment escalated to ${nextLevel.full_name} (${nextLevel.position_title})`,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /escalate-bulk - Escalate multiple assignments
 */
async function handleEscalateBulk(req: Request, supabase: any, userId: string) {
  // Validate Content-Type
  if (!validateContentType(req)) {
    return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
      status: 415,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body: BulkEscalationRequest = await req.json();

  // Validate assignment_ids array
  const idsValidation = validateUUIDArray(body.assignment_ids, 'assignment_ids', 100);
  if (!idsValidation.valid) {
    return new Response(JSON.stringify({ error: idsValidation.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate and sanitize reason
  const reasonValidation = validateReason(body.reason);
  if (!reasonValidation.valid) {
    return new Response(JSON.stringify({ error: reasonValidation.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Generate job ID
  const jobId = crypto.randomUUID();

  // Initialize job
  bulkJobs.set(jobId, {
    total_items: body.assignment_ids.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    status: 'processing',
    results: [],
  });

  // Process in background (async) with sanitized reason
  processBulkEscalations(jobId, idsValidation.ids!, reasonValidation.reason, supabase, userId);

  return new Response(JSON.stringify({
    job_id: jobId,
    total_items: body.assignment_ids.length,
    message: 'Bulk escalation started',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Background processor for bulk escalations
 */
async function processBulkEscalations(
  jobId: string,
  assignmentIds: string[],
  reason: string | undefined,
  supabase: any,
  userId: string
) {
  const job = bulkJobs.get(jobId);
  if (!job) return;

  for (const assignmentId of assignmentIds) {
    try {
      // Get assignment
      const { data: assignment } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (!assignment || assignment.status === 'completed') {
        job.results.push({ assignment_id: assignmentId, success: false, error: 'Invalid assignment' });
        job.failed++;
        continue;
      }

      // Get escalation path
      const { data: escalationPath } = await supabase
        .rpc('get_escalation_path', { p_user_id: assignment.assignee_id });

      const nextLevel = escalationPath?.find((level: any) => level.level === 2);

      if (!nextLevel) {
        job.results.push({ assignment_id: assignmentId, success: false, error: 'NO_ESCALATION_PATH' });
        job.failed++;
        continue;
      }

      // Create escalation
      await supabase.from('escalation_records').insert({
        assignment_id: assignmentId,
        escalated_by: userId,
        escalated_to: nextLevel.user_id,
        reason: reason || 'Bulk escalation',
        status: 'pending',
        escalated_at: new Date().toISOString(),
      });

      job.results.push({ assignment_id: assignmentId, success: true });
      job.succeeded++;
    } catch (error) {
      job.results.push({ assignment_id: assignmentId, success: false, error: error.message });
      job.failed++;
    } finally {
      job.processed++;
    }
  }

  job.status = 'completed';
}

/**
 * GET /status/:job_id - Get bulk escalation job status
 */
function handleGetJobStatus(jobId: string) {
  const job = bulkJobs.get(jobId);

  if (!job) {
    return new Response(JSON.stringify({ error: 'Job not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    job_id: jobId,
    status: job.status,
    progress: {
      total: job.total_items,
      processed: job.processed,
      succeeded: job.succeeded,
      failed: job.failed,
    },
    results: job.results,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /:escalation_id/acknowledge - Acknowledge escalation
 */
async function handleAcknowledge(req: Request, supabase: any, userId: string, escalationId: string) {
  // Validate Content-Type
  if (!validateContentType(req)) {
    return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
      status: 415,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate escalation_id
  const idValidation = validateAssignmentId(escalationId);
  if (!idValidation.valid) {
    return new Response(JSON.stringify({ error: 'Invalid escalation_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body: AcknowledgeRequest = await req.json();

  // Validate and sanitize notes
  const notesValidation = validateNotes(body.notes);
  if (!notesValidation.valid) {
    return new Response(JSON.stringify({ error: notesValidation.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get escalation
  const { data: escalation, error: escalationError } = await supabase
    .from('escalation_records')
    .select('*')
    .eq('id', escalationId)
    .single();

  if (escalationError || !escalation) {
    return new Response(JSON.stringify({ error: 'ESCALATION_NOT_FOUND' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Update status with sanitized notes
  const { error: updateError } = await supabase
    .from('escalation_records')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userId,
      notes: notesValidation.notes,
    })
    .eq('id', escalationId);

  if (updateError) {
    return new Response(JSON.stringify({ error: 'Failed to acknowledge escalation' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Escalation acknowledged successfully',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /:escalation_id/resolve - Resolve escalation
 */
async function handleResolve(req: Request, supabase: any, userId: string, escalationId: string) {
  // Validate Content-Type
  if (!validateContentType(req)) {
    return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
      status: 415,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate escalation_id
  const idValidation = validateAssignmentId(escalationId);
  if (!idValidation.valid) {
    return new Response(JSON.stringify({ error: 'Invalid escalation_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body: ResolveRequest = await req.json();

  // Validate and sanitize resolution
  const resolutionValidation = validateResolution(body.resolution);
  if (!resolutionValidation.valid) {
    return new Response(JSON.stringify({ error: resolutionValidation.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get escalation
  const { data: escalation, error: escalationError } = await supabase
    .from('escalation_records')
    .select('*')
    .eq('id', escalationId)
    .single();

  if (escalationError || !escalation) {
    return new Response(JSON.stringify({ error: 'ESCALATION_NOT_FOUND' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Update status with sanitized resolution
  const { error: updateError } = await supabase
    .from('escalation_records')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
      resolution: resolutionValidation.resolution,
    })
    .eq('id', escalationId);

  if (updateError) {
    return new Response(JSON.stringify({ error: 'Failed to resolve escalation' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Escalation resolved successfully',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Helper: Send escalation notification (T065)
 * Queues notification to manager about the escalated assignment
 */
async function sendEscalationNotification(
  supabase: any,
  escalationRecord: any,
  assignment: any,
  recipient: any,
  escalatedBy: string
): Promise<void> {
  try {
    const daysPending = calculateDaysPending(assignment.assigned_at);

    // Sanitize notification content to prevent XSS
    const sanitized = sanitizeNotificationContent({
      title: `Assignment Escalated: ${assignment.work_item_type} #${assignment.work_item_id}`,
      message: `An assignment has been escalated to you. Priority: ${assignment.priority}. Days pending: ${daysPending}`,
      reason: escalationRecord.reason || 'No reason provided',
    });

    // Build bilingual notification messages (sanitized)
    const title = sanitized.title;
    const titleAr = `تم تصعيد المهمة: ${assignment.work_item_type} #${assignment.work_item_id}`;

    const message = `${sanitized.message}. Reason: ${sanitized.reason}.`;
    const messageAr = `تم تصعيد مهمة إليك. الأولوية: ${assignment.priority}. الأيام المعلقة: ${daysPending}. السبب: ${sanitized.reason}.`;

    const actionUrl = `/assignments/${assignment.id}`;

    // Insert notification record
    await supabase.from('notifications').insert({
      recipient_user_id: recipient.user_id,
      notification_type: 'assignment_escalated',
      title,
      title_ar: titleAr,
      message,
      message_ar: messageAr,
      related_entity_type: 'assignment',
      related_entity_id: assignment.id,
      action_url: actionUrl,
      priority: assignment.priority || 'medium',
      status: 'pending',
      send_email: true,
      send_in_app: true,
      send_push: true,
    });

    // Notification queued successfully
  } catch (error) {
    // Error sending notification but escalation was successful
    // Notification will be retried by background job
  }
}

/**
 * Helper: Calculate days pending
 */
function calculateDaysPending(assignedAt: string): number {
  const now = new Date();
  const assigned = new Date(assignedAt);
  const diffTime = Math.abs(now.getTime() - assigned.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
