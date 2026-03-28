# Phase 6: Architecture Consolidation - Research

**Researched:** 2026-03-26
**Domain:** Frontend domain repository pattern, backend service consolidation, shared API client
**Confidence:** HIGH

## Summary

Phase 6 consolidates all frontend data access into domain repositories behind a shared `apiClient`, eliminates 69 hooks with raw `fetch()` calls, deduplicates backend services, and updates architecture docs to match reality. The codebase currently has 159 hooks in a flat `frontend/src/hooks/` directory, 69 of which contain raw `fetch()`. The `frontend/src/domains/` directory exists but only contains `shared/types/result.ts` and a migration guide -- no actual domain directories yet.

The backend has 44 service files in `backend/src/services/`, all kebab-case. Several have overlapping names that are candidates for merging: `task-creation.service.ts` + `tasks.service.ts`, `event-conflicts.ts` + `event.service.ts`, `countries-search.ts` + `country.service.ts`, `signature-orchestrator.ts` + `signature.service.ts`, `brief-context.service.ts` + `brief.service.ts`, and three link-related services. The search domain has 4 separate services that likely serve distinct purposes (fulltext, semantic, entity, general).

**Primary recommendation:** Create the shared `apiClient` first (Wave 0), then migrate domain-by-domain with each wave creating a domain directory, repository file, and migrated hooks. Backend service merging can happen in parallel waves. Use re-exports from old hook paths for backward compatibility during migration.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Frontend repositories use per-domain organization -- `frontend/src/domains/{feature}/repositories/` for each domain
- **D-02:** Repositories export plain functions (not classes) -- `getCountries()`, `createCountry()`, etc. Tree-shakeable, no instantiation
- **D-03:** All repos import from a shared apiClient (`frontend/src/lib/api-client.ts`) that wraps fetch() with auth headers, base URL, error handling, and JSON parsing
- **D-04:** Migration happens domain-by-domain, not all at once. Each domain gets its repo + migrated hooks in one plan wave
- **D-05:** 69 hooks with raw fetch() must be migrated. All must route through domain repositories by phase end
- **D-06:** Keep flat services structure in `backend/src/services/`. Do NOT create ports/adapters directories. Update architecture docs to match reality
- **D-07:** For overlapping services, merge into primary service file and delete the duplicate (e.g., task-creation.service.ts merges into tasks.service.ts)
- **D-08:** Architecture docs (`.planning/codebase/ARCHITECTURE.md`) must be updated to reflect actual structure after consolidation
- **D-09:** No shared CRUD abstractions on the frontend -- each domain's hooks are independent. Copy the pattern but don't abstract (no factory functions, no base hooks)
- **D-10:** No shared frontend abstraction, but individual repos follow a consistent structure per domain

### Claude's Discretion

- **D-11:** Whether to use re-exports for backward compat or do a clean break when moving hooks
- **D-12:** Per-hook whether to preserve exact API signatures or improve them during migration
- **D-13:** Whether to delete Phase 5 deprecated files (MainLayout, use-mobile.tsx) as part of this phase
- **D-14:** How to organize cross-cutting hooks (AI, search, calendar, analytics)
- **D-15:** Type ownership -- co-located per domain vs centralized types/
- **D-16:** Backend shared utility extraction -- which pagination/filtering/error formatting utilities are worth extracting
- **D-17:** Testing approach -- regression-only vs adding repo unit tests for risky areas

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                            | Research Support                                                                                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ARCH-02 | Frontend domain repositories created for all 13+ domains (hooks use repo layer, not direct API calls)  | 69 hooks with raw fetch() identified; domain groupings mapped below; apiClient pattern defined; migration guide already exists in `frontend/src/domains/MIGRATION_GUIDE.md` |
| ARCH-03 | Backend duplicate services consolidated (single service per domain, no PascalCase/kebab-case variants) | 6 merge candidates identified: tasks, events, countries, signatures, briefs, links; all already kebab-case so no case variants exist                                        |
| ARCH-04 | Shared patterns extracted into reusable components and hooks (DRY across dossier types)                | Per D-09, no shared CRUD abstractions; instead each domain follows consistent repo+hook structure; shared `apiClient` is the reusable utility                               |

</phase_requirements>

## Architecture Patterns

### Recommended Domain Structure

