---
quick_id: 260625-epq
slug: copilot-track-ux
description: Copilot drawer Track-UX wave-2 — P0 (work-item/generic tool renderers, collapsible reasoning, tool-running cue, ThreadList + titled header) then P1 (optimistic ack already-native, aria-live, focus-on-open, retry-on-error)
date: 2026-06-25
status: in-progress
---

# Quick Task 260625-epq — Copilot "Track UX" (wave-2 P0 + P1)

Source: `scratchpad/wave2-plan.md` → **Track UX** section
(`frontend/src/components/copilot/*`). AG-UI event contract captured in
`scratchpad/{grounded,ar,postfix}_stream.txt`.

## AG-UI event contract (verified from the captured streams)

```
TOOL_CALL_START   {parentMessageId, toolCallId, toolCallName:"query_work_items"}
TOOL_CALL_ARGS    {toolCallId, delta:"{\"limit\":5,\"status\":\"open\"}"}   (streamed JSON fragments)
TOOL_CALL_END     {toolCallId}
TOOL_CALL_RESULT  {toolCallId, content:"{\"workItems\":[ … ]}", role:"tool"}
REASONING_START / REASONING_MESSAGE_{START,CONTENT(delta),END} / REASONING_END
TEXT_MESSAGE_CHUNK …  RUN_STARTED / RUN_FINISHED
```

`query_work_items` result item shape (the partial row the UI must render):
`{ id, title, title_ar|null, status, priority, due_date, owner_user_id, is_deleted, created_at, updated_at }`
wrapped as `{ workItems: [...] }`.

`@assistant-ui/react@0.14.23` maps these to message-parts. Tool-call parts:
registered `makeAssistantToolUI({toolName})` renderers take precedence over the
`MessagePrimitive.Parts components.tools.Fallback` (verified in core
`MessageParts.js`: `toolUIs[toolName]?.render ?? Fallback`). Reasoning parts:
`MessagePrimitive.Parts components.Reasoning`. Status type:
`running | complete | incomplete | requires-action`.

## Design constraints (CLAUDE.md, non-negotiable)

Tokens only (`var(--*)`/`@theme` utilities — no raw hex, no `text-blue-*`);
borders `1px solid var(--line)`, NO card shadows (only `--shadow-sm` on hovered
list rows is allowed); radii from `--radius-sm/--radius`; logical properties
(`ms-/me-/ps-/pe-/text-start`); `dir="rtl"` + Tajawal in AR, NEVER `textAlign`;
no emoji/marketing copy. New i18n keys go in the already-registered `copilot`
namespace (EN + AR parity).

---

## Task 1 (P0) — query_work_items renderer + generic tool fallback card

**Files:**

- create `frontend/src/components/copilot/genui/InlineWorkItemCard.tsx`
- create `frontend/src/components/copilot/genui/GenericToolResultCard.tsx`
- edit `frontend/src/components/copilot/genui/GenUiToolUIs.tsx`
- edit `frontend/src/components/copilot/CopilotMessageList.tsx` (wire `tools.Fallback`)
- edit `frontend/src/components/copilot/copilot-theme.css`
- edit `frontend/src/i18n/{en,ar}/copilot.json`

**Action:**

- `InlineWorkItemCard` — mirror `InlineSignalCard` (thin token-bound card, NOT
  the heavy page `WorkItemCard` whose `UnifiedWorkItem` fields the tool result
  lacks). Normalize the untrusted partial row; render bidi title (prefer
  `title_ar` in AR), status + priority badges via semantic tokens, deadline.
  Deep-link to `/my-work` (canonical work surface; mirrors signal→`/intelligence`).
- `QueryWorkItemsToolUI` via `makeAssistantToolUI` in `GenUiToolUIs.tsx` → capped
  stack of `InlineWorkItemCard` from `result.workItems`; while `status==='running'`
  render the shared tool-running indicator (Task 3). Register in the fragment.
- `GenericToolResultCard` (`ToolCallMessagePartComponent`) — for any tool with NO
  registered renderer: token-bound card naming the tool + a compact result preview
  on complete; running indicator while running. Wire as `tools.Fallback` in
  `CopilotMessageList` AssistantMessage Parts.

