---
phase: 48
plan: 02
type: execute
wave: 2
depends_on: [48-01]
files_modified:
  - frontend/src/components/ai/ChatMessage.tsx
  - frontend/src/components/dossier/wizard/__tests__/CreateWizardShell.test.tsx
  - frontend/src/components/dossier/wizard/__tests__/SharedBasicInfoStep.test.tsx
  - frontend/src/components/dossier/wizard/hooks/__tests__/useCreateDossierWizard.test.ts
  - frontend/src/components/dossier/wizard/hooks/__tests__/useDraftMigration.test.ts
  - frontend/src/components/signature-visuals/__tests__/GlobeLoader.reducedMotion.test.tsx
  - frontend/src/components/signature-visuals/__tests__/GlobeLoader.rotation.test.tsx
  - frontend/src/components/signature-visuals/__tests__/GlobeLoader.test.tsx
  - frontend/src/components/dossier/__tests__/DossierShell.test.tsx
  - frontend/src/pages/dossiers/__tests__/CreateDossierHub.test.tsx
  - frontend/src/components/signature-visuals/GlobeLoader.tsx
  - frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx
  - frontend/src/domains/work-items/hooks/useWorkItemDossierLinks.ts
  - frontend/src/components/FirstRun/FirstRunModal.tsx
  - backend/src/services/event.service.ts
  - backend/src/services/signature.service.ts
autonomous: true
requirements: [LINT-06, LINT-07]
must_haves:
  truths:
    - 'D-10: Every warning resolution in this plan is a call-site fix; no rule is downgraded without an inline rationale recorded in `eslint.config.mjs`'
    - 'D-12: Top-signal rules fixed at the call site — no `text-left`, `text-right`, `ml-*`, `mr-*`, `pl-*`, `pr-*`, `rounded-bl-*`, `rounded-br-*`, `rounded-tl-*`, `rounded-tr-*` literals in modified test fixtures or `ChatMessage.tsx`'
    - 'D-13: Backend three errors fixed at source — `event.service.ts:48` declares `UpdateEventDto` as a type alias (not empty interface); `signature.service.ts:353` uses Winston (`logInfo` or `logger.info`) instead of `console.log`; `contact-directory.types.ts` ignore handled in 48-01'
    - 'D-17: Zero net-new `eslint-disable` directives introduced — verified by 48-03 diff scan against phase-48-base'
    - '`pnpm --filter intake-frontend lint` exits 0 on a clean clone'
    - '`pnpm --filter intake-backend lint` exits 0 on a clean clone'
    - 'Phase 47 type-check zero-state is preserved across both workspaces (no regressions)'
  artifacts:
    - path: 'frontend/src/components/ai/ChatMessage.tsx'
      provides: 'RTL-safe logical border-radius classes (rounded-es-* / rounded-ee-*) replacing the four physical rounded-bl-* / rounded-br-* literals at lines 84–86'
      pattern: 'rounded-(es|ee)-(md|2xl)'
    - path: 'backend/src/services/event.service.ts'
      provides: '`UpdateEventDto` as `export type` alias (not empty interface)'
      pattern: 'export type UpdateEventDto = Partial<CreateEventDto>'
    - path: 'backend/src/services/signature.service.ts'
      provides: 'Winston logger call replacing the raw `console.log` at line 353; logger import added at top of file'
      pattern: '(logInfo|logger\\.info)\\([^)]*Notifying'
  key_links:
    - from: 'Frontend test fixtures'
      to: 'CLAUDE.md §"RTL-Safe Tailwind Classes" logical-property table'
      via: 'mechanical conversion ml→ms, mr→me, pl→ps, pr→pe, text-left→text-start, text-right→text-end'
      pattern: '(ms-|me-|ps-|pe-|text-start|text-end)'
    - from: 'backend/src/services/signature.service.ts logger call'
      to: 'backend/src/utils/logger.ts (Winston instance + logInfo/logError helpers)'
      via: '`import { logInfo } from "../utils/logger"` or `import { logger } from "../utils/logger"`'
      pattern: "from ['\"]\\.\\./utils/logger['\"]"
phase_decisions_locked:
  D-10_fix_at_call_site: 'Default warning resolution is call-site fix, not rule downgrade. Rule downgrades require inline rationale in eslint.config.mjs and are only acceptable per LINT-06 (structural noise + recorded rationale). 48-02 makes call-site fixes only; any downgrade would require returning to 48-01 scope.'
  D-12_logical_properties_mandate: 'CLAUDE.md §"Arabic RTL Support Guidelines (MANDATORY)" requires logical properties (ms-/me-/ps-/pe-/text-start/text-end/rounded-s-/rounded-e-). Fixes here are CLAUDE.md compliance, not just lint quieting.'
  D-13_backend_three_at_source: 'Backend errors fixed at source. event.service.ts:48 → type alias. signature.service.ts:353 → Winston logger. (contact-directory.types.ts:1 was cleared in 48-01 via ignores addition.)'
  D-17_no_net_new_disables: 'Zero net-new `eslint-disable` / `eslint-disable-next-line` / `eslint-disable-line` introduced. Deletions of stale directives ARE allowed (and required for the 9 unused-eslint-disable warnings). The 48-03 D-17 audit will fail if this plan introduces any +eslint-disable diff line.'
  Phase47_D-03_deletion_default: 'For unused imports/variables, deletion-as-default (not _-prefix). Phase 47 D-03 carries forward.'
  vi_importActual_canonical_shape: 'Replace `require()` in vi.mock factories using `vi.importActual` per the verbatim Sparkline.test.tsx:11–21 analog (RESEARCH §7.2 + PATTERNS Shape B); use static top-of-file import (Shape A) when no mock factory exists.'
---

