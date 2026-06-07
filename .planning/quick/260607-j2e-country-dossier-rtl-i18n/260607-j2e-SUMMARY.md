---
quick_id: 260607-j2e
slug: country-dossier-rtl-i18n
date: 2026-06-07
status: complete
branch: quick/260607-j2e-country-dossier-rtl-i18n
commits:
  - e4d16838 # fix: localize dossier header chrome in RTL/AR
  - 52c17473 # fix: render Arabic commitment titles in RTL work-items
---

# Quick Task 260607-j2e — Summary

Triaged the Country Dossier inspection report (7 Jun 2026, 6 findings) against the
live code and the staging DB (`zkrcjzdemdmwhearhfgg`). **2 of 6 were valid code
bugs** — both fixed. 1 was a pure data gap (documented, not "fixed" with code).
3 were non-issues / testing artifacts.

## What changed

### Fix M3 — Dossier header chrome not localized (commit `e4d16838`)

`DossierShell.tsx` had two copy-paste i18n key bugs:

- **Breadcrumb (L154)** used `t('tabs.overview', { ns: 'dossiers', … })`, which
  resolved to "Overview" and was uppercased to **"OVERVIEW"** by the `.label`
  class — the breadcrumb text the report saw. → `t('header.dossierHub', …)`.
- **Export button (L230)** used the same bogus key in the `dossier` namespace,
  where it doesn't exist, so it fell back to the literal **"Export"** in both
  languages. → reuse the existing `dossier:action.export` (Export / تصدير).
- Localized the two hardcoded English tooltips (real-time status, export pack).
- Added the missing `addToDossier.groups.planning` label (en+ar) — the
  Add-to-Dossier "Planning & Scheduling" group was rendering a raw key.

New keys added to en+ar `dossier-shell.json` (`header.dossierHub`,
`realtimeConnected`, `realtimeDisconnected`, `exportTooltip`) and en+ar
`dossier.json` (`addToDossier.groups.planning`). `DossierDetailLayout.tsx` is
dead code (imported nowhere) and already used the correct pattern — left untouched.

### Fix M2 — Commitment titles English in Arabic mode (commit `52c17473`)

`WorkItemsSection.tsx:124` already picks `title_ar` in RTL, but
`COMMITMENTS_COLUMNS.SUMMARY` (`query-columns.ts`) omitted `title_ar`, so it
arrived `undefined` and the renderer always fell back to English. Added `title_ar`
to the selection. **Deliberately did not add `description_ar`** — `aa_commitments`
has no such column; adding it would 400 the PostgREST query.
Seeded Arabic titles for all 8 demo commitments in `060-dashboard-demo.sql`
(mirrored by a staging `UPDATE` — verified all 8 now non-NULL) so the demo data is
bilingual and the symptom actually clears in Arabic mode.

## Verified non-issues (no code change)

- **M1 — Engagements tab empty for UAE.** Not a code bug. `DossierEngagementsTab`
  reads `related_dossiers` (`dossier_relationships`) + past `calendar_events` by
  design (its comment says it mirrors `EngagementHistoryCard`). UAE has zero
  related engagements and zero past events → empty tab is correct. `host_country_id`
  is NULL on all 3 `engagement_dossiers` rows system-wide (none are UAE). The
  report conflated _commitments_ (UAE has) with _engagements_ (it doesn't).
  Latent note: the engagement-count KPI reads `host_country_id` while this tab
  reads `dossier_relationships` — a real inconsistency, but reconciling them is a
  design change with zero current visible effect and regression risk; surfaced, not
  silently rewritten.
- **L1 — Backend on :5001 vs :5000.** Sanctioned env override
  (`VITE_BACKEND_PROXY_TARGET`) for the macOS AirPlay :5000 conflict. No change.
- **L2 — Onboarding tour every session.** `localStorage` persistence works
  (`OnboardingTourTrigger.markOnboardingSeen`). Reappeared because the inspector
  used fresh/incognito profiles. No change.
- **L3 — Nav ref staleness.** Sidebar uses stable React keys + TanStack `Link`
  routing; the misclick was a stale browser-automation ref after the RTL re-render.
  No change.

## Verification

- `tsc --noEmit` exit 0, zero errors.
- en/ar `dossier-shell.json` + `dossier.json` parse as valid JSON with all new keys.
- New `COMMITMENTS.SUMMARY` column list selects without `42703` against staging.
- All 8 `b0000003-*` commitments confirmed `title_ar` populated.
- Pre-commit `pnpm build` passed on both code commits.

## Follow-ups (not done — flagged, need a design decision)

- Reconcile the engagement-count-KPI (`host_country_id`) vs Engagements-tab
  (`dossier_relationships`) linkage so a country can't show count > 0 with an empty
  tab (or vice versa). Plus backfill `engagement_dossiers.host_country_id` if
  host-country-based engagement listing is the intended model.
