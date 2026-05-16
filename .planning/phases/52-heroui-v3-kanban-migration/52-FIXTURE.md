# Phase 52 — Kanban Fixture Engagement Contract

**Owner:** Phase 52 Plan 05 Task 1
**Created:** 2026-05-16
**Status:** Contract published; staging verification deferred to host-side execution post-worktree-merge

---

## Purpose

The 8 Playwright specs created in Phase 52 Plan 01 (visual × 2, dnd × 2, keyboard × 2, a11y × 2)
need a seeded engagement on staging with a known workflow_stage composition so that:

1. Visual baselines are deterministic — the same 4 viewport × 2 direction screenshots are rendered every run.
2. The drag/keyboard specs always have a card in the `todo` column to pick up.
3. The cancelled column is rendered (TasksTab gates it on `cancelled.length > 0`), exercising the
   `border-danger/30` border-only cue per CONTEXT.md D-07.

---

## Engagement composition contract (CONTEXT.md D-16)

A single engagement on staging Supabase (project `zkrcjzdemdmwhearhfgg`, region `eu-west-2`) must
have exactly this `workflow_stage` distribution across its `assignments` rows where
`assignments.engagement_id = <fixture-engagement-id>`:

| workflow_stage | count |
| -------------- | ----- |
| `todo`         | 2     |
| `in_progress`  | 2     |
| `review`       | 1     |
| `done`         | 2     |
| `cancelled`    | 1     |
| **total**      | **8** |

---

## Fixture engagement UUID

```
00000000-0000-0052-0000-000000000001
```

This is the canonical Phase 52 fixture UUID. It is reserved (Phase 52 is reflected in the
3rd UUID segment `0052`) and stable across local + staging runs.

---

## Env var contract

All 8 Phase 52 spec files read the fixture engagement id via:

```typescript
const SEEDED_ENGAGEMENT_ID =
  process.env.PHASE_52_FIXTURE_ENGAGEMENT_ID ?? '00000000-0000-0052-0000-000000000001'
```

The fallback is the canonical UUID above. Two acceptable run modes:

| Mode             | `PHASE_52_FIXTURE_ENGAGEMENT_ID` in `.env.test` | Behavior                                                                        |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Canonical        | unset                                           | Specs use the hardcoded UUID; the seed migration (below) must have been applied |
| Override (local) | set to a different UUID                         | Specs target the override; useful when staging has a different engagement       |

The canonical run mode is preferred for CI determinism (matches Phase 40-12 precedent).

`.env.test.example` is updated in this plan to document the env var.

---

## Path A vs Path B — host-side decision

The worktree-side executor for Plan 52-05 cannot deterministically pick between Path A
(reuse existing) and Path B (apply seed migration) because:

- The Supabase MCP `execute_sql` tool is not present in the parallel-executor agent's tool list (only the orchestrator has it on the host).
- The assignments table carries a `unique_active_assignment` partial unique index on
  `(work_item_id, work_item_type)` for `status IN ('assigned', 'in_progress')` plus a
  deferrable unique constraint on the same pair (see
  `supabase/migrations/20251002007_create_assignments.sql`). A blind seed migration that
  fabricates 8 `work_item_id` values risks colliding with existing production-shape rows.
- The assignments table requires `assignee_id REFERENCES auth.users(id)` with NOT NULL;
  injecting fixture rows from a migration without coordinating with `auth.users` would
  fail RLS / FK checks.
- Engagement seeds require a parent `dossier_id` and `created_by` — both FKs to live data
  in staging that varies between environments.

Therefore the recommended host-side procedure for Plan 52-05 Task 1 finalization is:

### Procedure (host operator runs after merging this worktree)

