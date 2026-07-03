# Phase 80: Full-Route Visual + A11y Verification & Smoke Suite - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Auto-generated (smart discuss — final verification phase, scope prescribed by VERIFY/FOUC requirements)

<domain>
## Phase Boundary

The whole v8.0 migration is proven correct across every baselined surface and all four axes (dark/light × LTR/RTL), with the RTL/portal/FOUC guarantees locked into CI so they cannot silently regress. Covers VERIFY-01 (visual re-compare vs the Phase 77 baseline), VERIFY-02 (axe-core sweep vs a recorded pre-migration baseline), FOUC-02 (portal + CLI-exempt RTL smoke tests gating CI). Depends on Phase 79 (all visual + component work complete). This is the final v8.0 phase — after it, the milestone lifecycle (audit → complete → cleanup) runs.

</domain>

<decisions>
## Implementation Decisions

### Human visual-diff review is REQUIRED (autonomous:false checkpoint)

- VERIFY-01 mandates that **every visual diff** against the Phase 77 pre-token baseline is either an **intended Linear change (human-reviewed)** or fixed — no unexplained regressions. The diff-triage review is a **human checkpoint** (same class as the 77-01 baseline capture): the planner must mark that task `autonomous:false`, and the overseer/user adjudicates intended-Linear vs regression. Do NOT auto-approve visual diffs.

### Visual re-compare (VERIFY-01)

- Re-compare all baselined Playwright surfaces (EN+AR × dark+light, the ~15–20 route/widget specs baselined in Phase 77's 77-01 gate) against that captured pre-token baseline. Any coverage expansion beyond today's specs is called out explicitly, never silently assumed. The Phase 77 baseline is the authoritative reference (commit from the 77-01 approval).

### Axe-core a11y sweep (VERIFY-02)

- Run axe-core across all four axes with **no new violations vs a RECORDED pre-migration baseline**. The a11y CI job is currently red on `main` (2 hard failures — engagement ARIA + intake landmark/h1 — plus 8 flaky specs, issue #31 class). These must be **fixed or explicitly recorded as the baseline** BEFORE comparison (no baseline laundering). Decide fix-vs-record per failure; record the decision.

### CI smoke gating (FOUC-02)

- CI runs portal-animation RTL smoke tests (Popover/Tooltip/Dropdown/Sheet/dossier drawer open from the correct inline-start edge in AR) + Calendar/Pagination/Sidebar RTL smoke tests, and they **gate the build**. This first requires bringing the currently-red visual/a11y verification jobs to green, OR scoping the new smokes as a separate green-from-birth CI job (planner's choice — the separate-job path avoids coupling to the pre-existing red).

### Claude's Discretion

Fix-vs-record calls per a11y failure, separate-job vs fix-existing for the smoke gate, and test structure are the planner's/executor's discretion — provided no baseline is laundered and the human diff-review gate is preserved.

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- Phase 77 baseline: `.planning/phases/77-linear-token-system/77-BASELINE-VALIDATION.md` + the committed baseline PNGs/specs (the 77-01 human-approved pre-token baseline) — the authoritative VERIFY-01 reference.
- Phase 76 shipped the SRTL-03 duplicate-`rtl:*` CI guard + Calendar/Pagination/Sidebar RTL verification (76-SRTL02-VERIFICATION.md) — FOUC-02 smokes extend this.
- Phase 77 shipped the bootstrap byte-match parity guard (`scripts/check-bootstrap-parity.mjs`) — already CI-wired (FOUC-01); FOUC-02 adds the portal/CLI-exempt RTL smokes.

### Established Patterns

- Visual harness reality: the `Visual Regression (Phase 46)` CI job is red on `main` (issue #31 / e2e.yml deployed-app + stale-secret class) — capture/replay follows the Phase-46 precedent (seeded dev machine + human review) unless repaired first. Same caveat the Phase 77 baseline used.
- axe-core + Playwright already in the stack; the a11y job exists but is red (2 hard + 8 flaky).

### Integration Points

- The RTL direction owner (Phase 76), Linear tokens (Phase 77), and the rebuilt SearchableSelect (Phase 79) are all under test here — Phase 80 is the integration proof, not new feature work.
- Bundle Size Check + bootstrap-parity + duplicate-rtl guards must all stay green.

</code_context>

<specifics>
## Specific Ideas

- No baseline laundering: the a11y pre-migration baseline must be recorded honestly (fix the 2 hard failures or record them as known-baseline with rationale) before any comparison.
- The visual re-compare is against Phase 77's captured baseline specifically — intended-Linear changes are EXPECTED (the whole point was to change the palette); the review separates intended-Linear from genuine regression.
- Prefer the separate green-from-birth CI job for the new RTL smokes if repairing the pre-existing red jobs balloons scope — call it out explicitly.

</specifics>

<deferred>
## Deferred Ideas

None — final verification phase; scope is fully prescribed by VERIFY-01/02 + FOUC-02. The human diff-review is retained as a checkpoint, not deferred.

</deferred>
