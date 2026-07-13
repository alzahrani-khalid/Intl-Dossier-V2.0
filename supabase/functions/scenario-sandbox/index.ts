/**
 * Scenario Sandbox Edge Function
 * Feature: Scenario Planning and What-If Analysis
 *
 * API endpoints for managing scenarios, variables, outcomes,
 * comparisons, and collaborators.
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

// ============================================================================
// Types
// ============================================================================

interface ScenarioRequest {
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  type: string;
  base_date?: string;
  projection_period_days?: number;
  tags?: string[];
}

interface VariableRequest {
  name_en: string;
  name_ar: string;
  change_type: string;
  target_entity_type: string;
  target_entity_id?: string;
  original_value?: unknown;
  modified_value: unknown;
  sort_order?: number;
}

interface OutcomeRequest {
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  impact_level?: string;
  probability_score?: number;
  affected_entity_type?: string;
  affected_entity_id?: string;
  projected_metrics?: Record<string, number>;
  is_positive?: boolean;
}

interface ComparisonRequest {
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  scenario_ids: string[];
  comparison_metrics?: string[];
}

interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message_en: string;
    message_ar: string;
  };
  pagination?: {
    limit: number;
    offset: number;
    has_more: boolean;
    total?: number;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function createErrorResponse(
  corsHeaders: Record<string, string>,
  code: string,
  messageEn: string,
  messageAr: string,
  status: number = 400
): Response {
  const response: ApiResponse = {
    error: {
      code,
      message_en: messageEn,
      message_ar: messageAr,
    },
  };
  return new Response(JSON.stringify(response), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function createSuccessResponse<T>(
  corsHeaders: Record<string, string>,
  data: T,
  pagination?: ApiResponse['pagination']
): Response {
  const response: ApiResponse<T> = { data };
  if (pagination) {
    response.pagination = pagination;
  }
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getSupabaseClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get('Authorization') || '';
  return createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: {
      headers: { Authorization: authHeader },
    },
  });
}

// ============================================================================
// Scenario Handlers
// ============================================================================

async function listScenarios(
  supabase: SupabaseClient,
  params: URLSearchParams,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const limit = parseInt(params.get('limit') || '20');
  const offset = parseInt(params.get('offset') || '0');
  const status = params.get('status');
  const type = params.get('type');
  const search = params.get('search');
  const sortBy = params.get('sort_by') || 'created_at';
  const sortOrder = params.get('sort_order') || 'desc';

  let query = supabase.from('scenarios').select('*', { count: 'exact' });

  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);
  if (search) {
    query = query.or(`title_en.ilike.%${search}%,title_ar.ilike.%${search}%`);
  }

  query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return createErrorResponse(corsHeaders,
      'FETCH_FAILED',
      'Failed to fetch scenarios',
      'فشل في جلب السيناريوهات',
      500
    );
  }

  return createSuccessResponse(corsHeaders, data, {
    limit,
    offset,
    has_more: (count || 0) > offset + limit,
    total: count || 0,
  });
}

async function getScenario(
  supabase: SupabaseClient,
  id: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Use the RPC function to get full scenario data
  const { data, error } = await supabase.rpc('get_scenario_full', { p_scenario_id: id });

  if (error) {
    return createErrorResponse(corsHeaders,
      'FETCH_FAILED',
      'Failed to fetch scenario',
      'فشل في جلب السيناريو',
      500
    );
  }

  if (!data || !data.scenario) {
    return createErrorResponse(corsHeaders, 'NOT_FOUND', 'Scenario not found', 'السيناريو غير موجود', 404);
  }

  return createSuccessResponse(corsHeaders, data);
}

async function createScenario(
  supabase: SupabaseClient,
  body: ScenarioRequest,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(corsHeaders, 'UNAUTHORIZED', 'Authentication required', 'المصادقة مطلوبة', 401);
  }

  const { data, error } = await supabase
    .from('scenarios')
    .insert({
      ...body,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return createErrorResponse(corsHeaders,
      'CREATE_FAILED',
      `Failed to create scenario: ${error.message}`,
      `فشل في إنشاء السيناريو: ${error.message}`,
      500
    );
  }

  return new Response(JSON.stringify({ data }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateScenario(
  supabase: SupabaseClient,
  id: string,
  body: Partial<ScenarioRequest>,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from('scenarios')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return createErrorResponse(corsHeaders,
      'UPDATE_FAILED',
      `Failed to update scenario: ${error.message}`,
      `فشل في تحديث السيناريو: ${error.message}`,
      500
    );
  }

  return createSuccessResponse(corsHeaders, data);
}

async function deleteScenario(
  supabase: SupabaseClient,
  id: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { error } = await supabase.from('scenarios').delete().eq('id', id);

  if (error) {
    return createErrorResponse(corsHeaders,
      'DELETE_FAILED',
      'Failed to delete scenario',
      'فشل في حذف السيناريو',
      500
    );
  }

  return createSuccessResponse(corsHeaders, {
    success: true,
    message_en: 'Scenario deleted successfully',
    message_ar: 'تم حذف السيناريو بنجاح',
  });
}

async function cloneScenario(
  supabase: SupabaseClient,
  id: string,
  body: { new_title_en: string; new_title_ar: string },
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase.rpc('clone_scenario', {
    p_scenario_id: id,
    p_new_title_en: body.new_title_en,
    p_new_title_ar: body.new_title_ar,
  });

  if (error) {
    return createErrorResponse(corsHeaders,
      'CLONE_FAILED',
      `Failed to clone scenario: ${error.message}`,
      `فشل في نسخ السيناريو: ${error.message}`,
      500
    );
  }

  // Fetch the cloned scenario
  const { data: clonedScenario } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', data)
    .single();

  return new Response(JSON.stringify({ data: clonedScenario }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// Variable Handlers
// ============================================================================

async function listVariables(
  supabase: SupabaseClient,
  scenarioId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from('scenario_variables')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('sort_order');

  if (error) {
    return createErrorResponse(corsHeaders,
      'FETCH_FAILED',
      'Failed to fetch variables',
      'فشل في جلب المتغيرات',
      500
    );
  }

  return createSuccessResponse(corsHeaders, data);
}

async function createVariable(
  supabase: SupabaseClient,
  scenarioId: string,
  body: VariableRequest,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from('scenario_variables')
    .insert({
      ...body,
      scenario_id: scenarioId,
    })
    .select()
    .single();

  if (error) {
    return createErrorResponse(corsHeaders,
      'CREATE_FAILED',
      `Failed to create variable: ${error.message}`,
      `فشل في إنشاء المتغير: ${error.message}`,
      500
    );
  }

  return new Response(JSON.stringify({ data }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateVariable(
  supabase: SupabaseClient,
  id: string,
  body: Partial<VariableRequest>,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from('scenario_variables')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return createErrorResponse(corsHeaders,
      'UPDATE_FAILED',
      'Failed to update variable',
      'فشل في تحديث المتغير',
      500
    );
  }

  return createSuccessResponse(corsHeaders, data);
}

async function deleteVariable(
  supabase: SupabaseClient,
  id: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { error } = await supabase.from('scenario_variables').delete().eq('id', id);

  if (error) {
    return createErrorResponse(corsHeaders,
      'DELETE_FAILED',
      'Failed to delete variable',
      'فشل في حذف المتغير',
      500
    );
  }

  return createSuccessResponse(corsHeaders, {
    success: true,
    message_en: 'Variable deleted successfully',
    message_ar: 'تم حذف المتغير بنجاح',
  });
}

// ============================================================================
// Outcome Handlers
// ============================================================================

async function listOutcomes(
  supabase: SupabaseClient,
  scenarioId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from('scenario_outcomes')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('created_at');

  if (error) {
    return createErrorResponse(corsHeaders,
      'FETCH_FAILED',
      'Failed to fetch outcomes',
      'فشل في جلب النتائج',
      500
    );
  }

  return createSuccessResponse(corsHeaders, data);
}

async function createOutcome(
  supabase: SupabaseClient,
  scenarioId: string,
  body: OutcomeRequest,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from('scenario_outcomes')
    .insert({
      ...body,
      scenario_id: scenarioId,
    })
    .select()
    .single();

  if (error) {
    return createErrorResponse(corsHeaders,
      'CREATE_FAILED',
      `Failed to create outcome: ${error.message}`,
      `فشل في إنشاء النتيجة: ${error.message}`,
      500
    );
  }

  return new Response(JSON.stringify({ data }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateOutcome(
  supabase: SupabaseClient,
  id: string,
  body: Partial<OutcomeRequest>,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from('scenario_outcomes')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return createErrorResponse(corsHeaders,
      'UPDATE_FAILED',
      'Failed to update outcome',
      'فشل في تحديث النتيجة',
      500
    );
  }

  return createSuccessResponse(corsHeaders, data);
}

async function deleteOutcome(
  supabase: SupabaseClient,
  id: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { error } = await supabase.from('scenario_outcomes').delete().eq('id', id);

  if (error) {
    return createErrorResponse(corsHeaders,
      'DELETE_FAILED',
      'Failed to delete outcome',
      'فشل في حذف النتيجة',
      500
    );
  }

  return createSuccessResponse(corsHeaders, {
    success: true,
    message_en: 'Outcome deleted successfully',
    message_ar: 'تم حذف النتيجة بنجاح',
  });
}

// ============================================================================
// Comparison Handlers
// ============================================================================

async function listComparisons(
  supabase: SupabaseClient,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from('scenario_comparisons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return createErrorResponse(corsHeaders,
      'FETCH_FAILED',
      'Failed to fetch comparisons',
      'فشل في جلب المقارنات',
      500
    );
  }

  return createSuccessResponse(corsHeaders, data);
}

async function createComparison(
  supabase: SupabaseClient,
  body: ComparisonRequest,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse(corsHeaders, 'UNAUTHORIZED', 'Authentication required', 'المصادقة مطلوبة', 401);
  }

  const { data, error } = await supabase
    .from('scenario_comparisons')
    .insert({
      ...body,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return createErrorResponse(corsHeaders,
      'CREATE_FAILED',
      `Failed to create comparison: ${error.message}`,
      `فشل في إنشاء المقارنة: ${error.message}`,
      500
    );
  }

  return new Response(JSON.stringify({ data }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getComparisonData(
  supabase: SupabaseClient,
  scenarioIds: string[],
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase.rpc('compare_scenarios', {
    p_scenario_ids: scenarioIds,
  });

  if (error) {
    return createErrorResponse(corsHeaders,
      'COMPARE_FAILED',
      `Failed to compare scenarios: ${error.message}`,
      `فشل في مقارنة السيناريوهات: ${error.message}`,
      500
    );
  }

  return createSuccessResponse(corsHeaders, data);
}

async function deleteComparison(
  supabase: SupabaseClient,
  id: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { error } = await supabase.from('scenario_comparisons').delete().eq('id', id);

  if (error) {
    return createErrorResponse(corsHeaders,
      'DELETE_FAILED',
      'Failed to delete comparison',
      'فشل في حذف المقارنة',
      500
    );
  }

  return createSuccessResponse(corsHeaders, {
    success: true,
    message_en: 'Comparison deleted successfully',
    message_ar: 'تم حذف المقارنة بنجاح',
  });
}

// ============================================================================
// Collaborator Handlers
// ============================================================================

async function addCollaborator(
  supabase: SupabaseClient,
  scenarioId: string,
  body: { user_id: string; role: string },
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data, error } = await supabase
    .from('scenario_collaborators')
    .insert({
      scenario_id: scenarioId,
      user_id: body.user_id,
      role: body.role,
    })
    .select()
    .single();

  if (error) {
    return createErrorResponse(corsHeaders,
      'ADD_FAILED',
      `Failed to add collaborator: ${error.message}`,
      `فشل في إضافة المتعاون: ${error.message}`,
      500
    );
  }

  return new Response(JSON.stringify({ data }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function removeCollaborator(
  supabase: SupabaseClient,
  scenarioId: string,
  userId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { error } = await supabase
    .from('scenario_collaborators')
    .delete()
    .eq('scenario_id', scenarioId)
    .eq('user_id', userId);

  if (error) {
    return createErrorResponse(corsHeaders,
      'REMOVE_FAILED',
      'Failed to remove collaborator',
      'فشل في إزالة المتعاون',
      500
    );
  }

  return createSuccessResponse(corsHeaders, {
    success: true,
    message_en: 'Collaborator removed successfully',
    message_ar: 'تم إزالة المتعاون بنجاح',
  });
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/scenario-sandbox', '');
  const supabase = getSupabaseClient(req);

  try {
    // Parse path segments
    const segments = path.split('/').filter(Boolean);

    // Routes
    // GET / - List scenarios
    // POST / - Create scenario
    // GET /:id - Get scenario with full data
    // PUT /:id - Update scenario
    // DELETE /:id - Delete scenario
    // POST /:id/clone - Clone scenario
    // GET /:id/variables - List variables
    // POST /:id/variables - Create variable
    // PUT /variables/:id - Update variable
    // DELETE /variables/:id - Delete variable
    // GET /:id/outcomes - List outcomes
    // POST /:id/outcomes - Create outcome
    // PUT /outcomes/:id - Update outcome
    // DELETE /outcomes/:id - Delete outcome
    // GET /comparisons - List comparisons
    // POST /comparisons - Create comparison
    // POST /comparisons/compare - Compare scenarios
    // DELETE /comparisons/:id - Delete comparison
    // POST /:id/collaborators - Add collaborator
    // DELETE /:id/collaborators/:userId - Remove collaborator

    if (segments.length === 0) {
      // List or create scenarios
      if (req.method === 'GET') {
        return await listScenarios(supabase, url.searchParams, corsHeaders);
      }
      if (req.method === 'POST') {
        const body = await req.json();
        return await createScenario(supabase, body, corsHeaders);
      }
    }

    // Comparison routes
    if (segments[0] === 'comparisons') {
      if (segments.length === 1) {
        if (req.method === 'GET') {
          return await listComparisons(supabase, corsHeaders);
        }
        if (req.method === 'POST') {
          const body = await req.json();
          return await createComparison(supabase, body, corsHeaders);
        }
      }
      if (segments[1] === 'compare' && req.method === 'POST') {
        const body = await req.json();
        return await getComparisonData(supabase, body.scenario_ids, corsHeaders);
      }
      if (segments.length === 2 && req.method === 'DELETE') {
        return await deleteComparison(supabase, segments[1], corsHeaders);
      }
    }

    // Variable routes
    if (segments[0] === 'variables') {
      const variableId = segments[1];
      if (req.method === 'PUT' || req.method === 'PATCH') {
        const body = await req.json();
        return await updateVariable(supabase, variableId, body, corsHeaders);
      }
      if (req.method === 'DELETE') {
        return await deleteVariable(supabase, variableId, corsHeaders);
      }
    }

    // Outcome routes
    if (segments[0] === 'outcomes') {
      const outcomeId = segments[1];
      if (req.method === 'PUT' || req.method === 'PATCH') {
        const body = await req.json();
        return await updateOutcome(supabase, outcomeId, body, corsHeaders);
      }
      if (req.method === 'DELETE') {
        return await deleteOutcome(supabase, outcomeId, corsHeaders);
      }
    }

    // Scenario routes with ID
    if (segments.length >= 1) {
      const scenarioId = segments[0];

      if (segments.length === 1) {
        if (req.method === 'GET') {
          return await getScenario(supabase, scenarioId, corsHeaders);
        }
        if (req.method === 'PUT' || req.method === 'PATCH') {
          const body = await req.json();
          return await updateScenario(supabase, scenarioId, body, corsHeaders);
        }
        if (req.method === 'DELETE') {
          return await deleteScenario(supabase, scenarioId, corsHeaders);
        }
      }

      if (segments[1] === 'clone' && req.method === 'POST') {
        const body = await req.json();
        return await cloneScenario(supabase, scenarioId, body, corsHeaders);
      }

      if (segments[1] === 'variables') {
        if (req.method === 'GET') {
          return await listVariables(supabase, scenarioId, corsHeaders);
        }
        if (req.method === 'POST') {
          const body = await req.json();
          return await createVariable(supabase, scenarioId, body, corsHeaders);
        }
      }

      if (segments[1] === 'outcomes') {
        if (req.method === 'GET') {
          return await listOutcomes(supabase, scenarioId, corsHeaders);
        }
        if (req.method === 'POST') {
          const body = await req.json();
          return await createOutcome(supabase, scenarioId, body, corsHeaders);
        }
      }

      if (segments[1] === 'collaborators') {
        if (req.method === 'POST') {
          const body = await req.json();
          return await addCollaborator(supabase, scenarioId, body, corsHeaders);
        }
        if (segments.length === 3 && req.method === 'DELETE') {
          return await removeCollaborator(supabase, scenarioId, segments[2], corsHeaders);
        }
      }
    }

    return createErrorResponse(corsHeaders, 'NOT_FOUND', 'Endpoint not found', 'نقطة النهاية غير موجودة', 404);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(corsHeaders,
      'INTERNAL_ERROR',
      `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
      `حدث خطأ غير متوقع: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
      500
    );
  }
});
