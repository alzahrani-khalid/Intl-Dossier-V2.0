// Phase 71: Analytic Graph Edge Function (GRAPH-04)
// Thin JWT-forwarding mirror of graph-traversal/index.ts. Forwards the caller's
// JWT so the multiplexed `query_graph` SECURITY INVOKER RPC runs under the caller's
// identity (clearance enforced INSIDE the RPC via profiles.clearance_level, NOT here).
// `query_graph` already returns { nodes, edges, stats } JSONB, so this fn passes it
// through, augmenting stats with the request-side query_time_ms + 2s perf budget.
// Uses the ANON key + the forwarded Authorization header — NEVER the service-role key.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

// The 4-value whitelist — must mirror the query_graph dispatch (GRAPH-04 / V5 input validation).
const QUERY_TYPES = ['forum_membership', 'shared_committees', 'engagement_chain', 'shortest_path']
// Queries that operate on a pair of entities require a second entity id.
const TWO_ENTITY_TYPES = ['shared_committees', 'shortest_path']

interface QueryGraphResult {
  query_type?: string
  entity_id?: string
  nodes?: unknown[]
  edges?: unknown[]
  stats?: Record<string, unknown>
  [key: string]: unknown
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const startTime = Date.now()

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '')

    // Create Supabase client with user context (anon key + forwarded caller JWT,
    // NOT service-role — clearance is enforced under the caller's identity).
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    // Verify user authentication (required for the RPC's inline clearance to resolve)
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({
          error: 'Invalid user session',
          details: userError?.message,
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Parse query parameters
    const url = new URL(req.url)
    const queryType = url.searchParams.get('queryType')
    const entityId = url.searchParams.get('entityId')
    const entityId2 = url.searchParams.get('entityId2')
    const windowDaysRaw = url.searchParams.get('windowDays')

    // Validation: queryType must be one of the whitelisted templates.
    if (!queryType || !QUERY_TYPES.includes(queryType)) {
      return new Response(JSON.stringify({ error: 'Invalid or missing queryType parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // entityId is required for every query.
    if (!entityId) {
      return new Response(JSON.stringify({ error: 'Missing entityId parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Two-entity queries require entityId2.
    if (TWO_ENTITY_TYPES.includes(queryType) && !entityId2) {
      return new Response(JSON.stringify({ error: `${queryType} requires entityId2 parameter` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Clamp windowDays to 1-365 (engagement_chain only; defaulted to 90). The RPC
    // also clamps server-side — this keeps the request honest and avoids NaN.
    let windowDays = 90
    if (windowDaysRaw != null && windowDaysRaw !== '') {
      const parsed = parseInt(windowDaysRaw, 10)
      if (!Number.isNaN(parsed)) {
        windowDays = Math.min(Math.max(parsed, 1), 365)
      }
    }

    // Call the multiplexed analytic RPC under the caller's JWT.
    const { data, error } = await supabaseClient.rpc('query_graph', {
      p_query_type: queryType,
      p_entity_id: entityId,
      p_entity_id_2: entityId2 ?? null,
      p_window_days: windowDays,
    })

    if (error) {
      console.error('query_graph error:', error)
      throw error
    }

    // query_graph returns JSONB already shaped with { nodes, edges, stats }.
    // Pass it through, augmenting stats with the request-side timing + perf budget.
    const result = (data ?? {}) as QueryGraphResult
    const nodes = Array.isArray(result.nodes) ? result.nodes : []
    const edges = Array.isArray(result.edges) ? result.edges : []
    const queryTime = Date.now() - startTime
    const performanceWarning = queryTime > 2000 ? 'Query exceeded 2s performance target' : null

    return new Response(
      JSON.stringify({
        ...result,
        nodes,
        edges,
        stats: {
          ...(result.stats ?? {}),
          node_count: nodes.length,
          edge_count: edges.length,
          query_time_ms: queryTime,
          performance_warning: performanceWarning,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Error in analytic-graph:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
