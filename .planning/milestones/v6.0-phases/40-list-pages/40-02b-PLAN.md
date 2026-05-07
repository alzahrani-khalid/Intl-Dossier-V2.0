---
phase: 40-list-pages
plan: 02b
type: execute
wave: 0
depends_on: [40-02a]
files_modified:
  - frontend/src/hooks/useCountries.ts
  - frontend/src/hooks/useOrganizations.ts
  - frontend/src/hooks/useEngagementsInfinite.ts
  - frontend/src/hooks/__tests__/useCountries.test.ts
  - frontend/src/hooks/__tests__/useOrganizations.test.ts
  - frontend/src/hooks/__tests__/useEngagementsInfinite.test.ts
autonomous: true
requirements: [LIST-01, LIST-04]
must_haves:
  truths:
    - 'useCountries / useOrganizations Supabase adapter return shape `{ data, pagination }` mirrors useForums.ts:25-97'
    - 'useEngagementsInfinite uses useInfiniteQuery with offset getNextPageParam returning undefined when items.length < limit'
    - 'Engagement row shape verified against frontend/src/types/engagement.types.ts in Wave 0; divergences recorded in SUMMARY for Plan 09 to consume'
  implementation_notes:
    - 'engagement_count flat-field normalization handled here (regardless of which Plan 02c branch resolves)'
  artifacts:
    - path: 'frontend/src/hooks/useCountries.ts'
      provides: "Supabase adapter for type='country' dossiers"
      exports: ['useCountries']
    - path: 'frontend/src/hooks/useOrganizations.ts'
      provides: "Supabase adapter for type='organization' dossiers"
      exports: ['useOrganizations']
    - path: 'frontend/src/hooks/useEngagementsInfinite.ts'
      provides: 'useInfiniteQuery wrapper around engagementsRepo.getEngagements'
      exports: ['useEngagementsInfinite']
  key_links:
    - from: 'useEngagementsInfinite'
      to: '@/domains/engagements (engagementsRepo)'
      via: 'ES import'
      pattern: "engagementsRepo.*from '@/domains/engagements'"
---

<objective>
Build the 3 adapter hooks (`useCountries`, `useOrganizations`, `useEngagementsInfinite`) consumed by Wave 1 page bodies + 3 vitest fixtures. Wave 0 verification of `frontend/src/types/engagement.types.ts` shape happens here so the SUMMARY can hand a verified Engagement row contract to Plan 09.

Purpose: Decouple data-fetching from primitives (Plan 02a) and from CSS/verification scaffolding (Plan 02c).
Output: 3 hook files + 3 test files + verified Engagement row shape recorded in SUMMARY.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/40-list-pages/40-CONTEXT.md
@.planning/phases/40-list-pages/40-RESEARCH.md
@.planning/phases/40-list-pages/40-PATTERNS.md
@frontend/src/hooks/useForums.ts
@frontend/src/types/engagement.types.ts

<interfaces>
// useCountries / useOrganizations return shape (mirrors useForums.ts)
{
  data: Dossier[],
  pagination: { page: number, limit: number, total: number | null, totalPages: number }
}

// useEngagementsInfinite return shape (TanStack Query InfiniteQueryResult)
{
data: { pages: Array<{ items: Engagement[] }>, pageParams: number[] },
hasNextPage: boolean,
isFetchingNextPage: boolean,
fetchNextPage: () => Promise<void>,
...
}

// Engagement row shape (LOCKED — verify in Wave 0 task 1):
type Engagement = {
id: string
title_en: string
title_ar: string
counterpart_id: string | null
counterpart_name?: string // joined; may be optional
status: 'pending' | 'confirmed' | 'cancelled'
kind: 'travel' | 'meeting' | 'call' | 'other'
start_date: string // ISO 8601
}
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Build 3 adapter hooks + verify Engagement type shape + 3 vitest fixtures</name>
  <files>frontend/src/hooks/useCountries.ts, frontend/src/hooks/useOrganizations.ts, frontend/src/hooks/useEngagementsInfinite.ts, frontend/src/hooks/__tests__/useCountries.test.ts, frontend/src/hooks/__tests__/useOrganizations.test.ts, frontend/src/hooks/__tests__/useEngagementsInfinite.test.ts</files>
  <read_first>
    - frontend/src/hooks/useForums.ts (analog: lines 25-97 — verbatim port pattern)
    - frontend/src/types/engagement.types.ts (verify Engagement shape — lock in SUMMARY)
    - frontend/src/domains/engagements/index.ts (locate engagementsRepo export)
    - frontend/src/domains/engagements/repositories/engagements.repository.ts (verify getEngagements signature `{ page, limit, sort_by, sort_order, search? }`)
    - .planning/phases/40-list-pages/40-PATTERNS.md §"useCountries.ts" + §"useEngagementsInfinite.ts" (lines 432-535)
  </read_first>
  <behavior>
    - useCountries({ search?, status?, page=1, limit=20 }): TanStack useQuery key `['countries', filters]`, queries Supabase `from('dossiers').select('*', { count: 'exact' }).eq('type', 'country').neq('status', 'deleted')`; search via `.or('name_en.ilike.%${search}%,name_ar.ilike.%${search}%')`; orders by `updated_at desc`; ranges `(offset, offset+limit-1)`. Returns `{ data, pagination: { page, limit, total, totalPages } }`. staleTime 5 min. Cap search input at 200 chars (`search.slice(0,200)`).
    - useOrganizations: identical with `eq('type', 'organization')`.
    - useEngagementsInfinite({ search?, limit=20 }): useInfiniteQuery key `['engagements-infinite', params]`, initialPageParam 1, queryFn calls `engagementsRepo.getEngagements({ page: pageParam, limit, sort_by: 'start_date', sort_order: 'desc', search })`, getNextPageParam returns `items.length < limit ? undefined : allPages.length + 1`, staleTime 30s.
    - Tests: each hook test mocks `@/lib/supabase` (or `engagementsRepo`), wraps in QueryClientProvider, asserts queryKey shape, asserts pagination math (page=2, limit=20 → range(20,39)), asserts getNextPageParam returns undefined when items.length < limit.
  </behavior>
  <action>
