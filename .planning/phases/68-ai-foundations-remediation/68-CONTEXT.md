# Phase 68: AI Foundations Remediation - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

The hard gate for milestone v7.0. Phase 68 remediates three existing-code foundations that every later phase (69–74) inherits, plus stands up two milestone-wide guardrails. **No new intelligence features** — this is remediation + scaffolding only.

In scope:

1. **One canonical clearance scale** (REMED-01) — reconcile the two competing user-clearance sources and the inconsistent sensitivity usage onto a single integer comparison model.
2. **Embedding-geometry integrity** (REMED-04, REMED-02 search half) — stop the pad/truncate corruption; land a native-1024 write path.
3. **The interactive AI path honors RLS** (REMED-03, REMED-02) — retire `supabaseAdmin` from the assistant; gate search + assistant by the caller's clearance.
4. **Self-hosted observability scaffolding** (REMED-05) — Langfuse + Phoenix via OTel, zero egress.
5. **i18n-namespace CI guard** (REMED-06) — fail CI on unregistered namespaces (silent-English-fallback guard).

Out of scope (deferred to later phases — do NOT pull forward):

- Full `bge-m3` re-embed of existing content + TEI production serving → **Phase 72**.
- Mastra / CopilotKit / vLLM / Gemma / `agent-runtime` workspace → **Phase 72+**.
- Backend `clearance-check.ts` middleware implementation → later (DB RLS is the real enforcement this phase).
- AnythingLLM decommission → **Phase 74** (P68 may still use it on the current search path).

</domain>

<decisions>
## Implementation Decisions

### Canonical clearance model (REMED-01)

