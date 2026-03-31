# Phase 12: Enriched Dossier Pages - Research

**Researched:** 2026-03-31
**Domain:** React frontend layout refactoring, TanStack Router nested routes, Supabase schema extension
**Confidence:** HIGH

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Refactor existing `DossierDetailLayout` into a new `DossierShell` component mirroring Phase 11's `WorkspaceShell` pattern: sticky header, tab bar, RelationshipSidebar, child outlet. Preserve existing features (presence indicators, export dialog, AddToDossierMenu).
- **D-02:** Tabs are URL-driven routes — each tab is a nested route (e.g., `/dossiers/countries/$id/overview`). Deep-linkable, browser back/forward works.
- **D-03:** Shared base tabs across all 8 types: Overview, Engagements, Docs, Tasks, Timeline, Audit. Type-specific extras via `tabConfig` prop: Country (+Positions), Organization (+MoUs), Topic (+Positions), Elected Officials (+Committees). Forum/Working Group/Person: shared tabs only. Engagement: continues using WorkspaceShell, NOT DossierShell.
- **D-04:** Desktop sidebar: icon-toggle collapse button (full ~280px ↔ icon strip). No drag resize. Uses existing `PanelRightClose`/`PanelRightOpen` icon pattern.
- **D-05:** Mobile (below `lg`): bottom sheet/drawer — "Relationships" button in header opens half-screen sheet. Draggable to full height.
- **D-06:** Sidebar content: linked dossiers grouped by relationship tier, count badges per tier, collapsible tier sections, click-to-navigate.
- **D-07:** Quick-add uses search popover — reuses `DossierSelector` pattern. Relationship type/tier set during linking.
- **D-08:** Overview tab: responsive card grid. Shared cards (Summary Stats, Recent Activity) for all types. Type-specific cards injected per type. Each card is its own component.
- **D-09:** Enrichment cards per type as specified (Country: Bilateral Summary + Key Contacts + Engagements by Stage; Organization: Membership + Representatives + MoU Status Tracker; Topic: Connected Anchors + Position Tracker; Working Group: Member List + Meeting Schedule + Deliverables Tracker; Person: Metadata + Engagement History; Forum: Metadata + Session info; Elected Official: Office/term + Committee Memberships).
- **D-10:** Simpler types (Forum, Working Group, Person) use metadata card + activity feed — no filler cards.
- **D-11:** Position tracker (Topic, Country) and deliverables tracker (Working Group) live as Overview cards showing current state, not dedicated tabs. Summary-level, not full CRUD.
- **D-12:** Database: extend with `elected_official_metadata` (1:1 via `person_id` FK) and `committee_memberships` table. NOTE: Research found existing `elected_officials` table already uses different schema (standalone extension of dossiers, not persons — see Architecture Patterns).
- **D-13:** Navigation: Elected Officials gets separate sidebar item under Dossiers group at route `/dossiers/elected-officials/$id`.
- **D-14:** List page: data table with office columns. Filterable by party, term status, organization.
- **D-15:** Detail page uses DossierShell with extra "Committees" tab.

### Claude's Discretion

