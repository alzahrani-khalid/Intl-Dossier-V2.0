---
phase: 67-per-type-engagement-contracts-legacy-detail-cleanup
plan: 05
subsystem: frontend-dossier-detail
tags: [deletion, dead-code, dossier, type-honesty, PERENG-02, PERENG-03]
wave: 3
depends_on: [67-04]
requires:
  - '67-04 deleted the *DossierDetail root chain so sections/* and the transitive leaves are provably orphaned'
provides:
  - 'components/dossier/sections/ no longer exists (19 files gone)'
  - '8 transitive orphans + pre-existing-dead EngagementTimeline removed'
  - 'PersonEngagement link type canonical against the 67-03 engagement_participants emission'
  - 'PERENG-03 phase-wide deleted-name grep gate green; nothing of the legacy detail plane survives'
affects:
  - 'frontend/src/components/dossier/'
  - 'frontend/src/components/timeline/'
  - 'frontend/src/components/engagements/'
  - 'frontend/src/types/person.types.ts'
tech_stack:
  added: []
  patterns:
    - '65-03 deletion discipline: execution-time re-grep STOP gate with import-path verification before each destructive commit; one commit per closed sub-graph'
    - '260605-r92 type-honesty: link type rewritten to match the actual RPC emission so consumers cannot trust phantom fields'
key_files:
  created: []
  modified:
    - frontend/src/types/person.types.ts
  deleted:
    - frontend/src/components/dossier/sections/CommitteeAssignments.tsx
    - frontend/src/components/dossier/sections/ContactPreferencesSection.tsx
    - frontend/src/components/dossier/sections/DecisionLogs.tsx
    - frontend/src/components/dossier/sections/DeliverablesTracker.tsx
    - frontend/src/components/dossier/sections/ElectedOfficialProfile.tsx
    - frontend/src/components/dossier/sections/EngagementInformation.tsx
    - frontend/src/components/dossier/sections/FollowUpActions.tsx
    - frontend/src/components/dossier/sections/InstitutionalProfile.tsx
    - frontend/src/components/dossier/sections/InteractionHistory.tsx
    - frontend/src/components/dossier/sections/MeetingSchedule.tsx
    - frontend/src/components/dossier/sections/MemberOrganizations.tsx
    - frontend/src/components/dossier/sections/OrgHierarchy.tsx
    - frontend/src/components/dossier/sections/OrganizationAffiliations.tsx
    - frontend/src/components/dossier/sections/OutcomesSummary.tsx
    - frontend/src/components/dossier/sections/ParticipantsList.tsx
    - frontend/src/components/dossier/sections/PositionsHeld.tsx
    - frontend/src/components/dossier/sections/ProfessionalProfile.tsx
    - frontend/src/components/dossier/sections/StaffDirectory.tsx
    - frontend/src/components/dossier/sections/TermHistory.tsx
    - frontend/src/components/dossier/CollapsibleSection.tsx
    - frontend/src/components/timeline/CountryTimeline.tsx
    - frontend/src/components/timeline/OrganizationTimeline.tsx
    - frontend/src/components/timeline/PersonTimeline.tsx
    - frontend/src/components/timeline/EngagementTimeline.tsx
    - frontend/src/components/key-contacts-panel/KeyContactsPanel.tsx
    - frontend/src/components/engagements/ForumSessionCreator.tsx
    - frontend/src/components/engagements/EngagementBriefsSection.tsx
    - frontend/src/components/dossier-timeline/DossierTimeline.tsx
decisions:
  - 'EngagementTimeline (pre-existing zero-importer dead code, not in the timeline barrel) deleted in the same sweep — its execution-time grep was clean (zero importers, zero import statements, not in barrel)'
  - 'PersonEngagement rewritten to the canonical engagement_participants row; PersonEngagementWithDetails.engagement and PersonFullProfile left untouched (the 67-03 migration emits exactly those engagement fields)'
  - 'Reverted generator-only routeTree.gen.ts churn (TanStack Router build-plugin line-wrapping) before/after every commit — zero deletion-set names each time, kept out of all three commits (67-04 precedent)'
metrics:
  duration: ~22m
  completed: '2026-06-13'
  tasks: 3
  commits: 3
  files_deleted: 28
  files_modified: 1
  lines_removed: 5975
---

# Phase 67 Plan 05: Legacy Detail-Plane Leaf Sweep + Canonical Link Type Summary

