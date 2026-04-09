---
phase: 17-seed-data-first-run
plan: 04
subsystem: ui
tags: [react, tanstack-query, dialog, i18n, rtl, sample-data, first-run]

requires:
  - phase: 17-02
    provides: populate_diplomatic_seed RPC + regenerated database.types.ts
  - phase: 17-03
    provides: check_first_run RPC (returns canSeed flag)
provides:
  - FirstRunModal React component (admin + non-admin variants)
  - bilingual EN/AR copy under sample-data namespace firstRun.* keys
  - Vitest coverage for all 4 RPC response paths
affects: [17-05-dashboard-wiring]

tech-stack:
  added: []
  patterns:
    - 'Branch-on-RPC-status frontend mutation pattern (seeded / already_seeded / forbidden / error)'
    - 'Broad TanStack Query invalidation by canonical key prefix after seed'
    - 'Mobile-first dialog with logical Tailwind props (ms/me/ps/pe/text-start)'

key-files:
  created:
    - frontend/src/components/FirstRun/FirstRunModal.tsx
    - frontend/src/components/FirstRun/FirstRunModal.test.tsx
  modified:
    - frontend/src/i18n/en/sample-data.json
    - frontend/src/i18n/ar/sample-data.json

key-decisions:
  - "Used the project's existing shadcn Dialog primitives instead of the heroui-modal.tsx wrapper. The wrapper's HeroUIModal root does not currently pipe `isOpen`/`onOpenChange` to the underlying HeroUI Modal — it only stores them in context. Every other dialog in the codebase uses shadcn Dialog, so we follow that convention. Flagged as a separate cleanup follow-up."
  - "Canonical query key for tasks invalidation is `['tasks']`, NOT `['work-items']`, per 17-SCHEMA-RECONCILIATION.md §2."
  - 'Success toast interpolates only the 3 plan-mandated counts (dossiers/tasks/persons). Other counts are returned by the RPC but intentionally not surfaced to keep the toast scannable.'
  - 'Test file uses the global `react-i18next` mock from tests/setup.ts (which returns t = key) — assertions check key strings rather than translated copy. The Arabic visual check that the plan describes belongs to the manual UAT pass on a real i18n runtime.'

patterns-established:
  - "First-run modal contract: { open, onOpenChange, canSeed } — fully controlled, no internal session state, no localStorage (that lives in 17-05's useFirstRunCheck hook)"

requirements-completed: [SEED-01, SEED-03]

duration: ~30min
completed: 2026-04-07
---

# Phase 17 Plan 04: FirstRunModal Component Summary

**Built the bilingual, RTL-safe, mobile-first first-run modal with admin/non-admin variants. All four populate_diplomatic_seed response paths covered by passing Vitest tests.**

## Performance

- **Completed:** 2026-04-07
- **Tasks:** 3 (i18n keys / component / tests)
- **Files modified:** 4

## Accomplishments

- Bilingual `firstRun.*` key group added to `frontend/src/i18n/{en,ar}/sample-data.json` with full Arabic translations and `{{dossiers}}/{{tasks}}/{{persons}}` interpolation tokens
- `FirstRunModal.tsx` component:
  - Controlled `{ open, onOpenChange, canSeed }` contract
  - `useMutation` calling `supabase.rpc('populate_diplomatic_seed')` (typed via the regenerated `database.types.ts` from 17-02)
  - Branches on `data.status`: `seeded` → success toast + broad invalidation + close, `already_seeded` → info toast + close, `forbidden` → error toast (modal stays open), thrown error → generic error toast
  - Broad invalidation across 10 canonical query prefixes including `['tasks']` (NOT `['work-items']`)
  - Admin variant: Populate (primary) + Skip (ghost) buttons. Non-admin variant: Close only — Populate button never rendered.
  - Logical Tailwind props throughout (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`); `dir={isRTL ? 'rtl' : 'ltr'}` on the dialog content
  - 44×44 touch targets; mobile-first stacked footer that becomes horizontal on `sm+`
- `FirstRunModal.test.tsx` — 6 passing Vitest tests covering both variants, the happy path (with canonical key invalidation assertions), already_seeded, forbidden, and rpc-error paths
- Typecheck (`pnpm exec tsc --noEmit`) clean for FirstRunModal (the project has 1647 pre-existing baseline TS errors elsewhere, none from Phase 17)

## Task Commits

1. **Task 1: bilingual i18n keys** — `9eaee8bf` (cherry-picked from worktree-agent-ab2e429b after subagent base-drift recovery)
2. **Tasks 2 + 3: component + tests bundled** — `0fd47e4e`

## Files Created/Modified

- `frontend/src/components/FirstRun/FirstRunModal.tsx` — controlled dialog with mutation + branching response handler
- `frontend/src/components/FirstRun/FirstRunModal.test.tsx` — 6 Vitest tests
- `frontend/src/i18n/en/sample-data.json` — added `firstRun.*` group
- `frontend/src/i18n/ar/sample-data.json` — added `firstRun.*` group

## Verification

- Vitest: `pnpm exec vitest run src/components/FirstRun/FirstRunModal.test.tsx` → **6 passed (6)** ✓
- Typecheck: no FirstRun-related TS errors ✓
- Manual visual check (RTL Arabic flip): deferred to 17-05 wiring step + UAT
- Live RPC smoke test: deferred to fresh-deploy UAT (per 17-02 staging policy)

## Notes

- **Subagent recovery context:** Wave 3 was originally dispatched to a `gsd-executor` subagent in an isolated worktree. The worktree was created from a stale base (pre-v4.0 milestone), which caused hundreds of unrelated `.planning/` diffs. The agent committed Task 1 (i18n keys, clean) before stalling mid-investigation. The parent session cherry-picked the clean i18n commit onto main, removed the stale worktree, and authored Tasks 2 + 3 inline. Same approach is being used for Wave 4 (17-05).
- **HeroUI wrapper drift (follow-up):** `frontend/src/components/ui/heroui-modal.tsx` exports `HeroUIModal` whose root component does not pass `open`/`onOpenChange` to the underlying `<Modal>` from `@heroui/react` — it only stores them in React context. This means the wrapper currently can't be controlled. Phase 17 routes around this by using shadcn `Dialog` (the actively-used pattern). Recommendation: file a separate cleanup phase to either fix the wrapper or remove it.
- **Test scope:** the Arabic-language assertion that the plan recommends ("renders both EN and AR copy correctly when i18n language switches") is incompatible with the project's global `react-i18next` mock in `tests/setup.ts`, which hardcodes `i18n.language = 'en'` and returns keys instead of translated copy. The Arabic visual check is therefore deferred to manual UAT in a real browser session — the i18n JSON files themselves carry full Arabic translations.
