# Intl-DossierV2.0 Development Guidelines

Last updated: 2026-03-26

## Core Tech Stack

- **Frontend**: React 19+, TypeScript 5.0+ (strict mode), TanStack Router/Query v5, Tailwind CSS v4, HeroUI v3 (React Aria), i18next, React Flow (network graphs)
- **Backend**: Node.js 18+ LTS, Supabase (PostgreSQL 15+, Auth, RLS, Realtime, Storage), Redis 7.x
- **Database**: PostgreSQL 15+ with pgvector, pg_trgm, pg_tsvector extensions
- **AI/ML**: AnythingLLM (self-hosted), vector embeddings (1536 dimensions)
- **Additional**: @dnd-kit/core (drag-and-drop), Vite (build tool)

## Project Structure

```
backend/          # Express + TypeScript API
frontend/         # React 19 + Vite app
tests/            # Unit, integration, E2E tests
supabase/         # Migrations, seed data, Edge Functions
```

## Commands

- **Dev**: `pnpm dev` (monorepo via Turborepo)
- **Build**: `pnpm build`
- **Test**: `pnpm test`, `pnpm lint`, `pnpm typecheck`
- **DB**: `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:reset`

## Mobile-First & Responsive Design (MANDATORY)

### Core Principles

- **ALWAYS** start with mobile layout (320px+), then scale up
- **NEVER** write desktop-first CSS or components
- **Breakpoints**: base (0-640px) → sm (640px+) → md (768px+) → lg (1024px+) → xl (1280px+) → 2xl (1536px+)
- **Touch targets**: Minimum 44x44px (`min-h-11 min-w-11`)
- **Spacing**: Min 8px gap between interactive elements

### Essential Patterns

```tsx
// Responsive container, grid, flexbox, typography
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
    <Button className="h-11 px-4 sm:h-10 sm:px-6 md:h-12 md:px-8">
  </div>
</div>
```

## Arabic RTL Support Guidelines (MANDATORY)

### RTL Detection & Implementation

```tsx
import { useTranslation } from 'react-i18next';
const { i18n } = useTranslation();
const isRTL = i18n.language === 'ar';
```

### RTL-Safe Tailwind Classes (REQUIRED)

**NEVER** use `left`, `right`, `ml-*`, `mr-*`, `pl-*`, `pr-*`
**ALWAYS** use logical properties:

| ❌ Avoid      | ✅ Use Instead | Description         |
| ------------- | -------------- | ------------------- |
| `ml-*`        | `ms-*`         | Margin start        |
| `mr-*`        | `me-*`         | Margin end          |
| `pl-*`        | `ps-*`         | Padding start       |
| `pr-*`        | `pe-*`         | Padding end         |
| `left-*`      | `start-*`      | Position start      |
| `right-*`     | `end-*`        | Position end        |
| `text-left`   | `text-start`   | Text align start    |
| `text-right`  | `text-end`     | Text align end      |
| `rounded-l-*` | `rounded-s-*`  | Border radius start |
| `rounded-r-*` | `rounded-e-*`  | Border radius end   |

### RTL Component Template

```tsx
import { useTranslation } from 'react-i18next';

export function ResponsiveRTLComponent() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row gap-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl text-start">{t('title')}</h1>
      <button className="h-11 min-w-11 px-4 sm:px-6 ms-4 sm:ms-6 rounded-s-lg rounded-e-lg">
        {t('action')}
      </button>
      {/* Flip directional icons */}
      <ChevronRight className={isRTL ? 'rotate-180' : ''} />
    </div>
  );
}
```

## UI Component Guidelines

### HeroUI v3 Component Strategy (MANDATORY - HIGHEST PRIORITY)

**⚠️ HeroUI v3 is in BETA** - Expect breaking changes. Migration from v2 to v3 is NOT yet available.

**Component Selection Hierarchy** - **ALWAYS** follow this order (NO EXCEPTIONS):

