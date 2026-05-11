# Design System Migration — v5 Theme System → v6 Token Engine

**Scope:** Phase 33 (token-engine) of Milestone v6.0. This document is the upgrade path for anyone touching theme-adjacent code after the v5→v6 cutover.

**Status:** Phase 33 critical path complete. Phase 34 (tweaks-drawer) will add the user-facing picker on top of the engine delivered here.

## What changed, in one paragraph

The old 4-option color-theme picker (Canvas / Azure / Lavender / Bluesky) and its HSL-scale CSS is gone. In its place is a token engine keyed on **direction × mode × hue × density** that writes OKLCH `--*` custom properties onto `:root` at runtime. HeroUI v3 and Tailwind v4 both consume the same `--accent` / `--bg` / `--ink` / etc. without per-component overrides. The legacy `data-theme` CSS selectors, the `[data-theme='canvas'|…]` blocks in `index.css`, the `ThemeSelector` component, the `ThemeProvider` context, and the `useTheme()` hook's stateful implementation have all been removed. A **deprecated shim** of `useTheme()` remains so the final handful of call-sites keep working until Phase 34's picker replaces them.

## Key mappings

### Theme names → Design directions

| Old theme                                | New direction            | Notes                                |
| ---------------------------------------- | ------------------------ | ------------------------------------ |
| `canvas`                                 | `chancery`               | Warm paper (default)                 |
| `azure`                                  | `situation`              | Cool navy, high-contrast             |
| `lavender`                               | `ministerial`            | Neutral formal                       |
| `bluesky`                                | `bureau`                 | Cool business                        |
| `ocean` / `sunset` (v4 legacy)           | `chancery` (fallback)    | No 1:1 mapping; defaults to chancery |
| `gastat` / `blueSky` (v4 legacy typings) | `chancery` / `situation` | Inferred by proximity                |

### localStorage keys

| Old key                        | New key      | Notes                                        |
| ------------------------------ | ------------ | -------------------------------------------- |
| `theme`                        | `id.dir`     | Stores a `Direction` string                  |
| `colorMode`                    | `id.theme`   | Stores `'light' \| 'dark'`                   |
| `theme-preference` (JSON blob) | n/a          | Split into 4 atomic keys                     |
| `dossier.theme`                | n/a          | Legacy alias, removed                        |
| —                              | `id.hue`     | New: integer 0–360                           |
| —                              | `id.density` | New: `'comfortable' \| 'compact' \| 'dense'` |

**D-10 wipe:** On first load of the new build, `wipeLegacyThemeKeys()` (in `src/utils/storage/preference-storage.ts`) removes `theme`, `colorMode`, `theme-preference`, `dossier.theme` exactly once per browser (guarded by `id.legacy-wipe.v1`). Call site: `src/design-system/DesignProvider.tsx` `useEffect` on mount.

### Hooks

| Old                                | New                                                              | Migration                                                                                |
| ---------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `useTheme()`                       | `useDesignDirection()` + `useMode()`                             | Still exported as a deprecated shim; logs once per session                               |
| `useTheme().setTheme(t)`           | `useDesignDirection().setDirection(d)`                           | Direction values, not theme names                                                        |
| `useTheme().setColorMode(m)`       | `useMode().setMode(m)`                                           | `'light' \| 'dark'` only — `'system'` is resolved upstream (FOUC bootstrap + matchMedia) |
| `useDirection()` (from `useTheme`) | `useDomDirection()` (DOM) **or** `useDesignDirection()` (design) | Two separate concerns: DOM `dir=` attribute vs design direction                          |
| `useTheme().theme`                 | `useDesignDirection().direction`                                 |                                                                                          |
| `useTheme().colorMode`             | `useMode().mode`                                                 |                                                                                          |
| `useTheme().isDark`                | `useMode().mode === 'dark'`                                      |                                                                                          |

### CSS custom properties

| Old                                           | New                                               | Notes                                                     |
| --------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------- |
| `[data-theme="canvas"] { --bg: … }`           | `:root { --bg: … }` (written by `applyTokens`)    | No data-theme selectors; single `:root` mutated by JS     |
| `--primary-50` … `--primary-900` (HSL scales) | n/a                                               | Replaced by OKLCH calc in `buildTokens.ts`                |
| `--base-*` scales                             | n/a                                               | Removed                                                   |
| `--color-primary`                             | `--color-primary` (remap to `var(--accent)`)      | Same name, new source                                     |
| `--accent`                                    | `--accent` (OKLCH, hue-driven)                    | Generated from direction/mode/hue inputs                  |
| New                                           | `--accent-ink`, `--accent-soft`, `--accent-fg`    | Mode-branched OKLCH                                       |
| New                                           | `--sla-ok`, `--sla-risk`, `--sla-bad`             | Hue-tracking with +55° shift for risk; red-locked for bad |
| New                                           | `--row-h`, `--pad-inline`, `--pad-block`, `--gap` | Density-driven                                            |

