# Phase 48: Lint & Config Alignment — Pattern Map

**Mapped:** 2026-05-11
**Files analyzed:** 13 modified / 4 deleted / 2 created (plus 2 ephemeral smoke branches + 1 git tag)
**Analogs found:** 17 / 17 (every file has a closest analog inside Phase 47 or the live root config)

The driving insight: **Phase 48 is the symmetric twin of Phase 47.** Phase 47 split type-check into its own CI job, drove tsc to zero per workspace, and added `type-check` to branch protection. Phase 48 does the same shape — but for lint — with three structural differences:

- Lint is **already** its own CI job (no job-split needed; D-14 keeps single job).
- The fix surface is **smaller** (228 problems vs 1580) and dominated by config-level carve-outs, not source edits.
- A **shadow config** (`frontend/eslint.config.js`) must be deleted before the baseline becomes meaningful — there is no Phase-47 analog for this step.

Every other moving part — phase-base git tag, smoke-PR mechanics, branch-protection PUT, suppression diff scan, parallel-by-workspace plan posture, single-source-of-truth root config — is a verbatim lift from Phase 47's 47-01 / 47-02 / 47-03 plans.

## File Classification

| File                                                                                | Role             | Data Flow              | Closest Analog                                                                                                                                          | Match Quality                                   |
| ----------------------------------------------------------------------------------- | ---------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `eslint.config.mjs` (modify)                                                        | config           | transform              | self (current shape) + `frontend/eslint.config.js` (shape donor for `no-restricted-imports`)                                                            | exact (self-edit)                               |
| `frontend/eslint.config.js` (delete)                                                | config           | —                      | `.planning/phases/47-type-check-zero/47-01-PLAN.md` Task 2 (`database.types.ts` allowlist via single targeted edit)                                     | role-match (deletion = surgical config removal) |
| `frontend/package.json` `lint` script (modify)                                      | config / build   | command-string         | `frontend/package.json` `type-check:summary` script (Phase 47 addition) + existing `type-check` script line 19                                          | exact                                           |
| `backend/package.json` `lint` script (modify)                                       | config / build   | command-string         | `backend/package.json` `type-check:summary` script (Phase 47 addition) + existing `type-check` script line 15                                           | exact                                           |
| `turbo.json` `globalDependencies` (modify)                                          | config / build   | dependency-graph       | `turbo.json` lines 3, 22 (existing `globalDependencies` + `type-check` task shape)                                                                      | exact (self-extend)                             |
| `.github/workflows/ci.yml` (verify-only / minimal touch)                            | config / CI      | gate                   | `47-03-ci-gate-and-branch-protection-PLAN.md` Task 2 (CI YAML edit shape)                                                                               | role-match (verify-only vs full edit)           |
| `frontend/src/components/ai/ChatMessage.tsx` (4 rtl-friendly fixes)                 | component        | transform              | self (lines 84–86 are the only edit site) + existing logical-property usage elsewhere in same file (line 92 `ms-1`)                                     | exact (in-file analog)                          |
| `backend/src/services/event.service.ts:48` (empty interface → type alias)           | service          | transform              | RESEARCH §7.6 + typescript-eslint canonical recipe                                                                                                      | role-match                                      |
| `backend/src/services/signature.service.ts:353` (console.log → logger.info)         | service          | event-driven (logging) | `backend/src/ai/embeddings-service.ts:69, 92, 98` + `backend/src/ai/mastra-config.ts:42, 53` (8 verified Winston call sites)                            | exact                                           |
| `backend/src/types/contact-directory.types.ts` (path-add to ignores, NOT file edit) | type / generated | —                      | `eslint.config.mjs:19` existing `**/database.types.ts` entry in `ignores:`                                                                              | exact                                           |
| ~12 test files using `require()` (frontend)                                         | test             | transform              | `frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx:11–21` (canonical `vi.importActual` shape)                                      | exact                                           |
| 2 test files using physical Tailwind in fixture strings                             | test             | transform              | RESEARCH §7.3 + `CLAUDE.md` RTL-Safe class table                                                                                                        | role-match                                      |
| 3 files with 9 stale `eslint-disable` directives                                    | source           | transform              | RESEARCH §7.5 (pure deletion; no analog needed)                                                                                                         | role-match                                      |
| `frontend/src/components/FirstRun/FirstRunModal.tsx` (1 unused import)              | component        | transform              | Phase 47 D-03 deletion-as-default posture                                                                                                               | role-match                                      |
| Orphan deletes: `3d-card.tsx`, `bento-grid.tsx`, `floating-navbar.tsx`              | component        | —                      | RESEARCH §10 + zero-importer grep evidence                                                                                                              | role-match                                      |
| Smoke PRs `chore/test-lint-gate-{frontend,backend}` (ephemeral)                     | CI proof         | —                      | `47-03-ci-gate-and-branch-protection-PLAN.md` Task 5 (verbatim mechanics; only trip-wire differs)                                                       | exact                                           |
| `phase-48-base` git tag                                                             | infra / audit    | —                      | `47-01-frontend-type-fix-PLAN.md` Task 1 step 0 (verbatim — `git rev-parse phase-47-base 2>/dev/null \|\| git tag phase-47-base $(git rev-parse HEAD)`) | exact                                           |
| `pnpm lint:summary` script (discretionary)                                          | config / build   | command-string         | `frontend/package.json:20` `type-check:summary` script                                                                                                  | exact                                           |

