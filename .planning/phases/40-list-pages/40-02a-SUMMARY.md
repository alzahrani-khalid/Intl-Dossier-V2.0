---
phase: 40-list-pages
plan: 02a
status: PASS-WITH-DEVIATION
type: execute
requirements: [LIST-01, LIST-02, LIST-03, LIST-04]
completed: 2026-04-26
---

# 40-02a — list-page primitives + helpers + tests

**Status:** PASS-WITH-DEVIATION (deviation: split execution into α/β/γ + inline orchestration; see Deviations).

## Scope delivered

All 8 list-page primitives, the sensitivity helper, the barrel re-export, and 5 vitest fixtures. SCOPE matches the plan: primitives + tests only — adapter hooks (Plan 02b) and CSS port + size-limit (Plan 02c) are not in this plan.

### Files created

| File | Purpose |
|---|---|
| `frontend/src/components/list-page/sensitivity.ts` | `SENSITIVITY_CHIP` map + `sensitivityChipClass` + `sensitivityLabelKey` (1→public/info, 2→internal/default, 3→restricted/warn, 4→confidential/danger per RESEARCH lock) |
| `frontend/src/components/list-page/ListPageShell.tsx` | Page-level frame: title, subtitle, toolbar slot, skeleton/empty/children switch |
| `frontend/src/components/list-page/GenericListPage.tsx` | Table-row composition: `auto 1fr auto auto` grid, ≥44px row, status chip slot, RTL chevron |
| `frontend/src/components/list-page/DossierTable.tsx` | Header (Name/Engagements/Last touch/Sensitivity) + DossierGlyph + EN/AR names + sensitivity chip via helper; mobile (<md) collapses to card list |
| `frontend/src/components/list-page/PersonsGrid.tsx` | 1/2/3-col responsive grid; 44px circular avatar; VIP chip; role · organization meta |
| `frontend/src/components/list-page/EngagementsList.tsx` | ToolbarSearch + 4 FilterPills + week-list grouping (ISO 8601) + GlobeSpinner load-more |
| `frontend/src/components/list-page/FilterPill.tsx` | Pill with active/inactive states, `aria-pressed`, min 44×44 touch target |
| `frontend/src/components/list-page/ToolbarSearch.tsx` | Debounced search via `useDebouncedValue` (reused — already on disk) |
| `frontend/src/components/list-page/ListPageShell.skeleton.tsx` | 4 skeleton variants: GenericListSkeleton, DossierTableSkeleton, PersonsGridSkeleton, EngagementsListSkeleton |
| `frontend/src/components/list-page/index.ts` | Barrel — all primitives, types, skeletons, sensitivity helper |
| `frontend/src/lib/date/getISOWeek.ts` | ISO 8601 week-of-year helper (Thursday-anchored), used by EngagementsList |

### Tests created (5 vitest fixtures, all passing — 30/30)

| Test | Tests |
|---|---|
| `__tests__/ListPageShell.test.tsx` | 6 |
| `__tests__/GenericListPage.test.tsx` | 5 |
| `__tests__/DossierTable.test.tsx` | 5 |
| `__tests__/PersonsGrid.test.tsx` | 7 |
| `__tests__/EngagementsList.test.tsx` | 7 |

`pnpm vitest run src/components/list-page` → **30 passed (30)**.

## Key decisions

- **Path canonical: `frontend/src/components/list-page/` (singular)** — matches plan frontmatter `files_modified` exactly.
- **`useDebouncedValue` reused** from `frontend/src/hooks/useDebouncedValue.ts` (already existed) — no duplication.
- **Test mocking**: per-file `vi.mock('react-i18next', ...)` returning `t: (k, opts) => opts?.defaultValue ?? k`, mirroring the project's CalendarEventPill canonical pattern. The global mock in `tests/setup.ts` covers an `afterActions.*` translation map only and does not expose `Trans`/`I18nextProvider`/`initReactI18next`, so each list-page test installs its own mock.
- **Assertions**: project does not register `@testing-library/jest-dom`. Tests use raw `.toBeTruthy()` / `.toBeNull()` / `.textContent.toContain(…)` instead of `.toBeInTheDocument()` / `.toHaveTextContent()`.
- **DossierGlyph + GlobeSpinner**: imported from `@/components/signature-visuals` (Phase 37 barrel exports both).
- **Mobile collapse for DossierTable**: hidden columns at `<md` breakpoint; chevron only visible mobile, full row layout md+.
- **VIP chip**: rendered with `chip chip-warn` and `data-testid="vip-chip"` for testability.

## Sensitivity chip lock (truth-in-implementation)

