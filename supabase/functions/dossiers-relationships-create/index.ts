// T065: POST /relationships Edge Function for Unified Dossier Architecture
// User Story 2: Model Engagement as Independent Entity
// Creates relationships between any dossiers (engagement-to-entity, entity-to-entity)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const {
      source_dossier_id,
      target_dossier_id,
      relationship_type,
      relationship_metadata = {},
      notes_en,
      notes_ar,
      effective_from,
      effective_to,
      status = 'active'
    } = body;

    // Validate required fields
    if (!source_dossier_id || !target_dossier_id || !relationship_type) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: source_dossier_id, target_dossier_id, relationship_type'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // T067: Prevent self-referencing (enforced at DB level too)
    if (source_dossier_id === target_dossier_id) {
      return new Response(
        JSON.stringify({
          error: 'Cannot create relationship: source and target cannot be the same dossier'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate temporal range
    if (effective_from && effective_to) {
      const from = new Date(effective_from);
      const to = new Date(effective_to);
      if (to < from) {
        return new Response(
          JSON.stringify({
            error: 'Cannot create relationship: effective_to must be >= effective_from'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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

    // T068: Validate no circular hierarchies for parent_of/subsidiary_of relationships
    if (['parent_of', 'subsidiary_of'].includes(relationship_type)) {
      // Check if target is already an ancestor of source (would create circular dependency)
      const { data: ancestors, error: ancestorError } = await supabaseClient
        .rpc('traverse_relationship_graph', {
          start_dossier_id: source_dossier_id,
          max_depth: 10,
          filter_type: 'parent_of'
        });

      if (ancestors && !ancestorError) {
        const hasCircular = ancestors.some((ancestor: any) => ancestor.dossier_id === target_dossier_id);
        if (hasCircular) {
          return new Response(
            JSON.stringify({
              error: 'Cannot create relationship: circular hierarchy detected'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Check if relationship already exists
    const { data: existing, error: existingError } = await supabaseClient
      .from('dossier_relationships')
      .select('id')
      .eq('source_dossier_id', source_dossier_id)
      .eq('target_dossier_id', target_dossier_id)
      .eq('relationship_type', relationship_type)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          error: 'Relationship already exists',
          existing_id: existing.id
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create relationship
    const { data: relationship, error: insertError } = await supabaseClient
      .from('dossier_relationships')
      .insert({
        source_dossier_id,
        target_dossier_id,
        relationship_type,
        relationship_metadata,
        notes_en,
        notes_ar,
        effective_from,
        effective_to,
        status,
        created_by: user.id,
      })
      .select(`
        *,
        source:source_dossier_id(id, type, name_en, name_ar, status),
        target:target_dossier_id(id, type, name_en, name_ar, status)
      `)
      .single();

    if (insertError) {
      // Check if it's a permission error (RLS policy violation)
      if (insertError.code === '42501' || insertError.code === 'PGRST301') {
        return new Response(
          JSON.stringify({
            error: 'Forbidden: insufficient permissions to create relationship'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        relationship
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in dossiers-relationships-create:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
