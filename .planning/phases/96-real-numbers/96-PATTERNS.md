# Phase 96: Real Numbers - Pattern Map

**Mapped:** 2026-08-17
**Files analyzed:** 27 new/modified files (10 created, 17 modified)
**Analogs found:** 25 / 27 (2 partial — listed in No Analog Found)

All analog excerpts below were read from the working tree at branch `milestone/v10.0-trust`
(pre-leg HEAD `00861519d`). Line numbers are pinned to that state; the seam is the symbol if
lines drift (the 96-RESEARCH.md rule).

## File Classification

### Files to be CREATED

| New File                                                                                                                                                 | Role                     | Data Flow              | Closest Analog                                                                                                                  | Match Quality                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `supabase/migrations/<ts>_p96_scenario_rls_recursion.sql`                                                                                                | migration                | request-response (RLS) | `supabase/migrations/20260816500001_p94_report_rls_recursion.sql`                                                               | **exact** — identical defect class (42P17 SELECT↔SELECT cycle)                |
| `supabase/migrations/<ts>_p96_commitment_overdue_insert_gap.sql`                                                                                         | migration                | event-driven (trigger) | same P94 migration (conventions) + `supabase/CLAUDE.md` idempotency rules                                                       | role-match                                                                    |
| `supabase/migrations/<ts>_p96_rpc_count_truth.sql` (if RPC bodies change: `get_commitment_fulfillment` bucket, `get_unified_work_kanban` Done semantics) | migration                | CRUD (RPC)             | `supabase/migrations/20260330000001_operations_hub_rpcs.sql`                                                                    | exact — the RPCs being changed live there / follow its shape                  |
| `tests/e2e/96-analytics-real.spec.ts`                                                                                                                    | test (e2e)               | request-response       | `tests/e2e/95-sandbox-error.spec.ts`                                                                                            | **exact** — same CDP-forced + natural-arm shape                               |
| `tests/e2e/96-custom-dashboard-truth.spec.ts`                                                                                                            | test (e2e)               | request-response       | `tests/e2e/95-sandbox-error.spec.ts`                                                                                            | exact                                                                         |
| `tests/e2e/96-calendar-family.spec.ts`                                                                                                                   | test (e2e)               | request-response       | `tests/e2e/95-sandbox-error.spec.ts` (+ `95-slots-tabs.spec.ts` for multi-route sweeps)                                         | exact                                                                         |
| `tests/e2e/96-count-agreement.spec.ts`                                                                                                                   | test (e2e)               | request-response       | `tests/e2e/95-sandbox-error.spec.ts`                                                                                            | exact (same-clock DOM snapshot is new content, harness identical)             |
| `tests/e2e/96-overdue-badge.spec.ts`                                                                                                                     | test (e2e)               | request-response       | `tests/e2e/95-sandbox-error.spec.ts`                                                                                            | exact                                                                         |
| `tests/e2e/96-extension-rows.spec.ts`                                                                                                                    | test (e2e + SQL fixture) | request-response       | `tests/e2e/95-sandbox-error.spec.ts` + `scripts/probe-report-rls.mjs` (namespaced fixture + finally-cleanup)                    | role-match                                                                    |
| `frontend/src/pages/WorkBoard/__tests__/stage-status-parity.test.ts`                                                                                     | test (unit)              | transform              | `frontend/src/pages/WorkBoard/__tests__/KCard.test.tsx` (harness) + `WorkBoard.test.tsx:546-552` (count-parity assertion shape) | exact                                                                         |
| `scripts/trigsweep-classify.mjs` (TRIGSWEEP-01 instrument; name at planner discretion)                                                                   | utility (script)         | batch                  | `scripts/probe-report-rls.mjs`                                                                                                  | role-match — script posture exact, SQL content from 96-RESEARCH Code Examples |

### Files to be MODIFIED

