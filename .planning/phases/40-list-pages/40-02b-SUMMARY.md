---
phase: 40-list-pages
plan: 02b
subsystem: list-pages-data-adapters
tags: [hooks, supabase, tanstack-query, infinite-query, dossiers, engagements]
provides:
  - 'useCountries — Supabase adapter for type=country dossiers'
  - 'useOrganizations — Supabase adapter for type=organization dossiers'
  - 'useEngagementsInfinite — useInfiniteQuery wrapper around engagementsRepo.getEngagements'
  - 'Verified Engagement row contract (handed to Plan 09)'
requires:
  - '@/lib/supabase (PostgREST client)'
  - '@/domains/engagements (engagementsRepo namespace export)'
  - '@/types/engagement.types (EngagementListResponse, EngagementListItem)'
  - '@/types/dossier (Dossier interface)'
affects:
  - 'Plan 09 (engagements list page) — must read EngagementListItem flat shape, NOT the locked-in {id,title_en,title_ar,counterpart_id,...} shape from <interfaces>'
key-files:
  created:
    - 'frontend/src/hooks/useCountries.ts'
    - 'frontend/src/hooks/useOrganizations.ts'
    - 'frontend/src/hooks/useEngagementsInfinite.ts'
    - 'frontend/src/hooks/__tests__/useCountries.test.ts'
    - 'frontend/src/hooks/__tests__/useOrganizations.test.ts'
    - 'frontend/src/hooks/__tests__/useEngagementsInfinite.test.ts'
  modified: []
decisions:
  - 'Used `InfiniteData<EngagementListResponse, number>` as the explicit return wrapper for useEngagementsInfinite — TanStack Query v5 normalizes infinite results inside `InfiniteData`, not a bare `{ pages, pageParams }` object'
  - 'Adapted to repo reality on engagements: omitted `sort_by` and `sort_order` from the queryFn call because they do not exist on `EngagementSearchParams` (Plan PATTERNS asked for them but the repo signature does not accept them). Backend handles default ordering.'
  - 'Used `data.length < limit` (not `items.length < limit`) for getNextPageParam because EngagementListResponse exposes pages as `{ data, pagination }`, not `{ items }`.'
metrics:
  duration_minutes: 8
  tasks_completed: 1
  files_created: 6
  tests_added: 7
  tests_passing: 7
---

# Phase 40 Plan 02b: Supabase Adapter Hooks Summary

Three TanStack Query adapter hooks (`useCountries`, `useOrganizations`, `useEngagementsInfinite`) shipped with 7 passing vitest assertions; verified Engagement row contract diverges from the plan's locked `<interfaces>` and is recorded here for Plan 09 to consume.

## Wave 0 Engagement Row Verification (MUST-HAVE for Plan 09)

The plan locked an Engagement shape in `<interfaces>` (line 78-87):

```ts
type Engagement = {
  id: string
  title_en: string
  title_ar: string
  counterpart_id: string | null
  counterpart_name?: string
  status: 'pending' | 'confirmed' | 'cancelled'
  kind: 'travel' | 'meeting' | 'call' | 'other'
  start_date: string
}
```

**Reality (verbatim from `frontend/src/types/engagement.types.ts:407-423`):**

```ts
export interface EngagementListItem {
  id: string
  name_en: string         // ← NOT title_en
  name_ar: string         // ← NOT title_ar
  engagement_type: EngagementType        // ← richer enum than 'kind'
  engagement_category: EngagementCategory
  engagement_status: EngagementStatus    // ← richer enum than 'status'
  start_date: string
  end_date: string
  location_en?: string
  location_ar?: string
  is_virtual: boolean
  host_country_id?: string
  host_country_name_en?: string          // ← used as "counterpart" for hosted engagements
  host_country_name_ar?: string
  participant_count: number              // ← engagement_count flat-field already normalized here
}
```

### Divergences from locked `<interfaces>` shape

