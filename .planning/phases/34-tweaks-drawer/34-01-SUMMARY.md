---
phase: 34
plan: 01
plan_id: 34-01
subsystem: tweaks-drawer
tags: [scaffolds, ci-gate, nyquist, vitest, playwright]
requires: []
provides:
  - THEME-01 scaffold (TweaksDrawer)
  - THEME-02 scaffold (persistence + migrator)
  - THEME-03 scaffold (directionDefaults)
  - THEME-04 scaffold (/themes redirect)
  - SC-4 scaffold (focus trap LTR+RTL)
  - tweaks.* label-parity scaffold
  - deletion-sweep CI gate
affects:
  - frontend/vitest test surface (5 new skip files, 29 todos)
  - frontend/playwright test surface (2 new spec files, 4 skipped)
  - scripts/ (new CI bash gate)
tech-stack:
  added: []
  patterns:
    - 'Nyquist Rule: every Wave 1-3 requirement has a skip-until-implemented acceptance test'
    - 'Scaffolds committed as `describe.skip` / `test.skip` — run green under --run'
    - 'Bash CI gate with hard-coded PATTERNS array + `set -euo pipefail`'
key-files:
  created:
    - frontend/src/components/tweaks/TweaksDrawer.test.tsx
    - frontend/src/components/tweaks/persistence.test.tsx
    - frontend/src/design-system/directionDefaults.test.ts
    - frontend/src/i18n/label-parity.test.ts
    - frontend/tests/bootstrap/migrator.test.ts
    - frontend/tests/e2e/tweaks/focus-trap.spec.ts
    - frontend/tests/e2e/tweaks/redirect.spec.ts
    - scripts/check-deleted-components.sh
  modified: []
decisions:
  - 'Scaffolds use it.todo + describe.skip so they surface in vitest output as pending without failing'
  - 'Deletion gate PATTERNS hard-coded (not dynamic) to prevent silent drift between script and research audit'
  - 'Gate script intentionally exits 1 in Wave 0 — Plan 08 (Wave 3) makes it green by performing the deletions'
metrics:
  duration: ~15m (continuation executor only; Task 1 committed separately by prior agent)
  completed: 2026-04-21
---

# Phase 34 Plan 01: Wave 0 Nyquist Scaffolds — Summary

Create 8 skip-only test scaffolds + 1 CI grep-gate script so every downstream Phase 34 plan
(02–08) has a pre-existing automated acceptance command. Satisfies the Nyquist Rule: every
future `<automated>` verify step references a file that already exists on `main` as of Wave 0.

## Commits

| Commit     | Type | Scope | Summary                                                                               |
| ---------- | ---- | ----- | ------------------------------------------------------------------------------------- |
| `9b24c17b` | test | 34-01 | add vitest scaffolds for THEME-01..03 + migrator + label-parity (Task 1, prior agent) |
| `aeba534a` | test | 34-01 | add playwright scaffolds + deletion CI gate (Task 2, this agent)                      |
| `<final>`  | docs | 34-01 | summary (this file)                                                                   |

## Files changed

- `frontend/src/components/tweaks/TweaksDrawer.test.tsx` (new, 9b24c17b) — THEME-01 scaffold
- `frontend/src/components/tweaks/persistence.test.tsx` (new, 9b24c17b) — THEME-02 scaffold (9 it.todo)
- `frontend/src/design-system/directionDefaults.test.ts` (new, 9b24c17b) — THEME-03 scaffold (D-16)
- `frontend/src/i18n/label-parity.test.ts` (new, 9b24c17b) — tweaks.\* EN/AR parity scaffold
- `frontend/tests/bootstrap/migrator.test.ts` (new, 9b24c17b) — bootstrap.js i18nextLng→id.locale scaffold
- `frontend/tests/e2e/tweaks/focus-trap.spec.ts` (new, aeba534a) — SC-4 focus trap LTR+RTL
- `frontend/tests/e2e/tweaks/redirect.spec.ts` (new, aeba534a) — THEME-04 /themes → /
- `scripts/check-deleted-components.sh` (new, aeba534a, mode 0755) — Plan 08 deletion CI gate

## Tasks completed