```ts
SENSITIVITY_CHIP = {
  1: { class: 'chip-info',    labelKey: 'sensitivity.public' },
  2: { class: 'chip-default', labelKey: 'sensitivity.internal' },
  3: { class: 'chip-warn',    labelKey: 'sensitivity.restricted' },
  4: { class: 'chip-danger',  labelKey: 'sensitivity.confidential' },
}
```

## RTL coverage

All primitives use logical Tailwind only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`, `start-*`, `end-*`). Chevrons flip via `${isRTL ? 'rotate-180' : ''}`. Names swap on `i18n.language === 'ar'`. No `textAlign: 'right'` (would flip back to physical LEFT under `forceRTL`). Touch targets ≥ 44×44px on every interactive element.

## Deviations

| # | What | Why |
|---|------|-----|
| 1 | Plan executed as 3 logical sub-spawns (α / β / γ) instead of single agent | Two whole-plan executor spawns (worktree-isolated, opus) hit ~100k token context exhaustion before any commit. The plan's surface (8 primitives + tests + barrel + helper) exceeds a single executor's working budget. The work itself is unchanged. |
| 2 | β + γ work executed inline by orchestrator, not by spawned subagents | Even at split sub-spawn scope, β failed at 68k tokens with 0 commits (only 2 untracked files). Inline execution in the parent context (1M window) was the only reliable path forward. The α subset succeeded as a subagent (`agent-a23dbae506295b177`). |
| 3 | `frontend/src/lib/date/getISOWeek.ts` created fresh | Plan key-link suggested extracting from `WeekListMobile.tsx`; that file does not exist on DesignV2. Created a self-contained Thursday-anchored ISO 8601 implementation (~25 lines) — drop-in replacement for any future extraction. |
| 4 | Per-file `vi.mock('react-i18next', ...)` instead of bespoke `i18next.init` | Initial test scaffolding tried to set up a real i18n instance; project's global mock prevents this and project pattern is per-file mocks (mirrored from `CalendarEventPill.test.tsx`). All 30 tests passing after alignment. |

## Handoff to Plan 02b (adapter hooks) and Plan 02c (CSS + size-limit)

- **02b** consumes `EngagementRow`, `DossierTableRow`, `PersonCard`, `EngagementsListProps` from `@/components/list-page` and wires real adapter hooks (`useCountries`, `useOrganizations`, `usePersons`, `useEngagementsInfinite`, etc.) to map server payloads into these row shapes.
- **02c** ports the CSS classes referenced by these primitives (`.chip`, `.chip-info`, `.chip-default`, `.chip-warn`, `.chip-danger`, `.btn`, `.btn-primary`, `.icon-flip`, `.bg-accent-soft`, `.text-accent-ink`) from the handoff CSS into the design-system tokens, sets up the size-limit budget, and verifies the Open-Questions list.
- **Wave 1 (40-03 through 40-09)** can now import primitives directly:

  ```ts
  import { ListPageShell, DossierTable, PersonsGrid, EngagementsList, ToolbarSearch, FilterPill } from '@/components/list-page'
  ```

## Commits

```
2e8ed727 test(40-02a): align list-page primitive tests with project pattern
3b7db419 feat(40-02a-γ): add 4 list-page skeletons + finalize barrel re-exports
0f0d6bb4 feat(40-02a-γ): add EngagementsList + ISO-week helper + test
186b7577 feat(40-02a-β): add PersonsGrid + test (1/2/3-col responsive, VIP chip)
f63e8eb1 feat(40-02a-β): add DossierTable + test (DossierGlyph + sensitivity chip + RTL)
86c16520 feat(40-02a-β): add GenericListPage + test (salvaged from interrupted spawn)
3b58a1c5 feat(40-02a-α): add list-page barrel re-export (foundations subset)
55c1b770 feat(40-02a-α): add FilterPill + ToolbarSearch
2deda454 feat(40-02a-α): add ListPageShell + test
7d97ca21 feat(40-02a-α): add sensitivity helper + chip map
```

## Self-check

- [x] All 11 files in `files_modified` exist on DesignV2
- [x] Barrel re-exports every primitive + skeletons + sensitivity helper
- [x] DossierTable uses `sensitivityChipClass(level)` (not hardcoded)
- [x] EngagementsList renders 4 filter pills + ISO-week grouping + GlobeSpinner load-more
- [x] PersonsGrid: 1/2/3-col responsive, 44px avatar, VIP chip, role · organization meta
- [x] All 5 vitest fixtures green (30/30)
- [x] No floating promises, no `any`, no `console.log`, no `textAlign: 'right'`
- [x] Logical Tailwind only — no `ml-*`/`mr-*`/`pl-*`/`pr-*`/`text-left`/`text-right`/`left-*`/`right-*`
- [x] Touch targets ≥ 44×44px on all interactive elements
