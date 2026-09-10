---
phase: 100-security-posture
status: complete
verified: 2026-09-11
requirements: [DBSEC-01, DBSEC-02, DBSEC-03, DBSEC-04, DBSEC-05, CLIENTSEC-01, CLIENTSEC-02]
---

# Phase 100 verification and evidence register

## Verdict

Phase 100 is **COVERED, with the human-gate and evidence bounds below**. The fresh P100-15 arithmetic
run read **33 public views, 12 carrying `security_invoker=true`, and 12 still client-readable**. The
remaining 21 are restricted. `client_but_not_invoker=0` is printed as a diagnostic and does not affect
the exit code. The per-object proof is not this arithmetic: it is P100-12, P100-13 **and** P100-14.

The checkpoint was answered in writing by `overseer-p100-r2` under the operator's standing delegation.
The attestation expressly says that the operator had not personally reviewed the register and that
personal review remains owed. No worker assertion is substituted for that attestation; the complete
contents of `100-15-SIGNOFF.md` are quoted below.

That sign-off was written about nine minutes before the first register and does not mention P100-12,
P100-13 or P100-14. It therefore does not evidence that the operator saw the three wave-3 re-proofs.
The operator's owed review must include those re-proofs, the carried findings, and the six-view
empty-on-staging correction recorded below; until then, the written checkpoint answer is the delegated,
revocable sign-off quoted here, not a personal operator review of this register.

## Criterion → plan → oracle → observed result

| # | Roadmap criterion | Producing plans and final proof | Observed result | Verdict |
| --- | --- | --- | --- | --- |
| 1 | Client-reachable definer views converted, restricted, or justified; `unified_work_items` remains correct | P100-01–05; final P100-12 grants/invoker rows, P100-13 caller census, P100-14 criterion-2 state/read | 12/12 named views invoker-enabled; 20/20 unconsumed views restricted; `upcoming_milestones` restricted; owner/non-owner census 21/2 | COVERED, subject to the six-empty-view and tracked-consumer bounds |
| 2 | No client view exposes `auth.users` | P100-04; final P100-14 state rows and behavioural reads | `entity_comments_with_details`: invoker/readable, reads `public.users`, not `auth.users`; `upcoming_milestones`: not client-readable; dependency detector control=18 | COVERED |
| 3 | No materialized view selectable by client roles | P100-06 plus later dispositions; final P100-12 every-grantee rows | 12/12 named materialized views render only `postgres` and `service_role`; client privileges false | COVERED |
| 4 | The two no-policy tables match their intended service-role-only posture | P100-07; final P100-14 seven-field rows, complete ACLs and reads | exactly two policies; each is `p100_service_role_only|PERMISSIVE|*|service_role|true|true`; queue client read denied | COVERED |
| 5 | Leaked-password protection, pinned function paths, advisors clean for owned classes | P100-08/09; final P100-13 function/digest/caller oracle; P100-15 sign-off | 557 approved + 35 identity-pinned exceptions = 592, unpinned=0; Auth three-arm probe distinguishes `length` from `pwned`; advisor clause uses calibrated proxy | COVERED CONTINGENT ON TWO HUMAN GATES; both written checkpoint answers are carried below |
| 6 | Sign-out clears client-side residue | P100-10 exact-equality tests | `SIGNED_OUT` leaves exactly the five identity-neutral allowlisted values; neighbouring auth event leaves the entire seed unchanged | COVERED; `sessionStorage` is outside the measured boundary |
| 7 | Production browser builds do not ship verbatim sources without a decision | P100-11 executed config branches and manifest walk | `OFF=false`, `ON="hidden"`; 473 manifest entries, 478 named/build-emitted files, 0 orphans, 0 ghosts; map/reference zeros are diagnostic | COVERED |

## All fourteen predecessor summaries consumed

