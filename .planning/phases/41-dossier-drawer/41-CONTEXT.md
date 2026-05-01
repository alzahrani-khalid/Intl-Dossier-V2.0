# Phase 41: dossier-drawer — Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship a 720px slide-in dossier **quick-look drawer** that opens any dossier as an overlay surface — pixel-aligned to handoff `pages.jsx#DossierDrawer` + `app.css#L425-446` — with sticky head (DOSSIER + CONFIDENTIAL chips, display-font title, meta strip, CTA row), mini-KPI strip (engagements / commitments / overdue / documents), italic-serif Summary, Upcoming, Recent Activity, and Open Commitments sections. Slides from inline-end in LTR, flips to inline-start in RTL via logical properties. Full-screen at ≤640px with focus trap + ESC dismissal in both locales.

**In scope:**

- A new `<DossierDrawer/>` component mounted at AppShell level (one instance, portal-rendered), reading open state from URL search params
- `useDossierDrawer()` hook exposing `openDossier({ id, type })` / `closeDossier()` — thin wrapper around TanStack Router `useNavigate` that mutates `?dossier=<id>&dossierType=<type>` search params on the current route
- `DossierDrawerRoot` route-search schema added to `_protected/route.tsx` (or wherever the protected layout's `validateSearch` lives) so any protected route accepts `?dossier=<id>&dossierType=<type>`
- Drawer head: `DOSSIER` chip (always) + `CONFIDENTIAL` chip (rendered when `dossier.sensitivity_level >= 3`); display-font title (EN/AR via `useDossier`); meta strip (location · lead · engagement count · last-touched); CTA row with `Log engagement` (wired) + `Brief` + `Follow` (visual stubs, `aria-disabled="true"` + "Coming soon" tooltip per Phase 39 D-06 stub pattern); ✕ close button (top-end)
- Drawer body sections (verbatim handoff anatomy):
  - `kpi-mini-strip` — 4 cells: engagements / open commitments / overdue / documents (mapping locked in D-04)
  - Summary — `font-family: var(--font-display); font-style: italic; color: var(--ink-mute)` paragraph from `dossier.description_{en,ar}`
  - Upcoming — `week-list` rendering top 2 entries from `useDossierOverview` `calendar_events.upcoming` (matches handoff `WEEK_AHEAD.slice(0, 2)`)
  - Recent activity — `act-list` rendering top 4 entries from `useDossierOverview` `activity_timeline.activities`
  - Open commitments — `overdue-item` rows from `useDossierOverview` `work_items.items.filter(source==='commitment' && status not in ['completed','cancelled'])`; row click → existing work-item detail dialog (D-08)
- Open triggers (D-01): RecentDossiers / MyTasks / OverdueCommitments / ForumsStrip dashboard widgets + calendar events with `linkedItemType==='dossier'`
- "Open full dossier" CTA in head meta row → `navigate({ to: getDossierDetailPath(id, type) })` (preserves Phase 40 D-10 list-row navigation precedent)
- `useDossierOverview(dossierId, { include_sections: ['work_items', 'calendar_events', 'activity_timeline'] })` is the sole data hook (D-03)
- Per-section `<Skeleton>` shape-matching loading states (Phase 38 D-11)
- RTL slide via logical properties (`inset-inline-end: 0`, `border-inline-start: 1px solid var(--line)`, `box-shadow: -24px 0 60px rgba(0,0,0,0.25)` — handoff CSS line 427 already uses logical properties); RTL flip falls out automatically
- Mobile (≤640px): `width: 100vw`, `border-inline-start: 0`, `box-shadow: none` (handoff CSS line 855)
- Focus trap + ESC dismissal: built into chosen primitive (HeroUI v3 Drawer per cascade — see Claude's Discretion); ESC also clears `?dossier=` search param via `closeDossier()`
- Bilingual i18n: new `dossier-drawer.json` namespace under `frontend/public/locales/{en,ar}/` (CTA labels, KPI labels, section labels, "Coming soon" tooltip, "Open full dossier" label)
- Visual regression: 2 baselines (LTR + AR @ 1280px) + mobile full-screen render assertion (no snapshot — Phase 38 D-13 / Phase 40 D-06 precedent)
- Playwright E2E: drawer-opens-from-RecentDossiers, drawer-opens-from-calendar-event-click, deep-link-restore (refresh `?dossier=<id>` reopens drawer), ESC-closes-and-clears-URL, RTL-slides-from-inline-start, mobile-full-screen-render, focus-trap-Tab-cycle, Open-full-dossier-navigates, Log-engagement-CTA-navigates-with-prefill, commitment-row-opens-detail-dialog
- axe-core a11y gate (zero violations) + size-limit budget update

**Out of scope (deferred):**

- Replacing list-row navigation with drawer (D-01: lists keep Phase 40 wiring)
- Deleting `/dossiers/$id/overview` page (D-01: drawer augments, doesn't replace)
- Wiring `Brief` + `Follow` CTAs (D-05: visual stubs only this phase)
- "preview" affordance / ⌘+click on list rows to open drawer (D-01: not selected)
- Activity-timeline infinite scroll inside the drawer (D-03: aggregate hook only; activity uses top-4 slice — Phase 38 D-11 precedent for fixed-slice section)
- New backend endpoints, schema migrations, new aggregate Edge Function
- "Engagements" KPI requiring an `engagement` work-item source (D-04: maps to `stats.calendar_events_count`; researcher confirms calendar_events_count includes engagement-type events)
- Drawer-stacked-on-drawer (commitment row click opens dialog, not nested drawer)
- Mobile breakpoint visual regression snapshots
- Parallel-route mounting strategy (D-02: search-param mounting wins on simplicity)

</domain>

<decisions>
## Implementation Decisions

### Area 1: Open trigger + page strategy

- **D-01:** **Drawer is for inline preview from dashboard + calendar; lists keep Phase 40 row navigation.** Open triggers: RecentDossiers / MyTasks dossier chip / OverdueCommitments dossier chip / ForumsStrip dashboard widgets + calendar events with `linkedItemType==='dossier'` (Phase 39 D-02 preserved this hook for exactly this purpose). Lists (Phase 40 D-10) still navigate row click → `/dossiers/{type}/$dossierId`. The drawer's head CTA row gets an "Open full dossier" button → `navigate({ to: getDossierDetailPath(id, type) })`. The `/dossiers/$id/overview` aggregated page is preserved.
  - **Why:** Lists are destination workflows ("show me all countries"), drawer is for inline references ("what's this dossier I see in this widget"). Different ergonomics, different surface. Replacing Phase 40 row navigation would regress shipped work; deleting the overview page would destroy a real aggregated view.

### Area 2: Mount strategy

- **D-02:** **URL search param mounting** — drawer open state lives in `?dossier=<id>&dossierType=<type>` on the current route. Browser back closes drawer; refresh restores it; URL is shareable. Schema declared via TanStack Router `validateSearch` on the protected layout (`_protected/route.tsx`) so any protected route accepts both params. `closeDossier()` calls `navigate({ search: { dossier: undefined, dossierType: undefined } })` (no full route change). `dossierType` is required because `getDossierDetailPath` and KPI-section labels need the type to render correctly without a separate type lookup query.
  - **Why:** Analyst-tool deep-link expectations (the user expects to share a quick-look URL with a teammate; expects browser-back to dismiss the overlay; expects refresh to keep them where they were). Search-param plumbing is small (~30 lines including schema + hook + drawer mount).

### Area 3: Data wiring + KPI mapping

- **D-03:** **Single `useDossierOverview` aggregate hook** with `include_sections: ['work_items', 'calendar_events', 'activity_timeline']`. One query, one cache key, one network round-trip covers stats + Upcoming + Activity + Open Commitments. Activity uses the top-4 slice from `activity_timeline.activities` (no infinite scroll in the drawer — Phase 38 D-11 fixed-slice precedent). Per-section `<Skeleton>` placeholders cover the single loading state visually.
- **D-04:** **KPI mapping (locked):**
  - `engagements` → `stats.calendar_events_count` (researcher confirms `calendar_events_count` reflects engagement-type events; if not, planner adds an `engagement_type` filter on the work_items section as fallback)
  - `commitments` → `work_items.items.filter(it => it.source === 'commitment').length`
  - `overdue` → `stats.overdue_work_items`
  - `documents` → `stats.documents_count`
  - All four labels are bilingual i18n keys under the new `dossier-drawer.json` namespace.
- **D-04 Amendment (2026-05-02 / per RESEARCH §2):** commitments KPI canonical path is `work_items.by_source.commitments.length`. The original `items.filter(it => it.source === 'commitment').length` produces the same result (the `by_source` map is the pre-grouped form of `items.filter`) — RESEARCH §2 confirms `by_source` is the supported, indexed access path. **Plan 41-03 uses the `by_source` path** for cache locality and to avoid re-filtering already-grouped data. Decision history preserved; no semantic change to D-04 outputs.

### Area 4: CTAs + click targets

- **D-05:** **`Log engagement` CTA wired; `Brief` + `Follow` visual stubs.** `Log engagement` → `navigate({ to: '/dossiers/{type}/$dossierId/engagements/create', params: { dossierId: id }, search: ... })` (researcher confirms exact engagement-create route + prefill mechanism — likely an existing form route or `EngagementCreateDialog`). `Brief` + `Follow` render with handoff `.btn` chrome but `aria-disabled="true"` + `title="Coming soon" / "قريبًا"` tooltip + visually-muted via `opacity: 0.55` (Phase 39 D-06 stub pattern). Real wiring deferred — capture in `<deferred>`.
- **D-06:** **`Open full dossier` CTA** — added to the head CTA row (or as a chevron-link inside the meta strip — researcher proposes exact placement based on handoff visual). Click → `navigate({ to: getDossierDetailPath(id, type) })`. Drawer closes via the search-param removal that the navigation triggers (next route's search schema doesn't carry `?dossier=`).
- **D-07:** **`Brief` + `Follow` deferred destinations:** `Brief` likely targets the future Phase 42 Briefs page or an existing brief view (researcher locates); `Follow` likely a `dossier_subscriptions` toggle endpoint (researcher locates or marks as new-API). Capture both as deferred ideas — not in this phase.
- **D-08:** **Open Commitment row click → existing work-item detail dialog** (Phase 39 D-09 wired this for Kanban kcards; commitment-row click reuses the same dialog/component). Drawer stays open behind the dialog (z-index stack: drawer at z-41 per handoff CSS, dialog at z-50+). Researcher confirms which component handles `WorkItem.source === 'commitment'` detail rendering.

### RTL & Responsive (carried from prior phases)

- **D-09:** **Logical properties only** for the drawer chrome — handoff CSS already uses `inset-inline-end`, `border-inline-start`, `padding-inline-end` (lines 427, 856). RTL slide-from-inline-start falls out automatically; the `box-shadow: -24px 0 60px rgba(0,0,0,0.25)` is x-axis directional but acceptable per CLAUDE.md (the visual offset reads correctly in both locales because it's relative to the drawer edge, not the viewport).
- **D-10:** **Mobile (≤640px) full-screen** — `width: 100vw; border-inline-start: 0; box-shadow: none` (handoff line 855). `padding-left: 16px; padding-right: 16px` (handoff line 856 — researcher converts to logical `padding-inline: 16px` if not already).
- **D-11:** **Touch targets ≥44×44px** for the close ✕ button, all CTAs, commitment rows, and "Open full dossier" link (Phase 40 D-18 carries forward).

### Test gates (Phase 38/40 precedent)

- **D-12:** **Visual regression at 1280px LTR + AR only** — 2 baselines, `maxDiffPixelRatio: 0.02`. Mobile (640px / 320px) covered by Playwright render assertions on `width: 100vw` + DOM-based focus-trap-Tab-cycle assertion. Phase 38 D-13 / Phase 40 D-06 precedent.
- **D-13:** **Playwright E2E (10 cases):**
  1. Drawer opens from RecentDossiers click and renders all sections with real data
  2. Drawer opens from calendar event click (`linkedItemType==='dossier'`)
  3. Deep-link `?dossier=<id>&dossierType=<type>` on refresh restores drawer state
  4. ESC closes drawer and clears search params (URL no longer has `?dossier=`)
  5. RTL renders drawer slid from inline-start with `border-inline-start: 0` flipped to `border-inline-end` (researcher confirms exact RTL CSS behavior at line 427 of handoff)
  6. ≤640px viewport renders drawer full-screen (`width: 100vw`)
  7. Tab cycles within drawer (focus trap), Shift+Tab cycles backward, focus restores to opener on close
  8. "Open full dossier" CTA navigates to `/dossiers/{type}/$id`
  9. "Log engagement" CTA navigates to engagement-create route with `dossier_id` prefill
  10. Commitment row click opens work-item detail dialog with drawer still in DOM
- **D-14:** **axe-core WCAG AA zero violations** + **size-limit budget update** (drawer + new hook ≤ 8KB gz, researcher proposes exact figure based on `useDossierOverview` already being in the bundle).

### Wave structure (Phase 38/39/40 pattern)

- **D-15:** **3-wave parallel structure:**
  - **Wave 0 (infra):** `useDossierDrawer` hook + URL search-param schema on `_protected/route.tsx` + `<DossierDrawer/>` shell mounted at AppShell level (portal) + `dossier-drawer.json` i18n namespace + size-limit budget update + Playwright fixture for opening drawer in tests
  - **Wave 1 (sections, parallel):** Head (chips + title + meta + CTA row) · MiniKpiStrip · Summary · Upcoming · RecentActivity · OpenCommitments · open-trigger wiring on RecentDossiers / MyTasks / OverdueCommitments / ForumsStrip / calendar-event-click
  - **Wave 2 (gates):** 10 Playwright E2E cases + 2 visual regression baselines + axe-core + size-limit + human checkpoint

### Claude's Discretion

- **Primitive choice:** **HeroUI v3 Drawer** (per CLAUDE.md component cascade — HeroUI for accessible primitives unless not covered) styled with handoff `.drawer-*` CSS classes on its inner content. AppShell already uses HeroUI v3 Drawer for the mobile sidebar so we maintain consistency. Fallback to existing `Sheet` (Radix Dialog at `frontend/src/components/ui/sheet.tsx`) if HeroUI Drawer's RTL placement props don't cleanly support `inline-end`/`inline-start` semantics — researcher decides during research, planner finalizes. Either primitive provides focus trap + ESC + Portal out of the box.
- **Sensitivity chip threshold** — researcher confirms which `sensitivity_level` integer values map to "CONFIDENTIAL" labeling (likely `>= 3`); chip uses `chip-warn` class per handoff line 486.
- **Meta strip composition** — handoff shows "📍 Global · Lead: {name} · 22 engagements · Last touched today". Researcher maps each segment: location → `dossier.metadata?.region` or static "Global" fallback; lead → `dossier.metadata?.lead_name` or `key_contacts[0].name` (researcher chooses); engagement count → bilingual digit-formatted via existing `toArDigits` utility; last-touched → bilingual relative-time formatter (existing utility likely at `frontend/src/utils/`). No emoji per CLAUDE.md voice rule — `📍` from handoff is replaced with a token-driven map-pin icon (`<Icon name="map-pin"/>` from Phase 37 icons or lucide `MapPin`).
- **Recent Activity row composition** — handoff `.act-row` uses `time | dot-icon | who + what` grid. Researcher locates `activity_timeline.activities[].actor_name` / `.action_label` / `.created_at` field names from `useDossierOverview` response and maps accordingly.
- **Bilingual digit rendering** — engagement count, KPI values, days-overdue, last-touched relative time all rendered via existing `toArDigits` utility (Phase 39 / 40 precedent).
- **Empty states per section** — bilingual concise copy ("No upcoming engagements" / "لا توجد ارتباطات قادمة"; "No recent activity" / "لا يوجد نشاط حديث"; "No open commitments" / "لا توجد التزامات مفتوحة"). KPI strip renders `0` literally — no empty-state for the strip itself.
- **CTA i18n keys** — `dossier-drawer:cta.log_engagement`, `cta.brief`, `cta.follow`, `cta.open_full_dossier`, `cta.coming_soon`, `cta.close`.
- **Animation timing** — researcher checks handoff `app.css` for any `transition` rule on `.drawer`; if absent, use `var(--dur)` (Phase 33 token) with `ease-out`. RTL slide preserves the same timing.

### Folded Todos

_None — no pending todos folded into Phase 41 scope._

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Handoff source of truth (verbatim port targets)

- `/tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx#L469-559` — `DossierDrawer` JSX (overlay + drawer + head + meta + CTA row + body sections + section data shape)
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L425-446` — drawer + kpi-mini-strip + act-list + act-row CSS (drawer-overlay, drawer, drawer-head, drawer-body, drawer-title, drawer-meta, kpi-mini, kpi-mini-val, kpi-mini-label, act-list, act-row)
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L298-302` — kpi-mini-strip CSS (display flex, gap 16, kpi-mini border-inline-end, val 22px display font, label 11px ink-mute)
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L331-338` — overdue-item / overdue-sev / overdue-owner CSS (4-column grid, severity dot, owner mono font end-aligned)
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L444-446` — act-list / act-row CSS (3-column grid: 60px time + 24px icon + 1fr what)
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L648-649` — Bureau-direction drawer overrides (`.dir-bureau .drawer { background: var(--surface) }`, `.dir-bureau .drawer-title { font-weight: 600; font-size: 24px }`)
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L855-858` — mobile drawer overrides (`width: 100vw; border-inline-start: 0; box-shadow: none`, padding 16px, title 22px)
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L139,168` — RTL drawer-title + RTL overdue-owner overrides (researcher inspects to confirm logical-property compliance)

> **No `drawer.png` exists in `/tmp/inteldossier-handoff/inteldossier/project/reference/`** — verbatim CSS port without dedicated image baseline. Visual regression captures the drawer rendered against a live dossier in Wave 2.

### Project requirements + roadmap

- `.planning/REQUIREMENTS.md` §"Dossier Detail Drawer (DRAWER)" — DRAWER-01..03 acceptance criteria (verbatim)
- `.planning/ROADMAP.md` §"Phase 41: dossier-drawer" — Goal, Depends on (Phase 33 / 36 / 37), Success Criteria (3 items)

### Prior phase context (locked decisions feeding Phase 41)

- `.planning/phases/33-token-engine/33-CONTEXT.md` — Token utilities consumed by drawer chrome (`bg-surface`, `bg-bg`, `text-ink`, `text-ink-mute`, `text-ink-faint`, `border-line`, `bg-accent-soft`, `text-accent-ink`, `chip-warn`); `var(--shadow-lg)` reserved for drawer per CLAUDE.md design rules
- `.planning/phases/35-typography-stack/35-CONTEXT.md` — `var(--font-display)` consumed by drawer-title and italic-serif Summary; Tajawal cascade for AR locale
- `.planning/phases/36-shell-chrome/36-CONTEXT.md` — AppShell mount point for drawer (portal-rendered above `<main>`); HeroUI v3 Drawer already used for mobile sidebar (consistency target)
- `.planning/phases/37-signature-visuals/37-CONTEXT.md` — `<DossierGlyph flag={iso}/>` consumed by Upcoming list rows + commitment rows where applicable; `<Icon/>` set (`map-pin`, `plus`, `book`, `users-plus`, `dot`, `chevron-right`, `x`) from `icons.jsx` port
- `.planning/phases/38-dashboard-verbatim/38-CONTEXT.md` — D-01/D-02 verbatim handoff port pattern; D-09 wave structure; D-11 per-section Skeleton; D-13 visual regression at 1280 px only; RecentDossiers / MyTasks / OverdueCommitments / ForumsStrip widgets become drawer open-triggers
- `.planning/phases/39-kanban-calendar/39-CONTEXT.md` — D-02 `linkedItemType` / `linkedItemId` props on `UnifiedCalendar` preserved exactly for Phase 41 drawer consumption (calendar event click → openDossier when `linkedItemType==='dossier'`); D-06 stub pattern (aria-disabled + Coming soon tooltip) reused for Brief + Follow CTAs; D-09 work-item detail dialog reused for commitment row click
- `.planning/phases/40-list-pages/40-CONTEXT.md` — D-10 list-row navigation preserved (drawer does NOT replace this); confirms drawer is preview surface, not destination

### Existing codebase entry points (reuse — do NOT rebuild)

- `frontend/src/hooks/useDossierOverview.ts` — sole data hook for the drawer (D-03)
- `frontend/src/types/dossier-overview.types.ts` — `DossierOverviewResponse`, `DossierOverviewStats`, `WorkItemsSection`, `CalendarEventsSection`, `ActivityTimelineSection` shapes consumed by drawer sections
- `frontend/src/domains/dossiers/hooks/useDossier.ts` — core dossier data (`name_en`, `name_ar`, `type`, `sensitivity_level`, `description_en`, `description_ar`, `metadata`) — used for head title + Summary + sensitivity chip threshold
- `frontend/src/lib/dossier-routes.ts` — `getDossierDetailPath(id, type)` for "Open full dossier" CTA navigation
- `frontend/src/lib/dossier-type-guards.ts` — `isValidDossierType` for search-param validation
- `frontend/src/components/ui/sheet.tsx` — Radix Sheet primitive with `drawer-overlay` / `drawer-head` / `drawer` classnames already matching handoff CSS — fallback if HeroUI v3 Drawer's RTL placement is awkward
- `frontend/src/components/layout/AppShell.tsx` — mount point for `<DossierDrawer/>` (one instance, portal); HeroUI v3 Drawer already imported here for the mobile sidebar
- `frontend/src/components/signature-visuals/index.ts` — `<DossierGlyph/>` for inline references in Upcoming + commitment rows
- `frontend/src/pages/Dashboard/widgets/RecentDossiers.tsx` — first open-trigger; today renders `<a href={`/dossiers/${id}`}/>`; replace with `onClick={() => openDossier({ id, type })}`
- `frontend/src/pages/Dashboard/widgets/MyTasks.tsx` / `OverdueCommitments.tsx` / `ForumsStrip.tsx` — additional open-triggers (each has dossier glyph/name affordance)
- `frontend/src/components/calendar/UnifiedCalendar.tsx` (or wherever Phase 39 mounted it) — `onEventClick` handler reads `linkedItemType==='dossier'` and calls `openDossier({ id: linkedItemId, type: ... })` instead of (or in addition to) existing event-detail flow
- `frontend/src/utils/toArDigits` (or current location — researcher confirms) — Arabic-Indic digits for KPI values + engagement count + days-overdue
- `frontend/public/locales/{en,ar}/dossier.json` — existing namespace (extended); new `dossier-drawer.json` namespace created
- `frontend/src/routes/_protected/route.tsx` — protected layout where `validateSearch` schema for `?dossier=<id>&dossierType=<type>` lives (researcher confirms exact path; if there is no centralized search schema, mount the schema on `__root.tsx` instead)

### Existing dependencies (already installed — do NOT add new)

- `@heroui/react` v3 (Drawer primitive)
- `@radix-ui/react-dialog` (Sheet fallback)
- `@tanstack/react-router` (`useNavigate`, `validateSearch`)
- `@tanstack/react-query` (cache for `useDossierOverview`)
- `react-i18next` (new `dossier-drawer.json` namespace)
- `axe-core` + Playwright + `size-limit` (Phase 38/40 gates)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`useDossierOverview` aggregate hook** — single query covers stats + Upcoming + Activity + Open Commitments; `include_sections` param skips `related_dossiers` + `documents` (drawer doesn't render those)
- **`useDossier` core hook** — drawer head title + Summary + sensitivity chip threshold
- **HeroUI v3 Drawer** — already used by AppShell for mobile sidebar; reuse for dossier drawer (cascade priority + consistency)
- **Radix `Sheet`** — fallback primitive with handoff-aligned `drawer-overlay` / `drawer-head` / `drawer` classnames already in `frontend/src/components/ui/sheet.tsx`; both options provide focus trap + ESC + Portal
- **Token utilities (Phase 33)**: `bg-surface`, `bg-bg`, `text-ink`, `text-ink-mute`, `text-ink-faint`, `border-line`, `bg-accent-soft`, `text-accent-ink`, `chip-warn`, `var(--shadow-lg)` (drawer-only per CLAUDE.md), `var(--font-display)`, `var(--dur)`
- **Signature visuals (Phase 37)**: `<DossierGlyph/>` for Upcoming + commitment row glyphs; `<Icon/>` set for close ✕, plus, book, users-plus, dot, chevron-right
- **`toArDigits` utility** — Arabic-Indic digit rendering (Phase 39 / 40 precedent)
- **`getDossierDetailPath` / `isValidDossierType`** — type-aware route generation + search-param validation
- **Dashboard widgets (Phase 38)**: 4 widgets become open-triggers without rewriting their internals; trigger wiring is a single `onClick` swap per widget
- **`UnifiedCalendar` `linkedItemType`/`linkedItemId` props (Phase 39 D-02)** — preserved precisely for Phase 41 drawer consumption
- **`dossier-drawer` work-item detail dialog (Phase 39 D-09)** — commitment row click reuses this without changes

### Established Patterns

- **Verbatim handoff port** (Phase 35/37/38/39/40): 1:1 preservation of markup, classnames, timings — no improvisation
- **Wave 0 → Wave 1 → Wave 2** (Phase 38/39/40): infra → sections → gates
- **Per-section `<Skeleton>`** (Phase 38 D-11): shape-matching loading states; no fullscreen spinner
- **Logical properties only** (CLAUDE.md mandate): handoff CSS already uses `inset-inline-end`, `border-inline-start`, `padding-inline-end`
- **Stub pattern** (Phase 39 D-06): `aria-disabled="true"` + "Coming soon" tooltip for unfinished CTAs; reused for Brief + Follow
- **Click → existing detail surface** (Phase 39 D-09 / Phase 40 D-10): drawer overlays without changing wiring; commitment row reuses work-item detail dialog
- **Visual regression at 1280 px LTR + AR only** (Phase 38 D-13 / Phase 40 D-06): mobile breakpoints by render assertion
- **URL search params for ephemeral overlay state** — TanStack Router `validateSearch` is already used elsewhere in the app for filter state; mounting drawer state the same way is consistent
- **No raw hex / no card shadows / no marketing voice / no emoji in copy** (CLAUDE.md design rules): handoff `📍` icon replaced with token-driven map-pin icon

### Integration Points

- **Phase 38 dashboard widgets** (RecentDossiers, MyTasks, OverdueCommitments, ForumsStrip): become drawer open-triggers; one `onClick` swap each
- **Phase 39 `UnifiedCalendar`** (`linkedItemType`/`linkedItemId` props): calendar event click branches on `linkedItemType==='dossier'` → `openDossier({ id, type })`
- **Phase 39 work-item detail dialog**: commitment row click target inside drawer
- **Phase 40 list pages**: NOT touched by Phase 41 — row navigation preserved
- **Phase 42 remaining-pages**: may consume `useDossierDrawer` hook from Briefs / After-actions / Tasks / Activity if those pages render dossier references — decision deferred to Phase 42
- **`/dossiers/$id/overview` aggregated page**: preserved; reachable via "Open full dossier" CTA inside the drawer + direct URL/list-row navigation

</code_context>

<specifics>
## Specific Ideas

- **Drawer head CTA row layout**: `[Log engagement] [Brief (stub)] [Follow (stub)] ...spacer... [Open full dossier]`. The first three are `.btn` / `.btn-primary` per handoff; "Open full dossier" can be a `.btn-ghost` text-only chevron-link to keep visual hierarchy. Researcher proposes exact placement based on whether the meta strip has room.
- **`DOSSIER` chip + `CONFIDENTIAL` chip**: rendered side-by-side in head, before the title (handoff line 484-487). `DOSSIER` always; `CONFIDENTIAL` conditional on `dossier.sensitivity_level >= 3` (researcher confirms threshold). Both use `.chip` from existing chip primitive; `CONFIDENTIAL` uses `.chip-warn` modifier.
- **Drawer width**: `width: min(720px, 92vw)` exactly per handoff line 427.
- **Drawer shadow**: `box-shadow: -24px 0 60px rgba(0,0,0,0.25)` exactly per handoff line 427 — preserved in both LTR and RTL (the offset reads correctly relative to drawer edge in both).
- **kpi-mini-strip**: 4 cells with `border-inline-end: 1px solid var(--line)` between cells, last cell has no border (handoff line 299-300). Cell anatomy: `<span class="kpi-mini-val">{n}</span><span class="kpi-mini-label">{label}</span>` baseline-aligned per handoff.
- **Summary paragraph**: `font-family: var(--font-display); font-style: italic; color: var(--ink-mute); font-size: 14px; line-height: 1.6` (handoff line 516). Renders `dossier.description_{en,ar}` if present; falls back to a per-type bilingual default ("Active dossier — no summary recorded yet" / "ملف نشط — لا يوجد ملخص مسجل بعد") if both descriptions are empty.
- **Upcoming list**: top 2 entries from `useDossierOverview.calendar_events.upcoming`, rendered as `.week-list` rows with date + title + counterpart + status chip (handoff line 524-534). Uses bilingual day-of-week + Arabic-Indic digits.
- **Recent Activity**: top 4 entries from `useDossierOverview.activity_timeline.activities`, rendered as 3-column `.act-row` grid (60px time + 24px dot + 1fr "who what"). Time uses bilingual relative format (handoff: "09:42", "yday", "2d", "4d"); researcher locates existing relative-time utility or proposes one.
- **Open Commitments**: rows from `work_items.items.filter(source==='commitment' && status not in ['completed','cancelled'])`, rendered as `.overdue-item` 4-column grid (severity dot + title + days + owner mono). Severity dot color: `high` → `var(--danger)`, `med` → `var(--warn)`, `low` → `var(--ink-faint)` (handoff line 333-336). Days rendered Arabic-Indic in AR locale.
- **Focus trap**: provided by HeroUI v3 Drawer (or Radix Sheet fallback) — both use Radix Dialog primitives under the hood with `aria-modal="true"` + focus-trap. ESC handled by primitive + custom listener that also calls `closeDossier()` to clear search params.
- **Mobile (≤640px) full-screen**: handoff line 855 `width: 100vw; border-inline-start: 0; box-shadow: none` — primitive's mobile breakpoint matches.

</specifics>

<deferred>
## Deferred Ideas

- **`Brief` CTA wiring** — likely targets future Phase 42 Briefs page or an existing brief view route (researcher locates location during research; not wired this phase)
- **`Follow` CTA wiring** — `dossier_subscriptions` toggle endpoint or new API; not in current Edge Function set. Defer to a future "dossier follow / digest" phase
- **List-row preview affordance / ⌘+click on list rows** — not selected; lists keep current row navigation. Could be added in a future polish phase if usage signals it matters
- **Activity-timeline infinite scroll inside the drawer** — drawer uses fixed top-4 slice; full scroll lives on `/dossiers/$id/overview` page. Re-evaluate if feedback shows analysts want more activity inline.
- **Drawer-stacked-on-drawer for related dossiers** — if a user clicks a related dossier name inside the drawer, should it open a second drawer or replace the current? Out of scope; the drawer doesn't render `related_dossiers` section in Phase 41.
- **Engagement-source work-item filter** — if `stats.calendar_events_count` doesn't reflect engagement-type events accurately, planner may add an `engagement_type` filter on the work_items section. If neither path covers it, consider adding `engagements_count` to `DossierOverviewStats` in a separate API phase.
- **Replacing `/dossiers/$id/overview` with the drawer** — out of scope; the page is a real aggregated view (related dossiers, documents, work items, calendar events, contacts, activity timeline) that the 720px drawer doesn't replace. Re-evaluate after several milestones of usage data.
- **Mobile breakpoint visual regression snapshots** — Phase 38 / 40 precedent is render assertion only; revisit if mobile reflow regressions ship.
- **Drawer-from-list-row preview affordance** — captured here in case D-01 changes in a future phase.
- **"📍 Global" location segment fallback** — handoff hard-codes "Global"; researcher should propose a real source (`dossier.metadata.region` / `country.iso`) so the drawer doesn't show a hard-coded string. If no real source exists yet, defer the location-aware version to a future enrichment phase.

</deferred>

---

_Phase: 41-dossier-drawer_
_Context gathered: 2026-05-01_
