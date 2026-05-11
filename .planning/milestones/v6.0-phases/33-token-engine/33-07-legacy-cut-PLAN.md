---
phase: 33-token-engine
plan: 07
type: execute
wave: 3
depends_on: ['33-02', '33-06']
files_modified:
  - frontend/src/index.css
  - frontend/src/components/theme-provider/theme-provider.tsx
  - frontend/src/components/theme-error-boundary/ThemeErrorBoundary.tsx
  - frontend/src/hooks/useTheme.ts
  - frontend/src/styles/themes/types.ts
  - frontend/src/types/settings.types.ts
  - frontend/src/services/preference-sync.ts
  - frontend/src/utils/storage/preference-storage.ts
  - frontend/src/i18n/en/settings.json
  - frontend/src/i18n/ar/settings.json
  - frontend/src/components/settings/sections/AppearanceSettingsSection.tsx
  - frontend/src/pages/settings/SettingsPage.tsx
  - frontend/src/components/layout/Header.tsx
  - frontend/src/components/layout/AppSidebar.tsx
  - frontend/src/components/layout/SiteHeader.tsx
  - frontend/src/routes/_protected/responsive-demo.tsx
  - frontend/tests/unit/preference-merge.test.ts
  - frontend/tests/integration/theme-persistence.test.tsx
  - frontend/tests/integration/test_theme_switch.test.tsx
  - frontend/tests/integration/default-theme.test.tsx
  - frontend/tests/integration/cross-tab-sync.test.tsx
  - frontend/DESIGN_SYSTEM_MIGRATION.md
autonomous: false
requirements: [TOKEN-06]
must_haves:
  truths:
    - "All 19 [data-theme='canvas'|'azure'|'lavender'|'bluesky'] blocks removed from index.css"
    - 'All --base-*, --primary-*-HSL scales removed from index.css'
    - 'AVAILABLE_THEMES export is empty array (legacy shim) or gone'
    - 'theme-provider.tsx is ≤ 35 lines (shim-only, returns useTheme that deprecation-warns)'
    - "ThemeErrorBoundary's fallbackTheme prop renamed to fallbackDirection with default 'chancery'"
    - "On first load after deploy, localStorage 'theme' and 'colorMode' keys are wiped (D-10)"
    - 'pnpm typecheck + build + test all clean after the sweep'
  artifacts:
    - path: 'frontend/src/hooks/useTheme.ts'
      provides: 'deprecated shim calling useDesignDirection + useMode'
  key_links:
    - from: 'all call sites of useTheme()'
      to: 'useDesignDirection + useMode via shim'
      via: 'shim layer'
      pattern: "useTheme\\(\\)"
---

# Plan 33-07: Legacy HSL + Theme Hard Cut

**Phase:** 33 (token-engine)
**Wave:** 3
**Depends on:** 33-02 (DesignProvider up), 33-06 (Tailwind remap keeping legacy semantic classes working)
**Type:** migration
**TDD:** false
**Estimated effort:** L (6–7 h — 25 files + tests + `index.css` surgery)

## Goal

Remove all legacy theme infrastructure in a single atomic sweep:

1. Delete 19 `[data-theme=...]` blocks and all `--base-*` / `--primary-*-HSL` scales from `index.css`
2. Remove the `canvas | azure | lavender | bluesky` type union everywhere (25 files, per PATTERNS.md §Section 2)
3. Gut `theme-provider.tsx` to a ≤35-line shim that only exports a deprecated `useTheme()` calling the new hooks
4. Rename `ThemeErrorBoundary`'s `fallbackTheme` prop → `fallbackDirection`; update the 1 call site
5. Update tests that encode old theme names
6. On first load after deploy, wipe `localStorage.theme` + `localStorage.colorMode` keys (D-10)

**Critical dependency:** Plan 33-06 must land first so all 1,437 `bg-primary / text-foreground / border-border` usages still render correctly via the `@theme` remap. Without 33-06, this plan breaks every page.

