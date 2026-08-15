---
phase: 92
slug: session-integrity-edge-function-auth
status: filled
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-15
---

# Phase 92 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `92-RESEARCH.md` § Validation Architecture. The per-task map below is keyed to
> requirements until the planner emits task IDs; execute-phase fills the `Task ID` column.

---

## Test Infrastructure

| Property               | Value                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest (unit, `frontend`) + Playwright (e2e, root `playwright.config.ts`, `testDir: tests/e2e`) |
| **Config file**        | `playwright.config.ts` (root); `baseURL` = `E2E_BASE_URL` or `http://localhost:5173`            |
| **Quick run command**  | `pnpm exec playwright test <spec> --project=chromium-en --no-deps`                              |
| **Full suite command** | `pnpm test` (turbo) · `pnpm test:e2e:ci` (chromium-en + chromium-ar-smoke)                      |
| **Estimated runtime**  | ~45 s targeted spec (AUTH-03 needs a ≤30 s gotrue tick + margin); full e2e several minutes      |

---

## Sampling Rate

- **After every task commit:** the targeted spec (`--no-deps`, single project), or — for the AUTH-02
  sweep tasks — the D-08 derivation command
- **After every plan wave:** `pnpm test:e2e:ci` + repo-wide grep + probe of the functions touched in
  that wave
- **Before `/gsd:verify-work`:** derivation command → `0`, probe returns non-401 on every set
  representative including `my-delegations`, and both new e2e specs green
- **Max feedback latency:** 60 seconds for a targeted spec

---

## Per-Task Verification Map

| Task ID                   | Plan  | Wave | Requirement                | Threat Ref | Secure Behavior                                                       | Test Type               | Automated Command                                                                                    | File Exists | Status     |
| ------------------------- | ----- | ---- | -------------------------- | ---------- | --------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 92-02:T1                  | 02    | 2    | AUTH-01                    | T-92-01    | Session is cleared, not merely navigated away from                    | e2e                     | `pnpm exec playwright test tests/e2e/92-signout.spec.ts --project=chromium-en --no-deps`             | ❌ W0       | ⬜ pending |
| 92-04:T2                  | 04    | 2    | AUTH-02 (3 confirmed core) | T-92-02    | A valid JWT is accepted; no 401 on a live session                     | probe (staging)         | Pattern-3 probe against **deployed** functions                                                       | ❌ W0       | ⬜ pending |
| 92-05..08:T1-T2, 92-09:T2 | 05-09 | 2-3  | AUTH-02 (130 sweep)        | T-92-02    | No deprecated pin remains to float its auth client                    | grep                    | `grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='index.ts' \| wc -l` → `0` | ✅          | ⬜ pending |
| 92-02:T2                  | 02    | 2    | AUTH-03                    | T-92-03    | An invalidated session cannot continue rendering authenticated chrome | e2e                     | same spec, third test (≥45 s budget for the 30 s tick)                                               | ❌ W0       | ⬜ pending |
| 92-03:T1-T2               | 03    | 2    | AUTH-04                    | T-92-04    | A rejected query renders as failure, never as emptiness               | e2e forced-error + unit | `pnpm exec playwright test tests/e2e/92-delegations-error.spec.ts --project=chromium-en --no-deps`   | ❌ W0       | ⬜ pending |
| 92-01:T2, 92-02:T3        | 01,02 | 1-2  | AUTH-05                    | —          | Sign-out reachable from a second, independent surface                 | e2e                     | covered by `92-signout.spec.ts`                                                                      | ❌ W0       | ⬜ pending |
| 92-10:T1-T2               | 10    | 1    | CARRY-01                   | T-92-05    | Rotated credentials authenticate; old ones do not                     | existing e2e            | `pnpm exec playwright test tests/e2e/01-login.spec.ts --project=chromium-en`                         | ✅          | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [x] PLANNED in 92-01:T2 — `tests/e2e/92-signout.spec.ts` — AUTH-03 / AUTH-05 + D-04 (narrowed per D-26;
      storage-invalidation bounce; `/settings` reachability)
- [x] PLANNED in 92-01:T3 — `tests/e2e/92-delegations-error.spec.ts` — AUTH-04, forced-error via CDP
      `Network.setBlockedURLs` (the project's established forced-error protocol; an RLS/auth denial
      can present as an empty 200, so assert `role="alert"` in the DOM rather than inferring from
      the network)
- [x] PLANNED in 92-01:T1 — `scripts/probe-edge-auth.sh` — the Pattern-3 probe, one representative per set (A∩B, B\A, A\B),
      run against **deployed staging** functions and recording actual status codes
- [x] No framework installs needed — Vitest and Playwright are both already configured

---

## Manual-Only Verifications

| Behavior                       | Requirement               | Why Manual                                                                                                                                              | Test Instructions                                                                                                                                                                                             |
| ------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Credential rotation            | CARRY-01                  | Operator-only act (D-14). Rotating a live secret cannot be automated from inside the phase, and the GitHub Actions secret is not readable by the suite. | Operator rotates the P88-02 credentials, updates the GitHub Actions secrets (`E2E_ANALYST_*` / `E2E_ADMIN_*`) and `.env.test`, then runs the login smoke. Never echo the values.                              |
| RTL render of the new controls | AUTH-01, AUTH-04, AUTH-05 | Tajawal application and mirroring are judged visually; the automated suite asserts `dir`, not typeface.                                                 | Render the user-card dropdown, the `/settings` sign-out row and the `/delegations` error state at 1024px and 1400px with `dir="rtl"`; confirm Tajawal applies and the Arabic sign-out string resolves (D-24). |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (92-01: probe script + both specs + AUTH-01 RED baseline)
- [x] No watch-mode flags
- [x] Feedback latency < 60s (one exception, deliberate: the delegations forced-error assertion carries a 15s timeout for TanStack retry backoff — checker B-2)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** back-filled by the Phase 92 planner, 2026-08-15 (checker W-3) — Task IDs map to 92-01..92-10; Wave 0 artifacts are planned in 92-01

---

## Note on what this strategy cannot establish

The AUTH-02 sweep's grep proves **source** state. It does not prove the deployed artifact, because
Supabase bundles dependencies at deploy time and a `2.3x` pin floats its `gotrue-js` caret on every
deploy (D-21). A green grep with an un-deployed function is a false pass, which is why the probe
runs against deployed staging and why D-09 puts deployment inside this phase. Neither check
establishes that the 130 swept functions were ever broken — no per-function failure was demonstrated
for them (D-19).
