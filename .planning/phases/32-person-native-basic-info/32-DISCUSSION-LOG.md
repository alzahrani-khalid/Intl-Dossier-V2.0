# Phase 32: Person-Native Basic Info - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 32-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-18
**Phase:** 32-person-native-basic-info
**Areas discussed:** Honorific UX + 'Other' pattern, Name split + name_en/ar sync, List page label + nationality badge, Review card layout + Basic Info overlap

---

## Honorific UX + 'Other' pattern

### Q1: Which component pattern for the honorific dropdown?

| Option                            | Description                                                                                                                                                      | Selected |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Plain shadcn Select (Recommended) | Reuses the same Select already used in SharedBasicInfoStep for status. 13 values + 'Other' fit without needing type-ahead. Keeps the wizard visually consistent. | ✓        |
| HeroUI Autocomplete (type-ahead)  | Power-user feature: type 'Pr' to filter to 'Prof.'. Adds complexity and a new primitive. Overkill for 13 items.                                                  |          |
| Radio group (no dropdown)         | All options visible as a wrapped pill row. Eats vertical space but removes a click. Too visually heavy given 14 options.                                         |          |

**User's choice:** Plain shadcn Select (Recommended)
**Notes:** Matches the existing status/sensitivity pattern in SharedBasicInfoStep. No new primitive introduced.

### Q2: When 'Other' is selected, how should the custom honorific be captured?

| Option                                                | Description                                                           | Selected |
| ----------------------------------------------------- | --------------------------------------------------------------------- | -------- |
| Reveal two inputs (Other EN + Other AR) (Recommended) | Consistent with the rest of the step. User types both EN and AR.      | ✓        |
| One input, mirror to both languages                   | Simpler UX but produces mixed-script data on opposite-language pages. |          |
| Inline replacement (replace trigger with text input)  | Compact but obscures that the user is in 'Other' mode.                |          |

**User's choice:** Reveal two inputs (Other EN + Other AR)
**Notes:** Both inputs required when 'Other' active. Side-by-side grid.

### Q3: For CURATED values (H.E., Dr., etc.), how should the AR mapping work?

| Option                                    | Description                                                                      | Selected |
| ----------------------------------------- | -------------------------------------------------------------------------------- | -------- |
| Hardcoded bilingual map (Recommended)     | Static map in component writes both honorific_en and honorific_ar automatically. | ✓        |
| User edits both languages always          | Full control but friction — users don't know 'Sen.' → 'سيناتور'.                 |          |
| Only store EN; resolve AR at display time | honorific_ar stays NULL; frontend lookup at render.                              |          |

**User's choice:** Hardcoded bilingual map
**Notes:** Planner may refine exact AR translations; pattern (static map, written at submit) is fixed.

---

## Name split + name_en/ar sync

### Q1: For the migration backfill, how should multi-word names like 'Mary Jane Smith' split?

| Option                               | Description                                                                                | Selected |
| ------------------------------------ | ------------------------------------------------------------------------------------------ | -------- |
| Last word = last name (Recommended)  | 'Mary Jane Smith' → first='Mary Jane', last='Smith'. Matches SPEC's 'split on last space'. | ✓        |
| First word = first name, rest = last | Simpler SQL but worse for compound first names.                                            |          |
| Skip rows with >2 words              | Forces manual review; no bad guesses but leaves rows unbackfilled.                         |          |

**User's choice:** Last word = last name (Recommended)

### Q2: For single-word names like 'Madonna' or 'زيد', how should backfill handle them?

| Option                                                   | Description                                                         | Selected |
| -------------------------------------------------------- | ------------------------------------------------------------------- | -------- |
| last_name = full string, first_name = NULL (Recommended) | 'Madonna' → first=NULL, last='Madonna'. Matches list-page fallback. | ✓        |
| first_name = full string, last_name = NULL               | Inverse; breaks PBI-06 'last name as primary label'.                |          |
| Leave both NULL (skip backfill)                          | Zero wrong guesses but loses typed data.                            |          |

