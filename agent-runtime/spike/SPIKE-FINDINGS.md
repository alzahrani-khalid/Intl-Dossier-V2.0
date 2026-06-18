# Phase 72 — Option-C Spike Findings (Plan 72-01)

**Spike date:** 2026-06-18
**Status:** THROWAWAY. This entire `agent-runtime/spike/` directory is NOT production —
it exists only to settle the two MEDIUM-confidence gates the whole phase hinges on,
plus the air-gap gate. Delete/ignore before merge (`node_modules` is git-ignored; the
source files are kept as the evidence-of-record for downstream plans).

**Runtime used:** local Ollama at `http://127.0.0.1:11434/v1` (OpenAI-compatible,
identical API to vLLM per D-02). Model: `qwen3:30b` (tool-capable). No GPU, no Gemma,
no Copilot Cloud key — the spike only needs an OpenAI-compatible endpoint + the real
`@ag-ui/mastra` + `@mastra/core` packages to prove the gates.

---

## shell_decision: assistant-ui (RECOMMENDED — pending orchestrator 1024px AR visual confirmation + human sign-off)

The production conversational shell recommendation is **`shell_decision: assistant-ui`**
(the headless `@assistant-ui/react` + `@assistant-ui/react-ag-ui` fallback documented in
D-09 / RESEARCH), **NOT** the full CopilotKit `react-ui` shell — grounded in the
RESEARCH-verified evidence that CopilotKit's `react-ui` CSS ships **0 RTL/logical-property
rules and hardcodes box-shadows**, which the token-remap can recolor but cannot make
RTL-correct or shadow-free at the component-layout level.

**This is a recommendation, not a lock.** The executor has no browser/CDP tooling and
cannot do the 1024px Arabic pixel check. GATE 2 here proves the token-remap CONTRACT
holds and a token-bound RTL render is achievable (non-visual evidence below); the
orchestrator + human finalize the visual decision. If the orchestrator's visual check
shows the `--copilot-kit-*` remap + `dir="rtl"` + shadow-neutralization actually clears
the CLAUDE.md design bar at 1024px AR, the decision may flip to `shell_decision: copilotkit`.
**Either way, the CopilotKit/AG-UI runtime + hooks + (P73) HITL stay** — this decision is
only about the message/citation rendering layer.

Why assistant-ui is the likely landing shell (RESEARCH-verified, not re-litigated here):

- CopilotKit `react-ui/src/css/*.css` has **0 RTL/logical-property rules** → Arabic
  renders LTR-ish at the layout level; the token-remap (proven below) fixes COLOR but
  not message-row / composer directionality.
- CopilotKit hardcodes `--copilot-kit-shadow-sm/md/lg` box-shadows on surfaces; we can
  set them to `none` via the vars (proven below), but assistant-ui ships zero foreign
  CSS to override in the first place.
- `@assistant-ui/react` ships a dedicated `/docs/rtl` page + logical Tailwind classes
  that auto-flip under `dir="rtl"` + a `DirectionProvider` — purpose-built for this bar.

---

## GATE 1 — JWT reaches tool.execute() (Mastra #4465, the AGENT-02 keystone) — PASS

**Verdict: PASS, settled empirically.** The caller JWT set in `setContext` DOES reach
`tool.execute()` on the pinned versions. **No server-middleware workaround was needed.**

**Pinned versions that passed (record these — downstream plans pin the same):**

| Package          | Version    |
| ---------------- | ---------- |
| `@mastra/core`   | **1.43.0** |
| `@ag-ui/mastra`  | **1.0.3**  |
| `@ai-sdk/openai` | 3.0.73     |
| `ai`             | 6.0.208    |
| `zod`            | 4.4.3      |

**The literal JWT-delivery path that worked — `setContext`-direct via `requestContext`
(NOT the server-middleware workaround):**

> **Critical API finding the spike surfaced:** on `@mastra/core` 1.43.0 the per-request
> DI bag is **`RequestContext`** — Mastra **renamed `RuntimeContext` → `RequestContext`**.
> The `runtimeContext` name in 72-RESEARCH Pattern 2/3 and the upstream Mastra docs is
> **pre-1.43**. On the pinned versions the consistent name is `requestContext`:
>
> 1. `registerCopilotKit({ setContext: (c, requestContext) => requestContext.set('authorization', c.req.header('authorization')) })`
>    — the 2nd arg of `setContext` is `requestContext: RequestContext<T>` (verified in
>    `@ag-ui/mastra@1.0.3/dist/copilotkit.d.ts`).
> 2. The agent threads it to the tool: `tool.execute(input, context)` where
>    **`context.requestContext`** is the `RequestContext` (verified in
>    `@mastra/core@1.43.0/dist/tools/types.d.ts` → `ToolExecutionContext.requestContext`).
> 3. The agent run-option is `agent.generate(messages, { requestContext })`
>    (verified in `@mastra/core/dist/agent/agent.types.d.ts`).
>
> **#4465 resolves on these pins** because the whole stack uses one consistent
> `requestContext` API end-to-end. The bug class (header dropped before the tool) does
> NOT reproduce here. **Downstream tools MUST read `context.requestContext.get('authorization')`,
> NOT `runtimeContext`.** A server-middleware fallback is wired in `server.ts`
> (`SPIKE_USE_MIDDLEWARE=1`) and was NOT needed.

**Empirical proof (machine output in `gate1-result.json`):**

