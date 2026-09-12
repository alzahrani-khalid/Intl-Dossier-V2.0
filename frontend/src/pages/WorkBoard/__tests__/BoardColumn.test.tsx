/**
 * Phase 39 Plan 02 — BoardColumn unit tests.
 *
 * Verifies the column shell, mono digit count, per-column add button,
 * empty placeholder, and a11y region role.
 *
 * Phase 57 D-21 / D-57-07: mock surface flipped from `@dnd-kit/sortable`
 * to `@/components/kanban` after BoardColumn migrated to the shared
 * KanbanCards / KanbanCard primitive. Card-rendering assertions are
 * delegated to the shared primitive's own tests at
 * `frontend/src/components/kanban/__tests__/`; the first describe below
 * covers only BoardColumn's direct surface (header + count + add button +
 * empty placeholder + region role + KanbanCards id-prop wiring).
 *
 * Phase 94 Plan 08 (D-04 / D-33) — the `@/components/kanban` module mock was
 * REMOVED. D-04 demands proof that a per-card droppable predicate is
 * expressible in the installed dnd-kit (6.3.1); a mocked `useDroppable` could
 * only prove that BoardColumn computes a boolean, which is not the claim. The
 * second describe below therefore drives the REAL dnd-kit: a real
 * KanbanProvider (DndContext + closestCenter), real KanbanCards/KanbanCard
 * (SortableContext + useSortable), a real keyboard drag, and a probe that
 * reads dnd-kit's own `droppableContainers` registry to observe which columns
 * dnd-kit itself considers disabled.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Fragment, type ReactElement } from 'react'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { KanbanProvider, useDndContext, type KanbanItemProps } from '@/components/kanban'
import type { WorkItem, WorkflowStage } from '@/types/work-item.types'

import { BoardColumn, isColumnDropDisabled, type BoardDragItem } from '../BoardColumn'

const laneSourceRoot = existsSync(resolve(process.cwd(), 'frontend/src'))
  ? resolve(process.cwd(), 'frontend/src')
  : resolve(process.cwd(), 'src')
const laneRepoRoot = resolve(laneSourceRoot, '../..')
const laneProductionPaths = [
  'pages/WorkBoard/BoardColumn.tsx',
  'pages/WorkBoard/WorkBoard.tsx',
  'pages/analytics/AnalyticsDashboardPage.tsx',
  'pages/availability-polling/AvailabilityPollingPage.tsx',
  'pages/dossiers/DossierListPage.tsx',
  'pages/engagements/EngagementsListPage.tsx',
  'pages/engagements/workspace/AuditTab.tsx',
  'pages/geographic-visualization/GeographicVisualizationPage.tsx',
  'pages/intelligence/IntelligencePage.tsx',
  'pages/my-work/MyWorkDashboard.tsx',
  'pages/my-work/components/ProductivityMetrics.tsx',
  'pages/my-work/components/TeamWorkloadPanel.tsx',
  'pages/my-work/components/WorkItemCard.tsx',
] as const
const laneProductionSources = Object.fromEntries(
  laneProductionPaths.map((path) => [path, readFileSync(resolve(laneSourceRoot, path), 'utf8')]),
) as Record<(typeof laneProductionPaths)[number], string>
const joinedLaneProduction = Object.values(laneProductionSources).join('\n')
const literalMaskPattern = /\bt\(\s*'[^']+'\s*,\s*'[^']*'/g
const fallbackOptionPattern = /\bdefaultValue(?:_[A-Za-z0-9]+)?\s*:/g
const rawKeyPattern = /\bt\(\s*'[^']+'/g

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

// ── KCard mock — keep the visual child deterministic. The draggable
//    listeners live on the REAL KanbanCard wrapper, not here, so mocking
//    KCard does not weaken the drag oracle below. ──────────────────────────
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

  it('renders mono count with Latin digits in ar locale', () => {
    currentLang = 'ar'
    render(<BoardColumn {...baseProps} items={buildItems(12)} />)
    expect(screen.getByText('12')).toBeTruthy()
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
    const { container } = render(
      <BoardColumn {...baseProps} stage="in_progress" items={buildItems(2)} />,
    )
    const cards = container.querySelector('#in_progress')
    expect(cards).toBeTruthy()
    expect(cards?.className).toContain('col-body')
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

  it('preserves the Phase 39 selector contract (section.col + data-droppable-id)', () => {
    const { container } = render(<BoardColumn {...baseProps} items={buildItems(1)} />)
    expect(container.querySelector('section.col[data-droppable-id="todo"]')).toBeTruthy()
  })
})

// ══════════════════════════════════════════════════════════════════════════
// Phase 94 Plan 08 — the drop-affordance oracle (D-04 expressibility, D-33
// one-condition-two-enforcement-points, and the mandatory home-column
// carve-out). Everything below runs against the REAL @dnd-kit/core 6.3.1.
// ══════════════════════════════════════════════════════════════════════════

const STAGES: WorkflowStage[] = ['todo', 'in_progress', 'review', 'done']

const TODAY = new Date().toISOString().slice(0, 10)
const PAST_DUE = '2020-01-01'
const FUTURE_DUE = '2999-01-01'

type BoardKanbanItem = BoardDragItem & KanbanItemProps

function makeDragItem(
  overrides: Partial<WorkItem> & { homeStage: WorkflowStage },
): BoardKanbanItem {
  const { homeStage, ...rest } = overrides
  const item = makeItem(rest)
  return {
    ...(item as WorkItem),
    name: item.title,
    column: homeStage as string,
    homeStage,
  } as BoardKanbanItem
}

/**
 * Reads dnd-kit's OWN droppable registry. This is the assertion of record:
 * it proves dnd-kit accepted `disabled` and marked the container, not merely
 * that BoardColumn computed a boolean.
 */
