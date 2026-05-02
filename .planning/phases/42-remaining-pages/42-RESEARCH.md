# Phase 42: remaining-pages — Research

**Researched:** 2026-05-02
**Domain:** UI reskin — Briefs / After-actions / Tasks / Activity / Settings — verbatim port of IntelDossier handoff onto existing data hooks
**Confidence:** HIGH (codebase-verified) for stack/file paths/schemas; MEDIUM for one-off mappings noted in §Open Questions

## Summary

Phase 42 reskins five existing user-facing pages onto the IntelDossier handoff anatomy. Every page already exists with shipped wiring; the work is chrome+row/card rewrites onto preserved hooks plus one infrastructure delta: a new aggregated Edge Function (`after-actions-list-all`) and TanStack Query hook (`useAfterActionsAll`) for cross-dossier After-actions listing. Data hook shapes are **already shipped, verified, and locked** (`useMyTasks`, `useContributedTasks`, `useActivityFeed`, the per-dossier `useAfterActions`). The handoff CSS classes (`.tasks-list`, `.task-row`, `.act-list`, `.act-row`, `.settings-nav`, `.tbl`, `.btn-primary`) are documented verbatim in `frontend/design-system/inteldossier_handoff_design/src/app.css` but only Phase 40's list-page subset has been ported into the live `frontend/src/index.css` — the 5-page-specific selectors must be ported in Wave 0.

**Primary recommendation:** Lock the **3-wave structure** from Phase 38/40/41 precedent: (W0) infra = Edge Function + hook + i18n + handoff CSS port + Skeleton + Phase 37 `<Icon/>` set, (W1) 5 page reskins parallel, (W2) gates = 10 visual baselines + axe-core + size-limit + Playwright E2E. Address two **blockers below** before W1 begins.

---

## Blockers (must resolve before Wave 1)

> Both are addressable in Wave 0 — they are surfaced here so the planner does not assume they exist.

### Blocker 1 — Phase 37 `<Icon/>` set is NOT shipped

`frontend/src/components/signature-visuals/index.ts` (read in this session) exports only `GlobeLoader / FullscreenLoader / GlobeSpinner / DossierGlyph / Sparkline / Donut / globeLoaderSignal`. **No `Icon` component, no 38-glyph stroked icon set.** The handoff `inteldossier_handoff_design/src/icons.jsx` (38 glyphs) was never ported into a runtime React component. CONTEXT.md's `<canonical_refs>` and `<reusable assets>` claim "Phase 37 `<Icon/>` set provides `plus / check / link / file / alert / chat / dot / chevron-right / cog / sparkle / bell / shield / lock / people`" — that claim is incorrect for the current codebase. `[VERIFIED: Read index.ts]`

**Impact on PAGE-01..05:**

- PAGE-01 Briefs: needs `+` for "New brief" CTA glyph in `.page-head`
- PAGE-02 After-actions: needs `chevron-right` + `.icon-flip` for row-end
- PAGE-03 Tasks: needs `+` for "New task", `check` for done state SVG
- PAGE-04 Activity: needs `check / link / file / alert / chat / dot` for the 6-event icon map (D-14)
- PAGE-05 Settings: needs `cog / palette / bell / shield / lock / accessibility / lock-open / user / settings2` for the 7 settings nav glyphs

**Resolution options (planner picks one):**

1. **(Recommended)** Wave 0 ships a minimal `<Icon name="..."/>` component in `frontend/src/components/signature-visuals/Icon.tsx` (verbatim port of the subset of `inteldossier_handoff_design/src/icons.jsx` glyphs needed by the 5 pages — ~14 glyphs). 1 plan, ~50 LOC + a handful of `<svg>` paths. Adds `Icon` to the signature-visuals barrel.
2. Continue using `lucide-react` for these 5 pages this phase (already installed; CONTEXT.md says lucide migration deferred to Phase 43). Visual fidelity is identical for stroked outline glyphs at 14–20px. **Caveat:** UI-SPEC §Component-inventory line `Icon library | Phase 37 <Icon/> set ... lucide-react legacy migration deferred to Phase 43` suggests CONTEXT.md/UI-SPEC assumed the set exists; using lucide is a deviation from the UI-SPEC's own statement.

`[ASSUMED]` Resolution 1 is the lower-risk path for visual parity. Recommend Wave 0 plan-00 ships `Icon.tsx` so all five pages reference `<Icon name="..."/>` per UI-SPEC. **User confirmation needed.**

### Blocker 2 — `after-actions-list-all` data shape requires JOINs the per-dossier function does NOT do

`supabase/functions/after-actions-list/index.ts` (read line 64-83 in this session) selects:

```ts
.from('after_action_records')
.select(`*, decisions (*), commitments:aa_commitments (*), risks:aa_risks (*), follow_up_actions:aa_follow_up_actions (*)`)
.eq('dossier_id', dossierId)
```

It returns `decisions[]` and `commitments[]` arrays (counted client-side) but **does NOT return the engagement title or the dossier name**. The handoff `.tbl` columns require: Engagement title (500-weight) / Date (mono) / Dossier chip / Decisions count / Commitments count. Engagement title and Dossier name are not currently in the response. `[VERIFIED: Read index.ts]`

**Resolution:** the new `after-actions-list-all` Edge Function adds two joins:

```ts
.select(`
  *,
  engagement:engagements!inner (id, title_en, title_ar, engagement_date),
  dossier:dossiers!inner (id, name_en, name_ar),
  decisions (id),
  commitments:aa_commitments (id),
  risks:aa_risks (id),
  follow_up_actions:aa_follow_up_actions (id)
`, { count: 'exact' })
.eq('publication_status', 'published')  -- D-02 default
```

We do NOT need full nested decision/commitment payloads on a list endpoint — selecting `(id)` returns array length sufficient for chip counts and avoids over-fetching. **Mirror existing `dossierId` validation, status filter validation, limit/offset pagination, and RLS pattern verbatim**.

The frontend hook then renders:

- `row.engagement.title_{en|ar}` → Engagement column
- `row.created_at` (or `row.engagement.engagement_date`) → Date column — **researcher recommends `engagement_date` so the table reflects when the engagement happened, not when the after-action was filed**
- `row.dossier.name_{en|ar}` → Dossier chip
- `row.decisions.length` → Decisions count
- `row.commitments.length` → Commitments count

`[ASSUMED]` Engagement.title_en/title_ar exist on the engagements table (the dashboard's WeekAhead widget consumes them per Phase 38). **Verify in Wave 0 plan that `engagements` table has `title_en/title_ar/engagement_date` columns** — if absent, fall back to the alternative columns the dashboard already proved exist. **User confirmation deferred — this is a Wave-0-implementer's verification task, not a planning blocker.**

---

## Phase Requirements

| ID      | Description                                                                                                                    | Research Support                                                                                                                                                                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PAGE-01 | Briefs page as responsive card grid (`auto-fill, minmax(320px, 1fr)`) with status chip + page count + serif title + author/due | §Briefs schema lookup → status mapping is lossless given `is_published` + `published_date` only; status chip mapping confirmed lossy-acceptable per D-06; page count fallback documented                                                                                |
| PAGE-02 | After-actions table — engagement / date / dossier chip / decisions count / commitments count                                   | §Blocker 2 → new `after-actions-list-all` Edge Function with 2 joins; existing handoff `.tbl` CSS available verbatim from `inteldossier_handoff_design/src/app.css:261-265`                                                                                             |
| PAGE-03 | Tasks ("My desk") card list — checkbox + glyph + title+subtitle + priority chip + due                                          | §Tasks priority enum → unified work-item type lock to `low/medium/high/urgent`; DB enum is wider (`critical/normal` exist but not used by tasks API); `useUpdateTask` already shipped at `frontend/src/hooks/useTasks.ts:209` for done-toggle                           |
| PAGE-04 | Activity timeline — `time · icon · who action what in where` with `where` in accent-ink                                        | §Activity event_type → real enum is `action_type` (not `event_type`) with 15 values; D-14 reduces to 6 mapped icons + fallback `dot`; data shape in `ActivityItem` provides `actor_name / description_en/ar / entity_name_en/ar / related_entity_name_en/ar / metadata` |
| PAGE-05 | Settings two-column (240px nav + content card with edit-row)                                                                   | §Settings sections → 9 sections shipped (not 7); D-09 ships 7-section list; need re-mapping: drop `email-digest` and `integrations` from default nav OR keep all 9 (planner choice — see §Open Questions)                                                               |

---

## Project Constraints (from CLAUDE.md)

These directives are non-negotiable. Any plan that contradicts them must be rejected by plan-check:

- **Tokens-only color**: every color resolves through `var(--*)` or `@theme`-mapped Tailwind utilities (`bg-bg`, `text-ink`, etc.). No raw hex. No `text-blue-500` family literals.
- **Borders**: `1px solid var(--line)` only. **No card shadows** (drawer-only via `--shadow-lg`).
- **No gradients on surfaces**.
- **Buttons**: `.btn-primary` / `.btn-ghost` from prototype only — no new variants.
- **Row heights**: density-aware via `var(--row-h)`.
- **Radii**: `var(--radius-sm/--radius/--radius-lg)` (Bureau = 8/12/16). No hard-coded px.
- **No emoji in user-visible copy**.
- **No marketing voice**. Banned: "Discover", "Easily", "Unleash", exclamation marks, first-person plural ("we"). Sentence case.
- **Dates**: `Tue 28 Apr` (day-first, no comma). Times: `14:30 GST`. SLA: `T-3` / `T+2`.
- **RTL Rules** (from CLAUDE.md global RTL section):
  - Logical properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `inset-inline-*`, `border-inline-*`, `border-block-*`, `text-start`, `text-end`, `rounded-s-*`, `rounded-e-*`).
  - **NEVER use `textAlign: "right"`** — `forceRTL` flips it to physical LEFT. Use `writingDirection: "rtl"` (RN) or just `text-start` (web).
  - **No manual `.reverse()`** on arrays.
  - Directional icons flip via `scaleX(-1)` (handoff `.icon-flip`).
