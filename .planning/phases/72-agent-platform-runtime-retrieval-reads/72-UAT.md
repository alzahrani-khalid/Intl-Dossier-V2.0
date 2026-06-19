---
phase: 72
slug: agent-platform-runtime-retrieval-reads
plan: 09
artifact: live-UAT
status: skeleton-authored-proofs-pending
authored: 2026-06-19
seed: supabase/seeds/72-copilot-uat-seed.sql
requirements:
  [AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05, AGENT-06, INFRA-01, INFRA-02, INFRA-03]
---

# Phase 72 — Copilot Live UAT (the milestone phase-gate proofs)

> The verification bar for v7.0 Phase 72: the copilot reads gated data under the
> JWT keystone and **cannot leak above-clearance content**, in EN + AR.
> Flow = **seed → observe → restore** on staging `zkrcjzdemdmwhearhfgg`.
> Verification reality (carried lock, P68/P69/P71 MEMORY): RLS denial returns an
> **empty 200**, not an error → force errors via CDP `Network.setBlockedURLs` and
> assert `role="alert"` / reduced-counts via DOM, **never HTTP status**.

## Authoring vs Execution split (read first)

This file's **structure is authored** by the 72-09 executor. The executor has
**NO Supabase MCP and NO GPU/browser** in its toolset, and the on-prem model
stack (vLLM/Gemma + TEI) is **not running here**, so the executor did **not** run
any live proof. Each proof below is tagged with **who runs it and when**:

| Tag                    | Meaning                                                                                                                         | Who / When                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **[ORCHESTRATOR-MCP]** | DB/RLS-layer proof runnable now via the Supabase MCP `execute_sql` (read-only or seed apply). No GPU needed.                    | 72-09 orchestrator, now                                  |
| **[DEPLOY-GATED]**     | Needs the on-prem GPU stack (vLLM Gemma + TEI embed/rerank) + agent-runtime booted on :4100 + the re-embed re-run.              | After the deploy gate (72-02 user_setup on the GPU host) |
| **[AUTH-GATED]**       | Needs a real authenticated browser session (L1/L3 login, AR toggle, CDP). Cannot be service-role (bypasses RLS — P69 landmine). | After deploy, in a browser against staging               |

> **Do NOT self-sign DEPLOY-GATED or AUTH-GATED proofs.** They stay `⬜ PENDING`
> until the GPU host + a real browser session exist. The seed must be **restored**
> after the AUTH-GATED proofs (PROOF 3 / PROOF 5) complete.

**Result legend:** ⬜ PENDING · ✅ PASS · ❌ FAIL · ⚠️ FLAKY

---

## Pre-proof: apply the seed (ORCHESTRATOR-MCP, now)

The AGENT-03 (clearance-reduction) and AGENT-05 (dimension) proofs need
multi-clearance rows; signals/events are 0 rows on staging.

1. **Apply** `supabase/seeds/72-copilot-uat-seed.sql` **SECTION 1** via the
   Supabase MCP. Confirm the test-user UUID in the seed's `v_user_id` is the
   tenant owner of the L1/L3 proof accounts (or replace it) before applying.
2. **Verify** the seed landed (MCP `execute_sql`):
   ```sql
   SELECT id, title, sensitivity_level, status
   FROM public.intelligence_event WHERE id::text LIKE '72090000-%'
   ORDER BY sensitivity_level;          -- EXPECT 3 rows: sensitivity_level {1,1,3}
   SELECT count(*) FROM public.intelligence_event_dossiers
   WHERE event_id::text LIKE '72090000-%';   -- EXPECT 3 junction rows
   ```

| Step                   | Tag                | Result     | Evidence (counts / notes)                                   |
| ---------------------- | ------------------ | ---------- | ----------------------------------------------------------- |
| Seed SECTION 1 applied | [ORCHESTRATOR-MCP] | ⬜ PENDING | _(orchestrator: paste the 3-row + 3-junction confirmation)_ |

> The **re-embed re-run** that turns the seeded signals into `rag_chunks` rows is
> **[DEPLOY-GATED]** (TEI is GPU-served) — see the Deploy gate section. Until it
> runs, PROOF 3 / PROOF 5 (and AGENT-05 coverage of the seeded rows) stay PENDING.

---

## PROOF 1 — Clearance-reduction proof (AGENT-03) · the keystone

**Claim:** A low-clearance (L1) account gets a **strict subset** of an L3
account's copilot results, **zero above-clearance content**, and the FULL
serialized payload (visible copy + `aria-live` + any JSON) contains **no**
forbidden substring `/clearance|filtered|restricted/i` (indistinguishable-empty,
UI-SPEC hard constraint).

