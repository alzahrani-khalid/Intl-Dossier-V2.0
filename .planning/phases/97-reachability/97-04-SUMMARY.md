---
phase: 97-reachability
plan: 04
wave: 1
status: work-complete-gates-blocked
requirements: [NAV-01]
files_modified:
  - frontend/src/lib/dossier-type-guards.ts
  - frontend/src/lib/dossier-routes.ts
  - frontend/src/services/dossier-api.ts
  - frontend/src/types/dossier-context.types.ts
  - frontend/src/types/relationship.types.ts
  - frontend/src/components/intelligence/AlertRuleForm.tsx
  - frontend/src/routes/_protected.tsx
  - frontend/src/pages/dossiers/CreateDossierHub.tsx
  - frontend/src/pages/dossiers/DossierListPage.tsx
gate_1: RED (one clause — see BLOCKED G1)
gate_2: GREEN-BUT-VACUOUS (its test half never executes — see BLOCKED G2)
---

# 97-04 — Collapse the parallel dossier-type lists

**Executed 2026-08-17** on `milestone/v10.0-trust`, base HEAD `4cf27100e`.

The substance of the plan is delivered: one literal dossier-type list, one spread-derived card
set, a compile-time anti-merge guard proven by mutation, and nine files re-pointed with zero
behaviour change. **Two gate defects were found and are reported in `## BLOCKED` rather than
worked around.** Neither gate was edited.

## Task 1 — the canonical home

`frontend/src/lib/dossier-type-guards.ts` now carries, replacing the hand-written 7-member union
that was at `:33`:

| Line  | Declaration                                                                                              |
| ----- | -------------------------------------------------------------------------------------------------------- |
| `:45` | `export const DOSSIER_TYPES = [` … `] as const` — 7 members, in the CreateDossierHub / D-02 pinned order |
| `:58` | `export type DossierType = (typeof DOSSIER_TYPES)[number]`                                               |
| `:72` | `export const DOSSIER_CARD_TYPES = [...DOSSIER_TYPES, 'elected_official'] as const`                      |
| `:78` | `export type DossierCardType = (typeof DOSSIER_CARD_TYPES)[number]`                                      |
| `:93` | `type AssertNever<T extends never> = T`                                                                  |
| `:94` | `export type _EoIsNotADbType = AssertNever<Extract<DossierType, 'elected_official'>>`                    |

`PersonSubtype` and every other export are byte-unchanged; all 34 importing files still resolve
(`pnpm typecheck` 6/6, below). Both declarations carry a comment naming which set they are, that
they must not be merged, and what merging causes — written as DOCUMENTARY, with the code saying
in as many words that `_EoIsNotADbType` is the enforcement.

**`:94` is `export type`, not `type`. That one word is the whole of Gate 1's red — see BLOCKED G1.
It is forced by `frontend/tsconfig.json:15 noUnusedLocals: true` and it does not weaken the
guard by any measurable amount (the merge drill below fires on the exported form).**

