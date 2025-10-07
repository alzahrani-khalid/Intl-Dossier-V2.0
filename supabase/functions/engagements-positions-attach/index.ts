import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get engagement ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const engagementId = pathParts[pathParts.indexOf('engagements') + 1];

    if (!engagementId) {
      return new Response(
        JSON.stringify({ error: 'Engagement ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { position_id, attachment_reason, display_order, relevance_score } = body;

    if (!position_id) {
      return new Response(
        JSON.stringify({ error: 'position_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user ID
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify engagement exists and user has access
    const { data: engagement, error: engagementError } = await supabaseClient
      .from('engagements')
      .select('id, dossier_id, dossiers(id, created_by)')
      .eq('id', engagementId)
      .single();

    if (engagementError || !engagement) {
      return new Response(
        JSON.stringify({ error: 'Engagement not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify position exists
    const { data: position, error: positionError } = await supabaseClient
      .from('positions')
      .select('id, title')
      .eq('id', position_id)
      .single();

    if (positionError || !position) {
      return new Response(
        JSON.stringify({ error: 'Position not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if position is already attached
    const { data: existing } = await supabaseClient
      .from('engagement_positions')
      .select('id')
      .eq('engagement_id', engagementId)
      .eq('position_id', position_id)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({
          error: 'POSITION_ALREADY_ATTACHED',
          message: 'This position is already attached to the engagement'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check attachment limit (100 positions max)
    const { count } = await supabaseClient
      .from('engagement_positions')
      .select('*', { count: 'exact', head: true })
      .eq('engagement_id', engagementId);

    if (count && count >= 100) {
      return new Response(
        JSON.stringify({
          error: 'ATTACHMENT_LIMIT_EXCEEDED',
          message: 'Cannot attach more than 100 positions to an engagement',
          current_count: count
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert engagement position (RLS will verify permissions)
    const { data: attachedPosition, error: insertError } = await supabaseClient
      .from('engagement_positions')
      .insert({
        engagement_id: engagementId,
        position_id: position_id,
        attached_by: user.id,
        attachment_reason: attachment_reason || null,
        display_order: display_order || null,
        relevance_score: relevance_score || null,
      })
      .select(`
        *,
        positions (
          id,
          title,
          content,
          type,
          status,
          language
        )
      `)
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);

      // Check if it's a permission error
      if (insertError.code === '42501' || insertError.message.includes('permission')) {
        return new Response(
          JSON.stringify({
            error: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to attach positions to this engagement'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to attach position', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create audit log
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'position_attached',
      resource_type: 'engagement_position',
      resource_id: attachedPosition.id,
      metadata: {
        engagement_id: engagementId,
        position_id: position_id,
        position_title: position.title,
        attachment_reason: attachment_reason,
      },
    });

    return new Response(
      JSON.stringify(attachedPosition),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
