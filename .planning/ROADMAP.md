# Roadmap: Intl-Dossier

## Milestones

- ✅ **v2.0 Production Quality** — Phases 1-7 (shipped 2026-03-28) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 Connected Workflow** — Phases 8-13 (shipped 2026-04-06) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Live Operations** — Phases 14-23 (shipped 2026-04-09) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v4.1 Post-Launch Fixes** — Phases 24-25 (shipped 2026-04-12) — [archive](milestones/v4.1-ROADMAP.md)
- ✅ **v5.0 Dossier Creation UX** — Phases 26-32 (shipped 2026-04-18) — [archive](milestones/v5.0-ROADMAP.md)
- 🚧 **v6.0 Design System Adoption** — Phases 33-43 (active)

## Phases

<details>
<summary>✅ v2.0 Production Quality (Phases 1-7) — SHIPPED 2026-03-28</summary>

- [x] Phase 1: Dead Code & Toolchain (3/3 plans) — ESLint 9, Prettier, Knip, pre-commit hooks
- [x] Phase 2: Naming & File Structure (3/3 plans) — consistent naming enforced via ESLint
- [x] Phase 3: Security Hardening (3/3 plans) — auth, RBAC, CSP, Zod, RLS
- [x] Phase 4: RTL/LTR Consistency (6/6 plans) — useDirection, LtrIsolate, logical properties
- [x] Phase 5: Responsive Design (5/5 plans) — mobile-first, touch targets, card views
- [x] Phase 6: Architecture Consolidation (5/5 plans) — domain repos, apiClient, service dedup
- [x] Phase 7: Performance Optimization (4/4 plans) — bundle budget, query tiers, memoization

Full details: [v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md)

</details>

<details>
<summary>✅ v3.0 Connected Workflow (Phases 8-13) — SHIPPED 2026-04-06</summary>

- [x] Phase 8: Navigation & Route Consolidation (4/4 plans) — hub sidebar, route dedup, mobile tabs, Cmd+K
- [x] Phase 9: Lifecycle Engine (5/5 plans) — 6-stage lifecycle, transitions, forum sessions
- [x] Phase 10: Operations Hub (4/4 plans) — role-adaptive dashboard, 5 zones, Realtime
- [x] Phase 11: Engagement Workspace (5/5 plans) — tabbed workspace, lifecycle stepper, kanban, calendar
- [x] Phase 12: Enriched Dossier Pages (5/5 plans) — DossierShell, RelationshipSidebar, Elected Officials
- [x] Phase 13: Feature Absorption (5/5 plans) — analytics, AI, graph, polling, export absorbed; Cmd+K search

Full details: [v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md)

</details>

<details>
<summary>✅ v4.0 Live Operations (Phases 14-23) — SHIPPED 2026-04-09</summary>

- [x] Phase 14: Production Deployment (3/3 plans) — HTTPS, CI/CD, monitoring, backups, rollback
- [x] Phase 15: Notification Backend & In-App (3/3 plans) — BullMQ, triggers, bell icon, preferences
- [x] Phase 16: Email & Push Channels (4/4 plans) — Resend email, digest, browser push, soft-ask
- [x] Phase 17: Seed Data & First Run (5/5 plans) — 40+ entities, first-run modal, bilingual
- [x] Phase 18: E2E Test Suite (4/4 plans) — Playwright POM, CI sharding, auth hardening, failure artifacts
- [x] Phase 19: Tech Debt Cleanup (2/2 plans) — typed router params, roadmap auto-sync
- [x] Phase 20: Live Operations Bring-Up (1/1 plan) — seed accounts provisioned
- [x] Phase 21: Digest Scheduler Wiring Fix (1/1 plan) — registerDigestScheduler() wired
- [x] Phase 22: E2E Test Fixes (1/1 plan) — notification spec + ops-hub testids fixed
- [x] Phase 23: Missing Verifications (2/2 plans) — SEED/DEBT requirements formally verified

Full details: [v4.0-ROADMAP.md](milestones/v4.0-ROADMAP.md)

</details>

<details>
<summary>✅ v4.1 Post-Launch Fixes (Phases 24-25) — SHIPPED 2026-04-12</summary>

