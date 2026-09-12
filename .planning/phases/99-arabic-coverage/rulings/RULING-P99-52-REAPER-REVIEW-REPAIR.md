# RULING-P99-52 — review findings accepted; second source repair required

**Decision:** Accept review findings A–H. The frozen candidate is not shippable and remains uncommitted. Release a second implementation pass limited to `scripts/pw-run-reaped.mjs`, `scripts/pw-run-reaped.selftest.mjs`, and the behavioral criteria artifact. No bounded rendered run, standalone gate, commit, compile, or Phase-99 run is released.

## Accepted findings and required repairs

### A — locale-unparseable census is unavailable, never empty

- Force `LC_ALL=C`/`LANG=C` on every `ps`/process-census subprocess the runtime owns.
- Parsing one malformed/unparseable member row invalidates the entire census and returns `unavailable`; never skip the row and continue with an empty/partial population.
- `already-empty` is legal only after a valid, complete census of the leased session returns zero.
- Run the selftest under outer `C.UTF-8`, `fr_FR`, `de_DE`, and `ar_SA` environments. The instrument must remain correct because it binds its own locale, not because the host happens to use English.

### B — sweep liveness is tri-state and destructive action needs proof of death

- Replace boolean `alive()` with `alive | dead | unavailable` plus birth-match state.
- Reap an orphan lease only when wrapper death is positively established. `ps`/instrument error, permission denial, null/empty `wrapperStart`, or lstart parse failure is `unavailable` and leaves the lease/session untouched with a non-zero verdict.
- A live wrapper with matching start is skipped. A numeric PID reused with a different start is not the original wrapper; handle it through explicit stale-identity logic, never as an instrument error.

### C — port-holder lookup is tri-state

- Distinguish `lsof` exit 1 with no output (valid empty population) from execution/permission/malformed-output failure (`unavailable`).
- Any unavailable port census makes cleanup non-clean. It cannot suppress the F2 refusal or preserve a green report.

### D — lease I/O states are distinct

- Distinguish absent, present-valid, malformed, unreadable, directory-unavailable, and unlink-failed states.
- Only ENOENT is absent/already gone. Malformed/unreadable lease or directory errors are unavailable and non-zero.
- A failed lease consume leaves the run unclean and retains/reports the path for retry; it is never logged as successful consumption.

### E — bind lease identity at first use

- The first census must match the lease's stored `sid`, `pid`, `pgid`, `lstart`, canonical `cwd`, root, and nonce before any signal.
- Compare canonical cwd and birth tuple again on every round. Do not construct the authoritative `known` tuple from the first observed census alone.

### F — selftest exit must synchronously propagate every failure

- Remove the fire-and-forget runtime import path. Invoke `scripts/pw-run-reaped.selftest.mjs` as a separate synchronous child process and propagate its exact exit/signal result.
- Missing module, load error, thrown/rejected async result, false return, missing export, and syntax error must all exit non-zero. A delayed rejected Promise beside a nominal true result must not be pre-empted by `process.exit(0)`.

### G — make each green causal

Strengthen the named tests so each fails for the intended mechanism:

- T15 proves TERM occurred before detector dropout and proves no KILL followed.
- T7 proves the birth-identity swap branch fired, not generic unavailable.
- T3 exercises the real checked inner-census path and verifies locale binding/malformed-table behavior.
- T9 asserts its cleanup stub was invoked for each verdict.
- T10 executes the real `createFinisher` path.
- T14 executes the real `runMode` stale-report path through dependency injection.
- D7 mutates the production ownership selector/path, not a parallel toy implementation.
- Add direct regressions for A–F, including live-wrapper sweep instrument failure and lease read/unlink failure.

### H — every real-process plant has `finally`

`escapeDrill`, T11, and every other detached real-process fixture retain their process/session identity immediately and clean it in `finally`, including report timeout, assertion throw, and detector failure.

## Implementation seat

Reuse the Kimi implementation lineage once through session continuation if available; otherwise start one fresh Kimi K3 implementation seat. The known reliable write mechanism is bounded shell-heredoc/edit chunks with syntax and line-count checks. This is an implementation-only seat and may not review its own work.

The implementer edits only the two script files and `.tickmarkr/overseer/P99R-REAPER-CRITERIA.md`. It does not touch the already-reviewed config, package, gitignore, or plan routing. It does not commit.

Deliver `.tickmarkr/overseer/P99R-REPAIR-REPORT.md` ending `REAPER-REPAIR-END`, with:

- exact hunk-to-finding map A–H;
- selftest tallies under all four outer locales;
- failure-propagation matrix for the separate selftest process;
- zero-residue proof after every real-process drill;
- exact changed paths and line counts;
- known limits.

The orchestrator verifies scope, exits the writer, freezes new hashes, and writes `P99R-REPAIR-HANDOFF.md` ending `ORCH-REAPER-REPAIR-END`. Stop for review release.

## Subsequent confirmation

After the repair freeze, the same Grok and original Codex reviewer lineages re-confirm the findings they authored. That review is not released by this ruling; the OVERSEER releases it after the repair handoff.

## Evidence

- `.tickmarkr/overseer/P99R-VERIFY-REPORT.md`
- `.tickmarkr/overseer/CONSULT-REAPER-SAFETY-R2-REPORT.md`
- `.tickmarkr/overseer/P99R-REVIEW-HANDOFF.md`

Both reviewers independently corroborated the live-wrapper sweep race and unavailable `lsof` failure. Grok's real localized-process plants demonstrated finding A with processes surviving and zero signals while the runtime reported clean.
