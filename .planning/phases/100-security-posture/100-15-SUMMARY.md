---
phase: 100-security-posture
plan: 15
status: complete
completed: 2026-09-11
requirements: [DBSEC-01, DBSEC-02, DBSEC-03, DBSEC-04, DBSEC-05, CLIENTSEC-01, CLIENTSEC-02]
---

# P100-15 — evidence register and operator sign-off

`100-VERIFICATION.md` now consumes P100-01 through P100-14, carries the fresh P100-12, P100-13 and
P100-14 per-object evidence attested at the delegated checkpoint, records the phase arithmetic, quotes
`100-15-SIGNOFF.md` verbatim from commit `8cf1a7098`, and hands all signed bounds and residue onward.

## P100-15 arithmetic runs

The plan's exact posture body was first invoked by the worktree's configured `zsh`. Its PostgreSQL
producer succeeded, but Zsh does not perform the POSIX field splitting assumed by `set -- $PSQL_OUT`.
The oracle failed closed before grading. Verbatim output and captured status:

```text
INSTRUMENT-CANNOT-RUN: the phase posture probe returned 1 fields, expected 4
exit=3
```

The same recorded body was then run through `bash -lc`, without changing its SQL or predicates. The
evidence-producing command was:

```bash
bash -lc 'PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test 2>/dev/null; set +a;
command -v psql >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: psql absent"; exit 3; };
[ -n "${SUPABASE_DB_URL:-}" ] || { echo "INSTRUMENT-CANNOT-RUN: SUPABASE_DB_URL unset - .env.test not materialised in this worktree"; exit 3; };
PQ() { PSQL_OUT=$(psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -c "$1" 2>&1); PSQL_RC=$?; };
PQ_OK() { PQ "$1"; [ "$PSQL_RC" = "0" ] || { echo "INSTRUMENT-CANNOT-RUN: psql exited $PSQL_RC for $2 :: $PSQL_OUT"; exit 3; }; };
PQ_OK "select (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v')||' '||(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v' and 'security_invoker=true' = any(coalesce(c.reloptions,'{}')))||' '||(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v' and (has_table_privilege('anon',c.oid,'SELECT') or has_table_privilege('authenticated',c.oid,'SELECT')))||' '||(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v' and (has_table_privilege('anon',c.oid,'SELECT') or has_table_privilege('authenticated',c.oid,'SELECT')) and not ('security_invoker=true' = any(coalesce(c.reloptions,'{}'))))" "the phase posture";
set -- $PSQL_OUT; A=$1; B=$2; C=$3; CN=$4;
[ "$#" = "4" ] || { echo "INSTRUMENT-CANNOT-RUN: the phase posture probe returned $# fields, expected 4"; exit 3; };
case "$A" in *[!0-9]*|"") echo "INSTRUMENT-CANNOT-RUN: the view-population field of the phase posture probe returned [$A], not a number"; exit 3;; esac;
case "$B" in *[!0-9]*|"") echo "INSTRUMENT-CANNOT-RUN: the invoker-count field of the phase posture probe returned [$B], not a number"; exit 3;; esac;
case "$C" in *[!0-9]*|"") echo "INSTRUMENT-CANNOT-RUN: the client-readable-count field of the phase posture probe returned [$C], not a number"; exit 3;; esac;
case "$CN" in *[!0-9]*|"") echo "INSTRUMENT-CANNOT-RUN: the client-but-not-invoker field of the phase posture probe returned [$CN], not a number"; exit 3;; esac;
echo "P100-15-POSTURE views=$A invoker=$B client_readable=$C  [DIAGNOSTIC, NOT GRADED] client_but_not_invoker=$CN";
echo "P100-15-EXPECT views=33 invoker=12 client_readable=12  (the per-object proofs are P100-12, P100-13 and P100-14)";
[ "$A" = "33" ] || { echo "INSTRUMENT-CANNOT-RUN: public holds $A views, not the 33 this phase disposed of - the population moved under the probe"; exit 3; };
R=0; [ "$B" = "12" ] || { echo "FAIL: $B views carry security_invoker=true, expected the 12 with an authenticated caller"; R=1; };
[ "$C" = "12" ] || { echo "FAIL: $C views remain client-readable, expected 12 (33 minus the 21 restricted)"; R=1; };
[ "$R" = "0" ] && echo "PASS posture arithmetic (client_but_not_invoker printed above is cross-check arithmetic, not a criterion)"; exit $R'
```

Verbatim output and captured status:

