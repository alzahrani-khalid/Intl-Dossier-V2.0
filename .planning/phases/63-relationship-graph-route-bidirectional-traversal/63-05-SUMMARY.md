---
phase: 63-relationship-graph-route-bidirectional-traversal
plan: 05
subsystem: staging-verification
tags: [relationship-graph, staging-seed, browser-uat, rtl, size-limit]

requires:
  - phase: 63-relationship-graph-route-bidirectional-traversal
    plan: 01
    provides: bidirectional traversal RPC
  - phase: 63-relationship-graph-route-bidirectional-traversal
    plan: 04
    provides: direction-aware graph-traversal edge function
provides:
  - Staging seed rows covering all 7 reachable dossier types
  - Live browser click-through matrix for every dossier type
  - AR/RTL and width evidence for the graph page
  - Full suite, type-check, and size-limit gate results
affects: [relationship-graph, dossier-routing, staging-data]

tech-stack:
  added: []
  patterns:
    - Idempotent staging seed rows with fixed UUID fixtures
    - Browser UAT JSON evidence with screenshots kept as ignored local artifacts
    - Canonical locale switching through id.locale and query-string lng

key-files:
  created:
    - .planning/phases/63-relationship-graph-route-bidirectional-traversal/evidence/63-05-browser-uat.json
  modified: []

key-decisions:
  - 'Created low-clearance Phase 63 topic and second-degree forum fixtures because the existing topic was sensitivity_level 3 and the existing direct country->forum edge hid the intended degree-2 org->forum path.'
  - 'Recorded screenshot evidence on disk but left PNGs ignored by the repo-wide *.png rule.'
  - 'Kept CORS tightening, database.types.ts regeneration, and legacy *DossierDetail disposition out of this plan per 63-RESEARCH; Phase 67 owns legacy detail cleanup.'

patterns-established:
  - 'For AR browser verification, set id.locale and use ?lng=ar; i18nextLng alone is lower priority and can leave the app in English.'
  - 'Advanced graph node navigation is focus-then-click; the start country node required a second click to navigate.'

requirements-completed: [GRAPH-01, GRAPH-02, GRAPH-03]

duration: 58 min
completed: 2026-06-12
---

# Phase 63 Plan 05: Staging verification summary

**Seeded and verified the relationship graph end to end on staging**

## Performance

- **Started:** 2026-06-12T07:58:00Z
- **Completed:** 2026-06-12T08:56:54Z
- **Tasks:** 3 completed
- **Files modified:** 0 code files
- **Files created:** 1 JSON evidence file, 1 summary file

## Accomplishments

- Seeded staging project `zkrcjzdemdmwhearhfgg` with a visible relationship graph covering all 7 reachable dossier types:
  - country
  - organization
  - forum
  - engagement
  - topic
  - working_group
  - person
- Proved seed idempotency by rerunning the seed operations until both fixture and relationship inserts returned zero new rows.
- Verified the user-JWT RPC and the deployed `graph-traversal` edge function both return the seeded all-type graph.
- Verified the mini-graph "View full graph" entry closes the route loop from a country dossier to `/relationships/graph?dossierId=<anchor>`.
- Verified all 7 type routes navigate to their correct `/dossiers/<segment>/<uuid>` detail paths.
- Verified Arabic/RTL title and node-label behavior, plus EN/AR width checks.
- Ran the full wave gates: full Vitest suite, type-check, and size-limit.

## Seed Inventory

Anchor dossier:

- `b0000001-0000-0000-0000-000000000001` - country - Indonesia - sensitivity 2

Existing visible dossiers used:

- `b0000001-0000-0000-0000-000000000002` - organization - UN ESCWA - sensitivity 2
- `b0000001-0000-0000-0000-000000000003` - forum - G20 Data Gaps Initiative - sensitivity 2
- `b0000002-0000-0000-0000-000000000001` - engagement - Bilateral consultation - ESCWA - sensitivity 2
- `a0000000-0000-0000-0000-000000000501` - person - Test Person A - Senior Diplomat - sensitivity 1
- `a0000000-0000-0000-0000-000000000404` - working_group - Test Working Group D - Health Cooperation - sensitivity 1