- [x] Phase 24: Browser Inspection Fixes (2/2 plans) — calendar i18n, settings 406, analytics DNS
- [x] Phase 25: Deferred Audit Fixes (5 plans + 6 quick tasks) — 87/87 audit findings resolved

Full details: [v4.1-ROADMAP.md](milestones/v4.1-ROADMAP.md)

</details>

<details>
<summary>✅ v5.0 Dossier Creation UX (Phases 26-32) — SHIPPED 2026-04-18</summary>

- [x] Phase 26: Shared Wizard Infrastructure (4/4 plans) — `useCreateDossierWizard` hook, `CreateWizardShell`, per-type Zod schemas, defaults factory
- [x] Phase 27: Country Wizard (2/2 plans) — 3-step wizard, ISO/region/capital, list-page CTA
- [x] Phase 28: Simple Type Wizards (4/4 plans) — Organization, Topic, Person wizards
- [x] Phase 29: Complex Type Wizards (6/6 plans) — Forum, Working Group, Engagement wizards with relationship linking
- [x] Phase 30: Elected Official Wizard (4/4 plans) — Person variant with office/term/constituency
- [x] Phase 31: Creation Hub and Cleanup (4/4 plans) — `CreateDossierHub`, context-aware FAB, legacy wizard removal
- [x] Phase 32: Person-Native Basic Info (4/4 plans) — `PersonBasicInfoStep` with honorific, split names, nationality, DOB, gender

Full details: [v5.0-ROADMAP.md](milestones/v5.0-ROADMAP.md)

</details>

### 🚧 v6.0 Design System Adoption (Phases 33-43) — ACTIVE

**Milestone goal:** Adopt the Claude Design handoff as the system-wide visual language — four design directions (Chancery / Situation Room / Ministerial / Bureau) × light/dark × accent hue × density — replacing the existing theme list, rebuilding the shell chrome, and rebuilding the dashboard pixel-exact to the reference.

**Handoff bundle:** `/tmp/inteldossier-handoff/inteldossier/`
**Coverage:** 52/52 v1 requirements mapped across 11 phases.

Summary checklist:

- [ ] **Phase 33: token-engine** — OKLCH-driven token engine (4 directions × mode × hue × density) with Tailwind v4 `@theme` + HeroUI v3 semantic bridge
- [ ] **Phase 34: tweaks-drawer** — Topbar Tweaks drawer with Direction/Mode/Hue/Density/Classification/Locale controls, `localStorage` persistence, `/themes` route removal
- [ ] **Phase 35: typography-stack** — Self-hosted font stacks per direction (Fraunces / Space Grotesk / Public Sans / Inter / IBM Plex / JetBrains Mono / Tajawal) with RTL display-font override
- [ ] **Phase 36: shell-chrome** — 256px sidebar + 56px topbar + direction-specific classification element, GASTAT brand mark, responsive overlay-drawer behavior
- [ ] **Phase 37: signature-visuals** — GlobeLoader / GlobeSpinner / FullscreenLoader / DossierGlyph (24 flags + symbol fallbacks) / Sparkline / Donut primitives
- [ ] **Phase 38: dashboard-verbatim** — 8 dashboard widgets rebuilt pixel-exact to `reference/dashboard.png`, all wired to existing domain hooks
- [ ] **Phase 39: kanban-calendar** — Reskinned horizontal-scroll Kanban (kcards, overdue border, done opacity) + 7×5 calendar grid with event pills
- [ ] **Phase 40: list-pages** — Countries / Organizations / Persons / Forums / Topics / Working Groups / Engagements lists with shared `GenericListPage` and filter pills
- [ ] **Phase 41: dossier-drawer** — 720px dossier drawer (mini-KPI strip, serif summary, Upcoming/Activity/Commitments) with RTL flip + mobile full-screen
- [ ] **Phase 42: remaining-pages** — Briefs / After-actions / Tasks / Activity / Settings pages reskinned per handoff
- [ ] **Phase 43: rtl-a11y-responsive-sweep** — RTL audit, axe-core WCAG AA, responsive 320→1536 sweep, directional-icon documentation, CI gates

