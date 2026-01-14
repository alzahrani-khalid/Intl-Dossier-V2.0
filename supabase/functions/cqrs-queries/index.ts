/**
 * CQRS Queries Edge Function
 *
 * Handles read operations (queries) in the CQRS pattern.
 * All queries go through optimized read models (projections) for fast performance.
 *
 * Endpoints:
 * - GET /timeline - Get timeline events for a dossier
 * - GET /graph - Get relationship graph for a dossier
 * - GET /dossier/summary - Get pre-computed dossier summary
 * - GET /dossier/search - Search dossiers using optimized full-text search
 * - GET /metrics/daily - Get daily aggregated metrics
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Query parameters interfaces
interface TimelineQuery {
  dossier_id: string;
  event_types?: string[];
  priority?: string[];
  date_from?: string;
  date_to?: string;
  search_query?: string;
  cursor?: string;
  limit?: number;
}

interface GraphQuery {
  dossier_id: string;
  relationship_types?: string[];
  max_depth?: number;
  include_inactive?: boolean;
}

interface SearchQuery {
  query: string;
  types?: string[];
  status?: string[];
  limit?: number;
  offset?: number;
}

interface MetricsQuery {
  date_from?: string;
  date_to?: string;
  metric_type?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use GET for queries.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse URL path to determine query type
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const functionName = pathParts[0]; // 'cqrs-queries'
    const queryType = pathParts[1]; // 'timeline', 'graph', 'dossier', 'metrics'
    const subType = pathParts[2]; // 'summary', 'search', 'daily' (optional)

    // Create Supabase client
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse query parameters
    const params = Object.fromEntries(url.searchParams.entries());

    // Route to appropriate handler
    let result: unknown;

    switch (`${queryType}${subType ? '/' + subType : ''}`) {
      case 'timeline':
        result = await handleTimelineQuery(supabaseClient, parseTimelineParams(params));
        break;
      case 'graph':
        result = await handleGraphQuery(supabaseClient, parseGraphParams(params));
        break;
      case 'dossier/summary':
        result = await handleSummaryQuery(supabaseClient, params.dossier_id);
        break;
      case 'dossier/search':
        result = await handleSearchQuery(supabaseClient, parseSearchParams(params));
        break;
      case 'metrics/daily':
        result = await handleMetricsQuery(supabaseClient, parseMetricsParams(params));
        break;
      default:
        return new Response(
          JSON.stringify({
            error: 'Unknown query',
            available_queries: [
              'timeline',
              'graph',
              'dossier/summary',
              'dossier/search',
              'metrics/daily',
            ],
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Query error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// PARAMETER PARSERS
// ============================================================================

function parseTimelineParams(params: Record<string, string>): TimelineQuery {
  return {
    dossier_id: params.dossier_id,
    event_types: params.event_types ? params.event_types.split(',') : undefined,
    priority: params.priority ? params.priority.split(',') : undefined,
    date_from: params.date_from,
    date_to: params.date_to,
    search_query: params.search_query,
    cursor: params.cursor,
    limit: params.limit ? parseInt(params.limit, 10) : 20,
  };
}

function parseGraphParams(params: Record<string, string>): GraphQuery {
  return {
    dossier_id: params.dossier_id,
    relationship_types: params.relationship_types
      ? params.relationship_types.split(',')
      : undefined,
    max_depth: params.max_depth ? parseInt(params.max_depth, 10) : 2,
    include_inactive: params.include_inactive === 'true',
  };
}

function parseSearchParams(params: Record<string, string>): SearchQuery {
  return {
    query: params.query || '',
    types: params.types ? params.types.split(',') : undefined,
    status: params.status ? params.status.split(',') : undefined,
    limit: params.limit ? parseInt(params.limit, 10) : 20,
    offset: params.offset ? parseInt(params.offset, 10) : 0,
  };
}

function parseMetricsParams(params: Record<string, string>): MetricsQuery {
  return {
    date_from: params.date_from,
    date_to: params.date_to,
    metric_type: params.metric_type,
  };
}

// ============================================================================
// QUERY HANDLERS
// ============================================================================

/**
 * Handle timeline query using optimized read model
 */
