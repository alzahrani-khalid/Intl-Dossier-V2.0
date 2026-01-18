/**
 * TanStack Query hooks for Intake API
 *
 * Provides React hooks for all intake-related API operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import {
  IntakeFormData,
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
} from '../types/intake'

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

// Query keys
export const intakeKeys = {
  all: ['intake'] as const,
  tickets: () => [...intakeKeys.all, 'tickets'] as const,
  ticketList: (filters?: any) => [...intakeKeys.tickets(), 'list', filters] as const,
  ticket: (id: string) => [...intakeKeys.tickets(), 'detail', id] as const,
  triage: (id: string) => [...intakeKeys.tickets(), 'triage', id] as const,
  duplicates: (id: string) => [...intakeKeys.tickets(), 'duplicates', id] as const,
  attachments: (id: string) => [...intakeKeys.tickets(), 'attachments', id] as const,
  health: () => [...intakeKeys.all, 'health'] as const,
  aiHealth: () => [...intakeKeys.all, 'ai-health'] as const,
}

// Helper to get auth headers
const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('No active session')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  }
}

/**
 * Create Ticket
 */
export const useCreateTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTicketRequest): Promise<TicketResponse> => {
      const headers = await getAuthHeaders()

      // Transform camelCase to snake_case for API
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

      const response = await fetch(`${API_BASE_URL}/intake-tickets-create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create ticket')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() })
    },
  })
}

/**
 * List Tickets
 */
export const useTicketList = (filters?: {
  status?: string
  requestType?: string
  sensitivity?: string
  urgency?: string
  assignedTo?: string
  assignedUnit?: string
  slaBreached?: boolean
  createdAfter?: string
  createdBefore?: string
  page?: number
  limit?: number
}) => {
  return useQuery({
    queryKey: intakeKeys.ticketList(filters),
    queryFn: async (): Promise<TicketListResponse> => {
      const headers = await getAuthHeaders()
      const params = new URLSearchParams()

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
      }

      const response = await fetch(`${API_BASE_URL}/intake-tickets-list?${params.toString()}`, {
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch tickets')
      }

      return response.json()
    },
  })
}

/**
 * Get Ticket Detail
 */
export const useTicket = (ticketId: string) => {
  return useQuery({
    queryKey: intakeKeys.ticket(ticketId),
    queryFn: async (): Promise<TicketDetailResponse> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/intake-tickets-get?id=${ticketId}`, {
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch ticket')
      }

      return response.json()
    },
    enabled: !!ticketId,
  })
}

/**
 * Update Ticket
 */
export const useUpdateTicket = (ticketId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateTicketRequest): Promise<TicketResponse> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/intake-tickets-update`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id: ticketId, ...data }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update ticket')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.ticket(ticketId) })
      queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() })
    },
  })
}

/**
 * Get Triage Suggestions
 */
export const useTriageSuggestions = (ticketId: string) => {
  return useQuery({
    queryKey: intakeKeys.triage(ticketId),
    queryFn: async (): Promise<TriageSuggestions> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/intake-tickets-triage/${ticketId}/triage`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch triage suggestions')
      }

      return response.json()
    },
    enabled: !!ticketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Apply Triage
 */
export const useApplyTriage = (ticketId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ApplyTriageRequest): Promise<TicketResponse> => {
      const headers = await getAuthHeaders()

      // Transform decision_type to action as expected by the Edge Function
      const action = data.decision_type === 'ai_suggestion' ? 'accept' : 'override'

      const requestBody = {
        action,
        sensitivity: data.suggested_sensitivity,
        urgency: data.suggested_urgency,
        assigned_to: data.suggested_assignee,
        assigned_unit: data.suggested_unit,
        override_reason: data.override_reason,
        override_reason_ar: data.override_reason_ar,
      }

      const response = await fetch(`${API_BASE_URL}/intake-tickets-triage/${ticketId}/triage`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to apply triage')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.ticket(ticketId) })
      queryClient.invalidateQueries({ queryKey: intakeKeys.triage(ticketId) })
      queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() })
    },
  })
}

