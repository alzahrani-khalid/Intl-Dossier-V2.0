---
phase: 67
slug: per-type-engagement-contracts-legacy-detail-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-13
---

# Phase 67 — Validation Strategy

> Per-phase validation contract. Source of truth: `67-RESEARCH.md` §Validation Architecture (+ §Open Question Answers).

---

## Test Infrastructure

| Property               | Value                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest + @testing-library/react (jsdom)                                                               |
| **Config file**        | `frontend/vitest.config.ts` (suite green at 1406 tests post-Phase 66)                                 |
| **Quick run command**  | `cd frontend && pnpm vitest run src/components/dossier/tabs/__tests__/DossierEngagementsTab.test.tsx` |
| **Full suite command** | `cd frontend && pnpm vitest run`                                                                      |
| **Estimated runtime**  | quick ~5 s · full ~20-25 s local                                                                      |

---

## Sampling Rate

- **After every task commit:** quick run + `pnpm type-check`
- **After every plan wave:** full suite + `pnpm build`
- **Phase gate:** full suite + size-limit zero `exceeded` + live protocol (seed → browser DOM assertions EN/AR → cleanup) before `/gsd:verify-work`

---

## Per-Requirement Verification Map

| Req ID    | Behavior                                                                                            | Test Type        | Automated Command                                                                   | File Exists | Status     |
| --------- | --------------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------- | ----------- | ---------- |
| PERENG-01 | Org tab renders hosted engagement (mocked); isError → role="alert" (66 contract), never false-empty | unit             | quick run (extend DossierEngagementsTab.test.tsx)                                   | ✅ extend   | ⬜ pending |
| PERENG-02 | Person/EO tab renders participation rows with role badge EN+AR; live RPC shape preserved            | unit + live SQL  | unit: same file; live: orchestrator `SELECT get_person_full('<id>')` post-migration | ✅ extend   | ⬜ pending |
| PERENG-02 | Wizard postCreate participant payload includes created_by                                           | unit (RED-first) | `pnpm vitest run src/components/dossier/wizard/__tests__ -t participant`            | ❌ W0       | ⬜ pending |
| PERENG-03 | Zero surviving references to deleted module names                                                   | grep gate + tsc  | grep sweep over the deletion inventory names + `pnpm type-check`                    | gate        | ⬜ pending |
| All       | Type/build/size gates                                                                               | smoke            | `pnpm type-check && pnpm build && pnpm exec size-limit` (zero `exceeded`)           | gate        | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `frontend/src/components/dossier/wizard/__tests__/engagement-participants-payload.test.ts` — pins created_by in the postCreate insert
- [ ] Forced-error case in DossierEngagementsTab.test.tsx (66 contract — currently untested AND unimplemented on this tab)
- [x] Staging probes Q1-Q6 — ANSWERED 2026-06-13 (RESEARCH §Open Question Answers). CRITICAL: live get_person_full has NO recent_engagements key — the repoint migration must be authored against the captured live body. engagement_participants has 1 row (edge-writer path works; wizard path RLS-dropped). Seed ids captured.
- Framework install: none

---

## Manual-Only Verifications (live protocol — orchestrator-run; mirrors 64/65/66 gates)

| Behavior                                                     | Requirement | Why Manual                               |
| ------------------------------------------------------------ | ----------- | ---------------------------------------- |
| Org tab shows hosted engagement after host seed              | PERENG-01   | Live RLS + data seed                     |
| Person/EO tab shows participation row after participant seed | PERENG-02   | Live RLS + RPC repoint (applied via MCP) |
| RPC returns recent_engagements live                          | PERENG-02   | SECURITY DEFINER on staging              |
| AR/RTL + widths on the changed tabs                          | all         | Visual                                   |

### Live protocol sketch (exact SQL in RESEARCH §Live Verification Protocol)

1. Apply the get_person_full repoint migration via Supabase MCP (orchestrator).
2. Seed: `UPDATE engagement_dossiers SET host_organization_id = '<OECD id>' WHERE id = '<engagement id>'`; `INSERT INTO engagement_participants (engagement_id, participant_dossier_id, participant_type, role, created_by) VALUES (...)` for one person (and resolve the 1 EO person id).
3. Browser: org dossier Engagements tab shows the hosted engagement; person dossier tab shows the participation row; EN+AR; no overflow at 1280/1024.
4. `SELECT get_person_full('<person id>')` → recent_engagements non-empty with the seeded row.
5. Cleanup: revert the UPDATE to NULL; DELETE the seeded participant rows; SELECT-count-0 confirmation; pre-existing participant row untouched.
