# Phase 66: Overview Error Contract & Timeline Cross-Links - Research

**Researched:** 2026-06-13
**Domain:** TanStack Query error propagation + per-card error states (React 19 / Supabase PostgREST) + TanStack Router route-contract for timeline cross-links
**Confidence:** HIGH (every claim below is line-verified against the working tree at commit `dda49065` unless tagged otherwise)

## Summary

OVRERR-01 has one root cause with a wide blast radius: `frontend/src/services/dossier-overview.service.ts` swallows Supabase errors in 6 of its 7 section fetchers (only `fetchDossierCore` throws), returning empty section shapes that 15 of the 16 overview cards then render as trustworthy "No data available" / zero states — because every card destructures only `{ data, isLoading }` from its hook and ignores `isError`. The fix has two mandatory layers: (1) make every fetcher throw (fail-the-query), and (2) make every card consume `isError` and render an inline error line. The codebase already contains the exact precedent for both layers: Phase 65's workspace tabs (`error.tabLoad` in `TasksTab`/`OverviewTab`/`CalendarTab`) for the card layer, and `fetchDossierCore`/`useDossierPositionLinks`/`MoUStatusCard`'s `queryFn` for the throw layer. Crucially, several independent hooks (`useDossierActivityTimeline`, `useDossierPositionLinks`, `MoUStatusCard`'s inline query) **already throw correctly** — their cards just ignore the error flag, so the card layer is needed even where the service layer is already honest.

OVRERR-02 is a small, fully-enumerated surface: `navigation_url` is built in exactly ONE place in the entire codebase — `supabase/functions/unified-timeline/index.ts` — and emits two unmounted targets (`/calendar/${id}` at L178, `/mous/${id}` at L360) plus two degraded ones (`?tab=interactions`/`?tab=intelligence` query params that the per-type `$id` index route silently drops during its redirect to `/overview`). The components that trust `navigation_url` (`components/timeline/TimelineEventCard.tsx`, `EnhancedVerticalTimelineCard.tsx`) are today reachable **only through unrouted legacy components** (`*DossierDetail`, `EngagementDetailPage` — Phase 67's route-or-delete surface), while the one ROUTED consumer of `metadata.navigation_url` (`ActivityList` on `/activity`) already has an R-05 URL-safety guard that checks scheme/origin but NOT route-mountedness. All other live timeline surfaces (`ActivityTimelineItem` on the 7 routed `/timeline` tabs, Dashboard `TimelineEventCard`) navigate only to mounted routes — verified against the full `routeTree.gen.ts` fullPath inventory.

**Primary recommendation:** Adopt **fail-the-query** as the section error contract (throw `DossierOverviewAPIError` in all 7 fetchers, keep `Promise.all`), render per-card inline error states from `useQuery.isError` mirroring the Phase 65 `error.tabLoad` precedent, fix the 4 `navigation_url` emissions at the edge source, and add a shared mounted-route guard (allowlist) to the 3 `navigation_url` consumers as defense-in-depth.

## Project Constraints (from CLAUDE.md)

| Directive                                                                                   | Impact on this phase                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All colors via design tokens; no raw hex, no Tailwind color literals                        | Error lines use `text-destructive` (theme-mapped, on-brand per project memory) or `text-[var(--danger)]` (Phase 65 workspace precedent). Both exist; match the file's local convention |
| Logical properties only (`ms-*`, `ps-*`, `text-start`); `dir` from `i18n.language === 'ar'` | New error lines must be `text-center`/`text-start`; cards already set `dir`                                                                                                            |
| No emoji, no marketing voice, sentence case                                                 | Error copy mirrors phase-65: "Failed to load this section. Check your connection and try again."                                                                                       |
| Explicit return types, no `any`, strict-boolean-expressions, no floating promises           | `error != null` not truthiness; `(): React.ReactElement` on card components (existing convention)                                                                                      |
| ESLint per-directory filename case                                                          | `components/**` PascalCase, `lib/**` kebab (e.g. new `lib/timeline-navigation.ts`), `hooks/**` camelCase                                                                               |
| GSD workflow entry points required for edits                                                | Planner output is consumed by `/gsd:execute-phase`                                                                                                                                     |
| Supabase migrations/edge deploys via Supabase MCP                                           | `unified-timeline` redeploy (if edge fix chosen) is an orchestrator MCP/CLI action, not repo code                                                                                      |
| Testing: Vitest unit + Playwright E2E, TDD, AAA pattern                                     | Forced-error tests must be RED first against current swallow behavior                                                                                                                  |
| Backwards compatibility: no regressions; bilingual AR/EN after every change                 | New i18n keys in BOTH `en/dossier.json` and `ar/dossier.json`; AR live pass required                                                                                                   |
| Pre-commit runs `pnpm build` but does NOT block on failure (project memory)                 | Verify build output manually per commit                                                                                                                                                |
| Bundle Size Check is a REQUIRED CI gate                                                     | Text-only + small guard module — negligible, but verify zero `exceeded` lines                                                                                                          |

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                                                                                                                                                                | Research Support                                                                                                                                                                                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OVRERR-01 | Overview section fetchers no longer swallow Supabase errors — a forced section error renders an explicit error state, never a trustworthy-looking zero/empty state (decide the contract, then apply across overview cards) | §Error Contract Decision (fail-the-query recommended, alternatives weighed); §Fetcher Inventory (all 7 fetchers, exact swallow lines); §Card Inventory (all 16 cards + drawer + generic overview, per-card `isError` status); §Code Examples 1–3; Phase 65 precedent cited at exact lines |
| OVRERR-02 | No timeline "View details" navigates to an unmounted route (`/calendar/$id`, `/mous/$id`): suppress the affordance, route to filtered list pages, or add detail routes                                                     | §Timeline Cross-Link Inventory (10-row disposition table, every emitter + consumer line-verified against the complete `routeTree.gen.ts` fullPath list); §Mounted-Route Guard pattern; §Code Examples 4–5                                                                                 |

</phase_requirements>

## Architectural Responsibility Map

| Capability              | Primary Tier                                                  | Secondary Tier                                                 | Rationale                                                                                                                       |
| ----------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Section error detection | Frontend service layer (`dossier-overview.service.ts` throws) | —                                                              | PostgREST/edge errors already arrive at the client; no backend change needed to detect them                                     |
| Section error rendering | Frontend cards (per-card `useQuery.isError` branch)           | Generic `DossierOverview.tsx` full-page error (already exists) | Mirrors Phase 65 per-tab inline-error precedent; per-card granularity falls out of the existing per-card query architecture     |
| Timeline link emission  | API/Edge (`unified-timeline` builds `navigation_url`)         | —                                                              | Server is the single source of cross-link URLs (verified: only builder in repo)                                                 |
| Mounted-route guard     | Frontend lib (shared allowlist helper)                        | Consumers: 2 timeline cards + `ActivityList`                   | The route table is a frontend artifact; server-emitted URLs must not be trusted blindly (extends existing R-05 guard)           |
| Edge redeploy           | Orchestrator via Supabase MCP/CLI                             | —                                                              | Per user-global instruction; repo code change alone does not update staging                                                     |
| i18n keys               | Frontend static bundles (`src/i18n/{en,ar}/dossier.json`)     | —                                                              | `dossier` namespace already registered; project memory: unregistered namespaces silently fall back to English in BOTH languages |

## Standard Stack

**No new libraries.** Everything in this phase is existing-stack reuse:

### Core (already installed, versions verified in `frontend/node_modules` / `package.json`)

| Library/Surface                       | Version             | Purpose                                                                                                                            | Why Standard                                                                                                                                                                     |
| ------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @tanstack/react-query                 | ^5.100.14           | `isError`/`error` per-card state; retry/backoff built-in                                                                           | Already drives every overview card query                                                                                                                                         |
| @tanstack/react-router                | 1.170.8 (installed) | Route mountedness ground truth (`routeTree.gen.ts`); `useMatchRoute` precedent exists in `DossierTabNav.tsx`, `WorkspaceShell.tsx` | All navigation in scope is TanStack `navigate`/`Link`                                                                                                                            |
| supabase-js client (`@/lib/supabase`) | in repo             | PostgREST `{ data, error }` tuples — the throw point                                                                               | All 6 swallowing fetchers use it                                                                                                                                                 |
| Vitest + @testing-library/react       | 4.1.7               | Forced-error unit tests via `vi.mock` of hooks/client                                                                              | Established pattern: `SharedRecentActivityCard.test.tsx` (`vi.hoisted` mutable mock state), `ActivityList.test.tsx` (guard rejection matrix)                                     |
| Phase 65 error precedent              | shipped             | Copy + render shape for error lines                                                                                                | `pages/engagements/workspace/TasksTab.tsx:157-166` (`role="alert"`, `t('error.tabLoad')`), `OverviewTab.tsx:208-216`, `CalendarTab.tsx` (`entriesError !== null` → `errorLabel`) |

### Alternatives Considered

| Instead of                          | Could Use                                                                                                    | Tradeoff                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fail-the-query (throw in fetchers)  | Section-level error metadata (`Promise.allSettled` + per-section `{ status: 'ok' \| 'error' \| 'skipped' }`) | Metadata keeps healthy sections rendering within one multi-section query, but: (a) every one of 18 consumers must check per-section status; (b) `DossierOverviewResponse` type churn is large; (c) skipped-section placeholders must become a third state so stats don't count failures as zeros; (d) per-card queries already give per-card granularity, so the extra machinery buys little. See §Error Contract Decision |
| Fail-the-query                      | React error boundaries per card                                                                              | Boundaries only catch render-time throws, not query errors (`useQuery` never throws into render without `throwOnError`); `DossierErrorBoundary` already exists for the render-crash class (260605-r92). Wrong tool here                                                                                                                                                                                                    |
| Static mounted-prefix allowlist     | `router.matchRoute`/`useMatchRoute` dynamic check                                                            | `useMatchRoute` has in-repo precedent, but matching an arbitrary string path against the route tree (vs a typed `to`) needs `router.matchRoutes(pathname)` whose public API stability across 1.x is unverified offline `[ASSUMED]`. A static allowlist is trivially testable and the dead-link set is tiny; prefer allowlist, note matchRoute as a follow-up                                                               |
| Fixing `navigation_url` at the edge | Adding `/calendar/$id` + `/mous/$id` detail routes                                                           | New detail routes are real feature work (data fetching, design contract, i18n) — explicitly one of the requirement's allowed options but disproportionate: `mous=0` rows on staging and calendar rows have no detail-page design. Route-to-list/suppress is the honest minimal contract                                                                                                                                    |

**Installation:** none.

## Package Legitimacy Audit

No new packages are installed by this phase. slopcheck not run — nothing to check. All recommended APIs ship with already-installed dependencies (verified versions above via `node_modules` and `package.json`).

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram — overview error flow (current vs target)

```
                       ┌──────────────────────────────────────────────────────────┐
                       │ 7 Overview tabs (routes /dossiers/{type}/$id/overview)    │
                       │ + engagement workspace OverviewTab (phase-65 compliant)   │
                       └──────────────┬───────────────────────────────────────────┘
                                      │ renders per-type card set
        ┌──────────────┬──────────────┼──────────────────┬────────────────────┐
        ▼              ▼              ▼                  ▼                    ▼
  14 cards via    SharedRecent   MoUStatusCard    PositionTracker      EO Office/Committees
  useDossierOverview  ActivityCard  (inline useQuery) (useDossierPosition  (useElectedOfficial,
  (per-card           (useDossier-   throws ✓          Links) throws ✓      express apiGet)
  includeSections     ActivityTime-  card ignores ✗    card ignores ✗       card ignores ✗
  variants)           line) throws ✓
        │             card ignores ✗
        ▼
  fetchDossierOverview (Promise.all)
        │
        ├─ fetchDossierCore ────────── dossiers ──────────────── THROWS ✓ (only honest fetcher)
        ├─ fetchRelatedDossiers ────── dossier_relationships ×2 ─ console.error → empty ✗ (L362-364)
        ├─ fetchDocuments ──────────── position_dossier_links,
        │                              mous ×2 ────────────────── console.error → partial ✗ (L475-477, L503-505)
        ├─ fetchWorkItems ──────────── work_item_dossiers, tasks,
        │                              users, aa_commitments ×2,
        │                              intake_tickets ──────────── error NOT destructured ✗ (L607, L633, L643, L686, L695, L736)
        ├─ fetchCalendarEvents ─────── calendar_entries ────────── error NOT destructured ✗ (L807)
        ├─ fetchKeyContacts ────────── key_contacts ────────────── error NOT destructured ✗ (L860)
        └─ fetchActivityTimeline ───── dossier-unified-activity
                                       edge fn ─────────────────── try/catch → empty section ✗ (L908-916)

  TARGET: every branch throws → query rejects → card isError → inline error line
  (cards keep rendering cached data when a background refetch fails — TanStack default)
```

### System Architecture Diagram — timeline cross-link flow

```
  supabase/functions/unified-timeline/index.ts      ← ONLY navigation_url builder in repo
    ├─ calendar rows  → /calendar/${event.id}   L178  ✗ UNMOUNTED (routes: /calendar, /calendar/new)
    ├─ interaction    → dossierPath?tab=interactions L239  ~ path mounted; $id index redirect DROPS ?tab
    ├─ intelligence   → dossierPath?tab=intelligence L306  ~ same
    └─ mou rows       → /mous/${mou.id}          L360  ✗ UNMOUNTED (route: /mous list only)
          │
          ▼ metadata.navigation_url
  useUnifiedTimeline ─→ {Country,Person,Organization,Engagement}Timeline + InteractiveTimeline
          │                    (ALL consumed only by UNROUTED *DossierDetail / EngagementDetailPage —
          │                     Phase 67 PERENG-03 route-or-delete surface; verified: zero imports in routes/)
          ▼
  TimelineEventCard L117-119, L327-337 ("View details" gated on navigation_url presence, trusts it)
  EnhancedVerticalTimelineCard L194-198, L421-431 (same)

  SEPARATE plane (all targets MOUNTED — verified, no change needed):
  dossier-activity-timeline edge → DossierActivityTimeline (routed /dossiers/{7 types}/$id/timeline)
    → ActivityTimelineItem L127-138: task→/tasks/$id ✓, commitment→/commitments?id= (drawer deep-link,
      verified routes/_protected/commitments.tsx L41-57 reads ?id) ✓, intake→/intake/tickets/$id ✓
  Dashboard TimelineZone → pages/Dashboard/components/TimelineEventCard.tsx L56 → /engagements/$id ✓
  /activity → ActivityList L107: R-05 guard (scheme/origin) but NO mountedness check; in practice nothing
    writes navigation_url into activity_stream metadata (repo-wide grep: only unified-timeline builds it)
  No-affordance rows (already compliant with "suppress"): ActivityTimelineSection (generic overview),
    SharedRecentActivityCard, DossierDrawer RecentActivitySection
```

### Error Contract Decision (OVRERR-01)

The roadmap requires deciding between three contracts. Evidence-based recommendation:

**Recommended: Contract A — fail-the-query.**

1. Every fetcher in `dossier-overview.service.ts` throws `DossierOverviewAPIError` on a PostgREST/edge error (the class already exists at L252-264 with a `status` field that the global retry predicate in `lib/query-client.ts` L29-40 understands).
2. `fetchDossierOverview` keeps `Promise.all` — first rejection rejects the whole query for that card's section-variant.
3. Cards render an inline error line from `isError` (Phase 65 shape).
4. Independent hooks that already throw (`useDossierActivityTimeline`, `useDossierPositionLinks`, `MoUStatusCard` inline query, `useElectedOfficial`) need only the card-layer change.

**Why A over B (section-level error metadata):** the per-card query architecture already provides section granularity — each card requests only the sections it renders (verified `includeSections` per card, table below), so a failing section only errors the cards that genuinely depend on it. Contract B's `Promise.allSettled` + per-section status would additionally need: a third `skipped` state (skipped sections currently return the same empty shapes as real empties — L982-1043), stats recomputation rules for failed sections, and 18 consumer updates to check metadata — for marginal granularity gain within multi-section cards. Contract B is the right call only if the team wants `SharedSummaryStatsCard` to render 3 good stats + 1 errored stat; the requirement ("a forced section fetch error renders an explicit error state on that card") is satisfied by A.

**Why A over C (explicit unknown state):** C is B with different naming; same churn.

**Harmonization with Phase 65:** the workspace tabs already implement exactly Contract A semantics per reader (each reader exposes `error`, the tab renders `t('error.tabLoad')` with `role="alert"` in `var(--danger)`). The overview cards adopt the same render shape with a `dossier`-namespace key, keeping one visual language for "failed, not empty".

**Stale-data rule:** TanStack v5 keeps previously-successful `data` when a background refetch fails (`data` defined AND `isError` true). Render the error state only when `data === undefined && isError`; otherwise keep rendering data (stale-while-error, library default). Never blank out good cached data.

### Fetcher Inventory (OVRERR-01 — service layer)

All in `frontend/src/services/dossier-overview.service.ts` (1,137 lines):

| Fetcher                      | Reads                                                                                                                   | Today                                                                                 | Fix                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------- |
| `fetchDossierCore` L291      | `dossiers`                                                                                                              | **throws** `DossierOverviewAPIError` ✓                                                | none                        |
| `fetchRelatedDossiers` L327  | `dossier_relationships` ×2 (out/in)                                                                                     | `console.error(outError \|\| inError)` then builds from `(outgoing \|\| [])` L362-370 | throw if either errored     |
| `fetchDocuments` L464        | `position_dossier_links`, `mous` ×2                                                                                     | `console.error` ×2, continues with partials L475-477, L503-505                        | throw on any error          |
| `fetchWorkItems` L605        | `work_item_dossiers`, `tasks`, `users`, `aa_commitments` ×2, `intake_tickets`                                           | **error never destructured** on any of 6 queries (L607, L633, L643, L686, L695, L736) | destructure + throw on each |
| `fetchCalendarEvents` L794   | `calendar_entries`                                                                                                      | error never destructured L807                                                         | throw                       |
| `fetchKeyContacts` L859      | `key_contacts`                                                                                                          | error never destructured L860                                                         | throw                       |
| `fetchActivityTimeline` L892 | `dossier-unified-activity` edge (via `fetchUnifiedDossierActivities`, which throws `UnifiedActivityAPIError` correctly) | `try/catch` → returns empty section L908-916                                          | delete the catch            |

Note: `fetchDocuments` contains two **deliberate** permanent-empty groups with verified-schema comments (briefs L517-523, attachments L525-527). Those are honest empties, not swallows — leave them.

### Card Inventory (OVRERR-01 — card layer)

Card → hook → `includeSections` → current error consumption. All cards in `frontend/src/pages/dossiers/overview-cards/`:

| Card                                           | Hook                                              | Sections / source                                                | Consumes isError?                                                                                                                    | Used by (type tabs) |
| ---------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| SharedSummaryStatsCard                         | useDossierOverview                                | related_dossiers, work_items, calendar_events, activity_timeline | ✗ — `!data \|\| allZero` → "No data available" L79-82                                                                                | all 7               |
| SharedRecentActivityCard                       | useDossierActivityTimeline (throws ✓)             | dossier-activity-timeline edge                                   | ✗ — empty → "No recent activity"                                                                                                     | all 7               |
| DossierAnalyticsCard (`components/analytics/`) | useAnalyticsForDossier (wraps useDossierOverview) | stats                                                            | **✓ handles isError L57** — but service swallow means isError never fires for section failures; fixed for free by the service change | all 7               |
| BilateralSummaryCard                           | useDossierOverview                                | related_dossiers, documents, calendar_events                     | ✗                                                                                                                                    | country             |
| KeyContactsCard                                | useDossierOverview                                | key_contacts                                                     | ✗                                                                                                                                    | country             |
| EngagementsByStageCard                         | useDossierOverview                                | related_dossiers                                                 | ✗                                                                                                                                    | country             |
| KeyRepresentativesCard                         | useDossierOverview                                | key_contacts                                                     | ✗                                                                                                                                    | organization        |
| MembershipStructureCard                        | useDossierOverview                                | related_dossiers                                                 | ✗                                                                                                                                    | organization        |
| MoUStatusCard                                  | own useQuery (throws ✓) L40-49                    | `mous`                                                           | ✗                                                                                                                                    | organization        |
| ForumMetadataCard                              | useDossierOverview                                | related_dossiers                                                 | ✗                                                                                                                                    | forum               |
| ForumSessionsCard                              | useDossierOverview                                | related_dossiers, calendar_events                                | ✗                                                                                                                                    | forum               |
| ConnectedAnchorsCard                           | useDossierOverview                                | related_dossiers                                                 | ✗                                                                                                                                    | topic               |
| PositionTrackerCard                            | useDossierPositionLinks (throws ✓ L169)           | position_dossier_links                                           | ✗ (hook exposes `error`, card reads only `positions, isLoading`)                                                                     | topic               |
| DeliverablesTrackerCard                        | useDossierOverview                                | work_items                                                       | ✗                                                                                                                                    | working_group       |
| MeetingScheduleCard                            | useDossierOverview                                | calendar_events                                                  | ✗                                                                                                                                    | working_group       |
| MemberListCard                                 | useDossierOverview                                | related_dossiers                                                 | ✗                                                                                                                                    | working_group       |
| PersonMetadataCard                             | useDossierOverview                                | related_dossiers, calendar_events                                | ✗                                                                                                                                    | person              |
| EngagementHistoryCard                          | useDossierOverview                                | related_dossiers, calendar_events                                | ✗                                                                                                                                    | person              |
| ElectedOfficialOfficeCard                      | useElectedOfficial (express `apiGet`)             | persons ext                                                      | ✗ — error renders all-dash rows                                                                                                      | elected_official    |
| ElectedOfficialCommitteesCard                  | useElectedOfficial                                | committee_assignments JSONB                                      | ✗                                                                                                                                    | elected_official    |

Non-card consumers of `useDossierOverview`:

| Consumer                                                                                     | Today                                                                                                                                            | Fix                            |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `components/dossier/dossier-overview/DossierOverview.tsx` (generic `/dossiers/$id/overview`) | **✓ full-page isError + retry L227-235** — but renders raw `error?.message` (information disclosure; see §Security)                              | swap to generic localized copy |
| `components/dossier/DossierDrawer/DossierDrawer.tsx` L42-47 + `DrawerHead.tsx` L54           | ✗ — `data-loading={overviewLoading \|\| !overview}` L94 → **permanent skeleton** on error (a third dishonest mode: not fake-empty, fake-loading) | add error branch               |
| `useDossierExport` (json path)                                                               | reads cache only                                                                                                                                 | none                           |

Engagement (8th type) overview = workspace `OverviewTab`, already phase-65-compliant (`kanbanError != null` → `error.tabLoad` L210-212). Do not rework; only ensure copy/key harmony.

### Timeline Cross-Link Inventory (OVRERR-02)

Mounted-route ground truth: full `fullPath` extraction from `frontend/src/routeTree.gen.ts` (this session). Relevant facts: `/calendar`, `/calendar/new` mounted — **`/calendar/$id` NOT**; `/mous` mounted — **`/mous/$id` NOT**; `/tasks/$id`, `/intake/tickets/$id`, `/positions/$id`, `/engagements/$engagementId`, `/after-actions/$afterActionId`, `/dossiers/{type}/$id[/...]`, `/dossiers/organizations/$id/mous` all mounted. Unmounted navigations land on the root `notFoundComponent` ("Page not found", `routes/__root.tsx:70`).

| #   | Emitter                                                                                                               | Target                                                  | Mounted?                                                                                                                                                                    | Reaching surface today                                                                                                                                                        | Disposition (recommended)                                                                                                                                                                                                                                                                               |
| --- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `unified-timeline` L178 (calendar rows)                                                                               | `/calendar/${event.id}`                                 | ✗                                                                                                                                                                           | TimelineEventCard + EnhancedVerticalTimelineCard, via unrouted `*DossierDetail`/`EngagementDetailPage` only; **live-confirmed emission** on staging (R17: 6 calendar_entries) | Emit `null` (suppress affordance). `/calendar` has no event-focus/date search param (verified `routes/_protected/calendar.tsx` — no `validateSearch`), so a list link adds nothing. Alternative: emit `/calendar` if product prefers a destination over suppression — flag as the one open product call |
| 2   | `unified-timeline` L360 (mou rows)                                                                                    | `/mous/${mou.id}`                                       | ✗                                                                                                                                                                           | same (code-proven; staging `mous=0` so data-dormant)                                                                                                                          | Emit `/mous` (mounted list). Optional refinement: when `dossier_type === 'organization'`, emit `${getDossierDetailPath(...)}/mous` (mounted org tab)                                                                                                                                                    |
| 3   | `unified-timeline` L239 (interaction rows)                                                                            | `${getDossierDetailPath(...)}?tab=interactions`         | path ✓, `?tab` dead — `$id` index `beforeLoad` redirect to `/overview` drops search (verified `dossiers/countries/$id/index.tsx`); no `interactions` tab exists on any type | Emit bare `getDossierDetailPath(dossier_id, dossier_type)`                                                                                                                    |
| 4   | `unified-timeline` L306 (intelligence rows)                                                                           | `...?tab=intelligence`                                  | same                                                                                                                                                                        | same                                                                                                                                                                          | Emit bare dossier path (or `${path}/timeline`)                                                                                                                                                                                                                                                          |
| 5   | `ActivityTimelineItem.tsx` L127-138                                                                                   | `/tasks/$id`, `/commitments?id=`, `/intake/tickets/$id` | ✓ all (commitments `?id` deep-links the drawer — `routes/_protected/commitments.tsx` L41-57, L129-132)                                                                      | ROUTED: all 7 `/dossiers/{type}/$id/timeline` tabs                                                                                                                            | No change (verified good)                                                                                                                                                                                                                                                                               |
| 6   | `pages/Dashboard/components/TimelineEventCard.tsx` L56                                                                | `/engagements/${engagement_id}`                         | ✓                                                                                                                                                                           | ROUTED: Dashboard TimelineZone                                                                                                                                                | No change                                                                                                                                                                                                                                                                                               |
| 7   | `ActivityList.tsx` L107 (`/activity`)                                                                                 | `metadata.navigation_url` from `activity_stream`        | guard checks URL safety only, not mountedness; repo-wide: nothing writes `navigation_url` into `activity_stream` → rows non-interactive in practice                         | ROUTED: `/activity`                                                                                                                                                           | Extend R-05 guard with the mounted-prefix allowlist (defense-in-depth; cheap)                                                                                                                                                                                                                           |
| 8   | `components/timeline/TimelineEventCard.tsx` L117-119, L327-337; `EnhancedVerticalTimelineCard.tsx` L194-198, L421-431 | trusts `navigation_url` verbatim                        | n/a                                                                                                                                                                         | unrouted chain (Phase 67 surface)                                                                                                                                             | Apply the same guard before rendering "View details" — REQUIRED even though unrouted today, because Phase 67 routes-or-deletes the parents and the requirement is absolute                                                                                                                              |
| 9   | `ActivityTimelineSection.tsx` (generic overview), `SharedRecentActivityCard`, `DossierDrawer/RecentActivitySection`   | no links                                                | n/a                                                                                                                                                                         | routed                                                                                                                                                                        | Already compliant ("suppress" branch of the requirement). Optional relationship-metadata enrichment (R17's 4th option) is out of minimal scope — record as deferred                                                                                                                                     |
| 10  | i18n affordance keys                                                                                                  | `timeline.view_details` etc.                            | —                                                                                                                                                                           | —                                                                                                                                                                             | unchanged; suppression removes the button, no new keys needed for OVRERR-02                                                                                                                                                                                                                             |

**Edge-fix + guard, not either/or:** fixing emissions at `unified-timeline` (4 small line changes + redeploy via Supabase MCP) makes the data honest for Phase 67's routed future; the frontend guard makes the requirement hold even if the deployed edge lags the repo (deploy drift is a documented project failure mode). The guard alone technically satisfies OVRERR-02; do both.

## Don't Hand-Roll

| Problem                           | Don't Build                     | Use Instead                                                                                                                                           | Why                                                                                     |
| --------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Retry/backoff for failed sections | custom retry loops in fetchers  | TanStack Query global retry (`lib/query-client.ts` L29-44: 3× exp backoff, 4xx fail-fast via `error.status`)                                          | Already tuned; `DossierOverviewAPIError.status` plugs straight into it                  |
| Per-card error catching           | React error boundaries per card | `useQuery.isError` render branch                                                                                                                      | Boundaries don't see query errors; `DossierErrorBoundary` already covers render crashes |
| URL safety for `navigation_url`   | new sanitizer                   | extend the existing R-05/WR-01 guard in `ActivityList.tsx` L100-115 (relative-only, `//` and `\` rejection) — extract to the shared lib helper        | The guard is field-tested with a rejection-matrix test (`ActivityList.test.tsx` L205)   |
| Per-type dossier paths            | string concat                   | `@/lib/dossier-routes` `getDossierDetailPath()` (frontend) / `_shared/dossier-routes.ts` (edge)                                                       | Existing mirrored helpers; R17-02 already burned one hand-rolled path                   |
| Forced-error test harness         | msw (not installed)             | `vi.mock` of hooks (card tests) and of `@/lib/supabase` (service tests) — `vi.hoisted` mutable-state pattern from `SharedRecentActivityCard.test.tsx` | Established repo pattern; msw would be a new dependency for no gain                     |

## Common Pitfalls

### Pitfall 1: RLS denial is NOT an error — forced-error simulation must be network-level

**What goes wrong:** Simulating a section failure by revoking access/RLS returns **empty 200 rows** for SELECTs, not an error — it exercises the _empty_ path, not the _failed_ path (and risks staging state).
**How to avoid:** Force errors client-side: unit tests mock the client to return `{ data: null, error: {...} }`; live verification blocks the request URL at the browser (CDP `Network.setBlockedURLs` — see §Validation Architecture). Never simulate via RLS/grants.
**Warning signs:** a "forced error" that renders the empty state in a test that was expected to be RED.

### Pitfall 2: TanStack keeps stale data on refetch failure

**What goes wrong:** Showing the error state whenever `isError` is true blanks out good cached data after a transient background-refetch failure.
**How to avoid:** Error state only when `data === undefined && isError`. Document this in the card pattern so all 16+ cards behave identically.

### Pitfall 3: Default retry delays the error state ~7s

**What goes wrong:** Thrown errors without a 4xx `status` retry 3× with exponential backoff before `isError` flips — live verification looks "stuck on skeleton" for several seconds; unit tests hang.
**How to avoid:** (a) tests: fresh `QueryClient` with `retry: false` (or mock the hook, bypassing the client); (b) consider mapping PostgREST schema-error codes (`42703`, `42P01`, `PGRST...`) to `status: 400` in `DossierOverviewAPIError` so structural failures fail fast while transient network errors still retry. Keep simple — default `500` is acceptable if documented.

### Pitfall 4: Shared query variants couple cards

**What goes wrong:** Cards with identical `includeSections` arrays share one cache entry (`detailWithOptions` sorts sections); a relationships failure errors every card whose variant includes `related_dossiers` (up to 4 cards on one tab). UAT may misread this as "unrelated cards broke".
**How to avoid:** This is correct honest behavior — those cards genuinely depend on the failed data. Pre-record the expected blast radius per blocked table in the live-verification matrix (see §Validation Architecture) so the verifier doesn't flag it.

### Pitfall 5: The drawer's third dishonest mode (permanent skeleton)

**What goes wrong:** `DossierDrawer` keys its body on `overviewLoading || !overview` — after fail-the-query lands, errors hold the drawer in skeleton forever (neither empty nor error). Easy to miss because the phase framing says "empty vs failed".
**How to avoid:** Drawer + `DrawerHead` get explicit error branches in the same pass.

### Pitfall 6: `invoke<T>` casts are unvalidated (project memory)

**What goes wrong:** `useDossierActivityTimeline` uses `supabase.functions.invoke<DossierActivityTimelineResponse>` — the cast is a lie if the edge payload drifts (this exact class caused the 260605-r92 RangeError crash). Any new error-metadata fields read off edge responses must be runtime-guarded or the contract must stay fail-the-query (which reads nothing new).
**How to avoid:** Contract A reads no new payload fields. If the planner adds any, guard them (`typeof`/nullish checks) like `formatActivityTime` does.

### Pitfall 7: i18n — colon-form namespaces, static bundles, EN+AR parity

**What goes wrong:** dot-form `t('dossier.overview.x')` leaks raw keys (project memory); keys added to EN only look fine in EN and break AR; unregistered namespaces silently anglicize.
**How to avoid:** Use the `dossier` namespace (already registered) with keys under the existing `overview` object; add to BOTH `i18n/en/dossier.json` and `i18n/ar/dossier.json`; include a key-parity assertion in tests (Phase 65 precedent). Candidate reusable key exists (`collapsible.error` "Failed to load section" at en/dossier.json L558) but it lives under a detail-section parent — a dedicated `overview.sectionError` is cleaner.

### Pitfall 8: `routeTree.gen.ts` regeneration (Phase 65 fence)

**What goes wrong:** Only relevant if the planner chooses the "add detail routes" disposition (not recommended): the 65-01 executor reverted its own regenerated tree and shipped a 404.
**How to avoid:** Recommended dispositions add **zero routes** — no regeneration involved. If routes are added anyway: never `git checkout -- routeTree.gen.ts`; verify the route id survives in the committed tree.

### Pitfall 9: Raw `error.message` in UI

**What goes wrong:** `DossierOverview.tsx` L234 and `DossierActivityTimeline.tsx` L176 render `error?.message` — PostgREST messages leak column/table names to users and are English-only.
**How to avoid:** New card error states render generic localized copy only; detail goes to `console.error`. Fix the two existing raw-message renders while touching them.

### Pitfall 10: Deployed edge vs repo drift

**What goes wrong:** Editing `unified-timeline/index.ts` in-repo changes nothing on staging until deployed; conversely the deployed version may already differ from repo.
**How to avoid:** Orchestrator deploys via Supabase MCP/CLI after the edge change and live-verifies the emitted `navigation_url` values (probe in §Open Questions).

## Code Examples

All examples follow repo conventions (no semicolons, single quotes, explicit return types).

### 1. Fetcher throw shape (service layer, mirrors `fetchDossierCore`)

```typescript
// dossier-overview.service.ts — fetchRelatedDossiers (pattern for all 6 swallowing fetchers)
if (outError || inError) {
  const cause = outError ?? inError
  throw new DossierOverviewAPIError(
    'Failed to fetch related dossiers',
    500, // or 400 for schema-error codes — see Pitfall 3
    'RELATED_DOSSIERS_FETCH_FAILED',
    cause?.message,
  )
}
```

### 2. Card error branch (mirrors Phase 65 `TasksTab.tsx:157-166`)

```tsx
// Any overview card, after the isLoading branch.
// Error only when there is no cached data to show (Pitfall 2).
const { data, isLoading, isError } = useDossierOverview(dossierId, { includeSections: [...] })

if (isError && data === null) {
  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className="text-base font-semibold leading-tight text-start mb-4">{title}</h3>
      <p role="alert" className="text-destructive text-sm text-center py-8">
        {t('overview.sectionError', {
          defaultValue: 'Failed to load this section. Check your connection and try again.',
        })}
      </p>
    </div>
  )
}
```

Note: `useDossierOverview` returns `data: query.data || null` — cards compare against `null`, not `undefined`.

### 3. i18n keys (both files; sentence case, no marketing voice)

```jsonc
// frontend/src/i18n/en/dossier.json → inside the existing top-level "overview" object
"sectionError": "Failed to load this section. Check your connection and try again."
// frontend/src/i18n/ar/dossier.json
"sectionError": "تعذر تحميل هذا القسم. تحقق من اتصالك وحاول مرة أخرى."
```

### 4. Mounted-route guard (new `frontend/src/lib/timeline-navigation.ts`, kebab-case per lint)

```typescript
// Source of truth: routeTree.gen.ts fullPath inventory (verified 2026-06-13).
// R-05/WR-01 safety rules folded in from components/activity-feed/ActivityList.tsx.
const MOUNTED_DETAIL_PREFIXES: readonly RegExp[] = [
  /^\/tasks\/[^/]+$/,
  /^\/intake\/tickets\/[^/]+$/,
  /^\/positions\/[^/]+/,
  /^\/engagements\/[^/]+/,
  /^\/after-actions\/[^/]+/,
  /^\/dossiers\/(countries|organizations|forums|topics|working_groups|persons|elected-officials|engagements)\/[^/]+/,
  /^\/commitments(\?|$)/,
  /^\/mous$/,
  /^\/calendar$/,
  /^\/activity$/,
]

export function resolveTimelineNavUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw === '') return null
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return null // R-05 + WR-01
  const pathOnly = raw.split('?')[0] ?? raw
  return MOUNTED_DETAIL_PREFIXES.some((re) => re.test(pathOnly) || re.test(raw)) ? raw : null
}
```

Consumers (`TimelineEventCard`, `EnhancedVerticalTimelineCard`, `ActivityList`) gate both the click handler and the "View details" render on `resolveTimelineNavUrl(event.metadata.navigation_url) !== null`. Alternative: `useMatchRoute` (precedent: `DossierTabNav.tsx`) — dynamic but its arbitrary-string matching API is unverified offline; allowlist is the safe v1.

### 5. Edge emission fix (`supabase/functions/unified-timeline/index.ts`)

```typescript
// L178  calendar rows — no mounted detail route, no list focus param → suppress
navigation_url: null,            // (or '/calendar' if product prefers a destination)
// L239  interaction rows — $id index redirect drops search params; no 'interactions' tab exists
navigation_url: getDossierDetailPath(dossier_id, dossier_type),
// L306  intelligence rows — same
navigation_url: getDossierDetailPath(dossier_id, dossier_type),
// L360  mou rows — /mous list is mounted
navigation_url: '/mous',
```

### 6. Forced-error unit test pattern (vi.hoisted, from `SharedRecentActivityCard.test.tsx`)

```typescript
const mockState = vi.hoisted(() => ({ isError: false, data: null as DossierOverviewResponse | null }))
vi.mock('@/hooks/useDossierOverview', () => ({
  useDossierOverview: () => ({
    data: mockState.data, isLoading: false, isError: mockState.isError, error: null, refetch: vi.fn(),
  }),
}))
// RED against current code:
it('renders an explicit error state on section failure, never the empty state', () => {
  mockState.isError = true
  render(<SharedSummaryStatsCard dossierId="d1" />)
  expect(screen.getByRole('alert')).toHaveTextContent(/failed to load this section/i)
  expect(screen.queryByText(/no data available/i)).not.toBeInTheDocument()
})
```

Service-level: `vi.mock('@/lib/supabase')` with a chainable builder whose terminal resolves `{ data: null, error: { message: 'forced', code: '42703' } }` for the targeted table; assert `fetchDossierOverview(...)` rejects with `DossierOverviewAPIError`.

## State of the Art

| Old Approach (this repo, pre-66)                                          | Current Approach (post-65 precedent)                                                                 | When Changed                          | Impact                                                                     |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| Fetchers `console.error` + empty shapes; cards `{ data, isLoading }` only | Readers throw; surfaces render `role="alert"` error lines (`error.tabLoad`, `calendar.entriesError`) | Phase 65 (workspace tabs), 2026-06-12 | Phase 66 extends the same contract to the 7 dossier overview tabs + drawer |
| Edge-emitted `navigation_url` trusted verbatim                            | R-05/WR-01 URL-safety guard (`ActivityList`, security pass 260610-fkn)                               | 2026-06-10                            | Phase 66 adds the missing mountedness dimension to the guard               |

**Deprecated/outdated in scope:** `hooks/useDossierActivityTimeline.ts` is a deprecated barrel re-exporting `@/domains/dossiers` — keep imports working, don't add logic there.

## Assumptions Log

| #   | Claim                                                                                                                                          | Section                  | Risk if Wrong                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `router.matchRoutes(pathname)` / arbitrary-string `matchRoute` is not a stable public API in TanStack Router 1.170.x                           | Alternatives             | Low — allowlist recommendation stands regardless; if matchRoute is stable, it's a later refactor                                                                                         |
| A2  | `useElectedOfficial`'s `apiGet` (express baseUrl) throws on non-2xx                                                                            | Card Inventory           | Low — if it resolves an error envelope instead, the EO cards need the throw added in the hook; verify during execution (`domains/elected-officials/hooks/useElectedOfficials.ts` L56-69) |
| A3  | Deployed `unified-timeline` on staging matches the repo source (R17 live evidence is 2 days old)                                               | Timeline Inventory       | Low — Open Question probe Q2 confirms before/after deploy                                                                                                                                |
| A4  | Nothing besides `unified-timeline` ever wrote `navigation_url` into `activity_stream.metadata` (repo grep covers code, not historical DB rows) | Timeline Inventory row 7 | Low — guard makes stale DB rows safe either way; probe Q3 quantifies                                                                                                                     |

## Open Questions (RESOLVED — see §Open Question Answers below)

1. **Calendar-row disposition: suppress vs link-to-list** — `/calendar` has no event-focus param, so the honest choices are `null` (no affordance) or a bare `/calendar` link. Recommendation: suppress. Needs a one-line product call at plan time (Claude's discretion acceptable).
2. **Staging probe (orchestrator, Supabase MCP):** confirm deployed `unified-timeline` emissions before and after redeploy —
   `SELECT count(*) FROM calendar_entries;` / `SELECT count(*) FROM mous WHERE deleted_at IS NULL;` (R17 baseline: 6 / 0 — tells which dead links are live-reproducible), and after deploy hit `GET /functions/v1/unified-timeline?dossier_id=<indonesia>` asserting no `/calendar/<uuid>` or `/mous/<uuid>` URLs remain.
3. **Staging probe:** `SELECT count(*) FROM activity_stream WHERE metadata ? 'navigation_url';` — quantifies whether `/activity` rows ever carry nav URLs (expected 0; nonzero strengthens the guard-on-ActivityList task).
4. **Relationship-metadata enrichment** (R17's 4th option: make overview activity rows for relationships/positions navigable to the counterpart dossier) — real feature work needing `source/target_dossier_type` added to the `get_unified_dossier_activities` RPC payload (R17 evidence: migration emits ids but not types). Recommend: defer, record in backlog; suppression already satisfies OVRERR-02 for these rows.

## Environment Availability

| Dependency                                           | Required By                    | Available                                                       | Version      | Fallback                                                            |
| ---------------------------------------------------- | ------------------------------ | --------------------------------------------------------------- | ------------ | ------------------------------------------------------------------- |
| Node.js                                              | gates, build                   | ✓                                                               | v26.0.0      | —                                                                   |
| pnpm                                                 | monorepo                       | ✓                                                               | 10.29.1      | —                                                                   |
| Vitest                                               | unit tests                     | ✓                                                               | 4.1.7 (repo) | —                                                                   |
| Supabase MCP/CLI                                     | `unified-timeline` redeploy    | orchestrator-side (researcher had no access this session)       | —            | frontend guard alone still satisfies OVRERR-02 if deploy is blocked |
| agent-browser / browser-harness                      | live forced-error verification | per project CLAUDE.md / user skill (not exercised this session) | —            | manual Chrome DevTools request blocking                             |
| Staging (`zkrcjzdemdmwhearhfgg`) + `.env.test` creds | live verification              | per phases 62–65 precedent                                      | —            | —                                                                   |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| Framework          | Vitest 4.1.7 + @testing-library/react (jsdom)                                                              |
| Config file        | `frontend/vitest.config.ts` (existing)                                                                     |
| Quick run command  | `cd frontend && pnpm exec vitest run src/pages/dossiers/overview-cards/__tests__/ src/services/__tests__/` |
| Full suite command | `cd frontend && pnpm exec vitest run` (1,313 pass / 0 fail across 174 files at Phase 65 close)             |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                                                                                                                                                                                                                                                                                     | Test Type                                                        | Automated Command                                                                   | File Exists?                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| OVRERR-01 | Each section fetcher rejects (`DossierOverviewAPIError`) when its PostgREST query errors; `fetchDossierOverview` rejects; `fetchActivityTimeline` no longer catches                                                                                                                                                          | unit (mock `@/lib/supabase` chainable per-table)                 | `pnpm exec vitest run src/services/__tests__/dossier-overview.service.test.ts`      | ❌ Wave 0                                                         |
| OVRERR-01 | Forced `isError` (+ `data === null`) renders `role="alert"` with `overview.sectionError`, and the empty-state copy is ABSENT — for `SharedSummaryStatsCard`, `SharedRecentActivityCard`, `MoUStatusCard`, `PositionTrackerCard` (one per hook family) plus a parameterized sweep of the remaining `useDossierOverview` cards | unit (vi.hoisted hook mock, RED-first)                           | `pnpm exec vitest run src/pages/dossiers/overview-cards/__tests__/`                 | ❌ Wave 0 (extend existing `SharedRecentActivityCard.test.tsx`)   |
| OVRERR-01 | Drawer: error → error branch, not permanent `data-loading` skeleton                                                                                                                                                                                                                                                          | unit (extend `DossierDrawer.test.tsx`, exists)                   | `pnpm exec vitest run 'src/components/dossier/DossierDrawer/__tests__/'`            | ✅ extend                                                         |
| OVRERR-01 | `overview.sectionError` key parity EN↔AR                                                                                                                                                                                                                                                                                     | unit (JSON parity assertion)                                     | same card-test file                                                                 | ❌ Wave 0                                                         |
| OVRERR-02 | `resolveTimelineNavUrl`: rejects `/calendar/<uuid>`, `/mous/<uuid>`, `//evil`, `\`-variants, absolute URLs; accepts `/tasks/x`, `/mous`, `/commitments?id=x`, per-type dossier paths                                                                                                                                         | unit                                                             | `pnpm exec vitest run src/lib/__tests__/timeline-navigation.test.ts`                | ❌ Wave 0                                                         |
| OVRERR-02 | `TimelineEventCard`/`EnhancedVerticalTimelineCard`: unmountable `navigation_url` → no "View details" button rendered; mounted one → button present                                                                                                                                                                           | unit (RTL render)                                                | `pnpm exec vitest run src/components/timeline/__tests__/`                           | ❌ Wave 0                                                         |
| OVRERR-02 | `ActivityList` guard extension keeps its existing rejection matrix green + new mountedness cases                                                                                                                                                                                                                             | unit (extend existing)                                           | `pnpm exec vitest run src/components/activity-feed/__tests__/ActivityList.test.tsx` | ✅ extend                                                         |
| OVRERR-02 | Edge emissions: no `/calendar/$id`, `/mous/$id`, or `?tab=` URLs in `unified-timeline` output                                                                                                                                                                                                                                | live probe (Open Question Q2) — edge has no unit harness in repo | manual/MCP at phase gate                                                            | manual-only (justified: Deno edge fns are not in the Vitest tree) |

### Sampling Rate

- **Per task commit:** quick run of the touched test directories (above)
- **Per wave merge:** `pnpm exec vitest run` + `pnpm type-check`
- **Phase gate:** full suite green + type-check exit 0 + `pnpm exec size-limit` zero `exceeded` + live protocol below before `/gsd:verify-work`

### Live forced-error protocol (mirrors Phase 65's live-gate pattern)

Safest forced-error method — **client-side network blocking** (zero staging mutation, instantly reversible, and the ONLY method that actually exercises the error path — RLS/grant tampering returns empty 200s, Pitfall 1):

1. Local dev `:5173` → staging, login per `.env.test`.
2. Block PostgREST URL pattern for one section table — via browser-harness raw CDP: `cdp("Network.enable")` then `cdp("Network.setBlockedURLs", urls=["*rest/v1/dossier_relationships*"])` (browser-harness supports raw CDP per its skill doc); or manually: DevTools → Network → right-click request → "Block request URL".
3. Reload `/dossiers/countries/<china-id>/overview` (China has data; Saudi is genuinely empty — use both to verify empty-vs-failed are now visually distinct).
4. **Expected matrix:** cards whose variant includes `related_dossiers` (SummaryStats, Bilateral, EngagementsByStage on country) show the error line; `KeyContactsCard` + `MeetingSchedule`-class cards (no related_dossiers) render normally — record per Pitfall 4 so the blast radius isn't misread.
5. Unblock (`Network.setBlockedURLs` with `[]`), refetch/reload → cards recover.
6. Repeat once with `*rest/v1/calendar_entries*` and once with the `dossier-activity-timeline` function URL (covers the edge-fn path + `SharedRecentActivityCard`).
7. AR pass: switch via topbar `ع` (persists under `id.locale`), verify error copy in Arabic, `dir=rtl`, Tajawal, no overflow at 1280/1024.
8. OVRERR-02 live: after edge redeploy, fetch `unified-timeline` output per Q2; on `/activity` confirm rows without nav URLs are non-interactive (existing behavior).

### Wave 0 Gaps

- [ ] `frontend/src/services/__tests__/dossier-overview.service.test.ts` — covers OVRERR-01 service layer (no service test exists today)
- [ ] Forced-error card tests in `src/pages/dossiers/overview-cards/__tests__/` (extend `SharedRecentActivityCard.test.tsx`; add `SharedSummaryStatsCard.test.tsx` + hook-family representatives)
- [ ] `frontend/src/lib/__tests__/timeline-navigation.test.ts` — guard rejection/acceptance matrix
- [ ] `src/components/timeline/__tests__/TimelineEventCard.test.tsx` — suppression behavior
- [ ] Framework install: none

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                                                                                       |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| V2 Authentication     | no      | unchanged (Supabase Auth)                                                                                                                              |
| V3 Session Management | no      | unchanged                                                                                                                                              |
| V4 Access Control     | no      | RLS untouched (and deliberately NOT used for error simulation — Pitfall 1)                                                                             |
| V5 Input Validation   | **yes** | server-emitted `navigation_url` validated client-side: existing R-05/WR-01 relative-only guard + new mounted-route allowlist (`resolveTimelineNavUrl`) |
| V6 Cryptography       | no      | —                                                                                                                                                      |

### Known Threat Patterns for this stack

| Pattern                                                                                 | STRIDE                   | Standard Mitigation                                                                                                                                                                          |
| --------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open redirect via `metadata.navigation_url` (edge/DB-sourced URL navigated client-side) | Tampering                | R-05 guard (already shipped, tested) extended with mountedness allowlist; applied to ALL three `navigation_url` consumers, not just `ActivityList`                                           |
| Information disclosure via raw PostgREST `error.message` in UI (column/table names)     | Information Disclosure   | New error states render generic localized copy only; raw detail to `console.error`. Fix existing raw renders in `DossierOverview.tsx` L234 and `DossierActivityTimeline.tsx` L176 in passing |
| Error-state spoofing trust ("trustworthy-looking zero")                                 | Repudiation (of failure) | The phase's core fix — fail-the-query + explicit `role="alert"` states                                                                                                                       |

## Sources

### Primary (HIGH confidence — line-verified this session)

- `frontend/src/services/dossier-overview.service.ts` (full read, 1,137 lines) — all swallow sites
- `frontend/src/hooks/useDossierOverview.ts`, `frontend/src/services/unified-dossier-activity.service.ts`, `frontend/src/domains/dossiers/hooks/useDossierActivityTimeline.ts` (full reads)
- All 19 files in `frontend/src/pages/dossiers/overview-cards/` + 7 `*OverviewTab.tsx` (hook + `includeSections` + error-consumption grep, representative full reads)
- `frontend/src/routeTree.gen.ts` — complete `fullPath` extraction (mounted-route ground truth)
- `supabase/functions/unified-timeline/index.ts` (navigation_url sites) + `supabase/functions/_shared/dossier-routes.ts` (full read)
- `frontend/src/components/timeline/TimelineEventCard.tsx`, `EnhancedVerticalTimelineCard.tsx`, `components/activity-feed/ActivityList.tsx`, `components/dossier/ActivityTimelineItem.tsx`, `pages/Dashboard/components/TimelineEventCard.tsx`, `routes/_protected/commitments.tsx`, `routes/_protected/calendar.tsx`, `routes/__root.tsx`
- Phase 65 precedent: `pages/engagements/workspace/{TasksTab,OverviewTab,CalendarTab}.tsx`, `i18n/en/workspace.json`
- `frontend/src/lib/query-client.ts` (retry/stale defaults), `frontend/vitest.config.ts` era facts from 65-RESEARCH
- `reports/dossier-workflows-round17-inspection-2026-06-10.md` (R17-03 full text + live staging evidence), `reports/dossier-workflows-round9-inspection-2026-06-10.md` (R9-02)
- `.planning/phases/65-engagement-positions-tab-legacy-reconciliation/65-06-SUMMARY.md`, `65-RESEARCH.md` (Validation Architecture template)

### Secondary (MEDIUM confidence)

- Project memory entries (MEMORY.md): `invoke<T>` unvalidated; i18n static-bundle/colon-form; pre-commit non-blocking build; deploy drift; commitment drawer deep-link — each independently re-confirmed in code where load-bearing

### Tertiary (LOW confidence)

- TanStack Router arbitrary-string `matchRoute` API stability (A1) — not consulted online this session; allowlist recommendation does not depend on it

## Metadata

**Confidence breakdown:**

- Fetcher/card inventories: HIGH — exhaustive grep + reads, no sampling
- Timeline dead-link inventory: HIGH — single-emitter fact verified repo-wide; route list extracted from generated tree; corroborated by R17 live staging evidence
- Error-contract recommendation: HIGH for mechanics (all precedents in-repo); the calendar-row suppress-vs-list call is product taste (flagged Q1)
- Live forced-error protocol: HIGH for mechanism (CDP blocking is documented browser-harness capability), MEDIUM for exact staging data counts (2-day-old R17 numbers — probes Q2/Q3 refresh them)

**Research date:** 2026-06-13
**Valid until:** ~2026-07-13 for stack facts; staging row counts and deployed-edge state should be re-probed at execution start (Q2/Q3)

## Open Question Answers (orchestrator, 2026-06-13)

1. **Calendar-row disposition: SUPPRESS** (product call recorded — /calendar has no event-focus param; a bare list link is a dishonest affordance. Rows render without a View-details action.)
2. **Staging probe:** calendar_entries = 6 rows (the /calendar/<uuid> dead link IS live-reproducible — good UAT target); mous (not deleted) = 0 rows (emission fixed anyway; not live-reproducible).
3. **Staging probe:** activity_stream rows with metadata.navigation_url = 0 (guard on ActivityList is belt-and-braces, as expected).
4. **Relationship-metadata enrichment: DEFERRED** to backlog (suppression satisfies OVRERR-02; enrichment needs RPC payload changes — out of phase scope).
