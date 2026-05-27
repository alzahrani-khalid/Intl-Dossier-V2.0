# Phase 59: Cosmetic + CI Gap Closure - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the four v6.3/v6.4 cosmetic + CI gaps tracked as POLISH-01..04. Three are
near-mechanical paperwork edits; one (POLISH-04) is a verify-and-reconcile task
against CI infrastructure that already exists.

1. **POLISH-01** — Refresh Phase 53 paperwork: `53-03-SUMMARY.md` `status:`/`verdict:
PASS-WITH-DEFERRAL` → `PASS`; `53-VERIFICATION.md` BUNDLE-06 `verified-local-only`
   → `verified`. The original deferral (D-26) was three SSH-signed `phase-47/48/49-base`
   tags created locally but not force-pushed to origin. Wording may only flip AFTER the
   origin tags are verified to match local.
2. **POLISH-02** — Delete the stale TEST-01 mock-factory comment at
   `frontend/src/components/.../TweaksDrawer.test.tsx:6-8` (documentation drift; the
   comment falsely claims the global setup omits `initReactI18next`).
3. **POLISH-03** — `51-VALIDATION.md` frontmatter `status: draft` → `passed`
   (`nyquist_compliant: true` already correct, must be preserved).
4. **POLISH-04** — Make the two `tools/eslint-fixtures/` positive-failure fixtures break
   CI loudly if they ever stop failing. The CI jobs that do this (`design-token-check`,
   `i18next-factory-check`) ALREADY EXIST (added by Phase 55, commit `faa8a710`,
   MERGE-02). Phase 59 verifies them via flip-test and reconciles the criterion wording.

**Out of phase (deferred / OOS):**

- Any new feature work (v7.0 Intelligence Engine API/UI is gated behind v6.4 ship).
- Net-new CI jobs or strengthening the existing fixture assertions to be rule-specific
  (user chose verify-and-reconcile, not strengthen — see D-05).
- Inventing a vitest test-failure spec for `bad-vi-mock.ts` (user chose lint-based — D-03).
- Touching the Phase 55 required CI contexts / branch-protection (8 contexts live on `main`).
- Modifying the fixtures themselves (they must keep producing their expected failures).

</domain>

<decisions>
## Implementation Decisions

### POLISH-04 — Fixture positive-failure assertions

- **D-01: POLISH-04 is satisfied-by-existing-jobs; verify + reconcile only.** The
  `design-token-check` and `i18next-factory-check` jobs (`.github/workflows/ci.yml:66-116`,
  introduced Phase 55 commit `faa8a710`) already assert each fixture fails lint via
  `! pnpm exec eslint -c eslint.config.mjs --max-warnings 0 <fixture>`. This already breaks
  CI if a fixture stops failing. Phase 59 makes NO CI job changes.
- **D-02: Flip-test verification is the POLISH-04 deliverable proof.** Locally demonstrate
  that each assertion genuinely fails when the fixture is "fixed": temporarily neutralize
  `bad-design-token.tsx` (remove the raw hex / palette literals) and `bad-vi-mock.ts` (add
  the missing spread), confirm `pnpm exec eslint` then exits 0 (so the `!`-guarded CI step
  would fail), then revert. Capture the evidence in the phase folder. Do NOT commit the
  neutralized fixtures.
- **D-03: Keep the lint-based assertion for `bad-vi-mock.ts` — do NOT invent a vitest test.**
  `bad-vi-mock.ts` is a LINT fixture by design (Phase 50 D-15, for the
  `vi-mock-exports-required` ESLint rule; its own header line 2 says
  `pnpm lint ... MUST exit non-zero`). The existing `i18next-factory-check` job correctly
  asserts a lint failure. No artificial vitest spec is created.
