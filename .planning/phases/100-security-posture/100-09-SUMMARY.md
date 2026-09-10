---
phase: 100-security-posture
plan: 9
status: complete
requirement: DBSEC-05
completed: 2026-09-10
outcome: bounded
---

# P100-09 — Leaked-password protection evidence and bound

The live behavioural half is now observable: ARM 1 rejects the five-character discrimination control
with `422 / weak_password / length`, ARM 2 accepts the nine-character strong control with HTTP 200, and
ARM 3 rejects the same-length breached subject with `422 / weak_password / pwned`. The successful live
run completed a checked delete-refetch-catalog lifecycle for its one created account.

This does **not** release the human checkpoint. No written operator confirmation, operator identity,
toggle time, or operator answer to D-31 exists in the dispatch or repository. The allowlist permits this
SUMMARY only, so the required additions to `100-RESEARCH.md` and tightening of `100-09-PLAN.md` could not
be made. The observed live effect is not substituted for that missing provenance.

## Required criterion-5 contingency bound (verbatim)

Criterion 5 is COVERED CONTINGENT ON TWO HUMAN GATES - the P100-09 leaked-password toggle and the P100-15 operator sign-off - and its 'advisors report clean' clause closes by CALIBRATED PROXY (catalog = advisor at HEAD, to the unit), NOT by direct observation of the advisor after the change.

## Required interim bound (verbatim)

The leaked-password oracle establishes that a known breached password is rejected with HTTP 422 and error code weak_password for a non-length reason. It does NOT establish that it was rejected BECAUSE it is breached - another weak_password rule rejecting the same password would pass identically. The breach-specific discriminator is unobservable until leaked-password protection is enabled; see the operator handoff.

The live reason `pwned` and its message are evidence of a distinct non-length password-policy verdict.
They are **not presented as proof that the rejection happened because the password is breached**. That
attribution requires the missing written toggle provenance and completion of the five-step handoff.

## Operator handoff status

- Human who enabled the setting: **not supplied**.
- Time enabled: **not supplied**.
- Written confirmation: **not supplied**.
- Operator answer on D-31: **not supplied; the interim bound above remains in force**.
- Step 1, immediate post-toggle probe: **not attestable**. A live passing probe was run on 2026-09-10,
  but there is no operator timestamp against which to establish that it was immediate or afterwards.
- Step 2, live discriminator capture: **complete in this SUMMARY** — reason `pwned`; message `Password
  is known to be weak and easy to guess, please choose a different one.`
- Step 3, command and discriminator in `100-RESEARCH.md`: **open due to the fixed file allowlist**.
- Step 4, persisted oracle tightened to the exact discriminator and re-run: **open due to the fixed file
  allowlist**. The unchanged plan oracle was re-run successfully; it still accepts any single non-length
  reason. No out-of-scope plan edit was made.
- Step 5, advisor call attempted: **complete as an unavailable credentialed endpoint**. The exact
  Management API request was attempted without an access token and returned HTTP 401, recorded below.

## Probe run 1 — recorded pre-toggle HEAD drill, verbatim

The only pre-toggle run in the repository is `100-RESEARCH.md` §10.4. Its record is reproduced verbatim;
the source itself abbreviated the generated emails and one UUID, so the missing characters cannot be
reconstructed honestly:

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

## Probe run 2 — live passing run on 2026-09-10, verbatim

The exact command body at `100-09-PLAN.md:21-116` was executed unchanged under Bash:

```bash
sed -n '21,116p' .planning/phases/100-security-posture/100-09-PLAN.md \
  | sed 's/^        //' \
  | /bin/bash
```

Verbatim output:

```text
P100-09-ARM1 discrimination_control len=5 http=422 error_code=weak_password reasons=[length] msg="Password should be at least 6 characters."
P100-09-ARM2 availability_control len=9 http=200 created_uuid=4621f738-46bf-427e-9eab-abf847521904
P100-09-ARM3 subject len=9 http=422 error_code=weak_password reasons=[pwned] msg="Password is known to be weak and easy to guess, please choose a different one."
P100-09-BOUND reasons=[pwned] is non-length and single-valued. This does NOT establish that the password was rejected BECAUSE it is breached - another weak_password rule rejecting the same string would pass identically. The breach-specific discriminator is unobservable until the toggle is on; see 100-CONTEXT.md D-31 and the post-toggle capture steps in this plan's checkpoint. NO further repair attempt is made before the toggle (OVERSEER-RULING-C2-04, DEFER-AND-TIGHTEN).
P100-09-FINALIZE created=[ p100-ctl-11675-1789049055@example.com]
  LIFECYCLE p100-ctl-11675-1789049055@example.com uuid=4621f738-46bf-427e-9eab-abf847521904 seen_before_delete=yes delete_http=200 refetch_http=404 catalog_after='<absent>'
P100-09-VERDICT requested=0 finalizer=0 combined=0 (3 dominates 1 dominates 0)
PROBE_COMMAND_EXIT=0
```

ARM 1 is the discrimination control: five characters produced exactly HTTP 422, `weak_password`, reason
`length`, and the derived length message. ARM 2 is the availability control at the same nine characters
as ARM 3; it returned HTTP 200 and resolved UUID `4621f738-46bf-427e-9eab-abf847521904`. ARM 3 returned
HTTP 422, `weak_password`, exactly one non-length reason, and a message distinct from ARM 1. The sole
created account was present before deletion, DELETE returned 200, refetch returned 404, and the final
catalog read was absent.

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

## Advisor attempt and residual

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

The endpoint was attempted and was unavailable to this worker for a credentialed reading. It gives no
post-change advisor verdict, so the calibrated proxy remains the only closure mechanism for the advisor
clause.

The corrected residual is: advisors DO report auth_leaked_password_protection, so a later toggle-off is DETECTABLE, and the gap is that nothing runs get_advisors on a schedule, so it is detectable but NOT DETECTED, carried to Phase 101.

No claim is made that advisors directly observed the post-toggle state. Scheduling `get_advisors` is
outside this task and remains assigned to Phase 101.

## Final disposition

The behavioural effect and cleanup lifecycle are green. Full checkpoint closure remains contingent on
an identified human's written confirmation and time, their explicit acceptance of the D-31 bound, the
out-of-scope research entry, and the out-of-scope persisted exact-discriminator oracle. P100-15's
operator sign-off remains the second human gate.
