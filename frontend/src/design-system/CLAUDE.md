# Design-system port (frontend/src/design-system/)

The runtime token engine. Read the root `/CLAUDE.md` "Visual Design Source of
Truth" and "Design rules — non-negotiable" sections first — they are authoritative.
This file documents how the runtime port here mirrors them; it does not repeat them.

## Source of truth vs. this port

- The canonical VISUAL design is the **Linear** spec at `frontend/DESIGN.md` (read
  it for token tables, type stack, radii, and recipe rules before building).
- The IntelDossier prototype at
  `frontend/design-system/inteldossier_handoff_design/` is **historical reference
  (superseded 2026-07)** — it is ESLint-ignored, never imported by the app, and no
  longer a source of truth. Do not consult it for new work.
- THIS directory is the production runtime port. Files:
  - `DesignProvider.tsx` — owns the design primitives (direction, mode, density,
    locale), persists each to localStorage (`id.dir`, `id.theme`, `id.density`,
    `id.locale`), re-derives the `TokenSet` via pure `buildTokens`, flushes to
    `:root` via `applyTokens`, toggles `.dark`, and sets `data-direction` /
    `data-density`. Wiring only — the token math lives in `tokens/`.
  - `tokens/directions.ts` — the Linear light/dark hex `PALETTES` + radius scales +
    `FONTS` (the single `linear` entry; the four legacy directions and the hue axis
    were deleted in Phase 77-07).
  - `tokens/densities.ts` — the `--pad` / `--gap` / `--row-h` triplets per density.
  - `tokens/buildTokens.ts` / `applyTokens.ts` / `types.ts` — pure builder (reads
    palette literals unconditionally, no hue/OKLCH math) + DOM writer + types.
  - `hooks/` — `useDesignTokens`, `useDesignDirection`, `useMode`, `useDensity`,
    `useLocale`, `useClassification`, `useReducedMotion` (barrelled in `hooks/index.ts`).

There is no `directionDefaults.ts` and no `useHue.ts` — both were deleted in
77-07 when the engine collapsed to a single direction.

## Linear is the only direction

`App.tsx` mounts `DesignProvider` with `initialDirection="linear"`,
`initialMode="dark"`, `initialDensity="comfortable"` (there is no `initialHue` —
the accent-hue axis is gone; the accent is a verbatim Linear literal). **Dark is
the default mode** (Linear-canonical, user decision); an explicitly persisted
`id.theme="light"` is preserved, anything else resolves to dark.

`Direction` is a one-value union (`'linear'`) kept only for API stability —
`buildTokens`/`PALETTES` still key off it. Chancery, Situation, Ministerial, and
Bureau no longer exist in the engine.

**Coercion invariant (load-bearing migration).** Every pre-Phase-77 user holds one
of the four retired `id.dir` values, and the old per-direction fallback vanished
with the Linear swap — so a stale `id.dir` would paint a first frame with _no_
tokens. Both layers coerce it: `public/bootstrap.js` (first paint) and
`DesignProvider.tsx` (runtime) force any `id.dir !== 'linear'` to `'linear'` with a
try-guarded one-time write-back, and the same write-back `removeItem`s the retired
`id.hue` key. Never reintroduce a non-`linear` direction default.

## The three-copy invariant (byte-matched, guarded in lint + CI)

The Linear palette/font literals exist in **three copies that MUST byte-match**:

1. `tokens/directions.ts` — `PALETTES.linear` (light + dark) and `FONTS.linear`.
2. `frontend/public/bootstrap.js` — the ES5 `<script blocking="render">` from
   `index.html` runs BEFORE any stylesheet parses, painting first-frame tokens from
   localStorage. Its `P` (palette), `D` (density), and `F` (font) tables mirror the
   port. It is ES5-safe (no arrows/const/template literals).
3. `frontend/src/index.css` `:root` — a defense-in-depth fallback that paints the
   canonical Linear-dark first frame if the inline bootstrap's try/catch swallows an
   error (e.g. localStorage blocked in a sandboxed iframe).

`scripts/check-bootstrap-parity.mjs` fails the build (via `pnpm lint` and CI) on any
divergence across the three copies, including the `:root` block and the density
triplets. If you change a palette/density/font value, change **all three** in the
same edit. `bootstrap.js` and `tokens/directions.ts` are the only files allowed raw
hex (ESLint carve-out); the `index.css` `:root` block is the third carve-out.

## How tokens reach Tailwind

`src/index.css` has the Tailwind v4 `@theme` block mapping `--color-*` to the
runtime `var(--*)` tokens (`--color-bg: var(--bg)`, `--color-ink: var(--ink)`,
`--color-line: var(--line)`, `--color-accent: var(--accent)`, plus the Linear ladder
`--color-surface-3`/`-4`, `--color-line-strong`, `--color-accent-hover`, the six
`--color-status-1..6` (+ softs), and semantic `--color-danger`/`warning`/`ok`/`info`).
That is what makes `bg-bg`, `text-ink`, `border-line`, `bg-accent`, `bg-surface-3`,
`border-line-strong`, `bg-accent-hover`, `text-status-1`, `text-danger`, etc.
resolve to live tokens.

## Non-negotiables (mirrors `/CLAUDE.md`, enforced by ESLint)

- Color only via `var(--*)` tokens or the `@theme`-mapped utilities above. NO raw
  hex, NO Tailwind palette literals (`text-blue-500`, `bg-red-600`) anywhere in
  `frontend/src` — ESLint errors on both, including inside template strings.
- Borders are `1px solid var(--line)` (`var(--line-strong)` for emphasis). NO
  drop-shadows on cards (`--shadow-card` is `none` for Linear); shadow is reserved
  for drawers (`var(--shadow-drawer)` / `var(--shadow-lg)`) and hovered list rows.
- Surfaces are flat — NO gradient backgrounds. Layer with the surface ladder
  `--surface` / `--surface-raised` / `--surface-3` / `--surface-4` (cards on
  `--surface`, popovers/menus on `--surface-3`, drawers/modals on `--surface-4`).
- Radii from `--radius-sm` / `--radius` / `--radius-lg` (Linear 6/8/12,
  density-aware). Do not hard-code px corners.
- Row heights use `var(--row-h)` (density-aware); tables and lists must obey it.
- Buttons mirror the `.btn-primary` / `.btn-ghost` recipes (`src/index.css` +
  `src/styles/list-pages.css`); do not add button variants without an explicit ask.
- No emoji in copy; sentence case; no marketing voice.