- **D-04: Reconcile the "test failure" wording → "lint failure".** ROADMAP §"Phase 59 —
  Success Criterion 4" and `REQUIREMENTS.md` POLISH-04 say `bad-vi-mock.ts` produces a
  "test failure"; reality is a lint failure. Update both to read "lint failure" (or
  "ESLint error") so the oracle matches the implementation. **GSD safety:** ROADMAP.md and
  STATE.md prose edits are content edits, but per universal anti-pattern #15 they must NOT
  be made via raw Write/Edit when a registered `gsd-sdk query` handler exists for the
  mutation. There is no registered handler for free-text criterion rewording, so a direct
  prose edit is acceptable here — but the executor must edit ONLY the POLISH-04 wording,
  leave all `gsd:progress` / checkbox markers untouched, and never use a roadmap mutation
  handler to rewrite prose. Flag this explicitly in the plan.
- **D-05: Do NOT strengthen the assertions to be rule-specific.** User rejected the option
  to grep eslint output for the specific rule id (D-05 selector / `vi-mock-exports-required`).
  The bare `! eslint` guard stays. (Captured as a deferred idea below.)

### POLISH-01 — Evidence before flipping PASS

- **D-06: Verify origin tags BEFORE editing wording.** Run `git ls-remote --tags origin`
  for `phase-47-base`, `phase-48-base`, `phase-49-base` and confirm each remote tag object
  resolves to the same commit SHA as the local annotated tag, and `git tag -v <tag>` exits 0
  with `Good "git" signature` for all three. Only after all three verify may the
  `PASS-WITH-DEFERRAL → PASS` and `verified-local-only → verified` edits be made.
- **D-07: If a tag is missing/divergent on origin, push it or surface a blocker — never
  flip on a false premise.** If `git ls-remote` shows a tag absent or pointing at a different
  object, the executor pushes the re-issued annotated tag. **If origin holds a divergent
  (e.g., old lightweight) tag object at that name, the push requires `--force` — this is a
  risky, shared-state operation and MUST surface for the user's explicit confirmation, not
  run automatically.** If the user declines, BUNDLE-06 stays `verified-local-only` and
  POLISH-01 is reported as blocked rather than falsely closed.

### POLISH-02 / POLISH-03 — Mechanical edits

- **D-08: POLISH-02 is a pure comment deletion.** Remove the stale lines at
  `TweaksDrawer.test.tsx:6-8`; do not alter test logic. Confirm the comment is actually
  false against the current global test setup before deleting (the setup DOES register
  `initReactI18next`).
- **D-09: POLISH-03 flips one frontmatter field.** `51-VALIDATION.md` `status: draft` →
  `passed`; `nyquist_compliant: true` and all other frontmatter fields preserved byte-for-byte.

### Delivery & Closure

- **D-10: Single PR for all four POLISH items.** Not split docs-vs-CI. Four small,
  cohesive items ship together.
- **D-11: Close with an SSH-signed annotated `phase-59-base` tag pushed to origin.**
  Matches v6.2–v6.4 convention; `git tag -v phase-59-base` must exit 0 with
  `Good "git" signature`. Self-consistent given POLISH-01 is itself about tag provenance.
  Per CLAUDE.md §"Tag signing setup".

### Claude's Discretion

- Exact commit granularity inside the single PR (per-POLISH-item commits vs. grouped) —
  planner picks; follow repo convention from `git log phase-58-base..HEAD`.
- PR title + branch name — follow v6.4 naming convention (e.g., `phase-59/cosmetic-ci-gap-closure`).
- Flip-test capture format for D-02 (inline in SUMMARY vs. a small evidence file) — planner picks.
- Exact `phase-59-base` tag message body — follow the prior `phase-NN-base` tag-body shape.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements & roadmap

- `.planning/REQUIREMENTS.md` — POLISH-01..04 acceptance text (lines 38-41); coverage table (74-77)
- `.planning/ROADMAP.md` §"Phase 59: Cosmetic + CI Gap Closure" (lines 233-245) — the 4 success criteria are the test oracle; criterion 4 "test failure" wording is the reconciliation target (D-04)
- `.planning/STATE.md` §"Carryover Tech Debt Status" (lines 82-85) — confirms each POLISH item's origin

