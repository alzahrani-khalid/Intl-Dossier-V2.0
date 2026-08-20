# RULING-P99-78 — R15 is not confirmed: executable counts and record-first file ownership

**Decision:** Reject R15 confirmation. The portable shell bridge itself is accepted as the current candidate, but the R15 criteria and file-ownership proof do not satisfy RULING-P99-77. Repair the selftest and criteria in R16. Runtime remains frozen. No rendered run, standalone gate, commit of the candidate, compile, or Phase-99 run is released.

## 1. Executable criteria must pin the delivered behavior

The R15 handoff independently reproduced `SELFTEST OK (230/230)` and `MANIFEST-CHECK OK (207/207)`, but the executable criteria assert exit status only. The exact totals exist only in comments. Removing checks can therefore lower either total while every declared command remains green.

R16 must make the criteria behaviorally assert the exact selftest and checker totals delivered by the final candidate, including the Arabic-locale selftest and the manifest/checker command. If R16 legitimately adds checks, pin the raised totals, not the R15 totals. Add a positive control that removes or bypasses one counted row, or substitutes a lower truthful summary, and prove the executable oracle turns red. A source-text count or comment grep is not evidence.

## 2. File ownership is record-first, not write-then-record

`ensureRegistrationHelper()` currently writes `$TMPDIR/tkr-bridge-helper-<pid>.mjs` and only then calls `regFile`. A kill in that interval recreates R14's defect: a standalone file exists before any durable manifest record can name it. The comment says "registered before use"; the safety property is stronger because abrupt death can occur before use.

R16 must durably register the canonical standalone path before the first byte is written. The real helper-creation path must have a deterministic abrupt-exit control that proves both windows:

1. after the file record is durable but before file creation; and
2. after file creation but before normal cleanup.

In both windows the partial manifest must name the exact path. The external checker must fail on the active record, and exact cleanup must make that record pass. A hand-authored scratch manifest is not a control of `ensureRegistrationHelper()`.

## 3. One `regFile` call site is a census question, not a ratio verdict

The handoff measured one `regFile` call against 75 `writeFileSync` sites and also measured zero new top-level residue. Do not mechanically register every file already contained by a registered directory; that duplicates ownership without improving cleanup.

R16 must instead derive and execute a complete write-path census. Every generated path must be classified as exactly one of:

- the manifest's own atomic persistence path;
- contained by a durably registered directory whose cleanup owns it; or
- a standalone file, individually registered before creation.

The census must fail on an unclassified write site and must include a deliberately unclassified standalone-file control. If the census proves the helper is the only standalone generated file, one production `regFile` call site is sufficient. If it finds another standalone path, that path must use the same record-first ownership rule. This clarification narrows RULING-P99-77's phrase "every generated bridge/helper/fixture file" to the ownership boundary that matters: no generated path may exist outside both a registered directory and a prior file record.

## 4. Construct the Node-floor condition on the process that selects the bridge

R15 deletes `process.execve` inside the registration helper, where the value is never consulted. That does not construct the required capability-absent condition on the parent selftest process that runs `regSpawnSync`.

R16 must run the bridge control with `process.execve` absent in that parent process and prove the same `/bin/sh` registration/read-back/`exec` path succeeds. No Node-engine change and no second fallback path.

## 5. Surface, evidence, and release

- Editable surface: `scripts/pw-run-reaped.selftest.mjs` and `.tickmarkr/overseer/P99R-REAPER-CRITERIA.md` only.
- Frozen runtime SHA-256: `5e073e3577be3ec3032cbd728fd4027a9c330319cac069eb45658df31ded50a3`.
- Preserve all eight evidence paths from R11–R14 by exact name; never glob `tkr-*`.
- Use a fresh visible Sonnet implementer seat; the R2–R15 lineage is at 84% context and is closed after its complete artifact is preserved.
- The orchestrator independently verifies the raised totals, both count-oracle controls, record-before-write ordering, the real helper abrupt-exit controls, the complete write-path census and its positive control, parent-process `execve` absence, runtime identity, scope, and all eight evidence paths.
- Deliver `.tickmarkr/overseer/P99R-R16-REPAIR-REPORT.md` ending `REAPER-R16-REPAIR-END`, then `.tickmarkr/overseer/P99R-R16-REPAIR-HANDOFF.md` ending `ORCH-REAPER-R16-REPAIR-END`.
- Stop after the handoff. Reviewer confirmation remains a separate, unreleased gate.

**Ship/no-ship:** These are Phase-99 harness-integrity defects, not end-user application behavior. The fix remains in the selftest/criteria surface mandated by RULING-P99-77. Removal condition: the final candidate passes the standalone reviewed gate and Phase 99 completes; until then, a local prose workaround is not accepted.
