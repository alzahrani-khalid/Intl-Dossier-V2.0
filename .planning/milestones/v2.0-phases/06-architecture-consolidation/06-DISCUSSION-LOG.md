# Phase 6: Architecture Consolidation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 06-architecture-consolidation
**Areas discussed:** Repository layer design, Hook migration scope, Backend consolidation, Shared pattern extraction, Domain boundaries, Type ownership, Testing strategy

---

## Repository Layer Design

### Q1: How should the frontend repository layer be organized?

| Option                  | Description                                                         | Selected |
| ----------------------- | ------------------------------------------------------------------- | -------- |
| Per-domain repos        | Create frontend/src/domains/{feature}/repositories/ for each domain | ✓        |
| Centralized API client  | Single frontend/src/lib/api-client.ts with typed methods per domain |          |
| Base class + per-domain | Abstract BaseRepository class, each domain extends it               |          |

**User's choice:** Per-domain repos
**Notes:** Matches architecture docs' vision. Each repo file exports typed API functions.

### Q2: Should repos use plain functions or class instances?

| Option          | Description                                                         | Selected |
| --------------- | ------------------------------------------------------------------- | -------- |
| Plain functions | Export standalone typed functions, tree-shakeable, no instantiation | ✓        |
| Class instances | Class per domain with methods, better for DI/mocking                |          |
| You decide      | Let Claude pick                                                     |          |

**User's choice:** Plain functions
**Notes:** Matches existing hook-based patterns in codebase.

### Q3: Should there be a shared API client wrapper?

| Option                 | Description                                       | Selected |
| ---------------------- | ------------------------------------------------- | -------- |
| Shared apiClient       | Single wrapper in frontend/src/lib/api-client.ts  | ✓        |
| Direct fetch + helpers | Repos call fetch() directly with imported helpers |          |
| You decide             | Let Claude pick                                   |          |

**User's choice:** Shared apiClient
**Notes:** Single place for auth tokens, timeouts, retries, error handling.

### Q4: Should existing frontend/src/hooks/ imports keep working via re-exports?

| Option               | Description                                    | Selected |
| -------------------- | ---------------------------------------------- | -------- |
| Re-export for compat | Keep old files as re-exports from domain hooks |          |
| Clean break          | Delete old files, update all imports           |          |
| You decide           | Let Claude pick pragmatic approach             | ✓        |

**User's choice:** You decide (Claude's discretion)

---

## Hook Migration Scope

### Q1: How should the 69 raw-fetch hooks be migrated?

| Option              | Description                                           | Selected |
| ------------------- | ----------------------------------------------------- | -------- |
| Domain-by-domain    | Migrate one domain at a time, safer and testable      | ✓        |
| All at once         | Create all repos and migrate all hooks in one pass    |          |
| Critical path first | Migrate most-used hooks first, leave others for later |          |

**User's choice:** Domain-by-domain
**Notes:** Each domain gets its repo + migrated hooks in one plan wave.

### Q2: Should migrated hooks preserve their exact current API?

| Option                   | Description                                         | Selected |
| ------------------------ | --------------------------------------------------- | -------- |
| Preserve signatures      | Only change internal implementation (fetch -> repo) |          |
| Improve during migration | Fix inconsistencies as hooks are migrated           |          |
| You decide               | Let Claude judge per-hook                           | ✓        |

**User's choice:** You decide (Claude's discretion)

### Q3: Should Phase 5 deprecated files be deleted in this phase?

| Option               | Description                                       | Selected |
| -------------------- | ------------------------------------------------- | -------- |
| Yes, clean up now    | Delete MainLayout and use-mobile.tsx              |          |
| No, separate concern | Handle separately from architecture consolidation |          |
| You decide           | Let Claude decide if it fits naturally            | ✓        |

**User's choice:** You decide (Claude's discretion)

---

## Backend Consolidation

### Q1: What should happen with the ports/adapters architecture?

