---
phase: 40-list-pages
plan: 02a
type: execute
wave: 0
depends_on: []
files_modified:
  - frontend/src/components/list-page/ListPageShell.tsx
  - frontend/src/components/list-page/ListPageShell.skeleton.tsx
  - frontend/src/components/list-page/GenericListPage.tsx
  - frontend/src/components/list-page/DossierTable.tsx
  - frontend/src/components/list-page/PersonsGrid.tsx
  - frontend/src/components/list-page/EngagementsList.tsx
  - frontend/src/components/list-page/FilterPill.tsx
  - frontend/src/components/list-page/ToolbarSearch.tsx
  - frontend/src/components/list-page/sensitivity.ts
  - frontend/src/components/list-page/index.ts
  - frontend/src/components/list-page/__tests__/ListPageShell.test.tsx
  - frontend/src/components/list-page/__tests__/GenericListPage.test.tsx
  - frontend/src/components/list-page/__tests__/DossierTable.test.tsx
  - frontend/src/components/list-page/__tests__/PersonsGrid.test.tsx
  - frontend/src/components/list-page/__tests__/EngagementsList.test.tsx
autonomous: true
requirements: [LIST-01, LIST-02, LIST-03, LIST-04]
must_haves:
  truths:
    - 'ListPageShell renders title, optional subtitle, optional toolbar, and switches between skeleton/empty/children based on isLoading/isEmpty'
    - 'GenericListPage renders rows with grid template `auto 1fr auto auto`, padding 14px, ≥44px row height, status chip slot, RTL chevron via .icon-flip'
    - 'DossierTable renders header (Name/Engagements/LastTouch/Sensitivity) + DossierGlyph + EN/AR names + numeric sensitivity → chip class via SENSITIVITY_CHIP map; mobile (<768px) collapses to card list'
    - 'PersonsGrid renders 1/2/3-column responsive grid with 44px circular avatar (bg-accent-soft / text-accent-ink), VIP chip when is_vip true, role + organization meta'
    - 'EngagementsList renders search input + 4 filter pills (.btn / .btn.btn-primary on active) + week-list + load-more row with GlobeSpinner during isFetchingNextPage'
    - 'Sensitivity numeric→label mapping: 1→public(chip-info), 2→internal(chip-default), 3→restricted(chip-warn), 4→confidential(chip-danger) per RESEARCH lock'
  implementation_notes:
    - 'Barrel re-exports (index.ts) live in this plan'
    - 'Sensitivity helper module exposes SENSITIVITY_CHIP, sensitivityChipClass, sensitivityLabelKey'
  artifacts:
    - path: 'frontend/src/components/list-page/index.ts'
      provides: 'Barrel re-exports for all primitives + skeletons + sensitivity helper'
      exports:
        [
          'ListPageShell',
          'GenericListPage',
          'DossierTable',
          'PersonsGrid',
          'EngagementsList',
          'FilterPill',
          'ToolbarSearch',
          'SENSITIVITY_CHIP',
        ]
    - path: 'frontend/src/components/list-page/sensitivity.ts'
      provides: 'Sensitivity numeric→chip class + label key map per RESEARCH lock'
      contains: 'SENSITIVITY_CHIP'
  key_links:
    - from: 'DossierTable'
      to: '@/components/signature-visuals (DossierGlyph)'
      via: 'ES import'
      pattern: "from '@/components/signature-visuals'"
    - from: 'EngagementsList load-more'
      to: '@/components/signature-visuals (GlobeSpinner)'
      via: 'ES import'
      pattern: "GlobeSpinner.*from '@/components/signature-visuals'"
    - from: 'EngagementsList week-grouping'
      to: 'frontend/src/lib/date/getISOWeek.ts (or extracted from frontend/src/components/dashboard/WeekListMobile.tsx)'
      via: 'ES import'
      pattern: 'getISOWeek'
---

<objective>
Build ALL 8 Phase 40 list-page primitives (`ListPageShell`, `GenericListPage`, `DossierTable`, `PersonsGrid`, `EngagementsList`, `FilterPill`, `ToolbarSearch`, skeleton bundle), the sensitivity helper, the barrel re-export, and 5 vitest fixtures. SCOPE: primitives + tests only. Adapter hooks live in Plan 02b. CSS port + size-limit + Open-Questions verification live in Plan 02c.

