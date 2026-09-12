# RULING-P99-58 — fifth bounded reaper repair

**Decision:** Accept the remaining material static defects, with the report-visibility contract narrowed to the actual source callers. Release one bounded repair pass. No rendered run, standalone gate, commit, compile, or Phase-99 run is released.

## 1. Start identity is semantically valid, not regex-shaped

Implement one strict forced-C `ps lstart` parser shared by writer and wrapper validation:

- weekday and month must be members of the C-locale sets;
- day must be valid for the parsed month/year, including leap years;
- hour 0–23, minute/second 0–59;
- year bounded to a plausible positive process-start range;
- reconstructed calendar fields must round-trip exactly.

Malformed-but-non-empty `lstart` or `wrapperStart` is invalid lease state and carries no authority. Add valid-hex nonce regressions whose only failure is the impossible start value, proving the intended branch.

## 2. Lease authority is re-read after census, immediately before every act

For each TERM/KILL group:

1. take the fresh complete census;
2. re-read the lease file;
3. validate filename/body nonce, canonical root, and full writer tuple against the just-read census;
4. only then signal that group.

Repeat independently for each group/round. Re-read and validate again immediately before consume/unlink. A replacement during the census signals nothing. Add a call-order regression that mutates the lease during census and asserts zero signal calls.

## 3. Actual command composition is the consumer-safety boundary

Every repository caller now composes the wrapper with `&&`. That is the supported contract. The runtime does not promise to suppress an arbitrary external `;` consumer racing an unrelated writer after wrapper preflight.

On an unclean verdict:

- perform one final synchronous foreign-final check/quarantine immediately before returning;
- preserve foreign evidence under a named quarantine when possible;
- return non-zero regardless of quarantine success.

The executable acceptance test must run the actual `&&` source composition with a valid foreign final appearing during later cleanup and prove `pw-red-assert` is not invoked. A semicolon-tail probe may remain diagnostic but is not a ship criterion and must not be described as supported.

## 4. Criteria text matches current behavior

Remove or correct all pre-R4 descriptions of optional/wildcard starts, stdout-owned T11 identity, old entry fallback, and universal report absence. Every judge clause must describe the current hunk and state the real boundary.

## Tests

Add causal regressions for impossible weekday/month/day/time/leap combinations, valid controls, lease replacement during census with exact call order, final foreign appearance, quarantine failure plus actual `&&` tail suppression, and the corrected criteria assertions. Re-run four-locale 101/101, both entry matrices, and zero-residue checks.

## Implementer and surface

Resume the exact Sonnet implementation lineage once if decisive, otherwise cold-start Sonnet. No Kimi or subagents. Edit only:

- `scripts/pw-run-reaped.mjs`;
- `scripts/pw-run-reaped.selftest.mjs`;
- `.tickmarkr/overseer/P99R-REAPER-CRITERIA.md`.

Do not touch plans, summaries, config, package, or gitignore. No commit, rendered run, tickmarkr command, or reviewer spawn.

Deliver `.tickmarkr/overseer/P99R-R5-REPAIR-REPORT.md` ending `REAPER-R5-REPAIR-END`. The orchestrator verifies scope, exits the writer by pane ownership, freezes new hashes, and writes `.tickmarkr/overseer/P99R-R5-REPAIR-HANDOFF.md` ending `ORCH-REAPER-R5-REPAIR-END`. Stop for confirmation release.

## Evidence

- `.tickmarkr/overseer/P99R-VERIFY-R4-REPORT.md`
- `.tickmarkr/overseer/CONSULT-REAPER-SAFETY-R5-REPORT.md`
- `.tickmarkr/overseer/P99R-R4-REVIEW-HANDOFF.md`
