---
phase: 100-security-posture
plan: 9
status: complete
requirement: DBSEC-05
checkpoint_status: released
outcome: auth-half-closed-contingent-on-p100-15
---

# P100-09 — Leaked-password protection evidence and bound

The Auth half is closed on the operator attestation quoted verbatim below and a tightened live probe run
after the attested timestamp. ARM 1 rejected the five-character discrimination control with exactly
`422 / weak_password / reasons=[length]` and the derived length message. ARM 2 accepted the nine-character
strong control with HTTP 200. ARM 3 rejected the same-length breached subject with exactly
`422 / weak_password / reasons=[pwned]` and the exact leaked-password message. The finalizer resolved the
created account before deletion, observed DELETE 200 and refetch 404, and re-read the catalog as absent.

## Required criterion-5 contingency bound (verbatim)

Criterion 5 is COVERED CONTINGENT ON TWO HUMAN GATES - the P100-09 leaked-password toggle and the P100-15 operator sign-off - and its 'advisors report clean' clause closes by CALIBRATED PROXY (catalog = advisor at HEAD, to the unit), NOT by direct observation of the advisor after the change.

## Required interim bound (verbatim)

The leaked-password oracle establishes that a known breached password is rejected with HTTP 422 and error code weak_password for a non-length reason. It does NOT establish that it was rejected BECAUSE it is breached - another weak_password rule rejecting the same password would pass identically. The breach-specific discriminator is unobservable until leaked-password protection is enabled; see the operator handoff.

The interim text above is retained verbatim as the required historical bound. The attestation records
the operator's disposition after the breach-specific discriminator became observable.

## Operator attestation (quoted)

The following is a verbatim quote of `.planning/phases/100-security-posture/100-09-ATTESTATION.md` as
tracked by commit `2dcd6a5a2`:

```text
# ATTESTATION — P100-09 leaked-password protection (staging zkrcjzdemdmwhearhfgg)

**Who enabled the setting:** Khalid Alzahrani (operator), in the Supabase dashboard
(Authentication → Sign In / Providers → Email → "Prevent use of leaked passwords"), saved on the second
attempt after the first save did not take effect.

**When it became effective:** between 2026-09-10T13:57:5xZ (last overseer probe that was accepted, http 200)
and **2026-09-10T13:58:52Z** (first overseer probe rejected: http 422 `weak_password` reasons=["pwned"]).
Overseer probes used `p100-09-overseer-probe-<ts>@example.invalid`; the two accepted probe accounts were
deleted from auth.users immediately; the rejected probe created none. Recorded in
`OVERSEER-RULING-P100-09-HUMAN-GATE.md`; dispatch approval `task-approved` 13:58:58Z.

**Operator's answer on the D-31 bound (asked and answered 2026-09-10 ~18:0x local):**
**D-31 is CLOSED.** The breach-specific discriminator is now observable: `reasons=["pwned"]` is the
leaked-password rule's own reason string, distinct from `length` and from any other `weak_password`
rule. Criterion 5's Auth half is recorded as closed on the observed `pwned` reason plus this attestation.
No residual bound is carried into the phase completion text for the Auth half.

**The worker's duty:** quote this file verbatim in `100-09-SUMMARY.md`; do not restate it.
ATTESTATION-END
```

## Probe run 1 — recorded pre-toggle HEAD drill, verbatim

The acceptance criterion cites the pre-toggle run as recorded in `100-RESEARCH.md` §9.6. That section
records the rejection contract and an earlier abbreviated three-arm drill; the full finalizer transcript
quoted below is actually recorded in `100-RESEARCH.md` §10.4. This section-number discrepancy is stated
rather than silently attaching the transcript to the wrong source. The §10.4 source itself abbreviated
the generated emails and one UUID, so the missing characters cannot be reconstructed honestly:

```text
P100-09-ARM1 discrimination_control len=5 http=422 error_code=weak_password reasons=[length] msg="Password should be at least 6 characters."
P100-09-ARM2 availability_control  len=9 http=200 created_uuid=7a5071f3-9649-410c-8e6b-1e9d7dd06944
P100-09-ARM3 subject               len=9 http=200 error_code= reasons=[] msg=""
FAIL: the breached password was ACCEPTED (http=200) - leaked-password protection is still off
P100-09-FINALIZE created=[ p100-ctl-…@example.com p100-pwned-…@example.com ]
  LIFECYCLE …ctl…   uuid=7a5071f3-… seen_before_delete=yes delete_http=200 refetch_http=404 catalog_after='<absent>'
  LIFECYCLE …pwned… uuid=7f54f8f6-… seen_before_delete=yes delete_http=200 refetch_http=404 catalog_after='<absent>'
exit=1 · residual p100 = 0
```

Thus the pre-toggle record says both created accounts completed delete 200, refetch 404, and an absent
post-delete catalog read, but it does not preserve every full UUID. That evidence defect remains bound;
the setting is already behaviorally on, so this worker cannot recreate a genuine pre-toggle run.

## Probe run 2 — tightened post-attestation run, verbatim

The tightened oracle tracked by commit `2dcd6a5a2` was executed under Bash after the attestation's
latest effective-time bound. This is the post-toggle evidence from **run 0075 attempt 0**; the three
earlier post-toggle captures and their checked recovery lifecycles are carried in full below. Exact
command:

```bash
date -u '+PROBE_STARTED_AT=%Y-%m-%dT%H:%M:%SZ'; git show milestone/v10.0-trust:.planning/phases/100-security-posture/100-09-PLAN.md | sed -n '21,120p' | sed 's/^        //' | /bin/bash; probe_rc=$?; date -u '+PROBE_FINISHED_AT=%Y-%m-%dT%H:%M:%SZ'; echo PROBE_COMMAND_EXIT=$probe_rc; exit $probe_rc
```

Verbatim output:

```text
PROBE_STARTED_AT=2026-09-10T15:23:21Z
P100-09-ARM1 discrimination_control len=5 http=422 error_code=weak_password reasons=[length] msg="Password should be at least 6 characters."
P100-09-ARM2 availability_control len=9 http=200 created_uuid=567b1eea-e58a-42f0-bba3-1db08c0ae598
P100-09-ARM3 subject len=9 http=422 error_code=weak_password reasons=[pwned] msg="Password is known to be weak and easy to guess, please choose a different one."
P100-09-DISCRIMINATOR reasons=[pwned] msg matches - the rejection IS the leaked-password rule; D-31 bound closed at the toggle
P100-09-FINALIZE created=[ p100-ctl-45185-1789053801@example.com]
  LIFECYCLE p100-ctl-45185-1789053801@example.com uuid=567b1eea-e58a-42f0-bba3-1db08c0ae598 seen_before_delete=yes delete_http=200 refetch_http=404 catalog_after='<absent>'
P100-09-VERDICT requested=0 finalizer=0 combined=0 (3 dominates 1 dominates 0)
PROBE_FINISHED_AT=2026-09-10T15:23:25Z
PROBE_COMMAND_EXIT=0
```

ARM 1 is the discrimination control: five characters produced exactly HTTP 422, `weak_password`, reason
`length`, and the derived length message. ARM 2 is the availability control at the same nine characters
as ARM 3; it returned HTTP 200 and resolved UUID `567b1eea-e58a-42f0-bba3-1db08c0ae598`. ARM 3 returned
HTTP 422, `weak_password`, reasons exactly `[pwned]`, and the exact leaked-password message. The sole
created account was present before deletion, DELETE returned 200, refetch returned 404, and the final
catalog read was absent. The run began more than 84 minutes after the attestation's latest effective-time
bound.

## Post-toggle raw capture

Command that produced the capture (the rejected signup created no account, verified by the final catalog
read):

