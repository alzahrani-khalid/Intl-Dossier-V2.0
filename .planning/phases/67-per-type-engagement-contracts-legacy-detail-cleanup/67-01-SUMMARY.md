---
phase: 67-per-type-engagement-contracts-legacy-detail-cleanup
plan: 01
subsystem: frontend-dossier-tabs
tags: [pereng-01, pereng-02, ovrerr-01, engagements, i18n, error-contract]
requires:
  - DossierEngagementsTab (shipped 65-01 tab chrome/timeline/badge pill)
  - DossierOverviewAPIError + Phase 66 dossier:overview.sectionError key (EN+AR)
  - engagement_dossiers.host_organization_id / engagement_participants (permissive SELECT RLS, Q5 verified)
provides:
  - Per-type "Hosted engagements" section on organization dossiers (reads host_organization_id)
  - Per-type "Participation" section on person/elected_official dossiers (reads engagement_participants)
  - Phase 66 error contract on all three tab branches (OVRERR-01 closed on this tab)
  - dossier-shell sections.{hostedEngagements,participation,history} EN+AR
affects:
  - frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx
  - frontend/src/routes/_protected/dossiers/{organizations,persons,elected-officials}/$id/engagements.tsx
tech-stack:
  added: []
  patterns:
    - 'Two-step .eq()+.in() merge on dossiers for names (never an extension-table embed)'
    - 'Separate enabled-gated useQuery per per-type branch -> per-section error granularity'
    - 'enabled:false query reports isLoading:true -> gate skeleton only on enabled queries'
key-files:
  created: []
  modified:
    - frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx
    - frontend/src/components/dossier/tabs/__tests__/DossierEngagementsTab.test.tsx
    - frontend/src/i18n/en/dossier-shell.json
    - frontend/src/i18n/ar/dossier-shell.json
    - frontend/src/routes/_protected/dossiers/organizations/$id/engagements.tsx
    - frontend/src/routes/_protected/dossiers/persons/$id/engagements.tsx
    - frontend/src/routes/_protected/dossiers/elected-officials/$id/engagements.tsx
decisions:
  - 'PERENG-01: Option B (wire the read) implemented — org tab reads engagement_dossiers.host_organization_id, consistent with the shipped useOrganizations KPI tally'
  - 'Participation reads ONLY the canonical plane (engagement_participants -> engagement_dossiers -> dossiers); person_engagements and legacy engagements never touched'
  - 'Option C (wizard host picker) deferred — research names it optional scope'
metrics:
  duration: ~50m
  completed: 2026-06-13
  tasks: 2
  files: 7
  commits: 2
---

# Phase 67 Plan 01: Per-Type Engagement Contract Sections Summary

Extended `DossierEngagementsTab` with two per-type contract sections — "Hosted engagements" (org, reads `host_organization_id`) and "Participation" (person/EO, reads canonical `engagement_participants`) — and brought all three tab branches up to the Phase 66 error contract (throw, never swallow), closing OVRERR-01 on this tab, with three new bilingual `dossier-shell` keys.

## What Was Built

- **Hosted engagements (organization):** `engagement_dossiers WHERE host_organization_id = dossierId`, names merged from `dossiers` via a two-step `.in()` lookup (never an extension-table embed). Engagement-type badge via `engagements:types.*`.
- **Participation (person/elected_official):** `engagement_participants WHERE participant_dossier_id = dossierId` → `engagement_dossiers` (dates) → `dossiers` (names). Bilingual role badge via `engagements:participantRoles.*`. EO leg is automatic (same component, `dossierType="elected_official"`).
- **Error contract on all three branches:** each per-type `queryFn` throws `DossierOverviewAPIError` on every step error. Render rule per UI-SPEC: success + 0 rows → section fully ABSENT (no heading, no empty line); error with no cached data → heading + `role="alert"` `dossier:overview.sectionError` line; cached rows + refetch failure → rows kept (stale-while-error). The generic branch adopted `isError` → `sectionError` line in its empty-line slot instead of the "No engagements yet" copy (OVRERR-01 closed here).
- **Conditional "History" sub-heading** renders above the generic timeline only when a per-type section AND the generic block both render — no dead headings.
- **Three new bilingual keys** in `dossier-shell` (new top-level `sections` object), EN+AR in the same commit, parity-asserted by a unit test.
- **Route props:** `dossierType` passed from the organizations/persons/elected-officials engagements routes only; the other four type routes are untouched.

