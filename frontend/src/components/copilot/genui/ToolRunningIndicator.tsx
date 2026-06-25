/**
 * ToolRunningIndicator — the per-tool "running" cue derived from the AG-UI
 * TOOL_CALL_START lifecycle (Wave-2 Track-UX P0).
 *
 * Rendered by a tool-UI renderer while its `status.type === 'running'` (assistant-ui
 * invokes the renderer as soon as TOOL_CALL_START arrives, before TOOL_CALL_RESULT).
 * Once reasoning is suppressed upstream this is the PRIMARY perceived-latency cue —
 * the ~10s gap in a turn is the tool call, so we name it ("Searching work items…")
 * instead of the generic thread-level "Thinking…".
 *
 * Token-bound, accessible caret reused from the streaming indicator. The label
 * resolves per-tool (`streaming.tool.<toolName>`) and falls back to the generic
 * `streaming.searching`. role="status" announces the change to assistive tech.
 *
 * @module components/copilot/genui/ToolRunningIndicator
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

export function ToolRunningIndicator({ toolName }: { toolName?: string }): ReactElement {
  const { t } = useTranslation('copilot')
  const label =
    toolName != null && toolName.length > 0
      ? t(`streaming.tool.${toolName}`, { defaultValue: t('streaming.searching') })
      : t('streaming.searching')

  return (
    <span className="copilot-tool-running" role="status">
      <span className="copilot-streaming__caret" aria-hidden="true" />
      {label}
    </span>
  )
}
