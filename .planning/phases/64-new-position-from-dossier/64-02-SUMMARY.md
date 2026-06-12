---
phase: 64-new-position-from-dossier
plan: 02
subsystem: positions
tags: [react, tanstack-query, supabase, i18n, edge-functions, positions]

# Dependency graph
requires:
  - phase: 64-new-position-from-dossier
    provides: 64-PATTERNS pattern map, 64-UI-SPEC copywriting contract, live-verified lookup row shapes
provides:
  - usePositionTypes lookup hook (position_types, 30-min staleTime)
  - useAudienceGroups lookup hook (audience_groups, 30-min staleTime)
  - translateContent repository wrapper (typed edge POST to /translate-content)
  - TranslateContentInput / TranslateContentResponse types
  - Full bilingual create_dialog + validation i18n key set (EN+AR)
  - D-13 dossier_tab relabel (create_position now "Create position") + attach_existing key
affects:
  [
    64-03-PLAN (NewPositionDialog consumes hooks/types/translate/i18n),
    64-04-PLAN (DossierPositionsTab tab relabel),
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Direct-supabase-client lookup useQuery hook with long staleTime for reference tables (mirrors useDossierPositionLinks)'
    - 'Typed edge POST repository wrapper with a fail-safe contract comment documenting deployed 503 behavior'

key-files:
  created:
    - frontend/src/domains/positions/hooks/usePositionTypes.ts
    - frontend/src/domains/positions/hooks/useAudienceGroups.ts
  modified:
    - frontend/src/domains/positions/index.ts
    - frontend/src/domains/positions/repositories/positions.repository.ts
    - frontend/src/domains/positions/types/index.ts
    - frontend/src/i18n/en/positions.json
    - frontend/src/i18n/ar/positions.json

key-decisions:
  - 'Name-match default resolution (standard type / all-staff group) intentionally kept OUT of the hooks; it lives in the dialog (D-05/D-06)'
  - 'translateContent left as a thin apiPost wrapper; bilingual edge error body is deliberately NOT surfaced (would require api-client change — Pitfall 3)'
  - "Used the plan's explicit 5-key validation list (incl. title_max_length) over the UI-SPEC table's 4-key subset; plan action is authoritative"

patterns-established:
  - "Lookup hooks: queryKey single-segment ['position-types']/['audience-groups'], explicit UseQueryResult<Row[], Error> return type, throw new Error(error.message) on PostgREST error"
  - 'Edge wrapper contract comments name the deployed 503/AI-unavailable behavior and the never-block-submission rule'

requirements-completed: [POSNEW-01, POSNEW-02]

# Metrics
duration: ~18min
completed: 2026-06-12
---

# Phase 64 Plan 02: New-Position Foundation Layer Summary

**Two reference-table lookup hooks (position types, audience groups), a typed fail-safe translateContent edge wrapper, and the complete bilingual create-dialog/validation i18n key set with the D-13 tab relabel — the data + string foundation Plan 64-03's dialog consumes.**

## Performance

- **Duration:** ~18 min
- **Tasks:** 3
- **Files modified:** 7 (2 created, 5 modified)

## Accomplishments

- `usePositionTypes` and `useAudienceGroups` read `position_types` / `audience_groups` directly through the supabase client with single-segment query keys and a 30-minute staleTime, throwing on PostgREST error; both re-exported (with their row types) from the positions barrel.
- `translateContent(input)` posts to `/translate-content` via `apiPost`, typed by new `TranslateContentInput` / `TranslateContentResponse` interfaces, with a contract comment documenting the deployed-v2 10,000-char limit, the 503-on-AI-down behavior, and the never-block-submission rule (D-07). Shared `api-client` left untouched (zero diff).
- All 16 `create_dialog` keys, all 5 `validation` keys, and the D-13 `dossier_tab` relabel (`create_position` → "Create position" / "إنشاء موقف") plus the new `attach_existing` key landed in BOTH `en/positions.json` and `ar/positions.json`, strings copied verbatim from the UI-SPEC Copywriting Contract.

## Task Commits

Each task was committed atomically:

1. **Task 1: usePositionTypes + useAudienceGroups lookup hooks + barrel exports** - `594bacdc` (feat)
2. **Task 2: translateContent repository wrapper + types** - `b9dc7d89` (feat)
3. **Task 3: create-dialog i18n keys (EN+AR) + D-13 tab relabel** - `bc154052` (feat)

## Files Created/Modified

- `frontend/src/domains/positions/hooks/usePositionTypes.ts` (created) - Lookup query hook for `position_types`, queryKey `['position-types']`, 30-min staleTime, throw-on-error
- `frontend/src/domains/positions/hooks/useAudienceGroups.ts` (created) - Lookup query hook for `audience_groups`, queryKey `['audience-groups']`, 30-min staleTime, throw-on-error
- `frontend/src/domains/positions/index.ts` (modified) - Re-exports both hooks and `PositionTypeRow` / `AudienceGroupRow`
- `frontend/src/domains/positions/repositories/positions.repository.ts` (modified) - Adds `translateContent` edge wrapper with fail-safe contract comment
- `frontend/src/domains/positions/types/index.ts` (modified) - Adds `TranslateContentInput` / `TranslateContentResponse`
- `frontend/src/i18n/en/positions.json` (modified) - New `create_dialog` + `validation` blocks; `dossier_tab` relabel + `attach_existing`
- `frontend/src/i18n/ar/positions.json` (modified) - Arabic twin of the same additions

## Decisions Made

- **Default resolution stays in the dialog.** The hooks return raw ordered rows only; the "standard type / all-staff group" name-match-with-fallback is the dialog's responsibility (D-05/D-06). The acceptance criterion forbids those literals in the hooks, so the doc comments were also reworded to avoid the literal strings.
- **No api-client change for the translate error body.** The deployed edge returns a bilingual `{ error, error_ar }`, but `handleResponse` discards the body. Surfacing it would require modifying shared `api-client` (affects every consumer — Pitfall 3 / threat T-64-06). The wrapper stays a thin `apiPost` and callers must use a locally-localized generic toast.
- **Validation key set follows the plan, not the UI-SPEC table.** The UI-SPEC Copywriting Contract table lists 4 validation rows, but the plan's `<action>` and `<verify>` script require 5 (adding `title_max_length`). The plan is authoritative; all 5 keys were added in both languages.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored the worktree dependency tree (`node_modules`)**

- **Found during:** Task 1 verification (`pnpm type-check`)
- **Issue:** The Claude Code worktree was spawned without `node_modules`, so `tsc` / `lint-staged` / `pnpm build` were all unavailable — the per-task type-check gate and the pre-commit hook could not run.
- **Fix:** Ran `pnpm install --frozen-lockfile` at the worktree root. This restored the EXISTING dependency tree from the committed lockfile (mostly hardlinked from the shared pnpm store, ~14s); it added NO new package and left `pnpm-lock.yaml` unchanged (zero lockfile drift). This is explicitly distinct from the prohibited "package-manager install of a new dependency" — no new package name was introduced, so no human-verify checkpoint applies.
- **Files modified:** None tracked (worktree-local `node_modules` only; lockfile unchanged)
- **Verification:** `pnpm type-check` then ran with exit 0; pre-commit `lint-staged` + `pnpm build` + `knip` ran successfully on every task commit.
- **Committed in:** N/A (environment fix, no tracked file change)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix only restored the expected toolchain; no source or scope change. All three task commits passed the real per-task gate and the pre-commit hook.

## Issues Encountered

- The acceptance criterion "no 'Standard Position' or 'All Staff' literals in the hooks" initially tripped on my own doc comments (which referenced those names to explain where default resolution lives). Reworded the comments to remove the literal strings; the grep guard now passes. No logic was affected.

## Verification Results

- **Task 1:** `grep` queryKey/from-table checks pass; no name-match literals in hooks; `pnpm type-check` exit 0.
- **Task 2:** `translateContent` + `apiPost<TranslateContentResponse>('/translate-content'` + `TranslateContentInput` greps pass; `api-client.ts` zero diff; `pnpm type-check` exit 0.
- **Task 3:** i18n verification script prints `I18N_KEYS_OK`; both files valid JSON; diff shows only additions plus the single `create_position` value change per file (27 insertions / 1 deletion each).
- **Plan-level:** Final full `pnpm type-check` exit 0 across all three commits. Zero new packages, zero api-client changes (success criteria met). The wave-merge `vitest run` gate is the orchestrator's responsibility; this plan adds no behavior to tested components.

## Next Phase Readiness

- Plan 64-03 (`NewPositionDialog`) can now import `usePositionTypes`, `useAudienceGroups`, `translateContent`, and the translate types from `@/domains/positions`, and render every dialog/validation string bilingually.
- Plan 64-04 (`DossierPositionsTab` D-13 rewire) has both `dossier_tab.create_position` (relabeled) and `dossier_tab.attach_existing` available.
- No blockers.

## Self-Check: PASSED

All 7 key files verified present on disk; all 3 task commits (`594bacdc`, `b9dc7d89`, `bc154052`) verified in `git log`.

---

_Phase: 64-new-position-from-dossier_
_Completed: 2026-06-12_
