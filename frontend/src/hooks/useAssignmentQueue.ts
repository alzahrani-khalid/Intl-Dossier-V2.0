/**
 * Assignment Queue Hook
 * @module hooks/useAssignmentQueue
 * @feature 013-assignment-engine-sla
 *
 * TanStack Query hook for fetching queued work items awaiting capacity assignment.
 *
 * @description
 * This hook fetches work items that are in the assignment queue due to:
 * - All eligible staff at capacity
 * - No available staff with required skills
 * - Capacity constraints for the organizational unit
 *
 * Used by supervisors to monitor queue health and manually assign items.
 * Auto-refetches every 15 seconds to keep queue position accurate.
 *
 * @example
 * // Fetch all queued items
 * const { data } = useAssignmentQueue();
 *
 * @example
 * // Filter by priority and work item type
 * const { data } = useAssignmentQueue({
 *   priority: 'urgent',
 *   work_item_type: 'ticket',
 *   page: 1,
 *   page_size: 20,
 * });
 *
 * @see specs/013-assignment-engine-sla/contracts/api-spec.yaml#GET /assignments/queue
 */

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'

const supabase = createClient()

/**
 * Single queued work item with required skills and position
 */
export interface QueueItem {
  queue_id: string
  work_item_id: string
  work_item_type: 'dossier' | 'ticket' | 'position' | 'task'
  required_skills: Array<{
    skill_id: string
    skill_name_en: string
    skill_name_ar: string
  }>
  priority: 'urgent' | 'high' | 'normal' | 'low'
  queued_at: string
  position: number
  attempts: number
}

/**
 * Paginated queue list response
 */
export interface QueueListResponse {
  items: QueueItem[]
  total_count: number
  page: number
  page_size: number
  has_next_page: boolean
}

/**
 * Queue filter options
 */
interface UseAssignmentQueueOptions {
  priority?: string
  work_item_type?: string
  unit_id?: string
  page?: number
  page_size?: number
}

/**
 * Hook to fetch assignment queue with filters
 *
 * @description
 * Fetches paginated list of queued work items with optional filters.
 * Auto-refetches every 15 seconds to maintain real-time queue positions.
 * Useful for supervisor dashboards and manual assignment workflows.
 *
 * @param options - Optional filter criteria
 * @param options.priority - Filter by priority (urgent, high, normal, low)
 * @param options.work_item_type - Filter by work item type
 * @param options.unit_id - Filter by organizational unit
 * @param options.page - Page number for pagination
 * @param options.page_size - Items per page
 * @returns TanStack Query result with QueueListResponse data
 *
 * @example
 * // Basic usage
 * const { data, isLoading } = useAssignmentQueue();
 *
 * @example
 * // Filter urgent tickets
 * const { data } = useAssignmentQueue({
 *   priority: 'urgent',
 *   work_item_type: 'ticket',
 * });
 */
export function useAssignmentQueue(options: UseAssignmentQueueOptions = {}) {
  return useQuery<QueueListResponse>({
    queryKey: ['assignment-queue', options],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options.priority) params.append('priority', options.priority)
      if (options.work_item_type) params.append('work_item_type', options.work_item_type)
      if (options.unit_id) params.append('unit_id', options.unit_id)
      if (options.page) params.append('page', String(options.page))
      if (options.page_size) params.append('page_size', String(options.page_size))

      const { data, error } = await supabase.functions.invoke('assignments-queue', {
        method: 'GET',
        ...(params.toString() && { body: Object.fromEntries(params) }),
      })

      if (error) {
        throw new Error(error.message || 'Failed to fetch assignment queue')
      }

      return data as QueueListResponse
    },
    enabled: true,
    refetchInterval: 15000, // Refetch every 15s for queue updates
  })
}