```
frontend/src/domains/
  shared/
    types/result.ts          # Already exists
  countries/
    repositories/countries.repository.ts
    hooks/useCountries.ts
    hooks/useCountry.ts       # (if split from useDossier)
    types/                    # Optional co-located types
    index.ts                  # Barrel re-export
  engagements/
    repositories/engagements.repository.ts
    hooks/useEngagements.ts
    hooks/useEngagementKanban.ts
    hooks/useEngagementBriefs.ts
    index.ts
  positions/
    repositories/positions.repository.ts
    hooks/usePositions.ts
    hooks/usePosition.ts
    hooks/useCreatePosition.ts
    hooks/useUpdatePosition.ts
    hooks/usePositionSuggestions.ts
    hooks/usePositionAnalytics.ts
    hooks/usePositionDossierLinks.ts
    index.ts
  ... (pattern repeats per domain)
```

### API Client Pattern (D-03)

```typescript
// frontend/src/lib/api-client.ts
import { supabase } from './supabase'

const EDGE_BASE = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'
const EXPRESS_BASE = import.meta.env.VITE_API_URL || ''

interface ApiClientOptions {
  baseUrl?: 'edge' | 'express'
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }
}

export async function apiGet<T>(path: string, options?: ApiClientOptions): Promise<T> {
  const base = options?.baseUrl === 'express' ? EXPRESS_BASE : EDGE_BASE
  const headers = await getAuthHeaders()
  const response = await fetch(`${base}${path}`, { headers })
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options?: ApiClientOptions,
): Promise<T> {
  const base = options?.baseUrl === 'express' ? EXPRESS_BASE : EDGE_BASE
  const headers = await getAuthHeaders()
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

// apiPut, apiPatch, apiDelete follow same pattern
```

### Repository Pattern (D-02)

```typescript
// frontend/src/domains/countries/repositories/countries.repository.ts
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'
import type { Country, CountryFilters, PaginatedResponse } from '../types'

export function getCountries(filters?: CountryFilters): Promise<PaginatedResponse<Country>> {
  const params = new URLSearchParams(/* serialize filters */)
  return apiGet(`/countries-list?${params}`)
}

export function getCountry(id: string): Promise<Country> {
  return apiGet(`/country-detail/${id}`)
}

export function createCountry(data: Partial<Country>): Promise<Country> {
  return apiPost('/countries', data)
}
```

### Hook Migration Pattern

```typescript
// frontend/src/domains/countries/hooks/useCountries.ts
import { useQuery } from '@tanstack/react-query'
import * as countriesRepo from '../repositories/countries.repository'
import type { CountryFilters } from '../types'

export const countryKeys = {
  all: ['countries'] as const,
  lists: () => [...countryKeys.all, 'list'] as const,
  list: (filters?: CountryFilters) => [...countryKeys.lists(), filters] as const,
  details: () => [...countryKeys.all, 'detail'] as const,
  detail: (id: string) => [...countryKeys.details(), id] as const,
}

export function useCountries(filters?: CountryFilters) {
  return useQuery({
    queryKey: countryKeys.list(filters),
    queryFn: () => countriesRepo.getCountries(filters),
  })
}
```

### Backward Compatibility Re-export (D-11 recommendation: use re-exports)

```typescript
// frontend/src/hooks/useCountries.ts (preserved for backward compat)
// Re-export from domain module
export { useCountries, countryKeys } from '@/domains/countries'
```

### Anti-Patterns to Avoid

- **Shared CRUD factory (D-09 forbids):** Do NOT create `createDomainHooks('countries')` or similar abstractions
- **Class-based repositories (D-02 forbids):** Do NOT use `class CountriesRepository { ... }`
- **Direct fetch in hooks:** After migration, no hook should import `fetch` or construct URLs directly
- **Duplicate getAuthHeaders:** Every hook currently defines its own; apiClient centralizes this once

## Domain Grouping Analysis

### 69 Hooks with raw fetch() grouped by domain