| Modified File                                                                                                                   | Role           | Data Flow        | Pattern Source                                                                                                                         | Match Quality                                      |
| ------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `frontend/src/domains/analytics/repositories/analytics.repository.ts`                                                           | repository     | request-response | itself + `frontend/src/lib/api-client.ts:13-16,64-82` (edge default)                                                                   | exact                                              |
| `frontend/src/pages/analytics/AnalyticsDashboardPage.tsx` (`:74-107` adapter)                                                   | page component | request-response | `QueryErrorState` family for per-widget honest-disable                                                                                 | exact                                              |
| `frontend/src/components/analytics/AnalyticsPreviewOverlay.tsx` + `sample-data.ts`                                              | component      | —                | delete-or-unreference (planner discretion, D-03/Derivation 6)                                                                          | n/a                                                |
| `frontend/src/hooks/useWidgetDashboard.ts` (`:281`, `:587-606`)                                                                 | hook           | CRUD             | in-file; column fix target verbatim in 96-RESEARCH §Code Examples                                                                      | exact                                              |
| `frontend/src/components/dashboard-widgets/KpiWidget.tsx`                                                                       | component      | transform        | truthful-absence pattern (Pattern 3, RESEARCH) — omit trend row on `trend: null`                                                       | exact                                              |
| `frontend/src/routes/_protected/calendar.tsx`                                                                                   | route (layout) | request-response | `frontend/src/routes/_protected/legislation.tsx`                                                                                       | **exact** — the P95 DEAD-08 Outlet fix, same class |
| `frontend/src/components/calendar/UnifiedCalendar.tsx` (`:124`, `:181-190`, `:149-155`)                                         | component      | request-response | in-file month-nav (`:87-91`) + `QueryErrorState` for the error path                                                                    | exact                                              |
| `frontend/src/pages/events/EventsPage.tsx` (`:40-55`, `:262-271`)                                                               | page component | request-response | `UnifiedCalendar.tsx:17,66,87-91` (date-fns month nav) + `getDay(monthStart)` padding                                                  | role-match                                         |
| `frontend/src/pages/word-assistant/WordAssistantPage.tsx` (`:57`, `:88`, `:127`, `:251-263`)                                    | page component | request-response | in-file `supabase.functions.invoke('word-assistant', …)` as the probe                                                                  | partial (see No Analog)                            |
| `frontend/src/pages/WorkBoard/WorkBoard.tsx` (`:83-89`, `:105-117`, `:244-247`)                                                 | page component | transform        | `KCard` overdue class/chip vocabulary (proven in `KCard.test.tsx:106-114,153-176,206-226`)                                             | exact                                              |
| `frontend/src/hooks/useUnifiedKanban.ts` (`:189`, `:224`, `:398-426`)                                                           | hook           | CRUD             | in-file — the dual-write at `:398-426` is the pattern the writer sweep propagates                                                      | exact                                              |
| `frontend/src/components/commitments/PersonalCommitmentsDashboard.tsx` (`:33-69`)                                               | component      | CRUD             | COUNT-01 filter-seam reconciliation (Derivation 5 table)                                                                               | exact (in-file)                                    |
| `tests/e2e/95-sandbox-error.spec.ts` (natural arm, same task as sandbox fix per D-12)                                           | test (e2e)     | request-response | itself — its own header (`:33-37`) anticipates exactly this update                                                                     | exact                                              |
| `supabase/functions/tasks-update/index.ts` (`:212`)                                                                             | edge function  | CRUD             | `useUnifiedKanban.ts:398-426` dual-write OR let `trg_sync_task_status` derive — planner decides per D-08 (no client re-implementation) | role-match                                         |
| `backend/src/services/tasks.service.ts` (`:371`)                                                                                | service        | CRUD             | same as above                                                                                                                          | role-match                                         |
| `supabase/functions/assignments-my-assignments/index.ts` (`:122`)                                                               | edge function  | CRUD             | same as above                                                                                                                          | role-match                                         |
| `frontend/src/i18n/{en,ar}/*.json` + `frontend/src/i18n/index.ts` (new keys: `wordAssistant.checking`, any COUNT-04 badge copy) | config (i18n)  | —                | `i18n/index.ts:29-30,287,423` registration triple                                                                                      | exact                                              |

