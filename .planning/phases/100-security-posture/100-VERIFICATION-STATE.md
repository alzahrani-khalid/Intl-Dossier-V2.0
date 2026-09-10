# P100-13 verification state — 2026-09-10

This file contains only output produced by P100-13's fresh final-tree run.

## Function configuration oracle

```text
P100-SEARCHPATH at_approved=557 other=35 unpinned=0 population=592 other_identity_digest=a10d3e1256979bf019d8a9b68c959cb8
P100-SEARCHPATH-EXPECT at_approved=556 other=35 unpinned=0 population=591 other_identity_digest=a10d3e1256979bf019d8a9b68c959cb8
INSTRUMENT-CANNOT-RUN: the non-extension function population is 592, not the 591 measured at HEAD - it moved under the probe
```

Exit status: **3**.

The observed `unpinned=0` is controlled by the same run's non-empty population of 592, its 557 approved
functions, its 35 explicitly other functions, and the HEAD identity digest
`a10d3e1256979bf019d8a9b68c959cb8`. The digest control matches, so a balanced swap would have been
detected. The count/population control does not match: the required 556/591 state is not present.

## Final attribution census

```text
P100-CENSUS unified_work_items owner=21 other=2 expected owner=21 other=2
PASS census
```

Exit status: **0**.

Explicit P100-08 comparison: this P100-13 `P100-CENSUS` run agrees with P100-08's named
`P100-CENSUS-AFTER` run; both read owner **21** and non-owner **2**. The owner=21 result is the positive
availability control for the narrowed non-owner=2 result. The same instrument read owner 21 / non-owner
21 at phase HEAD, so the final run continues to demonstrate the intended attribution boundary.

## Combined session status

```text
P100-13-ORACLE-STATUS search_path_exit=3 census_exit=0
```

The combined session exited **1** because both oracles were required to pass.
