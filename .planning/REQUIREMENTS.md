# Requirements: Intl-Dossier v6.0 — Design System Adoption

**Defined:** 2026-04-19
**Core Value:** Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.

**Milestone goal:** Adopt the Claude Design handoff as the system-wide visual language — four design directions (Chancery / Situation Room / Ministerial / Bureau) × light/dark × accent hue × density — replacing the existing theme list, rebuilding the shell chrome, and rebuilding the dashboard pixel-exact to the reference.

**Handoff bundle:** `/tmp/inteldossier-handoff/inteldossier/`
**Primary reference:** `project/IntelDossier Redesign.html` + `project/reference/*.png`

---

## v1 Requirements

Requirements for this milestone. Every requirement maps to exactly one roadmap phase.

### Token Engine (TOKEN)

- [ ] **TOKEN-01**: User can switch between Chancery, Situation Room, Ministerial, and Bureau design directions and every surface/ink/accent/line/sidebar token on `:root` updates live without reload
- [ ] **TOKEN-02**: User can toggle light/dark mode within each direction and OKLCH accent math recomputes correctly (accent-ink flips lightness, accent-soft flips chroma, danger/ok/warn/info use dark-variant lightness values)
- [ ] **TOKEN-03**: User can pick any accent hue (0–360°) and `--accent`, `--accent-ink`, `--accent-soft`, `--accent-fg`, `--sla-ok`, and `--sla-risk` (accent+55° warm shift) recompute; `--sla-bad` stays hue-locked red
- [ ] **TOKEN-04**: User can choose comfortable / compact / dense density and `--row-h`, `--pad`, `--gap` tokens update (52/20/16 → 40/14/12 → 32/10/8)
- [ ] **TOKEN-05**: HeroUI v3 components (Button, Card, Chip, Modal, Skeleton, TextField, Switch, Checkbox) inherit the new tokens via `@heroui/styles` (accent → primary, danger/ok/warn/info → semantic) without per-component overrides
- [ ] **TOKEN-06**: Tailwind v4 utility classes (`bg-surface`, `text-accent`, `border-line`, `bg-accent-soft`, etc.) resolve to the active direction+mode+hue via `@theme` bridge

### Tweaks Drawer (THEME)

- [x] **THEME-01
      **: User can open a Tweaks drawer from a topbar button and see Direction, Mode, Hue, Density, Classification, and Locale controls in a single panel
- [ ] **THEME-02**: User's direction, mode, hue, density, classification, and locale selections persist across sessions via `localStorage` keys (`id.dir`, `id.theme`, `id.hue`, `id.density`, `id.classif`, `id.locale`)
- [ ] **THEME-03**: Changing direction automatically resets mode and hue to that direction's defaults (Chancery=light/22°, Situation=dark/190°, Ministerial=light/158°, Bureau=light/32°)
- [ ] **THEME-04**: The existing `/themes` route redirects to `/` and `pages/Themes.tsx` + `components/theme-selector/ThemeSelector.tsx` are removed; no references to the old theme list remain in the codebase

### Typography (TYPO)

- [ ] **TYPO-01**: User sees the correct display + body + mono fonts per direction (Chancery: Fraunces/Inter/JetBrains Mono, Situation: Space Grotesk/IBM Plex Sans/IBM Plex Mono, Ministerial: Public Sans/Public Sans/JetBrains Mono, Bureau: Inter/Inter/JetBrains Mono)
- [ ] **TYPO-02**: All six Latin fonts plus Tajawal load self-hosted via `@fontsource/*` with weights 400/500/600/700 (display + body) and 400/500 (mono); no Google Fonts CDN calls
- [ ] **TYPO-03**: When locale is Arabic (RTL), every display-font element and all chip/label classes render in Tajawal (override rules from `project/src/app.css` preserved verbatim, including `[style*="--font-display"]` selectors)
- [ ] **TYPO-04**: Mono spans explicitly marked `[dir="ltr"]` inside RTL containers keep JetBrains Mono (e.g. `⌘K`, `T−3`, `+2`, dates in `DD MMM` format)

### Shell Chrome (SHELL)