async function handleTimelineQuery(
  supabase: ReturnType<typeof createClient>,
  query: TimelineQuery
) {
  const startTime = Date.now();

  if (!query.dossier_id) {
    throw new Error('dossier_id is required');
  }

  // Try to use optimized read model first
  const { data: events, error: rmError } = await supabase.rpc('read_models.get_timeline', {
    p_dossier_id: query.dossier_id,
    p_event_types: query.event_types || null,
    p_priority: query.priority || null,
    p_date_from: query.date_from ? new Date(query.date_from).toISOString() : null,
    p_date_to: query.date_to ? new Date(query.date_to).toISOString() : null,
    p_search_query: query.search_query || null,
    p_cursor: query.cursor ? new Date(query.cursor).toISOString() : null,
    p_limit: (query.limit || 20) + 1, // Fetch one extra to check if there's more
  });

  // If read model fails, fallback to direct query
  if (rmError) {
    console.warn('Read model fallback:', rmError.message);
    return await handleTimelineFallback(supabase, query);
  }

  const hasMore = events && events.length > (query.limit || 20);
  const paginatedEvents = hasMore ? events.slice(0, -1) : events;
  const nextCursor =
    hasMore && paginatedEvents.length > 0
      ? paginatedEvents[paginatedEvents.length - 1].event_date
      : undefined;

  const queryTime = Date.now() - startTime;

  return {
    events: paginatedEvents || [],
    next_cursor: nextCursor,
    has_more: hasMore,
    total_count: paginatedEvents?.length || 0,
    source: 'read_model',
    query_time_ms: queryTime,
  };
}

/**
 * Fallback timeline query using direct table access
 */
