# Research Questions

Open questions captured from `/gsd-explore` and audit sessions. Each entry: ID, date, question, why it matters, where to look first.

## Q1 — Are TS / lint failures auto-suppressed in CI today?

**Date:** 2026-05-08
**Source:** `/gsd-explore` v6.2 investigation
**Question:** Are `pnpm type-check` and `pnpm lint` actually run on PRs and `main` builds? If yes, why do they not block despite 1580 frontend + 498 backend TS errors and 723 lint problems? If no, when did the gate stop running?

**Why it matters:** Determines whether Phase 47 of v6.2 needs an additional plan to wire the type-check / lint gate into CI, or whether the gate exists and was bypassed via `continue-on-error` / `|| true` / a deleted job. Also affects v7.0 confidence — building Intelligence Engine on a pipeline that silently allows type errors lands schema-shaped bugs in staging.

**Where to look first:**

- `.github/workflows/*.yml` — search for `type-check`, `lint`, `continue-on-error`
- `turbo.json` — task definitions for `type-check`, `lint`
- `package.json` root `scripts` — `lint`, `typecheck`, `build:ci`
- `husky/` and `.husky/` — pre-commit / pre-push hooks (v2.0 retro mentions 4 quality gates)
- Last green CI run on `main` — inspect actual job log for type-check step exit code