## Phase Details

### Phase 33: token-engine

**Goal**: The application can switch between 4 design directions × light/dark mode × accent hue × density, and every surface/ink/accent/line token on `:root` updates live, with HeroUI v3 and Tailwind v4 consuming the same tokens.
**Depends on**: Nothing (foundation phase)
**Requirements**: TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04, TOKEN-05, TOKEN-06
**Success Criteria** (what must be TRUE):

1. User can call a direction setter (Chancery / Situation Room / Ministerial / Bureau) and every surface/ink/accent/line/sidebar CSS var on `:root` updates without a page reload
2. User can toggle light/dark within each direction and the OKLCH accent math recomputes so `--accent-ink` flips lightness, `--accent-soft` flips chroma, and `danger/ok/warn/info` use dark-variant lightness values
3. User can pick any accent hue (0–360°) and `--accent`, `--accent-ink`, `--accent-soft`, `--accent-fg`, `--sla-ok`, and `--sla-risk` (accent+55° warm shift) recompute while `--sla-bad` stays hue-locked red
4. User can switch comfortable / compact / dense density and interactive row heights update (52/20/16 → 40/14/12 → 32/10/8 px), including in RTL where inline-start/inline-end logical spacing is preserved
5. Existing HeroUI v3 Button/Card/Chip/Modal/Skeleton/TextField/Switch/Checkbox render with the new tokens via `@heroui/styles` bridge (accent → primary; danger/ok/warn/info → semantic) with zero per-component overrides, and Tailwind utilities `bg-surface / text-accent / border-line / bg-accent-soft` resolve to the active direction+mode+hue
   **Plans**: 9 plans
   - [ ] 33-01-token-module-PLAN.md — Pure OKLCH token engine (buildTokens, applyTokens, types, directions, densities) + unit tests
   - [ ] 33-02-design-provider-PLAN.md — DesignProvider + useDesignDirection/useMode/useHue/useDensity/useDesignTokens hooks + App.tsx wiring
   - [ ] 33-03-fouc-bootstrap-PLAN.md — Inline synchronous bootstrap in index.html + CSP audit + FOUC Playwright test
   - [ ] 33-04-heroui-install-PLAN.md — Install @heroui/react + @heroui/styles; wire @plugin + :root --heroui-\* bridge in index.css (NO heroui.config.ts)
   - [ ] 33-05-heroui-wrappers-PLAN.md — Rewrite heroui-{button,card,chip,skeleton}.tsx to real HeroUI primitives; re-export shims for button.tsx/skeleton.tsx
   - [ ] 33-06-tailwind-remap-PLAN.md — @theme block in index.css for semantic remap + D-16 utilities + 24-baseline Playwright visual regression
   - [ ] 33-07-legacy-cut-PLAN.md — Delete 19 [data-theme=...] blocks + HSL scales + 25-file legacy audit sweep + useTheme shim
   - [ ] 33-08-storybook-PLAN.md — Install Storybook 8+ with Tailwind v4 + HeroUI; TokenGrid.stories.tsx + visual regression runner
   - [ ] 33-09-e2e-verification-PLAN.md — Playwright E2E asserting all 5 Success Criteria on a live page (Nyquist layer)

### Phase 34: tweaks-drawer

**Goal**: The user has one place — a Tweaks drawer opened from the topbar — to change Direction, Mode, Hue, Density, Classification, and Locale, with selections persisted across sessions and the old `/themes` route fully removed.
**Depends on**: Phase 33 (tokens must exist before a control panel can mutate them)
**Requirements**: THEME-01, THEME-02, THEME-03, THEME-04
**Success Criteria** (what must be TRUE):

