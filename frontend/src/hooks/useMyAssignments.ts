/**
 * My Assignments Hook
 * @module hooks/useMyAssignments
 * @feature 013-assignment-engine-sla
 *
 * TanStack Query hook for fetching current user's assignments with SLA tracking.
 *
 * @description
 * This hook fetches the authenticated user's assignments with:
 * - Real-time SLA deadline and time remaining calculations
 * - Summary statistics (active, at-risk, breached counts)
 * - Escalation tracking and warning status
 * - Optional filtering by status
 *
 * Auto-refetches every 30 seconds to keep SLA countdowns accurate.
 *
 * @example
 * // Fetch all active assignments
 * const { data } = useMyAssignments();
 *
 * @example
 * // Fetch with filters
 * const { data } = useMyAssignments({
 *   status: 'in_progress',
 *   include_completed: false,
 * });
 *
 * @see specs/013-assignment-engine-sla/contracts/api-spec.yaml#GET /assignments/my-assignments
 */

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'

const supabase = createClient()

/**
 * Single assignment with SLA tracking
 */
export interface Assignment {
  id: string
  work_item_id: string
  work_item_type: 'dossier' | 'ticket' | 'position' | 'task'
  work_item_title?: string
  assigned_at: string
  sla_deadline: string
  time_remaining_seconds: number
  priority: 'urgent' | 'high' | 'normal' | 'low'
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  warning_sent: boolean
  escalated: boolean
  escalated_at?: string | null
  escalation_recipient_name?: string | null
}

/**
 * My assignments response with summary statistics
 */
export interface MyAssignmentsResponse {
  assignments: Assignment[]
  total_count: number
  summary: {
    active_count: number
    at_risk_count: number
    breached_count: number
  }
}

/**
 * Filter options for my assignments query
 */
interface UseMyAssignmentsOptions {
  status?: string
  include_completed?: boolean
}

/**
 * Hook to fetch current user's assignments with SLA tracking
 *
 * @description
 * Fetches assignments for the authenticated user with real-time SLA calculations.
 * Auto-refetches every 30 seconds to maintain accurate countdown timers.
 * Includes summary statistics for dashboard widgets.
 *
 * @param options - Optional filter criteria
 * @param options.status - Filter by assignment status
 * @param options.include_completed - Whether to include completed assignments
 * @returns TanStack Query result with MyAssignmentsResponse data
 *
 * @example
 * // Basic usage
 * const { data, isLoading } = useMyAssignments();
 * if (data) {
 *   // Display data.assignments, data.summary
 * }
 *
 * @example
 * // Show only at-risk assignments
 * const { data } = useMyAssignments({ status: 'in_progress' });
 * const atRisk = data?.assignments.filter(a => a.time_remaining_seconds < 3600);
 */
export function useMyAssignments(options: UseMyAssignmentsOptions = {}) {
  return useQuery<MyAssignmentsResponse>({
    queryKey: ['my-assignments', options],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options.status) params.append('status', options.status)
      if (options.include_completed !== undefined) {
        params.append('include_completed', String(options.include_completed))
      }

      const { data, error } = await supabase.functions.invoke('assignments-my-assignments', {
        method: 'GET',
        ...(params.toString() && { body: Object.fromEntries(params) }),
      })

      if (error) {
        throw new Error(error.message || 'Failed to fetch my assignments')
      }

      return data as MyAssignmentsResponse
    },
    enabled: true,
    refetchInterval: 30000, // Refetch every 30s for SLA countdown updates
  })
}