```bash
set -a; . ./.env.test 2>/dev/null; set +a; capture_ts=$(date -u '+%Y-%m-%dT%H:%M:%SZ'); capture_email="p100-pwned-capture-$(date +%s)@example.com"; echo "CAPTURE_TIMESTAMP=$capture_ts"; echo "CAPTURE_EMAIL=$capture_email"; capture_out=$(curl -sS -m 30 -w '\nCAPTURE_HTTP=%{http_code}' -X POST "$SUPABASE_URL/auth/v1/signup" -H "apikey: $SUPABASE_ANON_KEY" -H 'Content-Type: application/json' -d "{\"email\":\"$capture_email\",\"password\":\"Pa55w0rd!\"}" 2>&1); capture_rc=$?; printf '%s\n' "$capture_out"; echo "CAPTURE_CURL_EXIT=$capture_rc"; capture_catalog=$(psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -c "select id from auth.users where email = '$capture_email'" 2>&1); catalog_rc=$?; echo "CAPTURE_CATALOG_RC=$catalog_rc CAPTURE_CATALOG_AFTER=${capture_catalog:-<absent>}"; test "$capture_rc" = 0 -a "$catalog_rc" = 0 -a -z "$capture_catalog"
```

Verbatim output:

```text
CAPTURE_TIMESTAMP=2026-09-10T15:25:36Z
CAPTURE_EMAIL=p100-pwned-capture-1789053936@example.com
{"code":422,"error_code":"weak_password","msg":"Password is known to be weak and easy to guess, please choose a different one.","weak_password":{"reasons":["pwned"]}}
CAPTURE_HTTP=422
CAPTURE_CURL_EXIT=0
CAPTURE_CATALOG_RC=0 CAPTURE_CATALOG_AFTER=<absent>
```

## Other live producer accounts and checked recovery lifecycles

Two preliminary invocations ran the unchanged body through Zsh. Zsh did not split the space-delimited
`CREATED` scalar in `for E in $CREATED`, so the finalizer queried an email with a leading space and
correctly exited 3. A discriminator-capture variant had the same Zsh invocation defect. Every account
created by those producer runs was subsequently deleted by its already-resolved UUID and rechecked.

First preliminary run:

```text
P100-09-ARM1 discrimination_control len=5 http=422 error_code=weak_password reasons=[length] msg="Password should be at least 6 characters."
P100-09-ARM2 availability_control len=9 http=200 created_uuid=b3676e5c-8b15-44cc-a065-c212a93cd8b3
P100-09-ARM3 subject len=9 http=422 error_code=weak_password reasons=[pwned] msg="Password is known to be weak and easy to guess, please choose a different one."
P100-09-FINALIZE created=[ p100-ctl-59878-1789048839@example.com]
  LIFECYCLE  p100-ctl-59878-1789048839@example.com :: INSTRUMENT-CANNOT-RUN no uuid resolved before delete (got '')
P100-09-VERDICT requested=0 finalizer=3 combined=3 (3 dominates 1 dominates 0)
PROBE_COMMAND_EXIT=3
LOOKUP email=p100-ctl-59878-1789048839@example.com rc=0 uuid=b3676e5c-8b15-44cc-a065-c212a93cd8b3
RECOVERY uuid=b3676e5c-8b15-44cc-a065-c212a93cd8b3 delete_curl=0 delete_http=200 refetch_curl=0 refetch_http=404 catalog_rc=0 catalog_after=<absent>
```

Second preliminary run:

```text
P100-09-ARM1 discrimination_control len=5 http=422 error_code=weak_password reasons=[length] msg="Password should be at least 6 characters."
P100-09-ARM2 availability_control len=9 http=200 created_uuid=d49b97fd-6e18-4378-ab76-59b5691a74a3
P100-09-ARM3 subject len=9 http=422 error_code=weak_password reasons=[pwned] msg="Password is known to be weak and easy to guess, please choose a different one."
P100-09-FINALIZE created=[ p100-ctl-71731-1789048879@example.com]
  LIFECYCLE  p100-ctl-71731-1789048879@example.com :: INSTRUMENT-CANNOT-RUN no uuid resolved before delete (got '')
P100-09-VERDICT requested=0 finalizer=3 combined=3 (3 dominates 1 dominates 0)
PROBE_COMMAND_EXIT=3
LOOKUP email=p100-ctl-71731-1789048879@example.com rc=0 uuid=d49b97fd-6e18-4378-ab76-59b5691a74a3
RECOVERY uuid=d49b97fd-6e18-4378-ab76-59b5691a74a3 delete_curl=0 delete_http=200 refetch_curl=0 refetch_http=404 catalog_rc=0 catalog_after=<absent>
```

