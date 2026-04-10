# Journey 7 — AI Chat & Briefings

**Date:** 2026-04-10
**Status:** Code audit complete, browser verification pending
**Agents:** Component, Data Flow, Theme

## Summary

- **Critical:** 0
- **Warning:** 5
- **Info:** 4

Note: 1 known J0 issue re-confirmed (D-09 ChatContext no cleanup) — not counted again.

---

## Findings

### [WARNING] C-70: Non-unique message keys in ChatDock

- **File:** frontend/src/components/ai/ChatDock.tsx:178
- **Agent:** component-auditor
- **Journey:** 7-ai-chat
- **Issue:** Messages rendered with key={index}. Index keys cause React to reuse DOM nodes and lose state when messages deleted/cleared.
- **Expected:** Unique keys: key={`msg-${index}-${message.timestamp}`} or message IDs
- **Fix:** Generate or use message IDs for stable keys
- **Affects:** [7-ai-chat, message streaming stability]

### [WARNING] D-70: useGenerateBrief missing cleanup on unmount

- **File:** frontend/src/domains/ai/hooks/useGenerateBrief.ts
- **Agent:** data-flow-auditor
- **Journey:** 7-ai-chat
- **Issue:** No cleanup on unmount during streaming. AbortController reference persists, SSE reader stays open.
- **Expected:** Cleanup function cancels in-flight requests on unmount
- **Fix:** Add cleanup logic: abort fetch and close reader on unmount
- **Affects:** [7-ai-chat, memory leaks during brief generation]

### [WARNING] D-71: Missing ErrorBoundary around ChatDock

- **File:** frontend/src/components/ai/ChatDock.tsx
- **Agent:** component-auditor
- **Journey:** 7-ai-chat
- **Issue:** ChatDock has no ErrorBoundary. If ChatMessage or ChatInput throws, entire dock crashes with no fallback.
- **Expected:** ErrorBoundary with fallback UI ("Chat unavailable, retry")
- **Fix:** Wrap ChatDock mount point with ErrorBoundary
- **Affects:** [7-ai-chat, error resilience]

### [WARNING] T-70: Hardcoded colors in BriefGenerationPanel

- **File:** frontend/src/components/ai/BriefGenerationPanel.tsx:272-278, 357-362
- **Agent:** theme-auditor
- **Journey:** 7-ai-chat
- **Issue:** Uses bg-green-50, text-green-800, dark:bg-green-950 instead of semantic tokens
- **Expected:** Use theme tokens: bg-success/10, text-success-foreground
- **Fix:** Replace hardcoded colors with semantic design system classes
- **Affects:** [7-ai-chat, theme consistency]

### [WARNING] D-72: useAIChat sendMessage captures stale messages

- **File:** frontend/src/domains/ai/hooks/useAIChat.ts:74
- **Agent:** data-flow-auditor
- **Journey:** 7-ai-chat
- **Issue:** sendMessage closure captures stale messages state. Each send uses messages from when hook was created, not current.
- **Expected:** Use functional setState or useRef for latest messages
- **Fix:** Use setMessages(prev => [...prev, userMessage]) pattern
- **Affects:** [7-ai-chat, conversation history consistency]

### [INFO] C-71: ChatInput missing aria-label on textarea

- **File:** frontend/src/components/ai/ChatInput.tsx:59-66
- **Agent:** component-auditor
- **Journey:** 7-ai-chat
- **Issue:** Textarea has no aria-label. Screen readers only announce placeholder.
- **Fix:** Add aria-label={t('ai-chat.inputAriaLabel')}

### [INFO] T-71: ChatMessage streaming cursor not RTL-aware

- **File:** frontend/src/components/ai/ChatMessage.tsx:86
- **Agent:** theme-auditor
- **Journey:** 7-ai-chat
- **Issue:** Cursor animation uses ms-1 (correct logical property) but animation direction is LTR-only
- **Fix:** Minor — add RTL conditional if needed

### [INFO] D-73: parseAIError doesn't handle all error formats

- **File:** frontend/src/utils/ai-errors.ts:20-48
- **Agent:** data-flow-auditor
- **Journey:** 7-ai-chat
- **Issue:** Assumes err.code is string. AnythingLLM may return status or statusCode fields.
- **Fix:** Add fallback checks: err.code || err.status || err.statusCode

### [INFO] D-74: ChatDock streaming/loading state alignment

- **File:** frontend/src/components/ai/ChatDock.tsx:150-152
- **Agent:** component-auditor
- **Journey:** 7-ai-chat
- **Issue:** isStreaming in ChatMessage may not align with useAIChat isLoading state timing
- **Fix:** Track streaming state separately from isLoading

---

## Re-confirmed J0 Issues (still present)

- D-09: ChatContext no subscription cleanup