1. **Discover** an existing staging engagement that matches the D-16 composition:

   ```sql
   -- Run via Supabase MCP execute_sql against project zkrcjzdemdmwhearhfgg
   SELECT e.id, e.title,
          COUNT(*) FILTER (WHERE a.workflow_stage = 'todo')        AS todo,
          COUNT(*) FILTER (WHERE a.workflow_stage = 'in_progress') AS in_progress,
          COUNT(*) FILTER (WHERE a.workflow_stage = 'review')      AS review,
          COUNT(*) FILTER (WHERE a.workflow_stage = 'done')        AS done,
          COUNT(*) FILTER (WHERE a.workflow_stage = 'cancelled')   AS cancelled
   FROM engagements e
   JOIN assignments a ON a.engagement_id = e.id
   GROUP BY e.id, e.title
   HAVING COUNT(*) FILTER (WHERE a.workflow_stage = 'todo')        = 2
      AND COUNT(*) FILTER (WHERE a.workflow_stage = 'in_progress') = 2
      AND COUNT(*) FILTER (WHERE a.workflow_stage = 'review')      = 1
      AND COUNT(*) FILTER (WHERE a.workflow_stage = 'done')        = 2
      AND COUNT(*) FILTER (WHERE a.workflow_stage = 'cancelled')   = 1
   LIMIT 1;
   ```

2. **If found:** record the UUID and set `PHASE_52_FIXTURE_ENGAGEMENT_ID=<uuid>` in
   `.env.test` on the host.

3. **If not found:** the host operator constructs the seed migration manually using the
   actual live `auth.users.id` of the test user (`$TEST_USER_EMAIL`) as both `created_by`
   on the engagement row and `assignee_id` on the 8 assignment rows, references a real
   `dossiers.id` (any active dossier), and applies via Supabase MCP `apply_migration`.

   The seed migration MUST:
   - Use the canonical engagement UUID `00000000-0000-0052-0000-000000000001`.
   - Use 8 fixed assignment UUIDs following `00000000-0000-0052-0001-00000000000X` (X=1..8).
   - Generate 8 unique fabricated `work_item_id` UUIDs scoped to a single `work_item_type`
     that does not collide with existing rows (the operator chooses a `work_item_type` per
     staging inspection).
   - Set `status='in_progress'` for `workflow_stage='in_progress'` rows and `status='assigned'`
     for `workflow_stage='todo'` rows (the trigger at migration `20251003000_*` syncs them).
   - Use `ON CONFLICT (id) DO UPDATE SET workflow_stage = EXCLUDED.workflow_stage,
updated_at = NOW()` for idempotency.

4. **Post-apply verification (host-side):**

   ```sql
   SELECT a.workflow_stage, COUNT(*)
   FROM assignments a
   WHERE a.engagement_id = '00000000-0000-0052-0000-000000000001'
   GROUP BY a.workflow_stage
   ORDER BY a.workflow_stage;
   ```

   Expected:

   ```
   cancelled   1
   done        2
   in_progress 2
   review      1
   todo        2
   ```

This procedure intentionally lives in the host-side runbook (this file) rather than as a
checked-in migration because the migration body is non-deterministic: it depends on live
FK targets that vary per environment. Phase 40-12 (the precedent cited in 52-RESEARCH A7)
used the same "build via MCP per-environment" pattern for the same reason.

---

## Why this contract is deferred to host-side execution

This worktree (`isolation="worktree"` parallel-executor) does NOT have:

- `node_modules` installed — cannot run `pnpm install` because that mutates the worktree state and would inflate the worktree force-remove cost
- Live Supabase MCP access — the executor agent's tool list does NOT include `mcp__claude_ai_Supabase__*` even though they are advertised; only the orchestrator on the host has those tools
- `.env.test` with live credentials — credentials live only in the developer/host workspace; the worktree gets the redacted `.env.test.example`

Per CLAUDE.md §Karpathy Coding Principles #1 ("Don't assume. Don't hide confusion. Surface tradeoffs."),
this contract is being published as the deliverable and the actual staging mutation + Playwright
baseline generation are explicitly deferred to host-side execution — surfaced via the
`checkpoint:human-verify` gate at the end of Plan 52-05.

---

## References

- CONTEXT.md D-16 — fixture composition contract
- CONTEXT.md D-14 — spec matrix
- 52-RESEARCH.md Assumption A7 + Open Question 2 — fixture seeding strategy
- Phase 40-12 — precedent for idempotent seed migrations via Supabase MCP
- Phase 40-20 — `ON CONFLICT (id) DO UPDATE` pattern reference

---

_Phase: 52-heroui-v3-kanban-migration_
_Plan: 05_
_Task: 1_
