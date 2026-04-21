# Phase 35: typography-stack — Research

**Researched:** 2026-04-22
**Domain:** CSS font loading pipeline + token engine extension + RTL override cascade
**Confidence:** HIGH (package resolution verified against live npm registry + tarball file listings; existing code confirmed via grep)

## Summary

Phase 35 extends the Phase 33 token engine with three font-family keys (`--font-display / --font-body / --font-mono`), self-hosts 8 font families (7 Latin + Tajawal) via `@fontsource[-variable]/*`, ports the handoff's RTL Tajawal cascade verbatim into `frontend/src/index.css`, and pins `[dir="ltr"].mono` spans to JetBrains Mono for TYPO-04.

**All pre-flagged STATE.md blockers are UNBLOCKED.** Every D-03 package resolves on npm; every required sub-path (`wght.css` / per-weight `.css`) ships in the tarball. One surprise: `@fontsource-variable/fraunces@5.2.9` ships `wght.css` AND the full-axis variants (`opsz.css`, `standard.css`, `wonk.css`) — `wght.css` is the correct single-axis pick. Another surprise (not in CONTEXT.md): `frontend/index.html` currently contains SIX `<link>` tags pointing at `fonts.googleapis.com` (Readex Pro, Outfit, Kumbh Sans, Hedvig Letters Serif, Poppins, Plus Jakarta Sans). These MUST be removed or TYPO-02's "zero Google Fonts CDN calls" assertion fails.

**Primary recommendation:** Land Phase 35 as three commits inside the existing plan skeleton: (1) extend `buildTokens.ts` to return the three font keys using direction-driven literals, (2) create `frontend/src/fonts.ts` with the verified import sub-paths and wire it as the first import in `main.tsx`, and (3) rewrite `index.css` lines 150-333 plus strip all 6 Google Fonts links from `index.html`. Test via unit assertions on the token-map (3 keys × 4 directions = 12 cases) + one Playwright spec that asserts `getComputedStyle(...).fontFamily` for a fixture element in each direction × locale.

## Architectural Responsibility Map

| Capability                              | Primary Tier                              | Secondary Tier | Rationale                                                                                                                                              |
| --------------------------------------- | ----------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Font-face declaration (bytes → browser) | Browser / Client                          | —              | `@fontsource/*` injects `@font-face` rules at CSS parse time; no server involvement.                                                                   |
| Font routing (direction → family)       | Token engine (TS module, runs in browser) | CSS `@theme`   | `buildTokens()` returns direction-keyed family strings; `applyTokens()` writes them to `:root` as CSS vars; `@theme` binds them to Tailwind utilities. |
| RTL override cascade                    | CSS (`index.css`)                         | —              | Direction-agnostic cascade in pure CSS; token engine does NOT know about Arabic-specific overrides.                                                    |
| Mono-isolation for `[dir="ltr"].mono`   | CSS (`index.css`)                         | —              | A single selector rule in the handoff cascade; no JS logic.                                                                                            |
| Storybook preview typography            | —                                         | —              | `.storybook/` does NOT exist (Phase 33-08 deferred). No action required.                                                                               |

## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 — Extend Phase 33's `buildTokens(direction, mode, hue, density)` to emit `--font-display`, `--font-body`, `--font-mono`.** String-valued keys require no `applyTokens()` pipeline changes. Atomic application on the same effect tick as color tokens. 12 additional unit assertions (4 directions × 3 font keys; no mode/hue/density branching).

**D-02 — Rewrite legacy font-family vars in `frontend/src/index.css` inline.** Rename every `var(--text-family)` → `var(--font-body)` at lines 211, 216, 259, 286, 328. Rename every `var(--display-family)` → `var(--font-display)` at lines 238, 302, 319. Delete every `var(--text-family-rtl)` rule at lines 293, 312, 324, 333 (the D-07 Tajawal cascade replaces all RTL routing). Replace hardcoded mono stack at line 266 with `var(--font-mono)`. Delete the `:root` `--display-family` / `--text-family` / `--text-family-rtl` / `--text-weight` / `--display-weight` declarations at lines 150-155. Delete the `.font-display { font-family: var(--display-family) }` + `html[dir='rtl'] .font-display` block at lines 318-325 (the D-07 cascade handles RTL; the `@theme`-bound `font-display` utility will handle LTR).

**D-03 — Mix strategy: variable-axis where available, classic where not.**

- Variable (`@fontsource-variable/*`): `inter`, `public-sans`, `space-grotesk`, `fraunces`, `jetbrains-mono`. Import `wght.css` sub-path.
- Classic (`@fontsource/*`): `ibm-plex-sans`, `ibm-plex-mono`, `tajawal`. Import per-weight CSS files.

**D-04 — Full variable axis files, no subset syntax.** Import the full `wght.css` as-is (no `?weight=` querystring).

**D-05 — All-at-boot via `frontend/src/fonts.ts` side-effect module.** New file imports every fontsource package; `main.tsx` imports `./fonts` before rendering `<App/>`.

**D-06 — Tajawal loads unconditionally in `fonts.ts`.** Not gated on `id.locale`.

**D-07 — Inline the handoff's Tajawal cascade block verbatim in `frontend/src/index.css`.** Byte-for-byte preservation. Source: `/tmp/inteldossier-handoff/inteldossier/project/src/app.css` lines 129-176 (48 lines, not ~60 as CONTEXT.md estimated — see §Specific corrections). Place AFTER Phase 33 `@theme` block, BEFORE Phase 33-era utility layers.

### Claude's Discretion

- Font fallback chain (match handoff minimal).
- `font-display: swap` vs `fallback` vs `optional` (keep fontsource default `swap`).
- `<link rel="preload">` hints in `frontend/index.html` — see §Open Questions Q1.
- Grouping style inside `fonts.ts` — cosmetic.
- Tailwind v4 `@theme` font utility bindings — RESEARCH CONFIRMS Phase 33's `@theme` block does NOT already emit them; Phase 35 adds them.
- Test split between unit and E2E — see §Validation Architecture.

### Deferred Ideas (OUT OF SCOPE)

