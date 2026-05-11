---
phase: 33-token-engine
plan: 02
type: execute
wave: 2
depends_on: ['33-01']
files_modified:
  - frontend/src/design-system/DesignProvider.tsx
  - frontend/src/design-system/hooks/useDesignDirection.ts
  - frontend/src/design-system/hooks/useMode.ts
  - frontend/src/design-system/hooks/useHue.ts
  - frontend/src/design-system/hooks/useDensity.ts
  - frontend/src/design-system/hooks/useDesignTokens.ts
  - frontend/src/App.tsx
  - frontend/tests/unit/design-system/DesignProvider.test.tsx
autonomous: true
requirements: [TOKEN-01, TOKEN-03]
must_haves:
  truths:
    - 'DesignProvider wraps the app in App.tsx, replacing ThemeProvider'
    - 'setDirection / setMode / setHue / setDensity each trigger applyTokens synchronously and persist to localStorage under keys id.dir / id.theme / id.hue / id.density'
    - 'useDesignDirection / useMode / useHue / useDensity / useDesignTokens hooks return the live values'
    - 'Mode toggle adds/removes .dark class on documentElement so HeroUI v3 auto-switches'
  artifacts:
    - path: 'frontend/src/design-system/DesignProvider.tsx'
      provides: 'React context + state + localStorage + DOM writer'
    - path: 'frontend/src/design-system/hooks/useDesignDirection.ts'
      provides: 'direction getter/setter hook'
  key_links:
    - from: 'DesignProvider.tsx'
      to: 'applyTokens from 33-01'
      via: 'useEffect on [direction, mode, hue, density]'
      pattern: "applyTokens\\(buildTokens"
    - from: 'App.tsx'
      to: 'DesignProvider'
      via: 'top-level provider wrap'
      pattern: '<DesignProvider'
---

# Plan 33-02: DesignProvider + Hooks

**Phase:** 33 (token-engine)
**Wave:** 2
**Depends on:** 33-01 (token module)
**Type:** implementation
**TDD:** false
**Estimated effort:** M (4 h)

## Goal

Wire the pure token module from Plan 33-01 into a React context (`DesignProvider`) that: reads initial state from `localStorage`, applies tokens on every state change, persists changes, syncs across tabs, and exposes five hooks. Mount `<DesignProvider>` in `frontend/src/App.tsx` replacing the current `<ThemeProvider>`.

This plan delivers the runtime wiring for SC-1, SC-2, SC-3, SC-4.

## Name-collision decision (locked here)

- **Rename existing** `frontend/src/hooks/useDirection.ts` (reads `document.dir`) → `frontend/src/hooks/useDomDirection.ts`. That file's callers are updated in Plan 33-07's legacy sweep.
- **New hook** (reads `DesignProvider` direction) lives at `frontend/src/design-system/hooks/useDesignDirection.ts` — exported name `useDesignDirection`.
- Also update `frontend/src/components/ui/heroui-modal.tsx:16` import from `@/hooks/useDirection` → `@/hooks/useDomDirection` (it reads `document.dir` for modal positioning, per PATTERNS.md).

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/33-token-engine/33-CONTEXT.md
@.planning/phases/33-token-engine/33-PATTERNS.md
@frontend/src/components/theme-provider/theme-provider.tsx
@frontend/src/App.tsx
@frontend/src/hooks/useDirection.ts

<interfaces>
<!-- Types from 33-01 consumed by this plan -->
```typescript
import type { Direction, Mode, Hue, Density, TokenSet } from '@/design-system/tokens/types'
import { buildTokens } from '@/design-system/tokens/buildTokens'
import { applyTokens } from '@/design-system/tokens/applyTokens'
```

<!-- New context shape this plan creates -->

```typescript
export interface DesignContextValue {
  direction: Direction
  mode: Mode
  hue: Hue
  density: Density
  tokens: TokenSet
  setDirection: (d: Direction) => void
  setMode: (m: Mode) => void
  setHue: (h: Hue) => void
  setDensity: (d: Density) => void
}

export interface DesignProviderProps {
  children: React.ReactNode
  initialDirection?: Direction // default: 'chancery'
  initialMode?: Mode // default: 'light'
  initialHue?: Hue // default: 22
  initialDensity?: Density // default: 'comfortable'
}
```

</interfaces>
</context>

## Files to create / modify

