/**
 * useOrganizationLeadership Hooks
 *
 * TanStack Query hooks for organization leadership tracking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type {
  OrganizationLeadership,
  LeadershipWithDetails,
  CreateLeadershipRequest,
  UpdateLeadershipRequest,
  LeadershipFilters,
  LeadershipChange,
} from '@/types/contacts.types'

// Query keys
export const leadershipKeys = {
  all: ['organization-leadership'] as const,
  lists: () => [...leadershipKeys.all, 'list'] as const,
  list: (orgId: string, filters?: Partial<LeadershipFilters>) =>
    [...leadershipKeys.lists(), orgId, filters] as const,
  details: () => [...leadershipKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadershipKeys.details(), id] as const,
  current: (orgId: string) => [...leadershipKeys.all, 'current', orgId] as const,
  changes: (days?: number) => [...leadershipKeys.all, 'changes', days] as const,
}

/**
 * Fetch leadership for an organization
 */
export function useOrganizationLeadership(
  organizationId: string,
  filters: Partial<LeadershipFilters> = {},
) {
  return useQuery<LeadershipWithDetails[], Error>({
    queryKey: leadershipKeys.list(organizationId, filters),
    queryFn: async () => {
      let query = supabase
        .from('organization_leadership')
        .select('*')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)

      if (filters.position_level) {
        query = query.eq('position_level', filters.position_level)
      }
      if (filters.is_current !== undefined) {
        query = query.eq('is_current', filters.is_current)
      }
      if (!filters.include_past) {
        query = query.eq('is_current', true)
      }

      query = query
        .order('is_current', { ascending: false })
        .order('position_level', { ascending: true })
        .order('start_date', { ascending: false })

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Enrich with person and organization names
      const leaders: LeadershipWithDetails[] = []

      for (const l of data || []) {
        let leader_name_en: string | undefined
        let leader_name_ar: string | undefined
        let photo_url: string | undefined

        // Get leader name from person or external name
        if (l.person_id) {
          const { data: person } = await supabase
            .from('persons')
            .select('name_en, name_ar, photo_url')
            .eq('id', l.person_id)
            .single()

          if (person) {
            leader_name_en = person.name_en
            leader_name_ar = person.name_ar
            photo_url = person.photo_url
          }
        } else {
          leader_name_en = l.external_name_en || undefined
          leader_name_ar = l.external_name_ar || undefined
        }

        // Get organization name
        const { data: org } = await supabase
          .from('organizations')
          .select('name_en, name_ar')
          .eq('id', l.organization_id)
          .single()

        // Calculate tenure
        const startDate = new Date(l.start_date)
        const endDate = l.end_date ? new Date(l.end_date) : new Date()
        const tenureDays = Math.floor(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        )

        leaders.push({
          ...l,
          leader_name_en,
          leader_name_ar,
          photo_url,
          organization_name_en: org?.name_en,
          organization_name_ar: org?.name_ar,
          tenure_days: tenureDays,
        })
      }

      return leaders
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch current leadership for an organization
 */
export function useCurrentLeadership(organizationId: string) {
  return useQuery<LeadershipWithDetails[], Error>({
    queryKey: leadershipKeys.current(organizationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_leadership')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_current', true)
        .is('deleted_at', null)
        .order('position_level', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      // Enrich with person names
      const leaders: LeadershipWithDetails[] = []

      for (const l of data || []) {
        let leader_name_en: string | undefined
        let leader_name_ar: string | undefined

        if (l.person_id) {
          const { data: person } = await supabase
            .from('persons')
            .select('name_en, name_ar')
            .eq('id', l.person_id)
            .single()

          if (person) {
            leader_name_en = person.name_en
            leader_name_ar = person.name_ar
          }
        } else {
          leader_name_en = l.external_name_en || undefined
          leader_name_ar = l.external_name_ar || undefined
        }

        leaders.push({
          ...l,
          leader_name_en,
          leader_name_ar,
        })
      }

      return leaders
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Create leadership record
 */
export function useCreateLeadership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateLeadershipRequest) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // If setting as current, mark existing current as not current
      if (!data.end_date) {
        await supabase
          .from('organization_leadership')
          .update({ is_current: false, end_date: new Date().toISOString() })
          .eq('organization_id', data.organization_id)
          .eq('position_level', data.position_level || 'head')
          .eq('is_current', true)
      }

      const { data: leadership, error } = await supabase
        .from('organization_leadership')
        .insert({
          ...data,
          position_level: data.position_level || 'head',
          is_current: !data.end_date,
          achievements: data.achievements || [],
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return leadership as OrganizationLeadership
    },
    onSuccess: (leadership) => {
      queryClient.invalidateQueries({
        queryKey: leadershipKeys.list(leadership.organization_id),
      })
      queryClient.invalidateQueries({
        queryKey: leadershipKeys.current(leadership.organization_id),
      })
      toast.success('Leadership record created successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create leadership record')
    },
  })
}

/**
 * Update leadership record
 */
export function useUpdateLeadership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      organizationId,
      data,
    }: {
      id: string
      organizationId: string
      data: UpdateLeadershipRequest
    }) => {
      const { data: leadership, error } = await supabase
        .from('organization_leadership')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return { leadership: leadership as OrganizationLeadership, organizationId }
    },
    onSuccess: ({ organizationId }) => {
      queryClient.invalidateQueries({ queryKey: leadershipKeys.list(organizationId) })
      queryClient.invalidateQueries({ queryKey: leadershipKeys.current(organizationId) })
      toast.success('Leadership record updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update leadership record')
    },
  })
}

