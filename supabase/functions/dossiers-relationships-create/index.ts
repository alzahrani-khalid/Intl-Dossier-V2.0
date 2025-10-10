// T038: POST /dossiers/{dossierId}/relationships Edge Function
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
    const dossierId = url.searchParams.get('dossierId');

    if (!dossierId) {
      return new Response(
        JSON.stringify({ error: 'Missing dossierId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { child_dossier_id, relationship_type, relationship_strength, established_date, end_date, notes } = body;

    // Validate required fields
    if (!child_dossier_id || !relationship_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: child_dossier_id, relationship_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-referencing
    if (dossierId === child_dossier_id) {
      return new Response(
        JSON.stringify({ error: 'Cannot create self-referencing relationship' }),
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

    // Check if relationship already exists
    const { data: existing, error: existingError } = await supabaseClient
      .from('dossier_relationships')
      .select('*')
      .eq('parent_dossier_id', dossierId)
      .eq('child_dossier_id', child_dossier_id)
      .eq('relationship_type', relationship_type)
      .single();

    if (existing && !existingError) {
      return new Response(
        JSON.stringify({ error: 'Relationship already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create relationship
    const { data: relationship, error: insertError } = await supabaseClient
      .from('dossier_relationships')
      .insert({
        parent_dossier_id: dossierId,
        child_dossier_id,
        relationship_type,
        relationship_strength: relationship_strength || 'primary',
        established_date,
        end_date,
        notes,
        created_by: user.id,
      })
      .select(`
        *,
        child_dossier:dossiers!child_dossier_id(id, name_en, name_ar, reference_type, status)
      `)
      .single();

    if (insertError) {
      // Check if it's a permission error
      if (insertError.code === '42501') {
        return new Response(
          JSON.stringify({ error: 'Forbidden: You do not own this dossier' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw insertError;
    }

    return new Response(
      JSON.stringify(relationship),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in dossiers-relationships-create:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
