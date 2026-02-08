# Intl-DossierV2.0 Development Guidelines

Last updated: 2026-02-06

## Core Tech Stack

- **Frontend**: React 19+, TypeScript 5.0+ (strict mode), TanStack Router/Query v5, Tailwind CSS v4, HeroUI v3 (React Aria), i18next, React Flow (network graphs)
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

- TypeScript 5.8+ (strict mode), React 19+, Node.js 18+ LTS + TanStack Router v5, TanStack Query v5, Supabase JS v2, i18next, **Tailwind CSS v4**, **HeroUI v3** (React Aria), Aceternity UI (animations)
- PostgreSQL 15+ (Supabase) with RLS, pgvector, pg_trgm extensions
