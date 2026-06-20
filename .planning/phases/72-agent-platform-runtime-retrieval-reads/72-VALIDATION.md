---
phase: 72
slug: agent-platform-runtime-retrieval-reads
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-18
---

# Phase 72 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from
> `72-RESEARCH.md` → `## Validation Architecture`. Verification reality (MEMORY): RLS
> denial returns **empty 200s** → force errors via CDP `Network.setBlockedURLs` and assert
> `role="alert"` / empty-state / reduced-counts, **never HTTP status**. Live UAT =
> seed→observe→restore, EN+AR, on staging `zkrcjzdemdmwhearhfgg`. Clearance dist: L1=344,
> L2=23, L3=6.

---

## Test Infrastructure

| Property               | Value                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| **Framework**          | Vitest (unit/integration), Playwright (E2E), @testing-library/react, axe-core (a11y)         |
| **Config file**        | `vitest.config.ts` per workspace; **new `agent-runtime/vitest.config.ts` (Wave 0 installs)** |
| **Quick run command**  | `pnpm --filter agent-runtime test` / `pnpm --filter frontend test`                           |
| **Full suite command** | `pnpm test` (turbo, all workspaces) + `pnpm test:e2e`                                        |
| **Estimated runtime**  | ~90s quick (per-workspace) · full suite + e2e several min                                    |

---

## Sampling Rate

- **After every task commit:** `pnpm --filter <touched-workspace> test` + `tsc --noEmit`
- **After every plan wave:** full `pnpm test` + `pnpm lint` (`--max-warnings 0`; PascalCase filename rule for `components/**`) + i18n namespace-registration guard
- **Before `/gsd:verify-work`:** full suite green **+ the 5 live-staging proofs below (EN+AR)**
- **Max feedback latency:** ~90s (per-workspace quick run)

---

## Per-Requirement Verification Map

> Task IDs are assigned at plan time (planner honors this map as Dimension 8). Every row
> below maps to a `<automated>` verify or a Wave 0 dependency; ❌ W0 = test infra is built
> in Wave 0 (the spike/scaffold wave).

| Req                     | Behavior                                                                              | Test Type                              | Automated Command / Live Proof                                                                                                                                                                                        | File                           |
| ----------------------- | ------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| AGENT-04/05             | `array_length(embedding,1)=1024` for ALL `rag_chunks` rows                            | DB schema proof                        | `SELECT count(*) FROM rag_chunks WHERE vector_dims(embedding) <> 1024` → must be `0`                                                                                                                                  | ❌ W0 (re-embed verify script) |
| AGENT-04                | `hybrid_rag_search` is `SECURITY INVOKER` + RLS on `rag_chunks`                       | DB schema proof                        | `SELECT prosecdef FROM pg_proc WHERE proname='hybrid_rag_search'` → `false`; reuse P68 `get_function_security()`                                                                                                      | ❌ W0                          |
| AGENT-03                | Low-clearance account provably reduced, zero above-clearance, indistinguishable-empty | Integration (impersonation) + live UAT | **Authenticated** L1 vs L3 impersonation (service-role MCP bypasses RLS — P69 landmine); assert L1 result ⊂ L3; serialized payload `not.toMatch(/clearance\|filtered\|restricted/i)` (copy, aria-live, AND JSON keys) | ❌ W0                          |
| AGENT-02                | Copilot answers from gated data under caller JWT (signals/digests/graph/dossiers/RAG) | Integration                            | **Spike gate #1 (#4465):** assert `runtimeContext.get('authorization')` non-empty inside `tool.execute()`; each tool returns RLS-scoped rows                                                                          | ❌ W0                          |
| AGENT-01                | Converse from drawer AND Cmd+K                                                        | E2E (Playwright)                       | Open drawer via FAB → send → assert streamed reply; open via Cmd+K on a dossier → assert context pre-fill                                                                                                             | ❌ W0                          |
| AGENT-06                | EN + AR reply with correct RTL                                                        | E2E + visual                           | Switch AR (`localStorage['id.locale']='ar'` via ع button); assert `dir="rtl"` on drawer + Tajawal + composer/message flip at 1024px & 1400px                                                                          | ❌ W0                          |
| AGENT-03 (forced-error) | RLS denial → neutral empty, not a leak                                                | E2E (CDP)                              | `Network.setBlockedURLs` the RAG/tool call; wait through TanStack retries; assert `role="alert"` / neutral no-answer copy (DOM assertions, screenshot can wedge)                                                      | ❌ W0                          |
| INFRA-01                | vLLM Gemma 4 12B over `/v1`, config-swappable                                         | Smoke                                  | `curl http://vllm:8000/v1/models` → `gemma-4-12b`; a chat+tool round-trip succeeds                                                                                                                                    | ❌ W0                          |
| INFRA-02                | TEI bge-m3 + bge-reranker-v2-m3 local                                                 | Smoke                                  | `curl TEI_EMBED_URL/embed` → 1024-dim; `curl TEI_RERANK_URL/rerank` → scores                                                                                                                                          | ❌ W0                          |
| INFRA-03                | agent-runtime on distinct port (4100) in compose, reachable, full chat turn           | Smoke (staging)                        | `docker compose ps agent-runtime` healthy on 4100; POST a chat turn via nginx → SSE reply                                                                                                                             | ❌ W0                          |
| D-08                    | Threads user-private (own only)                                                       | Integration                            | User A creates thread; User B `SELECT` on `mastra_threads` returns 0 of A's rows (RLS owner-only)                                                                                                                     | ❌ W0                          |

_Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `agent-runtime/vitest.config.ts` + test scaffold — new workspace has no test infra
- [ ] `agent-runtime/src/mastra/tools/*.test.ts` — per-tool JWT-scoping + indistinguishable-empty assertions
- [ ] Re-embed verification script — `rag_chunks` dimension + row-coverage check (AGENT-05)
- [ ] DB schema-proof tests — `prosecdef` + RLS-policy-form assertions (reuse P68 `get_function_security`)
- [ ] Playwright copilot E2E — drawer / Cmd+K / EN+AR / forced-error (CDP) flows
- [ ] `frontend/src/i18n/en/copilot.json` + `ar/copilot.json` + registry entry in `i18n/index.ts`
- [ ] **Spike harness (throwaway)** proving JWT-reaches-tools (#4465) + CopilotKit RTL/token fidelity (D-09)

---

## Manual-Only Verifications (the milestone phase-gate live proofs, EN+AR on staging)

| Behavior                  | Requirement | Why Manual                                                                                 | Test Instructions                                                                                                              |
| ------------------------- | ----------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Clearance-reduction proof | AGENT-03    | Needs authenticated impersonation across real clearance levels; RLS denial is an empty 200 | L1 vs L3 through the copilot: L1 strictly reduced, zero above-clearance, no forbidden substring anywhere (copy/aria-live/JSON) |
| EN+AR RTL render proof    | AGENT-06    | Visual RTL/Tajawal/flip correctness across breakpoints                                     | Both languages, `dir="rtl"` + Tajawal, message/composer/citation flipped, at 1024px & 1400px                                   |
| End-to-end staging smoke  | INFRA-03    | Requires the live vLLM+TEI infra track + nginx routing                                     | `agent-runtime` on 4100 processes a chat turn (drawer + Cmd+K), reading gated data under the caller JWT                        |

> The `array_length=1024` proof (AGENT-05) and `SECURITY INVOKER`+RLS proof (AGENT-04) are
> DB-schema assertions and may run automated via the MCP/SQL, but are re-confirmed live at the gate.
> **Seed dependency:** signals / events / briefs / documents are 0 rows on staging — the
> AGENT-05 and AGENT-03 proofs require seeded rows in the seed→observe→restore step.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
