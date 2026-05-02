/**
 * Phase 42 Plan 07 — MyTasks ("My desk") page reskin.
 *
 * Implements the IntelDossier handoff `.tasks-list` anatomy from
 * `frontend/design-system/inteldossier_handoff_design/src/pages.jsx`:
 *
 *   <ul class="tasks-list">
 *     <li class="task-row">
 *       [.task-box checkbox 14×14 visual / 44×44 hit area]
 *       [<DossierGlyph size={18}/>]
 *       [.task-title  (title + dossier · type subtitle)]
 *       [.chip priority]
 *       [.task-due    mono]
 *     </li>
 *   </ul>
 *
 * Preserves (D-15):
 *   - Assigned / Contributed tabs (real shipped collaboration feature)
 *   - Done-toggle via existing `useUpdateTask` optimistic mutation
 *   - Whole-row click navigates to /tasks/$id
 *
 * Strips:
 *   - Floating useWorkCreation action button → CTA moved to PageHeader action slot
 *   - Inline summary stat blocks (Card/CardHeader)
 *   - Filter / AlertCircle / CheckCircle2 / UserCheck / Users lucide chrome
 *
 * Critical constraints:
 *   - Pitfall 8 — checkbox MUST stopPropagation so the row click doesn't navigate
 *   - Pitfall 3 — priority chip mapping handles DB-only `critical` / `normal`
 *     defensively in case future migrations widen the enum
 *   - 44×44 hit area on the checkbox button (visual is 14×14, kept by an inner
 *     span since the CSS `.task-box` sets a fixed width/height of 14px)
 *   - dir="ltr" on .task-due keeps mono dates LTR inside RTL containers (TYPO-04)
 *   - Logical properties only — `ms-*`, `text-start`
 *
 * Deviation log (Rule 3 — blocking issue):
 *   - Plan body assumed `task.dossier` was embedded on each row. The DB row
 *     (`tasks` table, see backend/src/types/database.types.ts:25334) ships
 *     no embedded dossier and no `title_ar`. We derive a glyph hint from
 *     `work_item_type === 'dossier'` + `work_item_id` lowercased (matches
 *     the existing dashboard widget — Phase 38 Plan 07). Subtitle composes
 *     from `work_item_type` + `task.type`.
 *   - Plan body called `useUpdateTask().mutate({ id, updates })`. Real hook
 *     signature is `mutate({ taskId, data })` — adopted verbatim.
 *   - Plan body proposed a `default export`. The existing route at
 *     routes/_protected/tasks/index.tsx imports `{ MyTasksPage }`, so we
 *     keep the named export AND add a default export to satisfy the plan
 *     spec without breaking the route registration.
 */

import { useState, type CSSProperties, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Icon, DossierGlyph } from '@/components/signature-visuals'
import { PageHeader } from '@/components/layout/PageHeader'
import { useMyTasks, useContributedTasks, useUpdateTask } from '@/hooks/useTasks'
import { useWorkCreation } from '@/components/work-creation'
import { toArDigits } from '@/lib/i18n/toArDigits'
import { cn } from '@/lib/utils'
import type { Database } from '../../../backend/src/types/database.types'

type Task = Database['public']['Tables']['tasks']['Row']
type ViewType = 'assigned' | 'contributed'

// ---- Helpers ----

function priorityChipClass(priority: string | null | undefined): string {
  if (priority === 'urgent' || priority === 'high' || priority === 'critical') {
    return 'chip chip-danger'
  }
  if (priority === 'medium' || priority === 'normal') {
    return 'chip chip-warn'
  }
  return 'chip' // low / unknown
}

