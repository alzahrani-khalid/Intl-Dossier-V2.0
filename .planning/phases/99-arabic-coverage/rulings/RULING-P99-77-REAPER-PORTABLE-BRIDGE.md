# RULING-P99-77 — portable synchronous bridge and file ownership

**Decision:** The R14 bridge is not acceptable below Node 24 and introduced an untracked file artifact. Repair the selftest/criteria; runtime remains frozen. No rendered run, standalone gate, commit, compile, or Phase-99 run is released.

## 1. Bridge works at the repository Node floor

Do not depend on `process.execve`. Implement a POSIX identity-preserving bridge compatible with the repository's supported Node floor:

1. spawn a shell bridge as the synchronous child;
2. before target execution, invoke the selftest registration helper with the bridge shell's own PID (`$$`), manifest path, family and root;
3. helper resolves/writes pid/pgid/sid/start/cwd atomically and returns only after manifest read-back succeeds;
4. shell `exec`s the target argv, preserving the bridge PID/identity;
5. registration/read-back/exec failure exits non-zero and never runs the target after failed ownership.

No quiet fallback to a pending-only slot is allowed. If `/bin/sh`, registration helper or identity instruments are unavailable, the fixture fails closed.

Test under the current Node and a constructed Node-floor capability mode with `process.execve` absent; the same bridge path must work. Do not change project engines to hide the incompatibility.

## 2. Manifest owns files as well as directories/processes

Add versioned `files` records with family, canonical path, status and timestamps. Register every generated bridge/helper/fixture file before use, update status on removal, and external checker verifies absence/metadata. Complete manifests reject active/pending files or missing required fields.

The top-level and local cleanup remove only registered owned files after owned processes are zero. An abrupt run leaves the bridge file named in the partial manifest; checker fails until exact cleanup.

## 3. Exact bridge-window control

Execute a parent kill precisely while the bridge-backed target is still blocked in `spawnSync`, after child self-registration is read back and before target exit. Prove partial manifest carries exact live identity and allows cleanup with no out-of-band discovery.

Add registration failure, manifest read-back failure, shell exec failure and bridge-file cleanup controls. Preserve all eight evidence paths named in R11–R14 handoffs; never glob them.

## Implementer and surface

Resume Sonnet once if decisive, otherwise cold-start Sonnet. Edit only selftest and criteria. Runtime `5e073e35…` byte-identical. No Kimi, subagents, commit, rendered run, tickmarkr command or reviewer spawn.

Deliver `.tickmarkr/overseer/P99R-R15-REPAIR-REPORT.md` ending `REAPER-R15-REPAIR-END`. The orchestrator verifies runtime/evidence preservation, scope, portable bridge controls and file-manifest checker; freezes hashes; writes `.tickmarkr/overseer/P99R-R15-REPAIR-HANDOFF.md` ending `ORCH-REAPER-R15-REPAIR-END`; stops for confirmation release.

## Evidence

- `.tickmarkr/overseer/P99R-VERIFY-RESIDUE-R13.md`
- `.tickmarkr/overseer/CONSULT-REAPER-RESIDUE-R13.md`
- `.tickmarkr/overseer/P99R-R14-REPAIR-HANDOFF.md`