- Loading skeletons per tab
- Empty states per tab
- Exact responsive breakpoints for card grid (2-col on md+, single col on mobile)
- Tab order within the bar
- Animation/transition for sidebar collapse
- DossierShell internal state management (sidebar open/closed persistence)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                 | Research Support                                                                                                                                                                   |
| ------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOSS-01 | All 8 dossier types share consistent detail page: header bar, tab bar, collapsible RelationshipSidebar      | DossierShell component wrapping WorkspaceShell pattern; nested route tree per type                                                                                                 |
| DOSS-02 | RelationshipSidebar shows linked dossiers grouped by tier with quick-add, labels, click-to-navigate         | RelationshipNavigator + DossierSelector exist; dossier_relationships table exists in backend                                                                                       |
| DOSS-03 | Country detail: bilateral summary, key contacts, engagements by lifecycle stage                             | CountryDossierDetail.tsx + useDossierOverview hook exist; lifecycle_stage column exists                                                                                            |
| DOSS-04 | Organization detail: membership structure, key representatives, MoU tracker                                 | OrganizationDossierDetail.tsx + DossierMoUsTab.tsx exist; mous API exists                                                                                                          |
| DOSS-05 | Topic detail: cross-cutting view + position tracker                                                         | TopicDossierDetail.tsx + DossierPositionsTab.tsx exist; positions API exists                                                                                                       |
| DOSS-06 | Working Group detail: member list, meeting schedule, deliverables tracker                                   | WorkingGroupDossierDetail.tsx + existing section components (MemberOrganizations, MeetingSchedule, DeliverablesTracker) exist                                                      |
| DOSS-07 | Person detail: engagement history chronologically, org affiliation                                          | PersonDossierDetail.tsx + InteractionHistory section exist                                                                                                                         |
| DOSS-08 | Elected Officials: full domain — list page, detail page with term/office metadata and committee memberships | elected_officials table exists (standalone schema, not persons extension); ElectedOfficialProfile.tsx + CommitteeAssignments.tsx + TermHistory.tsx exist; NO backend API route yet |
| DOSS-09 | RelationshipSidebar hidden on mobile, replaced by sheet/drawer                                              | useResponsive hook exists; HeroUI sheet/drawer pattern available                                                                                                                   |
| DOSS-10 | Dossier detail tabs (Engagements, Docs, Tasks, Timeline, Audit) consistent across all 8 types               | WorkspaceTabNav pattern is the model; URL-driven nested routes required                                                                                                            |

</phase_requirements>

---

## Summary

Phase 12 converts all 7 non-engagement dossier types plus Elected Officials from their current ad-hoc detail pages into a consistent `DossierShell` structure modeled on `WorkspaceShell` (Phase 11). The primary work is: (1) extracting a generic `DossierShell` + `DossierTabNav` from `DossierDetailLayout`, (2) converting each type's route from a single `$id.tsx` file into a nested route tree with `$id.tsx` as layout and `$id.overview.tsx`, `$id.tasks.tsx`, etc. as child routes, (3) building `RelationshipSidebar` as a new component that replaces `MiniRelationshipGraph`, and (4) standing up Elected Officials as a first-class domain with list page, detail page, and backend CRUD.

The codebase is well-prepared: `WorkspaceShell` + `WorkspaceTabNav` are proven patterns to copy, type-specific detail components already exist for all 7 current types, the `elected_officials` table is already migrated with a rich schema, section subcomponents exist (`ElectedOfficialProfile`, `CommitteeAssignments`, `TermHistory`), and `DossierSelector` is ready for the quick-add popover. The main gaps are: the nested route tree does not yet exist for dossier types (current routes are single-file `$id.tsx`), `RelationshipSidebar` does not exist yet, and there is no backend API route for elected officials.

**Primary recommendation:** Mirror the engagement workspace pattern exactly. Build `DossierShell` + `DossierTabNav` first (Wave 0), then expand each dossier type's route tree to nested routes (Wave 1), then build `RelationshipSidebar` (Wave 2), then add enrichment cards (Wave 3), then stand up Elected Officials domain end-to-end (Wave 4).

---

## Standard Stack

### Core

| Library            | Version  | Purpose                                                 | Why Standard                                       |
| ------------------ | -------- | ------------------------------------------------------- | -------------------------------------------------- |
| TanStack Router v5 | ^5.x     | Nested file-based routes for tab navigation             | Already used; `createFileRoute` + `Outlet` pattern |
| TanStack Query v5  | ^5.x     | Data fetching per tab with stale-while-revalidate       | Already used for all dossier hooks                 |
| React 19           | ^19.x    | Component model, lazy loading per tab                   | Already used                                       |
| Tailwind CSS v4    | ^4.x     | Utility-first responsive + logical RTL properties       | Already used                                       |
| HeroUI v3          | ^3.x     | Sheet/drawer for mobile RelationshipSidebar             | Already installed; use for bottom sheet            |
| lucide-react       | existing | PanelRightClose/PanelRightOpen icons for sidebar toggle | Already used in DossierDetailLayout                |

