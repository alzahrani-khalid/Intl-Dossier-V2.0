# Phase 96: Real Numbers - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-17
**Phase:** 96-real-numbers
**Areas discussed:** Requirement set & scope, /analytics branch, COUNT-04 overdue notions,
staff_profiles seed scope, standing law carry-forward

**Mode:** Orchestrated leg under `.tickmarkr/overseer/ORCH-BRIEF.md` §2 rule 4 (overseer question
policy): questions determined by documents were answered with the citation; the one genuine
product fork was PARKED, not auto-answered. No interactive AskUserQuestion turns were run — the
overseer pre-delegated this policy in writing.

---

## Requirement set — nine vs the ROADMAP's six

| Option            | Description                                             | Selected |
| ----------------- | ------------------------------------------------------- | -------- |
| ROADMAP's six IDs | DEAD-05..07, COUNT-01..03 as listed at ROADMAP.md:442   |          |
| Register's nine   | + COUNT-04, TRIGSWEEP-01, SANDBOX-500-01 (rows 530–540) | ✓        |

**Resolution:** Determined by documents — `ACCEPTANCE-P96-PLAN.md` condition 1 (register wins,
third phase running). ROADMAP line reconciled in commit `e0fe78a5d`.

---

## DEAD-05 — /analytics: real data vs honestly disabled

| Option                          | Description                                       | Selected           |
| ------------------------------- | ------------------------------------------------- | ------------------ |
| Real data                       | Wire each widget to a real backend path           | (research decides) |
| Honestly disabled               | Recorded decision branch, explicit rendered state | (research decides) |
| Quiet stub / fabricated visuals | Sparklines/donuts over a missing endpoint         | ✗ forbidden        |

**Resolution:** Determined by documents — `REQUIREMENTS.md:91` and ACCEPTANCE condition 8
authorize EITHER of the first two, demand the branch be RECORDED, and forbid the third. The
branch choice is research-feasibility-driven (D-03); either way it is a recorded decision
branch, never silence.

---

## COUNT-04 — the drag-refusal interaction once overdue is renderable

| Option             | Description                                    | Selected                                             |
| ------------------ | ---------------------------------------------- | ---------------------------------------------------- |
| Keep P94's refusal | Honest-before-write; predicate mirrors trigger | (parked; plans authored to this as no-change branch) |
| Allow-and-reflect  | Let trigger coerce, render coerced result      | (parked)                                             |

**Resolution:** PARKED as `PARK-96-01` (`.tickmarkr/overseer/PARK-P96.md`) — `RULING-P94-03`
explicitly leaves this open; documents authorize the revisit but do not determine its answer.
Recommendation filed: keep refusal. Work continues around the park.

---

## staff_profiles seed — in or out of scope (ACCEPTANCE condition 9)

| Option                              | Description                                              | Selected |
| ----------------------------------- | -------------------------------------------------------- | -------- |
| IN — seed namespaced synthetic rows | Would let a populated queue render                       |          |
| OUT — defer to DATA-01 (P102)       | Queue is P95's closed surface; staging data has an owner | ✓        |

**Resolution:** OUT, named (D-13), with a tripwire: research verifies no Phase 96 criterion
surface reads `staff_profiles`; if one does, the decision escalates to a park.

---

## Standing law carry-forward

Carried from P93 D-17..D-20 / P94 D-23..D-29 / P95 D-11..D-20 into D-14..D-23, extended by the
three new ACCEPTANCE-P96 conditions (entry-specific close shapes; post-close-mutation naming;
contemporaneous agreement). No alternatives — these are rulings, not preferences.

## Claude's Discretion

COUNT-01 unification mechanism; DEAD-06/07 fix internals; word-assistant probe target; sandbox
repair shape (after cause derivation); TRIGSWEEP-01 instrument implementation (behaviour-derived,
both-direction tested).

## Deferred Ideas

See CONTEXT.md `<deferred>` — the full out-of-phase register assignment list, the off-limits
intended-broken surfaces, and the operator parks (Arabic naturalness, pixel RTL).
