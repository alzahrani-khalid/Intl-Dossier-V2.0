# Phase 1: Dead Code & Toolchain - Research

**Researched:** 2026-03-23
**Domain:** Build toolchain consolidation, dead code removal, dependency hygiene
**Confidence:** HIGH

## Summary

The codebase has significant toolchain fragmentation: 8 ESLint config files across 3 formats (legacy `.eslintrc.js`, `.eslintrc.json`, and flat `eslint.config.js`), 3 divergent Prettier configs (root uses `semi: true` while workspaces use `semi: false`), and ESLint version splits (root on v9.37, workspaces on v8.57). The lint-staged pre-commit hook only runs Prettier (no ESLint, no typecheck, no Knip). Knip is not installed at all.

The consolidation path is clear: a single root `eslint.config.js` using ESLint 9 flat config with `typescript-eslint` v8's `projectService` (eliminates per-workspace tsconfig parser config), Prettier as a standalone formatter (remove `eslint-plugin-prettier`, keep `eslint-config-prettier`), and Knip for dead code detection with workspace-aware configuration. ESLint 10 was released (Feb 2026) but `eslint-plugin-react-hooks` v7 does not declare ESLint 10 in peerDependencies, making ESLint 9 the safe target that remains forward-compatible.

A critical discovery: `eslint-plugin-tailwindcss` v3.18.2 only supports Tailwind v3 in its peerDependencies, but this project uses Tailwind v4. The plugin should be removed from the consolidated config. RTL enforcement is better handled through the existing `no-restricted-syntax` rules (already proven in the frontend flat config) which do not depend on any Tailwind plugin.

**Primary recommendation:** Consolidate to a single root ESLint 9 flat config using `typescript-eslint` v8 with `projectService`, remove `eslint-plugin-tailwindcss` (incompatible with Tailwind v4), install Knip v6 for dead code detection, and expand lint-staged to run ESLint + Prettier + typecheck + Knip on staged files.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Strict from day one -- all ESLint rules configured as errors, zero warnings policy. No gradual tightening.
- **D-02:** Merge RTL linting rules (currently in `frontend/.eslintrc.rtl.json`) into the single unified ESLint 9 flat config. No separate RTL config.
- **D-03:** Prettier stays as a separate tool -- NOT integrated as ESLint rules. Use `eslint-config-prettier` to disable conflicting ESLint format rules.
- **D-04:** Consolidate 3 Prettier configs (root, frontend, backend) into a single root `.prettierrc`. All workspaces share the same formatting rules.
- **D-05:** All 11 existing ESLint config files replaced by a single root `eslint.config.js` with workspace-specific overrides.
- **D-06:** Allowlist `components/ui/*.tsx` re-export files in Knip config -- these are intentional re-exports for the HeroUI migration pattern and must not be flagged as unused.
- **D-07:** Remove truly dead/unused files. For placeholder services that will be completed in later phases (clearance middleware -> Phase 3, MoU notifications, migration tooling), keep the file but mark with clear TODO comments and Knip ignore directives.
- **D-08:** Scan and remove unused i18n translation keys from both EN and AR JSON files.
- **D-09:** Update all dependencies to latest stable versions.
- **D-10:** Audit the AI/ML dependency tree. Trace actual imports to determine which libs have real consumers. Remove unused ones, update the rest.
- **D-11:** Keep semver ranges (^) in package.json -- do not pin exact versions.
- **D-12:** Pre-commit hooks run 4 checks: ESLint, Prettier format, TypeScript typecheck (`tsc --noEmit`), and Knip (unused exports).
- **D-13:** All checks block the commit on failure -- strict enforcement.
- **D-14:** All checks scoped to staged files only (via lint-staged). Full project checks run in CI.

### Claude's Discretion

