---
phase: 74
slug: eval-gate-anythingllm-retirement
plan: 10
artifact: live-UAT
status: authored-DEPLOY-GATED
authored: 2026-06-21
requirements: [EVAL-04]
related:
  ci_job: .github/workflows/ci.yml (eval-gate — the CI complement, runs now)
  cdp_pattern: MEMORY project_cdp_forced_error_uat_protocol
  static_guard: scripts/check-no-anythingllm.mjs (the source-level guard, runs now)
---

# Phase 74 — EVAL-04 network-block live UAT (AnythingLLM retirement proof)

> **The runtime proof of the EVAL-04 success criterion:**
> _"the critical AI path — search suggestions, dashboard digest, assistant — makes
> zero AnythingLLM calls, verified by blocking the AnythingLLM endpoint at the
> network level and confirming all three surfaces continue to function."_
>
> This is a **live UAT, NOT a CI test** (D6). The CI side of EVAL-04 is the static
> source guard (`scripts/check-no-anythingllm.mjs`, wired as a **required** check in
> the `eval-gate` job) which proves the three surfaces carry **zero AnythingLLM
> references in source**. This UAT proves the complementary runtime fact: with the
> AnythingLLM origin **unreachable at the network layer**, all three surfaces still
> work — there is no live dependency, not just no source reference.

## Status banner (2026-06-21)

> **AUTHORED — DEPLOY-GATED.** This spec was authored by the 74-10 executor (no GPU /
> gemma stack + no authenticated browser in its toolset). The three surface checks
> are **DEPLOY-GATED** behind the same on-prem stack as P72/P73 (vLLM Gemma + TEI
> bge-m3) and **AUTH-GATED** behind a real authenticated browser session on staging.
> They stay `⬜ PENDING` until that gate clears. The **CI complement** (the static
> `check:no-anythingllm` guard + its planted-fixture positive-failure) is a **required
> check that runs now**, and the **digest** surface (PROOF B) is pure-SQL / zero-LLM
> so it is verifiable independent of the GPU stack.
>
> **Do NOT self-sign the DEPLOY-GATED / AUTH-GATED checks.** Run them in a real
> browser against staging after the stack is up, then **restore** any seed used.

## Authoring vs Execution split (read first)

The on-prem model stack (vLLM/Gemma + TEI) is **not running in the authoring
environment**, and RLS/empty-result realities mean a network-block failure surfaces
as an **empty 200 + neutral copy**, not an HTTP error (carried lock — P68/P69/P71/P72
MEMORY). So the block is applied at the **CDP layer** (`Network.setBlockedURLs`) and
every assertion is made **via DOM** (a visible results list / empty-state / streamed
reply / `role="alert"`), **never** an HTTP status. Each check is tagged with who runs
it and when:

| Tag                | Meaning                                                                                                | Who / When                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| **[CI-NOW]**       | The static source guard runs now as a required check (`eval-gate`) — no GPU, no browser.               | CI, every push/PR                              |
| **[DEPLOY-GATED]** | Needs the on-prem stack: vLLM Gemma on `/v1` + TEI bge-m3 (`$TEI_EMBED_URL/embed` → 1024-dim) + nginx. | After the deploy gate (the P72 GPU-host setup) |
| **[AUTH-GATED]**   | Needs a **real** authenticated browser session (admin login + the CDP bridge). NOT service-role.       | After deploy, in a browser against staging     |

**Result legend:** ⬜ PENDING · ✅ PASS · ❌ FAIL · ⚠️ FLAKY · ⚪ NOT APPLIED (intentionally) · N/A not applicable here

---

## Setup

1. **Target:** the staging app (Supabase project `zkrcjzdemdmwhearhfgg`).
2. **Login:** admin `kazahrani@stats.gov.sa` (password from `.env.test`). Use a **real**
   authenticated session — **never** service-role (service-role bypasses RLS — the P69
   landmine; an empty result from RLS would otherwise look like the block working).
