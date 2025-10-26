// T066: GET /relationships Edge Function for Unified Dossier Architecture
// User Story 2: Model Engagement as Independent Entity
// Gets bidirectional relationships for any dossier (engagement or entity)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
    const status = url.searchParams.get('status') || 'active';
    const includeHistorical = url.searchParams.get('includeHistorical') === 'true';

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
      .select('id, type')
      .eq('id', dossierId)
      .single();

    if (dossierError || !dossier) {
      return new Response(
        JSON.stringify({ error: 'Dossier not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build bidirectional query (both source and target)
    // T066: getRelationshipsForDossier - fetches both directions
    let query = supabaseClient
      .from('dossier_relationships')
      .select(`
        *,
        source_dossier:dossiers!source_dossier_id(id, type, name_en, name_ar, status),
        target_dossier:dossiers!target_dossier_id(id, type, name_en, name_ar, status)
      `)
      .or(`source_dossier_id.eq.${dossierId},target_dossier_id.eq.${dossierId}`);

    // Apply filters
    if (relationship_type) {
      query = query.eq('relationship_type', relationship_type);
    }

    if (!includeHistorical) {
      query = query.eq('status', status);
    }

    const { data: relationships, error: relError } = await query;

    if (relError) {
      throw relError;
    }

    // Transform data to indicate direction and identify related dossier
    const transformedRelationships = (relationships || []).map((rel) => {
      const isSource = rel.source_dossier_id === dossierId;
      return {
        ...rel,
        direction: isSource ? 'outgoing' : 'incoming',
        related_dossier: isSource ? rel.target_dossier : rel.source_dossier,
      };
    });

    return new Response(
      JSON.stringify({
        relationships: transformedRelationships,
        total_count: transformedRelationships.length,
        page: 0,
        page_size: transformedRelationships.length,
        // Additional metadata for debugging
        dossier_id: dossierId,
        dossier_type: dossier.type,
        filters: {
          relationship_type: relationship_type || 'all',
          status,
          includeHistorical,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in dossiers-relationships-get:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
