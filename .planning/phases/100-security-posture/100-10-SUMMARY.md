---
phase: 100-security-posture
plan: 10
status: complete
requirements:
  - CLIENTSEC-01
---

# P100-10 Summary — sign-out browser residue

The production `handleAuthStateChange('SIGNED_OUT', null)` path now clears the in-memory query cache and
sweeps `localStorage` by allowlist before navigating to `/login`. The sweep enumerates the store before
removing entries, tolerates unavailable or throwing browser storage, and continues sign-out even when an
individual removal fails. A non-`SIGNED_OUT` event never invokes the sweep.

The two stale Phase 92 bounding notes in `authStore.ts` and `authStore.signout.test.ts` were replaced with
positive contract text: the production branch now clears both cache and browser residue except the explicit
identity-neutral allowlist, while unrelated auth events leave them untouched.

## Allowlist decision

- `id.locale` — preserves the canonical design-system locale; `language-provider.tsx` reads it before the
  removed user-bearing `user-preferences` and `ui-storage` fallbacks.
- `id.theme` — preserves the workstation's identity-neutral light/dark presentation preference.
- `id.density` — preserves the workstation's identity-neutral content-density preference.
- `id.dir` — preserves the design-system direction preference needed for the RTL/LTR presentation.
- `i18nextLng` — preserves i18next's identity-neutral language detector value and its fallback interoperability.

No other key is allowed. In particular, `ui-storage`, `id.classif`, authentication state, search history,
recent entities, drafts, layouts, and per-entity preferences are removed.

## Storage boundary

This census population and the production sweep cover `localStorage` only. `sessionStorage` is **OUTSIDE**
this census population and **outside the sweep**. Criterion 6's browser-storage boundary is therefore
explicit rather than implicit.

## Exact-equality oracles

The positive `SIGNED_OUT` test seeds all seven criterion-named keys, three additional user-residue keys,
and every allowlisted key with known values. It drives the production `handleAuthStateChange` entry point,
enumerates storage, and asserts deep equality against a non-empty hardcoded five-entry key/value map. The
same full seed map is used by the scoping-neighbor test, which drives `PASSWORD_RECOVERY` and asserts the
entire enumerated map is unchanged.

The required leaf titles are present verbatim:

- `enumerated browser storage after the SIGNED_OUT handler equals the allowlisted key/value map exactly`
- `an auth event other than SIGNED_OUT leaves every seeded key at its seeded value`

## Executable key extractor (§10.6)

Command re-run from the repository root:

```bash
node --input-type=module <<'EOF'
import { execSync } from 'node:child_process'; import { readFileSync } from 'node:fs'
const files = execSync("git grep -lI 'localStorage' -- 'frontend/src/**'", {encoding:'utf8'}).trim().split('\n')
const LIT = /localStorage\.(?:setItem|getItem|removeItem)\(\s*['"`]([^'"`]+)['"`]/g
const PERSIST = /name:\s*['"]([^'"]+)['"]/g
const EXPR = /localStorage\.(?:setItem|getItem|removeItem)\(\s*([A-Za-z_$][\w$]*|`[^`]*`)\s*[,)]/g
const lit = new Set(), expr = new Set()
for (const f of files) {
  const s = readFileSync(f, 'utf8')
  for (const m of s.matchAll(LIT)) lit.add(m[1])
  if (/persist\(/.test(s)) for (const m of s.matchAll(PERSIST)) lit.add(m[1])
  for (const m of s.matchAll(EXPR)) expr.add(m[1])
}
console.log('files_scanned=' + files.length)
console.log('literal_keys=' + lit.size)
console.log('key_expressions=' + expr.size)
console.log('LITERALS: ' + [...lit].sort().join(' '))
console.log('EXPRESSIONS: ' + [...expr].sort().join(' '))
EOF
```

Verbatim output:

```text
files_scanned=52
literal_keys=23
key_expressions=21
LITERALS: ${STORAGE_KEY_PREFIX}${entityType} access_token auth-storage calendar_oauth_provider calendar_oauth_state colorMode dossier-create-country dossier-create-draft dossier-create-organization dossier-store dossier-wizard:guidance:country:basic dossier-wizard:guidance:person:review i18nextLng id.classif id.locale pinned-entities-storage recent_dossiers_for_work_creation sidebar_state supabase.auth.token theme theme-preference ui-storage user-preferences
EXPRESSIONS: CMDK_USAGE_KEY FIRST_RUN_DISMISSED_KEY LOCAL_SETTINGS_KEY OLD_DRAFT_KEY ONBOARDING_COMPLETED_KEY ONBOARDING_SEEN_KEY PREVIEW_DISMISSED_KEY RECENT_ITEMS_KEY SEARCH_HISTORY_KEY SIDEBAR_STORAGE_KEY STORAGE_KEY TOUR_DISMISSED_KEY TOUR_ENABLED_KEY TOUR_STORAGE_KEY WIPE_GUARD_KEY `${STORAGE_KEY_PREFIX}${entityType}` draftKey fullStorageKey key newKey storageKey
```

The **23 literal keys are a LOWER BOUND**, not a closed population: one counted literal is itself the
template `${STORAGE_KEY_PREFIX}${entityType}`, and the extractor found 21 further key expressions. Several
expressions resolve differently per file—for example, `STORAGE_KEY` has different values in
`useQueueFilters`, `useRolePreference`, `useRecentNavigation`, `useWidgetDashboard`, `DossierPicker`, and
`preference-storage`. Static analysis therefore cannot close the population; the allowlist sweep closes the
class instead.

## Verification output

The ordinary focused-test command could not start because Vite attempted to write through the
harness-managed read-only `node_modules` symlink:

```text
failed to load config from .../frontend/vitest.config.ts
Error: EPERM: operation not permitted, open '.../frontend/node_modules/.vite-temp/vitest.config.ts.timestamp-....mjs'
```

The same focused test was then run with Vite's runner config loader and an injected config directory:

```bash
NODE_OPTIONS='--import=data:text/javascript,globalThis.__dirname=%22/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260910-112306-0000000000000075--P100-10/frontend%22' npx vitest --configLoader runner --run src/store/authStore.signout.test.ts
```

```text
 RUN  v4.1.7 .../frontend

 Test Files  1 passed (1)
      Tests  4 passed (4)
   Duration  799ms (transform 232ms, setup 351ms, import 126ms, tests 57ms, environment 207ms)
```

TypeScript verification:

```bash
npx tsc --noEmit --pretty false
```

```text
(exit 0; no TypeScript diagnostics)
```

The implementation commit's repository hooks also completed ESLint/Prettier, the monorepo production build,
and repository checks successfully before creating commit `d619df75f`.

## Deferred work

Source-map disposition remains owned by P100-11. No database object or deployment was changed by this task.