1. User can open a Tweaks drawer from a topbar button and see all six controls (Direction / Mode / Hue / Density / Classification / Locale) in a single panel
2. User's Direction / Mode / Hue / Density / Classification / Locale selections persist after refresh via `localStorage` keys (`id.dir`, `id.theme`, `id.hue`, `id.density`, `id.classif`, `id.locale`)
3. Changing direction auto-resets Mode and Hue to that direction's defaults (Chancery=light/22°, Situation=dark/190°, Ministerial=light/158°, Bureau=light/32°) and the UI reflects the new values immediately
4. Drawer opens from the inline-end edge in LTR and inline-start edge in RTL (logical properties only); focus trap + ESC dismissal work in both locales
5. Navigating to `/themes` redirects to `/`; the legacy `pages/Themes.tsx` and `components/theme-selector/ThemeSelector.tsx` files are removed and no import references to them remain
   **Plans**: 8 plans
   - [ ] 34-01-PLAN.md — Wave 0 test scaffolds (8 stub tests + deletion-gate bash script)
   - [ ] 34-02-PLAN.md — DIRECTION_DEFAULTS map + getDirectionDefaults helper (THEME-03)
   - [ ] 34-03-PLAN.md — useClassification + useLocale hooks + DesignProvider persistence (THEME-02)
   - [ ] 34-04-PLAN.md — TweaksDrawer component + TweaksDisclosureProvider + EN/AR tweaks.\* keys + App root wire-up (THEME-01, THEME-03)
   - [ ] 34-05-PLAN.md — Extend bootstrap.js (classif/locale/migrator) + i18next LanguageDetector canonicalize on id.locale (THEME-02)
   - [ ] 34-06-PLAN.md — Inject gear trigger in SiteHeader + live LTR/RTL focus-trap E2E (THEME-01)
   - [ ] 34-07-PLAN.md — /themes → / TanStack Router redirect + regenerate routeTree + E2E (THEME-04)
   - [ ] 34-08-PLAN.md — Legacy cleanup sweep: retrofit 6 useTheme consumers + strip 5 render sites + delete 8 legacy files (THEME-04)
         **UI hint**: yes

### Phase 35: typography-stack

**Goal**: Every surface in the app renders in the correct per-direction display/body/mono font, with Arabic locale overriding all display-font usage to Tajawal and mono ranges pinned to JetBrains Mono inside RTL containers.
**Depends on**: Phase 33 (direction tokens drive font selection)
**Requirements**: TYPO-01, TYPO-02, TYPO-03, TYPO-04
**Success Criteria** (what must be TRUE):

1. User switching direction sees the correct display+body+mono fonts (Chancery: Fraunces / Inter / JetBrains Mono; Situation: Space Grotesk / IBM Plex Sans / IBM Plex Mono; Ministerial: Public Sans / Public Sans / JetBrains Mono; Bureau: Inter / Inter / JetBrains Mono)
2. All 6 Latin fonts plus Tajawal load self-hosted via `@fontsource/*` with weights 400/500/600/700 for display+body and 400/500 for mono; network panel shows zero requests to `fonts.googleapis.com` or `fonts.gstatic.com`
3. When locale is Arabic (RTL), every display-font element (h1/h2, chip/label classes) renders in Tajawal; the `[style*="--font-display"]` override selectors from `project/src/app.css` are preserved verbatim
4. Mono spans explicitly marked `[dir="ltr"]` inside RTL containers (`⌘K`, `T−3`, `+2`, `DD MMM` dates) keep rendering in JetBrains Mono without direction bleed
   **Plans**: TBD
   **UI hint**: yes

### Phase 36: shell-chrome

**Goal**: Every page of the app renders inside the new 256px sidebar + 56px topbar + direction-specific classification chrome, with the real GASTAT brand mark and correct responsive behavior down to 320px in both locales.
**Depends on**: Phase 33 (tokens), Phase 34 (Tweaks button lives in the topbar), Phase 35 (brand + nav typography)
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05
**Success Criteria** (what must be TRUE):

1. User sees a 256px sidebar with brand mark + app name + workspace + user card + three nav sections (Operations / Dossiers / Admin), and the active nav item carries a 2px accent bar anchored at `inset-inline-start:0` (correct edge in both LTR and RTL)
2. User sees a 56px topbar with search pill + `⌘K` kbd hint, direction switcher (4 buttons), bell+badge, theme toggle (sun/moon), locale toggle (EN/ع), and Tweaks button in correct reading order for the active locale
3. User sees a direction-specific classification element above main content (Chancery: marginalia italics; Situation: full-width ribbon; Ministerial/Bureau: chip pill) showing workspace + classification + session info
4. At ≤1024px the sidebar becomes an overlay drawer (280px wide, backdrop, `translateX(-100%)` off-canvas); at ≤640px the topbar wraps and the drawer goes full-screen; in RTL the drawer slide direction flips to `translateX(100%)` and every touch target remains ≥44×44px
5. Sidebar brand mark renders the real `GASTAT_LOGO.svg` at 22×22 tinted via `currentColor` in the active accent color
   **Plans**: TBD
   **UI hint**: yes

