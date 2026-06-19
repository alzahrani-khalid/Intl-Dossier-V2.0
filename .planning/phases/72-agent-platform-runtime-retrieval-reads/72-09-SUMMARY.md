---
phase: 72-agent-platform-runtime-retrieval-reads
plan: 09
subsystem: testing
tags: [uat, clearance-rls, supabase, seed, rag, copilot, bge-m3, intelligence-event]

# Dependency graph
requires:
  - phase: 72-03/72-04
    provides: rag_chunks halfvec(1024) store + clearance RLS + sync trigger + hybrid_rag_search INVOKER
  - phase: 72-05/72-06
    provides: agent-runtime on :4100 + reads-only tool roster (read_signals, hybrid_rag_search) under caller JWT
  - phase: 72-08
    provides: copilot drawer + Cmd+K, indistinguishable-empty copy, EN/AR RTL theme
  - phase: 69
    provides: intelligence_event sensitivity_level INTEGER + clearance RLS + read_signals RPC
provides:
  - '72-UAT.md — the 5 phase-gate proof skeleton (clearance-reduction, EN+AR RTL, dims=1024, INVOKER+RLS, e2e) + INFRA smokes, each tagged ORCHESTRATOR-MCP / DEPLOY-GATED / AUTH-GATED'
  - 'supabase/seeds/72-copilot-uat-seed.sql — multi-clearance signal seed (2x L1, 1x L3) + restore, for AGENT-03/05'
  - 'explicit deploy-gate manifest for the remaining live proofs'
