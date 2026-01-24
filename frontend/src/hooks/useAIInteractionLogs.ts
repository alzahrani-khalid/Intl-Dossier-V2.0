/**
 * AI Interaction Logging Hooks
 * @module hooks/useAIInteractionLogs
 * @feature ai-interaction-logging
 *
 * TanStack Query hooks for comprehensive AI interaction logging, governance, and audit trails.
 *
 * @description
 * This module provides a complete suite of hooks for tracking and auditing AI interactions:
 * - Query hooks for listing, filtering, and viewing AI interactions
 * - Mutation hooks for starting, completing, and logging interactions
 * - User edit tracking with version control and diff analysis
 * - Approval decision recording with risk assessment
 * - Governance audit trails with actor tracking
 * - Session-based interaction management for component-level logging
 *
 * The logging system captures:
 * - Full prompt and response data
 * - Model provider, version, and parameters
 * - Token usage and cost estimation
 * - Context sources and embeddings
 * - Data classification and PII flags
 * - User edits with change percentage
 * - Approval decisions with risk levels
 * - Audit events with timestamps
 *
 * Use these hooks to build AI governance dashboards, track user interactions,
 * measure AI performance, and maintain compliance audit trails.
 *
 * @example
 * // List recent AI interactions
 * const { data } = useAIInteractions({ limit: 20 });
 *
 * @example
 * // Track an AI interaction in a component
 * const session = useAIInteractionSession();
 * await session.startInteraction({
 *   organizationId: 'org-id',
 *   interactionType: 'generation',
 *   contentType: 'brief',
 *   modelProvider: 'openai',
 *   modelName: 'gpt-4',
 *   userPrompt: 'Generate a brief...'
 * });
 * await session.completeInteraction({ status: 'completed', aiResponse: '...' });
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Types matching database enums
export type AIInteractionType =
  | 'generation'
  | 'suggestion'
  | 'classification'
  | 'extraction'
  | 'translation'
  | 'summarization'
  | 'analysis'
  | 'chat'

export type AIContentType =
  | 'brief'
  | 'position'
  | 'summary'
  | 'analysis'
  | 'recommendation'
  | 'entity_link'
  | 'translation'
  | 'extraction'
  | 'chat_response'

export type AIDecisionType =
  | 'approved'
  | 'approved_with_edits'
  | 'rejected'
  | 'revision_requested'
  | 'pending'
  | 'expired'
  | 'auto_approved'

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'vllm' | 'ollama'

export type AIRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export type DataClassification = 'public' | 'internal' | 'confidential' | 'secret'

export type LinkableEntityType =
  | 'dossier'
  | 'position'
  | 'brief'
  | 'person'
  | 'engagement'
  | 'commitment'

// API Response Types
export interface AIInteractionLog {
  id: string
  organization_id: string
  user_id: string
  run_id?: string
  interaction_type: AIInteractionType
  content_type: AIContentType
  target_entity_type?: LinkableEntityType
  target_entity_id?: string
  session_id?: string
  parent_interaction_id?: string
  sequence_number: number
  system_prompt?: string
  user_prompt: string
  prompt_template_id?: string
  prompt_variables?: Record<string, unknown>
  context_sources?: ContextSource[]
  context_token_count?: number
  ai_response?: string
  ai_response_structured?: Record<string, unknown>
  response_token_count?: number
  model_provider: AIProvider
  model_name: string
  model_version?: string
  model_parameters?: Record<string, unknown>
  latency_ms?: number
  total_tokens?: number
  estimated_cost_usd?: number
  data_classification: DataClassification
  contains_pii: boolean
  governance_flags?: Record<string, unknown>
  status: AIRunStatus
  error_message?: string
  created_at: string
  completed_at?: string
  request_ip?: string
  user_agent?: string
  // Nested relations
  ai_user_edits?: AIUserEdit[]
  ai_approval_decisions?: AIApprovalDecision[]
}

export interface ContextSource {
  type: string
  id: string
  snippet?: string
}

export interface AIUserEdit {
  id: string
  interaction_id: string
  user_id: string
  version_number: number
  original_content: string
  edited_content: string
  diff_summary?: Record<string, unknown>
  change_percentage: number
  edit_reason?: string
  edit_categories?: string[]
  edit_duration_seconds?: number
  created_at: string
}

export interface AIApprovalDecision {
  id: string
  interaction_id: string
  decided_by: string
  decision: AIDecisionType
  decision_rationale?: string
  content_at_decision: string
  final_version_number?: number
  risk_level?: 'low' | 'medium' | 'high' | 'critical'
  risk_factors?: Record<string, unknown>[]
  compliance_checks?: Record<string, unknown>
  requires_second_approval: boolean
  second_approver_id?: string
  second_approval_at?: string
  decision_time_seconds: number
  created_at: string
}

export interface AIGovernanceAudit {
  id: string
  interaction_id: string
  event_type: string
  event_data: Record<string, unknown>
  actor_id?: string
  actor_type: 'user' | 'system' | 'ai'
  occurred_at: string
}

// Query Parameters
export interface ListInteractionsParams {
  organizationId?: string
  userId?: string
  interactionType?: AIInteractionType
  contentType?: AIContentType
  status?: AIRunStatus
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

// Mutation Parameters
export interface StartInteractionParams {
  organizationId: string
  interactionType: AIInteractionType
  contentType: AIContentType
  modelProvider: AIProvider
  modelName: string
  userPrompt: string
  systemPrompt?: string
  targetEntityType?: LinkableEntityType
  targetEntityId?: string
  sessionId?: string
  parentInteractionId?: string
  contextSources?: ContextSource[]
  promptVariables?: Record<string, unknown>
  dataClassification?: DataClassification
}

export interface CompleteInteractionParams {
  interactionId: string
  status: AIRunStatus
  aiResponse?: string
  aiResponseStructured?: Record<string, unknown>
  contextTokenCount?: number
  responseTokenCount?: number
  latencyMs?: number
  estimatedCostUsd?: number
  errorMessage?: string
  containsPii?: boolean
  governanceFlags?: Record<string, unknown>
}

export interface LogUserEditParams {
  interactionId: string
  originalContent: string
  editedContent: string
  editReason?: string
  editCategories?: string[]
  editDurationSeconds?: number
}

export interface LogApprovalDecisionParams {
  interactionId: string
  decision: AIDecisionType
  contentAtDecision: string
  decisionRationale?: string
  finalVersionNumber?: number
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  riskFactors?: Record<string, unknown>[]
  complianceChecks?: Record<string, unknown>
}

// API Base URL
const getApiBaseUrl = () => {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-interaction-logs`
}

// Auth Headers Helper
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) {
    throw new Error('Authentication required')
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Query Key Factory for AI interaction logging queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation by scope.
 *
 * @example
 * // Invalidate all AI interaction queries
 * queryClient.invalidateQueries({ queryKey: aiInteractionKeys.all });
 *
 * @example
 * // Invalidate only list queries
 * queryClient.invalidateQueries({ queryKey: aiInteractionKeys.lists() });
 *
 * @example
 * // Invalidate specific interaction detail
 * queryClient.invalidateQueries({ queryKey: aiInteractionKeys.detail('interaction-id') });
 *
 * @example
 * // Invalidate interaction audit trail
 * queryClient.invalidateQueries({ queryKey: aiInteractionKeys.audit('interaction-id') });
 */
