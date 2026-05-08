---
phase: 47
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/package.json
  - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md
  - frontend/src/types/database.types.ts
  - frontend/src/types/enhanced-search.types.ts
  - frontend/src/types/intelligence-reports.types.ts
  - frontend/src/types/dossier-context.types.ts
  - frontend/src/types/multilingual-content.types.ts
  - frontend/src/types/dashboard-widget.types.ts
  - frontend/src/types/**
  - frontend/src/components/tasks/**
  - frontend/src/components/kanban/**
  - frontend/src/components/entity-links/**
  - frontend/src/components/calendar/**
  - frontend/src/components/onboarding/**
  - frontend/src/components/tags/**
  - frontend/src/components/stakeholder-timeline/**
  - frontend/src/components/triage-panel/**
  - frontend/src/components/compliance/**
  - frontend/src/components/report-builder/**
  - frontend/src/components/availability-polling/**
  - frontend/src/components/ui/**
  - frontend/src/components/**
  - frontend/src/hooks/**
  - frontend/src/domains/**
  - frontend/src/pages/**
  - frontend/src/routes/**
  - frontend/src/services/**
  - frontend/src/lib/**
  - frontend/src/utils/**
  - frontend/src/store/**
  - frontend/src/contexts/**
  - frontend/src/design-system/**
autonomous: true
requirements: [TYPE-01, TYPE-04]
must_haves:
  truths:
    - 'pnpm --filter frontend type-check exits 0 on a fresh clone'
    - 'Net-new @ts-ignore / @ts-expect-error introduced during this plan equals 0'
    - 'Pre-existing suppressions in IntakeForm.tsx and Icon.test.tsx are byte-unchanged; reason is preserved inline and follow-up reference lives in 47-EXCEPTIONS.md ledger (Issue 1 option (a))'
    - 'Auto-generated frontend/src/types/database.types.ts retains every Tables/TablesInsert/TablesUpdate/Enums/CompositeTypes/Constants helper byte-for-byte (a top-of-file @ts-nocheck makes its 6 TS6196 errors disappear without touching generated content)'
    - 'No deletion in this plan removes a symbol consumed by frontend/src OR backend/src (D-04 grep verified per task)'
  artifacts:
    - path: 'frontend/package.json'
      provides: 'type-check:summary script (executor histogram convenience)'
      contains: '"type-check:summary":'
    - path: '.planning/phases/47-type-check-zero/47-EXCEPTIONS.md'
      provides: 'Baseline frontend histogram + every retained suppression with inline reason + follow-up issue link (TYPE-04 ledger)'
      contains: 'Frontend baseline histogram'
    - path: 'frontend/src/types/database.types.ts'
      provides: 'First line is // @ts-nocheck (auto-generated; regenerated on supabase gen types — must remain untouched)'
      contains: '// @ts-nocheck'
  key_links:
    - from: 'CI (current Lint job line 68 → after 47-03, dedicated type-check job)'
      to: 'frontend/package.json scripts.type-check'
      via: 'pnpm --filter frontend type-check (tsc --noEmit)'
      pattern: 'tsc --noEmit'
    - from: 'frontend/src/components/{tasks,kanban,entity-links}/*.tsx'
      to: 'backend/src/types/{database,intake-entity-links,ai-suggestions}.types.ts'
      via: 'deep relative imports (../../../../backend/src/types/*)'
      pattern: "\\.\\./\\.\\./\\.\\./\\.\\./backend/src/types"
phase_decisions_locked:
  D-11_database_types_strategy: "@ts-nocheck at top of frontend/src/types/database.types.ts (per planner directive — D-11 prohibits tsconfig changes; @ts-nocheck inside a generated file is a TYPE-04 documented exception, not a source-code suppression). Logged in 47-EXCEPTIONS.md with reason 'auto-generated Supabase types; regenerated on every schema migration; nocheck required to keep generator output untouched'."
  D-04_cross_workspace_fence: 'frontend/src/components/{tasks,kanban,entity-links}/* import deep-relative from backend/src/types/*. This plan must NOT delete exports inside backend/src/types — that surface is owned by 47-02. If a frontend error originates from a backend type file, fix the consumption side in frontend or flag for 47-02 — never reach across.'
  pre_existing_suppressions: 'Two pre-existing @ts-expect-error in frontend (IntakeForm.tsx + signature-visuals/__tests__/Icon.test.tsx). Per TYPE-04 they need a follow-up issue/reference appended; bundle into Final task.'
---

<objective>
Drive `pnpm --filter frontend type-check` from 1580 errors to 0 by deleting genuinely-unused declarations (TS6133/TS6196 = 50.3% of frontend errors) and applying real type fixes for the residual tail (TS2339, TS2322, TS7006, TS18046 — 49.7%) without introducing any net-new `@ts-ignore` / `@ts-expect-error`.

**Purpose:** TYPE-01 is the foundation of the v6.2 quality-gate reset. The frontend tsc gate is currently failing on every push to `main` (5/5 recent runs, per Q1 resolution); driving to zero is the prerequisite for splitting the CI job (47-03) and turning on branch protection.

**Output:** Frontend tsc exit code 0 on a clean clone, plus a `type-check:summary` script for histogram burn-down, plus an `EXCEPTIONS.md` ledger covering the auto-generated `database.types.ts` `@ts-nocheck` and the two pre-existing TYPE-04 suppressions.

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
@frontend/tsconfig.json
@frontend/package.json

<interfaces>
<!-- Cross-workspace fence (RESEARCH §4.2 / §8). 10 frontend files import deep-relative from backend/src/types/*.
     This plan MUST NOT delete exports inside backend/src/types/* — that is 47-02's surface.
     If a frontend tsc error points to a line inside ../../../../backend/src/types/*.ts, EITHER:
       (a) fix the consumption side in the frontend file (preferred), or
       (b) flag in 47-EXCEPTIONS.md as "deferred to 47-02" and skip — do not edit backend source. -->

Cross-workspace import sites (verified RESEARCH §4.2):
frontend/src/components/tasks/{TaskEditDialog,TaskCard,ContributorsList,TaskDetail}.tsx
→ ../../../../backend/src/types/database.types
frontend/src/components/kanban/KanbanBoard.tsx
→ ../../../../backend/src/types/database.types
frontend/src/components/entity-links/{LinkTypeBadge,LinkList,EntityLinkManager,EntitySearchDialog}.tsx
→ ../../../../backend/src/types/intake-entity-links.types
frontend/src/components/entity-links/AISuggestionPanel.tsx
→ ../../../../backend/src/types/ai-suggestions.types

Pre-existing frontend suppressions (RESEARCH §11.12) — DO NOT remove:
frontend/src/routeTree.gen.ts // @ts-nocheck (generated; standard)
frontend/src/components/intake-form/IntakeForm.tsx // @ts-expect-error Type instantiation too deep
frontend/src/components/signature-visuals/**tests**/Icon.test.tsx // @ts-expect-error — runtime fallback for typing escapes

