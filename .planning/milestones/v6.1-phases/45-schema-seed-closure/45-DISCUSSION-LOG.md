# Phase 45: Schema & Seed Closure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md; this log preserves alternatives considered.

**Date:** 2026-05-07
**Phase:** 45-schema-seed-closure
**Areas discussed:** intelligence_digest table boundary, VIP ISO enrichment contract, Seed application path

---

## intelligence_digest Table Boundary

| Option                         | Description                                                        | Selected |
| ------------------------------ | ------------------------------------------------------------------ | -------- |
| Bare dashboard feed table      | Minimal table for DATA-01/DATA-02 only; avoids v7 signal modeling. | Yes      |
| Early v7 signal model          | Add intelligence_signal-style concepts now.                        |          |
| Generic reporting/digest table | Broader reusable digest/report model.                              |          |

**User's choice:** Fallback default selected because the interactive question tool was unavailable.
**Notes:** Preserve all DATA-01 display columns, add only ownership/security support needed for org-scoped RLS, and route the widget through `useIntelligenceDigest`.

---

## VIP ISO Enrichment Contract

| Option                        | Description                                                              | Selected |
| ----------------------------- | ------------------------------------------------------------------------ | -------- |
| Extend get_upcoming_events    | Add nullable person fields to the existing operations-hub RPC contract.  | Yes      |
| Create dashboard-only VIP RPC | Keep timeline contract unchanged but add a second dashboard data source. |          |
| Client-side second query      | Fetch person/country enrichment separately after events load.            |          |

**User's choice:** Fallback default selected because the interactive question tool was unavailable.
**Notes:** Prefer existing engagement/person relationships and `countries.iso_code_2`; avoid creating a `country_iso_codes` table or a `vip_visit` enum unless research proves it is required.

---

## Seed Application Path

| Option                            | Description                                                                                      | Selected |
| --------------------------------- | ------------------------------------------------------------------------------------------------ | -------- |
| MCP apply with migration artifact | Apply to staging through Supabase MCP and keep a committed migration/apply artifact when needed. | Yes      |
| Manual psql one-off               | Apply directly outside the project workflow.                                                     |          |
| Local seed only                   | Leave staging unmodified and document operator action.                                           |          |

**User's choice:** Fallback default selected because the interactive question tool was unavailable.
**Notes:** The canonical file is `supabase/seed/060-dashboard-demo.sql`; `frontend/seeds/060-dashboard-demo.sql` in active docs is stale.

---

## Agent Discretion

- The workflow selected all three gray areas and locked conservative defaults after `request_user_input` was unavailable in Default mode.
- Research/planning should update `45-CONTEXT.md` before planning if the user later overrides any default.

## Deferred Ideas

- Full v7 intelligence engine remains deferred.
- Visual baseline regeneration remains Phase 46.
