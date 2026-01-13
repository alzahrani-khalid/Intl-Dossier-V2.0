/**
 * TanStack Query Hooks: AI Interaction Logging
 * Feature: ai-interaction-logging
 *
 * Provides hooks for:
 * - Listing AI interactions
 * - Getting interaction details
 * - Logging user edits
 * - Recording approval decisions
 * - Viewing audit trails
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

// Query Key Factory
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

// Query Hooks

/**
 * List AI interactions with filtering and pagination
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
 * Get a single AI interaction with all related data
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
 * Get audit trail for an AI interaction
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
 * Get user edits for an AI interaction
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

// Mutation Hooks

/**
 * Start a new AI interaction
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
 * Complete an AI interaction
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
 * Log a user edit to AI-generated content
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
 * Log an approval decision
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
 * Creates a session and provides methods for logging
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