<objective>
Drive `pnpm --filter intake-frontend lint` and `pnpm --filter intake-backend lint` to exit 0 by fixing every remaining violation at the call site. After 48-01 consolidated configs (deleting the shadow file, adding `**/__tests__/**` to the check-file carve-outs, and ignoring `contact-directory.types.ts`), the residual surface is ~30 frontend call-site edits and 2 backend edits — all itemized below with file paths, line numbers, donor analogs from the live codebase, and exact replacement shapes.

Categories:

1. **Frontend** (~30 edits): 12 `require()` → `vi.importActual` in test files; 8 Tailwind physical class literals → logical equivalents in test fixtures; 4 `rounded-bl-* / rounded-br-*` in `ChatMessage.tsx:84-86` → `rounded-es-* / rounded-ee-*`; 9 stale `eslint-disable` directives deleted; 1 unused import deleted.
2. **Backend** (2 edits): `event.service.ts:48` empty interface → type alias; `signature.service.ts:353` `console.log` → Winston `logInfo`.

Purpose: closes LINT-06 (frontend) and LINT-07 (backend) by satisfying the success criterion that both workspaces exit 0 — fix-at-call-site per D-10, no rule downgrades, no opportunistic refactors per Karpathy §3.

Output: both workspace `lint` commands exit 0; type-check unaffected (Phase 47 zero-state preserved); zero net-new eslint-disable directives; the call-site set is exactly the files listed in `files_modified`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/48-lint-config-alignment/48-CONTEXT.md
@.planning/phases/48-lint-config-alignment/48-RESEARCH.md
@.planning/phases/48-lint-config-alignment/48-PATTERNS.md
@.planning/phases/48-lint-config-alignment/48-VALIDATION.md
@.planning/phases/48-lint-config-alignment/48-01-SUMMARY.md
@./CLAUDE.md
@frontend/src/components/ai/ChatMessage.tsx
@frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx
@backend/src/utils/logger.ts
@backend/src/services/event.service.ts
@backend/src/services/signature.service.ts

<interfaces>
<!-- Donor analogs already verified in the codebase (RESEARCH §7 + PATTERNS):

     vi.importActual canonical shape (Sparkline.test.tsx:11–21 — already passing lint):
       vi.mock('@/design-system/hooks', async (): Promise<typeof import('@/design-system/hooks')> => {
         const actual =
           await vi.importActual<typeof import('@/design-system/hooks')>('@/design-system/hooks')
         return { ...actual, useLocale: (): { ... } => ({ ... }) }
       })

     CLAUDE.md Arabic RTL Support — mechanical conversion table (verbatim from CLAUDE.md §"RTL-Safe Tailwind Classes"):
       ml-*  → ms-*       (margin start)
       mr-*  → me-*       (margin end)
       pl-*  → ps-*       (padding start)
       pr-*  → pe-*       (padding end)
       text-left  → text-start
       text-right → text-end
       rounded-l-* → rounded-s-*
       rounded-r-* → rounded-e-*

     Tailwind v4 logical border-radius for ChatMessage.tsx (RESEARCH §7.4):
       rounded-bl-* → rounded-es-*   (end-start; RTL-safe block-end inline-start corner)
       rounded-br-* → rounded-ee-*   (end-end;   RTL-safe block-end inline-end corner)
       rounded-tl-* → rounded-ss-*   (start-start; not used in ChatMessage but listed for completeness)
       rounded-tr-* → rounded-se-*   (start-end;   not used in ChatMessage)

     Winston logger usage in backend/src (verified callsites):
       backend/src/ai/embeddings-service.ts:69, 92, 98       → `logger.info(...)` direct
       backend/src/ai/mastra-config.ts:42, 53                → `logger.info(...)` direct
       backend/src/middleware/auth.ts:5                       → `import { logInfo, logError } from '../utils/logger'`
       backend/src/middleware/rate-limit.middleware.ts:5      → `import { logInfo } from '../utils/logger'`
     Both `logger` instance and `logInfo` helper are exported from `backend/src/utils/logger.ts` (line ~85 defines logInfo helper). Either shape is valid.

     event.service.ts:48 BEFORE (verbatim Read):
       export interface UpdateEventDto extends Partial<CreateEventDto> {}
     event.service.ts:48 AFTER:
       export type UpdateEventDto = Partial<CreateEventDto>

     signature.service.ts:353 BEFORE (verbatim Read):
       console.log(`Notifying ${contact.email} about signature request`);
     signature.service.ts:353 AFTER (PATTERNS chose Shape B `logInfo` helper):
       logInfo(`Notifying ${contact.email} about signature request`)
       (Add `import { logInfo } from '../utils/logger'` at the top of the file if not already present. Preserve the existing semicolon style mid-file — verify against neighboring lines.)

     Per-file `require()` violation inventory (RESEARCH §3 + PATTERNS §"Test files with require() calls"):
       components/dossier/wizard/__tests__/CreateWizardShell.test.tsx               lines 5, 15   Shape B (has vi.mock factory)
       components/dossier/wizard/__tests__/SharedBasicInfoStep.test.tsx             line 5        Shape B
       components/dossier/wizard/hooks/__tests__/useCreateDossierWizard.test.ts     line 5        Shape B
       components/dossier/wizard/hooks/__tests__/useDraftMigration.test.ts          lines 9, 24, 37, 52, 67    Shape A (no mock factory — static SUT import)
       components/signature-visuals/__tests__/GlobeLoader.reducedMotion.test.tsx    line 19       Shape TBD — executor verifies during edit
       components/signature-visuals/__tests__/GlobeLoader.rotation.test.tsx         line 20       Shape TBD
       components/signature-visuals/__tests__/GlobeLoader.test.tsx                  line 13       Shape TBD

     Test fixture physical-class violations (RESEARCH §3 detail):
       components/dossier/__tests__/DossierShell.test.tsx:10       — uses ml-, mr-, pl-, pr-
       pages/dossiers/__tests__/CreateDossierHub.test.tsx:67       — uses ml-, mr-, text-left, text-right

     Stale eslint-disable directives (9 warnings across 3 files — DELETE the comment lines):
       components/activity-feed/__tests__/ActivityList.test.tsx:51 — suppressing @typescript-eslint/no-non-null-assertion
       components/signature-visuals/GlobeLoader.tsx:69, 89, 97, 108, 110, 123, 125 — 7× suppressing @typescript-eslint/no-explicit-any
       domains/work-items/hooks/useWorkItemDossierLinks.ts:66 — suppressing @typescript-eslint/no-explicit-any

     Unused import:
       components/FirstRun/FirstRunModal.tsx — one unused import (line TBD; executor runs `pnpm --filter intake-frontend lint -- frontend/src/components/FirstRun/FirstRunModal.tsx` to locate it)

     ChatMessage.tsx fix site (verbatim lines 84–86 per PATTERNS):
       BEFORE: isUser ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md',
       BEFORE: isRTL && isUser && 'rounded-br-2xl rounded-bl-md',
       BEFORE: isRTL && !isUser && 'rounded-bl-2xl rounded-br-md',
       AFTER:  isUser ? 'bg-primary text-primary-foreground rounded-ee-md' : 'bg-muted rounded-es-md',
       AFTER:  isRTL && isUser && 'rounded-ee-2xl rounded-es-md',
       AFTER:  isRTL && !isUser && 'rounded-es-2xl rounded-ee-md',
     Line 92's `ms-1` is already logical — leave byte-unchanged (in-file logical-property donor).

