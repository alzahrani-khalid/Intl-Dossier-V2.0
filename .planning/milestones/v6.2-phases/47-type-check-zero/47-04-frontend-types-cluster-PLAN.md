---
phase: 47
plan: 04
type: execute
wave: 2
depends_on: [47-01]
gap_closure: true
files_modified:
  - frontend/src/types/enhanced-search.types.ts
  - frontend/src/types/intelligence-reports.types.ts
  - frontend/src/types/dossier-context.types.ts
  - frontend/src/types/multilingual-content.types.ts
  - frontend/src/types/dashboard-widget.types.ts
  - frontend/src/types/**
  - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md
autonomous: true
requirements: [TYPE-01, TYPE-04]
must_haves:
  truths:
    - 'Frontend tsc error count under src/types/* drops to 0 (real-fix tail also cleared; any unused export with cross-surface consumers is ledger-rowed in 47-EXCEPTIONS.md and skipped, not counted as residual)'
    - 'No net-new @ts-(ignore|expect-error) introduced (D-01 verified via git diff vs phase-47-base)'
    - 'No edits to backend/src — cross-workspace fence (D-04) holds'
    - 'frontend/src/types/database.types.ts byte-unchanged (already @ts-nocheck per 47-01 Task 2)'
    - 'frontend/src/routeTree.gen.ts byte-unchanged'
    - 'frontend/src/components/intake-form/IntakeForm.tsx byte-unchanged (TYPE-04 ledger row owned by 47-11)'
    - 'frontend/src/components/signature-visuals/__tests__/Icon.test.tsx byte-unchanged (TYPE-04 ledger row owned by 47-11)'
  artifacts:
    - path: 'frontend/src/types/enhanced-search.types.ts'
      provides: 'Type-clean (no TS6133/TS6196) — dense TS6196 cluster reduced'
    - path: 'frontend/src/types/intelligence-reports.types.ts'
      provides: 'Type-clean — TS6196 declarations deleted or ledgered'
    - path: '.planning/phases/47-type-check-zero/47-EXCEPTIONS.md'
      provides: 'Updated Deferred deletions section (when D-04 grep shows cross-surface consumer)'
      contains: 'Deferred deletions'
  key_links:
    - from: 'frontend/src/types/*.ts'
      to: 'frontend tsc --noEmit gate'
      via: 'pnpm --filter intake-frontend type-check'
      pattern: 'tsc --noEmit'
phase_decisions_locked:
  D-01_no_new_suppressions: 'No @ts-ignore / @ts-expect-error introduced. @ts-nocheck only via 47-EXCEPTIONS.md ledger.'
  D-03_deletion_first: 'TS6133 / TS6196 → DELETE the unused declaration. Never _-prefix rename.'
  D-04_cross_workspace_fence: 'Run 4-globbed-grep recipe (frontend/src + backend/src + supabase/functions + tests + shared) BEFORE deleting any exported symbol. Any hit → SKIP and ledger.'
  D-11_no_tsconfig_changes: 'No tsconfig edits.'
threat_model:
  T-47-02:
    category: Tampering
    component: 'frontend/src/types/* deletions'
    disposition: mitigate
    mitigation: 'D-04 four-globbed-grep recipe encoded in <action> and <acceptance_criteria>. Symbols with any cross-surface hit are appended to 47-EXCEPTIONS.md Deferred deletions and skipped, not deleted.'
  T-47-03:
    category: Tampering
    component: 'every code-fix in this plan'
    disposition: mitigate
    mitigation: 'Acceptance includes git diff phase-47-base..HEAD -- frontend/src | grep -E "^\\+.*@ts-(ignore|expect-error)" | wc -l returns 0.'
  T-47-04:
    category: Tampering
    component: 'frontend/src/types/database.types.ts (already @ts-nocheck per 47-01 Task 2)'
    disposition: mitigate
    mitigation: 'This plan does NOT edit database.types.ts; acceptance grep confirms first line still @ts-nocheck and the file is byte-unchanged in this task'
---

<objective>
Source: 47-01 PLAN.md Task 3.

Drive `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/types/' | wc -l` error count to **0** by deleting genuinely-unused declarations (TS6196 / TS6133) and applying real type fixes (TS2xxx) for the residual tail at source — not deferring TS2xxx to a later plan. Operates on `frontend/src/types/**` excluding `database.types.ts` (already allowlisted in 47-01 Task 2).

For any TS6196 / TS6133 unused export where the D-04 four-globbed-grep recipe still reveals a cross-surface consumer, append a row to `47-EXCEPTIONS.md` under `## Deferred deletions (cross-surface consumers)` and skip the deletion — that ledger row is the only legitimate path to leave a residual error in `src/types/*`, and it must be 1:1 (one symbol per row, with grep evidence).

**Purpose:** TYPE-01 phase-goal slice. The hand-authored types files are the densest TS6196 cluster (~78 errors across 5 files). Mechanical deletions with D-04 verification, plus real-fix completion of the TS2xxx tail.

**Output:** src/types/_ error count = 0; 47-EXCEPTIONS.md Deferred-deletions section appended for any symbol with cross-surface consumers; no new suppressions; backend/src untouched. 47-04 is the only Wave-2 plan that re-enters `frontend/src/types/_`, so the chain leading to 47-11's terminal `pnpm --filter intake-frontend type-check; echo $?` returns 0 requires this plan to clear the surface fully.
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
@.planning/phases/47-type-check-zero/47-EXCEPTIONS.md
@.planning/phases/47-type-check-zero/47-01-frontend-type-fix-SUMMARY.md
@./CLAUDE.md
@frontend/tsconfig.json
@frontend/package.json

<interfaces>
<!-- D-04 verification recipe (run BEFORE deleting any exported declaration). All four MUST return 0 hits before deletion. Any hit → SKIP and ledger. -->
grep -rn "<SymbolName>" frontend/src backend/src 2>/dev/null
grep -rn "<SymbolName>" supabase/functions 2>/dev/null
grep -rn "<SymbolName>" tests 2>/dev/null
grep -rn "<SymbolName>" shared 2>/dev/null

<!-- DO NOT EDIT in this plan: -->

frontend/src/types/database.types.ts // already @ts-nocheck per 47-01 Task 2 (commit ab3d573b)
frontend/src/routeTree.gen.ts // pre-existing @ts-nocheck (RESEARCH §11.12)
frontend/src/components/intake-form/IntakeForm.tsx // TYPE-04 ledger — 47-11 owns
frontend/src/components/signature-visuals/**tests**/Icon.test.tsx // TYPE-04 ledger — 47-11 owns

