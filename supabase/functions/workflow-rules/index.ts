/**
 * Workflow Rules Edge Function
 * CRUD operations for no-code workflow automation rules
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// =============================================================================
// Types
// =============================================================================

type WorkflowTriggerType =
  | 'ticket_created'
  | 'ticket_updated'
  | 'status_changed'
  | 'deadline_approaching'
  | 'deadline_overdue'
  | 'assignment_changed'
  | 'priority_changed'
  | 'field_changed'
  | 'comment_added'
  | 'document_uploaded'
  | 'engagement_created'
  | 'commitment_created'
  | 'commitment_due'
  | 'schedule_cron'
  | 'manual';

type WorkflowActionType =
  | 'notify_user'
  | 'notify_role'
  | 'notify_assignee'
  | 'notify_webhook'
  | 'assign_user'
  | 'assign_role'
  | 'update_field'
  | 'update_status'
  | 'update_priority'
  | 'add_tag'
  | 'remove_tag'
  | 'create_task'
  | 'create_comment'
  | 'send_email'
  | 'call_webhook'
  | 'delay'
  | 'branch_condition';

type WorkflowEntityType =
  | 'intake_ticket'
  | 'engagement'
  | 'commitment'
  | 'task'
  | 'dossier'
  | 'position'
  | 'document'
  | 'calendar_entry';

type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'in_list'
  | 'not_in_list'
  | 'between'
  | 'changed_to'
  | 'changed_from'
  | 'has_changed';

interface WorkflowCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

interface WorkflowAction {
  type: WorkflowActionType;
  config: Record<string, unknown>;
}

interface WorkflowRule {
  id?: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  trigger_type: WorkflowTriggerType;
  trigger_config: Record<string, unknown>;
  entity_type: WorkflowEntityType;
  conditions: WorkflowCondition[];
  condition_logic: 'all' | 'any';
  actions: WorkflowAction[];
  is_active: boolean;
  run_once_per_entity?: boolean;
  max_executions_per_hour?: number;
  cooldown_minutes?: number;
  cron_expression?: string;
  organization_id?: string;
}

interface WorkflowExecution {
  id: string;
  rule_id: string;
  entity_type: WorkflowEntityType;
  entity_id: string;
  status: string;
  trigger_context: Record<string, unknown>;
  actions_executed: number;
  actions_succeeded: number;
  actions_failed: number;
  execution_log: unknown[];
  error_message?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  created_at: string;
}

interface ListParams {
  page?: number;
  limit?: number;
  entity_type?: WorkflowEntityType;
  trigger_type?: WorkflowTriggerType;
  is_active?: boolean;
  search?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(
  message_en: string,
  message_ar: string,
  status = 400,
  details?: unknown
): Response {
  return jsonResponse(
    {
      error: { message_en, message_ar, details },
      correlation_id: crypto.randomUUID(),
    },
    status
  );
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Authorization required', 'التفويض مطلوب', 401);
    }

    // Create Supabase client with user context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user session
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return errorResponse('Invalid user session', 'جلسة مستخدم غير صالحة', 401);
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const ruleId = pathParts[pathParts.length - 1];
    const isExecutionsEndpoint = url.pathname.includes('/executions');
    const isTemplatesEndpoint = url.pathname.includes('/templates');
    const isTestEndpoint = url.pathname.includes('/test');

    // Route based on method and path
    switch (req.method) {
      case 'GET':
        if (isExecutionsEndpoint) {
          return await getExecutions(supabaseClient, url, ruleId);
        }
        if (isTemplatesEndpoint) {
          return await getNotificationTemplates(supabaseClient);
        }
        if (ruleId && ruleId !== 'workflow-rules') {
          return await getRule(supabaseClient, ruleId);
        }
        return await listRules(supabaseClient, url);

      case 'POST':
        if (isTestEndpoint) {
          return await testRule(supabaseClient, req, user.id);
        }
        return await createRule(supabaseClient, req, user.id);

      case 'PUT':
      case 'PATCH':
        if (!ruleId || ruleId === 'workflow-rules') {
          return errorResponse('Rule ID required', 'معرف القاعدة مطلوب', 400);
        }
        return await updateRule(supabaseClient, ruleId, req);

      case 'DELETE':
        if (!ruleId || ruleId === 'workflow-rules') {
          return errorResponse('Rule ID required', 'معرف القاعدة مطلوب', 400);
        }
        return await deleteRule(supabaseClient, ruleId);

      default:
        return errorResponse('Method not allowed', 'الطريقة غير مسموحة', 405);
    }
  } catch (error) {
    console.error('Workflow rules error:', error);
    return errorResponse(
      'Internal server error',
      'خطأ في الخادم الداخلي',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});

// =============================================================================
// Route Handlers
// =============================================================================

async function listRules(supabase: ReturnType<typeof createClient>, url: URL): Promise<Response> {
  const params = Object.fromEntries(url.searchParams) as ListParams;
  const page = Number(params.page) || 1;
  const limit = Math.min(Number(params.limit) || 20, 100);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('workflow_rules')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (params.entity_type) {
    query = query.eq('entity_type', params.entity_type);
  }
  if (params.trigger_type) {
    query = query.eq('trigger_type', params.trigger_type);
  }
  if (params.is_active !== undefined) {
    query = query.eq('is_active', params.is_active === true || params.is_active === 'true');
  }
  if (params.search) {
    query = query.or(
      `name_en.ilike.%${params.search}%,name_ar.ilike.%${params.search}%,description_en.ilike.%${params.search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return errorResponse(
      'Failed to fetch workflow rules',
      'فشل في جلب قواعد سير العمل',
      500,
      error.message
    );
  }

  return jsonResponse({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
  });
}

async function getRule(
  supabase: ReturnType<typeof createClient>,
  ruleId: string
): Promise<Response> {
  const { data, error } = await supabase
    .from('workflow_rules')
    .select('*')
    .eq('id', ruleId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponse('Workflow rule not found', 'قاعدة سير العمل غير موجودة', 404);
    }
    return errorResponse(
      'Failed to fetch workflow rule',
      'فشل في جلب قاعدة سير العمل',
      500,
      error.message
    );
  }

  return jsonResponse({ data });
}

async function createRule(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  userId: string
): Promise<Response> {
  const body = (await req.json()) as WorkflowRule;

  // Validate required fields
  if (!body.name_en || !body.name_ar) {
    return errorResponse('Name is required in both languages', 'الاسم مطلوب بكلتا اللغتين', 400);
  }

  if (!body.trigger_type) {
    return errorResponse('Trigger type is required', 'نوع المشغل مطلوب', 400);
  }

  if (!body.entity_type) {
    return errorResponse('Entity type is required', 'نوع الكيان مطلوب', 400);
  }

  if (!body.actions || body.actions.length === 0) {
    return errorResponse('At least one action is required', 'مطلوب إجراء واحد على الأقل', 400);
  }

  const { data, error } = await supabase
    .from('workflow_rules')
    .insert({
      name_en: body.name_en,
      name_ar: body.name_ar,
      description_en: body.description_en,
      description_ar: body.description_ar,
      trigger_type: body.trigger_type,
      trigger_config: body.trigger_config || {},
      entity_type: body.entity_type,
      conditions: body.conditions || [],
      condition_logic: body.condition_logic || 'all',
      actions: body.actions,
      is_active: body.is_active ?? true,
      run_once_per_entity: body.run_once_per_entity ?? false,
      max_executions_per_hour: body.max_executions_per_hour ?? 100,
      cooldown_minutes: body.cooldown_minutes ?? 0,
      cron_expression: body.cron_expression,
      organization_id: body.organization_id,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    return errorResponse(
      'Failed to create workflow rule',
      'فشل في إنشاء قاعدة سير العمل',
      500,
      error.message
    );
  }

  return jsonResponse({ data }, 201);
}

async function updateRule(
  supabase: ReturnType<typeof createClient>,
  ruleId: string,
  req: Request
): Promise<Response> {
  const body = (await req.json()) as Partial<WorkflowRule>;

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};

  if (body.name_en !== undefined) updateData.name_en = body.name_en;
  if (body.name_ar !== undefined) updateData.name_ar = body.name_ar;
  if (body.description_en !== undefined) updateData.description_en = body.description_en;
  if (body.description_ar !== undefined) updateData.description_ar = body.description_ar;
  if (body.trigger_type !== undefined) updateData.trigger_type = body.trigger_type;
  if (body.trigger_config !== undefined) updateData.trigger_config = body.trigger_config;
  if (body.entity_type !== undefined) updateData.entity_type = body.entity_type;
  if (body.conditions !== undefined) updateData.conditions = body.conditions;
  if (body.condition_logic !== undefined) updateData.condition_logic = body.condition_logic;
  if (body.actions !== undefined) updateData.actions = body.actions;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;
  if (body.run_once_per_entity !== undefined)
    updateData.run_once_per_entity = body.run_once_per_entity;
  if (body.max_executions_per_hour !== undefined)
    updateData.max_executions_per_hour = body.max_executions_per_hour;
  if (body.cooldown_minutes !== undefined) updateData.cooldown_minutes = body.cooldown_minutes;
  if (body.cron_expression !== undefined) updateData.cron_expression = body.cron_expression;

  const { data, error } = await supabase
    .from('workflow_rules')
    .update(updateData)
    .eq('id', ruleId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponse('Workflow rule not found', 'قاعدة سير العمل غير موجودة', 404);
    }
    return errorResponse(
      'Failed to update workflow rule',
      'فشل في تحديث قاعدة سير العمل',
      500,
      error.message
    );
  }

  return jsonResponse({ data });
}

async function deleteRule(
  supabase: ReturnType<typeof createClient>,
  ruleId: string
): Promise<Response> {
  // Soft delete
  const { error } = await supabase
    .from('workflow_rules')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', ruleId)
    .is('deleted_at', null);

  if (error) {
    return errorResponse(
      'Failed to delete workflow rule',
      'فشل في حذف قاعدة سير العمل',
      500,
      error.message
    );
  }

  return jsonResponse({ success: true });
}

async function getExecutions(
  supabase: ReturnType<typeof createClient>,
  url: URL,
  ruleId?: string
): Promise<Response> {
  const params = Object.fromEntries(url.searchParams);
  const page = Number(params.page) || 1;
  const limit = Math.min(Number(params.limit) || 20, 100);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('workflow_executions')
    .select('*, workflow_rules(name_en, name_ar)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (ruleId && ruleId !== 'executions') {
    query = query.eq('rule_id', ruleId);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.entity_type) {
    query = query.eq('entity_type', params.entity_type);
  }

  if (params.entity_id) {
    query = query.eq('entity_id', params.entity_id);
  }

  const { data, error, count } = await query;

  if (error) {
    return errorResponse(
      'Failed to fetch workflow executions',
      'فشل في جلب عمليات تنفيذ سير العمل',
      500,
      error.message
    );
  }

  return jsonResponse({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
  });
}

async function getNotificationTemplates(
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  const { data, error } = await supabase
    .from('workflow_notification_templates')
    .select('*')
    .order('is_system', { ascending: false })
    .order('name_en', { ascending: true });

  if (error) {
    return errorResponse(
      'Failed to fetch notification templates',
      'فشل في جلب قوالب الإشعارات',
      500,
      error.message
    );
  }

  return jsonResponse({ data });
}

async function testRule(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  userId: string
): Promise<Response> {
  const body = await req.json();
  const { rule_id, entity_id, dry_run = true } = body;

  if (!rule_id) {
    return errorResponse('Rule ID is required', 'معرف القاعدة مطلوب', 400);
  }

  // Get the rule
  const { data: rule, error: ruleError } = await supabase
    .from('workflow_rules')
    .select('*')
    .eq('id', rule_id)
    .is('deleted_at', null)
    .single();

  if (ruleError || !rule) {
    return errorResponse('Workflow rule not found', 'قاعدة سير العمل غير موجودة', 404);
  }

  // If entity_id provided, get entity data for condition testing
  let entityData = {};
  if (entity_id) {
    const tableName = getTableName(rule.entity_type);
    if (tableName) {
      const { data } = await supabase.from(tableName).select('*').eq('id', entity_id).single();
      entityData = data || {};
    }
  }

  // Simulate condition evaluation
  const conditionsResult = evaluateConditions(rule.conditions, rule.condition_logic, entityData);

  // Return test results
  return jsonResponse({
    data: {
      rule_id: rule.id,
      rule_name: rule.name_en,
      entity_type: rule.entity_type,
      entity_id: entity_id || null,
      dry_run,
      conditions_matched: conditionsResult.matched,
      conditions_details: conditionsResult.details,
      actions_to_execute: rule.actions.map((a: WorkflowAction, i: number) => ({
        index: i,
        type: a.type,
        config: a.config,
      })),
      would_execute: conditionsResult.matched,
    },
  });
}

// =============================================================================
// Utility Functions
// =============================================================================

function getTableName(entityType: WorkflowEntityType): string | null {
  const mapping: Record<WorkflowEntityType, string> = {
    intake_ticket: 'intake_tickets',
    engagement: 'engagements',
    commitment: 'commitments',
    task: 'tasks',
    dossier: 'dossiers',
    position: 'positions',
    document: 'documents',
    calendar_entry: 'calendar_entries',
  };
  return mapping[entityType] || null;
}

function evaluateConditions(
  conditions: WorkflowCondition[],
  logic: 'all' | 'any',
  entityData: Record<string, unknown>
): { matched: boolean; details: Array<{ field: string; matched: boolean; reason: string }> } {
  if (!conditions || conditions.length === 0) {
    return { matched: true, details: [] };
  }

  const details: Array<{ field: string; matched: boolean; reason: string }> = [];
  let anyMatched = false;
  let allMatched = true;

  for (const condition of conditions) {
    const fieldValue = getNestedValue(entityData, condition.field);
    const result = evaluateSingleCondition(condition, fieldValue);

    details.push({
      field: condition.field,
      matched: result.matched,
      reason: result.reason,
    });

    if (result.matched) {
      anyMatched = true;
    } else {
      allMatched = false;
    }
  }

  return {
    matched: logic === 'any' ? anyMatched : allMatched,
    details,
  };
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function evaluateSingleCondition(
  condition: WorkflowCondition,
  fieldValue: unknown
): { matched: boolean; reason: string } {
  const { operator, value } = condition;

  switch (operator) {
    case 'equals':
      return {
        matched: fieldValue === value,
        reason: `${fieldValue} ${fieldValue === value ? '=' : '!='} ${value}`,
      };
    case 'not_equals':
      return {
        matched: fieldValue !== value,
        reason: `${fieldValue} ${fieldValue !== value ? '!=' : '='} ${value}`,
      };
    case 'contains':
      return {
        matched: String(fieldValue || '')
          .toLowerCase()
          .includes(String(value || '').toLowerCase()),
        reason: `"${fieldValue}" ${
          String(fieldValue || '')
            .toLowerCase()
            .includes(String(value || '').toLowerCase())
            ? 'contains'
            : 'does not contain'
        } "${value}"`,
      };
    case 'is_empty':
      return {
        matched: fieldValue === null || fieldValue === undefined || fieldValue === '',
        reason: `${fieldValue === null || fieldValue === undefined || fieldValue === '' ? 'is empty' : 'is not empty'}`,
      };
    case 'is_not_empty':
      return {
        matched: fieldValue !== null && fieldValue !== undefined && fieldValue !== '',
        reason: `${fieldValue !== null && fieldValue !== undefined && fieldValue !== '' ? 'is not empty' : 'is empty'}`,
      };
    case 'greater_than':
      return {
        matched: Number(fieldValue) > Number(value),
        reason: `${fieldValue} ${Number(fieldValue) > Number(value) ? '>' : '<='} ${value}`,
      };
    case 'less_than':
      return {
        matched: Number(fieldValue) < Number(value),
        reason: `${fieldValue} ${Number(fieldValue) < Number(value) ? '<' : '>='} ${value}`,
      };
    case 'in_list':
      return {
        matched: Array.isArray(value) && value.includes(fieldValue),
        reason: `${fieldValue} ${Array.isArray(value) && value.includes(fieldValue) ? 'in' : 'not in'} [${value}]`,
      };
    default:
      return {
        matched: false,
        reason: `Unsupported operator: ${operator}`,
      };
  }
}
