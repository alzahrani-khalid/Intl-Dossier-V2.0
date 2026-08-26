# RULING-P99-101 — AR-04 gatekeeper predecessors

## Status and authority

Run `run-20260826-160417-0000000000000043` ended clean at accepted integration
`aefd383247e5479a04b99f73c5e9740577fbd68e`: P99-27 and P99-44 passed all seven gates and are
accepted. The milestone was human-fast-forwarded to that integration. P99-30 remains **pending**;
its candidate was not accepted and must not be approved, upheld, or merged as completed work.

The evidence-only `99-30-SUMMARY.md` commit was human-adjudicated separately: review approved it,
scope was exactly its single SUMMARY path, its failing oracle is the source-state finding it
records, and the overseer re-derived the headline counts at the accepted tip. Landing this reviewed
RED register does **not** green P99-30. Its next worker must replace the RED outcome with fresh green
evidence after the predecessors below pass.

## Re-derived handoff

At accepted tip `aefd38324`, using the canonical strict resolver:

- production mask repair: 30 unresolved sites / 18 files; the exact scoped population is 134 masks
  (109 literal and 25 options-default);
- production raw-key repair: 35 unresolved sites / 12 files; the exact scoped population is 207
  raw-key sites and 9 masks;
- test-policy defect: the unscoped walker includes `*.test.*` and `__tests__`; repo-wide output is
  31 mask and 47 raw-key misses, while excluding tests diagnostically leaves exactly the 30/35
  production populations above. The policy repair cannot green the tree by itself.

The authoritative identities and test/production split are in `99-30-SUMMARY.md` sections 2 and 4.

## Graph ruling

Insert exactly three predecessor tasks before P99-30:

1. **P99-45** resolves the 30 production mask misses in both locales. It may author locale values or
   correct a demonstrably wrong source binding within its fixed 18-file surface. It must not delete
   a default, delete a call, reduce the 134-site mask population, touch tests, or edit the audit.
2. **P99-46**, serialized after P99-45 because ownership overlaps, resolves the 35 production raw-key
   misses in both locales. It must preserve all 207 raw-key and 9 mask calls and keep P99-45 green.
3. **P99-47**, serialized after P99-46, fixes only the strict instrument's population policy and
   proves it with a production/test/**tests** self-check plus an independent live file census. It
   must not touch source, tests, or locale data and receives no credit for the 30/35 repairs.

P99-30 depends directly on all three and remains verification-only. Its strict zero oracle is not
weakened, its scope is not expanded, and its RED SUMMARY must be replaced by fresh green evidence.
P99-31 through P99-38 remain behind P99-30; no deletion becomes reachable until P99-30 itself passes
all seven gates.

The production-policy repair also removes the single test-only options-default site from P99-35's
future deletion surface and oracles. P99-35 is therefore 233 production sites / 27 files (211
literal, 22 options-default), and the production deletion union is 2073 sites / 247 files. Leaving
the test path in P99-35 would make the audit's per-entry scope guard fail after P99-47, so this is a
required downstream compatibility correction, not a fourth predecessor.

## Candidate and gate constraints

- The P99-30 candidate branch/commit remains unaccepted. Only its reviewed SUMMARY evidence was
  extracted by the human overseer; no source patch was imported.
- All three predecessors and the rerun declare all seven gates: build, test, lint, evidence, scope,
  acceptance, review.
- Acceptance counts include the plan `<done>` block. Each new task stays at five compiled items;
  surfaces are 15 for P99-45/P99-46 and 10 for P99-47.
- Any nonzero production residue after P99-47 is a finding. Do not weaken the oracle, expand P99-30,
  delete defaults early, classify test mocks as production, or infer green from a predecessor.