<!-- Cross-workspace fence (D-04) — DO NOT edit backend/src/types/* even if frontend errors point to lines inside it. That surface is owned by 47-02. Fix the consumption side in frontend, OR flag in 47-EXCEPTIONS.md as "deferred to 47-02". -->
</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                 | Description                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| frontend → backend types | Frontend deep-imports from `backend/src/types/*`. Deleting an "unused" symbol could break the other workspace. |
| Source code → CI gate    | Adding `@ts-ignore` / `@ts-expect-error` defeats TYPE-01.                                                      |

## STRIDE Threat Register

| Threat ID | Category  | Component                                                    | Disposition | Mitigation Plan                                                                                                                         |
| --------- | --------- | ------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| T-47-02   | Tampering | `frontend/src/types/*` deletions                             | mitigate    | D-04 four-globbed-grep recipe encoded in <action>/<acceptance_criteria>. Cross-surface consumers → 47-EXCEPTIONS.md Deferred deletions. |
| T-47-03   | Tampering | every code-fix in this plan                                  | mitigate    | `git diff phase-47-base..HEAD -- frontend/src \| grep -E '^\\+.*@ts-(ignore\|expect-error)' \| wc -l` returns 0.                        |
| T-47-04   | Tampering | `frontend/src/types/database.types.ts` (already @ts-nocheck) | mitigate    | This plan does not modify it; acceptance grep confirms file byte-unchanged.                                                             |

</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: src/types/* hand-authored cleanup (~373 errors → 0; deletions + real-fix tail)</name>
  <files>frontend/src/types/enhanced-search.types.ts, frontend/src/types/intelligence-reports.types.ts, frontend/src/types/dossier-context.types.ts, frontend/src/types/multilingual-content.types.ts, frontend/src/types/dashboard-widget.types.ts, frontend/src/types/**, .planning/phases/47-type-check-zero/47-EXCEPTIONS.md</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §4.2 (D-04 four-globbed-grep recipe), §7.1 (top-25 frontend file list — 5 of these *.types.ts files are in it)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md D-01, D-03, D-04
    - .planning/phases/47-type-check-zero/47-01-frontend-type-fix-SUMMARY.md (Deviations 1 + 2; pnpm filter is `intake-frontend` not `frontend`)
    - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md (existing 4 seeded ledger rows are byte-immutable)
    - frontend/src/types/database.types.ts → DO NOT edit (already @ts-nocheck per 47-01 Task 2 / commit ab3d573b)
    - frontend/src/routeTree.gen.ts → DO NOT edit (pre-existing @ts-nocheck per RESEARCH §11.12)
    - frontend/src/components/intake-form/IntakeForm.tsx → DO NOT edit (TYPE-04 ledger row owned by 47-11)
    - frontend/src/components/signature-visuals/__tests__/Icon.test.tsx → DO NOT edit (TYPE-04 ledger row owned by 47-11)
    - The five hand-authored types files listed in <files> (enhanced-search, intelligence-reports, dossier-context, multilingual-content, dashboard-widget) — read each top-to-bottom; they total ~78 errors and are the densest TS6196 cluster
    - For any other src/types/*.ts file with errors: enumerate via `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/types/' | grep -oE '^[^(]+\.ts' | sort -u`
  </read_first>
  <action>
    1. **Capture per-file error baseline:**
       ```bash
       git rev-parse phase-47-base   # MUST return 41f28f169a2ca3bc2ed75b407f62f9f1b14404e5 (set up by 47-01 Task 1)
       pnpm --filter intake-frontend type-check 2>&1 | grep '^src/types/' > /tmp/47-04-types-errors-baseline.txt
       wc -l /tmp/47-04-types-errors-baseline.txt   # record N for end-of-task comparison
       ```

    2. **For each TS6196 error (unused exported declaration):**
       a. Run the D-04 four-globbed-grep recipe for the symbol name:
          ```bash
          grep -rn "<SymbolName>" frontend/src backend/src 2>/dev/null
          grep -rn "<SymbolName>" supabase/functions 2>/dev/null
          grep -rn "<SymbolName>" tests 2>/dev/null
          grep -rn "<SymbolName>" shared 2>/dev/null
          ```
       b. If ALL four return 0 hits → DELETE the declaration (D-03 default).
       c. If ANY return hits → SKIP and append a row to `47-EXCEPTIONS.md` under `## Deferred deletions (cross-surface consumers)` with:
          - File path
          - Symbol name
          - Which surface still consumes it (paste grep hit)
          - Reason for deferral
          This ledger row is the **only** legitimate path to leave a residual error in `src/types/*`. The terminal acceptance grep returns 0 because every remaining error is either deleted-at-source OR ledger-rowed and explicitly excluded from the count by virtue of having been removed via deletion paired with consumer-side adjustment in this plan.

    3. **For each TS6133 error (unused local/import) inside src/types/*.ts:** delete the line. No `_`-prefix rename.

    4. **For each TS2xxx real-fix error inside src/types/*.ts (the residual tail — e.g., TS2339 / TS2322 / TS7006 / TS18046):** fix at source within `frontend/src/types/**`. Do not defer TS2xxx errors to later plans; this plan is the only Wave-2 plan that re-enters `frontend/src/types/*`, so the surface must be cleared fully here. Use `as unknown as <RealType>` with a comment if a cast is genuinely required (D-01: never `as any`, never `@ts-ignore`/`@ts-expect-error`).

    5. **Forbidden:** editing exports inside `backend/src/types/{intake-entity-links,ai-suggestions,database}.types.ts` even when frontend errors point there (cross-workspace fence). If a frontend error originates from a backend type file, fix the consumption point in the frontend file or append to 47-EXCEPTIONS.md as "deferred to 47-02".

    6. **Forbidden:** introducing `@ts-ignore`, `@ts-expect-error`, or `as any`. Use `as unknown as <RealType>` with a comment if a cast is genuinely required.

    7. **Re-run histogram cadence** — every 3-5 file edits:
       ```bash
       pnpm --filter intake-frontend type-check 2>&1 | grep '^src/types/' | wc -l
       ```
       Confirm monotonic decrease. Final value MUST be 0.

    8. **Single commit at task end** (pre-commit hook runs `turbo run build` ~2-3min — do NOT split into per-file commits). Commit message format: `fix(47-04): src/types/* TS6133/TS6196/TS2xxx cleanup — N errors → 0`.

  </action>
  <verify>
    <automated>
      pnpm --filter intake-frontend type-check 2>&1 | grep '^src/types/' | wc -l   # returns 0
      git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
      git diff phase-47-base..HEAD -- backend/src | wc -l   # returns 0 (cross-workspace fence)
      git diff phase-47-base..HEAD -- frontend/src/types/database.types.ts | wc -l   # returns 0 (file untouched in this plan)
      git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l   # returns 0 (TYPE-04 ledger row owned by 47-11)
      git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l   # returns 0 (TYPE-04 ledger row owned by 47-11)
      head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"   # returns 1 (preserved)
      head -1 frontend/src/routeTree.gen.ts | grep -c "@ts-nocheck"   # returns 1 (preserved)
      git diff phase-47-base..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'   # returns 0
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/types/' | wc -l` returns 0. Real-fix tail (TS2xxx) is cleared at source within `frontend/src/types/**`, not deferred. Any TS6196/TS6133 unused export the D-04 grep recipe shows STILL has external consumers must be ledger-rowed in `47-EXCEPTIONS.md` under `## Deferred deletions (cross-surface consumers)` (1:1 — one symbol per row, with grep evidence) — that is the ONLY legitimate path to leave a residual.
    - `git diff phase-47-base..HEAD -- backend/src | wc -l` returns 0 (cross-workspace fence respected).
    - `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
    - `git diff phase-47-base..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'` returns 0.
    - `git diff phase-47-base..HEAD -- frontend/src/types/database.types.ts | wc -l` returns 0 (Task 2 of 47-01 output preserved).
    - `git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l` returns 0 (TYPE-04 ledger row owned by 47-11).
    - `git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l` returns 0 (TYPE-04 ledger row owned by 47-11).
    - `head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"` returns 1.
    - `head -1 frontend/src/routeTree.gen.ts | grep -c "@ts-nocheck"` returns 1.
    - For every deleted exported symbol, the D-04 grep evidence (or its cited absence) is recorded in either the commit message or a row in `47-EXCEPTIONS.md` Deferred-deletions section.
    - The 4 pre-existing ledger rows seeded in 47-01 (IntakeForm.tsx, Icon.test.tsx, frontend database.types.ts, deferred backend database.types.ts) are byte-unchanged: `git diff phase-47-base..HEAD -- .planning/phases/47-type-check-zero/47-EXCEPTIONS.md | grep -E '^-' | grep -vE '^---' | wc -l` shows zero deletions of seeded rows.
  </acceptance_criteria>
  <done>
    src/types/* error count is 0 (every TS6133/TS6196/TS2xxx error is either fixed-at-source or ledger-rowed as a deferred deletion with cross-surface evidence); no @ts-ignore/@ts-expect-error/as any added; backend/src untouched; database.types.ts, routeTree.gen.ts, IntakeForm.tsx, and Icon.test.tsx byte-unchanged.
  </done>
</task>

</tasks>

<verification>
- `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/types/' | wc -l` returns 0.
- `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
- `git diff phase-47-base..HEAD -- backend/src | wc -l` returns 0.
- 47-EXCEPTIONS.md pre-existing rows byte-unchanged; new Deferred-deletions rows added if any cross-surface consumer found.
</verification>

<success_criteria>

- TYPE-01 (slice): `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/types/' | wc -l` returns 0. Real-fix tail (TS2xxx) cleared at source within `frontend/src/types/**`. Any TS6196/TS6133 unused export with surviving cross-surface consumers is recorded in `47-EXCEPTIONS.md ## Deferred deletions (cross-surface consumers)` 1:1 with grep evidence — the only path to a residual. ✅
- TYPE-04: zero net-new `@ts-ignore` / `@ts-expect-error`; deferred deletions recorded in ledger; the four 47-11-owned ledger anchors (IntakeForm.tsx, Icon.test.tsx, frontend database.types.ts, backend database.types.ts) byte-unchanged. ✅
- D-04 cross-workspace fence: zero edits to `backend/src`. ✅
- D-11: zero edits to `frontend/tsconfig.json`. ✅
  </success_criteria>

<output>
After completion, create `.planning/phases/47-type-check-zero/47-04-frontend-types-cluster-SUMMARY.md` covering: pre/post error count for src/types/* (post MUST be 0), list of deletions performed (or count if too long), list of deferred deletions logged in EXCEPTIONS.md with grep evidence, list of TS2xxx real-fixes performed at source, and confirmation that backend/src diff is empty plus the four 47-11-owned ledger anchors are byte-unchanged.
</output>
