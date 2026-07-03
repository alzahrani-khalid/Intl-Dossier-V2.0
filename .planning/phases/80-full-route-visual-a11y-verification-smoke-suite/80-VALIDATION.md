---
phase: 80
slug: full-route-visual-a11y-verification-smoke-suite
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-03
planned: 2026-07-03
---

# Phase 80 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source detail: `80-RESEARCH.md` § "Validation Architecture". Per-task map
> populated from the finalized 80-01..80-06 PLAN.md files.

---

## Test Infrastructure

| Property               | Value                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Framework**          | Playwright 1.60.0 (visual + a11y + RTL smokes) · @axe-core/playwright 4.11.3 · jest-axe 10.0.0 (component a11y) |
| **Config file**        | `frontend/playwright.config.ts` (projects incl. `a11y`, quarantine list)                                        |
| **Quick run command**  | `cd frontend && pnpm exec vitest run <spec>` (component) / `pnpm exec playwright test <spec> --project=<proj>`  |
| **Full suite command** | 10-visual-spec replay + `--project=a11y` + 4-axis sweep + FOUC-02 smoke trio (all local-dev-server pattern)     |
| **Estimated runtime**  | ~minutes per suite (browser projects); seeded local-dev-server pattern (never e2e.yml deployed-app)             |

---

## Sampling Rate

- **After every task commit:** Run the task's targeted spec (`playwright test <spec>` / `vitest run <spec>`)
- **After every plan wave:** Run the affected full project (visual re-compare / a11y sweep / RTL smokes)
- **Before `/gsd:verify-work`:** New/repaired suites green; VERIFY-01 diff-triage human-approved; baselines recorded (no laundering)
- **Max feedback latency:** targeted spec < ~60s (full replays/sweeps are wave-level, minutes)

---

## Per-Task Verification Map

