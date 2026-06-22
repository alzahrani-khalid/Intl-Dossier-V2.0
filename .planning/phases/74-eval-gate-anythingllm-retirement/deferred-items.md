# Phase 74 — Deferred Items (out-of-scope discoveries)

These were observed during execution but are **out of scope** for the task that found
them (SCOPE BOUNDARY rule: only auto-fix issues directly caused by the current task).

## 74-05 — pre-existing `TS18046 'error' is of type 'unknown'` in intelligence-fn catch blocks

- **Found during:** 74-05 (AnythingLLM → on-prem re-home).
- **What:** `deno check` flags `catch (error) { ... error.message }` in the pre-existing
  request-validation / refresh-error / batch-error catch blocks of
  `intelligence-refresh`, `intelligence-refresh-v2`, and `intelligence-batch-update`.
  Under Deno's strict TS, `error` in a catch is `unknown` and needs narrowing
  (`error instanceof Error`).
- **Pre-existing:** verified against `git show HEAD:.../intelligence-refresh/index.ts` —
  every flagged line existed before 74-05. The re-homed code (`fetchIntelligenceOnPrem`,
  `generateStructuredJson`, `parseStructuredResponse`) type-checks clean; it added no new
  `TS18046`.
- **Not the CI gate:** the repo's `deno check` does not run in CI (it cannot resolve the
  monorepo workspace — `shared/` has no `package.json`, so Deno aborts before type-check).
  The real edge-fn CI gate is `pnpm run check:edge-fn-schema`, which passes.
- **Disposition:** left as-is (would be scope-creep to narrow every catch across three
  large fns). A future `chore` could narrow these catch blocks repo-wide.