/**
 * Assign Ticket
 */
export const useAssignTicket = (ticketId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AssignTicketRequest): Promise<TicketResponse> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/intake-tickets-assign`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: ticketId, ...data }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to assign ticket')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.ticket(ticketId) })
      queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() })
    },
  })
}

/**
 * Convert Ticket
 */
export const useConvertTicket = (ticketId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      data: ConvertTicketRequest,
    ): Promise<{ success: boolean; artifactId: string }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/intake-tickets-convert`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: ticketId, ...data }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to convert ticket')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.ticket(ticketId) })
      queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() })
    },
  })
}

/**
 * Get Duplicate Candidates
 */
export const useDuplicateCandidates = (ticketId: string, threshold = 0.65) => {
  return useQuery({
    queryKey: intakeKeys.duplicates(ticketId),
    queryFn: async (): Promise<{ candidates: DuplicateCandidate[] }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_BASE_URL}/intake-tickets-duplicates?id=${ticketId}&threshold=${threshold}`,
        { headers },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch duplicates')
      }

      return response.json()
    },
    enabled: !!ticketId,
  })
}

/**
 * Merge Tickets
 */
export const useMergeTickets = (ticketId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: MergeTicketsRequest): Promise<TicketResponse> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/intake-tickets-merge`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: ticketId, ...data }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to merge tickets')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() })
    },
  })
}

/**
 * Close Ticket
 */
export const useCloseTicket = (ticketId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CloseTicketRequest): Promise<TicketResponse> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/intake-tickets-close`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: ticketId, ...data }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to close ticket')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.ticket(ticketId) })
      queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() })
    },
  })
}

/**
 * Upload Attachment
 */
export const useUploadAttachment = () => {
  return useMutation({
    mutationFn: async (formData: FormData): Promise<Attachment> => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`${API_BASE_URL}/intake-tickets-attachments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to upload attachment')
      }

      return response.json()
    },
  })
}

/**
 * Delete Attachment
 */