Purpose: Eliminate scavenger-hunt risk in Wave 1 — page bodies become mechanical compositions of these primitives.
Output: Complete `frontend/src/components/list-page/` directory + sensitivity helper + 5 test files.
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
@.planning/phases/40-list-pages/40-VALIDATION.md
@frontend/src/hooks/useForums.ts
@frontend/src/components/ui/table.tsx
@frontend/src/components/signature-visuals/index.ts
@frontend/src/hooks/useDirection.ts
@frontend/src/lib/i18n/toArDigits.ts
@frontend/src/components/dashboard/WeekListMobile.tsx

<interfaces>
<!-- ALL contracts the Wave 1 page bodies will import. Build against these signatures verbatim. -->

// frontend/src/components/list-page/index.ts (barrel)
export { ListPageShell } from './ListPageShell'
export { GenericListPage, type GenericListPageItem } from './GenericListPage'
export { DossierTable, type DossierTableRow } from './DossierTable'
export { PersonsGrid, type PersonCard } from './PersonsGrid'
export { EngagementsList } from './EngagementsList'
export { FilterPill } from './FilterPill'
export { ToolbarSearch } from './ToolbarSearch'
export {
DossierTableSkeleton,
GenericListSkeleton,
PersonsGridSkeleton,
EngagementsListSkeleton,
} from './ListPageShell.skeleton'
export { SENSITIVITY_CHIP, sensitivityChipClass, sensitivityLabelKey } from './sensitivity'

// ListPageShell props
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

// GenericListPage props
type GenericListPageItem = {
id: string
glyphType: 'forum' | 'topic' | 'working_group'
nameEn: string
nameAr?: string
meta?: React.ReactNode
status?: { label: string; tone: 'accent' | 'warn' | 'danger' | 'ok' | 'info' }
href: string
}

// DossierTable props
type DossierTableRow = {
id: string
type: 'country' | 'organization'
name_en: string
name_ar: string
flag_iso?: string
engagement_count: number
updated_at: string
sensitivity_level: 1 | 2 | 3 | 4
}

// PersonsGrid props
type PersonCard = {
id: string
name_en: string
name_ar?: string
role?: string
organization?: string
is_vip?: boolean
flag_iso?: string
}

// Engagement row shape (consumed by EngagementsList) — LOCKED via Plan 02b grep-verify of frontend/src/types/engagement.types.ts
// If actual shape differs, Plan 02b records the divergence in its SUMMARY and EngagementsList accessors must adapt.
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

