/**
 * AI Extraction - Background Worker
 *
 * Processes queued AI extraction jobs asynchronously
 * Triggered by cron schedule or manual invocation
 *
 * Cron Schedule: Every 30 seconds
 *
 * Contract: /specs/022-after-action-structured/contracts/ai-extraction-api.md
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AIExtractionService } from '../../services/ai-extraction.service.ts';
import { createLogger } from '../../utils/logger.ts';

const logger = createLogger('ai-extraction-worker');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
  // Allow cron trigger (no auth required for cron)
  const authHeader = req.headers.get('Authorization');
  const isCronTrigger = req.headers.get('X-Supabase-Cron') === 'true';

  if (!isCronTrigger && !authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    logger.info('AI extraction worker started');

    // Initialize services
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const aiService = new AIExtractionService(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const kv = await Deno.openKv();

    // Get all queued jobs from KV
    const queuedJobs: any[] = [];
    const iter = kv.list({ prefix: ['ai_extraction_jobs'] });

    for await (const entry of iter) {
      const job = entry.value as any;
      if (job.status === 'queued') {
        queuedJobs.push({ key: entry.key, ...job });
      }
    }

    if (queuedJobs.length === 0) {
      logger.info('No queued AI extraction jobs');
      return new Response(JSON.stringify({
        message: 'No queued jobs',
        processed: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    logger.info(`Found ${queuedJobs.length} queued AI extraction jobs`);

    // Process jobs one at a time (to avoid overloading AnythingLLM)
    let processedCount = 0;
    let failedCount = 0;

    for (const job of queuedJobs.slice(0, 5)) { // Process max 5 jobs per run
      try {
        logger.info('Processing AI extraction job', { job_id: job.job_id });

        // Update status to processing
        await kv.set(job.key, {
          ...job,
          status: 'processing',
          started_at: new Date().toISOString(),
          progress_percent: 0,
          current_step: 'Initializing AI extraction'
        });

        // Perform AI extraction
        const startTime = Date.now();

        const extractionResult = await aiService.extractFromDocument({
          document_content: job.document_content,
          document_type: job.document_type,
          language: job.language,
          dossier_id: job.dossier_id
        });

        const processingTime = Date.now() - startTime;

        // Update job with results
        await kv.set(job.key, {
          ...job,
          status: 'completed',
          completed_at: new Date().toISOString(),
          processing_time_ms: processingTime,
          result: extractionResult,
          progress_percent: 100
        });

        logger.info('AI extraction job completed', {
          job_id: job.job_id,
          processing_time_ms: processingTime
        });

        // Send push notification to user (if mobile)
        try {
          await sendPushNotification(supabase, job.user_id, job.job_id, extractionResult);
        } catch (notifError) {
          logger.warn('Failed to send push notification', { error: notifError });
        }

        processedCount++;

      } catch (error) {
        logger.error('AI extraction job failed', {
          job_id: job.job_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Update job with error
        await kv.set(job.key, {
          ...job,
          status: 'failed',
          failed_at: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        failedCount++;
      }
    }

    logger.info('AI extraction worker completed', {
      processed: processedCount,
      failed: failedCount
    });

    return new Response(JSON.stringify({
      message: 'Worker completed',
      processed: processedCount,
      failed: failedCount,
      remaining: queuedJobs.length - processedCount - failedCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('AI extraction worker failed', { error });

    return new Response(JSON.stringify({
      error: 'Worker failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Send push notification to mobile user when extraction completes
 */
async function sendPushNotification(
  supabase: any,
  userId: string,
  jobId: string,
  extractionResult: any
): Promise<void> {
  try {
    // Get user's push token from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (!profile?.push_token) {
      logger.info('No push token for user', { user_id: userId });
      return;
    }

    // Send Expo Push Notification
    const expoPushEndpoint = 'https://exp.host/--/api/v2/push/send';

    const notificationBody = {
      to: profile.push_token,
      title: 'AI Extraction Complete',
      body: `Extracted ${extractionResult.decisions?.length || 0} decisions, ${extractionResult.commitments?.length || 0} commitments, ${extractionResult.risks?.length || 0} risks`,
      data: {
        type: 'ai_extraction_complete',
        job_id: jobId,
        extraction_id: extractionResult.extraction_id,
        deep_link: `intldossier://after-action/create?extraction_id=${extractionResult.extraction_id}`
      },
      sound: 'default',
      priority: 'high'
    };

    const response = await fetch(expoPushEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(notificationBody)
    });

    if (!response.ok) {
      throw new Error(`Expo push notification failed: ${response.statusText}`);
    }

    logger.info('Push notification sent', { user_id: userId, job_id: jobId });
  } catch (error) {
    logger.error('Failed to send push notification', { error });
    throw error;
  }
}
