/**
 * InlineWorkItemCard — the read-only generative-UI work-item row rendered inline in
 * the copilot surface for a `query_work_items` result (Wave-2 Track-UX P0).
 *
 * `query_work_items` hands the renderer PARTIAL rows (`Record<string, unknown>`)
 * carrying id / title / title_ar / status / priority / due_date (verified against the
 * captured AG-UI stream: `{ workItems: [...] }`). We render a thin token-bound card
 * mirroring the app's WorkItemCard badge language (status + priority + deadline) — NOT
 * the heavy page card, whose full `UnifiedWorkItem` fields (source / tracking_type /
 * is_overdue / days_until_due) the tool result does not carry. Same restraint as
 * InlineSignalCard: validate the untrusted row, render token-only, deep-link in-app.
 *
 * Deep-link: clicking navigates to `/my-work` (the canonical work surface) via the
 * TanStack Router — CitationCard / InlineSignalCard precedent (an app-relative route,
 * never a raw model URL).
 *
 * Bidi (D-09): the free-text title is wrapped in <bdi> and carries the active writing
 * direction via the HTML `dir` attribute (NEVER a physical textAlign — forceRTL/CSS
 * handle direction). In Arabic we prefer `title_ar` when present.
 *
 * @module components/copilot/genui/InlineWorkItemCard
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useDirection } from '@/hooks/useDirection'
import { formatDayFirst } from '@/lib/format-date'

/** The partial work-item row from query_work_items — every field defensively optional. */
export type InlineWorkItemRow = Record<string, unknown>

interface NormalizedWorkItem {
  id: string | null
  title: string
  titleAr: string | null
  status: string | null
  priority: string | null
  dueDate: string | null
}

/** Status → semantic token classes (mirrors WorkItemCard; token-bound, no color literals). */
const STATUS_TOKENS: Record<string, string> = {
  overdue: 'bg-[var(--danger-soft)] text-danger',
  completed: 'bg-line-soft text-success',
  done: 'bg-line-soft text-success',
  in_progress: 'bg-[var(--info-soft)] text-info',
  review: 'bg-[var(--info-soft)] text-info',
  cancelled: 'bg-line-soft text-ink-faint',
  pending: 'bg-line-soft text-ink-mute',
  todo: 'bg-line-soft text-ink-mute',
}
const DEFAULT_STATUS_TOKEN = 'bg-line-soft text-ink-mute'

/** Priority → semantic token classes (urgent/critical danger, high warn, else neutral). */
const PRIORITY_TOKENS: Record<string, string> = {
  urgent: 'bg-[var(--danger-soft)] text-danger',
  critical: 'bg-[var(--danger-soft)] text-danger',
  high: 'bg-[var(--warn-soft)] text-warning',
  medium: 'bg-line-soft text-ink-mute',
  low: 'bg-line-soft text-ink-faint',
}
const DEFAULT_PRIORITY_TOKEN = 'bg-line-soft text-ink-mute'

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

/** Narrow an untrusted query_work_items row to the display fields. */
function normalize(row: InlineWorkItemRow): NormalizedWorkItem {
  return {
    id: asString(row.id),
    title: asString(row.title) ?? '',
    titleAr: asString(row.title_ar),
    status: asString(row.status),
    priority: asString(row.priority),
    dueDate: asString(row.due_date),
  }
}

/** A due date in the past (or an explicit `overdue` status) gets danger emphasis. */
function isPastDue(status: string | null, dueDate: string | null): boolean {
  if (status === 'overdue') return true
  if (dueDate === null) return false
  const due = new Date(dueDate)
  if (Number.isNaN(due.getTime())) return false
  return due.getTime() < Date.now()
}

export function InlineWorkItemCard({ item }: { item: InlineWorkItemRow }): ReactElement {
  const { t } = useTranslation('copilot')
  const { isRTL } = useDirection()
  const navigate = useNavigate()
  const w = normalize(item)

  const handleActivate = (): void => {
    void navigate({ to: '/my-work' })
  }

  // Prefer the Arabic title when present in AR; <bdi> + dir isolates the free-text run.
  const displayTitle = isRTL && w.titleAr !== null ? w.titleAr : w.title
  const writingDirection: 'rtl' | 'ltr' = isRTL ? 'rtl' : 'ltr'
  const overdue = isPastDue(w.status, w.dueDate)

  return (
    <button
      type="button"
      className="copilot-genui-workitem"
      onClick={handleActivate}
      aria-label={t('genui.workItem.open')}
      data-work-item-id={w.id ?? undefined}
    >
      <span className="copilot-genui-workitem__title" dir={writingDirection}>
        <bdi>{displayTitle.length > 0 ? displayTitle : t('genui.workItem.untitled')}</bdi>
      </span>
      <span className="copilot-genui-workitem__badges">
        {w.status !== null && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              STATUS_TOKENS[w.status] ?? DEFAULT_STATUS_TOKEN
            }`}
          >
            {t(`genui.workItem.status.${w.status}`, { defaultValue: w.status })}
          </span>
        )}
        {w.priority !== null && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              PRIORITY_TOKENS[w.priority] ?? DEFAULT_PRIORITY_TOKEN
            }`}
          >
            {t(`genui.workItem.priority.${w.priority}`, { defaultValue: w.priority })}
          </span>
        )}
        {w.dueDate !== null && (
          <span
            className={`font-mono text-xs px-1.5 py-0.5 rounded bg-line-soft ${
              overdue ? 'text-danger' : 'text-ink-mute'
            }`}
          >
            {formatDayFirst(w.dueDate, isRTL ? 'ar' : 'en')}
          </span>
        )}
      </span>
    </button>
  )
}