## Pattern Assignments

### 1. The `tests/e2e/96-*.spec.ts` family (6 new specs) — copy `tests/e2e/95-sandbox-error.spec.ts`

This is the proven CDP-forced-error + natural-arm shape (itself cloned from
`93-tasks-queue-error.spec.ts`). Every new spec copies its four load-bearing pieces.

**Imports + inline auth** (lines 45-77) — no `setup` project dependency (D-18):

```typescript
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

/** Sign in inline; never echo either credential value. */
const signInInline = async (page: Page): Promise<void> => {
  if (email === '' || password === '') {
    throw new Error('TEST_USER_EMAIL / TEST_USER_PASSWORD missing from .env.test')
  }
  const login = new LoginPage(page)
  await login.goto()
  await login.signIn(email, password)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 })
}
```

**Narrowed CDP block + requestfailed instrument test** (lines 52, 85-98) — the 95-03 lesson:
a broad pattern blanks the SPA because the dev-server module URL carries the same substring.
For DEAD-06 the block targets `/rest/v1/<table>` (PostgREST reads), not `functions/v1`:

```typescript
/** Blocks the edge-function data request only — never the SPA document. */
const BLOCKED_EDGE_FN = '*/functions/v1/scenario-sandbox*'
// ...
const cdp = await page.context().newCDPSession(page)
await cdp.send('Network.enable')
await cdp.send('Network.setBlockedURLs', { urls: [BLOCKED_EDGE_FN] })

// INSTRUMENT TEST, not the oracle: record whether the block actually fired.
const blockedRequests: string[] = []
page.on('requestfailed', (request) => {
  if (request.url().includes('/functions/v1/scenario-sandbox')) {
    blockedRequests.push(request.failure()?.errorText ?? 'unknown')
  }
})
```

**DOM-only assertions with the error/loading discriminator** (lines 103-129):

```typescript
const errorState = panel.getByTestId('query-error-state')
await expect(errorState).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })
await expect(errorState.getByRole('button')).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })
await expect(panel.locator('.animate-spin')).toHaveCount(0)
await expect(errorState).toHaveAttribute('role', 'alert')

const bodyText = (await page.locator('body').innerText()) ?? ''
expect(bodyText).not.toMatch(INTERNAL_STRING)

expect(blockedRequests.length).toBeGreaterThan(0)
expect(blockedRequests[0]).toMatch(/inspector|blocked/i)
```

with the internal-string regex (line 65-66) copied verbatim:

```typescript
const INTERNAL_STRING =
  /(42501|42703|42P01|permission denied|supabase|FunctionsHttpError|FunctionsFetchError)/i
```

**Natural arm accepting BOTH truthful outcomes** (lines 132-162) — content or error, never a
spinner past the budget; `RETRY_BACKOFF_TIMEOUT = 15_000` documented as retry backoff, not
flake tolerance. The 96-count-agreement spec replaces the forced arm with a single-DOM-snapshot
same-clock comparison (condition 7 — capture all counts from one rendered DOM, or one SQL batch
per the Derivation 5 shape).

**Header discipline:** every 95-spec opens with `// @covers <REQ-ID> (criterion N)` plus an
oracle-population-definition comment block (lines 1-44). Copy this — the decision-coverage and
population-definition gates (D-15, D-21) read it.

**Run shape:** `pnpm exec playwright test tests/e2e/96-<name>.spec.ts --project=chromium-en --no-deps`
— spec existence asserted first, counts hardcoded, `--no-deps` mandatory including `--list` (D-17).

---

### 2. `supabase/migrations/<ts>_p96_scenario_rls_recursion.sql` — copy `20260816500001_p94_report_rls_recursion.sql` exactly

