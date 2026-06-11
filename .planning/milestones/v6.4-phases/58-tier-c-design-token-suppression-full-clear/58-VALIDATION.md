---
phase: 58
slug: tier-c-design-token-suppression-full-clear
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-19
---

# Phase 58 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `58-RESEARCH.md` §"Validation Architecture".

---

## Test Infrastructure

| Property               | Value                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **Unit framework**     | Vitest                                                                                     |
| **E2E framework**      | Playwright (`frontend/tests/e2e/*-visual.spec.ts`, 12 visual specs)                        |
| **Config files**       | `vitest.config.ts`, `frontend/tests/e2e/playwright.config.ts`                              |
| **Quick run command**  | `pnpm lint frontend/src/<file>` (per-file lint, < 5s)                                      |
| **Full suite command** | `pnpm lint && pnpm type-check && pnpm test:unit && pnpm playwright test <wave-regen-list>` |
| **Estimated runtime**  | ~5s per file (quick); ~5–10 min per wave (full)                                            |

---

## Sampling Rate

- **After every task commit (per file):** `pnpm lint frontend/src/<file>` — must exit 0
- **After every wave PR (D-11 gate):** `pnpm lint && pnpm type-check && pnpm test:unit && pnpm playwright test <wave-regen-list>` — all green; visual baselines regenerated & LTR≠RTL byte-distinct per D-12
- **After every wave merge to main:** All 8 required CI contexts (Phase 55 D-13) pass on PR; protected-branch enforcement blocks otherwise
- **Phase gate (before `/gsd:verify-work 58`):** Full suite green; `! grep -rn 'Phase 51 Tier-C' frontend/src` returns zero; `git tag -v phase-58-base` exits 0 with `Good "git" signature`
- **Max feedback latency:** ~5s per atomic commit; ~10 min per wave gate

---

## Per-Task Verification Map

> Concrete task IDs are emitted by `gsd-planner` into each `58-NN-<surface>-PLAN.md`. The placeholder rows below show the validation contract each per-file atomic task MUST satisfy (D-04 atomic-per-file precedent inherited from Phase 51 Plan 04).

| Task ID         | Plan   | Wave   | Requirement         | Threat Ref | Secure Behavior                                                                                                                                              | Test Type          | Automated Command                                                                                                                                   | File Exists  | Status     |
| --------------- | ------ | ------ | ------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------- |
| 58-00-01        | 00     | 0      | TOKEN-01 + TOKEN-02 | —          | Wave manifest deterministic; covers every Tier-C file; no orphans; no cross-wave claim                                                                       | smoke (script)     | Manifest script: row-count == grep-count from `frontend/src`; per-file `wave` ∈ {1..6}; uniqueness on `audit_slug`                                  | ✅           | ⬜ pending |
| 58-{1..6}-NN-01 | {1..6} | {1..6} | TOKEN-01            | —          | File contains zero `Phase 51 Tier-C` markers post-swap; all literals → semantic tokens                                                                       | smoke (grep)       | `! grep -n 'Phase 51 Tier-C' frontend/src/<file>`                                                                                                   | ✅           | ⬜ pending |
| 58-{1..6}-NN-02 | {1..6} | {1..6} | TOKEN-01            | —          | Per-file lint stays green                                                                                                                                    | lint               | `pnpm lint frontend/src/<file>` exits 0                                                                                                             | ✅           | ⬜ pending |
| 58-{1..6}-NN-03 | {1..6} | {1..6} | TOKEN-01            | —          | Same-PR test grep updates (where `test_grep_hits=yes`)                                                                                                       | unit               | `pnpm test:unit frontend/tests/unit/<test-file>` exits 0                                                                                            | ✅ (3 known) | ⬜ pending |
| 58-{1..6}-ZZ-01 | {1..6} | {1..6} | TOKEN-01            | —          | Wave-level visual baseline regen + LTR≠RTL byte-distinct (D-12)                                                                                              | visual / e2e       | `pnpm playwright test <wave-regen-list> --update-snapshots`; then `cmp -s <ltr.png> <rtl.png>` MUST exit non-zero for each regenerated pair         | ✅           | ⬜ pending |
| 58-{1..6}-ZZ-02 | {1..6} | {1..6} | TOKEN-02            | —          | Workspace lint green at wave merge                                                                                                                           | lint               | `pnpm lint` exits 0                                                                                                                                 | ✅           | ⬜ pending |
| 58-{1..6}-ZZ-03 | {1..6} | {1..6} | TOKEN-01            | —          | Workspace type-check green at wave merge                                                                                                                     | type-check         | `pnpm type-check` exits 0                                                                                                                           | ✅           | ⬜ pending |
| 58-06-CL-01     | 06     | 6      | TOKEN-01 + TOKEN-02 | —          | Phase closure: zero `Phase 51 Tier-C` markers in `frontend/src/`; closure annotation appended to `51-DESIGN-AUDIT.md`; `phase-58-base` SSH-signed tag pushed | smoke (grep + tag) | `! grep -rn 'Phase 51 Tier-C' frontend/src`; `git tag -v phase-58-base` exits 0 with `Good "git" signature`                                         | ✅           | ⬜ pending |
| 58-06-CL-02     | 06     | 6      | TOKEN-02            | —          | `eslint.config.mjs` carries no Tier-C-specific block, allowlist, or comment-marker exception (D-13 — N/A by absence)                                         | smoke (grep)       | `! grep -E 'tier-c\|Tier-C\|design-token-tier' eslint.config.mjs` returns zero structural matches (Tier-B carve-out at lines 247-270 remains — OOS) | ✅           | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `58-WAVE-MANIFEST.md` — deterministic manifest mapping every Tier-C file → wave + per-row override columns (D-03)
- [ ] `58-00-wave-manifest-PLAN.md` — Wave 0 plan
- [ ] No new test files required; existing infrastructure (Vitest + Playwright) covers all phase requirements
- [ ] No framework install required (Vitest, Playwright, ESLint all wired at `phase-57-base`)

_Test infrastructure complete at `phase-57-base`. All validation tooling exists and is wired._

---

## Manual-Only Verifications

| Behavior                                                            | Requirement | Why Manual                                                                                                | Test Instructions                                                                                                                                                                                                             |
| ------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chromatic regression review per wave's regenerated visual baselines | TOKEN-01    | Visual diffs require human "looks right" judgment for hue shifts (e.g., blue → accent on dossier rail)    | After `--update-snapshots`, open each regenerated PNG, compare to pre-swap baseline. If a swap visibly shifts the brand hue beyond mode-invariant ink-token convergence, flag in `override_notes` and STOP that wave's merge. |
| Tier-B carve-out untouched                                          | —           | Visual / structural inspection of `eslint.config.mjs:247-270` to confirm Tier-B carve-out lines unchanged | Diff `eslint.config.mjs` between `phase-57-base` and each wave merge — Tier-B block must be byte-identical                                                                                                                    |

---

## Validation Sign-Off

- [ ] All wave tasks have `pnpm lint` per-file `<automated>` verify
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (per-file lint runs after every atomic commit)
- [ ] Wave 0 covers all MISSING references (`58-WAVE-MANIFEST.md` enumerates every Tier-C file)
- [ ] No watch-mode flags (no `--watch`, `--ui` in CI commands)
- [ ] Feedback latency < 10s per atomic commit
- [ ] `nyquist_compliant: true` set in frontmatter after Wave 0 manifest commits

**Approval:** pending