`lib/dossier-routes.ts`: `DOSSIER_TYPE_TO_ROUTE` retyped `Record<string, string>` →
`Record<DossierCardType, string>`. **No key or value changed** (`git diff` shows the map body
untouched). The stale header comment at `:10-11` — "elected_official is now a person_subtype, all
persons use /persons route", which contradicted its own `:20` entry `elected_official:
'elected-officials'` and the live routes — was corrected to describe the map that exists, with a
sentence recording that it previously claimed the opposite. `getDossierRouteSegment` gained a
two-line widened lookup (`Record<string, string | undefined>`) because the argument is an
arbitrary string and the miss case falls back to `'countries'`; runtime behaviour is identical,
proven by the two `dossier-routes` spec files below.

The three duplicate unions became aliases of the canonical import:

| Site                                | Before                              | After                                                  |
| ----------------------------------- | ----------------------------------- | ------------------------------------------------------ |
| `services/dossier-api.ts:26`        | 7-member union                      | `:28` `export type DossierType = CanonicalDossierType` |
| `types/dossier-context.types.ts:71` | 7-member union                      | `:74` same                                             |
| `types/relationship.types.ts:46`    | 7-member union (3rd distinct order) | `:49` same                                             |

**No consumer failed to typecheck against the aliased unions.** The three were structurally
identical to the canonical, so nothing was relying on a divergence and no cast was needed
anywhere. `frontend/node_modules/.bin/tsc --noEmit` → `RC=0`.

## Task 2 — the four re-points

| File                                              | Change                                                                         | Set                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------ |
| `services/dossier-api.ts:702-711`                 | literal deleted; `DOSSIER_TYPES.forEach`                                       | DB-7                                       |
| `components/intelligence/AlertRuleForm.tsx:38-46` | literal deleted; `z.enum(DOSSIER_TYPES)`                                       | DB-7                                       |
| `routes/_protected.tsx:20-31`                     | literal + `ValidDossierType` deleted; `DOSSIER_CARD_TYPES` / `DossierCardType` | CARD-8                                     |
| `pages/dossiers/CreateDossierHub.tsx:41-64`       | `HubCardType` + literal deleted; `DossierCardType` / `DOSSIER_CARD_TYPES`      | CARD-8                                     |
| `pages/dossiers/DossierListPage.tsx:75-83`        | literal deleted; `DOSSIER_TYPES`                                               | DB-7 (97-05 widens it, with the count fix) |

`z.enum` accepted the `as const` array directly — no `satisfies`, no cast. `_protected.tsx`'s
membership-test guard function body is verbatim apart from the constant it reads and its return
predicate type. `dossier-api.ts`'s `throw` on PostgREST error is untouched (no catch, no default
added). `DossierListPage` did NOT gain the 8th type. `CreateDossierHub`'s file-header comment at
`:14-17`, which taught "widen locally rather than touching the canonical domain type", was
replaced with a pointer to the canonical home and a sentence saying that local widening is what
produced the four copies.

## Gates — both directions, actual output

### Gate 1

**RED on the undone tree — for its subject, verified clause by clause** (all three environment
preconditions returned 0, so this is C2-valid, not a tooling death):

```
test -f G: 0
test -x TSC: 0
test -d src: 0
SUBJECT clause DOSSIER_CARD_TYPES decl: 1  <-- this is where RED lands
GATE1_RC=1
```

**RED after the work too**, at a different clause — the exact-form anchor on `:94`:

```
clause 4  DOSSIER_CARD_TYPES exact-form anchor:  RC=0
clause 5  ^type _EoIsNotADbType exact-form anchor:  RC=1   <-- GATE 1 DIES HERE
  what is actually on disk:
94:export type _EoIsNotADbType = AssertNever<Extract<DossierType, 'elected_official'>>
  the exported form matches the ONLY-DIFFERENCE anchor:  RC=0
GATE1_RC=1
```

**GREEN with that single anchor's `^type` → `^export type` and NOTHING else altered** — every
other clause of the gate, including the full `pnpm typecheck`, passes. Labelled a
DEMONSTRATION, not a gate run; the gate on disk is unedited:

```
GATE1_DEMO_RC=0
...
intake-frontend:type-check: > tsc --noEmit
 Tasks:    6 successful, 6 total
  Time:    37.704s
```

**The anti-merge drill fired, on the real file.** `${TMPDIR}/p97-04-guard-drill/merged.ts`,
member count asserted 7 → 8 before compiling:

```
merged member count = 8  (must be 8)
/T/p97-04-guard-drill/merged.ts:95:43 - error TS2344: Type '"elected_official"' does not satisfy the constraint 'never'.

95 export type _EoIsNotADbType = AssertNever<Extract<DossierType, 'elected_official'>>
                                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Found 1 error in /T/p97-04-guard-drill/merged.ts:95
