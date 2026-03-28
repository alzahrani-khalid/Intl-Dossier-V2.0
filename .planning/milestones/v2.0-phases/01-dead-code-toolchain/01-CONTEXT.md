# Phase 1: Dead Code & Toolchain - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove all unused code, files, exports, and dependencies across the monorepo. Consolidate the fragmented ESLint/Prettier toolchain into a single unified configuration. Establish automated quality gates (pre-commit hooks + Knip) that prevent new violations from entering the codebase.

This phase does NOT add new features, fix bugs, or change application behavior. It reduces surface area and enforces consistency so subsequent phases operate on a clean foundation.

</domain>

<decisions>
## Implementation Decisions

### ESLint Consolidation

- **D-01:** Strict from day one — all ESLint rules configured as errors, zero warnings policy. No gradual tightening.
- **D-02:** Merge RTL linting rules (currently in `frontend/.eslintrc.rtl.json`) into the single unified ESLint 9 flat config. No separate RTL config.
- **D-03:** Prettier stays as a separate tool — NOT integrated as ESLint rules. Use `eslint-config-prettier` to disable conflicting ESLint format rules.
- **D-04:** Consolidate 3 Prettier configs (root, frontend, backend) into a single root `.prettierrc`. All workspaces share the same formatting rules.
- **D-05:** All 11 existing ESLint config files (`.eslintrc.js`, `.eslintrc.json`, `eslint.config.js` across root/frontend/backend, plus `frontend/.eslintrc.rtl.json`) replaced by a single root `eslint.config.js` with workspace-specific overrides.

### Dead Code Removal

- **D-06:** Allowlist `components/ui/*.tsx` re-export files in Knip config — these are intentional re-exports for the HeroUI migration pattern and must not be flagged as unused.
- **D-07:** Remove truly dead/unused files. For placeholder services that will be completed in later phases (clearance middleware → Phase 3, MoU notifications, migration tooling), keep the file but mark with clear TODO comments and Knip ignore directives.
- **D-08:** Scan and remove unused i18n translation keys from both EN and AR JSON files. Orphaned keys add confusion and maintenance burden.

### Dependency Updates

- **D-09:** Update all dependencies to latest stable versions. This is the cleanup milestone — best time to modernize before building on top.
- **D-10:** Audit the AI/ML dependency tree (anthropic, openai, langchain, mastra, xenova/transformers). Trace actual imports to determine which libs have real consumers. Remove unused ones, update the rest.
- **D-11:** Keep semver ranges (^) in package.json — do not pin exact versions. pnpm-lock.yaml handles reproducibility.

### Pre-commit Hooks

- **D-12:** Pre-commit hooks run 4 checks: ESLint, Prettier format, TypeScript typecheck (`tsc --noEmit`), and Knip (unused exports).
- **D-13:** All checks block the commit on failure — strict enforcement. Developers can `--no-verify` in emergencies only.
- **D-14:** All checks scoped to staged files only (via lint-staged). Full project checks run in CI. This keeps commit times under 5s.

### Claude's Discretion

- No areas deferred to Claude's discretion — all decisions were made explicitly by the user.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements

- `.planning/REQUIREMENTS.md` §Dead Code & Tooling — Defines TOOL-01 through TOOL-05 acceptance criteria

### Codebase Analysis

- `.planning/codebase/CONCERNS.md` — Tech debt inventory (incomplete services, placeholder middleware, env variable sprawl)
- `.planning/codebase/STACK.md` — Current technology stack and dependency versions

### Project Constraints

- `.planning/PROJECT.md` §Constraints — Tech stack must stay within current stack, no framework migrations, backwards compatibility required
- `.planning/STATE.md` §Blockers/Concerns — "Knip may flag shadcn re-export files as unused — configure allowlist"

### Existing Configuration (to be replaced)

- `.eslintrc.js` (root) — Current root ESLint config
- `backend/.eslintrc.js`, `backend/.eslintrc.json`, `backend/eslint.config.js` — Backend ESLint configs (3 files!)
- `frontend/.eslintrc.js`, `frontend/.eslintrc.json`, `frontend/.eslintrc.rtl.json`, `frontend/eslint.config.js` — Frontend ESLint configs (4 files!)
- `.prettierrc`, `backend/.prettierrc`, `frontend/.prettierrc` — Three Prettier configs
- `.husky/pre-commit` — Existing pre-commit hook (already runs `npx lint-staged`)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Husky + lint-staged:** Already installed and wired (`pre-commit` → `npx lint-staged`). Only needs configuration expansion, not fresh setup.
- **HeroUI re-export pattern:** `components/ui/*.tsx` re-exports from `heroui-*.tsx` — must be preserved and allowlisted in Knip.

### Established Patterns

- **Monorepo with pnpm workspaces:** Root package.json manages workspaces (`frontend/`, `backend/`). ESLint flat config must use workspace-specific overrides.
- **TypeScript strict mode:** Already enabled — `tsc --noEmit` pre-commit check aligns with existing strictness.
- **Turborepo:** Build orchestration via `turbo` — ESLint and Prettier should integrate with turbo pipeline.

### Integration Points

- **11 ESLint configs → 1:** Root `eslint.config.js` replaces all. Must handle: React/JSX (frontend), Node/Express (backend), RTL rules (frontend), TypeScript (both).
- **3 Prettier configs → 1:** Root `.prettierrc` replaces workspace configs. Verify settings are identical before consolidating.
- **lint-staged config:** Currently in `package.json` under `"lint-staged"` key. Needs expansion to include typecheck and Knip.
- **Knip config:** New file (`knip.json` or `knip.ts`) at root. Must configure entry points per workspace and allowlist `components/ui/`.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 01-dead-code-toolchain_
_Context gathered: 2026-03-23_
