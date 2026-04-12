# Phase 25: Deferred Audit Fixes - Research

**Researched:** 2026-04-12
**Domain:** Component decomposition, state management, URL-driven state, data quality, UI pattern rollout
**Confidence:** HIGH

## Summary

Phase 25 addresses 10 deferred audit findings plus a breadcrumb/skeleton rollout across all 8 dossier type list pages. The work spans five domains: (1) component decomposition of a 1979-line wizard, (2) query key factory and context splitting for state management, (3) URL-driven pagination and filter state via TanStack Router search params, (4) after-action version conflict detection, and (5) breadcrumb/skeleton/tab-active-state UI rollout with route naming standardization.

The codebase already has established patterns for all of these -- `validateSearch` for URL state (commitments page), `reportKeys` factory for query keys, `EntityBreadcrumbTrail` component for breadcrumbs, and `DossierLoadingSkeletons` for loading states. The work is primarily extending existing patterns to missing areas and decomposing oversized components.

**Primary recommendation:** Organize into 4-5 plans by dependency cluster: (1) query key factory + context split (foundational), (2) wizard decomposition (isolated refactor), (3) URL state for pagination + kanban filters, (4) after-action conflict detection, (5) breadcrumb/skeleton/tab rollout + route naming fixes.

<phase_requirements>

## Phase Requirements

| ID                          | Description                                                          | Research Support                                                                                                           |
| --------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| C-12                        | DossierCreateWizard decomposition into step components < 300 LOC     | Wizard is 1979 LOC with 6 steps; `renderStepContent()` switch-case at line 606 defines natural split points                |
| D-10                        | Query key factory per domain                                         | `reportKeys` pattern exists in `useReportBuilder.ts` (line 14); replicate for dossier, kanban, after-action domains        |
| D-11                        | Dossier context split into focused sub-contexts                      | `dossier-context.tsx` is 465 LOC with useReducer; split into navigation/active/pinned sub-contexts                         |
| C-20                        | Consistent state management patterns                                 | Covered by D-10 + D-11 implementation                                                                                      |
| D-41                        | After-action version conflict detection                              | No existing conflict detection found; implement optimistic locking via `updated_at` comparison                             |
| D-32                        | Type tab active state visually highlighted                           | Dossier index route exists; needs accent-colored active indicator per UI-SPEC                                              |
| D-33                        | Pagination state in URL params                                       | `validateSearch` pattern from commitments.tsx provides the template; add `?page=N` to dossier list routes                  |
| D-34                        | Kanban filter state in URL params                                    | `UnifiedKanbanHeader` has filter state in useState; lift to URL search params                                              |
| N-20                        | URL naming conventions standardized                                  | `working_groups` (underscore) vs `elected-officials` (kebab) inconsistency found; standardize to kebab-case with redirects |
| N-04                        | Route naming consistency                                             | Same as N-20; add redirect routes for old paths                                                                            |
| breadcrumb/skeleton rollout | All 8 dossier type list pages have breadcrumbs and loading skeletons | Countries has ~20 breadcrumb/skeleton refs; other 7 pages have ~6 each (partial); elected-officials has 0                  |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Stack**: React 19, TanStack Router/Query v5, Tailwind CSS v4, HeroUI v3, TypeScript strict mode
- **RTL**: Logical properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`); never `ml-*`/`mr-*`/`text-left`/`text-right`
- **Code style**: No semicolons, single quotes, trailing commas, explicit return types, no `any`, 100 char width
- **Mobile-first**: Base (320px+) up through breakpoints; min 44x44 touch targets
- **Component hierarchy**: HeroUI v3 > Aceternity > Kibo-UI > shadcn
- **Deployment**: DigitalOcean droplet with Docker Compose

## Standard Stack

### Core (already installed -- no new dependencies)

| Library                    | Purpose                                  | Why Standard                                                            |
| -------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| TanStack Router v5         | URL-driven state via `validateSearch`    | Already used in commitments, positions routes [VERIFIED: codebase grep] |
| TanStack Query v5          | Query key factories for cache management | Already used throughout domains [VERIFIED: codebase grep]               |
| React Context + useReducer | Sub-context splitting pattern            | Already used in `dossier-context.tsx` [VERIFIED: codebase grep]         |
| Zod                        | Search param validation schemas          | Already used for form validation [VERIFIED: codebase grep]              |
| lucide-react               | Icons for breadcrumbs, tabs              | Already the project icon library [VERIFIED: UI-SPEC]                    |

**No new dependencies required for this phase.** [VERIFIED: UI-SPEC Registry Safety section]

## Architecture Patterns

### Pattern 1: Query Key Factory (for D-10)

Replicate the existing `reportKeys` pattern found at `frontend/src/domains/misc/hooks/useReportBuilder.ts:14`:

```typescript
// Source: existing codebase pattern [VERIFIED]
export const dossierKeys = {
  all: ['dossiers'] as const,
  lists: () => [...dossierKeys.all, 'list'] as const,
  list: (filters: DossierFilters) => [...dossierKeys.lists(), filters] as const,
  details: () => [...dossierKeys.all, 'detail'] as const,
  detail: (id: string) => [...dossierKeys.details(), id] as const,
}
```

Create one factory per domain: `dossierKeys`, `kanbanKeys`, `afterActionKeys`, `notificationKeys`.

### Pattern 2: TanStack Router Search Params (for D-33, D-34)

Replicate the `validateSearch` pattern from `frontend/src/routes/_protected/commitments.tsx:46`:

```typescript
// Source: existing codebase pattern [VERIFIED]
export const Route = createFileRoute('/_protected/dossiers/countries/')({
  validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
    page: Number(search.page) || 1,
    search: (search.search as string) || undefined,
  }),
})

