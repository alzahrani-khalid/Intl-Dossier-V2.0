/**
 * PDF Generation - Generate Bilingual Endpoint
 *
 * POST /pdf-generation/generate-bilingual/:id
 *
 * Generates English + Arabic PDFs for distribution
 * Validates access, generates PDFs, uploads to Storage
 *
 * Contract: /specs/022-after-action-structured/contracts/pdf-generation-api.md
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFGenerationService } from '../../services/pdf-generation.service.ts';
import { createLogger } from '../../utils/logger.ts';

const logger = createLogger('pdf-generation');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(req.url);
    const afterActionId = url.pathname.split('/').pop();

    if (!afterActionId) {
      return new Response(JSON.stringify({ error: 'Missing after_action_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json().catch(() => ({}));
    const includeWatermark = body.include_watermark || false;

    logger.info('Generating bilingual PDFs', { after_action_id: afterActionId, user_id: user.id });

    const pdfService = new PDFGenerationService(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const result = await pdfService.generateBilingualPDFs({
      after_action_id: afterActionId,
      language: 'en',
      include_confidential_watermark: includeWatermark
    });

    logger.info('Bilingual PDFs generated', result);

    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('PDF generation failed', { error });
    return new Response(JSON.stringify({
      error: 'PDF generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
