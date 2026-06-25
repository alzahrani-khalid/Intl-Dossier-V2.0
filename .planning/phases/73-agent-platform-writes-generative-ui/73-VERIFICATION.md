---
phase: 73-agent-platform-writes-generative-ui
status: passed
verified: '2026-06-24'
verification_kind: retroactive
verified_during: v7.0 milestone audit
requirements: [GENUI-01, GENUI-02, GENUI-03, GENUI-04]
must_haves_verified: 3
must_haves_total: 4
score: 3/4 fully verified (GENUI-01 partial — GAP-2)
evidence_basis:
  - gsd-integration-checker cross-phase report (v7.0 audit, 2026-06-24)
  - 73-02/03/04-SUMMARY.md (GENUI-01..04)
  - deferred-items.md (DEFER-73-01-A/B)
---

# Phase 73 — Writes + Generative UI: Verification

**Goal:** The copilot safely drives dossier actions with human-in-the-loop confirmation,
committing writes under the user's JWT, with immediate query-cache sync to the conventional UI.

**Verdict: PASSED with one partial (retroactive).** This VERIFICATION.md was authored during the
v7.0 milestone audit (2026-06-24) — the phase shipped with no VERIFICATION.md and no VALIDATION.md.
The write path (GENUI-02/03/04) is verified WIRED and correct in code by the v7.0
`gsd-integration-checker` report; GENUI-01 is PARTIAL (two read tools lack a token-bound renderer —
GAP-2). The historical prod break logged in `deferred-items.md` (DEFER-73-01-A) was resolved by
retiring the offending edge function (now GAP-3, a graceful degrade).

## Requirements

### GENUI-01 — token-bound bilingual cards inline, with deep-links. PARTIAL (GAP-2)

- Token-bound renderers registered for `get_dossier`, `list_dossiers`, `read_signals`
  (`frontend/src/components/copilot/genui/GenUiToolUIs.tsx:98-111`), rendering the app's own
  components inline with in-app deep-links.
- **Gap:** `query_graph` and `generate_digest_preview` results have **no** registered
  `makeAssistantToolUI` renderer — they render as model markdown, not token-bound cards.
  Tracked as **GAP-2** in `.planning/v7.0-MILESTONE-AUDIT.md` (affects GENUI-01, GRAPH-04).

### GENUI-02 — every state-changing action shows a bilingual HITL confirmation, commits only on approval. PASSED

- All four write actions (create/link work item, generate brief, publish digest, dismiss signal)
  are gated behind `ConfirmActionCard` (`frontend/src/components/copilot/hitl/ProposeToolUIs.tsx:152-305`);
  the propose-only tools validate + echo without building a Supabase client.
- **Note:** the conventional `dossiers-briefs-generate` edge function is retired-but-deployed
  (returns a `BRIEF_GENERATION_RETIRED` notice) — **GAP-3**, graceful degrade, tracked in the audit.

### GENUI-03 — approved writes commit under the user's JWT (RLS), never service-role. PASSED

- `useApproveWrite.ts` performs all four commits through the authenticated `@/lib/supabase` client
  (caller JWT); no service-role client is importable in the frontend. Integration checker confirmed
  zero service-role on the interactive write path.
- **Fixed during this audit (GAP-1):** `commitPublishDigest` previously stamped
  `clearance_level_at_generation = 1` for any caller; it now passes `null` so `publish_digest`
  derives the caller's real clearance (`LEAST(COALESCE(arg, v_clearance), v_clearance)`). The same
  `?? 1` defect in `GenerateDigestButton.tsx` was fixed in the same change.

### GENUI-04 — conventional UI reflects an approved copilot write immediately (query-cache sync). PASSED

- Post-commit TanStack invalidation present for all four write types in `useApproveWrite.ts`
  (`signalKeys.lists()`, `digestKeys.all`, `workItemKeys.lists()` + `byDossier`, `dossierKeys.detail()`).

## Caveats / outstanding

- **GENUI-01 partial (GAP-2):** add renderers for `query_graph` + `generate_digest_preview`.
- **GAP-3:** decide whether to remove or redirect the retired `dossiers-briefs-generate` function.
- No `73-VALIDATION.md` exists — Nyquist coverage for this phase is MISSING (run `/gsd:validate-phase 73`
  if Nyquist sign-off is required). Tracked in the milestone audit's Nyquist table.
