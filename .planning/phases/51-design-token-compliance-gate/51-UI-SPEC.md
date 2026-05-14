---
phase: 51
slug: design-token-compliance-gate
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-15
---

# Phase 51 — UI Design Contract

> Visual and interaction contract for the design-token compliance gate. This phase
> is enforcement-heavy, not design-heavy. No new tokens, components, or copy are
> introduced. The contract below pins (a) the token-mapping recipe used by Tier-A
> swaps, (b) the visual-fidelity guarantee that gates those swaps, and (c) the
> lint regex contract the executor must register.
>
> **Source of truth:** Bureau-light direction at
> `frontend/design-system/inteldossier_handoff_design/colors_and_type.css` and the
> runtime `@theme` block at `frontend/src/index.css` (lines 43–110). Both stay
> unchanged by this phase. See CLAUDE.md §"Visual Design Source of Truth" and the
> §"Definition of Done — UI checklist".

---

## Design System

| Property          | Value                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tool              | none (manual — IntelDossier handoff prototype)                                                                                                                |
| Preset            | not applicable (shadcn intentionally banned per CLAUDE.md §Component Library Strategy)                                                                        |
| Component library | HeroUI v3 + Radix UI (primitives only); IntelDossier prototype owns visual styling                                                                            |
| Icon library      | Inline custom SVG set (`frontend/design-system/inteldossier_handoff_design/src/icons.jsx`) — 38 glyphs, 1.5px stroke, `currentColor`. No external icon lib.   |
| Font              | Bureau direction: `Inter` (display + body), `JetBrains Mono` (mono), `Tajawal` (RTL fallback). Loaded via `frontend/src/fonts.ts` self-host stack (Phase 35). |

**Phase scope note.** This phase does not introduce or remove components. It
enforces token usage across existing components and clears the two named Tier-A
anchors (`WorldMapVisualization.tsx`, `PositionEditor.tsx`) plus mechanical
status/badge/alert literals discovered by the sweep.

---

## Spacing Scale

No new spacing. Existing Bureau density tokens already cover the entire scale.
The phase only swaps colors; container padding, row heights, and gaps are
untouched.

| Token        | Value                                           | Source                                                   |
| ------------ | ----------------------------------------------- | -------------------------------------------------------- |
| `--space-1`  | 4px                                             | `colors_and_type.css` §Spacing scale                     |
| `--space-2`  | 8px                                             | same                                                     |
| `--space-3`  | 12px                                            | same                                                     |
| `--space-4`  | 16px                                            | same (`var(--gap)` default)                              |
| `--space-5`  | 20px                                            | same (`var(--pad)` Comfortable density)                  |
| `--space-6`  | 24px                                            | same                                                     |
| `--space-8`  | 32px                                            | same                                                     |
| `--space-10` | 40px                                            | same                                                     |
| `--space-12` | 48px                                            | same                                                     |
| `--row-h`    | 52 / 40 / 32 px (Comfortable / Compact / Dense) | Density-aware via `bootstrap.js` + `tokens/densities.ts` |
| `--pad`      | 20 / 14 / 10 px                                 | same                                                     |
| `--gap`      | 16 / 12 / 8 px                                  | same                                                     |

Exceptions: none for this phase.

---

## Typography

No new typography. Bureau direction stays canonical. The phase does not touch
font-family, size, weight, or line-height declarations.

| Role    | Size                    | Weight | Line Height            | Token / Source                       |
| ------- | ----------------------- | ------ | ---------------------- | ------------------------------------ |
| Body    | 13px (`--t-body`)       | 400    | 1.5 (`--line-h-body`)  | `colors_and_type.css` §Type scale    |
| Label   | 10.5px (`--t-label`)    | 600    | 1.35 (`--line-h-snug`) | uppercase + `--tracking-label` 0.1em |
| Heading | 16px (`--t-card-title`) | 600    | 1.35 (`--line-h-snug`) | `--tracking-display` -0.005em        |
| Display | 28px (`--t-page-title`) | 600    | 1.1 (`--line-h-tight`) | `--tracking-tight` -0.02em           |

