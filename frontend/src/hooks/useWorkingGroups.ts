/**
 * React Query hooks for Working Groups Entity Management
 *
 * Feature: working-groups-entity-management
 *
 * Provides hooks for listing, creating, updating, and deleting working groups
 * along with their members, deliverables, meetings, and decisions.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type {
  WorkingGroup,
  WorkingGroupListResponse,
  WorkingGroupFullResponse,
  WorkingGroupSearchParams,
  WorkingGroupCreateRequest,
  WorkingGroupUpdateRequest,
  WorkingGroupMember,
  WorkingGroupMemberCreateRequest,
  WorkingGroupMemberUpdateRequest,
  WorkingGroupDeliverable,
  WorkingGroupDeliverableCreateRequest,
  WorkingGroupDeliverableUpdateRequest,
  WorkingGroupMeeting,
  WorkingGroupMeetingCreateRequest,
  WorkingGroupMeetingUpdateRequest,
  WorkingGroupFilters,
} from '@/types/working-group.types'

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const workingGroupKeys = {
  all: ['working-groups'] as const,
  lists: () => [...workingGroupKeys.all, 'list'] as const,
  list: (params?: WorkingGroupSearchParams) => [...workingGroupKeys.lists(), params] as const,
  details: () => [...workingGroupKeys.all, 'detail'] as const,
  detail: (id: string) => [...workingGroupKeys.details(), id] as const,
  full: (id: string) => [...workingGroupKeys.all, 'full', id] as const,
  members: (id: string) => [...workingGroupKeys.all, 'members', id] as const,
  deliverables: (id: string) => [...workingGroupKeys.all, 'deliverables', id] as const,
  meetings: (id: string) => [...workingGroupKeys.all, 'meetings', id] as const,
  decisions: (id: string) => [...workingGroupKeys.all, 'decisions', id] as const,
  stats: () => [...workingGroupKeys.all, 'stats'] as const,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token || ''}`,
  }
}

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

// ============================================================================
// WORKING GROUP HOOKS
// ============================================================================

/**
 * Hook to list working groups with optional filters
 */
export function useWorkingGroups(
  filters: WorkingGroupFilters = {},
  options?: Omit<UseQueryOptions<WorkingGroupListResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: workingGroupKeys.list(filters),
    queryFn: async (): Promise<WorkingGroupListResponse> => {
      const {
        search,
        status,
        wg_status,
        wg_type,
        parent_forum_id,
        lead_org_id,
        page = 1,
        limit = 20,
      } = filters
      const offset = (page - 1) * limit

      // Use RPC function for advanced search
      const { data, error } = await supabase.rpc('search_working_groups', {
        p_search_term: search || null,
        p_status: status && status !== 'all' ? status : null,
        p_wg_type: wg_type && wg_type !== 'all' ? wg_type : null,
        p_parent_forum_id: parent_forum_id || null,
        p_lead_org_id: lead_org_id || null,
        p_limit: limit,
        p_offset: offset,
      })

      if (error) throw new Error(error.message)

      // Get total count for pagination
      let countQuery = supabase
        .from('dossiers')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'working_group')
        .neq('archived', true)

      if (status && status !== 'all') {
        countQuery = countQuery.eq('status', status)
      }
      if (search) {
        countQuery = countQuery.or(`name_en.ilike.%${search}%,name_ar.ilike.%${search}%`)
      }

      const { count } = await countQuery

      return {
        data: (data || []) as WorkingGroup[],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          has_more: (data?.length || 0) === limit,
        },
      }
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  })
}

/**
 * Hook to get a single working group with full details
 */
export function useWorkingGroup(
  id: string | undefined,
  options?: Omit<UseQueryOptions<WorkingGroupFullResponse | null, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: workingGroupKeys.full(id || ''),
    queryFn: async (): Promise<WorkingGroupFullResponse | null> => {
      if (!id) return null

      const { data, error } = await supabase.rpc('get_working_group_full', {
        p_working_group_id: id,
      })

      if (error) throw new Error(error.message)
      if (!data) return null

      return data as WorkingGroupFullResponse
    },
    enabled: !!id,
    staleTime: 30_000,
    ...options,
  })
}

