/**
 * Waiting Queue Actions Hook
 * @module domains/intake/hooks/useWaitingQueueActions
 *
 * Hooks for waiting queue reminder and escalation actions.
 * API calls delegated to intake.repository.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  sendReminder as sendReminderApi,
  sendBulkReminders as sendBulkRemindersApi,
  getReminderJobStatus as getReminderJobStatusApi,
  escalateAssignment as escalateAssignmentApi,
  acknowledgeEscalation as acknowledgeEscalationApi,
  resolveEscalation as resolveEscalationApi,
} from '../repositories/intake.repository'
import type { Assignment } from '@/components/waiting-queue/AssignmentDetailsModal'

// ============================================================================
// Assignment Details (uses Supabase directly, not API)
// ============================================================================

function useAssignmentDetails(assignmentId: string | null): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: ['assignment-details', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return null

      const { data, error } = await supabase
        .from('work_item_assignments')
        .select('*, work_items(*), profiles(*)')
        .eq('id', assignmentId)
        .single()

      if (error) throw error
      return data
    },
    enabled: Boolean(assignmentId),
  })
}

// ============================================================================
// Reminder Actions
// ============================================================================

export interface ReminderAPIError {
  error: string
  details?: string
  code?: string
}

export interface SendReminderResponse {
  success: boolean
  message?: string
  reminder_id?: string
}

export function useReminderAction(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, unknown>): Promise<SendReminderResponse> => {
      return sendReminderApi(data) as Promise<SendReminderResponse>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['waiting-queue'] })
    },
  })
}

// ============================================================================
// Bulk Reminder Actions
// ============================================================================

export interface BulkReminderJob {
  job_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total: number
  sent: number
  failed: number
}

export interface SendBulkRemindersResponse {
  success: boolean
  job_id: string
  total: number
}

export function useBulkReminderAction(): ReturnType<typeof useMutation> {
  return useMutation({
    mutationFn: async (data: Record<string, unknown>): Promise<SendBulkRemindersResponse> => {
      return sendBulkRemindersApi(data) as Promise<SendBulkRemindersResponse>
    },
  })
}

export function useBulkReminderJobStatus(jobId: string | null, enabled = true): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: ['bulk-reminder-status', jobId],
    queryFn: () => getReminderJobStatusApi(jobId!) as Promise<BulkReminderJob>,
    enabled: enabled && Boolean(jobId),
    refetchInterval: 2000,
  })
}

// ============================================================================
// Escalation Actions
// ============================================================================

export interface EscalateAssignmentRequest {
  assignment_id: string
  reason: string
  escalation_level?: number
}

export interface EscalateAssignmentResponse {
  success: boolean
  escalation_id: string
}

export interface EscalationAPIError {
  error: string
  details?: string
}

export function useEscalationAction(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: EscalateAssignmentRequest): Promise<EscalateAssignmentResponse> => {
      return escalateAssignmentApi(data as unknown as Record<string, unknown>) as Promise<EscalateAssignmentResponse>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['waiting-queue'] })
    },
  })
}

function useAcknowledgeEscalation(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (escalationId: string): Promise<unknown> => {
      return acknowledgeEscalationApi(escalationId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['waiting-queue'] })
    },
  })
}

function useResolveEscalation(): ReturnType<typeof useMutation> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      escalationId: string
      data: Record<string, unknown>
    }): Promise<unknown> => {
      return resolveEscalationApi(params.escalationId, params.data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['waiting-queue'] })
    },
  })
}

export { useAssignmentDetails, useAcknowledgeEscalation, useResolveEscalation }