RTL note: Tajawal fallback applied via the unlayered cascade in `index.css`
(Phase 35 D-04). Tier-A swaps must not introduce any new font-family declarations.

---

## Color

This is the operative section of the spec. Phase 51 introduces no new colors —
it pins how raw hex and Tailwind palette literals map onto the existing Bureau
tokens.

### 60 / 30 / 10 baseline (Bureau light)

| Role            | Token / Utility                             | Value (Bureau light)              | Usage                                                                  |
| --------------- | ------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| Dominant (60%)  | `--bg` / `bg-bg`                            | `#f7f6f4` (warm neutral canvas)   | Page background, full-bleed surfaces                                   |
| Secondary (30%) | `--surface` / `--sidebar-bg` / `bg-surface` | `#ffffff`                         | Cards, drawers, popovers, sidebar nav                                  |
| Accent (10%)    | `--accent` / `bg-accent` / `text-accent`    | `oklch(58% 0.14 32)` (hue-driven) | Primary buttons, link state, KPI rules, focus ring, SLA on-track slice |
| Destructive     | `--danger` / `bg-danger` / `text-danger`    | `oklch(52% 0.18 25)`              | Destructive confirmations only (delete, breach)                        |

Accent reserved for: primary buttons, link text, focus ring, KPI accent rules,
SLA on-track slice in charts, and direction-specific brand element on the
classification ribbon. Never used for chrome borders, body text, generic
hover-tint, or status badges.

### Token-replacement contract — raw hex → token

For every `WorldMapVisualization.tsx`-shaped violation (raw hex passed to a JS
prop that ends up in inline `style` or an SVG `fill`/`stroke`):

| Source hex (in code today)                                 | Token recipe (Tier-A swap)                                                                                                                                                                                                                        | Visual-diff risk                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#3B82F6` (blue 500 family)                                | `var(--accent)` — read via `getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()` and pass to the WorldMap `lineColor` prop. Falls back to the same string the OKLCH accent paints; identical hue family across themes. | MINOR — Bureau accent is terracotta 32°, not blue 217°. The connection line shifts hue, but that **is the intent** (links must follow theme). User decision already locked: routes through `--accent` per Context D-02. |
| any other neutral / chrome hex (e.g. `#e5e7eb`, `#374151`) | `var(--line)` / `var(--ink-mute)` / `var(--ink)` depending on semantic role                                                                                                                                                                       | NONE — covered by Tier-B allowlist if file is in a chart/graph subtree; otherwise mechanical swap.                                                                                                                      |
| any other accent / link hex (e.g. `#2563eb`, `#3B82F6`)    | `var(--accent)` for interactive links; `var(--info)` only when the role is explicitly an informational chip background, not a brand link                                                                                                          | MINOR — same hue-shift rationale; Bureau theme intentionally re-routes link state through accent.                                                                                                                       |

**SVG / prop-pattern guidance.** When the consumer is JS-side (a prop, not a
className), prefer one of:

1. Read the CSS variable at render time via
   `getComputedStyle(document.documentElement).getPropertyValue('--accent')` and
   memoize. Use when the component accepts a string color prop (React-Flow,
   d3-derived components, dotted-map).
2. Render the SVG element with `fill="currentColor"` or `stroke="currentColor"`
   and set color through Tailwind `text-accent` on the parent. Use when the
   component is purely a `<svg>` you author yourself.

The executor must verify visual parity on the Bureau-light theme at 1280px (the
default analyst-workstation width) before locking either recipe.

### Token-replacement contract — Tailwind palette literal → token-mapped utility

For every `PositionEditor.tsx`-shaped violation (`text-blue-600`, `bg-red-50`,
`text-amber-600`, etc.), the mechanical swap table is:

