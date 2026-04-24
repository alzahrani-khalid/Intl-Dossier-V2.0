# Phase 37: signature-visuals - Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 40 (9 component files + 24 flag TSX + 1 hook + 10 test files + 1 AppShell edit + 1 size-limit config)
**Analogs found:** 38 / 40 (2 NEW-PATTERN: `.size-limit.json` + lazy-d3 `ensureWorld.ts`)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `frontend/src/components/signature-visuals/GlobeLoader.tsx` | component (animated visual) | event-driven (rAF loop) | `frontend/src/components/ui/pull-to-refresh-indicator.tsx` (SVG + currentColor) + handoff `loader.jsx` | role-match (different animation engine — rAF vs framer-motion) |
| `frontend/src/components/signature-visuals/FullscreenLoader.tsx` | component (portal overlay) | request-response (state→open prop) | `frontend/src/components/layout/AppShell.tsx` lines 218–234 (HeroUI Drawer portal pattern) | partial (overlay + state, but not a Drawer) |
| `frontend/src/components/signature-visuals/GlobeSpinner.tsx` | component (static SVG) | transform (none) | `frontend/src/components/brand/GastatLogo.tsx` (inline SVG `fill="currentColor"` + viewBox + aria-hidden) | **exact** |
| `frontend/src/components/signature-visuals/DossierGlyph.tsx` | component (discriminated union resolver) | transform (type → JSX) | `frontend/src/components/brand/GastatLogo.tsx` (pure SVG component shape) | role-match |
| `frontend/src/components/signature-visuals/flags/sa.tsx` (+ 23 siblings) | component (pure SVG leaf) | transform (none) | `frontend/src/components/brand/GastatLogo.tsx` | **exact** |
| `frontend/src/components/signature-visuals/flags/index.ts` | barrel (keyed map) | transform (import → map) | `frontend/src/design-system/hooks/index.ts` (named re-exports) | role-match (barrel, but map-literal rather than re-export) |
| `frontend/src/components/signature-visuals/Sparkline.tsx` | component (SVG + RTL flip) | transform (number[] → polyline) | `frontend/src/components/ui/pull-to-refresh-indicator.tsx` + `frontend/src/components/brand/GastatLogo.tsx` | role-match |
| `frontend/src/components/signature-visuals/Donut.tsx` | component (SVG + strokeDasharray) | transform (value+variants → SVG) | `frontend/src/components/ui/pull-to-refresh-indicator.tsx` lines 91–184 (ring + dasharray math) | **exact** |
| `frontend/src/components/signature-visuals/ensureWorld.ts` | utility (memoized loader) | request-response (dynamic import) | NONE — NEW PATTERN (use RESEARCH.md §"Pattern 1: Lazy d3-geo import") | **no analog** |
| `frontend/src/components/signature-visuals/globeLoaderSignal.ts` | utility (module-scoped signal) | pub-sub (subscribe → notify) | React `useSyncExternalStore` canonical shape — see `frontend/src/design-system/hooks/useDesignDirection.ts` context pattern as distant analog | partial |
| `frontend/src/components/signature-visuals/globe-loader.css` | asset (CSS @keyframes) | N/A | No co-located CSS files exist in codebase; Tailwind-only elsewhere | **no analog — accept NEW-PATTERN per D-13** |
| `frontend/src/components/signature-visuals/index.ts` | barrel (re-export) | transform | `frontend/src/design-system/hooks/index.ts` | **exact** |
| `frontend/src/design-system/hooks/useReducedMotion.ts` | hook (matchMedia subscribe) | event-driven (subscribe) | `frontend/src/design-system/hooks/useDesignDirection.ts` (12-line hook shape) | role-match (both small hooks; the analog uses context, ours uses `useSyncExternalStore`) |
| `frontend/src/design-system/hooks/index.ts` (MODIFIED) | barrel (add export) | transform | itself | **exact** — surgical append |
| `frontend/src/components/signature-visuals/__tests__/GlobeLoader.test.tsx` | test (integration) | pub-sub (mock rAF) | `frontend/src/components/brand/GastatLogo.test.tsx` + `frontend/src/components/layout/AppShell.test.tsx` | role-match |
| `frontend/src/components/signature-visuals/__tests__/DossierGlyph.*.test.tsx` | test (unit) | transform | `frontend/src/components/brand/GastatLogo.test.tsx` | **exact** |
| `frontend/src/components/signature-visuals/__tests__/GlobeSpinner.test.tsx` | test (unit) | transform | `frontend/src/components/brand/GastatLogo.test.tsx` | **exact** |
| `frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx` | test (unit) | transform | `frontend/src/components/brand/GastatLogo.test.tsx` + AppShell RTL-flip assertion pattern (lines 175–192) | role-match |
| `frontend/src/components/signature-visuals/__tests__/Donut.test.tsx` | test (unit) | transform | `frontend/src/components/brand/GastatLogo.test.tsx` | **exact** |
| `frontend/src/components/signature-visuals/__tests__/reduced-motion.test.tsx` | test (unit; matchMedia mock) | pub-sub | `frontend/src/components/layout/AppShell.test.tsx` lines 104–115 (matchMedia mock) | **exact** |
| `frontend/src/components/signature-visuals/__tests__/dev-gate.test.ts` | test (unit; env gate) | transform | AppShell.test.tsx module-mock idiom | partial |
| `frontend/e2e/signature-visuals/*.spec.ts` | e2e (Playwright) | pub-sub (screenshot + matchers) | `frontend/tests/e2e/after-action-publish.spec.ts` (existing Playwright spec — sibling directory) | role-match |
| `frontend/.size-limit.json` | config (NEW file) | N/A | **NONE — NEW PATTERN** | no analog (use `size-limit` docs at plan time) |
| `frontend/src/components/layout/AppShell.tsx` (MODIFIED) | component (wrap Suspense) | N/A | itself — lines 203–212 `<main>` block is the target | **exact** |

