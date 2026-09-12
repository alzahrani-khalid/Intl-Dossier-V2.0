# Phase 95: Routes That Don't Render - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-16
**Phase:** 95-routes-that-don-t-render
**Areas discussed:** Requirement set, /monitoring keep-or-delete, notFound enforcement,
retention-cast fix shape, DEAD-09 generation path, slot consolidation

**Mode note:** This discussion ran under the overseer protocol
(`.tickmarkr/overseer/ORCH-BRIEF.md` §2 rule 4): questions determined by documents were answered
by the orchestrator with source citations; genuine product forks were PARKED to
`.tickmarkr/overseer/PARK-P95.md` for overseer ruling — never auto-answered. No AskUserQuestion
checkpoints were auto-answered.

---

## Requirement set (eight vs five)

| Option                  | Description                                         | Selected |
| ----------------------- | --------------------------------------------------- | -------- |
| ROADMAP's five-ID line  | DEAD-01..04, DEAD-08                                |          |
| Register's eight-ID set | + DEAD-09, NOTFOUND-COMPONENT-01, RETENTION-CAST-01 | ✓        |

**Resolution:** Document-determined — REQUIREMENTS.md register table (rows 521–524, 528–529,
567, 571) wins per `ACCEPTANCE-P95-PLAN.md` condition 1. ROADMAP reconciled at `d165b3e53`.

---

## DEAD-04 — /monitoring keep-or-delete

| Option                  | Description                                                | Selected |
| ----------------------- | ---------------------------------------------------------- | -------- |
| Keep SPA + narrow proxy | monitoring.tsx wins the prefix; proxy claim narrowed/moved | ✓        |
| Delete route            | Remove monitoring.tsx, decision recorded                   |          |

**Resolution:** Genuine product fork → PARKED as `PARK-95-01`, RULED same day by the overseer
(`RULING-P95-01-PARK-MONITORING.md`): KEEP + narrow proxy, three conditions attached
(mechanical caller enumeration, `deploy/` nginx check, decision recorded where P97 reads it).

---

## NOTFOUND-COMPONENT-01 — enforce or retire

| Option            | Description                                            | Selected    |
| ----------------- | ------------------------------------------------------ | ----------- |
| Add lint/gate     | Enforce `{ routeId: rootRouteId }` on component throws | ✓ (default) |
| Retire explicitly | Recorded retirement per the entry's own text           | conditional |

**Resolution:** Document-guided conditional (register entry's own text delegates the call to
Phase 95): default = add enforcement if research proves it expressible with positive+negative
controls; retirement requires a park + ruling, never a silent drop.

---

## RETENTION-CAST-01 — fix shape

**Resolution:** Document-determined — REQUIREMENTS.md:336 forbids `Array.isArray(x) ? x : []`;
the six casts unwrap the real `{data:[...]}` envelope. No alternatives were open.

---

## DEAD-09 — generation path

**Resolution:** Ship REAL generation (mission text, ORCH-BRIEF §3); honest unavailable terminal
state is the only fallback (`RULING-P94-04` §PARK-94-06). Path choice (custom-reports flow vs
Express `/report-builder/generate`) left to research/planner discretion.

---

## Claude's Discretion

- Which param file survives the DEAD-08 slot consolidation
- Internal shape of the `/search` data-path fix
- DEAD-09 backend path choice (subject to the real-artifact test)
- Lint-rule mechanics for NOTFOUND-COMPONENT-01

## Deferred Ideas

- All out-of-phase requirements listed in CONTEXT.md `<deferred>` (P96–P102 assignments) — none
  folded in.
