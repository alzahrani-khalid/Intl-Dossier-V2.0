---
phase: 72
slug: agent-platform-runtime-retrieval-reads
plan: 09
artifact: live-UAT
status: db-rls-proofs-PASS-e2e-and-infra-deploy-gated
authored: 2026-06-19
db_proofs_run: 2026-06-19
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

## Status banner (2026-06-19)

> **DB/RLS-layer proofs RUN and PASS.** The orchestrator (with the Supabase MCP)
> executed the three `[ORCHESTRATOR-MCP]` proofs live on staging
> `zkrcjzdemdmwhearhfgg` on **2026-06-19**, then **RESTORED** staging to its
> pre-UAT empty state. The keystone security guarantee — a low-clearance (L1)
> caller sees a strict subset of an L3 caller and **zero** above-clearance
> content — **holds at the DB/RLS layer** (PROOF 1 DB-layer, AGENT-03), via the
> exact INVOKER + `profiles.user_id = auth.uid()` path `hybrid_rag_search` uses.
> The **end-to-end** copilot-UI proofs (PROOF 1 full, PROOF 2, PROOF 5) and the
> **INFRA** smokes remain `⬜ PENDING` — they need the on-prem GPU stack
> (vLLM Gemma + TEI) + the runtime booted + a real authenticated browser session.
> **Do not read this as "the full live UAT passed."** It is a clean split:
> DB/RLS PASS now, e2e + INFRA after the deploy gate.

## Authoring vs Execution split (read first)

This file's **structure was authored** by the 72-09 executor (no Supabase MCP /
no GPU / no browser in its toolset), and the on-prem model stack (vLLM/Gemma +
TEI) is **not running in the authoring environment**. The `[ORCHESTRATOR-MCP]`
proofs below have since been **run by the orchestrator via the Supabase MCP** and
are marked PASS with evidence. The `[DEPLOY-GATED]` / `[AUTH-GATED]` proofs were
**not** run (no GPU / no browser) and stay `⬜ PENDING`. Each proof is tagged with
**who runs it and when**:

| Tag                    | Meaning                                                                                                                         | Who / When                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **[ORCHESTRATOR-MCP]** | DB/RLS-layer proof runnable now via the Supabase MCP `execute_sql` (read-only or seed apply). No GPU needed.                    | 72-09 orchestrator, now                                  |
| **[DEPLOY-GATED]**     | Needs the on-prem GPU stack (vLLM Gemma + TEI embed/rerank) + agent-runtime booted on :4100 + the re-embed re-run.              | After the deploy gate (72-02 user_setup on the GPU host) |
| **[AUTH-GATED]**       | Needs a real authenticated browser session (L1/L3 login, AR toggle, CDP). Cannot be service-role (bypasses RLS — P69 landmine). | After deploy, in a browser against staging               |

> **Do NOT self-sign DEPLOY-GATED or AUTH-GATED proofs.** They stay `⬜ PENDING`
> until the GPU host + a real browser session exist. The seed must be **restored**
> after the AUTH-GATED proofs (PROOF 3 / PROOF 5) complete.

**Result legend:** ⬜ PENDING · ✅ PASS · ❌ FAIL · ⚠️ FLAKY · ⚪ NOT APPLIED (intentionally) · N/A not applicable here

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

| Step                                | Tag                | Result             | Evidence (counts / notes)                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------- | ------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Seed SECTION 1 (intelligence_event) | [ORCHESTRATOR-MCP] | ⚪ NOT APPLIED     | The canonical `intelligence_event` seed file was **not** applied. The orchestrator instead inserted **2 synthetic `rag_chunks` rows** (sensitivity 1 + 3) directly, exercising the **clearance-only** RLS on `rag_chunks` and deliberately avoiding tenant-isolation as a confounder. The canonical seed file remains ready for the **deploy-time e2e** proof (PROOF 5). |
| Synthetic rag_chunks rows inserted  | [ORCHESTRATOR-MCP] | ✅ PASS (restored) | 2 rows: sensitivity 1 + 3, placeholder 1024-dim halfvec, used by PROOF 1 (DB-layer) + PROOF 3. **Deleted on restore** — `rag_chunks` total = 0 (see RESTORE).                                                                                                                                                                                                            |

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

