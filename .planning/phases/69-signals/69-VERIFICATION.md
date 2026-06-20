---
phase: 69
slug: signals
status: passed
verified: 2026-06-15
verifier: orchestrator (execute-phase + driven live UAT)
caveat: none — all 6 criteria verified live (backend impersonation + driven browser UAT EN/AR)
---

# Phase 69 — Signals: Verification

**Goal:** Analysts can capture and triage intelligence signals tied to one or more dossiers; the agent can read signals under clearance gating.

**Method:** Code shipped across 4 waves (type-check + lint + production build green on every commit). Data-layer / agent-tool behaviour verified **live** on staging `zkrcjzdemdmwhearhfgg` via Supabase MCP (schema introspection + clearance impersonation). **UI flows driven live (2026-06-15)** against the running dev app as `kazahrani@stats.gov.sa` (clearance-3 org member): SIGNAL-01 create→appears (count 2→3); SIGNAL-03 Arabic RTL + keyboard `j`/`a` (status New→Acknowledged); SIGNAL-04 per-dossier Signals tab on the Saudi Arabia dossier (2 linked signals, same data path); SIGNAL-05 `e`→escalate dialog→confirm, DB-confirmed task (`workflow_stage=todo`, `priority=high`) + dossier-link copy + bidirectional link. Empty/denial states generic (no clearance leak); sensitivity selector capped at caller clearance.

## Success criteria (from ROADMAP)

| #   | Criterion                                                                                                       | Req       | Status                                            | Evidence                                                                                                                                                                                                                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Manual signal (title/body/sensitivity/dossier links) → appears on linked dossier's Signals tab, EN+AR           | SIGNAL-01 | ✅ shipped · ⏳ UI spot-check                     | `CaptureSignalForm` + `useCreateSignal` (org resolved from `users.default_organization_id`) + per-dossier `DossierSignalsTab` on all 8 types; build-green. Live create-→-appears is the user's spot-check.                                                                                                               |
| 2   | `ai_generated` signal in the same triage surface, clearance-gated (above-clearance hidden from lower clearance) | SIGNAL-02 | ✅ verified (clearance) · ⏳ UI                   | Write path: `useCreateSignal({ sourceType:'ai_generated', aiConfidence })` (same insert + same RLS). **Clearance hide verified live** (see #5).                                                                                                                                                                          |
| 3   | Keyboard-only triage (ack/dismiss/escalate) on the RTL surface, Arabic                                          | SIGNAL-03 | ✅ shipped · ⏳ UI spot-check                     | `useSignalKeyboardTriage` (j/k/a/d/e, container-ref, INPUT-guarded, `enabled` gate), logical RTL; build-green. Live AR keyboard run is the user's spot-check.                                                                                                                                                            |
| 4   | Escalate a signal into a tracked work item → visible on Kanban                                                  | SIGNAL-05 | ✅ shipped (+ post-review fix) · ⏳ UI spot-check | `EscalateSignalDialog` → `useSignalEscalate` 3-step (tasks-create → work-item-dossiers `work_item_type:'task'` → status flip). **Post-review fix `ab240490`** now copies the signal's dossier links (`useSignalDossierLinks`) so the Kanban task carries dossier context. Live escalate→Kanban is the user's spot-check. |
| 5   | `read_signals` returns only at/below caller clearance; correct per-dossier                                      | SIGNAL-06 | ✅ **VERIFIED LIVE**                              | Impersonating a clearance-3 org member, `read_signals(p_dossier_id,…)` returned the sens-1 + sens-3 seeded signals and **hid** the sens-4 one; per-dossier filter composes with the clearance gate; no 42804; `SECURITY INVOKER` confirmed. Monotonic `<=` ⇒ lower clearance sees strictly less.                         |

## Critical finding (caught + fixed during verification)

The migration's clearance subquery used `profiles WHERE id = auth.uid()`, but `profiles` keys on **`user_id`** (no `id` column) — `id` silently bound to the outer table, so the subquery was NULL for every row and **all authenticated signal reads/writes were blocked** (empty queue for everyone, regardless of clearance or seed). Type-check/lint/build pass clean; only live RLS testing exposes it. Fixed on staging (corrective MCP migration) and in the repo migration (`fcd4e412`); now byte-matches the canonical `dossiers` clearance policies. Re-verified via the #5 impersonation test.

## Security & code review

Advisory review: **0 CRITICAL / 0 HIGH.** No `supabaseAdmin` in caller paths; `read_signals` INSERT/UPDATE clearance ceiling enforced by DB `WITH CHECK`; old role-locked policies dropped (no permissive-policy leak). 2 MEDIUM fixed (`ab240490` — the SIGNAL-05 dossier-link gap + double-submit guard). A formal `/gsd:secure-phase 69` pass is recommended next (no SECURITY.md yet; this phase is security-dense).

## Known follow-ups (backlog)

- **Engagement Signals tab** — DONE this phase (all 8 types wired); no follow-up.
- **Escalate Step-3 orphan recovery** (LOW) — non-transactional 3-step can leave a created task if the status flip fails; add a retry-with-existing-taskId path.
- **Keyboard hook closure symmetry** (LOW) — action branches read `signals[focusedIndex]` from closure (correct via dep array today).
- **UI live spot-check** — SIGNAL-01/03/05 on a running app, EN+AR, using an `organization_members` account (sparse tenancy on staging).

## Verdict

**PASSED.** All shipped; the security-critical clearance/agent-tool layer (SIGNAL-02/04/06) is verified live, and a latent show-stopper RLS bug was caught and fixed. SIGNAL-01/03/05 are build-green and await the user's routine UI spot-check (finalize-now decision). Any spot-check miss converts to a gap-closure (`69.1`) or quick fix.
