---
phase: 47
plan: 07
type: execute
wave: 2
depends_on: [47-01]
gap_closure: true
files_modified:
  - frontend/src/hooks/useLegislation.ts
  - frontend/src/hooks/useMeetingMinutes.ts
  - frontend/src/hooks/**
  - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md
autonomous: true
requirements: [TYPE-01, TYPE-04]
must_haves:
  truths:
    - 'pnpm --filter intake-frontend type-check 2>&1 | grep "^src/hooks/" | wc -l returns 0'
    - 'No edits to backend/src — cross-workspace fence (D-04) holds'
    - 'No net-new @ts-(ignore|expect-error) introduced'
    - 'No new bare `as any` casts'
  artifacts:
    - path: 'frontend/src/hooks/useLegislation.ts'
      provides: 'Type-clean (16 errors → 0)'
    - path: 'frontend/src/hooks/useMeetingMinutes.ts'
      provides: 'Type-clean (14 errors → 0)'
  key_links:
    - from: 'frontend/src/hooks/**'
      to: 'frontend tsc --noEmit gate'
      via: 'pnpm --filter intake-frontend type-check'
      pattern: 'tsc --noEmit'
phase_decisions_locked:
  D-01_no_new_suppressions: 'No @ts-ignore / @ts-expect-error introduced.'
  D-03_deletion_first: 'TS6133 / TS6196 → DELETE.'
  D-04_cross_workspace_fence: 'No edits to backend/src.'
threat_model:
  T-47-02:
    category: Tampering
    component: 'frontend/src/hooks/* deletions'
    disposition: mitigate
    mitigation: 'D-04 four-globbed-grep before any export deletion. git diff phase-47-base..HEAD -- backend/src returns 0.'
  T-47-03:
    category: Tampering
    component: 'every code-fix in this plan'
    disposition: mitigate
    mitigation: 'git diff phase-47-base..HEAD -- frontend/src | grep -E "^\\+.*@ts-(ignore|expect-error)" | wc -l returns 0.'
  T-47-04:
    category: Tampering
    component: 'pre-existing TYPE-04 sites'
    disposition: mitigate
    mitigation: 'Out-of-scope here; pre-existing rows in 47-EXCEPTIONS.md byte-unchanged.'
---

<objective>
Source: 47-01 PLAN.md Task 6.

Drive `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/hooks/'` from ~153 errors to 0. Apply D-03 (deletion-first) + D-04 (cross-workspace verification) to TS6133 / TS6196; real fixes for TS2339 / TS7006 / TS18046 / TS2322.

**Purpose:** TYPE-01 phase-goal slice. Hooks = 153 errors / ~10% of frontend per RESEARCH §7.2.

**Output:** src/hooks/\* type-clean; no new suppressions; backend/src untouched.
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
<!-- D-04 verification recipe -->
grep -rn "<SymbolName>" frontend/src backend/src 2>/dev/null
grep -rn "<SymbolName>" supabase/functions 2>/dev/null
grep -rn "<SymbolName>" tests 2>/dev/null
grep -rn "<SymbolName>" shared 2>/dev/null

<!-- DO NOT EDIT in this plan: -->

backend/src/\*\* // cross-workspace fence
frontend/src/types/database.types.ts // already @ts-nocheck (47-01 Task 2)
frontend/src/routeTree.gen.ts // pre-existing @ts-nocheck

<!-- TanStack Query pattern: ensure useQuery<T>(...) is properly typed, then access .data with proper narrowing rather than re-destructuring with any. -->
</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                 | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| frontend → backend types | Some hooks import from `backend/src/types/*`.             |
| Source code → CI gate    | Adding `@ts-ignore` / `@ts-expect-error` defeats TYPE-01. |

## STRIDE Threat Register

| Threat ID | Category  | Component                        | Disposition | Mitigation Plan                                                      |
| --------- | --------- | -------------------------------- | ----------- | -------------------------------------------------------------------- |
| T-47-02   | Tampering | `frontend/src/hooks/*` deletions | mitigate    | D-04 four-globbed-grep before export deletion. backend/src diff = 0. |
| T-47-03   | Tampering | every code-fix in this plan      | mitigate    | suppression-diff = 0.                                                |
| T-47-04   | Tampering | pre-existing TYPE-04 sites       | mitigate    | Out of scope; ledger rows byte-unchanged.                            |

</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: src/hooks/* cluster (~153 errors)</name>
  <files>frontend/src/hooks/**, .planning/phases/47-type-check-zero/47-EXCEPTIONS.md</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §7.2 (hooks = 153 errors / 10% of frontend), §7.1 (top hook files: useLegislation.ts 16, useMeetingMinutes.ts 14)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md D-01, D-03, D-04
    - .planning/phases/47-type-check-zero/47-01-frontend-type-fix-SUMMARY.md (Deviation 2: pnpm filter is `intake-frontend`)
    - frontend/src/hooks/useLegislation.ts
    - frontend/src/hooks/useMeetingMinutes.ts
  </read_first>
  <action>
    1. **Capture baseline:**
       ```bash
       git rev-parse phase-47-base   # MUST return SHA
       pnpm --filter intake-frontend type-check 2>&1 | grep '^src/hooks/' > /tmp/47-07-hooks-baseline.txt
       wc -l /tmp/47-07-hooks-baseline.txt
       pnpm --filter intake-frontend type-check 2>&1 | grep '^src/hooks/' | grep -oE '^[^(]+\.ts' | sort | uniq -c | sort -rn
       ```

    2. **Process top-error files first** (useLegislation.ts → useMeetingMinutes.ts → others by error count).

    3. **Common hook error patterns and fixes:**
       - **TS6133 (unused destructure):** delete the unused name from the destructure.
       - **TS2339 (missing property on TanStack Query response):** ensure `useQuery<T>(...)` is typed; access `.data` with proper narrowing.
       - **TS7006 (untyped callback parameter):** annotate the parameter with the correct type from the queryFn signature.
       - **TS6196 (unused exported helper type):** D-04 four-globbed-grep → delete or ledger.

    4. **Forbidden:**
       - `@ts-ignore` / `@ts-expect-error`
       - bare `as any` (use `as unknown as <RealType>` with comment if needed)
       - editing `backend/src/**`

    5. **Re-run histogram every 3-5 files:**
       ```bash
       pnpm --filter intake-frontend type-check 2>&1 | grep '^src/hooks/' | wc -l
       ```

    6. **Single commit at task end.** Commit message: `fix(47-07): src/hooks/* cluster — N→0 errors`.

  </action>
  <verify>
    <automated>
      pnpm --filter intake-frontend type-check 2>&1 | grep '^src/hooks/' | wc -l   # returns 0
      git diff phase-47-base..HEAD -- backend/src | wc -l   # returns 0
      git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
      git diff phase-47-base..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'   # returns 0
      head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"   # returns 1
      head -1 frontend/src/routeTree.gen.ts | grep -c "@ts-nocheck"   # returns 1
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/hooks/' | wc -l` returns 0.
    - `git diff phase-47-base..HEAD -- backend/src | wc -l` returns 0.
    - `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
    - `git diff phase-47-base..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'` returns 0.
    - 47-EXCEPTIONS.md pre-existing 4 ledger rows byte-unchanged.
  </acceptance_criteria>
  <done>src/hooks/* type-clean.</done>
</task>

</tasks>

<verification>
- Hooks error count = 0.
- backend/src diff empty.
- No new suppressions.
</verification>

<success_criteria>

- TYPE-01 (slice): hooks cleared. ✅
- TYPE-04: zero net-new. ✅
- D-04: backend/src untouched. ✅
  </success_criteria>

<output>
After completion, create `.planning/phases/47-type-check-zero/47-07-frontend-hooks-cluster-SUMMARY.md` covering: pre/post error count, top files fixed, fence verification.
</output>