## Why this plan has a checkpoint (autonomous: false)

Task 8 (`ThemeSelector.tsx` and `/themes` route) is a cross-phase handoff to Phase 34. Leaving them present-but-broken vs deleting-them-early is a decision.

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/33-token-engine/33-CONTEXT.md
@.planning/phases/33-token-engine/33-RESEARCH.md
@.planning/phases/33-token-engine/33-PATTERNS.md
@frontend/src/index.css
@frontend/src/components/theme-provider/theme-provider.tsx
@frontend/src/components/theme-error-boundary/ThemeErrorBoundary.tsx
@frontend/src/hooks/useTheme.ts
@frontend/src/utils/storage/preference-storage.ts
@frontend/src/services/preference-sync.ts

<interfaces>
<!-- Shim signature preserved for back-compat -->
```typescript
// frontend/src/hooks/useTheme.ts (post-sweep)
import { useDesignDirection } from '@/design-system/hooks/useDesignDirection'
import { useMode } from '@/design-system/hooks/useMode'

/\*_ @deprecated Use useDesignDirection/useMode directly. Shim removed in Phase 34. _/
export function useTheme(): {
theme: string // legacy name; maps to direction
colorMode: 'light'|'dark'
setTheme: (t: string) => void // no-op; logs warning
setColorMode: (m: 'light'|'dark') => void
isDark: boolean
} {
if (!useTheme.\_warned) {
console.warn('useTheme() is deprecated. Use useDesignDirection() + useMode() from @/design-system/hooks.')
useTheme.\_warned = true
}
const { direction } = useDesignDirection()
const { mode, setMode } = useMode()
return { theme: direction, colorMode: mode, setTheme: () => {}, setColorMode: setMode, isDark: mode === 'dark' }
}

````
</interfaces>
</context>

## Files to create / modify

Full list per PATTERNS.md §Section 2 (25 files). Grouped by risk tier:

### Tier A — Core rewrites (7 files)
| File | Action |
|---|---|
| `frontend/src/index.css` | Delete 19 `[data-theme=…]` blocks + `--base-*` + `--primary-*-HSL` scales |
| `frontend/src/components/theme-provider/theme-provider.tsx` | Gut to ≤35-line shim (see Task 2) |
| `frontend/src/components/theme-error-boundary/ThemeErrorBoundary.tsx` | Rename `fallbackTheme` prop → `fallbackDirection`; default `'chancery'` |
| `frontend/src/hooks/useTheme.ts` | Rewrite as deprecated shim (see interface block above) |
| `frontend/src/styles/themes/types.ts` | Replace `Theme = 'canvas'\|'azure'\|…` union with `Direction` re-export OR delete file if no other consumers |
| `frontend/src/types/settings.types.ts` | Replace theme enum with Direction |
| `frontend/src/utils/storage/preference-storage.ts` | Update storage keys from `theme`/`colorMode` → `id.dir`/`id.theme`/`id.hue`/`id.density`; add wipe-legacy migration run-once on mount |

### Tier B — Integration updates (5 files)
| File | Action |
|---|---|
| `frontend/src/services/preference-sync.ts` | Update key names; preserve cross-tab behavior |
| `frontend/src/i18n/en/settings.json` | Replace `canvas/azure/lavender/bluesky` labels with `Chancery / Situation Room / Ministerial / Bureau` |
| `frontend/src/i18n/ar/settings.json` | Arabic labels: ديوان / غرفة العمليات / وزاري / مكتب (or per i18n glossary) |
| `frontend/src/components/settings/sections/AppearanceSettingsSection.tsx` | Update theme picker → direction picker (minimal UI change; Phase 34 replaces entirely — if UI is dead weight, leave stub but update types) |
| `frontend/src/pages/settings/SettingsPage.tsx` | If hosts AppearanceSection directly, no changes beyond type update |

### Tier C — Call sites consuming `useTheme` (5 files)
| File | Action |
|---|---|
| `frontend/src/App.tsx` | Line 33 `fallbackTheme="canvas"` → `fallbackDirection="chancery"` (already-wired DesignProvider from 33-02 intact) |
| `frontend/src/components/layout/Header.tsx` | Replace `useTheme` consumption with `useDesignDirection + useMode` (or rely on shim; preferred: direct migration) |
| `frontend/src/components/layout/AppSidebar.tsx` | Same |
| `frontend/src/components/layout/SiteHeader.tsx` | Same |
| `frontend/src/routes/_protected/responsive-demo.tsx` | Same |
| `frontend/src/components/contacts/BusinessCardScanner.tsx` | False positive — verify; likely no change |
| `frontend/src/components/engagements/ForumSessionCreator.tsx` | False positive — verify |
| `frontend/src/components/milestone-planning/MilestonePlannerEmptyState.tsx` | False positive — verify |
| `frontend/src/components/ui/sidebar.tsx` | Review for theme-class usage; likely no change (remap keeps it working) |
| `frontend/src/components/ui/placeholders-and-vanish-input.tsx` | False positive — verify |
| `frontend/src/i18n/en/milestone-planning.json` | False positive — verify |

### Tier D — Existing `useDirection` call-site rename (from 33-02 collision)
| File | Action |
|---|---|
| All files importing old `@/hooks/useDirection` (non-modal) | Update import → `@/hooks/useDomDirection` OR `@/design-system/hooks/useDesignDirection` depending on intent (DOM dir vs design direction) |

Run `grep -rn "from '@/hooks/useDirection'" frontend/src` and triage each hit:
- If the file reads `document.dir` for layout math → `useDomDirection`
- If the file reads the design direction → `useDesignDirection`

### Tier E — Tests (6 files)
| File | Action |
|---|---|
| `frontend/tests/unit/preference-merge.test.ts` | Update `theme: 'gastat'\|'blueSky'` unions to Direction |
| `frontend/tests/integration/theme-persistence.test.tsx` | Update storage keys to `id.dir` etc. |
| `frontend/tests/integration/test_theme_switch.test.tsx` | Dead after Phase 34; here: update to use new setters OR mark `.skip` with note |
| `frontend/tests/integration/default-theme.test.tsx` | Update default from `canvas` → `chancery` |
| `frontend/tests/integration/cross-tab-sync.test.tsx` | Update keys |
| `frontend/DESIGN_SYSTEM_MIGRATION.md` | Rewrite to document Phase 33's new engine (or delete and link to Phase 33 SUMMARY) |

## Implementation steps

### Task 1 (auto) — `index.css` surgery

Per PATTERNS.md §Section 2 line numbers:
- Delete block at lines 19-116 (Canvas `[data-theme='canvas']`)
- Delete block at lines 118-174 (Azure)
- Delete block at lines 176-231 (Lavender)
- Delete block at lines 233-285 (BlueSky)
- Delete blocks at lines 356-487 (dark variants)
- Delete blocks at lines 492-1000 (remaining theme fragments)
- Keep lines 10-11 (`@import`, `@plugin`, `@config`)
- Keep the 33-04 `:root` Chancery-light fallback and `--heroui-*` bridge
- Keep the 33-06 `@theme` block
- Keep non-theme utility sections (typography, radius, transitions ~lines 52-111 in original — now scoped appropriately)

After edit, `frontend/src/index.css` should be ~200-300 lines (down from 1344).

### Task 2 (auto) — Gut `theme-provider.tsx` to shim

Replace the 263-line file with ~30 lines:
```tsx
/**
 * @deprecated Legacy shim. `ThemeProvider` removed in Phase 33. Use `DesignProvider` from
 * '@/design-system/DesignProvider'. `useTheme()` re-export lives in '@/hooks/useTheme'.
 * Shim removed entirely in Phase 34 when AppearanceSettingsSection gets the new picker.
 */