No areas deferred to Claude's discretion -- all decisions were made explicitly by the user.

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                         | Research Support                                                                                                                                                  |
| ------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TOOL-01 | Knip scan removes all unused files, exports, and dependencies across monorepo                       | Knip v6.0.2 with workspace-aware config; allowlist for `components/ui/` re-exports; placeholder services get `@knip-ignore` directives                            |
| TOOL-02 | ESLint 9 flat config consolidates root/frontend/backend into single config with workspace overrides | Single root `eslint.config.js` using `typescript-eslint` v8 `projectService`; RTL rules via `no-restricted-syntax`; remove Tailwind plugin (incompatible with v4) |
| TOOL-03 | husky + lint-staged enforces lint/format rules on every commit automatically                        | Husky 9.1.7 already installed; expand lint-staged from Prettier-only to ESLint + Prettier + typecheck + Knip on staged files                                      |
| TOOL-04 | All unused npm dependencies removed (verified by Knip report showing zero unused)                   | Knip dependency analysis + manual AI/ML tree audit (D-10); remove `eslint-plugin-prettier`, stale workspace ESLint packages                                       |
| TOOL-05 | All stack dependencies updated to latest stable versions compatible with current toolchain          | Stay ESLint 9 (react-hooks plugin blocks ESLint 10); update typescript-eslint to v8 unified package; update all others to latest stable                           |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **RTL enforcement is mandatory**: All `ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right`, `left-*`, `right-*`, `rounded-l-*`, `rounded-r-*`, `border-l-*`, `border-r-*` must be caught by ESLint as errors
- **Semicolons off** (`"semi": false`), trailing commas all, single quotes -- this is the Prettier standard
- **No explicit `any`**: Must be error-level in ESLint
- **Explicit return types**: Required on functions
- **No floating promises**: Error-level
- **No unused vars**: Error-level
- **Console usage**: Warn, allow `console.warn()` and `console.error()`
- **HeroUI re-export pattern must be preserved**: `components/ui/*.tsx` re-exports from `heroui-*.tsx`
- **pnpm only**: Package manager enforced via `preinstall` script
- **Turborepo**: Build orchestration via `turbo` -- lint should integrate with turbo pipeline

## Standard Stack

### Core Tools

| Tool              | Current Version                     | Target Version    | Purpose                | Why Standard                                              |
| ----------------- | ----------------------------------- | ----------------- | ---------------------- | --------------------------------------------------------- |
| ESLint            | 9.37.0 (root) / 8.57.1 (workspaces) | 9.37.0+ (stay v9) | Linting                | v9 flat config; v10 blocked by react-hooks plugin peerDep |
| typescript-eslint | 7.18.0 (workspaces) / 8.46.1 (root) | 8.57.1 (unified)  | TS linting             | v8 `projectService` eliminates monorepo parser config     |
| Prettier          | 3.6.2                               | 3.6.2 (current)   | Formatting             | Already latest stable                                     |
| Knip              | not installed                       | 6.0.2             | Dead code detection    | First-class pnpm workspace support                        |
| husky             | 9.1.7                               | 9.1.7 (current)   | Git hooks              | Already latest stable                                     |
| lint-staged       | 16.2.1                              | 16.4.0            | Staged file processing | Minor update available                                    |

### ESLint Plugins (Target)

| Plugin                       | Target Version | Purpose                    | ESLint 9 Compat   |
| ---------------------------- | -------------- | -------------------------- | ----------------- |
| eslint-config-prettier       | 10.1.8         | Disable formatting rules   | YES (>=7)         |
| eslint-plugin-react-hooks    | 7.0.1          | React hooks rules          | YES (up to ^9)    |
| eslint-plugin-react-refresh  | 0.5.2          | Fast refresh validation    | YES (^9, ^10)     |
| eslint-plugin-unused-imports | 4.4.1          | Auto-remove unused imports | YES (^8, ^9, ^10) |

### Plugins to REMOVE