- **PROOF A — unit on `tool.execute()`:** called the keystone `read_signals` stub's
  `execute(input, { requestContext })` with a Bearer token → tool read a **non-empty
  authorization** (`authorizationPresent: true`). **PASS.**
- **PROOF A — negative control:** same call with an EMPTY `RequestContext` →
  `authorizationPresent: false`. The assertion discriminates, so the positive is real. **PASS.**
- **PROOF B — end-to-end agent run** against local Ollama with the token on the
  `requestContext` run-option, `toolChoice: 'required'`: the tool was **called** AND
  **saw the caller JWT** (`toolWasCalled: true`, `authorizationPresentInTool: true`).
  A downstream post-tool model-replay error (`item_reference`, an AI-SDK-v6 + Ollama
  multi-step quirk) happened AFTER the tool already observed the JWT — it is not on the
  delivery path and does not invalidate the keystone. **PASS.**

The keystone holds: a tool builds `createUserClient(context.requestContext.get('authorization'))`
and RLS enforces clearance. Never fall back to service-role in a tool.

---

## GATE 3 — air-gap (zero egress, no Copilot Cloud key) — PASS

**Verdict: PASS, proven headlessly.** A chat turn completed driving the model + tool
with **no Copilot Cloud key set** and **zero outbound calls to any non-local host**.

**Method:** instrumented the process network layer (`net.connect`, `tls.connect`,
global `fetch`) to classify every destination host local (`127.0.0.1`/`::1`/`localhost`)
vs non-local, then drove a real forced-tool agent turn. (machine output in
`gate3-result.json`.)

- Copilot Cloud key envs set: **none** (`COPILOT_CLOUD_PUBLIC_API_KEY` etc. all empty).
- Distinct hosts contacted during the turn: **`127.0.0.1` only** (Ollama).
- Non-local contacts: **0**.
- Turn exercised the model + tool path: yes.

The self-hosted runtime requires no `publicApiKey`; pointing the model client at
`127.0.0.1` Ollama (→ vLLM in prod) is fully on-prem. Air-gap holds.

---

## GATE 2 — RTL + token fidelity — non-visual evidence PASS; visual confirmation PENDING

**Verdict: non-visual contract PASS; the 1024px AR pixel confirmation is the
orchestrator's + human's call** (executor has no screenshot/CDP tooling).

**What the spike PROVED (machine output in `gate2-dom-result.json`):**

- The render (`client.tsx`) emits an assistant message + citation chip with
  **`dir="rtl"`**, Arabic script, and the token-bound classes
  (`.copilot-surface`/`.copilot-message`/`.copilot-citation`). **PASS.**
- The `--copilot-kit-*` → IntelDossier token remap CONTRACT holds in
  `copilot-tokens.css`: `background→--surface`, `foreground→--ink`, `primary→--accent`,
  `border→--line`, `separators→--line-soft`, `muted→--ink-mute`; **all
  `--copilot-kit-shadow-*` neutralized to `none`**; Tajawal applies under `[dir='rtl']`;
  message + citation surfaces declare `box-shadow: none`; **no raw hex** on the
  message/citation surfaces (token-only). **PASS.**

**What still needs a human (the part the executor cannot do):**

> **Orchestrator action — 1024px AR visual confirmation.** Open the runnable render and
> confirm in Arabic: (1) the layout FLIPS RTL (role label leads at inline-start = right),
> (2) the Tajawal face renders on Arabic text, (3) zero visible card shadow on the
> message + citation surfaces. **Run command:**
>
> ```bash
> cd agent-runtime/spike
> npm install              # isolated throwaway node_modules (NOT in the pnpm workspace)
> npm run client           # vite dev server → http://127.0.0.1:5273
> # open http://127.0.0.1:5273 at 1024px; the page shows EN (ltr) and AR (rtl) side by side
> ```
>
> If the AR column clears the CLAUDE.md bar visually, `shell_decision` MAY flip to
> `copilotkit` (the remap is sufficient). If the message-row / composer directionality
> looks LTR-ish despite `dir="rtl"` (the RESEARCH-predicted failure — CopilotKit ships 0
> RTL rules), the **`assistant-ui` headless fallback is the landing shell** as recommended
> above. The token-remap contract proven here is the COLOR half either way.

---

## Throwaway-spike hygiene

- `agent-runtime/spike/node_modules/` is git-ignored (throwaway, isolated; intentionally
  NOT added to `pnpm-workspace.yaml`).
- The `gate{1,2,3}-result.json` machine outputs are git-ignored (regenerate by running
  the gate scripts); their verdicts are transcribed above as the record.
- **Flag for merge:** delete `agent-runtime/spike/` (or keep ignored) before the phase
  merges. The PRODUCTION `agent-runtime` workspace is built in Plan 72-05; it pins the
  versions recorded under GATE 1 and uses the `requestContext` keystone path proven here.

## Gate scripts (re-run to regenerate evidence)

| Gate   | Command (in `agent-runtime/spike/`)                          | Output                  |
| ------ | ------------------------------------------------------------ | ----------------------- |
| GATE 1 | `npm run gate1:drive`                                        | `gate1-result.json`     |
| GATE 3 | `npm run gate3:airgap`                                       | `gate3-result.json`     |
| GATE 2 | `npm run gate2:dom` (non-visual) + `npm run client` (visual) | `gate2-dom-result.json` |