---

## Pattern Assignments

### `frontend/src/components/signature-visuals/GlobeSpinner.tsx` (component, static SVG)

**Analog:** `frontend/src/components/brand/GastatLogo.tsx` (verified: inline SVG, `fill="currentColor"`, `viewBox` preserved verbatim, `aria-hidden`, no raw HTML injection)

**Imports pattern** (GastatLogo.tsx lines 15):
```tsx
import type { ReactElement } from 'react'
```

**Props + return-type pattern** (lines 17–22):
```tsx
export interface GastatLogoProps {
  className?: string
  size?: number
}

export function GastatLogo({ className, size = 22 }: GastatLogoProps): ReactElement {
```

**Core SVG pattern** (lines 23–32):
```tsx
return (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 162.98 233.12"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
```

**Apply to `GlobeSpinner.tsx`:** Copy this shape exactly. Substitute `viewBox="0 0 40 40"` and inline `<g className="gs-whirl">` + `<g className="gs-globe">` children (see RESEARCH.md §"GlobeSpinner (verbatim port)" lines 421–462). Accept an optional `'aria-label'` prop because it is a `role="status"` (not decorative) — so use `aria-label` INSTEAD of `aria-hidden`.

---

### `frontend/src/components/signature-visuals/flags/sa.tsx` (24 leaves)

**Analog:** `frontend/src/components/brand/GastatLogo.tsx`

**Pattern to copy:** Same shape as `GastatLogo.tsx` with these deltas:
- `viewBox="0 0 32 32"` (D-09 handoff flags use 32×32)
- **No `width`/`height`** — flag renders inside DossierGlyph's outer `<svg>`; parent owns sizing
- **No `fill="currentColor"`** — flag paths use named palette colors from handoff
- Keep `aria-hidden="true"` (DossierGlyph owns the a11y label)
- `className` optional, but parent sets clipPath

**Named export shape** (for tree-shakeable barrel):
```tsx
// frontend/src/components/signature-visuals/flags/sa.tsx
import type { ReactElement } from 'react'

export function SaudiArabiaFlag(): ReactElement {
  return (
    <g aria-hidden="true">
      {/* verbatim <path d="…" fill="…"/> definitions from handoff glyph.jsx */}
    </g>
  )
}
```

**Critical:** Return a `<g>` not a `<svg>` — DossierGlyph wraps all flags in a single outer `<svg>` with `clipPath` (VIZ-04 circle clip). Each flag TSX is a reusable SVG fragment.

