---
version: alpha
name: IntelDossier — Bureau
description: >-
  Foreign-affairs intelligence workspace for senior analysts and directors.
  Restrained, document-forward, hairline-bordered. Bureau is the default of
  four interchangeable directions (Bureau, Chancery, Situation, Ministerial)
  that share semantic tokens but project distinct personalities.
colors:
  # Surfaces — warm, near-white, never pure white/black
  bg: '#F7F6F4'
  surface: '#FFFFFF'
  surface-raised: '#FFFFFF'
  sidebar-bg: '#FFFFFF'
  sidebar-ink: '#2A2520'

  # Ink — strict 3-step ramp; primary text is ink, never #000
  ink: '#1A1714'
  ink-mute: '#6B6459'
  ink-faint: '#9A9082'

  # Lines — visible card edges + softer inner dividers
  line: '#E8E4DC'
  line-soft: '#EFECE3'

  # Accent (Bureau hue 32 — institutional terracotta)
  # Hue is the brand's only tunable color knob. Other directions
  # rotate this hue (Chancery 22, Situation 190, Ministerial 158).
  primary: '#C46A44' # var(--accent)        oklch(58% 0.14 32)
  primary-ink: '#8E3D1D' # var(--accent-ink)    oklch(42% 0.15 32)
  primary-soft: '#F4E0D2' # var(--accent-soft)   oklch(92% 0.05 32)
  on-primary: '#FCFAF8' # var(--accent-fg)     oklch(99% 0.01 32)

  # Semantic — paired solid + soft. Solids hit AA on white;
  # softs are chip / banner backgrounds.
  danger: '#B8392A' # oklch(52% 0.18 25)
  danger-soft: '#F7DDD8' # oklch(95% 0.04 25)
  warn: '#B88420' # oklch(62% 0.14 75)
  warn-soft: '#F4E5C9' # oklch(95% 0.05 75)
  ok: '#2E7A55' # oklch(52% 0.12 155)
  ok-soft: '#D9ECDD' # oklch(94% 0.04 155)
  info: '#2862A8' # oklch(50% 0.14 230)
  info-soft: '#D6E2EF' # oklch(94% 0.04 230)

  # SLA palette (donuts, legends, status rules)
  sla-ok: '{colors.primary}'
  sla-ok-soft: '{colors.primary-soft}'
  sla-risk: '#A78338' # accent + 55° hue shift
  sla-risk-soft: '#EDE2C7'
  sla-bad: '#B5331E'
  sla-bad-soft: '#F4D8D2'

typography:
  # Display = body in Bureau. Other directions diverge:
  # Chancery → Fraunces, Situation → Space Grotesk, Ministerial → Public Sans.
  page-title:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: 600
    letterSpacing: -0.02em
    lineHeight: 1.1
  card-title:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 600
    letterSpacing: -0.005em
    lineHeight: 1.35
  kpi-value:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: 600
    letterSpacing: -0.02em
    lineHeight: 1.1
    fontVariation: "'opsz' 28"
  body:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  body-strong:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.5
  meta:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  label:
    # Uppercase, wide-tracked. Used for column headers, kicker labels.
    fontFamily: Inter
    fontSize: 10.5px
    fontWeight: 600
    letterSpacing: 0.1em
    lineHeight: 1.2
  ribbon:
    # Classification banners only — never general UI text.
    fontFamily: JetBrains Mono
    fontSize: 10.5px
    fontWeight: 600
    letterSpacing: 0.15em
    lineHeight: 1
  mono-small:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: 500
    fontFeature: "'tnum' on, 'cv11' on"
  mono-tiny:
    # Digest tags, ribbons, T-relative SLA windows (T-3 / T+2).
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: 500
    letterSpacing: 0.04em
    fontFeature: "'tnum' on"

