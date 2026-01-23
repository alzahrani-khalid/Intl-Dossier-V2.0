import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Assignment } from '@/components/waiting-queue/AssignmentDetailsModal';

/**
 * Waiting Queue Actions Hooks
 * Feature: Waiting Queue Actions (023-specs-waiting-queue)
 * Purpose: TanStack Query hooks for managing waiting queue actions
 *
 * Hooks included:
 * - useAssignmentDetails (User Story 1)
 * - useReminderAction (User Story 2) - TODO
 * - useBulkReminderAction (User Story 3) - TODO
 * - useEscalationAction (User Story 4) - TODO
 * - useQueueFilters (User Story 5) - TODO
 */

// ============================================================================
// User Story 1: Quick Access to Assignment Details
// ============================================================================

/**
 * Fetch assignment details by ID
 * @param assignmentId - UUID of the assignment
 * @returns Query result with assignment data
 */
export function useAssignmentDetails(assignmentId: string | null) {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async (): Promise<Assignment> => {
      if (!assignmentId) {
        throw new Error('Assignment ID is required');
      }

      // Fetch assignment first
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          work_item_id,
          work_item_type,
          assignee_id,
          status,
          workflow_stage,
          assigned_at,
          priority,
          last_reminder_sent_at,
          created_at,
          updated_at
        `)
        .eq('id', assignmentId)
        .single();

      if (error) {
        console.error('Error fetching assignment details:', error);
        throw new Error(`Failed to fetch assignment: ${error.message}`);
      }

      if (!data) {
        throw new Error('Assignment not found');
      }

      // Fetch user email from auth metadata
      // Note: In Supabase, we can get user email from auth.users using admin methods
      // For now, we'll use the session user if it's the same as assignee
      const { data: { user } } = await supabase.auth.getUser();
      const assigneeEmail = user?.id === data.assignee_id ? user.email : undefined;

      // Try to get user's full name from user_metadata if available
      const assigneeName = user?.id === data.assignee_id ? user.user_metadata?.full_name : undefined;

      // Fetch work item details based on type
      let workItem = null;

      if (data.work_item_type === 'task') {
        // Fetch task details
        const { data: task } = await supabase
          .from('tasks')
          .select('id, title, description, source, status')
          .eq('id', data.work_item_id)
          .single();

        if (task) {
          // Extract linked entity IDs from task source
          const linkedEntities: any[] = [];

          // Fetch linked dossiers
          if (task.source?.dossier_ids && Array.isArray(task.source.dossier_ids)) {
            const { data: dossiers } = await supabase
              .from('dossiers')
              .select('id, name_en, name_ar, status')
              .in('id', task.source.dossier_ids);

            if (dossiers) {
              linkedEntities.push(...dossiers.map((d: any) => ({
                type: 'dossier',
                id: d.id,
                name_en: d.name_en,
                name_ar: d.name_ar,
                status: d.status,
              })));
            }
          }

          // Fetch linked positions
          if (task.source?.position_ids && Array.isArray(task.source.position_ids)) {
            const { data: positions } = await supabase
              .from('positions')
              .select('id, title_en, title_ar, status')
              .in('id', task.source.position_ids);

            if (positions) {
              linkedEntities.push(...positions.map((p: any) => ({
                type: 'position',
                id: p.id,
                title_en: p.title_en,
                title_ar: p.title_ar,
                status: p.status,
              })));
            }
          }

          // Fetch linked tickets
          if (task.source?.ticket_ids && Array.isArray(task.source.ticket_ids)) {
            const { data: tickets } = await supabase
              .from('intake_tickets')
              .select('id, ticket_number, title, title_ar, status')
              .in('id', task.source.ticket_ids);

            if (tickets) {
              linkedEntities.push(...tickets.map((t: any) => ({
                type: 'ticket',
                id: t.id,
                ticket_number: t.ticket_number,
                title_en: t.title,
                title_ar: t.title_ar,
                status: t.status,
              })));
            }
          }

          workItem = {
            title_en: task.title,
            title_ar: task.title, // Tasks use same title for both languages
            description: task.description,
            status: task.status,
            source_type: task.source?.type,
            linked_entities: linkedEntities,
          };
        }
      } else if (data.work_item_type === 'dossier') {
        const { data: dossier } = await supabase
          .from('dossiers')
          .select('id, name_en, name_ar, type, status')
          .eq('id', data.work_item_id)
          .single();

        if (dossier) {
          workItem = {
            title_en: dossier.name_en,
            title_ar: dossier.name_ar,
            type: dossier.type,
            status: dossier.status,
          };
        }
      } else if (data.work_item_type === 'ticket') {
        const { data: ticket } = await supabase
          .from('intake_tickets')
          .select('id, ticket_number, title, title_ar, status')
          .eq('id', data.work_item_id)
          .single();

        if (ticket) {
          workItem = {
            title_en: ticket.title || ticket.ticket_number,
            title_ar: ticket.title_ar || ticket.ticket_number,
            ticket_number: ticket.ticket_number,
            status: ticket.status,
          };
        }
      } else if (data.work_item_type === 'position') {
        const { data: position } = await supabase
          .from('positions')
          .select('id, title_en, title_ar, status')
          .eq('id', data.work_item_id)
          .single();

        if (position) {
          workItem = {
            title_en: position.title_en,
            title_ar: position.title_ar,
            status: position.status,
          };
        }
      }

      // Calculate days waiting
      const daysWaiting = Math.floor(
        (Date.now() - new Date(data.assigned_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Transform data to match Assignment interface
      return {
        id: data.id,
        work_item_id: data.work_item_id,
        work_item_type: data.work_item_type as Assignment['work_item_type'],
        assignee_id: data.assignee_id,
        assignee_name: assigneeName,
        assignee_email: assigneeEmail,
        status: data.status as Assignment['status'],
        workflow_stage: data.workflow_stage as Assignment['workflow_stage'],
        assigned_at: data.assigned_at,
        priority: data.priority as Assignment['priority'],
        last_reminder_sent_at: data.last_reminder_sent_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
        days_waiting: daysWaiting,
        work_item: workItem,
      };
    },
    enabled: !!assignmentId, // Only run query if assignmentId is provided
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (previously cacheTime)
  });
}

// ============================================================================
// User Story 2: Individual Follow-Up Reminders
// ============================================================================

/**
 * Type definitions for reminder actions
 */
export interface ReminderAPIError {
  error: string;
  message: string;
  details?: {
    hours_remaining?: number;
  };
  retry_after?: number;
}

export interface SendReminderResponse {
  success: boolean;
  message: string;
}

/**
 * Send individual reminder to assignment owner
 * @param assignmentId - UUID of the assignment
 * @returns Mutation result
 */
export function useReminderAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId }: { assignmentId: string }): Promise<SendReminderResponse> => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Unauthorized: No active session');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/waiting-queue-reminder/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          assignment_id: assignmentId,
        }),
      });

      if (!response.ok) {
        const error: ReminderAPIError = await response.json();
        throw error;
      }

      return response.json();
    },
    // T090: Optimistic update - Update cache immediately before server response
    onMutate: async ({ assignmentId }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['assignment', assignmentId] });

      // Snapshot the previous value
      const previousAssignment = queryClient.getQueryData(['assignment', assignmentId]);

      // Optimistically update the cache
      queryClient.setQueryData(['assignment', assignmentId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          last_reminder_sent_at: new Date().toISOString(),
        };
      });

      // Return context with snapshot for rollback
      return { previousAssignment };
    },
    onSuccess: (_data, variables) => {
      // Invalidate assignment details to get actual server data
      queryClient.invalidateQueries({
        queryKey: ['assignment', variables.assignmentId],
      });

      // Invalidate assignments list
      queryClient.invalidateQueries({
        queryKey: ['assignments'],
      });
      queryClient.invalidateQueries({
        queryKey: ['waiting-queue'],
      });
    },
    onError: (error: ReminderAPIError, variables, context: any) => {
      // Rollback optimistic update on error
      if (context?.previousAssignment) {
        queryClient.setQueryData(['assignment', variables.assignmentId], context.previousAssignment);
      }
      console.error('Failed to send reminder:', error.message, error.details);
    },
  });
}

// ============================================================================
// User Story 3: Bulk Reminder Management
// ============================================================================

/**
 * Type definitions for bulk reminder actions
 */
export interface BulkReminderJob {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  results?: Array<{
    assignment_id: string;
    success: boolean;
    error?: string;
    skipped?: boolean;
    reason?: string;
  }>;
}

export interface SendBulkRemindersResponse {
  job_id: string;
  total_items: number;
  message: string;
}

/**
 * Send bulk reminders to multiple assignments
 * @returns Mutation and query for bulk reminders with job status polling
 */
export function useBulkReminderAction() {
  const queryClient = useQueryClient();

  const sendBulkMutation = useMutation({
    mutationFn: async ({ assignmentIds }: { assignmentIds: string[] }): Promise<SendBulkRemindersResponse> => {
      if (assignmentIds.length === 0) {
        throw new Error('No assignments selected');
      }

      if (assignmentIds.length > 100) {
        throw new Error('Maximum 100 assignments can be selected for bulk action');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Unauthorized: No active session');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/waiting-queue-reminder/send-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          assignment_ids: assignmentIds,
        }),
      });

      if (!response.ok) {
        const error: ReminderAPIError = await response.json();
        throw error;
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate assignments list after bulk operation
      queryClient.invalidateQueries({
        queryKey: ['assignments'],
      });
    },
    onError: (error: ReminderAPIError) => {
      console.error('Failed to send bulk reminders:', error.message, error.details);
    },
  });

  return {
    sendBulk: sendBulkMutation,
  };
}

/**
 * Poll bulk reminder job status
 * @param jobId - Job ID returned from bulk reminder creation
 * @param enabled - Whether to enable polling
 * @returns Query result with job status
 */
export function useBulkReminderJobStatus(jobId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['bulk-reminder-job', jobId],
    queryFn: async (): Promise<BulkReminderJob> => {
      if (!jobId) {
        throw new Error('Job ID is required');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Unauthorized: No active session');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/waiting-queue-reminder/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error: ReminderAPIError = await response.json();
        throw error;
      }

      return response.json();
    },
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling when job is completed or failed
      if (!data || data.status === 'completed' || data.status === 'failed') {
        return false;
      }
      // Poll every 2 seconds while processing
      return 2000;
    },
    staleTime: 0, // Always fetch fresh data
  });
}

// ============================================================================
// User Story 4: Assignment Escalation
// ============================================================================

/**
 * Type definitions for escalation actions
 */
export interface EscalateAssignmentRequest {
  assignmentId: string;
  reason?: string;
}

export interface EscalateAssignmentResponse {
  escalation_id: string;
  escalated_to_id: string;
  escalated_to_name: string;
  message: string;
}

export interface EscalationAPIError {
  error: string;
  message?: string;
}

/**
 * Escalate an assignment to higher management
 * @returns Mutation result
 */
export function useEscalationAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, reason }: EscalateAssignmentRequest): Promise<EscalateAssignmentResponse> => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Unauthorized: No active session');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/waiting-queue-escalation/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          assignment_id: assignmentId,
          reason,
        }),
      });

      if (!response.ok) {
        const error: EscalationAPIError = await response.json();

        // Handle special error cases
        if (error.error === 'NO_ESCALATION_PATH') {
          throw new Error('No escalation path configured for this assignment');
        }

        if (error.error === 'CANNOT_ESCALATE_COMPLETED') {
          throw new Error('Cannot escalate a completed assignment');
        }

        throw new Error(error.message || error.error || 'Failed to escalate assignment');
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      // Invalidate assignment details to refresh escalation status
      queryClient.invalidateQueries({
        queryKey: ['assignment', variables.assignmentId],
      });

      // Invalidate assignments list
      queryClient.invalidateQueries({
        queryKey: ['assignments'],
      });
    },
    onError: (error: Error) => {
      console.error('Failed to escalate assignment:', error.message);
    },
  });
}

/**
 * Acknowledge an escalation (for recipients)
 * @returns Mutation result
 */
export function useAcknowledgeEscalation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ escalationId, notes }: { escalationId: string; notes?: string }) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Unauthorized: No active session');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/waiting-queue-escalation/${escalationId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const error: EscalationAPIError = await response.json();
        throw new Error(error.message || error.error || 'Failed to acknowledge escalation');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate escalations list
      queryClient.invalidateQueries({
        queryKey: ['escalations'],
      });
    },
  });
}

/**
 * Resolve an escalation (for recipients)
 * @returns Mutation result
 */
export function useResolveEscalation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ escalationId, resolution }: { escalationId: string; resolution: string }) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Unauthorized: No active session');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/waiting-queue-escalation/${escalationId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ resolution }),
      });

      if (!response.ok) {
        const error: EscalationAPIError = await response.json();
        throw new Error(error.message || error.error || 'Failed to resolve escalation');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate escalations list
      queryClient.invalidateQueries({
        queryKey: ['escalations'],
      });
    },
  });
}

// ============================================================================
// User Story 5: Advanced Queue Filtering
// ============================================================================

// TODO: Implement useQueueFilters hook
