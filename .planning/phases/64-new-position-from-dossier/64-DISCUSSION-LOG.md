# Phase 64: New Position from Dossier - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 64-new-position-from-dossier
**Areas discussed:** Form scope & required fields, Defaults & bilingual titles, Dossier link semantics & failure honesty, Post-create flow & entry points

---

## Form scope & required fields

| Option                | Description                                                                                             | Selected |
| --------------------- | ------------------------------------------------------------------------------------------------------- | -------- |
| Quick-create dialog   | Keep the existing modal, add the three missing required inputs (type picker, AR title, audience groups) | ✓        |
| Fuller dialog         | Same modal but also expose content/rationale fields (EN+AR)                                             |          |
| Dedicated create page | Route to a full position editor page pre-linked to the dossier                                          |          |

**User's choice:** Quick-create dialog (Recommended)

| Option                      | Description                                                                          | Selected |
| --------------------------- | ------------------------------------------------------------------------------------ | -------- |
| Keep optional EN+AR content | Two optional textareas (content_en, content_ar) matching the bilingual title pattern | ✓        |
| Keep EN-only content as-is  | Leave the single optional textarea                                                   |          |
| Drop content entirely       | Title-only quick create                                                              |          |

**User's choice:** Keep optional EN+AR content (Recommended)

| Option                  | Description                                      | Selected |
| ----------------------- | ------------------------------------------------ | -------- |
| Multi-select checkboxes | All 4 groups visible as checkboxes in the dialog | ✓        |
| Multi-select combobox   | Compact dropdown with checkbox items             |          |
| Single-select dropdown  | Pick exactly one group                           |          |

**User's choice:** Multi-select checkboxes (Recommended)

| Option                        | Description                                                                                    | Selected |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | -------- |
| Client-side inline validation | Localized inline messages, submit disabled until valid, RHF+Zod; edge errors toast as fallback | ✓        |
| Edge errors only              | Submit always enabled; edge EN/AR error strings in a toast                                     |          |
| You decide                    | Claude picks during planning                                                                   |          |

**User's choice:** Client-side inline validation (Recommended)

---

## Defaults & bilingual titles

| Option                       | Description                                                     | Selected |
| ---------------------------- | --------------------------------------------------------------- | -------- |
| Default to Standard Position | Picker preselects Standard; user changes for critical positions | ✓        |
| No default — force a choice  | Picker starts empty                                             |          |
| You decide                   | Claude picks during planning                                    |          |

**User's choice:** Default to Standard Position (Recommended)

| Option                      | Description                                        | Selected |
| --------------------------- | -------------------------------------------------- | -------- |
| Default to All Staff        | Broadest group pre-checked; user narrows if needed | ✓        |
| No default — force a choice | Nothing pre-checked                                |          |
| You decide                  | Claude picks during planning                       |          |

**User's choice:** Default to All Staff (Recommended)

| Option                         | Description                                                      | Selected |
| ------------------------------ | ---------------------------------------------------------------- | -------- |
| Both fields required, typed    | Two required inputs, no assists                                  |          |
| Auto-copy EN into AR if blank  | Submission copies EN title into title_ar                         |          |
| AI-assisted translation button | A 'translate' helper fills the AR field from EN via the AI layer | ✓        |

**User's choice:** AI-assisted translation button
**Notes:** Scouting confirmed the existing `translate-content` edge function is purpose-built for this (draft translations for review/correction, supports title/position/content types, EN↔AR) — reuse, not a new capability. Zero frontend callers today; deploy status needs researcher verification.

| Option                                      | Description                                                                                                                                                         | Selected |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Draft-fill, still required, both directions | Translate button on each title field (EN→AR and AR→EN); fills the other field as an editable draft; both fields remain required; submission never depends on the AI | ✓        |
| EN→AR only                                  | One button on the AR field                                                                                                                                          |          |
| Auto-translate on blur                      | Leaving the EN field auto-fills the AR field if empty                                                                                                               |          |

**User's choice:** Draft-fill, still required, both directions (Recommended)

| Option             | Description                                | Selected |
| ------------------ | ------------------------------------------ | -------- |
| Titles and content | Same draft-fill button on both field pairs | ✓        |
| Titles only        | Content stays manual                       |          |
| You decide         | Claude picks during planning               |          |

**User's choice:** Titles and content (Recommended)

---

## Dossier link semantics & failure honesty

| Option                         | Description                                                                        | Selected |
| ------------------------------ | ---------------------------------------------------------------------------------- | -------- |
| Fixed: applies_to              | Silent, zero extra UI — the link is an implementation detail of 'create from here' | ✓        |
| User picks link type in dialog | A small link-type select defaulting to applies_to                                  |          |
| You decide                     | Claude picks during planning                                                       |          |

**User's choice:** Fixed: applies_to (Recommended)

| Option                         | Description                                                                                       | Selected |
| ------------------------------ | ------------------------------------------------------------------------------------------------- | -------- |
| Honest partial-success warning | Toast warns position created but not linked, with retry-link action or pointer to attach manually | ✓        |
| Roll back the position         | Delete the just-created position, single failure error                                            |          |
| Plain success toast            | Treat link failure as silent best-effort                                                          |          |

**User's choice:** Honest partial-success warning (Recommended)

| Option                              | Description                                                                     | Selected |
| ----------------------------------- | ------------------------------------------------------------------------------- | -------- |
| Two-step from the client            | positions-create, then the existing positions-dossiers-create attach edge (v11) | ✓        |
| Extend positions-create server-side | Optional dossier_id on the create edge, atomic                                  |          |
| You decide                          | Claude picks during planning                                                    |          |

**User's choice:** Two-step from the client (Recommended)

---

## Post-create flow & entry points

| Option                             | Description                                                                     | Selected |
| ---------------------------------- | ------------------------------------------------------------------------------- | -------- |
| Stay on dossier, toast with action | Dialog closes, Positions tab refreshes, toast carries an 'Open position' action | ✓        |
| Navigate to the new position       | Jump to position detail to continue editing                                     |          |
| Toast only                         | Plain success toast, no action link                                             |          |

**User's choice:** Stay on dossier, toast with action (Recommended)

| Option                            | Description                                                                                              | Selected |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- | -------- |
| Yes — wire it to the fixed dialog | Tab's 'Create position' button opens the New Position dialog; attach-existing stays available separately | ✓        |
| No — AddToDossier menu only       | Leave tab button as attach dialog; note mislabel as deferred                                             |          |
| Relabel only                      | Keep attach behavior, rename to 'Attach position'                                                        |          |

**User's choice:** Yes — wire it to the fixed dialog (Recommended)

---

## Claude's Discretion

- Query keys to invalidate for the live tab refresh (dossier-scoped key mapping)
- Translate-button UX details (loading state, error copy, debounce, confidence display)
- How attach-existing is surfaced on the Positions tab after the rewire
- Retry mechanics for the partial-failure path
- Zod schema shape and validation-error localization
- Whether to expose `thematic_category` (default: omit)

## Deferred Ideas

- Dedicated position create/editor page (richer authoring: rationale, alignment notes, thematic category)
- Auto-translate-on-blur pattern (rejected here; could be revisited app-wide)
- `thematic_category` / rationale / alignment fields in the quick-create dialog
