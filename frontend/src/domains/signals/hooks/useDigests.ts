import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DossierType } from '@/lib/dossier-type-guards'

export type DigestFrequency = 'daily' | 'weekly' | 'monthly'
export type IntelligenceChannel = 'in_app' | 'smtp' | 'webhook'

export interface DigestFilters {
  dossierId?: string
  limit?: number
}

export interface DigestSummarySections {
  signals: Array<Record<string, unknown>>
  engagements: Array<Record<string, unknown>>
  commitments: Array<Record<string, unknown>>
  statusChanges: Array<Record<string, unknown>>
}

export interface Digest {
  id: string
  dossier_id: string
  dossier_type: DossierType | string
  dossier_name_en?: string | null
  dossier_name_ar?: string | null
  frequency: DigestFrequency | string
  period: string
  summary: string
  generated_at: string
  published_at: string
  clearance_level_at_generation: number
}

export interface DigestSubscription {
  id: string
  organization_id: string
  subscriber_id: string
  dossier_id: string
  dossier_type: DossierType
  dossier_name_en?: string | null
  dossier_name_ar?: string | null
  frequency: DigestFrequency
  frequency_config: {
    channels?: IntelligenceChannel[]
    day_of_month?: number
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SubscribeToDigestInput {
  dossierId: string
  dossierType: DossierType
  frequency: DigestFrequency
  frequencyConfig?: DigestSubscription['frequency_config']
}

export interface UnsubscribeFromDigestInput {
  dossierId: string
}

export const digestKeys = {
  all: ['intelligence-digests'] as const,
  list: (filters: DigestFilters) => [...digestKeys.all, 'list', filters] as const,
  subscriptions: (dossierId?: string) => [...digestKeys.all, 'subscriptions', dossierId] as const,
}

async function resolveAuthContext(): Promise<{ userId: string; organizationId: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('users')
    .select('default_organization_id')
    .eq('id', user.id)
    .single()
  if (error) throw error

  const organizationId = (data as { default_organization_id?: string | null } | null)
    ?.default_organization_id
  if (!organizationId) throw new Error('No organization for current user')

  return { userId: user.id, organizationId }
}

async function fetchDossierNames(
  dossierIds: string[],
): Promise<Record<string, { name_en: string | null; name_ar: string | null }>> {
  const ids = Array.from(new Set(dossierIds.filter(Boolean)))
  if (ids.length === 0) return {}

  const { data, error } = await supabase.from('dossiers').select('id,name_en,name_ar').in('id', ids)
  if (error) throw error

  return (
    (data ?? []) as Array<{ id: string; name_en: string | null; name_ar: string | null }>
  ).reduce<Record<string, { name_en: string | null; name_ar: string | null }>>((acc, row) => {
    acc[row.id] = { name_en: row.name_en, name_ar: row.name_ar }
    return acc
  }, {})
}

function withDossierNames<T extends { dossier_id: string }>(
  rows: T[],
  namesById: Record<string, { name_en: string | null; name_ar: string | null }>,
): Array<T & { dossier_name_en?: string | null; dossier_name_ar?: string | null }> {
  return rows.map((row) => ({
    ...row,
    dossier_name_en: namesById[row.dossier_id]?.name_en ?? null,
    dossier_name_ar: namesById[row.dossier_id]?.name_ar ?? null,
  }))
}

export function useDigests(filters: DigestFilters = {}): UseQueryResult<Digest[]> {
  return useQuery({
    queryKey: digestKeys.list(filters),
    queryFn: async (): Promise<Digest[]> => {
      const { data, error } = await supabase.rpc('read_digests', {
        p_dossier_id: filters.dossierId ?? null,
        p_limit: filters.limit ?? 50,
      })
      if (error) throw error

      const rows = ((data ?? []) as Digest[]).map((row) => ({
        ...row,
        id: String(row.id),
        dossier_id: String(row.dossier_id),
      }))
      const namesById = await fetchDossierNames(rows.map((row) => row.dossier_id))
      return withDossierNames(rows, namesById)
    },
    staleTime: 60_000,
  })
}

export function useDigestSubscriptions(dossierId?: string): UseQueryResult<DigestSubscription[]> {
  return useQuery({
    queryKey: digestKeys.subscriptions(dossierId),
    queryFn: async (): Promise<DigestSubscription[]> => {
      let query = supabase
        .from('intelligence_digest_subscriptions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (dossierId !== undefined) query = query.eq('dossier_id', dossierId)

      const { data, error } = await query
      if (error) throw error

      const rows = (data ?? []) as DigestSubscription[]
      const namesById = await fetchDossierNames(rows.map((row) => row.dossier_id))
      return withDossierNames(rows, namesById)
    },
    staleTime: 60_000,
  })
}

export function useSubscribeToDigest(): UseMutationResult<
  DigestSubscription,
  Error,
  SubscribeToDigestInput
> {
  const queryClient = useQueryClient()

  return useMutation<DigestSubscription, Error, SubscribeToDigestInput>({
    mutationFn: async (input): Promise<DigestSubscription> => {
      const { userId, organizationId } = await resolveAuthContext()

      const { error: deactivateError } = await supabase
        .from('intelligence_digest_subscriptions')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('subscriber_id', userId)
        .eq('dossier_id', input.dossierId)
      if (deactivateError) throw deactivateError

      const { data, error } = await supabase
        .from('intelligence_digest_subscriptions')
        .upsert(
          {
            organization_id: organizationId,
            subscriber_id: userId,
            dossier_id: input.dossierId,
            dossier_type: input.dossierType,
            frequency: input.frequency,
            frequency_config: input.frequencyConfig ?? { channels: ['in_app'] },
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'subscriber_id,dossier_id,frequency' },
        )
        .select()
        .single()
      if (error) throw error
      return data as DigestSubscription
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: digestKeys.all })
      void queryClient.invalidateQueries({
        queryKey: digestKeys.subscriptions(variables.dossierId),
      })
    },
  })
}

export function useUnsubscribeFromDigest(): UseMutationResult<
  void,
  Error,
  UnsubscribeFromDigestInput
> {
  const queryClient = useQueryClient()

  return useMutation<void, Error, UnsubscribeFromDigestInput>({
    mutationFn: async (input): Promise<void> => {
      const { userId } = await resolveAuthContext()
      const { error } = await supabase
        .from('intelligence_digest_subscriptions')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('subscriber_id', userId)
        .eq('dossier_id', input.dossierId)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: digestKeys.all })
      void queryClient.invalidateQueries({
        queryKey: digestKeys.subscriptions(variables.dossierId),
      })
    },
  })
}
