# IntelDossier Design System

A foreign-affairs intelligence workspace: dossiers, engagements, forums, MoUs, and SLA tracking. The system spans **four interchangeable visual directions** that share semantic tokens and components but project very different personalities — from editorial paper-document (Chancery) to dense intelligence terminal (Situation) to government-formal (Ministerial) to warm SaaS (Bureau, the default).

## Sources

- **Prototype:** `IntelDossier Redesign.html` (root) + `src/` JSX components + `src/app.css`
- **Tokens:** `src/themes.jsx` — direction × theme × density × hue → CSS variables
- **Distilled foundations:** `colors_and_type.css`

## Index

| File | Purpose |
|---|---|
| `README.md` | This file — overview, content fundamentals, visual foundations, iconography, manifest |
| `colors_and_type.css` | Foundational tokens (Bureau light) — copy-paste starting point |
| `SKILL.md` | Cross-compatible skill for Claude Code |
| `src/themes.jsx` | Full token builder — all directions, themes, densities |
| `src/app.css` | Production stylesheet (the prototype) |
| `src/icons.jsx` | 38-glyph stroked icon set |
| `src/glyph.jsx` | DossierGlyph — circular flag system + non-country fallbacks |
| `src/loader.jsx` | GlobeSpinner + GlobeLoader (d3-based) |
| `preview/` | Design-system tab cards (colors, type, spacing, components, brand) |
| `ui_kits/web/` | Click-thru web UI kit |

## Content fundamentals

**Voice.** Restrained, professional, never breezy. The reader is a senior analyst or director — write as a peer, not a tour guide. Avoid product-marketing tropes ("Discover", "Unleash", exclamation marks, "you're in!"). No emoji in copy.

**Examples (from the prototype):**
- Page subtitle: *"42 upcoming engagements this week"* — count first, declarative.
- Empty state: *"No overdue commitments."* — full stop, no encouragement.
- Section header: *"Week ahead"* not "What's Next?"
- Action labels: *"Publish brief"*, *"Mark resolved"*, *"Open dossier"* — verb + noun, no "Quick", no "Easily".

**Casing.** Sentence case for titles and buttons. UPPERCASE only for: classification ribbons, mono labels, situation-direction page-titles, table-column headers.

**Pronouns.** Avoid first-person. Use "you" sparingly, only in onboarding. Reports refer to roles ("the desk officer", "the reviewing director") not names.

**Numbers & dates.** Display dates as `Tue 28 Apr` (day-first, no comma). Times as `14:30 GST`. Monetary not used. SLA windows as `T-3` / `T+2` (T-relative, mono-formatted).

**RTL.** All strings authored to translate cleanly to Arabic. UI elements use logical properties (`margin-inline-start`) so the same component flips on `dir="rtl"` without re-styling. Don't use directional words ("left panel"); refer to elements by name ("filters", "the dossier rail").

## Visual foundations

**Color system.** Hue-driven OKLCH. A single `--accent` hue propagates to buttons, charts, the SLA on-track slice, link states, and KPI rules. Each direction ships a default hue (Bureau 32° terracotta, Chancery 22° warm, Situation 190° cyan, Ministerial 158° green) but the tweak panel lets the user dial any hue 0–360°. Surfaces stay warm (Bureau/Chancery) or cool (Situation) regardless of accent. Never raw black/white — `--ink` is `#1a1714`, `--bg` is `#f7f6f4`.

**Typography.** Per-direction trios:
- Bureau — Inter / Inter / JetBrains Mono (default)
- Chancery — Fraunces (serif display) / Inter / JetBrains Mono — italics live here
- Situation — Space Grotesk / IBM Plex Sans / IBM Plex Mono — uppercase mono headers
- Ministerial — Public Sans / Public Sans / JetBrains Mono

RTL forces Tajawal globally — Fraunces, Plex and Space Grotesk lack Arabic coverage.

