import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};

interface DependencyNode {
  id: string;
  name_en: string;
  name_ar: string;
  type: string;
  status?: string;
  depth: number;
  dependency_type: string;
  is_source?: boolean;
}

interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  relationship_type: string;
  depth: number;
}

interface DependencyGraph {
  source_entity_id: string;
  source_entity_type: string;
  computed_at: string;
  max_depth_searched: number;
  actual_depth: number;
  total_nodes: number;
  total_edges: number;
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  stats: {
    direct_dependencies: number;
    transitive_dependencies: number;
    commitment_dependencies: number;
    by_type: Record<string, number>;
  };
}

interface ImpactAssessment {
  id: string;
  source_entity_id: string;
  source_entity_type: string;
  change_type: string;
  change_description_en: string;
  change_description_ar: string;
  overall_severity: string;
  total_affected_entities: number;
  assessment_summary_en: string;
  assessment_summary_ar: string;
  recommendations_en: string[];
  recommendations_ar: string[];
  status: string;
  assessed_at: string;
  affected_entities?: AffectedEntity[];
}

interface AffectedEntity {
  id: string;
  affected_entity_id: string;
  affected_entity_type: string;
  affected_entity_name_en: string;
  affected_entity_name_ar: string;
  dependency_type: string;
  depth: number;
  impact_category: string;
  impact_severity: string;
  impact_description_en: string;
  impact_description_ar: string;
  action_required: boolean;
  suggested_action_en?: string;
  suggested_action_ar?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean).slice(1); // Remove 'entity-dependencies' prefix

    // GET /entity-dependencies/graph/:entityId - Get dependency graph
    if (req.method === 'GET' && path[0] === 'graph' && path[1]) {
      const entityId = path[1];
      const maxDepth = parseInt(url.searchParams.get('max_depth') || '3');
      const includeTransitive = url.searchParams.get('include_transitive') !== 'false';

      const { data, error } = await supabase.rpc('compute_entity_dependencies', {
        p_entity_id: entityId,
        p_max_depth: maxDepth,
        p_include_transitive: includeTransitive,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ data: data as DependencyGraph }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /entity-dependencies/summary/:entityId - Get impact summary
    if (req.method === 'GET' && path[0] === 'summary' && path[1]) {
      const entityId = path[1];

      const { data, error } = await supabase.rpc('get_entity_impact_summary', {
        p_entity_id: entityId,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /entity-dependencies/assess - Create impact assessment
    if (req.method === 'POST' && path[0] === 'assess') {
      const body = await req.json();
      const { entity_id, change_type, changed_fields = [] } = body;

      if (!entity_id || !change_type) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: entity_id, change_type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const validChangeTypes = [
        'create',
        'update',
        'delete',
        'archive',
        'relationship_add',
        'relationship_remove',
        'status_change',
        'ownership_change',
      ];

      if (!validChangeTypes.includes(change_type)) {
        return new Response(
          JSON.stringify({
            error: `Invalid change_type. Must be one of: ${validChangeTypes.join(', ')}`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: assessmentId, error } = await supabase.rpc('calculate_impact_assessment', {
        p_entity_id: entity_id,
        p_change_type: change_type,
        p_changed_fields: changed_fields,
        p_user_id: user.id,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch the created assessment with affected entities
      const { data: assessment, error: fetchError } = await supabase
        .from('impact_assessments')
        .select(
          `
          *,
          affected_entities:impact_affected_entities(*)
        `
        )
        .eq('id', assessmentId)
        .single();

      if (fetchError) {
        return new Response(JSON.stringify({ error: fetchError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ data: assessment as ImpactAssessment }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /entity-dependencies/assessments - List assessments
    if (req.method === 'GET' && path[0] === 'assessments') {
      const entityId = url.searchParams.get('entity_id');
      const status = url.searchParams.get('status');
      const severity = url.searchParams.get('severity');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = supabase
        .from('impact_assessments')
        .select(
          `
          *,
          affected_entities:impact_affected_entities(count)
        `,
          { count: 'exact' }
        )
        .order('assessed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (entityId) {
        query = query.eq('source_entity_id', entityId);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (severity) {
        query = query.eq('overall_severity', severity);
      }

      const { data, error, count } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          data,
          pagination: {
            total: count,
            limit,
            offset,
            has_more: count !== null && offset + limit < count,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /entity-dependencies/assessments/:id - Get assessment details
    if (req.method === 'GET' && path[0] === 'assessments' && path[1]) {
      const assessmentId = path[1];

      const { data, error } = await supabase
        .from('impact_assessments')
        .select(
          `
          *,
          affected_entities:impact_affected_entities(*)
        `
        )
        .eq('id', assessmentId)
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.code === 'PGRST116' ? 404 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ data: data as ImpactAssessment }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT /entity-dependencies/assessments/:id - Update assessment status
    if (req.method === 'PUT' && path[0] === 'assessments' && path[1]) {
      const assessmentId = path[1];
      const body = await req.json();
      const { status, review_notes } = body;

      const validStatuses = ['pending', 'reviewed', 'acknowledged', 'actioned'];
      if (status && !validStatuses.includes(status)) {
        return new Response(
          JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updateData: Record<string, unknown> = {};
      if (status) {
        updateData.status = status;
        if (status === 'reviewed' || status === 'acknowledged' || status === 'actioned') {
          updateData.reviewed_by = user.id;
          updateData.reviewed_at = new Date().toISOString();
        }
      }
      if (review_notes !== undefined) {
        updateData.review_notes = review_notes;
      }

      const { data, error } = await supabase
        .from('impact_assessments')
        .update(updateData)
        .eq('id', assessmentId)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.code === 'PGRST116' ? 404 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /entity-dependencies/rules - List dependency rules
    if (req.method === 'GET' && path[0] === 'rules') {
      const { data, error } = await supabase
        .from('dependency_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Not found
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
