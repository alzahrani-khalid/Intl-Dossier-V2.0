---
phase: 71
slug: analytic-graph
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-17
---

# Phase 71 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `71-RESEARCH.md` → `## Validation Architecture`. Per-task rows in the
> verification map are finalized once `*-PLAN.md` files exist (task IDs assigned by the planner);
> the requirement-level map below is the binding contract.

---

## Test Infrastructure

| Property               | Value                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest (unit/integration) + Playwright (E2E) + axe-core (a11y)                                  |
| **Config file**        | `frontend/vitest.config.ts`; backend integration under `backend/tests/`                         |
| **Quick run command**  | `pnpm --filter intake-frontend test -- --run <single test file>`                                |
| **Full suite command** | `pnpm test` (Vitest) + targeted `pnpm --filter backend test -- query-graph.integration.test.ts` |
| **Estimated runtime**  | quick file ~<30s; full suite ~1–2 min                                                           |

---

## Sampling Rate

- **After every task commit:** Run the relevant single test file (`--run` Vitest, <30s)
- **After every plan wave:** Run the full Vitest suite + the `query-graph.*.integration.test.ts` set
- **Before `/gsd:verify-work`:** Full suite must be green **and** the live UAT below must pass
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map (requirement-level — task IDs assigned at planning)

| Req ID   | Wave | Secure Behavior                                                                                                  | Test Type                           | Automated Command                                                         | File Exists      |
| -------- | ---- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------- | ---------------- |
| GRAPH-01 | 2    | `query_graph('forum_membership'/'shared_committees'/'engagement_chain', …)` returns expected rows on seeded data | integration (RPC)                   | `pnpm --filter backend test -- query-graph.integration.test.ts`           | ❌ W0            |
| GRAPH-01 | 3    | "Analyze" picker renders + runs from the Network panel                                                           | unit + E2E                          | `pnpm --filter intake-frontend test -- AnalyticQueryPicker.test.tsx`      | ❌ W0            |
| GRAPH-02 | 3    | Cmd+K "Analyze:" entry pre-fills entity from current dossier + shows inline result                               | unit                                | `pnpm --filter intake-frontend test -- CommandPalette.analyze.test.tsx`   | ❌ W0            |
| GRAPH-03 | 2    | Two clearance levels → strictly different node/edge counts for the same query; indistinguishable-empty on denial | integration (RLS, dual-account)     | `pnpm --filter backend test -- query-graph.clearance.integration.test.ts` | ❌ W0 + live UAT |
| GRAPH-04 | 2    | `query_graph` under a low-clearance JWT returns zero above-clearance nodes (`SECURITY INVOKER`, caller JWT)      | integration (direct RPC invocation) | `pnpm --filter backend test -- query-graph.invoker.integration.test.ts`   | ❌ W0 + live UAT |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · W0 = created in Wave 0_

---

## Wave 0 Requirements

- [ ] `backend/tests/intelligence/query-graph.integration.test.ts` — GRAPH-01 (model on `generate-digest.integration.test.ts`)
- [ ] `backend/tests/intelligence/query-graph.clearance.integration.test.ts` — GRAPH-03 (dual-account; two clearance-level service tokens / impersonation)
- [ ] `backend/tests/intelligence/query-graph.invoker.integration.test.ts` — GRAPH-04 (direct RPC under caller JWT)
- [ ] `frontend/src/components/relationships/__tests__/AnalyticQueryPicker.test.tsx`, `AnalyticResultView.test.tsx`
- [ ] `frontend/src/components/keyboard-shortcuts/__tests__/CommandPalette.analyze.test.tsx`
- [ ] RF-7 seed/restore fixture (high-sensitivity forum-membership edge + engagement + WG member) — shared by the clearance tests and the live UAT

---

## Manual-Only Verifications (live UAT — the load-bearing verification)

| Behavior                                                                                         | Requirement | Why Manual                                  | Test Instructions                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run "who-sits-on-which-forum" from Network panel AND Cmd+K → non-empty result, EN+AR             | GRAPH-01/02 | Live seeded staging + bilingual render      | From a seeded country/org dossier, run from the Network panel "Analyze" mode and via Cmd+K ("Analyze: …"); both return a non-empty result in EN and AR                                                                                                                                                                                                                                                                                                                     |
| Clearance reduction — strictly increasing node/edge counts with clearance; no "filtered" message | GRAPH-03    | Dual-account, live RLS, CDP forced-error    | Seed a sensitivity-3 forum-membership edge + sensitivity-4 engagement off a low-sensitivity anchor; run the **identical** query as clearance-1, clearance-3, clearance-4 accounts; assert **strictly increasing** counts; assert NO "filtered by clearance" copy anywhere (indistinguishable-empty). Verify RLS-denied path via CDP `Network.setBlockedURLs` (denial returns empty `200`s — assert `role="alert"`/empty-state + reduced counts, not HTTP status). Restore. |
| `query_graph` direct invocation — zero above-clearance nodes under low-clearance JWT             | GRAPH-04    | Agent-tool contract; caller-JWT enforcement | Invoke `query_graph` directly (`/rest/v1/rpc/query_graph` or `supabase.rpc`) under a **low-clearance** JWT for a query whose full result includes an above-clearance node; assert returned JSONB contains **zero** above-clearance nodes. Repeat under a high-clearance JWT to confirm the node appears (proves the gate is real, not just empty data).                                                                                                                    |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (6 files above)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