Swept the now-orphaned leaves of the legacy `*DossierDetail` plane — all 19 `components/dossier/sections/*` files plus 8 transitive orphans (and pre-existing-dead `EngagementTimeline`) — then made the `recent_engagements` link type honest against the canonical `engagement_participants` emission, closing PERENG-03 in-repo with a phase-wide deleted-name grep gate, full unit suite, and a zero-exceeded size-limit run.

## What Was Done

Three commits, each preceded by its own execution-time re-grep STOP gate (65-03 discipline). The 67-PATTERNS census (zero external importers) was re-verified live before any `git rm`, and every substring collision was disambiguated by import path.

### Task 1 — 19-file sections plane (`b043ab82`)

- **Gate (passed):** grepped `dossier/sections` path + all 19 bare component names across `frontend/src`; every hit was inside the sections dir itself (intra-set imports). Zero `routeTree.gen.ts` refs, zero test refs, zero barrel refs.
- `git rm -r src/components/dossier/sections` (one commit — closed sub-graph). Includes `InteractionHistory` (the legacy `recent_engagements` renderer, superseded by the 67-01 participation contract on registered namespaces).
- **Verify:** `pnpm type-check` exit 0, `pnpm build` exit 0. **19 files changed, 3880 deletions.**

### Task 2 — 9 transitive orphans (`efca186e`)

- **Gate (passed, import-path verified):** the substring matches flagged by the per-name grep were all confirmed NON-importers —
  - `CollapsibleSection` → `useCollapsibleSections` (a different hook in `hooks/useSessionStorage.ts`).
  - `CountryTimeline`/`OrganizationTimeline`/`PersonTimeline` → the route files at `dossiers/{seg}/$id/timeline.tsx` define local functions `CountryTimelineRoute` etc. and lazy-render the **LIVE** `DossierActivityTimeline` — zero `import` of the deleted timeline components.
  - `KeyContactsPanel` ≠ `KeyContactsCard` (the live overview card); `DossierTimeline` ≠ `DossierActivityTimeline`.
  - `EngagementTimeline`: zero importers, zero import statements, not in the timeline barrel → grep-clean, deleted (not the carve-out-keep case).
- `git rm` the 9 files; the single-file `key-contacts-panel/` and `dossier-timeline/` dirs were removed by git. The timeline barrel (`InteractiveTimeline`/`CompactInteractiveTimeline`/`UnifiedVerticalTimeline`/etc.) was untouched.
- **Verify:** `pnpm type-check` exit 0, `pnpm build` exit 0, full unit suite `pnpm exec vitest run` exit 0 — **182 files passed / 4 skipped; 1417 tests passed / 25 todo; 0 failures.** **9 files changed, 2090 deletions.**

### Task 3 — canonical link type + phase gates (`9a864dbf`)

- Rewrote `PersonEngagement` to the canonical `engagement_participants` row shape (`participant_type` / `participant_dossier_id` / `attendance_status`), dropping legacy `person_id`/`attended` phantom fields. Doc comment names PERENG-02 + the 67-03 migration (T-67-11 honesty). `PersonEngagementWithDetails.engagement` and `PersonFullProfile` left untouched.
- Confirmed the only `.attended` reader is `PersonDetailPage.tsx:696`, reached through an `(eng: any)` map cast (L683) — so the field change type-checks cleanly; canonical rows simply never render the "Attended" badge (`attendance_status` is the canonical field; `attended` is `undefined` → falsy, runtime-safe). Pre-existing any-cast, left as-is per the plan decision and surgical-change rule.
- **Verify:** `pnpm type-check` exit 0, `pnpm exec vitest run` exit 0 (1417 pass), `pnpm build` exit 0. **1 file changed, +10/-5.**

## Phase-Wide PERENG-03 Grep Gate (67-VALIDATION row 4)

Full deleted-name sweep across `frontend/src` after all three commits:

| Name set                                                                                                  | Result    |
| --------------------------------------------------------------------------------------------------------- | --------- |
| 67-04 root chain (6 `*DossierDetail` + 6 `*DossierPage` + `EngagementDetailPage` + `DossierDetailLayout`) | zero hits |
| Task 1 (19 section component names)                                                                       | zero hits |
| Task 2 (9 orphan names, verified substring collisions excluded)                                           | zero hits |

**PERENG-03 PHASE-WIDE GATE: PASS** — nothing of the legacy detail plane survives.

## Size-Limit