export const aiInteractionKeys = {
  all: ['ai-interactions'] as const,
  lists: () => [...aiInteractionKeys.all, 'list'] as const,
  list: (params: ListInteractionsParams) => [...aiInteractionKeys.lists(), params] as const,
  details: () => [...aiInteractionKeys.all, 'detail'] as const,
  detail: (id: string) => [...aiInteractionKeys.details(), id] as const,
  audit: (id: string) => [...aiInteractionKeys.detail(id), 'audit'] as const,
  edits: (id: string) => [...aiInteractionKeys.detail(id), 'edits'] as const,
  session: (sessionId: string) => [...aiInteractionKeys.all, 'session', sessionId] as const,
}

/**
 * Query Hooks
 */

/**
 * Hook to list AI interactions with filtering and pagination
 *
 * @description
 * Fetches a paginated list of AI interactions with optional filtering by:
 * - Organization ID
 * - User ID
 * - Interaction type (generation, suggestion, extraction, etc.)
 * - Content type (brief, position, summary, etc.)
 * - Status (pending, running, completed, failed, cancelled)
 * - Date range
 *
 * Results are cached for 30 seconds and include metadata (total count, pagination info).
 *
 * @param params - Filter and pagination parameters
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with paginated interaction list and metadata
 *
 * @example
 * // List all interactions
 * const { data } = useAIInteractions();
 *
 * @example
 * // Filter by user and type
 * const { data } = useAIInteractions({
 *   userId: 'user-uuid',
 *   interactionType: 'generation',
 *   limit: 50,
 *   offset: 0
 * });
 *
 * @example
 * // Filter by date range
 * const { data } = useAIInteractions({
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31',
 *   status: 'completed'
 * });
 */
