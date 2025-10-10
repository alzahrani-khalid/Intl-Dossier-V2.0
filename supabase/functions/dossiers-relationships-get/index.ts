// T037: GET /dossiers/{dossierId}/relationships Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const dossierId = url.searchParams.get('dossierId');
    const relationship_type = url.searchParams.get('relationship_type');
    const direction = url.searchParams.get('direction') || 'both';

    if (!dossierId) {
      return new Response(
        JSON.stringify({ error: 'Missing dossierId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify dossier exists
    const { data: dossier, error: dossierError } = await supabaseClient
      .from('dossiers')
      .select('id')
      .eq('id', dossierId)
      .single();

    if (dossierError || !dossier) {
      return new Response(
        JSON.stringify({ error: 'Dossier not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query based on direction
    let query;

    if (direction === 'parent') {
      // Parent relationships: this dossier is the parent
      query = supabaseClient
        .from('dossier_relationships')
        .select(`
          *,
          child_dossier:dossiers!child_dossier_id(id, name_en, name_ar, reference_type, status)
        `)
        .eq('parent_dossier_id', dossierId)
        .eq('status', 'active');
    } else if (direction === 'child') {
      // Child relationships: this dossier is the child
      query = supabaseClient
        .from('dossier_relationships')
        .select(`
          *,
          parent_dossier:dossiers!parent_dossier_id(id, name_en, name_ar, reference_type, status)
        `)
        .eq('child_dossier_id', dossierId)
        .eq('status', 'active');
    } else {
      // Both directions: fetch separately and union
      const { data: parentRels, error: parentError } = await supabaseClient
        .from('dossier_relationships')
        .select(`
          *,
          child_dossier:dossiers!child_dossier_id(id, name_en, name_ar, reference_type, status)
        `)
        .eq('parent_dossier_id', dossierId)
        .eq('status', 'active');

      const { data: childRels, error: childError } = await supabaseClient
        .from('dossier_relationships')
        .select(`
          *,
          parent_dossier:dossiers!parent_dossier_id(id, name_en, name_ar, reference_type, status)
        `)
        .eq('child_dossier_id', dossierId)
        .eq('status', 'active');

      if (parentError || childError) {
        throw new Error('Failed to fetch relationships');
      }

      // Filter by relationship type if provided
      let relationships = [...(parentRels || []), ...(childRels || [])];
      if (relationship_type) {
        relationships = relationships.filter(r => r.relationship_type === relationship_type);
      }

      return new Response(
        JSON.stringify({
          relationships,
          total_count: relationships.length,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apply relationship type filter if provided
    if (relationship_type) {
      query = query.eq('relationship_type', relationship_type);
    }

    const { data: relationships, error: relError } = await query;

    if (relError) {
      throw relError;
    }

    return new Response(
      JSON.stringify({
        relationships: relationships || [],
        total_count: relationships?.length || 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in dossiers-relationships-get:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