D-03 deletion policy:
Default fix for TS6133 (unused locals/imports) and TS6196 (unused exported types) = DELETE.
Never `_`-prefix rename. Never disable noUnusedLocals / noUnusedParameters.
Never add @ts-ignore / @ts-expect-error to mask any error (D-01).

D-04 verification recipe (run BEFORE deleting any exported declaration in src/types/\* or any other file with TS6196):
grep -rn "ExportedSymbolName" frontend/src backend/src 2>/dev/null
grep -rn "ExportedSymbolName" supabase/functions 2>/dev/null
grep -rn "ExportedSymbolName" tests 2>/dev/null
grep -rn "ExportedSymbolName" shared 2>/dev/null
All four must return 0 hits before deletion. If any returns a hit, flag in 47-EXCEPTIONS.md and SKIP the deletion.
</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                          | Description                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| frontend → backend types          | Frontend deep-imports from `backend/src/types/*`. Deleting an "unused" symbol on either side could break the other workspace.                     |
| Supabase codegen → frontend types | `frontend/src/types/database.types.ts` is regenerated by `supabase gen types typescript`. Any hand-edits inside the file are wiped on next regen. |
| Source code → CI gate             | Adding `@ts-ignore` / `@ts-expect-error` defeats TYPE-01 by masking instead of fixing.                                                            |

## STRIDE Threat Register

| Threat ID       | Category  | Component                                                                  | Disposition | Mitigation Plan                                                                                                                                                                                                                                                                                                                                                                         |
| --------------- | --------- | -------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-47-02         | Tampering | frontend/src/types/_ deletions and frontend imports of backend/src/types/_ | mitigate    | D-04 four-globbed-grep recipe (frontend/src + backend/src + supabase/functions + tests + shared) MUST run on every export deletion task — encoded as `<read_first>` and `<acceptance_criteria>` on Tasks 2 and the components/{tasks,kanban,entity-links} task. Symbols with any hit are flagged in 47-EXCEPTIONS.md, not deleted.                                                      |
| T-47-03         | Tampering | every code-fix task in this plan                                           | mitigate    | Each task's acceptance includes `git diff <task-base>..HEAD -- frontend/src \| grep -E '^\\+.*@ts-(ignore\|expect-error)' \| wc -l` returns 0. The Final task scans the entire plan diff (`git diff <plan-base>..HEAD -- frontend/src \| ...`) and matches it against EXCEPTIONS.md entries one-for-one.                                                                                |
| T-47-04 (local) | Tampering | frontend/src/types/database.types.ts                                       | mitigate    | Top-of-file `@ts-nocheck` is the ONLY edit allowed in this generated file. The acceptance criterion checks (a) line 1 is `// @ts-nocheck` plus optional reason comment, (b) `git diff` of this file shows ONLY a 1-2 line addition at the top, no other hunks, (c) `EXCEPTIONS.md` records the file with reason "auto-generated Supabase types; regenerated on every schema migration". |

