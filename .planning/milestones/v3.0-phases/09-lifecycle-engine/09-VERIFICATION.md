---
phase: 09-lifecycle-engine
verified: 2026-03-30T06:30:00Z
status: human_needed
score: 13/13 must-haves verified
re_verification: false
human_verification:
  - test: "Open an engagement detail page and verify LifecycleStepperBar renders 6 stages with 'intake' highlighted"
    expected: 'Stepper bar visible below page header, above tab navigation, showing 6 colored stage buttons'
    why_human: 'Visual rendering and stage highlight state cannot be verified without a browser'
  - test: 'Click an adjacent stage (preparation) — verify immediate transition; click a non-adjacent stage (execution) — verify inline note prompt appears'
    expected: 'Adjacent click transitions immediately; non-adjacent click shows textarea + confirm/cancel below stepper'
    why_human: 'Interactive behavior and optimistic UI update require browser interaction'
  - test: "Hover a completed lifecycle stage — verify 'Entered: [date]' tooltip appears"
    expected: 'Tooltip with formatted entry date renders on hover'
    why_human: 'Tooltip visibility is a browser interaction'
  - test: 'Verify stage transition persists to database and appears in LifecycleTimeline with duration badge'
    expected: 'Transition record in lifecycle_transitions table; timeline shows entry with duration'
    why_human: 'Requires live Supabase connection and browser verification'
  - test: "Open an engagement-type intake ticket — verify 'Promote to Engagement' button visible; for a non-engagement-type ticket, verify it is absent"
    expected: "Button shows for requestType === 'engagement' and status !== 'converted' only"
    why_human: 'Conditional rendering with real data requires browser'
  - test: "Promote an intake ticket — verify modal with pre-mapped fields; fill engagement_type + category, confirm — verify redirect to new engagement at 'intake' stage"
    expected: "New engagement created, ticket status becomes 'converted', ConvertedTicketBanner appears on ticket"
    why_human: 'End-to-end flow through real API requires browser and live database'
  - test: "Open a forum dossier page — verify 'New Session' button; create a session — verify it appears in the sessions list with link to its own engagement detail"
    expected: 'Session listed on forum page, clicking it opens engagement with independent stepper'
    why_human: 'LIFE-06 end-to-end requires browser and live data'
  - test: 'Open a kanban view with work items — verify work items that have lifecycle_stage set show a stage badge'
    expected: 'Small badge with stage label (bilingual) visible on card when lifecycle_stage is non-null'
    why_human: 'Requires work items with lifecycle_stage set in database'
  - test: 'Switch UI to Arabic — verify stepper renders LTR (progress left-to-right), labels are in Arabic'
    expected: 'LtrIsolate keeps stepper LTR direction; all stage names in Arabic'
    why_human: 'RTL/LTR visual rendering requires browser'
  - test: 'Resize to mobile width — verify stepper scrolls horizontally, timeline starts collapsed'
    expected: 'Stepper has overflow-x-auto scroll at <640px; LifecycleTimeline Collapsible defaults to closed'
    why_human: 'Responsive layout requires browser viewport resize'
  - test: 'Verify the 3 SQL migrations have been applied to the Supabase staging database'
    expected: 'engagement_dossiers.lifecycle_stage column, lifecycle_transitions table, tasks.lifecycle_stage column all exist in remote DB'
    why_human: 'Migrations were created as files but SUMMARY.md notes they require manual application via supabase db push. Cannot verify remote schema without live DB access.'
---

# Phase 09: Lifecycle Engine Verification Report