// In component:
const searchParams = Route.useSearch()
const navigate = Route.useNavigate()
// Update:
void navigate({ search: (prev) => ({ ...prev, page: 2 }) })
```

### Pattern 3: Context Splitting (for D-11)

Split `dossier-context.tsx` (465 LOC) into focused sub-contexts:

```
frontend/src/contexts/
  dossier-context.tsx          -> dossier-context/ (directory)
    index.tsx                  -- re-export combined hook for backwards compat
    DossierNavigationContext.tsx  -- activeDossier, setActiveDossier
    DossierCollectionContext.tsx  -- recentDossiers, pinnedDossiers
    DossierInheritanceContext.tsx -- context resolution, inheritance chains
```

### Pattern 4: Wizard Step Decomposition (for C-12)

Split the 1979-line `DossierCreateWizard.tsx` based on the `renderStepContent()` switch-case at line 606:

```
frontend/src/components/Dossier/
  DossierCreateWizard.tsx         -> orchestrator only (~200 LOC)
  wizard-steps/
    TypeSelectionStep.tsx          -- step 0: dossier type picker
    BasicInfoStep.tsx              -- step 1: name, description, fields
    TypeSpecificStep.tsx           -- step 2: type-dependent extension data
    RelationshipsStep.tsx          -- step 3: link to other dossiers
    ReviewStep.tsx                 -- step 4: summary + submit
    shared.ts                     -- shared types, schema, constants
```

Each step receives form state via props or a shared form context (React Hook Form's `useFormContext`).

### Pattern 5: Optimistic Locking (for D-41)

```typescript
// Before save:
const serverRecord = await api.get(`/after-actions/${id}`)
if (serverRecord.updated_at !== localRecord.updated_at) {
  setConflict({ serverVersion: serverRecord, localVersion: localRecord })
  return // block save
}
// Proceed with save, include updated_at in payload for server-side check
```

Backend should also verify: `WHERE id = $1 AND updated_at = $2` -- if 0 rows affected, return 409 Conflict.

### Recommended Project Structure Changes

```
frontend/src/components/Dossier/
  DossierCreateWizard.tsx        # Slim orchestrator (~200 LOC)
  wizard-steps/                  # NEW directory
    TypeSelectionStep.tsx
    BasicInfoStep.tsx
    TypeSpecificStep.tsx
    RelationshipsStep.tsx
    ReviewStep.tsx
    shared.ts

frontend/src/contexts/
  dossier-context/               # REPLACES single file
    index.tsx
    DossierNavigationContext.tsx
    DossierCollectionContext.tsx
    DossierInheritanceContext.tsx

