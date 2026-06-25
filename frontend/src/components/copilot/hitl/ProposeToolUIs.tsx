/**
 * proposeToolUIs — the four assistant-ui tool-UI renderers (D-07) that turn each
 * propose_* tool call into a bilingual token-bound ConfirmActionCard, and on Approve
 * commit the write under the caller JWT via useApproveWrite, then resolve the tool call
 * via the assistant-ui `addResult` roundtrip (P73 GENUI-02/03/04).
 *
 * Mechanism (73-RESEARCH §B): HITL cards use the TOOL-CALL mechanism (makeAssistantToolUI),
 * distinct from CitationCard's source message-part mechanism. The renderer receives the
 * tool call's `args` (the propose tool's echoed output `{ proposed, action, args }`),
 * `status`, `result`, and `addResult`. We read the INNER `args` (the real op args) and
 * render the card from them — the SAME args the commit consumes (no bait-and-switch).
 *
 * On Approve  → card 'committing' → useApproveWrite commit → on success
 *               addResult({ approved:true, committed:true }) + card 'committed';
 *               on throw addResult({ approved:true, committed:false }) + card 'error'
 *               (the model is told the user approved but the commit did NOT succeed).
 * On Reject   → addResult({ approved:false, reason }) + card 'rejected'; nothing commits.
 *
 * The genUI READ renderers (UniversalDossierCard etc.) are 73-04, NOT here.
 *
 * @module components/copilot/hitl/proposeToolUIs
 */
