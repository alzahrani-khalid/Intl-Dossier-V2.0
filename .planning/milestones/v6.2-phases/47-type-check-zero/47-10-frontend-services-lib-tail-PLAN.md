---
phase: 47
plan: 10
type: execute
wave: 2
depends_on: [47-01]
gap_closure: true
files_modified:
  - frontend/src/services/user-management-api.ts
  - frontend/src/services/**
  - frontend/src/lib/**
  - frontend/src/utils/**
  - frontend/src/store/**
  - frontend/src/contexts/**
  - frontend/src/design-system/**
  - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md
autonomous: true
requirements: [TYPE-01, TYPE-04]
must_haves:
  truths:
    - 'pnpm --filter intake-frontend type-check 2>&1 | grep -E "^src/(services|lib|utils|store|contexts|design-system)/" | wc -l returns 0'
    - 'No edits to backend/src — cross-workspace fence (D-04) holds'
    - 'No net-new @ts-(ignore|expect-error) introduced'
    - 'No new bare `as any` casts'
  artifacts:
    - path: 'frontend/src/services/user-management-api.ts'
      provides: 'Type-clean (15 errors → 0)'
  key_links:
    - from: 'frontend/src/{services,lib,utils,store,contexts,design-system}/**'
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
    component: 'frontend/src/{services,lib,utils,store,contexts,design-system}/* deletions'
    disposition: mitigate
    mitigation: 'D-04 four-globbed-grep before export deletion. backend/src diff = 0.'
  T-47-03:
    category: Tampering
    component: 'every code-fix in this plan'
    disposition: mitigate
    mitigation: 'suppression-diff = 0.'
  T-47-04:
    category: Tampering
    component: 'pre-existing TYPE-04 sites'
    disposition: mitigate
    mitigation: 'Out of scope; pre-existing ledger rows byte-unchanged.'
---

<objective>
Source: 47-01 PLAN.md Task 9.

Drive `pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/(services|lib|utils|store|contexts|design-system)/'` from ~119 errors (services 59 + lib 44 + utils 9 + store 5 + design-system 1 + contexts 1 per RESEARCH §7.2) to 0. Same playbook: D-03 + D-04, top-down.

**Purpose:** TYPE-01 phase-goal slice. This is the last cluster before 47-11 final reconciliation; after this task, the only remaining errors should live in (or be inert at) the 2 TYPE-04 ledger files (IntakeForm.tsx + Icon.test.tsx) — and those have justified pre-existing suppressions, no actual TS errors.

**Output:** Six tail directories type-clean; no new suppressions; backend/src untouched.
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
<!-- Top-error file per RESEARCH §7.1: -->
frontend/src/services/user-management-api.ts (15)

<!-- Subtree breakdown per RESEARCH §7.2: -->

src/services/ 59 errors
src/lib/ 44 errors
src/utils/ 9 errors
src/store/ 5 errors
src/contexts/ 1 error
src/design-system/ 1 error

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

| Boundary                 | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| frontend → backend types | Some services/lib import from `backend/src/types/*`.      |
| Source code → CI gate    | Adding `@ts-ignore` / `@ts-expect-error` defeats TYPE-01. |

## STRIDE Threat Register

| Threat ID | Category  | Component                                                 | Disposition | Mitigation Plan                                                      |
| --------- | --------- | --------------------------------------------------------- | ----------- | -------------------------------------------------------------------- |
| T-47-02   | Tampering | services/lib/utils/store/contexts/design-system deletions | mitigate    | D-04 four-globbed-grep before export deletion. backend/src diff = 0. |
| T-47-03   | Tampering | every code-fix in this plan                               | mitigate    | suppression-diff = 0.                                                |
| T-47-04   | Tampering | pre-existing TYPE-04 sites                                | mitigate    | Out of scope.                                                        |

</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: src/services/* + src/lib/* + tail dirs (~119 errors)</name>
  <files>frontend/src/services/**, frontend/src/lib/**, frontend/src/utils/**, frontend/src/store/**, frontend/src/contexts/**, frontend/src/design-system/**, .planning/phases/47-type-check-zero/47-EXCEPTIONS.md</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §7.2 (per-subtree breakdown), §7.1 (top file: services/user-management-api.ts 15 errors)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md D-01, D-03, D-04
    - .planning/phases/47-type-check-zero/47-01-frontend-type-fix-SUMMARY.md (Deviation 2: pnpm filter is `intake-frontend`)
    - frontend/src/services/user-management-api.ts
  </read_first>
  <action>
    1. **Capture baseline:**
       ```bash
       git rev-parse phase-47-base   # MUST return SHA
       pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/(services|lib|utils|store|contexts|design-system)/' > /tmp/47-10-tail-baseline.txt
       wc -l /tmp/47-10-tail-baseline.txt
       pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/(services|lib|utils|store|contexts|design-system)/' | grep -oE '^[^(]+\.tsx?' | sort | uniq -c | sort -rn
       ```

    2. **Process by descending error count.** Top file: services/user-management-api.ts (15 errors).

    3. **For each file:**
       - TS6133 / TS6196 → DELETE per D-03 (D-04 four-globbed-grep before any exported deletion).
       - Real type errors (TS2339 / TS2322 / TS7006 / TS18046 / TS2554) → fix at source.

    4. **Forbidden:**
       - `@ts-ignore` / `@ts-expect-error`
       - bare `as any`
       - editing `backend/src/**`

    5. **Re-run histogram every 3-5 files:**
       ```bash
       pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/(services|lib|utils|store|contexts|design-system)/' | wc -l
       ```

    6. **Single commit at task end.** Commit message: `fix(47-10): services + lib + tail dirs — N→0 errors`.

  </action>
  <verify>
    <automated>
      pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/(services|lib|utils|store|contexts|design-system)/' | wc -l   # returns 0
      git diff phase-47-base..HEAD -- backend/src | wc -l   # returns 0
      git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
      git diff phase-47-base..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'   # returns 0
      head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"   # returns 1
      head -1 frontend/src/routeTree.gen.ts | grep -c "@ts-nocheck"   # returns 1
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/(services|lib|utils|store|contexts|design-system)/' | wc -l` returns 0.
    - `git diff phase-47-base..HEAD -- backend/src | wc -l` returns 0.
    - `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
    - `git diff phase-47-base..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'` returns 0.
    - 47-EXCEPTIONS.md pre-existing 4 ledger rows byte-unchanged.
  </acceptance_criteria>
  <done>Tail directories cleared; only TYPE-04 ledger reconciliation (47-11) remains.</done>
</task>

</tasks>

<verification>
- Tail dirs error count = 0.
- backend/src diff empty.
- No new suppressions.
</verification>

<success_criteria>

- TYPE-01 (slice): tail dirs cleared. ✅
- TYPE-04: zero net-new. ✅
- D-04: backend/src untouched. ✅
  </success_criteria>

<output>
After completion, create `.planning/phases/47-type-check-zero/47-10-frontend-services-lib-tail-SUMMARY.md` covering: pre/post error count per subtree, top files fixed, fence verification.
</output>