## Pattern Assignments

### `eslint.config.mjs` (root, modify) — config / transform

**Analog:** self (current 354-line file is the authoritative shape) + `frontend/eslint.config.js` lines 42–63 (shape donor for `no-restricted-imports`, with semantics inverted per D-05/D-06).

**Imports pattern** (lines 1–8, unchanged):

```js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import checkFile from 'eslint-plugin-check-file'
import rtlFriendly from 'eslint-plugin-rtl-friendly'
import eslintConfigPrettier from 'eslint-config-prettier'
```

No new imports needed — `eslint`'s built-in `no-restricted-imports` rule (D-06) and `eslintConfigPrettier` (already last in array, line 353) are sufficient.

**Ignores-extension pattern** (D-03 + D-13 — extend the existing block at lines 11–24):

```js
// Closest analog: lines 13–23 (the existing ignores array)
ignores: [
  '**/dist/**',
  '**/node_modules/**',
  '**/coverage/**',
  'specs/**',
  '**/*.generated.*',
  '**/database.types.ts',
  '**/contact-directory.types.ts',      // ← add (D-13; mirrors the **/database.types.ts row above — both are supabase-generated)
  '**/routeTree.gen.ts',
  'frontend/design-system/inteldossier_handoff_design/**',   // ← add (D-03 prototype handoff)
  '.husky/**',
  '**/.!*',
],
```

**Why this analog is right:** `**/database.types.ts` (line 19) is the canonical "supabase-generated file we never lint" pattern. `**/contact-directory.types.ts` is the same shape for the same reason (line-1 self-description: `// @ts-nocheck — auto-generated by supabase gen types typescript --schema contact_directory`). RESEARCH §6 confirms the provenance.

**`no-restricted-imports` block pattern** (D-05 inversion / D-06 new rule — add to the **frontend override block** at lines 69–153):

Source shape lifted from `frontend/eslint.config.js:42–63` (the file being deleted) — keep the JSON skeleton, invert the policy.

Donor shape (DO NOT KEEP — being deleted):

```js
// frontend/eslint.config.js lines 42–63 — DONOR for JSON shape only; semantics are reversed
'no-restricted-imports': [
  'warn',
  {
    patterns: [
      { group: ['@/components/ui/card'],
        message: '💡 UI Library: Consider using 3d-card or bento-grid from Aceternity...' },
      // ...
    ],
  },
],
```

New shape to add inside `files: ['frontend/**/*.{ts,tsx}']` block (after line 97 `@typescript-eslint/no-empty-object-type: 'off'`, before line 100 `no-restricted-syntax`):

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

**Per-scope rule carve-out pattern** (extend existing — for `**/__tests__/**` naming exclusion per RESEARCH §8.5):

Analog at `eslint.config.mjs:200–223` (the frontend components naming block already excludes `frontend/src/components/__tests__/**`):

```js
// EXISTING SHAPE — lines 200–223 (extend pattern)
{
  files: ['frontend/src/components/**/*.{ts,tsx}'],
  ignores: [
    'frontend/src/components/ui/**',
    'frontend/src/components/__tests__/**',       // ← existing; shallow
    'frontend/src/components/**/__tests__/**',    // ← ADD (RESEARCH §8.5 — extends to deep __tests__ folders)
    'frontend/src/components/**/index.ts',
  ],
  plugins: { 'check-file': checkFile },
  rules: { ... },
},
```

**Apply the same pattern** to the four other `check-file/*` blocks (lines 240–253 frontend hooks, 256–268 frontend types, 270–283 frontend lib, 285–305 backend services, 308–320 backend models, 322–335 backend api, 337–350 backend middleware) — each gets a `'**/__tests__/**'` entry in its `ignores:` with inline rationale: `// __tests__ is vitest convention; PascalCase rule applies to production source, not test colocation.`

**TODO(Phase 2+) preservation** (D-09) — every `// TODO(Phase 2):` / `// TODO(Phase 2+):` comment at lines 46, 58, 76, 78, 81, 83, 85, 88, 90, 183, 185, 187, 189 stays byte-unchanged. The rationale-inline-with-rule pattern is the source of truth for the future hardening phase's input list.

---

### `frontend/eslint.config.js` (delete) — config

**Analog:** Phase 47 47-01 Task 2 (`database.types.ts` allowlist — a targeted, surgical edit on a single file, fully justified by inline file rationale). For Phase 48 the parallel is a _deletion_ rather than an _edit_, but the surgical-change principle (Karpathy §3) is identical.

**Deletion command:**

```bash
git rm frontend/eslint.config.js
```

**Confirmed safe coupling** (RESEARCH §8.1 verified):

- No `.vscode/settings.json` or IDE config references the file.
- `.husky/pre-commit` runs lint-staged without `-c` (resolves closest config — root after deletion).
- `pnpm-lock.yaml` and `package.json` files don't reference it.

