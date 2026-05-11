---
phase: 48
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - eslint.config.mjs
  - frontend/eslint.config.js
  - frontend/package.json
  - backend/package.json
  - turbo.json
  - frontend/src/components/ui/3d-card.tsx
  - frontend/src/components/ui/bento-grid.tsx
  - frontend/src/components/ui/floating-navbar.tsx
autonomous: true
requirements: [LINT-08]
must_haves:
  truths:
    - 'The repo has exactly one ESLint flat config — root `eslint.config.mjs`; `frontend/eslint.config.js` no longer exists on disk'
    - '`eslint.config.mjs` contains zero references to Aceternity wrappers or `kibo-ui` recommendations'
    - 'Workspace `lint` scripts invoke ESLint with explicit `-c ../eslint.config.mjs --max-warnings 0`'
    - 'Three orphan Aceternity wrapper files (`3d-card.tsx`, `bento-grid.tsx`, `floating-navbar.tsx`) are removed from `frontend/src/components/ui/`'
    - 'The `phase-48-base` git tag is created on the wave-base SHA so D-17 net-new eslint-disable scan in 48-03 has an anchor'
    - 'Running `pnpm exec eslint -c eslint.config.mjs frontend/src --max-warnings 0` after this plan reports ≤30 problems (post-carve-out baseline, down from 215)'
  artifacts:
    - path: 'eslint.config.mjs'
      provides: 'Single canonical flat config; ignores include `**/contact-directory.types.ts` and `frontend/design-system/inteldossier_handoff_design/**`; frontend override block has inverted `no-restricted-imports` rule banning Aceternity + Kibo UI'
      contains: 'aceternity-ui'
    - path: 'frontend/package.json'
      provides: 'Workspace `lint` script with explicit `-c ../eslint.config.mjs --max-warnings 0` flags'
      pattern: 'eslint -c \\.\\./eslint\\.config\\.mjs --max-warnings 0'
    - path: 'backend/package.json'
      provides: 'Workspace `lint` script with explicit `-c ../eslint.config.mjs --max-warnings 0` flags'
      pattern: 'eslint -c \\.\\./eslint\\.config\\.mjs --max-warnings 0'
    - path: 'turbo.json'
      provides: '`globalDependencies` includes `eslint.config.mjs` so workspace lint cache invalidates on root config changes'
      contains: 'eslint.config.mjs'
    - path: '(git tag) phase-48-base'
      provides: 'Anchor SHA for D-17 net-new eslint-disable diff scan in 48-03'
      verify: 'git rev-parse phase-48-base'
  key_links:
    - from: 'frontend/package.json scripts.lint'
      to: 'eslint.config.mjs (root)'
      via: 'explicit `-c ../eslint.config.mjs` flag'
      pattern: 'eslint -c \\.\\./eslint\\.config\\.mjs'
    - from: 'backend/package.json scripts.lint'
      to: 'eslint.config.mjs (root)'
      via: 'explicit `-c ../eslint.config.mjs` flag'
      pattern: 'eslint -c \\.\\./eslint\\.config\\.mjs'
    - from: '`no-restricted-imports` rule in `eslint.config.mjs` frontend override'
      to: 'CLAUDE.md §"Component Library Strategy" primitive cascade'
      via: 'Banned packages + 4 banned `@/components/ui/*` paths (D-06)'
      pattern: 'aceternity-ui'
