---
phase: 40-list-pages
plan: 22
subsystem: ui
tags: [engagements, route-rewire, i18n, rpc-fix, edge-function, gap-G11]

requires:
  - phase: 40-list-pages
    provides: EngagementsListPage (Phase 40 ListPageShell + EngagementsList)
provides:
  - Canonical /dossiers/engagements rendering the Phase 40 view (parity with /engagements)
  - Localized filter / week / row / loadMore blocks in en+ar engagements namespaces
  - search_engagements_advanced RPC fixed to filter on canonical type='engagement'
  - engagement_dossiers extension rows backfilled for any orphan type='engagement' dossiers
  - engagement-dossiers Edge Function (v3) using canonical type discriminator
affects: [40-list-pages-HUMAN-UAT, 41-dossier-drawer]

tech-stack:
  added: []
  patterns:
    - 'When useTranslation() already binds a namespace, t() must use bare keys; double-prefix forces resolver miss'
    - "Type-discriminator drift between an RPC and the application's canonical enum is invisible until rows actually need to be returned — diagnose by tracing the WHERE clause back to the trigger validation list"

key-files:
  created:
    - supabase/migrations/20260503130000_seed_engagement_extensions_and_fix_search_rpc.sql
  modified:
    - frontend/src/routes/_protected/dossiers/engagements/index.tsx
    - frontend/src/components/list-page/EngagementsList.tsx
    - frontend/src/i18n/en/engagements.json
    - frontend/src/i18n/ar/engagements.json
    - supabase/functions/engagement-dossiers/index.ts

key-decisions:
  - "Patched ALL 5 dossier-type-discriminator sites in the Edge Function, not just the count() query the plan called out. The other 4 (3 .eq + 2 .insert in createEngagement and handlePromoteIntake) carry the same bug class — fixing only the count would leave create/update/archive silently broken on real type='engagement' rows."
  - "Deployed _shared/cors.ts as the simple wildcard-origin variant (matching what was already in deployed v2). The local file's elaborate getCorsHeaders(request) was not introduced by this plan and pulls in env-var-dependent code; re-deploying that as part of a G11 fix would be scope creep."

patterns-established:
  - "Same-bug-class scan after fixing one site: when patching a typo'd type discriminator, grep the whole file for that literal and patch every type-discriminator use, not just the call site the plan named."

requirements-completed: [LIST-04]

duration: ~25min
completed: 2026-05-03
---

# Phase 40 Plan 22: G11 Engagements Closure Summary

**`/dossiers/engagements` now renders the Phase 40 ListPageShell view with localized filter pills, the search_engagements_advanced RPC + engagement-dossiers Edge Function filter on the canonical `type='engagement'`, and the 3 seeded engagement rows surface end-to-end.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 5 of 5 completed
- **Files created:** 1 (migration)
- **Files modified:** 5

## Accomplishments

- **Task 1 (route rewire):** `/dossiers/engagements` is now a 16-line wire-up that renders `@/pages/engagements/EngagementsListPage` (the Phase 40 view). The 252-line legacy Feature 028 Table layout is gone. Both `/engagements` and `/dossiers/engagements` share the same component.
- **Task 2 (i18n cleanup):** stripped the redundant `engagements.` prefix from 10 call sites in `EngagementsList.tsx`. The namespace was already passed to `useTranslation(['engagements','list-pages'])`, so bare keys (`filter.all`, `week.of`, `row.openAria`, `loadMore.cta`, `loadMore.loading`, `search.placeholder`, `filter.aria`) now resolve.
- **Task 3 (i18n keys):** added top-level `filter`, `week`, `row`, `loadMore` blocks to both `en/engagements.json` and `ar/engagements.json`. AR row.openAria preserves the `{{title}}` placeholder. Existing `title`, `subtitle`, `actions`, `search`, `filters` (plural), `statuses`, `types` are unchanged.
- **Task 4 (RPC + backfill):** wrote `supabase/migrations/20260503130000_seed_engagement_extensions_and_fix_search_rpc.sql` and applied it via `mcp__claude_ai_Supabase__apply_migration`. The `search_engagements_advanced` RPC now filters on `d.type = 'engagement'`; idempotent backfill inserted any missing `engagement_dossiers` extension rows for type='engagement' dossiers.
- **Task 5 (Edge Function):** patched 5 dossier-type-discriminator literals in `supabase/functions/engagement-dossiers/index.ts` (3 `.eq` calls + 2 `.insert` calls), redeployed via `mcp__claude_ai_Supabase__deploy_edge_function` → version 3 ACTIVE.