merged RC=2
TS2344 PRESENT: yes
_EoIsNotADbType NAMED: yes
```

**The spread-derived claim was checked behaviourally, not by substring.** `spread.ts` took the
same 7 → 8 merge, had the assertion deleted (the gate's own `(export )?` alternation removed the
exported form — `grep -c "_EoIsNotADbType = AssertNever" spread.ts` = `0`), and got
`const _p97CardCount: 9 = DOSSIER_CARD_TYPES.length` appended:

```
spread RC=0
```

**Two constructed WRONG states, both observed red:**

```
# neutered guard (AssertNever<T> instead of AssertNever<T extends never>) + merge
94:type AssertNever<T> = T
neutered+merge RC=0   -> guard NEUTERED, produces NO TS2344, so the drill correctly rejects it

# hand-typed 8-member card array instead of a spread
73:export const DOSSIER_CARD_TYPES = ['country',...,'elected_official'] as const
handtyped.ts:702:7 - error TS2322: Type '8' is not assignable to type '9'.
hand-typed card set RC=2
```

**Counted clauses, before → after, each with a positive instrument control** (`grep` here is a
ugrep wrapper honoring `.gitignore`, so every zero is instrument-tested):

| Clause                                  | Threshold | Before | After | Control (same anchor, wildcard name)                       |
| --------------------------------------- | --------- | ------ | ----- | ---------------------------------------------------------- |
| `N` members inside the `as const` block | `-eq 7`   | n/a    | **7** | sed range + `^\s*'` verified against BSD grep `\s` support |
| `U` `^export type DossierType =$`       | `-eq 0`   | 4      | **0** | `^export type <X> =$` → **81** files                       |
| `U1` `^export type DossierType = '`     | `-eq 0`   | 0      | **0** | `^export type <X> = '` → **96** files                      |
| `H` `^export const DOSSIER_TYPES = \[`  | `-eq 1`   | 0      | **1** | `^export const <X> = \[` → **15** files                    |
| merged-copy member count                | `-eq 8`   | n/a    | **8** | asserted before compiling                                  |

### Gate 2

**RED on the undone tree, for its subject** — the import loop exits at its first file:

```
MISSING dossier-type-guards in: frontend/src/services/dossier-api.ts
GATE2_RC=1
```

**Exit 0 after the work — but the exit code is not trustworthy. See BLOCKED G2: the vitest half
never runs.** The deterministic half is genuinely green:

```
PRESENT dossier-type-guards  services/dossier-api.ts
PRESENT dossier-type-guards  components/intelligence/AlertRuleForm.tsx
PRESENT dossier-type-guards  routes/_protected.tsx
PRESENT dossier-type-guards  pages/dossiers/CreateDossierHub.tsx
PRESENT dossier-type-guards  pages/dossiers/DossierListPage.tsx
absence: dossier-api  '^  const types: DossierType[] = [$' = 0     (was 1)
absence: _protected   '^const VALID_DOSSIER_TYPES = [$'    = 0     (was 1)
presence DOSSIER_TYPES      in dossier-api      = 2
presence DOSSIER_CARD_TYPES in _protected       = 2
presence DOSSIER_CARD_TYPES in CreateDossierHub = 4
presence DOSSIER_TYPES      in AlertRuleForm    = 4
presence DOSSIER_TYPES      in DossierListPage  = 4
GATE2_RC=0
```

**The order-pin test, run correctly by hand** (spec existence asserted first; the spec is
byte-unchanged — `git diff --stat HEAD --` on it is empty; expected counts hardcoded at 1 file /
3 tests):

```
 RUN  v4.1.7 /Users/.../Intl-Dossier-V2.0/frontend

 ✓ src/pages/dossiers/__tests__/CreateDossierHub.test.tsx > CreateDossierHub > renders 8 dossier type cards in DOSSIER_TYPES enum order 21ms
 ✓ src/pages/dossiers/__tests__/CreateDossierHub.test.tsx > CreateDossierHub > each card links to its per-type wizard route 5ms
 ✓ src/pages/dossiers/__tests__/CreateDossierHub.test.tsx > CreateDossierHub > uses logical Tailwind properties only ... 4ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
REAL_VITEST_RC=0
```

