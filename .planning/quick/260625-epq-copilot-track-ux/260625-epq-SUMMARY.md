---
quick_id: 260625-epq
slug: copilot-track-ux
description: Copilot drawer Track-UX wave-2 — P0 (work-item/generic tool renderers, collapsible reasoning, tool-running cue, ThreadList + titled header) + P1 (aria-live, focus-on-open, retry-on-error)
date: 2026-06-25
status: complete
---

# Quick Task 260625-epq — Copilot "Track UX" (wave-2) — SUMMARY

Implemented the **Track UX** section of `scratchpad/wave2-plan.md` for the copilot
drawer (`frontend/src/components/copilot/*`): **all P0** items, then **all P1** items
(build stayed green throughout). Executed on the main tree (not a worktree) so the
required `tsc + eslint + vitest` verification could run against installed deps.

## Commits (atomic, in order)

| Commit     | Scope                                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `2fd1fb27` | P0 — `query_work_items` renderer (InlineWorkItemCard) + generic `tools.Fallback` card (GenericToolResultCard) + per-tool running cue (ToolRunningIndicator) + i18n |
| `bfe5035c` | P0 — collapsible Reasoning message-part (`<details>`, collapsed by default) + i18n                                                                                 |
| `c5e0cfca` | P0 — titled drawer header (CopilotHeader) + wires the built-but-unused ThreadList + i18n                                                                           |
| `b44089ee` | P1 — aria-live assistant body + focus-composer-on-open + retry-on-error affordance                                                                                 |

## What changed (by plan item)

### P0

1. **GenUiToolUIs.tsx — `query_work_items` renderer + generic fallback.**
   - New `InlineWorkItemCard.tsx` — thin token-bound card mirroring WorkItemCard's
     status/priority/deadline badge language (NOT the heavy page card, whose
     `UnifiedWorkItem` fields the tool result lacks). Normalizes the untrusted partial
     row from the captured AG-UI stream (`{ workItems:[{id,title,title_ar,status,
priority,due_date,…}] }`), bidi title (prefers `title_ar` in AR), deep-links to
     `/my-work`. Registered via `makeAssistantToolUI` (capped at 5, rest summarized).
   - New `GenericToolResultCard.tsx` — wired as `MessagePrimitive.Parts
components.tools.Fallback`. Catches any tool with NO dedicated renderer (the
     fixed-allowlist genUI + propose\_\* HITL cards still win: assistant-ui resolves
     `toolUIs[name] ?? Fallback`). Renders the tool name + a capped, LTR-isolated JSON
     preview instead of bare text.
2. **CopilotMessageList.tsx — collapsible Reasoning.** New `Reasoning` message-part
   rendered as a native `<details>`, COLLAPSED by default; chain-of-thought as plain
   text (no markdown/HTML injection surface) in a muted token-bound panel.
3. **Tool-running cue from TOOL_CALL_START.** New `ToolRunningIndicator.tsx` (shared
   caret + per-tool label) rendered by the tool renderers while `status==='running'` —
   the primary perceived-latency cue once reasoning is suppressed. New i18n keys
   `streaming.searching` + `streaming.tool.{query_work_items,get_dossier,list_dossiers,
read_signals}` (EN+AR).
4. **CopilotSurface/CopilotHeader — ThreadList + titled header.** New `CopilotHeader.tsx`
   at the top of CopilotSurfaceBody (inside the runtime provider): visible title + a
   history toggle that reveals the previously-unused `ThreadList` (past conversations +
   New conversation) in a bounded scroll region, collapsed by default. One data path —
   desktop Sheet + mobile BottomSheet both inherit it.

### P1

- **aria-live**: assistant message parts wrapped in `aria-live="polite"` so streamed
  answers announce.
- **focus-on-open**: `onOpenAutoFocus` on both Sheet + BottomSheet puts the caret in the
  composer on open (the new header button would otherwise take default focus).
- **retry-on-error**: a neutral `role="alert"` row + `ActionBarPrimitive.Reload` control
  shown ONLY when the message status is incomplete/error (existing `error.body` /
  `error.retry` strings; the control was never rendered). Indistinguishable-empty kept.
- **optimistic send-ack**: verified already native — assistant-ui appends the user turn
  before the run starts. No change (YAGNI).

## Design compliance (CLAUDE.md)

Tokens only (no raw hex / Tailwind color literals — semantic `--danger-soft`/`--warn-soft`/
`--info-soft` + `text-danger`/`text-warning`/`text-success`/`text-info`/`text-ink-mute`
mirroring InlineSignalCard); borders `1px solid var(--line/--line-soft)`; NO card shadows;
radii from `--radius-sm`; logical properties throughout; `dir`+`<bdi>` for AR free-text
(never `textAlign`); new strings in the already-registered `copilot` namespace with full
EN+AR parity; no emoji/marketing copy.

## Verification

- `pnpm exec tsc --noEmit` — **clean** (baseline was clean; clean after every task).
- `eslint -c eslint.config.mjs --max-warnings 0 'frontend/src/components/copilot/**'` — **0**.
- `node scripts/check-i18n-namespaces.mjs` — **OK** (126 namespaces; copilot registered).
- `pnpm exec vitest run src/components/copilot` — **8/8 pass** (useApproveWrite suite).
- e2e copilot specs are DEPLOY-GATED (`E2E_COPILOT_STACK=1`) — the established
  verification pattern for these genUI renderers; not run here.

## Notes / follow-ups

- New genUI renderers follow the InlineSignalCard/InlineDossierCard precedent of
  e2e-only (deploy-gated) coverage; no unit-render harness exists for copilot components.
- Pre-existing uncommitted `frontend/src/routeTree.gen.ts` was left untouched (not mine).
- `ThreadListPrimitive` degrades gracefully if the AG-UI runtime exposes no thread-list
  adapter (New-conversation still works via the default in-memory thread list).
