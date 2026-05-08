---
phase: 47
plan: 11
type: execute
wave: 3
depends_on: [47-04, 47-05, 47-06, 47-07, 47-08, 47-09, 47-10]
gap_closure: true
files_modified:
  - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md
autonomous: true
requirements: [TYPE-01, TYPE-04]
must_haves:
  truths:
    - 'pnpm --filter intake-frontend type-check; echo $? returns 0 (TYPE-01 SATISFIED for the frontend half)'
    - 'git diff phase-47-base..HEAD -- frontend/src | grep -E "^\+.*@ts-(ignore|expect-error)" | wc -l returns 0 (TYPE-04 net-new = 0)'
    - 'git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l returns 0 (pre-existing TYPE-04 site byte-unchanged for the entire phase)'
    - 'git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l returns 0 (pre-existing TYPE-04 site byte-unchanged for the entire phase)'
    - '47-EXCEPTIONS.md `## Frontend final histogram` populated and shows 0 errors (or only justified residual matched 1:1 by ledger rows)'
    - 'No edits to backend/src — cross-workspace fence (D-04) holds'
  artifacts:
    - path: '.planning/phases/47-type-check-zero/47-EXCEPTIONS.md'
      provides: 'Updated `## Frontend final histogram` section + suppression-diff confirmation log'
      contains: 'Frontend final histogram'
  key_links:
    - from: 'phase-47-base git tag'
      to: 'frontend tsc current state'
      via: 'git diff phase-47-base..HEAD -- frontend/src'
      pattern: 'phase-47-base'
phase_decisions_locked:
  D-01_no_new_suppressions: 'Final task asserts D-01 holds for the entire plan window from phase-47-base..HEAD.'
  D-04_cross_workspace_fence: 'No edits to backend/src in this plan or any predecessor frontend plan.'
  TYPE-04_ledger_immutable: 'Pre-seeded ledger rows for IntakeForm.tsx and Icon.test.tsx (seeded by 47-01 Task 1) are byte-unchanged for the entire phase. Inline comments at those two sites are byte-unchanged for the entire phase.'
threat_model:
  T-47-02:
    category: Tampering
    component: 'cumulative cross-workspace fence across all 47-04..47-10 plans'
    disposition: mitigate
    mitigation: 'Acceptance includes git diff phase-47-base..HEAD -- backend/src | wc -l returns 0 (verifies no predecessor crossed the fence; this plan adds no edits to backend/src either).'
  T-47-03:
    category: Tampering
    component: 'cumulative suppression-discipline across all 47-04..47-10 plans'
    disposition: mitigate
    mitigation: 'Acceptance includes git diff phase-47-base..HEAD -- frontend/src | grep -E "^\\+.*@ts-(ignore|expect-error)" | wc -l returns 0. If non-zero, the phase has violated D-01 and routes to gap-closure.'
  T-47-04:
    category: Tampering
    component: 'pre-existing TYPE-04 sites (IntakeForm.tsx + Icon.test.tsx)'
    disposition: mitigate
    mitigation: 'Acceptance includes byte-equal diff checks on both files. The inline @ts-expect-error lines are byte-unchanged for the entire phase per 47-01 Task 10 design — modifying them would add `+@ts-expect-error` to the unified diff and break D-01 net-new=0 contract.'
---

<objective>
Source: 47-01 PLAN.md Task 10.

Confirm `pnpm --filter intake-frontend type-check` exits 0 across the entire frontend after Wave 2 plans (47-04..47-10) have committed. Update `47-EXCEPTIONS.md` with the frontend final histogram. Run the cumulative D-01 suppression-diff against `phase-47-base` to assert net-new = 0. Reconfirm the 4 pre-seeded TYPE-04 ledger rows are byte-unchanged.

**Purpose:** Phase-goal closure for the frontend half of TYPE-01 + TYPE-04. This plan touches NO source code — operates purely on `47-EXCEPTIONS.md` and runs verification commands.

**Output:** `47-EXCEPTIONS.md` `## Frontend final histogram` section populated; cumulative suppression-diff confirmed; phase ready for 47-02 (backend) and 47-03 (CI gate).

