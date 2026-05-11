# Phase 33: Token Engine — Patterns

**Mapped:** 2026-04-19
**Status:** Complete
**Files analyzed:** 17 new + 8 to modify
**Analogs found:** 14 / 17 (3 no close analog — new module category)

## Section 1: New file → closest analog

| New file                                                         | Closest analog                                                                                                                                        | Why                                                                                                                                                                                                | Convention to follow                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/design-system/tokens/directions.ts`                | `frontend/src/types/breakpoint.ts`                                                                                                                    | Domain-record TS module. Plain `export type` + config record, no React.                                                                                                                            | Top-level JSDoc comment; one named `export type X = ...`, one named `export const PALETTES: Record<Direction, Palette> = {...}`; no default export                                                                                                                                                                                                                                                                                                          |
| `frontend/src/design-system/tokens/densities.ts`                 | `frontend/src/types/breakpoint.ts`                                                                                                                    | Same role (config record of numeric/string constants).                                                                                                                                             | Same as above; explicit return types never needed because it's pure data.                                                                                                                                                                                                                                                                                                                                                                                   |
| `frontend/src/design-system/tokens/buildTokens.ts`               | `frontend/src/lib/utils.ts` (see `cn`, `getDocDir`)                                                                                                   | Pure function module in `lib/` style — named exports, explicit return types, no side effects.                                                                                                      | `export function buildTokens(input: BuildInput): TokenSet {...}` — explicit return type (ESLint rule `explicit-function-return-type`). Named export only, no default.                                                                                                                                                                                                                                                                                       |
| `frontend/src/design-system/tokens/applyTokens.ts`               | `frontend/src/lib/utils.ts` + `frontend/src/hooks/useTheme.ts:82-94` (MutationObserver DOM side-effect pattern)                                       | Imperative DOM writer returning a cleanup fn. Follow the `useTheme.ts` observer-cleanup shape.                                                                                                     | `export function applyTokens(tokens: TokenSet): () => void` — returns disposer. Guard with `if (typeof document === 'undefined') return () => {}`. Match `getDocDir()` SSR-safety idiom.                                                                                                                                                                                                                                                                    |
| `frontend/src/design-system/tokens/types.ts`                     | `frontend/src/types/breakpoint.ts` + `frontend/src/types/actionable-error.types.ts` (naming)                                                          | Domain types file. Project convention is `*.types.ts` but NEW dir tokens files already specify `types.ts` (D-02); keep spec-literal naming.                                                        | `export type Direction = 'chancery' \| 'situation' \| 'ministerial' \| 'bureau'`; `export type Mode = 'light' \| 'dark'`; `export type Density = 'comfortable' \| 'compact' \| 'dense'`; `export type Hue = number`; `export type TokenSet = Record<string, string>`. Plain string-union unions, no enums (matches `breakpoint.ts` style).                                                                                                                  |
| `frontend/src/design-system/tokens/index.ts`                     | **No precedent** — no barrel file exists under `frontend/src/hooks`, `frontend/src/lib`, or `frontend/src/types`.                                     | Project does NOT use barrels. Each consumer imports from specific files.                                                                                                                           | Minimal barrel only if the planner explicitly wants one: `export * from './buildTokens'` etc. Otherwise omit and have callers import from leaf files. Recommend **omit** to match codebase.                                                                                                                                                                                                                                                                 |
| `frontend/src/design-system/DesignProvider.tsx`                  | `frontend/src/components/theme-provider/theme-provider.tsx`                                                                                           | Exact role match: React context + localStorage + document side-effects + cross-tab `storage` listener + `CustomEvent` dispatch.                                                                    | Copy the skeleton lines 1-4 (audit comment + imports), 45 (context), 47-51 (ThemeProviderProps shape), 53-70 (lazy `useState` initializer reading localStorage), 104-121 (useEffect applying to DOM), 123-165 (setter w/ localStorage write + CustomEvent dispatch), 202-226 (storage-event listener), 240-255 (context value + Provider tag w/ `data-testid`). Swap shape to `{direction, mode, hue, density, setDirection, setMode, setHue, setDensity}`. |
| `frontend/src/design-system/hooks/useDirection.ts`               | `frontend/src/hooks/useDirection.ts` (current 6-line file) — **will be REPLACED**                                                                     | Current `useDirection` reads i18n language-direction. New one reads `DesignProvider` direction (Chancery/Situation/etc.). Same file path = collision; spec puts new one in `design-system/hooks/`. | `export function useDirection(): { direction: Direction; setDirection: (d: Direction) => void } { const ctx = useContext(DesignContext); if (!ctx) throw new Error('useDirection must be used within DesignProvider'); return { direction: ctx.direction, setDirection: ctx.setDirection } }`. Match the throw-pattern from `theme-provider.tsx:257-263`.                                                                                                   |
| `frontend/src/design-system/hooks/useMode.ts`                    | `frontend/src/components/theme-provider/theme-provider.tsx:257-263` (`useTheme`)                                                                      | Same "read one slice of context" pattern.                                                                                                                                                          | Same as `useDirection` — thin context getter with error-guard.                                                                                                                                                                                                                                                                                                                                                                                              |
| `frontend/src/design-system/hooks/useHue.ts`                     | Same as above                                                                                                                                         | Same pattern.                                                                                                                                                                                      | Same.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `frontend/src/design-system/hooks/useDensity.ts`                 | Same as above                                                                                                                                         | Same pattern.                                                                                                                                                                                      | Same.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `frontend/src/design-system/hooks/useDesignTokens.ts`            | Same as above                                                                                                                                         | Read-only selector over resolved `TokenSet`.                                                                                                                                                       | `export function useDesignTokens(): TokenSet { const ctx = useContext(DesignContext); ... return ctx.tokens }`.                                                                                                                                                                                                                                                                                                                                             |
| `frontend/src/components/ui/heroui-button.tsx` (rewrite)         | **`frontend/src/components/ui/heroui-forms.tsx:11-22`** (correct HeroUI v3 usage) + `frontend/src/components/ui/heroui-modal.tsx:14` (import pattern) | `heroui-forms.tsx` already imports real `@heroui/react` primitives — the template for what the button should become. Current `heroui-button.tsx` is a plain `<button>` stub (lines 93-109).        | Replace `const Comp = asChild ? Slot : 'button'` (line 93) with `import { Button as HeroUIButtonPrimitive } from '@heroui/react'`; keep `buttonVariants` cva block (lines 25-53) for `asChild+Slot` escape hatch; render `<HeroUIButtonPrimitive className={cn(buttonVariants(...), className)}>` when not `asChild`. Preserve `HeroUIButtonProps` interface (lines 59-72).                                                                                 |
| `frontend/src/components/ui/heroui-card.tsx` (rewrite)           | `frontend/src/components/ui/heroui-modal.tsx:109-128` (compound-component HeroUI pattern w/ `Modal.Backdrop`, `Modal.Container`, `Modal.Dialog`)      | CLAUDE.md mandates compound pattern (`Card.Header`, `Card.Body`). Modal is the only existing file showing this.                                                                                    | Replace each plain `<div data-slot="card-header">` (current lines 33-44, 50-57, etc.) with `<Card.Header>`, `<Card.Body>`, `<Card.Footer>` from `@heroui/react`. Keep `data-slot` attributes for downstream CSS has-selectors (lines 36, 52, 65, 79, 92, 101). Keep named exports `HeroUICard`, `HeroUICardHeader`, ... so `components/ui/card.tsx:8-16` re-export remains valid.                                                                           |
| `frontend/src/components/ui/heroui-chip.tsx` (rewrite)           | `frontend/src/components/ui/heroui-forms.tsx:11-22` + current chip's cva block                                                                        | HeroUI has no `Chip` primitive as distinct from Badge — keep cva variants, render real HeroUI `Chip`.                                                                                              | `import { Chip as HeroUIChipPrimitive } from '@heroui/react'`; preserve `badgeVariants` cva (lines 18-40) and `HeroUIChipProps` (lines 46-49); render `<HeroUIChipPrimitive className={cn(badgeVariants({variant}), className)}>`. Keep `asChild+Slot` branch (line 59) so `span`-rendered callers still work.                                                                                                                                              |
| `frontend/src/components/ui/heroui-modal.tsx` (rewrite / polish) | **Itself** — already uses real HeroUI primitives.                                                                                                     | Currently the ONLY wrapper actually consuming `@heroui/react` (line 14). Only polish needed: fix stale `useDirection` import path if hook moves to `design-system/hooks/` (line 16).               | Update import from `@/hooks/useDirection` → `@/design-system/hooks/useDirection`. No other structural changes.                                                                                                                                                                                                                                                                                                                                              |
| `frontend/src/components/ui/heroui-skeleton.tsx` (rewrite)       | `frontend/src/components/ui/heroui-forms.tsx:11-22`                                                                                                   | Skeleton is a HeroUI primitive (`Skeleton` in `@heroui/react`). Current impl is a plain div (lines 15-17).                                                                                         | Replace `<div className={cn('animate-pulse rounded-lg bg-muted', className)}>` with `import { Skeleton as HeroUISkeletonPrimitive } from '@heroui/react'`; `<HeroUISkeletonPrimitive className={cn(className)} {...props} />`.                                                                                                                                                                                                                              |
| `frontend/src/components/ui/heroui-forms.tsx` (polish)           | **Itself** — already uses real HeroUI primitives.                                                                                                     | Lines 11-22 already import `TextField, Input, TextArea, Label, Description, FieldError, Select, Checkbox, Switch` from `@heroui/react`.                                                            | Polish only: verify no `textAlign: 'right'` (RTL rule), confirm `min-h-11 sm:min-h-10` on all interactive controls (44px touch target per CLAUDE.md).                                                                                                                                                                                                                                                                                                       |
| `frontend/heroui.config.ts` (NEW)                                | **No precedent.** Closest: `frontend/tailwind.config.ts:1-3` (TS config module shape).                                                                | New config file for HeroUI v3 theme plugin. No existing HeroUI config in repo.                                                                                                                     | `import type {...} from '@heroui/styles'`; `const config: HeroUIConfig = { themes: { chancery: { colors: { primary: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-fg)' }, danger: 'var(--danger)', success: 'var(--ok)', warning: 'var(--warn)', default: 'var(--surface)' } }, situation: {...}, ... } }; export default config`. Match `tailwind.config.ts` format: typed `Config`, named `const config`, `export default config`.                |
| Inline bootstrap script in `frontend/index.html`                 | `frontend/index.html:15-20` (existing inline font-preload pattern)                                                                                    | Only inline `<script>` / `<link onload="...">` pattern in this file. Shows the project's inline-asset convention.                                                                                  | Insert between line 59 (`<title>...`) and line 61 (`<body>`) OR between line 61 and line 62 (before `<script type="module">`). Use plain ES5 (no imports, no modules). Keep ~2 KB (D-03). Read `localStorage.getItem('id.dir')` etc., compute minimum OKLCH math, call `documentElement.style.setProperty(...)`.                                                                                                                                            |
| `.storybook/main.ts` (NEW)                                       | **No precedent** — project has no Storybook.                                                                                                          | Standard `@storybook/react-vite` config.                                                                                                                                                           | Follow Storybook 8+ docs: `framework: { name: '@storybook/react-vite', options: {} }`, `stories: ['../frontend/src/**/*.stories.@(ts\|tsx)']`. Match project TS config style (strict types).                                                                                                                                                                                                                                                                |
| `.storybook/preview.tsx` (NEW)                                   | `frontend/src/App.tsx:26-56` (provider stack)                                                                                                         | Preview decorators need the same provider stack at runtime.                                                                                                                                        | Wrap stories in `<DesignProvider>` + `<LanguageProvider>`. Copy decorator shape from App.tsx line 37-50 (minus router/auth).                                                                                                                                                                                                                                                                                                                                |

## Section 2: Files to modify

### `frontend/src/index.css`

**Current state (relevant sections):**

- Lines 19-49: `:root, [data-theme='canvas'] { --base-50..1000, --primary-50..950 ... }` — HSL scale block for Canvas
- Line 20: `[data-theme='canvas'] {` opens Canvas block
- Line 118: `[data-theme='azure'] {` opens Azure block
- Line 176: `[data-theme='lavender'] {` opens Lavender block
- Line 233: `[data-theme='bluesky'] {` opens BlueSky block
- Line 287: `[data-theme="ocean"] {` (inside a comment block — legacy comment, safe)
- Line 356: `[data-theme='azure'] {` second block (data-theme dark variants region)
- Line 363: `[data-theme='azure'].dark {`
- Line 379: `[data-theme='lavender'] {`
- Line 386: `[data-theme='lavender'].dark {`
- Line 402: `[data-theme='bluesky'] {`
- Line 409: `[data-theme='bluesky'].dark {`
- Line 425: `[data-theme='canvas'].dark {`
- Line 492: `[data-theme='canvas'] {` third block
- Line 639: `[data-theme='azure'] {` fourth block
- Line 726: `[data-theme='azure'].dark {`
- Line 768: `[data-theme='lavender'] {`
- Line 841: `[data-theme='lavender'].dark {`
- Line 883: `[data-theme='bluesky'] {`
- Line 969: `[data-theme='bluesky'].dark {`
- Total: 1344 lines

**Required changes (D-09, D-12, D-16):**

- Delete every `[data-theme='canvas|azure|lavender|bluesky']` block (19 occurrences, roughly lines 19-480 + 630-1000)
- Delete all `--base-50..1000` and `--primary-50..1000` HSL scales
- Keep `@import 'tailwindcss'` (line 10) and `@config "../tailwind.config.ts"` (line 11)
- Insert `@theme { --color-bg: var(--bg); --color-surface: var(--surface); ... }` block after line 11 (D-16 utility bindings)
- Insert empty `:root { }` placeholder — runtime engine writes vars via `setProperty`
- Insert semantic remap `:root { --primary: var(--accent); --foreground: var(--ink); --border: var(--line); --background: var(--bg); --card: var(--surface); --popover: var(--surface-raised); ... }` (D-12 legacy class compat)
- Keep non-theme utility sections (typography, radius, transitions at lines 52-111) — still referenced by Tailwind config

### `frontend/tailwind.config.ts`

**Required changes:**

- Lines 29-120 `extend.colors` block: replace every `hsl(var(--X))` wrapper with `var(--Y)` direct reference
  - Line 29: `border: 'hsl(var(--border))'` → `border: 'var(--line)'`
  - Line 32: `background: 'hsl(var(--background))'` → `background: 'var(--bg)'`
  - Line 33: `foreground: 'hsl(var(--foreground))'` → `foreground: 'var(--ink)'`
  - Line 34-37: `primary.DEFAULT/foreground` → `var(--accent)` / `var(--accent-fg)`
  - Lines 70-72 card → `var(--surface)` / `var(--ink)`
  - Lines 66-68 popover → `var(--surface-raised)` / `var(--ink)`
  - Lines 58-60 muted.foreground → `var(--ink-mute)`
- Keep lines 122-201 (borderRadius, fontFamily, fontSize, lineHeight, keyframes, animation, boxShadow) unchanged — all reference non-theme vars
- Keep lines 205-268 RTL logical-property plugin unchanged

### `frontend/src/main.tsx`

**Current state:** 28 lines. `createRoot(...).render(<StrictMode><App /></StrictMode>)` at line 24. No provider wrapping here.

**Required changes:** None. Providers are in `App.tsx`. `main.tsx` stays untouched.

### `frontend/src/App.tsx`

**Current state:**

- Line 15: `import { ThemeProvider } from './components/theme-provider/theme-provider'`
- Line 33: `fallbackTheme="canvas"` on `<ThemeErrorBoundary>`
- Line 37: `<ThemeProvider initialTheme="canvas" initialColorMode="light">`

**Required changes:**

- Line 15: swap to `import { DesignProvider } from './design-system/DesignProvider'`
- Line 33: remove or change `fallbackTheme="canvas"` (ThemeErrorBoundary will also need Phase 34 attention; flag for now)
- Line 37: replace with `<DesignProvider initialDirection="chancery" initialMode="light" initialHue={22} initialDensity="comfortable">`
- Line 49: closing `</ThemeProvider>` → `</DesignProvider>`

### `frontend/src/components/theme-provider/theme-provider.tsx`

**Current state:** 263 lines. Full context implementation.

**Required changes (D-11 shim):**

- Keep the file but gut it to a ~30-line shim
- Remove lines 7-31 (Theme type + AVAILABLE_THEMES + THEME_TO_PRESET + isTheme + normalizeTheme)
- Remove lines 45-255 (full context)
- Keep **only** the legacy `useTheme()` export:
  ```ts
  import { useDirection } from '@/design-system/hooks/useDirection'
  import { useMode } from '@/design-system/hooks/useMode'
  export function useTheme() {
    console.warn('useTheme is deprecated. Use useDirection/useMode from @/design-system/hooks')
    const { direction } = useDirection()
    const { mode, setMode } = useMode()
    return {
      theme: direction,
      colorMode: mode,
      setTheme: () => {},
      setColorMode: setMode,
      isDark: mode === 'dark',
    }
  }
  ```
- Keep `AVAILABLE_THEMES` export as `[]` deprecated empty array to avoid import breakage until Phase 34.
- Remove the `ThemeProvider` export entirely (nothing should import it after App.tsx swap).

### `frontend/src/hooks/useTheme.ts`

**Current state:** 128 lines. Re-exports `useTheme` from theme-provider + defines its own `useDirection()` (lines 75-114, DIFFERENT from `hooks/useDirection.ts`).

**Required changes:**

- Lines 2-5: keep re-export of `useTheme` (shim still works)
- **CONFLICT:** lines 75-114 define a second `useDirection` that reads `document.documentElement.dir` via MutationObserver. New Phase 33 `useDirection` reads design palette direction. Rename the legacy one → `useDocDirection` or inline remove; update callers. Run Grep `useDirection` across frontend/src to find collision sites (expect 5-15 callers).

### `frontend/src/components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `skeleton.tsx`

**Current state:**

- `card.tsx` (16 lines) — pure re-export from `./heroui-card`. **No change.**
- `badge.tsx` (9 lines) — pure re-export from `./heroui-chip`. **No change.**
- `button.tsx` (59 lines) — full shadcn implementation, NOT a re-export. Parallel to `heroui-button.tsx`.
- `skeleton.tsx` (101 lines) — full shadcn implementation, NOT a re-export. Parallel to `heroui-skeleton.tsx`.

**Required changes:**

- `button.tsx`: convert to re-export pattern: `export { HeroUIButton as Button, buttonVariants } from './heroui-button'; export type { ButtonProps } from './heroui-button'`. Match `card.tsx:8-16` / `badge.tsx:8-9` style.
- `skeleton.tsx`: convert to re-export: `export { HeroUISkeleton as Skeleton } from './heroui-skeleton'`. Preserve `SkeletonCard` and other preset exports (lines 15+) as thin wrappers around `HeroUISkeleton`.

### Legacy theme audit — `canvas|azure|lavender|bluesky` string references

**Files to audit** (Grep result, 25 files):

| File                                                                        | Notes                                                                                                                         |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/App.tsx`                                                      | Lines 33, 37 — change per D-11 / D-02 above                                                                                   |
| `frontend/src/components/theme-provider/theme-provider.tsx`                 | File becomes shim; strings removed                                                                                            |
| `frontend/src/components/theme-selector/ThemeSelector.tsx`                  | Dead code after Phase 33. Phase 34 deletes. Leave untouched.                                                                  |
| `frontend/src/components/theme-error-boundary/ThemeErrorBoundary.tsx`       | Prop `fallbackTheme: 'canvas'` — update default, or swap to `fallbackDirection: 'chancery'`.                                  |
| `frontend/src/components/settings/sections/AppearanceSettingsSection.tsx`   | Likely theme picker UI. Review; if dead, defer to Phase 34.                                                                   |
| `frontend/src/pages/settings/SettingsPage.tsx`                              | Hosts appearance section; review.                                                                                             |
| `frontend/src/index.css`                                                    | Handled above (D-09 hard cut)                                                                                                 |
| `frontend/src/styles/themes/types.ts`                                       | Lines 54, 90, 98 — theme name union. Rewrite to Direction union or delete file (unused after hard cut).                       |
| `frontend/src/utils/storage/preference-storage.ts`                          | Read-path for localStorage `theme` key. Replace with `id.dir/id.theme/id.hue/id.density`. Wipe old keys on first load (D-10). |
| `frontend/src/types/settings.types.ts`                                      | Theme enum type. Update to Direction.                                                                                         |
| `frontend/src/services/preference-sync.ts`                                  | Cross-tab sync service for prefs. Update key names.                                                                           |
| `frontend/src/i18n/en/settings.json`, `frontend/src/i18n/ar/settings.json`  | Translation strings mentioning theme names. Update copy to Direction names (Chancery, Situation Room, Ministerial, Bureau).   |
| `frontend/src/i18n/en/milestone-planning.json`                              | One-off content reference. Verify, update if describing themes.                                                               |
| `frontend/src/components/ui/sidebar.tsx`                                    | May reference theme classes in className. Verify — likely safe because D-12 remap keeps semantic classes working.             |
| `frontend/src/components/ui/placeholders-and-vanish-input.tsx`              | Same as above.                                                                                                                |
| `frontend/src/components/milestone-planning/MilestonePlannerEmptyState.tsx` | Likely cosmetic theme copy. Review.                                                                                           |
| `frontend/src/components/engagements/ForumSessionCreator.tsx`               | Review.                                                                                                                       |
| `frontend/src/components/contacts/BusinessCardScanner.tsx`                  | Review.                                                                                                                       |
| `frontend/tests/unit/preference-merge.test.ts`                              | Test uses old `theme: 'gastat' \| 'blueSky'` (line 6). Update to Direction union.                                             |
| `frontend/tests/integration/theme-persistence.test.tsx`                     | Preference key test. Update keys.                                                                                             |
| `frontend/tests/integration/test_theme_switch.test.tsx`                     | Theme switcher test. Likely dead after Phase 34.                                                                              |
| `frontend/tests/integration/default-theme.test.tsx`                         | Update to Direction defaults.                                                                                                 |
| `frontend/tests/integration/cross-tab-sync.test.tsx`                        | Update preference keys per D-10.                                                                                              |
| `frontend/DESIGN_SYSTEM_MIGRATION.md`                                       | Documentation. Update or delete.                                                                                              |

## Section 3: HeroUI wrapper file layout (before/after)

### Before — `heroui-button.tsx` lines 81-110 (stub)

```tsx
function HeroUIButton({ className, variant, size, asChild = false, ...props }: HeroUIButtonProps) {
  const Comp = asChild ? Slot : 'button'  // ← renders plain <button>
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }), ...)}
      {...props}
    />
  )
}
```

### After — real HeroUI consumer (template from `heroui-modal.tsx:14, 109-128` + `heroui-forms.tsx:11-22`)

```tsx
import { Button as HeroUIButtonPrimitive } from '@heroui/react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(/* existing cva block, lines 25-53, unchanged */)