| Plugin                                | Reason                                                     |
| ------------------------------------- | ---------------------------------------------------------- |
| eslint-plugin-prettier                | D-03: Prettier as separate tool, not ESLint rules          |
| eslint-plugin-tailwindcss             | peerDep requires Tailwind ^3.4.0; project uses Tailwind v4 |
| eslint-plugin-react                   | Redundant with react-hooks and react-refresh; causes noise |
| eslint-plugin-jsx-a11y                | Frontend-only, can be re-added in Phase 4 (RTL/a11y)       |
| @eslint/eslintrc                      | FlatCompat layer no longer needed with native flat config  |
| @typescript-eslint/eslint-plugin (v7) | Replace with unified `typescript-eslint` v8 package        |
| @typescript-eslint/parser (v7)        | Included in unified `typescript-eslint` v8 package         |

### Alternatives Considered

| Instead of                | Could Use                        | Tradeoff                                                                                                                      |
| ------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| ESLint 9                  | ESLint 10                        | ESLint 10 has better monorepo config lookup but react-hooks plugin v7 peerDep blocks it; upgrade later when plugin catches up |
| eslint-plugin-tailwindcss | eslint-plugin-better-tailwindcss | New plugin but less mature; RTL rules via `no-restricted-syntax` are more reliable and already proven                         |
| Knip                      | ts-prune                         | Knip is the modern standard with workspace support; ts-prune is unmaintained                                                  |

**Installation:**

```bash
pnpm add -Dw knip@^6.0.2 typescript-eslint@^8.57.1 lint-staged@^16.4.0
pnpm remove -w eslint-plugin-prettier
```

## Architecture Patterns

### Target Config File Layout

```
/                           (monorepo root)
+-- eslint.config.js        # SINGLE flat config with workspace overrides
+-- .prettierrc              # SINGLE Prettier config (semi: false, trailingComma: all)
+-- .prettierignore          # Keep existing (consolidate duplicates)
+-- knip.json                # Workspace-aware Knip config
+-- .husky/pre-commit        # Runs lint-staged
+-- package.json             # lint-staged config expanded
+-- turbo.json               # lint task already defined
+-- frontend/
|   +-- (NO eslint configs)  # All removed -- root config handles via overrides
|   +-- (NO .prettierrc)     # Removed -- root config applies
+-- backend/
|   +-- (NO eslint configs)  # All removed -- root config handles via overrides
|   +-- (NO .prettierrc)     # Removed -- root config applies
```

### Pattern 1: ESLint 9 Flat Config with Workspace Overrides

**What:** A single `eslint.config.js` at root using `typescript-eslint` v8 `projectService` for type-aware linting across both workspaces, with file-glob-based overrides for frontend vs backend rules.

**When to use:** Monorepo with pnpm workspaces where all workspaces share base rules but have workspace-specific concerns (React rules for frontend, Node rules for backend).

**Example:**

```javascript
// eslint.config.js (root)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'specs/**',
      '**/*.generated.*',
      '**/database.types.ts',
    ],
  },

  // Base rules for all TypeScript files
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true, // v8 projectService -- no per-workspace tsconfig needed
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'off', // handled by unused-imports plugin
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  // Frontend-specific: React, RTL rules
  {
    files: ['frontend/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'react-refresh/only-export-components': 'error',
      // RTL enforcement (merged from .eslintrc.rtl.json)
      'no-restricted-syntax': [
        'error',
        { selector: 'Literal[value=/\\bml-/]', message: 'RTL: Use "ms-*" instead of "ml-*"' },
        { selector: 'Literal[value=/\\bmr-/]', message: 'RTL: Use "me-*" instead of "mr-*"' },
        { selector: 'Literal[value=/\\bpl-/]', message: 'RTL: Use "ps-*" instead of "pl-*"' },
        { selector: 'Literal[value=/\\bpr-/]', message: 'RTL: Use "pe-*" instead of "pr-*"' },
        {
          selector: 'Literal[value=/\\btext-left\\b/]',
          message: 'RTL: Use "text-start" instead of "text-left"',
        },
        {
          selector: 'Literal[value=/\\btext-right\\b/]',
          message: 'RTL: Use "text-end" instead of "text-right"',
        },
        {
          selector: 'Literal[value=/\\bleft-/]',
          message: 'RTL: Use "start-*" instead of "left-*"',
        },
        {
          selector: 'Literal[value=/\\bright-/]',
          message: 'RTL: Use "end-*" instead of "right-*"',
        },
        {
          selector: 'Literal[value=/\\brounded-l-/]',
          message: 'RTL: Use "rounded-s-*" instead of "rounded-l-*"',
        },
        {
          selector: 'Literal[value=/\\brounded-r-/]',
          message: 'RTL: Use "rounded-e-*" instead of "rounded-r-*"',
        },
        {
          selector: 'Literal[value=/\\bborder-l-/]',
          message: 'RTL: Use "border-s-*" instead of "border-l-*"',
        },
        {
          selector: 'Literal[value=/\\bborder-r-/]',
          message: 'RTL: Use "border-e-*" instead of "border-r-*"',
        },
      ],
    },
  },

  // UI library exceptions (re-export wrappers exempt from RTL and any rules)
  {
    files: ['frontend/**/components/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Backend-specific: Node environment
  {
    files: ['backend/**/*.ts'],
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // Backend may need relaxed return type for Express handlers
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
    },
  },

  // Prettier must be LAST to override formatting conflicts
  eslintConfigPrettier
);
```

