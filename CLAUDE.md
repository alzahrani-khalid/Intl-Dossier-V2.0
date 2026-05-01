# Intl-DossierV2.0 Development Guidelines

Last updated: 2026-05-01

## Visual Design Source of Truth (READ BEFORE ANY UI WORK)

The canonical visual design is the **IntelDossier prototype** at:

```
frontend/design-system/inteldossier_handoff_design/
├── README.md             <-- voice, content rules, visual foundations
├── colors_and_type.css   <-- foundational tokens (Bureau light)
├── handoff/app.css       <-- production stylesheet (the prototype)
└── src/
    ├── themes.jsx        <-- token builder (4 directions × theme × density × hue)
    ├── app.css           <-- production stylesheet (full prototype)
    ├── icons.jsx         <-- 38-glyph stroked icon set
    ├── glyph.jsx         <-- DossierGlyph (circular flag system)
    ├── loader.jsx        <-- GlobeSpinner / GlobeLoader
    ├── dashboard.jsx     <-- canonical Card / KPI / list patterns
    ├── pages.jsx         <-- canonical page templates
    └── shell.jsx         <-- topbar, sidebar, layout
```

The runtime port lives at **`frontend/src/design-system/`**
(`DesignProvider.tsx`, `tokens/{directions,densities,buildTokens,applyTokens}.ts`,
hooks). The FOUC bootstrap that paints first-frame tokens is at
`frontend/public/bootstrap.js` — its palette/font literals must byte-match
`tokens/directions.ts`.

**Default direction: Bureau.** Ignore Chancery, Situation, and Ministerial
unless a task explicitly references them.

### Required reading order before building or modifying any UI

1. `frontend/design-system/inteldossier_handoff_design/README.md` — voice,
   content rules, visual foundations
2. `frontend/design-system/inteldossier_handoff_design/colors_and_type.css` —
   token names and exact values
3. The closest matching component in
   `frontend/design-system/inteldossier_handoff_design/src/`

If you cannot identify a closest match, **ask before inventing**.

### Design rules — non-negotiable

- All colors via `var(--*)` tokens or the `@theme`-mapped Tailwind utilities
  (`bg-bg`, `bg-surface`, `text-ink`, `border-line`, `bg-accent`, etc.).
  **No raw hex. No Tailwind color literals** like `text-blue-500`.
- Borders are `1px solid var(--line)`. **No drop-shadows on cards.**
  Shadow is reserved for drawers (`var(--shadow-lg)`) and hovered list rows.
- **No gradient backgrounds.** Surfaces are flat.
- Buttons follow `.btn-primary` / `.btn-ghost` from the prototype's `app.css`.
  Do not introduce new button variants without an explicit ask.
- Row heights use `var(--row-h)` (density-aware). Tables and lists must
  obey it.
- Corner radii come from `--radius-sm / --radius / --radius-lg`. Bureau
  radii are 8/12/16. Do not hard-code px.
- **No emoji in user-visible copy.** Emoji is allowed only as data input
  (e.g. flag codepoints).
- **No marketing voice.** Banned: "Discover", "Easily", "Unleash",
  exclamation marks, "you're in!", first-person plural ("we"). Sentence
  case for titles and buttons; UPPERCASE only for classification ribbons,
  mono labels, and table-column headers.
- Dates: `Tue 28 Apr` (day-first, no comma). Times: `14:30 GST`.
  SLA windows: `T-3` / `T+2` (mono-formatted).

### Definition of Done — UI checklist

Before declaring any UI task complete:

- [ ] All colors resolve to design tokens (no raw hex; no `text-blue-500`)
- [ ] Borders are `1px solid var(--line)`; no card shadows
- [ ] Row heights use `var(--row-h)`
- [ ] Buttons mirror prototype `.btn-primary` / `.btn-ghost`
- [ ] Logical properties for spacing (`ms-*`, `ps-*`, `text-start`)
- [ ] No emoji in copy; no marketing voice
- [ ] Tested at 1024px and 1400px (the actual analyst-workstation widths)
- [ ] RTL: rendered with `dir="rtl"` and verified Tajawal applies

