/**
 * Phase 39 Plan 01 — KCard widget (BOARD-01).
 *
 * Verbatim port of handoff `pages.jsx#L143-167`. Renders the kanban card
 * displayed in every BoardColumn: kind chip + priority chip + title +
 * dossier glyph + dossier name + mono due text + 20×20 owner-initials avatar.
 *
 * RTL-correct via:
 *  - <LtrIsolate> wrapping the mono due text (digits stay LTR inside RTL row)
 *  - `border-inline-start` on .kcard.overdue (handled in board.css)
 *  - No physical-direction Tailwind classes; logical-only spacing tokens
 *
 * XSS mitigation (T-39-01-XSS): React JSX escaping only. No raw-HTML
 * injection APIs are referenced anywhere in this file (acceptance grep).
 */

import { type KeyboardEvent, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { format, isToday } from 'date-fns'

import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { DossierGlyph } from '@/components/signature-visuals'
import { toArDigits } from '@/lib/i18n/toArDigits'
import { cn } from '@/lib/utils'
import type { WorkItem } from '@/types/work-item.types'

/**
 * KCard accepts the canonical WorkItem and may also read an optional
 * server-enriched `dossier` summary (id/name/name_ar/flag) attached by the
 * board RPC. We model that via a structural intersection so callers can pass
 * the plain WorkItem without compiler complaint.
 */
export type KCardItem = WorkItem & {
  dossier?: {
    id: string
    name: string
    name_ar?: string | null
    flag?: string | null
  } | null
}

export interface KCardProps {
  item: KCardItem
  onItemClick: (item: KCardItem) => void
  dndEnabled?: boolean
}

function computeInitials(name: string | null | undefined): string {
  if (name == null || name.trim() === '') return '?'
  const words = name.trim().split(/\s+/)
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : ''
  const initials = `${first}${last}`.toUpperCase()
  return initials === '' ? '?' : initials
}

function priorityChipClass(priority: WorkItem['priority']): string {
  if (priority === 'urgent' || priority === 'high') return 'chip chip-danger'
  if (priority === 'medium') return 'chip chip-warn'
  return 'chip'
}

function kindChipClass(source: WorkItem['source']): string {
  return source === 'commitment' ? 'chip chip-accent' : 'chip chip-info'
}

function buildDueText(item: KCardItem, lang: string): string {
  if (item.is_overdue && typeof item.days_until_due === 'number') {
    const raw = `Overdue ${Math.abs(item.days_until_due)}d`
    return toArDigits(raw, lang)
  }
  if (item.deadline == null) return ''
  const date = new Date(item.deadline)
  if (Number.isNaN(date.getTime())) return ''
  if (isToday(date)) {
    return lang === 'ar' ? 'اليوم' : 'Today'
  }
  const formatted = format(date, 'd MMM')
  return toArDigits(formatted, lang)
}

export function KCard({ item, onItemClick, dndEnabled = false }: KCardProps): ReactElement {
  const { i18n } = useTranslation('unified-kanban')
  const lang = i18n.language

  const isDone = item.status === 'completed' || item.workflow_stage === 'done'
  const title =
    lang === 'ar' && item.title_ar != null && item.title_ar !== '' ? item.title_ar : item.title

  const dossierName =
    lang === 'ar' && item.dossier?.name_ar != null && item.dossier?.name_ar !== ''
      ? item.dossier.name_ar
      : (item.dossier?.name ?? '')

  const flag = item.dossier?.flag ?? ''
  const initials = computeInitials(item.assignee?.name)
  const ownerLabel = item.assignee?.name ?? '?'
  const dueText = buildDueText(item, lang)

  const kindLabel =
    item.source === 'task' ? 'Task' : item.source === 'commitment' ? 'Commitment' : 'Intake'
  const priorityLabel = item.priority.charAt(0).toUpperCase() + item.priority.slice(1)

  const handleClick = (): void => {
    onItemClick(item)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onItemClick(item)
    }
  }

  return (
    <article
      className={cn('kcard', item.is_overdue && 'overdue', isDone && 'done')}
      role="button"
      tabIndex={0}
      aria-label={title}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{ cursor: dndEnabled ? 'grab' : 'pointer' }}
    >
      <div className="kcard-top">
        <span className={kindChipClass(item.source)}>{kindLabel}</span>
        <span className={priorityChipClass(item.priority)}>{priorityLabel}</span>
      </div>

      <div className="kcard-title">{title}</div>

      <div className="kcard-foot">
        <div className="kcard-dossier">
          {flag !== '' ? <DossierGlyph type="country" iso={flag} size={14} /> : null}
          <span>{dossierName}</span>
        </div>
        <LtrIsolate>
          <span className="font-mono">{dueText}</span>
        </LtrIsolate>
        <div className="kcard-owner" aria-label={ownerLabel}>
          {initials}
        </div>
      </div>
    </article>
  )
}