### Phase 37: signature-visuals

**Goal**: The app has a complete set of signature visual primitives — animated globe, dossier glyphs (24 flags + symbol fallbacks), sparkline, donut — all tokenized, RTL-aware, and reusable across later phases.
**Depends on**: Phase 33 (tokens drive globe / spinner / glyph colors)
**Requirements**: VIZ-01, VIZ-02, VIZ-03, VIZ-04, VIZ-05
**Success Criteria** (what must be TRUE):

1. User sees a `<GlobeLoader>` (orthographic d3-geo projection, topojson countries-110m, 16°/sec rotation on −18° tilt, three concentric whirl rings at 3.2s / 5.5s / 8s, pulsing halo) as a 1.6s startup splash
2. Developer can call `window.__showGlobeLoader(ms)` or mount `<FullscreenLoader>` to re-trigger the splash; backdrop renders as `color-mix(in srgb, var(--bg) 82%, transparent)` with `backdrop-filter: blur(3px)`
3. Buttons, load-more rows, and the digest refresh show an inline `<GlobeSpinner>` (40×40 SVG, 1.4s whirl arc + 2.8s reverse stylized globe) inheriting `currentColor` so it tints to surrounding text
4. Developer can render `<DossierGlyph>` resolving one of 24 hand-drawn flag SVGs (SA, AE, ID, EG, QA, JO, BH, OM, KW, PK, MA, TR, CN, IT, FR, DE, GB, US, JP, KR, IN, BR, EU, UN) clipped to a circle with a 1px `rgba(0,0,0,0.15)` hairline; non-country types fall back to symbol glyphs (forum ◇, person ●, topic ◆, organization ▲) in soft-tinted circles
5. Developer can render `<Sparkline data={…}>` (80×22 polyline, min-max normalized, trailing dot at latest point, flipped via `scaleX(-1)` in RTL) and `<Donut value={…} variants={[ok,risk,bad]}>` with stacked `strokeDasharray` segments and center percentage pill
   **Plans**: TBD
   **UI hint**: yes

### Phase 38: dashboard-verbatim

**Goal**: The `/` dashboard route matches `reference/dashboard.png` pixel-exact across all 4 directions and both modes, with all 8 widgets wired to real domain hooks and no placeholder data.
**Depends on**: Phase 33 (tokens), Phase 37 (GlobeSpinner / Donut / Sparkline / DossierGlyph)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08, DASH-09
**Success Criteria** (what must be TRUE):

1. User sees a `KpiStrip` of 4 cards (active engagements / open commitments / SLA at risk / week ahead) each showing value + delta + meta, with the third card carrying an accent top-bar
2. User sees a `WeekAhead` widget grouped by day/date/time with title + glyph + counterpart + location + status chips + brief chip per entry, and an `OverdueCommitments` widget grouped by dossier with expand toggle, severity dots, mono days-overdue, and owner initials
3. User sees a `Digest` widget with tag + headline + source + animated refresh button (shows `<GlobeSpinner>` overlay during refresh), a `SlaHealth` widget combining Donut + legend + 14-day Sparkline, and a `VipVisits` widget with T−N countdown + name + role + when
4. User sees `MyTasks` (checkbox + glyph + title + due chip per row), `RecentDossiers`, and `ForumsStrip` (4 of 8 forums with monogram short-code chips), all rendering correctly in RTL with logical padding/margins and mirrored chevrons
5. All 8 widgets hydrate from existing domain hooks (`useDashboardStats`, `useDashboardTrends`, `useWeekAhead`/equivalent, `usePersonalCommitments`, `useMyTasks`, `useRecentDossiers`, `useForums`, etc.) with zero mock data, and the dashboard lays out correctly at 320 / 768 / 1280 px breakpoints
   **Plans**: TBD
   **UI hint**: yes

