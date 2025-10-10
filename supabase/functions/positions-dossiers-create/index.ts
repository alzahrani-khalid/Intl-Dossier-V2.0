// T041: POST /positions/{positionId}/dossiers Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const positionId = url.searchParams.get('positionId');

    if (!positionId) {
      return new Response(
        JSON.stringify({ error: 'Missing positionId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { dossier_id, link_type, notes } = body;

    // Validate required fields
    if (!dossier_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: dossier_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if link already exists
    const { data: existing, error: existingError } = await supabaseClient
      .from('position_dossier_links')
      .select('*')
      .eq('position_id', positionId)
      .eq('dossier_id', dossier_id)
      .single();

    if (existing && !existingError) {
      return new Response(
        JSON.stringify({ error: 'Link already exists between this position and dossier' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create link
    const { data: link, error: insertError } = await supabaseClient
      .from('position_dossier_links')
      .insert({
        position_id: positionId,
        dossier_id,
        link_type: link_type || 'related',
        notes,
        linked_by: user.id,
      })
      .select(`
        *,
        dossier:dossiers!dossier_id(id, name_en, name_ar, reference_type, status)
      `)
      .single();

    if (insertError) {
      // Check if it's a permission error
      if (insertError.code === '42501') {
        return new Response(
          JSON.stringify({ error: 'Forbidden: You do not have permission to link this position' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw insertError;
    }

    return new Response(
      JSON.stringify(link),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in positions-dossiers-create:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
