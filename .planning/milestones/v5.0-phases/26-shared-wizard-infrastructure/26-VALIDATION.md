---
phase: 26
slug: shared-wizard-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                  |
| ---------------------- | -------------------------------------- |
| **Framework**          | vitest                                 |
| **Config file**        | `frontend/vitest.config.ts`            |
| **Quick run command**  | `pnpm --filter frontend test -- --run` |
| **Full suite command** | `pnpm --filter frontend test -- --run` |
| **Estimated runtime**  | ~30 seconds                            |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend test -- --run`
- **After every plan wave:** Run `pnpm --filter frontend test -- --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command                      | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | --------------- | --------- | -------------------------------------- | ----------- | ---------- |
| 26-01-01 | 01   | 1    | INFRA-01    | —          | N/A             | unit      | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |
| 26-01-02 | 01   | 1    | INFRA-02    | —          | N/A             | unit      | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |
| 26-01-03 | 01   | 1    | INFRA-03    | —          | N/A             | unit      | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |
| 26-01-04 | 01   | 1    | INFRA-04    | —          | N/A             | unit      | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |
| 26-01-05 | 01   | 1    | INFRA-05    | —          | N/A             | unit      | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |
| 26-01-06 | 01   | 1    | INFRA-06    | —          | N/A             | unit      | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |
| 26-01-07 | 01   | 1    | INFRA-07    | —          | N/A             | unit      | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] Test stubs for Zod schema validation (INFRA-03)
- [ ] Test stubs for `getDefaultsForType()` factory (INFRA-04)
- [ ] Test stubs for draft migration (INFRA-07)
- [ ] Test stubs for `useCreateDossierWizard` hook (INFRA-01)

_Existing vitest infrastructure covers framework needs._

---

## Manual-Only Verifications

| Behavior                        | Requirement | Why Manual                 | Test Instructions                                                         |
| ------------------------------- | ----------- | -------------------------- | ------------------------------------------------------------------------- |
| CreateWizardShell RTL rendering | INFRA-02    | Visual layout verification | Open wizard in Arabic mode, verify step indicator flows RTL               |
| Draft migration UX              | INFRA-07    | User flow verification     | Create draft with old key format, reload, verify migrated to per-type key |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