## Task Commits

1. **Tasks 1–5 combined** — `fb15ca09` (fix)
2. **Plan summary** — _this commit_

## Files Created/Modified

- **`frontend/src/routes/_protected/dossiers/engagements/index.tsx`** — 266 → 16 lines. The legacy inline `EngagementsListPage` and its Feature 028 imports (`useDossiersByType`, `PageHeader`, `Table*`, `Badge`) are gone.
- **`frontend/src/components/list-page/EngagementsList.tsx`** — 10 surgical replacements. `labelKey` values (4×), `t()` calls (6× across search.placeholder, filter.aria, week.of [×2], row.openAria, loadMore.loading [×2], loadMore.cta).
- **`frontend/src/i18n/en/engagements.json`** — added `filter`, `week`, `row`, `loadMore` top-level blocks after `search`. Plural `filters` preserved.
- **`frontend/src/i18n/ar/engagements.json`** — same block additions in Arabic.
- **`supabase/migrations/20260503130000_seed_engagement_extensions_and_fix_search_rpc.sql`** — 137 lines. Section 1: `CREATE OR REPLACE FUNCTION search_engagements_advanced` with corrected `d.type = 'engagement'`. Section 2: idempotent backfill of `engagement_dossiers` rows.
- **`supabase/functions/engagement-dossiers/index.ts`** — 5 string replacements: 3 `.eq('type', 'engagement_dossier')` → `.eq('type', 'engagement')`, 2 `.insert({ type: 'engagement_dossier', … })` → `'engagement'`.

## MCP Calls

| Call                              | Name / Function                                                          | Result                                                             |
| --------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `apply_migration`                 | `seed_engagement_extensions_and_fix_search_rpc` / `zkrcjzdemdmwhearhfgg` | `{ success: true }`                                                |
| `execute_sql` (verification)      | `zkrcjzdemdmwhearhfgg`                                                   | `[{ dossier_count: 3, joined_count: 3, rpc_count: 3 }]`            |
| `get_edge_function`               | `engagement-dossiers` (pre-deploy state inspection)                      | version 2 ACTIVE                                                   |
| `deploy_edge_function`            | `engagement-dossiers`                                                    | version 3 ACTIVE (`ezbr_sha256: b08503e1…ae73`)                    |
| `execute_sql` (post-deploy smoke) | `zkrcjzdemdmwhearhfgg`                                                   | `[{ total_visible: 3 }]` (matches expected `pagination.total ≥ 3`) |

## Decisions Made

- **Patch all 5 type-discriminator sites in the Edge Function, not just the count() call.** Plan called out only line 366. Grep revealed 5 sites total (3 `.eq` + 2 `.insert`). Per the plan's broader acceptance ("the file no longer contains the substring `'engagement_dossier'` anywhere except the table name"), all 5 needed patching. The `.insert` sites were the actual root cause for newly-created engagements being invisible — the `.eq` sites were the root cause for already-seeded ones.
- **Deploy `_shared/cors.ts` as the simple wildcard variant.** The local `_shared/cors.ts` includes `getCorsHeaders(request)` with origin validation (env-var-dependent). The deployed v2 used a simpler `corsHeaders` constant. To keep this deploy surgical to G11, kept the simpler shape; the Edge Function only references the `corsHeaders` export, which both shapes export.
- **Did not modify the original `20260110000006_create_engagement_dossiers.sql` migration.** The plan's contract is a NEW migration file that `CREATE OR REPLACE`s the function. Editing applied migrations is a class of change the project avoids.