- Arabic font variants beyond Tajawal (IBM Plex Sans Arabic, Noto Naskh Arabic).
- Font optical-size axis usage (Fraunces `opsz`).
- Subset fonts to Arabic + Latin Extended only.
- Preload critical fonts via `<link rel="preload">` (under discretion; may defer).

## Phase Requirements

| ID      | Description                                                                                                               | Research Support                                                                                                                                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TYPO-01 | Per-direction display+body+mono triplets                                                                                  | §Standard Stack table maps each direction to verified packages + import sub-paths. Token keys emitted via D-01 extension to `buildTokens.ts`.                                                                               |
| TYPO-02 | Self-hosted via `@fontsource/*`, weights 400/500/600/700 (display+body) + 400/500 (mono), **zero Google Fonts CDN calls** | All 8 packages resolve to `^5.x` on npm (verified); tarballs ship the required weights (verified). **Blocker:** `frontend/index.html` currently has 6 Google Fonts `<link>` tags — Phase 35 MUST delete these.              |
| TYPO-03 | Arabic RTL display-font + chip/label/tag override verbatim per `project/src/app.css`                                      | Full 48-line Tajawal cascade extracted in §Code Examples — port byte-for-byte to `index.css` per D-07.                                                                                                                      |
| TYPO-04 | `[dir="ltr"].mono` inside RTL container keeps JetBrains Mono                                                              | Selector `html[dir="rtl"] [dir="ltr"].mono, kbd[dir="ltr"] { font-family: 'JetBrains Mono', ui-monospace, monospace; }` is included in D-07's verbatim block. See §Validation Architecture for fixture-based test strategy. |

## Project Constraints (from CLAUDE.md)

- **React 19 + TypeScript 5.9+ strict mode** (frontend). Explicit return types required on all functions. `@typescript-eslint/no-explicit-any: error`, `no-floating-promises: error`.
- **Tailwind v4 + HeroUI v3 locked.** Phase 35 must use Tailwind v4 `@theme` directive (NOT `tailwind.config.ts extend.fontFamily`).
- **Bilingual AR/EN invariant.** Every commit must not regress either direction.
- **RTL logical properties only** (`ms-* / me-* / ps-* / pe-*` — not relevant for this phase since only CSS font-family is touched).
- **Prettier:** `semi: false`, `trailingComma: all`, `singleQuote: true`, `printWidth: 100`.
- **No `textAlign: "right"` in React Native (global CLAUDE.md)** — not applicable; this is the web app, not the RN app.

## Standard Stack

### Core (8 verified npm packages, all resolved 2026-04-22)

| Package                               | Latest `^5.x` | Import Sub-path                                | Purpose                                    | Verified ships                                                                                                                                        |
| ------------------------------------- | ------------- | ---------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@fontsource-variable/inter`          | **5.2.8**     | `/wght.css`                                    | Body/display for Bureau; body for Chancery | `package/wght.css` ✓                                                                                                                                  |
| `@fontsource-variable/public-sans`    | **5.2.7**     | `/wght.css`                                    | Display+body for Ministerial               | `package/wght.css` ✓                                                                                                                                  |
| `@fontsource-variable/space-grotesk`  | **5.2.10**    | `/wght.css`                                    | Display for Situation                      | `package/wght.css` ✓                                                                                                                                  |
| `@fontsource-variable/fraunces`       | **5.2.9**     | `/wght.css`                                    | Display for Chancery                       | `package/wght.css` ✓ (also ships `opsz.css`, `standard.css`, `wonk.css`, `soft.css`, `full.css` — use `wght.css` for single-axis simplicity per D-04) |
| `@fontsource-variable/jetbrains-mono` | **5.2.8**     | `/wght.css`                                    | Mono for Chancery / Ministerial / Bureau   | `package/wght.css` ✓                                                                                                                                  |
| `@fontsource/ibm-plex-sans`           | **5.2.8**     | `/400.css`, `/500.css`, `/600.css`, `/700.css` | Body for Situation                         | `package/400.css..700.css` ✓ (also subset variants `latin-*.css`; use unqualified weights for full language coverage)                                 |
| `@fontsource/ibm-plex-mono`           | **5.2.7**     | `/400.css`, `/500.css`                         | Mono for Situation                         | `package/400.css`, `package/500.css` ✓                                                                                                                |
| `@fontsource/tajawal`                 | **5.2.7**     | `/400.css`, `/500.css`, `/700.css`             | Arabic (all RTL surfaces)                  | `package/400.css..700.css` ✓ (also ships `arabic-400.css` etc. — recommend full weights for mixed EN/AR content)                                      |

**Installation:**

```bash
cd frontend && pnpm add \
  @fontsource-variable/inter@^5.2.8 \
  @fontsource-variable/public-sans@^5.2.7 \
  @fontsource-variable/space-grotesk@^5.2.10 \
  @fontsource-variable/fraunces@^5.2.9 \
  @fontsource-variable/jetbrains-mono@^5.2.8 \
  @fontsource/ibm-plex-sans@^5.2.8 \
  @fontsource/ibm-plex-mono@^5.2.7 \
  @fontsource/tajawal@^5.2.7
```

All versions verified live against `registry.npmjs.org` on 2026-04-22.

### Alternatives Considered

| Instead of                             | Could Use                 | Tradeoff / Decision                                                                                                                                         |
| -------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wght.css` (Fraunces)                  | `opsz.css` (optical size) | Opsz would give crisper display-size glyphs — deferred per CONTEXT.md §Deferred Ideas.                                                                      |
| Full-weight `@fontsource/tajawal`      | `arabic-400.css` subset   | Subset is ~40% smaller but breaks mixed-content flows (an English name inside Arabic text would fallback). Keep full weights. `[VERIFIED: tarball listing]` |
| `@fontsource/*` classic for Inter/etc. | `@fontsource-variable/*`  | Variable-axis is ~10KB larger per family but supports arbitrary weight values (future flexibility). D-04 locks variable where available.                    |

## Architecture Patterns

### System Architecture Diagram

