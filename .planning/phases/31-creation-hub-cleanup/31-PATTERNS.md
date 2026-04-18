# Phase 31: Creation Hub and Cleanup - Pattern Map

**Mapped:** 2026-04-18
**Files analyzed:** 18 (1 new component, 1 new banner, 1 new route swap, 8 wizard configs, 6 call sites, 5 deletions, i18n audit)
**Analogs found:** 12 / 13 (banner has no existing HeroUI `Alert` consumer — pattern comes from HeroUI v3 docs + the shadcn `Alert` already used by `DossierListPage`)

---

## File Classification

| New / Modified / Deleted File                                                                                                                                | Role                       | Data Flow                     | Closest Analog                                                                                                                           | Match Quality                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `frontend/src/pages/dossiers/CreateDossierHub.tsx` (NEW)                                                                                                     | page + card-grid component | request-response (navigation) | `frontend/src/components/dossier/DossierTypeStatsCard.tsx` + `DossierListPage.tsx` type-stats grid                                       | role-match (card grid + icon + bilingual `t(`type.${type}`)`) |
| `frontend/src/components/dossier/wizard/StepGuidanceBanner.tsx` (NEW — planner's final path)                                                                 | UI component               | event-driven (dismiss)        | `frontend/src/components/guided-tours/TourContext.tsx` (localStorage dismiss) + shadcn `@/components/ui/alert` used in `DossierListPage` | role-match (Alert + dismiss + localStorage)                   |
| `frontend/src/routes/_protected/dossiers/create.tsx` (MODIFIED)                                                                                              | route                      | request-response              | itself (component swap only)                                                                                                             | exact                                                         |
| `frontend/src/hooks/useContextAwareFAB.ts` (MODIFIED)                                                                                                        | hook                       | request-response              | itself (extend existing route-prefix lookup)                                                                                             | exact                                                         |
| `frontend/src/components/dossier/wizard/config/{country,organization,forum,engagement,topic,working-group,person,elected-official}.config.ts` (MODIFIED × 8) | config                     | transform                     | `country.config.ts` (canonical step shape)                                                                                               | exact                                                         |
| `frontend/src/pages/dossiers/DossierListPage.tsx` (MODIFIED)                                                                                                 | page                       | request-response              | itself (line 506 `<Link to="/dossiers/create">` + lines 884, 895 `navigate({to:'/dossiers/create'})`)                                    | exact                                                         |
| `frontend/src/pages/engagements/EngagementsListPage.tsx` (MODIFIED)                                                                                          | page                       | request-response              | itself (line 97)                                                                                                                         | exact                                                         |
| `frontend/src/components/elected-officials/ElectedOfficialListTable.tsx` (MODIFIED)                                                                          | component                  | request-response              | itself (line 169)                                                                                                                        | exact                                                         |
| `frontend/src/components/empty-states/TourableEmptyState.tsx` (MODIFIED)                                                                                     | component                  | callback                      | itself (`onCreate?: () => void` prop)                                                                                                    | exact                                                         |
| `frontend/src/components/progressive-disclosure/ProgressiveEmptyState.tsx` (MODIFIED)                                                                        | component                  | callback                      | itself (`primaryAction.onClick`)                                                                                                         | exact                                                         |
| `frontend/src/components/dossier/sections/MeetingSchedule.tsx` (UNCHANGED anchor)                                                                            | component                  | request-response              | itself (lines 57, 107 — stays on `/dossiers/create`)                                                                                     | exact                                                         |
| `frontend/src/components/dossier/DossierCreateWizard.tsx` (DELETE)                                                                                           | legacy wizard              | CRUD                          | —                                                                                                                                        | n/a                                                           |
| `frontend/src/pages/dossiers/DossierCreatePage.tsx` (DELETE)                                                                                                 | legacy page                | request-response              | —                                                                                                                                        | n/a                                                           |
| `frontend/src/components/dossier/wizard-steps/Shared.ts` (DELETE)                                                                                            | legacy util                | transform                     | —                                                                                                                                        | n/a                                                           |
| `frontend/src/components/dossier/wizard-steps/ClassificationStep.tsx` (DELETE)                                                                               | legacy step                | CRUD                          | —                                                                                                                                        | n/a                                                           |
| `frontend/src/components/dossier/wizard-steps/TypeSelectionStep.tsx` (DELETE)                                                                                | legacy step                | CRUD                          | —                                                                                                                                        | n/a                                                           |

---

## Plan 31-01 — `CreateDossierHub` component + route swap

### NEW — `frontend/src/pages/dossiers/CreateDossierHub.tsx` (page, request-response)

**Closest analog:** `frontend/src/components/dossier/DossierTypeStatsCard.tsx` + `DossierListPage.tsx` lines 74-82 (DOSSIER_TYPES array) and 520-555 (grid container + per-type map). Reuse the per-type icon switch from `DossierTypeStatsCard` (lines 54-75) rather than re-authoring.

**Imports pattern to mirror** (from `DossierTypeStatsCard.tsx` lines 14-36):

```typescript
import { useTranslation } from 'react-i18next'
import { m } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Globe, Building2, Users, Calendar, Target, Briefcase, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DossierType } from '@/services/dossier-api'
import { useDirection } from '@/hooks/useDirection'
```

**DOSSIER_TYPES list pattern** (from `DossierListPage.tsx` lines 74-82) — **MUST add `elected_official`** (the list page currently omits it; hub needs all 8 per D-02):

```typescript
const DOSSIER_TYPES: DossierType[] = [
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person',
  'elected_official',
]
```

**Card-grid container pattern** (from `DossierListPage.tsx` lines 527, 533 — adapted to D-01 `2 / 3 / 4` cols, not the list's `2 / 3 / 4 / 5 / 6 / 7`):

```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
  {DOSSIER_TYPES.map((type) => (
    <CreateDossierHubCard key={type} type={type} />
  ))}
</div>
```

**Per-card link pattern** (from `ElectedOfficialListTable.tsx` lines 168-172 — `<Button asChild><Link to="…">`):

```tsx
<Link to={`/dossiers/${getDossierRouteSegment(type)}/create`} className="min-h-11">
  <Card className={cn('cursor-pointer h-full transition-all duration-300 hover:shadow-lg')}>
    {/* icon + t(`type.${type}`) + one-sentence description via t(`create.hubDescription.${type}`) */}
  </Card>
</Link>
```

**Per-type icon helper** — **copy verbatim** from `DossierTypeStatsCard.tsx` `getTypeIcon()` lines 54-75; extend the `switch` with an `elected_official` case (e.g. `User`) because the existing helper doesn't cover it.

**Header pattern** (from `DossierCreatePage.tsx` lines 46-67 — the teardown target — salvage the header copy keys `create.title`, `create.subtitleSelectType`, then delete the page):

```tsx
<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
    <div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-start">{t('create.title')}</h1>
      <p className="text-sm sm:text-base text-muted-foreground text-start mt-1 sm:mt-2">
        {t('create.subtitleSelectType')}
      </p>
    </div>
  </div>
</div>
```

### MODIFIED — `frontend/src/routes/_protected/dossiers/create.tsx` (route, request-response)

**Current state** (the only lines that change — lines 9 and 12):

```tsx
import { DossierCreatePage } from '@/pages/dossiers/DossierCreatePage'

export const Route = createFileRoute('/_protected/dossiers/create')({
  component: DossierCreatePage,
})
```

**Swap to:** `import { CreateDossierHub } from '@/pages/dossiers/CreateDossierHub'` + `component: CreateDossierHub`. Route path stays.

---

## Plan 31-02 — Step guidance banner + i18n copy + wizard config wiring

### NEW — `StepGuidanceBanner` (UI component, event-driven)

**Closest analog — HeroUI v3 Alert:** No existing consumer in the codebase (grep for `from '@heroui/react'` shows only `Modal`, `Button`, `Dropdown`, `useOverlayState`). Pick `Alert` from `@heroui/react` per D-10 and CLAUDE.md HeroUI v3 strategy. Fallback for test-mode fidelity: the shadcn `Alert` in `DossierListPage.tsx` line 69 is already imported (`@/components/ui/alert`) — confirms the shadcn wrapper is available if the HeroUI v3 API surface isn't yet migrated.

**Dismiss-persistence analog** (from `frontend/src/components/guided-tours/TourContext.tsx` lines 267-273):

```typescript
try {
  const dismissed = loadDismissedTours()
  dismissed.add(tourId)
  localStorage.setItem(TOUR_DISMISSED_KEY, JSON.stringify([...dismissed]))
} catch {
  // Ignore storage errors
}
```

**Banner skeleton (to author — drawing on the analog + D-12 key pattern):**

```tsx
import { Alert } from '@heroui/react' // HeroUI v3 per D-10
import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'

interface StepGuidanceBannerProps {
  type: DossierType
  stepId: string
  guidanceKey: string // e.g. 'wizard.steps.basic.guidance' in the type's namespace
  namespace: string // e.g. 'country-wizard'
}

export function StepGuidanceBanner({
  type,
  stepId,
  guidanceKey,
  namespace,
}: StepGuidanceBannerProps) {
  const { t } = useTranslation(namespace)
  const storageKey = `dossier-wizard:guidance:${type}:${stepId}` // D-12
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === '1'
    } catch {
      return false
    }
  })
  if (dismissed) return null
  return (
    <Alert
      variant="flat"
      icon={<Info />}
      onClose={() => {
        try {
          localStorage.setItem(storageKey, '1')
        } catch {}
        setDismissed(true)
      }}
    >
      {t(guidanceKey)}
    </Alert>
  )
}
```

### MODIFIED × 8 — `frontend/src/components/dossier/wizard/config/*.config.ts` (config, transform)

**Current step shape** (from `country.config.ts` lines 10-26 — canonical; all 8 configs share this shape):

```typescript
steps: [
  { id: 'basic', title: 'form-wizard:steps.basicInfo', description: 'form-wizard:steps.basicInfoDesc' },
  { id: 'country-details', title: 'form-wizard:steps.countryDetails', description: 'form-wizard:steps.countryDetailsDesc' },
  { id: 'review', title: 'form-wizard:steps.review', description: 'form-wizard:steps.reviewDesc' },
],
```

**Extension pattern — add optional `guidanceKey` per D-13** (planner lands this in `WizardStepConfig` at `config/types.ts` first, then threads through each step entry):

```typescript
steps: [
  { id: 'basic', title: '…', description: '…', guidanceKey: 'country-wizard:wizard.steps.basic.guidance' },
  { id: 'country-details', title: '…', description: '…', guidanceKey: 'country-wizard:wizard.steps.country-details.guidance' },
  { id: 'review', title: '…', description: '…', guidanceKey: 'country-wizard:wizard.steps.review.guidance' },
],
```

Config files to touch (Glob confirmed 8): `country.config.ts`, `organization.config.ts`, `forum.config.ts`, `engagement.config.ts`, `topic.config.ts`, `working-group.config.ts`, `person.config.ts`, `elected-official.config.ts` (verify file name; Glob shows `working-group.config.ts` exists; no `elected-official.config.ts` found in `wizard/config/` via the directory listing — planner confirms Phase 30 landed this file before Plan 31-02 runs).

### i18n keys added (EN + AR) per D-13

Each of the 8 per-type wizard namespaces (`country-wizard`, `organization-wizard`, `forum-wizard`, `engagement-wizard`, `topic-wizard`, `working-group-wizard`, `person-wizard`, `elected-official-wizard`) gains:

```json
{
  "wizard": {
    "steps": {
      "basic": { "guidance": "One sentence per D-11 …" },
      "<type>-details": { "guidance": "…" },
      "review": { "guidance": "…" }
    }
  }
}
```

---

## Plan 31-03 — UX-04 reference updates

### MODIFIED — `frontend/src/hooks/useContextAwareFAB.ts` (hook, request-response)

**Line 77 — default `handleCreateDossier` (stays as hub fallback per D-08):**

```typescript
const handleCreateDossier = useCallback(() => {
  if (config.onCreateDossier) {
    config.onCreateDossier()
  } else {
    navigate({ to: '/dossiers/create' }) // stays — hub fallback
  }
}, [config.onCreateDossier, navigate])
```

**Line 299 — current route-prefix check (stays as-is; this is the speed-dial-actions gate, not a creation target):**

```typescript
if (currentRoute.startsWith('/dossiers/') && currentRoute !== '/dossiers/create') { … }
```

**D-09 extension pattern to add** — following the existing `currentRoute.startsWith('/dossiers/…')` pattern:

```typescript
// New typed-route lookup (D-09). Placement: near the top of the hook, before handleCreateDossier.
const TYPED_LIST_TO_WIZARD: Record<string, string> = {
  '/dossiers/countries': '/dossiers/countries/create',
  '/dossiers/organizations': '/dossiers/organizations/create',
  '/dossiers/forums': '/dossiers/forums/create',
  '/dossiers/engagements': '/dossiers/engagements/create',
  '/dossiers/topics': '/dossiers/topics/create',
  '/dossiers/working_groups': '/dossiers/working_groups/create',
  '/dossiers/persons': '/dossiers/persons/create',
  '/dossiers/elected-officials': '/dossiers/elected-officials/create',
}
```

Then `handleCreateDossier` resolves via `TYPED_LIST_TO_WIZARD[currentRoute] ?? '/dossiers/create'`.

### MODIFIED — `frontend/src/pages/dossiers/DossierListPage.tsx` (page, request-response)

**Three call sites to repoint** (line numbers confirmed by grep):

- **Line 506:** `<Link to="/dossiers/create">` — hub fallback when `filters.type` is undefined; direct to `/dossiers/${routeSegment(filters.type)}/create` when a type filter is active.
- **Line 884:** `onCreateEntity={(_suggestion) => navigate({ to: '/dossiers/create' })}` — stays on hub (typeless suggestion context).
- **Line 895:** `onCreateNew={() => navigate({ to: '/dossiers/create' })}` — stays on hub (no active type filter).

Use `getDossierRouteSegment` from `@/lib/dossier-routes` for the type→segment lookup.

### MODIFIED — `frontend/src/pages/engagements/EngagementsListPage.tsx` (page, request-response)

**Line 97 — current:**

```typescript
const handleCreateEngagement = () => {
  navigate({ to: '/dossiers/create' })
}
```

**Change to:** `navigate({ to: '/dossiers/engagements/create' })` per D-07.

### MODIFIED — `frontend/src/components/elected-officials/ElectedOfficialListTable.tsx` (component, request-response)

**Line 169 — current:**

```tsx
<Button asChild className="mt-4 min-h-11">
  <Link to="/dossiers/create">
    <Plus className="h-4 w-4 me-2" />
    {t('list.add')}
  </Link>
</Button>
```

**Change to:** `<Link to="/dossiers/elected-officials/create">` per D-07.

### MODIFIED — `frontend/src/components/empty-states/TourableEmptyState.tsx` (component, callback)

**Current prop shape** (lines 47-69):

```typescript
interface TourableEmptyStateProps {
  entityType: TourableEntityType
  onCreate?: () => void
  onImport?: () => void
  isFirstItem?: boolean
  // … others
}
```

**Extension per D-07:** callers are already free to pass a type-specific `onCreate={() => navigate('/dossiers/countries/create')}`. Leave the JSDoc example at line 111 updated (currently shows `navigate('/dossiers/create')` — change to a typed example), and update typed-list consumers in a grep-pass.

### MODIFIED — `frontend/src/components/progressive-disclosure/ProgressiveEmptyState.tsx` (component, callback)

**Current JSDoc example** (lines 170-174):

```typescript
*   primaryAction={{
*     label: t('dossiers.create'),
*     onClick: () => navigate('/dossiers/create'),
*     icon: Plus,
*   }}
```

Same approach: update the JSDoc to a typed example; callers at typed list routes pass the per-type wizard path.

### UNCHANGED (anchor) — `frontend/src/components/dossier/sections/MeetingSchedule.tsx`

**Lines 57 and 107** — currently `<Link to="/dossiers/create" search={{ type: 'engagement', parentForumId: dossier.id }}>`. Per D-08 this call site **stays on hub**. Planner records as "intentionally not migrated" and removes the `search={{ type: 'engagement', … }}` query params only if D-05 (hub is stateless — no `?type=X` preselect) mandates it. Recommendation: strip the search param since the hub ignores it.

---

## Plan 31-04 — Cleanup

### DELETE — production files

All five are confirmed production sources (no test pair exists — grep for `*.test.{ts,tsx}` against these file names returned 0 matches). Current bytes noted from directory listing.

| File                                                                  | Verified present | Importers (non-legacy)                                                                            |
| --------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `frontend/src/components/dossier/DossierCreateWizard.tsx`             | yes              | only `DossierCreatePage.tsx` (also deleted)                                                       |
| `frontend/src/pages/dossiers/DossierCreatePage.tsx`                   | yes              | only `routes/_protected/dossiers/create.tsx` (swapped in Plan 31-01)                              |
| `frontend/src/components/dossier/wizard-steps/Shared.ts`              | yes              | only `DossierCreateWizard.tsx` + `ClassificationStep.tsx` + `TypeSelectionStep.tsx` (all deleted) |
| `frontend/src/components/dossier/wizard-steps/ClassificationStep.tsx` | yes              | only `DossierCreateWizard.tsx`                                                                    |
| `frontend/src/components/dossier/wizard-steps/TypeSelectionStep.tsx`  | yes              | only `DossierCreateWizard.tsx` + imports `DossierTypeSelector`                                    |

Grep evidence (producer files only; no consumer test files exist):

```
frontend/src/components/dossier/wizard-steps/Shared.ts
frontend/src/pages/dossiers/DossierCreatePage.tsx
frontend/src/components/dossier/wizard-steps/TypeSelectionStep.tsx
frontend/src/components/dossier/wizard-steps/ClassificationStep.tsx
frontend/src/components/dossier/DossierCreateWizard.tsx
```

### DossierTypeSelector orphan audit (D-17)

**Current consumers** (grep for `DossierTypeSelector`):

- `frontend/src/components/dossier/wizard-steps/TypeSelectionStep.tsx` — deleted in Plan 31-04.
- `frontend/src/components/dossier/DossierTypeSelector.tsx` — the file itself.

**After Plan 31-04 lands:** `DossierTypeSelector` has zero remaining consumers. Per D-17, **leave it in place** and record a follow-up "orphan verified — safe to delete" todo rather than widening this phase.

### Playwright / E2E audit

Grep for `'/dossiers/create'` against `tests/` and `**/*.spec.ts`:

- `tests/` contains **0 Playwright specs** referencing the old flow (only `tests/accessibility/ACCESSIBILITY_AUDIT.md` which is documentation, not executable).
- `**/*.spec.ts` grep returned 0 files.

**Action for planner:** Plan 31-04 issues a confirmatory grep during execution; if still zero hits, skip the Playwright deletion task.

### i18n audit — `dossier:create.*` keys (D-18)

**Current legacy-wizard-only consumers** (grep evidence):

| Key                                 | Sole consumer                   | Disposition                                                                                          |
| ----------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `dossier:create.title`              | `DossierCreatePage.tsx` line 52 | **Keep and re-use** in `CreateDossierHub.tsx` header (same string reads as hub title)                |
| `dossier:create.subtitleSelectType` | `DossierCreatePage.tsx` line 55 | **Keep and re-use** in hub subtitle                                                                  |
| `dossier:create.cancel`             | `DossierCreatePage.tsx` line 65 | **Delete** — hub has no cancel button (per D-01, user picks a type or navigates away via breadcrumb) |
| `dossier:create.helpTitle`          | `DossierCreatePage.tsx` line 79 | **Delete** — hub has no help panel                                                                   |
| `dossier:create.helpText`           | `DossierCreatePage.tsx` line 79 | **Delete** — same reason                                                                             |

**Grep script the planner runs in Plan 31-04 execute:** for each key currently under `dossier:create.*` in `frontend/src/i18n/en/dossier.json`, grep across `frontend/src/**/*.{ts,tsx}` excluding the five files being deleted; any key with zero external hits is a delete candidate. Mirror deletions in `frontend/src/i18n/ar/dossier.json`.

**Out-of-scope for i18n audit:** keys under `dossier:type.*` (consumed by `DossierTypeStatsCard.tsx`, `DossierListPage.tsx`, and the hub), `dossier:status.*` (consumed everywhere), `dossier:typeGuide.*` (consumed by `DossierTypeGuide.tsx`) — these stay.

---

## Shared Patterns

### RTL logical properties (all hub + banner + repointed CTAs)

**Source:** `CLAUDE.md` §"Arabic RTL Support Guidelines" + `DossierTypeStatsCard.tsx` lines 244, 234 (`text-start`, `me-1`/`ms-1`).
**Apply to:** every new card, banner, CTA, and empty-state button in Phase 31. Never `ml-*`/`mr-*`/`text-left`/`text-right`.

### Mobile-first grid ladder

**Source:** `DossierListPage.tsx` lines 527, 533.
**Apply to:** `CreateDossierHub.tsx` — **use the phase-specific D-01 ladder** (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`), not the list page's wider ladder.

### Per-type icon map

**Source:** `DossierTypeStatsCard.tsx` lines 54-75 (`getTypeIcon` switch).
**Apply to:** `CreateDossierHub.tsx`. Extend with `elected_official` case.

### Per-type route segment resolution

**Source:** `@/lib/dossier-routes` → `getDossierRouteSegment(type)`.
**Apply to:** hub card links, `useContextAwareFAB` typed-route lookup, `DossierListPage.tsx` CTA.

### Link-via-Button asChild

**Source:** `ElectedOfficialListTable.tsx` line 168 (`<Button asChild className="mt-4 min-h-11"><Link to="…">…`).
**Apply to:** hub cards and any repointed CTA — preserves touch-target minimum (`min-h-11`).

### localStorage-dismiss fallback-safe pattern

**Source:** `TourContext.tsx` lines 267-273 (try/catch-wrapped `localStorage.setItem`).
**Apply to:** `StepGuidanceBanner` dismiss persistence.

---

## No Analog Found

| File                              | Role         | Reason                                                                                                                                                                                                                                                                                                   |
| --------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HeroUI v3 `Alert` dismiss variant | UI primitive | No existing consumer of `Alert` from `@heroui/react` (grep confirmed: only `Modal`, `Button`, `Dropdown`, `useOverlayState` are consumed). Plan 31-02 is the first introduction — planner sources API shape from HeroUI v3 docs + shadcn `Alert` as a fallback if the HeroUI surface isn't yet migrated. |

---

## Metadata

**Analog search scope:** `frontend/src/**` (pages, components, hooks, routes, i18n, types), `tests/**`, `**/*.spec.ts`, `.planning/phases/26-29/*-CONTEXT.md`.
**Files scanned:** 18 integration surfaces + 8 wizard configs + 2 i18n namespaces.
**Pattern extraction date:** 2026-04-18.
