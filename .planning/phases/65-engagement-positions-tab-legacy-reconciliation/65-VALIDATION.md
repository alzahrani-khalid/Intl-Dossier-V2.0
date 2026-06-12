---
phase: 65
slug: engagement-positions-tab-legacy-reconciliation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-12
---

# Phase 65 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source of truth: `65-RESEARCH.md` §Validation Architecture (including Wave-0 Diagnostic Answers).

---

## Test Infrastructure

| Property               | Value                                                                         |
| ---------------------- | ----------------------------------------------------------------------------- |
| **Framework**          | Vitest + @testing-library/react (jsdom, `setupFiles: ./tests/setup.ts`)       |
| **Config file**        | `frontend/vitest.config.ts` (existing)                                        |
| **Quick run command**  | `cd frontend && pnpm exec vitest run src/components/positions/__tests__/`     |
| **Full suite command** | `cd frontend && pnpm exec vitest run` (1,283 pass / 0 fail at Phase 64 close) |
| **Estimated runtime**  | quick ~5 s · full ~20-25 s local                                              |

---

## Sampling Rate

- **After every task commit:** quick run command + `cd frontend && pnpm type-check`
- **After every plan wave:** full suite + `pnpm exec size-limit` (grep whole log for `exceeded` — zero matches required)
- **Before `/gsd:verify-work`:** full suite green + live staging verification (protocol below)
- **Max feedback latency:** ~120 s

---

## Per-Requirement Verification Map

| Req ID    | Behavior                                                                                                                     | Test Type                | Automated Command                                                                         | File Exists | Status     |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------- | ----------- | ---------- |
| ENGPOS-01 | New route renders `DossierPositionsTab` with `dossierId = engagementId`; `WORKSPACE_TABS` has `positions` entry              | unit (RTL, mocked hooks) | `pnpm exec vitest run src/components/positions/__tests__/EngagementPositionsTab.test.tsx` | ❌ W0       | ⬜ pending |
| ENGPOS-01 | `tabs.positions` key parity in en + ar workspace bundles                                                                     | unit (JSON parity)       | same file                                                                                 | ❌ W0       | ⬜ pending |
| ENGPOS-02 | `onAttach` persists via `createPositionDossierLink`, invalidates `['dossier-position-links', engagementId]`, partial → toast | unit (mock repo + spy)   | same file                                                                                 | ❌ W0       | ⬜ pending |
| ENGPOS-03 | Re-enabled CTAs open dialogs with engagement-typed `DossierContextForAction`; removed CTAs absent                            | unit per touched tab     | `pnpm exec vitest run src/pages/engagements/workspace/__tests__/`                         | ❌ W0       | ⬜ pending |
| ENGPOS-03 | TaskDialog submit posts task WITHOUT `engagement_id` (legacy FK) and links via `work_item_dossiers`                          | unit (mock capture)      | same                                                                                      | ❌ W0       | ⬜ pending |
| ENGPOS-02 | Live: attach on staging → `position_dossier_links` row with `dossier_id = <engagement id>`; tab re-renders without reload    | manual-only (live RLS)   | — (agent-browser + Supabase MCP protocol below)                                           | —           | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `frontend/src/components/positions/__tests__/EngagementPositionsTab.test.tsx` — ENGPOS-01/-02 unit rows (mirror NewPositionDialog.test.tsx patterns)
- [ ] `frontend/src/pages/engagements/workspace/__tests__/` — CTA disposition tests (no workspace tab tests exist today)
- [x] Staging diagnostics Q1-Q3 — ANSWERED 2026-06-12 (see RESEARCH §Wave-0 Diagnostic Answers): all 3 canonical engagement ids dual-exist in legacy `engagements` (kanban renders empty, not 404); 2 published positions for attach supply; UAT target `b0000002-0000-0000-0000-000000000001` "Bilateral consultation — ESCWA" (sensitivity 2 ≤ clearance 3)
- Framework install: none — existing Vitest covers all phase requirements

---

## Manual-Only Verifications

| Behavior                                    | Requirement | Why Manual                                          | Test Instructions                             |
| ------------------------------------------- | ----------- | --------------------------------------------------- | --------------------------------------------- |
| Attach persists + renders without reload    | ENGPOS-02   | Live RLS + TanStack cache behavior (milestone norm) | Live protocol steps 2-3 below                 |
| Create-new from engagement tab              | ENGPOS-02   | Live RLS                                            | Step 4 (64-06 matrix shape)                   |
| CTA functional pass (write AND render path) | ENGPOS-03   | Cross-plane render-surface mismatches               | Step 5                                        |
| AR/RTL + widths                             | ENGPOS-01   | Visual                                              | Step 6 (1280/1024, dir=rtl, Arabic tab label) |

### Live verification protocol (mirrors 64-06)

1. Wave-0 target: engagement dossier `b0000002-0000-0000-0000-000000000001` (ESCWA, sensitivity 2; clearance 3 passes).
2. agent-browser: login (creds via `.env.test` env vars, never recorded) → engagement workspace positions tab → tab visible, list renders.
3. Attach-existing: select a published position → toast → card renders WITHOUT reload → MCP verify `position_dossier_links` row.
4. Create-new: NewPositionDialog flow → verify position + `applies_to` link rows.
5. CTA pass: every formerly-disabled button gone OR functional (task row + `work_item_dossiers` row; `calendar_entries` row rendering in-tab).
6. AR/RTL: topbar `ع` → Arabic tab label, `dir=rtl`, no overflow at 1280/1024.
7. Cleanup in dependency order → SELECT-count-0 confirmation; re-confirm `engagement_positions` still 0 rows before any deletion commit.