**Five adjacent specs that consume the changed modules** — not asked for by either gate, run
because `dossier-routes.ts` has two spec files and a retyped map could break either:

```
all 5 specs exist
 Test Files  5 passed (5)
      Tests  52 passed (52)
ADJACENT_RC=0
```

(`src/lib/dossier-routes.test.ts`, `src/lib/__tests__/dossier-routes.test.ts`,
`useQuickSwitcherSearch.test.ts`, `DrawerCtaRow.test.tsx`, `WorkBoard.test.tsx`.)

**Lint + format**, over the nine files: `prettier --write` (it collapsed the `dossier-api.ts`
import to one line), then `eslint -c eslint.config.mjs --max-warnings 0` → `RC=0`.

### C1 tree-integrity

`git status --porcelain` before and after differ by exactly my nine `M` lines plus four
`tests/e2e/97-*.spec.ts` files belonging to OTHER wave-1 workers (not mine, not committed by
me). Every drill artifact lives under `${TMPDIR}/p97-04-guard-drill` — `ls` shows only
`merged.ts` and `spread.ts`; nothing was written into the repo. The seven exogenous paths are
still in exactly their session-start state and appear in no commit of mine.

## POPULATION — re-derivation and residue

`export type DossierType =` across `frontend/src`, **4 before → 4 after**, but zero are now
hand-written:

```
BEFORE                                                     AFTER
types/dossier-context.types.ts:71  export type DossierType =    :74  = CanonicalDossierType
types/relationship.types.ts:46     export type DossierType =    :49  = CanonicalDossierType
lib/dossier-type-guards.ts:33      export type DossierType =    :58  = (typeof DOSSIER_TYPES)[number]
services/dossier-api.ts:26         export type DossierType =    :28  = CanonicalDossierType
```

**PARALLEL-TRUTH-01 residue: THREE new same-class copies found, none of them in the plan's
seven-site table and none in `97-PARALLEL-TRUTH-CLASS.md`'s register of six.** Handed to 97-09
per the plan; **not absorbed**, because they sit in files this plan does not own:

| Site                                                                                                   | Copy of                                                 | Suggested owner                                       |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------- |
| `components/dossier/DossierTypeGuide.tsx:380` `const types: DossierType[] = [...7...]`                 | the DB-7, in a FOURTH distinct order                    | 97-09 to route; a mechanical `DOSSIER_TYPES` re-point |
| `components/dossier/wizard/hooks/useDraftMigration.ts:14` `VALID_TYPES: readonly string[] = [...7...]` | the DB-7                                                | 97-09 to route                                        |
| `components/keyboard-shortcuts/CommandPalette.tsx:305` `DOSSIER_TYPE_ORDER: string[] = [...8...]`      | the CARD-8 — its own comment says "all 8 dossier types" | 97-09 to route                                        |

So the class was **six copies, not nine**. The register undercounts by three.

One NEAR-copy, recorded rather than filed, for 97-09's judgment:
`pages/dossiers/DossierListPage.tsx:904` `entityTypes={['dossier', ...the 7]}` — a search-entity
vocabulary that is the DB-7 plus `'dossier'`, i.e. a different population. Left untouched because
the plan scopes this file to `:75-83` and says nothing else in it changes.

