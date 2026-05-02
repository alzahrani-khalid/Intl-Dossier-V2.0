# Phase 42: remaining-pages — Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Reskin the five remaining user-facing pages — **Briefs / After-actions / Tasks ("My desk") / Activity / Settings** — to the IntelDossier handoff anatomy (verbatim port of layout, typography, chip semantics, and RTL behavior) per `/tmp/inteldossier-handoff/inteldossier/project/src/{pages.jsx#L295-465,app.css}`. All five routes already exist with shipped wiring; this phase swaps chrome and row/card anatomy onto existing data hooks (with one new aggregate hook + one new Edge Function for After-actions).

**In scope:**

- **Briefs** (`/briefs`):
  - Replace the existing 591-line `BriefsPage` body with the handoff `repeat(auto-fill, minmax(320px, 1fr))` card grid, keeping `<PageHeader/>` (already implements handoff `.page-head`) with a "New brief" primary action.
  - Each card: status chip (start) + page count `N pp` mono (end) → display-font title (16px / 500 / -0.01em letter-spacing / locale-aware bilingual) → author (start) + due/published mono date (end). Whole-card cursor:pointer.
  - Status chip mapping (D-Briefs-2): researcher locks the actual brief schema fields and produces a `is_published`/`published_date`/review-fields → `ready/awaiting/review/draft` translation; missing source fields = those statuses simply don't render (lossless).
  - Existing `BriefGenerationPanel` becomes a **dialog/sheet triggered by the "New brief" button** in `.page-head` (preserves AI generation feature).
  - Existing `BriefViewer` becomes a **dialog opened on card click** (preserves read view feature).
  - Strip the existing inline search input + category Select (handoff has neither).
- **After-actions** (`/after-actions`):
  - Replace the current stub-CTA page with the handoff `.tbl` table (Engagement / Date / Dossier chip / Decisions count / Commitments count / chevron with `icon-flip` for RTL). Row click → existing `/after-actions/$afterActionId` detail route.
  - **NEW Supabase Edge Function `after-actions-list-all`** (Wave 0 infra): returns RLS-gated published after-action records across all dossiers the caller has access to. Mirrors existing `after-actions-list` shape minus the `dossier_id` requirement. `publication_status='published'` is the default; query param overrides for future drafts/edit-requested views.
  - **NEW frontend hook `useAfterActionsAll(options?)`** (Wave 0 infra): TanStack Query wrapper over the new Edge Function.
  - No filters, no search, no date pickers — handoff verbatim. Row-shape skeleton during loading; bilingual concise empty state ("No after-action records yet" / "لا توجد سجلات بعد").
- **Tasks (`/tasks` — "My desk")**:
  - Replace `MyTasksPage`'s `TaskCard` body with the handoff `.tasks-list` row anatomy: `.task-box` checkbox (toggles done state with strikethrough + 0.45 opacity per handoff line 90) + `<DossierGlyph flag={...} size={18}/>` + `.task-title` (title + dossier · task-type subtitle in `var(--ink-mute)`) + `.chip` priority (high → `chip-danger`, medium → `chip-warn`, low → no chip modifier per handoff line 372) + `.task-due` (mono 11px, `min-width: 60px`, end-aligned).
  - **Keep** existing `Assigned/Contributed` tabs above the list (Feature 025 US2 — real shipped collaboration feature). Tabs use HeroUI v3 Tabs styled with handoff chip tokens.
  - **Strip** the floating `useWorkCreation` FAB; surface a "New task" button in `.page-head` action slot per handoff convention.
  - Row click → existing `TaskDetailPage` (no change).
- **Activity** (`/activity`):
  - Replace `EnhancedActivityFeed`-driven body with the handoff `.act-list` 3-col grid (`60px time + 24px icon + 1fr "who action what in where"`) per handoff line 444-450. `where` rendered in `var(--accent-ink)`; `what`'s nested entity name strong/`var(--ink)`/500-weight; `time` mono 10.5px ink-faint; `who` 500-weight.
  - Row composition (D-Activity-2): bilingual i18n templates per `event_type` (researcher locates the enum from `useActivityFeed` data shape; templates produced for `approval / link / file / check / alert / comment`). Icon map per handoff line 401: `approval→check, link→link, file→file, check→check, alert→alert, comment→chat`.
  - **Keep** existing All/Following tabs above the list (real follow feature).
  - **Strip** the collapsible Statistics panel and the Settings sheet (move follow preferences into the Settings page → Notifications section if not already there).
