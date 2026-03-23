/**
 * useCommittees Hooks
 *
 * TanStack Query hooks for committee, nomination, and membership operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type {
  Committee,
  CommitteeWithStats,
  CreateCommitteeRequest,
  UpdateCommitteeRequest,
  CommitteeFilters,
  CommitteeNomination,
  NominationWithNames,
  CreateNominationRequest,
  UpdateNominationRequest,
  ApproveNominationRequest,
  NominationFilters,
  CommitteeMember,
  MemberWithDetails,
  CreateMemberRequest,
  UpdateMemberRequest,
  MemberFilters,
} from '@/types/committee.types'

// Query keys
export const committeeKeys = {
  all: ['committees'] as const,
  lists: () => [...committeeKeys.all, 'list'] as const,
  list: (filters?: Partial<CommitteeFilters>) => [...committeeKeys.lists(), filters] as const,
  details: () => [...committeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...committeeKeys.details(), id] as const,
  nominations: (committeeId: string) => [...committeeKeys.all, 'nominations', committeeId] as const,
  members: (committeeId: string) => [...committeeKeys.all, 'members', committeeId] as const,
  personMemberships: (personId: string) =>
    [...committeeKeys.all, 'person-memberships', personId] as const,
}

// ============================================================================
// Committee Hooks
// ============================================================================

/**
 * Fetch paginated list of committees
 */
export function useCommittees(filters: Partial<CommitteeFilters> = {}) {
  return useQuery<CommitteeWithStats[], Error>({
    queryKey: committeeKeys.list(filters),
    queryFn: async () => {
      let query = supabase.from('committees').select('*', { count: 'exact' }).is('deleted_at', null)

      if (filters.forum_id) {
        query = query.eq('forum_id', filters.forum_id)
      }
      if (filters.organization_id) {
        query = query.eq('organization_id', filters.organization_id)
      }
      if (filters.committee_type) {
        query = query.eq('committee_type', filters.committee_type)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public)
      }

      query = query.order('name_en', { ascending: true })

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Get pending nominations count for each committee
      const committeeIds = (data || []).map((c) => c.id)
      const nominationsCounts: Record<string, number> = {}

      if (committeeIds.length > 0) {
        const { data: nominations } = await supabase
          .from('committee_nominations')
          .select('committee_id')
          .in('committee_id', committeeIds)
          .eq('status', 'pending')

        if (nominations) {
          nominations.forEach((n) => {
            nominationsCounts[n.committee_id] = (nominationsCounts[n.committee_id] || 0) + 1
          })
        }
      }

      const committees: CommitteeWithStats[] = (data || []).map((c) => ({
        ...c,
        pending_nominations_count: nominationsCounts[c.id] || 0,
      }))

      return committees
    },
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch single committee with details
 */
export function useCommittee(id: string | undefined) {
  return useQuery<CommitteeWithStats | null, Error>({
    queryKey: committeeKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase.from('committees').select('*').eq('id', id).single()

      if (error) {
        throw new Error(error.message)
      }

      // Get current members
      const { data: members } = await supabase
        .from('committee_members')
        .select('*')
        .eq('committee_id', id)
        .eq('is_current', true)
        .eq('status', 'active')

      // Get pending nominations count
      const { count: pendingCount } = await supabase
        .from('committee_nominations')
        .select('*', { count: 'exact', head: true })
        .eq('committee_id', id)
        .eq('status', 'pending')

      return {
        ...data,
        active_members: members || [],
        pending_nominations_count: pendingCount || 0,
      } as CommitteeWithStats
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Create committee
 */
export function useCreateCommittee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCommitteeRequest) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: committee, error } = await supabase
        .from('committees')
        .insert({
          ...data,
          current_member_count: 0,
          status: 'forming',
          is_renewable: data.is_renewable ?? true,
          is_standing: data.is_standing ?? false,
          is_public: data.is_public ?? true,
          documents: data.documents || [],
          tags: data.tags || [],
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return committee as Committee
    },
    onSuccess: (committee) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() })
      queryClient.setQueryData(committeeKeys.detail(committee.id), committee)
      toast.success('Committee created successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create committee')
    },
  })
}

/**
 * Update committee
 */
export function useUpdateCommittee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCommitteeRequest }) => {
      const { data: committee, error } = await supabase
        .from('committees')
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

      return committee as Committee
    },
    onSuccess: (committee) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() })
      queryClient.setQueryData(committeeKeys.detail(committee.id), committee)
      toast.success('Committee updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update committee')
    },
  })
}