function isToday(deadline: string | null | undefined): boolean {
  if (deadline === null || deadline === undefined || deadline === '') {
    return false
  }
  const d = new Date(deadline)
  if (Number.isNaN(d.getTime())) {
    return false
  }
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

function formatDueDate(deadline: string | null | undefined): string {
  if (deadline === null || deadline === undefined || deadline === '') {
    return '—'
  }
  const d = new Date(deadline)
  if (Number.isNaN(d.getTime())) {
    return '—'
  }
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function dossierIsoHint(task: Task): string | undefined {
  if (task.work_item_type === 'dossier' && typeof task.work_item_id === 'string') {
    return task.work_item_id.toLowerCase()
  }
  return undefined
}

// ---- Page ----

export function MyTasksPage(): ReactElement {
  const { t, i18n } = useTranslation('tasks-page')
  const locale = i18n.language === 'ar' ? 'ar' : 'en'
  const isRTL = locale === 'ar'
  const navigate = useNavigate()
  const { openPalette } = useWorkCreation()

  const [view, setView] = useState<ViewType>('assigned')
  const assigned = useMyTasks()
  const contributed = useContributedTasks()
  const active = view === 'assigned' ? assigned : contributed
  const tasks = (active.data?.tasks ?? []) as Task[]

  const updateTask = useUpdateTask()

  const toggleDone = (task: Task): void => {
    const nextStatus: Task['status'] = task.status === 'completed' ? 'pending' : 'completed'
    updateTask.mutate({ taskId: task.id, data: { status: nextStatus } })
  }

  const goToTask = (taskId: string): void => {
    void navigate({ to: '/tasks/$id', params: { id: taskId } })
  }

  // Visual override for the .task-box CSS (which sets a fixed 14×14). We need
  // a 44×44 hit-area; the 14×14 visual lives in an inner <span>.
  const checkboxHitAreaStyle: CSSProperties = {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    border: 'none',
    background: 'transparent',
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  }

  return (
    <section
      role="region"
      aria-label={t('title')}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-loading={active.isLoading ? 'true' : 'false'}
      className="page flex min-w-0 flex-col gap-[var(--gap)]"
    >
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <button
            type="button"
            className="btn btn-primary"
            style={{ minHeight: 44, minWidth: 44 }}
            onClick={(): void => openPalette('task')}
          >
            <Icon name="plus" size={14} aria-hidden />
            <span className="ms-2">{t('cta.newTask')}</span>
          </button>
        }
      />

      <Tabs value={view} onValueChange={(v): void => setView(v as ViewType)}>
        <TabsList>
          <TabsTrigger value="assigned">{t('tabs.assigned')}</TabsTrigger>
          <TabsTrigger value="contributed">{t('tabs.contributed')}</TabsTrigger>
        </TabsList>
        {/* Empty panels exist solely so each TabsTrigger's aria-controls
            resolves to a real DOM element. Without them axe-core flags
            aria-valid-attr-value (critical) on the active trigger. The
            actual task list renders below this <Tabs> block. */}
        <TabsContent value="assigned" />
        <TabsContent value="contributed" />
      </Tabs>

      {active.error !== null && active.error !== undefined && (
        <div className="card" role="alert">
          <Icon name="alert" size={16} style={{ color: 'var(--danger)' }} aria-hidden />
          <span className="ms-2">{t('error.list')}</span>
        </div>
      )}

      {active.isLoading && (
        <div className="card" data-testid="tasks-skeleton">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="mb-2 h-[var(--row-h)] w-full animate-pulse rounded-[var(--radius-sm)] bg-[var(--line-soft)]"
            />
          ))}
        </div>
      )}

      {!active.isLoading && tasks.length === 0 && (
        <div className="text-center py-12 text-[var(--ink-mute)]">
          <h2 className="text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            {t('empty.heading')}
          </h2>
        </div>
      )}

      {!active.isLoading && tasks.length > 0 && (
        <div className="card">
          <ul className="tasks-list">
            {tasks.map((task) => {
              const isDone = task.status === 'completed'
              const iso = dossierIsoHint(task)
              const subtitleParts: string[] = []
              if (typeof task.work_item_type === 'string' && task.work_item_type !== '') {
                subtitleParts.push(task.work_item_type)
              }
              if (typeof task.type === 'string') {
                subtitleParts.push(task.type)
              }
              const subtitle = subtitleParts.length > 0 ? subtitleParts.join(' · ') : '—'

              // Done rows: line-through + muted color (NOT opacity).
                  // opacity: 0.45 washed every child into <3:1 contrast — five
                  // axe-core color-contrast failures (chip-danger, task-due,
                  // task-title, subtitle, checkbox glyph). Using --ink-mute
                  // (6.0:1 on white) keeps all child elements at WCAG AA while
                  // still visually de-emphasising completed tasks.
              const rowStyle: CSSProperties | undefined = isDone
                ? { color: 'var(--ink-mute)', textDecoration: 'line-through' }
                : undefined

              return (
                // WR-02: row is a structural <li> with no click handler and
                // no cursor:pointer. The "click anywhere on the row" pattern
                // implied an interactive role without exposing it to AT and
                // produced the nested-interactive axe class. Activation
                // (mouse + keyboard) is owned by the inner title button below.
                <li
                  key={task.id}
                  data-task-id={task.id}
                  className={cn('task-row', isDone && 'is-done')}
                  style={rowStyle}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isDone}
                    aria-label={
                      isDone
                        ? t('priority.markNotDone', { defaultValue: 'Mark not done' })
                        : t('priority.markDone', { defaultValue: 'Mark done' })
                    }
                    className={cn('task-box', isDone && 'done')}
                    style={checkboxHitAreaStyle}
                    onClick={(e): void => {
                      e.stopPropagation()
                      toggleDone(task)
                    }}
                    onKeyDown={(e): void => {
                      e.stopPropagation()
                    }}
                  >
                    {isDone && (
                      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                        <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" fill="none" />
                      </svg>
                    )}
                  </button>

                  <DossierGlyph
                    type="country"
                    iso={iso}
                    name={task.title}
                    size={18}
                  />

                  {/* Keyboard activation lives on this title button (mouse
                      users still get whole-row click via the parent <li>). */}
                  <button
                    type="button"
                    className="task-title"
                    onClick={(e): void => {
                      e.stopPropagation()
                      goToTask(task.id)
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      textAlign: 'start',
                      font: 'inherit',
                      color: 'inherit',
                      cursor: 'pointer',
                      minHeight: 44,
                    }}
                  >
                    <div>{task.title}</div>
                    <small style={{ color: 'var(--ink-mute)' }}>{subtitle}</small>
                  </button>

                  <span className={priorityChipClass(task.priority)}>
                    {t(`priority.${task.priority}`)}
                  </span>

                  <span
                    className={cn(
                      'task-due',
                      isToday(task.sla_deadline) && 'today',
                      (task.priority === 'high' || task.priority === 'urgent') && 'high',
                    )}
                    dir="ltr"
                  >
                    {toArDigits(formatDueDate(task.sla_deadline), locale)}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}

export default MyTasksPage
