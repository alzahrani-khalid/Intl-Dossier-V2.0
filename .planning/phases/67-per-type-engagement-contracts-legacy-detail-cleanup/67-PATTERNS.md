# Phase 67: Per-Type Engagement Contracts & Legacy Detail Cleanup - Pattern Map

**Mapped:** 2026-06-13
**Files analyzed:** 40+ (7 engagements tab routes, shared tab component, overview service, 6 legacy details + 6 page wrappers + 19 section components, person/EO data planes, get_person_full SQL, i18n bundles, phase 65/66 artifacts)
**Analogs found:** every PERENG work surface has an in-repo analog; 2 gaps listed under "No Analog Found"

## Headline Findings

1. **All 7 per-type Engagements tabs are the same component.** Every `dossiers/{segment}/$id/engagements.tsx` route lazy-loads the type-agnostic `DossierEngagementsTab`, which reads `fetchDossierOverview(include_sections: ['related_dossiers', 'calendar_events'])` — i.e. `dossier_relationships` rows + past `calendar_entries`. **Nothing reads `engagement_dossiers.host_organization_id` (PERENG-01) or `person_engagements` (PERENG-02) on any tab.**
2. **`get_person_full.recent_engagements` is already typed, fetched, and rendered — but only on the legacy `/persons/$personId` route.** The only dossier-component renderer (`InteractionHistory.tsx`) sits inside the dead `PersonDossierDetail` chain. Salvage it or its mapping for PERENG-02.
3. **The EO data plane drops the payload.** `backend/src/api/elected-officials.ts` GET `/:id` calls `get_person_full` then returns **only** `data: person` (line ~221) — `recent_engagements` never reaches the EO frontend, and the EO frontend type has no such field. Wiring the EO tab requires either a backend passthrough or reusing the persons edge-function path (EO **is** `person_subtype='elected_official'`).
4. **All 6 remaining `*DossierDetail` components are dead chains** (component → single `pages/dossiers/*DossierPage.tsx` wrapper → zero importers; zero `routeTree.gen.ts` references; zero tests). Deleting them orphans 15 of the 19 `components/dossier/sections/*` files (4 are already orphaned from 65-03) and leaves `DossierDetailLayout` barrel-export-only.
5. **`person_engagements` has no writers anywhere in app code** (frontend, backend, edge functions — only migrations reference it). Its `engagement_id` FK joins the **legacy `engagements` table**, whose id-space differs from the routed `/engagements/$engagementId` workspace (which is `dossiers.id` per ENGPOS-01). Both facts are plan-shaping risks (see Risks).

## File Classification

