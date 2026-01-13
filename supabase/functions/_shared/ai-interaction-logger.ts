/**
 * AI Interaction Logger Utility
 * Feature: ai-interaction-logging
 *
 * Provides comprehensive logging for AI interactions including:
 * - Prompt/response tracking
 * - User edits logging
 * - Approval decision recording
 * - Governance audit trail
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Types matching database enums
export type AIInteractionType =
  | 'generation'
  | 'suggestion'
  | 'classification'
  | 'extraction'
  | 'translation'
  | 'summarization'
  | 'analysis'
  | 'chat';

export type AIContentType =
  | 'brief'
  | 'position'
  | 'summary'
  | 'analysis'
  | 'recommendation'
  | 'entity_link'
  | 'translation'
  | 'extraction'
  | 'chat_response';

export type AIDecisionType =
  | 'approved'
  | 'approved_with_edits'
  | 'rejected'
  | 'revision_requested'
  | 'pending'
  | 'expired'
  | 'auto_approved';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'vllm' | 'ollama';

export type AIRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type DataClassification = 'public' | 'internal' | 'confidential' | 'secret';

export type LinkableEntityType =
  | 'dossier'
  | 'position'
  | 'brief'
  | 'person'
  | 'engagement'
  | 'commitment';

// Input types for logging functions
export interface StartInteractionParams {
  organizationId: string;
  userId: string;
  interactionType: AIInteractionType;
  contentType: AIContentType;
  modelProvider: AIProvider;
  modelName: string;
  userPrompt: string;
  systemPrompt?: string;
  targetEntityType?: LinkableEntityType;
  targetEntityId?: string;
  sessionId?: string;
  parentInteractionId?: string;
  contextSources?: ContextSource[];
  promptVariables?: Record<string, unknown>;
  dataClassification?: DataClassification;
  requestIp?: string;
  userAgent?: string;
}

export interface ContextSource {
  type: string;
  id: string;
  snippet?: string;
}

export interface CompleteInteractionParams {
  interactionId: string;
  status: AIRunStatus;
  aiResponse?: string;
  aiResponseStructured?: Record<string, unknown>;
  contextTokenCount?: number;
  responseTokenCount?: number;
  latencyMs?: number;
  estimatedCostUsd?: number;
  errorMessage?: string;
  containsPii?: boolean;
  governanceFlags?: Record<string, unknown>;
}

export interface LogUserEditParams {
  interactionId: string;
  userId: string;
  originalContent: string;
  editedContent: string;
  editReason?: string;
  editCategories?: string[];
  editDurationSeconds?: number;
}

export interface LogApprovalDecisionParams {
  interactionId: string;
  userId: string;
  decision: AIDecisionType;
  contentAtDecision: string;
  decisionRationale?: string;
  finalVersionNumber?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  riskFactors?: Record<string, unknown>[];
  complianceChecks?: Record<string, unknown>;
}

// Response types
export interface InteractionLogResult {
  interactionId: string;
  sessionId?: string;
  sequenceNumber: number;
}

export interface EditLogResult {
  editId: string;
  versionNumber: number;
  changePercentage: number;
}

export interface ApprovalDecisionResult {
  decisionId: string;
  decisionTimeSeconds: number;
}

/**
 * AI Interaction Logger class
 * Handles all AI interaction logging operations
 */
export class AIInteractionLogger {
  private supabase: SupabaseClient;
  private functionName: string;

  constructor(supabaseUrl: string, serviceRoleKey: string, functionName: string) {
    this.supabase = createClient(supabaseUrl, serviceRoleKey);
    this.functionName = functionName;
  }

