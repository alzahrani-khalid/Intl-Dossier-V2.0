/**
 * AI Extraction - Asynchronous Endpoint
 *
 * POST /ai-extraction/extract-async
 *
 * Queues AI extraction job for async processing (>5s processing)
 * For large documents or complex extraction tasks
 *
 * Contract: /specs/022-after-action-structured/contracts/ai-extraction-api.md
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../../utils/logger.ts';

const logger = createLogger('ai-extraction-async');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const REDIS_URL = Deno.env.get('REDIS_URL') || 'redis://localhost:6379';

// Estimated processing time based on document size
const ESTIMATED_TIME_PER_KB_MS = 100; // 100ms per KB
const BASE_PROCESSING_TIME_MS = 2000; // Base 2 seconds

serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  if (req.method !== 'POST') {
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

    // Parse request body
    const body = await req.json();
    const { document_content, document_type, language, dossier_id } = body;

    // Validation
    if (!document_content || !document_type || !language) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: document_content, document_type, language'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate language
    if (!['en', 'ar'].includes(language)) {
      return new Response(JSON.stringify({
        error: 'Invalid language. Must be "en" or "ar"'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate document type
    const validTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(document_type)) {
      return new Response(JSON.stringify({
        error: `Invalid document_type. Must be one of: ${validTypes.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate document size and estimated completion time
    const contentSizeKB = new TextEncoder().encode(document_content).length / 1024;
    const estimatedTimeMs = BASE_PROCESSING_TIME_MS + (contentSizeKB * ESTIMATED_TIME_PER_KB_MS);
    const estimatedCompletionTime = new Date(Date.now() + estimatedTimeMs).toISOString();

    // Generate job ID
    const jobId = crypto.randomUUID();

    logger.info('Creating async AI extraction job', {
      job_id: jobId,
      user_id: user.id,
      language,
      document_type,
      content_size_kb: contentSizeKB,
      estimated_time_ms: estimatedTimeMs
    });

    // Store job metadata in Redis (using Deno KV as fallback if Redis unavailable)
    const kv = await Deno.openKv();

    const jobMetadata = {
      job_id: jobId,
      user_id: user.id,
      document_content,
      document_type,
      language,
      dossier_id,
      status: 'queued',
      created_at: new Date().toISOString(),
      estimated_completion_time: estimatedCompletionTime,
      content_size_kb: contentSizeKB
    };

    // Store in KV with 24h TTL
    await kv.set(['ai_extraction_jobs', jobId], jobMetadata, { expireIn: 24 * 60 * 60 * 1000 });

    logger.info('Async AI extraction job queued', {
      job_id: jobId,
      estimated_completion_time: estimatedCompletionTime
    });

    // Return job ID and estimated completion time
    return new Response(JSON.stringify({
      success: true,
      job_id: jobId,
      status: 'queued',
      estimated_completion_time: estimatedCompletionTime,
      estimated_time_ms: estimatedTimeMs,
      message: 'AI extraction job queued. Use GET /ai-extraction/status/:job_id to check status.'
    }), {
      status: 202, // Accepted
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Async AI extraction job creation failed', { error });

    return new Response(JSON.stringify({
      error: 'Failed to queue AI extraction job',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
