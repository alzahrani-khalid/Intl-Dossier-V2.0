# Deferred sweep E-20 — locale-correct number formatting

Branch `fix/prod-quality-sweep-260627` (PR #72 is open). You are an autonomous worker. Do this sweep,
keep the gate green, commit, and push to update the PR.

## Context (read first)

- `.planning/data-entry-assessment/findings-E-crosscutting.md` → the **E-20** finding (locale digits
  ~40 files) and `_BACKLOG.md` → E-20, for the exact scope and file list.
- Memory fact: `Intl.NumberFormat('ar')` renders **Latin** digits in Chrome → the project has a
  locale-aware formatter. **Find and read it first**: look in `frontend/src/lib/` for `format-locale`
  (e.g. `toFormatLocale` / `formatNumber` / `formatDate`). Confirm its exact API before using it.

## The fix

Replace **bare** locale-unaware number/percent/date formatting in user-facing rendering with the
project's locale helper so Arabic shows Arabic-Indic digits (or the project's chosen convention):

- `new Intl.NumberFormat(...)`, `Number.prototype.toLocaleString(...)`, hand-rolled digit rendering,
  and `Intl.DateTimeFormat` used for display — route through the project helper (pass the active
  `i18n.language` / locale as the helper expects).
- **Scope:** data-display + form fields across the app (the ~40 files E-20 lists). Prioritize KPI/
  dashboard numbers, table cells, counts, currency, dates/times in forms and detail pages.

## Rules

- Only change locale-unaware formatting to the correct helper. Do **not** alter logic, refactor
  unrelated code, or touch files outside the E-20 scope. If a usage is already locale-correct, leave it.
- Keep types + lint green: after changes run `cd frontend && pnpm exec tsc --noEmit` and
  `pnpm lint` (it runs ESLint `--max-warnings 0` + the i18n namespace check) — both MUST pass.
- Commit atomically with **`HUSKY=0 git commit`** (skips the slow build hook), staging only the files
  you changed by explicit path (never `-A`). Conventional-commit messages, e.g.
  `i18n(format): locale-correct digits in <area> (E-20)`.
- When done, **`git push origin fix/prod-quality-sweep-260627`** to update PR #72. Do NOT touch main,
  do NOT open a new PR.

## Report

Print `SWEEP E20 DONE` then: the helper used, # files changed, # call-sites converted, tsc/lint
status, and any files you intentionally skipped (already-correct / risky) with why. Work fully
autonomously; never ask a question.
