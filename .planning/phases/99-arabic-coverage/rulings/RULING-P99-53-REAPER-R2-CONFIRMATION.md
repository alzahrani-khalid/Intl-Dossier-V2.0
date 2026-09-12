# RULING-P99-53 — release repaired candidate to finding-owner confirmation

**Decision:** Accept the 1045-line runtime as the single runtime convention and release the R2 frozen candidate to the same Grok and Codex reviewer lineages. No source edit, commit, bounded rendered run, standalone gate, compile, or Phase-99 run is released.

## Runtime-size decision

The runtime grew from 862 to 1045 lines while repairing eight safety findings. The drill/test harness remains split. A second runtime module would add a new import/version drift seam across lease ownership, census, signal rounds, and exit composition. Do not refactor solely for line count during the safety confirmation round. A reviewer may still recommend a substantive separation tied to an actual defect.

## Review authority

Use only the frozen R2 hashes in `.tickmarkr/overseer/P99R-REPAIR-HANDOFF.md` §4:

- runtime `b74896125053c72663d7f90d50be6e4b7df82b9d932f63d517dd43e85263b1d1`;
- selftest `45dbc94fa1afba4c4b9d99a3677c432a1656b1c4a2b00e3b8d623d9af567ff61`;
- criteria `d0f74cb2a8e9d3d27adb550c8eb8ddfa95f68be76dbd72b5db97406e37c25870`.

Each reviewer re-hashes before reading and after finishing. Any mismatch is `HEAD-MOVED` and stops the review.

## Reviewer assignments

Run concurrently in visible panes. Reuse each reviewer lineage once through its CLI resume mechanism; if a resume fails decisively, cold re-feed its prior report plus both handoffs. Do not loop on resume.

### Grok `grok-4.6`

Confirm or refute findings A, B, C, F, G and H using the exact constructions from `P99R-VERIFY-REPORT.md`. In particular:

- recreate the localized real-plant failure under `fr_FR` and `ar_SA` and require a real `reaped` outcome with plants gone;
- force live-wrapper liveness instrument failure and require zero reap calls plus retained lease/non-zero verdict;
- force identical pre/post `lsof` unavailability and require non-clean;
- rerun all seven selftest failure-propagation shapes, including delayed rejection beside nominal success;
- verify T3/T7/T9/T10/T14/T15 and D7 are causal rather than merely green;
- verify every real-process fixture cleans in `finally` on forced failure.

Write `.tickmarkr/overseer/P99R-VERIFY-R2-REPORT.md`, ending `REAPER-VERIFY-R2-END`.

### Codex `gpt-5.6-sol`

Confirm F1–F7 plus N1/N2 individually as `CONFIRMED-REPAIRED`, `PARTIALLY-REPAIRED`, or `NOT-REPAIRED`. Attack:

- complete-census and first-bind lease identity;
- tri-state port/liveness/lease I/O, including directory and unlink failures;
- report withholding and actual command-exit propagation;
- missing/invalid `wrapperPid` and the implementer's stated `expectedWriter` gap;
- D7 reclassification semantics;
- external rather than in-suite coverage of finding F;
- residue after every forced-failure real-process path.

Write `.tickmarkr/overseer/CONSULT-REAPER-SAFETY-R3-REPORT.md`, ending `REAPER-VERDICT-R3-END`.

Both reviewers are read-only. Neither may run a rendered Playwright stack or `tickmarkr verify`.

## Completion

Completion requires both report markers, stable hashes, and writer exit. The orchestrator then writes `.tickmarkr/overseer/P99R-R2-REVIEW-HANDOFF.md`, ending `ORCH-REAPER-R2-REVIEW-END`, classifying every finding and whether another source edit is required. Stop for OVERSEER ruling.

The bounded real rendered run and standalone `tickmarkr verify` remain explicitly open.
