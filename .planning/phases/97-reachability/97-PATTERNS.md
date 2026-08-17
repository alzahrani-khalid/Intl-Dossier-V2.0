# Phase 97: Reachability - Pattern Map

**Mapped:** 2026-08-17
**Files analyzed:** 30 (24 modify / 3 new source + 6 new test-and-instrument / 3 delete)
**Analogs found:** 27 / 30 (3 need no analog — see §No Analog Found)
**Tree read at:** HEAD `9c32c4db1`, this session, every anchor re-read on disk

> **Every excerpt below was read from the file this session.** Line numbers are HEAD-pinned;
> the tree moves, so an executor re-derives an anchor before editing (P95 HEAD-MOVED law).
>
> **The live-nav rule governs this whole document.** Live sidebar =
> `components/layout/navigation-config.ts` → `layout/Sidebar.tsx`, mounted at `AppShell.tsx:196`
> (desktop) and `:252` (mobile drawer). `components/modern-nav/` is mounted ONLY by
> `routes/modern-nav-standalone.tsx`. **No pattern in this document is satisfied by an edit to
> `components/modern-nav/`.**

---

## Corrections to RESEARCH (derived this session — read these before planning waves)

Two RESEARCH claims are refined by direct reads. Both SHRINK the work; neither contradicts a
decision.

### C-1 — NAV-03 heterogeneity is a mirage: **all seven pages route through `ListPageShell`**

RESEARCH §NAV-03(b) says four pages use `ListPageShell`, engagements "delegates", and
persons/topics are "colocated page components (shell-less)". **Derived count of `<ListPageShell`
render sites in `frontend/src`: exactly 8 — 7 product pages + 1 test.**

```
frontend/src/routes/_protected/dossiers/countries/index.tsx
frontend/src/routes/_protected/dossiers/organizations/index.tsx
frontend/src/routes/_protected/dossiers/forums/index.tsx
frontend/src/routes/_protected/dossiers/working_groups/index.tsx
frontend/src/routes/_protected/dossiers/topics/-TopicsListPage.tsx        (:214)
frontend/src/routes/_protected/dossiers/persons/-PersonsListPage.tsx      (:209)
frontend/src/pages/engagements/EngagementsListPage.tsx                    (:285)
frontend/src/components/list-page/__tests__/ListPageShell.test.tsx        (test)
```

Command (re-run at execution; `command grep`, never bare `grep`):

```bash
command grep -rln '<ListPageShell' /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src --include='*.tsx'
```

**The 7 render sites ARE the 7 pages that need a create affordance** — an exact set equality, not
an approximation. The eighth page (elected-officials) is the 1-of-8 that already has one and is
the ONLY one not on `ListPageShell` (it uses `PageHeader` — `index.tsx:9` records that as a
deliberate planner decision: "no ListPageShell migration").