**OUTSIDE the population, confirmed untouched:** `routes/_protected/compare.tsx:16` (present,
97-06 owns it) and `components/entity-comparison/EntityComparisonSelector.tsx` (icon map, 97-06).
Four wider entity-type vocabularies were inspected and ruled NOT this truth — they are
legitimately their own sets, each carrying members the dossier type set does not have:
`preview-layout.types.ts` `PREVIEW_ENTITY_TYPES` (+`position`/`mou`/`commitment`/`assignment`/
`intelligence_signal`), `tag-hierarchy.types.ts` `TAG_ENTITY_TYPES` (+`document`/`brief`),
`CreateDelegationDialog.tsx` `RESOURCE_TYPES` (+`brief`/`intelligence_report`/
`data_library_item`), `EntitySearchDialog.tsx` (+`position`/`mou`/`assignment`).

## BLOCKED

### G1 — Gate 1 cannot pass as frozen: its own anchor forbids the only form that typechecks

**Two clauses of Gate 1 contradict each other.** The gate asserts

```
command grep -q "^type _EoIsNotADbType = AssertNever<Extract<DossierType, 'elected_official'>>$"
```

— a NON-exported alias — and then, in the same `&&` chain, asserts `pnpm typecheck`. Those cannot
both hold. `frontend/tsconfig.json:15` sets `"noUnusedLocals": true`, and root `pnpm typecheck`
→ `turbo run type-check` → `intake-frontend: tsc --noEmit` reads that file. A compile-time
assertion is by definition referenced nowhere, so the unexported form is TS6196. Measured on the
real file, with the mandated form in place and nothing else wrong in the tree:

```
$ cd frontend && node_modules/.bin/tsc --noEmit
src/lib/dossier-type-guards.ts(88,6): error TS6196: '_EoIsNotADbType' is declared but never used.
RC=2
```

That was the ONLY error — the tree is otherwise clean, so this is not a pre-existing failure
being blamed on the gate.

**Exhausted, not assumed.** TypeScript marks a local "used" by exactly one of: a reference in the
same file; an `export`; an ambient declaration; or merging with an exported same-name
declaration. Each fails here:

- **A reference** breaks the gate's own spread drill. That drill deletes the assertion line and
  then requires `spread.ts` to compile CLEAN; any surviving reference is TS2304. This kills
  `export type { _EoIsNotADbType }`, a downstream alias, and a use inside `DossierCardType`
  alike. A same-line reference is excluded by the anchor's `$`.
- **`export`** is excluded by the anchor's `^type`.
- **Ambient / `declare`** changes the line and fails the anchor.
- **Value/type same-name merge** (`export const _EoIsNotADbType = …` beside the alias) would
  work mechanically, and is rejected: it is dead code added for no reason but to quiet a
  compiler flag, which is gaming the gate.
- **`// @ts-ignore`** was considered and is self-defeating — it would suppress the TS2344 the
  merge drill requires, so the drill would exit 0 and the gate would fail anyway. Good.
- **Editing `frontend/tsconfig.json`** is out: not in `files_modified`, and it would weaken a
  repo-wide guard to satisfy a gate.

**The frozen gate contradicts itself, and its own text says which side is wrong.** The gate's
mutation script deletes the assertion with `/^(export )?type _EoIsNotADbType = .*$/m` — it
explicitly ANTICIPATES the exported form. Only the `grep` clause rejects it. The exported form
was verified to satisfy every drill the gate defines (merged → TS2344 naming `_EoIsNotADbType`;
spread → clean; neutered → correctly rejected; hand-typed → TS2322).

