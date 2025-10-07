/**
 * useAssignmentQueue Hook
 *
 * TanStack Query hook for fetching queued work items awaiting capacity.
 * Used by supervisors to view and manually assign queued items.
 *
 * @see specs/013-assignment-engine-sla/contracts/api-spec.yaml#GET /assignments/queue
 */

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'

const supabase = createClient()

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

export interface QueueListResponse {
  items: QueueItem[]
  total_count: number
  page: number
  page_size: number
  has_next_page: boolean
}

interface UseAssignmentQueueOptions {
  priority?: string
  work_item_type?: string
  unit_id?: string
  page?: number
  page_size?: number
}

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