**Verify:** `pnpm exec tsc -b` clean; eslint clean; query_work_items result →
work-item rows; an un-registered tool no longer renders as bare text.
**Done:** atomic commit `feat(copilot): render query_work_items + generic tool results inline`.

## Task 2 (P0) — collapsible Reasoning message-part (collapsed by default)

**Files:** edit `CopilotMessageList.tsx`, `copilot-theme.css`, `i18n/{en,ar}/copilot.json`

**Action:** add a `ReasoningMessagePartComponent` rendered as a native
`<details>` disclosure (collapsed), `<summary>` = `reasoning.label`, body = the
streamed reasoning text (`--ink-mute`, `--t-meta`). Wire into AssistantMessage
`components.Reasoning`. Token-bound, logical props, RTL-safe.

**Verify:** tsc/eslint clean; reasoning stream renders collapsed, expandable.
**Done:** atomic commit `feat(copilot): collapsible reasoning disclosure`.

## Task 3 (P0) — tool-running cue from TOOL_CALL_START + i18n

**Files:** create `frontend/src/components/copilot/genui/ToolRunningIndicator.tsx`;
edit `GenUiToolUIs.tsx`, `GenericToolResultCard.tsx`, `copilot-theme.css`,
`i18n/{en,ar}/copilot.json`

**Action:** shared `ToolRunningIndicator` (caret + per-tool label). New keys
`streaming.searching` (generic) + `streaming.tool.{query_work_items,get_dossier,
list_dossiers,read_signals}` per-tool labels. Rendered by the tool renderers when
`status.type==='running'` — this is the PRIMARY perceived-latency cue once
reasoning is off (the ~10s gap is the tool call). Note the relationship in
`CopilotMessageList` StreamingIndicator comment (thread-level "Thinking…" stays
for the pre-tool/text phase).

**Verify:** tsc/eslint clean; a running tool shows "Searching …" inline.
**Done:** atomic commit `feat(copilot): per-tool running indicator from TOOL_CALL_START`.

## Task 4 (P0) — ThreadList + titled drawer header

**Files:** create `frontend/src/components/copilot/CopilotHeader.tsx`;
edit `CopilotSurface.tsx`, `copilot-theme.css`, `i18n/{en,ar}/copilot.json`

**Action:** `CopilotHeader` at top of `CopilotSurfaceBody` (inside the runtime
provider so `ThreadListPrimitive` resolves): visible title (`title`) + a history
toggle revealing `<ThreadList/>` (already built, imported nowhere) in a bounded
scroll region, collapsed by default. One data path — both desktop Sheet and mobile
BottomSheet inherit it (D-04). New keys `header.history`/`header.hideHistory`.

**Verify:** tsc/eslint clean; drawer shows a titled header; toggling reveals
ThreadList with New-conversation.
**Done:** atomic commit `feat(copilot): titled drawer header + ThreadList history`.

## Task 5 (P1, gated on green build) — accessibility + resilience

**Files:** edit `CopilotMessageList.tsx`, `CopilotDrawer.tsx`,
`CopilotSurface.tsx`/composer, `i18n/{en,ar}/copilot.json` as needed

**Action (each independently revertable if it risks the build):**

- aria-live: wrap assistant `__body` in `aria-live="polite"` so streamed answers announce.
- focus-on-open: `onOpenAutoFocus` on SheetContent → focus the composer textarea.
- retry-on-error: render a Retry control on run error (strings `error.retry` exist)
  via assistant-ui reload primitive; neutral, indistinguishable-empty preserved.
- optimistic send-ack: confirm assistant-ui already echoes the user turn on send;
  if already native, document as no-op (no speculative change — KISS/YAGNI).

**Verify:** tsc/eslint clean; existing copilot vitest green.
**Done:** atomic commit(s) `feat(copilot): a11y + retry affordances (P1)`.

## Global verification

- `cd frontend && pnpm exec tsc -b` (or repo typecheck) clean
- repo lint: `eslint -c eslint.config.mjs --max-warnings 0 'frontend/src/**/*.{ts,tsx}'` + i18n-namespace guard
- `cd frontend && pnpm exec vitest run` for copilot-touching specs (useApproveWrite + any new)
- e2e copilot specs are deploy-gated (skip unless `E2E_COPILOT_STACK=1`)