Discriminator-capture variant:

```text
P100-09-ARM1 discrimination_control len=5 curl=0 http=422 error_code=weak_password reasons=[length] msg="Password should be at least 6 characters."
P100-09-ARM2 availability_control len=9 curl=0 http=200 lookup_rc=0 lookup_attempts=1 created_uuid=00d75e8d-3ada-40eb-b4de-019bbd2b984a
P100-09-ARM3 subject len=9 curl=0 http=422 error_code=weak_password reasons=[pwned] msg="Password is known to be weak and easy to guess, please choose a different one."
P100-09-FINALIZE created=[ p100-ctl-2287-1789049000@example.com]
  LIFECYCLE  p100-ctl-2287-1789049000@example.com :: INSTRUMENT-CANNOT-RUN uuid lookup rc=0 attempts=10 got=''
P100-09-TIGHTENED-VERDICT requested=0 finalizer=3
RECOVERY email=p100-ctl-2287-1789049000@example.com uuid=00d75e8d-3ada-40eb-b4de-019bbd2b984a delete_curl=0 delete_http=200 refetch_curl=0 refetch_http=404 catalog_rc=0 catalog_after=<absent>
```

Across this worker's four live producer accounts, all four have a full resolved UUID, successful delete
curl status, HTTP 200 delete, successful refetch curl status, HTTP 404 refetch, successful catalog
producer status, and an absent post-delete catalog value. Zero live residual accounts remain from these
runs; each zero is paired above with the pre-delete UUID that proves the detector saw a true value.

Post-toggle (run 0075 attempt 0, 3 captures): ARM 3 returned `reasons=[pwned]` in every capture with the
exact leaked-password message now asserted. Drilled at HEAD (pre-toggle): ARM 1 green, ARM 2 green, ARM 3
RED, and TWO full lifecycles were verified on the failing path with zero residual; as disclosed above,
the historical source abbreviates one UUID rather than preserving all of its digits.

## Worker-side advisor reachability check and residual

Command attempted on 2026-09-10:

```bash
curl -sS -m 30 -w '\n%{http_code}' --request GET \
  'https://api.supabase.com/v1/projects/zkrcjzdemdmwhearhfgg/advisors/security' \
  --header 'Content-Type: application/json'
```

Verbatim result:

```text
SUPABASE_ACCESS_TOKEN=<unset>
ADVISOR_ATTEMPT curl_exit=0 http=401 body={"message":"Unauthorized"}
```

This was the worker-side attempt only. It had no `Authorization` header because
`SUPABASE_ACCESS_TOKEN` was unset, so HTTP 401 was expected and records the endpoint as unavailable from
this worker environment. The unavailable-endpoint branch therefore has a recorded attempt and result,
but the overseer's credentialed corroboration call remains owed. There is no post-change advisor verdict,
so the calibrated proxy remains the only closure mechanism for the advisor clause.

The corrected residual is: advisors DO report auth_leaked_password_protection, so a later toggle-off is DETECTABLE, and the gap is that nothing runs get_advisors on a schedule, so it is detectable but NOT DETECTED, carried to Phase 101.

No claim is made that advisors directly observed the post-toggle state. Scheduling `get_advisors` is
outside this task and remains assigned to Phase 101.

## Final disposition

The P100-09 Auth half is complete: the checkpoint is released by the quoted attestation, the tightened
post-attestation oracle passed, the raw capture matches `reasons=[pwned]` and the exact message, and every
account created by this worker has a checked cleanup lifecycle. Criterion 5 remains contingent on
P100-15's operator sign-off. Direct post-change advisor observation is not claimed; the advisor clause
uses the calibrated proxy stated in the required bound, and the unscheduled detectable-but-not-detected
residual is carried to Phase 101.