| Locked field                                          | Reality field                                                          | Notes                                                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `title_en` / `title_ar`                               | `name_en` / `name_ar`                                                  | Plan 09 row accessor must read `name_*`                                                     |
| `counterpart_id` (string \| null)                     | `host_country_id` (string \| undefined)                                | "Counterpart" semantics live on the hosted-country join                                     |
| `counterpart_name`                                    | `host_country_name_en` / `host_country_name_ar`                        | Bilingual; Plan 09 selects per locale                                                       |
| `status` (`'pending' \| 'confirmed' \| 'cancelled'`)  | `engagement_status` (planned/confirmed/in_progress/completed/postponed/cancelled) | Wider enum — EngagementsList primitive's 4 filter pills must map onto this widened enum |
| `kind` (`'travel' \| 'meeting' \| 'call' \| 'other'`) | `engagement_type` (10 values: bilateral_meeting/mission/delegation/...) | Plan 09 maps `engagement_type` → kind chip via lookup                                       |
| `start_date`                                          | `start_date` ✓                                                         | Match                                                                                       |

### Implementation note: `engagement_count` flat-field

Plan 02b must-have ("`engagement_count` flat-field normalization handled here") is **already satisfied by the repo**: `EngagementListItem.participant_count` is the flat-field equivalent — no normalization step is needed in the hook. Plan 02c verifier should not look for `engagement_count` (it's `participant_count` in this codebase).

## Decisions

1. **Return shape mirrors `useForums.ts:25-97`** — both `useCountries` and `useOrganizations` return `{ data, pagination: { page, limit, total, totalPages } }`. Total pages set to 0 when `count` is null/0, otherwise `Math.ceil(total/limit)`.
2. **Search input cap** — `search.slice(0, 200)` applied before interpolating into PostgREST `.or()` to mitigate T-40-02b-01 (tampering on search filter). Empty/missing search short-circuits the `.or()` chain entirely.
3. **`engagementsRepo` import** — barrel export at `frontend/src/domains/engagements/index.ts:73` is `export * as engagementsRepo from './repositories/engagements.repository'`, so `import { engagementsRepo } from '@/domains/engagements'` works directly. **No deep-import fallback needed.**
4. **Repo signature alignment** — `engagementsRepo.getEngagements(params: EngagementSearchParams)` does not accept `sort_by` or `sort_order`. The plan's PATTERNS reference asked for them; we omit them and rely on backend default ordering. Recorded as a decision so Plan 02c verifier does not flag the omission.
5. **`InfiniteData<T, TPageParam>` wrapper** — Plan-locked `<interfaces>` claimed the InfiniteQuery returns `{ data: { pages, pageParams }, ... }`, but TanStack v5 wraps it as `InfiniteData<EngagementListResponse, number>`. Used the canonical wrapper.

## Tasks

| Task | Name                                                              | Commit     | Files                                                                                                    | Tests |
| ---- | ----------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- | ----- |
| 1a   | useCountries Supabase adapter + test                              | `c1b9b677` | `frontend/src/hooks/useCountries.ts`, `frontend/src/hooks/__tests__/useCountries.test.ts`                 | 2/2   |
| 1b   | useOrganizations Supabase adapter + test                          | `d4debff3` | `frontend/src/hooks/useOrganizations.ts`, `frontend/src/hooks/__tests__/useOrganizations.test.ts`         | 2/2   |
| 1c   | useEngagementsInfinite useInfiniteQuery + test                    | `ed454dcd` | `frontend/src/hooks/useEngagementsInfinite.ts`, `frontend/src/hooks/__tests__/useEngagementsInfinite.test.ts` | 3/3   |

## Test Coverage

**Combined run (3 files):** `7 passed (7)` in 662ms.

- **useCountries**:
  - queries `dossiers` with `type='country'`, applies `range(20, 39)` for page=2/limit=20, totalPages math = ceil(47/20) = 3
  - propagates Supabase `error.message` through query (`'boom'`)
- **useOrganizations**:
  - queries `dossiers` with `type='organization'`, range/totalPages math identical
  - propagates Supabase error
- **useEngagementsInfinite**:
  - first call passes `{ page: 1, limit: 20, search: undefined }` to `engagementsRepo.getEngagements`
  - full first page (20) → `hasNextPage=true`; short second page (5) → `hasNextPage=false`
  - search term forwarded; `result.current.data?.pages.length` reaches 2 after `fetchNextPage()`

## Acceptance Criteria

| Criterion                                                                       | Status |
| ------------------------------------------------------------------------------- | ------ |
| 3 hook source files exist and export named hooks                                | ✓      |
| 3 test files pass                                                               | ✓ 7/7  |
| `grep "from '@/lib/supabase'" useCountries.ts`                                  | 1 ✓    |
| `grep "eq('type', 'country')" useCountries.ts`                                  | 1 ✓    |
| `grep "eq('type', 'organization')" useOrganizations.ts`                         | 1 ✓    |
| `grep "useInfiniteQuery\|engagementsRepo" useEngagementsInfinite.ts`            | 5 (≥2) ✓ |
| `grep "getNextPageParam" useEngagementsInfinite.ts`                             | 2 (≥1) ✓ |
| `grep ": any\|as any\|<any>"` across 3 source files                             | 0 ✓    |
| Engagement row shape recorded in SUMMARY                                        | ✓      |
| Project tsc on plan files (`tsc --noEmit -p tsconfig.app.json`)                 | clean ✓ |

## Threat Mitigations Applied

- **T-40-02b-01 (Tampering — search filter):** `search.slice(0, 200)` enforced in both `useCountries` and `useOrganizations` before `.or()` interpolation. Empty/missing search short-circuits the `.or()` clause so an empty filter is never built.
- **T-40-02b-02 (Spoofing — engagement detail nav):** disposition `accept` per plan; route-level RLS handled downstream.

## Deviations from Plan

### Auto-fixed Issues (Rule 1 — Plan / reality contract mismatches)

**1. [Rule 1 — Bug] Engagement row shape divergence**

- **Found during:** Step A (Wave 0 type verification)
- **Issue:** Plan `<interfaces>` locked an Engagement shape with `title_en/title_ar/counterpart_id/status/kind` that does NOT exist in `frontend/src/types/engagement.types.ts`.
- **Fix:** Built hooks against the actual `EngagementListResponse` (`{ data: EngagementListItem[], pagination }`) shape and documented the per-field mapping above so Plan 09 has a verified contract.
- **Files modified:** `frontend/src/hooks/useEngagementsInfinite.ts` (uses repo's actual return type)

**2. [Rule 1 — Bug] Missing `sort_by`/`sort_order` on EngagementSearchParams**

- **Found during:** Step D (writing useEngagementsInfinite)
- **Issue:** PATTERNS.md called for `engagementsRepo.getEngagements({ page, limit, sort_by: 'start_date', sort_order: 'desc', search })`, but `EngagementSearchParams` in `engagement.types.ts:392-402` has no such fields.
- **Fix:** Pass only `{ page, limit, search }`; rely on backend default ordering.
- **Files modified:** `frontend/src/hooks/useEngagementsInfinite.ts` and its test

**3. [Rule 1 — Bug] InfiniteQuery return type wrapper**

- **Found during:** typecheck after initial write
- **Issue:** Initial explicit return type `UseInfiniteQueryResult<{ pages, pageParams }, Error>` did not match TanStack v5's actual `InfiniteData<TData, TPageParam>` wrapper.
- **Fix:** Used `UseInfiniteQueryResult<InfiniteData<EngagementListResponse, number>, Error>` with explicit 5-generic `useInfiniteQuery<...>` to lock pageParam to `number`.
- **Files modified:** `frontend/src/hooks/useEngagementsInfinite.ts`

### Architectural Changes
None.

### Auth Gates
None encountered.

## Known Stubs
None — all 3 hooks query real backends (Supabase + REST). Tests exercise the full query lifecycle.

## Threat Flags
None — no new network endpoints, auth paths, or schema introduced beyond what the plan's threat model already covers.

## Self-Check: PASSED

- `frontend/src/hooks/useCountries.ts` — FOUND
- `frontend/src/hooks/useOrganizations.ts` — FOUND
- `frontend/src/hooks/useEngagementsInfinite.ts` — FOUND
- `frontend/src/hooks/__tests__/useCountries.test.ts` — FOUND
- `frontend/src/hooks/__tests__/useOrganizations.test.ts` — FOUND
- `frontend/src/hooks/__tests__/useEngagementsInfinite.test.ts` — FOUND
- Commit `c1b9b677` (useCountries) — FOUND in `git log`
- Commit `d4debff3` (useOrganizations) — FOUND in `git log`
- Commit `ed454dcd` (useEngagementsInfinite) — FOUND in `git log`
