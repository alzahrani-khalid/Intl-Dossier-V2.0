/**
 * AI Interaction Logs Edge Function
 * Feature: ai-interaction-logging
 *
 * Provides REST API for AI interaction logging operations:
 * - GET /ai-interaction-logs - List interactions
 * - GET /ai-interaction-logs/:id - Get interaction details
 * - GET /ai-interaction-logs/:id/audit - Get audit trail
 * - GET /ai-interaction-logs/:id/edits - Get user edits
 * - POST /ai-interaction-logs - Start new interaction
 * - PUT /ai-interaction-logs/:id/complete - Complete interaction
 * - POST /ai-interaction-logs/:id/edits - Log user edit
 * - POST /ai-interaction-logs/:id/decisions - Log approval decision
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import {
  corsHeaders,
  errorResponse,
  successResponse,
  handleOptions,
  parseBody,
} from '../_shared/utils.ts';
import { createLogger } from '../_shared/logger.ts';
import {
  createAIInteractionLogger,
  extractClientInfo,
  type StartInteractionParams,
  type CompleteInteractionParams,
  type LogUserEditParams,
  type LogApprovalDecisionParams,
} from '../_shared/ai-interaction-logger.ts';

const FUNCTION_NAME = 'ai-interaction-logs';

interface ListQueryParams {
  organizationId?: string;
  userId?: string;
  interactionType?: string;
  contentType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  const logger = createLogger(FUNCTION_NAME, req);
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Auth check
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    return errorResponse('Missing authorization header', 401, 'UNAUTHORIZED');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    logger.warn('Authentication failed', { error: authError?.message });
    return errorResponse('Invalid or expired token', 401, 'UNAUTHORIZED');
  }

  logger.setContext({ user_id: user.id });

  try {
    // Route handling
    // GET /ai-interaction-logs - List interactions
    if (req.method === 'GET' && pathParts.length === 1) {
      return await handleList(supabase, user.id, url.searchParams, logger);
    }

    // GET /ai-interaction-logs/:id - Get interaction details
    if (req.method === 'GET' && pathParts.length === 2) {
      const interactionId = pathParts[1];
      return await handleGetInteraction(supabase, interactionId, user.id, logger);
    }

    // GET /ai-interaction-logs/:id/audit - Get audit trail
    if (req.method === 'GET' && pathParts.length === 3 && pathParts[2] === 'audit') {
      const interactionId = pathParts[1];
      return await handleGetAudit(supabase, interactionId, user.id, logger);
    }

    // GET /ai-interaction-logs/:id/edits - Get user edits
    if (req.method === 'GET' && pathParts.length === 3 && pathParts[2] === 'edits') {
      const interactionId = pathParts[1];
      return await handleGetEdits(supabase, interactionId, user.id, logger);
    }

    // POST /ai-interaction-logs - Start new interaction
    if (req.method === 'POST' && pathParts.length === 1) {
      const body = await parseBody<StartInteractionParams>(req);
      const clientInfo = extractClientInfo(req);
      return await handleStartInteraction(body, user.id, clientInfo, logger);
    }

    // PUT /ai-interaction-logs/:id/complete - Complete interaction
    if (req.method === 'PUT' && pathParts.length === 3 && pathParts[2] === 'complete') {
      const interactionId = pathParts[1];
      const body = await parseBody<Omit<CompleteInteractionParams, 'interactionId'>>(req);
      return await handleCompleteInteraction(interactionId, body, logger);
    }

    // POST /ai-interaction-logs/:id/edits - Log user edit
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'edits') {
      const interactionId = pathParts[1];
      const body = await parseBody<Omit<LogUserEditParams, 'interactionId' | 'userId'>>(req);
      return await handleLogEdit(interactionId, user.id, body, logger);
    }

    // POST /ai-interaction-logs/:id/decisions - Log approval decision
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'decisions') {
      const interactionId = pathParts[1];
      const body =
        await parseBody<Omit<LogApprovalDecisionParams, 'interactionId' | 'userId'>>(req);
      return await handleLogDecision(interactionId, user.id, body, logger);
    }

    return errorResponse('Not found', 404, 'NOT_FOUND');
  } catch (error) {
    logger.error('Handler error', error as Error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
      'INTERNAL_ERROR'
    );
  }
});

// Handler functions

async function handleList(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  searchParams: URLSearchParams,
  logger: ReturnType<typeof createLogger>
) {
  const params: ListQueryParams = {
    organizationId: searchParams.get('organization_id') || undefined,
    userId: searchParams.get('user_id') || undefined,
    interactionType: searchParams.get('interaction_type') || undefined,
    contentType: searchParams.get('content_type') || undefined,
    status: searchParams.get('status') || undefined,
    startDate: searchParams.get('start_date') || undefined,
    endDate: searchParams.get('end_date') || undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  };

  logger.info('Listing AI interactions', params);

  let query = supabase
    .from('ai_interaction_logs')
    .select(
      `
      id,
      organization_id,
      user_id,
      interaction_type,
      content_type,
      target_entity_type,
      target_entity_id,
      session_id,
      model_provider,
      model_name,
      status,
      latency_ms,
      total_tokens,
      estimated_cost_usd,
      data_classification,
      created_at,
      completed_at
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(params.offset!, params.offset! + params.limit! - 1);

  // Apply filters
  if (params.organizationId) {
    query = query.eq('organization_id', params.organizationId);
  }
  if (params.userId) {
    query = query.eq('user_id', params.userId);
  }
  if (params.interactionType) {
    query = query.eq('interaction_type', params.interactionType);
  }
  if (params.contentType) {
    query = query.eq('content_type', params.contentType);
  }
  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.startDate) {
    query = query.gte('created_at', params.startDate);
  }
  if (params.endDate) {
    query = query.lte('created_at', params.endDate);
  }

  const { data, error, count } = await query;

  if (error) {
    logger.error('Failed to list interactions', error as Error);
    return errorResponse(error.message, 500, 'DB_ERROR');
  }

  return successResponse(data, 200, undefined, {
    total: count,
    limit: params.limit,
    offset: params.offset,
  });
}

async function handleGetInteraction(
  supabase: ReturnType<typeof createClient>,
  interactionId: string,
  userId: string,
  logger: ReturnType<typeof createLogger>
) {
  logger.info('Getting interaction details', { interactionId });

  const { data, error } = await supabase
    .from('ai_interaction_logs')
    .select(
      `
      *,
      ai_user_edits (
        id,
        version_number,
        change_percentage,
        edit_reason,
        edit_categories,
        created_at
      ),
      ai_approval_decisions (
        id,
        decision,
        decision_rationale,
        risk_level,
        decision_time_seconds,
        created_at
      )
    `
    )
    .eq('id', interactionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponse('Interaction not found', 404, 'NOT_FOUND');
    }
    logger.error('Failed to get interaction', error as Error);
    return errorResponse(error.message, 500, 'DB_ERROR');
  }

  return successResponse(data);
}

async function handleGetAudit(
  supabase: ReturnType<typeof createClient>,
  interactionId: string,
  userId: string,
  logger: ReturnType<typeof createLogger>
) {
  logger.info('Getting audit trail', { interactionId });

  const { data, error } = await supabase
    .from('ai_governance_audit')
    .select('*')
    .eq('interaction_id', interactionId)
    .order('occurred_at', { ascending: true });

  if (error) {
    logger.error('Failed to get audit trail', error as Error);
    return errorResponse(error.message, 500, 'DB_ERROR');
  }

  return successResponse(data);
}

async function handleGetEdits(
  supabase: ReturnType<typeof createClient>,
  interactionId: string,
  userId: string,
  logger: ReturnType<typeof createLogger>
) {
  logger.info('Getting user edits', { interactionId });

  const { data, error } = await supabase
    .from('ai_user_edits')
    .select('*')
    .eq('interaction_id', interactionId)
    .order('version_number', { ascending: true });

  if (error) {
    logger.error('Failed to get user edits', error as Error);
    return errorResponse(error.message, 500, 'DB_ERROR');
  }

  return successResponse(data);
}

async function handleStartInteraction(
  params: StartInteractionParams,
  userId: string,
  clientInfo: { ip: string; userAgent: string },
  logger: ReturnType<typeof createLogger>
) {
  logger.info('Starting AI interaction', {
    interactionType: params.interactionType,
    contentType: params.contentType,
  });

  const aiLogger = createAIInteractionLogger(FUNCTION_NAME);

  const result = await aiLogger.startInteraction({
    ...params,
    userId: params.userId || userId,
    requestIp: clientInfo.ip,
    userAgent: clientInfo.userAgent,
  });

  logger.info('Interaction started', { interactionId: result.interactionId });

  return successResponse(result, 201);
}

async function handleCompleteInteraction(
  interactionId: string,
  params: Omit<CompleteInteractionParams, 'interactionId'>,
  logger: ReturnType<typeof createLogger>
) {
  logger.info('Completing AI interaction', { interactionId, status: params.status });

  const aiLogger = createAIInteractionLogger(FUNCTION_NAME);

  await aiLogger.completeInteraction({
    interactionId,
    ...params,
  });

  logger.info('Interaction completed', { interactionId });

  return successResponse({ success: true });
}

async function handleLogEdit(
  interactionId: string,
  userId: string,
  params: Omit<LogUserEditParams, 'interactionId' | 'userId'>,
  logger: ReturnType<typeof createLogger>
) {
  logger.info('Logging user edit', { interactionId });

  const aiLogger = createAIInteractionLogger(FUNCTION_NAME);

  const result = await aiLogger.logUserEdit({
    interactionId,
    userId,
    ...params,
  });

  logger.info('User edit logged', { editId: result.editId, versionNumber: result.versionNumber });

  return successResponse(result, 201);
}

async function handleLogDecision(
  interactionId: string,
  userId: string,
  params: Omit<LogApprovalDecisionParams, 'interactionId' | 'userId'>,
  logger: ReturnType<typeof createLogger>
) {
  logger.info('Logging approval decision', { interactionId, decision: params.decision });

  const aiLogger = createAIInteractionLogger(FUNCTION_NAME);

  const result = await aiLogger.logApprovalDecision({
    interactionId,
    userId,
    ...params,
  });

  logger.info('Approval decision logged', {
    decisionId: result.decisionId,
    decisionTimeSeconds: result.decisionTimeSeconds,
  });

  return successResponse(result, 201);
}
