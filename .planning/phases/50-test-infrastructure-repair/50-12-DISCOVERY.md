# Plan 50-12 Discovery

Captured: 2026-05-14T14:19:20+03:00

Command:

```bash
pnpm --filter intake-frontend exec vitest --run --reporter=default 2>&1 | tee /tmp/phase50-12-discovery.log
```

Default runner result:

- Test files: 20 failed, 134 passed, 4 skipped (158 total).
- Tests: 181 failed, 1149 passed, 25 todo (1355 total).
- Plan 50-12 in-scope failing files: 7 (within <=8 ceiling).

## PCH-50R-01 Setup Key Gate

`frontend/tests/setup.ts` already contains the Plan 50-10-owned keys consumed by this plan:

- `forums:pageTitle`
- `forums:pageSubtitle`
- `monitoring.headings.dashboard`
- `monitoring.headings.health`
- `monitoring.headings.alerts`

Plan 50-12 must not edit `frontend/tests/setup.ts`.

## In-Scope File State

| File                                                                               |               Result | First failure signature                                                                                                                                       |
| ---------------------------------------------------------------------------------- | -------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/tests/unit/design-system/buildTokens.test.ts`                            | 1 failed / 98 passed | `--sla-bad` light branch expects `oklch(54% 0.2 25)` but current canonical output is `oklch(46% 0.18 25)`.                                                    |
| `frontend/tests/unit/design-system/fouc-bootstrap.test.ts`                         |  9 failed / 1 passed | Bootstrap palette scrape regex cannot parse compact `light:{...}` objects that include `inkMute`, `inkFaint`, and other fields between `ink` and `line`.      |
| `frontend/tests/unit/components/ui/heroui-wrappers.test.tsx`                       |  2 failed / 9 passed | Button test expects old `bg-destructive`; chip test expects `data-slot="chip"` while wrapper now emits `data-slot="badge"`.                                   |
| `frontend/tests/unit/hooks/responsive.test.ts`                                     | 15 failed / 0 passed | Test imports old exports and old return-field names; current hook exposes `alias`, `up`, `down`, `between`, and `containerQueries`.                           |
| `frontend/src/pages/Dashboard/widgets/__tests__/KpiStrip.test.tsx`                 |  2 failed / 3 passed | Test expects bare values and `dir` on `data-testid="kpi-value"`; current component renders design-fixture deltas and wraps the numeral child in `LtrIsolate`. |
| `frontend/src/routes/_protected/dossiers/forums/__tests__/ForumsListPage.test.tsx` |  4 failed / 0 passed | Per-file `react-i18next` mock maps old `forums:title` / `forums:subtitle` keys while implementation uses `forums:pageTitle` / `forums:pageSubtitle`.          |
| `frontend/tests/unit/monitoring.dashboard.test.tsx`                                |  1 failed / 0 passed | `/Health/i` text query matches the `Health` heading plus loaded `healthy` content.                                                                            |

## D-09 Dispositions

- buildTokens.test.ts: TEST WRONG - `git log -p --follow frontend/src/design-system/tokens/buildTokens.ts` shows `fix(41-09): darken light-mode --sla-bad token for WCAG AA contrast`, changing the canonical light value from `oklch(54% 0.2 25)` to `oklch(46% 0.18 25)`.
- fouc-bootstrap.test.ts: Case II - `bootstrap.js` still byte-matches `directions.ts` for the checked palette values, but the test regex is too strict for the compact object shape and for the Phase 42 `--accent-fg` value.
- heroui-wrappers.test.tsx: TEST WRONG - wrappers use semantic class aliases (`btn-danger`, `chip-danger`) and `data-slot="badge"` per the current wrapper implementation; no literal color utility drift found.
- responsive.test.ts: TEST WRONG - the source hook did not expose `useBreakpoint`, `useMediaQuery`, or `BREAKPOINTS` before the camelCase rename; the test was only path-migrated in 50-01 and still asserts an older API.
- KpiStrip.test.tsx: TEST WRONG - `KpiStrip.tsx` intentionally renders Phase 41 design-fixture deltas and keeps the numeral child inside `LtrIsolate`.
- ForumsListPage.test.tsx: TEST WRONG - the implementation calls `t('forums:pageTitle')` / `t('forums:pageSubtitle')`; the per-file mock must track those keys because it overrides the global setup map.
- monitoring.dashboard.test.tsx: TEST WRONG - headings render correctly; the test query is ambiguous after async health data loads.

## Ceiling Decision

Proceed. The owned failing-file count is 7, below the <=8 Plan 50-12 ceiling.
