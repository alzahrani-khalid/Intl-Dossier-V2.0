# Phase 30: Elected Official Wizard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 30-elected-official-wizard
**Areas discussed:** Entry model, Office/Term field set, Bilingual data entry, Term handling, Dossier linking scope

---

## Gray Area Selection (initial multi-select prompt)

| Option                       | Description                                 | User Response                    |
| ---------------------------- | ------------------------------------------- | -------------------------------- |
| Office/Term step field set   | Which schema fields appear vs defer to edit | Surfaced via clarifying question |
| Bilingual data entry pattern | EN+AR pairs vs EN-only                      | Surfaced via clarifying question |
| Term dates & is_current_term | Date granularity + auto-derive              | Surfaced via clarifying question |
| Wizard composition strategy  | Separate config vs extend person config     | Surfaced via clarifying question |

**User's reply:** "I am confused about this. there is... Add Person, and there is Add elected official .. how are we going to handle it?"

**Resolution:** Reframed as the Entry Model question (below). User's confusion indicated this was the foundational gray area — all other decisions cascade from it.

---

## Entry Model

| Option                              | Description                                                                                           | Selected |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| One wizard, subtype-aware (Model B) | Single Person wizard; entry route pre-sets subtype and conditionally inserts OfficeTermStep as step 3 | ✓        |
| Two separate wizards (Model A)      | Dedicated elected-official.config.ts + schema; mirrors Phase 28 per-type pattern                      |          |
| Merge the lists (Model C)           | Remove "Add Elected Official" button; subtype chosen via toggle on step 1                             |          |

**User's choice:** One wizard, subtype-aware (Model B) — Recommended
**Notes:** User confirmed the recommended option. Maps directly to ELOF-01's "Person wizard variant" wording. Drives D-01..D-03, D-15..D-17 in CONTEXT.md.

---

## Office/Term Step — Field Set

| Option                                    | Description                                                     | Selected |
| ----------------------------------------- | --------------------------------------------------------------- | -------- |
| Essentials only (ELOF-02)                 | office_name, office_type, district, party, term_start, term_end | ✓        |
| Essentials + office_type + party_ideology | Adds the two enum dropdowns for richer filtering                |          |
| Full schema                               | Every column editable in the wizard                             |          |

**User's choice:** Essentials only (ELOF-02) — Recommended
**Notes:** Honors v5.0 "progressive field design" principle. Deferred columns (office_type, party_ideology, party_abbreviation, term_number) remain editable on the detail page. Drives D-04, D-05.

---

## Bilingual Data Entry (first pass)

| Option                         | Description                                                      | Selected |
| ------------------------------ | ---------------------------------------------------------------- | -------- |
| EN+AR pairs, EN required only  | Matches PersonDetailsStep pattern; EN required per DB constraint |          |
| EN+AR both required            | Strongest bilingual parity; blocks creation when AR unavailable  |          |
| EN only on wizard, AR via edit | Cleaner UI; breaks from existing pattern                         |          |

**User's reply:** "Sometimes the AR is available, sometimes EN is available .. what is the best way to deal with this"

**Resolution:** User raised a real-world constraint the presented options didn't address. Reframed and re-asked with an "at least one required" option that includes a DB constraint relaxation.

---

## Term Handling

| Option                                        | Description                                                                          | Selected |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | -------- |
| Full date pickers + auto-derived current term | term_start required; term_end optional (empty=ongoing); is_current_term auto-derived | ✓        |
| Month+year inputs + explicit checkbox         | Month/year granularity + visible is_current_term checkbox                            |          |
| Full dates + explicit checkbox                | Full ISO dates AND visible checkbox                                                  |          |

**User's choice:** Full date pickers + auto-derived current term — Recommended
**Notes:** Drives D-10, D-11 in CONTEXT.md. Auto-derivation mechanism (client vs trigger) left to Claude's discretion at planning time.

---

## Dossier Linking Scope

| Option                                             | Description                                                                      | Selected |
| -------------------------------------------------- | -------------------------------------------------------------------------------- | -------- |
| Country required + Organization optional (Shape 3) | Two single-select DossierPickers using existing country_id / organization_id FKs |          |
| Both optional (Shape 1)                            | Both pickers optional                                                            |          |
| Single multi-select picker (Shape 2)               | One picker accepting both types; parsed to FKs by type                           |          |
| Full multi-dossier junction                        | New persons_linked_dossiers polymorphic table                                    |          |

**User's reply:** "We need to think about how to link a person to other dossiers: attended a forum, is part of a working group, is an elected official in an office, signed an MOU, .. etc. Do you have this understanding?"

**Resolution:** User raised the broader architectural question of unified person-to-dossier linking. Claude mapped the current state (existing FKs, existing Phase 29 join tables for forum/WG/engagement, no MoU linking yet) and scope-redirected: Phase 30 uses only the existing country_id/organization_id columns. Unified linking architecture deferred as a future phase.

---

## Scope Confirmation (follow-up after scope-redirect)

| Option                                           | Description                                                                        | Selected |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- | -------- |
| Narrow scope + defer unified linking             | Country (required) + Organization (optional) only; defer architectural unification | ✓        |
| Narrow + add "link to working group" at creation | Adds a third multi-select picker for WG membership                                 |          |
| Build unified linking now                        | Polymorphic junction table this phase                                              |          |

**User's choice:** Yes — narrow scope + defer unified linking (Recommended)
**Notes:** Drives D-12..D-14 in CONTEXT.md. Unified linking captured in Deferred Ideas.

---

## Bilingual Data Entry (second pass, re-asked with partial-language option)

| Option                                                                | Description                                                                                                                                                                  | Selected |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| At least one of EN/AR on office_name; district + party fully optional | Wizard validates "at least one filled" on office_name; district/party accept any combo. Includes DB migration relaxing the `persons_elected_official_requires_office` CHECK. | ✓        |
| At least one of EN/AR on all three                                    | Stronger: every elected official must have office+district+party in at least one language                                                                                    |          |
| Keep EN-required (no migration), AR optional                          | Don't change DB; user types transliteration if only AR known                                                                                                                 |          |

**User's choice:** At least one of EN/AR required on office_name; district + party fully optional — Recommended
**Notes:** Drives D-08, D-09, D-19. Matches user's stated workflow: "sometimes AR is available, sometimes EN is available". Requires one new migration.

---

## Claude's Discretion

- Auto-derivation mechanism for `is_current_term` (client compute vs DB trigger) — planner decides based on whether a suitable trigger already exists on the `persons` table.
- Exact visual grouping within the Office/Term step.
- Whether to extract `ElectedOfficialReviewStep` or keep the conditional block inside `PersonReviewStep` (judgment call at implementation time).
- DossierPicker prop signatures (refer to Phase 29 precedents).

## Deferred Ideas

- Unified person-to-dossier linking architecture (polymorphic junction table) — future phase.
- Exposing `office_type`, `party_ideology`, `party_abbreviation`, `term_number` in the wizard — deferred to detail-page edit.
- Committee assignments (`persons.committee_assignments` JSONB) — future phase.
- Cross-type wizard (create elected official AND link to existing forum/WG in one flow) — already marked out of scope in REQUIREMENTS.md.