## Tasks Completed

| Task | Name                                                   | Commit     | Files                                         |
| ---- | ------------------------------------------------------ | ---------- | --------------------------------------------- |
| 1    | RED — per-type section + error-contract tests          | `49e527b6` | `__tests__/DossierEngagementsTab.test.tsx`    |
| 2    | GREEN — sections + error contract + i18n + route props | `600b44a8` | tab, test, en/ar dossier-shell.json, 3 routes |

## Verification

- `pnpm exec vitest run …/DossierEngagementsTab.test.tsx` → **10 passed** (2 pre-existing + 8 new; RED gate confirmed 6 failing before implementation).
- `pnpm type-check` → exit 0 (no errors).
- `pnpm exec eslint` on all 5 touched code files → exit 0 (clean).
- i18n parity check → `I18N_OK` (EN "Hosted engagements"; AR المشاركات المستضافة / المشاركة / السجل).
- Guard greps: tab contains `engagement_participants`, does NOT contain `person_engagements`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test mock `t()` did not resolve own-namespace section keys**

- **Found during:** Task 2 (GREEN run)
- **Issue:** The component uses dot-form `t('sections.hostedEngagements')` for its own `dossier-shell` namespace (correct per UI-SPEC). The test's echo-`t` mock returned the raw key for any lookup without a `defaultValue`, so the section-heading assertions could not match the English copy.
- **Fix:** Replaced the single-key special-case in the test mock with a small `ownNamespaceStrings` literal map resolving the three `sections.*` keys (plus the existing `empty.engagements.title`) to their EN copy. Production code stays clean — no `defaultValue` noise on own-namespace lookups.
- **Files modified:** `__tests__/DossierEngagementsTab.test.tsx` (folded into the Task 2 commit since the test file is in this plan's `files_modified`).
- **Commit:** `600b44a8`

### Generated-file note (not committed)

`frontend/src/routeTree.gen.ts` showed as modified during execution, but the entire diff is cosmetic prettier/generator reflow of unrelated `.update({…})` route blocks (641/503 lines) — no route-structure change from my edits (which only added a JSX prop). Per the worktree generated-file prohibition I did NOT `git checkout` it and did NOT stage it; it is out of this plan's scope.

## Documented Pitfalls (no code change, per plan)

- **Pitfall 6 — KPI divergence:** the org-list `engagement_count` KPI counts hosted rows only, while this tab shows hosted + generic history. No count badge is rendered on the section heading (UI-SPEC A-4), so no number-vs-number contradiction exists in the UI. Divergence documented here, not changed.
- **Pitfall 7 — calendar past window:** the generic branch's past-events window is 7 days (unchanged); not touched this plan.

## Deferred / Follow-ups

- **Option C (wizard host picker):** deferred — 67-RESEARCH names it optional scope. Not implemented.
- **Live proof:** orchestrator protocol live verification in both locales at 1280px/1024px with seeded rows + forced branch failure is deferred to 67-06 (per plan `<done>` notes).

## Known Stubs

None. All sections are wired to live PostgREST reads; empty per-type sections are intentionally absent (WR-04), not stubbed placeholders.

## Self-Check: PASSED

- FOUND: frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx
- FOUND: frontend/src/components/dossier/tabs/**tests**/DossierEngagementsTab.test.tsx
- FOUND: frontend/src/i18n/en/dossier-shell.json (sections.hostedEngagements="Hosted engagements")
- FOUND: frontend/src/i18n/ar/dossier-shell.json (sections.hostedEngagements="المشاركات المستضافة")
- FOUND: 3 route files with dossierType prop
- FOUND commit: 49e527b6 (RED)
- FOUND commit: 600b44a8 (GREEN)
