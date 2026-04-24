---
phase: 38-dashboard-verbatim
plan: 06
subsystem: dashboard / operations-hub
tags: [widget, vip-visits, rtl, tdd, hook-adapter]
requirements-addressed: [DASH-06, DASH-08, DASH-09]
dependency-graph:
  requires: [38-00, 38-02]
  provides: [useVipVisits hook, VipVisits widget hydrated]
  affects: [frontend/src/hooks, frontend/src/pages/Dashboard/widgets]
tech-stack:
  added: []
  patterns: [TanStack Query adapter, client-side filter, DossierGlyph, LtrIsolate, rotate-180 RTL]
key-files:
  created:
    - frontend/src/hooks/useVipVisits.ts
    - frontend/src/hooks/__tests__/useVipVisits.test.ts
    - frontend/src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx
  modified:
    - frontend/src/pages/Dashboard/widgets/VipVisits.tsx
decisions:
  - 'Option B — new useVipVisits hook that composes useUpcomingEvents'
  - "Zero new DB migrations; filter is client-side on event_type === 'vip_visit'"
  - 'personFlag left undefined — TimelineEvent shape has no participant/ISO projection'
  - 'DossierGlyph falls back to initials via `name` when iso is undefined'
metrics:
  duration: ~15min
  completed: 2026-04-25
  tasks: 3
  files-created: 3
  files-modified: 1
  tests: 17 passed (6 hook + 11 widget)
---

# Phase 38 Plan 06: VipVisits Widget Summary

**One-liner:** VipVisits widget hydrated via Option B — new `useVipVisits` hook
filters `useUpcomingEvents` on `event_type === 'vip_visit'`, widget renders T−N
countdown in `<LtrIsolate>` with RTL-safe rotate-180 arrow.

## Checkpoint Resolution

User selected **Option B** with the "no new tables" constraint:

| Field                  | Value                                                                    |
| ---------------------- | ------------------------------------------------------------------------ |
| CHOICE                 | B                                                                        |
| HOOK_IDENTIFIER        | `useVipVisits`                                                           |
| HOOK_FILE_PATH         | `frontend/src/hooks/useVipVisits.ts`                                     |
| EVENT_TYPE_FIELD_VALUE | `'vip_visit'` (constant `VIP_EVENT_TYPE`)                                |
| RETURN_SHAPE           | `VipVisit { id, name, role, when, personFlag?, dossierId? }`             |
| DATA STRATEGY          | Filter existing `TimelineEvent[]` client-side. No schema or RPC changes. |

## Data-Source Decision

The hook composes from the **existing** `useUpcomingEvents` adapter and
projects `TimelineEvent` → `VipVisit`:

| VipVisit field | Source in TimelineEvent                  |
| -------------- | ---------------------------------------- |
| `id`           | `event.id`                               |
| `name`         | `event.title`                            |
| `role`         | `event.engagement_name ?? ''`            |
| `when`         | `event.start_date` (ISO)                 |
| `personFlag`   | `undefined` — see Rule-3 deviation below |
| `dossierId`    | `event.engagement_id`                    |

## Deviations from Plan

### Rule-3 Deviation — personFlag cannot be derived without schema changes

**Found during:** Task 1 implementation.
**Issue:** `TimelineEvent` (the projection returned by `get_upcoming_events`
RPC) does not expose a visiting-person ISO, nationality, or the person
`dossier_id`. Joining to `persons.importance_level >= 4` or `elected_officials`
would require either (a) a new RPC, or (b) client-side N+1 lookups per row —
both violate the user's "no new DB migrations / no new schema" constraint.
**Fix:** `personFlag` is set to `undefined`. `DossierGlyph` already falls back
to initials (from `name`) when `iso` is absent (per its Resolution Order,
Pitfall 6). Widget remains functional and visually consistent with Phase 37
VIZ-04 spec.
**Forward path:** When a future migration extends `get_upcoming_events` to
project `person_iso` + `person_role`, `toVipVisit()` is the single swap point.
**Files modified:** `frontend/src/hooks/useVipVisits.ts` (documented inline).
**Commits:** 8248ac6a.