affects: [72-verify-work, 73, 74, milestone-v7.0-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'seed -> observe -> RESTORE with fixed recorded UUIDs (72090000-) for exact teardown'
    - 'tenant-correct seeding via tenant_isolation.resolve_user_tenant (dossiers carry no organization_id)'
    - 'UAT proof tagging: ORCHESTRATOR-MCP vs DEPLOY-GATED vs AUTH-GATED to split runnable-now from deploy-gated'

key-files:
  created:
    - supabase/seeds/72-copilot-uat-seed.sql
    - .planning/phases/72-agent-platform-runtime-retrieval-reads/72-UAT.md
  modified: []

key-decisions:
  - 'Authoring-only execution (Rule 3): no GPU + no Supabase MCP + no browser here, so the seed is NOT applied, the re-embed is NOT re-run, and the live proofs are NOT self-signed — the orchestrator runs the DB/RLS proofs via MCP; the rest is deploy-gated'
  - 'Seed resolves org via tenant_isolation.resolve_user_tenant(test_user) so L1/L3 share the tenant; clearance is the only differing axis (else tenant-isolation RLS hides the rows from both)'
  - 'Seed verified against live migration column/type contracts (intelligence_event base + P69 extend, junction CHECK 7 types, dossiers.sensitivity_level INTEGER) — no invented columns; dossiers have no organization_id'
  - 'Fixed recorded UUIDs (72090000-...) make SECTION 2 RESTORE delete exactly the seeded events + their rag_chunks rows'

patterns-established:
  - 'Live-UAT proof skeleton authored when the runtime is deploy-gated: structure + placeholders + explicit who-runs-what, never self-signed'

requirements-completed: []

# Metrics
duration: 25min
completed: 2026-06-19
---

# Phase 72 Plan 09: Copilot Live-UAT (seed + proof skeleton) Summary

**Authored the multi-clearance UAT seed (2× L1 + 1× L3 intelligence_event rows linked to an anchor dossier) and the 5 phase-gate proof skeleton (clearance-reduction, EN+AR RTL, dims=1024, INVOKER+RLS, e2e smoke) + INFRA smokes — every proof tagged ORCHESTRATOR-MCP / DEPLOY-GATED / AUTH-GATED so the runnable-now DB proofs are cleanly split from the GPU/browser-gated live proofs. Not applied, not self-signed — the orchestrator runs the DB/RLS proofs via MCP.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-19T04:46:00Z (approx)
- **Completed:** 2026-06-19T05:10:41Z
- **Tasks:** 2 (Task 1 seed authored; Task 2 UAT skeleton authored — live proofs deferred to checkpoint)
- **Files created:** 2 (seed SQL + UAT skeleton); SUMMARY/STATE/ROADMAP updated separately

## Accomplishments

- **`supabase/seeds/72-copilot-uat-seed.sql`** — inserts 3 `intelligence_event` rows (two at `sensitivity_level` 1 that an L1 user MUST see, one at `sensitivity_level` 3 that an L1 user MUST NOT see), each linked to an existing anchor dossier via `intelligence_event_dossiers`. Idempotent SECTION 1 (self-delete then insert) + a commented SECTION 2 RESTORE that deletes the seeded events and any `rag_chunks` rows they produce. All columns verified against the live migration contracts; tenant resolved via `tenant_isolation.resolve_user_tenant` (the seed/060 pattern) so the proof's L1/L3 accounts share the tenant.
- **`72-UAT.md`** — the 5 phase-gate proofs + INFRA-01/02 smokes, EN+AR, each check with a result placeholder and a tag:
  - **PROOF 4 (INVOKER + RLS)** and the **PROOF 3 DB query** are `[ORCHESTRATOR-MCP]` — runnable now via `execute_sql`, no GPU.
  - **PROOF 1 (clearance-reduction)**, **PROOF 2 (EN+AR RTL)**, **PROOF 5 (e2e)** and the **INFRA smokes** are `[DEPLOY-GATED]` / `[AUTH-GATED]` — they need the on-prem GPU stack and a real authenticated browser session.
- **Deploy-gate manifest** — enumerates exactly what must be live to complete the PENDING proofs: GPU host, vLLM Gemma 4 12B over `/v1`, TEI embed+rerank up, agent-runtime on :4100, the re-embed re-run, the `mastra_threads`/`mastra_messages` RLS re-apply, and the `hnsw.iterative_scan` RPC fold (the two 72-06 deferrals).

## Task Commits

1. **Task 1: Author copilot UAT seed (multi-clearance signals + restore)** — `fbd966b9` (feat)
2. **Task 2: Author 72-UAT.md skeleton (5 proofs + INFRA smokes, tagged, EN/AR)** — `039994a3` (docs)

_(Plan metadata commit — this SUMMARY + STATE + ROADMAP — follows separately.)_

## Files Created/Modified

- `supabase/seeds/72-copilot-uat-seed.sql` — multi-clearance `intelligence_event` seed (2× L1, 1× L3) + junction links + RESTORE block. NOT applied.
- `.planning/phases/72-agent-platform-runtime-retrieval-reads/72-UAT.md` — the 5-proof skeleton + INFRA smokes + deploy-gate section, with result placeholders. Live proofs PENDING.

## Decisions Made

- **Authoring-only execution.** The plan's Task 1 says "apply via Supabase MCP + re-run the re-embed" and Task 2 says "run the 5 live proofs". This executor has **no Supabase MCP, no GPU, and no browser/CDP** in its toolset, and the on-prem model stack (vLLM/Gemma + TEI bge-m3) is not running here. So the seed is authored but **not applied**, the re-embed is **not** re-run, and **no live proof is self-signed**. This matches the carried 72-03/72-04 precedent (migrations + re-embed authored, applied/run elsewhere).
- **Tenant correctness over arbitrary org.** `dossiers` carry no `organization_id` (verified — seed/060 never sets it). The seeded events' NOT-NULL `organization_id` is resolved via `tenant_isolation.resolve_user_tenant(test_user)` so both L1 and L3 belong to the same tenant; otherwise tenant-isolation RLS would hide the seeded rows from BOTH accounts and the clearance proof would be meaningless.
- **No invented columns.** Every seeded column was checked against `20260516000002` (base `intelligence_event`), `20260614_phase69_signals_extend` (title/sensitivity_level/status/category), and `20260516000003` (junction CHECK of the 7 canonical dossier types). `dossiers.sensitivity_level` is INTEGER live (the stale CREATE-TABLE TEXT is the P68 spec-error landmine) — but the seed never writes dossier sensitivity; the events carry their own integer level which the `rag_chunks` sync trigger reads directly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking/Environment] Plan steps require tooling not present in this executor — scoped to authoring**