```text
P100-15-POSTURE views=33 invoker=12 client_readable=12  [DIAGNOSTIC, NOT GRADED] client_but_not_invoker=0
P100-15-EXPECT views=33 invoker=12 client_readable=12  (the per-object proofs are P100-12, P100-13 and P100-14)
PASS posture arithmetic (client_but_not_invoker printed above is cross-check arithmetic, not a criterion)
exit=0
```

The 33/12/12 values are the only graded arithmetic. The printed zero is controlled by the positive
33-view population and is not an exit predicate. Per-object proof remains in P100-12/13/14.

## Evidence and zero controls

- P100-12 freshly rendered 20/20 restricted views and 12/12 materialized views at their complete
  every-grantee ACL state, plus 12/12 named invoker flags. Positive named/rendered populations control
  every false client-privilege result.
- P100-13 freshly reported 557 approved + 35 digest-pinned exceptions = 592 and `unpinned=0`; the
  positive partition and digest control the zero. Its 21-owner arm controls the 2-non-owner census.
- P100-14 freshly printed both complete seven-field policy rows, both criterion-2 state rows, an
  18-view dependency-detector control, and three behavioural reads. The answered empty view is
  classified separately from the two denials.
- P100-09's cleanup zero is paired with resolved pre-delete UUIDs, DELETE 200 and refetch 404.
- P100-11's real-tree zeros are diagnostic; its graded evidence is `OFF=false`, `ON="hidden"`, and the
  positive 478-file bidirectional manifest equality.

## Checkpoint answer

The register quotes the complete re-issued `100-15-SIGNOFF.md` from commit `8cf1a7098`, including who
decided, the standing delegation, the attested fourteen-summary and P100-12/P100-13/P100-14 evidence
set, all six empty views, all checkpoint bounds, the additional `dossier_relationships` policy finding,
signature, timestamp and `SIGNOFF-END`. The overseer accepted the posture in writing under delegation;
the sign-off remains revocable and says personal operator review is owed.

The register records D-31 as **CLOSED** (operator toggle 2026-09-10, `reasons=["pwned"]`,
`100-09-ATTESTATION.md`; D-31 status line amended), matching the re-issued sign-off. The operator's
personal attestation and P100-09's live probe support that closure; it is not a worker assertion.
**OPEN - DEFERRED TO TOGGLE** is retained explicitly as the interim status it replaced.

## Closing language handed onward

1. Six converted views are empty on staging, as accepted by the re-issued sign-off's correction to D-29:

   - For `event_details`, criterion 1 establishes an unbroken read path, NOT row scoping.
   - For `theme_details`, criterion 1 establishes an unbroken read path, NOT row scoping.
   - For `relationship_health_summary`, criterion 1 establishes an unbroken read path, NOT row scoping.
   - For `v_country_relationship_flows`, criterion 1 establishes an unbroken read path, NOT row scoping.
   - For `engagement_recommendations_summary`, criterion 1 establishes an unbroken read path, NOT row scoping.
   - For `entity_comments_with_details`, criterion 1 establishes an unbroken read path, NOT row scoping.

2. The 21 revocations were validated against **TRACKED REPOSITORY SOURCES ONLY**. An unseen BI tool,
   Retool app or saved dashboard query could break; that break is **LOUD (permission denied)** and
   **REVERSIBLE (re-GRANT)**.
3. Criterion 5 is COVERED CONTINGENT ON TWO HUMAN GATES - the P100-09 leaked-password toggle and the P100-15 operator sign-off - and its "advisors report clean" clause closes by CALIBRATED PROXY (catalog = advisor at HEAD, to the unit), NOT by direct observation of the advisor after the change.
4. D-31 is carried verbatim in the register: the oracle establishes rejection with HTTP 422 and
   `weak_password` for a non-`length` reason and does **NOT** establish rejection BECAUSE the password
   is breached, because another `weak_password` rule would pass identically; the discriminator was
   unobservable until the setting was enabled. It is recorded as CLOSED (operator toggle 2026-09-10,
   reasons=[pwned], 100-09-ATTESTATION.md; D-31 status line amended); the shorthand reflects the probe's
   JSON `reasons=["pwned"]`. **OPEN - DEFERRED TO TOGGLE** is retained as the interim status it replaced.
5. The sign-off's additional defective `dossier_relationships` policy finding is carried to Phase 102.

## Named residue

- Phase 101: schedule `get_advisors`; until then toggle-off is DETECTABLE, not DETECTED.
- Phase 102: migration-ledger divergence, 402 fixture accounts rather than 415 total users, and the
  `dossier_relationships` policy finding.
- Phase 103: 670 executable-grant and 4 extension-in-public advisor warnings.

No source, migration, roadmap, requirement or sign-off file was changed by this task.
