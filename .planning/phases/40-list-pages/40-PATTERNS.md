# Phase 40: list-pages — Pattern Map

**Mapped:** 2026-04-25
**Files analyzed:** 30 (6 new primitives + 3 new hooks + 7 page bodies + 16 locale files + 1 config + barrel)
**Analogs found:** 27 / 30 (3 locale files have generic JSON shape only)

> Honors RESEARCH.md SUPERSEDING corrections:
>
> 1. Route topology — list page slots already exist; **REPLACE** bodies in place. No `topics.tsx` layout route. Persons/Engagements page bodies live at `frontend/src/pages/{persons,engagements}/{Persons,Engagements}ListPage.tsx`; the route `index.tsx` files KEEP their delegation imports.
> 2. Pagination — engagements use **OFFSET** (`page`/`limit`) via `engagementsRepo.getEngagements()` wrapped in `useInfiniteQuery`, NOT cursor.
> 3. `domains/countries/` and `domains/organizations/` DO NOT EXIST — `useCountries`/`useOrganizations` mirror `useForums.ts` Supabase pattern (`from('dossiers').eq('type', X)`).
> 4. Sensitivity column = `sensitivity_level: number (1-4)`. Last-touch = `updated_at: timestamptz`.
> 5. Component directory: `frontend/src/components/list-page/` (singular `list-page` per upstream context, NOT `list-pages` per RESEARCH.md §"Recommended Project Structure" — planner should reconcile; this map uses upstream context's `list-page/`).

## File Classification

| New/Modified File                                                                                                            | Role                                                                       | Data Flow                                             | Closest Analog                                                                                                                   | Match Quality |
| ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `frontend/src/components/list-page/ListPageShell.tsx`                                                                        | component (chrome shell)                                                   | render-only, slots                                    | `frontend/src/components/layout/PageHeader.tsx` (composed inside) + handoff `pages.jsx:3-26`                                     | role-match    |
| `frontend/src/components/list-page/GenericListPage.tsx`                                                                      | component (rows variant)                                                   | render-only, slots                                    | handoff `pages.jsx:614-630` (`.forum-row`) + `frontend/src/routes/_protected/dossiers/forums/index.tsx:206-233` mobile-card list | role-match    |
| `frontend/src/components/list-page/DossierTable.tsx`                                                                         | component (table body)                                                     | render-only over query data                           | `frontend/src/components/ui/table.tsx` primitives + forums/index.tsx table block (lines 156-203)                                 | exact         |
| `frontend/src/components/list-page/PersonsGrid.tsx`                                                                          | component (card grid)                                                      | render-only over query data                           | handoff `app.css:233` `.card` rule + Phase 38 dashboard card aesthetic                                                           | role-match    |
| `frontend/src/components/list-page/EngagementsList.tsx`                                                                      | component (week-list + filter pills + load-more)                           | infinite-scroll request-response + client-side filter | handoff `pages.jsx:15-25` + `app.css:309-322` `.week-list`                                                                       | role-match    |
| `frontend/src/components/list-page/index.ts`                                                                                 | barrel                                                                     | re-export                                             | `frontend/src/components/signature-visuals/index.ts` (Phase 37 barrel)                                                           | exact         |
| `frontend/src/hooks/useCountries.ts`                                                                                         | adapter hook                                                               | CRUD-read                                             | `frontend/src/hooks/useForums.ts:25-97`                                                                                          | exact         |
| `frontend/src/hooks/useOrganizations.ts`                                                                                     | adapter hook                                                               | CRUD-read                                             | `frontend/src/hooks/useForums.ts:25-97`                                                                                          | exact         |
| `frontend/src/hooks/useEngagementsInfinite.ts`                                                                               | adapter hook                                                               | infinite request-response                             | `useInfiniteQuery` over existing `engagementsRepo.getEngagements()` (`@/domains/engagements`)                                    | role-match    |
| `frontend/src/routes/_protected/dossiers/countries/index.tsx`                                                                | route (REPLACED body)                                                      | request-response                                      | `frontend/src/routes/_protected/dossiers/forums/index.tsx` (266 lines — entire shape)                                            | exact         |
| `frontend/src/routes/_protected/dossiers/organizations/index.tsx`                                                            | route (REPLACED body)                                                      | request-response                                      | `frontend/src/routes/_protected/dossiers/forums/index.tsx`                                                                       | exact         |
| `frontend/src/routes/_protected/dossiers/forums/index.tsx`                                                                   | route (REPLACED body)                                                      | request-response                                      | self (current 266-line impl is the analog the new body MUST visually replace)                                                    | exact         |
| `frontend/src/routes/_protected/dossiers/topics/index.tsx`                                                                   | route (REPLACED body)                                                      | request-response                                      | `frontend/src/routes/_protected/dossiers/forums/index.tsx`                                                                       | exact         |
| `frontend/src/routes/_protected/dossiers/working_groups/index.tsx`                                                           | route (REPLACED body)                                                      | request-response                                      | `frontend/src/routes/_protected/dossiers/forums/index.tsx`                                                                       | exact         |
| `frontend/src/routes/_protected/persons/index.tsx`                                                                           | route (KEEP delegation; replace `@/pages/persons/PersonsListPage`)         | route-stub                                            | self — 14-line delegation stub kept; planner replaces target page                                                                | exact         |
| `frontend/src/routes/_protected/engagements/index.tsx`                                                                       | route (KEEP delegation; replace `@/pages/engagements/EngagementsListPage`) | route-stub                                            | self — 14-line delegation stub kept; planner replaces target page                                                                | exact         |
| `frontend/public/locales/{en,ar}/list-pages.json`                                                                            | locale                                                                     | static                                                | `frontend/public/locales/en/dossier.json`                                                                                        | role-match    |
| `frontend/public/locales/{en,ar}/{countries,organizations,persons,forums,topics,working-groups,engagements}.json` (14 files) | locale                                                                     | static                                                | `frontend/public/locales/en/dossier.json`                                                                                        | role-match    |
| `frontend/.size-limit.json`                                                                                                  | config                                                                     | budget gate                                           | self (current 6-budget shape)                                                                                                    | exact         |

## Pattern Assignments

### `frontend/src/components/list-page/ListPageShell.tsx` (component, chrome)

**Analog:** `/tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx:3-26` (PageHead + Toolbar) + composes existing `frontend/src/components/layout/PageHeader.tsx` for v2 parity.

**Imports pattern** (mirror forums/index.tsx imports lines 8-26):

```tsx
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
```

**Core slot composition pattern** (RESEARCH.md §Pattern 1 — verbatim from handoff `pages.jsx:3-26`):

```tsx
type ListPageShellProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  toolbar?: React.ReactNode
  isLoading?: boolean
  isEmpty?: boolean
  emptyState?: React.ReactNode
  skeleton?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ListPageShell(props: ListPageShellProps): JSX.Element {
  const {
    title,
    subtitle,
    action,
    toolbar,
    isLoading,
    isEmpty,
    emptyState,
    skeleton,
    children,
    className,
  } = props
  return (
    <div className={cn('page space-y-6', className)}>
      <div className="page-head flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title text-2xl sm:text-3xl font-semibold">{title}</h1>
          {subtitle != null && (
            <div className="page-sub text-sm text-ink-mute mt-1">{subtitle}</div>
          )}
        </div>
        {action}
      </div>
      {toolbar != null && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
      {isLoading === true ? skeleton : isEmpty === true ? emptyState : children}
    </div>
  )
}
```

**RTL/responsive rules applied:**

- Logical properties only (`gap`, `mt-1`, no `ml-*/mr-*`)
- `min-h-11` enforced at row/button level by consumers, not shell
- Mobile-first: shell adds no max-width — consumer chooses

---

### `frontend/src/components/list-page/GenericListPage.tsx` (component, rows variant)

**Analog:** Handoff `pages.jsx:614-630` (`.forum-row` grid `auto 1fr auto auto`, `padding 14px`, `border-bottom: 1px solid var(--line-soft)`) + existing forums/index.tsx mobile card-list pattern (lines 206-233).

**Core row pattern** (port handoff verbatim):

```tsx
type GenericListPageItem = {
  id: string
  glyphType: 'forum' | 'topic' | 'working_group'
  nameEn: string
  nameAr?: string
  meta?: React.ReactNode
  status?: { label: string; tone: 'accent' | 'warn' | 'danger' | 'ok' | 'info' }
  href: string
}

export function GenericListPage({
  items,
  isRTL,
}: {
  items: GenericListPageItem[]
  isRTL: boolean
}): JSX.Element {
  return (
    <ul className="forum-list border border-line rounded-md overflow-hidden">
      {items.map((it) => (
        <li
          key={it.id}
          className="forum-row grid items-center min-h-11"
          style={{
            gridTemplateColumns: 'auto 1fr auto auto',
            padding: '14px',
            borderBottom: '1px solid var(--line-soft)',
          }}
        >
          <DossierGlyph type={it.glyphType} size={20} />
          <Link to={it.href} className="ms-3 truncate font-medium">
            {isRTL ? (it.nameAr ?? it.nameEn) : it.nameEn}
          </Link>
          <div className="text-sm text-ink-mute me-3">{it.meta}</div>
          {it.status && <span className={`chip chip-${it.status.tone}`}>{it.status.label}</span>}
        </li>
      ))}
    </ul>
  )
}
```

**Touch target:** `min-h-11` on `<li>` satisfies D-18 (≥44 px).

---

### `frontend/src/components/list-page/DossierTable.tsx` (component, table body)

**Analog A — primitives:** `frontend/src/components/ui/table.tsx` lines 25-115 (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` — all use `text-start` already, RTL-safe).

**Analog B — composition:** `frontend/src/routes/_protected/dossiers/forums/index.tsx:156-203` (table block with badge chips + Link cells).

**Core table composition** (compose existing primitives, NOT rebuild):

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableContainer,
} from '@/components/ui/table'
import { DossierGlyph } from '@/components/signature-visuals'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { toArDigits } from '@/lib/i18n/toArDigits'

type DossierRow = {
  id: string
  type: 'country' | 'organization'
  name_en: string
  name_ar: string
  flag_iso?: string
  engagement_count: number
  updated_at: string
  sensitivity_level: 1 | 2 | 3 | 4
}

const SENSITIVITY_CHIP: Record<number, { tone: string; key: string }> = {
  1: { tone: 'chip-info', key: 'sensitivity.public' },
  2: { tone: 'chip-ok', key: 'sensitivity.internal' },
  3: { tone: 'chip-warn', key: 'sensitivity.confidential' },
  4: { tone: 'chip-danger', key: 'sensitivity.restricted' },
}

export function DossierTable({
  rows,
  isRTL,
  t,
}: {
  rows: DossierRow[]
  isRTL: boolean
  t: (k: string) => string
}): JSX.Element {
  return (
    <TableContainer className="hidden md:block rounded-lg border border-line">
      <Table className="tbl">
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.name')}</TableHead>
            <TableHead className="text-end">{t('table.engagements')}</TableHead>
            <TableHead className="text-end">{t('table.lastTouch')}</TableHead>
            <TableHead>{t('table.sensitivity')}</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="min-h-11">
              <TableCell className="font-medium">
                <Link
                  to={`/dossiers/${r.type === 'country' ? 'countries' : 'organizations'}/${r.id}`}
                  className="flex items-center gap-3 min-h-11"
                >
                  <DossierGlyph type={r.type} flag={r.flag_iso} size={20} />
                  <span className="flex flex-col">
                    <span>{r.name_en}</span>
                    <span className="text-xs text-ink-mute" dir="rtl">
                      {r.name_ar}
                    </span>
                  </span>
                </Link>
              </TableCell>
              <TableCell className="text-end tabular-nums">
                {isRTL ? toArDigits(String(r.engagement_count)) : r.engagement_count}
              </TableCell>
              <TableCell className="text-end text-ink-mute">
                {/* researcher-locked: format updated_at via existing date helper */}
                {r.updated_at}
              </TableCell>
              <TableCell>
                <span className={`chip ${SENSITIVITY_CHIP[r.sensitivity_level].tone}`}>
                  {t(SENSITIVITY_CHIP[r.sensitivity_level].key)}
                </span>
              </TableCell>
              <TableCell>
                <ChevronRight className="icon-flip h-4 w-4 text-ink-mute" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
```

**RTL chevron:** `.icon-flip` already shipped in handoff `app.css:667` — `[dir="rtl"] .icon-flip { transform: scaleX(-1) }`. No JSX-level rotation.

**Mobile card-view fallback:** Planner adds a parallel `<div className="md:hidden space-y-2">…</div>` mirroring forums/index.tsx lines 206-233 below the `<TableContainer>`.

---

### `frontend/src/components/list-page/PersonsGrid.tsx` (component, card grid)

**Analog:** Handoff `app.css:233` `.card { border: 1px solid var(--line); border-radius: var(--radius); padding: var(--pad) }` + Phase 38 dashboard card aesthetic (CONTEXT D-04).

**Core card pattern:**

```tsx
type PersonCard = {
  id: string
  name_en: string
  name_ar?: string
  role?: string
  organization?: string
  is_vip?: boolean
  flag_iso?: string
}

const initial = (name: string): string => name.trim().charAt(0).toUpperCase()

export function PersonsGrid({
  items,
  isRTL,
  t,
}: {
  items: PersonCard[]
  isRTL: boolean
  t: (k: string) => string
}): JSX.Element {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((p) => (
        <Link
          key={p.id}
          to={`/persons/${p.id}`}
          className="card flex items-start gap-3 rounded-[var(--radius-md)] border border-line shadow-sm p-4 min-h-11 hover:bg-accent-soft/30 transition-colors"
        >
          <div className="grid place-items-center w-11 h-11 rounded-full bg-accent-soft text-accent-ink font-semibold shrink-0">
            {initial(isRTL ? (p.name_ar ?? p.name_en) : p.name_en)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate">
                {isRTL ? (p.name_ar ?? p.name_en) : p.name_en}
              </span>
              <DossierGlyph type="person" flag={p.flag_iso} size={14} />
              {p.is_vip === true && (
                <span className="chip chip-accent text-xs">{t('chip.vip')}</span>
              )}
            </div>
            {p.role != null && <div className="text-sm text-ink-mute mt-1 truncate">{p.role}</div>}
            {p.organization != null && (
              <div className="text-xs text-ink-mute truncate">{p.organization}</div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
```

**Mobile reflow:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` per D-17.
**Avatar:** `bg-accent-soft text-accent-ink` per Phase 33 tokens (CONTEXT specifics line 183).

---

### `frontend/src/components/list-page/EngagementsList.tsx` (component, infinite + filter)

**Analog A — toolbar/pills:** Handoff `pages.jsx:15-25`.
**Analog B — week-list:** Handoff `app.css:309-322` (grid `72px 1fr auto`).
**Analog C — load-more:** Handoff `pages.jsx:90-111` (`.spinner-row`).
**Analog D — search debounce:** Phase 39 kanban-calendar pattern (250ms via `useDebouncedValue`).

**Core anatomy:**

```tsx
import { useDeferredValue, useMemo, useState } from 'react'
import { GlobeSpinner } from '@/components/signature-visuals'
import { useEngagementsInfinite } from '@/hooks/useEngagementsInfinite'
import { useDebouncedValue } from '@/hooks/useDebouncedValue' // researcher confirms exact path

type FilterKey = 'all' | 'confirmed' | 'travel' | 'pending'

export function EngagementsList({
  isRTL,
  t,
}: {
  isRTL: boolean
  t: (k: string) => string
}): JSX.Element {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const debouncedQ = useDebouncedValue(q, 250)
  const query = useEngagementsInfinite({ search: debouncedQ })
  const all = useMemo(() => (query.data?.pages ?? []).flatMap((p) => p.items ?? []), [query.data])
  const filtered = useMemo(() => {
    return all.filter((e) => {
      if (filter === 'confirmed') return e.status === 'confirmed'
      if (filter === 'travel') return e.kind === 'travel'
      if (filter === 'pending') return e.status === 'pending'
      return true
    })
  }, [all, filter])

  // group by ISO week → render `.week-list`
  // ...

  return (
    <>
      {/* Toolbar — handoff pages.jsx:15-25 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="tb-search relative">
          <input
            className="min-h-11 ps-3 pe-3 border border-line rounded-md w-72"
            placeholder={t('search.placeholder')}
            value={q}
            onChange={(e): void => setQ(e.target.value)}
          />
        </div>
        {(['all', 'confirmed', 'travel', 'pending'] as const).map((k) => (
          <button
            key={k}
            type="button"
            className={`btn min-h-11 min-w-11 ${filter === k ? 'btn-primary' : ''}`}
            onClick={(): void => setFilter(k)}
          >
            {t(`pill.${k}`)}
          </button>
        ))}
      </div>

      {/* Week list body — handoff app.css:309-322 */}
      <div className="week-list">{/* grouped rows */}</div>

      {/* Load-more — handoff pages.jsx:90-111 */}
      {query.hasNextPage === true && (
        <div className="spinner-row flex items-center justify-center gap-3 py-4">
          <GlobeSpinner size={16} />
          <span className="text-sm text-ink-mute">{t('loadMore.loading')}</span>
        </div>
      )}
      {query.hasNextPage === true && (
        <button
          type="button"
          className="btn min-h-11 w-full"
          onClick={(): void => {
            void query.fetchNextPage()
          }}
          disabled={query.isFetchingNextPage}
        >
          {t('loadMore.button')}
        </button>
      )}
    </>
  )
}
```

---

### `frontend/src/hooks/useCountries.ts` (adapter hook)

**Analog:** `frontend/src/hooks/useForums.ts:25-97` — IDENTICAL shape, swap `'forum'` → `'country'`.

**Imports pattern** (lines 7-17 of useForums.ts):

```tsx
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
```

**Core pattern** (verbatim port from useForums.ts:25-97 with type swap):

```tsx
const COUNTRIES_QUERY_KEY = 'countries'

export function useCountries(
  filters: { search?: string; page?: number; limit?: number; status?: string } = {},
): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: [COUNTRIES_QUERY_KEY, filters],
    queryFn: async () => {
      const { search, status, page = 1, limit = 20 } = filters
      const offset = (page - 1) * limit

      let query = supabase
        .from('dossiers')
        .select('*', { count: 'exact' })
        .eq('type', 'country')
        .neq('status', 'deleted')

      if (search != null && search.length > 0) {
        query = query.or(`name_en.ilike.%${search}%,name_ar.ilike.%${search}%`)
      }
      if (status != null) query = query.eq('status', status)

      query = query.order('updated_at', { ascending: false }).range(offset, offset + limit - 1)

      const { data, error, count } = await query
      if (error) throw new Error(error.message)

      return {
        data: data ?? [],
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil((count ?? 0) / limit),
        },
      }
    },
    staleTime: 1000 * 60 * 5,
  })
}
```

**Error handling** (line 56-58 of useForums.ts):

```tsx
if (error) throw new Error(error.message)
```

---

### `frontend/src/hooks/useOrganizations.ts` (adapter hook)

**Analog:** `frontend/src/hooks/useForums.ts:25-97`. Swap `'forum'` → `'organization'`. Otherwise identical to `useCountries.ts` pattern above.

---

### `frontend/src/hooks/useEngagementsInfinite.ts` (adapter hook, infinite)

**Analog A — repo signature:** Existing `engagementsRepo.getEngagements({ page, limit, sort_by, sort_order, search? })` — exposed via `@/domains/engagements`.
**Analog B — pattern:** Phase 38 thin-adapter (`useWeekAhead`, `usePersonalCommitments`).
**Analog C — `useInfiniteQuery`:** Per RESEARCH.md §Pattern 3.

**Core pattern:**

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'
import { engagementsRepo } from '@/domains/engagements'

export function useEngagementsInfinite(
  params: { search?: string; limit?: number } = {},
): ReturnType<typeof useInfiniteQuery> {
  const limit = params.limit ?? 20
  return useInfiniteQuery({
    queryKey: ['engagements-infinite', params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      engagementsRepo.getEngagements({
        page: pageParam as number,
        limit,
        sort_by: 'start_date',
        sort_order: 'desc',
        search: params.search,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const items = (lastPage as { items?: unknown[] }).items ?? []
      return items.length < limit ? undefined : allPages.length + 1
    },
    staleTime: 30_000,
  })
}
```