**Step A — Verify Engagement type shape (Wave 0):**

Run `cat frontend/src/types/engagement.types.ts` and compare against the locked shape in `<interfaces>`. Record the verified shape (or any divergence) in the Plan 02b SUMMARY so Plan 09 can adapt accessor calls if needed. If shape diverges, STILL ship the hooks — Plan 09 reads the SUMMARY note and adapts row accessors.

**Step B — `useCountries.ts`**: Verbatim from PATTERNS.md lines 444-484. Imports:

```ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
```

Throw `new Error(error.message)` on Supabase error. Strict boolean expressions.

**Step C — `useOrganizations.ts`**: Identical to useCountries with `'organization'` swap.

**Step D — `useEngagementsInfinite.ts`**: Verbatim from PATTERNS.md lines 508-533. Imports:

```ts
import { useInfiniteQuery } from '@tanstack/react-query'
import { engagementsRepo } from '@/domains/engagements'
```

If `engagementsRepo` is not exported from barrel, fall back to deep import `@/domains/engagements/repositories/engagements.repository`.

**Step E — Tests** (3 files in `frontend/src/hooks/__tests__/`):

1. **useCountries.test.ts**: Mock `@/lib/supabase` to return chained mock resolving to `{ data: [{id:'a',type:'country'}], error: null, count: 1 }`. Wrap in `QueryClientProvider`. Call `useCountries({ page: 2, limit: 20 })`. Assert: `mockRange` called with (20, 39); query key starts with `'countries'`; `pagination.totalPages` = `Math.ceil(count/limit)`. Second test with `error: { message: 'boom' }` → assert query throws.
2. **useOrganizations.test.ts**: Same shape with `'organization'` swap.
3. **useEngagementsInfinite.test.ts**: Mock `engagementsRepo.getEngagements` → `{ items: Array(20).fill({id:'e'}) }` for page 1, `{ items: Array(5).fill({id:'e'}) }` for page 2. Assert: getNextPageParam after page 1 returns 2; after page 2 returns undefined. Verify queryFn called with `{ page: 1, limit: 20, sort_by: 'start_date', sort_order: 'desc', search: undefined }`.

NO `any`. Explicit return types.
</action>
<verify>
<automated>cd frontend && pnpm vitest run src/hooks/**tests**/useCountries.test.ts src/hooks/**tests**/useOrganizations.test.ts src/hooks/**tests**/useEngagementsInfinite.test.ts --reporter=dot</automated>
</verify>
<acceptance_criteria> - All 3 hook source files exist and export the named hook - All 3 test files pass - `grep -n "from '@/lib/supabase'" frontend/src/hooks/useCountries.ts` returns 1 match - `grep -n "eq('type', 'country')" frontend/src/hooks/useCountries.ts` returns 1 match - `grep -n "eq('type', 'organization')" frontend/src/hooks/useOrganizations.ts` returns 1 match - `grep -n "useInfiniteQuery\\|engagementsRepo" frontend/src/hooks/useEngagementsInfinite.ts` returns at least 2 matches - `grep -n "getNextPageParam" frontend/src/hooks/useEngagementsInfinite.ts` returns 1 match - `grep -rn ": any\\|as any\\|<any>" frontend/src/hooks/useCountries.ts frontend/src/hooks/useOrganizations.ts frontend/src/hooks/useEngagementsInfinite.ts` returns 0 matches - SUMMARY records the verified Engagement row shape (or divergence)
</acceptance_criteria>
<done>3 adapter hooks ship; 3 vitest files green; pagination math verified; Engagement shape verified and recorded for Plan 09.</done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                             | Description                                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Browser ↔ Supabase                   | useCountries / useOrganizations issue authenticated PostgREST calls; visibility enforced by RLS on `dossiers`. |
| Browser ↔ Backend REST               | useEngagementsInfinite issues authenticated REST to `/engagements`; backend re-enforces RLS.                   |
| User input → Supabase `.or()` filter | Search string interpolated into PostgREST filter expression.                                                   |

## STRIDE Threat Register

| Threat ID   | Category  | Component                                                     | Disposition | Mitigation Plan                                                                                                                                                                                     |
| ----------- | --------- | ------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-40-02b-01 | Tampering | useCountries / useOrganizations search filter                 | mitigate    | Search string passed as PostgREST `.or('name_en.ilike.%${search}%,...')` is parameterized by Supabase JS; client escapes special operator chars. Hard length cap `search.slice(0, 200)` in adapter. |
| T-40-02b-02 | Spoofing  | Click-target navigation `/engagements/$engagementId/overview` | accept      | Engagement detail route enforces RLS independently.                                                                                                                                                 |

</threat_model>

<verification>
- 3 vitest files green
- Engagement row shape verified and recorded in SUMMARY
- Pagination math correct
</verification>

<success_criteria>

- 3 adapter hooks ship
- Plan 09 receives verified Engagement contract via SUMMARY
  </success_criteria>

<output>
After completion, create `.planning/phases/40-list-pages/40-02b-SUMMARY.md`. MUST record: (a) verified Engagement row shape (verbatim copy from `engagement.types.ts`), (b) any divergence from the locked `<interfaces>` shape, (c) whether `engagementsRepo` deep-import fallback was needed.
</output>
