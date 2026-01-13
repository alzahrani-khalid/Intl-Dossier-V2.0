/**
 * Advanced Graph Traversal Edge Function
 * Feature: relationship-graph-traversal
 *
 * Provides endpoints for:
 * - Bidirectional N-degree traversal
 * - Shortest path finding
 * - All paths between entities
 * - Connected entities discovery
 * - Relationship chain pattern matching
 * - Common connections between entities
 * - Graph statistics
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface DossierReference {
  id: string;
  type: string;
  name_en: string;
  name_ar: string;
  status: string;
}

interface GraphNode {
  id: string;
  type: string;
  name_en: string;
  name_ar: string;
  status: string;
  degree: number;
  path: string[];
  relationship_path?: string[];
  direction_path?: string[];
}

interface GraphEdge {
  source_id: string;
  target_id: string;
  relationship_type: string;
  direction?: string;
}

interface PathResult {
  path: string[];
  relationship_path: string[];
  direction_path: string[];
  path_length: number;
  found?: boolean;
}

interface ChainResult {
  chain_position: number;
  dossier_id: string;
  dossier_type: string;
  name_en: string;
  name_ar: string;
  status: string;
  relationship_type: string | null;
  direction: string;
  full_path: string[];
}

interface CommonConnectionResult {
  dossier_id: string;
  dossier_type: string;
  name_en: string;
  name_ar: string;
  status: string;
  relationship_to_a: string;
  direction_to_a: string;
  relationship_to_b: string;
  direction_to_b: string;
}

interface GraphStats {
  total_nodes: number;
  total_edges: number;
  graph_density: number;
  avg_degree: number;
  max_degree: number;
  isolated_nodes: number;
  dossier_type_distribution: Record<string, number>;
}

function parseArrayParam(param: unknown): string[] | null {
  if (!param) return null;
  if (Array.isArray(param)) return param as string[];
  if (typeof param === 'string') {
    try {
      const parsed = JSON.parse(param);
      return Array.isArray(parsed) ? parsed : [param];
    } catch {
      return param.split(',').map((s) => s.trim());
    }
  }
  return null;
}

function parseBooleanArrayParam(param: unknown): boolean[] | null {
  if (!param) return null;
  if (Array.isArray(param)) return param.map(Boolean);
  if (typeof param === 'string') {
    try {
      const parsed = JSON.parse(param);
      return Array.isArray(parsed) ? parsed.map(Boolean) : null;
    } catch {
      return param.split(',').map((s) => s.trim().toLowerCase() === 'true');
    }
  }
  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
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

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Parse URL and operation
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    let urlOperation = pathParts[pathParts.length - 1] || 'traverse';

    // Get parameters from query string (GET) or body (POST)
    let params: Record<string, unknown> = {};
    let operation = urlOperation;

    if (req.method === 'GET') {
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      if (params.operation) {
        operation = params.operation as string;
      }
    } else {
      const body = await req.json();
      params = body;
      // For POST requests, operation can come from body
      if (body.operation) {
        operation = body.operation as string;
      }
    }

    // Normalize operation name (e.g., graph-traversal-advanced is the default endpoint)
    if (operation === 'graph-traversal-advanced') {
      operation = 'traverse';
    }

    let result: unknown;

    switch (operation) {
      case 'traverse': {
        // Bidirectional N-degree traversal
        const startDossierId = params.startDossierId || params.start_dossier_id;
        const maxDegrees = parseInt(params.maxDegrees || params.max_degrees || '2', 10);
        const relationshipTypes = parseArrayParam(
          params.relationshipTypes || params.relationship_types || null
        );
        const includeInactive =
          params.includeInactive === 'true' || params.include_inactive === 'true';
        const dossierTypeFilter = parseArrayParam(
          params.dossierTypeFilter || params.dossier_type_filter || null
        );

        if (!startDossierId) {
          return new Response(JSON.stringify({ error: 'Missing startDossierId parameter' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (maxDegrees < 1 || maxDegrees > 6) {
          return new Response(JSON.stringify({ error: 'maxDegrees must be between 1 and 6' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify starting dossier exists
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

        // Call bidirectional traversal function
        const { data: graphData, error: graphError } = await supabaseClient.rpc(
          'traverse_relationship_graph_bidirectional',
          {
            start_dossier_id: startDossierId,
            max_degrees: maxDegrees,
            relationship_types: relationshipTypes,
            include_inactive: includeInactive,
            dossier_type_filter: dossierTypeFilter,
          }
        );

        if (graphError) {
          console.error('Graph traversal error:', graphError);
          throw graphError;
        }

        // Transform to nodes and edges
        const nodesMap = new Map<string, GraphNode>();
        const edges: GraphEdge[] = [];

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
          if (!nodesMap.has(row.dossier_id)) {
            nodesMap.set(row.dossier_id, {
              id: row.dossier_id,
              type: row.dossier_type,
              name_en: row.name_en,
              name_ar: row.name_ar,
              status: row.status,
              degree: row.degree,
              path: row.path,
              relationship_path: row.relationship_path,
              direction_path: row.direction_path,
            });
          }

          // Build edges from path
          if (row.path && row.path.length > 1 && row.relationship_path) {
            for (let i = 0; i < row.path.length - 1; i++) {
              const sourceId = row.path[i];
              const targetId = row.path[i + 1];
              const relType = row.relationship_path[i];
              const direction = row.direction_path?.[i] || 'outgoing';

              const edgeKey = `${sourceId}-${targetId}-${relType}`;
              const reverseKey = `${targetId}-${sourceId}-${relType}`;

              const edgeExists = edges.some(
                (e) =>
                  `${e.source_id}-${e.target_id}-${e.relationship_type}` === edgeKey ||
                  `${e.source_id}-${e.target_id}-${e.relationship_type}` === reverseKey
              );

              if (!edgeExists) {
                edges.push({
                  source_id: direction === 'outgoing' ? sourceId : targetId,
                  target_id: direction === 'outgoing' ? targetId : sourceId,
                  relationship_type: relType,
                  direction,
                });
              }
            }
          }
        });

        const nodes = Array.from(nodesMap.values());
        const queryTime = Date.now() - startTime;

        result = {
          operation: 'traverse_bidirectional',
          start_dossier_id: startDossierId,
          start_dossier: startDossier,
          max_degrees: maxDegrees,
          relationship_type_filter: relationshipTypes || 'all',
          dossier_type_filter: dossierTypeFilter || 'all',
          include_inactive: includeInactive,
          nodes,
          edges,
          stats: {
            node_count: nodes.length,
            edge_count: edges.length,
            max_degree_found: nodes.length > 0 ? Math.max(...nodes.map((n) => n.degree)) : 0,
            query_time_ms: queryTime,
            performance_warning: queryTime > 2000 ? 'Query exceeded 2s performance target' : null,
          },
        };
        break;
      }

      case 'shortest-path': {
        // Find shortest path between two entities
        const sourceId = params.sourceId || params.source_id;
        const targetId = params.targetId || params.target_id;
        const maxDepth = parseInt(params.maxDepth || params.max_depth || '6', 10);
        const relationshipTypes = parseArrayParam(
          params.relationshipTypes || params.relationship_types || null
        );
        const includeInactive =
          params.includeInactive === 'true' || params.include_inactive === 'true';

        if (!sourceId || !targetId) {
          return new Response(JSON.stringify({ error: 'Missing sourceId or targetId parameter' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: pathData, error: pathError } = await supabaseClient.rpc(
          'find_shortest_path_bidirectional',
          {
            source_id: sourceId,
            target_id: targetId,
            max_depth: maxDepth,
            relationship_types: relationshipTypes,
            include_inactive: includeInactive,
          }
        );

        if (pathError) {
          console.error('Shortest path error:', pathError);
          throw pathError;
        }

        const pathResult = pathData?.[0] as PathResult | undefined;

        // Fetch dossier details for path nodes
        let pathDossiers: DossierReference[] = [];
        if (pathResult?.found && pathResult.path) {
          const { data: dossiers } = await supabaseClient
            .from('dossiers')
            .select('id, type, name_en, name_ar, status')
            .in('id', pathResult.path);
          pathDossiers = dossiers || [];
        }

        const queryTime = Date.now() - startTime;

        result = {
          operation: 'shortest_path',
          source_id: sourceId,
          target_id: targetId,
          max_depth: maxDepth,
          found: pathResult?.found || false,
          path: pathResult?.path || null,
          relationship_path: pathResult?.relationship_path || null,
          direction_path: pathResult?.direction_path || null,
          path_length: pathResult?.path_length ?? null,
          path_dossiers: pathDossiers,
          stats: {
            query_time_ms: queryTime,
          },
        };
        break;
      }

      case 'all-paths': {
        // Find all paths between two entities
        const sourceId = params.sourceId || params.source_id;
        const targetId = params.targetId || params.target_id;
        const maxDepth = parseInt(params.maxDepth || params.max_depth || '4', 10);
        const maxPaths = parseInt(params.maxPaths || params.max_paths || '10', 10);
        const relationshipTypes = parseArrayParam(
          params.relationshipTypes || params.relationship_types || null
        );
        const includeInactive =
          params.includeInactive === 'true' || params.include_inactive === 'true';

        if (!sourceId || !targetId) {
          return new Response(JSON.stringify({ error: 'Missing sourceId or targetId parameter' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: pathsData, error: pathsError } = await supabaseClient.rpc('find_all_paths', {
          source_id: sourceId,
          target_id: targetId,
          max_depth: maxDepth,
          max_paths: maxPaths,
          relationship_types: relationshipTypes,
          include_inactive: includeInactive,
        });

        if (pathsError) {
          console.error('All paths error:', pathsError);
          throw pathsError;
        }

        const queryTime = Date.now() - startTime;

        result = {
          operation: 'all_paths',
          source_id: sourceId,
          target_id: targetId,
          max_depth: maxDepth,
          max_paths: maxPaths,
          paths: pathsData || [],
          path_count: (pathsData || []).length,
          stats: {
            query_time_ms: queryTime,
          },
        };
        break;
      }

      case 'connected-entities': {
        // Find all connected entities
        const startDossierId = params.startDossierId || params.start_dossier_id;
        const maxEntities = parseInt(params.maxEntities || params.max_entities || '100', 10);
        const relationshipTypes = parseArrayParam(
          params.relationshipTypes || params.relationship_types || null
        );
        const includeInactive =
          params.includeInactive === 'true' || params.include_inactive === 'true';
        const dossierTypeFilter = parseArrayParam(
          params.dossierTypeFilter || params.dossier_type_filter || null
        );

        if (!startDossierId) {
          return new Response(JSON.stringify({ error: 'Missing startDossierId parameter' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: connectedData, error: connectedError } = await supabaseClient.rpc(
          'find_connected_entities',
          {
            start_dossier_id: startDossierId,
            max_entities: maxEntities,
            relationship_types: relationshipTypes,
            include_inactive: includeInactive,
            dossier_type_filter: dossierTypeFilter,
          }
        );

        if (connectedError) {
          console.error('Connected entities error:', connectedError);
          throw connectedError;
        }

        const queryTime = Date.now() - startTime;

        result = {
          operation: 'connected_entities',
          start_dossier_id: startDossierId,
          max_entities: maxEntities,
          entities: connectedData || [],
          entity_count: (connectedData || []).length,
          stats: {
            query_time_ms: queryTime,
          },
        };
        break;
      }

      case 'relationship-chain': {
        // Find entities matching a relationship chain pattern
        const startDossierId = params.startDossierId || params.start_dossier_id;
        const relationshipChain = parseArrayParam(
          params.relationshipChain || params.relationship_chain || null
        );
        const bidirectionalChain = parseBooleanArrayParam(
          params.bidirectionalChain || params.bidirectional_chain || null
        );

        if (!startDossierId) {
          return new Response(JSON.stringify({ error: 'Missing startDossierId parameter' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!relationshipChain || relationshipChain.length === 0) {
          return new Response(JSON.stringify({ error: 'Missing relationshipChain parameter' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: chainData, error: chainError } = await supabaseClient.rpc(
          'get_relationship_chain',
          {
            start_dossier_id: startDossierId,
            relationship_chain: relationshipChain,
            bidirectional_chain: bidirectionalChain,
          }
        );

        if (chainError) {
          console.error('Relationship chain error:', chainError);
          throw chainError;
        }

        // Group results by chain path
        const chainResults = chainData as ChainResult[];
        const pathsMap = new Map<string, ChainResult[]>();

        chainResults.forEach((item) => {
          const pathKey = item.full_path.join(',');
          if (!pathsMap.has(pathKey)) {
            pathsMap.set(pathKey, []);
          }
          pathsMap.get(pathKey)!.push(item);
        });

        const chains = Array.from(pathsMap.values()).map((items) => ({
          path: items[0].full_path,
          entities: items.sort((a, b) => a.chain_position - b.chain_position),
        }));

        const queryTime = Date.now() - startTime;

        result = {
          operation: 'relationship_chain',
          start_dossier_id: startDossierId,
          relationship_chain: relationshipChain,
          bidirectional_chain: bidirectionalChain,
          chains,
          chain_count: chains.length,
          stats: {
            query_time_ms: queryTime,
          },
        };
        break;
      }

      case 'common-connections': {
        // Find common connections between two entities
        const dossierAId = params.dossierAId || params.dossier_a_id;
        const dossierBId = params.dossierBId || params.dossier_b_id;
        const relationshipTypes = parseArrayParam(
          params.relationshipTypes || params.relationship_types || null
        );
        const includeInactive =
          params.includeInactive === 'true' || params.include_inactive === 'true';

        if (!dossierAId || !dossierBId) {
          return new Response(
            JSON.stringify({ error: 'Missing dossierAId or dossierBId parameter' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: commonData, error: commonError } = await supabaseClient.rpc(
          'get_common_connections',
          {
            dossier_a_id: dossierAId,
            dossier_b_id: dossierBId,
            relationship_types: relationshipTypes,
            include_inactive: includeInactive,
          }
        );

        if (commonError) {
          console.error('Common connections error:', commonError);
          throw commonError;
        }

        const queryTime = Date.now() - startTime;

        result = {
          operation: 'common_connections',
          dossier_a_id: dossierAId,
          dossier_b_id: dossierBId,
          common_connections: commonData || [],
          connection_count: (commonData || []).length,
          stats: {
            query_time_ms: queryTime,
          },
        };
        break;
      }

      case 'statistics': {
        // Get graph statistics
        const startDossierId = params.startDossierId || params.start_dossier_id || null;
        const maxDegrees = parseInt(params.maxDegrees || params.max_degrees || '3', 10);
        const relationshipTypes = parseArrayParam(
          params.relationshipTypes || params.relationship_types || null
        );
        const includeInactive =
          params.includeInactive === 'true' || params.include_inactive === 'true';

        const { data: statsData, error: statsError } = await supabaseClient.rpc(
          'get_graph_statistics',
          {
            start_dossier_id: startDossierId,
            max_degrees: maxDegrees,
            relationship_types: relationshipTypes,
            include_inactive: includeInactive,
          }
        );

        if (statsError) {
          console.error('Graph statistics error:', statsError);
          throw statsError;
        }

        const stats = statsData?.[0] as GraphStats | undefined;
        const queryTime = Date.now() - startTime;

        result = {
          operation: 'statistics',
          start_dossier_id: startDossierId,
          max_degrees: maxDegrees,
          statistics: stats || null,
          stats: {
            query_time_ms: queryTime,
          },
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({
            error: `Unknown operation: ${operation}`,
            available_operations: [
              'traverse',
              'shortest-path',
              'all-paths',
              'connected-entities',
              'relationship-chain',
              'common-connections',
              'statistics',
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
    console.error('Error in graph-traversal-advanced:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
