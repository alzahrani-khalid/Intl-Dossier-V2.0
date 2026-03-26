# Architecture

**Analysis Date:** 2026-03-26 (updated after Phase 06 consolidation)

## Pattern Overview

**Overall:** Layered monorepo architecture with flat service-based backend and domain-driven frontend using the repository pattern.

**Key Characteristics:**

- Monorepo structure (Turborepo) with 3 workspaces: `backend`, `frontend`, `shared`
- Express.js backend with flat service files (no ports/adapters directories)
- React 19 + TanStack Router v5 for URL-driven state management
- Supabase PostgreSQL as primary data store with Realtime subscriptions
- API-first architecture with separate auth and protected routes
- Frontend domain repository pattern with shared `apiClient`
- Error-tracked via Sentry on both frontend and backend

## Key Layers

| Layer | Location | Purpose |
|-------|----------|---------|
| API | `backend/src/api/` (60+ files) | Express routers, feature-based |
| Services | `backend/src/services/` (~37 files) | Business logic, Supabase queries |
| Middleware | `backend/src/middleware/` | Auth, rate-limit, security headers |
| Routes | `frontend/src/routes/` (100+ files) | TanStack Router file-based routing |
| Domains | `frontend/src/domains/{feature}/` | Repositories, hooks, types per feature |
| Components | `frontend/src/components/ui/` | HeroUI wrappers + re-exports (shadcn compat) |
| State | `frontend/src/contexts/`, `frontend/src/providers/` | Auth/theme/language contexts |

## Backend Architecture

### Services Layer (Flat Structure)

All backend business logic lives in `backend/src/services/` as a flat collection of service files. There are no ports, adapters, or hexagonal architecture directories -- services directly use `supabaseAdmin` or construct their own Supabase clients.

After Phase 06 consolidation, 7 duplicate service files were merged into their primary counterparts:

- `task-creation.service.ts` merged into `tasks.service.ts`
- `event-conflicts.ts` merged into `event.service.ts`
- `countries-search.ts` merged into `country.service.ts`
- `signature-orchestrator.ts` merged into `signature.service.ts`
- `brief-context.service.ts` merged into `brief.service.ts`
- `link-audit.service.ts` merged into `link.service.ts`
- `link-migration.service.ts` merged into `link.service.ts`

**~37 service files** organized by feature domain:

| Category | Files | Examples |
|----------|-------|---------|
| Core Entity CRUD | ~12 | `country.service.ts`, `event.service.ts`, `tasks.service.ts`, `DocumentService.ts` |
| AI/ML | ~6 | `anythingllm.service.ts`, `ai-extraction.service.ts`, `embeddings.service.ts` |
| Search | 4 | `search.service.ts`, `SearchService.ts`, `semantic-search.service.ts`, `fulltext-search.service.ts` |
| Workflow | ~5 | `kanban.service.ts`, `sla.service.ts`, `stage-transition.service.ts` |
| Auth/Security | ~4 | `AuthService.ts`, `mfa.service.ts`, `backup-codes.service.ts` |
| Infrastructure | ~6 | `redis-cache.service.ts`, `queue.service.ts`, `notification.service.ts` |

**Note:** Search services remain as 4 separate files because they implement distinct search strategies (fulltext, semantic, entity, unified) with different dependencies.

### API Layer

- Location: `backend/src/api/` (60+ endpoint files)
- Pattern: Feature-based Express routers
- Each router imports from services and calls Supabase
- Request validation via express-validator and Zod schemas

### Middleware Layer

- Location: `backend/src/middleware/`
- Contains: Authentication (`authenticateToken`), rate limiting (`apiLimiter`, `authLimiter`, `uploadLimiter`, `aiLimiter`), security headers (Helmet + CSP), request logging

## Frontend Architecture

### Domain Repository Pattern

Frontend business logic is organized into domain directories under `frontend/src/domains/`. Each domain encapsulates its types, API repositories, and hooks.

**Structure per domain:**

```
frontend/src/domains/{feature}/
  repositories/     # API client functions (fetch wrappers)
  hooks/            # TanStack Query hooks consuming repositories
  types/            # TypeScript interfaces for the domain
  index.ts          # Public API re-exports
```

**Shared API Client:**

All domain repositories use `frontend/src/lib/api-client.ts` as their HTTP layer. This provides:
- Centralized base URL configuration
- Auth token injection
- Error response normalization
- `apiGet`, `apiPost`, `apiPut`, `apiDelete` helpers

**Active domain directories (18 domains):**