rounded:
  # Bureau is the most rounded of the four directions (8/12/16).
  # Chancery flattens to 2px; Situation 2/3/4; Ministerial 6/10/14.
  none: 0px
  sm: 8px
  md: 12px
  lg: 16px
  pill: 999px

spacing:
  # 4-px grid. No aliases — use raw scale steps.
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  '8': 32px
  '10': 40px
  '12': 48px
  # Density tokens — three modes selectable at runtime.
  row-comfortable: 52px
  row-compact: 40px
  row-dense: 32px
  pad-comfortable: 20px
  pad-compact: 14px
  pad-dense: 10px

components:
  # ── Buttons ─────────────────────────────────────────────
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.body-strong}'
    rounded: '{rounded.sm}'
    padding: 8px 16px
    height: 36px
  button-primary-hover:
    backgroundColor: '#B0593A' # color-mix(ink 12%, primary)
    textColor: '{colors.on-primary}'
  button-primary-active:
    backgroundColor: '#974C32' # color-mix(ink 22%, primary)
    textColor: '{colors.on-primary}'
  button-ghost:
    backgroundColor: transparent
    textColor: '{colors.ink}'
    typography: '{typography.body-strong}'
    rounded: '{rounded.sm}'
    padding: 8px 16px
    height: 36px
  button-ghost-hover:
    backgroundColor: '{colors.line-soft}'
    textColor: '{colors.ink}'
  button-secondary:
    # Border-only — same chrome as ghost but with a hairline
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    typography: '{typography.body-strong}'
    rounded: '{rounded.sm}'
    padding: 8px 16px
    height: 36px

  # ── Cards ───────────────────────────────────────────────
  card:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.md}'
    padding: 20px
    # Border, NOT shadow. See "Elevation & Depth".
  card-hover:
    backgroundColor: '{colors.surface}'
    # No transform / scale; row hover handles list emphasis.

  # ── Form fields ─────────────────────────────────────────
  input:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    typography: '{typography.body}'
    rounded: '{rounded.sm}'
    padding: 8px 12px
    height: 36px
  input-focus:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    # Focus = 2px primary ring outside the 1px line border.

  # ── List rows ───────────────────────────────────────────
  row:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    typography: '{typography.body}'
    height: '{spacing.row-comfortable}'
    padding: 0 20px
  row-hover:
    backgroundColor: '{colors.line-soft}'

  # ── Chips (status, classification) ──────────────────────
  chip:
    backgroundColor: '{colors.line-soft}'
    textColor: '{colors.ink-mute}'
    typography: '{typography.mono-tiny}'
    rounded: '{rounded.pill}'
    padding: 4px 10px
    height: 22px
  chip-accent:
    backgroundColor: '{colors.primary-soft}'
    textColor: '{colors.primary-ink}'
  chip-danger:
    backgroundColor: '{colors.danger-soft}'
    textColor: '{colors.danger}'
  chip-ok:
    backgroundColor: '{colors.ok-soft}'
    textColor: '{colors.ok}'

  # ── Topbar / Sidebar ────────────────────────────────────
  topbar:
    backgroundColor: '{colors.surface}'
    height: 56px
    padding: 10px 20px
  sidebar:
    backgroundColor: '{colors.sidebar-bg}'
    textColor: '{colors.sidebar-ink}'
    width: 256px
    padding: 14px 10px

  # ── Classification ribbon ───────────────────────────────
  ribbon:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.ribbon}'
    padding: 4px 20px
---

## Overview

IntelDossier is a foreign-affairs intelligence workspace — dossiers,
engagements, forums, MoUs, SLA tracking. The reader is a senior analyst
or director. The UI must read like a working document, not a product
landing page.

The visual language is **document-forward, hairline-bordered, and
warm-neutral**. Surfaces are flat. Cards are defined by a single 1px
line and a corner radius — never by drop-shadow. Color is restrained;
a single tunable hue (Bureau default 32°, institutional terracotta)
propagates from buttons through chart strokes to KPI rules and the
SLA on-track slice.

