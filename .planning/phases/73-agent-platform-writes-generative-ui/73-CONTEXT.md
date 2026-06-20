# Phase 73: Agent Platform — Writes + Generative UI - Context

**Gathered:** 2026-06-20
**Status:** Ready for planning
**Source:** Locked decisions from `73-RESEARCH.md` + user scope approval (autonomous /loop). Formalizes the discuss-phase output; a later `/gsd:discuss-phase 73` / `/gsd:ui-phase 73` may refine.

<domain>
## Phase Boundary

The copilot gains **human-in-the-loop, JWT-enforced write capability** plus **generative UI**, building directly on the P72 reads-only foundation (agent-runtime Mastra + assistant-ui drawer + caller-JWT keystone). Delivers GENUI-01..04:

- **In scope:** 4 state-changing copilot actions, each gated by a bilingual token-bound confirmation card and committed only on approval under the user's JWT (RLS-enforced, never service-role): (1) publish digest, (2) dismiss/escalate signal, (3) create + link work item, (4) generate brief. Inline generative-UI cards rendering the app's own token-bound components with deep-links. Post-commit query-cache sync to the conventional UI.
- **Out of scope:** any service-role write path; autonomous (non-confirmed) writes; new write operations beyond the 4; AnythingLLM-dependent generation (P74 retires it).
  </domain>

<decisions>
## Implementation Decisions

### Write set (D1) — ALL 4

- publish_digest, signal dismiss/escalate, work-item create + link, AND brief generation. Nothing deferred.

### Brief generation (D2) — new INVOKER persist path

- Add a NEW caller-JWT (SECURITY INVOKER) `persist_brief` RPC + on-prem generation. Do NOT use AnythingLLM (P74 retires it) and NEVER the service-role brief insert (`engagement-briefs` manual path violates GENUI-03).

### Commit location (D3) — frontend-direct

- Approved writes commit from the frontend approve-handler via the EXISTING INVOKER edge-fns/RPCs under the caller JWT (reuses proven paths + existing mutation hooks → free GENUI-04). Agent only _proposes_ the write as a tool call; it never commits server-side.

### Confirmation UX (D4)

- Per-action bilingual token-bound confirmation card with reject + reason. Stronger confirm (e.g. typed dossier name) for high-stakes publish-digest-to-subscribers. Sentence case, `var(--*)` tokens, no marketing voice, no card shadows, logical properties, `dir=rtl`+Tajawal in AR (CLAUDE.md DoD).

### Cache sync (D5) — post-commit invalidation

- No optimistic rows (RLS may reject). Reuse existing key factories per op: `signalKeys.lists()`, `workItemKeys.byDossier(id)` + `dossierKeys.detail(id)`, digest keys, brief keys.

### Signal actor migration (D6) — YES

- Add `*_by` (acknowledged/dismissed/escalated) + `status_changed_at` to `intelligence_event` status changes so GENUI-03 #2 (`actor_id == auth.uid()`) is verifiable. (Tasks/digest/work-item-link already record the actor.)

### Generative UI (D7) — direct component renderers

- Render the app's own components inline via assistant-ui `makeAssistantToolUI` + a fixed allowlist (`UniversalDossierCard`, signal card). Deep-links via the router (CitationCard precedent). HITL + genUI use the assistant-ui **tool-call** mechanism (distinct from P72 CitationCard's source-message-part mechanism).

### Security invariants (carry from P72)

- agent-runtime NEVER constructs/holds the service-role key; all commits via INVOKER under the caller Bearer. Narrow Zod tool inputs (UUIDs/enums). Indistinguishable-empty on denial (no clearance|filtered|restricted leakage). resourceId derived from verified JWT `sub`. Idempotent commits (publish_digest ON CONFLICT; work_item_dossiers 23505; signal status-guard).

### Claude's Discretion

- Exact tool names/Zod schemas for the propose\_\* write tools; the assistant-ui tool-UI renderer component structure; the `persist_brief` RPC signature + on-prem generation wiring; confirmation-card layout details within the DoD tokens.
  </decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research + decisions

- `.planning/phases/73-agent-platform-writes-generative-ui/73-RESEARCH.md` — full implementation scoping, write-op→path map, HITL mechanism, threat model, locked decisions.

### P72 patterns to mirror (read-tool → write-tool)

- `agent-runtime/src/mastra/tools/{_supabase.ts,read-signals.ts,generate-digest.ts,query-graph.ts,dossier-lookups.ts,index.ts}` — keystone + narrow-Zod tool pattern.
- `agent-runtime/src/mastra/{agents/copilot.ts,index.ts}` — agent (reads-only prompt must be revised for writes) + server keystone (`deriveResourceId`).

### Frontend copilot surface

- `frontend/src/components/copilot/{CopilotSurface.tsx,useCopilotRuntime.ts,CopilotMessageList.tsx,CitationCard.tsx}` — runtime/JWT override + Parts mapping; tool-UI renderers mount at `AssistantRuntimeProvider`.

### Conventional write paths (wrap under caller JWT)

- `supabase/functions/{work-item-dossiers,tasks-create,dossiers-briefs-generate,engagement-briefs}/index.ts`
- `supabase/migrations/20260615_phase70_publish_digest_tenant_fix.sql` (INVOKER publish_digest — authoritative)
- `frontend/src/domains/signals/hooks/useSignalMutations.ts` (caller-JWT signal UPDATE + cache invalidation template)

### Cache-sync + genUI components

- `frontend/src/domains/dossiers/hooks/useDossier.ts`, `frontend/src/domains/work-items/keys.ts`, `frontend/src/domains/signals/types/signal.types.ts` (`signalKeys`)
- `frontend/src/components/dossier/UniversalDossierCard.tsx`, `frontend/src/components/signals/SignalRow.tsx`
  </canonical_refs>

<specifics>
## Specific Ideas
- assistant-ui@0.14.23 (already installed) ships native HITL + genUI (`makeAssistantToolUI`, `ToolApprovalResponse`, `humanTool`) — no new deps.
- One new DB migration (signal actor columns) + one new INVOKER RPC (`persist_brief`).
- Pattern: agent emits `propose_<op>(args)` tool call → frontend renders confirmation card → approve → commit via existing INVOKER path under caller JWT → invalidate query keys.
</specifics>

<deferred>
## Deferred Ideas
- AnythingLLM retirement + the on-prem generation substrate hardening land in Phase 74 (P73 introduces the INVOKER `persist_brief` persist path; P74 owns the generation-source retirement).
- Optimistic UI updates (explicitly rejected in D5 for this phase).
</deferred>

---

_Phase: 73-agent-platform-writes-generative-ui_
_Context gathered: 2026-06-20 via autonomous /loop (locked decisions from research + user scope approval)_