3. **CDP bridge:** drive Chrome over the CDP `Network.setBlockedURLs` bridge per
   `project_cdp_forced_error_uat_protocol`. Keep a **DevTools Network tab** open (or read
   `Network.requestWillBeSent` events) so you can assert **zero requests** ever reach the
   AnythingLLM origin — this is the positive evidence that the surface used the on-prem
   path (TEI / agent-runtime / pure SQL), not AnythingLLM.
4. **Languages:** run each surface in **EN and AR** where the surface renders copy (toggle
   AR via the ع button — `localStorage['id.locale']='ar'`, dir=rtl + Tajawal).

### The block step — CDP `Network.setBlockedURLs` on the AnythingLLM origin

Block the AnythingLLM origin at the network layer **before** exercising the surfaces.
AnythingLLM was reachable (pre-retirement) as the `anythingllm:3001` container behind the
nginx `/llm/` proxy (`deploy/nginx/nginx.conf:54,144`) at `/api/v1/embed`. Block **every**
shape it could take:

```
Network.setBlockedURLs({ urls: [
  "*anythingllm*",   // any host/path containing the token (container name, build-arg URL)
  "*:3001/*",        // the container port
  "*/llm/*",         // the deployed nginx reverse-proxy path
  "*/api/v1/embed*", // the AnythingLLM embeddings endpoint specifically
]})
```

> **CDP glob note (carried lock):** `*` **crosses `/`** in CDP block patterns, so
> `*/llm/*` matches the full proxied path and `*anythingllm*` matches any URL containing
> the token. Verify the block is live (request a known AnythingLLM URL and see it fail in
> the Network tab) **before** running the surface checks, so a green surface can't be a
> false pass from a block that never armed.

After the run, **clear** the block (`Network.setBlockedURLs({ urls: [] })`).

---

## PROOF A — Search suggestions / semantic search (with AnythingLLM blocked)

**Surface:** semantic search — `supabase/functions/{search-semantic,semantic-search-unified,position-suggestions-get}/index.ts`, re-pointed to **TEI bge-m3** (`$TEI_EMBED_URL/embed`, 1024-dim) in 74-03. **No AnythingLLM** on this path.

**Claim:** With the AnythingLLM origin blocked, a semantic search still returns results
(TEI-backed, on-prem) — or **gracefully degrades** to the full-text fallback / empty-state —
**never hangs and never surfaces an AnythingLLM error**. Zero requests reach the AnythingLLM
origin.

**How ([DEPLOY-GATED] + [AUTH-GATED]):** with the block armed, run a semantic search (e.g.
a global search query / the position-suggestions surface). Wait through any TanStack retry.
Assert via **DOM**: a results list **or** the neutral empty-state renders; no spinner is
stuck; no AnythingLLM error/host string appears. Confirm in the Network tab that **zero**
requests hit the AnythingLLM origin and the embedding call (if any) went to `$TEI_EMBED_URL`.

| Check                                                            | Tag                           | Result     | Evidence (DOM + Network tab)                               |
| ---------------------------------------------------------------- | ----------------------------- | ---------- | ---------------------------------------------------------- |
| A1. Semantic search returns results OR graceful empty-state (EN) | [DEPLOY-GATED] + [AUTH-GATED] | ⬜ PENDING | _(results list / empty-state in DOM; no stuck spinner)_    |
| A2. Zero requests reach the AnythingLLM origin                   | [DEPLOY-GATED] + [AUTH-GATED] | ⬜ PENDING | _(Network tab: 0 `*anythingllm*` / `*/llm/*` requests)_    |
| A3. No AnythingLLM error/host string in the rendered surface     | [DEPLOY-GATED] + [AUTH-GATED] | ⬜ PENDING | _(grep rendered DOM for `anythingllm` = 0)_                |
| A4. Repeat A1–A3 in **AR**                                       | [DEPLOY-GATED] + [AUTH-GATED] | ⬜ PENDING | _(AR results/empty-state; dir=rtl; no AnythingLLM string)_ |