| Source utility (banned)                                                                           | Token-mapped utility (Tier-A swap)                | Token resolves to (Bureau light)                            | Semantic role                    | Visual-diff risk                                                             |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| `text-blue-600 underline` (in `Link.HTMLAttributes` for both `editorEn` and `editorAr` instances) | `text-accent underline`                           | `oklch(58% 0.14 32)` (Bureau accent — terracotta, not blue) | Link state in rich-text editor   | MINOR — link hue shifts from blue to accent terracotta; intentional per D-02 |
| `border-red-200 bg-red-50` (error card border + tint)                                             | `border-danger/30 bg-danger/10`                   | `oklch(52% 0.18 25)` at 30% / 10% alpha — pale red tint     | Error-card chrome                | NONE — both resolve to a pale red surface                                    |
| `text-red-800` (error message text)                                                               | `text-danger`                                     | `oklch(52% 0.18 25)`                                        | Error message body               | NONE — same hue family, AA-safe on Bureau light card                         |
| `text-red-600` (small inline error icon color)                                                    | `text-danger`                                     | same as above                                               | Inline error icon                | NONE                                                                         |
| `text-red-* / bg-red-*` (any status / badge / alert)                                              | `text-danger` / `bg-danger/10` / `bg-danger-soft` | semantic danger family                                      | Generic error / destructive      | NONE                                                                         |
| `text-amber-* / bg-amber-* / text-yellow-* / bg-yellow-*`                                         | `text-warning` / `bg-warning/10` / `bg-warn-soft` | `oklch(51% 0.14 75)`                                        | Generic warning / SLA at-risk    | NONE                                                                         |
| `text-emerald-* / bg-emerald-* / text-green-* / bg-green-*`                                       | `text-success` / `bg-success/10` / `bg-ok-soft`   | `oklch(49% 0.12 155)`                                       | Generic success / SLA on-track   | NONE                                                                         |
| `text-blue-* / bg-blue-*` used semantically (informational chip, info banner)                     | `text-info` / `bg-info/10` / `bg-info-soft`       | `oklch(48% 0.14 230)`                                       | Informational chip / banner      | NONE — semantic info color                                                   |
| `text-blue-* / bg-blue-*` used as link / focus / brand accent                                     | `text-accent` / `bg-accent`                       | `oklch(58% 0.14 32)`                                        | Link / focus / accent            | MINOR (intentional hue shift to Bureau accent)                               |
| `text-slate-* / text-gray-* / text-zinc-* / text-neutral-* / text-stone-*` (body text)            | `text-ink` / `text-ink-mute` / `text-ink-faint`   | ink ramp `#1a1714` / `#6b6459` / `#736b60`                  | Body / secondary / disabled text | NONE                                                                         |
| `bg-slate-* / bg-gray-* / bg-zinc-* / bg-neutral-* / bg-stone-*` (chrome)                         | `bg-bg` / `bg-surface` / `bg-line-soft`           | `#f7f6f4` / `#ffffff` / `#efece3`                           | Chrome surfaces                  | NONE                                                                         |
| `border-slate-* / border-gray-* / border-zinc-* / border-neutral-* / border-stone-*`              | `border-line` / `border-line-soft`                | `#e8e4dc` / `#efece3`                                       | Card hairlines                   | NONE                                                                         |
| Any palette literal that has no clean semantic equivalent                                         | **STOP — escalate to user / Tier-C**              | n/a                                                         | Defer with audit row             | document in `51-DESIGN-AUDIT.md` Tier-C                                      |

**Rule for new entries.** The executor never invents new tokens during this
phase. If a literal does not map onto the table above, it goes to Tier-C in the
audit file with an `eslint-disable-next-line` pointing at that row. The chart /
graph subtrees in Tier-B (D-03) keep their raw hex untouched — those files are
out of scope.

### Variant-prefix rule (load-bearing)

Every variant chain on a banned palette also gets swapped. The token-mapped
utility automatically participates in the same chain. Examples the executor
must catch:

| Source                         | Swap to                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| `dark:text-blue-400`           | `dark:text-accent`                                          |
| `hover:bg-red-500`             | `hover:bg-danger`                                           |
| `md:dark:hover:text-amber-600` | `md:dark:hover:text-warning`                                |
| `aria-disabled:text-gray-400`  | `aria-disabled:text-ink-faint`                              |
| `focus:ring-blue-500`          | `focus:ring-accent` (uses `--color-ring` → `var(--accent)`) |