function DropProbe(): ReactElement {
  const { active, droppableContainers } = useDndContext()
  const disabled = STAGES.filter((stage) => droppableContainers.get(stage)?.disabled === true)
  const registered = STAGES.filter((stage) => droppableContainers.get(stage) !== undefined)
  return (
    <div
      data-testid="drop-probe"
      data-active={active === null ? '' : String(active.id)}
      data-registered={registered.join(',')}
      data-disabled={disabled.join(',')}
    />
  )
}

function renderBoard(items: BoardKanbanItem[]): void {
  const byStage: Record<string, WorkItem[]> = { todo: [], in_progress: [], review: [], done: [] }
  for (const item of items) {
    byStage[item.homeStage]?.push(item as unknown as WorkItem)
  }
  render(
    <KanbanProvider<BoardKanbanItem, { id: WorkflowStage; name: string }>
      columns={STAGES.map((stage) => ({ id: stage, name: stage }))}
      data={items}
    >
      {(column): ReactElement => (
        <Fragment key={column.id}>
          <BoardColumn
            title={column.name}
            stage={column.id}
            items={byStage[column.id] ?? []}
            dndEnabled
            onItemClick={vi.fn()}
            onAddItem={vi.fn()}
          />
          {column.id === 'done' ? <DropProbe /> : null}
        </Fragment>
      )}
    </KanbanProvider>,
  )
}

/** Starts a real dnd-kit drag through the KeyboardSensor the board ships. */
function startDrag(cardId: string): void {
  const card = document.querySelector(`[data-card-id="${cardId}"]`)
  expect(card).toBeTruthy()
  fireEvent.keyDown(card as Element, { key: ' ', code: 'Space' })
}

function probe(): { active: string; registered: string; disabled: string } {
  const node = screen.getByTestId('drop-probe')
  return {
    active: node.getAttribute('data-active') ?? '',
    registered: node.getAttribute('data-registered') ?? '',
    disabled: node.getAttribute('data-disabled') ?? '',
  }
}

