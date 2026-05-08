# Phase 47 — TYPE-04 Ledger & Histogram Baselines

This file is the **single source of truth** for retained suppressions and deferred deletions across Phase 47 (`type-check-zero`).

- **D-01:** Zero net-new `@ts-ignore` / `@ts-expect-error` introduced by Phase 47.
- **D-04:** Cross-workspace fence — frontend may not delete exports inside `backend/src/types/*` and vice versa.
- **TYPE-04:** Every retained suppression has a reason in this ledger and (where applicable) a follow-up reference. Inline reason comments at the suppression site are byte-unchanged for pre-existing suppressions; the ledger is the source of truth.

Phase-base anchor commit: `phase-47-base` (git tag) → `41f28f169a2ca3bc2ed75b407f62f9f1b14404e5`.

---

## Frontend baseline histogram

Captured at phase start (commit `41f28f16`) by running `pnpm --filter intake-frontend run type-check:summary`. Note: pnpm filter must use the package name `intake-frontend`, not the directory name `frontend`.

```
 500 TS6133    (unused local / unused import)
 353 TS2339    (property does not exist on type)
 295 TS6196    (unused exported declaration)
 151 TS2322    (type not assignable)
 124 TS7006    (parameter implicitly has 'any' type)
  48 TS18046   ('x' is of type 'unknown')
  21 TS2554    (expected N arguments, got M)
  15 TS18048   ('x' is possibly undefined)
  12 TS2345    (argument of type X not assignable to parameter type Y)
  12 TS2307    (cannot find module)
  11 TS7053    (element implicitly has 'any' type — index signature)
   8 TS2532    (object is possibly undefined)
   8 TS2353    (object literal property does not exist on type)
   6 TS2503    (cannot find namespace)
   3 TS2769    (no overload matches)
   3 TS2678    (case clause type incompatible)
   3 TS2352    (conversion type cannot overlap)
   2 TS2724    (no exported member named X)
   2 TS2367    (comparison appears unintentional)
   1 TS2739    (missing properties)
   1 TS2698    (spread types may only be created from object types)
   1 TS2561    (object literal may only specify known properties)
```

Total: **1580** errors.

Composition: TS6133 + TS6196 = **795 / 1580 = 50.3%** deletion-eligible (D-03 default). Remaining **49.7%** = real type fixes (TS2339 / TS2322 / TS7006 / TS18046 dominate).

## Backend baseline histogram

Captured at phase start (commit `41f28f16`) by running `pnpm --filter intake-backend run type-check:summary`. Note: pnpm filter must use the package name `intake-backend`, not the directory name `backend`.

```
 132 TS2345    (argument of type X not assignable to parameter type Y — dominated by ParsedQs ≠ string in src/api/*)
 123 TS6133    (unused local / unused import)
  59 TS7030    (not all code paths return a value — Express handler missing return)
  37 TS6196    (unused exported declaration)
  28 TS2339    (property does not exist on type)
  23 TS2532    (object is possibly undefined)
  13 TS18048   ('x' is possibly undefined)
  12 TS7006    (parameter implicitly has 'any' type)
  11 TS2769    (no overload matches)
  10 TS2322    (type not assignable)
   7 TS2739    (missing properties)
   6 TS18047   ('x' is possibly null)
   5 TS2741    (property X missing in type)
   5 TS2589    (type instantiation excessively deep — Supabase chain candidate D-02)
   4 TS2551    (property X does not exist; did you mean Y?)
   4 TS2459    (X cannot be used as a value)
   3 TS2554    (expected N arguments, got M)
   3 TS2307    (cannot find module — likely src/ai/__tests__ drift; RESEARCH §11.8)
   3 TS18046   ('x' is of type 'unknown')
   3 TS1205    (re-export of type-only symbol requires `export type`)
   2 TS2365    (operator cannot be applied to types)
   2 TS2352    (conversion type cannot overlap)
   1 TS2740    (type missing properties from interface)
   1 TS2538    (type cannot be used as index type)
   1 TS2430    (interface incorrectly extends interface)
```

Total: **498** errors.

