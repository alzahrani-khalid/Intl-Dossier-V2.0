/**
 * useApproveWrite — the four caller-JWT commit paths for approved copilot writes
 * (P73 GENUI-03 commit-under-caller-JWT + GENUI-04 post-commit invalidation).
 *
 * On Approve in a ConfirmActionCard, proposeToolUIs calls one of these commit functions.
 * Each performs its write through the SAME proven INVOKER path the conventional UI uses,
 * under the authenticated `@/lib/supabase` client (caller JWT) — NEVER a service-role
 * client (none is importable in the frontend). After the write RESOLVES (post-commit, not
 * optimistic — D-05), it invalidates the matching TanStack Query keys so the conventional
 * UI reflects the change with no reload.
 *
 * INVOKER paths (mirroring the existing hooks):
 *  - signal  → intelligence_event UPDATE { status, dismissed_by|escalated_by=auth.uid(),
 *              status_changed_at } (the D-06 actor columns); like useSignalMutations.
 *  - digest  → rpc('publish_digest', ...); like GenerateDigestButton.
 *  - work    → tasks-create edge fn → work-item-dossiers edge fn; like useSignalEscalate.
 *  - brief   → rpc('persist_brief', { p_dossier_id, p_content, p_title, p_summary });
 *              a NULL return (non-editable dossier) is a neutral FAILURE, not a success.
 *
 * Each commit THROWS on any error (and treats a NULL persist_brief return as a failure)
 * so the renderer sets the card to its neutral `error` state. A genuine RLS denial throws
 * the same way a generic failure does (indistinguishable-empty is enforced in the card's
 * copy, not here).
 *
 * @module components/copilot/hitl/useApproveWrite
 */
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { signalKeys } from '@/domains/signals/types/signal.types'
import { digestKeys, type DigestFrequency } from '@/domains/signals/hooks/useDigests'
import { workItemKeys } from '@/domains/work-items/keys'
import { dossierKeys } from '@/domains/dossiers/hooks/useDossier'

export type SignalCommitAction = 'dismiss' | 'escalate'
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'urgent'

/** The single bilingual envelope propose_brief produces and persist_brief stores. */
export interface BriefContent {
  en: { summary: string; sections: unknown[] }
  ar: { summary: string; sections: unknown[] }
}

export interface CommitSignalStatusInput {
  signalId: string
  action: SignalCommitAction
}

export interface CommitPublishDigestInput {
  dossierId: string
  period: DigestFrequency
  summary: string
  /**
   * Clearance watermark to stamp on the digest. Omit it (the copilot path does): the
   * publish_digest RPC then derives the caller's real clearance from their profile via
   * COALESCE(p_clearance_level_at_generation, v_clearance). NEVER hard-default to 1 — a
   * fixed 1 understates the watermark for higher-clearance callers (GAP-1).
   */
  clearanceLevel?: number
}

export interface CommitWorkItemInput {
  title: string
  assigneeId: string
  priority?: WorkItemPriority
  dossierIds: string[]
  inheritanceSource?: string
}

export interface CommitBriefInput {
  dossierId: string
  content: BriefContent
  title?: string | null
  summary?: string | null
}

export interface UseApproveWriteResult {
  commitSignalStatus: (input: CommitSignalStatusInput) => Promise<void>
  commitPublishDigest: (input: CommitPublishDigestInput) => Promise<void>
  commitWorkItem: (input: CommitWorkItemInput) => Promise<{ taskId: string }>
  commitBrief: (input: CommitBriefInput) => Promise<{ briefId: string }>
}

