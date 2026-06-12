---
phase: 65-engagement-positions-tab-legacy-reconciliation
plan: 06
subsystem: testing
tags: [live-verification, staging, rtl, engagements, positions, uat]

requires:
  - phase: 65-engagement-positions-tab-legacy-reconciliation
    provides: plans 65-01..65-05 (tab, removals, deletion, task wiring, calendar reader)
provides:
  - Live phase-gate verification matrix for ENGPOS-01/02/03 on staging
  - Nine-CTA disposition evidence + AR/RTL + width evidence
  - Gate outputs and staging cleanup confirmation
affects: [66, 67, verify-work]

tech-stack:
  added: []
  patterns: [live staging UAT via agent-browser + Supabase MCP with full cleanup]

key-files:
  created: []
  modified:
    - frontend/src/routeTree.gen.ts (fix — see Deviations)

key-decisions:
  - 'ENGPOS-01 canonical source confirmed in production behavior: the tab reads/writes position_dossier_links keyed by the engagement dossiers.id; legacy engagement_positions stayed at 0 rows all phase'
  - 'UAT caught a real integration bug: the committed routeTree.gen.ts was missing the new positions route (the 65-01 agent reverted its own regeneration while discarding prettier churn) — fixed inline as fix(65-01) 36199591'

patterns-established:
  - 'Generated-file rule: never git checkout -- routeTree.gen.ts after a route add; verify the route id survives in the committed tree'

requirements-completed: [ENGPOS-01, ENGPOS-02, ENGPOS-03]

duration: 50min
completed: 2026-06-13
---

# Phase 65 Plan 06: Live phase-gate verification Summary

**All three requirements live-verified on staging: the routed engagement Positions tab attaches and creates on position_dossier_links without reload, all nine round-15 CTAs are gone or functional (write+render paths SQL-verified), AR/RTL holds, gates green, staging clean.**

## Performance

- **Duration:** ~50 min (including one live-caught bug fix)
- **Completed:** 2026-06-13
- **Tasks:** 3/3

## Task 1 — Positions tab live matrix (ENGPOS-01/-02)

Target: engagement dossier `b0000002-0000-0000-0000-000000000001` "Bilateral consultation — ESCWA" (Wave-0 selection).

| Action                                                        | Result                                                                              | DB evidence                                                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Tab routed                                                    | `/engagements/<id>/positions` renders DossierPositionsTab between Context and Tasks | —                                                                                           |
| Attach-existing ("GASTAT stance on open data licensing")      | toast + card rendered WITHOUT reload (count 0→1)                                    | link `1f1e2657…` dossier_id = engagement id, link_type **related_to** (D-09 attach posture) |
| Create-new ("Phase 65 live verification" / "تحقق المرحلة ٦٥") | toast + card rendered WITHOUT reload (count 1→2)                                    | position `0ea48c56…` status draft, author = test user, + link row link_type **applies_to**  |

Screenshots: `/tmp/uat65-3-tab-live.png` (before), `/tmp/uat65-5-after-attach.png`, `/tmp/uat65-6-after-create.png`.

### Live-caught bug (fixed inline)

First navigation 404'd: the **committed `routeTree.gen.ts` was missing the new route** — the 65-01 executor discarded its own regenerated tree while reverting prettier churn on the generated file. The dev-server plugin regenerated the tree; committed as `fix(65-01): restore engagement positions route in regenerated route tree` (36199591). This is exactly the class of bug only the live gate catches (unit tests mock the router).

### UX observation (recorded, non-blocking)

`AttachPositionDialog` owns its open state and renders its own trigger; the header "Attach existing position" button only MOUNTS the component, exposing a second inner "Add Position" trigger (two-click attach). Same behavior exists on the country dossier tab (shipped in 64-05). Candidate polish: pass the header button as the dialog `trigger` prop. Recorded for backlog, not fixed here (shared-component change out of plan scope).

## Task 2 — Nine-CTA disposition matrix (ENGPOS-03)

| #   | Surface                                   | Disposition | Observed                                                                                                                                                                                                                     |
| --- | ----------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | WorkspaceShell header Advance Stage       | GONE        | Absent — stepper + Log After-Action only                                                                                                                                                                                     |
| 2   | OverviewTab Advance Stage                 | GONE        | Absent from quick actions (`uat65-7`)                                                                                                                                                                                        |
| 3   | OverviewTab Create task                   | LIVE        | TaskDialog opened with engagement context badge ("Will be linked to Bilateral consultation — ESCWA · Direct"); submit created task `c1a2b10f…` with **engagement_id NULL** (Pitfall 4) + work_item_dossiers row (wid_rows=1) |
| 4-5 | TasksTab Create task (empty-state/header) | LIVE        | Dialog opens; kanban caveat observed honestly: board stays empty (legacy assignments plane), empty-state copy says "New tasks appear in the main tasks list"                                                                 |
| 6-7 | CalendarTab Add event (header/empty)      | LIVE        | EventDialog created calendar_entries `9870d2ba…` (dossier_id = engagement id, organizer = test user, 2026-06-14); **Scheduled events section rendered the row WITHOUT reload**                                               |
| 8   | ContextTab Link Dossier ×2                | GONE        | grep count 0 (`uat65-14`)                                                                                                                                                                                                    |
| 9   | DocsTab Upload                            | GONE        | Only "Generate Briefing" remains (`uat65-15`)                                                                                                                                                                                |

Note: the TaskDialog submit has noticeable latency (edge cold start chain: tasks-create → work-item-dossiers → 3 invalidations); the row landed and the dialog closed late. Recorded as observation, not a defect.

## AR/RTL + widths

- AR locale: tab label **المواقف**, `dir=rtl` + Tajawal; Scheduled events heading **الأحداث المجدولة**; event date rendered with Arabic month + Arabic-Indic digits (الأحد، ١٤ يونيو 10:00 — toFormatLocale); Add event = إضافة حدث; type badge اجتماع داخلي (`uat65-16`).
- Width/locale evidence: `uat65-16` (AR calendar 1280), `uat65-17` (AR positions 1280), `uat65-18` (AR positions 1024), `uat65-19` (EN 1024), `uat65-20` (EN 1280). `scrollWidth <= clientWidth` everywhere.

## Task 3 — Gates + cleanup

- Full suite: **1313 passed / 0 failed** (174 files) · type-check exit 0 · size-limit **zero `exceeded`** matches
- Cleanup (dependency order): attach link, create-position chain (links → audience_groups → versions → position), task + work_item_dossiers, calendar entry — all SELECT counts **0**
- Final state: `engagement_positions` still **0 rows**; pre-existing 2 position_dossier_links intact; 2 published positions intact

## Phase roll-up (deferrals & fences from 65-03/65-04)

- Edge undeploy deferred: `engagements-positions-*` edges stay deployed-but-DEPRECATED (comment headers)
- Kanban canonicalization follow-up (T-65-11): board reads legacy assignments plane; dialog-created tasks render in main tasks list only
- Hazards fenced NOT-this-phase: `briefing-packs-generate` + `positions-list` dossier-filter legacy reads; `dossiers-get` extension-map miss
- Dead-code candidates kept: `usePositionSuggestions` plumbing chain, unrouted `EngagementDetailPage.tsx`

## Self-Check: PASSED

- All three roadmap criteria observed live with SQL + screenshot evidence: VERIFIED
- Gates green; staging residue 0; legacy plane untouched: VERIFIED
