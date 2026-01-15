/**
 * Entity Dependencies Hook
 * Feature: entity-dependency-impact
 *
 * Custom hook for managing entity dependency data and impact assessments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabaseClient, useSession } from '@/lib/supabase'
import type {
  DependencyGraph,
  ImpactAssessment,
  ImpactSummary,
  DependencyRule,
  CreateAssessmentRequest,
  UpdateAssessmentRequest,
  AssessmentListParams,
  AssessmentListResponse,
} from '@/types/entity-dependency.types'

const FUNCTION_BASE_URL = '/functions/v1/entity-dependencies'

// ============================================================================
// Query Keys
// ============================================================================

export const entityDependencyKeys = {
  all: ['entity-dependencies'] as const,
  graph: (entityId: string) => [...entityDependencyKeys.all, 'graph', entityId] as const,
  summary: (entityId: string) => [...entityDependencyKeys.all, 'summary', entityId] as const,
  assessments: (params?: AssessmentListParams) =>
    [...entityDependencyKeys.all, 'assessments', params] as const,
  assessment: (id: string) => [...entityDependencyKeys.all, 'assessment', id] as const,
  rules: () => [...entityDependencyKeys.all, 'rules'] as const,
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchDependencyGraph(
  supabase: ReturnType<typeof useSupabaseClient>,
  entityId: string,
  maxDepth: number = 3,
  includeTransitive: boolean = true,
): Promise<DependencyGraph> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const response = await fetch(
    `${supabase.supabaseUrl}${FUNCTION_BASE_URL}/graph/${entityId}?max_depth=${maxDepth}&include_transitive=${includeTransitive}`,
    {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch dependency graph')
  }

  const result = await response.json()
  return result.data
}

async function fetchImpactSummary(
  supabase: ReturnType<typeof useSupabaseClient>,
  entityId: string,
): Promise<ImpactSummary> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const response = await fetch(`${supabase.supabaseUrl}${FUNCTION_BASE_URL}/summary/${entityId}`, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch impact summary')
  }

  const result = await response.json()
  return result.data
}

async function createAssessment(
  supabase: ReturnType<typeof useSupabaseClient>,
  request: CreateAssessmentRequest,
): Promise<ImpactAssessment> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const response = await fetch(`${supabase.supabaseUrl}${FUNCTION_BASE_URL}/assess`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create impact assessment')
  }

  const result = await response.json()
  return result.data
}

async function fetchAssessments(
  supabase: ReturnType<typeof useSupabaseClient>,
  params?: AssessmentListParams,
): Promise<AssessmentListResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const queryParams = new URLSearchParams()
  if (params?.entity_id) queryParams.set('entity_id', params.entity_id)
  if (params?.status) queryParams.set('status', params.status)
  if (params?.severity) queryParams.set('severity', params.severity)
  if (params?.limit) queryParams.set('limit', params.limit.toString())
  if (params?.offset) queryParams.set('offset', params.offset.toString())

  const response = await fetch(
    `${supabase.supabaseUrl}${FUNCTION_BASE_URL}/assessments?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch assessments')
  }

  return response.json()
}

async function fetchAssessment(
  supabase: ReturnType<typeof useSupabaseClient>,
  id: string,
): Promise<ImpactAssessment> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const response = await fetch(`${supabase.supabaseUrl}${FUNCTION_BASE_URL}/assessments/${id}`, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch assessment')
  }

  const result = await response.json()
  return result.data
}

async function updateAssessment(
  supabase: ReturnType<typeof useSupabaseClient>,
  id: string,
  request: UpdateAssessmentRequest,
): Promise<ImpactAssessment> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const response = await fetch(`${supabase.supabaseUrl}${FUNCTION_BASE_URL}/assessments/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update assessment')
  }

  const result = await response.json()
  return result.data
}

async function fetchDependencyRules(
  supabase: ReturnType<typeof useSupabaseClient>,
): Promise<DependencyRule[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const response = await fetch(`${supabase.supabaseUrl}${FUNCTION_BASE_URL}/rules`, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch dependency rules')
  }

  const result = await response.json()
  return result.data
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch the dependency graph for an entity
 */