- **Touch targets**: ≥44×44px on every interactive element; for desktop above 768px the density tokens drive sizing.
- **HeroUI v3 / Radix only** (`@heroui/react@3.0.3` + `@radix-ui/react-dialog` already vendored). **Banned**: Aceternity UI, Kibo UI, shadcn/ui defaults.
- **Work-item terminology** (CLAUDE.md): use `assignee` (not owner/assigned-to), `deadline` (not due-date/sla-deadline), priorities `low/medium/high/urgent` (NOT `critical`), workflow stages `todo/in_progress/review/done/cancelled`. Tasks page row data → use the work-item types in `frontend/src/types/work-item.types.ts`.
- **Dossier-centric**: every work item connects to dossiers via `work_item_dossiers`; show dossier context via `<DossierContextBadge/>` or `<DossierGlyph/>`.

---

## Architectural Responsibility Map

| Capability                            | Primary Tier                      | Secondary Tier | Rationale                                                                                                                                          |
| ------------------------------------- | --------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Briefs card grid render               | Browser / Client                  | —              | Pure presentation over `useQuery` data; no SSR                                                                                                     |
| Brief generation (AI)                 | API / Backend                     | Browser        | `BriefGenerationPanel` already calls existing AI Edge Functions; UI just opens the dialog                                                          |
| After-actions cross-dossier list      | API / Backend (NEW Edge Function) | Browser        | New `after-actions-list-all` Edge Function does the JOINs + RLS gating; client renders                                                             |
| After-actions detail                  | Browser (route)                   | API            | Existing `/after-actions/$afterActionId.tsx` route reused                                                                                          |
| Tasks list (Assigned/Contributed)     | API / Backend                     | Browser        | `useMyTasks` + `useContributedTasks` already wired to `tasksAPI`                                                                                   |
| Tasks done-toggle                     | Browser (optimistic) → API        | Database       | `useUpdateTask` already shipped — optimistic mutation with cache rollback                                                                          |
| Activity feed (All/Following)         | API / Backend                     | Browser        | `useActivityFeed` + `useEntityFollow` already shipped via `activity-feed` Edge Function                                                            |
| Settings persistence                  | API / Backend                     | Browser        | Existing `react-hook-form + zod` per-section forms call `users` table directly via Supabase client                                                 |
| Settings → Appearance design controls | Browser (DesignProvider hooks)    | localStorage   | `useDesignDirection / useDensity / useHue / useMode` mutate root tokens + persist via `id.dir / id.theme / id.hue / id.density` keys (Phase 33/34) |
| 5 page chrome + handoff CSS port      | Browser                           | —              | Pure CSS + JSX rewrites; no backend                                                                                                                |

---

## Standard Stack

### Core (already vendored — verified in `frontend/package.json`)

| Library                             | Version | Purpose                                                              | Why Standard                                                         |
| ----------------------------------- | ------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `@heroui/react`                     | 3.0.3   | Modal (Briefs dialogs), Tabs (Activity/Tasks)                        | Already pinned since Phase 33-04; UI-SPEC mandates HeroUI v3 cascade |
| `@heroui/styles`                    | 3.0.3   | HeroUI v3 token bridge                                               | Companion to @heroui/react                                           |
| `@radix-ui/react-dialog`            | ^1.1.15 | Sheet fallback if HeroUI Modal can't house BriefViewer/Generator     | Already vendored                                                     |
| `@tanstack/react-query`             | ^5.x    | `useQuery`, `useInfiniteQuery`, `useMutation`                        | Existing data fetching pattern                                       |
| `@tanstack/react-router`            | ^1.x    | Route definitions, `useNavigate` for row clicks                      | Existing routing                                                     |
| `react-hook-form`                   | latest  | Settings forms (preserved D-10)                                      | Existing forms pattern                                               |
| `@hookform/resolvers/zod`           | latest  | Settings zod schemas                                                 | Already in use                                                       |
| `zod`                               | latest  | Schema validation                                                    | Already in use                                                       |
| `react-i18next`                     | latest  | Bilingual labels per namespace                                       | Existing i18n                                                        |
| `axe-core` + `@axe-core/playwright` | latest  | WCAG AA gate (Phase 38/40/41 precedent)                              | Existing test gate                                                   |
| `size-limit`                        | latest  | Bundle gate (`frontend/.size-limit.json`, current Total JS = 815 KB) | Existing test gate                                                   |
| `@playwright/test`                  | latest  | E2E + visual regression                                              | Existing test gate                                                   |

`[VERIFIED: frontend/package.json read]`

### Supporting (already shipped — reuse, do NOT rebuild)

| Component / Hook                                     | Path                                                                                                                                         | Use Case                                                                                                                                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<PageHeader/>`                                      | `frontend/src/components/layout/PageHeader.tsx`                                                                                              | All 5 pages — handoff `.page-head` chrome (33 LOC; supports `icon`, `title`, `subtitle`, `actions`)                                                               |
| `<DossierGlyph/>`                                    | `frontend/src/components/signature-visuals/DossierGlyph.tsx`                                                                                 | Tasks rows; signature is `{type: DossierType, iso?: string, name?: string, size?: number, accent?: string}` (default `size=32`, override to 18 per Tasks anatomy) |
| `<Skeleton/>`                                        | `frontend/src/components/ui/skeleton.tsx` (re-export from `heroui-skeleton.tsx`)                                                             | Per-page row/card-shape loading; existing `SkeletonText / SkeletonCard / SkeletonTable / SkeletonAvatar` available                                                |
| `useMyTasks`                                         | `frontend/src/hooks/useTasks.ts:84`                                                                                                          | Tasks Assigned tab; returns `TasksListResponse { tasks: Task[], total_count, page, page_size }`                                                                   |
| `useContributedTasks`                                | `frontend/src/hooks/useTasks.ts:97`                                                                                                          | Tasks Contributed tab                                                                                                                                             |
| `useUpdateTask`                                      | `frontend/src/hooks/useTasks.ts:209`                                                                                                         | Done-toggle optimistic mutation                                                                                                                                   |
| `useActivityFeed`                                    | `frontend/src/hooks/useActivityFeed.ts:72`                                                                                                   | Activity All tab; returns `{ activities: ActivityItem[], hasNextPage, fetchNextPage, ... }`                                                                       |
| `useEntityFollow`                                    | `frontend/src/hooks/useActivityFeed.ts:145`                                                                                                  | Following tab — `useActivityFeed({ followed_only: true })` shortcut works                                                                                         |
| `useAfterAction`                                     | `frontend/src/hooks/useAfterAction.ts:163`                                                                                                   | Per-record detail (preserved)                                                                                                                                     |
| `useAfterActions`                                    | `frontend/src/hooks/useAfterAction.ts:181`                                                                                                   | Per-dossier list (preserved) — model for new hook                                                                                                                 |
| `useDesignDirection / useDensity / useHue / useMode` | `frontend/src/design-system/hooks/`                                                                                                          | Settings → Appearance (D-11)                                                                                                                                      |
| `useWorkCreation`                                    | `frontend/src/components/work-creation/index.ts:14`                                                                                          | Tasks "New task" CTA — opens existing creation flow                                                                                                               |
| `BriefGenerationPanel`                               | `frontend/src/components/ai/BriefGenerationPanel.tsx`                                                                                        | Wrapped in Modal, triggered by "New brief" CTA                                                                                                                    |
| `BriefViewer`                                        | `frontend/src/components/ai/BriefViewer.tsx`                                                                                                 | Wrapped in Modal, triggered by Brief card click                                                                                                                   |
| `toArDigits`                                         | `frontend/src/lib/i18n/toArDigits.ts`                                                                                                        | Bilingual digit rendering                                                                                                                                         |
| All 7 settings sections                              | `frontend/src/components/settings/sections/{Profile,General,Appearance,Notifications,Security,Accessibility,DataPrivacy}SettingsSection.tsx` | Inline forms preserved (D-10)                                                                                                                                     |
| `<DossierContextBadge/>`                             | `frontend/src/components/dossier/DossierContextBadge.tsx`                                                                                    | Optional dossier hint on Tasks rows (CLAUDE.md mandate; researcher recommends DossierGlyph instead per UI-SPEC's verbatim handoff alignment)                      |

`[VERIFIED: each path read or `find` confirmed in this session]`

### NEW (must be authored in Wave 0)

| Component / File                                                                                                                                               | Path                                                                                 | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `after-actions-list-all` Edge Function                                                                                                                         | `supabase/functions/after-actions-list-all/index.ts`                                 | Mirrors `after-actions-list/index.ts` line-by-line; replaces `dossier_id` filter with engagement+dossier joins; default `publication_status='published'`; status filter override accepted per D-02. ~120 LOC.                                                                                                                                                                                                                                         |
| `useAfterActionsAll` hook                                                                                                                                      | `frontend/src/hooks/useAfterAction.ts` (append; or new file `useAfterActionsAll.ts`) | TanStack Query wrapper; cache key `['after-actions', 'all', options]` (per `<specifics>`).                                                                                                                                                                                                                                                                                                                                                            |
| `<Icon/>` set                                                                                                                                                  | `frontend/src/components/signature-visuals/Icon.tsx`                                 | See Blocker 1. ~14 glyphs ported from `inteldossier_handoff_design/src/icons.jsx`. Type: `<Icon name="check" size={16} />`.                                                                                                                                                                                                                                                                                                                           |
| Handoff CSS port                                                                                                                                               | `frontend/src/index.css` (append) or `frontend/src/styles/pages.css` (new)           | Verbatim copy of `inteldossier_handoff_design/src/app.css` selectors NOT yet ported: `.tasks-list / .task-row / .task-box / .task-title / .task-flag / .task-due / .act-list / .act-row / .act-t / .act-who / .act-what / .act-where / .settings-nav / .settings-nav.active / .settings-nav.active::before / .card-head / .card-title / .card-sub / .card-link`. Phase 40 already ported `.btn / .chip / .tbl / .icon-flip / .pill / .page* / .card`. |
| 5 i18n namespaces (or extends)                                                                                                                                 | `frontend/src/i18n/{en,ar}/`                                                         | See §i18n strategy below                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `briefs-page.json` (new), extend `activity-feed.json`, extend `settings.json`, extend `my-work.json` (or new `tasks-page.json`), new `after-actions-page.json` | `frontend/src/i18n/{en,ar}/`                                                         | Plus add imports + namespace registration in `frontend/src/i18n/index.ts`                                                                                                                                                                                                                                                                                                                                                                             |
| Playwright fixtures                                                                                                                                            | `frontend/tests/e2e/support/phase-42-fixtures.ts`                                    | Mock briefs / after-actions-all / tasks / activity / settings data per page                                                                                                                                                                                                                                                                                                                                                                           |
| Playwright specs                                                                                                                                               | 5 visual + 5 functional in `frontend/tests/e2e/`                                     | Pattern: `briefs-page-visual.spec.ts`, `briefs-page.spec.ts`, …                                                                                                                                                                                                                                                                                                                                                                                       |

### Alternatives Considered

| Instead of                                                      | Could Use                                                                             | Tradeoff                                                                                                   | Recommendation                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| New Edge Function                                               | Direct Supabase client `.from('after_action_records').select(...joins)` from the hook | Bypasses Edge Function business logic + RLS hardening; inconsistent with rest of after-action surface area | **Take CONTEXT.md D-01** — new Edge Function. Locked.                    |
| Phase 37 `<Icon/>` set                                          | Continue lucide-react in this phase                                                   | UI-SPEC contract violation but no visual regression at this size                                           | **Recommend ship `<Icon/>`** in Wave 0. See Blocker 1.                   |
| Append CSS to `index.css`                                       | New file `frontend/src/styles/pages.css` imported from `index.css`                    | Single file = simpler; multi-file = scoped review                                                          | **Append to `index.css`** matches Phase 40 precedent ("imported as ...") |
| Settings: drop `email-digest` + `integrations` from default nav | Keep all 9 sections in nav                                                            | D-09 says 7 sections; Settings codebase has 9 (verified)                                                   | See §Open Questions O-1                                                  |

**Installation:** None — all libraries already vendored. New code is in-repo only.

**Version verification:** Skipped — no new dependencies. `@heroui/react@3.0.3` confirmed in `frontend/package.json:read`.

---

## Architecture Patterns

### System Architecture Diagram

```
                              User (analyst, 1280-1400px desktop)
                                          │
                                          ▼
                ┌────────────────────────────────────────────────┐
                │ AppShell (Phase 36) — topbar + sidebar         │
                └────────────────────────────────────────────────┘
                                          │
                                          ▼
            ┌─────────┬──────────────┬──────────┬────────────┬──────────┐
            ▼         ▼              ▼          ▼            ▼          ▼
       /briefs   /after-actions   /tasks    /activity   /settings   detail routes
            │         │              │          │            │          │
            │         │              │          │            │          │
       <PageHeader> across all 5 (handoff .page-head — already shipped)  │
            │         │              │          │            │          │
            ▼         ▼              ▼          ▼            ▼          │
       BriefsCardGrid  AfterActionsTable  TasksList  ActivityList  SettingsLayout
            │         │              │          │            │          │
            ▼         ▼              ▼          ▼            ▼          ▼
       useQuery    useAfterActionsAll  useMyTasks   useActivityFeed  per-section forms  …
       briefs +     (NEW)             useContributedTasks  useEntityFollow  + DesignProvider hooks
       ai_briefs                         │              │
       merge       ┌──────────────────┐  │              │
            │      │ supabase.fn:     │  │              │
            ▼      │ after-actions-   │  │ supabase.fn: │
       supabase    │ list-all (NEW)   │  │ activity-    │ supabase.fn:
       .from()     │  ↓ joins:         │  │ feed         │ tasks-* +
       briefs+     │  - engagements   │  │              │ users table
       ai_briefs   │  - dossiers      │  │              │
                   │  - aa_decisions  │  │              │
                   │  - aa_commitments│  │              │
                   └──────────────────┘  │              │
                            │            │              │
                            ▼            ▼              ▼
                       Supabase PostgreSQL (RLS-gated by dossier_acl)
