# Codebase Structure

**Analysis Date:** 2026-03-23

## Directory Layout

```
intl-dossierv2.0/
├── backend/                    # Express.js API server (Node 20+, ES modules)
│   ├── src/
│   │   ├── index.ts           # Entry point: Express app setup, middleware, error handling
│   │   ├── api/               # 60+ API endpoints organized by feature
│   │   ├── core/              # Domain-driven design layer
│   │   │   ├── domain/        # Business logic, entities, rules
│   │   │   ├── ports/         # Interfaces: repositories, services, infrastructure
│   │   │   └── tenant/        # Multi-tenant support
│   │   ├── adapters/          # Infrastructure implementations
│   │   │   ├── repositories/  # Supabase data access
│   │   │   ├── external/      # External APIs (AI, email, calendar, signature)
│   │   │   └── infrastructure/# Logging, caching, utilities
│   │   ├── middleware/        # Cross-cutting concerns
│   │   │   ├── security.ts    # CORS, helmet, auth, rate limiting
│   │   │   └── auth.ts        # JWT token verification
│   │   ├── services/          # Business logic services
│   │   ├── jobs/              # Scheduled tasks (cron)
│   │   ├── models/            # Data models, schemas
│   │   ├── types/             # TypeScript type definitions
│   │   ├── config/            # Configuration management
│   │   ├── utils/             # Utilities (logger, validation)
│   │   ├── lib/               # Third-party integrations (Sentry)
│   │   └── container/         # Dependency injection container
│   ├── package.json           # Dependencies: express, supabase-js, AI SDKs
│   └── vitest.config.ts       # Unit test configuration
│
├── frontend/                   # React 19 + Vite SPA (Node 20+)
│   ├── src/
│   │   ├── main.tsx           # Entry point: React root, providers setup
│   │   ├── App.tsx            # Root component: provider composition
│   │   ├── router.ts          # TanStack Router configuration
│   │   ├── routes/            # 100+ page components (file-based routing)
│   │   │   ├── __root.tsx     # Root layout wrapper
│   │   │   ├── _protected.tsx # Auth-protected layout
│   │   │   └── _protected/    # Protected routes (dossiers, tasks, calendar, etc.)
│   │   ├── domains/           # Feature-specific business logic (mirrors backend)
│   │   │   ├── shared/        # Common types, utilities, errors
│   │   │   ├── document/      # Document domain (types, repos, hooks, services)
│   │   │   ├── engagement/    # Engagement domain
│   │   │   └── relationship/  # Relationship domain
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # HeroUI v3 wrappers and primitives
│   │   │   ├── theme-provider/# Theme context provider
│   │   │   ├── language-provider/ # i18n provider
│   │   │   ├── Dossier/       # Dossier-specific components
│   │   │   └── [feature]/     # Domain-specific components
│   │   ├── contexts/          # React Context (auth, theme, language)
│   │   ├── providers/         # Composable provider wrappers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities (query client, Sentry, API client)
│   │   ├── utils/             # Helper functions (storage, broadcast, etc.)
│   │   ├── types/             # Global TypeScript types
│   │   ├── i18n/              # Internationalization setup
│   │   └── index.css          # Global styles (Tailwind)
│   ├── package.json           # Dependencies: React, TanStack Router/Query, Tailwind CSS v4
│   └── vite.config.ts         # Vite configuration with code splitting
│
├── shared/                     # Shared types and utilities (if needed)
│   └── package.json           # Workspace package
│
├── supabase/                   # Database migrations and seed data
│   ├── migrations/            # SQL schema migrations
│   └── seed.sql               # Initial data seeding
│
├── tests/                      # End-to-end, contract, and integration tests
│   ├── e2e/                    # Playwright E2E tests
│   ├── contract/              # API contract tests (vitest)
│   └── integration/           # Integration tests
│
├── deploy/                     # Deployment configurations
│   ├── DROPLET_INSTRUCTIONS.md # DigitalOcean droplet setup
│   └── docker-compose.*.yml    # Docker Compose for dev/staging/prod
│
├── docs/                       # Project documentation
│   ├── DOSSIER_CENTRIC_ARCHITECTURE.md # Core design
│   └── [feature].md            # Feature documentation
│
├── pnpm-workspace.yaml         # Monorepo workspace definition
├── package.json                # Root monorepo config with turborepo scripts
├── tsconfig.json               # Root TypeScript config
├── turbo.json                  # Turborepo task pipeline
└── docker-compose.yml          # Local development Docker setup
```

## Directory Purposes

**backend/src/api/:**

- Purpose: All HTTP endpoints organized by feature
- Contains: Express routers for countries, tasks, documents, organizations, contacts, commitments, intelligence, relationships, etc.
- Key files: `index.ts` (router composition), `ai.ts` (AI endpoints), `search.ts` (search endpoints), `after-action.ts` (post-meeting docs)
- Pattern: Feature-based organization with sub-routes under each feature

**backend/src/core/:**

- Purpose: Domain-driven design isolation from external concerns
- Contains: Domain entities, business logic, port interfaces
- Subdirectories: `domain/` (business rules), `ports/` (interfaces for adapters), `tenant/` (multi-tenancy)

**backend/src/adapters/:**

- Purpose: Concrete implementations of ports (repositories, external services)
- Contains: Supabase repository implementations, AI adapters (Anthropic, OpenAI, Mastra), email service, calendar sync, signature generation
- Pattern: One adapter class per port interface

