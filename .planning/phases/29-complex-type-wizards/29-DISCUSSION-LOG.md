# Phase 29: Complex Type Wizards - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 29-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 29-complex-type-wizards
**Areas discussed:** Multi-select DossierPicker design, Engagement Participants step layout, Forum/WG link persistence, Type-specific field shapes

---

## Gray-Area Selection

| Option                              | Description                                       | Selected |
| ----------------------------------- | ------------------------------------------------- | -------- |
| Multi-select DossierPicker design   | ENGM-03/04 needs a multi-select variant           | ✓        |
| Engagement Participants step layout | Three sections vs unified-with-filter vs tabs     | ✓        |
| Forum/WG link persistence model     | FK on own table vs dossier_relationships junction | ✓        |
| Type-specific field shapes          | Engagement type/category, location, WG mandate UX | ✓        |

**User's choice:** All four areas selected.

---

## Area 1 — Multi-Select DossierPicker Design

### Q1: How should we ship the multi-select DossierPicker variant (ENGM-04)?

| Option                         | Description                                                                 | Selected |
| ------------------------------ | --------------------------------------------------------------------------- | -------- |
| Extend existing component      | Add `multiple`/`values`/`onValuesChange` to work-creation/DossierPicker.tsx | ✓        |
| New sibling MultiDossierPicker | New component reusing the existing search hook                              |          |
| Wizard-scoped wrapper field    | Thin wrapper composing existing picker + chip list                          |          |

### Q2: Where should the selected-dossier chips render in multi-select mode?

| Option                           | Description                                            | Selected |
| -------------------------------- | ------------------------------------------------------ | -------- |
| Inline row beneath the input     | Matches Badge/Chip patterns in existing linkers        | ✓        |
| Separate section above the input | 'Selected participants' header with chips above search |          |
| Tags inside the combobox trigger | HeroUI multi-tag trigger; most compact                 |          |

### Q3: Should `filterByDossierType` accept an array (for a unified multi-type picker)?

| Option                    | Description                                         | Selected |
| ------------------------- | --------------------------------------------------- | -------- |
| Accept string \| string[] | `filterByDossierType: DossierType \| DossierType[]` | ✓        |
| Single type only          | Keep today's behavior                               |          |

### Q4: Max selections cap for multi-select?

| Option                      | Description                                             | Selected |
| --------------------------- | ------------------------------------------------------- | -------- |
| Unlimited                   | No hard cap; horizontal-scroll chip UX absorbs overflow | ✓        |
| Configurable via `maxItems` | Per-picker `maxItems?: number` prop                     |          |
| Hard cap at 20              | Codebase-wide sanity cap                                |          |

---

## Area 2 — Engagement Participants Step Layout

### Q1: How should the Participants step be laid out (ENGM-03)?

| Option                                             | Description                                                          | Selected |
| -------------------------------------------------- | -------------------------------------------------------------------- | -------- |
| Three labeled sections, one picker per type        | Stacked sections: Countries / Organizations / Persons, each filtered | ✓        |
| Single unified multi-select with type-filter pills | One picker + pill bar; chips show type icon                          |          |
| Tabs per type + persistent selection sidebar       | Tabs with aggregated sidebar summary                                 |          |

### Q2: Is there a required minimum of participants?

| Option                       | Description                                         | Selected |
| ---------------------------- | --------------------------------------------------- | -------- |
| No required minimum          | Engagement can be created with zero participants    | ✓        |
| At least 1 participant total | Blocks Review if all three sections empty           |          |
| At least 1 per type          | Strictest; doesn't match real bilateral engagements |          |

### Q3: How do we handle the same dossier appearing in multiple categories?

| Option                            | Description                                 | Selected |
| --------------------------------- | ------------------------------------------- | -------- |
| Not possible by construction      | Three disjoint type-filters prevent overlap | ✓        |
| Block selection across categories | Only relevant for unified picker            |          |
| Auto-dedupe on submit             | Silent collapse; risk of data loss          |          |

### Q4: Should Participants selections be chip-scrollable per section on mobile?

| Option                                | Description                              | Selected |
| ------------------------------------- | ---------------------------------------- | -------- |
| Horizontal scroll within each section | Matches Area 1 Q2 decision; RTL-friendly | ✓        |
| Wrap chips to multi-line              | Wrap to 2-3 lines; vertical growth       |          |

---

## Area 3 — Link Persistence Model for Forum / WG

### Q1: How should the organizing-body / parent-body link persist?