-->
</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                                     | Description                                                                                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Test fixture edits → test runtime behavior   | Mechanical class-string conversion in fixtures should not change behavior, but a typo (e.g., `ms-` typed as `m-s`) would silently pass lint while breaking the visual the test asserts on. |
| `require()` → `vi.importActual` migration    | Wrong shape (e.g., Shape A used where Shape B is required) can break the mock and cause the test to use the real implementation. Tests must still pass after migration.                    |
| Winston import added to signature.service.ts | Import resolution must succeed (`../utils/logger` resolves from `backend/src/services/` correctly) — type-check catches this, but runtime would also catch on next service invocation.     |

## STRIDE Threat Register

| Threat ID | Category  | Component                                                                                              | Disposition | Mitigation Plan                                                                                                                                                                                                                                                                              |
| --------- | --------- | ------------------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| T-48-05   | Tampering | ChatMessage.tsx logical-class conversion could subtly change rendered radius geometry                  | mitigate    | After conversion, run frontend dev server and visually verify ChatMessage renders user + non-user message bubbles correctly in BOTH ltr and rtl directions (CLAUDE.md mandates RTL parity). Existing line 92 `ms-1` is the donor; line 84–86 fixes follow the same logical-property posture. |
| T-48-06   | Tampering | `require()` → `vi.importActual` swap might break a test that depends on the synchronous require timing | mitigate    | After each test-file conversion, run `pnpm --filter intake-frontend test -- <test-path>` and confirm the suite still passes. If a test breaks, choose Shape A (top-of-file static import) over Shape B unless the test specifically asserts on the mock factory's return shape.              |
| T-48-07   | Tampering | D-17 net-new eslint-disable count > 0                                                                  | mitigate    | This plan ONLY deletes eslint-disable directives; never adds new ones. 48-03's D-17 audit `git diff phase-48-base..HEAD                                                                                                                                                                      | grep '^\\+.\*eslint-disable' \| wc -l` MUST return 0 — verified at end of this plan as a final gate. |

