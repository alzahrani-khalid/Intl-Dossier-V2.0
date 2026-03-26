/**
 * Intake API Hook
 * @module domains/intake/hooks/useIntakeApi
 *
 * TanStack Query hooks for all intake-related API operations.
 * API calls delegated to intake.repository.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  createTicket as createTicketApi,
  listTickets,
  getTicket as getTicketApi,
  getTriageSuggestions as getTriageSuggestionsApi,
  applyTriage as applyTriageApi,
  assignTicket as assignTicketApi,
  convertTicket as convertTicketApi,
  findDuplicates as findDuplicatesApi,
  mergeTickets as mergeTicketsApi,
  closeTicket as closeTicketApi,
  uploadAttachment as uploadAttachmentApi,
  deleteAttachment as deleteAttachmentApi,
  getIntakeHealth,
  getAIHealth,
} from '../repositories/intake.repository'
import type {
  TicketResponse,
  TicketDetailResponse,
  TicketListResponse,
  CreateTicketRequest,
  UpdateTicketRequest,
  ApplyTriageRequest,
  AssignTicketRequest,
  ConvertTicketRequest,
  MergeTicketsRequest,
  CloseTicketRequest,
  TriageSuggestions,
  DuplicateCandidate,
  Attachment,
} from '@/types/intake'

// Query keys
export const intakeKeys = {
  all: ['intake'] as const,
  tickets: () => [...intakeKeys.all, 'tickets'] as const,
  ticketList: (filters?: Record<string, unknown>) => [...intakeKeys.tickets(), 'list', filters] as const,
  ticket: (id: string) => [...intakeKeys.tickets(), 'detail', id] as const,
  triage: (id: string) => [...intakeKeys.tickets(), 'triage', id] as const,
  duplicates: (id: string) => [...intakeKeys.tickets(), 'duplicates', id] as const,
  attachments: (id: string) => [...intakeKeys.tickets(), 'attachments', id] as const,
  health: () => [...intakeKeys.all, 'health'] as const,
  aiHealth: () => [...intakeKeys.all, 'ai-health'] as const,
}

export const useCreateTicket = (): ReturnType<typeof useMutation> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTicketRequest): Promise<TicketResponse> => {
      const payload = {
        request_type: data.requestType,
        title: data.title,
        title_ar: data.titleAr,
        description: data.description,
        description_ar: data.descriptionAr,
        urgency: data.urgency,
        dossier_id: data.dossierId,
        type_specific_fields: data.typeSpecificFields,
        attachments: data.attachments,
      }
      return createTicketApi(payload) as Promise<TicketResponse>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() })
    },
  })
}

export const useTicket = (ticketId: string): ReturnType<typeof useQuery> => {
  return useQuery({
    queryKey: intakeKeys.ticket(ticketId),
    queryFn: () => getTicketApi(ticketId) as Promise<TicketDetailResponse>,
    enabled: Boolean(ticketId),
  })
}

export const useTriageSuggestions = (ticketId: string): ReturnType<typeof useQuery> => {
  return useQuery({
    queryKey: intakeKeys.triage(ticketId),
    queryFn: () => getTriageSuggestionsApi(ticketId) as Promise<TriageSuggestions>,
    enabled: Boolean(ticketId),
  })
}

export const useApplyTriage = (ticketId: string): ReturnType<typeof useMutation> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ApplyTriageRequest): Promise<unknown> => {
      return applyTriageApi(ticketId, data as unknown as Record<string, unknown>)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: intakeKeys.ticket(ticketId) })
      void queryClient.invalidateQueries({ queryKey: intakeKeys.triage(ticketId) })
    },
  })
}

export const useConvertTicket = (ticketId: string): ReturnType<typeof useMutation> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ConvertTicketRequest): Promise<unknown> => {
      return convertTicketApi({ ...data, ticket_id: ticketId } as unknown as Record<string, unknown>)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() })
    },
  })
}

export const useDuplicateCandidates = (ticketId: string, threshold = 0.65): ReturnType<typeof useQuery> => {
  return useQuery({
    queryKey: intakeKeys.duplicates(ticketId),
    queryFn: () => findDuplicatesApi(ticketId, threshold) as Promise<DuplicateCandidate[]>,
    enabled: Boolean(ticketId),
  })
}

export const useMergeTickets = (ticketId: string): ReturnType<typeof useMutation> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: MergeTicketsRequest): Promise<unknown> => {
      return mergeTicketsApi(data as unknown as Record<string, unknown>)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() })
    },
  })
}

export const useCloseTicket = (ticketId: string): ReturnType<typeof useMutation> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CloseTicketRequest): Promise<unknown> => {
      return closeTicketApi({ ...data, ticket_id: ticketId } as unknown as Record<string, unknown>)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: intakeKeys.ticket(ticketId) })
      void queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() })
    },
  })
}

export const useUploadAttachment = (): ReturnType<typeof useMutation> => {
  return useMutation({
    mutationFn: async (data: Record<string, unknown>): Promise<unknown> => {
      return uploadAttachmentApi(data)
    },
  })
}

export const useDeleteAttachment = (): ReturnType<typeof useMutation> => {
  return useMutation({
    mutationFn: async (attachmentId: string): Promise<unknown> => {
      return deleteAttachmentApi(attachmentId)
    },
  })
}

export interface SLAConfiguration {
  id: string
  urgency: string
  request_type?: string
  sensitivity?: string
  response_hours: number
  resolution_hours: number
  escalation_hours: number
}

export const useGetSLAPreview = (
  urgency: string,
  requestType?: string,
  sensitivity?: string,
): ReturnType<typeof useQuery> => {
  return useQuery({
    queryKey: ['intake', 'sla', urgency, requestType, sensitivity],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('find_sla_configuration', {
        p_urgency: urgency,
        p_request_type: requestType ?? null,
        p_sensitivity: sensitivity ?? null,
      })

      if (error) throw error

      if (data && data.length > 0) {
        return {
          response_hours: data[0].response_hours,
          resolution_hours: data[0].resolution_hours,
          escalation_hours: data[0].escalation_hours,
        }
      }

      // Default SLA based on urgency
      const defaults: Record<string, SLAConfiguration> = {
        critical: { id: 'default', urgency: 'critical', response_hours: 1, resolution_hours: 4, escalation_hours: 2 },
        high: { id: 'default', urgency: 'high', response_hours: 4, resolution_hours: 24, escalation_hours: 8 },
        medium: { id: 'default', urgency: 'medium', response_hours: 8, resolution_hours: 48, escalation_hours: 24 },
        low: { id: 'default', urgency: 'low', response_hours: 24, resolution_hours: 120, escalation_hours: 48 },
      }

      return defaults[urgency] || defaults.medium
    },
    enabled: Boolean(urgency),
  })
}

export const usePauseSLA = (ticketId: string): ReturnType<typeof useMutation> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reason: string): Promise<unknown> => {
      const { data, error } = await supabase.rpc('pause_sla_timer', {
        p_ticket_id: ticketId,
        p_reason: reason,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: intakeKeys.ticket(ticketId) })
    },
  })
}

export const useResumeSLA = (ticketId: string): ReturnType<typeof useMutation> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<unknown> => {
      const { data, error } = await supabase.rpc('resume_sla_timer', {
        p_ticket_id: ticketId,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: intakeKeys.ticket(ticketId) })
    },
  })
}
