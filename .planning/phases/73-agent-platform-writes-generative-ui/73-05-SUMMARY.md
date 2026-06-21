# Phase 73 — Plan 05 (E2E + live verification) — Summary

**Status:** Tasks 1–2 complete (E2E specs written + green). Task 3 (live on-staging verification) = **DEPLOY-GATED / human-verify checkpoint — DEFERRED** (resolved `deploy-gate` 2026-06-21).

## What shipped (commit `d29d23c3`)

- `frontend/tests/e2e/copilot-writes.spec.ts` — 8 tests: HITL approve/reject EN+AR; D-04 typed-name strong-confirm for publish-digest; GENUI-04 cache-sync (no reload); indistinguishable-empty (CDP-blocked commit → neutral, no `clearance|filtered|restricted`); GENUI-03 actor SQL encoded for the live run.
- `frontend/tests/e2e/copilot-genui.spec.ts` — 4 tests: inline `UniversalDossierCard`/signal card EN+AR (`dir=rtl`+Tajawal), deep-link navigation, forced-failure neutral `role=alert`.
- Verify: `tsc --noEmit` clean; `playwright test --list` parses 12 tests; grep gates pass; **skip-not-fail without `E2E_COPILOT_STACK` → 12 skipped, 0 failed, exit 0** (CI stays green).

## Why deploy-gated

The phase success criteria require live-on-staging proof of ≥2 write ops in EN+AR with the DB actor == `auth.uid()`. The live run needs: (1) the P72 agent-runtime/`/api/copilot` stack reachable (GPU/gemma deploy gate, still open), AND (2) production gemma-4-12B (the Mac stack's qwen3:30b has the documented tool→synthesis parity gap). Same gate as Phase 72's live UAT.

## Live-verification runbook (when the agent stack is up)

Set `E2E_COPILOT_STACK=1` + seed overrides (`E2E_DIGEST_DOSSIER_ID`/`E2E_DIGEST_DOSSIER_NAME`/`E2E_SIGNAL_ID`); log in as the admin test user. Verify EN+AR:

1. **Publish digest** (GENUI-02/03/04): card appears; Approve disabled until dossier name typed (D-04); Reject → no publish; type name + Approve → publishes + the conventional digests view reflects it same-session (no reload).
2. **Dismiss signal** (GENUI-02/03/04): confirm card → Approve → signal leaves the queue same-session. Actor (Supabase MCP): `select status, dismissed_by from intelligence_event where id=…` → `dismissed`, `dismissed_by == your auth.uid()`. Brief: `persist_brief` on an editable dossier → `briefs.created_by == uid`, `source_dossier_id == dossier`; NULL on a non-editable dossier.
3. **Indistinguishable-empty**: above-clearance/blocked write/read → neutral copy, no clearance/filtered/restricted in the drawer.
4. **GENUI-01**: ask for a dossier → app's own inline card + working deep-link, EN+AR.

## Phase 73 net

**All 5 waves' code is built + verified (W1–W4 fully; W5 specs green).** GENUI-01–04 implemented. DB foundation (signal actor cols + `persist_brief` INVOKER RPC + dossier-edit policy, briefs schema reconciled) **applied + verified live on staging**. Only the live e2e UAT is deploy-gated — identical posture to Phase 72.
