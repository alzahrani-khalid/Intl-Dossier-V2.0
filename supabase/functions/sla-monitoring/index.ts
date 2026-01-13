/**
 * SLA Monitoring Edge Function
 * Feature: sla-monitoring
 *
 * Endpoints:
 * - GET /dashboard - Get SLA dashboard overview
 * - GET /compliance/type - Get compliance breakdown by type
 * - GET /compliance/assignee - Get compliance breakdown by assignee
 * - GET /at-risk - Get items at risk of SLA breach
 * - GET /policies - List all SLA policies
 * - POST /policies - Create new SLA policy
 * - PUT /policies/:id - Update SLA policy
 * - DELETE /policies/:id - Delete SLA policy (soft delete)
 * - GET /escalations - Get escalation events
 * - POST /escalations/:id/acknowledge - Acknowledge an escalation
 * - POST /escalations/:id/resolve - Resolve an escalation
 * - POST /check-breaches - Manually trigger SLA breach check
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface SLAPolicyInput {
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  request_type?: string;
  sensitivity?: string;
  urgency?: string;
  priority?: string;
  acknowledgment_target: number;
  resolution_target: number;
  business_hours_only?: boolean;
  timezone?: string;
  warning_threshold_pct?: number;
  escalation_enabled?: boolean;
  escalation_levels?: Array<{
    level: number;
    after_minutes: number;
    notify_role: string;
    notify_user_id?: string;
  }>;
  notification_channels?: string[];
  is_active?: boolean;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const endpoint = pathParts[pathParts.length - 1] || '';
    const method = req.method;

    // Route handling
    if (method === 'GET') {
      switch (endpoint) {
        case 'dashboard':
        case 'sla-monitoring':
          return await getDashboardOverview(supabase, url);

        case 'type':
          return await getComplianceByType(supabase, url);

        case 'assignee':
          return await getComplianceByAssignee(supabase, url);

        case 'at-risk':
          return await getAtRiskItems(supabase, url);

        case 'policies':
          return await listPolicies(supabase);

        case 'escalations':
          return await listEscalations(supabase, url);

        case 'breached':
          return await getBreachedItems(supabase);

        default:
          // Check if it's a specific policy request
          if (pathParts.includes('policies') && pathParts.length > 1) {
            const policyId = pathParts[pathParts.length - 1];
            return await getPolicy(supabase, policyId);
          }
          return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
      }
    }

    if (method === 'POST') {
      const body = await req.json();

      if (endpoint === 'policies') {
        return await createPolicy(supabase, body as SLAPolicyInput);
      }

      if (endpoint === 'check-breaches') {
        return await checkBreaches(supabase);
      }

      if (endpoint === 'acknowledge') {
        const escalationId = pathParts[pathParts.length - 2];
        return await acknowledgeEscalation(supabase, escalationId, user.id);
      }

      if (endpoint === 'resolve') {
        const escalationId = pathParts[pathParts.length - 2];
        return await resolveEscalation(supabase, escalationId, user.id, body.notes);
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'PUT') {
      if (pathParts.includes('policies')) {
        const policyId = pathParts[pathParts.length - 1];
        const body = await req.json();
        return await updatePolicy(supabase, policyId, body as Partial<SLAPolicyInput>);
      }
    }

    if (method === 'DELETE') {
      if (pathParts.includes('policies')) {
        const policyId = pathParts[pathParts.length - 1];
        return await deletePolicy(supabase, policyId);
      }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('SLA Monitoring Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================
// Dashboard & Metrics
// ============================================

async function getDashboardOverview(supabase: ReturnType<typeof createClient>, url: URL) {
  const entityType = url.searchParams.get('entity_type') || 'ticket';
  const startDate = url.searchParams.get('start_date') || null;
  const endDate = url.searchParams.get('end_date') || null;

  const { data, error } = await supabase.rpc('get_sla_dashboard_overview', {
    p_entity_type: entityType,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;

  return new Response(JSON.stringify({ data: data?.[0] || null }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getComplianceByType(supabase: ReturnType<typeof createClient>, url: URL) {
  const entityType = url.searchParams.get('entity_type') || 'ticket';
  const startDate = url.searchParams.get('start_date') || null;
  const endDate = url.searchParams.get('end_date') || null;

  const { data, error } = await supabase.rpc('get_sla_compliance_by_type', {
    p_entity_type: entityType,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getComplianceByAssignee(supabase: ReturnType<typeof createClient>, url: URL) {
  const startDate = url.searchParams.get('start_date') || null;
  const endDate = url.searchParams.get('end_date') || null;
  const limit = parseInt(url.searchParams.get('limit') || '20');

  const { data, error } = await supabase.rpc('get_sla_compliance_by_assignee', {
    p_start_date: startDate,
    p_end_date: endDate,
    p_limit: limit,
  });

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getAtRiskItems(supabase: ReturnType<typeof createClient>, url: URL) {
  const entityType = url.searchParams.get('entity_type') || 'ticket';
  const threshold = parseInt(url.searchParams.get('threshold') || '75');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  const { data, error } = await supabase.rpc('get_sla_at_risk_items', {
    p_entity_type: entityType,
    p_threshold_pct: threshold,
    p_limit: limit,
  });

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getBreachedItems(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.rpc('get_sla_breached_tickets');

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================
// Policy Management
// ============================================

async function listPolicies(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('sla_policies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getPolicy(supabase: ReturnType<typeof createClient>, policyId: string) {
  const { data, error } = await supabase
    .from('sla_policies')
    .select('*')
    .eq('id', policyId)
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function createPolicy(supabase: ReturnType<typeof createClient>, input: SLAPolicyInput) {
  const { data, error } = await supabase
    .from('sla_policies')
    .insert({
      name: input.name,
      name_ar: input.name_ar,
      description: input.description,
      description_ar: input.description_ar,
      request_type: input.request_type,
      sensitivity: input.sensitivity,
      urgency: input.urgency,
      priority: input.priority,
      acknowledgment_target: input.acknowledgment_target,
      resolution_target: input.resolution_target,
      business_hours_only: input.business_hours_only ?? true,
      timezone: input.timezone ?? 'Asia/Riyadh',
      warning_threshold_pct: input.warning_threshold_pct ?? 75,
      escalation_enabled: input.escalation_enabled ?? true,
      escalation_levels: input.escalation_levels ?? [],
      notification_channels: input.notification_channels ?? ['in_app', 'email'],
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updatePolicy(
  supabase: ReturnType<typeof createClient>,
  policyId: string,
  input: Partial<SLAPolicyInput>
) {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Only include provided fields
  if (input.name !== undefined) updateData.name = input.name;
  if (input.name_ar !== undefined) updateData.name_ar = input.name_ar;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.description_ar !== undefined) updateData.description_ar = input.description_ar;
  if (input.request_type !== undefined) updateData.request_type = input.request_type;
  if (input.sensitivity !== undefined) updateData.sensitivity = input.sensitivity;
  if (input.urgency !== undefined) updateData.urgency = input.urgency;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.acknowledgment_target !== undefined)
    updateData.acknowledgment_target = input.acknowledgment_target;
  if (input.resolution_target !== undefined) updateData.resolution_target = input.resolution_target;
  if (input.business_hours_only !== undefined)
    updateData.business_hours_only = input.business_hours_only;
  if (input.timezone !== undefined) updateData.timezone = input.timezone;
  if (input.warning_threshold_pct !== undefined)
    updateData.warning_threshold_pct = input.warning_threshold_pct;
  if (input.escalation_enabled !== undefined)
    updateData.escalation_enabled = input.escalation_enabled;
  if (input.escalation_levels !== undefined) updateData.escalation_levels = input.escalation_levels;
  if (input.notification_channels !== undefined)
    updateData.notification_channels = input.notification_channels;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { data, error } = await supabase
    .from('sla_policies')
    .update(updateData)
    .eq('id', policyId)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deletePolicy(supabase: ReturnType<typeof createClient>, policyId: string) {
  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('sla_policies')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', policyId);

  if (error) throw error;

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================
// Escalations
// ============================================

async function listEscalations(supabase: ReturnType<typeof createClient>, url: URL) {
  const status = url.searchParams.get('status');
  const entityType = url.searchParams.get('entity_type');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  let query = supabase
    .from('sla_escalations')
    .select('*, policy:sla_policies(*)')
    .order('triggered_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const { data, error } = await query;

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function acknowledgeEscalation(
  supabase: ReturnType<typeof createClient>,
  escalationId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from('sla_escalations')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', escalationId)
    .eq('escalated_to_id', userId)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function resolveEscalation(
  supabase: ReturnType<typeof createClient>,
  escalationId: string,
  userId: string,
  notes?: string
) {
  const { data, error } = await supabase
    .from('sla_escalations')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', escalationId)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================
// Breach Checking
// ============================================

async function checkBreaches(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.rpc('check_sla_breaches');

  if (error) throw error;

  return new Response(
    JSON.stringify({
      data: { breaches_detected: data },
      message: `Detected ${data} new SLA breaches`,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