  /**
   * Start logging an AI interaction
   * Call this when initiating an AI operation
   */
  async startInteraction(params: StartInteractionParams): Promise<InteractionLogResult> {
    const { data, error } = await this.supabase.rpc('log_ai_interaction_start', {
      p_org_id: params.organizationId,
      p_user_id: params.userId,
      p_interaction_type: params.interactionType,
      p_content_type: params.contentType,
      p_model_provider: params.modelProvider,
      p_model_name: params.modelName,
      p_user_prompt: params.userPrompt,
      p_system_prompt: params.systemPrompt || null,
      p_target_entity_type: params.targetEntityType || null,
      p_target_entity_id: params.targetEntityId || null,
      p_session_id: params.sessionId || null,
      p_parent_interaction_id: params.parentInteractionId || null,
      p_context_sources: JSON.stringify(params.contextSources || []),
      p_prompt_variables: JSON.stringify(params.promptVariables || {}),
      p_data_classification: params.dataClassification || 'internal',
      p_request_ip: params.requestIp || null,
      p_user_agent: params.userAgent || null,
    });

    if (error) {
      console.error(`[${this.functionName}] Failed to log interaction start:`, error);
      throw new Error(`Failed to log AI interaction: ${error.message}`);
    }

    // Get the sequence number for the interaction
    const { data: interactionData } = await this.supabase
      .from('ai_interaction_logs')
      .select('session_id, sequence_number')
      .eq('id', data)
      .single();

    return {
      interactionId: data,
      sessionId: interactionData?.session_id,
      sequenceNumber: interactionData?.sequence_number || 1,
    };
  }

  /**
   * Complete an AI interaction with response details
   * Call this when the AI operation completes (success or failure)
   */
  async completeInteraction(params: CompleteInteractionParams): Promise<void> {
    const { error } = await this.supabase.rpc('log_ai_interaction_complete', {
      p_interaction_id: params.interactionId,
      p_status: params.status,
      p_ai_response: params.aiResponse || null,
      p_ai_response_structured: params.aiResponseStructured
        ? JSON.stringify(params.aiResponseStructured)
        : null,
      p_context_token_count: params.contextTokenCount || null,
      p_response_token_count: params.responseTokenCount || null,
      p_latency_ms: params.latencyMs || null,
      p_estimated_cost_usd: params.estimatedCostUsd || null,
      p_error_message: params.errorMessage || null,
      p_contains_pii: params.containsPii || false,
      p_governance_flags: JSON.stringify(params.governanceFlags || {}),
    });

    if (error) {
      console.error(`[${this.functionName}] Failed to complete interaction log:`, error);
      throw new Error(`Failed to complete AI interaction log: ${error.message}`);
    }
  }

  /**
   * Log a user edit to AI-generated content
   * Call this when users modify content before accepting
   */
  async logUserEdit(params: LogUserEditParams): Promise<EditLogResult> {
    const { data, error } = await this.supabase.rpc('log_ai_user_edit', {
      p_interaction_id: params.interactionId,
      p_user_id: params.userId,
      p_original_content: params.originalContent,
      p_edited_content: params.editedContent,
      p_edit_reason: params.editReason || null,
      p_edit_categories: params.editCategories || [],
      p_edit_duration_seconds: params.editDurationSeconds || null,
    });

    if (error) {
      console.error(`[${this.functionName}] Failed to log user edit:`, error);
      throw new Error(`Failed to log user edit: ${error.message}`);
    }

    // Get edit details
    const { data: editData } = await this.supabase
      .from('ai_user_edits')
      .select('version_number, change_percentage')
      .eq('id', data)
      .single();

    return {
      editId: data,
      versionNumber: editData?.version_number || 1,
      changePercentage: editData?.change_percentage || 0,
    };
  }

  /**
   * Log an approval decision
   * Call this when users approve, reject, or request revision
   */
  async logApprovalDecision(params: LogApprovalDecisionParams): Promise<ApprovalDecisionResult> {
    const { data, error } = await this.supabase.rpc('log_ai_approval_decision', {
      p_interaction_id: params.interactionId,
      p_user_id: params.userId,
      p_decision: params.decision,
      p_content_at_decision: params.contentAtDecision,
      p_decision_rationale: params.decisionRationale || null,
      p_final_version_number: params.finalVersionNumber || null,
      p_risk_level: params.riskLevel || 'low',
      p_risk_factors: JSON.stringify(params.riskFactors || []),
      p_compliance_checks: JSON.stringify(params.complianceChecks || {}),
    });

    if (error) {
      console.error(`[${this.functionName}] Failed to log approval decision:`, error);
      throw new Error(`Failed to log approval decision: ${error.message}`);
    }

    // Get decision details
    const { data: decisionData } = await this.supabase
      .from('ai_approval_decisions')
      .select('decision_time_seconds')
      .eq('id', data)
      .single();

    return {
      decisionId: data,
      decisionTimeSeconds: decisionData?.decision_time_seconds || 0,
    };
  }