The analog is the identical defect class, fixed 24h ago on the same staging DB. Adapt names:
`custom_reports → scenarios`, `report_shares → scenario_collaborators`,
`is_report_owner → is_scenario_owner`. Break the **collaborators** side only (Pitfall 1);
`scenarios_select_own_or_collaborated` is untouched.

**SECURITY DEFINER helper** (lines 29-46):

```sql
CREATE OR REPLACE FUNCTION public.is_report_owner(p_report_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT cr.created_by = auth.uid()
  FROM public.custom_reports cr
  WHERE cr.id = p_report_id
$$;

COMMENT ON FUNCTION public.is_report_owner(uuid) IS
  'P94/WRITE-06: owner check for one custom_reports row, ... SECURITY DEFINER with a pinned empty '
  'search_path; returns a boolean only, never row data. Scope must stay a single-row owner check.';

GRANT EXECUTE ON FUNCTION public.is_report_owner(uuid) TO authenticated;
```

**Policy re-creation with was-comments** (lines 52-63) — each policy carries a `-- was:` comment
quoting the live qual it replaces, then substitutes ONLY the EXISTS clause:

```sql
-- was: shared_with = auth.uid() OR shared_by = auth.uid()
--      OR EXISTS (SELECT 1 FROM custom_reports ...)
DROP POLICY IF EXISTS "Users can view shares for their reports" ON public.report_shares;
CREATE POLICY "Users can view shares for their reports" ON public.report_shares
  FOR SELECT
  USING (
    shared_with = auth.uid()
    OR shared_by = auth.uid()
    OR public.is_report_owner(report_id)
  );
```

Note: the P94 sandbox cycle has **three** collaborator policies over `scenarios` (SELECT +
INSERT/UPDATE/DELETE also EXISTS-over-scenarios per Derivation 0) — mirror the analog's
three-policy sweep, re-deriving live quals from `pg_policy` at execution time first (the analog's
header records exactly this discipline: "re-derived live ... at execution time — the research
copy is evidence, not a substitute").

**Header comment pattern** (lines 1-27): cause statement with live derivation date, cycle
diagram, fix rationale, row-set-unchanged-by-construction claim, and the named two-sided proof
script. Copy this structure.

---

### 3. `supabase/migrations/<ts>_p96_commitment_overdue_insert_gap.sql` — trigger re-timing

No exact in-repo analog for a trigger re-timing; conventions come from the P94 migration
(header discipline, schema-qualified references) and `supabase/CLAUDE.md` (idempotent DDL,
timestamped name). Shape:

```sql
-- Re-derive live first (the analog's discipline): full prosrc of check_commitment_overdue()
-- pulled at execution time; A1 (96-RESEARCH Assumptions) requires confirming no OLD reference.
DROP TRIGGER IF EXISTS commitment_overdue_check ON public.aa_commitments;
CREATE TRIGGER commitment_overdue_check
  BEFORE INSERT OR UPDATE ON public.aa_commitments
  FOR EACH ROW EXECUTE FUNCTION public.check_commitment_overdue();
```

Trigger name stays `commitment_overdue_check` — the alphabetical fire order before
`commitment_status_audit` is load-bearing (D-08). Whether the 2 existing past-due `pending`
rows are migrated by UPDATE or left to next touch is stated in the migration header either way
(Pitfall 3). Apply via `mcp__supabase__apply_migration` only.

For any RPC body change (`get_commitment_fulfillment` overdue bucket — mandatory with DEAD-05
Branch A per Derivation 2 row 6; `get_unified_work_kanban` Done semantics if the filter branch
is chosen): `CREATE OR REPLACE FUNCTION ... SECURITY DEFINER` + `GRANT EXECUTE ... TO
authenticated`, the shape used throughout `20260330000001_operations_hub_rpcs.sql`
(`:275` `get_dashboard_stats`, `:285` `SECURITY DEFINER`, `:350-351` GRANTs).

---

### 4. `frontend/src/pages/WorkBoard/__tests__/stage-status-parity.test.ts` — copy the KCard/WorkBoard test harness

**Vitest harness** from `KCard.test.tsx` (lines 15-39): `.test.ts` suffix (Vitest, jsdom config
excludes `*.spec.*`), colocated in `__tests__/`, minimal `vi.mock('react-i18next', …)` only if a
component renders (the parity test itself is pure data — no render needed):

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
```

**The assertion shape** — `WorkBoard.test.tsx:546-552` is the existing count-parity anchor
(extend, don't duplicate — 96-RESEARCH names it):

```typescript
it('overdue count equals visibleItems.filter(i => i.is_overdue).length', async () => {
  mockUseUnifiedKanban.mockReturnValue({ items: makeBoardItems(), isLoading: false })
  const { WorkBoard } = await importFresh()
  render(<WorkBoard />)
  expect(screen.getByTestId('toolbar').getAttribute('data-overdue')).toBe('2')
})
```

The parity test hardcodes the five pairs (todo→pending, in_progress→in_progress, review→review,
done→completed, cancelled→cancelled — Derivation 3) against the exported `STAGE_TO_STATUS`
(`WorkBoard.tsx:83-89`; export it if not already exported). The DB half of the parity oracle
(live `prosrc` CASE comparison) runs as a recorded SQL derivation, not inside Vitest.

**Item factory pattern** from `KCard.test.tsx:56-84` if WorkItem fixtures are needed:

```typescript
const baseItem: WorkItem = { id: 'wi-1', source: 'task' /* … */ }
function makeItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return { ...baseItem, ...overrides } as WorkItem
}
```

Heavier mocks (router, `useUnifiedKanban`, kanban primitive) are in
`WorkBoard.test.tsx:19-118` if the test must render WorkBoard — note its warning at `:90-95`:
mock `@/components/work-creation` at the barrel or the real provider drags in `@/i18n`.

---

### 5. `frontend/src/domains/analytics/repositories/analytics.repository.ts` — the repoint

Current state (whole file, 25 lines) — the D-01 comment is load-bearing and stays true:

```typescript
/**
 * These are thin wrappers over apiGet on purpose (D-01): apiGet throws ApiError on a non-OK
 * response, so a rejection reaches TanStack Query's isError branch and the page renders the
 * shared error state. A catch that returned a plausible success value here is what made those
 * isError branches dead code.
 */