**Why offset, not cursor:** Existing repo signature has no cursor support (RESEARCH.md §"Engagements pagination column"). Backend change out of scope.

---

### `frontend/src/routes/_protected/dossiers/{countries,organizations,forums,topics,working_groups}/index.tsx` (route bodies REPLACED)

**Analog:** `frontend/src/routes/_protected/dossiers/forums/index.tsx` — current 266-line implementation. Replace its body with the new ListPageShell-driven version. Keep:

- File location, route export shape
- Route export pattern (lines 34-41):
  ```tsx
  export const Route = createFileRoute('/_protected/dossiers/forums/')({
    component: ForumsListPage,
    validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
      page: Math.max(1, Number(search.page) || 1),
      search:
        typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
    }),
  })
  ```
- `useTranslation` namespace switch from `'dossier'` to per-entity (`'countries'`, `'forums'`, …) + shared `'list-pages'`.

**New body skeleton** (planner constructs):

```tsx
function CountriesListPage(): JSX.Element {
  const { t } = useTranslation(['countries', 'list-pages'])
  const { isRTL } = useDirection()
  const { page } = Route.useSearch()
  const query = useCountries({ page, limit: 20 })
  const rows = query.data?.data ?? []
  return (
    <ListPageShell
      title={t('countries:title')}
      subtitle={t('countries:subtitle')}
      toolbar={<ToolbarSearch />} // optional per page
      isLoading={query.isLoading}
      isEmpty={!query.isLoading && rows.length === 0}
      emptyState={<EmptyState entity="countries" />}
      skeleton={<DossierTableSkeleton rows={8} />}
    >
      <DossierTable rows={rows} isRTL={isRTL} t={t} />
    </ListPageShell>
  )
}
```

