# Slice B — Work-item data entry (tasks, commitments, intake tickets)

First read `.planning/data-entry-assessment/_FORMAT.md` and follow it exactly.

## Your scope

The data-entry flow for **work items** across all three sources:

- **tasks** — Kanban create/edit, the task create form/modal. Verify writes use `sla_deadline`
  (NOT `deadline`) and `workflow_stage` (todo/in_progress/review/done/cancelled). Assignee field
  → `assignee_id`. Priority uses `low/medium/high/urgent` (NOT `critical`).
- **commitments** — the after-action commitment create/edit forms. Verify writes target
  **`aa_commitments`** with `due_date`, `owner_type`/`owner_user_id`/`owner_contact_id` — NOT the
  empty legacy `commitments` table, NOT `deadline`/`assignee_id`.
- **intake tickets** — the intake request form/wizard. Verify `intake_tickets` status lifecycle and
  the `urgency` enum (low/medium/high/critical — `critical` is correct here as `urgency_level`).
- The shared **unified work-item** create/edit surface if one exists, and the
  `work_item_dossiers` dossier-link picker on these forms (`inheritance_source`).

Check status transition controls, priority pickers, assignee pickers, deadline pickers — do they
write the right column for the right source? Watch for cross-source column drift (a unified form
writing `deadline` to a `tasks` row, etc.).

Start at `frontend/src/components/` (kanban, intake, work-item, commitments dirs),
`frontend/src/routes/_protected/`, `frontend/src/domains/`, `backend/src/api/`,
`supabase/functions/`. Cross-check columns against the source-of-truth facts.

## Output

Write your report to:
`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/data-entry-assessment/findings-B-workitems.md`

Finish with `## ASSESSMENT COMPLETE: B` in the file and print `ASSESSMENT COMPLETE: B`.