export function useAIInteractions(
  params: ListInteractionsParams = {},
  options?: Omit<
    UseQueryOptions<{
      data: AIInteractionLog[]
      metadata: { total: number; limit: number; offset: number }
    }>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: aiInteractionKeys.list(params),
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const queryParams = new URLSearchParams()

      if (params.organizationId) queryParams.set('organization_id', params.organizationId)
      if (params.userId) queryParams.set('user_id', params.userId)
      if (params.interactionType) queryParams.set('interaction_type', params.interactionType)
      if (params.contentType) queryParams.set('content_type', params.contentType)
      if (params.status) queryParams.set('status', params.status)
      if (params.startDate) queryParams.set('start_date', params.startDate)
      if (params.endDate) queryParams.set('end_date', params.endDate)
      if (params.limit) queryParams.set('limit', String(params.limit))
      if (params.offset) queryParams.set('offset', String(params.offset))

      const response = await fetch(`${getApiBaseUrl()}?${queryParams}`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch AI interactions')
      }

      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  })
}

/**
 * Hook to get a single AI interaction with all related data
 *
 * @description
 * Fetches a complete AI interaction log including:
 * - Full prompt and response data
 * - Model provider and configuration
 * - Token usage and cost
 * - Context sources
 * - Nested user edits
 * - Nested approval decisions
 * - Data classification and governance flags
 *
 * Results are cached for 1 minute. Query is disabled if interactionId is undefined.
 *
 * @param interactionId - The UUID of the interaction to fetch
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with interaction data
 *
 * @example
 * const { data, isLoading } = useAIInteraction(interactionId);
 * if (data) {
 *   console.log('Prompt:', data.data.user_prompt);
 *   console.log('Response:', data.data.ai_response);
 *   console.log('Cost:', data.data.estimated_cost_usd);
 * }
 */
export function useAIInteraction(
  interactionId: string | undefined,
  options?: Omit<UseQueryOptions<{ data: AIInteractionLog }>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: aiInteractionKeys.detail(interactionId || ''),
    queryFn: async () => {
      if (!interactionId) throw new Error('Interaction ID required')

      const headers = await getAuthHeaders()
      const response = await fetch(`${getApiBaseUrl()}/${interactionId}`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch AI interaction')
      }

      return response.json()
    },
    enabled: !!interactionId,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  })
}

/**
 * Hook to get governance audit trail for an AI interaction
 *
 * @description
 * Fetches the complete audit trail of governance events for an interaction, including:
 * - Event type (creation, edit, approval, etc.)
 * - Event data (what changed)
 * - Actor ID and type (user, system, ai)
 * - Timestamp
 *
 * Useful for compliance reporting and understanding the full history of an AI interaction.
 * Results are cached for 1 minute.
 *
 * @param interactionId - The UUID of the interaction
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with audit trail events
 *
 * @example
 * const { data } = useAIInteractionAudit(interactionId);
 * data?.data.forEach(event => {
 *   console.log(`${event.event_type} by ${event.actor_type} at ${event.occurred_at}`);
 * });
 */
