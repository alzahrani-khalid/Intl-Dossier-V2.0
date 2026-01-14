/**
 * useComplianceRules Hook
 * Feature: compliance-rules-management
 *
 * TanStack Query hooks for compliance rules, violations,
 * sign-offs, and compliance checking.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  ComplianceRule,
  ComplianceViolation,
  ComplianceSignoff,
  ComplianceRuleTemplate,
  ComplianceExemption,
  CreateComplianceRuleInput,
  UpdateComplianceRuleInput,
  CheckComplianceInput,
  ComplianceCheckResult,
  SignoffViolationInput,
  SignoffResult,
  EntityComplianceSummary,
  ViolationFilters,
  ViolationsListResponse,
  CreateExemptionInput,
  ComplianceEntityType,
} from '@/types/compliance.types'
import { complianceKeys } from '@/types/compliance.types'

const COMPLIANCE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compliance`

/**
 * Helper to make authenticated fetch requests to the compliance edge function
 */
async function complianceFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${COMPLIANCE_FUNCTION_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || error.error || 'Request failed')
  }

  return response.json()
}

// ============================================================================
// Rules Hooks
// ============================================================================

interface ListRulesParams {
  is_active?: boolean
  rule_type?: string
  severity?: string
  entity_type?: string
  page?: number
  limit?: number
}

interface ListRulesResponse {
  rules: ComplianceRule[]
  total_count: number
  page: number
  page_size: number
  has_more: boolean
}

/**
 * Hook to list compliance rules with filters
 */
export function useComplianceRules(params: ListRulesParams = {}) {
  const searchParams = new URLSearchParams()

  if (params.is_active !== undefined) {
    searchParams.set('is_active', String(params.is_active))
  }
  if (params.rule_type) searchParams.set('rule_type', params.rule_type)
  if (params.severity) searchParams.set('severity', params.severity)
  if (params.entity_type) searchParams.set('entity_type', params.entity_type)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))

  const queryString = searchParams.toString()
  const path = `/rules${queryString ? `?${queryString}` : ''}`

  return useQuery({
    queryKey: [...complianceKeys.rules(), params],
    queryFn: () => complianceFetch<ListRulesResponse>(path),
  })
}

/**
 * Hook to get a single compliance rule
 */
export function useComplianceRule(ruleId: string | undefined) {
  return useQuery({
    queryKey: complianceKeys.rule(ruleId || ''),
    queryFn: () => complianceFetch<ComplianceRule>(`/rules/${ruleId}`),
    enabled: !!ruleId,
  })
}

/**
 * Hook to create a compliance rule
 */
export function useCreateComplianceRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateComplianceRuleInput) =>
      complianceFetch<ComplianceRule>('/rules', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.rules() })
    },
  })
}

/**
 * Hook to update a compliance rule
 */
export function useUpdateComplianceRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ruleId, input }: { ruleId: string; input: UpdateComplianceRuleInput }) =>
      complianceFetch<ComplianceRule>(`/rules/${ruleId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.rules() })
      queryClient.invalidateQueries({ queryKey: complianceKeys.rule(variables.ruleId) })
    },
  })
}

/**
 * Hook to deactivate a compliance rule
 */
export function useDeactivateComplianceRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ruleId: string) =>
      complianceFetch<{ success: boolean }>(`/rules/${ruleId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_data, ruleId) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.rules() })
      queryClient.invalidateQueries({ queryKey: complianceKeys.rule(ruleId) })
    },
  })
}

// ============================================================================
// Violations Hooks
// ============================================================================

/**
 * Hook to list violations with filters and pagination
 */
export function useComplianceViolations(filters: ViolationFilters = {}, pageSize = 20) {
  return useInfiniteQuery({
    queryKey: [...complianceKeys.violations(), filters],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams()

      if (filters.entity_type) searchParams.set('entity_type', filters.entity_type)
      if (filters.entity_id) searchParams.set('entity_id', filters.entity_id)
      if (filters.dossier_id) searchParams.set('dossier_id', filters.dossier_id)
      if (filters.severity?.length) searchParams.set('severity', filters.severity.join(','))
      if (filters.status?.length) searchParams.set('status', filters.status.join(','))
      if (filters.requires_signoff) searchParams.set('requires_signoff', 'true')
      searchParams.set('page', String(pageParam))
      searchParams.set('limit', String(pageSize))

      return complianceFetch<ViolationsListResponse>(`/violations?${searchParams.toString()}`)
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.has_more) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
  })
}

/**
 * Hook to get violations for a specific entity
 */
export function useEntityViolations(
  entityType: ComplianceEntityType,
  entityId: string | undefined,
) {
  return useQuery({
    queryKey: complianceKeys.violationsByEntity(entityType, entityId || ''),
    queryFn: () =>
      complianceFetch<ViolationsListResponse>(
        `/violations?entity_type=${entityType}&entity_id=${entityId}`,
      ),
    enabled: !!entityId,
  })
}

/**
 * Hook to get a single violation with details
 */
export function useComplianceViolation(violationId: string | undefined) {
  return useQuery({
    queryKey: complianceKeys.violation(violationId || ''),
    queryFn: () =>
      complianceFetch<ComplianceViolation & { signoffs: ComplianceSignoff[] }>(
        `/violations/${violationId}`,
      ),
    enabled: !!violationId,
  })
}

// ============================================================================
// Compliance Check Hooks
// ============================================================================

/**
 * Hook to run a compliance check for an entity
 */
