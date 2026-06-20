# Option-C Spike (Plan 72-01) — THROWAWAY

This directory is a **throwaway de-risk spike**, NOT production. It exists only to
settle three gates before the production `agent-runtime` workspace (Plan 72-05) is
built. **Delete or keep git-ignored before the phase merges.** Its `node_modules` is
git-ignored and intentionally NOT in `pnpm-workspace.yaml` (isolated, standalone npm).

Verdicts are recorded in **`SPIKE-FINDINGS.md`** (the deliverable). This README is the
runbook.

## Prereqs

- A local Ollama at `http://127.0.0.1:11434/v1` with a tool-capable model
  (`qwen3:30b`, `gpt-oss:20b`, or `llama3.2` — avoid the vision-only `qwen3-vl`).
  Override the endpoint/model with `SPIKE_OPENAI_BASE_URL` / `SPIKE_MODEL`.
- `npm install` in THIS directory (isolated throwaway tree).

```bash
cd agent-runtime/spike
npm install
```

## GATE 1 — JWT reaches tool.execute() (Mastra #4465, the keystone)

Proves the caller JWT set in `setContext` reaches `tool.execute()` via `requestContext`.

```bash
npm run gate1:drive        # → prints + writes gate1-result.json (verdict: PASS)
```

What it does: a unit call on the keystone tool's `execute(input, { requestContext })`
with a Bearer token + an empty-context negative control, plus an end-to-end agent run
(`agent.generate(..., { requestContext, toolChoice:'required' })`) against local Ollama.
PASS = the tool reads a non-empty `context.requestContext.get('authorization')`.

## GATE 3 — air-gap (zero egress, no Copilot Cloud key)

```bash
npm run gate3:airgap       # → prints + writes gate3-result.json (verdict: PASS)
```

What it does: instruments `net.connect` / `tls.connect` / global `fetch`, drives a
forced-tool agent turn, and asserts the only host contacted is `127.0.0.1` with no
Copilot Cloud key set.

## GATE 2 — RTL + token fidelity

Two parts. (a) Non-visual contract evidence (executor-runnable):

```bash
npm run gate2:dom          # → prints + writes gate2-dom-result.json (non-visual PASS)
```

(b) The runnable AR render for the **orchestrator's 1024px Arabic visual confirmation**
(the executor cannot screenshot):

```bash
npm run client             # vite dev server → http://127.0.0.1:5273
# open http://127.0.0.1:5273 at 1024px; EN (ltr) and AR (rtl) render side by side.
# confirm in AR: RTL layout flip, Tajawal face, zero visible card shadow.
```

The recommendation in `SPIKE-FINDINGS.md` is **`shell_decision: assistant-ui`** (headless
fallback), pending this visual check. If the AR render clears the CLAUDE.md bar, the
decision may flip to `copilotkit`. Either way the CopilotKit/AG-UI runtime + hooks + HITL
stay; only the message/citation rendering layer is in question.

## Files

| File                  | Role                                                             |
| --------------------- | ---------------------------------------------------------------- |
| `keystone-tool.ts`    | Stub `read_signals` that asserts `requestContext` authorization  |
| `agent.ts`            | One-tool reads-only Mastra agent; model → local Ollama `/v1`     |
| `server.ts`           | Mastra server + `registerCopilotKit` bridge (RESEARCH Pattern 2) |
| `drive-jwt.ts`        | GATE 1 empirical driver                                          |
| `airgap-check.ts`     | GATE 3 egress instrumentation + driver                           |
| `client.tsx`          | GATE 2 runnable EN/AR render (token-bound)                       |
| `copilot-tokens.css`  | GATE 2 `--copilot-kit-*` → IntelDossier token remap contract     |
| `render-evidence.tsx` | GATE 2 non-visual SSR + token-remap contract checks              |
| `SPIKE-FINDINGS.md`   | **The deliverable** — all three verdicts + pinned versions       |
