/**
 * Edge Function: Generate Briefing Pack (T030)
 * POST /engagements/{id}/briefing-packs
 * Generates a bilingual PDF briefing pack from engagement and positions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  generateBriefingPack,
  uploadBriefingPack,
  saveBriefingPackMetadata,
} from '../_shared/briefing-pack-generator.ts';

interface GenerateRequest {
  language: 'en' | 'ar';
  position_ids?: string[]; // Optional: specific positions, defaults to all attached
}

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

    // Extract engagement ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const engagementId = pathParts[pathParts.indexOf('engagements') + 1];

    if (!engagementId) {
      return new Response(JSON.stringify({ error: 'Engagement ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: GenerateRequest = await req.json();
    const { language, position_ids } = body;

    // Validate language
    if (!language || !['en', 'ar'].includes(language)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid language',
          message: 'Language must be "en" or "ar"',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get engagement
    const { data: engagement, error: engagementError } = await supabase
      .from('engagements')
      .select('*, dossiers(id, title)')
      .eq('id', engagementId)
      .single();

    if (engagementError || !engagement) {
      return new Response(JSON.stringify({ error: 'Engagement not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user has access to dossier (must be collaborator)
    const { data: access } = await supabase
      .from('dossiers')
      .select('id, created_by')
      .eq('id', engagement.dossiers.id)
      .single();

    const isOwner = access?.created_by === user.id;
    const { data: isCollaborator } = await supabase
      .from('dossier_collaborators')
      .select('id')
      .eq('dossier_id', engagement.dossiers.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!isOwner && !isCollaborator) {
      return new Response(
        JSON.stringify({
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to generate briefing packs for this engagement',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get attached positions
    let positionsQuery = supabase
      .from('engagement_positions')
      .select('positions(*)')
      .eq('engagement_id', engagementId);

    if (position_ids && position_ids.length > 0) {
      positionsQuery = positionsQuery.in('position_id', position_ids);
    }

    const { data: attachedPositions, error: positionsError } = await positionsQuery;

    if (positionsError) {
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch positions',
          message: positionsError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const positions = attachedPositions.map((ep: any) => ep.positions);

    // Validate position count
    if (positions.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'NO_POSITIONS_ATTACHED',
          message: 'No positions attached to this engagement',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (positions.length > 100) {
      return new Response(
        JSON.stringify({
          error: 'TOO_MANY_POSITIONS',
          message: 'Cannot generate briefing pack with more than 100 positions',
          position_count: positions.length,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(
      `Generating ${language} briefing pack for engagement ${engagementId} with ${positions.length} positions`
    );

    // Generate briefing pack (with timeout: 10s per 100 positions)
    const timeout = Math.ceil((positions.length / 100) * 10000);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const { fileContent, fileName, fileSize } = await generateBriefingPack({
        engagement: {
          id: engagement.id,
          title: engagement.title,
          description: engagement.description,
          date: engagement.date,
          stakeholders: engagement.stakeholders,
        },
        positions,
        language,
        generatedBy: user.id,
      });

      clearTimeout(timeoutId);

      // Upload to storage
      const fileUrl = await uploadBriefingPack(
        supabaseUrl,
        supabaseKey,
        fileContent,
        fileName
      );

      console.log(`Briefing pack uploaded: ${fileUrl}`);

      // Save metadata
      const briefingPackId = await saveBriefingPackMetadata(
        supabaseUrl,
        supabaseKey,
        engagementId,
        positions.map((p: any) => p.id),
        language,
        user.id,
        fileUrl,
        fileSize
      );

      console.log(`Briefing pack metadata saved: ${briefingPackId}`);

      // Return 202 Accepted with job info
      // Note: For now returning 201 since generation is synchronous
      // In production, this should be async with job status endpoint
      return new Response(
        JSON.stringify({
          id: briefingPackId,
          engagement_id: engagementId,
          language,
          position_count: positions.length,
          file_url: fileUrl,
          file_size_bytes: fileSize,
          generated_at: new Date().toISOString(),
          status: 'completed',
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        return new Response(
          JSON.stringify({
            error: 'GENERATION_TIMEOUT',
            message: `Briefing pack generation timed out after ${timeout}ms`,
          }),
          {
            status: 504,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error('Briefing pack generation error:', error);

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