**Scope note:** This plan does NOT touch source code. The two pre-existing TYPE-04 sites (IntakeForm.tsx + Icon.test.tsx) remain byte-unchanged — their inline `@ts-expect-error` already satisfies the "reason exists" half of TYPE-04, and the seeded 47-EXCEPTIONS.md ledger rows (from 47-01 Task 1) satisfy the "follow-up reference exists" half. Touching the inline comments would add `+` lines containing `@ts-expect-error` to the unified diff and break D-01 net-new=0 contract.
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
@.planning/phases/47-type-check-zero/47-04-frontend-types-cluster-SUMMARY.md
@.planning/phases/47-type-check-zero/47-05-frontend-components-crossworkspace-SUMMARY.md
@.planning/phases/47-type-check-zero/47-06-frontend-components-remainder-SUMMARY.md
@.planning/phases/47-type-check-zero/47-07-frontend-hooks-cluster-SUMMARY.md
@.planning/phases/47-type-check-zero/47-08-frontend-domains-cluster-SUMMARY.md
@.planning/phases/47-type-check-zero/47-09-frontend-pages-routes-SUMMARY.md
@.planning/phases/47-type-check-zero/47-10-frontend-services-lib-tail-SUMMARY.md
@./CLAUDE.md
@frontend/tsconfig.json
@frontend/package.json

<interfaces>
<!-- TYPE-04 ledger rows (seeded by 47-01 Task 1) — these MUST be byte-unchanged for the entire phase: -->

| File                                                              | Suppression                                                          | Status                                           |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------ |
| frontend/src/components/intake-form/IntakeForm.tsx                | inline `// @ts-expect-error Type instantiation too deep`             | DO NOT modify in this plan or any predecessor    |
| frontend/src/components/signature-visuals/**tests**/Icon.test.tsx | inline `// @ts-expect-error — runtime fallback for typing escapes`   | DO NOT modify in this plan or any predecessor    |
| frontend/src/types/database.types.ts                              | top-of-file `// @ts-nocheck` (added by 47-01 Task 2 commit ab3d573b) | Preserve as-is                                   |
| backend/src/types/database.types.ts                               | deferred-to-47-02 row                                                | 47-02 will apply @ts-nocheck — out of scope here |

<!-- D-01 cumulative suppression-diff: the keystone gate for this final plan. -->
<!-- Note: @ts-nocheck is tracked separately and does NOT match the @ts-(ignore|expect-error) regex. -->

</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                            | Description                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| All predecessor plans → final state | Cumulative D-01 / D-04 enforcement happens here.                                 |
| TYPE-04 ledger → source code        | The two pre-existing inline `@ts-expect-error` sites must remain byte-unchanged. |

## STRIDE Threat Register

| Threat ID | Category  | Component                         | Disposition | Mitigation Plan                                                                                                                                   |
| --------- | --------- | --------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-47-02   | Tampering | cumulative cross-workspace fence  | mitigate    | `git diff phase-47-base..HEAD -- backend/src \| wc -l` returns 0.                                                                                 |
| T-47-03   | Tampering | cumulative suppression discipline | mitigate    | `git diff phase-47-base..HEAD -- frontend/src \| grep -E '^\\+.*@ts-(ignore\|expect-error)' \| wc -l` returns 0. Non-zero → route to gap-closure. |
| T-47-04   | Tampering | pre-existing TYPE-04 sites        | mitigate    | Byte-equal diff checks on IntakeForm.tsx and Icon.test.tsx; ledger rows byte-unchanged.                                                           |