import { apiGet } from '@/lib/api-client'

export async function getAnalyticsDashboard(params: URLSearchParams): Promise<unknown> {
  return apiGet(`/analytics-dashboard?${params.toString()}`, { baseUrl: 'express' })
}
```

The fix: drop `{ baseUrl: 'express' }` — `api-client.ts:13-16` defaults to `'edge'` and
`:80-81` resolves it to `${VITE_SUPABASE_URL}/functions/v1${path}`:

```typescript
export interface ApiClientOptions {
  /** Which backend to target (default: 'edge') */
  baseUrl?: 'edge' | 'express'
}
// ...
const edgeBase = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'
return `${edgeBase}${path}`
```

The deployed fn serves ONE endpoint per call (`?endpoint=summary|engagements|relationships|
commitments|workload`, payloads `{success: true, data: {…}}`) — the repository grows to five
typed getters (or one parameterized getter), and `AnalyticsDashboardPage.tsx:74-107`'s
single-object adapter becomes 5 parallel `useQuery` calls or a repository aggregator (planner
discretion, Derivation 6). Per `frontend/CLAUDE.md` domain layout: repository stays the only
network layer; hooks call it in `queryFn`; keys go through the domain key factory. This
repository throws by design (D-01) — keep that shape; do NOT convert to result unions mid-API.

Server-sent hex colors (`#10B981`) map to chart-palette carve-out tokens, never adopted
(anti-pattern list). `AnalyticsPreviewOverlay` + `generateSample*` stop rendering on the route;
the oracle is DOM-absence of the sample/preview strings.

---

### 6. `frontend/src/routes/_protected/calendar.tsx` — copy `legislation.tsx` (the P95 DEAD-08 fix)