</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: Wave 0 — type-check:summary script + 47-EXCEPTIONS.md baseline</name>
  <files>frontend/package.json, .planning/phases/47-type-check-zero/47-EXCEPTIONS.md</files>
  <read_first>
    - frontend/package.json (locate the existing "type-check" script at line 19; the new script sits next to it)
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §3 (canonical histogram methodology + recommended script form including the trailing `|| true`)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md (D-02: EXCEPTIONS.md format — file path, error code, upstream issue link, follow-up issue link)
    - .planning/phases/47-type-check-zero/47-VALIDATION.md (Wave 0 Requirements section — exact script string)
  </read_first>
  <action>
    0. **FIRST STEP — capture phase base SHA via git tag (Issue 4 fix; precedes all other work in the plan):**
       ```bash
       # Guard against double-creation (47-02 Task 1 may run in parallel and try the same)
       git rev-parse phase-47-base 2>/dev/null || git tag phase-47-base $(git rev-parse HEAD)
       git push origin phase-47-base 2>/dev/null || true
       ```
       This pins the phase-start commit so the suppression-diff at Final task and 47-03 Task 6 references `phase-47-base..HEAD` instead of the unreliable `git merge-base main HEAD` (which may collapse to empty after 47-03 Task 3 merges into main).
    1. Edit `frontend/package.json` scripts block (next to the existing `"type-check": "tsc --noEmit"` at line 19). Add:
       ```jsonc
       "type-check:summary": "tsc --noEmit 2>&1 | grep -oE 'TS[0-9]+' | sort | uniq -c | sort -rn || true"
       ```
       The trailing `|| true` is mandatory — without it the pipe inherits tsc's non-zero exit and the histogram is suppressed in CI logs (RESEARCH §3).
    2. Create `.planning/phases/47-type-check-zero/47-EXCEPTIONS.md` with FOUR sections:
       - `## Frontend baseline histogram` — paste the output of `pnpm --filter frontend type-check:summary` (1580 errors, top codes per RESEARCH §3 frontend table).
       - `## Backend baseline histogram` — leave a placeholder `(populated by 47-02 Task 1)` so 47-02 can append without conflict.
       - `## Retained suppressions (TYPE-04 ledger)` — **seed two pre-existing rows now** (Issue 1 fix — option (a) treats EXCEPTIONS.md as the source of truth; the inline `// @ts-expect-error <reason>` comments at these two sites stay byte-unchanged for the rest of the plan):
         ```markdown
         | File | Suppression | Reason | Follow-up |
         | ---- | ----------- | ------ | --------- |
         | frontend/src/components/intake-form/IntakeForm.tsx | `// @ts-expect-error Type instantiation too deep` (pre-existing, single inline line — DO NOT modify in this plan) | Supabase chained `.from().select()` exceeds tsc's instantiation limit. | Track upstream Supabase issue or refactor the chain into a typed RPC. |
         | frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | `// @ts-expect-error — runtime fallback for typing escapes` (pre-existing, single inline line — DO NOT modify in this plan) | Test-only path; production code is typed. | Replace with a typed Icon factory once signature-visuals stabilizes. |
         ```
       - `## Deferred deletions (cross-surface consumers)` — placeholder; populated by Tasks 3, 4, and the 47-02 mirror tasks when D-04 grep finds an unscanned consumer.
    3. Capture exact errors-by-code totals so the Final task can prove 0.
  </action>
  <verify>
    <automated>
      git rev-parse phase-47-base   # MUST return a SHA (tag created in step 0)
      pnpm --filter frontend run type-check:summary 2>&1 | head -20  # must print histogram, not "Missing script"
      grep -c "type-check:summary" frontend/package.json  # returns 1
      test -f .planning/phases/47-type-check-zero/47-EXCEPTIONS.md && grep -c "Frontend baseline histogram" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md  # returns 1
      grep -c "frontend/src/components/intake-form/IntakeForm.tsx" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md  # returns >=1 (pre-seeded ledger row)
      grep -c "frontend/src/components/signature-visuals/__tests__/Icon.test.tsx" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md  # returns >=1 (pre-seeded ledger row)
    </automated>
  </verify>
  <acceptance_criteria>
    - `git rev-parse phase-47-base` returns a valid SHA (Issue 4 — phase-base tag created).
    - `pnpm --filter frontend run type-check:summary` exits 0 (because of `|| true`) and prints a non-empty histogram table to stdout.
    - `grep -c "\"type-check:summary\"" frontend/package.json` returns 1.
    - `test -f .planning/phases/47-type-check-zero/47-EXCEPTIONS.md && grep -c "^## Frontend baseline histogram" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md` returns 1.
    - 47-EXCEPTIONS.md `## Retained suppressions (TYPE-04 ledger)` is seeded with the two pre-existing frontend rows (IntakeForm.tsx + Icon.test.tsx) at phase start (Issue 1 — ledger is source of truth).
    - `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
  </acceptance_criteria>
  <done>
    Phase-base tag created; type-check:summary script callable; 47-EXCEPTIONS.md exists with frontend histogram baseline AND two pre-seeded ledger rows; all committed.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Allowlist generated frontend/src/types/database.types.ts via @ts-nocheck</name>
  <files>frontend/src/types/database.types.ts, .planning/phases/47-type-check-zero/47-EXCEPTIONS.md</files>
  <read_first>
    - frontend/src/types/database.types.ts (first 5 lines — confirm it is the Supabase-generated header; do NOT read the rest of the 39 121-line file)
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §4.1 (six TS6196 hits inside this file: Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes, Constants — these are standard Supabase helpers; deletion is wrong because the next `supabase gen types` regen restores them)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md D-11 + planner directive (locked option (a): top-of-file @ts-nocheck, NOT tsconfig exclude)
  </read_first>
  <action>
    1. Prepend two lines to `frontend/src/types/database.types.ts` (above the existing first line, which today begins `export type Json = ...`):
       ```typescript
       // @ts-nocheck — auto-generated by `supabase gen types typescript`. Regenerated on every schema migration; do not hand-edit.
       // The exported helpers (Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes, Constants) emit TS6196 because no in-repo consumer imports them yet, but they are part of the standard Supabase generator output and must remain present for future consumers. See 47-EXCEPTIONS.md and Phase 47 RESEARCH §4.1.
       ```
    2. Append an entry to `47-EXCEPTIONS.md` `## Retained suppressions (TYPE-04 ledger)`:
       ```markdown
       | File | Suppression | Reason | Follow-up |
       | ---- | ----------- | ------ | --------- |
       | frontend/src/types/database.types.ts | `// @ts-nocheck` (top of file) | Auto-generated Supabase types; six TS6196 helpers (Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes, Constants) are standard generator output for future consumers; cannot be hand-deleted because next `supabase gen types` regen restores them. D-11 prohibits tsconfig exclude. | None — generated file is inert. Revisit if Supabase generator stops emitting unused helpers. |
       ```
    3. Confirm the only diff in `frontend/src/types/database.types.ts` is a 2-line prepend at the top. No other line edits.
  </action>
  <verify>
    <automated>
      head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"   # returns 1
      git diff frontend/src/types/database.types.ts | grep -E "^[+-]" | grep -vE "^(\+\+\+|---)" | grep -vE "^\+(// @ts-nocheck|// The exported helpers)" | wc -l   # returns 0 (only the 2 added lines should be diff hunks)
      pnpm --filter frontend type-check 2>&1 | grep -c "src/types/database.types.ts"   # returns 0 (file is now ignored by tsc)
    </automated>
  </verify>
  <acceptance_criteria>
    - `head -1 frontend/src/types/database.types.ts | grep -c '@ts-nocheck'` returns 1.
    - `git diff frontend/src/types/database.types.ts` shows ONLY the two prepended comment lines; no other hunks.
    - After this task, `pnpm --filter frontend type-check 2>&1 | grep -c 'src/types/database.types.ts'` returns 0 (file no longer surfaces in error output).
    - 47-EXCEPTIONS.md has the new ledger row.
    - `git diff <task-base>..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0 (this task introduces a `@ts-nocheck`, not `@ts-ignore` or `@ts-expect-error`; the suppress-count grep is unchanged).
    - Frontend total error count drops by exactly 6 (the six TS6196 helpers in this file).
  </acceptance_criteria>
  <done>
    database.types.ts is allowlisted; six baseline errors removed; ledger entry recorded.
  </done>
