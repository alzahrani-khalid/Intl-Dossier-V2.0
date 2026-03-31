---
phase: 12
slug: enriched-dossier-pages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
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

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement               | Test Type   | Automated Command                     | File Exists | Status     |
| -------- | ---- | ---- | ------------------------- | ----------- | ------------------------------------- | ----------- | ---------- |
| 12-01-01 | 01   | 1    | DOSS-01                   | unit        | `pnpm vitest run DossierShell`        | ❌ W0       | ⬜ pending |
| 12-01-02 | 01   | 1    | DOSS-02                   | unit        | `pnpm vitest run DossierTabNav`       | ❌ W0       | ⬜ pending |
| 12-02-01 | 02   | 1    | DOSS-03                   | unit        | `pnpm vitest run RelationshipSidebar` | ❌ W0       | ⬜ pending |
| 12-03-01 | 03   | 2    | DOSS-04, DOSS-05          | unit        | `pnpm vitest run CountryDetail`       | ❌ W0       | ⬜ pending |
| 12-04-01 | 04   | 2    | DOSS-06, DOSS-07          | unit        | `pnpm vitest run ElectedOfficial`     | ❌ W0       | ⬜ pending |
| 12-05-01 | 05   | 3    | DOSS-08, DOSS-09, DOSS-10 | integration | `pnpm vitest run DossierTabs`         | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] Test stubs for DossierShell, DossierTabNav, RelationshipSidebar components
- [ ] Test stubs for ElectedOfficials list and detail pages
- [ ] Shared test fixtures for dossier mock data (all 8 types)

_Existing vitest infrastructure covers framework setup._

---

## Manual-Only Verifications

| Behavior                                | Requirement | Why Manual                                  | Test Instructions                                             |
| --------------------------------------- | ----------- | ------------------------------------------- | ------------------------------------------------------------- |
| RelationshipSidebar mobile sheet/drawer | DOSS-03     | Responsive breakpoint + gesture interaction | Resize browser to <768px, verify sidebar becomes sheet/drawer |
| RTL layout consistency across 8 types   | DOSS-01     | Visual RTL correctness                      | Switch to Arabic, visit each dossier type detail page         |
| react-resizable-panels drag interaction | DOSS-03     | Mouse/touch drag behavior                   | Drag sidebar resize handle, verify panel constraints          |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
