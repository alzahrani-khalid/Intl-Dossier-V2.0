---
phase: 80
slug: full-route-visual-a11y-verification-smoke-suite
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-03
---

# Phase 80 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source detail: `80-RESEARCH.md` § "Validation Architecture". This scaffold's
> per-task map is populated by the planner from the finalized PLAN.md files.

---

## Test Infrastructure

| Property               | Value                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Playwright 1.60.0 (visual + a11y + RTL smokes) · @axe-core/playwright 4.11.3 · jest-axe 10.0.0 (component a11y) |
| **Config file**        | `frontend/playwright.config.ts` (projects incl. `a11y`, quarantine list)                                        |
| **Quick run command**  | `cd frontend && pnpm exec vitest run <spec>` (component) / `pnpm exec playwright test <spec> --project=<proj>`  |
| **Full suite command** | `cd frontend && pnpm test:qa-sweep` (visual) + a11y Playwright project + FOUC-02 RTL smokes                     |
| **Estimated runtime**  | ~minutes (browser project); seeded local-dev-server pattern (never e2e.yml deployed-app)                        |

---

## Sampling Rate

- **After every task commit:** Run the task's targeted spec (`playwright test <spec>` / `vitest run <spec>`)
- **After every plan wave:** Run the affected full project (visual re-compare / a11y sweep / RTL smokes)
- **Before `/gsd:verify-work`:** New/repaired suites green; VERIFY-01 diff-triage human-approved; baselines recorded (no laundering)
- **Max feedback latency:** targeted spec < ~60s

---

## Per-Task Verification Map

| Task ID   | Plan | Wave | Requirement                     | Threat Ref | Secure Behavior          | Test Type       | Automated Command | File Exists | Status     |
| --------- | ---- | ---- | ------------------------------- | ---------- | ------------------------ | --------------- | ----------------- | ----------- | ---------- |
| {N}-01-01 | 01   | 1    | VERIFY-01 / VERIFY-02 / FOUC-02 | —          | N/A (verification phase) | e2e/visual/a11y | `{command}`       | ✅ / ❌ W0  | ⬜ pending |

_Populated by the planner from finalized plans. Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] Confirm the Phase 77 pre-token baseline (commit `14191cb85`, 43 PNGs / 10 specs) is intact and replayable
- [ ] Re-refresh the `b0000002-*` staging seed + `FROZEN_TIME` realignment (per `77-BASELINE-VALIDATION.md` §2) before any visual replay
- [ ] Confirm axe-core Playwright `a11y` project + honest baseline-recording mechanism (`test.fixme` + `TRACKED APP A11Y DEBT`)

_Existing infrastructure covers all phase requirements — no new frameworks/packages._

---

## Manual-Only Verifications

| Behavior                                                              | Requirement | Why Manual                              | Test Instructions                                                                                 |
| --------------------------------------------------------------------- | ----------- | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Visual diff triage (intended-Linear vs regression)                    | VERIFY-01   | Human judgment; anti-laundering control | Replay baseline specs, present diff pairs to overseer/user for adjudication (`autonomous: false`) |
| Add new RTL/portal smoke job to branch protection (true build-gating) | FOUC-02     | Repo-admin GitHub settings change       | Human enables the new required check in branch protection (`checkpoint: human-verify`)            |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
