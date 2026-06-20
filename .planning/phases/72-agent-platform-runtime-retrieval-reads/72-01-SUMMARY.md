---
phase: 72
plan: 01
subsystem: agent-platform-runtime-retrieval-reads
tags: [spike, keystone, jwt, copilotkit, mastra, ag-ui, rtl, i18n, test-infra, air-gap]
requires:
  - 'Ollama OpenAI-compatible /v1 (dev/spike stand-in for vLLM per D-02)'
  - 'P68 get_function_security() helper (reused by the AGENT-04 SQL proof)'
provides:
  - 'GATE 1 verdict: JWT reaches tool.execute() via requestContext on @mastra/core 1.43.0 + @ag-ui/mastra 1.0.3 (no middleware workaround)'
  - 'shell_decision: assistant-ui (RECOMMENDED, pending orchestrator 1024px AR visual)'
  - 'GATE 3 verdict: air-gap holds (zero non-local egress, no Copilot Cloud key)'
  - 'agent-runtime workspace registered + vitest infra (Wave-0 test home)'
  - 'copilot i18n namespace (EN+AR) registered + forbidden-substring guard'
  - 'AGENT-05 + AGENT-04 DB schema-proof SQL (for Wave 3)'
affects:
  - '72-05 (production agent-runtime): pins the GATE-1 versions, uses requestContext keystone, completes the package.json stub'
  - '72-06 (tools): un-excludes the __scaffold__ glob + relocates the tool tests'
  - '72-08 (drawer): un-skips copilot.spec.ts; consumes the copilot namespace + token-remap contract'
  - '72-03 (re-embed + hybrid RPC): turns verify-rag-chunks-dims.sql GREEN'
tech-stack:
  added:
    - '@mastra/core 1.43.0 (spike + pinned for prod)'
    - '@ag-ui/mastra 1.0.3 (registerCopilotKit bridge)'
    - '@ai-sdk/openai 3.0.73, ai 6.0.208, zod 4.4.3 (spike)'
    - 'vitest ^4.1.7 (agent-runtime workspace)'
  patterns:
    - 'requestContext (NOT runtimeContext) is the @mastra/core 1.43 DI bag for tools + setContext'
    - 'throwaway spike kept OUT of pnpm-workspace (exact agent-runtime entry, isolated node_modules)'
key-files:
  created:
    - agent-runtime/spike/SPIKE-FINDINGS.md
    - agent-runtime/spike/server.ts
    - agent-runtime/spike/keystone-tool.ts
    - agent-runtime/spike/drive-jwt.ts
    - agent-runtime/spike/airgap-check.ts
    - agent-runtime/spike/client.tsx
    - agent-runtime/spike/copilot-tokens.css
    - agent-runtime/spike/render-evidence.tsx
    - agent-runtime/vitest.config.ts
    - agent-runtime/package.json
    - agent-runtime/src/mastra/tools/__scaffold__/tools.test.ts
    - frontend/tests/e2e/copilot.spec.ts
    - frontend/src/i18n/en/copilot.json
    - frontend/src/i18n/ar/copilot.json
    - scripts/verify-rag-chunks-dims.sql
    - scripts/check-copilot-i18n.mjs
  modified:
    - pnpm-workspace.yaml
    - package.json
    - frontend/src/i18n/index.ts
decisions:
  - 'shell_decision: assistant-ui (RECOMMENDED) — CopilotKit react-ui ships 0 RTL rules + hardcoded shadows; headless fallback is the likely landing shell. Final call pending orchestrator 1024px AR visual.'
  - 'JWT keystone delivery path: setContext-direct via requestContext — NO server-middleware workaround needed on the pinned versions.'
  - 'RuntimeContext→RequestContext rename: on @mastra/core 1.43 tools read context.requestContext.get(...), not runtimeContext (the research/Mastra-doc name is pre-1.43).'
metrics:
  duration_min: 39
  tasks_completed: 3
  files_changed: 19
  commits: 3
  completed: 2026-06-18
---

# Phase 72 Plan 01: De-risk Spike + Wave-0 Test Scaffold + Copilot i18n Summary

