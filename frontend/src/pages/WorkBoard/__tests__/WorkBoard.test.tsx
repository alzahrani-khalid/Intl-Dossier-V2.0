/**
 * Phase 39 Plan 04 — WorkBoard page composer unit tests.
 *
 * Verifies the integration of useUnifiedKanban + BoardToolbar + 4 BoardColumns,
 * the cancelled-stage filter, the client-side search filter (over EN + AR fields),
 * the overdue-count derivation, the conditional DnD sensors, and the drag-end
 * mutation wiring per D-03/D-07/D-08.
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
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
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
vi.mock('@/hooks/useUnifiedKanban', () => ({
  useUnifiedKanban: (params: unknown): unknown => mockUseUnifiedKanban(params),
  useUnifiedKanbanStatusUpdate: () => ({ mutate: mutateMock, mutateAsync: mutateMock }),
  useUnifiedKanbanRealtime: () => undefined,
}))

// ── DnD-kit core mock — capture sensors + onDragEnd at the boundary ───────
let lastDndSensors: unknown[] = []
let lastDragEndHandler: ((e: unknown) => void) | undefined

vi.mock('@dnd-kit/core', () => {
  const useSensor = (sensor: unknown, opts?: unknown): { sensor: unknown; opts: unknown } => ({
    sensor,
    opts,
  })
  const useSensors = (...sensors: unknown[]): unknown[] => sensors
  return {
    DndContext: ({
      children,
      sensors,
      onDragEnd,
    }: {
      children: ReactNode
      sensors: unknown[]
      onDragEnd: (e: unknown) => void
    }): ReactElement => {
      lastDndSensors = sensors
      lastDragEndHandler = onDragEnd
      return <div data-testid="dnd-ctx">{children}</div>
    },
    MouseSensor: { name: 'MouseSensor' },
    TouchSensor: { name: 'TouchSensor' },
    KeyboardSensor: { name: 'KeyboardSensor' },
    useSensor,
    useSensors,
  }
})

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: ReactNode }): ReactElement => <>{children}</>,
  verticalListSortingStrategy: { name: 'vertical' },
  sortableKeyboardCoordinates: () => ({ x: 0, y: 0 }),
}))

// ── BoardColumn / BoardToolbar / KCard light mocks ────────────────────────
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
      workflow_stage: 'review',
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
      workflow_stage: 'in_progress',
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

// ── tests ─────────────────────────────────────────────────────────────────
beforeEach(() => {
  currentLang = 'en'
  navigateMock.mockReset()
  mutateMock.mockReset()
  mockUseUnifiedKanban.mockReset()
  lastDndSensors = []
  lastDragEndHandler = undefined
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
    render(<WorkBoard />)
    fireEvent.change(screen.getByTestId('toolbar-search'), { target: { value: 'briefing' } })
    expect(screen.getByTestId('column-done').getAttribute('data-count')).toBe('1')
    expect(screen.getByTestId('column-todo').getAttribute('data-count')).toBe('0')
    expect(screen.getByTestId('column-in_progress').getAttribute('data-count')).toBe('0')
  })

  it('search matches dossier.name_ar in ar locale', async () => {
    currentLang = 'ar'
    mockUseUnifiedKanban.mockReturnValue({ items: makeBoardItems(), isLoading: false })
    const { WorkBoard } = await importFresh()
    render(<WorkBoard />)
    fireEvent.change(screen.getByTestId('toolbar-search'), { target: { value: 'مصر' } })
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

  it('sensors include MouseSensor (and TouchSensor + KeyboardSensor) when columnMode==="status"', async () => {
    mockUseUnifiedKanban.mockReturnValue({ items: [], isLoading: false })
    const { WorkBoard } = await importFresh()
    render(<WorkBoard />)
    // Default mode is 'status' → 3 sensors
    expect(lastDndSensors.length).toBe(3)
    // First sensor is MouseSensor
    const first = lastDndSensors[0] as { sensor: { name: string } }
    expect(first.sensor.name).toBe('MouseSensor')
  })

  it('handleDragEnd fires the status update mutation when dropped on a different column', async () => {
    mockUseUnifiedKanban.mockReturnValue({ items: makeBoardItems(), isLoading: false })
    const { WorkBoard } = await importFresh()
    render(<WorkBoard />)
    expect(typeof lastDragEndHandler).toBe('function')
    lastDragEndHandler!({
      active: { id: 't1', data: { current: { source: 'task' } } },
      over: { id: 'col-in_progress', data: { current: { stage: 'in_progress' } } },
    })
    expect(mutateMock).toHaveBeenCalledTimes(1)
    const call = mutateMock.mock.calls[0]?.[0] as { itemId: string; newWorkflowStage: string }
    expect(call.itemId).toBe('t1')
    expect(call.newWorkflowStage).toBe('in_progress')
  })

  it('onItemClick routes by source — task → /tasks/{id}; commitment → /commitments', async () => {
    mockUseUnifiedKanban.mockReturnValue({ items: makeBoardItems(), isLoading: false })
    const { WorkBoard } = await importFresh()
    render(<WorkBoard />)
    fireEvent.click(screen.getByTestId('item-t1').querySelector('button')!)
    expect(navigateMock).toHaveBeenCalledWith({ to: '/tasks/t1' })
    fireEvent.click(screen.getByTestId('item-t3').querySelector('button')!)
    expect(navigateMock).toHaveBeenCalledWith({ to: '/commitments' })
  })

  it('per-column +Add invokes navigate to /tasks with the workflow stage', async () => {
    mockUseUnifiedKanban.mockReturnValue({ items: makeBoardItems(), isLoading: false })
    const { WorkBoard } = await importFresh()
    render(<WorkBoard />)
    fireEvent.click(screen.getByTestId('add-review'))
    expect(navigateMock).toHaveBeenCalledTimes(1)
    const call = navigateMock.mock.calls[0]?.[0] as { to: string }
    expect(call.to).toContain('/tasks')
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
