/**
 * useMouLifecycle Hooks
 *
 * TanStack Query hooks for MoU lifecycle, parties, and government decisions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type {
  MouParty,
  MouPartyWithEntity,
  CreateMouPartyRequest,
  UpdateMouPartyRequest,
  GovernmentDecision,
  CreateGovernmentDecisionRequest,
  UpdateGovernmentDecisionRequest,
  UpdateMouLifecycleRequest,
  GovernmentDecisionFilters,
} from '@/types/mou-extended.types'

// Query keys
export const mouLifecycleKeys = {
  all: ['mou-lifecycle'] as const,
  parties: (mouId: string) => [...mouLifecycleKeys.all, 'parties', mouId] as const,
  decisions: () => [...mouLifecycleKeys.all, 'decisions'] as const,
  decisionsList: (filters?: Partial<GovernmentDecisionFilters>) =>
    [...mouLifecycleKeys.decisions(), 'list', filters] as const,
  decision: (id: string) => [...mouLifecycleKeys.decisions(), id] as const,
  amendmentChain: (id: string) => [...mouLifecycleKeys.all, 'amendment-chain', id] as const,
}

// ============================================================================
// MoU Parties Hooks
// ============================================================================

/**
 * Fetch parties for an MoU
 */
export function useMouParties(mouId: string) {
  return useQuery<MouPartyWithEntity[], Error>({
    queryKey: mouLifecycleKeys.parties(mouId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mou_parties')
        .select('*')
        .eq('mou_id', mouId)
        .order('created_at', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      // Enrich with entity names
      const parties = data || []
      const enrichedParties: MouPartyWithEntity[] = []

      for (const party of parties) {
        let entity_name_en: string | undefined
        let entity_name_ar: string | undefined

        if (party.party_type === 'country') {
          const { data: country } = await supabase
            .from('dossiers')
            .select('name_en, name_ar')
            .eq('id', party.party_id)
            .eq('type', 'country')
            .single()

          if (country) {
            entity_name_en = country.name_en
            entity_name_ar = country.name_ar
          }
        } else if (party.party_type === 'organization') {
          const { data: org } = await supabase
            .from('organizations')
            .select('name_en, name_ar')
            .eq('id', party.party_id)
            .single()

          if (org) {
            entity_name_en = org.name_en
            entity_name_ar = org.name_ar
          }
        }

        enrichedParties.push({
          ...party,
          entity_name_en,
          entity_name_ar,
        })
      }

      return enrichedParties
    },
    enabled: !!mouId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Add party to MoU
 */
export function useAddMouParty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateMouPartyRequest) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: party, error } = await supabase
        .from('mou_parties')
        .insert({
          ...data,
          role: data.role || 'signatory',
          party_status: data.party_status || 'pending',
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return party as MouParty
    },
    onSuccess: (party) => {
      queryClient.invalidateQueries({ queryKey: mouLifecycleKeys.parties(party.mou_id) })
      toast.success('Party added successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add party')
    },
  })
}

/**
 * Update MoU party
 */
export function useUpdateMouParty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      mouId,
      data,
    }: {
      id: string
      mouId: string
      data: UpdateMouPartyRequest
    }) => {
      const { data: party, error } = await supabase
        .from('mou_parties')
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

      return { party: party as MouParty, mouId }
    },
    onSuccess: ({ mouId }) => {
      queryClient.invalidateQueries({ queryKey: mouLifecycleKeys.parties(mouId) })
      toast.success('Party updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update party')
    },
  })
}

/**
 * Remove party from MoU
 */
export function useRemoveMouParty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, mouId }: { id: string; mouId: string }) => {
      const { error } = await supabase.from('mou_parties').delete().eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      return { id, mouId }
    },
    onSuccess: ({ mouId }) => {
      queryClient.invalidateQueries({ queryKey: mouLifecycleKeys.parties(mouId) })
      toast.success('Party removed successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to remove party')
    },
  })
}

