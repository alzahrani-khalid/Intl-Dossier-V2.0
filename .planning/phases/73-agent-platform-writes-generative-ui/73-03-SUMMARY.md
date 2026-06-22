---
phase: 73-agent-platform-writes-generative-ui
plan: 03
subsystem: ui
tags:
  [assistant-ui, hitl, copilot, caller-jwt, supabase-rls, tanstack-query, bilingual, generative-ui]

# Dependency graph
requires:
  - phase: 73-01
    provides: intelligence_event actor columns (dismissed_by/escalated_by/status_changed_at) migration + persist_brief(p_dossier_id, p_content, p_title, p_summary) INVOKER RPC (both written/committed; live-apply operator-gated — DEFER-73-03-A)
  - phase: 73-02
    provides: four propose_* tools echoing { proposed, action, args }; propose_brief's args.content is the single { en, ar } envelope persist_brief stores
  - phase: 72
    provides: assistant-ui copilot surface (CopilotSurface/AssistantRuntimeProvider), CitationCard source-part precedent, caller-JWT keystone
provides:
  - Bilingual token-bound HITL ConfirmActionCard (Approve / Reject+reason; D-04 typed-name strong-confirm) rendered from a propose_* tool call's args
  - useApproveWrite — the four caller-JWT INVOKER commit paths (signal UPDATE with D-06 actor, publish_digest RPC, tasks-create→work-item-dossiers, persist_brief RPC) + post-commit cache invalidation
  - proposeToolUIs — four makeAssistantToolUI renderers wiring each propose_* tool call → ConfirmActionCard → useApproveWrite commit → addResult roundtrip, mounted under AssistantRuntimeProvider
affects: [73-04, 73-05]

# Tech tracking
tech-stack:
  added: [] # no new deps — @assistant-ui/react (makeAssistantToolUI) already pinned
  patterns:
    - "HITL tool-UI: makeAssistantToolUI({ toolName, render }) renderer reads the tool call's inner args, renders an app React card (token-bound, never model HTML), and resolves via addResult — the same args the card shows are the args committed (no bait-and-switch)"
    - 'Approve-commit-under-caller-JWT: each write reuses the proven conventional INVOKER path (the SAME @/lib/supabase client the conventional UI uses), then post-commit-invalidates the existing query-key factory; never optimistic, never service-role'
    - 'Indistinguishable-empty post-state: a denied commit and a generic failure both throw → the card shows one neutral error line (no clearance/filtered/restricted wording)'

key-files:
  created:
    - frontend/src/components/copilot/hitl/ConfirmActionCard.tsx
    - frontend/src/components/copilot/hitl/useApproveWrite.ts
    - frontend/src/components/copilot/hitl/useApproveWrite.test.ts
    - frontend/src/components/copilot/hitl/proposeToolUIs.tsx
  modified:
    - frontend/src/components/copilot/CopilotSurface.tsx
    - frontend/src/components/copilot/copilot-theme.css
    - frontend/src/i18n/en/copilot.json
    - frontend/src/i18n/ar/copilot.json

key-decisions:
  - 'Digest commit invalidates digestKeys.all (mirrors GenerateDigestButton); brief commit invalidates dossierKeys.detail(dossierId) (no brief key factory exists — briefs render under the dossier); work-item commit invalidates workItemKeys.lists() + workItemKeys.byDossier(dossierIds[0]) + dossierKeys.detail(dossierIds[0]); signal commit invalidates signalKeys.lists()'
  - "publish_digest clearance-level arg = the caller's clearance level, defaulting to 1 when not supplied — the exact default GenerateDigestButton uses (p_clearance_level_at_generation: digestPreview.clearance_level ?? 1). The propose_publish_digest args carry no clearance, so commitPublishDigest passes 1; the publish_digest RPC re-derives/uses it."
  - 'D-04 typed-confirm expected value = the dossier name resolved from the args dossierId via a caller-JWT dossiers read (isRTL ? name_ar : name_en); falls back to the dossierId string if the name has not loaded, so Approve still stays gated.'
  - "persist_brief p_content = propose_brief's args.content forwarded VERBATIM (single { en, ar } jsonb); p_title/p_summary = the EN summary; NO p_content_en/p_content_ar/p_engagement_dossier_id (reconciled live briefs schema, 73-01)."

patterns-established:
  - 'HITL approve roundtrip: Approve → card committing → commit thunk; success → addResult({approved:true, committed:true}) + card committed; throw → addResult({approved:true, committed:false}) + card error (model told the commit did NOT succeed); Reject → addResult({approved:false, reason}) + card rejected, nothing commits'
  - "Comment-hygiene for literal-string verify gates: keep forbidden literals (text-left/right, textAlign:right, service_role) out of source comments so the plan's whole-file grep gates pass (carried from 73-02)"

