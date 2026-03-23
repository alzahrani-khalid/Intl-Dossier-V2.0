# Intl-DossierV2.0 Development Guidelines

Last updated: 2026-03-07

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

### HeroUI v3 Compound Component APIs

**Tooltip:**

```tsx
<Tooltip delay={0}>
  <Tooltip.Trigger>{trigger}</Tooltip.Trigger>
  <Tooltip.Content placement="right">{content}</Tooltip.Content>
</Tooltip>
```

**Modal:**

```tsx
<Modal>
  <Button>Trigger</Button>
  <Modal.Backdrop>
    <Modal.Container size="md" placement="center">
      <Modal.Dialog>
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading>Title</Modal.Heading>
        </Modal.Header>
        <Modal.Body>{content}</Modal.Body>
        <Modal.Footer>
          <Button slot="close">Close</Button>
        </Modal.Footer>
      </Modal.Dialog>
    </Modal.Container>
  </Modal.Backdrop>
</Modal>
```

**TextField:**

```tsx
<TextField name="email" isRequired isInvalid={hasError}>
  <Label>Email</Label>
  <Input placeholder="email@example.com" />
  <Description>Helper text</Description>
  <FieldError>Error message</FieldError>
</TextField>
```

**Dropdown Placement**: Space-separated (`"bottom start"` NOT `"bottom-start"`)

### HeroUI v3 Theme System

- Supports: `light`, `dark`, `system` modes
- Default: `system` (respects OS preference)
- Uses `.dark` class on `<html>`

### Before Writing ANY Component

**MANDATORY CHECKLIST**:

1. ✅ Check HeroUI v3 docs (use `heroui-react` MCP or website)
2. ✅ If not found, check Aceternity UI catalog
3. ✅ If not found, check Kibo-UI registry
4. ✅ ONLY THEN consider shadcn/ui or custom build
5. ✅ Verify component supports mobile-first
6. ✅ Verify RTL compatibility (add logical properties if needed)

### Mobile-First & RTL Requirements (MANDATORY)

All components must be adapted for:

✅ **Mobile-First**: Start with base styles (320-640px), scale up
✅ **Logical Properties**: Use `ms-*`, `me-*`, `ps-*`, `pe-*` (NOT `ml-*`, `mr-*`)
✅ **RTL Support**: Set `dir={isRTL ? 'rtl' : 'ltr'}` on containers
✅ **Icon Flipping**: Use `className={isRTL ? 'rotate-180' : ''}` for directional icons
✅ **Text Alignment**: Use `text-start`/`text-end` (NOT `text-left`/`text-right`)

### Component Template (HeroUI v3)

```tsx
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function HeroUIResponsiveComponent() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="p-4 sm:p-6">
        <Card.Header>
          <h2 className="text-lg sm:text-xl text-start">{t('title')}</h2>
        </Card.Header>
        <Card.Content>
          <Button variant="default" size="sm" className="min-h-11">
            {t('action')}
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
}
```

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

### HeroUI Skills & MCP Integration

**Skill (Recommended)**: Use `/heroui-react` skill for guided component implementation:

```bash
# Invoke the skill for HeroUI v3 guidance
/heroui-react
```

**MCP Server**: HeroUI MCP tools available for AI-assisted component discovery:

```bash
# Use heroui-react MCP tools:
# - list_components - List all available v3 components
# - get_component_docs - Get component documentation
# - get_component_source_code - View source code
# - get_docs - Get general documentation
```

**💡 TIP**: Always invoke `/heroui-react` skill when working with HeroUI components to get the latest v3 Beta APIs and patterns.

### Aceternity UI (Secondary - For Animations)

Use Aceternity for animated/decorative components:

| Category                  | Examples                                         |
| ------------------------- | ------------------------------------------------ |
| **Backgrounds & Effects** | Sparkles, Aurora, Gradient animations, Spotlight |
| **Text Effects**          | Typewriter, Flip words, Text generation          |
| **3D Components**         | 3D cards, 3D pins, Marquee effects               |

**Install**: `npx shadcn@latest add https://ui.aceternity.com/registry/[component].json --yes`

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

## Recent Changes