```

### Recommended Project Structure (only the surface this phase touches)

```
frontend/src/
├── pages/
│   ├── Briefs/BriefsPage.tsx              (rewrite body; 591 → ~250 LOC est.)
│   ├── MyTasks.tsx                        (rewrite body; 329 → ~180 LOC est.)
│   ├── activity/ActivityPage.tsx          (rewrite body; 137 → ~140 LOC est.)
│   └── settings/SettingsPage.tsx          (rewrite chrome; 342 → ~280 LOC est.)
├── routes/_protected/
│   ├── briefs.tsx                          (5 LOC — preserved as-is)
│   └── after-actions/index.tsx             (rewrite to handoff .tbl; current is stub)
├── components/
│   ├── layout/PageHeader.tsx               (preserved)
│   ├── settings/
│   │   ├── SettingsLayout.tsx              (rewrite chrome)
│   │   ├── SettingsNavigation.tsx          (rewrite chrome — drop FloatingDock; rebuild as .settings-nav)
│   │   └── sections/*SettingsSection.tsx   (preserved — restyle only)
│   └── signature-visuals/
│       └── Icon.tsx                        (NEW — see Blocker 1)
├── hooks/
│   ├── useAfterAction.ts                   (append `useAfterActionsAll`)
│   ├── useTasks.ts                         (preserved)
│   └── useActivityFeed.ts                  (preserved)
├── i18n/
│   ├── index.ts                            (register new namespaces)
│   └── {en,ar}/                             (add briefs-page, after-actions-page, tasks-page; extend activity-feed, settings)
└── index.css                               (append handoff classes per §Handoff CSS port)

supabase/functions/
└── after-actions-list-all/
    └── index.ts                            (NEW — mirrors after-actions-list/index.ts)
```

### Pattern 1: Verbatim Handoff Port (Phase 35/37/38/39/40/41 precedent)

**What:** 1:1 preservation of markup, classnames, dimensions, timings — no improvisation.
**When to use:** Every visual surface this phase touches.
**Example:** Tasks `.task-row` from `inteldossier_handoff_design/src/app.css:342`:

```css
/* Source: frontend/design-system/inteldossier_handoff_design/src/app.css:342 */
.task-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 6px;
  border-bottom: 1px solid var(--line-soft);
  font-size: 13px;
}
.task-row:last-child {
  border-bottom: 0;
}
.task-box {
  width: 14px;
  height: 14px;
  border: 1.5px solid var(--ink-faint);
  border-radius: 3px;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.12s;
}
.task-box:hover {
  border-color: var(--accent);
}
.task-box.done {
  background: var(--ok);
  border-color: var(--ok);
}
.task-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task-due {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--ink-mute);
  min-width: 60px;
  text-align: end;
}
.task-due.today,
.task-due.high {
  color: var(--danger);
  font-weight: 600;
}
```

JSX consuming the above — verbatim from handoff `pages.jsx#L367-396`:

```tsx
// Source: inteldossier_handoff_design/src/pages.jsx#L367-396 (paraphrased to project types)
<ul className="tasks-list">
  {tasks.map((task) => (
    <li key={task.id} className="task-row">
      <button
        role="checkbox"
        aria-checked={task.status === 'completed'}
        className={cn('task-box', task.status === 'completed' && 'done')}
        style={{ minWidth: 44, minHeight: 44, padding: 15 }} // 44×44 hit area wraps the 14×14 visual
        onClick={(e) => {
          e.stopPropagation()
          toggleDone(task)
        }}
      >
        {task.status === 'completed' && (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" fill="none" />
          </svg>
        )}
      </button>
      <DossierGlyph type={dossier.type} iso={dossier.iso} name={dossier.name_en} size={18} />
      <div className="task-title">
        <div>{task.title}</div>
        <small
          style={{ color: 'var(--ink-mute)' }}
        >{`${dossier.name} · ${task.work_item_type}`}</small>
      </div>
      {task.priority === 'high' && <span className="chip chip-danger">{t('priority.high')}</span>}
      {task.priority === 'medium' && <span className="chip chip-warn">{t('priority.medium')}</span>}
      {task.priority === 'low' && <span className="chip">{t('priority.low')}</span>}
      {task.priority === 'urgent' && (
        <span className="chip chip-danger">{t('priority.urgent')}</span>
      )}
      <span
        className={cn(
          'task-due',
          isToday(task.deadline) && 'today',
          task.priority === 'high' && 'high',
        )}
      >
        {formatDueDate(task.deadline, locale)}
      </span>
    </li>
  ))}
</ul>
```

### Pattern 2: Activity Sentence Composition (D-14)

**What:** Bilingual i18n templates per `action_type` keep the JSX simple while supporting RTL grammar inversion.
**When to use:** Activity rows.
**Example:**

```tsx
// Source: handoff pages.jsx#L398-421 + project ActivityItem type
<ul className="act-list">
  {activities.map((a) => (
    <li key={a.id} className="act-row">
      <span className="act-t">{toArDigits(formatRelativeTime(a.created_at, locale))}</span>
      <Icon name={iconForAction(a.action_type)} size={16} />
      <span>
        <span className="act-who">{a.actor_name}</span>{' '}
        <span className="act-what">
          <Trans
            i18nKey={`activity-feed.events.${a.action_type}`}
            values={{
              entity: a.entity_name_en, // or _ar based on locale
              where: a.related_entity_name_en ?? '—',
            }}
            components={{
              entity: <strong style={{ color: 'var(--ink)', fontWeight: 500 }} />,
              where: <span className="act-where" />,
            }}
          />
        </span>
      </span>
    </li>
  ))}
</ul>
```

i18n template example (EN), 6 keys mapping to handoff icon set:

```json
{
  "events": {
    "approval": "approved <entity>{{entity}}</entity> in <where>{{where}}</where>",
    "create": "created <entity>{{entity}}</entity> in <where>{{where}}</where>",
    "comment": "commented on <entity>{{entity}}</entity> in <where>{{where}}</where>",
    "upload": "uploaded <entity>{{entity}}</entity> in <where>{{where}}</where>",
    "update": "updated <entity>{{entity}}</entity> in <where>{{where}}</where>",
    "status_change": "changed status on <entity>{{entity}}</entity> in <where>{{where}}</where>",
    "_default": "acted on <entity>{{entity}}</entity> in <where>{{where}}</where>"
  }
}
```

`[ASSUMED]` Bilingual phrasing — author bilingual content authority should review final AR copy before launch. **Defer to copy review pass; UI-SPEC has the canonical empty/error copy locked.**

### Anti-Patterns to Avoid

