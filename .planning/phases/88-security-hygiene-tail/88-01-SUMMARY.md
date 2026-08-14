---
phase: 88-security-hygiene-tail
plan: 01
subsystem: security
tags: [postgrest, filter-injection, ilike, userpicker, sweep, vitest, sec-01]

# Dependency graph
requires: []
provides:
  - SEC-01 closed — no PostgREST filter-string interpolation of user input across UserPicker + 5 sibling `.or()` search sites; shared `postgrest-escape` helper + tests

status: complete
released: operator (Option A — acceptance-judge override)
released_date: 2026-07-13
---

# 88-01 — SEC-01 PostgREST filter-injection fix

> Operator-released via Option A (see `.overseer/CHECKPOINT-P88-01-judge-override.md`).
> NOT a drover `task-done`: the work passed all 5 objective gates (build/test/lint/evidence/scope)
> on two independent codex gpt-5.6-sol attempts, but the fable **acceptance judge** returned
> "judge output unparseable — failing closed" both times — a confirmed harness false-negative
> (P88-03's acceptance judge passed; this was P88-01-specific, driven by its larger 15-file diff).
> Merged `salvage-P88-01-a1` (98ba86f7). Authored from git evidence, not re-executed.

## What changed (closes IN-04 / T-79-S2)

User-supplied search text was being interpolated into PostgREST `.or()` filter strings, so input
containing `,` `(` `)` `.` `"` could alter the query. Fix: a shared **`frontend/src/lib/postgrest-escape.ts`**
helper double-quotes/escapes values for PostgREST filter grammar, applied at every site that builds
an `.or()` search from user input.

**Sites fixed (UserPicker + the 5-site sibling sweep):**

| File                              | Change                                                                      |
| --------------------------------- | --------------------------------------------------------------------------- |
| `components/forms/UserPicker.tsx` | `handleSearch` routes the term through the escape helper (the IN-04 target) |
| `hooks/useCountries.ts`           | quote PostgREST search value                                                |
| `hooks/useOrganizations.ts`       | quote PostgREST search value                                                |
| `hooks/useWorkingGroups.ts`       | quote PostgREST search value                                                |
| `pages/events/EventsPage.tsx`     | quote PostgREST search value                                                |
| `services/commitments.service.ts` | quote PostgREST search value                                                |

Each site has a companion `__tests__/` mirror pinning the escape/quoting behavior; `lib/postgrest-escape.test.ts`
pins the escape grammar. 14 files, +206/−6.

## Verification (objective gates — green twice, re-confirmed on the integrated tree)

Per-attempt drover gates (both codex attempts): build ✓, test ✓, lint ✓, evidence ✓ (5 commits),
scope ✓ (all 15 files in scope). Re-gated on the merged milestone (`a04c1aa9`): frontend
`tsc --noEmit` 0, P88-01 vitest 7 files / 16 tests pass, `lint --max-warnings 0` 0 (i18n / rtl /
bootstrap-parity / date-format sub-gates all green).

## Provenance note (the acceptance-judge override)

The only failing gate was the fable acceptance judge, unparseable on both attempts — a harness
defect, not a code defect (5 independent objective gates prove the code). Operator invoked Option A
(accept on green objective gates) after independent verification. T-88 repudiation risk is mitigated
by the reproducible objective gates + `.overseer/CHECKPOINT-P88-01-judge-override.md` + this record.
Drover backlog item: the acceptance judge's output is unparseable for large diffs (same family as the
P87 defect-4 review/consult "unparseable" class) — needs a per-task judge-model swap or an
acceptance-input size cap.

## Requirements

SEC-01 — complete.