  /**
   * Get interaction history for a session
   */
  async getSessionHistory(sessionId: string): Promise<InteractionHistoryItem[]> {
    const { data, error } = await this.supabase
      .from('ai_interaction_logs')
      .select(
        `
        id,
        interaction_type,
        content_type,
        user_prompt,
        ai_response,
        status,
        latency_ms,
        total_tokens,
        created_at,
        completed_at,
        sequence_number
      `
      )
      .eq('session_id', sessionId)
      .order('sequence_number', { ascending: true });

    if (error) {
      console.error(`[${this.functionName}] Failed to get session history:`, error);
      throw new Error(`Failed to get session history: ${error.message}`);
    }

    return data as InteractionHistoryItem[];
  }

  /**
   * Get audit trail for an interaction
   */
  async getAuditTrail(interactionId: string): Promise<AuditTrailItem[]> {
    const { data, error } = await this.supabase
      .from('ai_governance_audit')
      .select(
        `
        id,
        event_type,
        event_data,
        actor_id,
        actor_type,
        occurred_at
      `
      )
      .eq('interaction_id', interactionId)
      .order('occurred_at', { ascending: true });

    if (error) {
      console.error(`[${this.functionName}] Failed to get audit trail:`, error);
      throw new Error(`Failed to get audit trail: ${error.message}`);
    }

    return data as AuditTrailItem[];
  }

  /**
   * Get user edits for an interaction
   */
  async getUserEdits(interactionId: string): Promise<UserEditItem[]> {
    const { data, error } = await this.supabase
      .from('ai_user_edits')
      .select(
        `
        id,
        version_number,
        original_content,
        edited_content,
        change_percentage,
        edit_reason,
        edit_categories,
        edit_duration_seconds,
        created_at
      `
      )
      .eq('interaction_id', interactionId)
      .order('version_number', { ascending: true });

    if (error) {
      console.error(`[${this.functionName}] Failed to get user edits:`, error);
      throw new Error(`Failed to get user edits: ${error.message}`);
    }

    return data as UserEditItem[];
  }

  /**
   * Add custom governance audit event
   */
  async addAuditEvent(
    interactionId: string,
    eventType: string,
    eventData: Record<string, unknown>,
    actorId?: string,
    actorType: 'user' | 'system' | 'ai' = 'system'
  ): Promise<void> {
    const { error } = await this.supabase.from('ai_governance_audit').insert({
      interaction_id: interactionId,
      event_type: eventType,
      event_data: eventData,
      actor_id: actorId || null,
      actor_type: actorType,
    });

    if (error) {
      console.error(`[${this.functionName}] Failed to add audit event:`, error);
      throw new Error(`Failed to add audit event: ${error.message}`);
    }
  }
}

// Response types for history queries
export interface InteractionHistoryItem {
  id: string;
  interaction_type: AIInteractionType;
  content_type: AIContentType;
  user_prompt: string;
  ai_response: string | null;
  status: AIRunStatus;
  latency_ms: number | null;
  total_tokens: number | null;
  created_at: string;
  completed_at: string | null;
  sequence_number: number;
}

export interface AuditTrailItem {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  actor_id: string | null;
  actor_type: 'user' | 'system' | 'ai';
  occurred_at: string;
}

export interface UserEditItem {
  id: string;
  version_number: number;
  original_content: string;
  edited_content: string;
  change_percentage: number;
  edit_reason: string | null;
  edit_categories: string[] | null;
  edit_duration_seconds: number | null;
  created_at: string;
}

/**
 * Factory function to create an AI Interaction Logger
 */
export function createAIInteractionLogger(functionName: string): AIInteractionLogger {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return new AIInteractionLogger(supabaseUrl, serviceRoleKey, functionName);
}

/**
 * Helper to extract client info from request
 */
export function extractClientInfo(req: Request): { ip: string; userAgent: string } {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor
    ? forwardedFor.split(',')[0].trim()
    : req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || '0.0.0.0';

  const userAgent = req.headers.get('user-agent') || 'unknown';

  return { ip, userAgent };
}