export function useAIInteractionAudit(
  interactionId: string | undefined,
  options?: Omit<UseQueryOptions<{ data: AIGovernanceAudit[] }>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: aiInteractionKeys.audit(interactionId || ''),
    queryFn: async () => {
      if (!interactionId) throw new Error('Interaction ID required')

      const headers = await getAuthHeaders()
      const response = await fetch(`${getApiBaseUrl()}/${interactionId}/audit`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch audit trail')
      }

      return response.json()
    },
    enabled: !!interactionId,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  })
}

/**
 * Hook to get user edits for an AI interaction
 *
 * @description
 * Fetches all user edits made to an AI-generated response, including:
 * - Version number
 * - Original and edited content
 * - Diff summary
 * - Change percentage
 * - Edit reason and categories
 * - Edit duration
 *
 * Useful for tracking how users modify AI outputs and measuring AI accuracy.
 * Results are cached for 1 minute.
 *
 * @param interactionId - The UUID of the interaction
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns TanStack Query result with user edit history
 *
 * @example
 * const { data } = useAIInteractionEdits(interactionId);
 * data?.data.forEach(edit => {
 *   console.log(`v${edit.version_number}: ${edit.change_percentage}% changed`);
 * });
 */
export function useAIInteractionEdits(
  interactionId: string | undefined,
  options?: Omit<UseQueryOptions<{ data: AIUserEdit[] }>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: aiInteractionKeys.edits(interactionId || ''),
    queryFn: async () => {
      if (!interactionId) throw new Error('Interaction ID required')

      const headers = await getAuthHeaders()
      const response = await fetch(`${getApiBaseUrl()}/${interactionId}/edits`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch user edits')
      }

      return response.json()
    },
    enabled: !!interactionId,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  })
}

/**
 * Mutation Hooks
 */

/**
 * Hook to start a new AI interaction log
 *
 * @description
 * Creates a new AI interaction log record to track an AI request. Should be called
 * at the beginning of any AI operation. Returns an interaction ID that can be used
 * to complete the interaction or log edits/decisions.
 *
 * Automatically invalidates list queries on success to show the new interaction.
 *
 * @param options - Additional TanStack Mutation options
 * @returns TanStack Mutation for starting interactions
 *
 * @example
 * const startMutation = useStartAIInteraction();
 *
 * const interactionId = await startMutation.mutateAsync({
 *   organizationId: 'org-uuid',
 *   interactionType: 'generation',
 *   contentType: 'brief',
 *   modelProvider: 'openai',
 *   modelName: 'gpt-4',
 *   userPrompt: 'Generate a brief about...',
 *   systemPrompt: 'You are a diplomatic brief writer...',
 *   targetEntityType: 'dossier',
 *   targetEntityId: 'dossier-uuid'
 * });
 */
export function useStartAIInteraction(
  options?: UseMutationOptions<
    { interactionId: string; sessionId?: string; sequenceNumber: number },
    Error,
    StartInteractionParams
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: StartInteractionParams) => {
      const headers = await getAuthHeaders()
      const response = await fetch(getApiBaseUrl(), {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start AI interaction')
      }

      const result = await response.json()
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiInteractionKeys.lists() })
    },
    ...options,
  })
}

/**
 * Hook to complete an AI interaction log
 *
 * @description
 * Finalizes an AI interaction log with the response data, token counts, latency,
 * and cost estimation. Should be called after an AI operation completes (successfully
 * or with error).
 *
 * Automatically invalidates both the specific interaction detail and list queries.
 *
 * @param options - Additional TanStack Mutation options
 * @returns TanStack Mutation for completing interactions
 *
 * @example
 * const completeMutation = useCompleteAIInteraction();
 *
 * await completeMutation.mutateAsync({
 *   interactionId: 'interaction-uuid',
 *   status: 'completed',
 *   aiResponse: 'Generated brief content...',
 *   contextTokenCount: 1500,
 *   responseTokenCount: 800,
 *   latencyMs: 3200,
 *   estimatedCostUsd: 0.05
 * });
 */
