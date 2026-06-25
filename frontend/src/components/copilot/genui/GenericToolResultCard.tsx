/**
 * GenericToolResultCard — the FALLBACK tool-call renderer (Wave-2 Track-UX P0).
 *
 * Wired as `MessagePrimitive.Parts components.tools.Fallback` in CopilotMessageList.
 * assistant-ui resolves a tool-call part as `toolUIs[toolName]?.render ?? Fallback`
 * (verified in core MessageParts), so the FIXED-allowlist renderers (query_work_items,
 * get_dossier, list_dossiers, read_signals) and the propose_* HITL cards still win —
 * this only catches tools with NO dedicated renderer, which today degrade to bare text.
 *
 * While the tool runs it shows the per-tool running cue; on complete it renders a thin
 * token-bound card naming the tool with a capped, LTR-isolated JSON preview of the
 * result (RLS-gated data the caller is cleared to see). A non-complete terminal state
 * renders nothing so the default text part stands (indistinguishable-empty).
 *
 * @module components/copilot/genui/GenericToolResultCard
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { ToolCallMessagePartComponent } from '@assistant-ui/react'
import { ToolRunningIndicator } from './ToolRunningIndicator'

/** Cap the inline JSON preview so a large tool payload can't dominate the surface. */
const PREVIEW_CHAR_CAP = 800

/** Humanize a snake_case tool name for display ("query_work_items" → "query work items"). */
function humanizeToolName(toolName: string): string {
  return toolName.replace(/_/g, ' ').trim()
}

/** Compact, capped JSON preview of an unknown tool result; null when there is nothing to show. */
function formatPreview(result: unknown): string | null {
  if (result === null || result === undefined) return null
  let text: string
  try {
    text = typeof result === 'string' ? result : JSON.stringify(result, null, 2)
  } catch {
    return null
  }
  if (text.length === 0) return null
  return text.length > PREVIEW_CHAR_CAP ? `${text.slice(0, PREVIEW_CHAR_CAP)}…` : text
}

export const GenericToolResultCard: ToolCallMessagePartComponent = ({
  toolName,
  status,
  result,
}): ReactElement | null => {
  const { t } = useTranslation('copilot')

  if (status.type === 'running') {
    return <ToolRunningIndicator toolName={toolName} />
  }
  // Cancelled / incomplete / requires-action → let the default text part stand.
  if (status.type !== 'complete') return null

  const preview = formatPreview(result as unknown)

  return (
    <div className="copilot-genui-tool">
      <span className="copilot-genui-tool__label">
        {t('genui.tool.result', { tool: humanizeToolName(toolName) })}
      </span>
      {preview !== null && (
        <pre className="copilot-genui-tool__preview" dir="ltr">
          {preview}
        </pre>
      )}
    </div>
  )
}