/**
 * End leadership tenure
 */
export function useEndLeadershipTenure() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      organizationId,
      endDate,
    }: {
      id: string
      organizationId: string
      endDate?: string
    }) => {
      const { error } = await supabase
        .from('organization_leadership')
        .update({
          is_current: false,
          end_date: endDate || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      return { id, organizationId }
    },
    onSuccess: ({ organizationId }) => {
      queryClient.invalidateQueries({ queryKey: leadershipKeys.list(organizationId) })
      queryClient.invalidateQueries({ queryKey: leadershipKeys.current(organizationId) })
      toast.success('Leadership tenure ended')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to end leadership tenure')
    },
  })
}

/**
 * Delete leadership record (soft delete)
 */
export function useDeleteLeadership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, organizationId }: { id: string; organizationId: string }) => {
      const { error } = await supabase
        .from('organization_leadership')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      return { id, organizationId }
    },
    onSuccess: ({ organizationId }) => {
      queryClient.invalidateQueries({ queryKey: leadershipKeys.list(organizationId) })
      queryClient.invalidateQueries({ queryKey: leadershipKeys.current(organizationId) })
      toast.success('Leadership record deleted')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete leadership record')
    },
  })
}

/**
 * Fetch recent leadership changes across organizations
 */
export function useLeadershipChanges(days: number = 30) {
  return useQuery<LeadershipChange[], Error>({
    queryKey: leadershipKeys.changes(days),
    queryFn: async () => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      // Get recently started leaders
      const { data: newLeaders, error: newError } = await supabase
        .from('organization_leadership')
        .select(
          `
          id,
          organization_id,
          position_title_en,
          position_level,
          start_date,
          person_id,
          external_name_en,
          external_name_ar
        `,
        )
        .gte('start_date', cutoffDate.toISOString())
        .is('deleted_at', null)
        .order('start_date', { ascending: false })

      if (newError) {
        throw new Error(newError.message)
      }

      // Get recently ended leaders
      const { data: endedLeaders, error: endError } = await supabase
        .from('organization_leadership')
        .select(
          `
          id,
          organization_id,
          position_title_en,
          position_level,
          end_date,
          person_id,
          external_name_en,
          external_name_ar
        `,
        )
        .gte('end_date', cutoffDate.toISOString())
        .is('deleted_at', null)
        .order('end_date', { ascending: false })

      if (endError) {
        throw new Error(endError.message)
      }

      const changes: LeadershipChange[] = []

      // Process new appointments
      for (const l of newLeaders || []) {
        // Get organization name
        const { data: org } = await supabase
          .from('organizations')
          .select('name_en, name_ar')
          .eq('id', l.organization_id)
          .single()

        // Get leader name
        let leader_name_en = l.external_name_en || ''
        let leader_name_ar = l.external_name_ar || ''

        if (l.person_id) {
          const { data: person } = await supabase
            .from('persons')
            .select('name_en, name_ar')
            .eq('id', l.person_id)
            .single()

          if (person) {
            leader_name_en = person.name_en
            leader_name_ar = person.name_ar
          }
        }

        changes.push({
          leadership_id: l.id,
          organization_id: l.organization_id,
          organization_name_en: org?.name_en || '',
          organization_name_ar: org?.name_ar || '',
          leader_name_en,
          leader_name_ar,
          position_title_en: l.position_title_en,
          position_level: l.position_level,
          change_type: 'appointed',
          change_date: l.start_date,
        })
      }

      // Process departures
      for (const l of endedLeaders || []) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name_en, name_ar')
          .eq('id', l.organization_id)
          .single()

        let leader_name_en = l.external_name_en || ''
        let leader_name_ar = l.external_name_ar || ''

        if (l.person_id) {
          const { data: person } = await supabase
            .from('persons')
            .select('name_en, name_ar')
            .eq('id', l.person_id)
            .single()

          if (person) {
            leader_name_en = person.name_en
            leader_name_ar = person.name_ar
          }
        }

        changes.push({
          leadership_id: l.id,
          organization_id: l.organization_id,
          organization_name_en: org?.name_en || '',
          organization_name_ar: org?.name_ar || '',
          leader_name_en,
          leader_name_ar,
          position_title_en: l.position_title_en,
          position_level: l.position_level,
          change_type: 'departed',
          change_date: l.end_date!,
        })
      }

      // Sort by date
      changes.sort((a, b) => new Date(b.change_date).getTime() - new Date(a.change_date).getTime())

      return changes
    },
    staleTime: 1000 * 60 * 10,
  })
}