| Domain               | Hooks (count) | Key hooks                                                                                                                                                                                                             |
| -------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dossiers**         | 7             | useDossiers, useDossier, useDossierActivityTimeline, useDossierRecommendations, useDossierFirstSearch, useQuickSwitcherSearch, useNoResultsSuggestions                                                                |
| **Positions**        | 10            | usePositions, usePosition, useCreatePosition, useUpdatePosition, useSubmitPosition, usePositionSuggestions, usePositionAnalytics, usePositionDossierLinks, useCreatePositionDossierLink, useDeletePositionDossierLink |
| **Engagements**      | 4             | useEngagements, useEngagementKanban, useEngagementBriefs, useEngagementRecommendations                                                                                                                                |
| **Calendar/Events**  | 5             | useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useCalendarConflicts, useRecurringEvents                                                                                                           |
| **Documents**        | 2             | useDocuments, useExportData                                                                                                                                                                                           |
| **Work Items**       | 4             | useWorkItemDossierLinks, useWorkflowAutomation, useSLAMonitoring, useUpdateSuggestionAction                                                                                                                           |
| **Relationships**    | 2             | useRelationships, useCreateRelationship                                                                                                                                                                               |
| **Persons**          | 1             | usePersons                                                                                                                                                                                                            |
| **Topics**           | 1             | useTopics                                                                                                                                                                                                             |
| **AI**               | 3             | useAIChat, useAIFieldAssist, useGenerateBrief (these 3 hit Express backend)                                                                                                                                           |
| **Search**           | 3             | useAdvancedSearch, useEnhancedSearch, useSavedSearchTemplates                                                                                                                                                         |
| **Intake**           | 3             | useIntakeApi, useQueueFilters, useWaitingQueueActions                                                                                                                                                                 |
| **Audit/Compliance** | 3             | useAuditLogs, useComplianceRules, useRetentionPolicies                                                                                                                                                                |
| **Analytics**        | 2             | useAnalyticsDashboard, useOrganizationBenchmarks                                                                                                                                                                      |
| **Briefings**        | 3             | useBriefingPackStatus, useGenerateBriefingPack, useCalendarSync                                                                                                                                                       |
| **Tags/Templates**   | 3             | useTagHierarchy, useEntityTemplates, useContextualSuggestions                                                                                                                                                         |
| **Import/Webhooks**  | 3             | useImportData, useWebhooks, useAvailabilityPolling                                                                                                                                                                    |
| **Other**            | 7             | useComments, useStakeholderTimeline, useStakeholderInfluence, useReportBuilder, useScenarioSandbox, useMultiLangContent, useSampleData, useOnboardingChecklist, useProgressiveDisclosure, usePullToRefresh            |

### 90 Hooks WITHOUT raw fetch() (no migration needed)

These are either: pure client-side hooks (useTheme, useDirection, useLanguage, useDebouncedValue), Supabase client direct users, UI utility hooks (useBulkSelection, useKeyboardShortcuts, useInView), or hooks that only compose other hooks. These stay in `frontend/src/hooks/` or move to domain `hooks/` if they logically belong there, at Claude's discretion.

### API Target Split

- **64 hooks** target Supabase Edge Functions (`VITE_SUPABASE_URL + '/functions/v1'`)
- **3 hooks** target Express backend (`VITE_API_URL`): useAIChat, useAIFieldAssist, useGenerateBrief
- **2 hooks** use variant base URL patterns

The apiClient must support both Edge Functions and Express backend endpoints (see pattern above).

## Backend Service Merge Candidates

| Primary Service        | Merge Into It                                        | Rationale                                                                                      |
| ---------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `tasks.service.ts`     | `task-creation.service.ts`                           | task-creation is specialized task creation from after-action; merge into primary tasks service |
| `event.service.ts`     | `event-conflicts.ts`                                 | event-conflicts is a sub-feature of events                                                     |
| `country.service.ts`   | `countries-search.ts`                                | countries-search is search within countries domain                                             |
| `signature.service.ts` | `signature-orchestrator.ts`                          | orchestrator coordinates signature workflows                                                   |
| `brief.service.ts`     | `brief-context.service.ts`                           | brief-context provides context for brief generation                                            |
| `link.service.ts`      | `link-audit.service.ts`, `link-migration.service.ts` | audit and migration are sub-operations on links                                                |

### Search services: Keep separate

The 4 search services (`search.service.ts`, `fulltext-search.service.ts`, `semantic-search.service.ts`, `entity-search.service.ts`) serve distinct search strategies and should remain separate. They are not duplicates.

### Services NOT needing merge (44 total - 6 merges = ~38 after)

All other services have unique names and single responsibility. No PascalCase/kebab-case duplicates were found -- ARCH-01 (Phase 2) already normalized naming.

## Deprecated Files for Cleanup (D-13)

From Phase 5 STATE.md decisions:

- `frontend/src/components/layout/MainLayout.tsx` -- deprecated, replaced by NavigationShell
- `frontend/src/hooks/useMobile.tsx` -- deprecated, replaced by useResponsive

Recommendation: Delete these as part of Wave 0 setup, since they are confirmed deprecated.

## Don't Hand-Roll

