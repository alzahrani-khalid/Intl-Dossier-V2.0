# Intl-DossierV2.0 Development Guidelines

Last updated: 2025-10-07

## Core Tech Stack

- **Frontend**: React 19+, TypeScript 5.0+ (strict mode), TanStack Router/Query v5, Tailwind CSS, shadcn/ui, i18next, React Flow (network graphs)
- **Mobile**: Expo SDK 52+, React Native 0.81+, TypeScript 5.8+, React Native Paper 5.12+ (Material Design 3), WatermelonDB 0.28+ (offline-first), React Navigation 7+, expo-local-authentication (biometrics), expo-notifications (push), i18next (internationalization)
- **Backend**: Node.js 18+ LTS, Supabase (PostgreSQL 15+, Auth, RLS, Realtime, Storage), Redis 7.x
- **Database**: PostgreSQL 15+ with pgvector, pg_trgm, pg_tsvector extensions
- **AI/ML**: AnythingLLM (self-hosted), vector embeddings (1536 dimensions)
- **Additional**: @dnd-kit/core (drag-and-drop), Vite (build tool)

## Project Structure

```
backend/          # Express + TypeScript API
frontend/         # React 19 + Vite app
mobile/           # Expo + React Native mobile app (iOS/Android)
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

### Aceternity UI Component Strategy (MANDATORY - HIGHEST PRIORITY)

**Component Selection Hierarchy** - **ALWAYS** follow this order (NO EXCEPTIONS):

1. **Aceternity UI (Primary)**: https://ui.aceternity.com/components
   - **130+ components** in 18 categories
   - Responsive & mobile-first by default
   - Built with React 19, Tailwind CSS, Framer Motion
   - **Install**: `npx shadcn@latest add https://ui.aceternity.com/registry/[component].json --yes`
   - **Example**: `npx shadcn@latest add https://ui.aceternity.com/registry/bento-grid.json --yes`

2. **Aceternity UI Pro (Primary+)**: https://pro.aceternity.com/components
   - **30+ component blocks**, **7+ premium templates**
   - Advanced animations and interactions
   - API Key: Stored in `.env.local` (NEVER commit!)
   - **Install**: Check Aceternity Pro docs for exact command format
   - **Requires**: `ACETERNITY_PRO_API_KEY` environment variable

3. **Kibo-UI (Secondary Fallback)**: https://www.kibo-ui.com
   - Use ONLY if Aceternity doesn't have equivalent
   - **Install**: `npx shadcn@latest add @kibo-ui/[component]`

4. **shadcn/ui (Last Resort)**: https://ui.shadcn.com
   - Use ONLY if Aceternity AND Kibo-UI don't have equivalent
   - **Install**: `npx shadcn@latest add [component]`

### Aceternity Component Categories (130+ components)

| Category                  | Count | Examples                                                |
| ------------------------- | ----- | ------------------------------------------------------- |
| **Backgrounds & Effects** | 23    | Sparkles, Aurora, Gradient animations, Spotlight        |
| **Cards**                 | 14    | 3D card, Hoverable card, Expandable card, Animated card |
| **Scroll & Parallax**     | 5     | Sticky scroll, Parallax effects, Container scroll       |
| **Text Components**       | 9     | Typewriter, Flip words, Text generation effects         |
| **Buttons**               | 4     | Animated buttons, Gradient borders, Moving borders      |
| **Navigation**            | 7     | Floating navbar, Sidebar, Floating dock, Tabs           |
| **Inputs & Forms**        | 3     | Signup forms, File upload, Vanish input                 |
| **Overlays & Modals**     | 3     | Animated modals, Tooltips, Link preview                 |
| **Carousels & Sliders**   | 4     | Image sliders, Testimonials                             |
| **Layout & Grid**         | 3     | Bento grid, Layout grid                                 |
| **Data & Visualization**  | 5     | GitHub globe, World map, Timeline, Charts               |
| **3D Components**         | 2     | 3D pins, Marquee effects                                |

**Full catalog**: https://ui.aceternity.com/components

### Before Writing ANY Component

