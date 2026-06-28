# Slice C — Engagement-adjacent data entry (positions, after-actions, briefs, MoUs, relationships, calendar)

First read `.planning/data-entry-assessment/_FORMAT.md` and follow it exactly.

## Your scope

The data-entry flow for entities attached to engagements/dossiers:

- **positions** — create form AND the position↔dossier **attach** flow. Verify the `link_type`
  values used match the live CHECK constraint: `applies_to`/`related_to`/`endorsed_by`/`opposed_by`.
  (This attach path has historically been a multi-bug stack — scrutinize it.)
- **after-action records** — the after-action capture form and its **commitment extraction**
  (commitments → `aa_commitments`, see facts). Decisions, follow-ups, attendees entry.
- **engagement briefs** — the brief create/edit/generate path. `engagement_briefs` is a VIEW;
  verify the write goes through the correct RPC/edge fn, not a direct VIEW insert. Watch for the
  "manual brief" / "generate" CTAs that may be fake-success.
- **MoUs** — MoU create/edit forms and their dossier linking.
- **relationships** — the relationship create/edit UI between dossiers (health score, type).
- **calendar entries** — event/entry creation. Verify it writes `calendar_entries` (the
  operational calendar), NOT the empty `calendar_events`.

Start at `frontend/src/components/` (positions, after-action/AfterAction, briefs, mou, relationships,
calendar dirs), `frontend/src/routes/_protected/`, `frontend/src/domains/`, `backend/src/api/`,
`supabase/functions/`. Trace each submit → mutation → table; cross-check against the facts.

## Output

Write your report to:
`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/data-entry-assessment/findings-C-engagement-adjacent.md`

Finish with `## ASSESSMENT COMPLETE: C` in the file and print `ASSESSMENT COMPLETE: C`.
