# Architecture

**Analysis Date:** 2026-03-23

## Pattern Overview

**Overall:** Layered monorepo architecture with hexagonal (ports & adapters) backend and client-state-server separation in frontend.

**Key Characteristics:**

- Monorepo structure (Turborepo) with 3 workspaces: `backend`, `frontend`, `shared`
- Express.js backend with domain-driven design layers (core domain, ports, adapters)
- React 19 + TanStack Router v5 for URL-driven state management
- Supabase PostgreSQL as primary data store with Realtime subscriptions
- API-first architecture with separate auth and protected routes
- Error-tracked via Sentry on both frontend and backend

## Layers

**Backend - Domain Layer (Core):**

- Purpose: Business logic and domain models isolated from external concerns
- Location: `backend/src/core/domain/`
- Contains: Domain entities, value objects, business rules
- Depends on: No external libraries (framework-agnostic)
- Used by: Services in ports/services layer

**Backend - Ports & Adapters Layer:**

- Purpose: Define contracts (ports) and implement infrastructure adapters
- Location: `backend/src/core/ports/` (contracts) and `backend/src/adapters/` (implementations)
- Contains: Repository interfaces, service interfaces, external API adapters (Supabase, AI, email, calendar)
- Depends on: Domain layer
- Used by: API controllers, scheduled jobs

**Backend - API/Controllers Layer:**

- Purpose: HTTP request handling and routing
- Location: `backend/src/api/` (60+ endpoint files)
- Contains: Express routers, request validation, response formatting
- Depends on: Adapters, services
- Pattern: Feature-based organization (countries, tasks, documents, ai, etc.)

**Backend - Middleware Layer:**

- Purpose: Cross-cutting concerns
- Location: `backend/src/middleware/`
- Contains: Authentication, rate limiting, security headers, request logging
- Applies to: All or filtered routes depending on configuration

**Frontend - Routing & Layout:**

- Purpose: Page structure and navigation
- Location: `frontend/src/routes/` (100+ route files) with TanStack Router file-based routing
- Contains: Page components, layout wrappers, nested routes
- Pattern: `__root.tsx` (root layout), `_protected.tsx` (auth wrapper), feature routes like `/dossiers/countries/$id.tsx`
- Depends on: Components, hooks, contexts

**Frontend - Domains Layer:**

- Purpose: Feature-specific business logic (replicating backend structure)
- Location: `frontend/src/domains/{feature}/` (document, engagement, relationship, shared)
- Contains: Types, repositories (API clients), hooks, services
- Pattern: Each domain has `types/`, `repositories/`, `hooks/`, `services/` subdirectories
- Used by: Page components and other domains

**Frontend - Components Layer:**

- Purpose: Reusable UI elements
- Location: `frontend/src/components/` and `frontend/src/components/ui/`
- Contains: HeroUI v3 wrappers (button, card, modal, forms), domain components, shared utilities
- Pattern: HeroUI re-exports for backwards compatibility (button.tsx → heroui-button.tsx)

**Frontend - Contexts & Providers:**

- Purpose: Global state management
- Location: `frontend/src/contexts/`, `frontend/src/providers/`
- Contains: Auth context, theme context, language context
- Pattern: React Context for auth state, Zustand for client state (if needed), TanStack Query for server state

## Data Flow

**API Request Flow (Backend):**

1. HTTP request hits Express app (`backend/src/index.ts`)
2. Security middleware applies (Sentry, CORS, rate limiting, auth headers)
3. Route matching to appropriate router (e.g., `/api/countries` → `countries.ts`)
4. Request validation via express-validator
5. Auth token verified via `authenticateToken` middleware
6. Controller calls adapter/repository (Supabase client)
7. Data returned, formatted to JSON response
8. Middleware post-processors (Sentry error handler)

**Page Navigation & Data Fetch (Frontend):**

1. User navigates to `/dossiers/countries/$id`
2. TanStack Router resolves route → loads `countries/$id.tsx`
3. Component queries server state via TanStack Query hooks
4. Query hook calls repository client (`domains/*/repositories/`)
5. Repository calls backend API (`/api/countries/:id`)
6. Response cached by TanStack Query
7. Component re-renders with data
8. Realtime subscriptions via Supabase update cached state

