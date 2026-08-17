# Parallel source of truth — a CONFIRMED defect class

**Committed on purpose**, beside `97-MODEL-SEATS.md`. The overseer chain
(`.tickmarkr/overseer/`) is **gitignored**; this class outlives Phase 97 and the next phase
must be able to find it. Ruled by `RULING-P97-04-PARALLEL-TRUTH-CLASS.md`, **amended the same
day by `RULING-P97-05-AMENDS-04.md`** (2026-08-17, overseer under standing delegation; the
operator did not sign either).

> **The amendment is itself an instance of the lesson, recorded rather than tidied away.**
> `-04`'s intent stands; its _prescription_ was superseded because the order was wrong three
> ways: it named a canonical that **does not uniquely exist** (the fifth instance below was
> inside the proposed cure), its literal form was **unbuildable** (a TypeScript union cannot be
> iterated at runtime), and it **assumed one set where there are two** (widening the API-side
> list would create a bucket no query can fill — the original defect in a new costume). An
> order carrying authority is still an unreviewed artifact.

## The shape

**A second copy of a truth that already has a canonical home — inert or wrong until something
reads it.** The copies do not disagree today. They agree _by authorship_, not by construction,
which means nothing prevents the next edit from making them disagree, and nothing announces it
when they do.

## Confirmed instances

<!-- prettier-ignore -->
| Instance | Parallel copy of | Status |
|---|---|---|
| `frontend/src/services/auth.ts` | the live zustand auth store (the `'auth-storage'` key) + its own module-level `onAuthStateChange` | `RULING-P92-06`; NAV-04 sub-item; resolve in-phase (delete-or-own) |
| `frontend/src/components/layout/QuickNavigationMenu.tsx` | the `navigation-config.ts` route list | `RULING-P97-03`; zero importers (instrument-tested vs a 230-hit control); resolve in-phase |
| The 7-type array ×3 — `DossierListPage.tsx:75`, `dossier-api.ts:702`, `CreateDossierHub.tsx:55` | canonical `DossierType` | `RULING-P97-04`; **derive, do not widen** |
| `DossierType` union ×3 — `lib/dossier-type-guards.ts:33`, `types/dossier-context.types.ts:71`, `types/relationship.types.ts:46` | each other — same 7 members, **different order** | `RULING-P97-04`; found while executing it. `dossier-type-guards` is the in-tree-cited canonical (`CreateDossierHub.tsx:14-17`) |
| `WorkBoard.tsx`'s `STAGE_TO_STATUS` | the DB trigger's own `CASE` mapping | P96 precedent — the phrase "agree by authorship, not by construction" comes from here |

**Six copies of the dossier type set** exist across the last two rows (three arrays + three
unions) for a domain with **one** canonical answer.

## Why it is a class and not five coincidences

Each instance was locally reasonable when written. A local widening with a comment explaining
itself (`CreateDossierHub.tsx:14-17`) is _good_ practice as far as it goes. The defect is not
any single copy — it is that **adding the ninth dossier type will require finding all six
sites**, and nothing in the code tells the next author that six exist. The failure is deferred
and silent, which is why it keeps recurring: nothing goes red at the moment the copy is made.

## The fix shape (Phase 97, NAV-01)

A TypeScript type union **cannot be iterated at runtime**, so "derive from the type" is not
directly implementable. The correct inversion:

```
export const DOSSIER_TYPES = ['country', …] as const          // the one runtime home
export type DossierType = (typeof DOSSIER_TYPES)[number]      // the type derived FROM it
```

Consumers legitimately want **different sets**, and saying so is part of the fix — otherwise a
reviewer reads the difference as drift:

- `dossier-api.ts` bucket init — the **7 DB types**. `elected_official` is not a `dossiers.type`
  value (it is `persons.person_subtype`), so a widened bucket here could never be filled by
  that query.
- `DossierListPage` cards and `CreateDossierHub` — the **display set, 7 + `elected_official` =
  8**, derived once as `[...DOSSIER_TYPES, 'elected_official'] as const`.

**Two single-homed constants, not six hand-maintained copies.**

### The anti-merge clause (`RULING-P97-05`)

The two constants sit near each other, look almost identical, and differ by exactly one
member — which is precisely the shape a later tidy-up collapses into one "for consistency."
**Collapsing them re-creates the original defect in a new costume:** widening the API-side
constant creates a `dossiers.type` bucket that no query can ever fill, which is the fabricated
`0` again.

So **each declaration states, in the code**, what set it is, why it must not be merged with the
other, and what merging would cause. The comment is part of the deliverable, not garnish — the
failure mode is a future author who cannot see why two near-identical lists exist. (Same
reasoning as the `AppShell.tsx:121-124` comment correction: a stale or missing comment is how a
fixed bug gets re-learned.)

## What this phase does NOT close

Residue files as **`PARALLEL-TRUTH-01`** with a named owner, enumerating every copy left
standing. The default is derive; the burden of proof is on not deriving.

## The standing lesson

**A phase that diagnoses this class and then ships another instance of it is the sharpest
self-refutation available.** Phase 97 came within one edit of doing exactly that: the obvious
NAV-01 implementation — "add `elected_official` to the three lists" — would have been a fourth
copy of the defect the phase had just finished diagnosing.

PARALLEL-TRUTH-CLASS-END