Dark-mode tokens already provide the dark-side OKLCH (Phase 33 `@theme` + Phase
34 mode switching) — no per-variant override needed at call sites.

### Implicit token-utility allowlist (full enumeration)

Every utility name in this list passes the lint rule by default because the
regex never enumerates them. Adding a new token to `@theme` automatically
extends this list without any rule change.

`bg`, `surface`, `surface-raised`, `ink`, `ink-mute`, `ink-faint`, `line`,
`line-soft`, `sidebar`, `sidebar-ink`, `accent`, `accent-ink`, `accent-soft`,
`accent-fg`, `accent-foreground`, `danger`, `danger-foreground`, `success`,
`success-foreground`, `warning`, `warning-foreground`, `ok`, `warn`, `info`,
`info-foreground`, `sla-ok`, `sla-risk`, `sla-bad`, `primary`,
`primary-foreground`, `foreground`, `muted-foreground`, `border`, `input`,
`background`, `card`, `card-foreground`, `popover`, `popover-foreground`,
`destructive`, `destructive-foreground`, `muted`, `secondary`,
`secondary-foreground`, `ring`.

Source: `frontend/src/index.css` `@theme` block lines 45–98.

---

## Visual Fidelity Guarantee

Every Tier-A swap must satisfy ALL of the following before commit:

1. **Bureau-light baseline at 1280px.** Mount the modified component on a dev
   page with `data-direction="bureau"`, `data-mode="light"` (default boot
   state). The rendered surface must be visually indistinguishable from the
   pre-swap baseline for every NONE-risk entry, and must match the intended
   hue-shift for every MINOR-risk entry (per the table above).
2. **RTL with Tajawal.** Repeat the check with `<html dir="rtl" lang="ar">`.
   Token values stay the same; only direction flips. The swap must not regress
   the existing Tajawal cascade (Phase 35 D-04) — no new `font-family` or
   `textAlign: 'right'` declarations.
3. **Dark mode passthrough.** Verify the component renders correctly when the
   user toggles `--theme: dark`. Because the swap routes through tokens, dark
   mode is automatic — but check at least one dark-mode screenshot for any
   `dark:` variant rewrite to confirm the chain still resolves.
4. **No raw hex in JS strings.** Grep the component file post-swap for the
   D-05 hex regex. Must return zero matches outside Tier-B file scope.
5. **No raw drop-shadows.** Verify `box-shadow` declarations stay on
   `--shadow-sm` / `--shadow` / `--shadow-lg`. Cards keep their hairline-only
   chrome (`1px solid var(--line)`). This phase does not change shadow policy.

For the two named anchors, the verification recipe is in
`51-VALIDATION.md` §Manual-Only Verifications:

- **`WorldMapVisualization.tsx:193`** — mount on a dev page pre-swap, screenshot,
  swap, re-mount, re-screenshot, diff visually. If `var(--accent)` does not
  resolve inside the SVG context, fall back to `getComputedStyle` read at mount
  time (memoized).
- **`PositionEditor.tsx`** — render the editor with a sample document in both
  EN and AR locales, screenshot the link state and the error card, swap,
  re-render, re-screenshot. Confirm link hue is now Bureau accent
  (terracotta), error card stays pale-red.

---

## Lint Rule Contract

The two new selectors land in `eslint.config.mjs` under the existing frontend
override block. Both selectors fire on AST `Literal` nodes only — comments stay
untouched (D-08). Both selectors honor the existing `components/ui/**` carve-out
at lines 215–221.

### Selector 1 — Raw hex

```
Literal[value=/#[0-9a-fA-F]{3,8}\b/]
```

| Property             | Value                                                                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fires on             | Any string literal containing a 3 / 4 / 6 / 8-digit hex (`#fff`, `#3B82F6`, `#3B82F6FF`)                                                                                                      |
| Does NOT fire on     | Block / Line comments (CSS `/* #1A1D26 */` and TS `// #fff` are AST Comment nodes)                                                                                                            |
| Scope                | `frontend/**/*.{ts,tsx}` (existing block at line 72)                                                                                                                                          |
| Message              | Cites `CLAUDE.md §Design rules — non-negotiable` ("No raw hex"). Names `var(--accent)` / `text-accent` / etc. as the canonical fix. Single-message-per-rule policy (Phase 48 D-06). No emoji. |
| False-positive shape | Test fixture path literals (e.g. `"#hash-link"` URL fragments) — none observed in the sweep; the regex requires actual hex characters after `#`.                                              |