</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: Frontend zero-confirm + cumulative suppression-diff confirmation</name>
  <files>(verification only — no file edits in this step)</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §11.12 (the two pre-existing @ts-expect-error sites — DO NOT modify their inline comments)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md D-01, D-02, TYPE-04 verbatim from REQUIREMENTS.md
    - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md (the 4 pre-existing rows seeded by 47-01 Task 1+2 — they are byte-immutable)
    - .planning/phases/47-type-check-zero/47-01-frontend-type-fix-SUMMARY.md (Deviation 2: pnpm filter is `intake-frontend`)
  </read_first>
  <action>
    **DO NOT modify** the inline `@ts-expect-error` comments in IntakeForm.tsx or Icon.test.tsx. The pre-existing inline reason already satisfies the "reason exists" half of TYPE-04; the "follow-up reference exists" half is satisfied entirely by the seeded ledger rows in 47-EXCEPTIONS.md (from 47-01 Task 1).

    1. **Confirm phase-47-base tag is reachable:**
       ```bash
       git rev-parse phase-47-base   # MUST return SHA 41f28f169a2ca3bc2ed75b407f62f9f1b14404e5
       ```

    2. **Run frontend tsc and confirm exit 0:**
       ```bash
       pnpm --filter intake-frontend type-check; echo "exit=$?"
       # MUST print exit=0
       ```
       If exit != 0:
       - Capture the residual error list: `pnpm --filter intake-frontend type-check 2>&1 | tee /tmp/47-11-residual.txt`.
       - The plan FAILS. Return to gap-closure orchestrator with the residual list — do NOT add suppressions to silence it.

    3. **Run summary histogram:**
       ```bash
       pnpm --filter intake-frontend run type-check:summary
       # MUST print empty histogram or only the header line
       ```

    4. **Cumulative D-01 suppression-diff (the keystone gate):**
       ```bash
       git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l
       # MUST equal 0
       ```
       Why this works:
       - The two pre-existing inline `@ts-expect-error` lines are byte-unchanged for the entire phase, so they do NOT appear as `+` lines.
       - D-01 forbids new `@ts-(ignore|expect-error)` introduction.
       - The 47-01 Task 2 `@ts-nocheck` on `frontend/src/types/database.types.ts` does NOT match this regex (different token, tracked separately in 47-EXCEPTIONS.md and 47-03 Task 6).

       If the count is non-zero:
       - Capture the offending lines: `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' > /tmp/47-11-d01-violations.txt`.
       - The plan FAILS. Either revert each offending change or, if the addition is genuinely justified, append a new row to `47-EXCEPTIONS.md` `## Retained suppressions (TYPE-04 ledger)` with the deviation rationale — then re-run the regex with that line excluded; net-new must still be 0 against the ledger.

    5. **Cumulative cross-workspace fence (D-04):**
       ```bash
       git diff phase-47-base..HEAD -- backend/src | wc -l
       # MUST equal 0
       ```
       If non-zero, a predecessor frontend plan crossed the fence. The plan FAILS — route to gap-closure.

    6. **Reconfirm pre-seeded ledger rows are intact:**
       ```bash
       grep -c "frontend/src/components/intake-form/IntakeForm.tsx" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md   # >=1
       grep -c "frontend/src/components/signature-visuals/__tests__/Icon.test.tsx" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md   # >=1
       grep -c "frontend/src/types/database.types.ts" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md   # >=1 (added by 47-01 Task 2)
       grep -c "backend/src/types/database.types.ts" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md   # >=1 (deferred-to-47-02 row)
       ```

    7. **Reconfirm pre-existing TYPE-04 sites are byte-unchanged for the entire phase:**
       ```bash
       git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l   # MUST equal 0
       git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l   # MUST equal 0
       ```

    8. **Reconfirm generated files are byte-unchanged in this plan and preserve their @ts-nocheck headers:**
       ```bash
       head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"   # returns 1
       head -1 frontend/src/routeTree.gen.ts | grep -c "@ts-nocheck"   # returns 1
       ```

  </action>
  <verify>
    <automated>
      git rev-parse phase-47-base   # returns 41f28f169a2ca3bc2ed75b407f62f9f1b14404e5
      pnpm --filter intake-frontend type-check; echo $?   # exit 0
      git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # MUST be 0
      git diff phase-47-base..HEAD -- backend/src | wc -l   # MUST be 0
      git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l   # 0 (file byte-unchanged)
      git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l   # 0 (file byte-unchanged)
      head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"   # 1
      head -1 frontend/src/routeTree.gen.ts | grep -c "@ts-nocheck"   # 1
    </automated>
  </verify>
  <acceptance_criteria>
    - `git rev-parse phase-47-base` returns the expected SHA.
    - `pnpm --filter intake-frontend type-check; echo $?` returns `0`. (TYPE-01 frontend half SATISFIED.)
    - `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0. (D-01 cumulative.)
    - `git diff phase-47-base..HEAD -- backend/src | wc -l` returns 0. (D-04 cumulative.)
    - `git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l` returns 0.
    - `git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l` returns 0.
    - All 4 pre-seeded ledger rows still present in 47-EXCEPTIONS.md (grep counts >=1 each).
    - Generated files still have @ts-nocheck at top.
  </acceptance_criteria>
  <done>
    Verification commands all pass; ready to write the final histogram in Task 2.
  </done>
</task>

<task type="auto">
  <name>Task 2: Update 47-EXCEPTIONS.md `## Frontend final histogram` and commit</name>
  <files>.planning/phases/47-type-check-zero/47-EXCEPTIONS.md</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md (current state — find the `## Frontend final histogram` placeholder section seeded by 47-01 Task 1)
  </read_first>
  <action>
    1. **Capture final histogram:**
       ```bash
       pnpm --filter intake-frontend run type-check:summary > /tmp/47-11-final-histogram.txt 2>&1
       cat /tmp/47-11-final-histogram.txt
       ```

    2. **Edit `47-EXCEPTIONS.md`:** locate `## Frontend final histogram` (placeholder seeded by 47-01 Task 1) and replace its body with the captured histogram output. Expected content:
       - Either an empty histogram (0 errors), OR
       - A near-empty histogram showing only the residual that is matched 1:1 by ledger rows (each residual line traced to a `## Retained suppressions` entry).

       Add a closing line documenting the cumulative D-01 / D-04 verification:
       ```markdown
       ### Cumulative D-01 / D-04 verification (47-11 Task 1)

       - `pnpm --filter intake-frontend type-check; echo $?` → 0
       - `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` → 0
       - `git diff phase-47-base..HEAD -- backend/src | wc -l` → 0
       - `git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l` → 0
       - `git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l` → 0

       Frontend half of Phase 47 closed. Backend (47-02) and CI gate (47-03) remain.
       ```

    3. **Confirm 47-EXCEPTIONS.md pre-existing 4 ledger rows are still byte-equal** to their phase-47-base content:
       ```bash
       # Each row line should match phase-47-base content exactly (only `## Frontend final histogram` body changed in this task)
       grep "frontend/src/components/intake-form/IntakeForm.tsx" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md
       grep "frontend/src/components/signature-visuals/__tests__/Icon.test.tsx" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md
       grep "frontend/src/types/database.types.ts" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md
       grep "backend/src/types/database.types.ts" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md
       ```

    4. **Commit:**
       ```bash
       git add .planning/phases/47-type-check-zero/47-EXCEPTIONS.md
       git commit -m "docs(47-11): final frontend histogram + cumulative D-01/D-04 verification log"
       ```

  </action>
  <verify>
    <automated>
      grep -c "^## Frontend final histogram" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md   # returns 1
      grep -c "Cumulative D-01 / D-04 verification" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md   # returns 1
      grep -c "frontend/src/components/intake-form/IntakeForm.tsx" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md   # >=1 (preserved)
      grep -c "frontend/src/components/signature-visuals/__tests__/Icon.test.tsx" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md   # >=1 (preserved)
      grep -c "frontend/src/types/database.types.ts" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md   # >=1 (preserved)
      grep -c "backend/src/types/database.types.ts" .planning/phases/47-type-check-zero/47-EXCEPTIONS.md   # >=1 (preserved)
      pnpm --filter intake-frontend type-check; echo $?   # still exit 0 after the doc edit
      git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # still 0
    </automated>
  </verify>
  <acceptance_criteria>
    - `47-EXCEPTIONS.md` `## Frontend final histogram` is populated with output of `type-check:summary` (empty or near-empty).
    - `47-EXCEPTIONS.md` contains the new "Cumulative D-01 / D-04 verification" subsection with the 5 confirmed checks.
    - All 4 pre-existing ledger rows still present and byte-unchanged in their original lines.
    - Commit `docs(47-11): final frontend histogram + cumulative D-01/D-04 verification log` exists in git history.
    - Post-commit re-verification: `pnpm --filter intake-frontend type-check; echo $?` returns 0; cumulative suppression-diff still 0.
  </acceptance_criteria>
  <done>
    Frontend half of TYPE-01 + TYPE-04 closed. 47-EXCEPTIONS.md is the source-of-truth ledger; `pnpm --filter intake-frontend type-check` exits 0; net-new suppression-diff vs phase-47-base = 0; pre-existing TYPE-04 sites byte-unchanged for the entire phase. 47-02 (backend) and 47-03 (CI gate) can now proceed.
  </done>