1. **Task 1 — Unit/integration test scaffolds (Vitest).** 5 files, 29 `it.todo` stubs across
   `describe.skip` blocks. Covers THEME-01 (drawer render EN+AR, trigger, close), THEME-02
   (all 6 `id.*` keys round-trip + garbage fallback + SecurityError swallow + migrator
   idempotency & junk-discard & i18nextLng cleanup), THEME-03 (4 directions × {mode,hue} defaults
   D-16 + atomic write), tweaks.\* label parity (no EN-only / no AR-only orphan keys). Commit `9b24c17b`.
2. **Task 2 — Playwright E2E scaffolds + deletion CI gate.** 2 Playwright specs (4 `test.skip`):
   SC-4 focus trap in LTR and RTL with ESC + focus return, THEME-04 redirect + T-34-04 no-loop
   guard. 1 bash gate script at `scripts/check-deleted-components.sh` with 11 hard-coded regex
   patterns + navigationData soft-ref check, `set -euo pipefail`, chmod 0755. Commit `aeba534a`.

## Verification

| Check                                 | Command                                                                                                                                                            | Result                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Vitest scaffolds run green (skipped)  | `pnpm exec vitest run src/components/tweaks/*.test.tsx src/design-system/directionDefaults.test.ts src/i18n/label-parity.test.ts tests/bootstrap/migrator.test.ts` | PASS — 5 files skipped, 29 todos, 0 failures |
| Playwright enumerates 4 skipped tests | `pnpm playwright test tests/e2e/tweaks/ --list`                                                                                                                    | PASS — 4 tests in 2 files                    |
| Bash script syntax valid              | `bash -n scripts/check-deleted-components.sh`                                                                                                                      | PASS                                         |
| Bash script is executable             | `test -x scripts/check-deleted-components.sh`                                                                                                                      | PASS — mode 0755                             |
| Zero physical CSS in new files        | `grep -rEn "textAlign: ['\"]right\|\\bm[lr]-\|\\bp[lr]-\|text-left\|text-right" <new files>`                                                                       | PASS — zero hits                             |

**Out-of-scope observation (logged, not fixed):** broader vitest invocation `pnpm test -- tweaks bootstrap design-system/direction i18n/label-parity --run` triggers the full frontend suite (positional args are treated as filename filters, not all match), surfacing 162 pre-existing test-file failures unrelated to Phase 34 (e.g. missing `useDraftMigration` module referenced from its test). Per Rule SCOPE BOUNDARY, these are pre-existing and not addressed here; the Wave 0 acceptance is the 5-file scoped run above. Pre-existing failures may be triaged in a dedicated tech-debt plan if desired.

## Deviations

None. All files match the plan spec verbatim (content, style, file layout). The bash script
was authored with mode 0644 by the prior executor and promoted to 0755 via `chmod +x` before
commit (the plan explicitly requires `chmod +x` — this is normal setup, not a spec deviation).

## Known Stubs

All scaffolds are intentional Nyquist-rule stubs; each has an explicit `TODO Plan XX:` marker
naming the downstream plan that promotes the skip to a live assertion:

- TweaksDrawer.test.tsx → Plan 04 (drawer impl)
- persistence.test.tsx → Plans 02, 03
- directionDefaults.test.ts → Plan 02
- label-parity.test.ts → Plan 05 (i18n)
- migrator.test.ts → Plan 03 (bootstrap)
- focus-trap.spec.ts → Plans 04 / 06
- redirect.spec.ts → Plan 07
- scripts/check-deleted-components.sh → Plan 08 makes it pass (currently exits 1 by design)

## Self-Check

Files confirmed present:

- `frontend/src/components/tweaks/TweaksDrawer.test.tsx` — FOUND
- `frontend/src/components/tweaks/persistence.test.tsx` — FOUND
- `frontend/src/design-system/directionDefaults.test.ts` — FOUND
- `frontend/src/i18n/label-parity.test.ts` — FOUND
- `frontend/tests/bootstrap/migrator.test.ts` — FOUND
- `frontend/tests/e2e/tweaks/focus-trap.spec.ts` — FOUND
- `frontend/tests/e2e/tweaks/redirect.spec.ts` — FOUND
- `scripts/check-deleted-components.sh` — FOUND (mode 0755)

Commits confirmed in `git log --oneline`:

- `9b24c17b` — FOUND
- `aeba534a` — FOUND

## Self-Check: PASSED
