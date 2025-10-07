/**
 * Edge Function: Briefing Pack Job Status (T032)
 * GET /briefing-packs/jobs/{jobId}/status
 * Returns the status of a briefing pack generation job
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract job ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const jobId = pathParts[pathParts.indexOf('jobs') + 1];

    if (!jobId) {
      return new Response(JSON.stringify({ error: 'Job ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get briefing pack by ID (job_id is the briefing pack ID)
    const { data: briefingPack, error: packError } = await supabase
      .from('briefing_packs')
      .select('*, engagements(dossier_id, dossiers(created_by))')
      .eq('id', jobId)
      .single();

    if (packError || !briefingPack) {
      return new Response(
        JSON.stringify({
          error: 'Job not found',
          message: 'No briefing pack found with this ID',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify user has access (must be dossier collaborator or owner)
    const dossierId = briefingPack.engagements.dossier_id;
    const isOwner = briefingPack.engagements.dossiers.created_by === user.id;

    const { data: isCollaborator } = await supabase
      .from('dossier_collaborators')
      .select('id')
      .eq('dossier_id', dossierId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!isOwner && !isCollaborator) {
      return new Response(
        JSON.stringify({
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to view this briefing pack',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Determine status
    // Note: For now, all briefing packs are completed synchronously
    // In production, this would check actual job status
    let status: 'pending' | 'generating' | 'completed' | 'failed';

    if (briefingPack.file_url) {
      status = 'completed';
    } else {
      // If no file_url, check created_at timestamp
      const createdAt = new Date(briefingPack.generated_at);
      const now = new Date();
      const ageMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

      if (ageMinutes < 1) {
        status = 'generating';
      } else if (ageMinutes < 5) {
        status = 'pending';
      } else {
        status = 'failed';
      }
    }

    // Build response
    const response: any = {
      job_id: briefingPack.id,
      status,
      engagement_id: briefingPack.engagement_id,
      language: briefingPack.language,
      position_count: briefingPack.position_ids.length,
      generated_by: briefingPack.generated_by,
      generated_at: briefingPack.generated_at,
    };

    if (status === 'completed') {
      response.briefing_pack = {
        id: briefingPack.id,
        file_url: briefingPack.file_url,
        file_size_bytes: briefingPack.file_size_bytes,
        expires_at: briefingPack.expires_at,
        metadata: briefingPack.metadata,
      };
    } else if (status === 'failed') {
      response.error = 'Generation failed';
      response.message = 'Briefing pack generation took too long or encountered an error';
    } else if (status === 'generating') {
      response.progress = {
        message: 'Generating briefing pack...',
        estimated_completion: new Date(Date.now() + 30000).toISOString(), // 30s estimate
      };
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Job status error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