### POLISH-01 targets & deferral provenance

- `.planning/phases/53-bundle-tightening-tag-provenance/53-03-SUMMARY.md` — `status:`/`verdict: PASS-WITH-DEFERRAL` at lines 4-5; narrative at 52, 158; the "Force-push checklist" describing the D-26 deferral
- `.planning/phases/53-bundle-tightening-tag-provenance/53-VERIFICATION.md` — BUNDLE-06 `verified-local-only` at lines 12, 98; deferral note at line 25 (local satisfies; remote needs three push commands)
- `CLAUDE.md` §"Tag signing setup" — SSH-signed annotated tag protocol; `git tag -v` verification contract; reused for both POLISH-01 verification (D-06) and phase-59-base closure (D-11)

### POLISH-02 target

- `frontend/src/.../TweaksDrawer.test.tsx` lines 6-8 — the stale TEST-01 mock-factory comment (exact path resolved during research; the Tweaks drawer is in the topbar per CLAUDE.md shell)
- `frontend/docs/test-setup.md` §"The react-i18next mock contract" — the authority on what the global setup actually registers (`initReactI18next`); use to confirm the comment is false before deleting

### POLISH-03 target

- `.planning/phases/51-design-token-compliance-gate/51-VALIDATION.md` — frontmatter `status: draft` (line 3) → `passed`; `nyquist_compliant: true` (line 4) preserved

### POLISH-04 — fixtures, jobs, and rule definitions