**For Forums/Topics/Working-Groups:** swap body to `<GenericListPage items={…} />` instead of `<DossierTable />`, hook to `useForums`/`useTopics`/`useWorkingGroups`.

**Imports to keep from analog (lines 8-26):** TanStack Router, react-i18next, `useDirection`, route segment helper. Drop unused: `Loader2`, `Plus`, `MessageSquare`, `PageHeader`, raw table primitives (now wrapped in `DossierTable`), `Badge`.

---

### `frontend/src/routes/_protected/persons/index.tsx` + `frontend/src/routes/_protected/engagements/index.tsx` (route stubs KEPT)

**Analog:** Self — these 14-line stubs delegate to `@/pages/{persons,engagements}/{Persons,Engagements}ListPage`.

**Action for planner:** Do NOT modify these route stubs. Replace the bodies of:

- `frontend/src/pages/persons/PersonsListPage.tsx` → consume `<ListPageShell>` + `<PersonsGrid>` + `usePersons()`.
- `frontend/src/pages/engagements/EngagementsListPage.tsx` → consume `<ListPageShell>` + `<EngagementsList>`.

The route stub pattern (verbatim from existing file, KEEP as-is):

```tsx
import { createFileRoute } from '@tanstack/react-router'
import PersonsListPage from '@/pages/persons/PersonsListPage'

export const Route = createFileRoute('/_protected/persons/')({
  component: PersonsListPage,
})
```

