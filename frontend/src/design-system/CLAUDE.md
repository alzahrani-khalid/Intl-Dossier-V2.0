# Design-system port (frontend/src/design-system/)

The runtime token engine. Read the root `/CLAUDE.md` "Visual Design Source of
Truth" and "Design rules — non-negotiable" sections first — they are authoritative.
This file documents how the runtime port here mirrors them; it does not repeat them.

## Source of truth vs. this port

- The canonical VISUAL design is the IntelDossier prototype at
  `frontend/design-system/inteldossier_handoff_design/` (read its `README.md` for
  voice, `colors_and_type.css` for token names/values, and the closest component in
  `src/` before building). That directory is reference only — it is ESLint-ignored
  and never imported by the app.
- THIS directory is the production runtime port. Files:
  - `DesignProvider.tsx` — owns the four design primitives (direction, mode, hue,
    density), persists each to localStorage (`id.dir`, `id.theme`, `id.hue`,
    `id.density`), re-derives the `TokenSet` via pure `buildTokens`, flushes to
    `:root` via `applyTokens`, toggles `.dark`, and sets `data-direction` /
    `data-density`. Wiring only — the token math lives in `tokens/`.
  - `tokens/directions.ts` — the per-direction light/dark hex `PALETTES` and radius
    scales (verbatim port of the prototype `themes.jsx`).
  - `tokens/densities.ts` — the `--pad` / `--gap` / `--row-h` triplets per density.
  - `tokens/buildTokens.ts` / `applyTokens.ts` / `types.ts` — pure builder + DOM
    writer + types.
  - `directionDefaults.ts` — default mode/hue per direction.

## Bureau is the default direction

`App.tsx` mounts `DesignProvider` with `initialDirection="bureau"`,
`initialMode="light"`, `initialHue={32}`, `initialDensity="comfortable"`.
Bureau radii are 8/12/16 px (`--radius-sm`/`--radius`/`--radius-lg`). Ignore
chancery, situation, and ministerial unless a task explicitly references them.

## The FOUC bootstrap must byte-match this port

`frontend/public/bootstrap.js` runs `<script blocking="render">` from
`index.html` BEFORE any stylesheet parses, painting first-frame tokens from
localStorage. It is ES5-safe (no arrows/const/template literals). Its three
literal tables MUST byte-match this directory or the first paint diverges:

- the palette table `P` ↔ `tokens/directions.ts` (`PALETTES`),
- the density table `D` ↔ `tokens/densities.ts`,
- the font table `F` ↔ `tokens/directions.ts` (`FONTS`).

If you change a palette/density/font value here, change `bootstrap.js` in the same
edit. `bootstrap.js` and `tokens/directions.ts` are the only files allowed raw hex
(ESLint carve-out).

## How tokens reach Tailwind

`src/index.css` has the Tailwind v4 `@theme` block mapping `--color-*` to the
runtime `var(--*)` tokens (`--color-bg: var(--bg)`, `--color-ink: var(--ink)`,
`--color-line: var(--line)`, `--color-accent: var(--accent)`, plus semantic
`--color-danger`/`success`/`warning`/`info` and shadcn-compat aliases). That is
what makes `bg-bg`, `text-ink`, `border-line`, `bg-accent`, `text-danger`, etc.
resolve to live tokens.

## Non-negotiables (mirrors `/CLAUDE.md`, enforced by ESLint)

- Color only via `var(--*)` tokens or the `@theme`-mapped utilities above. NO raw
  hex, NO Tailwind palette literals (`text-blue-500`, `bg-red-600`) anywhere in
  `frontend/src` — ESLint errors on both, including inside template strings.
- Borders are `1px solid var(--line)`. NO drop-shadows on cards; shadow is reserved
  for drawers (`var(--shadow-lg)`) and hovered list rows.
- Surfaces are flat — NO gradient backgrounds.
- Radii from `--radius-sm` / `--radius` / `--radius-lg` (density/direction-aware).
  Do not hard-code px corners.
- Row heights use `var(--row-h)` (density-aware); tables and lists must obey it.
- Buttons mirror `.btn-primary` / `.btn-ghost` from the prototype `app.css`; do not
  add button variants without an explicit ask.
- No emoji in copy; sentence case; no marketing voice (prototype `README.md` voice).