- [ ] **SHELL-01**: User sees a 256px sidebar with brand mark + app name + workspace + user card + three nav sections (Operations / Dossiers / Admin) + footer, with a 2px accent bar on the active item using `inset-inline-start:0`
- [ ] **SHELL-02**: User sees a 56px topbar with search pill + `⌘K` kbd hint, direction switcher (4 buttons), bell+badge, theme toggle (sun/moon), locale toggle (EN/ع), and Tweaks button
- [ ] **SHELL-03**: User sees a direction-specific classification element above main content (Chancery: marginalia italics, Situation: full-width ribbon bar, Ministerial/Bureau: chip pill) showing workspace + classification level + session info
- [ ] **SHELL-04**: At ≤1024px the sidebar becomes an overlay drawer (280px wide, backdrop, `translateX(-100%)` off-canvas); at ≤640px the topbar wraps and the drawer goes full-screen; RTL flips the drawer slide direction to `translateX(100%)`
- [ ] **SHELL-05**: Sidebar brand mark uses the real `GASTAT_LOGO.svg` from `handoff/project/reference/`, sized 22×22 and tinted via `currentColor` in the accent color

### Signature Visual Primitives (VIZ)

- [ ] **VIZ-01**: User sees a `<GlobeLoader>` (orthographic d3-geo projection, topojson countries-110m, 16°/sec rotation on -18° tilt, three concentric whirl rings at 3.2s / 5.5s / 8s, pulsing halo) as a 1.6s startup splash
- [ ] **VIZ-02**: Developer can call `window.__showGlobeLoader(ms)` or mount `<FullscreenLoader>` to re-trigger the globe splash; backdrop uses `color-mix(in srgb, var(--bg) 82%, transparent)` + `backdrop-filter: blur(3px)`
- [ ] **VIZ-03**: Buttons, load-more rows, and the digest refresh show an inline `<GlobeSpinner>` (40×40 SVG, 1.4s whirl arc + 2.8s reverse stylized globe), inheriting `currentColor` so it tints with text
- [ ] **VIZ-04**: Developer can render `<DossierGlyph>` resolving one of 24 hand-drawn flag SVGs (SA, AE, ID, EG, QA, JO, BH, OM, KW, PK, MA, TR, CN, IT, FR, DE, GB, US, JP, KR, IN, BR, EU, UN) clipped to a circle with a 1px `rgba(0,0,0,0.15)` hairline; non-country dossier types fall back to symbol glyphs (forum ◇, person ●, topic ◆, organization ▲) in soft-tinted circles
- [ ] **VIZ-05**: Developer can render `<Sparkline data={…}>` (80×22 polyline, min-max normalized, trailing dot at latest point, flipped via `scaleX(-1)` in RTL) and `<Donut value={…} variants={[ok,risk,bad]}>` (stacked `strokeDasharray` segments with center pill showing percentage)

### Dashboard (DASH) — pixel-exact to `reference/dashboard.png`

- [ ] **DASH-01**: User sees a `KpiStrip` of 4 cards (active engagements / open commitments / SLA at risk / week ahead), each with value + delta + meta; the third card has an accent top-bar
- [ ] **DASH-02**: User sees a `WeekAhead` widget grouped by day/date/time with title + glyph + counterpart + location + status chips + brief chip per entry
- [ ] **DASH-03**: User sees an `OverdueCommitments` widget grouped by dossier with expand toggle, severity dots, mono days-overdue, and owner initials
- [ ] **DASH-04**: User sees a `Digest` widget with tag + headline + source + animated refresh button (shows `<GlobeSpinner>` overlay during refresh)
- [ ] **DASH-05**: User sees a `SlaHealth` widget combining a Tajawal-style Donut + legend + 14-day Sparkline
- [ ] **DASH-06**: User sees a `VipVisits` widget with T−N countdown + name + role + when
- [ ] **DASH-07**: User sees a `MyTasks` widget with checkbox + glyph + title + due chip per row
- [ ] **DASH-08**: User sees `RecentDossiers` + `ForumsStrip` (showing 4 of 8 forums with monogram short-code chips)
- [ ] **DASH-09**: All 8 dashboard widgets wire to existing domain hooks (`useDashboardStats`, `useDashboardTrends`, `useWeekAhead`/equivalent, `usePersonalCommitments`, `useMyTasks`, `useRecentDossiers`, `useForums`, etc.) with no mock or placeholder data

### Kanban + Calendar (BOARD)

- [ ] **BOARD-01**: User sees a horizontal-scroll kanban with columns rendering header (title + count + add button) + `kcard`s showing kind chip, priority chip, title, glyph+dossier, mono due date, and avatar owner
- [ ] **BOARD-02**: Overdue kanban cards show `border-inline-start: 3px solid var(--danger)`; done cards render at `opacity: 0.55`
- [ ] **BOARD-03**: User sees a 7×5 calendar grid with 1px divider lines on `--line` background, day-of-week header row, day number + stacked event pills per cell (default / `.travel` warn-soft / `.pending` line-soft), and an accent-colored day number on today