**Why the file is harmful, not just stale** (RESEARCH §1 item 6 + RESEARCH §6 item 6): the current `no-restricted-imports` block at lines 42–63 _actively recommends Aceternity_ in its rule message. This is a positive misdirection in code review, not a missing fix.

---

### `frontend/package.json` `lint` script (modify) — config / build

**Analog:** `frontend/package.json:20` — the `type-check:summary` script added in Phase 47.

Existing shape (line 17):

```json
"lint": "eslint src/**/*.{ts,tsx}",
```

New shape (D-02 + D-11 — explicit config + max-warnings):

```json
"lint": "eslint -c ../eslint.config.mjs --max-warnings 0 src/**/*.{ts,tsx}",
```

**Why this analog is right:** the `type-check:summary` line (added by Phase 47 47-01 Task 1) is the closest in-file example of a workspace `package.json` script being augmented with an explicit flag pattern for CI use. Same shape, same surrounding scripts, same workspace.

**Discretionary** (per CONTEXT Claude's discretion item 4) — add a `lint:summary` script next to the existing `type-check:summary` at line 20:

```json
"lint:summary": "eslint -c ../eslint.config.mjs src/**/*.{ts,tsx} 2>&1 | grep -oE '[a-z\\-]+/[a-z\\-]+' | sort | uniq -c | sort -rn || true",
```

(Same `|| true` exit-code-rescue pattern as Phase 47's `type-check:summary`.)

---

### `backend/package.json` `lint` script (modify) — config / build

**Analog:** `backend/package.json:16` — symmetric `type-check:summary` script.

Existing shape (line 13):

```json
"lint": "eslint src/**/*.ts",
```

New shape (D-02 + D-11):

```json
"lint": "eslint -c ../eslint.config.mjs --max-warnings 0 src/**/*.ts",
```

Symmetric with frontend — both workspaces follow identical shape. Phase 47 set this precedent for `type-check:summary` (both workspaces got the same script with identical body).

---

### `turbo.json` `globalDependencies` (modify) — config / build

**Analog:** self (lines 3, 19–21 — the existing `globalDependencies` array and `lint` task).

Existing shape (line 3):

```json
"globalDependencies": ["**/.env.*local"],
```

New shape (RESEARCH §11.3 recommendation):

```json
"globalDependencies": ["**/.env.*local", "eslint.config.mjs"],
```

**Why:** turbo will not invalidate workspace `lint` cache when the root `eslint.config.mjs` changes unless it is in `globalDependencies`. After the consolidation (single source of truth at root), this is the only signal turbo has that the lint task depends on the root config.

---

### `.github/workflows/ci.yml` (verify-only) — config / CI gate

**Analog:** `.github/workflows/ci.yml` lines 43–64 (the existing `lint` job — runs `pnpm run lint`, gated by `repo-policy`).

**Verbatim from the live workflow** (lines 43–64):

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

**No YAML changes required** (D-14 single-job posture + RESEARCH §11.1) — the job already invokes `pnpm run lint`, which is `turbo run lint`, which parallel-fans-out to the workspace scripts whose change in `--max-warnings 0` and `-c` flags happens entirely in the workspace `package.json` files. The CI YAML side is verify-only.

**Contrast with Phase 47 47-03 Task 2** (the _full-edit_ analog): that task inserted a brand-new `type-check` job, deleted the redundant `tsc` step, and updated four downstream `needs:` arrays. Phase 48 has no equivalent — the `lint` job exists, the downstream `needs:` already include `lint` (and `type-check` from Phase 47), and no new job is added.

---

### `frontend/src/components/ai/ChatMessage.tsx` (4 rtl-friendly conversions) — component / transform

**Analog:** self — same file, line 92 already uses `ms-1` (logical margin-start). The 3 lines of physical-property usage at 84–86 are the outliers.

**Existing context** (lines 81–95 verbatim from Read):

```tsx
<div
  className={cn(
    'rounded-2xl px-4 py-3',
    isUser ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md',
    isRTL && isUser && 'rounded-br-2xl rounded-bl-md',
    isRTL && !isUser && 'rounded-bl-2xl rounded-br-md',
  )}
>
  <p className={cn('text-sm whitespace-pre-wrap', isStreaming && 'animate-pulse')}>
    {content}
    {isStreaming && <span className="inline-block w-1.5 h-4 ms-1 bg-current animate-pulse" />}
  </p>
</div>
```

**Fix recipe** (RESEARCH §7.4 + Tailwind v4 logical border-radius):
| Physical | Logical (RTL-safe) |
|----------|--------------------|
| `rounded-bl-*` | `rounded-es-*` (end-start) |
| `rounded-br-*` | `rounded-ee-*` (end-end) |

After conversion lines 84–86 become:

```tsx
isUser ? 'bg-primary text-primary-foreground rounded-ee-md' : 'bg-muted rounded-es-md',
isRTL && isUser && 'rounded-ee-2xl rounded-es-md',
isRTL && !isUser && 'rounded-es-2xl rounded-ee-md',
```

**Caveat:** `forceRTL` already handles direction in this codebase (per CLAUDE.md RTL rules) — the `isRTL && ...` branches may become redundant after the logical-property migration. Resolve by either (a) keeping both branches with logical classes (mechanical fix, no behavior change), or (b) collapsing to a single branch since logical classes auto-flip. Per Karpathy §3 (surgical changes), **option (a)** is the lint-zero path; option (b) is a separate refactor.

---

### `backend/src/services/event.service.ts:48` — service / transform

**Analog:** RESEARCH §7.6 (typescript-eslint canonical recipe). No in-repo analog needed because the fix is a 1-line type-system swap.

**Existing context** (line 48 verbatim from Read):

```ts
export interface UpdateEventDto extends Partial<CreateEventDto> {}
```

**Fix:**

```ts
export type UpdateEventDto = Partial<CreateEventDto>
```

**Verification:** `pnpm --filter intake-backend type-check` must stay at zero after the swap (Phase 47 baseline).

---

### `backend/src/services/signature.service.ts:353` — service / event-driven (logging)

**Analog:** `backend/src/ai/embeddings-service.ts:69, 92, 98` + `backend/src/ai/mastra-config.ts:42, 53` + `backend/src/middleware/auth.ts:5` + `backend/src/middleware/rate-limit.middleware.ts:5` (verified Winston usage sites).

**Two idiomatic shapes exist in backend/src** (verified via grep):

**Shape A — direct `logger.info` call** (used in `backend/src/ai/*`):

```ts
import { logger } from '../utils/logger'
// ...
logger.info('Embeddings service initialized', { provider, model })
logger.info(`Agent ${config.name} registered`)
```

**Shape B — helper function `logInfo` / `logError`** (used in middleware):

```ts
// backend/src/middleware/auth.ts:5
import { logInfo, logError } from '../utils/logger'
// ...
logInfo('User authenticated', { userId })
```

**Both shapes are exported from `backend/src/utils/logger.ts`** — line 85 defines `export const logInfo = (message: string, meta?: any) => { logger.info(message, meta) }`. The underlying `logger` instance is also exported.

**Pick Shape B** (`logInfo` helper) because it dominates in middleware (the closest functional analog — both middleware and service-layer code path through `signature.service.ts` are I/O-adjacent notification points). Either shape is correct.

**Existing context** (line 353 verbatim from Read):

```ts
console.log(`Notifying ${contact.email} about signature request`)
```

**Fix:**

```ts
// 1. Add to imports at top of file (currently lines 1–2):
import { logInfo } from '../utils/logger'

// 2. Replace line 353:
logInfo(`Notifying ${contact.email} about signature request`)
```

(Drop the trailing `;` to match the project's no-semicolons Prettier config per CLAUDE.md §"Code Style". Verify file's current style first — signature.service.ts uses `;` per the existing line, so keep `;` if mid-file style is consistent.)

---

### `backend/src/types/contact-directory.types.ts` — type / generated (path-add only, no file edit)

**Analog:** `eslint.config.mjs:19` — the existing `**/database.types.ts` entry in the `ignores:` array.

**Why** (RESEARCH §6 verbatim from file Read of line 1):

```
// @ts-nocheck — auto-generated by `supabase gen types typescript --schema contact_directory`. Regenerated on schema migrations; do not hand-edit.
```

The file is a sibling of `database.types.ts` — same Supabase generator, same regeneration cycle, same disposition. Phase 47 47-EXCEPTIONS.md `## Retained suppressions (TYPE-04 ledger)` already covers this file's `@ts-nocheck` directive.

**Action:** add `**/contact-directory.types.ts` to the root `ignores:` block (see the `eslint.config.mjs` ignores-extension pattern above). **Do NOT remove the `@ts-nocheck` directive** — it would be erased on the next `supabase gen types` regen anyway.

---

### Test files with `require()` calls (~12 errors across ~7 files) — test / transform

**Analog:** `frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx:11–21` (verbatim canonical `vi.importActual` shape — already passing lint).

**Verified analog excerpt** (lines 11–21):

```ts
vi.mock('@/design-system/hooks', async (): Promise<typeof import('@/design-system/hooks')> => {
  const actual =
    await vi.importActual<typeof import('@/design-system/hooks')>('@/design-system/hooks')
  return {
    ...actual,
    useLocale: (): { locale: 'ar' | 'en'; setLocale: (l: 'ar' | 'en') => void } => ({
      locale: 'en',
      setLocale: vi.fn(),
    }),
  }
})
```

**Violation site shape** (verified via Read at `useDraftMigration.test.ts`):

```ts
// BEFORE — fails @typescript-eslint/no-require-imports
const { migrateLegacyDraft } = require('../useDraftMigration')
localStorage.setItem(/* ... */)
migrateLegacyDraft()
```

**Two valid fix shapes** (per RESEARCH §7.2):

Shape A — top-of-file static import (preferred when there's no `vi.mock` factory):

```ts
import { migrateLegacyDraft } from '../useDraftMigration'

beforeEach(() => {
  localStorage.clear()
})

it('should migrate old draft when type field exists', () => {
  localStorage.setItem(/* ... */)
  migrateLegacyDraft()
  // ...
})
```

Shape B — `vi.importActual` inside `vi.mock` factory (when mocking is required):

```ts
import * as draftMigrationModule from '../useDraftMigration'

vi.mock('../useDraftMigration', async () => {
  const actual =
    await vi.importActual<typeof import('../useDraftMigration')>('../useDraftMigration')
  return { ...actual, useDraftMigration: vi.fn() }
})
```

**Per-file disposition** (RESEARCH §3 Detail block — 7 files, 12 errors):
| File | Lines | Shape |
|------|-------|-------|
| `components/dossier/wizard/__tests__/CreateWizardShell.test.tsx` | 5, 15 | B (vi.mock factory present) |
| `components/dossier/wizard/__tests__/SharedBasicInfoStep.test.tsx` | 5 | B |
| `components/dossier/wizard/hooks/__tests__/useCreateDossierWizard.test.ts` | 5 | B |
| `components/dossier/wizard/hooks/__tests__/useDraftMigration.test.ts` | 9, 24, 37, 52, 67 | **A** (no mock factory; just static-importing the SUT) |
| `components/signature-visuals/__tests__/GlobeLoader.reducedMotion.test.tsx` | 19 | TBD — executor verifies |
| `components/signature-visuals/__tests__/GlobeLoader.rotation.test.tsx` | 20 | TBD |
| `components/signature-visuals/__tests__/GlobeLoader.test.tsx` | 13 | TBD |

---

### Test files with physical Tailwind in fixture strings (8 errors / 2 files) — test / transform

**Analog:** RESEARCH §7.3 + CLAUDE.md §"Arabic RTL Support Guidelines (MANDATORY)" RTL-Safe class table.

**Files:**

- `components/dossier/__tests__/DossierShell.test.tsx:10` — uses `ml-`, `mr-`, `pl-`, `pr-`
- `pages/dossiers/__tests__/CreateDossierHub.test.tsx:67` — uses `ml-`, `mr-`, `text-left`, `text-right`

**Mechanical conversion table** (from CLAUDE.md verbatim):
| Physical | Logical |
|----------|---------|
| `ml-*` | `ms-*` |
| `mr-*` | `me-*` |
| `pl-*` | `ps-*` |
| `pr-*` | `pe-*` |
| `text-left` | `text-start` |
| `text-right` | `text-end` |

Same conversion the production-code lint rule (`no-restricted-syntax` lines 101–151 of `eslint.config.mjs`) mandates. Test fixtures should match what production code emits, so the fix is correctness, not just lint-quieting.

---

### Stale `eslint-disable` directives (9 warnings / 3 files) — source / transform

**Analog:** RESEARCH §7.5 (pure deletion). No code analog needed.

**Files** (verified RESEARCH §3 detail):

- `components/activity-feed/__tests__/ActivityList.test.tsx:51` — suppressing `@typescript-eslint/no-non-null-assertion`
- `components/signature-visuals/GlobeLoader.tsx:69, 89, 97, 108, 110, 123, 125` — 7× suppressing `@typescript-eslint/no-explicit-any`
- `domains/work-items/hooks/useWorkItemDossierLinks.ts:66` — suppressing `@typescript-eslint/no-explicit-any`

**Action:** delete the `// eslint-disable-next-line ...` line. These suppressions point at rules that the root config has disabled per D-09 — they are no-ops, and ESLint warns about them.

**Why this satisfies D-17** (Phase 47 D-01 carry-forward — zero net-new `eslint-disable`): deletions reduce the count, by definition; D-17 forbids net-new additions, not deletions of stale ones.

---

### `frontend/src/components/FirstRun/FirstRunModal.tsx` (1 unused import) — component / transform

**Analog:** Phase 47 D-03 deletion-as-default posture (RESEARCH §7.1). No code analog needed — the fix is a single-line deletion.

**Action:** delete the unused import line. No `_`-prefix renaming (D-12 + Phase 47 D-03 carry-forward).

---

### Orphan Aceternity wrapper deletions — component

**Files** (D-07, RESEARCH §10):

- `frontend/src/components/ui/3d-card.tsx`
- `frontend/src/components/ui/bento-grid.tsx`
- `frontend/src/components/ui/floating-navbar.tsx`

**Importer audit** (RESEARCH §10 [VERIFIED]): zero TypeScript/JSX importers in `frontend/src`. Only mentions are in `frontend/src/components/ui/COMPONENT_REGISTRY.md` (a markdown doc, informational, not a source import) and in the files themselves.

**Deletion command:**

```bash
git rm frontend/src/components/ui/3d-card.tsx \
       frontend/src/components/ui/bento-grid.tsx \
       frontend/src/components/ui/floating-navbar.tsx
```

**Forward-looking ban** (D-08): `link-preview` is included in the `no-restricted-imports` banned-paths list even though no such file exists on disk — preventive, no deletion needed.

**Files NOT in the deletion list** (per D-07): `floating-action-button.tsx` (imported by `pages/forums/ForumsPage.tsx`) and `floating-dock.tsx` (not in the Aceternity ban list per CLAUDE.md) stay.

---

### Smoke PRs `chore/test-lint-gate-{frontend,backend}` (ephemeral) — CI proof

**Analog:** `47-03-ci-gate-and-branch-protection-PLAN.md` Task 5 (verbatim mechanics).

**Verbatim pattern from 47-03 Task 5** (with frontend trip-wire swapped per RESEARCH §13.2 ASSUMED caveat):

```bash
# FRONTEND
git fetch origin main
git checkout -b chore/test-lint-gate-frontend origin/main

# Inject deliberate JSX className violation (text-left → triggers no-restricted-syntax)
# Per RESEARCH §13.2: the rule matches Literal nodes, so we need a real JSX className string,
# not a comment. Use this exact shape:
cat >> frontend/src/App.tsx << 'TSX'
const _smokeTest = <div className="text-left">x</div>
TSX

git add frontend/src/App.tsx
git commit -m "chore: smoke-test lint gate frontend (DO NOT MERGE)"
git push -u origin chore/test-lint-gate-frontend

gh pr create --base main \
  --title "chore: smoke-test lint gate frontend (DO NOT MERGE)" \
  --body "LINT-09 verification per CONTEXT D-16. Injects one lint error to confirm the lint gate blocks merges. Will be closed without merging."

PR_FE=$(gh pr view --json number -q .number)
gh pr checks $PR_FE --watch

# REQUIRED assertions (verbatim from 47-03 Task 5 — only check name differs):
gh pr checks $PR_FE --json name,state,bucket --jq '.[] | select(.name=="Lint") | .bucket'  # MUST return "fail"
gh pr view $PR_FE --json mergeStateStatus -q .mergeStateStatus                              # MUST return "BLOCKED"

# Close
gh pr close $PR_FE --delete-branch
```

```bash
# BACKEND — analogous; trip-wire is unambiguous console.log
git fetch origin main
git checkout -b chore/test-lint-gate-backend origin/main

printf '\nconsole.log("smoke-test")\n' >> backend/src/index.ts

git add backend/src/index.ts
git commit -m "chore: smoke-test lint gate backend (DO NOT MERGE)"
git push -u origin chore/test-lint-gate-backend

gh pr create --base main \
  --title "chore: smoke-test lint gate backend (DO NOT MERGE)" \
  --body "LINT-09 verification (backend half) per CONTEXT D-16."

PR_BE=$(gh pr view --json number -q .number)
gh pr checks $PR_BE --watch
gh pr checks $PR_BE --json name,state,bucket --jq '.[] | select(.name=="Lint") | .bucket'  # MUST return "fail"
gh pr view $PR_BE --json mergeStateStatus -q .mergeStateStatus                              # MUST return "BLOCKED"
gh pr close $PR_BE --delete-branch
```

**Three Phase-47-encoded invariants** carry forward verbatim:

1. **`mergeStateStatus = BLOCKED`**, not `mergeable = false` (47-03 Issue 2 fix — `mergeable: "MERGEABLE"` returns true for branches without git conflicts even when required checks fail).
2. **Branch name prefix `chore/test-lint-gate-*`** (visible "DO NOT MERGE" naming; 47-03 Task 5 T-47-03 mitigation).
3. **`gh pr close --delete-branch`** is the safe disposition (T-47-03 mitigation).

---

### `phase-48-base` git tag — infra / audit

**Analog:** `47-01-frontend-type-fix-PLAN.md:171–177` (Task 1 step 0 verbatim).

**Verbatim shape:**

```bash
# Wave 0, FIRST STEP — capture phase base SHA via git tag (Issue 4 fix; precedes all other work in the phase)
git rev-parse phase-48-base 2>/dev/null || git tag phase-48-base $(git rev-parse HEAD)
git push origin phase-48-base 2>/dev/null || true
```

**Why** (RESEARCH §19 Wave 0 Gaps): the D-17 net-new `eslint-disable` count scan requires `git diff phase-48-base..HEAD`. Without the tag, the diff falls back to the unreliable `git merge-base main HEAD`, which collapses to empty after the phase's PRs merge into `main`.

**Acceptance criterion** (mirrors 47-01 Task 1 line 207): `git rev-parse phase-48-base` returns a valid SHA before any other Phase 48 work begins.

---

### Branch-protection update (D-15, 48-03 plan) — GitHub API call

**Analog:** `47-03-ci-gate-and-branch-protection-PLAN.md` Task 4 (verbatim PUT pattern + read-then-merge-then-write).

**Verbatim from RESEARCH §12.2 (which itself lifts 47-03 Task 4):**

```bash
# 1. SNAPSHOT (read-then-merge-then-write Step 1 — T-47-01 mitigation lift)
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  > /tmp/48-03-protection-before.json

# 2. PUT — adds "Lint" to existing contexts ["type-check", "Security Scan"]
#    (current state VERIFIED 2026-05-11 via RESEARCH §12.1)
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

# 3. VERIFY
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks \
  --jq '.contexts | sort'
# Expected: ["Lint","Security Scan","type-check"]
```

**Key invariants from Phase 47 47-03 Task 4:**

1. **Read-then-merge-then-write** — GET-save-PUT-verify-diff. Current contexts (`["type-check", "Security Scan"]`) MERGED with `"Lint"`, not replaced (T-47-01 mitigation).
2. **`enforce_admins: true`** stays (CONTEXT D-15 + Phase 47 D-09 carry-forward).
3. **Body trimmed to minimum-required GitHub REST spec** — drop `lock_branch`, `allow_fork_syncing`, `required_linear_history`, etc. (47-03 Task 4 "Issue 5 fix" — some repo tiers reject these).
4. **Casing is exact** — `"Lint"` (capital L) matches `name: Lint` at `.github/workflows/ci.yml:44` (RESEARCH §17.3 pitfall).

---

### D-17 net-new `eslint-disable` scan — audit

**Analog:** `47-03-ci-gate-and-branch-protection-PLAN.md` Task 6 (TYPE-04 reconciliation; verbatim diff-scan shape, only the grep pattern differs).

**Verbatim from RESEARCH §19 (which lifts 47-03 Task 6):**

```bash
git rev-parse phase-48-base   # MUST return a SHA — fails fast if tag missing

git diff phase-48-base..HEAD -- 'frontend/src' 'backend/src' \
  | grep -E '^\+.*eslint-disable' \
  | grep -vE '^\+\+\+' \
  > /tmp/48-03-eslint-disable-additions.txt

wc -l < /tmp/48-03-eslint-disable-additions.txt   # MUST return 0
```

**Adapted from Phase 47 shape** — the only delta is the grep pattern: `@ts-(ignore|expect-error)` → `eslint-disable`. Same `phase-N-base..HEAD` diff window, same `'^\+'` (added lines only) + `'^\+\+\+'` (drop diff headers) filter, same exit-on-non-zero acceptance criterion.

---

## Shared Patterns

### Phase-base git tag for diff audits

**Source:** `47-01-frontend-type-fix-PLAN.md:171–177` (Task 1 step 0) + `47-03-ci-gate-and-branch-protection-PLAN.md:464–466` (Task 6 reference)
**Apply to:** Wave 0 of Phase 48 (first plan's first task). Created once, referenced by D-17 audit + any other phase-wide diff scan.

```bash
git rev-parse phase-48-base 2>/dev/null || git tag phase-48-base $(git rev-parse HEAD)
git push origin phase-48-base 2>/dev/null || true
```

The `2>/dev/null || ...` guard makes the command idempotent — safe to re-run if multiple plans race to set up at the start of the phase (47-01 and 47-02 used this pattern in parallel).

### Read-then-merge-then-write for branch-protection updates

**Source:** `47-03-ci-gate-and-branch-protection-PLAN.md` Task 4 + T-47-01 STRIDE entry
**Apply to:** 48-03 plan (the only plan that touches GitHub repo settings)

```bash
# Step 1: snapshot
gh api repos/<owner>/<repo>/branches/main/protection > /tmp/<phase>-protection-before.json

# Step 2: build PUT body that MERGES new contexts with existing ones
#         (re-read .required_status_checks.contexts before constructing the body)

# Step 3: PUT, then verify
gh api -X PUT ... --input - <<JSON ... JSON
gh api .../required_status_checks --jq '.contexts | sort'
```

Phase 48's current state per RESEARCH §12.1 [VERIFIED 2026-05-11]: `contexts = ["type-check","Security Scan"]`. PUT body must produce `["Lint","Security Scan","type-check"]`.

### Smoke-PR proof-of-block

**Source:** `47-03-ci-gate-and-branch-protection-PLAN.md` Task 5 + RESEARCH §13
**Apply to:** 48-03 plan, two smoke PRs (one per workspace)

Three load-bearing invariants:

1. Branch name `chore/test-<gate>-gate-<workspace>` — visible "DO NOT MERGE" naming (T-47-03 mitigation).
2. Assertion: `gh pr view <PR> --json mergeStateStatus -q .mergeStateStatus` returns `"BLOCKED"` — **not** `gh pr view --json mergeable` (47-03 Issue 2 fix).
3. Disposition: `gh pr close <PR> --delete-branch` — close, never merge.

### Parallel-by-workspace plan posture

**Source:** Phase 47 D-06 + the 47-01 (frontend) / 47-02 (backend) plan structure
**Apply to:** Phase 48 may mirror with 48-01 (config-consolidation) + 48-02-frontend / 48-02-backend (violation-fixes split) + 48-03 (ci-gate). RESEARCH §1 primary recommendation suggests three plans (48-01 config, 48-02 violations, 48-03 ci-gate) instead — both shapes are valid per CONTEXT Claude's-discretion item 2.

The Phase 47 precedent established that **wave-1 plans can run in parallel** as long as their file-modified globs are disjoint, and **a wave-2 sequential plan (47-03 / 48-03)** handles CI gate flipping AFTER both workspaces are at zero.

### Per-scope rule carve-out shape

**Source:** `eslint.config.mjs:200–223` (the existing frontend components naming block) + 167–174 (the existing UI primitives carve-out)
**Apply to:** every `check-file/*` block in `eslint.config.mjs` that needs `**/__tests__/**` excluded (RESEARCH §8.5)

```js
{
  files: ['<scope-glob>'],
  ignores: [
    '<existing-excludes>',
    '**/__tests__/**',   // ← add; rationale inline per D-10
  ],
  plugins: { 'check-file': checkFile },
  rules: { /* unchanged */ },
},
```

Rationale comment (D-10 mandated inline form): `// __tests__ is vitest convention; PascalCase rule applies to production source, not test colocation.`

### Surgical no-source-edit posture (Karpathy §3)

**Source:** `CLAUDE.md §"Karpathy Coding Principles"` §3 "Surgical Changes" + Phase 47 D-03 / D-05
**Apply to:** every plan in Phase 48

- Don't "improve" adjacent code while fixing a lint violation.
- Match existing style. The fix is the lint-zero, not the rewrite.
- If a lint fix exposes unrelated dead code, mention it — don't delete it.
- Every changed line traces directly to a CONTEXT decision (D-01..D-17).

This is the meta-rule for sizing the violation-fixes plan. RESEARCH §1 estimates "~20–35 call-site edits after carve-out collapse" — keeping it surgical avoids drift toward a refactor.

### Inline rationale for any rule downgrade

**Source:** `eslint.config.mjs` lines 46, 58, 76, 78, 81, 83 etc. (every `TODO(Phase 2):` / `TODO(Phase 2+):` comment) + CONTEXT D-10 + LINT-06 verbatim
**Apply to:** every config change where the planner chooses "carve out + rationale" over "rename or call-site fix" (e.g., the `**/__tests__/**` ignore extension in RESEARCH §3 Path A, the `**/signature-visuals/flags/**` ISO-code carve-out per §3, etc.)

Format (mirrors the existing `TODO(Phase 2):` comment style):

```js
// <rule-name>: <one-line reason>; revisit when <follow-up condition>.
'<rule-name>': 'off',
```

Or for `ignores:` array entries:

```js
'<glob>',   // <one-line reason>
```

LINT-06 verbatim: "Warnings either fixed at the call site **or the rule downgraded with a written rationale recorded in `eslint.config.js` [now `.mjs`]**." The inline-rationale form is what makes the second option real and not a slow leak.

## No Analog Found

All 17 file/operation classifications have a closest analog in the codebase or in Phase 47's plan tree. No file in Phase 48's scope requires reaching for RESEARCH-only patterns; even the rule-fix recipes in RESEARCH §7 are backed by verified in-tree donor sites (e.g., `Sparkline.test.tsx` for `vi.importActual`, `embeddings-service.ts` for `logger.info`).

The one ASSUMED claim (RESEARCH §13.2) — that the frontend smoke-PR trip-wire needs an actual JSX string literal, not a comment — is flagged but does not change the pattern shape; only the executor's injection content. The pattern (branch name + assertion shape + disposition) is verbatim from 47-03 Task 5.

## Metadata

**Analog search scope:**

- `.planning/phases/47-type-check-zero/` — all 25 files (CONTEXT, RESEARCH, 47-01..47-11 plans + summaries, EXCEPTIONS, VALIDATION, REVIEW, STATE refs)
- `eslint.config.mjs` (354 lines) — single-source-of-truth root config
- `frontend/eslint.config.js` (193 lines) — the file being deleted; donor for `no-restricted-imports` JSON shape
- `frontend/package.json` + `backend/package.json` — `scripts` blocks
- `turbo.json` — `globalDependencies` + `tasks.lint`
- `.github/workflows/ci.yml` — `lint` job + downstream `needs:` chain
- `backend/src/utils/logger.ts` (140+ lines) — Winston exports
- `backend/src/services/{event,signature}.service.ts` — fix sites verified via Read
- `frontend/src/components/ai/ChatMessage.tsx` — fix site verified via Read
- `frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx` — `vi.importActual` canonical analog
- `frontend/src/components/dossier/wizard/hooks/__tests__/useDraftMigration.test.ts` — `require()` violation site verified via Read
- `frontend/src/components/{ai,FirstRun}/` — additional fix-site path confirmations

**Files scanned:** 38 (read fully) + 17 grep-based audits

**Pattern extraction date:** 2026-05-11

**Cross-references for planner:**

- Phase 47 47-01 Task 1 step 0 → Phase 48 Wave 0 git-tag
- Phase 47 47-03 Task 4 → Phase 48 48-03 branch-protection PUT
- Phase 47 47-03 Task 5 → Phase 48 48-03 smoke PRs
- Phase 47 47-03 Task 6 → Phase 48 48-03 D-17 scan
- `eslint.config.mjs:19` (`**/database.types.ts`) → Phase 48 D-13 (`**/contact-directory.types.ts`)
- `eslint.config.mjs:200–223` (frontend components carve-out) → Phase 48 RESEARCH §8.5 (`**/__tests__/**` extension)
- `Sparkline.test.tsx:11–21` → Phase 48 `vi.importActual` migration recipe
- `backend/src/ai/embeddings-service.ts:69+` → Phase 48 `console.log` → `logger.info` shape