Bureau is the default of four interchangeable directions:

| Direction   | Personality                                        | Hue |
| ----------- | -------------------------------------------------- | --- |
| **Bureau**  | SaaS-clean, document-forward, warm neutrals        | 32  |
| Chancery    | Editorial paper-document, serif-forward (Fraunces) | 22  |
| Situation   | Dense intelligence terminal, mono-first, dark      | 190 |
| Ministerial | Government-formal, restrained sans (Public Sans)   | 158 |

All four share these tokens; only fonts, radii, and accent hue rotate.
**Build for Bureau unless explicitly told otherwise.**

## Colors

The palette is rooted in warm neutrals with a single tunable accent.
Never use raw `#000` or `#FFF`. Inks are warm-tinted. Surfaces are
warm-white.

- **bg (`#F7F6F4`)** — Warm-neutral canvas. The page sits on this; cards
  rise to white above it. Slightly warmer than paper, never cold.
- **surface (`#FFFFFF`)** — Card and topbar fill. The contrast against
  `bg` is what makes a card visible without a shadow.
- **ink (`#1A1714`)** — Primary text and dark UI marks. Warm-tinted
  black. Use for body copy, headings, table values, button labels on
  light surfaces.
- **ink-mute (`#6B6459`)** — Secondary text and icons. Captions, meta
  rows, default icon strokes, table-column headers.
- **ink-faint (`#9A9082`)** — Tertiary text. Uppercase labels, disabled
  states, placeholder text. Never use for content the reader needs to
  parse — only for navigational chrome.
- **line (`#E8E4DC`)** — Hairline borders. Card edges, table rules,
  topbar bottom-edge, sidebar inline-end. Always 1px.
- **line-soft (`#EFECE3`)** — Inner dividers and chip backgrounds.
  Row-hover background. Never strong enough to read as a border.
- **primary (`#C46A44`)** — Accent. The single non-neutral. Used for:
  primary-button fill, focus rings, link underline, KPI delta indicator,
  SLA on-track donut slice, active-nav left-rail. Treat it as the
  brand's only color knob; rotate the hue, never broaden the palette.
- **primary-soft (`#F4E0D2`)** — Accent chip background. Pair with
  `primary-ink` for active/selected affordances (active sidebar item,
  active filter chip).
- **danger / warn / ok / info** — Reserved for status. Never decorative.
  `ok` is _only_ for success confirmations, not for "good news" copy.

### Accent hue propagation

The accent hue (32 in Bureau) flows through:

1. `primary`, `primary-ink`, `primary-soft`, `on-primary`
2. `sla-ok` (donut on-track slice)
3. `sla-risk` (accent + 55° hue shift, lower chroma)
4. Focus rings, link hover underlines, KPI rule color

`sla-bad` is hue-locked to red regardless of accent — safety signals
must not theme.

## Typography

Three roles per direction: **display**, **body**, **mono**. In Bureau,
display and body are the same family (Inter); mono is JetBrains Mono.

- **page-title** (28/600/-0.02em) — Page H1. One per page. Sentence case.
- **card-title** (16/600) — Card and section headers.
- **kpi-value** (36/600) — Dashboard KPI numbers. Tabular numerals.
- **body** (13/400) — Default body, table cells, button labels.
- **body-strong** (13/500) — Emphasis within body, button text.
- **meta** (12/400) — Captions, secondary rows, time-since labels.
- **label** (10.5/600 UPPERCASE +0.1em) — Column headers, kicker labels.
  Use sparingly. Bureau allows label sentence-case where Situation requires
  uppercase; default to uppercase if uncertain.
- **ribbon** (mono 10.5/600 UPPERCASE +0.15em) — Classification banners
  only. Never general UI.
- **mono-small / mono-tiny** — Tabular metrics, T-relative SLA windows
  (`T-3`, `T+2`), keyboard hints (`⌘K`), digest tags.

