# Phase 68: AI Foundations Remediation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 68-AI Foundations Remediation
**Areas discussed:** Canonical clearance model, Embedding fix scope, Assistant under RLS, Guardrails scope

---

## Pre-discussion: ROADMAP repair

Before discussion could start, `init.phase-op` returned `phase_found: false`. Root cause: the v7.0 milestone creation wrote the `### Phase NN:` detail sections only into `.planning/milestones/v7.0-ROADMAP.md`, not the main `.planning/ROADMAP.md` (which the phase resolver reads). With user approval, the Phase 68–74 detail sections were synced verbatim from the milestone file into the main roadmap (commit `fb03d71a`), matching the proven v6.6 format. Phase 68 then resolved cleanly.

---

## Canonical clearance model (REMED-01)

### Q1 — Target scale alignment (tiers onto clearance_level 1–4)

| Option                 | Description                                                                           | Selected |
| ---------------------- | ------------------------------------------------------------------------------------- | -------- |
| 3 tiers, clearance 1–4 | Keep 3 content tiers; clearance 1–3 gate them, level-4 sees all; no reclassification. |          |
| 4 aligned tiers (1:1)  | Make sensitivity 4-tier 1:1 with clearance; define a 4th tier; reclassify.            |          |
| You decide             | Claude chooses.                                                                       | ✓        |

**User's choice:** You decide.
**Notes:** Claude chose the "3 tiers + reserved level 4, single integer `sensitivity_level <= clearance_level`" model — least disruption, clean comparison, room to grow. Flagged RF-1 (verify live `sensitivity_level` type; spec said string, code treats as INTEGER).

### Q2 — Clearance source of truth

| Option             | Description                                                                                         | Selected |
| ------------------ | --------------------------------------------------------------------------------------------------- | -------- |
| Per-user attribute | `profiles.clearance_level` single source, independent of role, backfilled from role-derived values. | ✓        |
| Derived from role  | Keep clearance computed from `user_roles`.                                                          |          |
| You decide         | Claude chooses.                                                                                     |          |

**User's choice:** Per-user attribute (Recommended).

### Q3 — Migration posture for existing 1–3 policies

| Option                   | Description                                                                               | Selected |
| ------------------------ | ----------------------------------------------------------------------------------------- | -------- |
| Compat shim              | Re-point `get_user_clearance_level()` to read `profiles`, return 1–4; policies unchanged. | ✓        |
| Rewrite all policies now | Replace every call with direct reads; retire the function.                                |          |
| You decide               | Claude chooses.                                                                           |          |

**User's choice:** Compat shim (Recommended).

### Q4 — Phase scope for clearance enforcement

| Option                      | Description                                                  | Selected |
| --------------------------- | ------------------------------------------------------------ | -------- |
| DB/RLS + RPC + AI paths     | Fix scale, RLS, INVOKER RPCs, AI read paths; middleware out. | ✓        |
| Also fix backend middleware | Implement `clearance-check.ts` too.                          |          |
| You decide                  | Claude chooses.                                              |          |

**User's choice:** DB/RLS + RPC + AI paths (Recommended).

---

## Embedding fix scope (REMED-04 / REMED-02)

### Q1 — Interim semantic-search quality before P72 re-embed

| Option                | Description                                                                | Selected |
| --------------------- | -------------------------------------------------------------------------- | -------- |
| Keyword fallback OK   | Degrade to existing full-text/keyword fallback for un-re-embedded content. | ✓        |
| Must stay full vector | Pull the full re-embed forward into P68.                                   |          |
| You decide            | Claude chooses.                                                            |          |

**User's choice:** Keyword fallback OK (Recommended).

### Q2 — Existing corrupted vectors

| Option                 | Description                                               | Selected |
| ---------------------- | --------------------------------------------------------- | -------- |
| Leave for P72 re-embed | Stop new corruption; existing vectors re-embedded at P72. | ✓        |
| Quarantine/flag now    | Mark stale so search skips them.                          |          |
| Re-embed now in P68    | Pull P72's re-embed forward.                              |          |
| You decide             | Claude chooses.                                           |          |