Consequence for the planner: RESEARCH Open Question 3 resolves to **one shared
`actions?: ReactNode` prop on `ListPageShell`, rendered inside its existing
`<header className="page-head">`, plus 7 call-site edits.** No per-page shell surgery, no
toolbar fallback, no second recipe. Instrument control for the zero-claim ("no other consumer
exists"): the same sweep must find the test file — if it returns 7 it silently dropped one.

### C-2 — `persons` and `topics` list pages are NOT shell-less

`persons/index.tsx:125-137` renders `<PersonsListPage …/>` (`-PersonsListPage.tsx:209` →
`ListPageShell`); `topics/index.tsx:12` sets `component: TopicsListPage`
(`-TopicsListPage.tsx:214` → `ListPageShell`). Both already receive an `onCreate` prop wired
only into `ListEmptyState`. Their edit is identical to the four direct consumers, one hop
further in.

---

## File Classification

| New/Modified File                                                        | Op                    | Role                     | Data Flow        | Closest Analog                                                                       | Match        |
| ------------------------------------------------------------------------ | --------------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------------------ | ------------ |
| **NAV-01**                                                               |                       |                          |                  |                                                                                      |              |
| `frontend/src/components/layout/navigation-config.ts`                    | MOD                   | config                   | static-data      | itself `:150-155` (`dossier-topics` item)                                            | exact (self) |
| `frontend/src/pages/dossiers/DossierListPage.tsx`                        | MOD                   | page component           | CRUD-read        | `pages/dossiers/CreateDossierHub.tsx:41-64` (widening) + its own `:75-83`/`:557-601` | exact        |
| `frontend/src/services/dossier-api.ts`                                   | MOD                   | service (data-access)    | CRUD-read        | itself `:686-745` (`getDossierCountsByType`)                                         | exact (self) |
| `frontend/src/routes/_protected/compare.tsx`                             | MOD                   | route + search validator | request-response | itself `:15-51`; whitelist recipe `elected-officials/index.tsx:81-93`                | exact        |
| `frontend/src/components/entity-comparison/EntityComparisonSelector.tsx` | MOD                   | component                | request-response | itself `:64-72` + `:249-256`                                                         | exact (self) |
| `frontend/src/hooks/useEntityComparison.ts`                              | MOD                   | hook                     | CRUD-read        | its own per-type fetch arm `:567` + field registry `:95`                             | exact (self) |
| `frontend/src/i18n/{en,ar}/entity-comparison.json`                       | MOD                   | i18n data                | static-data      | `en/entity-comparison.json:22-30`                                                    | exact (self) |
| **NAV-02**                                                               |                       |                          |                  |                                                                                      |              |
| `frontend/src/lib/settings-route.ts`                                     | **NEW**               | utility (pure predicate) | transform        | `frontend/src/lib/dossier-routes.ts`                                                 | exact        |
| `frontend/src/lib/__tests__/settings-route.test.ts`                      | **NEW**               | unit test                | transform        | `frontend/src/lib/__tests__/dossier-routes.test.ts`                                  | exact        |
| `frontend/src/components/layout/AppShell.tsx`                            | MOD                   | layout shell             | request-response | itself `:120-125`, `:186-198`, `:238-259`                                            | exact (self) |
| `frontend/src/routes/_protected/settings.tsx`                            | MOD                   | route layout             | request-response | itself `:9-31` + `SettingsLayout.tsx:53-67` grid                                     | exact        |
| `frontend/src/components/settings/SettingsLayout.tsx`                    | MOD                   | layout component         | request-response | itself `:53-67` (grid) / `:69-92` (index-only card-head)                             | exact (self) |
| **NAV-03**                                                               |                       |                          |                  |                                                                                      |              |
| `frontend/src/components/workspace/WorkspaceTabNav.tsx`                  | MOD                   | nav component            | static-data      | itself `:26-35`                                                                      | exact (self) |
| `frontend/src/i18n/{en,ar}/workspace.json`                               | MOD                   | i18n data                | static-data      | `en/workspace.json:2-12`                                                             | exact (self) |
| `frontend/src/components/list-page/ListPageShell.tsx`                    | MOD                   | layout component         | request-response | `components/layout/PageHeader.tsx:11-31` (`actions` slot)                            | exact        |
| `…/dossiers/countries/index.tsx`                                         | MOD                   | route page               | CRUD-read        | `…/dossiers/elected-officials/index.tsx:196-209`                                     | exact        |
| `…/dossiers/organizations/index.tsx`                                     | MOD                   | route page               | CRUD-read        | same                                                                                 | exact        |
| `…/dossiers/forums/index.tsx`                                            | MOD                   | route page               | CRUD-read        | same                                                                                 | exact        |
| `…/dossiers/working_groups/index.tsx`                                    | MOD                   | route page               | CRUD-read        | same                                                                                 | exact        |
| `…/dossiers/topics/-TopicsListPage.tsx`                                  | MOD                   | page component           | CRUD-read        | same (one hop in)                                                                    | exact        |
| `…/dossiers/persons/-PersonsListPage.tsx`                                | MOD                   | page component           | CRUD-read        | same (one hop in)                                                                    | exact        |
| `frontend/src/pages/engagements/EngagementsListPage.tsx`                 | MOD                   | page component           | CRUD-read        | same (one hop in)                                                                    | exact        |
| `frontend/src/components/list-page/__tests__/ListPageShell.test.tsx`     | MOD                   | unit test                | transform        | itself `:56-…` (`renders toolbar when provided`)                                     | exact (self) |
| **NAV-04**                                                               |                       |                          |                  |                                                                                      |              |
| `frontend/src/components/layout/navigation-config.ts` (admin group)      | MOD                   | config                   | static-data      | itself `:175-186` (`admin-ai-settings` / `admin-system`)                             | exact (self) |
| `frontend/src/routes/_protected/admin/approvals.tsx`                     | **DEL** (conditional) | route                    | —                | — (deletion; see §No Analog)                                                         | n/a          |
| `frontend/src/routes/_protected/admin/preview-layouts.tsx`               | **DEL** (conditional) | route                    | —                | —                                                                                    | n/a          |
| `frontend/src/services/auth.ts`                                          | **DEL**               | service (dead)           | —                | —                                                                                    | n/a          |
| `frontend/src/routeTree.gen.ts`                                          | REGEN                 | generated                | —                | never hand-edited; commit same-commit                                                | n/a          |
| `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx`          | MOD (branch A)        | component                | request-response | `layout/Sidebar.tsx:51-55` (the real admin check)                                    | exact        |
| `97-NAV04-DECISIONS.md` (name = planner)                                 | **NEW**               | decision record          | document         | `.planning/phases/95-routes-that-don-t-render/95-DEAD-04-DECISION.md`                | exact        |
| **Oracles & instruments**                                                |                       |                          |                  |                                                                                      |              |
| `tests/e2e/97-elected-officials-reachable.spec.ts`                       | **NEW**               | e2e oracle               | click-through    | `tests/e2e/95-monitoring-mounts.spec.ts`                                             | exact        |
| `tests/e2e/97-settings-nav.spec.ts`                                      | **NEW**               | e2e oracle               | click-through    | same                                                                                 | exact        |
| `tests/e2e/97-digests-tab.spec.ts`                                       | **NEW**               | e2e oracle               | click-through    | same                                                                                 | exact        |
| `tests/e2e/97-list-create-affordances.spec.ts`                           | **NEW**               | e2e oracle               | click-through    | same                                                                                 | exact        |
| `tests/e2e/97-nav04-rows.spec.ts`                                        | **NEW**               | e2e oracle               | click-through    | same                                                                                 | exact        |
| `scripts/inbound-link-classify.mjs` (name = planner)                     | **NEW**               | instrument               | batch/transform  | `scripts/trigsweep-classify.mjs`                                                     | exact        |

---

## Pattern Assignments

### NAV-01(a) — `navigation-config.ts` sidebar EO row (config, static-data)

**Analog:** itself — every sibling item in the `dossiers` group.

**Item shape** (`navigation-config.ts:150-161`, dossiers group, verbatim):

```typescript
        {
          id: 'dossier-topics',
          label: 'navigation.topics',
          path: '/dossiers/topics',
          icon: Tag,
        },
        {
          id: 'dossier-working-groups',
          label: 'navigation.workingGroups',
          path: '/dossiers/working_groups',
          icon: UsersRound,
        },
```

**Import block to extend** (`:6-28`) — the icon must be added to the SAME named import; there is
no second import site:

```typescript
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  // … 17 more …
  Database,
} from 'lucide-react'
```

`Crown` is NOT currently imported here (it is imported by `elected-officials/index.tsx:17`).
Add it to this block. Per UI-SPEC the EO row goes after `dossier-persons` (`:138-143`),
before `dossier-forums` (`:144-149`).

**Type contract** (`:30-37`) — `badgeCount` and `secondary` are optional; a nav item is 4 keys:

```typescript
export interface NavigationItem {
  id: string
  label: string
  path: string
  icon: LucideIcon
  badgeCount?: number
  secondary?: boolean
}
```

**Rendered by** `Sidebar.tsx:128-157` (`SidebarNavItem`) — unchanged, no per-item styling exists:

```tsx
function SidebarNavItem({ item, pathname }: SidebarNavItemProps): ReactElement {
  const { t } = useTranslation()
  const Icon = item.icon
  const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
  return (
    <li>
      <Link
        to={item.path}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'sb-item relative flex items-center gap-2 h-10 min-h-11 min-w-11 px-2.5 rounded-[var(--radius-sm)]',
          'font-body text-[13px] font-normal leading-[1.4] text-[var(--sidebar-ink)]/[.78]',
          /* … hover / focus … */
          isActive && 'active … before:absolute before:start-0 … before:bg-[var(--accent)] …',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate text-start">{t(item.label)}</span>
```

**Note the active-state trap for the planner's oracle:** `isActive` uses
`pathname.startsWith(item.path + '/')`. `/dossiers/persons` and `/dossiers/elected-officials`
do not prefix-collide, so no false double-active. Do NOT add a path that prefixes another.

**i18n:** `navigation.electedOfficials` already exists in BOTH `i18n/{en,ar}/common.json:147`.
Zero new keys for this row (RESEARCH-verified; re-check with `command grep` at execution).

---

### NAV-01(b) — `DossierListPage.tsx` hub type card (page component, CRUD-read)

**Analog for the type mechanism:** `pages/dossiers/CreateDossierHub.tsx:37-64` — the in-repo
local-widening precedent, comment and all:

```typescript
/**
 * Hub-local card type. Includes `elected_official` which is not a canonical
 * DossierType (it is a PersonSubtype) but does have its own wizard route.
 */
type HubCardType =
  | 'country'
  | 'organization'
  | 'forum'
  | 'engagement'
  | 'topic'
  | 'working_group'
  | 'person'
  | 'elected_official'

const DOSSIER_TYPES: HubCardType[] = [
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person',
  'elected_official',
]
```

Its file-header comment (`:14-17`) is the law to restate at each new widening site:

```
 * Hub card type union is local: the canonical `DossierType` (from
 * `@/lib/dossier-type-guards`) excludes `elected_official` (it is a PersonSubtype).
 * The hub surfaces elected_official as its own creation entry per D-02, so we
 * widen locally rather than touching the canonical domain type.
```

**The site to widen** (`DossierListPage.tsx:75-83`) — currently canonical-typed, 7 entries:

```typescript
const DOSSIER_TYPES: DossierType[] = [
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person',
]
```

**Three consumers of that array move together** — a widening that names one is the P-drift class:

1. `:455` stats aggregation loop (`for (const type of DOSSIER_TYPES) { const typeCount = counts[type] … }`)
2. `:557-576` the counts-error branch
3. `:581-601` the card grid

**Count-honesty pattern — copy verbatim** (`:545-577`), this is the shipped "unknown ≠ zero"
treatment the UI-SPEC binds the EO card to:

```tsx
        ) : countsError ? (
          /* TRUST-01: a failed count is UNKNOWN, not zero. Every figure reads an em dash labelled
             `common:errors.countUnavailable`, and the owning region carries variant B of the
             shared error state. The stats cards are not rendered at all — a card that can only
             show a number has no honest render for a request that failed. */
          <div className="space-y-4">
            <QueryErrorState variant="inline" onRetry={() => void refetchCounts()} isRetrying={countsFetching} />
            <div className="grid …">
              {DOSSIER_TYPES.map((type) => (
                <div key={type} className={cn('flex flex-col items-center justify-center gap-1 p-3',
                    'rounded-[var(--radius)] border border-line bg-surface')}>
                  <span className="text-center text-[10px] font-medium text-ink-mute sm:text-xs">
                    {t(`type.${type}`)}
                  </span>
                  <span
                    data-testid="dossier-count-unavailable"
                    aria-label={t('common:errors.countUnavailable')}
                    className="text-sm font-bold text-ink-mute sm:text-lg"
                  >
                    —
                  </span>
                </div>
              ))}
            </div>
          </div>
```

**Card render + click** (`:579-601`), the peer chrome the EO card inherits unchanged:

```tsx
{
  DOSSIER_TYPES.map((type) => {
    const stats = typeStatsMap?.[type] ?? {
      count: 0,
      percentage: 0,
      activeCount: 0,
      inactiveCount: 0,
    }
    return (
      <DossierTypeStatsCard
        key={type}
        type={type}
        totalCount={stats.count}
        activeCount={stats.activeCount}
        inactiveCount={stats.inactiveCount}
        percentage={stats.percentage}
        isSelected={filters.type === type}
        onClick={() => handleTypeCardClick(type)}
      />
    )
  })
}
```

**The forbidden shape is already latent here** (`:582-587`): the `?? { count: 0, … }` fallback
means an EO type with no bucket in `typeStatsMap` renders **`0`**, not `—`. UI-SPEC §NAV-01(b)
forbids exactly that. Either the counts source gains a real EO bucket (see NAV-01(c)) or the EO
card takes the `dossier-count-unavailable` treatment — **the default fallback must not be
inherited silently.**

**Click semantics** (`:431-441`) — the sibling behaviour is an in-place filter toggle:

```typescript
const handleTypeCardClick = useCallback(
  (type: DossierType) => {
    if (filters.type === type) {
      handleFilterChange('type', undefined)
    } else {
      handleFilterChange('type', type)
    }
  },
  [filters.type, handleFilterChange],
)
```

UI-SPEC allows this for EO **only if the hub list query genuinely returns EO rows under that
filter** (`dossiers.type` has no `elected_official` value — it would filter to zero). Default per
UI-SPEC: navigate to `/dossiers/elected-officials` instead. That is a divergence from the sibling
callback and needs its own line in the plan.

---

### NAV-01(c) — `services/dossier-api.ts` EO count bucket (service, CRUD-read)

**Analog:** itself, `getDossierCountsByType` (`:686-745`). The whole function, current shape:

```typescript
export async function getDossierCountsByType(): Promise<Record<DossierType, DossierTypeCount>> {
  const { data, error } = await supabase
    .from('dossiers')
    .select('type, status')
    .not('status', 'eq', 'deleted') // Exclude deleted dossiers from counts

  if (error) {
    throw new DossierAPIError(
      error.message || 'Failed to fetch dossier counts',
      500,
      'COUNTS_FETCH_FAILED',
      { code: error.code, message: error.message, details: error.details },
    )
  }

  const types: DossierType[] = ['country','organization','forum','engagement','topic','working_group','person']
  const counts = {} as Record<DossierType, DossierTypeCount>
  types.forEach((type) => { counts[type] = { type, total: 0, active: 0, inactive: 0, archived: 0 } })

  data?.forEach((row) => {
    const type = row.type as DossierType
    const status = row.status as DossierStatus
    if (counts[type]) { counts[type].total++ ; if (status === 'active') { counts[type].active++ } … })
```

**Error-handling pattern to preserve** — the throw is load-bearing. `useDossier.ts:679-686`
records why:

```typescript
    // TRUST-01 / D-01: the rejection propagates. `getDossierCountsByType` already throws a
    // `DossierAPIError` when PostgREST reports one, and every consumer reads this through
    // TanStack Query, whose `isError` only fires on a REJECTED promise. Catching here and
    // returning all-zero counts made a failed request indistinguishable from an empty database.
    queryFn: async () => {
      const counts = await getDossierCountsByType()
      return counts as Record<TypeGuardDossierType, DossierTypeCount>
    },
    staleTime: 5 * 60 * 1000,
```

**The EO bucket cannot come from this query.** `dossiers` has no `elected_official` type value
(CHECK = 7, migration `20260202000001`). An EO count is `persons.person_subtype =
'elected_official'` — a SECOND query against a different table. Two honest shapes for the
planner, both of which keep the throw-on-error contract:

- add a second `supabase.from('persons').select('person_subtype, …')` arm inside this function
  and widen its return key set locally (mirror `HubCardType`, do not widen `DossierType`); **or**
- do not add a bucket, and render the EO card with `dossier-count-unavailable`.

A silently-defaulted `0` is neither.

---

### NAV-01(d) — `/compare` widening (route validator + selector)

**Analog for the whitelist validator:** `routes/_protected/compare.tsx:14-51` (itself):

```typescript
// Valid dossier types for validation
const VALID_DOSSIER_TYPES: DossierType[] = [
  'country','organization','person','engagement','forum','working_group','topic',
]

export const Route = createFileRoute('/_protected/compare')({
  validateSearch: (search: Record<string, unknown>): CompareSearchParams => {
    const type = search.type as string | undefined
    …
    return {
      type: VALID_DOSSIER_TYPES.includes(type as DossierType) ? (type as DossierType) : undefined,
      …
    }
  },
```

**The whitelist shape must survive the widening** (RESEARCH §Security V5). The tighter in-repo
recipe for validated search params — `elected-officials/index.tsx:81-93` — is the model:
membership test → value, else `undefined`, never a cast-through.

**Selector option list** (`EntityComparisonSelector.tsx:61-72`) — 7 entries, icon inline:

```tsx
/**
 * Entity type options with icons
 */
const ENTITY_TYPE_OPTIONS: { value: DossierType; icon: React.ReactNode }[] = [
  { value: 'country', icon: <Globe className="h-4 w-4" /> },
  { value: 'organization', icon: <Building2 className="h-4 w-4" /> },
  { value: 'person', icon: <User className="h-4 w-4" /> },
  { value: 'engagement', icon: <Calendar className="h-4 w-4" /> },
  { value: 'forum', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'working_group', icon: <Users className="h-4 w-4" /> },
  { value: 'topic', icon: <Tag className="h-4 w-4" /> },
]
```

**Second consumer in the same file** (`:74-80`) — widen it in the same edit or the EO row gets
the `Tag` fallback icon:

```tsx
function getEntityTypeIcon(type: DossierType): React.ReactNode {
  const option = ENTITY_TYPE_OPTIONS.find((o) => o.value === type)
  return option?.icon ?? <Tag className="h-4 w-4" />
}
```

**SelectItem recipe** (`:248-257`) — unchanged, the new option renders through it:

```tsx
<SelectContent>
  {ENTITY_TYPE_OPTIONS.map((option) => (
    <SelectItem key={option.value} value={option.value}>
      <div className="flex items-center gap-2">
        {option.icon}
        <span>{t(`selector.entityTypes.${option.value}`)}</span>
      </div>
    </SelectItem>
  ))}
</SelectContent>
```

**Props typing is the third widening site** (`:48-52`): `selectedType: DossierType | null` and
`onTypeChange: (type: DossierType | null) => void`. A local widened alias must be threaded
through the props, `getEntityTypeIcon`, and `useEntityComparison`'s fetch arm together.

**i18n key to ADD** — `en/entity-comparison.json:22-30` is the block, plural Title Case as
shipped:

```json
    "entityTypes": {
      "country": "Countries",
      "organization": "Organizations",
      "person": "People",
      "engagement": "Engagements",
      "forum": "Forums",
      "working_group": "Working Groups",
      "topic": "Topics"
    }
```

Add `"elected_official": "Elected Officials"` here and its Arabic twin in
`ar/entity-comparison.json`, SAME commit (D-12).

---

### NAV-02(a) — `frontend/src/lib/settings-route.ts` (NEW — utility, pure predicate)

**Analog:** `frontend/src/lib/dossier-routes.ts` — same directory, same kebab-case ESLint rule,
same shape (named exports, JSDoc, explicit return types, no React, no imports).

**Module pattern** (`dossier-routes.ts:1-6, 68-80`):

```typescript
/**
 * Dossier Route Utilities
 *
 * Centralized helpers for generating type-specific dossier routes.
 * All dossier navigation should use these utilities to ensure consistency.
 */

/**
 * Type guard to check if a type string is a valid dossier type.
 *
 * @param type - The type string to validate
 * @returns True if the type is a known dossier type
 */
export function isValidDossierType(type: string | undefined | null): boolean {
  if (!type) {
    return false
  }
  const normalizedType = type.toLowerCase().replace(/\s+/g, '_')
  return normalizedType in DOSSIER_TYPE_TO_ROUTE
}
```

House rules this file must obey (`frontend/CLAUDE.md` + ESLint): no semicolons, single quotes,
explicit return type on every function, kebab-case filename, named exports.

**Predicate semantics** — RESEARCH Pattern 2, and it closes a latent hole the current
`startsWith('/settings')` leaves open (`/settingsFoo` matches today):

```typescript
export function isSettingsPath(pathname: string): boolean {
  return pathname === '/settings' || pathname.startsWith('/settings/')
}
```

**Unit-test analog:** `frontend/src/lib/__tests__/dossier-routes.test.ts:10-32` — `vitest`,
relative `../` import, `it.each` for the table:

```typescript
import { describe, it, expect } from 'vitest'
import { getDossierDocsPath } from '../dossier-routes'

describe('getDossierDocsPath', () => {
  it('engagement context → engagement workspace docs tab, never /dossiers/engagements/$id/docs', () => {
    expect(getDossierDocsPath('e-1', 'engagement')).toBe('/engagements/e-1/docs')
  })

  it.each([
    ['country', '/dossiers/countries/d-1/docs'],
    …
  ])('%s → mounted /dossiers/{segment}/$id/docs tab', (type, expected) => {
    expect(getDossierDocsPath('d-1', type)).toBe(expected)
  })
})
```

The predicate's test must include the boundary case (`/settingsFoo` → false) and the deepest
child (`/settings/calendar/callback` → true), or the drill has no red direction.

### NAV-02(b) — `AppShell.tsx` consumer #1 (layout shell)

**Analog:** itself. Three anchors move as ONE unit.

**The site** (`:120-125`) — note the comment makes a claim that is FALSE for children; the fix
must correct the comment too, or the next reader re-learns the bug:

```typescript
const pathname = useRouterState({ select: (s) => s.location.pathname })
// F18 (D-85-03): on /settings the SettingsLayout renders its own 240px nav
// column, so the global Sidebar is suppressed to leave a single nav column.
// Both Sidebar mounts (desktop aside + mobile drawer) gate off this flag, and
// the empty desktop rail collapses to 0px so content occupies the freed space.
const isSettingsRoute = pathname.startsWith('/settings')
```

**Consumer 1 — desktop aside** (`:183-198`):

```tsx
{
  /* Desktop sidebar column — hidden below lg breakpoint; drawer replaces it.
          Suppressed entirely on /settings (F18) so the settings sub-nav is the
          single nav column. */
}
{
  !isSettingsRoute && (
    <aside
      className={cn(
        'sidebar appshell-aside',
        'hidden lg:block',
        'lg:col-start-1 lg:row-span-full',
        'border-e border-[var(--line)]',
        'bg-[var(--sidebar-bg)]',
      )}
    >
      <Sidebar />
    </aside>
  )
}
```

**Consumer 2 — mobile drawer** (`:232-259`), same flag:

```tsx
{
  !isSettingsRoute && (
    <Drawer state={overlayState}>
      … <Sidebar /> …
    </Drawer>
  )
}
```

The edit is one line (`= isSettingsPath(pathname)`) plus the import plus the comment repair.
Both mounts follow automatically — do not touch them.

### NAV-02(c) — `routes/_protected/settings.tsx` consumer #2 (route layout)

**Analog:** itself + `SettingsLayout.tsx`. Current file, in full (`:1-31`):

```tsx
import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { useDirection } from '@/hooks/useDirection'

export const Route = createFileRoute('/_protected/settings')({
  component: SettingsLayout,
})

function SettingsLayout() {
  const { direction } = useDirection()
  // Check if we're on an exact /settings path or a child route
  const matches = useMatches()
  const isExactSettingsRoute =
    matches.length > 0 && matches[matches.length - 1]!.pathname === '/settings'

  // If exact /settings route, show SettingsPage
  // Otherwise, render Outlet for child routes like /settings/webhooks
  if (isExactSettingsRoute) {
    return (
      <div dir={direction}>
        <SettingsPage />
      </div>
    )
  }

  return (
    <div dir={direction}>
      <Outlet />
    </div>
  )
}
```

Two notes the planner needs. (1) The local component here is ALSO named `SettingsLayout`,
colliding by name with `components/settings/SettingsLayout.tsx` — renaming the route component
avoids a confusing import. (2) It has no explicit return type; the repo's ESLint rule requires
one on new/edited functions (`React.JSX.Element`, as `components/settings/SettingsLayout.tsx:49`
does).

**Grid + nav geometry to REUSE, not rebuild** (`components/settings/SettingsLayout.tsx:53-67`):

```tsx
    <section
      role="region"
      aria-label={t('pageTitle')}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-loading={isLoading ? 'true' : 'false'}
      className="page settings-layout"
      style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--gap)' }}
    >
      <h1 className="sr-only">{t('pageTitle')}</h1>
      <SettingsNavigation activeSection={activeSection} onChange={onSectionChange} />
```

**The index-only chrome that must NOT travel to children** (`:69-92`) — a child wrapped in the
full layout renders another section's title over unrelated content:

```tsx
      <div className="card">
        <div className="card-head" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
          <div>
            <div className="card-title">
              {t(`${navLabelKey(activeSection)}.title`, { defaultValue: t(`nav.${navLabelKey(activeSection)}`) })}
            </div>
            <div className="card-sub">{t(`${navLabelKey(activeSection)}.description`, { defaultValue: '' })}</div>
          </div>
```

**Active-state + return-path source** (`SettingsNavigation.tsx:89-122`) — the DOM contract
UI-SPEC checks (`aria-current`, `data-testid`, the RTL-flipped chevron) all live here:

```tsx
    <nav className="card settings-nav-card" aria-label={t('pageTitle')}>
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/' })}
        className="mb-2 justify-start" data-testid="settings-back-to-app">
        <ChevronRight className={cn('size-4', isRTL ? 'ms-2' : 'me-2', !isRTL && 'rotate-180')} />
        <span className="text-start">{t('backToApp')}</span>
      </Button>

      {NAV_GROUPS.map((group) => (
        <div key={group.labelKey} className="settings-nav-group">
          <div className="settings-nav-group-header px-2.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--ink-faint)]">
            {t(group.labelKey)}
          </div>
          {group.sections.map((s) => (
            <button
              key={s.id} type="button"
              data-testid={`settings-nav-${s.id}`}
              className={cn('settings-nav', activeSection === s.id && 'active')}
              style={{ minHeight: 44 }}
              aria-current={activeSection === s.id ? 'page' : undefined}
              onClick={() => onChange(s.id)}
            >
```

**Two structural facts that shape the NAV-02 mechanism.** (a) `SettingsNavigation` is
**callback-driven, not Link-driven** — `onChange(s.id)` sets in-page state; there is no route per
section. On a child route there is no state to set, so the UI-SPEC's "clicking a section from a
child lands on `/settings` with that section rendered" requires a real navigation (the
`?section=` search param is the recommended mechanism). (b) `aria-current` is derived from
`activeSection` — mounting the column on a child with any `activeSection` value produces exactly
one `aria-current="page"`, and UI-SPEC requires **ZERO** there. Both are prop/API changes to
`SettingsNavigation`, not restyles.

