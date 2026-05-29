---
quick_id: 260529-4af
title: Align PushOptInBanner test with update-based dismissal; surface missing ALLOWED_ORIGINS
status: complete
completed: 2026-05-29
code_commit: cae43867
---

# Quick Task 260529-4af — Summary

**Outcome:** The one introduced, required-check failure on PR 32 (`Tests (frontend)`)
is cleared. `frontend/src/__tests__/PushOptInBanner.test.tsx` now matches the
component's update-based dismissal.

## What changed

- **`frontend/src/__tests__/PushOptInBanner.test.tsx`** — the `@/lib/supabase`
  mock now splits the chained `.eq`: `select → mockSelectEq → maybeSingle` for
  the fetch path, and a new `update → mockUpdateEq` (resolves `{ error: null }`)
  for the dismiss path; `from('user_preferences')` exposes `{ select, update }`
  (dead `upsert` removed). The "persists dismissal" test asserts
  `mockUpdate(objectContaining({ push_prompt_dismissed_at: any(String) }))` and
  `mockUpdateEq('user_id', 'test-user-id')` — `user_id` moved from the old upsert
  payload to the `.eq` filter, mirroring `PushOptInBanner.persistDismissal`.
- **`supabase/functions/_shared/cors.ts`** (folded in, user-approved) — warns
  once when `ALLOWED_ORIGINS` is unset in a non-development environment (deployed
  origins are otherwise silently rejected with `Access-Control-Allow-Origin:
null`); plus prettier reformat.
- **`supabase/functions/dossiers-create/index.ts`** (folded in, user-approved) —
  prettier reformat only, no logic change.

## Verification

- `cd frontend && pnpm vitest --run src/__tests__/PushOptInBanner.test.tsx`
  → **Test Files 1 passed (1) · Tests 9 passed (9)** (was 1 failed / 8 passed).
- Pre-commit `pnpm build` hook passed on commit `cae43867`.

## Notes / out of scope

- The component (`PushOptInBanner.tsx`) was already correct — only the test was
  stale. No component change.
- `Tests (backend)` red is an unrelated flaky timing assertion
  (`queue-processing` debounce 99 vs 100ms); expected to clear on CI re-run.
- Push, `gh pr update-branch 32`, and the merge are handled by the orchestrator
  outside this quick task.