Composition: TS6133 + TS6196 = **160 / 498 = 32.1%** deletion-eligible (D-03 default). Remaining **67.9%** = real type fixes (TS2345 ParsedQs + TS7030 missing return-path dominate, both clustered in `src/api/*`).

## Frontend final histogram

(populated by 47-01 Task 10 / Final)

## Backend final histogram

(populated by 47-02 final task)

---

## Retained suppressions (TYPE-04 ledger)

The two pre-existing frontend `@ts-expect-error` rows are **seeded at phase start** (Phase 47-01 Task 1, Issue 1 fix — option (a)). The inline `// @ts-expect-error <reason>` comments at these sites stay byte-unchanged for the rest of the plan; this ledger is the TYPE-04 source of truth.

| File                                                              | Suppression                                                                                                                                                                                                                                                                                                                                                    | Reason                                                                                                                                                                                                     | Follow-up                                                                                                                                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| frontend/src/components/intake-form/IntakeForm.tsx                | `// @ts-expect-error Type instantiation too deep` (pre-existing, single inline line — DO NOT modify in this plan)                                                                                                                                                                                                                                              | Supabase chained `.from().select()` exceeds tsc's instantiation limit.                                                                                                                                     | Track upstream Supabase issue or refactor the chain into a typed RPC.                                                                                                       |
| frontend/src/components/signature-visuals/**tests**/Icon.test.tsx | `// @ts-expect-error — runtime fallback for typing escapes` (pre-existing, single inline line — DO NOT modify in this plan)                                                                                                                                                                                                                                    | Test-only path; production code is typed.                                                                                                                                                                  | Replace with a typed Icon factory once signature-visuals stabilizes.                                                                                                        |
| frontend/src/types/database.types.ts                              | `// @ts-nocheck` (top of file, prepended by 47-01 Task 2)                                                                                                                                                                                                                                                                                                      | Auto-generated Supabase types. Defensive `@ts-nocheck` so any future `supabase gen types` regen that introduces unused-helper errors is pre-suppressed without hand-edit. D-11 prohibits tsconfig exclude. | None — generated file is inert. Revisit if Supabase generator stops emitting unused helpers.                                                                                |
| backend/src/types/database.types.ts (lines 37369–37482)           | DEFERRED to 47-02 — six TS6196/TS6133 errors (Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes, Constants helpers). Surface during the frontend `tsc --noEmit` because frontend deep-imports backend types via `../../../../backend/src/types/database.types`. Owned by 47-02 (cross-workspace fence D-04 forbids 47-01 from editing backend source). | RESEARCH §4.1 misidentified the file path; the auto-generated Supabase helpers actually live in `backend/src/types/database.types.ts`, not `frontend/src/types/database.types.ts`.                         | 47-02 must apply the same `@ts-nocheck` strategy at the top of `backend/src/types/database.types.ts`. Until 47-02 lands, these 6 errors persist in the frontend tsc output. |

## Deferred deletions (cross-surface consumers)

D-04 four-globbed-grep evidence for symbols that COULD NOT be deleted because at least one of `frontend/src`, `backend/src`, `supabase/functions`, `tests`, or `shared` still consumes them. Each row records the symbol, the surviving consumer, and the reason deletion is deferred.

| Symbol                                                                           | Surface                                                 | Consumer                                                                                               | Reason deferred                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tables`, `TablesInsert`, `TablesUpdate`, `Enums`, `CompositeTypes`, `Constants` | `backend/src/types/database.types.ts` lines 37369–37482 | None in-repo, but they are auto-generated Supabase helpers (regenerated on every `supabase gen types`) | RESEARCH §4.1 misidentified the file as `frontend/src/types/database.types.ts`. The errors actually originate in `backend/src/types/database.types.ts` and surface during `pnpm --filter intake-frontend type-check` because frontend deep-imports backend types. Owned by 47-02 — cross-workspace fence D-04 forbids 47-01 from editing backend source. 47-02 must allowlist the file with `@ts-nocheck` at the top (same strategy as Task 2 applied to the wrong file) to clear these 6 errors. |