---

### NAV-03(a) — `WorkspaceTabNav.tsx` digests tab (nav component, static-data)

**Analog:** itself. The array (`:20-35`) and its Link recipe are the whole pattern:

```typescript
interface WorkspaceTab {
  key: string
  labelKey: string
  path: string
}

const WORKSPACE_TABS: WorkspaceTab[] = [
  { key: 'overview', labelKey: 'tabs.overview', path: 'overview' },
  { key: 'context', labelKey: 'tabs.context', path: 'context' },
  { key: 'positions', labelKey: 'tabs.positions', path: 'positions' },
  { key: 'signals', labelKey: 'tabs.signals', path: 'signals' },
  { key: 'tasks', labelKey: 'tabs.tasks', path: 'tasks' },
  { key: 'calendar', labelKey: 'tabs.calendar', path: 'calendar' },
  { key: 'docs', labelKey: 'tabs.docs', path: 'docs' },
  { key: 'audit', labelKey: 'tabs.audit', path: 'audit' },
]
```

**Render recipe** (`:74-100`) — unchanged; the new tab is one array entry, zero JSX:

```tsx
        {WORKSPACE_TABS.map((tab) => {
          const isActive = matchRoute({
            to: '/engagements/$engagementId/' + tab.path,
            params: { engagementId },
            fuzzy: true,
          })
          return (
            <Link
              key={tab.key}
              ref={isActive ? activeTabRef : undefined}
              to={`/engagements/$engagementId/${tab.path}` as string}
              params={{ engagementId }}
              role="tab"
              aria-selected={Boolean(isActive)}
              className={cn(
                'min-h-11 min-w-11 px-3 py-2 text-sm font-medium whitespace-nowrap snap-center rounded-t-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive ? 'border-b-2 border-primary text-[var(--accent-ink)] bg-background'
                         : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(tab.labelKey)}
            </Link>
```

