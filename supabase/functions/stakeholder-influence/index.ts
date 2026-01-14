/**
 * Stakeholder Influence Analysis Edge Function
 * Feature: stakeholder-influence-visualization
 *
 * REST API for stakeholder influence analysis and visualization:
 * - GET /stakeholder-influence - List all stakeholders with influence scores
 * - GET /stakeholder-influence/:dossierId - Get detailed influence metrics for a stakeholder
 * - GET /stakeholder-influence/:dossierId/network - Get network data for visualization
 * - GET /stakeholder-influence/top-influencers - Get top influencers by score
 * - GET /stakeholder-influence/key-connectors - Identify bridge stakeholders
 * - GET /stakeholder-influence/clusters - Get network clusters
 * - GET /stakeholder-influence/statistics - Get network-wide statistics
 * - POST /stakeholder-influence/calculate - Trigger influence score calculation
 * - POST /stakeholder-influence/report - Generate an influence report
 * - GET /stakeholder-influence/reports - List generated reports
 * - GET /stakeholder-influence/reports/:reportId - Get a specific report
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// ============================================================================
// Types
// ============================================================================

interface StakeholderInfluenceResponse {
  dossier_id: string;
  name_en: string;
  name_ar: string;
  dossier_type: string;
  influence_score: number;
  influence_tier: string;
  stakeholder_role: string;
  metrics: {
    degree_centrality: number;
    betweenness_centrality: number;
    closeness_centrality: number;
    eigenvector_centrality: number;
    engagement_frequency: number;
    engagement_reach: number;
    avg_relationship_health: number;
    strong_relationships: number;
    weak_relationships: number;
  };
  cluster: {
    id: number | null;
    name_en: string;
    name_ar: string;
    role: string | null;
  };
  calculated_at: string;
}

interface NetworkNode {
  id: string;
  name_en: string;
  name_ar: string;
  type: string;
  influence_score: number;
  influence_tier: string;
  role: string;
  cluster_id: number | null;
  degree: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  relationship_type: string;
  health_score: number | null;
  weight: number;
}

interface NetworkVisualizationData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  statistics: {
    total_nodes: number;
    total_edges: number;
    avg_connections: number;
    density: number;
  };
}

interface ClusterResponse {
  id: number;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  cluster_type: string;
  member_count: number;
  avg_influence_score: number | null;
  leader: {
    id: string;
    name_en: string;
    name_ar: string;
  } | null;
}

interface ReportResponse {
  id: string;
  title_en: string;
  title_ar: string;
  description_en: string | null;
  description_ar: string | null;
  report_type: string;
  status: string;
  report_data: Record<string, unknown>;
  key_findings: unknown[];
  recommendations: unknown[];
  generated_at: string;
  period_start: string | null;
  period_end: string | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

function errorResponse(
  code: string,
  message_en: string,
  message_ar: string,
  status: number,
  details?: unknown
) {
  return new Response(
    JSON.stringify({
      error: { code, message_en, message_ar, details },
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

function successResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getAuthUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { user: null, error: 'Missing authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: error?.message || 'Invalid user session' };
  }

  return { user, error: null };
}

function getInfluenceTierLabel(tier: string): { en: string; ar: string } {
  const labels: Record<string, { en: string; ar: string }> = {
    key_influencer: { en: 'Key Influencer', ar: 'مؤثر رئيسي' },
    high_influence: { en: 'High Influence', ar: 'تأثير عالي' },
    moderate_influence: { en: 'Moderate Influence', ar: 'تأثير متوسط' },
    low_influence: { en: 'Low Influence', ar: 'تأثير منخفض' },
    peripheral: { en: 'Peripheral', ar: 'هامشي' },
  };
  return labels[tier] || { en: tier, ar: tier };
}

function getStakeholderRoleLabel(role: string): { en: string; ar: string } {
  const labels: Record<string, { en: string; ar: string }> = {
    hub: { en: 'Hub', ar: 'محور' },
    bridge: { en: 'Bridge', ar: 'جسر' },
    gatekeeper: { en: 'Gatekeeper', ar: 'حارس بوابة' },
    peripheral: { en: 'Peripheral', ar: 'هامشي' },
    isolate: { en: 'Isolate', ar: 'معزول' },
  };
  return labels[role] || { en: role, ar: role };
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') || '' },
        },
      }
    );

    // Authenticate
    const { user, error: authError } = await getAuthUser(req, supabase);
    if (authError || !user) {
      return errorResponse('UNAUTHORIZED', authError || 'Unauthorized', 'غير مصرح', 401);
    }

    // Parse URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const secondPart = pathParts[1];
    const thirdPart = pathParts[2];

    // Route handling
    switch (req.method) {
      case 'GET': {
        // GET /stakeholder-influence/statistics - Network-wide statistics
        if (secondPart === 'statistics') {
          const { data, error } = await supabase.rpc('get_network_statistics');

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          const stats = data?.[0] || {
            total_stakeholders: 0,
            total_relationships: 0,
            avg_connections_per_stakeholder: 0,
            key_influencer_count: 0,
            cluster_count: 0,
            avg_influence_score: 0,
            network_density: 0,
          };

          return successResponse({
            total_stakeholders: stats.total_stakeholders,
            total_relationships: stats.total_relationships,
            avg_connections: parseFloat(stats.avg_connections_per_stakeholder?.toFixed(2) || '0'),
            key_influencers: stats.key_influencer_count,
            clusters: stats.cluster_count,
            avg_influence_score: parseFloat(stats.avg_influence_score?.toFixed(1) || '0'),
            network_density: parseFloat(stats.network_density?.toFixed(4) || '0'),
          });
        }

        // GET /stakeholder-influence/top-influencers - Top influencers
        if (secondPart === 'top-influencers') {
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
          const dossierType = url.searchParams.get('type') || null;
          const tier = url.searchParams.get('tier') || null;

          const { data, error } = await supabase.rpc('get_top_influencers', {
            dossier_type_filter: dossierType,
            tier_filter: tier,
            limit_count: limit,
          });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          const influencers = (data || []).map((d: Record<string, unknown>) => ({
            dossier_id: d.dossier_id,
            name_en: d.name_en,
            name_ar: d.name_ar,
            dossier_type: d.dossier_type,
            influence_tier: d.influence_tier,
            influence_tier_label: getInfluenceTierLabel(d.influence_tier as string),
            stakeholder_role: d.stakeholder_role,
            stakeholder_role_label: getStakeholderRoleLabel(d.stakeholder_role as string),
            overall_score: d.overall_score,
            degree_centrality: d.degree_centrality,
            engagement_score: d.engagement_score,
            relationship_health: d.relationship_health,
          }));

          return successResponse({
            data: influencers,
            total: influencers.length,
          });
        }

        // GET /stakeholder-influence/key-connectors - Bridge stakeholders
        if (secondPart === 'key-connectors') {
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
          const minScore = parseInt(url.searchParams.get('min_score') || '50');

          const { data, error } = await supabase.rpc('identify_key_connectors', {
            min_bridge_score: minScore,
            limit_count: limit,
          });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          const connectors = (data || []).map((d: Record<string, unknown>) => ({
            dossier_id: d.dossier_id,
            name_en: d.name_en,
            name_ar: d.name_ar,
            dossier_type: d.dossier_type,
            groups_connected: d.groups_connected,
            bridge_score: d.bridge_score,
            influence_score: d.influence_score,
          }));

          return successResponse({
            data: connectors,
            total: connectors.length,
          });
        }

        // GET /stakeholder-influence/clusters - Network clusters
        if (secondPart === 'clusters') {
          const { data, error } = await supabase
            .from('network_clusters')
            .select(
              `
              *,
              leader:leader_dossier_id(id, name_en, name_ar)
            `
            )
            .order('member_count', { ascending: false });

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          const clusters: ClusterResponse[] = (data || []).map((c) => ({
            id: c.id,
            name_en: c.cluster_name_en,
            name_ar: c.cluster_name_ar,
            description_en: c.description_en,
            description_ar: c.description_ar,
            cluster_type: c.cluster_type,
            member_count: c.member_count,
            avg_influence_score: c.avg_influence_score,
            leader: c.leader
              ? {
                  id: c.leader.id,
                  name_en: c.leader.name_en,
                  name_ar: c.leader.name_ar,
                }
              : null,
          }));

          return successResponse({
            data: clusters,
            total: clusters.length,
          });
        }

        // GET /stakeholder-influence/reports - List reports
        if (secondPart === 'reports' && !thirdPart) {
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
          const offset = parseInt(url.searchParams.get('offset') || '0');
          const reportType = url.searchParams.get('type');

          let query = supabase
            .from('influence_reports')
            .select('*')
            .order('generated_at', { ascending: false });

          if (reportType) {
            query = query.eq('report_type', reportType);
          }

          const { data, error } = await query.range(offset, offset + limit - 1);

          if (error) {
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          return successResponse({
            data: data || [],
            pagination: { limit, offset, has_more: (data?.length || 0) === limit },
          });
        }

        // GET /stakeholder-influence/reports/:reportId - Get specific report
        if (secondPart === 'reports' && thirdPart) {
          const { data, error } = await supabase
            .from('influence_reports')
            .select('*')
            .eq('id', thirdPart)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              return errorResponse('NOT_FOUND', 'Report not found', 'التقرير غير موجود', 404);
            }
            return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
          }

          return successResponse(data);
        }

        // GET /stakeholder-influence/:dossierId/network - Get network visualization data
        if (secondPart && thirdPart === 'network') {
          const dossierId = secondPart;
          const degrees = Math.min(parseInt(url.searchParams.get('degrees') || '2'), 3);

          // Get graph data using traverse function
          const { data: graphData, error: graphError } = await supabase.rpc(
            'traverse_relationship_graph',
            {
              start_dossier_id: dossierId,
              max_degrees: degrees,
              relationship_type_filter: null,
            }
          );

          if (graphError) {
            return errorResponse(
              'QUERY_ERROR',
              graphError.message,
              'خطأ في الاستعلام',
              500,
              graphError
            );
          }

          // Get the starting dossier
          const { data: startDossier } = await supabase
            .from('dossiers')
            .select('id, name_en, name_ar, type')
            .eq('id', dossierId)
            .single();

          // Get influence scores for all nodes
          const nodeIds = [
            dossierId,
            ...(graphData || []).map((n: Record<string, unknown>) => n.dossier_id),
          ];
          const { data: influenceData } = await supabase
            .from('stakeholder_influence_scores')
            .select('*')
            .in('dossier_id', nodeIds);

          const influenceMap = new Map(
            (influenceData || []).map((i: Record<string, unknown>) => [i.dossier_id, i])
          );

          // Build nodes
          const nodes: NetworkNode[] = [];

          // Add starting node
          if (startDossier) {
            const startInfluence = influenceMap.get(dossierId) as
              | Record<string, unknown>
              | undefined;
            nodes.push({
              id: dossierId,
              name_en: startDossier.name_en,
              name_ar: startDossier.name_ar,
              type: startDossier.type,
              influence_score: (startInfluence?.overall_influence_score as number) || 0,
              influence_tier: (startInfluence?.influence_tier as string) || 'peripheral',
              role: (startInfluence?.stakeholder_role as string) || 'peripheral',
              cluster_id: (startInfluence?.cluster_id as number) || null,
              degree: 0,
            });
          }

          // Add connected nodes
          for (const node of graphData || []) {
            const nodeInfluence = influenceMap.get(node.dossier_id as string) as
              | Record<string, unknown>
              | undefined;
            nodes.push({
              id: node.dossier_id as string,
              name_en: node.name_en as string,
              name_ar: node.name_ar as string,
              type: node.dossier_type as string,
              influence_score: (nodeInfluence?.overall_influence_score as number) || 0,
              influence_tier: (nodeInfluence?.influence_tier as string) || 'peripheral',
              role: (nodeInfluence?.stakeholder_role as string) || 'peripheral',
              cluster_id: (nodeInfluence?.cluster_id as number) || null,
              degree: node.degree as number,
            });
          }

          // Get edges (relationships between nodes)
          const { data: relationships } = await supabase
            .from('dossier_relationships')
            .select(
              `
              id,
              source_dossier_id,
              target_dossier_id,
              relationship_type,
              relationship_health_scores(overall_score)
            `
            )
            .in('source_dossier_id', nodeIds)
            .in('target_dossier_id', nodeIds)
            .eq('status', 'active');

          const edges: NetworkEdge[] = (relationships || []).map((r) => ({
            source: r.source_dossier_id,
            target: r.target_dossier_id,
            relationship_type: r.relationship_type,
            health_score: r.relationship_health_scores?.[0]?.overall_score || null,
            weight: r.relationship_health_scores?.[0]?.overall_score
              ? r.relationship_health_scores[0].overall_score / 100
              : 0.5,
          }));

          const networkData: NetworkVisualizationData = {
            nodes,
            edges,
            statistics: {
              total_nodes: nodes.length,
              total_edges: edges.length,
              avg_connections: nodes.length > 0 ? (edges.length * 2) / nodes.length : 0,
              density:
                nodes.length > 1 ? (edges.length * 2) / (nodes.length * (nodes.length - 1)) : 0,
            },
          };

          return successResponse(networkData);
        }

        // GET /stakeholder-influence/:dossierId - Get detailed influence for specific stakeholder
        if (secondPart && !thirdPart) {
          const dossierId = secondPart;

          // Get influence metrics
          const { data: metricsData, error: metricsError } = await supabase.rpc(
            'get_stakeholder_influence_metrics',
            {
              target_dossier_id: dossierId,
              period_days: 365,
            }
          );

          if (metricsError) {
            return errorResponse(
              'QUERY_ERROR',
              metricsError.message,
              'خطأ في الاستعلام',
              500,
              metricsError
            );
          }

          const metrics = metricsData?.[0];
          if (!metrics) {
            return errorResponse(
              'NOT_FOUND',
              'Stakeholder not found',
              'صاحب المصلحة غير موجود',
              404
            );
          }

          // Get stored influence score
          const { data: influenceScore } = await supabase
            .from('stakeholder_influence_scores')
            .select(
              `
              *,
              cluster:cluster_id(id, cluster_name_en, cluster_name_ar)
            `
            )
            .eq('dossier_id', dossierId)
            .maybeSingle();

          const response: StakeholderInfluenceResponse = {
            dossier_id: metrics.dossier_id,
            name_en: metrics.name_en,
            name_ar: metrics.name_ar,
            dossier_type: metrics.dossier_type,
            influence_score: influenceScore?.overall_influence_score || 0,
            influence_tier: influenceScore?.influence_tier || 'peripheral',
            stakeholder_role: influenceScore?.stakeholder_role || 'peripheral',
            metrics: {
              degree_centrality: metrics.degree_centrality_score || 0,
              betweenness_centrality: influenceScore?.betweenness_centrality_score || 0,
              closeness_centrality: influenceScore?.closeness_centrality_score || 0,
              eigenvector_centrality: influenceScore?.eigenvector_centrality_score || 0,
              engagement_frequency: metrics.engagement_frequency_score || 0,
              engagement_reach: influenceScore?.engagement_reach_score || 0,
              avg_relationship_health: Math.round(metrics.avg_relationship_health) || 0,
              strong_relationships: metrics.strong_relationship_count || 0,
              weak_relationships: influenceScore?.weak_relationships_count || 0,
            },
            cluster: {
              id: influenceScore?.cluster_id || null,
              name_en: influenceScore?.cluster?.cluster_name_en || 'Unclustered',
              name_ar: influenceScore?.cluster?.cluster_name_ar || 'غير مجمع',
              role: influenceScore?.cluster_role || null,
            },
            calculated_at: influenceScore?.calculated_at || new Date().toISOString(),
          };

          return successResponse({
            ...response,
            influence_tier_label: getInfluenceTierLabel(response.influence_tier),
            stakeholder_role_label: getStakeholderRoleLabel(response.stakeholder_role),
            raw_metrics: {
              direct_connections: metrics.direct_connections,
              two_hop_connections: metrics.two_hop_connections,
              total_engagements: metrics.total_engagements,
              unique_engagement_partners: metrics.unique_engagement_partners,
            },
          });
        }

        // GET /stakeholder-influence - List all stakeholders with influence scores
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const sortBy = url.searchParams.get('sort_by') || 'influence_score';
        const sortOrder = url.searchParams.get('sort_order') || 'desc';
        const dossierType = url.searchParams.get('type');
        const minScore = url.searchParams.get('min_score');

        let query = supabase.from('stakeholder_network_summary').select('*');

        if (dossierType) {
          query = query.eq('dossier_type', dossierType);
        }
        if (minScore) {
          query = query.gte('influence_score', parseInt(minScore));
        }

        const validSortColumns = [
          'influence_score',
          'degree_centrality',
          'betweenness_centrality',
          'engagement_score',
          'avg_health',
        ];
        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'influence_score';

        const { data, error } = await query
          .order(sortColumn, { ascending: sortOrder === 'asc' })
          .range(offset, offset + limit - 1);

        if (error) {
          return errorResponse('QUERY_ERROR', error.message, 'خطأ في الاستعلام', 500, error);
        }

        const stakeholders = (data || []).map((d) => ({
          dossier_id: d.dossier_id,
          name_en: d.name_en,
          name_ar: d.name_ar,
          dossier_type: d.dossier_type,
          influence_score: d.influence_score,
          influence_tier: d.influence_tier,
          influence_tier_label: getInfluenceTierLabel(d.influence_tier),
          stakeholder_role: d.stakeholder_role,
          stakeholder_role_label: getStakeholderRoleLabel(d.stakeholder_role),
          degree_centrality: d.degree_centrality,
          betweenness_centrality: d.betweenness_centrality,
          engagement_score: d.engagement_score,
          avg_health: d.avg_health,
          strong_relationships: d.strong_relationships,
          cluster_id: d.cluster_id,
          cluster_name_en: d.cluster_name_en,
          cluster_name_ar: d.cluster_name_ar,
        }));

        return successResponse({
          data: stakeholders,
          pagination: { limit, offset, has_more: (data?.length || 0) === limit },
        });
      }

      case 'POST': {
        // POST /stakeholder-influence/calculate - Calculate influence scores
        if (secondPart === 'calculate') {
          // Use service role client for calculation
          const serviceClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          );

          // Get all active dossiers
          const { data: dossiers, error: dossiersError } = await serviceClient
            .from('dossiers')
            .select('id')
            .eq('status', 'active');

          if (dossiersError) {
            return errorResponse(
              'QUERY_ERROR',
              dossiersError.message,
              'خطأ في الاستعلام',
              500,
              dossiersError
            );
          }

          let updatedCount = 0;

          // Calculate influence for each dossier
          for (const dossier of dossiers || []) {
            try {
              // Get metrics
              const { data: metricsData } = await serviceClient.rpc(
                'get_stakeholder_influence_metrics',
                {
                  target_dossier_id: dossier.id,
                  period_days: 365,
                }
              );

              const metrics = metricsData?.[0];
              if (!metrics) continue;

              // Calculate overall influence score (weighted composite)
              const degreeCentrality = metrics.degree_centrality_score || 0;
              const engagementFrequency = metrics.engagement_frequency_score || 0;
              const avgHealth = Math.round(metrics.avg_relationship_health) || 0;
              const strongRelCount = metrics.strong_relationship_count || 0;

              // Calculate betweenness approximation based on two-hop reach
              const twoHopConnections = metrics.two_hop_connections || 0;
              const directConnections = metrics.direct_connections || 0;
              const betweenness =
                directConnections > 0
                  ? Math.min(100, Math.round((twoHopConnections / directConnections) * 20))
                  : 0;

              // Calculate engagement reach based on unique partners
              const engagementReach =
                metrics.unique_engagement_partners > 0
                  ? Math.min(100, Math.round(metrics.unique_engagement_partners * 5))
                  : 0;

              // Weighted overall score
              const overallScore = Math.round(
                degreeCentrality * 0.25 +
                  betweenness * 0.2 +
                  engagementFrequency * 0.2 +
                  engagementReach * 0.15 +
                  avgHealth * 0.2
              );

              // Determine tier
              let tier: string;
              if (overallScore >= 80) tier = 'key_influencer';
              else if (overallScore >= 60) tier = 'high_influence';
              else if (overallScore >= 40) tier = 'moderate_influence';
              else if (overallScore >= 20) tier = 'low_influence';
              else tier = 'peripheral';

              // Determine role
              let role: string;
              if (directConnections === 0) role = 'isolate';
              else if (betweenness >= 60) role = 'bridge';
              else if (degreeCentrality >= 70) role = 'hub';
              else if (betweenness >= 40 && degreeCentrality < 50) role = 'gatekeeper';
              else role = 'peripheral';

              // Upsert influence score
              await serviceClient.from('stakeholder_influence_scores').upsert(
                {
                  dossier_id: dossier.id,
                  degree_centrality_score: degreeCentrality,
                  betweenness_centrality_score: betweenness,
                  closeness_centrality_score: 0, // Would need full graph for this
                  eigenvector_centrality_score: 0, // Would need full graph for this
                  engagement_frequency_score: engagementFrequency,
                  engagement_reach_score: engagementReach,
                  avg_relationship_health: avgHealth,
                  strong_relationships_count: strongRelCount,
                  weak_relationships_count: directConnections - strongRelCount,
                  overall_influence_score: overallScore,
                  influence_tier: tier,
                  stakeholder_role: role,
                  raw_metrics: {
                    direct_connections: directConnections,
                    two_hop_connections: twoHopConnections,
                    total_engagements: metrics.total_engagements,
                    unique_engagement_partners: metrics.unique_engagement_partners,
                  },
                  calculated_at: new Date().toISOString(),
                  period_start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
                  period_end: new Date().toISOString(),
                },
                { onConflict: 'dossier_id' }
              );

              // Store history
              await serviceClient.from('stakeholder_influence_history').insert({
                dossier_id: dossier.id,
                overall_influence_score: overallScore,
                degree_centrality_score: degreeCentrality,
                betweenness_centrality_score: betweenness,
                engagement_frequency_score: engagementFrequency,
                avg_relationship_health: avgHealth,
                influence_tier: tier,
                stakeholder_role: role,
                period_start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
                period_end: new Date().toISOString(),
              });

              updatedCount++;
            } catch {
              // Continue with other dossiers if one fails
              continue;
            }
          }

          // Refresh materialized view
          await serviceClient.rpc('refresh_stakeholder_network_summary');

          return successResponse({
            message_en: 'Influence scores calculated successfully',
            message_ar: 'تم حساب درجات التأثير بنجاح',
            stakeholders_updated: updatedCount,
          });
        }

        // POST /stakeholder-influence/report - Generate a report
        if (secondPart === 'report') {
          const body = await req.json();
          const {
            report_type,
            title_en,
            title_ar,
            description_en,
            description_ar,
            scope_dossier_ids,
            scope_dossier_types,
            period_start,
            period_end,
          } = body;

          if (!report_type || !title_en || !title_ar) {
            return errorResponse(
              'VALIDATION_ERROR',
              'Missing required fields: report_type, title_en, title_ar',
              'حقول مطلوبة مفقودة: report_type, title_en, title_ar',
              400
            );
          }

          // Build report data based on type
          let reportData: Record<string, unknown> = {};
          const keyFindings: unknown[] = [];
          const recommendations: unknown[] = [];

          // Get network statistics
          const { data: stats } = await supabase.rpc('get_network_statistics');
          const networkStats = stats?.[0] || {};

          // Get top influencers
          const { data: topInfluencers } = await supabase.rpc('get_top_influencers', {
            dossier_type_filter: null,
            tier_filter: null,
            limit_count: 10,
          });

          // Get key connectors
          const { data: keyConnectors } = await supabase.rpc('identify_key_connectors', {
            min_bridge_score: 40,
            limit_count: 10,
          });

          reportData = {
            network_statistics: networkStats,
            top_influencers: topInfluencers || [],
            key_connectors: keyConnectors || [],
            generated_at: new Date().toISOString(),
          };

          // Generate findings
          if (networkStats.key_influencer_count > 0) {
            keyFindings.push({
              en: `${networkStats.key_influencer_count} key influencers identified in the network`,
              ar: `تم تحديد ${networkStats.key_influencer_count} مؤثرين رئيسيين في الشبكة`,
            });
          }

          if (networkStats.network_density < 0.1) {
            keyFindings.push({
              en: 'Network density is low, indicating potential for more connections',
              ar: 'كثافة الشبكة منخفضة، مما يشير إلى إمكانية المزيد من الاتصالات',
            });
          }

          if ((keyConnectors?.length || 0) > 0) {
            keyFindings.push({
              en: `${keyConnectors?.length} bridge stakeholders identified connecting different groups`,
              ar: `تم تحديد ${keyConnectors?.length} من أصحاب المصلحة الجسريين الذين يربطون مجموعات مختلفة`,
            });
          }

          // Generate recommendations
          if (networkStats.network_density < 0.05) {
            recommendations.push({
              en: 'Consider organizing cross-group engagement events to increase network connectivity',
              ar: 'فكر في تنظيم فعاليات مشاركة عبر المجموعات لزيادة الاتصال بالشبكة',
            });
          }

          if ((topInfluencers?.length || 0) > 0) {
            recommendations.push({
              en: 'Prioritize engagement with top influencers for strategic initiatives',
              ar: 'أعطِ الأولوية للتفاعل مع أهم المؤثرين للمبادرات الاستراتيجية',
            });
          }

          // Insert report
          const { data: report, error: reportError } = await supabase
            .from('influence_reports')
            .insert({
              title_en,
              title_ar,
              description_en,
              description_ar,
              report_type,
              scope_dossier_ids: scope_dossier_ids || [],
              scope_dossier_types: scope_dossier_types || [],
              report_data: reportData,
              key_findings: keyFindings,
              recommendations,
              generated_by: user.id,
              period_start,
              period_end,
              status: 'final',
            })
            .select()
            .single();

          if (reportError) {
            return errorResponse(
              'INSERT_ERROR',
              reportError.message,
              'خطأ في إنشاء التقرير',
              500,
              reportError
            );
          }

          return successResponse(report, 201);
        }

        return errorResponse('NOT_FOUND', 'Endpoint not found', 'نقطة النهاية غير موجودة', 404);
      }

      default:
        return errorResponse(
          'METHOD_NOT_ALLOWED',
          'Method not allowed',
          'الطريقة غير مسموح بها',
          405
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      'حدث خطأ غير متوقع',
      500,
      { correlation_id: crypto.randomUUID() }
    );
  }
});