frontend/src/domains/
  dossier/keys.ts                # NEW: dossierKeys factory
  kanban/keys.ts                 # NEW: kanbanKeys factory
  after-action/keys.ts           # NEW: afterActionKeys factory
```

### Anti-Patterns to Avoid

- **Over-splitting context:** Don't create a context per field. Group by update frequency (navigation changes often, collections rarely).
- **Query key string literals:** Never use raw `['dossiers', id]` -- always use factory functions for consistency.
- **useState for URL-worthy state:** If the state should survive a page refresh, it belongs in URL search params, not useState.
- **Manual `.reverse()` for RTL breadcrumbs:** forceRTL handles direction. Use logical flex direction only.

## Don't Hand-Roll

| Problem                        | Don't Build                | Use Instead                                                     | Why                                                                         |
| ------------------------------ | -------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| URL search param serialization | Custom parse/stringify     | TanStack Router `validateSearch`                                | Already handles type coercion, defaults, history integration                |
| Query cache invalidation       | Manual key tracking        | Query key factory + `invalidateQueries({ queryKey: keys.all })` | Hierarchical invalidation prevents stale data                               |
| Optimistic lock conflict UI    | Custom diff viewer         | Destructive banner + reload CTA (per UI-SPEC)                   | Full diff is scope creep; banner + reload is sufficient for this phase      |
| Breadcrumb generation          | Per-page breadcrumb arrays | `EntityBreadcrumbTrail` with route-derived segments             | Component already exists (336 LOC), just needs to be added to missing pages |

## Common Pitfalls

### Pitfall 1: Route Rename Breaking TanStack Router Code Generation

**What goes wrong:** Renaming `working_groups/` to `working-groups/` breaks `routeTree.gen.ts` auto-generation and all existing `Link` components pointing to old paths.
**Why it happens:** TanStack Router generates route types from file paths. Rename changes the `Route.fullPath` string.
**How to avoid:** (1) Rename the directory, (2) run `pnpm dev` to regenerate `routeTree.gen.ts`, (3) fix all TypeScript errors from broken route references, (4) add redirect route files for old paths.
**Warning signs:** TypeScript errors mentioning route path strings.

### Pitfall 2: Context Split Breaks Existing Consumers

**What goes wrong:** Components using `useDossierContext()` break when the monolithic context is split.
**Why it happens:** The hook returns a combined value; splitting changes the shape.
**How to avoid:** Keep `useDossierContext()` as a facade that composes the sub-contexts. Existing code continues working unchanged.
**Warning signs:** Runtime errors about null context values.

### Pitfall 3: Search Param Type Coercion

**What goes wrong:** `?page=2` arrives as string `"2"`, comparison `page === 2` fails.
**Why it happens:** URL params are always strings.
**How to avoid:** Always coerce in `validateSearch`: `page: Number(search.page) || 1`.
**Warning signs:** Pagination shows wrong page, filters don't apply.

### Pitfall 4: Wizard Decomposition Loses Form State

**What goes wrong:** Splitting wizard into step components causes form state to reset when switching steps.
**Why it happens:** Each step component mounts/unmounts, losing local state.
**How to avoid:** Keep form state in the parent orchestrator (or use React Hook Form's `FormProvider` + `useFormContext`). Steps are pure renderers.
**Warning signs:** User fills step 1, goes to step 2, returns to step 1, data is gone.

### Pitfall 5: Race Condition in Conflict Detection

**What goes wrong:** User A checks `updated_at`, gets OK, but User B saves between the check and the save.
**Why it happens:** Client-side check alone has a TOCTOU gap.
**How to avoid:** Implement server-side check too: `UPDATE ... WHERE updated_at = $expected` and return 409 if 0 rows affected.
**Warning signs:** Silent overwrites in concurrent editing scenarios.

## Code Examples

### URL Search Params for Pagination (D-33)

```typescript
// Source: extrapolated from commitments.tsx validateSearch pattern [VERIFIED]
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const dossierListSearchSchema = z.object({
  page: z.number().int().positive().default(1),
  search: z.string().optional(),
})

