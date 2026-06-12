# Phase 65: Engagement Positions Tab & Legacy Reconciliation - Pattern Map

**Mapped:** 2026-06-12
**Files analyzed:** 13 new/modified surfaces
**Analogs found:** 11 / 13 (Link-Dossier and Docs-Upload CTAs have no working in-repo wiring analog — both are removal candidates under ENGPOS-03)

## Ground Truth (verified this session)

1. **`engagementId` IS a `dossiers.id`.** The `engagement-dossiers` edge function writes `dossiers` (L364, L443, L539) plus the `engagement_dossiers` extension (L314, L472, L582). `ContextTab.tsx` already passes `target_dossier_id: engagementId` (L93-95); `dossiers/engagements/$id.tsx` redirects `$id → $engagementId` 1:1. Therefore the canonical positions link for an engagement is simply `position_dossier_links.dossier_id = engagementId` — the exact table/flow Phase 64 shipped.
2. **The live engagement workspace** is `routes/_protected/engagements/$engagementId.tsx` → `WorkspaceShell` → `WorkspaceTabNav` → routed lazy tabs in `frontend/src/pages/engagements/workspace/`. There is currently **no positions tab/route**.
3. **The legacy `engagement_positions` system is fully orphaned from live UI:** its only frontend reader (`useEngagementPositions`) is consumed solely by `EngagementPositionsSection`, whose only consumer is `EngagementDossierDetail.tsx` — which is imported by **nothing** (unrouted, dead). The `engagements-positions-attach/list/detach` edge functions have **zero frontend callers** and validate against the legacy `engagements` table (attach edge L65), not `dossiers` — they would reject workspace engagement ids anyway.
4. **R15-02 inert CTAs** are precisely inventoried below (9 buttons across 6 files).

## File Classification

| New/Modified File                                                                                                                                            | Role                  | Data Flow                        | Closest Analog                                                                                                                                   | Match Quality |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `frontend/src/routes/_protected/engagements/$engagementId/positions.tsx` (NEW)                                                                               | route (lazy tab)      | —                                | `frontend/src/routes/_protected/dossiers/countries/$id/positions.tsx` (whole file) + `.../engagements/$engagementId/overview.tsx` for param name | exact         |
| `frontend/src/components/workspace/WorkspaceTabNav.tsx` (MOD — add tab entry)                                                                                | component (nav)       | —                                | itself, `WORKSPACE_TABS` L26-33                                                                                                                  | exact         |
| `frontend/src/i18n/en/workspace.json` + `ar/workspace.json` (MOD — `tabs.positions`)                                                                         | config (i18n)         | —                                | existing `tabs.*` keys (both langs verified present)                                                                                             | exact         |
| Engagement positions tab surface                                                                                                                             | component (tab)       | CRUD read + dialog orchestration | `frontend/src/components/positions/DossierPositionsTab.tsx` — reuse directly with `dossierId={engagementId}`                                     | exact         |
| ENGPOS-02 attach persistence                                                                                                                                 | callback              | request-response (edge)          | `DossierPositionsTab.tsx` L230-269 (`Promise.allSettled` + `createPositionDossierLink` + prefix invalidation + honest partial toast)             | exact         |
| `WorkspaceShell.tsx` (MOD — Transition Stage CTA, L92-99)                                                                                                    | component (shell CTA) | request-response                 | `LifecycleStepperBar.tsx` self-handled transitions (L137, L181-225)                                                                              | exact         |
| `pages/engagements/workspace/OverviewTab.tsx` (MOD — 2 CTAs, L335-346)                                                                                       | component (tab CTAs)  | request-response                 | TaskDialog in `AddToDossierDialogs.tsx` L346-373; stepper for Transition Stage                                                                   | role-match    |
| `pages/engagements/workspace/TasksTab.tsx` (MOD — 2 CTAs, L131-134, L181-184)                                                                                | component (tab CTAs)  | request-response                 | TaskDialog in `AddToDossierDialogs.tsx`                                                                                                          | role-match    |
| `pages/engagements/workspace/CalendarTab.tsx` (MOD — 2 CTAs, L168-171, L198-201)                                                                             | component (tab CTAs)  | request-response                 | EventDialog in `AddToDossierDialogs.tsx` L701-833 (writes `calendar_entries` via `calendar-create`)                                              | role-match    |
| `pages/engagements/workspace/ContextTab.tsx` (MOD — 2 CTAs, L196-199, L224-227)                                                                              | component (tab CTAs)  | —                                | **none** (see No Analog Found)                                                                                                                   | —             |
| `pages/engagements/workspace/DocsTab.tsx` (MOD — 1 CTA, L152-155)                                                                                            | component (tab CTA)   | file-I/O                         | **none** — known backend gap (attachment upload tracked in `.planning/todos`)                                                                    | —             |
| Legacy deletions: `hooks/useEngagementPositions.ts`, `components/positions/EngagementPositionsSection.tsx`, `components/dossier/EngagementDossierDetail.tsx` | dead-code removal     | —                                | import-graph verification (grep before delete; all three confirmed dead this session)                                                            | exact         |
| Tests (new tab route / CTA wiring)                                                                                                                           | test (RTL unit)       | —                                | `frontend/src/components/positions/__tests__/NewPositionDialog.test.tsx` (Phase 64 — decision-tagged names, mutable mock state)                  | exact         |