**i18n block to extend** (`i18n/en/workspace.json:2-12`), plus the Arabic twin same-commit:

```json
  "tabs": {
    "overview": "Overview",
    "context": "Context",
    "positions": "Positions",
    "signals": "Signals",
    "tasks": "Tasks",
    "calendar": "Calendar",
    "docs": "Docs",
    "audit": "Audit",
    "ariaLabel": "Engagement workspace tabs"
  },
```

`tabs.digests` is absent from both locales — the ONE new key here. Namespace is addressed as
`useTranslation('workspace')` at `:50`, so keys stay dot-form INSIDE the component; the colon
rule applies to callers that pass a fully-qualified key.

---

### NAV-03(b) — the create affordance (7 pages, ONE shared prop)

**Analog — the 1-of-8 that already has it**, `routes/_protected/dossiers/elected-officials/index.tsx:196-209`:

```tsx
  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Crown className="h-6 w-6" />}
        title={t('list.title')}
        actions={
          <Button asChild className="min-h-11 min-w-11 w-full sm:w-auto">
            <Link to="/dossiers/elected-officials/create">
              <Plus className="h-4 w-4 me-2" />
              {t('list.add')}
            </Link>
          </Button>
        }
      />
```

Imports it needs (`:15-19`):

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { Crown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
```

**Slot analog for the shell change** — `components/layout/PageHeader.tsx:3-31` is the entire
`actions` slot pattern (prop type, optional guard, wrapper div):

```tsx
interface PageHeaderProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps): React.JSX.Element {
  return (
    <header className={cn('page-head', className)}>
      <div className="flex min-w-0 items-start gap-3">…</div>
      {actions != null && <div className="dash-hero-actions">{actions}</div>}
    </header>
  )
}
```

**The shell to extend** — `components/list-page/ListPageShell.tsx:4-12` (props) and `:48-55`
(the header that already exists and has no actions region):

```tsx
export interface ListPageShellProps {
  title: string
  subtitle?: string
  toolbar?: ReactNode
  isLoading?: boolean
  isEmpty?: boolean
  emptyState?: ReactNode
  children?: ReactNode
}
```

```tsx
<header className="page-head">
  <div>
    <h1 className="page-title truncate text-start">{title}</h1>
    {subtitle !== undefined && subtitle !== '' ? (
      <p className="page-sub truncate text-start">{subtitle}</p>
    ) : null}
  </div>