/** Resolve the current authenticated user id (the signal actor). Caller-JWT only. */
async function resolveUid(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export function useApproveWrite(): UseApproveWriteResult {
  const queryClient = useQueryClient()

  /**
   * Signal dismiss/escalate: flip status + record the D-06 actor + timestamp in the SAME
   * caller-JWT UPDATE. The intelligence_event_update_cleared RLS authorizes it; a genuine
   * denial throws (surfaced as the card's neutral error).
   */
  const commitSignalStatus = async ({
    signalId,
    action,
  }: CommitSignalStatusInput): Promise<void> => {
    const uid = await resolveUid()
    const status = action === 'dismiss' ? 'dismissed' : 'escalated'
    const actorColumn = action === 'dismiss' ? 'dismissed_by' : 'escalated_by'

    const payload: Record<string, unknown> = {
      status,
      [actorColumn]: uid,
      status_changed_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('intelligence_event').update(payload).eq('id', signalId)
    if (error) throw error

    // Post-commit (only now that the UPDATE resolved): refresh the signal lists.
    await queryClient.invalidateQueries({ queryKey: signalKeys.lists() })
  }

  /**
   * Publish digest to subscribers via the already-INVOKER publish_digest RPC under the
   * caller JWT. When clearanceLevel is omitted we pass null so the RPC stamps the caller's
   * real clearance (LEAST(COALESCE(arg, v_clearance), v_clearance)); passing a fixed 1
   * understated the watermark and could surface L4-sourced digests to L1 readers (GAP-1).
   * Post-commit invalidates the digest keys.
   */
  const commitPublishDigest = async ({
    dossierId,
    period,
    summary,
    clearanceLevel,
  }: CommitPublishDigestInput): Promise<void> => {
    const { error } = await supabase.rpc('publish_digest', {
      p_dossier_id: dossierId,
      p_period: period,
      p_summary: summary,
      p_clearance_level_at_generation: clearanceLevel ?? null,
    })
    if (error) throw error

    await queryClient.invalidateQueries({ queryKey: digestKeys.all })
  }

  /**
   * Create a Kanban task then copy the dossier links onto it — the proven 2-step
   * caller-JWT path (useSignalEscalate). work_item_type is the literal 'task' (a variable
   * string silently fails the work_item_dossiers INSERT RLS). Post-commit invalidates the
   * work-item + dossier keys.
   */
  const commitWorkItem = async ({
    title,
    assigneeId,
    priority,
    dossierIds,
    inheritanceSource,
  }: CommitWorkItemInput): Promise<{ taskId: string }> => {
    const workItemType = 'task' as const

    const { data: taskData, error: taskError } = await supabase.functions.invoke<{
      task: { id: string }
    }>('tasks-create', {
      body: {
        title,
        priority,
        workflow_stage: 'todo',
        assignee_id: assigneeId,
      },
    })
    if (taskError) throw new Error(taskError.message || 'Task creation failed')
    const taskId = taskData?.task?.id
    if (!taskId) throw new Error('No task ID returned')

    if (dossierIds.length > 0) {
      const { error: linkError } = await supabase.functions.invoke('work-item-dossiers', {
        body: {
          work_item_type: workItemType,
          work_item_id: taskId,
          dossier_ids: dossierIds,
          inheritance_source: inheritanceSource ?? 'direct',
        },
      })
      if (linkError) throw new Error(linkError.message || 'Dossier link failed')
    }

    const primaryDossierId = dossierIds[0]
    await queryClient.invalidateQueries({ queryKey: workItemKeys.lists() })
    if (primaryDossierId != null) {
      await queryClient.invalidateQueries({ queryKey: workItemKeys.byDossier(primaryDossierId) })
      await queryClient.invalidateQueries({ queryKey: dossierKeys.detail(primaryDossierId) })
    }

    return { taskId }
  }

  /**
   * Persist a copilot-generated brief via the new caller-JWT INVOKER persist_brief RPC.
   * p_content is the SINGLE { en, ar } envelope (reconciled to the live briefs `content`
   * jsonb — there is no p_content_en/p_content_ar/p_engagement_dossier_id). A NULL return
   * means the caller cannot edit the dossier (indistinguishable-empty) — treat it as a
   * neutral FAILURE (throw), never claim success. Post-commit invalidates the dossier
   * detail (briefs render under the dossier).
   */
  const commitBrief = async ({
    dossierId,
    content,
    title,
    summary,
  }: CommitBriefInput): Promise<{ briefId: string }> => {
    const { data, error } = await supabase.rpc('persist_brief', {
      p_dossier_id: dossierId,
      p_content: content,
      p_title: title ?? null,
      p_summary: summary ?? null,
    })
    if (error) throw error
    const briefId = data as string | null
    if (briefId == null) throw new Error('Brief was not saved')

    await queryClient.invalidateQueries({ queryKey: dossierKeys.detail(dossierId) })

    return { briefId }
  }

  return { commitSignalStatus, commitPublishDigest, commitWorkItem, commitBrief }
}
