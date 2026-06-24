# Phase 71: Analytic Graph - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-17
**Phase:** 71-Analytic Graph
**Areas discussed:** Query set & inputs, Result presentation, Surface & launcher, Data source & RPC reconciliation

---

## Gray-area selection

| Option                           | Description                                                  | Selected |
| -------------------------------- | ------------------------------------------------------------ | -------- |
| Query set & inputs               | v1 analytic query set + parameterization                     | ✓        |
| Result presentation              | Graph overlay vs structured result vs both                   | ✓        |
| Surface & launcher               | Where queries launch (Network panel / dossier / Cmd+K / hub) | ✓        |
| Data source & RPC reconciliation | Participation tables + existing DEFINER traversal fate       | ✓        |

**User's choice:** All four areas.

---

## Query set & inputs

| Option                  | Description                                                                                                                | Selected |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| Exactly the 3 named     | who-sits-on-which-forum, shared committees, engagement chains over N days. Matches GRAPH-01 verbatim; one INVOKER RPC each |          |
| 3 named + shortest-path | Add "how are X and Y connected?" as a 4th, promoting the existing `get_relationship_path` (DEFINER) to INVOKER             |          |
| You decide              | Let Claude choose the v1 set based on the existing data model                                                              | ✓        |

**User's choice:** "you decide the best for the project"
**Notes:** Claude locked the 3 named as the v1 floor + an optional 4th shortest-path query promoting the existing `get_relationship_path` CTE **if** the researcher confirms it is low-cost (RF-4). Inputs decided as entity-anchored parameterized templates (1 entity / 2 entities / entity + window N), dossier context pre-fills the primary entity (D-01, D-02).

---

## Result presentation

| Option                                 | Description                                                                                                                            | Selected |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Structured result primary + graph view | Structured list/table/timeline/path default; React Flow highlighted-subgraph via existing Graph/List tabs; compact Cmd+K inline result | ✓        |
| Graph overlay primary                  | Render each result as a highlighted subgraph on the Network panel; list secondary                                                      |          |
| Structured result only (no graph v1)   | Results table/timeline per query; skip graph rendering this phase                                                                      |          |
| You decide                             | Let Claude pick the presentation                                                                                                       |          |

**User's choice:** Structured result primary + graph view
**Notes:** Reuses the existing Graph/List tab pattern on `/relationships/graph`; clearance reduction (GRAPH-03) verified as fewer rows/nodes; Cmd+K shows a compact inline result per GRAPH-02 (D-03).

---

## Surface & launcher

| Option                          | Description                                                                                          | Selected |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| Network panel + dossier + Cmd+K | "Analyze" picker on the existing /relationships/graph panel + per-dossier affordance + Cmd+K entries | ✓        |
| New tab in /intelligence hub    | Analytic queries as a new tab alongside Signals/Digests/Alerts                                       |          |
| Cmd+K-first                     | Primary launch via Cmd+K; deep-link into the Network panel                                           |          |
| You decide                      | Let Claude pick the surfacing                                                                        |          |

**User's choice:** Network panel + dossier + Cmd+K
**Notes:** One analytic experience, three entry points, anchored on the existing `/relationships/graph` Network panel; explicitly NOT a new `/intelligence` tab (the graph experience already lives at `/relationships/graph`) (D-04).

---

## Data source & RPC reconciliation

| Option                                  | Description                                                                                                                       | Selected |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------- |
| New INVOKER RPCs; leave traversal as-is | Named queries = new SECURITY INVOKER RPCs over participation tables; existing 3 DEFINER fns untouched (hardening follow-up noted) |          |
| New INVOKER RPCs + convert existing 3   | Also retrofit the 3 existing traversal functions to SECURITY INVOKER                                                              |          |
| You decide                              | Let Claude choose after researcher maps the live data model                                                                       | ✓        |

**User's choice:** "You decide"
**Notes:** Claude locked "new INVOKER RPCs over the authoritative participation tables; existing DEFINER traversal left as-is" — tightest scope, satisfies GRAPH-04 for everything this phase ships; the 3 existing DEFINER functions already clearance-filter inline and are tested, so their DEFINER status is recorded as a separate repo-wide hardening follow-up rather than converted in P71. The 4th shortest-path query (if shipped) needs an INVOKER path (convert-in-place vs new variant = researcher's call). Biggest research flag: where forum/WG membership actually lives on live staging (RF-1) (D-05).

---

## Claude's Discretion

- **v1 query set** (D-01) — 3 named + optional cost-gated 4th shortest-path.
- **Inputs / anchoring + time-window N** (D-02) — entity-anchored templates with dossier-context pre-fill; default N = planner's call.
- **Data source + existing-traversal fate** (D-05) — new INVOKER RPCs over participation tables; leave the 3 DEFINER functions as-is (hardening follow-up).
- **RPC shape** (single multiplexed `query_graph` vs per-query), **engagement-chain definition**, **"committee" entity-type set** = planner/researcher.

## Deferred Ideas

- Mastra / CopilotKit agent wrapping `query_graph` + conversational/generative-UI graph answers → P72 / P73.
- Converting the 3 existing DEFINER traversal functions to INVOKER (repo-wide hardening sweep) → separate follow-up.
- Custom analytic query builder, saved/named queries, count/window analytics beyond the named set, analytic-result graph export → future.
- `p68-followup-supabaseadmin-background-agents.md` todo — reviewed, kept separate (keyword false-positive; a P68 background-agent security follow-up, not analytic-graph work).