- **Settings** (`/settings`):
  - Replace existing `SettingsLayout` chrome with handoff two-column grid (`grid-template-columns: 240px 1fr`, `gap: var(--gap)`). Left card: `<button class="settings-nav (.active)">` rows with `<Icon/>` + label; active row gets `inset-inline-start: 0` accent bar + `var(--accent-soft)` background + `var(--accent-ink)` text per handoff line 73-100.
  - **Keep all 7 existing sections** (Profile / General / Appearance / Notifications / **Access & Security** (renamed from "Security") / Accessibility / Data & Privacy). Vertical nav extends to 7 items — preserves the real shipped `AccessibilitySettingsSection` (reduced-motion / font-size / high-contrast).
  - Right `.card`: existing react-hook-form + zod inline forms preserved as-is; restyle only — apply tokens (`border-line`, `ink-mute`, `var(--font-display)` title), match handoff `.card-title` + `.card-sub` chrome, single Save action per section. **Reject** the handoff edit-row + dialog-per-field pattern (would regress form ergonomics — analysts adjusting multiple fields would have to click into N dialogs).
  - **Move all Phase 33/34 design controls into the Appearance section**: direction picker (Bureau / Chancery / Situation / Ministerial), density (Comfortable / Compact / Dense), accent hue (0–360°), light/dark mode. Settings becomes the canonical control surface; `TweaksDrawer` (Phase 34) stays as a quick-access affordance from the topbar — both surfaces share the same hooks (no state divergence).
  - **Mobile (≤768px)**: vertical nav collapses to a horizontal scrollable strip of `.settings-nav` pills above the content card; the active accent bar flips from `inset-inline-start: 0` to a `border-block-end` accent underline on the active item (per ROADMAP success criteria #4 verbatim).
- **Cross-cutting:**
  - Reuse existing `<PageHeader/>` component (already implements handoff `.page-head` / `.page-title` / `.page-sub` chrome).
  - Logical properties only (`ms-/me-/ps-/pe-/start-/end-/inset-inline-*/border-inline-*/border-block-*`) — CLAUDE.md mandate, Phase 40 D-16, Phase 41 D-09.
  - Per-section `<Skeleton>` shape-matching loading states (Phase 38 D-11, Phase 41).
  - All interactive elements ≥44×44px (Phase 40 D-18, Phase 41 D-11).
  - Tokens via `var(--*)` only — no raw hex; no card shadows except drawer (CLAUDE.md, Phase 33).
  - i18n: extend or create namespaces per page (likely `briefs-page`, `after-actions-page`, `tasks-page`, `activity-page`, `settings-page` — researcher confirms whether to extend existing namespaces or create new ones).
  - 3-wave parallel structure: **Wave 0** (infra: `after-actions-list-all` Edge Function + `useAfterActionsAll` hook + i18n namespaces + size-limit budget update + Playwright fixtures + skeleton primitives) → **Wave 1** (5 page reskins, parallel) → **Wave 2** (gates: 10 visual baselines, axe-core WCAG AA, size-limit, Playwright E2E).

**Out of scope (deferred):**

- Search/filter pills on the After-actions table (Phase 40 D-09 pattern) — add later if usage demands.
- Date range filter (year/quarter) on After-actions.
- Drafts / edit-requested status views on After-actions (Edge Function supports the query param; UI affordance later).
- Briefs reference number badge / summary excerpt / tags chip row on cards (would break grid density / unbalance auto-fill).
- Briefs inline search + category filter (revisit if analyst usage signals demand).
- Dedicated `/briefs/generate` route for AI brief generation (current dialog-from-PageHead suffices).
- Backend schema migration adding a `status` enum column to briefs (defer to a separate backend phase).
- Settings: edit-row + dialog-per-field pattern (rejected — form ergonomic regression).
- Settings: dedicated `/settings/accessibility` route (rejected — would lose discoverability of a11y controls in a bilingual + RTL system).
- Replacing `/tasks` with redirect to `/kanban` (rejected — they serve different views: personal queue vs team workboard).
- Activity statistics panel (stripped from this phase; revisit if analyst feedback wants it back).
- Activity settings sheet trigger (stripped; preferences move to Settings → Notifications if not already there).
- Tasks floating action button (stripped; "New task" lives in `.page-head` action slot).
- Legacy primitive cleanup (`DataTable`, `AuditLogTable`, `ResponsiveTable`, etc.) — Phase 40 D-13 deferred to Phase 43; same applies here.
- Mobile-breakpoint visual regression snapshots (Phase 38 D-13 / Phase 40 D-06 / Phase 41 D-12 precedent — render assertions only).
- Global RTL/a11y/responsive sweep (Phase 43 — explicit ROADMAP boundary).

</domain>

<decisions>
## Implementation Decisions

### Area 1: After-actions data source

- **D-01:** **NEW `after-actions-list-all` Supabase Edge Function** (Wave 0 infra) returning RLS-gated after-action records across all dossiers the caller has access to. Mirrors the existing `supabase/functions/after-actions-list/index.ts` response shape, but without the `dossierId` URL-path requirement. Adds new `useAfterActionsAll(options?)` TanStack Query hook in `frontend/src/hooks/`.
  - **Why:** A direct Supabase client query bypasses any logic the Edge Function adds (computed fields, joins, formatting) and creates an inconsistent pattern with the rest of the app. Shipping chrome+empty-state with deferred wiring would regress PAGE-02 acceptance. Reusing the per-engagement stub leaves the new aggregated table view unbuilt.
- **D-02:** **Default scope: `publication_status='published'` only, all accessible records.** Status filter overrideable via query param (researcher confirms exact param name in the new Edge Function spec) for future drafts/edit-requested views.
  - **Why:** Matches handoff intent ("captured decisions, commitments, and notes from past engagements" — finalized records). All-statuses would mix work-in-progress with finalized records; user-scoped (author/contributor only) doesn't align with the handoff's org-wide framing.
- **D-03:** **Table columns handoff verbatim** — Engagement title (500-weight) / Date (mono ink-mute) / Dossier chip / Decisions count (mono) / Commitments count (mono) / chevron (`icon-flip` flips automatically in RTL). Row click → existing `/after-actions/$afterActionId` detail route.
- **D-04:** **No filters / no search / row-shape skeleton + bilingual empty state.** Filters can be added later if usage demands. Empty copy: "No after-action records yet" / "لا توجد سجلات بعد".

### Area 2: Briefs page — AI panel & filters placement

- **D-05:** **AI BriefGenerationPanel moves to a dialog/sheet triggered by the "New brief" button in `.page-head`.** **BriefViewer becomes a dialog opened on card click.** Card grid is the primary surface; both AI surfaces preserved with zero feature regression.
  - **Why:** Verbatim port of handoff visual + zero feature loss. Analysts keep AI generation discoverability via the primary action button; viewing a brief stays one click from the grid.
- **D-06:** **Status chip mapping with sensible defaults.** Researcher locates the actual brief schema fields and locks the translation in `42-RESEARCH.md`:
  - `is_published=true` → `ready` (`chip-ok`)
  - `published_date` set + approver-pending field → `awaiting approval` (`chip-warn`)
  - review-stage field set → `review` (`chip-info`)
  - else → `draft` (no chip modifier — base `.chip` class only)

  If `awaiting`/`review` source fields don't exist in the current schema, those statuses simply never render — lossless mapping; no schema migration this phase.

- **D-07:** **Strip the existing inline search input + category Select.** Handoff has neither; pure verbatim card grid. Reintroduce in a future polish phase if analyst usage signals demand.
- **D-08:** **Card anatomy handoff verbatim:**
  - Top row: status chip (start) + page count `N pp` (`var(--font-mono)` 11px `var(--ink-faint)`) (end), `display: flex; justify-content: space-between; margin-bottom: 8px`.
  - Title: `var(--font-display)` 16px 500 weight, letter-spacing `-0.01em`, line-height 1.3, `margin-bottom: 10px`. Locale-aware bilingual: `title_ar` if `i18n.language === 'ar'` else `title_en`, fallback to whichever non-empty.
  - Bottom row: author name (start) + due/published mono date (end), 11.5px `var(--ink-mute)`.
  - Whole card `cursor: pointer` → opens `BriefViewer` dialog.

### Area 3: Settings — section anatomy & form pattern

- **D-09:** **Keep all 7 existing sections; extend handoff vertical nav vertically.** Order: Profile → General → Appearance → Notifications → **Access & Security** (rename from "Security" to match handoff terminology) → Accessibility → Data & Privacy.
  - **Why:** AccessibilitySettings (reduced-motion / font-size / high-contrast) is a real shipped a11y feature in a bilingual + RTL system — deserves its own discoverable entry point. Handoff's 6-section count is the visual aspiration, not a functional cap.
- **D-10:** **Keep existing inline react-hook-form + zod forms in the right-side content card; restyle only.** Apply tokens (`border-line` for `.edit-row` separators per handoff line ~167, `ink-mute` helper copy, `var(--font-display)` for `.card-title`, `--row-h` for interactive heights). Match handoff `.card-title` + `.card-sub` chrome at the top of each section. Single Save action per section.
  - **Why:** The handoff edit-row + dialog-per-field pattern would regress form ergonomics — analysts adjusting multiple fields per session would have to click into N dialogs. Inline forms preserve the existing mental model and zod validation flow with zero interaction regression.
- **D-11:** **Move all Phase 33/34 design controls into the Appearance section.** Direction picker (Bureau / Chancery / Situation / Ministerial) + density (Comfortable / Compact / Dense) + accent hue (0–360° picker) + light/dark mode all render inline inside the Appearance section card. Same `useDesignDirection` / `useDensity` / `useHue` / `useMode` hooks already exposed by `DesignProvider`.
  - **Why:** Handoff's intent for an Appearance section is the canonical control surface for theming. `TweaksDrawer` (Phase 34) stays as a quick-access topbar affordance — both surfaces share the same hooks so no state divergence is possible. Settings = persistent preferences; TweaksDrawer = live experimentation.
- **D-12:** **Mobile (≤768px) collapse:** vertical 240px nav becomes a horizontal scrollable strip of `.settings-nav` pills above the content card. Active accent bar flips from `inset-inline-start: 0` to a `border-block-end` accent underline (per ROADMAP success criteria #4 verbatim). Tab-style scrolling preserves all 7 sections without forcing a hamburger interaction.

### Area 4: Activity & Tasks — keep tabs/filters or strip

- **D-13:** **Activity (`/activity`):** Keep All/Following tabs directly under `.page-head`; render handoff `.act-list` 3-col grid below. Strip the collapsible Statistics panel and the Settings sheet trigger. Tabs use HeroUI v3 Tabs styled with handoff tokens.
  - **Why:** All/Following is a real shipped follow feature; dropping it would regress an explicit user affordance. Statistics + settings sheet are heavy chrome with no handoff equivalents and no clear analyst value at the page level.
- **D-14:** **Activity row composition: bilingual i18n templates per `event_type`.** Researcher locates the `ActivityItem.event_type` enum (likely `approval / link / file / check / alert / comment` per handoff icon map). For each event type, produce a bilingual i18n template (`activity-page.events.{event_type}`) with interpolation slots for `who`, `what`, `where`. Composition in JSX: `time` (`.act-t` mono 10.5px ink-faint) · icon (handoff icon map: approval→check, link→link, file→file, check→check, alert→alert, comment→chat) · `<span class="act-who">{actor}</span> <span class="act-what">{action} <strong style="color: var(--ink); font-weight: 500">{entity}</strong> in </span><span class="act-where">{where}</span>`.
- **D-15:** **Tasks (`/tasks` — "My desk"):** Keep Assigned/Contributed tabs above the handoff `.tasks-list`. Strip the floating `useWorkCreation` FAB; add a "New task" primary button in `.page-head` action slot. Row anatomy verbatim handoff (checkbox + glyph + title+subtitle + priority chip + due). Row click → existing `TaskDetailPage`.
  - **Why:** Feature 025 US2 (Track Team Collaboration) explicitly shipped the Contributed tab — dropping it regresses a real user story. Inline `.page-head` action button is more handoff-consistent than a floating FAB.
- **D-16:** **Test gates per Phase 38/40/41 precedent (3 waves):**
  - **Wave 0 (infra):** `after-actions-list-all` Edge Function + `useAfterActionsAll` hook + i18n namespaces + size-limit budget update + Playwright fixtures (mock briefs/after-actions/tasks/activity/settings data) + skeleton primitives if not already shipped.
  - **Wave 1 (parallel):** 5 page reskins — Briefs / After-actions / Tasks / Activity / Settings — each with skeleton + empty state + RTL pass + ≥44×44px touch targets.
  - **Wave 2 (gates):** 5 pages × LTR + AR @ 1280px = **10 visual regression baselines** (`maxDiffPixelRatio: 0.02`); Playwright E2E (~2-3 cases per page covering golden path + RTL chevron flip / mobile reflow / tab+filter behavior / click-target navigation); axe-core WCAG AA zero violations; size-limit gate; mobile (≤768px) covered by render assertions only — no snapshot. Defer legacy primitive cleanup to Phase 43.

### RTL & Responsive (carried from prior phases)

- **D-17:** **Logical properties only** (`ms-/me-/ps-/pe-/start-/end-/inset-inline-*/border-inline-*/border-block-*`). Handoff CSS already uses logical properties throughout. CLAUDE.md mandate; Phase 40 D-16 / Phase 41 D-09 precedent.
- **D-18:** **Touch targets ≥44×44px** for `.task-box` checkboxes, all CTAs, table rows, card click targets, settings nav pills (Phase 40 D-18, Phase 41 D-11).
- **D-19:** **Card-view fallback / responsive reflow** at 320 / 768 / 1280px. Briefs grid `auto-fill, minmax(320px, 1fr)` already responsive. After-actions table reflows to row cards under 768px (Phase 40 D-17 precedent). Activity / Tasks lists already row-based — pad/gap reduce per `--row-h` density. Settings nav handles its own collapse per D-12.
- **D-20:** **Bilingual digit rendering** — page counts, decisions/commitments counts, dates' numeric components, days-overdue all rendered via existing `toArDigits` utility (Phase 39/40/41 precedent).

### Claude's Discretion

- **Primitive cascade choices** (per CLAUDE.md):
  - **HeroUI v3 Tabs** for Activity All/Following + Tasks Assigned/Contributed — accessible primitives styled with handoff chip tokens.
  - **HeroUI v3 Modal** for `BriefGenerationPanel` and `BriefViewer` dialogs (consistent with Phase 41 dossier drawer's HeroUI cascade); Radix Dialog (`Sheet`) is the fallback if HeroUI doesn't cleanly support the layout shape.
  - HTML `<table>` styled with handoff `.tbl` class for After-actions (no library needed).
  - **No new component libraries.** Aceternity / Kibo / shadcn defaults remain banned per CLAUDE.md.
- **Empty states bilingual concise copy** for each page (researcher proposes exact phrasing; planner finalizes):
  - Briefs: "No briefs yet" / "لا توجد ملخصات بعد"
  - After-actions: "No after-action records yet" / "لا توجد سجلات بعد"
  - Tasks: "No tasks on your desk" / "لا توجد مهام على مكتبك"
  - Activity (All): "No activity yet" / "لا يوجد نشاط بعد"
  - Activity (Following): "Follow entities to see their activity" / "تابع الكيانات لمشاهدة نشاطها"
- **Skeleton anatomy per page**: row-shape skeletons match the body shape (card grid for Briefs, table rows for After-actions, list rows for Tasks/Activity, section card with field skeletons for Settings). Phase 38 D-11 precedent.
- **i18n namespace strategy**: researcher decides whether to extend existing per-feature namespaces (`activity-feed`, `briefs`, etc.) or create page-scoped namespaces (`briefs-page`, etc.) — same trade-off resolved in Phase 40 D-\* precedent. Default to extending existing namespaces.
- **`after-actions-list-all` Edge Function pagination**: researcher confirms expected record volume; if hundreds of records, default cursor-based pagination with limit=50 in the new function. Listed in deferred ideas if not needed for v1.
- **"Edit" button affordance in Settings forms**: even though forms stay inline, the section card's `.card-title` + `.card-sub` + Save button arrangement should match handoff visual hierarchy. Researcher proposes exact spacing/typography; planner locks.
- **Activity row event-type enum extension**: if `useActivityFeed`'s event types don't include all handoff icons (`approval / link / file / check / alert / comment`), researcher proposes a fallback (`dot` icon) for unknown types so rendering never breaks.

### Folded Todos

_None — no pending todos folded into Phase 42 scope._

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Handoff source of truth (verbatim port targets)

- `/tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx#L295-329` — `BriefsPage` JSX (page-head + auto-fill grid + card anatomy + status chip mapping)
- `/tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx#L331-365` — `AfterActionsPage` JSX (page-head + `.tbl` chrome + 6-column row + chevron `icon-flip`)
- `/tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx#L367-396` — `TasksPage` JSX (page-head + `.tasks-list` + `.task-row` 5-cell anatomy + done state)
- `/tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx#L398-421` — `ActivityPage` JSX (page-head + `.act-list` + `.act-row` 3-col grid + icon map + `act-who/act-what/act-where`)
- `/tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx#L423-465` — `SettingsPage` JSX (240px+1fr grid + 6 sections + edit-row + Edit button + bilingual labels)
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L73-100` — `.settings-nav` + `.active` + `inset-inline-start: 0` accent bar
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L201-208` — `.page` + `.page-head` + `.page-title` + `.page-sub` chrome
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L223-225` — `.btn-primary` chrome (consistent across all 5 pages' primary actions)
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L247-250` — `.chip-danger / .chip-warn / .chip-ok / .chip-info` (Briefs status, Tasks priority, After-actions optional)
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L261-265` — `.tbl` table chrome (After-actions)
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L341-350` — `.tasks-list / .task-row / .task-box / .task-title / .task-due` anatomy + done state
- `/tmp/inteldossier-handoff/inteldossier/project/src/app.css#L444-450` — `.act-list / .act-row / .act-t / .act-who / .act-what / .act-where` (3-col grid + accent-ink for `where`)
- `/tmp/inteldossier-handoff/inteldossier/project/reference/settings.png` — Settings page reference image (only PNG that exists for the 5 pages)

> **No reference PNGs exist for Briefs / After-actions / Tasks / Activity** in `/tmp/inteldossier-handoff/inteldossier/project/reference/`. Verbatim port from `pages.jsx` + `app.css` only. Phase 41 precedent for "no PNG" pages applies.

### Project requirements + roadmap

- `.planning/REQUIREMENTS.md` §"PAGE-01..05" — Briefs / After-actions / Tasks / Activity / Settings acceptance criteria (verbatim)
- `.planning/ROADMAP.md` §"Phase 42: remaining-pages" — Goal, Depends on (Phase 33 / 36 / 37), Success Criteria (5 items)
- `frontend/design-system/inteldossier_handoff_design/README.md` — voice, content rules, visual foundations (CLAUDE.md mandates reading this before any UI work)
- `frontend/design-system/inteldossier_handoff_design/colors_and_type.css` — token names + exact values

### Prior phase context (locked decisions feeding Phase 42)

- `.planning/phases/33-token-engine/33-CONTEXT.md` — Token utilities consumed by all 5 pages (`bg-surface / text-ink / text-ink-mute / text-ink-faint / border-line / bg-accent-soft / text-accent-ink / chip-ok / chip-warn / chip-info / chip-danger / var(--font-display) / var(--font-mono)`); `useDesignDirection / useDensity / useHue / useMode` hooks consumed by Settings → Appearance section per D-11
- `.planning/phases/34-tweaks-drawer/34-CONTEXT.md` — `TweaksDrawer` stays as topbar quick-access affordance; Settings becomes canonical control surface per D-11
- `.planning/phases/35-typography-stack/35-CONTEXT.md` — `var(--font-display)` consumed by `.page-title` (28px) and Briefs card titles (16px); Tajawal cascade for AR locale
- `.planning/phases/36-shell-chrome/36-CONTEXT.md` — AppShell + topbar; `<PageHeader/>` already implements handoff `.page-head / .page-title / .page-sub`
- `.planning/phases/37-signature-visuals/37-CONTEXT.md` — `<DossierGlyph flag={iso} size={18}/>` consumed by Tasks rows; `<Icon/>` set (`plus / check / link / file / alert / chat / dot / chevron-right / cog / sparkle / bell / shield / lock / people`) from `icons.jsx`
- `.planning/phases/38-dashboard-verbatim/38-CONTEXT.md` — D-02 verbatim handoff port pattern; D-09 wave structure; D-11 per-section Skeleton; D-13 visual regression at 1280px only
- `.planning/phases/39-kanban-calendar/39-CONTEXT.md` — D-06 stub pattern (aria-disabled + Coming soon tooltip) — available for any unfinished CTAs that emerge during planning
- `.planning/phases/40-list-pages/40-CONTEXT.md` — D-09 search debounce pattern (250ms client-side filter) — available for After-actions/Briefs if filters reintroduced; D-13 defer legacy primitive cleanup to Phase 43; D-16 logical properties only; D-17 mobile card-view fallback for tables; D-18 ≥44×44px touch targets
- `.planning/phases/41-dossier-drawer/41-CONTEXT.md` — D-12 visual regression at 1280px LTR + AR only (10 baselines for 5 pages × 2 locales); D-09/D-10 logical properties + mobile full-screen patterns; HeroUI v3 cascade preference for Modal/Drawer/Tabs

### Existing codebase entry points (reuse — do NOT rebuild)

- `frontend/src/components/layout/PageHeader.tsx` — handoff `.page-head` chrome (icon + title + subtitle + actions); reuse for all 5 pages
- `frontend/src/pages/Briefs/BriefsPage.tsx` — existing 591-line page (rewrite body to handoff card grid; preserve `BriefGenerationPanel` + `BriefViewer` dialogs)
- `frontend/src/components/ai/BriefGenerationPanel.tsx` — preserve via dialog trigger (D-05)
- `frontend/src/components/ai/BriefViewer.tsx` — preserve via card-click dialog (D-05)
- `frontend/src/routes/_protected/after-actions/index.tsx` — existing stub-CTA route (rewrite to handoff `.tbl`)
- `frontend/src/routes/_protected/after-actions/$afterActionId.tsx` — preserved row-click target
- `frontend/src/hooks/useAfterAction.ts` — `useAfterActions(dossierId, options?)` exists; **NEW `useAfterActionsAll(options?)` lands here** (D-01)
- `supabase/functions/after-actions-list/index.ts` — model for new `after-actions-list-all` function (D-01); **NEW `supabase/functions/after-actions-list-all/index.ts`** is created in Wave 0
- `frontend/src/pages/MyTasks.tsx` — existing 329-line `MyTasksPage` (rewrite body to handoff `.tasks-list`; preserve Assigned/Contributed tabs)
- `frontend/src/components/tasks/TaskCard.tsx` — replaced by handoff `.task-row` anatomy; researcher confirms whether to extend or replace
- `frontend/src/hooks/useTasks.ts` — `useMyTasks` + `useContributedTasks` preserved
- `frontend/src/pages/activity/ActivityPage.tsx` — existing 137-line page (rewrite body to handoff `.act-list`; strip statistics + settings sheet; preserve All/Following tabs)
- `frontend/src/components/activity-feed/EnhancedActivityFeed.tsx` — researcher decides whether to wrap in handoff grid or fully replace with new `<ActivityList>` row component
- `frontend/src/hooks/useActivityFeed.ts` — `useActivityFeed` preserved (data shape consumed by new row composition per D-14)
- `frontend/src/types/activity-feed.types.ts` — `ActivityItem.event_type` enum (researcher locks bilingual template per type per D-14)
- `frontend/src/pages/settings/SettingsPage.tsx` — existing 342-line page (rewrite chrome to handoff 240+1fr grid; preserve all 7 sections + react-hook-form forms)
- `frontend/src/components/settings/sections/{Profile,General,Appearance,Notifications,Security,Accessibility,DataPrivacy}SettingsSection.tsx` — preserved as inline forms; restyle only (D-10); rename "Security" → "Access & Security" terminology in i18n (D-09)
- `frontend/src/components/settings/SettingsLayout.tsx` + `SettingsNavigation.tsx` — rewritten to handoff `.settings-nav` + 240px+1fr grid + ≤768px pill row collapse (D-09 / D-12)
- `frontend/src/design-system/hooks/{useMode,useDesignDirection,useDensity,useHue}.ts` — consumed by `AppearanceSettingsSection` per D-11
- `frontend/src/components/tweaks/TweaksDrawer.tsx` — stays as topbar quick-access affordance (D-11)
- `frontend/src/i18n/index.ts` (or wherever `switchLanguage` lives) — consumed by `GeneralSettingsSection` for language preference
- `frontend/src/components/signature-visuals/index.ts` — `<DossierGlyph/>` for Tasks rows; `<Icon/>` set for chevrons + activity event icons + settings nav glyphs
- `frontend/public/locales/{en,ar}/*.json` — extend or create namespaces per page (researcher proposes; default = extend existing `briefs / after-actions / activity-feed / settings` namespaces)

### Existing dependencies (already installed — do NOT add new)

- `@heroui/react` v3 (Modal, Tabs)
- `@radix-ui/react-dialog` (Sheet — fallback dialog primitive)
- `@tanstack/react-router` (`useNavigate`, route definitions)
- `@tanstack/react-query` (`useQuery`, `useMutation`, `useInfiniteQuery`)
- `react-hook-form` + `@hookform/resolvers/zod` + `zod` (Settings forms)
- `react-i18next` (per-namespace translations)
- `axe-core` + Playwright + `size-limit` (Phase 38/40/41 gates)
- `lucide-react` (legacy icon set being phased out — researcher confirms whether to migrate any remaining usage to Phase 37 `<Icon/>` set this phase or defer to Phase 43)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`<PageHeader/>`** (`frontend/src/components/layout/PageHeader.tsx`): already implements handoff `.page-head` / `.page-title` / `.page-sub` / actions slot. Reuse on all 5 pages — no new chrome component.
- **`BriefGenerationPanel` + `BriefViewer`** (`frontend/src/components/ai/`): preserved via dialog triggers — zero feature regression on Briefs.
- **`useAfterAction` hooks** (`frontend/src/hooks/useAfterAction.ts`): per-dossier hooks already shipped; new `useAfterActionsAll` lands here.
- **`useMyTasks` + `useContributedTasks`** (`frontend/src/hooks/useTasks.ts`): preserved as-is; powers the Assigned/Contributed tabs above the new `.tasks-list`.
- **`useActivityFeed`** (`frontend/src/hooks/useActivityFeed.ts`): preserved; new row composition consumes its `ActivityItem.event_type` enum.
- **All 7 settings sections** (`frontend/src/components/settings/sections/*.tsx`): preserved as inline forms; restyle only.
- **Phase 33/34 design hooks**: `useDesignDirection / useDensity / useHue / useMode` already exposed by `DesignProvider` — render in Appearance section card.
- **HeroUI v3 Modal + Tabs**: already imported in the codebase (Phase 41 used Drawer); reuse for Briefs dialogs + Activity/Tasks tabs.
- **`<DossierGlyph flag={iso} size={18}/>`** (`frontend/src/components/signature-visuals`): consumed by Tasks rows.
- **`<Icon/>` set** (Phase 37): provides `plus / check / link / file / alert / chat / dot / chevron-right / cog / sparkle / bell / shield / lock / people` — covers all 5 pages' icon needs.
- **`toArDigits` utility**: bilingual digit rendering for page counts, dates, decisions/commitments counts.
- **Skeleton primitive**: shape-matching loading states per Phase 38 D-11 precedent.
- **`icon-flip` class** in handoff CSS: chevron RTL flip for After-actions row-end + any other row chevrons.

### Established Patterns

- **Verbatim handoff port** (Phase 35/37/38/39/40/41 precedent): 1:1 preservation of markup, classnames, timings — no improvisation.
- **3-wave structure** (Phase 38/40/41): Wave 0 infra → Wave 1 pages parallel → Wave 2 gates.
- **Per-section `<Skeleton>`** (Phase 38 D-11): shape-matching loading; no fullscreen spinner.
- **Logical properties only** (CLAUDE.md mandate): handoff CSS already uses logical properties throughout.
- **Stub pattern** (Phase 39 D-06): `aria-disabled="true"` + "Coming soon" tooltip — available if any CTAs need it (none expected this phase).
- **Click → existing detail surface** (Phase 39 D-09 / Phase 40 D-10 / Phase 41 D-08): each page's row/card click reuses the existing detail surface without rewiring.
- **Visual regression at 1280px LTR + AR only** (Phase 38 D-13 / Phase 40 D-06 / Phase 41 D-12): mobile breakpoints by render assertion.
- **No raw hex / no card shadows / no marketing voice / no emoji in copy** (CLAUDE.md design rules): all 5 pages must comply.
- **No `textAlign: "right"` / use `text-start` + `dir`** (CLAUDE.md RTL rules): preserved in this phase.

### Integration Points

- **Phase 41 dossier drawer**: After-actions row click goes to detail page (NOT drawer) — consistent with the "lists are destinations" pattern from Phase 41 D-01. If a future phase wants drawer-from-after-action-row, that's its own decision.
- **Phase 39 work-item detail dialog**: Tasks row click reuses the existing `TaskDetailPage` route, not the dialog. This page (`/tasks`) is a destination view; per-row dialog overlay would be a different decision.
- **Phase 40 list pages**: completely orthogonal — Phase 42 doesn't touch lists. Lists keep Phase 40 wiring.
- **Phase 38 dashboard widgets**: completely orthogonal — Phase 42 doesn't touch widgets.
- **Phase 33 token system + Phase 34 TweaksDrawer**: Settings → Appearance section becomes the canonical control surface (D-11). TweaksDrawer + Settings share hooks; both stay shipped.
- **Phase 43 sweep**: legacy primitive cleanup deferred (Phase 40 D-13 precedent). Phase 42 leaves `DataTable` etc. untouched if still imported.

</code_context>

<specifics>
## Specific Ideas

- **Briefs card "page count" rendering**: handoff renders `12 pp` in `var(--font-mono)` 11px `var(--ink-faint)`. If existing brief schema doesn't have a `pages` count field, researcher proposes a fallback (compute from content length / locked at planner / show "—" if unknown).
- **Tasks `.task-box` checkbox**: 14×14px `1.5px solid var(--ink-faint)` border, 3px radius. Done state: `var(--ok)` background + border + a 14×14 SVG checkmark (`<path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2"/>`) per handoff line 90. Whole row gets `opacity: 0.45` + line-through on title when done. Click toggles done state — researcher confirms whether this persists to backend or stays optimistic + locally-stateful (likely persists via existing `useUpdateTask` mutation).
- **Activity row composition**: `<span class="act-who">{actor}</span> <span class="act-what">{action} <strong style={{color: "var(--ink)", fontWeight: 500}}>{entity}</strong> in </span><span class="act-where">{where}</span>` exactly per handoff line 405-410. The `where` color `var(--accent-ink)` is what makes the row visually distinctive — must not be lost in any restyle.
- **Settings `.settings-nav.active::before`**: `inset-inline-start: 0` accent bar implementation — handoff line 97-100. Must use `inset-inline-start` (not `left`) so RTL flip is automatic.
- **Settings mobile (≤768px)**: per D-12, the active accent bar flips from `inset-inline-start: 0` (vertical bar on the start edge) to `border-block-end` accent underline (horizontal bar on the bottom edge). New CSS rule under `@media (max-width: 768px)`.
- **After-actions row hover**: handoff `.tbl tr:hover td { background: var(--line-soft); }` — preserve.
- **Briefs grid responsive**: `repeat(auto-fill, minmax(320px, 1fr))` automatically reflows. At 320px viewport, becomes single column. No explicit `@media` rule needed.
- **`useAfterActionsAll` cache key**: `['after-actions', 'all', options]` — distinct from per-dossier `['after-actions', dossierId, options]` so cache invalidations don't collide.
- **Activity tabs as HeroUI v3 Tabs**: styled with handoff token colors — active tab background `var(--accent-soft)`, text `var(--accent-ink)`, inactive `var(--ink-mute)`. Researcher confirms HeroUI Tabs accepts these via `classNames` prop.
- **Tasks "New task" button**: `btn-primary` chrome in `.page-head` action slot — opens existing `useWorkCreation` flow (whatever dialog/sheet it currently uses) without rebuilding the creation surface itself.
- **Settings section title typography**: `.card-title` rendered with `var(--font-display)` 16px 500 weight + small `.card-sub` 11.5px `var(--ink-mute)` per handoff line 446-447 (same convention as the kpi-mini-strip labels).
- **Bilingual digit rendering** for page counts, decisions/commitments counts, due dates' day numbers, days-ago in Activity time column — all via `toArDigits` utility (Phase 39/40/41 precedent).

</specifics>

<deferred>
## Deferred Ideas

- **Search/filter pills on After-actions table** (Phase 40 D-09 pattern) — add later if usage demands.
- **Date range filter (year/quarter) on After-actions** — defer to a later analytics-oriented phase.
- **Drafts / edit-requested status views on After-actions** — Edge Function supports the query param; UI affordance later.
- **Briefs reference number badge on cards** — handoff has no badge; revisit if analyst tracking demands surface.
- **Briefs summary excerpt on cards** — would break grid density; revisit at a future polish phase.
- **Briefs tags chip row on cards** — would unbalance auto-fill grid; defer.
- **Briefs inline search + category filter** — strip this phase; reintroduce if usage demands.
- **Dedicated `/briefs/generate` route for AI brief generation** — current dialog-from-PageHead is sufficient; revisit if AI flow becomes complex.
- **Backend schema migration adding `status` enum column to briefs** — defer to a separate backend phase if review/awaiting workflow becomes formalized.
- **Settings: edit-row + dialog-per-field pattern** — rejected (form ergonomic regression). Revisit only if user research shows analysts prefer it.
- **Settings: dedicated `/settings/accessibility` route** — rejected (would lose discoverability of a11y controls in a bilingual + RTL system).
- **Replacing `/tasks` with a redirect to `/kanban`** — rejected (different views: personal queue vs team workboard).
- **Activity statistics panel** — stripped this phase; revisit if analyst feedback wants it back as a dashboard widget.
- **Activity settings sheet trigger** — stripped; preferences move to Settings → Notifications.
- **Tasks floating action button (FAB)** — stripped in favor of `.page-head` action button; revisit if mobile-only flows demand it.
- **Legacy primitive cleanup** (`DataTable`, `AuditLogTable`, `ResponsiveTable`, `EntityComparisonTable`, etc.) — Phase 40 D-13 deferred to Phase 43; same applies.
- **Mobile-breakpoint visual regression snapshots** — Phase 38 D-13 / Phase 40 D-06 / Phase 41 D-12 precedent: render assertions only.
- **Global RTL/a11y/responsive sweep** — Phase 43 explicit ROADMAP boundary.
- **Tasks: drawer-from-row preview** — out of scope; row click goes to existing TaskDetailPage.
- **After-actions: drawer-from-row preview opening Phase 41 dossier drawer** — out of scope; row click goes to per-record detail page.
- **`toArDigits` migration sweep** — if any of the 5 pages currently render Western-Arabic digits in AR locale, the planner adds those as targeted fixes within Phase 42; broader audit defers to Phase 43.
- **`lucide-react` → Phase 37 `<Icon/>` migration** — defer to Phase 43 unless researcher determines specific imports interfere with Phase 42 visual fidelity.

### Reviewed Todos (not folded)

_None — no pending todos surfaced from `cross_reference_todos`._

</deferred>

---

_Phase: 42-remaining-pages_
_Context gathered: 2026-05-02_
