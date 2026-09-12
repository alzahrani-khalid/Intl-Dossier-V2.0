# RULING-P99-76 — complete synchronous-child ownership bridge

**Decision:** The pending slot is a correct alarm but not ownership. Complete the child half of the bridge and remaining fixture/schema coverage. Runtime remains frozen. No rendered run, standalone gate, commit, compile, or Phase-99 run is released.

## 1. Child self-registration before blocking work

For managed synchronous children, launch through a selftest-owned bridge process that:

1. receives manifest path, family, canonical root and target argv;
2. writes its own pid/pgid/sid/canonical start/cwd into the pending slot atomically;
3. replaces itself with the target command while preserving identity (`process.execve` or an equivalently identity-preserving mechanism);
4. fails non-zero before target execution if registration/persistence/exec is unavailable.

The parent records the pending slot before spawn. Parent-killed-mid-spawn must leave exact child identity in the manifest, sufficient for external cleanup without out-of-band discovery. A null pending slot remains fail-closed but is not accepted as ownership.

## 2. Complete centralization and local ownership

Route plantSession, reg33, reg36 driver/grandchild, T11 generated dummy, reg28 nested child and every remaining real spawn through centralized ownership. Add local `try/finally` to D8 and reg35 plus any remaining reviewer-named family.

`reg38-control-1` must learn and drain its blocked child through the manifest; no negative control may leak by construction.

## 3. Enforce identity schema, not field names

For active and cleaned process records require valid non-null pid, pgid, sid, canonical start, canonical cwd/root, family, status and timestamps. Pending slots may contain null identity only while completion is `in-progress`; a `complete` manifest with any pending slot fails.

Validate:

- root/cwd canonical and cwd contained by root;
- start canonical/attainable;
- status transition legal;
- unique active identities;
- port records include owner family, port and status;
- no sentinel/noncanonical placeholders.

The checker rejects any null identity in complete records, invalid root, missing owner or malformed transition.

## Controls

Execute:

- real parent SIGKILL during bridge-backed spawnSync, then clean exact child using manifest only;
- bridge registration failure and exec failure;
- null-identity complete manifest, sentinel-root record, ownerless port and illegal transition — each checker red;
- all remaining family forced throws, reg35 RED→GREEN and reg38 controls;
- four locales with immediate manifest checks and preserved evidence paths.

## Implementer and surface

Resume Sonnet once if decisive, otherwise cold-start Sonnet. Edit only selftest and criteria; runtime `5e073e35…` byte-identical. No Kimi, subagents, commit, rendered run, tickmarkr command or reviewer spawn.

Deliver `.tickmarkr/overseer/P99R-R14-REPAIR-REPORT.md` ending `REAPER-R14-REPAIR-END`. The orchestrator verifies runtime/evidence preservation, scope, writer exit and bridge control; freezes hashes; writes `.tickmarkr/overseer/P99R-R14-REPAIR-HANDOFF.md` ending `ORCH-REAPER-R14-REPAIR-END`; stops for confirmation release.

## Evidence

- `.tickmarkr/overseer/P99R-VERIFY-RESIDUE-R13.md`
- `.tickmarkr/overseer/CONSULT-REAPER-RESIDUE-R13.md`
- `.tickmarkr/overseer/P99R-R13-REVIEW-HANDOFF.md`
