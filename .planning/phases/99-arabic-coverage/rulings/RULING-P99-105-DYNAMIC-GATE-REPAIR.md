# RULING-P99-105 — REPAIR THE DYNAMIC-LEAF GATE BEFORE THE REMAINING MASK DELETIONS

> **AMENDED 2026-08-27 under RULING-P99-234**, together with `99-48-PLAN.md`, `99-49-PLAN.md`, and
> `99-50-PLAN.md` in one pass. Three things changed: the graded list population is corrected from 24
> to **32** caller-derived leaves out of a complete **153**-leaf cross-product; a cluster domain is
> closed only on AST proof of canonical membership **plus** an explicit `type.unknown` branch; and
> three fail-closed negative tests are now required. Nothing else in the ordered repair moved.

## Evidence and disposition

Run 0045 banked P99-30 and P99-34, then ended partial with P99-31 through P99-33 at human gates,
P99-35 through P99-38 failed on routing with attempts zero, and P99-39 through P99-41 blocked. The
accepted P99-30 task proved the instrument it was authored to run, but three later semantic reviews
showed that instrument classifies literal first arguments and dynamic prefixes without proving every
dynamic leaf.

P99-32 independently reproduced 24 `list.<type>.*` paths absent from both locale bundles: eight cta
leaves and four leaves in each of four other families. **That 24 was an undercount, corrected under
RULING-P99-234.** Re-deriving the population from the callers gives the complete 17 `EntityType` x 9
call-family cross-product of **153** leaves, of which **32** are absent from both bundles. The eight the
24 omitted are `firstTitle` and `import` for `topic`, `working_group`, `elected_official`, and
`work_item`. **That omitted-list eight is a different eight from the cluster eight below** — the eight
canonical display types missed by the unprefixed graph lookup — and the two must never be conflated:
only the omitted-list eight moves 24 to 32, and the cluster eight does not change.
P99-33 found 13 fallback-bearing nonliteral
calls outside the strict literal matcher and a concrete wrong lookup, `t(data.clusterType)`, where the
available values live under `graph.type.*`. The P99-33 acceptance oracle also carried a nonexistent
`frontend/src/components/modern-nav DocumentTree.tsx` path. Its worker's attempt to satisfy stale test
mocks with production `unitMockCopy` branches was rejected as hardcoded-result, check-bypass, and
self-mocking. P99-31 failed only because its companion DossierEngagementsTab test was outside scope.

No human gate is approved and no candidate is merged. The P99-31, P99-32, and P99-33 tips are forensic
only. All repairs start from the accepted milestone at `bad498f14` and all seven gates run fresh.

## Ordered repair

1. **P99-48 owns the instrument and tests only.** It must parse TypeScript calls, distinguish options
   from fallbacks, resolve leaf paths in en and ar with fallback disabled, require closed domains, and
   fail on unclassified/empty/malformed inputs. Its pre-repair live control must reproduce the two
   ruled defects positively. A domain is CLOSED only when the AST proves membership in the production
   constant that defines it (`DOSSIER_CARD_TYPES` for the graph cluster) **plus** an explicit
   `type.unknown` branch in the same caller; a domain inferred from expression text, from whichever
   keys exist in JSON, or from a fallback argument is rejected and the call is **unclassified**, which
   fails closed. Three negative tests must each red the instrument: an unbounded cluster lookup; a
   `defaultValue` reachable only through a shorthand, static-computed, or spread option object; and a
   `useTranslation` translator bound to an aliased identifier rather than one literally named `t`.
   Its list oracle asserts the complete **153**-leaf cross-product alongside the **32** missing-both
   count, so no family can be filtered away to reach an expected answer.
2. **P99-49 owns the graded production/resources only.** It adds the exact **32** caller-derived list
   leaves in both locales — the eight `cta` values, plus six families (`hint`, `firstDescription`,
   `createFirst`, `create`, `firstTitle`, `import`) across `topic`, `working_group`,
   `elected_official`, and `work_item` — and routes the graph cluster through the closed display-type
   family plus a localized unknown sentinel reached by an explicit source branch. Its live-zero oracle
   is asserted over the full 153-leaf population, so it is achievable only by adding leaves, never by
   narrowing families. It may not edit the instrument or delete a fallback.
3. **P99-50 is verification-only.** It runs the new controlled dynamic census and the original literal
   gatekeeper battery, edits only its SUMMARY, and becomes the direct predecessor of every unfinished
   deletion lane. Its live dynamic command stays **byte-identical** to P99-49's, so the gatekeeper can
   never pass a narrower population than the repair asserted.
4. **P99-31 owns one companion test.** Its local mock resolves the real dossier resource after deletion;
   the production source remains deletion-only.
5. **P99-33 owns exactly five companion tests and the corrected ExpandedPanel/DocumentTree oracle path.**
   Tests consume real resource-backed labels; production may not detect test mode or recreate English.
6. **P99-35 through P99-38 keep their substantive contracts.** Only their dependency moves to P99-50;
   routing is re-derived by a fresh plan from the live channel table.

P99-39 through P99-41 remain transitively blocked until all deletion lanes finish. P99-41 remains a
real `autonomous:false` rendered-product checkpoint and is never answered by an agent.

## Ship decision

**SHIP.** The dynamic-leaf blind spot can turn a source-level zero into raw keys on live English and
Arabic surfaces. A local fallback or test-mode branch would only hide the defect. The repair therefore
lives in tracked scripts, production routing/resources, and ordered source plans. Removal condition: the
new instrument's self-check discriminates, every ruled nonliteral call has an AST-proven closed domain or
is reported unclassified, the graded list population is the complete 153-leaf caller cross-product rather
than a filtered subset, both locale legs resolve every leaf, and P99-50 passes all seven gates before
deletion dispatch.