**Phase Goal:** Build lifecycle engine — 6-stage engagement pipeline, transition audit trail, intake promotion, forum sessions, work item stage linking
**Verified:** 2026-03-30T06:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                                                             | Status   | Evidence                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| 1   | engagement_dossiers has lifecycle_stage column with 6-value CHECK defaulting to 'intake'                                                                          | VERIFIED | migration 1 line 5-7: `ADD COLUMN lifecycle_stage TEXT NOT NULL DEFAULT 'intake' CHECK (...)` |
| 2   | lifecycle_transitions table exists with RLS, indexes, and duration trigger                                                                                        | VERIFIED | migration 1 lines 13-99: table, 3 indexes, RLS enabled + 4 policies                           |
| 3   | engagement_dossiers has parent_forum_id column; engagement_type CHECK includes 'forum_session'                                                                    | VERIFIED | migration 2 lines 22-29: constraint drop+add + `ADD COLUMN parent_forum_id`                   |
| 4   | tasks table has optional lifecycle_stage column                                                                                                                   | VERIFIED | migration 3 lines 5-7: `ALTER TABLE tasks ADD COLUMN lifecycle_stage TEXT CHECK (...)`        |
| 5   | LifecycleStage, LifecycleTransition, LIFECYCLE_STAGES, LIFECYCLE_STAGE_LABELS, IntakePromotionRequest, ForumSessionCreateRequest exported from lifecycle.types.ts | VERIFIED | 8 exports confirmed via `grep "^export"`                                                      |
| 6   | Bilingual lifecycle i18n namespace exists in en/ar                                                                                                                | VERIFIED | `frontend/src/i18n/en/lifecycle.json` and `frontend/src/i18n/ar/lifecycle.json` exist         |
| 7   | Edge Function has handleLifecycle (GET/POST), handlePromoteIntake (POST), parent_forum_id support                                                                 | VERIFIED | index.ts lines 251-256: both handlers wired; line 320: forum_session query                    |
| 8   | 5 repository functions exported from engagements.repository.ts                                                                                                    | VERIFIED | lines 398, 412, 424, 437, 461 confirm all 5 functions                                         |
| 9   | 5 TanStack Query hooks exported from useLifecycle.ts and domain index                                                                                             | VERIFIED | hooks at lines 60, 81, 124, 161, 200; domain index re-exports all 5                           |
| 10  | LifecycleStepperBar renders 6 stages, LtrIsolate wrapped, 291 lines                                                                                               | VERIFIED | file exists at 291 lines; LtrIsolate imported line 19 and used line 176                       |
| 11  | LifecycleTimeline renders transitions, collapsible, 230 lines                                                                                                     | VERIFIED | file exists at 230 lines; LifecycleTransition typed                                           |
| 12  | IntakePromotionDialog, ForumSessionCreator, ConvertedTicketBanner created and substantive                                                                         | VERIFIED | 317, 313, 55 lines; proper props interfaces confirmed                                         |
| 13  | All lifecycle components wired into EngagementDetailPage, TicketDetail, ForumDossierDetail, UnifiedKanbanCard                                                     | VERIFIED | imports + renders confirmed in all 4 host files                                               |

**Score:** 13/13 truths verified (automated)

### Required Artifacts