- **Don't use `event_type`** — the actual field on `ActivityItem` is `action_type` (verified line 65 of `frontend/src/types/activity-feed.types.ts`). CONTEXT.md D-14 used "event_type" colloquially.
- **Don't manually `.reverse()`** any list to handle RTL — `dir="rtl"` + `flexDirection: row` already inverts. Manual reversal double-flips back to LTR.
- **Don't use `textAlign: "right"`** — gets flipped to physical LEFT under `forceRTL`. Use `text-end` / `text-start`.
- **Don't read both `briefs` and `ai_briefs` tables in the new card grid** — current `BriefsPage.tsx:114-120` does a `Promise.all` of both tables and merges. Preserve that merge pattern verbatim — but the new card grid renders the same merged shape (`is_published / published_date / title_en / title_ar / created_at / author`). The chip mapping uses the merged `is_published` field as the lossless source.
- **Don't add a "Save" button per field** in Settings — D-10 explicitly rejects per-field dialogs. One Save per section.
- **Don't drop the floating FAB without first wiring the page-head action button** — D-15 requires a "New task" button replacement, not an unwiring of `useWorkCreation`.
- **Don't bypass `<DossierGlyph/>`** for Tasks rows — UI-SPEC mandates it at `size={18}` per row.

---

## Don't Hand-Roll

| Problem                                   | Don't Build                              | Use Instead                                                                                                  | Why                                               |
| ----------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Modal focus trap, ESC, backdrop dismiss   | Custom `<Dialog>`                        | `@heroui/react` Modal v3                                                                                     | Already vendored; UI-SPEC mandates HeroUI cascade |
| Tab navigation with keyboard              | Custom tabs                              | `@heroui/react` Tabs (D-13/D-15)                                                                             | A11y already correct                              |
| Skeleton primitives                       | Custom shimmer                           | `frontend/src/components/ui/skeleton.tsx` (re-export from heroui-skeleton)                                   | Phase 38 D-11 precedent                           |
| Bilingual digit conversion                | Custom `Intl.NumberFormat` per call site | `toArDigits` from `frontend/src/lib/i18n/toArDigits.ts`                                                      | Phase 39/40/41 precedent                          |
| Dossier flag glyphs                       | Custom SVG                               | `<DossierGlyph type={...} iso={...} size={18}/>`                                                             | Phase 37                                          |
| Optimistic task done-toggle               | Manual `useState` + setTimeout rollback  | `useUpdateTask` (already shipped)                                                                            | Already handles cache rollback on error           |
| Activity feed pagination                  | Manual cursor math                       | `useActivityFeed` (`useInfiniteQuery` already wired)                                                         | Already handles auth-gated `enabled`              |
| Per-dossier after-actions                 | Custom hook                              | Keep `useAfterActions` (per-dossier); add `useAfterActionsAll` for the new aggregate                         | Two distinct cache keys; no collision             |
| Settings forms                            | Custom controlled inputs                 | `react-hook-form + zod` (already in every section)                                                           | D-10                                              |
| Direction / density / hue / mode controls | Custom localStorage logic                | `useDesignDirection / useDensity / useHue / useMode` (Phase 33/34)                                           | D-11 — TweaksDrawer + Settings share state        |
| Page-head chrome                          | Custom `<header>`                        | `<PageHeader/>` (already correct)                                                                            | Reuse                                             |
| Brief generation UI                       | Custom AI panel                          | Wrap existing `BriefGenerationPanel` in HeroUI Modal                                                         | D-05                                              |
| Brief view                                | Custom viewer                            | Wrap existing `BriefViewer` in HeroUI Modal                                                                  | D-05                                              |
| Activity event icon → glyph mapping       | Custom switch                            | i18n template `events.{action_type}` + small `iconForAction()` helper                                        | D-14                                              |
| Mobile settings nav                       | Custom carousel                          | `overflow-x: auto` flexbox row of `.settings-nav` pills with `scrollIntoView({inline:'center'})` per UI-SPEC | D-12                                              |

**Key insight:** Every page in this phase already has its data path shipped. The only domain logic worth hand-rolling is the Activity sentence composer (Pattern 2 above) — and even that is just `<Trans>` + a 6-key icon map.

---

## Common Pitfalls

### Pitfall 1: After-actions list returns no engagement title or dossier name

**What goes wrong:** Plan declares "render `engagement.title_en` in column 1" but the existing `after-actions-list` Edge Function never joins `engagements` — only `decisions / commitments / risks / follow_up_actions`.
**Why it happens:** The per-dossier function never needed engagement title because the surrounding page already had dossier context.
**How to avoid:** New `after-actions-list-all` Edge Function MUST add `engagement:engagements!inner (id, title_en, title_ar, engagement_date)` and `dossier:dossiers!inner (id, name_en, name_ar)` to the `.select()` clause. Document in Wave 0 plan.
**Warning signs:** Implementer writes `row.engagement.title_en` and gets `undefined`.

### Pitfall 2: `event_type` vs `action_type` rename trap

