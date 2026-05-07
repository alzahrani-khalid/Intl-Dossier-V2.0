---
phase: 40
plan: 40-02a-α
subsystem: frontend/list-page
tags: [list-page, foundations, primitives, rtl]
sub-spawn: alpha
parent-plan: 40-02a
status: complete
key-files:
  created:
    - frontend/src/components/list-page/sensitivity.ts
    - frontend/src/components/list-page/ListPageShell.tsx
    - frontend/src/components/list-page/FilterPill.tsx
    - frontend/src/components/list-page/ToolbarSearch.tsx
    - frontend/src/components/list-page/__tests__/ListPageShell.test.tsx
    - frontend/src/components/list-page/index.ts
    - .planning/phases/40-list-pages/40-02a-α-SUMMARY.md
commits:
  - a6c02dcb feat(40-02a-α): add sensitivity helper + chip map
  - a2dc9f0d feat(40-02a-α): add ListPageShell + test
  - 3e3a6d67 feat(40-02a-α): add FilterPill + ToolbarSearch
  - 7d24bcc5 feat(40-02a-α): add list-page barrel re-export (foundations subset)
---

# Phase 40 Plan 40-02a-α: List-Page Foundations Sub-Spawn Summary

Foundation primitives (`ListPageShell`, `FilterPill`, `ToolbarSearch`, `sensitivity` helper, partial barrel) for the shared list-page kit. Sub-spawn α of split 40-02a (β/γ will add `GenericListPage`, table/grid/list views, and skeletons on top of this barrel).

## What Shipped (α scope)

- **`sensitivity.ts`** — `SENSITIVITY_CHIP` const map + `sensitivityChipClass()` / `sensitivityLabelKey()` helpers (levels 1–4 → `chip-info|default|warn|danger` + i18n keys).
- **`ListPageShell.tsx`** — page frame with title/subtitle/toolbar/skeleton/empty/children switching. Mobile-first, RTL-safe (logical Tailwind, `dir` from `i18n.language`).
- **`FilterPill.tsx`** — pill button with `active`/`label`/`onClick`/`icon`. Min 44×44 touch target. Uses `.btn` / `.btn-primary` token classes already in the codebase.
- **`ToolbarSearch.tsx`** — debounced search input (300ms default) wired to existing `@/hooks/useDebouncedValue`. Local state + debounced sync-back to parent. Externally controlled value resyncs into local state.
- **`__tests__/ListPageShell.test.tsx`** — 6 vitest cases: title, subtitle, skeleton (isLoading), empty state (isEmpty + emptyState), children, toolbar slot.
- **`index.ts`** — partial barrel exporting only α-produced surface; β/γ will extend.

## Out of Scope (delegated)

- `GenericListPage<T>` orchestrator → β
- `DossierTable`, `PersonsGrid`, `EngagementsList` view variants → β/γ
- View-specific skeletons (table/grid/list) → β/γ
- `FilterPill` smoke test → γ (token budget preserved here)

## Key Decisions

- **`useDebouncedValue` reuse, not duplication.** Hook already exists at `frontend/src/hooks/useDebouncedValue.ts` (300ms default, generic) — `ToolbarSearch` imports it directly instead of re-implementing.
- **Plain HTML primitives, not HeroUI.** Matches the `frontend/src/components/ui/heroui-*` wrapper pattern (plain div/span/button) so these stay drop-in replaceable and `React.HTMLAttributes`-compatible. `.btn` / `.btn-primary` / `.chip-*` are global token classes already in use across the codebase.
- **Singular path `list-page/`** per plan frontmatter, not plural.
- **No `textAlign`-style classes.** Used `text-start` / `text-end` only — `forceRTL` flips `text-right` to physical LEFT, so logical-only is mandatory.
- **Internal-state debounce model in `ToolbarSearch`.** Parent stays the source of truth (URL search-param friendly); local state covers fast keystrokes; `useDebouncedValue` then notifies the parent. External value changes (e.g. clear-all) resync via `useEffect(value)`.
- **`ListPageShell` skeleton kept inline & simple.** Six pulse rows; β will replace with view-specific skeletons through children when needed.

## RTL/Mobile Self-Check

- All `dir={isRTL ? 'rtl' : 'ltr'}` containers use logical Tailwind only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`).
- Touch targets: `FilterPill` `min-h-11 min-w-11`; `ToolbarSearch` `h-11` (mobile) / `sm:h-10` (desktop).
- No `.reverse()`, no `textAlign: 'right'`, no `ml-*`/`mr-*`/`pl-*`/`pr-*`.
- Mobile-first breakpoints (`base → sm: → md: → lg:`).

## Deviations from Plan

None. α subset built exactly as scoped by the orchestrator; β/γ surface explicitly omitted.

## Self-Check: PASSED

- All 6 created files exist on disk.
- All 4 task commits resolve in `git log`:
  - `a6c02dcb` sensitivity helper
  - `a2dc9f0d` ListPageShell + test
  - `3e3a6d67` FilterPill + ToolbarSearch
  - `7d24bcc5` barrel
- No imports of yet-unbuilt β/γ surface (no `GenericListPage`, no view variants).
- `useDebouncedValue` import resolves to existing `@/hooks/useDebouncedValue.ts`.

## Handoff to β / γ

The barrel (`frontend/src/components/list-page/index.ts`) is intentionally additive: β should append `export { GenericListPage } from './GenericListPage'` and view-variant exports without touching α exports. `sensitivityChipClass` / `sensitivityLabelKey` are ready for β/γ to consume in `DossierTable` / `PersonsGrid` rows.