| Path                                                        | Action                            | Notes                                                                                                                                                                                |
| ----------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/src/design-system/DesignProvider.tsx`             | create                            | ~150 lines; copy skeleton from `theme-provider.tsx` (lazy useState, useEffect DOM writer, useCallback setters, storage event, CustomEvent dispatch, `data-testid="design-provider"`) |
| `frontend/src/design-system/hooks/useDesignDirection.ts`    | create                            | Context selector with throw-on-missing                                                                                                                                               |
| `frontend/src/design-system/hooks/useMode.ts`               | create                            | Same pattern                                                                                                                                                                         |
| `frontend/src/design-system/hooks/useHue.ts`                | create                            | Same pattern                                                                                                                                                                         |
| `frontend/src/design-system/hooks/useDensity.ts`            | create                            | Same pattern                                                                                                                                                                         |
| `frontend/src/design-system/hooks/useDesignTokens.ts`       | create                            | Read-only `TokenSet` getter                                                                                                                                                          |
| `frontend/src/hooks/useDirection.ts`                        | **rename** → `useDomDirection.ts` | Identical content; file rename only                                                                                                                                                  |
| `frontend/src/components/ui/heroui-modal.tsx`               | modify                            | Line 16 import path update from `@/hooks/useDirection` → `@/hooks/useDomDirection`                                                                                                   |
| `frontend/src/App.tsx`                                      | modify                            | Lines 15, 33, 37, 49: swap ThemeProvider → DesignProvider with new props                                                                                                             |
| `frontend/tests/unit/design-system/DesignProvider.test.tsx` | create                            | renderHook + Testing Library; see Test Plan below                                                                                                                                    |

## Implementation steps

1. **Create `DesignProvider.tsx`** modeled on `theme-provider.tsx`:
   - `DesignContext = createContext<DesignContextValue | undefined>(undefined)`
   - Lazy `useState` initializer reads `localStorage.getItem('id.dir' | 'id.theme' | 'id.hue' | 'id.density')` with safe try/catch and type-guard fallback to `initialDirection/initialMode/initialHue/initialDensity`
   - One `useMemo` computing `tokens = buildTokens({direction, mode, hue, density})`
   - One `useEffect([tokens])` calling `applyTokens(tokens)`, storing the disposer, cleaning up on unmount
   - One `useEffect([mode])` toggling `document.documentElement.classList.toggle('dark', mode === 'dark')` (drives HeroUI v3 auto-switch per RESEARCH Q1)
   - One `useEffect([direction])` setting `document.documentElement.setAttribute('data-direction', direction)` (enables future `[data-direction=...]` CSS if needed)
   - One `useEffect([density])` setting `document.documentElement.setAttribute('data-density', density)`
   - `useCallback` setters that: update state → write localStorage → dispatch `new CustomEvent('designChange', { detail: {…} })`
   - `storage` event listener syncs across tabs (copy from theme-provider.tsx:202-226)
   - Wrap children in `<div data-testid="design-provider">{children}</div>` (matches existing convention)
2. **Create 5 hook files**. Each follows the pattern:
   ```ts
   import { useContext } from 'react'
   import { DesignContext } from '@/design-system/DesignProvider'
   import type { Direction } from '@/design-system/tokens/types'
   export function useDesignDirection(): {
     direction: Direction
     setDirection: (d: Direction) => void
   } {
     const ctx = useContext(DesignContext)
     if (!ctx) throw new Error('useDesignDirection must be used within DesignProvider')
     return { direction: ctx.direction, setDirection: ctx.setDirection }
   }
   ```
   `useDesignTokens` returns `ctx.tokens` (read-only — no setter).
3. **Rename collision file**: `git mv frontend/src/hooks/useDirection.ts frontend/src/hooks/useDomDirection.ts`. Rename the exported symbol inside from `useDirection` → `useDomDirection`. (Call-site updates live in Plan 33-07.)
4. **Patch `heroui-modal.tsx`** (per PATTERNS.md §Section 2): line 16 `import { useDirection } from '@/hooks/useDirection'` → `import { useDomDirection } from '@/hooks/useDomDirection'`; usage site line `const direction = useDirection()` → `const direction = useDomDirection()`.
5. **Update `App.tsx`** (PATTERNS.md §Section 2 specifies lines 15, 33, 37, 49):
   - Line 15: `import { DesignProvider } from './design-system/DesignProvider'`
   - Line 33: `<ThemeErrorBoundary fallbackTheme="canvas">` — leave as-is for now; Plan 33-07 updates `ThemeErrorBoundary`
   - Line 37: `<DesignProvider initialDirection="chancery" initialMode="light" initialHue={22} initialDensity="comfortable">`
   - Line 49: closing tag `</DesignProvider>`
   - Keep the `ThemeProvider` import line removed; if any other import still references `theme-provider`, leave it for Plan 33-07's shim to handle.
6. **Create `DesignProvider.test.tsx`** using `@testing-library/react` + `vitest`:
   - **Render test**: mount provider; assert `document.documentElement.style.getPropertyValue('--bg')` is non-empty
   - **Setter test**: `renderHook(() => useDesignDirection(), { wrapper })`; call `setDirection('situation')`; assert `document.documentElement.getAttribute('data-direction') === 'situation'` AND `localStorage.getItem('id.dir') === 'situation'`
   - **Mode toggle test**: `setMode('dark')` → `document.documentElement.classList.contains('dark') === true`
   - **Hue recompute test**: capture `--sla-risk` at hue=100, call `setHue(200)`, assert `--sla-risk` now contains `255` (200+55)
   - **Density test**: `setDensity('dense')` → `document.documentElement.style.getPropertyValue('--row-h') === '32px'`
   - **Cross-tab test**: dispatch a `StorageEvent` with `key='id.dir', newValue='bureau'` → hook return value updates

## Definition of done

- [ ] `DesignProvider` mounts without throwing; `App.tsx` renders with it
- [ ] All 5 hooks return correct values and each throws outside provider
- [ ] `pnpm --filter frontend test design-system/DesignProvider` passes all assertions above
- [ ] `pnpm --filter frontend typecheck` clean
- [ ] `pnpm --filter frontend lint` clean
- [ ] `pnpm --filter frontend dev` — manual: toggle devtools → call `document.dispatchEvent(new CustomEvent('designChange'))` → no errors; open app, direction/mode/hue/density defaults applied; reload page, state persists
- [ ] `grep -rn "from '@/hooks/useDirection'" frontend/src` returns only test files or is empty (main code migrated); the one legit DOM-direction consumer (`heroui-modal.tsx`) imports `useDomDirection`
- [ ] RTL check: run `pnpm --filter frontend dev`, switch i18n to Arabic, confirm density row-h still applies as expected (logical `--pad-inline` survives RTL flip)

## Requirements satisfied

- TOKEN-01 (full — with 33-01)
- TOKEN-03 (full — direction × mode × hue × density wiring)

## Success Criteria contribution

- SC-1: Calling `setDirection(...)` on any of 4 values updates every var on `:root` with no reload (proven by DesignProvider.test)
- SC-2: `setMode('dark')` flips accent-ink lightness (72 ↔ 42), accent-soft chroma (0.08 ↔ 0.05), and re-runs danger/ok/warn/info dark-variant math — driven by 33-01's `buildTokens` re-call
- SC-3: `setHue(h)` recomputes accent family + SLA risk (hue+55°); SLA-bad stays hue-locked red
- SC-4: `setDensity(...)` updates `--row-h`, `--pad-inline`, `--pad-block`, `--gap` live; RTL logical properties preserved

## Risks / unknowns

- **ThemeErrorBoundary still references `fallbackTheme="canvas"`.** Left intact in this plan; Plan 33-07 rewrites it to `fallbackDirection="chancery"`. Acceptable interim: ThemeErrorBoundary's fallback is cosmetic (only fires on provider crash) — no runtime impact.
- **Legacy `useTheme` shim** still needed by Header, AppSidebar, SiteHeader, etc. Plan 33-07 installs the shim; Plan 33-02 does NOT delete `theme-provider.tsx` yet — leave it untouched to avoid breaking unrelated imports mid-wave.
- **Concurrent mode re-renders**: `useMemo` + `useEffect` for `applyTokens` is correct under React 18 StrictMode double-invocation; disposer cleanup prevents stale vars. Verified in test.

## Verification

```bash
pnpm --filter frontend test design-system/DesignProvider
pnpm --filter frontend typecheck
pnpm --filter frontend lint
pnpm --filter frontend dev
# Manual in DevTools console:
#   window.dispatchEvent(new StorageEvent('storage', {key:'id.dir', newValue:'situation'}))
# Assert: page re-themes to Situation Room without reload
```
