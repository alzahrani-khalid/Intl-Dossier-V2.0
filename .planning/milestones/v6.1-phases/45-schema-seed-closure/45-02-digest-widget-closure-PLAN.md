---
phase: 45-schema-seed-closure
plan: 02
type: execute
wave: 2
depends_on: [45-01]
files_modified:
  - frontend/src/hooks/useIntelligenceDigest.ts
  - frontend/src/hooks/__tests__/useIntelligenceDigest.test.ts
  - frontend/src/pages/Dashboard/widgets/Digest.tsx
  - frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx
  - frontend/src/i18n/en/dashboard-widgets.json
  - frontend/src/i18n/ar/dashboard-widgets.json
autonomous: true
requirements: [DATA-02]
must_haves:
  truths:
    - 'D-05: Digest must use a typed useIntelligenceDigest hook and the rendered source field must come from source_publication.'
    - 'D-05: Digest render path has zero dependency on actor_name and useActivityFeed.'
    - 'UI-SPEC: Preserve existing Digest card structure, WidgetSkeleton, GlobeSpinner overlay, and ghost refresh button.'
    - 'UI-SPEC: Refresh action copy is Refresh digest / تحديث الموجز, not a generic single-word Refresh label.'
  artifacts:
    - path: 'frontend/src/hooks/useIntelligenceDigest.ts'
      provides: 'typed dashboard digest read hook'
    - path: 'frontend/src/pages/Dashboard/widgets/Digest.tsx'
      provides: 'publication-source Digest widget'
  key_links:
    - from: 'Digest.tsx'
      to: 'useIntelligenceDigest'
      via: 'direct hook import'
    - from: 'Digest source line'
      to: 'intelligence_digest.source_publication'
      via: 'hook row mapping'
---

# Plan 45-02: Digest Widget Closure

**Phase:** 45 (schema-seed-closure)
**Wave:** 2
**Depends on:** 45-01
**Type:** implementation
**TDD:** true for hook/adapter behavior
**Estimated effort:** M (3-5 h)

## Goal

Replace the Phase 38 Digest source compromise with a typed
`useIntelligenceDigest` hook and render publication names from
`source_publication`. Preserve the existing widget layout and loading/refetch
behavior.

<execution_context>
@$HOME/.codex/get-shit-done/workflows/execute-plan.md
@$HOME/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/45-schema-seed-closure/45-CONTEXT.md
@.planning/phases/45-schema-seed-closure/45-RESEARCH.md
@.planning/phases/45-schema-seed-closure/45-UI-SPEC.md
@.planning/phases/45-schema-seed-closure/45-PATTERNS.md
@frontend/src/pages/Dashboard/widgets/Digest.tsx
@frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx
@frontend/src/hooks/useActivityFeed.ts
@frontend/src/lib/supabase.ts
@frontend/src/i18n/en/dashboard-widgets.json
@frontend/src/i18n/ar/dashboard-widgets.json
</context>

<threat_model>
T-45-04 internal username leakage: mitigated by removing `useActivityFeed`,
`ActivityItem`, and `actor_name` from the Digest render path.
T-45-05 tenant bypass: mitigated by using direct Supabase reads against
`intelligence_digest`; RLS from Plan 45-01 owns tenant scoping.
Block on high severity: if any Digest render-path file still references
`actor_name` or `useActivityFeed`, stop.
</threat_model>

## Files to create / modify

| Path                                                             | Action | Notes                                                    |
| ---------------------------------------------------------------- | ------ | -------------------------------------------------------- |
| `frontend/src/hooks/useIntelligenceDigest.ts`                    | create | Typed hook that reads `intelligence_digest`              |
| `frontend/src/hooks/__tests__/useIntelligenceDigest.test.ts`     | create | Hook query and mapping tests with mocked Supabase client |
| `frontend/src/pages/Dashboard/widgets/Digest.tsx`                | modify | Use new hook; render `source_publication`                |
| `frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx` | modify | Mock new hook and assert publication source safety       |
| `frontend/src/i18n/en/dashboard-widgets.json`                    | modify | Digest copy from UI-SPEC                                 |
| `frontend/src/i18n/ar/dashboard-widgets.json`                    | modify | Arabic Digest copy from UI-SPEC                          |