### Supporting

| Library               | Version  | Purpose                                                | When to Use                             |
| --------------------- | -------- | ------------------------------------------------------ | --------------------------------------- |
| i18next               | existing | Tab labels, enrichment card strings, bilingual content | All user-visible strings                |
| clsx + tailwind-merge | existing | Conditional classnames in DossierShell                 | cn() utility already available          |
| Supabase JS v2        | existing | Elected officials CRUD queries                         | New elected-officials backend API route |

### Alternatives Considered

| Instead of                                    | Could Use                                            | Tradeoff                                                                                           |
| --------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| HeroUI Sheet for mobile sidebar               | Custom drawer                                        | HeroUI Sheet is accessibility-correct, avoids reinventing focus trap                               |
| URL-driven tabs (nested routes)               | `?tab=` search param (current country approach)      | Nested routes enable back/forward + deep links per D-02; already proven in Phase 11                |
| Extending persons table for elected officials | New elected_officials domain (what's actually built) | The DB already has standalone `elected_officials` table referencing `dossiers` directly — use that |

---

## Architecture Patterns

### Recommended Project Structure

New files/folders this phase creates:

```
frontend/src/
├── components/
│   ├── dossier/
│   │   ├── DossierShell.tsx            # NEW — replaces DossierDetailLayout as layout wrapper
│   │   ├── DossierTabNav.tsx           # NEW — mirrors WorkspaceTabNav, accepts tabConfig prop
│   │   └── RelationshipSidebar.tsx     # NEW — replaces MiniRelationshipGraph in sidebar slot
│   └── elected-officials/              # NEW — domain-specific components
│       ├── ElectedOfficialListTable.tsx
│       └── ElectedOfficialOverviewCards.tsx
├── routes/_protected/dossiers/
│   ├── countries/
│   │   ├── $id.tsx                     # REFACTOR — becomes layout (DossierShell), renders Outlet
│   │   ├── $id.overview.tsx            # NEW
│   │   ├── $id.engagements.tsx         # NEW
│   │   ├── $id.docs.tsx                # NEW
│   │   ├── $id.tasks.tsx               # NEW
│   │   ├── $id.timeline.tsx            # NEW
│   │   ├── $id.audit.tsx               # NEW
│   │   └── $id.positions.tsx           # NEW (Country extra tab)
│   ├── organizations/                  # same pattern + $id.mous.tsx
│   ├── topics/                         # same pattern + $id.positions.tsx
│   ├── forums/                         # shared tabs only
│   ├── working_groups/                 # shared tabs only
│   ├── persons/                        # shared tabs only
│   └── elected-officials/              # NEW domain
│       ├── index.tsx                   # NEW — list page
│       ├── $id.tsx                     # NEW — DossierShell layout
│       ├── $id.overview.tsx            # NEW
│       ├── $id.engagements.tsx         # NEW
│       ├── $id.docs.tsx                # NEW
│       ├── $id.tasks.tsx               # NEW
│       ├── $id.timeline.tsx            # NEW
│       ├── $id.audit.tsx               # NEW
│       └── $id.committees.tsx          # NEW (extra tab)
backend/src/api/
└── elected-officials.ts                # NEW — CRUD for elected_officials + committee_assignments JSONB
```

### Pattern 1: DossierShell (mirrors WorkspaceShell)

**What:** Sticky header + DossierTabNav + RelationshipSidebar + Outlet. Accepts `tabConfig` for extra type-specific tabs.
**When to use:** Every non-engagement dossier type.

```tsx
// Source: WorkspaceShell.tsx (Phase 11 pattern)
interface DossierShellProps {
  dossierId: string
  dossierType: DossierType
  tabConfig?: DossierTabConfig[] // extra tabs injected by type-specific routes
  children: ReactNode
}

export function DossierShell({
  dossierId,
  dossierType,
  tabConfig,
  children,
}: DossierShellProps): ReactElement {
  const { direction } = useDirection()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { data: dossier, isLoading } = useDossier(dossierId)

  return (
    <div dir={direction} className="flex min-h-screen flex-col bg-background">
      {/* Sticky header — same visual language as WorkspaceShell */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6 lg:px-8 py-3">
        {/* title + presence + export + add-to-dossier + mobile relationships trigger */}
      </header>

      {/* Tab nav — sticky below header */}
      <DossierTabNav dossierId={dossierId} dossierType={dossierType} extraTabs={tabConfig} />

      {/* Content + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {children} {/* Outlet renders here */}
        </main>
        {/* RelationshipSidebar — hidden below lg, shown on lg+ */}
        <RelationshipSidebar
          dossierId={dossierId}
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
          className="hidden lg:flex"
        />
      </div>
    </div>
  )
}
```

### Pattern 2: URL-Driven Nested Routes (TanStack Router)

**What:** `$id.tsx` becomes the layout file rendering `DossierShell` with `<Outlet />`. Child route files handle each tab.
**When to use:** Every dossier type route conversion.

```tsx
// frontend/src/routes/_protected/dossiers/countries/$id.tsx
// Source: /engagements/$engagementId.tsx layout pattern
export const Route = createFileRoute('/_protected/dossiers/countries/$id')({
  component: CountryDossierLayout,
})

function CountryDossierLayout(): ReactElement {
  const { id } = Route.useParams()
  return (
    <DossierShell
      dossierId={id}
      dossierType="country"
      tabConfig={[{ key: 'positions', labelKey: 'tabs.positions', path: 'positions' }]}
    >
      <Outlet />
    </DossierShell>
  )
}

// frontend/src/routes/_protected/dossiers/countries/$id.overview.tsx
export const Route = createFileRoute('/_protected/dossiers/countries/$id/overview')({
  component: CountryOverviewTab,
})
```

### Pattern 3: RelationshipSidebar

**What:** Shows linked dossiers grouped by tier (Strategic/Operational/Informational or existing tier enum). Toggle collapses to icon strip. Mobile: HeroUI Sheet triggered from header button.
**When to use:** All 8 dossier types inside DossierShell.

```tsx
// Sidebar uses existing RelationshipNavigator + DossierSelector
// DossierSelector already accepts onSelect callback — reuse for quick-add popover
// Tier grouping: read from dossier_relationships table `tier` or `relationship_type` column
```

### Pattern 4: Elected Officials Backend API

**What:** Express router at `/api/elected-officials` with list (with filters), get-by-id (joins dossiers + elected_officials), create/update. Committee assignments stored as JSONB in `elected_officials.committee_assignments`.
**When to use:** Elected Officials list page and detail page.

```typescript
// Source: backend/src/api/countries.ts pattern
// GET /api/elected-officials?party=&is_current_term=&organization_id=
// GET /api/elected-officials/:id
// POST /api/elected-officials
// PATCH /api/elected-officials/:id
```

### Anti-Patterns to Avoid

- **Search-param tabs (`?tab=`):** Current country route uses `validateSearch: { tab?: string }` — this must be replaced with nested routes per D-02. Do NOT keep the search param approach.
- **Embedding all tab content in `$id.tsx`:** Current type-specific pages (`CountryDossierDetail.tsx`) render everything in one component. Phase 12 splits these into per-tab route files with lazy loading.
- **Using MiniRelationshipGraph in DossierShell:** The new `RelationshipSidebar` replaces it. MiniRelationshipGraph stays in place on any pages not yet migrated; do not remove it globally.
- **Adding `elected_official` to `dossier-routes.ts` DOSSIER_TYPE_TO_ROUTE as `persons`:** The elected_officials domain gets its OWN route segment (`elected-officials`), not piggy-backed on `/persons`. Update `dossier-routes.ts` to add `elected_official: 'elected-officials'`.

---

## Don't Hand-Roll

| Problem                                      | Don't Build          | Use Instead                                                                         | Why                                                           |
| -------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Bottom sheet / drawer for mobile sidebar     | Custom CSS drawer    | HeroUI v3 Sheet/Drawer                                                              | Accessibility focus trap, a11y ARIA managed                   |
| Sticky positioned tab bar                    | Custom sticky logic  | `sticky top-[Npx] z-10` Tailwind utility (proven in WorkspaceTabNav)                | Already battle-tested in Phase 11                             |
| Search-in-popover for quick-add relationship | New search component | `DossierSelector.tsx` (already exists at `components/dossier/DossierSelector.tsx`)  | Bilingual, debounced, covers all types                        |
| Dossier type route helpers                   | New mapping object   | `getDossierRouteSegment()` in `lib/dossier-routes.ts` (extend for elected_official) | Single source of truth                                        |
| Horizontal scroll tab bar with auto-scroll   | Custom scroll logic  | WorkspaceTabNav scroll pattern (already proven)                                     | Snap scroll + activeTabRef.scrollIntoView already implemented |

**Key insight:** Nearly every subproblem in Phase 12 has an existing solution in the codebase. The phase is about wiring together proven parts, not invention.

---

## Common Pitfalls

### Pitfall 1: Route Tree Nesting Depth — TanStack Router Layout Routes

**What goes wrong:** When converting `$id.tsx` from a leaf route to a layout route that renders `<Outlet />`, TanStack Router requires the parent route to not render its own content — it must render only `<Outlet />`. If the old component JSX stays in `$id.tsx` alongside `<Outlet />`, child routes double-render.
**Why it happens:** The current `$id.tsx` files are leaf routes. Converting them to layout routes means stripping their content out entirely and moving it to `$id.overview.tsx`.
**How to avoid:** The new `$id.tsx` must render ONLY `<DossierShell ...><Outlet /></DossierShell>`. All current page content moves to `$id.overview.tsx`.
**Warning signs:** Seeing dossier header + content rendered twice, or child tab content appearing outside the shell.

### Pitfall 2: `dossier-routes.ts` Missing `elected_official` Entry

**What goes wrong:** `DOSSIER_TYPE_TO_ROUTE` does not have `elected_official` — it was intentionally commented with "all persons use /persons route". Phase 12 changes this: elected officials get `/dossiers/elected-officials`.
**Why it happens:** The note says elected_official is a person_subtype. Phase 12 elevates it to a first-class domain.
**How to avoid:** Add `elected_official: 'elected-officials'` to `DOSSIER_TYPE_TO_ROUTE` and update `isValidDossierType` check.
**Warning signs:** `getDossierDetailPath(id, 'elected_official')` returning `/dossiers/countries/...` (falls through to default).

### Pitfall 3: Elected Officials Schema Is Standalone (Not Persons Extension)

**What goes wrong:** CONTEXT.md D-12 describes extending a `persons` table with `elected_official_metadata`. But the actual DB schema (migration `20260118000001`) uses a standalone `elected_officials` table that is a Class Table Inheritance extension of `dossiers` directly — NOT of persons.
**Why it happens:** The context doc described an intended design; the actual migration implemented a different (richer) schema.
**How to avoid:** The backend API must JOIN `dossiers` + `elected_officials` (not `persons`). Committee assignments are stored as JSONB (`committee_assignments` column) in `elected_officials`, not a separate `committee_memberships` table. No new migration needed for the elected_officials table itself. The only potential migration needed is RLS policy addition if not present.
**Warning signs:** Writing backend code that joins `persons` + `elected_official_metadata` — that table does not exist.

### Pitfall 4: Sidebar Z-Index Conflicts With Sticky Header

**What goes wrong:** The RelationshipSidebar uses `sticky` positioning and its `z-index` conflicts with the sticky header (`z-20`) or tab nav (`z-10`), causing visual overlap.
**Why it happens:** DossierDetailLayout already has this pattern; WorkspaceShell uses `z-20` for header.
**How to avoid:** DossierShell header: `z-20`, tab nav: `z-10`, sidebar: no z-index (natural flow). Mobile sheet: use HeroUI's default z-index (overlay/dialog layer).
**Warning signs:** Sidebar appearing on top of dropdown menus, tooltips not visible over sidebar.

### Pitfall 5: RTL Sidebar Position

**What goes wrong:** In RTL mode, the RelationshipSidebar should appear on the LEFT (logical start) of the content area, not the right. Using CSS `right-0` or physical direction classes causes incorrect placement.
**Why it happens:** RTL layouts flip the reading direction; sidebar content that appears after main content in DOM order naturally moves left in RTL flex layout.
**How to avoid:** Use `flex-row` with sidebar as the LAST child in DOM order (it will appear on left in RTL). Do NOT use `ms-auto` or physical `right/left` positioning. Verify with `useDirection().isRTL`.

### Pitfall 6: Tab Routing Requires `routeTree.gen.ts` Regeneration

**What goes wrong:** After adding the nested tab route files, `routeTree.gen.ts` is stale and components reference old types, causing TypeScript errors.
**Why it happens:** TanStack Router auto-generates the route tree; the generator must be re-run after adding route files.
**How to avoid:** After adding any new route files, run `pnpm dev` or the route generator command to regenerate `routeTree.gen.ts`. Note: `routeTree.gen.ts` is already modified per the current git status — confirm clean state before starting route work.

---

## Code Examples

### DossierTabNav — Accepts Extra Tabs via Props

```tsx
// Source: WorkspaceTabNav.tsx pattern (adapted)
const BASE_DOSSIER_TABS = [
  { key: 'overview', labelKey: 'tabs.overview', path: 'overview' },
  { key: 'engagements', labelKey: 'tabs.engagements', path: 'engagements' },
  { key: 'docs', labelKey: 'tabs.docs', path: 'docs' },
  { key: 'tasks', labelKey: 'tabs.tasks', path: 'tasks' },
  { key: 'timeline', labelKey: 'tabs.timeline', path: 'timeline' },
  { key: 'audit', labelKey: 'tabs.audit', path: 'audit' },
]

interface DossierTabConfig {
  key: string
  labelKey: string
  path: string
}

interface DossierTabNavProps {
  dossierId: string
  dossierType: string
  extraTabs?: DossierTabConfig[]
}

// Render: [...BASE_DOSSIER_TABS, ...(extraTabs ?? [])].map(...)
// matchRoute: to: `/dossiers/${getDossierRouteSegment(dossierType)}/$id/${tab.path}`
```

### Elected Officials Backend Route Skeleton

```typescript
// Source: backend/src/api/countries.ts pattern
// backend/src/api/elected-officials.ts
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { party, is_current_term, organization_id, page = '1', limit = '20' } = req.query
    // JOIN dossiers + elected_officials
    // Filter by party_en, is_current_term, organization_id
    // Return paginated list with office/term columns
  } catch (error) {
    next(error)
  }
})

router.get('/:id', authenticateToken, async (req, res, next) => {
  // SELECT d.*, eo.* FROM dossiers d JOIN elected_officials eo ON eo.id = d.id WHERE d.id = $1
})
```

### Updating dossier-routes.ts

```typescript
// Add to DOSSIER_TYPE_TO_ROUTE:
export const DOSSIER_TYPE_TO_ROUTE: Record<string, string> = {
  country: 'countries',
  organization: 'organizations',
  person: 'persons',
  engagement: 'engagements',
  forum: 'forums',
  working_group: 'working_groups',
  topic: 'topics',
  elected_official: 'elected-officials', // ADD THIS
}
```

---

## State of the Art

| Old Approach                                              | Current Approach                                                   | When Changed | Impact                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------ | ------------ | ---------------------------------------------------------- |
| Single `$id.tsx` leaf route per dossier type              | Nested route tree: `$id.tsx` (layout) + `$id.{tab}.tsx` (children) | Phase 12     | Enables URL-driven deep-linking per tab                    |
| `MiniRelationshipGraph` in sidebar slot                   | `RelationshipSidebar` with tier grouping + quick-add               | Phase 12     | Richer relationship navigation                             |
| `?tab=searchParam` tab state                              | URL path segment per tab                                           | Phase 12     | Browser back/forward, deep links, no state loss on refresh |
| Elected officials treated as person subtype at `/persons` | First-class domain at `/elected-officials`                         | Phase 12     | Separate nav item, dedicated list/detail, full CRUD        |

---

## Open Questions

1. **Relationship tier taxonomy for RelationshipSidebar**
   - What we know: The `dossier_relationships` table exists. Phase 11 ContextTab uses tier labels: "Anchors", "Activities", "Threads", "Contacts".
   - What's unclear: Are those tier names stored in the DB as an enum/column, or derived from `relationship_type`? The backend `relationships.ts` API only exposes health/recommendations endpoints, not list endpoints.
   - Recommendation: Check `dossier_relationships` table schema and the existing `RelationshipNavigator.tsx` component's data source before building RelationshipSidebar. If no list endpoint exists, a new `GET /api/dossiers/:id/relationships` endpoint is needed.

2. **`committee_assignments` JSONB vs separate table for committees**
   - What we know: The actual `elected_officials` table stores committee assignments as JSONB (`committee_assignments` column). CONTEXT.md D-12 described a separate `committee_memberships` table.
   - What's unclear: Is the JSONB schema sufficient for the Committees tab display, or does the plan need a migration to normalize into a separate table?
   - Recommendation: Use the existing JSONB approach for Phase 12. The JSONB structure `[{ name_en, name_ar, role, is_active }]` has enough fields for the Committees tab. Normalization is a future concern.

3. **RLS policy for `elected_officials` table**
   - What we know: The migration adds the table but the last RLS audit was migration `20260324000001_rls_audit_fix.sql`.
   - What's unclear: Whether `elected_officials` table has RLS enabled and correct policies.
   - Recommendation: Wave 0 of planning should include an RLS verification + policy migration step for `elected_officials` table, consistent with the SECURITY DEFINER pattern used in Phase 10.

---

## Environment Availability

Step 2.6: SKIPPED (no new external dependencies — all tooling already installed, DB table already migrated).

---

## Validation Architecture

### Test Framework

| Property           | Value                               |
| ------------------ | ----------------------------------- |
| Framework          | Vitest                              |
| Config file        | `frontend/vitest.config.ts`         |
| Quick run command  | `pnpm --filter frontend test --run` |
| Full suite command | `pnpm test`                         |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                       | Test Type | Automated Command                                       | File Exists? |
| ------- | -------------------------------------------------------------- | --------- | ------------------------------------------------------- | ------------ |
| DOSS-01 | DossierShell renders header + tabs + sidebar slot              | unit      | `pnpm --filter frontend test --run DossierShell`        | ❌ Wave 0    |
| DOSS-02 | RelationshipSidebar groups dossiers by tier, renders quick-add | unit      | `pnpm --filter frontend test --run RelationshipSidebar` | ❌ Wave 0    |
| DOSS-08 | Elected officials list and detail pages render                 | unit      | `pnpm --filter frontend test --run ElectedOfficial`     | ❌ Wave 0    |
| DOSS-09 | RelationshipSidebar hidden below lg, sheet visible on mobile   | unit      | `pnpm --filter frontend test --run RelationshipSidebar` | ❌ Wave 0    |
| DOSS-10 | DossierTabNav renders correct tabs for each dossier type       | unit      | `pnpm --filter frontend test --run DossierTabNav`       | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** `pnpm --filter frontend test --run`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/components/dossier/__tests__/DossierShell.test.tsx` — covers DOSS-01
- [ ] `frontend/src/components/dossier/__tests__/DossierTabNav.test.tsx` — covers DOSS-10
- [ ] `frontend/src/components/dossier/__tests__/RelationshipSidebar.test.tsx` — covers DOSS-02, DOSS-09

---

## Project Constraints (from CLAUDE.md)

| Directive                                                               | Impact on Phase 12                                                                              |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| RTL-first: logical CSS properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`) | All DossierShell, DossierTabNav, RelationshipSidebar layout must use logical properties         |
| `dir={isRTL ? 'rtl' : 'ltr'}` on containers                             | DossierShell root div must use `useDirection().direction`                                       |
| No `textAlign: right` or `text-right`                                   | Use `text-start` only for dossier name headings                                                 |
| Mobile-first breakpoints: base → sm → md → lg                           | RelationshipSidebar: `hidden lg:flex`; card grid: `grid-cols-1 md:grid-cols-2`                  |
| Min 44px touch targets: `min-h-11 min-w-11`                             | All tab links, sidebar toggle buttons, quick-add buttons                                        |
| HeroUI v3 component hierarchy: HeroUI → Aceternity → Kibo-UI → shadcn   | Use HeroUI Sheet for mobile RelationshipSidebar drawer                                          |
| TanStack Router `createFileRoute` + `beforeLoad` guards                 | All new route files follow this pattern                                                         |
| Supabase migrations via Supabase MCP                                    | Any new migration (e.g., RLS for elected_officials) via MCP, not direct SQL                     |
| No `react-resizable-panels` for DossierShell sidebar                    | Icon-toggle collapse only per D-04                                                              |
| `useTranslation` with feature-specific namespaces                       | New strings go in `dossier` namespace; elected officials may need `elected-officials` namespace |
| Explicit return types on all functions                                  | `function DossierShell(...): ReactElement`                                                      |
| No `any` types                                                          | ElectedOfficialExtension type already defined in `dossier-api.ts` — use it                      |
| `semi: false`, single quotes, trailing commas                           | Match existing codebase style exactly                                                           |