---

## Pattern Assignments

### `routes/_protected/engagements/$engagementId/positions.tsx` (NEW route)

**Primary analog:** `frontend/src/routes/_protected/dossiers/countries/$id/positions.tsx` — this is the _exact_ precedent: a routed tab that lazy-loads `DossierPositionsTab` and passes the route param as `dossierId`. Copy whole-file, adapting the param name:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { lazy, Suspense } from 'react'
import { TabSkeleton } from '@/components/workspace/TabSkeleton'

const DossierPositionsTab = lazy(() =>
  import('@/components/positions/DossierPositionsTab').then((m) => ({
    default: m.DossierPositionsTab,
  })),
)

export const Route = createFileRoute('/_protected/dossiers/countries/$id/positions')({
  component: CountryPositionsRoute,
})

function CountryPositionsRoute(): ReactElement {
  const { id } = Route.useParams()
  return (
    <Suspense fallback={<TabSkeleton type="list" />}>
      <DossierPositionsTab dossierId={id} />
    </Suspense>
  )
}
```

For the workspace, the route id is `/_protected/engagements/$engagementId/positions` and the param is `engagementId` (see `overview.tsx` for the sibling-route shape — `React.lazy` + `Suspense` + `TabSkeleton`). Pass `dossierId={engagementId}` — valid because engagementId is a dossiers.id (Ground Truth #1).

**Decision for planner:** render `DossierPositionsTab` directly in the route file (countries precedent, minimal) vs. a thin `pages/engagements/workspace/PositionsTab.tsx` default-export wrapper (workspace convention — every sibling tab is a default-export page using `useParams({ from: '/_protected/engagements/$engagementId' })`, `useTranslation('workspace')`, `dir={direction}`). Either works; the countries route proves direct reuse is fine.

**Known wrinkle (flag in plan):** `DossierPositionsTab` L47 calls `useDossier(dossierId)` and its comment assumes a cache hit on `dossierKeys.detail` ("zero extra network"). In the engagement workspace the shell loads `engagementKeys.detail` via the `engagement-dossiers` edge — NOT `dossierKeys.detail` — so `useDossier(engagementId)` will do a real PostgREST fetch of the `dossiers` row. Functionally correct (the row exists; create-button stays disabled until it resolves per the WR-03 guard at L106-113), just not instant. Acceptable; do not "optimize" by faking the cache.

### `components/workspace/WorkspaceTabNav.tsx` (MOD)

**Analog:** itself. Add one entry to `WORKSPACE_TABS` (L26-33); everything else (active matching, RTL, scroll-snap, `min-h-11`) is generic:

```typescript
const WORKSPACE_TABS: WorkspaceTab[] = [
  { key: 'overview', labelKey: 'tabs.overview', path: 'overview' },
  { key: 'context', labelKey: 'tabs.context', path: 'context' },
  { key: 'tasks', labelKey: 'tabs.tasks', path: 'tasks' },
  { key: 'calendar', labelKey: 'tabs.calendar', path: 'calendar' },
  { key: 'docs', labelKey: 'tabs.docs', path: 'docs' },
  { key: 'audit', labelKey: 'tabs.audit', path: 'audit' },
]
```

Insert `{ key: 'positions', labelKey: 'tabs.positions', path: 'positions' }` (placement: planner choice — after `context` keeps intel surfaces together). Links are `to={'/engagements/$engagementId/' + tab.path}` so the new route file is the only other requirement.

### i18n `workspace.json` (MOD, en + ar)

**Analog:** existing `tabs` block. en: `{"overview": "Overview", "context": "Context", ...}`; ar: `{"overview": "نظرة عامة", "context": "السياق", ...}`. Add `tabs.positions` to **both** files — keys missing from `ar/` silently fall back to English (project memory; broke AR before). The `workspace` ns is already registered (live tabs render from it). The tab body reuses the `positions` ns (`positions:dossier_tab.*`), already bilingual from Phase 64.

### ENGPOS-02: attach persists + renders + invalidates

**Analog:** `DossierPositionsTab.tsx` L230-269 — already the live-verified R12-06 fix, and it ships with the tab for free when the component is reused:

```tsx
onAttach={async (positionIds) => {
  const results = await Promise.allSettled(
    positionIds.map((positionId) =>
      createPositionDossierLink(positionId, { dossier_id: dossierId }),
    ),
  )
  const failed = results.filter((r) => r.status === 'rejected').length
  await queryClient.invalidateQueries({
    queryKey: ['dossier-position-links', dossierId],
  })
  if (failed > 0) {
    toast.error(t('positions:attach.attachPartialError', { failed, total: positionIds.length, defaultValue: '…' }))
  } else {
    toast.success(t('positions:attach.attachSuccess', { count: positionIds.length, defaultValue: '…' }))
  }
  setShowAttachDialog(false)
}}
```

- Repository: `createPositionDossierLink` → `apiPost('/positions-dossiers-create?positionId=…')` (`domains/positions/repositories/positions.repository.ts` L190-194; detach exists too: `deletePositionDossierLink` → `/positions-dossiers-delete`, L200-207).
- `AttachPositionDialog` (`components/positions/AttachPositionDialog.tsx`): its `engagementId`/`dossierId` props are **declared but never destructured/used** (L32-48) — persistence is 100% the caller's `onAttach`. Don't add logic keyed on those props.
- `link_type` defaults to `'related_to'` at the edge; pass `link_type: 'applies_to'` explicitly only if the phase decides engagement attaches are "applies to" links (Phase 64 D-09 made that call for the create dialog; attach-existing intentionally stayed default).
- **Live verification step (ENGPOS-02 requires it):** confirm a `position_dossier_links` row with `dossier_id = <engagement dossier id>` appears via Supabase MCP, and the tab re-renders it after invalidation.

### ENGPOS-03: R15-02 inert CTA inventory + wiring analogs

Exact inventory (every `disabled` no-op tagged R15-02, plus one untagged inert button):

| #   | File / Lines                         | CTA (i18n key)                                                                          | Disposition analog                                                                                                                                                                                                     |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `WorkspaceShell.tsx` L92-99          | `actions.transitionStage` — **no onClick at all** (inert even when enabled)             | `LifecycleStepperBar` already self-handles transitions via `useLifecycleTransition` internally (L137, L181-196, L211-225) and renders directly below this button → **redundant; remove** (or scroll/focus the stepper) |
| 2   | `OverviewTab.tsx` L335-337           | `actions.transitionStage`, disabled                                                     | same as #1 — stepper is the working surface                                                                                                                                                                            |
| 3   | `OverviewTab.tsx` L343-346           | `actions.createTask`, disabled                                                          | TaskDialog, `AddToDossierDialogs.tsx` L346-373 (see below)                                                                                                                                                             |
| 4   | `TasksTab.tsx` L131-134              | `empty.tasks.action`, disabled (empty state)                                            | TaskDialog                                                                                                                                                                                                             |
| 5   | `TasksTab.tsx` L181-184              | `actions.createTask`, disabled (header)                                                 | TaskDialog                                                                                                                                                                                                             |
| 6   | `CalendarTab.tsx` L168-171           | `empty.calendar.action`, disabled (empty state)                                         | EventDialog, `AddToDossierDialogs.tsx` L701-833                                                                                                                                                                        |
| 7   | `CalendarTab.tsx` L198-201           | `actions.addEvent`, disabled (header; TODO notes events API lacks engagement_id filter) | EventDialog                                                                                                                                                                                                            |
| 8   | `ContextTab.tsx` L196-199 + L224-227 | `empty.context.action` / `actions.linkDossier`, disabled                                | **no analog** — ContextTab's "linked dossiers" are _derived_ from participants/hosts (L100-143), not a writable link table → **remove** (see No Analog Found)                                                          |
| 9   | `DocsTab.tsx` L152-155               | `docs.upload`, disabled                                                                 | **no analog** — upload needs backend (known P0 in `.planning/todos`) → **remove or keep-with-tracking**                                                                                                                |

**Working Create Task / Add Event wiring** — engagement IS a dossier, so the dossier Add-to-Dossier dialogs work verbatim with an engagement-typed `DossierContextForAction`. TaskDialog submit (`AddToDossierDialogs.tsx` L346-373):

```typescript
const result = await createTask.mutateAsync({ title, description, assignee_id: assigneeId, priority })
if (result?.id) {
  await createLinks.mutateAsync(buildDossierLinkPayload('task', result.id, dossierContext))
  await queryClient.invalidateQueries({
    queryKey: ['dossier-tab', 'work_items', dossierContext.dossier_id],
  })
  ...
}
toast.success(t('addToDossier.success.task'))
```

Build the context the same way `DossierPositionsTab.tsx` L60-68 does (from `useDossier(engagementId)`), or from the already-loaded `useEngagement` profile:

```typescript
const dossierContext: DossierContextForAction = {
  dossier_id: engagementId,
  dossier_type: 'engagement',
  dossier_name_en: engagement.name_en,
  dossier_name_ar: engagement.name_ar,
  inheritance_source: 'direct',
}
```

After a task create in the workspace, also invalidate the kanban reader TasksTab uses (`useEngagementKanban` — `domains/engagements/hooks/useEngagementKanban.ts`) so the board shows the new card; after an event create, invalidate whatever key CalendarTab reads (check its hook at build time) — this is the R12-04 bug class the EventDialog comment (L743-752) documents.

### Legacy reconciliation (deletions)

**Verification pattern:** grep the import graph before deleting (done this session; re-verify at execution time):

| Artifact                                                           | Status                                                                                                            | Action                                                                                                                                                               |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/components/dossier/EngagementDossierDetail.tsx`      | imported by nothing                                                                                               | delete                                                                                                                                                               |
| `frontend/src/components/positions/EngagementPositionsSection.tsx` | only consumer is the file above                                                                                   | delete (takes the inert no-op `onAttach={async () => setShowAttachDialog(false)}` at L162-170 with it)                                                               |
| `frontend/src/hooks/useEngagementPositions.ts`                     | only consumer is the section above; direct PostgREST on `engagement_positions`, key `['engagement-positions', …]` | delete                                                                                                                                                               |
| `frontend/src/pages/engagements/EngagementDetailPage.tsx`          | unrouted (only `EngagementsListPage` is routed; workspace replaced it in Phase 11)                                | out of strict scope — mention, don't delete unless plan includes it (Karpathy: surgical changes)                                                                     |
| `supabase/functions/engagements-positions-{attach,list,detach}`    | zero frontend callers; keyed on legacy `engagements` table                                                        | mark deprecated in plan; actual undeploy is a Supabase CLI action — planner decision                                                                                 |
| `PositionSuggestionsPanel.tsx` / `BriefingPackGenerator.tsx`       | only consumer is `EngagementPositionsSection`                                                                     | becomes dead after deletion — planner decides delete vs. keep-for-later; **do not** wire into the new tab as-is (both sit on the legacy id space, see Anti-Patterns) |