export function useCompleteAIInteraction(
  options?: UseMutationOptions<{ success: boolean }, Error, CompleteInteractionParams>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CompleteInteractionParams) => {
      const { interactionId, ...body } = params
      const headers = await getAuthHeaders()

      const response = await fetch(`${getApiBaseUrl()}/${interactionId}/complete`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to complete AI interaction')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: aiInteractionKeys.detail(variables.interactionId),
      })
      queryClient.invalidateQueries({ queryKey: aiInteractionKeys.lists() })
    },
    ...options,
  })
}

/**
 * Hook to log user edits to AI-generated content
 *
 * @description
 * Records when a user modifies AI-generated content, tracking:
 * - Version number (auto-incremented)
 * - Original vs edited content
 * - Change percentage (auto-calculated)
 * - Edit reason and categories
 * - Edit duration
 *
 * Useful for measuring AI accuracy and understanding common edit patterns.
 * Automatically invalidates edits and detail queries for the interaction.
 *
 * @param options - Additional TanStack Mutation options
 * @returns TanStack Mutation for logging edits
 *
 * @example
 * const logEditMutation = useLogAIUserEdit();
 *
 * await logEditMutation.mutateAsync({
 *   interactionId: 'interaction-uuid',
 *   originalContent: 'Original AI response...',
 *   editedContent: 'User-edited response...',
 *   editReason: 'Corrected factual error',
 *   editCategories: ['factual_correction', 'tone_adjustment'],
 *   editDurationSeconds: 120
 * });
 */
export function useLogAIUserEdit(
  options?: UseMutationOptions<
    { editId: string; versionNumber: number; changePercentage: number },
    Error,
    LogUserEditParams
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: LogUserEditParams) => {
      const { interactionId, ...body } = params
      const headers = await getAuthHeaders()

      const response = await fetch(`${getApiBaseUrl()}/${interactionId}/edits`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to log user edit')
      }

      const result = await response.json()
      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: aiInteractionKeys.edits(variables.interactionId),
      })
      queryClient.invalidateQueries({
        queryKey: aiInteractionKeys.detail(variables.interactionId),
      })
    },
    ...options,
  })
}

/**
 * Hook to log approval decisions for AI-generated content
 *
 * @description
 * Records approval decisions with risk assessment and compliance checks. Supports:
 * - Multiple decision types (approved, approved_with_edits, rejected, etc.)
 * - Risk levels and factors
 * - Compliance check results
 * - Second approver requirements
 * - Decision time tracking
 *
 * Useful for governance, compliance reporting, and measuring approval rates.
 * Automatically invalidates detail, audit, and list queries.
 *
 * @param options - Additional TanStack Mutation options
 * @returns TanStack Mutation for logging approval decisions
 *
 * @example
 * const logDecisionMutation = useLogAIApprovalDecision();
 *
 * await logDecisionMutation.mutateAsync({
 *   interactionId: 'interaction-uuid',
 *   decision: 'approved_with_edits',
 *   contentAtDecision: 'Final approved content...',
 *   decisionRationale: 'Approved after minor factual corrections',
 *   finalVersionNumber: 2,
 *   riskLevel: 'low',
 *   riskFactors: [{ factor: 'minor_edits', severity: 'low' }]
 * });
 */
