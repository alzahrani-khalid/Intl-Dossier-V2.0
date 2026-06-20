import { supabaseAdmin } from '../config/supabase'
import type { DossierType, IntelligenceChannel } from './intelligence-digest.service'

export interface IntelligenceAlertRule {
  id: string
  organization_id: string
  owner_id: string
  dossier_type: DossierType
  dossier_id: string
  condition_type: 'new_signal'
  condition_config: Record<string, unknown>
  channels: IntelligenceChannel[]
  is_active: boolean
  last_fired_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface CreateAlertRuleInput {
  organization_id: string
  owner_id: string
  dossier_type: DossierType
  dossier_id: string
  condition_type?: 'new_signal'
  condition_config?: Record<string, unknown>
  channels?: IntelligenceChannel[]
  is_active?: boolean
}

export type UpdateAlertRuleInput = Partial<
  Pick<
    IntelligenceAlertRule,
    'condition_config' | 'channels' | 'is_active' | 'condition_type' | 'dossier_type' | 'dossier_id'
  >
>

const validChannels = new Set<IntelligenceChannel>(['in_app', 'smtp', 'webhook'])

function normalizeChannels(channels?: IntelligenceChannel[]): IntelligenceChannel[] {
  if (channels == null || channels.length === 0) return ['in_app']
  if (!channels.every((channel) => validChannels.has(channel))) {
    throw Object.assign(new Error('Invalid alert channel'), {
      code: 'INVALID_CHANNEL',
      status: 400,
    })
  }
  return channels
}

function validateCondition(conditionType?: string): 'new_signal' {
  if (conditionType == null || conditionType === 'new_signal') return 'new_signal'
  throw Object.assign(new Error('Invalid alert condition'), {
    code: 'INVALID_CONDITION_TYPE',
    status: 400,
  })
}

export async function listAlertRules(ownerId: string): Promise<IntelligenceAlertRule[]> {
  const { data, error } = await supabaseAdmin
    .from('intelligence_alert_rules')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error != null) throw error
  return (data ?? []) as IntelligenceAlertRule[]
}

export async function createAlertRule(input: CreateAlertRuleInput): Promise<IntelligenceAlertRule> {
  const row = {
    organization_id: input.organization_id,
    owner_id: input.owner_id,
    dossier_type: input.dossier_type,
    dossier_id: input.dossier_id,
    condition_type: validateCondition(input.condition_type),
    condition_config: input.condition_config ?? {},
    channels: normalizeChannels(input.channels),
    is_active: input.is_active ?? true,
  }

  const { data, error } = await supabaseAdmin
    .from('intelligence_alert_rules')
    .insert(row)
    .select()
    .single()

  if (error != null) throw error
  return data as IntelligenceAlertRule
}

export async function updateAlertRule(
  id: string,
  ownerId: string,
  patch: UpdateAlertRuleInput,
): Promise<IntelligenceAlertRule> {
  const row: Record<string, unknown> = {
    ...patch,
    updated_at: new Date().toISOString(),
  }

  if (patch.condition_type != null) row.condition_type = validateCondition(patch.condition_type)
  if (patch.channels != null) row.channels = normalizeChannels(patch.channels)

  const { data, error } = await supabaseAdmin
    .from('intelligence_alert_rules')
    .update(row)
    .eq('id', id)
    .eq('owner_id', ownerId)
    .select()
    .single()

  if (error != null) throw error
  return data as IntelligenceAlertRule
}

export async function deleteAlertRule(id: string, ownerId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('intelligence_alert_rules')
    .delete()
    .eq('id', id)
    .eq('owner_id', ownerId)

  if (error != null) throw error
}
