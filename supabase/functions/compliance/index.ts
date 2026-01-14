/**
 * Compliance Edge Function
 * Feature: compliance-rules-management
 *
 * Endpoints:
 * - GET /compliance/rules - List all compliance rules
 * - GET /compliance/rules/:id - Get a specific rule
 * - POST /compliance/rules - Create a new rule
 * - PATCH /compliance/rules/:id - Update a rule
 * - DELETE /compliance/rules/:id - Deactivate a rule
 * - GET /compliance/violations - List violations
 * - GET /compliance/violations/:id - Get a specific violation
 * - POST /compliance/check - Run compliance check for an entity
 * - POST /compliance/signoff - Sign off on a violation
 * - GET /compliance/summary/:entityType/:entityId - Get compliance summary
 * - GET /compliance/templates - Get rule templates
 * - POST /compliance/exemptions - Create an exemption
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface CheckComplianceRequest {
  entity_type: string;
  entity_id: string;
  action_type: string;
  context?: Record<string, unknown>;
}

interface SignoffRequest {
  violation_id: string;
  action: 'approve' | 'reject' | 'request_info' | 'escalate' | 'waive';
  justification: string;
  conditions?: string[];
  waiver_valid_until?: string;
}

interface CreateRuleRequest {
  rule_code: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  rule_type: string;
  severity?: string;
  entity_types?: string[];
  conditions: Record<string, unknown>;
  notification_template_en?: string;
  notification_template_ar?: string;
  remediation_instructions_en?: string;
  remediation_instructions_ar?: string;
  requires_signoff?: boolean;
  signoff_roles?: string[];
  signoff_deadline_hours?: number;
  auto_escalate_hours?: number;
  effective_from?: string;
  effective_to?: string;
  applies_to_regions?: string[];
  applies_to_categories?: string[];
  external_reference?: string;
  regulatory_source?: string;
}

interface CreateExemptionRequest {
  rule_id?: string;
  rule_code?: string;
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  reason: string;
  justification?: string;
  valid_from?: string;
  valid_until?: string;
  requires_renewal?: boolean;
  renewal_reminder_days?: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get authenticated user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // Route: GET /compliance/rules
    if (
      req.method === 'GET' &&
      pathSegments.includes('rules') &&
      !pathSegments[pathSegments.indexOf('rules') + 1]
    ) {
      return await handleListRules(supabaseClient, url);
    }

    // Route: GET /compliance/rules/:id
    if (
      req.method === 'GET' &&
      pathSegments.includes('rules') &&
      pathSegments[pathSegments.indexOf('rules') + 1]
    ) {
      const ruleId = pathSegments[pathSegments.indexOf('rules') + 1];
      return await handleGetRule(supabaseClient, ruleId);
    }

    // Route: POST /compliance/rules
    if (req.method === 'POST' && pathSegments.includes('rules')) {
      const body: CreateRuleRequest = await req.json();
      return await handleCreateRule(supabaseClient, body, user.id);
    }

    // Route: PATCH /compliance/rules/:id
    if (req.method === 'PATCH' && pathSegments.includes('rules')) {
      const ruleId = pathSegments[pathSegments.indexOf('rules') + 1];
      const body = await req.json();
      return await handleUpdateRule(supabaseClient, ruleId, body);
    }

    // Route: DELETE /compliance/rules/:id
    if (req.method === 'DELETE' && pathSegments.includes('rules')) {
      const ruleId = pathSegments[pathSegments.indexOf('rules') + 1];
      return await handleDeleteRule(supabaseClient, ruleId);
    }

    // Route: GET /compliance/violations
    if (
      req.method === 'GET' &&
      pathSegments.includes('violations') &&
      !pathSegments[pathSegments.indexOf('violations') + 1]
    ) {
      return await handleListViolations(supabaseClient, url);
    }

    // Route: GET /compliance/violations/:id
    if (
      req.method === 'GET' &&
      pathSegments.includes('violations') &&
      pathSegments[pathSegments.indexOf('violations') + 1]
    ) {
      const violationId = pathSegments[pathSegments.indexOf('violations') + 1];
      return await handleGetViolation(supabaseClient, violationId);
    }

    // Route: POST /compliance/check
    if (req.method === 'POST' && pathSegments.includes('check')) {
      const body: CheckComplianceRequest = await req.json();
      return await handleCheckCompliance(supabaseClient, body);
    }

    // Route: POST /compliance/signoff
    if (req.method === 'POST' && pathSegments.includes('signoff')) {
      const body: SignoffRequest = await req.json();
      return await handleSignoff(supabaseClient, body);
    }

    // Route: GET /compliance/summary/:entityType/:entityId
    if (req.method === 'GET' && pathSegments.includes('summary')) {
      const summaryIndex = pathSegments.indexOf('summary');
      const entityType = pathSegments[summaryIndex + 1];
      const entityId = pathSegments[summaryIndex + 2];
      return await handleGetSummary(supabaseClient, entityType, entityId);
    }

    // Route: GET /compliance/templates
    if (req.method === 'GET' && pathSegments.includes('templates')) {
      return await handleListTemplates(supabaseClient);
    }

    // Route: POST /compliance/exemptions
    if (req.method === 'POST' && pathSegments.includes('exemptions')) {
      const body: CreateExemptionRequest = await req.json();
      return await handleCreateExemption(supabaseClient, body, user.id);
    }

    // Route not found
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Handler: List compliance rules
async function handleListRules(supabaseClient: ReturnType<typeof createClient>, url: URL) {
  const params = url.searchParams;
  const is_active = params.get('is_active');
  const rule_type = params.get('rule_type');
  const severity = params.get('severity');
  const entity_type = params.get('entity_type');
  const page = parseInt(params.get('page') || '1');
  const limit = parseInt(params.get('limit') || '20');
  const offset = (page - 1) * limit;

  let query = supabaseClient.from('compliance_rules').select('*', { count: 'exact' });

  if (is_active !== null) {
    query = query.eq('is_active', is_active === 'true');
  }
  if (rule_type) {
    query = query.eq('rule_type', rule_type);
  }
  if (severity) {
    query = query.eq('severity', severity);
  }
  if (entity_type) {
    query = query.contains('entity_types', [entity_type]);
  }

  const { data, count, error } = await query
    .order('severity', { ascending: false })
    .order('rule_code')
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      rules: data,
      total_count: count,
      page,
      page_size: limit,
      has_more: offset + limit < (count || 0),
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Handler: Get single rule
async function handleGetRule(supabaseClient: ReturnType<typeof createClient>, ruleId: string) {
  const { data, error } = await supabaseClient
    .from('compliance_rules')
    .select('*')
    .eq('id', ruleId)
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.code === 'PGRST116' ? 404 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: Create rule
async function handleCreateRule(
  supabaseClient: ReturnType<typeof createClient>,
  body: CreateRuleRequest,
  userId: string
) {
  // Validate required fields
  if (!body.rule_code || !body.name_en || !body.name_ar || !body.rule_type) {
    return new Response(
      JSON.stringify({
        error: 'validation_error',
        message: 'rule_code, name_en, name_ar, and rule_type are required',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const { data, error } = await supabaseClient
    .from('compliance_rules')
    .insert({
      ...body,
      created_by: userId,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.code === '23505' ? 409 : 500, // Unique constraint violation
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: Update rule
async function handleUpdateRule(
  supabaseClient: ReturnType<typeof createClient>,
  ruleId: string,
  body: Partial<CreateRuleRequest>
) {
  const { data, error } = await supabaseClient
    .from('compliance_rules')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ruleId)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.code === 'PGRST116' ? 404 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: Delete (deactivate) rule
async function handleDeleteRule(supabaseClient: ReturnType<typeof createClient>, ruleId: string) {
  const { data, error } = await supabaseClient
    .from('compliance_rules')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ruleId)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.code === 'PGRST116' ? 404 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, deactivated: data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: List violations
async function handleListViolations(supabaseClient: ReturnType<typeof createClient>, url: URL) {
  const params = url.searchParams;
  const entity_type = params.get('entity_type');
  const entity_id = params.get('entity_id');
  const dossier_id = params.get('dossier_id');
  const status = params.get('status');
  const severity = params.get('severity');
  const requires_signoff = params.get('requires_signoff');
  const page = parseInt(params.get('page') || '1');
  const limit = parseInt(params.get('limit') || '20');
  const offset = (page - 1) * limit;

  let query = supabaseClient
    .from('compliance_violations')
    .select('*, rule:compliance_rules(*)', { count: 'exact' });

  if (entity_type) {
    query = query.eq('entity_type', entity_type);
  }
  if (entity_id) {
    query = query.eq('entity_id', entity_id);
  }
  if (dossier_id) {
    query = query.eq('dossier_id', dossier_id);
  }
  if (status) {
    const statusArray = status.split(',');
    query = query.in('status', statusArray);
  }
  if (severity) {
    const severityArray = severity.split(',');
    query = query.in('severity', severityArray);
  }
  if (requires_signoff === 'true') {
    query = query.eq('rule.requires_signoff', true);
  }

  const { data, count, error } = await query
    .order('severity', { ascending: false })
    .order('detected_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      violations: data,
      total_count: count,
      page,
      page_size: limit,
      has_more: offset + limit < (count || 0),
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Handler: Get single violation
async function handleGetViolation(
  supabaseClient: ReturnType<typeof createClient>,
  violationId: string
) {
  const { data: violation, error } = await supabaseClient
    .from('compliance_violations')
    .select('*, rule:compliance_rules(*)')
    .eq('id', violationId)
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.code === 'PGRST116' ? 404 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get sign-offs for this violation
  const { data: signoffs } = await supabaseClient
    .from('compliance_signoffs')
    .select('*')
    .eq('violation_id', violationId)
    .order('signed_at', { ascending: false });

  return new Response(
    JSON.stringify({
      ...violation,
      signoffs: signoffs || [],
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Handler: Check compliance
async function handleCheckCompliance(
  supabaseClient: ReturnType<typeof createClient>,
  body: CheckComplianceRequest
) {
  // Validate required fields
  if (!body.entity_type || !body.entity_id || !body.action_type) {
    return new Response(
      JSON.stringify({
        error: 'validation_error',
        message: 'entity_type, entity_id, and action_type are required',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Call the database function for compliance checking
  const { data, error } = await supabaseClient.rpc('check_entity_compliance', {
    p_entity_type: body.entity_type,
    p_entity_id: body.entity_id,
    p_action_type: body.action_type,
    p_context: body.context || {},
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: Sign off on violation
async function handleSignoff(
  supabaseClient: ReturnType<typeof createClient>,
  body: SignoffRequest
) {
  // Validate required fields
  if (!body.violation_id || !body.action || !body.justification) {
    return new Response(
      JSON.stringify({
        error: 'validation_error',
        message: 'violation_id, action, and justification are required',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Call the database function for sign-off
  const { data, error } = await supabaseClient.rpc('signoff_violation', {
    p_violation_id: body.violation_id,
    p_action: body.action,
    p_justification: body.justification,
    p_conditions: body.conditions || [],
    p_waiver_valid_until: body.waiver_valid_until || null,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: Get compliance summary
async function handleGetSummary(
  supabaseClient: ReturnType<typeof createClient>,
  entityType: string,
  entityId: string
) {
  if (!entityType || !entityId) {
    return new Response(
      JSON.stringify({
        error: 'validation_error',
        message: 'entity_type and entity_id are required',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Call the database function for summary
  const { data, error } = await supabaseClient.rpc('get_entity_compliance_summary', {
    p_entity_type: entityType,
    p_entity_id: entityId,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: List rule templates
async function handleListTemplates(supabaseClient: ReturnType<typeof createClient>) {
  const { data, error } = await supabaseClient
    .from('compliance_rule_templates')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('template_code');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ templates: data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Handler: Create exemption
async function handleCreateExemption(
  supabaseClient: ReturnType<typeof createClient>,
  body: CreateExemptionRequest,
  userId: string
) {
  // Validate required fields
  if (!body.reason) {
    return new Response(
      JSON.stringify({
        error: 'validation_error',
        message: 'reason is required',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const { data, error } = await supabaseClient
    .from('compliance_exemptions')
    .insert({
      ...body,
      granted_by: userId,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
