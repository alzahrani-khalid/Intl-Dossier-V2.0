# Slice E — Cross-cutting data-entry quality (validation, errors, i18n, RTL, a11y, honesty)

First read `.planning/data-entry-assessment/_FORMAT.md` and follow it exactly.

## Your scope

Instead of one entity, audit the **cross-cutting quality of data entry** across the app's forms.
Sample broadly (8-15 representative forms spanning dossiers, work items, positions, settings) and
report systemic patterns + the worst concrete instances.

Focus areas:

- **validation patterns** — is there a consistent Zod + React Hook Form layer? Which forms submit
  with no schema validation? Where does client validation disagree with the DB constraint?
- **error surfacing** — when a mutation fails, does the user see a specific, localized message with
  `role="alert"`? Find forms that swallow errors or show only a generic toast. Note the global error
  sanitizer that masks all 401s as "Authentication required".
- **fake-success / honesty** — CTAs that toast success or navigate without a real persisted mutation
  (stubs, TODOs, disabled-but-look-enabled). List every one you find — this is a priority class.
- **i18n registration** — which form namespaces are NOT registered in `frontend/src/i18n/index.ts`
  (→ silent EN fallback in AR)? Find dot-vs-colon separator misuse and hard-coded English in forms.
- **RTL** — forms using physical spacing/text-align instead of logical props; missing `dir`;
  number/date formatting that breaks in AR (use `lib/format-locale`, not bare `Intl`).
- **a11y of forms** — inputs without labels, missing `aria-describedby` error links, dialog focus
  traps, keyboard submission.
- **double-submit / loading / disabled** — forms that allow double submit or give no pending state.

Produce both: (1) a **systemic patterns** section (the recurring issues + how widespread), and
(2) the standard findings table with the worst concrete `file:line` instances.

Start broad with grep across `frontend/src/` for the anti-patterns above, then deep-read the worst
offenders. Cross-check i18n against `frontend/src/i18n/index.ts`.

## Output

Write your report to:
`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.planning/data-entry-assessment/findings-E-crosscutting.md`

Finish with `## ASSESSMENT COMPLETE: E` in the file and print `ASSESSMENT COMPLETE: E`.
