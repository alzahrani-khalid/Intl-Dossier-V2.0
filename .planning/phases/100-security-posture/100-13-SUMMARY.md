---
phase: 100-security-posture
plan: 13
status: complete
completed: 2026-09-10
requirements: [DBSEC-05]
---

# P100-13 Summary — final function configuration and caller census

The final-tree re-proof passed. The live non-extension function population is 592 after P100-17 added
`public.get_relationship_health_summary()`. Exactly population minus 35 functions are at their
schema-approved explicit `search_path`: **557 = 592 - 35**. The other 35 signature/configuration pairs
hash to the digest recorded at phase HEAD, `a10d3e1256979bf019d8a9b68c959cb8`, and zero functions are
unpinned. The digest pins bucket identity as well as size, so a balanced swap between the 557/35
buckets would fail even though all counts remained balanced.

The final attribution census also passed: the owner read **21** rows from `unified_work_items` and the
non-owner read exactly **2**. This P100-13 `P100-CENSUS` run explicitly agrees with P100-08's named
`P100-CENSUS-AFTER` run, which also read owner 21 / non-owner 2. Therefore no authorization-boundary
movement occurred between the two runs. The same unchanged census instrument read owner 21 / non-owner
21 at phase HEAD; owner=21 is the positive availability control proving that non-owner=2 is narrowed
visibility rather than a dead read path.

## Fresh final-tree run

Command: one fail-closed foreground `bash` session sourced `.env.test`, queried `pg_proc` for the
configuration census and identity digest, asserted `approved = population - 35`, then ran the plan's
unchanged `resolve_uid` / `census_count` instrument for `kazahrani@stats.gov.sa` and
`test.user@gmail.com`. It exited non-zero on an absent producer, malformed field, unexpected bucket,
unpinned function, identity-digest mismatch, or caller-count mismatch.

Verbatim output (exit status 0):

```text
P100-13-RUN started_at=2026-09-10T20:51:19Z
P100-SEARCHPATH at_approved=557 other=35 unpinned=0 population=592 expected_approved=population-minus-35=557 other_identity_digest=a10d3e1256979bf019d8a9b68c959cb8
P100-SEARCHPATH-CONTROL approved_plus_other=592 population=592 unpinned=0 expected_other=35 recorded_head_digest=a10d3e1256979bf019d8a9b68c959cb8
PASS search_path configuration
P100-CENSUS unified_work_items owner=21 other=2 expected owner=21 other=2
PASS census
P100-13-RUN exit=0
```

The zero is adjacent to its controls in produced output: `unpinned=0` is paired with the populated
592-function census, a complete 557+35 partition, the required 35-object bucket, and its recorded
identity digest. It cannot be an empty census or a balanced exchange between buckets.

## Remaining ownership

P100-15 owns the phase register, posture arithmetic, and operator sign-off. Phase 103 owns the separate
function `EXECUTE` grant audit; this task changed no grants or database state.