| Artifact                                                                  | Expected                                                                     | Status   | Details                                                                                    |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `supabase/migrations/20260329000001_add_lifecycle_stage.sql`              | lifecycle_stage column + lifecycle_transitions + RLS + trigger               | VERIFIED | Substantive — lifecycle_stage CHECK, transitions table, 3 indexes, RLS ENABLE + 4 policies |
| `supabase/migrations/20260329000002_add_forum_session_support.sql`        | parent_forum_id + forum_session type                                         | VERIFIED | Dynamic constraint drop+add; parent_forum_id column; partial index                         |
| `supabase/migrations/20260329000003_add_work_item_lifecycle_stage.sql`    | Optional lifecycle_stage on tasks                                            | VERIFIED | Nullable column with CHECK constraint and partial index                                    |
| `frontend/src/types/lifecycle.types.ts`                                   | 8 exports including LifecycleStage, LIFECYCLE_STAGES, LIFECYCLE_STAGE_LABELS | VERIFIED | All 8 exports present                                                                      |
| `frontend/src/i18n/en/lifecycle.json`                                     | English lifecycle UI strings                                                 | VERIFIED | File exists                                                                                |
| `frontend/src/i18n/ar/lifecycle.json`                                     | Arabic lifecycle UI strings                                                  | VERIFIED | File exists                                                                                |
| `supabase/functions/engagement-dossiers/index.ts`                         | handleLifecycle, handlePromoteIntake, forum_session                          | VERIFIED | All handlers confirmed; promote-intake route wired                                         |
| `frontend/src/domains/engagements/repositories/engagements.repository.ts` | 5 lifecycle repository functions                                             | VERIFIED | All 5 functions at lines 398-461                                                           |
| `frontend/src/domains/engagements/hooks/useLifecycle.ts`                  | 5 TanStack Query hooks                                                       | VERIFIED | 212 lines; all 5 hooks at lines 60-200                                                     |
| `frontend/src/components/engagements/LifecycleStepperBar.tsx`             | CRM stepper, min 100 lines, LtrIsolate                                       | VERIFIED | 291 lines; LtrIsolate wired                                                                |
| `frontend/src/components/engagements/LifecycleTimeline.tsx`               | Timeline with durations, min 60 lines                                        | VERIFIED | 230 lines                                                                                  |
| `frontend/src/components/engagements/IntakePromotionDialog.tsx`           | Modal for intake promotion, min 80 lines                                     | VERIFIED | 317 lines; onPromote + isPending props                                                     |
| `frontend/src/components/engagements/ForumSessionCreator.tsx`             | Sheet for forum sessions, min 70 lines                                       | VERIFIED | 313 lines; onCreateSession + isPending props                                               |
| `frontend/src/components/engagements/ConvertedTicketBanner.tsx`           | Read-only converted banner, min 20 lines                                     | VERIFIED | 55 lines; convertedToId links to /dossiers/engagements/${id}                               |
| `frontend/src/pages/engagements/EngagementDetailPage.tsx`                 | Contains LifecycleStepperBar render                                          | VERIFIED | Imported line 67; rendered at line 329 and line 805                                        |
| `frontend/src/pages/TicketDetail.tsx`                                     | Contains IntakePromotionDialog + promote guard                               | VERIFIED | Imported lines 17-19; guard `requestType === 'engagement'` at lines 304, 389               |
| `frontend/src/components/dossier/ForumDossierDetail.tsx`                  | Contains ForumSessionCreator + session list                                  | VERIFIED | Imported lines 59-62; session list at line 265-269                                         |
| `frontend/src/components/unified-kanban/UnifiedKanbanCard.tsx`            | Contains lifecycle_stage badge                                               | VERIFIED | LIFECYCLE_STAGE_LABELS imported line 21; badge rendered at line 103-110                    |
| 5 test stub files                                                         | Wave 0 stubs with it.todo()                                                  | VERIFIED | All 5 files confirmed at expected paths                                                    |

### Key Link Verification

| From                        | To                             | Via                                          | Status | Details                                                           |
| --------------------------- | ------------------------------ | -------------------------------------------- | ------ | ----------------------------------------------------------------- |
| `LifecycleStepperBar.tsx`   | `lifecycle.types.ts`           | LifecycleStage, LIFECYCLE_STAGES imports     | WIRED  | Lines 22-23 confirmed                                             |
| `LifecycleStepperBar.tsx`   | `ltr-isolate.tsx`              | LtrIsolate wrapper                           | WIRED  | Import line 19; used line 176                                     |
| `LifecycleTimeline.tsx`     | `lifecycle.types.ts`           | LifecycleTransition import                   | WIRED  | Line 24 confirmed                                                 |
| `useLifecycle.ts`           | `engagements.repository.ts`    | repository function imports                  | WIRED  | Hooks call repository functions                                   |
| `engagements.repository.ts` | `engagement-dossiers/index.ts` | HTTP calls to Edge Function                  | WIRED  | Functions at lines 398-461 call Edge Function lifecycle endpoints |
| `EngagementDetailPage.tsx`  | `LifecycleStepperBar.tsx`      | import + render                              | WIRED  | Lines 67, 329                                                     |
| `EngagementDetailPage.tsx`  | `useLifecycle.ts`              | useLifecycleTransition + useLifecycleHistory | WIRED  | Lines 70-71, 92-94                                                |
| `TicketDetail.tsx`          | `IntakePromotionDialog.tsx`    | import + render                              | WIRED  | Lines 17, 390                                                     |
| `ForumDossierDetail.tsx`    | `ForumSessionCreator.tsx`      | import + render                              | WIRED  | Lines 59, 317                                                     |
| `IntakePromotionDialog.tsx` | `lifecycle.types.ts`           | IntakePromotionRequest type                  | WIRED  | Line 27                                                           |
| `ForumSessionCreator.tsx`   | `lifecycle.types.ts`           | ForumSessionCreateRequest type               | WIRED  | Line 25                                                           |
| `ConvertedTicketBanner.tsx` | intake ticket convertedToId    | prop-driven navigation                       | WIRED  | Line 22, 46                                                       |
| `UnifiedKanbanCard.tsx`     | `lifecycle.types.ts`           | LIFECYCLE_STAGE_LABELS + LifecycleStage      | WIRED  | Lines 21, 103-110                                                 |

