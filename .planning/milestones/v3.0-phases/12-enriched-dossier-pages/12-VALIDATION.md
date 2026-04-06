---
phase: 12
slug: enriched-dossier-pages
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-31
updated: 2026-03-31
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                               |
| ---------------------- | --------------------------------------------------- |
| **Framework**          | vitest + @testing-library/react                     |
| **Config file**        | `frontend/vitest.config.ts`                         |
| **Quick run command**  | `cd frontend && pnpm vitest run --reporter=verbose` |
| **Full suite command** | `cd frontend && pnpm vitest run && pnpm typecheck`  |
| **Estimated runtime**  | ~30 seconds                                         |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && pnpm vitest run --reporter=verbose`
- **After every plan wave:** Run `cd frontend && pnpm vitest run && pnpm typecheck`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Wave 0 — Test Stubs (Plan 01, Task 0)

Created in Plan 01 Task 0 as `.todo()` stubs (pending, not failing):

| Stub File                         | Component                | Location                                               |
| --------------------------------- | ------------------------ | ------------------------------------------------------ |
| DossierShell.test.tsx             | DossierShell             | `frontend/src/components/dossier/__tests__/`           |
| DossierTabNav.test.tsx            | DossierTabNav            | `frontend/src/components/dossier/__tests__/`           |
| RelationshipSidebar.test.tsx      | RelationshipSidebar      | `frontend/src/components/dossier/__tests__/`           |
| ElectedOfficialListTable.test.tsx | ElectedOfficialListTable | `frontend/src/components/elected-officials/__tests__/` |

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement               | Test Type   | Automated Command                     | File Exists | Status     |
| -------- | ---- | ---- | ------------------------- | ----------- | ------------------------------------- | ----------- | ---------- |
| 12-01-00 | 01   | 1    | (Wave 0)                  | stubs       | `pnpm vitest run --reporter=verbose`  | Yes (W0)    | ⬜ pending |
| 12-01-01 | 01   | 1    | DOSS-01                   | unit        | `pnpm vitest run DossierShell`        | Yes (W0)    | ⬜ pending |
| 12-01-02 | 01   | 1    | DOSS-02                   | unit        | `pnpm vitest run DossierTabNav`       | Yes (W0)    | ⬜ pending |
| 12-01-03 | 01   | 1    | DOSS-02                   | unit        | `pnpm vitest run RelationshipSidebar` | Yes (W0)    | ⬜ pending |
| 12-02-01 | 02   | 2    | DOSS-01, DOSS-10          | typecheck   | `pnpm typecheck`                      | N/A         | ⬜ pending |
| 12-03-01 | 03   | 2    | DOSS-08                   | typecheck   | `pnpm typecheck`                      | N/A         | ⬜ pending |
| 12-04-01 | 04   | 3    | DOSS-03, DOSS-04, DOSS-05 | unit        | `pnpm vitest run --reporter=verbose`  | N/A         | ⬜ pending |
| 12-05-01 | 05   | 3    | DOSS-06, DOSS-07, DOSS-08 | integration | `pnpm typecheck && pnpm vitest run`   | N/A         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Schema Validation Note

**CRITICAL:** The `elected_officials` table does NOT exist. It was dropped in migration `20260202000002_drop_elected_officials_table.sql`. Elected officials are rows in the `persons` table with `person_subtype = 'elected_official'`. All backend APIs must query `persons` with this filter, NOT join a non-existent `elected_officials` table.

---

## Manual-Only Verifications

| Behavior                                | Requirement | Why Manual                                  | Test Instructions                                              |
| --------------------------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------- |
| RelationshipSidebar mobile sheet/drawer | DOSS-02     | Responsive breakpoint + gesture interaction | Resize browser to <1024px, verify sidebar becomes sheet/drawer |
| RTL layout consistency across 8 types   | DOSS-01     | Visual RTL correctness                      | Switch to Arabic, visit each dossier type detail page          |
| Sidebar collapse/expand animation       | DOSS-02     | Visual animation timing                     | Click toggle button, verify smooth width transition            |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