requirements-completed: [GENUI-02, GENUI-03, GENUI-04]

# Metrics
duration: 16min
completed: 2026-06-21
---

# Phase 73 Plan 03: HITL confirmation + caller-JWT commit + cache invalidation Summary

**Bilingual token-bound human-in-the-loop confirmation cards (via assistant-ui `makeAssistantToolUI`) for all four `propose_*` writes — Approve commits under the caller JWT through the proven INVOKER paths (signal UPDATE with the D-06 actor, `publish_digest`/`persist_brief` RPCs, `tasks-create`→`work-item-dossiers`), then post-commit-invalidates the matching TanStack Query keys; Reject commits nothing; publish-to-subscribers requires a typed dossier-name match (D-04).**

## Performance

- **Duration:** ~16 min
- **Started:** 2026-06-21T09:33:21Z
- **Completed:** 2026-06-21
- **Tasks:** 3
- **Files modified:** 8 (4 created, 4 modified)

## Accomplishments

- **ConfirmActionCard** — one reusable presentational card renders any of the four proposals from the tool call's `args`: flat `var(--surface)`, `1px solid var(--line)`, `var(--radius-sm)`, no shadow, logical properties; Arabic via `writingDirection: 'rtl'` + Tajawal (no physical text-align). Real `<button>` Approve (disabled during commit), Reject-with-reason input, and neutral terminal lines. D-04 strong-confirm: Approve stays disabled until the typed value exactly matches the dossier name.
- **useApproveWrite** — four `async` commit functions, each under the authenticated `@/lib/supabase` client (caller JWT), reusing the conventional INVOKER path: signal `intelligence_event` UPDATE (`status` + `dismissed_by`/`escalated_by`=`auth.uid()` + `status_changed_at`), `rpc('publish_digest')`, `tasks-create`→`work-item-dossiers`, `rpc('persist_brief', { p_dossier_id, p_content, p_title, p_summary })`. A NULL `persist_brief` return is a neutral failure (throws). Post-commit (not optimistic, D-05) invalidation via the existing key factories.
- **proposeToolUIs** — four `makeAssistantToolUI` renderers (D-07) keyed to the propose tool ids; each maps the inner `args` → localized `summaryFields`, drives the Approve/Reject → commit → `addResult` roundtrip, and (for publish_digest) resolves the dossier name for the typed-confirm. Mounted as `<ProposeToolUIs />` inside `AssistantRuntimeProvider` in `CopilotSurface` (runtime/JWT wiring untouched).
- **Bilingual copy** — a `confirm.*` block added to both `en/copilot.json` and `ar/copilot.json` at full key parity (42/42 keys), sentence case, no marketing voice, no emoji; the error post-state is indistinguishable-empty.
- **8-case Vitest spec** proves caller-JWT-only commits, the signal actor write, single `p_content` (not per-language), `tasks-create`→`work-item-dossiers` order, the NULL-brief failure, no service-role path, and post-commit (not optimistic) invalidation.

## Task Commits

1. **Task 1: ConfirmActionCard + i18n + CSS** — `23256d1a` (feat)
2. **Task 2: useApproveWrite + test (TDD)** — `bd58cc04` (feat) — RED (module-missing) → GREEN (8/8) verified in sequence; test + impl committed together as the task unit
3. **Task 3: proposeToolUIs renderers + CopilotSurface mount** — `5d309700` (feat)

## Files Created/Modified

- `frontend/src/components/copilot/hitl/ConfirmActionCard.tsx` — bilingual token-bound Approve/Reject card with D-04 typed-confirm and neutral terminal states.
- `frontend/src/components/copilot/hitl/useApproveWrite.ts` — four caller-JWT INVOKER commit fns + post-commit invalidation.
- `frontend/src/components/copilot/hitl/useApproveWrite.test.ts` — 8 cases (caller-JWT-only, actor write, single p_content, edge-fn order, NULL-brief failure, post-commit invalidation).
- `frontend/src/components/copilot/hitl/proposeToolUIs.tsx` — four makeAssistantToolUI renderers + the ProposeToolUIs mount fragment.
- `frontend/src/components/copilot/CopilotSurface.tsx` — mounts `<ProposeToolUIs />` inside AssistantRuntimeProvider.
- `frontend/src/components/copilot/copilot-theme.css` — `.copilot-confirm*` token-bound classes.
- `frontend/src/i18n/{en,ar}/copilot.json` — `confirm.*` block, full parity.

## Invalidation keys used per op (plan-requested record)

| Op                      | Commit path                              | Invalidation key(s)                                                                                    |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Signal dismiss/escalate | `intelligence_event` UPDATE (caller JWT) | `signalKeys.lists()` → `['signals','list']`                                                            |
| Publish digest          | `rpc('publish_digest')`                  | `digestKeys.all` → `['intelligence-digests']`                                                          |
| Work item               | `tasks-create` → `work-item-dossiers`    | `workItemKeys.lists()` + `workItemKeys.byDossier(dossierIds[0])` + `dossierKeys.detail(dossierIds[0])` |
| Brief                   | `rpc('persist_brief')`                   | `dossierKeys.detail(dossierId)` (no brief key factory; briefs render under the dossier)                |

