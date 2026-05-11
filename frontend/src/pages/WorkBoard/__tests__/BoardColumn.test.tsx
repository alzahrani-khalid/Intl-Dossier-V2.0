/**
 * Phase 39 Plan 02 — BoardColumn unit tests.
 *
 * Verifies the column shell, mono digit count, per-column add button,
 * conditional SortableContext wrapping, empty placeholder, and a11y region role.
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

// ── @dnd-kit/sortable mock — assert wrapper presence via a sentinel div ───
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({
    items,
    children,
  }: {
    items: string[]
    children: ReactNode
  }): ReactElement => (
    <div data-testid="sortable-ctx" data-items={items.join(',')}>
      {children}
    </div>
  ),
  verticalListSortingStrategy: { name: 'vertical' },
}))

// ── KCard mock — keep test surface deterministic ──────────────────────────
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

  it('wraps children in SortableContext when dndEnabled is true', () => {
    render(<BoardColumn {...baseProps} dndEnabled items={buildItems(2)} />)
    const ctx = screen.getByTestId('sortable-ctx')
    expect(ctx).toBeTruthy()
    expect(ctx.dataset.items).toBe('item-1,item-2')
  })

  it('does NOT wrap in SortableContext when dndEnabled is false', () => {
    render(<BoardColumn {...baseProps} dndEnabled={false} items={buildItems(2)} />)
    expect(screen.queryByTestId('sortable-ctx')).toBeNull()
    // KCards still rendered
    expect(screen.getByTestId('kcard-item-1')).toBeTruthy()
    expect(screen.getByTestId('kcard-item-2')).toBeTruthy()
  })

  it('renders empty placeholder (text-only, no spinner) when items.length is 0', () => {
    render(<BoardColumn {...baseProps} items={[]} />)
    expect(screen.getByText('No items')).toBeTruthy()
    // No spinner role
    expect(screen.queryByRole('progressbar')).toBeNull()
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
