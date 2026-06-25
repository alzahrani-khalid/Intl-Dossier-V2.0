/**
 * CopilotSurface — the single conversational surface (one data path, D-04).
 *
 * BOTH the desktop Sheet and the mobile BottomSheet render this exact component; only
 * the surrounding chrome differs per breakpoint. It owns the assistant-ui runtime
 * provider (bound to the on-prem AG-UI /chat route under the caller JWT + language),
 * the empty state (dossier-aware heading + neutral body), the message stream, and the
 * pinned composer.
 *
 * D-05 (context-aware): when opened on a dossier, the dossier id + type are surfaced to
 * the runtime as a readable instruction (useAssistantInstructions) so the copilot scopes
 * its answers to that dossier. Only the already-accessible anchor travels — never result
 * content; RLS still enforces clearance in every tool.
 *
 * INDISTINGUISHABLE-EMPTY: the surface's own copy (empty + body) is the neutral string
 * from the copilot namespace. The no-answer result rendered by the agent is the neutral
 * `noAnswer.body`; no clearance/filtered/restricted token appears anywhere in this tree.
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  useAssistantInstructions,
} from '@assistant-ui/react'
import { useCopilotRuntime } from './useCopilotRuntime'
import { CopilotHeader } from './CopilotHeader'
import { CopilotMessageList } from './CopilotMessageList'
import { CopilotComposer } from './CopilotComposer'
import { ProposeToolUIs } from './hitl/ProposeToolUIs'
import { GenUiToolUIs } from './genui/GenUiToolUIs'
import type { CopilotDossierContext } from './useCopilotDrawer'

interface CopilotSurfaceProps {
  /** The dossier the drawer was opened on (D-05 readable context), if any. */
  context: CopilotDossierContext | null
}

/** Empty state — dossier-aware hero heading + neutral body. */
function CopilotEmptyState({ hasDossier }: { hasDossier: boolean }): ReactElement {
  const { t } = useTranslation('copilot')
  return (
    <div className="copilot-empty">
      <h2 className="copilot-empty__heading">
        {hasDossier ? t('empty.headingDossier') : t('empty.headingNoDossier')}
      </h2>
      <p className="copilot-empty__body">{t('empty.body')}</p>
    </div>
  )
}

/**
 * Surface body. Lives INSIDE the runtime provider so useAssistantInstructions can
 * register the dossier context as a readable hint for the run.
 */
function CopilotSurfaceBody({ context }: CopilotSurfaceProps): ReactElement {
  // D-05: scope the copilot to the open dossier. The instruction carries only the
  // (already-accessible) dossier id + type, never result content. No-op off a dossier.
  useAssistantInstructions({
    instruction:
      context != null
        ? `The user is currently viewing the dossier with id "${context.dossierId}"${
            context.dossierType != null ? ` (type: ${context.dossierType})` : ''
          }. When the question is about "this dossier", scope the answer to that dossier. Only use data the caller is cleared to see.`
        : '',
    disabled: context == null,
  })

  return (
    <ThreadPrimitive.Root className="copilot-surface">
      <CopilotHeader />
      <ThreadPrimitive.Empty>
        <CopilotEmptyState hasDossier={context != null} />
      </ThreadPrimitive.Empty>
      <ThreadPrimitive.If empty={false}>
        <CopilotMessageList />
      </ThreadPrimitive.If>
      <CopilotComposer />
    </ThreadPrimitive.Root>
  )
}

export function CopilotSurface({ context }: CopilotSurfaceProps): ReactElement {
  const { runtime } = useCopilotRuntime()
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {/* P73: register the four propose_* HITL tool-UI renderers (73-03) AND the three
          generative-UI READ renderers (73-04) for the whole thread. Rendering them only
          registers the renderers; they emit no visible chrome themselves. */}
      <ProposeToolUIs />
      <GenUiToolUIs />
      <CopilotSurfaceBody context={context} />
    </AssistantRuntimeProvider>
  )
}