### List Pages (LIST)

- [ ] **LIST-01**: User sees Countries and Organizations tables with `DossierGlyph` + EN/AR names + engagement count + last-touch + sensitivity chip + chevron; chevron flips via `scaleX(-1)` in RTL
- [ ] **LIST-02**: User sees the Persons page as a grid of cards (44px circular initial avatar + name + glyph + VIP chip + role + org)
- [ ] **LIST-03**: User sees Forums, Topics, and Working-Groups as list rows with name + meta + status chip (shared `GenericListPage` component)
- [ ] **LIST-04**: User sees the Engagements page with search input + filter pills (All / Confirmed / Travel / Pending), week-list rendering, and a load-more row showing `<GlobeSpinner>` + "Loading more engagements…"

### Dossier Drawer + Detail (DRAWER)

- [ ] **DRAWER-01**: User can open a 720px dossier drawer that slides in from the inline-end edge with a backdrop and `-24px 0 60px rgba(0,0,0,.25)` shadow
- [ ] **DRAWER-02**: Drawer shows sticky head (DOSSIER + CONFIDENTIAL chips, display-font title, meta strip, CTA row with Log Engagement / Brief / Follow), mini-KPI strip (engagements / commitments / overdue / documents), italic-serif summary paragraph, Upcoming list, Recent Activity, and Open Commitments
- [ ] **DRAWER-03**: Drawer flips to slide from inline-start in RTL and goes full-screen at ≤640px with correct focus trap and ESC dismissal

### Remaining Pages (PAGE)

- [ ] **PAGE-01**: User sees the Briefs page as a responsive card grid (`repeat(auto-fill, minmax(320px, 1fr))`) with status chip (ready/draft/review/awaiting) + page count + serif title + author/due
- [ ] **PAGE-02**: User sees the After-actions page as a table of engagement title / date / dossier chip / decisions count / commitments count
- [ ] **PAGE-03**: User sees the Tasks ("My desk") page as a card list with checkbox, glyph, title+subtitle, priority chip, and due column
- [ ] **PAGE-04**: User sees the Activity page as a timeline rendering `time · icon · "who action what in where"` with `where` in accent-ink
- [ ] **PAGE-05**: User sees the Settings page as a two-column layout (240px vertical nav with active accent bar + content card with edit-row list)

### Quality Assurance Sweep (QA)

- [ ] **QA-01**: Every v6.0 page renders correctly in both locales (EN/LTR + AR/RTL) using logical properties only; `eslint-plugin-rtl-friendly` reports zero violations of `ml-*/mr-*/pl-*/pr-*/left-*/right-*/text-left/text-right/rounded-l-*/rounded-r-*`
- [ ] **QA-02**: Every v6.0 page is keyboard navigable end-to-end, passes axe-core WCAG AA with zero violations, and preserves focus outlines under all four directions + both modes
- [ ] **QA-03**: Every v6.0 page layout is correct at 320 / 640 / 768 / 1024 / 1280 / 1536 breakpoints with 44×44px minimum touch targets on all interactive elements
- [ ] **QA-04**: Directional icons (`arrow-right`, `arrow-up-right`, `chevron-right`, `chevron-left`, `.icon-flip`) flip via `scaleX(-1)` in RTL; sparkline polylines also flip; mirrored icon set documented in `docs/rtl-icons.md`

---

## Future Requirements

Deferred; tracked but not in this milestone's roadmap.

### Additional themes

- **TOKEN-FUT-01**: Add a fifth "Embassy" direction with oxblood accents + serif display (Garamond) for archival browsing
- **TOKEN-FUT-02**: System-follow mode that tracks OS `prefers-color-scheme` per direction

### Motion & micro-interactions

- **MOTION-FUT-01**: Optional spring-physics transitions (Motion One) on drawer open / card hover / KPI value changes
- **MOTION-FUT-02**: Reduced-motion respect (`prefers-reduced-motion: reduce`) to disable globe rotation and inline spinners

### Advanced customization

- **THEME-FUT-01**: User can save and share named theme presets (e.g. "Ministerial/Dark/Oxblood/Compact") via shareable URLs
- **THEME-FUT-02**: Per-workspace theme defaults set by admin

---

## Out of Scope