- 036-heroui-migration: Switched to **HeroUI v3** (React Aria) as primary UI library
  - ✅ Tailwind CSS v4 migration complete
  - ✅ shadcn re-export pattern for backwards compatibility (button, card, badge, skeleton)
  - ✅ Compound component wrappers: Modal, TextField, TextArea, Checkbox, Switch
  - ✅ `buttonVariants` via cva with `asChild` support (@radix-ui/react-slot)
  - ✅ Aceternity UI retained as secondary for animations/effects
  - 📊 Status: Drop-in replacement complete, all 500+ consumers work via re-exports

- 035-dossier-context: Added TypeScript 5.8+ (strict mode), React 19+, Node.js 18+ LTS + TanStack Router v5 (routing + URL state), TanStack Query v5 (server state), Supabase JS v2 (client), i18next (i18n), Tailwind CSS, HeroUI v3

- 034-dossier-ui-polish: Added TypeScript 5.0+ (strict mode), React 19+ + TanStack Router, TanStack Query, Tailwind CSS, i18next, Framer Motion, Aceternity UI

- 033-ai-brief-generation: Added TypeScript 5.8+ (strict mode), Node.js 18+ LTS, React 19 + @mastra/core (agents), @xenova/transformers (BGE-M3), TanStack Router/Query v5, Supabase JS v2, i18nex
  - ✅ Database: 7 migrations (unified_work_items VIEW, user_work_summary VIEW, user_productivity_metrics MV, RPC functions)
  - ✅ Edge Function: unified-work-list (list, summary, metrics, team workload)
  - ✅ Frontend: 8 components, 5 hooks, i18n (EN/AR), real-time with 300ms debounce
  - ✅ Features: Cursor pagination, URL state sync, manager team workload view
  - 📊 Status: Implemented and documented
  - ✅ Contract Tests: 12 tests covering all API endpoints (GET/POST/DELETE for relationships, positions, documents, calendar)
  - ✅ Integration Tests: 7 tests for network graph performance (<3s for 50 nodes), timeline aggregation (<1s for 100 events), realtime updates
  - ✅ E2E Tests: 5 Playwright tests covering user journeys (country analyst, policy officer, intake officer, staff assignments, calendar)
  - ✅ Performance Tests: Network graph rendering (<3s), timeline queries (<1s)
  - ✅ Accessibility Tests: WCAG AA compliance, RTL layout validation
  - 📊 Status: Test suite complete - ready for test execution and validation
  - ✅ Database: 10 new tables (countries, organizations, forums, dossier_relationships, position_dossier_links, mous, intelligence_signals, documents, calendar_entries)
  - ✅ Backend: 12 Edge Functions for relationships, linking, documents, calendar management
  - ✅ Frontend: 8 shared components (UniversalEntityCard, RelationshipNavigator, UnifiedTimeline, etc.)
  - ✅ Features: Dossier-to-dossier relationships, polymorphic documents, many-to-many position linking, unified calendar with 4 event types
  - ✅ Performance: Network graph <3s for 50 nodes, timeline <1s for 100 events
  - ⏳ Remaining: Test execution and validation (contract, integration, E2E, performance tests)

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

## Active Technologies

- TypeScript 5.8+ (strict mode), React 19+, Node.js 18+ LTS + TanStack Router v5, TanStack Query v5, Supabase JS v2, i18next, **Tailwind CSS v4**, **HeroUI v3** (React Aria), Aceternity UI (animations)
- PostgreSQL 15+ (Supabase) with RLS, pgvector, pg_trgm extensions

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

## Languages

- TypeScript 5.5+ (strict mode) - Backend services, shared types, type safety
- TypeScript 5.9+ (strict mode) - Frontend application, React components
- JavaScript (ES2022) - Build scripts, configuration
- SQL - PostgreSQL database queries via Supabase
- Bash - Deployment and utility scripts

## Runtime

- Node.js 20.19.0+ (LTS) - Backend and frontend build/dev
- pnpm 10.29.1+ - Package manager (enforced via `preinstall` script)
- pnpm 10.29.1+ - Monorepo workspace management
- Lockfile: `pnpm-lock.yaml` (present)

## Frameworks

