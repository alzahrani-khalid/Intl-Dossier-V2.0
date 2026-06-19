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
  - '72-UAT.md — the 5 phase-gate proofs + INFRA smokes, EN+AR; the 3 DB/RLS proofs (PROOF 4 INVOKER+RLS, PROOF 1 DB-layer clearance-reduction, PROOF 3 synthetic dims=1024) RUN + PASS live 2026-06-19, staging RESTORED; e2e (PROOF 1 full/2/5) + INFRA PENDING the GPU deploy gate'
  - 'supabase/seeds/72-copilot-uat-seed.sql — multi-clearance signal seed (2x L1, 1x L3) + restore, ready for the deploy-time e2e proof (PROOF 5)'
  - 'live DB/RLS evidence that the keystone holds at the RLS layer (L1 result strict subset of L3, zero above-clearance)'
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
  - 'DB/RLS-layer keystone proven live 2026-06-19 via MCP: under authenticated impersonation (NOT service-role) over 2 synthetic rag_chunks rows (sens 1+3), an L1 caller sees rows=1 [1] — a strict subset of the L3 caller rows=2 [1,3] — and ZERO above-clearance content; this is the exact INVOKER + profiles.user_id=auth.uid() path hybrid_rag_search uses'
  - 'Orchestrator used synthetic rag_chunks rows directly (clearance-only RLS) rather than the intelligence_event seed file — deliberately removing tenant-isolation as a confounder for the clearance proof; the canonical seed file remains ready for the deploy-time e2e proof (PROOF 5)'
  - 'PROOF 4 PASS: hybrid_rag_search prosecdef=false (SECURITY INVOKER), rag_chunks SELECT RLS gates on profiles.user_id=auth.uid() (trap-free, NOT id=auth.uid()), anon EXECUTE = 0'
  - 'PROOF 3 split: synthetic rows confirm the column/constraint enforces 1024-dim (0 failing); the real-corpus bge-m3 dimension proof is DEPLOY-GATED post-re-embed (TEI is GPU-served)'
  - 'Authoring-only at first (Rule 3): no GPU + no Supabase MCP + no browser in the executor, so the seed was authored not applied and no proof self-signed; the orchestrator then ran the 3 ORCHESTRATOR-MCP DB/RLS proofs and restored staging'
  - 'Restore CONFIRMED: synthetic rows deleted, rag_chunks total = 0, intelligence_event 72090000- seed never applied (count 0) — staging clean'
  - 'Phase live-UAT is split: DB/RLS PASS now; the end-to-end copilot-UI proofs (PROOF 1 full / 2 / 5) + INFRA smokes are PENDING the GPU deploy gate + a browser session — NOT a full live-UAT pass'

patterns-established:
  - 'Live-UAT proof skeleton authored when the runtime is deploy-gated: structure + placeholders + explicit who-runs-what, never self-signed; the runnable-now DB/RLS proofs run via MCP, the GPU/browser proofs stay PENDING'
  - 'Clearance keystone provable at the DB/RLS layer via P69-pattern authenticated impersonation over synthetic rows — independent of the GPU stack — by exercising the same INVOKER + RLS path the agent tool uses'

requirements-completed: []

# Metrics
duration: 25min
completed: 2026-06-19
---

# Phase 72 Plan 09: Copilot Live-UAT (seed + DB/RLS proofs PASS; e2e deploy-gated) Summary

**The keystone security guarantee is proven live at the DB/RLS layer: under authenticated impersonation (not service-role), an L1 caller gets a strict subset of an L3 caller (rows=1 `[1]` ⊂ rows=2 `[1,3]`) with ZERO above-clearance content — the exact `SECURITY INVOKER` + `profiles.user_id=auth.uid()` path `hybrid_rag_search` uses (PROOF 4 INVOKER+RLS, PROOF 1 DB-layer, PROOF 3 synthetic dims=1024 all PASS via MCP 2026-06-19; staging RESTORED, `rag_chunks`=0). The end-to-end copilot-UI proofs (PROOF 1 full / 2 / 5) + INFRA smokes remain PENDING the on-prem GPU deploy gate + a browser session — a clean split, not a full live-UAT pass.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-19T04:46:00Z (approx)
- **Completed:** 2026-06-19T05:10:41Z
- **Tasks:** 2 (Task 1 seed authored; Task 2 UAT skeleton authored — live proofs deferred to checkpoint)
- **Files created:** 2 (seed SQL + UAT skeleton); SUMMARY/STATE/ROADMAP updated separately

## Accomplishments

- **DB/RLS-layer keystone PROVEN live (2026-06-19, via Supabase MCP on staging `zkrcjzdemdmwhearhfgg`).** The orchestrator ran the 3 `[ORCHESTRATOR-MCP]` proofs and recorded them PASS in `72-UAT.md`:
  - **PROOF 1 DB-layer (AGENT-03 clearance-reduction) — ✅ PASS.** Authenticated impersonation (`SET LOCAL ROLE authenticated` + `set_config('request.jwt.claims', …)`, the P69 pattern — **not** service-role), identical query over **2 synthetic `rag_chunks` rows** (sensitivity 1 + 3). L1 caller (`00242210-…`, clearance 1): **1** row, levels `[1]`. L3 caller (`1aae53d5-…`, clearance 3): **2** rows, levels `[1,3]`. **VERDICT: L1 `[1]` is a strict subset of L3 `[1,3]`; L1 sees ZERO above-clearance content** — the exact INVOKER + RLS path `hybrid_rag_search` runs.
  - **PROOF 4 (SECURITY INVOKER + RLS) — ✅ PASS.** `hybrid_rag_search` `prosecdef=false` (INVOKER, never DEFINER); `rag_chunks` SELECT RLS qual gates on `sensitivity_level <= (SELECT clearance_level FROM profiles WHERE user_id = auth.uid())` — the trap-free `profiles.user_id` form (NOT the deny-all `id=auth.uid()` landmine); anon `EXECUTE` on `hybrid_rag_search` = **0** (REVOKEd).
  - **PROOF 3 synthetic dims=1024 — ✅ PASS.** Both synthetic rows report `vector_dims(embedding)=1024`, **0** failing rows — the column/constraint enforces 1024 on actual rows. (The real-corpus bge-m3 dimension proof is DEPLOY-GATED post-re-embed.)
  - **RESTORE — ✅ CONFIRMED.** Synthetic rows deleted; `rag_chunks` total = **0**; the `72090000-` `intelligence_event` seed was **never applied** (count 0). Staging clean.