</task>

<task type="auto">
  <name>Task 3: src/types/* hand-authored cleanup (~373 errors, mostly TS6196)</name>
  <files>frontend/src/types/enhanced-search.types.ts, frontend/src/types/intelligence-reports.types.ts, frontend/src/types/dossier-context.types.ts, frontend/src/types/multilingual-content.types.ts, frontend/src/types/dashboard-widget.types.ts, frontend/src/types/**</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §4.2 (D-04 four-globbed-grep recipe), §4.6 (backend test imports), §7.1 (top-25 frontend file list — five of these *.types.ts files are in the list)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md D-03, D-04
    - frontend/src/types/database.types.ts — DO NOT edit (allowlisted in Task 2)
    - frontend/src/routeTree.gen.ts — DO NOT edit (already @ts-nocheck per RESEARCH §11.12)
    - The five hand-authored types files listed above (enhanced-search, intelligence-reports, dossier-context, multilingual-content, dashboard-widget) — read each top-to-bottom; they total ~78 errors and are the densest TS6196 cluster in src/types/*
    - For any other src/types/*.ts file with errors: `pnpm --filter frontend type-check 2>&1 | grep '^src/types/' | grep -oE '^[^(]+\.ts' | sort -u` to enumerate
  </read_first>
  <action>
    1. Run `pnpm --filter frontend type-check 2>&1 | grep '^src/types/' > /tmp/47-01-types-errors.txt` to capture per-file error list (excluding database.types.ts which is now @ts-nocheck).
    2. For each TS6196 error (unused exported declaration):
       a. Run the D-04 four-globbed-grep recipe for the symbol name:
          ```
          grep -rn "<SymbolName>" frontend/src backend/src
          grep -rn "<SymbolName>" supabase/functions
          grep -rn "<SymbolName>" tests
          grep -rn "<SymbolName>" shared
          ```
       b. If ALL four return 0 hits → DELETE the declaration (D-03 default).
       c. If ANY return hits → SKIP and append to `47-EXCEPTIONS.md` under a new `## Deferred deletions (cross-surface consumers)` section with file, symbol, and which surface still consumes it.
    3. For each TS6133 error (unused local/import) inside src/types/*.ts: delete the line. No `_`-prefix rename.
    4. **Forbidden:** editing exports inside `backend/src/types/{intake-entity-links,ai-suggestions,database}.types.ts` even when frontend errors point there — that is 47-02's surface (cross-workspace fence). If a frontend types error originates from a backend type file, fix the consumption point in the frontend file or flag for 47-02.
    5. After edits, re-run `pnpm --filter frontend type-check:summary` and confirm src/types/* error count dropped (target: from ~373 to ≤30 — residual is real-fix tail not deletion-eligible).
  </action>
  <verify>
    <automated>
      pnpm --filter frontend type-check 2>&1 | grep '^src/types/' | wc -l   # < pre-task count from /tmp/47-01-types-errors.txt
      git diff <task-base>..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
      git diff <task-base>..HEAD -- backend/src/types | wc -l   # returns 0 (cross-workspace fence not crossed)
    </automated>
  </verify>
  <acceptance_criteria>
    - Frontend tsc error count under `src/types/*` drops by ≥80% relative to start-of-task baseline (from /tmp/47-01-types-errors.txt). Residual must be entirely real-type-fix errors, not TS6133/TS6196.
    - `git diff <task-base>..HEAD -- backend/src` returns empty (cross-workspace fence respected).
    - `git diff <task-base>..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
    - For every deleted symbol, the D-04 grep evidence (or its cited absence) is recorded either in the commit message or as a row in `47-EXCEPTIONS.md` Deferred-deletions section.
    - `pnpm --filter frontend type-check; echo $?` returns non-zero (errors still exist, but the count is monotonically decreasing).
  </acceptance_criteria>
  <done>
    src/types/* error cluster is reduced to the residual real-fix tail; no @ts-ignore/@ts-expect-error added; backend/src untouched.
  </done>
</task>

<task type="auto">
  <name>Task 4: components/{tasks,kanban,entity-links} cross-workspace cluster</name>
  <files>frontend/src/components/tasks/**, frontend/src/components/kanban/**, frontend/src/components/entity-links/**</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §4.2 (full enumeration of 10 cross-workspace import sites), §8 (cross-workspace type surface table), §11.2 (pitfall: deep relative imports hide consumers)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md D-04 (cross-workspace verification before deletion)
    - All 10 import-site files enumerated in §4.2: tasks/{TaskEditDialog,TaskCard,ContributorsList,TaskDetail}.tsx, kanban/KanbanBoard.tsx, entity-links/{LinkTypeBadge,LinkList,EntityLinkManager,EntitySearchDialog,AISuggestionPanel}.tsx
  </read_first>
  <action>
    Pick this cluster FIRST among `src/components/*` because of the cross-workspace import fence (RESEARCH §10.3.4). Process the files listed above in order.

    For each error in these files:
      - TS6133 (unused local/import): delete it. The "unused import from `../../../../backend/src/types/...`" case is benign — the deletion only removes the consumption side; it does not edit backend source.
      - TS6196 (unused exported component-local type): delete with same D-04 four-globbed-grep recipe as Task 3.
      - TS2339 / TS2322 / TS7006 / TS18046 / TS2554: real fix per the message. Common patterns in this cluster:
        - "Property X does not exist on type `Database['public']['Tables']['Y']['Row']`" → narrow via the row type; do NOT widen with `as any`.
        - "Type `T | undefined` not assignable to `T`" → guard with `if (!value) return null` or non-null assertion only when invariant is enforced upstream.
      - **Forbidden:** editing `backend/src/types/*` to change the shape consumed here. If the backend type is genuinely wrong, flag in 47-EXCEPTIONS.md as "deferred to 47-02 cross-workspace fix" and skip the frontend file's affected error.
    After completing all 10 files, run `pnpm --filter frontend type-check 2>&1 | grep -E '^src/components/(tasks|kanban|entity-links)/'` and confirm 0 errors remain in this cluster.

  </action>
  <verify>
    <automated>
      pnpm --filter frontend type-check 2>&1 | grep -E '^src/components/(tasks|kanban|entity-links)/' | wc -l   # returns 0
      git diff <task-base>..HEAD -- backend/src | wc -l   # returns 0
      git diff <task-base>..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter frontend type-check 2>&1 | grep -E '^src/components/(tasks|kanban|entity-links)/' | wc -l` returns 0.
    - `git diff <task-base>..HEAD -- backend/src | wc -l` returns 0 (fence respected).
    - `git diff <task-base>..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
    - The frontend top-25 file list (RESEARCH §7.1) no longer contains files from these three subdirectories.
  </acceptance_criteria>
  <done>
    Cross-workspace consumer cluster is type-clean; no edits to backend source; no new suppressions.
  </done>
</task>

<task type="auto">
  <name>Task 5: components/{calendar,onboarding,tags,stakeholder-timeline,triage-panel,compliance,report-builder,availability-polling,ui,...} remaining ~280 errors</name>
  <files>frontend/src/components/**</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §7.1 (top-25 frontend files — many in this cluster)
    - frontend/src/components/report-builder/ReportBuilder.tsx (32 errors — RESEARCH §7.1)
    - frontend/src/components/calendar/CalendarSyncSettings.tsx (31 errors)
    - frontend/src/components/onboarding/OnboardingChecklist.tsx (27 errors)
    - frontend/src/components/tags/TagAnalytics.tsx (28 errors)
    - frontend/src/components/tags/TagSelector.tsx (25 errors)
    - frontend/src/components/stakeholder-timeline/StakeholderInteractionTimeline.tsx (23 errors)
    - frontend/src/components/triage-panel/TriagePanel.tsx (21 errors)
    - frontend/src/components/compliance/ComplianceRulesManager.tsx (22 errors)
    - frontend/src/components/availability-polling/AvailabilityPollResults.tsx (16 errors)
    - frontend/src/components/ui/content-skeletons.tsx (15 errors)
  </read_first>
  <action>
    Process all remaining `src/components/**` files (i.e. excluding tasks, kanban, entity-links done in Task 4) and excluding `IntakeForm.tsx` and `signature-visuals/__tests__/Icon.test.tsx` which are owned by the Final task.

    Strategy:
      1. Capture per-file error baseline: `pnpm --filter frontend type-check 2>&1 | grep '^src/components/' | grep -oE '^[^(]+\.tsx?' | sort | uniq -c | sort -rn > /tmp/47-01-components-baseline.txt`.
      2. Process by descending error count (top-10 first per RESEARCH §7.1).
      3. For each file:
         - TS6133 / TS6196 → DELETE per D-03 (D-04 grep recipe for any export deletion).
         - Real type errors → fix at source (annotate parameter, narrow union, fix prop type, replace removed prop).
      4. Forbidden: `@ts-ignore`, `@ts-expect-error`, `as any` (the latter is a lint smell that 47-03 / 48 will catch — do not add new instances during 47-01).
      5. Re-run histogram after every 3-5 files to confirm monotonic decrease.

  </action>
  <verify>
    <automated>
      pnpm --filter frontend type-check 2>&1 | grep '^src/components/' | grep -vE '^src/components/(tasks|kanban|entity-links|intake-form/IntakeForm|signature-visuals/__tests__/Icon)' | wc -l   # returns 0
      git diff <task-base>..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
      git diff <task-base>..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'   # returns 0 (no new `as any` introduced)
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter frontend type-check 2>&1 | grep '^src/components/' | grep -vE '^src/components/(tasks|kanban|entity-links|intake-form/IntakeForm|signature-visuals/__tests__/Icon)' | wc -l` returns 0.
    - No file from this cluster appears in the top-25 list when histogram is re-run.
    - `git diff <task-base>..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
    - `git diff <task-base>..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'` returns 0 (or any new `as any` is justified inline as `as unknown as <RealType>` with a comment, not bare `as any`).
  </acceptance_criteria>
  <done>
    src/components/* error cluster (excluding the 3 cross-workspace dirs done in Task 4 and the 2 TYPE-04 files reserved for Final) is fully cleared.
  </done>
</task>

<task type="auto">
  <name>Task 6: src/hooks/* cluster (~153 errors)</name>
  <files>frontend/src/hooks/**</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §7.2 (hooks = 153 errors / 10% of frontend), §7.1 (top-25 hook files: useLegislation.ts 16, useMeetingMinutes.ts 14)
    - frontend/src/hooks/useLegislation.ts
    - frontend/src/hooks/useMeetingMinutes.ts
  </read_first>
  <action>
    Capture baseline: `pnpm --filter frontend type-check 2>&1 | grep '^src/hooks/' > /tmp/47-01-hooks-baseline.txt`.
    Process top-error files first. Apply D-03 + D-04. Common hook errors are TS6133 (unused destructure), TS2339 (missing property on TanStack Query response), TS7006 (untyped callback parameter). Pattern fix for TanStack Query: ensure `useQuery<T>(...)` is typed, then access `.data` with proper narrowing rather than re-destructuring with `any`.
  </action>
  <verify>
    <automated>
      pnpm --filter frontend type-check 2>&1 | grep '^src/hooks/' | wc -l   # returns 0
      git diff <task-base>..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter frontend type-check 2>&1 | grep '^src/hooks/' | wc -l` returns 0.
    - `git diff <task-base>..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
    - Frontend total error count down by ≥150 vs start of task.
  </acceptance_criteria>
  <done>src/hooks/* type-clean.</done>
</task>

<task type="auto">
  <name>Task 7: src/domains/* cluster (~153 errors)</name>
  <files>frontend/src/domains/**</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §7.2 (domains = 153 errors), §7.1 (top file: src/domains/intake/hooks/useIntakeApi.ts 17 errors)
    - frontend/src/domains/intake/hooks/useIntakeApi.ts
  </read_first>
  <action>
    Same playbook as Task 6 — baseline capture, top-down per file, D-03 + D-04.
  </action>
  <verify>
    <automated>
      pnpm --filter frontend type-check 2>&1 | grep '^src/domains/' | wc -l   # returns 0
      git diff <task-base>..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter frontend type-check 2>&1 | grep '^src/domains/' | wc -l` returns 0.
    - No new suppressions.
  </acceptance_criteria>
  <done>src/domains/* type-clean.</done>
</task>

<task type="auto">
  <name>Task 8: src/pages/* + src/routes/* (~216 errors)</name>
  <files>frontend/src/pages/**, frontend/src/routes/**</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §7.2 (pages 142, routes 74), §7.1 (top files: pages/persons/PersonDetailPage.tsx 35, routes/_protected/admin/data-retention.tsx 29, pages/webhooks/WebhooksPage.tsx 22, routes/_protected/stakeholder-influence.tsx 22, pages/audit-logs/AuditLogsPage.tsx 20, pages/WaitingQueue.tsx 17)
    - frontend/src/routeTree.gen.ts — confirm `@ts-nocheck` is still at the top; do NOT edit this file
    - frontend/src/pages/persons/PersonDetailPage.tsx
    - frontend/src/routes/_protected/admin/data-retention.tsx
  </read_first>
  <action>
    Process top files first. Routes file errors are usually TS6133 (unused loader return) or TS2339 (missing property on TanStack Router context). D-03 + D-04 throughout. routeTree.gen.ts is generated and already @ts-nocheck — skip.
  </action>
  <verify>
    <automated>
      pnpm --filter frontend type-check 2>&1 | grep -E '^src/(pages|routes)/' | wc -l   # returns 0
      head -1 frontend/src/routeTree.gen.ts | grep -c "@ts-nocheck"   # still 1
      git diff <task-base>..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter frontend type-check 2>&1 | grep -E '^src/(pages|routes)/' | wc -l` returns 0.
    - routeTree.gen.ts is byte-unchanged.
  </acceptance_criteria>
  <done>src/pages/* and src/routes/* type-clean.</done>
</task>

<task type="auto">
  <name>Task 9: src/services/* + src/lib/* (~103 errors) and tail directories (utils, store, contexts, design-system) (~16 errors)</name>
  <files>frontend/src/services/**, frontend/src/lib/**, frontend/src/utils/**, frontend/src/store/**, frontend/src/contexts/**, frontend/src/design-system/**</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §7.2 (services 59, lib 44, utils 9, store 5, design-system 1, contexts 1)
    - frontend/src/services/user-management-api.ts (15 errors per §7.1)
  </read_first>
  <action>
    Same playbook. After this task the only remaining frontend errors should be in the 2 files the Final task owns (IntakeForm.tsx + Icon.test.tsx — but those already have justified suppressions, no actual TS errors). So this task is the last one before Final to drop the count toward 0.
  </action>
  <verify>
    <automated>
      pnpm --filter frontend type-check 2>&1 | grep -E '^src/(services|lib|utils|store|contexts|design-system)/' | wc -l   # returns 0
      git diff <task-base>..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
    </automated>
  </verify>
  <acceptance_criteria>
    - All six tail directories are clean.
    - `pnpm --filter frontend type-check; echo $?` is approaching 0; remaining errors (if any) live only in IntakeForm.tsx and Icon.test.tsx.
  </acceptance_criteria>
  <done>Tail directories cleared; only TYPE-04 ledger work remains.</done>
</task>

<task type="auto">
  <name>Task 10 (Final): Frontend zero-confirm + TYPE-04 phase-base reconciliation</name>
  <files>.planning/phases/47-type-check-zero/47-EXCEPTIONS.md</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §11.12 (the two pre-existing @ts-expect-error sites — DO NOT modify their inline comments in this plan)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md D-01, D-02, TYPE-04 verbatim from REQUIREMENTS.md
    - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md (the two pre-existing rows for IntakeForm.tsx and Icon.test.tsx were SEEDED in Task 1; the ledger is the TYPE-04 source of truth — NOT inline comments)
  </read_first>
  <action>
    1. **DO NOT modify** the inline `@ts-expect-error` comments in IntakeForm.tsx or Icon.test.tsx (Issue 1 — option (a)). The pre-existing inline reason already satisfies the "reason exists" half of TYPE-04; the "follow-up reference exists" half is satisfied entirely by the seeded ledger rows in 47-EXCEPTIONS.md (Task 1). Touching the inline comments would add `+` lines containing `@ts-expect-error` to the unified diff and produce a non-zero suppression-diff count — exactly the contradiction this revision fixes.
    2. **Re-run histogram** and confirm `pnpm --filter frontend type-check` exits 0:
       ```bash
       pnpm --filter frontend type-check; echo "exit=$?"   # MUST print exit=0
       pnpm --filter frontend run type-check:summary       # MUST print empty histogram or only the header line
       ```
    3. **Suppression-diff confirmation across the entire plan** (TYPE-04 net-new = 0):
       ```bash
       git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l
       ```
       This MUST equal **0** — because (a) the two pre-existing inline `@ts-expect-error` lines are byte-unchanged for the entire plan, so they do not appear as `+` lines; (b) D-01 forbids new `@ts-(ignore|expect-error)` introduction. The Task 2 `@ts-nocheck` on database.types.ts does not match this regex (it matches `@ts-nocheck`, a separate token tracked separately in 47-03 Task 6).
       If the count is non-zero, the plan has violated D-01 and must route to gap-closure — every offending line must either be reverted or added as a new ledger row with the deviation justified.
    4. **Update 47-EXCEPTIONS.md `## Frontend final histogram`** section: paste the empty (or near-empty) histogram from `type-check:summary`.
    5. **Reconfirm the two pre-seeded ledger rows still exist** (no later task accidentally edited them):
       ```bash
       grep -c "frontend/src/components/intake-form/IntakeForm.tsx" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md   # >=1
       grep -c "frontend/src/components/signature-visuals/__tests__/Icon.test.tsx" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md   # >=1
       ```
  </action>
  <verify>
    <automated>
      pnpm --filter frontend type-check; echo $?   # exit 0
      git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # MUST be 0
      git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l   # 0 (file byte-unchanged)
      git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l   # 0 (file byte-unchanged)
      grep -c "frontend/src/components/intake-form/IntakeForm.tsx" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md   # >=1
      grep -c "frontend/src/components/signature-visuals/__tests__/Icon.test.tsx" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md   # >=1
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter frontend type-check; echo $?` returns `0`. (TYPE-01 SATISFIED.)
    - `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns **0** — honest because the inline comments at IntakeForm.tsx and Icon.test.tsx are byte-unchanged for the entire plan (Issue 1 — option (a) fix).
    - `git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l` returns 0 (file untouched by plan).
    - `git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l` returns 0 (file untouched by plan).
    - 47-EXCEPTIONS.md `## Retained suppressions (TYPE-04 ledger)` lists exactly 3 rows: database.types.ts (@ts-nocheck — Task 2), IntakeForm.tsx (@ts-expect-error pre-existing — seeded Task 1), Icon.test.tsx (@ts-expect-error pre-existing — seeded Task 1).
    - 47-EXCEPTIONS.md `## Frontend final histogram` is empty / shows 0 errors.
  </acceptance_criteria>
  <done>
    Frontend tsc exits 0; TYPE-04 ledger complete (the inline comments are byte-unchanged; ledger is the source of truth); plan summary ready.
  </done>
</task>

</tasks>

<verification>
- `pnpm --filter frontend type-check` exits 0 on a fresh clone of this branch.
- `pnpm --filter frontend run type-check:summary` produces an empty (or 0-row) histogram.
- `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
- `git diff phase-47-base..HEAD -- backend/src | wc -l` returns 0 (cross-workspace fence respected — no edits to 47-02's surface from this plan).
- 47-EXCEPTIONS.md has frontend baseline + frontend final histogram + 3 ledger rows for retained suppressions.
- Frontend top-25 file list (RESEARCH §7.1) is now empty when re-run.
- Pre-existing suppressions in IntakeForm.tsx and Icon.test.tsx remain byte-unchanged; their inline reason is preserved and the follow-up reference lives in 47-EXCEPTIONS.md (TYPE-04 satisfied via ledger; Issue 1 — option (a)).
</verification>

<success_criteria>

- TYPE-01: `pnpm --filter frontend type-check` exits 0. ✅
- TYPE-04 (frontend half): zero net-new `@ts-ignore` / `@ts-expect-error`; one new `@ts-nocheck` in a generated file logged as documented exception; two pre-existing `@ts-expect-error` updated with follow-up references and ledgered. ✅
- D-04 cross-workspace fence respected: zero edits to `backend/src`. ✅
- D-11 respected: zero edits to `frontend/tsconfig.json`. ✅
- D-13 input ready: frontend workspace ready to be smoke-tested by 47-03. ✅
  </success_criteria>

<output>
After completion, create `.planning/phases/47-type-check-zero/47-01-SUMMARY.md` covering: task-by-task error-count delta, list of deletions performed (or a count if too long), list of deferred deletions logged in EXCEPTIONS.md, final tsc exit code, and confirmation that the cross-workspace fence was respected (`git diff -- backend/src` empty).
</output>