### Data-Flow Trace (Level 4)

| Artifact                   | Data Variable                | Source                                                                                                                         | Produces Real Data                                                                            | Status  |
| -------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ------- |
| `EngagementDetailPage.tsx` | `transitions`                | `useLifecycleHistory(engagementId)` → `getLifecycleHistory()` → Edge Function GET lifecycle → `lifecycle_transitions` DB query | Yes — Edge Function queries `lifecycle_transitions` WHERE engagement_id                       | FLOWING |
| `EngagementDetailPage.tsx` | `engagement.lifecycle_stage` | `useEngagement()` → `get_engagement_full` RPC → `engagement_dossiers.*`                                                        | Yes — `ed.*` select returns lifecycle_stage column                                            | FLOWING |
| `TicketDetail.tsx`         | `ticket.convertedToId`       | Existing ticket detail query                                                                                                   | Yes — updated by promote-intake handler                                                       | FLOWING |
| `ForumDossierDetail.tsx`   | `forumSessions`              | `useForumSessions(dossier.id)` → `getForumSessions()` → Edge Function list with `parent_forum_id` filter                       | Yes — Edge Function queries engagement_dossiers WHERE parent_forum_id                         | FLOWING |
| `UnifiedKanbanCard.tsx`    | `item.lifecycle_stage`       | work item query → tasks table                                                                                                  | Yes — tasks.lifecycle_stage column added by migration 3; nullable, renders only when non-null | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED for migration application verification — migrations are local SQL files only; remote Supabase DB application cannot be confirmed programmatically without live DB access. This is flagged as a human verification item.

All frontend TypeScript artifacts pass type-checking (per SUMMARY notes from Plans 01-05: 0 new errors introduced, 1654 pre-existing errors unchanged).

### Requirements Coverage

| Requirement | Source Plan                | Description                                                     | Status    | Evidence                                                                                                                                 |
| ----------- | -------------------------- | --------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| LIFE-01     | 09-01                      | Engagements have lifecycle_stage with 6 stages                  | SATISFIED | Migration 1 adds column; lifecycle.types.ts defines type; EngagementDetailPage renders stepper                                           |
| LIFE-02     | 09-01, 09-02, 09-03, 09-05 | User can transition between stages; system suggests next        | SATISFIED | POST /lifecycle endpoint; useLifecycleTransition hook; LifecycleStepperBar with next-suggestion chip; wired to EngagementDetailPage      |
| LIFE-03     | 09-01, 09-02, 09-03        | User can skip stages or move backward — flexible                | SATISFIED | Edge Function: no directional validation; stepper allows any-to-any click; non-adjacent shows note prompt only                           |
| LIFE-04     | 09-01, 09-02, 09-04, 09-05 | User can promote intake request to engagement at 'intake' stage | SATISFIED | handlePromoteIntake in Edge Function; usePromoteIntake hook; IntakePromotionDialog; guard in TicketDetail (requestType === 'engagement') |
| LIFE-05     | 09-01, 09-05               | Work items can optionally reference lifecycle_stage             | SATISFIED | migration 3 adds nullable column to tasks; UnifiedKanbanCard renders badge when non-null                                                 |
| LIFE-06     | 09-01, 09-02, 09-04, 09-05 | Forums support recurring sessions with own lifecycle            | SATISFIED | migration 2 adds parent_forum_id + forum_session type; useForumSessions; ForumSessionCreator; ForumDossierDetail renders session list    |

All 6 LIFE requirements SATISFIED by automated evidence. No orphaned requirements found.

### Anti-Patterns Found

| File                      | Line    | Pattern                                                          | Severity | Impact                                                                                            |
| ------------------------- | ------- | ---------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `LifecycleStepperBar.tsx` | 266-267 | `placeholder=` HTML attribute (textarea placeholder, NOT a stub) | Info     | False positive — this is a legitimate i18n-driven textarea placeholder attribute, not a code stub |

No blocker anti-patterns found. No empty implementations, no hardcoded empty returns, no unimplemented handlers detected across all 5 new components.