### Phase 39: kanban-calendar

**Goal**: The Kanban WorkBoard and Calendar pages render per handoff: horizontal-scroll kanban with the new kcard anatomy and overdue/done treatments, and a 7×5 calendar grid with token-driven event pills.
**Depends on**: Phase 33 (tokens), Phase 36 (shell chrome), Phase 37 (DossierGlyph + Sparkline for cards)
**Requirements**: BOARD-01, BOARD-02, BOARD-03
**Success Criteria** (what must be TRUE):

1. User sees a horizontal-scroll Kanban with columns rendering header (title + count + add button) and `kcard`s showing kind chip, priority chip, title, glyph+dossier, mono due date, and avatar owner; scroll direction honors the active locale
2. User sees overdue Kanban cards with `border-inline-start: 3px solid var(--danger)` (flipping edge correctly in RTL) and done cards rendering at `opacity: 0.55`
3. User sees a 7×5 calendar grid with 1px divider lines on `--line` background, day-of-week header row, day number + stacked event pills per cell (default / `.travel` warn-soft / `.pending` line-soft), and an accent-colored day number on today
4. Both pages lay out correctly at 320 / 640 / 768 / 1024 / 1280 px with ≥44×44px touch targets on all card controls; calendar cells collapse to a week-list on mobile
   **Plans**: TBD
   **UI hint**: yes

### Phase 40: list-pages

**Goal**: Every dossier-type list page (Countries / Organizations / Persons / Forums / Topics / Working Groups / Engagements) renders per handoff using a shared `GenericListPage` where applicable, with correct glyphs, chips, filter pills, and RTL behavior.
**Depends on**: Phase 33 (tokens), Phase 36 (shell chrome), Phase 37 (DossierGlyph + GlobeSpinner for load-more)
**Requirements**: LIST-01, LIST-02, LIST-03, LIST-04
**Success Criteria** (what must be TRUE):

1. User sees Countries and Organizations as tables with `DossierGlyph` + EN/AR names + engagement count + last-touch + sensitivity chip + chevron; the chevron flips via `scaleX(-1)` in RTL
2. User sees Persons as a grid of cards (44px circular initial avatar + name + glyph + VIP chip + role + org) and Forums / Topics / Working Groups as list rows (name + meta + status chip) rendered from a shared `GenericListPage`
3. User sees Engagements with a search input + filter pills (All / Confirmed / Travel / Pending), week-list rendering, and a load-more row showing `<GlobeSpinner>` + "Loading more engagements…" in both locales
4. All 7 list pages lay out correctly at 320 / 768 / 1280 px with card-view fallbacks on mobile and ≥44×44px touch targets on every row/chevron; chips and meta text flow right-to-left in RTL with logical properties only
   **Plans**: TBD
   **UI hint**: yes

### Phase 41: dossier-drawer

**Goal**: The user can open any dossier as a 720px slide-in drawer from the inline-end edge (flipped to inline-start in RTL) with the sticky head / mini-KPI strip / serif summary / Upcoming / Activity / Commitments anatomy, and full-screen on mobile.
**Depends on**: Phase 33 (tokens), Phase 36 (shell chrome), Phase 37 (DossierGlyph + Sparkline for mini-KPI)
**Requirements**: DRAWER-01, DRAWER-02, DRAWER-03
**Success Criteria** (what must be TRUE):

1. User can open a 720px dossier drawer that slides in from the inline-end edge with a backdrop and `-24px 0 60px rgba(0,0,0,.25)` shadow
2. Drawer shows sticky head (DOSSIER + CONFIDENTIAL chips, display-font title, meta strip, CTA row with Log Engagement / Brief / Follow), mini-KPI strip (engagements / commitments / overdue / documents), italic-serif summary paragraph, Upcoming list, Recent Activity, and Open Commitments
3. In RTL the drawer slides from the inline-start edge with the shadow offset flipped accordingly; at ≤640px it renders full-screen with focus trap and ESC dismissal working in both locales
   **Plans**: TBD
   **UI hint**: yes

