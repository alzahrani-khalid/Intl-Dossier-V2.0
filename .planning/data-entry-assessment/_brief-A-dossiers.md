# Slice A — Dossier creation & edit forms (all 8 types)

First read `.planning/data-entry-assessment/_FORMAT.md` and follow it exactly.

## Your scope

The data-entry flow for **dossiers** across all 8 types:
`country`, `organization`, `forum`, `engagement`, `topic`, `working_group`, `person`,
`elected_official`.

Cover:

- The dossier **create** wizard(s) / form(s) and the `DossierTypeSelector`.
- The dossier **edit** form(s) for each type.
- Type-specific extension fields, especially:
  - **country** → the `countries` extension table (`iso_code_2`, `flag`, etc.) — does the form
    persist these, and to the right table?
  - **engagement** → does it write to `engagement_dossiers` (correct) and NOT `engagements`?
  - **elected_official** / **person** → office/term metadata, `person_subtype`.
- Inline edits on dossier detail pages that change dossier data.
- The `work_item_dossiers` linking UI if dossier creation links work items.

Start at `frontend/src/components/Dossier/`, `frontend/src/routes/_protected/` (dossier routes),
`frontend/src/domains/` (dossier domain). Trace create/edit submit → mutation → edge fn / supabase
→ table. Verify per-type column correctness against the source-of-truth facts.

## Output

Write your report to:
`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/data-entry-assessment/findings-A-dossiers.md`

Finish with `## ASSESSMENT COMPLETE: A` in the file and print `ASSESSMENT COMPLETE: A`.
