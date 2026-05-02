---
phase: 42-remaining-pages
plan: 08
subsystem: activity-page
tags:
  - phase-42
  - activity
  - page-reskin
  - wave-1
  - tdd
  - r-05
requirements:
  - PAGE-04
dependencies:
  requires:
    - 42-00 (Wave 0 — Icon, i18n events.*, .act-* CSS, Playwright scaffold)
    - 42-02 (Wave 0 — i18n activity-feed.events.*)
    - 42-03 (Wave 0 — .act-list/.act-row/.act-t/.act-where in index.css)
    - 42-04 (Wave 0 — Playwright scaffold + phase-42-fixtures)
  provides:
    - ActivityList component (handoff .act-list 3-col grid)
    - 6-glyph icon map per action_type with R-05 open-redirect-safe row click
  affects:
    - frontend/src/pages/activity/ActivityPage.tsx (rewrite)
    - frontend/tests/e2e/activity-page.spec.ts (un-skipped functional cases)
tech-stack:
  added: []
  patterns:
    - i18n <Trans> components slots for grammatical RTL inversion (D-14)
    - R-05 open-redirect guard via `startsWith('/') && !startsWith('//')`
    - data-loading section attribute for Phase 42 Playwright determinism
key-files:
  created:
    - frontend/src/components/activity-feed/ActivityList.tsx
    - frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx
  modified:
    - frontend/src/pages/activity/ActivityPage.tsx
    - frontend/tests/e2e/activity-page.spec.ts
decisions:
  - 'D-13 honored: All / Following tabs preserved; Statistics + Settings stripped'
  - 'D-14 honored: i18n templates own the verb/object/where ordering for RTL'
  - 'D-17 honored: logical properties only (ms-*, dir, no left/right)'
  - 'D-20 honored: bilingual digits via toArDigits on .act-t mono column'
  - 'R-05 open-redirect guard: only relative `/...` (single-leading-slash) URLs make a row interactive — protocol-relative `//evil` rejected'
metrics:
  duration_minutes: 35
  tasks_completed: 2
  tests_added: 7
  tests_passing: 7
  commits: 4
  completed: 2026-05-02
---

# Phase 42 Plan 08: Activity Page Reskin Summary

Reskinned the `/activity` page onto the IntelDossier handoff `.act-list`
3-col grid timeline. Built a new `<ActivityList>` presentation component
that renders `time · icon · "who action <strong>{entity}</strong> in
<span class="act-where">{where}</span>"` per row, wired through the
existing `useActivityFeed` hook, and stripped the legacy collapsible
statistics panel + settings sheet. The plan's R-05 open-redirect guard
was implemented with a stricter `startsWith('/') && !startsWith('//')`
check (deviation note below) and asserted by Test 7. Both functional
Playwright cases were un-skipped.

## Deliverables

### New: `frontend/src/components/activity-feed/ActivityList.tsx`

- `<ul class="act-list">` with one `<li class="act-row">` per activity.
- `iconForAction()` maps the 15-value `ActivityActionType` union plus
  unknown strings to one of 6 stroked glyphs from the Wave 0 `<Icon>`
  component:

  | action_type                                    | glyph |
  |------------------------------------------------|-------|
  | `approval`                                     | check |
  | `rejection`, `delete`                          | alert |
  | `comment`, `mention`                           | chat  |
  | `create`                                       | plus  |
  | `upload`, `download`                           | file  |
  | `share`                                        | link  |
  | `update`, `status_change`, `view`, `assign`,   |       |
  | `archive`, `restore`, default                  | dot   |

- Sentence rendered via `<Trans i18nKey="events.${action_type}"
  components={{ entity: <strong/>, where: <span class="act-where"/> }}>`
  so RTL grammatical inversion lives in the i18n templates (D-14).
- `.act-where` color owned by `frontend/src/index.css:838-840`
  (`var(--accent-ink)`) — not inline.
- Bilingual digits on the `.act-t` mono column via `toArDigits()`.
- R-05 open-redirect guard inline:
  `safeNavUrl = navUrl.startsWith('/') && !navUrl.startsWith('//') ? navUrl : null`.
  Non-interactive rows have **no** `role`, `tabIndex`, `onClick`, or
  `onKeyDown` — fully inert, not just a no-op handler.

