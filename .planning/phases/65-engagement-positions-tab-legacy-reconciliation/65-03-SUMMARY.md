---
phase: 65-engagement-positions-tab-legacy-reconciliation
plan: 03
subsystem: positions
tags: [legacy-reconciliation, deletion, deprecation, engagement-positions, ENGPOS-01]
requires:
  - 'Phase 64 canonical position_dossier_links plane (positions-dossiers-create edge + clearance RLS)'
provides:
  - 'Legacy engagement_positions frontend stack deleted (5 files); i18n engagement_section block removed (en+ar)'
  - 'Three engagements-positions-* edges carry source-level DEPRECATED headers pointing to the canonical plane'
  - 'Scope-fence + undeploy-deferral record for the phase (cross-surface legacy hazards)'
affects:
  - 'frontend/src/components/positions/ (3 deletions)'
  - 'frontend/src/components/dossier/ (1 deletion)'
  - 'frontend/src/hooks/ (1 deletion)'
  - 'frontend/src/i18n/{en,ar}/positions.json'
  - 'supabase/functions/engagements-positions-{attach,list,detach}/index.ts (comment-only)'
tech-stack:
  added: []
  patterns:
    - 'Deletion gated on a live service-role REST emptiness probe before the destructive commit'
    - 'Comment-only source deprecation (deploy artifact unchanged; undeploy deferred as an environment action)'
key-files:
  created: []
  modified:
    - 'frontend/src/i18n/en/positions.json'
    - 'frontend/src/i18n/ar/positions.json'
    - 'supabase/functions/engagements-positions-attach/index.ts'
    - 'supabase/functions/engagements-positions-list/index.ts'
    - 'supabase/functions/engagements-positions-detach/index.ts'
  deleted:
    - 'frontend/src/components/dossier/EngagementDossierDetail.tsx'
    - 'frontend/src/components/positions/EngagementPositionsSection.tsx'
    - 'frontend/src/hooks/useEngagementPositions.ts'
    - 'frontend/src/components/positions/PositionSuggestionsPanel.tsx'
    - 'frontend/src/components/positions/BriefingPackGenerator.tsx'
decisions:
  - 'ENGPOS-01 legacy half: delete the orphaned engagement_positions frontend stack rather than migrate (0 rows, write-deny RLS, no migration provenance — nothing to migrate)'
  - 'Deletion boundary = the COMPONENT layer (5 files); deeper barrel-exported suggestions plumbing KEPT and recorded as dead-code follow-up'
  - 'Edge undeploy DEFERRED to an environment action; source-level deprecation header is the in-repo deliverable'
metrics:
  duration: ~12 min
  completed: 2026-06-12
  tasks: 2
  commits: 2
  files_deleted: 5
  files_modified: 5
---

# Phase 65 Plan 03: Engagement Positions Legacy Reconciliation Summary

Deleted the orphaned `engagement_positions` frontend stack (5 dead files) and its i18n block after re-confirming the legacy staging table is still empty, then marked the three zero-caller `engagements-positions-*` edge functions deprecated in source — implementing the losing half of the ENGPOS-01 canonical-source decision so the legacy plane cannot be silently extended.

## What Was Built

### Task 1 — Delete the dead stack (commit `62cb8c69`)

**Import-graph re-verification (execution-time grep, not the 2026-06-12 RESEARCH map):** the five targets form a fully closed, dead chain with no external importers:

| Module                       | Imported by (only)            |
| ---------------------------- | ----------------------------- |
| `EngagementDossierDetail`    | nothing inside `frontend/src` |
| `EngagementPositionsSection` | `EngagementDossierDetail`     |
| `useEngagementPositions`     | `EngagementPositionsSection`  |
| `PositionSuggestionsPanel`   | `EngagementPositionsSection`  |
| `BriefingPackGenerator`      | `EngagementPositionsSection`  |

No unexpected importer appeared, so the STOP rule did not fire.

**Staging emptiness gate (RESEARCH Open Q4 re-check):** ran the service-role PostgREST probe from `.env.test` immediately before the deletion commit. **No secret values were echoed at any point.** Probe shape and evidence:

- `GET {SUPABASE_URL}/rest/v1/engagement_positions?select=id&limit=3` with `apikey` + `Authorization: Bearer` = `SUPABASE_SERVICE_ROLE_KEY`
- Response: HTTP `200`, body `[]`
- Exact-count probe (`Prefer: count=exact`, `Range: 0-0`): `Content-Range: */0` → **0 rows confirmed**