### Selector 2 — Tailwind palette literal

```
Literal[value=/(?:^|\s)(?:(?:[a-z-]+:)*)(text|bg|border|ring|fill|stroke|from|to|via|outline|divide|placeholder|caret|accent|decoration|shadow)-(red|blue|green|yellow|purple|pink|indigo|cyan|teal|emerald|amber|rose|orange|sky|slate|gray|zinc|neutral|stone|fuchsia|violet|lime)-\d{2,3}\b/]
```

| Property             | Value                                                                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fires on             | Any string literal containing one of 14 utility prefixes paired with one of 21 banned palette names and a 2- or 3-digit shade, with optional variant chain (`dark:`, `hover:`, `md:`, `aria-disabled:`, etc.)      |
| Does NOT fire on     | Token-mapped utilities (`text-ink`, `bg-accent`, `text-success`, `bg-danger/10`) — they target names OUTSIDE the banned palette enumeration                                                                        |
| Scope                | `frontend/**/*.{ts,tsx}` (existing block at line 72)                                                                                                                                                               |
| Message              | Cites `frontend/src/index.css @theme block` + `frontend/src/lib/semantic-colors.ts`. Names canonical swap utilities (`text-danger` / `text-warning` / `text-success` / `text-info` / `text-accent` / `text-ink*`). |
| False-positive shape | Tailwind utilities on token names that happen to share a banned-palette segment substring — none, because the regex anchors on the banned palette enum exactly.                                                    |
| Variant coverage     | `(?:[a-z-]+:)*` catches every chain depth (D-07).                                                                                                                                                                  |

### Allowlist (Tier-B — D-03)

These files keep raw hex / palette literals untouched. Per-file rule override
via `rules: { 'no-restricted-syntax': 'off' }` mirroring the `components/ui/**`
precedent at lines 215–221. **Permanent design statements**, not deferred work.

