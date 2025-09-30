/**
 * TanStack Query hooks for Intake API
 *
 * Provides React hooks for all intake-related API operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
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
} from '../types/intake';

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

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
};

// Helper to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
};

/**
 * Create Ticket
 */
export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTicketRequest): Promise<TicketResponse> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/intake-tickets-create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create ticket');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() });
    },
  });
};

/**
 * List Tickets
 */
export const useTicketList = (filters?: {
  status?: string;
  requestType?: string;
  sensitivity?: string;
  urgency?: string;
  assignedTo?: string;
  assignedUnit?: string;
  slaBreached?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: intakeKeys.ticketList(filters),
    queryFn: async (): Promise<TicketListResponse> => {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }

      const response = await fetch(
        `${API_BASE_URL}/intake-tickets-list?${params.toString()}`,
        { headers }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch tickets');
      }

      return response.json();
    },
  });
};

/**
 * Get Ticket Detail
 */
export const useTicket = (ticketId: string) => {
  return useQuery({
    queryKey: intakeKeys.ticket(ticketId),
    queryFn: async (): Promise<TicketDetailResponse> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/intake-tickets-get?id=${ticketId}`, {
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch ticket');
      }

      return response.json();
    },
    enabled: !!ticketId,
  });
};

/**
 * Update Ticket
 */
export const useUpdateTicket = (ticketId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateTicketRequest): Promise<TicketResponse> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/intake-tickets-update`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id: ticketId, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update ticket');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() });
    },
  });
};

/**
 * Get Triage Suggestions
 */
export const useTriageSuggestions = (ticketId: string) => {
  return useQuery({
    queryKey: intakeKeys.triage(ticketId),
    queryFn: async (): Promise<TriageSuggestions> => {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/intake-tickets-triage?id=${ticketId}&action=suggestions`,
        { headers }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch triage suggestions');
      }

      return response.json();
    },
    enabled: !!ticketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Apply Triage
 */
export const useApplyTriage = (ticketId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ApplyTriageRequest): Promise<TicketResponse> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/intake-tickets-triage`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: ticketId, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to apply triage');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: intakeKeys.triage(ticketId) });
      queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() });
    },
  });
};

/**
 * Assign Ticket
 */
export const useAssignTicket = (ticketId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignTicketRequest): Promise<TicketResponse> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/intake-tickets-assign`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: ticketId, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign ticket');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() });
    },
  });
};

/**
 * Convert Ticket
 */
export const useConvertTicket = (ticketId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ConvertTicketRequest): Promise<{ success: boolean; artifactId: string }> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/intake-tickets-convert`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: ticketId, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to convert ticket');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() });
    },
  });
};

/**
 * Get Duplicate Candidates
 */
export const useDuplicateCandidates = (ticketId: string, threshold = 0.65) => {
  return useQuery({
    queryKey: intakeKeys.duplicates(ticketId),
    queryFn: async (): Promise<{ candidates: DuplicateCandidate[] }> => {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/intake-tickets-duplicates?id=${ticketId}&threshold=${threshold}`,
        { headers }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch duplicates');
      }

      return response.json();
    },
    enabled: !!ticketId,
  });
};

/**
 * Merge Tickets
 */
export const useMergeTickets = (ticketId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MergeTicketsRequest): Promise<TicketResponse> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/intake-tickets-merge`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: ticketId, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to merge tickets');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() });
    },
  });
};

/**
 * Close Ticket
 */
export const useCloseTicket = (ticketId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CloseTicketRequest): Promise<TicketResponse> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/intake-tickets-close`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: ticketId, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to close ticket');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intakeKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: intakeKeys.tickets() });
    },
  });
};

/**
 * Upload Attachment
 */
export const useUploadAttachment = () => {
  return useMutation({
    mutationFn: async (formData: FormData): Promise<Attachment> => {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${API_BASE_URL}/intake-tickets-attachments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload attachment');
      }

      return response.json();
    },
  });
};

/**
 * Delete Attachment
 */
export const useDeleteAttachment = () => {
  return useMutation({
    mutationFn: async (attachmentId: string): Promise<void> => {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/intake-tickets-attachments?id=${attachmentId}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete attachment');
      }
    },
  });
};

/**
 * Get SLA Preview
 */
export const useGetSLAPreview = (urgency: string) => {
  return useQuery({
    queryKey: ['sla-preview', urgency],
    queryFn: async (): Promise<{
      acknowledgmentMinutes: number;
      resolutionHours: number;
      businessHoursOnly: boolean;
    }> => {
      // This would typically come from an API endpoint
      // For now, return default values based on urgency
      const slaMap = {
        critical: { acknowledgmentMinutes: 15, resolutionHours: 4, businessHoursOnly: false },
        high: { acknowledgmentMinutes: 30, resolutionHours: 8, businessHoursOnly: true },
        medium: { acknowledgmentMinutes: 60, resolutionHours: 24, businessHoursOnly: true },
        low: { acknowledgmentMinutes: 120, resolutionHours: 72, businessHoursOnly: true },
      };

      return slaMap[urgency as keyof typeof slaMap] || slaMap.medium;
    },
    enabled: !!urgency,
  });
};

/**
 * Health Check
 */
export const useHealthCheck = () => {
  return useQuery({
    queryKey: intakeKeys.health(),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/intake-health`);
      if (!response.ok) {
        throw new Error('Health check failed');
      }
      return response.json();
    },
    refetchInterval: 30000, // 30 seconds
  });
};

/**
 * AI Health Check
 */
export const useAIHealthCheck = () => {
  return useQuery({
    queryKey: intakeKeys.aiHealth(),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/intake-ai-health`);
      if (!response.ok) {
        throw new Error('AI health check failed');
      }
      return response.json();
    },
    refetchInterval: 60000, // 60 seconds
  });
};