- **`supabase/seeds/72-copilot-uat-seed.sql`** — inserts 3 `intelligence_event` rows (two at `sensitivity_level` 1 that an L1 user MUST see, one at `sensitivity_level` 3 that an L1 user MUST NOT see), each linked to an existing anchor dossier via `intelligence_event_dossiers`. Idempotent SECTION 1 (self-delete then insert) + a commented SECTION 2 RESTORE. All columns verified against the live migration contracts; tenant resolved via `tenant_isolation.resolve_user_tenant` (the seed/060 pattern). **The file remains ready for the deploy-time e2e proof (PROOF 5)** — the orchestrator used synthetic `rag_chunks` rows directly for the clearance proof to keep tenant-isolation out of the way.
- **`72-UAT.md`** — the 5 phase-gate proofs + INFRA-01/02 smokes, EN+AR; the 3 DB/RLS proofs marked PASS with evidence + the restore confirmation; the deploy-gated/auth-gated proofs (PROOF 1 full, PROOF 2, PROOF 5, INFRA) PENDING with the deploy-gate checklist. A status banner makes explicit this is **not** a full live-UAT pass.
- **Deploy-gate manifest** — enumerates exactly what must be live to complete the PENDING proofs: GPU host, vLLM Gemma 4 12B over `/v1`, TEI embed+rerank up, agent-runtime on :4100, the bge-m3 re-embed re-run, the `mastra_threads`/`mastra_messages` RLS re-apply, and the `hnsw.iterative_scan` RPC fold (the two 72-06 deferrals).

## Task Commits

1. **Task 1: Author copilot UAT seed (multi-clearance signals + restore)** — `fbd966b9` (feat)
2. **Task 2: Author 72-UAT.md skeleton (5 proofs + INFRA smokes, tagged, EN/AR)** — `039994a3` (docs)
3. **Prior continuation: SUMMARY + state (skeleton-authored, proofs deferred)** — `820dabec` (docs)
4. **This continuation: record live DB/RLS UAT proofs + deploy gate (SUMMARY + UAT + STATE + ROADMAP)** — _(this commit)_ (docs)

_The orchestrator ran the 3 ORCHESTRATOR-MCP DB/RLS proofs live on staging via the Supabase MCP and restored staging; this continuation recorded those results (no proofs run here — no MCP/GPU/browser in this executor)._

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

- **Done now (DB/RLS layer, via MCP):** PROOF 4 (INVOKER + `user_id=auth.uid()` RLS, anon REVOKEd), PROOF 1 DB-layer (AGENT-03 clearance-reduction — L1 ⊂ L3, zero above-clearance), and PROOF 3 synthetic dims=1024 all **PASS**; staging **RESTORED** (`rag_chunks`=0). The keystone holds at the RLS layer.
- **Deploy-gated (PENDING):** PROOF 1 full e2e (clearance-reduction through the copilot UI), PROOF 2 (EN+AR RTL render at 1024 & 1400), PROOF 3 real-corpus dims (post bge-m3 re-embed), PROOF 5 (e2e smoke), INFRA-01/02 smokes — after the GPU stack (vLLM Gemma + TEI) + agent-runtime on :4100 + a real authenticated browser session exist. Plus the deploy-time tasks: bge-m3 re-embed re-run, `mastra_threads`/`mastra_messages` RLS re-apply, `hnsw.iterative_scan` RPC fold.
- **Teardown for the deploy-time proof:** when PROOF 5 applies the canonical seed SECTION 1, SECTION 2 RESTORE must run afterward to return staging to its pre-UAT state (the DB-proof synthetic rows are already cleaned up).
- **Blocker:** Phase 72 cannot be marked **fully** verified (and the v7.0 milestone gate cannot close) until the deploy-gated **e2e** proofs pass EN+AR and the seed is restored. The **executable-here scope (seed + UAT + DB/RLS proofs) is complete.**

## Self-Check: PASSED

The executable-here scope is complete and the live DB/RLS evidence is recorded.

- FOUND: supabase/seeds/72-copilot-uat-seed.sql
- FOUND: .planning/phases/72-agent-platform-runtime-retrieval-reads/72-UAT.md
- FOUND: .planning/phases/72-agent-platform-runtime-retrieval-reads/72-09-SUMMARY.md
- FOUND commit: fbd966b9 (seed)
- FOUND commit: 039994a3 (UAT skeleton)
- FOUND commit: 820dabec (prior SUMMARY + state — skeleton-authored state)
- 72-UAT.md records the 3 ORCHESTRATOR-MCP proofs PASS (PROOF 4 / PROOF 1 DB-layer / PROOF 3 synthetic) + restore CONFIRMED; e2e (PROOF 1 full / 2 / 5) + INFRA PENDING with the deploy-gate checklist

---

_Phase: 72-agent-platform-runtime-retrieval-reads_
_Completed: 2026-06-19_
