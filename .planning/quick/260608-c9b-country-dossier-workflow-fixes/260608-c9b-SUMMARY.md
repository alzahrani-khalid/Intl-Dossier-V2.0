---
quick_id: 260608-c9b
slug: country-dossier-workflow-fixes
date: 2026-06-08
branch: quick/260608-c9b-country-dossier-workflow-fixes
status: complete
---

# Summary: Country Dossier workflow inspection fixes (round 3)

All six findings in the Country Dossier workflow inspection report were verified
**VALID** against the current code and the live staging DB
(`zkrcjzdemdmwhearhfgg`) before any change, then fixed as six atomic commits.
No findings were rejected this round. No PR yet (per request).

## What was fixed

| #   | Severity | Fix                                                  | Commit     |
| --- | -------- | ---------------------------------------------------- | ---------- |
| 1   | HIGH     | Work-item cards open detail views                    | `a8bd827f` |
| 2   | MEDIUM   | Country overview cards localized (AR/EN)             | `13a233bc` |
| 5   | LOW      | Work-items KPI on country analytics                  | `a08e653e` |
| 4   | HIGH     | Arabic commitment titles in dashboard overdue widget | `3a228276` |
| 3   | MEDIUM   | Recent Activity titles populated                     | `4a147080` |
| 6   | INFO     | Dates routed through `formatDayFirst`                | `5fa23102` |

### 1 — Work-item cards not interactive (HIGH)

`WorkItemCard` (`WorkItemsSection.tsx`) showed a chevron + hover but had no
handler. `WorkItemList` now dispatches by source: commitments open the
globally-mounted `CommitmentDrawer` in place (`useCommitmentDrawer`, mirrors
`OpenCommitmentsSection`); tasks → `/tasks/$id`; intakes → `/intake/tickets/$id`.
The card is a full-width, keyboard-focusable `<button>`.

### 2 — Overview cards English-only in Arabic (MEDIUM)

The six country overview cards resolve `t('overview.*')` / `t('analytics.*')` in
the `dossier` namespace, but only a _nested_ `dossier.overview` existed — the
top-level keys were missing, so the English `defaultValue` rendered in both
languages. Added top-level `overview` + `analytics` objects (with Arabic
translations) to `en/dossier.json` and `ar/dossier.json`.

### 3 — Recent Activity empty titles (MEDIUM)

Root cause (DB-confirmed): `dossier_activity_timeline` LEFT JOINed the empty
legacy `commitments` table, so commitment rows returned NULL
title/status/priority/assignee. Re-pointed the commitment join to
`aa_commitments` (assignee from `owner_user_id`) and appended `activity_title_ar`
via `CREATE OR REPLACE VIEW` (preserves grants). Migration applied to staging via
MCP; edge function `dossier-activity-timeline` redeployed (v3) to pass the column
through; `SharedRecentActivityCard` renders the Arabic title in RTL. Post-fix the
2 UAE commitments return non-NULL EN + AR titles, status, priority, assignee.

### 4 — Dashboard overdue widget English titles in AR (HIGH)

`COMMITMENTS.LIST` omitted `title_ar` (only `SUMMARY` had it, from `260607-j2e`),
so `usePersonalCommitments` always read the English `c.title`. Added `title_ar`
to `LIST` + the `Commitment` type, and a locale-aware title pick in the hook.

### 5 — Overview analytics not aligned with Tasks (LOW)

The country analytics card ignored `work_items_count` (already computed in
`dossier-overview.service`), so UAE read all-zero on Overview while Tasks showed 2. Added a Work Items metric to the country case + `work_items_count` to the
hook's stats interface.

### 6 — Date format inconsistency (INFO)

Routed three inline `toLocaleDateString` calls (work-item deadline,
dossier-first search deadline, countries last-updated) through the shared
`formatDayFirst` util — consistent `Tue 28 Apr` format + Arabic-Indic digits in
AR.

## Verification

- eslint (root config, `--max-warnings 0`) clean on all 9 changed frontend files.
- `tsc`/`pnpm build` passed via the pre-commit hook on each of the 6 commits.
- Migration applied + activity-timeline output DB-verified for UAE
  (`b0000001-…-000008`): both commitments now return EN + AR titles.
- Edge function boots (OPTIONS 200; GET 401 at the JWT gateway).

## Files changed

- `frontend/src/components/dossier/dossier-overview/sections/WorkItemsSection.tsx`
- `frontend/src/i18n/en/dossier.json`, `frontend/src/i18n/ar/dossier.json`
- `frontend/src/domains/analytics/hooks/useAnalyticsForDossier.ts`
- `frontend/src/lib/query-columns.ts`, `frontend/src/hooks/usePersonalCommitments.ts`,
  `frontend/src/types/commitment.types.ts`
- `frontend/src/domains/dossiers/hooks/useDossierActivityTimeline.ts`,
  `frontend/src/pages/dossiers/overview-cards/SharedRecentActivityCard.tsx`
- `frontend/src/components/search/DossierFirstSearchResults.tsx`,
  `frontend/src/pages/Countries.tsx`
- `supabase/migrations/20260608120000_fix_dossier_activity_timeline_aa_commitments.sql`
- `supabase/functions/dossier-activity-timeline/index.ts` (redeployed)

## Follow-ups / notes

- `intake` work items also benefit from the new drill-in + `activity_title_ar`,
  but UAE has none seeded — exercised only on commitments/tasks so far.
- Activity titles for **tasks** stay English in AR (no `title_ar` column on
  `tasks`); commitments and intakes are bilingual.
- The migration is committed; staging already has it applied via MCP. Production
  picks it up on the next migration deploy.
