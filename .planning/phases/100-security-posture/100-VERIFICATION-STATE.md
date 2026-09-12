# P100-13 verification state — 2026-09-10

This file contains only output produced by P100-13's fresh final-tree run at
`2026-09-10T20:51:19Z`. One fail-closed foreground session ran the function configuration proof and
then the unchanged caller-census instrument.

## Fresh function configuration and final attribution output

```text
P100-13-RUN started_at=2026-09-10T20:51:19Z
P100-SEARCHPATH at_approved=557 other=35 unpinned=0 population=592 expected_approved=population-minus-35=557 other_identity_digest=a10d3e1256979bf019d8a9b68c959cb8
P100-SEARCHPATH-CONTROL approved_plus_other=592 population=592 unpinned=0 expected_other=35 recorded_head_digest=a10d3e1256979bf019d8a9b68c959cb8
PASS search_path configuration
P100-CENSUS unified_work_items owner=21 other=2 expected owner=21 other=2
PASS census
P100-13-RUN exit=0
```

Session exit status: **0**.

The function result proves both size and identity: `557 = 592 - 35`, zero are unpinned, and the 35
functions pinned elsewhere reproduce the recorded HEAD digest
`a10d3e1256979bf019d8a9b68c959cb8`. The produced control line places `unpinned=0` beside a non-empty
592 population, the complete 557+35 partition, and the expected digest, so the zero is controlled and
a balanced bucket swap is detectable.

Explicit P100-08 comparison: this P100-13 `P100-CENSUS` run agrees with P100-08's named
`P100-CENSUS-AFTER` run; both read owner **21** and non-owner **2**. No change landing between those
runs moved the authorization boundary. Owner=21 is the positive availability control for non-owner=2.
The same unchanged instrument recorded owner 21 / non-owner 21 at phase HEAD.