```
         ┌─────────────────────────────────────────────┐
         │  Build time                                 │
         │  ┌────────────────────────────┐             │
         │  │ frontend/src/fonts.ts      │             │
         │  │ (8 side-effect imports)    │             │
         │  └─────────────┬──────────────┘             │
         └────────────────┼────────────────────────────┘
                          │ imported first in main.tsx
                          ▼
         ┌─────────────────────────────────────────────┐
         │  Runtime — Browser boot                     │
         │  ┌────────────────────────────┐             │
         │  │ Vite bundles @font-face    │  ──► @font-face rules in CSS
         │  │ declarations into HTML+CSS │      woff2 files preloaded
         │  └────────────────────────────┘             │
         └─────────────────────────────────────────────┘
                          │
                          ▼
         ┌─────────────────────────────────────────────┐
         │  FOUC bootstrap (Phase 33 `bootstrap.js`)   │
         │  reads localStorage id.dir/id.theme/...     │
         │  calls buildTokens() + applyTokens()        │
         └─────────────────┬───────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────────────┐
         │  :root style declaration                    │
         │  --font-display: 'Fraunces', serif;         │
         │  --font-body:    'Inter', system-ui, ...;   │
         │  --font-mono:    'JetBrains Mono', ...;     │
         │  (all other Phase 33 tokens also set)       │
         └─────────────────┬───────────────────────────┘
                           │
       ┌───────────────────┼────────────────────┐
       ▼                   ▼                    ▼
  Tailwind v4          CSS rules in         React/HeroUI
  utilities            index.css            components
  (font-display        (h1 { font-family:   (auto-inherit via
   via @theme)          var(--font-display)} cascade)
       │                   │                    │
       └───────────────────┴────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────────────┐
         │  RTL override cascade (D-07 verbatim)       │
         │  html[dir="rtl"] * { Tajawal }              │
         │  html[dir="rtl"] .chip { Tajawal !important}│
         │  html[dir="rtl"] [dir="ltr"].mono {         │
         │    JetBrains Mono                           │
         │  }                                          │
         └─────────────────────────────────────────────┘
```

### Recommended Project Structure (files touched by Phase 35)

```
frontend/
├── src/
│   ├── fonts.ts                              # NEW — 8 @fontsource side-effect imports
│   ├── main.tsx                              # MUTATED — add `import './fonts'` as first line
│   ├── index.css                             # MUTATED — rewrite 11 legacy vars + append Tajawal cascade + extend @theme
│   └── design-system/tokens/
│       ├── buildTokens.ts                    # MUTATED — emit 3 new keys
│       ├── directions.ts                     # MUTATED — add per-direction font triplet literals
│       └── types.ts                          # MUTATED — extend DirectionPalette type with `fonts`
├── index.html                                # MUTATED — strip 6 Google Fonts <link> blocks
├── package.json                              # MUTATED — +8 dependencies
└── tests/unit/design-system/
    └── buildTokens.test.ts                   # MUTATED — +12 font assertions (4 dirs × 3 keys)
```

### Pattern 1: Fontsource side-effect import (D-05)

**What:** Each package is imported for its side effect — the `@font-face` rule it injects.
**When to use:** Every Phase 35 font import.
**Example:**

```typescript
// frontend/src/fonts.ts
// Phase 35 — self-hosted font pipeline (TYPO-02). Side-effect imports.
// Order does not matter for correctness (all injected into cascade) but we
// group by role for reviewability.

// Variable-axis (wght only, per D-04)
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/public-sans/wght.css'
import '@fontsource-variable/space-grotesk/wght.css'
import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/jetbrains-mono/wght.css'

// Classic per-weight (4 weights for body, 2 for mono, 3 for Arabic)
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-sans/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/tajawal/400.css'
import '@fontsource/tajawal/500.css'
import '@fontsource/tajawal/700.css'
```

```typescript
// frontend/src/main.tsx — add this as the FIRST line (before `./index.css` even)
import './fonts'
import { StrictMode } from 'react'
// ...rest unchanged
```

`[VERIFIED: https://fontsource.org/docs/getting-started/install + tarball inspection]`

### Pattern 2: Direction-driven font triplet in token engine (D-01)

**What:** `buildTokens()` returns per-direction font-family strings as literal values (no OKLCH math needed — strings only).
**When to use:** Extending Phase 33's token engine.
**Example:**

```typescript
// frontend/src/design-system/tokens/directions.ts — extend DirectionPalette
// with a direction-level `fonts` triplet (NOT mode-level; fonts are invariant
// across light/dark).
export interface DirectionFonts {
  display: string
  body: string
  mono: string
}

export const FONTS: Record<Direction, DirectionFonts> = {
  chancery: {
    display: "'Fraunces', serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  situation: {
    display: "'Space Grotesk', system-ui, sans-serif",
    body: "'IBM Plex Sans', system-ui, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, monospace",
  },
  ministerial: {
    display: "'Public Sans', system-ui, sans-serif",
    body: "'Public Sans', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  bureau: {
    display: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
} as const
```

```typescript
// frontend/src/design-system/tokens/buildTokens.ts — add to the returned object
// (direction-keyed, NOT mode-keyed):
const fonts = FONTS[direction]
return {
  // ...existing Phase 33 tokens...
  '--font-display': fonts.display,
  '--font-body': fonts.body,
  '--font-mono': fonts.mono,
}
```

### Pattern 3: Tailwind v4 `@theme` font utility binding

**What:** Expose `font-display` / `font-body` / `font-mono` Tailwind utilities that resolve to the CSS vars.
**When to use:** Inside the existing `@theme { ... }` block in `frontend/src/index.css`.
**Example:**

```css
@theme {
  /* ...existing Phase 33 color/shadow tokens... */

  /* Phase 35 — font-family utilities. Tailwind v4 exposes
     `--font-*` entries as `font-*` utility classes. The RHS `var(--font-*)`
     refs are populated by buildTokens()/applyTokens() at boot. */
  --font-display: var(--font-display);
  --font-body: var(--font-body);
  --font-mono: var(--font-mono);
}
```