- React 19.2.4+ - UI framework
- Vite 7.3.1+ - Build tool and dev server
- TanStack Router v1.166.2+ - Client-side routing with URL state
- TanStack Query v5.90.21+ - Server state management and caching
- Tailwind CSS v4.2.1+ - Utility-first styling with @tailwindcss/vite
- Express.js 5.2.1+ - HTTP server framework
- Supabase JS v2.98.0 - Backend client for PostgreSQL, Auth, Realtime, Storage
- TypeScript 5.5+ - Type safety and development
- Turbo v2.6.0+ - Monorepo orchestration
- Vite v7.3.1+ - Frontend and backend build tooling
- esbuild v0.24.0+ - Fast JavaScript bundler for backend
- Vitest v4.0.18+ - Unit/integration test runner
- Playwright v1.55.1+ - E2E testing framework
- @testing-library/react v16.3.0+ - React component testing utilities
- axe-core/playwright v4.9.0+ - Accessibility testing

## Key Dependencies

- @supabase/supabase-js v2.98.0 - Supabase client for auth, DB, realtime
- @tanstack/react-query v5.90.21 - Server state sync and caching
- @tanstack/react-router v1.166.2 - File-based routing with type safety
- react-hook-form v7.71.2 - Form state and validation
- zod v4.3.6 - TypeScript-first schema validation
- i18next v25.8.14 + react-i18next v16.5.6 - Internationalization (EN/AR)
- framer-motion v12.35.0 - Animation library
- @dnd-kit/core v6.3.1 - Drag-and-drop primitives
- @xyflow/react v12.10.1 - Network graph visualization (React Flow)
- recharts v3.8.0 - Data visualization and charts
- @tanstack/react-table v8.21.3 - Headless data tables
- Radix UI v1.x - Accessible component primitives
- class-variance-authority v0.7.1 - CSS variant management
- @sentry/react v10.42.0 - Error tracking and monitoring
- @supabase/supabase-js v2.98.0 - Supabase admin/anon clients
- pg v8.16.3 - PostgreSQL client
- pg-promise v11.5.0 - PostgreSQL promise wrapper
- ioredis v5.8.1 - Redis client
- @upstash/redis v1.35.5 - Upstash Redis for serverless
- bullmq v5.61.0 - Job queue using Redis
- express-rate-limit v7.4.1 - Rate limiting middleware
- helmet v8.1.0 - Security headers
- cors v2.8.5 - CORS middleware
- jsonwebtoken v9.0.2 - JWT authentication
- bcrypt v6.0.0 - Password hashing
- socket.io v4.8.1 - Real-time bidirectional communication
- winston v3.17.0 - Structured logging
- dotenv v17.2.2 - Environment variable loading
- @anthropic-ai/sdk v0.65.0 - Claude API access (briefs, entity extraction)
- openai v5.23.1 - OpenAI API access (fallback, embeddings)
- @xenova/transformers v2.17.2 - BGE-M3 embeddings (local/browser-based)
- @langchain/core v0.3.78 - LLM orchestration primitives
- @langchain/community v0.3.57 - Community LLM integrations
- langchain v0.3.35 - Agent framework
- @mastra/core v0.24.6 - Mastra agents framework
- @google-cloud/vision v4.3.2 - OCR and document vision
- tesseract.js v5.1.1 - Client-side OCR
- node-nlp v5.0.0-alpha.5 - Natural language processing
- sharp v0.34.5 - Image processing and optimization
- pdfkit v0.17.2 - PDF generation
- pdf-lib v1.17.1 - PDF manipulation
- mammoth v1.11.0 - DOCX to HTML conversion
- unpdf v1.3.2 - PDF parsing
- form-data v4.0.4 - Multipart form data handling
- multer v2.0.2 - File upload middleware
- @react-pdf/renderer v3.4.0 - PDF generation in React
- exceljs v4.4.0 - Excel file generation/parsing
- date-fns v3.6.0 - Date manipulation
- rrule v2.8.1 - Recurrence rules for calendar
- uuid v10.0.0 - UUID generation
- axios v1.12.2 - HTTP client
- deep-diff v1.0.2 - Deep object diffing
- dompurify v3.3.1 - HTML sanitization
- papaparse v5.5.3 - CSV parsing
- qss v3.0.0 - Query string parsing
- clsx v2.1.1 - Conditional classnames
- tailwind-merge v2.6.0 - Merge Tailwind classes
- speakeasy v2.0.0 - TOTP/2FA generation

## Configuration

