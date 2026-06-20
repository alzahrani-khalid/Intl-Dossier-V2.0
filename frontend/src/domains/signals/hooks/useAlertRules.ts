import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DossierType } from '@/lib/dossier-type-guards'

export type AlertChannel = 'in_app' | 'smtp' | 'webhook'
export type AlertSeverityFilter = 'high' | 'urgent'

export interface AlertRuleConditionConfig {
  severity_filter?: AlertSeverityFilter[]
}

export interface AlertRule {
  id: string
  organization_id: string
  owner_id: string
  dossier_id: string
  dossier_type: DossierType
  dossier_name_en?: string | null
  dossier_name_ar?: string | null
  condition_type: 'new_signal'
  condition_config: AlertRuleConditionConfig
  channels: AlertChannel[]
  is_active: boolean
  last_fired_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateAlertRuleInput {
  dossier_id: string
  dossier_type: DossierType
  condition_type?: 'new_signal'
  condition_config?: AlertRuleConditionConfig
  channels: AlertChannel[]
  is_active?: boolean
}

export type UpdateAlertRuleInput = {
  id: string
  patch: Partial<
    Pick<AlertRule, 'dossier_id' | 'dossier_type' | 'condition_config' | 'channels' | 'is_active'>
  >
}

const QUERY_KEY = 'intelligence-alert-rules'

export const alertRuleKeys = {
  all: [QUERY_KEY] as const,
  list: (dossierId?: string) => [QUERY_KEY, 'list', dossierId] as const,
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

function normalizeRule(row: AlertRule): AlertRule {
  return {
    ...row,
    condition_type: 'new_signal',
    condition_config: row.condition_config ?? {},
    channels: Array.isArray(row.channels) && row.channels.length > 0 ? row.channels : ['in_app'],
    is_active: row.is_active !== false,
  }
}

export function useAlertRules(dossierId?: string): UseQueryResult<AlertRule[]> {
  return useQuery({
    queryKey: alertRuleKeys.list(dossierId),
    queryFn: async (): Promise<AlertRule[]> => {
      let query = supabase
        .from('intelligence_alert_rules')
        .select('*')
        .order('created_at', { ascending: false })
      if (dossierId !== undefined) query = query.eq('dossier_id', dossierId)

      const { data, error } = await query
      if (error) throw error

      const rows = ((data ?? []) as AlertRule[]).map(normalizeRule)
      const namesById = await fetchDossierNames(rows.map((row) => row.dossier_id))
      return rows.map((row) => ({
        ...row,
        dossier_name_en: namesById[row.dossier_id]?.name_en ?? null,
        dossier_name_ar: namesById[row.dossier_id]?.name_ar ?? null,
      }))
    },
    staleTime: 60_000,
  })
}

export function useCreateAlertRule(): UseMutationResult<AlertRule, Error, CreateAlertRuleInput> {
  const queryClient = useQueryClient()

  return useMutation<AlertRule, Error, CreateAlertRuleInput>({
    mutationFn: async (input): Promise<AlertRule> => {
      const { userId, organizationId } = await resolveAuthContext()
      const channels = input.channels.includes('in_app')
        ? input.channels
        : ['in_app', ...input.channels]

      const { data, error } = await supabase
        .from('intelligence_alert_rules')
        .insert({
          organization_id: organizationId,
          owner_id: userId,
          dossier_id: input.dossier_id,
          dossier_type: input.dossier_type,
          condition_type: input.condition_type ?? 'new_signal',
          condition_config: input.condition_config ?? {},
          channels,
          is_active: input.is_active ?? true,
        })
        .select()
        .single()
      if (error) throw error
      return normalizeRule(data as AlertRule)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: alertRuleKeys.all })
    },
  })
}

export function useUpdateAlertRule(): UseMutationResult<AlertRule, Error, UpdateAlertRuleInput> {
  const queryClient = useQueryClient()

  return useMutation<AlertRule, Error, UpdateAlertRuleInput>({
    mutationFn: async ({ id, patch }): Promise<AlertRule> => {
      const channels = patch.channels
        ? patch.channels.includes('in_app')
          ? patch.channels
          : ['in_app', ...patch.channels]
        : undefined

      const { data, error } = await supabase
        .from('intelligence_alert_rules')
        .update({
          ...patch,
          ...(channels ? { channels } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return normalizeRule(data as AlertRule)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: alertRuleKeys.all })
    },
  })
}

export function useDeleteAlertRule(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id): Promise<void> => {
      const { error } = await supabase.from('intelligence_alert_rules').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: alertRuleKeys.all })
    },
  })
}
