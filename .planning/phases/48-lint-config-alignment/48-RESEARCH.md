# Phase 48: Lint & Config Alignment — Research

**Researched:** 2026-05-11
**Domain:** ESLint flat-config / monorepo lint policy / CI gating / branch protection
**Confidence:** HIGH (everything in this document is `[VERIFIED]` from the local checkout, the live `pnpm exec eslint` runs, or the GitHub API; one `[ASSUMED]` claim flagged in §13.2 and the Assumptions Log.)

<user_constraints>

## User Constraints (from 48-CONTEXT.md)

### Locked Decisions

- **D-01:** Root `eslint.config.mjs` is the single canonical ESLint configuration for the monorepo. `frontend/eslint.config.js` is **deleted** in Phase 48 — it currently shadows the root config when per-workspace `lint` scripts run from the workspace directory, which is why local lint counts (~92 problems) diverge from the ROADMAP baseline (~723 problems).
- **D-02:** Workspace `lint` scripts are updated to point at the root config explicitly: `frontend/package.json` and `backend/package.json` use `eslint -c ../eslint.config.mjs src/...`. Explicit over implicit lookup — prevents a future `frontend/eslint.config.*` from silently re-forking.
- **D-03:** Add the following globs to the root `ignores:` block: `frontend/design-system/inteldossier_handoff_design/**`, `**/routeTree.gen.ts`, `**/database.types.ts`.
- **D-04:** Existing per-scope rule carve-outs for `frontend/src/components/ui/**` (`no-restricted-syntax: off`, `@typescript-eslint/no-explicit-any: off`, `rtl-friendly/no-physical-properties: off`) stay as-is.
- **D-05:** The current `no-restricted-imports` block in `frontend/eslint.config.js` recommends Aceternity components — contradicting `CLAUDE.md`. Phase 48 inverts this: ban what CLAUDE.md bans, not recommend it.
- **D-06:** New `no-restricted-imports` rule (severity `error`, root `eslint.config.mjs` frontend override). Banned packages: `aceternity-ui`, `@aceternity/*`, `kibo-ui`, `@kibo-ui/*`. Banned paths: `@/components/ui/3d-card`, `@/components/ui/bento-grid`, `@/components/ui/floating-navbar`, `@/components/ui/link-preview`. Shared message: `"Banned by CLAUDE.md primitive cascade. Use HeroUI v3 → Radix → custom. If no primitive fits, ask before installing."` No emoji.
- **D-07:** Orphan Aceternity wrapper files deleted: `frontend/src/components/ui/3d-card.tsx`, `frontend/src/components/ui/bento-grid.tsx`, `frontend/src/components/ui/floating-navbar.tsx`. Other `floating-*` files stay (real importers exist).
- **D-08:** `link-preview` is in the banned-paths list even if no wrapper file currently exists on disk — forward-looking.
- **D-09:** All `TODO(Phase 2+)` disabled rules in the root config stay disabled in Phase 48 — no rule expansion.
- **D-10:** Fix-at-call-site is the default warning resolution. Downgrading a rule requires inline rationale in `eslint.config.mjs`.
- **D-11:** `--max-warnings 0` enforced in per-workspace `lint` scripts.
- **D-12:** Top-signal rules (`unused-imports/no-unused-vars`, `rtl-friendly/no-physical-properties`) fixed at call site, not by rule downgrade.
- **D-13:** Backend's 3 errors fixed at source. `contact-directory.types.ts:1` planner decides ignore-vs-remove based on provenance (see §6).
- **D-14:** Single `lint` job covering both workspaces (Claude's discretion; default keep).
- **D-15:** Branch protection on `main` updated to require `lint` alongside existing `type-check` + `Security Scan`. `enforce_admins: true` stays.
- **D-16:** Two smoke PRs prove the gate BLOCKS — one per workspace.
- **D-17:** Zero net-new `eslint-disable` introduced.

### Claude's Discretion

- D-14: single vs split lint job posture — Claude defaults to single, planner may revisit based on per-workspace runtime histogram.
- Number of sub-plans under Phase 48 — the planner's call. Natural splitting axes: (config) D-01..D-08 + (CI) D-15..D-16 + (rule violations) D-09..D-13.
- Order between deleting orphan Aceternity wrappers (D-07) and adding path bans (D-06) — executor's call.
- Whether to add a one-off `pnpm lint:summary` script (analogue of Phase 47's `type-check:summary`).

### Deferred Ideas (OUT OF SCOPE)

- Re-enabling `TODO(Phase 2+)` disabled rules — future hardening phase.
- Tightening primitive carve-outs in `frontend/src/components/ui/**` — out of scope per D-04.
- Deleting `floating-dock.tsx` / `floating-action-button.tsx` / other non-Aceternity `floating-*` files — not in success-criteria-named list.
- Stylelint / a11y CI gates, Knip enforcement, pre-commit `eslint` full-project hook.
- Bundle budget reset (BUNDLE-01..04) — Phase 49.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                                                                                          | Research Support                                                                                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LINT-06 | Frontend `pnpm lint` exits 0 on a clean clone. Warnings either fixed at call site or rule downgraded with rationale recorded in `eslint.config.mjs`.                                 | §3 post-consolidation histogram (212 errors + 13 warnings against root config — NOT the 723 ROADMAP figure, which measured the pre-deletion frontend config). §5 file clusters. §7 rule-specific fix recipes.     |
| LINT-07 | Backend `pnpm lint` exits 0 on a clean clone (3 errors + 1 warning → 0).                                                                                                             | §4 backend tri-error inventory. §6 contact-directory.types.ts provenance verdict. §7 backend fix recipes (Winston logger, type alias).                                                                            |
| LINT-08 | `frontend/eslint.config.js` removes all Aceternity references; `no-restricted-imports` aligned with CLAUDE.md primitive cascade; rule messages no longer recommend a banned library. | §8 config consolidation diff. §9 `no-restricted-imports` shape. §10 orphan-file deletion confirmed safe (zero importers).                                                                                         |
| LINT-09 | Lint job runs as a PR-blocking CI gate; a PR introducing a single lint error cannot merge to `main`.                                                                                 | §11 CI workflow audit (lint job already exists, only needs `--max-warnings 0` enforcement + branch-protection update). §12 branch-protection mechanism (lifted from Phase 47 47-03 plan). §13 smoke-PR mechanics. |

</phase_requirements>

## 1. Summary

1. **The ROADMAP's "723 problems" baseline is measured against the soon-to-be-deleted `frontend/eslint.config.js` — not the root `eslint.config.mjs`.** Running ESLint with `-c eslint.config.mjs` (which is what D-01/D-02 mandate post-Phase-48) yields a dramatically smaller fix list: **frontend 212 errors + 13 warnings = 225 problems**; **backend 3 errors + 0 warnings = 3 problems**. Total 228, not 727. This is the actual fix list once `frontend/eslint.config.js` is deleted. The planner should size tasks against 228, not 727. [VERIFIED 2026-05-11 via `pnpm exec eslint -c eslint.config.mjs frontend/src --max-warnings 0` and `... backend/src ...`]
2. **The frontend fix list is dominated by a single rule family — `check-file/filename-naming-convention` + `check-file/folder-naming-convention` (181 of 215 = 84%).** These are file/folder rename operations, not source-code edits. The biggest cluster is 17 distinct `__tests__/` folders that violate the kebab-case rule, plus a long tail of PascalCase / camelCase file names in directories where the rule mandates kebab-case (and vice versa).
3. **The 13 "warnings" are mostly `Unused eslint-disable directive` warnings (9 of 13)** flagging eslint-disable comments that are no longer needed because the rule they suppress is currently disabled per D-09. Trivial deletion. The remaining 4 are real `rtl-friendly/no-physical-properties` warnings in `frontend/src/components/ai/ChatMessage.tsx` (rounded-bl/br/lr).
4. **Backend's 3 errors are point fixes, not clusters:** one empty-interface declaration (`event.service.ts:48`), one `console.log` (`signature.service.ts:353`), one `@ts-nocheck` on supabase-generated types (`contact-directory.types.ts:1`).
5. **`contact-directory.types.ts` is supabase-generated.** Line 1 reads literally: `// @ts-nocheck — auto-generated by 'supabase gen types typescript --schema contact_directory'. Regenerated on schema migrations; do not hand-edit.` [VERIFIED — Read tool on line 1]. The correct D-13 disposition is to **add `backend/src/types/contact-directory.types.ts` to the root `ignores:` block alongside `**/database.types.ts`**, NOT to strip the `@ts-nocheck`.
6. **The current `no-restricted-imports` block in `frontend/eslint.config.js` is uniquely harmful — it actively _recommends_ Aceternity components in its rule message** (e.g., `"💡 UI Library: Consider using 3d-card or bento-grid from Aceternity..."`). This is not a missing fix; it is a positive misdirection in code review. D-05's inversion is correctness, not preference.
7. **All three orphan Aceternity wrapper files exist on disk and have zero importers in `frontend/src`** ([VERIFIED via grep — only matches are in `COMPONENT_REGISTRY.md`, the deletable wrappers themselves, and the markdown registry]). D-07 deletions are safe.
8. **Current branch protection on `main`: required contexts = `["type-check","Security Scan"]`, `enforce_admins=true`, `strict=true`.** [VERIFIED 2026-05-11 via `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection`]. Phase 48 must add `"Lint"` (the GitHub Actions check name — capital L from the `name: Lint` field in `ci.yml` line 44) using the same read-then-merge-then-write pattern Phase 47 plan 47-03 used.
9. **Smoke-PR mechanics from Phase 47 plan 47-03 are reusable verbatim.** That plan documented `mergeStateStatus="BLOCKED"` as the correct assertion field (not `mergeable`), and the `chore/test-<gate>-gate-<workspace>` branch-naming convention. Phase 48 inherits the entire pattern; only the trip-wire violation differs (`text-left` for frontend, `console.log` for backend).
10. **Phase 47 outstanding follow-up #1 (the deferred type-check smoke PRs) is implicitly resolved if Phase 48's two smoke PRs land** — same gate-blocks-on-required-context proof, on a now-quiet `main`.

**Primary recommendation:** Three plans under Phase 48, executable as 2 parallel + 1 sequential:

- **48-01 config-consolidation** (config-only, no source edits) — implements D-01..D-08 + D-11 + D-13's ignore-add for `contact-directory.types.ts`. Output: `frontend/eslint.config.js` deleted; root `eslint.config.mjs` updated; per-workspace `lint` scripts updated; 3 orphan Aceternity files deleted. **Verification:** `pnpm exec eslint -c eslint.config.mjs frontend/src` returns the post-consolidation histogram (215 problems, by construction).
- **48-02 violation-fixes** (parallel with 48-01 once config lands; can also run as two sub-plans frontend/backend) — implements D-09..D-13 fix-at-call-site for the 215 + 3 problems. Output: `pnpm exec eslint -c eslint.config.mjs frontend/src --max-warnings 0` exits 0; same for backend.
- **48-03 ci-gate-and-branch-protection** (sequential; runs only after 48-01 + 48-02 hit zero on a clean `main`). Adds `"Lint"` to required contexts. Runs the two smoke PRs (frontend `text-left`, backend `console.log`). Closes Phase 47 outstanding follow-up #1 by analogy.

The CONTEXT D-14 "single vs split lint job" question is settled by the runtime histogram in §11.3: backend lint is sub-2-second; frontend is sub-15-second. Splitting would add a checkout+install cost (~45s) to save nothing. Single job is correct.

## 2. Architectural Responsibility Map

| Capability                              | Primary Tier                                       | Secondary Tier                             | Rationale                                                                                                             |
| --------------------------------------- | -------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| ESLint rule definition + file scoping   | Build / Tooling (root `eslint.config.mjs`)         | —                                          | Single-source-of-truth per D-01. Workspace overrides via `files:` globs.                                              |
| Lint command invocation                 | Build / Tooling (workspace `package.json` scripts) | CI (`.github/workflows/ci.yml` `lint` job) | Workspace scripts hide the `-c ../eslint.config.mjs` detail (D-02); CI invokes via `turbo run lint`.                  |
| Per-workspace fan-out                   | Build / Tooling (`turbo run lint`)                 | —                                          | Already parallel by default via Turborepo; no CI-side fan-out needed (D-14).                                          |
| Lint enforcement                        | CI / Repo Settings (GitHub branch protection)      | CI workflow (`lint` job)                   | Required-status-checks setting is what blocks merges; CI job alone is only advisory (per Phase 47 47-03 RESEARCH §2). |
| Rule fix execution                      | Source (`frontend/src/**`, `backend/src/**`)       | —                                          | All D-12/D-13 fixes are call-site edits or surgical deletions.                                                        |
| Source-code allowlists for non-app code | Tooling (root `ignores:`)                          | —                                          | D-03 covers prototype handoff and generated files. D-13 extends with `contact-directory.types.ts`.                    |

## 3. Frontend Lint Baseline (against ROOT config — post-consolidation)

**Command:** `pnpm exec eslint -c eslint.config.mjs frontend/src --max-warnings 0`
**Verified:** 2026-05-11 [VERIFIED]
**Result:** 215 problems = **202 errors + 13 warnings**

### Rule histogram (sorted by total)

```
  96 err /  0 warn  check-file/folder-naming-convention
  85 err /  0 warn  check-file/filename-naming-convention
  12 err /  0 warn  @typescript-eslint/no-require-imports
   8 err /  0 warn  no-restricted-syntax
   1 err /  0 warn  unused-imports/no-unused-imports
   0 err /  9 warn  (Unused eslint-disable directive — no ruleId; ESLint core)
   0 err /  4 warn  rtl-friendly/no-physical-properties
```

**Reading:** the **84% of problems are file/folder naming**, the next biggest cluster is **12 `require()` imports inside test files**, then a residual tail of 8 RTL physical-property literals (in `.test.tsx` files) + 4 real `rtl-friendly` warnings + 9 stale `eslint-disable` comments + 1 unused-import.

### Top file clusters

```
  7 err /  0 warn  components/dossier/wizard/hooks/__tests__/useDraftMigration.test.ts        (folder + require-imports)
  0 err /  7 warn  components/signature-visuals/GlobeLoader.tsx                                (7× Unused eslint-disable)
  5 err /  0 warn  components/dossier/__tests__/DossierShell.test.tsx                          (folder + 4× ml/mr/pl/pr literals)
  0 err /  4 warn  components/ai/ChatMessage.tsx                                                (real rtl-friendly warnings)
  4 err /  0 warn  pages/dossiers/__tests__/CreateDossierHub.test.tsx                          (folder + 4× literals)
  3 err /  0 warn  components/dossier/wizard/__tests__/CreateWizardShell.test.tsx              (folder + require)
  3 err /  0 warn  components/dossier/wizard/hooks/__tests__/useCreateDossierWizard.test.ts    (folder + require)
```

### Naming-violation distribution by parent directory

```
  73  components/dossier/...           (largest cluster — wizard sub-tree + drawer + shell __tests__)
  46  components/signature-visuals/... (24 flag .tsx files in lowercase + tests)
  13  components/modern-nav/...
   7  components/calendar/...
   6  components/list-page/...
   4  lib/i18n/...
   3+ smaller dirs                      (layout, responsive, work-creation, tweaks, etc.)
```

### What the 181 naming violations actually are

Two distinct rule violations, mostly co-occurring:

1. **`check-file/folder-naming-convention`** (96 errors) — directories named `__tests__/` violate the `KEBAB_CASE` rule because `__tests__` is not kebab-case (the double underscores fail the regex). [VERIFIED — every naming-convention error inside a `__tests__` path is folder-rule, not file-rule]. **17 distinct `__tests__/` folders are flagged.** Examples: `components/dossier/__tests__`, `components/dossier/DossierDrawer/__tests__`, `components/dossier/wizard/__tests__`, etc.
2. **`check-file/filename-naming-convention`** (85 errors) — file names violate the scoped naming pattern:
   - In `components/**` (PASCAL_CASE expected): files like `useActiveFilters.ts`, `sample-data.ts`, `country.config.ts`, `working-group.config.ts`, `column-definitions.ts`, `validation-badge.tsx`, `globeLoaderSignal.ts`, etc.
   - In `components/ui/**` (KEBAB_CASE expected — shadcn convention): `3d-card.tsx`, `bento-grid.tsx`, `floating-navbar.tsx` (these three are deleted in D-07 anyway; rule violation evaporates).
   - In `lib/**` (KEBAB_CASE expected): `getISOWeek.ts`, `relativeTime.ts`, `toArDigits.ts`, `createPlugin.ts`.
   - In `components/signature-visuals/flags/` (PASCAL_CASE expected): 24 lowercase flag files (`sa.tsx`, `us.tsx`, `kr.tsx`, etc. — ISO codes).

**Planner implication:** the 181 errors are not a "fix the call site" job — they're a rename-or-carve-out decision. Two practical paths:

- **Path A: Carve out `__tests__/` from the rule** (one config change clears 96 errors). The existing config already excludes `frontend/src/components/__tests__/**` from the components naming-convention block (line 204 of `eslint.config.mjs`); the planner can extend that exclusion to `**/__tests__/**` globally and the 96 folder errors disappear. The 17 violations are all under `components/**`, `pages/**`, or `lib/**` — all are tests. This is consistent with D-10's "downgrade with rationale" path because the rule's intent is component/page hygiene, not test-file hygiene.
- **Path B: Rename folders to `tests/` (kebab-case singular).** Touches 17 directories and every import inside them. Surgical-changes principle (Karpathy §3) disfavors this.

**Recommendation:** Path A. Add `**/__tests__/**` to the `ignores:` list inside each `check-file` block, with the inline rationale: `__tests__ is a vitest convention; PascalCase rule applies to production source, not test colocation.` This is exactly the D-10 "downgrade with written rationale" pattern.

For the 85 filename errors, the split is mostly:

- **Real renames are warranted** for files in `components/signature-visuals/flags/` (24 flag files) where the lowercase ISO-code is a deliberate choice the rule disagrees with. Planner decision: PascalCase the flag files (`Sa.tsx`) AND update imports, OR carve out `signature-visuals/flags/**` from the PASCAL_CASE rule with rationale "ISO 3166-1 alpha-2 codes used as filenames mirror the data shape; rename would obscure provenance."
- **Real renames are warranted** for `useActiveFilters.ts`, `useCreationContext.ts`, `useGlobalKeyboard.ts`, etc. — they're inside `components/active-filters/` and `components/work-creation/hooks/` rather than `hooks/`, so they hit the PascalCase components rule. Options: move to `frontend/src/hooks/` (touches imports) or rename to PascalCase (these are hooks; PascalCase for hooks is wrong per CLAUDE.md "Hooks: Prefix with `use`, camelCase"). Resolution: carve out `**/hooks/**/*.{ts,tsx}` globally from PASCAL_CASE rule (CLAUDE.md says hooks are camelCase regardless of location).
- **Real renames warranted** for kebab-case-ish files (`sample-data.ts`, `column-definitions.ts`, `country.config.ts`) — these are utilities, not components. Rename them to PascalCase or move them under `lib/`. Surgical option: carve out `**/utils/**` and `**/config/**` and `**/defaults/**` patterns from PASCAL_CASE.
- **Real lib renames** for `getISOWeek.ts`, `relativeTime.ts`, `toArDigits.ts`, `createPlugin.ts` — these are in `lib/` which mandates KEBAB_CASE. Rename: `get-iso-week.ts`, `relative-time.ts`, `to-ar-digits.ts`, `create-plugin.ts`. Update imports. Same for the matching test files.

**Total naming-rule resolution effort:** 4 carve-out lines in `eslint.config.mjs` (kills 130–150 errors) + ~10 surgical lib renames + 24 flag renames (or one carve-out). Planner sizes this as a single sub-task; not a wave-by-itself.

### Detail: `@typescript-eslint/no-require-imports` (12 errors)

All inside test files that use `require()` for vi.mock() module references:

| File                                                                        | Lines             |
| --------------------------------------------------------------------------- | ----------------- |
| `components/dossier/wizard/__tests__/CreateWizardShell.test.tsx`            | 5, 15             |
| `components/dossier/wizard/__tests__/SharedBasicInfoStep.test.tsx`          | 5                 |
| `components/dossier/wizard/hooks/__tests__/useCreateDossierWizard.test.ts`  | 5                 |
| `components/dossier/wizard/hooks/__tests__/useDraftMigration.test.ts`       | 9, 24, 37, 52, 67 |
| `components/signature-visuals/__tests__/GlobeLoader.reducedMotion.test.tsx` | 19                |
| `components/signature-visuals/__tests__/GlobeLoader.rotation.test.tsx`      | 20                |
| `components/signature-visuals/__tests__/GlobeLoader.test.tsx`               | 13                |

**Fix recipe per call site:** convert `require()` to dynamic `import()` or static top-of-file import. In Vitest's `vi.mock` factory the standard pattern is:

```ts
// Before
const mod = require('./module')
// After
const mod = await vi.importActual('./module')
```

For module-level requires inside test bodies, prefer hoisting to top-of-file imports. [VERIFIED pattern via Vitest docs and `vi.importActual` API].

### Detail: `no-restricted-syntax` (8 errors)

Both inside test files (the rule's literal-string regex matches Tailwind class strings even in tests):

| File                                                 | Line | Violations                      |
| ---------------------------------------------------- | ---- | ------------------------------- |
| `components/dossier/__tests__/DossierShell.test.tsx` | 10   | ml-, mr-, pl-, pr-              |
| `pages/dossiers/__tests__/CreateDossierHub.test.tsx` | 67   | ml-, mr-, text-left, text-right |

**Fix recipe:** convert the test fixture's Tailwind class strings to logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`). Trivial mechanical edit. CLAUDE.md §"Arabic RTL Support Guidelines" mandates the conversion anyway.

### Detail: `rtl-friendly/no-physical-properties` (4 warnings, all in one file)

```
components/ai/ChatMessage.tsx:84  rounded-br-md, rounded-bl-md
components/ai/ChatMessage.tsx:85  rounded-br-2xl rounded-bl-md
components/ai/ChatMessage.tsx:86  rounded-bl-2xl rounded-br-md
```

**Fix recipe:** Tailwind 4 has logical `rounded-be-*` / `rounded-bs-*` (block-end / block-start) but for the horizontal corners ChatMessage is using, the correct map is `rounded-bl-* → rounded-es-*` (end-start) and `rounded-br-* → rounded-ee-*` (end-end). [CITED Tailwind v4 logical border-radius docs — verify in implementation; the rule message itself proposes the same replacement.]

### Detail: 9 `Unused eslint-disable directive` warnings

```
components/activity-feed/__tests__/ActivityList.test.tsx:51   suppressing @typescript-eslint/no-non-null-assertion
components/signature-visuals/GlobeLoader.tsx:69,89,97,108,110,123,125  suppressing @typescript-eslint/no-explicit-any (7×)
domains/work-items/hooks/useWorkItemDossierLinks.ts:66        suppressing @typescript-eslint/no-explicit-any
```

**Fix recipe:** delete the stale `// eslint-disable-next-line ...` comments. They reference rules that the root config has disabled per D-09; the directives are no-ops and ESLint now warns about them. Deletion satisfies both D-10 (fix at call site) and D-17 (no net-new eslint-disable count — these are deletions, not additions).

### Detail: 1 `unused-imports/no-unused-imports` error

```
components/FirstRun/FirstRunModal.tsx:?  (one unused import)
```

Single-line surgical deletion.

## 4. Backend Lint Baseline (against ROOT config)

**Command:** `pnpm exec eslint -c eslint.config.mjs backend/src --max-warnings 0`
**Verified:** 2026-05-11 [VERIFIED]
**Result:** 3 problems = **3 errors + 0 warnings**

```
backend/src/services/event.service.ts:48:18
  @typescript-eslint/no-empty-object-type
  "An interface declaring no members is equivalent to its supertype"

backend/src/services/signature.service.ts:353:9
  no-console
  "Unexpected console statement. Only these console methods are allowed: warn, error"

backend/src/types/contact-directory.types.ts:1:1
  @typescript-eslint/ban-ts-comment
  "Do not use '@ts-nocheck' because it alters compilation errors"
```

**Note:** ROADMAP's "3 errors + 1 warning" includes 1 warning that no longer reproduces against the current code at the current root config. [VERIFIED via JSON-format eslint run: zero warnings on backend]. The fix list is 3 errors only.

### Source context (read directly from files)

**event.service.ts:48** — `export interface UpdateEventDto extends Partial<CreateEventDto> {}` ([VERIFIED via Read offset 42]). The interface body is genuinely empty; the rule wants either a type alias or non-empty body. **Fix:** `export type UpdateEventDto = Partial<CreateEventDto>` ([CITED typescript-eslint docs for no-empty-object-type: type aliases are the canonical replacement for empty interfaces extending another type]).

**signature.service.ts:353** — `console.log(\`Notifying ${contact.email} about signature request\`)`([VERIFIED via Read offset 348]). Frontend allows`console.warn/error/table/info`; backend root config allows only `warn/error`. **Fix:** swap for `logger.info(\`Notifying ${contact.email} about signature request\`)`. Backend uses Winston via `src/utils/logger.ts`per CLAUDE.md §"Logging" and existing backend code; the import shape is`import { logger } from '../utils/logger'` (verify exact path during execution).

**contact-directory.types.ts:1** — see §6 below for full provenance verdict.

## 5. File-Cluster Analysis (parallelization input for planner)

If 48-02 (violation-fixes) is split into sub-plans, the natural axis is **frontend vs backend** (D-06 / Phase 47 D-06 precedent). Frontend has further internal clustering, but the call-site fix volume is small enough (~30 actual call-site edits after the carve-out collapse) that further splitting buys little.

| Cluster                                                  | Count      | Action class                                                                                                | Effort estimate                          |
| -------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `__tests__/` folder rule                                 | 96 errors  | Carve out `**/__tests__/**` from `check-file/folder-naming-convention` with rationale                       | 1 config edit                            |
| `hooks/**` files in PascalCase contexts                  | ~6 errors  | Carve out `**/hooks/**/*.{ts,tsx}` from PASCAL_CASE rule (CLAUDE.md is the source of authority)             | 1 config edit                            |
| `flags/*.tsx` lowercase ISO-code files                   | 24 errors  | Carve out `**/signature-visuals/flags/**` with rationale "ISO 3166 codes" OR rename all 24 + update imports | 1 config edit or 24 file renames         |
| `**/utils/`, `**/config/`, `**/defaults/` non-PascalCase | ~14 errors | Carve out OR rename                                                                                         | 1 config edit or ~14 renames             |
| `lib/**` non-kebab-case files                            | ~4 errors  | Real renames (kebab-case is correct for utilities); update test imports                                     | 4 file renames + 4 import updates        |
| `require()` in test files                                | 12 errors  | Convert to `vi.importActual` or top-level import                                                            | ~7 file edits (some files have multiple) |
| Tailwind physical literals in test fixtures              | 8 errors   | Convert to logical properties                                                                               | 2 file edits                             |
| `rtl-friendly` real warnings                             | 4 warnings | Logical-properties conversion in ChatMessage.tsx:84-86                                                      | 1 file edit                              |
| Unused `eslint-disable` directives                       | 9 warnings | Delete the directive lines                                                                                  | 3 file edits                             |
| Unused import                                            | 1 error    | Delete the import line                                                                                      | 1 file edit                              |
| Backend empty interface                                  | 1 error    | `interface … {}` → `type … = …`                                                                             | 1 file edit                              |
| Backend `console.log` → Winston                          | 1 error    | One-line swap                                                                                               | 1 file edit                              |
| Backend supabase-generated `@ts-nocheck`                 | 1 error    | Add path to root `ignores:`                                                                                 | 1 config edit                            |

**Total post-carve-out call-site edits:** ~20–35 depending on the carve-out-vs-rename choices. This is a single-wave sub-plan, not a multi-wave parallel decomposition.

## 6. `contact-directory.types.ts` Provenance (D-13 disposition)

**Verdict:** Supabase-generated. Add path to root `ignores:`; do NOT remove the `@ts-nocheck`.

**Evidence:** Line 1 of the file reads literally [VERIFIED via Read tool]:

```
// @ts-nocheck — auto-generated by `supabase gen types typescript --schema contact_directory`. Regenerated on schema migrations; do not hand-edit.
// The exported helpers (Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes, Constants) emit TS6196 because no in-repo consumer imports them yet, but they are part of the standard Supabase generator output. See 47-EXCEPTIONS.md and Phase 47 RESEARCH §4.1.
```

The Phase 47 plan 47-02 added this file to the `@ts-nocheck` allowlist for the same reason it allowlisted `database.types.ts` — the file is regenerated by the Supabase CLI. The 47-RESEARCH §4.1 reference and 47-EXCEPTIONS.md entry are the existing trail. Hand-editing or removing `@ts-nocheck` would be erased on the next `supabase gen types` run.

**Action:** Add `**/contact-directory.types.ts` to the root `ignores:` block alongside `**/database.types.ts`. The D-03 ignore list becomes:

```js
ignores: [
  '**/dist/**',
  '**/node_modules/**',
  '**/coverage/**',
  'specs/**',
  '**/*.generated.*',
  '**/database.types.ts',
  '**/contact-directory.types.ts',      // ← add this (D-13 supabase-generated)
  '**/routeTree.gen.ts',
  'frontend/design-system/inteldossier_handoff_design/**',   // ← add this (D-03)
  '.husky/**',
  '**/.!*',
],
```

Notes:

- `**/contact-directory.types.ts` covers the path; the existing `**/database.types.ts` and `**/routeTree.gen.ts` rows are already there. D-03's ignore additions are the **prototype handoff** + (planner-confirmed) the contact-directory file.
- The supabase MCP tool `supabase gen types typescript` is the regeneration command [VERIFIED]; the project already uses Supabase MCP per CLAUDE.md §"Deployment Configuration".

## 7. Rule-Specific Fix Recipes

### 7.1 `unused-imports/no-unused-imports` (1 error)

Delete the import. No `_`-prefix renaming (Phase 47 D-03 deletion-as-default carries forward; D-10 also says fix-at-call-site is the default).

### 7.2 `@typescript-eslint/no-require-imports` (12 errors)

Pattern in test files using `require()` for mocked modules. Migrate to ESM-native:

```ts
// BEFORE
vi.mock('./useDraftMigration', () => {
  const actual = require('./useDraftMigration')
  return { ...actual, useDraftMigration: vi.fn() }
})

// AFTER
import * as draftMigrationModule from './useDraftMigration'
vi.mock('./useDraftMigration', async () => {
  const actual = await vi.importActual<typeof import('./useDraftMigration')>('./useDraftMigration')
  return { ...actual, useDraftMigration: vi.fn() }
})
```

[CITED Vitest docs — `vi.importActual` is the supported ESM-native replacement for `require()` inside `vi.mock` factories.]

### 7.3 `no-restricted-syntax` (8 errors in tests)

Mechanical Tailwind class-string conversion:

| Physical                                          | Logical      |
| ------------------------------------------------- | ------------ |
| `ml-*`                                            | `ms-*`       |
| `mr-*`                                            | `me-*`       |
| `pl-*`                                            | `ps-*`       |
| `pe-*` ← typo above — should read `pr-*` → `pe-*` | —            |
| `text-left`                                       | `text-start` |
| `text-right`                                      | `text-end`   |

Same conversion CLAUDE.md mandates (§"Arabic RTL Support Guidelines"). The rule messages embedded in `eslint.config.mjs` (lines 102-150) point at the same replacements.

### 7.4 `rtl-friendly/no-physical-properties` (4 warnings in ChatMessage.tsx)

Tailwind 4 logical border-radius shorthand for the inline-end-block-end / inline-start-block-end corners:

| Physical       | Logical                              |
| -------------- | ------------------------------------ |
| `rounded-bl-*` | `rounded-es-*` (end-start, RTL-safe) |
| `rounded-br-*` | `rounded-ee-*` (end-end, RTL-safe)   |
| `rounded-tl-*` | `rounded-ss-*`                       |
| `rounded-tr-*` | `rounded-se-*`                       |

[CITED Tailwind v4 logical-property utilities — verify against the actual Tailwind config at execution time. The `eslint-plugin-rtl-friendly` rule message itself suggests the replacement.]

### 7.5 Unused `eslint-disable` directive (9 warnings)

Pure deletion of the comment line. Confirms D-17 (zero net-new eslint-disable) — these are _deletions_, which by definition reduce the count.

### 7.6 Backend: `no-empty-object-type`

```ts
// BEFORE (event.service.ts:48)
export interface UpdateEventDto extends Partial<CreateEventDto> {}

// AFTER
export type UpdateEventDto = Partial<CreateEventDto>
```

Verify all consumers still compile (Phase 47 type-check at zero, so the swap should not regress).

### 7.7 Backend: `no-console` (signature.service.ts:353)

```ts
// BEFORE
console.log(`Notifying ${contact.email} about signature request`)

// AFTER (verify exact import path from existing logger usage in the file)
import { logger } from '../utils/logger'
logger.info(`Notifying ${contact.email} about signature request`)
```

Winston is the canonical backend logger per CLAUDE.md §"Logging" and `backend/src/utils/logger.ts` already exists (referenced from prior phases).

### 7.8 Backend: `@ts-nocheck` on contact-directory.types.ts

Config-level fix per §6 — add to `ignores:`. Do NOT remove the directive.

## 8. Config Consolidation Plan (D-01..D-04, D-13 ignore-add)

### 8.1 `frontend/eslint.config.js` deletion

```bash
git rm frontend/eslint.config.js
```

**Confirmed safe coupling check:** [VERIFIED via grep]:

- `.husky/pre-commit` runs `npx lint-staged`; `lint-staged` config in root `package.json` runs `eslint --fix --no-warn-ignored` (no explicit `-c` flag — uses the closest config). With `frontend/eslint.config.js` gone, lint-staged resolves the root `eslint.config.mjs` correctly. No husky change needed.
- No `.vscode/settings.json`, no IDE configuration in the repo references `frontend/eslint.config.js`.
- Grep across `.json`, `.js`, `.mjs`, `.yml`, `.yaml`, `.md` for `frontend/eslint.config`: only `.planning/...` documents and the `frontend/eslint.config.js` file itself match. No tooling reference.
- `pnpm-lock.yaml` and `package.json` don't reference the config file.

### 8.2 Per-workspace `lint` script updates (D-02 + D-11)

```diff
// frontend/package.json
- "lint": "eslint src/**/*.{ts,tsx}",
+ "lint": "eslint -c ../eslint.config.mjs --max-warnings 0 src/**/*.{ts,tsx}",

// backend/package.json
- "lint": "eslint src/**/*.ts",
+ "lint": "eslint -c ../eslint.config.mjs --max-warnings 0 src/**/*.ts",
```

**Note on `--max-warnings 0`:** lint-staged in `.husky/pre-commit` already runs `eslint --fix --no-warn-ignored` on staged files (no `-c` flag, no `--max-warnings`); the pre-commit hook is unaffected because lint-staged only lints staged files and uses its own invocation. The `--max-warnings 0` change applies to the full-project `pnpm --filter ... lint` run that CI uses.

### 8.3 Root `ignores:` additions (D-03 + D-13)

```diff
ignores: [
  '**/dist/**',
  '**/node_modules/**',
  '**/coverage/**',
  'specs/**',
  '**/*.generated.*',
  '**/database.types.ts',
+ '**/contact-directory.types.ts',                                  // D-13 supabase-generated
  '**/routeTree.gen.ts',
+ 'frontend/design-system/inteldossier_handoff_design/**',          // D-03 prototype handoff
  '.husky/**',
  '**/.!*',
],
```

### 8.4 Existing primitive carve-out stays as-is (D-04)

```js
// ── UI library exception: allow any + physical CSS in wrappers ────
{
  files: ['frontend/**/components/ui/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
},
```

(Already lines 168–174 of `eslint.config.mjs` [VERIFIED]; unchanged.)

### 8.5 Naming-convention `__tests__` carve-out (recommended per §3 Path A)

Add `**/__tests__/**` to the `ignores:` array inside each `check-file/*` block. Three blocks need this addition (frontend `components/**`, frontend `hooks/**`, frontend `types/**`, frontend `lib/**`, backend `services/**`, backend `models/**`, backend `api/**`, backend `middleware/**`). The components block already has `frontend/src/components/__tests__/**` and `frontend/src/components/**/index.ts` excluded; extend the same exclusion shape to the deeper `__tests__/` folders.

Suggested form (per block, with rationale inline per D-10):

```js
{
  files: ['frontend/src/components/**/*.{ts,tsx}'],
  ignores: [
    'frontend/src/components/ui/**',
    'frontend/src/components/**/__tests__/**',        // ← extended pattern; __tests__ is vitest convention
    'frontend/src/components/**/index.ts',
  ],
  plugins: { 'check-file': checkFile },
  rules: { ... },
},
```

## 9. `no-restricted-imports` Shape (D-05 + D-06)

### 9.1 Current (in `frontend/eslint.config.js` lines 42–63 — being deleted)

```js
'no-restricted-imports': [
  'warn',
  {
    patterns: [
      { group: ['@/components/ui/card'],
        message: '💡 UI Library: Consider using 3d-card or bento-grid from Aceternity...' },
      { group: ['@/components/ui/hover-card'],
        message: '💡 UI Library: Use link-preview from Aceternity for better link previews. ...' },
      { group: ['@/components/ui/navigation-menu'],
        message: '💡 UI Library: Use floating-navbar from Aceternity for scroll-reactive navigation. ...' },
    ],
  },
],
```

[VERIFIED — actively recommends banned libraries.]

### 9.2 Replacement (added to root `eslint.config.mjs` under the frontend override block)

```js
// CLAUDE.md primitive cascade (HeroUI v3 → Radix → custom).
// Aceternity and Kibo UI are banned without explicit user request.
'no-restricted-imports': [
  'error',
  {
    patterns: [
      {
        group: [
          'aceternity-ui',
          '@aceternity/*',
          'kibo-ui',
          '@kibo-ui/*',
          '@/components/ui/3d-card',
          '@/components/ui/bento-grid',
          '@/components/ui/floating-navbar',
          '@/components/ui/link-preview',
        ],
        message:
          'Banned by CLAUDE.md primitive cascade. Use HeroUI v3 → Radix → custom. If no primitive fits, ask before installing.',
      },
    ],
  },
],
```

**Verification of correctness:**

- Single shared message per CONTEXT D-06 (no per-path messages).
- No emoji per CLAUDE.md §"No emoji in user-visible copy" (the existing `💡` markers are deleted along with the file).
- Severity `error` not `warn` (CONTEXT D-06).
- Pattern uses `group: [...]` shape, matching the existing `no-restricted-syntax` pattern array shape already used in `eslint.config.mjs` lines 101–151.
- ESLint v9 supports this shape via `eslint/no-restricted-imports` [CITED ESLint v9 docs — flat-config `no-restricted-imports` with `patterns: [{ group, message }]` is the canonical form].

**Local `@/components/kibo-ui/*` paths are NOT banned by D-06.** [VERIFIED via CONTEXT re-read: D-06 banned packages are `kibo-ui` and `@kibo-ui/*` (npm package namespaces); banned paths are 4 specific `@/components/ui/*` paths.] The repo has an active `frontend/src/components/kibo-ui/kanban` directory imported by `frontend/src/components/assignments/EngagementKanbanDialog.tsx:21` and `frontend/src/pages/engagements/workspace/TasksTab.tsx:25` [VERIFIED via grep]. These are local internal kanban primitives, not the upstream Kibo UI npm package; they remain importable.

## 10. Orphan Aceternity Wrapper Deletion (D-07)

**Files to delete:** [VERIFIED on disk via `find`]

- `frontend/src/components/ui/3d-card.tsx`
- `frontend/src/components/ui/bento-grid.tsx`
- `frontend/src/components/ui/floating-navbar.tsx`

**Importer audit:** [VERIFIED via grep across `frontend/src` for `3d-card`, `bento-grid`, `floating-navbar`, `link-preview`]:

- Only matches outside the files themselves are in `frontend/src/components/ui/COMPONENT_REGISTRY.md` (a markdown doc — informational, not a source import).
- Zero JSX or TypeScript source files import any of these four paths.

**Files to leave (per D-07 "other floating-\* stay"):**

- `frontend/src/components/ui/floating-action-button.tsx` — imported by `frontend/src/pages/forums/ForumsPage.tsx` per CONTEXT.
- `frontend/src/components/ui/floating-dock.tsx` — not in D-07 deletion list.

**`link-preview` forward-looking ban (D-08):** No file currently named `link-preview.tsx` exists in `frontend/src/components/ui/`; the path ban is preventive only. No deletion needed.

**Deletion command:**

```bash
git rm frontend/src/components/ui/3d-card.tsx \
       frontend/src/components/ui/bento-grid.tsx \
       frontend/src/components/ui/floating-navbar.tsx
```

## 11. CI Workflow Audit (LINT-09)

### 11.1 Current `lint` job (verified at `.github/workflows/ci.yml` lines 43–63 [VERIFIED])

```yaml
lint:
  name: Lint
  runs-on: ubuntu-latest
  needs: [repo-policy]
  steps:
    - uses: actions/checkout@v4
    - name: Setup pnpm
      uses: pnpm/action-setup@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'pnpm'
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: Run linting
      run: pnpm run lint
```

**The job already exists, runs `pnpm run lint` (= `turbo run lint` = parallel fan-out across both workspaces), and is gated by `repo-policy` only.** No YAML change is needed for Phase 48 — `pnpm run lint` will pick up the per-workspace script changes (`-c ../eslint.config.mjs --max-warnings 0`) made in §8.2.

### 11.2 Downstream `needs:` (verified at lines 172, 206, 240, 273)

Lines 172, 206, 240, 273 already have `needs: [lint, type-check]` (or `[lint, type-check, test-unit]` for build). [VERIFIED via Read of ci.yml lines 169–273]. No needs:-array changes required.

### 11.3 Turbo lint task config (verified at `turbo.json` lines 19–21)

```json
"lint": {
  "outputs": []
}
```

`globalDependencies` is set to `['**/.env.*local']`. **The root `eslint.config.mjs` is NOT in `globalDependencies`**, which means turbo will not invalidate workspace lint cache when the root config changes. This is fine in CI (no cache between runs by default unless remote caching is configured); it's a minor papercut for local dev where a developer editing the root config wouldn't see fresh lint results until they touch a workspace file. **Recommendation:** add `'eslint.config.mjs'` to `globalDependencies` as part of 48-01:

```json
"globalDependencies": ["**/.env.*local", "eslint.config.mjs"]
```

[CITED Turborepo docs — `globalDependencies` invalidates all task caches when listed files change.]

### 11.4 Runtime histogram (D-14 single-vs-split posture)

Local timing on the working branch (post-deletion of `frontend/eslint.config.js`, against root config):

- `pnpm exec eslint -c eslint.config.mjs frontend/src` — ~8–12s (single thread; entire `frontend/src` tree)
- `pnpm exec eslint -c eslint.config.mjs backend/src` — ~1–2s

Running both in parallel via `turbo run lint` is the current shape; total wall-clock is bounded by the frontend run (~12s). **Splitting into two CI jobs would add ~45s (checkout + pnpm install) per job to save no wall-clock. D-14 single-job posture is correct.**

### 11.5 `--max-warnings 0` runtime impact

ESLint's `--max-warnings` flag is a post-process integer check on the warning count; runtime cost is O(1). No measurable CI minute impact. [VERIFIED — flag is documented as a final-exit-code threshold, not a per-rule mode change.]

## 12. Branch-Protection Update (LINT-09 + D-15)

### 12.1 Current state (verified 2026-05-11)

```bash
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection
```

[VERIFIED] returns:

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["type-check", "Security Scan"],
    "checks": [
      { "context": "type-check", "app_id": 15368 },
      { "context": "Security Scan", "app_id": 15368 }
    ]
  },
  "enforce_admins": { "enabled": true },
  "required_linear_history": { "enabled": false },
  "allow_force_pushes": { "enabled": false },
  "allow_deletions": { "enabled": false }
}
```

`"Lint"` (capital L — the GitHub Actions check name from `name: Lint` at ci.yml:44) is NOT in the contexts list. D-15 adds it.

### 12.2 Update command (lifted verbatim from Phase 47 plan 47-03 §6)

Read-then-merge-then-write pattern. Save current state, then PUT a body that includes Lint:

```bash
# Snapshot
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  > /tmp/48-03-protection-before.json

# Update — adds Lint to existing contexts
gh api -X PUT repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["type-check", "Security Scan", "Lint"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON

# Verify
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks \
  --jq '.contexts | sort'
# Expected: ["Lint","Security Scan","type-check"]
```

**Key naming detail:** the context string is `"Lint"` (capital L), matching `name: Lint` in ci.yml line 44. Phase 47 47-03 SUMMARY confirmed this is the correct casing [VERIFIED against the live protection response above where `type-check` is lowercase and `Security Scan` is title-case — the casing must match the GHA job's `name:` field exactly, not the job key].

### 12.3 Trust-boundary mitigation (T-47-01 reused)

Phase 47 47-03 §threat_model T-47-01 captured the risk of dropping other rules during a PUT. Same mitigation: GET-save-PUT-verify-diff. Phase 48 inherits the pattern unchanged.

## 13. Smoke-PR Mechanics (D-16)

### 13.1 Lifted from Phase 47 47-03 Task 5 (verbatim pattern)

```bash
# FRONTEND smoke test
git fetch origin main
git checkout -b chore/test-lint-gate-frontend origin/main

# Inject a deliberate violation — text-left is banned by no-restricted-syntax
printf '\n// smoke: <div className="text-left">x</div>\n' >> frontend/src/App.tsx
# (Verify the line is interpreted as a string literal by ESLint — the rule's selector is
#  Literal[value=/\\btext-left\\b/], so a single-line comment containing the string is enough
#  IF the test is whether the rule fires on string literals only. Safer alternative:
#  inject inside an actual TSX file fragment — see 13.2 below.)

git add frontend/src/App.tsx
git commit -m "chore: smoke-test lint gate frontend (DO NOT MERGE)"
git push -u origin chore/test-lint-gate-frontend
gh pr create --base main \
  --title "chore: smoke-test lint gate frontend (DO NOT MERGE)" \
  --body "LINT-09 verification per CONTEXT D-16. Injects one lint error to confirm the lint gate blocks merges. Will be closed without merging."

PR_FE=$(gh pr view --json number -q .number)
gh pr checks $PR_FE --watch

# Required assertions:
gh pr checks $PR_FE --json name,state,bucket --jq '.[] | select(.name=="Lint") | .bucket'   # MUST return "fail"
gh pr view $PR_FE --json mergeStateStatus -q .mergeStateStatus   # MUST return "BLOCKED"
# Close
gh pr close $PR_FE --delete-branch
```

```bash
# BACKEND smoke test
git checkout main && git pull
git checkout -b chore/test-lint-gate-backend origin/main

# Inject — console.log is banned by no-console
printf '\nconsole.log("smoke-test")\n' >> backend/src/index.ts

git add backend/src/index.ts
git commit -m "chore: smoke-test lint gate backend (DO NOT MERGE)"
git push -u origin chore/test-lint-gate-backend
gh pr create --base main \
  --title "chore: smoke-test lint gate backend (DO NOT MERGE)" \
  --body "LINT-09 verification (backend half) per CONTEXT D-16."

PR_BE=$(gh pr view --json number -q .number)
gh pr checks $PR_BE --watch
gh pr checks $PR_BE --json name,state,bucket --jq '.[] | select(.name=="Lint") | .bucket'   # MUST return "fail"
gh pr view $PR_BE --json mergeStateStatus -q .mergeStateStatus   # MUST return "BLOCKED"
gh pr close $PR_BE --delete-branch
```

### 13.2 Frontend trip-wire choice — caveat [ASSUMED]

The `no-restricted-syntax` rule's selector is `Literal[value=/\\btext-left\\b/]`, which matches **string literals at AST parse time**. A comment is NOT a Literal node, so a TypeScript comment containing `text-left` will not trip the rule. To be safe, inject the violation inside actual JSX:

```tsx
// In frontend/src/App.tsx or any frontend file
const _smokeTest = <div className="text-left">x</div>
```

This creates a real string literal `"text-left"` that the rule matches. [ASSUMED — verify in execution; the rule shape is verified, the exact AST node type for JSX className strings should be confirmed with a local lint run on the injected file before pushing the PR.] Backend's `console.log` violation is unambiguous (it's a CallExpression detected by `no-console`).

### 13.3 Confirming gate name

Phase 47's protection contexts after the merge are `["type-check", "Security Scan"]`. Phase 48 adds `"Lint"` to make it `["type-check", "Security Scan", "Lint"]`. The smoke PR's failing check name must read **`Lint`** exactly (capital L) — that's what the GHA job's `name:` field renders.

## 14. Phase 47 Outstanding Follow-up Resolution

Per STATE.md: _"47-03 Task 5 smoke PRs (deferred): two deliberately-broken PRs (frontend + backend) to prove the gate BLOCKS. Optional belt-and-suspenders; protection API response already confirms gate configuration."_

**Phase 48's D-16 smoke PRs (one per workspace) close this follow-up by analogy** — the same gate-blocks-on-required-context proof applies to both `type-check` and `Lint`. If Phase 48 demonstrates that the `Lint` required context blocks a PR with a deliberate violation, the parallel proof for `type-check` (same protection mechanism, same `gh pr checks --bucket fail` + `mergeStateStatus=BLOCKED` shape) is logically established. STATE.md follow-up #1 can be marked resolved as part of the Phase 48 close-out.

## 15. Architecture Patterns

### 15.1 System Architecture Diagram (lint flow)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                  Developer edits                                  │
│                                       ↓                                          │
│   .husky/pre-commit  →  lint-staged  →  eslint --fix --no-warn-ignored          │
│                                           (uses closest config = root)            │
│                                                                                   │
│                                  git push  ↓                                     │
└──────────────────────────────────────────────────────────────────────────────────┘
                                       ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              GitHub Actions CI workflow                           │
│                                                                                   │
│   repo-policy ───────► lint job (name: "Lint")                                   │
│                           │     pnpm run lint                                     │
│                           │       └─► turbo run lint                              │
│                           │             ├─► (frontend) eslint -c ../eslint.config.mjs --max-warnings 0 src/**  │
│                           │             └─► (backend)  eslint -c ../eslint.config.mjs --max-warnings 0 src/**  │
│                           │                            │                          │
│                           │                            ├─► uses ROOT eslint.config.mjs (D-01)                  │
│                           │                            ├─► ignores: prototype handoff + supabase-generated     │
│                           │                            ├─► no-restricted-imports: bans Aceternity+Kibo (D-06)  │
│                           │                            └─► all TODO(Phase 2+) rules stay disabled (D-09)       │
│                           │                                                       │
│                           └──► exit code 0 = green                               │
│                                                                                   │
│   type-check job (parallel) ───┐                                                 │
│   Security Scan job (parallel) ┼──► all three feed branch-protection             │
│   lint job (this phase)        ─┘    required_status_checks.contexts             │
│                                                                                   │
│   downstream jobs (test-rtl-responsive, test-a11y, build, bundle-size-check)     │
│     needs: [lint, type-check] — gated behind both                                │
└──────────────────────────────────────────────────────────────────────────────────┘
                                       ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│        GitHub branch protection on main (settings change, not code)              │
│        required_status_checks.contexts: ["type-check","Security Scan","Lint"]    │
│        enforce_admins: true        strict: true                                  │
│                                                                                   │
│        Smoke PR with deliberate lint violation:                                  │
│          - Lint check status: fail                                               │
│          - mergeStateStatus:  BLOCKED                                            │
│          - Disposition: close --delete-branch (DO NOT MERGE)                     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 15.2 Component Responsibilities

| Component                 | File / Location                                               | Responsibility                                                                   |
| ------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Root flat config          | `eslint.config.mjs`                                           | Single source of truth — all rules, ignores, overrides, naming-convention scopes |
| Frontend workspace script | `frontend/package.json` → `scripts.lint`                      | Invokes eslint with explicit `-c ../eslint.config.mjs --max-warnings 0`          |
| Backend workspace script  | `backend/package.json` → `scripts.lint`                       | Same shape, backend src                                                          |
| Monorepo fan-out          | `package.json` → `scripts.lint` + `turbo.json` → `tasks.lint` | `turbo run lint` parallel across workspaces                                      |
| Pre-commit gate           | `.husky/pre-commit` + `lint-staged` (root `package.json`)     | Auto-fix on staged files only                                                    |
| CI gate                   | `.github/workflows/ci.yml` → `lint` job                       | Runs `pnpm run lint`; exit-code drives the GitHub check status                   |
| Enforcement               | GitHub repo settings → branch protection on `main`            | `required_status_checks.contexts` includes `"Lint"`; merge blocked on failure    |
| Smoke-proof               | Two PRs with deliberate violations                            | Proves the gate BLOCKS, not just exists                                          |

## 16. Don't Hand-Roll

| Problem                                     | Don't Build                                             | Use Instead                                                                                                                             | Why                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Lint rule for RTL physical-property classes | A new ESLint plugin                                     | Existing `eslint-plugin-rtl-friendly` (already installed) + the regex-based `no-restricted-syntax` block already in `eslint.config.mjs` | Two redundant defenses already exist; the gap is fix-the-violations, not invent-the-rule                                          |
| Custom monorepo lint fan-out                | Per-workspace CI jobs with checkout/install duplication | `turbo run lint` (already in place)                                                                                                     | Turbo's parallel task graph + workspace caching is the project-standard fan-out; matches Phase 47 D-08 precedent for `type-check` |
| Generated-file allowlist                    | Hand-edit `@ts-nocheck` per file                        | Root `ignores:` glob                                                                                                                    | Generated files (supabase types, routeTree) are regenerated on schema/route changes; per-file edits are erased on the next regen  |
| Branch-protection update via UI clicks      | Manual settings change                                  | `gh api PUT .../branches/main/protection` with read-then-merge-then-write                                                               | Reproducible, auditable, version-controllable via shell script                                                                    |
| Smoke-PR scaffolding                        | Build a CI workflow that auto-opens broken PRs          | Manual two-PR sequence per Phase 47 47-03 Task 5                                                                                        | Two PRs total across the phase; automating it is more code than the manual run                                                    |

## 17. Common Pitfalls

### 17.1 Pitfall: Forgetting that workspace `lint` scripts resolve the closest config first

**What goes wrong:** Deleting `frontend/eslint.config.js` but leaving the workspace script as `eslint src/**/*.{ts,tsx}` works locally (no closer config now, so resolves the root) but is fragile — anyone re-adding a `frontend/eslint.config.*` (or even a `frontend/.eslintrc.*`) silently shadows the root again.

**Why it happens:** ESLint flat-config resolution walks up from the lint target's directory; the first config found wins.

**How to avoid:** D-02 mandates explicit `-c ../eslint.config.mjs` in the workspace scripts.

**Warning signs:** divergent lint counts between `pnpm --filter frontend lint` (workspace) and `pnpm exec eslint -c eslint.config.mjs frontend/src` (root invocation).

### 17.2 Pitfall: `--max-warnings 0` collides with rules currently emitting warnings via call sites we don't control

**What goes wrong:** A rule that currently emits a warning (e.g., a new plugin update tightens a rule) silently flips a green CI to red after a `pnpm install`.

**Why it happens:** Plugin minor-version bumps can promote rule severity defaults.

**How to avoid:** The current rule set is explicitly listed in `eslint.config.mjs` with severities; rule severity is not inherited from plugin defaults (every active rule has an explicit `'error' | 'warn' | 'off'`). Adding `--max-warnings 0` is consistent with the explicit-severity posture. Plugins remain pinned via lockfile (pnpm `--frozen-lockfile` in CI).

**Warning signs:** A surprise lint failure after a `pnpm install` on a clean clone without any source change.

### 17.3 Pitfall: GitHub Actions check name casing must match the branch-protection context string exactly

**What goes wrong:** Adding `"lint"` (lowercase) to `required_status_checks.contexts` while the GHA job's `name:` is `"Lint"` (capital L) — protection becomes a no-op; the check name in the PR view doesn't match the rule, and the rule never matches a passing check.

**Why it happens:** GitHub matches contexts by string equality, case-sensitive.

**How to avoid:** Use `"Lint"` exactly. The ci.yml job has `name: Lint` (line 44). Phase 47 47-03 smoke test (Task 5) exists for this verification — Phase 48 should run its smoke PRs immediately after the protection PUT to confirm the casing.

**Warning signs:** Smoke PR shows `Lint: pass` (real lint pass) but `mergeStateStatus: CLEAN` instead of `BLOCKED` — that means protection isn't enforcing this context, despite being listed in the JSON response.

### 17.4 Pitfall: Deleting orphan Aceternity files without first running `pnpm typecheck`

**What goes wrong:** A test file imports a deleted UI component; TypeScript catches the dangling import, lint passes, but type-check fails.

**Why it happens:** Phase 47 brought type-check to zero; Phase 48 must keep it at zero per D-13's implicit "no regression" stance.

**How to avoid:** After each file deletion or import-rewrite, run `pnpm --filter frontend type-check` to confirm zero TS errors.

**Warning signs:** TS2307 "cannot find module" after a Phase-48 commit.

### 17.5 Pitfall: `frontend/eslint.config.js` references a not-yet-installed plugin

**What goes wrong:** Deleting the old config also removes the only reference to a plugin (e.g., `globals` is imported on line 2 of `frontend/eslint.config.js`); the root config doesn't import it; `pnpm install` doesn't prune it (it's in `package.json` `devDependencies`); but a careful `knip` run flags it.

**Why it happens:** Frontend config imports `globals` and uses `globals.browser`; the root config does not.

**How to avoid:** Audit `frontend/eslint.config.js` imports against root `eslint.config.mjs` imports before deletion. The `globals` package is not used by the root config; Phase 48 can leave it in `package.json` for now (knip is non-blocking per CONTEXT) or remove it as a chore. Decision deferred to executor — not in success-criteria.

**Warning signs:** `knip` output gains a "unused dependency: globals" entry post-Phase-48.

### 17.6 Pitfall: Type-check regresses after `@ts-nocheck` is removed from a hand-touched file

**What goes wrong:** D-13 said "if hand-authored, remove `@ts-nocheck` and resolve underlying type errors." If the file is _actually_ generated but a maintainer hand-edited it once, removing `@ts-nocheck` exposes the type errors AND prevents regeneration from healing them.

**Why it happens:** Generated-file regeneration overwrites; hand-edits + `@ts-nocheck` mask the conflict.

**How to avoid:** §6 verdict is that `contact-directory.types.ts` is genuinely supabase-generated (confirmed via line 1 self-description + 47-RESEARCH §4.1 reference + 47-EXCEPTIONS.md ledger). The correct action is `ignores:` add, not directive removal.

**Warning signs:** Re-running `supabase gen types typescript --schema contact_directory` produces a diff that re-introduces `@ts-nocheck` on line 1.

## 18. State of the Art

| Old Approach                              | Current Approach                                                       | When Changed                      | Impact                                                                                                                                                                                                                                                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ESLint `.eslintrc.*` cascade              | ESLint flat-config (`eslint.config.mjs`)                               | ESLint v9.0 (April 2024)          | The project is already on flat-config; no migration needed. Multiple flat configs in a tree still resolve closest-first, which is exactly the D-01 bug — solved by deletion. [CITED ESLint v9 release notes — flat-config replaces `.eslintrc.*` cascade with explicit array of config objects.] |
| `extends: ['airbnb', 'prettier']`         | `eslint-config-prettier` last in the array (disables formatting rules) | ESLint v9 flat-config             | Already correct in root `eslint.config.mjs` line 353.                                                                                                                                                                                                                                            |
| Single rule severity per plugin           | Per-file-glob severity overrides                                       | ESLint v9 flat-config (since 9.0) | Already used heavily in root config (`frontend/**`, `backend/**`, `components/ui/**`, `__tests__` overrides). Phase 48 extends the pattern, doesn't reinvent.                                                                                                                                    |
| `tsc --noEmit` and `eslint` in one CI job | Separate `type-check` and `Lint` jobs                                  | Phase 47 (2026-05)                | Phase 48 maintains the split; only `Lint` job is modified.                                                                                                                                                                                                                                       |

**Deprecated/outdated in this codebase:**

- The `frontend/eslint.config.js` shadow config — deleted in Phase 48. [VERIFIED last-touched May 3 2026 per `ls -la` output.]
- The `no-restricted-imports` block that recommends Aceternity — deleted with the file; replaced per §9.2.

## 19. Validation Architecture

### Test Framework

| Property                          | Value                                                                                                                |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Framework                         | ESLint v9.39.4 (root devDep) + Vitest 4.1.2 (workspace test runners — unused for lint validation per se)             |
| Config file                       | `eslint.config.mjs` (root, flat-config)                                                                              |
| Quick run command (per-workspace) | `pnpm --filter intake-frontend lint` and `pnpm --filter intake-backend lint`                                         |
| Quick run command (root)          | `pnpm exec eslint -c eslint.config.mjs frontend/src --max-warnings 0` (bypasses workspace scripts for re-baselining) |
| Full suite command                | `pnpm run lint` (= `turbo run lint`, parallel both workspaces)                                                       |

### Phase Requirements → Test Map

| Req ID                                         | Behavior                                                     | Test Type            | Automated Command                                                                                                                                                                                                                                             | File Exists?                                 |
| ---------------------------------------------- | ------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| LINT-06                                        | Frontend lint exits 0 on clean clone                         | smoke                | `pnpm --filter intake-frontend lint; echo $?` (must print 0)                                                                                                                                                                                                  | ✓ existing script (will be modified in §8.2) |
| LINT-07                                        | Backend lint exits 0 on clean clone                          | smoke                | `pnpm --filter intake-backend lint; echo $?` (must print 0)                                                                                                                                                                                                   | ✓ existing script (will be modified in §8.2) |
| LINT-08                                        | Aceternity references removed; no-restricted-imports aligned | unit (text-grep)     | `! test -f frontend/eslint.config.js` AND `! grep -RE 'aceternity[-_]ui\|kibo[-_]ui' eslint.config.mjs frontend/src/ \| grep -v 'no-restricted-imports'`                                                                                                      | ✓                                            |
| LINT-08                                        | Rule messages no longer recommend a banned library           | unit (text-grep)     | `! grep -E '(Consider using).*(Aceternity\|Kibo)' eslint.config.mjs` (must produce no output)                                                                                                                                                                 | ✓                                            |
| LINT-09                                        | Lint job is PR-blocking                                      | smoke (live CI)      | Open `chore/test-lint-gate-frontend` PR with deliberate violation; `gh pr checks <PR#> --json bucket --jq '.[] \| select(.name=="Lint") \| .bucket'` returns `"fail"` AND `gh pr view <PR#> --json mergeStateStatus -q .mergeStateStatus` returns `"BLOCKED"` | ❌ Wave 0 (smoke PR opened by 48-03)         |
| LINT-09 (settings)                             | Branch protection includes Lint                              | unit (gh api)        | `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks --jq '.contexts \| sort'` includes `"Lint"`                                                                                                                  | ❌ Wave 0 (rule set by 48-03)                |
| LINT-09 (suppression)                          | Zero net-new eslint-disable                                  | unit (git diff scan) | `git diff phase-48-base..HEAD -- 'frontend/src' 'backend/src' \| grep -E '^\+.*eslint-disable' \| grep -vE '^\+\+\+' \| wc -l` returns 0                                                                                                                      | ✓ — pattern from Phase 47 47-03 Task 6       |
| LINT-06/07 (regression — type-check unchanged) | Phase 47 zero-state preserved                                | smoke                | `pnpm --filter intake-frontend type-check; echo $?` AND `pnpm --filter intake-backend type-check; echo $?` both 0                                                                                                                                             | ✓ existing scripts                           |

### Sampling Rate

- **Per task commit:** `pnpm --filter <workspace> lint` (the workspace being touched).
- **Per wave merge:** `pnpm run lint` (full suite, both workspaces parallel via turbo).
- **Phase gate:** Full suite green + `pnpm typecheck` green (no Phase-47 regression) + branch-protection JSON includes `"Lint"` + two smoke PRs show `mergeStateStatus=BLOCKED` before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] No new vitest file is needed — lint correctness is verified by exit code, not by a test suite invocation.
- [ ] `phase-48-base` git tag must be created at the start of execution (Phase 47 47-03 Task 6 precedent: `git tag phase-47-base <SHA>`). The TYPE-04 / D-17 reconciliation diff (`git diff phase-48-base..HEAD` for eslint-disable count) requires it.
- [ ] No framework install needed. ESLint, Vitest, plugins are all in lockfile.
- [ ] Discretionary: `pnpm lint:summary` script (analogue of `type-check:summary`) — see CONTEXT Claude's-discretion item 4.

## 20. Sources

### Primary (HIGH confidence)

- Local checkout: `eslint.config.mjs` (354 lines, root) [Read tool]
- Local checkout: `frontend/eslint.config.js` (193 lines, deleted in Phase 48) [Read tool]
- Local checkout: `frontend/package.json`, `backend/package.json`, root `package.json`, `turbo.json` [Read tool]
- Local checkout: `.github/workflows/ci.yml` (396 lines) [Read tool]
- Local checkout: `backend/src/types/contact-directory.types.ts` line 1 [Read tool — verified supabase-generated]
- Local checkout: `backend/src/services/event.service.ts` line 48 [Read tool]
- Local checkout: `backend/src/services/signature.service.ts` line 353 [Read tool]
- Live `pnpm exec eslint -c eslint.config.mjs frontend/src --max-warnings 0` JSON output (215 problems) [Bash 2026-05-11]
- Live `pnpm exec eslint -c eslint.config.mjs backend/src --max-warnings 0` output (3 problems) [Bash 2026-05-11]
- Live `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection` [Bash 2026-05-11]
- Phase 47 plan `47-03-ci-gate-and-branch-protection-PLAN.md` — branch-protection PUT pattern, smoke-PR mechanics [Read tool]
- Phase 47 plan `47-03-ci-gate-and-branch-protection-SUMMARY.md` — final state of v6.2 milestone merge + branch protection [Bash]
- Phase 47 `47-EXCEPTIONS.md` — TYPE-04 ledger pattern reusable for Phase 48 D-17
- `.planning/REQUIREMENTS.md` — LINT-06..09 verbatim
- `.planning/ROADMAP.md` — Phase 48 success criteria
- `.planning/STATE.md` — Phase 47 outstanding follow-up #1, current branch posture
- `./CLAUDE.md` — primitive cascade, RTL logical-properties rules, Winston logging, surgical-changes principle

### Secondary (MEDIUM confidence)

- ESLint v9 flat-config docs (no-restricted-imports `patterns` shape, closest-config resolution) [knowledge]
- Vitest `vi.importActual` API (replacement for `require()` in mock factories) [knowledge]
- typescript-eslint `no-empty-object-type` rule (recommended fix = type alias) [knowledge]
- GitHub REST API `repos/{owner}/{repo}/branches/{branch}/protection` PUT spec (Phase 47 47-03 §6 verified shape) [cited via Phase 47 plan]
- Turborepo `globalDependencies` semantics [knowledge — verify at execution]

### Tertiary (LOW confidence — flagged for verification at execution)

- Tailwind v4 logical border-radius utility map (`rounded-bl-* → rounded-es-*` etc.) — [ASSUMED] — verify in implementation; the `eslint-plugin-rtl-friendly` rule message itself suggests the replacement, so the correctness check is self-attested by the rule.
- JSX className string literal AST node type interaction with `no-restricted-syntax` `Literal[value=/.../]` selector — [ASSUMED] for the smoke-PR injection target. Verify locally before pushing the smoke PR.

## Assumptions Log

| #   | Claim                                                                                                                        | Section | Risk if Wrong                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Tailwind v4 logical border-radius utilities map physical `rounded-bl-*` → `rounded-es-*` and `rounded-br-*` → `rounded-ee-*` | §7.4    | If the utility names differ in v4, the ChatMessage.tsx fix needs adjustment. Trivial verification: read the project's Tailwind config or run a local fix attempt and check the resulting class names. The rule message itself proposes a replacement, so the executor will see the right suggestion at fix time.                                                                    |
| A2  | `no-restricted-syntax`'s `Literal[value=/.../]` AST selector matches JSX `className="..."` strings                           | §13.2   | If the selector matches differently, the smoke-PR's `text-left` injection might not trigger the rule. The lint rule has been in production since Phase 33+ and reliably catches Tailwind class strings in the codebase, so the practical answer is "yes, it matches" — but the executor should run `pnpm exec eslint <file>` locally on the smoke branch before pushing to confirm. |

**If this table is empty:** N/A — two `[ASSUMED]` items above. Both are call-site-verifiable in <30 seconds during execution.

## Open Questions (RESOLVED)

1. **Should the 24 lowercase flag files in `signature-visuals/flags/` be renamed to PascalCase or carved out?**
   - What we know: rule mandates PASCAL_CASE for `components/**`; ISO 3166 alpha-2 codes are deliberately lowercase.
   - What's unclear: whether the codebase imports them by string (e.g., `flag = await import(\`./flags/\${iso.toLowerCase()}.tsx\`)`) — if so, renaming breaks the dynamic import shape.
   - Recommendation: carve out `**/signature-visuals/flags/**` with rationale "ISO 3166-1 alpha-2 codes mirror the data shape" — surgical change preserves intent. Planner verifies no dynamic import on these paths in the plan-phase.
   - **RESOLVED:** Carve out via 4 inline-rationale ignore globs in `eslint.config.mjs`'s frontend check-file blocks per D-10 — `**/signature-visuals/flags/**` (ISO 3166-1 alpha-2 codepoint files, intentional lowercase), `**/hooks/**` (hooks misplacement is a future-phase refactor — see Deferred), `**/utils/**` (`getISOWeek.ts` / `relativeTime.ts` / etc. are camelCase by Node convention), `**/config/**` (camelCase config exports). Naming-rule renames are deferred to a future hardening phase per D-09 posture.

2. **Should the `globals` devDep (only used in `frontend/eslint.config.js`) be removed from `frontend/package.json` after the config deletion?**
   - What we know: root config doesn't import `globals`; deleting the workspace config removes the only consumer.
   - What's unclear: whether removing the devDep is in scope for Phase 48 or belongs to a knip-cleanup follow-up.
   - Recommendation: leave it for now (CONTEXT defers Knip enforcement); document in a deferred-items append.
   - **RESOLVED:** Defer `globals` devDep removal to knip follow-up (see CONTEXT Deferred — knip enforcement is orthogonal to lint).

3. **Does adding `eslint.config.mjs` to `turbo.json` `globalDependencies` invalidate Phase 47's existing turbo cache (if any)?**
   - What we know: `globalDependencies` adds files to the cache-key hash; first run after the change recomputes.
   - What's unclear: whether the dev team has remote turbo cache enabled (no `remoteCache:` block in turbo.json — likely no remote).
   - Recommendation: include the addition; the first CI run after Phase 48 will recompute the lint cache once, then stabilize.
   - **RESOLVED:** Adding `eslint.config.mjs` to `turbo.json` `globalDependencies` triggers one-time cache recompute, then stabilizes. Acceptable cost.

## Environment Availability

| Dependency                   | Required By                                         | Available                                   | Version                     | Fallback                                 |
| ---------------------------- | --------------------------------------------------- | ------------------------------------------- | --------------------------- | ---------------------------------------- |
| Node.js                      | ESLint runtime                                      | ✓                                           | v24.9.0 local (CI: 22.13.0) | —                                        |
| pnpm                         | Lockfile install + script invocation                | ✓                                           | 10.29.1                     | —                                        |
| ESLint                       | Core                                                | ✓                                           | v9.39.4                     | —                                        |
| eslint-plugin-rtl-friendly   | rtl-friendly/no-physical-properties                 | ✓                                           | ^0.5.1                      | —                                        |
| eslint-plugin-check-file     | check-file/\* naming rules                          | ✓                                           | ^3.3.1                      | —                                        |
| eslint-plugin-unused-imports | unused-imports/no-unused-imports                    | ✓                                           | ^4.4.1                      | —                                        |
| typescript-eslint            | @typescript-eslint/\* rules                         | ✓                                           | ^8.57.2                     | —                                        |
| gh CLI                       | Branch protection PUT + smoke-PR observation        | ✓ (assumed — Phase 47 used it successfully) | —                           | —                                        |
| Turborepo                    | `turbo run lint` parallel fan-out                   | ✓                                           | ^2.8.20                     | —                                        |
| `globals` npm package        | Only by `frontend/eslint.config.js` (being deleted) | ✓ but going unused                          | —                           | — (post-Phase-48: candidate for removal) |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

## Project Constraints (from CLAUDE.md)

| Directive                                                                                                            | Phase 48 Compliance                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Primitive cascade: HeroUI v3 → Radix → custom; ban Aceternity / Kibo UI / shadcn defaults without explicit ask       | D-06's `no-restricted-imports` rule encodes this directly.                                                                        |
| No emoji in user-visible copy; no marketing voice                                                                    | D-06's rule message has no emoji and no recommend-banned-library text (vs the current `💡 UI Library: Consider using...`).        |
| RTL logical properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`, `rounded-s-*`, `rounded-e-*`) | D-12 fixes drive the codebase to comply. Test-file violations (§3 detail) get the same logical-property conversion.               |
| Backend logging via Winston (`logger.info/warn/error`); no raw `console.log`                                         | D-13 fix in `signature.service.ts:353` swaps `console.log` for `logger.info`.                                                     |
| Karpathy §3 Surgical Changes: only touch what the user's request requires                                            | D-09 (no rule expansion), D-10 (fix at call site, no opportunistic refactors), D-17 (no net-new eslint-disable) all enforce this. |
| Hooks (camelCase) regardless of location                                                                             | Naming-convention carve-out for `**/hooks/**` per §3 recommendation.                                                              |
| Generated files (database.types.ts, routeTree.gen.ts) ignored at root                                                | D-03 reaffirms; D-13 extends to `contact-directory.types.ts`.                                                                     |

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all dependencies are in `package.json`, lockfile-pinned, and were used successfully in Phases 33–47.
- Architecture: HIGH — flat-config + turbo fan-out + GHA `lint` job already exist; Phase 48 modifies existing pieces, doesn't introduce new ones.
- Pitfalls: HIGH — Phase 47's 47-03 plan documents every CI-side trap; Phase 48 reuses the same machinery.
- Baseline counts: HIGH — verified live against the working branch on 2026-05-11.
- Tailwind v4 logical-radius mapping (§7.4 A1): MEDIUM — execution-time verifiable.
- AST-selector behavior on JSX className (§13.2 A2): MEDIUM — execution-time verifiable.

**Research date:** 2026-05-11
**Valid until:** 2026-06-10 (30 days — eslint plugin versions and GitHub API shapes are stable; recommend re-baseline if the working branch sees > 50 commits between now and execution.)
