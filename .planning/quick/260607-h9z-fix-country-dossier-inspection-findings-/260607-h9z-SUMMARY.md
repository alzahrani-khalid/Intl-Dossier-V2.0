---
phase: 260607-h9z
plan: 01
subsystem: ui
tags: [react, a11y, supabase, bullmq, dashboard, dossier, rtl]
status: complete

provides:
  - Clickable dashboard overdue-commitment rows (open commitment drawer in place)
  - useCountries engagement_count computed from engagement_dossiers.host_country_id
  - DossierTable rows exposed as buttons inside an accessible ul/li list
  - Idempotent BullMQ scheduler registration + surfaced deadline-check errors
affects: [dashboard widgets, country list page, notification queue reliability]

tech-stack:
  added: []
  patterns:
    - 'URL-driven overlay: open commitment detail in place via useCommitmentDrawer'
    - 'BullMQ idempotent repeatable jobs via upsertJobScheduler (replaces add+repeat+jobId)'

key-files:
  created: []
  modified:
    - frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx
    - frontend/src/pages/Dashboard/widgets/__tests__/OverdueCommitments.test.tsx
    - frontend/src/hooks/useCountries.ts
    - frontend/src/hooks/__tests__/useCountries.test.ts
    - frontend/src/components/list-page/DossierTable.tsx
    - frontend/src/components/list-page/__tests__/DossierTable.test.tsx
    - frontend/src/styles/list-pages.css
    - backend/src/queues/deadline-scheduler.ts
    - backend/src/queues/digest-scheduler.ts
    - backend/src/queues/notification.queue.ts
    - backend/tests/deadline-checker.test.ts

key-decisions:
  - 'FIND-1 opens the commitment drawer in place (useCommitmentDrawer) rather than navigating to /commitments — matches the globally-mounted CommitmentDrawer + OpenCommitmentsSection precedent.'
  - 'FIND-2 counts via engagement_dossiers.host_country_id (the FK the engagements repository already filters on). Reads 0 today because host_country_id is NULL on all rows in staging; the fix removes the latent always-zero wiring bug, it does not fabricate data.'
  - 'FIND-3 removes role=listitem from the row <button> (it suppressed the interactive role) and wraps each button in a real <li> under ul[role=list]; the trailing-divider CSS was re-scoped to .dossier-row-list>li:last-child.'
  - 'FIND-4 uses BullMQ 5.77 upsertJobScheduler for idempotent registration and re-throws deadline-check query errors so failures surface (BullMQ retries) instead of being swallowed.'

patterns-established:
  - 'Accessible list rows: ul[role=list] > li > button[aria-label] (not role=listitem on the button).'

requirements-completed:
  - FIND-1
  - FIND-2
  - FIND-3
  - FIND-4

completed: 2026-06-07
---

# Quick Task 260607-h9z: Country-Dossier inspection fixes — Summary

**Fixed four verified defects from the Country-Dossier workflow inspection: a dead dashboard interaction, a latent always-zero list column, a row a11y role conflict, and BullMQ duplicate-job/error-swallowing — one atomic commit each.**

## Performance

- **Tasks:** 4 completed (one atomic commit per finding)
- **Files modified:** 11 (7 frontend, 4 backend)
- **Completed:** 2026-06-07

## Accomplishments

| Finding | Commit   | What changed                                                                                                                                                           |
| ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FIND-1  | 91f0239d | Dashboard overdue-commitment rows are now real `<button>`s that open the commitment drawer in place via `useCommitmentDrawer().openCommitment(c.id)`.                  |
| FIND-2  | 615c8257 | `useCountries` computes `engagement_count` from `engagement_dossiers.host_country_id` (added to `CountryDossier`); removes the always-zero latent bug.                 |
| FIND-3  | d7d9cd76 | `DossierTable` rows restructured to `ul[role=list] > li > button[aria-label]`; removed the conflicting `role="listitem"`; re-scoped the trailing-divider CSS.          |
| FIND-4  | 6927132b | Idempotent BullMQ registration (`upsertJobScheduler`), explicit worker lock options, and `processDeadlineCheck` now re-throws query errors instead of swallowing them. |

## Verification

- `pnpm exec vitest run` — OverdueCommitments (12), useCountries (5), DossierTable (7), deadline-checker (5): all green.
- `frontend` type-check: clean. `backend` type-check: clean.
- ESLint (`--max-warnings 0`) on all 11 changed files: clean.
- Pre-commit `pnpm build` ran and passed on each commit.

## Out of scope (verified NOT code defects)

- **Inspection #3 (Saudi Arabia dossier empty):** Live DB confirms 0 relationships / 0 contacts / 0 work items; the overview queries are correct. Data-seeding gap, not code.
- **Inspection #5 (Vite HMR on `flags/*.tsx`):** the `flags/` directory was already deleted (PR #49) with zero dangling imports; stale Vite cache noise, not code.

## Follow-ups noted

- `frontend/src/routes/_protected/dossiers/organizations/index.tsx` reads `d.engagement_count` with the same latent always-zero pattern (would need a `host_organization_id` count in `useOrganizations`). Left out of scope.
