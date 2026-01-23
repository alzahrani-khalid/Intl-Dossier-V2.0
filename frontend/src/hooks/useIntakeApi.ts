/**
 * Intake API Hooks
 * @module hooks/useIntakeApi
 * @feature 012-intake-system
 *
 * TanStack Query hooks for intake ticket management with automatic caching,
 * cache invalidation, optimistic updates, and AI-powered triage.
 *
 * @description
 * This module provides a comprehensive set of React hooks for managing intake tickets:
 * - Query hooks for fetching ticket lists, details, and attachments
 * - Mutation hooks for create, update, assign, convert, merge, and close operations
 * - AI-powered triage suggestions for categorization and routing
 * - Duplicate detection for preventing redundant tickets
 * - SLA management with pause/resume capabilities
 * - Health monitoring for AI service availability
 * - Attachment management for ticket evidence and documentation
 *
 * @example
 * // Fetch ticket list with filters
 * const { data, isLoading } = useTicketList({ status: 'open', urgency: 'high' });
 *
 * @example
 * // Create a new intake ticket
 * const { mutate } = useCreateTicket();
 * mutate({
 *   requestType: 'inquiry',
 *   title: 'New inquiry',
 *   description: 'Details...',
 *   urgency: 'normal',
 * });
 *
 * @example
 * // Get AI triage suggestions
 * const { data: suggestions } = useTriageSuggestions('ticket-uuid');
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

/**
 * Query Keys Factory for intake-related queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation.
 *
 * @example
 * // Invalidate all intake queries
 * queryClient.invalidateQueries({ queryKey: intakeKeys.all });
 *
 * @example
 * // Invalidate only ticket list queries
 * queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() });
 *
 * @example
 * // Invalidate specific ticket detail
 * queryClient.invalidateQueries({ queryKey: intakeKeys.ticket('uuid') });
 */
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
 * Hook to create a new intake ticket
 *
 * @description
 * Creates a new intake ticket with automatic triage queueing, SLA timer initiation,
 * and cache invalidation. Transforms camelCase request to snake_case for API.
 *
 * @returns TanStack Mutation result with mutate function accepting CreateTicketRequest
 *
 * @example
 * // Basic usage
 * const { mutate, isPending } = useCreateTicket();
 * mutate({
 *   requestType: 'inquiry',
 *   title: 'New inquiry',
 *   description: 'Details...',
 *   urgency: 'normal',
 * });
 *
 * @example
 * // With dossier link and attachments
 * const { mutate } = useCreateTicket();
 * mutate({
 *   requestType: 'document_request',
 *   title: 'Document request',
 *   urgency: 'high',
 *   dossierId: 'country-uuid',
 *   attachments: [attachmentId1, attachmentId2],
 * });
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
 * Hook to fetch paginated list of intake tickets with filters
 *
 * @description
 * Fetches a paginated list of tickets with optional filtering by status, urgency,
 * assignment, SLA breach status, and date range. Results are cached based on filter parameters.
 *
 * @param filters - Optional filter criteria for tickets
 * @param filters.status - Ticket status filter
 * @param filters.requestType - Type of request filter
 * @param filters.urgency - Urgency level filter
 * @param filters.assignedTo - Filter by assigned user
 * @param filters.slaBreached - Filter by SLA breach status
 * @param filters.page - Page number for pagination
 * @param filters.limit - Items per page
 * @returns TanStack Query result with paginated ticket list
 *
 * @example
 * // Fetch all tickets
 * const { data } = useTicketList();
 *
 * @example
 * // Fetch with filters
 * const { data } = useTicketList({
 *   status: 'open',
 *   urgency: 'high',
 *   slaBreached: true,
 *   page: 1,
 *   limit: 20,
 * });
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
 * Hook to fetch a single ticket by ID with full details
 *
 * @description
 * Fetches complete ticket details including SLA status, triage history, comments,
 * and linked entities. Query is automatically cached and disabled if ticketId is empty.
 *
 * @param ticketId - The unique identifier (UUID) of the ticket to fetch
 * @returns TanStack Query result with data typed as TicketDetailResponse
 *
 * @example
 * // Basic usage
 * const { data, isLoading, error } = useTicket('ticket-uuid');
 *
 * @example
 * // Conditional fetch
 * const { data } = useTicket(ticketId, {
 *   enabled: !!ticketId && hasPermission,
 * });
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
 * Hook to update an existing ticket
 *
 * @description
 * Updates ticket fields with automatic cache invalidation for both detail
 * and list queries. Supports partial updates.
 *
 * @param ticketId - The UUID of the ticket to update
 * @returns TanStack Mutation result with mutate function accepting UpdateTicketRequest
 *
 * @example
 * const { mutate } = useUpdateTicket('ticket-uuid');
 * mutate({ status: 'in_progress', notes: 'Working on it' });
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
 * Hook to fetch AI-powered triage suggestions for a ticket
 *
 * @description
 * Fetches ML-based categorization suggestions including sensitivity level,
 * urgency classification, and recommended assignment. Results are cached
 * for 5 minutes to reduce AI service calls.
 *
 * @param ticketId - The UUID of the ticket to analyze
 * @returns TanStack Query result with triage suggestions
 *
 * @example
 * const { data: suggestions, isLoading } = useTriageSuggestions('ticket-uuid');
 * if (suggestions) {
 *   // Display suggested_sensitivity, suggested_urgency, suggested_assignee
 * }
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
 * Hook to apply triage decision to a ticket
 *
 * @description
 * Applies either AI suggestions or manual override for ticket triage.
 * Invalidates triage suggestions cache and ticket details after success.
 *
 * @param ticketId - The UUID of the ticket being triaged
 * @returns TanStack Mutation result with mutate function accepting ApplyTriageRequest
 *
 * @example
 * const { mutate } = useApplyTriage('ticket-uuid');
 * mutate({
 *   decision_type: 'ai_suggestion',
 *   suggested_sensitivity: 'internal',
 *   suggested_urgency: 'high',
 * });
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
 * Hook to assign a ticket to a user or unit
 *
 * @description
 * Assigns ticket with automatic SLA tracking and notification triggers.
 * Invalidates both ticket detail and list caches.
 *
 * @param ticketId - The UUID of the ticket to assign
 * @returns TanStack Mutation result with mutate function accepting AssignTicketRequest
 *
 * @example
 * const { mutate } = useAssignTicket('ticket-uuid');
 * mutate({ assignedTo: 'user-uuid', assignedUnit: 'unit-uuid' });
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
 * Hook to convert a ticket to another artifact type
 *
 * @description
 * Converts ticket to position, MoU, commitment, or other entity type.
 * Closes the ticket and creates the new artifact atomically.
 *
 * @param ticketId - The UUID of the ticket to convert
 * @returns TanStack Mutation result with artifact ID on success
 *
 * @example
 * const { mutate } = useConvertTicket('ticket-uuid');
 * mutate({ targetType: 'position', metadata: {...} });
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
 * Hook to fetch potential duplicate tickets using vector similarity
 *
 * @description
 * Uses semantic search to find similar tickets based on title and description
 * embeddings. Helps prevent duplicate ticket creation.
 *
 * @param ticketId - The UUID of the ticket to check for duplicates
 * @param threshold - Similarity threshold (0.0-1.0), default 0.65
 * @returns TanStack Query result with duplicate candidates
 *
 * @example
 * const { data } = useDuplicateCandidates('ticket-uuid', 0.7);
 * if (data && data.candidates.length > 0) {
 *   // Show duplicate warning
 * }
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
 * Hook to merge multiple tickets into one primary ticket
 *
 * @description
 * Merges duplicate or related tickets, transferring comments, attachments,
 * and history to the primary ticket. Marks merged tickets as closed.
 *
 * @param ticketId - The UUID of the primary ticket
 * @returns TanStack Mutation result with mutate function accepting MergeTicketsRequest
 *
 * @example
 * const { mutate } = useMergeTickets('primary-ticket-uuid');
 * mutate({ ticketIds: ['dup1-uuid', 'dup2-uuid'], reason: 'Duplicates' });
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
 * Hook to close a ticket with resolution details
 *
 * @description
 * Marks ticket as closed, records resolution notes, and finalizes SLA metrics.
 *
 * @param ticketId - The UUID of the ticket to close
 * @returns TanStack Mutation result with mutate function accepting CloseTicketRequest
 *
 * @example
 * const { mutate } = useCloseTicket('ticket-uuid');
 * mutate({ resolution: 'Resolved via email', resolution_type: 'completed' });
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
 * Hook to upload file attachments for tickets
 *
 * @description
 * Uploads files to Supabase Storage and returns attachment metadata.
 * Supports multiple file types with virus scanning and size validation.
 *
 * @returns TanStack Mutation result with mutate function accepting FormData
 *
 * @example
 * const { mutate, isPending } = useUploadAttachment();
 * const formData = new FormData();
 * formData.append('file', file);
 * formData.append('ticket_id', ticketId);
 * mutate(formData);
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
 * Hook to delete a ticket attachment
 *
 * @description
 * Removes attachment from storage and database. Requires appropriate permissions.
 *
 * @returns TanStack Mutation result with mutate function accepting attachment ID
 *
 * @example
 * const { mutate } = useDeleteAttachment();
 * mutate('attachment-uuid');
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
 * Hook to fetch SLA configuration preview for a ticket
 *
 * @description
 * Retrieves SLA targets (acknowledgment, triage, assignment, resolution) based on
 * urgency, request type, and sensitivity. Falls back to hardcoded defaults if database lookup fails.
 * Results are cached for 5 minutes.
 *
 * @param urgency - Ticket urgency level (critical, high, medium, low)
 * @param requestType - Optional request type for more specific SLA
 * @param sensitivity - Optional sensitivity level for classification-specific SLA
 * @returns TanStack Query result with SLA configuration
 *
 * @example
 * const { data: sla } = useGetSLAPreview('high', 'inquiry', 'internal');
 * if (sla) {
 *   // Display resolutionHours, acknowledgmentMinutes, etc.
 * }
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
 * Hook to pause SLA timer for a ticket
 *
 * @description
 * Pauses SLA countdown for specific stage (acknowledgment, triage, assignment, resolution).
 * Requires valid reason and respects max pause count/duration limits.
 *
 * @param ticketId - The UUID of the ticket
 * @returns TanStack Mutation result accepting slaType and reason
 *
 * @example
 * const { mutate } = usePauseSLA('ticket-uuid');
 * mutate({ slaType: 'resolution', reason: 'Awaiting external input' });
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
 * Hook to resume a paused SLA timer
 *
 * @description
 * Resumes SLA countdown after a pause. Tracks total pause duration for reporting.
 *
 * @param ticketId - The UUID of the ticket
 * @returns TanStack Mutation result accepting slaType
 *
 * @example
 * const { mutate } = useResumeSLA('ticket-uuid');
 * mutate({ slaType: 'resolution' });
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
 * Hook to fetch SLA pause/resume history for a ticket
 *
 * @description
 * Retrieves complete pause history with timestamps, reasons, and durations.
 * Useful for audit trails and SLA reporting.
 *
 * @param ticketId - The UUID of the ticket
 * @returns TanStack Query result with pause history records
 *
 * @example
 * const { data: history } = useSLAPauseHistory('ticket-uuid');
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
 * Hook to monitor intake system health
 *
 * @description
 * Polls intake service health every 30 seconds. Monitors database connectivity,
 * Edge Function availability, and system status.
 *
 * @returns TanStack Query result with health status
 *
 * @example
 * const { data: health } = useHealthCheck();
 * if (health?.status !== 'healthy') {
 *   // Show degraded service banner
 * }
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
 * Hook to monitor AI triage service health
 *
 * @description
 * Polls AI service health every 60 seconds. Monitors embedding model, classification
 * model, and vector store availability. Returns degraded status instead of throwing
 * on errors to prevent UI crashes.
 *
 * @returns TanStack Query result with AI service health status
 *
 * @example
 * const { data: aiHealth } = useAIHealthCheck();
 * if (aiHealth?.fallback_active) {
 *   // Show "AI triage unavailable, using manual triage" message
 * }
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
