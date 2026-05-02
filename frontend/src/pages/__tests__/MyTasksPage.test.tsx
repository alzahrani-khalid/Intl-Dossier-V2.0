/**
 * Phase 42 Plan 07 — MyTasksPage reskin unit tests.
 *
 * Verifies the handoff `.tasks-list` anatomy:
 *   1. Renders <ul class="tasks-list"> with one <li class="task-row"> per task
 *   2. Priority chip mapping (defensive — handles DB-only `critical` / `normal`)
 *   3. Done-state row has line-through + opacity-45 + checkbox aria-checked="true"
 *   4. Checkbox click triggers useUpdateTask().mutate({ taskId, data: { status: 'completed' }})
 *      and does NOT bubble to row navigation (Pitfall 8)
 *   5. Tab swap renders the contributed dataset
 *   6. Empty state renders the i18n empty heading
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

// ----- i18n mock (returns the key, plus passes-through options.defaultValue) -----
vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (k: string, opts?: Record<string, unknown>) => string
    i18n: { language: string }
  } => ({
    i18n: { language: 'en' },
    t: (k: string, opts?: Record<string, unknown>): string => {
      if (
        opts !== undefined &&
        opts !== null &&
        typeof opts === 'object' &&
        'defaultValue' in opts &&
        typeof opts.defaultValue === 'string'
      ) {
        return opts.defaultValue
      }
      return k
    },
  }),
  Trans: ({ children }: { children: ReactNode }): ReactNode => children,
  // Required so that any transitive import of `src/i18n` doesn't blow up the suite.
  initReactI18next: { type: '3rdParty', init: (): void => {} },
  I18nextProvider: ({ children }: { children: ReactNode }): ReactNode => children,
}))

// ----- TanStack router navigate spy -----
const navigateSpy = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: (): typeof navigateSpy => navigateSpy,
}))

// ----- Work creation hub -----
const openPaletteSpy = vi.fn()
vi.mock('@/components/work-creation', () => ({
  useWorkCreation: (): {
    openPalette: typeof openPaletteSpy
    closePalette: () => void
    isOpen: boolean
  } => ({ openPalette: openPaletteSpy, closePalette: vi.fn(), isOpen: false }),
}))

// ----- Signature visuals — keep cheap stubs so the page DOM stays focused -----
vi.mock('@/components/signature-visuals', () => ({
  Icon: (props: { name: string; size?: number }): ReactElement => (
    <span data-testid={`icon-${props.name}`} />
  ),
  DossierGlyph: (props: { type: string; iso?: string; name?: string }): ReactElement => (
    <span data-testid="glyph" data-type={props.type} data-iso={props.iso ?? ''} />
  ),
}))

// ----- PageHeader — render minimum shell so the action button is reachable -----
vi.mock('@/components/layout/PageHeader', () => ({
  PageHeader: ({
    title,
    actions,
  }: {
    title: string
    actions?: ReactNode
  }): ReactElement => (
    <header>
      <h1>{title}</h1>
      <div>{actions}</div>
    </header>
  ),
}))

// ----- Tabs — minimal stub that exposes value-change clicks -----
type TabsCtx = { value: string; onValueChange?: (v: string) => void }
const tabsState: { ctx: TabsCtx } = { ctx: { value: 'assigned' } }
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({
    value,
    onValueChange,
    children,
  }: {
    value: string
    onValueChange?: (v: string) => void
    children: ReactNode
  }): ReactElement => {
    tabsState.ctx = { value, onValueChange }
    return <div data-testid="tabs">{children}</div>
  },
  TabsList: ({ children }: { children: ReactNode }): ReactElement => (
    <div role="tablist">{children}</div>
  ),
  TabsTrigger: ({
    value,
    children,
  }: {
    value: string
    children: ReactNode
  }): ReactElement => (
    <button
      type="button"
      role="tab"
      aria-selected={tabsState.ctx.value === value}
      onClick={(): void => tabsState.ctx.onValueChange?.(value)}
    >
      {children}
    </button>
  ),
}))

// ----- useTasks hooks — mutable returns per test -----
type TasksReturn = {
  data: { tasks: unknown[]; total_count: number; page: number; page_size: number } | undefined
  isLoading: boolean
  error: Error | null
}
const myTasksReturn: TasksReturn = {
  data: undefined,
  isLoading: false,
  error: null,
}
const contributedTasksReturn: TasksReturn = {
  data: undefined,
  isLoading: false,
  error: null,
}
const mutateSpy = vi.fn()
vi.mock('@/hooks/useTasks', () => ({
  useMyTasks: (): TasksReturn => myTasksReturn,
  useContributedTasks: (): TasksReturn => contributedTasksReturn,
  useUpdateTask: (): { mutate: typeof mutateSpy; isPending: boolean } => ({
    mutate: mutateSpy,
    isPending: false,
  }),
}))

// Import the page AFTER all mocks are registered
import { MyTasksPage } from '../MyTasks'

const today = new Date()
const tomorrow = new Date(Date.now() + 86_400_000)

const baseTasks = [
  {
    id: 't-low',
    title: 'Low priority task',
    priority: 'low',
    status: 'pending',
    sla_deadline: tomorrow.toISOString(),
    work_item_type: 'dossier',
    work_item_id: 'sa',
  },
  {
    id: 't-medium',
    title: 'Medium priority task',
    priority: 'medium',
    status: 'pending',
    sla_deadline: today.toISOString(),
    work_item_type: 'dossier',
    work_item_id: 'qa',
  },
  {
    id: 't-high',
    title: 'High priority task',
    priority: 'high',
    status: 'pending',
    sla_deadline: today.toISOString(),
    work_item_type: 'dossier',
    work_item_id: 'ae',
  },
  {
    id: 't-urgent',
    title: 'Urgent priority task',
    priority: 'urgent',
    status: 'pending',
    sla_deadline: today.toISOString(),
    work_item_type: 'dossier',
    work_item_id: 'eg',
  },
  {
    id: 't-critical',
    title: 'Critical priority task',
    priority: 'critical',
    status: 'pending',
    sla_deadline: tomorrow.toISOString(),
    work_item_type: 'dossier',
    work_item_id: 'jo',
  },
  {
    id: 't-normal',
    title: 'Normal priority task',
    priority: 'normal',
    status: 'pending',
    sla_deadline: tomorrow.toISOString(),
    work_item_type: 'dossier',
    work_item_id: 'bh',
  },
  {
    id: 't-done',
    title: 'Done task',
    priority: 'low',
    status: 'completed',
    sla_deadline: tomorrow.toISOString(),
    work_item_type: 'dossier',
    work_item_id: 'om',
  },
]

const setAssigned = (tasks: unknown[]): void => {
  myTasksReturn.data = { tasks, total_count: tasks.length, page: 1, page_size: 25 }
  myTasksReturn.isLoading = false
  myTasksReturn.error = null
}

const setContributed = (tasks: unknown[]): void => {
  contributedTasksReturn.data = { tasks, total_count: tasks.length, page: 1, page_size: 25 }
  contributedTasksReturn.isLoading = false
  contributedTasksReturn.error = null
}

describe('MyTasksPage', () => {
  beforeEach(() => {
    navigateSpy.mockClear()
    openPaletteSpy.mockClear()
    mutateSpy.mockClear()
    myTasksReturn.data = undefined
    myTasksReturn.isLoading = false
    myTasksReturn.error = null
    contributedTasksReturn.data = undefined
    contributedTasksReturn.isLoading = false
    contributedTasksReturn.error = null
    tabsState.ctx = { value: 'assigned' }
  })

  it('1. renders <ul class="tasks-list"> with one <li class="task-row"> per task', () => {
    setAssigned(baseTasks)
    setContributed([])

    const { container } = render(<MyTasksPage />)
    const list = container.querySelector('ul.tasks-list')
    expect(list).not.toBeNull()
    expect(container.querySelectorAll('li.task-row')).toHaveLength(baseTasks.length)
  })

  it('2. priority chip mapping handles all 6 enum values defensively', () => {
    setAssigned(baseTasks)
    setContributed([])

    const { container } = render(<MyTasksPage />)
    const rows = Array.from(container.querySelectorAll('li.task-row'))
    const chipFor = (taskId: string): HTMLElement | null => {
      const row = rows.find((r) => r.getAttribute('data-task-id') === taskId)
      return row?.querySelector('.chip') as HTMLElement | null
    }

    expect(chipFor('t-low')?.className).toBe('chip')
    expect(chipFor('t-medium')?.className).toBe('chip chip-warn')
    expect(chipFor('t-high')?.className).toBe('chip chip-danger')
    expect(chipFor('t-urgent')?.className).toBe('chip chip-danger')
    expect(chipFor('t-critical')?.className).toBe('chip chip-danger')
    expect(chipFor('t-normal')?.className).toBe('chip chip-warn')
  })

  it('3. done-state row has line-through + opacity-45; checkbox aria-checked="true"', () => {
    setAssigned([baseTasks[0], baseTasks[6]])
    setContributed([])

    const { container } = render(<MyTasksPage />)
    const rows = Array.from(container.querySelectorAll('li.task-row')) as HTMLElement[]
    const doneRow = rows.find((r) => r.getAttribute('data-task-id') === 't-done')
    const pendingRow = rows.find((r) => r.getAttribute('data-task-id') === 't-low')

    expect(doneRow?.style.opacity).toBe('0.45')
    expect(doneRow?.style.textDecoration).toContain('line-through')
    expect(pendingRow?.style.opacity).not.toBe('0.45')

    const doneCheckbox = doneRow?.querySelector('button.task-box') as HTMLElement | null
    const pendingCheckbox = pendingRow?.querySelector('button.task-box') as HTMLElement | null
    expect(doneCheckbox?.getAttribute('aria-checked')).toBe('true')
    expect(pendingCheckbox?.getAttribute('aria-checked')).toBe('false')
  })

  it('4. clicking the checkbox toggles status without bubbling to row navigation', () => {
    setAssigned([baseTasks[0]])
    setContributed([])

    const { container } = render(<MyTasksPage />)
    const checkbox = container.querySelector('li.task-row button.task-box') as HTMLElement
    fireEvent.click(checkbox)

    expect(mutateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 't-low',
        data: expect.objectContaining({ status: 'completed' }),
      }),
    )
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it('5. switching to Contributed tab swaps the rendered task data', () => {
    setAssigned([baseTasks[0]]) // 1 assigned
    setContributed([baseTasks[1], baseTasks[2]]) // 2 contributed

    const { container } = render(<MyTasksPage />)
    expect(container.querySelectorAll('li.task-row')).toHaveLength(1)

    const contributedTab = screen.getAllByRole('tab').find((b) => b.textContent === 'tabs.contributed')!
    fireEvent.click(contributedTab)

    expect(container.querySelectorAll('li.task-row')).toHaveLength(2)
  })

  it('6. empty state renders empty.heading when active tab data is empty', () => {
    setAssigned([])
    setContributed([])

    render(<MyTasksPage />)
    expect(screen.getByText('empty.heading')).toBeTruthy()
  })
})
