/**
 * Phase 38 Plan 07 — MyTasks widget.
 *
 * Renders one row per task assigned to current user, sourced from
 * `useTasks({ assignee_id: user.id })`. Each row: checkbox + dossier glyph +
 * title + due chip. Toggling the checkbox calls the existing `useUpdateTask`
 * mutation with `status: 'completed' | 'pending'` and applies a `line-through`
 * + `opacity-60` visual state.
 *
 * RTL-safety:
 *  - `flex-row` naturally places checkbox on start edge in RTL (no reorder)
 *  - logical gap (no `ms-*`/`me-*` needed; `gap-3` direction-agnostic)
 *  - `text-start` for title; no `text-left`/`text-right`
 *  - no `.reverse()` on the array
 *
 * Deviations from plan body:
 *  1. Plan calls `useUpdateTaskStatus` — that hook does not exist. Use
 *     existing `useUpdateTask` (Rule 3 — blocking issue / API mismatch).
 *  2. i18n keys are `myTasks.due.*` not `tasks.due.*` (Wave 0 SUMMARY
 *     decision: top-level `tasks` namespace renamed to `myTasks`).
 *  3. Task row uses `sla_deadline` (DB column) — `WorkItem.deadline` exists
 *     but the Task table returns `sla_deadline`. Read `sla_deadline ?? null`.
 *  4. `dossier_flag` is not on the Task shape; derive country-glyph hint
 *     from `work_item_type === 'dossier'` and `work_item_id` (lowercased
 *     ISO when known to the glyph). For unknown values, glyph falls back
 *     to initials internally.
 */

import { type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { isToday, isPast, format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DossierGlyph } from '@/components/signature-visuals'
import { useAuth } from '@/hooks/useAuth'
import { useTasks, useUpdateTask } from '@/hooks/useTasks'

import { WidgetSkeleton } from './WidgetSkeleton'

interface TaskRow {
  id: string
  title: string
  status: string | null
  sla_deadline: string | null
  work_item_type?: string | null
  work_item_id?: string | null
}

interface DueLabel {
  text: string
  intent: 'default' | 'destructive'
}

function dueLabel(deadline: string | null, t: (k: string) => string, lang: string): DueLabel {
  if (deadline === null || deadline === undefined || deadline === '') {
    return { text: '', intent: 'default' }
  }
  const d = new Date(deadline)
  if (Number.isNaN(d.getTime())) {
    return { text: '', intent: 'default' }
  }
  if (isPast(d) && !isToday(d)) {
    return { text: t('myTasks.due.overdue'), intent: 'destructive' }
  }
  if (isToday(d)) {
    return { text: t('myTasks.due.today'), intent: 'default' }
  }
  const locale = lang === 'ar' ? ar : enUS
  return { text: format(d, 'MMM d', { locale }), intent: 'default' }
}

export function MyTasks(): ReactElement {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const { data, isLoading, isError } = useTasks({ assignee_id: userId })
  const updateTask = useUpdateTask()

  if (isLoading) {
    return <WidgetSkeleton rows={4} />
  }

  if (isError) {
    return (
      <section className="tasks card">
        <p className="text-sm text-ink-soft text-start">{t('error.load_failed')}</p>
      </section>
    )
  }

  const rawTasks = (data?.tasks ?? []) as unknown as TaskRow[]

  if (rawTasks.length === 0) {
    return (
      <section className="tasks card text-sm text-ink-soft text-start">
        {t('myTasks.empty')}
      </section>
    )
  }

  const handleToggle = (task: TaskRow, checked: boolean): void => {
    void updateTask.mutateAsync({
      taskId: task.id,
      data: { status: checked ? 'completed' : 'pending' },
    })
  }

  return (
    <section role="region" aria-labelledby="tasks-heading" className="tasks card">
      <h3 id="tasks-heading" className="card-title mb-3 text-start">
        {t('myTasks.title')}
      </h3>
      <ul className="space-y-2">
        {rawTasks.slice(0, 6).map((task): ReactElement => {
          const done = task.status === 'completed'
          const due = dueLabel(task.sla_deadline ?? null, t, i18n.language)
          const iso =
            task.work_item_type === 'dossier' && typeof task.work_item_id === 'string'
              ? task.work_item_id.toLowerCase()
              : undefined
          const titleId = `mytasks-${task.id}-title`
          return (
            <li
              key={task.id}
              className={`task-row flex flex-row items-center gap-3 min-h-11 ${
                done ? 'opacity-60 line-through' : ''
              }`}
            >
              <Checkbox
                className="touch-44"
                checked={done}
                onCheckedChange={(c): void => handleToggle(task, c === true)}
                aria-labelledby={titleId}
              />
              <DossierGlyph type="country" iso={iso} name={task.title} size={20} />
              <span id={titleId} className="text-sm text-ink text-start truncate flex-1">
                {task.title}
              </span>
              {due.text !== '' && (
                <Badge variant={due.intent === 'destructive' ? 'destructive' : 'default'}>
                  {due.text}
                </Badge>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
