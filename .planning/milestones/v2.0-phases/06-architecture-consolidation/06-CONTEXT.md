# Phase 6: Architecture Consolidation - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Consolidate all frontend data access into domain repositories with a shared API client, eliminate raw fetch() calls from hooks, deduplicate backend services, and update architecture docs to match reality. No new features, no new capabilities — pure structural consolidation.

</domain>

<decisions>
## Implementation Decisions

### Repository Layer Design

- **D-01:** Frontend repositories use **per-domain organization** — `frontend/src/domains/{feature}/repositories/` for each domain
- **D-02:** Repositories export **plain functions** (not classes) — `getCountries()`, `createCountry()`, etc. Tree-shakeable, no instantiation
- **D-03:** All repos import from a **shared apiClient** (`frontend/src/lib/api-client.ts`) that wraps fetch() with auth headers, base URL, error handling, and JSON parsing

### Hook Migration

- **D-04:** Migration happens **domain-by-domain**, not all at once. Each domain gets its repo + migrated hooks in one plan wave
- **D-05:** 69 hooks with raw fetch() must be migrated. All must route through domain repositories by phase end

### Backend Consolidation

- **D-06:** Keep **flat services structure** in `backend/src/services/`. Do NOT create ports/adapters directories. Update architecture docs to match reality
- **D-07:** For overlapping services, **merge into primary** service file and delete the duplicate (e.g., task-creation.service.ts merges into tasks.service.ts)
- **D-08:** Architecture docs (`.planning/codebase/ARCHITECTURE.md`) must be updated to reflect actual structure after consolidation

### Shared Patterns

- **D-09:** **No shared CRUD abstractions** on the frontend — each domain's hooks are independent. Copy the pattern but don't abstract (no factory functions, no base hooks)
- **D-10:** No shared frontend abstraction, but individual repos follow a consistent structure per domain

### Claude's Discretion

- **D-11:** Claude decides whether to use re-exports for backward compat or do a clean break when moving hooks from `frontend/src/hooks/` to `frontend/src/domains/*/hooks/`
- **D-12:** Claude decides per-hook whether to preserve exact API signatures or improve them during migration
- **D-13:** Claude decides whether to delete Phase 5 deprecated files (MainLayout, use-mobile.tsx) as part of this phase
- **D-14:** Claude decides how to organize cross-cutting hooks (AI, search, calendar, analytics) — feature domains vs keeping in hooks/
- **D-15:** Claude decides type ownership — co-located per domain vs centralized types/
- **D-16:** Claude decides backend shared utility extraction — which pagination/filtering/error formatting utilities are worth extracting
- **D-17:** Claude decides testing approach — regression-only vs adding repo unit tests for risky areas

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Structure

- `.planning/codebase/ARCHITECTURE.md` — Current (aspirational) architecture layers and patterns — must be updated to match reality
- `.planning/codebase/STRUCTURE.md` — Directory layout, file purposes, where to add new code
- `.planning/codebase/CONVENTIONS.md` — Naming patterns, code style, import organization
- `.planning/codebase/CONCERNS.md` — Tech debt, security issues, performance bottlenecks, fragile areas

### Requirements

- `.planning/REQUIREMENTS.md` §Architecture Consolidation — ARCH-02, ARCH-03, ARCH-04 acceptance criteria
- `.planning/ROADMAP.md` §Phase 6 — Goal, success criteria, dependencies

### Prior Phase Context

- `.planning/phases/02-naming-file-structure/02-CONTEXT.md` — Phase 2 naming decisions (ARCH-01 complete, eslint-plugin-check-file rules)
- `.planning/phases/05-responsive-design/05-CONTEXT.md` — Phase 5 deprecated MainLayout and use-mobile.tsx for Phase 6 cleanup

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `frontend/src/domains/shared/types/` — Existing shared types directory, can be expanded
- `frontend/src/hooks/` — 159 hooks, 69 with raw fetch() — the migration source
- `backend/src/services/` — 44 service files, all kebab-case — dedup targets
- `backend/src/api/` — 23 API endpoint files — defines the URL contracts repos will call

### Established Patterns

- TanStack Query v5 hooks throughout frontend — repos must produce functions compatible with `queryFn` / `mutationFn`
- Express routers in `backend/src/api/` call services directly — no middleware service layer
- HeroUI v3 wrapper re-export pattern in `frontend/src/components/ui/` — similar re-export approach could apply to hook migration

### Integration Points

- All 100+ route files import hooks from `frontend/src/hooks/` — migration must not break these imports
- Backend services are imported by API route files — service merges must update all import paths
- `frontend/src/domains/` currently only has `shared/` and a migration guide — new domain dirs will be created here

</code_context>

<specifics>
## Specific Ideas

- User explicitly chose plain functions over classes and factory functions — values simplicity over abstraction
- User wants domain-by-domain migration (not all-at-once) for safer, reviewable changes
- User prefers merging duplicate services into the primary file rather than extracting shared logic
- Architecture docs should reflect reality, not aspirational patterns

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 06-architecture-consolidation_
_Context gathered: 2026-03-26_
