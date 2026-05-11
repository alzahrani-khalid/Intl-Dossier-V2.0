---
phase: 33-token-engine
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/design-system/tokens/types.ts
  - frontend/src/design-system/tokens/directions.ts
  - frontend/src/design-system/tokens/densities.ts
  - frontend/src/design-system/tokens/buildTokens.ts
  - frontend/src/design-system/tokens/applyTokens.ts
  - frontend/tests/unit/design-system/buildTokens.test.ts
  - frontend/tests/unit/design-system/applyTokens.test.ts
autonomous: true
requirements: [TOKEN-01, TOKEN-03]
must_haves:
  truths:
    - 'buildTokens({direction, mode, hue, density}) returns a flat Record<string,string> of CSS var names → OKLCH values'
    - 'applyTokens(set) writes every entry to document.documentElement via setProperty and returns a cleanup'
    - 'Unit tests pass for 4 directions × 2 modes × 3 hues × 3 densities = 72 cases'
  artifacts:
    - path: 'frontend/src/design-system/tokens/buildTokens.ts'
      provides: 'pure token builder'
    - path: 'frontend/src/design-system/tokens/applyTokens.ts'
      provides: 'DOM writer with disposer'
    - path: 'frontend/src/design-system/tokens/types.ts'
      provides: 'Direction/Mode/Hue/Density/TokenSet types'
  key_links:
    - from: 'buildTokens.ts'
      to: 'directions.ts + densities.ts'
      via: 'pure data import'
      pattern: "import.*from './directions'"
---

# Plan 33-01: Token Module Core (OKLCH Engine)

**Phase:** 33 (token-engine)
**Wave:** 1
**Depends on:** none
**Type:** implementation
**TDD:** false (pure-function module; tests written alongside, not test-first)
**Estimated effort:** M (4–5 h)

## Goal

Deliver a pure TypeScript module at `frontend/src/design-system/tokens/` that deterministically maps `{direction, mode, hue, density}` → a flat `Record<string, string>` of CSS variable name→OKLCH value pairs, plus a DOM writer with cleanup. Zero side effects at import time. No React. No dependency on any other Phase 33 plan.

This module is the single source of truth for Success Criteria SC-1, SC-2, SC-3, SC-4 numerical behavior.

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/33-token-engine/33-CONTEXT.md
@.planning/phases/33-token-engine/33-RESEARCH.md
@.planning/phases/33-token-engine/33-PATTERNS.md
@CLAUDE.md
@frontend/src/lib/utils.ts
@frontend/src/types/breakpoint.ts
@frontend/tests/unit/preference-merge.test.ts

# Canonical handoff source (port 1:1)

# /tmp/inteldossier-handoff/inteldossier/project/src/themes.jsx (234 lines)

<interfaces>
<!-- Types defined in this plan; consumed by 33-02 (DesignProvider) and 33-03 (bootstrap) -->

```typescript
// types.ts
export type Direction = 'chancery' | 'situation' | 'ministerial' | 'bureau'
export type Mode = 'light' | 'dark'
export type Hue = number // 0..360 inclusive; caller is responsible for clamping
export type Density = 'comfortable' | 'compact' | 'dense'
export type TokenSet = Record<string, string>

export interface BuildInput {
  direction: Direction
  mode: Mode
  hue: Hue
  density: Density
}

export interface DirectionPalette {
  light: {
    bg: string
    surface: string
    surfaceRaised: string
    ink: string
    inkMute: string
    inkFaint: string
    line: string
    lineSoft: string
    sidebar: string
    sidebarInk: string
    radius: { sm: string; base: string; lg: string }
  }
  dark: {
    bg: string
    surface: string
    surfaceRaised: string
    ink: string
    inkMute: string
    inkFaint: string
    line: string
    lineSoft: string
    sidebar: string
    sidebarInk: string
    radius: { sm: string; base: string; lg: string }
  }
}

export interface DensityValues {
  rowH: string
  padInline: string
  padBlock: string
  gap: string
}
```

</interfaces>
</context>

## Files to create / modify