The Option-C throwaway spike settled the two MEDIUM-confidence gates the whole phase
hinged on — the JWT reaches `tool.execute()` (GATE 1 / Mastra #4465) via `requestContext`
on pinned `@mastra/core 1.43.0` + `@ag-ui/mastra 1.0.3` with NO middleware workaround, and
the runtime is fully air-gapped (GATE 3, zero non-local egress, no Copilot Cloud key) — and
recommends `shell_decision: assistant-ui` pending the orchestrator's 1024px Arabic visual
check; alongside this it laid the agent-runtime vitest infra, the copilot E2E + tool-test
scaffolds, the AGENT-05/AGENT-04 dimension-proof SQL, and the registered copilot i18n
namespace with an indistinguishable-empty guard.

## What shipped

**Task 1 — Throwaway Option-C spike (`agent-runtime/spike/`, commit `3e0f4010`).**
A real, isolated slice (its own `node_modules`, intentionally NOT in the pnpm workspace)
using the genuine `@ag-ui/mastra` `registerCopilotKit` bridge, one Zod-typed keystone
`read_signals` stub, and an `@ai-sdk/openai` client pointed at local Ollama.

- **GATE 1 (#4465 keystone, AGENT-02) — PASS, empirical.** PROOF A (unit on
  `tool.execute({ requestContext })`) read a non-empty `authorization`; its negative
  control (empty context) correctly flipped to false (the assertion discriminates).
  PROOF B (end-to-end `agent.generate(..., { requestContext, toolChoice:'required' })`
  against Ollama) observed `toolWasCalled=true, authorizationPresentInTool=true`. Result
  recorded to `gate1-result.json` (git-ignored; verdict transcribed in SPIKE-FINDINGS).
- **GATE 3 (air-gap) — PASS, headless.** Instrumented `net`/`tls`/`fetch`, drove a
  forced-tool turn: only `127.0.0.1` contacted, 0 non-local, no Copilot Cloud key set.
- **GATE 2 (RTL/token) — non-visual PASS; visual PENDING.** Built the runnable EN/AR
  render (`client.tsx`) + the `--copilot-kit-*`→IntelDossier token-remap contract
  (`copilot-tokens.css`); `render-evidence.tsx` asserts `dir="rtl"`, the full var remap,
  shadows neutralized, Tajawal under RTL, and token-only surfaces (no raw hex). The
  orchestrator finalizes via the documented `npm run client` → `http://127.0.0.1:5273`
  at 1024px AR.

**Task 2 — Wave-0 test infra (commit `64a395a8`).** Registered `agent-runtime` as the
4th workspace (exact entry, so the spike stays out), added `vitest.config.ts`
(`passWithNoTests` + `__scaffold__` excluded → `pnpm --filter agent-runtime test` exits 0),
the skipped tool-test scaffold (lazy `await import` only — zero top-level `../<tool>`
statics — with the `not.toMatch(/clearance|filtered|restricted/i)` assertion), the skipped
`copilot.spec.ts` (drawer+Cmd+K, EN+AR `dir=rtl`, CDP `setBlockedURLs`→`role="alert"`), and
`verify-rag-chunks-dims.sql` (AGENT-05 `vector_dims<>1024` + AGENT-04 `prosecdef`, reusing
P68 `get_function_security`).

**Task 3 — Copilot i18n namespace (commit `2b73fe75`).** `en/copilot.json` + `ar/copilot.json`
(22 keys each, every UI-SPEC string incl. the neutral no-answer copy and aria-labels),
registered in both `resources` branches of `i18n/index.ts`, plus `check-copilot-i18n.mjs`
(forbidden-substring in keys+values, EN/AR parity, non-empty). Both i18n guards green
(namespace guard now 126 registered).

## Decisions Made

- **`shell_decision: assistant-ui`** (RECOMMENDED, pending orchestrator visual). Grounds:
  RESEARCH-verified CopilotKit react-ui has 0 RTL/logical CSS + hardcoded shadows; the
  token-remap fixes color but not layout directionality. The CopilotKit/AG-UI runtime +
  hooks + (P73) HITL stay regardless — only the message/citation rendering layer is at
  issue. May flip to `copilotkit` if the AR visual clears the bar.
- **JWT keystone path = `setContext`-direct via `requestContext`** (no server-middleware
  workaround). Pinned passing versions: `@mastra/core 1.43.0`, `@ag-ui/mastra 1.0.3`.
- **API rename surfaced:** on 1.43 the DI bag is `RequestContext` (was `RuntimeContext`).
  Downstream tools MUST read `context.requestContext.get('authorization')`. The
  `runtimeContext` name in 72-RESEARCH Pattern 2/3 is pre-1.43.

## Deviations from Plan

### Auto-fixed / adapted (no architectural change)

**1. [Rule 3 - Blocking] `requestContext` not `runtimeContext` on the pinned versions.**

- **Found during:** Task 1 (spike API inspection).
- **Issue:** The plan/RESEARCH Pattern 2/3 read `runtimeContext.get('authorization')` in
  `setContext` and the tool. On the installed `@mastra/core 1.43.0` + `@ag-ui/mastra 1.0.3`
  that name does not exist — the DI bag is `RequestContext`; `setContext`'s 2nd arg and the
  tool's `context.requestContext` are the real names (verified in the installed `.d.ts`).
- **Fix:** Spike code uses `requestContext` end-to-end; recorded the rename prominently in
  SPIKE-FINDINGS as a forward-applying landmine for 72-05/72-06. This is exactly the
  version-API drift the spike exists to catch — it strengthens (not weakens) the GATE 1
  PASS: the keystone works, just under the current name.
- **Commit:** `3e0f4010`.

**2. [Rule 3 - Blocking] `pnpm --filter agent-runtime test` exits 1 on "No test files found".**

- **Found during:** Task 2.
- **Issue:** With the only scaffold excluded, vitest exits 1 by default — failing the
  acceptance criterion (must exit 0).
- **Fix:** Added `passWithNoTests: true` to `agent-runtime/vitest.config.ts` (the standard
  vitest flag for a configured-but-empty suite; harmless once 72-06 adds real tests).
- **Commit:** `64a395a8`.

**3. [Rule 2 - Required for acceptance] Registered `agent-runtime` in the workspace now.**

- **Found during:** Task 2.
- **Issue:** `pnpm --filter` only resolves workspace members; the acceptance criterion
  requires the filter to exit 0 in Wave 1, impossible without registration. The plan's
  fallback ("minimal package.json stub … let 72-05 complete it") implied registration.
- **Fix:** Added the **exact** `agent-runtime` entry to `pnpm-workspace.yaml` + root
  `package.json` workspaces (exact, NOT `agent-runtime/*`, so the throwaway spike stays
  out), plus a minimal stub `package.json` (name + test script + vitest). **72-05 owns the
  full package.json** (deps, build/dev/start/lint/type-check scripts, Dockerfile, src/).
- **Commit:** `64a395a8`.

## Spike hygiene / flag for 72-05

- `agent-runtime/spike/` is THROWAWAY: `node_modules` + `gate*-result.json` are git-ignored;
  the 15 source files are committed as the evidence-of-record. **Flag: delete (or keep
  ignored) `agent-runtime/spike/` before the phase merges.**
- `agent-runtime/package.json` is an **intentional Wave-0 stub** — 72-05 completes it
  (pinning the GATE-1 versions) and `turbo` skips it today (no `build` script).

## Known Stubs

| File                                                        | Reason                                                                                | Resolved by                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------- |
| `agent-runtime/package.json`                                | Wave-0 stub: name + test script only, so `pnpm --filter agent-runtime test` resolves. | 72-05 (full runtime package.json) |
| `agent-runtime/src/mastra/tools/__scaffold__/tools.test.ts` | SKIPPED + excluded; lazy-imports tools that don't exist until Wave 5. RED by design.  | 72-06 (un-exclude + relocate)     |
| `frontend/tests/e2e/copilot.spec.ts`                        | SKIPPED; references the drawer/FAB/Cmd+K that land in Wave 6. RED by design.          | 72-08 (un-skip)                   |
| `scripts/verify-rag-chunks-dims.sql`                        | RED until `rag_chunks` + `hybrid_rag_search` exist.                                   | 72-03 (re-embed + hybrid RPC)     |

These are Nyquist Wave-0 targets (intentionally RED), not goal-blocking stubs — the plan's
goal is to PRODUCE the de-risk verdicts + the test scaffold homes, both delivered.

## Verification

- `agent-runtime/spike/SPIKE-FINDINGS.md` carries `shell_decision:`, the JWT-delivery path,
  pinned `@mastra/core 1.43.0` + `@ag-ui/mastra 1.0.3`, and the air-gap PASS — confirmed.
- `pnpm --filter agent-runtime test` exits 0 (scaffold excluded, no TS import errors).
- `node scripts/check-copilot-i18n.mjs` exits 0; `node scripts/check-i18n-namespaces.mjs`
  exits 0 (copilot registered).
- `scripts/verify-rag-chunks-dims.sql` contains both `vector_dims(embedding) <> 1024` and
  `prosecdef`.

## Pending (orchestrator / downstream)

- **GATE 2 visual confirmation (orchestrator + human):** open `agent-runtime/spike` →
  `npm install && npm run client` → `http://127.0.0.1:5273` at 1024px in Arabic; confirm
  RTL flip + Tajawal + no card shadow, then finalize `shell_decision` (assistant-ui vs
  copilotkit).

## Self-Check: PASSED

All 12 spot-checked created files exist on disk; all 3 per-task commits
(`3e0f4010`, `64a395a8`, `2b73fe75`) exist in git history.