function HeroUIButton({ className, variant, size, asChild = false, ...props }: HeroUIButtonProps) {
  if (asChild) {
    return <Slot className={cn(buttonVariants({ variant, size }), className)} {...props} />
  }
  return (
    <HeroUIButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { HeroUIButton, buttonVariants }
export default HeroUIButton
```

**Key invariants preserved across all 6 wrappers:**

1. `data-slot="..."` attribute (for CSS `has-[data-slot=X]` selectors — see `heroui-card.tsx:38`)
2. `cn(variants(...), className)` merge order (incoming className wins)
3. `asChild` + `Slot` escape hatch where the current file has it
4. Named export + default export + re-export line in `components/ui/<name>.tsx`
5. Props interface name `HeroUI<Name>Props` with backwards-compat type alias (see `heroui-button.tsx:75` — `export type ButtonProps = HeroUIButtonProps`)

## Section 4: Naming and export conventions

**Token module file style** (copy from `frontend/src/lib/utils.ts` + `frontend/src/types/breakpoint.ts`):

- Top-of-file JSDoc comment describing purpose
- `import { X } from '@/lib/utils'` uses `@` alias (= `src/`) — never relative when >1 level deep
- Named exports only (no default) for pure-function and type modules
- Explicit return types on every function (ESLint `@typescript-eslint/explicit-function-return-type: error`)
- No `any` (ESLint `@typescript-eslint/no-explicit-any: error`)
- camelCase functions, PascalCase types, SCREAMING_SNAKE_CASE only for true constants (e.g. `DEFAULT_PREFERENCES`)

**Hook file style** (copy from `frontend/src/hooks/useDirection.ts` + `theme-provider.tsx:257-263`):

- One primary hook per file, named `use<Name>`
- File name matches hook name: `useDirection.ts`, `useMode.ts`, etc.
- `export function useX(): ReturnType { ... }` — explicit return type required
- Throw when context is missing: `if (!ctx) throw new Error('useX must be used within DesignProvider')`
- No default export

**Provider file style** (copy from `frontend/src/components/theme-provider/theme-provider.tsx`):

- File name PascalCase matches primary export: `DesignProvider.tsx`
- Directory layout: `frontend/src/design-system/DesignProvider.tsx` (NOT `.../design-provider/DesignProvider.tsx`) per D-02 spec. Project uses both conventions — follow spec.
- Top-of-file comment explaining context-split audit (see theme-provider.tsx:1-3)
- `createContext<T | undefined>(undefined)`
- Provider tagged with `data-testid="design-provider"` on wrapper `<div>` (see theme-provider.tsx:252)
- `useCallback` for every setter
- Dispatch `CustomEvent('designChange', { detail: {...} })` after state change (parallel to `themeChange`, theme-provider.tsx:151-162)
- Cross-tab sync via `storage` event listener (theme-provider.tsx:202-226)

**Barrel export style:** Project does **not use barrel `index.ts` files** anywhere under `frontend/src/` (verified: no `hooks/index.ts`, no `lib/index.ts`, no `types/index.ts`). Recommend **omit** `design-system/tokens/index.ts` — have callers import from specific leaf files. If planner insists, use `export * from './buildTokens'` style.

**Re-export style** (copy from `frontend/src/components/ui/card.tsx`, `badge.tsx`):

- Top-of-file JSDoc explaining this is a re-export for compat
- `export { HeroUIX as X } from './heroui-x'` — rename-on-re-export
- `export type { XProps } from './heroui-x'` for types
- No other code in the file

**Test file style** (copy from `frontend/tests/unit/preference-merge.test.ts`):

- `import { describe, it, expect } from 'vitest'` — Vitest globals disabled
- Location: `frontend/tests/unit/<name>.test.ts` for pure-TS modules; `frontend/tests/unit/<Name>.test.tsx` for React
- Top-level `describe('<module name>', () => { it('<behavior>', () => { ... }) })`
- Test data inlined; no shared fixture dirs used for this type of module
- Uses semicolons in test files (inconsistent with project `semi: false` — but pattern from existing test)

## Section 5: Test pattern

**Closest analog:** `frontend/tests/unit/preference-merge.test.ts` — tests a pure function (`mergePreferences`) against a type union. Exactly matches `buildTokens()` test shape.

```ts
import { describe, it, expect } from 'vitest'
import { buildTokens } from '@/design-system/tokens/buildTokens'

describe('buildTokens', () => {
  it('produces canonical token set for Chancery / light / 22° / comfortable', () => {
    const tokens = buildTokens({
      direction: 'chancery',
      mode: 'light',
      hue: 22,
      density: 'comfortable',
    })
    expect(tokens['--bg']).toMatch(/^oklch\(/)
    expect(tokens['--accent']).toMatch(/22\)$/)
    expect(tokens['--row-h']).toBe('52px')
  })

  it('applies +55° warm shift to --sla-risk', () => {
    const tokens = buildTokens({
      direction: 'chancery',
      mode: 'light',
      hue: 100,
      density: 'comfortable',
    })
    expect(tokens['--sla-risk']).toContain(' 155)') // 100 + 55
  })

  it('flips accent-ink lightness in dark mode (72% dark vs 42% light)', () => {
    const light = buildTokens({
      direction: 'chancery',
      mode: 'light',
      hue: 22,
      density: 'comfortable',
    })
    const dark = buildTokens({
      direction: 'chancery',
      mode: 'dark',
      hue: 22,
      density: 'comfortable',
    })
    expect(light['--accent-ink']).toContain('42%')
    expect(dark['--accent-ink']).toContain('72%')
  })
})
```

**For `applyTokens` (DOM-writer):** Use `@testing-library` + jsdom (matches `frontend/tests/unit/FormInput.test.tsx`). Assert `document.documentElement.style.getPropertyValue('--bg')` equals expected after call. Assert cleanup fn removes vars.

**For `DesignProvider` + hooks:** Use `@testing-library/react` `renderHook` with wrapper. Pattern: render hook → assert initial state → fire setter → assert DOM + localStorage side-effects. Closest analog: `frontend/tests/integration/theme-persistence.test.tsx`.

---

## Pattern Summary for Planner

- **Token module files** — copy `breakpoint.ts` + `utils.ts` style: pure, named exports, explicit return types, no barrel.
- **Hooks** — copy `hooks/useDirection.ts` six-line shape + `theme-provider.tsx:257-263` error-throw.
- **DesignProvider** — copy entire skeleton of `theme-provider.tsx` (audit comment, lazy `useState`, `useEffect` DOM-writer, `useCallback` setters, `storage` event listener, `CustomEvent` dispatch, `data-testid` wrapper). Change state shape only.
- **HeroUI wrappers** — `heroui-modal.tsx` (lines 14, 109-128) + `heroui-forms.tsx` (lines 11-22) are the ONLY two wrappers currently doing it right. Other 4 (`heroui-button.tsx`, `heroui-card.tsx`, `heroui-chip.tsx`, `heroui-skeleton.tsx`) are plain HTML stubs — rewrite to match forms/modal shape.
- **Re-exports** — `card.tsx` (16 lines) is the template. `button.tsx` and `skeleton.tsx` currently violate this — convert to re-export.
- **Tests** — `tests/unit/preference-merge.test.ts` is the pure-function test template.
- **Legacy audit** — 25 files reference `canvas|azure|lavender|bluesky`. Of these: ~6 are dead code Phase 34 deletes, ~8 are test files updating keys, ~5 need real refactoring (index.css, theme-provider, styles/themes/types.ts, settings.types.ts, preference-storage.ts, preference-sync.ts, ThemeErrorBoundary).

**Metadata**

- Analog search scope: `frontend/src/components/ui/`, `frontend/src/hooks/`, `frontend/src/components/theme-provider/`, `frontend/src/lib/`, `frontend/src/types/`, `frontend/tests/unit/`, `frontend/src/components/language-provider/`
- Files scanned: ~40
- Pattern extraction date: 2026-04-19