- `.github/workflows/ci.yml:66-116` — `design-token-check` + `i18next-factory-check` jobs; the `! pnpm exec eslint` positive-failure assertions (Phase 55 commit `faa8a710`). These STAND unchanged (D-01)
- `tools/eslint-fixtures/bad-design-token.tsx` — Phase 51 D-10 fixture: raw hex `#3B82F6` + `bg-red-500` palette literal + `text-red-500` template literal; header declares lint MUST exit non-zero
- `tools/eslint-fixtures/bad-vi-mock.ts` — Phase 50 D-15 fixture: `vi.mock` factory omitting the `vi.importActual` spread; header (line 2) declares it a LINT fixture (drives D-03)
- `eslint.config.mjs:293` — the per-file block that lets `bad-design-token.tsx` be linted with D-05 selectors at `error`; plus `designTokenSyntaxRestrictions` and the `vi-mock-exports-required` rule that make the fixtures fail
- `.planning/phases/55-*/55-02-*` (PR #15, merge `9e4471e3`) — provenance of the two CI jobs; confirms POLISH-04 is satisfied-by-existing-jobs

### Phase 55 gate context (must not regress)

- `main` branch protection — 8 required contexts live (Phase 55 D-13), including `Design Token Check` and `react-i18next Factory Check`. The single Phase 59 PR must pass all 8; do not alter the contexts

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`.github/workflows/ci.yml` jobs `design-token-check` + `i18next-factory-check`** — the
  POLISH-04 machinery already exists and works. The `! pnpm exec eslint` shell idiom is the
  positive-failure pattern; reuse it as the flip-test harness locally (D-02), do not rewrite.
- **`git tag -v` + SSH `allowed_signers` protocol (CLAUDE.md)** — already configured per
  machine; reused for POLISH-01 origin-tag verification (D-06) and phase-59-base closure (D-11).
- **Prior `phase-NN-base` signed-tag closure precedent (Phases 53/55/58)** — repo + CLAUDE.md
  protocol stable; Phase 59 inherits the closing convention.

### Established Patterns

- **Positive-failure CI assertion (`! eslint <fixture>`)** — established Phase 55; Phase 59
  verifies, does not extend.
- **Annotated SSH-signed `phase-NN-base` tag on closure** — v6.2–v6.4 convention.
- **PR-based merge with `enforce_admins=true`, 8 required contexts** — `main` protection;
  the single Phase 59 PR respects it; no admin bypass, no force-push to `main`.

### Integration Points

- **`53-03-SUMMARY.md` + `53-VERIFICATION.md`** — POLISH-01 edits, gated on D-06 origin-tag
  verification.
- **ROADMAP.md §Phase-59 criterion-4 + REQUIREMENTS.md POLISH-04** — D-04 wording
  reconciliation; prose-only edit, no `gsd-sdk` roadmap mutation handler (see D-04 safety note).
- **`phase-58-base` (origin) → Phase 59 branch base** — branch off current `main` HEAD
  (already past `phase-58-base`).
- **`phase-59-base` annotated SSH-signed tag** — issued after the PR merges + closure
  verification; pushed to origin.

### Anti-patterns to avoid

- **Flipping POLISH-01 wording before verifying origin tags (D-06)** — would mark BUNDLE-06
  `verified` on a false premise.
- **Auto-running `git push --force` for tags (D-07)** — force-push is shared-state-destructive;
  requires explicit user confirmation.
- **Inventing a vitest spec for `bad-vi-mock.ts` (D-03)** — it is a lint fixture; a test would
  be artificial.
- **Editing the Phase 55 CI jobs or the 8 required contexts (D-01)** — POLISH-04 is
  verify-only; touching them risks the live `main` gate.
- **Committing neutralized fixtures from the D-02 flip-test** — flip-test is local-and-reverted only.
- **Using a `gsd-sdk` roadmap mutation handler to reword criterion-4 prose (D-04)** — wrong tool;
  it would touch progress markers. Edit prose directly, POLISH-04 wording only.
- **`--no-verify` on commits/merge/tag** — signing + hooks intact per repo convention.

</code_context>

<specifics>
## Specific Ideas

- **POLISH-04 reconciliation phrasing:** change "produces a test failure" → "produces an
  ESLint error / lint failure" in both ROADMAP §Phase-59 criterion-4 and REQUIREMENTS POLISH-04.
- **D-02 flip-test recipe:** (1) local edit removing the violation from each fixture,
  (2) `pnpm exec eslint -c eslint.config.mjs --max-warnings 0 <fixture>` now exits 0,
  (3) therefore the `!`-guarded CI step would exit non-zero (CI breaks), (4) `git checkout --`
  the fixtures to revert. Capture the two before/after exit codes as the POLISH-04 evidence.
- **POLISH-01 verification commands:** `git ls-remote --tags origin 'phase-4[789]-base'`
  cross-checked against `git rev-parse phase-47-base^{commit}` (×3) and `git tag -v` (×3).
- **phase-59-base tag body shape:** "Phase 59 — Cosmetic + CI gap closure. POLISH-01..04
  satisfied: Phase 53 SUMMARY/VERIFICATION wording refreshed (origin tags verified),
  TweaksDrawer comment drift removed, 51-VALIDATION frontmatter passed, bad-design-token +
  bad-vi-mock positive-failure CI assertions verified (lint-based, Phase 55 jobs) and ROADMAP
  wording reconciled."

</specifics>

<deferred>
## Deferred Ideas

- **Rule-specific fixture assertions** — strengthening the `! eslint` guards to grep for the
  exact firing rule id (D-05 design-token selector / `vi-mock-exports-required`) so they fail
  if a fixture starts failing for an unrelated reason. User chose verify-and-reconcile for
  Phase 59; a future CI-hardening phase could add specificity.
- **Consolidating the two fixture jobs into one documented step/script** — e.g.,
  `tools/assert-fixtures-fail.sh`. Out of scope; would churn the Phase 55 required contexts.
- **A genuine vitest test-failure fixture for the react-i18next mock contract** — if a future
  phase wants runtime (not lint) proof that an under-spread mock breaks translations, it could
  add one. Phase 59 stays lint-based.

</deferred>

---

_Phase: 59-cosmetic-ci-gap-closure_
_Context gathered: 2026-05-24_