export const useDeleteAttachment = () => {
  return useMutation({
    mutationFn: async (attachmentId: string): Promise<void> => {
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_BASE_URL}/intake-tickets-attachments?id=${attachmentId}`,
        {
          method: 'DELETE',
          headers,
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete attachment')
      }
    },
  })
}

/**
 * SLA Configuration type
 */
export interface SLAConfiguration {
  id: string
  name: string
  name_ar: string | null
  acknowledgment_target_minutes: number
  triage_target_minutes: number
  assignment_target_minutes: number
  resolution_target_minutes: number
  business_hours_only: boolean
  business_hours_start: string
  business_hours_end: string
  business_days: number[]
  warning_threshold_percent: number
  critical_threshold_percent: number
  allow_pause: boolean
  max_pause_count: number | null
  max_total_pause_minutes: number | null
}

/**
 * Get SLA Preview - Database-driven SLA configuration
 */
export const useGetSLAPreview = (urgency: string, requestType?: string, sensitivity?: string) => {
  return useQuery({
    queryKey: ['sla-preview', urgency, requestType, sensitivity],
    queryFn: async (): Promise<{
      acknowledgmentMinutes: number
      triageMinutes: number
      assignmentMinutes: number
      resolutionMinutes: number
      resolutionHours: number
      businessHoursOnly: boolean
      config: SLAConfiguration | null
    }> => {
      // Fetch from database using the find_sla_configuration function
      const { data, error } = await supabase.rpc('find_sla_configuration', {
        p_request_type: requestType || null,
        p_urgency: urgency,
        p_sensitivity: sensitivity || null,
      })

      if (error || !data) {
        // Fallback to hardcoded defaults if database query fails
        console.warn('SLA config lookup failed, using fallback:', error)
        const slaMap = {
          critical: {
            acknowledgmentMinutes: 15,
            triageMinutes: 30,
            assignmentMinutes: 60,
            resolutionMinutes: 240,
            resolutionHours: 4,
            businessHoursOnly: false,
            config: null,
          },
          high: {
            acknowledgmentMinutes: 30,
            triageMinutes: 60,
            assignmentMinutes: 120,
            resolutionMinutes: 480,
            resolutionHours: 8,
            businessHoursOnly: true,
            config: null,
          },
          medium: {
            acknowledgmentMinutes: 60,
            triageMinutes: 120,
            assignmentMinutes: 240,
            resolutionMinutes: 1440,
            resolutionHours: 24,
            businessHoursOnly: true,
            config: null,
          },
          low: {
            acknowledgmentMinutes: 120,
            triageMinutes: 240,
            assignmentMinutes: 480,
            resolutionMinutes: 2880,
            resolutionHours: 48,
            businessHoursOnly: true,
            config: null,
          },
        }
        return slaMap[urgency as keyof typeof slaMap] || slaMap.medium
      }

      const config = data as SLAConfiguration
      return {
        acknowledgmentMinutes: config.acknowledgment_target_minutes,
        triageMinutes: config.triage_target_minutes,
        assignmentMinutes: config.assignment_target_minutes,
        resolutionMinutes: config.resolution_target_minutes,
        resolutionHours: Math.round(config.resolution_target_minutes / 60),
        businessHoursOnly: config.business_hours_only,
        config,
      }
    },
    enabled: !!urgency,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

/**
 * Pause SLA for a ticket
 */
export const usePauseSLA = (ticketId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      slaType,
      reason,
    }: {
      slaType: 'acknowledgment' | 'triage' | 'assignment' | 'resolution'
      reason?: string
    }): Promise<boolean> => {
      const { data, error } = await supabase.rpc('pause_ticket_sla', {
        p_ticket_id: ticketId,
        p_sla_type: slaType,
        p_reason: reason || null,
      })

      if (error) {
        throw new Error(error.message || 'Failed to pause SLA')
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.ticket(ticketId) })
    },
  })
}

/**
 * Resume SLA for a ticket
 */
export const useResumeSLA = (ticketId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      slaType,
    }: {
      slaType: 'acknowledgment' | 'triage' | 'assignment' | 'resolution'
    }): Promise<boolean> => {
      const { data, error } = await supabase.rpc('resume_ticket_sla', {
        p_ticket_id: ticketId,
        p_sla_type: slaType,
      })

      if (error) {
        throw new Error(error.message || 'Failed to resume SLA')
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.ticket(ticketId) })
    },
  })
}

/**
 * Get SLA pause history for a ticket
 */
export const useSLAPauseHistory = (ticketId: string) => {
  return useQuery({
    queryKey: ['sla-pause-history', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sla_pause_history')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message || 'Failed to fetch SLA pause history')
      }

      return data
    },
    enabled: !!ticketId,
  })
}

/**
 * Health Check
 */
export const useHealthCheck = () => {
  return useQuery({
    queryKey: intakeKeys.health(),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/intake-health`)
      if (!response.ok) {
        throw new Error('Health check failed')
      }
      return response.json()
    },
    refetchInterval: 30000, // 30 seconds
  })
}

/**
 * AI Health Check
 */
export const useAIHealthCheck = () => {
  return useQuery({
    queryKey: intakeKeys.aiHealth(),
    queryFn: async () => {
      // AI health check is public - no auth required
      const response = await fetch(`${API_BASE_URL}/intake-ai-health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // Return a degraded status instead of throwing
        return {
          status: 'unhealthy',
          services: {
            embedding_model: false,
            classification_model: false,
            vector_store: false,
          },
          fallback_active: true,
          last_success: null,
          timestamp: new Date().toISOString(),
        }
      }
      return response.json()
    },
    refetchInterval: 60000, // 60 seconds
    retry: false, // Don't retry health checks
  })
}