### Phase 42: remaining-pages

**Goal**: Every remaining user-facing page — Briefs, After-actions, Tasks, Activity, Settings — is reskinned to the handoff with correct layouts, typography, and RTL behavior.
**Depends on**: Phase 33 (tokens), Phase 36 (shell chrome), Phase 37 (DossierGlyph)
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05
**Success Criteria** (what must be TRUE):

1. User sees the Briefs page as a responsive card grid (`repeat(auto-fill, minmax(320px, 1fr))`) with status chip (ready/draft/review/awaiting) + page count + serif title + author/due
2. User sees the After-actions page as a table of engagement title / date / dossier chip / decisions count / commitments count, and the Tasks ("My desk") page as a card list with checkbox, glyph, title+subtitle, priority chip, and due column
3. User sees the Activity page as a timeline rendering `time · icon · "who action what in where"` with `where` in accent-ink
4. User sees the Settings page as a two-column layout (240px vertical nav with active accent bar + content card with edit-row list); at ≤768px the nav collapses above the card and the accent bar flips to an accent underline
5. All 5 pages render correctly in both locales with logical properties only and ≥44×44px touch targets on every interactive row
   **Plans**: TBD
   **UI hint**: yes

### Phase 43: rtl-a11y-responsive-sweep

**Goal**: The entire v6.0 surface area passes a hard CI-level quality bar: zero physical-property violations, zero axe-core WCAG AA violations, correct layout at 6 breakpoints, and documented directional-icon behavior.
**Depends on**: Phases 33, 34, 35, 36, 37, 38, 39, 40, 41, 42 (can only run after every reskin phase lands)
**Requirements**: QA-01, QA-02, QA-03, QA-04
**Success Criteria** (what must be TRUE):

1. `pnpm lint` reports zero `eslint-plugin-rtl-friendly` violations of `ml-*/mr-*/pl-*/pr-*/left-*/right-*/text-left/text-right/rounded-l-*/rounded-r-*` across every v6.0 page (Dashboard, Kanban, Calendar, all 7 list pages, Dossier drawer, Briefs, After-actions, Tasks, Activity, Settings — 13+ routes)
2. Automated axe-core run against every v6.0 route in both EN/LTR and AR/RTL reports zero WCAG AA violations; keyboard-only navigation reaches every interactive target with preserved focus outlines under all 4 directions × both modes
3. Visual regression or manual responsive snapshots confirm correct layout at 320 / 640 / 768 / 1024 / 1280 / 1536 px with ≥44×44px touch targets on every interactive element
4. Directional icons (`arrow-right`, `arrow-up-right`, `chevron-right`, `chevron-left`, `.icon-flip`) flip via `scaleX(-1)` in RTL; sparkline polylines also flip; `docs/rtl-icons.md` exists and enumerates every mirrored icon in the v6.0 set
   **Plans**: TBD

## Progress

**Execution Order:**
v6.0 phases execute in numeric order. Phase 33 is the foundation. After 33 lands, Phases 34 / 35 / 37 can run in parallel. After 36 (shell chrome) lands, Phases 38 / 39 / 40 / 41 / 42 can run in parallel. Phase 43 is a gate — it runs last, after every reskin phase is complete.

<!-- gsd:progress:start -->