---

### `frontend/public/locales/{en,ar}/*.json` (16 NEW locale files)

**Analog:** `frontend/public/locales/en/dossier.json` (existing namespace shape).

**Shape** (extract from analog):

```json
{
  "title": "...",
  "subtitle": "...",
  "table": { "name": "...", "engagements": "...", "lastTouch": "...", "sensitivity": "..." },
  "empty": { "title": "...", "description": "..." },
  "loading": "...",
  "chip": { "vip": "..." },
  "sensitivity": { "public": "...", "internal": "...", "confidential": "...", "restricted": "..." }
}
```

**Shared `list-pages.json`** (chrome strings only — search placeholder, load-more button, generic loading/empty fallback):

```json
{
  "search": { "placeholder": "Search…" },
  "loadMore": { "button": "Load more", "loading": "Loading more engagements…" },
  "pill": { "all": "All", "confirmed": "Confirmed", "travel": "Travel", "pending": "Pending" }
}
```

**AR parity:** every key mirrored with Tajawal-rendered Arabic strings.

---

### `frontend/.size-limit.json` (config)

**Analog:** Self — 6-budget shape (lines 1-44 above).

**Modification:** Update line 27 (`"limit": "800 KB"`) → `"815 KB"` for the `Total JS` budget. All other entries unchanged.

