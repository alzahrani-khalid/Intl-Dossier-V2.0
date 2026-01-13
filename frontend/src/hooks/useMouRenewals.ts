/**
 * useMouRenewals Hooks
 * Feature: commitment-renewal-workflow
 *
 * TanStack Query hooks for MoU renewal workflow operations including:
 * - Expiring MoUs monitoring
 * - Renewal initiation and management
 * - Expiration alerts
 * - Negotiation tracking
 * - Version history
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import {
  renewalKeys,
  type MouRenewalWithRelations,
  type MouExpirationAlertWithRelations,
  type MouVersionHistory,
  type RenewalNegotiationWithUser,
  type ExpiringMou,
  type InitiateRenewalInput,
  type UpdateRenewalStatusInput,
  type CompleteRenewalInput,
  type AddNegotiationInput,
  type RenewalFilters,
  type AlertFilters,
  type PaginatedResponse,
  type RenewalStatus,
  DEFAULT_PAGE_SIZE,
  DEFAULT_EXPIRY_DAYS_AHEAD,
} from '@/types/mou-renewal.types'

// Re-export for convenience
export { renewalKeys }

// ============================================================================
// Types
// ============================================================================

export interface UseRenewalsOptions extends RenewalFilters {
  enabled?: boolean
}

export interface UseAlertsOptions extends AlertFilters {
  enabled?: boolean
}

export interface UseExpiringMousOptions {
  daysAhead?: number
  includeExpired?: boolean
  enabled?: boolean
}

// ============================================================================
// API Functions
// ============================================================================

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

// ----- Renewals API -----

async function fetchRenewals(
  filters?: RenewalFilters,
): Promise<PaginatedResponse<MouRenewalWithRelations>> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams()

  if (filters?.mou_id) params.append('mou_id', filters.mou_id)
  if (filters?.status) params.append('status', filters.status)
  params.append('page', String(filters?.page || 1))
  params.append('limit', String(filters?.limit || DEFAULT_PAGE_SIZE))

  const response = await fetch(`${FUNCTIONS_URL}/mou-renewals?${params}`, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch renewals')
  }

  return response.json()
}

async function fetchRenewal(renewalId: string): Promise<{ data: MouRenewalWithRelations }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/mou-renewals/${renewalId}`, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch renewal')
  }

  return response.json()
}

async function initiateRenewal(
  input: InitiateRenewalInput,
): Promise<{ message: string; data: MouRenewalWithRelations }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/mou-renewals/initiate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to initiate renewal')
  }

  return response.json()
}

async function updateRenewalStatus(
  input: UpdateRenewalStatusInput,
): Promise<{ message: string; data: MouRenewalWithRelations }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/mou-renewals/status`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update renewal status')
  }

  return response.json()
}

async function completeRenewal(
  input: CompleteRenewalInput,
): Promise<{ message: string; data: MouRenewalWithRelations }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/mou-renewals/complete`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to complete renewal')
  }

  return response.json()
}

// ----- Expiring MoUs API -----

async function fetchExpiringMous(
  daysAhead: number = DEFAULT_EXPIRY_DAYS_AHEAD,
  includeExpired: boolean = false,
): Promise<{ data: ExpiringMou[] }> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams()
  params.append('days_ahead', String(daysAhead))
  if (includeExpired) params.append('include_expired', 'true')

  const response = await fetch(`${FUNCTIONS_URL}/mou-renewals/expiring?${params}`, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch expiring MoUs')
  }

  return response.json()
}

// ----- Alerts API -----

async function fetchAlerts(
  filters?: AlertFilters,
): Promise<PaginatedResponse<MouExpirationAlertWithRelations>> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams()

  if (filters?.mou_id) params.append('mou_id', filters.mou_id)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.type) params.append('type', filters.type)
  params.append('page', String(filters?.page || 1))
  params.append('limit', String(filters?.limit || DEFAULT_PAGE_SIZE))

  const response = await fetch(`${FUNCTIONS_URL}/mou-renewals/alerts?${params}`, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch alerts')
  }

  return response.json()
}

async function acknowledgeAlert(
  alertId: string,
): Promise<{ message: string; data: MouExpirationAlertWithRelations }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/mou-renewals/acknowledge`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ alert_id: alertId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to acknowledge alert')
  }

  return response.json()
}

async function dismissAlert(
  alertId: string,
): Promise<{ message: string; data: MouExpirationAlertWithRelations }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/mou-renewals/alerts/${alertId}`, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to dismiss alert')
  }

  return response.json()
}

// ----- Negotiations API -----

async function fetchNegotiations(
  renewalId: string,
): Promise<{ data: RenewalNegotiationWithUser[] }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/mou-renewals/${renewalId}/negotiations`, {
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch negotiations')
  }

  return response.json()
}

async function addNegotiation(
  input: AddNegotiationInput,
): Promise<{ message: string; data: RenewalNegotiationWithUser }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/mou-renewals/negotiations`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add negotiation')
  }

  return response.json()
}

// ----- Version History API -----

async function fetchVersionChain(mouId: string): Promise<{ data: MouVersionHistory[] }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${FUNCTIONS_URL}/mou-renewals/${mouId}/version-chain`, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch version chain')
  }

  return response.json()
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch renewals list with pagination
 */
