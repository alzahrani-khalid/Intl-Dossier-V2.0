---
phase: 47
plan: 05
type: execute
wave: 2
depends_on: [47-01]
gap_closure: true
files_modified:
  - frontend/src/components/tasks/TaskEditDialog.tsx
  - frontend/src/components/tasks/TaskCard.tsx
  - frontend/src/components/tasks/ContributorsList.tsx
  - frontend/src/components/tasks/TaskDetail.tsx
  - frontend/src/components/kanban/KanbanBoard.tsx
  - frontend/src/components/entity-links/LinkTypeBadge.tsx
  - frontend/src/components/entity-links/LinkList.tsx
  - frontend/src/components/entity-links/EntityLinkManager.tsx
  - frontend/src/components/entity-links/EntitySearchDialog.tsx
  - frontend/src/components/entity-links/AISuggestionPanel.tsx
  - frontend/src/components/tasks/**
  - frontend/src/components/kanban/**
  - frontend/src/components/entity-links/**
  - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md
autonomous: true
requirements: [TYPE-01, TYPE-04]
must_haves:
  truths:
    - 'pnpm --filter intake-frontend type-check 2>&1 | grep -E "^src/components/(tasks|kanban|entity-links)/" | wc -l returns 0'
    - 'No edits to backend/src — cross-workspace fence (D-04) holds even though all 10 files in scope deep-import from backend/src/types/*'
    - 'No net-new @ts-(ignore|expect-error) introduced'
    - 'No new bare `as any` casts'
  artifacts:
    - path: 'frontend/src/components/tasks/TaskEditDialog.tsx'
      provides: 'Type-clean consumer of backend/src/types/database.types'
    - path: 'frontend/src/components/entity-links/AISuggestionPanel.tsx'
      provides: 'Type-clean consumer of backend/src/types/ai-suggestions.types'
    - path: '.planning/phases/47-type-check-zero/47-EXCEPTIONS.md'
      provides: 'Deferred to 47-02 entries when backend type genuinely needs reshape'
  key_links:
    - from: 'frontend/src/components/{tasks,kanban,entity-links}/*.tsx'
      to: 'backend/src/types/{database,intake-entity-links,ai-suggestions}.types.ts'
      via: 'deep relative imports (../../../../backend/src/types/*)'
      pattern: "\\.\\./\\.\\./\\.\\./\\.\\./backend/src/types"
phase_decisions_locked:
  D-01_no_new_suppressions: 'No @ts-ignore / @ts-expect-error introduced.'
  D-03_deletion_first: 'TS6133 / TS6196 → DELETE.'
  D-04_cross_workspace_fence: 'No edits to backend/src/types. Fix on consumer side OR ledger as deferred to 47-02.'
threat_model:
  T-47-02:
    category: Tampering
    component: 'frontend/src/components/{tasks,kanban,entity-links}/*.tsx'
    disposition: mitigate
    mitigation: 'D-04 four-globbed-grep recipe before any export deletion. Cross-workspace fence asserted via git diff phase-47-base..HEAD -- backend/src returns 0.'
  T-47-03:
    category: Tampering
    component: 'every code-fix in this plan'
    disposition: mitigate
    mitigation: 'git diff phase-47-base..HEAD -- frontend/src | grep -E "^\\+.*@ts-(ignore|expect-error)" | wc -l returns 0.'
  T-47-04:
    category: Tampering
    component: 'pre-existing TYPE-04 sites (IntakeForm.tsx, Icon.test.tsx)'
    disposition: mitigate
    mitigation: 'These files are NOT in scope of this plan. Acceptance grep confirms they remain byte-unchanged.'
---

<objective>
Source: 47-01 PLAN.md Task 4.

Drive `pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/components/(tasks|kanban|entity-links)/'` from current count to 0 across the 10 cross-workspace consumer files enumerated in 47-RESEARCH.md §4.2. These files deep-import from `backend/src/types/*` and are processed FIRST among components clusters because of the cross-workspace fence (D-04 / RESEARCH §10.3.4).

**Purpose:** TYPE-01 phase-goal slice. The 10 cross-workspace consumer files are the most fence-sensitive cluster — fixes must happen on the frontend consumption side; backend/src remains 47-02's surface.

**Output:** Cross-workspace consumer cluster type-clean; no edits to `backend/src`; 47-EXCEPTIONS.md updated with any "deferred to 47-02" entries when the backend type genuinely needs reshape.
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
<!-- Cross-workspace import sites (enumerated in 47-RESEARCH.md §4.2): -->

frontend/src/components/tasks/{TaskEditDialog,TaskCard,ContributorsList,TaskDetail}.tsx
→ ../../../../backend/src/types/database.types

frontend/src/components/kanban/KanbanBoard.tsx
→ ../../../../backend/src/types/database.types

frontend/src/components/entity-links/{LinkTypeBadge,LinkList,EntityLinkManager,EntitySearchDialog}.tsx
→ ../../../../backend/src/types/intake-entity-links.types

frontend/src/components/entity-links/AISuggestionPanel.tsx
→ ../../../../backend/src/types/ai-suggestions.types

<!-- D-04 verification recipe (run BEFORE deleting any exported declaration). All four MUST return 0 hits before deletion. -->

grep -rn "<SymbolName>" frontend/src backend/src 2>/dev/null
grep -rn "<SymbolName>" supabase/functions 2>/dev/null
grep -rn "<SymbolName>" tests 2>/dev/null
grep -rn "<SymbolName>" shared 2>/dev/null

<!-- DO NOT EDIT in this plan: -->

backend/src/types/database.types.ts // owned by 47-02 — cross-workspace fence
backend/src/types/intake-entity-links.types.ts // owned by 47-02
backend/src/types/ai-suggestions.types.ts // owned by 47-02
frontend/src/types/database.types.ts // already @ts-nocheck (47-01 Task 2)
frontend/src/routeTree.gen.ts // pre-existing @ts-nocheck
frontend/src/components/intake-form/IntakeForm.tsx // TYPE-04 ledger row — 47-11 owns
frontend/src/components/signature-visuals/**tests**/Icon.test.tsx // TYPE-04 ledger row — 47-11 owns

