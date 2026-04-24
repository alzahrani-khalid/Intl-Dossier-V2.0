# Phase 38: dashboard-verbatim - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning (pending handoff bundle restoration)

<domain>
## Phase Boundary

Rebuild the `/` dashboard route **pixel-exact to `reference/dashboard.png`** across all 4 directions (Chancery / Situation Room / Ministerial / Bureau) × light/dark × accent hue × density, with all 8 widgets wired to real domain hooks and **zero placeholder data**.

**In scope:** 8 dashboard widgets (KpiStrip, WeekAhead, OverdueCommitments, Digest, SlaHealth, VipVisits, MyTasks, RecentDossiers, ForumsStrip — note: DASH-08 bundles RecentDossiers+ForumsStrip), route rewrite, two thin adapter hooks (`useWeekAhead`, `usePersonalCommitments`), per-widget skeletons, RTL mirroring, responsive reflow at 320/768/1280 px, Playwright E2E + visual regression.

**Out of scope:** New pages (kanban/calendar = Phase 39, lists = Phase 40, drawers = Phase 41), new data sources beyond the listed hooks, design-system primitives (already shipped in Phase 33/37), custom/user-configurable dashboards (`pages/custom-dashboard/`).

</domain>

<decisions>
## Implementation Decisions

### Source of truth & handoff
- **D-01:** `/tmp/inteldossier-handoff/inteldossier/` — the handoff bundle containing `project/src/dashboard.jsx`, `project/reference/dashboard.png`, and `project/IntelDossier Redesign.html` — **must be restored before researcher runs**. Phase 37 precedent is a verbatim port; Phase 38 follows the same pattern. If the bundle is still missing when `/gsd-plan-phase 38` runs, planning MUST halt with a clear blocker message rather than improvise.
- **D-02:** The dashboard is a **verbatim visual port**: CSS grid rules, spacing, border radii, chip shapes, and widget ordering come from handoff files 1:1. Data wiring and RTL/a11y are additive — visuals are not reinterpreted.

### Route & replacement strategy
- **D-03:** **Replace `OperationsHub` outright.** Rewrite `frontend/src/routes/_protected/dashboard.tsx` to mount the new 8-widget dashboard. Preserve the existing route-level `FirstRunModal` + onboarding-tour wiring (`useFirstRunCheck`, `useTourComplete`) verbatim at the route level — only the rendered dashboard body changes.
- **D-04:** `frontend/src/pages/Dashboard/OperationsHub.tsx` and its `components/` subtree are **deleted** during Phase 38 cleanup. No `legacy/` archive — git history is the archive. (This is consistent with Phase 33/34 "legacy cut" patterns.)

### Widget organization
- **D-05:** All 8 widgets live under a single **`frontend/src/pages/Dashboard/widgets/`** folder with a barrel `index.ts`. File names: `KpiStrip.tsx`, `WeekAhead.tsx`, `OverdueCommitments.tsx`, `Digest.tsx`, `SlaHealth.tsx`, `VipVisits.tsx`, `MyTasks.tsx`, `RecentDossiers.tsx`, `ForumsStrip.tsx`. Mirrors Phase 37's `signature-visuals/` layout.
- **D-06:** Widgets import signature visuals from Phase 37's barrel (`@/components/signature-visuals`): `GlobeSpinner` (Digest refresh overlay), `Donut` + `Sparkline` (SlaHealth), `DossierGlyph` (WeekAhead, OverdueCommitments, MyTasks, RecentDossiers, ForumsStrip monograms where applicable).

### Missing hooks — thin adapters
- **D-07:** Create two **thin adapter hooks** inside Phase 38 scope:
  - **`useWeekAhead`** — derives upcoming engagements/events for the next 7 days from existing engagement/event data sources (researcher identifies exact source). Returns a day-grouped structure matching DASH-02.
  - **`usePersonalCommitments`** — thin wrapper over `useCommitments` (already at `frontend/src/hooks/useCommitments.ts`) filtered to the current user, grouped by dossier, surfacing overdue items with severity + days-overdue + owner initials per DASH-03.
  - Both live in `frontend/src/hooks/` (consistent with `useDashboardTrends`, `useMyTasks`). Treated as Phase 38 infra (Wave 0 plan).
