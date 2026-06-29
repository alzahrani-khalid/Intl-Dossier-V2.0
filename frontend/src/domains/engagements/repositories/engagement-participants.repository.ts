/**
 * Engagement participant sync (edit flow)
 * @module domains/engagements/repositories/engagement-participants.repository
 *
 * Writes engagement_participants directly via the supabase client — the same
 * path the create flow uses (engagement.config.ts postCreate) — so RLS applies
 * via the authenticated user's JWT. Kept in its own file so the edit-mode sync
 * sits beside, not inside, the api-client-backed engagements repository.
 */

import { supabase } from '@/lib/supabase'
import type { EngagementParticipant } from '@/types/engagement.types'

// Only dossier-linked participant types are editable through the wizard; the
// CHECK constraint also allows 'external', which the form cannot represent.
type SyncableParticipantType = 'country' | 'organization' | 'person'

/**
 * The wizard's three dossier-id arrays, as submitted by the engagement edit form.
 */
export interface EngagementParticipantSelection {
  countryIds: readonly string[]
  organizationIds: readonly string[]
  personIds: readonly string[]
}

interface DesiredParticipantRow {
  engagement_id: string
  participant_type: SyncableParticipantType
  participant_dossier_id: string
  role: 'delegate'
}

/**
 * Sync the engagement's dossier-linked participants to match the wizard
 * selection (edit flow). Diffs the form's selected ids against the
 * originally-loaded participant set, then INSERTs the added and DELETEs the
 * removed rows in `engagement_participants`.
 *
 * Mirrors the create flow's participant write (engagement.config.ts postCreate):
 * same row shape (`role: 'delegate'`, `created_by` = the authenticated user) and
 * the same direct supabase-client path.
 *
 * Only dossier-linked participants (country / organization / person rows carrying
 * a `participant_dossier_id`) are synced. `external`-typed participants — and any
 * row without a `participant_dossier_id` — are preserved untouched, because the
 * edit form cannot represent them (#78's pre-fill loads only dossier-linked ids).
 */
export async function syncEngagementParticipants(
  engagementId: string,
  selection: EngagementParticipantSelection,
  originalParticipants: readonly EngagementParticipant[],
): Promise<void> {
  // Desired dossier-linked set, keyed by `${type}:${dossierId}`.
  const desired = new Map<string, DesiredParticipantRow>()
  const collect = (ids: readonly string[], type: SyncableParticipantType): void => {
    for (const id of ids) {
      if (id === '') continue
      desired.set(`${type}:${id}`, {
        engagement_id: engagementId,
        participant_type: type,
        participant_dossier_id: id,
        role: 'delegate',
      })
    }
  }
  collect(selection.countryIds, 'country')
  collect(selection.organizationIds, 'organization')
  collect(selection.personIds, 'person')

  // Map the originally-loaded dossier-linked rows to their row id. External
  // participants (and any row missing a participant_dossier_id) are skipped so
  // they are never deleted — the form cannot represent them.
  const existingById = new Map<string, string>()
  for (const participant of originalParticipants) {
    const dossierId = participant.participant_dossier_id
    if (dossierId == null || dossierId === '') continue
    const type = participant.participant_type
    if (type !== 'country' && type !== 'organization' && type !== 'person') continue
    existingById.set(`${type}:${dossierId}`, participant.id)
  }

  const rowsToInsert: DesiredParticipantRow[] = []
  for (const [key, row] of desired) {
    if (!existingById.has(key)) rowsToInsert.push(row)
  }

  const idsToDelete: string[] = []
  for (const [key, id] of existingById) {
    if (!desired.has(key)) idsToDelete.push(id)
  }

  if (rowsToInsert.length === 0 && idsToDelete.length === 0) return

  if (rowsToInsert.length > 0) {
    const { data: auth } = await supabase.auth.getUser()
    const userId = auth.user?.id
    if (userId == null || userId === '') {
      console.warn(
        'syncEngagementParticipants: no authenticated user — skipping participant insert',
        { engagementId },
      )
    } else {
      const { error } = await supabase
        .from('engagement_participants')
        .insert(rowsToInsert.map((row) => ({ ...row, created_by: userId })))
      if (error) throw error
    }
  }

  if (idsToDelete.length > 0) {
    const { error } = await supabase.from('engagement_participants').delete().in('id', idsToDelete)
    if (error) throw error
  }
}