**User's choice:** Leave for P72 re-embed (Recommended).

### Q3 — How far to take the embedding write path

| Option                        | Description                                                 | Selected |
| ----------------------------- | ----------------------------------------------------------- | -------- |
| Land native-1024 writes now   | Local bge-m3 ONNX → new 1024 halfvec store; satisfies SC#4. | ✓        |
| Minimal: stop corruption only | Remove pad/truncate; native path moves to P72.              |          |
| You decide                    | Claude chooses.                                             |          |

**User's choice:** Land native-1024 writes now (Recommended).

---

## Assistant under RLS (REMED-03 / REMED-02)

### Q1 — Cross-clearance reads vs caller-clearance only

| Option                | Description                                             | Selected |
| --------------------- | ------------------------------------------------------- | -------- |
| Caller-clearance only | No elevated reads; aggregation moves to cron+app-authz. | ✓        |
| Preserve a carve-out  | Keep a specific elevated read behind app-authz.         |          |
| You decide            | Claude chooses.                                         |          |

**User's choice:** Caller-clearance only (Recommended).
**Notes:** Recorded RF-2 — confirm `chat-assistant.ts` runs in a JWT-carrying request context.

### Q2 — Behavior when filtered to empty

| Option                               | Description                                                   | Selected |
| ------------------------------------ | ------------------------------------------------------------- | -------- |
| Indistinguishable empty              | Generic "no results"; don't reveal classified content exists. | ✓        |
| Explicit "nothing at your clearance" | Tell the user content was hidden (leaks existence).           |          |
| You decide                           | Claude chooses.                                               |          |

**User's choice:** Indistinguishable empty (Recommended).

### Q3 — Repoint legacy commitments/engagements reads

| Option               | Description                                                             | Selected |
| -------------------- | ----------------------------------------------------------------------- | -------- |
| Repoint to canonical | Point reads at `aa_commitments` / `engagement_dossiers` while rewiring. | ✓        |
| JWT swap only        | Retire supabaseAdmin only; repoint later.                               |          |
| You decide           | Claude chooses.                                                         |          |

**User's choice:** Repoint to canonical (Recommended).

---

## Guardrails scope (REMED-05 / REMED-06)

### Q1 — Observability scaffolding depth

| Option                             | Description                                                       | Selected |
| ---------------------------------- | ----------------------------------------------------------------- | -------- |
| Both, minimal config               | Stand up Langfuse + Phoenix containers + OTel; trace one request. | ✓        |
| OTel + Langfuse now; Phoenix later | Only Langfuse now; Phoenix with the eval harness.                 |          |
| You decide                         | Claude chooses.                                                   |          |

**User's choice:** Both, minimal config (Recommended).

### Q2 — i18n-namespace CI guard placement

| Option                      | Description                                                                  | Selected |
| --------------------------- | ---------------------------------------------------------------------------- | -------- |
| Fold into existing Lint     | Guard fails the existing required Lint context; no branch-protection change. | ✓        |
| Dedicated required CI check | Standalone required context (+1 branch-protection context).                  |          |
| You decide                  | Claude chooses.                                                              |          |

**User's choice:** Fold into existing Lint (Recommended).

---

## Claude's Discretion

- **Scale alignment (Q1, clearance):** user delegated; Claude chose 3 content tiers (1–3) + reserved level 4 with a single integer comparison.
- **Embedding store shape** (new column vs new table) — left to researcher.
- **i18n guard mechanism** (custom ESLint rule vs lint-invoked script) — left to researcher.

## Deferred Ideas

None — discussion stayed within phase scope. Adjacent work surfaced is already roadmapped (full re-embed + TEI → P72; AnythingLLM retirement → P74; backend `clearance-check.ts` → later).