export function useRenewals(options?: UseRenewalsOptions) {
  const { enabled = true, ...filters } = options ?? {}

  return useQuery<PaginatedResponse<MouRenewalWithRelations>, Error>({
    queryKey: renewalKeys.list(filters),
    queryFn: () => fetchRenewals(filters),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled,
  })
}

/**
 * Hook to fetch renewals for a specific MoU
 */
export function useMouRenewals(mouId: string, options?: Omit<UseRenewalsOptions, 'mou_id'>) {
  return useRenewals({ ...options, mou_id: mouId, enabled: options?.enabled !== false && !!mouId })
}

/**
 * Hook to fetch a single renewal by ID
 */
export function useRenewal(renewalId: string, options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {}

  return useQuery<MouRenewalWithRelations, Error>({
    queryKey: renewalKeys.detail(renewalId),
    queryFn: async () => {
      const response = await fetchRenewal(renewalId)
      return response.data
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: enabled && !!renewalId,
  })
}

/**
 * Hook to fetch expiring MoUs
 */
export function useExpiringMous(options?: UseExpiringMousOptions) {
  const {
    daysAhead = DEFAULT_EXPIRY_DAYS_AHEAD,
    includeExpired = false,
    enabled = true,
  } = options ?? {}

  return useQuery<ExpiringMou[], Error>({
    queryKey: renewalKeys.expiring(daysAhead),
    queryFn: async () => {
      const response = await fetchExpiringMous(daysAhead, includeExpired)
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled,
  })
}

/**
 * Hook to fetch expiration alerts
 */
export function useExpirationAlerts(options?: UseAlertsOptions) {
  const { enabled = true, ...filters } = options ?? {}

  return useQuery<PaginatedResponse<MouExpirationAlertWithRelations>, Error>({
    queryKey: renewalKeys.alertsList(filters),
    queryFn: () => fetchAlerts(filters),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled,
  })
}

/**
 * Hook to fetch alerts for a specific MoU
 */
export function useMouAlerts(mouId: string, options?: Omit<UseAlertsOptions, 'mou_id'>) {
  return useExpirationAlerts({
    ...options,
    mou_id: mouId,
    enabled: options?.enabled !== false && !!mouId,
  })
}

/**
 * Hook to fetch pending alerts count
 */
export function usePendingAlertsCount() {
  return useQuery<number, Error>({
    queryKey: [...renewalKeys.alerts(), 'pending-count'],
    queryFn: async () => {
      const response = await fetchAlerts({ status: 'pending', limit: 1 })
      return response.pagination.total
    },
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook to fetch negotiations for a renewal
 */
export function useRenewalNegotiations(renewalId: string, options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {}

  return useQuery<RenewalNegotiationWithUser[], Error>({
    queryKey: renewalKeys.negotiations(renewalId),
    queryFn: async () => {
      const response = await fetchNegotiations(renewalId)
      return response.data
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: enabled && !!renewalId,
  })
}

/**
 * Hook to fetch MoU version chain
 */
export function useMouVersionChain(mouId: string, options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {}

  return useQuery<MouVersionHistory[], Error>({
    queryKey: renewalKeys.versionChain(mouId),
    queryFn: async () => {
      const response = await fetchVersionChain(mouId)
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: enabled && !!mouId,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to initiate a new renewal
 */
export function useInitiateRenewal() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('mou-renewals')

  return useMutation<
    { message: string; data: MouRenewalWithRelations },
    Error,
    InitiateRenewalInput
  >({
    mutationFn: initiateRenewal,
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: renewalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: renewalKeys.byMou(variables.mou_id) })
      queryClient.invalidateQueries({ queryKey: renewalKeys.expiring() })
      queryClient.invalidateQueries({ queryKey: renewalKeys.alerts() })
      toast.success(t('success.initiated', 'Renewal initiated successfully'))
    },
    onError: (error) => {
      toast.error(error.message || t('errors.initiateFailed', 'Failed to initiate renewal'))
      console.error('Initiate renewal error:', error)
    },
  })
}

/**
 * Hook to update renewal status
 */
export function useUpdateRenewalStatus() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('mou-renewals')

  return useMutation<
    { message: string; data: MouRenewalWithRelations },
    Error,
    UpdateRenewalStatusInput
  >({
    mutationFn: updateRenewalStatus,
    onSuccess: (response, variables) => {
      queryClient.setQueryData(renewalKeys.detail(variables.renewal_id), response.data)
      queryClient.invalidateQueries({ queryKey: renewalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: renewalKeys.expiring() })
      toast.success(t('success.statusUpdated', 'Renewal status updated'))
    },
    onError: (error) => {
      toast.error(
        error.message || t('errors.statusUpdateFailed', 'Failed to update renewal status'),
      )
      console.error('Update renewal status error:', error)
    },
  })
}

/**
 * Hook to complete a renewal
 */
export function useCompleteRenewal() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('mou-renewals')

  return useMutation<
    { message: string; data: MouRenewalWithRelations },
    Error,
    CompleteRenewalInput
  >({
    mutationFn: completeRenewal,
    onSuccess: (response, variables) => {
      queryClient.setQueryData(renewalKeys.detail(variables.renewal_id), response.data)
      queryClient.invalidateQueries({ queryKey: renewalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: renewalKeys.expiring() })
      queryClient.invalidateQueries({ queryKey: renewalKeys.alerts() })
      // Also invalidate version chain for the new MoU
      queryClient.invalidateQueries({ queryKey: renewalKeys.versionChain(variables.new_mou_id) })
      toast.success(t('success.completed', 'Renewal completed successfully'))
    },
    onError: (error) => {
      toast.error(error.message || t('errors.completeFailed', 'Failed to complete renewal'))
      console.error('Complete renewal error:', error)
    },
  })
}

/**
 * Hook to acknowledge an alert
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('mou-renewals')

  return useMutation<{ message: string; data: MouExpirationAlertWithRelations }, Error, string>({
    mutationFn: acknowledgeAlert,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: renewalKeys.alerts() })
      if (response.data.mou_id) {
        queryClient.invalidateQueries({ queryKey: renewalKeys.alertsByMou(response.data.mou_id) })
      }
      toast.success(t('success.alertAcknowledged', 'Alert acknowledged'))
    },
    onError: (error) => {
      toast.error(error.message || t('errors.acknowledgeFailed', 'Failed to acknowledge alert'))
      console.error('Acknowledge alert error:', error)
    },
  })
}

/**
 * Hook to dismiss an alert
 */
export function useDismissAlert() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('mou-renewals')

  return useMutation<{ message: string; data: MouExpirationAlertWithRelations }, Error, string>({
    mutationFn: dismissAlert,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: renewalKeys.alerts() })
      if (response.data.mou_id) {
        queryClient.invalidateQueries({ queryKey: renewalKeys.alertsByMou(response.data.mou_id) })
      }
      toast.success(t('success.alertDismissed', 'Alert dismissed'))
    },
    onError: (error) => {
      toast.error(error.message || t('errors.dismissFailed', 'Failed to dismiss alert'))
      console.error('Dismiss alert error:', error)
    },
  })
}

