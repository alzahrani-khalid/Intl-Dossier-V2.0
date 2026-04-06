# Phase 9: Lifecycle Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 09-lifecycle-engine
**Areas discussed:** Stage transition UX, Intake promotion flow, Forum session lifecycle, Audit & history display

---

## Stage Transition UX

### Q1: How should the lifecycle stage be displayed on an engagement?

| Option                    | Description                                                               | Selected |
| ------------------------- | ------------------------------------------------------------------------- | -------- |
| Horizontal stepper bar    | Pipeline-style bar showing 6 stages, clickable, with suggested next stage | ✓        |
| Dropdown with stage badge | Colored badge + dropdown to select stage. Compact.                        |          |
| You decide                | Claude picks based on Phase 11 workspace design                           |          |

**User's choice:** Horizontal stepper bar
**Notes:** CRM deal stage pipeline pattern preferred

### Q2: When clicking a non-adjacent stage, should the system require a reason/note?

| Option                     | Description                                            | Selected |
| -------------------------- | ------------------------------------------------------ | -------- |
| Always allow, suggest note | Any stage clickable. Optional note field on skip.      | ✓        |
| Always allow, no friction  | No note prompt at all, even when skipping              |          |
| Require note on skip       | Mandatory note when jumping >1 stage or going backward |          |

**User's choice:** Always allow, suggest note
**Notes:** None

### Q3: Should engagement_status remain separate from lifecycle_stage?

| Option                       | Description                                         | Selected |
| ---------------------------- | --------------------------------------------------- | -------- |
| Keep both, separate concerns | Status = event status, Stage = workflow position    | ✓        |
| Replace status with stage    | lifecycle_stage replaces engagement_status entirely |          |
| You decide                   | Claude determines based on downstream needs         |          |

**User's choice:** Keep both, separate concerns
**Notes:** User reviewed preview showing how an engagement can be "postponed" at any lifecycle stage

### Q4: Should each stage show a timestamp on the stepper?

| Option              | Description                               | Selected |
| ------------------- | ----------------------------------------- | -------- |
| Show on hover       | Tooltip with "Entered: date" on hover/tap | ✓        |
| Always show dates   | Small date beneath each completed stage   |          |
| No dates on stepper | Dates only in audit history               |          |

**User's choice:** Show on hover
**Notes:** Keeps the stepper bar clean

---

## Intake Promotion Flow

### Q1: How much user involvement in promotion?

| Option                                 | Description                                                 | Selected |
| -------------------------------------- | ----------------------------------------------------------- | -------- |
| Confirmation dialog with field preview | Dialog shows mapped fields, user can edit before confirming | ✓        |
| One-click instant promotion            | Creates engagement immediately with defaults                |          |
| Multi-step wizard                      | 2-3 step wizard for thorough field mapping                  |          |

**User's choice:** Confirmation dialog with field preview
**Notes:** User reviewed preview of the promotion dialog layout

### Q2: What happens to the original intake ticket after promotion?

| Option                                  | Description                                                             | Selected |
| --------------------------------------- | ----------------------------------------------------------------------- | -------- |
| Mark as 'converted', link to engagement | Status becomes 'converted', stores engagement ID, read-only with banner | ✓        |
| Close ticket with resolution            | Ticket moves to 'closed' with resolution text                           |          |
| You decide                              | Claude picks based on existing type system                              |          |

**User's choice:** Mark as 'converted', link to engagement
**Notes:** Aligns with existing convertedToType/convertedToId fields in IntakeTicket

### Q3: Should non-engagement intake types also be promotable?

| Option                               | Description                                | Selected |
| ------------------------------------ | ------------------------------------------ | -------- |
| Only engagement-type intakes for now | Phase 9 scope limited to intake→engagement | ✓        |
| All types promotable to their entity | position→Position, mou_action→MOU, etc.    |          |

**User's choice:** Only engagement-type intakes for now
**Notes:** Clean scope boundary

---

## Forum Session Lifecycle

### Q1: How should recurring forum sessions be modeled?

| Option                         | Description                                             | Selected |
| ------------------------------ | ------------------------------------------------------- | -------- |
| Child engagements per session  | Each session is a child engagement with parent_forum_id | ✓        |
| Session table on forum dossier | Lighter-weight forum_sessions table                     |          |
| You decide                     | Claude picks based on Phase 11/12 needs                 |          |

**User's choice:** Child engagements per session
**Notes:** User reviewed preview showing forum→session hierarchy. Reuses all engagement infrastructure.

### Q2: Where should new forum sessions be created from?

| Option                  | Description                                          | Selected |
| ----------------------- | ---------------------------------------------------- | -------- |
| From forum dossier page | "New Session" button, pre-fills parent forum details | ✓        |
| From either location    | Forum page or general engagement creation flow       |          |
| You decide              | Claude picks based on Phase 12 plans                 |          |

**User's choice:** From forum dossier page
**Notes:** None

---

## Audit & History Display

### Q1: How should lifecycle transition history be displayed?

| Option                             | Description                                               | Selected |
| ---------------------------------- | --------------------------------------------------------- | -------- |
| Vertical timeline in sidebar/panel | Compact timeline with who, when, note. Collapsible panel. | ✓        |
| Dedicated history tab              | Separate tab with full audit log and filters              |          |
| Inline expandable log              | Small expandable section at bottom of page                |          |

**User's choice:** Vertical timeline in sidebar/panel
**Notes:** User reviewed preview of timeline layout

### Q2: What should be recorded in each audit entry?

| Option                         | Description                                             | Selected |
| ------------------------------ | ------------------------------------------------------- | -------- |
| Stage + user + optional note   | from_stage, to_stage, user_id, timestamp, optional note |          |
| Full field diff                | Every field change alongside stage transition           |          |
| Stage + user + note + duration | Same as first + computed time spent in each stage       | ✓        |

**User's choice:** Stage + user + note + duration
**Notes:** Duration tracking enables future process analytics

---

## Claude's Discretion

- Stepper bar responsive behavior on mobile
- Color palette for stage indicators
- Promotion dialog format (modal vs slide-over)
- Exact field mapping between intake and engagement
- parent_forum_id table placement
- Index strategy for lifecycle_transitions table

## Deferred Ideas

- Promotion for non-engagement intake types (position, MOU, foresight)
- Process analytics dashboard
- Automated stage suggestions
- Batch stage transitions