type DossierListSearch = z.infer<typeof dossierListSearchSchema>

export const Route = createFileRoute('/_protected/dossiers/countries/')({
  validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
    page: Math.max(1, Number(search.page) || 1),
    search: (search.search as string) || undefined,
  }),
})
```

### Kanban Filter URL State (D-34)

```typescript
// Source: extrapolated from UnifiedKanbanHeader filter pattern [VERIFIED]
const kanbanSearchSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  source: z.string().optional(),
  groupBy: z.enum(['status', 'priority', 'source']).default('status'),
})

// In route definition:
validateSearch: (search: Record<string, unknown>): KanbanSearch => ({
  status: (search.status as string) || undefined,
  priority: (search.priority as string) || undefined,
  source: (search.source as string) || undefined,
  groupBy: (search.groupBy as string as KanbanSearch['groupBy']) || 'status',
})
```

### Query Key Factory (D-10)

```typescript
// Source: replicated from reportKeys pattern in useReportBuilder.ts [VERIFIED]
export const dossierKeys = {
  all: ['dossiers'] as const,
  lists: () => [...dossierKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...dossierKeys.lists(), filters] as const,
  details: () => [...dossierKeys.all, 'detail'] as const,
  detail: (id: string) => [...dossierKeys.details(), id] as const,
  related: (id: string) => [...dossierKeys.detail(id), 'related'] as const,
}
```

### Redirect Route for Old Paths (N-20)

```typescript
// frontend/src/routes/_protected/dossiers/working_groups/index.tsx
// Keep as redirect to new kebab-case path
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/dossiers/working_groups/')({
  beforeLoad: () => {
    throw redirect({ to: '/dossiers/working-groups' })
  },
})
```

## State of the Art

| Old Approach                   | Current Approach                   | When Changed                  | Impact                                    |
| ------------------------------ | ---------------------------------- | ----------------------------- | ----------------------------------------- |
| String literal query keys      | Query key factory functions        | TanStack Query v4+ (2022)     | Hierarchical invalidation, type-safe keys |
| useState for filter state      | URL search params via router       | TanStack Router v1+ (2023)    | Shareable URLs, refresh persistence       |
| Monolithic context providers   | Focused sub-contexts               | React best practice (ongoing) | Reduced unnecessary re-renders            |
| Client-only conflict detection | Client + server optimistic locking | Standard pattern              | Prevents TOCTOU race conditions           |

## Assumptions Log

| #   | Claim                                                                                | Section                      | Risk if Wrong                                                                     |
| --- | ------------------------------------------------------------------------------------ | ---------------------------- | --------------------------------------------------------------------------------- |
| A1  | After-action records have an `updated_at` column in the database                     | Architecture Patterns (D-41) | Would need to add the column via migration before implementing conflict detection |
| A2  | The 6 wizard steps identified from grep match the actual step structure              | Architecture Patterns (C-12) | Step decomposition plan may need adjustment                                       |
| A3  | TanStack Router file-based routing allows redirect routes in old directory locations | Code Examples (N-20)         | May need a different redirect mechanism                                           |

## Open Questions

1. **After-action `updated_at` column existence**
   - What we know: The codebase references after-action records but no conflict detection exists
   - What's unclear: Whether the `after_action_records` table has `updated_at`
   - Recommendation: Check via Supabase MCP before planning the D-41 task

2. **Scope of route renaming (N-20)**
   - What we know: `working_groups` uses underscore, `elected-officials` uses kebab-case
   - What's unclear: Whether other routes outside dossiers have similar inconsistencies
   - Recommendation: Limit scope to dossier routes only; broader cleanup is separate

3. **Kanban route location**
   - What we know: Kanban components exist in `unified-kanban/` and `assignments/`
   - What's unclear: Which route file hosts the kanban view that needs URL filter state
   - Recommendation: Check during planning -- likely in commitments or a kanban-specific route

## Validation Architecture

### Test Framework

| Property           | Value                                                   |
| ------------------ | ------------------------------------------------------- |
| Framework          | Vitest + Playwright                                     |
| Config file        | `vitest.config.ts` (unit), `playwright.config.ts` (E2E) |
| Quick run command  | `pnpm test -- --run`                                    |
| Full suite command | `pnpm test && pnpm exec playwright test`                |

### Phase Requirements to Test Map

| Req ID     | Behavior                                | Test Type   | Automated Command                                                 | File Exists? |
| ---------- | --------------------------------------- | ----------- | ----------------------------------------------------------------- | ------------ |
| C-12       | Wizard steps each < 300 LOC             | unit        | `wc -l frontend/src/components/Dossier/wizard-steps/*.tsx`        | No -- Wave 0 |
| D-10       | Query key factory produces correct keys | unit        | `pnpm test -- --run tests/unit/query-keys.test.ts`                | No -- Wave 0 |
| D-11       | Sub-contexts provide correct values     | unit        | `pnpm test -- --run tests/unit/dossier-context.test.ts`           | No -- Wave 0 |
| D-33       | Pagination state in URL                 | E2E         | `pnpm exec playwright test tests/e2e/pagination-url.spec.ts`      | No -- Wave 0 |
| D-34       | Kanban filter state in URL              | E2E         | `pnpm exec playwright test tests/e2e/kanban-filters.spec.ts`      | No -- Wave 0 |
| D-41       | Version conflict prevents overwrite     | integration | `pnpm test -- --run tests/integration/conflict-detection.test.ts` | No -- Wave 0 |
| N-20       | Old URLs redirect to new paths          | E2E         | `pnpm exec playwright test tests/e2e/route-redirects.spec.ts`     | No -- Wave 0 |
| D-32       | Active tab highlighted                  | E2E/visual  | Manual verification + screenshot comparison                       | No -- Wave 0 |
| breadcrumb | All 8 pages have breadcrumbs            | E2E         | `pnpm exec playwright test tests/e2e/breadcrumbs.spec.ts`         | No -- Wave 0 |

### Wave 0 Gaps

- [ ] `tests/unit/query-keys.test.ts` -- covers D-10
- [ ] `tests/unit/dossier-context.test.ts` -- covers D-11
- [ ] `tests/e2e/pagination-url.spec.ts` -- covers D-33
- [ ] `tests/e2e/kanban-filters.spec.ts` -- covers D-34
- [ ] `tests/integration/conflict-detection.test.ts` -- covers D-41

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                         |
| --------------------- | ------- | ------------------------------------------------------------------------ |
| V2 Authentication     | no      | N/A -- no auth changes                                                   |
| V3 Session Management | no      | N/A                                                                      |
| V4 Access Control     | no      | N/A -- no new endpoints                                                  |
| V5 Input Validation   | yes     | Zod schemas for URL search params; `validateSearch` coerces and defaults |
| V6 Cryptography       | no      | N/A                                                                      |

### Known Threat Patterns

| Pattern                                     | STRIDE    | Standard Mitigation                                                          |
| ------------------------------------------- | --------- | ---------------------------------------------------------------------------- |
| URL param injection (XSS via search params) | Tampering | Zod validation + type coercion in `validateSearch` strips unexpected values  |
| Conflict detection bypass                   | Tampering | Server-side `WHERE updated_at = $expected` prevents client-only check bypass |

## Sources

### Primary (HIGH confidence)

- Codebase grep: `DossierCreateWizard.tsx` (1979 LOC), `dossier-context.tsx` (465 LOC), `EntityBreadcrumbTrail.tsx` (336 LOC)
- Codebase grep: `reportKeys` factory pattern in `useReportBuilder.ts`
- Codebase grep: `validateSearch` pattern in `commitments.tsx`
- Codebase grep: Route directory structure showing `working_groups` (underscore) vs `elected-officials` (kebab)
- Codebase grep: Breadcrumb usage -- countries has ~20 refs, others ~6, elected-officials has 0

### Secondary (MEDIUM confidence)

- UI-SPEC: `25-UI-SPEC.md` -- all interaction contracts and component inventory

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries already in use, no new deps
- Architecture: HIGH -- all patterns exist in codebase, just need replication
- Pitfalls: HIGH -- based on direct codebase analysis and standard React/Router patterns

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable -- internal refactoring, no external API changes)
