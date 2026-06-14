/**
 * useSignalMutations — create + status-update (Phase 69, Wave 2).
 *
 * Direct Supabase JS mutations under the caller's JWT (RLS-enforced, never the
 * service-role client). The intelligence_event INSERT/UPDATE RLS policies
 * (clearance-gated; INSERT pins created_by = auth.uid()) enforce authorization
 * at the DB layer.
 *
 * @module domains/signals/hooks/useSignalMutations
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  type CreateSignalInput,
  type UpdateSignalStatusInput,
  signalKeys,
} from '../types/signal.types'

/**
 * Resolve the current user id and their tenant (default organization) for the
 * intelligence_event INSERT. organization_id is NOT NULL and the INSERT RLS
 * requires the caller to be a member of that org (tenant_isolation.rls_insert_policy);
 * the user's default_organization_id is that membership.
 */
async function resolveAuthContext(): Promise<{ userId: string; organizationId: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('default_organization_id')
    .eq('id', user.id)
    .single()
  if (profileError) throw profileError

  const organizationId = profile?.default_organization_id as string | null
  if (!organizationId) throw new Error('No organization for current user')

  return { userId: user.id, organizationId }
}

/**
 * Create a signal: insert into intelligence_event, then link junction rows.
 *
 * source_type defaults to 'human_entered' (CaptureSignalForm path). Passing
 * sourceType='ai_generated' with aiConfidence enables the D-13 AI write path —
 * SAME insert path, SAME clearance-gated INSERT RLS, no separate branch. ai_confidence
 * is null for human_entered, non-null for ai_generated.
 *
 * NOTE: dossier_type per junction row MUST match the live dossiers.type value for each
 * dossier_id. The caller is responsible for passing a correct `dossierTypes` map; the
 * junction CHECK only accepts country|organization|forum|engagement|topic|working_group|person.
 */
export function useCreateSignal(): UseMutationResult<{ id: string }, Error, CreateSignalInput> {
  const queryClient = useQueryClient()

  return useMutation<{ id: string }, Error, CreateSignalInput>({
    mutationFn: async (input: CreateSignalInput): Promise<{ id: string }> => {
      const { userId, organizationId } = await resolveAuthContext()

      const sourceType = input.sourceType ?? 'human_entered'
      const aiConfidence = sourceType === 'ai_generated' ? (input.aiConfidence ?? null) : null

      const { data: ie, error } = await supabase
        .from('intelligence_event')
        .insert({
          organization_id: organizationId,
          source_type: sourceType,
          ai_confidence: aiConfidence,
          title: input.title,
          content: input.body,
          occurred_at: new Date().toISOString(),
          severity: input.severity,
          sensitivity_level: input.sensitivityLevel,
          category: input.category,
          status: 'new',
          created_by: userId,
        })
        .select('id')
        .single()
      if (error) throw error

      const eventId = (ie as { id: string }).id

      if (input.dossierIds.length > 0) {
        const { error: junctionError } = await supabase.from('intelligence_event_dossiers').insert(
          input.dossierIds.map((did) => ({
            event_id: eventId,
            dossier_type: input.dossierTypes?.[did] ?? 'topic',
            dossier_id: did,
          })),
        )
        if (junctionError) throw junctionError
      }

      return { id: eventId }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: signalKeys.lists() })
    },
    onError: (error: Error) => {
      console.error('Failed to create signal:', error.message)
    },
  })
}

/**
 * Update a signal's status under the caller's JWT.
 *
 * Covers acknowledge (→acknowledged), dismiss (→dismissed), restore (dismissed→acknowledged,
 * D-04 — nothing hard-deleted), and the escalation status flip (→escalated). The
 * intelligence_event UPDATE RLS allows this when the signal is within the caller's clearance.
 */
export function useUpdateSignalStatus(): UseMutationResult<void, Error, UpdateSignalStatusInput> {
  const queryClient = useQueryClient()

  return useMutation<void, Error, UpdateSignalStatusInput>({
    mutationFn: async (input: UpdateSignalStatusInput): Promise<void> => {
      const { error } = await supabase
        .from('intelligence_event')
        .update({ status: input.status })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: signalKeys.lists() })
    },
    onError: (error: Error) => {
      console.error('Failed to update signal status:', error.message)
    },
  })
}