Check `frontend/src/i18n/{en,ar}/positions.json` `engagement_section.*` keys after removal — orphaned keys are harmless but the plan may sweep them.

### Tests

**Analog:** `frontend/src/components/positions/__tests__/NewPositionDialog.test.tsx` (Phase 64) — module mocks with mutable test state, decision-tagged test names (`it('… (ENGPOS-02)')`), `vi.mock('react-i18next', …)` + `vi.mock('@/hooks/useDirection', …)`. For the tab: mock `useDossierPositionLinks`, `useDossier`, and `positions.repository.createPositionDossierLink` (reject one promise for the partial-failure case). Run: `cd frontend && pnpm exec vitest run src/components/positions/__tests__/<file>`.

---

## Shared Patterns

### Query keys in play

| Key                                                                                         | Factory/Source                                                    | Used by                                                                                                                              |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `['dossier-position-links', dossierId, filters]`                                            | `frontend/src/hooks/useDossierPositionLinks.ts` (L121-126)        | tab reader; invalidate by prefix `['dossier-position-links', engagementId]`                                                          |
| `engagementKeys.*` — `all: ['engagements']`, `detail(id)`, `participants(id)`, `agenda(id)` | `frontend/src/domains/engagements/hooks/useEngagements.ts` L30-38 | workspace shell + tabs                                                                                                               |
| `['positions', 'list']`                                                                     | `useCreatePosition` onSuccess                                     | invalidated automatically on create                                                                                                  |
| `dossierOverviewKeys.detail(dossierId)`                                                     | `frontend/src/services/dossier-overview.service.ts` L1127-1136    | dossier overview reads `position_dossier_links` directly — invalidate alongside if the engagement also surfaces in dossier overviews |
| `['dossier-tab', 'work_items', dossierId]`                                                  | TaskDialog precedent                                              | task-create invalidation                                                                                                             |
| `['engagement-positions', …]`                                                               | legacy `useEngagementPositions`                                   | **do not extend — delete**                                                                                                           |

