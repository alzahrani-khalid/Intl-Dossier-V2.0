/**
 * useCapacityCheck Hook
 *
 * TanStack Query hook for checking staff or unit capacity utilization.
 * Used to display WIP limits and available capacity.
 *
 * @see specs/013-assignment-engine-sla/contracts/api-spec.yaml#GET /capacity/check
 */

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'

const supabase = createClient()

export interface StaffCapacity {
  staff_id: string
  name: string
  wip_current: number
  wip_limit: number
  available_capacity: number
  status: 'available' | 'on_leave' | 'unavailable'
}

export interface CapacityResponse {
  staff_id?: string | null
  unit_id?: string | null
  available_capacity: number
  wip_current: number
  wip_limit: number
  utilization_pct: number
  status: 'available' | 'on_leave' | 'unavailable'
  staff_members?: StaffCapacity[] | null
}

interface UseCapacityCheckOptions {
  staff_id?: string
  unit_id?: string
}

export function useCapacityCheck(options: UseCapacityCheckOptions = {}) {
  return useQuery<CapacityResponse>({
    queryKey: ['capacity-check', options],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options.staff_id) params.append('staff_id', options.staff_id)
      if (options.unit_id) params.append('unit_id', options.unit_id)

      const { data, error } = await supabase.functions.invoke('capacity-check', {
        method: 'GET',
        ...(params.toString() && { body: Object.fromEntries(params) }),
      })

      if (error) {
        throw new Error(error.message || 'Failed to check capacity')
      }

      return data as CapacityResponse
    },
    enabled: !!(options.staff_id || options.unit_id),
    refetchInterval: 60000, // Refetch every 60s for capacity updates
  })
}