**State Management:**

- **URL State:** TanStack Router manages search params, pagination, filters
- **Server State:** TanStack Query caches API responses, handles refetch logic
- **Client State:** React Context for auth, theme, language; Zustand for complex client state
- **Realtime:** Supabase Realtime subscriptions for live updates

## Key Abstractions

**Repository Pattern:**

- Purpose: Data access abstraction
- Examples: `backend/src/adapters/repositories/supabase/` (CountryRepository, TaskRepository), `frontend/src/domains/document/repositories/`
- Pattern: Interface-based (backend ports), class-based implementations (adapters), query builders

**Service Pattern:**

- Purpose: Business logic composition
- Examples: `backend/src/core/ports/services/`, `frontend/src/domains/*/services/`
- Pattern: Singleton services, dependency injection via constructor

**Hook Pattern (Frontend):**

- Purpose: Reusable logic in React components
- Examples: `useCountry()`, `useDossierContext()`, `useTasks()`
- Pattern: TanStack Query hooks for server state, custom hooks for client logic

**Router Pattern:**

- Purpose: Modular API routing
- Backend: Express Router instances composed in `backend/src/api/index.ts`
- Frontend: TanStack Router file-based routing with automatic code splitting via React.lazy()

## Entry Points

**Backend Entry Point:**

- Location: `backend/src/index.ts`
- Triggers: Node.js process start (`npm run dev` or `node dist/index.js`)
- Responsibilities:
  - Initialize Sentry error tracking
  - Create Express app and register middleware (security, logging, rate limiting)
  - Mount API routers and contract test routes
  - Start HTTP server on port 5000
  - Register scheduled jobs (health scores, overdue commitment detection)

**Frontend Entry Point:**

- Location: `frontend/src/main.tsx`
- Triggers: Vite development server or bundle load in browser
- Responsibilities:
  - Initialize Sentry error tracking
  - Create React root
  - Wrap app with providers (QueryClient, AuthProvider, ThemeProvider, LanguageProvider)
  - Render App component (TanStack Router)

**Frontend App Component:**

- Location: `frontend/src/App.tsx`
- Responsibilities:
  - Compose all providers (QueryClient, Auth, Theme, Language, RTL wrapper)
  - Mount TanStack Router with auth context
  - Mount dev tools (React Query devtools, Offline indicator, Realtime status)
  - Mount global toaster

## Error Handling

**Strategy:** Error-first with Sentry integration and fallback error boundaries

**Patterns:**

Backend:

- Sentry middleware captures exceptions automatically
- Express error handler wraps errors in JSON with status codes (400, 401, 403, 500)
- Custom error classes: ValidationError, UnauthorizedError, ForbiddenError
- Graceful shutdown on SIGTERM/SIGINT

Frontend:

- ErrorBoundary component catches React rendering errors
- Sentry captures client-side exceptions
- Toast notifications for user-facing errors
- Fallback UI for failed data loads

## Cross-Cutting Concerns

**Logging:**

- Backend: Winston logger (`backend/src/utils/logger.ts`) with structured logging (method, URL, duration, IP, user-agent)
- Frontend: Sentry error tracking, console logs in development

**Validation:**

- Backend: express-validator for request validation in API controllers
- Frontend: React Hook Form + Zod for form validation, type safety via TypeScript strict mode

**Authentication:**

- Backend: JWT token verification via `authenticateToken` middleware, Supabase Auth
- Frontend: AuthProvider context manages token, auth.context guards protected routes via TanStack Router
- Protected routes: Use `_protected` layout wrapper, require valid auth context

**Rate Limiting:**

- Backend: express-rate-limit configured via `backend/src/middleware/rate-limit.middleware.ts`
- Aliases: `apiLimiter`, `authLimiter`, `uploadLimiter`, `aiLimiter`, `searchRateLimit`
- Applied at root API and per-route basis

**Caching:**

- Backend: Redis via ioredis for cache metrics service
- Frontend: TanStack Query with stale-while-revalidate, cache invalidation on mutations
- Realtime: Supabase Realtime updates query cache automatically

---

_Architecture analysis: 2026-03-23_