**How (AUTH-GATED + ORCHESTRATOR-MCP):**

- Two **real authenticated sessions** — L1 and L3 (NOT service-role; service-role
  MCP bypasses RLS — P69 landmine). Both in the seed's tenant.
- Ask **the same** question that hits the seeded security assessment
  (e.g. "summarize the latest security and economic signals on this dossier").
- Assert: L1 result set ⊂ L3; the seeded **L3 security assessment** appears for L3
  and is **absent** for L1; L1 still shows the **two L1 signals** (non-trivial).
- Serialize the entire L1 response (rendered text + `aria-live` + tool JSON) and
  assert `not.toMatch(/clearance|filtered|restricted/i)`.
- **Forced-error (CDP):** `Network.setBlockedURLs` the RAG/tool call; wait through
  the TanStack 3× retry; assert `role="alert"` + the neutral no-answer copy via
  DOM (screenshot can wedge). No forbidden substring in the empty/error state.

**Neutral copy to expect** (the ONLY empty messaging; from `i18n/.../copilot.json`):

- EN: "The copilot couldn't find anything to answer that. Try rephrasing, or ask about a specific dossier."
- AR: «لم يجد المساعد ما يجيب عن ذلك. حاول إعادة الصياغة، أو اسأل عن ملف محدد.»

| Check                                                 | Tag          | Result     | Evidence (L1 vs L3 node/result counts; payload grep)                     |
| ----------------------------------------------------- | ------------ | ---------- | ------------------------------------------------------------------------ |
| 1a. L1 result ⊂ L3 (EN)                               | [AUTH-GATED] | ⬜ PENDING | _(L1 count = ** ; L3 count = ** ; L1 ⊂ L3 = \_\_)_                       |
| 1b. Seeded L3 row absent for L1 (EN)                  | [AUTH-GATED] | ⬜ PENDING | _(L3 security assessment visible to L3 = ** ; to L1 = **)_               |
| 1c. No forbidden substring anywhere — L1 payload (EN) | [AUTH-GATED] | ⬜ PENDING | _(grep /clearance\|filtered\|restricted/i over copy+aria-live+JSON = 0)_ |
| 1d. Forced-error → role="alert" + neutral copy (EN)   | [AUTH-GATED] | ⬜ PENDING | _(CDP block; DOM assert)_                                                |
| 1e. Repeat 1a–1d in **AR**                            | [AUTH-GATED] | ⬜ PENDING | _(AR L1/L3 counts; AR neutral copy; no forbidden substring)_             |

---

## PROOF 2 — EN + AR RTL render (AGENT-06)

**Claim:** The copilot renders correctly in both languages at **1024px and
1400px** (analyst widths): `dir="rtl"` + Tajawal in AR; message row / composer /
citation flipped; token-bound (no raw hex, no card shadow).

**How (AUTH-GATED):** open the drawer; switch AR via the ع button
(`localStorage['id.locale']='ar'`); inspect `dir`, computed font, and flip order
at each width.

| Check                                          | Tag          | Result     | Evidence                             |
| ---------------------------------------------- | ------------ | ---------- | ------------------------------------ |
| 2a. AR drawer `dir="rtl"` + Tajawal computed   | [AUTH-GATED] | ⬜ PENDING | _(computed font-family; dir attr)_   |
| 2b. message / composer / citation flipped (AR) | [AUTH-GATED] | ⬜ PENDING | _(reading order start = inline-end)_ |
| 2c. Token-bound — no raw hex / no card shadow  | [AUTH-GATED] | ⬜ PENDING | _(spot-check computed styles)_       |
| 2d. Verified at 1024px AND 1400px (EN + AR)    | [AUTH-GATED] | ⬜ PENDING | _(both widths, both langs)_          |

---

## PROOF 3 — `array_length(embedding,1)=1024` (AGENT-05)

**Claim:** Every `rag_chunks` row is embedded at bge-m3 native **1024-dim** — no
pad/truncate (the retired P68 1536 corruption).

**How:** the DB query is **[ORCHESTRATOR-MCP]** (runnable now via `execute_sql`),
but it only covers the **seeded** signal rows once the **re-embed re-run** (which
is **[DEPLOY-GATED]** — TEI is GPU-served) has produced them. Run
`scripts/verify-rag-chunks-dims.sql` PROOF 1.

```sql
SELECT count(*) AS rows_failing_dimension_check
FROM public.rag_chunks WHERE vector_dims(embedding) <> 1024;   -- EXPECT 0
SELECT count(*) AS total_chunk_rows,
       count(DISTINCT vector_dims(embedding)) AS distinct_dims,
       min(vector_dims(embedding)) AS min_dim, max(vector_dims(embedding)) AS max_dim
FROM public.rag_chunks;   -- EXPECT distinct_dims=1, min=max=1024 (post re-embed)
```

