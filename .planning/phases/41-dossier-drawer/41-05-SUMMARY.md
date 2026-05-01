---
phase: 41
plan: 05
subsystem: dossier-drawer
tags: [drawer, commitments, wave-1, work-items, severity, route-nav, rtl-digits]
requires:
  - frontend/src/components/dossier/DossierDrawer/OpenCommitmentsSection.tsx (Wave 0 stub from 41-01)
  - frontend/src/types/dossier-overview.types.ts (DossierWorkItem, DossierOverviewResponse — note: type is DossierWorkItem, plan template said WorkItem)
  - frontend/src/lib/i18n/toArDigits.ts (Western → Arabic-Indic digit transform)
  - frontend/src/components/ui/ltr-isolate.tsx (forces dir="ltr" for mono chunks inside RTL row)
  - i18n keys section.open_commitments + empty.open_commitments (already shipped in 41-01)
  - date-fns differenceInCalendarDays
provides:
  - OpenCommitmentsSection — overdue-item 4-column row (severity dot + title + days + owner) wired to overview.work_items.by_source.commitments
  - severityColor mapping (urgent/high → danger, medium → warn, low/other → ink-faint)
  - ownerInitials helper (first letter of up to two whitespace-split words, upper-cased)
  - daysLabel helper (T-N past / T+N future / '—' missing or invalid)
  - Row click → navigate({ to: '/commitments', search: { id } }) — replaces D-08 dialog expectation per RESEARCH §4
affects:
  - frontend/src/components/dossier/DossierDrawer/OpenCommitmentsSection.tsx (Wave 0 stub body replaced)
