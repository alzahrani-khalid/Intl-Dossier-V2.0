// T032: Supabase Edge Function for waiting queue reminders
// POST /send - Send individual reminder
// POST /send-bulk - Send bulk reminders
// GET /status/{job_id} - Check bulk reminder job status

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  sendReminder,
  checkCooldown,
  validateAssignment,
  ReminderResult,
} from '../_shared/reminder-logic.ts';
import {
  validateAssignmentId,
  validateUUIDArray,
  checkRateLimitDB,
  createSafeErrorResponse,
  validateContentType,
} from '../_shared/security.ts';

interface SendReminderRequest {
  assignment_id: string;
}

interface SendBulkReminderRequest {
  assignment_ids: string[];
}

interface BulkReminderStatus {
  job_id: string;
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: {
    assignment_id: string;
    success: boolean;
    reason?: string;
  }[];
}

// In-memory job store (replace with Redis in production)
const bulkJobs = new Map<string, BulkReminderStatus>();

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Verify user is authenticated
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;
    const url = new URL(req.url);
    const pathname = url.pathname;

    // GET /status/{job_id} - Check bulk reminder job status
    if (req.method === 'GET' && pathname.includes('/status/')) {
      const jobId = pathname.split('/status/')[1];
      const jobStatus = bulkJobs.get(jobId);

      if (!jobStatus) {
        return new Response(
          JSON.stringify({ error: 'Job not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(jobStatus),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /send - Send individual reminder
    if (req.method === 'POST' && (pathname.endsWith('/send') || pathname.endsWith('/waiting-queue-reminder'))) {
      // Validate Content-Type
      if (!validateContentType(req)) {
        return new Response(
          JSON.stringify({ error: 'Content-Type must be application/json' }),
          { status: 415, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body: SendReminderRequest = await req.json();

      // Validate assignment_id
      const validation = validateAssignmentId(body.assignment_id);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ error: validation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check rate limiting using secure method
      const rateLimitResult = await checkRateLimitDB(supabaseClient, userId, 'reminder', 100, 5);
      if (!rateLimitResult.allowed) {
        return new Response(
          JSON.stringify({
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'You have exceeded the rate limit of 100 reminders per 5 minutes',
            retry_after: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
            remaining: rateLimitResult.remaining,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-RateLimit-Remaining': String(rateLimitResult.remaining) } }
        );
      }

      // Get notification service URL from environment
      const notificationServiceUrl = Deno.env.get('NOTIFICATION_SERVICE_URL') ??
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/notifications`;

      // Get cooldown hours from environment (default: 24)
      const cooldownHours = parseInt(Deno.env.get('REMINDER_COOLDOWN_HOURS') ?? '24');

      // Send reminder
      const result: ReminderResult = await sendReminder(
        supabaseClient,
        body.assignment_id,
        userId,
        notificationServiceUrl,
        cooldownHours
      );

      if (!result.success) {
        const statusCode = result.error?.code === 'COOLDOWN_ACTIVE' ? 409 :
                          result.error?.code === 'NO_ASSIGNEE' ? 400 :
                          result.error?.code === 'ASSIGNMENT_NOT_FOUND' ? 404 :
                          result.error?.code === 'VERSION_CONFLICT' ? 409 :
                          500;

        return new Response(
          JSON.stringify({
            error: result.error?.code || 'INTERNAL_ERROR',
            message: result.error?.message || result.message,
            details: result.error?.details,
          }),
          { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: result.message,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /send-bulk - Send bulk reminders
    if (req.method === 'POST' && pathname.endsWith('/send-bulk')) {
      // Validate Content-Type
      if (!validateContentType(req)) {
        return new Response(
          JSON.stringify({ error: 'Content-Type must be application/json' }),
          { status: 415, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body: SendBulkReminderRequest = await req.json();

      // Validate assignment_ids array
      const validation = validateUUIDArray(body.assignment_ids, 'assignment_ids', 100);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ error: validation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check rate limiting for bulk operations
      const { data: recentBulkReminders } = await supabaseClient
        .from('followup_reminders')
        .select('sent_at')
        .eq('sent_by', userId)
        .gte('sent_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      if (recentBulkReminders && recentBulkReminders.length + body.assignment_ids.length > 100) {
        return new Response(
          JSON.stringify({
            error: 'RATE_LIMIT_EXCEEDED',
            message: `Adding ${body.assignment_ids.length} reminders would exceed rate limit of 100 per 5 minutes`,
            retry_after: 300,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create job ID
      const jobId = crypto.randomUUID();

      // Initialize job status
      const jobStatus: BulkReminderStatus = {
        job_id: jobId,
        total: body.assignment_ids.length,
        sent: 0,
        failed: 0,
        skipped: 0,
        status: 'pending',
        results: [],
      };

      bulkJobs.set(jobId, jobStatus);

      // Process bulk reminders asynchronously (don't await)
      processBulkReminders(
        supabaseClient,
        body.assignment_ids,
        userId,
        jobId
      ).catch((error) => {
        console.error('Bulk reminder processing failed:', error);
        const currentJob = bulkJobs.get(jobId);
        if (currentJob) {
          currentJob.status = 'failed';
          bulkJobs.set(jobId, currentJob);
        }
      });

      // Return job ID immediately
      return new Response(
        JSON.stringify({
          job_id: jobId,
          total: body.assignment_ids.length,
          message: 'Bulk reminder job queued',
        }),
        { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const safeError = createSafeErrorResponse(error, 'Failed to process reminder request');
    return new Response(
      JSON.stringify(safeError),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Process bulk reminders in chunks with retry mechanism
 */
async function processBulkReminders(
  supabaseClient: any,
  assignmentIds: string[],
  userId: string,
  jobId: string
): Promise<void> {
  const jobStatus = bulkJobs.get(jobId);
  if (!jobStatus) return;

  jobStatus.status = 'processing';
  bulkJobs.set(jobId, jobStatus);

  const notificationServiceUrl = Deno.env.get('NOTIFICATION_SERVICE_URL') ??
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/notifications`;
  const cooldownHours = parseInt(Deno.env.get('REMINDER_COOLDOWN_HOURS') ?? '24');

  // Process in chunks of 10 to avoid overwhelming the system
  const chunkSize = 10;
  for (let i = 0; i < assignmentIds.length; i += chunkSize) {
    const chunk = assignmentIds.slice(i, i + chunkSize);

    // Process chunk items sequentially to respect rate limits
    for (const assignmentId of chunk) {
      try {
        // Validate assignment first
        const assignment = await validateAssignment(supabaseClient, assignmentId);

        // Check cooldown
        const cooldownCheck = await checkCooldown(supabaseClient, assignmentId, cooldownHours);

        if (!cooldownCheck.canSend) {
          jobStatus.skipped++;
          jobStatus.results!.push({
            assignment_id: assignmentId,
            success: false,
            reason: 'COOLDOWN_ACTIVE',
          });
          continue;
        }

        // Send reminder with retry mechanism
        const result = await sendReminder(
          supabaseClient,
          assignmentId,
          userId,
          notificationServiceUrl,
          cooldownHours
        );

        if (result.success) {
          jobStatus.sent++;
          jobStatus.results!.push({
            assignment_id: assignmentId,
            success: true,
          });
        } else {
          jobStatus.failed++;
          jobStatus.results!.push({
            assignment_id: assignmentId,
            success: false,
            reason: result.error?.code || 'UNKNOWN_ERROR',
          });
        }
      } catch (error) {
        // Handle validation errors (no assignee, invalid status, etc.)
        if (error instanceof Error) {
          if (error.message === 'NO_ASSIGNEE') {
            jobStatus.skipped++;
            jobStatus.results!.push({
              assignment_id: assignmentId,
              success: false,
              reason: 'NO_ASSIGNEE',
            });
          } else {
            jobStatus.failed++;
            jobStatus.results!.push({
              assignment_id: assignmentId,
              success: false,
              reason: error.message,
            });
          }
        }
      }

      // Update job status
      bulkJobs.set(jobId, jobStatus);
    }

    // Small delay between chunks to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Mark job as completed
  jobStatus.status = 'completed';
  bulkJobs.set(jobId, jobStatus);
}