/**
 * Hook to create a new working group
 */
export function useCreateWorkingGroup() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('working-groups')

  return useMutation({
    mutationFn: async (data: WorkingGroupCreateRequest): Promise<WorkingGroup> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create dossier first
      // Map sensitivity_level string to integer (1=low, 2=medium, 3=high, 4=critical)
      const sensitivityMap: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 }
      const sensitivityInt =
        typeof data.sensitivity_level === 'string'
          ? sensitivityMap[data.sensitivity_level] || 1
          : data.sensitivity_level || 1

      const { data: dossier, error: dossierError } = await supabase
        .from('dossiers')
        .insert({
          type: 'working_group',
          name_en: data.name_en,
          name_ar: data.name_ar || data.name_en,
          description_en: data.summary_en,
          description_ar: data.summary_ar,
          status: 'active',
          sensitivity_level: sensitivityInt,
          tags: data.tags || [],
        })
        .select()
        .single()

      if (dossierError) throw new Error(dossierError.message)

      // Create working_groups extension
      const { data: workingGroup, error: wgError } = await supabase
        .from('working_groups')
        .insert({
          id: dossier.id,
          wg_type: data.wg_type,
          wg_status: data.wg_status || 'active',
          mandate_en: data.mandate_en,
          mandate_ar: data.mandate_ar,
          description_en: data.description_en,
          description_ar: data.description_ar,
          meeting_frequency: data.meeting_frequency,
          established_date: data.established_date,
          parent_forum_id: data.parent_forum_id,
          lead_org_id: data.lead_org_id,
          chair_person_id: data.chair_person_id,
          secretary_person_id: data.secretary_person_id,
          objectives: data.objectives,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single()

      if (wgError) {
        // Rollback dossier creation
        await supabase.from('dossiers').delete().eq('id', dossier.id)
        throw new Error(wgError.message)
      }

      // Auto-assign creator as owner
      await supabase.from('dossier_owners').insert({
        dossier_id: dossier.id,
        user_id: user.id,
        role_type: 'owner',
      })

      return {
        ...dossier,
        ...workingGroup,
      } as WorkingGroup
    },
    onSuccess: (newWorkingGroup) => {
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.lists() })
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.stats() })
      toast.success(t('messages.created', { name: newWorkingGroup.name_en }))
    },
    onError: (error) => {
      toast.error(t('messages.createError', { error: error.message }))
    },
  })
}

/**
 * Hook to update a working group
 */
export function useUpdateWorkingGroup() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('working-groups')

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: WorkingGroupUpdateRequest
    }): Promise<WorkingGroup> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update dossier fields
      const dossierUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (data.name_en !== undefined) dossierUpdates.name_en = data.name_en
      if (data.name_ar !== undefined) dossierUpdates.name_ar = data.name_ar
      if (data.summary_en !== undefined) dossierUpdates.summary_en = data.summary_en
      if (data.summary_ar !== undefined) dossierUpdates.summary_ar = data.summary_ar
      if (data.status !== undefined) dossierUpdates.status = data.status
      if (data.sensitivity_level !== undefined)
        dossierUpdates.sensitivity_level = data.sensitivity_level
      if (data.tags !== undefined) dossierUpdates.tags = data.tags

      const { error: dossierError } = await supabase
        .from('dossiers')
        .update(dossierUpdates)
        .eq('id', id)

      if (dossierError) throw new Error(dossierError.message)

      // Update working_groups extension fields
      const wgUpdates: Record<string, unknown> = { updated_by: user.id }
      if (data.wg_type !== undefined) wgUpdates.wg_type = data.wg_type
      if (data.wg_status !== undefined) wgUpdates.wg_status = data.wg_status
      if (data.mandate_en !== undefined) wgUpdates.mandate_en = data.mandate_en
      if (data.mandate_ar !== undefined) wgUpdates.mandate_ar = data.mandate_ar
      if (data.description_en !== undefined) wgUpdates.description_en = data.description_en
      if (data.description_ar !== undefined) wgUpdates.description_ar = data.description_ar
      if (data.meeting_frequency !== undefined) wgUpdates.meeting_frequency = data.meeting_frequency
      if (data.next_meeting_date !== undefined) wgUpdates.next_meeting_date = data.next_meeting_date
      if (data.disbandment_date !== undefined) wgUpdates.disbandment_date = data.disbandment_date
      if (data.parent_forum_id !== undefined) wgUpdates.parent_forum_id = data.parent_forum_id
      if (data.lead_org_id !== undefined) wgUpdates.lead_org_id = data.lead_org_id
      if (data.chair_person_id !== undefined) wgUpdates.chair_person_id = data.chair_person_id
      if (data.secretary_person_id !== undefined)
        wgUpdates.secretary_person_id = data.secretary_person_id
      if (data.objectives !== undefined) wgUpdates.objectives = data.objectives

      const { error: wgError } = await supabase
        .from('working_groups')
        .update(wgUpdates)
        .eq('id', id)

      if (wgError) throw new Error(wgError.message)

      // Fetch updated record
      const { data: result } = await supabase.rpc('get_working_group_full', {
        p_working_group_id: id,
      })

      return result?.working_group as WorkingGroup
    },
    onSuccess: (updatedWorkingGroup) => {
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.lists() })
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.full(updatedWorkingGroup.id) })
      toast.success(t('messages.updated'))
    },
    onError: (error) => {
      toast.error(t('messages.updateError', { error: error.message }))
    },
  })
}

