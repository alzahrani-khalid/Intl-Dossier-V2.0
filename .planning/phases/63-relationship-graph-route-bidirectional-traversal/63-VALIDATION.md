---
phase: 63
slug: relationship-graph-route-bidirectional-traversal
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-12
---

# Phase 63 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                        |
| ---------------------- | ---------------------------------------------------------------------------- |
| **Framework**          | Vitest (jsdom, `setupFiles: ./tests/setup.ts`, include `**/*.test.{ts,tsx}`) |
| **Config file**        | `frontend/vitest.config.ts`                                                  |
| **Quick run command**  | `cd frontend && pnpm vitest run src/pages/relationships`                     |
| **Full suite command** | `cd frontend && pnpm vitest run` (plus `pnpm type-check`)                    |
| **Estimated runtime**  | ~60 seconds (quick), several minutes (full)                                  |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && pnpm vitest run src/pages/relationships && pnpm type-check` (pre-commit hook also runs `pnpm build`)
- **After every plan wave:** Run `cd frontend && pnpm vitest run` + `pnpm exec size-limit`
- **Before `/gsd:verify-work`:** Full suite green + the two staging curl probes return bidirectional results + D-09 click-through complete
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID             | Plan     | Wave | Requirement     | Threat Ref | Secure Behavior                                                                | Test Type                         | Automated Command                                                                                 | File Exists                 | Status     |
| ------------------- | -------- | ---- | --------------- | ---------- | ------------------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------- | ---------- |
| 63-02 T1/T3         | 63-02    | 1    | GRAPH-01        | T-63-05    | Route renders page (no redirect); no-dossier alert has `/dossiers` link        | unit                              | `cd frontend && pnpm vitest run src/pages/relationships/__tests__/RelationshipGraphPage.test.tsx` | ❌ W0 (created by 63-02 T1) | ⬜ pending |
| 63-02 T1 c3         | 63-02    | 1    | GRAPH-01        | —          | AR mode renders `graph.json` AR strings (namespace fix regression guard)       | unit                              | same file, `i18n.changeLanguage('ar')` case                                                       | ❌ W0 (created by 63-02 T1) | ⬜ pending |
| 63-01 T2 / 63-04 T2 | 63-01/04 | 1/2  | GRAPH-02        | T-63-01    | RPC returns incoming + outgoing                                                | manual (live staging probe)       | curl probe (see RESEARCH.md Code Examples)                                                        | n/a                         | ⬜ pending |
| 63-03 T1            | 63-03    | 1    | GRAPH-02 / D-04 | T-63-08    | Edge orientation: `direction_path 'incoming'` swaps source/target              | unit on extracted pure transform  | `cd frontend && pnpm vitest run src/pages/relationships/__tests__/edge-orientation.test.ts`       | ❌ W0 (created by 63-03 T1) | ⬜ pending |
| 63-03 T2            | 63-03    | 1    | GRAPH-03        | —          | `handleNodeSelect` produces `/dossiers/<segment>/<id>` for each of the 8 types | unit (via `getDossierDetailPath`) | `cd frontend && pnpm vitest run src/lib/dossier-routes.test.ts`                                   | ❌ W0 (created by 63-03 T2) | ⬜ pending |
| 63-05 T2            | 63-05    | 3    | D-09            | T-63-16    | All-types live click-through on staging                                        | manual-only                       | browser walkthrough checklist                                                                     | n/a                         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_
_Task IDs filled by planner — map rows to concrete plan tasks._

---

## Wave 0 Requirements

- [ ] `frontend/src/pages/relationships/__tests__/RelationshipGraphPage.test.tsx` — stubs for GRAPH-01 (render, no-dossier link, AR strings)
- [ ] Edge-orientation unit test (pure transform mirroring the edge-fn logic) — covers GRAPH-02/D-04 client side
- [ ] Per-type path test for node-click — covers GRAPH-03
- Framework install: none needed (Vitest configured; `CountriesListPage.test.tsx` is the existing page-test pattern to copy)

---

## Manual-Only Verifications

| Behavior                                        | Requirement | Why Manual                                                | Test Instructions                                                                                                        |
| ----------------------------------------------- | ----------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| RPC returns incoming + outgoing on live staging | GRAPH-02    | SQL function not unit-testable in jsdom; requires live DB | curl probes documented in RESEARCH.md Code Examples (legacy vs bidirectional anchor dossier)                             |
| All-types live click-through                    | D-09        | Live seeded data + visual navigation (Phase 62 precedent) | Seed relationships covering all 7 reachable dossier types; click each node type; confirm `/dossiers/<segment>/$id` loads |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (live-DB/browser tasks are justified manual rows with documented probes)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (63-02 T1, 63-03 T1, 63-03 T2 — all wave 1)
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planner, 2026-06-12 (plan set 63-01..63-05)