| File / glob                                                               | Reason for exemption                                                                                                                                                                         |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/design-system/tokens/directions.ts`                         | Token source-of-truth — hex IS the design value. Byte-matches `bootstrap.js`.                                                                                                                |
| `frontend/src/index.css`                                                  | Token `@theme` + `:root` defense-in-depth fallback block. Hex IS the design value.                                                                                                           |
| `frontend/src/styles/modern-nav-tokens.css`                               | Secondary token file (nav-rail). Comments stay (D-08). Hex IS the design value.                                                                                                              |
| `frontend/public/bootstrap.js`                                            | FOUC bootstrap — must byte-match `tokens/directions.ts`. No CSP-incompatible refactor here.                                                                                                  |
| `frontend/src/components/signature-visuals/flags/**/*.{tsx,ts}`           | ISO 3166-1 sovereign flag colors. Heraldic literals, not design tokens.                                                                                                                      |
| `frontend/src/components/analytics/*Chart.tsx`                            | Chart series palettes (no `@theme` chart-palette tokens yet).                                                                                                                                |
| `frontend/src/components/analytics/AnalyticsPreviewOverlay.tsx`           | same                                                                                                                                                                                         |
| `frontend/src/components/dashboard-widgets/ChartWidget.tsx`               | same                                                                                                                                                                                         |
| `frontend/src/components/sla-monitoring/SLAComplianceChart.tsx`           | same                                                                                                                                                                                         |
| `frontend/src/components/stakeholder-influence/InfluenceMetricsPanel.tsx` | same                                                                                                                                                                                         |
| `frontend/src/components/stakeholder-influence/InfluenceReport.tsx`       | same                                                                                                                                                                                         |
| `frontend/src/components/relationships/RelationshipGraph.tsx`             | React-Flow node/edge palette (no `@theme` graph-palette tokens yet).                                                                                                                         |
| `frontend/src/components/dossier/MiniRelationshipGraph.tsx`               | same                                                                                                                                                                                         |
| `frontend/src/components/report-builder/ReportPreview.tsx`                | Chart preview palette                                                                                                                                                                        |
| `frontend/src/lib/semantic-colors.ts`                                     | Centralized Tailwind utility map; uses token-mapped names but contains palette-literal **outputs** that should pass — file is the canonical migration anchor (D-11), not a violation source. |

**Test / fixture allowlist.** Tests live outside `frontend/src` and are not in
the rule scope, so no extra carve-out is needed for `**/tests/**` or `**/__tests__/**`.
The one exception is the deliberate-bad regression fixture
`tools/eslint-fixtures/bad-design-token.tsx`, which is **inside** the rule
scope and **must** fail lint (Phase 50 D-15 pattern; Wave 0 of this phase).

### Deferred (Tier-C)

Every remaining violation lives one per file in `51-DESIGN-AUDIT.md` with a
`eslint-disable-next-line no-restricted-syntax /* Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<filename> */`
annotation in the source. Each row carries a follow-up phase ticket. No bulk
file-top disables. No disables outside Tier-C rows (D-12).

---

## Copywriting Contract

This phase ships no new user-visible copy. The only strings the phase
contributes are:

| Element                                        | Copy                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint rule message — raw hex                  | `Raw hex colors are not allowed in frontend/src. Use a design token (var(--accent), var(--ink), var(--line), …) or a token-mapped Tailwind utility (text-accent, text-ink, border-line). See frontend/src/index.css @theme block and CLAUDE.md §Design rules — non-negotiable.`                                 |
| ESLint rule message — Tailwind palette literal | `Tailwind palette literals (text-blue-*, bg-red-*, border-amber-*, …) are not allowed in frontend/src. Use a token-mapped utility (text-accent, text-danger, text-success, text-warning, text-info, text-ink, bg-surface, border-line) or the semantic-colors.ts map. See frontend/src/index.css @theme block.` |
| Tier-C disable comment template                | `// eslint-disable-next-line no-restricted-syntax /* Phase 51 Tier-C: see 51-DESIGN-AUDIT.md#<filename> */`                                                                                                                                                                                                     |
| Smoke PR title                                 | `chore(51-smoke): verify Lint blocks raw palette literal` (do not merge)                                                                                                                                                                                                                                        |
| Smoke PR body                                  | `Smoke PR for Phase 51 DESIGN-04. Injects a deliberate bg-red-500 violation into <route-level component>. Expected: Lint job fails; mergeStateStatus=BLOCKED. Close without merge.`                                                                                                                             |

Voice guardrails (apply to ESLint messages too — CLAUDE.md §"No marketing voice"):

- No emoji.
- No exclamation marks.
- No first-person plural ("we").
- Sentence case.
- Verb + noun for actions; never "Easily fix" / "Just swap".

No empty states, error states, destructive confirmations, or CTAs are added in
this phase. The two anchor components (`WorldMapVisualization`, `PositionEditor`)
retain their existing copy verbatim; only colors change.

---

## Registry Safety

| Registry                       | Blocks Used                                                        | Safety Gate                                                                       |
| ------------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| shadcn official                | none                                                               | not applicable — shadcn defaults banned per CLAUDE.md §Component Library Strategy |
| Third-party (Aceternity, Kibo) | none — banned by `no-restricted-imports` (Phase 48 D-05 / LINT-08) | not applicable                                                                    |

No third-party registry pull in this phase. No new components imported. No
vetting gate triggered.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — only ESLint rule messages introduced; no UI copy changes
- [ ] Dimension 2 Visuals: PASS — Tier-A swaps verified at Bureau-light 1280px and RTL with Tajawal
- [ ] Dimension 3 Color: PASS — every swap routes through the `@theme` token map or `getComputedStyle(--accent)`; zero raw hex outside Tier-B
- [ ] Dimension 4 Typography: PASS — no typography changes
- [ ] Dimension 5 Spacing: PASS — no spacing changes
- [ ] Dimension 6 Registry Safety: PASS — no registry pull; banned libraries remain banned

**Approval:** pending
