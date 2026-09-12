# RULING-P99-81 — R17 confirmation fails; repair control authority in R18

**Decision:** Reject R17 confirmation. Both reviewers reproduced every green oracle; Codex still returned NO-CONFIRM with six material predicate/authority defects, and Grok constructed counterexamples the pins and census miss. Repair the selftest and criteria in R18. Runtime remains frozen. Both phase gates, candidate commit, compile, and Phase-99 execution remain closed.

## 1. What remains accepted

R17's normal-path behavior remains evidence, not waste: the portable bridge works, record-before-write ordering holds in the tested windows, the exact totals are truthful on the current candidate, and normal reg31 reconciliation does not widen `sweepRegistry`. R18 repairs what the controls and abort paths establish; it does not reopen the frozen runtime verdict.

## 2. Destructive transitions require a successful predicate

The shared `check()` records a tally; it is not control flow. R15–R17 controls incorrectly treat a later red tally as permission to continue destructive cleanup.

R18 must enforce these invariants in the real control paths:

- a failed file removal never transitions that file record to `cleaned`;
- a failed session drain never removes its root or transitions session/directory records to `cleaned`;
- a failed checker predicate never deletes the root containing the only manifest;
- the ownership manifest outlives every externally located artifact it names.

Add executable failure controls for reg39 and reg41. Force removal failure and drain failure, respectively, and prove the file/root remains, records remain active, the manifest remains readable, and the checker stays red. Then perform exact successful cleanup and prove the legal transitions. An empty `catch`, tally-only `check`, or unconditional status rewrite is not acceptable.

## 3. The helper cannot exist without durable authority

Bare selftests currently can call `ensureRegistrationHelper()` directly from reg38/reg40 while `activeManifestPath` is null. `regFile` then records only in memory; abrupt parent death leaves a top-level helper with no durable manifest. This is a confirmed structural defect and a sufficient origin class for the preserved helper.

R18 must ensure every helper-creating path has an active durable manifest before `regFile` runs. The boring solution is preferred: move direct helper controls into explicit manifest-backed driver processes and make bare `--selftest` incapable of creating the shared helper. Prove a bare run executes the full suite while creating zero helper files, and prove each helper control's manifest survives any forced failure until exact cleanup succeeds.

The preserved `tkr-bridge-helper-67472.mjs` remains untouched at SHA-256 `92633d5d8c0b89249c2647197ba5d1b949a44e0027b602a2919c383159b344f5`. No manifest names its invocation, so no cleanup authority exists.

## 4. reg40 must drive the real parent path

`reg40` hand-builds a manifest and invokes the shell constants directly. It does not test `regSpawnSync`, and `before === 'function'` makes the control fail on a real Node floor where `process.execve` begins absent.

R18 must invoke the real `regSpawnSync` path in the parent process with a durable manifest and `process.execve` absent before the call. The control passes whether absence is native or constructed; it must not require prior presence. It must prove pending-record creation, helper routing/read-back, target execution, and complete identity through the same function production fixtures use.

## 5. reg31 has no post-spawn/pre-durable window

`reg31PlantDual` currently spawns and records the live session in the isolated ledger before persisting the run-wide session record. A kill in that ordering leaves the durable directory but no durable session identity.

Before spawning, persist a pending plant record. The child must self-register its real session identity and read it back before forking the second process or blocking; registration failure exits before the plant can outlive the parent. The parent may then mirror the resolved identity into the isolated view. Add a deterministic kill after spawn but before any parent-side registration and prove the manifest alone still names and cleans the session.

This supersedes the earlier allowance for parent-only immediate registration for this real forked-session plant. The observed orphan class makes child self-registration necessary here.

## 6. reg41 cleanup is manifest-only in fact

The sentinel may announce the kill window; it may not supply cleanup identity. After the driver dies, reg41 must parse the partial manifest and derive both session ids and roots from its records. Feed only those parsed values to cleanup. Prove a corrupted or missing manifest identity blocks cleanup even when the sentinel contains valid values.

Do not remove either root or mark any record cleaned unless its own drain/removal succeeded. The checker must remain red on an in-progress manifest for the completion reason, while each exact cleaned identity line turns green only after successful cleanup.

## 7. CENSUS control exercises a write and states its boundary

The shipped negative control classifies a path it never writes. Replace it with an actual unclassified write through the same wrapped `writeFileSync` path used by the parent selftest; prove CENSUS turns red, then remove only that exact control file and restore the run.

Do not claim process-complete coverage. The wrapper cannot observe `rawWriteFileSync`, append/stream APIs, or child-process writes. R18 must:

- keep raw manifest persistence behind the one allowed internal sink;
- route every other parent-process generated write through the census wrapper;
- constrain generated child outputs to registered roots or explicit record-first standalone paths; and
- state the boundary in criteria and report.

The structural confirmer, not a self-reported count, verifies there is no changed bypass.

## 8. Count pin covers summary integrity; review covers predicate semantics

The current pin catches honest N-1 totals but accepts a decoy summary, a hardcoded banner, and replacement of a load-bearing assertion with `check(true)` padding.

R18's executable oracle must assert all of:

- exactly one `SELFTEST OK` summary exists and it is the final output line;
- the independently counted `^PASS ` rows equal the pinned total;
- section totals add to the same total; and
- no `FAIL` row exists.

Add decoy-summary and hardcoded-banner mutants and prove they turn red. Keep the existing honest-shortfall mutants.

No generic count can prove predicate semantics. A dummy row preserving the same identity remains a structural-review concern; say so explicitly rather than claiming an impossible executable guarantee. Confirmation is not satisfied until the structural reviewer reads every changed predicate.

## 9. Surface, evidence, and handoff

- Editable surface: `scripts/pw-run-reaped.selftest.mjs` and `.tickmarkr/overseer/P99R-REAPER-CRITERIA.md` only.
- Frozen runtime SHA-256: `5e073e3577be3ec3032cbd728fd4027a9c330319cac069eb45658df31ded50a3`.
- Preserve the helper above, the three foreign graph-bearing directories, and all eight R11–R14 evidence paths by exact identity; never glob `tkr-*`.
- Resume the R16/R17 Sonnet seat once; it owns these controls and is below the context threshold. Close the settled reviewer panes only after their reports and hashes are preserved; re-use the same Grok and Codex lineages for the post-R18 confirmation round because they found these defects.
- Deliver `.tickmarkr/overseer/P99R-R18-REPAIR-REPORT.md` ending `REAPER-R18-REPAIR-END`.
- The orchestrator independently reproduces every forced failure, authority lifetime, real regSpawnSync path, post-spawn kill, manifest-only cleanup, census red, summary mutants, totals, runtime/scope, and preserved identities. Freeze and deliver `.tickmarkr/overseer/P99R-R18-REPAIR-HANDOFF.md` ending `ORCH-REAPER-R18-REPAIR-END`, then stop.
- Reviewer confirmation remains closed until a later ruling releases the same finding-owner seats against the R18 freeze.

**Ship/no-ship:** These defects are in the Phase-99 safety harness and can be hit by an interrupted verification run. They belong in the selftest/criteria candidate. Prose corrections or deletion of the preserved helper do not repair authority and are rejected.