| Problem                 | Don't Build                         | Use Instead                                 | Why                                                               |
| ----------------------- | ----------------------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| Auth header injection   | Per-hook `getAuthHeaders()`         | Shared `apiClient` in `@/lib/api-client.ts` | 69 hooks currently duplicate this; single source eliminates drift |
| API base URL management | Per-hook `const API_BASE_URL = ...` | `apiClient` with `baseUrl` option           | 3 different URL patterns found; centralize to prevent errors      |
| JSON error parsing      | Per-hook `if (!response.ok)` checks | `apiClient` error handler                   | Consistent error shape for all consumers                          |
| Query key factories     | Per-hook inline key arrays          | Per-domain `xxxKeys` objects                | Already partially done; standardize across all domains            |

## Common Pitfalls

### Pitfall 1: Import Path Breakage

**What goes wrong:** Moving hooks to `frontend/src/domains/*/hooks/` breaks 43+ route files and many components that import from `@/hooks/`
**Why it happens:** Bulk rename without backward-compat re-exports
**How to avoid:** Use re-export files at old paths (`@/hooks/useCountries.ts` re-exports from `@/domains/countries`). Remove re-exports in a future phase once all consumers are updated.
**Warning signs:** Build errors referencing old import paths

### Pitfall 2: Auth Token Race Condition

**What goes wrong:** `getAuthHeaders()` returns stale or null token during session refresh
**Why it happens:** `supabase.auth.getSession()` can return expired session momentarily
**How to avoid:** apiClient should handle 401 responses with automatic retry after session refresh
**Warning signs:** Intermittent 401 errors in production

### Pitfall 3: Backend Service Merge Losing Exports

**What goes wrong:** Merging `task-creation.service.ts` into `tasks.service.ts` breaks imports in `after-action.ts` API route
**Why it happens:** Not updating all import paths after merge
**How to avoid:** `grep -r "task-creation" backend/src/` before deleting merged file; update all importers
**Warning signs:** TypeScript compilation errors after merge

### Pitfall 4: Edge Function vs Express URL Mismatch

**What goes wrong:** Hook migrated to apiClient defaults to Edge Functions but should hit Express
**Why it happens:** 3 AI hooks use Express backend, easy to miss
**How to avoid:** Document which domains use which backend in the apiClient; AI domain explicitly uses `baseUrl: 'express'`
**Warning signs:** 404 errors on AI endpoints

### Pitfall 5: Query Key Collision After Migration

**What goes wrong:** Old cached data conflicts with new query keys after migration
**Why it happens:** Changing query key structure invalidates cache unpredictably
**How to avoid:** Preserve existing query key structures where possible; if changing, ensure `queryClient.invalidateQueries()` is called
**Warning signs:** Stale data displayed after migration

## Validation Architecture

### Test Framework

| Property           | Value                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| Framework          | Vitest (configs at root, frontend, backend)                                 |
| Config file        | `vitest.config.ts`, `frontend/vitest.config.ts`, `backend/vitest.config.ts` |
| Quick run command  | `pnpm test`                                                                 |
| Full suite command | `pnpm test`                                                                 |

### Phase Requirements -> Test Map

| Req ID  | Behavior                                             | Test Type   | Automated Command                                                           | File Exists? |
| ------- | ---------------------------------------------------- | ----------- | --------------------------------------------------------------------------- | ------------ |
| ARCH-02 | All 69 fetch hooks route through domain repos        | integration | `pnpm --filter frontend test -- --run`                                      | Wave 0       |
| ARCH-02 | apiClient handles auth headers, errors, JSON parsing | unit        | `pnpm --filter frontend test -- --run src/lib/__tests__/api-client.test.ts` | Wave 0       |
| ARCH-03 | No duplicate service files remain                    | smoke       | `ls backend/src/services/ \| wc -l` (should be ~38)                         | manual       |
| ARCH-03 | Merged services maintain all exports                 | unit        | `pnpm --filter backend test -- --run`                                       | existing     |
| ARCH-04 | Each domain has consistent repo+hook structure       | smoke       | Directory structure check script                                            | Wave 0       |

### Sampling Rate

- **Per task commit:** `pnpm --filter frontend test -- --run` + `pnpm --filter backend test -- --run`
- **Per wave merge:** `pnpm test` (full suite)
- **Phase gate:** Full suite green + `grep -r "fetch(" frontend/src/hooks/` returns 0 results for migrated hooks

### Wave 0 Gaps

- [ ] `frontend/src/lib/__tests__/api-client.test.ts` -- unit tests for new apiClient
- [ ] Verification script: `grep -c "fetch(" frontend/src/hooks/*.ts` to track migration progress
- [ ] No new test framework needed -- Vitest already configured

