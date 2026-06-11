---
phase: 47
plan: 06
type: execute
wave: 2
depends_on: [47-01]
gap_closure: true
files_modified:
  - frontend/src/components/report-builder/**
  - frontend/src/components/calendar/**
  - frontend/src/components/onboarding/**
  - frontend/src/components/tags/**
  - frontend/src/components/stakeholder-timeline/**
  - frontend/src/components/triage-panel/**
  - frontend/src/components/compliance/**
  - frontend/src/components/availability-polling/**
  - frontend/src/components/ui/**
  - frontend/src/components/**
  - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md
autonomous: true
requirements: [TYPE-01, TYPE-04]
must_haves:
  truths:
    - 'pnpm --filter intake-frontend type-check 2>&1 | grep "^src/components/" | grep -vE "^src/components/(tasks|kanban|entity-links|intake-form/IntakeForm|signature-visuals/__tests__/Icon)" | wc -l returns 0'
    - 'No edits to backend/src — cross-workspace fence (D-04) holds'
    - 'No net-new @ts-(ignore|expect-error) introduced'
    - 'No new bare `as any` casts'
    - 'IntakeForm.tsx and Icon.test.tsx byte-unchanged (TYPE-04 ledger rows owned by 47-11)'
  artifacts:
    - path: 'frontend/src/components/report-builder/ReportBuilder.tsx'
      provides: 'Type-clean (32 errors → 0)'
    - path: 'frontend/src/components/calendar/CalendarSyncSettings.tsx'
      provides: 'Type-clean (31 errors → 0)'
    - path: 'frontend/src/components/tags/TagAnalytics.tsx'
      provides: 'Type-clean (28 errors → 0)'
  key_links:
    - from: 'frontend/src/components/**'
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
    component: 'frontend/src/components/* deletions'
    disposition: mitigate
    mitigation: 'D-04 four-globbed-grep recipe before any export deletion. git diff phase-47-base..HEAD -- backend/src returns 0.'
  T-47-03:
    category: Tampering
    component: 'every code-fix in this plan'
    disposition: mitigate
    mitigation: 'git diff phase-47-base..HEAD -- frontend/src | grep -E "^\\+.*@ts-(ignore|expect-error)" | wc -l returns 0.'
  T-47-04:
    category: Tampering
    component: 'pre-existing TYPE-04 sites (IntakeForm.tsx, Icon.test.tsx)'
    disposition: mitigate
    mitigation: 'These two files are out of scope. Acceptance grep confirms byte-unchanged.'
---

<objective>
Source: 47-01 PLAN.md Task 5.

Drive `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/components/'` (excluding 47-05 dirs `tasks|kanban|entity-links` and excluding TYPE-04 ledger sites `intake-form/IntakeForm.tsx` + `signature-visuals/__tests__/Icon.test.tsx`) from ~280 errors to 0.

**Purpose:** TYPE-01 phase-goal slice. The remaining `src/components/**` cluster after 47-05 covers the largest single error pool in the frontend (top files have 15-32 errors each per RESEARCH §7.1).

**Output:** Components remainder cluster type-clean; no new suppressions; backend/src untouched; the 2 TYPE-04 sites remain byte-unchanged for 47-11.
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
<!-- Top-10 files by error count (RESEARCH §7.1) — process in this order: -->
frontend/src/components/report-builder/ReportBuilder.tsx              (32)
frontend/src/components/calendar/CalendarSyncSettings.tsx             (31)
frontend/src/components/tags/TagAnalytics.tsx                         (28)
frontend/src/components/onboarding/OnboardingChecklist.tsx            (27)
frontend/src/components/tags/TagSelector.tsx                          (25)
frontend/src/components/stakeholder-timeline/StakeholderInteractionTimeline.tsx  (23)
frontend/src/components/compliance/ComplianceRulesManager.tsx         (22)
frontend/src/components/triage-panel/TriagePanel.tsx                  (21)
frontend/src/components/availability-polling/AvailabilityPollResults.tsx  (16)
frontend/src/components/ui/content-skeletons.tsx                      (15)

<!-- D-04 verification recipe (run BEFORE deleting any exported declaration). All four MUST return 0 hits. -->

grep -rn "<SymbolName>" frontend/src backend/src 2>/dev/null
grep -rn "<SymbolName>" supabase/functions 2>/dev/null
grep -rn "<SymbolName>" tests 2>/dev/null
grep -rn "<SymbolName>" shared 2>/dev/null

<!-- DO NOT EDIT in this plan: -->

backend/src/** // cross-workspace fence
frontend/src/components/tasks/** // owned by 47-05
frontend/src/components/kanban/** // owned by 47-05
frontend/src/components/entity-links/** // owned by 47-05
frontend/src/components/intake-form/IntakeForm.tsx // TYPE-04 ledger — 47-11 owns
frontend/src/components/signature-visuals/**tests**/Icon.test.tsx // TYPE-04 ledger — 47-11 owns
frontend/src/types/database.types.ts // already @ts-nocheck (47-01 Task 2)
frontend/src/routeTree.gen.ts // pre-existing @ts-nocheck