</header>
```

Add `actions?: ReactNode` to the interface and `{actions != null && <div className="dash-hero-actions">{actions}</div>}`
as the header's second child — byte-identical to `PageHeader.tsx:29`. Same `page-head` class,
same wrapper div, so the rendered position matches the EO model with zero new CSS.

**Call-site pattern (direct consumers)** — `countries/index.tsx:209-259` shows both the existing
`onCreate` and the `ListPageShell` invocation the `actions` prop joins:

```tsx
  const onCreate = useCallback((): void => {
    void navigate({ to: '/dossiers/countries/create' })
  }, [navigate])
  …
    <ListPageShell
      title={t('countries:title', { defaultValue: isArabic ? 'الدول' : 'Countries' })}
      subtitle={t('countries:subtitle', { … })}
      toolbar={toolbar}
      isLoading={query.isLoading}
      isEmpty={!query.isLoading && rows.length === 0}
      emptyState={
        <ListEmptyState
          entityType="country"
          onCreate={onCreate}
          filtered={controls.hasActiveFilters}
          onClearFilters={controls.clearAll}
        />
      }
    >
```

This is Pitfall 4 in code: `onCreate` reaches the DOM only through `emptyState`. With rows
present, `isEmpty` is false and nothing renders.

**Call-site pattern (wrapper consumers)** — topics `-TopicsListPage.tsx:214`, persons
`-PersonsListPage.tsx:209`, engagements `pages/engagements/EngagementsListPage.tsx:285`. All
three already accept `onCreate?: () => void` in their props (`-PersonsListPage.tsx:104`,
`EngagementsListPage.tsx:163`) and pass it only into their empty state. The edit is inside the
wrapper component, not the route file.

**Per-page create routes** (all verified on disk): `/dossiers/{countries,organizations,forums,
working_groups,topics,persons,engagements,elected-officials}/create`.

**Copy keys** — `empty-states:list.{country,organization,forum,topic,working_group,person,
engagement}.cta`, all shipped in both locales (UI-SPEC Copywriting). Zero new keys here; use the
SAME key the page's empty-state CTA uses so header and empty-state say the same words.

**Test analog** — `components/list-page/__tests__/ListPageShell.test.tsx:56` already has
`it('renders toolbar when provided', …)`. The `actions` test is that test with one word changed.

---

### NAV-04(a) — admin nav entries in `navigation-config.ts`

**Analog:** the administration group's existing items (`:174-186`):

```typescript
      items: [
        {
          id: 'admin-ai-settings',
          label: 'navigation.aiSettings',
          path: '/admin/ai-settings',
          icon: Sparkles,
        },
        {
          id: 'admin-system',
          label: 'navigation.systemSettings',
          path: '/admin/system',
          icon: Wrench,
        },
```

**Gate pattern** (`:166-174`) — the group is conditionally pushed, not filtered:

```typescript
  // GROUP 3: Administration — admin-only
  if (isAdmin) {
    groups.push({
      id: 'administration',
      label: 'navigation.administration',
      icon: Settings,
      collapsible: true,
      defaultOpen: false,
```

**Instrument control anchor for the INBOUND-LINK sweep** — `/admin/ai-settings` at `:178` is the
known-linked positive control every zero-claim must find in the SAME run (RESEARCH §D-09). Also
note `admin-approvals` at `:212-217` points at top-level `/approvals`, a **different route** from
`/admin/approvals` — a substring sweep will conflate them; the instrument must match on the full
path with a boundary.

### NAV-04(b) — `CommandPalette.tsx` isAdmin hardcode (branch A of the filing order)

**The defect** (`:520-524`):

```typescript
// Navigation pages from config for "Pages" group
const allNavPages = useMemo((): NavigationItem[] => {
  const groups = createNavigationGroups({ tasks: 0, approvals: 0, engagements: 0 }, true)
  return groups.flatMap((g) => g.items)
}, [])
```

**The correct-check analog** — `layout/Sidebar.tsx:51-55`, the only in-repo site that derives it
honestly:

```typescript
  const { user } = useAuthStore()
  …
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const groups: NavigationGroup[] = createNavigationGroups(SECTION_BADGE_COUNTS, isAdmin)
```

`CommandPalette.tsx` imports `createNavigationGroups` at `:104` and does **not** import
`useAuthStore` today (verified: zero `authStore` hits in the file). Branch A is: add the
`useAuthStore` import, derive `isAdmin` exactly as `Sidebar.tsx:54` does, add it to the `useMemo`
dep array. Branch B (register row `PALETTE-ADMIN-01`) writes no code. `RULING-P97-01` requires
one of the two, not a wrinkle note.

### NAV-04(c) — the per-route decision table (single-writer document)

**Analog:** `.planning/phases/95-routes-that-don-t-render/95-DEAD-04-DECISION.md` — the ruled
`/monitoring` KEEP record this phase's `/monitoring` row consumes by name. Same shape: one
route per row, the decision, the derived evidence, the named owner where applicable, and a
`RULING-…` id where one exists. Population = 8 admin routes (mechanical, `routeTree.gen.ts`)

- `/monitoring` = **9 rows**; the register's "9 admin routes" is a **−1 delta the table states,
  not absorbs**.

Admin route files on disk (derived this session, matches RESEARCH's 8):
`ai-settings.tsx`, `ai-usage.tsx`, `approvals.tsx`, `data-retention.tsx`,
`field-permissions.tsx`, `index.tsx`, `preview-layouts.tsx`, `system.tsx`.

### NAV-04(d) — the INBOUND-LINK instrument (D-09)

**Analog:** `scripts/trigsweep-classify.mjs` — the P96 instrument built for exactly this
"syntactic sweep under-counts a behaviour class" problem. Copy its four structural moves:

```javascript
// (a) the POPULATION is enumerated mechanically … (closed, not guessed);
// (b) each row is classified by the UNION of all four known forms, plus … SUSPECT by …;
// (c) every unmatched row is PRINTED as `RESIDUAL — hand-classify`. The residual is part of the
//     deliverable, never silently assumed non-writing.
```

```javascript
const FORMS = [
  { class: 'writer (:=)', re: /NEW\.[a-zA-Z_]+\s*:=/i },
  …
]
const RESIDUAL = 'RESIDUAL — hand-classify'
```

**Fail-closed exit contract to copy verbatim** (`:40-43`, `:57-72`):

```javascript
// Exit codes:  0 classified; the residual was listed
//              1 a classification invariant broke (a known writer went missing → regression)
//              2 UNABLE TO MEASURE — input file absent or unparseable (fail closed, never a
//                silent zero; GATE-STANDARD C2: a labelled state, not a red)

const unableToMeasure = (reason) => {
  console.log(`UNABLE TO MEASURE — ${reason}`)
  process.exit(2)
}
```

**Pinned-control pattern** (`:99-119`) — the "known writer must stay classified" invariant maps
directly onto "the known-linked `/admin/ai-settings` control must be found in the same run":

```javascript
// ---- the six ORCH-BRIEF meaningful rewrites: known plain-`=` writers, pinned ---
// If one of these ever falls out of a writer class the classifier has regressed — that is exit 1,
// not a smaller number quietly reported.
const PINS = [ { table: 'staff_profiles', column: 'version' }, … ]
```

**FLOOR declaration** (`:161-170`) — copy the wording discipline; a count is never a total:

```javascript
console.log('POPULATION DEFINITION: … OUTSIDE IT: …')
console.log(`FLOOR: ${writers.length} writers of ${classified.length} … — never a total …`)
```

Vocabulary and file counts for the union of known forms are pre-derived in RESEARCH
§INBOUND-LINK instrument (10 forms, `<Link to=` 31 files … `history.replaceState` 1), with
blind spots already stated. Use them as the `FORMS` seed.

---

### Oracles — `tests/e2e/97-*.spec.ts` (5 specs)

**Analog:** `tests/e2e/95-monitoring-mounts.spec.ts` (120 lines, read in full). Every structural
element the P97 specs need is in it.

**Header contract** (`:1-28`) — `@covers`, what-this-kills, auth mechanism, network posture:

```typescript
// @covers DEAD-04
//
// Phase 95 Wave 1 (95-04) — mount + caller-resolution oracle for /monitoring.
//
// WHAT THIS KILLS. …
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
//
// NETWORK: natural. This is a renders-oracle against real dev-stack state, so nothing is blocked
// or stubbed — a green here means the real path resolved.
```

**Inline auth helper** (`:29-66`) — copy verbatim; it fails loudly on missing creds and never
echoes a value:

```typescript
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

const SETTLE_TIMEOUT = 15_000

/** Sign in inline; never echo either credential value. */
const signInInline = async (page: Page): Promise<void> => {
  if (email === '' || password === '') {
    throw new Error('TEST_USER_EMAIL / TEST_USER_PASSWORD missing from .env.test')
  }
  const login = new LoginPage(page)
  await login.goto()
  await login.signIn(email, password)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 })
}
```

**Leak oracle** (`:54-55`) — the reusable `INTERNAL_STRING` regex, with its narrowing rationale
at `:40-53`:

```typescript
const INTERNAL_STRING =
  /(42501|42703|42P01|permission denied|supabase\.co|supabase-js|SupabaseClient|FunctionsHttpError|FunctionsFetchError)/i
```

```typescript
const bodyText = (await page.locator('body').innerText()) ?? ''
expect(bodyText).not.toMatch(INTERNAL_STRING)
```

**The narrowing is a warning, not decoration** (`:44-52`): the bare `supabase` arm was removed
because the monitoring page legitimately renders the word. A P97 spec that widens the regex back
must re-check its own surface's product copy first, or it fails on intended data.

**Population-as-conjunct pattern** (`:88-110`) — assert the enumerated set TOGETHER, and attach
listeners BEFORE navigating:

```typescript
    // Attached BEFORE the navigation: the two queries fire on mount, and a listener attached after
    // goto() would miss them and then pass for the wrong reason (nothing observed, nothing failed).
    const health: number[] = []
    page.on('response', (res) => { … })

    await page.goto('/monitoring')

    await expect.poll(() => health.length > 0 && alerts.length > 0, { timeout: SETTLE_TIMEOUT }).toBe(true)
```

**Settle-not-hang pattern** (`:112-115`) — the loading text disappearing IS the settle assertion:

```typescript
await expect(page.getByText('Loading health...')).toHaveCount(0, { timeout: SETTLE_TIMEOUT })
```

**What the P97 specs must add that 95 did not need** (D-10, UI-SPEC Verification Notes): the
click must go through the REAL rendered affordance (`page.getByRole('link', {name})` inside the
sidebar/tab/header), never `page.goto`. `page.goto` proves the route mounts; it proves nothing
about reachability. Spec-path-as-filter law applies to the NAV-03 pair
(`97-digests-tab.spec.ts` + `97-list-create-affordances.spec.ts`): the gate asserts BOTH files
exist first, then hardcodes the expected pass count.

---

## Shared Patterns

### S-1 Local type-widening (NAV-01, all three surfaces)

**Source:** `frontend/src/pages/dossiers/CreateDossierHub.tsx:14-17` (the law) and `:37-64` (the
code). **Apply to:** `DossierListPage.tsx`, `compare.tsx`, `EntityComparisonSelector.tsx`,
`useEntityComparison.ts`, and any counts-source widening.

```typescript
type HubCardType =
  | 'country'
  | 'organization'
  | 'forum'
  | 'engagement'
  | 'topic'
  | 'working_group'
  | 'person'
  | 'elected_official'
```

Never widen `DossierType` in `lib/dossier-type-guards.ts` — it is the discriminated-union guard
and the DB contract (`dossiers.type` CHECK = 7 values).

### S-2 Route-segment resolution (NAV-01)

**Source:** `frontend/src/lib/dossier-routes.ts:12-36`. **Apply to:** every EO href. The 8th key
already exists — do not build a per-surface path map.

```typescript
export const DOSSIER_TYPE_TO_ROUTE: Record<string, string> = {
  country: 'countries', organization: 'organizations', person: 'persons',
  engagement: 'engagements', forum: 'forums', working_group: 'working_groups',
  topic: 'topics', elected_official: 'elected-officials',
}
export function getDossierRouteSegment(type: string | undefined | null): string { … }
```

Note the file-header comment at `:10-11` ("elected_official is now a person_subtype, all persons
use /persons route") **contradicts its own map** (`:20`) and the live routes. Stale comment; the
map is correct. Do not "fix" the map to match the comment.

### S-3 Honest-failure states on newly exposed surfaces

**Source:** `DossierListPage.tsx:545-577` (`dossier-count-unavailable` + `QueryErrorState`),
`components/empty-states/ListEmptyState.tsx`. **Apply to:** the EO hub card, the EO compare arm,
every admin route given a nav entry. A nav entry that lands on a blank region is a reachability
regression, not a win (UI-SPEC). Never a defaulted `0`, never a blank pane.

### S-4 i18n same-commit, both locales, colon-form

**Source:** `frontend/CLAUDE.md` i18n section + `frontend/src/i18n/index.ts` (static bundle).
**Apply to:** the TWO new keys (`workspace:tabs.digests`,
`entity-comparison:selector.entityTypes.elected_official`). `public/locales` is DEAD. An
unregistered namespace falls back to EN in BOTH languages. `pnpm lint` runs
`scripts/check-i18n-namespaces.mjs`.

### S-5 `command grep`, unpiped, with a positive control

**Source:** RESEARCH Pitfall 3 + `scripts/trigsweep-classify.mjs`'s pinned-control block.
**Apply to:** the `services/auth.ts` zero-importer re-derivation (D-07), every zero-inbound
claim (D-09), and the `<ListPageShell` population sweep (C-1 above).

```bash
# zero claim (D-07) — unpiped, so $? is grep's own
command grep -rn "services/auth'" /Users/…/frontend/src --include='*.ts' --include='*.tsx'
# positive control, SAME run — must be non-empty
command grep -rn "store/authStore'" /Users/…/frontend/src --include='*.ts' --include='*.tsx'
```

Piping into `head`/`wc` makes `$?` the pipe tail's exit and destroys the semantics. The gate
reads the unpiped exit code AND asserts the control's output is non-empty (watchers fail closed:
condition AND exit code).

### S-6 Design tokens and logical properties

**Source:** `Sidebar.tsx:138-153`, `PageHeader.tsx:19-31`, `SettingsNavigation.tsx:98`,
`elected-officials/index.tsx:202-207`. **Apply to:** every pixel this phase places. Every reused
component is already compliant (`before:start-0`, `me-2`, `text-start`, `min-h-11`) — compliance
is inherited by construction, and new code must not break it. ESLint ERRORS on physical classes
and raw hex in `frontend/**`.

### S-7 Explicit return types, no semicolons, single quotes

**Source:** `frontend/CLAUDE.md` + every analog above. `routes/_protected/settings.tsx:9`
currently lacks a return type — a file being edited must gain one
(`React.JSX.Element` / `ReactElement`, matching its neighbours).

---

## No Analog Found

| File                                                                                        | Role      | Data Flow | Reason                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------- | --------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/services/auth.ts` (DELETE)                                                    | service   | —         | Deletion has no code analog. The _procedure_ analog is S-5 (re-derived zero + positive control) and the _record_ analog is `95-DEAD-04-DECISION.md`. Do not "port" anything out of it — `RULING-P92-06` establishes zero importers and a colliding `'auth-storage'` zustand key. |
| `frontend/src/routes/_protected/admin/{approvals,preview-layouts}.tsx` (conditional DELETE) | route     | —         | Same. `RULING-P97-01` §2/§3 make both CONDITIONAL: the trigger comparison must be PASTED into the decision row, and a refuted trigger re-escalates rather than improvising a nav entry.                                                                                          |
| `frontend/src/routeTree.gen.ts`                                                             | generated | —         | Never hand-edited. Regenerates on dev/build; commit the regenerated tree in the SAME commit as the route deletion (P95 precedent). Route-count gates derive at run time — 203 at HEAD already drifted from P95's 202.                                                            |

**Partial-analog caveats (analog found, but it does not cover the whole edit):**

- `hooks/useEntityComparison.ts` — the per-type fetch arm (`:567`) and extension-field registry
  (`:95`) are the shape to copy, but the EO arm queries a DIFFERENT predicate (`type='person'`
  - `person_subtype='elected_official'`), and its field config must come from
    `domains/elected-officials/types` (office/term/party). No existing arm is subtype-filtered.
- `services/dossier-api.ts` — `getDossierCountsByType` is its own analog for shape, but an EO
  bucket needs a second table. See NAV-01(c).
- `components/settings/SettingsNavigation.tsx` — the chrome is exactly right and must be reused,
  but it is callback-driven with no per-section route, so mounting it on a child route is an API
  change, not a remount. See NAV-02(c).

---

## Metadata

**Analog search scope:** `frontend/src/{components,routes,pages,lib,hooks,services,domains,i18n}`,
`tests/e2e/`, `scripts/`, `.tickmarkr/overseer/`, `.planning/phases/95-*/`.
**Files read this session:** 26 (17 full, 9 targeted non-overlapping ranges).
**Sweeps run:** `<ListPageShell` consumers (8, incl. test), admin route files (8), `authStore`
imports in CommandPalette (0), i18n `tabs`/`entityTypes` blocks, `getDossierCountsByType`
definition (1).
**Not re-derived here (execution owns them):** the live `dossiers_type_check`, the
`services/auth.ts` zero, the `routeTree.gen.ts` route count, the two audit-BROKEN admin pages'
current render state (RESEARCH A2).
**Pattern extraction date:** 2026-08-17
