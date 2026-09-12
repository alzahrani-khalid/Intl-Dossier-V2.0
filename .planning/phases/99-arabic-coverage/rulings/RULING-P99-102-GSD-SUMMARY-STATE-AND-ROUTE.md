# RULING-P99-102 — GSD summary state and P99-47 route

## Status correction

The compile at milestone `b3fe694f1` is rejected and must not run. It compiled P99-30 as `done`
with empty evidence and made P99-31 through P99-38 ready before the gatekeeper passed.

This state did not come from prior gate evidence. The pinned tickmarkr 2.1.2 GSD compiler sets a
plan to `done` whenever its canonical sibling `NN-SUMMARY.md` exists
(`src/compile/gsd.ts`: the `existsSync(...-SUMMARY.md)` status rule). The reviewed RED P99-30
register had been committed under that reserved filename, so source compilation treated a failing
finding as completion.

The reviewed evidence is preserved byte-for-byte as `99-30-RED-HANDOFF.md`. That non-canonical
name is deliberate: it remains committed worker context without asserting GSD completion. The
canonical `99-30-SUMMARY.md` is absent before execution and remains P99-30's sole writable output;
only a worker that passes the gatekeeper may create it. P99-45 through P99-47 and P99-30 must read
this ruling first, then RULING-P99-101 and the RED handoff.

The source compile is acceptable only if all of these hold in the compiled graph:

- exactly 32 previously accepted tasks are `done`;
- P99-30 is `pending` with empty evidence and direct dependencies `[P99-45, P99-46, P99-47]`;
- P99-31 through P99-38 are not ready, and P99-45 is the only ready task;
- the strict oracles, seven gates, predecessor ownership, and downstream dependencies remain as
  ruled by RULING-P99-101.

No compiled graph may be edited to obtain this state.

## Routing correction

The rejected plan also exposed P99-47 to the configured `tests` pool, which contains
`omp:anthropic/claude-fable-5` while that same worker model is denied. Do not remove or narrow the
deny: it protects the overseer quota and every failover path. P99-47 is explicitly pinned to the
already-authorized Phase 99 worker channel `codex:gpt-5.6-sol` at frontier tier. `tickmarkr plan`
must show a routable P99-47 and no denied pool entry for it before any run starts.

## Product disposition

The filename-driven status rule is a tickmarkr product defect: a canonical RED summary can silently
bypass dependencies with no gate evidence. The repository correction above is required to proceed
safely; the product fix should fail closed or distinguish a passing summary from a handoff finding.
Queue it with the sibling tickmarkr overseer rather than treating this rename as the shipped fix.