- **D-01:** Single integer comparison domain — `sensitivity_level <= clearance_level` on a **1–4** scale. The 3 existing content tiers occupy 1–3; **level 4 is reserved** (a clearance-4 user sees everything) for a future top-secret signal class. No reclassification of existing content in P68. _(User delegated this one — "you decide"; see Claude's Discretion.)_
- **D-02:** `profiles.clearance_level` is the single per-user source of truth, **independent of RBAC role**. Backfill it from each user's current role-derived clearance value during the migration.
- **D-03:** Migrate via a **backward-compat shim** — rewrite `get_user_clearance_level()` to read `profiles.clearance_level` and return the canonical 1–4. The ~8+ existing RLS policies that call it keep working unchanged; rewrite individual policies opportunistically in later work, not this phase.
- **D-04:** P68 clearance scope = **DB/RLS + `SECURITY INVOKER` RPCs + AI read paths only**. The backend `clearance-check.ts` middleware placeholder (allows-all, line 44) stays **out of scope** — DB RLS is the real enforcement; app-layer defense-in-depth is a later concern.

### Embedding fix scope (REMED-04 / REMED-02)

- **D-05:** **Land the native-1024 write path in P68.** Remove `normalizeEmbedding` pad/truncate; write native 1024-dim vectors (via the existing **local `bge-m3` ONNX dev embedder**) into a new 1024 `halfvec` store. Satisfies roadmap success criterion #4 (`array_length(embedding,1) = 1024` on a new write). Researcher confirms new-column-vs-new-table shape.
- **D-06:** **Leave** the existing pad/truncate-corrupted (mixed-dim) vectors for the **Phase 72** full `bge-m3` re-embed; the old column is dropped then. P68 stops _new_ corruption only.
- **D-07:** Interim semantic-search quality **may degrade to the existing full-text/keyword fallback** for not-yet-re-embedded content; full vector quality returns at P72. Honest degradation; keeps the gate tight.
- Note: **TEI production serving** (bge-m3 + bge-reranker) is **Phase 72**. P68 uses the local ONNX dev embedder only — it does **not** stand up TEI.

### Assistant under RLS (REMED-03 / REMED-02)

- **D-08:** Retire `supabaseAdmin` from `chat-assistant.ts`; the assistant reads under the **caller's JWT** and sees **only caller-clearance content**. No elevated reads in the interactive path. Any genuine system-wide aggregation moves to a separate **cron/service-role path with explicit app-layer authz** — never the interactive assistant.
- **D-09:** When clearance-filtering yields nothing, return an **indistinguishable generic "no results"** — it must NOT reveal whether above-clearance content exists (need-to-know). Matches the current empty-on-RLS-denial behavior. **Downstream must not add "filtered by clearance" messaging.**
- **D-10:** While rewiring to JWT clients, **repoint the legacy `commitments` / `engagements` reads to the canonical `aa_commitments` / `engagement_dossiers` tables** — so the assistant returns correct data AND honors RLS, avoiding a second touch of this file. In-domain correctness fix, not a new capability.
- Mechanism note: search-path clearance (REMED-02) is enforced via a **`SECURITY INVOKER` RPC keyed off the caller JWT** (new RPCs are INVOKER, never DEFINER — locked).

### Guardrails scope (REMED-05 / REMED-06)

- **D-11:** Observability — stand up **both Langfuse + Phoenix** containers in `docker-compose` with OTel/OpenLLMetry export, to the **minimal depth needed to trace one end-to-end AI request**. In P68 only the **existing AI paths** (chat-assistant + semantic search) are traced (`agent-runtime` is P72). **Zero telemetry egress.**
- **D-12:** i18n-namespace CI guard — **fold into the existing required `Lint` context** (an ESLint rule or a lint-invoked script that scans React `useTranslation` namespaces against the `src/i18n/index.ts` registry). **No new branch-protection context** (stays at 8 on `main`). Researcher handles exact mechanism, including the array-form `useTranslation([...])` case.

### Claude's Discretion

- **D-01 (scale alignment):** User said "you decide." Chose 3 content tiers (1–3) + reserved level 4 with a single integer `<=` comparison, optimizing for least disruption and a clean comparison with room to grow. Flexibility retained if the researcher finds the live schema demands a different shape (see RF-1).
- **Embedding store shape** (new column vs new table) — researcher's call.
- **i18n guard mechanism** (custom ESLint rule vs lint-invoked script) — researcher's call.

</decisions>

## Open Questions for Research (resolve before/during planning)

These are factual gaps the researcher must close against **live staging** (`zkrcjzdemdmwhearhfgg`) — several decisions above assume facts the spec stated differently than the code:

- **RF-1 — `sensitivity_level` actual type/range.** The design spec says `dossiers.sensitivity_level` is `low/med/high` (string), but live migrations treat it as **INTEGER** (`>= d.sensitivity_level`; retention-policy comment says "1-4"; direct numeric `<=`/`>=`). Confirm the live column type and value distribution. **Normalize the one legacy string-`CASE` policy** in `supabase/migrations/20250930005_create_briefs_table.sql` to the integer comparison (D-01).
- **RF-2 — Assistant JWT context.** Confirm `backend/src/ai/agents/chat-assistant.ts` runs in an **authenticated request context that carries the caller's JWT**. If any invocation is background/no-user, that path needs the cron+app-authz treatment, not the JWT keystone (D-08).
- **RF-3 — Authoritative clearance source + backfill.** Two sources exist: `get_user_clearance_level()` reads `user_roles` (returns **1–3**); newer RLS reads `profiles.clearance_level` (**1–4**). Confirm the **role-derived → `profiles.clearance_level` backfill mapping** for all existing users so no one is silently widened/narrowed (D-02, D-03).
- **RF-4 — Embedding store inventory.** Map all embedding stores — `search-semantic` edge fn (currently embeds via **AnythingLLM**), backend `intelligence-embeddings.ts` (silent-null on failure, CONCERNS.md:122), and the `rag_chunks` store (P72). Confirm which store(s) the P68 native-1024 write path applies to (D-05).

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & requirements (read first)

- `docs/superpowers/specs/2026-06-13-v7.0-intelligence-engine-design.md` — locked decisions §2, **remediation-first §3** (the 3 fixes), roadmap §4, cross-cutting guarantees §5
- `docs/research/v7.0-ai-architecture-research-2026-06-13.md` — authoritative architecture analysis (§2.5 JWT keystone, §3 options)
- `.planning/REQUIREMENTS.md` — REMED-01..06 + Cross-Cutting Guarantees
- `.planning/milestones/v7.0-ROADMAP.md` → "Phase 68" — goal + 5 success criteria (note SC#4 = native-1024 new write; SC#5 = trace one request)
- `.planning/ROADMAP.md` → "### Phase 68" — same detail (synced into main roadmap this session)

### Code touchpoints (remediation targets)

- `backend/src/ai/agents/chat-assistant.ts` — `supabaseAdmin` import (line 14) + service-role reads to rewire (lines ~158–339): `dossiers`×5, `commitments`, `engagements` (REMED-03; D-08/D-10)
- `supabase/functions/search-semantic/index.ts` — `normalizeEmbedding` pad/truncate to 1536 (lines 54, 67–78) + RPC call path; AnythingLLM embedding source (REMED-04/02; D-05)
- `supabase/migrations/20250930001_helper_functions.sql` → `get_user_clearance_level` (line 43; documented 1–3, reads `user_roles`) — compat-shim target (REMED-01; D-03)
- `supabase/migrations/20250930005_create_briefs_table.sql` — legacy `CASE sensitivity_level` policy to normalize (RF-1)
- `supabase/migrations/20251022000009_update_polymorphic_refs.sql` (lines 102, 119) — the canonical clearance comparison pattern `sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())` to converge on
- `backend/src/middleware/clearance-check.ts` (line 44) — allows-all placeholder, explicitly **OUT** of P68 scope (D-04)

### Observability & guard

- `backend/src/ai/mastra-config.ts` — existing Mastra config (OTel wiring base for D-11)
- `frontend/src/i18n/index.ts` — the namespace registry the CI guard checks (D-12); i18n is **static-bundled** (no http-backend) — unregistered namespaces silently fall back to English

### Codebase maps (context)

- `.planning/codebase/CONCERNS.md` — clearance placeholder (§clearance-check), vector dimension constraint, silent-null embeddings (`intelligence-embeddings.ts:104`)
- `.planning/codebase/INTEGRATIONS.md`, `.planning/codebase/ARCHITECTURE.md` — AI/Supabase wiring (available; not read in full)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Keyword/full-text fallback already exists** in `search-semantic/index.ts` — D-07's interim degradation relies on it; no new fallback needed.
- **Local `bge-m3` ONNX dev embedder** (per spec §2, MIT) — the native-1024 source for D-05; no TEI required in P68.
- **Canonical clearance RLS pattern** already in the codebase (`20251022000009`) — D-02/D-03 converge existing policies onto it rather than inventing a new shape.
- **`rls-audit.test.ts` `sensitiveTables`** (extended in Phase 54) — extend to assert the canonical scale across sensitive tables (verification).

### Established Patterns

- **Migrations via Supabase MCP** to staging `zkrcjzdemdmwhearhfgg`, committed as forward migrations (project decision D-15).
- **New RPCs `SECURITY INVOKER`** (never DEFINER) so retrieval/analytic RPCs honor the caller's RLS — locked across v7.0.
- **Live UAT discipline:** seed → observe → restore on staging, EN+AR. RLS-denial verification via **CDP `Network.setBlockedURLs`** forced-error protocol (RLS denial returns empty `200`s, so assert on `role="alert"`/empty-state, not HTTP status).
- **CI required contexts:** `main` has 8; D-12 deliberately avoids a 9th by folding into `Lint`.

### Integration Points

- `chat-assistant.ts` — the supabaseAdmin → JWT-client swap + legacy-table repoint (D-08/D-10).
- `search-semantic` edge fn — embedding write/read path + the clearance-gated SECURITY INVOKER RPC (D-05, REMED-02).
- `docker-compose.prod` — new Langfuse + Phoenix containers (D-11).
- Root `eslint.config.mjs` + the `Lint` CI job — i18n guard placement (D-12).

</code_context>

<specifics>
## Specific Ideas

- **"Indistinguishable empty" is a deliberate security posture** (D-09), not a UX gap — downstream MUST NOT add messaging that reveals above-clearance content exists.
- **P68 must not pull Phase 72+ infra forward.** Allowed in P68: the local `bge-m3` ONNX dev embedder, Langfuse + Phoenix containers, OTel wiring. NOT allowed in P68: TEI serving, vLLM, Gemma, Mastra `agent-runtime` workspace, full re-embed of existing content.
- **Verification bar** follows the milestone cross-cutting guarantee: a non-cleared account, seeded above-clearance content, and proof of zero leakage via **both** the search path and the assistant — live on staging, EN+AR.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Adjacent work that surfaced is already roadmapped: full re-embed + TEI → P72; AnythingLLM retirement → P74; backend `clearance-check.ts` middleware → later, per D-04.)

</deferred>

---

_Phase: 68-AI Foundations Remediation_
_Context gathered: 2026-06-14_