export function useLogAIApprovalDecision(
  options?: UseMutationOptions<
    { decisionId: string; decisionTimeSeconds: number },
    Error,
    LogApprovalDecisionParams
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: LogApprovalDecisionParams) => {
      const { interactionId, ...body } = params
      const headers = await getAuthHeaders()

      const response = await fetch(`${getApiBaseUrl()}/${interactionId}/decisions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to log approval decision')
      }

      const result = await response.json()
      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: aiInteractionKeys.detail(variables.interactionId),
      })
      queryClient.invalidateQueries({
        queryKey: aiInteractionKeys.audit(variables.interactionId),
      })
      queryClient.invalidateQueries({ queryKey: aiInteractionKeys.lists() })
    },
    ...options,
  })
}

// Context hook for tracking interactions in components
export interface AIInteractionContext {
  sessionId: string
  interactionId?: string
  startInteraction: (params: Omit<StartInteractionParams, 'sessionId'>) => Promise<string>
  completeInteraction: (params: Omit<CompleteInteractionParams, 'interactionId'>) => Promise<void>
  logEdit: (params: Omit<LogUserEditParams, 'interactionId'>) => Promise<void>
  logDecision: (params: Omit<LogApprovalDecisionParams, 'interactionId'>) => Promise<void>
}

/**
 * Hook for managing AI interaction logging within a component
 *
 * @description
 * Provides a convenient session-based API for logging AI interactions within a single
 * component or feature. Automatically manages:
 * - Session ID generation
 * - Current interaction tracking
 * - Simplified method calls (no need to pass interactionId/sessionId repeatedly)
 * - Combined loading and error states
 *
 * This hook is ideal for components that need to log a complete AI interaction
 * lifecycle without manually tracking interaction IDs and session context.
 *
 * @returns Session context with simplified logging methods
 *
 * @example
 * function BriefGenerator() {
 *   const session = useAIInteractionSession();
 *
 *   const handleGenerate = async () => {
 *     // Start logging
 *     await session.startInteraction({
 *       organizationId: orgId,
 *       interactionType: 'generation',
 *       contentType: 'brief',
 *       modelProvider: 'openai',
 *       modelName: 'gpt-4',
 *       userPrompt: promptText
 *     });
 *
 *     // Generate content...
 *     const response = await generateBrief(promptText);
 *
 *     // Complete logging
 *     await session.completeInteraction({
 *       status: 'completed',
 *       aiResponse: response,
 *       latencyMs: 3000
 *     });
 *
 *     // Log user edit (if applicable)
 *     if (userEdited) {
 *       await session.logEdit({
 *         originalContent: response,
 *         editedContent: editedResponse,
 *         editReason: 'User refinement'
 *       });
 *     }
 *
 *     // Log approval decision
 *     await session.logDecision({
 *       decision: 'approved',
 *       contentAtDecision: finalContent
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleGenerate} disabled={session.isLoading}>
 *         Generate Brief
 *       </button>
 *       {session.error && <ErrorMessage>{session.error.message}</ErrorMessage>}
 *     </div>
 *   );
 * }
 */
export function useAIInteractionSession() {
  const sessionId = crypto.randomUUID()
  const startMutation = useStartAIInteraction()
  const completeMutation = useCompleteAIInteraction()
  const editMutation = useLogAIUserEdit()
  const decisionMutation = useLogAIApprovalDecision()

  let currentInteractionId: string | undefined

  const startInteraction = async (
    params: Omit<StartInteractionParams, 'sessionId'>,
  ): Promise<string> => {
    const result = await startMutation.mutateAsync({
      ...params,
      sessionId,
    })
    currentInteractionId = result.interactionId
    return result.interactionId
  }

  const completeInteraction = async (
    params: Omit<CompleteInteractionParams, 'interactionId'>,
  ): Promise<void> => {
    if (!currentInteractionId) {
      throw new Error('No active interaction to complete')
    }
    await completeMutation.mutateAsync({
      ...params,
      interactionId: currentInteractionId,
    })
  }

  const logEdit = async (params: Omit<LogUserEditParams, 'interactionId'>): Promise<void> => {
    if (!currentInteractionId) {
      throw new Error('No active interaction for logging edit')
    }
    await editMutation.mutateAsync({
      ...params,
      interactionId: currentInteractionId,
    })
  }

  const logDecision = async (
    params: Omit<LogApprovalDecisionParams, 'interactionId'>,
  ): Promise<void> => {
    if (!currentInteractionId) {
      throw new Error('No active interaction for logging decision')
    }
    await decisionMutation.mutateAsync({
      ...params,
      interactionId: currentInteractionId,
    })
  }

  return {
    sessionId,
    interactionId: currentInteractionId,
    startInteraction,
    completeInteraction,
    logEdit,
    logDecision,
    isLoading:
      startMutation.isPending ||
      completeMutation.isPending ||
      editMutation.isPending ||
      decisionMutation.isPending,
    error:
      startMutation.error || completeMutation.error || editMutation.error || decisionMutation.error,
  }
}