Gate passed → proceeded to delete the five files and swept the orphaned `engagement_section.*` block from BOTH `frontend/src/i18n/en/positions.json` and `ar/positions.json` (the only consumers died in this commit; the preceding `},` trailing comma was tightened so both JSON files stay valid). No other positions.json key was touched.

**Gates:** `pnpm type-check` exit 0, `pnpm build` exit 0 (chunk-size warnings are pre-existing advisory). `grep` confirms zero surviving references to any of the five module names and no `engagement_section` in either JSON file.

### Task 2 — Deprecate the legacy edges (commit `2585a295`)

Prepended a comment-only `DEPRECATED` header (7 lines, identical) to the top of each of the three edge `index.ts` files:

- `supabase/functions/engagements-positions-attach/index.ts`
- `supabase/functions/engagements-positions-list/index.ts`
- `supabase/functions/engagements-positions-detach/index.ts`

Each header names the ENGPOS-01 decision, identifies the legacy substrate (`engagements` table + `engagement_positions`: 0 rows, write-deny RLS, no migration provenance), points to the canonical replacement (`position_dossier_links` keyed by `dossiers.id`, written via the `positions-dossiers-create` edge), and records that undeploy is deferred. **No functional line of any edge changed** — `git diff` confirms every added line is a `//` comment; the deployed artifact is unchanged.

## Deferrals & Scope Fences (recorded for the phase)

### Edge undeploy — DEFERRED (environment action)

The three `engagements-positions-*` edges remain **deployed-but-deprecated**. Undeploy is a Supabase-CLI environment action with no executor MCP access (RESEARCH Assumption A4). Zero in-repo callers are verified; the residual risk is a hidden external caller (scripts/automations), so leave-deployed is the conservative posture until an operator undeploys them.

### NOT-this-phase fences (record, do not fix — verbatim from RESEARCH §Legacy Reconciliation)

- **`briefing-packs-generate` reads `engagement_positions`** (RESEARCH L126/L200): if briefing packs are ever resurrected, that surface will see **zero** canonical attaches. Cross-surface hazard — recording it is the deliverable; do NOT wire it to the legacy plane.
- **`positions-list` dossier filter joins `engagement_positions`** (RESEARCH L103-105/L201): latent stale path. Safe today because `AttachPositionDialog` calls `usePositions({ status:'published' })` **without** a dossier filter. **Never start passing one.**
- **Tasks/assignments kanban plane straddles legacy `engagements` ids**: canonicalization is its own phase-sized slice — not in scope here.
- **`dossiers-get` extension map points `engagement` → legacy `engagements`**: harmless `maybeSingle` miss — recorded, not fixed.

### Dead-code follow-up candidates (KEPT this phase)

- **Deeper suggestions plumbing** — `src/domains/positions/hooks/usePositionSuggestions.ts`, `src/hooks/usePositionSuggestions.ts`, `getPositionSuggestions` in `src/domains/positions/repositories/positions.repository.ts`, the `PositionSuggestion*` types in `src/domains/positions/types/index.ts`, and the `src/domains/positions/index.ts` barrel exports. These are now orphaned of UI consumers (their only renderers — `PositionSuggestionsPanel`/`EngagementPositionsSection` — were deleted) BUT they are **barrel-exported domain API**, not workspace UI. Sweeping them in a parallel wave-1 plan risks type-check fallout (the planner verified the chain is wider than RESEARCH stated), so they are kept and recorded as a follow-up.
- **`src/pages/engagements/EngagementDetailPage.tsx`** — unrouted (zero importers), but NOT touched by this deletion chain. Out of scope per Karpathy surgical-changes; recorded as a dead-code candidate only.

## Deviations from Plan

None — plan executed exactly as written. The emptiness gate was runnable from this environment via service-role REST against `.env.test`, so the deletion proceeded under the primary path (no fallback needed). Dependencies were restored once via `pnpm install --frozen-lockfile` at the worktree root (node_modules was absent on spawn — lockfile restore only, no new packages).

## Authentication Gates

None.

## Verification Evidence

- Task 1 automated verify: `STACK_DELETED` (zero surviving refs + no `engagement_section` in either JSON, type-check green)
- Task 2 automated verify: `EDGES_MARKED` (all three headers present + `positions-dossiers-create` pointer in attach) + comment-only diff confirmed
- `pnpm type-check` exit 0; `pnpm build` exit 0; both JSON files parse-valid
- Clean working tree, no untracked files; both task commits present on the worktree-agent branch

## Self-Check: PASSED

- Deleted files confirmed gone on disk: all 5
- Modified files exist: 2 i18n JSON + 3 edge index.ts
- Commits exist: `62cb8c69` (Task 1), `2585a295` (Task 2)
