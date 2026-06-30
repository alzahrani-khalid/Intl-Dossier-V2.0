---
phase: quick-260629-jkn
plan: 01
subsystem: database
tags: [organizations, dossiers, rls, security-definer, i18n, rtl, supabase, react]
requirements-completed: [260629-jkn]
key-files:
  created:
    - supabase/migrations/20260629000000_organizations_membership_representation.sql
    - supabase/migrations/20260629000100_fix_dossier_embedding_enqueue_secdef.sql
    - supabase/migrations/20260629000200_fix_dossier_mv_refresh_secdef.sql
    - frontend/src/pages/dossiers/overview-cards/GastatFocalPointsCard.tsx
  modified:
    - frontend/src/components/dossier/wizard/steps/OrgDetailsStep.tsx
    - frontend/src/services/dossier-overview.service.ts
    - frontend/src/pages/dossiers/overview-cards/MembershipStructureCard.tsx
key-decisions:
  - 'Officers stored as gastat_focal_points jsonb on organizations (names, not required system users); no dossier_owners mirror'
  - 'New GastatFocalPointsCard rather than overloading KeyRepresentativesCard (partner-people only)'
  - 'Create-flow trigger fns made SECURITY DEFINER (not opening queue INSERT RLS) to preserve hardening'
patterns-established:
  - 'Additive nullable extension columns + flat wizard fields composed into jsonb via filterExtensionData'
  - 'Client-side overview section fetcher (fetchOrganizationProfile) gated by includeSections'
duration: ~90min
completed: 2026-06-29
---

# Quick Task 260629-jkn: Organization membership & representation profile Summary

**Adds GASTAT membership_type/importance/representation_level + a gastat_focal_points jsonb to the organizations extension, surfaced in the org create/edit wizard and two overview cards (bilingual) — and fixes a create-flow trigger-RLS chain that was silently blocking ALL authenticated dossier creation.**

## Accomplishments

- Four additive, nullable columns on `organizations` (3 enum-checked text + `gastat_focal_points` jsonb), applied to staging.
- Org wizard "Engagement profile" section (3 selects + responsible/alternate/support officer inputs with optional UserPicker) + edit pre-fill + review, EN/AR.
- `MembershipStructureCard` shows membership type / importance / representation level; new `GastatFocalPointsCard` lists the three officers. Client-side `fetchOrganizationProfile` read path (opt-in section).
- **Fixed a blocking create-flow bug** (see Deviations): authenticated `dossiers-create` was failing `42501`.
- Verified live: ONS created via the real `dossiers-create` edge function with membership data; cards render correctly in EN and AR (RTL) in the browser.

## Task Commits

1. **Task 1: membership columns migration** — `1b3867c2` (feat)
2. **Task 2: wizard write path + edit + i18n** — `929e7223` (feat)
3. **Task 3: overview cards + read path + i18n** — `79817f63` (feat)
4. **Deviation fix: create-flow trigger SECURITY DEFINER** — `dea2c9aa` (fix)

## Deviations from Plan

### Auto-fixed Issues

**1. [Blocking] Authenticated dossier creation failed with 42501 (trigger-RLS chain)**

- **Found during:** live verification of the create flow (creating ONS via `dossiers-create`).
- **Issue:** `embedding_update_queue` has RLS with only an authenticated SELECT policy, and the synchronous `dossier_list_mv` refresh requires MV ownership. The two embedding-enqueue triggers and the MV-refresh trigger on `dossiers` ran as SECURITY INVOKER, so their queue insert / MV refresh were denied for a normal user — rolling back EVERY authenticated dossier create. (This is the real cause behind the "dossiers-create 403" previously logged as "correct clearance enforcement" in 260603-tuq.)
- **Fix:** recreate `queue_dossier_embedding_update`, `trg_queue_dossier_embedding_update`, and `queue_dossier_list_mv_refresh` as SECURITY DEFINER with pinned `search_path` (migrations 20260629000100 + 20260629000200). Keeps the queue write-locked.
- **Verification:** REST insert as kazahrani 403→201; ONS created via the real edge fn (id e0af80a7…) with membership data; read path returns it under RLS.
- **Committed in:** `dea2c9aa`.

**Total deviations:** 1 auto-fixed (blocking). **Impact:** required for the create flow to work at all; unblocks the broader GASTAT data-entry slice. No scope creep.

## Follow-ups (noted, not done)

- Two redundant dossier embedding-enqueue triggers — consolidate to one.
- Synchronous MV refresh per insert is expensive; consider dropping the trigger in favor of the async `refresh_dossier_list_mv` path before bulk imports.
- Other entity types' enqueue triggers may share the same SECURITY INVOKER pattern — audit if their create flows fail similarly.

## Next Readiness

- Org create flow works end-to-end via real edge functions → ready to load the rest of the UK/ONS legacy slice (UK country, MOU-001, contacts, intake, engagement, after-action, tasks, ODIN signal).

---

_Quick task: 260629-jkn_
_Completed: 2026-06-29_
