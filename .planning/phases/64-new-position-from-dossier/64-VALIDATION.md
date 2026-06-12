---
phase: 64
slug: new-position-from-dossier
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-12
---

# Phase 64 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest (frontend workspace) + @testing-library/react                                                |
| **Config file**        | `frontend/vitest.config.ts` (existing)                                                              |
| **Quick run command**  | `cd frontend && pnpm exec vitest run src/components/positions/__tests__/NewPositionDialog.test.tsx` |
| **Full suite command** | `cd frontend && pnpm exec vitest run`                                                               |
| **Estimated runtime**  | quick ~10s; full suite ~3-5 min (1,245 pass / 0 fail at last quick task)                            |

---

## Sampling Rate

- **After every task commit:** Run quick command + `cd frontend && pnpm type-check`
- **After every plan wave:** Run `cd frontend && pnpm exec vitest run` (full frontend unit suite)
- **Before `/gsd:verify-work`:** Full suite must be green + live staging verification (create → DB-verify link row with `link_type='applies_to'` → tab shows row without reload)
- **Max feedback latency:** 300 seconds

---

## Per-Task Verification Map

| Task ID             | Plan | Wave | Requirement | Threat Ref | Secure Behavior                                                                                                                     | Test Type                            | Automated Command                                                                    | File Exists | Status     |
| ------------------- | ---- | ---- | ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------ | ----------- | ---------- |
| TBD (planner fills) | —    | —    | POSNEW-01   | —          | Submit disabled until type + title_en + title_ar + ≥1 audience valid; payload carries real `position_type_id` and `audience_groups` | unit (RTL)                           | `pnpm exec vitest run src/components/positions/__tests__/NewPositionDialog.test.tsx` | ❌ W0       | ⬜ pending |
| TBD                 | —    | —    | POSNEW-01   | —          | Defaults: Standard preselected by name-match; All Staff pre-checked                                                                 | unit                                 | same file                                                                            | ❌ W0       | ⬜ pending |
| TBD                 | —    | —    | POSNEW-01   | —          | Translate failure leaves field untouched + non-blocking                                                                             | unit (mocked apiPost rejection)      | same file                                                                            | ❌ W0       | ⬜ pending |
| TBD                 | —    | —    | POSNEW-02   | —          | Step 2 called with `link_type: 'applies_to'`; on success invalidates `['dossier-position-links', dossierId]` + overview key         | unit (mocked repo + queryClient spy) | same file                                                                            | ❌ W0       | ⬜ pending |
| TBD                 | —    | —    | POSNEW-02   | —          | Partial failure → warning toast (not success), retry callable                                                                       | unit                                 | same file                                                                            | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] RLS migration + live `pg_policies` diagnostic on `positions` table (blocks everything — see RESEARCH.md Pitfall 1: live INSERT denial)
- [ ] `frontend/src/components/positions/__tests__/NewPositionDialog.test.tsx` — stubs for POSNEW-01/POSNEW-02 unit rows above (no tests exist today for `AddToDossierDialogs` or `DossierPositionsTab`)
- Framework install: none needed — existing Vitest infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior                                                        | Requirement | Why Manual                                                                                   | Test Instructions                                                                                                                                                                                                          |
| --------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Link row exists in DB; tab renders new position without refresh | POSNEW-02   | Requires live staging RLS + realtime cache behavior (milestone norm, Phases 62/63 precedent) | Authenticated probe + browser verification on a country/topic dossier: create position → SQL-verify `position_dossier_links` row with `link_type='applies_to'` → confirm Positions tab shows the row without manual reload |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 300s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