| New/Modified File                                                                                                                      | Role            | Data Flow                | Closest Analog                                                                                                                                                                                 | Match Quality |
| -------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx` (modify) or new per-type tab component(s)                             | component       | request-response display | itself + `frontend/src/pages/dossiers/overview-cards/KeyContactsCard.tsx` (error contract)                                                                                                     | exact         |
| `frontend/src/routes/_protected/dossiers/organizations/$id/engagements.tsx` (modify, PERENG-01)                                        | route           | pass-through             | `frontend/src/routes/_protected/engagements/$engagementId/positions.tsx` (65-01 routed-tab + decision-header)                                                                                  | exact         |
| `frontend/src/routes/_protected/dossiers/persons/$id/engagements.tsx`, `.../elected-officials/$id/engagements.tsx` (modify, PERENG-02) | route           | pass-through             | same 65-01 pattern; per-type component swap mirrors `.../organizations/$id/overview.tsx` lazy import                                                                                           | exact         |
| New person-engagements reader (hook or service section)                                                                                | hook/service    | request-response         | `domains/persons/hooks/usePersons.ts` `usePerson` (personKeys.detail) — already returns `recent_engagements`                                                                                   | exact         |
| New hosted-engagements reader for org (if PERENG-01 goes data-route)                                                                   | service section | request-response         | `frontend/src/hooks/useOrganizations.ts` lines 71–96 (host_organization_id query shape) + `services/dossier-overview.service.ts` `fetchRelatedDossiers` (section-fetcher shape, lines 329–376) | role-match    |
| `backend/src/api/elected-officials.ts` GET `/:id` (modify if EO passthrough chosen)                                                    | controller      | request-response         | its own handler lines 179–225 (add `recent_engagements` beside `person`)                                                                                                                       | exact         |
| Deletions: 6 `*DossierDetail`, 6 `*DossierPage`, orphaned `sections/*`                                                                 | deletion        | n/a                      | Phase 65-03 deletion plan (`.planning/phases/65-engagement-positions-tab-legacy-reconciliation/65-03-SUMMARY.md`)                                                                              | exact         |
| `frontend/src/i18n/{en,ar}/dossier-shell.json` (new tab keys if copy changes)                                                          | config (i18n)   | n/a                      | 65-01 single-owner bilingual key commit + parity unit test                                                                                                                                     | exact         |
| New unit tests                                                                                                                         | test            | n/a                      | `frontend/src/components/positions/__tests__/EngagementPositionsTab.test.tsx` (nav/parity), `frontend/src/pages/dossiers/overview-cards/__tests__/TypeCardErrorStates.test.tsx` (error flips)  | exact         |

## Per-Type Engagements Tab Reader Table (current state)

All seven route files are byte-similar; every tab reads the **same generic data**:

| Route file (`frontend/src/routes/_protected/dossiers/`) | Component rendered             | Query key                            | Data source                                                           | Per-type data read?                           |
| ------------------------------------------------------- | ------------------------------ | ------------------------------------ | --------------------------------------------------------------------- | --------------------------------------------- |
| `countries/$id/engagements.tsx`                         | `DossierEngagementsTab` (lazy) | `['dossier-tab', 'engagements', id]` | `fetchDossierOverview` → `dossier_relationships` + `calendar_entries` | none                                          |
| `organizations/$id/engagements.tsx`                     | same                           | same                                 | same                                                                  | **no `host_organization_id`** (PERENG-01 gap) |
| `forums/$id/engagements.tsx`                            | same                           | same                                 | same                                                                  | none                                          |
| `persons/$id/engagements.tsx`                           | same                           | same                                 | same                                                                  | **no `person_engagements`** (PERENG-02 gap)   |
| `elected-officials/$id/engagements.tsx`                 | same                           | same                                 | same                                                                  | **no `person_engagements`** (PERENG-02 gap)   |
| `topics/$id/engagements.tsx`                            | same                           | same                                 | same                                                                  | none                                          |
| `working_groups/$id/engagements.tsx`                    | same                           | same                                 | same                                                                  | none                                          |

**Shared component:** `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx` (129 lines, read in full)

- Query (lines 39–47): `useQuery({ queryKey: ['dossier-tab', 'engagements', dossierId], queryFn: () => fetchDossierOverview({ dossier_id, include_sections: ['related_dossiers', 'calendar_events'] }), staleTime: STALE_TIME.NORMAL })`
- Entries (lines 53–72): `data.related_dossiers.by_dossier_type.engagement` + `data.calendar_events.past`, merged newest-first; dossier rows link via `getDossierDetailPath(entry.id, 'engagement')`; event rows unlinked.
- i18n: `useTranslation('dossier-shell')`, `t('empty.engagements.title')` (keys exist EN+AR, `dossier-shell.json:87–89`); badge labels via colon-form `dossier-overview:relationshipType.*` / `eventType.*`.
- **It silently drops `isError`** — any change here must adopt the 66 contract (below).

**Service tables behind it:** `frontend/src/services/dossier-overview.service.ts` — `related_dossiers` reads `dossier_relationships` outgoing (line 339) + incoming (line 356); `calendar_events` reads `calendar_entries` (line 892). It never touches `engagement_dossiers` host columns or `person_engagements`.

**Tab registration:** base tab `{ key: 'engagements', labelKey: 'tabs.engagements', path: 'engagements' }` at `frontend/src/components/dossier/DossierTabNav.tsx:35`; per-type extra tabs are passed by the `$id.tsx` layout (see `ORGANIZATION_EXTRA_TABS` in `routes/_protected/dossiers/organizations/$id.tsx` → `<DossierShell dossierType="organization" tabConfig={...}>`).

## person_engagements Consumer Map (PERENG-02)

| Layer           | File                                                                                                                                                                                                                              | What it does                                                                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB table        | `supabase/migrations/20260110000003_persons_entity_management.sql`                                                                                                                                                                | creates `person_engagements`; first `get_person_full` (line 300)                                                                                                                                                                                                              |
| RPC (current)   | `supabase/migrations/20260202000001_merge_elected_official_into_person.sql` lines 428–544                                                                                                                                         | `get_person_full` returns `recent_engagements`: `json_agg({link: pe, engagement: e}) FROM person_engagements pe JOIN engagements e ON e.id = pe.engagement_id WHERE pe.person_id = $1 LIMIT 10` — **joins legacy `engagements`, not `engagement_dossiers`**; SECURITY DEFINER |
| Edge fn         | `supabase/functions/persons/index.ts` lines 199, 617                                                                                                                                                                              | full-profile passthrough (this is the path that delivers `recent_engagements` to the frontend)                                                                                                                                                                                |
| Backend (EO)    | `backend/src/api/elected-officials.ts` lines 186–225, 438                                                                                                                                                                         | calls `get_person_full` but `res.json({ data: person })` — **drops `recent_engagements`**                                                                                                                                                                                     |
| Frontend type   | `frontend/src/types/person.types.ts` lines 72–79 (`PersonFullProfile.recent_engagements`), 283–294 (`PersonEngagementWithDetails { link, engagement: {id, name_en, name_ar, engagement_type, engagement_category, location_*} }`) | typed and current                                                                                                                                                                                                                                                             |
| Frontend fetch  | `frontend/src/domains/persons/repositories/persons.repository.ts:43` `getPerson(id) → apiGet('/persons/'+id)` (edge baseUrl default); hook `domains/persons/hooks/usePersons.ts` `usePerson` (queryKey `personKeys.detail(id)`)   | working today                                                                                                                                                                                                                                                                 |
| Routed renderer | `frontend/src/pages/persons/PersonDetailPage.tsx` lines 83, 673–690 (route `/_protected/persons/$personId`)                                                                                                                       | renders `personData.recent_engagements` — the live wiring analog                                                                                                                                                                                                              |
| Dead renderer   | `frontend/src/components/dossier/sections/InteractionHistory.tsx` lines 76–160                                                                                                                                                    | maps `recent_engagements`, count badge, links to `/engagements/$engagementId`; only importer is dead `PersonDossierDetail` — **salvage candidate**                                                                                                                            |
| EO frontend     | `frontend/src/domains/elected-officials/hooks/useElectedOfficials.ts` lines 52–73 (`apiGet('/api/elected-officials/'+id, { baseUrl: 'express' })`, `electedOfficialKeys.detail(id)`)                                              | EO type has **no** `recent_engagements` field                                                                                                                                                                                                                                 |
| Writers         | **NONE** (repo-wide grep: only migrations match `person_engagements`)                                                                                                                                                             | data-seeding risk                                                                                                                                                                                                                                                             |

## host_organization_id / host_country_id Reader Map (PERENG-01)

| File                                                                      | Lines                     | Pattern                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/src/hooks/useOrganizations.ts`                                  | 71–96                     | engagement_count tally: `.from('engagement_dossiers').select('host_organization_id').in('host_organization_id', ids)` then JS tally (PostgREST has no GROUP BY). **The known latent gap: reads 0 while staging `host_organization_id` is NULL on all rows.** |
| `frontend/src/hooks/useCountries.ts`                                      | 102–120                   | identical tally for `host_country_id` (the precedent the org hook mirrors)                                                                                                                                                                                   |
| `frontend/src/domains/engagements/repositories/engagements.repository.ts` | 65                        | list param `host_country_id` only — **no `host_organization_id` filter exists anywhere**                                                                                                                                                                     |
| `frontend/src/types/engagement.types.ts`                                  | 239–240, 289–290, 319–329 | extension columns + `host_country`/`host_organization` embed shapes already typed                                                                                                                                                                            |

**Query to copy for an org-hosted engagement list** (adapt from useOrganizations.ts:79–82):

```typescript
const { data: engagementExts } = await supabase
  .from('engagement_dossiers')
  .select('host_organization_id') // widen select to the engagement row fields needed
  .in('host_organization_id', ids) // or .eq('host_organization_id', dossierId) for one org
```

## \*DossierDetail Inventory (PERENG-03)

`routeTree.gen.ts` contains **zero** references to any `*DossierDetail` or `*DossierPage`. No test files reference them. Every wrapper page in `pages/dossiers/` has zero importers.

| Component (`frontend/src/components/dossier/`) | Lines | Routed? | Importers (full chain)                             | Raw-key renders                                                                                      | Disposition hint                                                                                          |
| ---------------------------------------------- | ----- | ------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `CountryDossierDetail.tsx`                     | 257   | no      | `pages/dossiers/CountryDossierPage.tsx` → **none** | none — `useTranslation('dossier')`, namespace registered (`i18n/index.ts:13,263`)                    | delete + wrapper                                                                                          |
| `OrganizationDossierDetail.tsx`                | 295   | no      | `OrganizationDossierPage.tsx` → none               | none (same ns)                                                                                       | delete + wrapper; orphans InstitutionalProfile, OrgHierarchy                                              |
| `ForumDossierDetail.tsx`                       | 447   | no      | `ForumDossierPage.tsx` → none                      | none (same ns)                                                                                       | delete + wrapper; co-orphans DecisionLogs/DeliverablesTracker/MeetingSchedule/MemberOrganizations with WG |
| `PersonDossierDetail.tsx`                      | 240   | no      | `PersonDossierPage.tsx` → none                     | none (same ns; spot-check `sections.person.interactionHistoryEmpty` exists EN+AR `dossier.json:461`) | delete + wrapper, **but first salvage `InteractionHistory` mapping for PERENG-02**                        |
| `TopicDossierDetail.tsx`                       | 527   | no      | `TopicDossierPage.tsx` → none                      | none (same ns)                                                                                       | delete + wrapper                                                                                          |
| `WorkingGroupDossierDetail.tsx`                | 110   | no      | `WorkingGroupDossierPage.tsx` → none               | none (same ns)                                                                                       | delete + wrapper                                                                                          |

**Raw-key note:** all six use the registered `dossier` namespace, so there are no namespace-miss raw-key renders today (they render nowhere anyway). If any component is **routed instead of deleted**, the planner must run a per-key EN↔AR parity audit of its `sections.*` keys (65-01 Pitfall 7 test pattern), not just namespace registration.

### Section orphan cascade (`frontend/src/components/dossier/sections/`, 19 files)

| Status after deleting all 6 chains                                          | Sections                                                                                                                                                                                                   |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Already orphaned today (65-03 leftovers — EngagementDossierDetail deletion) | `EngagementInformation`, `FollowUpActions`, `OutcomesSummary`, `ParticipantsList`                                                                                                                          |
| Become orphaned (PersonDossierDetail)                                       | `InteractionHistory`\*, `PositionsHeld`, `OrganizationAffiliations`, `CommitteeAssignments`, `ContactPreferencesSection`, `ElectedOfficialProfile`, `ProfessionalProfile`, `StaffDirectory`, `TermHistory` |
| Become orphaned (Organization)                                              | `InstitutionalProfile`, `OrgHierarchy`                                                                                                                                                                     |
| Become orphaned (Forum + WorkingGroup, shared)                              | `DecisionLogs`, `DeliverablesTracker`, `MeetingSchedule`, `MemberOrganizations`                                                                                                                            |
| Survives independently                                                      | none of the 19 has another importer                                                                                                                                                                        |

\* `InteractionHistory` is the only existing dossier-component consumer of `recent_engagements` — re-home or port before deleting.

**Also affected:** `DossierDetailLayout.tsx` — importers are the 6 wrapper pages + the barrel `components/dossier/index.ts:41`. After deletion it is barrel-export-only; either delete it + its barrel line or record it as kept-dead (65-03 "deletion boundary" decision style).

## Pattern Assignments

### Per-type tab route swap (PERENG-01/02 routes)

**Analog:** `frontend/src/routes/_protected/dossiers/organizations/$id/engagements.tsx` (lines 11–28) — the 65-01 routed-tab pattern, identical in all 7 tabs:

```tsx
const DossierEngagementsTab = lazy(() =>
  import('@/components/dossier/tabs/DossierEngagementsTab').then((m) => ({
    default: m.DossierEngagementsTab,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/organizations/$id/engagements')({
  component: OrganizationEngagementsRoute,
})

function OrganizationEngagementsRoute(): ReactElement {
  const { id } = Route.useParams()
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DossierEngagementsTab dossierId={id} />
    </Suspense>
  )
}
```

To make a tab per-type, swap the lazy import to a type-specific component — exactly how `routes/_protected/dossiers/persons/$id/overview.tsx` lazy-loads `PersonOverviewTab` while other types load theirs. Keep `TabSkeleton type="list"` and the `Suspense` wrapper.

**Decision-header analog (for the PERENG-01 "documented generic-history-only" alternative):** `frontend/src/routes/_protected/engagements/$engagementId/positions.tsx` carries the ENGPOS-01 canonical-source decision as a route-file header comment (see 65-01-SUMMARY "decisions"). If the org tab stays generic, document the contract the same way: a `PERENG-01` decision comment in `organizations/$id/engagements.tsx` naming `host_organization_id` as out-of-scope and why.

### Person/EO engagements reader (PERENG-02)

**Data analog:** `frontend/src/pages/persons/PersonDetailPage.tsx` lines 83 + 673–690 — fetch via `usePerson(personId)` (which already returns `recent_engagements: PersonEngagementWithDetails[]`), guard with `personData.recent_engagements && length > 0`, map `eng.engagement.name_en/name_ar`.

**Render analog:** `frontend/src/components/dossier/sections/InteractionHistory.tsx` lines 76–160 — count badge (`t('sections.person.engagementsCount', { count })`), per-row engagement link. Port its mapping into a new tab component shaped like `DossierEngagementsTab` (timeline list, `dir={isRTL ? 'rtl' : 'ltr'}`, logical properties, `formatDayFirst`).

**EO wiring choice (planner must decide):**

- Option A — backend passthrough: extend `backend/src/api/elected-officials.ts` GET `/:id` (lines 179–225) to return `recent_engagements` beside `person`, and add the field to `domains/elected-officials/types/elected-official.types.ts`. Requires droplet deploy (known backlog: droplet backend is behind).
- Option B — reuse persons plane: EO ids are persons ids (`person_subtype='elected_official'`); `usePerson(id)` via the **edge** `/persons/:id` path already returns the full profile with no backend deploy. This matches the existing split where EO overview cards (`ElectedOfficialCommitteesCard`/`OfficeCard`) use `useElectedOfficial`, but avoids touching Express.

### Honest error/empty contract (all touched tabs)

**Analog:** `frontend/src/pages/dossiers/overview-cards/KeyContactsCard.tsx` lines 43–58 (Phase 66 OVRERR-01 contract — stale-while-error, `role="alert"`, danger token, shared bilingual key):

```tsx
// Error before empty (OVRERR-01): only when no cached data — stale-while-error
// retains last-good data on a background refetch failure.
if (isError && data === null) {
  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className="text-base font-semibold leading-tight text-start mb-4">
        {t('overview.contacts.title', { defaultValue: 'Key Contacts' })}
      </h3>
      <p role="alert" className="text-sm text-[var(--danger)] text-center py-8">
        {t('overview.sectionError', {
          defaultValue: 'Failed to load this section. Check your connection and try again.',
        })}
      </p>
    </div>
  )
}
```

Service side, fail the query (don't swallow): `services/dossier-overview.service.ts` `DossierOverviewAPIError` (lines 253–268) thrown by every section fetcher (e.g. lines 302–321, 371–376, 490–495). Any new section fetcher or direct query must throw on error, never `console.error` + continue. Note `DossierEngagementsTab` currently ignores `isError` — bring it up to this contract when modified.

### Deletion plan shape (PERENG-03)

**Analog:** Phase 65-03 (`65-03-SUMMARY.md`) — the exact prior instance of this work (deleted `EngagementDossierDetail` + its stack):

- Deletion boundary declared explicitly (here: 6 details + 6 wrapper pages + orphaned `sections/*` + `DossierDetailLayout` decision + barrel-line cleanup in `components/dossier/index.ts`).
- 65-03 gated deletion on a **live emptiness probe** because a data plane was involved; here the chains are pure frontend dead code, so the gate is: zero importers (verified above), zero `routeTree.gen.ts` references (verified), zero test references (verified), then `pnpm build` green.
- Dead i18n key blocks (`dossier.json` `sections.*` for deleted-only sections) removed in the same commit as their consumers — but **only** keys with no surviving consumer; `sections.person.*` survives if InteractionHistory is re-homed.
- ESLint filename-case: any salvaged component re-homed under `components/**` must stay PascalCase (CI lints the whole repo at `--max-warnings 0`).

### Tests

**Analogs:**

- `frontend/src/components/positions/__tests__/EngagementPositionsTab.test.tsx` — nav-entry pin + EN/AR key parity test shape (65-01).
- `frontend/src/pages/dossiers/overview-cards/__tests__/TypeCardErrorStates.test.tsx` — per-type card error-flip tests (66).
- `frontend/src/pages/dossiers/overview-cards/__tests__/SharedRecentActivityCard.test.tsx` — hoisted mock-state pattern for service-backed components.

## Shared Patterns

### Query keys & caching

- Tab queries: `['dossier-tab', '<section>', dossierId]` + `STALE_TIME.NORMAL` from `@/lib/query-tiers` (DossierEngagementsTab:40–46).
- Person profile: `personKeys.detail(id)` (`domains/persons/hooks/usePersons.ts:71`) — reusing `usePerson` shares cache with PersonDetailPage; invalidations already wired throughout the domain hooks.
- EO profile: `electedOfficialKeys.detail(id)` (`domains/elected-officials/hooks/useElectedOfficials.ts:68`).

### i18n

- Namespaces registered statically in `frontend/src/i18n/index.ts` (no http-backend; unregistered namespaces silently fall back to English). Relevant registered namespaces: `dossier` (line 263), `dossier-shell` (352), `dossier-overview` (341).
- Colon-form for cross-namespace keys (`dossier-overview:relationshipType.*` as in DossierEngagementsTab:115); dot-form leaks raw keys.
- Bilingual key pairs land EN+AR in one commit, pinned by a parity unit test (65-01 pattern).

### RTL / layout

- `dir={isRTL ? 'rtl' : 'ltr'}` on the tab container, logical properties only (`ps-6`, `start-0.5`, `border-s-2`, `text-start`) — DossierEngagementsTab lines 75–121 is the canonical timeline-list example to copy.

## No Analog Found

| Need                           | Role          | Reason                                                                                                                         | Fallback                                                                                                                                                                          |
| ------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `person_engagements` writer UI | form/mutation | No writer exists anywhere in app code — table is populated only by SQL/seed                                                    | Out of scope for the contract reqs; treat row presence as an environment/seeding action (UAT will need seeded rows). Flag in plan, don't build a writer unless CONTEXT demands it |
| Engagement-list-by-host reader | service/hook  | Only a count tally exists (`useOrganizations.ts:79–88`); no list query filters `engagement_dossiers` by `host_organization_id` | Compose: tally's query shape + `fetchRelatedDossiers` section-fetcher structure + 66 throw contract                                                                               |

## Risks the Planner Must Resolve

1. **ID-space mismatch on engagement links (PERENG-02):** `person_engagements.engagement_id` → legacy `engagements.id`, but the routed workspace `/engagements/$engagementId` and `getDossierDetailPath(id, 'engagement')` operate on `dossiers.id` (`engagement_dossiers` plane, ENGPOS-01). `InteractionHistory`'s `/engagements/$engagementId` links would 404/misroute unless ids are mapped or rows render unlinked (DossierEngagementsTab's unlinked event-row pattern, lines 105–107, is the safe fallback).
2. **Staging data:** `host_organization_id` is NULL on all `engagement_dossiers` rows (3 total) and `person_engagements` likely has 0 rows (no writers). PERENG-01/02 verification needs seeded rows; the "documented generic-history-only" escape hatch for PERENG-01 exists precisely because of this.
3. **EO backend deploy dependency:** Option A (Express passthrough) inherits the known droplet-behind-main deploy risk; Option B (persons edge path) avoids it.
4. **DossierAnalyticsCard precedent:** per 66-PATTERNS, `frontend/src/components/analytics/DossierAnalyticsCard.tsx` lines 43–68 is the original isError-handling card if another error-render reference is needed.

## Metadata

**Analog search scope:** `frontend/src/{routes,components/dossier,pages/dossiers,pages/persons,hooks,domains,services,types,i18n}`, `backend/src/api`, `supabase/{functions,migrations}`, `.planning/phases/{65,66}-*`
**Files scanned:** ~60 (greps) / 18 read in part or full
**Pattern extraction date:** 2026-06-13