### Edge functions / repositories involved

- **Canonical:** `positions-dossiers-create` / `positions-dossiers-get` / `positions-dossiers-delete` via `domains/positions/repositories/positions.repository.ts`; `positions-create` (NewPositionDialog); `engagement-dossiers` (workspace data).
- **Auth/POST plumbing:** `frontend/src/lib/api-client.ts` — `apiPost` throws on any non-2xx and **discards the error body** (bilingual `{error, error_ar}` never reaches UI); fallback toasts must be locally localized (Phase 64 Pitfall 3). Do not modify `api-client`.

### RTL / design rules (all new/modified UI)

`isRTL` from `useDirection()`; logical props only (`ms-*`, `me-*`, `text-start`); `min-h-11` on buttons; tokens only, no raw hex / no Tailwind color literals; colon-form i18n keys across namespaces (`t('positions:dossier_tab.…')` — dot-form leaks raw keys, project memory). Workspace tab pages set `dir={direction}` on the root div.

### ESLint / naming traps

`components/**` files PascalCase, `hooks/**` camelCase with `use` prefix, route files follow TanStack conventions; explicit return types on all functions (`ReactElement`, not implicit); CI lints the whole repo at `--max-warnings 0` even though pre-commit only checks staged files.

---

## Anti-Patterns (legacy that looks canonical but is not)

