---
phase: 97
slug: reachability
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-17
---

# Phase 97 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `97-RESEARCH.md` §Validation Architecture (lines 624–659).

---

## Test Infrastructure

| Property               | Value                                                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Framework**          | Vitest 4 (unit, `frontend/`) + Playwright (`@playwright/test`, root)                                                                                                                 |
| **Config file**        | `playwright.config.ts` (root; baseURL `http://localhost:5173`; storageState projects blocked by E2ECRED-01 → use `--no-deps`)                                                        |
| **Quick run command**  | `pnpm --filter frontend exec vitest run src/pages/dossiers/__tests__/CreateDossierHub.test.tsx`                                                                                      |
| **Full suite command** | `pnpm exec playwright test tests/e2e/97-*.spec.ts --project=chromium-en --no-deps` (after Wave 0 specs exist; gate asserts spec-file existence FIRST — Playwright paths are FILTERS) |
| **Estimated runtime**  | ~120 seconds (e2e family against the running dev stack)                                                                                                                              |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend typecheck` + the touched unit spec
- **After every plan wave:** Run the wave's `97-*` Playwright specs against the running dev stack (`pnpm dev`; frontend `:5173`, backend `PORT=5001`)
- **Before `/gsd:verify-work`:** Full `97-*` suite green from a drilled-red baseline (both-direction drill per D-11) + full `pnpm lint`
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

Filled by the planner — every task cites its requirement row below. Requirement-level map
(from RESEARCH §Phase Requirements → Test Map):

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior                                                                                                | Test Type              | Automated Command                                                                                                                                                         | File Exists | Status     |
| ------- | ---- | ---- | ----------- | ---------- | -------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| TBD     | TBD  | TBD  | NAV-01      | —          | nav visibility ≠ authorization (documented per row)                                                            | e2e                    | `pnpm exec playwright test tests/e2e/97-elected-officials-reachable.spec.ts --project=chromium-en --no-deps`                                                              | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | NAV-02      | —          | N/A                                                                                                            | e2e + unit (predicate) | `pnpm exec playwright test tests/e2e/97-settings-nav.spec.ts --project=chromium-en --no-deps`                                                                             | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | NAV-03      | —          | N/A                                                                                                            | e2e                    | `pnpm exec playwright test tests/e2e/97-digests-tab.spec.ts tests/e2e/97-list-create-affordances.spec.ts --project=chromium-en --no-deps` (assert both files exist first) | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | NAV-04      | V4 note    | decision rows never claim nav entries provide access control (`CommandPalette.tsx:522` hardcodes isAdmin=true) | e2e + script gate      | `97-nav04-rows.spec.ts` + `command grep` derivations with positive controls, unpiped exit codes                                                                           | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `tests/e2e/97-elected-officials-reachable.spec.ts` — NAV-01 (incl. the EO create-submit leg — Assumption A1)
- [ ] `tests/e2e/97-settings-nav.spec.ts` — NAV-02 (iterate the 6 child routes; hardcode 6)
- [ ] `tests/e2e/97-digests-tab.spec.ts` — NAV-03 Digests tab
- [ ] `tests/e2e/97-list-create-affordances.spec.ts` — NAV-03 (hardcode 8 pages; data-present precondition)
- [ ] `tests/e2e/97-nav04-rows.spec.ts` — NAV-04 click-throughs for KEEP rows
- Framework install: none (all present).

---

## Manual-Only Verifications

| Behavior                               | Requirement | Why Manual                                                                          | Test Instructions                          |
| -------------------------------------- | ----------- | ----------------------------------------------------------------------------------- | ------------------------------------------ |
| RTL/pixel rendering of new nav entries | NAV-01..04  | Operator park — no visual baselines committed (D-12; four-point calendar precedent) | Operator sitting, per RESUME-P96 park list |

All other phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
