/**
 * Phase 39 Plan 02 — BoardColumn unit tests.
 *
 * Verifies the column shell, mono digit count, per-column add button,
 * empty placeholder, and a11y region role.
 *
 * Phase 57 D-21 / D-57-07: mock surface flipped from `@dnd-kit/sortable`
 * to `@/components/kanban` after BoardColumn migrated to the shared
 * KanbanCards / KanbanCard primitive. Card-rendering assertions are now
 * delegated to the shared primitive's own tests at
 * `frontend/src/components/kanban/__tests__/`; this test covers only
 * BoardColumn's direct surface (header + count + add button + empty
 * placeholder + region role + KanbanCards id-prop wiring).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

import { BoardColumn } from '../BoardColumn'
import type { WorkItem, WorkflowStage } from '@/types/work-item.types'

// ── i18n mock ─────────────────────────────────────────────────────────────
let currentLang = 'en'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>): string => {
      if (key === 'actions.addToColumn' && opts && typeof opts.column === 'string') {
        return currentLang === 'ar' ? `إضافة إلى ${opts.column}` : `Add to ${opts.column}`
      }
      if (key === 'emptyColumn') {
        return currentLang === 'ar' ? 'لا توجد عناصر' : 'No items'
      }
      return key
    },
    i18n: { language: currentLang },
  }),
}))

// ── Shared kanban primitive mock — KanbanCards becomes a passthrough
//    that records the id prop on a data-attribute for assertion. The
//    children callback is NOT invoked here because BoardColumn standalone
//    has no KanbanProvider context; per-item rendering is covered by the
//    primitive's own tests under frontend/src/components/kanban/__tests__/.
// ─────────────────────────────────────────────────────────────────────────
vi.mock('@/components/kanban', () => ({
  KanbanCards: ({
    id,
    className,
  }: {
    id: string
    className?: string
    children: (item: unknown) => ReactNode
  }): ReactElement => (
    <div data-testid={`kanban-cards-${id}`} data-kanban-id={id} className={className} />
  ),
  KanbanCard: ({ children, id }: { children: ReactNode; id: string }): ReactElement => (
    <div data-testid={`kanban-card-${id}`}>{children}</div>
  ),
}))

// ── KCard mock — keep test surface deterministic (unused in this rewrite
//    because the KanbanCards mock does not invoke its children callback;
//    kept registered so import-time resolution stays stable). ──────────────
vi.mock('../KCard', () => ({
  KCard: ({ item }: { item: WorkItem }): ReactElement => (
    <div data-testid={`kcard-${item.id}`}>{item.title}</div>
  ),
}))

// ── helpers ───────────────────────────────────────────────────────────────
function makeItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: 'item-1',
    source: 'task',
    title: 'Sample',
    description: null,
    priority: 'medium',
    status: 'pending',
    workflow_stage: 'todo',
    column_key: 'todo',
    tracking_type: 'delivery',
    deadline: null,
    is_overdue: false,
    days_until_due: null,
    assignee: null,
    dossier_id: null,
    engagement_id: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as WorkItem
}

function buildItems(count: number): WorkItem[] {
  return Array.from({ length: count }, (_, i) =>
    makeItem({ id: `item-${i + 1}`, title: `Item ${i + 1}` }),
  )
}

const baseProps = {
  title: 'To Do',
  stage: 'todo' as WorkflowStage,
  dndEnabled: false,
  onItemClick: vi.fn(),
  onAddItem: vi.fn(),
}

beforeEach(() => {
  currentLang = 'en'
  baseProps.onItemClick = vi.fn()
  baseProps.onAddItem = vi.fn()
})

// ── tests ─────────────────────────────────────────────────────────────────
describe('BoardColumn', () => {
  it('renders header with title and mono count', () => {
    render(<BoardColumn {...baseProps} items={buildItems(3)} />)
    expect(screen.getByRole('heading', { name: 'To Do' })).toBeTruthy()
    const count = screen.getByText('3')
    expect(count).toBeTruthy()
    expect(count.className).toContain('font-mono')
  })

  it('renders mono count through toArDigits in ar locale', () => {
    currentLang = 'ar'
    render(<BoardColumn {...baseProps} items={buildItems(12)} />)
    // 12 → ١٢
    expect(screen.getByText('١٢')).toBeTruthy()
  })

  it('per-column + button has accessible name from t(actions.addToColumn)', () => {
    render(<BoardColumn {...baseProps} items={buildItems(1)} />)
    const button = screen.getByRole('button', { name: 'Add to To Do' })
    expect(button).toBeTruthy()
  })

  it('clicking + invokes onAddItem with the column workflow stage', () => {
    const onAddItem = vi.fn()
    render(<BoardColumn {...baseProps} items={buildItems(0)} onAddItem={onAddItem} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add to To Do' }))
    expect(onAddItem).toHaveBeenCalledTimes(1)
    expect(onAddItem).toHaveBeenCalledWith('todo')
  })

  it('renders KanbanCards with id matching the workflow stage', () => {
    render(<BoardColumn {...baseProps} stage="in_progress" items={buildItems(2)} />)
    const cards = screen.getByTestId('kanban-cards-in_progress')
    expect(cards).toBeTruthy()
    expect(cards.dataset.kanbanId).toBe('in_progress')
  })

  it('renders empty placeholder (text-only, no spinner) when items.length is 0', () => {
    render(<BoardColumn {...baseProps} items={[]} />)
    expect(screen.getByText('No items')).toBeTruthy()
    // No spinner role
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('does NOT render the empty placeholder when items.length > 0', () => {
    render(<BoardColumn {...baseProps} items={buildItems(1)} />)
    expect(screen.queryByText('No items')).toBeNull()
  })

  it('section is role=region and aria-labelledby matches heading id', () => {
    render(<BoardColumn {...baseProps} items={buildItems(1)} />)
    const region = screen.getByRole('region')
    const labelledBy = region.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    const heading = screen.getByRole('heading', { name: 'To Do' })
    expect(heading.id).toBe(labelledBy)
  })
})