<tasks>
<task id="45-02-01" type="tdd">
<name>Add typed useIntelligenceDigest hook</name>
<read_first>
- frontend/src/hooks/useVipVisits.ts
- frontend/src/domains/operations-hub/hooks/useUpcomingEvents.ts
- frontend/src/domains/operations-hub/repositories/operations-hub.repository.ts
- frontend/src/lib/supabase.ts
- .planning/phases/45-schema-seed-closure/45-PATTERNS.md
</read_first>
<files>
- create: frontend/src/hooks/useIntelligenceDigest.ts
- create: frontend/src/hooks/__tests__/useIntelligenceDigest.test.ts
</files>
<action>
Create `frontend/src/hooks/useIntelligenceDigest.ts` with these exported
types and hook:

```ts
export interface IntelligenceDigestRow {
  id: string
  headline_en: string
  headline_ar: string | null
  summary_en: string | null
  summary_ar: string | null
  source_publication: string
  occurred_at: string
  dossier_id: string | null
  created_at: string
}

export function useIntelligenceDigest(
  limit: number = 6,
): ReturnType<typeof useQuery<IntelligenceDigestRow[], Error>>
```

The hook must:

- import `useQuery` from `@tanstack/react-query`
- import `supabase` from `@/lib/supabase`
- use query key `['dashboard', 'intelligence-digest', limit]`
- call `supabase.from('intelligence_digest').select('id, headline_en, headline_ar, summary_en, summary_ar, source_publication, occurred_at, dossier_id, created_at').order('occurred_at', { ascending: false }).limit(limit)`
- throw `new Error(\`Failed to fetch intelligence digest: ${error.message}\`)` on Supabase error
- return `(data as IntelligenceDigestRow[]) ?? []`
- set `staleTime: 5 * 60_000` and `gcTime: 10 * 60_000`

Create `frontend/src/hooks/__tests__/useIntelligenceDigest.test.ts` that mocks
`@/lib/supabase` and verifies:

- the hook queries `intelligence_digest`
- the select string includes `source_publication`
- the order call uses `occurred_at` descending
- the limit call receives `6` by default
- a Supabase error surfaces an Error message beginning `Failed to fetch intelligence digest:`
  </action>
  <verify>
  pnpm -C frontend exec vitest run src/hooks/**tests**/useIntelligenceDigest.test.ts
  rg "export function useIntelligenceDigest" frontend/src/hooks/useIntelligenceDigest.ts
  rg "source_publication" frontend/src/hooks/useIntelligenceDigest.ts frontend/src/hooks/**tests**/useIntelligenceDigest.test.ts
  rg "intelligence_digest" frontend/src/hooks/useIntelligenceDigest.ts frontend/src/hooks/**tests**/useIntelligenceDigest.test.ts
  </verify>
  <acceptance_criteria>
- `frontend/src/hooks/useIntelligenceDigest.ts` contains `export interface IntelligenceDigestRow`.
- `frontend/src/hooks/useIntelligenceDigest.ts` contains `export function useIntelligenceDigest`.
- `frontend/src/hooks/useIntelligenceDigest.ts` contains `.from('intelligence_digest')`.
- `frontend/src/hooks/useIntelligenceDigest.ts` contains `source_publication`.
- `frontend/src/hooks/useIntelligenceDigest.ts` contains `order('occurred_at', { ascending: false })`.
- `pnpm -C frontend exec vitest run src/hooks/__tests__/useIntelligenceDigest.test.ts` exits 0.
  </acceptance_criteria>
  </task>

<task id="45-02-02" type="execute">
<name>Rewire Digest widget and copy</name>
<read_first>
- frontend/src/pages/Dashboard/widgets/Digest.tsx
- frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx
- frontend/src/i18n/en/dashboard-widgets.json
- frontend/src/i18n/ar/dashboard-widgets.json
- .planning/phases/45-schema-seed-closure/45-UI-SPEC.md
</read_first>
<files>
- modify: frontend/src/pages/Dashboard/widgets/Digest.tsx
- modify: frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx
- modify: frontend/src/i18n/en/dashboard-widgets.json
- modify: frontend/src/i18n/ar/dashboard-widgets.json
</files>
<action>
In `Digest.tsx`:
- remove `useActivityFeed` and `ActivityItem` imports
- import `useIntelligenceDigest` and `type IntelligenceDigestRow` from `@/hooks/useIntelligenceDigest`
- replace `mapActivityToRow` with `mapDigestToRow(row: IntelligenceDigestRow, lang: string, tag: string): DigestRow`
- map `headline` from `headline_ar` when `lang === 'ar'` and non-empty, otherwise `headline_en`
- map `source` from `row.source_publication`
- map `timestamp` from `row.occurred_at`
- set `tag` from `t('digest.tag')`
- call `const { data, isLoading, error, refetch } = useIntelligenceDigest()`
- keep the existing `WidgetSkeleton`, `GlobeSpinner`, `.digest-overlay`, `Button`, and `.digest-*` class structure
- render empty state as two lines:
  - heading: `t('digest.empty.heading')`
  - body: `t('digest.empty.body')`