tech-stack:
  added: [] # No new deps. date-fns + react-i18next + tanstack-router already present.
  patterns:
    - LtrIsolate around mono cells (days + owner) so digits/initials stay LTR inside RTL row
    - 4-column .overdue-item CSS grid (handoff app.css#L331-338) — flex-only Tailwind here; class name is the contract
    - Status filter is client-side (excludes completed + cancelled) on top of server-side source='commitment' filter (D-04)
key-files:
  created:
    - frontend/src/components/dossier/DossierDrawer/__tests__/OpenCommitmentsSection.test.tsx
  modified:
    - frontend/src/components/dossier/DossierDrawer/OpenCommitmentsSection.tsx
decisions:
  - D-04 confirmed: read from work_items.by_source.commitments (already source-filtered server-side)
  - D-08 REVISED: row click is route navigation to /commitments?id=<id>, NOT a work-item detail dialog (no such component exists per RESEARCH §4); Wave 2 a11y/visual spec must verify drawer auto-closes via the next route's validateSearch dropping ?dossier=
  - D-11 confirmed: every row has min-block-size 44 regardless of density tokens
  - Severity color mapping fixed at urgent+high → danger, medium → warn, low/unknown → ink-faint per UI-SPEC Color anti-list (severity dot uses danger/warn/ink-faint, NOT accent)
metrics:
  duration_minutes: 5
  completed: 2026-05-01T22:08Z
  tasks_completed: 1
  files_created: 1
  files_modified: 1
  unit_tests_pass: 12
  unit_tests_total: 12
  ts_errors_introduced: 0
---

# Phase 41 Plan 05: Wave 1 — Open Commitments Section Summary

DRAWER-02 Open Commitments rendered: handoff `.overdue-item` 4-column row (severity dot + title + days mono + owner mono) wired to `overview.work_items.by_source.commitments`, filtered to actionable open statuses (excludes completed + cancelled), with bilingual digit rendering, click-to-navigate to `/commitments?id=<id>`, and a 44px min-block-size hit area.

## What Got Built

### Task 1 — OpenCommitmentsSection rows + tests

**Commits:**

- RED: `f7c3fc87` — `test(41-05): add failing tests for OpenCommitmentsSection rows`
- GREEN: `0c99db62` — `feat(41-05): implement OpenCommitmentsSection overdue-item rows`

**Implementation:**

- Reads `overview?.work_items?.by_source?.commitments ?? []` (D-04 confirmed: server-side source filter); client-side drops `completed` + `cancelled`.
- Each row is a `<button>` carrying the handoff `.overdue-item` class plus inline-style `minBlockSize: 44` to enforce D-11 touch target (the prototype's `--row-h` density token can drop below 44 in compact mode; the inline override is intentional and is the deliverable contract).
- 4-column children, in JSX order so RTL flows correctly:
  1. `.overdue-sev` 6×6 dot, inline `backgroundColor: severityColor(priority)`.
  2. `.overdue-title` — `title_ar` when `lang === 'ar' && title_ar` truthy, else `title_en`.
  3. `<LtrIsolate>` wrapping `.overdue-days` (mono) — `daysLabel(deadline, lang)` produces `'T-N'` past, `'T+N'` future, `'—'` missing/invalid; digits transformed via `toArDigits`.
  4. `<LtrIsolate>` wrapping `.overdue-owner` (mono) — `ownerInitials(assignee_name)`: first character of up to the first two whitespace-split words, upper-cased; `'—'` when null/empty/whitespace-only.
- Row click invokes `navigate({ to: '/commitments', search: { id } })` — type-cast via `as unknown as Parameters<typeof navigate>[0]` (same precedent used across 12+ call sites in the codebase, including `useDossierDrawer.ts` from 41-01).
- Section heading renders `t('section.open_commitments')`; empty branch renders `t('empty.open_commitments')` (both keys shipped in 41-01).

**Test fixture conventions (12 tests, all green):**

- Per-file `vi.mock('react-i18next', ...)` overrides the global passthrough mock; `i18nState.language` toggles between `en` and `ar` per test (test 7 + test 9 use `'ar'`).
- `vi.useFakeTimers()` + `vi.setSystemTime(new Date('2026-05-02T12:00:00.000Z'))` pins "now" so the days-label assertions are deterministic across CI runs.
- `mkItem` factory builds `DossierWorkItem` shapes (note: not `WorkItem` — see Deviations §1).
- `navigateMock` reset before each test.

## Verification

| Check                                                                                                                                                                                                                                              | Result                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `vitest run src/components/dossier/DossierDrawer/__tests__/OpenCommitmentsSection.test.tsx`                                                                                                                                                        | 12/12 PASS              |
| `tsc --noEmit` errors traced to plan files                                                                                                                                                                                                          | 0 (delta 0)             |
| `grep -E "by_source\.commitments" OpenCommitmentsSection.tsx`                                                                                                                                                                                       | 2 hits (≥ 1 required)   |
| `grep -E "to:\s*'/commitments'" OpenCommitmentsSection.tsx`                                                                                                                                                                                         | 2 hits (≥ 1 required)   |
| `grep -rE '\b(ml-[0-9]\|mr-[0-9]\|pl-[0-9]\|pr-[0-9]\|left-[0-9]\|right-[0-9]\|text-left\|text-right)\b' OpenCommitmentsSection.tsx`                                                                                                                | 0 hits (0 required)     |
| `grep -rE '#[0-9a-fA-F]{3,6}' OpenCommitmentsSection.tsx`                                                                                                                                                                                          | 0 hits (0 required)     |
| `grep -rE 'dangerouslySetInnerHTML' OpenCommitmentsSection.tsx`                                                                                                                                                                                    | 0 hits (0 required)     |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Plan template typed `WorkItem` but `work_items.by_source.commitments` is `DossierWorkItem[]`**

- **Found during:** Task 1 implementation (TypeScript would not compile against the plan's literal `WorkItem` import path).
- **Issue:** Plan `<action>` block imports `import type { DossierOverviewResponse, WorkItem } from '@/types/dossier-overview.types'`. That module re-exports several work-item-related types but the actual element type of `work_items.by_source.commitments` is `DossierWorkItem` (file-local interface at lines 136–151 of `dossier-overview.types.ts`). There is no exported `WorkItem` symbol from that module. The canonical `WorkItem` (from `@/types/work-item.types`) has a different shape (e.g. `assignee` object instead of `assignee_id` + `assignee_name`).
- **Fix:** Imported `DossierWorkItem` instead. `severityColor` and `isOpenStatus` helpers narrow on `DossierWorkItem['priority']` / `DossierWorkItem['status']`. Functionally identical to the plan intent.
- **Files modified:** `frontend/src/components/dossier/DossierDrawer/OpenCommitmentsSection.tsx`
- **Commit:** `0c99db62`

**2. [Rule 3 — Blocking] React 19 + tsconfig require `React.JSX.Element`, not bare `JSX.Element`**

- **Found during:** Task 1 implementation.
- **Issue:** Plan template returns `: JSX.Element`, which fails `TS2503: Cannot find namespace 'JSX'` under React 19 + this project's tsconfig (same issue resolved in 41-01 deviation #5).
- **Fix:** Returned `: React.JSX.Element` and added `import type * as React from 'react'`. Matches the convention already established by every Wave 0 stub in this directory.
- **Files modified:** `frontend/src/components/dossier/DossierDrawer/OpenCommitmentsSection.tsx`
- **Commit:** `0c99db62`

**3. [Rule 3 — Blocking] TanStack Router strict typing rejects `{ id }` literal in `search`**

- **Found during:** Task 1 implementation (typecheck after first GREEN attempt).
- **Issue:** `navigate({ to: '/commitments', search: { id } })` fails strict typecheck because TanStack Router's `NavigateOptions.search` is constrained against the route's registered search schema, and `/commitments` does not currently declare an `id` search param in its router-generated types.
- **Fix:** Cast as `as unknown as Parameters<typeof navigate>[0]` — the same precedent used across the codebase (e.g. `useDossierDrawer.ts`, `useContextAwareFAB.ts`). Runtime contract is preserved (TanStack Router still serializes `search` as a query string). Test 10 asserts the call shape is `{ to: '/commitments', search: { id: 'click-me' } }`.
- **Files modified:** `frontend/src/components/dossier/DossierDrawer/OpenCommitmentsSection.tsx`
- **Commit:** `0c99db62`

**4. [Rule 1 — Bug] Plan's `ownerInitials` does not handle whitespace-only strings**

- **Found during:** Test design (test 9 wanted explicit guarantee that `'   '` reads as missing).
- **Issue:** Plan template `if (!name || name.length === 0) return '—'` evaluates `'   '` as truthy with non-zero length and would proceed to split + slice, producing an empty string. Empty string is not the contract value — `'—'` is.
- **Fix:** Added a `.trim() === ''` guard plus a `parts.length === 0` guard after the split-filter pipeline so any whitespace-only input collapses to `'—'`. Single-word input still returns one initial; full names return up to two.
- **Files modified:** `frontend/src/components/dossier/DossierDrawer/OpenCommitmentsSection.tsx`
- **Commit:** `0c99db62`

### Plan-vs-spec note: `min-block-size: 44`

The plan code uses `style={{ minBlockSize: 44 }}`. React's CSSProperties accepts numeric values for length properties and serializes them with implicit `'px'`. Test 11 tolerates either `'44px'` or `'44'` to remain robust against jsdom serialization quirks; in jsdom 29 the serialized form is `'44px'`.

## Threat Model — Status

| Threat ID  | Mitigation                                                                                                                                                  | Status    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| T-41-05-01 | Title + assignee_name flow through React JSX text nodes (auto-escaped). `ownerInitials` only emits chars derived from `.charAt(0).toUpperCase()` — non-HTML. | MITIGATED |
| T-41-05-02 | `to: '/commitments'` is a hard-coded literal; only `id` is interpolated as a search param value (TanStack Router URL-encodes). No external URL constructable. | MITIGATED |
| T-41-05-03 | `new Date(deadline)` returns Invalid Date for malformed input; `Number.isNaN(d.getTime())` short-circuits to `'—'`. No NaN propagation.                     | MITIGATED |
| T-41-05-04 | Backend RLS gates work-item visibility for the requesting user; drawer only surfaces what the API returns.                                                  | ACCEPTED  |

## Wave 2 verification reminders

- Manual verification: clicking a commitment row in the drawer at `/dossiers?dossier=<id>&dossierType=country` should navigate to `/commitments?id=<commit-id>` AND visibly close the drawer (because `_protected.tsx validateSearch` does not carry `?dossier=` into the `/commitments` route's search schema).
- E2E: Wave 2 should add a Playwright spec that opens the drawer, clicks an open-commitment row, and asserts both URL change AND drawer absence.
- Visual: at 1024px and 1400px, verify the 4-column grid does not wrap (the prototype `.overdue-item` template-columns rule is `auto 1fr auto auto`; we rely on the class name carrying the rule from the inherited app.css).

## Known Stubs

None introduced by this plan. The Wave 0 stub at this path has been fully replaced.

## Self-Check: PASSED

**Files exist:**

- FOUND: `frontend/src/components/dossier/DossierDrawer/OpenCommitmentsSection.tsx`
- FOUND: `frontend/src/components/dossier/DossierDrawer/__tests__/OpenCommitmentsSection.test.tsx`

**Commits exist:**

- FOUND: `f7c3fc87` (RED — failing tests)
- FOUND: `0c99db62` (GREEN — implementation)