| Domain | Purpose |
|--------|---------|
| `dossiers` | Dossier CRUD, type-specific operations |
| `positions` | Position management, consistency checks |
| `engagements` | Engagement lifecycle, participants |
| `calendar` | Calendar events, scheduling |
| `work-items` | Unified task/commitment/intake operations |
| `relationships` | Entity-to-entity relationship management |
| `documents` | Document upload, parsing, versioning |
| `persons` | Person/contact management |
| `topics` | Topic/policy area tracking |
| `ai` | AI briefing generation, extraction |
| `search` | Unified search across entities |
| `intake` | Intake ticket processing |
| `audit` | Audit log viewing |
| `analytics` | Dashboard metrics, charts |
| `briefings` | Brief generation and review |
| `tags` | Tag management across entities |
| `import` | Bulk data import |
| `misc` | Cross-cutting hooks (comments, stakeholders, reports, scenarios, onboarding) |

**Backward Compatibility:**

Hooks are re-exported from `frontend/src/hooks/` to avoid breaking existing imports. New code should import from `frontend/src/domains/{feature}/hooks/`.

### Routing & Layout

- Location: `frontend/src/routes/` (100+ route files) with TanStack Router file-based routing
- Pattern: `__root.tsx` (root layout) -> `_protected.tsx` (auth wrapper) -> feature routes
- Layout: `NavigationShell` wraps all protected routes (replaced `MainLayout` in Phase 05)

### Components Layer

- Location: `frontend/src/components/` and `frontend/src/components/ui/`
- Pattern: HeroUI v3 wrappers with shadcn-compatible re-exports
- Key files: `heroui-button.tsx`, `heroui-card.tsx`, `heroui-modal.tsx`, `heroui-forms.tsx`
- Re-export files: `button.tsx`, `card.tsx`, `badge.tsx`, `skeleton.tsx`

### Contexts & Providers

- Location: `frontend/src/contexts/`, `frontend/src/providers/`
- Auth: `AuthProvider` manages JWT token and user state
- Theme: `ThemeProvider` handles light/dark/system modes
- Language: `LanguageProvider` manages i18n with `useDirection()` hook for RTL

## Data Flow

### Backend API Request Flow

1. HTTP request hits Express app (`backend/src/index.ts`)
2. Security middleware applies (Sentry, CORS, rate limiting, auth headers)
3. Route matching to appropriate router (e.g., `/api/countries` -> `countries.ts`)
4. Request validation via express-validator or Zod
5. Auth token verified via `authenticateToken` middleware
6. Router calls service function (e.g., `CountryService.getCountries()`)
7. Service queries Supabase via `supabaseAdmin` client
8. Data returned, formatted to JSON response

### Frontend Page Navigation & Data Fetch

1. User navigates to `/dossiers/countries/$id`
2. TanStack Router resolves route -> loads `countries/$id.tsx`
3. Component calls domain hook (e.g., `useCountry(id)`)
4. Hook calls repository function (e.g., `countriesRepository.getById(id)`)
5. Repository calls backend API via `apiClient` (`apiGet('/api/countries/:id')`)
6. Response cached by TanStack Query
7. Component re-renders with data
8. Realtime subscriptions via Supabase update cached state

### State Management

- **URL State:** TanStack Router manages search params, pagination, filters
- **Server State:** TanStack Query caches API responses, handles refetch logic
- **Client State:** React Context for auth, theme, language; Zustand for complex client state
- **Realtime:** Supabase Realtime subscriptions for live updates

## Entry Points

**Backend:** `backend/src/index.ts` - Creates Express app, registers middleware, mounts API routers, starts HTTP server on port 5000

**Frontend:** `frontend/src/main.tsx` -> `App.tsx` - Initializes Sentry, creates React root, wraps with providers (QueryClient, Auth, Theme, Language), mounts TanStack Router

## Error Handling

**Backend:**
- Sentry middleware captures exceptions automatically
- Express error handler wraps errors in JSON with status codes (400, 401, 403, 500)
- Custom error classes: ValidationError, UnauthorizedError, ForbiddenError
- Graceful shutdown on SIGTERM/SIGINT
- Winston logger for structured logging

**Frontend:**
- ErrorBoundary component catches React rendering errors
- Sentry captures client-side exceptions
- Toast notifications for user-facing errors
- Fallback UI for failed data loads

## Cross-Cutting Concerns

**Authentication:** JWT via `authenticateToken` middleware + Supabase Auth; `_protected` route wrapper on frontend

**Validation:** express-validator + Zod (backend), React Hook Form + Zod (frontend)

**Rate Limiting:** `rate-limit.middleware.ts` with `apiLimiter`, `authLimiter`, `uploadLimiter`, `aiLimiter`

**Caching:** Redis/ioredis (backend), TanStack Query stale-while-revalidate (frontend)

**Realtime:** Supabase Realtime subscriptions auto-update TanStack Query cache

---

_Architecture updated: 2026-03-26 (Phase 06 consolidation complete)_
