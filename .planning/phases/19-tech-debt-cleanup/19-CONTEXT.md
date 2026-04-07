# Phase 19 — Tech Debt Cleanup — CONTEXT

**Phase:** 19
**Name:** Tech Debt Cleanup
**Requirements:** DEBT-01, DEBT-02
**Depends on:** Phase 14
**Created:** 2026-04-08

## Goal (from ROADMAP)

Remaining v3.0 technical debt is resolved for a clean operational baseline:

1. OPS-03 and OPS-07 dashboard items navigate using TanStack Router params instead of string-based navigation.
2. `.planning/ROADMAP.md` progress table updates automatically during plan execution without manual editing.

## Scope (locked)

### DEBT-01 — Typed router navigation for OPS-03 / OPS-07

- **OPS-03**: Dashboard "Active Engagements grouped by lifecycle stage" — clicking a group navigates to the relevant engagements workspace view.
- **OPS-07**: Dashboard action bar — `[+ New Engagement]`, `[+ New Request]`, `[Cmd+K]` quick-create buttons.
- **Target**: Replace any `navigate({ to: "/some/${literal}" })` / string-URL callsites for these two items with TanStack Router typed `navigate({ to, params, search })` calls using the generated `FileRoutesByPath` types.

### DEBT-02 — Auto-updating ROADMAP progress table

- The `## Progress` table in `.planning/ROADMAP.md` regenerates automatically when plan state changes during `/gsd-execute-phase` (and related execution commands) — no more hand-editing `Plans Complete`, `Status`, or `Completed` columns.

## Decisions (locked)

### D1 — DEBT-01 scope: tight, two items only

- Fix only OPS-03 and OPS-07 as named in the requirement.
- **Do not** audit the rest of the dashboard, ops hub, or other workspaces for similar string-nav patterns in this phase.
- If researcher or planner finds refactor opportunities outside these two items, capture them as deferred ideas — do not fold into Phase 19.
- **Why:** Requirement text is specific; phase is a cleanup, not a sweep.

### D2 — DEBT-02 hook lives in `gsd-tools` bin

- Implement the progress-table regeneration as a subcommand on `gsd-tools.cjs` (e.g. `gsd-tools roadmap sync-progress` — exact name is Claude's Discretion).
- `gsd-executor` (and any other workflow that advances plan state) calls this subcommand after each atomic plan commit.
- **Why:** Single source of truth; reusable from `/gsd-health`, `/gsd-progress`, and manual repair commands; independently testable.

### D3 — DEBT-02 source of truth: phase manifest

- The subcommand derives each row (`Plans Complete`, `Status`, `Completed` date) from the phase manifest / plan state files under `.planning/phases/*`, **not** by parsing `- [x]` / `- [ ]` checkboxes in `PLAN.md`.
- Every call regenerates the full progress table from manifest truth — not just the row for the currently executing phase — so corrections and back-edits are handled consistently.
- **Why:** Manifest is structured, already the execution state-of-record; checkbox parsing is fragile to format drift.

### D4 — DEBT-02 conflict handling: marker-bounded overwrite

- The progress table region in `ROADMAP.md` is delimited by stable markers (e.g. `<!-- gsd:progress:start -->` / `<!-- gsd:progress:end -->` — exact tokens are Claude's Discretion, but must be human-visible and documented in the ROADMAP).
- Auto-update **overwrites everything between the markers**, unconditionally.
- Everything **outside** the markers is preserved byte-for-byte.
- If the markers are missing on first run, the subcommand must insert them at the correct location in the `## Progress` section.
- **Why:** Explicit region ownership; zero ambiguity; manual edits outside the markers survive.

## Claude's Discretion (not decided here)

- Exact subcommand name, flag surface, and output format of the gsd-tools command.
- Exact marker token strings (must be stable once chosen).
- Whether to reuse an existing route helper or introduce a small `buildDashboardRoute(...)` helper for DEBT-01.
- Test shape (unit vs snapshot for the table renderer).
- Whether DEBT-02 also updates the `v3.0-ROADMAP.md` historical file (default: **no** — only the active roadmap).

## Out of Scope / Deferred

- Full dashboard audit for other string-nav usages.
- Backfilling progress tables in archived milestone roadmaps.
- Any UI/UX change to the dashboard items themselves (DEBT-01 is a type-safety refactor, not a redesign).
- Auto-updating other `.planning/` docs (STATE.md, REQUIREMENTS.md coverage tables) — capture as backlog if desired.

## Downstream Notes

**For `gsd-phase-researcher`:**

- Locate the OPS-03 and OPS-07 dashboard components (start at `frontend/src/routes` + operations hub / dashboard features) and enumerate every string-URL `navigate(...)` / `<Link to="...">` they use.
- Confirm which TanStack Router route IDs + params/search schemas are the correct typed targets.
- Inspect `gsd-tools.cjs` CLI structure (`bin/gsd-tools.cjs`) for the right place to add a `roadmap sync-progress`-style subcommand.
- Inspect how `gsd-executor` currently commits plan state and where the post-commit hook should fire.
- Read the current `## Progress` section of `.planning/ROADMAP.md` and propose stable marker tokens + exact row schema.

**For `gsd-planner`:**

- Expect ~2 plans: (1) DEBT-01 router refactor for OPS-03 + OPS-07, (2) DEBT-02 `gsd-tools` subcommand + executor integration + marker bootstrap in ROADMAP.md.
- Each plan gets its own atomic commit; DEBT-02 plan should include a self-test: run the new subcommand and assert the ROADMAP table matches manifest state.

## Next Step

```
/gsd-plan-phase 19
```