**Backgrounds.** Flat, never gradient. Bureau and Chancery use warm off-whites (`#f7f6f4`, `#f7f3ec`). Full-bleed imagery is reserved for engagement hero photos in dossier detail; otherwise no decorative imagery, no patterns, no textures.

**Borders & cards.** Hairline borders carry the layout — `1px solid var(--line)` over flat surface. Cards have only border + corner radius; shadow used only for drawers (`--shadow-lg`) and on hover for list rows. Avoid drop-shadows on cards.

**Corner radii.** Direction-specific shape language: Chancery flattens to 2px (paper-document feel), Situation 2/3/4 (CRT terminal), Ministerial 6/10/14 (formal-soft), Bureau 8/12/16 (SaaS-friendly).

**Animation.** Restrained. Page transitions are crossfade-only at 220ms with `cubic-bezier(0.16, 1, 0.3, 1)` ease-out. No bouncing, no spring. Loaders use the GlobeSpinner (rotating SVG globe) — the brand's only signature motion. Hover transitions are 120ms.

**Hover states.** Buttons: border darkens to `--ink-faint`. Rows: background fades to `--line-soft`. Links: underline appears. Icon buttons: subtle background fill. Never opacity changes — they look broken at small sizes.

**Press states.** Primary buttons darken via `color-mix(in srgb, var(--ink) 85%, var(--accent))` — a tiny accent bleed. No transform/scale.

**Transparency & blur.** Used sparingly. Tweaks panel overlay is `rgba(0,0,0,0.2)` no-blur. Dossier glyph borders are `rgba(0,0,0,0.15)`. No backdrop-filter elsewhere.

**Layout rules.** Max page width 1400px. Sidebar 240px (collapses on tablet). Dashboard is 2:1 grid. KPI strip is 4-up flush grid with `1px` line dividers, not gaps. Sticky topbar 56px tall.

**Density.** Three modes: Comfortable (52px row, 20px pad), Compact (40/14), Dense (32/10). Tables and lists obey `--row-h`. Density is a global tweak, not per-component.

**Imagery vibe.** Photographs of officials/conferences are kept as-is (no overlay tint). Illustrations are not used — we lean on data viz and the dossier glyph system instead.

## Iconography

**Custom inline SVG set** in `src/icons.jsx` — 38 glyphs at 20×20 viewBox, 1.5px stroke, round caps and joins, all `currentColor`. Domain-specific icons (plane, signal, flag, shield, alert) sit alongside primitives (search, bell, cog, chevron-right). No external icon library — keeps the dossier-domain icons consistent in stroke and weight with the UI primitives. RTL flips arrow/chevron via `transform: scaleX(-1)`.

**DossierGlyph** (`src/glyph.jsx`) — the brand's most-used visual element. Each country dossier renders as a circular hand-drawn SVG flag (32×32 viewBox, clipped to circle, 0.8px hairline border at 15% opacity). 24 country flags ship; non-country dossiers (forum, person, organization, topic) get a geometric symbol in the same circular frame so lists align. Flag emoji input (`🇸🇦` etc) is auto-resolved to the SVG via `FLAG_CODE`.

**Emoji** — used only as data-input shorthand (the `flag` field accepts emoji codepoints), never rendered to users.

**No CDN dependency for icons.** Globe loader does pull `d3` + `world-atlas` from unpkg at first mount; spinner variant is pure SVG.

## Caveats

- The four directions share components but their CSS overrides are scattered across `src/app.css` (`.dir-chancery .card`, `.dir-situation .btn-primary` etc). The token system handles colors and shape; per-direction *type & casing* shifts live in CSS, not tokens.
- Flag set is hand-drawn, simplified — not heraldically exact. 24 countries cover all current dossier data; expand `FlagSVG` in `src/glyph.jsx` to add more.
- No dark-mode preview cards yet — the design system tokens support it (set `--theme: dark`) but cards in `preview/` show light only.

---

> **To share this system with your org:** in the Share menu, set the **File type to Design System** so colleagues can browse the cards.