/**
 * Hook to archive/delete a working group
 */
export function useDeleteWorkingGroup() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('working-groups')

  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      // Soft delete by archiving
      const { error } = await supabase
        .from('dossiers')
        .update({ archived: true, status: 'archived' })
        .eq('id', id)
        .eq('type', 'working_group')

      if (error) throw new Error(error.message)
      return id
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.lists() })
      queryClient.removeQueries({ queryKey: workingGroupKeys.full(deletedId) })
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.stats() })
      toast.success(t('messages.archived'))
    },
    onError: (error) => {
      toast.error(t('messages.archiveError', { error: error.message }))
    },
  })
}

// ============================================================================
// MEMBER HOOKS
// ============================================================================

/**
 * Hook to list members of a working group
 */
export function useWorkingGroupMembers(workingGroupId: string | undefined) {
  return useQuery({
    queryKey: workingGroupKeys.members(workingGroupId || ''),
    queryFn: async (): Promise<WorkingGroupMember[]> => {
      if (!workingGroupId) return []

      const { data, error } = await supabase
        .from('working_group_members')
        .select(
          `
          *,
          organizations:organization_id (
            id,
            dossiers:id (name_en, name_ar)
          ),
          countries:representing_country_id (
            id,
            dossiers:id (name_en, name_ar)
          )
        `,
        )
        .eq('working_group_id', workingGroupId)
        .order('role', { ascending: true })
        .order('joined_date', { ascending: true })

      if (error) throw new Error(error.message)

      return (data || []).map((m) => ({
        ...m,
        organization_name_en: m.organizations?.dossiers?.name_en,
        organization_name_ar: m.organizations?.dossiers?.name_ar,
        country_name_en: m.countries?.dossiers?.name_en,
        country_name_ar: m.countries?.dossiers?.name_ar,
      })) as WorkingGroupMember[]
    },
    enabled: !!workingGroupId,
    staleTime: 30_000,
  })
}

/**
 * Hook to add a member to a working group
 */
export function useAddWorkingGroupMember() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('working-groups')

  return useMutation({
    mutationFn: async ({
      workingGroupId,
      member,
    }: {
      workingGroupId: string
      member: WorkingGroupMemberCreateRequest
    }): Promise<WorkingGroupMember> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('working_group_members')
        .insert({
          working_group_id: workingGroupId,
          ...member,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data as WorkingGroupMember
    },
    onSuccess: (_, { workingGroupId }) => {
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.members(workingGroupId) })
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.full(workingGroupId) })
      toast.success(t('messages.memberAdded'))
    },
    onError: (error) => {
      toast.error(t('messages.memberAddError', { error: error.message }))
    },
  })
}