`[CITED: https://tailwindcss.com/docs/font-family#customizing-your-theme — Tailwind v4]`
`[ASSUMED: The @theme var-alias-to-var pattern for font-family. Verify against the Phase 33-06 shadow pattern which confirms @theme LHS=RHS self-reference crashes v4 generator for shadows. If fonts behave similarly, inline the fallback chains directly instead: `--font-display: 'Fraunces', serif;`with runtime override via`setProperty('--font-display', ...)`. Test both patterns in Wave 0.]`

**Note on self-reference collision** — Phase 33-06 discovered (`e5fcacec`) that `--shadow-card: var(--shadow-card)` crashes the v4 generator. The current `@theme` block DOES use `--color-bg: var(--bg)` successfully (different var name on LHS/RHS — no collision). For fonts, the names ARE the same (`--font-display` namespace is both Tailwind's utility source AND our token name). **Recommend testing the pattern in Wave 0** and, if it crashes, using distinct names: `--tw-font-display: var(--font-display)` etc. (or `--font-family-display`).

### Anti-Patterns to Avoid

- **Hardcoded `font-family: "Fraunces"` outside `index.css` / `directions.ts`.** All consumers must use `var(--font-display)` or the `font-display` utility. (Cross-phase enforcement: Phase 36-42 grep-audit during plan-checker.)
- **Per-direction CSS classes like `.dir-chancery { font-family: ... }`.** Handoff used these; we do NOT replicate — tokens on `:root` handle routing.
- **Importing fontsource inside React components.** Fonts must load once at boot (D-05), not per-component.
- **Gating Tajawal on `id.locale`.** Breaks mid-session language switches (D-06).

## Don't Hand-Roll

| Problem                                         | Don't Build                                             | Use Instead                                        | Why                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `@font-face` rules for 8 families × 3-7 weights | Custom CSS + woff2 hosting                              | `@fontsource/*`                                    | Fontsource handles woff2 compression, unicode-range subsetting, font-display defaults, semver bumps. |
| Variable-axis font loading                      | Write `@font-face` with `font-weight: 100 900` manually | `@fontsource-variable/<name>/wght.css`             | Fontsource-variable auto-emits the correct `font-weight: 100 900` axis descriptor + `src` URL.       |
| RTL font switching logic in JS                  | React effect reading `i18n.language` to swap families   | CSS `html[dir="rtl"]` cascade (D-07)               | CSS cascade runs before React hydration; no FOUC. Handoff-verified pattern.                          |
| Per-weight subset loading                       | Build script that tree-shakes unused weights            | Import explicit weights in `fonts.ts`              | Fontsource pre-subsets each weight's `@font-face`; importing fewer weights = fewer requests.         |
| Token engine module layout                      | New `fonts.ts` in `tokens/`                             | Extend existing `directions.ts` + `buildTokens.ts` | D-01 explicitly reuses the Phase 33 pipeline; no new module.                                         |

**Key insight:** fontsource is the de-facto self-hosting package for modern React apps. Anything more hand-rolled is a regression.

## Runtime State Inventory

_(Phase 35 is NOT a rename / refactor / migration phase — it is a capability addition. Runtime state inventory is not applicable. For completeness:)_

| Category            | Items Found                                                                                                             | Action Required                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Stored data         | None — no DB/Redis/storage involvement                                                                                  | None                                           |
| Live service config | None — no external service config                                                                                       | None                                           |
| OS-registered state | None — pure frontend                                                                                                    | None                                           |
| Secrets/env vars    | None — no new secrets                                                                                                   | None                                           |
| Build artifacts     | `frontend/node_modules/@fontsource*` (populated by `pnpm install`); `dist/` will include woff2 assets after next build. | Fresh `pnpm install` + `pnpm build` validates. |

## Common Pitfalls

### Pitfall 1: `@theme` self-reference crash (Phase 33-06 learning)

**What goes wrong:** `@theme { --shadow-card: var(--shadow-card); }` crashes the Tailwind v4 generator with `y is not a function`.
**Why it happens:** Tailwind v4's `@theme` treats LHS as authoritative; same-name RHS creates a self-reference loop.
**How to avoid:** Either (a) inline literal fallback values on LHS of `@theme` and rely on `applyTokens()` to override at boot (current Phase 33 shadow pattern), or (b) use distinct names (`--tw-font-display: var(--font-display)`).
**Warning signs:** `pnpm build` or `pnpm dev` crashes with `... is not a function` during Tailwind generation.

**Confidence:** HIGH — Phase 33-06's `SUMMARY.md` + commit `e5fcacec` documented this. `[VERIFIED: Phase 33-06 SUMMARY]`

### Pitfall 2: `main.tsx` import order

**What goes wrong:** If `./fonts` is imported AFTER `./index.css`, the `@font-face` rules still inject but may briefly flash an unstyled fallback because the CSS that references them has already been evaluated.
**Why it happens:** ESM import order determines CSS injection order.
**How to avoid:** `import './fonts'` MUST be the first statement in `main.tsx`, even before `import './index.css'`.
**Warning signs:** First-paint flash where body renders in system-ui before switching to Inter/etc.

**Confidence:** HIGH — standard fontsource integration gotcha. `[CITED: https://fontsource.org/docs/getting-started/install#usage]`

### Pitfall 3: Tajawal `!important` precedence

**What goes wrong:** Phase 36-42's shell-chrome classes (`.chip`, `.kpi-label`) might add their own font-family rules that would win against the Tajawal cascade — except the handoff cascade uses `!important`.
**Why it happens:** The handoff's chip/label/tag override block ends with `font-family: 'Tajawal', system-ui, sans-serif !important;`.
**How to avoid:** Port the `!important` verbatim (D-07). Downstream phases must NOT add `!important` font-family rules to chip/label classes.
**Warning signs:** In Phase 43 QA sweep, if AR `.chip` shows Latin font, it's because someone added `!important` downstream.

**Confidence:** HIGH — visible in extracted block. `[VERIFIED: /tmp/inteldossier-handoff/.../app.css line 171]`

### Pitfall 4: Google Fonts `<link>` leftovers in `index.html`

**What goes wrong:** `frontend/index.html` currently (verified 2026-04-22) contains 6 `<link rel="preload">` + 6 `<noscript><link rel="stylesheet">` tags pointing at `fonts.googleapis.com` for: Readex Pro, Outfit, Kumbh Sans, Hedvig Letters Serif, Poppins, Plus Jakarta Sans. TYPO-02 SC-2 explicitly requires "zero requests to `fonts.googleapis.com` or `fonts.gstatic.com`".
**Why it happens:** Leftover from pre-Phase 35 theming system; no prior phase cleaned them up.
**How to avoid:** Phase 35 MUST delete all 12 `<link>` elements from `frontend/index.html` (lines ~14-58, between the `<meta ... Expires>` comment and the `<title>` tag). The `<link rel="preconnect">` to `fonts.googleapis.com` at line ~13 must also be removed.
**Warning signs:** Playwright network panel test shows requests to `fonts.googleapis.com`; TYPO-02 E2E assertion fails.

**Confidence:** HIGH — grep'd directly against `frontend/index.html` 2026-04-22. `[VERIFIED: frontend/index.html]`

### Pitfall 5: `placeholders-and-vanish-input.tsx:64` canvas glyph mismatch

**What goes wrong:** The canvas draws placeholder text using `ctx.font = ${size}px ${computedStyles.fontFamily}`. After D-02 rewrites `--text-family` → `--font-body`, the computed family string changes. Canvas uses the first listed family name; if `--font-body = "'Inter', system-ui, ..."`, canvas picks `Inter`. Previously `--text-family = "'Inter', system-ui, ..."` → picked `Inter`. Identical result.
**Why it happens:** The rename is purely semantic; both vars resolved to the same value.
**How to avoid:** Manual visual spot-check of `placeholders-and-vanish-input` usage after D-02 lands.
**Warning signs:** Placeholder text renders in different font than surrounding input text.

**Confidence:** HIGH — grep confirms only one `fontFamily` reference in `frontend/src`. `[VERIFIED: grep -rn "fontFamily" frontend/src]`

## Code Examples

### The verbatim Tajawal cascade (D-07) — paste byte-for-byte into `index.css`

`[VERIFIED: /tmp/inteldossier-handoff/inteldossier/project/src/app.css lines 129-176]`

```css
/* ============ Arabic typography override: Tajawal ============ */
/* When document is RTL, Tajawal takes precedence for all type — including */
/* the Arabic-ع button (which is LTR by default) and Latin glyphs mixed in. */
html[dir='rtl'],
html[dir='rtl'] body {
  font-family: 'Tajawal', 'Inter', system-ui, sans-serif;
}
html[dir='rtl'] * {
  font-family: 'Tajawal', 'Inter', system-ui, sans-serif;
}
/* Defeat inline fontFamily:'var(--font-display)' in RTL (Fraunces lacks Arabic) */
html[dir='rtl'] [style*='--font-display'] {
  font-family: 'Tajawal', system-ui, sans-serif !important;
}
/* Display (serifs, grotesks) still use Tajawal in Arabic — no fallback serif */
html[dir='rtl'] .page-title,
html[dir='rtl'] .card-title,
html[dir='rtl'] .drawer-title,
html[dir='rtl'] .kpi-value,
html[dir='rtl'] .week-dd,
html[dir='rtl'] .label,
html[dir='rtl'] .sb-group,
html[dir='rtl'] .dir-chancery,
html[dir='rtl'] .dir-situation,
html[dir='rtl'] .dir-ministerial,
html[dir='rtl'] .dir-bureau {
  font-family: 'Tajawal', system-ui, sans-serif;
}
/* Let mono stay mono for non-Arabic tokens (⌘K, T−3), but when inside RTL
   container with Arabic content use Tajawal */
html[dir='rtl'] .mono:not([dir='ltr']) {
  font-family: 'Tajawal', ui-monospace, monospace;
}
/* Keep the tiny LTR-isolated spans (kbd, T−3 etc.) in mono */
html[dir='rtl'] [dir='ltr'].mono,
html[dir='rtl'] kbd[dir='ltr'] {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

/* Force Tajawal on chips/labels/tags in RTL — these have direction-class overrides */
/* (.dir-bureau .chip, .dir-situation .chip etc.) which would otherwise win and  */
/* show Arabic glyphs in Inter/JetBrains Mono (no Arabic coverage → tofu).        */
html[dir='rtl'] .chip,
html[dir='rtl'] .chip *,
html[dir='rtl'] .label,
html[dir='rtl'] .digest-tag,
html[dir='rtl'] .task-due,
html[dir='rtl'] .week-time,
html[dir='rtl'] .week-day,
html[dir='rtl'] .kpi-label,
html[dir='rtl'] .kpi-delta,
html[dir='rtl'] .overdue-days,
html[dir='rtl'] .overdue-owner,
html[dir='rtl'] .recent-when,
html[dir='rtl'] .cls-chip {
  font-family: 'Tajawal', system-ui, sans-serif !important;
}

/* The Arabic-ع button in the locale switcher should also use Tajawal */
html[dir='rtl'] .tb-locale-btn,
.tb-locale-btn[data-lang='ar'] {
  font-family: 'Tajawal', system-ui, sans-serif;
}
```

### Line-by-line `index.css` mutation map (D-02)

| Line | Current                                                                             | Replace with                                                                        | Reason                                                       |
| ---- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 150  | `--display-family: 'Inter', system-ui, sans-serif;`                                 | (delete — tokens are now set at runtime by `applyTokens()`)                         | Family literals live in `directions.ts` now.                 |
| 151  | `--display-weight: 600;`                                                            | (delete)                                                                            | Move to component-level or delete entirely; not font-family. |
| 152  | `--text-family: 'Inter', system-ui, sans-serif;`                                    | (delete)                                                                            |                                                              |
| 153  | `--text-family-rtl: 'Readex Pro', system-ui, sans-serif;`                           | (delete — D-07 cascade replaces)                                                    |                                                              |
| 154  | `--text-weight: 400;`                                                               | (delete)                                                                            |                                                              |
| 211  | `font-family: var(--text-family);`                                                  | `font-family: var(--font-body);`                                                    | html rule                                                    |
| 216  | `font-family: var(--text-family);`                                                  | `font-family: var(--font-body);`                                                    | body rule                                                    |
| 238  | `font-family: var(--display-family);`                                               | `font-family: var(--font-display);`                                                 | h1-h6 rule                                                   |
| 259  | `font-family: var(--text-family);`                                                  | `font-family: var(--font-body);`                                                    | p/span/div rule                                              |
| 266  | `font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;` | `font-family: var(--font-mono);`                                                    | code/pre/kbd rule                                            |
| 286  | `font-family: var(--text-family);`                                                  | `font-family: var(--font-body);`                                                    | `html[dir='ltr']` rule                                       |
| 293  | `font-family: var(--text-family-rtl);`                                              | (delete the entire `html[dir='rtl']` block at lines 291-295 — D-07 cascade owns it) |                                                              |
| 302  | `font-family: var(--display-family);`                                               | `font-family: var(--font-display);`                                                 | `html[dir='ltr'] h1..h6`                                     |
| 312  | `font-family: var(--text-family-rtl);`                                              | (delete block at 310-314)                                                           |                                                              |
| 319  | `font-family: var(--display-family);`                                               | `font-family: var(--font-display);`                                                 | `.font-display` utility                                      |
| 324  | `font-family: var(--text-family-rtl);`                                              | (delete `html[dir='rtl'] .font-display` block at 323-325)                           |                                                              |
| 328  | `font-family: var(--text-family);`                                                  | `font-family: var(--font-body);`                                                    | `.font-text`                                                 |
| 333  | `font-family: var(--text-family-rtl);`                                              | (delete block at 332-334)                                                           |                                                              |

### Storybook presence check

Verified 2026-04-22: `.storybook/` does NOT exist at repo root. `frontend/.storybook/` EXISTS but contains stubs only (Phase 33-08 was deferred; no real install). **No Storybook `preview` file needs updating in Phase 35.** `[VERIFIED: ls .storybook + ls frontend/.storybook]`

## State of the Art

| Old Approach                              | Current Approach                                   | When Changed                             | Impact                                                                                                 |
| ----------------------------------------- | -------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Google Fonts CDN                          | `@fontsource/*` self-hosted                        | 2021+ (Google's own privacy / GDPR push) | No third-party cookies, no CDN outage risk, Lighthouse TTFB win.                                       |
| Classic `@fontsource/<name>/<weight>.css` | `@fontsource-variable/<name>/wght.css`             | 2023+                                    | Single file covers all weights via OpenType variable axis — smaller total bytes when using 3+ weights. |
| `font-display: auto`                      | `font-display: swap` (fontsource default)          | 2019+                                    | No invisible text during font load; FOUT is accepted tradeoff.                                         |
| Hardcoded font-family in components       | CSS vars `--font-*` + Tailwind v4 `@theme` utility | 2024+ (Tailwind v4 native `@theme`)      | Zero-override theming; direction switch is one `setProperty()` call.                                   |

**Deprecated/outdated:**

- `@fontsource/readex-pro` for Arabic → replaced by `@fontsource/tajawal` (this phase's decision per handoff).
- `<link rel="stylesheet" href="https://fonts.googleapis.com/...">` — banned by TYPO-02.
- `tailwind.config.ts extend.fontFamily` — Tailwind v4 uses `@theme` directive instead (Phase 33-06 baseline).

## Assumptions Log

| #   | Claim                                                                                                                                | Section                         | Risk if Wrong                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `@theme { --font-display: var(--font-display); }` self-reference is safe in Tailwind v4 (distinct from the Phase 33-06 shadow crash) | Architecture Pattern 3          | Wave 0 smoke test: `pnpm dev` + inspect computed style. If crash, use distinct namespace `--tw-font-display`. LOW-MEDIUM risk — isolated to one `@theme` entry; easy fix. |
| A2  | fontsource's default `font-display: swap` is the right choice for this app                                                           | CONTEXT.md §Claude's Discretion | If FOUT is visually jarring on slow networks, switch to `fallback`. LOW risk — can be changed per-import via URL fragment `?display=fallback` (fontsource convention).    |
| A3  | `wght.css` for Fraunces is sufficient (no `opsz` needed for first ship)                                                              | Standard Stack row 4            | Visual fidelity for Chancery display type might be slightly less crisp at small sizes. Deferred acceptably (CONTEXT.md §Deferred).                                        |
| A4  | Tajawal full-weights (400/500/700) are correct; skip arabic-only subset                                                              | Standard Stack row 8            | Bundle size ~30KB larger. Acceptable — mixed EN/AR content (names, numbers) needs full glyph coverage.                                                                    |

## Open Questions

### Q1 — `<link rel="preload" as="font">` hints in `index.html` (Claude's Discretion)

- **What we know:** Fontsource injects `@font-face` via JS/CSS import; the browser fetches woff2 at CSS parse time, not at HTML parse. A `<link rel="preload" as="font" href="/.../inter.woff2" crossorigin>` in `<head>` would start the fetch ~100-200ms earlier on cold load.
- **What's unclear:** The exact hashed filename of each woff2 after Vite bundling. Vite adds content hashes (`inter-wght-normal-CjY8fD2X.woff2`) — can't hardcode preload URLs. Could use Vite plugin (`vite-plugin-preload`) but adds a dep.
- **Recommendation:** SKIP preload for initial Phase 35 ship. Measure Lighthouse first-paint delta during Phase 43 QA sweep; if >200ms improvement available, add preload in a future perf-pass phase. Matches `§Deferred Ideas`.

### Q2 — `@theme` font self-reference (Assumption A1)

- **What we know:** Phase 33-06 crashed on `--shadow-card: var(--shadow-card)`. Works fine on `--color-bg: var(--bg)` (distinct names).
- **What's unclear:** Does the same-name pattern `--font-display: var(--font-display)` crash?
- **Recommendation:** Wave 0 smoke test. Land a 5-minute spike commit with the same-name pattern; if `pnpm dev` / `pnpm build` green, proceed. If crash, switch to distinct names: `@theme { --tw-font-display: var(--font-display); }` (Tailwind v4 exposes `font-tw-font-display` utility — ugly; prefer inlining literal fallbacks on LHS and writing values at runtime via `applyTokens()`, matching Phase 33-06's shadow pattern).

## Environment Availability

| Dependency                            | Required By              | Available                           | Version  | Fallback                                                                     |
| ------------------------------------- | ------------------------ | ----------------------------------- | -------- | ---------------------------------------------------------------------------- |
| Node.js 20+                           | pnpm, vite, vitest       | ✓ (pinned via `.nvmrc` / `engines`) | 20.19+   | None — blocking                                                              |
| pnpm                                  | `pnpm add @fontsource/*` | ✓                                   | 10.29.1+ | npm/yarn (not recommended — lockfile divergence)                             |
| `@fontsource-variable/inter`          | D-03                     | ✓                                   | 5.2.8    | `@fontsource/inter` classic (fallback if variable breaks)                    |
| `@fontsource-variable/public-sans`    | D-03                     | ✓                                   | 5.2.7    | classic `@fontsource/public-sans`                                            |
| `@fontsource-variable/space-grotesk`  | D-03                     | ✓                                   | 5.2.10   | classic `@fontsource/space-grotesk`                                          |
| `@fontsource-variable/fraunces`       | D-03                     | ✓                                   | 5.2.9    | classic `@fontsource/fraunces`                                               |
| `@fontsource-variable/jetbrains-mono` | D-03                     | ✓                                   | 5.2.8    | classic `@fontsource/jetbrains-mono`                                         |
| `@fontsource/ibm-plex-sans`           | D-03                     | ✓                                   | 5.2.8    | (none needed — verified)                                                     |
| `@fontsource/ibm-plex-mono`           | D-03                     | ✓                                   | 5.2.7    | (none needed — verified)                                                     |
| `@fontsource/tajawal`                 | D-03                     | ✓                                   | 5.2.7    | (none needed — verified)                                                     |
| Tailwind v4 `@theme`                  | @theme font utility      | ✓ (Phase 33-06 landed)              | 4.2.2    | None                                                                         |
| Vitest                                | Unit tests               | ✓ (`frontend/vitest.config.ts`)     | —        | None                                                                         |
| Playwright                            | E2E tests                | ✓ (tests/e2e/\*.spec.ts)            | —        | `--list` fallback (per Phase 34 pattern; no `frontend/playwright.config.ts`) |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None — all variable-axis packages have classic fallbacks, but none are needed.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Framework          | Vitest 3+ (unit) + Playwright (E2E)                                                         |
| Config file        | `frontend/vitest.config.ts`, `frontend/playwright.config.ts` missing (per Phase 34 outcome) |
| Quick run command  | `pnpm -C frontend test tests/unit/design-system/buildTokens.test.ts`                        |
| Full suite command | `pnpm -C frontend test && pnpm test:e2e:sc`                                                 |
| Phase gate         | Full suite green before `/gsd-verify-work`                                                  |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                         | Test Type                       | Automated Command                                                               | File Exists?                     |
| ------- | -------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------- | -------------------------------- |
| TYPO-01 | buildTokens emits `--font-display / --font-body / --font-mono` per direction     | unit                            | `pnpm -C frontend test tests/unit/design-system/buildTokens.test.ts -t "fonts"` | ✓ file exists; add 12 assertions |
| TYPO-01 | At runtime `:root` carries the 3 font vars after DesignProvider mounts           | E2E                             | `playwright test tests/e2e/typography.spec.ts -t "direction × font-var"`        | ❌ Wave 0 — new file             |
| TYPO-02 | 8 `@fontsource*` packages present in `package.json` + `fonts.ts` imports resolve | unit (grep + `require.resolve`) | `pnpm -C frontend test tests/unit/design-system/fonts.test.ts`                  | ❌ Wave 0 — new file             |
| TYPO-02 | Zero requests to `fonts.googleapis.com` or `fonts.gstatic.com` at page load      | E2E                             | `playwright test tests/e2e/typography.spec.ts -t "no google fonts"`             | ❌ Wave 0                        |
| TYPO-03 | Tajawal cascade block present byte-for-byte in `index.css`                       | unit (grep hash)                | `pnpm -C frontend test tests/unit/design-system/tajawal-cascade.test.ts`        | ❌ Wave 0 — new file             |
| TYPO-03 | `html[dir="rtl"] h1` `getComputedStyle().fontFamily` starts with "Tajawal"       | E2E                             | `playwright test tests/e2e/typography.spec.ts -t "rtl h1 Tajawal"`              | ❌ Wave 0                        |
| TYPO-04 | `html[dir="rtl"] [dir="ltr"].mono` element renders JetBrains Mono                | E2E (fixture)                   | `playwright test tests/e2e/typography.spec.ts -t "TYPO-04 fixture"`             | ❌ Wave 0                        |

### Sampling Rate (Nyquist)

- **Per task commit:** `pnpm -C frontend test tests/unit/design-system/` (~2s)
- **Per wave merge:** `pnpm -C frontend test` (full unit suite) + `pnpm test:e2e:sc`
- **Phase gate:** Full suite green before `/gsd-verify-work`

Nyquist principle applied: failure modes for Phase 35 = {wrong-font-per-direction (4 dirs × 3 roles = 12 cases), google-fonts-leak (1), tajawal-cascade-regression (1 — byte-equal grep), ltr-mono-isolation (1 fixture)}. Total: 12 unit + 4 E2E scenarios. Sampling rate = 2× number of failure modes → well-covered.

### Fixtures

**TYPO-04 fixture** (decisive for this phase): Phase 35 does NOT render the downstream chrome (`.mono` / `kbd[dir="ltr"]` spans come in Phases 36-42). Recommendation: use an E2E fixture page at `frontend/e2e/fixtures/typo-04-fixture.html` (served by dev server) containing:

```html
<!doctype html>
<html dir="rtl">
  <head>
    <link rel="stylesheet" href="/src/index.css" />
  </head>
  <body>
    <main>
      <p>هذا نص عربي</p>
      <span class="mono" dir="ltr" data-testid="typo04-probe">⌘K</span>
      <kbd dir="ltr" data-testid="typo04-kbd">T−3</kbd>
    </main>
  </body>
</html>
```

Playwright test asserts `getComputedStyle(element).fontFamily.startsWith("JetBrains Mono")` for both `data-testid` probes. This proves TYPO-04 without waiting for Phase 36-42's real `.mono` spans.

**Recommendation (per open question in `<additional_context>`#5):** Use **fixture-based E2E test in Phase 35** (option a). Reasons:

1. TYPO-04 is a Phase 35 requirement per ROADMAP.md; can't defer assertion to Phase 43 without violating phase-gate contract.
2. Fixture is small (~15 lines HTML + 1 Playwright spec); cost is negligible.
3. Deferring to Phase 43 means Phase 35 could ship with a broken TYPO-04 CSS rule and nobody would know until 8 phases later.
4. Phase 43 will re-assert end-to-end against real chrome anyway — fixture is belt-and-suspenders, not duplicate.

### Wave 0 Gaps

- [ ] `frontend/tests/unit/design-system/fonts.test.ts` — asserts all 8 @fontsource imports resolve (uses `require.resolve()`).
- [ ] `frontend/tests/unit/design-system/tajawal-cascade.test.ts` — reads `index.css`, greps for the verbatim D-07 block, asserts all 48 lines present.
- [ ] `frontend/tests/e2e/typography.spec.ts` — Playwright spec covering TYPO-01..04.
- [ ] `frontend/e2e/fixtures/typo-04-fixture.html` — minimal DOM for TYPO-04 (see above).
- [ ] Extend `frontend/tests/unit/design-system/buildTokens.test.ts` — +12 font assertions.

No framework install needed (Vitest + Playwright already configured per Phase 33-09).

## Security Domain

**`security_enforcement: enabled` (default, not set to false in config).**

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                                                                      |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no      | N/A — pure CSS/font loading                                                                                                           |
| V3 Session Management | no      | N/A                                                                                                                                   |
| V4 Access Control     | no      | N/A                                                                                                                                   |
| V5 Input Validation   | no      | Token-engine input is enum-typed (Direction/Mode/Density); hue is number clamped to 0-360. No user input reaches font-family strings. |
| V6 Cryptography       | no      | N/A                                                                                                                                   |
| V14 Configuration     | yes     | woff2 assets ship via pnpm; integrity via lockfile SHA-512 hashes (pnpm `integrity:` field).                                          |

### Known Threat Patterns for Tailwind v4 + fontsource

| Pattern                                    | STRIDE                 | Standard Mitigation                                               |
| ------------------------------------------ | ---------------------- | ----------------------------------------------------------------- |
| Google Fonts CDN leak (privacy/GDPR)       | Information Disclosure | Self-host via `@fontsource/*` (TYPO-02 is the control itself)     |
| Supply-chain: malicious fontsource update  | Tampering              | pnpm lockfile pins SHA-512 integrity hash per package version     |
| Font-format XSS (rare, woff2-parsing CVEs) | Tampering              | Browser vendors patch in Chrome/Firefox; not app-level mitigation |

## Sources

### Primary (HIGH confidence)

- `npm view @fontsource-variable/<name> version` — verified 2026-04-22 on live registry (`registry.npmjs.org`)
- `npm pack <pkg>` + `tar -tzf` — verified CSS sub-paths shipped in each tarball
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css` lines 129-176 — verbatim Tajawal cascade
- `frontend/src/index.css` (grep, read 1-340) — current legacy var state
- `frontend/src/design-system/tokens/{buildTokens,applyTokens,types,directions,densities}.ts` — current engine
- `frontend/index.html` (read 1-60) — **surprise finding: 6 Google Fonts CDN links present**
- `.planning/REQUIREMENTS.md` §Typography (TYPO-01..04)
- `.planning/ROADMAP.md` §Phase 35
- `.planning/STATE.md` — blocker list + current position

### Secondary (MEDIUM confidence)

- Tailwind v4 `@theme` docs — `font-*` utility naming convention
- fontsource.org getting-started docs — `wght.css` naming convention
- Phase 33-06 SUMMARY (inline in STATE.md) — `@theme` self-reference crash lore

### Tertiary (LOW confidence)

- Assumption A1 (same-name `--font-*` self-ref safe) — UNVERIFIED; Wave 0 smoke test needed
- Assumption A3 (`wght.css` sufficient for Fraunces) — matches D-04 but visual fidelity not measured

## Specific corrections to CONTEXT.md

1. **CONTEXT.md says Tajawal cascade is "~60 lines" — actual is 48 lines (app.css 129-176).**
2. **CONTEXT.md's legacy-var line list (11 references) missed line 248.** Grep finds 11 `font-family: var(--text-family*/display-family)` references: 211, 216, 238, 259, 266 (mono stack), 286, 293, 302, 312, 319, 324, 328, 333 = 13 references. Line 248 is NOT a font-family line (re-checked — it's an unrelated `font-weight` rule). The correct count is **13 `font-family:` rewrites**, not 11. Plus 5 `:root` var declarations (lines 150-154) to delete.
3. **Not in CONTEXT.md: `frontend/index.html` contains 6 Google Fonts CDN `<link>` blocks** that MUST be deleted to satisfy TYPO-02 SC-2. This is a scope addition discovered during research.

## Metadata

**Confidence breakdown:**

- Standard stack (8 packages): HIGH — live npm + tarball inspection
- Architecture (`@theme` self-ref): MEDIUM — inference from Phase 33-06 shadow pattern; needs Wave 0 verification
- Pitfalls: HIGH — all verified against codebase or Phase 33 commit history
- Tajawal cascade: HIGH — extracted verbatim
- Google Fonts removal scope: HIGH — direct grep

**Research date:** 2026-04-22
**Valid until:** 2026-05-22 (30 days — fontsource versions stable; Tailwind v4 stable)

---

_Phase: 35-typography-stack_
_Research completed: 2026-04-22_
