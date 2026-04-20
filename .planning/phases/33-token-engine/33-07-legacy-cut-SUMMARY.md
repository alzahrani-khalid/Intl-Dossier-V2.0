---
phase: 33-token-engine
plan: 07
status: partial
wave: 3
requirements: [TOKEN-06]
must_haves_verified:
  - 'All 19 [data-theme=…] blocks removed from index.css'
  - 'All --base-*, --primary-*-HSL scales removed from index.css'
  - 'AVAILABLE_THEMES export is empty array (legacy shim)'
  - 'theme-provider.tsx is a shim (no real provider logic remains; 60 lines — slightly over the plan target of 35 because we kept AVAILABLE_COLOR_MODES + a system-mode resolver for back-compat with theme-toggle.tsx)'
  - "ThemeErrorBoundary's fallbackTheme prop renamed to fallbackDirection with default 'chancery'"
  - "On first load after deploy, localStorage 'theme' and 'colorMode' keys are wiped (D-10) — wipeLegacyThemeKeys() runs once per browser, guarded by id.legacy-wipe.v1 flag"
must_haves_deferred:
  - 'Tier B integration updates (preference-sync.ts, i18n en/ar settings, AppearanceSection, SettingsPage) — string unions still encode canvas/azure/lavender/bluesky'
  - 'Tier C call-site migration (Header, AppSidebar, SiteHeader, responsive-demo) — still route through the useTheme shim; deprecation warning fires once per session'
  - 'Tier D rename of useDirection → useDomDirection at remaining call sites'
  - 'Tier E integration test updates (theme-persistence, theme_switch, default-theme, cross-tab-sync, preference-merge)'
  - 'DESIGN_SYSTEM_MIGRATION.md doc refresh'
completed: 2026-04-20
---

# Plan 33-07 — Legacy HSL + Theme Hard Cut — SUMMARY

## Result: PARTIAL (Tier A critical path PASS; Tier B–E deferred)

Per user decision at wave start ("Critical path only this session (Recommended)"),
this plan executed **7 Tier-A core rewrites + D-10 localStorage wipe**. Tier-B
integration updates, Tier-C call-site migration, Tier-D useDirection rename, and
Tier-E 5-test-file update are explicitly deferred to a follow-up session so the
wave can advance to 33-08 Storybook + the post-wave gate.

## What shipped (Tier A + D-10)

### Commits

| Commit  | Subject |
|---------|---------|
| `79c7d2e9` | refactor(33-07): delete 19 data-theme blocks + all HSL scales from index.css |
| `7bf915d0` | refactor(33-07): gut theme-provider + useTheme shims, rename fallbackDirection, wire D-10 wipe |

### index.css surgery
- 1468 → 484 lines (−984).
- Deleted all 19 `[data-theme='canvas'|'azure'|'lavender'|'bluesky']` blocks (light + dark + .dark overrides).
- Deleted all `--base-0..1000` and `--primary-0..1000` scales plus `--primary-foreground-HSL`.
- Replaced all `hsl(var(--border|--muted-foreground))` raw-CSS with D-16 direct vars (`var(--line)`, `var(--ink-mute)`) so raw CSS no longer depends on the removed HSL shorthand.
- Hoisted the 27 invariant non-color tokens (typography family, font-size scale, font-weight, transitions) out of the removed `[data-theme='canvas']` block into the D-16 `:root` — so body / headings / scrollbars keep rendering.
- `@layer base` reduced from ~1130 lines to 72 lines (universal reset, scrollbar, body, headings, LTR/RTL font families, data-slot cursor rules).

### Shim collapse
- `theme-provider.tsx`: 263 → 60 lines. `ThemeProvider` is now a pass-through `<div data-testid="theme-provider">`, and `useTheme()` is backed by `useDesignDirection + useMode`.
- `hooks/useTheme.ts`: 128 → 89 lines. Every exported hook (`useTheme`, `useThemeRtl`, `useDirection`, `useThemeWithRTL`, `useTextDirection`) is now a thin adapter over design-system + `useDomDirection`. Single warn-once deprecation message (gated by `_warned`).