---

## Sources

### Primary (HIGH confidence)

- Direct file reads: `WorkspaceShell.tsx`, `WorkspaceTabNav.tsx`, `DossierDetailLayout.tsx` — WorkspaceShell pattern, toggle sidebar, tab nav implementation
- Direct file reads: `routes/_protected/dossiers/countries/$id.tsx` — current route pattern (search-param tabs, lazy loading, type guard pattern)
- Direct file reads: `supabase/migrations/20260118000001_create_elected_officials_entity.sql` — actual DB schema for elected_officials
- Direct file reads: `lib/dossier-routes.ts` — DOSSIER_TYPE_TO_ROUTE map, `elected_official` absent
- Direct file reads: `components/layout/navigation-config.ts` — Dossiers group structure, no elected-officials entry yet
- Direct file reads: `services/dossier-api.ts` — ElectedOfficialExtension type exists, JSONB committee schema
- Direct file read: `.planning/phases/12-enriched-dossier-pages/12-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)

- Directory listing: `components/dossier/sections/` — CommitteeAssignments.tsx, TermHistory.tsx, ElectedOfficialProfile.tsx confirmed to exist
- Directory listing: `components/relationships/` — RelationshipNavigator.tsx, RelationshipForm.tsx confirmed to exist
- Directory listing: `components/dossiers/` — DossierMoUsTab.tsx confirmed to exist
- Directory listing: `components/positions/` — DossierPositionsTab.tsx confirmed to exist
- grep: `backend/src/api/` — no `elected-officials.ts` exists; backend gap confirmed

### Tertiary (LOW confidence)

- Assumed: `dossier_relationships` table structure and available columns (not verified against schema) — check before building RelationshipSidebar
- Assumed: RLS status of `elected_officials` table (not verified) — check via Supabase MCP before deploying

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries already installed, no new dependencies needed
- Architecture: HIGH — WorkspaceShell + WorkspaceTabNav are proven patterns; direct code reading confirms reuse points
- Elected Officials schema: HIGH — migration file read directly; standalone table confirmed (NOT persons extension)
- RelationshipSidebar tier data: LOW — relationship table schema not verified against actual columns
- Pitfalls: HIGH — identified from direct code inspection of current implementation

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable stack, 30-day window)