1. **HeroUI v3 (Primary)**: https://heroui-react-v3.vercel.app/docs/react
   - Built on **React Aria Components** (accessibility-first)
   - Requires **Tailwind CSS v4** (NOT v3)
   - Uses **compound component pattern** (e.g., `Card.Header`, `Modal.Body`)
   - No Provider component needed (unlike v2)
   - **Install**: `pnpm add @heroui/react @heroui/styles`
   - **MCP Available**: Use `heroui-react` MCP tools for docs and component info

2. **Aceternity UI (Secondary)**: https://ui.aceternity.com/components
   - **130+ components** with advanced animations
   - Use for animated/decorative components not in HeroUI
   - **Install**: `npx shadcn@latest add https://ui.aceternity.com/registry/[component].json --yes`

3. **Kibo-UI (Tertiary)**: https://www.kibo-ui.com
   - Use ONLY if HeroUI AND Aceternity don't have equivalent
   - **Install**: `npx shadcn@latest add @kibo-ui/[component]`

4. **shadcn/ui (Last Resort)**: https://ui.shadcn.com
   - Use ONLY if all above don't have the component
   - **Install**: `npx shadcn@latest add [component]`

### HeroUI v3 Drop-In Replacement Pattern

We use a **shadcn re-export pattern** for seamless migration:

```
frontend/src/components/ui/
├── button.tsx          → re-exports from heroui-button.tsx
├── card.tsx            → re-exports from heroui-card.tsx
├── badge.tsx           → re-exports from heroui-chip.tsx
├── skeleton.tsx        → re-exports from heroui-skeleton.tsx
├── heroui-button.tsx   → HeroUI Button with cva + Slot (asChild support)
├── heroui-card.tsx     → HeroUI Card as plain divs
├── heroui-chip.tsx     → HeroUI Chip as Badge (span)
├── heroui-skeleton.tsx → HeroUI Skeleton with animate-pulse
├── heroui-modal.tsx    → HeroUI Modal with Dialog-compatible API
└── heroui-forms.tsx    → TextField, TextArea, Checkbox, Switch wrappers
```

**Key Design Decisions**:

- Wrappers render as **plain HTML elements** (div/span/button), NOT HeroUI primitives
- This ensures full `React.HTMLAttributes` compatibility
- `buttonVariants` exported via `cva` (same API as shadcn)
- `asChild` supported via `@radix-ui/react-slot`

### HeroUI v3 Gotchas

- **Compound components**: `Card.Header`, `Modal.Body`, `Tooltip.Content`, etc.
- **Dropdown placement**: Space-separated (`"bottom start"` NOT `"bottom-start"`)
- **Theme**: `light`/`dark`/`system` via `.dark` class on `<html>`
- **Component APIs**: Use `heroui-react` MCP tools or `/heroui-react` skill for full docs

### Before Writing ANY Component

1. Check HeroUI v3 → Aceternity UI → Kibo-UI → shadcn/ui (in order)
2. Must be mobile-first with RTL logical properties

### Component File Locations

- **HeroUI wrappers**: `frontend/src/components/ui/heroui-*.tsx`
- **Re-exports (shadcn compat)**: `frontend/src/components/ui/*.tsx`
- **Configuration**: `frontend/components.json`

### Key Dependencies

- ✅ `@heroui/react` - HeroUI v3 components
- ✅ `@heroui/styles` - HeroUI styling system
- ✅ `@radix-ui/react-slot` - For `asChild` prop support
- ✅ `class-variance-authority` (cva) - Variant management
- ✅ `clsx` - Conditional classnames utility
- ✅ `tailwind-merge` - Merge Tailwind classes

### Aceternity UI (Secondary - For Animations)

- For animated/decorative components (sparkles, aurora, typewriter, 3D cards, marquee)
- **Install**: `npx shadcn@latest add https://ui.aceternity.com/registry/[component].json --yes`