### Minor — "All" link target

Plan template showed `<Link to="/vip-visits">` but no such route exists. Used
plain `<a href="/vip-visits">` as a forward-compatible placeholder. The
`rotate-180` class + arrow-right semantics are preserved.

### Minor — i18n

Plan listed `dashboard-widgets.json` as a modified file. No new keys were
required: `vip.title` + `vip.empty` already exist (Phase 38 earlier plans),
and the widget reuses `actions.viewAll` + `error.load_failed`. APPEND-only
discipline preserved (net zero change).

### Minor — CSS

All `.vip-*` classes already exist in `dashboard.css` (verbatim handoff port,
lines 501–553). No new CSS needed; widget consumes the existing token set.

## Auto-fixed Issues

**[Rule-1 Bug] Test helper drift in `isoDaysFromNow`**

- **Found during:** Task 3 (first `vitest run`).
- **Issue:** `differenceInDays` truncates toward zero. `setDate(now+7)` at
  same wall-clock yielded 6.99… → floored to 6, breaking T−7 assertion; same
  failure symmetrically for T+3 (negative days).
- **Fix:** Push the synthetic date by ±1 minute in the matching direction
  (forward for positive offsets, backward for negative) so the whole-day
  boundary is crossed deterministically.
- **Files:** `frontend/src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx`
- **Commit:** f65b3873.

## Verification

| Command                                                                                | Result           |
| -------------------------------------------------------------------------------------- | ---------------- |
| `pnpm -C frontend vitest run src/hooks/__tests__/useVipVisits.test.ts`                 | 6/6 green        |
| `pnpm -C frontend vitest run src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx` | 11/11 green      |
| Combined run                                                                           | 17/17 green      |
| `grep "LtrIsolate\|differenceInDays\|rotate-180" VipVisits.tsx`                        | all 3 present    |
| `grep "useVipVisits" VipVisits.tsx`                                                    | 1 import, 1 call |
| DB migrations added                                                                    | **0**            |

## Commits

1. `8248ac6a` — feat(38-06-TASK-1): add useVipVisits hook + tests (Option B)
2. `7a0050f5` — feat(38-06-TASK-2): hydrate VipVisits widget with T-N countdown (GREEN)
3. `f65b3873` — test(38-06-TASK-3): VipVisits widget tests — countdown+RTL arrow+rows

## Threat Mitigations Realized

| Threat                           | Status    | How                                                                                                       |
| -------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| T-38-10 (data-source discretion) | mitigated | Hook identifier + filter confirmed at checkpoint; constant `VIP_EVENT_TYPE` exported                      |
| T-38-04 (RTL chevron flip)       | mitigated | `rotate-180` only when `isRTL === true`; never `scaleX`. Test asserts presence under `i18n.language='ar'` |
| T-38-01 (mock constants leak)    | mitigated | Widget consumes `useVipVisits` only; no handoff constants imported                                        |

## Known Stubs / Follow-ups

- `personFlag` always `undefined` today — `DossierGlyph` shows person-initials
  fallback. Resolving this requires a Wave-2 RPC extension; tracked in
  `deferred-items.md` as `VIP-PERSON-ISO-JOIN`.

## Self-Check: PASSED

- [x] `frontend/src/hooks/useVipVisits.ts` FOUND
- [x] `frontend/src/hooks/__tests__/useVipVisits.test.ts` FOUND
- [x] `frontend/src/pages/Dashboard/widgets/VipVisits.tsx` modified (130 insertions)
- [x] `frontend/src/pages/Dashboard/widgets/__tests__/VipVisits.test.tsx` FOUND
- [x] Commits 8248ac6a, 7a0050f5, f65b3873 in `git log`
- [x] 17/17 tests green
- [x] Zero DB migrations added