### RTL fallback

Inter, Fraunces, Space Grotesk, IBM Plex, and Public Sans all lack Arabic
coverage. When `dir="rtl"`, the entire document switches to **Tajawal**,
overriding every direction-specific family. Mono tokens that contain only
Latin-script glyphs (`⌘K`, `T-3`) stay in JetBrains Mono via
`dir="ltr"` isolation spans.

### Voice rules attached to type

- Sentence case for titles and buttons. UPPERCASE only for `label`
  and `ribbon`.
- No marketing voice. Banned: "Discover", "Easily", "Unleash", "you're
  in!", exclamation marks, first-person plural ("we").
- Dates: `Tue 28 Apr` (day-first, no comma). Times: `14:30 GST`.
- SLA windows: `T-3` / `T+2`, mono-formatted, LTR-isolated in Arabic.
- No emoji in user-visible copy. Emoji is permitted only as data input
  (e.g. flag codepoint resolved to a hand-drawn SVG).

## Layout

- **Max page width** 1400px. The product is a desktop analyst workstation;
  optimize for 1280–1400.
- **Sidebar** 256px, full-height, `sidebar-bg` over `bg`, separated by
  a single `line` inline-end border. Collapses to icon-rail at <1024px.
- **Topbar** 56px, full-bleed, `surface` fill, `line` bottom border.
  Holds search, locale, density toggle, notifications.
- **Dashboard grid** 2:1 (main column / rail) at ≥1280px; stacks 1:1
  below.
- **KPI strip** 4-up flush grid divided by 1px `line` rules — _not_
  gaps. Cells share a single border, never independent borders.
- **Density** Three modes selectable at runtime via the tweak panel:
  Comfortable (52/20/16), Compact (40/14/12), Dense (32/10/8).
  Tables and lists obey `--row-h`. Density is a global setting, never
  per-component.
- **Logical properties everywhere.** `margin-inline-start`, `padding-inline-end`,
  `border-inline-end`. The same component flips at `dir="rtl"` without
  re-styling. Never reference `left` / `right` in copy or class names.
- **Mobile is read-only.** Below 768px, hide editing affordances rather
  than shrinking them. Drag-and-drop, kanban, and complex forms degrade
  to view-only.

## Elevation & Depth

IntelDossier rejects the "raised card" idiom. Elevation is expressed
through borders, not shadows.

- **Cards** — `1px solid line` over `surface`, no shadow.
- **Hovered list rows** — Background fades to `line-soft`. Never lift.
- **Drawers and right-rail panels** — The _only_ place where shadow is
  used: `-12px 0 40px rgba(20,18,15,0.15)`. Drawer is `surface-raised`
  with no border on the inline-start edge (the shadow does the work).
- **Popovers / dropdowns** — `1px solid line` + a faint `0 4px 12px
rgba(20,18,15,0.06)`. Use only when the popover overlaps content
  outside the parent card.
- **Modals** — Backdrop is `rgba(0,0,0,0.2)`. No backdrop-filter blur.
  Modal panel is `surface` with `1px solid line`, no shadow.
- **Focus** — 2px ring in `primary`, offset 1px from the element edge.
  Never opacity-only; never glow.

## Shapes

Bureau's radius scale is the most rounded of the four directions:

| Token          | Value | Used on                                      |
| -------------- | ----- | -------------------------------------------- |
| `rounded.sm`   | 8px   | Buttons, inputs, sidebar items, icon buttons |
| `rounded.md`   | 12px  | Cards, modals, drawers, popovers             |
| `rounded.lg`   | 16px  | Hero cards, KPI panels, drawer corners       |
| `rounded.pill` | 999px | Chips, classification pills, avatars         |

**Corner radii must come from the scale.** Never hard-code px values
in component styles. When porting Bureau to other directions, only this
scale changes — Chancery flattens to 2/2/2, Situation 2/3/4, Ministerial
6/10/14.