import { useState, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { makeAssistantToolUI } from '@assistant-ui/react'
import { supabase } from '@/lib/supabase'
import { useDirection } from '@/hooks/useDirection'
import { dossierKeys } from '@/domains/dossiers/hooks/useDossier'
import {
  ConfirmActionCard,
  type ConfirmActionKind,
  type ConfirmActionState,
  type ConfirmSummaryField,
} from './ConfirmActionCard'
import {
  useApproveWrite,
  type SignalCommitAction,
  type WorkItemPriority,
  type BriefContent,
} from './useApproveWrite'

/** The propose tools echo `{ proposed, action, args }`; the inner `args` is the real op. */
interface ProposeEnvelope<TArgs> {
  proposed?: boolean
  action?: string
  args?: TArgs
}

type DigestArgs = { dossierId: string; period: 'daily' | 'weekly' | 'monthly'; summary: string }
type SignalArgs = { signalId: string; action: SignalCommitAction; reason?: string }
type WorkItemArgs = {
  title: string
  assigneeId?: string
  priority?: WorkItemPriority
  dossierIds?: string[]
  inheritanceSource?: string
}
type BriefArgs = { dossierId: string; content: BriefContent }

/** The HITL result handed back to the model when the tool call is resolved. */
interface ApproveResult {
  approved: boolean
  committed?: boolean
  reason?: string
}

/**
 * Resolve a dossier's display name for the D-04 typed-confirm prompt. Reads the dossiers
 * table directly under the caller JWT (RLS-gated; mirrors useDigests.fetchDossierNames).
 * Returns '' until loaded — the card's typed-confirm simply stays unsatisfiable until then.
 */
function useDossierName(dossierId: string | undefined): string {
  const { isRTL } = useDirection()
  const { data } = useQuery({
    queryKey: [...dossierKeys.detail(dossierId ?? 'none'), 'name'],
    enabled: dossierId != null,
    staleTime: 60_000,
    queryFn: async (): Promise<{ name_en: string | null; name_ar: string | null }> => {
      const { data: row, error } = await supabase
        .from('dossiers')
        .select('name_en,name_ar')
        .eq('id', dossierId as string)
        .single()
      if (error) throw error
      return row as { name_en: string | null; name_ar: string | null }
    },
  })
  if (data == null) return ''
  return (isRTL ? data.name_ar : data.name_en) ?? data.name_en ?? data.name_ar ?? ''
}

/**
 * Shared confirmation shell: owns the pending→committing→terminal card state and the
 * Approve/Reject → commit → addResult roundtrip. The per-tool renderers pass the
 * mapped summary fields, the actionKind, the commit thunk, and (optionally) the
 * typed-confirm expected name.
 */
function ConfirmShell({
  actionKind,
  summaryFields,
  requireTypedConfirm,
  status,
  commit,
  addResult,
}: {
  actionKind: ConfirmActionKind
  summaryFields: ConfirmSummaryField[]
  requireTypedConfirm?: { expected: string }
  status: { type: string }
  commit: () => Promise<unknown>
  addResult: (result: ApproveResult) => void
}): ReactElement {
  // If the run already recorded a result for this part, start terminal (e.g. resumed thread).
  const alreadyResolved = status.type === 'complete' || status.type === 'incomplete'
  const [state, setState] = useState<ConfirmActionState>(alreadyResolved ? 'committed' : 'pending')

  const handleApprove = async (): Promise<void> => {
    setState('committing')
    try {
      await commit()
      setState('committed')
      addResult({ approved: true, committed: true })
    } catch {
      // Indistinguishable-empty: a denied commit and a generic failure read the same. The
      // model is told the user approved but the commit did NOT succeed (must not claim success).
      setState('error')
      addResult({ approved: true, committed: false })
    }
  }

  const handleReject = (reason: string): void => {
    setState('rejected')
    addResult({ approved: false, reason: reason.length > 0 ? reason : undefined })
  }

  return (
    <ConfirmActionCard
      actionKind={actionKind}
      summaryFields={summaryFields}
      requireTypedConfirm={requireTypedConfirm}
      state={state}
      onApprove={() => {
        void handleApprove()
      }}
      onReject={handleReject}
    />
  )
}

/** propose_publish_digest → digest card with D-04 typed dossier-name strong-confirm. */
const PublishDigestToolUI = makeAssistantToolUI<ProposeEnvelope<DigestArgs>, ApproveResult>({
  toolName: 'propose_publish_digest',
  render: ({ args, status, addResult }): ReactElement | null => {
    const { t } = useTranslation('copilot')
    const { commitPublishDigest } = useApproveWrite()
    const op = args?.args
    const dossierName = useDossierName(op?.dossierId)
    if (op == null) return null

    const summaryFields: ConfirmSummaryField[] = [
      { labelKey: 'confirm.field.dossier', value: dossierName || op.dossierId },
      { labelKey: 'confirm.field.period', value: t(`confirm.value.period.${op.period}`) },
      { labelKey: 'confirm.field.summary', value: op.summary },
    ]

    return (
      <ConfirmShell
        actionKind="publish_digest"
        summaryFields={summaryFields}
        requireTypedConfirm={dossierName ? { expected: dossierName } : { expected: op.dossierId }}
        status={status}
        addResult={addResult}
        commit={() =>
          commitPublishDigest({
            dossierId: op.dossierId,
            period: op.period,
            summary: op.summary,
          })
        }
      />
    )
  },
})

/** propose_signal_status → dismiss/escalate card. */
const SignalStatusToolUI = makeAssistantToolUI<ProposeEnvelope<SignalArgs>, ApproveResult>({
  toolName: 'propose_signal_status',
  render: ({ args, status, addResult }): ReactElement | null => {
    const { t } = useTranslation('copilot')
    const { commitSignalStatus } = useApproveWrite()
    const op = args?.args
    if (op == null) return null

    const summaryFields: ConfirmSummaryField[] = [
      { labelKey: 'confirm.field.signal', value: op.signalId },
      { labelKey: 'confirm.field.action', value: t(`confirm.value.signalAction.${op.action}`) },
    ]
    if (op.reason != null && op.reason.length > 0) {
      summaryFields.push({ labelKey: 'confirm.field.reason', value: op.reason })
    }

    return (
      <ConfirmShell
        actionKind="signal_status"
        summaryFields={summaryFields}
        status={status}
        addResult={addResult}
        commit={() => commitSignalStatus({ signalId: op.signalId, action: op.action })}
      />
    )
  },
})

/** propose_work_item → create-task card. */
const WorkItemToolUI = makeAssistantToolUI<ProposeEnvelope<WorkItemArgs>, ApproveResult>({
  toolName: 'propose_work_item',
  render: ({ args, status, addResult }): ReactElement | null => {
    const { t } = useTranslation('copilot')
    const { commitWorkItem } = useApproveWrite()
    const op = args?.args
    if (op == null) return null

    const summaryFields: ConfirmSummaryField[] = [
      { labelKey: 'confirm.field.title', value: op.title },
      {
        labelKey: 'confirm.field.assignee',
        // Omitted assigneeId means the work item is assigned to the caller at commit.
        value:
          op.assigneeId != null && op.assigneeId.length > 0
            ? op.assigneeId
            : t('confirm.value.assigneeSelf'),
      },
      {
        labelKey: 'confirm.field.priority',
        value: op.priority ? t(`confirm.value.priority.${op.priority}`) : t('confirm.value.none'),
      },
      {
        labelKey: 'confirm.field.dossiers',
        value: t('confirm.value.count', { count: op.dossierIds?.length ?? 0 }),
      },
    ]

    return (
      <ConfirmShell
        actionKind="work_item"
        summaryFields={summaryFields}
        status={status}
        addResult={addResult}
        commit={() =>
          commitWorkItem({
            title: op.title,
            assigneeId: op.assigneeId,
            priority: op.priority,
            dossierIds: op.dossierIds,
            inheritanceSource: op.inheritanceSource,
          })
        }
      />
    )
  },
})

/** propose_brief → save-brief card. The single { en, ar } content envelope is forwarded verbatim. */
const BriefToolUI = makeAssistantToolUI<ProposeEnvelope<BriefArgs>, ApproveResult>({
  toolName: 'propose_brief',
  render: ({ args, status, addResult }): ReactElement | null => {
    const { t } = useTranslation('copilot')
    const { commitBrief } = useApproveWrite()
    const op = args?.args
    const dossierName = useDossierName(op?.dossierId)
    if (op == null) return null

    const summaryFields: ConfirmSummaryField[] = [
      { labelKey: 'confirm.field.dossier', value: dossierName || op.dossierId },
      { labelKey: 'confirm.field.language', value: t('confirm.value.bilingual') },
      { labelKey: 'confirm.field.summary', value: op.content?.en?.summary ?? '' },
    ]

    return (
      <ConfirmShell
        actionKind="brief"
        summaryFields={summaryFields}
        status={status}
        addResult={addResult}
        commit={() =>
          commitBrief({
            dossierId: op.dossierId,
            content: op.content,
            title: op.content?.en?.summary ?? null,
            summary: op.content?.en?.summary ?? null,
          })
        }
      />
    )
  },
})

/**
 * Mount-once fragment: rendering these registers the four propose_* tool-UI renderers for
 * the whole thread. Placed inside AssistantRuntimeProvider in CopilotSurface.
 */
export function ProposeToolUIs(): ReactElement {
  return (
    <>
      <PublishDigestToolUI />
      <SignalStatusToolUI />
      <WorkItemToolUI />
      <BriefToolUI />
    </>
  )
}
