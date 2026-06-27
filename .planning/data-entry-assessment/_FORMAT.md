# Data-Entry Assessment — shared instructions (READ FIRST)

You are a **read-only assessment agent** in a larger orchestration. Do **NOT** edit, create,
or delete any source file. Do **NOT** run servers, installs, builds, tests, or migrations.
Your ONLY write is your single findings report at the path your slice brief names.

## Goal

Audit the **data-entry flow** for your assigned entities: every create / edit form, wizard,
inline editor, and data input. For each, trace the full path:

    user input → client validation → submit handler → hook/mutation → edge fn / supabase call → table
    → persistence → success/error feedback → re-render (EN **and** AR/RTL)

and report where it is broken, incorrect, dishonest, or inaccessible.

## Defect categories (hunt for ALL of these)

1. **wrong-table / wrong-column** — form writes to a legacy/empty table or a column that does
   not exist on the target table. (Cross-check the source-of-truth facts below.)
2. **validation-gap** — required fields not enforced; no Zod/server validation; accepts bad data;
   no min/max/format checks where the column constrains them.
3. **rls-block** — the insert/update will be denied by RLS for the intended user, or a read
   silently returns empty (org-isolation, clearance, NULL-org rows).
4. **fake-success** — CTA shows a success toast / navigates away but nothing persists (no
   mutation fired, stubbed handler, `TODO`, hard-coded happy path). This is a HONESTY defect — flag HIGH+.
5. **error-handling** — errors swallowed, no user-facing message, no `role="alert"`, floating
   promises, generic catch that masks the real failure.
6. **i18n-gap** — translation keys not registered in the static bundle → silent EN fallback in
   BOTH languages; dot-vs-colon namespace separator misuse; missing AR keys; hard-coded English strings.
7. **rtl** — physical props (`ml-/mr-/pl-/pr-/left-/right-/text-left/text-right`,
   `textAlign:'right'`) instead of logical; `dir` not set; Tajawal not applied; mirrored icons wrong.
8. **contract-drift** — frontend payload shape ≠ backend validator ≠ DB columns; type
   discriminator inconsistent across call sites; `RETURNS TABLE text` vs `varchar` 42804 risk.
9. **a11y** — inputs without associated `<label>`; missing `aria-*`; no keyboard path; focus not
   managed in dialogs/wizards; error not linked to field via `aria-describedby`.
10. **ux-correctness** — missing loading/disabled states; no double-submit guard; optimistic
    update without rollback; destructive action without confirm; lost unsaved input on nav.

## Source-of-truth facts (use these to catch wrong-table/column bugs)

- Engagement extension table is **`engagement_dossiers`**, NOT `engagements`. Wizard write paths
  have historically targeted the wrong one.
- Country detail fields live in the **`countries`** extension table (`iso_code_2`, `flag`);
  list hooks don't auto-join it.
- Work-item commitments table is **`aa_commitments`** — uses `due_date`, `owner_type` /
  `owner_user_id` / `owner_contact_id` (NOT `deadline` / `assignee_id`). Legacy `commitments` is EMPTY.
- **`tasks`** use `sla_deadline` (NOT `deadline`) and `workflow_stage`
  (`todo`/`in_progress`/`review`/`done`/`cancelled`).
- **`intake_tickets`** have their own status lifecycle (`draft`/`submitted`/`triaged`/`assigned`/
  `in_progress`/`converted`/`closed`/`merged`) and a distinct `urgency` enum
  (`low`/`medium`/`high`/`critical`) — `critical` is correct here (it's `urgency_level`), NOT the
  work-item `priority` (which uses `urgent`).
- Operational calendar is **`calendar_entries`**, NOT `calendar_events` (separate empty forum model).
- Work-item↔dossier junction is **`work_item_dossiers`**
  (`inheritance_source`: direct/engagement/after_action/position/mou).
- i18n is **static-bundled** in `frontend/src/i18n/index.ts`; `public/locales` is DEAD.
  Unregistered namespaces silently fall back to EN in BOTH languages.
- positions↔dossiers `link_type` live CHECK = `applies_to`/`related_to`/`endorsed_by`/`opposed_by`.
- Auth role source unified on **`public.users.role`**; clearance = `profiles.clearance_level` (1-4);
  `profiles` has NO `id` column → RLS must use `user_id = auth.uid()`.
- Priority vocabulary (work items): `low`/`medium`/`high`/`urgent` (NOT `critical`).

## Method

- Find the forms/wizards for your entities: grep `frontend/src/routes/`, `frontend/src/components/`,
  `frontend/src/domains/<feature>/`. Also check `backend/src/api/` and `supabase/functions/` for the
  write endpoints, and `supabase/migrations/` + generated types for the real schema.
- Read each submit handler → follow to the hook/mutation → follow to the edge fn / supabase `.insert`/
  `.update` → confirm table + columns match the schema and the facts above.
- Do NOT only read the happy path. Open error branches. Check the AR render (look for `isRTL`,
  logical props, `dir`, namespace registration).
- Only report a defect you can **evidence** with a precise `file:line` and a short quote/description.
  Be skeptical; do not pad. A wrong guess costs the team more than a missed nit.

## Deliverable (write ONLY to the path in your slice brief)

A markdown report. Start with a 3-5 line summary + a counts line
(`CRITICAL: n  HIGH: n  MEDIUM: n  LOW: n`). Then a findings table, one row per defect:

| ID | Severity | Entity/Form | Type | Location (file:line) | Evidence | Fix direction |

- **ID** = slice letter + number (e.g. `A-1`, `A-2`).
- **Severity** = CRITICAL (data loss / silent corruption / security) / HIGH (broken feature or
  fake-success) / MEDIUM (correctness/maintainability) / LOW (polish).
- **Type** = one of the 10 categories above.
- **Evidence** = the proof (≤2 lines).
- **Fix direction** = concrete, ≤2 lines (what to change, where).

End the file with `## ASSESSMENT COMPLETE: <your slice letter>`.

Then print to your terminal exactly: `ASSESSMENT COMPLETE: <slice letter>` and stop. Work fully
autonomously — never ask a question, never wait for input.
