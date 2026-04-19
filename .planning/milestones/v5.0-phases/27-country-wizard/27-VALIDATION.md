---
phase: 27
slug: country-wizard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 27 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                  |
| ---------------------- | -------------------------------------- |
| **Framework**          | Vitest + @testing-library/react        |
| **Config file**        | `frontend/vitest.config.ts`            |
| **Quick run command**  | `pnpm --filter frontend test -- --run` |
| **Full suite command** | `pnpm test`                            |
| **Estimated runtime**  | ~30 seconds                            |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend test -- --run`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior                          | Test Type | Automated Command                                         | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | ---------------------------------------- | --------- | --------------------------------------------------------- | ----------- | ---------- |
| 27-01-01 | 01   | 1    | CTRY-01     | —          | N/A                                      | unit      | `pnpm --filter frontend test -- --run CountryWizard`      | No - Wave 0 | ⬜ pending |
| 27-01-02 | 01   | 1    | CTRY-02     | T-27-01    | Zod `.length(2)`/`.length(3)` + DB CHECK | unit      | `pnpm --filter frontend test -- --run CountryDetailsStep` | No - Wave 0 | ⬜ pending |
| 27-01-03 | 01   | 1    | CTRY-02     | —          | N/A                                      | unit      | `pnpm --filter frontend test -- --run useCountryAutoFill` | No - Wave 0 | ⬜ pending |
| 27-01-04 | 01   | 1    | CTRY-03     | —          | N/A                                      | unit      | `pnpm --filter frontend test -- --run CountriesListPage`  | No - Wave 0 | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `frontend/src/components/dossier/wizard/steps/__tests__/CountryDetailsStep.test.tsx` — stubs for CTRY-02
- [ ] `frontend/src/components/dossier/wizard/review/__tests__/CountryReviewStep.test.tsx` — stubs for CTRY-01 (review step)
- [ ] `frontend/src/components/dossier/wizard/hooks/__tests__/useCountryAutoFill.test.ts` — stubs for CTRY-02 (auto-fill)

_Existing infrastructure covers test framework setup._

---

## Manual-Only Verifications

| Behavior                                 | Requirement | Why Manual                            | Test Instructions                                                            |
| ---------------------------------------- | ----------- | ------------------------------------- | ---------------------------------------------------------------------------- |
| RTL layout renders correctly in Arabic   | CTRY-01     | Visual RTL verification needs browser | Switch to Arabic locale, verify wizard steps flow RTL with correct alignment |
| Created country navigates to detail page | CTRY-01     | Full navigation flow requires E2E     | Submit wizard, verify redirect to `/dossiers/countries/{id}`                 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