1. **`engagement_positions` table** — the legacy junction. Canonical is `position_dossier_links` keyed by the engagement's `dossiers.id`. Never write or read `engagement_positions` in new code.
2. **`engagements` table** — the LEGACY engagement system (memory-confirmed: `engagement_dossiers` is the extension table). The `engagements-positions-attach` edge validates `from('engagements')` (L65) so it 404s for canonical workspace ids. Do not "fix" these edges — they are deprecation targets.
3. **`positions-list` edge dossier filter** (`supabase/functions/positions-list/index.ts` L103-105) joins `engagement_positions` for its dossier filter — a latent stale path. `AttachPositionDialog` calls `usePositions({ status: 'published' })` without that filter, so it's safe today; do not start passing a dossier filter to `positions-list` expecting canonical results.
4. **`getPositionSuggestions`** (`positions.repository.ts` L138-146) targets `/engagements/${id}/positions/suggestions` — an express-style path, not a deployed flat edge name; the whole suggestions panel is legacy-id-space. Don't port `PositionSuggestionsPanel` into the new tab without re-grounding it.
5. **`briefing-packs-generate` edge reads `engagement_positions`** — if briefing-pack generation is ever resurrected, it will see zero canonical attaches. Cross-surface hazard to record, not fix, this phase.
6. **Dead pages:** `EngagementDetailPage.tsx` (has its own local-state Tabs incl. a Briefs tab) and `EngagementDossierDetail.tsx` — both unrouted. Do not copy their tab patterns (local `useState` tabs); the workspace standard is URL-driven routed tabs.
7. **`AttachPositionDialog`'s `engagementId`/`dossierId` props are vestigial** — never used internally. All persistence lives in the caller's `onAttach`.
8. **Re-enabling a CTA without a real handler** is the R15-02 bug class itself; and double-toasting when a mutation hook already toasts (CommitmentDialog precedent in `AddToDossierDialogs.tsx` L510-516) is the companion trap.