## Work Management Terminology (MANDATORY)

Use consistent terminology across all work-related features. This glossary is the single source of truth.

### Unified Terms

| Term          | Definition                                                                  | Replaces                          |
| ------------- | --------------------------------------------------------------------------- | --------------------------------- |
| **Work Item** | Any trackable unit of work in the system                                    | Task, Assignment                  |
| **Assignee**  | Person responsible for completing work                                      | Owner, Assigned To, Assigned User |
| **Deadline**  | Target completion date/time                                                 | Due Date, SLA Deadline            |
| **Priority**  | Importance level: `low`, `medium`, `high`, `urgent`                         | `critical` (use `urgent` instead) |
| **Status**    | Current state: `pending`, `in_progress`, `review`, `completed`, `cancelled` | Workflow Stage (for display)      |

### Source Types

Work items originate from different sources, identified by the `source` field:

| Source         | Description                                    | Typical Use Case          |
| -------------- | ---------------------------------------------- | ------------------------- |
| **task**       | Internal operational work with Kanban workflow | Assignments, action items |
| **commitment** | Promises from after-action records             | Deliverables, follow-ups  |
| **intake**     | Service requests through intake system         | Support tickets, requests |

### Tracking Types

Work items are categorized by how they're tracked:

| Tracking Type | Description                | Typical Sources              |
| ------------- | -------------------------- | ---------------------------- |
| **delivery**  | Deliverable-based tracking | Internal commitments, tasks  |
| **follow_up** | External party follow-up   | External commitments         |
| **sla**       | SLA-driven with deadlines  | Intake tickets, urgent tasks |

### Workflow Stages (Tasks Only)

Kanban board positions for tasks:

| Stage         | Description              |
| ------------- | ------------------------ |
| `todo`        | Not started, in backlog  |
| `in_progress` | Actively being worked on |
| `review`      | Pending review/approval  |
| `done`        | Successfully completed   |
| `cancelled`   | Explicitly cancelled     |

### Code Usage

```typescript
// Always use unified types from work-item.types.ts
import type { WorkItem, WorkSource, Priority, TrackingType } from '@/types/work-item.types';

// Always use unified i18n namespace
import { useTranslation } from 'react-i18next';
const { t } = useTranslation('unified-kanban');

// Correct terminology
t('priority.urgent'); // NOT 'priority.critical'
t('status.in_progress'); // Consistent naming
t('columns.todo'); // Workflow stage for display
```

### Database Column Naming

| Field           | Type        | Description                                        |
| --------------- | ----------- | -------------------------------------------------- |
| `assignee_id`   | UUID        | User responsible (NOT `owner_id`, `assigned_to`)   |
| `deadline`      | TIMESTAMPTZ | Target completion (NOT `due_date`, `sla_deadline`) |
| `priority`      | ENUM        | `low`, `medium`, `high`, `urgent`                  |
| `status`        | ENUM        | Current state                                      |
| `source`        | ENUM        | `commitment`, `task`, `intake`                     |
| `tracking_type` | ENUM        | `delivery`, `follow_up`, `sla`                     |

## Dossier-Centric Development Patterns (MANDATORY)

The system is built around **dossiers** as the central organizing concept. All features should connect to dossiers.

### Core Principle

**"Everything starts with a Dossier"** - When building new features:

1. Identify which dossier type(s) the feature relates to
2. Use `work_item_dossiers` for task/commitment/intake linking
3. Show dossier context via `DossierContextBadge` component
4. Include dossier in activity timelines

### Dossier Types (8 total)

| Type               | Description                                   |
| ------------------ | --------------------------------------------- |
| `country`          | Nation states with diplomatic relations       |
| `organization`     | International bodies, agencies, ministries    |
| `forum`            | Multi-party conferences and summits           |
| `engagement`       | Diplomatic meetings, consultations, visits    |
| `topic`            | Policy areas and strategic initiatives        |
| `working_group`    | Committees and task forces                    |
| `person`           | VIPs requiring tracking                       |
| `elected_official` | Government contacts with office/term metadata |