phase_decisions_locked:
  D-01_shadow_config_deleted: 'frontend/eslint.config.js is deleted; root eslint.config.mjs is the only ESLint config in the monorepo.'
  D-02_explicit_config_path: 'Workspace lint scripts use explicit `-c ../eslint.config.mjs` — prevents future shadow configs.'
  D-03_ignore_additions: 'Add `frontend/design-system/inteldossier_handoff_design/**` (prototype handoff) and `**/contact-directory.types.ts` (supabase-generated per RESEARCH §6) to root ignores. Existing `**/database.types.ts` and `**/routeTree.gen.ts` stay.'
  D-04_ui_carve_out_preserved: 'Existing `frontend/**/components/ui/**` primitive carve-out (no-restricted-syntax: off, no-explicit-any: off, rtl-friendly/no-physical-properties: off) is byte-unchanged.'
  D-05_D-06_inverted_imports: '`no-restricted-imports` policy inverted: bans Aceternity (`aceternity-ui`, `@aceternity/*`) and Kibo UI (`kibo-ui`, `@kibo-ui/*`) at severity `error` with single shared message "Banned by CLAUDE.md primitive cascade. Use HeroUI v3 → Radix → custom. If no primitive fits, ask before installing." — no emoji.'
  D-07_orphan_deletion: 'Three orphan Aceternity wrapper files deleted (zero importers per RESEARCH §10 grep audit): 3d-card.tsx, bento-grid.tsx, floating-navbar.tsx. floating-action-button.tsx and floating-dock.tsx stay.'
  D-08_link_preview_forward_looking: '`@/components/ui/link-preview` included in banned-paths even though no file exists on disk — preventive.'
  D-09_no_rule_expansion: 'All `TODO(Phase 2+)` disabled rules in root config stay byte-unchanged. No new rules enabled.'
  D-11_max_warnings_zero: '`--max-warnings 0` enforced in per-workspace lint scripts.'
  D-13_contact_directory_provenance: 'contact-directory.types.ts is supabase-generated per file line-1 self-description (RESEARCH §6). Added to ignores; `@ts-nocheck` directive NOT removed.'
  RESEARCH_8_5_tests_carve_out: 'Add `**/__tests__/**` to ignores of every check-file/* block (RESEARCH §3 Path A) to clear the 96 folder-naming violations with inline rationale per D-10.'
  turbo_globalDependencies_addition: 'Add `eslint.config.mjs` to `turbo.json` globalDependencies so workspace lint cache invalidates when root config changes (RESEARCH §11.3 recommendation).'
---

<objective>
Consolidate ESLint configuration to a single source of truth — the root `eslint.config.mjs` — by deleting the `frontend/eslint.config.js` shadow file, inverting the `no-restricted-imports` policy to ban Aceternity / Kibo UI per the CLAUDE.md primitive cascade, deleting three orphan Aceternity wrapper files, adding the prototype handoff and the supabase-generated `contact-directory.types.ts` to the root `ignores:` block, and carving out `**/__tests__/**` from the check-file naming rules (Path A from RESEARCH §3, which clears 96 folder-naming violations and reduces the post-consolidation fix list from 215 to ≤30 call-site edits).

Also establish Phase 48's audit anchor — the `phase-48-base` git tag — and wire `eslint.config.mjs` into `turbo.json` `globalDependencies` so workspace lint caches invalidate when the root config changes.

Purpose: closes LINT-08 in full (no Aceternity references; banned-paths list aligned with CLAUDE.md cascade; rule messages no longer recommend a banned library) and shrinks the violation-fixes surface area that 48-02 must drive to zero.

Output: a single canonical root config; workspace `lint` scripts pinned to it with `--max-warnings 0`; three Aceternity wrappers gone; the `phase-48-base` tag in place; the test naming carve-out applied.
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
@./CLAUDE.md
@eslint.config.mjs
@frontend/eslint.config.js
@frontend/package.json
@backend/package.json
@turbo.json

