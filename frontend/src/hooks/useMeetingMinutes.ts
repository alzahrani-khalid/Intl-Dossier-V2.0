/**
 * Meeting Minutes Hook
 * Feature: meeting-minutes-capture
 *
 * TanStack Query hooks for meeting minutes CRUD operations,
 * attendee management, action items, and AI features.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  MeetingMinutesFilters,
  MeetingMinutesListResponse,
} from '@/types/meeting-minutes.types'

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch meeting minutes list with filters
 */
export function useMeetingMinutesList(filters?: MeetingMinutesFilters) {
  return useQuery({
    queryKey: ['meeting-minutes', 'list', filters],
    queryFn: async (): Promise<MeetingMinutesListResponse> => {
      const params = new URLSearchParams()
      params.append('endpoint', 'list')

      if (filters?.search) params.append('search', filters.search)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.dossier_id) params.append('dossier_id', filters.dossier_id)
      if (filters?.engagement_id) params.append('engagement_id', filters.engagement_id)
      if (filters?.from_date) params.append('from_date', filters.from_date)
      if (filters?.to_date) params.append('to_date', filters.to_date)
      if (filters?.created_by) params.append('created_by', filters.created_by)

      // Use RPC directly (Edge functions don't support GET with query params well)
      const { data: rpcData, error: rpcError } = await supabase.rpc('search_meeting_minutes', {
        p_search_term: filters?.search || null,
        p_status: filters?.status || null,
        p_dossier_id: filters?.dossier_id || null,
        p_engagement_id: filters?.engagement_id || null,
        p_from_date: filters?.from_date || null,
        p_to_date: filters?.to_date || null,
        p_created_by: filters?.created_by || null,
        p_limit: 50,
        p_offset: 0,
      })

      if (rpcError) throw rpcError

      return {
        items: rpcData || [],
        hasMore: (rpcData?.length || 0) === 50,
        limit: 50,
        offset: 0,
      }
    },
  })
}