| Check                                    | Tag                                                                        | Result     | Evidence                        |
| ---------------------------------------- | -------------------------------------------------------------------------- | ---------- | ------------------------------- |
| 3a. 0 rows fail the 1024 dimension check | [ORCHESTRATOR-MCP] (covers seeded rows only after [DEPLOY-GATED] re-embed) | ⬜ PENDING | _(rows_failing = \_\_)_         |
| 3b. distinct_dims=1, min=max=1024        | [ORCHESTRATOR-MCP] / [DEPLOY-GATED]                                        | ⬜ PENDING | _(total rows = ** ; dims = **)_ |

---

## PROOF 4 — `SECURITY INVOKER` + RLS (AGENT-04)

**Claim:** `hybrid_rag_search` is `SECURITY INVOKER` (`prosecdef=false`) so RLS
runs under the caller JWT; the `rag_chunks` SELECT policy gates on
`profiles.user_id = auth.uid()` (NOT `id` — the deny-all landmine).

**How (ORCHESTRATOR-MCP, runnable now — no GPU):** `scripts/verify-rag-chunks-dims.sql`
PROOF 2 + PROOF 3.

```sql
SELECT proname, prosecdef FROM pg_proc
WHERE proname='hybrid_rag_search' AND pronamespace='public'::regnamespace;  -- EXPECT prosecdef=false
SELECT * FROM public.get_function_security('hybrid_rag_search');            -- EXPECT prosecdef=false
SELECT policyname, cmd, qual FROM pg_policies
WHERE schemaname='public' AND tablename='rag_chunks';
-- EXPECT a SELECT policy whose qual contains "FROM profiles WHERE user_id = auth.uid()"
--        and does NOT contain "WHERE id = auth.uid()"
SELECT relname, relrowsecurity FROM pg_class
WHERE relname='rag_chunks' AND relnamespace='public'::regnamespace;         -- EXPECT relrowsecurity=true
```

> NOTE (72-04 SUMMARY): these already verified live on staging at migration-apply
> time (`prosecdef=false ✓`, RLS `user_id=auth.uid()` trap-free ✓, anon REVOKEd).
> Re-confirmed here at the gate.

| Check                                                 | Tag                | Result     | Evidence                                |
| ----------------------------------------------------- | ------------------ | ---------- | --------------------------------------- |
| 4a. `hybrid_rag_search` prosecdef = false             | [ORCHESTRATOR-MCP] | ⬜ PENDING | _(pg_proc + get_function_security)_     |
| 4b. rag_chunks SELECT RLS uses `user_id = auth.uid()` | [ORCHESTRATOR-MCP] | ⬜ PENDING | _(qual snippet; NOT `id = auth.uid()`)_ |
| 4c. RLS enabled on rag_chunks                         | [ORCHESTRATOR-MCP] | ⬜ PENDING | _(relrowsecurity = true)_               |

---

## PROOF 5 — End-to-end smoke (INFRA-03 / AGENT-01 / AGENT-02)

**Claim:** `agent-runtime` on :4100 processes a full chat turn from the drawer
**and** Cmd+K; a cleared user gets a streamed, token-bound reply from gated data
**under their JWT**.