---

## PROOF B — Dashboard digest (with AnythingLLM blocked)

**Surface:** the dashboard digest — `frontend/src/hooks/useDashboardDigest.ts` →
`generate_digest()` RPC (P70). **Pure SQL, zero-LLM** — must be **wholly unaffected** by the
AnythingLLM block.

**Claim:** With the AnythingLLM origin blocked, the dashboard digest renders identically — it
never touched AnythingLLM (or any LLM), so the block is a no-op for this surface.

**How:** with the block armed, open the dashboard. Assert via **DOM** that the digest section
renders its KPI/summary content (not an error / empty card). Because this is pure SQL, this
check is the **least** gated — it does **not** need the GPU stack, only an authenticated
session ([AUTH-GATED] only).

| Check                                                             | Tag          | Result     | Evidence (DOM + Network tab)                              |
| ----------------------------------------------------------------- | ------------ | ---------- | --------------------------------------------------------- |
| B1. Dashboard digest renders with AnythingLLM blocked (EN)        | [AUTH-GATED] | ⬜ PENDING | _(digest content in DOM; no error card)_                  |
| B2. Zero requests reach the AnythingLLM origin from the dashboard | [AUTH-GATED] | ⬜ PENDING | _(Network tab: 0 `*anythingllm*` requests; SQL RPC only)_ |
| B3. Repeat B1 in **AR**                                           | [AUTH-GATED] | ⬜ PENDING | _(AR digest; dir=rtl + Tajawal)_                          |

---

## PROOF C — Assistant / copilot (with AnythingLLM blocked)

**Surface:** the copilot — `frontend/src/components/copilot/{useCopilotRuntime.ts,CopilotSurface.tsx}` → `/api/copilot/chat` → agent-runtime `getCopilotModel()` (vLLM in prod / Ollama in dev). **On-prem only.** The legacy **ChatDock** was un-mounted + retired in 74-02 (D2) — there is **no second assistant surface**.

**Claim:** With the AnythingLLM origin blocked, the copilot still answers a turn from the
on-prem stack — and the **legacy ChatDock is GONE** (no `<ChatDock>` in `_protected.tsx`, no
`/api/ai/chat` consumer).

**How ([DEPLOY-GATED] + [AUTH-GATED]):** with the block armed, open the copilot drawer (Topbar
FAB) and send a turn. Assert via **DOM** an SSE-streamed, token-bound reply (deploy-gated on the
gemma stack). Separately confirm — by inspection of the running app — that **no** ChatDock
surface mounts (the FAB is the sole assistant entry point) and **zero** requests reach the
AnythingLLM origin. Forced-error variant: keep the block armed and (per
`project_cdp_forced_error_uat_protocol`) also block the copilot tool call → wait through the
TanStack 3× retry → assert `role="alert"` + the neutral no-answer copy via DOM (no AnythingLLM
string; no `/clearance|filtered|restricted/i` per the indistinguishable-empty lock).

| Check                                                            | Tag                           | Result     | Evidence (DOM + Network tab)                                    |
| ---------------------------------------------------------------- | ----------------------------- | ---------- | --------------------------------------------------------------- |
| C1. Copilot drawer → streamed on-prem reply (EN)                 | [DEPLOY-GATED] + [AUTH-GATED] | ⬜ PENDING | _(SSE reply in DOM; cites gated data scoped to caller JWT)_     |
| C2. Legacy ChatDock is GONE (no second assistant surface)        | [AUTH-GATED]                  | ⬜ PENDING | _(no `<ChatDock>` mounts; FAB is the only assistant entry)_     |
| C3. Zero requests reach the AnythingLLM origin from the copilot  | [DEPLOY-GATED] + [AUTH-GATED] | ⬜ PENDING | _(Network tab: 0 `*anythingllm*` requests; on-prem path only)_  |
| C4. Forced-error → `role="alert"` + neutral copy, no AnythingLLM | [DEPLOY-GATED] + [AUTH-GATED] | ⬜ PENDING | _(CDP block the tool call; DOM assert; no forbidden substring)_ |
| C5. Repeat C1, C3–C4 in **AR**                                   | [DEPLOY-GATED] + [AUTH-GATED] | ⬜ PENDING | _(AR reply / neutral copy; dir=rtl + Tajawal)_                  |

