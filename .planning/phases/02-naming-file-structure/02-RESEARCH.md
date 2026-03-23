# Phase 2: Naming & File Structure - Research

**Researched:** 2026-03-23
**Domain:** File/folder naming conventions, ESLint filename enforcement, safe bulk rename in monorepo
**Confidence:** HIGH

## Summary

Phase 2 is a rename-only phase with no directory restructuring. The codebase has three distinct layers of naming inconsistency: (1) 18 kebab-case hook files that should be camelCase, (2) 12 PascalCase component directories that should be kebab-case, (3) 37 standalone component `.tsx` files at the `components/` root that need wrapping in kebab-case subdirectories, and (4) 17 PascalCase backend service files plus 5 PascalCase model files that should be kebab-case. Total import path updates are manageable: ~70 references for hooks, ~45 for frontend component directories, and ~35 for backend services/models. `git mv` preserves blame history for all renames.

Enforcement uses `eslint-plugin-check-file` v3.3.1, which supports ESLint 9 flat config natively and provides both `filename-naming-convention` and `folder-naming-convention` rules with glob-based targeting. This plugs directly into the Phase 1 pre-commit hooks (husky + lint-staged) for automated enforcement.

**Primary recommendation:** Execute layer-by-layer (hooks, then component dirs, then standalone components, then backend services, then ESLint enforcement), using `git mv` for all renames and TypeScript compiler + Knip as verification gates after each layer.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** All directories in `frontend/src/components/` use kebab-case (e.g., `activity-feed/`, `after-action/`, `ai/`, `analytics/`)
- **D-02:** Standalone `.tsx` files (e.g., `AfterActionForm.tsx`, `DossierCard.tsx`) move into their own kebab-case directories (e.g., `after-action-form/AfterActionForm.tsx`)
- **D-03:** No barrel exports (index.ts) in component directories -- import directly from the file (e.g., `@/components/after-action-form/AfterActionForm`)
- **D-04:** Component files inside directories remain PascalCase (e.g., `AfterActionForm.tsx` inside `after-action-form/`)
- **D-05:** All hook files use camelCase: `useAuth.ts`, `useCompliance.ts`, `useTasks.ts` -- the ~18 kebab-case hooks get renamed to camelCase
- **D-06:** Hook function names already follow `useX` convention -- file names mirror the function name
- **D-07:** `frontend/src/components/ui/` keeps kebab-case naming -- no changes needed
- **D-08:** Layer-by-layer execution: hooks first, then components, then cleanup/verification
- **D-09:** Use `git mv` for all renames to preserve blame history
- **D-10:** Naming only -- no directory restructuring (don't move files between `pages/`, `routes/`, `services/`, `domains/`)
- **D-11:** Add ESLint filename rules (e.g., `eslint-plugin-check-file`) to enforce conventions
- **D-12:** ESLint rules run in pre-commit hooks (already set up in Phase 1)

### Claude's Discretion

- Exact ESLint plugin choice and rule configuration
- Order of files within each layer rename
- How to handle edge cases (e.g., `__tests__/` directories, `.d.ts` declaration files)
- Import path update tooling (manual find-replace vs automated script)

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                     | Research Support                                                                                                                                                                                                                                        |
| ------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ARCH-01 | Consistent naming conventions enforced across monorepo (files, functions, components, services) | Full codebase audit completed: 18 hook renames, 12 directory renames, 37 standalone file moves, 17 backend service renames, 5 backend model renames identified. ESLint enforcement via eslint-plugin-check-file v3.3.1 with glob-based rules per layer. |

</phase_requirements>

## Standard Stack

### Core

| Library                  | Version | Purpose                                           | Why Standard                                                                                                                                                                                                |
| ------------------------ | ------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eslint-plugin-check-file | 3.3.1   | Filename and folder naming convention enforcement | Only actively maintained ESLint 9 flat-config-compatible filename plugin. Supports glob-based rules for different naming per directory. 6 built-in conventions (KEBAB_CASE, PASCAL_CASE, CAMEL_CASE, etc.). |

### Supporting

| Library               | Version    | Purpose                              | When to Use                                                                           |
| --------------------- | ---------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| TypeScript (existing) | 5.9+       | Import path validation after renames | Compiler flags broken imports immediately -- run `pnpm build` after each rename layer |
| Knip (existing)       | 6.x        | Dead import/export detection         | Run after all renames to catch orphaned references                                    |
| git mv                | (built-in) | Rename with blame preservation       | Every file/folder rename must use `git mv`, not manual delete+create                  |

### Alternatives Considered

| Instead of               | Could Use                      | Tradeoff                                                      |
| ------------------------ | ------------------------------ | ------------------------------------------------------------- |
| eslint-plugin-check-file | eslint-plugin-filenames        | Abandoned (last update 2020), no ESLint 9 flat config support |
| eslint-plugin-check-file | eslint-plugin-filenames-simple | Less flexible glob matching, fewer built-in conventions       |
| eslint-plugin-check-file | eslint-plugin-filename-rules   | Smaller community, less documentation                         |

**Installation:**

```bash
pnpm add -D eslint-plugin-check-file
```

## Architecture Patterns

### Target Naming Convention Map

```
frontend/src/
  components/
    ui/              # kebab-case files (button.tsx, heroui-button.tsx) -- NO CHANGE
    {feature}/       # kebab-case DIRS (activity-feed/, after-action/)
      FeatureName.tsx  # PascalCase FILES inside dirs
    __tests__/       # Exception: __tests__ keeps double-underscore convention
  hooks/
    useFeatureName.ts  # camelCase files matching function name
  types/             # kebab-case files with .types.ts suffix -- NO CHANGE
  lib/               # kebab-case files -- NO CHANGE
  routes/            # kebab-case (TanStack Router convention) -- NO CHANGE

backend/src/
  services/
    feature-name.service.ts  # kebab-case with .service.ts suffix
    __tests__/               # Exception: keeps double-underscore
  models/
    feature-name.model.ts    # kebab-case with .model.ts suffix
  api/               # Already kebab-case -- NO CHANGE
  middleware/         # Already kebab-case -- NO CHANGE
  types/             # Already kebab-case -- NO CHANGE
```

### Pattern 1: ESLint Flat Config for Filename Enforcement

**What:** Configure `eslint-plugin-check-file` with separate rules per directory using ESLint 9 `files` globs.
**When to use:** Add as a new config block in `eslint.config.mjs` after all rename work is complete.
**Example:**

```javascript
// Source: eslint-plugin-check-file v3.3.1 docs
import checkFile from 'eslint-plugin-check-file'

// Add to eslint.config.mjs:

// Frontend component directories must be kebab-case
{
  files: ['frontend/src/components/**/*.{ts,tsx}'],
  ignores: ['frontend/src/components/ui/**'],
  plugins: { 'check-file': checkFile },
  rules: {
    'check-file/folder-naming-convention': ['error', {
      'frontend/src/components/**/': 'KEBAB_CASE',
    }],
    'check-file/filename-naming-convention': ['error', {
      'frontend/src/components/**/*.{tsx,ts}': 'PASCAL_CASE',
    }],
  },
},

// Frontend hooks must be camelCase
{
  files: ['frontend/src/hooks/**/*.{ts,tsx}'],
  plugins: { 'check-file': checkFile },
  rules: {
    'check-file/filename-naming-convention': ['error', {
      'frontend/src/hooks/**/*.{ts,tsx}': 'CAMEL_CASE',
    }],
  },
},

// Frontend UI primitives stay kebab-case
{
  files: ['frontend/src/components/ui/**/*.{ts,tsx}'],
  plugins: { 'check-file': checkFile },
  rules: {
    'check-file/filename-naming-convention': ['error', {
      'frontend/src/components/ui/**/*.{ts,tsx}': 'KEBAB_CASE',
    }],
  },
},

// Backend services must be kebab-case
{
  files: ['backend/src/services/**/*.ts'],
  plugins: { 'check-file': checkFile },
  rules: {
    'check-file/filename-naming-convention': ['error', {
      'backend/src/services/**/*.ts': 'KEBAB_CASE',
    }],
    'check-file/folder-naming-convention': ['error', {
      'backend/src/services/**/': 'KEBAB_CASE',
    }],
  },
},

// Backend models must be kebab-case
{
  files: ['backend/src/models/**/*.ts'],
  plugins: { 'check-file': checkFile },
  rules: {
    'check-file/filename-naming-convention': ['error', {
      'backend/src/models/**/*.ts': 'KEBAB_CASE',
    }],
  },
},
```

### Pattern 2: Safe Rename with git mv

**What:** Use `git mv` for every rename to preserve git blame/log history.
**When to use:** All file and directory renames.
**Example:**

```bash
# Rename a hook file
git mv frontend/src/hooks/use-compliance.ts frontend/src/hooks/useCompliance.ts

# Rename a directory (case-sensitive rename on macOS requires two-step)
git mv frontend/src/components/Dashboard frontend/src/components/dashboard-tmp
git mv frontend/src/components/dashboard-tmp frontend/src/components/dashboard

# Move standalone file into new kebab-case directory
mkdir -p frontend/src/components/after-action-form
git mv frontend/src/components/AfterActionForm.tsx frontend/src/components/after-action-form/AfterActionForm.tsx
```

### Pattern 3: Import Path Update Strategy

**What:** After each rename, update all import paths referencing the old path.
**When to use:** After every `git mv` operation.
**Example:**

```bash
# Find all files importing the old path and update
# For hook renames (simple find-replace in import strings):
# Old: import { useCompliance } from '@/hooks/use-compliance'
# New: import { useCompliance } from '@/hooks/useCompliance'

# For directory renames:
# Old: import { DossierCard } from '@/components/Dossier/DossierCard'
# New: import { DossierCard } from '@/components/dossier/DossierCard'
```

### Anti-Patterns to Avoid

- **Manual file copy + delete:** Destroys git blame history. Always use `git mv`.
- **Renaming files and updating imports in separate commits:** Creates broken intermediate states. Rename + import update must be atomic per file/directory.
- **Adding barrel exports (index.ts):** Decision D-03 explicitly forbids this. Import directly from the file.
- **Renaming route files:** TanStack Router route files in `frontend/src/routes/` use their own naming convention (kebab-case with `$param`, `_layout` prefixes). These are auto-generated/convention-driven and must NOT be renamed.

## Don't Hand-Roll

| Problem                         | Don't Build          | Use Instead                     | Why                                                                                                              |
| ------------------------------- | -------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Filename enforcement            | Custom lint script   | eslint-plugin-check-file        | Integrates with existing ESLint 9 flat config and pre-commit hooks; 6 built-in conventions; glob-based targeting |
| Import path updates             | Custom AST transform | grep + sed (or IDE refactor)    | Import paths are simple string replacements; TypeScript compiler catches any missed ones                         |
| Dead import detection           | Manual audit         | Knip + TypeScript build         | Already configured in Phase 1; catches orphaned imports automatically                                            |
| Case-sensitive renames on macOS | Single git mv        | Two-step git mv (via temp name) | macOS HFS+/APFS is case-insensitive by default; `git mv Foo foo` silently fails; must go `Foo -> foo-tmp -> foo` |

**Key insight:** The verification infrastructure from Phase 1 (ESLint + Prettier + build + Knip in pre-commit hooks) serves as the safety net for this phase. Every rename is immediately validated by the build step.

## Rename Inventory (Complete Audit)

### Layer 1: Frontend Hooks (18 renames, ~70 import refs)

| Current Name                 | Target Name               | Import Refs |
| ---------------------------- | ------------------------- | ----------- |
| use-ai-suggestions.ts        | useAiSuggestions.ts       | 2           |
| use-bulk-selection.ts        | useBulkSelection.ts       | 1           |
| use-compliance.ts            | useCompliance.ts          | 1           |
| use-contributors.ts          | useContributors.ts        | 2           |
| use-delegation.ts            | useDelegation.ts          | 4           |
| use-entity-links.ts          | useEntityLinks.ts         | 3           |
| use-entity-search.ts         | useEntitySearch.ts        | 1           |
| use-language.ts              | useLanguage.ts            | 3           |
| use-mobile.tsx               | useMobile.tsx             | 3           |
| use-offline-state.ts         | useOfflineState.ts        | 0           |
| use-optimistic-locking.ts    | useOptimisticLocking.ts   | 1           |
| use-outside-click.tsx        | useOutsideClick.tsx       | 3           |
| use-queue-filters.ts         | useQueueFilters.ts        | 2           |
| use-responsive.ts            | useResponsive.ts          | 5           |
| use-tasks.ts                 | useTasks.ts               | 6           |
| use-theme.ts                 | useTheme.ts               | 6           |
| use-toast.ts                 | useToast.ts               | 25          |
| use-waiting-queue-actions.ts | useWaitingQueueActions.ts | 3           |

### Layer 2: Frontend Component Directories (12 renames, ~45 import refs)

| Current Dir        | Target Dir          | Files Inside | Import Refs |
| ------------------ | ------------------- | ------------ | ----------- |
| ActivityFeed/      | activity-feed/      | 2            | 1           |
| Calendar/          | calendar/           | 10           | 3           |
| Dashboard/         | dashboard/          | 5            | 0           |
| Dossier/           | dossier/            | 58           | 20          |
| Editor/            | editor/             | 1            | 0           |
| Forms/             | forms/              | 22           | 11          |
| KeyboardShortcuts/ | keyboard-shortcuts/ | 3            | 2           |
| Layout/            | layout/             | 13           | 1           |
| Legislation/       | legislation/        | 4            | 0           |
| Notifications/     | notifications/      | 6            | 2           |
| Search/            | search/             | 2            | 1           |
| Table/             | table/              | 2            | 4           |

**Note:** `Dossier/` is the largest directory (58 files, 20 import references) -- treat it with extra care.

### Layer 3: Standalone Component Files (37 files needing subdirectories)

These files at `frontend/src/components/` root need wrapping in kebab-case directories per D-02. Each `FooBar.tsx` moves to `foo-bar/FooBar.tsx`. Examples:

- `AfterActionForm.tsx` -> `after-action-form/AfterActionForm.tsx`
- `DossierCard.tsx` -> `dossier-card/DossierCard.tsx`
- `ErrorBoundary.tsx` -> `error-boundary/ErrorBoundary.tsx`
- (37 total files, each generating 1 new directory + 1 import path update per consumer)

**Exception:** `theme-error-boundary.tsx` is already kebab-case -- it still needs a subdirectory per D-02.

### Layer 4: Backend Services (17 renames, ~35 import refs)

| Current Name                   | Target Name                      | Import Refs |
| ------------------------------ | -------------------------------- | ----------- |
| AuthService.ts                 | auth.service.ts                  | 3           |
| BriefService.ts                | brief.service.ts                 | 2           |
| CommitmentService.ts           | commitment.service.ts            | 2           |
| ContactService.ts              | contact.service.ts               | 2           |
| CountryService.ts              | country.service.ts               | 2           |
| DocumentService.ts             | document.service.ts              | 2           |
| EventService.ts                | event.service.ts                 | 2           |
| IntelligenceService.ts         | intelligence.service.ts          | 3           |
| MoUService.ts                  | mou.service.ts                   | 2           |
| OrganizationService.ts         | organization.service.ts          | 2           |
| PermissionDelegationService.ts | permission-delegation.service.ts | 2           |
| PositionConsistencyService.ts  | position-consistency.service.ts  | 2           |
| RelationshipHealthService.ts   | relationship-health.service.ts   | 2           |
| SignatureOrchestrator.ts       | signature-orchestrator.ts        | 1           |
| SignatureService.ts            | signature.service.ts             | 2           |
| VoiceService.ts                | voice.service.ts                 | 2           |

**Test file:** `AuthService.test.ts` -> `auth.service.test.ts` (in `__tests__/` dir)

### Layer 5: Backend Models (5 renames)

| Current Name            | Target Name                    |
| ----------------------- | ------------------------------ |
| Country.ts              | country.model.ts               |
| PermissionDelegation.ts | permission-delegation.model.ts |
| PositionConsistency.ts  | position-consistency.model.ts  |
| SignatureRequest.ts     | signature-request.model.ts     |
| User.ts                 | user.model.ts                  |

### Already Consistent (NO CHANGE)

- `frontend/src/components/ui/` -- kebab-case (D-07)
- `frontend/src/types/` -- kebab-case with `.types.ts` suffix
- `frontend/src/lib/` -- kebab-case
- `frontend/src/routes/` -- TanStack Router conventions (kebab-case + `$param` + `_layout`)
- `backend/src/api/` -- kebab-case
- `backend/src/middleware/` -- kebab-case
- `backend/src/types/` -- kebab-case with `.types.ts` suffix
- 28 already kebab-case backend services

## Common Pitfalls

### Pitfall 1: macOS Case-Insensitive Filesystem

**What goes wrong:** `git mv Foo foo` silently does nothing on macOS (APFS default is case-insensitive).
**Why it happens:** The filesystem considers `Foo` and `foo` the same path.
**How to avoid:** Two-step rename: `git mv Foo foo-tmp && git mv foo-tmp foo`. This applies to all 12 PascalCase directory renames.
**Warning signs:** `git status` shows no changes after a rename.

### Pitfall 2: Broken Imports After Directory Rename

**What goes wrong:** Renaming `components/Dossier/` to `components/dossier/` breaks 20+ import paths.
**Why it happens:** TypeScript imports are case-sensitive strings even on case-insensitive filesystems.
**How to avoid:** Update ALL import paths in the same commit as the rename. Run `pnpm build` immediately after to catch any missed ones.
**Warning signs:** Build fails with "Cannot find module" errors.

### Pitfall 3: routeTree.gen.ts Auto-Regeneration

**What goes wrong:** Component renames that are imported by route files may cause `routeTree.gen.ts` to regenerate with different content.
**Why it happens:** TanStack Router generates this file based on route file imports.
**How to avoid:** After renaming components imported by route files, run `pnpm dev` briefly to regenerate `routeTree.gen.ts`, then commit the regenerated file. Note: `routeTree.gen.ts` is already in ESLint ignores.
**Warning signs:** Modified `routeTree.gen.ts` showing up in `git status` after renames.

### Pitfall 4: Knip False Positives After Moves

**What goes wrong:** Knip may flag newly created directories or moved files as unused.
**Why it happens:** Knip's `ignore` patterns in `knip.json` may not cover new paths.
**How to avoid:** Verify Knip config covers new paths. The existing `frontend.ignore` for `src/components/ui/heroui-*.tsx` and `src/components/ui/*.tsx` does not need changes since UI dir is untouched.
**Warning signs:** Knip reporting false positives in pre-commit hook.

### Pitfall 5: Test File References

**What goes wrong:** Test files in `tests/unit/components/` reference component paths that change.
**Why it happens:** Tests import from `@/components/...` paths that are being renamed.
**How to avoid:** Update test file imports alongside component renames. Check `tests/` directory (exists outside `frontend/src/`), `frontend/src/components/__tests__/`, and `backend/src/services/__tests__/`.
**Warning signs:** Test failures after rename.

### Pitfall 6: Default Export Rename Confusion

**What goes wrong:** Backend services use `export default` and consumers import via `import AuthService from '../services/AuthService'`. Renaming the file does not rename the class/export.
**Why it happens:** File name and class name are separate concerns.
**How to avoid:** D-10 says naming only. Rename the FILE, update the IMPORT PATH. Do NOT rename the class/function inside the file -- that is refactoring, not renaming.
**Warning signs:** Temptation to rename `class AuthService` to `class auth.service`.

## Edge Cases

### `__tests__/` Directories

- Keep `__tests__/` naming (double underscore convention is standard, not a naming violation)
- Rename test files inside to match their subject: `AuthService.test.ts` -> `auth.service.test.ts`
- `eslint-plugin-check-file` supports ignoring `__tests__/` via glob patterns

### `.d.ts` Declaration Files

- 4 files found: `deep-diff.d.ts`, `json.d.ts`, `heroui-react.d.ts`, `vite-env.d.ts`
- These are already kebab-case. No changes needed.
- ESLint rules should use `ignoreMiddleExtensions: true` for `.d.ts`, `.test.ts`, `.types.ts` patterns

### `routeTree.gen.ts`

- Auto-generated file, already in ESLint ignores
- Will regenerate after component renames that affect route files
- Commit the regenerated version

### `theme-error-boundary.tsx` (already kebab-case)

- Currently a standalone file at components root
- Per D-02, still needs wrapping in `theme-error-boundary/theme-error-boundary.tsx`
- But this breaks D-04 (component files inside dirs should be PascalCase)
- **Recommendation:** Rename to `theme-error-boundary/ThemeErrorBoundary.tsx` for consistency

### Backend Files Without `.service.ts` Suffix

- `countries-search.ts`, `event-conflicts.ts`, `llm-router.ts` -- already kebab-case, no `.service.ts` suffix
- These are utility/helper files, not services. Leave as-is.

## Validation Architecture

### Test Framework

| Property           | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| Framework          | Vitest 4.0.18+                                                    |
| Config file        | `frontend/vitest.config.ts` (frontend), `vitest.config.ts` (root) |
| Quick run command  | `pnpm build` (catches broken imports via TypeScript)              |
| Full suite command | `pnpm test && pnpm build`                                         |

### Phase Requirements -> Test Map

| Req ID    | Behavior                          | Test Type       | Automated Command                                                                           | File Exists?         |
| --------- | --------------------------------- | --------------- | ------------------------------------------------------------------------------------------- | -------------------- |
| ARCH-01-a | Hook files use camelCase          | lint            | `npx eslint frontend/src/hooks/ --rule 'check-file/filename-naming-convention: error'`      | Wave 0 (ESLint rule) |
| ARCH-01-b | Component dirs use kebab-case     | lint            | `npx eslint frontend/src/components/ --rule 'check-file/folder-naming-convention: error'`   | Wave 0 (ESLint rule) |
| ARCH-01-c | Component files use PascalCase    | lint            | `npx eslint frontend/src/components/ --rule 'check-file/filename-naming-convention: error'` | Wave 0 (ESLint rule) |
| ARCH-01-d | Backend services use kebab-case   | lint            | `npx eslint backend/src/services/ --rule 'check-file/filename-naming-convention: error'`    | Wave 0 (ESLint rule) |
| ARCH-01-e | No broken imports after renames   | build           | `pnpm build`                                                                                | Existing             |
| ARCH-01-f | No orphaned exports after renames | static analysis | `pnpm knip`                                                                                 | Existing             |

### Sampling Rate

- **Per task commit:** `pnpm build` (catches broken imports immediately)
- **Per wave merge:** `pnpm build && pnpm test && pnpm knip`
- **Phase gate:** Full suite green + ESLint filename rules pass on all directories

### Wave 0 Gaps

- [ ] Install `eslint-plugin-check-file` -- `pnpm add -D eslint-plugin-check-file`
- [ ] Add filename/folder rules to `eslint.config.mjs` (see Architecture Patterns section)
- [ ] Verify rules pass AFTER all renames (add rules in enforcement layer, not before renames)

## State of the Art

| Old Approach                        | Current Approach               | When Changed    | Impact                                                |
| ----------------------------------- | ------------------------------ | --------------- | ----------------------------------------------------- |
| eslint-plugin-filenames             | eslint-plugin-check-file       | 2024            | Old plugin abandoned, no ESLint 9 support             |
| Manual naming conventions in README | ESLint-enforced filename rules | 2023+           | Automated enforcement prevents regression             |
| Single git mv on macOS              | Two-step rename via temp name  | Always on macOS | Required for case-only renames on case-insensitive FS |

## Open Questions

1. **eslint-plugin-check-file `ignoreMiddleExtensions` behavior**
   - What we know: The plugin supports `ignoreMiddleExtensions: true` to handle `.test.ts`, `.types.ts` patterns
   - What's unclear: Exact behavior with `.service.ts` suffix pattern (is `auth.service.ts` treated as KEBAB_CASE?)
   - Recommendation: Test locally after install. If `.service.ts` suffix causes issues, use custom regex pattern instead of built-in KEBAB_CASE.

2. **Standalone component file count accuracy**
   - What we know: 37 files found at `frontend/src/components/` root
   - What's unclear: Some may be duplicates across directories (2 `AfterActionForm.tsx` and 2 `AttachmentUploader.tsx` seen)
   - Recommendation: Deduplicate before moving. Knip may have already flagged these.

## Project Constraints (from CLAUDE.md)

- **RTL enforcement:** ESLint RTL rules in `no-restricted-syntax` must not be disrupted by config changes
- **UI component wrappers:** `frontend/src/components/ui/` is exempt from filename rules (D-07, already in ESLint ignore for `no-restricted-syntax`)
- **No barrel exports:** D-03 forbids `index.ts` files in component directories
- **Build verification:** `pnpm build` is the typecheck mechanism (not `tsc --noEmit`) due to 1600+ pre-existing strict violations
- **Knip configuration:** `knip.json` ignores `src/components/ui/heroui-*.tsx` and `src/components/ui/*.tsx` -- must remain
- **Pre-commit hooks:** husky + lint-staged enforcing ESLint + Prettier on staged files + `pnpm build` + `pnpm knip` on full project
- **Semicolons off, single quotes, trailing commas all, 100 char line width, 2 space indent**
- **git mv mandatory** for all renames (D-09)

## Sources

### Primary (HIGH confidence)

- Codebase audit: Direct file listing and grep analysis of all naming patterns
- `eslint.config.mjs`: Read in full -- current ESLint 9 flat config with RTL rules, workspace overrides
- `knip.json`: Read in full -- workspace configuration with UI component ignores
- `package.json`: lint-staged configuration, dependency versions
- Phase 1 summary (`01-03-SUMMARY.md`): Pre-commit hook setup details

### Secondary (MEDIUM confidence)

- [eslint-plugin-check-file GitHub](https://github.com/dukeluo/eslint-plugin-check-file) -- v3.3.1, ESLint 9 flat config support confirmed
- [eslint-plugin-check-file npm](https://www.npmjs.com/package/eslint-plugin-check-file) -- Version and peer dependency verification
- [filename-naming-convention docs](https://github.com/DukeLuo/eslint-plugin-check-file/blob/main/docs/rules/filename-naming-convention.md) -- Rule configuration
- [folder-naming-convention docs](https://github.com/DukeLuo/eslint-plugin-check-file/blob/main/docs/rules/folder-naming-convention.md) -- Folder rule configuration

### Tertiary (LOW confidence)

- `ignoreMiddleExtensions` exact behavior with `.service.ts` suffix -- needs local testing

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - eslint-plugin-check-file v3.3.1 verified on npm, ESLint 9 peerDependency confirmed
- Architecture: HIGH - Complete codebase audit with exact file counts and import reference counts
- Pitfalls: HIGH - macOS case-insensitivity and import breakage are well-documented issues; verified against actual codebase
- Rename inventory: HIGH - Based on direct filesystem audit, not estimation

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable domain -- naming conventions don't change rapidly)