### Pattern 2: Knip Workspace Configuration

**What:** Root `knip.json` with per-workspace entry points and allowlist for intentional re-exports.

**Example:**

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "workspaces": {
    ".": {
      "entry": ["scripts/*.ts"],
      "project": ["scripts/**/*.ts"],
      "ignoreDependencies": ["turbo", "only-allow"]
    },
    "frontend": {
      "entry": ["src/main.tsx", "src/routeTree.gen.ts"],
      "project": ["src/**/*.{ts,tsx}"],
      "ignore": ["src/components/ui/heroui-*.tsx", "src/components/ui/*.tsx"],
      "ignoreDependencies": ["@vitejs/plugin-react"]
    },
    "backend": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.ts"],
      "ignoreDependencies": ["tsx"]
    }
  },
  "ignoreExportsUsedInFile": true
}
```

### Pattern 3: Expanded lint-staged Configuration

**What:** Pre-commit hook runs 4 checks on staged files only: ESLint fix, Prettier format, TypeScript typecheck, Knip.

**Example:**

```json
{
  "lint-staged": {
    "frontend/**/*.{ts,tsx}": ["eslint --fix --no-warn-ignored", "prettier --write"],
    "backend/**/*.ts": ["eslint --fix --no-warn-ignored", "prettier --write"],
    "*.{json,md,yml,yaml,css}": ["prettier --write"]
  }
}
```

**Note on D-12 (typecheck + Knip in pre-commit):** Running `tsc --noEmit` and `knip` on staged files only is not straightforward. `tsc` checks the entire project (it cannot lint individual files), and `knip` analyzes the full dependency graph. Options:

1. Run `tsc --noEmit` as a separate lint-staged command on `*.ts` glob (runs full project check, ~5-10s)
2. Run `knip --no-progress` as a post-lint-staged step in the husky pre-commit script
3. Both will check the full project, not just staged files -- this is the only way they can work correctly

### Anti-Patterns to Avoid

- **Per-workspace ESLint configs with flat config:** ESLint 9 flat config is designed for a single root config with file-glob overrides. Multiple configs create confusion.
- **Using `eslint-plugin-prettier`:** Runs Prettier inside ESLint, doubling processing time. Use Prettier separately (D-03).
- **Using `@eslint/eslintrc` FlatCompat:** This shim wraps legacy configs; all plugins in this project have native flat config support in their latest versions.
- **Pinning exact dependency versions:** D-11 mandates `^` ranges; `pnpm-lock.yaml` handles reproducibility.

## Don't Hand-Roll

| Problem                           | Don't Build                            | Use Instead                           | Why                                                                         |
| --------------------------------- | -------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| Dead code detection               | Custom grep scripts for unused exports | Knip v6                               | Understands TypeScript re-exports, barrel files, monorepo dependency graphs |
| Import cleanup                    | Manual removal of unused imports       | eslint-plugin-unused-imports          | Auto-fixes on save, integrates with ESLint                                  |
| Format enforcement                | ESLint formatting rules                | Prettier (standalone)                 | Faster, consistent, no rule conflicts                                       |
| Pre-commit hooks                  | Custom git hooks                       | husky + lint-staged                   | Standard, handles partial staging correctly                                 |
| TypeScript monorepo parser config | Per-workspace `parserOptions.project`  | typescript-eslint v8 `projectService` | Automatic tsconfig resolution, no manual config                             |

**Key insight:** The biggest temptation is building custom RTL linting rules or Tailwind class validators. The `no-restricted-syntax` approach with AST selectors is the correct solution -- it works with any ESLint version, requires no plugin, and catches violations in string literals where Tailwind classes live.

## Common Pitfalls

### Pitfall 1: Root package.json `"type": "commonjs"` Blocks ESM Config

**What goes wrong:** ESLint 9 flat config uses ESM (`export default`). If root `package.json` has `"type": "commonjs"`, `eslint.config.js` fails to load.
**Why it happens:** The root package.json has `"type": "commonjs"`.
**How to avoid:** Use `eslint.config.mjs` (force ESM) instead of `eslint.config.js`. Alternatively, change root to `"type": "module"` but this may break other scripts.
**Warning signs:** `SyntaxError: Cannot use import statement in a module` when running eslint.

### Pitfall 2: Prettier Config Divergence Causes Mass Reformatting

**What goes wrong:** Root `.prettierrc` has `"semi": true` and `"trailingComma": "es5"`, but workspace configs have `"semi": false` and `"trailingComma": "all"`. Consolidating to the wrong values triggers reformatting of every file.
**Why it happens:** Root config was never updated to match the project convention in CLAUDE.md.
**How to avoid:** The correct values (per CLAUDE.md) are `"semi": false`, `"trailingComma": "all"`. Update root config to match workspace configs, then run `prettier --write .` once. Commit the formatting separately before any logic changes.
**Warning signs:** Large diff with only semicolon/comma changes.

### Pitfall 3: `shared` Workspace Has No package.json

**What goes wrong:** `pnpm-workspace.yaml` lists `shared` as a workspace, but `shared/` only contains a `types/` directory with no `package.json`. This may cause pnpm warnings and Knip errors.
**Why it happens:** Workspace was set up for shared types but never formalized as a proper package.
**How to avoid:** Either add a minimal `shared/package.json` with `{ "name": "@intl-dossier/shared", "private": true }` or remove `shared` from `pnpm-workspace.yaml` if types are imported via path aliases.
**Warning signs:** pnpm install warnings about missing workspace, Knip crash on workspace enumeration.

### Pitfall 4: ESLint Strict Mode Causes Hundreds of Errors

**What goes wrong:** D-01 says "strict from day one, all errors." Switching from `warn` to `error` for rules like `explicit-function-return-type`, `no-console`, `react-refresh/only-export-components` will surface hundreds of violations in existing code.
**Why it happens:** Current configs use `warn` for many rules. Switching to `error` means every existing violation blocks commits.
**How to avoid:** Run ESLint with `--fix` first to auto-fix what can be fixed. For rules that cannot be auto-fixed (like `explicit-function-return-type`), the planner must allocate a dedicated task to fix violations before enabling the strict config. Consider a two-step approach: (1) install config with fixable violations auto-fixed, (2) manual fix pass for remaining errors.
**Warning signs:** `eslint .` returns 500+ errors after config switch.

### Pitfall 5: `tsc --noEmit` in Pre-commit is Slow

**What goes wrong:** Running `tsc --noEmit` on every commit checks the entire project, which can take 15-30s for a large codebase.
**Why it happens:** TypeScript cannot type-check individual files -- it needs the full project context.
**How to avoid:** Use `tsc --noEmit --incremental` which caches type information in `.tsbuildinfo` files, making subsequent checks much faster (~2-5s). Add `.tsbuildinfo` to `.gitignore`.
**Warning signs:** Commit times exceeding 10s, developer frustration.

### Pitfall 6: Knip False Positives on Dynamic Imports

**What goes wrong:** Knip flags files as unused that are dynamically imported (e.g., `React.lazy(() => import('./Page'))` or i18n JSON files loaded at runtime).
**Why it happens:** Static analysis cannot trace all dynamic import paths.
**How to avoid:** Configure Knip entry points to include route files and i18n config. Use `ignore` patterns for known dynamic import targets. Test Knip output before committing config.
**Warning signs:** Knip reports route components as unused files.

### Pitfall 7: `specs/` Directory Contains Stale Configs

**What goes wrong:** The `specs/020-complete-the-development/checklists/mobile/` directory contains its own `.eslintrc.js` and `.prettierrc` -- leftover from the cancelled mobile app.
**Why it happens:** Mobile app was deleted but spec directory configs were not cleaned up.
**How to avoid:** Add `specs/**` to ESLint ignores (it's documentation, not source code). Or delete stale config files from specs.
**Warning signs:** ESLint picks up these configs and conflicts with root.

## Code Examples

### Unified Prettier Config (Target)

```json
{
  "semi": false,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "proseWrap": "preserve"
}
```

Source: Current `frontend/.prettierrc` and `backend/.prettierrc` (both match), aligned with CLAUDE.md conventions.

### Knip Ignore Directive for Placeholder Services

```typescript
// backend/src/middleware/clearance-check.ts

// TODO: Implement real clearance-based access control (Phase 3: SEC-02)
// knip-ignore-next -- placeholder for Phase 3 implementation
export function checkClearanceLevel(requiredLevel: string) {
  // Placeholder -- allows all access until Phase 3
  return (_req: Request, _res: Response, next: NextFunction) => next();
}
```

### Husky Pre-commit Script (Target)

```bash
#!/usr/bin/env sh
# .husky/pre-commit

# Run lint-staged for ESLint + Prettier on staged files
npx lint-staged

# Run full-project checks (cannot be scoped to staged files)
pnpm exec tsc --noEmit --incremental
pnpm exec knip --no-progress
```

## State of the Art

| Old Approach                          | Current Approach                 | When Changed                    | Impact                                                                     |
| ------------------------------------- | -------------------------------- | ------------------------------- | -------------------------------------------------------------------------- |
| `.eslintrc.js` (legacy)               | `eslint.config.js` (flat config) | ESLint 9 (Apr 2024)             | Simpler, composable, no magic extends chain                                |
| `parserOptions.project` per workspace | `parserOptions.projectService`   | typescript-eslint v8 (Jul 2024) | Automatic tsconfig resolution in monorepos                                 |
| eslint-plugin-prettier                | Prettier as standalone tool      | Community consensus 2023+       | Faster, cleaner separation of concerns                                     |
| eslintrc + eslintignore               | Flat config with `ignores` array | ESLint 9                        | Single file, no hidden config                                              |
| ts-prune for dead code                | Knip v5/v6                       | 2023+                           | Workspace-aware, plugin system, actively maintained                        |
| eslint-plugin-react (full)            | react-hooks + react-refresh only | 2024+                           | Less noise, react-in-jsx-scope and prop-types no longer needed in React 19 |

**Deprecated/outdated:**

- `.eslintrc.*` files: Removed entirely in ESLint 10; supported but deprecated in ESLint 9
- `.eslintignore`: Not used by flat config; use `ignores` array instead
- `@eslint/eslintrc` FlatCompat: Transitional shim, not needed when all plugins support flat config natively
- `eslint-plugin-tailwindcss` stable: Does not support Tailwind v4; beta channel has partial support with known false positives

## Open Questions

1. **How many ESLint violations will exist after switching to strict (error) mode?**
   - What we know: Current configs use `warn` for `explicit-function-return-type`, `no-console`, `react-refresh/only-export-components`
   - What's unclear: The exact count of violations -- could be dozens or hundreds
   - Recommendation: Run ESLint with the new config in `--fix` mode first, then count remaining unfixable errors to scope the manual fix task

2. **Are there unused i18n keys, and how many?**
   - What we know: D-08 requires scanning and removing unused keys from EN/AR JSON files
   - What's unclear: No tool is currently configured for i18n key analysis; Knip may not detect these
   - Recommendation: Use `i18next-parser` or manual grep to find keys referenced in source code vs keys defined in JSON files

3. **Which AI/ML dependencies are actually used?**
   - What we know: D-10 requires auditing anthropic, openai, langchain, mastra, xenova/transformers
   - What's unclear: Which have real import chains vs which are installed but unused
   - Recommendation: Run Knip first (it detects unused dependencies), then manually verify the AI/ML specific ones by tracing imports

4. **Should `eslint.config.mjs` or `eslint.config.js` be used?**
   - What we know: Root `package.json` has `"type": "commonjs"`, which means `.js` files are CJS by default
   - What's unclear: Whether changing to `.mjs` or changing root to `"type": "module"` has fewer side effects
   - Recommendation: Use `eslint.config.mjs` -- it forces ESM without changing the root package type, which could break other scripts

## Environment Availability

| Dependency  | Required By            | Available | Version | Fallback                            |
| ----------- | ---------------------- | --------- | ------- | ----------------------------------- |
| Node.js     | All tools              | Yes       | 24.9.0  | --                                  |
| pnpm        | Package management     | Yes       | 10.29.1 | --                                  |
| ESLint      | Linting                | Yes       | 9.37.0  | --                                  |
| TypeScript  | Type checking          | Yes       | 5.9.3   | --                                  |
| Prettier    | Formatting             | Yes       | 3.6.2   | --                                  |
| husky       | Git hooks              | Yes       | 9.1.7   | --                                  |
| lint-staged | Staged file processing | Yes       | 16.2.1  | --                                  |
| Knip        | Dead code detection    | NO        | --      | Install: `pnpm add -Dw knip@^6.0.2` |

**Missing dependencies with no fallback:**

- Knip must be installed (no alternative for monorepo-aware dead code detection)

**Missing dependencies with fallback:**

- None

## Validation Architecture

### Test Framework

| Property           | Value                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| Framework          | Vitest 4.0.18                                                                      |
| Config file        | `vitest.config.ts` (root), `frontend/vitest.config.ts`, `backend/vitest.config.ts` |
| Quick run command  | `pnpm exec vitest run --reporter=verbose`                                          |
| Full suite command | `pnpm test` (via turbo)                                                            |

### Phase Requirements -> Test Map

| Req ID  | Behavior                                    | Test Type | Automated Command                                            | File Exists?    |
| ------- | ------------------------------------------- | --------- | ------------------------------------------------------------ | --------------- |
| TOOL-01 | Knip reports zero unused files/exports/deps | smoke     | `pnpm exec knip --no-progress`                               | N/A (CLI check) |
| TOOL-02 | ESLint runs with zero errors/warnings       | smoke     | `pnpm exec eslint frontend/src backend/src --max-warnings 0` | N/A (CLI check) |
| TOOL-03 | Pre-commit hook runs and blocks on failure  | manual    | Stage a file with `console.log`, attempt commit              | N/A (manual)    |
| TOOL-04 | No unused dependencies in Knip report       | smoke     | `pnpm exec knip --include dependencies --no-progress`        | N/A (CLI check) |
| TOOL-05 | Build succeeds after dependency updates     | smoke     | `pnpm build`                                                 | N/A (CLI check) |

### Sampling Rate

- **Per task commit:** `pnpm exec eslint frontend/src backend/src --max-warnings 0 && pnpm exec tsc --noEmit`
- **Per wave merge:** `pnpm build && pnpm exec knip --no-progress`
- **Phase gate:** All 5 commands green: eslint (zero errors), prettier --check, tsc --noEmit, knip (zero findings), pnpm build

### Wave 0 Gaps

- [ ] Install Knip: `pnpm add -Dw knip@^6.0.2`
- [ ] Create `knip.json` at root -- covers TOOL-01, TOOL-04

## Existing Config Inventory (Files to Delete)

The following files must be removed as part of consolidation:

| File                          | Current Purpose                       | Replacement                                 |
| ----------------------------- | ------------------------------------- | ------------------------------------------- |
| `.eslintrc.js` (root)         | Legacy root ESLint config             | Root `eslint.config.mjs`                    |
| `backend/.eslintrc.js`        | Shim for legacy tooling               | Root `eslint.config.mjs` backend overrides  |
| `backend/.eslintrc.json`      | Detailed backend ESLint rules         | Root `eslint.config.mjs` backend overrides  |
| `backend/eslint.config.js`    | Backend flat config (uses FlatCompat) | Root `eslint.config.mjs`                    |
| `frontend/.eslintrc.js`       | Shim for legacy tooling               | Root `eslint.config.mjs` frontend overrides |
| `frontend/.eslintrc.json`     | Detailed frontend ESLint + RTL rules  | Root `eslint.config.mjs` frontend overrides |
| `frontend/.eslintrc.rtl.json` | Separate RTL rules (D-02: merge)      | Root `eslint.config.mjs` RTL section        |
| `frontend/eslint.config.js`   | Frontend flat config                  | Root `eslint.config.mjs`                    |
| `backend/.prettierrc`         | Backend Prettier config               | Root `.prettierrc`                          |
| `frontend/.prettierrc`        | Frontend Prettier config              | Root `.prettierrc`                          |
| `.eslintignore`               | ESLint ignore patterns                | `ignores` array in `eslint.config.mjs`      |
| `specs/*/.eslintrc.js`        | Stale mobile config                   | Delete (specs are docs, not source)         |
| `specs/*/.prettierrc`         | Stale mobile config                   | Delete (specs are docs, not source)         |

**Total: 13 config files removed, replaced by 3 files** (`eslint.config.mjs`, `.prettierrc`, `knip.json`)

## Sources

### Primary (HIGH confidence)

- npm registry -- verified current versions for all packages via `npm view <pkg> version` and `npm view <pkg> peerDependencies`
- Codebase analysis -- direct file reads of all 8 ESLint configs, 3 Prettier configs, husky/lint-staged setup, package.json files, tsconfig files

### Secondary (MEDIUM confidence)

- [ESLint v10.0.0 release blog](https://eslint.org/blog/2026/02/eslint-v10.0.0-released/) -- confirmed ESLint 10 breaking changes and monorepo config lookup behavior
- [ESLint 10 migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0) -- eslintrc removal, Node.js requirements
- [typescript-eslint projectService blog](https://typescript-eslint.io/blog/project-service/) -- v8 projectService for monorepos
- [Knip monorepo docs](https://knip.dev/features/monorepos-and-workspaces) -- workspace configuration patterns
- [Knip configuration reference](https://knip.dev/reference/configuration) -- ignoreDependencies, ignoreExportsUsedInFile
- [eslint-plugin-react-hooks ESLint 10 issue](https://github.com/facebook/react/issues/35758) -- peerDep only declares up to ESLint 9

### Tertiary (LOW confidence)

- eslint-plugin-tailwindcss Tailwind v4 support -- beta channel only, full rewrite in progress; status may change

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all versions verified via npm registry, peerDeps confirmed
- Architecture: HIGH -- patterns proven in the existing frontend/eslint.config.js (already uses flat config with RTL rules)
- Pitfalls: HIGH -- derived from direct codebase analysis (Prettier divergence, `shared` workspace issue, `specs/` stale configs all confirmed)
- Knip config: MEDIUM -- workspace allowlist pattern follows docs but exact `ignore` syntax for re-exports needs validation during implementation

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable domain, 30-day validity)