**What was landed and why.** `export type _EoIsNotADbType = …`. The alternative — landing the
literal anchor form — leaves `milestone/v10.0-trust` failing `tsc` for eleven parallel wave-1
workers and CI, in exchange for a `grep` match. The guarantee the criterion actually claims
("adding `elected_official` to the DB-7 constant fails the BUILD via a type assertion, not a
comment") is delivered in full and proven by mutation above; `export` changes nothing about it.
The code comment at `:87-92` records the reason and points here.

**Ruling requested:** amend Gate 1's clause 5 anchor to
`^export type _EoIsNotADbType = AssertNever<Extract<DossierType, 'elected_official'>>$`, or to
`^(export )?type _EoIsNotADbType = …$` to match its own mutation script. **This is a
GATE-STANDARD C1-clause-2 miss of the classic shape**: the two standalone `tsc` drills were run
against real copies during plan revision, but the FULL chain — canonical block present AND
`pnpm typecheck` — was never constructed, so the one clause that only fires in the done state
was never observed. It is also a C3 miss: `noUnusedLocals` in the gate's own compiler config was
not resolved against the artifact form the gate mandates.

### G2 — Gate 2's test half is VACUOUS: `--filter frontend` matches zero projects

Gate 2 ends with

```
pnpm --filter frontend exec vitest run src/pages/dossiers/__tests__/CreateDossierHub.test.tsx 1>&2
```

**The frontend workspace package is named `intake-frontend`, not `frontend`.** `pnpm --filter`
matches package NAME, so this matches nothing, prints one line to stdout, and exits 0. Measured,
with a deliberately non-existent spec as the control:

```
$ node -e "console.log(require('./frontend/package.json').name)"
intake-frontend

$ pnpm --filter frontend exec vitest run src/pages/dossiers/__tests__/CreateDossierHub.test.tsx
No projects matched the filters in "/Users/.../Intl-Dossier-V2.0"
  RC=0

$ pnpm --filter frontend exec vitest run src/does/not/exist.test.tsx
No projects matched the filters in "/Users/.../Intl-Dossier-V2.0"
  RC=0   <- the clause cannot fail for ANY input
```

So the clause is unfalsifiable, and **the order test never ran in either direction** — not in
the RED half (the gate died earlier, at the import loop) and not in the green half. The
acceptance criteria call that test "the behaviour-preservation proof for the riskiest re-point"
and say "The vitest half runs in both directions in that same scratch copy"; the gate does not
check it. C3 (`pnpm --filter <name>` must resolve in the workspace it runs in), C5 (a search /
selector that matches nothing must not pass vacuously), and C10 (the criterion names a test the
gate never runs).

**This one is worse than G1 in kind**: G1 is red and loud, G2 is a green that measures nothing.
Gate 2's reported `RC=0` above should not be read as evidence about the test.

**Ruling requested:** change the clause to `pnpm --filter intake-frontend exec vitest run …`
(verified working — output pasted in the Gate 2 section, 3 passed) or `pnpm --filter ./frontend`.

**This is NOT confined to 97-04, and C9 therefore applies.** The sweep was run rather than
suggested — `command grep -n -- "--filter frontend"` across
`.planning/phases/97-reachability/*.md`:

| File               | Occurrences | Inside an `<automated>` gate?                        |
| ------------------ | ----------- | ---------------------------------------------------- |
| `97-04-PLAN.md`    | 1           | yes — Task 2, this plan                              |
| `97-07-PLAN.md`    | 2           | **yes — both, `:154` and `:246`**                    |
| `97-08-PLAN.md`    | 1           | **yes — `:176`**                                     |
| `97-11-PLAN.md`    | 2           | **yes — `:172`**; `:176` is prose                    |
| `97-12-PLAN.md`    | 1           | prose (`:100`, names it as a known coarse aggregate) |
| `97-RESEARCH.md`   | 2           | n/a                                                  |
| `97-VALIDATION.md` | 2           | n/a                                                  |

Control: `--filter intake-frontend` occurs **once** in the whole phase — in this summary. So
**five live gates across four plans (97-04, 97-07 ×2, 97-08, 97-11) carry a clause that exits 0
for any input, including a spec that does not exist.** Every one of them is a green that measures
nothing, and each should be repointed in the same edit as the ruling. Worth checking whether the
97-12 prose entry, which lists `pnpm --filter frontend` among the phase's "known coarse-aggregate
gates", should instead record it as a known-VACUOUS one.

**Neither gate was edited. No criterion was weakened. Nothing below was claimed green:** Gate 1
is RED as frozen; Gate 2's exit 0 is disclosed as vacuous on its test half.