</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: Frontend test files — migrate `require()` calls to `vi.importActual` or static imports (12 errors / 7 files)</name>
  <files>
    frontend/src/components/dossier/wizard/__tests__/CreateWizardShell.test.tsx,
    frontend/src/components/dossier/wizard/__tests__/SharedBasicInfoStep.test.tsx,
    frontend/src/components/dossier/wizard/hooks/__tests__/useCreateDossierWizard.test.ts,
    frontend/src/components/dossier/wizard/hooks/__tests__/useDraftMigration.test.ts,
    frontend/src/components/signature-visuals/__tests__/GlobeLoader.reducedMotion.test.tsx,
    frontend/src/components/signature-visuals/__tests__/GlobeLoader.rotation.test.tsx,
    frontend/src/components/signature-visuals/__tests__/GlobeLoader.test.tsx
  </files>
  <read_first>
    - frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx lines 11–21 (canonical `vi.importActual` analog per PATTERNS §"Test files with require() calls" — already passing lint)
    - frontend/src/components/dossier/wizard/hooks/__tests__/useDraftMigration.test.ts entire file (5 violations at lines 9, 24, 37, 52, 67 — Shape A: no vi.mock factory; this is the planner-classified Shape A case)
    - frontend/src/components/dossier/wizard/__tests__/CreateWizardShell.test.tsx lines 1–25 (Shape B: vi.mock factory at lines 5 and 15)
    - .planning/phases/48-lint-config-alignment/48-RESEARCH.md §7.2 (rule-specific fix recipe with Shape A and Shape B)
    - .planning/phases/48-lint-config-alignment/48-PATTERNS.md §"Test files with require() calls"
    - For each of the 3 GlobeLoader test files: read the violation line ±10 lines of context to determine whether the `require()` is inside a `vi.mock(..., () => { ... })` factory (Shape B) or outside (Shape A).
  </read_first>
  <action>
    For each of the 7 test files, convert every flagged `require()` call to a lint-clean ESM-native form. Apply Shape A or Shape B per the inventory in `<interfaces>`. Do not introduce new `eslint-disable` directives — if Shape A or B does not resolve cleanly for a specific call site, escalate to the orchestrator rather than suppressing.

    **Shape A — top-of-file static import** (use when the `require()` simply pulls in the SUT, no mock factory present):
    ```
    BEFORE (inside test body):
      const { migrateLegacyDraft } = require('../useDraftMigration')

    AFTER (at top of file, alongside other imports):
      import { migrateLegacyDraft } from '../useDraftMigration'
    ```
    Apply Shape A to `useDraftMigration.test.ts` for all 5 lines (9, 24, 37, 52, 67). The 5 calls all import the same module — hoist a single top-of-file import once, then delete all 5 `require()` lines.

    **Shape B — `vi.importActual` inside `vi.mock` factory** (use when the call is inside a `vi.mock(specifier, factory)` factory function that needs to mix actual exports with mocked ones):
    ```
    BEFORE (inside vi.mock factory):
      vi.mock('./useDraftMigration', () => {
        const actual = require('./useDraftMigration')
        return { ...actual, useDraftMigration: vi.fn() }
      })

    AFTER:
      vi.mock('./useDraftMigration', async () => {
        const actual =
          await vi.importActual<typeof import('./useDraftMigration')>('./useDraftMigration')
        return { ...actual, useDraftMigration: vi.fn() }
      })
    ```
    Apply Shape B to:
    - `CreateWizardShell.test.tsx` lines 5, 15 (verified vi.mock factory present)
    - `SharedBasicInfoStep.test.tsx` line 5
    - `useCreateDossierWizard.test.ts` line 5

    **For the 3 GlobeLoader test files (`GlobeLoader.reducedMotion.test.tsx:19`, `GlobeLoader.rotation.test.tsx:20`, `GlobeLoader.test.tsx:13`):** read ±10 lines of context around the violation line to determine the shape (mock factory present → B; no factory → A). Pick the shape based on actual surrounding code; do NOT default-pick. If the surrounding code uses `vi.mock` and the `require()` is inside its factory, use Shape B. Otherwise use Shape A.

    After each file edit:
    1. Run vitest scoped to that file: `pnpm --filter intake-frontend test -- <relative-test-path> --run`. The test suite MUST still pass. If it fails, revert the file edit and try the other shape.
    2. Run lint scoped to that file: `pnpm exec eslint -c eslint.config.mjs <relative-test-path>`. The `@typescript-eslint/no-require-imports` errors for this file MUST be gone.

    Do NOT modify any other file in this task. Do NOT touch `signature-visuals/__tests__/Sparkline.test.tsx` (the donor analog — already passing).

    Commit message: `fix(48-02): migrate require() to vi.importActual in 7 frontend test files`.

  </action>
  <verify>
    <automated>
      pnpm exec eslint -c eslint.config.mjs \
        frontend/src/components/dossier/wizard/__tests__/CreateWizardShell.test.tsx \
        frontend/src/components/dossier/wizard/__tests__/SharedBasicInfoStep.test.tsx \
        frontend/src/components/dossier/wizard/hooks/__tests__/useCreateDossierWizard.test.ts \
        frontend/src/components/dossier/wizard/hooks/__tests__/useDraftMigration.test.ts \
        frontend/src/components/signature-visuals/__tests__/GlobeLoader.reducedMotion.test.tsx \
        frontend/src/components/signature-visuals/__tests__/GlobeLoader.rotation.test.tsx \
        frontend/src/components/signature-visuals/__tests__/GlobeLoader.test.tsx \
        --no-warn-ignored 2>&1 | grep -cE "no-require-imports"
      pnpm --filter intake-frontend test -- \
        frontend/src/components/dossier/wizard/hooks/__tests__/useDraftMigration.test.ts \
        --run 2>&1 | tail -5
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm exec eslint -c eslint.config.mjs <7 test files> --no-warn-ignored 2>&1 | grep -cE "no-require-imports"` returns 0 (zero require-imports errors remaining across the 7 files).
    - Vitest passes for each modified file (run individually: `pnpm --filter intake-frontend test -- <path> --run` exits 0).
    - `git diff phase-48-base..HEAD -- frontend/src/components/.../{Sparkline.test.tsx} | wc -l` returns 0 (donor analog file Sparkline.test.tsx is byte-unchanged — surgical change posture).
    - No new `eslint-disable` directives introduced (`git diff phase-48-base..HEAD -- <7 test files> | grep -cE '^\\+.*eslint-disable' | head -1` returns 0).
  </acceptance_criteria>
  <done>All 12 `@typescript-eslint/no-require-imports` errors cleared across the 7 named test files; vitest still green for each.</done>
</task>

<task type="auto">
  <name>Task 2: Frontend RTL fixes — convert physical Tailwind classes to logical in 2 test fixtures + ChatMessage.tsx (12 violations across 3 files)</name>
  <files>
    frontend/src/components/dossier/__tests__/DossierShell.test.tsx,
    frontend/src/pages/dossiers/__tests__/CreateDossierHub.test.tsx,
    frontend/src/components/ai/ChatMessage.tsx
  </files>
  <read_first>
    - frontend/src/components/dossier/__tests__/DossierShell.test.tsx line 10 ±5 lines (the test fixture using ml-, mr-, pl-, pr- literals)
    - frontend/src/pages/dossiers/__tests__/CreateDossierHub.test.tsx line 67 ±5 lines (the fixture using ml-, mr-, text-left, text-right)
    - frontend/src/components/ai/ChatMessage.tsx lines 80–95 (verbatim verbatim donor + violation block per PATTERNS §"frontend/src/components/ai/ChatMessage.tsx"; line 92 `ms-1` is the in-file logical-property donor)
    - CLAUDE.md §"RTL-Safe Tailwind Classes (REQUIRED)" — the mechanical conversion table (verbatim)
    - .planning/phases/48-lint-config-alignment/48-RESEARCH.md §7.3 (no-restricted-syntax recipe) and §7.4 (rtl-friendly/no-physical-properties recipe)
    - .planning/phases/48-lint-config-alignment/48-PATTERNS.md §"frontend/src/components/ai/ChatMessage.tsx" and §"Test files with physical Tailwind in fixture strings"
  </read_first>
  <action>
    Apply the mechanical conversion table from CLAUDE.md §"RTL-Safe Tailwind Classes" to every flagged class literal in the 3 files. The conversion is purely textual — every occurrence inside a string literal (or template literal) gets replaced.

    **DossierShell.test.tsx (line 10 region — 4 physical-class literals flagged by no-restricted-syntax):**
    Replace inside fixture/string literals:
    - `ml-` → `ms-`
    - `mr-` → `me-`
    - `pl-` → `ps-`
    - `pr-` → `pe-`
    Preserve every other character of the class name (e.g., `ml-4` → `ms-4`, `ml-auto` → `ms-auto`).

    **CreateDossierHub.test.tsx (line 67 region — 4 flagged literals):**
    Same conversions as above for `ml-`, `mr-`, plus:
    - `text-left` → `text-start`
    - `text-right` → `text-end`

    **ChatMessage.tsx (lines 84–86 — 4 rtl-friendly warnings):**
    Apply the Tailwind v4 logical border-radius conversion table from `<interfaces>` (RESEARCH §7.4):
    - `rounded-bl-*` → `rounded-es-*` (end-start)
    - `rounded-br-*` → `rounded-ee-*` (end-end)
    Exact transformation (PATTERNS verbatim):
    ```
    BEFORE (line 84): isUser ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md',
    BEFORE (line 85): isRTL && isUser && 'rounded-br-2xl rounded-bl-md',
    BEFORE (line 86): isRTL && !isUser && 'rounded-bl-2xl rounded-br-md',

    AFTER (line 84): isUser ? 'bg-primary text-primary-foreground rounded-ee-md' : 'bg-muted rounded-es-md',
    AFTER (line 85): isRTL && isUser && 'rounded-ee-2xl rounded-es-md',
    AFTER (line 86): isRTL && !isUser && 'rounded-es-2xl rounded-ee-md',
    ```
    Per the PATTERNS caveat: the `isRTL && ...` branches MAY become redundant once logical classes auto-flip, but the surgical-change posture (Karpathy §3) is to keep the conditional structure byte-equivalent and only swap the class names. Do NOT collapse the `isRTL && isUser && ...` and `isRTL && !isUser && ...` branches — that's a separate refactor outside the lint-zero scope.

    Do NOT touch line 92's existing `ms-1` (it's already logical; it's the in-file donor).

    Verify class names against the Tailwind config: run `pnpm --filter frontend build` after the conversion to confirm Tailwind compiles the new classes without warnings about unrecognized utilities. If `rounded-es-md` / `rounded-ee-md` are NOT recognized (Tailwind v4 minor-version variance), fall back to `rounded-s-` / `rounded-e-` (without the block-axis prefix) — but expect this to work because PATTERNS verified Tailwind v4 supports the `bs/be/ss/se/es/ee` shorthand directly.

    Run scoped lint after edits:
    ```
    pnpm exec eslint -c eslint.config.mjs \
      frontend/src/components/dossier/__tests__/DossierShell.test.tsx \
      frontend/src/pages/dossiers/__tests__/CreateDossierHub.test.tsx \
      frontend/src/components/ai/ChatMessage.tsx
    ```
    Expected: zero errors and zero warnings for these three files.

    Commit message: `fix(48-02): convert physical Tailwind classes to logical (RTL compliance) in 2 test fixtures + ChatMessage`.

  </action>
  <verify>
    <automated>
      pnpm exec eslint -c eslint.config.mjs \
        frontend/src/components/dossier/__tests__/DossierShell.test.tsx \
        frontend/src/pages/dossiers/__tests__/CreateDossierHub.test.tsx \
        frontend/src/components/ai/ChatMessage.tsx \
        --no-warn-ignored 2>&1 | grep -cE "no-restricted-syntax|rtl-friendly|physical-properties"
      grep -v '^[[:space:]]*#' frontend/src/components/ai/ChatMessage.tsx | grep -cE "rounded-(bl|br|tl|tr)-"
      pnpm --filter intake-frontend type-check 2>&1 | tail -3
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm exec eslint -c eslint.config.mjs <3 files> --no-warn-ignored 2>&1 | grep -cE "no-restricted-syntax|rtl-friendly|physical-properties"` returns 0.
    - `grep -v '^[[:space:]]*#' frontend/src/components/ai/ChatMessage.tsx | grep -cE "rounded-(bl|br|tl|tr)-"` returns 0 (zero physical border-radius classes remain in ChatMessage.tsx outside comments).
    - `grep -v '^[[:space:]]*#' frontend/src/components/dossier/__tests__/DossierShell.test.tsx | grep -cE "['\"\\` ](ml-|mr-|pl-|pr-)"` returns 0 (zero physical margin/padding literals).
    - `grep -v '^[[:space:]]*#' frontend/src/pages/dossiers/__tests__/CreateDossierHub.test.tsx | grep -cE "['\"\\` ](ml-|mr-|text-left|text-right)"` returns 0.
    - `pnpm --filter intake-frontend type-check` exits 0 (Phase 47 zero-state preserved; logical classes are still valid Tailwind utilities).
  </acceptance_criteria>
  <done>Three files use logical Tailwind classes exclusively; lint reports zero physical-property violations in this scope.</done>