- **D-08:** Remaining widget data comes from existing hooks as-is: `useDashboardStats` (KpiStrip), `useDashboardTrends` (SlaHealth sparkline), `useTasks` via existing flow (MyTasks), `useForums` (ForumsStrip), `dossierStore`/`useRecentDossiers`-equivalent (RecentDossiers). No mock data anywhere.

### Plan granularity & waves
- **D-09:** **One plan per widget (~10 plans total).** Matches Phase 37's granularity (9 plans). Structure:
  - Wave 0: `38-00-infra-PLAN.md` — folder scaffold, barrel, `useWeekAhead` + `usePersonalCommitments` adapter hooks, handoff reference pin, route rewrite stub, visual-regression baseline capture
  - Wave 1 (parallelizable): `38-01-kpistrip`, `38-02-weekahead`, `38-03-overdue-commitments`, `38-04-digest`, `38-05-sla-health`, `38-06-vip-visits`, `38-07-my-tasks`, `38-08-recent-dossiers-forums-strip`
  - Wave 2: `38-09-e2e-PLAN.md` — Playwright suite, visual regression gate, legacy `OperationsHub` deletion sweep
- **D-10:** Widget plans in Wave 1 are independent (different files, shared barrel only). Planner should mark them as `Depends on: 38-00` and parallel within Wave 1.

