---
phase: 92
slug: session-integrity-edge-function-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
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

| Task ID           | Plan | Wave | Requirement                | Threat Ref | Secure Behavior                                                       | Test Type               | Automated Command                                                                                    | File Exists | Status     |
| ----------------- | ---- | ---- | -------------------------- | ---------- | --------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| _pending planner_ | —    | —    | AUTH-01                    | T-92-01    | Session is cleared, not merely navigated away from                    | e2e                     | `pnpm exec playwright test tests/e2e/92-signout.spec.ts --project=chromium-en --no-deps`             | ❌ W0       | ⬜ pending |
| _pending planner_ | —    | —    | AUTH-02 (3 confirmed core) | T-92-02    | A valid JWT is accepted; no 401 on a live session                     | probe (staging)         | Pattern-3 probe against **deployed** functions                                                       | ❌ W0       | ⬜ pending |
| _pending planner_ | —    | —    | AUTH-02 (130 sweep)        | T-92-02    | No deprecated pin remains to float its auth client                    | grep                    | `grep -rlE '@supabase/supabase-js@2\.3[0-9]' supabase/functions --include='index.ts' \| wc -l` → `0` | ✅          | ⬜ pending |
| _pending planner_ | —    | —    | AUTH-03                    | T-92-03    | An invalidated session cannot continue rendering authenticated chrome | e2e                     | same spec, second test (≥45 s budget for the 30 s tick)                                              | ❌ W0       | ⬜ pending |
| _pending planner_ | —    | —    | AUTH-04                    | T-92-04    | A rejected query renders as failure, never as emptiness               | e2e forced-error + unit | `pnpm exec playwright test tests/e2e/92-delegations-error.spec.ts --project=chromium-en --no-deps`   | ❌ W0       | ⬜ pending |
| _pending planner_ | —    | —    | AUTH-05                    | —          | Sign-out reachable from a second, independent surface                 | e2e                     | covered by `92-signout.spec.ts`                                                                      | ❌ W0       | ⬜ pending |
| _pending planner_ | —    | —    | CARRY-01                   | T-92-05    | Rotated credentials authenticate; old ones do not                     | existing e2e            | `pnpm exec playwright test tests/e2e/01-login.spec.ts --project=chromium-en`                         | ✅          | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `tests/e2e/92-signout.spec.ts` — AUTH-01 / AUTH-03 / AUTH-05 (logout from both surfaces;
      storage-invalidation bounce; `/settings` reachability)
- [ ] `tests/e2e/92-delegations-error.spec.ts` — AUTH-04, forced-error via CDP
      `Network.setBlockedURLs` (the project's established forced-error protocol; an RLS/auth denial
      can present as an empty 200, so assert `role="alert"` in the DOM rather than inferring from
      the network)
- [ ] `scripts/probe-edge-auth.sh` — the Pattern-3 probe, one representative per set (A∩B, B\A, A\B),
      run against **deployed staging** functions and recording actual status codes
- [ ] No framework installs needed — Vitest and Playwright are both already configured

---

## Manual-Only Verifications

| Behavior                       | Requirement               | Why Manual                                                                                                                                              | Test Instructions                                                                                                                                                                                             |
| ------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Credential rotation            | CARRY-01                  | Operator-only act (D-14). Rotating a live secret cannot be automated from inside the phase, and the GitHub Actions secret is not readable by the suite. | Operator rotates the P88-02 credentials, updates the GitHub Actions secrets (`E2E_ANALYST_*` / `E2E_ADMIN_*`) and `.env.test`, then runs the login smoke. Never echo the values.                              |
| RTL render of the new controls | AUTH-01, AUTH-04, AUTH-05 | Tajawal application and mirroring are judged visually; the automated suite asserts `dir`, not typeface.                                                 | Render the user-card dropdown, the `/settings` sign-out row and the `/delegations` error state at 1024px and 1400px with `dir="rtl"`; confirm Tajawal applies and the Arabic sign-out string resolves (D-24). |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---

## Note on what this strategy cannot establish

The AUTH-02 sweep's grep proves **source** state. It does not prove the deployed artifact, because
Supabase bundles dependencies at deploy time and a `2.3x` pin floats its `gotrue-js` caret on every
deploy (D-21). A green grep with an un-deployed function is a false pass, which is why the probe
runs against deployed staging and why D-09 puts deployment inside this phase. Neither check
establishes that the 130 swept functions were ever broken — no per-function failure was demonstrated
for them (D-19).
