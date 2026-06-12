---
phase: 65-engagement-positions-tab-legacy-reconciliation
plan: 05
subsystem: engagement-workspace
tags: [engagement, workspace, calendar, cta-reconciliation, scheduled-events-reader, tdd]
requires:
  - workspace.json calendar.* reader keys (scheduledEvents/entriesEmpty/entriesError) + actions.addEvent / empty.calendar.action — OWNED by plan 65-01 (consumed by name only)
  - Exported EventDialog + its ['engagement-calendar-entries', dossier_id] success invalidation — landed in plan 65-04
  - calendar_entries SELECT RLS policy (quick 260604-lmy) — the read gate
provides:
  - useEngagementCalendarEntries — typed calendar_entries reader for the engagement workspace
  - CalendarTab "Scheduled events" in-tab reader (the one net-new visual surface, UI-SPEC §3)
  - Live Add event CTAs (#6 empty-state, #7 header) opening EventDialog with engagement-typed context
affects:
  - frontend/src/hooks/useEngagementCalendarEntries.ts (new)
  - frontend/src/pages/engagements/workspace/CalendarTab.tsx
tech-stack:
  added: []
  patterns:
    - 'Direct-PostgREST RLS-gated reader keyed to an EventDialog invalidation contract (render path that makes a re-enabled CTA honest)'
    - 'Dual-path dialog mount: one guarded EventDialog element rendered in both the empty-state and main return paths'
    - 'Dedicated day-first short formatter (en-GB / toFormatLocale) separate from the existing long derived-date formatter'
key-files:
  created:
    - frontend/src/hooks/useEngagementCalendarEntries.ts
    - frontend/src/pages/engagements/workspace/__tests__/CalendarTabCtas.test.tsx
  modified:
    - frontend/src/pages/engagements/workspace/CalendarTab.tsx
decisions:
  - 'Add event CTAs (#6/#7) re-enabled together with the Scheduled-events reader, never without it (UI-SPEC §2 row 6 — re-enabling without a render path is the R15-02 bug class)'
  - "Reader = useEngagementCalendarEntries keyed ['engagement-calendar-entries', engagementId], direct PostgREST on calendar_entries filtered dossier_id = engagementId under SELECT RLS; standard anon client, no edge function, no privileged client"
  - 'Scheduled events section renders FIRST, above the derived Today/Upcoming/Past groups (UI-SPEC A-5: user-created content outranks derived metadata)'
  - 'Whole-tab empty state now requires derived events AND scheduled entries both resolved-empty; while entries are unresolved, derived-only behavior holds (no flash)'
metrics:
  duration: ~30m
  tasks: 3
  files_changed: 3
  completed: 2026-06-13
requirements: [ENGPOS-03]
---

# Phase 65 Plan 05: CalendarTab Scheduled-Events Reader + Live Add Event CTAs Summary

Made CalendarTab an honest surface: added `useEngagementCalendarEntries` (a typed, RLS-gated `calendar_entries` reader keyed to the EventDialog invalidation contract from 65-04), rendered the net-new "Scheduled events" in-tab section per UI-SPEC §3, and re-enabled both Add event CTAs (#6/#7) so a workspace-created `calendar_entries` row renders in the tab without reload.

## What Was Built

- **Task 1 (RED test)** — `CalendarTabCtas.test.tsx` (12 cases): reader query-shape (mocked supabase chain asserts `from('calendar_entries')`, `eq('dossier_id', id)`, `order('event_date', ascending)`, and the `['engagement-calendar-entries', id]` cache key), section-placement-before-derived, locale-picked titles (EN→`title_en`, AR→`title_ar`), day-first dates, `HH:mm` for the timed entry, `calendar:types.*` badge with `defaultValue` fallback, entriesEmpty/entriesError lines, the whole-tab empty-state interplay (4 permutations of derived×entries presence + the no-flash-while-loading case), both Add event buttons opening the stubbed EventDialog with `dossier_type:'engagement'` / `inheritance_source:'direct'`, and a zero-dead-disabled-buttons assertion. Decision-tagged `(ENGPOS-03)`. Commit `2506afe7` (RED: hook module unresolved).
- **Task 2 (reader hook)** — `useEngagementCalendarEntries`: `useQuery` with key `['engagement-calendar-entries', engagementId]`, selecting the seven contract columns from `calendar_entries` filtered `eq('dossier_id', engagementId)`, ordered `event_date` ascending, `enabled` guard on empty id, throw-on-PostgREST-error (the tab maps it to the entriesError line). Standard anon supabase client; the SELECT RLS policy is the gate. Reader-shape describe GREEN; `pnpm type-check` exit 0; plan grep `HOOK_OK`. Commit `5ff285c5`.
- **Task 3 (CalendarTab restructure)** — consumed the reader; rebuilt the whole-tab empty-state condition to `events.length === 0 && (!entriesLoading && entriesError === null && entries.length === 0)` (derived-only while unresolved, no flash); inserted the `ScheduledEventsSection` (bordered `divide-y` list, `min-h-[var(--row-h)]` rows, locale-picked titles, dedicated `en-GB`/`toFormatLocale` day-first formatter, `HH:mm` for timed entries, secondary `calendar:types.*` badge, muted entriesEmpty line, `text-[var(--danger)]` entriesError line, no skeleton, non-interactive rows, logical `justify-between` layout) as the FIRST content section; wired both Add event buttons via a lifted guarded `eventDialog` element rendered in both return paths; normalized the header button `min-h-8 → min-h-11`; removed the stale R15-02 / "events API lacks engagement_id" comments and reworded the conflict-detection TODO to drop the resolved blocker. Full suite GREEN (12 passed); type-check exit 0; plan grep `CALENDAR_WIRED`. Commit `fd025b72`.

## Verification

- `pnpm exec vitest run CalendarTabCtas.test.tsx` → 12 passed (RED at Task 1 = suite-unresolved import).
- `pnpm type-check` → exit 0.
- `pnpm exec eslint <3 touched files> --max-warnings 0` → clean (CI parity).
- Task-2 grep: `engagement-calendar-entries` present, `eq('dossier_id'` present, no `service_role`/`service-role` substring → `HOOK_OK`.
- Task-3 grep: `useEngagementCalendarEntries` + `EventDialog` referenced in CalendarTab; `min-h-8` gone → `CALENDAR_WIRED`.
- Remaining `disabled` props (×2) are the `addEventDisabled` readiness guard (`dossierContext === null || dossier === undefined`, resolves in ms), not dead no-ops.

## Wave-1 Consumption (no edits)

- **i18n keys** (`calendar.scheduledEvents` / `calendar.entriesEmpty` / `calendar.entriesError`, `actions.addEvent`, `empty.calendar.action`) are single-owned by plan 65-01 and consumed by name only — this plan did NOT touch `workspace.json`. The bilingual `calendar:types.*` badge keys are existing (`frontend/src/i18n/{en,ar}/calendar.json`).
- **EventDialog** is consumed via the named export added in 65-04; its success path already invalidates `['engagement-calendar-entries', dossier_id]`, which matches this reader's key exactly — that is the acceptance contract for CTAs #6/#7 (created entry renders without reload). `AddToDossierDialogs.tsx` was NOT edited.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] RED test mispredicted the reader contract and the t() mock**

- **Found during:** Tasks 2-3 (turning RED → GREEN)
- **Issue:** The Task-1 test drafted the reader stub returning `{ data }` and asserted the badge against the raw key string `calendar:types.internal_meeting`. The implemented hook returns `{ entries, isLoading, error }`, and the colon-form `t(..., { defaultValue })` mock returns the `defaultValue` (the slug), not the key. The reader-shape sub-test also imported the top-level-stubbed hook (never resolves).
- **Fix:** Aligned the hook stub/state to `{ entries, ... }`; asserted the badge against the rendered slug (`internal_meeting`/`review`); added `vi.doUnmock('@/hooks/useEngagementCalendarEntries')` + a post-test `vi.doMock` restore around the reader-shape dynamic import; changed the placement assertion to target the rendered `Past` derived group (the seeded engagement's dates fall in the past relative to now). These are corrections to this plan's own new test, not to shipped code.
- **Files modified:** `CalendarTabCtas.test.tsx`
- **Commits:** `5ff285c5` (reader-test fix), `fd025b72` (tab-test assertion fixes)

No architectural changes (Rule 4) and no auth gates occurred. Generated `routeTree.gen.ts` drift produced by the pre-commit build hook in the fresh worktree was reverted each commit (out of scope, generated artifact — never staged).

## Threat Surface

No new security-relevant surface. The reader is a direct PostgREST SELECT under the existing `calendar_entries` SELECT RLS policy (quick 260604-lmy: owner/attendee + dossier clearance) — no service-role/privileged client, no edge function, no new endpoint (T-65-14 mitigated by reuse + the no-bypass grep gate). The Add event write path reuses the shipped `EventDialog` mutation verbatim. T-65-15 (CTA re-enabled without a render path) is structurally mitigated: the reader ships in the same plan as the wiring. T-65-16 (stale-cache false negative) is pinned by the unit test asserting the reader key equals the EventDialog invalidation key.

## Known Stubs

None. The Scheduled-events rows are wired to a live `calendar_entries` reader; both Add event CTAs have a verified write path (EventDialog) and render path (this reader). No hardcoded empty arrays flow to the UI, no placeholder copy, no unwired props.

## Self-Check: PASSED