// Sensitivity LOCK (RESEARCH §"Sensitivity chip + last-touch column mapping")
const SENSITIVITY_CHIP: Record<1 | 2 | 3 | 4, { tone: string; key: string }> = {
1: { tone: 'chip-info', key: 'sensitivity.public' }, // 1 → public → chip-info
2: { tone: 'chip-default', key: 'sensitivity.internal' }, // 2 → internal → chip default
3: { tone: 'chip-warn', key: 'sensitivity.restricted' }, // 3 → restricted → chip-warn (per RESEARCH lock)
4: { tone: 'chip-danger', key: 'sensitivity.confidential' }, // 4 → confidential → chip-danger (per RESEARCH lock)
}
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Build all 7 list-page primitives + skeletons + sensitivity helper + barrel + 5 tests</name>
  <files>frontend/src/components/list-page/ListPageShell.tsx, frontend/src/components/list-page/ListPageShell.skeleton.tsx, frontend/src/components/list-page/GenericListPage.tsx, frontend/src/components/list-page/DossierTable.tsx, frontend/src/components/list-page/PersonsGrid.tsx, frontend/src/components/list-page/EngagementsList.tsx, frontend/src/components/list-page/FilterPill.tsx, frontend/src/components/list-page/ToolbarSearch.tsx, frontend/src/components/list-page/sensitivity.ts, frontend/src/components/list-page/index.ts, frontend/src/components/list-page/__tests__/ListPageShell.test.tsx, frontend/src/components/list-page/__tests__/GenericListPage.test.tsx, frontend/src/components/list-page/__tests__/DossierTable.test.tsx, frontend/src/components/list-page/__tests__/PersonsGrid.test.tsx, frontend/src/components/list-page/__tests__/EngagementsList.test.tsx</files>
  <read_first>
    - .planning/phases/40-list-pages/40-PATTERNS.md (analog code excerpts for every primitive — lines 41-426)
    - .planning/phases/40-list-pages/40-RESEARCH.md §"Code Examples" Examples 1-5 + §"Filter pill active styling anatomy" + §"Sensitivity chip + last-touch column mapping"
    - frontend/src/components/ui/table.tsx (DossierTable composes Table primitives)
    - frontend/src/components/signature-visuals/index.ts (DossierGlyph + GlobeSpinner exports)
    - frontend/src/hooks/useDirection.ts (returns `{ isRTL: boolean }`)
    - frontend/src/lib/i18n/toArDigits.ts (DossierTable + EngagementsList consume)
    - frontend/src/components/dashboard/WeekListMobile.tsx — locate existing ISO-week grouping helper. If util is component-local, EXTRACT it to `frontend/src/lib/date/getISOWeek.ts` in this plan and import from both Phase 38/39 component AND EngagementsList. NEVER inline a hand-rolled ISO-week formula.
  </read_first>
  <behavior>
    - ListPageShell: renders `<div className="page space-y-6">` with `.page-head` (title + optional subtitle + optional action), optional toolbar slot, then conditionally renders skeleton (when isLoading), emptyState (when isEmpty && !isLoading), or children.
    - GenericListPage: `<ul className="forum-list border border-line rounded-md overflow-hidden">` mapping items to `<li className="forum-row grid items-center min-h-11" style={{ gridTemplateColumns: 'auto 1fr auto auto', padding: '14px', borderBottom: '1px solid var(--line-soft)' }}>` with DossierGlyph + Link + meta + chip + ChevronRight; chevron `className="icon-flip h-4 w-4"`.
    - DossierTable: composes existing Table primitives inside `<TableContainer className="hidden md:block rounded-lg border border-line">`; renders Name (DossierGlyph + EN name + AR name `dir="rtl"`) / Engagements (toArDigits when isRTL) / Last updated / Sensitivity chip via SENSITIVITY_CHIP map / Chevron with `className="icon-flip h-4 w-4 text-ink-mute"`. Renders parallel `<div className="md:hidden space-y-2">` of card-stacked rows for mobile.
    - PersonsGrid: `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">` mapping items to `<Link>` cards with 44px circular initial avatar + name + DossierGlyph + conditional VIP chip + role + organization.
    - EngagementsList: search input (250ms debounce via useDebouncedValue) + 4 FilterPill components + week-list grouped by ISO week (USE imported `getISOWeek` — never inline formula) + LoadMoreRow with GlobeSpinner + bilingual loading text when isFetchingNextPage; otherwise button "Load more engagements".
    - FilterPill: `<button type="button" aria-pressed={active} className="btn min-h-11 min-w-11 ${active ? 'btn-primary' : ''}">{label}{count != null && <span>{count}</span>}</button>`.
    - ToolbarSearch: `<div className="tb-search relative"><input className="min-h-11 ps-3 pe-3 border border-line rounded-md w-full sm:w-72" type="search" /></div>`.
    - sensitivity.ts: exports `SENSITIVITY_CHIP` map per locked interface block + `sensitivityChipClass(level)` + `sensitivityLabelKey(level)`. Defensive default: levels outside 1-4 → `chip-default` + `sensitivity.public` (warn via console.warn — pattern per Phase 39 D-13).
  </behavior>
  <action>
RED → GREEN cycle for each primitive. Write tests FIRST (vitest + @testing-library/react), then ship implementation.

**Implementation specifics:**

1. **`sensitivity.ts`**: Export the `SENSITIVITY_CHIP` const VERBATIM from `<interfaces>` block above (3→restricted/chip-warn, 4→confidential/chip-danger). Export `sensitivityChipClass(level: 1|2|3|4): string` and `sensitivityLabelKey(level: 1|2|3|4): string`.

