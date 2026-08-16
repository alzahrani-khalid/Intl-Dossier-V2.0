/**
 * Phase 39 Plan 04 — WorkBoard page composer unit tests.
 *
 * Verifies the integration of useUnifiedKanban + BoardToolbar + 4 BoardColumns,
 * the cancelled-stage filter, the client-side search filter (over EN + AR fields),
 * the overdue-count derivation, the conditional DnD sensors, and the drag-end
 * mutation wiring per D-03/D-07/D-08.
 *
 * Phase 57 D-21 / D-57-06: mock surface flipped from `@dnd-kit/core` to
 * `@/components/kanban` after WorkBoard migrated to the shared primitive.
 * The KanbanProvider mock captures `sensors` (D-03 gating) and `onDragEnd`
 * (mutation wiring) at the boundary.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

// ── i18n mock ─────────────────────────────────────────────────────────────
let currentLang = 'en'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string): string => key,
    i18n: { language: currentLang },
  }),
}))

// ── Router mock ───────────────────────────────────────────────────────────
const navigateMock = vi.fn()
const routeNavigateMock = vi.fn()
let kanbanSearch: Record<string, unknown> = {}

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('@/routes/_protected/kanban', () => ({
  Route: {
    useSearch: () => kanbanSearch,
    useNavigate: () => routeNavigateMock,
  },
  kanbanListConfig: {
    filters: [
      { key: 'source', labelKey: 'unified-kanban:filters.source', options: [] },
      { key: 'priority', labelKey: 'unified-kanban:filters.priority', options: [] },
    ],
    sortFields: [],
    grouping: [{ id: 'status', labelKey: 'unified-kanban:columnModes.status' }],
  },
}))

routeNavigateMock.mockImplementation(
  (opts: { search: (prev: Record<string, unknown>) => Record<string, unknown> }) => {
    if (typeof opts.search === 'function') {
      kanbanSearch = opts.search(kanbanSearch)
    }
  },
)

const openCommitmentMock = vi.fn()
vi.mock('@/hooks/useCommitmentDrawer', () => ({
  useCommitmentDrawer: () => ({
    openCommitment: openCommitmentMock,
    closeCommitment: vi.fn(),
    open: false,
    commitmentId: null,
  }),
}))

const peekRegisterMock = vi.fn()
vi.mock('@/store/peekStore', () => ({
  usePeekStore: Object.assign(
    (selector: (s: { positionOf: (id: string) => number | null }) => unknown) =>
      selector({ positionOf: () => null }),
    { getState: () => ({ register: peekRegisterMock, clear: vi.fn() }) },
  ),
}))

vi.mock('@/components/list-controls/FilterChipsRow', () => ({
  FilterChipsRow: (): ReactElement => <div data-testid="filter-chips" />,
}))

vi.mock('@/components/empty-states/ListEmptyState', () => ({
  ListEmptyState: ({ filtered }: { filtered?: boolean }): ReactElement => (
    <div data-testid={filtered ? 'empty-filtered' : 'empty-board'} />
  ),
}))

// ── Work-creation palette mock ────────────────────────────────────────────
// B-24: WorkBoard's +Add / +New now call useWorkCreation().openPalette('task')
// instead of navigating to /tasks. Mock the barrel at the boundary so the real
// WorkCreationProvider (which transitively imports language-provider → @/i18n,
// incompatible with this file's minimal react-i18next mock) never loads, and so
// the palette open can be asserted directly.
const openPaletteMock = vi.fn()
vi.mock('@/components/work-creation', () => ({
  useWorkCreation: () => ({ openPalette: openPaletteMock, closePalette: vi.fn(), isOpen: false }),
}))

// ── Skeleton mock — keep tests deterministic ──────────────────────────────
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }): ReactElement => (
    <div data-testid="skeleton" className={className} />
  ),
}))

// ── Hook mock ─────────────────────────────────────────────────────────────
const mockUseUnifiedKanban = vi.fn()
const mutateMock = vi.fn()
const rejectToastMock = vi.fn()
vi.mock('@/hooks/useUnifiedKanban', () => ({
  useUnifiedKanban: (params: unknown): unknown => mockUseUnifiedKanban(params),
  useUnifiedKanbanStatusUpdate: () => ({ mutate: mutateMock, mutateAsync: mutateMock }),
  useUnifiedKanbanRealtime: () => undefined,
  showCommitmentRejectToast: (reason: string): void => rejectToastMock(reason),
}))

// ── Shared @/components/kanban primitive mock — capture sensors + onDragEnd
//    + the per-column render-prop output at the migration boundary ──────────
type ColumnDescriptor = { id: string; name: string }

let lastKanbanProviderProps: {
  sensors?: unknown[]
  onDragEnd?: (e: unknown) => void
  columns?: ColumnDescriptor[]
  data?: Array<Record<string, unknown>>
} = {}

vi.mock('@/components/kanban', () => ({
  KanbanProvider: ({
    children,
    sensors,
    onDragEnd,
    columns,
    data,
  }: {
    children: (column: ColumnDescriptor) => ReactNode
    sensors?: unknown[]
    onDragEnd: (e: unknown) => void
    columns: ColumnDescriptor[]
    data: Array<Record<string, unknown>>
  }): ReactElement => {
    lastKanbanProviderProps = { sensors, onDragEnd, columns, data }
    return (
      <div
        data-testid="kanban-provider"
        data-sensors-mode={sensors === undefined ? 'default' : 'overridden'}
      >
        {columns.map((column) => (
          <div key={column.id} data-testid={`kanban-column-${column.id}`}>
            {children(column)}
          </div>
        ))}
      </div>
    )
  },
  KanbanBoard: ({ children, id }: { children: ReactNode; id: string }): ReactElement => (
    <div data-testid={`kanban-board-${id}`} data-droppable-id={id}>
      {children}
    </div>
  ),
  KanbanCards: ({
    children,
    id,
  }: {
    children: (item: Record<string, unknown>) => ReactNode
    id: string
  }): ReactElement => (
    <div data-testid={`kanban-cards-${id}`}>
      {(lastKanbanProviderProps.data ?? [])
        .filter((item) => item.column === id)
        .map((item) => (
          <div key={String(item.id)}>{children(item)}</div>
        ))}
    </div>
  ),
  KanbanCard: ({ children, id }: { children: ReactNode; id: string }): ReactElement => (
    <div data-testid={`kanban-card-${id}`} data-card-id={id}>
      {children}
    </div>
  ),
}))

// ── BoardColumn / BoardToolbar / KCard light mocks ────────────────────────
// BoardColumn is mocked but the WorkBoard's render-prop callback drives it
// via the KanbanProvider mock above. The mock signature mirrors the real
// BoardColumn props so the tests' add/click assertions still target the
// stage attribute correctly.
vi.mock('../BoardColumn', () => ({
  BoardColumn: ({
    title,
    stage,
    items,
    dndEnabled,
    onAddItem,
    onItemClick,
  }: {
    title: string
    stage: string
    items: Array<{ id: string; title: string }>
    dndEnabled: boolean
    onAddItem: (s: string) => void
    onItemClick: (it: { id: string }) => void
  }): ReactElement => (
    <section
      data-testid={`column-${stage}`}
      data-dnd-enabled={String(dndEnabled)}
      data-count={items.length}
    >
      <header>{title}</header>
      <button data-testid={`add-${stage}`} onClick={(): void => onAddItem(stage)}>
        +
      </button>
      <ul>
        {items.map((it) => (
          <li key={it.id} data-testid={`item-${it.id}`}>
            <button onClick={(): void => onItemClick(it as never)}>{it.title}</button>
          </li>
        ))}
      </ul>
    </section>
  ),
}))

vi.mock('../BoardToolbar', () => ({
  BoardToolbar: ({
    overdueCount,
    searchQuery,
    onSearchChange,
    onNewItem,
  }: {
    overdueCount: number
    searchQuery: string
    onSearchChange: (q: string) => void
    onNewItem: () => void
  }): ReactElement => (
    <div data-testid="toolbar" data-overdue={String(overdueCount)}>
      <input
        data-testid="toolbar-search"
        value={searchQuery}
        onChange={(e): void => onSearchChange(e.target.value)}
      />
      <button data-testid="toolbar-new" onClick={onNewItem}>
        New
      </button>
    </div>
  ),
}))

// ── helpers ───────────────────────────────────────────────────────────────
type WI = {
  id: string
  source: 'task' | 'commitment' | 'intake'
  title: string
  title_ar?: string
  status: string
  workflow_stage: string | null
  is_overdue: boolean
  days_until_due: number | null
  deadline: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee?: { id: string; name: string; avatar_url: string | null } | null
  dossier?: { id: string; name: string; name_ar?: string } | null
  column_key: string
  tracking_type: string
  description: string | null
  dossier_id: string | null
  engagement_id: string | null
  created_at: string
}

function makeBoardItems(): WI[] {
  return [
    {
      id: 't1',
      source: 'task',
      title: 'Review summit agenda',
      title_ar: 'مراجعة جدول القمة',
      status: 'pending',
      workflow_stage: 'todo',
      is_overdue: false,
      days_until_due: 3,
      deadline: '2026-05-20T00:00:00Z',
      priority: 'medium',
      assignee: { id: 'u1', name: 'Alice Smith', avatar_url: null },
      dossier: { id: 'd1', name: 'Saudi Arabia', name_ar: 'المملكة' },
      column_key: 'todo',
      tracking_type: 'delivery',
      description: null,
      dossier_id: 'd1',
      engagement_id: null,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 't2',
      source: 'task',
      title: 'Draft talking points',
      status: 'in_progress',
      workflow_stage: 'in_progress',
      is_overdue: true,
      days_until_due: -2,
      deadline: '2026-04-20T00:00:00Z',
      priority: 'urgent',
      assignee: { id: 'u2', name: 'Bob Jones', avatar_url: null },
      dossier: { id: 'd2', name: 'France' },
      column_key: 'in_progress',
      tracking_type: 'sla',
      description: null,
      dossier_id: 'd2',
      engagement_id: null,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 't3',
      source: 'commitment',
      title: 'Confirm visa support',
      status: 'in_progress',
      // Commitments carry NO workflow_stage (work-item.types.ts:70) — the board
      // derives their column from `status` via resolveBoardStage.
      workflow_stage: null,
      is_overdue: false,
      days_until_due: 1,
      deadline: '2026-05-10T00:00:00Z',
      priority: 'high',
      assignee: { id: 'u3', name: 'Carla Reed', avatar_url: null },
      dossier: { id: 'd3', name: 'UN' },
      column_key: 'review',
      tracking_type: 'follow_up',
      description: null,
      dossier_id: 'd3',
      engagement_id: null,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 't4',
      source: 'task',
      title: 'Publish briefing',
      status: 'completed',
      workflow_stage: 'done',
      is_overdue: false,
      days_until_due: null,
      deadline: null,
      priority: 'low',
      assignee: null,
      dossier: { id: 'd1', name: 'Saudi Arabia' },
      column_key: 'done',
      tracking_type: 'delivery',
      description: null,
      dossier_id: 'd1',
      engagement_id: null,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 't5',
      source: 'task',
      title: 'Cancelled item',
      status: 'cancelled',
      workflow_stage: 'cancelled',
      is_overdue: false,
      days_until_due: null,
      deadline: null,
      priority: 'low',
      assignee: null,
      dossier: { id: 'd1', name: 'Saudi Arabia' },
      column_key: 'cancelled',
      tracking_type: 'delivery',
      description: null,
      dossier_id: 'd1',
      engagement_id: null,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 't6',
      source: 'task',
      title: 'Status cancelled but stage todo',
      status: 'cancelled',
      workflow_stage: 'todo',
      is_overdue: false,
      days_until_due: null,
      deadline: null,
      priority: 'low',
      assignee: null,
      dossier: { id: 'd2', name: 'France' },
      column_key: 'todo',
      tracking_type: 'delivery',
      description: null,
      dossier_id: 'd2',
      engagement_id: null,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 't7',
      source: 'task',
      title: 'Second todo card',
      status: 'pending',
      workflow_stage: 'todo',
      is_overdue: true,
      days_until_due: -1,
      deadline: '2026-04-22T00:00:00Z',
      priority: 'high',
      assignee: { id: 'u4', name: 'Dana Lin', avatar_url: null },
      dossier: { id: 'd4', name: 'Egypt', name_ar: 'مصر' },
      column_key: 'todo',
      tracking_type: 'delivery',
      description: null,
      dossier_id: 'd4',
      engagement_id: null,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 't8',
      source: 'commitment',
      title: 'Send protocol note',
      status: 'in_progress',
      workflow_stage: null,
      is_overdue: false,
      days_until_due: 5,
      deadline: '2026-05-30T00:00:00Z',
      priority: 'medium',
      assignee: { id: 'u5', name: 'Evan Park', avatar_url: null },
      dossier: { id: 'd5', name: 'Japan' },
      column_key: 'in_progress',
      tracking_type: 'follow_up',
      description: null,
      dossier_id: 'd5',
      engagement_id: null,
      created_at: '2026-01-01T00:00:00Z',
    },
  ]
}

/**
 * Phase 94 Plan 03 — commitment drag fixtures.
 *
 * Deadlines are relative to now so the past-due predicate is deterministic
 * whenever the suite runs. Neither commitment carries a `workflow_stage`;
 * that is the whole point of the no-op guard repair.
 */
