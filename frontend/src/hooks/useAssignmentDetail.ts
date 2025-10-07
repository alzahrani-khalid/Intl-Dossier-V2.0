/**
 * useAssignmentDetail Hook
 *
 * TanStack Query hook with Supabase Realtime subscription for assignment detail.
 * Subscribes to assignments, comments, checklist, reactions, events, and workflow_stage changes.
 * Includes engagement context for engagement-linked assignments.
 *
 * @see specs/014-full-assignment-detail/contracts/api-spec.yaml#GET /assignments/{id}
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Database } from '@/types/database';
import { RealtimeChannel } from '@supabase/supabase-js';

const supabase = createClient();

type Assignment = Database['public']['Tables']['assignments']['Row'];
type AssignmentComment = Database['public']['Tables']['assignment_comments']['Row'];
type ChecklistItem = Database['public']['Tables']['assignment_checklist_items']['Row'];
type AssignmentObserver = Database['public']['Tables']['assignment_observers']['Row'];
type AssignmentEvent = Database['public']['Tables']['assignment_events']['Row'];

export interface AssignmentDetailResponse {
  assignment: Assignment & {
    assignee_name?: string;
    assigned_by_name?: string;
    work_item_title?: string;
    work_item_preview?: string;
    required_skills?: string[];
  };
  engagement?: {
    id: string;
    title_en: string;
    title_ar: string;
    engagement_type: string;
    start_date: string;
    end_date: string;
    progress_percentage: number;
    total_assignments: number;
    completed_assignments: number;
  } | null;
  sla?: {
    deadline: string;
    time_remaining_seconds: number;
    percentage_elapsed: number;
    health_status: 'safe' | 'warning' | 'breached';
  };
  comments: AssignmentComment[];
  checklist_items: ChecklistItem[];
  observers: (AssignmentObserver & { user_name?: string; user_role?: string })[];
  timeline: AssignmentEvent[];
  checklist_progress: number;
}

export function useAssignmentDetail(assignmentId: string) {
  const queryClient = useQueryClient();

  // Fetch assignment detail from Edge Function
  const query = useQuery<AssignmentDetailResponse, Error>({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      // Get fresh session for auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      console.log('Session check:', { hasSession: !!session, hasToken: !!session?.access_token, error: sessionError });
      console.log('Current user:', { id: session?.user?.id, email: session?.user?.email });

      if (!session?.access_token) {
        console.error('No session or access token:', { session, sessionError });
        throw new Error('No active session');
      }

      // Use direct fetch instead of supabase.functions.invoke to ensure proper auth headers
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      console.log('Calling Edge Function:', { url: `${supabaseUrl}/functions/v1/assignments-get`, assignmentId });

      const response = await fetch(`${supabaseUrl}/functions/v1/assignments-get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ id: assignmentId }),
      });

      console.log('Edge Function response:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('Edge Function error:', errorData);
        throw new Error(errorData.message || errorData.details || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as AssignmentDetailResponse;
    },
    staleTime: 30000, // Consider data stale after 30 seconds
    refetchOnWindowFocus: true,
  });

  // Setup Supabase Realtime subscriptions
  useEffect(() => {
    if (!assignmentId) return;

    const channel: RealtimeChannel = supabase
      .channel(`assignment:${assignmentId}`)
      // Subscribe to assignment status changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: `id=eq.${assignmentId}`,
        },
        (payload) => {
          queryClient.setQueryData<AssignmentDetailResponse>(
            ['assignment', assignmentId],
            (old) => {
              if (!old) return old;
              return {
                ...old,
                assignment: { ...old.assignment, ...(payload.new as Assignment) },
              };
            }
          );
        }
      )
      // Subscribe to new comments
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assignment_comments',
          filter: `assignment_id=eq.${assignmentId}`,
        },
        (payload) => {
          queryClient.setQueryData<AssignmentDetailResponse>(
            ['assignment', assignmentId],
            (old) => {
              if (!old) return old;
              return {
                ...old,
                comments: [...old.comments, payload.new as AssignmentComment],
              };
            }
          );
        }
      )
      // Subscribe to checklist item changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignment_checklist_items',
          filter: `assignment_id=eq.${assignmentId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
        }
      )
      // Subscribe to comment reactions
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_reactions',
        },
        () => {
          // Invalidate to refetch comment reactions
          queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
        }
      )
      // Subscribe to assignment events (timeline)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'assignment_events',
          filter: `assignment_id=eq.${assignmentId}`,
        },
        (payload) => {
          queryClient.setQueryData<AssignmentDetailResponse>(
            ['assignment', assignmentId],
            (old) => {
              if (!old) return old;
              return {
                ...old,
                timeline: [payload.new as AssignmentEvent, ...old.timeline],
              };
            }
          );
        }
      )
      // Subscribe to workflow_stage changes
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'assignments',
          filter: `id=eq.${assignmentId}`,
        },
        (payload) => {
          const newAssignment = payload.new as Assignment;
          const oldAssignment = payload.old as Assignment;

          if (newAssignment.workflow_stage !== oldAssignment.workflow_stage) {
            queryClient.setQueryData<AssignmentDetailResponse>(
              ['assignment', assignmentId],
              (old) => {
                if (!old) return old;
                return {
                  ...old,
                  assignment: { ...old.assignment, ...newAssignment },
                };
              }
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [assignmentId, queryClient]);

  return query;
}
