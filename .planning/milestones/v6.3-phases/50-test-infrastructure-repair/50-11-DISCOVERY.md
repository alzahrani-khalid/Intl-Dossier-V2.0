---
phase: 50-test-infrastructure-repair
plan: 11
artifact: discovery
created: 2026-05-14T10:14:02Z
---

# Plan 50-11 Discovery

Command:

```bash
pnpm --filter intake-frontend exec vitest --run --reporter=default tests/a11y tests/accessibility tests/performance 2>&1 | tee /tmp/phase50-11-discovery.log
```

Result:

- Test Files: 4 failed / 4 in scoped run
- Tests: 30 failed / 30 collected
- Ceiling check: PASS — 4 owned files failing, below the 8-file ceiling
- Plan 50-09 summary: not present at discovery time, so no 50-09 auto-close evidence was available
- Auto-closed files: none

## Per-File State

| File                                                       | State                           | First signature                                                                                                                     | Disposition needed                                                            |
| ---------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `frontend/tests/accessibility/entity-search.a11y.test.ts`  | Failed suite, 0 tests collected | `Playwright Test did not expect test.describe() to be called here` at line 18                                                       | CC-5 rename to `.spec.ts` unless archaeology proves it was intended as Vitest |
| `frontend/tests/a11y/wcag-compliance.test.ts`              | Failed suite, 0 tests collected | `Transform failed` at line 13: JSX parsed in `.ts` file, `Expected ">" but found "enableValidation"`                                | CC-6 repair by converting to `.tsx` or removing JSX                           |
| `frontend/tests/performance/validation-speed.test.ts`      | Failed suite, 0 tests collected | `Transform failed` at line 35: JSX parsed in `.ts` file, `Expected ">" but found "enableValidation"`                                | CC-6 repair by converting to `.tsx` or removing JSX                           |
| `frontend/tests/accessibility/waiting-queue-a11y.test.tsx` | 30 failed tests                 | `Element type is invalid ... got: undefined`; filter-panel cluster also throws `useLanguage must be used within a LanguageProvider` | D-10 triage; likely provider migration plus import/assertion reconciliation   |

## Notes

- No `queued-with-rationale` disposition is acceptable for these default-runner files.
- If any CC-6 file is split later, `frontend/vitest.config.ts` must receive one literal exclude entry per split file.
- If `entity-search.a11y.test.ts` is renamed, `frontend/playwright.config.ts` only changes if existing Playwright globs do not collect `tests/accessibility/**/*.spec.ts`.