### PROOF 1 — DB-layer (AGENT-03) · [ORCHESTRATOR-MCP] · ✅ PASS (2026-06-19)

The keystone proven at the **DB/RLS layer** — the exact INVOKER + RLS path
`hybrid_rag_search` uses. Method: `SET LOCAL ROLE authenticated` +
`set_config('request.jwt.claims', …)` per the P69 impersonation pattern (NOT
service-role — service-role bypasses RLS), identical query over the **2 synthetic
`rag_chunks` rows** (sensitivity 1 + 3), once per caller:

| Caller (authenticated impersonation)        | clearance | rows visible | max_sensitivity | levels  |
| ------------------------------------------- | --------- | ------------ | --------------- | ------- |
| L1 — `00242210-2f81-4cfc-9799-1cc02c76be44` | 1         | **1**        | 1               | `[1]`   |
| L3 — `1aae53d5-1488-4c9d-8ded-6c1926d6f0e8` | 3         | **2**        | 3               | `[1,3]` |

**VERDICT — ✅ PASS:** L1 result `[1]` is a **strict subset** of L3 `[1,3]`; the
L1 caller sees **ZERO above-clearance content** (the sensitivity-3 row is
invisible to L1). This is the same RLS path `hybrid_rag_search` runs as
`SECURITY INVOKER` (PROOF 4). The keystone security guarantee **holds at the
DB/RLS layer.**

| Check                                                        | Tag                | Result  | Evidence                                                              |
| ------------------------------------------------------------ | ------------------ | ------- | --------------------------------------------------------------------- |
| 1-DB. L1 ⊂ L3 at the RLS layer; L1 sees zero above-clearance | [ORCHESTRATOR-MCP] | ✅ PASS | L1 rows=1 `[1]` ⊂ L3 rows=2 `[1,3]`; impersonation (not service-role) |

### PROOF 1 — full e2e (AGENT-03) · [AUTH-GATED] · ⬜ PENDING

The copilot-UI clearance-reduction through 2 **real browser sessions** (L1/L3) +
the CDP `Network.setBlockedURLs` forced-error → neutral `role="alert"` copy +
the indistinguishable-empty payload grep, in EN + AR. Needs the deploy gate +
authenticated browser sessions (the DB-layer keystone above already holds).

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

> NOTE: the copilot **drawer visual** (token remap, `dir="rtl"` + Tajawal, flipped
> message/composer/citation, no raw hex / no card shadow) was **approved on
> evidence** at the 72-08 human-verify checkpoint (2026-06-19). The **full live
> render through login at 1024 & 1400** is deploy/auth-gated and stays PENDING.

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

**Result (2026-06-19):** the orchestrator inserted **2 synthetic `rag_chunks`
rows** (sensitivity 1 + 3, placeholder 1024-dim halfvec) and confirmed
`vector_dims(embedding) = 1024` for **both** rows, **0** failing rows. This
proves the **column/constraint enforces 1024 on actual rows**. The **real-corpus**
dimension proof on **bge-m3** embeddings is **[DEPLOY-GATED]** post-re-embed (TEI
is GPU-served). Synthetic rows **deleted on restore**.

| Check                                                                | Tag                | Result             | Evidence                                                          |
| -------------------------------------------------------------------- | ------------------ | ------------------ | ----------------------------------------------------------------- |
| 3a. 0 synthetic rows fail the 1024 dimension check                   | [ORCHESTRATOR-MCP] | ✅ PASS (restored) | `vector_dims(embedding)=1024` for both rows; rows_failing = **0** |
| 3b. Real-corpus distinct_dims=1, min=max=1024 (post bge-m3 re-embed) | [DEPLOY-GATED]     | ⬜ PENDING         | _(after the GPU-served TEI re-embed produces real rows)_          |

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

**Result (2026-06-19, via MCP) — ✅ PASS:**

- `hybrid_rag_search` `prosecdef = false` → **SECURITY INVOKER**, never DEFINER.
- `rag_chunks` SELECT RLS qual =
  `sensitivity_level <= (SELECT clearance_level FROM profiles WHERE user_id = auth.uid())`
  — the **trap-free** `profiles.user_id` form (NOT the deny-all `id = auth.uid()`
  landmine), live-confirmed.
- **anon** `EXECUTE` grants on `hybrid_rag_search` = **0** (REVOKEd; `authenticated`
  GRANTed).