### New: `frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx`

7 vitest cases covering the 7 behaviours from the plan:

| # | Behaviour                                                              | Status |
|---|------------------------------------------------------------------------|--------|
| 1 | `<ul.act-list>` with one `<li.act-row>` per activity                   | PASS   |
| 2 | Row child order: `.act-t` → `<svg>` (Icon) → sentence `<span>`         | PASS   |
| 3 | Icon mapping for 8 action_types (approval/rejection/comment/create/upload/share/update/view) | PASS |
| 4 | `.act-where` element renders inside the sentence                       | PASS   |
| 5 | AR locale converts time digits via `toArDigits` (5m → ٥د)              | PASS   |
| 6 | R-05 row click: relative path is interactive; absent metadata is not   | PASS   |
| 7 | R-05 open-redirect guard: external/protocol-relative/javascript:/empty rejected | PASS |

The file overrides the global `react-i18next` mock from
`tests/setup.ts` (which renders `<Trans>` as `({ children }) =>
children`, discarding our `components` slots) with a local mock that
emits the configured `entity` / `where` slot components so `.act-where`
is observable in the DOM.

### Modified: `frontend/src/pages/activity/ActivityPage.tsx`

Rewritten on top of `<ActivityList>`:

- Section root emits `data-loading={isLoading ? 'true' : 'false'}` for
  the Phase 42 Playwright `gotoPhase42Page` helper.
- All / Following tabs preserved (D-13). Tab state feeds
  `useActivityFeed({ followed_only })`.
- Empty / loading skeleton / error states wired with token-bound colors
  (`var(--ink-mute)`, `var(--line-soft)`, `var(--danger)`).
- Stripped: `<ActivityStatistics>` collapsible, `<ActivitySettingsSheet>`
  trigger, refresh button, lucide icons. Settings → Notifications owns
  preferences (out of scope for 42-08).
- 137 LOC → 86 LOC.

### Modified: `frontend/tests/e2e/activity-page.spec.ts`

Un-skipped the 2 functional cases:

- `renders .act-list with 3-col grid rows` — asserts `ul.act-list`
  visible and the first `li.act-row` has `display: grid`.
- `tabs swap All/Following` — asserts `aria-selected="true"` after
  clicking the Following tab.

The visual spec lives in `activity-page-visual.spec.ts` (separate file)
and stays governed by its own plan.

## Commits

| Hash       | Message                                                                  |
|------------|--------------------------------------------------------------------------|
| `4ac544c1` | test(42-08): add failing tests for ActivityList — RED                    |
| `f98e2cb0` | feat(42-08): implement ActivityList — GREEN                              |
| `f2f959f9` | feat(42-08): rewrite ActivityPage on .act-list + un-skip Playwright spec |
| `0560f9c0` | chore(42-08): drop literal 'EnhancedActivityFeed' from ActivityPage docstring |

## Verification — gate matrix

| Gate                                                              | Result |
|-------------------------------------------------------------------|--------|
| `grep -c "act-list" ActivityList.tsx` ≥ 1                         | 2      |
| `! grep -q "event_type" ActivityList.tsx`                         | PASS   |
| `grep -c "iconForAction" ActivityList.tsx` ≥ 1                    | 2      |
| `grep -c "act-where" ActivityList.tsx` ≥ 1                        | 3      |
| `grep -c "startsWith('/')" ActivityList.tsx` ≥ 1                  | 2      |
| `! grep -q "EnhancedActivityFeed" ActivityPage.tsx`               | PASS   |
| `pnpm test --run ActivityList` → 7/7 PASS                         | PASS   |
| `! grep -q "test.skip" activity-page.spec.ts`                     | PASS   |

`pnpm type-check` is clean for the two new files plus the rewritten
page; the long pre-existing error list in unrelated files (audit-logs,
availability-polling, analytics, etc.) is out of scope (Karpathy
Rule 3).

## Deviations from Plan

### 1. [Rule 1 — Bug fix, security] R-05 guard tightened to also reject `//evil`

- **Found during:** Task 1, Test 7 RED→GREEN transition.
- **Issue:** The plan's recommended guard
  `safeNavUrl = navUrl.startsWith('/') ? navUrl : null` is unsafe.
  `'//evil.example'.startsWith('/')` returns **true** (the leading `/`
  matches), so a protocol-relative URL would have flowed through as an
  in-app path and the click would have navigated to
  `https://evil.example` (browsers resolve `//evil` against the current
  scheme). Test 7 caught this on the first GREEN run and forced the fix.