function makeCommitmentDragItems(): WI[] {
  const DAY = 86_400_000
  const iso = (offsetDays: number): string => new Date(Date.now() + offsetDays * DAY).toISOString()
  const base = {
    source: 'commitment' as const,
    workflow_stage: null,
    days_until_due: null,
    priority: 'medium' as const,
    assignee: null,
    dossier: { id: 'd9', name: 'Kuwait' },
    tracking_type: 'follow_up',
    description: null,
    dossier_id: 'd9',
    engagement_id: null,
    created_at: '2026-01-01T00:00:00Z',
  }
  return [
    {
      ...base,
      id: 'c1',
      title: 'On-track commitment',
      status: 'in_progress',
      deadline: iso(7),
      is_overdue: false,
      column_key: 'in_progress',
    },
    {
      ...base,
      id: 'c2',
      title: 'Past-due commitment',
      status: 'pending',
      deadline: iso(-5),
      is_overdue: true,
      column_key: 'todo',
    },
  ]
}

// ── tests ─────────────────────────────────────────────────────────────────
beforeEach(() => {
  currentLang = 'en'
  kanbanSearch = {}
  navigateMock.mockReset()
  routeNavigateMock.mockReset()
  openPaletteMock.mockReset()
  openCommitmentMock.mockReset()
  peekRegisterMock.mockReset()
  mutateMock.mockReset()
  rejectToastMock.mockReset()
  mockUseUnifiedKanban.mockReset()
  lastKanbanProviderProps = {}
})

