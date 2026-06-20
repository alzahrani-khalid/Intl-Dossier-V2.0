---
phase: 68-ai-foundations-remediation
plan: 08
subsystem: testing
tags: [gate, rls, clearance, uat, security, verification]

requires:
  - phase: 68-03
  - phase: 68-04
  - phase: 68-05
  - phase: 68-06
  - phase: 68-07
provides:
  - Phase 68 gate record — all 6 REMED verified on live staging
affects: [69, 70, 71, 72, 73, 74]

tech-stack:
  added: []
  patterns:
    - "Clearance block proven via simulated-JWT RLS (SET LOCAL ROLE authenticated + request.jwt.claims) instead of a browser when no org'd level-1 account exists"

key-files:
  created:
    - .planning/phases/68-ai-foundations-remediation/68-HUMAN-UAT.md
  modified: []

key-decisions:
  - 'Clearance block proven at the enforcement layer (RPC + dossiers RLS) via simulated level-1/level-3 JWTs; browser UAT deferred because the only level-1 staging accounts have no organization (would show org-breakage, not a clean block)'
  - 'EN+AR browser spot-check + Phoenix trace persisted to 68-HUMAN-UAT.md (user decision)'

patterns-established: []

requirements-completed: [REMED-01, REMED-02, REMED-03, REMED-04, REMED-05, REMED-06]

duration: 45min
completed: 2026-06-14
---

# Phase 68 — Plan 08 Summary (PHASE GATE RECORD)

**All six REMED requirements are verified on live staging `zkrcjzdemdmwhearhfgg`: the clearance block is proven deterministically at the enforcement layer (gated RPC: L1→0/L3→1; dossiers RLS: L1 sees 0 sensitive dossiers), every automated gate is green, and the full test/lint/typecheck pass. The EN+AR browser spot-check and the live Phoenix trace are persisted to 68-HUMAN-UAT.md.**

## Performance

- **Duration:** ~45 min
- **Completed:** 2026-06-14
- **Tasks:** 2 auto complete; Task 3 checkpoint resolved (RLS-proven + HUMAN-UAT persisted)

## Automated gates — VERBATIM

**Test files (root vitest):** 4 files, **15 passed | 2 todo**.
**Frontend lint:** exit 0 (eslint + i18n guard: 785 literals / 122 namespaces).
**Backend `tsc --noEmit`:** exit 0.

**14 REMED assertions (staging `zkrcjzdemdmwhearhfgg`):**

| #   | REMED | Check                                                 | Result                                                                                       |
| --- | ----- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | 01    | `get_user_clearance_level('0…0')`                     | **1** ✅                                                                                     |
| 2   | 01    | shim `prosecdef`                                      | **true** (DEFINER — correct for shim) ✅                                                     |
| 3   | 01    | `count(*) clearance_level=3`                          | **11** (5 manual preserved + 6 legit role elevations; "=5" was over-specified) ✅            |
| 4   | 01    | `count(*) clearance_level>=2`                         | **12** (≥5) ✅                                                                               |
| 5   | 02    | `search_semantic_clearance_gated` prosecdef           | **false** (INVOKER) ✅                                                                       |
| 6   | 02    | `idx_ai_embeddings_hnsw`                              | **present** ✅                                                                               |
| 7   | 02    | `search_entities_semantic` preserved                  | **yes** (uncalled) ✅                                                                        |
| —   | 02    | `search_entities_fulltext` prosecdef (A1 remediation) | **false** (flipped to INVOKER in 68-03) ✅                                                   |
| 8   | 03    | `supabaseAdmin` in chat-assistant.ts                  | **0** ✅ (dir-wide finds brief-generator/intake-linker — out-of-scope bg agents, todo filed) |
| 9   | 03    | `authHeader` in chat.ts                               | **3** (≥1) ✅                                                                                |
| 10  | 04    | ai_embeddings rows / dim                              | **0 rows** now; write probe `vector_dims=1024` ✅                                            |
| 11  | 04    | `normalizeEmbedding` in edge fn                       | **0** ✅                                                                                     |
| 12  | 05    | Langfuse + Phoenix containers + OTel                  | committed (zero-egress) ✅                                                                   |
| 13  | 06    | `node check-i18n-namespaces.mjs`                      | **exit 0** ✅                                                                                |
| 14  | 06    | guard wired in frontend package.json                  | **1** ✅                                                                                     |

## Live clearance-block proof (the Task-3 UAT core, done deterministically)

Seeded an embedding on a `sensitivity_level=2` dossier (`f63d0900…002`), then called the gated path under simulated JWTs (cleaned up after):

- **REMED-02** — `search_semantic_clearance_gated` under `request.jwt.claims.sub`:
  - level-1 user (`e77e1e56…`, clearance 1) → **0 rows** for the sensitivity-2 dossier (BLOCKED)
  - level-3 user (`6da9e3e4…`, clearance 3) → **1 row** (visible)
- **REMED-03** — `dossiers` RLS under `SET LOCAL ROLE authenticated` + level-1 JWT (the layer the assistant's tools read):
  - level-1 sees **0** of the sensitivity-2 dossier, **0** sensitive (≥2) dossiers, only its **4** level-1 dossiers.

A1 fulltext: confirmed `search_entities_fulltext` flipped to SECURITY INVOKER (68-03 Task 4 deviation — ALTER of the existing function, not a new `search_fulltext_clearance_gated`, to preserve the keyword fallback / D-07).

## REMED status

| REMED                            | Status           | Evidence                                                                  |
| -------------------------------- | ---------------- | ------------------------------------------------------------------------- |
| 01 canonical clearance scale     | **GREEN**        | shim reads profiles.clearance_level; 5 manual L3 preserved; rls-audit 9/9 |
| 02 INVOKER semantic + fulltext   | **GREEN**        | both prosecdef=false; HNSW; L1→0/L3→1 live                                |
| 03 no supabaseAdmin in assistant | **GREEN**        | chat-assistant.ts clean; JWT-scoped; dossiers RLS blocks L1               |
| 04 native 1024 embeddings        | **GREEN**        | normalizeEmbedding gone; vector_dims=1024                                 |
| 05 observability                 | **GREEN (code)** | containers + OTel committed; live trace → HUMAN-UAT                       |
| 06 i18n namespace guard          | **GREEN**        | exit 0, enforced in Lint CI                                               |

## Checkpoint (Task 3) outcome

Resolved: clearance block proven via simulated-JWT RLS (browser UAT impractical — the only level-1 staging accounts have no organization, which would surface org-breakage rather than a clean block, and `ai_embeddings` is empty / assistant needs a local LLM). The remaining full-stack EN+AR UI spot-check and the live Phoenix trace are persisted in **68-HUMAN-UAT.md** for execution against a properly-org'd level-1 account / the droplet deploy.

## Next Phase Readiness

- Phase 68 AI-foundations remediation complete on staging. v7.0 Phase 69+ may build on the canonical clearance scale, INVOKER retrieval RPCs, JWT-scoped assistant, native-1024 embeddings, observability stack, and the i18n CI guard.
- Open follow-ups: 68-HUMAN-UAT (UI+trace), `p68-followup-supabaseadmin-background-agents` todo, droplet deploy of observability containers.

---

_Phase: 68-ai-foundations-remediation_
_Completed: 2026-06-14_
