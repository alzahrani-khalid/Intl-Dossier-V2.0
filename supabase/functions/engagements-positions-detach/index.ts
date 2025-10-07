import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get engagement ID and position ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const engagementId = pathParts[pathParts.indexOf('engagements') + 1];
    const positionId = pathParts[pathParts.indexOf('positions') + 1];

    if (!engagementId || !positionId) {
      return new Response(
        JSON.stringify({ error: 'Engagement ID and Position ID required' }),
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

    // Verify attachment exists
    const { data: attachment, error: attachmentError } = await supabaseClient
      .from('engagement_positions')
      .select('id, position_id, positions(title)')
      .eq('engagement_id', engagementId)
      .eq('position_id', positionId)
      .single();

    if (attachmentError || !attachment) {
      return new Response(
        JSON.stringify({ error: 'Attachment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete attachment (RLS will verify permissions)
    const { error: deleteError } = await supabaseClient
      .from('engagement_positions')
      .delete()
      .eq('engagement_id', engagementId)
      .eq('position_id', positionId);

    if (deleteError) {
      console.error('Delete error:', deleteError);

      // Check if it's a permission error
      if (deleteError.code === '42501' || deleteError.message.includes('permission')) {
        return new Response(
          JSON.stringify({
            error: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to detach positions from this engagement'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to detach position', details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create audit log
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'position_detached',
      resource_type: 'engagement_position',
      resource_id: attachment.id,
      metadata: {
        engagement_id: engagementId,
        position_id: positionId,
        position_title: attachment.positions?.title,
      },
    });

    return new Response(
      null,
      {
        status: 204,
        headers: corsHeaders,
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