`pnpm exec size-limit` exit 0; whole-log `exceeded` grep = **0 lines**. `signature-visuals/d3-geospatial` sits at 54.28/55 kB (the previously-flagged near-budget entry) — within budget; deletions shrank the tree, no budget tripped.

## Per-Commit Gate Evidence

| Commit     | Gate (pre-delete)                                       | type-check | build  | unit suite          | Post re-grep / churn                  |
| ---------- | ------------------------------------------------------- | ---------- | ------ | ------------------- | ------------------------------------- |
| `b043ab82` | 19 names: all in-set; routeTree/tests/barrel clean      | exit 0     | exit 0 | n/a (run at Task 2) | SECTIONS_CLEAN; churn reverted        |
| `efca186e` | 9 orphans: substring collisions confirmed non-importers | exit 0     | exit 0 | exit 0 (1417 pass)  | ORPHANS_CLEAN; churn reverted         |
| `9a864dbf` | n/a (type edit); `.attended` reader is any-cast         | exit 0     | exit 0 | exit 0 (1417 pass)  | size-limit 0 exceeded; churn reverted |

## STOP Events

None. Every gate confirmed the census was still accurate. The `EngagementTimeline` carve-out resolved to delete (grep-clean), not keep.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reverted generator-only routeTree.gen.ts churn**

- **Found during:** every `pnpm build` and the pre-commit build hook on all three commits.
- **Issue:** the TanStack Router build plugin rewrites `frontend/src/routeTree.gen.ts` with prettier-style line-wrapping of identical route definitions on every build — a generated artifact unrelated to this sweep.
- **Fix:** confirmed the diff carried zero deletion-set names, then `git checkout -- frontend/src/routeTree.gen.ts` to keep commits surgical (deletions / one type edit only). Final working tree left clean.
- **Files modified:** none committed (reverted).
- **Commit:** n/a.

## Recorded Follow-ups (no code this plan)

1. **Barrel-kept survivors (65-03 barrel-API precedent):** `InteractiveTimeline` / `CompactInteractiveTimeline` (exported from `components/timeline/index.ts`), the `components/stakeholder-timeline/` directory, and `components/multilingual/` are KEPT — they are barrel-exported / independently importable and were never part of the legacy detail plane. Not swept.
2. **Dead i18n key blocks:** `frontend/src/i18n/{en,ar}/dossier.json` retain `sections.*` key blocks whose sole consumers (the deleted `*DossierDetail` + sections components) are now gone. Left in place — removing them safely requires per-key EN↔AR grep proof (low value, high audit cost). Recorded follow-up, not swept this plan.
3. **`person_engagements` declared legacy-dead:** repo-wide grep finds it only as a generated schema-mirror typedef in `frontend/src/types/database.types.ts` + `backend/src/types/database.types.ts` (the table block and FK names) — **zero** `.from('person_engagements')` / insert / update queries in app, backend, or edge-function code. Its `engagement_id` FK joins the legacy `engagements` table (different id-space from the routed `engagement_dossiers` workspace). Never read or written from new code; **no destructive DB migration this phase.**
4. **`PersonFullProfile` residual drift (pre-existing, out of scope):** `PersonFullProfile` still declares `current_role` / `roles` / `affiliations` / `relationships` (lines 74–77) which are not part of the live `get_person_full` emission. Pre-existing, untouched per the plan — the type edit was scoped to `PersonEngagement` only.

## Known Stubs

None — this is a dead-code deletion + a type-honesty edit; no UI data sources, props, or placeholders were introduced.

## Threat Flags

None — no new network endpoints, auth paths, file access, or schema changes at trust boundaries. The type edit (T-67-11) removes phantom fields rather than adding surface.

## Verification

- 67-VALIDATION PERENG-03 grep gate realized phase-wide → zero surviving references (table above).
- Per-commit type-check + build exit codes verified manually (pre-commit build does not block on failure, per project memory).
- Full vitest suite green twice (Task 2 + Task 3): 1417 pass / 0 fail.
- size-limit: zero exceeded lines (whole log grepped).

## Self-Check: PASSED

- Modified file exists: `frontend/src/types/person.types.ts` — FOUND; `participant_dossier_id` PRESENT at HEAD.
- All 28 deleted files confirmed absent from disk; `sections/`, `key-contacts-panel/`, `dossier-timeline/` directories gone.
- Commit `b043ab82` — FOUND in git log.
- Commit `efca186e` — FOUND in git log.
- Commit `9a864dbf` — FOUND in git log.
- Working tree clean (no leftover generated churn).