| Check                                                 | Tag                | Result  | Evidence                                                                                                               |
| ----------------------------------------------------- | ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| 4a. `hybrid_rag_search` prosecdef = false             | [ORCHESTRATOR-MCP] | ✅ PASS | `prosecdef = false` (SECURITY INVOKER)                                                                                 |
| 4b. rag_chunks SELECT RLS uses `user_id = auth.uid()` | [ORCHESTRATOR-MCP] | ✅ PASS | qual = `sensitivity_level <= (SELECT clearance_level FROM profiles WHERE user_id = auth.uid())`; NOT `id = auth.uid()` |
| 4c. anon EXECUTE on hybrid_rag_search REVOKEd         | [ORCHESTRATOR-MCP] | ✅ PASS | anon grants = 0; authenticated GRANTed                                                                                 |

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

## Post-proof: RESTORE (ORCHESTRATOR-MCP) · ✅ CONFIRMED (2026-06-19)

The orchestrator used **synthetic `rag_chunks` rows** directly (not the
`intelligence_event` seed file — see Pre-proof), so the restore deleted those
synthetic rows rather than running SECTION 2 of the seed file. Staging is clean:

```sql
SELECT count(*) FROM public.rag_chunks;                                           -- ACTUAL: 0
SELECT count(*) FROM public.intelligence_event WHERE id::text LIKE '72090000-%';  -- ACTUAL: 0 (seed never applied)
```

| Step                                               | Tag                | Result  | Evidence                                                                                              |
| -------------------------------------------------- | ------------------ | ------- | ----------------------------------------------------------------------------------------------------- |
| Synthetic rag_chunks rows deleted; staging clean   | [ORCHESTRATOR-MCP] | ✅ PASS | `rag_chunks` total = **0**; the `72090000-` intelligence_event seed was **never applied** (count = 0) |
| Seed SECTION 2 (deploy-time RESTORE after PROOF 5) | [ORCHESTRATOR-MCP] | ⬜ N/A  | Runs only after the deploy-time e2e proof applies SECTION 1; the canonical seed file remains ready    |

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

**DB/RLS layer — RUN 2026-06-19 (ORCHESTRATOR-MCP):**

- [x] PROOF 4 (INVOKER + RLS) — ✅ PASS: `prosecdef=false`, `user_id=auth.uid()` RLS, anon REVOKEd
- [x] PROOF 1 DB-layer (AGENT-03 clearance-reduction) — ✅ PASS: L1 `[1]` ⊂ L3 `[1,3]`, zero above-clearance (impersonation)
- [x] PROOF 3 synthetic dims=1024 — ✅ PASS: both synthetic rows `vector_dims=1024`, 0 failing
- [x] RESTORE — ✅ CONFIRMED: `rag_chunks` total = 0; staging clean

**Deploy-gated / auth-gated — ⬜ PENDING the GPU stack + a browser session:**

- [ ] PROOF 3 real-corpus dims=1024 — after [DEPLOY-GATED] bge-m3 re-embed
- [ ] PROOF 1 full e2e (clearance-reduction) — AUTH-GATED, EN + AR, no forbidden substring + CDP forced-error
- [ ] PROOF 2 (EN+AR RTL) — AUTH-GATED, 1024 & 1400 (drawer visual approved on evidence in 72-08)
- [ ] PROOF 5 (e2e smoke) — DEPLOY-GATED + AUTH-GATED
- [ ] INFRA-01/02 smokes — DEPLOY-GATED
- [ ] Deploy-time tasks: bge-m3 re-embed re-run; `mastra_threads`/`mastra_messages` RLS re-apply; `hnsw.iterative_scan` RPC fold
- [ ] AGENT-01..06 + INFRA-01..03 closed with **full** live (e2e) evidence

**Status:** **DB/RLS-layer proofs PASS** (the keystone holds at the RLS layer) and
staging is restored, as of **2026-06-19**. The **end-to-end** copilot-UI proofs
(PROOF 1 full, PROOF 2, PROOF 5) and the **INFRA** smokes remain **PENDING** the
on-prem GPU deploy gate + a real authenticated browser session. This is **not** a
full live-UAT pass — it is a clean split: DB/RLS proven now, e2e + INFRA deferred
to the deploy gate.