/**
 * Hook to add a negotiation entry
 */
export function useAddNegotiation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('mou-renewals')

  return useMutation<
    { message: string; data: RenewalNegotiationWithUser },
    Error,
    AddNegotiationInput
  >({
    mutationFn: addNegotiation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: renewalKeys.negotiations(variables.renewal_id) })
      queryClient.invalidateQueries({ queryKey: renewalKeys.detail(variables.renewal_id) })
      toast.success(t('success.negotiationAdded', 'Negotiation recorded successfully'))
    },
    onError: (error) => {
      toast.error(error.message || t('errors.negotiationFailed', 'Failed to record negotiation'))
      console.error('Add negotiation error:', error)
    },
  })
}

// ============================================================================
// Compound Hooks
// ============================================================================

/**
 * Hook to get MoU renewal dashboard data
 */
export function useMouRenewalDashboard() {
  const expiringMous = useExpiringMous({ daysAhead: 90, includeExpired: true })
  const pendingAlerts = useExpirationAlerts({ status: 'pending', limit: 10 })
  const activeRenewals = useRenewals({ status: 'initiated', limit: 10 })
  const negotiatingRenewals = useRenewals({ status: 'negotiation', limit: 10 })

  return {
    expiringMous,
    pendingAlerts,
    activeRenewals,
    negotiatingRenewals,
    isLoading: expiringMous.isLoading || pendingAlerts.isLoading || activeRenewals.isLoading,
    isError: expiringMous.isError || pendingAlerts.isError || activeRenewals.isError,
  }
}