</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                 | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| frontend → backend types | Several components import from `backend/src/types/*`.     |
| Source code → CI gate    | Adding `@ts-ignore` / `@ts-expect-error` defeats TYPE-01. |

## STRIDE Threat Register

| Threat ID | Category  | Component                             | Disposition | Mitigation Plan                                                                                                  |
| --------- | --------- | ------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| T-47-02   | Tampering | `frontend/src/components/*` deletions | mitigate    | D-04 four-globbed-grep before any exported deletion. `git diff phase-47-base..HEAD -- backend/src` returns 0.    |
| T-47-03   | Tampering | every code-fix in this plan           | mitigate    | `git diff phase-47-base..HEAD -- frontend/src \| grep -E '^\\+.*@ts-(ignore\|expect-error)' \| wc -l` returns 0. |
| T-47-04   | Tampering | TYPE-04 ledger sites                  | mitigate    | Out-of-scope; acceptance grep confirms byte-unchanged.                                                           |

</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: components remainder cluster (~280 errors)</name>
  <files>frontend/src/components/** (excluding tasks, kanban, entity-links, IntakeForm.tsx, Icon.test.tsx), .planning/phases/47-type-check-zero/47-EXCEPTIONS.md</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §7.1 (top-25 frontend files — many in this cluster)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md D-01, D-03, D-04
    - .planning/phases/47-type-check-zero/47-01-frontend-type-fix-SUMMARY.md (Deviations: pnpm filter is `intake-frontend`)
    - frontend/src/components/report-builder/ReportBuilder.tsx (32 errors)
    - frontend/src/components/calendar/CalendarSyncSettings.tsx (31 errors)
    - frontend/src/components/tags/TagAnalytics.tsx (28 errors)
    - frontend/src/components/onboarding/OnboardingChecklist.tsx (27 errors)
    - frontend/src/components/tags/TagSelector.tsx (25 errors)
    - frontend/src/components/stakeholder-timeline/StakeholderInteractionTimeline.tsx (23 errors)
    - frontend/src/components/compliance/ComplianceRulesManager.tsx (22 errors)
    - frontend/src/components/triage-panel/TriagePanel.tsx (21 errors)
    - frontend/src/components/availability-polling/AvailabilityPollResults.tsx (16 errors)
    - frontend/src/components/ui/content-skeletons.tsx (15 errors)
  </read_first>
  <action>
    1. **Capture per-file baseline:**
       ```bash
       git rev-parse phase-47-base   # MUST return SHA
       pnpm --filter intake-frontend type-check 2>&1 \
         | grep '^src/components/' \
         | grep -vE '^src/components/(tasks|kanban|entity-links|intake-form/IntakeForm|signature-visuals/__tests__/Icon)' \
         | grep -oE '^[^(]+\.tsx?' \
         | sort | uniq -c | sort -rn > /tmp/47-06-components-baseline.txt
       cat /tmp/47-06-components-baseline.txt
       ```

    2. **Process by descending error count** (top-10 first per RESEARCH §7.1; iterate the rest after).

    3. **For each file, classify and fix:**
       - **TS6133 / TS6196:** DELETE per D-03. Run D-04 four-globbed-grep recipe for any exported symbol before deletion. Any cross-surface hit → SKIP and append a row to `47-EXCEPTIONS.md` `## Deferred deletions (cross-surface consumers)`.
       - **Real type errors (TS2339 / TS2322 / TS7006 / TS18046 / TS2554):** fix at source — annotate parameter, narrow union, fix prop type, replace removed prop. NEVER widen with `as any`.

    4. **Forbidden:**
       - `@ts-ignore` / `@ts-expect-error` (D-01)
       - bare `as any` (use `as unknown as <RealType>` with comment if cast required)
       - editing `backend/src/**` (cross-workspace fence)
       - editing `frontend/src/components/intake-form/IntakeForm.tsx` (47-11 owns)
       - editing `frontend/src/components/signature-visuals/__tests__/Icon.test.tsx` (47-11 owns)
       - editing `frontend/src/components/{tasks,kanban,entity-links}/**` (47-05 owns)

    5. **Re-run histogram every 3-5 files:**
       ```bash
       pnpm --filter intake-frontend type-check 2>&1 \
         | grep '^src/components/' \
         | grep -vE '^src/components/(tasks|kanban|entity-links|intake-form/IntakeForm|signature-visuals/__tests__/Icon)' \
         | wc -l
       ```
       Confirm monotonic decrease.

    6. **Single commit at task end** (pre-commit hook runs `turbo run build` ~2-3min). Commit message: `fix(47-06): components remainder cluster — N→0 errors`.

  </action>
  <verify>
    <automated>
      pnpm --filter intake-frontend type-check 2>&1 | grep '^src/components/' | grep -vE '^src/components/(tasks|kanban|entity-links|intake-form/IntakeForm|signature-visuals/__tests__/Icon)' | wc -l   # returns 0
      git diff phase-47-base..HEAD -- backend/src | wc -l   # returns 0
      git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
      git diff phase-47-base..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'   # returns 0
      git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l   # returns 0
      git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l   # returns 0
      git diff phase-47-base..HEAD -- frontend/src/components/tasks frontend/src/components/kanban frontend/src/components/entity-links | wc -l   # MAY be non-zero ONLY if 47-05 already committed; this plan must produce 0 changes here itself (verified via per-task base if needed)
      head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"   # returns 1
      head -1 frontend/src/routeTree.gen.ts | grep -c "@ts-nocheck"   # returns 1
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter intake-frontend type-check 2>&1 | grep '^src/components/' | grep -vE '^src/components/(tasks|kanban|entity-links|intake-form/IntakeForm|signature-visuals/__tests__/Icon)' | wc -l` returns 0.
    - No file from this cluster appears in the top-25 list when histogram is re-run.
    - `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
    - `git diff phase-47-base..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'` returns 0.
    - `git diff phase-47-base..HEAD -- backend/src | wc -l` returns 0.
    - `git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l` returns 0.
    - `git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l` returns 0.
    - 47-EXCEPTIONS.md pre-existing 4 ledger rows are byte-unchanged.
  </acceptance_criteria>
  <done>
    Components remainder cluster cleared; no new suppressions; backend/src untouched; TYPE-04 ledger sites byte-unchanged.
  </done>
</task>

</tasks>

<verification>
- Components remainder error count = 0.
- `git diff phase-47-base..HEAD -- backend/src` returns empty.
- No new suppressions or bare `as any`.
- TYPE-04 ledger sites byte-unchanged.
</verification>

<success_criteria>

- TYPE-01 (slice): components remainder cleared. ✅
- TYPE-04: zero net-new suppressions; deferred deletions ledgered. ✅
- D-04: zero edits to `backend/src`. ✅
- D-11: zero edits to tsconfig. ✅
  </success_criteria>

<output>
After completion, create `.planning/phases/47-type-check-zero/47-06-frontend-components-remainder-SUMMARY.md` covering: pre/post per-file error counts, list of deletions, deferred-deletions ledgered, and fence verification.
</output>
