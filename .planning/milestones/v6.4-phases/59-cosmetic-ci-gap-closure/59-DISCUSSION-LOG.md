# Phase 59: Cosmetic + CI Gap Closure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 59-cosmetic-ci-gap-closure
**Areas discussed:** vi-mock assertion type, POLISH-04 vs Phase 55, POLISH-01 evidence, Delivery + tag

---

## vi-mock assertion type (POLISH-04)

| Option                         | Description                                                                                                                                                                                                                       | Selected |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Keep lint + reconcile          | Treat the existing lint-based assertion as correct (fixture is a lint fixture by design); verify it fails when the fixture is "fixed", reconcile ROADMAP/REQUIREMENTS "test failure" → "lint failure". No artificial vitest test. | ✓        |
| Add a real vitest test-failure | Write a vitest spec that imports the bad mock factory and asserts a runtime test failure, wired as a separate CI assertion.                                                                                                       |          |
| Both lint AND test             | Keep the lint assertion and also add a vitest test-failure assertion.                                                                                                                                                             |          |

**User's choice:** Keep lint + reconcile
**Notes:** `bad-vi-mock.ts` was created Phase 50 D-15 specifically for the `vi-mock-exports-required` ESLint rule; its header (line 2) declares `pnpm lint ... MUST exit non-zero`. The existing Phase 55 `i18next-factory-check` job already asserts exactly that.

---

## POLISH-04 vs Phase 55 jobs

| Option                      | Description                                                                                                                                                           | Selected |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Verify + reconcile only     | Confirm both existing jobs (commit `faa8a710`) break when fixtures are "fixed" (flip-test locally), document satisfied-by-existing, reconcile wording. No CI changes. | ✓        |
| Strengthen rule-specificity | Tighten both assertions to grep eslint output for the expected rule id so the guard fails if a fixture fails for an unrelated reason.                                 |          |
| Consolidate into one step   | Replace/wrap the two jobs with a single documented "fixtures positive-failure" step/script.                                                                           |          |

**User's choice:** Verify + reconcile only
**Notes:** The `design-token-check` + `i18next-factory-check` jobs already do positive-failure assertions and break CI if a fixture stops failing. Touching them risks the live `main` 8-context gate.

---

## POLISH-01 evidence

| Option                   | Description                                                                                                                                                       | Selected |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Verify origin tags first | `git ls-remote --tags origin` for phase-47/48/49-base must match local SHA + `git tag -v` passes BEFORE editing wording; push or surface a blocker if mismatched. | ✓        |
| Flip wording on trust    | Treat "origin SHAs already match local" as authoritative and just edit the wording.                                                                               |          |

**User's choice:** Verify origin tags first
**Notes:** The Phase 53 deferral (D-26) was three SSH-signed tags created locally but not force-pushed. Marking BUNDLE-06 `verified` without checking origin risks a false premise.

---

## Delivery + tag

| Option                 | Description                                                                                                                          | Selected |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Single PR + signed tag | One PR for all four POLISH items, closed with SSH-signed annotated phase-59-base tag pushed to origin. Matches v6.2–v6.4 convention. | ✓        |
| Single PR, no tag      | One PR for all four items, skip the tag since nothing is a code baseline.                                                            |          |
| Split: docs PR + CI PR | Separate the three doc edits from the POLISH-04 work into two PRs.                                                                   |          |

**User's choice:** Single PR + signed tag
**Notes:** Self-consistent given POLISH-01 is itself about tag provenance.

---

## Claude's Discretion

- Exact commit granularity inside the single PR (per-item vs. grouped).
- PR title + branch name (follow v6.4 naming convention).
- D-02 flip-test evidence capture format (inline vs. separate file).
- `phase-59-base` tag message body wording.

## Deferred Ideas

- Rule-specific fixture assertions (grep for the firing rule id) — future CI-hardening phase.
- Consolidating the two fixture jobs into one documented step/script.
- A genuine vitest test-failure fixture for the react-i18next mock contract (runtime, not lint).