| Path                                                    | Action | Notes                                                                                                                                               |
| ------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/design-system/tokens/types.ts`            | create | Type unions + `BuildInput` + `DirectionPalette` + `DensityValues` + `TokenSet`                                                                      |
| `frontend/src/design-system/tokens/directions.ts`       | create | `PALETTES: Record<Direction, DirectionPalette>` — port verbatim from `/tmp/inteldossier-handoff/.../themes.jsx` `DIRECTIONS` constant               |
| `frontend/src/design-system/tokens/densities.ts`        | create | `DENSITIES: Record<Density, DensityValues>` with comfortable=52/20/16, compact=40/14/12, dense=32/10/8 (rowH/padInline/padBlock; gap=padBlock-4px)  |
| `frontend/src/design-system/tokens/buildTokens.ts`      | create | `export function buildTokens(input: BuildInput): TokenSet` — port OKLCH math from handoff `buildTokens()` 1:1; preserve `% 360` modulo on hue shift |
| `frontend/src/design-system/tokens/applyTokens.ts`      | create | `export function applyTokens(tokens: TokenSet): () => void` — SSR-safe guard, setProperty loop, disposer removes keys it wrote                      |
| `frontend/tests/unit/design-system/buildTokens.test.ts` | create | Vitest unit tests — 72 cases + explicit SLA-shift + accent-ink flip assertions                                                                      |
| `frontend/tests/unit/design-system/applyTokens.test.ts` | create | jsdom test: call applyTokens → read back via `getPropertyValue`; dispose → values cleared                                                           |

**D-06 update applied:** NO `frontend/heroui.config.ts` is created. HeroUI v3 config is CSS-native (handled in Plan 33-04).

**Barrel omitted:** NO `frontend/src/design-system/tokens/index.ts` — project convention is leaf imports.

## Implementation steps

1. **Create `types.ts`** exactly matching the interface block above. Explicit string unions, no enums, `TokenSet = Record<string, string>`.
2. **Create `directions.ts`** — open `/tmp/inteldossier-handoff/inteldossier/project/src/themes.jsx`, read the `DIRECTIONS` / palette constants, and port each direction's light+dark palette objects verbatim as TypeScript. Preserve:
   - Per-direction radius scales (situation 2/3/4px, chancery 2/2/2px, bureau 8/12/16px, ministerial 6/10/14px)
   - `sidebarInk` (may differ from `ink`)
   - Dark-variant lightness values for ink / line / surface
   - Keep handoff comments inline as JSDoc where informative
3. **Create `densities.ts`** with the three density records. Values from D-04: comfortable `{rowH:'52px', padInline:'20px', padBlock:'16px', gap:'12px'}`, compact `{rowH:'40px', padInline:'14px', padBlock:'12px', gap:'8px'}`, dense `{rowH:'32px', padInline:'10px', padBlock:'8px', gap:'4px'}`.
4. **Create `buildTokens.ts`** — pure function. Structure:
   ```ts
   export function buildTokens({ direction, mode, hue, density }: BuildInput): TokenSet {
     const palette = PALETTES[direction][mode]
     const d = DENSITIES[density]
     const isDark = mode === 'dark'
     // OKLCH math — port handoff line-for-line
     const accent = `oklch(58% 0.14 ${hue})`
     const accentInk = `oklch(${isDark ? 72 : 42}% 0.13 ${hue})`
     const accentSoft = `oklch(${isDark ? 32 : 92}% ${isDark ? 0.08 : 0.05} ${hue})`
     const accentFg = `oklch(99% 0.01 ${hue})`
     const slaRisk = `oklch(${isDark ? 74 : 60}% 0.13 ${(hue + 55) % 360})`
     // …danger/ok/warn/info with isDark lightness branches
     return { '--bg': palette.bg, '--surface': palette.surface /* 35+ entries */ }
   }
   ```
   **Must preserve**: OKLCH format strings exactly as handoff; `% 360` modulo on hue shifts; lightness branch per mode for danger/ok/warn/info; derived tokens `--field-radius: calc(var(--radius) * 1.5)`, `--focus-ring: 0 0 0 3px color-mix(in oklch, var(--accent) 40%, transparent)`, `--shadow-drawer: -24px 0 60px rgba(0,0,0,.25)`, `--shadow-card: 0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)`.
   **Must include**: full D-13 token set — surfaces/ink/lines/accent family/semantic/SLA/density (`--row-h`, `--pad-inline`, `--pad-block`, `--gap`)/radius/focus-ring/shadows/sidebar.
   **Explicit return type** on the function (ESLint `explicit-function-return-type`).
   **Handoff soft-variants** (`--danger-soft`, `--ok-soft`, `--warn-soft`, `--info-soft`, `--sla-ok-soft`, `--sla-risk-soft`, `--sla-bad-soft`) included per RESEARCH Gotcha #4 — dashboards will want them.
5. **Create `applyTokens.ts`** — imperative DOM writer:
   ```ts
   export function applyTokens(tokens: TokenSet): () => void {
     if (typeof document === 'undefined') return () => {}
     const root = document.documentElement
     const written: string[] = []
     for (const [name, value] of Object.entries(tokens)) {
       root.style.setProperty(name, value)
       written.push(name)
     }
     return () => {
       for (const name of written) root.style.removeProperty(name)
     }
   }
   ```
   No RAF batching (RESEARCH Q5 confirms unnecessary at 35 vars).
6. **Create `buildTokens.test.ts`** with (at minimum):
   - Snapshot-style assertion for `{chancery,light,22,comfortable}` covering all ~35 var names
   - 4 dirs × 2 modes × 3 hues (22/100/250) × 3 densities — 72 iterations, each asserts: `--bg` starts with `oklch(` (or handoff palette literal, whichever is canonical), `--row-h` matches density table, `--accent` contains the hue value
   - **SC-2 explicit test**: `--accent-ink` lightness = 72% in dark, 42% in light (same dir, same hue); `--accent-soft` chroma flips 0.08 ↔ 0.05
   - **SC-3 explicit test**: `--sla-risk` hue equals `(inputHue + 55) % 360`; `--sla-bad` hue is fixed (e.g. `25`) regardless of input
   - **SC-4 explicit test**: `--row-h` = 52/40/32 per density; `--pad-inline` = 20/14/10
7. **Create `applyTokens.test.ts`** (jsdom):
   - Call `applyTokens({ '--bg': 'oklch(99% 0 0)', '--accent': 'oklch(58% 0.14 22)' })` → `document.documentElement.style.getPropertyValue('--bg')` returns `'oklch(99% 0 0)'`
   - Dispose → `getPropertyValue('--bg')` returns `''`
   - SSR guard: mock `typeof document === 'undefined'` → no throw, returns no-op

## Definition of done

- [ ] All 5 module files exist with explicit return types and zero `any`
- [ ] `pnpm --filter frontend test design-system/tokens` passes all cases
- [ ] `pnpm --filter frontend typecheck` clean
- [ ] `pnpm --filter frontend lint` clean
- [ ] Zero imports of `react`, `document`, or any DOM API in `buildTokens.ts`, `directions.ts`, `densities.ts`, `types.ts` (verified by grep: `grep -r "react\|document\|window" frontend/src/design-system/tokens/buildTokens.ts` returns nothing; `applyTokens.ts` is the ONLY file allowed to touch `document`)
- [ ] No default exports; only named exports
- [ ] No `index.ts` barrel file in the tokens directory
- [ ] Direction palette values byte-equal to handoff (`diff`-check key values)
- [ ] SLA risk math: `(hue + 55) % 360` verified for `hue=350` case (`(350+55)%360 = 45`)

## Requirements satisfied

- TOKEN-01 (full — OKLCH engine)
- TOKEN-03 (partial — math layer; wiring comes in 33-02)

## Success Criteria contribution

- SC-1: provides `buildTokens` + `applyTokens` that 33-02 wires
- SC-2: light/dark OKLCH branches proven by unit tests
- SC-3: hue→accent + hue+55°→SLA proven by unit tests
- SC-4: density values proven by unit tests (RTL-safe logical-property tokens)

## Risks / unknowns

- **Handoff radius scale mismatch** (RESEARCH Gotcha #5): handoff has `--radius-sm`, `--radius`, `--radius-lg`; D-13 adds `--radius-md`. Resolution: omit `--radius-md` (not used by any downstream phase yet); document omission in plan header.
- **Soft semantic variants not in D-13 explicit list** (Gotcha #4): include them anyway per handoff 1:1 clause; flag in SUMMARY for Phase 43 audit.

## Verification

```bash
pnpm --filter frontend install
pnpm --filter frontend test design-system/tokens
pnpm --filter frontend typecheck
pnpm --filter frontend lint frontend/src/design-system/tokens/
# Manual spot-check:
# node -e "const {buildTokens} = require('./frontend/src/design-system/tokens/buildTokens.ts'); console.log(Object.keys(buildTokens({direction:'chancery',mode:'light',hue:22,density:'comfortable'})).length)"
# Expect: >= 35 token keys
```
