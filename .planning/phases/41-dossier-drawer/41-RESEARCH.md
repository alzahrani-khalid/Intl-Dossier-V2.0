# Phase 41: dossier-drawer — Research

**Researched:** 2026-05-01
**Domain:** UI overlay surface (TanStack Router search-param driven), Radix Dialog primitive, design-token CSS port, RTL-flipped overlay
**Confidence:** HIGH (codebase-verified)

## Summary

Phase 41 ports the handoff `DossierDrawer` (pages.jsx#L469-559 + app.css#L425-446) into a single AppShell-mounted drawer that any protected route can open via URL search params (`?dossier=<id>&dossierType=<type>`). The data layer is solved — `useDossierOverview` and `useDossier` already deliver everything the drawer needs in one network round-trip, and the `WorkItemsSection.by_source.commitments` array is preferred over a generic `items.filter()`. The primitive choice is **Radix `Sheet`** (`frontend/src/components/ui/sheet.tsx`), not HeroUI v3 Drawer — Sheet already bakes the `drawer-overlay`/`drawer`/`drawer-head`/`drawer-title` classnames the handoff CSS expects, uses `start-0`/`end-0` (logical) for placement, and includes `ltr:`/`rtl:` slide-direction modifiers. HeroUI v3 Drawer takes physical `'left'`/`'right'` placement (the AppShell mobile drawer manually flips it via `isRTL ? 'right' : 'left'`) and does not pre-bind the handoff classnames. Using Sheet is closer to the locked verbatim port and avoids re-skinning HeroUI chrome through token overrides.

Two CONTEXT.md hypotheses do not survive verification:

1. The engagement-create route is **`/dossiers/engagements/create`** (a wizard at top-level), NOT `/dossiers/{type}/$dossierId/engagements/create`. The wizard schema does not currently accept a `dossier_id` prefill; we get the dossier-context onto the new engagement only by adding a new optional `defaultDossierId` to `CreateEngagementPage` + `useCreateDossierWizard` (~10 lines) **OR** by deferring the prefill (CTA still navigates correctly; analyst types the dossier on the participants step). Recommend the second path for Phase 41 to keep scope tight; capture prefill as a Phase 42 polish item.
2. CONTEXT.md describes the calendar trigger as `linkedItemType==='dossier' → openDossier({ id: linkedItemId })`. The actual `CalendarEvent` shape uses `dossier_id` (UUID) + an optional embedded `dossier: { id, type, name_en, name_ar }`. The trigger should branch on `event.dossier_id` and read `event.dossier?.type` (or look the dossier up on `useDossier(event.dossier_id)` if absent). The `linkedItemType`/`linkedItemId` props on `UnifiedCalendar` are filter-scope props (entry-form passthrough), not per-event dossier identity.

**Primary recommendation:** Ship Wave 0 with (a) Radix Sheet as primitive, (b) per-route `validateSearch` extension on every protected route that needs the drawer (no central schema today — see open question 7), (c) `useDossierDrawer()` returning `openDossier`/`closeDossier`/`open`/`dossierId`/`dossierType`, (d) a new `dossier-drawer` namespace registered in `frontend/src/i18n/index.ts` (NOT `frontend/public/locales/...`). Wave 1 ports the head + 4 sections in parallel. Wave 2 runs 10 Playwright cases + 2 visual regressions + axe + size-limit.

## Architectural Responsibility Map

| Capability                         | Primary Tier                              | Secondary Tier | Rationale                                                                         |
| ---------------------------------- | ----------------------------------------- | -------------- | --------------------------------------------------------------------------------- |
| Drawer overlay rendering           | Browser / Client                          | —              | Pure visual surface above current route; portal-mounted                           |
| URL search-param state             | Browser / Client (TanStack Router)        | —              | TanStack Router owns the URL; navigation hook mutates `?dossier=`                 |
| Dossier core data fetch            | API / Backend                             | —              | `useDossier(id)` → existing dossier-api endpoint                                  |
| Aggregate overview data            | API / Backend                             | —              | `useDossierOverview` → existing aggregate endpoint, sole data hook (D-03)         |
| Focus trap + ESC dismiss           | Browser / Client (Radix Dialog)           | —              | Built into Sheet primitive                                                        |
| RTL slide direction                | Browser / Client (CSS logical properties) | —              | `inset-inline-end` flips automatically; Sheet `side="right"` already uses `end-0` |
| Trigger wiring (widgets, calendar) | Browser / Client                          | —              | One-line `onClick` swap on existing widget rows                                   |
| Commitment row → work-item dialog  | Browser / Client                          | —              | Reuses existing dialog (Phase 39 D-09)                                            |
| Visual regression baselines        | Browser / Client (Playwright)             | —              | 1280×800 LTR + AR snapshots, frozen clock                                         |

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Drawer is for inline preview from dashboard + calendar; lists keep Phase 40 row navigation. Open triggers: RecentDossiers / MyTasks / OverdueCommitments / ForumsStrip + calendar events with a dossier link. The `/dossiers/$id/overview` aggregated page is preserved. Drawer head includes "Open full dossier" CTA → `getDossierDetailPath(id, type)`.
- **D-02:** URL search param mounting — `?dossier=<id>&dossierType=<type>` on the current route. `closeDossier()` mutates search params (no full route change). Schema declared via TanStack Router `validateSearch`.
- **D-03:** Single `useDossierOverview` aggregate hook with `include_sections: ['work_items', 'calendar_events', 'activity_timeline']`. Activity uses top-4 slice. Per-section `<Skeleton>` placeholders.
- **D-04:** KPI mapping (locked):
  - `engagements` → `stats.calendar_events_count`
  - `commitments` → `work_items.by_source.commitments.length`
  - `overdue` → `stats.overdue_work_items`
  - `documents` → `stats.documents_count`
- **D-05:** `Log engagement` CTA wired; `Brief` + `Follow` are visual stubs (`aria-disabled="true"` + `title="Coming soon"` + `opacity: 0.55`).
- **D-06:** `Open full dossier` CTA → `navigate({ to: getDossierDetailPath(id, type) })`. Drawer closes via search-param removal that the navigation triggers.
- **D-07:** Brief + Follow deferred destinations.
- **D-08:** Open Commitment row click → existing work-item detail dialog (Phase 39 D-09 surface). Drawer stays open behind dialog (z-index stack: drawer at z-41, dialog at z-50+).
- **D-09:** Logical properties only for drawer chrome.
- **D-10:** Mobile (≤640px) full-screen — `width: 100vw; border-inline-start: 0; box-shadow: none`.
- **D-11:** Touch targets ≥44×44px.
- **D-12:** Visual regression at 1280px LTR + AR only — 2 baselines, `maxDiffPixelRatio: 0.02`.
- **D-13:** 10 Playwright E2E cases (enumerated in CONTEXT.md).
- **D-14:** axe-core WCAG AA zero violations + size-limit budget update.
- **D-15:** 3-wave parallel structure (Wave 0 infra, Wave 1 sections in parallel, Wave 2 gates).

### Claude's Discretion

- Primitive choice (HeroUI v3 Drawer vs Radix Sheet) — researcher decides.
- Sensitivity chip threshold — researcher confirms.
- Meta strip composition — researcher maps each segment to a real source.
- Recent Activity row composition — researcher maps `actor_name` / `action_label` / `created_at` to actual response field names.
- Bilingual digit rendering via existing `toArDigits`.
- Empty states per section — bilingual concise copy.
- CTA i18n keys (specified).
- Animation timing — researcher checks handoff `app.css` for transition rules; if absent, use `var(--dur)` with `ease-out`.

### Deferred Ideas (OUT OF SCOPE)

- `Brief` / `Follow` CTA wiring.
- List-row preview affordance / ⌘+click.
- Activity-timeline infinite scroll inside the drawer.
- Drawer-stacked-on-drawer for related dossiers.
- Engagement-source work-item filter (fallback path if `calendar_events_count` is wrong).
- Replacing `/dossiers/$id/overview` with the drawer.
- Mobile breakpoint visual regression snapshots.
- "📍 Global" location segment as anything other than the value already on `dossier.metadata` or a static fallback.

## Phase Requirements

| ID        | Description                                                                                                                                                                    | Research Support                                                                                                                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DRAWER-01 | User can open a 720px dossier drawer that slides in from inline-end with backdrop and `-24px 0 60px rgba(0,0,0,.25)` shadow                                                    | Handoff CSS L425-432 verified; Radix Sheet `side="right"` already uses `inset-y-0 end-0` (logical). Width `min(720px, 92vw)` per L427.                                                                                                   |
| DRAWER-02 | Drawer shows sticky head (DOSSIER + CONFIDENTIAL chips, display title, meta strip, CTA row), mini-KPI strip, italic-serif summary, Upcoming, Recent Activity, Open Commitments | All data sources verified in `useDossierOverview` response: `stats.{calendar_events_count, overdue_work_items, documents_count}`; `work_items.by_source.commitments`; `calendar_events.upcoming`; `activity_timeline.recent_activities`. |
| DRAWER-03 | Drawer flips to slide from inline-start in RTL and goes full-screen at ≤640px with focus trap and ESC                                                                          | Sheet primitive has `ltr:slide-in-from-right rtl:slide-in-from-left` and Radix Dialog provides focus trap + ESC. Mobile full-screen via media query overriding `width: 100vw` (handoff L855).                                            |

## Standard Stack

### Core (already installed — DO NOT add new)

| Library                  | Version (verified) | Purpose                                                 | Why Standard                                                                                                                                                    |
| ------------------------ | ------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@radix-ui/react-dialog` | already installed  | Drawer primitive (focus trap + ESC + Portal + backdrop) | Sheet wrapper at `frontend/src/components/ui/sheet.tsx` already pre-binds `drawer-overlay`/`drawer-head`/`drawer-title` classnames matching handoff CSS exactly |
| `@tanstack/react-router` | already installed  | `useNavigate` + `validateSearch` for URL state          | Phase 40 D-10 + every list page already use this for filter state; consistent with codebase                                                                     |
| `@tanstack/react-query`  | already installed  | Cache for `useDossierOverview`, `useDossier`            | Same cache key + dedupe across all drawer-open events                                                                                                           |
| `react-i18next`          | already installed  | Bilingual labels via `dossier-drawer` namespace         | Project i18n pattern is `frontend/src/i18n/{en,ar}/<namespace>.json` registered in `i18n/index.ts` (NOT `frontend/public/locales/`)                             |
| `axe-core`               | already installed  | WCAG AA zero-violation gate                             | Phase 38/40 precedent                                                                                                                                           |
| `size-limit`             | `^12.0.1`          | Bundle budget gate                                      | Phase 40 `.size-limit.json` already configured                                                                                                                  |

### Supporting (already in bundle — re-use)

| Helper                                        | Path                                                                                       | Purpose                                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `useDossierOverview`                          | `frontend/src/hooks/useDossierOverview.ts`                                                 | Sole data hook (D-03)                                                                                            |
| `useDossier`                                  | `frontend/src/domains/dossiers/hooks/useDossier.ts` (re-exported via `@/hooks/useDossier`) | Core dossier (`name_en`, `name_ar`, `description_en`, `description_ar`, `sensitivity_level`, `metadata`, `type`) |
| `toArDigits`                                  | `frontend/src/lib/i18n/toArDigits.ts` (NOT `utils/`)                                       | Arabic-Indic digit rendering                                                                                     |
| `getDossierDetailPath` / `isValidDossierType` | `frontend/src/lib/dossier-routes.ts`                                                       | Open-full-dossier CTA + search-param validation                                                                  |
| `sensitivityChipClass` / `SENSITIVITY_CHIP`   | `frontend/src/components/list-page/sensitivity.ts`                                         | Chip class lookup (see open question 1 — there is a label-mapping ambiguity)                                     |
| `<DossierGlyph/>`                             | `frontend/src/components/signature-visuals/index.ts`                                       | Inline glyphs in Upcoming + commitment rows                                                                      |
| `<Sheet/>` + `<SheetContent/>` etc.           | `frontend/src/components/ui/sheet.tsx`                                                     | Drawer primitive                                                                                                 |
| `LtrIsolate`                                  | `frontend/src/components/ui/ltr-isolate.tsx`                                               | Mono digits stay LTR inside RTL row (used by KCard, OverdueCommitments)                                          |
| `useDirection`                                | `frontend/src/hooks/useDirection.ts`                                                       | `{ direction, isRTL }`                                                                                           |

### Alternatives Considered

| Instead of                           | Could Use                                     | Tradeoff                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Radix Sheet                          | HeroUI v3 Drawer                              | HeroUI placement is physical (`'left'`/`'right'`) and AppShell already does manual `isRTL ? 'right' : 'left'` flip. We'd then need to re-skin HeroUI chrome through tokens to match handoff `.drawer-head`/`.drawer-title` styles. Sheet ships with the right classnames already. Pick Sheet.                                                                            |
| Per-route `validateSearch` extension | Centralized search schema on `_protected.tsx` | The protected layout (`frontend/src/routes/_protected.tsx`) currently has no `validateSearch` — the file route was never used as a search-schema host. Each list/detail route declares its own `validateSearch`. Adding a centralized schema is a refactor that touches every route's search shape. Per-route extension keeps blast radius small. (See open question 7.) |
| Inline drawer mount on each page     | One AppShell-mounted instance                 | One instance + URL state means single source of truth, single cache, single focus trap; matches D-02.                                                                                                                                                                                                                                                                    |

**Installation:** No new packages required. The `dossier-drawer` namespace gets two new JSON files registered in `i18n/index.ts`.

**Version verification:** Sheet primitive already in repo. `@heroui/react` v3 confirmed used by AppShell (`Drawer, useOverlayState`). All other packages already pinned in `frontend/package.json`.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Trigger surfaces                                                       │
│  • RecentDossiers / MyTasks / OverdueCommitments / ForumsStrip widgets  │
│  • UnifiedCalendar event onClick (when event.dossier_id is set)         │
│  • Deep link refresh: ?dossier=<id>&dossierType=<type>                  │
│        │                                                                │
│        ▼                                                                │
│  useDossierDrawer().openDossier({ id, type })                           │
│        │  navigate({ search: prev => ({ ...prev, dossier: id, ... }) }) │
│        ▼                                                                │
│  TanStack Router URL state ────► Route.useSearch() reads dossier+type   │
│        │                                                                │
│        ▼                                                                │
│  AppShell-mounted <DossierDrawer/> (one instance, portal via Radix)     │
│        │                                                                │
│        ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Sheet (Radix Dialog)                                            │    │
│  │  • Overlay (drawer-overlay class, z-40)                         │    │
│  │  • Content (drawer class, z-41, side="right")                   │    │
│  │     ├── DrawerHead (sticky)                                     │    │
│  │     │    ├─ chip row [DOSSIER] [CONFIDENTIAL?] [✕]              │    │
│  │     │    ├─ drawer-title (display font)                         │    │
│  │     │    ├─ drawer-meta (location · lead · count · last touched)│    │
│  │     │    └─ CTA row [Log engagement] [Brief*] [Follow*] [Open full]│ │
│  │     └── DrawerBody (scroll)                                     │    │
│  │          ├─ kpi-mini-strip (4 cells)                            │    │
│  │          ├─ Summary (italic serif)                              │    │
│  │          ├─ Upcoming (week-list, top 2)                         │    │
│  │          ├─ Recent activity (act-list, top 4)                   │    │
│  │          └─ Open commitments (overdue-item rows)                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│        ▲                                ▲                               │
│        │ useDossier(id)                │ useDossierOverview(id, {       │
│        │ (core fields)                 │   include_sections: [          │
│        │                               │     'work_items',              │
│        │                               │     'calendar_events',         │
│        │                               │     'activity_timeline'] })    │
│        ▼                                ▼                               │
│  Backend: dossier-api endpoint    Backend: dossier-overview endpoint    │
└─────────────────────────────────────────────────────────────────────────┘

Click within drawer:
  • commitment row  → existing work-item detail dialog (z-50+, drawer stays in DOM behind it)
  • Open full dossier → navigate to /dossiers/{type}/$id (next route's schema drops ?dossier=)
  • Log engagement → navigate to /dossiers/engagements/create
```

### Recommended Project Structure

```
frontend/src/
├── components/
│   └── dossier/
│       └── DossierDrawer/                       # NEW
│           ├── DossierDrawer.tsx                # shell mount + Sheet
│           ├── DrawerHead.tsx                   # chips + title + meta + CTA row
│           ├── DrawerMetaStrip.tsx              # location · lead · count · last touched
│           ├── DrawerCtaRow.tsx                 # Log engagement / Brief stub / Follow stub / Open full
│           ├── MiniKpiStrip.tsx                 # 4 cells, baseline-aligned
│           ├── SummarySection.tsx               # italic serif paragraph
│           ├── UpcomingSection.tsx              # top-2 calendar events
│           ├── RecentActivitySection.tsx        # top-4 activities, act-row grid
│           ├── OpenCommitmentsSection.tsx       # overdue-item rows
│           ├── DrawerSkeleton.tsx               # per-section skeletons
│           └── __tests__/
│               └── DossierDrawer.test.tsx
├── hooks/
│   └── useDossierDrawer.ts                      # NEW — open/close/state
├── lib/
│   └── i18n/
│       └── relativeTime.ts                      # NEW — bilingual relative time formatter (see open question 5)
├── i18n/
│   ├── en/dossier-drawer.json                   # NEW
│   └── ar/dossier-drawer.json                   # NEW
└── routes/
    └── _protected.tsx                           # MODIFIED — add validateSearch (see open question 7)
```

### Pattern 1: URL-driven overlay state (TanStack Router)

**What:** Mutate search params instead of local React state.
**When to use:** Any overlay that should be deep-linkable + browser-back-dismissable + refresh-survivable.

```typescript
// Source: TanStack Router docs (verified) + frontend/src/routes/_protected/dossiers/countries/index.tsx pattern
// frontend/src/hooks/useDossierDrawer.ts (NEW)
import { useNavigate, useSearch, useRouterState } from '@tanstack/react-router'

export interface DossierDrawerSearch {
  dossier?: string // dossier UUID
  dossierType?: string // 'country' | 'organization' | ... — required for KPI labels + Open-full-dossier path
}

export function useDossierDrawer() {
  const navigate = useNavigate()
  // strict: false → reads any search shape, returns undefined if not present
  const search = useSearch({ strict: false }) as DossierDrawerSearch
  const open = typeof search.dossier === 'string' && search.dossier.length > 0

  const openDossier = ({ id, type }: { id: string; type: string }) =>
    navigate({
      search: (prev: any) => ({ ...prev, dossier: id, dossierType: type }),
      replace: false, // browser-back closes drawer
    })

  const closeDossier = () =>
    navigate({
      search: (prev: any) => {
        const { dossier, dossierType, ...rest } = prev
        return rest
      },
      replace: true, // close is non-historic
    })

  return {
    open,
    dossierId: open ? search.dossier : null,
    dossierType: open ? search.dossierType : null,
    openDossier,
    closeDossier,
  }
}
```

### Pattern 2: Radix Sheet with handoff CSS classnames (verbatim port)

**What:** Reuse the existing Sheet primitive; let CSS do the visual port.
**When to use:** Any handoff component that has a CSS contract — don't fight the primitive's chrome through Tailwind, just override via `.drawer-*` class hooks.

```typescript
// Source: frontend/src/components/ui/sheet.tsx (verified)
// frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx (NEW)
import { Sheet, SheetContent, SheetPortal } from '@/components/ui/sheet'
import { useDossierDrawer } from '@/hooks/useDossierDrawer'

export function DossierDrawer() {
  const { open, dossierId, dossierType, closeDossier } = useDossierDrawer()
  if (!open || !dossierId) return null
  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) closeDossier() }}>
      <SheetContent
        side="right"  // Sheet's "right" already maps to inset-y-0 end-0 (logical) — flips in RTL
        className="drawer w-[min(720px,92vw)] max-md:w-screen border-inline-start sm:[box-shadow:-24px_0_60px_rgba(0,0,0,0.25)] max-md:border-0 max-md:shadow-none p-0 gap-0"
        accessibleTitle="Dossier quick-look"
      >
        <DrawerHead id={dossierId} type={dossierType} onClose={closeDossier} />
        <DrawerBody id={dossierId} />
      </SheetContent>
    </Sheet>
  )
}
```

### Pattern 3: Per-section Skeleton (Phase 38 D-11)

```tsx
// Source: Phase 38 dashboard-widgets/WidgetSkeleton.tsx (verified)
function MiniKpiStripSkeleton() {
  return (
    <div className="kpi-mini-strip">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="kpi-mini">
          <Skeleton className="h-[22px] w-8" />
          <Skeleton className="h-[11px] w-16" />
        </div>
      ))}
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Don't manually flip slide direction in JS** — Sheet already has `ltr:slide-in-from-right rtl:slide-in-from-left`; nothing to do.
- **Don't put `text-right` or `textAlign: 'right'` anywhere** — CLAUDE.md mandate. Use `text-end` or rely on the parent `dir`.
- **Don't add a second `validateSearch` block per route** — extend the existing per-route schema (see open question 7 for surface list).
- **Don't filter `work_items.items` for commitments** — `work_items.by_source.commitments` is already pre-filtered in the API response; cleaner + less brittle.
- **Don't trust handoff inline `style={{padding:6, marginTop:12}}`** — port to design tokens (`var(--gap-sm)`, `var(--gap)`) so density swap works.
- **Don't render the drawer when `dossierId` is undefined** — keeps DOM clean, avoids wasted query.

## Don't Hand-Roll

| Problem                       | Don't Build                                | Use Instead                                                                                                                       | Why                                                                                |
| ----------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Focus trap                    | Manual focus management                    | Radix Dialog (via Sheet)                                                                                                          | Radix already implements WAI-ARIA dialog spec, including return-focus-on-close     |
| ESC dismiss                   | `addEventListener('keydown')` in component | Sheet's built-in ESC + `onOpenChange`                                                                                             | Sheet emits `onOpenChange(false)` on ESC; we just call `closeDossier()`            |
| Overlay click dismiss         | Custom backdrop element                    | Sheet `<SheetOverlay/>`                                                                                                           | Already has `data-state` animations + click-outside-to-close                       |
| RTL slide direction           | Conditional `transform`                    | `ltr:slide-in-from-right rtl:slide-in-from-left`                                                                                  | Already in `sheetVariants.side.right`                                              |
| Bilingual digit rendering     | `String.replace` per call site             | `toArDigits(value, lang)`                                                                                                         | Phase 39/40 precedent                                                              |
| Relative time formatting      | New library install                        | `formatDistanceToNow` from `date-fns` (already in bundle, used by RecentDossiers) + small wrapper for handoff "yday/2d/4d" format | RecentDossiers already imports `date-fns/locale` `ar`/`enUS` — extend that pattern |
| Sensitivity-chip class lookup | New if/else ladder                         | `sensitivityChipClass(level)`                                                                                                     | Existing utility from list-page primitives                                         |
| Type-aware route generation   | String concat                              | `getDossierDetailPath(id, type)`                                                                                                  | Existing centralized helper                                                        |
| Search-param schema parsing   | Custom parser                              | TanStack Router `validateSearch` per-route                                                                                        | Codebase pattern, type-safe                                                        |

**Key insight:** The drawer is overwhelmingly composition + CSS — the heavy lifting (data, primitive, route state, RTL flip, focus trap) all already exists.

## Common Pitfalls

### Pitfall 1: HeroUI v3 Drawer placement is physical, not logical

**What goes wrong:** Picking HeroUI Drawer because CLAUDE.md cascade says HeroUI first; then discovering `placement="inline-end"` doesn't exist; ending up with `placement={isRTL ? 'left' : 'right'}` and re-skinning chrome through tokens.
**Why it happens:** HeroUI v3 Drawer ships physical placement enums; the AppShell mobile sidebar already does the manual flip.
**How to avoid:** Use Radix Sheet — its `side="right"` variant uses `inset-y-0 end-0` + `ltr:`/`rtl:` slide modifiers, fully RTL-correct via logical properties.
**Warning signs:** Tests that fail in AR locale at the slide-direction assertion (test case 5 in D-13).

### Pitfall 2: Search-param schema not on `_protected.tsx`

**What goes wrong:** The CONTEXT.md hypothesis assumes there's a centralized `validateSearch` on `_protected.tsx`; there isn't. Adding one breaks existing per-route schemas because TanStack Router merges parent+child search shapes and forbids overlap.
**Why it happens:** Each list/detail route defines its own search schema (countries: `{page, search}`; my-work: different; etc.).
**How to avoid:** Two options:

1.  **Recommended for Phase 41:** Extend each _parent_ route's `validateSearch` (the layout-level routes the drawer can open from) to allow optional `dossier?: string` and `dossierType?: string` keys. Most routes have NO `validateSearch` and accept any search by default — those work without changes. Only the routes that already have a strict `validateSearch` (countries, organizations, my-work, kanban) need to be widened.
2.  **Risky:** Add a centralized schema to `_protected.tsx`. This forces all child routes to spread `...protectedSearchSchema` into their own validators. Out of scope for this phase.
    **Warning signs:** Console warning `Invalid search params` in dev when navigating with `?dossier=...` to a strict-schema route.

### Pitfall 3: `recent_activities` vs `activities`

**What goes wrong:** CONTEXT.md says "top-4 entries from `useDossierOverview` `activity_timeline.activities`" — but the field is `recent_activities` (not `activities`).
**Why it happens:** Type drift between context-gathering and actual `dossier-overview.types.ts`.
**How to avoid:** Use `data.activity_timeline.recent_activities.slice(0, 4)`. Each entry is a `UnifiedActivity` with `actor.name` (NOT `actor_name`), `action` enum (NOT `action_label`), `timestamp` (NOT `created_at`), `title_en`/`title_ar`, `inheritance_source`, `metadata`, `priority`.
**Warning signs:** Runtime `Cannot read property 'map' of undefined` on the activity section.

### Pitfall 4: Handoff `padding-left/right: 16px` (mobile L856) is physical

**What goes wrong:** Verbatim port copies `padding-left: 16px; padding-right: 16px` from handoff line 856; CLAUDE.md mandates logical properties.
**Why it happens:** Handoff CSS isn't 100% logical-property-clean.
**How to avoid:** Convert to `padding-inline: 16px` in our port. Same visual result; logical-property-correct.
**Warning signs:** `eslint-plugin-rtl-friendly` violation; QA-01 (Phase 43) fail.

### Pitfall 5: Engagement-create route does not exist with the CONTEXT.md hypothesis path

**What goes wrong:** Wiring `Log engagement` to `/dossiers/{type}/$dossierId/engagements/create` — the route is `/dossiers/engagements/create` (a wizard). The hypothesis path 404s.
**Why it happens:** Engagements are first-class dossiers in this app, not a sub-resource.
**How to avoid:** Wire to `navigate({ to: '/dossiers/engagements/create' })`. Prefill via `dossier_id` is not currently supported by the wizard (see open question 3); accept that scope tradeoff or add a small wizard extension.
**Warning signs:** Test case 9 (`Log-engagement-CTA-navigates-with-prefill`) fails on prefill assertion.

### Pitfall 6: Calendar event trigger uses wrong field

**What goes wrong:** CONTEXT.md says branch on `linkedItemType==='dossier'`. The actual `CalendarEvent` shape uses `dossier_id` (always present) + optional `dossier: { id, type, ... }` embed. There is no per-event `linkedItemType` field.
**Why it happens:** `linkedItemType`/`linkedItemId` are filter-scope props on `UnifiedCalendar` and entry-form passthrough, not per-event metadata.
**How to avoid:** In the calendar route, wire `onEventClick={(event) => { if (event.dossier_id) openDossier({ id: event.dossier_id, type: event.dossier?.type ?? 'country' }) }}`. If `event.dossier` is absent, fall back to looking up the type via a query, or default to `'country'` (most common case).
**Warning signs:** Test case 2 (`drawer-opens-from-calendar-event-click`) fails because `linkedItemType` is undefined.

### Pitfall 7: SENSITIVITY_CHIP map disagrees with `dossier.ts` deprecated comment

**What goes wrong:** `frontend/src/types/dossier.ts` (deprecated) says `3 = Confidential, 4 = Secret`. `frontend/src/components/list-page/sensitivity.ts` says `3 = Restricted, 4 = Confidential`. Two conflicting sources for the same enum.
**Why it happens:** Deprecated comment in `dossier.ts` was never updated.
**How to avoid:** Trust `SENSITIVITY_CHIP` from `list-page/sensitivity.ts` — it's the live, used source. Render the `CONFIDENTIAL` chip when `level === 4` (or `level >= 3` if you want both Restricted and Confidential to show). Recommend `level >= 3` to be conservative — handoff visual uses `chip-warn` which the SENSITIVITY_CHIP table maps to level 3, so threshold `>= 3` matches the visual most safely. Capture the actual semantic decision in the planner step.
**Warning signs:** QA reports a dossier classified as "Restricted" (level 3) doesn't show CONFIDENTIAL chip but the design says it should.

### Pitfall 8: `i18n` namespace location

**What goes wrong:** CONTEXT.md says "new `dossier-drawer.json` namespace under `frontend/public/locales/{en,ar}/`". Actual project pattern is `frontend/src/i18n/{en,ar}/<namespace>.json` registered in `frontend/src/i18n/index.ts`.
**Why it happens:** Two patterns coexist historically; the newer one is in `src/i18n/` and is what `frontend/src/i18n/index.ts` imports from.
**How to avoid:** Create `frontend/src/i18n/en/dossier-drawer.json` and `frontend/src/i18n/ar/dossier-drawer.json`, then add 2 import lines + 1 resource entry in `frontend/src/i18n/index.ts`.
**Warning signs:** `useTranslation('dossier-drawer')` returns the key strings unchanged.

## Code Examples

### Drawer head — chip row + title + meta + CTAs

```tsx
// Source: handoff /tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx#L482-505 (verbatim) +
//         project token usage from frontend/src/components/list-page/sensitivity.ts (verified)
function DrawerHead({
  dossierId,
  type,
  onClose,
}: {
  dossierId: string
  type: string
  onClose: () => void
}) {
  const { t, i18n } = useTranslation('dossier-drawer')
  const { isRTL } = useDirection()
  const lang = i18n.language
  const { data: dossier } = useDossier(dossierId)
  const { data: overview } = useDossierOverview(dossierId, {
    includeSections: ['work_items', 'calendar_events', 'activity_timeline'],
  })
  const showConfidential = (dossier?.sensitivity_level ?? 0) >= 3 // see Pitfall 7
  const name = lang === 'ar' && dossier?.name_ar ? dossier.name_ar : dossier?.name_en

  return (
    <div className="drawer-head">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2">
          <span className="chip">{t('chip.dossier')}</span>
          {showConfidential && <span className="chip chip-warn">{t('chip.confidential')}</span>}
        </div>
        <button
          type="button"
          className="btn-ghost min-h-11 min-w-11"
          onClick={onClose}
          aria-label={t('cta.close')}
        >
          <Icon name="x" size={14} />
        </button>
      </div>
      <h2 className="drawer-title">{name}</h2>
      <DrawerMetaStrip
        dossier={dossier}
        count={overview?.stats.calendar_events_count ?? 0}
        lang={lang}
      />
      <DrawerCtaRow dossierId={dossierId} type={type} />
    </div>
  )
}
```

### Mini-KPI strip mapping

```tsx
// Source: handoff app.css#L298-302 + dossier-overview.types.ts (verified)
function MiniKpiStrip({ overview }: { overview: DossierOverviewResponse }) {
  const { t, i18n } = useTranslation('dossier-drawer')
  const lang = i18n.language
  const cells = [
    { val: overview.stats.calendar_events_count, label: t('kpi.engagements') },
    { val: overview.work_items.by_source.commitments.length, label: t('kpi.commitments') },
    { val: overview.stats.overdue_work_items, label: t('kpi.overdue') },
    { val: overview.stats.documents_count, label: t('kpi.documents') },
  ]
  return (
    <div className="kpi-mini-strip">
      {cells.map((c) => (
        <div key={c.label} className="kpi-mini">
          <span className="kpi-mini-val">{toArDigits(c.val, lang)}</span>
          <span className="kpi-mini-label">{c.label}</span>
        </div>
      ))}
    </div>
  )
}
```

### Recent Activity row (correct field shape)

```tsx
// Source: dossier-overview.types.ts + unified-dossier-activity.types.ts (verified)
function RecentActivitySection({ overview }: { overview: DossierOverviewResponse }) {
  const { i18n } = useTranslation('dossier-drawer')
  const lang = i18n.language
  const rows = overview.activity_timeline.recent_activities.slice(0, 4)
  return (
    <div className="act-list">
      {rows.map((a) => (
        <div key={a.id} className="act-row">
          <span className="act-t">{formatRelative(a.timestamp, lang)}</span>
          <span style={{ color: 'var(--ink-faint)' }}>
            <Icon name="dot" size={10} />
          </span>
          <div>
            <span className="act-who">{a.actor.name ?? '—'}</span>{' '}
            <span className="act-what">
              {lang === 'ar' && a.title_ar ? a.title_ar : a.title_en}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
```

## Runtime State Inventory

> N/A — this is a greenfield UI phase, no rename / refactor / migration. No runtime state to inventory.

## Common Pitfalls (additional cross-cutting)

(Already covered above; this section intentionally short — see Pitfalls 1-8.)

## State of the Art

| Old Approach                           | Current Approach                                                                     | When Changed                                                        | Impact                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------------------------------- |
| HeroUI Drawer for all overlay surfaces | Radix Sheet for design-system-styled drawers; HeroUI Drawer for nav/sidebar overlays | Phase 38+ (Sheet primitive added with handoff classnames pre-bound) | Sheet wins when handoff CSS is the source of truth   |
| Per-page activity scroll               | Per-section fixed slice + Open-full-dossier link to aggregate page                   | Phase 38 D-11                                                       | Drawer is preview, not destination                   |
| Local React state for overlays         | URL search-param-driven state                                                        | Phase 40 D-10 + Phase 41 D-02                                       | Deep-linking + browser-back work without bookkeeping |

**Deprecated/outdated:**

- `frontend/src/types/dossier.ts` (deprecated comment claims `3 = Confidential`) — trust `frontend/src/components/list-page/sensitivity.ts` instead.
- `frontend/public/locales/...` namespace location — actual location is `frontend/src/i18n/...`.

## Assumptions Log

| #   | Claim                                                                                                     | Section               | Risk if Wrong                                                                                                                                                                                                                                                                        |
| --- | --------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | `stats.calendar_events_count` reflects engagement-type events accurately enough to label as "engagements" | Mini-KPI strip / D-04 | If the count includes deadlines/reminders the label is misleading. CONTEXT.md already calls out a fallback path (filter `work_items` by `engagement_type`) but the canonical solution is a backend-side `engagements_count` stat. **[ASSUMED]**                                      |
| A2  | Sensitivity threshold for CONFIDENTIAL chip is `level >= 3`                                               | Drawer head           | If actual SENSITIVITY_CHIP uses `level === 4` for "Confidential" label, threshold should be 4 only. Recommend planner ask the user. **[ASSUMED]**                                                                                                                                    |
| A3  | `event.dossier?.type` is always populated when `event.dossier_id` is set                                  | Calendar trigger      | If sometimes absent we need a `useDossier(id)` lookup before opening. **[ASSUMED]**                                                                                                                                                                                                  |
| A4  | Calendar route can accept the new `?dossier=` search param without breaking the existing flow             | Trigger wiring        | If the calendar route has a strict `validateSearch` that doesn't allow extra keys, adding `?dossier=` will fail. Calendar route currently has NO `validateSearch` (verified `frontend/src/routes/_protected/calendar.tsx`) so this assumption is safe. **[VERIFIED: codebase grep]** |
| A5  | Sheet's `side="right"` slide animation is acceptably close to handoff's expected timing                   | Animation             | Handoff `app.css` does not have an explicit `.drawer { transition: ... }` rule (verified L425-432). Sheet uses Tailwind animation `var(--dur)`. **[VERIFIED: handoff CSS read]**                                                                                                     |
| A6  | Bundle delta for drawer + new hook is ≤ 8KB gz                                                            | Size-limit            | Drawer = ~6 components (~150 LOC each = ~900 LOC unminified). With `useDossierOverview` already in the bundle and Radix Sheet already in the bundle, the marginal cost is just the JSX + the new hook (~30 LOC). 8KB gz is generous. **[ASSUMED — to be verified by Wave 2]**        |

**If this table is empty:** Not empty — A1, A2, A3, A6 need user confirmation; A4, A5 are codebase-verified.

## Open Questions Resolved (1-17)

### 1. Sensitivity threshold for CONFIDENTIAL chip

- **What we know:** Two sources disagree. `dossier.ts` (deprecated) says `3 = Confidential`. `list-page/sensitivity.ts` (live) says `3 = Restricted, 4 = Confidential`. The handoff calls the chip "CONFIDENTIAL" with `chip-warn` class, which `SENSITIVITY_CHIP` assigns to level 3 (Restricted).
- **Recommendation:** Render chip when `dossier.sensitivity_level >= 3`, with the visible label coming from `t('chip.confidential')` for handoff fidelity. This matches the handoff visual exactly (chip-warn at threshold 3) while accepting the label-mapping inconsistency. Flag A2 in Assumptions Log; planner asks user to confirm.
- **Confidence:** MEDIUM (visual-correct, semantics ambiguous). [VERIFIED: codebase grep on both source files]

### 2. `useDossierOverview` field shapes

- **`stats.calendar_events_count`** — exists. number. **[VERIFIED]**
- **`stats.overdue_work_items`** — exists. number. **[VERIFIED]**
- **`stats.documents_count`** — exists. number. **[VERIFIED]**
- **`calendar_events.upcoming`** — `DossierCalendarEvent[]` with fields: `id, title_en, title_ar, event_type, start_datetime, end_datetime, is_all_day, location_en, location_ar, is_virtual, meeting_link, description_en, description_ar, created_at`. NO `counterpart` / `status` fields per-event — those are handoff demo-data invariants. **[VERIFIED]**
- **`activity_timeline.recent_activities`** (NOT `activities`) — `UnifiedActivity[]` with fields: `id, activity_type, action, title_en, title_ar, description_en, description_ar, timestamp, actor: { id, name, email, avatar_url }, source_id, source_table, inheritance_source, metadata, priority, status`. CONTEXT.md hypothesis (`actor_name` / `action_label` / `created_at`) is wrong. Use `actor.name`, `action`, `timestamp`. **[VERIFIED]**
- **Commitment filter** — use `work_items.by_source.commitments` (already pre-filtered). To match D-08 ("source==='commitment' && status not in ['completed','cancelled']"), filter the `commitments` array by status: `commitments.filter(it => it.status !== 'completed' && it.status !== 'cancelled')`. **[VERIFIED]**
- **`calendar_events_count` includes engagement-type events?** Type definition does not document this — the field name suggests "all calendar events", not strictly engagement-type. Flagged as assumption A1; if the runtime data shows the count includes non-engagement events, planner adds the fallback `work_items` filter for `engagement_type` (CONTEXT.md D-04 already authorizes this fallback).

### 3. Engagement-create route + prefill

- **Route:** `/dossiers/engagements/create` (a wizard composed via `useCreateDossierWizard`). NOT `/dossiers/{type}/$dossierId/engagements/create`.
- **Prefill mechanism:** None currently. The wizard schema (`engagementSchema`) has fields for `engagement_type`, `engagement_category`, dates, participants — no `dossier_id`. Engagements are first-class dossiers in this app.
- **Recommendation:** Wire `Log engagement` to `navigate({ to: '/dossiers/engagements/create' })`. **Defer prefill to a future phase** — capture as deferred idea. The CTA still works correctly (analyst lands on the wizard with a clean slate). For test case 9 in D-13, change the assertion from "with `dossier_id` prefill" to "navigates to engagement-create route" (the test description itself can stay; just verify navigation, not prefill).
- **Confidence:** HIGH. [VERIFIED: route file + schema file]

### 4. Work-item detail dialog component

- **Finding:** There is no centralized "work-item detail dialog" component. Phase 39 D-09 (`WorkBoard.tsx#handleItemClick`) routes by source: `task` → `/tasks/{id}`, `commitment` → `/commitments`, `intake` → `/intake/tickets/{id}`. The "dialog" in CONTEXT.md is actually a route navigation.
- **Implication:** Clicking a commitment row in the drawer should call `navigate({ to: '/commitments', search: { id: commitmentId } as any })` (matches Phase 39 pattern + matches `_protected.tsx#handleCitationClick.commitment`). The "drawer stays open behind the dialog" assumption from D-08 doesn't hold — there's no dialog, only a route navigation. The drawer closes (because `?dossier=` is dropped on next route's search schema).
- **Recommendation:** Adjust D-08 expectation: commitment row click closes the drawer and navigates to `/commitments?id=<commitment-id>`. Test case 10 changes from "opens dialog with drawer in DOM" to "navigates to commitments page (drawer is closed)". OR — if a true dialog is wanted — add a `WorkItemDetailDialog` component in this phase (scope creep). **Recommend the route-navigation path.**
- **Confidence:** HIGH. [VERIFIED: WorkBoard.tsx + _protected.tsx]

### 5. Relative-time utility

- **Finding:** No bilingual relative-time helper exists in `utils/` or `lib/i18n/`. `RecentDossiers.tsx` uses `formatDistanceToNow` from `date-fns` directly with `locale: ar | enUS`. KCard.tsx uses raw `Overdue Nd` strings + `toArDigits` for digit conversion.
- **Recommendation:** Create `frontend/src/lib/i18n/relativeTime.ts` (NEW) with a thin wrapper:
  ```ts
  // Returns handoff-style "09:42" / "yday" / "2d" / "4d" with bilingual digits.
  export function formatRelativeTimeShort(timestamp: string, lang: string, now = new Date()): string
  ```
  Implementation: parse the ISO timestamp, compute days delta, return `"<HH:mm>"` if today, `"yday"`/`"أمس"` if 1 day, `"<N>d"`/`"<N>ي"` if 2-7 days, otherwise `format(d, 'd MMM')` with locale. Apply `toArDigits` for AR.
- **Confidence:** HIGH. [VERIFIED: codebase grep, no existing utility]

### 6. `toArDigits` location

- **Path:** `frontend/src/lib/i18n/toArDigits.ts` (NOT `frontend/src/utils/`).
- **Confidence:** HIGH. [VERIFIED]

### 7. Protected-layout search-param schema location

- **Finding:** `frontend/src/routes/_protected.tsx` exists but has NO `validateSearch`. It only has `beforeLoad` for auth + a component. Each child route declares its own `validateSearch` (verified for countries, organizations, my-work).
- **Recommendation:** Two paths.
  - **Path A (recommended for Phase 41):** Add `validateSearch` to `_protected.tsx` that **only validates the drawer keys**:
    ```ts
    validateSearch: (search: Record<string, unknown>) => ({
      dossier: typeof search.dossier === 'string' ? search.dossier : undefined,
      dossierType: typeof search.dossierType === 'string' && isValidDossierType(search.dossierType)
        ? search.dossierType
        : undefined,
    }),
    ```
    TanStack Router merges parent + child search shapes — child schemas keep working as long as they don't _override_ `dossier` or `dossierType`. This is the cleanest mounting path.
  - **Path B (fallback if A breaks any child):** Don't add a centralized schema; instead use `useSearch({ strict: false })` in `useDossierDrawer` (works without any schema). Drawback: no type-safety on the search shape; missing `dossierType` is silently `undefined`.
- **Recommendation:** Try Path A first. If any child route's `validateSearch` regresses (TanStack Router would throw at compile or runtime), fall back to Path B. Wave 0 task includes the schema add + a quick smoke test that countries / my-work / kanban routes still work.
- **Confidence:** HIGH. [VERIFIED: codebase grep on every routes/*.tsx]

### 8. Calendar event click — open trigger

- **Finding:** `UnifiedCalendar` has `onEventClick?: (event: CalendarEvent) => void` prop. Today the calendar route (`/_protected/calendar.tsx`) does NOT pass `onEventClick`. The `linkedItemType`/`linkedItemId` props are filter-scope props, not per-event. `CalendarEvent.dossier_id` is always present + optional `dossier: { id, type, name_en, name_ar }` embed.
- **Recommendation:** In `frontend/src/routes/_protected/calendar.tsx`, wire:
  ```tsx
  const { openDossier } = useDossierDrawer()
  // ...
  <UnifiedCalendar
    viewMode={viewMode}
    onEventClick={(event) => {
      if (event.dossier_id && event.dossier?.type) {
        openDossier({ id: event.dossier_id, type: event.dossier.type })
      }
    }}
  />
  ```
- **Confidence:** HIGH. [VERIFIED: CalendarEvent shape in `frontend/src/domains/calendar/types/index.ts`]

### 9. Dashboard widgets — exact paths + onClick refactor surface

| Widget             | File                                                          | Today                                                                             | Refactor                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RecentDossiers     | `frontend/src/pages/Dashboard/widgets/RecentDossiers.tsx`     | Renders `<Link to={route}>...` per recent dossier                                 | Replace `<Link>` with `<button onClick={() => openDossier({ id: d.id, type: d.type })}>` (one-line swap; preserve markup + accessibility)                                                                                |
| MyTasks            | `frontend/src/pages/Dashboard/widgets/MyTasks.tsx`            | Renders `DossierGlyph` + title; NO existing click handler                         | Wrap glyph in a small button that opens drawer when `task.work_item_type === 'dossier'`; OR (simpler) skip MyTasks open-trigger for Phase 41 since it doesn't have a clear dossier affordance — capture as deferred idea |
| OverdueCommitments | `frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx` | Renders `DossierGlyph + group.dossierName` (no click); commitment rows are static | Wrap the `<DossierGlyph + dossierName>` head into `<button onClick={() => openDossier({ id: group.dossierId, type: 'country' })}>` (default to country since groups are country-keyed in this widget)                    |
| ForumsStrip        | `frontend/src/pages/Dashboard/widgets/ForumsStrip.tsx`        | Renders `<li>` per forum, no click handler                                        | Replace `<li>` with `<button>` that calls `openDossier({ id: f.id, type: 'forum' })`                                                                                                                                     |

- **Recommendation:** All 4 widgets get a one-line `onClick` swap (or wrap in clickable button). MyTasks is the weakest fit because the click target (DossierGlyph beside a checkbox) is ambiguous — recommend skipping MyTasks open-trigger or making the glyph itself clickable. **Final decision in Wave 1 trigger plan.**
- **Confidence:** HIGH. [VERIFIED: all 4 widget files read]

### 10. HeroUI v3 Drawer vs Radix Sheet — DECIDED

- **Decision: Radix Sheet** at `frontend/src/components/ui/sheet.tsx`.
- **Rationale:**
  - Sheet pre-binds the handoff classnames `drawer-overlay`, `drawer`, `drawer-head`, `drawer-title` already (verified L24, L35, L91, L111).
  - Sheet `side="right"` uses `inset-y-0 end-0` (logical) + `ltr:slide-in-from-right rtl:slide-in-from-left` (already RTL-correct).
  - HeroUI v3 Drawer takes physical `placement={'left'|'right'}` — AppShell.tsx#L225 manually flips with `isRTL ? 'right' : 'left'`. We'd duplicate that logic and re-skin chrome via tokens.
  - Both provide focus trap + ESC + Portal (Radix Dialog under both).
- **Confidence:** HIGH. [VERIFIED: Sheet source + AppShell HeroUI Drawer usage]

### 11. Handoff CSS verification (lines 425-446, 298-302, 331-338, 444-446, 648-649, 855-858, 139, 168)

- **L425-446 (drawer + section CSS):** Matches CONTEXT.md verbatim. Uses `inset-inline-end`, `border-inline-start`, `padding-inline-end` (logical). Drawer width `min(720px, 92vw)`, shadow `-24px 0 60px rgba(0,0,0,0.25)`, head `padding: 20px 24px`, body `gap: 20px`. Title `font-family: var(--font-display); font-size: 28px`. **NO transition / animation rule on `.drawer`**. **[VERIFIED]**
- **L298-302 (kpi-mini):** `display: flex; gap: 16px`. Cell uses `border-inline-end` (logical) — last cell `border-inline-end: 0`. Val `var(--font-display) 22px 600`. Label `11px var(--ink-mute)`. **[VERIFIED]**
- **L331-338 (overdue-item):** 4-column grid `auto 1fr auto auto`. Sev dot 6×6 colored by severity (`high → var(--danger)`, `med → var(--warn)`, `low → var(--ink-faint)`). Owner mono, end-aligned. **[VERIFIED]**
- **L444-446 (act-list / act-row):** 3-column grid `60px 24px 1fr`, `gap: 10px`, baseline-aligned. Time mono 10.5px ink-faint. **[VERIFIED]**
- **L648-649 (Bureau drawer):** `.dir-bureau .drawer { background: var(--surface); border-inline-start: 1px solid var(--line) }` and `.drawer-title { font-weight: 600; font-size: 24px }`. **[VERIFIED]** — note: Bureau title is 24px (overrides default 28px). Project default direction is Bureau per CLAUDE.md.
- **L855-858 (mobile drawer):** `width: 100vw; border-inline-start: 0; box-shadow: none`. **PHYSICAL `padding-left: 16px; padding-right: 16px`** — convert to `padding-inline: 16px` in our port (Pitfall 4). Title 22px (Bureau 26px via Chancery override doesn't apply). **[VERIFIED]**
- **L139, L168 (RTL overrides):** L139 forces `'Tajawal'` on `.drawer-title` in RTL (since Fraunces lacks Arabic). L168 forces `'Tajawal'` on `.overdue-owner` in RTL. Both already work via the logical-property + global RTL rule. **[VERIFIED]**

### 12. Handoff JSX `DossierDrawer` (pages.jsx#L469-559)

- **Overlay:** `<div className="drawer-overlay" onClick={onClose}/>` — separate from drawer; click closes. (Radix Sheet's `<SheetOverlay/>` handles this.)
- **Drawer wrapper:** `<div className="drawer">`.
- **Head:** `<div className="drawer-head">` with:
  - chip row (DOSSIER + CONFIDENTIAL + close ✕) — flex with `justifyContent: 'space-between'`
  - `<div className="drawer-title">{name}</div>`
  - `<div className="drawer-meta">` with 4 segments separated by `·` text nodes
  - CTA row: 3 buttons (Log engagement primary, Brief, Follow)
- **Body:** `<div className="drawer-body">` with 5 sections (kpi-mini-strip, Summary, Upcoming, Recent activity, Open commitments).
- **Section anatomy verified verbatim above.**
- **Divergence from CONTEXT.md:** Handoff CTA row has only 3 buttons — NO "Open full dossier" CTA. Adding it is a project-side addition (D-06).
- **[VERIFIED]**

### 13. CTA placement

- **Recommendation:** Place "Open full dossier" as a **chevron-link in the meta strip**, not in the CTA row. Rationale: CTA row aligns with handoff (Log engagement / Brief / Follow); meta strip already has the dossier identity context, and a chevron-link there reads as "see more about this dossier" — semantically correct + visually unobtrusive. Use `<button className="btn-ghost"><span>{t('cta.open_full_dossier')}</span><Icon name="chevron-right" /></button>` at the end of the meta strip.
- **Location segment source:** `dossier.metadata?.region ?? "Global"`. If region is absent, render `t('meta.location_global')` (= "Global" / "عالمي"). This avoids the hard-coded `📍` emoji from handoff (CLAUDE.md: no emoji in copy).
- **Lead segment source:** `dossier.metadata?.lead_name ?? overview.key_contacts.contacts[0]?.name ?? '—'`. (Note: D-03 doesn't include `key_contacts` section by default; we keep the fallback chain but accept that fallback hits `metadata` only. If `metadata.lead_name` is missing, render an em-dash.)
- **Engagement count:** `toArDigits(stats.calendar_events_count, lang)` + i18n suffix (`engagements` / `مشاركة`).
- **Last touched:** `formatRelativeTimeShort(stats.last_activity_date ?? dossier.updated_at, lang)`.
- **Confidence:** MEDIUM (subjective placement; codebase-verified data sources).

### 14. Animation timing

- **Finding:** Handoff `app.css` has NO `transition` rule on `.drawer` (verified L425-432). Sheet primitive uses `transition ease-out data-[state=closed]:duration-[var(--dur)] data-[state=open]:duration-[var(--dur)]` (verified `sheet.tsx#L35`).
- **Recommendation:** Use Sheet defaults — already binds `var(--dur)` (Phase 33 token) with `ease-out`. RTL preserves the same timing. No additional CSS needed.
- **Confidence:** HIGH. [VERIFIED]

### 15. Size-limit budget

- **Finding:** `.size-limit.json` has 6 entries (Initial JS 200KB, React vendor 50KB, TanStack vendor 80KB, Total JS 815KB, d3-lazy 100KB, signature-visuals 15KB). The "Total JS" budget at 815KB gz absorbs the new drawer code.
- **Recommendation:** Do NOT add a new dedicated size-limit entry for the drawer. The "Total JS" budget rises by ≤ 8KB gz worst-case (drawer + relativeTime + new hook). Existing budgets already cover it. If Wave 2 measurement shows the delta is closer to 12-15KB, raise "Total JS" to 825KB gz and capture the delta in the wave-2 report.
- **Alternative:** Add a NEW entry `dossier-drawer` with `limit: 8KB` if planner wants explicit isolation. Slightly more bookkeeping; better tracking on regressions. **Defer to planner.**
- **Confidence:** HIGH. [VERIFIED: .size-limit.json read]

### 16. Validation Architecture (Nyquist) — see dedicated section below

### 17. Phase 39 stub pattern

- **Finding:** `frontend/src/pages/WorkBoard/BoardToolbar.tsx#L70-86` uses:
  ```tsx
  <button
    type="button"
    className="filter-pill"
    aria-disabled="true"
    title={comingSoon}
    onClick={noop}
  >
    {t('filters.byDossier')}
  </button>
  ```
  with `comingSoon = t('filters.comingSoon')` (= "Coming soon" / "قريبًا" depending on locale).
- **Recommendation:** Reuse this exact pattern for Brief + Follow CTAs. Add `dossier-drawer:cta.coming_soon` i18n key with EN "Coming soon" / AR "قريبًا". Set `opacity: 0.55` via inline style or a `.btn[aria-disabled="true"]` rule (CONTEXT.md D-05).
- **Confidence:** HIGH. [VERIFIED]

## Validation Architecture

### Test Framework

| Property           | Value                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| Framework          | Vitest 4.x (unit) + Playwright (E2E) + axe-core 4.x (a11y)                         |
| Config file        | `frontend/vitest.config.ts` (unit) + `frontend/playwright.config.ts` (E2E)         |
| Quick run command  | `pnpm --filter frontend test:unit -- DossierDrawer`                                |
| Full suite command | `pnpm --filter frontend test && pnpm --filter frontend test:e2e -- dossier-drawer` |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                                                 | Test Type    | Automated Command                                                 | File Exists? |
| --------- | ---------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------- | ------------ |
| DRAWER-01 | Drawer opens at 720px from inline-end with backdrop + shadow                             | E2E + Visual | `pnpm test:e2e -- dossier-drawer-open.spec.ts`                    | ❌ Wave 0    |
| DRAWER-01 | Width = `min(720px, 92vw)` at 1280×800                                                   | Visual       | `pnpm test:e2e -- dossier-drawer-visual.spec.ts`                  | ❌ Wave 2    |
| DRAWER-02 | Head renders DOSSIER + CONFIDENTIAL chips when `sensitivity_level >= 3`                  | Unit         | `pnpm test:unit -- DossierDrawer/DrawerHead.test.tsx`             | ❌ Wave 1    |
| DRAWER-02 | Mini-KPI strip renders 4 cells with correct mapping                                      | Unit         | `pnpm test:unit -- DossierDrawer/MiniKpiStrip.test.tsx`           | ❌ Wave 1    |
| DRAWER-02 | Summary renders italic-serif paragraph from `description_{en,ar}`                        | Unit         | `pnpm test:unit -- DossierDrawer/SummarySection.test.tsx`         | ❌ Wave 1    |
| DRAWER-02 | Upcoming renders top-2 entries from `calendar_events.upcoming`                           | Unit         | `pnpm test:unit -- DossierDrawer/UpcomingSection.test.tsx`        | ❌ Wave 1    |
| DRAWER-02 | Recent Activity renders top-4 entries from `activity_timeline.recent_activities`         | Unit         | `pnpm test:unit -- DossierDrawer/RecentActivitySection.test.tsx`  | ❌ Wave 1    |
| DRAWER-02 | Open Commitments renders rows from `work_items.by_source.commitments` filtered by status | Unit         | `pnpm test:unit -- DossierDrawer/OpenCommitmentsSection.test.tsx` | ❌ Wave 1    |
| DRAWER-02 | Log engagement CTA navigates to `/dossiers/engagements/create`                           | E2E          | `pnpm test:e2e -- dossier-drawer-cta.spec.ts`                     | ❌ Wave 2    |
| DRAWER-02 | Brief + Follow CTAs render `aria-disabled="true"` + Coming soon tooltip                  | Unit         | (covered in DrawerHead.test.tsx)                                  | ❌ Wave 1    |
| DRAWER-02 | Open full dossier navigates to `getDossierDetailPath(id, type)`                          | E2E          | `pnpm test:e2e -- dossier-drawer-cta.spec.ts`                     | ❌ Wave 2    |
| DRAWER-02 | Commitment row click navigates to `/commitments?id=<id>`                                 | E2E          | `pnpm test:e2e -- dossier-drawer-commitment-click.spec.ts`        | ❌ Wave 2    |
| DRAWER-03 | RTL renders drawer slid from inline-start                                                | Visual       | `pnpm test:e2e -- dossier-drawer-visual.spec.ts (AR)`             | ❌ Wave 2    |
| DRAWER-03 | Mobile (≤640px) renders drawer at `width: 100vw`                                         | E2E          | `pnpm test:e2e -- dossier-drawer-mobile.spec.ts`                  | ❌ Wave 2    |
| DRAWER-03 | Tab cycles within drawer (focus trap)                                                    | E2E          | `pnpm test:e2e -- dossier-drawer-a11y.spec.ts`                    | ❌ Wave 2    |
| DRAWER-03 | ESC closes drawer + clears `?dossier=` from URL                                          | E2E          | `pnpm test:e2e -- dossier-drawer-a11y.spec.ts`                    | ❌ Wave 2    |
| DRAWER-03 | axe-core zero violations in EN + AR                                                      | E2E          | `pnpm test:e2e -- dossier-drawer-axe.spec.ts`                     | ❌ Wave 2    |

**Trigger E2E cases (D-13):**

1. Drawer opens from RecentDossiers click → `dossier-drawer-trigger-recent.spec.ts`
2. Drawer opens from calendar event click → `dossier-drawer-trigger-calendar.spec.ts`
3. Deep-link refresh restores drawer → `dossier-drawer-deeplink.spec.ts`
4. ESC closes + clears search params (above)
5. RTL slide direction (above)
6. Mobile full-screen (above)
7. Focus trap Tab cycle (above)
8. Open-full-dossier navigates (above)
9. Log-engagement navigates (above)
10. Commitment-row navigates (above)

### Sampling Rate

- **Per task commit:** `pnpm --filter frontend test:unit -- DossierDrawer`
- **Per wave merge:** `pnpm --filter frontend test && pnpm --filter frontend test:e2e -- dossier-drawer`
- **Phase gate:** Full suite green + visual baselines committed + axe-core zero violations + size-limit pass

### Wave 0 Gaps

- [ ] `frontend/src/components/dossier/DossierDrawer/__tests__/DossierDrawer.test.tsx` — shell rendering test
- [ ] `frontend/src/hooks/__tests__/useDossierDrawer.test.tsx` — open/close + URL mutation
- [ ] `frontend/tests/e2e/support/dossier-drawer-fixture.ts` — shared Playwright fixture (login + open drawer helper)
- [ ] `frontend/src/lib/i18n/__tests__/relativeTime.test.ts` — relative-time utility unit tests
- [ ] No framework install needed; vitest + playwright + axe already in `package.json`

## Security Domain

> Phase 41 is a UI overlay — no new endpoints, no new data egress, no new authn/authz surface. Existing `useDossierOverview` and `useDossier` already enforce backend RLS / authorization.

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                                                                                                                      |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no      | Existing `_protected.tsx` `beforeLoad` redirects to `/login` if no session                                                                                                            |
| V3 Session Management | no      | Existing Supabase auth                                                                                                                                                                |
| V4 Access Control     | no      | Existing RLS on dossier tables; drawer surfaces only what the existing endpoint returns                                                                                               |
| V5 Input Validation   | yes     | `validateSearch` on `_protected.tsx` validates `dossier` (string UUID-ish) and `dossierType` (must pass `isValidDossierType`); reject malformed values silently (drawer doesn't open) |
| V6 Cryptography       | no      | N/A                                                                                                                                                                                   |

### Known Threat Patterns for {React + TanStack Router stack}

| Pattern                                                                           | STRIDE                 | Standard Mitigation                                                                                                           |
| --------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Open-redirect via `?dossierType=javascript:...`                                   | Tampering              | `isValidDossierType` rejects unknown types; `getDossierDetailPath` only emits known segments from `DOSSIER_TYPE_TO_ROUTE` map |
| XSS via dossier name / description rendering                                      | Tampering              | React JSX auto-escapes; no `dangerouslySetInnerHTML` in drawer code (acceptance grep)                                         |
| URL-based information disclosure (sharing `?dossier=<id>` reveals dossier exists) | Information Disclosure | Acceptable per D-02 — share-able URL is the explicit feature. Backend RLS prevents data access if recipient isn't authorized  |

## Files to Create

```
frontend/src/components/dossier/DossierDrawer/
├── DossierDrawer.tsx                                       (Wave 0 shell, Wave 1 sections wired)
├── DrawerHead.tsx                                          (Wave 1)
├── DrawerMetaStrip.tsx                                     (Wave 1)
├── DrawerCtaRow.tsx                                        (Wave 1)
├── MiniKpiStrip.tsx                                        (Wave 1)
├── SummarySection.tsx                                      (Wave 1)
├── UpcomingSection.tsx                                     (Wave 1)
├── RecentActivitySection.tsx                               (Wave 1)
├── OpenCommitmentsSection.tsx                              (Wave 1)
├── DrawerSkeleton.tsx                                      (Wave 0)
├── index.ts                                                (Wave 0 - barrel)
└── __tests__/
    ├── DossierDrawer.test.tsx                              (Wave 0 shell test)
    ├── DrawerHead.test.tsx                                 (Wave 1)
    ├── MiniKpiStrip.test.tsx                               (Wave 1)
    ├── UpcomingSection.test.tsx                            (Wave 1)
    ├── RecentActivitySection.test.tsx                      (Wave 1)
    └── OpenCommitmentsSection.test.tsx                     (Wave 1)

frontend/src/hooks/
├── useDossierDrawer.ts                                     (Wave 0)
└── __tests__/useDossierDrawer.test.tsx                     (Wave 0)

frontend/src/lib/i18n/
├── relativeTime.ts                                         (Wave 0)
└── __tests__/relativeTime.test.ts                          (Wave 0)

frontend/src/i18n/
├── en/dossier-drawer.json                                  (Wave 0)
└── ar/dossier-drawer.json                                  (Wave 0)

frontend/tests/e2e/
├── dossier-drawer-trigger-recent.spec.ts                   (Wave 2)
├── dossier-drawer-trigger-calendar.spec.ts                 (Wave 2)
├── dossier-drawer-deeplink.spec.ts                         (Wave 2)
├── dossier-drawer-a11y.spec.ts                             (Wave 2 — Tab cycle + ESC)
├── dossier-drawer-mobile.spec.ts                           (Wave 2)
├── dossier-drawer-cta.spec.ts                              (Wave 2 — Log engagement + Open full + Brief stub)
├── dossier-drawer-commitment-click.spec.ts                 (Wave 2)
├── dossier-drawer-axe.spec.ts                              (Wave 2)
├── dossier-drawer-visual.spec.ts                           (Wave 2 — LTR + AR baselines @ 1280×800)
└── support/dossier-drawer-fixture.ts                       (Wave 0 — fixture)
```

## Files to Modify

```
frontend/src/routes/_protected.tsx
  → Add validateSearch for { dossier?: string; dossierType?: string } (open question 7, Path A)
  → Add <DossierDrawer/> mount inside <ChatProvider> after <ChatDock/>
  → ~10 lines added

frontend/src/i18n/index.ts
  → import enDossierDrawer from './en/dossier-drawer.json'
  → import arDossierDrawer from './ar/dossier-drawer.json'
  → Add to resources for en + ar
  → 4 lines added

frontend/src/components/layout/AppShell.tsx
  → No change needed — drawer mounts in _protected.tsx (one level up) so it's still a sibling of <main>

frontend/src/pages/Dashboard/widgets/RecentDossiers.tsx
  → Replace <Link to={route}> with <button onClick={() => openDossier({ id, type })}>
  → ~6 lines changed

frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx
  → Wrap <DossierGlyph + dossierName> head in <button onClick={() => openDossier({ id: group.dossierId, type: 'country' })}>
  → ~4 lines changed

frontend/src/pages/Dashboard/widgets/ForumsStrip.tsx
  → Replace <li><LtrIsolate>...</li> with <li><button onClick={() => openDossier({ id: f.id, type: 'forum' })}>
  → ~3 lines changed

frontend/src/pages/Dashboard/widgets/MyTasks.tsx (OPTIONAL — see open question 9)
  → If included, wrap DossierGlyph in clickable region for tasks where work_item_type === 'dossier'
  → ~5 lines changed; recommend deferring

frontend/src/routes/_protected/calendar.tsx
  → Add onEventClick={...} prop to <UnifiedCalendar/> that calls openDossier when event.dossier_id is set
  → ~6 lines added

frontend/.size-limit.json
  → Optional: add { name: 'dossier-drawer', path: '...', limit: '8 KB', gzip: true }
  → OR raise "Total JS" to absorb delta
  → 0-8 lines changed
```

## Recommended Wave Breakdown

### Wave 0 — Infra (single-threaded, blocks Wave 1)

1. **Add validateSearch to `_protected.tsx`** for `dossier?` + `dossierType?` keys (open question 7 Path A).
2. **Create `useDossierDrawer.ts`** hook — `openDossier`, `closeDossier`, `open`, `dossierId`, `dossierType`. Use `useSearch({ strict: false })` for safety.
3. **Create `relativeTime.ts`** in `lib/i18n/` — bilingual `formatRelativeTimeShort`.
4. **Create `dossier-drawer` i18n namespace** — both `en/dossier-drawer.json` + `ar/dossier-drawer.json` with all keys (chip.dossier, chip.confidential, kpi.engagements, kpi.commitments, kpi.overdue, kpi.documents, cta.log_engagement, cta.brief, cta.follow, cta.open_full_dossier, cta.coming_soon, cta.close, meta.location_global, meta.lead_label, meta.engagements_suffix, meta.last_touched_today, section.summary, section.upcoming, section.recent_activity, section.open_commitments, empty.no_upcoming, empty.no_activity, empty.no_commitments, empty.no_summary). Register in `i18n/index.ts`.
5. **Create `<DossierDrawer/>` shell** — Sheet primitive, mounts when `open === true`, renders `<DrawerSkeleton/>` while data loads. Wire `onOpenChange` → `closeDossier()`.
6. **Mount `<DossierDrawer/>` in `_protected.tsx`** beside `<ChatDock/>`.
7. **Create `<DrawerSkeleton/>`** with shape-matching placeholders for all 5 body sections + head.
8. **Create Playwright fixture `support/dossier-drawer-fixture.ts`** — login helper + `openDrawer({ id, type })` helper.
9. **Optional: add size-limit entry** for `dossier-drawer` (or defer to Wave 2 with delta measurement).

**Wave 0 deliverable:** Drawer opens at any protected route via `?dossier=<id>&dossierType=<type>`; renders empty skeleton + close button; ESC closes + clears URL.

### Wave 1 — Sections (parallel, after Wave 0 merge)

These six section files can be built by 6 parallel sub-agents:

1. **`DrawerHead.tsx`** — chip row + close button + title + meta strip + CTA row. Includes `DrawerMetaStrip.tsx` and `DrawerCtaRow.tsx` as sub-components. Uses `useDossier` + `useDossierOverview`.
2. **`MiniKpiStrip.tsx`** — 4 baseline-aligned cells, KPI values via `toArDigits`.
3. **`SummarySection.tsx`** — italic-serif paragraph from `dossier.description_{en,ar}`; bilingual fallback string.
4. **`UpcomingSection.tsx`** — top-2 from `calendar_events.upcoming`. Each row: bilingual day-of-week + Arabic-Indic date + title + counterpart (use `dossier?.name` if event has one) + status chip. `<DossierGlyph/>` per row when applicable.
5. **`RecentActivitySection.tsx`** — top-4 from `activity_timeline.recent_activities`. 3-column grid (60px time + 24px dot + 1fr who+what). Time via `formatRelativeTimeShort`. Bilingual title.
6. **`OpenCommitmentsSection.tsx`** — `work_items.by_source.commitments.filter(it => it.status !== 'completed' && it.status !== 'cancelled')`. 4-column grid (severity dot + title + days + owner). Severity dot color by `priority` (urgent/high → danger, medium → warn, low → ink-faint). Days via `Math.abs(daysOverdue)` + `toArDigits`. Owner = mono initials from `assignee_name`. Row click → `navigate({ to: '/commitments', search: { id: it.id } as any })`.

**Parallel trigger wiring (one engineer):** Update RecentDossiers / OverdueCommitments / ForumsStrip widgets + calendar route. Optional: MyTasks (deferred).

### Wave 2 — Gates (single-threaded, after Wave 1 merge)

1. **10 Playwright E2E spec files** (enumerated in Validation Architecture).
2. **2 visual regression baselines** at 1280×800 LTR + AR with frozen clock at `2026-04-26T12:00:00Z`, transitions suppressed, `maxDiffPixelRatio: 0.02`.
3. **axe-core gate** — open drawer in EN + AR, run axe scan, assert zero violations.
4. **size-limit gate** — `pnpm size` passes; if Total JS rose by > 8KB gz, raise budget by the measured delta + 2KB headroom.
5. **Human checkpoint** — manual smoke test on staging with real dossier data: open drawer from each trigger surface, confirm meta strip renders, confirm Open commitments link works, confirm RTL layout looks like handoff.
6. **Commit visual baselines** as part of the wave.

## Risks & Pitfalls

1. **(High) `validateSearch` regression on existing strict-schema routes.** Adding `dossier?` + `dossierType?` to `_protected.tsx`'s schema may conflict with child schemas. Mitigation: smoke-test all child routes (countries, organizations, my-work, kanban) in Wave 0; fall back to Path B (`useSearch({ strict: false })`) if any breaks.
2. **(High) `linkedItemType` confusion in calendar trigger.** CONTEXT.md hypothesis is wrong. Use `event.dossier_id` + `event.dossier?.type`. Falling back to `useDossier(event.dossier_id)` if type absent is acceptable but adds a query — confirm with planner.
3. **(High) Engagement-create prefill is unsupported.** Wire CTA to navigate to the wizard root; prefill is deferred. Adjust D-13 test case 9 wording.
4. **(High) Sensitivity threshold ambiguity.** Two source-of-truth files disagree on what level 3 means. Recommend `>= 3` for the chip; planner asks user.
5. **(Med) Commitment row click is a route navigation, not a dialog.** D-08 expectation that "drawer stays open behind dialog" doesn't hold — drawer closes on navigation. Adjust D-13 test case 10 to assert navigation, not DOM persistence.
6. **(Med) MyTasks open-trigger ergonomics.** No clear dossier affordance; recommend deferring or wrapping the glyph in a clickable button only when `work_item_type === 'dossier'`.
7. **(Med) Activity field name mismatch.** Use `recent_activities` not `activities`. Use `actor.name` not `actor_name`.
8. **(Med) Mobile padding-left/right is physical in handoff.** Convert to `padding-inline` in port to satisfy QA-01 / CLAUDE.md mandate.
9. **(Low) i18n namespace location confusion.** Use `frontend/src/i18n/{en,ar}/` + register in `i18n/index.ts`. Don't put it under `public/locales/`.
10. **(Low) Drawer does not pass `validateSearch` for `dossierType` if user shares a URL with a stale type that no longer matches the dossier.** Acceptable — drawer opens; type-aware routes (Open full dossier) still work because `getDossierDetailPath` validates internally.
11. **(Low) Size-limit drift.** Drawer is small (~6KB gz expected). If measurement shows > 8KB, raise the Total JS budget rather than adding a per-component budget.
12. **(Low) Visual regression flake from font-loading or scroll position.** Reuse the Phase 40 list-pages-visual.spec.ts pattern: clock freeze + transition suppression + font-readiness wait + `data-loading="false"` ready-marker.

## Sources

### Primary (HIGH confidence)

- `frontend/src/types/dossier-overview.types.ts` — full response shape verified
- `frontend/src/types/unified-dossier-activity.types.ts` — UnifiedActivity field names verified
- `frontend/src/hooks/useDossierOverview.ts` — sole data hook
- `frontend/src/components/ui/sheet.tsx` — primitive choice rationale
- `frontend/src/components/layout/AppShell.tsx#L82,L225` — HeroUI Drawer placement pattern
- `frontend/src/routes/_protected.tsx` — validateSearch absence
- `frontend/src/routes/_protected/dossiers/engagements/create.tsx` — engagement-create route
- `frontend/src/components/dossier/wizard/schemas/engagement.schema.ts` — wizard schema (no dossier_id field)
- `frontend/src/lib/i18n/toArDigits.ts` — utility location
- `frontend/src/lib/dossier-routes.ts` — route helpers
- `frontend/src/components/list-page/sensitivity.ts` — chip class lookup + level meanings
- `frontend/src/pages/Dashboard/widgets/{RecentDossiers,MyTasks,OverdueCommitments,ForumsStrip}.tsx` — trigger surface inventory
- `frontend/src/components/calendar/UnifiedCalendar.tsx` — onEventClick API
- `frontend/src/domains/calendar/types/index.ts` — CalendarEvent shape
- `frontend/src/pages/WorkBoard/{KCard,WorkBoard,BoardToolbar}.tsx` — Phase 39 patterns (handleItemClick + stub pattern)
- `frontend/src/i18n/index.ts` — namespace registration pattern
- `/tmp/inteldossier-handoff/inteldossier/project/src/{pages.jsx,app.css}` — handoff source verified verbatim at all cited line numbers
- `frontend/.size-limit.json` — current budget structure
- `frontend/tests/e2e/list-pages-visual.spec.ts` — visual regression precedent

### Secondary (MEDIUM confidence)

- TanStack Router docs (validateSearch merge behavior at parent/child boundary) — verified by inspection of countries/organizations route patterns

### Tertiary (LOW confidence)

- None — all claims trace to a primary or secondary source.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all primitives, hooks, and helpers are codebase-verified to exist
- Architecture: HIGH — URL-search-param + Sheet pattern matches Phase 38/39/40 precedent
- Pitfalls: HIGH — most pitfalls are CONTEXT.md hypothesis corrections grounded in codebase grep
- Validation Architecture: HIGH — directly maps to D-13 + D-12 + D-14
- Open questions: 17/17 resolved with explicit recommendations; 4 user assumptions flagged for confirmation

**Research date:** 2026-05-01
**Valid until:** 2026-05-31 (30 days — drawer surface stable, no fast-moving dependencies)

## RESEARCH COMPLETE