**How (DEPLOY-GATED + AUTH-GATED):** needs the GPU model stack + agent-runtime
booted. From the drawer (Topbar FAB) and via Cmd+K on a dossier, send a question;
assert an SSE-streamed reply that draws on the seeded signals (scoped to the
caller's clearance).

| Check                                             | Tag                           | Result     | Evidence                         |
| ------------------------------------------------- | ----------------------------- | ---------- | -------------------------------- |
| 5a. Drawer → streamed token-bound reply           | [DEPLOY-GATED] + [AUTH-GATED] | ⬜ PENDING | _(SSE reply; cites seeded data)_ |
| 5b. Cmd+K on a dossier → context pre-fill + reply | [DEPLOY-GATED] + [AUTH-GATED] | ⬜ PENDING | _(dossier anchor in context)_    |
| 5c. Reply scoped to caller JWT clearance          | [DEPLOY-GATED] + [AUTH-GATED] | ⬜ PENDING | _(L1 reply omits L3 content)_    |

---

## INFRA smokes (INFRA-01 / INFRA-02) — [DEPLOY-GATED]

Run on the GPU host once the on-prem stack is up (env vars from 72-02 config).

| Check                                                       | Tag            | Result     | Evidence                 |
| ----------------------------------------------------------- | -------------- | ---------- | ------------------------ |
| INFRA-01a. `curl $VLLM_URL/v1/models` → `gemma-4-12b`       | [DEPLOY-GATED] | ⬜ PENDING | _(model id in response)_ |
| INFRA-01b. chat + tool round-trip succeeds                  | [DEPLOY-GATED] | ⬜ PENDING | _(non-empty completion)_ |
| INFRA-02a. `curl $TEI_EMBED_URL/embed` → 1024-dim vector    | [DEPLOY-GATED] | ⬜ PENDING | _(length = 1024)_        |
| INFRA-02b. `curl $TEI_RERANK_URL/rerank` → scores           | [DEPLOY-GATED] | ⬜ PENDING | _(score array)_          |
| INFRA-03. `docker compose ps agent-runtime` healthy on 4100 | [DEPLOY-GATED] | ⬜ PENDING | _(health + port)_        |

---

## Post-proof: RESTORE the seed (ORCHESTRATOR-MCP, after PROOF 1/3/5)

Apply `supabase/seeds/72-copilot-uat-seed.sql` **SECTION 2** (uncomment + run) to
return staging to its pre-UAT state.

```sql
SELECT count(*) FROM public.intelligence_event WHERE id::text LIKE '72090000-%';  -- EXPECT 0
SELECT count(*) FROM public.rag_chunks
WHERE source_type='signal' AND source_id::text LIKE '72090000-%';                 -- EXPECT 0
```

| Step                                            | Tag                | Result     | Evidence            |
| ----------------------------------------------- | ------------------ | ---------- | ------------------- |
| Seed SECTION 2 (RESTORE) applied; staging clean | [ORCHESTRATOR-MCP] | ⬜ PENDING | _(both counts = 0)_ |

---

## Deploy gate — what must be deployed/run to complete the PENDING proofs

The DEPLOY-GATED and end-to-end AUTH-GATED proofs need the on-prem GPU stack and
the runtime live. Concretely:

1. **GPU host provisioned** (72-02 `user_setup` track) — there is no GPU in the
   authoring environment.
2. **vLLM serving Gemma 4 12B** over `/v1` (`$VLLM_URL/v1/models` → `gemma-4-12b`).
3. **TEI up:** bge-m3 embeddings (`$TEI_EMBED_URL/embed` → 1024-dim) **and**
   bge-reranker-v2-m3 (`$TEI_RERANK_URL/rerank` → scores).
4. **agent-runtime booted** on :4100 in compose, reachable via nginx (SSE).
5. **Re-run the re-embed backfill** `backend/src/jobs/reembed-rag-chunks.ts`
   against the **live TEI** (it is idempotent on the natural key) so the seeded
   signals — and the existing dossier/position/commitment corpus — land in
   `rag_chunks` at 1024-dim. (LIVE RUN was deferred from 72-04 precisely because
   TEI is GPU-served.)
6. **Re-apply `mastra_threads` / `mastra_messages` owner-only RLS** post-boot —
   `@mastra/pg` creates these tables on first runtime boot, so the RLS is a no-op
   until the runtime has booted at least once (carried from 72-03/72-04/72-05).
7. **Fold `set_config('hnsw.iterative_scan', true)` into the `hybrid_rag_search`
   RPC** (connection-pooling correctness) — deferred from 72-06 to this gate.

Once 1–7 are live: re-run **PROOF 3** (re-embed coverage), **PROOF 5** (e2e),
the **INFRA smokes**, and the end-to-end portions of **PROOF 1** (AUTH-GATED), in
**EN + AR**, then **RESTORE** the seed.

---

## Sign-off

- [ ] Seed applied (ORCHESTRATOR-MCP) + verified 3 events / 3 junction rows
- [ ] PROOF 4 (INVOKER + RLS) — ORCHESTRATOR-MCP, runnable now
- [ ] PROOF 3 (dims=1024) — after [DEPLOY-GATED] re-embed
- [ ] PROOF 1 (clearance-reduction) — AUTH-GATED, EN + AR, no forbidden substring
- [ ] PROOF 2 (EN+AR RTL) — AUTH-GATED, 1024 & 1400
- [ ] PROOF 5 (e2e smoke) — DEPLOY-GATED + AUTH-GATED
- [ ] INFRA-01/02 smokes — DEPLOY-GATED
- [ ] Seed RESTORED; staging clean
- [ ] AGENT-01..06 + INFRA-01..03 closed with live evidence

**Status:** skeleton authored 2026-06-19; live proofs pending the deploy gate +
authenticated sessions. The 72-09 executor authored the seed + this structure and
explicitly did **not** self-sign the live proofs (no GPU / no MCP / no browser).
