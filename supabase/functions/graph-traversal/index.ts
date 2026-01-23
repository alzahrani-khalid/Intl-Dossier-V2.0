// T077: Graph Traversal Edge Function for Unified Dossier Architecture
// User Story 3: Traverse Entity Relationships as Graph
// Exposes N-degree relationship graph traversal with RLS enforcement
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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const startTime = Date.now();

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user authentication (required for RLS to work properly)
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({
          error: 'Invalid user session',
          details: userError?.message,
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const startDossierId = url.searchParams.get('startDossierId');
    const maxDegrees = parseInt(url.searchParams.get('maxDegrees') || '2', 10);
    const relationshipType = url.searchParams.get('relationshipType');

    // Validation
    if (!startDossierId) {
      return new Response(JSON.stringify({ error: 'Missing startDossierId parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (maxDegrees < 1 || maxDegrees > 5) {
      return new Response(JSON.stringify({ error: 'maxDegrees must be between 1 and 5' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify starting dossier exists and user has access (RLS automatically applies)
    const { data: startDossier, error: dossierError } = await supabaseClient
      .from('dossiers')
      .select('id, type, name_en, name_ar, status')
      .eq('id', startDossierId)
      .single();

    if (dossierError || !startDossier) {
      return new Response(
        JSON.stringify({ error: 'Starting dossier not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call recursive graph traversal function
    const { data: graphData, error: graphError } = await supabaseClient.rpc(
      'traverse_relationship_graph',
      {
        start_dossier_id: startDossierId,
        max_degrees: maxDegrees,
        relationship_type_filter: relationshipType || null,
      }
    );

    if (graphError) {
      console.error('Graph traversal error:', graphError);
      throw graphError;
    }

    // Transform results into nodes and edges
    const nodesMap = new Map();
    const edges: any[] = [];

    // Add starting node
    nodesMap.set(startDossierId, {
      id: startDossierId,
      type: startDossier.type,
      name_en: startDossier.name_en,
      name_ar: startDossier.name_ar,
      status: startDossier.status,
      degree: 0,
      path: [startDossierId],
    });

    // Process graph results
    (graphData || []).forEach((row: any) => {
      // Add node if not exists
      if (!nodesMap.has(row.dossier_id)) {
        nodesMap.set(row.dossier_id, {
          id: row.dossier_id,
          type: row.dossier_type,
          name_en: row.name_en,
          name_ar: row.name_ar,
          status: row.status,
          degree: row.degree,
          path: row.path,
        });
      }

      // Build edges from path
      if (row.path && row.path.length > 1 && row.relationship_path) {
        for (let i = 0; i < row.path.length - 1; i++) {
          const sourceId = row.path[i];
          const targetId = row.path[i + 1];
          const relationshipType = row.relationship_path[i];

          // Check if edge already exists
          const edgeExists = edges.some(
            (e) =>
              e.source_id === sourceId &&
              e.target_id === targetId &&
              e.relationship_type === relationshipType
          );

          if (!edgeExists) {
            edges.push({
              source_id: sourceId,
              target_id: targetId,
              relationship_type: relationshipType,
            });
          }
        }
      }
    });

    const nodes = Array.from(nodesMap.values());
    const queryTime = Date.now() - startTime;

    // Performance warning if query exceeds target
    const performanceWarning = queryTime > 2000 ? 'Query exceeded 2s performance target' : null;

    return new Response(
      JSON.stringify({
        start_dossier_id: startDossierId,
        start_dossier: startDossier,
        max_degrees: maxDegrees,
        relationship_type_filter: relationshipType || 'all',
        nodes,
        edges,
        stats: {
          node_count: nodes.length,
          edge_count: edges.length,
          max_degree: Math.max(...nodes.map((n) => n.degree)),
          query_time_ms: queryTime,
          performance_warning: performanceWarning,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in graph-traversal:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
