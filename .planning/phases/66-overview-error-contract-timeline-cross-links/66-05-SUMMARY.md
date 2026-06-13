---
phase: 66-overview-error-contract-timeline-cross-links
plan: 05
subsystem: dossier-overview-cards
tags: [error-contract, ovrerr-01, tdd, i18n, rtl]
requires:
  - 'dossier:overview.sectionError key (en + ar) — landed by 66-01'
  - 'useDossierOverview exposes isError/error (existing); useDossierPositionLinks exposes error; useElectedOfficial is raw useQuery'
provides:
  - 'Error branch (UI-SPEC §1) on the 11 type-tab overview cards: forum/topic/working-group/person/elected-official'
  - 'ElectedOfficial all-dash-on-error failure mode removed (T-66-10)'
  - 'Parameterized forced-error suite TypeCardErrorStates.test.tsx (66-VALIDATION row 2, type-tab half)'
affects:
  - 'Phase 66 success criterion 2 (all 19 overview cards distinguish failed from empty) — this plan completes the type-tab half; 66-04 owns the other 8'
tech-stack:
  added: []
  patterns:
    - 'error-before-empty render precedence with stale-while-error (render cached data, no alert, when data present despite isError)'
    - 'vi.hoisted mutable-state hook mocks per hook family + i18n echo honouring defaultValue'
key-files:
  created:
    - frontend/src/pages/dossiers/overview-cards/__tests__/TypeCardErrorStates.test.tsx
  modified:
    - frontend/src/pages/dossiers/overview-cards/ForumMetadataCard.tsx
    - frontend/src/pages/dossiers/overview-cards/ForumSessionsCard.tsx
    - frontend/src/pages/dossiers/overview-cards/ConnectedAnchorsCard.tsx
    - frontend/src/pages/dossiers/overview-cards/PositionTrackerCard.tsx
    - frontend/src/pages/dossiers/overview-cards/DeliverablesTrackerCard.tsx
    - frontend/src/pages/dossiers/overview-cards/MeetingScheduleCard.tsx
    - frontend/src/pages/dossiers/overview-cards/MemberListCard.tsx
    - frontend/src/pages/dossiers/overview-cards/PersonMetadataCard.tsx
    - frontend/src/pages/dossiers/overview-cards/EngagementHistoryCard.tsx
    - frontend/src/pages/dossiers/overview-cards/ElectedOfficialOfficeCard.tsx
    - frontend/src/pages/dossiers/overview-cards/ElectedOfficialCommitteesCard.tsx
decisions:
  - 'Per-card "data unavailable" comparison verified at source: useDossierOverview returns query.data || null → isError && data === null; useDossierPositionLinks exposes error (not isError) and positions defaults to [] → error != null && !hasPositions (stale-while-error); useElectedOfficial is raw useQuery → isError && official === undefined.'
  - 'ForumMetadataCard and PersonMetadataCard had NO empty branch (they always render dash rows). The error branch wraps the rows render (error ? alert : rows) — same dishonest-dash class as the EO cards.'
  - 'EO cards use colon-form t("dossier:overview.sectionError", …) because they translate from the elected-officials namespace; the 9 dossier-namespace cards use plain t("overview.sectionError", …) (one key, 19 cards, A-2).'
  - 'routeTree.gen.ts whitespace-reflowed by the Vite router plugin during vitest/type-check; left unstaged (outside files_modified) — neither reverted nor committed, per 66-01 precedent. Orchestrator owns it.'
metrics:
  duration: ~20m
  tasks: 2
  files_changed: 12
  completed: 2026-06-13
---

# Phase 66 Plan 05: Type-Tab Overview Card Error Lines (OVRERR-01) Summary

Added the UI-SPEC §1 section-error line to the remaining 11 type-tab overview cards (forum, topic, working-group, person, elected-official) so a failed section query renders a `role="alert"` danger line instead of a trustworthy-looking empty state — and removed the ElectedOfficial all-dash-on-error failure mode (a third dishonest rendering). Together with 66-04 this completes the OVRERR-01 contract across the full 19-card inventory.

## What Was Built

### Task 1 (RED) — forced-error suite (`84e8c192`)

`frontend/src/pages/dossiers/overview-cards/__tests__/TypeCardErrorStates.test.tsx`:

- `vi.hoisted` mutable-state mocks for three hook families (`useDossierOverview`, `useDossierPositionLinks`, `useElectedOfficial`), plus an i18n echo mock honouring `defaultValue` (so assertions on the EN fallback work for both plain and colon-form keys) and a `<Link>` stub for the cards' data branches.
- Parameterized `it.each` over the 8 `useDossierOverview` cards: forced `{ isError: true, data: null }` → `role="alert"` with `/failed to load this section/i`, empty copy absent (for the 6 cards that have empty copy).
- PositionTrackerCard: `error` + no positions → alert; cached positions + error → positions render, no alert (stale-while-error).
- ElectedOfficial office/committees: `{ isError: true, data: undefined }` → alert; office card asserts no `-` dash row leaked.
- Stale-while-error + empty-pin pins (3 cases) GREEN from the start.
- RED confirmed: 11 failed (error cases) / 3 passed.

### Task 2 (GREEN) — error branch in all 11 cards (`3576ee35`)

- 8 `useDossierOverview` cards: added `isError` to the destructure and an `isError && data === null` branch BEFORE the empty branch, reusing each card's own container/dir/h3. ForumMetadata/PersonMetadata (no empty branch) wrap their always-render dash rows in `error ? alert : rows`.
- PositionTrackerCard: added `error` to the destructure; branch `error != null && !hasPositions` (cached positions still render → stale-while-error).
- ElectedOfficial office/committees: added `isError`; branch `isError && official === undefined` REPLACES the dash-fallback path; colon-form `dossier:overview.sectionError` key.
- Anatomy verbatim from UI-SPEC §1: `<p role="alert" className="text-sm text-[var(--danger)] text-center py-8">`, no icon, no retry, no chrome change.
- GREEN confirmed: 14/14 tests pass; `tsc --noEmit` exit 0; eslint `--max-warnings 0` exit 0 on all 12 touched files.

## Verification

| Gate                                                     | Result         |
| -------------------------------------------------------- | -------------- |
| `vitest run TypeCardErrorStates.test.tsx`                | 14 passed (14) |
| `tsc --noEmit` (pnpm type-check)                         | exit 0         |
| `eslint --max-warnings 0` (11 cards + test)              | exit 0         |
| `sectionError` cards in this worktree (this plan's 11)   | 11/11 present  |
| RED→GREEN gate sequence (test commit before feat commit) | satisfied      |

## Deviations from Plan

### 1. [Expected — parallel execution] 19-card grep gate reads 11 in this isolated worktree

The plan's Task 2 automated gate includes `[ "$(grep -rl sectionError … | wc -l)" -ge 19 ]`. In this worktree it reads **11** — the other 8 cards are owned by sibling plan 66-04, which runs concurrently in a separate worktree and has not merged into my base (`0d59afce`). All 11 cards in MY scope carry the branch; the directory holds exactly 19 cards total. The `>= 19` count is a phase-completion (cross-plan) assertion that the orchestrator's merge of 66-04 + 66-05 resolves — it is not satisfiable inside a single parallel worktree by design. Not a code defect; the substantive acceptance criteria (all 11 cards carry the error branch, suite green, type-check exit 0) are met.

### 2. [Rule 2 — missing critical functionality] ForumMetadataCard / PersonMetadataCard had no empty branch

These two cards always render dash (`-`) rows with no empty-state slot — itself a dishonest "looks like real data" mode on a failed query. The error branch wraps the rows render (`error ? alert : rows`) rather than slotting into a non-existent empty ternary. This satisfies the must-have "empty copy ABSENT on error" trivially (there is no empty copy) and removes the dash-on-error mode for these two cards, parallel to the EO fix (T-66-10 class). No layout change to the healthy render path.

## Known Stubs

None. All 11 cards wire `isError`/`error` from their real hook return shapes (verified at source). No placeholder data introduced.

## Threat Flags

None. No new network endpoints, auth paths, or schema surface. The error lines render only the generic localized `sectionError` copy — raw `error.message` / PostgREST strings never reach the DOM (T-66-09 mitigated; asserted by the i18n-echo tests).

## Self-Check: PASSED

- FOUND: `frontend/src/pages/dossiers/overview-cards/__tests__/TypeCardErrorStates.test.tsx`
- FOUND: all 11 modified card files carry `sectionError`
- FOUND commit `84e8c192` (Task 1 — RED test suite)
- FOUND commit `3576ee35` (Task 2 — GREEN error branches)
- FOUND: `.planning/phases/66-overview-error-contract-timeline-cross-links/66-05-SUMMARY.md`