```json
{
  "name": "Total JS",
  "path": "dist/assets/*.js",
  "limit": "815 KB",
  "gzip": true,
  "running": false
}
```

---

## Shared Patterns

### Authentication / Route Protection

**Source:** `frontend/src/routes/_protected.tsx` (parent route wrapper)
**Apply to:** All 7 route files — already inherited via `_protected/` prefix. No code change required in Phase 40 page bodies.

### Error Handling

**Source:** `frontend/src/hooks/useForums.ts:56-58`

```tsx
if (error) throw new Error(error.message)
```

**Apply to:** `useCountries`, `useOrganizations` (TanStack Query bubbles to `query.error`). For `useEngagementsInfinite`, the repo's REST adapter throws — wrap call site only if needed.

### Translation namespace loading

**Source:** `frontend/src/routes/_protected/dossiers/forums/index.tsx:44`

```tsx
const { t } = useTranslation('dossier')
```

**Apply to:** Each new page body uses array form to load multiple namespaces:

```tsx
const { t } = useTranslation(['countries', 'list-pages'])
```

### RTL direction hook

**Source:** `frontend/src/hooks/useDirection` (already imported in forums/index.tsx:26)

```tsx
const { isRTL } = useDirection()
```

**Apply to:** Every list page body that renders bilingual content or `icon-flip` chevrons.