describe('BoardColumn — commitment drop affordance (D-04 / D-33)', () => {
  it('sanity: today is between the fixture dates, so past/future are unambiguous', () => {
    expect(PAST_DUE < TODAY).toBe(true)
    expect(FUTURE_DUE > TODAY).toBe(true)
  })

  it('registers all four columns as droppables and disables NONE while idle', () => {
    renderBoard([
      makeDragItem({
        id: 'c1',
        source: 'commitment',
        status: 'pending',
        workflow_stage: null,
        deadline: PAST_DUE,
        homeStage: 'todo',
      }),
    ])
    const before = probe()
    expect(before.registered).toBe('todo,in_progress,review,done')
    expect(before.active).toBe('')
    expect(before.disabled).toBe('')
  })

  it('dragging a NOT-past-due commitment disables Review only — dnd-kit registry', () => {
    renderBoard([
      makeDragItem({
        id: 'c1',
        source: 'commitment',
        status: 'pending',
        workflow_stage: null,
        deadline: FUTURE_DUE,
        homeStage: 'todo',
      }),
    ])
    startDrag('c1')
    const during = probe()
    expect(during.active).toBe('c1')
    expect(during.disabled).toBe('review')
  })

  it('dragging a PAST-DUE commitment also disables In progress — but NEVER its home column', () => {
    renderBoard([
      makeDragItem({
        id: 'c1',
        source: 'commitment',
        status: 'pending',
        workflow_stage: null,
        deadline: PAST_DUE,
        homeStage: 'todo',
      }),
    ])
    startDrag('c1')
    const during = probe()
    expect(during.active).toBe('c1')
    // Todo would be refused by the guard (pending is coerced to overdue) but is
    // the card's HOME column, so the carve-out keeps it droppable. Done stays
    // droppable because `completed` is outside the trigger's status set.
    expect(during.disabled).toBe('in_progress,review')
  })

  it('the carve-out follows the card: a past-due commitment sitting in In progress keeps ITS home droppable', () => {
    renderBoard([
      makeDragItem({
        id: 'c1',
        source: 'commitment',
        status: 'in_progress',
        workflow_stage: null,
        deadline: PAST_DUE,
        homeStage: 'in_progress',
      }),
    ])
    startDrag('c1')
    expect(probe().disabled).toBe('todo,review')
  })

  it('dragging a TASK disables nothing — the predicate is commitment-only', () => {
    renderBoard([
      makeDragItem({
        id: 't1',
        source: 'task',
        status: 'pending',
        workflow_stage: 'todo',
        deadline: PAST_DUE,
        homeStage: 'todo',
      }),
    ])
    startDrag('t1')
    const during = probe()
    expect(during.active).toBe('t1')
    expect(during.disabled).toBe('')
  })

  it('paints no drop affordance: disabling adds no class or style to section.col', () => {
    renderBoard([
      makeDragItem({
        id: 'c1',
        source: 'commitment',
        status: 'pending',
        workflow_stage: null,
        deadline: PAST_DUE,
        homeStage: 'todo',
      }),
    ])
    const review = document.querySelector('section.col[data-droppable-id="review"]') as HTMLElement
    const classBefore = review.getAttribute('class')
    const styleBefore = review.getAttribute('style')
    startDrag('c1')
    expect(probe().disabled).toContain('review')
    expect(review.getAttribute('class')).toBe(classBefore)
    expect(review.getAttribute('style')).toBe(styleBefore)
  })
})

describe('isColumnDropDisabled — the shared-guard predicate (D-33)', () => {
  const pastDueInTodo: BoardDragItem = makeDragItem({
    id: 'c1',
    source: 'commitment',
    status: 'pending',
    workflow_stage: null,
    deadline: PAST_DUE,
    homeStage: 'todo',
  })
  const futureInTodo: BoardDragItem = makeDragItem({
    id: 'c2',
    source: 'commitment',
    status: 'pending',
    workflow_stage: null,
    deadline: FUTURE_DUE,
    homeStage: 'todo',
  })

  it('no active card disables nothing', () => {
    for (const stage of STAGES) {
      expect(isColumnDropDisabled(undefined, stage)).toBe(false)
    }
  })

  it('review has no commitment counterpart, so it is refused regardless of due date', () => {
    expect(isColumnDropDisabled(futureInTodo, 'review')).toBe(true)
    expect(isColumnDropDisabled(pastDueInTodo, 'review')).toBe(true)
  })

  it('past-due refuses the two statuses the trigger coerces, and only those', () => {
    expect(isColumnDropDisabled(pastDueInTodo, 'in_progress')).toBe(true)
    expect(isColumnDropDisabled(pastDueInTodo, 'done')).toBe(false)
  })

  it('the home column is never disabled — the closestCenter-retarget carve-out', () => {
    // Todo maps to `pending`, which the trigger WOULD coerce for a past-due
    // row; the carve-out overrides that because a disabled home column turns a
    // harmless drop-where-you-started into a retargeted, silent write.
    expect(isColumnDropDisabled(pastDueInTodo, 'todo')).toBe(false)
    const pastDueInDone: BoardDragItem = { ...pastDueInTodo, homeStage: 'done' }
    expect(isColumnDropDisabled(pastDueInDone, 'todo')).toBe(true)
  })
})

