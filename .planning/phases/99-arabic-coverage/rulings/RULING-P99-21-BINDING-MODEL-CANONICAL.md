> **WORKER-REACHABLE COPY.** Authoritative original: `.tickmarkr/overseer/RULING-P99-21-BINDING-MODEL-CANONICAL.md`, which is
> gitignored and unreachable from a task worktree. Copied here 2026-08-19 so the tracked files that
> cite this ruling resolve. Verbatim at copy time; if the two differ, the `.tickmarkr` original governs.

# RULING P99-21 — one canonical binding model; stop copying; every descended population is UNTRUSTED

2026-08-18, OVERSEER (wK:p7X). Input: `P99-BINDING-BUG-BLAST-RADIUS.md` (BLAST-END). Verified from
this seat: `scripts/i18n-mask-audit.mjs:66` carries
`USE_NS = /useTranslation\(\s*(?:\[\s*)?'([^']+)'/g` — generation zero, COMMITTED;
`REQUIREMENTS.md:366` names that exact file as the reproducer; and `scripts/resolve-check.mjs`
already documents the CORRECT model in its own header ("bare `useTranslation()` resolve against
common.json").

## 1. The finding, stated at its true size

One regex, **three generations** — committed → research (`p99-strict.mjs:50`) → the run-11
instrument — byte-identical, and **the vector was our own plans' instruction to "mirror the walk
byte-for-byte."** 158 of 666 files are mis-bound (47 array bindings read as first-namespace-only,
111 bare bindings read as zero namespaces). My three D-22 "control" files are precisely the two
broken shapes. So `481/335`, `473/297`, `1768` and the AR-04 populations all descend from a model
that does not describe the shipped app.

This is Phase 98's exported finding — _a population defined by what usually implements a criterion
is not the criterion's population_ — recurring one layer deeper: not a wrong population, a wrong
**model** that generated every population.

## 2. STOP COPYING. One canonical resolver. (The structural fix, and the important one.)

The correct model already exists, committed, in P98's instruments (`resolve-check.mjs`,
`neg-taskcard.mjs`). Therefore:

- **A single canonical binding resolver is extracted and every instrument imports it.** No
  instrument re-implements namespace binding, ever.
- **"Mirror the walk byte-for-byte" is STRUCK from every plan that carries it.** That instruction
  is now a NAMED DEFECT: it propagated a bug across three generations while reading as rigour.
  Plans instead say: import the canonical resolver; if it is wrong, fix it once, there.
- The resolver handles all three shapes — `useTranslation('ns')`, `useTranslation(['a','b'])` (i18next
  consults EVERY namespace), and bare `useTranslation()` (defaultNS `translation`, registered at
  `i18n/index.ts:274/410` and aliased to common).

## 3. The committed instrument is FIXED, and it is P99-04's

`scripts/i18n-mask-audit.mjs` is generation zero and `REQUIREMENTS.md` points at it as the
reproducer — a defective instrument named in the requirement register is worse than no
instrument. Add it to P99-04's `files_modified`; P99-04 fixes it by adopting the canonical
resolver. Drill, non-negotiable: the fixture carries all three binding shapes, and the
**158 mis-bound files must visibly reclassify** — a fixture that cannot fail on the shape you get
wrong is not a control, which is exactly how this survived three generations.

## 4. Every descended population is UNTRUSTED — including the half that "looked clean"

`481/335`, `473/297`, `1768`, my D-22 control set, and the AR-04a/AR-04b lane populations are
**not targets and may not be quoted as such** anywhere: plan, oracle, summary, or ruling. They are
re-derived at execution under the canonical model. D-04 said re-derive rather than re-quote; this
is D-04 with teeth.

**The two-arg 9 re-derives too** unless the reviewer named an INDEPENDENT basis for calling it
clean. A clean verdict produced by the same defective model is not evidence — it is the model
agreeing with itself. If no independent basis exists, say so and re-derive; do not carry it
forward because it was not the half that failed.

## 5. Phase 98 is NOT reopened — and its record says why

P98's affected closures were BOUNDED with residues routed to exactly this phase, so the honest
remedy is to re-derive here rather than to reopen a closed phase. But its cited populations
descend from this model, so they get a dated superseded-basis note where they are stated, and
`REQUIREMENTS.md:366` gets a dated correction: the named reproducer was defective until P99-04
fixes it. I write those; they are record acts, not plan acts.

## 6. Execution

1. Orchestrator: canonical resolver extracted; `mirror byte-for-byte` struck from every plan
   carrying it (report the population before editing, as you did); P99-04 gains
   `scripts/i18n-mask-audit.mjs` and the three-shape drill; the untrusted numbers struck as targets
   per your eleven-occurrence sweep.
2. Orchestrator: recompile, bounds, pairs 0, quoted.
3. Me: the REQUIREMENTS.md and P98 record notes, then the commit.
4. Relaunch.

## 7. Upstream seed (filed with this ruling)

"Mirror this implementation byte-for-byte" is a plan idiom that reads as rigour and is a
copy-propagation vector: it moved one defective regex through three generations of instrument,
each of which passed its own self-check. Worth a line in the spec-authoring law: when two
instruments must agree, they SHARE code — an instruction to copy is an instruction to diverge
later and to inherit every defect now.

RULING-END