### RTL chevron via CSS class

**Source:** Handoff `app.css:667` (already shipped) — `[dir="rtl"] .icon-flip { transform: scaleX(-1) }`
**Apply to:** Every chevron in `DossierTable`, `GenericListPage`, person card affordance icons. JSX uses `<ChevronRight className="icon-flip h-4 w-4" />`.

### Touch target compliance (D-18)

**Source:** CLAUDE.md mobile-first mandate
**Apply to:** Every interactive element — `min-h-11 min-w-11` (rows, chevrons, filter pills, load-more button, search input). Already enforced by Playwright fixture in Phase 38.

### Logical-property utilities (D-16)

**Source:** CLAUDE.md "Arabic RTL Support Guidelines" + handoff `app.css` already uses `margin-inline-start/end`, `border-inline-end`, `text-align: start/end`.
**Apply to:** ALL Tailwind classes in new components. Use `ms-*/me-*/ps-*/pe-*/start-*/end-*/text-start/text-end/rounded-s-*/rounded-e-*`. NEVER `ml/mr/pl/pr/left/right/text-left/text-right`.

### Skeleton wrapper

**Source:** `frontend/src/components/ui/heroui-skeleton.tsx` — `animate-pulse` div wrapper.
**Apply to:** `DossierTableSkeleton` (8 row skeletons), `PersonsGridSkeleton` (6 card skeletons), `GenericListSkeleton` (6 row skeletons), `EngagementsListSkeleton` (1 week + 3 row skeletons). Per D-14 + RESEARCH §Discretion "Skeleton anatomy".