### Key Utilities & Functions

```typescript
// URL generation for dossier routes
import { getDossierRouteSegment } from '@/lib/dossier-routes';
const route = getDossierRouteSegment('country'); // Returns 'countries'

// Type validation
import { isValidDossierType } from '@/lib/dossier-type-guards';
if (isValidDossierType(type)) {
  /* type-safe usage */
}

// Dossier context inheritance hook
import { useResolveDossierContext } from '@/hooks/useResolveDossierContext';
const { dossiers, inheritanceSource } = useResolveDossierContext(parentType, parentId);
```

### Component Usage

```tsx
// Display dossier context badge on work items
import { DossierContextBadge } from '@/components/Dossier/DossierContextBadge';
<DossierContextBadge
  dossier={dossier}
  inheritanceSource="direct" // or 'engagement', 'after_action', etc.
/>;

// Universal card for any dossier type
import { UniversalDossierCard } from '@/components/Dossier/UniversalDossierCard';
<UniversalDossierCard dossier={dossier} />;

// Type selector for dossier creation
import { DossierTypeSelector } from '@/components/Dossier/DossierTypeSelector';
<DossierTypeSelector value={type} onChange={setType} />;
```

### Database Linking Pattern

Work items connect to dossiers via the `work_item_dossiers` junction table:

```sql
-- Link work items to dossiers with inheritance tracking
INSERT INTO work_item_dossiers (work_item_id, dossier_id, inheritance_source)
VALUES (
  'task-uuid',
  'country-dossier-uuid',
  'direct'  -- or 'engagement', 'after_action', 'position', 'mou'
);
```

### Architecture Documentation

For comprehensive details, see:

- [Dossier-Centric Architecture](./docs/DOSSIER_CENTRIC_ARCHITECTURE.md) - Complete system design
- Section 2: Dossier Connections Map
- Section 5: 13 Improvement Recommendations with priority matrix

<!-- Recent changes: see git log. Key: HeroUI v3 migration (036), dossier context (035), UI polish (034), AI briefs (033) -->

<!-- MANUAL ADDITIONS START -->

## Deployment Configuration

### Staging Environment

- **Project Name**: Intl-Dossier
- **Project ID**: zkrcjzdemdmwhearhfgg
- **Region**: eu-west-2
- **Database**: PostgreSQL 17.6.1.008
- **Host**: db.zkrcjzdemdmwhearhfgg.supabase.co

### Deployment Commands

- Migrations: Use Supabase MCP to apply migrations
- Edge Functions: Deploy via Supabase CLI or MCP
- Realtime: Enable via Supabase dashboard or MCP

### DigitalOcean Droplet (Production)

- **IP Address**: 138.197.195.242
- **SSH Access**: `ssh root@138.197.195.242` (key pre-configured)
- **App Directory**: `/opt/intl-dossier/`
- **Port**: 80 (HTTP), 443 (HTTPS - not yet configured)
- **Full Instructions**: See `deploy/DROPLET_INSTRUCTIONS.md`

**Quick Deploy:**

```bash
git push && ssh root@138.197.195.242 "cd /opt/intl-dossier && git pull && cd deploy && docker compose -f docker-compose.prod.yml build frontend && docker compose -f docker-compose.prod.yml up -d frontend"
```

### Test Credentials for Browser/Chrome MCP

When testing the application using browser automation tools (Chrome MCP, Playwright, etc.), use credentials from environment variables:

- **Email**: `$TEST_USER_EMAIL` (see `.env.test.example`)
- **Password**: `$TEST_USER_PASSWORD` (see `.env.test.example`)

For local development, set these in `.env.test` (not committed to git).

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:

1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes

<!-- MANUAL ADDITIONS END -->

