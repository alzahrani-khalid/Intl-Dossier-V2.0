/**
 * AI Extraction - Status Endpoint
 *
 * GET /ai-extraction/status/:job_id
 *
 * Poll status of async AI extraction job
 * Returns results when complete
 *
 * Contract: /specs/022-after-action-structured/contracts/ai-extraction-api.md
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../../utils/logger.ts';

const logger = createLogger('ai-extraction-status');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: `Bearer ${jwt}` }
      }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract job_id from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const jobId = pathParts[pathParts.length - 1];

    if (!jobId) {
      return new Response(JSON.stringify({
        error: 'Missing job_id parameter'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    logger.info('Checking AI extraction job status', {
      job_id: jobId,
      user_id: user.id
    });

    // Retrieve job from KV
    const kv = await Deno.openKv();
    const jobEntry = await kv.get(['ai_extraction_jobs', jobId]);

    if (!jobEntry.value) {
      return new Response(JSON.stringify({
        error: 'Job not found',
        job_id: jobId,
        message: 'Job may have expired (24h TTL) or never existed'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const jobMetadata = jobEntry.value as any;

    // Verify job belongs to user
    if (jobMetadata.user_id !== user.id) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'You do not have access to this job'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return job status
    const response: any = {
      job_id: jobId,
      status: jobMetadata.status,
      created_at: jobMetadata.created_at,
      estimated_completion_time: jobMetadata.estimated_completion_time
    };

    // Include progress if processing
    if (jobMetadata.status === 'processing') {
      response.progress_percent = jobMetadata.progress_percent || 0;
      response.current_step = jobMetadata.current_step || 'Initializing';
    }

    // Include results if complete
    if (jobMetadata.status === 'completed' && jobMetadata.result) {
      response.result = jobMetadata.result;
      response.completed_at = jobMetadata.completed_at;
      response.processing_time_ms = jobMetadata.processing_time_ms;
    }

    // Include error if failed
    if (jobMetadata.status === 'failed' && jobMetadata.error) {
      response.error = jobMetadata.error;
      response.failed_at = jobMetadata.failed_at;
    }

    logger.info('AI extraction job status retrieved', {
      job_id: jobId,
      status: jobMetadata.status
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Failed to get AI extraction job status', { error });

    return new Response(JSON.stringify({
      error: 'Failed to get job status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