**What goes wrong:** Plan references `ActivityItem.event_type` per CONTEXT.md D-14 wording. Compiles fine (TypeScript erases at runtime; `[key: string]: unknown` index signature on `ActivityItem` doesn't enforce field names) but renders nothing.
**Why it happens:** The actual TypeScript type names the field `action_type` (verified `frontend/src/types/activity-feed.types.ts:65`).
**How to avoid:** Use `action_type` everywhere; the i18n key is `events.{action_type}`. Update tests and copy.
**Warning signs:** Activity rows render with empty action verb / blank icon.

### Pitfall 3: Priority enum mismatch — DB has wider range than work-item types

**What goes wrong:** Implementer writes `priority === 'critical'` to render a custom chip; runtime task object has `priority='high'` instead because the tasks-API service file (`frontend/src/services/tasks-api.ts:31`) restricts to `'low' | 'medium' | 'high' | 'urgent'` even though the DB enum (`backend/src/types/database.types.ts:38351`) is `["critical", "urgent", "high", "normal", "medium", "low"]`.
**Why it happens:** Two parallel schemas — the canonical work-item layer and the older priority_level DB enum.
**How to avoid:** **Use the work-item terminology only** — `low / medium / high / urgent` per CLAUDE.md and `frontend/src/types/work-item.types.ts:28`. Map any unexpected DB value (e.g., `critical → urgent`, `normal → medium`) defensively in row composition. Per CONTEXT.md `<specifics>`, urgent should map to `chip-danger` (same as `high`) — confirm in plan.
**Warning signs:** Task chip renders with no styling (because `'critical'` doesn't match any chip class).

### Pitfall 4: Settings has 9 sections, CONTEXT.md says 7

**What goes wrong:** D-09 says "Keep all 7 existing sections (Profile / General / Appearance / Notifications / Access & Security / Accessibility / Data & Privacy)." But the live codebase has 9: the 7 listed + `email-digest` + `integrations` (verified `frontend/src/components/settings/SettingsNavigation.tsx:34-44`, `frontend/src/types/settings.types.ts:8-17`).
**Why it happens:** Phase 32 and earlier shipped extra sections; CONTEXT.md treats them as not part of "core 7".
**How to avoid:** See §Open Questions O-1 — planner picks one of (a) drop `email-digest` and `integrations` from the navigation (and re-route `EmailDigestSettings` + `BotIntegrationsSettings` into the Notifications + Profile sections respectively, or to a "More" overflow), or (b) keep all 9 in the nav and document the deviation. **Recommend (b) "keep all 9, document deviation"** because dropping `BotIntegrationsSettings` orphans 16 KB of existing code.
**Warning signs:** Tests of "7 nav rows" fail because there are 9 children.

### Pitfall 5: `BriefsPage` reads two tables (briefs + ai_briefs)

**What goes wrong:** Implementer writes a single `useQuery(['briefs'], () => supabase.from('briefs').select('*'))` and the AI-generated briefs disappear from the grid.
**Why it happens:** Existing `BriefsPage.tsx:114-120` does `Promise.all` of `briefs` + `ai_briefs` tables and merges, then maps each row to a unified `Brief` shape with `is_published` derived from `status==='completed'` for `ai_briefs`.
**How to avoid:** **Preserve the dual-table fetch + merge logic verbatim**. Only the rendering layer changes (DataTable → card grid).
**Warning signs:** Card grid count drops from "X published + Y ai" to just "X" or "Y".

### Pitfall 6: Handoff CSS classes not yet in `frontend/src/index.css`

**What goes wrong:** Implementer writes `<ul className="tasks-list">` and gets unstyled `display: block` lists.
**Why it happens:** Phase 40 ported only `.btn / .chip / .tbl / .week-list / .forum-row / .icon-flip / .spinner-row / .pill / .dossier-row / .page*` per the comment in `frontend/src/index.css:11-12`. Page-42-specific selectors (`.tasks-list / .task-row / .act-list / .act-row / .settings-nav / etc.`) are NOT yet ported.
**How to avoid:** Wave 0 plan ports the missing selectors verbatim from `frontend/design-system/inteldossier_handoff_design/src/app.css:73-100, 236-241, 341-350, 444-450` into `frontend/src/index.css`. Document the line ranges so the diff is auditable.
**Warning signs:** Visual baselines fail because rows render at default heights.

### Pitfall 7: `text-align: "right"` flip in RTL

**What goes wrong:** Implementer writes `<span style={{ textAlign: 'right' }}>...</span>` for the page-count `N pp` end-aligned label. In RTL it renders LEFT-aligned.
**Why it happens:** CSS `text-align: right` is a physical value; under RTL the layout subsystem flips it to `left`.
**How to avoid:** Use `text-align: end` (logical) or `text-end` Tailwind utility. The handoff `.task-due` already uses `text-align: end`.
**Warning signs:** AR baselines show end-aligned content stuck to the LEFT.

### Pitfall 8: Whole-card click target swallows checkbox click

**What goes wrong:** Tasks row click handler navigates to `/tasks/$id`, but tapping the checkbox also navigates because the click bubbles.
**Why it happens:** Click bubbling.
**How to avoid:** Checkbox `onClick` calls `e.stopPropagation()` before invoking the mutation. Same pattern for the entire `.task-box` 44×44 hit area.
**Warning signs:** Cannot toggle done state without immediately leaving the page.

### Pitfall 9: i18n namespace duplication between `frontend/public/locales/` and `frontend/src/i18n/`

**What goes wrong:** Implementer adds `briefs-page.json` to `frontend/public/locales/en/` because CONTEXT.md `<canonical_refs>` line 223 references that path; runtime can't find it.
**Why it happens:** The canonical i18n source is `frontend/src/i18n/{en,ar}/` (statically imported in `frontend/src/i18n/index.ts`). `frontend/public/locales/` is a leftover from an earlier dynamic-loading attempt and is no longer wired up.
**How to avoid:** **Add new namespaces to `frontend/src/i18n/{en,ar}/` and register imports in `frontend/src/i18n/index.ts`**. Document in Wave 0 plan.
**Warning signs:** `t('briefs-page.title')` returns the literal key string.

---

## i18n Strategy (resolves CONTEXT.md "Claude's Discretion" deferral)

**Canonical source:** `frontend/src/i18n/{en,ar}/` (static imports in `frontend/src/i18n/index.ts`). `frontend/public/locales/` is **NOT** the runtime source despite its presence.

**Existing namespaces relevant to this phase** (verified):

- `frontend/src/i18n/{en,ar}/activity-feed.json` — extend with `events.{action_type}` 6 keys + fallback
- `frontend/src/i18n/{en,ar}/settings.json` — extend with `nav.{section}` rename ("Security" → "Access & Security") + Appearance design control labels
- `frontend/src/i18n/{en,ar}/my-work.json` — extend with Tasks page-specific keys (page-head subtitle, "New task" CTA, empty state, priority chip labels) — OR create `tasks-page.json`
- `frontend/src/i18n/{en,ar}/engagement-briefs.json` — could extend, but recommend NEW namespace for Briefs page (different page/different scope from per-engagement brief sections)
- (no `briefs-page.json` exists — NEW)
- (no `after-actions-page.json` exists — NEW)

**Recommendation (resolves the deferred Claude-discretion item):**

| Namespace            | Status     | New keys                                                                                                                                              |
| -------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `briefs-page`        | **NEW**    | `title`, `cta.newBrief`, `card.pages`, `card.byAuthor`, `status.{ready,awaiting,review,draft}`, `empty.heading`, `error.list`                         |
| `after-actions-page` | **NEW**    | `title`, `columns.{engagement,date,dossier,decisions,commitments}`, `empty.heading`, `error.list`                                                     |
| `tasks-page`         | **NEW**    | `title`, `subtitle`, `cta.newTask`, `tabs.{assigned,contributed}`, `priority.{low,medium,high,urgent}`, `empty.heading`, `error.list`, `error.update` |
| `activity-feed`      | **EXTEND** | `events.{create,update,comment,upload,approval,status_change,_default}` (6 + fallback)                                                                |
| `settings`           | **EXTEND** | `nav.accessAndSecurity` (rename), `appearance.{direction,mode,hue,density}.{label,help}` for Phase 33/34 design controls                              |

Each new namespace requires:

1. Two JSON files: `frontend/src/i18n/en/<name>.json` + `frontend/src/i18n/ar/<name>.json`
2. Import + register in `frontend/src/i18n/index.ts` (existing pattern at lines 4-30 already)
3. AR parity check (Phase 40 plan 40-01 precedent)

---

## Briefs schema lookup → status chip mapping (resolves CONTEXT.md D-06)

`[VERIFIED: supabase/migrations/007_briefs.sql read — actual schema:]`

```sql
CREATE TABLE public.briefs (
  id UUID PRIMARY KEY,
  reference_number TEXT,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  summary_en TEXT,
  summary_ar TEXT,
  full_content_en TEXT,
  full_content_ar TEXT,
  category TEXT CHECK (category IN ('policy','analysis','news','report','other')),
  tags JSONB,
  related_country_id / related_organization_id / related_event_id UUID,
  is_published BOOLEAN DEFAULT FALSE,
  published_date DATE,                  -- auto-set when is_published flips true (trigger)
  author_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Plus a separate ai_briefs table:
CREATE TABLE public.ai_briefs (
  ...
  status ai_brief_status NOT NULL DEFAULT 'generating',
  ...
);
```

**There is NO `review_stage` field. NO `approver_pending` field. NO `pages` / `page_count` / `word_count` field.**

**Status chip mapping (D-06 lossless):**

| Source state                         | Chip                   | Render?                                          |
| ------------------------------------ | ---------------------- | ------------------------------------------------ |
| `is_published === true`              | `chip-ok` "ready"      | YES                                              |
| `is_published === false` (= "draft") | base `.chip` "draft"   | YES                                              |
| `awaiting approval`                  | `chip-warn` "awaiting" | **NEVER** — source field doesn't exist; lossless |
| `review`                             | `chip-info` "review"   | **NEVER** — source field doesn't exist; lossless |

For `ai_briefs` rows, the existing merge logic at `BriefsPage.tsx:189-190` maps `status === 'completed'` → `is_published = true`. So `ready` (chip-ok) covers both human-published and AI-completed briefs.

**Page-count rendering (D-Briefs `<specifics>`):**

- No `pages` field exists. Compute from `full_content_en` length: `Math.max(1, Math.ceil(content.length / 2200))` words → approximate "pages". Or render `—` if `full_content_en` is null.
- **Recommendation:** Render `—` when content is null; otherwise compute approximate page count and render as `N pp`. **Document the approximation in i18n key with a tooltip on hover** (`title="Approximate length"`).
- `[ASSUMED]` 2200 chars/page is an English-roughly approximation; AR may differ. Acceptable for v1.

---

## Tasks page hooks lookup (resolves CONTEXT.md D-15)

`[VERIFIED: frontend/src/hooks/useTasks.ts + frontend/src/pages/MyTasks.tsx + frontend/src/services/tasks-api.ts]`

| Hook                            | Path                    | Returns                                           | Notes                               |
| ------------------------------- | ----------------------- | ------------------------------------------------- | ----------------------------------- |
| `useMyTasks`                    | `useTasks.ts:84`        | `{ tasks: Task[], total_count, page, page_size }` | Powers Assigned tab                 |
| `useContributedTasks`           | `useTasks.ts:97`        | same shape                                        | Powers Contributed tab              |
| `useUpdateTask`                 | `useTasks.ts:209`       | mutation                                          | Done-toggle (optimistic)            |
| `tasksAPI.getMyTasks(filters?)` | `services/tasks-api.ts` | service layer                                     | calls `tasks-list-my` Edge Function |

**Task row shape** — from `Database['public']['Tables']['tasks']['Row']`:

- `id`, `title`, `title_ar?`, `priority` (DB enum: `[critical, urgent, high, normal, medium, low]` — but tasks-api narrows to `low/medium/high/urgent`)
- `status` (`pending|in_progress|review|completed|cancelled`)
- `sla_deadline` (timestamptz) — used as the "due" column
- `dossier_id` — for `<DossierGlyph/>`
- `work_item_type` — for the row subtitle ("dossier · task-type")

**Priority chip mapping (D-15 verbatim from `<specifics>`):**

| Priority                       | Chip class                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `urgent`                       | `chip-danger` (same as high — most-severe visual signal)                           |
| `high`                         | `chip-danger`                                                                      |
| `medium`                       | `chip-warn`                                                                        |
| `low`                          | base `.chip` (no modifier)                                                         |
| `critical`, `normal` (DB-only) | Defensively map: `critical → chip-danger`, `normal → chip-warn`. Document in plan. |

**Done-state SVG (handoff verbatim from `<specifics>`):** `<svg width="14" height="14"><path d="M3 7l3 3 5-6" stroke="white" stroke-width="2" fill="none"/></svg>` rendered inside `.task-box.done`.

**Whole-row done state:** `opacity: 0.45` + line-through on `.task-title`. Triggered by `task.status === 'completed'` (the unified status field).

**Mobile (≤768px) tasks list:** Same `.task-row` flex; `min-h: 52px` per `--row-h` Comfortable density. No mobile-specific reflow needed; the row already wraps acceptably at 320px because `.task-title` collapses with `text-overflow: ellipsis`.

---

## Activity event_type / action_type enum (resolves CONTEXT.md D-14)

`[VERIFIED: frontend/src/types/activity-feed.types.ts:11-26]`

The type field is named **`action_type`** (NOT `event_type`). Real enum:

```ts
export type ActivityActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'comment'
  | 'status_change'
  | 'upload'
  | 'download'
  | 'view'
  | 'share'
  | 'assign'
  | 'mention'
  | 'approval'
  | 'rejection'
  | 'archive'
  | 'restore'
```

**15 distinct values** vs. the handoff's 6-icon canonical set (`approval/link/file/check/alert/comment`).

**Mapping to handoff icons (D-14 + Claude's-discretion fallback):**

| `action_type`   | Handoff icon | Rationale                                              |
| --------------- | ------------ | ------------------------------------------------------ |
| `approval`      | `check`      | direct                                                 |
| `rejection`     | `alert`      | "rejection" is a negative-state event                  |
| `comment`       | `chat`       | direct                                                 |
| `mention`       | `chat`       | also a comment/conversation event                      |
| `create`        | `plus`       | (extends handoff set; PR icon set must include `plus`) |
| `delete`        | `alert`      | destructive                                            |
| `update`        | `dot`        | non-distinctive — fallback                             |
| `status_change` | `dot`        | non-distinctive                                        |
| `upload`        | `file`       | direct                                                 |
| `download`      | `file`       | also file-related                                      |
| `view`          | `dot`        | low-signal                                             |
| `share`         | `link`       | sharing implies an external destination                |
| `assign`        | `dot`        | low-signal                                             |
| `archive`       | `dot`        | low-signal                                             |
| `restore`       | `dot`        | low-signal                                             |

**Activity row data shape** (from `ActivityItem`):

- `actor_name` → `who`
- `description_en / description_ar` (sentence-ready) — **OR** compose via i18n template per §Pattern 2 (recommended for grammar control)
- `entity_name_en / entity_name_ar` → `what`'s entity (strong/var(--ink)/500 weight)
- `related_entity_name_en / related_entity_name_ar` → `where` (`var(--accent-ink)` color)
- `created_at` → `time` (`var(--font-mono)` 10.5px ink-faint, formatted as relative time `5m / 1h / 2d`)

**i18n templates per `action_type`** — see §Pattern 2 example. **Defer authoring of all 15 templates × 2 locales to Wave 0**; provide the 6 most-used keys + `_default` fallback.

---

## Settings sections inventory (resolves CONTEXT.md D-09 / D-11)

`[VERIFIED: frontend/src/components/settings/sections/ + frontend/src/types/settings.types.ts]`

**SettingsSectionId enum (9 values):** `profile / general / appearance / notifications / email-digest / integrations / accessibility / data-privacy / security`

**Section components:**

| Section           | File                                                                                       | Status                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Profile           | `sections/ProfileSettingsSection.tsx`                                                      | preserved                                                                                                    |
| General           | `sections/GeneralSettingsSection.tsx`                                                      | preserved                                                                                                    |
| Appearance        | `sections/AppearanceSettingsSection.tsx`                                                   | preserved + extend per D-11 (embed direction/mode/hue/density controls; `useMode` already imported per `:9`) |
| Notifications     | `sections/NotificationsSettingsSection.tsx`                                                | preserved                                                                                                    |
| Email Digest      | (lives in `frontend/src/components/email/EmailDigestSettings.tsx`, NOT in sections folder) | See §Open Question O-1                                                                                       |
| Integrations      | `frontend/src/components/settings/BotIntegrationsSettings.tsx` (NOT in sections folder)    | See §Open Question O-1                                                                                       |
| Access & Security | `sections/SecuritySettingsSection.tsx` (rename label only — D-09)                          | preserved + i18n rename                                                                                      |
| Accessibility     | `sections/AccessibilitySettingsSection.tsx`                                                | preserved                                                                                                    |
| Data & Privacy    | `sections/DataPrivacySettingsSection.tsx`                                                  | preserved                                                                                                    |

**Design control hooks for D-11 — all in `frontend/src/design-system/hooks/`:**

- `useDesignDirection` — Bureau / Chancery / Situation / Ministerial picker
- `useMode` — light / dark / system toggle (already imported by SettingsPage)
- `useHue` — 0–360° accent picker
- `useDensity` — comfortable / compact / dense (note: project shipped `comfortable / compact / spacious` per `settings.types.ts:36` — **a divergence from the canonical `comfortable / compact / dense` triad**; planner should reconcile this; `[ASSUMED]` `spacious` is project-only and does not match handoff)

**Mobile collapse (≤768px) — D-12:** Active row's `inset-inline-start: 0` 2px `::before` accent bar flips to `border-block-end: 2px solid var(--accent-ink)` on the active item, in a horizontal `overflow-x: auto` flex strip. New CSS rule under `@media (max-width: 768px)` ports verbatim from UI-SPEC.

---

## Routing wiring

`[VERIFIED: frontend/src/routes/_protected/]`

| Page                 | Route file                                    | Status                    | Action                         |
| -------------------- | --------------------------------------------- | ------------------------- | ------------------------------ |
| Briefs               | `_protected/briefs.tsx`                       | shipped (5-LOC re-export) | none                           |
| After-actions list   | `_protected/after-actions/index.tsx`          | shipped (stub)            | rewrite body to handoff `.tbl` |
| After-actions detail | `_protected/after-actions/$afterActionId.tsx` | shipped                   | preserved (row-click target)   |
| Tasks                | `_protected/tasks/index.tsx`                  | shipped                   | rewrite body                   |
| Tasks detail         | `_protected/tasks/$id.tsx`                    | shipped                   | preserved (row-click target)   |
| Activity             | `_protected/activity.tsx`                     | shipped                   | rewrite body                   |
| Settings             | `_protected/settings/...`                     | shipped                   | rewrite layout                 |

No new routes needed.

---

## Runtime State Inventory

**Trigger:** Phase 42 is a UI reskin, not a rename or refactor — but it does add new infra (Edge Function, hook, i18n namespaces, CSS classes). The relevant state-inventory categories are addressed below for completeness; most are N/A.

| Category            | Items                                                                                                                                                                                                                                        | Action Required                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Stored data         | None — no records are renamed or migrated.                                                                                                                                                                                                   | None.                                                                                 |
| Live service config | New Supabase Edge Function `after-actions-list-all` must be deployed (Supabase dashboard or `supabase functions deploy after-actions-list-all`).                                                                                             | Wave 0 plan must include deployment step OR document deferral to a separate ops task. |
| OS-registered state | None.                                                                                                                                                                                                                                        | None.                                                                                 |
| Secrets / env vars  | The new Edge Function uses the same `SUPABASE_URL` + `SUPABASE_ANON_KEY` env vars already wired for the per-dossier function. No new secrets.                                                                                                | None.                                                                                 |
| Build artifacts     | New i18n JSON files compile into the Vite bundle on next build. New `Icon.tsx` + new CSS append into `frontend/src/index.css`. Size-limit budget at 815 KB total JS — 5 reskins + 1 hook + 1 small Icon component should consume <10 KB net. | Wave 2 size-limit gate enforces this.                                                 |

---

## Environment Availability

| Dependency                                     | Required By                                                                                                    | Available                                                                                    | Version                                         | Fallback                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| `@heroui/react`                                | Modal (Briefs), Tabs (Activity/Tasks)                                                                          | ✓                                                                                            | 3.0.3                                           | Radix Dialog (already installed) for Modal                           |
| `@radix-ui/react-dialog`                       | Sheet fallback if HeroUI Modal can't house BriefViewer                                                         | ✓                                                                                            | 1.1.15                                          | n/a                                                                  |
| `@tanstack/react-query`                        | All hooks                                                                                                      | ✓                                                                                            | shipped                                         | n/a                                                                  |
| `react-hook-form + zod`                        | Settings forms                                                                                                 | ✓                                                                                            | shipped                                         | n/a                                                                  |
| `react-i18next`                                | All bilingual labels                                                                                           | ✓                                                                                            | shipped                                         | n/a                                                                  |
| `axe-core / @axe-core/playwright`              | WCAG AA gate                                                                                                   | ✓                                                                                            | shipped (Phase 38/40/41)                        | n/a                                                                  |
| `size-limit`                                   | Bundle gate                                                                                                    | ✓                                                                                            | shipped (config in `frontend/.size-limit.json`) | n/a                                                                  |
| `@playwright/test`                             | E2E + visual baselines                                                                                         | ✓                                                                                            | shipped                                         | n/a                                                                  |
| `lucide-react`                                 | Existing icon imports                                                                                          | ✓                                                                                            | shipped                                         | Optional fallback if Phase 37 `<Icon/>` not authored — see Blocker 1 |
| Phase 37 `<Icon/>` set                         | `+ / check / link / file / alert / chat / dot / chevron-right / cog / sparkle / bell / shield / lock / people` | **✗**                                                                                        | —                                               | Wave 0 ships it (recommended) OR use lucide-react                    |
| Supabase MCP / `supabase functions deploy` CLI | Deploy new Edge Function                                                                                       | (assumed available — staging project `Intl-Dossier` ID `zkrcjzdemdmwhearhfgg` per CLAUDE.md) | —                                               | Use Supabase dashboard manual deploy                                 |

**Missing dependencies with fallback:** Phase 37 `<Icon/>` set. **Recommend Wave 0 ships it.**

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

### Test Framework

| Property           | Value                                                           |
| ------------------ | --------------------------------------------------------------- | ----------- | ------------------ | ---------- | ------------- | --------------- |
| Framework          | Vitest 1.x (unit) + Playwright (E2E + visual) + axe-core (a11y) |
| Config files       | `frontend/vitest.config.ts`, `frontend/playwright.config.ts`    |
| Quick run command  | `pnpm test --run --reporter=verbose <file>` (vitest)            |
| Full suite command | `pnpm test && pnpm playwright test --grep "phase-42             | briefs-page | after-actions-page | tasks-page | activity-page | settings-page"` |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                       | Test Type                          | Automated Command                                                                | File Exists?       |
| ------- | ------------------------------------------------------------------------------ | ---------------------------------- | -------------------------------------------------------------------------------- | ------------------ |
| PAGE-01 | Briefs renders responsive card grid with status chip + page count + author/due | Unit (component) + visual (LTR/AR) | `pnpm test BriefsPage` + `pnpm playwright test briefs-page-visual`               | ❌ Wave 0          |
| PAGE-01 | Brief card click opens BriefViewer Modal                                       | E2E                                | `pnpm playwright test briefs-page --grep card-click`                             | ❌ Wave 0          |
| PAGE-01 | "New brief" CTA opens BriefGenerationPanel Modal                               | E2E                                | `pnpm playwright test briefs-page --grep cta`                                    | ❌ Wave 0          |
| PAGE-02 | After-actions table renders 6 columns + chevron flips in RTL                   | Unit + visual                      | `pnpm test AfterActionsTable` + `pnpm playwright test after-actions-page-visual` | ❌ Wave 0          |
| PAGE-02 | Row click navigates to `/after-actions/$id`                                    | E2E                                | `pnpm playwright test after-actions-page --grep navigation`                      | ❌ Wave 0          |
| PAGE-02 | `useAfterActionsAll` hook returns engagement+dossier joined data               | Unit (hook)                        | `pnpm test useAfterActionsAll`                                                   | ❌ Wave 0          |
| PAGE-03 | Tasks list renders checkbox + glyph + title + priority + due                   | Unit + visual                      | `pnpm test MyTasksPage` + `pnpm playwright test tasks-page-visual`               | ❌ Wave 0          |
| PAGE-03 | Done-toggle flips visual state (opacity + strikethrough) without navigating    | E2E                                | `pnpm playwright test tasks-page --grep done-toggle`                             | ❌ Wave 0          |
| PAGE-03 | Assigned/Contributed tabs swap data sets                                       | E2E                                | `pnpm playwright test tasks-page --grep tabs`                                    | ❌ Wave 0          |
| PAGE-04 | Activity rows render `who action what in where` with `where` in `--accent-ink` | Unit + visual                      | `pnpm test ActivityList` + `pnpm playwright test activity-page-visual`           | ❌ Wave 0          |
| PAGE-04 | All/Following tabs work                                                        | E2E                                | `pnpm playwright test activity-page --grep tabs`                                 | ❌ Wave 0          |
| PAGE-05 | Settings 240+1fr layout with `inset-inline-start: 0` accent bar on active row  | Unit + visual                      | `pnpm test SettingsLayout` + `pnpm playwright test settings-page-visual`         | ❌ Wave 0          |
| PAGE-05 | Mobile (≤768px) collapses to horizontal pill nav with accent underline         | E2E (viewport)                     | `pnpm playwright test settings-page --grep mobile-collapse`                      | ❌ Wave 0          |
| PAGE-05 | Appearance section design controls share state with TweaksDrawer               | Unit (hook integration)            | `pnpm test AppearanceSettingsSection`                                            | ❌ Wave 0 (extend) |
| All 5   | RTL renders correctly via `dir="rtl"` + logical properties                     | Visual (×5 AR baselines)           | `pnpm playwright test --grep "rtl-flip"`                                         | ❌ Wave 0          |
| All 5   | axe-core WCAG AA zero violations                                               | a11y E2E                           | `pnpm playwright test --grep "page-42-axe"`                                      | ❌ Wave 0          |
| All 5   | size-limit ≤815 KB Total JS                                                    | bundle                             | `pnpm size-limit`                                                                | ✓ exists           |
| All 5   | ≥44×44px touch targets                                                         | E2E                                | `pnpm playwright test --grep "touch-targets-42"`                                 | ❌ Wave 0          |

### Sampling Rate

- **Per task commit:** `pnpm test --run --reporter=verbose <file>` (vitest unit for the page changed)
- **Per wave merge:** `pnpm test && pnpm playwright test --grep "phase-42"` (full suite for the phase scope)
- **Phase gate:** Full suite green + 10 visual baselines accepted before `/gsd-verify-work`

### Wave 0 Gaps (test infra to seed)

- [ ] `frontend/tests/e2e/support/phase-42-fixtures.ts` — mock briefs (mixed published+draft+ai_briefs), mock after-actions-all (3 records across 2 dossiers, varied counts), mock tasks (mixed priorities + done state), mock activity (one per `action_type`), mock settings (logged-in user + section state)
- [ ] `frontend/tests/e2e/briefs-page-visual.spec.ts` (2 baselines: LTR + AR @ 1280)
- [ ] `frontend/tests/e2e/after-actions-page-visual.spec.ts` (2)
- [ ] `frontend/tests/e2e/tasks-page-visual.spec.ts` (2)
- [ ] `frontend/tests/e2e/activity-page-visual.spec.ts` (2)
- [ ] `frontend/tests/e2e/settings-page-visual.spec.ts` (2 — 1280 + verify mobile pill nav at 768)
- [ ] `frontend/tests/e2e/briefs-page.spec.ts` + `…page.spec.ts` for the other 4 (functional E2E)
- [ ] `frontend/tests/e2e/page-42-axe.spec.ts` (axe-core WCAG AA × 5 pages × LTR + AR = 10)
- [ ] `frontend/tests/e2e/touch-targets-42.spec.ts` (44×44 boundingBox per interactive element)
- [ ] Vitest unit harnesses for the 5 new/rewritten components: `BriefsPage.test.tsx`, `AfterActionsTable.test.tsx`, `MyTasksPage.test.tsx`, `ActivityList.test.tsx`, `SettingsLayout.test.tsx` + `useAfterActionsAll.test.ts`
- [ ] Visual determinism layers per Phase 40 plan 40-17: clock freeze, `caret: hide`, `reducedMotion: reduce`, `maxDiffPixels: 100` (already in `playwright.config.ts`)

**10 visual baselines target** (5 pages × LTR + AR @ 1280px) matches Phase 41 D-12 precedent.

---

## Code Examples

### Example 1: New `useAfterActionsAll` hook

```ts
// File: frontend/src/hooks/useAfterAction.ts (append)
// Source: Mirrors useAfterActions (line 181) with all-dossiers scope
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AfterActionRecord } from './useAfterAction'

export interface AfterActionListItem extends AfterActionRecord {
  engagement?: {
    id: string
    title_en: string
    title_ar: string
    engagement_date: string
  }
  dossier?: {
    id: string
    name_en: string
    name_ar: string
  }
}

export function useAfterActionsAll(options?: {
  status?: 'draft' | 'published' | 'edit_requested' | 'edit_approved'
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['after-actions', 'all', options],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('after-actions-list-all', {
        body: { status: 'published', limit: 50, offset: 0, ...options },
      })
      if (error) throw error
      return data as { data: AfterActionListItem[]; total: number; limit: number; offset: number }
    },
  })
}
```

### Example 2: New `after-actions-list-all` Edge Function

```ts
// File: supabase/functions/after-actions-list-all/index.ts
// Source: Mirrors after-actions-list/index.ts with cross-dossier scope + joins
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )

    if (req.method !== 'GET' && req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const url = new URL(req.url)
    const status = body.status ?? url.searchParams.get('status') ?? 'published'
    const limit = parseInt(body.limit ?? url.searchParams.get('limit') ?? '50')
    const offset = parseInt(body.offset ?? url.searchParams.get('offset') ?? '0')

    if (!['draft', 'published', 'edit_requested', 'edit_approved'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'validation_error', message: 'Invalid status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (limit < 1 || limit > 100) {
      return new Response(JSON.stringify({ error: 'validation_error', message: 'Limit 1-100' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data, error, count } = await supabase
      .from('after_action_records')
      .select(
        `
        *,
        engagement:engagements!inner (id, title_en, title_ar, engagement_date),
        dossier:dossiers!inner (id, name_en, name_ar),
        decisions (id),
        commitments:aa_commitments (id),
        risks:aa_risks (id),
        follow_up_actions:aa_follow_up_actions (id)
      `,
        { count: 'exact' },
      )
      .eq('publication_status', status)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // RLS auto-filters dossiers the user can't access
    return new Response(JSON.stringify({ data: data || [], total: count || 0, limit, offset }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

### Example 3: Settings nav active accent bar (handoff verbatim port)

```css
/* File: frontend/src/index.css (append)
   Source: inteldossier_handoff_design/src/app.css:73-100 */
.settings-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--ink-mute);
  position: relative;
  cursor: pointer;
  font-size: 13px;
  min-height: 44px; /* CLAUDE.md touch-target mandate */
  border: 0;
  background: transparent;
  width: 100%;
  text-align: start;
}
.settings-nav > svg {
  flex: 0 0 auto;
  opacity: 0.7;
}
.settings-nav:hover {
  background: var(--line-soft);
  color: var(--ink);
}
.settings-nav:hover > svg {
  opacity: 1;
}
.settings-nav.active {
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-weight: 500;
}
.settings-nav.active > svg {
  opacity: 1;
  color: var(--accent);
}
.settings-nav.active::before {
  content: '';
  position: absolute;
  inset-inline-start: 0; /* logical — auto-flips RTL */
  inset-block-start: 6px;
  inset-block-end: 6px;
  width: 2px;
  background: var(--accent);
  border-radius: 1px;
}

/* Mobile collapse (D-12) */
@media (max-width: 768px) {
  .settings-nav.active::before {
    /* desktop-only; reset */
    display: none;
  }
  .settings-nav.active {
    border-block-end: 2px solid var(--accent-ink);
  }
}
```

---

## State of the Art

| Old Approach                                                                | Current Approach                              | When Changed                               | Impact                                                                           |
| --------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| `<Tabs>` from `frontend/src/components/ui/tabs.tsx` (legacy shadcn-derived) | HeroUI v3 `Tabs`                              | Phase 33 (token engine), Phase 41 (drawer) | This phase: Activity + Tasks tabs use HeroUI v3 cascade                          |
| `<Dialog>` from `frontend/src/components/ui/dialog.tsx`                     | HeroUI v3 `Modal`                             | Phase 33 / Phase 41                        | This phase: Briefs dialogs (BriefViewer + BriefGenerationPanel) use HeroUI Modal |
| `frontend/public/locales/{en,ar}/` dynamic JSON load                        | `frontend/src/i18n/{en,ar}/` static imports   | (pre-existing, not date-locked)            | This phase: NEW namespaces go to `src/i18n/`, not `public/locales/`              |
| Per-dossier After-actions list only                                         | + cross-dossier `after-actions-list-all`      | This phase                                 | Adds aggregate Edge Function                                                     |
| `<FloatingDock>` mobile settings nav                                        | Horizontal `.settings-nav` pill scroll-strip  | This phase (D-12)                          | Drops marketing-style dock; aligns with handoff                                  |
| Statistics panel + Settings sheet on Activity page                          | Stripped per D-13                             | This phase                                 | Cleaner page chrome                                                              |
| Floating "+" FAB on Tasks page                                              | "New task" button in `.page-head` action slot | This phase (D-15)                          | Aligns with handoff convention                                                   |

**Deprecated/outdated:**

- `frontend/public/locales/` directory is no longer the runtime i18n source — leftover from earlier dynamic loading; new namespaces go to `frontend/src/i18n/`.
- `lucide-react` icons being phased out (Phase 43); this phase introduces no new lucide imports if Blocker 1 resolves with the `<Icon/>` set.
- `<DataTable>` (`frontend/src/components/table/DataTable.tsx`) — used by old BriefsPage; replaced by handoff card grid this phase. Cleanup deferred to Phase 43 per CONTEXT.md (Phase 40 D-13 precedent).

---

## Assumptions Log

| #   | Claim                                                                                                                                                              | Section                       | Risk if Wrong                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Phase 37 `<Icon/>` set should be authored in Wave 0 (recommend over lucide-react fallback)                                                                         | Blocker 1                     | If user prefers lucide, planner pivots; UI fidelity remains identical at 14-20px                                                                            |
| A2  | `engagements` table has `title_en`, `title_ar`, `engagement_date` columns                                                                                          | Blocker 2                     | If absent, Wave 0 implementer falls back to alternate columns the dashboard's WeekAhead widget uses; planner cannot enumerate without DB read access        |
| A3  | Bilingual i18n phrasing for activity event templates is acceptable as drafted                                                                                      | §Pattern 2                    | AR copy may need linguist review before launch — defer to copy-review pass                                                                                  |
| A4  | 2200 chars/page is acceptable for Briefs page-count fallback computation                                                                                           | §Briefs schema lookup         | Acceptable for v1; differs slightly between EN/AR but visual signal is "approximate length" not exact                                                       |
| A5  | Keep all 9 settings sections (not 7) and document the deviation from D-09                                                                                          | Pitfall 4, §Open Question O-1 | If user enforces 7-section nav, `EmailDigestSettings` + `BotIntegrationsSettings` must be re-housed (~16 KB code)                                           |
| A6  | `urgent` priority maps to `chip-danger` (same as `high`) — the most-severe visual signal                                                                           | §Tasks priority mapping       | If urgent should be visually distinct, plan must add a `chip-urgent` modifier; UI-SPEC currently shows `chip-danger` for both                               |
| A7  | DB enum values `critical` and `normal` defensively map to `chip-danger` and `chip-warn` respectively                                                               | §Tasks priority mapping       | Existing tasks API narrows to `low/medium/high/urgent` so this is theoretical; defensive code prevents silent failure if a future migration introduces them |
| A8  | The `density` token triad in this codebase is `comfortable / compact / spacious` (per `settings.types.ts:36`), NOT `comfortable / compact / dense` (handoff canon) | §Settings sections            | Planner must reconcile — either rename `spacious → dense` or document deviation                                                                             |
| A9  | New Edge Function deployment can ride along the Wave 0 plan via Supabase MCP                                                                                       | §Runtime State Inventory      | If deployment is gated separately, Wave 1 can't test against the live function — local mock is enough for unit tests                                        |

---

## Open Questions (RESOLVED)

### O-1: Settings — keep all 9 sections or fold to 7?

**What we know:** D-09 says "Keep all 7 existing sections." Codebase has 9: the 7 listed + `email-digest` + `integrations`.
**What's unclear:** Should `EmailDigestSettings` (in `frontend/src/components/email/`) and `BotIntegrationsSettings` (16 KB) be (a) dropped, (b) re-housed inside Notifications + Profile, or (c) kept as 8th and 9th nav items?
**Recommendation:** **(c) Keep all 9, document the deviation in plan**. Dropping orphans 16+ KB; re-housing is an ergonomic regression for users who already know where these settings live. The handoff's 6-section count is visual aspiration, not a functional cap.
**User confirmation:** would benefit from an explicit yes/no during plan-check.
**RESOLVED:** see CONTEXT.md R-02 — keep all 9 sections (Profile, General, Appearance, Notifications, Access & Security, Accessibility, Data & Privacy, Email Digest, Integrations); deviation from D-09's 7-count documented and accepted.

### O-2: Density triad reconciliation — "spacious" vs "dense"

**What we know:** `frontend/src/types/settings.types.ts:36` declares `comfortable / compact / spacious`. Handoff canon (per UI-SPEC and `inteldossier_handoff_design/handoff/app.css:148-151`) uses `comfortable / compact / dense`.
**What's unclear:** Was `spacious` a typo carried forward from an older theme system, or an intentional rename?
**Recommendation:** Treat as a typo. Wave 1 plan that touches `AppearanceSettingsSection` can rename `'spacious' → 'dense'` in the union type; tests covering the rename can be added cheaply. Coordinate with Phase 33's token system (`useDensity` hook) since the hook's value enum must agree.
**User confirmation:** needed before authoring the Appearance section's density picker.
**RESOLVED:** see CONTEXT.md R-03 — rename `spacious → dense` in `settings.types.ts` and `useDensity` hook; density triad is `comfortable / compact / dense` (handoff canon).

### O-3: After-actions row "Date" column — `engagement_date` or `created_at`?

**What we know:** Handoff `.tbl` shows a date column. The per-dossier function returns `created_at` (when the after-action record was filed) but no `engagement_date`. The new Edge Function joins `engagements.engagement_date` (assumption A2).
**What's unclear:** Should the column show "when the engagement happened" (= `engagement.engagement_date`) or "when the record was published" (= `published_at`)?
**Recommendation:** **`engagement.engagement_date`** — analyst's mental model is "the after-action FOR the meeting on date X", not "the after-action FILED on date Y". Date column is read as "the engagement's date".
**User confirmation:** worth a one-line plan-check confirmation.
**RESOLVED:** see CONTEXT.md R-04 — Date column shows `engagement.engagement_date` (joined via the new Edge Function); falls back to `created_at` if `engagement_date` is null.

### O-4: Brief card "page count" — compute or omit?

**What we know:** No `pages` / `page_count` / `word_count` field on `briefs` or `ai_briefs`. Handoff renders `12 pp`.
**What's unclear:** Compute approximate count from `full_content_en.length` (Recommendation A4) or render `—`?
**Recommendation:** **Compute approximate; render `—` only when `full_content_en` is null**. The card has visual space reserved; an empty slot would look broken.
**RESOLVED:** see CONTEXT.md R-01 — compute `pageCount = ceil(full_content_en.length / 2200)`; render `—` when `full_content_en` is null.

### O-5: Activity row click target

**What we know:** UI-SPEC `<interaction contracts>` says "Activity row click optional. If `event.entity_url` is set, navigate to that URL; otherwise non-interactive." But `ActivityItem.metadata.navigation_url` is the actual field (per `frontend/src/types/activity-feed.types.ts:111`); there is no top-level `entity_url`.
**What's unclear:** Is row navigation desired this phase, or is it deferred?
**Recommendation:** **Make row click navigate to `metadata.navigation_url` when present; otherwise the row is non-interactive (cursor: default; no `tabIndex`)**. Document this in the plan so the executor doesn't add a phantom click target.
**RESOLVED:** see CONTEXT.md R-05 — row click navigates to `metadata.navigation_url` ONLY when it starts with `/` (in-app path); absolute/external/protocol-relative URLs are rejected by an inline open-redirect guard and render the row as fully non-interactive (no `cursor: pointer`, no `role`/`tabIndex`/`onClick`).

---

## Sources

### Primary (HIGH confidence — direct file/codebase reads in this session)

- `frontend/src/components/layout/PageHeader.tsx` — handoff `.page-head` chrome (verified)
- `frontend/src/pages/Briefs/BriefsPage.tsx` (lines 1-120 read; full path 591 LOC) — existing Briefs page; dual-table fetch pattern
- `frontend/src/pages/MyTasks.tsx` (lines 1-120 read; full path 329 LOC) — existing Tasks page; uses `useMyTasks + useContributedTasks + useWorkCreation`
- `frontend/src/pages/activity/ActivityPage.tsx` (137 LOC, full read) — existing Activity page; has Statistics panel + Settings sheet (D-13 strips)
- `frontend/src/pages/settings/SettingsPage.tsx` (lines 1-100 read; 342 LOC) — existing Settings page; has all 9 section imports + zod schema
- `frontend/src/components/settings/SettingsLayout.tsx` (full read) — existing layout; uses Tailwind shadcn-style chrome
- `frontend/src/components/settings/SettingsNavigation.tsx` (full read) — 9 nav items defined; mobile uses `<FloatingDock>` (to be replaced)
- `frontend/src/hooks/useAfterAction.ts` (full read; 338 LOC) — `useAfterActions` per-dossier hook + `useAfterAction` detail + `useUpdateAfterAction`
- `frontend/src/hooks/useActivityFeed.ts` (full read) — `useActivityFeed` infinite query, `useEntityFollow`, `useActivityPreferences`
- `frontend/src/hooks/useTasks.ts` (lines 1-100 read) — `useMyTasks / useContributedTasks / useUpdateTask`
- `frontend/src/types/activity-feed.types.ts` (full read) — `ActivityActionType` enum (15 values), `ActivityItem` shape
- `frontend/src/types/work-item.types.ts` (lines 1-100 read) — `Priority = low/medium/high/urgent`, `WorkStatus`, `WorkflowStage`
- `frontend/src/types/settings.types.ts` (lines 1-25 read) — `SettingsSectionId` (9 values)
- `frontend/src/components/signature-visuals/index.ts` (full read) — barrel; **NO `Icon` export**
- `frontend/src/components/signature-visuals/DossierGlyph.tsx` (signature lines read) — `{type, iso?, name?, size?, accent?}`
- `frontend/src/lib/i18n/toArDigits.ts` (existence verified)
- `frontend/src/i18n/index.ts` (lines 1-60 read) — static imports of namespace JSON files
- `frontend/src/i18n/en/` directory listing (35+ files including `settings.json`, `activity-feed.json`)
- `frontend/.size-limit.json` (full read) — 815 KB Total JS budget
- `frontend/package.json` (selected lines) — `@heroui/react@3.0.3`, `@radix-ui/react-dialog@^1.1.15`
- `supabase/functions/after-actions-list/index.ts` (full read; 113 LOC) — model for new Edge Function
- `supabase/migrations/007_briefs.sql` (full read) — `briefs` schema: `is_published BOOLEAN`, `published_date DATE`, no review/approver/page-count fields
- `supabase/migrations/20250930005_create_briefs_table.sql` (full read) — separate `briefs` table for dossier-scoped briefs (JSONB content)
- `backend/src/types/database.types.ts:38351` — `priority_level: ["critical", "urgent", "high", "normal", "medium", "low"]`
- `frontend/design-system/inteldossier_handoff_design/src/app.css:73-100, 202-208, 236-241, 245-265, 341-350, 444-450` — handoff CSS for `.settings-nav / .page-head / .card / .chip / .tbl / .tasks-list / .task-* / .act-list / .act-*`
- `frontend/src/index.css:11-12` — comment confirming Phase 40 ported `.btn / .chip / .tbl / .week-list / .forum-row / .icon-flip / .spinner-row / .pill / .dossier-row / .page*` (and NOT the page-42-specific selectors)
- `.planning/phases/42-remaining-pages/42-CONTEXT.md` (full read; D-01..D-20 + canonical refs)
- `.planning/phases/42-remaining-pages/42-UI-SPEC.md` (full read; pages anatomies + interaction contracts)
- `.planning/REQUIREMENTS.md` lines 88-95 — PAGE-01..05 verbatim
- `.planning/ROADMAP.md` lines 319-341 — Phase 42 success criteria
- `.planning/STATE.md` — confirms Phase 41 just completed; Phase 42 unblocked
- `CLAUDE.md` — IntelDossier design system, RTL rules, work-item terminology, dossier-centric patterns

### Secondary (MEDIUM confidence — inferred from primary)

- HeroUI v3 Tabs `classNames` prop accepts handoff-token mapping (UI-SPEC claim; verified by HeroUI v3 docs availability via MCP — assumed working from Phase 38/41 precedent where it was used successfully)
- Visual baseline 10-snapshot count (5 pages × LTR + AR @ 1280px) follows Phase 41 D-12 precedent — confirmed in CONTEXT.md D-16 reading

### Tertiary (LOW confidence — flagged for validation)

- AR phrasing of activity event templates (A3) — needs linguist review

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — every library + hook + path verified in this session
- Architecture patterns: HIGH — handoff CSS line ranges and component locations confirmed
- Pitfalls: HIGH — each pitfall traces to a specific verified codebase fact
- Data model gaps (Blockers 1 + 2): HIGH — both are direct codebase reads
- i18n strategy: HIGH — confirmed `frontend/src/i18n/` is the runtime source via static-import pattern
- Settings 9-vs-7 deviation: HIGH — verified `SettingsSectionId` enum has 9 values

**Research date:** 2026-05-02
**Valid until:** 2026-06-01 (30 days — no fast-moving libs in scope)

## RESEARCH COMPLETE
