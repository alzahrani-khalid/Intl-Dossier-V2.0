---
phase: 47
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/package.json
  - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md
  - backend/src/types/database.types.ts
  - backend/src/types/intake-entity-links.types.ts
  - backend/src/types/ai-suggestions.types.ts
  - backend/src/types/after-action.types.ts
  - backend/src/types/**
  - backend/src/api/after-action.ts
  - backend/src/api/intake-entity-links.ts
  - backend/src/api/task-contributors.ts
  - backend/src/api/tasks.ts
  - backend/src/api/countries.ts
  - backend/src/api/mous.ts
  - backend/src/api/events.ts
  - backend/src/api/positions.ts
  - backend/src/api/signatures.ts
  - backend/src/api/permissions.ts
  - backend/src/api/ai/intake-linking.ts
  - backend/src/api/**
  - backend/src/services/interaction-note-service.ts
  - backend/src/services/clustering.service.ts
  - backend/src/services/auth.service.ts
  - backend/src/services/signature.service.ts
  - backend/src/services/query-parser.service.ts
  - backend/src/services/link.service.ts
  - backend/src/services/**
  - backend/src/services/__tests__/auth.service.test.ts
  - backend/src/services/__tests__/**
  - backend/src/models/position-consistency.model.ts
  - backend/src/models/**
  - backend/src/models/__tests__/Country.test.ts
  - backend/src/models/__tests__/**
  - backend/src/middleware/optimistic-locking.ts
  - backend/src/middleware/**
  - backend/src/config/redis.ts
  - backend/src/config/**
  - backend/src/utils/logger.ts
  - backend/src/utils/**
  - backend/src/ai/**
  - backend/src/ai/__tests__/**
  - backend/src/lib/**
  - backend/src/integrations/**
  - backend/src/queues/**
  - backend/src/jobs/**
autonomous: true
requirements: [TYPE-02, TYPE-04]
must_haves:
  truths:
    - 'pnpm --filter backend type-check exits 0 on a fresh clone'
    - 'Net-new @ts-ignore / @ts-expect-error introduced during this plan equals 0'
    - 'Auto-generated backend/src/types/database.types.ts retains every Tables/TablesInsert/TablesUpdate/Enums/CompositeTypes/Constants helper byte-for-byte (a top-of-file @ts-nocheck makes its 6 TS6196 errors disappear without touching generated content)'
    - 'No exported symbol in backend/src/types/{intake-entity-links,ai-suggestions}.types.ts is deleted without confirming via D-04 four-globbed-grep that no frontend OR backend consumer remains'
    - 'Backend test files inside src/**/__tests__/* (in tsc graph per RESEARCH §4.4) are fixed in place, never excluded by editing tsconfig'
  artifacts:
    - path: 'backend/package.json'
      provides: 'type-check:summary script (executor histogram convenience)'
      contains: '"type-check:summary":'
    - path: '.planning/phases/47-type-check-zero/47-EXCEPTIONS.md'
      provides: 'Backend baseline histogram appended; backend final histogram appended; generated-file allowlist row for backend/src/types/database.types.ts'
      contains: 'Backend baseline histogram'
    - path: 'backend/src/types/database.types.ts'
      provides: 'First line is // @ts-nocheck (auto-generated; regenerated on supabase gen types — must remain untouched)'
      contains: '// @ts-nocheck'
  key_links:
    - from: 'CI (current Lint job line 68 → after 47-03, dedicated type-check job)'
      to: 'backend/package.json scripts.type-check'
      via: 'pnpm --filter backend type-check (tsc --noEmit)'
      pattern: 'tsc --noEmit'
    - from: 'Express handlers in src/api/*'
      to: "ParsedQs narrowing (String(req.query.foo ?? '')) and explicit return paths"
      via: 'systemic micro-edit pattern resolving 47% of backend errors (RESEARCH §7.4)'
      pattern: "req\\.query\\."
phase_decisions_locked:
  D-11_database_types_strategy: '@ts-nocheck at top of backend/src/types/database.types.ts (mirrors 47-01 Task 2 frontend decision). Logged in 47-EXCEPTIONS.md.'
  D-04_cross_workspace_fence: 'backend/src/types/{intake-entity-links,ai-suggestions}.types.ts are consumed by 5+5 frontend files via deep relative imports (RESEARCH §4.2). Every export deletion in those two files MUST run the four-globbed-grep recipe against frontend/src, backend/src, supabase/functions, tests, shared. Anything ambiguous flags into 47-EXCEPTIONS.md as deferred, not deleted by reflex.'
  systemic_api_pattern: "47% of backend errors live in src/api/* (232 errors), dominated by TS2345 (ParsedQs not assignable to string, ~132) and TS7030 (not all code paths return, ~59). These are repeated-pattern fixes (`String(req.query.foo ?? '')` and explicit `return` on error branches), not 132 unique fixes. Task 3 captures this as a single bulk-pattern sweep across src/api/* (excluding after-action.ts, which is Task 4)."
  test_files_in_graph: 'backend/tsconfig.json excludes top-level `tests/` only. Test files in src/**/__tests__/* DO participate in the tsc graph (RESEARCH §4.4 + §11.3) and contribute to the 498 baseline. Task 8 explicitly fixes them; tsconfig is not edited per D-11.'
  ts2307_module_drift: "Some test files (e.g. backend/src/ai/__tests__/brief-generation.integration.test.ts) error TS2307 because the imported module no longer exists. Per RESEARCH §11.8, the executor must distinguish 'fix the import' (path drift) from 'delete the test' (module truly removed). Task 8 lists the affected test files for human-read."
---

<objective>
Drive `pnpm --filter backend type-check` from 498 errors to 0. Backend skews real-fix tail (67.9%) over deletions (32.1%) — the dominant patterns are TS2345 (ParsedQs argument mismatch, 132) and TS7030 (missing return path, 59), both clustered in `src/api/*` and resolvable as a single repeated micro-edit per file.

**Purpose:** TYPE-02 is the second half of the v6.2 quality-gate reset foundation. Same gate-flip story as 47-01 — once 47-01 + 47-02 land, 47-03 can split the CI job and turn on branch protection without inheriting a red build.

**Output:** Backend tsc exit code 0 on a clean clone, plus a `type-check:summary` script appended next to its frontend counterpart, plus the backend half of the `EXCEPTIONS.md` ledger.

**Scope note:** Task count exceeds the 5-task soft cap; mitigated by the highly-mechanical, repeating-pattern nature of each directory sweep. If executor stalls, replan with directory boundaries split.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/47-type-check-zero/47-CONTEXT.md
@.planning/phases/47-type-check-zero/47-RESEARCH.md
@.planning/phases/47-type-check-zero/47-VALIDATION.md
@.planning/research/Q1-ci-gate-status.md
@.planning/codebase/CONVENTIONS.md
@.planning/codebase/STRUCTURE.md
@./CLAUDE.md
@backend/tsconfig.json
@backend/package.json

<interfaces>
<!-- Cross-workspace fence (RESEARCH §4.2 / §8). 10 frontend files import deep-relative from backend/src/types/*.
     This plan IS allowed to edit backend/src/types/* — but every deletion of an exported symbol
     MUST first pass the D-04 four-globbed-grep recipe to confirm no frontend consumer remains. -->

Frontend → backend type consumers (verified RESEARCH §4.2 — deletion targets to verify):
../../../../backend/src/types/database.types — 5 frontend files (tasks/\*, kanban/KanbanBoard)
../../../../backend/src/types/intake-entity-links.types — 4 frontend files (entity-links/{LinkTypeBadge,LinkList,EntityLinkManager,EntitySearchDialog})
../../../../backend/src/types/ai-suggestions.types — 1 frontend file (entity-links/AISuggestionPanel)

Pre-existing backend suppressions: NONE (RESEARCH §11.12 enumerated all 3 — they're frontend).
This means no TYPE-04 ledger work is needed for backend; only the @ts-nocheck on the generated
database.types.ts (Task 2) gets logged.

D-03 deletion policy:
Default fix for TS6133 (123) and TS6196 (37) = DELETE. Backend has 160 deletion-eligible errors out of 498.
Never `_`-prefix rename. Never disable noUnusedLocals / noUnusedParameters.
Never add @ts-ignore / @ts-expect-error to mask any error (D-01).

D-04 verification recipe (BEFORE deleting any export in backend/src/types/{intake-entity-links,ai-suggestions,...}):
grep -rn "ExportedSymbolName" frontend/src backend/src 2>/dev/null
grep -rn "ExportedSymbolName" supabase/functions 2>/dev/null
grep -rn "ExportedSymbolName" tests 2>/dev/null
grep -rn "ExportedSymbolName" shared 2>/dev/null
All four must return 0 hits before deletion.

Systemic API pattern (RESEARCH §7.4):
TS2345 "ParsedQs not assignable to string" → wrap with `String(req.query.foo ?? '')` or destructure with explicit type
`const { foo } = req.query as { foo?: string };` Use the latter only if the route runtime guarantees the shape.
TS7030 "Not all code paths return a value" → add explicit `return res.status(...).json(...);` on every branch in
Express handlers; do NOT change to `void` return types (would break the Router signature).

TS2589 (deep instantiation, 5 errors): per RESEARCH §11.9 these may be legitimate Supabase
upstream issues. If a real fix is impossible, file an EXCEPTIONS.md entry per D-02 with
upstream issue link AND follow-up issue link — DO NOT silently @ts-ignore.
</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                         | Description                                                                                                                                                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| backend → frontend types         | `backend/src/types/{intake-entity-links,ai-suggestions}.types.ts` are consumed by frontend via deep relative imports. Deleting "unused" exports here can break the frontend cross-workspace import.                         |
| Supabase codegen → backend types | `backend/src/types/database.types.ts` is regenerated by `supabase gen types typescript`. Hand-edits inside the file are wiped on next regen.                                                                                |
| Source code → CI gate            | Adding `@ts-ignore` / `@ts-expect-error` defeats TYPE-02 by masking instead of fixing.                                                                                                                                      |
| Test files → tsc graph           | Backend `src/**/__tests__/*.test.ts` are inside the type-check graph (RESEARCH §4.4 — only top-level `tests/` is excluded). Adding tests to `tsconfig.exclude` would silently drop test type-checking — forbidden per D-11. |

## STRIDE Threat Register

| Threat ID       | Category  | Component                                                                                            | Disposition | Mitigation Plan                                                                                                                                                                                                                                                                                                         |
| --------------- | --------- | ---------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| T-47-02         | Tampering | backend/src/types/{intake-entity-links,ai-suggestions}.types.ts (and any backend export with TS6196) | mitigate    | D-04 four-globbed-grep recipe runs against frontend/src AND backend/src AND supabase/functions AND tests AND shared on every export deletion. Encoded as `<read_first>` and `<acceptance_criteria>` on Task 2 (types/_) and Task 3 (api/_ systemic). Symbols with any hit are flagged in 47-EXCEPTIONS.md, not deleted. |
| T-47-03         | Tampering | every code-fix task in this plan                                                                     | mitigate    | Each task's acceptance includes `git diff <task-base>..HEAD -- backend/src \| grep -E '^\\+.*@ts-(ignore\|expect-error)' \| wc -l` returns 0. The Final task scans the entire plan diff and matches against EXCEPTIONS.md.                                                                                              |
| T-47-04 (local) | Tampering | backend/src/types/database.types.ts                                                                  | mitigate    | Top-of-file `@ts-nocheck` is the only edit allowed in this generated file. The acceptance criterion checks (a) line 1 is `// @ts-nocheck`, (b) `git diff` shows only the 1-2 line addition at the top, (c) `EXCEPTIONS.md` records the file with reason "auto-generated Supabase types".                                |
| T-47-05 (local) | Tampering | backend/tsconfig.json (test exclusion)                                                               | mitigate    | Acceptance criterion on Task 8 (test files): `git diff <task-base>..HEAD -- backend/tsconfig.json                                                                                                                                                                                                                       | wc -l` returns 0 — tsconfig is byte-unchanged. Tests are fixed in place, not excluded. |

</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: Wave 0 — type-check:summary script + 47-EXCEPTIONS.md backend baseline</name>
  <files>backend/package.json, .planning/phases/47-type-check-zero/47-EXCEPTIONS.md</files>
  <read_first>
    - backend/package.json (locate existing `"type-check": "tsc --noEmit"` at line 15)
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §3 (canonical histogram methodology + recommended script form including the trailing `|| true`)
    - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md (created by 47-01 Task 1; this task appends the backend baseline section, does NOT recreate the file)
    - .planning/phases/47-type-check-zero/47-VALIDATION.md (Wave 0 Requirements section — exact script string)
  </read_first>
  <action>
    0. **Phase-base tag guard (Issue 4 fix; 47-01 Task 1 may have already created it):**
       ```bash
       git rev-parse phase-47-base 2>/dev/null || git tag phase-47-base $(git rev-parse HEAD)
       git push origin phase-47-base 2>/dev/null || true
       ```
       Idempotent — if 47-01 Task 1 already created and pushed the tag, this no-ops cleanly.
    1. Edit `backend/package.json` scripts block (next to existing `"type-check": "tsc --noEmit"` at line 15). Add:
       ```jsonc
       "type-check:summary": "tsc --noEmit 2>&1 | grep -oE 'TS[0-9]+' | sort | uniq -c | sort -rn || true"
       ```
    2. Append to `47-EXCEPTIONS.md` `## Backend baseline histogram` section: paste the output of `pnpm --filter backend type-check:summary` (498 errors, top codes per RESEARCH §3 backend table — TS2345 132, TS6133 123, TS7030 59, TS6196 37, etc.).
    3. If 47-EXCEPTIONS.md does not yet exist (47-01 Task 1 has not run), create it with both the frontend-baseline placeholder and the backend baseline. The two plans run in parallel; the executor must `git pull` and resolve any append-conflict before committing. (Backend has no pre-existing `@ts-expect-error` per RESEARCH §11.12, so no backend pre-seeded ledger rows are required — only the frontend rows seeded by 47-01 Task 1.)
  </action>
  <verify>
    <automated>
      git rev-parse phase-47-base   # MUST return a SHA (tag created here or by 47-01 Task 1)
      pnpm --filter backend run type-check:summary 2>&1 | head -20  # prints histogram
      grep -c "type-check:summary" backend/package.json  # returns 1
      grep -c "^## Backend baseline histogram" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md  # returns 1
    </automated>
  </verify>
  <acceptance_criteria>
    - `git rev-parse phase-47-base` returns a valid SHA (Issue 4 — phase-base tag exists, idempotent if 47-01 already created it).
    - `pnpm --filter backend run type-check:summary` exits 0 (because of `|| true`) and prints a non-empty histogram.
    - `grep -c "\"type-check:summary\"" backend/package.json` returns 1.
    - `grep -c "^## Backend baseline histogram" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md` returns 1.
    - `git diff phase-47-base..HEAD -- backend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
  </acceptance_criteria>
  <done>
    type-check:summary script callable; 47-EXCEPTIONS.md backend baseline appended; both committed.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Allowlist generated backend/src/types/database.types.ts via @ts-nocheck + clean hand-authored backend/src/types/*</name>
  <files>backend/src/types/database.types.ts, backend/src/types/intake-entity-links.types.ts, backend/src/types/ai-suggestions.types.ts, backend/src/types/after-action.types.ts, backend/src/types/**, .planning/phases/47-type-check-zero/47-EXCEPTIONS.md</files>
  <read_first>
    - backend/src/types/database.types.ts (first 5 lines only — confirm Supabase header; do NOT read the rest of the 38 759-line file)
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §4.1 (six TS6196 hits inside this file — same Tables/TablesInsert/TablesUpdate/Enums/CompositeTypes/Constants pattern as frontend), §4.2 (D-04 verification recipe), §8 (cross-workspace consumers of intake-entity-links + ai-suggestions)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md D-04, D-11
    - backend/src/types/intake-entity-links.types.ts (consumed by 4 frontend files — every export deletion needs D-04 grep)
    - backend/src/types/ai-suggestions.types.ts (consumed by 1 frontend file — same)
    - backend/src/types/after-action.types.ts (8 errors per RESEARCH §7.3 — hand-authored, deletion-eligible after D-04)
  </read_first>
  <action>
    1. **Allowlist step:** Prepend two lines to `backend/src/types/database.types.ts` (above the existing Supabase header):
       ```typescript
       // @ts-nocheck — auto-generated by `supabase gen types typescript`. Regenerated on every schema migration; do not hand-edit.
       // The exported helpers (Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes, Constants) emit TS6196 because no in-repo consumer imports them yet, but they are part of the standard Supabase generator output. See 47-EXCEPTIONS.md and Phase 47 RESEARCH §4.1.
       ```
       Append the corresponding row to `47-EXCEPTIONS.md ## Retained suppressions (TYPE-04 ledger)` (mirroring 47-01 Task 2's frontend row).
    2. **intake-entity-links.types.ts and ai-suggestions.types.ts cleanup with cross-workspace D-04:**
       a. Capture each file's TS6133/TS6196 errors via `pnpm --filter backend type-check 2>&1 | grep -E "^src/types/(intake-entity-links|ai-suggestions)\.types\.ts"`.
       b. For every TS6196 (unused exported symbol):
          ```
          grep -rn "<SymbolName>" frontend/src backend/src
          grep -rn "<SymbolName>" supabase/functions
          grep -rn "<SymbolName>" tests
          grep -rn "<SymbolName>" shared
          ```
          - All four 0 hits → DELETE.
          - Any hits → SKIP, append row to EXCEPTIONS.md `## Deferred deletions (cross-surface consumers)` with the exact grep evidence.
       c. TS6133 (unused locals/imports) inside the same files → DELETE outright.
    3. **after-action.types.ts and any other backend/src/types/*.ts** (Task RESEARCH §7.3 backend top-25): same D-03 + D-04 sweep.
    4. **Forbidden:** editing `backend/tsconfig.json`, editing the body (lines below the @ts-nocheck) of `backend/src/types/database.types.ts`, or running `supabase gen types`.
    5. After edits: `pnpm --filter backend type-check 2>&1 | grep '^src/types/' | wc -l` should be ≤5 (residual real-type-fix tail; bulk of ~30 baseline removed).
  </action>
  <verify>
    <automated>
      head -1 backend/src/types/database.types.ts | grep -c "@ts-nocheck"   # returns 1
      git diff backend/src/types/database.types.ts | grep -E "^[+-]" | grep -vE "^(\+\+\+|---)" | grep -vE "^\+(// @ts-nocheck|// The exported helpers)" | wc -l   # returns 0
      pnpm --filter backend type-check 2>&1 | grep '^src/types/' | wc -l   # < pre-task baseline (~30)
      git diff <task-base>..HEAD -- backend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
    </automated>
  </verify>
  <acceptance_criteria>
    - `head -1 backend/src/types/database.types.ts | grep -c '@ts-nocheck'` returns 1.
    - `git diff backend/src/types/database.types.ts` shows only the 2 prepended comment lines.
    - `pnpm --filter backend type-check 2>&1 | grep '^src/types/' | wc -l` ≤ 5.
    - For every deleted symbol in `intake-entity-links.types.ts` or `ai-suggestions.types.ts`, the D-04 grep evidence is captured in commit message OR a deferred-deletions EXCEPTIONS.md row exists.
    - `git diff <task-base>..HEAD -- frontend/src | wc -l` returns 0 (47-02 does not touch frontend source).
    - `git diff <task-base>..HEAD -- backend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
    - Backend total error count drops by ≥30.
  </acceptance_criteria>
  <done>
    Generated database.types.ts allowlisted; hand-authored types/* files cleaned with cross-workspace D-04 evidence captured.
  </done>
</task>

<task type="auto">
  <name>Task 3: src/api/* systemic ParsedQs + return-path sweep (~175 errors, excludes after-action.ts)</name>
  <files>backend/src/api/intake-entity-links.ts, backend/src/api/task-contributors.ts, backend/src/api/tasks.ts, backend/src/api/countries.ts, backend/src/api/mous.ts, backend/src/api/events.ts, backend/src/api/positions.ts, backend/src/api/signatures.ts, backend/src/api/permissions.ts, backend/src/api/ai/intake-linking.ts, backend/src/api/**</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §7.3 (top-25 backend file list — 9 of 25 are src/api/* totaling ~118 errors, plus ai/intake-linking.ts), §7.4 (`src/api` 232 errors total — 47% of backend; dominated by TS2345 ParsedQs and TS7030 missing return path; both are systemic patterns resolvable with a small repeated micro-edit per file)
    - backend/src/api/tasks.ts (16 errors — read full file to find the ParsedQs pattern; same shape will repeat across the rest)
    - backend/src/api/countries.ts (14 errors — second example for pattern confirmation)
  </read_first>
  <action>
    Process all `src/api/*.ts` files EXCEPT `after-action.ts` (Task 4 handles the largest single file separately).

    Strategy:
    1. Capture pre-task baseline: `pnpm --filter backend type-check 2>&1 | grep '^src/api/' | grep -v 'after-action.ts' > /tmp/47-02-api-baseline.txt`.
    2. Identify the two systemic patterns:
       - **TS2345 ParsedQs** (~132 hits across all backend, most in src/api/*): wherever `req.query.<name>` is passed where a `string` is expected, replace with `String(req.query.<name> ?? '')` OR destructure once at the top of the handler:
         ```typescript
         const { foo, bar } = req.query as { foo?: string; bar?: string };
         ```
         Use the destructure form when the route's runtime contract guarantees the shape (most internal endpoints). Use `String(... ?? '')` for endpoints that may receive arrays.
       - **TS7030 Not all code paths return a value** (~59 hits): each Express handler must have an explicit `return` in every branch. Replace `res.status(...).json(...)` with `return res.status(...).json(...)` on every error branch and `return next(err)`/`return;` on every fall-through. Do NOT change return types to `void` (breaks the Router signature).
    3. Process files in descending error count: intake-entity-links.ts (20), task-contributors.ts (17), tasks.ts (16), countries.ts (14), mous.ts (11), ai/intake-linking.ts (11), events.ts (10), signatures.ts (9), positions.ts (9), permissions.ts (8), then any remaining src/api/*.ts file with ≥1 error.
    4. **Forbidden:** widening to `any`, adding `@ts-ignore` / `@ts-expect-error`, or rewriting handler bodies for clarity (Karpathy "surgical changes" — only the minimum diff that fixes the TS error).
    5. Re-run `pnpm --filter backend type-check 2>&1 | grep '^src/api/' | grep -v 'after-action.ts' | wc -l` and confirm 0.

  </action>
  <verify>
    <automated>
      pnpm --filter backend type-check 2>&1 | grep '^src/api/' | grep -v 'after-action.ts' | wc -l   # returns 0
      git diff <task-base>..HEAD -- backend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
      git diff <task-base>..HEAD -- backend/src | grep -cE '^\+.*\bas any\b'   # ≤ pre-task count (no new `as any`)
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter backend type-check 2>&1 | grep '^src/api/' | grep -v 'after-action.ts' | wc -l` returns 0.
    - Backend top-25 list (RESEARCH §7.3) no longer contains any src/api/* file except after-action.ts.
    - Backend total error count drops by ≥150 vs start of task.
    - `git diff <task-base>..HEAD -- backend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
    - No new `as any` introduced (count is monotonically non-increasing).
  </acceptance_criteria>
  <done>src/api/* (excluding after-action.ts) is type-clean; systemic ParsedQs + return-path patterns applied uniformly.</done>
</task>

<task type="auto">
  <name>Task 4: src/api/after-action.ts dedicated sweep (57 errors — largest single file)</name>
  <files>backend/src/api/after-action.ts</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §7.3 (after-action.ts owns 57 / 498 = 11.4% of backend total — largest single-file cluster), §7.4 (same systemic ParsedQs + return-path patterns dominate)
    - backend/src/api/after-action.ts (full file — this task is intentionally narrow so the executor can read all 57 error lines)
  </read_first>
  <action>
    Apply the same systemic patterns from Task 3 (ParsedQs narrowing, explicit return paths) to all 57 errors in this single file. Because all errors are in one file, the executor reads the whole file once, lists every error in order, and applies a single coherent edit pass — no per-handler context-switching.
  </action>
  <verify>
    <automated>
      pnpm --filter backend type-check 2>&1 | grep '^src/api/after-action.ts' | wc -l   # returns 0
      git diff <task-base>..HEAD -- backend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter backend type-check 2>&1 | grep '^src/api/after-action.ts' | wc -l` returns 0.
    - Backend total error count drops by ≥55.
  </acceptance_criteria>
  <done>after-action.ts type-clean; src/api/* in aggregate now has 0 errors.</done>
</task>

<task type="auto">
  <name>Task 5: src/services/* cluster (~136 errors)</name>
  <files>backend/src/services/interaction-note-service.ts, backend/src/services/clustering.service.ts, backend/src/services/auth.service.ts, backend/src/services/signature.service.ts, backend/src/services/query-parser.service.ts, backend/src/services/link.service.ts, backend/src/services/**</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §7.3 (top-25 backend services: interaction-note-service.ts 30, clustering.service.ts 15, auth.service.ts 12, signature.service.ts 10, query-parser.service.ts 9, link.service.ts 9), §7.4 (services 136 errors / 27% of backend — second-largest cluster after api)
    - backend/src/services/interaction-note-service.ts (30 errors)
  </read_first>
  <action>
    Process services in descending error count. Common patterns in this cluster:
      - TS2345 (Supabase chained `.from().select()` returning `unknown[]` instead of typed rows) → use the generated `Database['public']['Tables']['X']['Row']` type at the call site.
      - TS2532 / TS18048 ("Object is possibly undefined") → guard with `if (!result) throw new Error(...)` or non-null assertion only when invariant is enforced.
      - TS2589 (deep instantiation, 5 hits across backend) → if no clean fix and the chain is forced by Supabase generated types, file an EXCEPTIONS.md row with upstream issue link AND follow-up issue link per D-02 (RESEARCH §11.9). Do NOT silently @ts-ignore.
    `__tests__` subdirectory inside services is owned by Task 8 (test files); leave alone.
  </action>
  <verify>
    <automated>
      pnpm --filter backend type-check 2>&1 | grep '^src/services/' | grep -v '__tests__' | wc -l   # returns 0
      git diff <task-base>..HEAD -- backend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter backend type-check 2>&1 | grep '^src/services/' | grep -v '__tests__' | wc -l` returns 0.
    - Any TS2589 left as a documented exception has a 47-EXCEPTIONS.md row with both upstream and follow-up references per D-02.
    - Backend total error count drops by ≥130.
  </acceptance_criteria>
  <done>src/services/* (production code) type-clean.</done>
</task>

<task type="auto">
  <name>Task 6: src/models/* + src/middleware/* + src/config/* + src/utils/* (~70 errors combined)</name>
  <files>backend/src/models/position-consistency.model.ts, backend/src/models/**, backend/src/middleware/optimistic-locking.ts, backend/src/middleware/**, backend/src/config/redis.ts, backend/src/config/**, backend/src/utils/logger.ts, backend/src/utils/**</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §7.3 (top-25 backend: models/position-consistency.model.ts 7, middleware/optimistic-locking.ts 7, config/redis.ts 7, utils/logger.ts 7), §7.4 (models 25, middleware 21, config 13, utils 12 — long tail)
    - backend/tsconfig.json (confirm `tests` excluded but src/**/__tests__/* in graph)
  </read_first>
  <action>
    Process per file in descending error count. Same D-03 + D-04 + systemic patterns from Task 3.
    `__tests__` subdirectories are owned by Task 8 — skip.
  </action>
  <verify>
    <automated>
      pnpm --filter backend type-check 2>&1 | grep -E '^src/(models|middleware|config|utils)/' | grep -v '__tests__' | wc -l   # returns 0
      git diff <task-base>..HEAD -- backend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
      git diff <task-base>..HEAD -- backend/tsconfig.json | wc -l   # returns 0 (tsconfig untouched per D-11)
    </automated>
  </verify>
  <acceptance_criteria>
    - All four directories (production code only) report 0 errors.
    - tsconfig untouched.
  </acceptance_criteria>
  <done>models/middleware/config/utils production code type-clean.</done>
</task>

<task type="auto">
  <name>Task 7: src/ai/* + src/lib/* + src/integrations/* + src/queues/* + src/jobs/* (~29 errors combined)</name>
  <files>backend/src/ai/**, backend/src/lib/**, backend/src/integrations/**, backend/src/queues/**, backend/src/jobs/**</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §7.4 (ai 10, lib 6, integrations 6, queues 4, jobs 3 — small clusters)
  </read_first>
  <action>
    Quick pass — all clusters are small. Same D-03 + D-04. `__tests__` subdirectories are owned by Task 8.
  </action>
  <verify>
    <automated>
      pnpm --filter backend type-check 2>&1 | grep -E '^src/(ai|lib|integrations|queues|jobs)/' | grep -v '__tests__' | wc -l   # returns 0
      git diff <task-base>..HEAD -- backend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
    </automated>
  </verify>
  <acceptance_criteria>
    - All five directories (production code) report 0 errors.
  </acceptance_criteria>
  <done>Tail directories cleared; only test files remain.</done>
</task>

<task type="auto">
  <name>Task 8: Test files in src/**/__tests__/* — fix in place, don't exclude</name>
  <files>backend/src/services/__tests__/auth.service.test.ts, backend/src/services/__tests__/**, backend/src/ai/__tests__/brief-generation.integration.test.ts, backend/src/ai/__tests__/**, backend/src/models/__tests__/Country.test.ts, backend/src/models/__tests__/**</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §4.4 (backend tests in tsc graph), §11.3 (do NOT exclude tests via tsconfig — D-11), §11.8 (TS2307 "Cannot find module" in brief-generation.integration.test.ts may mean module deleted; flag for human read), §7.3 (top-25 backend tests: services/__tests__/auth.service.test.ts 12, models/__tests__/Country.test.ts 7)
    - backend/src/ai/__tests__/brief-generation.integration.test.ts (TS2307 — module path drift; the imported `../agents/brief-generation` may no longer exist)
    - backend/src/services/__tests__/auth.service.test.ts (12 errors)
    - backend/src/models/__tests__/Country.test.ts (7 errors)
  </read_first>
  <action>
    Process all test files inside `backend/src/**/__tests__/*.test.ts`. For each error:
      - TS2307 (Cannot find module): inspect the import path. If the module was renamed, fix the import. If the module was genuinely deleted (verify via `find backend/src -name '<moduleName>*'`), DELETE the test file. Do NOT auto-resolve TS2307 — the executor must distinguish the two cases per RESEARCH §11.8 and record the disposition in the commit message.
      - TS6133 / TS6196: same D-03 deletion.
      - TS18047 / TS2345 / etc.: real fix via test setup or explicit narrowing.
    **Forbidden:** editing `backend/tsconfig.json` to exclude `**/__tests__/**` (would silently drop test type-checking — D-11 violation).
    Re-run `pnpm --filter backend type-check 2>&1 | grep '__tests__'` and confirm 0.
  </action>
  <verify>
    <automated>
      pnpm --filter backend type-check 2>&1 | grep '__tests__' | wc -l   # returns 0
      git diff <task-base>..HEAD -- backend/tsconfig.json | wc -l   # returns 0
      git diff <task-base>..HEAD -- backend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter backend type-check 2>&1 | grep '__tests__' | wc -l` returns 0.
    - tsconfig.json is byte-unchanged.
    - For any deleted test file, the commit message records "Module `<path>` no longer exists; test file removed per RESEARCH §11.8".
  </acceptance_criteria>
  <done>Backend test files type-clean; tsconfig untouched.</done>
</task>

<task type="auto">
  <name>Task 9 (Final): Backend zero-confirm + EXCEPTIONS.md final histogram</name>
  <files>.planning/phases/47-type-check-zero/47-EXCEPTIONS.md</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md (current state — frontend baseline + backend baseline + ledger rows)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md D-01, D-02, TYPE-04
  </read_first>
  <action>
    1. Re-run histogram and confirm exit 0:
       ```bash
       pnpm --filter backend type-check; echo "exit=$?"   # MUST print exit=0
       pnpm --filter backend run type-check:summary       # empty (or header-only) histogram
       ```
    2. Append `## Backend final histogram` to 47-EXCEPTIONS.md showing the empty histogram.
    3. **Suppression-diff confirmation across the entire plan** (uses phase-47-base tag — Issue 4):
       ```bash
       git diff phase-47-base..HEAD -- backend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l
       ```
       MUST return 0. Backend has no pre-existing `@ts-expect-error`/`@ts-ignore` (RESEARCH §11.12 — all 3 are frontend), so this is unambiguous: any matches are net-new and forbidden.
    4. **TYPE-04 deferred-deletions reconciliation:** review `47-EXCEPTIONS.md ## Deferred deletions` section; for any cross-workspace symbol still flagged there, add a final note "tracked for follow-up issue" or remove the row if the symbol was eventually deleted in a later task after re-verification.
  </action>
  <verify>
    <automated>
      pnpm --filter backend type-check; echo $?   # exit 0
      git diff phase-47-base..HEAD -- backend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
      grep -c "^## Backend final histogram" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md   # returns 1
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter backend type-check; echo $?` returns `0`. (TYPE-02 SATISFIED.)
    - `git diff phase-47-base..HEAD -- backend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0 (TYPE-04 backend half: net-new = 0 — only the @ts-nocheck on database.types.ts is logged in EXCEPTIONS.md).
    - `git diff phase-47-base..HEAD -- frontend/src | wc -l` returns 0 (47-02 left frontend untouched).
    - 47-EXCEPTIONS.md has both backend baseline and backend final histogram sections.
  </acceptance_criteria>
  <done>Backend tsc exits 0; backend half of TYPE-04 ledger complete; plan summary ready.</done>
</task>

</tasks>

<verification>
- `pnpm --filter backend type-check` exits 0 on a fresh clone of this branch.
- `pnpm --filter backend run type-check:summary` produces an empty histogram.
- `git diff phase-47-base..HEAD -- backend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
- `git diff phase-47-base..HEAD -- frontend/src | wc -l` returns 0 (cross-workspace fence respected — no edits to 47-01's surface).
- `git diff phase-47-base..HEAD -- backend/tsconfig.json | wc -l` returns 0 (D-11 respected).
- 47-EXCEPTIONS.md has backend baseline, backend final histogram, deferred-deletions audit trail.
- Top-25 backend file list (RESEARCH §7.3) is empty when re-run.
</verification>

<success_criteria>

- TYPE-02: `pnpm --filter backend type-check` exits 0. ✅
- TYPE-04 (backend half): zero net-new `@ts-ignore` / `@ts-expect-error`; one new `@ts-nocheck` in a generated file logged as documented exception. ✅
- D-04 cross-workspace fence respected: zero edits to `frontend/src`; every export deletion in `backend/src/types/{intake-entity-links,ai-suggestions}.types.ts` carries D-04 grep evidence. ✅
- D-11 respected: zero edits to `backend/tsconfig.json`. ✅
- D-13 input ready: backend workspace ready to be smoke-tested by 47-03. ✅
  </success_criteria>

<output>
After completion, create `.planning/phases/47-type-check-zero/47-02-SUMMARY.md` covering: task-by-task error-count delta (target shape: 498 → ~30 → ~0), list of deletions performed, list of TS2307 module-drift dispositions (fixed import vs deleted test), list of TS2589 EXCEPTIONS.md entries if any, list of deferred deletions logged in EXCEPTIONS.md, final tsc exit code, and confirmation that the cross-workspace fence and tsconfig were respected (`git diff -- frontend/src` and `git diff -- backend/tsconfig.json` both empty).
</output>