| Summary | Evidence carried into this register |
| --- | --- |
| P100-01 | `unified_work_items` invoker conversion and live 21-owner/2-non-owner census; tracked consumers are 2 files and 16 call sites. |
| P100-02 | `mous_frontend`, `event_details`, `working_group_stats` invoker flags and classified reads; `event_details=0` is an answered read. |
| P100-03 | Seven edge-function view flags and reads: non-zero controls 5/3/17 plus four answered empty views. |
| P100-04 | The two criterion-2 states, 18-dependency control, behavioural answer/denial pair, and the 415/415 `public.users` visibility bound. |
| P100-05 | Twenty every-grantee restricted-view rows, twenty authenticated denials, retained service-role access, and tracked-source consumer bound. |
| P100-06 | Materialized-view revocation proof and retained definer-consumer controls; its later-population handoff is resolved by fresh P100-12. |
| P100-07 | Two intended service-role-only policy rows, complete ACLs, queue denial and service-role answering controls. |
| P100-08 | Function `search_path` migration, replay, before/after configuration census and unchanged 21/2 caller census. |
| P100-09 | Operator toggle attestation, three-arm `length`/available/`pwned` probe, checked cleanup, unavailable worker-side advisor call and calibrated-proxy bound. |
| P100-10 | Exact storage equality, non-sign-out neighbour, executable key extractor and explicit `sessionStorage` exclusion. |
| P100-11 | Executed no-Sentry/Sentry config branches, fresh build and bidirectional manifest/tree proof. |
| **P100-12** | **Fresh wave-3 every-grantee grant rows for 20 views and 12 materialized views, plus all 12 invoker flags.** |
| **P100-13** | **Fresh wave-3 function configuration with the 35-signature digest and final 21/2 caller census.** |
| **P100-14** | **Fresh wave-3 two seven-field policy rows, two criterion-2 state rows and all three behavioural reads.** |

## Wave-3 per-object evidence carried into the register

These three re-proofs are present in the register for the operator's owed review. The earlier sign-off
does not name them, so this register does not claim they were presented before that sign-off.

### P100-12 — grants and invoker flags

For each of the following 20 views and all 12 materialized views, the fresh row rendered **every
grantee** with this exact ACL payload and no `PUBLIC` or client-role entry:

```text
anon_can_select=false authenticated_can_select=false | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
```

- Views (20): `ai_interaction_summary`, `ai_usage_summary`, `audit_logs_active`,
  `citation_statistics`, `commitment_analytics`, `embedding_queue_stats`, `engagement_analytics`,
  `engagement_briefs`, `intelligence_cache_status`, `link_audit_logs_archival_eligible`,
  `recent_field_changes`, `resolved_field_permissions`, `sla_compliance_by_assignee`,
  `stakeholder_timeline_unified`, `top_contributors`, `user_ai_usage`,
  `user_digest_content_summary`, `user_work_summary`, `v_dossier_extension_health`,
  `work_item_analytics`.
- Materialized views (12): `aa_commitment_summary_by_dossier`, `citation_network`,
  `dossier_commitment_stats`, `dossier_engagement_stats`, `dossier_list_mv`,
  `mv_tag_usage_analytics`, `relationship_commitment_stats`, `relationship_engagement_stats`,
  `sla_compliance_metrics`, `stakeholder_network_summary`, `team_entity_stats`,
  `user_productivity_metrics`.

```text
P100-12-VIEWS named=20 rendered=20 at_expected_full_state=20 expected rendered=20 at_expected_full_state=20
PASS grants
P100-12-MATVIEWS named=12 rendered=12 at_expected_full_state=12 expected rendered=12 at_expected_full_state=12
PASS grants
P100-12-INVOKER invoker_on=12 present=12 expected invoker_on=12 present=12
PASS invoker-flag
```

The false client privilege values are controlled by populated named/rendered counts and by the complete
ACL rendering, which would show `PUBLIC`; they are not bare zeros.

### P100-13 — function identity and final caller census

```text
P100-13-RUN started_at=2026-09-10T20:51:19Z
P100-SEARCHPATH at_approved=557 other=35 unpinned=0 population=592 expected_approved=population-minus-35=557 other_identity_digest=a10d3e1256979bf019d8a9b68c959cb8
P100-SEARCHPATH-CONTROL approved_plus_other=592 population=592 unpinned=0 expected_other=35 recorded_head_digest=a10d3e1256979bf019d8a9b68c959cb8
PASS search_path configuration
P100-CENSUS unified_work_items owner=21 other=2 expected owner=21 other=2
PASS census
P100-13-RUN exit=0
```