Fixtures created for Phase 63:

- `f63d0900-0000-0000-0000-000000000001` - topic - Phase 63 graph verification topic - sensitivity 2
- `f63d0900-0000-0000-0000-000000000002` - forum - Phase 63 second-degree verification forum - sensitivity 2

Seeded relationship rows:

| Source                                 | Target                                 | Type              | Direction relative to Indonesia  |
| -------------------------------------- | -------------------------------------- | ----------------- | -------------------------------- |
| `f63d0900-0000-0000-0000-000000000001` | `b0000001-0000-0000-0000-000000000001` | `discusses`       | incoming                         |
| `b0000002-0000-0000-0000-000000000001` | `b0000001-0000-0000-0000-000000000001` | `involves`        | incoming                         |
| `b0000001-0000-0000-0000-000000000001` | `b0000001-0000-0000-0000-000000000002` | `member_of`       | outgoing                         |
| `b0000001-0000-0000-0000-000000000001` | `b0000001-0000-0000-0000-000000000003` | `participates_in` | outgoing                         |
| `b0000001-0000-0000-0000-000000000002` | `b0000001-0000-0000-0000-000000000003` | `participates_in` | degree-2 duplicate endpoint path |
| `a0000000-0000-0000-0000-000000000501` | `b0000001-0000-0000-0000-000000000001` | `represents`      | incoming                         |
| `b0000001-0000-0000-0000-000000000002` | `f63d0900-0000-0000-0000-000000000002` | `participates_in` | degree-2 verification path       |

The pre-existing working-group edge remains:

- `a0000000-0000-0000-0000-000000000404` -> `b0000001-0000-0000-0000-000000000001`, `cooperates_with`

## Live Graph Evidence

Final edge-function probe from the browser session:

- HTTP status: 200
- node count: 8
- edge count: 7
- max degree: 2
- node types: `country`, `engagement`, `forum`, `organization`, `person`, `topic`, `working_group`
- edge types: `cooperates_with`, `discusses`, `involves`, `member_of`, `participates_in`, `represents`
- second-degree node: `f63d0900-0000-0000-0000-000000000002` (`forum`)

Arrow-direction proof:

- observed edge: `a0000000-0000-0000-0000-000000000404` -> `b0000001-0000-0000-0000-000000000001`
- relationship type: `cooperates_with`
- interpretation: React Flow receives the working group as source and Indonesia as target, so the arrow points into the focused dossier for this incoming relationship.

Relationship-type filter proof:

- filter: `cooperates_with`
- HTTP status: 200
- node count: 2
- edge count: 1
- node types: `country`, `working_group`
- edge type: `cooperates_with`

## Browser Click-Through Matrix

Evidence file: `.planning/phases/63-relationship-graph-route-bidirectional-traversal/evidence/63-05-browser-uat.json`

| Type          | Node id                                | Expected route segment      | Observed route                                                  | Surface                                |
| ------------- | -------------------------------------- | --------------------------- | --------------------------------------------------------------- | -------------------------------------- |
| country       | `b0000001-0000-0000-0000-000000000001` | `/dossiers/countries/`      | `/dossiers/countries/b0000001-0000-0000-0000-000000000001`      | advanced graph start-node double click |
| organization  | `b0000001-0000-0000-0000-000000000002` | `/dossiers/organizations/`  | `/dossiers/organizations/b0000001-0000-0000-0000-000000000002`  | relationship navigator list            |
| forum         | `f63d0900-0000-0000-0000-000000000002` | `/dossiers/forums/`         | `/dossiers/forums/f63d0900-0000-0000-0000-000000000002`         | relationship navigator list            |
| engagement    | `b0000002-0000-0000-0000-000000000001` | `/dossiers/engagements/`    | `/dossiers/engagements/b0000002-0000-0000-0000-000000000001`    | relationship navigator list            |
| person        | `a0000000-0000-0000-0000-000000000501` | `/dossiers/persons/`        | `/dossiers/persons/a0000000-0000-0000-0000-000000000501`        | relationship navigator list            |
| topic         | `f63d0900-0000-0000-0000-000000000001` | `/dossiers/topics/`         | `/dossiers/topics/f63d0900-0000-0000-0000-000000000001`         | relationship navigator list            |
| working_group | `a0000000-0000-0000-0000-000000000404` | `/dossiers/working_groups/` | `/dossiers/working_groups/a0000000-0000-0000-0000-000000000404` | relationship navigator list            |