/**
 * Hook to update a working group member
 */
export function useUpdateWorkingGroupMember() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('working-groups')

  return useMutation({
    mutationFn: async ({
      workingGroupId,
      memberId,
      data,
    }: {
      workingGroupId: string
      memberId: string
      data: WorkingGroupMemberUpdateRequest
    }): Promise<WorkingGroupMember> => {
      const { data: result, error } = await supabase
        .from('working_group_members')
        .update(data)
        .eq('id', memberId)
        .eq('working_group_id', workingGroupId)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return result as WorkingGroupMember
    },
    onSuccess: (_, { workingGroupId }) => {
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.members(workingGroupId) })
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.full(workingGroupId) })
      toast.success(t('messages.memberUpdated'))
    },
  })
}

/**
 * Hook to remove a member from a working group
 */
export function useRemoveWorkingGroupMember() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('working-groups')

  return useMutation({
    mutationFn: async ({
      workingGroupId,
      memberId,
    }: {
      workingGroupId: string
      memberId: string
    }): Promise<void> => {
      const { error } = await supabase
        .from('working_group_members')
        .delete()
        .eq('id', memberId)
        .eq('working_group_id', workingGroupId)

      if (error) throw new Error(error.message)
    },
    onSuccess: (_, { workingGroupId }) => {
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.members(workingGroupId) })
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.full(workingGroupId) })
      toast.success(t('messages.memberRemoved'))
    },
  })
}

// ============================================================================
// DELIVERABLE HOOKS
// ============================================================================

/**
 * Hook to list deliverables of a working group
 */
export function useWorkingGroupDeliverables(workingGroupId: string | undefined) {
  return useQuery({
    queryKey: workingGroupKeys.deliverables(workingGroupId || ''),
    queryFn: async (): Promise<WorkingGroupDeliverable[]> => {
      if (!workingGroupId) return []

      const { data, error } = await supabase
        .from('working_group_deliverables')
        .select('*')
        .eq('working_group_id', workingGroupId)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('priority', { ascending: false })

      if (error) throw new Error(error.message)
      return (data || []) as WorkingGroupDeliverable[]
    },
    enabled: !!workingGroupId,
    staleTime: 30_000,
  })
}

/**
 * Hook to add a deliverable to a working group
 */
export function useAddWorkingGroupDeliverable() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('working-groups')

  return useMutation({
    mutationFn: async ({
      workingGroupId,
      deliverable,
    }: {
      workingGroupId: string
      deliverable: WorkingGroupDeliverableCreateRequest
    }): Promise<WorkingGroupDeliverable> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('working_group_deliverables')
        .insert({
          working_group_id: workingGroupId,
          ...deliverable,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data as WorkingGroupDeliverable
    },
    onSuccess: (_, { workingGroupId }) => {
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.deliverables(workingGroupId) })
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.full(workingGroupId) })
      toast.success(t('messages.deliverableAdded'))
    },
  })
}

/**
 * Hook to update a deliverable
 */
export function useUpdateWorkingGroupDeliverable() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('working-groups')

  return useMutation({
    mutationFn: async ({
      workingGroupId,
      deliverableId,
      data,
    }: {
      workingGroupId: string
      deliverableId: string
      data: WorkingGroupDeliverableUpdateRequest
    }): Promise<WorkingGroupDeliverable> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: result, error } = await supabase
        .from('working_group_deliverables')
        .update({ ...data, updated_by: user.id })
        .eq('id', deliverableId)
        .eq('working_group_id', workingGroupId)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return result as WorkingGroupDeliverable
    },
    onSuccess: (_, { workingGroupId }) => {
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.deliverables(workingGroupId) })
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.full(workingGroupId) })
      toast.success(t('messages.deliverableUpdated'))
    },
  })
}

/**
 * Hook to delete a deliverable
 */