**MANDATORY CHECKLIST**:

1. ✅ Search Aceternity UI for component (use MCP tool or website)
2. ✅ Check Aceternity Pro for premium variants
3. ✅ If not found, check Kibo-UI registry
4. ✅ ONLY THEN consider shadcn/ui or custom build
5. ✅ Verify component supports mobile-first (all Aceternity components do)
6. ✅ Verify RTL compatibility (add logical properties if needed)

### Installation Examples

**Aceternity Free**:

```bash
# Floating navbar
npx shadcn@latest add https://ui.aceternity.com/registry/floating-navbar.json --yes

# 3D Card
npx shadcn@latest add https://ui.aceternity.com/registry/3d-card.json --yes

# Bento Grid (layout)
npx shadcn@latest add https://ui.aceternity.com/registry/bento-grid.json --yes

# Timeline
npx shadcn@latest add https://ui.aceternity.com/registry/timeline.json --yes
```

**Aceternity Pro** (verify command format in Pro docs):

```bash
# Dashboard template
npx shadcn@latest add @aceternity-pro/dashboard-template-one

# Advanced card blocks
npx shadcn@latest add @aceternity-pro/card-blocks
```

**Kibo-UI Fallback**:

```bash
npx shadcn@latest add @kibo-ui/kanban
```

**shadcn/ui (Last Resort)**:

```bash
npx shadcn@latest add form
```

### Mobile-First & RTL Requirements (MANDATORY)

All Aceternity components must be adapted for:

✅ **Mobile-First**: Start with base styles (320-640px), scale up
✅ **Logical Properties**: Use `ms-*`, `me-*`, `ps-*`, `pe-*` (NOT `ml-*`, `mr-*`)
✅ **RTL Support**: Set `dir={isRTL ? 'rtl' : 'ltr'}` on containers
✅ **Icon Flipping**: Use `className={isRTL ? 'rotate-180' : ''}` for directional icons
✅ **Text Alignment**: Use `text-start`/`text-end` (NOT `text-left`/`text-right`)

### Aceternity Component Template

```tsx
import { useTranslation } from 'react-i18next';
import { BentoGrid } from '@/components/ui/bento-grid';

export function AceternityResponsiveComponent() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <BentoGrid className="gap-4 sm:gap-6 lg:gap-8">
        {/* Aceternity components work mobile-first by default */}
        {/* Add RTL support via logical properties and dir attribute */}
      </BentoGrid>
    </div>
  );
}
```

### Component File Locations

- **Aceternity UI components**: `frontend/src/components/ui/` (installed via shadcn CLI)
- **Configuration**: `frontend/components.json`
- **Documentation**: `frontend/.aceternity/` (installation notes, guides, examples)
- **API Key**: `frontend/.env.local` (NEVER commit!)

### Key Dependencies (Already Installed)

- ✅ `framer-motion` - Required for Aceternity animations
- ✅ `clsx` - Conditional classnames utility
- ✅ `tailwind-merge` - Merge Tailwind classes

### MCP Server Integration (Optional)

For AI-assisted component discovery, install Aceternity UI MCP server:

**Claude Code Config** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "aceternityui": {
      "command": "npx",
      "args": ["aceternityui-mcp"]
    }
  }
}
```

After restart, use MCP tools to search and discover components.

### Component Import Pattern

- Always import from `@/components/ui/<component>`
- Example: `import { BentoGrid } from '@/components/ui/bento-grid'`
- Check `frontend/src/components/ui/` for installed components
- Refer to `frontend/.aceternity/INSTALLATION_NOTES.md` for verified installations

### shadcn/ui Fallback Strategy (DEPRECATED AS PRIMARY)

**⚠️ IMPORTANT**: shadcn/ui is now a LAST RESORT fallback only. Use Aceternity UI as the primary component library for all new components. Only use shadcn/ui when:

1. Aceternity doesn't have the component
2. Kibo-UI doesn't have the component
3. Building a custom component isn't feasible

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

- 035-dossier-context: Added TypeScript 5.8+ (strict mode), React 19+, Node.js 18+ LTS + TanStack Router v5 (routing + URL state), TanStack Query v5 (server state), Supabase JS v2 (client), i18next (i18n), Tailwind CSS, Aceternity UI

- 034-dossier-ui-polish: Added TypeScript 5.0+ (strict mode), React 19+ + TanStack Router, TanStack Query, Tailwind CSS, i18next, Framer Motion, Aceternity UI

- 033-ai-brief-generation: Added TypeScript 5.8+ (strict mode), Node.js 18+ LTS, React 19 + @mastra/core (agents), @xenova/transformers (BGE-M3), TanStack Router/Query v5, Supabase JS v2, i18nex
  - ✅ Database: 7 migrations (unified_work_items VIEW, user_work_summary VIEW, user_productivity_metrics MV, RPC functions)
  - ✅ Edge Function: unified-work-list (list, summary, metrics, team workload)
  - ✅ Frontend: 8 components, 5 hooks, i18n (EN/AR), real-time with 300ms debounce
  - ✅ Features: Cursor pagination, URL state sync, manager team workload view
  - 📊 Status: Implemented and documented
  - ✅ Feature spec: Expo-based mobile app with offline-first architecture
  - ✅ Research: Jest + RNTL (unit tests), Maestro (E2E), React Native Paper (UI), WatermelonDB (offline sync)
  - ✅ Data model: 11 entities with WatermelonDB schema, offline storage cleanup strategy
  - ✅ API contracts: Sync API (incremental sync), Auth API (Supabase Auth + biometrics), Notifications API (Expo Push)
  - ✅ Quickstart: Setup guide for Expo development, testing, and deployment
  - 📊 Status: Planning complete - ready for `/speckit.tasks` to generate actionable tasks
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

When testing the application using browser automation tools (Chrome MCP, Playwright, etc.), use these credentials:

- **Email**: kazahrani@stats.gov.sa
- **Password**: itisme

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:

1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes

<!-- MANUAL ADDITIONS END -->

## Active Technologies

- TypeScript 5.8+ (strict mode), React 19+, Node.js 18+ LTS + TanStack Router v5 (routing + URL state), TanStack Query v5 (server state), Supabase JS v2 (client), i18next (i18n), Tailwind CSS, Aceternity UI (035-dossier-context)
- PostgreSQL 15+ (Supabase) with RLS, new junction table for work-item-dossier links (035-dossier-context)

- TypeScript 5.0+ (strict mode), React 19+ + TanStack Router, TanStack Query, Tailwind CSS, i18next, Framer Motion, Aceternity UI (034-dossier-ui-polish)
- N/A (frontend-only polish, no database changes) (034-dossier-ui-polish)

- TypeScript 5.8+ (strict mode), Node.js 18+ LTS, React 19 + @mastra/core (agents), @xenova/transformers (BGE-M3), TanStack Router/Query v5, Supabase JS v2, i18nex (033-ai-brief-generation)
- PostgreSQL 15+ (Supabase) with pgvector extension, Redis 7.x for caching (033-ai-brief-generation)

- TypeScript 5.8+ (strict mode), Node.js 18+ LTS + React 19, TanStack Router v5, TanStack Query v5, Supabase (PostgreSQL 15+, Edge Functions), Vite (030-health-commitment)
- PostgreSQL 15+ with pgvector extension, materialized views for aggregations, Redis 7.x for caching (030-health-commitment)
- TypeScript 5.8+ (strict mode) + React 19, TanStack Router v5, TanStack Query v5, Supabase JS v2, i18next, Framer Motion, Aceternity UI (031-commitments-management)
- PostgreSQL 15+ (Supabase), Supabase Storage (evidence files) (031-commitments-management)
- TypeScript 5.8+ (strict mode) + React 19, TanStack Router v5, TanStack Query (useInfiniteQuery), Supabase Realtime, i18next (032-unified-work-management)
- PostgreSQL VIEWs, Materialized VIEWs, RPC functions with cursor pagination, custom enums (tracking_type, work_source) (032-unified-work-management)