---

### `frontend/src/components/signature-visuals/flags/index.ts` (barrel map)

**Analog:** `frontend/src/design-system/hooks/index.ts` (named re-export idiom)

**Analog pattern** (lines 8–18):
```ts
export { useDesignDirection } from './useDesignDirection'
export { useMode } from './useMode'
// ... plus value-level map
```

**Delta for flags barrel:** Consumers need a KEYED MAP, not just named exports. Combine both:
```ts
// frontend/src/components/signature-visuals/flags/index.ts
import { SaudiArabiaFlag } from './sa'
import { UnitedArabEmiratesFlag } from './ae'
// ... 24 imports total

export { SaudiArabiaFlag } from './sa'
export { UnitedArabEmiratesFlag } from './ae'
// ... so each flag is individually tree-shakeable when imported by name

export type FlagKey =
  | 'sa' | 'ae' | 'id' | 'eg' | 'qa' | 'jo' | 'bh' | 'om' | 'kw' | 'pk'
  | 'ma' | 'tr' | 'cn' | 'it' | 'fr' | 'de' | 'gb' | 'us' | 'jp' | 'kr'
  | 'in' | 'br' | 'eu' | 'un'

export const flags: Record<FlagKey, () => ReactElement> = {
  sa: SaudiArabiaFlag,
  ae: UnitedArabEmiratesFlag,
  // ...
}
```

**Tree-shake caveat:** Because `flags` map holds references to all 24 components, importing `flags` defeats tree-shaking. DossierGlyph MUST use a dynamic key lookup pattern that Vite can statically resolve, OR accept the full-bundle cost and justify it in a code comment. (The 24 flags total ~5KB combined, so full bundle is acceptable per RESEARCH.md A9.)

---

### `frontend/src/components/signature-visuals/DossierGlyph.tsx` (discriminated union)

**Analog:** None directly — use RESEARCH.md §"DossierGlyph resolver skeleton" lines 465–521 as the primary reference.

**Pattern for DossierType import** (from `frontend/src/types/dossier-context.types.ts` line 71):
```ts
import type { DossierType } from '@/types/dossier-context.types'
```

**Critical Pitfall 6 (RESEARCH.md):** DossierType union has 8 members (`country | organization | forum | engagement | topic | working_group | person | elected_official`). Handoff glyph.jsx only handles 5. Unsupported types (`engagement`, `working_group`, `elected_official`) MUST fall back to initials via `<InitialsBadge name={…} />` per D-11 — DO NOT throw.

---

### `frontend/src/components/signature-visuals/Sparkline.tsx` (RTL-aware)

**Analog imports & hook usage:** `frontend/src/components/ui/pull-to-refresh-indicator.tsx` line 29:
```tsx
import { useDirection } from '@/hooks/useDirection'
```

**CAUTION — hook path:** AppShell.tsx (line 54–61 comment block) warns that **plan hooks can be stale**. The DOM-level hook is `@/hooks/useDirection`; the design-system hook is `@/design-system/hooks/useDesignDirection`. For Sparkline RTL flip, either works — pick `useDesignDirection` since primitives are design-system scope. Pattern:

```tsx
import { useDesignDirection } from '@/design-system/hooks'

export function Sparkline({ data }: { data: number[] }): ReactElement {
  const { direction } = useDesignDirection()
  const isRTL = direction === 'rtl'  // Note: direction enum includes chancery/situation — need actual locale check
  // ... better: import { useLocale } and check locale === 'ar'
}
```

**BETTER PATTERN (per RESEARCH.md Open Question O-4):** Use `useLocale()` from `@/design-system/hooks` which returns `'ar' | 'en'` directly (file: `frontend/src/design-system/hooks/useLocale.ts`):
```tsx
import { useLocale } from '@/design-system/hooks'
const { locale } = useLocale()
const isRTL = locale === 'ar'
```

**SVG structure pattern (Donut dasharray math):** Copy from `pull-to-refresh-indicator.tsx` lines 91–184 (ring + `strokeDasharray` + `strokeDashoffset` math).

---

### `frontend/src/components/signature-visuals/Donut.tsx` (stacked dasharray)