| Option                                  | Description                                                            | Selected |
| --------------------------------------- | ---------------------------------------------------------------------- | -------- |
| Dedicated FK on own table               | Forum uses existing `forums.organizing_body`; WG adds `parent_body_id` | ✓        |
| Use dossier_relationships junction only | Write only to the junction table                                       |          |
| Both: FK + auto-create junction row     | Belt-and-braces consistency                                            |          |

### Q2: Is the organizing body required to complete the Forum wizard (FORUM-02)?

| Option   | Description                                     | Selected |
| -------- | ----------------------------------------------- | -------- |
| Optional | User can create a forum without organizing body | ✓        |
| Required | Block Submit if no organizing body picked       |          |

### Q3: Is the parent body required to complete the Working Group wizard (WG-02)?

| Option   | Description                           | Selected |
| -------- | ------------------------------------- | -------- |
| Optional | Mirrors Forum decision; consistent UX | ✓        |
| Required | Enforce at creation time              |          |

### Q4: Which dossier types are valid as a WG parent body?

| Option                               | Description                                       | Selected |
| ------------------------------------ | ------------------------------------------------- | -------- |
| Organization only                    | Simplest; matches working_group_members precedent | ✓        |
| Organization + Forum                 | Allows WGs spun out of a forum                    |          |
| Organization + Forum + Working Group | Allows nested WGs                                 |          |

---

## Area 4 — Type-Specific Field Shapes

### Q1: Where do Engagement `type` values come from (ENGM-02)?

| Option                                         | Description                                      | Selected |
| ---------------------------------------------- | ------------------------------------------------ | -------- |
| Match existing DB CHECK enum, bilingual labels | Read `engagement_dossiers_engagement_type_check` | ✓        |
| Define a new, smaller UX enum                  | Curate a shorter list; map extras to 'Other'     |          |
| Free-text input                                | NOT NULL validation only                         |          |

### Q2: How should Engagement `category` be captured?

| Option                                          | Description                                                                    | Selected |
| ----------------------------------------------- | ------------------------------------------------------------------------------ | -------- |
| Single-select dropdown of predefined categories | diplomatic / economic / security / cultural / technical / humanitarian / other | ✓        |
| Free text                                       | Max flexibility; worst for analytics                                           |          |
| Multi-select tags from a master list            | Multiple categories per engagement                                             |          |

### Q3: How should the bilingual Location field be structured (ENGM-02)?

| Option                                                     | Description                      | Selected |
| ---------------------------------------------------------- | -------------------------------- | -------- |
| Single bilingual text pair (`location_en` + `location_ar`) | Matches SharedBasicInfo pattern  | ✓        |
| Structured: city_en/city_ar + country FK                   | Cleaner data but widens the step |          |
| Map picker (lat/lng)                                       | Needs mapping lib; out of scope  |          |

### Q4: How should the bilingual WG `mandate` textarea be presented (WG-02)?

| Option                                  | Description                                              | Selected |
| --------------------------------------- | -------------------------------------------------------- | -------- |
| Match SharedBasicInfo bilingual pattern | Stacked EN field → AR field with `writingDirection: rtl` | ✓        |
| Side-by-side EN / AR columns            | Two-column layout on tablet+                             |          |
| EN/AR tabs                              | Compact; hides the other language                        |          |

---

## Claude's Discretion

Items deferred to planner judgment (see 29-CONTEXT.md `<decisions>` → Claude's Discretion):

- WG `status` default enum values (recommendation: `active` / `inactive` / `forming` / `dissolved`; planner to verify against live DB constraint).
- Whether the Engagement wizard adds a `scheduled_date` field — planner to inspect the `engagement_dossiers` schema; only include if the column already exists.
- i18n keys for new enum values (`wizard.engagement.*`, `wizard.forum.*`, `wizard.working_group.*`).
- DossierPicker multi-select test coverage — unit tests mirroring existing single-select setup.

## Deferred Ideas

- CreateDossierHub at `/dossiers/create` (UX-01) — Phase 31.
- Per-step contextual guidance/hints (UX-02) — Phase 31.
- Legacy `DossierCreateWizard.tsx` removal — Phase 31 cleanup.
- Elected Official wizard (ELOF-01..04) — Phase 30.
- Structured location / map picker for engagements — post-v5.0.
- `dossier_relationships` junction writes from the wizard — deferred pending concrete UX need.
- Participants minimum validation — revisit if data hygiene is a problem.
- DossierPicker hard cap — revisit only if perf degrades.

---

_Phase: 29-complex-type-wizards_
_Discussion logged: 2026-04-16_
