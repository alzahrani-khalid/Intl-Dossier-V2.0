> **WORKER-REACHABLE COPY.** The authoritative original is `.tickmarkr/overseer/RULING-P99-06-B01-FLATTEN-BASIS.md`,
> which is gitignored and therefore unreachable from a task worktree. This copy was placed here by the
> OVERSEER on 2026-08-18 (`RULING-P99-14`) so the 17 tasks citing it as context can actually read it.
> Verbatim at copy time; if the two ever differ, the `.tickmarkr` original governs.

# RULING P99-06 — B-01: my ruling's basis was FALSE; the decision survives with a ruled repair

2026-08-18, OVERSEER (wK:p7X). Inputs: `P99-URGENT-B01-FLATTEN-BASIS-FALSIFIED.md` (URGENT-END),
checker B's B-01. Verified from THIS seat before ruling, my own node walk: both locales show
`error` root=OBJECT(2) vs nested scalar ("Error"/"خطأ"), `search` root=OBJECT(10) vs nested
scalar ("Search"/"بحث") — exactly 2 type clashes per locale; 13 live dot-form consumers
(5 `common.error` + 8 `common.search`); and the proposed relocation target is itself clean
(`label` absent under both objects, both locales — checked because the last failure teaches
exactly this).

## 1. The basis is SUPERSEDED, and the error is recorded against three seats including mine

`RULING-P99-03` #1's stated basis — "merge proven collision-free (67 leaves, 0 overwrites, both
locales)" — is FALSE. The research instrument compared CHILD KEY SETS; a scalar has no children,
so its "0 same-name children" was vacuously true and the instrument was structurally incapable of
seeing a TYPE collision. This is Phase 98's population-definition finding recurring inside the
phase that inherited it, and it passed through the research seat, the orchestrator's review, AND
this ruling seat. A ruling is wrong at roughly everyone else's rate; checker B did what the
two-checker design exists to do. The P99-03 file gets a SUPERSEDED-BASIS annotation pointing
here — the decision text is not silently rewritten.

## 2. The FLATTEN DECISION STANDS — none of its comparative reasoning touched merge mechanics

KEEP's erosion failure mode is still unbounded in time; the sequencing, atomicity, and harness
conditions (D-13/D-14) are untouched. What was wrong was the "clean merge" premise, and it gets
a ruled repair:

**Option 1 — relocate the two scalars under their object namesakes:** nested `common.error` →
`error.label`, nested `common.search` → `search.label`, in BOTH locales, with all 13 dot-form
consumers repointed in the SAME atomic commit that lands the flatten (the lane already owns the
files). Basis for 1 over 2: the scalar is the generic label of its namesake concept — `error.label`
is its natural home; root-level `errorLabel`/`searchLabel` proliferates flat keys the glossary
sweep would have to special-case. Option 3 (reverse to KEEP) is REFUSED — the finding is about
merge mechanics, not direction, and reopening the direction on it would be scope-flinch.

Note the load-bearing consumer: the 404 page renders `بحث` through `common.search` (research
§6.1) — one of criterion 3's four named surfaces rides this repoint. UI99-C5's oracle must stay
red across the relocation and green only when the 404 surface renders through the new path.

## 3. Instrument law — the drill this failure buys

The rewritten `99-02`'s collision oracle is TYPE-AWARE: it proves zero same-name TYPE clashes
post-merge (not zero child-set overlaps), and it carries a POSITIVE CONTROL — a synthetic
scalar-vs-object pair it must catch, run RED before the merge logic is trusted. A collision check
without a type dimension is the instrument that just failed; it does not get re-trusted on a
clean run (rule 11).

## 4. Record corrections, my column, executed with this ruling

- `99-CONTEXT.md` D-12: the "0 overwrites" sentence corrected to state the two type clashes and
  the ruled relocation, dated, defect record kept.
- `RULING-P99-03`: SUPERSEDED-BASIS annotation prepended to #1, pointing here.

## 5. Process

- The consolidated repair round is RELEASED on receipt of this ruling — the five
  flatten-entangled B blockers repair against the ruled destination (`error.label` /
  `search.label`), so `99-02` is rewritten once.
- The hold discipline is COMMENDED into the record: B's file carried its terminal marker at one
  sha and was rewritten afterwards — quoting at the marker would have quoted a superseded report.
  Marker AND writer-stopped AND hash-stable, never fewer.
- B-05 (diffCap park risk on `99-08`/`99-09`) is flagged as an ENGINE property — bring it in the
  consolidated brief with the measured diff estimate vs the configured cap; if real, the remedy
  is lane re-cutting or a ruled config change, decided by me, and it may also be an upstream
  seed (a cap that parks un-retryably on honest work is a product question).

RULING-END