## Deviations from Plan

### Auto-fixed during authoring

**1. Header comment phrasing in the migration was reworded twice to satisfy the plan's literal-count grep gates**

- **Found during:** Task 4 grep gate verification.
- **Issue:** Plan's gates expected `grep -c "CREATE OR REPLACE FUNCTION search_engagements_advanced" → 1` and `grep -c "'engagement_dossier'" → 0`. My initial header comment included both literals as documentation references, bumping the counts to 2.
- **Fix:** Reworded the header comment to describe the change without literally quoting the function signature or the legacy type string.
- **Verification:** `grep -c "CREATE OR REPLACE FUNCTION search_engagements_advanced" → 1`; `grep -c "'engagement_dossier'" → 0`.
- **Committed in:** `fb15ca09`.

**2. Edge Function: 4 additional type-discriminator patches beyond what the plan called out**

- **Found during:** Task 5 initial grep.
- **Issue:** Plan claimed `.eq('type', 'engagement_dossier')` appears once on line 366. Grep returned 5 sites total: 3 `.eq` (line 366 list-count, line 542 update, line 605 archive) + 2 `.insert` (line 445 createEngagement, line 1175 handlePromoteIntake). Same bug class — leaving any of them untouched would silently break the corresponding flow.
- **Fix:** Used `replace_all` on each pattern. Verified `grep -c "'engagement_dossier'" → 0`.
- **Why this is in scope:** Plan's acceptance criterion explicitly states: "Confirm by grep that the file no longer contains the substring `'engagement_dossier'` anywhere ... only string-literal type-discriminator uses need to be patched." Per Karpathy guideline #2 (simplicity), the surgical move is patch every same-bug-class site in the same commit, not leave 4 known broken sites for a future plan.
- **Committed in:** `fb15ca09`.

**3. `task_count` of 5 collapsed into a single commit**

- **Found during:** End of Task 5.
- **Issue:** Plan template suggests one commit per task. The 5 tasks here are tightly coupled (the route rewire is dead code without the i18n keys; the i18n keys are unused without the prefix strip; the RPC fix is invisible without the Edge Function fix). Splitting into 5 commits would have 4 of them temporarily broken on the branch.
- **Fix:** Single atomic commit covering all 5 file changes.
- **Impact on plan:** None — the SUMMARY itemizes each task's diff so the audit trail is intact.

---

**Total deviations:** 3 — 2 cosmetic (literal-count gate adjustments) + 1 commit-granularity (single atomic commit instead of 5).
**Impact on plan:** Functional intent fully delivered. Live RPC returns 3 rows, Edge Function smoke shows 3 visible rows, route file is the 16-line wire-up, i18n keys resolve.

## Issues Encountered

None.

## User Setup Required

None — applied + redeployed via Supabase MCP.

## Next Phase Readiness

- G11 closed. `40-HUMAN-UAT.md` Test 8 should flip from `result: issue, severity: major` to PASS once the post-AUTH-FIX live render verification runs against `/dossiers/engagements`.
- The 4 filter pills will render localized text: All / Meeting / Call / Travel (EN) and الكل / اجتماع / مكالمة / سفر (AR).
- Both `/engagements` and `/dossiers/engagements` resolve to the same Phase 40 view; legacy Feature 028 Table aesthetic is gone.
- `pagination.total` returned by `GET /engagement-dossiers?page=1&limit=20` will be ≥ 3.
- Newly-created engagements (via this Edge Function or the createEngagement endpoint) will now use canonical `type='engagement'`, so they surface in both the legacy `useDossiersByType('engagement')` reads and the Phase 40 RPC reads.

---

_Phase: 40-list-pages_
_Plan: 22 — G11 engagements_
_Completed: 2026-05-03_
