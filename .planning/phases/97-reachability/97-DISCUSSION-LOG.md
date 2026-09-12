# Phase 97: Reachability - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-17
**Phase:** 97-reachability
**Areas discussed:** Scope/requirement mapping, NAV-01 exposure mechanism, NAV-02 predicate
unification, NAV-03 populations, NAV-04 decision table + sub-item, gate authorship,
populations/oracles, house rules

---

## Question policy note

Per ORCH-BRIEF §2 rule 4 (the standing overseer discuss-phase policy), each gray area was
resolved from documents with citation rather than asked interactively: the phase acceptance
(`.tickmarkr/overseer/ACCEPTANCE-P97-PLAN.md`, pre-committed before this discussion), the
register (`.planning/REQUIREMENTS.md` rows 543–546), ROADMAP §Phase 97, the named prior-phase
inputs (`95-DEAD-04-DECISION.md`, `RULING-P92-06` via `DECISIONS.md` §D-7), and project
memory. **No genuine forks surfaced at discuss time — `PARK-P97.md` was not opened.** The one
potentially forking class (per-route nav-vs-delete for admin routes whose evidence
underdetermines the outcome) is explicitly routed to PARK at plan/execution time if it
materialises (CONTEXT D-06).

---

## NAV-01 — Elected Officials exposure

| Option                                | Description                                       | Selected                   |
| ------------------------------------- | ------------------------------------------------- | -------------------------- |
| Fix all four surfaces per criterion 1 | Sidebar + hub cards + /dossiers/create + /compare | ✓ (doc-determined)         |
| Partial exposure                      | Fewer surfaces                                    | rejected by criterion text |

**Basis:** ROADMAP criterion 1; REQUIREMENTS.md:132. EO representation (person_subtype vs
first-class type) delegated to research; broken-surface guard from acceptance condition 8.

## NAV-02 — predicate unification

| Option                           | Description                                   | Selected                      |
| -------------------------------- | --------------------------------------------- | ----------------------------- |
| ONE shared route-match predicate | Single source of truth consumed by both sites | ✓ (doc-determined)            |
| Sync the two checks              | Second synced copy                            | forbidden shape (condition 8) |

**Basis:** acceptance condition 8 names the forbidden shape (STAGE_TO_STATUS lesson);
anchors `AppShell.tsx:125` vs `settings.tsx:11-17` verified on disk.

## NAV-03 — populations

**Basis:** criterion 3 + ORCH-BRIEF §3: population = the 8 list pages, enumerated, naming
the one with an existing affordance. Recipes per condition 9.

## NAV-04 — decision table + services/auth.ts

**Basis:** conditions 1, 6, 8. `/monitoring` KEEP pre-ruled (RULING-P95-01) — row decides
nav entry only. `/delegations` + legal-holds excluded, rows say "owned elsewhere, untouched".
Sub-item delete-or-own with re-run zero-importer sweep + control test before any deletion.

## Gates, populations, oracles

**Basis:** conditions 2, 3, 4, 5, 7 — deletion-safe counts, INBOUND-LINK instrument with
stated blind spots + hand-classified residual + control-tested zeros, click-through oracles,
gate-drill both directions, c9b via script only.

---

## Claude's Discretion

- Shared predicate location/API; NAV-01 per-surface mechanism (post-research); decision-table
  layout; nav grouping for surviving admin routes; plan/wave decomposition.

## Deferred Ideas

None — out-of-scope surfaces recorded in CONTEXT.md Phase Boundary with owners.