export function useCheckCompliance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CheckComplianceInput) =>
      complianceFetch<ComplianceCheckResult>('/check', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (_data, variables) => {
      // Invalidate violations for this entity
      queryClient.invalidateQueries({
        queryKey: complianceKeys.violationsByEntity(variables.entity_type, variables.entity_id),
      })
      // Invalidate summary
      queryClient.invalidateQueries({
        queryKey: complianceKeys.summary(variables.entity_type, variables.entity_id),
      })
    },
  })
}

/**
 * Hook to get compliance summary for an entity
 */
export function useEntityComplianceSummary(
  entityType: ComplianceEntityType,
  entityId: string | undefined,
) {
  return useQuery({
    queryKey: complianceKeys.summary(entityType, entityId || ''),
    queryFn: () => complianceFetch<EntityComplianceSummary>(`/summary/${entityType}/${entityId}`),
    enabled: !!entityId,
  })
}

// ============================================================================
// Sign-off Hooks
// ============================================================================

/**
 * Hook to sign off on a violation
 */
export function useSignoffViolation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SignoffViolationInput) =>
      complianceFetch<SignoffResult>('/signoff', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (_data, variables) => {
      // Invalidate the specific violation
      queryClient.invalidateQueries({
        queryKey: complianceKeys.violation(variables.violation_id),
      })
      // Invalidate all violations lists
      queryClient.invalidateQueries({
        queryKey: complianceKeys.violations(),
      })
    },
  })
}

/**
 * Hook to acknowledge a violation (marks as acknowledged without full sign-off)
 */
export function useAcknowledgeViolation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (violationId: string) => {
      const { data, error } = await supabase
        .from('compliance_violations')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', violationId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, violationId) => {
      queryClient.invalidateQueries({
        queryKey: complianceKeys.violation(violationId),
      })
      queryClient.invalidateQueries({
        queryKey: complianceKeys.violations(),
      })
    },
  })
}

// ============================================================================
// Templates Hooks
// ============================================================================

/**
 * Hook to list rule templates
 */
export function useComplianceTemplates() {
  return useQuery({
    queryKey: complianceKeys.templates(),
    queryFn: () => complianceFetch<{ templates: ComplianceRuleTemplate[] }>('/templates'),
    select: (data) => data.templates,
  })
}

/**
 * Hook to create a rule from a template
 */
export function useCreateRuleFromTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (template: ComplianceRuleTemplate) => {
      const input: CreateComplianceRuleInput = {
        rule_code: `${template.template_code}_${Date.now()}`,
        name_en: template.name_en,
        name_ar: template.name_ar,
        description_en: template.description_en,
        description_ar: template.description_ar,
        rule_type: template.rule_type,
        severity: template.default_severity,
        conditions: template.default_conditions,
      }

      return complianceFetch<ComplianceRule>('/rules', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.rules() })
    },
  })
}

// ============================================================================
// Exemptions Hooks
// ============================================================================

/**
 * Hook to list exemptions
 */
export function useComplianceExemptions(
  params: {
    rule_id?: string
    entity_type?: string
    entity_id?: string
    is_active?: boolean
  } = {},
) {
  return useQuery({
    queryKey: [...complianceKeys.exemptions(), params],
    queryFn: async () => {
      let query = supabase
        .from('compliance_exemptions')
        .select('*')
        .order('granted_at', { ascending: false })

      if (params.rule_id) {
        query = query.eq('rule_id', params.rule_id)
      }
      if (params.entity_type) {
        query = query.eq('entity_type', params.entity_type)
      }
      if (params.entity_id) {
        query = query.eq('entity_id', params.entity_id)
      }
      if (params.is_active !== undefined) {
        query = query.eq('is_active', params.is_active)
      }

      const { data, error } = await query

      if (error) throw error
      return data as ComplianceExemption[]
    },
  })
}

/**
 * Hook to create an exemption
 */
export function useCreateExemption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateExemptionInput) =>
      complianceFetch<ComplianceExemption>('/exemptions', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.exemptions() })
    },
  })
}

/**
 * Hook to revoke an exemption
 */
export function useRevokeExemption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ exemptionId, reason }: { exemptionId: string; reason: string }) => {
      const { data, error } = await supabase
        .from('compliance_exemptions')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: (await supabase.auth.getUser()).data.user?.id,
          revocation_reason: reason,
        })
        .eq('id', exemptionId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.exemptions() })
    },
  })
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to get pending violations count for the current user
 */
export function usePendingViolationsCount() {
  return useQuery({
    queryKey: [...complianceKeys.violations(), 'pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('compliance_violations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'acknowledged'])

      if (error) throw error
      return count || 0
    },
    refetchInterval: 60000, // Refresh every minute
  })
}

/**
 * Hook to get blocking violations for an entity (used to prevent actions)
 */
export function useBlockingViolations(
  entityType: ComplianceEntityType,
  entityId: string | undefined,
) {
  return useQuery({
    queryKey: [...complianceKeys.violationsByEntity(entityType, entityId || ''), 'blocking'],
    queryFn: async () => {
      if (!entityId) return []

      const { data, error } = await supabase
        .from('compliance_violations')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('severity', 'blocking')
        .in('status', ['pending', 'acknowledged'])

      if (error) throw error
      return data as ComplianceViolation[]
    },
    enabled: !!entityId,
  })
}

/**
 * Hook to check if an entity can proceed (no blocking violations)
 */
export function useCanProceed(entityType: ComplianceEntityType, entityId: string | undefined) {
  const { data: blockingViolations, isLoading } = useBlockingViolations(entityType, entityId)

  return {
    canProceed: !blockingViolations?.length,
    blockingViolations,
    isLoading,
  }
}