/**
 * Delete committee (soft delete)
 */
export function useDeleteCommittee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('committees')
        .update({ deleted_at: new Date().toISOString(), status: 'dissolved' })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() })
      queryClient.removeQueries({ queryKey: committeeKeys.detail(id) })
      toast.success('Committee deleted successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete committee')
    },
  })
}

// ============================================================================
// Nomination Hooks
// ============================================================================

/**
 * Fetch nominations for a committee
 */
export function useCommitteeNominations(
  committeeId: string,
  filters: Partial<NominationFilters> = {},
) {
  return useQuery<NominationWithNames[], Error>({
    queryKey: committeeKeys.nominations(committeeId),
    queryFn: async () => {
      let query = supabase
        .from('committee_nominations')
        .select('*')
        .eq('committee_id', committeeId)
        .order('nomination_date', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.nominated_by_type) {
        query = query.eq('nominated_by_type', filters.nominated_by_type)
      }
      if (filters.role) {
        query = query.eq('role', filters.role)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Get committee name
      const { data: committee } = await supabase
        .from('committees')
        .select('name_en, name_ar')
        .eq('id', committeeId)
        .single()

      return (data || []).map((n) => ({
        ...n,
        committee_name_en: committee?.name_en,
        committee_name_ar: committee?.name_ar,
      })) as NominationWithNames[]
    },
    enabled: !!committeeId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Create nomination
 */
export function useCreateNomination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateNominationRequest) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: nomination, error } = await supabase
        .from('committee_nominations')
        .insert({
          ...data,
          status: 'pending',
          role: data.role || 'member',
          supporting_documents: data.supporting_documents || [],
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return nomination as CommitteeNomination
    },
    onSuccess: (nomination) => {
      queryClient.invalidateQueries({
        queryKey: committeeKeys.nominations(nomination.committee_id),
      })
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() })
      toast.success('Nomination submitted successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to submit nomination')
    },
  })
}

/**
 * Update nomination status
 */
export function useUpdateNomination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      committeeId,
      data,
    }: {
      id: string
      committeeId: string
      data: UpdateNominationRequest
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const updateData: Record<string, unknown> = {
        ...data,
        updated_at: new Date().toISOString(),
      }

      // If approving or rejecting, record reviewer
      if (data.status === 'approved' || data.status === 'rejected') {
        updateData.reviewed_by = user?.id
        updateData.reviewed_at = new Date().toISOString()
      }

      const { data: nomination, error } = await supabase
        .from('committee_nominations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return { nomination: nomination as CommitteeNomination, committeeId }
    },
    onSuccess: ({ committeeId }) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.nominations(committeeId) })
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() })
      toast.success('Nomination updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update nomination')
    },
  })
}

/**
 * Approve nomination and create membership
 */
export function useApproveNomination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      data,
      committeeId,
    }: {
      data: ApproveNominationRequest
      committeeId: string
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Get nomination details
      const { data: nomination, error: nomError } = await supabase
        .from('committee_nominations')
        .select('*')
        .eq('id', data.nomination_id)
        .single()

      if (nomError || !nomination) {
        throw new Error('Nomination not found')
      }

      // Create member record
      const { data: member, error: memberError } = await supabase
        .from('committee_members')
        .insert({
          committee_id: nomination.committee_id,
          person_id: nomination.nominated_person_id,
          member_name_en: nomination.nominee_name_en || '',
          member_name_ar: nomination.nominee_name_ar || '',
          member_title_en: nomination.nominee_title_en,
          member_title_ar: nomination.nominee_title_ar,
          representing_type:
            nomination.nominated_by_type === 'self' ? 'self' : nomination.nominated_by_type,
          representing_id: nomination.nominated_by_id,
          representing_name_en: nomination.nominated_by_name_en,
          representing_name_ar: nomination.nominated_by_name_ar,
          role: nomination.role,
          term_start:
            data.term_start || nomination.requested_term_start || new Date().toISOString(),
          term_end: data.term_end || nomination.requested_term_end,
          is_current: true,
          nomination_id: nomination.id,
          meetings_attended: 0,
          meetings_total: 0,
          status: 'active',
          created_by: user?.id,
        })
        .select()
        .single()

      if (memberError) {
        throw new Error(memberError.message)
      }

      // Update nomination status
      const { error: updateError } = await supabase
        .from('committee_nominations')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          membership_id: member.id,
        })
        .eq('id', data.nomination_id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Update committee member count
      await supabase.rpc('increment_committee_member_count', {
        p_committee_id: nomination.committee_id,
      })

      return { member: member as CommitteeMember, committeeId }
    },
    onSuccess: ({ committeeId }) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.nominations(committeeId) })
      queryClient.invalidateQueries({ queryKey: committeeKeys.members(committeeId) })
      queryClient.invalidateQueries({ queryKey: committeeKeys.detail(committeeId) })
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() })
      toast.success('Nomination approved and member added')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to approve nomination')
    },
  })
}