## No Analog Found

| Concern                       | Role                     | Reason                                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ContextTab "Link Dossier" CTA | component CTA            | Linked dossiers in ContextTab are **derived** read-only data (host country/org + participant dossiers, L100-143) — there is no engagement→dossier link-editing surface or table-backed write path in the repo. ENGPOS-03 disposition: **remove the buttons** (re-enabling would require net-new backend design, out of scope). |
| DocsTab "Upload" CTA          | component CTA (file-I/O) | Attachment upload is a known backend gap (P0 tracked in `.planning/todos` since the data-entry polish sweep). ENGPOS-03 disposition: **remove** (or keep only if the plan explicitly funds the backend; "honest not fixed" precedent from PR #35).                                                                             |

## Metadata

**Analog search scope:** `frontend/src/routes/_protected/engagements/**`, `frontend/src/routes/_protected/dossiers/**/positions.tsx`, `frontend/src/pages/engagements/**`, `frontend/src/components/{workspace,positions,dossier,engagements}/`, `frontend/src/domains/{engagements,positions}/**`, `frontend/src/hooks/`, `frontend/src/i18n/{en,ar}/`, `supabase/functions/{engagement-dossiers,engagements-positions-*,positions-list,briefing-packs-generate}/`
**Files scanned:** 14 read in full, 12 targeted/grepped; Phase 64 PATTERNS/CONTEXT consumed as upstream (Phase 65 has no CONTEXT.md/RESEARCH.md yet)
**Pattern extraction date:** 2026-06-12