async function importFresh(): Promise<typeof import('../WorkBoard')> {
  const mod = await import('../WorkBoard')
  return mod
}

describe('WorkBoard', () => {
  it('renders BoardToolbar and 4 BoardColumns when data is loaded', async () => {
    mockUseUnifiedKanban.mockReturnValue({ items: makeBoardItems(), isLoading: false })
    const { WorkBoard } = await importFresh()
    render(<WorkBoard />)
    expect(screen.getByTestId('toolbar')).toBeTruthy()
    expect(screen.getByTestId('column-todo')).toBeTruthy()
    expect(screen.getByTestId('column-in_progress')).toBeTruthy()
    expect(screen.getByTestId('column-review')).toBeTruthy()
    expect(screen.getByTestId('column-done')).toBeTruthy()
  })

  it('filters out items with workflow_stage===cancelled OR status===cancelled', async () => {
    mockUseUnifiedKanban.mockReturnValue({ items: makeBoardItems(), isLoading: false })
    const { WorkBoard } = await importFresh()
    render(<WorkBoard />)
    // t5 (stage cancelled) and t6 (status cancelled) must NOT appear in any column
    expect(screen.queryByTestId('item-t5')).toBeNull()
    expect(screen.queryByTestId('item-t6')).toBeNull()
    // surviving t1, t7 in todo
    expect(screen.getByTestId('column-todo').getAttribute('data-count')).toBe('2')
  })

  it('search query filters by title (EN locale)', async () => {
    mockUseUnifiedKanban.mockReturnValue({ items: makeBoardItems(), isLoading: false })
    const { WorkBoard } = await importFresh()
    const { rerender } = render(<WorkBoard />)
    fireEvent.change(screen.getByTestId('toolbar-search'), { target: { value: 'briefing' } })
    kanbanSearch = { search: 'briefing' }
    rerender(<WorkBoard />)
    expect(screen.getByTestId('column-done').getAttribute('data-count')).toBe('1')
    expect(screen.getByTestId('column-todo').getAttribute('data-count')).toBe('0')
    expect(screen.getByTestId('column-in_progress').getAttribute('data-count')).toBe('0')
  })

  it('search matches dossier.name_ar in ar locale', async () => {
    currentLang = 'ar'
    mockUseUnifiedKanban.mockReturnValue({ items: makeBoardItems(), isLoading: false })
    const { WorkBoard } = await importFresh()
    const { rerender } = render(<WorkBoard />)
    fireEvent.change(screen.getByTestId('toolbar-search'), { target: { value: 'مصر' } })
    kanbanSearch = { search: 'مصر' }
    rerender(<WorkBoard />)
    // t7 has dossier.name_ar === 'مصر' and is in todo
    expect(screen.getByTestId('column-todo').getAttribute('data-count')).toBe('1')
    expect(screen.getByTestId('column-in_progress').getAttribute('data-count')).toBe('0')
  })

  it('overdue count equals visibleItems.filter(i => i.is_overdue).length', async () => {
    mockUseUnifiedKanban.mockReturnValue({ items: makeBoardItems(), isLoading: false })
    const { WorkBoard } = await importFresh()
    render(<WorkBoard />)
    // Visible items (cancelled removed) with is_overdue: t2, t7 → 2
    expect(screen.getByTestId('toolbar').getAttribute('data-overdue')).toBe('2')
  })

  it('passes sensors=undefined (KanbanProvider internal sensors active) when columnMode==="status"', async () => {
    mockUseUnifiedKanban.mockReturnValue({ items: makeBoardItems(), isLoading: false })
    const { WorkBoard } = await importFresh()
    render(<WorkBoard />)
    // D-03: in 'status' mode, no `sensors` prop is forwarded so the
    // shared KanbanProvider's internal MouseSensor/TouchSensor/KeyboardSensor
    // remain active. The marker attribute on the mocked provider reflects
    // the prop-presence (default vs overridden).
    expect(lastKanbanProviderProps.sensors).toBeUndefined()
    expect(screen.getByTestId('kanban-provider').getAttribute('data-sensors-mode')).toBe('default')
  })

  it('passes columns descriptor with the 4 expected stages to KanbanProvider', async () => {
    mockUseUnifiedKanban.mockReturnValue({ items: makeBoardItems(), isLoading: false })
    const { WorkBoard } = await importFresh()
    render(<WorkBoard />)
    expect(lastKanbanProviderProps.columns).toBeTruthy()
    const ids = (lastKanbanProviderProps.columns ?? []).map((c) => c.id)
    expect(ids).toEqual(['todo', 'in_progress', 'review', 'done'])
  })

  it('handleDragEnd fires the status update mutation when dropped on a different column', async () => {
    mockUseUnifiedKanban.mockReturnValue({ items: makeBoardItems(), isLoading: false })
    const { WorkBoard } = await importFresh()
    render(<WorkBoard />)
    expect(typeof lastKanbanProviderProps.onDragEnd).toBe('function')
    lastKanbanProviderProps.onDragEnd!({
      active: { id: 't1', data: { current: { source: 'task' } } },
      over: { id: 'col-in_progress', data: { current: { stage: 'in_progress' } } },
    })
    expect(mutateMock).toHaveBeenCalledTimes(1)
    const call = mutateMock.mock.calls[0]?.[0] as { itemId: string; newWorkflowStage: string }
    expect(call.itemId).toBe('t1')
    expect(call.newWorkflowStage).toBe('in_progress')
  })

  it('onItemClick routes by source — task → /tasks/{id}; commitment opens drawer peek', async () => {
    mockUseUnifiedKanban.mockReturnValue({ items: makeBoardItems(), isLoading: false })
    const { WorkBoard } = await importFresh()
    render(<WorkBoard />)
    fireEvent.click(screen.getByTestId('item-t1').querySelector('button')!)
    expect(navigateMock).toHaveBeenCalledWith({ to: '/tasks/t1' })
    fireEvent.click(screen.getByTestId('item-t3').querySelector('button')!)
    expect(peekRegisterMock).toHaveBeenCalled()
    expect(openCommitmentMock).toHaveBeenCalledWith('t3')
    expect(navigateMock).not.toHaveBeenCalledWith({ to: '/commitments' })
  })

  it('per-column +Add opens the work-creation palette prefilled to Task (B-24)', async () => {
    mockUseUnifiedKanban.mockReturnValue({ items: makeBoardItems(), isLoading: false })
    const { WorkBoard } = await importFresh()
    render(<WorkBoard />)
    fireEvent.click(screen.getByTestId('add-review'))
    // B-24: +Add no longer navigates to the (formless) /tasks list with an
    // unconsumed defaultWorkflowStage param; it opens the unified palette.
    expect(openPaletteMock).toHaveBeenCalledTimes(1)
    expect(openPaletteMock).toHaveBeenCalledWith('task')
    expect(navigateMock).not.toHaveBeenCalled()
  })

  // ── Phase 94 Plan 03 (WRITE-04) — the drag that must NOT write ───────────
  //
  // Each assertion is an ABSENCE of a write. "No error shown" would pass a
  // board that writes a status the DB then silently rewrites (D-32), so the
  // oracle asserts that nothing was enqueued at all.

  async function dropCommitment(over: unknown, activeId: string): Promise<void> {
    mockUseUnifiedKanban.mockReturnValue({ items: makeCommitmentDragItems(), isLoading: false })
    const { WorkBoard } = await importFresh()
    render(<WorkBoard />)
    expect(typeof lastKanbanProviderProps.onDragEnd).toBe('function')
    lastKanbanProviderProps.onDragEnd!({ active: { id: activeId }, over })
  }

  it('own-column commitment drop is a no-op — no mutation AND no toast (D-05)', async () => {
    // c1 sits in In progress because its STATUS is in_progress; its
    // workflow_stage is null. The old guard compared workflow_stage, so this
    // drop fired a mutation and a success toast for a gesture that moved
    // nothing.
    await dropCommitment(
      { id: 'col-in_progress', data: { current: { stage: 'in_progress' } } },
      'c1',
    )
    expect(mutateMock).not.toHaveBeenCalled()
    expect(rejectToastMock).not.toHaveBeenCalled()
  })

  it('commitment drop resolving Review is refused before any mutation', async () => {
    await dropCommitment({ id: 'col-review', data: { current: { stage: 'review' } } }, 'c1')
    expect(mutateMock).not.toHaveBeenCalled()
    expect(rejectToastMock).toHaveBeenCalledWith('no_review_counterpart')
  })

  it('past-due commitment dropped on In progress is refused before any mutation', async () => {
    // The trigger would rewrite `in_progress` to `overdue` after a success
    // toast, and the card would snap back to Todo.
    await dropCommitment(
      { id: 'col-in_progress', data: { current: { stage: 'in_progress' } } },
      'c2',
    )
    expect(mutateMock).not.toHaveBeenCalled()
    expect(rejectToastMock).toHaveBeenCalledWith('past_due_coercion')
  })

  it('the same past-due commitment CAN still be dropped on Done — the guard is not a blanket refusal', async () => {
    await dropCommitment({ id: 'col-done', data: { current: { stage: 'done' } } }, 'c2')
    expect(rejectToastMock).not.toHaveBeenCalled()
    expect(mutateMock).toHaveBeenCalledTimes(1)
    const call = mutateMock.mock.calls[0]?.[0] as { itemId: string; deadline: string | null }
    expect(call.itemId).toBe('c2')
    // the due date must reach the mutation layer, or its guard cannot mirror
    // the trigger
    expect(typeof call.deadline).toBe('string')
  })

  it('renders Skeleton placeholders shape-matching 4 columns × 3 kcards when isLoading', async () => {
    mockUseUnifiedKanban.mockReturnValue({ items: [], isLoading: true })
    const { WorkBoard } = await importFresh()
    render(<WorkBoard />)
    const skeletons = screen.getAllByTestId('skeleton')
    // 4 columns × 3 kcard rows = 12, plus optional column-header skeletons; assert ≥ 12
    expect(skeletons.length).toBeGreaterThanOrEqual(12)
  })
})
