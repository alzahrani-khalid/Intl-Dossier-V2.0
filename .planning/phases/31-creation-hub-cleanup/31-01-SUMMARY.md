---
phase: 31-creation-hub-cleanup
plan: 01
status: complete
verdict: PASS
date: 2026-04-18
---

# Plan 31-01 Summary — CreateDossierHub + Route Swap

## Scope

Built `CreateDossierHub.tsx` — a new 8-card grid at `/dossiers/create` — and swapped it onto the existing route. Each card navigates to its per-type wizard via `getDossierRouteSegment()`. Stateless URL (D-05), mobile-first grid (D-01), RTL-safe logical properties only.

Requirements covered: **UX-01** (hub creation entry point).

## Files Created

- `frontend/src/pages/dossiers/CreateDossierHub.tsx` (136 lines) — 8-card grid in `DOSSIER_TYPES` enum order
- `frontend/src/pages/dossiers/__tests__/CreateDossierHub.test.tsx` (83 lines) — 3 test cases

## Files Modified

- `frontend/src/routes/_protected/dossiers/create.tsx` — component swapped from `DossierCreatePage` to `CreateDossierHub` (D-16)
- `frontend/src/i18n/en/dossier.json` — added `create.hubDescription.{8 types}` keys + `type.elected_official` key
- `frontend/src/i18n/ar/dossier.json` — added parallel Arabic translations

## i18n Keys Added (both EN + AR)

`dossier:create.hubDescription.country`, `.organization`, `.forum`, `.engagement`, `.topic`, `.working_group`, `.person`, `.elected_official`, plus `dossier:type.elected_official`.

## Verification

- `pnpm type-check` — passes for Plan 31-01 files; pre-existing unrelated TS6133/TS6196 warnings in `timeline.types.ts`, `sla.types.ts`, `work-item.types.ts`, `sla-calculator.ts` (not introduced by this plan).
- `pnpm vitest run src/pages/dossiers/__tests__/CreateDossierHub.test.tsx` — **3/3 tests pass**.
- Test coverage: card count+order, click-through hrefs for 5 types (including hyphenated + underscored route segments), RTL negative assertions.

## Deviations

- Test uses `.getAttribute('href')` with `toBe()` instead of `toHaveAttribute()` — the project's vitest setup at `tests/setup.ts` does not register `@testing-library/jest-dom` matchers, so jest-dom chainables are unavailable.
- Component declares a local `HubCardType` union that includes `elected_official`; the canonical `DossierType` from `@/lib/dossier-type-guards` excludes it (elected_official is a `PersonSubtype`). Hub surfaces it as a first-class creation entry per D-02, widening locally without touching domain types.

## Acceptance Criteria (from PLAN)

| Criterion | Result |
|-----------|--------|
| Hub renders 8 cards | PASS (test) |
| DOSSIER_TYPES enum order | PASS (test) |
| Uses `getDossierRouteSegment` | PASS (component) |
| Grid `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` | PASS |
| No physical RTL classes | PASS (test assertion) |
| EN + AR `hubDescription.*` keys added | PASS |
| `elected_official` icon case | PASS |
| Route `component: CreateDossierHub` | PASS |
| Legacy `DossierCreatePage` import removed | PASS |
| Test ≥3 cases passing | PASS (3/3) |

## Verdict

**PASS** — Plan 31-01 ready for commit. Unblocks Plan 31-02.
