# Phase 19: Tech Debt Cleanup — Research

**Researched:** 2026-04-08
**Domain:** Frontend routing type-safety + GSD tooling internals
**Confidence:** HIGH

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D1** — DEBT-01 scope is tight: only OPS-03 and OPS-07. Do NOT audit other dashboard string-nav usages. Anything found outside → deferred.
- **D2** — DEBT-02 hook lives as a `gsd-tools.cjs` subcommand; `gsd-executor` invokes it after each atomic plan commit.
- **D3** — DEBT-02 source of truth = phase manifest / plan-state files under `.planning/phases/*` (NOT `- [x]` checkbox parsing). Every call regenerates the FULL table.
- **D4** — Marker-bounded overwrite: `<!-- gsd:progress:start -->` / `<!-- gsd:progress:end -->` (exact tokens are Claude's discretion); content between markers is overwritten unconditionally; everything outside is byte-for-byte preserved; if markers missing on first run, insert them in the `## Progress` section.

### Claude's Discretion

- Exact subcommand name / flag surface / output format.
- Exact marker token strings (must be stable once chosen).
- Reuse existing route helper vs. introduce small `buildDashboardRoute(...)` helper.
- Test shape (unit vs snapshot for the table renderer).
- Whether DEBT-02 also touches `v3.0-ROADMAP.md` historical file (default: NO).

### Deferred Ideas (OUT OF SCOPE)

- Full dashboard audit for other string-nav usages.
- Backfilling progress tables in archived milestone roadmaps.
- UI/UX changes to OPS-03/OPS-07 (refactor only, no redesign).
- Auto-updating other `.planning/` docs (STATE.md, REQUIREMENTS.md tables).

## Phase Requirements

| ID      | Description                                                                                  | Research Support                                                                                                               |
| ------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| DEBT-01 | OPS-03 + OPS-07 use TanStack Router typed `navigate({ to, params })` instead of string URLs  | Found exact callsites + confirmed typed route IDs in `routeTree.gen.ts`                                                        |
| DEBT-02 | `## Progress` table in `.planning/ROADMAP.md` regenerates from manifest on every plan commit | Located existing partial impl in `gsd-tools.cjs roadmap update-plan-progress`; identified extension point + executor hook line |

## Summary

DEBT-01 is small and surgical. Only **two** components actually need touching: `EngagementStageGroup.tsx` (OPS-03 — has 2 string-URL `navigate(...)` callsites) and `ActionBar.tsx` (OPS-07 — has 0 navigate calls; "New Engagement" / "New Request" / Cmd+K open the WorkCreation palette / dispatch a synthetic keyboard event, no router calls at all). The typed target route exists and is fully type-known: `/_protected/engagements/$engagementId/`.

DEBT-02 is a meaningful extension of an EXISTING subcommand. `gsd-tools.cjs roadmap update-plan-progress <N>` already exists (lib/roadmap.cjs:250) and is already invoked by `gsd-executor` (line 468 of `~/.claude/agents/gsd-executor.md`). However, today it (a) regex-patches a single row by phase number, (b) does NOT regenerate the whole table, (c) has no marker-bounded region, and (d) reads phase plans/summaries from disk (which already aligns with D3 — manifest-derived). The work is to add a sibling subcommand (e.g. `roadmap sync-progress`) that rebuilds the entire region between `<!-- gsd:progress:start -->` / `<!-- gsd:progress:end -->` from the same disk source, bootstrapping the markers if missing, and then have `gsd-executor` call THIS new command instead of (or in addition to) the existing per-row update.

**Primary recommendation:**

- DEBT-01: Replace 2 string-template `navigate({ to: \`/engagements/${id}\` })` calls in `EngagementStageGroup.tsx` with `navigate({ to: '/engagements/$engagementId', params: { engagementId: engagement.id } })`. No `buildDashboardRoute(...)` helper needed for two callsites — overhead > value. ActionBar requires zero router changes (verify and document; do not invent navigations to "satisfy" the requirement).
- DEBT-02: Add `roadmap sync-progress` subcommand that calls a new pure function `renderProgressTable(phasesFromDisk)` returning the markdown table rows; wrap the region in markers; insert markers on first run by anchoring on the existing `## Progress` heading + the existing `| Phase ... | Completed |` table header. Reuse the existing `findPhaseInternal` / disk-scan logic in `lib/roadmap.cjs` for the source data. Replace the per-phase `update-plan-progress` call in `gsd-executor` step with `sync-progress` (or chain both for backwards-compat one milestone).

## Standard Stack

### Core

| Library                    | Version                                          | Purpose            | Why Standard                                                                                                     |
| -------------------------- | ------------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| @tanstack/react-router     | v5 (already installed; routeTree.gen.ts present) | Typed routing      | Project standard; routeTree gives full FileRoutesByPath types [VERIFIED: routeTree.gen.ts:110, 1388, 1452, 1834] |
| Node.js fs/path (CommonJS) | bundled                                          | gsd-tools mutation | gsd-tools is a `.cjs` script, no deps [VERIFIED: bin/gsd-tools.cjs shebang + lib/roadmap.cjs]                    |

No new dependencies needed for either deliverable.

### Alternatives Considered

| Instead of                                                 | Could Use                           | Tradeoff                                                                                                                                                    |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inline typed `navigate({ to, params })` at the 2 callsites | `buildDashboardRoute(stage)` helper | Helper adds indirection for 2 sites; defer until we have 4+.                                                                                                |
| Extending existing `update-plan-progress` in place         | New `sync-progress` subcommand      | New command keeps backwards-compat for any caller still using row-only update; cleaner separation of "patch one row" vs "rebuild whole table". Recommended. |

## Architecture Patterns

### DEBT-01 — Typed Navigation Pattern

TanStack Router v1+/v5 typed pattern:

```tsx
// CURRENT (string template — type-unsafe)
void navigate({ to: `/engagements/${engagement.id}` })

// TARGET (typed — params split out, route ID is a literal that FileRoutesByPath validates)
void navigate({
  to: '/engagements/$engagementId',
  params: { engagementId: engagement.id },
})
```

The route literal `'/engagements/$engagementId'` is present in `routeTree.gen.ts` lines 1388 and 1452 (`/engagements/$engagementId/` index), so passing it as `to` is fully type-checked against `FileRoutesByPath`.

### DEBT-02 — Marker-Bounded Region Pattern

Standard idiom for "tool-owned" sections in human-edited markdown. Insertion algorithm:

1. Read `ROADMAP.md`.
2. If `<!-- gsd:progress:start -->` and `<!-- gsd:progress:end -->` both present → replace content between (exclusive of markers themselves).
3. If neither present → locate the existing `## Progress` heading line, find the existing table (header row starts with `| Phase`), wrap the existing table block with the markers (markers go on their own lines, blank line above and below for readability).
4. If only one marker present → error out (do NOT silently re-insert; corruption signal).
5. Always write atomically (write to `.tmp` then rename) to avoid half-written file on crash. The existing `withPlanningLock(cwd, ...)` wrapper at `lib/roadmap.cjs:280` should be reused.

### Anti-Patterns to Avoid

- **Parsing `- [x]` checkboxes for state** — explicitly forbidden by D3. Use only the disk inventory (`{phase}-{plan}-PLAN.md` count vs `{phase}-{plan}-SUMMARY.md` count) which the existing `findPhaseInternal` already produces.
- **Touching content outside the markers** — explicitly forbidden by D4.
- **Adding `buildDashboardRoute` for 2 callsites** — premature abstraction; OPS-07 has 0 router calls so the helper would only ever be used by the 2 OPS-03 callsites which are identical.
- **Trying to "fix" OPS-07 ActionBar to use `navigate(...)`** — it intentionally does not navigate. New Engagement/Request open a modal palette via `useWorkCreation().openPalette(...)`; Cmd+K dispatches a synthetic `KeyboardEvent`. Phase 19 should explicitly note this and close DEBT-01 on OPS-07 with "no string-nav present — verified".

## Don't Hand-Roll

| Problem                      | Don't Build             | Use Instead                                                                                             | Why                                                                                                             |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Phase plan/summary inventory | Custom directory walker | Existing `findPhaseInternal()` / `cmdRoadmapAnalyze()` in `lib/roadmap.cjs`                             | Already handles plan/summary counting, milestone grouping, completion detection; reused by 4+ existing commands |
| Markdown table generation    | String templating       | Small pure function `renderProgressRow({phase, milestone, summaryCount, planCount, status, completed})` | Stay testable; existing column padding logic at `lib/roadmap.cjs:295` (`status.padEnd(11)`) sets the precedent  |
| File locking                 | Custom flock            | `withPlanningLock(cwd, fn)` from existing helper                                                        | Already prevents concurrent corruption between executor sub-processes                                           |
| Atomic writes to ROADMAP.md  | Custom temp+rename      | Same `withPlanningLock` already in use at line 280                                                      | Consistency                                                                                                     |

## Common Pitfalls

### Pitfall 1: Multi-line table region with embedded blank lines

**What goes wrong:** Naive marker scan that uses `indexOf` then `substring` will work, but a regex with `[\s\S]*?` can backtrack pathologically on a long ROADMAP.
**How to avoid:** Use `indexOf(START_MARKER)` + `indexOf(END_MARKER)` and slice — no regex for the region replacement itself.

### Pitfall 2: Phase numbering with decimal phases

**What goes wrong:** Phase 19.1 must sort between 19 and 20, not at the end.
**How to avoid:** `findPhaseInternal` already returns sorted-by-numeric phases; the new `sync-progress` should rely on the existing sort, NOT re-sort lexically.

### Pitfall 3: Status enum drift

**What goes wrong:** Existing function emits `Complete` / `In Progress` / `Planned` (line 271). Current ROADMAP table uses `Complete` / `Not started`. Mismatch will visibly flicker the table.
**How to avoid:** `sync-progress` MUST use the SAME status vocabulary that already appears in the table. Capture the canonical set in a constant: `STATUS = { complete: 'Complete', in_progress: 'In Progress', planned: 'Planned', not_started: 'Not started' }`. Map `phaseInfo.summaries.length === 0 && plans.length === 0` → `Not started`.

### Pitfall 4: Phase row label drift

**What goes wrong:** Existing rows use a hand-written display label (e.g. `"19. Tech Debt Cleanup"`) that differs from the phase directory name (`19-tech-debt-cleanup`). If `sync-progress` regenerates from directory names, all 18 prior rows will visibly change formatting.
**How to avoid:** Source the display label from the phase manifest's `name` field (the same field `state begin-phase --name` writes), NOT the directory slug. Verify all 18 prior phase manifests have a `name` field before first run; if any are missing, the bootstrap step must back-fill them OR the renderer must fall back to title-casing the slug. **OPEN QUESTION → see Open Questions #1.**

### Pitfall 5: ActionBar Cmd+K dispatches synthetic KeyboardEvent

**What goes wrong:** A planner unfamiliar with the file may try to "modernize" the Cmd+K handler at `ActionBar.tsx:51-55` to use TanStack Router. It is intentionally a global keyboard dispatch (the listener lives in `CommandPalette.tsx`).
**How to avoid:** Plan must explicitly leave Cmd+K alone.

## Code Examples

### DEBT-01 — Exact Replacement (2 sites in one file)

**File:** `frontend/src/pages/Dashboard/components/EngagementStageGroup.tsx`

Lines 93-95 (onClick):

```tsx
// BEFORE
onClick={(): void => {
  void navigate({ to: `/engagements/${engagement.id}` })
}}

// AFTER
onClick={(): void => {
  void navigate({
    to: '/engagements/$engagementId',
    params: { engagementId: engagement.id },
  })
}}
```

Lines 96-101 (onKeyDown):

```tsx
// BEFORE
onKeyDown={(e: React.KeyboardEvent): void => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    void navigate({ to: `/engagements/${engagement.id}` })
  }
}}

// AFTER
onKeyDown={(e: React.KeyboardEvent): void => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    void navigate({
      to: '/engagements/$engagementId',
      params: { engagementId: engagement.id },
    })
  }
}}
```

**That is the entire DEBT-01 code change.** No other files in OPS-03/OPS-07 contain string-template `navigate(...)` calls.

### DEBT-02 — Subcommand Skeleton

```js
// lib/roadmap.cjs (additions)
const PROGRESS_START = '<!-- gsd:progress:start -->'
const PROGRESS_END = '<!-- gsd:progress:end -->'

function renderProgressTable(phases) {
  const header = [
    '| Phase                               | Milestone | Plans Complete | Status      | Completed  |',
    '| ----------------------------------- | --------- | -------------- | ----------- | ---------- |',
  ]
  const rows = phases.map((p) => {
    const planCount = p.plans.length
    const summaryCount = p.summaries.length
    const isComplete = planCount > 0 && summaryCount >= planCount
    const status = isComplete
      ? 'Complete'
      : summaryCount > 0
        ? 'In Progress'
        : planCount > 0
          ? 'Planned'
          : 'Not started'
    const completed = isComplete ? p.completedDate || '-' : '-'
    return `| ${p.displayLabel.padEnd(35)} | ${p.milestone.padEnd(9)} | ${`${summaryCount}/${planCount || 'TBD'}`.padEnd(14)} | ${status.padEnd(11)} | ${completed.padEnd(10)} |`
  })
  return [...header, ...rows].join('\n')
}

function cmdRoadmapSyncProgress(cwd, raw) {
  withPlanningLock(cwd, () => {
    const phases = collectPhasesFromDisk(cwd) // wraps existing analyze logic
    const table = renderProgressTable(phases)
    const region = `${PROGRESS_START}\n\n${table}\n\n${PROGRESS_END}`
    let content = fs.readFileSync(planningPaths(cwd).roadmap, 'utf-8')
    const startIdx = content.indexOf(PROGRESS_START)
    const endIdx = content.indexOf(PROGRESS_END)
    if (startIdx !== -1 && endIdx !== -1) {
      content = content.slice(0, startIdx) + region + content.slice(endIdx + PROGRESS_END.length)
    } else if (startIdx === -1 && endIdx === -1) {
      // bootstrap: replace existing | Phase ... | table block under ## Progress
      content = bootstrapMarkers(content, region)
    } else {
      error('ROADMAP.md has only one progress marker — manual repair required')
    }
    fs.writeFileSync(planningPaths(cwd).roadmap, content, 'utf-8')
  })
  output({ updated: true }, raw, 'progress synced')
}
```

### Executor Hook Point

**File:** `~/.claude/agents/gsd-executor.md` line 468 (already present):

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap update-plan-progress "${PHASE_NUMBER}"
```

Replace with (or add directly after):

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap sync-progress
```

Note: `sync-progress` takes NO phase argument — it rebuilds the whole table from disk per D3.

## Runtime State Inventory

This is a code/tooling change, not a rename — but per Step 2.5 protocol:

| Category            | Items Found                                                                                                                                     | Action Required |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Stored data         | None — verified, no DB writes involved                                                                                                          | none            |
| Live service config | None — verified, no external service config                                                                                                     | none            |
| OS-registered state | None — verified, no scheduled tasks or daemons                                                                                                  | none            |
| Secrets/env vars    | None — verified, no env var references                                                                                                          | none            |
| Build artifacts     | None — `gsd-tools.cjs` is a plain Node script, no build step. Frontend rebuild will auto-pick up `EngagementStageGroup.tsx` change via Vite HMR | none            |

**One concern:** the existing `roadmap update-plan-progress` is referenced in at least 2 places in `gsd-executor.md` (lines 468 and 483). All call sites must be updated together or `sync-progress` must coexist (recommended). Cross-reference grep needed for any other GSD command file referencing `update-plan-progress` — see Open Questions #2.

## Common Pitfalls (additional)

### Pitfall 6: `withPlanningLock` re-entrancy

**What goes wrong:** If `gsd-executor` calls `commit` which internally calls `update-plan-progress` which calls `sync-progress`, nested `withPlanningLock` invocations may deadlock if the lock is non-reentrant.
**How to avoid:** Verify the lock implementation in `lib/security.cjs` or wherever `withPlanningLock` lives. If non-reentrant, ensure the executor calls `sync-progress` AFTER `commit` returns (sequential, not nested). **Verify before plan task ordering — Open Questions #3.**

## State of the Art

| Old Approach                                                     | Current Approach                                     | When Changed                 | Impact                                         |
| ---------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------- | ---------------------------------------------- |
| String-URL `navigate({ to: \`/foo/${id}\` })` in TanStack Router | Typed `navigate({ to: '/foo/$id', params: { id } })` | TanStack Router v1 GA (2024) | Type errors at compile time when routes change |
| Per-row regex patching of progress tables                        | Marker-bounded full regen from manifest              | (this phase)                 | Idempotent, no row-format drift                |

## Assumptions Log

| #   | Claim                                                                                                                                                                           | Section                       | Risk if Wrong                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| A1  | All 18 prior phase manifests have a `name` field that matches the existing display labels in the progress table                                                                 | Pitfall 4 / DEBT-02 bootstrap | First `sync-progress` run reformats every row visibly; planner needs a back-fill step |
| A2  | `withPlanningLock` is non-reentrant (typical posix flock behavior)                                                                                                              | Pitfall 6                     | If re-entrant, sequencing constraint is unnecessary                                   |
| A3  | `update-plan-progress` is only referenced in `gsd-executor.md` (not other GSD command files like `gsd-quick`, `gsd-debug`, `gsd-execute-plan`)                                  | Runtime State / Open Q#2      | Stale callers will keep doing single-row patches; harmless but inconsistent           |
| A4  | The existing `## Progress` table in `.planning/ROADMAP.md` is the only progress table in the active milestone roadmap (no second table in `v3.0-ROADMAP.md` that needs syncing) | Sync target                   | Per D5 default = NO, so this is locked anyway                                         |

## Open Questions

1. **Phase manifest `name` field availability**
   - What we know: Existing rows show hand-tuned labels like `"1. Dead Code & Toolchain"`, `"8. Navigation & Route Consolidation"`. The `state begin-phase --name S` API exists (gsd-tools.cjs:17).
   - What's unclear: Whether all 18 prior phases have a manifest file with a `name` field, and whether that field matches the displayed label byte-for-byte.
   - Recommendation: Planner Wave 0 task — read all 18 phase manifests, dump their `name` fields, diff against current ROADMAP labels. If diff is non-empty: the bootstrap step must either (a) write current labels back into manifests, or (b) keep a small `phase_label_overrides.json` in `.planning/`.

2. **Other callers of `roadmap update-plan-progress`**
   - What we know: 2 references in `~/.claude/agents/gsd-executor.md`.
   - What's unclear: Whether `gsd-execute-plan`, `gsd-quick`, `gsd-debug`, `gsd-orchestrator`, etc. also call it.
   - Recommendation: Planner Wave 0 — `Grep update-plan-progress` across `~/.claude/agents/` and `~/.claude/get-shit-done/workflows/`. Update all callers in lockstep, OR keep `update-plan-progress` as a thin wrapper that internally calls `sync-progress`.

3. **`withPlanningLock` re-entrancy**
   - What we know: It is wrapped around the existing `update-plan-progress` body (line 280).
   - What's unclear: Whether nested calls deadlock or are no-ops.
   - Recommendation: 5-minute read of `lib/security.cjs` (or wherever the function is exported) before plan execution starts. If non-reentrant, plan must NOT call `sync-progress` from inside `commit` or `update-plan-progress`.

## Environment Availability

| Dependency                       | Required By          | Available | Version                                  | Fallback |
| -------------------------------- | -------------------- | --------- | ---------------------------------------- | -------- |
| Node.js                          | gsd-tools.cjs        | ✓         | 20+ (project requires 20.19.0)           | —        |
| pnpm                             | frontend rebuild     | ✓         | 10.29.1                                  | —        |
| TypeScript compiler              | DEBT-01 type check   | ✓         | 5.9 (frontend)                           | —        |
| TanStack Router routeTree.gen.ts | DEBT-01 typed routes | ✓         | present at frontend/src/routeTree.gen.ts | —        |

No missing dependencies. No fallback required.

## Validation Architecture

### Test Framework

| Property            | Value                                                                                |
| ------------------- | ------------------------------------------------------------------------------------ |
| Frontend framework  | Vitest + @testing-library/react                                                      |
| Frontend config     | `frontend/vitest.config.ts` (existing)                                               |
| Backend / tooling   | Vitest at workspace root                                                             |
| Frontend quick run  | `pnpm --filter frontend test EngagementStageGroup`                                   |
| GSD tools quick run | `node ~/.claude/get-shit-done/bin/gsd-tools.cjs roadmap sync-progress --raw` (smoke) |
| Full suite          | `pnpm test`                                                                          |
| TS gate             | `pnpm typecheck` (DEBT-01 success criterion = 0 errors after change)                 |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                   | Test Type                                  | Automated Command                                              | File Exists? |
| ------- | -------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------- | ------------ |
| DEBT-01 | Clicking an engagement in OPS-03 navigates to `/engagements/$engagementId` | unit (RTL)                                 | `pnpm --filter frontend test EngagementStageGroup`             | ❌ Wave 0    |
| DEBT-01 | Pressing Enter on a focused engagement row navigates                       | unit (RTL)                                 | same file                                                      | ❌ Wave 0    |
| DEBT-01 | `pnpm typecheck` passes (proves typed `to` is correct)                     | TS gate                                    | `pnpm typecheck`                                               | ✓            |
| DEBT-02 | `roadmap sync-progress` with no markers bootstraps them in `## Progress`   | unit (Vitest on tooling) OR shell snapshot | `node bin/gsd-tools.cjs roadmap sync-progress` against fixture | ❌ Wave 0    |
| DEBT-02 | `roadmap sync-progress` with markers replaces only the region              | unit / snapshot                            | same                                                           | ❌ Wave 0    |
| DEBT-02 | Re-running is idempotent (byte-equal output)                               | unit                                       | run twice, diff                                                | ❌ Wave 0    |
| DEBT-02 | Content outside markers is byte-preserved                                  | unit                                       | hash before/after of pre-marker + post-marker slices           | ❌ Wave 0    |
| DEBT-02 | Single-marker (corrupted) input errors out                                 | unit                                       | expect non-zero exit                                           | ❌ Wave 0    |
| DEBT-02 | End-to-end: run executor on a fixture phase, assert table updates          | integration                                | manual / ad-hoc shell                                          | manual       |

### Sampling Rate

- Per task commit: `pnpm typecheck` (DEBT-01) or `node bin/gsd-tools.cjs roadmap sync-progress --raw` (DEBT-02)
- Per wave merge: `pnpm --filter frontend test` + `pnpm typecheck`
- Phase gate: full `pnpm test` green + manual run of `sync-progress` against the live `.planning/ROADMAP.md` with diff inspection

### Wave 0 Gaps

- [ ] `frontend/src/pages/Dashboard/components/__tests__/EngagementStageGroup.test.tsx` — covers DEBT-01 click/keyboard navigation with mocked `useNavigate`
- [ ] `~/.claude/get-shit-done/bin/lib/__tests__/roadmap-sync-progress.test.cjs` — fixtures for marker-present, marker-absent, single-marker, idempotency, byte-preservation
- [ ] Verify `withPlanningLock` re-entrancy (Open Q#3) before writing tests

## Project Constraints (from CLAUDE.md)

- **TanStack Router v5** — typed routing is the project standard. DEBT-01 directly enforces this.
- **No `any`** (`@typescript-eslint/no-explicit-any: error`) — typed `params` object is fine, no `any` casts.
- **Explicit return types** — already present on the modified handlers.
- **No floating promises** — keep the `void navigate(...)` prefix that the current code uses.
- **Prettier**: no semicolons, single quotes, 2 spaces, trailing commas, 100-char width — match the surrounding file exactly.
- **GSD workflow enforcement** — both deliverables ARE going through `/gsd-plan-phase 19`, so this is satisfied.
- **Bilingual / RTL** — DEBT-01 changes do not touch any text or layout. No i18n impact. No RTL impact.

## Sources

### Primary (HIGH confidence)

- `frontend/src/pages/Dashboard/components/EngagementStageGroup.tsx:93-101` — exact OPS-03 navigation callsites [VERIFIED: file read]
- `frontend/src/pages/Dashboard/components/ActionBar.tsx:38-106` — confirmed OPS-07 ActionBar contains zero string-URL `navigate(...)` calls [VERIFIED: full file read]
- `frontend/src/pages/Dashboard/components/EngagementsZone.tsx:1-99` — wrapper contains no nav calls either [VERIFIED: full file read]
- `frontend/src/routeTree.gen.ts:110, 1388, 1452, 1834` — confirmed `/engagements/$engagementId` typed route exists [VERIFIED]
- `~/.claude/get-shit-done/bin/gsd-tools.cjs:454-467, 630-642` — `commit` and `roadmap` subcommand routing [VERIFIED]
- `~/.claude/get-shit-done/bin/lib/roadmap.cjs:250-347` — existing `cmdRoadmapUpdatePlanProgress` body and patching strategy [VERIFIED]
- `~/.claude/agents/gsd-executor.md:468, 483, 529` — current executor hook points and verification checklist for the progress update [VERIFIED]
- `.planning/ROADMAP.md:167-194` — existing `## Progress` section with 19 rows, 5 columns, no markers yet [VERIFIED]
- `.planning/phases/19-tech-debt-cleanup/19-CONTEXT.md` — locked decisions D1–D4 [VERIFIED]

### Secondary (MEDIUM confidence)

- TanStack Router typed `navigate({ to, params })` API — based on routeTree.gen.ts shape [VERIFIED via codebase usage]

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**

- DEBT-01 callsite enumeration: HIGH — every relevant file read in full.
- DEBT-01 typed route target: HIGH — present in generated route tree.
- DEBT-02 existing tooling: HIGH — full read of existing function and command routing.
- DEBT-02 manifest field availability (Pitfall 4 / Open Q#1): MEDIUM — not yet verified across all 18 phases.
- DEBT-02 cross-caller inventory (Open Q#2): MEDIUM — only `gsd-executor.md` checked.
- `withPlanningLock` re-entrancy (Open Q#3): LOW — not yet inspected.

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable areas, no fast-moving deps)

## Handoff to gsd-planner

**Expect ~2 plans per CONTEXT downstream notes:**

### Plan 19-01 — DEBT-01 Typed Router Navigation (OPS-03 + OPS-07)

- Files touched: **1** (`frontend/src/pages/Dashboard/components/EngagementStageGroup.tsx`)
- Net diff: ~6 lines changed (2 callsites, ~3 lines each)
- New tests: `EngagementStageGroup.test.tsx` covering click + keyboard (Wave 0)
- OPS-07 task: explicit verification + comment in `ActionBar.tsx` documenting "no string-nav present, intentionally uses WorkCreation palette + synthetic Cmd+K dispatch" — close out the requirement.
- Gate: `pnpm typecheck` clean, new tests green.
- No DB, no migration, no i18n, no RTL impact.

### Plan 19-02 — DEBT-02 Marker-bounded `roadmap sync-progress`

**Wave 0 (research/setup):**

- Resolve Open Q#1 (manifest `name` field availability across 18 phases) — read all manifests, produce diff report.
- Resolve Open Q#2 (other callers of `update-plan-progress`) — grep `~/.claude/`.
- Resolve Open Q#3 (`withPlanningLock` re-entrancy) — read `lib/security.cjs`.

**Wave 1 (implementation):**

- Add constants `PROGRESS_START` / `PROGRESS_END` to `lib/roadmap.cjs`.
- Add pure `renderProgressTable(phases)` and `bootstrapMarkers(content, region)`.
- Add `cmdRoadmapSyncProgress(cwd, raw)`.
- Wire `case 'sync-progress'` into the `roadmap` switch in `bin/gsd-tools.cjs:630-642`.
- Update help text at the top of `gsd-tools.cjs` (lines 44-47).

**Wave 2 (executor integration):**

- Update `~/.claude/agents/gsd-executor.md:468` to call `roadmap sync-progress` (no phase arg).
- Update line 483 description and line 529 checklist accordingly.
- (Conditional on Open Q#2) update any additional callers found.

**Wave 3 (bootstrap + self-test):**

- Run `node bin/gsd-tools.cjs roadmap sync-progress` against the actual `.planning/ROADMAP.md` to insert markers for the first time.
- Diff: assert that the only changes are (a) marker insertion and (b) any required label normalization.
- Re-run twice: assert byte-equal output (idempotency).
- Manually edit a comment OUTSIDE the markers, run again, assert preserved byte-for-byte.
- Commit ROADMAP.md with markers + table.

**Tests:**

- Vitest fixture suite under `lib/__tests__/roadmap-sync-progress.test.cjs` — at minimum: bootstrap, replace, idempotency, byte-preservation, single-marker error.

**Self-test (per CONTEXT downstream notes for planner):**

- Run `sync-progress` and assert the regenerated table matches manifest state.

**Atomic commits:** one per wave at minimum; Wave 1 should be 2-3 commits (constants + render fn, bootstrap fn, command wiring).

### Things the planner should NOT do

- Do NOT introduce `buildDashboardRoute` for OPS-03 (only 2 callsites, both identical, in the same file).
- Do NOT modify `ActionBar.tsx` Cmd+K handler or `openPalette` calls.
- Do NOT audit any other dashboard files for string-nav (D1).
- Do NOT parse `- [x]` checkboxes in PLAN.md to derive plan state (D3).
- Do NOT modify `.planning/v3.0-ROADMAP.md` or any archived roadmap (D-default + Deferred).
- Do NOT modify `.planning/STATE.md` or `REQUIREMENTS.md` coverage tables (Deferred).

## Security Domain

Not applicable in the standard ASVS sense — this phase touches no auth, no input handling, no crypto, no user data. The two relevant integrity concerns are:

| Concern                                         | Mitigation                                                  |
| ----------------------------------------------- | ----------------------------------------------------------- |
| `sync-progress` corrupts `ROADMAP.md` mid-write | Reuse `withPlanningLock` + write-then-rename atomicity      |
| Single-marker corruption silently masked        | Explicit error on partial-marker state (do not auto-repair) |

No new attack surface introduced. No new secrets, no network calls, no file uploads.