| Phase                             | Milestone | Plans Complete | Status      | Completed  |
| --------------------------------- | --------- | -------------- | ----------- | ---------- |
| 14. Production Deployment         | v4.0      | 3/3            | Complete    | 2026-04-06 |
| 15. Notification Backend & In-App | v4.0      | 3/3            | Complete    | 2026-04-06 |
| 16. Email & Push Channels         | v4.0      | 4/4            | Complete    | 2026-04-06 |
| 17. Seed Data & First Run         | v4.0      | 5/5            | Complete    | 2026-04-06 |
| 18. E2E Test Suite                | v4.0      | 4/4            | Complete    | 2026-04-07 |
| 19. Tech Debt Cleanup             | v4.0      | 2/2            | Complete    | 2026-04-08 |
| 20. Live Operations Bring Up      | v4.0      | 1/1            | Complete    | 2026-04-09 |
| 21. Digest Scheduler Wiring Fix   | v4.0      | 1/1            | Complete    | 2026-04-09 |
| 22. E2E Test Fixes                | v4.0      | 1/1            | Complete    | 2026-04-09 |
| 23. Missing Verifications         | v4.0      | 2/2            | Complete    | 2026-04-09 |
| 24. Browser Inspection Fixes      | v4.1      | 2/2            | Complete    | 2026-04-12 |
| 25. Deferred Audit Fixes          | v4.1      | 5/5            | Complete    | 2026-04-12 |
| 26. Shared Wizard Infrastructure  | v5.0      | 4/4            | Complete    | 2026-04-15 |
| 27. Country Wizard                | v5.0      | 2/2            | Complete    | 2026-04-15 |
| 28. Simple Type Wizards           | v5.0      | 4/4            | Complete    | 2026-04-16 |
| 29. Complex Type Wizards          | v5.0      | 6/6            | Complete    | 2026-04-17 |
| 30. Elected Official Wizard       | v5.0      | 4/4            | Complete    | 2026-04-17 |
| 31. Creation Hub and Cleanup      | v5.0      | 4/4            | Complete    | 2026-04-18 |
| 32. Person-Native Basic Info      | v5.0      | 4/4            | Complete    | 2026-04-18 |
| 33. Token Engine                  | v6.0      | 0/?            | Not started | —          |
| 34. Tweaks Drawer                 | v6.0      | 0/?            | Not started | —          |
| 35. Typography Stack              | v6.0      | 0/?            | Not started | —          |
| 36. Shell Chrome                  | v6.0      | 0/?            | Not started | —          |
| 37. Signature Visuals             | v6.0      | 0/?            | Not started | —          |
| 38. Dashboard Verbatim            | v6.0      | 0/?            | Not started | —          |
| 39. Kanban + Calendar             | v6.0      | 0/?            | Not started | —          |
| 40. List Pages                    | v6.0      | 0/?            | Not started | —          |
| 41. Dossier Drawer                | v6.0      | 0/?            | Not started | —          |
| 42. Remaining Pages               | v6.0      | 0/?            | Not started | —          |
| 43. RTL / A11y / Responsive Sweep | v6.0      | 0/?            | Not started | —          |

<!-- gsd:progress:end -->

## Coverage

- v1 requirements for v6.0: **52 total**
- Mapped to phases: **52** ✓
- Unmapped: **0**

| Category      | Count  | Phase         |
| ------------- | ------ | ------------- |
| TOKEN-01..06  | 6      | Phase 33      |
| THEME-01..04  | 4      | Phase 34      |
| TYPO-01..04   | 4      | Phase 35      |
| SHELL-01..05  | 5      | Phase 36      |
| VIZ-01..05    | 5      | Phase 37      |
| DASH-01..09   | 9      | Phase 38      |
| BOARD-01..03  | 3      | Phase 39      |
| LIST-01..04   | 4      | Phase 40      |
| DRAWER-01..03 | 3      | Phase 41      |
| PAGE-01..05   | 5      | Phase 42      |
| QA-01..04     | 4      | Phase 43      |
| **Total**     | **52** | **11 phases** |

## Dependency Graph (v6.0)

```
Phase 33 (tokens)  — foundation, no deps
├── Phase 34 (tweaks drawer)         depends on 33
├── Phase 35 (typography)            depends on 33
├── Phase 37 (signature visuals)     depends on 33
│
└── Phase 36 (shell chrome)          depends on 33, 34, 35
    │
    ├── Phase 38 (dashboard)         depends on 33, 37
    ├── Phase 39 (kanban/calendar)   depends on 33, 36, 37
    ├── Phase 40 (list pages)        depends on 33, 36, 37
    ├── Phase 41 (dossier drawer)    depends on 33, 36, 37
    ├── Phase 42 (remaining pages)   depends on 33, 36, 37
    │
    └── Phase 43 (QA sweep)          depends on 33, 34, 35, 36, 37, 38, 39, 40, 41, 42
```

---

_v6.0 roadmap created: 2026-04-19_