**Analog:** `frontend/src/components/ui/pull-to-refresh-indicator.tsx` lines 91–184

**Core dasharray pattern** (lines 91–93, 158–184):
```tsx
const ringRadius = 16
const ringCircumference = 2 * Math.PI * ringRadius
const ringOffset = ringCircumference * (1 - progress)

// ...
<svg className="absolute h-10 w-10 -rotate-90" viewBox="0 0 40 40">
  <circle
    cx="20" cy="20" r={ringRadius}
    fill="none" stroke="currentColor" strokeWidth="2"
    className="text-muted-foreground/20"
  />
  <m.circle
    cx="20" cy="20" r={ringRadius}
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round"
    strokeDasharray={ringCircumference}
    strokeDashoffset={ringOffset}
  />
</svg>
```

**Delta for Donut:** Use plain `<circle>` (no framer-motion `m.circle`) per D-13. Three stacked circles with `strokeDasharray="${seg} ${c}"` + `strokeDashoffset={-accumulator}` + `transform="rotate(-90 18 18)"` — see RESEARCH.md §"Donut via stacked strokeDasharray" lines 525–556.

**Token colors:** Use `var(--ok)`, `var(--risk)`, `var(--bad)` (Phase 33 tokens). Base track: `var(--surface-raised)`. Text fill: `var(--ink)`.

---

### `frontend/src/components/signature-visuals/FullscreenLoader.tsx` (portal overlay)

**Analog:** `frontend/src/components/layout/AppShell.tsx` lines 218–234 (HeroUI Drawer with portal) — pattern, NOT code. FullscreenLoader is NOT a Drawer but shares the "rendered above all content" responsibility.

**Subscribe pattern** (for `window.__showGlobeLoader` ↔ `open` prop bridge):

Use a module-scoped signal per RESEARCH.md Open Question O-3 recommendation (module-scoped `let` + `useSyncExternalStore`):

```tsx
// frontend/src/components/signature-visuals/globeLoaderSignal.ts
type Listener = () => void
let state = { open: false, expiresAt: 0 }
const listeners = new Set<Listener>()

export function showGlobeLoader(ms: number): void {
  state = { open: true, expiresAt: Date.now() + ms }
  listeners.forEach((l) => l())
  setTimeout(() => {
    state = { open: false, expiresAt: 0 }
    listeners.forEach((l) => l())
  }, ms)
}

export function subscribe(cb: Listener): () => void {
  listeners.add(cb)
  return (): void => { listeners.delete(cb) }
}

export function getSnapshot(): typeof state {
  return state
}
```

**DEV gate pattern** (D-04): register `window.__showGlobeLoader` only under `import.meta.env.DEV`:
```tsx
if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__showGlobeLoader = showGlobeLoader
}
```

---

### `frontend/src/design-system/hooks/useReducedMotion.ts` (NEW hook)

**Analog:** `frontend/src/design-system/hooks/useDesignDirection.ts` (minimal 12-line hook in same folder)

**Analog pattern** (lines 14–30):
```ts
import { useContext } from 'react'
import { DesignContext } from '@/design-system/DesignProvider'
import type { Direction } from '@/design-system/tokens/types'

export interface UseDesignDirectionResult {
  direction: Direction
  setDirection: (d: Direction) => void
}

export function useDesignDirection(): UseDesignDirectionResult {
  const ctx = useContext(DesignContext)
  if (!ctx) {
    throw new Error('useDesignDirection must be used within a <DesignProvider>')
  }
  return { direction: ctx.direction, setDirection: ctx.setDirection }
}
```