</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                 | Description                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| frontend → backend types | Deep-relative imports from `backend/src/types/*`. Editing backend would break the fence. |
| Source code → CI gate    | Adding `@ts-ignore` / `@ts-expect-error` defeats TYPE-01.                                |

## STRIDE Threat Register

| Threat ID | Category  | Component                                    | Disposition | Mitigation Plan                                                                                                             |
| --------- | --------- | -------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| T-47-02   | Tampering | the 10 cross-workspace consumer files        | mitigate    | D-04 four-globbed-grep recipe before any export deletion. `git diff phase-47-base..HEAD -- backend/src \| wc -l` returns 0. |
| T-47-03   | Tampering | every code-fix in this plan                  | mitigate    | `git diff phase-47-base..HEAD -- frontend/src \| grep -E '^\\+.*@ts-(ignore\|expect-error)' \| wc -l` returns 0.            |
| T-47-04   | Tampering | TYPE-04 ledger sites (IntakeForm, Icon.test) | mitigate    | Out-of-scope here; acceptance grep confirms byte-unchanged.                                                                 |

</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: components/{tasks,kanban,entity-links} cross-workspace cluster (10 files)</name>
  <files>frontend/src/components/tasks/**, frontend/src/components/kanban/**, frontend/src/components/entity-links/**, .planning/phases/47-type-check-zero/47-EXCEPTIONS.md</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-RESEARCH.md §4.2 (full enumeration of 10 cross-workspace import sites), §8 (cross-workspace type surface table), §11.2 (pitfall: deep relative imports hide consumers), §10.3.4 (process this cluster FIRST among components)
    - .planning/phases/47-type-check-zero/47-CONTEXT.md D-04 (cross-workspace verification before deletion)
    - .planning/phases/47-type-check-zero/47-01-frontend-type-fix-SUMMARY.md (Deviation 2: pnpm filter is `intake-frontend`)
    - All 10 import-site files enumerated in §4.2:
      - frontend/src/components/tasks/TaskEditDialog.tsx
      - frontend/src/components/tasks/TaskCard.tsx
      - frontend/src/components/tasks/ContributorsList.tsx
      - frontend/src/components/tasks/TaskDetail.tsx
      - frontend/src/components/kanban/KanbanBoard.tsx
      - frontend/src/components/entity-links/LinkTypeBadge.tsx
      - frontend/src/components/entity-links/LinkList.tsx
      - frontend/src/components/entity-links/EntityLinkManager.tsx
      - frontend/src/components/entity-links/EntitySearchDialog.tsx
      - frontend/src/components/entity-links/AISuggestionPanel.tsx
  </read_first>
  <action>
    1. **Capture baseline:**
       ```bash
       git rev-parse phase-47-base   # MUST return SHA
       pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/components/(tasks|kanban|entity-links)/' > /tmp/47-05-cluster-baseline.txt
       wc -l /tmp/47-05-cluster-baseline.txt
       ```

    2. **For each error in these 10 files**, classify and fix:
       - **TS6133 (unused local/import):** delete it. The "unused import from `../../../../backend/src/types/...`" case is benign — the deletion only removes the consumption side; it does NOT edit backend source.
       - **TS6196 (unused exported component-local type):** D-04 four-globbed-grep recipe → delete if all 4 return 0; ledger if any hit.
       - **TS2339 / TS2322 / TS7006 / TS18046 / TS2554 (real type errors):** real fix per the message. Common patterns in this cluster:
         * "Property X does not exist on type `Database['public']['Tables']['Y']['Row']`" → narrow via the row type; do NOT widen with `as any`.
         * "Type `T | undefined` not assignable to `T`" → guard with `if (!value) return null` or non-null assertion only when invariant is enforced upstream.
         * Property renamed on backend type → update consumption side to use the new name (not edit backend type).

    3. **Forbidden — cross-workspace fence:**
       Editing `backend/src/types/{database,intake-entity-links,ai-suggestions}.types.ts` to change the shape consumed here. If the backend type is genuinely wrong, append a row to `47-EXCEPTIONS.md` under `## Deferred deletions (cross-surface consumers)` with section title `Deferred to 47-02 — backend type reshape`. Skip the affected error in the frontend file (so it remains in baseline) and let 47-02 fix the backend, then 47-11 will catch any residual.

    4. **Forbidden:** introducing `@ts-ignore`, `@ts-expect-error`, or bare `as any`. Use `as unknown as <RealType>` with comment if cast genuinely required.

    5. **Process order:** Start with the file with the highest error count, work down. Re-run histogram every 3-5 files:
       ```bash
       pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/components/(tasks|kanban|entity-links)/' | wc -l
       ```
       Confirm monotonic decrease.

    6. **Single commit at task end** (pre-commit hook runs `turbo run build` ~2-3min). Commit message: `fix(47-05): components/{tasks,kanban,entity-links} cross-workspace cluster — N→0 errors`.

  </action>
  <verify>
    <automated>
      pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/components/(tasks|kanban|entity-links)/' | wc -l   # returns 0 (or only flagged-deferred lines remain, count matches ledger)
      git diff phase-47-base..HEAD -- backend/src | wc -l   # returns 0
      git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l   # returns 0
      git diff phase-47-base..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'   # returns 0
      git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l   # returns 0 (out of scope)
      git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l   # returns 0 (out of scope)
      head -1 frontend/src/types/database.types.ts | grep -c "@ts-nocheck"   # returns 1 (preserved)
      head -1 frontend/src/routeTree.gen.ts | grep -c "@ts-nocheck"   # returns 1 (preserved)
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter intake-frontend type-check 2>&1 | grep -E '^src/components/(tasks|kanban|entity-links)/' | wc -l` returns 0 (or any residual is matched 1:1 by 47-EXCEPTIONS.md "Deferred to 47-02" rows).
    - `git diff phase-47-base..HEAD -- backend/src | wc -l` returns 0 (cross-workspace fence respected).
    - `git diff phase-47-base..HEAD -- frontend/src | grep -E '^\+.*@ts-(ignore|expect-error)' | wc -l` returns 0.
    - `git diff phase-47-base..HEAD -- frontend/src | grep -cE '^\+.*\bas any\b'` returns 0.
    - `git diff phase-47-base..HEAD -- frontend/src/components/intake-form/IntakeForm.tsx | wc -l` returns 0.
    - `git diff phase-47-base..HEAD -- frontend/src/components/signature-visuals/__tests__/Icon.test.tsx | wc -l` returns 0.
    - The frontend top-25 file list (RESEARCH §7.1) no longer contains files from `tasks/`, `kanban/`, `entity-links/` (after the histogram is re-run).
    - 47-EXCEPTIONS.md pre-existing 4 ledger rows (IntakeForm, Icon.test, frontend database.types, deferred backend database.types) are byte-unchanged.
  </acceptance_criteria>
  <done>
    Cross-workspace consumer cluster is type-clean; no edits to backend source; no new suppressions; pre-existing ledger rows untouched.
  </done>
</task>

</tasks>

<verification>
- Cross-workspace cluster error count = 0 (or 1:1 matched by ledger Deferred-to-47-02 rows).
- `git diff phase-47-base..HEAD -- backend/src` returns empty.
- No new suppressions or bare `as any`.
</verification>

<success_criteria>

- TYPE-01 (slice): cross-workspace cluster cleared. ✅
- TYPE-04: zero net-new suppressions; deferred-to-47-02 entries recorded if any. ✅
- D-04 cross-workspace fence: zero edits to `backend/src`. ✅
- D-11: zero edits to tsconfig. ✅
  </success_criteria>

<output>
After completion, create `.planning/phases/47-type-check-zero/47-05-frontend-components-crossworkspace-SUMMARY.md` covering: pre/post error count for the cluster, list of fixes per file, deferred-to-47-02 entries (if any), and cross-workspace fence verification.
</output>
