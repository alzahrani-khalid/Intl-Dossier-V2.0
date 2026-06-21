/**
 * genUiToolUIs — the generative-UI READ renderers (GENUI-01, D-07 direct component
 * renderers + FIXED allowlist). Via assistant-ui `makeAssistantToolUI`, when a READ tool
 * returns a dossier or signals we render the app's OWN token-bound components inline
 * (InlineDossierCard → UniversalDossierCard, InlineSignalCard) instead of plain markdown.
 *
 * FIXED ALLOWLIST (T-73-04-01): exactly three renderers backed by the two inline cards —
 *   get_dossier   → one InlineDossierCard from result.dossier
 *   list_dossiers → a capped stack of InlineDossierCard from result.dossiers
 *   read_signals  → a capped stack of InlineSignalCard from result.signals
 * There is NO generic "render any component the model names" path; the model cannot mount
 * an arbitrary component.
 *
 * READ-ONLY: unlike the 73-03 HITL renderers, these have NO approval and call NO addResult.
 * They render from `result` once `status.type === 'complete'`; while the tool is still
 * running they render nothing (let the existing streaming/text parts show). A null/empty
 * result renders nothing here, so the default text part stays — and that text carries no
 * clearance/filtered/restricted wording (indistinguishable-empty, enforced upstream in the
 * tools themselves).
 *
 * Mounted as <GenUiToolUIs /> inside AssistantRuntimeProvider in CopilotSurface, ALONGSIDE
 * the 73-03 <ProposeToolUIs /> (both register on the same provider).
 *
 * @module components/copilot/genui/genUiToolUIs
 */
import type { ReactElement } from 'react'
import { makeAssistantToolUI } from '@assistant-ui/react'
import { InlineDossierCard, type InlineDossierRow } from './InlineDossierCard'
import { InlineSignalCard, type InlineSignalRow } from './InlineSignalCard'

/** Cap how many cards render inline; the rest stay summarized in the agent's text part. */
const INLINE_RENDER_CAP = 5

/** A tool-call render is only safe to read once the run has produced its result. */
function isComplete(status: { type: string }): boolean {
  return status.type === 'complete'
}

/** get_dossier → { dossier } — one inline card (or nothing → default text part shows). */
const GetDossierToolUI = makeAssistantToolUI<
  Record<string, unknown>,
  { dossier?: InlineDossierRow | null }
>({
  toolName: 'get_dossier',
  render: ({ status, result }): ReactElement | null => {
    if (!isComplete(status)) return null
    const dossier = result?.dossier
    if (dossier == null) return null
    return <InlineDossierCard dossierRow={dossier} />
  },
})

/** list_dossiers → { dossiers } — a capped vertical stack of inline cards. */
const ListDossiersToolUI = makeAssistantToolUI<
  Record<string, unknown>,
  { dossiers?: InlineDossierRow[] | null }
>({
  toolName: 'list_dossiers',
  render: ({ status, result }): ReactElement | null => {
    if (!isComplete(status)) return null
    const dossiers = Array.isArray(result?.dossiers) ? result.dossiers : []
    if (dossiers.length === 0) return null
    return (
      <div className="copilot-genui-stack">
        {dossiers.slice(0, INLINE_RENDER_CAP).map((row, index) => (
          <InlineDossierCard
            key={typeof row.id === 'string' ? row.id : `dossier-${index}`}
            dossierRow={row}
          />
        ))}
      </div>
    )
  },
})

/** read_signals → { signals } — a capped vertical stack of inline signal cards. */
const ReadSignalsToolUI = makeAssistantToolUI<
  Record<string, unknown>,
  { signals?: InlineSignalRow[] | null }
>({
  toolName: 'read_signals',
  render: ({ status, result }): ReactElement | null => {
    if (!isComplete(status)) return null
    const signals = Array.isArray(result?.signals) ? result.signals : []
    if (signals.length === 0) return null
    return (
      <div className="copilot-genui-stack">
        {signals.slice(0, INLINE_RENDER_CAP).map((row, index) => (
          <InlineSignalCard
            key={typeof row.id === 'string' ? row.id : `signal-${index}`}
            signal={row}
          />
        ))}
      </div>
    )
  },
})

/**
 * Mount-once fragment: rendering these registers the three READ tool-UI renderers for the
 * whole thread (they emit no chrome themselves). Placed inside AssistantRuntimeProvider in
 * CopilotSurface, alongside the 73-03 ProposeToolUIs.
 */
export function GenUiToolUIs(): ReactElement {
  return (
    <>
      <GetDossierToolUI />
      <ListDossiersToolUI />
      <ReadSignalsToolUI />
    </>
  )
}