- render error state with `t('digest.error')`
- keep refresh `aria-label={t('digest.refresh')}`

In `frontend/src/i18n/en/dashboard-widgets.json`, update:

```json
"digest": {
  "title": "Intelligence Digest",
  "tag": "Source",
  "refresh": "Refresh digest",
  "empty": {
    "heading": "Digest is ready for seeded publications.",
    "body": "Apply the dashboard demo seed, then refresh the digest."
  },
  "error": "Digest could not load. Check the staging seed and try again."
}
```

In `frontend/src/i18n/ar/dashboard-widgets.json`, update the matching keys:

```json
"digest": {
  "title": "ملخص الاستخبارات",
  "tag": "مصدر",
  "refresh": "تحديث الموجز",
  "empty": {
    "heading": "الموجز جاهز للمنشورات المزروعة.",
    "body": "طبّق بيانات لوحة التحكم التجريبية، ثم حدّث الموجز."
  },
  "error": "تعذر تحميل الموجز. تحقق من بيانات الاختبار ثم أعد المحاولة."
}
```

In `Digest.test.tsx`:

- mock `@/hooks/useIntelligenceDigest`, not `@/hooks/useActivityFeed`
- use mock rows with `source_publication: 'Reuters'` and `source_publication: 'Al Sharq'`
- assert rendered rows show `Reuters` and `Al Sharq`
- assert empty state keys `digest.empty.heading` and `digest.empty.body`
- assert error key `digest.error`
- add a source guard test using `readFileSync` on `Digest.tsx` and `useIntelligenceDigest.ts` that expects no `actor_name` and no `useActivityFeed`
  </action>
  <verify>
  pnpm -C frontend exec vitest run src/pages/Dashboard/widgets/**tests**/Digest.test.tsx
  pnpm -C frontend exec vitest run src/hooks/**tests**/useIntelligenceDigest.test.ts src/pages/Dashboard/widgets/**tests**/Digest.test.tsx
  rg "useIntelligenceDigest" frontend/src/pages/Dashboard/widgets/Digest.tsx frontend/src/pages/Dashboard/widgets/**tests**/Digest.test.tsx
  rg "source_publication" frontend/src/pages/Dashboard/widgets/Digest.tsx frontend/src/pages/Dashboard/widgets/**tests**/Digest.test.tsx frontend/src/hooks/useIntelligenceDigest.ts
  ! rg "actor_name|useActivityFeed" frontend/src/pages/Dashboard/widgets/Digest.tsx frontend/src/hooks/useIntelligenceDigest.ts
  </verify>
  <acceptance_criteria>
- `frontend/src/pages/Dashboard/widgets/Digest.tsx` imports `useIntelligenceDigest`.
- `frontend/src/pages/Dashboard/widgets/Digest.tsx` contains `source_publication`.
- `frontend/src/pages/Dashboard/widgets/Digest.tsx` contains `digest.empty.heading`.
- `frontend/src/pages/Dashboard/widgets/Digest.tsx` contains `digest.error`.
- `frontend/src/i18n/en/dashboard-widgets.json` contains `Refresh digest`.
- `frontend/src/i18n/ar/dashboard-widgets.json` contains `تحديث الموجز`.
- `rg "actor_name|useActivityFeed" frontend/src/pages/Dashboard/widgets/Digest.tsx frontend/src/hooks/useIntelligenceDigest.ts` returns no matches.
- `pnpm -C frontend exec vitest run src/hooks/__tests__/useIntelligenceDigest.test.ts src/pages/Dashboard/widgets/__tests__/Digest.test.tsx` exits 0.
  </acceptance_criteria>
  </task>
  </tasks>

## Verification

```bash
pnpm -C frontend exec vitest run src/hooks/__tests__/useIntelligenceDigest.test.ts src/pages/Dashboard/widgets/__tests__/Digest.test.tsx
rg "useIntelligenceDigest" frontend/src/pages/Dashboard/widgets/Digest.tsx
rg "source_publication" frontend/src/pages/Dashboard/widgets/Digest.tsx frontend/src/hooks/useIntelligenceDigest.ts
! rg "actor_name|useActivityFeed" frontend/src/pages/Dashboard/widgets/Digest.tsx frontend/src/hooks/useIntelligenceDigest.ts
```

## Requirements satisfied

- DATA-02 full: Digest reads `intelligence_digest` through a typed hook and
  renders publication source names instead of internal actor names.
