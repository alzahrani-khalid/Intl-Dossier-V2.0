# Phase 71 — Deferred Items (out-of-scope discoveries)

## 71-05 Task 2: RelationshipGraphPage.test.tsx pre-existing failure (NOT fixed — out of scope)

- **File:** `frontend/src/pages/relationships/__tests__/RelationshipGraphPage.test.tsx`
- **Error:** `[vitest] No "initReactI18next" export is defined on the "react-i18next" mock.`
- **Cause:** that test file's local `vi.mock('react-i18next', ...)` (L9) omits the
  `initReactI18next` export that `src/i18n/index.ts` (L533) imports. Surfaces when the
  suite transitively loads the real i18n bootstrap.
- **Why deferred:** owned by plan 71-04's RelationshipGraphPage test (last touched by
  commit `c8bf07b2`, phase 63). NOT caused by 71-05 (Task 1 = i18n JSON values only;
  Task 2 helper has zero react-i18next imports). Scope boundary: only auto-fix issues
  directly caused by the current task. The 71-05 target test
  `CommandPalette.analyze.test.tsx` passes 3/3 in isolation.