- **Fix:** Tightened the guard to
  `navUrl.startsWith('/') && !navUrl.startsWith('//')` so single-leading-
  slash relative paths pass while protocol-relative URLs are rejected.
- **Files modified:** `frontend/src/components/activity-feed/ActivityList.tsx`
- **Threat model impact:** Strengthens `T-42-08-OPENREDIRECT-1` mitigation.
  Test 7 explicitly covers the `'//evil.example'` case alongside `https:`,
  `javascript:`, and `''`.
- **Commit:** `f98e2cb0` (folded into the GREEN commit, since the bug
  was caught before any commit hash existed for the unsafe variant).

### 2. [Rule 3 — adapt to existing API] `useActivityFeed` return shape

- **Found during:** Task 2 read-first.
- **Issue:** The plan's pseudocode reads from
  `feed.data.pages.flatMap(p => p.activities)`, but the actual hook
  signature in `frontend/src/hooks/useActivityFeed.ts` returns
  `{ activities, isLoading, error, ... }` — the flattening already
  happens inside the hook.
- **Fix:** Page consumes `{ activities, isLoading, error } = useActivityFeed(...)`.
  Behavior identical; no code path lost.
- **Files modified:** `frontend/src/pages/activity/ActivityPage.tsx`

### 3. [Rule 3 — adapt to existing API] TanStack Router `navigate({ to })` not `{ href }`

- **Found during:** Task 1 read-first.
- **Issue:** The plan's pseudocode used `useNavigate({ href })`, but the
  TanStack Router v1 `useNavigate()` API in this codebase consistently
  uses `navigate({ to: '/path' })` (cf. `IntakeForm.tsx`,
  `ActivityTimelineItem.tsx`, etc.).
- **Fix:** Used `navigate({ to: safeNavUrl })`. Same security guarantee
  (the guard is on `safeNavUrl`, not on the call shape).

### 4. [Rule 3 — adapt to existing API] No `@testing-library/jest-dom`

- **Found during:** Task 1 GREEN run.
- **Issue:** `expect(...).toHaveAttribute()` and `.toHaveClass()` matchers
  are not available — the project does not depend on
  `@testing-library/jest-dom`.
- **Fix:** Rewrote the affected assertions to use plain DOM methods
  (`hasAttribute`, `getAttribute`, `classList.contains`).
- **Files modified:** `ActivityList.test.tsx` (test-only).

## Threat Surface — confirmation

| Threat ID                | Disposition | Status                                                                                                                                                |
|--------------------------|-------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| `T-42-08-XSS-1`          | mitigate    | i18next `<Trans>` escapes `{{variable}}` interpolations; `<entity>` / `<where>` slots map to React components, not raw HTML. No `dangerouslySetInnerHTML`. |
| `T-42-08-OPENREDIRECT-1` | mitigate    | Inline guard `startsWith('/') && !startsWith('//')` rejects all absolute, protocol-relative, javascript:/data:/mailto:, and empty URLs. Test 7 covers the rejection path. |
| `T-42-08-AUTHZ-1`        | accept      | `useActivityFeed({ followed_only: true })` is enforced server-side via `activity-feed` edge function; client cannot bypass to read others' followed entities. |

No new threat surface introduced beyond what the plan analyzed.

## Known Stubs

None. All states (loading / error / empty / populated) are wired to
real data from `useActivityFeed`.

## Self-Check: PASSED

- `frontend/src/components/activity-feed/ActivityList.tsx` — FOUND
- `frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx` — FOUND
- `frontend/src/pages/activity/ActivityPage.tsx` — FOUND (modified)
- `frontend/tests/e2e/activity-page.spec.ts` — FOUND (modified, un-skipped)
- Commit `4ac544c1` (RED) — FOUND in git log
- Commit `f98e2cb0` (GREEN) — FOUND in git log
- Commit `f2f959f9` (page rewrite + un-skip) — FOUND in git log
- Commit `0560f9c0` (docstring cleanup for grep gate) — FOUND in git log
- 7/7 vitest tests PASS
