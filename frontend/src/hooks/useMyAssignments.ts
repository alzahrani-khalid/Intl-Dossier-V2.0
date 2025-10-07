/**
 * useMyAssignments Hook
 *
 * TanStack Query hook for fetching current user's assignments
 * with SLA deadlines and time remaining.
 *
 * @see specs/013-assignment-engine-sla/contracts/api-spec.yaml#GET /assignments/my-assignments
 */

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'

const supabase = createClient()

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

export interface MyAssignmentsResponse {
  assignments: Assignment[]
  total_count: number
  summary: {
    active_count: number
    at_risk_count: number
    breached_count: number
  }
}

interface UseMyAssignmentsOptions {
  status?: string
  include_completed?: boolean
}

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
