---
phase: 100-security-posture
plan: 13
status: blocked
completed: 2026-09-10
requirements: [DBSEC-05]
---

# P100-13 Summary — final function configuration and caller census

P100-13 cannot truthfully mark its required re-proof complete. The fresh final-tree search-path oracle
found **557 approved / 35 other / 0 unpinned / 592 total**, not the plan's required
**556 / 35 / 0 / 591**, and therefore exited 3 at its population guard. The 35 functions pinned to
other explicit values are still the same identities: their signature-to-configuration digest is the
HEAD digest `a10d3e1256979bf019d8a9b68c959cb8`. Thus the identity control passes and proves that this is a
one-function population increase, not a balanced swap between the approved and other buckets.

This is the state P100-08 recorded after P100-17 added
`public.get_relationship_health_summary()`: P100-08 reported 557 approved and 592 total. Restoring the
P100-13 target would require changing live database/migration state, which is outside this task's
two-document allowlist.

The final attribution census did pass: owner **21**, non-owner **2**. It explicitly agrees with
P100-08's named `P100-CENSUS-AFTER` run, which also read owner 21 / non-owner 2. No authorization-boundary
movement is attributable to changes landing between P100-08 and this P100-13 run. For contrast, the
unchanged instrument read 21 / 21 at phase HEAD; the current owner count is the positive availability
control showing that the non-owner result is narrowed access rather than a dead read path.

## Fresh oracle session

Command: a Ruby YAML reader loaded the two `oracle: command` scalars from `100-13-PLAN.md` and executed
each unchanged with `bash -c` in one foreground process, continuing to the caller census after the
search-path oracle's population guard exited 3. It printed both captured statuses and failed overall
unless both were zero. This command and all output below were produced afresh in this repair attempt.

Verbatim output:

```text
P100-SEARCHPATH at_approved=557 other=35 unpinned=0 population=592 other_identity_digest=a10d3e1256979bf019d8a9b68c959cb8
P100-SEARCHPATH-EXPECT at_approved=556 other=35 unpinned=0 population=591 other_identity_digest=a10d3e1256979bf019d8a9b68c959cb8
INSTRUMENT-CANNOT-RUN: the non-extension function population is 592, not the 591 measured at HEAD - it moved under the probe
P100-CENSUS unified_work_items owner=21 other=2 expected owner=21 other=2
PASS census
P100-13-ORACLE-STATUS search_path_exit=3 census_exit=0
```

Session exit status: **1**.

The `unpinned=0` result stands beside its controls in the same produced line: a populated census of
592 functions, 557 at the schema-approved value, 35 at other explicit values, and the expected digest
for those 35 identities. The zero therefore cannot come from an empty or malformed census.

## Remaining ownership

P100-15 still owns the phase register, posture arithmetic, and operator sign-off. Phase 103 still owns
the separate function `EXECUTE` grant audit. Resolving the 592-versus-591 plan contradiction requires
an authorized migration/state decision outside P100-13; this task made no such change.
