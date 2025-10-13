# Intl-DossierV2.0 Development Guidelines

Last updated: 2025-10-07

## Core Tech Stack
- **Frontend**: React 18+, TypeScript 5.0+ (strict mode), TanStack Router/Query v5, Tailwind CSS, shadcn/ui, i18next, React Flow (network graphs)
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
- **Dev**: `npm run dev` (monorepo via Turborepo)
- **Build**: `npm run build`
- **Test**: `npm test`, `npm run lint`, `npm run typecheck`
- **DB**: `npm run db:migrate`, `npm run db:seed`, `npm run db:reset`

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

| ❌ Avoid | ✅ Use Instead | Description |
|---------|---------------|-------------|
| `ml-*` | `ms-*` | Margin start |
| `mr-*` | `me-*` | Margin end |
| `pl-*` | `ps-*` | Padding start |
| `pr-*` | `pe-*` | Padding end |
| `left-*` | `start-*` | Position start |
| `right-*` | `end-*` | Position end |
| `text-left` | `text-start` | Text align start |
| `text-right` | `text-end` | Text align end |
| `rounded-l-*` | `rounded-s-*` | Border radius start |
| `rounded-r-*` | `rounded-e-*` | Border radius end |

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

### shadcn/ui Component Strategy
When building UI components, **ALWAYS** follow this workflow:

1. **Check shadcn MCP First**: Use `mcp__shadcn__get_items` to list available components from shadcn/ui
2. **Check Custom Registries**: If component not found in shadcn, search these verified registries in order:
   - tweakcn: https://tweakcn.com (Theme editor for shadcn/ui)
   - originui: https://originui.com (Beautiful UI components with Tailwind CSS)
   - aceternity: https://ui.aceternity.com (Next.js, Tailwind CSS, Framer Motion components)
   - kokonutui: https://kokonutui.com (100+ UI components for Next.js)
   - kibo-ui: https://kibo-ui.com (Composable, accessible components)
   - skiper-ui: https://skiper-ui.com (Un-common components for shadcn/ui)
   - magicui: https://magicui.design (UI library for Design Engineers)
   - cult-ui: https://cult-ui.com (Components for Design Engineers)

3. **Installation**:
   - Default registry: `npx shadcn@latest add <component>`
   - Custom registry: `npx shadcn@latest add @registry-name/component`
   - Direct URL: `npx shadcn@latest add https://example.com/registry/component.json`
4. **Custom Build Only If Necessary**: Only build custom components if not available in any registry
5. **Location**:
   - UI components are stored in `frontend/src/components/ui/`
   - Configuration is in `frontend/components.json`
   - Registries can be configured in `components.json` under the `registries` key (currently not configured)

### Component Import Pattern
- Always import from `@/components/ui/<component>` (configured in `frontend/components.json` aliases)
- Check `frontend/src/components/ui/` for existing components before creating new ones (28 components currently available)
- Use shadcn MCP tools to explore available components

## Recent Changes
- 021-apply-gusto-design: Added TypeScript 5.8+ (strict mode)
- 020-complete-the-development: Added TypeScript 5.8+ (strict mode), React Native 0.81+ + Expo SDK 52+, React Native Paper 5.12+ (Material Design 3), WatermelonDB 0.28+ (offline-first), React Navigation 7+, TanStack Query v5, i18next (i18n), expo-local-authentication, expo-notifications
- 019-user-management-access: Added TypeScript 5.8+ (strict mode), Node.js 18+ LTS, React 19 + Supabase (Auth, PostgreSQL 15+, RLS, Realtime), TanStack Query v5, React Router, i18next, shadcn/ui
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

### Test Credentials for Browser/Chrome MCP
When testing the application using browser automation tools (Chrome MCP, Playwright, etc.), use these credentials:
- **Email**: kazahrani@stats.gov.sa
- **Password**: itisme
<!-- MANUAL ADDITIONS END -->