async function handleTimelineFallback(
  supabase: ReturnType<typeof createClient>,
  query: TimelineQuery
) {
  const startTime = Date.now();
  const events: unknown[] = [];
  const limit = query.limit || 20;

  // Fetch calendar events
  if (!query.event_types || query.event_types.includes('calendar')) {
    let calQuery = supabase
      .from('calendar_entries')
      .select(
        'id, entry_type, title_en, title_ar, description_en, description_ar, event_date, event_time, status, created_at, created_by'
      )
      .eq('dossier_id', query.dossier_id)
      .order('event_date', { ascending: false })
      .limit(limit);

    if (query.cursor) {
      calQuery = calQuery.lt('event_date', query.cursor);
    }
    if (query.date_from) {
      calQuery = calQuery.gte('event_date', query.date_from);
    }
    if (query.date_to) {
      calQuery = calQuery.lte('event_date', query.date_to);
    }

    const { data: calEvents } = await calQuery;
    if (calEvents) {
      events.push(
        ...calEvents.map((e) => ({
          id: `calendar-${e.id}`,
          event_key: `calendar_entries-${e.id}`,
          source_table: 'calendar_entries',
          source_id: e.id,
          event_type: 'calendar',
          title_en: e.title_en,
          title_ar: e.title_ar,
          description_en: e.description_en,
          description_ar: e.description_ar,
          event_date: e.event_time ? `${e.event_date}T${e.event_time}` : `${e.event_date}T00:00:00`,
          priority: 'medium',
          status: e.status,
          metadata: { icon: 'Calendar', color: 'blue' },
          created_at: e.created_at,
          created_by: e.created_by,
        }))
      );
    }
  }

  // Sort by date
  events.sort(
    (a: any, b: any) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  const paginatedEvents = events.slice(0, limit);
  const hasMore = events.length > limit;
  const nextCursor =
    hasMore && paginatedEvents.length > 0
      ? (paginatedEvents[paginatedEvents.length - 1] as any).event_date
      : undefined;

  const queryTime = Date.now() - startTime;

  return {
    events: paginatedEvents,
    next_cursor: nextCursor,
    has_more: hasMore,
    total_count: paginatedEvents.length,
    source: 'fallback',
    query_time_ms: queryTime,
  };
}

/**
 * Handle relationship graph query using optimized read model
 */
async function handleGraphQuery(supabase: ReturnType<typeof createClient>, query: GraphQuery) {
  const startTime = Date.now();

  if (!query.dossier_id) {
    throw new Error('dossier_id is required');
  }

  // Get starting dossier info
  const { data: startDossier, error: dossierError } = await supabase
    .from('dossiers')
    .select('id, type, name_en, name_ar, status')
    .eq('id', query.dossier_id)
    .single();

  if (dossierError || !startDossier) {
    throw new Error('Dossier not found');
  }

  // Try optimized read model
  const { data: graphData, error: rmError } = await supabase.rpc(
    'read_models.get_relationship_graph',
    {
      p_dossier_id: query.dossier_id,
      p_relationship_types: query.relationship_types || null,
      p_max_depth: query.max_depth || 2,
      p_include_inactive: query.include_inactive || false,
    }
  );

  // If read model fails, use direct graph traversal
  if (rmError) {
    console.warn('Graph read model fallback:', rmError.message);
    return await handleGraphFallback(supabase, query, startDossier);
  }

  // Build nodes and edges from graph data
  const nodesMap = new Map();
  const edges: unknown[] = [];

  // Add starting node
  nodesMap.set(query.dossier_id, {
    id: query.dossier_id,
    type: startDossier.type,
    name_en: startDossier.name_en,
    name_ar: startDossier.name_ar,
    status: startDossier.status,
    depth: 0,
  });

  // Process graph results
  (graphData || []).forEach((row: any) => {
    if (!nodesMap.has(row.node_id)) {
      nodesMap.set(row.node_id, {
        id: row.node_id,
        type: row.node_type,
        name_en: row.name_en,
        name_ar: row.name_ar,
        status: row.status,
        depth: row.depth,
      });
    }

    // Build edges from path
    if (row.path && row.path.length > 1 && row.relationship_types) {
      for (let i = 0; i < row.path.length - 1; i++) {
        const sourceId = row.path[i];
        const targetId = row.path[i + 1];
        const relType = row.relationship_types[i];

        const edgeKey = `${sourceId}-${targetId}-${relType}`;
        if (
          !edges.some(
            (e: any) => `${e.source_id}-${e.target_id}-${e.relationship_type}` === edgeKey
          )
        ) {
          edges.push({
            source_id: sourceId,
            target_id: targetId,
            relationship_type: relType,
          });
        }
      }
    }
  });

  const nodes = Array.from(nodesMap.values());
  const queryTime = Date.now() - startTime;

  return {
    start_dossier_id: query.dossier_id,
    start_dossier: startDossier,
    max_depth: query.max_depth || 2,
    nodes,
    edges,
    stats: {
      node_count: nodes.length,
      edge_count: edges.length,
      max_degree: Math.max(...nodes.map((n: any) => n.depth), 0),
      query_time_ms: queryTime,
    },
    source: 'read_model',
  };
}

/**
 * Fallback graph query using original RPC
 */
async function handleGraphFallback(
  supabase: ReturnType<typeof createClient>,
  query: GraphQuery,
  startDossier: any
) {
  const startTime = Date.now();

  // Use original graph traversal RPC
  const { data: graphData, error: graphError } = await supabase.rpc('traverse_relationship_graph', {
    start_dossier_id: query.dossier_id,
    max_degrees: query.max_depth || 2,
    relationship_type_filter: query.relationship_types?.[0] || null,
  });

  if (graphError) {
    throw graphError;
  }

  // Transform results
  const nodesMap = new Map();
  const edges: unknown[] = [];

  nodesMap.set(query.dossier_id, {
    id: query.dossier_id,
    type: startDossier.type,
    name_en: startDossier.name_en,
    name_ar: startDossier.name_ar,
    status: startDossier.status,
    depth: 0,
  });

  (graphData || []).forEach((row: any) => {
    if (!nodesMap.has(row.dossier_id)) {
      nodesMap.set(row.dossier_id, {
        id: row.dossier_id,
        type: row.dossier_type,
        name_en: row.name_en,
        name_ar: row.name_ar,
        status: row.status,
        depth: row.degree,
      });
    }

    if (row.path && row.path.length > 1 && row.relationship_path) {
      for (let i = 0; i < row.path.length - 1; i++) {
        const sourceId = row.path[i];
        const targetId = row.path[i + 1];
        const relType = row.relationship_path[i];

        if (
          !edges.some(
            (e: any) =>
              e.source_id === sourceId &&
              e.target_id === targetId &&
              e.relationship_type === relType
          )
        ) {
          edges.push({
            source_id: sourceId,
            target_id: targetId,
            relationship_type: relType,
          });
        }
      }
    }
  });

  const nodes = Array.from(nodesMap.values());
  const queryTime = Date.now() - startTime;

  return {
    start_dossier_id: query.dossier_id,
    start_dossier: startDossier,
    max_depth: query.max_depth || 2,
    nodes,
    edges,
    stats: {
      node_count: nodes.length,
      edge_count: edges.length,
      max_degree: Math.max(...nodes.map((n: any) => n.depth), 0),
      query_time_ms: queryTime,
    },
    source: 'fallback',
  };
}

/**
 * Handle dossier summary query using pre-computed read model
 */
async function handleSummaryQuery(supabase: ReturnType<typeof createClient>, dossierId: string) {
  if (!dossierId) {
    throw new Error('dossier_id is required');
  }

  // Try read model first
  const { data: summary, error: rmError } = await supabase.rpc('read_models.get_dossier_summary', {
    p_dossier_id: dossierId,
  });

  if (rmError) {
    console.warn('Summary read model fallback:', rmError.message);
    // Fallback to direct query
    const { data: dossier, error } = await supabase
      .from('dossiers')
      .select('*')
      .eq('id', dossierId)
      .single();

    if (error || !dossier) {
      throw new Error('Dossier not found');
    }

    return {
      ...dossier,
      source: 'fallback',
    };
  }

  return {
    ...summary,
    source: 'read_model',
  };
}

/**
 * Handle dossier search using optimized full-text search
 */
async function handleSearchQuery(supabase: ReturnType<typeof createClient>, query: SearchQuery) {
  const startTime = Date.now();

  if (!query.query || query.query.trim().length === 0) {
    throw new Error('search query is required');
  }

  // Try read model first
  const { data: results, error: rmError } = await supabase.rpc('read_models.search_dossiers', {
    p_query: query.query,
    p_types: query.types || null,
    p_status: query.status || null,
    p_limit: query.limit || 20,
    p_offset: query.offset || 0,
  });

  if (rmError) {
    console.warn('Search read model fallback:', rmError.message);
    // Fallback to direct full-text search
    const { data: dossiers, error } = await supabase
      .from('dossiers')
      .select('id, type, name_en, name_ar, summary_en, summary_ar, status, created_at')
      .textSearch('search_vector', query.query)
      .limit(query.limit || 20);

    if (error) {
      throw error;
    }

    const queryTime = Date.now() - startTime;

    return {
      results: dossiers || [],
      total_count: dossiers?.length || 0,
      query_time_ms: queryTime,
      source: 'fallback',
    };
  }

  const queryTime = Date.now() - startTime;

  return {
    results: results || [],
    total_count: results?.length || 0,
    query_time_ms: queryTime,
    source: 'read_model',
  };
}

/**
 * Handle daily metrics query
 */
async function handleMetricsQuery(supabase: ReturnType<typeof createClient>, query: MetricsQuery) {
  let metricsQuery = supabase
    .from('read_models.daily_metrics')
    .select('*')
    .order('metric_date', { ascending: false })
    .limit(30);

  if (query.date_from) {
    metricsQuery = metricsQuery.gte('metric_date', query.date_from);
  }
  if (query.date_to) {
    metricsQuery = metricsQuery.lte('metric_date', query.date_to);
  }
  if (query.metric_type) {
    metricsQuery = metricsQuery.eq('metric_type', query.metric_type);
  }

  const { data: metrics, error } = await metricsQuery;

  if (error) {
    // Return empty metrics if table doesn't exist yet
    return {
      metrics: [],
      message: 'Metrics not yet populated',
    };
  }

  return {
    metrics: metrics || [],
  };
}