---

## Pass criteria + evidence checklist

The EVAL-04 success criterion is met when, **with the AnythingLLM origin blocked at
`Network.setBlockedURLs`**, all of the following hold (DOM-asserted, EN + AR where the surface
renders copy):

- [ ] **PROOF A** — semantic search returns results **or** degrades gracefully (no hang, no
      AnythingLLM error); zero AnythingLLM requests; passes in EN + AR.
- [ ] **PROOF B** — dashboard digest renders unchanged (pure SQL); zero AnythingLLM requests;
      passes in EN + AR.
- [ ] **PROOF C** — copilot answers from the on-prem stack; legacy ChatDock is GONE; zero
      AnythingLLM requests; forced-error → neutral `role="alert"` copy; passes in EN + AR.
- [ ] **Network evidence** — across all three surfaces, the DevTools Network tab shows **zero**
      requests to `*anythingllm*` / `*:3001/*` / `*/llm/*` / `*/api/v1/embed*`.
- [ ] **DOM evidence** — every assertion is a DOM check (results list / empty-state / streamed
      reply / `role="alert"`), never an HTTP status (RLS/block failures surface as empty 200s).
- [ ] **No forbidden substring** — the rendered copilot empty/error state contains no
      `/clearance|filtered|restricted/i` (indistinguishable-empty) and no `anythingllm` string.

### Cross-reference — the CI complement (runs now)

The **source-level** half of EVAL-04 runs now as a **required** CI check in the `eval-gate`
job (`.github/workflows/ci.yml`): `pnpm run check:no-anythingllm` greps the three critical
surfaces for `anythingllm` and a planted-fixture positive-failure proves the guard fails on a
re-added reference. This UAT is the **runtime** half — together they prove zero AnythingLLM
dependency at both source and runtime.

The **live judge-scoring** half of the phase (EVAL-01/03 generative scoring) is verified by
the **deploy-gated, non-blocking** live-mode step of the same `eval-gate` job
(`if: secrets.EVAL_AI_URL != ''`), not by this UAT.

---

## Sign-off

**CI complement — runs now ([CI-NOW]):**

- [x] `check:no-anythingllm` is a **required** step in the `eval-gate` job (zero AnythingLLM
      references on the 3 critical surfaces) — ✅ wired in 74-10 (`.github/workflows/ci.yml`).
- [x] Planted-fixture positive-failure asserts the guard exits 1 on a re-added reference — ✅ wired.

**Live UAT — ⬜ PENDING the GPU stack + a real browser session:**

- [ ] PROOF A (semantic search, EN + AR) — DEPLOY-GATED + AUTH-GATED
- [ ] PROOF B (dashboard digest, EN + AR) — AUTH-GATED (pure SQL, no GPU)
- [ ] PROOF C (copilot + ChatDock-gone + forced-error, EN + AR) — DEPLOY-GATED + AUTH-GATED
- [ ] Network-tab evidence of zero AnythingLLM requests across all three surfaces
- [ ] Restore any seed used after the run

**Status:** **AUTHORED — DEPLOY-GATED** as of **2026-06-21**. The CI source-guard complement is
wired and required now; the three runtime surface checks stay **PENDING** the on-prem GPU
deploy gate + a real authenticated browser session. This is **not** a full live-UAT pass — it
is a clean split: the source guard is enforced now, the network-block runtime proof is deferred
to the deploy gate.