export const AVAILABLE_THEMES: readonly string[] = []
// Intentionally NO ThemeProvider export — App.tsx already uses DesignProvider (Plan 33-02).
````

Delete the old context, state, setters, storage writes, event listeners — all re-implemented in DesignProvider.

### Task 3 (auto) — Rewrite `useTheme.ts`

Per the interface block above. Four responsibilities:

1. Export `useTheme()` deprecated shim
2. Export `useDirection` (re-export from `useDomDirection` — the DOM-direction hook) to keep backward compat for any existing consumers
3. Delete the in-file `useDirection()` that uses `MutationObserver` (lines 75-114 per PATTERNS.md) — renamed/moved in 33-02 to `useDomDirection.ts`
4. No other exports

### Task 4 (auto) — Rename `ThemeErrorBoundary` prop

`frontend/src/components/theme-error-boundary/ThemeErrorBoundary.tsx`:

- `fallbackTheme?: string` → `fallbackDirection?: Direction` (default `'chancery'`)
- Body of error fallback: render a plain Chancery-light screen regardless of prop; use the prop only to log

Update `frontend/src/App.tsx` line 33 to pass `fallbackDirection="chancery"`.

### Task 5 (auto) — Storage layer migration

`frontend/src/utils/storage/preference-storage.ts`:

1. Introduce new keys: `id.dir`, `id.theme`, `id.hue`, `id.density`
2. Add run-once migration function:
   ```ts
   export function wipeLegacyThemeKeys(): void {
     try {
       localStorage.removeItem('theme')
       localStorage.removeItem('colorMode')
       localStorage.removeItem('dossier.theme')
       // any other legacy keys per grep
     } catch {}
   }
   ```
3. Call `wipeLegacyThemeKeys()` from DesignProvider mount (Plan 33-02 will need a PR amendment — file this as a cross-plan note in SUMMARY) OR from `main.tsx` bootstrap before React mounts.

### Task 6 (auto) — Blanket string-replace of theme names

For each Tier A/B/C file: replace string occurrences of `'canvas' | 'azure' | 'lavender' | 'bluesky'` with appropriate `Direction` values. For i18n: Chancery / Situation Room / Ministerial / Bureau (en) + Arabic equivalents.

Grep sweeps before finalizing:

```bash
grep -rn "'canvas'\|'azure'\|'lavender'\|'bluesky'" frontend/src
# Expect: only false-positive hits (BusinessCardScanner, placeholders, etc.)
grep -rn "AVAILABLE_THEMES" frontend/src
# Expect: only the empty-array shim export
grep -rn "--base-\|--primary-50\|--primary-100" frontend/src
# Expect: 0
```

### Task 7 (auto) — Test updates

For each Tier E test: update the theme/key names per table above. Run the test suites to completion.

### Task 8 (checkpoint:decision) — ThemeSelector + /themes route disposition

<task type="checkpoint:decision" gate="blocking">
  <decision>Delete dead code now (Phase 33) or defer to Phase 34 as planned?</decision>
  <context>
    `frontend/src/components/theme-selector/ThemeSelector.tsx` and `frontend/src/routes/_protected/themes.tsx`
    become dead code after this plan. CONTEXT.md cross-phase note says Phase 34 SC-5 owns their deletion.
    Leaving them imports the old shim indirectly and may trigger the deprecation warning repeatedly.
  </context>
  <options>
    <option id="option-defer">
      <name>Defer deletion to Phase 34 (as planned)</name>
      <pros>Respects phase boundaries; no cross-phase surprise</pros>
      <cons>Deprecation warnings in console until Phase 34 ships</cons>
    </option>
    <option id="option-now">
      <name>Delete now in Phase 33</name>
      <pros>Clean console; prevents accidental route access</pros>
      <cons>Breaks Phase 34 plan boundary; Phase 34 SC-5 becomes a no-op</cons>
    </option>
    <option id="option-stub">
      <name>Replace /themes route with a redirect to /settings</name>
      <pros>User-visible cleanup without deleting files</pros>
      <cons>Extra ~10 lines of code churn in Phase 33</cons>
    </option>
  </options>
  <resume-signal>Select: option-defer, option-now, or option-stub</resume-signal>
