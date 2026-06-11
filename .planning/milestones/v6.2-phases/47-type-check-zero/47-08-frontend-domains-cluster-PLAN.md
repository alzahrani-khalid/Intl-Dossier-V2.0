---
phase: 47
plan: 08
type: execute
wave: 2
depends_on: [47-01]
gap_closure: true
files_modified:
  - frontend/src/domains/intake/hooks/useIntakeApi.ts
  - frontend/src/domains/**
  - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md
autonomous: true
requirements: [TYPE-01, TYPE-04]
must_haves:
  truths:
    - 'pnpm --filter intake-frontend type-check 2>&1 | grep "^src/domains/" | wc -l returns 0'
    - 'No edits to backend/src — cross-workspace fence (D-04) holds'
    - 'No net-new @ts-(ignore|expect-error) introduced'
    - 'No new bare `as any` casts'
  artifacts:
    - path: 'frontend/src/domains/intake/hooks/useIntakeApi.ts'
      provides: 'Type-clean (17 errors → 0)'
  key_links:
    - from: 'frontend/src/domains/**'
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
    component: 'frontend/src/domains/* deletions'
    disposition: mitigate
    mitigation: 'D-04 four-globbed-grep before export deletion. backend/src diff = 0.'
  T-47-03:
    category: Tampering
    component: 'every code-fix in this plan'
    disposition: mitigate
    mitigation: 'suppression-diff vs phase-47-base = 0.'
  T-47-04:
    category: Tampering
    component: 'pre-existing TYPE-04 sites'
    disposition: mitigate
    mitigation: 'Out of scope; pre-existing ledger rows byte-unchanged.'
---

<objective>
Source: 47-01 PLAN.md Task 7.

Drive `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/domains/'` from ~153 errors to 0. Same playbook as 47-07: D-03 + D-04, top-down per file.

**Purpose:** TYPE-01 phase-goal slice. Domains = 153 errors per RESEARCH §7.2.

**Output:** src/domains/\* type-clean; no new suppressions; backend/src untouched.
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

</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                 | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| frontend → backend types | Some domain hooks/repos import from `backend/src/types/*`. |
| Source code → CI gate    | Adding `@ts-ignore` / `@ts-expect-error` defeats TYPE-01.  |

## STRIDE Threat Register

| Threat ID | Category  | Component                          | Disposition | Mitigation Plan                                                      |
| --------- | --------- | ---------------------------------- | ----------- | -------------------------------------------------------------------- |
| T-47-02   | Tampering | `frontend/src/domains/*` deletions | mitigate    | D-04 four-globbed-grep before export deletion. backend/src diff = 0. |
| T-47-03   | Tampering | every code-fix in this plan        | mitigate    | suppression-diff = 0.                                                |
| T-47-04   | Tampering | pre-existing TYPE-04 sites         | mitigate    | Out of scope.                                                        |

</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: src/domains/* cluster (~153 errors)</name>
  <files>frontend/src/domains/**, .planning/phases/47-type-check-zero/47-EXCEPTIONS.md</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §7.2 (domains = 153 errors), §7.1 (top file: src/domains/intake/hooks/useIntakeApi.ts 17 errors)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md D-01, D-03, D-04
    - .planning/phases/47-type-check-zero/47-01-frontend-type-fix-SUMMARY.md (Deviation 2: pnpm filter is `intake-frontend`)
    - frontend/src/domains/intake/hooks/useIntakeApi.ts
  </read_first>
  <action>
    1. **Capture baseline:**
       ```bash
       git rev-parse phase-47-base   # MUST return SHA
       pnpm --filter intake-frontend type-check 2>&1 | grep '^src/domains/' > /tmp/47-08-domains-baseline.txt
       wc -l /tmp/47-08-domains-baseline.txt
       pnpm --filter intake-frontend type-check 2>&1 | grep '^src/domains/' | grep -oE '^[^(]+\.tsx?' | sort | uniq -c | sort -rn
       ```

    2. **Process by descending error count.** Top file: `useIntakeApi.ts` (17 errors).

    3. **For each file:**
       - TS6133 / TS6196 → DELETE per D-03 (D-04 four-globbed-grep before any exported deletion).
       - TS2339 / TS2322 / TS7006 / TS18046 → real fix (annotate param, narrow union, fix prop type).

    4. **Forbidden:**
       - `@ts-ignore` / `@ts-expect-error`
       - bare `as any`
       - editing `backend/src/**`

    5. **Re-run histogram every 3-5 files:**
       ```bash
       pnpm --filter intake-frontend type-check 2>&1 | grep '^src/domains/' | wc -l
       ```

    6. **Single commit at task end.** Commit message: `fix(47-08): src/domains/* cluster — N→0 errors`.

  </action>
  <verify>
    <automated>
      pnpm --filter intake-frontend type-check 2>&1 | grep '^src/domains/' | wc -l   # returns 0
      git diff phase-47-base..HEAD -- backend/src | wc -l   # returns 0
      git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
      git diff phase-47-base..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'   # returns 0
      head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"   # returns 1
      head -1 frontend/src/routeTree.gen.ts | grep -c "@ts-nocheck"   # returns 1
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/domains/' | wc -l` returns 0.
    - `git diff phase-47-base..HEAD -- backend/src | wc -l` returns 0.
    - `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
    - `git diff phase-47-base..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'` returns 0.
    - 47-EXCEPTIONS.md pre-existing 4 ledger rows byte-unchanged.
  </acceptance_criteria>
  <done>src/domains/* type-clean.</done>
</task>

</tasks>

<verification>
- Domains error count = 0.
- backend/src diff empty.
- No new suppressions.
</verification>

<success_criteria>

- TYPE-01 (slice): domains cleared. ✅
- TYPE-04: zero net-new. ✅
- D-04: backend/src untouched. ✅
  </success_criteria>

<output>
After completion, create `.planning/phases/47-type-check-zero/47-08-frontend-domains-cluster-SUMMARY.md` covering: pre/post error count, top files fixed, fence verification.
</output>