**frontend/src/routes/:**

- Purpose: TanStack Router file-based page structure
- Contains: 100+ page components
- Key files: `__root.tsx` (layout), `_protected.tsx` (auth guard), dossier details (`dossiers/countries/$id.tsx`), work lists (`my-work/assignments.tsx`)
- Pattern: Nested route files map to URL structure; `$` prefix = URL parameters

**frontend/src/domains/:**

- Purpose: Feature-specific business logic (mirrors backend architecture)
- Contains: TypeScript types, API client repositories, custom hooks, services
- Subdirectories: Each domain has `types/`, `repositories/`, `hooks/`, `services/`
- Pattern: Domain isolation for easier feature understanding and testing

**frontend/src/components/ui/:**

- Purpose: UI component primitives and HeroUI v3 wrappers
- Contains: `button.tsx`, `card.tsx`, `modal.tsx`, `forms.tsx`, `skeleton.tsx`
- Pattern: Shadow exports from HeroUI wrappers (heroui-button.tsx) for drop-in replacement
- Usage: `import { Button } from '@/components/ui/button'`

## Key File Locations

**Entry Points:**

- `backend/src/index.ts`: Backend server initialization (Express app, middleware, routers)
- `frontend/src/main.tsx`: Frontend app initialization (React root, providers)
- `frontend/src/App.tsx`: Root component wrapping all providers and router

**Configuration:**

- `backend/src/config/`: Environment and app configuration
- `frontend/vite.config.ts`: Build configuration, code splitting
- `turbo.json`: Turborepo task pipeline (dev, build, test, lint)

**Core Logic:**

- `backend/src/core/domain/`: Business logic and entities (framework-independent)
- `backend/src/adapters/repositories/supabase/`: Data access layer
- `frontend/src/domains/*/repositories/`: API client wrappers
- `frontend/src/hooks/`: TanStack Query hooks for server state, custom React hooks

**Testing:**

- `backend/vitest.config.ts`: Backend unit test config
- `frontend/vitest.config.ts` + `vitest.a11y.config.ts`: Frontend tests and a11y tests
- `playwright.config.ts`: E2E test configuration
- `tests/contract/`, `tests/integration/`, `tests/e2e/`: Test suites

## Naming Conventions

**Files:**

- Feature routers: lowercase with hyphens (`countries.ts`, `task-contributors.ts`)
- Components: PascalCase (`CountryCard.tsx`, `DossierContextBadge.tsx`)
- Hooks: camelCase with `use` prefix (`useCountry.ts`, `useDossierContext.ts`)
- Types: PascalCase (`Country.ts`, `WorkItem.ts`) or `.types.ts` suffix
- Tests: `.test.ts` or `.spec.ts` suffix

**Directories:**

- Feature domains: lowercase (`document`, `engagement`, `relationship`)
- Component grouping: PascalCase (`ui/`, `Dossier/`, `Shared/`)
- Type definitions: `types/` or `[feature].types.ts`
- Utility functions: `utils/` with lowercase filenames

## Where to Add New Code

**New Backend Endpoint:**

1. Create feature router in `backend/src/api/{feature}.ts` (if not exists)
2. Define route handlers with validation
3. Call adapter/repository methods for data access
4. Mount router in `backend/src/api/index.ts`

**New Frontend Page/Route:**

1. Create route file in `frontend/src/routes/_protected/{feature}/[page].tsx`
2. Import component (or define inline)
3. Use TanStack Query hooks from domain repositories for data
4. TanStack Router automatically makes it available at corresponding URL

**New Component:**

1. If UI primitive: add to `frontend/src/components/ui/`
2. If feature-specific: add to `frontend/src/components/{Feature}/`
3. Use HeroUI v3 wrappers via `@/components/ui/button`, etc.
4. Export from barrel file (`index.ts`) if grouping multiple components

**Utilities:**

- Shared helpers: `backend/src/utils/`, `frontend/src/utils/`
- Domain-specific: `backend/src/adapters/infrastructure/`, `frontend/src/domains/{feature}/services/`

## Special Directories

**backend/src/middleware/:**

- Purpose: Cross-cutting middleware (auth, security, logging, rate limiting)
- Generated: No
- Committed: Yes
- Key files: `security.ts` (CORS, helmet, headers, rate limit), `auth.ts` (JWT verification)

**backend/src/jobs/:**

- Purpose: Scheduled background tasks (cron)
- Generated: No
- Committed: Yes
- Examples: `refresh-health-scores.job.ts`, `detect-overdue-commitments.job.ts`

**frontend/src/routes/**:

- Purpose: File-based routing (TanStack Router auto-generates from file structure)
- Generated: Partially (route types auto-generated by TanStack Router plugin)
- Committed: Yes
- Pattern: Underscore prefix for layout wrappers (not URL-mapped)

**supabase/migrations/:**

- Purpose: Database schema migrations (SQL)
- Generated: No (manually created or via Supabase CLI)
- Committed: Yes
- Applied: Via `pnpm db:migrate` command

**dist/ (backend/dist, frontend/dist):**

- Purpose: Built output
- Generated: Yes (via TypeScript/Vite build)
- Committed: No (in .gitignore)

---

_Structure analysis: 2026-03-23_