describe('P99-62 acceptance criteria', () => {
  it("No t() call in this slice passes an English default; a missing key now shows as missing in both locales — which the gatekeeper's proven zero makes an empty set today.", () => {
    expect(joinedLaneProduction.match(literalMaskPattern) ?? []).toHaveLength(0)
    expect(joinedLaneProduction.match(fallbackOptionPattern) ?? []).toHaveLength(0)
  })

  it("Decisions covered — D-06, D-20, D-23, D-24, D-28, D-39: deletion-only, behind the gatekeeper, no conversion, one population, every zero controlled, file-disjoint from its siblings. || Both mask shapes are deleted across this lane's files: `t('key', 'Literal')` -> `t('key')`, `t('key', 'Literal', opts)` -> `t('key', opts)`, and the object-form fallback-text option is removed while every remaining option is kept — because interpolation options are not masks. The object-form fallback class is a SEPARATE population from the literal class: 314 sites across 103 files repo-wide, 88 of which carry no literal-class site at all, and the first draft's single 161-file scope covered only the literal class while demanding both reach zero.", () => {
    expect(joinedLaneProduction.match(literalMaskPattern) ?? []).toHaveLength(0)
    expect(joinedLaneProduction.match(fallbackOptionPattern) ?? []).toHaveLength(0)
    expect(laneProductionSources['pages/my-work/components/WorkItemCard.tsx']).toMatch(
      /t\('deadline\.dueInDays',\s*\{\s*count:/,
    )
  })

  it("COMPANION TESTS — This part owns exactly these companion tests: `frontend/src/pages/WorkBoard/__tests__/BoardColumn.test.tsx`, `frontend/src/pages/engagements/__tests__/EngagementsListPage.test.tsx`. They are here because they ASSERT ON THE ENGLISH LITERALS THIS PART DELETES, and the WHOLE IMPORT CLOSURE of each is inside this part, so repairing one never reaches another part''s file (RULING-P99-468). TRIGGER: if this part''s deletions cause one to render or assert a BARE i18n KEY, or to fail on a literal that no longer exists, it MUST be repaired as below; OTHERWISE it MUST be left BYTE-UNCHANGED — ownership grants authority to repair a break this part causes, never a mandate to rewrite a test that still passes. || KEYS are byte-untouched. The diff contains deletions of default arguments and nothing else — no key string, no namespace prefix, no hook, no import moves. Spot-diff a sample and state it. COMPANION TEST FIXTURES, OWNED AND CONDITIONALLY REPAIRABLE (RULING-P99-429). The companion tests named in files_modified are owned by this lane. TRIGGER: if this lane's deletions cause one of them to render or assert a BARE i18n KEY as visible text or accessible name, it MUST be repaired as below; OTHERWISE it MUST be left BYTE-UNCHANGED - ownership grants authority to repair a break this lane causes, never a mandate to rewrite a test that still passes. WHEN REPAIRED: (a) expected copy comes from a STATIC top-level import of the relevant frontend/src/i18n/{en,ar}/<ns>.json, as DossierEngagementsTab.test.tsx:6-7 does, and any hand-copied copy object is deleted; (b) the react-i18next mock RESOLVES keys against the real bundle loaded with await vi.importActual of that same JSON INSIDE the vi.mock factory - a static import cannot serve this side because vi.mock is hoisted above it - with no private copy, no default-argument fallback and no key fallback; (c) the resolved en AND ar values are both asserted, the ar assertion being what proves the fallback is gone; (d) the rendered output must NOT contain the bare key; (e) existing assertions still exist and still run, not deleted, skipped, .only-ed or loosened. AND NO PRODUCTION-SIDE ESCAPE: the suite is made green by repairing the TEST. No production change may be made whose EFFECT is that an assertion passes independently of whether the key resolves - that covers a literal second-argument default, an object-form default option, and any conditional, wrapper, concatenation or logical-or that substitutes for or augments the value returned by t(). If a key fails to resolve, production must render the failure, not disguise it. || NO i18n JSON changes in this lane — a JSON edit here means the gatekeeper's proof was wrong or scope broke", () => {
    expect(laneProductionSources['pages/WorkBoard/BoardColumn.tsx']).toContain("t('emptyColumn')")

    render(<BoardColumn {...baseProps} items={[]} />)
    expect(screen.getByText('No items')).toBeTruthy()
    expect(screen.queryByText('emptyColumn')).toBeNull()

    currentLang = 'ar'
    render(<BoardColumn {...baseProps} items={[]} />)
    expect(screen.getByText('لا توجد عناصر')).toBeTruthy()
    expect(screen.queryByText('emptyColumn')).toBeNull()
  })

  it("A mask site found in a file OUTSIDE this lane's list means the tree moved between the gatekeeper's manifest and this lane: STOP and record it, do not widen scope || This part's logic-diff budget is **~36790 bytes** against the engine's 60,000-byte gates.diffCap. It is NOT a plan-time floor: it is the pre-split lane's ENGINE-MEASURED 107645-byte diff (fetchTaskDiff at the attempt's own HEAD, 1.79x over cap), apportioned by this part's 62/251 share of the lane's mask sites — so it inherits a measurement, not an estimate, and it inherits the pre-split churn too, which makes it an OVER-estimate of deletion-only work. On top of that it carries 2 companion-test allowance(s) at 5,100 bytes each — MEASURED, not guessed: the one companion repaired in the landed lane 5 cost 5,036 logic-diff bytes. Test companions carry no masks, so they cost budget without earning apportioned budget (RULING-P99-468 order 4). Every part is held at or under 45,000 bytes, >=25% under the 60,000 cap, per RULING-P99-465 and the decomposition rule. The pre-split floor for this lane read ~44066 bytes and the truth was 107645: a 2x miss, which is exactly why a measured apportionment replaces it. A diff-cap trip returns park:\"human\" with the engine's own note that the diff cannot shrink by retrying — it is un-retryable, after the work is done, which is why the parts are cut this small.", () => {
    expect(laneProductionPaths).toHaveLength(13)
    expect(new Set(laneProductionPaths).size).toBe(13)
    expect(laneProductionPaths.every((path) => laneProductionSources[path].length > 0)).toBe(true)
  })

  it("the strict instrument's twoArgTotal — EVERY mask site, resolved or not, seen by the cross-line matcher — reads ZERO across this lane's files, with a nonzero rawKeyTotal as the positive control that the scope matched real t() calls, AND no fallback-text option survives in them. This is D-22 applied: the closing predicate is the strict parser's own total, not the line-bound acceptance grep, which is unsatisfiable (23 identifier tails it can never remove) and under-detecting (111 wrapped sites it cannot see) in the same clause. RED at HEAD (62 mask sites in this part).", () => {
    expect(joinedLaneProduction.match(literalMaskPattern) ?? []).toHaveLength(0)
    expect(joinedLaneProduction.match(fallbackOptionPattern) ?? []).toHaveLength(0)
    expect((joinedLaneProduction.match(rawKeyPattern) ?? []).length).toBeGreaterThan(0)
  })

  it('no i18n JSON changed in this lane, the scoped strict audit still reads zero UNRESOLVED after the drop (a nonzero here means a key moved, which is the one way a deletion-only diff can go wrong), and the phase negative control still prints 3x MISS=true — RED at HEAD', () => {
    const scope = laneProductionPaths.map((path) => `frontend/src/${path}`).join(',')
    const audit = JSON.parse(
      execFileSync(
        process.execPath,
        [
          resolve(laneRepoRoot, 'scripts/i18n-audit-strict.mjs'),
          laneRepoRoot,
          '--scope',
          scope,
          '--json',
        ],
        { encoding: 'utf8' },
      ),
    ) as Record<string, number>
    const negativeControl = execFileSync(
      process.execPath,
      [resolve(laneRepoRoot, 'scripts/neg-taskcard.mjs'), laneRepoRoot],
      { encoding: 'utf8' },
    )

    expect(audit.twoArgTotal).toBe(0)
    expect(audit.rawKeyTotal).toBeGreaterThan(0)
    expect(audit.twoArgUnresolved).toBe(0)
    expect(audit.rawKeyUnresolved).toBe(0)
    expect(audit.twoArgUnresolvedAr).toBe(0)
    expect(audit.rawKeyUnresolvedAr).toBe(0)
    expect(negativeControl.match(/MISS=true/g) ?? []).toHaveLength(3)
    expect(laneProductionPaths.some((path) => path.endsWith('.json'))).toBe(false)
  })
})
