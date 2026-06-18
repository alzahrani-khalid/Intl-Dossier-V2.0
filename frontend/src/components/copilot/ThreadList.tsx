/**
 * ThreadList — resume past copilot conversations.
 *
 * Built on assistant-ui's ThreadListPrimitive / ThreadListItemPrimitive. Rows are
 * --row-h tall with --line-soft dividers and a hover --shadow-sm (the one allowed
 * list-row shadow per CLAUDE.md); the active/unread dot is bg-[var(--accent)] (reusing
 * the RelationshipSidebar badge idiom). Title is --t-body.
 *
 * Thread management = ARCHIVE-ONLY (destructive = none). The UI-SPEC explicitly allows
 * archive-only as the alternative to a confirmed hard-delete; choosing it drops the
 * destructive "Delete conversation" confirmation dialog entirely (no unconfirmed
 * delete ever ships). Archive is reversible and non-destructive, so it needs no
 * confirmation gate.
 *
 * Owner-only threads (D-08): the agent-runtime derives the resourceId from the verified
 * JWT, so this list only ever shows the caller's own conversations.
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Archive } from 'lucide-react'
import { ThreadListPrimitive, ThreadListItemPrimitive } from '@assistant-ui/react'

function ThreadRow(): ReactElement {
  const { t } = useTranslation('copilot')
  return (
    <ThreadListItemPrimitive.Root className="copilot-thread-row" data-active="false">
      <ThreadListItemPrimitive.Trigger className="flex min-w-0 flex-1 items-center gap-2 text-start">
        <span className="copilot-thread-row__dot" aria-hidden="true" />
        <span className="copilot-thread-row__title truncate">
          <ThreadListItemPrimitive.Title
            fallback={t('thread.untitled', { defaultValue: 'New conversation' })}
          />
        </span>
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemPrimitive.Archive asChild>
        <button
          type="button"
          className="tb-icon-btn inline-flex h-8 w-8 min-h-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--ink-mute)] hover:bg-[var(--line-soft)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          aria-label={t('archive.action', { defaultValue: 'Archive conversation' })}
        >
          <Archive size={14} />
        </button>
      </ThreadListItemPrimitive.Archive>
    </ThreadListItemPrimitive.Root>
  )
}

export function ThreadList(): ReactElement {
  const { t } = useTranslation('copilot')
  return (
    <ThreadListPrimitive.Root className="copilot-threadlist">
      <ThreadListPrimitive.New asChild>
        <button
          type="button"
          className="btn-ghost inline-flex min-h-11 items-center gap-2 px-3 text-start"
          aria-label={t('thread.new', { defaultValue: 'New conversation' })}
        >
          <Plus size={14} />
          <span className="text-[var(--t-body)]">
            {t('thread.new', { defaultValue: 'New conversation' })}
          </span>
        </button>
      </ThreadListPrimitive.New>
      <ThreadListPrimitive.Items components={{ ThreadListItem: ThreadRow }} />
    </ThreadListPrimitive.Root>
  )
}