| Option               | Description                                            | Selected |
| -------------------- | ------------------------------------------------------ | -------- |
| Keep flat services   | Keep backend/src/services/ as-is, update docs to match | ✓        |
| Build ports/adapters | Create the architecture as documented                  |          |
| Hybrid approach      | Keep flat but add interfaces for type-safety           |          |

**User's choice:** Keep flat services
**Notes:** Don't create directories that don't exist. Update architecture docs to match reality.

### Q2: How should overlapping services be handled?

| Option               | Description                                          | Selected |
| -------------------- | ---------------------------------------------------- | -------- |
| Merge into primary   | Consolidate duplicate logic into main service file   | ✓        |
| Extract shared logic | Pull shared parts into utilities, keep both services |          |
| You decide           | Let Claude analyze each pair                         |          |

**User's choice:** Merge into primary

### Q3: Should architecture docs be updated?

| Option            | Description                                        | Selected |
| ----------------- | -------------------------------------------------- | -------- |
| Yes, update docs  | Update ARCHITECTURE.md to reflect actual structure | ✓        |
| No, docs are fine | Leave as aspirational reference                    |          |
| You decide        | Let Claude judge                                   |          |

**User's choice:** Yes, update docs

---

## Shared Pattern Extraction

### Q1: What kind of shared CRUD patterns should be extracted?

| Option                | Description                                             | Selected |
| --------------------- | ------------------------------------------------------- | -------- |
| Factory functions     | createDomainHooks<T>() generates typed hooks per domain |          |
| Base hook composables | Composable hooks like useEntityList accepting config    |          |
| No shared abstraction | Keep each domain's hooks independent, copy pattern      | ✓        |
| You decide            | Let Claude pick                                         |          |

**User's choice:** No shared abstraction
**Notes:** User prefers simplicity over DRY for frontend CRUD patterns.

### Q2: Should backend shared utilities be extracted?

| Option            | Description                                        | Selected |
| ----------------- | -------------------------------------------------- | -------- |
| Extract utilities | Create shared pagination, filtering, query helpers |          |
| Keep independent  | Each service handles its own patterns              |          |
| You decide        | Let Claude identify what's worth extracting        | ✓        |

**User's choice:** You decide (Claude's discretion)

---

## Domain Boundaries

### Q1: How should cross-cutting hooks be organized?

| Option          | Description                                              | Selected |
| --------------- | -------------------------------------------------------- | -------- |
| Feature domains | Create domains/ai/, domains/search/, etc.                |          |
| Keep in hooks/  | Only dossier types get domains/, features stay in hooks/ |          |
| You decide      | Let Claude group based on usage patterns                 | ✓        |

**User's choice:** You decide (Claude's discretion)

---

## Type Ownership

### Q1: Where should TypeScript types live after reorganization?

| Option                | Description                                     | Selected |
| --------------------- | ----------------------------------------------- | -------- |
| Co-located per domain | Each domain owns its types in domains/\*/types/ |          |
| Centralized types/    | Keep all types in frontend/src/types/           |          |
| You decide            | Let Claude decide based on current distribution | ✓        |

**User's choice:** You decide (Claude's discretion)

---

## Testing Strategy

### Q1: Should consolidation include writing new tests?

| Option              | Description                              | Selected |
| ------------------- | ---------------------------------------- | -------- |
| Regression only     | Ensure existing tests pass, no new tests |          |
| Add repo unit tests | Write unit tests for each new repository |          |
| You decide          | Let Claude judge which repos need tests  | ✓        |

**User's choice:** You decide (Claude's discretion)

---

## Claude's Discretion

- Import migration strategy (re-exports vs clean break)
- Per-hook API preservation vs improvement
- Phase 5 deprecated file cleanup (MainLayout, use-mobile.tsx)
- Cross-cutting hook organization (feature domains vs hooks/)
- Type ownership (co-located vs centralized)
- Backend utility extraction
- Testing approach (regression-only vs targeted new tests)

## Deferred Ideas

None — discussion stayed within phase scope.