/**
 * Hook to transition renewal through workflow
 */
export function useRenewalWorkflow(renewalId: string) {
  const renewal = useRenewal(renewalId)
  const updateStatus = useUpdateRenewalStatus()
  const complete = useCompleteRenewal()
  const negotiations = useRenewalNegotiations(renewalId)
  const addNegotiationMutation = useAddNegotiation()

  const transitionTo = async (
    newStatus: RenewalStatus,
    options?: {
      notes_en?: string
      notes_ar?: string
      decline_reason_en?: string
      decline_reason_ar?: string
    },
  ) => {
    return updateStatus.mutateAsync({
      renewal_id: renewalId,
      new_status: newStatus,
      ...options,
    })
  }

  const completeWithNewMou = async (
    newMouId: string,
    options?: {
      terms_changed?: boolean
      terms_change_summary_en?: string
      terms_change_summary_ar?: string
    },
  ) => {
    return complete.mutateAsync({
      renewal_id: renewalId,
      new_mou_id: newMouId,
      ...options,
    })
  }

  const recordNegotiation = async (input: Omit<AddNegotiationInput, 'renewal_id'>) => {
    return addNegotiationMutation.mutateAsync({
      renewal_id: renewalId,
      ...input,
    })
  }

  return {
    renewal,
    negotiations,
    transitionTo,
    completeWithNewMou,
    recordNegotiation,
    isTransitioning: updateStatus.isPending,
    isCompleting: complete.isPending,
    isRecordingNegotiation: addNegotiationMutation.isPending,
  }
}
