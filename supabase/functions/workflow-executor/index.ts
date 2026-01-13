/**
 * Workflow Executor Edge Function
 * Processes queued workflow actions and executes them
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// =============================================================================
// Types
// =============================================================================

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

interface QueuedAction {
  id: string;
  execution_id: string;
  execution_created_at: string;
  action_index: number;
  action_type: WorkflowActionType;
  action_config: Record<string, unknown>;
  status: string;
  retry_count: number;
  max_retries: number;
  scheduled_for: string;
}

interface ExecutionContext {
  supabase: SupabaseClient;
  execution: {
    id: string;
    rule_id: string;
    entity_type: WorkflowEntityType;
    entity_id: string;
    trigger_context: Record<string, unknown>;
  };
  entityData: Record<string, unknown>;
  rule: {
    name_en: string;
    name_ar: string;
    created_by: string;
  };
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

function getTableName(entityType: WorkflowEntityType): string {
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
  return mapping[entityType];
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // This function can be called:
    // 1. By a scheduled job to process queue
    // 2. By a webhook to trigger specific workflow
    // 3. Manually to execute or retry actions

    const authHeader = req.headers.get('Authorization');

    // Create Supabase client with service role for queue processing
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create user-context client if auth header provided
    const supabaseUser = authHeader
      ? createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
          global: { headers: { Authorization: authHeader } },
        })
      : null;

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'process_queue';

    switch (action) {
      case 'process_queue':
        return await processQueue(supabaseAdmin);

      case 'trigger':
        if (!supabaseUser) {
          return errorResponse('Authorization required', 'التفويض مطلوب', 401);
        }
        return await triggerWorkflow(supabaseAdmin, supabaseUser, req);

      case 'retry':
        if (!supabaseUser) {
          return errorResponse('Authorization required', 'التفويض مطلوب', 401);
        }
        return await retryExecution(supabaseAdmin, supabaseUser, req);

      default:
        return errorResponse('Invalid action', 'إجراء غير صالح', 400);
    }
  } catch (error) {
    console.error('Workflow executor error:', error);
    return errorResponse(
      'Internal server error',
      'خطأ في الخادم الداخلي',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});

// =============================================================================
// Queue Processing
// =============================================================================

async function processQueue(supabase: SupabaseClient): Promise<Response> {
  const lockId = `executor-${crypto.randomUUID().substring(0, 8)}`;
  const batchSize = 10;
  let processedCount = 0;
  let successCount = 0;
  let failedCount = 0;

  try {
    // Get and lock pending actions
    const { data: actions, error } = await supabase
      .from('workflow_action_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .is('locked_at', null)
      .order('scheduled_for', { ascending: true })
      .limit(batchSize);

    if (error) {
      throw new Error(`Failed to fetch queue: ${error.message}`);
    }

    if (!actions || actions.length === 0) {
      return jsonResponse({ message: 'No pending actions', processed: 0 });
    }

    // Lock actions
    const actionIds = actions.map((a: QueuedAction) => a.id);
    await supabase
      .from('workflow_action_queue')
      .update({
        status: 'running',
        locked_at: new Date().toISOString(),
        locked_by: lockId,
      })
      .in('id', actionIds);

    // Process each action
    for (const action of actions as QueuedAction[]) {
      processedCount++;

      try {
        // Get execution context
        const context = await getExecutionContext(supabase, action);

        if (!context) {
          throw new Error('Failed to get execution context');
        }

        // Execute the action
        const result = await executeAction(action, context);

        // Update action status
        await supabase
          .from('workflow_action_queue')
          .update({
            status: 'completed',
            result,
            processed_at: new Date().toISOString(),
            locked_at: null,
            locked_by: null,
          })
          .eq('id', action.id);

        // Update execution log
        await updateExecutionLog(supabase, action, 'success', result);

        successCount++;
      } catch (actionError) {
        console.error(`Action ${action.id} failed:`, actionError);

        const errorMessage = actionError instanceof Error ? actionError.message : 'Unknown error';

        // Check retry count
        if (action.retry_count < action.max_retries) {
          // Schedule retry with exponential backoff
          const retryDelay = Math.pow(2, action.retry_count + 1) * 60; // 2, 4, 8 minutes
          const nextRetry = new Date(Date.now() + retryDelay * 1000);

          await supabase
            .from('workflow_action_queue')
            .update({
              status: 'pending',
              retry_count: action.retry_count + 1,
              scheduled_for: nextRetry.toISOString(),
              error_message: errorMessage,
              locked_at: null,
              locked_by: null,
            })
            .eq('id', action.id);
        } else {
          // Mark as failed
          await supabase
            .from('workflow_action_queue')
            .update({
              status: 'failed',
              error_message: errorMessage,
              processed_at: new Date().toISOString(),
              locked_at: null,
              locked_by: null,
            })
            .eq('id', action.id);

          await updateExecutionLog(supabase, action, 'failed', null, errorMessage);
          failedCount++;
        }
      }
    }

    // Update execution statuses
    await updateExecutionStatuses(supabase);

    return jsonResponse({
      processed: processedCount,
      succeeded: successCount,
      failed: failedCount,
    });
  } catch (error) {
    console.error('Queue processing error:', error);
    return errorResponse(
      'Queue processing failed',
      'فشل معالجة قائمة الانتظار',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

async function getExecutionContext(
  supabase: SupabaseClient,
  action: QueuedAction
): Promise<ExecutionContext | null> {
  // Get execution details
  const { data: execution, error: execError } = await supabase
    .from('workflow_executions')
    .select('*, workflow_rules(name_en, name_ar, created_by)')
    .eq('id', action.execution_id)
    .single();

  if (execError || !execution) {
    return null;
  }

  // Get entity data
  const tableName = getTableName(execution.entity_type);
  const { data: entityData } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', execution.entity_id)
    .single();

  return {
    supabase,
    execution: {
      id: execution.id,
      rule_id: execution.rule_id,
      entity_type: execution.entity_type,
      entity_id: execution.entity_id,
      trigger_context: execution.trigger_context,
    },
    entityData: entityData || {},
    rule: execution.workflow_rules,
  };
}

// =============================================================================
// Action Executors
// =============================================================================

async function executeAction(
  action: QueuedAction,
  context: ExecutionContext
): Promise<Record<string, unknown>> {
  const { action_type, action_config } = action;

  switch (action_type) {
    case 'notify_user':
      return await executeNotifyUser(context, action_config);

    case 'notify_assignee':
      return await executeNotifyAssignee(context, action_config);

    case 'notify_role':
      return await executeNotifyRole(context, action_config);

    case 'update_status':
      return await executeUpdateStatus(context, action_config);

    case 'update_priority':
      return await executeUpdatePriority(context, action_config);

    case 'update_field':
      return await executeUpdateField(context, action_config);

    case 'assign_user':
      return await executeAssignUser(context, action_config);

    case 'create_task':
      return await executeCreateTask(context, action_config);

    case 'create_comment':
      return await executeCreateComment(context, action_config);

    case 'add_tag':
      return await executeAddTag(context, action_config);

    case 'remove_tag':
      return await executeRemoveTag(context, action_config);

    case 'call_webhook':
      return await executeCallWebhook(context, action_config);

    case 'send_email':
      return await executeSendEmail(context, action_config);

    case 'delay':
      // Delay is handled at queue level, just return success
      return { status: 'delay_completed' };

    default:
      throw new Error(`Unsupported action type: ${action_type}`);
  }
}

async function executeNotifyUser(
  context: ExecutionContext,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const { supabase, execution, entityData, rule } = context;
  const userId = config.user_id as string;
  const templateCode = config.template as string;

  // Get notification template
  const { data: template } = await supabase
    .from('workflow_notification_templates')
    .select('*')
    .eq('code', templateCode)
    .single();

  // Prepare notification content
  const variables = {
    'entity.title': entityData.title || entityData.name_en || entityData.subject || 'Unknown',
    'entity.type': execution.entity_type,
    rule_name: rule.name_en,
    url: `/dashboard/${execution.entity_type}/${execution.entity_id}`,
    ...context.execution.trigger_context,
  };

  const title = template
    ? interpolateTemplate(template.subject_en, variables)
    : `Workflow notification: ${rule.name_en}`;
  const body = template
    ? interpolateTemplate(template.body_en, variables)
    : `Action triggered for ${execution.entity_type}`;

  // Create notification
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message: body,
    type: 'workflow',
    metadata: {
      rule_id: execution.rule_id,
      entity_type: execution.entity_type,
      entity_id: execution.entity_id,
      template_code: templateCode,
    },
  });

  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }

  return { notified_user_id: userId, template: templateCode };
}

async function executeNotifyAssignee(
  context: ExecutionContext,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const assigneeId = context.entityData.assignee_id as string;

  if (!assigneeId) {
    return { skipped: true, reason: 'No assignee on entity' };
  }

  return executeNotifyUser(context, { ...config, user_id: assigneeId });
}

async function executeNotifyRole(
  context: ExecutionContext,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const { supabase } = context;
  const role = config.role as string;

  // Get users with the role
  const { data: users } = await supabase.from('user_roles').select('user_id').eq('role', role);

  if (!users || users.length === 0) {
    return { skipped: true, reason: `No users with role: ${role}` };
  }

  // Notify each user
  const results = [];
  for (const user of users) {
    const result = await executeNotifyUser(context, { ...config, user_id: user.user_id });
    results.push(result);
  }

  return { notified_count: results.length, role };
}

async function executeUpdateStatus(
  context: ExecutionContext,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const { supabase, execution } = context;
  const newStatus = config.status as string;
  const tableName = getTableName(execution.entity_type);

  const { error } = await supabase
    .from(tableName)
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', execution.entity_id);

  if (error) {
    throw new Error(`Failed to update status: ${error.message}`);
  }

  return { updated: true, new_status: newStatus };
}

async function executeUpdatePriority(
  context: ExecutionContext,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const { supabase, execution } = context;
  const newPriority = config.priority as string;
  const tableName = getTableName(execution.entity_type);

  const { error } = await supabase
    .from(tableName)
    .update({ priority: newPriority, updated_at: new Date().toISOString() })
    .eq('id', execution.entity_id);

  if (error) {
    throw new Error(`Failed to update priority: ${error.message}`);
  }

  return { updated: true, new_priority: newPriority };
}

async function executeUpdateField(
  context: ExecutionContext,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const { supabase, execution } = context;
  const fieldName = config.field as string;
  const fieldValue = config.value;
  const tableName = getTableName(execution.entity_type);

  const updateData: Record<string, unknown> = {
    [fieldName]: fieldValue,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from(tableName).update(updateData).eq('id', execution.entity_id);

  if (error) {
    throw new Error(`Failed to update field: ${error.message}`);
  }

  return { updated: true, field: fieldName, value: fieldValue };
}

async function executeAssignUser(
  context: ExecutionContext,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const { supabase, execution } = context;
  const userId = config.user_id as string;
  const tableName = getTableName(execution.entity_type);

  const { error } = await supabase
    .from(tableName)
    .update({ assignee_id: userId, updated_at: new Date().toISOString() })
    .eq('id', execution.entity_id);

  if (error) {
    throw new Error(`Failed to assign user: ${error.message}`);
  }

  // Optionally notify the assigned user
  if (config.notify !== false) {
    await executeNotifyUser(context, {
      user_id: userId,
      template: 'assignment_notification',
    });
  }

  return { assigned_to: userId };
}

async function executeCreateTask(
  context: ExecutionContext,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const { supabase, execution, rule } = context;

  const taskData = {
    title: interpolateTemplate((config.title as string) || 'Follow-up task', context.entityData),
    description: interpolateTemplate((config.description as string) || '', context.entityData),
    status: 'pending',
    priority: config.priority || 'medium',
    assignee_id: config.assignee_id || context.entityData.assignee_id,
    source: 'workflow',
    source_entity_type: execution.entity_type,
    source_entity_id: execution.entity_id,
    metadata: {
      created_by_workflow: rule.name_en,
      rule_id: execution.rule_id,
    },
  };

  const { data, error } = await supabase.from('tasks').insert(taskData).select().single();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  return { task_id: data.id, task_title: data.title };
}

async function executeCreateComment(
  context: ExecutionContext,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const { supabase, execution, rule } = context;

  const commentText = interpolateTemplate(
    (config.text as string) || 'Automated comment from workflow',
    { ...context.entityData, ...context.execution.trigger_context }
  );

  const { data, error } = await supabase
    .from('entity_comments')
    .insert({
      entity_type: execution.entity_type,
      entity_id: execution.entity_id,
      content: commentText,
      is_system: true,
      metadata: {
        workflow_name: rule.name_en,
        rule_id: execution.rule_id,
      },
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create comment: ${error.message}`);
  }

  return { comment_id: data.id };
}

async function executeAddTag(
  context: ExecutionContext,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const { supabase, execution } = context;
  const tagId = config.tag_id as string;

  const { error } = await supabase.from('entity_tags').insert({
    entity_type: execution.entity_type,
    entity_id: execution.entity_id,
    tag_id: tagId,
  });

  if (error && !error.message.includes('duplicate')) {
    throw new Error(`Failed to add tag: ${error.message}`);
  }

  return { tag_added: tagId };
}

async function executeRemoveTag(
  context: ExecutionContext,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const { supabase, execution } = context;
  const tagId = config.tag_id as string;

  const { error } = await supabase
    .from('entity_tags')
    .delete()
    .eq('entity_type', execution.entity_type)
    .eq('entity_id', execution.entity_id)
    .eq('tag_id', tagId);

  if (error) {
    throw new Error(`Failed to remove tag: ${error.message}`);
  }

  return { tag_removed: tagId };
}

async function executeCallWebhook(
  context: ExecutionContext,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const { supabase, execution, entityData, rule } = context;
  const webhookId = config.webhook_id as string;
  const customPayload = config.payload as Record<string, unknown> | undefined;

  // Get webhook configuration
  const { data: webhook, error: webhookError } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', webhookId)
    .single();

  if (webhookError || !webhook) {
    throw new Error('Webhook not found');
  }

  // Prepare payload
  const payload = customPayload || {
    event: 'workflow_action',
    workflow: {
      rule_id: execution.rule_id,
      rule_name: rule.name_en,
      execution_id: execution.id,
    },
    entity: {
      type: execution.entity_type,
      id: execution.entity_id,
      data: entityData,
    },
    trigger_context: execution.trigger_context,
    timestamp: new Date().toISOString(),
  };

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (webhook.auth_type === 'bearer' && webhook.auth_secret) {
    headers['Authorization'] = `Bearer ${webhook.auth_secret}`;
  } else if (webhook.auth_type === 'api_key' && webhook.auth_secret) {
    headers['X-API-Key'] = webhook.auth_secret;
  }

  // Make the request
  const response = await fetch(webhook.url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  // Log the delivery
  await supabase.from('webhook_deliveries').insert({
    webhook_id: webhookId,
    event_type: 'workflow_action',
    payload,
    response_status: response.status,
    response_body: await response.text().catch(() => null),
    delivered_at: new Date().toISOString(),
  });

  if (!response.ok) {
    throw new Error(`Webhook returned ${response.status}`);
  }

  return { webhook_id: webhookId, status: response.status };
}

async function executeSendEmail(
  context: ExecutionContext,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const { supabase, execution, entityData, rule } = context;
  const recipientEmail = config.to as string;
  const templateCode = config.template as string;

  // Get email template
  const { data: template } = await supabase
    .from('workflow_notification_templates')
    .select('*')
    .eq('code', templateCode)
    .eq('channel', 'email')
    .single();

  const variables = {
    'entity.title': entityData.title || entityData.name_en || 'Unknown',
    'entity.type': execution.entity_type,
    rule_name: rule.name_en,
    ...context.execution.trigger_context,
  };

  const subject = template
    ? interpolateTemplate(template.subject_en, variables)
    : `Workflow notification: ${rule.name_en}`;
  const body = template
    ? interpolateTemplate(template.body_en, variables)
    : `Action triggered for ${execution.entity_type}`;

  // Queue email for sending (via email-send function)
  const { error } = await supabase.from('email_queue').insert({
    to: recipientEmail,
    subject,
    body,
    metadata: {
      workflow_rule_id: execution.rule_id,
      entity_type: execution.entity_type,
      entity_id: execution.entity_id,
    },
  });

  if (error) {
    throw new Error(`Failed to queue email: ${error.message}`);
  }

  return { email_queued: true, recipient: recipientEmail };
}

// =============================================================================
// Trigger and Retry Handlers
// =============================================================================

async function triggerWorkflow(
  supabaseAdmin: SupabaseClient,
  supabaseUser: SupabaseClient,
  req: Request
): Promise<Response> {
  const body = await req.json();
  const { trigger_type, entity_type, entity_id, trigger_context } = body;

  // Get user
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) {
    return errorResponse('Unauthorized', 'غير مصرح', 401);
  }

  // Get entity data
  const tableName = getTableName(entity_type);
  const { data: entityData, error: entityError } = await supabaseAdmin
    .from(tableName)
    .select('*')
    .eq('id', entity_id)
    .single();

  if (entityError) {
    return errorResponse('Entity not found', 'الكيان غير موجود', 404);
  }

  // Find and trigger matching workflows using RPC
  const { data: executions, error: triggerError } = await supabaseAdmin.rpc(
    'trigger_matching_workflows',
    {
      p_trigger_type: trigger_type,
      p_entity_type: entity_type,
      p_entity_id: entity_id,
      p_entity_data: entityData,
      p_trigger_context: trigger_context || {},
      p_triggered_by: user.id,
    }
  );

  if (triggerError) {
    return errorResponse(
      'Failed to trigger workflows',
      'فشل في تشغيل سير العمل',
      500,
      triggerError.message
    );
  }

  return jsonResponse({
    triggered_workflows: executions?.length || 0,
    executions: executions || [],
  });
}

async function retryExecution(
  supabaseAdmin: SupabaseClient,
  supabaseUser: SupabaseClient,
  req: Request
): Promise<Response> {
  const body = await req.json();
  const { execution_id } = body;

  // Get user
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) {
    return errorResponse('Unauthorized', 'غير مصرح', 401);
  }

  // Get execution
  const { data: execution, error: execError } = await supabaseAdmin
    .from('workflow_executions')
    .select('*, workflow_rules(created_by)')
    .eq('id', execution_id)
    .single();

  if (execError || !execution) {
    return errorResponse('Execution not found', 'التنفيذ غير موجود', 404);
  }

  // Verify ownership
  if (execution.workflow_rules.created_by !== user.id) {
    return errorResponse('Not authorized', 'غير مصرح', 403);
  }

  // Reset failed actions in queue
  const { data: resetActions, error: resetError } = await supabaseAdmin
    .from('workflow_action_queue')
    .update({
      status: 'pending',
      retry_count: 0,
      scheduled_for: new Date().toISOString(),
      error_message: null,
    })
    .eq('execution_id', execution_id)
    .eq('status', 'failed')
    .select();

  if (resetError) {
    return errorResponse(
      'Failed to retry execution',
      'فشل في إعادة المحاولة',
      500,
      resetError.message
    );
  }

  // Update execution status
  await supabaseAdmin
    .from('workflow_executions')
    .update({ status: 'pending' })
    .eq('id', execution_id);

  return jsonResponse({
    success: true,
    actions_reset: resetActions?.length || 0,
  });
}

// =============================================================================
// Utility Functions
// =============================================================================

function interpolateTemplate(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
    const value = path.split('.').reduce((obj: unknown, key: string) => {
      if (obj && typeof obj === 'object') {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    }, variables);
    return value !== undefined ? String(value) : `{{${path}}}`;
  });
}

async function updateExecutionLog(
  supabase: SupabaseClient,
  action: QueuedAction,
  status: 'success' | 'failed',
  result: Record<string, unknown> | null,
  error?: string
): Promise<void> {
  // Get current execution log
  const { data: execution } = await supabase
    .from('workflow_executions')
    .select('execution_log, actions_executed, actions_succeeded, actions_failed')
    .eq('id', action.execution_id)
    .single();

  if (!execution) return;

  const log = execution.execution_log || [];
  log.push({
    action_index: action.action_index,
    type: action.action_type,
    status,
    executed_at: new Date().toISOString(),
    result: result || undefined,
    error: error || undefined,
  });

  await supabase
    .from('workflow_executions')
    .update({
      execution_log: log,
      actions_executed: execution.actions_executed + 1,
      actions_succeeded: execution.actions_succeeded + (status === 'success' ? 1 : 0),
      actions_failed: execution.actions_failed + (status === 'failed' ? 1 : 0),
    })
    .eq('id', action.execution_id);
}

async function updateExecutionStatuses(supabase: SupabaseClient): Promise<void> {
  // Find executions where all actions are complete
  await supabase.rpc('update_workflow_execution_statuses');
}