// ============================================================================
// MoU Lifecycle Hooks
// ============================================================================

/**
 * Update MoU lifecycle stage
 */
export function useUpdateMouLifecycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ mouId, data }: { mouId: string; data: UpdateMouLifecycleRequest }) => {
      const updateData: Record<string, unknown> = {
        lifecycle_stage: data.new_stage,
        updated_at: new Date().toISOString(),
      }

      if (data.cabinet_ref) updateData.cabinet_decision_ref = data.cabinet_ref
      if (data.cabinet_date) updateData.cabinet_decision_date = data.cabinet_date
      if (data.royal_ref) updateData.royal_decree_ref = data.royal_ref
      if (data.royal_date) updateData.royal_decree_date = data.royal_date
      if (data.royal_date_hijri) updateData.royal_decree_date_hijri = data.royal_date_hijri

      const { data: mou, error } = await supabase
        .from('mous')
        .update(updateData)
        .eq('id', mouId)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return mou
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mous'] })
      queryClient.invalidateQueries({ queryKey: ['mou'] })
      toast.success('MoU lifecycle updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update lifecycle')
    },
  })
}

// ============================================================================
// Government Decisions Hooks
// ============================================================================

/**
 * Fetch government decisions
 */
export function useGovernmentDecisions(filters: Partial<GovernmentDecisionFilters> = {}) {
  return useQuery<GovernmentDecision[], Error>({
    queryKey: mouLifecycleKeys.decisionsList(filters),
    queryFn: async () => {
      let query = supabase
        .from('government_decisions')
        .select('*')
        .is('deleted_at', null)
        .order('decision_date', { ascending: false })

      if (filters.decision_type) {
        query = query.eq('decision_type', filters.decision_type)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.from_date) {
        query = query.gte('decision_date', filters.from_date)
      }
      if (filters.to_date) {
        query = query.lte('decision_date', filters.to_date)
      }
      if (filters.related_mou_id) {
        query = query.eq('related_mou_id', filters.related_mou_id)
      }
      if (filters.related_dossier_id) {
        query = query.eq('related_dossier_id', filters.related_dossier_id)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch single government decision
 */
export function useGovernmentDecision(id: string | undefined) {
  return useQuery<GovernmentDecision | null, Error>({
    queryKey: mouLifecycleKeys.decision(id || ''),
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('government_decisions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Create government decision
 */
export function useCreateGovernmentDecision() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateGovernmentDecisionRequest) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: decision, error } = await supabase
        .from('government_decisions')
        .insert({
          ...data,
          status: data.status || 'active',
          sensitivity_level: data.sensitivity_level || 'internal',
          tags: data.tags || [],
          metadata: data.metadata || {},
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return decision as GovernmentDecision
    },
    onSuccess: (decision) => {
      queryClient.invalidateQueries({ queryKey: mouLifecycleKeys.decisions() })
      queryClient.setQueryData(mouLifecycleKeys.decision(decision.id), decision)
      toast.success('Government decision created successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create decision')
    },
  })
}

/**
 * Update government decision
 */
export function useUpdateGovernmentDecision() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateGovernmentDecisionRequest }) => {
      const { data: decision, error } = await supabase
        .from('government_decisions')
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

      return decision as GovernmentDecision
    },
    onSuccess: (decision) => {
      queryClient.invalidateQueries({ queryKey: mouLifecycleKeys.decisions() })
      queryClient.setQueryData(mouLifecycleKeys.decision(decision.id), decision)
      toast.success('Government decision updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update decision')
    },
  })
}

/**
 * Delete government decision (soft delete)
 */
export function useDeleteGovernmentDecision() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('government_decisions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: mouLifecycleKeys.decisions() })
      queryClient.removeQueries({ queryKey: mouLifecycleKeys.decision(id) })
      toast.success('Government decision deleted successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete decision')
    },
  })
}