## Core Tech Stack

- **Frontend**: React 19+, TypeScript 5.0+ (strict mode), TanStack Router/Query v5, Tailwind CSS v4, IntelDossier Design System (`frontend/design-system/inteldossier_handoff_design/`), i18next, React Flow (network graphs)
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

## Responsive Design

IntelDossier is a **desktop-primary analyst workstation**. The default
target is 1280–1400px. Mobile is a secondary surface for read-only
review.

### Breakpoints

| Width     | Treatment                                                  |
| --------- | ---------------------------------------------------------- |
| 1400px+   | Full layout (sidebar + 2:1 dashboard grid + dossier rail)  |
| 1024–1399 | Full layout, max-page-width 1400 enforced                  |
| 768–1023  | Collapse sidebar to icon rail; KPI strip 2×2               |
| 320–767   | Read-only mobile: stacked, no edit forms, no drag-and-drop |

### Rules

- Build for 1280px first, verify at 1024px, then degrade gracefully
  to 768. Below 768 is read-only.
- Touch targets at 44×44 only on `< 768px`. Above that, density tokens
  (`--row-h`) drive sizing.
- Use logical properties (`ms-*`, `ps-*`) so RTL works without re-styling.
- Never hide critical analyst content behind a mobile-toggle. If the
  feature can't fit at 768, omit it on mobile entirely.

## Arabic RTL Support Guidelines (MANDATORY)

### RTL Detection & Implementation

```tsx
import { useTranslation } from 'react-i18next'
const { i18n } = useTranslation()
const isRTL = i18n.language === 'ar'
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
import { useTranslation } from 'react-i18next'

export function ResponsiveRTLComponent() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

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
  )
}
```

## Component Library Strategy

**The IntelDossier prototype is the visual source of truth.** The
component cascade below is for **interactive primitives only** —
unstyled or minimally-styled building blocks (focus management,
keyboard handling, ARIA). Visual styling, color, spacing, type,
borders, and shadows always come from the prototype tokens.

**Primitive cascade (in order):**

1. **HeroUI v3** — for accessible primitives (Modal, Popover, Combobox,
   etc.). Override its color/spacing/radius via the design tokens; never
   accept its default chrome.
2. **Radix UI** (already in via `@radix-ui/react-slot`) — for headless
   primitives HeroUI doesn't cover.
3. **Build it yourself**, mirroring a prototype component, if no
   primitive fits.

**Banned without explicit user request:**

- Aceternity UI — animation-heavy, marketing aesthetic. Conflicts with
  IntelDossier's restrained motion language. Do not install or import.
- Kibo UI — different visual system. Do not install or import.
- shadcn/ui defaults — the wrappers in `components/ui/heroui-*.tsx` exist
  for API compatibility, not visual fidelity. Re-skin them via tokens.

If a feature seems to require Aceternity-style motion or shadcn defaults,
**stop and ask** before installing anything.

### Component file locations

- **Token-bound primitives**: `frontend/src/components/ui/`
- **Design-system port**: `frontend/src/design-system/` (DesignProvider,
  tokens, hooks)
- **FOUC bootstrap**: `frontend/public/bootstrap.js` (palette + font literals
  must byte-match `tokens/directions.ts`)

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
import type { WorkItem, WorkSource, Priority, TrackingType } from '@/types/work-item.types'

// Always use unified i18n namespace
import { useTranslation } from 'react-i18next'
const { t } = useTranslation('unified-kanban')

// Correct terminology
t('priority.urgent') // NOT 'priority.critical'
t('status.in_progress') // Consistent naming
t('columns.todo') // Workflow stage for display
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
import { getDossierRouteSegment } from '@/lib/dossier-routes'
const route = getDossierRouteSegment('country') // Returns 'countries'