- **Found during:** Task 1 + Task 2
- **Issue:** The plan instructs "Apply the seed via Supabase MCP", "re-run the idempotent reembed-rag-chunks job", and "Execute the 5 phase-gate proofs live on staging". None are possible here: no Supabase MCP, no GPU (vLLM/Gemma + TEI not running), no browser/CDP. Proceeding would mean fabricating evidence — the exact thing the indistinguishable-empty/clearance proofs exist to prevent.
- **Fix:** Authored both artifacts (seed SQL + UAT skeleton), tagged every proof with who-runs-it-and-when, wrote a deploy-gate manifest, and returned a human-verify checkpoint instead of self-signing. The orchestrator (which has the Supabase MCP) runs the `[ORCHESTRATOR-MCP]` DB proofs (AGENT-04/05 + AGENT-03 impersonation) now; the rest is deploy-gated.
- **Files modified:** supabase/seeds/72-copilot-uat-seed.sql, .planning/phases/72-agent-platform-runtime-retrieval-reads/72-UAT.md
- **Verification:** Task 1 automated verify passes (`grep intelligence_event` + `grep sensitivity_level`); UAT skeleton structure verified (5 PROOF headings, all 3 tags, INFRA smokes, deploy-gate section, AR copy, forbidden-substring rule, restore step).
- **Committed in:** fbd966b9 (seed) + 039994a3 (UAT)

---

**Total deviations:** 1 (Rule 3 — environment/tooling constraint redefines scope to authoring-only).
**Impact on plan:** No scope creep. The deliverable artifacts are complete and correct; the live execution is correctly deferred to the agent with MCP access and the GPU deploy gate. The seed is restore-safe so no staging residue accrues.

## Issues Encountered

- **Initial seed draft used non-existent `dossiers.organization_id`.** First draft anchored on a dossier and read `d.organization_id`. Checking migrations + seed/060 showed `dossiers` has no `organization_id` column; org is resolved via `tenant_isolation.resolve_user_tenant`. Rewrote the seed as a `DO` block mirroring seed/060 (resolve org from the test user's tenant; anchor a canonical-type dossier separately). Caught before commit.
- **dossiers base-table type/sensitivity declarations are stale.** The CREATE-TABLE declares `type` CHECK of 4 values and `sensitivity_level` TEXT; live is the 8-type set and INTEGER. The seed sidesteps both: it filters the anchor to the junction-accepted 7 canonical types and never writes dossier sensitivity.

## User Setup Required

The remaining live proofs are gated on the **72-02 GPU deploy** (vLLM Gemma 4 12B + TEI bge-m3 embed/rerank + agent-runtime on :4100). See the **Deploy gate** section of `72-UAT.md` for the full manifest (incl. the re-embed re-run, the `mastra_threads` RLS re-apply, and the `hnsw.iterative_scan` RPC fold). No new env config is introduced by this plan.

## Next Phase Readiness

- **Runnable now (orchestrator, MCP):** apply seed SECTION 1, then run PROOF 4 (INVOKER + `user_id=auth.uid()` RLS) and the PROOF 3 DB query, and the AGENT-03 authenticated impersonation at the DB/RLS layer (`read_signals` / `hybrid_rag_search` under L1 vs L3 JWT).
- **Deploy-gated:** PROOF 1 (full e2e clearance-reduction), PROOF 2 (EN+AR RTL render), PROOF 5 (e2e smoke), INFRA-01/02 smokes — after the GPU stack + browser session exist.
- **Teardown:** seed SECTION 2 RESTORE must run after the AUTH-GATED proofs to return staging to its pre-UAT state.
- **Blocker:** Phase 72 cannot be marked fully verified (and the v7.0 milestone gate cannot close) until the deploy-gated proofs pass EN+AR and the seed is restored.

## Self-Check: PASSED

- FOUND: supabase/seeds/72-copilot-uat-seed.sql
- FOUND: .planning/phases/72-agent-platform-runtime-retrieval-reads/72-UAT.md
- FOUND: .planning/phases/72-agent-platform-runtime-retrieval-reads/72-09-SUMMARY.md
- FOUND commit: fbd966b9 (seed)
- FOUND commit: 039994a3 (UAT skeleton)

---

_Phase: 72-agent-platform-runtime-retrieval-reads_
_Completed: 2026-06-19_
