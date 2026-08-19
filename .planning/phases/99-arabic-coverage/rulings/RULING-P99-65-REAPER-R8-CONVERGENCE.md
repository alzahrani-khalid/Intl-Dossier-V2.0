# RULING-P99-65 — R8 convergence confirmation

**Decision:** Release the R8 frozen candidate to the original Grok and Codex reviewer lineages. No source edit, commit, rendered run, standalone gate, compile, or Phase-99 run is released.

## Authority

Use only the R8 hashes in `.tickmarkr/overseer/P99R-R8-REPAIR-HANDOFF.md` §3. Re-hash before and after; mismatch is `HEAD-MOVED`.

## Common checks

Both reviewers must re-run four-locale 130/130, both entry matrices, real `&&` composition, same-final concurrent lifecycle, exported escape reaper rows, and zero residue. State whether any prior F1–F7/N1/N2/R3–R7 repair regressed.

## Grok dynamic assignment

Confirm:

- startup leaves an already-published shared final byte-identical;
- second same-final caller exits non-zero with zero consumer calls and preserved independent evidence;
- nonce-bound pending and unclean paths do not cross-consume;
- unavailable own-PGID causes zero port census/reap calls, while the valid control reaches one;
- real `reapLeakedPorts` plants remain green.

Evaluate the two stated bounds: a third-caller race and own-PGID becoming unavailable mid-operation. Distinguish an irreducible observation race from an avoidable missing revalidation.

Write `.tickmarkr/overseer/P99R-VERIFY-R8-REPORT.md`, ending `REAPER-VERIFY-R8-END`.

## Codex static assignment

Run under `workspace-write -a never` with orchestrator before/after tamper control. Confirm every startup/finisher call site respects preflight occupancy and nonce ownership; enumerate every input to self-exclusion and whether a valid-but-wrong own-PGID can be detected or must be documented as instrument trust. Confirm criteria text matches the supported contract and no previous static repair regressed.

Write `.tickmarkr/overseer/CONSULT-REAPER-SAFETY-R9-REPORT.md`, ending `REAPER-VERDICT-R9-END`.

Both seats are read-only. No rendered Playwright stack and no tickmarkr.

## Completion

Both markers, stable hashes, and writer exits are required. The orchestrator writes `.tickmarkr/overseer/P99R-R8-REVIEW-HANDOFF.md`, ending `ORCH-REAPER-R8-REVIEW-END`, answering yes/no: **is any material static or synthetic-process defect still open for supported callers?** Stop for OVERSEER ruling.

A no-material-defect result from both releases the bounded real rendered run only.