<!-- GSD:project-start source:PROJECT.md -->

## Project

**Intl-Dossier v2.0 — Production Quality Milestone**

A diplomatic dossier management system for tracking countries, organizations, forums, engagements, topics, working groups, persons, and elected officials. Built with React 19 + TanStack Router/Query, Express backend, Supabase (PostgreSQL + Auth + Realtime), AI briefing generation, and bilingual Arabic/English support. Used by international affairs professionals to manage diplomatic relationships, work items, and intelligence signals.

**Core Value:** The codebase must be production-ready — clean, consistent, secure, performant, and fully responsive with proper RTL/LTR theming — before new features are built on top of it.

### Constraints

- **Tech stack**: Must stay within current stack (React 19, Express, Supabase, TanStack, HeroUI v3, Tailwind v4) — no framework migrations
- **Backwards compatibility**: All existing features must continue working after cleanup — no regressions
- **Bilingual**: Arabic (RTL) and English (LTR) must both work correctly after every change
- **Database**: Supabase managed PostgreSQL — migrations via Supabase MCP, no direct DB access changes
- **Deployment**: DigitalOcean droplet with Docker Compose — changes must be deployable via existing pipeline
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

- **Runtime**: Node.js 20.19.0+, pnpm 10.29.1+ (monorepo via Turbo)
- **Languages**: TypeScript 5.5+ (backend) / 5.9+ (frontend) strict mode, SQL, Bash
- **Testing**: Vitest (unit/integration), Playwright (E2E), @testing-library/react, axe-core (a11y)

<!-- Dependencies, config, and platform requirements: see package.json, .env.example, and .backend/.env.example -->
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- **React Components**: PascalCase with `.tsx` extension (e.g., `ConsistencyPanel.tsx`, `UniversalDossierCard.tsx`)
- **Hooks**: Prefix with `use`, camelCase (e.g., `useAuth.ts`, `useDossiers.ts`, `use-compliance.ts`)
- **Utilities**: camelCase with `.ts` extension (e.g., `api-helpers.ts`)
- **Middleware**: hyphenated or camelCase with `.ts` extension (e.g., `rate-limit.middleware.ts`, `errorHandler.ts`)
- **Types/Interfaces**: Suffix with `.types.ts` (e.g., `work-item.types.ts`, `common.types.ts`, `ai-extraction.types.ts`)
- **Test files**: `*.test.ts` or `*.test.tsx` (e.g., `Country.test.ts`, `ConsistencyPanel.test.tsx`)
- camelCase for all function names
- Explicitly typed return types (required by ESLint rule `@typescript-eslint/explicit-function-return-type`)
- Example: `const calculateRelationshipHealthScore = (): number => { ... }`
- camelCase for variables: `const testCountry = { ... }`
- camelCase for functions: `const getClientMessage = (): string => { ... }`
- CONSTANT_CASE only when necessary (rare in modern codebase)
- PascalCase for interfaces and type aliases (e.g., `ConsistencyCheck`, `Country`, `WorkItem`)
- Enum values: CONSTANT_CASE (e.g., `conflict_type: 'contradiction' as const`)

## Code Style

- **Semicolons**: Off (configured as `"semi": false`)
- **Trailing Commas**: All (ES5 compatible, `"trailingComma": "all"`)
- **Quotes**: Single quotes for strings (`"singleQuote": true`)
- **JSX Quotes**: Double quotes for JSX attributes (`"jsxSingleQuote": false`)
- **Print Width**: 100 characters per line
- **Tab Width**: 2 spaces (not tabs)
- **Line Endings**: LF only (`"endOfLine": "lf"`)
- **Arrow Parentheses**: Always include (e.g., `(x) => x + 1`)
- **Explicit Return Types**: Required on all functions (`@typescript-eslint/explicit-function-return-type`)
- **No Explicit `any`**: Error-level (`@typescript-eslint/no-explicit-any: error`)
- **No Unused Variables**: Error-level (`@typescript-eslint/no-unused-vars: error`)
- **No Floating Promises**: Error-level (`@typescript-eslint/no-floating-promises: error`)
- **Console Usage**: Warn, but allow `console.warn()` and `console.error()`
- **React**: React 19+ (no need for `React` import in JSX files)
- **Strict Boolean Expressions**: Enforced (`@typescript-eslint/strict-boolean-expressions: error`)

