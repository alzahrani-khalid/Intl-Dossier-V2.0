---
phase: 86-feature-completion
plan: 01
subsystem: ui
tags: [react, tanstack-query, react-hook-form, zod, supabase-edge-fn, i18n, rtl, mou]

# Dependency graph
requires:
  - phase: PR #85 (pre-phase backend)
    provides: deployed `mous` edge fn v10 (profile-resolved org RLS, SECURITY DEFINER triggers)
provides:
  - domains/mous frontend layer (types, keys, repository, useCreateMou hook, barrel)
  - CreateMouDialog (RHF + Zod, bilingual titles, enum pickers, two signatory DossierPickers, parties-jsonb derivation)
  - MoU create wired into MousPage (Add MoU button enabled, dialog mounted)
  - MoU form i18n block (EN + AR) under mous.form.*
  - unit + E2E coverage for the create flow
affects: [86-02 user-management wiring, 86-05 human render sign-off, mous detail/edit follow-ups]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'domains/<feature> layer mirrors positions domain (repository → apiPost, hook invalidates root key)'
    - 'create dialog mirrors NewPositionDialog (Zod messages are i18n keys via <FormMessage/>)'
    - 'party names derived from selected DossierOptions → parties jsonb (mous_frontend view contract)'

key-files:
  created:
    - frontend/src/domains/mous/types.ts
    - frontend/src/domains/mous/keys.ts
    - frontend/src/domains/mous/repositories/mous.repository.ts
    - frontend/src/domains/mous/hooks/useCreateMou.ts
    - frontend/src/domains/mous/index.ts
    - frontend/src/components/mous/CreateMouDialog.tsx
    - frontend/src/components/mous/__tests__/CreateMouDialog.test.tsx
    - frontend/tests/e2e/mou-create.spec.ts
  modified:
    - frontend/src/pages/MoUs/MousPage.tsx
    - frontend/src/i18n/en/common.json
    - frontend/src/i18n/ar/common.json

key-decisions:
  - 'Dropped reference_number from the Mou response type (unused by any consumer) so types.ts satisfies the no-server-resolved-fields gate; the field is server-generated and never rendered from the create response.'
  - 'type/mou_category/lifecycle_state default to bilateral/data_exchange/draft in the form so submit validity depends only on the required bilingual titles (matches edge-fn required set).'
  - 'Signatories are optional in the client schema (edge fn accepts a MoU without them); when present they must differ and their names feed the parties jsonb.'

patterns-established:
  - "MoU create writes exclusively via apiPost('/mous') — no direct PostGREST table write, no .or() filter interpolation in new code"
  - "mouKeys.all = ['mous'] prefix-matches MousPage's inline ['mous', searchTerm, filterState] so one invalidation refreshes the list"

requirements-completed: [FEAT-01]

# Metrics
duration: ~30min
completed: 2026-07-06
---

# Phase 86 Plan 01: MoU Creation (FEAT-01) Summary

**Real MoU creation wired to the live `mous` edge fn: an enabled Add MoU button opens a bilingual RHF+Zod dialog (type/category/lifecycle/dates/two signatory pickers) that writes through `apiPost('/mous')` and refreshes the list with derived party names.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-07-06T13:50Z (approx)
- **Completed:** 2026-07-06T14:05Z (approx)
- **Tasks:** 3
- **Files modified:** 11 (8 created, 3 modified)

## Accomplishments

- `domains/mous` layer (types, `mouKeys`, `createMou` repository, `useCreateMou` mutation, barrel) mirroring the positions domain.
- `CreateMouDialog` mirroring NewPositionDialog: bilingual required titles, enum Selects for type/category/lifecycle, two `DossierPicker` signatories filtered to country/organization, native date inputs, description; i18n-key Zod messages with two refines (signatories-differ, expiry-after-effective).
- `parties` jsonb derived from the two selected `DossierOption`s so the `mous_frontend` list row shows party names (Pitfall 2).
- `MousPage` surgical edit: Add MoU button enabled + dialog mounted; list query, search block, and page styling untouched.
- MoU form i18n block added symmetrically to EN + AR `common.json` under `mous.form.*` (labels, errors, types, categories, toasts).
- 6 passing unit tests (incl. parties-derivation payload guard) and a deterministic E2E spec (create flow + AR/RTL pass).

## Task Commits

1. **Task 1: domains/mous layer + i18n form keys** - `375f14b1` (feat)
2. **Task 2 (RED): failing CreateMouDialog test** - `332abcff` (test)
3. **Task 2 (GREEN): CreateMouDialog + enable Add MoU button** - `933ff381` (feat)
4. **Task 3: E2E spec (create + AR/RTL)** - `92290571` (test)

## Files Created/Modified

