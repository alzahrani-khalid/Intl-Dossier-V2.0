# Phase 47: Type-Check Zero - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-08
**Phase:** 47-type-check-zero
**Mode:** `--auto` (Claude selected recommended option for each gray area; no user prompts)
**Areas discussed:** Suppression policy, Error category strategy, Workspace order, CI gate placement, Pre-commit hook, tsconfig posture

---

## Suppression policy

| Option                                              | Description                                                                           | Selected |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- | -------- |
| Absolute zero net-new suppressions                  | Forbid every new `@ts-ignore` / `@ts-expect-error`; track exceptions in EXCEPTIONS.md | ✓        |
| Allow `@ts-expect-error` with inline reason         | Permit narrow opt-outs if commented and issue-linked                                  |          |
| Allow either suppression with TYPE-04 documentation | Loosest reading of TYPE-04                                                            |          |

**Auto-selected:** Absolute zero net-new (recommended default).
**Notes:** TYPE-01 / TYPE-02 explicitly state "deletions or real fixes only". Auto picked the strictest interpretation; relax only if a real upstream-typing exception forces it.

---

## Error category strategy

| Option                                          | Description                                       | Selected |
| ----------------------------------------------- | ------------------------------------------------- | -------- |
| Delete unused (TS6133/TS6196)                   | Real cleanup, aligns with v6.1 dead-code stance   | ✓        |
| Underscore-prefix (`_unused`)                   | Renames to satisfy the rule without removing code |          |
| Disable `noUnusedLocals` / `noUnusedParameters` | Makes errors disappear by config                  |          |

**Auto-selected:** Delete unused.
**Notes:** Strict baseline already produced this signal — disabling rules would mask it. Underscore rename keeps dead code; deletion is the only option that improves the codebase. Risk of over-deletion (Supabase generated types, Edge Function consumers) is captured in CONTEXT.md D-04.

---

## Workspace order

| Option                                  | Description                                 | Selected |
| --------------------------------------- | ------------------------------------------- | -------- |
| Two parallel plans (frontend + backend) | Independent files, independent commits      | ✓        |
| Backend first (smaller, 498 errors)     | Faster to land, smaller blast radius        |          |
| Frontend first (larger, 1580 errors)    | Bigger workspace, gate blocked on it anyway |          |

**Auto-selected:** Two parallel plans.
**Notes:** Workspaces share no source files. Gate flips only when both reach zero, so wall-clock is dominated by the larger workspace either way. Parallel posture costs nothing and saves serial time.

---

## CI gate placement

| Option                                                   | Description                              | Selected |
| -------------------------------------------------------- | ---------------------------------------- | -------- |
| Split `type-check` into its own job                      | Parallel to `lint`, both gate downstream | ✓        |
| Keep `pnpm run typecheck` inside the existing `lint` job | Smaller diff, fewer workflow changes     |          |
| Add type-check only to `build:ci` chain                  | Gate via build, not a dedicated job      |          |

**Auto-selected:** Split into own job.
**Notes:** Failure attribution is the deciding factor — a "Lint" job failing because of a TS error is misleading. Q1 must answer first whether the existing in-`lint` typecheck step blocks today; the split happens only after TYPE-01/02 are zero so the new job is green on first run. Branch-protection update to require the new check is a manual step in the plan (CONTEXT.md D-09).

---

## Pre-commit hook

| Option                                      | Description                   | Selected |
| ------------------------------------------- | ----------------------------- | -------- |
| Keep `.husky/pre-commit` as-is              | Rely on CI; no local tsc      | ✓        |
| Add `pnpm typecheck` before `pnpm build`    | Local gate parity with CI     |          |
| Add `tsc --noEmit` only on changed packages | Compromise — partial coverage |          |

**Auto-selected:** Keep as-is.
**Notes:** Full-project tsc per commit adds seconds-to-minutes on every commit. CI already gates merges; local hook is redundant insurance. Revisit only if a TS regression slips past CI more than once.

---

## tsconfig posture

| Option                           | Description                                                            | Selected |
| -------------------------------- | ---------------------------------------------------------------------- | -------- |
| No tsconfig changes              | Strict baseline already in place; this phase is repair, not tightening | ✓        |
| Add `noUncheckedIndexedAccess`   | Stronger array/index safety                                            |          |
| Add `exactOptionalPropertyTypes` | Stricter optional handling                                             |          |

**Auto-selected:** No tsconfig changes.
**Notes:** REQUIREMENTS.md "Future (deferred)" explicitly defers strict-er options until after TYPE-01..04 land. This phase repairs drift against the existing strict baseline; tightening it now would conflate two changes.

---

## Claude's Discretion

- Per-file deletion-vs-fix call (guided by D-03/D-04).
- Sub-plan count under Phase 47 (one plan, two plans, or split-by-error-category) — D-06 only locks the parallel posture, not the file boundary.
- Optional `pnpm type-check:summary` burn-down script — useful for tracking, not required.

## Deferred Ideas

- Strict-er TS options (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) — Future (deferred) per REQUIREMENTS.md.
- Pre-push tsc hook — revisit only if CI gate is bypassed.
- Stylelint and a11y CI gates — Future (deferred).
- Knip enforcement (currently non-blocking) — orthogonal to type-check.
- Lint zero — Phase 48.
- Bundle budget reset — Phase 49.
- Intelligence Engine (v7.0) — out of scope until v6.2 ships.
