/**
 * AI Extraction - Synchronous Endpoint
 *
 * POST /ai-extraction/extract-sync
 *
 * Synchronously extracts structured data from meeting minutes (< 5s processing)
 * For documents <500KB only
 *
 * Contract: /specs/022-after-action-structured/contracts/ai-extraction-api.md
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AIExtractionService } from '../../services/ai-extraction.service.ts';
import { createLogger } from '../../utils/logger.ts';

const logger = createLogger('ai-extraction-sync');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MAX_SYNC_SIZE_KB = 500;
const MAX_SYNC_TIME_MS = 5000;

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
    const startTime = Date.now();

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

    // Check document size for sync processing
    const contentSizeKB = new TextEncoder().encode(document_content).length / 1024;
    if (contentSizeKB > MAX_SYNC_SIZE_KB) {
      return new Response(JSON.stringify({
        error: `Document too large for sync processing. Max ${MAX_SYNC_SIZE_KB}KB. Use /extract-async instead.`,
        size_kb: contentSizeKB,
        max_size_kb: MAX_SYNC_SIZE_KB
      }), {
        status: 413,
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

    logger.info('Starting sync AI extraction', {
      user_id: user.id,
      language,
      document_type,
      content_size_kb: contentSizeKB
    });

    // Initialize AI extraction service
    const aiService = new AIExtractionService(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Set timeout for sync processing
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Processing timeout')), MAX_SYNC_TIME_MS)
    );

    // Race between extraction and timeout
    const extractionPromise = aiService.extractFromDocument({
      document_content,
      document_type,
      language,
      dossier_id
    });

    let extractionResult;
    try {
      extractionResult = await Promise.race([extractionPromise, timeoutPromise]);
    } catch (timeoutError) {
      // Processing took too long - suggest async
      const processingTime = Date.now() - startTime;
      return new Response(JSON.stringify({
        error: 'Processing timeout. Document too complex for sync processing. Use /extract-async instead.',
        processing_time_ms: processingTime,
        max_time_ms: MAX_SYNC_TIME_MS
      }), {
        status: 408,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const totalTime = Date.now() - startTime;

    logger.info('Sync AI extraction completed', {
      user_id: user.id,
      extraction_id: extractionResult.extraction_id,
      processing_time_ms: totalTime
    });

    return new Response(JSON.stringify({
      success: true,
      ...extractionResult,
      total_time_ms: totalTime
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Sync AI extraction failed', { error });

    return new Response(JSON.stringify({
      error: 'AI extraction failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