<!-- RTL enforcement: see "Arabic RTL Support Guidelines" section above -->

## Import Organization

- `@`: Root of `src/` directory (e.g., `@/components`, `@/hooks`, `@/types`)
- `@tests`: Test utilities directory (for test files)

## Error Handling

- Use `try/catch` with specific error types
- Return discriminated union types: `{ success: boolean, data?: T, error?: Error }`
- Async operations should not use floating promises

## Logging

- **Backend**: Winston logger (configured in `src/utils/logger.ts`)
- **Frontend**: `console.warn()` and `console.error()` (production-safe)

## Module Design

- Named exports for functions/classes; default exports only for React components
- `src/types/index.ts` and `src/utils/index.ts` re-export all; avoid circular deps
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## Pattern Overview

- Monorepo structure (Turborepo) with 3 workspaces: `backend`, `frontend`, `shared`
- Express.js backend with domain-driven design layers (core domain, ports, adapters)
- React 19 + TanStack Router v5 for URL-driven state management
- Supabase PostgreSQL as primary data store with Realtime subscriptions
- API-first architecture with separate auth and protected routes
- Error-tracked via Sentry on both frontend and backend

## Key Layers

| Layer | Location | Purpose |
|-------|----------|---------|
| Domain | `backend/src/core/domain/` | Business logic, entities (framework-agnostic) |
| Ports/Adapters | `backend/src/core/ports/`, `backend/src/adapters/` | Contracts + Supabase/AI/email implementations |
| API | `backend/src/api/` (60+ files) | Express routers, feature-based |
| Middleware | `backend/src/middleware/` | Auth, rate-limit, security headers |
| Routes | `frontend/src/routes/` (100+ files) | TanStack Router, `__root.tsx` → `_protected.tsx` → feature routes |
| Domains | `frontend/src/domains/{feature}/` | Types, repositories, hooks, services per feature |
| Components | `frontend/src/components/ui/` | HeroUI wrappers + re-exports (shadcn compat) |
| State | `frontend/src/contexts/`, `frontend/src/providers/` | Auth/theme/language contexts |

## Data Flow

- **URL State:** TanStack Router manages search params, pagination, filters
- **Server State:** TanStack Query caches API responses, handles refetch logic
- **Client State:** React Context for auth, theme, language; Zustand for complex client state
- **Realtime:** Supabase Realtime subscriptions for live updates

## Entry Points

- Backend: `backend/src/index.ts` | Frontend: `frontend/src/main.tsx` → `App.tsx`

## Cross-Cutting

- **Auth**: JWT via `authenticateToken` middleware + Supabase Auth; `_protected` route wrapper
- **Validation**: express-validator (backend), React Hook Form + Zod (frontend)
- **Error tracking**: Sentry (both), Winston logger (backend), ErrorBoundary (frontend)
- **Rate limiting**: `rate-limit.middleware.ts` — `apiLimiter`, `authLimiter`, `uploadLimiter`, `aiLimiter`
- **Caching**: Redis/ioredis (backend), TanStack Query stale-while-revalidate (frontend)
- **Realtime**: Supabase Realtime subscriptions auto-update query cache
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.

<!-- GSD:profile-end -->

<!-- Karpathy-Skills:start -->

## Karpathy Coding Principles

Source: https://github.com/forrestchang/andrej-karpathy-skills (CLAUDE.md)

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

<!-- Karpathy-Skills:end -->
