# Plan 19-02 Wave 0 Notes

## OQ1 — Phase manifest `name` field availability

**Finding:** This project has NO `.manifest.json` files under `.planning/phases/*`. GSD's
phase model here is purely directory-based (`NN-slug/` containing `*-PLAN.md`,
`*-SUMMARY.md`, `*-CONTEXT.md`, `*-RESEARCH.md`). `state begin-phase` does not write a
manifest in this install.

**Existing phase directories:** `14-production-deployment`, `15-notification-backend-in-app`,
`16-email-push-channels`, `17-seed-data-first-run`, `18-e2e-test-suite`,
`19-tech-debt-cleanup`. Phases 1–13 are historical/pre-GSD and have no on-disk
directories — yet they appear in the ROADMAP `## Progress` table with curated display
labels (e.g. `1. Dead Code & Toolchain`, `8. Navigation & Route Consolidation`).

**Label mismatch:** Directory slug → ROADMAP label is NOT a deterministic transform.
Examples:

- `14-production-deployment` → "14. Production Deployment" (title-case works)
- `15-notification-backend-in-app` → "15. Notification Backend & In-App" (`&` not derivable from slug)
- `17-seed-data-first-run` → "17. Seed Data & First Run" (`&` again)
- `19-tech-debt-cleanup` → "19. Tech Debt Cleanup"

**Decision (renderer label source):**
The renderer treats the **existing ROADMAP `## Progress` table** as the seed for phase
metadata (phase number → display label, milestone). Disk inventory provides the
authoritative `Plans Complete` count and `Status`/`Completed` columns for any phase whose
directory exists. Phases that exist only in the table (no on-disk directory) are
**preserved as-is** so the historical pre-GSD rows survive untouched. New phases that
exist on disk but not yet in the table are appended with milestone `TBD` and label
`${num}. ${titleCase(slug.split('-').slice(1).join(' '))}`.

This is a tighter interpretation of D3 than the plan literally states ("manifest state")
but is the only viable interpretation given (a) no manifests exist in this install and
(b) curated labels with `&` cannot round-trip from slugs. The "source of truth" for
**counts and status** is still disk inventory — which is the bug DEBT-02 actually
addresses. Labels were already correct in the existing table; what was drifting was
counts/status/dates.

## OQ2 — Other callers of `update-plan-progress`

`grep -rn "roadmap update-plan-progress" $HOME/.claude/agents $HOME/.claude/get-shit-done/workflows`:

| File                                                     | Line | Context                                    |
| -------------------------------------------------------- | ---- | ------------------------------------------ |
| `$HOME/.claude/agents/gsd-executor.md`                   | 468  | Shell invocation in atomic commit step     |
| `$HOME/.claude/agents/gsd-executor.md`                   | 483  | Description text in command behavior list  |
| `$HOME/.claude/agents/gsd-executor.md`                   | 529  | Verification checklist line                |
| `$HOME/.claude/get-shit-done/workflows/execute-phase.md` | 435  | Verification checklist (out of plan scope) |
| `$HOME/.claude/get-shit-done/workflows/execute-phase.md` | 558  | Shell invocation (out of plan scope)       |
| `$HOME/.claude/get-shit-done/workflows/execute-plan.md`  | 447  | Shell invocation (out of plan scope)       |

**Decision:**

- Plan 19-02 frontmatter `files_modified` only authorizes `gsd-executor.md`, NOT the
  workflow files. Update only the 3 gsd-executor.md call sites in Task 3.
- Workflow file call sites continue to invoke `update-plan-progress` — protected by the
  backward-compat wrapper `cmdRoadmapUpdatePlanProgress` which delegates to
  `cmdRoadmapSyncProgress`.
- This means workflows still pass a `${PHASE_NUMBER}` argument; the wrapper accepts and
  ignores it (since `sync-progress` rebuilds the whole table). No breakage.

## OQ3 — `withPlanningLock` re-entrancy

**Finding:** `bin/lib/core.cjs:583` implements the lock with `fs.writeFileSync(lockPath,
..., { flag: 'wx' })`. The `wx` flag fails with `EEXIST` if the file already exists, then
the loop waits 100ms and retries up to 10s, after which it force-removes the lock and
acquires.

**Behavior:** **NON-REENTRANT.** A nested call from the same process would:

1. See its own lock file already on disk
2. Loop for 10 seconds hitting `EEXIST`
3. Eventually force-acquire (the 10s timeout path)
4. Release the lock on inner-fn return — leaving the OUTER call running without a lock
5. The outer call's `finally` then tries to `unlinkSync` an already-deleted lock — caught
   silently

So nested calls don't deadlock thanks to the timeout escape, but they introduce a 10s
delay AND silently break mutual exclusion. **Treat as non-reentrant.**

**Decision (call ordering constraints):**

1. `cmdRoadmapSyncProgress` acquires `withPlanningLock` itself.
2. `cmdRoadmapUpdatePlanProgress` (the backward-compat wrapper) MUST NOT wrap its
   delegation in its own lock. Its new body is simply
   `return cmdRoadmapSyncProgress(cwd, raw)` — the inner function acquires the lock.
3. `gsd-executor.md` invokes `roadmap sync-progress` as a separate process AFTER the
   `commit` shell call returns — sequential, no nesting concern.