export function useDependencyGraph(
  entityId: string | undefined,
  options?: {
    maxDepth?: number
    includeTransitive?: boolean
    enabled?: boolean
  },
) {
  const supabase = useSupabaseClient()
  const session = useSession()

  return useQuery({
    queryKey: entityDependencyKeys.graph(entityId || ''),
    queryFn: () =>
      fetchDependencyGraph(
        supabase,
        entityId!,
        options?.maxDepth ?? 3,
        options?.includeTransitive ?? true,
      ),
    enabled: !!entityId && !!session && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch impact summary for an entity
 */
export function useImpactSummary(entityId: string | undefined, enabled: boolean = true) {
  const supabase = useSupabaseClient()
  const session = useSession()

  return useQuery({
    queryKey: entityDependencyKeys.summary(entityId || ''),
    queryFn: () => fetchImpactSummary(supabase, entityId!),
    enabled: !!entityId && !!session && enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook to list impact assessments
 */
export function useAssessments(params?: AssessmentListParams) {
  const supabase = useSupabaseClient()
  const session = useSession()

  return useQuery({
    queryKey: entityDependencyKeys.assessments(params),
    queryFn: () => fetchAssessments(supabase, params),
    enabled: !!session,
    staleTime: 1000 * 60, // 1 minute
  })
}

/**
 * Hook to fetch a single assessment
 */
export function useAssessment(id: string | undefined, enabled: boolean = true) {
  const supabase = useSupabaseClient()
  const session = useSession()

  return useQuery({
    queryKey: entityDependencyKeys.assessment(id || ''),
    queryFn: () => fetchAssessment(supabase, id!),
    enabled: !!id && !!session && enabled,
    staleTime: 1000 * 60, // 1 minute
  })
}

/**
 * Hook to create an impact assessment
 */
export function useCreateAssessment() {
  const supabase = useSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateAssessmentRequest) => createAssessment(supabase, request),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: entityDependencyKeys.assessments() })
      queryClient.invalidateQueries({
        queryKey: entityDependencyKeys.summary(data.source_entity_id),
      })
    },
  })
}

/**
 * Hook to update an assessment status
 */
export function useUpdateAssessment() {
  const supabase = useSupabaseClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...request }: UpdateAssessmentRequest & { id: string }) =>
      updateAssessment(supabase, id, request),
    onSuccess: (data) => {
      // Update the cached assessment
      queryClient.setQueryData(entityDependencyKeys.assessment(data.id), data)
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: entityDependencyKeys.assessments() })
    },
  })
}

/**
 * Hook to fetch dependency rules
 */
export function useDependencyRules() {
  const supabase = useSupabaseClient()
  const session = useSession()

  return useQuery({
    queryKey: entityDependencyKeys.rules(),
    queryFn: () => fetchDependencyRules(supabase),
    enabled: !!session,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Helper hook to simulate an impact assessment without persisting
 */
export function useSimulateImpact(entityId: string | undefined) {
  const { data: graph, isLoading, error } = useDependencyGraph(entityId)

  const simulateChange = (changeType: string) => {
    if (!graph) return null

    // Calculate simulated severity based on dependencies
    const directCount = graph.stats.direct_dependencies
    const transitiveCount = graph.stats.transitive_dependencies
    const totalAffected = directCount + transitiveCount

    let simulatedSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none' = 'none'

    if (changeType === 'delete') {
      if (totalAffected > 10) simulatedSeverity = 'critical'
      else if (totalAffected > 5) simulatedSeverity = 'high'
      else if (totalAffected > 0) simulatedSeverity = 'medium'
    } else if (changeType === 'status_change' || changeType === 'relationship_remove') {
      if (totalAffected > 10) simulatedSeverity = 'high'
      else if (totalAffected > 0) simulatedSeverity = 'medium'
    } else if (changeType === 'update') {
      if (totalAffected > 5) simulatedSeverity = 'low'
    }

    return {
      totalAffected,
      simulatedSeverity,
      directCount,
      transitiveCount,
      graph,
    }
  }

  return {
    simulateChange,
    isLoading,
    error,
    graph,
  }
}
