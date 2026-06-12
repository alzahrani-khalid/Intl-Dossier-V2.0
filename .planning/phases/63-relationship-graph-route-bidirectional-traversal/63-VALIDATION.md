---
phase: 63
slug: relationship-graph-route-bidirectional-traversal
status: draft
nyquist_compliant: false
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

| Task ID | Plan | Wave | Requirement     | Threat Ref | Secure Behavior                                                                | Test Type                         | Automated Command                                                                                 | File Exists | Status     |
| ------- | ---- | ---- | --------------- | ---------- | ------------------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| TBD     | TBD  | TBD  | GRAPH-01        | —          | Route renders page (no redirect); no-dossier alert has `/dossiers` link        | unit                              | `cd frontend && pnpm vitest run src/pages/relationships/__tests__/RelationshipGraphPage.test.tsx` | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | GRAPH-01        | —          | AR mode renders `graph.json` AR strings (namespace fix regression guard)       | unit                              | same file, `i18n.changeLanguage('ar')` case                                                       | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | GRAPH-02        | —          | RPC returns incoming + outgoing                                                | manual (live staging probe)       | curl probe (see RESEARCH.md Code Examples)                                                        | n/a         | ⬜ pending |
| TBD     | TBD  | TBD  | GRAPH-02 / D-04 | —          | Edge orientation: `direction_path 'incoming'` swaps source/target              | unit on extracted pure transform  | `cd frontend && pnpm vitest run src/pages/relationships/__tests__/edge-orientation.test.ts`       | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | GRAPH-03        | —          | `handleNodeSelect` produces `/dossiers/<segment>/<id>` for each of the 8 types | unit (via `getDossierDetailPath`) | `cd frontend && pnpm vitest run src/lib`                                                          | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | D-09            | —          | All-types live click-through on staging                                        | manual-only                       | browser walkthrough checklist                                                                     | n/a         | ⬜ pending |

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