// ============================================================================
// Member Hooks
// ============================================================================

/**
 * Fetch members for a committee
 */
export function useCommitteeMembers(committeeId: string, filters: Partial<MemberFilters> = {}) {
  return useQuery<MemberWithDetails[], Error>({
    queryKey: committeeKeys.members(committeeId),
    queryFn: async () => {
      let query = supabase
        .from('committee_members')
        .select('*')
        .eq('committee_id', committeeId)
        .order('role', { ascending: true })
        .order('member_name_en', { ascending: true })

      if (filters.role) {
        query = query.eq('role', filters.role)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.is_current !== undefined) {
        query = query.eq('is_current', filters.is_current)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Get committee info
      const { data: committee } = await supabase
        .from('committees')
        .select('name_en, committee_type')
        .eq('id', committeeId)
        .single()

      return (data || []).map((m) => ({
        ...m,
        committee_name_en: committee?.name_en,
        committee_type: committee?.committee_type,
      })) as MemberWithDetails[]
    },
    enabled: !!committeeId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Create member directly
 */
export function useCreateCommitteeMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateMemberRequest) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: member, error } = await supabase
        .from('committee_members')
        .insert({
          ...data,
          is_current: true,
          meetings_attended: 0,
          meetings_total: 0,
          status: 'active',
          role: data.role || 'member',
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Update committee member count
      await supabase.rpc('increment_committee_member_count', {
        p_committee_id: data.committee_id,
      })

      return member as CommitteeMember
    },
    onSuccess: (member) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.members(member.committee_id) })
      queryClient.invalidateQueries({ queryKey: committeeKeys.detail(member.committee_id) })
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() })
      toast.success('Member added successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add member')
    },
  })
}

/**
 * Update member
 */
export function useUpdateCommitteeMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      committeeId,
      data,
    }: {
      id: string
      committeeId: string
      data: UpdateMemberRequest
    }) => {
      const { data: member, error } = await supabase
        .from('committee_members')
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

      return { member: member as CommitteeMember, committeeId }
    },
    onSuccess: ({ committeeId }) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.members(committeeId) })
      queryClient.invalidateQueries({ queryKey: committeeKeys.detail(committeeId) })
      toast.success('Member updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update member')
    },
  })
}

/**
 * Remove member (end membership)
 */
export function useRemoveCommitteeMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      committeeId,
      reason,
    }: {
      id: string
      committeeId: string
      reason?: string
    }) => {
      const { error } = await supabase
        .from('committee_members')
        .update({
          is_current: false,
          status: 'removed',
          status_reason: reason,
          status_effective_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      // Decrement committee member count
      await supabase.rpc('decrement_committee_member_count', {
        p_committee_id: committeeId,
      })

      return { id, committeeId }
    },
    onSuccess: ({ committeeId }) => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.members(committeeId) })
      queryClient.invalidateQueries({ queryKey: committeeKeys.detail(committeeId) })
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() })
      toast.success('Member removed successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member')
    },
  })
}

/**
 * Fetch all memberships for a person
 */
export function usePersonMemberships(personId: string) {
  return useQuery<MemberWithDetails[], Error>({
    queryKey: committeeKeys.personMemberships(personId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_members')
        .select(
          `
          *,
          committees!inner(name_en, committee_type)
        `,
        )
        .eq('person_id', personId)
        .order('term_start', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return (data || []).map((m: any) => ({
        ...m,
        committee_name_en: m.committees?.name_en,
        committee_type: m.committees?.committee_type,
      })) as MemberWithDetails[]
    },
    enabled: !!personId,
    staleTime: 1000 * 60 * 5,
  })
}