// Type validation
import { isValidDossierType } from '@/lib/dossier-type-guards'
if (isValidDossierType(type)) {
  /* type-safe usage */
}

// Dossier context inheritance hook
import { useResolveDossierContext } from '@/hooks/useResolveDossierContext'
const { dossiers, inheritanceSource } = useResolveDossierContext(parentType, parentId)
```

### Component Usage

```tsx
// Display dossier context badge on work items
import { DossierContextBadge } from '@/components/Dossier/DossierContextBadge'
;<DossierContextBadge
  dossier={dossier}
  inheritanceSource="direct" // or 'engagement', 'after_action', etc.
/>

// Universal card for any dossier type
import { UniversalDossierCard } from '@/components/Dossier/UniversalDossierCard'
;<UniversalDossierCard dossier={dossier} />

// Type selector for dossier creation
import { DossierTypeSelector } from '@/components/Dossier/DossierTypeSelector'
;<DossierTypeSelector value={type} onChange={setType} />
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

- **Tech stack**: Must stay within current stack (React 19, Express, Supabase, TanStack, Tailwind v4) — no framework migrations. The brand/component layer is the IntelDossier Design System at `frontend/design-system/inteldossier_handoff_design/`; component libraries below it are an implementation detail and may be swapped to serve the design system.
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

| Layer          | Location                                            | Purpose                                                             |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------------- |
| Domain         | `backend/src/core/domain/`                          | Business logic, entities (framework-agnostic)                       |
| Ports/Adapters | `backend/src/core/ports/`, `backend/src/adapters/`  | Contracts + Supabase/AI/email implementations                       |
| API            | `backend/src/api/` (60+ files)                      | Express routers, feature-based                                      |
| Middleware     | `backend/src/middleware/`                           | Auth, rate-limit, security headers                                  |
| Routes         | `frontend/src/routes/` (100+ files)                 | TanStack Router, `__root.tsx` → `_protected.tsx` → feature routes   |
| Domains        | `frontend/src/domains/{feature}/`                   | Types, repositories, hooks, services per feature                    |
| Components     | `frontend/src/components/ui/`                       | App component primitives bound to IntelDossier Design System tokens |
| State          | `frontend/src/contexts/`, `frontend/src/providers/` | Auth/theme/language contexts                                        |

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

# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED

Any Bash command containing `curl` or `wget` is intercepted and replaced with an error message. Do NOT retry.
Instead use:

- `ctx_fetch_and_index(url, source)` to fetch and index web pages
- `ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED

Any Bash command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` is intercepted and replaced with an error message. Do NOT retry with Bash.
Instead use:

- `ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### WebFetch — BLOCKED

WebFetch calls are denied entirely. The URL is extracted and you are told to use `ctx_fetch_and_index` instead.
Instead use:

- `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Bash (>20 lines output)

Bash is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:

- `ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### Read (for analysis)

If you are reading a file to **Edit** it → Read is correct (Edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `ctx_execute_file(path, language, code)` instead. Only your printed summary enters context. The raw file content stays in the sandbox.

### Grep (large results)

Grep results can flood context. Use `ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `ctx_execute(language, code)` | `ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Subagent routing

When spawning subagents (Agent/Task tool), the routing block is automatically injected into their prompt. Bash-type subagents are upgraded to general-purpose so they have access to MCP tools. You do NOT need to manually instruct subagents about context-mode.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `ctx_search(source: "label")` later.

## ctx commands

| Command       | Action                                                                                |
| ------------- | ------------------------------------------------------------------------------------- |
| `ctx stats`   | Call the `ctx_stats` MCP tool and display the full output verbatim                    |
| `ctx doctor`  | Call the `ctx_doctor` MCP tool, run the returned shell command, display as checklist  |
| `ctx upgrade` | Call the `ctx_upgrade` MCP tool, run the returned shell command, display as checklist |

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:

- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