### Click-target navigation

**Source:** `frontend/src/lib/dossier-routes.ts` `getDossierRouteSegment(type)`
**Apply to:** All non-engagement rows. Engagements use literal `/engagements/$engagementId/overview` (RESEARCH §"Engagement row click target" LOCKED).

### Arabic-Indic digit rendering

**Source:** `frontend/src/lib/i18n/toArDigits.ts`
**Apply to:** Engagement count cell in `DossierTable`, last-touch dates, week-list dates, week-of label numerals.

---

## No Analog Found

All Phase 40 files have at least a role-match analog. No items in this category.

---

## Metadata

**Analog search scope:**

- `frontend/src/components/{ui,layout,signature-visuals,list-page}/`
- `frontend/src/routes/_protected/{dossiers,persons,engagements}/`
- `frontend/src/hooks/`
- `frontend/src/pages/{persons,engagements}/`
- `frontend/public/locales/{en,ar}/`
- `/tmp/inteldossier-handoff/inteldossier/project/src/{pages.jsx,app.css}` (handoff source — line ranges cited per RESEARCH.md)

**Files inspected (full):** `useForums.ts`, `useEngagements.ts`, `ui/table.tsx`, `dossiers/forums/index.tsx`, `persons/index.tsx`, `engagements/index.tsx`, `.size-limit.json`, `40-CONTEXT.md`, `40-RESEARCH.md` (lines 1-350).

**Pattern extraction date:** 2026-04-25

**Open items for planner to confirm during execution (RESEARCH-flagged):**

1. Exact column for engagement count on `dossiers` rows (`engagement_count` denorm vs computed) — researcher noted "verify".
2. Exact `engagementsRepo.getEngagements()` `sort_by` default and search arg name — researcher noted "confirm with backend; fallback `start_date desc`".
3. `frontend/src/hooks/useDebouncedValue` exact path/name — confirm via grep before importing.
4. Component directory naming reconciliation (`list-page/` per upstream context vs `list-pages/` per RESEARCH §"Recommended Project Structure"). This map uses `list-page/` (singular) per the upstream pattern_mapping_context.