<!-- prettier-ignore -->
| Task ID  | Plan | Wave | Requirement | Threat Ref       | Secure Behavior                                  | Test Type            | Automated Command                                                                                          | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------------- | ------------------------------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 80-01-01 | 01   | 1    | VERIFY-02   | T-80-02          | classify only against live fixtures              | e2e a11y (character.) | `pnpm -C frontend exec playwright test --project=a11y --retries=1` (red = data, not failure)               | ✅          | ⬜ pending |
| 80-01-02 | 01   | 1    | VERIFY-02   | T-80-01          | called-out 4-axis extension, runAxe only         | e2e a11y sweep       | `pnpm -C frontend exec playwright test qa-sweep-axe-4axis.spec.ts --project=chromium --list` → 60 tests    | ❌ W0       | ⬜ pending |
| 80-02-01 | 02   | 2    | VERIFY-02   | T-80-04, T-80-05 | set A from real run at 14191cb85; port hygiene   | e2e A/B (worktree)   | `grep -q "14191cb85" 80-A11Y-BASELINE.md` + worktree removed                                               | ✅          | ⬜ pending |
| 80-02-02 | 02   | 2    | VERIFY-02   | T-80-04          | B ⊆ A verdict + NEW-on-HEAD must-fix list        | ledger analysis      | `grep -qE "B ⊆ A" 80-A11Y-BASELINE.md && grep -q "NEW-on-HEAD" 80-A11Y-BASELINE.md`                        | —           | ⬜ pending |
| 80-03-01 | 03   | 3    | VERIFY-02   | T-80-07, T-80-08 | fixme count == ledger recorded count             | test edits + src     | `grep -rn "80: recorded pre-migration baseline" frontend/tests \| wc -l` == ledger count                   | ✅          | ⬜ pending |
| 80-03-02 | 03   | 3    | VERIFY-02   | —                | gate green without laundering                    | e2e a11y             | `pnpm -C frontend exec playwright test --project=a11y --retries=2` exit 0 + 4-axis exit 0                  | ✅          | ⬜ pending |
| 80-04-01 | 04   | 4    | VERIFY-01   | T-80-12          | orchestrator-only staging write                  | manual (MCP)         | MISSING — MCP SELECT quoted in 80-VISUAL-RECOMPARE.md header (manual-only, see below)                      | —           | ⬜ pending |
| 80-04-02 | 04   | 4    | VERIFY-01   | T-80-10          | diffs preserved; zero PNG writes                 | visual e2e replay    | `git status --porcelain -- 'frontend/tests/e2e/*-snapshots' 'frontend/tests/e2e/__snapshots__'` empty      | ✅          | ⬜ pending |
| 80-04-03 | 04   | 4    | VERIFY-01   | T-80-11          | human verdicts, never auto-approved              | manual (human)       | `grep -cE "intended-Linear\|regression\|dynamic content" 80-VISUAL-RECOMPARE.md` ≥ 43 (post-check)         | —           | ⬜ pending |
| 80-05-01 | 05   | 5    | VERIFY-01   | T-80-12          | seed/clock same-day guarantee                    | manual (MCP)         | MISSING — dated resume message recorded in ledger (manual-only, see below)                                 | —           | ⬜ pending |
| 80-05-02 | 05   | 5    | VERIFY-01   | T-80-14          | regressions fixed vs OLD baseline                | visual e2e           | `grep -qE "No regression verdicts\|fixed \(was regression\)" 80-VISUAL-RECOMPARE.md` + type-check exit 0   | ✅          | ⬜ pending |
| 80-05-03 | 05   | 5    | VERIFY-01   | T-80-13, T-80-15 | recapture post-approval; byte-stable replay      | visual e2e proof     | 10-spec replay `--retries=2` exit 0, 43/43, zero snapshot writes after proof                               | ✅          | ⬜ pending |
| 80-06-01 | 06   | 6    | FOUC-02     | T-80-19          | screenshot-free smokes; frozen calendar clock    | e2e smoke            | `pnpm -C frontend exec playwright test rtl-component-smokes.spec.ts calendar-rtl.spec.ts --project=chromium` | ❌ W0       | ⬜ pending |
| 80-06-02 | 06   | 6    | FOUC-02     | T-80-16          | secrets via ${{ secrets.* }}; no E2E_BASE_URL    | CI config + e2e      | grep job/name/creds in ci.yml + local trio run (9 tests) exit 0                                            | ❌ W0       | ⬜ pending |
| 80-06-03 | 06   | 6    | FOUC-02     | T-80-18          | gating real or honestly recorded                 | manual + gh api      | `gh api repos/:owner/:repo/branches/main/protection --jq '.required_status_checks.contexts'` (post-check)  | —           | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `frontend/tests/e2e/qa-sweep-axe-4axis.spec.ts` — VERIFY-02 4-axis vehicle (built in 80-01-02)
- [ ] `frontend/tests/e2e/rtl-component-smokes.spec.ts` — FOUC-02 Popover/Pagination/Sidebar (built in 80-06-01)
- [ ] `ci.yml` `test-rtl-smokes` job — FOUC-02 gating vehicle (built in 80-06-02)
- [ ] `80-A11Y-BASELINE.md` + `80-VISUAL-RECOMPARE.md` ledgers — recorded-baseline evidence (built in 80-01/80-04)
- [x] Phase 77 pre-token baseline intact at `14191cb85` (43 PNGs / 10 specs) — verified by research 2026-07-03
- [x] Honest-recording mechanism confirmed: `test.fixme` + `TRACKED APP A11Y DEBT` (10 in-repo instances)
- [ ] `b0000002-*` seed re-refresh + `FROZEN_TIME` realignment — orchestrator MCP, 80-04-01 (before any visual replay)

_Existing infrastructure covers all phase requirements — no new frameworks/packages (Package Legitimacy Audit: none)._

---

## Manual-Only Verifications

| Behavior                                                              | Requirement | Why Manual                                                | Test Instructions                                                                             |
| --------------------------------------------------------------------- | ----------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Visual diff triage (intended-Linear vs regression)                    | VERIFY-01   | Human judgment; anti-laundering control (LOCKED decision) | 80-04-03: replay artifacts + HTML report; human adjudicates all 43 rows (`autonomous: false`) |
| Staging seed re-refresh + seed-currency gate                          | VERIFY-01   | Supabase MCP is orchestrator-only (executors have no MCP) | 80-04-01 / 80-05-01: orchestrator applies 77-BASELINE-VALIDATION §2 SQL, verifies via SELECT  |
| Add new RTL/portal smoke job to branch protection (true build-gating) | FOUC-02     | Repo-admin GitHub settings change                         | 80-06-03: human adds required context, verified via `gh api`; decline/defer recorded honestly |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or documented manual-only disposition (80-04-01 / 80-05-01 marked MISSING with evidence path per Nyquist rule)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (checkpoints are single tasks bracketed by automated tasks)
- [x] Wave 0 covers all MISSING references (4-axis spec, smoke spec, CI job, ledgers — each owned by a named task)
- [x] No watch-mode flags
- [x] Feedback latency < 60s for targeted specs (full replays are wave-level by design)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planner sign-off 2026-07-03 (plans 80-01..80-06)