`unpinned=0` is controlled by the positive 592-object population, the 557+35 complete partition and
the digest of the exact 35 signature/configuration pairs. The owner=21 positive arm controls the
non-owner=2 narrowing; the HEAD baseline was owner=21/non-owner=21.

### P100-14 — policy rows, criterion-2 states and behavioural reads

```text
POLICY events.idempotency_keys|p100_service_role_only|PERMISSIVE|*|service_role|true|true
POLICY public.intelligence_email_queue|p100_service_role_only|PERMISSIVE|*|service_role|true|true
GRANTS events.idempotency_keys :: postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE anon=false auth=false
GRANTS public.intelligence_email_queue :: postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE anon=false auth=false
P100-POLICY total_target_policies=2 queue_row=1 keys_row=1 queue_grants_ok=1 keys_grants_ok=1 expected total=2 and 1 for each
PASS policy rows
STATE entity_comments_with_details invoker=true client_readable=true reads_public_users=true reads_auth_users=false
STATE upcoming_milestones invoker=false client_readable=false reads_public_users=false reads_auth_users=true
P100-04-STATE entity_comments_row_matches=1 upcoming_milestones_row_matches=1 dependency_detector_control=18 expected 1 1 18
PASS criterion-2 state
P100-14 reads: entity_comments_with_details=0(empty-on-staging) upcoming_milestones=denied intelligence_email_queue=denied
PASS reads
```

The `reads_auth_users=false` state has the positive dependency-detector control=18. The empty
`entity_comments_with_details` result is a successful numeric answered read, while the same classifier
also identifies two permission denials; it is not a dead connection or a denial recast as zero.

## Fresh P100-15 arithmetic

The plans that produced the object changes ran concurrently, so the global arithmetic is asserted
once here. The command ran in Bash on 2026-09-11 and exited 0:

```text
P100-15-POSTURE views=33 invoker=12 client_readable=12  [DIAGNOSTIC, NOT GRADED] client_but_not_invoker=0
P100-15-EXPECT views=33 invoker=12 client_readable=12  (the per-object proofs are P100-12, P100-13 and P100-14)
PASS posture arithmetic (client_but_not_invoker printed above is cross-check arithmetic, not a criterion)
```

The GRADED values are positive: 33, 12 and 12. `client_but_not_invoker` is PRINTED beside them without
touching the exit code, because a zero that sets the exit code is a criterion whatever prose calls it.
The probe exits 3 if `public` no longer holds exactly 33 views.

## Roadmap numbers that did not reproduce

| Roadmap statement | Reproduced measurement and command | Disposition |
| --- | --- | --- |
| 6 persisted Zustand stores | **5** — `git grep -nI "persist(" -- 'frontend/src/**'` | The deleted `services/auth.ts` was the sixth; criterion 6 covers 5 stores plus 2 raw writers. |
| `unified_work_items` queried from 10 frontend files | **2 files / 16 call sites** — `git grep -nI "from('unified_work_items')" -- 'frontend/src/**'` | No measured population was 10; the row census, not the file count, closes DBSEC-01. |
| 305 `.map` files | **304 at HEAD** — `find frontend/dist/assets -name '*.map' \| wc -l` | The tree was stale; P100-11 closes on the fresh executed config and manifest, not this diagnostic count. |
| approximately 415 fixture accounts | **402 = 338 + 64**, while total `auth.users` is 415 — the three commands below | Phase 102 inherits 402, not the different total-auth-users population. |

```bash
psql "$SUPABASE_DB_URL" -Atq -c "select 'example.com='||count(*) from auth.users where email like '%@example.com'"
psql "$SUPABASE_DB_URL" -Atq -c "select 'gastat.test='||count(*) from auth.users where email like '%@gastat.test'"
psql "$SUPABASE_DB_URL" -Atq -c "select 'total='||count(*) from auth.users"
```

