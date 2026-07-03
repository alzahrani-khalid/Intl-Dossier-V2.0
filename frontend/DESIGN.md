---
version: 1.0
name: IntelDossier — Linear
description: >-
  Foreign-affairs intelligence workspace for senior analysts and directors.
  Restrained, document-forward, hairline-bordered, dark-canonical. The dark
  palette is authored verbatim from the Linear reference (shadcn.io/design/linear);
  the light palette is fully derived from it under dark-canonical discipline and
  WCAG-AA-proven (tests/unit/design-system/contrast.test.ts). Linear is the single
  direction — the accent-hue axis and the four legacy directions were retired in
  Phase 77. This spec supersedes the previous IntelDossier prototype design system.
principles:
  - Dark is canonical; light is DERIVED from the dark design intent and AA-verified — never authored independently.
  - Elevation is expressed through hairline borders + a four-tier surface ladder, never drop-shadows on cards.
  - One accent (#5e6ad2), brand-invariant across modes; color is semantic, never decorative.
  - Corner radii, spacing, and row heights come from tokens only — no hard-coded px.
fonts:
  display: "'Inter Variable', system-ui, sans-serif"
  body: "'Inter Variable', system-ui, sans-serif"
  mono: "'JetBrains Mono Variable', ui-monospace, monospace"
  rtl: Tajawal (400 / 500 / 700) — forced globally on dir="rtl" (Inter has no Arabic coverage)
radius:
  sm: 6px
  base: 8px
  lg: 12px
---

## Overview

IntelDossier is a foreign-affairs intelligence workspace — dossiers,
engagements, forums, MoUs, SLA tracking. The reader is a senior analyst or
director. The UI must read like a working document, not a product landing page.

The visual language is **document-forward, hairline-bordered, and dark-canonical**.
Surfaces are flat. Cards are defined by a single 1px line and a corner radius —
never by drop-shadow. Color is restrained; a single accent (`#5e6ad2`) is the only
non-neutral, brand-invariant across light and dark.

**Linear is the only direction.** The four interchangeable directions and the
tunable accent-hue axis of the previous system were collapsed away in Phase 77.
There is one palette in two modes (dark canonical, light derived), one radius
ladder, and one type stack.

### Dark-canonical discipline

The **dark palette is authoritative** and transcribed verbatim from the Linear
reference. The **light palette is derived** from the dark design intent (only four
values exist verbatim: `#ffffff`, `#f5f6f6`, `#f6f7f7`, `#000000`) and every
text-role value is WCAG-AA-proven on both `surface` and its own soft wash. All
values below are the shipped literals from
`frontend/src/design-system/tokens/directions.ts` (`PALETTES.linear`) — the single
source, byte-matched into two other copies (see **Engine contract**). Never invent
a value; transcribe from that file.

## Dark tokens (canonical)

Core surfaces / ink / lines. `surface` is `#0f1011` (surface-1); ink contrast on
`bg` is 19.61:1.

| Token              | Value     | Origin   | Notes                                      |
| ------------------ | --------- | -------- | ------------------------------------------ |
| `--bg`             | `#010102` | verbatim | canvas — 19.61:1 ink contrast              |
| `--surface`        | `#0f1011` | verbatim | surface-1 — cards, topbar                  |
| `--surface-raised` | `#141516` | verbatim | surface-2                                  |
| `--surface-3`      | `#18191a` | verbatim | popovers / menus                           |
| `--surface-4`      | `#191a1b` | verbatim | drawers / modals / elevated overlays       |
| `--ink`            | `#f7f8f8` | verbatim | primary text                               |
| `--ink-mute`       | `#d0d6e0` | verbatim | secondary text                             |
| `--ink-faint`      | `#8a8f98` | verbatim | tertiary text — 5.86:1 on surface-1        |
| `--ink-tertiary`   | `#62666d` | verbatim | faintest chrome — not AA-gated             |
| `--line`           | `#23252a` | verbatim | hairline border                            |
| `--line-soft`      | `#1d1e21` | DERIVED  | softer inner divider than `--line`         |
| `--line-strong`    | `#34343a` | verbatim | emphasis hairline (Linear hairline-strong) |
| `--sidebar-bg`     | `#0f1011` | DERIVED  | surface-1                                  |
| `--sidebar-ink`    | `#d0d6e0` | DERIVED  | 13.0:1 on sidebar                          |

Accent family — brand-invariant `base`/`hover`/`fg` across modes:

| Token            | Value     | Origin   | Notes                             |
| ---------------- | --------- | -------- | --------------------------------- |
| `--accent`       | `#5e6ad2` | verbatim | primary — the single non-neutral  |
| `--accent-hover` | `#828fff` | verbatim | primary-button hover              |
| `--accent-fg`    | `#ffffff` | verbatim | on-primary — 4.70:1 on `--accent` |
| `--accent-soft`  | `#5e69d1` | verbatim | primary-focus                     |
| `--accent-ink`   | `#98a6ea` | DERIVED  | accent-tinted text, AA on surface |

Semantic — solid + soft pairs. Ratios are on `surface` / on own `-soft`:

| Role   | fg        | soft      | on surface | on soft | Origin             |
| ------ | --------- | --------- | ---------- | ------- | ------------------ |
| danger | `#e86154` | `#3c1713` | 5.69       | 4.73    | DERIVED (h28)      |
| warn   | `#e1af4a` | `#302103` | 9.46       | 7.76    | DERIVED (h82)      |
| ok     | `#27a644` | `#102b17` | 6.01       | 4.80    | verbatim (success) |
| info   | `#66a0ee` | `#0f2440` | 7.10       | 5.81    | DERIVED (h256)     |

SLA family (donuts / legends / status rules), derived in the accent band:

| Role | fg        | soft      | Origin                |
| ---- | --------- | --------- | --------------------- |
| ok   | `#8998e9` | `#1c2141` | DERIVED (accent h275) |
| risk | `#e1af4a` | `#302103` | DERIVED (amber h82)   |
| bad  | `#e86154` | `#3c1713` | DERIVED (red h28)     |

Status-tag palette — six pairs. All clear AA on surface (8.10–8.97) and on their
own soft (6.74–7.15):

| #   | Hue           | fg        | soft      |
| --- | ------------- | --------- | --------- |
| 1   | indigo (264)  | `#87adfa` | `#16233f` |
| 2   | cyan (200)    | `#2ac4cc` | `#002c2e` |
| 3   | green (155)   | `#6ac48c` | `#082c18` |
| 4   | amber (90)    | `#cbaa4b` | `#2e2200` |
| 5   | orange (35)   | `#ef9179` | `#3a1911` |
| 6   | magenta (330) | `#d991d2` | `#331931` |

## Light tokens (derived, AA-verified)

Only four values are verbatim (`bg`, `surface`, `surface-raised`, `ink`); the rest
are derived from the dark intent and contrast-proven.

| Token              | Value     | Origin   | Notes                                 |
| ------------------ | --------- | -------- | ------------------------------------- |
| `--bg`             | `#ffffff` | verbatim | inverse-canvas                        |
| `--surface`        | `#f5f6f6` | verbatim | inverse-surface-1                     |
| `--surface-raised` | `#f6f7f7` | verbatim | inverse-surface-2                     |
| `--surface-3`      | `#eff0f2` | DERIVED  | popovers / menus                      |
| `--surface-4`      | `#e6e8eb` | DERIVED  | drawers / modals                      |
| `--ink`            | `#000000` | verbatim | inverse-ink                           |
| `--ink-mute`       | `#4f5359` | DERIVED  | 7.15:1 on surface, AA on bg + surface |
| `--ink-faint`      | `#656970` | DERIVED  | 5.09:1 on surface                     |
| `--ink-tertiary`   | `#83868e` | DERIVED  | faintest — not AA-gated               |
| `--line`           | `#dddee1` | DERIVED  | hairline border                       |
| `--line-soft`      | `#eaebed` | DERIVED  | softer than `--line`                  |
| `--line-strong`    | `#ccced1` | DERIVED  | emphasis hairline — not AA-gated      |
| `--sidebar-bg`     | `#f5f6f6` | DERIVED  |                                       |
| `--sidebar-ink`    | `#14161a` | DERIVED  |                                       |

Accent family (light):

| Token            | Value     | Origin   | Notes                                  |
| ---------------- | --------- | -------- | -------------------------------------- |
| `--accent`       | `#5e6ad2` | verbatim | brand-invariant across modes           |
| `--accent-hover` | `#828fff` | verbatim | brand-invariant                        |
| `--accent-fg`    | `#ffffff` | verbatim | 4.70:1 on `--accent`                   |
| `--accent-soft`  | `#e8edff` | DERIVED  | pale accent wash                       |
| `--accent-ink`   | `#4d57b7` | DERIVED  | accent-tinted dark text, AA on surface |

Semantic (light) — ratios on `surface` / on own `-soft`:

| Role   | fg        | soft      | on surface | on soft | Origin         |
| ------ | --------- | --------- | ---------- | ------- | -------------- |
| danger | `#be241f` | `#ffeae6` | 5.60       | 5.25    | DERIVED (h28)  |
| warn   | `#8c5500` | `#fceed6` | 5.68       | 5.37    | DERIVED (h72)  |
| ok     | `#137738` | `#e4f6e6` | 5.21       | 5.00    | DERIVED (h150) |
| info   | `#1664bf` | `#e4f1ff` | 5.37       | 5.08    | DERIVED (h256) |

SLA family (light):

| Role | fg        | soft      | Origin                |
| ---- | --------- | --------- | --------------------- |
| ok   | `#4d57b7` | `#eaefff` | DERIVED (accent h275) |
| risk | `#8c5500` | `#fceed6` | DERIVED (amber h72)   |
| bad  | `#be241f` | `#ffeae6` | DERIVED (red h28)     |

Status-tag palette (light) — six pairs. AA on surface (5.18–6.56) and on soft
(4.98–6.14):

| #   | Hue           | fg        | soft      |
| --- | ------------- | --------- | --------- |
| 1   | indigo (264)  | `#3458ac` | `#e6f1ff` |
| 2   | cyan (200)    | `#00737c` | `#daf7f8` |
| 3   | green (155)   | `#007338` | `#e1f7e7` |
| 4   | amber (90)    | `#7c5700` | `#f8f0da` |
| 5   | orange (35)   | `#9d381f` | `#ffeae3` |
| 6   | magenta (330) | `#873a82` | `#fce9fa` |

## Hairline mapping decision

The Linear reference names two hairlines — `hairline` and `hairline-strong`. The
engine consumes `--line-soft` everywhere as the _softer_ inner divider, so a literal
STACK.md mapping (`--line-soft: #34343a`) would invert the semantic. Resolution
(shipped in Phase 77-03):

- `--line` = hairline `#23252a` (verbatim).
- `--line-soft` = a **DERIVED** value perceptibly softer than `--line`
  (`#1d1e21` dark / `#eaebed` light).
- The verbatim hairline-strong `#34343a` lands as the **`--line-strong`** tier
  (emphasis hairline), NOT `--line-soft`.

All verbatim reference values still ship; only the _name_ they map to changed.

## Reserved (unmapped verbatim extras)

Present in the Linear reference but not yet emitted as tokens (no consumer). Record
here so a future consumer maps them consistently rather than re-deriving:

- `hairline-tertiary` `#3e3e44`
- `semantic-overlay` `#000000` (modal scrim)
- `brand-secure` `#7a7fad`

## Typography

Three roles: **display**, **body**, **mono**. Display and body are the same family.

- **display / body** — `'Inter Variable'` (self-hosted `@fontsource-variable`).
- **mono** — `'JetBrains Mono Variable'` — tabular metrics, T-relative SLA windows
  (`T-3`, `T+2`), keyboard hints (`⌘K`).

**Registered-family names are load-bearing.** The exact strings `'Inter Variable'`
and `'JetBrains Mono Variable'` are the `@fontsource-variable` registered families —
plain `'Inter'` / `'JetBrains Mono'` are NOT the variable-font families and fall
back silently to `system-ui`. The `FONTS.linear` triplet is:

- display: `'Inter Variable', system-ui, sans-serif`
- body: `'Inter Variable', system-ui, sans-serif`
- mono: `'JetBrains Mono Variable', ui-monospace, monospace`

### RTL cascade

Inter has no Arabic coverage. When `dir="rtl"`, the entire document switches to
**Tajawal** (weights 400 / 500 / 700), overriding the Latin display/body families.
Mono tokens containing only Latin glyphs (`⌘K`, `T-3`) stay in JetBrains Mono via
`dir="ltr"` isolation spans.

### Voice rules attached to type

- Sentence case for titles and buttons. UPPERCASE only for classification ribbons,
  mono labels, and table-column headers.
- No marketing voice. Banned: "Discover", "Easily", "Unleash", "you're in!",
  exclamation marks, first-person plural ("we").
- Dates: `Tue 28 Apr` (day-first, no comma). Times: `14:30 GST`.
- SLA windows: `T-3` / `T+2`, mono-formatted, LTR-isolated in Arabic.
- No emoji in user-visible copy. Emoji is permitted only as data input (e.g. a flag
  codepoint resolved to an SVG).

## Radius

Three tiers, token-driven — no hard-coded px corners:

| Token         | Value | Used on                              |
| ------------- | ----- | ------------------------------------ |
| `--radius-sm` | 6px   | buttons, inputs, chips, icon buttons |
| `--radius`    | 8px   | cards, menus, popovers               |
| `--radius-lg` | 12px  | modals, drawers, KPI panels          |

The Linear reference defines a fuller radius ladder; the engine wires only these
three tiers (density-invariant). Add a tier by extending `radius` in
`directions.ts` and the two mirrored copies, not by hard-coding px.

## Recipe rules (as shipped in Phase 77-06)

The primitive recipes live in `src/index.css` (`@layer`) and the effective
overrides in `src/styles/list-pages.css`:

- **Flat surfaces.** `--shadow-card` is `none`. Cards are `1px solid var(--line)`
  over `--surface`, no shadow. Shadow is reserved for drawers
  (`--shadow-drawer` / `--shadow-lg`) and hovered list rows.
- **Hairline borders.** `1px solid var(--line)`; `var(--line-strong)` for emphasis.
- **Surface ladder.** Cards on `--surface`; popovers / menus on `--surface-3`
  (`--color-popover`); drawers / modals on `--surface-4`.
- **Token radii.** `.card` → `--radius-lg`, `.btn` / `.id-input` → `--radius`.
  No hard-coded px.
- **Primary button.** `.btn-primary` fills `--accent`; hover → `var(--accent-hover)`
  (`#828fff`), not a color-mix-toward-black. No `transform: scale`, no glow.
- **Focus.** A ring in `--accent` (`--focus-ring`), never opacity-only.
- **Soft washes** use opacity modifiers on the base token (`bg-warn/10`, `bg-ok/10`)
  — the `--*-soft` values are palette tokens, not exposed `@theme` utilities.
- Buttons: three variants only (`.btn-primary`, `.btn-ghost`, `.btn-secondary`).
  Do not add a fourth without an explicit ask.

## Engine contract

- **Three byte-matched copies.** The palette/font literals live in
  `tokens/directions.ts` (`PALETTES.linear` / `FONTS.linear`),
  `public/bootstrap.js` (the ES5 first-paint table), and the `src/index.css`
  `:root` fallback. `scripts/check-bootstrap-parity.mjs` fails the build on any
  divergence, in `pnpm lint` and CI. Change all three in the same edit.
- **Coercion (load-bearing migration).** Any persisted `id.dir !== 'linear'` is
  coerced to `'linear'` in BOTH the bootstrap (first paint) and `DesignProvider`
  (runtime), with a try-guarded one-time write-back; the retired `id.hue` key is
  removed on the same pass. The old per-direction fallback is gone — without
  coercion a stale `id.dir` would paint a first frame with no tokens.
- **Dark is the default mode** (Linear-canonical). An explicitly persisted
  `id.theme="light"` is preserved; anything else resolves to dark.
- **How tokens reach Tailwind.** The Tailwind v4 `@theme` block in `src/index.css`
  maps `--color-*` to the runtime `var(--*)` tokens, so `bg-surface-3`,
  `border-line-strong`, `bg-accent-hover`, `text-status-1`, `text-danger`, etc.
  resolve to live tokens.

## Elevation & depth

Elevation is expressed through borders, not shadows.

- **Cards** — `1px solid var(--line)` over `--surface`, no shadow.
- **Hovered list rows** — background fades to `--line-soft`. Never lift.
- **Drawers / right-rail panels** — the only place shadow is used
  (`--shadow-drawer`). Surface `--surface-4`.
- **Popovers / menus** — `--surface-3` + `1px solid var(--line)`.
- **Modals** — `--surface-4`, `1px solid var(--line)`, backdrop scrim, no blur.
- **Focus** — a ring in `--accent`; never opacity-only, never glow.

## Do's and Don'ts

### Do

- Use design tokens for every color, radius, and spacing decision.
- Express elevation through hairline borders + the surface ladder.
- Keep the accent rare — primary buttons, focus rings, active states, KPI deltas.
- Use logical properties (`ms-*`, `pe-*`, `text-start`, `border-inline-end`) so RTL
  works for free.
- Cite numbers before adjectives. Test every screen at 1024px and 1400px.

### Don't

- Don't use raw hex or Tailwind palette literals (`text-blue-500`) — ESLint errors.
- Don't add drop-shadows to cards. The `1px` line is the elevation.
- Don't use gradients on backgrounds, buttons, or chart fills.
- Don't introduce new button variants beyond the three that exist.
- Don't reintroduce a non-`linear` direction default or the accent-hue axis.
- Don't hand-edit one of the three token copies without the other two.
- Don't use emoji, exclamation marks, or marketing voice in copy.