### Loading & empty states
- **D-11:** **Per-widget `<Skeleton>` placeholders** — each widget owns a shape-matching skeleton (KPI card outline, list rows, donut ring stub). No single fullscreen spinner on refetch. Initial hydration already covered by Phase 37's AppShell `<FullscreenLoader>`.
- **D-12:** Empty states: if the handoff shows empty-state copy/icons for a widget, port verbatim. Otherwise fall back to the existing `frontend/src/components/empty-states/DashboardEmptyState.tsx` with widget-specific copy keys under `i18n/{ar,en}/dashboard.json`. *(Claude's Discretion if handoff is silent.)*

### Responsive & RTL
- **D-13:** **Port handoff CSS grid rules verbatim** for responsive reflow at 320 / 768 / 1280 px. No improvisation of grid-template-columns; whatever the handoff defines is the answer.
- **D-14:** **Logical properties only** (`ms-*/me-*/ps-*/pe-*/start-*/end-*`, `inline-start/inline-end`). Chevrons and directional glyphs mirror via existing Phase 34/37 RTL patterns. Arabic locale uses the Tajawal cascade already installed in Phase 35.

### Test coverage
- **D-15:** **Heavier E2E** — Playwright suite covers:
  1. Per-widget render asserts (all 8 widgets mount with real data on `/`)
  2. Hooks-wiring asserts (no mock-data strings / TODO placeholders / `lorem` in rendered HTML)
  3. axe-core a11y (WCAG AA) on fully loaded dashboard
  4. RTL mirroring smoke (one direction, verify `dir="rtl"` + start/end swaps)
  5. Reduced-motion (GlobeSpinner overlay respects `prefers-reduced-motion`)
  6. **Visual regression snapshots: 4 directions × 2 modes = 8 baselines** at 1280 px. Single breakpoint snapshot (others covered by render asserts) keeps CI tractable.
- **D-16:** Visual regression uses Playwright's built-in `toHaveScreenshot()` with a conservative `maxDiffPixelRatio: 0.02` (2%). Baselines captured in Wave 0 after handoff restoration.

### Claude's Discretion
- **Widget ARIA landmarks & heading levels** — follow Phase 37 `<section aria-labelledby>` pattern unless handoff dictates otherwise
- **Realtime subscriptions** — existing Supabase realtime 1s debounce on tasks/transitions already covers MyTasks + OverdueCommitments indirectly; Phase 38 does NOT add new subscriptions
- **Digest widget "source" field** — if handoff ships mock copy, researcher confirms the real source (likely activity_log or feed table); wire to what matches, document choice in research
- **KpiStrip accent top-bar (DASH-01, card 3)** — use Phase 33 `--accent` token; no custom color

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Scope & requirements (repo-local)
- `.planning/ROADMAP.md` §Phase 38 (lines 218–240) — Goal, depends-on, 9 success criteria, plan placeholders
- `.planning/REQUIREMENTS.md` §Dashboard (DASH) (lines 57–67) — DASH-01..09 acceptance criteria
- `.planning/PROJECT.md` (lines 30, 39, 48, 51) — Milestone goal, dashboard-verbatim scope anchor, handoff bundle pointer

### Handoff bundle (MUST RESTORE — user committed to restore before research)
- `/tmp/inteldossier-handoff/inteldossier/project/src/dashboard.jsx` — verbatim visual source for 8 widgets
- `/tmp/inteldossier-handoff/inteldossier/project/reference/dashboard.png` — pixel-exact target for visual regression baselines
- `/tmp/inteldossier-handoff/inteldossier/project/IntelDossier Redesign.html` — full design context, fonts, tokens in use
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css` — Tajawal cascade + `[style*="--font-display"]` overrides (referenced by TYPO-03)

### Prior phase artifacts (locked decisions that flow into Phase 38)
- `.planning/phases/33-token-engine/` — OKLCH token engine, DesignProvider, HeroUI bridge, Tailwind `@theme` remap
- `.planning/phases/35-typography-stack/` — Tajawal cascade, per-direction fonts
- `.planning/phases/36-shell-chrome/` — AppShell, Topbar, Sidebar, ClassificationBar host the dashboard
- `.planning/phases/37-signature-visuals/37-CONTEXT.md` — GlobeLoader/Spinner/FullscreenLoader, DossierGlyph, Sparkline, Donut barrel at `@/components/signature-visuals`
- `.planning/phases/37-signature-visuals/37-PATTERNS.md` — signature-visuals folder pattern to mirror for widgets

### Existing domain code (integration points)
- `frontend/src/routes/_protected/dashboard.tsx` — route to rewrite; preserve FirstRunModal wiring
- `frontend/src/pages/Dashboard/OperationsHub.tsx` — to delete
- `frontend/src/domains/operations-hub/hooks/useDashboardStats.ts` — KpiStrip data
- `frontend/src/hooks/useDashboardTrends.ts` — SlaHealth sparkline data
- `frontend/src/hooks/useCommitments.ts` — base for `usePersonalCommitments` adapter
- `frontend/src/hooks/useTasks.ts` — MyTasks data
- `frontend/src/hooks/useForums.ts` — ForumsStrip data
- `frontend/src/store/dossierStore.ts` — RecentDossiers source
- `frontend/src/components/empty-states/DashboardEmptyState.tsx` — empty-state fallback
- `frontend/src/i18n/{ar,en}/dashboard.json` + `dashboard-widgets.json` — i18n keys to extend

### Signature visuals barrel (Phase 37 output)
- `frontend/src/components/signature-visuals/index.ts` — exports `GlobeLoader`, `FullscreenLoader`, `GlobeSpinner`, `DossierGlyph`, `Sparkline`, `Donut`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Signature visuals** (Phase 37): `<GlobeSpinner>` for Digest refresh overlay; `<Donut>` + `<Sparkline>` for SlaHealth; `<DossierGlyph>` for every widget that shows dossiers/countries/orgs/persons
- **HeroUI wrappers** (Phase 33): `@/components/ui/{button,card,chip,skeleton,modal}` — all token-driven, direction/mode/hue-aware
- **Design tokens** (Phase 33): `--accent`, `--accent-soft`, `--accent-ink`, `--surface`, `--surface-raised`, `--ink`, `--line`, `--sla-ok`, `--sla-risk`, `--sla-bad` all resolve to active direction+mode+hue — no hardcoded colors
- **Density tokens** (Phase 33): row heights auto-adapt via `--row-h` etc. — widget rows should use logical density tokens, not px
- **Existing empty-state**: `DashboardEmptyState.tsx` usable as per-widget fallback
- **i18n namespaces**: `dashboard.json` + `dashboard-widgets.json` (EN+AR) exist — extend, don't recreate

### Established Patterns
- **Verbatim port** (Phase 35/37): 1:1 preservation of handoff markup, timings, classes — no "improvements"
- **Barrel + folder** (Phase 37): single folder + `index.ts` re-export for primitive families — mirror for widgets
- **Suspense at AppShell root** (Phase 37 D-03): initial hydration covered; Phase 38 widgets use local skeletons for refetch
- **Logical properties only** (CLAUDE.md mandate): `ms-*/me-*/ps-*/pe-*/start-*/end-*`, never `ml/mr/pl/pr/left/right`
- **RTL via `scaleX(-1)`** (Phase 37 D-05): Sparkline already flips; widget-level mirroring via CSS logical properties + HeroUI's RTL-aware components
- **Route-level modal gating** (`dashboard.tsx`): FirstRunModal + onboarding-tour interlock — preserve verbatim
- **No mock data** (DASH-09, PROJECT.md): every widget hydrates from real hooks or shows skeleton/empty state

### Integration Points
- **Route**: `frontend/src/routes/_protected/dashboard.tsx` — swap `OperationsHub` for new dashboard body, keep modal wiring
- **AppShell**: already hosts FullscreenLoader via Phase 37 Suspense boundary — dashboard renders inside
- **DesignProvider**: tokens for 4 directions × 2 modes × hue × density already applied to `:root` — widgets inherit automatically
- **i18next**: `dashboard-widgets.json` namespaces for per-widget copy; direction-aware Tajawal cascade already in place
- **Supabase realtime**: existing 1s debounce on tasks/transitions covers MyTasks + OverdueCommitments; no new subscriptions needed for Phase 38

</code_context>

<specifics>
## Specific Ideas

- **Fidelity bar**: pixel-exact to `reference/dashboard.png` — 2% maxDiffPixelRatio on Playwright `toHaveScreenshot` baselines
- **Verbatim port mindset**: if the handoff `dashboard.jsx` uses a specific flex gap, border radius, or chip variant, port it exactly. Don't "round to the nearest Tailwind utility."
- **Hooks contract for adapters**: `useWeekAhead` returns day-grouped upcoming engagements (title + glyph + counterpart + location + status chips + brief chip per entry, per DASH-02). `usePersonalCommitments` returns dossier-grouped commitments with severity + days-overdue + owner initials (per DASH-03).
- **Visual regression baselines**: 4 directions × 2 modes = 8 snapshots at 1280 px only. Narrower breakpoints covered by render asserts, not snapshots (keeps CI fast).
- **GlobeSpinner in Digest**: overlay during refresh click — the refresh button is "animated" per DASH-04, meaning the button rotates/pulses while the GlobeSpinner covers the widget content during the refetch.

</specifics>

<deferred>
## Deferred Ideas

- **Flag-switch / parallel rollout of new dashboard** — rejected in favor of outright replacement (D-03); if rollback pressure emerges, revert via git not flags.
- **Co-located widgets per domain** — considered and rejected in favor of single `pages/Dashboard/widgets/` folder (D-05). Revisit if Phase 39+ widget reuse patterns emerge.
- **Grouped plans by data source (~5 plans)** — rejected in favor of one-plan-per-widget granularity (D-09) to maximize Wave 1 parallelism and preserve Phase 37 plan cadence.
- **Lighter E2E (smoke + a11y only)** — rejected; DASH-09's "zero mock data" + pixel-exact across 4 directions requires visual regression baselines (D-15).
- **Legacy OperationsHub archive folder** — rejected; git history is sufficient archive (D-04).
- **Per-widget Supabase realtime subscriptions** — deferred; existing 1s debounce covers needs. Revisit if SLA-risk or Digest need live push.
- **Custom/user-configurable dashboards** (`pages/custom-dashboard/`) — out of scope; untouched by Phase 38.
- **Kanban / Calendar / Lists / Dossier Drawer** — Phases 39, 40, 41 respectively.

</deferred>

---

*Phase: 38-dashboard-verbatim*
*Context gathered: 2026-04-24*