2. **`ListPageShell.tsx`**: Verbatim from PATTERNS.md lines 56-97. Explicit `JSX.Element` return. Use `cn` from `@/lib/utils`. Slot order: head → toolbar → (skeleton OR emptyState OR children). Strict boolean comparisons.

3. **`ListPageShell.skeleton.tsx`**: 4 named skeletons (`DossierTableSkeleton`, `PersonsGridSkeleton`, `GenericListSkeleton`, `EngagementsListSkeleton`) using `bg-line-soft` or `bg-zinc-100 dark:bg-zinc-800` fallback.

4. **`GenericListPage.tsx`**: Verbatim from PATTERNS.md lines 110-154. `Link` from `@tanstack/react-router`. `DossierGlyph` from `@/components/signature-visuals`. `<ChevronRight className="icon-flip h-4 w-4 text-ink-mute" />` from `lucide-react` after status chip.

5. **`DossierTable.tsx`**: Verbatim from PATTERNS.md lines 169-262. Imports: Table primitives from `@/components/ui/table`; `DossierGlyph` from `@/components/signature-visuals`; `Link` from `@tanstack/react-router`; `ChevronRight` from `lucide-react`; `toArDigits` from `@/lib/i18n/toArDigits`; `SENSITIVITY_CHIP` from `./sensitivity`. Format `updated_at` via `new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(r.updated_at))`. `<TableContainer className="hidden md:block ...">` + parallel `<div className="md:hidden space-y-2">` mobile cards.

6. **`PersonsGrid.tsx`**: Verbatim from PATTERNS.md lines 287-328. `initial(name)` helper extracts uppercased first character.

7. **`EngagementsList.tsx`**: Per PATTERNS.md lines 351-426. **ISO-week grouping: import from extracted util** (`@/lib/date/getISOWeek` if extracted from Phase 38/39 `WeekListMobile.tsx` in this plan, else import directly from existing Phase 38/39 location). NEVER inline a hand-rolled formula. Render `<div className="week-list">` with each week as `<section><header className="week-of">{t('engagements:week.of', { date: formattedWeekStart })}</header>{rows}</section>`. Apply client-side filter per D-07: all/confirmed (status==='confirmed')/travel (kind==='travel')/pending (status==='pending'). Search filter via debounced `q`. LoadMoreRow renders `<div className="spinner-row ...">` containing `<GlobeSpinner size={16} />` + bilingual `<span>{t('list-pages:loadMore.loading')}</span>` when isFetchingNextPage; otherwise `<button className="spinner-row btn min-h-11 w-full ...">{t('list-pages:loadMore.button')}</button>`.

8. **`FilterPill.tsx`**: `<button type="button" aria-pressed={active} className={"btn min-h-11 min-w-11 " + (active ? "btn-primary" : "")} onClick={onClick}>{label}{count != null ? <span className="ms-2 text-xs opacity-70">{count}</span> : null}</button>`.

9. **`ToolbarSearch.tsx`**: `<div className="tb-search relative"><input type="search" className="min-h-11 ps-3 pe-3 border border-line rounded-md w-full sm:w-72" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /></div>`.

10. **`index.ts`**: Barrel re-exports per `<interfaces>` block above.

**Vitest tests** (5 files in `__tests__/`):

- ListPageShell.test: title renders; toolbar slot when provided; skeleton when isLoading; emptyState when isEmpty && !isLoading; children otherwise.
- GenericListPage.test: 3 items → 3 `<li>`, each with `min-h-11`, status chip class matches tone, `.icon-flip` chevron present, RTL prop swaps name to nameAr.
- DossierTable.test: header has 5 columns; **level=4 row chip has `chip-danger` AND label key `sensitivity.confidential`**; **level=3 row chip has `chip-warn` AND label key `sensitivity.restricted`**; level=1 row chip has `chip-info`; RTL render shows AR name in `[dir="rtl"]`; mobile (`md:hidden`) section present.
- PersonsGrid.test: 3 items → 3 cards; avatar has `w-11 h-11 rounded-full bg-accent-soft`; VIP chip ONLY when `is_vip === true`; role + org meta present.
- EngagementsList.test: 4 filter pills with `aria-pressed`; search input `min-h-11`; mock `useEngagementsInfinite` 2 pages → all rows visible; click `Confirmed` pill → only confirmed rows; click load-more → `fetchNextPage` called; GlobeSpinner visible when isFetchingNextPage=true.