The whole analog file (43 lines) is the template — a route that used to render its body directly
converted to a layout so the child (`calendar/new.tsx`) can mount:

```typescript
/**
 * Legislation LAYOUT
 * Phase 95 DEAD-08: this file used to render the list body directly and had no
 * <Outlet/>, so `legislation/$id.tsx` was registered but never reachable in
 * render. It is now a layout; the list body lives in `legislation/index.tsx`.
 * `validateSearch` stays HERE (on the layout) so deep links keep validating for
 * the whole subtree; the index child reads the validated search via `getRouteApi`.
 */
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/legislation')({
  component: () => <Outlet />,
  validateSearch: (search: Record<string, unknown>): LegislationSearchParams => ({ /* … */ }),
})
```

Two valid shapes: (a) full layout conversion with a new `calendar/index.tsx` holding
CalendarPage (the analog's shape), or (b) `<Outlet/>` appended inside CalendarPage if the parent
should keep rendering above the child. `routeTree.gen.ts` is generated — never hand-edit.

---

### 7. Calendar family renders — in-file patterns

**`UnifiedCalendar.tsx`** already has the month-nav pattern `/events` needs (`:17`, `:87-91`):

```typescript
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
// :87-91
setCurrentMonth(subMonths(currentMonth, 1))
setCurrentMonth(addMonths(currentMonth, 1))
```

Its own fix: `:124` `isCalendarEmpty = events.length === 0` must stop replacing the grid
(`:181-190`); the grid always renders. The bare error Card at `:149-155` (`text-destructive`)
is replaced by the shared `QueryErrorState` (Shared Patterns below).

**`EventsPage.tsx`** (`:40-42`) renders `eachDayOfInterval({start: monthStart, end: monthEnd})`
straight into `grid-cols-7` — pad with `getDay(monthStart)` leading cells (RTL-mirrored,
`icon-flip` on chevrons), and copy the `addMonths`/`subMonths` state pattern from
UnifiedCalendar above. Keep reading the `event_details` VIEW (its `start_datetime` column is
real there — `:268`); do NOT consolidate `calendar_events` into `calendar_entries`.

**`WordAssistantPage.tsx`**: the probe is the file's own existing invoke (pinned `:251-263`) —
`supabase.functions.invoke('word-assistant', { body: { action: 'check_grammar', text: 'health check' } })`
— run on mount regardless of mode; replace `useState(true)` at `:57` with a three-state pill
(initial `checking`, settle from the probe result only; `wordAssistant.checking` key NEW in both
locales).

---

### 8. Count surfaces (COUNT-01/03/04) — in-file seams + the dual-write pattern

**Overdue badge on WorkBoard cards:** `KCard` already carries the overdue vocabulary — root
`<article>` gets `overdue` class, chip renders `card.overdueBy` copy with Latin digits in both
locales (proven at `KCard.test.tsx:106-114`, `:170-176`). Any new badge/chip follows the
existing chip classes (`chip`, `chip-danger`, `chip-warn` — `:206-226`) and Linear tokens; the
badge and the toolbar chip (`WorkBoard.tsx:244-247`) derive from ONE signal (D-16 same-clock:
chip count == badged-card count in one DOM snapshot).

**Writer sweep (COUNT-03):** the benign reference pattern is `useUnifiedKanban.ts:398-426` —
the drag path writes BOTH `status` AND `workflow_stage`, so the DB trigger derives the same
value (the D-82 parity point). The three flagged status-direct writers
(`supabase/functions/tasks-update/index.ts:212`, `backend/src/services/tasks.service.ts:371`,
`supabase/functions/assignments-my-assignments/index.ts:122`) either adopt the dual-write or
route stage through the trigger — but NEVER a client-side re-implementation of the trigger's
mapping (forbidden shape, condition 8).

**COUNT-01 filter seams:** the five mechanisms and their exact filters are enumerated in
96-RESEARCH Derivation 5's table — that table IS the pattern source for
`PersonalCommitmentsDashboard.tsx:33-69` (its `active` filter excludes stored `overdue` — the
seam to reconcile) and `useUnifiedKanban.ts:189,224`. The same-clock SQL oracle shape:

```sql
SELECT (SELECT count(*) FROM unified_work_items WHERE assigned_to = $1
         AND status NOT IN ('completed','cancelled','closed','converted')) AS my_work_active,
       (SELECT total_active FROM user_work_summary WHERE user_id = $1)      AS summary_active;
```

---

### 9. `scripts/trigsweep-classify.mjs` — copy the `probe-report-rls.mjs` script posture

The analog (330 lines) defines the house script shape: header contract, env loading, labelled
exit codes, no-secret rule. Copy lines 1-67's structure:

```javascript
#!/usr/bin/env node
// Phase 94 / WRITE-06 — the D-22 TWO-SIDED report-RLS oracle.
// Exit codes:  0 every assertion held and cleanup verified
//              1 an assertion failed (pre-migration this is the 42P17 RED)
//              2 UNABLE TO MEASURE — credentials absent (GATE-STANDARD C2: not a red)

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// process.env wins; .env.test is the fallback (it is gitignored and holds the staging keys).
const loadEnvFile = (path) => {
  /* …tiny parser, lines 37-46… */
}
const env = (k) => process.env[k] ?? fileEnv[k] ?? ''
// missing-credential check → exit 2 with "UNABLE TO MEASURE — …" (lines 55-67)
```

Key postures to preserve: exit 2 is a labelled state, never a silent pass (watchers fail
closed); every id acted on is PRINTED; cleanup in `finally`; never echo a key/JWT. The SQL
content is the behaviour-classifier from 96-RESEARCH §Code Examples (union of all four known
forms + `RESIDUAL — hand-classify`); the residual list is part of the deliverable. The
both-direction control (synthetic writer caught / synthetic non-writer not) is execution-leg
DDL via MCP in a migration-created-and-dropped pair. The script writes a disk artifact with a
terminal marker (D-20).

The two-sided scenario-RLS proof for the sandbox migration mirrors this same analog even more
directly (A sees own+collaborated, collaborator sees theirs, stranger sees none — the P94
protocol named in the migration header).

## Shared Patterns

### Error/empty states — `QueryErrorState` (apply to: UnifiedCalendar error path, analytics per-widget honest-disable, any new failure surface)

**Source:** `frontend/src/components/error-states/QueryErrorState.tsx`

Props contract (lines 47-60): `variant: 'page' | 'inline'`, `onRetry` (wire to TanStack
`refetch`), `isRetrying`, optional bilingual envelope `{ message_en, message_ar }` — the ONE
structured server shape allowed to reach JSX. Page variant (lines 100-128):

```tsx
<div
  role="alert"
  data-testid={testId ?? 'query-error-state'}
  className={cn(
    'mx-auto flex max-w-md flex-col items-center justify-center text-center py-12 px-4',
    className,
  )}
>
  <div className="flex size-16 items-center justify-center rounded-full bg-danger/10 mb-4">
    <AlertCircle className="size-8 text-danger" />
  </div>
  <h3 className="[font-size:var(--t-card-title)] font-semibold text-ink mb-2">
    {t('errors.queryFailed.title')}
  </h3>
  {/* … */}
  <button
    type="button"
    onClick={onRetry}
    disabled={isRetrying}
    aria-disabled={isRetrying}
    className="btn-primary inline-flex items-center justify-center h-10 px-4 sm:px-6"
  >
    {t('errors.retry')}
  </button>
</div>
```

Rules baked into its header (lines 18-27): i18n keys only, single-argument `t()` (an English
default as second arg renders English in Arabic), `error.message`/`code` never reach JSX,
AlertCircle is the danger icon (AlertTriangle reserved for degraded/`role="status"`). The
`data-testid="query-error-state"` + `role="alert"` pair is the cross-plan contract every 96
spec asserts.

### i18n — both locales, same commit (apply to: `wordAssistant.checking`, any badge/pill copy)

**Source:** `frontend/src/i18n/index.ts:29-30, 287, 423` — the registration triple:

```typescript
import enUnifiedKanban from './en/unified-kanban.json' // :29
import arUnifiedKanban from './ar/unified-kanban.json' // :30
// resources.en → :287  'unified-kanban': enUnifiedKanban,
// resources.ar → :423  'unified-kanban': arUnifiedKanban,
```

Static bundle only (`public/locales` is DEAD); colon-form addressing
(`t('unified-kanban:filters.source')` — dot-form leaks the raw key); an unregistered namespace
silently falls back to English in BOTH languages. `pnpm lint` runs
`scripts/check-i18n-namespaces.mjs`.

### Design tokens (apply to: overdue badge, status pill, calendar chrome, chart colors)

Linear dark tokens only — `text-danger`/`bg-danger/10` (see QueryErrorState above), chip
classes from KCard, `var(--row-h)` rows, logical properties (`ms-*`/`ps-*`/`text-start`),
`icon-flip`/`rotate-180` for RTL chevrons. Chart palettes use the ESLint carve-out tokens;
server hex is never adopted. Read `frontend/DESIGN.md` then
`frontend/src/design-system/CLAUDE.md` before any UI edit (house rule).

### Inherited instruments (apply to: every plan — consume, never reinvent)

`scripts/probe-edge-auth.sh` (deploy evidence, `404-kind: gateway|function`),
`scripts/c9b-sweep.sh` (the ONLY C9b entry point), `scripts/gate-drill.mjs`,
`scripts/decision-coverage.mjs`. All derivation SQL runs through the Supabase MCP against
staging `zkrcjzdemdmwhearhfgg`; migrations via `apply_migration` only.

## No Analog Found

| File / concern                                                 | Role            | Data Flow        | Reason                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------------------------- | --------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WordAssistantPage.tsx` three-state connection pill            | component state | request-response | No existing live-probe status pill in the codebase (the current badge inits `true` and never probes — that IS the defect). Compose from: the in-file `functions.invoke` POST as the probe, UI-SPEC's three-state spec (`checking` → settle), and QueryErrorState's token vocabulary for the disconnected state. |
| TRIGSWEEP both-direction control drill (synthetic trigger DDL) | test (DB)       | batch            | First instrument of its class; no prior migration creates-and-drops synthetic triggers. The script posture comes from `probe-report-rls.mjs` (fixtures namespaced, cleanup in `finally`, printed ids); the DDL pair is new content prescribed in 96-RESEARCH Derivation 1(c).                                   |

Both are prescribed in detail by 96-RESEARCH — the planner uses those prescriptions, not a
codebase analog.

## Metadata

**Analog search scope:** `tests/e2e/` (95-family), `supabase/migrations/`,
`frontend/src/components/{error-states,analytics,calendar,commitments,dashboard-widgets}/`,
`frontend/src/pages/{WorkBoard,analytics,events,word-assistant}/`, `frontend/src/domains/`,
`frontend/src/hooks/`, `frontend/src/routes/_protected/`, `frontend/src/lib/`,
`frontend/src/i18n/`, `scripts/`
**Files read in full:** `95-sandbox-error.spec.ts`, `20260816500001_p94_report_rls_recursion.sql`,
`analytics.repository.ts`, `legislation.tsx`, `QueryErrorState.tsx`, `KCard.test.tsx`
**Files read targeted:** `api-client.ts:1-110`, `probe-report-rls.mjs:1-80`,
`WorkBoard.test.tsx:15-119,536-567`, grep pins for `UnifiedCalendar.tsx`/`EventsPage.tsx`/
`operations_hub_rpcs.sql`/`i18n/index.ts`
**Instrument note:** repo `grep` is a ugrep wrapper honouring `.gitignore` — all sweeps above
used `command grep` or explicit paths; existence of all 17 modify-targets verified by `[ -f ]`.
**Pattern extraction date:** 2026-08-17

PATTERNS-END