</task>

### Task 9 (auto) — Apply chosen option from Task 8

If `option-defer`: no code change.
If `option-now`: `git rm frontend/src/components/theme-selector/ThemeSelector.tsx frontend/src/routes/_protected/themes.tsx`; regenerate `routeTree.gen.ts` via `pnpm --filter frontend dev` once.
If `option-stub`: replace `/themes` route body with `redirect({ to: '/settings' })`.

## Definition of done

- [ ] `grep -c 'data-theme' frontend/src/index.css` returns 0
- [ ] `grep -c -- '--base-\|--primary-5\|--primary-1' frontend/src/index.css` returns 0
- [ ] `grep -rn "'canvas'\|'azure'\|'lavender'\|'bluesky'" frontend/src/ | grep -v test` returns only the 3-4 false-positives identified in PATTERNS.md (all verified non-theme)
- [ ] `frontend/src/components/theme-provider/theme-provider.tsx` is ≤ 35 lines
- [ ] `useTheme()` logs deprecation warning exactly once per session (gated by `useTheme._warned`)
- [ ] `ThemeErrorBoundary` accepts `fallbackDirection` prop; App.tsx passes `"chancery"`
- [ ] `pnpm --filter frontend typecheck` clean
- [ ] `pnpm --filter frontend lint` clean
- [ ] `pnpm --filter frontend build` succeeds; bundle size decrease ≥ 10 KB (legacy HSL removal)
- [ ] All 6 Tier E tests updated and passing
- [ ] Manual: `localStorage.setItem('theme','canvas'); localStorage.setItem('colorMode','dark'); location.reload()` — after load, both keys are gone (wiped) and app shows Chancery-light (defaults)
- [ ] Manual EN + AR: navigate 3 representative routes, confirm no visual regression vs the 33-06 baselines
- [ ] Decision from Task 8 applied and documented in SUMMARY

## Requirements satisfied

- TOKEN-06 (full — legacy hard cut)

## Success Criteria contribution

- Enables SC-1..SC-5 in a clean state: no HSL scales, no competing theme enums, no orphaned providers.

## Risks / unknowns

- **`ThemeSelector.tsx` still imports from `theme-provider`**: if the shim removes `ThemeProvider` export, `ThemeSelector` fails to compile. Options: (a) leave `ThemeSelector` untouched and shim a no-op `ThemeProvider` re-export pointing to a Fragment; (b) delete ThemeSelector now (Task 8 option-now). Mitigation: detect during step 2, decide at step 8.
- **False-positive grep hits**: `canvas` appears in non-theme contexts (HTML `<canvas>`, mocked color names). Mitigate: PATTERNS.md lists specific files; verify each manually, don't blanket-sed.
- **Tests that snap against old HSL colors**: may need baseline refresh; coordinate with 33-06's baselines.
- **`routeTree.gen.ts`**: if option-now chosen, auto-regenerates. Confirm no commit-time diff races with running dev server.

## Verification

```bash
pnpm --filter frontend typecheck
pnpm --filter frontend lint
pnpm --filter frontend build
pnpm --filter frontend test
# Legacy grep sweep
grep -rn "'canvas'\|'azure'\|'lavender'\|'bluesky'" frontend/src/
grep -c 'data-theme' frontend/src/index.css
grep -c -- '--base-\|--primary-5' frontend/src/index.css
# Runtime wipe test
pnpm --filter frontend dev
# In devtools: localStorage.setItem('theme','canvas'); location.reload()
# After: Object.keys(localStorage) should not include 'theme' or 'colorMode'
```