</task>

<task type="auto">
  <name>Task 3: Delete 9 stale eslint-disable directives + 1 unused import (4 files)</name>
  <files>
    frontend/src/components/signature-visuals/GlobeLoader.tsx,
    frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx,
    frontend/src/domains/work-items/hooks/useWorkItemDossierLinks.ts,
    frontend/src/components/FirstRun/FirstRunModal.tsx
  </files>
  <read_first>
    - frontend/src/components/signature-visuals/GlobeLoader.tsx lines 60–130 (7 stale `eslint-disable-next-line @typescript-eslint/no-explicit-any` directives at lines 69, 89, 97, 108, 110, 123, 125 per RESEARCH §3 Detail)
    - frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx line 51 ±3 (the stale `eslint-disable @typescript-eslint/no-non-null-assertion` directive)
    - frontend/src/domains/work-items/hooks/useWorkItemDossierLinks.ts line 66 ±3 (stale `eslint-disable @typescript-eslint/no-explicit-any`)
    - frontend/src/components/FirstRun/FirstRunModal.tsx — run `pnpm exec eslint -c eslint.config.mjs frontend/src/components/FirstRun/FirstRunModal.tsx 2>&1 | grep -E "unused-import"` to locate the violation line
    - .planning/phases/48-lint-config-alignment/48-RESEARCH.md §7.5 (stale eslint-disable recipe — pure deletion) and §7.1 (unused-import recipe — pure deletion, no `_`-prefix per Phase 47 D-03)
    - .planning/phases/48-lint-config-alignment/48-CONTEXT.md D-17 (zero net-new eslint-disable — deletions reduce count, satisfy D-17 by construction)
  </read_first>
  <action>
    Delete each stale directive line and the unused import. No code-logic edits; pure deletion.

    **GlobeLoader.tsx — delete 7 lines** (each is a single-line `// eslint-disable-next-line @typescript-eslint/no-explicit-any` directive that's no longer needed because the rule it suppresses is disabled per D-09):
    Lines 69, 89, 97, 108, 110, 123, 125 (verify exact line numbers via `grep -n "eslint-disable" frontend/src/components/signature-visuals/GlobeLoader.tsx` first because earlier deletions shift later line numbers — delete from bottom to top to preserve line offsets, OR re-grep after each deletion).

    **ActivityList.test.tsx — delete 1 line** at line 51 (the `eslint-disable @typescript-eslint/no-non-null-assertion` directive).

    **useWorkItemDossierLinks.ts — delete 1 line** at line 66.

    **FirstRunModal.tsx — delete 1 unused import** (locate via the lint scope run in `<read_first>`; the violation is `unused-imports/no-unused-imports` per RESEARCH §3). Delete the entire import line; do NOT rename to `_`-prefix.

    For each file:
    1. Run scoped lint after deletion: `pnpm exec eslint -c eslint.config.mjs <file>`. Expected: zero warnings/errors for this file (or only warnings unrelated to the deleted directive).
    2. If the deletion of an `eslint-disable-next-line` directive exposes a NEW error (because the underlying rule IS active and the suppression was real, not stale), STOP and escalate to the orchestrator. The RESEARCH §3 audit verified these 9 directives are stale (suppress disabled rules), but a per-file confirmation is the safety net.

    Commit message: `chore(48-02): delete 9 stale eslint-disable directives + 1 unused import (D-17 compliant — net-new = 0)`.

  </action>
  <verify>
    <automated>
      grep -cE "eslint-disable.*no-explicit-any" frontend/src/components/signature-visuals/GlobeLoader.tsx
      grep -cE "eslint-disable.*no-non-null-assertion" frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx
      grep -cE "eslint-disable.*no-explicit-any" frontend/src/domains/work-items/hooks/useWorkItemDossierLinks.ts
      pnpm exec eslint -c eslint.config.mjs \
        frontend/src/components/signature-visuals/GlobeLoader.tsx \
        frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx \
        frontend/src/domains/work-items/hooks/useWorkItemDossierLinks.ts \
        frontend/src/components/FirstRun/FirstRunModal.tsx \
        --no-warn-ignored 2>&1 | grep -cE "Unused eslint-disable|unused-import"
      pnpm --filter intake-frontend type-check 2>&1 | tail -3
    </automated>
  </verify>
  <acceptance_criteria>
    - `grep -cE "eslint-disable.*no-explicit-any" frontend/src/components/signature-visuals/GlobeLoader.tsx` returns 0 (all 7 stale directives gone).
    - `grep -cE "eslint-disable.*no-non-null-assertion" frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx` returns 0.
    - `grep -cE "eslint-disable.*no-explicit-any" frontend/src/domains/work-items/hooks/useWorkItemDossierLinks.ts` returns 0.
    - `pnpm exec eslint -c eslint.config.mjs <4 files> --no-warn-ignored 2>&1 | grep -cE "Unused eslint-disable|unused-import"` returns 0.
    - `pnpm --filter intake-frontend type-check` exits 0.
    - `git diff phase-48-base..HEAD -- frontend/src/components/signature-visuals/GlobeLoader.tsx frontend/src/components/activity-feed/__tests__/ActivityList.test.tsx frontend/src/domains/work-items/hooks/useWorkItemDossierLinks.ts | grep -cE '^\\+.*eslint-disable'` returns 0 (no new directives added — D-17 satisfied within this task's scope).
  </acceptance_criteria>
  <done>9 stale eslint-disable directives deleted + 1 unused import deleted; no new directives introduced.</done>
</task>

<task type="auto">
  <name>Task 4: Backend fixes — empty interface → type alias; console.log → Winston (2 files, 2 errors)</name>
  <files>
    backend/src/services/event.service.ts,
    backend/src/services/signature.service.ts
  </files>
  <read_first>
    - backend/src/services/event.service.ts lines 42–52 (verbatim line 48 BEFORE: `export interface UpdateEventDto extends Partial<CreateEventDto> {}`)
    - backend/src/services/signature.service.ts lines 1–10 (existing imports — check whether `logInfo` or `logger` is already imported) AND lines 348–360 (verbatim line 353 BEFORE: `console.log(\`Notifying ${contact.email} about signature request\`);`)
    - backend/src/utils/logger.ts (verify `export const logInfo = ...` and `export const logger = ...` are both present; PATTERNS §"backend/src/services/signature.service.ts" verified line ~85 has the logInfo helper)
    - backend/src/ai/embeddings-service.ts:69 (canonical `logger.info(...)` direct call analog — Shape A donor)
    - backend/src/middleware/auth.ts:5 (canonical `import { logInfo, logError } from '../utils/logger'` analog — Shape B donor, chosen by PATTERNS)
    - .planning/phases/48-lint-config-alignment/48-RESEARCH.md §7.6 (no-empty-object-type recipe) and §7.7 (no-console / Winston recipe)
    - .planning/phases/48-lint-config-alignment/48-PATTERNS.md §"backend/src/services/event.service.ts:48" and §"backend/src/services/signature.service.ts:353"
    - .planning/phases/48-lint-config-alignment/48-CONTEXT.md D-13
    - CLAUDE.md §"Logging" (Winston is backend canonical logger)
  </read_first>
  <action>
    Two single-line edits + one import addition. Apply per D-13 fix-at-source.

    **Edit A — `backend/src/services/event.service.ts:48`:**
    Replace the empty-interface declaration with a type alias:
    ```
    BEFORE (line 48):
      export interface UpdateEventDto extends Partial<CreateEventDto> {}

    AFTER:
      export type UpdateEventDto = Partial<CreateEventDto>;
    ```
    Preserve any leading JSDoc comment block (read ±3 lines around line 48; if there's a `/** ... */` block on line 47, keep it byte-unchanged above the new type alias). Preserve the trailing semicolon to match the file's existing style.

    After the edit, run `pnpm --filter intake-backend type-check; echo "exit=$?"` — MUST print `exit=0` (Phase 47 zero-state). The type alias is structurally equivalent to the empty-extends-interface, so all consumers (if any) keep compiling.

    **Edit B — `backend/src/services/signature.service.ts`:**
    Apply Shape B (`logInfo` helper) per PATTERNS §"backend/src/services/signature.service.ts:353".

    Step 1: Audit existing imports at the top of the file. Run `head -20 backend/src/services/signature.service.ts | grep -E "from ['\"]\\.\\./utils/logger['\"]"`.
    - If `logInfo` is already imported, skip step 2.
    - If a different logger function is imported (e.g., `logError`, `logger`), extend the import to add `logInfo` alongside the existing ones — DO NOT add a new import line; keep one consolidated import.
    - If no logger import exists, add a new line: `import { logInfo } from '../utils/logger'` at the top of the imports section, after any standard-library imports and before relative imports of project modules.

    Step 2: Replace line 353:
    ```
    BEFORE: console.log(`Notifying ${contact.email} about signature request`);
    AFTER:  logInfo(`Notifying ${contact.email} about signature request`)
    ```
    Preserve the trailing semicolon if other lines in the file use semicolons; drop it if the file is no-semicolons (read 5 lines around line 353 to verify the local style).

    After the edit, run:
    - `pnpm --filter intake-backend type-check; echo "exit=$?"` — MUST print `exit=0`.
    - `pnpm exec eslint -c eslint.config.mjs backend/src/services/signature.service.ts 2>&1` — MUST emit zero errors.

    Do NOT touch any other line in either file. No opportunistic refactors (Karpathy §3).

    Commit message: `fix(48-02): empty-interface → type alias (event.service); console.log → Winston (signature.service)`.

  </action>
  <verify>
    <automated>
      grep -cE "export interface UpdateEventDto extends Partial<CreateEventDto>" backend/src/services/event.service.ts
      grep -cE "export type UpdateEventDto = Partial<CreateEventDto>" backend/src/services/event.service.ts
      grep -cE "console\\.log\\(\`Notifying" backend/src/services/signature.service.ts
      grep -cE "logInfo\\(\`Notifying" backend/src/services/signature.service.ts
      grep -cE "from ['\"]\\.\\./utils/logger['\"]" backend/src/services/signature.service.ts
      pnpm --filter intake-backend type-check 2>&1 | tail -3
      pnpm exec eslint -c eslint.config.mjs backend/src/services/event.service.ts backend/src/services/signature.service.ts --no-warn-ignored 2>&1 | tail -10
    </automated>
  </verify>
  <acceptance_criteria>
    - `grep -cE "export interface UpdateEventDto extends Partial<CreateEventDto>" backend/src/services/event.service.ts` returns 0 (empty interface gone).
    - `grep -cE "export type UpdateEventDto = Partial<CreateEventDto>" backend/src/services/event.service.ts` returns 1 (type alias present).
    - `grep -cE "console\\.log\\(\`Notifying" backend/src/services/signature.service.ts` returns 0 (console.log gone).
    - `grep -cE "logInfo\\(\`Notifying" backend/src/services/signature.service.ts` returns 1 (Winston call present).
    - `grep -cE "from ['\"]\\.\\./utils/logger['\"]" backend/src/services/signature.service.ts` returns 1 (logger import present; consolidated if pre-existing).
    - `pnpm --filter intake-backend type-check` exits 0.
    - `pnpm exec eslint -c eslint.config.mjs backend/src/services/event.service.ts backend/src/services/signature.service.ts --no-warn-ignored` exits 0 (both files lint clean).
  </acceptance_criteria>
  <done>Both backend errors resolved at source; type-check still at zero.</done>
</task>

<task type="auto">
  <name>Task 5: Workspace-level lint-zero confirmation — both workspaces exit 0 + type-check unchanged + no net-new disables</name>
  <files>(no files; verification only — output captured to ephemeral /tmp paths)</files>
  <read_first>
    - .planning/phases/48-lint-config-alignment/48-RESEARCH.md §19 (Validation Architecture — per-workspace + full-suite commands)
    - .planning/phases/48-lint-config-alignment/48-VALIDATION.md per-task verification map
    - .planning/phases/48-lint-config-alignment/48-CONTEXT.md D-17 (zero net-new eslint-disable)
    - phase-48-base git tag created in 48-01 Task 1
  </read_first>
  <action>
    Final cross-workspace gate before 48-03 takes over. Run all four assertions; any failure routes back to a gap-closure task within 48-02.

    1. **Frontend workspace lint** (LINT-06):
       ```
       pnpm --filter intake-frontend lint > /tmp/48-02-frontend-lint-final.txt 2>&1
       echo "exit=$?" >> /tmp/48-02-frontend-lint-final.txt
       cat /tmp/48-02-frontend-lint-final.txt | tail -20
       ```
       Final line MUST be `exit=0`. If non-zero, parse the remaining problems and address them with surgical call-site fixes (no rule downgrades — D-10 + LINT-06).

    2. **Backend workspace lint** (LINT-07):
       ```
       pnpm --filter intake-backend lint > /tmp/48-02-backend-lint-final.txt 2>&1
       echo "exit=$?" >> /tmp/48-02-backend-lint-final.txt
       cat /tmp/48-02-backend-lint-final.txt | tail -20
       ```
       Final line MUST be `exit=0`.

    3. **Type-check regression check** (Phase 47 zero-state preservation):
       ```
       pnpm --filter intake-frontend type-check 2>&1 | tail -3
       echo "frontend type-check exit=$?"
       pnpm --filter intake-backend type-check 2>&1 | tail -3
       echo "backend type-check exit=$?"
       ```
       Both MUST print `exit=0`.

    4. **D-17 preview — net-new eslint-disable count from phase-48-base** (the canonical D-17 audit runs in 48-03 Task 1; this is a preview to catch issues before they bottleneck 48-03):
       ```
       git rev-parse phase-48-base  # MUST succeed — fails fast if 48-01 Task 1 didn't create the tag
       git diff phase-48-base..HEAD -- 'frontend/src' 'backend/src' \
         | grep -E '^\+.*eslint-disable' \
         | grep -vE '^\+\+\+' \
         > /tmp/48-02-eslint-disable-preview.txt
       wc -l < /tmp/48-02-eslint-disable-preview.txt
       ```
       MUST return 0. If non-zero, the offending file/line is in `/tmp/48-02-eslint-disable-preview.txt`; locate and remove the directive (replace with a real call-site fix), then re-run.

    5. **Full-suite turbo run** (the actual CI command):
       ```
       pnpm run lint 2>&1 | tail -10
       echo "turbo lint exit=$?"
       ```
       MUST print `exit=0`.

    Do not commit anything in this task. The capture files in `/tmp/` are inputs to 48-03's audit and the SUMMARY for 48-02.

  </action>
  <verify>
    <automated>
      pnpm --filter intake-frontend lint
      pnpm --filter intake-backend lint
      pnpm --filter intake-frontend type-check
      pnpm --filter intake-backend type-check
      pnpm run lint
      git rev-parse phase-48-base
      git diff phase-48-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\+.*eslint-disable' | grep -vE '^\+\+\+' | wc -l
    </automated>
  </verify>
  <acceptance_criteria>
    - `pnpm --filter intake-frontend lint; echo $?` returns 0 (LINT-06 success criterion satisfied).
    - `pnpm --filter intake-backend lint; echo $?` returns 0 (LINT-07 success criterion satisfied).
    - `pnpm --filter intake-frontend type-check; echo $?` returns 0 (Phase 47 zero-state preserved).
    - `pnpm --filter intake-backend type-check; echo $?` returns 0.
    - `pnpm run lint; echo $?` returns 0 (full turbo fan-out green).
    - `git rev-parse phase-48-base` returns a SHA (anchor exists for 48-03 audit).
    - `git diff phase-48-base..HEAD -- 'frontend/src' 'backend/src' | grep -E '^\\+.*eslint-disable' | grep -vE '^\\+\\+\\+' | wc -l` returns 0 (D-17 preview clean — zero net-new directives across the phase so far).
  </acceptance_criteria>
  <done>Both workspace lint commands exit 0; type-check unchanged; zero net-new eslint-disable directives in the phase-48-base..HEAD diff window; 48-03 is unblocked to run the CI gate flip and smoke PRs.</done>
</task>

</tasks>

<verification>
After all tasks complete:
- `pnpm --filter intake-frontend lint` exits 0.
- `pnpm --filter intake-backend lint` exits 0.
- `pnpm run lint` (full turbo) exits 0.
- `pnpm --filter intake-frontend type-check` exits 0; `pnpm --filter intake-backend type-check` exits 0 (no regression from 48-01 + 48-02).
- `git diff phase-48-base..HEAD -- frontend/src backend/src | grep '^+.*eslint-disable' | grep -v '^+++' | wc -l` returns 0.
- The 16 files in `files_modified` are the ONLY source-code files touched by 48-02 (verify with `git diff --name-only phase-48-base..HEAD | grep -vE '\\.planning/|eslint\\.config\\.(mjs|js)|package\\.json|turbo\\.json|frontend/src/components/ui/(3d-card|bento-grid|floating-navbar)\\.tsx'`).
</verification>

<success_criteria>

- LINT-06 (frontend): `pnpm --filter intake-frontend lint` exits 0 on a clean clone of the working branch. Warnings are fixed at the call site, not downgraded.
- LINT-07 (backend): `pnpm --filter intake-backend lint` exits 0 on a clean clone (3 errors + 0 warnings → 0).
- D-17 carried-forward suppression policy: zero net-new `eslint-disable` directives introduced (verified by 48-03 Task 1 diff scan against `phase-48-base`).
- Phase 47 type-check zero-state preserved across both workspaces.
- Karpathy §3 surgical-changes: every modified file traces directly to a violation listed in RESEARCH §3 or §4; no opportunistic refactors.
  </success_criteria>

<output>
After completion, create `.planning/phases/48-lint-config-alignment/48-02-SUMMARY.md` recording:
- Final per-workspace lint exit codes (both 0).
- Final per-workspace type-check exit codes (both 0).
- The full list of files modified with line-count deltas (`git diff --stat phase-48-base..HEAD`).
- The net-new eslint-disable count (must be 0).
- Any deviations: if a `require()` site needed Shape A vs Shape B different from PATTERNS' classification, note which file + which shape was used + why.
- Confirmation that 48-03 is unblocked to flip the branch-protection gate.
</output>
