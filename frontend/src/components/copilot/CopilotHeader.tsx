/**
 * CopilotHeader — the titled drawer header + conversation history toggle
 * (Wave-2 Track-UX P0).
 *
 * Lives at the top of CopilotSurfaceBody, INSIDE the AssistantRuntimeProvider so
 * ThreadListPrimitive resolves the runtime's thread list. Shows the visible copilot
 * title (the Radix Sheet keeps a separate visually-hidden DialogTitle for labeling)
 * and a history toggle that reveals the already-built ThreadList (past conversations
 * + "New conversation") in a bounded scroll region, COLLAPSED by default.
 *
 * One data path (D-04): both the desktop Sheet and the mobile BottomSheet render
 * CopilotSurface, so both inherit this header. Token-only, logical properties, RTL-safe.
 *
 * @module components/copilot/CopilotHeader
 */
import { useState, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { History, X } from 'lucide-react'
import { ThreadList } from './ThreadList'

export function CopilotHeader(): ReactElement {
  const { t } = useTranslation('copilot')
  const [historyOpen, setHistoryOpen] = useState(false)

  return (
    <div className="copilot-header">
      <div className="copilot-header__bar">
        <h2 className="copilot-header__title">{t('title')}</h2>
        <button
          type="button"
          className="tb-icon-btn inline-flex h-8 w-8 min-h-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--ink-mute)] hover:bg-[var(--line-soft)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          aria-label={historyOpen ? t('header.hideHistory') : t('header.history')}
          aria-expanded={historyOpen}
          onClick={() => setHistoryOpen((open) => !open)}
        >
          {historyOpen ? <X size={16} /> : <History size={16} />}
        </button>
      </div>
      {historyOpen && (
        <div className="copilot-header__history">
          <ThreadList />
        </div>
      )}
    </div>
  )
}