- `.env` files for secrets and configuration (see `.env.example` and `.backend/.env.example`)
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY - Supabase project access
- DATABASE_URL - Direct PostgreSQL connection (optional, Supabase primary)
- REDIS_URL - Redis connection for cache and queues
- ANYTHINGLLM_API_URL, ANYTHINGLLM_API_KEY - AnythingLLM integration
- OPENAI_API_KEY - OpenAI API access
- ANTHROPIC_API_KEY - Claude API access
- GOOGLE_AI_API_KEY - Google Vision API
- SENTRY_DSN - Error tracking configuration
- `vite.config.ts` - Vite build configuration for frontend
- `vitest.config.ts` - Vitest testing configuration
- `tsconfig.json` - TypeScript compiler options (strict mode, path aliases)
- `.eslintrc.cjs` - ESLint rules for code quality
- `.prettierrc` - Code formatting rules
- `playwright.config.ts` - E2E test configuration
- `package.json` scripts - pnpm scripts for dev, build, test, lint, db operations
- PostgreSQL 15+ via Supabase
- pgvector extension - Vector embeddings (1536 dimensions)
- pg_trgm extension - Full-text search trigrams
- pg_tsvector extension - Full-text search vectors
- Migrations in `supabase/migrations/` - Schema management
- Seed data in `backend/src/seed.ts`

## Platform Requirements

- Node.js 20.19.0+ LTS
- pnpm 10.29.1+
- Docker (optional, for local Supabase/Redis)
- PostgreSQL 15+ (if not using Supabase)
- Redis 7.x (for queue/cache)
- DigitalOcean Droplet (138.197.195.242)
- Docker Compose for containerization
- Node.js 20.19.0+ runtime
- PostgreSQL 17.6.1.008 (Supabase managed)
- Redis 7.x (managed or self-hosted)
- Nginx (reverse proxy/HTTPS via DigitalOcean App Platform)
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

## RTL Enforcement (Frontend)

- ❌ No `ml-*` → Use `ms-*` (margin-start)
- ❌ No `mr-*` → Use `me-*` (margin-end)
- ❌ No `pl-*` → Use `ps-*` (padding-start)
- ❌ No `pr-*` → Use `pe-*` (padding-end)
- ❌ No `text-left` → Use `text-start`
- ❌ No `text-right` → Use `text-end`
- ❌ No `left-*` → Use `start-*`
- ❌ No `right-*` → Use `end-*`
- ❌ No `rounded-l-*` → Use `rounded-s-*`
- ❌ No `rounded-r-*` → Use `rounded-e-*`

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

## Comments

- Complex business logic that isn't obvious from code alone
- Workarounds for browser quirks or library limitations
- Integration points with external systems
- Security-relevant code sections
- Document public exported functions and types
- Include `@param` and `@returns` for clarity
- Document exceptions/errors that can be thrown

## Function Design

- Keep functions under 50 lines (prefer 10-30 lines)
- If a function exceeds 50 lines, extract smaller helpers
- Use clear, descriptive names instead of long functions
- Prefer objects over multiple positional parameters
- Destructure in function signature when helpful
- Max 4 positional parameters; use object for more
- Always explicitly type return values
- Return early to reduce nesting
- Use discriminated unions for error/success scenarios

## Module Design

- Use named exports for functions and classes
- Default exports only for components (React components)
- Group related exports together
- `src/types/index.ts` exports all type definitions
- `src/utils/index.ts` exports all utility functions
- Avoid circular dependencies

## TypeScript

- Strict mode enabled (`"strict": true`)
- Use `as const` for literal types in enums
- Avoid `any` type (ESLint enforced)
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

## Layers

