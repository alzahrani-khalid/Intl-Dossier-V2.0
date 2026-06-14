---
phase: 68
slug: ai-foundations-remediation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-14
---

# Phase 68 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `68-RESEARCH.md` § Validation Architecture (RF-1..RF-4 closed live).

---

## Test Infrastructure

| Property               | Value                                                                          |
| ---------------------- | ------------------------------------------------------------------------------ |
| **Framework**          | Vitest (unit + integration), Playwright (E2E), SQL assertions via Supabase MCP |
| **Config file**        | `vitest.config.ts` / `playwright.config.ts` (exist)                            |
| **Quick run command**  | `pnpm --filter backend test --run`                                             |
| **Full suite command** | `pnpm test`                                                                    |
| **Estimated runtime**  | ~90 seconds (backend) / full suite longer                                      |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter backend test --run`
- **After every plan wave:** Run `pnpm test` (full suite)
- **Before `/gsd:verify-work`:** Full suite green **+ live UAT on staging** (REMED-01 clearance block, REMED-02 search block, REMED-03 assistant block) — EN+AR
- **Max feedback latency:** ~90 seconds

---

## Per-Task Verification Map

Task IDs are assigned by the planner; rows below are requirement-level until plans exist.
Threat refs map to `68-RESEARCH.md` § Security Domain (STRIDE table).

| Req      | Behavior                                                                    | Threat Ref    | Secure Behavior                                  | Test Type                      | Automated Command                                                                           | File Exists | Status     |
| -------- | --------------------------------------------------------------------------- | ------------- | ------------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------- | ----------- | ---------- |
| REMED-01 | `get_user_clearance_level()` returns `profiles.clearance_level` (1–4)       | —             | Single canonical scale; no role-derived widening | integration                    | extend `tests/security/rls-audit.test.ts`                                                   | ✅ exists   | ⬜ pending |
| REMED-01 | Level-1 user cannot SELECT level-2 dossier                                  | T-EoP-AC      | RLS `sensitivity_level <= clearance_level`       | integration                    | extend `tests/security/rls-audit.test.ts`                                                   | ✅ exists   | ⬜ pending |
| REMED-02 | New clearance-gated semantic RPC is `SECURITY INVOKER`                      | T-EoP-DEFINER | `prosecdef = false`                              | integration                    | `SELECT prosecdef FROM pg_proc WHERE proname='search_entities_semantic_v2'` → false         | ❌ Wave 0   | ⬜ pending |
| REMED-02 | Low-clearance JWT returns 0 semantic results for above-clearance content    | T-EoP-AC      | RLS-honored retrieval under caller JWT           | integration (live UAT staging) | seed above-clearance row in `ai_embeddings`; assert empty via edge fn                       | ❌ Wave 0   | ⬜ pending |
| REMED-03 | `chat-assistant.ts` imports no `supabaseAdmin`                              | T-EoP-SR      | All assistant DB reads under caller JWT          | unit/lint                      | `grep -r 'supabaseAdmin' backend/src/ai/agents/` exits 1                                    | ❌ Wave 0   | ⬜ pending |
| REMED-03 | Low-clearance chat gets indistinguishable-empty for above-clearance content | T-ID-EMPTY    | D-09 generic "no results"; no leakage            | integration (live UAT)         | manual staging test EN+AR                                                                   | manual      | ⬜ pending |
| REMED-04 | New writes to `ai_embeddings` have `array_length(embedding,1) = 1024`       | T-Tamper-DIM  | No pad/truncate corruption                       | integration                    | `SELECT array_length(embedding,1) FROM ai_embeddings` = 1024                                | ❌ Wave 0   | ⬜ pending |
| REMED-05 | Phoenix container responds; Langfuse trace captured                         | —             | Self-hosted, zero egress                         | smoke                          | `curl http://localhost:6006` exits 0; one chat → trace in Langfuse UI                       | ❌ Wave 0   | ⬜ pending |
| REMED-06 | Lint fails on unregistered i18n namespace                                   | —             | Silent-English-fallback guard                    | unit                           | `node scripts/check-i18n-namespaces.mjs` exits 1 on new `useTranslation('unregistered-ns')` | ❌ Wave 0   | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `tests/security/rls-audit.test.ts` — extend `sensitiveTables` + canonical-scale clearance assertion (REMED-01)
- [ ] `tests/integration/search-clearance.test.ts` — covers REMED-02 new `SECURITY INVOKER` RPC
- [ ] `tests/integration/chat-assistant-rls.test.ts` — covers REMED-03 no-`supabaseAdmin` + indistinguishable-empty
- [ ] `tests/integration/embedding-dimension.test.ts` — covers REMED-04 native-1024 write (`array_length = 1024`)
- [ ] `scripts/check-i18n-namespaces.mjs` — covers REMED-06 (incl. array-form `useTranslation([...])`)

---

## Manual-Only Verifications

| Behavior                                                                    | Requirement | Why Manual                                                             | Test Instructions                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Low-clearance account sees zero above-clearance content via assistant       | REMED-03    | Live RLS denial returns empty `200`; needs seeded staging data + EN+AR | Seed above-clearance dossier; sign in as level-1 user; ask assistant; assert generic "no results", no leakage (D-09). Use CDP `Network.setBlockedURLs` forced-error protocol; assert `role="alert"`/empty-state, not HTTP status |
| Low-clearance account sees zero above-clearance results via semantic search | REMED-02    | Same — live staging RLS, EN+AR                                         | Block account, run search, confirm zero above-clearance results returned                                                                                                                                                         |
| One end-to-end AI request traceable in Langfuse/Phoenix, zero egress        | REMED-05    | Requires deployed containers + visual trace confirmation               | Run one chat; open Langfuse/Phoenix UI; assert trace (prompt→model→response); confirm no external telemetry network egress                                                                                                       |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