**publish_digest clearance-level source:** `commitPublishDigest` passes `p_clearance_level_at_generation: clearanceLevel ?? 1` — the propose args carry no clearance, so it defaults to `1`, the exact default `GenerateDigestButton` uses. The RPC enforces clearance server-side regardless.

## Decisions Made

See `key-decisions` frontmatter (digest→`digestKeys.all`, brief→`dossierKeys.detail`, work-item→`workItemKeys.lists`+`byDossier`+`dossierKeys.detail`; clearance default 1; typed-confirm = resolved dossier name; `p_content` forwarded verbatim).

## Deviations from Plan

None — plan executed exactly as written.

Two in-task adjustments were source-hygiene / lint only, not behavior changes:

- ConfirmActionCard doc-comments were reworded so the plan's whole-file forbidden-pattern grep (`text-left/right`, `textAlign:'right'`) passes without a comment string tripping it (same trap 73-02 documented).
- An `eslint-disable-next-line import/first` directive in the Task-2 test referenced a rule not configured in this repo (itself a lint error under `--max-warnings 0`); removed it — `vi.mock` is hoisted by the Vitest transform, so the import-after-mock works regardless. Folded into the Task-3 commit.

## Issues Encountered

- **Supabase MCP not exposed to the executor this session** (same agent-tool-stripping as 73-01), so the live state of the two 73-01 migrations could not be verified or applied from here. The 73-03 frontend targets the EXACT `persist_brief(p_dossier_id, p_content, p_title, p_summary)` signature and the `dismissed_by`/`escalated_by`/`status_changed_at` columns those migrations define. Logged as **DEFER-73-03-A** — the signal-status and brief commits depend on those migrations being applied to staging via `apply_migration`; the digest and work-item commits use already-live RPCs/edge fns and work today. This is the phase-level deploy gate (consistent with the P72 GPU/re-embed gate), surfaced not swallowed.
- `makeAssistantToolUI` is marked `@deprecated` in `@assistant-ui/core@0.2.18` (the suggested successor is toolkit-entry `render` / `MessagePrimitive.Parts` inline overrides), but it is the mechanism the plan locks (D-07) and is fully functional and exported. Kept as specified; a future migration to the toolkit-render API is a non-blocking follow-up.

## Verification results

- Type-check: PASS (`tsc --noEmit -p tsconfig.json`, exit 0).
- Unit test: PASS — `useApproveWrite.test.ts` 8/8.
- Lint: PASS — eslint on all 5 new/modified TS/TSX files clean (`--max-warnings 0` equivalent).
- Build: PASS — `pnpm --filter intake-frontend build` ✓ built (pre-existing chunk-size warning only).
- Task gates: Task 1 verify exit 0 (file + forbidden-pattern + i18n parity + tsc); Task 2 verify exit 0 (rpc/actor/invalidate greps + no service-role + vitest); Task 3 verify exit 0 (makeAssistantToolUI + 4 tool ids + addResult + mount + tsc).
- Keystone: zero service-role in non-test HITL source (the only `service_role` matches are the test's negative assertions).

## User Setup Required

None for this plan's build. **Runtime dependency (operator/deploy):** the two 73-01 migrations (`20260620000001_phase73_signal_actor_columns.sql`, `20260621090100_phase73_persist_brief.sql`) must be applied to staging (`zkrcjzdemdmwhearhfgg`) via the Supabase MCP `apply_migration` before the signal-status and brief commit paths work live (DEFER-73-03-A). Digest + work-item commits work against already-live RPCs/edge fns.

## Next Phase Readiness

- 73-04 (generative READ renderers — UniversalDossierCard / signal card) adds its own tool-UI renderers under the SAME `AssistantRuntimeProvider`; the HITL write renderers are deliberately kept separate from those READ renderers (per Task 3).
- 73-05 (E2E) can assert: a propose\_\* tool call renders the card; Approve commits under the caller JWT and records the D-06 actor; Reject commits nothing; the typed-confirm gates publish-to-subscribers. The actor-assertion E2E needs DEFER-73-03-A applied first.
- No new service-role surface; the P72 caller-JWT keystone is intact.

## Self-Check: PASSED

- All four created files + this SUMMARY exist on disk (verified below).
- All three task commits exist in git history (`23256d1a`, `bd58cc04`, `5d309700`).
- Verification suite: type-check PASS, test 8/8 PASS, lint PASS, build PASS.

---

_Phase: 73-agent-platform-writes-generative-ui_
_Completed: 2026-06-21_