Recorded output: `example.com=338`, `gastat.test=64`, fixture accounts **402**, `total=415`.

The non-criterion goal-line claim of 207 frontend files also had no reproducing derivation: direct
Supabase imports=140, direct `supabase.from(` files=29, and any `.from(` chain=87. It is not quoted
forward as an acceptance fact.

## `100-CONTEXT.md` §4 — verbatim

## 4. What this phase does NOT establish even when green

- That RLS is **correct**, only that it is **reached**. Converting a view to `security_invoker` makes the
  base tables' policies apply; whether those policies encode the right rule is a different phase.
  `unified_work_items`' non-owner count falling from 21 to 2 proves the boundary now exists — the
  remaining 2 rows are what `intake_tickets`' policy deliberately permits (D-03 out-of-scope note).
- That the 548 pinned functions are **safe**, only that their `search_path` is no longer caller-mutable.
- That `localStorage` is empty on a **shared** machine after a browser crash, only after a sign-out that
  reaches the seam. A killed tab never runs the handler.
- That staging's numbers are production's. Every hardcoded count in this phase is a staging count with
  21 work items and 415 auth users; the re-deriving query travels with each one.
## D-31 bound and disposition

The required interim language is carried verbatim:

> The leaked-password oracle establishes that a known breached password is rejected with HTTP 422 and
> error code `weak_password` for a non-`length` reason. It does **NOT** establish that it was rejected
> BECAUSE it is breached — another `weak_password` rule rejecting the same password would pass
> identically. The breach-specific discriminator is unobservable until leaked-password protection is
> enabled; see the operator handoff.

**OPEN - DEFERRED TO TOGGLE** was the interim status before the toggle; it remains explicit here as
history rather than being silently erased by the worker. P100-09 owns the five post-toggle steps: run
the probe once immediately after the toggle; capture the
actual reason and message verbatim; record them with their producing command in `100-RESEARCH.md`;
tighten the oracle to that exact discriminator and rerun it; and attempt the Supabase security-advisor
call in the same credentialed session and record its result. P100-09 records those first four as done
and the worker advisor attempt as HTTP 401. The current phase-register status is **CLOSED**, on the
operator's personal `100-09-ATTESTATION.md` answer plus P100-09's post-toggle probe observing
`reasons=["pwned"]`. The delegated sign-off quotes that human disposition. Thus the interim status it
replaced and the current status are both preserved without manufacturing a worker attestation.

## Operator checkpoint — `100-15-SIGNOFF.md` quoted verbatim

The following is the complete, verbatim content of
`.planning/phases/100-security-posture/100-15-SIGNOFF.md` from commit `da1b5fbc5`:

```text
# PHASE 100 SIGN-OFF — given by the OVERSEER under the operator's standing delegation (2026-09-10T21:00:45Z)

**Who decided:** the overseer seat (overseer-p100-r2, pane w0:pGJ), acting under the operator's written
delegation of 2026-09-10 ("you are in charge .. keep going till you finish the milestone",
`.tickmarkr/overseer/p100/OVERSEER-DELEGATION-260910.md`). **The operator has NOT personally reviewed this
register.** Their review is OWED and recorded as the first item of the morning handoff; this sign-off is
revocable by them and says so.

**Answers to the checkpoint, in the register's words — all four bounds ACCEPTED as stated:**
1. Five of the twelve converted views hold zero rows on staging; for those five criterion 1 establishes an
   unbroken read path and NOT row scoping. Accepted; criterion 1 is COVERED with that bound.
2. The revocations were validated against tracked repository sources only; an untracked consumer would break
   LOUD (permission denied) and REVERSIBLE (re-GRANT). Accepted. Tonight this bound was exercised THREE times
   on tracked-but-uncensused consumers (edge functions via anon key, invoker functions/views/triggers) and each
   was rolled back within minutes; the census method was corrected (catalog probe, P100-06/16/17).
3. Criterion 5 is COVERED CONTINGENT ON TWO HUMAN GATES; the P100-09 toggle gate was decided by the OPERATOR
   personally (100-09-ATTESTATION.md); this checkpoint gate is decided by the overseer under delegation.
4. D-31: status is **CLOSED**, not "OPEN - DEFERRED TO TOGGLE": with protection on, the rejection carries
   reasons=["pwned"], the breach-specific discriminator; the operator answered this on 2026-09-10
   (100-09-ATTESTATION.md). The register records CLOSED and cites the attestation.

**Additional bound the overseer adds to the register (not in the plan text):** the live
`dossier_relationships` SELECT policy compares `profiles.id`, a column that does not exist; it scopes nothing
it intends to. Found by review during P100-17, NOT fixed in Phase 100 (out of every task's scope), carried to
the Phase 102 debt tail (`.tickmarkr/overseer/p100/FINDING-P100-LIVE-POLICY-PROFILES-ID.md`). The P100-17
definer RPC substitutes the user_id comparison in its own copy and is correct.

**Sign-off:** Phase 100's security posture is ACCEPTED with the five bounds above. Signed: overseer-p100-r2,
under delegation, 2026-09-10T21:00:45Z.
SIGNOFF-END
```