### Human Verification Required

#### 1. Migrations Applied to Remote Supabase DB

**Test:** Run `supabase db push --linked` from the project root, or use Supabase MCP to verify column existence. Then check: `SELECT column_name FROM information_schema.columns WHERE table_name = 'engagement_dossiers' AND column_name IN ('lifecycle_stage', 'parent_forum_id')` — must return 2 rows. `SELECT tablename FROM pg_tables WHERE tablename = 'lifecycle_transitions'` — must return 1 row.
**Expected:** All 3 migrations applied; schema reflects lifecycle_stage, lifecycle_transitions, parent_forum_id, and tasks.lifecycle_stage
**Why human:** SUMMARY.md explicitly notes: "Supabase MCP tool not available in worktree session; migrations created as SQL files but not applied to remote DB." Remote DB state cannot be verified without live connection.

#### 2. Lifecycle Stepper Bar — Visual and Interactive Verification

**Test:** Navigate to any engagement detail page. Verify stepper bar renders 6 labeled stages below the page header. Click an adjacent stage — verify immediate transition. Click a non-adjacent stage — verify inline note prompt slides in below stepper.
**Expected:** Stepper visible with completed/current/upcoming visual states; transitions work correctly
**Why human:** Visual rendering and interactive behavior cannot be verified programmatically

#### 3. Stage Transition Persistence and Timeline Display

**Test:** Perform a stage transition on an engagement. Scroll to the LifecycleTimeline section. Verify the new transition appears with the "Entered" date, the duration badge showing time spent in prior stage, and optional note if provided.
**Expected:** Transition persisted to lifecycle_transitions table; timeline refreshes via TanStack Query cache invalidation
**Why human:** Requires live database and browser interaction

#### 4. Intake Promotion End-to-End Flow

**Test:** Open an engagement-type intake ticket (requestType = 'engagement', status != 'converted'). Click "Promote to Engagement". Fill engagement_type and category (required). Confirm. Verify: redirect to new engagement at 'intake' stage; return to ticket — ConvertedTicketBanner with "View Engagement" link is visible.
**Expected:** Full LIFE-04 flow works with live data
**Why human:** Multi-step flow through real API and database

#### 5. Forum Session Creation and Independent Lifecycle

**Test:** Open a forum dossier page. Click "New Session" button. Fill dates and confirm. Verify session appears in the sessions list. Click the session card — verify it opens the engagement detail page with its own independent LifecycleStepperBar starting at 'intake'.
**Expected:** LIFE-06 end-to-end: session created as child engagement, listed, independently tracked
**Why human:** Requires live database with forum dossier test data

#### 6. RTL Layout and Bilingual Rendering

**Test:** Switch the UI language to Arabic. Open an engagement detail page. Verify: stepper bar renders left-to-right (LtrIsolate preserves LTR progress direction even in RTL layout); all stage labels are in Arabic; ConvertedTicketBanner banner uses border-s (logical start edge); ForumSessionCreator sheet slides from the correct side.
**Expected:** LtrIsolate working; all Arabic labels from lifecycle.json; no RTL regressions
**Why human:** Visual RTL/LTR layout correctness requires browser

#### 7. Mobile Responsive Layout

**Test:** Resize browser to 375px width. Verify: LifecycleStepperBar has horizontal overflow scroll with snap; LifecycleTimeline Collapsible defaults to collapsed state; all touch targets are at least 44x44px.
**Expected:** Mobile-first layout per CLAUDE.md requirements
**Why human:** Responsive layout requires browser viewport manipulation

### Gaps Summary

No blocking gaps found in the code layer. All 13 observable truths verified. All 6 LIFE requirements have implementation evidence across all layers (schema, API, UI components, page integration).

The single outstanding item is **migration application to remote Supabase** — the SQL files are correct and complete, but SUMMARY.md explicitly flagged that migrations could not be applied during execution due to MCP unavailability in a worktree session. Until the migrations are applied, the backend endpoints will fail with column-not-found errors when called from the browser.

**Recommended immediate action:** Apply the 3 migrations to Supabase staging before human browser verification:

```
supabase db push --linked
```

or apply individually via Supabase MCP.

---

_Verified: 2026-03-30T06:30:00Z_
_Verifier: Claude (gsd-verifier)_
