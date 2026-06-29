---
quick_id: 260629-gb4
slug: v7-carryin-closeout
date: 2026-06-29
status: in-progress
title: v7.0 milestone carry-in closeout
---

# Quick Task: v7.0 milestone carry-in closeout

## Context

The v7.0 milestone-close left three carry-in items. Verified against live state
(code + staging deploy state + git) before acting:

- **p68 supabaseAdmin todo** — ALREADY FIXED in P72 (D-10) + P74. Both
  `brief-generator.ts:25` and `intake-linker.ts:28` build a per-request
  JWT-scoped anon client (no service-role); RLS (`sensitivity_level <=
clearance_level`) enforces clearance. Dir-wide grep: zero `supabaseAdmin` in
  `backend/src/ai/agents/`. Only bookkeeping remained.
- **prod-quality-sweep edge fns** — the CRITICAL security fixes (MFA backdoor,
  email open-relay, intake IDOR, positions-approve) are already deployed. ~10
  non-critical security/hardening fns from the 06-27 sweep (commits `44789e48`,
  `e8935399`, `08011460`) still served Oct-2025–Jan-2026 code on staging.
- **GPU/TEI deploy-gated verification** (EVAL-01/02/03 + AGENT/INFRA) — user
  decision: ACCEPT INTERIM EVIDENCE (impersonation + Mac-local) in lieu of the
  on-prem production GPU path.

## Tasks

1. **Deploy 10 stale security/hardening edge functions** to staging
   (`zkrcjzdemdmwhearhfgg`) via `supabase functions deploy <name>` (CLI
   auto-bundles `_shared`; verify_jwt default true — none are webhooks).
   The 10: positions-request-revisions, after-actions-approve-edit,
   after-actions-reject-edit, commitments-update-status, briefing-books,
   contextual-suggestions, stakeholder-influence, populate-countries,
   populate-countries-v2, document-content-search.
   EXCLUDE ai-summary-generate (imports `../_shared/onprem-llm.ts` →
   GPU-stack-gated, deferred with the intelligence set).
   - verify: `supabase functions list` shows fresh `updated_at` for all 10.

2. **Retire the verified-done todo**:
   `git mv .planning/todos/pending/p68-followup-supabaseadmin-background-agents.md
.planning/todos/completed/` + append a closure note citing P72 (D-10) + P74.
   - verify: file in `completed/`; grep confirms zero `supabaseAdmin` in
     `backend/src/ai/agents/`.

3. **Record ADR-007** in `.planning/decisions/` accepting interim verification
   evidence for the v7.0 deploy-gated checks.
   - verify: `ADR-007-*.md` exists with `Status: Accepted`.

## Out of scope (formally deferred)

- Standing up the on-prem GPU/TEI stack (deferred via ADR-007).
- Deploying the ~15 `intelligence-*` / `search-semantic` / `translate-content` /
  `dossier-field-assist` edge fns (downstream of the GPU stack; stale on staging
  by design until that path exists).
- `ai-summary-generate` (onprem-llm dependency — moves with the intelligence set).