**User's choice:** last_name = full string, first_name = NULL

### Q3: At wizard submit, how should dossiers.name_en/ar be populated from first + last?

| Option                                                      | Description                                                         | Selected |
| ----------------------------------------------------------- | ------------------------------------------------------------------- | -------- |
| Client composes: name_en = first + ' ' + last (Recommended) | filterExtensionData composes before POST. Keeps Edge Function dumb. | ✓        |
| Edge Function composes it server-side                       | Centralizes logic but adds Edge Function complexity.                |          |
| DB generated column (ALTER to stored generated)             | Rejected by SPEC Boundaries.                                        |          |

**User's choice:** Client composes in filterExtensionData

### Q4: Should the honorific appear in the composed name_en (e.g., 'H.E. John Smith') or only first+last?

| Option                                         | Description                                                    | Selected |
| ---------------------------------------------- | -------------------------------------------------------------- | -------- |
| No — name_en = first + last only (Recommended) | Legal name stays clean for search. Honorific is display-layer. | ✓        |
| Yes — include honorific: 'H.E. John Smith'     | Matches visible label but breaks exact-string search.          |          |

**User's choice:** No — honorific applied at display time only

---

## List page label + nationality badge

### Q1: How should the nationality badge render visually?

| Option                                | Description                                                     | Selected |
| ------------------------------------- | --------------------------------------------------------------- | -------- |
| Flag emoji + ISO-2 code (Recommended) | '🇸🇦 SA'. Flag for visual scan + code for Windows fallback/a11y. | ✓        |
| ISO-2 code only                       | 'SA'. Always renders but less scannable.                        |          |
| Flag emoji only                       | Empty box on Windows Chrome without emoji fonts.                |          |
| Full country name                     | 'Saudi Arabia'. Too wide for dense diplomatic list.             |          |

**User's choice:** Flag emoji + ISO-2 code

### Q2: Where should the badge sit in the row?

| Option                               | Description                                            | Selected |
| ------------------------------------ | ------------------------------------------------------ | -------- |
| Inline, after the name (Recommended) | 'H.E. Khalid Al Sheikh [🇸🇦 SA]'. Natural reading flow. | ✓        |
| Left of the name (at row start)      | Breaks reading flow.                                   |          |
| Separate column                      | Cleanest scan but requires table schema changes.       |          |

**User's choice:** Inline, after the name

### Q3: Which component: shadcn Badge or HeroUI Chip wrapper?

| Option                                                 | Description                                            | Selected |
| ------------------------------------------------------ | ------------------------------------------------------ | -------- |
| shadcn Badge (via @/components/ui/badge) (Recommended) | Existing re-export. Consistent with every other badge. | ✓        |
| HeroUI Chip directly                                   | Access to more variants but inconsistent pattern.      |          |

**User's choice:** shadcn Badge

### Q4: When nationality_country_id is NULL on a row, what should render?

| Option                                 | Description                                              | Selected |
| -------------------------------------- | -------------------------------------------------------- | -------- |
| Nothing — omit the badge (Recommended) | Legacy rows stay clean. Matches SPEC's 'when populated'. | ✓        |
| Dim '—' placeholder                    | Columns align but adds visual weight.                    |          |
| Inline 'Unknown' / 'غير معروف' label   | Explicit absence marker but clutters common case.        |          |

**User's choice:** Nothing — omit the badge

---

## Review card layout + Basic Info overlap

### Q1: How should the new 'Identity' card relate to the existing 'Basic Information' card for persons?

| Option                                                                        | Description                               | Selected |
| ----------------------------------------------------------------------------- | ----------------------------------------- | -------- |
| Replace — Identity card fully supersedes Basic Info for persons (Recommended) | No duplicate 'name_en' row. Cleanest.     | ✓        |
| Coexist — both cards render; Basic Info shows description + tags only         | Matches SPEC PBI-07 literal reading.      |          |
| Merge — one combined card with sections                                       | Denser but loses card-per-step hierarchy. |          |