<interfaces>
<!-- Repo identity (used for branch-protection + audit references in 48-03):
       Owner: alzahrani-khalid
       Name:  Intl-Dossier-V2.0
       Default branch: main

     Root config structural anchor points (eslint.config.mjs):
       - Lines 11–23: ignores array. Add 2 entries.
       - Lines 69–153 approx: frontend override block `files: ['frontend/**/*.{ts,tsx}']`. Add no-restricted-imports rule here.
       - Lines 167–174 approx: existing UI primitive carve-out (frontend/**/components/ui/** — no-restricted-syntax off, no-explicit-any off). Byte-unchanged.
       - Lines 200–223 approx: frontend components check-file/* block. Extend ignores with **/__tests__/** entry.
       - Lines 240–253 / 256–268 / 270–283 / 285–305 / 308–320 / 322–335 / 337–350 approx: other check-file/* blocks. Same **/__tests__/** addition.
       - Lines 46, 58, 76, 78, 81, 83, 85, 88, 90, 183, 185, 187, 189: TODO(Phase 2+) comments — byte-unchanged (D-09).
       - Line 353: `eslintConfigPrettier` last in array — byte-unchanged.

     Donor shape for no-restricted-imports (taken from frontend/eslint.config.js:42–63, being deleted):
       'no-restricted-imports': ['warn', { patterns: [ { group: ['@/components/ui/card'], message: '💡 ...' }, ... ] }]
     Semantics REVERSED per D-05/D-06: severity `error`, no emoji, single shared message, banned (not recommended).

     Frontend workspace lint script BEFORE:  "lint": "eslint src/**/*.{ts,tsx}"
     Frontend workspace lint script AFTER:   "lint": "eslint -c ../eslint.config.mjs --max-warnings 0 src/**/*.{ts,tsx}"

     Backend workspace lint script BEFORE:   "lint": "eslint src/**/*.ts"
     Backend workspace lint script AFTER:    "lint": "eslint -c ../eslint.config.mjs --max-warnings 0 src/**/*.ts"

     turbo.json globalDependencies BEFORE:   ["**/.env.*local"]
     turbo.json globalDependencies AFTER:    ["**/.env.*local", "eslint.config.mjs"]

     Three deletable Aceternity wrappers (zero importers per RESEARCH §10):
       frontend/src/components/ui/3d-card.tsx
       frontend/src/components/ui/bento-grid.tsx
       frontend/src/components/ui/floating-navbar.tsx
     NOT deleted (real importers): floating-action-button.tsx, floating-dock.tsx.

     Pre-consolidation baseline (RESEARCH §3, VERIFIED 2026-05-11):
       pnpm exec eslint -c eslint.config.mjs frontend/src — 215 problems (202 err + 13 warn)
     Post-consolidation expected baseline (after this plan, BEFORE 48-02 call-site fixes):
       - 96 folder-naming errors collapse via **/__tests__/** carve-out
       - 12 require-imports + 8 no-restricted-syntax + 9 unused-disable + 4 rtl-friendly + 1 unused-import remain → ~34 frontend
       - Plus the residual hooks-naming / lib-naming / flag-files cluster (~45 errors) that 48-02 handles via further carve-outs or renames
     Backend baseline (RESEARCH §4): 3 errors. 1 of the 3 (`contact-directory.types.ts:1`) clears via the new ignore entry in this plan; 2 errors remain for 48-02.

-->
</interfaces>
</context>

<threat_model>

## Trust Boundaries

| Boundary                                  | Description                                                                                                                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Root config → workspace lint runs         | A misconfigured `ignores:` entry could silently mask production source files from linting; a misconfigured `no-restricted-imports` rule could fail to ban what CLAUDE.md bans. |
| Deleted shadow config → IDE / lint-staged | Some tooling resolves the closest config; deletion must not orphan an unreplaceable consumer. RESEARCH §8.1 verified no tooling reference exists outside `.planning/` docs.    |

## STRIDE Threat Register

| Threat ID | Category               | Component                                                                                                                                                                      | Disposition | Mitigation Plan                                                                                                                                                                                                                                                                                                                       |
| --------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-48-01   | Tampering              | Inverted `no-restricted-imports` rule could be bypassed by a deep relative import (e.g., `../../../components/ui/3d-card`)                                                     | mitigate    | The three orphan wrapper files are physically deleted in this same plan (D-07). The rule covers `@/components/ui/3d-card` (alias) plus the file is gone, so a relative path can't resolve either. For belt-and-suspenders, use `group: ['@/components/ui/3d-card', '@/components/ui/3d-card/*']` so any deep alias path also matches. |
| T-48-04   | Information disclosure | `frontend/design-system/inteldossier_handoff_design/**` being added to `ignores:` could mask a real production bug if the prototype were ever imported from the app at runtime | accept      | Per `CLAUDE.md §"Visual Design Source of Truth"`, the handoff is **reference material, not production code**. It is not bundled by Vite (no entry chains into it). The ignore matches the project's stated stance; risk is documented and accepted.                                                                                   |

</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: Create phase-48-base git tag (audit anchor for D-17 scan)</name>
  <files>(no files; git tag operation)</files>
  <read_first>
    - .planning/phases/47-type-check-zero/47-01-frontend-type-fix-PLAN.md Task 1 step 0 (`phase-47-base` precedent at lines 171–177)
    - .planning/phases/48-lint-config-alignment/48-PATTERNS.md §"Phase-base git tag for diff audits"
    - .planning/phases/48-lint-config-alignment/48-RESEARCH.md §19 Wave 0 Gaps
  </read_first>
  <action>
    Capture the current HEAD as `phase-48-base` so 48-03 Task "D-17 net-new eslint-disable scan" has a stable diff anchor. Run the idempotent guard so re-running the task is safe.

    Steps:
    1. Verify current branch is the working branch where Phase 48 will land (DesignV2 per STATE.md).
    2. Idempotent tag creation: `git rev-parse phase-48-base 2>/dev/null || git tag phase-48-base $(git rev-parse HEAD)`
    3. Push tag to origin idempotently: `git push origin phase-48-base 2>/dev/null || true`
    4. Verify the tag resolves to a valid SHA: `git rev-parse phase-48-base`

    Do not push any other refs; this is a tag-only operation.

  </action>
  <verify>
    <automated>
      git rev-parse phase-48-base
    </automated>
  </verify>
  <acceptance_criteria>
    - `git rev-parse phase-48-base` exits 0 and prints a 40-character SHA.
    - The tag points at HEAD of the working branch at the start of Phase 48 (verified via `git rev-parse HEAD == git rev-parse phase-48-base` at tag-creation time).
    - Re-running step 2 of the action does not error (idempotent — `|| git tag` short-circuits).
  </acceptance_criteria>
  <done>`phase-48-base` git tag exists locally and on origin; 48-03's D-17 audit has its anchor.</done>
</task>

<task type="auto">
  <name>Task 2: Consolidate ESLint config — delete shadow, update root, update workspace scripts, update turbo.json</name>
  <files>
    eslint.config.mjs,
    frontend/eslint.config.js,
    frontend/package.json,
    backend/package.json,
    turbo.json
  </files>
  <read_first>
    - eslint.config.mjs (entire file, currently 354 lines) — anchor points listed in `<interfaces>` block
    - frontend/eslint.config.js (entire file, currently 193 lines) — being deleted; lines 42–63 are the donor JSON shape for the inverted `no-restricted-imports` rule
    - frontend/package.json — `scripts.lint` (current line ~17)
    - backend/package.json — `scripts.lint` (current line ~13)
    - turbo.json — `globalDependencies` (current line 3) and `tasks.lint` (current lines 19–21)
    - .planning/phases/48-lint-config-alignment/48-RESEARCH.md §8 (Config Consolidation Plan), §9 (no-restricted-imports shape), §11.3 (turbo globalDependencies)
    - .planning/phases/48-lint-config-alignment/48-PATTERNS.md §"eslint.config.mjs (root, modify)", §"frontend/package.json", §"backend/package.json", §"turbo.json globalDependencies"
    - .planning/phases/48-lint-config-alignment/48-CONTEXT.md D-01, D-02, D-03, D-05, D-06, D-08, D-11, D-13
  </read_first>
  <action>
    Apply six concrete edits in a single atomic commit. All identifiers, paths, and rule names below are verbatim — copy them, do not paraphrase.

    **Edit 1 — Delete the shadow frontend config (D-01):**
    Run `git rm frontend/eslint.config.js`. Confirm no `.vscode/settings.json`, `.idea/`, `package.json`, or `pnpm-lock.yaml` references the file before deleting (RESEARCH §8.1 verified zero references; re-verify with `grep -rEl "frontend/eslint\\.config" --include='*.{json,js,mjs,yml,yaml,md}' . | grep -v '^\\./\\.planning/' | grep -v '^\\./frontend/eslint\\.config\\.js$'` — must return empty).

    **Edit 2 — Extend root `ignores:` array (D-03 + D-13):**
    In `eslint.config.mjs`, inside the existing `ignores:` array (currently lines 13–23 with entries `**/dist/**`, `**/node_modules/**`, `**/coverage/**`, `specs/**`, `**/*.generated.*`, `**/database.types.ts`, `**/routeTree.gen.ts`, `.husky/**`, `**/.!*`), add exactly these two new entries, each with a trailing inline rationale comment per D-10:
    - `'**/contact-directory.types.ts',` with comment `// D-13: supabase-generated per file line-1 self-description; regenerated by supabase gen types`
    - `'frontend/design-system/inteldossier_handoff_design/**',` with comment `// D-03: IntelDossier prototype handoff is visual reference per CLAUDE.md, not production code`

    **Edit 3 — Insert inverted `no-restricted-imports` rule (D-05 + D-06 + D-08):**
    In `eslint.config.mjs`, inside the frontend override block (the one whose `files:` value starts with `'frontend/**/*.{ts,tsx}'`, currently around lines 69–153), add a new rule entry `'no-restricted-imports'` set at severity `'error'` with a single `patterns` array containing one `{ group, message }` object. The `group` array MUST contain exactly these 8 specifiers in this order: `'aceternity-ui'`, `'@aceternity/*'`, `'kibo-ui'`, `'@kibo-ui/*'`, `'@/components/ui/3d-card'`, `'@/components/ui/bento-grid'`, `'@/components/ui/floating-navbar'`, `'@/components/ui/link-preview'`. The `message` MUST be the verbatim D-06 string: `Banned by CLAUDE.md primitive cascade. Use HeroUI v3 → Radix → custom. If no primitive fits, ask before installing.` (No emoji. No per-path bespoke messages. Single shared message.) Place a 2-line comment block above the rule: `// CLAUDE.md primitive cascade (HeroUI v3 → Radix → custom).` and `// Aceternity and Kibo UI are banned without explicit user request (D-05/D-06).`

    Local `@/components/kibo-ui/*` paths are NOT banned — RESEARCH §9.2 confirmed these are internal repo primitives, not the upstream npm package. Leave them importable.

    **Edit 4 — Extend `**/__tests__/**` carve-out across all check-file/* blocks (RESEARCH §3 Path A + §8.5):**
    For every block in `eslint.config.mjs` that has `plugins: { 'check-file': checkFile }` and a `files:` glob targeting production source (frontend `components/**`, frontend `hooks/**`, frontend `types/**`, frontend `lib/**`, backend `services/**`, backend `models/**`, backend `api/**`, backend `middleware/**`), add `'**/__tests__/**'` to that block's `ignores:` array if not already present. The existing frontend components block (~lines 200–223) already has `'frontend/src/components/__tests__/**'` and `'frontend/src/components/**/index.ts'`; add the global `'**/__tests__/**'` entry alongside. Each addition gets the inline rationale comment per D-10: `// __tests__ is vitest convention; PascalCase rule applies to production source, not test colocation.` This carve-out collapses the 96 folder-naming-convention errors from the baseline.

    **Edit 5 — Update workspace `lint` scripts (D-02 + D-11):**
    - In `frontend/package.json`, change the `scripts.lint` value from `"eslint src/**/*.{ts,tsx}"` to `"eslint -c ../eslint.config.mjs --max-warnings 0 src/**/*.{ts,tsx}"`.
    - In `backend/package.json`, change the `scripts.lint` value from `"eslint src/**/*.ts"` to `"eslint -c ../eslint.config.mjs --max-warnings 0 src/**/*.ts"`.

    Do NOT modify the root `package.json` `lint` script (`turbo run lint`) — that script delegates to the workspace scripts via turbo and is already correct.

    Discretionary (per CONTEXT Claude's-discretion item 4): you MAY add a `lint:summary` script next to the existing `type-check:summary` in each workspace's `package.json` using the pattern `"eslint -c ../eslint.config.mjs src/**/*.{ts,tsx} 2>&1 | grep -oE '[a-z-]+/[a-z-]+' | sort | uniq -c | sort -rn || true"` (frontend) and the `.ts`-only equivalent for backend. Useful for warning burn-down audits in 48-02; not required.

    **Edit 6 — Add `eslint.config.mjs` to `turbo.json` globalDependencies (RESEARCH §11.3):**
    In `turbo.json`, change the `globalDependencies` value from `["**/.env.*local"]` to `["**/.env.*local", "eslint.config.mjs"]`. Do not modify `tasks.lint` or any other field.

    **Do NOT touch:**
    - The existing `frontend/**/components/ui/**` primitive carve-out (D-04 byte-unchanged).
    - Any `TODO(Phase 2+)` comment (D-09).
    - Any rule severity not explicitly named above.
    - `eslintConfigPrettier` last-in-array position.
    - `turbo.json` `tasks.lint.outputs`.
    - Any source code outside `eslint.config.mjs`, the two `package.json` files, and `turbo.json`.

    Commit all edits + the `git rm` together in a single commit: `chore(48-01): consolidate ESLint to root config; invert no-restricted-imports`.

  </action>
  <verify>
    <automated>
      test ! -f frontend/eslint.config.js
      grep -c "'\\*\\*/contact-directory\\.types\\.ts'" eslint.config.mjs
      grep -c "'frontend/design-system/inteldossier_handoff_design" eslint.config.mjs
      grep -c "'aceternity-ui'" eslint.config.mjs
      grep -c "'kibo-ui'" eslint.config.mjs
      grep -c "'@/components/ui/link-preview'" eslint.config.mjs
      grep -c "Banned by CLAUDE.md primitive cascade" eslint.config.mjs
      grep -cE "Consider using|Aceternity|💡" eslint.config.mjs
      grep -cE "eslint -c \\.\\./eslint\\.config\\.mjs --max-warnings 0" frontend/package.json
      grep -cE "eslint -c \\.\\./eslint\\.config\\.mjs --max-warnings 0" backend/package.json
      grep -c "eslint.config.mjs" turbo.json
      grep -c "'\\*\\*/__tests__/\\*\\*'" eslint.config.mjs
    </automated>
  </verify>
  <acceptance_criteria>
    - `test ! -f frontend/eslint.config.js` exits 0 (file deleted).
    - `grep -c "'\\*\\*/contact-directory\\.types\\.ts'" eslint.config.mjs` returns 1.
    - `grep -c "'frontend/design-system/inteldossier_handoff_design" eslint.config.mjs` returns 1.
    - `grep -c "'aceternity-ui'" eslint.config.mjs` returns 1 (the package ban in `no-restricted-imports`).
    - `grep -c "'kibo-ui'" eslint.config.mjs` returns 1.
    - `grep -c "'@/components/ui/link-preview'" eslint.config.mjs` returns 1.
    - `grep -c "Banned by CLAUDE.md primitive cascade" eslint.config.mjs` returns 1 (single shared message).
    - `grep -cE "Consider using|💡" eslint.config.mjs` returns 0 (no recommend-banned-library messaging, no emoji per CLAUDE.md voice rules).
    - `grep -cE "eslint -c \\.\\./eslint\\.config\\.mjs --max-warnings 0" frontend/package.json` returns 1.
    - `grep -cE "eslint -c \\.\\./eslint\\.config\\.mjs --max-warnings 0" backend/package.json` returns 1.
    - `grep -c "eslint.config.mjs" turbo.json` returns 1 (the new `globalDependencies` entry).
    - `grep -c "'\\*\\*/__tests__/\\*\\*'" eslint.config.mjs` returns ≥1 (the new test-folder carve-out — exact count depends on how many check-file blocks you extended; minimum 1 in the frontend components block).
    - `pnpm exec eslint -c eslint.config.mjs --print-config frontend/src/App.tsx 2>&1 | grep -E '"no-restricted-imports"' | head -1` produces output containing `"aceternity-ui"` (rule is active on frontend sources).
    - `pnpm exec eslint -c eslint.config.mjs backend/src/types/contact-directory.types.ts 2>&1` produces no error output OR output contains `"ignored"`/`"ignore"` (file is now matched by `ignores:` — backend lint stops emitting the `@ts-nocheck` ban-ts-comment error from this file).
  </acceptance_criteria>
  <done>Root config is the single source of truth, ignores the prototype handoff and contact-directory.types.ts, bans Aceternity / Kibo UI / 4 banned paths; workspace lint scripts pin the root config with --max-warnings 0; turbo invalidates lint cache on root-config changes; the test-folder carve-out is active.</done>
</task>

<task type="auto">
  <name>Task 3: Delete three orphan Aceternity wrapper files (D-07)</name>
  <files>
    frontend/src/components/ui/3d-card.tsx,
    frontend/src/components/ui/bento-grid.tsx,
    frontend/src/components/ui/floating-navbar.tsx
  </files>
  <read_first>
    - .planning/phases/48-lint-config-alignment/48-CONTEXT.md D-07
    - .planning/phases/48-lint-config-alignment/48-RESEARCH.md §10 (Orphan Aceternity Wrapper Deletion — importer audit VERIFIED 2026-05-11 returns zero JSX/TS importers)
    - .planning/phases/48-lint-config-alignment/48-PATTERNS.md §"Orphan Aceternity wrapper deletions"
    - frontend/src/components/ui/COMPONENT_REGISTRY.md (informational markdown that mentions these wrappers; not a source import — but it should be updated to reflect the deletion)
  </read_first>
  <action>
    Re-verify no source-code importers before deleting (defense against drift since 2026-05-11 audit):

    1. Run `grep -rE "from ['\"]@/components/ui/(3d-card|bento-grid|floating-navbar)['\"]" frontend/src --include='*.ts' --include='*.tsx'`. Expected output: empty (zero matches). If ANY match exists, STOP — coordinate with the orchestrator before deleting; a real importer would require a callsite migration before the deletion lands.
    2. Run `grep -rE "from ['\"]\\.\\.+(\\/)*ui/(3d-card|bento-grid|floating-navbar)['\"]" frontend/src --include='*.ts' --include='*.tsx'`. Expected: empty (zero relative-path importers).
    3. Delete the three files with `git rm`:
       - `git rm frontend/src/components/ui/3d-card.tsx`
       - `git rm frontend/src/components/ui/bento-grid.tsx`
       - `git rm frontend/src/components/ui/floating-navbar.tsx`
    4. If `frontend/src/components/ui/COMPONENT_REGISTRY.md` mentions any of the three by name, remove those rows (or strike through with an inline `(deleted in Phase 48 per CONTEXT D-07)` note). This is the only non-deletion edit allowed in this task.
    5. Confirm type-check still passes (Phase 47 zero-state preservation; RESEARCH §17.4 pitfall): `pnpm --filter frontend type-check; echo "exit=$?"` MUST print `exit=0`.

    Do NOT delete `floating-action-button.tsx` (imported by `frontend/src/pages/forums/ForumsPage.tsx` per RESEARCH §10) or `floating-dock.tsx` (not in D-07 list).

    Commit message: `chore(48-01): delete orphan Aceternity wrappers per D-07 (zero importers verified)`.

  </action>
  <verify>
    <automated>
      test ! -f frontend/src/components/ui/3d-card.tsx
      test ! -f frontend/src/components/ui/bento-grid.tsx
      test ! -f frontend/src/components/ui/floating-navbar.tsx
      test -f frontend/src/components/ui/floating-action-button.tsx
      test -f frontend/src/components/ui/floating-dock.tsx
      grep -rE "from ['\"]@/components/ui/(3d-card|bento-grid|floating-navbar)['\"]" frontend/src --include='*.ts' --include='*.tsx' | wc -l
      pnpm --filter frontend type-check 2>&1 | tail -3
    </automated>
  </verify>
  <acceptance_criteria>
    - `test ! -f frontend/src/components/ui/3d-card.tsx` exits 0.
    - `test ! -f frontend/src/components/ui/bento-grid.tsx` exits 0.
    - `test ! -f frontend/src/components/ui/floating-navbar.tsx` exits 0.
    - `test -f frontend/src/components/ui/floating-action-button.tsx` exits 0 (NOT deleted — real importer exists).
    - `test -f frontend/src/components/ui/floating-dock.tsx` exits 0 (NOT deleted — not in D-07 list).
    - `grep -rE "from ['\"]@/components/ui/(3d-card|bento-grid|floating-navbar)['\"]" frontend/src --include='*.ts' --include='*.tsx' | wc -l` returns 0.
    - `pnpm --filter frontend type-check` exits 0 (Phase 47 zero-state preserved; no TS2307 cannot-find-module errors introduced).
  </acceptance_criteria>
  <done>Three orphan Aceternity wrapper files removed from the working tree; type-check still at zero.</done>
</task>

<task type="auto">
  <name>Task 4: Re-baseline lint against root config and confirm post-consolidation surface ≤30 problems</name>
  <files>(no files; verification only — output captured to ephemeral /tmp paths)</files>
  <read_first>
    - .planning/phases/48-lint-config-alignment/48-RESEARCH.md §1 (post-consolidation expected baseline ~30 frontend + 2 backend errors after the test-folder carve-out clears 96 + 1 backend ignore clears 1), §3 (rule histogram), §4 (backend baseline)
    - .planning/phases/48-lint-config-alignment/48-VALIDATION.md per-task verification map
  </read_first>
  <action>
    Run lint against the consolidated root config and capture the histogram so 48-02 has a precise fix list.

    1. Run frontend lint via the new workspace script and capture full output:
       ```
       pnpm --filter intake-frontend lint > /tmp/48-01-frontend-lint.txt 2>&1; echo "exit=$?" >> /tmp/48-01-frontend-lint.txt
       ```
       Expected: non-zero exit (still ~30 problems before 48-02 fixes), but specifically:
       - 0 folder-naming errors (the `**/__tests__/**` carve-out cleared the 96 from RESEARCH §3).
       - 0 errors referencing `3d-card.tsx`, `bento-grid.tsx`, or `floating-navbar.tsx` (files no longer exist).
       - The residual histogram should be dominated by: `@typescript-eslint/no-require-imports` (~12), `no-restricted-syntax` (~8), `rtl-friendly/no-physical-properties` (~4 warnings), `Unused eslint-disable directive` (~9 warnings), `unused-imports/no-unused-imports` (~1), plus a residual cluster of filename-naming-convention errors from hooks/lib/flags files that 48-02 will address.
    2. Run backend lint and capture:
       ```
       pnpm --filter intake-backend lint > /tmp/48-01-backend-lint.txt 2>&1; echo "exit=$?" >> /tmp/48-01-backend-lint.txt
       ```
       Expected: still non-zero exit (2 errors remaining: `event.service.ts:48` empty interface, `signature.service.ts:353` console.log). The `contact-directory.types.ts:1` @ts-nocheck error should be gone (file is now in `ignores:`).
    3. Extract the rule histogram from frontend output for 48-02 sizing:
       ```
       grep -oE '[a-z@][a-z0-9@/_-]+/[a-z0-9@/_-]+' /tmp/48-01-frontend-lint.txt | sort | uniq -c | sort -rn > /tmp/48-01-frontend-histogram.txt
       cat /tmp/48-01-frontend-histogram.txt
       ```
    4. Compute the problem-count delta against RESEARCH §3 baseline (215 problems) and assert the reduction:
       ```
       grep -cE 'error|warning' /tmp/48-01-frontend-lint.txt
       ```

    No source edits in this task. The histogram + counts are inputs to 48-02 planning.

  </action>
  <verify>
    <automated>
      test -f /tmp/48-01-frontend-lint.txt
      test -f /tmp/48-01-backend-lint.txt
      grep -cE 'folder-naming-convention' /tmp/48-01-frontend-lint.txt
      grep -cE '3d-card\\.tsx|bento-grid\\.tsx|floating-navbar\\.tsx' /tmp/48-01-frontend-lint.txt
      grep -cE 'contact-directory\\.types\\.ts.*ban-ts-comment' /tmp/48-01-backend-lint.txt
    </automated>
  </verify>
  <acceptance_criteria>
    - `/tmp/48-01-frontend-lint.txt` exists and contains lint output for the frontend run.
    - `/tmp/48-01-backend-lint.txt` exists and contains lint output for the backend run.
    - `grep -cE 'folder-naming-convention' /tmp/48-01-frontend-lint.txt` returns 0 (the 96 folder-naming errors are gone — RESEARCH §3 Path A carve-out worked).
    - `grep -cE '3d-card\\.tsx|bento-grid\\.tsx|floating-navbar\\.tsx' /tmp/48-01-frontend-lint.txt` returns 0 (orphan files cannot show up in lint output because they don't exist).
    - `grep -cE 'contact-directory\\.types\\.ts.*ban-ts-comment' /tmp/48-01-backend-lint.txt` returns 0 (file is now ignored).
    - The total frontend problem count (errors + warnings) reported in `/tmp/48-01-frontend-lint.txt` is strictly less than 215 (the RESEARCH §3 pre-consolidation baseline). Documented expected range: 25–50 (depends on whether the discretionary hooks/lib/flags carve-outs were applied in Task 2's Edit 4 scope; the planner's recommendation in RESEARCH §3 is to apply them, in which case the count drops below 35).
    - The backend problem count is exactly 2 (errors remaining: `event.service.ts:48` empty-interface, `signature.service.ts:353` no-console).
  </acceptance_criteria>
  <done>Post-consolidation lint baseline captured; 48-02 has a precise per-rule histogram to drive call-site fixes against.</done>
</task>

</tasks>

<verification>
After all tasks complete:
- `git rev-parse phase-48-base` returns a SHA (anchor for 48-03 D-17 scan).
- `frontend/eslint.config.js` does not exist; the only ESLint config in the repo is `eslint.config.mjs`.
- The root config bans Aceternity (`aceternity-ui`, `@aceternity/*`) and Kibo UI (`kibo-ui`, `@kibo-ui/*`) plus 4 banned paths via `no-restricted-imports: ['error', ...]`.
- No "Consider using ... Aceternity" or `💡` messages remain in any config file (grep returns 0).
- Workspace lint scripts use `eslint -c ../eslint.config.mjs --max-warnings 0`.
- `turbo.json` globalDependencies includes `eslint.config.mjs`.
- Three orphan Aceternity wrapper files are deleted; `floating-action-button.tsx` and `floating-dock.tsx` are preserved.
- `pnpm --filter frontend type-check` and `pnpm --filter backend type-check` both exit 0 (Phase 47 zero-state preserved).
- Backend lint surface reduced from 3 errors to 2 (contact-directory.types.ts cleared via ignore).
- Frontend lint surface reduced from 215 problems to a smaller residual (target ≤50; expected ~30 after RESEARCH §3 carve-outs).
</verification>

<success_criteria>

- LINT-08 success criterion (from ROADMAP):
  - `frontend/eslint.config.js` contains zero references to Aceternity (`3d-card`, `bento-grid`, `floating-navbar`, `link-preview`) — TRUE BY DELETION.
  - `no-restricted-imports` is aligned with the CLAUDE.md primitive cascade (HeroUI v3 → Radix → custom).
  - Rule messages no longer recommend a banned library.
- All four conditions verified by grep assertions in Task 2 acceptance criteria.
- The post-consolidation lint baseline (≤50 problems frontend, 2 backend) is captured and gives 48-02 a precise fix list.
- Phase 47 type-check zero-state is preserved (no TS regressions from file deletions or config changes).
  </success_criteria>

<output>
After completion, create `.planning/phases/48-lint-config-alignment/48-01-SUMMARY.md` recording:
- The exact post-consolidation frontend + backend lint counts (errors + warnings).
- The residual per-rule histogram captured in `/tmp/48-01-frontend-histogram.txt`.
- Confirmation that the `phase-48-base` tag exists on origin.
- Confirmation that `frontend/eslint.config.js` is deleted and the root config holds the inverted `no-restricted-imports` rule.
- Any deviations from the planned edits (e.g., the discretionary hooks/lib/flags carve-outs applied or skipped) with rationale.
</output>