**Delta for useReducedMotion:** No context needed — use `useSyncExternalStore` + `matchMedia`. Pattern per RESEARCH.md §"Pattern 3" lines 297–319. Key structural conventions to mirror from the analog:
- JSDoc block at top explaining intent
- `import { useSyncExternalStore } from 'react'` (equivalent to the analog's `useContext`)
- Named export; explicit return type (`: boolean`)
- No default export

**Barrel append** (`frontend/src/design-system/hooks/index.ts`):
Surgical 1-line append matching existing style (line 8–14 precedent):
```ts
export { useReducedMotion } from './useReducedMotion'
```

---

### `frontend/src/components/signature-visuals/index.ts` (barrel)

**Analog:** `frontend/src/design-system/hooks/index.ts`

Pattern — verbatim shape:
```ts
/**
 * Barrel export for signature-visuals primitives (Phase 37).
 * Consumers import as `import { DossierGlyph } from '@/components/signature-visuals'`.
 */
export { GlobeLoader } from './GlobeLoader'
export { FullscreenLoader } from './FullscreenLoader'
export { GlobeSpinner } from './GlobeSpinner'
export { DossierGlyph } from './DossierGlyph'
export { Sparkline } from './Sparkline'
export { Donut } from './Donut'

export type { DossierGlyphProps } from './DossierGlyph'
export type { SparklineProps } from './Sparkline'
export type { DonutProps } from './Donut'
```

---

### Test files (8 unit + 1 E2E directory)

**Analog (unit tests):** `frontend/src/components/brand/GastatLogo.test.tsx` — verified: Vitest + @testing-library/react, `describe` + `it` + `expect`, SVG DOM inspection via `container.querySelector`.

**Imports pattern** (GastatLogo.test.tsx lines 9–12):
```tsx
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GastatLogo } from './GastatLogo'
```

**SVG assertion pattern** (lines 15–31):
```tsx
describe('GastatLogo', () => {
  it('renders an svg with the handoff viewBox', () => {
    const { container } = render(<GastatLogo />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg!.getAttribute('viewBox')).toBe('0 0 162.98 233.12')
  })

  it('renders at the provided size, defaulting to 22', () => {
    const { container, rerender } = render(<GastatLogo />)
    let svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('22')
    rerender(<GastatLogo size={128} />)
    svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('128')
  })
```

**Currentcolor/aria assertion pattern** (lines 33–43):
```tsx
  it('accent tint — declares fill="currentColor" on the outer svg', () => {
    const { container } = render(<GastatLogo />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('fill')).toBe('currentColor')
  })

  it('has aria-hidden so the parent wrapper owns the a11y label', () => {
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
  })
```

**Apply to:**
- `GlobeSpinner.test.tsx` — verbatim copy; change viewBox to `"0 0 40 40"`; assert `role="status"` + `aria-label`.
- `DossierGlyph.flags.test.tsx` — loop over 24 ISO codes, render `<DossierGlyph type="country" iso={iso} />`, assert `<g clipPath>` presence + 1px hairline circle.
- `DossierGlyph.symbols.test.tsx` — render 4 non-country types, assert Unicode symbol text content + `color-mix` inline style (use `getComputedStyle` or read `style.background`).
- `Sparkline.test.tsx` — render `data={[1,2,3,4,5]}`, assert polyline `points` attribute math; mock `useLocale` to return `'ar'` and assert `transform: scaleX(-1)` presence.
- `Donut.test.tsx` — assert each circle's `strokeDasharray` matches `${(variant/100) * circumference} ${circumference}` pattern; assert center text is `${Math.round(value)}%`.

**matchMedia mock pattern (for `reduced-motion.test.tsx`):** Copy from `frontend/src/components/layout/AppShell.test.tsx` lines 104–115:
```ts
window.matchMedia =
  window.matchMedia ??
  (vi.fn().mockImplementation((query: string) => ({
    matches: /max-width:\s*1024/.test(query),  // replace with /prefers-reduced-motion/.test(query)
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })) as typeof window.matchMedia)
```

**Module-mock pattern** (for `dev-gate.test.ts` — stub `import.meta.env.DEV`):
Copy from AppShell.test.tsx lines 51–56 (hoist order: vi.mock BEFORE `import { AppShell }`).

---

### E2E spec pattern (`frontend/e2e/signature-visuals/*.spec.ts`)

**Analog directory:** `frontend/tests/e2e/*.spec.ts` (existing Playwright specs, e.g. `after-action-publish.spec.ts`). **Note:** Phase 37 Wave 0 gap lists these at `frontend/e2e/signature-visuals/` — different parent directory. Planner should confirm which root Playwright config uses (likely `frontend/tests/e2e/` based on existing structure; `frontend/e2e/` may be new).

**Apply to:**
- `fullscreen-loader.spec.ts` — call `window.__showGlobeLoader(1600)` via `page.evaluate()`, assert `[data-testid="fullscreen-loader"]` visible for 1600ms then gone.
- `backdrop.spec.ts` — assert computed style of backdrop element contains `color-mix` + `backdrop-filter` substrings (via `page.evaluate(() => getComputedStyle(el).backdropFilter)`).
- `a11y.spec.ts` — use `@axe-core/playwright` + `AxeBuilder`; assert no WCAG 2.1 AA violations on open loader.
- `rtl-sparkline.spec.ts` — set `html[dir=rtl]`, navigate, screenshot Sparkline, assert `transform: matrix(-1, 0, 0, 1, 0, 0)` or similar.

---

### `frontend/src/components/layout/AppShell.tsx` (MODIFIED — surgical wrap)

**Target block** (current lines 203–212):
```tsx
<main
  className={cn(
    'appshell-main',
    'lg:col-start-2 lg:row-start-3',
    'overflow-y-auto',
    'bg-[var(--bg)]',
  )}
>
  {children}
</main>
```

**Delta** — wrap children in `<Suspense>` with FullscreenLoader fallback (D-03):
```tsx
import { Suspense } from 'react'
import { FullscreenLoader } from '@/components/signature-visuals'

// inside <main>:
<Suspense fallback={<FullscreenLoader open />}>
  {children}
</Suspense>
```

**Critical constraints** (per AppShell.tsx lines 44–73 provider comment block):
- Do NOT elevate above `<AppShell>` — Phase 36 provider stack contract: `<DesignProvider><LanguageProvider><TweaksDisclosureProvider><AppShell>`. Suspense MUST sit INSIDE AppShell to have access to DesignProvider CSS vars.
- Do NOT touch the Drawer, Sidebar, Topbar, or ClassificationBar sections — surgical edit only in `<main>`.
- Do NOT add a second `<FullscreenLoader>` at App.tsx root — one Suspense fallback, mounted here, per D-03.

---

## Shared Patterns

### SVG + currentColor (exact)
**Source:** `frontend/src/components/brand/GastatLogo.tsx` lines 23–32
**Apply to:** GlobeSpinner, DossierGlyph wrappers, all 24 flag files, Sparkline, Donut
```tsx
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="..."
  width={size}
  height={size}
  fill="currentColor"
  aria-hidden="true"
  className={className}
>
```
**Key rule:** `fill="currentColor"` cascades to child paths via SVG inheritance — do NOT re-set `fill` on individual `<path>` children unless overriding (flags override with explicit palette colors).

### Props + explicit return type
**Source:** `frontend/src/components/brand/GastatLogo.tsx` line 22
**Apply to:** ALL primitive components per CLAUDE.md `@typescript-eslint/explicit-function-return-type`
```tsx
export function X({ prop }: XProps): ReactElement {
```

### Barrel re-export
**Source:** `frontend/src/design-system/hooks/index.ts`
**Apply to:** `signature-visuals/index.ts`, `signature-visuals/flags/index.ts`
```ts
export { Thing } from './thing'
export type { ThingProps } from './thing'
```

### Test structure
**Source:** `frontend/src/components/brand/GastatLogo.test.tsx` lines 9–14
**Apply to:** ALL unit tests
```tsx
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { X } from './X'

describe('X', () => {
  it('...', () => { /* container.querySelector + expect */ })
})
```

### matchMedia + module mock (for reduced-motion tests)
**Source:** `frontend/src/components/layout/AppShell.test.tsx` lines 51–56, 104–115
**Apply to:** `reduced-motion.test.tsx`, `dev-gate.test.ts`

### RTL detection
**Source:** `frontend/src/design-system/hooks/useLocale.ts` (exports `Locale = 'en' | 'ar'`)
**Apply to:** Sparkline (needs ar locale to flip); Donut is locale-agnostic
```tsx
import { useLocale } from '@/design-system/hooks'
const { locale } = useLocale()
const isRTL = locale === 'ar'
```
**CAUTION:** Do NOT use `useDesignDirection` for this — its `direction` enum carries classification values (`chancery`, `situation`, etc.), not `'ltr' | 'rtl'`. `useLocale` is the canonical locale source (Phase 34 `id.locale` store).

### DEV env gate
**Source:** Vite `import.meta.env.DEV` pattern (no direct analog in codebase, but standard Vite idiom)
**Apply to:** `globeLoaderSignal.ts` for `window.__showGlobeLoader` registration

### JSDoc block at file top
**Source:** Every analog file — `GastatLogo.tsx` lines 1–13, `useDesignDirection.ts` lines 1–12, `AppShell.tsx` lines 1–73
**Apply to:** ALL new files. Pattern: 5–20 line JSDoc explaining intent, handoff source citation, key pitfall mitigations.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `frontend/src/components/signature-visuals/ensureWorld.ts` | utility (lazy dynamic import + memoization) | request-response | No other file in codebase does `Promise.all([import(...), import(...), import(...)])` with memoization. **Use RESEARCH.md §"Pattern 1" lines 223–256 as direct template.** |
| `frontend/src/components/signature-visuals/globe-loader.css` | asset (co-located CSS file) | N/A | Codebase is Tailwind-only; no co-located CSS files exist. **ACCEPT as NEW-PATTERN per D-13** — rAF-driven d3 projection cannot be Tailwind; `@keyframes` block needs a `.css` file imported from GlobeLoader.tsx. |
| `frontend/.size-limit.json` | config | N/A | File does not exist in the repo. **NEW-PATTERN.** Planner should consult `size-limit` npm docs for config shape at plan time. |
| `frontend/src/components/signature-visuals/globeLoaderSignal.ts` | utility (module-scoped signal + useSyncExternalStore) | pub-sub | No module-scoped external stores in `frontend/src/`. Pattern is canonical React 19 idiom — use RESEARCH.md §"Pattern 3" shape. |

---

## Metadata

**Analog search scope:**
- `frontend/src/components/**/*.tsx` (SVG components, spinners, overlays)
- `frontend/src/design-system/hooks/*.ts` (all 8 existing hooks)
- `frontend/src/components/layout/*.tsx` (AppShell + tests)
- `frontend/src/components/brand/*.tsx` (GastatLogo — primary SVG analog)
- `frontend/tests/e2e/*.spec.ts` (Playwright analog directory)
- `frontend/src/types/dossier-context.types.ts` (DossierType union source)

**Files scanned:** ~40 files (6 read in full, others via Glob/Grep metadata only)

**Pattern extraction date:** 2026-04-24

**Key insights for planner:**
1. **GastatLogo is the primary analog** — it establishes the inline-SVG-with-currentColor-and-aria-hidden shape that GlobeSpinner and all 24 flags should mirror exactly.
2. **Design-system hooks follow a minimal pattern** — `useDesignDirection.ts` is 30 lines total. The NEW `useReducedMotion.ts` should be similarly small; substitute `useSyncExternalStore` for the analog's `useContext`.
3. **AppShell.tsx is a surgical edit target** — wrap `{children}` on line 211 inside a `<Suspense fallback={<FullscreenLoader open />}>`. Do not touch anything else.
4. **Test files have a verbatim-copy template** — GastatLogo.test.tsx's 7 `it()` blocks are the template for all unit specs. matchMedia mock in AppShell.test.tsx is the template for reduced-motion tests.
5. **Critical stale-hook warning** — AppShell.tsx comment block (lines 54–61) warns that `useDirection` vs `useDesignDirection` vs `useLocale` are three DIFFERENT hooks. For Sparkline RTL, use `useLocale` (`'en' | 'ar'` enum), NOT `useDesignDirection` (classification enum).
6. **Three NEW-PATTERN files** have no codebase analog — `ensureWorld.ts` (lazy import memoization), `globe-loader.css` (co-located CSS), `.size-limit.json` (bundle-budget config). Planner should rely on RESEARCH.md code snippets and external docs for these.
7. **Flag barrel tradeoff** — `flags/index.ts` must export both named leaves (for selective imports) AND a keyed map (for DossierGlyph dynamic lookup). Full-bundle cost is ~5KB — acceptable.
8. **Playwright e2e directory location is uncertain** — RESEARCH.md Wave 0 Gaps list `frontend/e2e/signature-visuals/` but existing specs live at `frontend/tests/e2e/`. Planner should confirm `playwright.config.ts` `testDir` setting at plan time.