Explicitly excluded from v6.0; documented to prevent scope creep.

| Feature                                             | Reason                                                                                         |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Migrating existing themes (e.g. v5.0 theme presets) | Strategy (i) chosen — full replacement; no coexistence. Old theme code removed, not preserved. |
| Redesigning AI Briefing generator UI                | Out of scope for visual system adoption; current briefing UI remains unchanged                 |
| Mobile native app themes                            | Already out of scope project-wide (mobile native cancelled)                                    |
| Theming the Network Graph (React Flow) nodes        | Graph has its own color semantics (relationship types); re-theming is a separate effort        |
| Dark-mode-only or light-mode-only directions        | All 4 directions must support both modes per handoff                                           |
| Replacing the existing route structure              | Pure visual adoption; TanStack Router route tree untouched except removing `/themes`           |
| Supabase schema changes                             | Visual-only milestone; no DB migrations                                                        |
| Backend API changes                                 | Visual-only milestone; Express routes untouched                                                |
| Notification center UI redesign                     | Current notification bell/center preserved; only chrome reskinned                              |

---

## Traceability

Every v1 requirement is mapped to exactly one roadmap phase.

| Requirement | Phase    | Status  |
| ----------- | -------- | ------- |
| TOKEN-01    | Phase 33 | Pending |
| TOKEN-02    | Phase 33 | Pending |
| TOKEN-03    | Phase 33 | Pending |
| TOKEN-04    | Phase 33 | Pending |
| TOKEN-05    | Phase 33 | Pending |
| TOKEN-06    | Phase 33 | Pending |
| THEME-01    | Phase 34 | Pending |
| THEME-02    | Phase 34 | Pending |
| THEME-03    | Phase 34 | Pending |
| THEME-04    | Phase 34 | Pending |
| TYPO-01     | Phase 35 | Pending |
| TYPO-02     | Phase 35 | Pending |
| TYPO-03     | Phase 35 | Pending |
| TYPO-04     | Phase 35 | Pending |
| SHELL-01    | Phase 36 | Pending |
| SHELL-02    | Phase 36 | Pending |
| SHELL-03    | Phase 36 | Pending |
| SHELL-04    | Phase 36 | Pending |
| SHELL-05    | Phase 36 | Pending |
| VIZ-01      | Phase 37 | Pending |
| VIZ-02      | Phase 37 | Pending |
| VIZ-03      | Phase 37 | Pending |
| VIZ-04      | Phase 37 | Pending |
| VIZ-05      | Phase 37 | Pending |
| DASH-01     | Phase 38 | Pending |
| DASH-02     | Phase 38 | Pending |
| DASH-03     | Phase 38 | Pending |
| DASH-04     | Phase 38 | Pending |
| DASH-05     | Phase 38 | Pending |
| DASH-06     | Phase 38 | Pending |
| DASH-07     | Phase 38 | Pending |
| DASH-08     | Phase 38 | Pending |
| DASH-09     | Phase 38 | Pending |
| BOARD-01    | Phase 39 | Pending |
| BOARD-02    | Phase 39 | Pending |
| BOARD-03    | Phase 39 | Pending |
| LIST-01     | Phase 40 | Pending |
| LIST-02     | Phase 40 | Pending |
| LIST-03     | Phase 40 | Pending |
| LIST-04     | Phase 40 | Pending |
| DRAWER-01   | Phase 41 | Pending |
| DRAWER-02   | Phase 41 | Pending |
| DRAWER-03   | Phase 41 | Pending |
| PAGE-01     | Phase 42 | Pending |
| PAGE-02     | Phase 42 | Pending |
| PAGE-03     | Phase 42 | Pending |
| PAGE-04     | Phase 42 | Pending |
| PAGE-05     | Phase 42 | Pending |
| QA-01       | Phase 43 | Pending |
| QA-02       | Phase 43 | Pending |
| QA-03       | Phase 43 | Pending |
| QA-04       | Phase 43 | Pending |

**Coverage:**

- v1 requirements: 52 total
- Mapped to phases: 52 ✓
- Unmapped: 0

**Categories:** TOKEN (6) · THEME (4) · TYPO (4) · SHELL (5) · VIZ (5) · DASH (9) · BOARD (3) · LIST (4) · DRAWER (3) · PAGE (5) · QA (4) = 52

---

_Requirements defined: 2026-04-19_
_Traceability mapped by roadmapper: 2026-04-19_
_Last updated: 2026-04-19 at roadmap creation_