**User's choice:** Replace — Identity card supersedes Basic Info
**Notes:** Follow-up clarified that description + tags render INSIDE the Identity card under a 'Biographical summary' sub-heading.

### Q2: Where should the Identity card sit in the Review step order?

| Option                                           | Description                                         | Selected |
| ------------------------------------------------ | --------------------------------------------------- | -------- |
| First card (before Person Details) (Recommended) | Matches wizard step order.                          | ✓        |
| Second — after Person Details                    | Breaks 'who is this' → 'what do they do' narrative. |          |

**User's choice:** First card

### Q3: Should description_en/ar + tags still be captured on Step 1 (Identity) or deferred?

| Option                                                                | Description                                          | Selected |
| --------------------------------------------------------------------- | ---------------------------------------------------- | -------- |
| Keep description + tags in Step 1 below identity fields (Recommended) | Matches SharedBasicInfoStep pattern.                 | ✓        |
| Move description to Step 2 (Person Details)                           | Requires schema decision (description vs biography). |          |
| Drop description entirely for persons                                 | Requires backend query changes.                      |          |

**User's choice:** Keep description + tags in Step 1 below identity fields

### Q4: Should classification (status + sensitivity_level) stay as a collapsible 'Advanced' section on Step 1?

| Option                                                                        | Description                                    | Selected |
| ----------------------------------------------------------------------------- | ---------------------------------------------- | -------- |
| Yes — keep collapsible 'Classification' at the bottom of Step 1 (Recommended) | Matches SharedBasicInfoStep pattern.           | ✓        |
| Drop status picker, keep sensitivity only                                     | Matches PBI-01 literal reading.                |          |
| Drop both — server-side defaults                                              | Simplest but users can't mark VIP sensitivity. |          |

**User's choice:** Keep collapsible Classification
**Notes:** Clarified in follow-up — status field is dropped per PBI-01, only sensitivity_level remains in the collapsible section.

### Follow-up Q1: Per PBI-01 'manual status field is absent from person wizard flows' — confirm Classification shows only sensitivity_level?

| Option                                                          | Description                                                | Selected |
| --------------------------------------------------------------- | ---------------------------------------------------------- | -------- |
| Yes — Classification shows only sensitivity_level (Recommended) | status='active' set by defaults. Matches PBI-01 literally. | ✓        |
| No — keep status picker (deviate from PBI-01)                   | Would need SPEC amendment.                                 |          |

**User's choice:** Yes — sensitivity_level only

### Follow-up Q2: Since Identity card replaces Basic Info, where do description + tags render in Review?

| Option                                                                             | Description                                           | Selected |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- | -------- |
| Inside the Identity card, under a 'Biographical summary' sub-heading (Recommended) | One card, two sub-sections. No duplicate card chrome. | ✓        |
| Separate 'About' card below Identity                                               | Cleaner boundary but adds visual weight.              |          |

**User's choice:** Inside the Identity card under 'Biographical summary' sub-heading

---

## Claude's Discretion

- AR translations for curated honorifics (D-04) — planner may refine with native-speaker input
- Visual density of Review Identity card (two sub-sections in one card vs. larger card with section headings)
- Nationality badge variant (secondary vs outline vs default)
- Join shape for resolving country ISO-2 in list queries
- Date input primitive for DOB (native `<input type="date">` vs HeroUI DatePicker)
- Photo URL preview thumbnail size (48×48 vs 64×64)

## Deferred Ideas

- Photo uploader with Supabase Storage (drag-drop, cropping)
- Detail-page identity rendering (Phase 32 is list pages only)
- Gender values beyond Female/Male
- Moving nationality_id to NOT NULL at DB level
- Suffix fields (Jr., Sr., III, PhD)
- Transliteration helper (AI auto-fill AR from EN)
- `dossiers.name_en/ar` → generated column
- Committee assignments / expertise areas as structured columns
