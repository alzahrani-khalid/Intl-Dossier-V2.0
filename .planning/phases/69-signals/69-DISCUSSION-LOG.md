# Phase 69: Signals - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 69-Signals
**Areas discussed:** Triage surface, Triage states, Signal fields, Escalate → work item

---

## Triage surface

### Surface shape

| Option                               | Description                                                                                                    | Selected |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- | -------- |
| Global queue + dossier filtered view | One global triage inbox (reuses IntakeQueue pattern); dossier Signals tab = same data filtered. One code path. | ✓        |
| Two distinct surfaces                | A global inbox AND an independently-built per-dossier tab.                                                     |          |
| Per-dossier Signals tab only         | No global queue in P69.                                                                                        |          |

### Navigation home

| Option                      | Description                                                                  | Selected |
| --------------------------- | ---------------------------------------------------------------------------- | -------- |
| Section under /intelligence | Fold into the existing /intelligence workspace (consolidates v7.0 surfaces). | ✓        |
| New top-level /signals      | Dedicated sidebar entry.                                                     |          |
| Operations Hub zone         | New attention zone in Operations Hub.                                        |          |

### Keyboard interaction

| Option                          | Description                                      | Selected |
| ------------------------------- | ------------------------------------------------ | -------- |
| Email-style inbox (j/k + a/d/e) | Arrow/j-k to move, single keys to act. RTL-safe. | ✓        |
| Table + row-select + shortcuts  | DataTable + toolbar; shortcuts on focused row.   |          |
| One-at-a-time card review       | Focused card stack, decide then advance.         |          |

**User's choice:** Global queue + dossier filtered view; under /intelligence; email-style inbox.
**Notes:** Single triage muscle-memory and one query/component path were the deciding factors.

---

## Triage states

### Lifecycle

| Option                                             | Description                                          | Selected |
| -------------------------------------------------- | ---------------------------------------------------- | -------- |
| Lean: new → acknowledged \| dismissed \| escalated | Minimal; matches SIGNAL-03 exactly.                  | ✓        |
| Add explicit resolved/closed state                 | new → acknowledged → resolved + dismissed/escalated. |          |
| Mirror work-item status vocab                      | pending/in_progress/review/completed/cancelled.      |          |

### Dismiss reversibility

| Option                                       | Description                                    | Selected |
| -------------------------------------------- | ---------------------------------------------- | -------- |
| Reversible (restore from a Dismissed filter) | Status-based; nothing hard-deleted; auditable. | ✓        |
| Terminal (final, no restore in P69)          | Dismiss hides permanently.                     |          |

### Who can capture/triage

| Option                                            | Description                                  | Selected |
| ------------------------------------------------- | -------------------------------------------- | -------- |
| Any cleared user (clearance-gated, role-agnostic) | Loosens current admin/editor-only write RLS. | ✓        |
| Keep admin/editor-only writes                     | Plain analysts read-only.                    |          |
| Split: capture = editor, triage = any cleared     | Mixed model.                                 |          |

**User's choice:** Lean lifecycle; reversible dismiss; any cleared user can capture + triage.
**Notes:** Accepts that the existing `intelligence_event` admin/editor-only write RLS must be loosened to a clearance-gated model (flagged as RF-2 for research).

---

## Signal fields

### Category/type

| Option                 | Description                                                                         | Selected |
| ---------------------- | ----------------------------------------------------------------------------------- | -------- |
| Fixed category enum    | Small enum (political/economic/security/diplomatic/other) for scanning + filtering. | ✓        |
| Free-text tags (multi) | Flexible, inconsistent over time.                                                   |          |
| Neither in P69         | Keep lean.                                                                          |          |

### AI confidence

| Option                           | Description                              | Selected |
| -------------------------------- | ---------------------------------------- | -------- |
| Yes — confidence field (AI only) | Badge for ai_generated, null for manual. | ✓        |
| No confidence field in P69       | Treat AI and manual identically.         |          |

### Bilingual storage

| Option                                       | Description                                 | Selected |
| -------------------------------------------- | ------------------------------------------- | -------- |
| Single-language free text (store as entered) | No system translation; UI chrome bilingual. | ✓        |
| Paired EN/AR fields                          | title_en/title_ar + body fields.            |          |
| Single field + a language tag                | content_language marker.                    |          |

**User's choice:** Fixed category enum; AI-confidence field; single-language free text.
**Notes:** Schema must add title + sensitivity_level + status regardless. Language-tag option declined → render mixed-direction free text via auto-`dir`/`<bdi>`, not a stored flag.

---

## Escalate → work item

### Escalate interaction

| Option                              | Description                                                              | Selected |
| ----------------------------------- | ------------------------------------------------------------------------ | -------- |
| Compact escalate dialog, pre-filled | severity→priority, assignee/deadline optional; mirrors EscalationDialog. | ✓        |
| One-click auto-create (no dialog)   | Instant task in todo.                                                    |          |
| Full task-create form pre-filled    | Most control, breaks fast flow.                                          |          |

### Linkage

| Option                                  | Description                                                              | Selected |
| --------------------------------------- | ------------------------------------------------------------------------ | -------- |
| Bidirectional link + copy dossier links | signal↔task both ways; dossier associations copy via work_item_dossiers. | ✓        |
| Bidirectional link only                 | No dossier auto-copy.                                                    |          |
| One-way reference                       | Task records signal id only.                                             |          |

### Signal after escalation

| Option                                                | Description                                      | Selected |
| ----------------------------------------------------- | ------------------------------------------------ | -------- |
| Status → escalated, stays in 'Escalated' filter       | Leaves active queue, viewable with link to task. | ✓        |
| Status → escalated, removed from queue (history only) | Disappears from triage filters.                  |          |
| Stays active until separately resolved                | Risks duplicate handling.                        |          |

**User's choice:** Compact escalate dialog; bidirectional link + copy dossier links; status → escalated, stays in 'Escalated' filter.
**Notes:** Creates a `task` (workflow_stage=todo) so it appears on the Kanban (success criterion #4).

---

## Carried assumptions (accepted, not separately debated)

- AI-surfaced signals in P69 = establish the `ai_generated` write path + source type only; the real AI correlation engine is a later phase.
- `read_signals` = a clearance-gated `SECURITY INVOKER` RPC/tool defined + tested by direct invocation now, wrapped by the Mastra agent in P72.

## Pending-todo cross-reference

- `p68-followup-supabaseadmin-background-agents.md` (REMED-03 follow-up) — presented; user chose **Keep separate**. Recorded as a Reviewed Todo (not folded) in CONTEXT.md.

## Claude's Discretion

- Exact category enum values (D-07).
- Schema shape: extend `intelligence_event` in place vs. a curated triage table on the raw event (RF-1).
- Confidence field type/range (D-08).
- Reversible-dismiss mechanism (D-04).

## Deferred Ideas

- Real AI correlation/surfacing engine (beyond the `ai_generated` write path) — later phase.
- `feed` source ingestion — v7.1 (FEED-01).