</task>

</tasks>

<verification>
- `pnpm --filter intake-frontend type-check; echo $?` returns 0.
- `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
- `git diff phase-47-base..HEAD -- backend/src | wc -l` returns 0.
- `git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l` returns 0.
- `git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l` returns 0.
- 47-EXCEPTIONS.md has `## Frontend final histogram` populated and the cumulative-verification subsection.
- All 4 pre-existing ledger rows preserved.
</verification>

<success_criteria>

- TYPE-01 (frontend half): `pnpm --filter intake-frontend type-check` exits 0. ✅
- TYPE-04 (frontend half): zero net-new `@ts-ignore` / `@ts-expect-error`; one new `@ts-nocheck` (47-01 Task 2) logged in ledger; two pre-existing `@ts-expect-error` sites byte-unchanged with ledger rows. ✅
- D-04 cross-workspace fence respected cumulatively across all frontend plans. ✅
- D-11 respected: zero edits to `frontend/tsconfig.json`. ✅
- Phase ready for 47-02 (backend) and 47-03 (CI gate). ✅
  </success_criteria>

<output>
After completion, create `.planning/phases/47-type-check-zero/47-11-frontend-zero-confirm-final-SUMMARY.md` covering: final tsc exit code, cumulative suppression-diff = 0 confirmation, list of all 4 ledger rows still present, byte-equal verification of IntakeForm.tsx and Icon.test.tsx, and confirmation that the cross-workspace fence was respected (`git diff phase-47-base..HEAD -- backend/src | wc -l` = 0).
</output>