### Components / routes

| Before                                                                    | After                                                                  | Notes                                             |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| `<ThemeProvider>` wrapping App                                            | `<DesignProvider>` wrapping App                                        | 33-02                                             |
| `<ThemeSelector />` in Header / AppSidebar / SiteHeader / responsive-demo | Removed (33-07)                                                        | Phase 34 adds a tweaks-drawer entry in the topbar |
| `/themes` route displays `<Themes />` page                                | Unchanged — `/themes` is the Topics dossier page, not the theme picker | Plan 33-07 misidentified this; kept as-is         |
| `AppearanceSettingsSection` theme picker block                            | Removed (33-07 Tier B+C)                                               | Color Mode + Display Density sections kept        |
| `ThemeErrorBoundary fallbackTheme="canvas"`                               | `ThemeErrorBoundary fallbackDirection="chancery"`                      | 33-07 Tier A                                      |

### Deleted artifacts

| Path                                           | Why                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `src/components/theme-selector/` (entire dir)  | Legacy 4-option picker                                            |
| `src/styles/themes/types.ts`                   | 0 consumers; orphaned v4 types                                    |
| `tests/integration/theme-persistence.test.tsx` | Validated removed `data-theme` attribute + `theme-preference` key |
| `tests/integration/default-theme.test.tsx`     | Validated removed default-theme fallback                          |
| `tests/integration/cross-tab-sync.test.tsx`    | Validated removed `ThemeProvider` cross-tab sync                  |
| `tests/integration/test_theme_switch.test.tsx` | Validated removed `ThemeSelector` flow                            |

All four integration tests validated behavior that no longer exists. Their coverage is replaced by `tests/unit/design-system/DesignProvider.test.tsx` (18/18 PASS) which tests the new provider's setters, storage, cross-tab sync via `storage` events, and `applyTokens` integration.

## How to migrate your code

### You import `useTheme` today

1. **Short term:** keep working via the shim. You'll see one console warning per session.
2. **Proper migration:** replace with `useDesignDirection()` + `useMode()`:
   ```ts
   // Before
   import { useTheme } from '@/hooks/useTheme'
   const { theme, colorMode, setColorMode } = useTheme()
   ```
   ```ts
   // After
   import { useDesignDirection } from '@/design-system/hooks/useDesignDirection'
   import { useMode } from '@/design-system/hooks/useMode'
   const { direction } = useDesignDirection()
   const { mode, setMode } = useMode()
   ```

### You import `useDirection` from `useTheme.ts`

Decide which direction you mean:

- **DOM direction** (reading `document.dir` or the i18n language): use `useDomDirection()` from `@/hooks/useDomDirection`.
- **Design direction** (the design-system direction setting): use `useDesignDirection()` from `@/design-system/hooks/useDesignDirection`.

The standalone `src/hooks/useDirection.ts` remains as a thin wrapper over `useLanguage()` for code that just wants `{ direction, isRTL }` based on the UI language — that's a separate concern from the design-direction axis.

### You reference theme names in data

If you're loading user preferences from the DB and getting back `'canvas'` / `'azure'` / …, use the mapping table above to translate to a `Direction`. New writes should use the new names directly. Phase 33 D-10 wipe only clears localStorage, not Supabase rows — backend preference rows may still contain legacy names for some time; the design-system layer treats unknown theme strings as `chancery` (the default).

### You render the color-theme picker

The old picker is removed. Phase 34 replaces it with a richer tweaks-drawer that exposes all four axes (direction / mode / hue / density). Until then, users can still change color mode and display density via Settings › Appearance.

## What's NOT covered here

- **Font wiring** — Phase 35 (typography-stack)
- **Visual decorations** (aurora, sparkles, etc.) — Phase 37 (signature-visuals)
- **App shell** (topbar, breadcrumbs, nav) — Phase 36 (shell-chrome)
- **Tweaks drawer** (user-facing picker) — Phase 34 (tweaks-drawer)

## References

- `.planning/phases/33-token-engine/33-00-OVERVIEW.md` — phase DAG
- `.planning/phases/33-token-engine/33-07-legacy-cut-SUMMARY.md` — this migration's delivery report
- `.planning/phases/33-token-engine/33-09-e2e-verification-SUMMARY.md` — E2E SC-1..SC-5 verification
- `frontend/src/design-system/tokens/buildTokens.ts` — the OKLCH math (palette definition)
- `frontend/src/design-system/DesignProvider.tsx` — the runtime that writes `:root` custom properties