- Purpose: Business logic and domain models isolated from external concerns
- Location: `backend/src/core/domain/`
- Contains: Domain entities, value objects, business rules
- Depends on: No external libraries (framework-agnostic)
- Used by: Services in ports/services layer
- Purpose: Define contracts (ports) and implement infrastructure adapters
- Location: `backend/src/core/ports/` (contracts) and `backend/src/adapters/` (implementations)
- Contains: Repository interfaces, service interfaces, external API adapters (Supabase, AI, email, calendar)
- Depends on: Domain layer
- Used by: API controllers, scheduled jobs
- Purpose: HTTP request handling and routing
- Location: `backend/src/api/` (60+ endpoint files)
- Contains: Express routers, request validation, response formatting
- Depends on: Adapters, services
- Pattern: Feature-based organization (countries, tasks, documents, ai, etc.)
- Purpose: Cross-cutting concerns
- Location: `backend/src/middleware/`
- Contains: Authentication, rate limiting, security headers, request logging
- Applies to: All or filtered routes depending on configuration
- Purpose: Page structure and navigation
- Location: `frontend/src/routes/` (100+ route files) with TanStack Router file-based routing
- Contains: Page components, layout wrappers, nested routes
- Pattern: `__root.tsx` (root layout), `_protected.tsx` (auth wrapper), feature routes like `/dossiers/countries/$id.tsx`
- Depends on: Components, hooks, contexts
- Purpose: Feature-specific business logic (replicating backend structure)
- Location: `frontend/src/domains/{feature}/` (document, engagement, relationship, shared)
- Contains: Types, repositories (API clients), hooks, services
- Pattern: Each domain has `types/`, `repositories/`, `hooks/`, `services/` subdirectories
- Used by: Page components and other domains
- Purpose: Reusable UI elements
- Location: `frontend/src/components/` and `frontend/src/components/ui/`
- Contains: HeroUI v3 wrappers (button, card, modal, forms), domain components, shared utilities
- Pattern: HeroUI re-exports for backwards compatibility (button.tsx → heroui-button.tsx)
- Purpose: Global state management
- Location: `frontend/src/contexts/`, `frontend/src/providers/`
- Contains: Auth context, theme context, language context
- Pattern: React Context for auth state, Zustand for client state (if needed), TanStack Query for server state

## Data Flow

- **URL State:** TanStack Router manages search params, pagination, filters
- **Server State:** TanStack Query caches API responses, handles refetch logic
- **Client State:** React Context for auth, theme, language; Zustand for complex client state
- **Realtime:** Supabase Realtime subscriptions for live updates

## Key Abstractions

- Purpose: Data access abstraction
- Examples: `backend/src/adapters/repositories/supabase/` (CountryRepository, TaskRepository), `frontend/src/domains/document/repositories/`
- Pattern: Interface-based (backend ports), class-based implementations (adapters), query builders
- Purpose: Business logic composition
- Examples: `backend/src/core/ports/services/`, `frontend/src/domains/*/services/`
- Pattern: Singleton services, dependency injection via constructor
- Purpose: Reusable logic in React components
- Examples: `useCountry()`, `useDossierContext()`, `useTasks()`
- Pattern: TanStack Query hooks for server state, custom hooks for client logic
- Purpose: Modular API routing
- Backend: Express Router instances composed in `backend/src/api/index.ts`
- Frontend: TanStack Router file-based routing with automatic code splitting via React.lazy()

## Entry Points

- Location: `backend/src/index.ts`
- Triggers: Node.js process start (`npm run dev` or `node dist/index.js`)
- Responsibilities:
- Location: `frontend/src/main.tsx`
- Triggers: Vite development server or bundle load in browser
- Responsibilities:
- Location: `frontend/src/App.tsx`
- Responsibilities:

## Error Handling

- Sentry middleware captures exceptions automatically
- Express error handler wraps errors in JSON with status codes (400, 401, 403, 500)
- Custom error classes: ValidationError, UnauthorizedError, ForbiddenError
- Graceful shutdown on SIGTERM/SIGINT
- ErrorBoundary component catches React rendering errors
- Sentry captures client-side exceptions
- Toast notifications for user-facing errors
- Fallback UI for failed data loads

## Cross-Cutting Concerns

- Backend: Winston logger (`backend/src/utils/logger.ts`) with structured logging (method, URL, duration, IP, user-agent)
- Frontend: Sentry error tracking, console logs in development
- Backend: express-validator for request validation in API controllers
- Frontend: React Hook Form + Zod for form validation, type safety via TypeScript strict mode
- Backend: JWT token verification via `authenticateToken` middleware, Supabase Auth
- Frontend: AuthProvider context manages token, auth.context guards protected routes via TanStack Router
- Protected routes: Use `_protected` layout wrapper, require valid auth context
- Backend: express-rate-limit configured via `backend/src/middleware/rate-limit.middleware.ts`
- Aliases: `apiLimiter`, `authLimiter`, `uploadLimiter`, `aiLimiter`, `searchRateLimit`
- Applied at root API and per-route basis
- Backend: Redis via ioredis for cache metrics service
- Frontend: TanStack Query with stale-while-revalidate, cache invalidation on mutations
- Realtime: Supabase Realtime updates query cache automatically
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
