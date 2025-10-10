/**
 * useWorkQueueCounts Hook
 *
 * Fetches badge counts for Work-Queue-First navigation (FR-034)
 * Returns counts for:
 * - My Assignments: Active assignments for current user
 * - Intake Queue: Pending tickets awaiting triage
 * - Waiting Queue: Items blocked/waiting for dependencies
 *
 * Used by Navigation component to display badge counts
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/auth.context'

interface WorkQueueCounts {
  assignments: number
  intake: number
  waiting: number
}

export function useWorkQueueCounts() {
  const { user } = useAuth()

  return useQuery<WorkQueueCounts>({
    queryKey: ['work-queue-counts', user?.id],
    queryFn: async () => {
      if (!user) {
        return { assignments: 0, intake: 0, waiting: 0 }
      }

      // Fetch assignments count (valid statuses: pending, assigned, in_progress, completed, cancelled)
      const { count: assignmentsCount } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('assignee_id', user.id)
        .in('status', ['assigned', 'in_progress'])

      // TODO: Fetch intake queue count when tickets table is implemented
      const intakeCount = 0

      // TODO: Fetch waiting queue count when 'waiting' status is added to assignment_status enum
      const waitingCount = 0

      return {
        assignments: assignmentsCount || 0,
        intake: intakeCount || 0,
        waiting: waitingCount || 0,
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    enabled: !!user,
  })
}
