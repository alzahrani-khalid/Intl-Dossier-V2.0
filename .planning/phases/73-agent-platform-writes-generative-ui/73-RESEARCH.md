# Phase 73 — Agent Platform: Writes + Generative UI — Implementation Research

> Research-only scoping (no code). Feeds `/gsd:plan-phase 73`. Produced 2026-06-20 by a focused research agent against the live codebase.

## Executive summary

Everything Phase 73 needs is already in the pinned dependencies and the P72 foundation. The frontend's installed `@assistant-ui/react@0.14.23` ships the complete native HITL + generative-UI surface (`makeAssistantToolUI`, `ToolCallMessagePartComponent`, `humanTool`, `hitl`, `ToolApprovalResponse`, `RespondToToolApprovalOptions`, `GenerativeUISpec`, `useAssistantRuntime`). Three of the four writes already have caller-JWT (SECURITY INVOKER) conventional paths that a P73 write-tool can wrap exactly like the P72 reads-only tools. The build is mostly assembly, not invention. The single biggest open issue is brief generation, whose persistence + AI dependency diverge from the keystone and force a decision.

## (A) Write-op → existing conventional-path map

| #   | Write op                 | Conventional path                                                                                                                                                                       | Caller-JWT?                                                                                                                                      | Table / actor column                                                                                            | Verdict                      |
| --- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1a  | Create work item (task)  | `supabase/functions/tasks-create/index.ts`                                                                                                                                              | INVOKER (anon + caller Bearer)                                                                                                                   | `tasks` → `created_by` = caller                                                                                 | ✅ wrappable                 |
| 1b  | Link work item → dossier | `supabase/functions/work-item-dossiers/index.ts` (`handleCreate`)                                                                                                                       | INVOKER (idempotent 23505)                                                                                                                       | `work_item_dossiers` → `created_by` = caller; commitment branch → `aa_commitments` via SECURITY DEFINER trigger | ✅ wrappable                 |
| 2   | Generate brief           | AI: `dossiers-briefs-generate` (anon, calls **AnythingLLM** then INSERT `briefs`); Manual: `engagement-briefs` `handleCreateManualBrief` **switches to service-role** for INSERT        | MIXED / ⚠️                                                                                                                                       | `briefs`/`ai_briefs` → `created_by`                                                                             | ⚠️ decision (D2)             |
| 3   | Publish digest           | `publish_digest(p_dossier_id,p_period,p_summary,p_clearance_level_at_generation)` RPC (mig `20260615_phase70_digests_alerts.sql` L509+, tenant fix `..._publish_digest_tenant_fix.sql`) | INVOKER (verified, granted authenticated; clearance gate `sensitivity_level <= profiles.clearance_level`; tenant from `get_current_tenant_id()`) | `intelligence_digest` → `generated_by`/`subscriber_id` = `auth.uid()`; idempotent ON CONFLICT                   | ✅ best fit                  |
| 4   | Dismiss/escalate signal  | `frontend/src/domains/signals/hooks/useSignalMutations.ts` `useUpdateSignalStatus` — direct `intelligence_event.update({status})` under caller JWT                                      | INVOKER (RLS `intelligence_event_update_cleared`: tenant + clearance)                                                                            | `intelligence_event` → `status` ONLY. **No `dismissed_by`/`escalated_by` actor column** ⚠️                      | ✅ wrappable; actor-gap (D6) |

P72's `generate-digest` tool is preview-only (string `publish_digest` absent by construction, least-privilege D-07). P73 adds a SEPARATE `publish_digest` write-tool wrapping the already-INVOKER RPC, gated behind HITL. The preview tool stays read-only.

## (B) HITL recommendation — frontend "human-tool" gate

Use assistant-ui's native tool-call render + approval roundtrip (verified present in installed `@assistant-ui/react@0.14.23`). Flow:

1. Agent proposes the write as a **tool call** with structured args (e.g. `propose_publish_digest({dossierId, period, summary})`); does NOT execute.
2. Frontend registers a tool-UI renderer (`makeAssistantToolUI`) keyed to that tool → renders a **bilingual token-bound confirmation card** from the args (GENUI-02).
3. On Approve → `addResult({approved:true})` → commit runs **under the caller JWT** via the existing INVOKER edge-fn/RPC (reuse the app's authenticated `supabase` client / existing mutation hook). On Reject → nothing commits.
4. Card renders post-state from `status`/`result`.

Why frontend-gate over server-side Mastra suspend: the frontend already holds the live caller JWT; committing approved writes through proven INVOKER paths (which pin `created_by = auth.uid()`) is the lowest-risk way to satisfy GENUI-03 and gives GENUI-04 for free via existing hooks — no new service-role surface. (Mastra `context.human()` interrupt is the alternative — D3.)

> Distinction: CitationCard (P72) uses the **source message-part** mechanism. HITL + genUI cards use the **tool-call** mechanism — a different API. P73 introduces the first tool-UI renderers.

## (C) GenUI (GENUI-01) + cache sync (GENUI-04)

- GenUI: register tool-UI renderers via `makeAssistantToolUI` at the existing `AssistantRuntimeProvider` (`frontend/src/components/copilot/CopilotSurface.tsx` L82). Render the app's own components inline: `frontend/src/components/dossier/UniversalDossierCard.tsx` (omit action callbacks for read-only inline), `frontend/src/components/signals/SignalRow.tsx`. Deep-links via the router (CitationCard precedent).
- Cache sync: app uses hierarchical query-key factories with `onSuccess` invalidation. Templates: `useDossier.ts` (`dossierKeys`, `useCreateDossier`), `work-items/keys.ts` (`workItemKeys`), `useSignalMutations.ts` (`useUpdateSignalStatus` invalidates `signalKeys.lists()` — cleanest GENUI-04 template). Drawer mounts in `_protected` → shares the app `QueryClient`. After approved commit, `invalidateQueries({queryKey})` (or reuse the existing mutation hook). Recommend **post-commit** invalidation (not optimistic) — D5.

## (D) Threat model

Consistent with the P72 keystone: caller-JWT only (`agent-runtime/src/mastra/tools/_supabase.ts` `createUserClient` = anon + forwarded Bearer; service-role never constructed), INVOKER RPCs, indistinguishable-empty.

| Threat                                          | Mitigation                                                                                                                                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auto-commit without approval / prompt-injection | Writes are frontend `humanTool`-gated; agent can only propose; commit only on explicit `addResult({approved:true})`. Confirmation mandatory, no "always allow".                         |
| Privilege escalation / service-role leakage     | agent-runtime never holds service-role key. All commits via INVOKER under caller Bearer. Brief must be re-pointed to INVOKER or excluded (do NOT expose the service-role brief insert). |
| RLS bypass                                      | Only wrap verified-INVOKER targets. Assert non-empty Authorization before any write.                                                                                                    |
| Cross-tenant / above-clearance write            | RLS WITH CHECK enforces `sensitivity_level <= clearance_level` + tenant at DB. Narrow Zod input (UUIDs/enums) — no arbitrary SQL/columns. Indistinguishable-empty on denial.            |
| Confirmation-card spoofing / args mismatch      | Commit uses the SAME `args` the card rendered (one `ToolCallMessagePartProps.args` to both). Cards are app React components (token-bound), not model HTML; approve is a real button.    |
| Actor non-repudiation gap (signals)             | Add migration: `*_by` + `status_changed_at` on signal status change (or audit row) so GENUI-03 #2 (`actor_id == auth.uid()`) is verifiable. (D6)                                        |
| Thread/identity hijack                          | Already mitigated: resourceId from verified JWT `sub` (`agent-runtime/src/mastra/index.ts` `deriveResourceId`), owner-only RLS on `mastra_threads`. Carry forward.                      |
| Replay / double-commit                          | Reuse idempotency: `publish_digest` ON CONFLICT; `work_item_dossiers` 23505 + unique partial index; signal guard on current status.                                                     |

## (E) Open decisions for the user (owner must approve before build)

- **D1 — Exact write set for v1.** Cleanly ready: publish_digest, dismiss/escalate signal, link work-item→dossier (+create task). Outlier: generate brief. Rec: ship 3 ready ops first; brief separate.
- **D2 — Brief: how/whether under the keystone.** AI path depends on AnythingLLM (P74 retires); manual path uses service-role (violates GENUI-03). Options: (a) exclude until P74; (b) new INVOKER `persist_brief` RPC + on-prem generation; (c) re-point manual INSERT to caller-JWT. Rec: (a) or (b); never expose service-role write to the agent.
- **D3 — Where approved write commits.** (i) frontend-direct via existing INVOKER paths (rec — least new surface, free cache sync); (ii) new agent-runtime write-tool under forwarded Bearer.
- **D4 — Confirmation UX.** Per-action card + reject reason; bilingual + token-bound; stronger confirm for high-stakes (publish digest to subscribers)?
- **D5 — Cache sync.** Rec: post-commit invalidation (no optimistic rows RLS might reject). Confirm keys per op.
- **D6 — Signal actor-column migration.** Add `*_by` + `status_changed_at`. (Tasks/digest/work-item-link already record actor.)
- **D7 — GenUI rendering.** Direct component renderers via `makeAssistantToolUI` + fixed allowlist (rec), vs `GenerativeUISpec` allowlist renderer.

## Key files for the planner

- P72 read-tool pattern (mirror for writes): `agent-runtime/src/mastra/tools/{_supabase.ts,read-signals.ts,generate-digest.ts,query-graph.ts,dossier-lookups.ts}`, registry `tools/index.ts`, agent `mastra/agents/copilot.ts` (reads-only prompt must be revised), keystone `mastra/index.ts`.
- Frontend copilot: `frontend/src/components/copilot/{CopilotSurface.tsx,useCopilotRuntime.ts,CopilotMessageList.tsx,CitationCard.tsx}`.
- Conventional writes: `supabase/functions/{work-item-dossiers,tasks-create,dossiers-briefs-generate,engagement-briefs}/index.ts`; `supabase/migrations/20260615_phase70_publish_digest_tenant_fix.sql`; `frontend/src/domains/signals/hooks/useSignalMutations.ts`.
- Cache-sync templates: `useDossier.ts`, `work-items/keys.ts`, `signalKeys` in `signals/types/signal.types.ts`.
- GenUI components: `UniversalDossierCard.tsx`, `signals/SignalRow.tsx`.

**Bottom line:** libraries + 3/4 write paths are ready. Build = (1) frontend HITL tool-UI renderers, (2) narrow INVOKER write-tools/approve-handlers mirroring P72, (3) one signal actor-column migration, (4) post-commit cache invalidation via existing factories — with brief generation deferred or re-homed as the only genuine fork.

## LOCKED DECISIONS (user-approved 2026-06-20)

- **D1 — Write set = ALL 4**: publish_digest, signal dismiss/escalate, work-item create + link, AND brief generation. Nothing deferred.
- **D2 — Brief = NEW INVOKER `persist_brief` path**: a new caller-JWT (SECURITY INVOKER) persist RPC + on-prem generation. Do NOT use AnythingLLM (P74 retires it) and NEVER the service-role brief insert. This pulls the on-prem-model brief-generation dependency into P73.
- **D3 — Commit location = frontend-direct** via existing INVOKER edge-fns/RPCs under the caller JWT (least new surface; free GENUI-04 via existing mutation hooks). For brief, the new `persist_brief` INVOKER RPC.
- **D4 — Confirmation UX**: per-action bilingual token-bound confirmation card with reject + reason; stronger confirm (e.g. typed dossier name) for high-stakes publish-digest-to-subscribers. Sentence case, `var(--*)` tokens, no marketing voice (CLAUDE.md DoD).
- **D5 — Cache sync = post-commit invalidation** (no optimistic rows RLS might reject); reuse existing key factories per op (`signalKeys.lists()`, `workItemKeys.byDossier(id)` + `dossierKeys.detail(id)`, digest keys, brief keys).
- **D6 — Signal actor migration = YES**: add `*_by` (acknowledged/dismissed/escalated) + `status_changed_at` to `intelligence_event` status changes so GENUI-03 #2 (`actor_id == auth.uid()`) is verifiable.
- **D7 — GenUI = direct component renderers** via `makeAssistantToolUI` + fixed allowlist (`UniversalDossierCard`, signal card).

Next: `/gsd:plan-phase 73` consuming this research + these locked decisions.
