---
phase: 71-analytic-graph
status: passed
verified: '2026-06-17'
requirements: [GRAPH-01, GRAPH-02, GRAPH-03, GRAPH-04]
must_haves_verified: 5
must_haves_total: 5
score: 4/4 success criteria
---

# Phase 71 — Analytic Graph: Verification

**Goal:** Analysts and the agent can run clearance-aware analytic graph queries (who-sits-on-which-forum, shared committees, engagement chains) from the Network panel and Cmd+K.

**Verdict: PASSED** — all 4 ROADMAP success criteria are met, verified against the live codebase, the live staging deployment, GREEN automated tests, and a live UAT. The clearance gate is proven from three independent angles (integration counts, direct invocation, live UI reduction).

## Success criteria

### Criterion 1 (GRAPH-01) — Network-panel analytic query → result. PASSED

- `query_graph` RPC live on staging (migration history: `20260617093831 phase71_query_graph` + `…095104 …_fix_indistinguishable_empty`); `SECURITY INVOKER` (3×), `profiles.user_id = auth.uid()` clearance read (4×), inline `sensitivity_level <= v_clearance` at every join.
- `useAnalyticGraph.ts` + `AnalyticQueryPicker.tsx` + `AnalyticResultView.tsx` + Analyze mode in `RelationshipGraphPage.tsx` (all present); route schema extended in `graph.tsx`.
- `query-graph.integration.test.ts` GREEN (4 tests) against live staging; live UAT showed the panel rendering the seeded forum on a pre-filled entity. REQUIREMENTS.md: GRAPH-01 Complete.

### Criterion 2 (GRAPH-02) — Cmd+K launch with clearance-gated results EN+AR. PASSED

- `analyze-commands.ts` (`getAnalyzeCommandActions(pathname)`) wires 4 `cmd-analyze-*` entries into `CommandPalette.tsx`, context-ranked to dossier routes; `DossierAnalyzeButton.tsx` (.btn-ghost) provides the third entry point.
- `CommandPalette.analyze.test.tsx` GREEN (3 tests). Live UAT (Saudi Arabia dossier route): all 4 "Analyze:" entries surfaced; selecting one deep-linked to `/relationships/graph?dossierId=…&mode=analyze&query=forum_membership` with the dossier entity pre-filled. Confirmed EN + AR (dir=rtl, h1 "تحليل", result by Arabic name).
- NOTE: REQUIREMENTS.md still lists GRAPH-02 as Pending — it is DELIVERED here; traceability flip handled by `phase.complete`.

### Criterion 3 (GRAPH-03) — strictly-reduced result set at lower clearance. PASSED

- `query-graph.clearance.integration.test.ts` GREEN (2 tests): strictly-increasing node/edge counts clearance-1 < clearance-4, AND the serialized payload matches no `/clearance|filtered|restricted/i` (indistinguishable-empty, D-09). `stats.clearance_level` was removed from the RPC for exactly this contract (0 keys remain).
- Live UAT: the admin at clearance 3 saw the sens-3 forum; lowered to clearance 1, the forum vanished silently into a neutral empty-state with zero clearance-revealing copy (EN+AR). i18n carries no clearance/filtered/restricted strings. REQUIREMENTS.md: GRAPH-03 Complete.

### Criterion 4 (GRAPH-04) — agent `query_graph` tool, SECURITY INVOKER, clearance-correct under caller JWT. PASSED

- Migration is `SECURITY INVOKER`, `REVOKE EXECUTE … FROM PUBLIC, anon` + `GRANT … TO authenticated` (anon EXECUTE denied / authenticated granted, confirmed live). `analytic-graph` edge fn forwards the caller JWT (anon key + `getUser(token)`), never service-role (0 service_role refs in the fn).
- `query-graph.invoker.integration.test.ts` GREEN (2 tests): direct `.rpc('query_graph')` under a clearance-1 JWT returns zero above-clearance nodes; the sens-3 node appears under clearance-3 (gate is real enforcement, not empty data). This is the exact P72 agent-tool path.
- NOTE: REQUIREMENTS.md still lists GRAPH-04 as Pending — DELIVERED here; traceability flip handled by `phase.complete`.

## Plans / artifacts

- 5/5 plans have SUMMARY.md; 6/6 contract tests present and GREEN (3 backend integration + 3 FE); migration + edge fn live on staging.
- Service_role max-clearance bypass in the RPC is gated to `auth.role()='service_role'` (trusted-backend only; anon/authenticated take the strict `profiles.clearance_level` path) — reviewed and sound; the GRAPH-03/04 dual-account proofs use real anon-key sign-in, so the bypass does not weaken the live gate.

## Notes / out-of-scope (not gaps)

- `frontend/src/pages/relationships/__tests__/RelationshipGraphPage.test.tsx` fails to load (its local `vi.mock('react-i18next')` omits `initReactI18next`). Pre-existing Phase 63 debt — its only commit is `c8bf07b2` ("test(63-02): add failing relationship graph page contract"); no Phase 71 commit touched it; never green; not one of Phase 71's 6 contract tests. Not a Phase 71 regression.
- Schema-drift gate flagged the migration as "unpushed" — false positive: it only recognizes a CLI `supabase db push`, but the migration was applied (and verified live) via Supabase MCP `apply_migration`. Both migrations appear in the staging migration history.
- REQUIREMENTS.md traceability for GRAPH-02 and GRAPH-04 should flip from Pending → Complete (delivered + UAT-verified this phase).