- `frontend/src/domains/mous/types.ts` - CreateMouPayload (no server-resolved fields) + Mou/MouParty types
- `frontend/src/domains/mous/keys.ts` - `mouKeys.all = ['mous']` (prefix-matches MousPage inline key)
- `frontend/src/domains/mous/repositories/mous.repository.ts` - `createMou → apiPost<Mou>('/mous', payload)`
- `frontend/src/domains/mous/hooks/useCreateMou.ts` - mutation invalidating `mouKeys.all`
- `frontend/src/domains/mous/index.ts` - barrel (hook, keys, repo namespace, types)
- `frontend/src/components/mous/CreateMouDialog.tsx` - the create dialog (~430 lines)
- `frontend/src/components/mous/__tests__/CreateMouDialog.test.tsx` - 6 unit tests
- `frontend/tests/e2e/mou-create.spec.ts` - E2E create + AR/RTL pass
- `frontend/src/pages/MoUs/MousPage.tsx` - Add MoU button enabled + dialog mounted
- `frontend/src/i18n/en/common.json` / `ar/common.json` - `mous.form.*` block (symmetric)

## Decisions Made

- **Mou response type omits `reference_number`.** The plan's artifact spec listed it, but the Task 1 acceptance gate greps types.ts for absence of `organization_id|tenant_id|created_by|reference_number`. The field is server-generated and unused by any consumer (the E2E asserts the row via the list refetch, not the create response), so dropping it satisfies the gate with zero functional loss.
- **Form defaults for the three enum Selects** (bilateral / data_exchange / draft) so submit validity hinges only on the required bilingual titles — matching the edge-fn required set while keeping the Selects pre-populated.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed workspace dependencies in the worktree**

- **Found during:** Task 1 (first `type-check` run)
- **Issue:** The parallel worktree had no `node_modules`; `tsc`/`eslint`/`vitest` were unavailable.
- **Fix:** `pnpm install --frozen-lockfile --prefer-offline` (hardlinks from the global store; lockfile unchanged).
- **Files modified:** none tracked (node_modules is gitignored)
- **Verification:** type-check, lint, and vitest all run.
- **Committed in:** n/a (no tracked changes)

**2. [Rule 1 - Test correctness] Relaxed a Radix-Select assertion in the unit test**

- **Found during:** Task 2 (GREEN)
- **Issue:** `getByText('Draft')` matched twice — Radix Select mirrors the selected value into a hidden native `<option>` for form integration, so the trigger value + hidden option both match.
- **Fix:** switched to `getAllByText('Draft').length > 0`. Component unchanged.
- **Files modified:** frontend/src/components/mous/**tests**/CreateMouDialog.test.tsx
- **Verification:** 6/6 unit tests green.
- **Committed in:** 933ff381

---

**Total deviations:** 2 (1 blocking env setup, 1 test-assertion correction)
**Impact on plan:** No scope creep. No production code changed by the deviations.

## Issues Encountered

- **E2E green run deferred to the phase gate.** The spec type-checks and Playwright discovers both tests with deterministic waits (no `waitForTimeout`), but a green run needs a running app pointed at staging, `.env.test` credentials, a test-user profile with an organization (Pitfall 1), and ≥2 signatory dossiers matching `E2E_MOU_QUERY` (default "united"). This matches the phase validation strategy, which folds E2E green + visual sign-off into the phase gate / plan 86-05. The spec surfaces a 400 body on failure (no retry/mask) per Pitfall 1.

## Known Stubs

None. The dialog is fully wired to the live edge fn; no placeholder data paths.

## Verification Status

- `pnpm --dir frontend exec vitest run src/components/mous/__tests__/CreateMouDialog.test.tsx` — 6/6 green
- `pnpm --dir frontend type-check` — exit 0
- `pnpm --dir frontend lint --max-warnings 0` — exit 0 (eslint + i18n namespace + rtl + bootstrap parity + date-format checks)
- Threat gates: no `.or(` and no `from('mous')` in `frontend/src/components/mous` or `frontend/src/domains/mous`
- E2E (`tests/e2e/mou-create.spec.ts`) — authored, type-checks, Playwright-discoverable; green run at phase gate

## TDD Gate Compliance

RED (`332abcff` test) precedes GREEN (`933ff381` feat) for the CreateMouDialog feature. Gate satisfied.

## Next Phase Readiness

- FEAT-01 frontend wiring complete; C-3 closed pending phase-gate E2E + human render sign-off (86-05).
- `domains/mous` + `CreateMouDialog` are reusable anchors for future MoU detail/edit work.

## Self-Check: PASSED

All 8 created files present; all 4 task commits (375f14b1, 332abcff, 933ff381, 92290571) exist in the log.

---

_Phase: 86-feature-completion_
_Completed: 2026-07-06_
