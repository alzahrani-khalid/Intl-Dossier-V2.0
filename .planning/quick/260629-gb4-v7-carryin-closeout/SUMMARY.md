---
quick_id: 260629-gb4
slug: v7-carryin-closeout
date: 2026-06-29
status: complete
title: v7.0 milestone carry-in closeout
---

# Summary: v7.0 milestone carry-in closeout

Closed out the v7.0 milestone-close carry-in. All three items were verified
against live state first; two turned out to be already substantially done.

## What was done

### 1. Deployed 10 stale security/hardening edge functions to staging

Project `zkrcjzdemdmwhearhfgg`, via `supabase functions deploy` (CLI auto-bundles
`_shared`). All 10 confirmed live with 2026-06-29 timestamps, versions bumped:

| Function                    | New version |
| --------------------------- | ----------- |
| positions-request-revisions | v10         |
| after-actions-approve-edit  | v10         |
| after-actions-reject-edit   | v10         |
| commitments-update-status   | v10         |
| briefing-books              | v5          |
| contextual-suggestions      | v3          |
| stakeholder-influence       | v4          |
| populate-countries          | v5          |
| populate-countries-v2       | v4          |
| document-content-search     | v5          |

These carried security / auth-guard / perf fixes (commits `44789e48`,
`e8935399`, `08011460`) that were merged but never deployed — staging had been
serving Oct-2025–Jan-2026 code. The CRITICAL fixes from the same sweep (MFA
backdoor, email open-relay, intake IDOR, positions-approve) were already live.
EXCLUDED `ai-summary-generate` (imports `../_shared/onprem-llm.ts` →
GPU-stack-gated, deferred with the intelligence set).

### 2. Retired the p68 supabaseAdmin todo (already fixed)

Verified `brief-generator.ts:25` + `intake-linker.ts:28` were remediated in
P72 (D-10) + P74 — both use per-request JWT-scoped anon clients, RLS
(`sensitivity_level <= clearance_level`) enforces clearance, and a dir-wide grep
shows zero `supabaseAdmin` usage in `backend/src/ai/agents/`. Moved the todo to
`completed/` with a closure note.

### 3. Recorded ADR-007 — accept interim v7.0 verification evidence

Per user decision, formally accepted impersonation + Mac-local e2e evidence as
sign-off for EVAL-01/02/03 + AGENT + INFRA, deferring the on-prem GPU/TEI
production path to a future milestone. Residual risk documented (production GPU
path unverified → re-run required before any prod rollout; ~15 intelligence edge
fns intentionally stale on staging until that path exists).

## Residual state

The only remaining v7.0 carry-in is the on-prem GPU/TEI production bring-up — now
formally deferred (ADR-007), not an open blocker.

## Deviations

- Created branch `chore/v7.0-carryin-closeout-260629` (GSD config had
  `branch_name=null`) because `main` is push-protected — these commits need a PR
  to land.
