# Phase 63: Relationship Graph Route & Bidirectional Traversal - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 63-relationship-graph-route-bidirectional-traversal
**Areas discussed:** Route fate: mount vs retire, Graph content & depth, Page design conformance, Entry points

---

## Route fate: mount vs retire

| Option                 | Description                                                                                                                       | Selected |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Mount it (Recommended) | Remove the redirect and render RelationshipGraphPage; page, bidirectional RPC migration, and entry-point button all already exist | ✓        |
| Retire it formally     | Delete page + redirect route, remove "View Full Graph" button, document mini-graph + list view as the contract                    |          |
| Decide after research  | Researcher assesses page condition; planner proposes mount-or-retire with evidence                                                |          |

**User's choice:** Mount it

| Option                          | Description                                                 | Selected |
| ------------------------------- | ----------------------------------------------------------- | -------- |
| Alert + link back (Recommended) | Honest empty state plus a button to /dossiers — no dead end | ✓        |
| Inline dossier picker           | Embed a dossier search/select so the page works standalone  |          |
| Keep dead-end alert as-is       | Zero extra work; users navigate away themselves             |          |

**User's choice:** Alert + link back
**Notes:** Contract is that the graph is reached FROM a dossier; standalone use stays minimal.

---

## Graph content & depth

| Option                           | Description                                                                                  | Selected |
| -------------------------------- | -------------------------------------------------------------------------------------------- | -------- |
| Fix in place (Recommended)       | Redefine traverse_relationship_graph itself to walk both directions; all callers get the fix | ✓        |
| Point edge fn at \_bidirectional | Keep old RPC; switch edge function to the bidirectional variant                              |          |
| You decide                       | Researcher checks staging deployment state and picks the safest path                         |          |

**User's choice:** Fix in place

| Option                           | Description                                  | Selected |
| -------------------------------- | -------------------------------------------- | -------- |
| Directional arrows (Recommended) | Each edge keeps its true source→target arrow | ✓        |
| Undirected lines                 | Connection + type label only, no arrowheads  |          |
| You decide                       | Match MiniRelationshipGraph's treatment      |          |

**User's choice:** Directional arrows

| Option                        | Description                                                          | Selected |
| ----------------------------- | -------------------------------------------------------------------- | -------- |
| Keep both as-is (Recommended) | Default 2 degrees + type filter stay; verify with bidirectional data | ✓        |
| Simplify to 1 degree default  | Smaller first render given bidirectional node growth                 |          |
| You decide                    | Verification on staging data decides                                 |          |

**User's choice:** Keep both as-is

---

## Page design conformance

| Option                             | Description                                                             | Selected |
| ---------------------------------- | ----------------------------------------------------------------------- | -------- |
| DoD conformance pass (Recommended) | Run UI Definition-of-Done checklist; fix violations, no layout redesign | ✓        |
| Minimal functional fix             | Touch styling only where the traversal/route work requires              |          |
| Full Bureau re-skin                | Rebuild page against the IntelDossier prototype                         |          |

**User's choice:** DoD conformance pass

| Option                              | Description                                                                          | Selected |
| ----------------------------------- | ------------------------------------------------------------------------------------ | -------- |
| Full RTL verification (Recommended) | Chrome flips with dir=rtl, name_ar node labels, controls/legend read correctly in AR | ✓        |
| Chrome-only RTL                     | Verify chrome; accept direction-neutral canvas                                       |          |
| You decide                          | Match mini-graph's RTL treatment                                                     |          |

**User's choice:** Full RTL verification

---

## Entry points

| Option                               | Description                                                                | Selected |
| ------------------------------------ | -------------------------------------------------------------------------- | -------- |
| Mini-graph button only (Recommended) | Existing "View Full Graph" button is the contract entry point; zero new UI | ✓        |
| Also add a DossierShell action       | Graph action in the dossier header alongside Export                        |          |
| Also add sidebar navigation          | /relationships/graph as a top-level sidebar destination                    |          |

**User's choice:** Mini-graph button only

| Option                                   | Description                                                                            | Selected |
| ---------------------------------------- | -------------------------------------------------------------------------------------- | -------- |
| All dossier types in graph (Recommended) | Graph contains nodes of every reachable type; click each, confirm per-type route loads | ✓        |
| Representative subset                    | Country + organization + one more; trust getDossierDetailPath for the rest             |          |
| You decide                               | Planner scopes verification from actual staging relationship data                      |          |

**User's choice:** All dossier types in graph

## Claude's Discretion

- In-place RPC redefinition mechanics (new migration vs. consolidating with the `_bidirectional` variant; redundancy cleanup)
- Edge deduplication when both directions surface the same row
- Disposition of the two unrouted duplicate graph components
- Empty-graph / loading / error states and arrow styling details
- TanStack Router `validateSearch` for `dossierId`

## Deferred Ideas

- Inline dossier picker on the graph page (standalone destination)
- Additional entry points (DossierShell header action, sidebar navigation)
- Full Bureau re-skin of the graph page
- `graph-traversal-advanced` feature set (shortest path, all paths, connected components)
