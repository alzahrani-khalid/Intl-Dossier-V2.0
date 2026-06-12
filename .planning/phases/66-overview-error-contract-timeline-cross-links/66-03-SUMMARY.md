---
phase: 66-overview-error-contract-timeline-cross-links
plan: 03
subsystem: api
tags: [edge-function, deno, supabase, timeline, navigation, tanstack-router]

# Dependency graph
requires:
  - phase: 66-02
    provides: resolveTimelineNavUrl mounted-route guard + the three live cross-link dead-link fixes (sibling wave-1 worktree)
provides:
  - unified-timeline edge function emits only mounted paths or null for navigation_url (no /calendar/$id, /mous/$id, or ?tab= dead links)
  - Calendar timeline rows emit navigation_url null (A-7 SUPPRESS) with the binding decision recorded at the emission site
  - Single-navigation_url-builder invariant re-confirmed repo-wide
affects: [66-07, 66-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Edge function emits mounted-or-null URLs only — no user-controlled URL composition; static literals ('/mous', null) and the shared getDossierDetailPath helper"

key-files:
  created:
    - .planning/phases/66-overview-error-contract-timeline-cross-links/66-03-SUMMARY.md
  modified:
    - supabase/functions/unified-timeline/index.ts

key-decisions:
  - 'A-7 SUPPRESS (binding, orchestrator product call): calendar timeline rows emit navigation_url null — /calendar/$id is unmounted and /calendar has no event-focus param, so a bare list link is a dishonest affordance'
  - 'MoU rows emit the /mous mounted list literal (/mous/$id is unmounted); interaction/intelligence rows emit the bare getDossierDetailPath value (dead ?tab= suffixes dropped)'
  - 'No navigation_url type annotation exists in the edge fn (metadata objects are inline-typed literals) — null and string are both inferred, no widening needed'
  - 'CODE-ONLY: staging redeploy of unified-timeline is deferred to 66-08 (orchestrator/Supabase MCP); repo edits change nothing on staging until then (Pitfall 10)'

patterns-established:
  - 'Timeline navigation_url is built in exactly one place (unified-timeline/index.ts) — defense-in-depth with the 66-07 client guard'

requirements-completed: [OVRERR-02]

# Metrics
duration: ~12min
completed: 2026-06-12
---

# Phase 66 Plan 03: Honest Timeline navigation_url Emissions Summary

**unified-timeline edge function now emits only mounted paths or null for navigation_url — calendar rows suppress (A-7), MoU routes to the /mous list, interaction/intelligence drop dead ?tab= suffixes — closing all four dishonest dead-link emissions at the single source of truth (OVRERR-02).**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-12T22:45:00Z
- **Completed:** 2026-06-12T22:57:05Z
- **Tasks:** 2 (1 code edit + 1 read-only same-bug-class scan)
- **Files modified:** 1 (code)

## Accomplishments

- Replaced all four dishonest `navigation_url` emissions in `supabase/functions/unified-timeline/index.ts`:
  - **Calendar (L178→179):** `/calendar/${event.id}` → `null` with the binding A-7 SUPPRESS decision recorded at the site
  - **Interaction (L239→240):** dropped dead `?tab=interactions` → bare `getDossierDetailPath(dossier_id, dossier_type)`
  - **Intelligence (L306→307):** dropped dead `?tab=intelligence` → bare `getDossierDetailPath(dossier_id, dossier_type)`
  - **MoU (L360→362):** `/mous/${mou.id}` → `/mous` (mounted list)
- Re-confirmed the single-`navigation_url`-builder invariant repo-wide (unified-timeline is the only builder in `supabase/functions` + `backend/src`).
- Surfaced one **unowned** live dead-path emitter to the orchestrator (`contextual-suggestions/index.ts` — see Deviations / scan hit list) rather than widening this plan's file ownership.

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace the four emissions + record the A-7 decision** - `b4adef3e` (fix)
2. **Task 2: Same-bug-class scan** - no commit (read-only; results recorded below)

_Note: This plan is CODE-ONLY for the edge function; deploy + live probe happen in 66-08._

## Files Created/Modified

- `supabase/functions/unified-timeline/index.ts` - Four `navigation_url` emission sites reduced to mounted paths or null; A-7 SUPPRESS and MoU-list comments added at their sites (6 insertions, 4 deletions)

## Decisions Made

- **A-7 SUPPRESS for calendar rows (binding):** `navigation_url: null` — `/calendar/$id` is unmounted and `/calendar` has no event-focus search param (verified in 66-RESEARCH Open Question Answers #1 / UI-SPEC §3). A bare list link is a dishonest affordance, so the View-details affordance is removed client-side via the null.
- **No type widening needed:** the four `metadata` objects are inline-typed object literals with no explicit `navigation_url` annotation, so both `null` and `string` are inferred without changes.
- **Verification by grep gates, not Vitest:** Deno edge functions have no Vitest harness in this repo; correctness is proven by the plan's grep gates (all PASS) and the 66-08 live probe. `deno check` in the worktree fails on a pre-existing, unrelated `shared/` workspace-member resolution error (missing `shared/package.json` in the sparse worktree checkout) — not introduced by this change.

## Deviations from Plan

None to the code change itself — the four replacements match the plan's interfaces block verbatim.

### Surfaced finding (Task 2 scan — STOP-and-surface per plan, NOT auto-fixed)

The same-bug-class scan (Scan B: sibling dead-path emitters) found one **unowned** live dead-path emitter outside this plan's file ownership. Per the plan's explicit directive — "If an UNOWNED builder/emitter is found, STOP and surface it to the orchestrator (do not widen this plan's file ownership)" — it was **not** modified:

**`supabase/functions/contextual-suggestions/index.ts:544`** — emits `action_route: ` + `` `/mous/${mou.id}` `` (expiring-MOU suggestion).

- **Live:** consumed by `frontend/src/components/empty-states/ContextualSuggestions.tsx:207,228` via `<Link to={suggestion.action_route}>` — the dead path IS navigated client-side.
- **Dead-ends:** `/mous/$id` is unmounted (only `/mous` list and `/dossiers/organizations/$id/mous` exist).
- **Field is `action_route`, not `navigation_url`** — a different field on a different surface (contextual suggestions), so it does NOT violate this plan's single-`navigation_url`-builder invariant and is NOT in any Phase 66 plan's `files_modified`.
- **Recommendation for orchestrator:** retarget to `/mous` (mounted list), mirroring the A-8 disposition for the same MoU dead-link class. Owning fix would touch `contextual-suggestions/index.ts` (and a redeploy). This is a candidate for a follow-up plan/quick — it is genuinely unowned by the current wave.

## Same-bug-class scan hit list (Task 2, recorded per plan)

**Scan A — all `navigation_url` hits (`supabase/functions`, `backend/src`, `frontend/src`):**

| Hit                                                                                        | Role                                                                    |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `supabase/functions/unified-timeline/index.ts:179,240,307,362`                             | **BUILDER** — the only navigation_url builder; all four fixed in Task 1 |
| `frontend/src/components/timeline/TimelineEventCard.tsx:118,119,327`                       | CONSUMER (66-07 render gate)                                            |
| `frontend/src/components/timeline/EnhancedVerticalTimelineCard.tsx:195,197,422`            | CONSUMER (66-07 render gate)                                            |
| `frontend/src/components/activity-feed/ActivityList.tsx:107` (+ doc comment L18)           | CONSUMER (R-05 guard)                                                   |
| `frontend/src/types/activity-feed.types.ts:112`, `frontend/src/types/timeline.types.ts:56` | TYPE DEF (`navigation_url?: string`)                                    |

Builders outside unified-timeline: **none** (Task 2 gate PASS).

**Scan B — sibling dead-path emitters (`/calendar` `/mous` `/documents` interpolations):**

| Hit                                                                                                    | Ownership                                                                                               |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `frontend/src/domains/dossiers/hooks/useQuickSwitcherSearch.ts:98,100` (`/mous/$id`, `/documents/$id`) | **66-02** (its `files_modified` + Task 2 / A-8) — sibling worktree                                      |
| `frontend/src/pages/DossierSearchPage.tsx:137 (`/documents/$id`),152 (`/mous/$id`)`                    | **66-02** (file in its `files_modified`; handler rewrite L140-160 covers both cases) — sibling worktree |
| `supabase/functions/contextual-suggestions/index.ts:544` (`action_route: /mous/$id`)                   | **UNOWNED** — surfaced above; not modified                                                              |

## Issues Encountered

- `deno check` in the worktree fails with `Could not find package.json for workspace member in '.../shared/'` — a pre-existing, unrelated sparse-worktree resolution issue (the `shared/` member only contains `types/`, no `package.json`). Not caused by this change; the four edits are literal/expression substitutions inside inline-typed object literals with no type implications. Documented; not fixed (out of scope — pre-existing, unrelated file).
- Pre-commit build hook errored (`turbo: command not found`, `node_modules` missing in worktree) but did NOT block the commit (per project convention, the pre-commit build does not block on failure; lint-staged matched no staged files since the edge fn is outside the frontend lint glob).

## User Setup Required

None - no external service configuration required.

## Deploy-pending note (66-08)

This plan is **CODE-ONLY**. The corrected `supabase/functions/unified-timeline/index.ts` does NOT take effect on staging until the orchestrator redeploys the edge function via Supabase MCP in **66-08**, with the before/after emission probe (64-01 split precedent). The live half of 66-VALIDATION row "Edge emissions clean" is realized there; the code-side half (grep gates) is satisfied here.

## Next Phase Readiness

- 66-07 client guard (`resolveTimelineNavUrl`) and 66-08 redeploy + live probe can proceed; the source-of-truth emissions are now honest.
- **Orchestrator action item:** the unowned `contextual-suggestions/index.ts:544` `action_route: /mous/$id` dead link (live via `ContextualSuggestions.tsx`) needs a follow-up disposition (retarget to `/mous`) — outside Phase 66's planned file ownership.

## Self-Check: PASSED

- `66-03-SUMMARY.md` exists at the plan directory.
- Task 1 commit `b4adef3e` exists in git history.
- `b4adef3e:supabase/functions/unified-timeline/index.ts` confirms the four honest emissions (`null`, `getDossierDetailPath(...)` x2, `'/mous'`).

---

_Phase: 66-overview-error-contract-timeline-cross-links_
_Plan: 03_
_Completed: 2026-06-12_