## Components

The components block in front matter is the source of truth. Highlights:

- **button-primary** is the only filled button. Hover darkens via 12%
  ink mix; active darkens to 22%. No `transform: scale`. No glow.
- **button-ghost** is borderless until hover, when it picks up
  `line-soft`. Use for tertiary actions in card headers.
- **button-secondary** is hairline-bordered. Use for one-of-two equal-weight
  actions in a row.
- **input** focus state replaces the `line` border with a 2px `primary`
  ring; the field itself stays `surface`.
- **chip** comes in four colorways (default, accent, danger, ok). Always
  pill-rounded. Mono-typed for status; sans for human-typed tags.
- **row** obeys `--row-h`. Hover paints `line-soft`. Active selection
  uses a 2px `primary` left rail (`inset-inline-start`).
- **ribbon** is the classification banner. One per page, full-bleed,
  bottom-edge of topbar. Never decorative.

### Iconography

- **Custom SVG set** — 38 glyphs, 20×20 viewBox, **1.5px stroke**,
  round caps and joins, `currentColor` only.
- Domain-specific icons (plane, signal, flag, shield, alert) sit alongside
  primitives (search, bell, cog, chevron-right) in the same stroke weight.
- **No icon libraries.** No Lucide, no Heroicons, no Font Awesome —
  inconsistent stroke widths break the visual rhythm.
- **DossierGlyph** — Each country dossier renders as a circular hand-drawn
  SVG flag (32×32, clipped to circle, 0.8px hairline border at 15% opacity).
  Non-country dossiers (forum, person, organization, topic) get a geometric
  symbol in the same circular frame so list rows align.

### Motion

- **Page transitions** crossfade-only at 220ms with
  `cubic-bezier(0.16, 1, 0.3, 1)` ease-out.
- **Hover transitions** 120ms, ease-out.
- **No bounce, no spring, no scale, no parallax.**
- The only signature motion is the **GlobeSpinner** loader (rotating SVG
  globe). Reserve it for full-page or full-card loading; use skeleton
  shapes for inline content.

## Do's and Don'ts

### Do

- ✅ Use design tokens for every color, radius, and spacing decision.
- ✅ Express elevation through borders. Hairline + corner radius is
  enough to make a card a card.
- ✅ Keep the accent rare. Primary buttons, focus rings, active states,
  KPI delta indicators — that's the budget.
- ✅ Use `primary-soft` + `primary-ink` for selected states. Filled
  primary is too loud for "this row is currently active."
- ✅ Use logical properties (`ms-*`, `pe-*`, `text-start`, `border-inline-end`)
  so RTL works for free.
- ✅ Cite numbers before adjectives. _"42 upcoming engagements this week"_
  not _"You have a busy week ahead!"_
- ✅ Test every screen at 1280px and 1400px. That's where analysts live.

### Don't

- ❌ Don't use raw `#000` or `#FFF`. Inks are warm; surfaces are warm.
- ❌ Don't add drop-shadows to cards. The `1px line` is the elevation.
- ❌ Don't use gradients on backgrounds, buttons, or chart fills.
- ❌ Don't introduce new button variants. Three exist (primary, ghost,
  secondary). If a fourth seems necessary, the layout is wrong.
- ❌ Don't use emoji, exclamation marks, or marketing voice in copy.
- ❌ Don't import icon libraries (Lucide, Heroicons, etc.). Stroke
  inconsistency breaks the system.
- ❌ Don't use `opacity` for hover states. It looks broken at small sizes.
- ❌ Don't build mobile-first. IntelDossier is a desktop analyst tool;
  mobile is a read-only fallback below 768px.
- ❌ Don't say "left panel" or "right rail." Refer to elements by name
  ("filters", "the dossier rail") so the language survives RTL.
- ❌ Don't decorate. Restraint is the brand.