Mock `@/hooks/useEngagementsInfinite` for the EngagementsList test. Mock `@/hooks/useDebouncedValue` to pass-through.

NO `any`. Explicit return types. Logical properties only.
</action>
<verify>
<automated>cd frontend && pnpm vitest run src/components/list-page/**tests**/ --reporter=dot</automated>
</verify>
<acceptance_criteria> - All 10 primitive files + 5 test files exist at exact paths in `files_modified` - `frontend/src/components/list-page/index.ts` exports all 8 primitives + 4 skeletons + 3 sensitivity helpers - `pnpm vitest run src/components/list-page/__tests__/` exits 0 with 5 files passing - `grep -n "key: 'sensitivity.restricted'" frontend/src/components/list-page/sensitivity.ts` returns at least 1 match (level 3) - `grep -n "key: 'sensitivity.confidential'" frontend/src/components/list-page/sensitivity.ts` returns at least 1 match (level 4) - `grep -rn "ml-\\|mr-\\|pl-\\|pr-\\|text-left\\|text-right\\|rounded-l-\\|rounded-r-" frontend/src/components/list-page/` returns 0 matches - `grep -rn ": any\\|as any\\|<any>" frontend/src/components/list-page/` returns 0 matches - `grep -n "icon-flip" frontend/src/components/list-page/DossierTable.tsx` returns at least 1 match - `grep -n "GlobeSpinner" frontend/src/components/list-page/EngagementsList.tsx` returns at least 1 match - `grep -n "getISOWeek\\|WeekListMobile" frontend/src/components/list-page/EngagementsList.tsx` returns at least 1 match (no inline week formula) - `grep -n "min-h-11" frontend/src/components/list-page/FilterPill.tsx` returns at least 1 match
</acceptance_criteria>
<done>All primitives + skeletons + barrel + sensitivity helper ship; 5 vitest files green; sensitivity 3→restricted / 4→confidential lock enforced; ISO-week util reused from Phase 38/39; zero physical RTL classes; zero `any`.</done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                 | Description                                                                  |
| ------------------------ | ---------------------------------------------------------------------------- |
| Browser ↔ rendered chips | Chip text is display-only; row visibility enforced by Supabase RLS upstream. |

## STRIDE Threat Register

| Threat ID   | Category               | Component                                                 | Disposition | Mitigation Plan                                                                                                                            |
| ----------- | ---------------------- | --------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| T-40-02a-01 | Information disclosure | sensitivity_level chip rendering                          | mitigate    | Chip is display-only; Supabase RLS already filters out rows the user cannot read. Chip cannot reveal data the user couldn't otherwise see. |
| T-40-02a-02 | Tampering              | Inline event handlers (onClick) on rows / chevrons        | mitigate    | All event handlers consume row id via JSX prop closure (not URL parsing); React JSX escaping protects rendered text content.               |
| T-40-02a-03 | Information disclosure | EngagementsList client-side filter on `kind === 'travel'` | accept      | All engagements returned by RLS-filtered backend are already visible; client filter is UX-only.                                            |

</threat_model>

<verification>
- 5 vitest files green
- Sensitivity map LOCKED: 1→public/chip-info, 2→internal/chip-default, 3→restricted/chip-warn, 4→confidential/chip-danger
- ISO-week grouping reuses Phase 38/39 util (no inline formula)
- Zero physical RTL classes in `list-page/`
- Zero `any` in new code
</verification>

<success_criteria>

- 10 primitive files + 5 test files complete
- All Wave 1 page plans can import from `@/components/list-page` without further plumbing
- Sensitivity mapping correct per RESEARCH lock
  </success_criteria>

<output>
After completion, create `.planning/phases/40-list-pages/40-02a-SUMMARY.md`. Note whether `getISOWeek` was extracted to `frontend/src/lib/date/` or imported in-place from Phase 38/39 component.
</output>