## Code Examples

### Verified: Current fetch pattern in hooks (from useDossiers.ts)

```typescript
// Source: frontend/src/hooks/useDossiers.ts lines 43-124
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }
}

// Inside queryFn:
const response = await fetch(`${API_BASE_URL}/dossiers-list?${params.toString()}`, {
  headers: await getAuthHeaders(),
})
```

### Target: After migration

```typescript
// frontend/src/domains/dossiers/repositories/dossiers.repository.ts
import { apiGet } from '@/lib/api-client'
import type { DossierFilters, DossierListResponse } from '../types'

export function getDossiers(filters?: DossierFilters): Promise<DossierListResponse> {
  const params = new URLSearchParams(/* serialize */)
  return apiGet(`/dossiers-list?${params}`)
}

// frontend/src/domains/dossiers/hooks/useDossiers.ts
import { useQuery } from '@tanstack/react-query'
import * as dossiersRepo from '../repositories/dossiers.repository'

export const dossierKeys = {
  /* same as existing */
}

export function useDossiers(filters?: DossierFilters) {
  return useQuery({
    queryKey: dossierKeys.list(filters),
    queryFn: () => dossiersRepo.getDossiers(filters),
  })
}
```

## Discretion Recommendations

| Decision                                         | Recommendation                                                                                            | Rationale                                                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| D-11: Re-exports vs clean break                  | **Use re-exports**                                                                                        | 43+ route files import from `@/hooks/`; re-exports prevent mass breakage and allow gradual consumer migration    |
| D-12: Preserve API signatures                    | **Preserve** unless hook has obvious bugs                                                                 | Minimizes regression risk; improvements deferred to feature work                                                 |
| D-13: Delete Phase 5 deprecated files            | **Yes, in Wave 0**                                                                                        | MainLayout and useMobile are confirmed deprecated with replacements shipped                                      |
| D-14: Cross-cutting hooks (AI, search, calendar) | **Create domain dirs** for AI (`domains/ai/`), search (`domains/search/`), calendar (`domains/calendar/`) | They have 3+ hooks each with shared API patterns; grouping improves cohesion                                     |
| D-15: Type ownership                             | **Co-locate per domain**                                                                                  | Types move to `domains/{feature}/types/` alongside repos and hooks; shared types stay in `domains/shared/types/` |
| D-16: Backend utility extraction                 | **Extract pagination/filtering utils** into `backend/src/utils/`                                          | Multiple services duplicate pagination logic; worth extracting during merge                                      |
| D-17: Testing approach                           | **Regression-only + apiClient unit tests**                                                                | Main risk is import breakage (caught by build) and auth handling (caught by apiClient tests)                     |

## Project Constraints (from CLAUDE.md)

- **Tech stack:** React 19, TanStack Router/Query v5, TypeScript strict mode, Tailwind v4, HeroUI v3, Express backend, Supabase
- **Code style:** No semicolons, single quotes, trailing commas, 100 char width, explicit return types required, no `any`
- **Imports:** `@/` alias for `src/` root
- **RTL:** Logical properties only (ms-/me-/ps-/pe-), no physical left/right
- **GSD workflow:** All changes through GSD commands
- **Naming:** PascalCase components, camelCase functions/hooks, kebab-case files, `.types.ts` suffix for type files
- **Error handling:** Discriminated union types `{ success: boolean, data?: T, error?: Error }`
- **Logging:** `console.warn()` and `console.error()` only on frontend

## Sources

### Primary (HIGH confidence)

- Direct codebase analysis of 159 hooks in `frontend/src/hooks/`
- Direct codebase analysis of 44 services in `backend/src/services/`
- `frontend/src/hooks/useDossiers.ts` -- canonical fetch pattern
- `frontend/src/domains/MIGRATION_GUIDE.md` -- existing migration documentation
- `06-CONTEXT.md` -- all locked decisions
- `.planning/STATE.md` -- Phase 5 decisions about deprecated files

### Secondary (MEDIUM confidence)

- Domain grouping based on hook naming and API endpoint correlation
- Backend merge candidates based on file naming overlap (actual code inspection needed per merge)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - existing codebase, no new libraries needed
- Architecture: HIGH - patterns verified from existing code + locked decisions
- Pitfalls: HIGH - derived from actual code analysis (69 fetch hooks, 3 API patterns, import chains)
- Domain groupings: MEDIUM - based on naming analysis; some hooks may belong to different domains upon closer inspection

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable -- internal refactoring, no external dependencies)