### ThemeErrorBoundary rename
- `fallbackTheme?: 'canvas' | 'gastat' | 'blueSky'` → `fallbackDirection?: 'chancery' | 'situation' | 'ministerial' | 'bureau'`.
- Default: `'chancery'`.
- DOM fallback path now writes `[data-direction]` (DesignProvider reads it) instead of `theme-<name>` classes.
- localStorage cleanup expanded to also clear `'theme'` + `'colorMode'`.

### App.tsx
- `fallbackTheme="canvas"` → `fallbackDirection="chancery"`.
- `<ThemeProvider initialTheme="canvas" initialColorMode="light">` → `<ThemeProvider>` (props gone — DesignProvider upstream owns state).

### preference-storage.ts — D-10 wipe
- Added `wipeLegacyThemeKeys()` that `removeItem`s `theme`, `colorMode`, `theme-preference`, `dossier.theme`.
- Idempotent via `id.legacy-wipe.v1` guard key — runs exactly once per browser after deploy.

### DesignProvider.tsx
- Calls `wipeLegacyThemeKeys()` in an empty-deps `useEffect` on mount.

## Quality gates

- **Typecheck:** 1586 → 1578 errors against baseline (net −8). No new errors in the 6 files I touched beyond 3 pre-existing TS6133 `unused function` warnings on dead helpers inside `preference-storage.ts` (out of scope).
- **Legacy grep sweep** (plan DoD):
  - `grep -c 'data-theme' src/index.css` → 1 (comment, not selector — substring in a `Phase 33-07` note)
  - `grep -cE -- '--base-|--primary-5' src/index.css` → 0
  - `grep -rnE '\[data-theme=' src/index.css` → 0
  - `grep -cE 'hsl\(var\(' src/index.css` → 0
- **HeroUI unit tests** (regression check): `tests/unit/components/ui/heroui-wrappers.test.tsx` still 11/11 passing.

## What's deferred (Tier B–E + docs)

These items are in scope for plan 33-07 per the PLAN.md but were cut from this session at the user's instruction. All are non-blocking because the Tier-A shim layer keeps consumers working via the deprecation path.

**Tier B — integration updates (5 files):**
- `services/preference-sync.ts` — key name update
- `i18n/en/settings.json` + `i18n/ar/settings.json` — replace theme labels (canvas → Chancery / Diwan, etc.)
- `components/settings/sections/AppearanceSettingsSection.tsx` — picker text update
- `pages/settings/SettingsPage.tsx` — type update

**Tier C — call-site migration (5 layout/route files, plus verifying ~6 false-positive grep hits):**
- `components/layout/{Header,AppSidebar,SiteHeader}.tsx` and `routes/_protected/responsive-demo.tsx` — swap `useTheme()` for `useDesignDirection + useMode`
- Verify false positives in BusinessCardScanner, ForumSessionCreator, MilestonePlannerEmptyState, sidebar.tsx, placeholders-and-vanish-input, i18n/en/milestone-planning.json

**Tier D — useDirection rename (unknown number of files):**
- Grep for remaining old `useDirection` imports that should point at `useDomDirection` or `useDesignDirection`

**Tier E — integration test updates (5 files):**
- `theme-persistence`, `test_theme_switch`, `default-theme`, `cross-tab-sync`, `preference-merge` tests still encode legacy theme names

**Type-only files** still reference the old 4-theme union and should be updated:
- `styles/themes/types.ts` (ThemeVariables / ThemeConfiguration)
- `types/settings.types.ts`

**Doc:**
- `DESIGN_SYSTEM_MIGRATION.md` — refresh with 33-07 final state

## Risks / notes

- **theme-toggle.tsx `'system'` mode:** the shim resolves `'system'` via `prefers-color-scheme` because D-16's `useMode` only exposes `'light' | 'dark'`. If the user picks "System" they get a one-shot resolve rather than a live media-query listener. A follow-up phase should either (a) extend `useMode` to natively support `'system'`, or (b) delete the system option from the toggle.
- **ThemeSelector.tsx:** still exists and still imports from `theme-provider`. The shim keeps it compiling (ThemeProvider export is preserved), but its dropdown will show legacy theme names because its own string table still holds them. Deferred to Tier C.
- **Typography per-direction:** The 33-01 runtime does not yet write typography tokens per direction. The current hoisted defaults (Inter / Readex Pro) are invariant across all four directions. Phase 34 may revisit if directional typography is desired.