No-dossier state:

- `/relationships/graph?lng=en`
- alert visible: true
- Browse dossiers link visible: true

Consumer smoke:

- `/stakeholder-influence?lng=en` rendered with heading `Stakeholder Influence`.
- The route did not hit an error boundary.

## AR/RTL And Width Evidence

Screenshots on disk:

- `01-dossier-mini-graph-entry.png`
- `02-full-graph-en-1400.png`
- `03-full-graph-degree-3.png`
- `04-full-graph-filter-cooperates-with.png`
- `05-no-dossier-alert.png`
- `06-full-graph-ar-rtl.png`
- `07-full-graph-en-1024.png`
- `07-full-graph-en-1400.png`
- `08-full-graph-ar-1280.png`
- `09-stakeholder-influence.png`

AR assertions:

- URL: `/relationships/graph?dossierId=b0000001-0000-0000-0000-000000000001&lng=ar`
- `html.dir`: `rtl`
- `body` computed direction: `rtl`
- title visible: `مخطط العلاقات`
- Arabic Indonesia label visible
- Arabic Phase 63 topic label visible

Width checks:

| Width | Locale | Overflow X |
| ----- | ------ | ---------- |
| 1024  | EN     | 0          |
| 1400  | EN     | 0          |
| 1280  | AR     | 0          |

## Verification

- `cd frontend && pnpm vitest run`
  - exit 0
  - 169 test files passed, 4 skipped
  - 1277 tests passed, 25 todo
  - warnings: existing Node `localStorage` experimental warning and jsdom canvas `getContext()` warning
- `cd frontend && pnpm type-check`
  - exit 0
- `cd frontend && pnpm exec size-limit`
  - exit 0
  - `grep -i exceeded /tmp/size-limit-63.log` found zero matches
  - largest budget margins:
    - Initial JS: 450.54 kB / 460 kB
    - Total JS: 2.51 MB / 2.55 MB
    - signature-visuals/d3-geospatial: 54.28 kB / 55 kB

## Issues Encountered

- The existing visible topic dossier had `sensitivity_level = 3`, above the test user's visibility, so a Phase 63 topic fixture with sensitivity 2 was created.
- The existing direct Indonesia -> G20 forum edge caused shortest-path dedupe to hide the intended organization -> same-forum degree-2 path, so a second-degree-only forum fixture was created.
- The onboarding tour modal initially obscured the mini-graph. Browser UAT set `intl-dossier-onboarding-seen=true` and `intl-dossier:first-run-dismissed=true` after login.
- Locale switching failed when only `i18nextLng=ar` was set; `id.locale` plus `?lng=ar` was required.
- `/stakeholder-influence` rendered, but browser console captured three existing route-local errors:
  - invalid HTML nesting from a skeleton `<div>` inside a `<p>`
  - the paired React nesting warning
  - `network-statistics` query returned `undefined`

## Deviations From Plan

- The plan named agent-browser, but the exposed browser tooling in this session did not provide the Browser MCP. Maestro Chromium was blank for this app, so Playwright was used for the browser UAT.
- The country node is the graph start dossier and is excluded from the relationship navigator list. Its click-through was verified via the advanced graph's focus-then-click behavior instead.
- Screenshots were not committed because `.gitignore` ignores `*.png`; the JSON evidence and this summary carry the durable text proof.

## Deliberate Exclusions

- CORS tightening remains deferred.
- `frontend/src/types/database.types.ts` regeneration remains deferred.
- Legacy `*DossierDetail` routing/deletion remains Phase 67 scope.

## Next Phase Readiness

GRAPH-01, GRAPH-02, and GRAPH-03 are complete. Phase 63 is ready for `/gsd:verify-work` or human UAT; the v6.6 roadmap can move to Phase 64 planning.

---

_Phase: 63-relationship-graph-route-bidirectional-traversal_
_Completed: 2026-06-12_