The quote is intentionally uncorrected. Its “five” answer reflects D-29 and conflicts with the evidence
already carried from P100-04 and P100-14: `entity_comments_with_details` is also a converted view whose
authenticated read answered with 0 rows. This makes **six** empty-on-staging converted views. The
disagreement with D-29 and the signed-off “five” is routed to the operator's owed review, together with
the three wave-3 re-proofs that the pre-register sign-off does not say the operator saw.

## Residue carried onward

- **Phase 101:** nothing schedules `get_advisors`; a later leaked-password toggle-off is DETECTABLE by
  the advisor but not DETECTED automatically.
- **Phase 102:** reconcile the migration ledger; purge the measured **402** fixture accounts (not the
  415 total users); and carry the attestor's `dossier_relationships` policy finding.
- **Phase 103:** own the 670 executable-grant warnings and 4 extension-in-public advisor warnings.

## Closing language handed to the roadmap

The phase closes only with these bounds attached:

1. Six of the twelve converted views are empty on staging; this corrects D-29 and the quoted sign-off's
   “five”, and the disagreement is owed operator review.

   - For `event_details`, criterion 1 establishes an unbroken read path, NOT row scoping.
   - For `theme_details`, criterion 1 establishes an unbroken read path, NOT row scoping.
   - For `relationship_health_summary`, criterion 1 establishes an unbroken read path, NOT row scoping.
   - For `v_country_relationship_flows`, criterion 1 establishes an unbroken read path, NOT row scoping.
   - For `engagement_recommendations_summary`, criterion 1 establishes an unbroken read path, NOT row scoping.
   - For `entity_comments_with_details`, criterion 1 establishes an unbroken read path, NOT row scoping.

   Criterion 1 COVERED does not mean row scoping was verified for all twelve.
2. The 21 revocations were validated against **TRACKED REPOSITORY SOURCES ONLY**. A consumer outside
   the tree — a BI tool, a Retool app, or a saved dashboard query — would not have appeared in the
   census. The break, if it occurs, is **LOUD (permission denied)** and **REVERSIBLE (re-GRANT)**.
3. Criterion 5 is COVERED CONTINGENT ON TWO HUMAN GATES - the P100-09 leaked-password toggle and the P100-15 operator sign-off - and its "advisors report clean" clause closes by CALIBRATED PROXY (catalog = advisor at HEAD, to the unit), NOT by direct observation of the advisor after the change.
4. The D-31 interim bound remains visible as **OPEN - DEFERRED TO TOGGLE**: the oracle establishes HTTP
   422 and `weak_password` for a non-length reason, not that rejection was BECAUSE the password was
   breached; another weak-password rule could pass identically until the breach-specific discriminator
   is observable. The current status is **CLOSED** on the operator personally answering
   `100-09-ATTESTATION.md` plus P100-09's `reasons=[pwned]` probe; this is a human disposition backed by
   the post-toggle instrument, not a worker-created green.
5. The live `dossier_relationships` SELECT policy compares nonexistent `profiles.id`; it does not scope
   what it intends. Phase 102 owns that signed-off additional bound.