export function useDeleteWorkingGroupDeliverable() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('working-groups')

  return useMutation({
    mutationFn: async ({
      workingGroupId,
      deliverableId,
    }: {
      workingGroupId: string
      deliverableId: string
    }): Promise<void> => {
      const { error } = await supabase
        .from('working_group_deliverables')
        .delete()
        .eq('id', deliverableId)
        .eq('working_group_id', workingGroupId)

      if (error) throw new Error(error.message)
    },
    onSuccess: (_, { workingGroupId }) => {
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.deliverables(workingGroupId) })
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.full(workingGroupId) })
      toast.success(t('messages.deliverableDeleted'))
    },
  })
}

// ============================================================================
// MEETING HOOKS
// ============================================================================

/**
 * Hook to list meetings of a working group
 */
export function useWorkingGroupMeetings(workingGroupId: string | undefined) {
  return useQuery({
    queryKey: workingGroupKeys.meetings(workingGroupId || ''),
    queryFn: async (): Promise<WorkingGroupMeeting[]> => {
      if (!workingGroupId) return []

      const { data, error } = await supabase
        .from('working_group_meetings')
        .select('*')
        .eq('working_group_id', workingGroupId)
        .order('meeting_date', { ascending: false })

      if (error) throw new Error(error.message)
      return (data || []) as WorkingGroupMeeting[]
    },
    enabled: !!workingGroupId,
    staleTime: 30_000,
  })
}

/**
 * Hook to add a meeting to a working group
 */
export function useAddWorkingGroupMeeting() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('working-groups')

  return useMutation({
    mutationFn: async ({
      workingGroupId,
      meeting,
    }: {
      workingGroupId: string
      meeting: WorkingGroupMeetingCreateRequest
    }): Promise<WorkingGroupMeeting> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('working_group_meetings')
        .insert({
          working_group_id: workingGroupId,
          ...meeting,
          status: 'scheduled',
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data as WorkingGroupMeeting
    },
    onSuccess: (_, { workingGroupId }) => {
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.meetings(workingGroupId) })
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.full(workingGroupId) })
      toast.success(t('messages.meetingScheduled'))
    },
  })
}

/**
 * Hook to update a meeting
 */
export function useUpdateWorkingGroupMeeting() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('working-groups')

  return useMutation({
    mutationFn: async ({
      workingGroupId,
      meetingId,
      data,
    }: {
      workingGroupId: string
      meetingId: string
      data: WorkingGroupMeetingUpdateRequest
    }): Promise<WorkingGroupMeeting> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: result, error } = await supabase
        .from('working_group_meetings')
        .update({ ...data, updated_by: user.id })
        .eq('id', meetingId)
        .eq('working_group_id', workingGroupId)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return result as WorkingGroupMeeting
    },
    onSuccess: (_, { workingGroupId }) => {
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.meetings(workingGroupId) })
      queryClient.invalidateQueries({ queryKey: workingGroupKeys.full(workingGroupId) })
      toast.success(t('messages.meetingUpdated'))
    },
  })
}

// ============================================================================
// STATS HOOK
// ============================================================================

/**
 * Hook to get aggregated stats for all working groups
 */
export function useWorkingGroupStats() {
  return useQuery({
    queryKey: workingGroupKeys.stats(),
    queryFn: async () => {
      const { data, error } = await supabase.from('working_group_stats').select('*')

      if (error) throw new Error(error.message)

      const stats = {
        total: data?.length || 0,
        active: data?.filter((wg) => wg.wg_status === 'active').length || 0,
        suspended: data?.filter((wg) => wg.wg_status === 'suspended').length || 0,
        disbanded: data?.filter((wg) => wg.wg_status === 'disbanded').length || 0,
        totalMembers: data?.reduce((acc, wg) => acc + (wg.active_member_count || 0), 0) || 0,
        totalDeliverables: data?.reduce((acc, wg) => acc + (wg.total_deliverables || 0), 0) || 0,
        completedDeliverables:
          data?.reduce((acc, wg) => acc + (wg.completed_deliverables || 0), 0) || 0,
        totalMeetings: data?.reduce((acc, wg) => acc + (wg.total_meetings || 0), 0) || 0,
      }

      return stats
    },
    staleTime: 60_000,
  })
}
