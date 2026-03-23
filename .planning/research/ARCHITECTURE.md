# Architecture Patterns

**Domain:** Production-quality hardening of a React 19 + Express + Supabase diplomatic dossier monorepo
**Researched:** 2026-03-23

## Recommended Architecture

### Target State: Cleaned Layered Monorepo

The existing architecture (hexagonal backend, domain-driven frontend, TanStack Router/Query) is fundamentally sound. The problem is not the architecture itself but **inconsistent adherence** to it. The cleanup must enforce the patterns that already exist rather than introduce new ones.

```
┌─────────────────────────────────────────────────────────┐
│                    MONOREPO (Turborepo)                  │
├──────────────────────┬──────────────────────────────────┤
│   BACKEND            │   FRONTEND                       │
│                      │                                  │
│   ┌──────────┐       │   ┌───────────────┐              │
│   │ API      │       │   │ Routes        │              │
│   │ (Express)│       │   │ (TanStack)    │              │
│   └────┬─────┘       │   └──────┬────────┘              │
│        │             │          │                       │
│   ┌────┴─────┐       │   ┌──────┴────────┐              │
│   │ Services │       │   │ Domains       │              │
│   │ (kebab)  │       │   │ (repos+hooks) │              │
│   └────┬─────┘       │   └──────┬────────┘              │
│        │             │          │                       │
│   ┌────┴─────┐       │   ┌──────┴────────┐              │
│   │ Adapters │       │   │ Components    │              │
│   │ (Supa/AI)│       │   │ (ui/ + feat/) │              │
│   └────┬─────┘       │   └──────┬────────┘              │
│        │             │          │                       │
│   ┌────┴─────┐       │   ┌──────┴────────┐              │
│   │ Core     │       │   │ Design System │              │
│   │ (Domain) │       │   │ (tokens+RTL)  │              │
│   └──────────┘       │   └───────────────┘              │
├──────────────────────┴──────────────────────────────────┤
│   SHARED: types, constants, validation schemas          │
│   SUPABASE: migrations, Edge Functions, seed data       │
└─────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component                                       | Responsibility                                         | Communicates With                       |
| ----------------------------------------------- | ------------------------------------------------------ | --------------------------------------- |
| **API Layer** (backend/src/api/)                | HTTP routing, request validation, response formatting  | Services only (never adapters directly) |
| **Services** (backend/src/services/)            | Business logic orchestration, transaction coordination | Adapters, Core Domain                   |
| **Adapters** (backend/src/adapters/)            | External system integration (Supabase, AI, email)      | Core Domain types                       |
| **Core Domain** (backend/src/core/)             | Business rules, entities, value objects                | Nothing (no external deps)              |
| **Routes** (frontend/src/routes/)               | Page composition, URL state, data loading              | Domain hooks, Components                |
| **Domains** (frontend/src/domains/)             | API clients, query hooks, domain logic                 | API layer via HTTP                      |
| **Components** (frontend/src/components/)       | Reusable UI rendering                                  | Props only (no direct API calls)        |
| **Design System** (frontend/src/components/ui/) | Primitives, tokens, RTL/responsive primitives          | Nothing (leaf layer)                    |

### Data Flow

```
User Action
  → Route Component (URL state via TanStack Router)
    → Domain Hook (TanStack Query key + fetch fn)
      → Domain Repository (API client, builds HTTP request)
        → Backend API Controller (validates, authenticates)
          → Service (orchestrates business logic)
            → Adapter (Supabase query / AI call)
              → Database / External Service
```

**Critical rule:** Every frontend data fetch MUST go through a domain repository, never raw `fetch()` in hooks or components. Currently only 3 domain repositories exist (document, engagement, relationship) while 90+ hooks exist -- many bypass this pattern.

## Recommended Cleanup Order

The cleanup has hard dependencies. Doing them out of order wastes effort.

### Phase 1: Dead Code Elimination (no dependencies)

**Why first:** Removing dead code reduces the surface area for all subsequent work. Every pattern you enforce on dead code is wasted effort.

**Strategy:**

1. Install and configure **Knip** (`npx knip`) -- the standard tool for TypeScript dead code detection in monorepos. It finds unused exports, files, dependencies, and dev dependencies across workspaces.
2. Run Knip with `--include files,exports,dependencies` to get a baseline report.
3. **High-confidence removals** (Knip reports + manual verification):
   - Mobile-era components: `bottom-sheet.tsx`, `swipeable-card.tsx`, `pull-to-refresh-*.tsx`, `thumb-zone-safe-area.tsx`, `floating-action-button.tsx`, `context-aware-fab.tsx`, `mobile-action-bar.tsx`, `useHapticFeedback.ts`
   - `ChatContext.tsx` (real-time chat is out of scope)
   - `heroui-forms.tsx`, `heroui-modal.tsx` (dead code per MEMORY.md -- import from `@heroui/react` which is not installed)
   - Duplicate services: `contact-service.ts` vs `ContactService.ts` vs `contact-service-enhanced.ts`, `export.service.ts` vs `ExportService.ts`, `search.service.ts` vs `SearchService.ts`
   - `service-stubs.ts` (leftover experiment)
4. Run `pnpm build` after each batch to catch regressions.

**Tool:** Knip v5+ (HIGH confidence -- standard tool, 100+ framework plugins including Vite, Vitest, TanStack Router)

### Phase 2: Naming Convention Enforcement (depends on Phase 1)

**Why second:** Before enforcing patterns, all files must follow the same naming. Currently mixed:

- Backend services: PascalCase (`ContactService.ts`) AND kebab-case (`contact-service.ts`)
- Frontend hooks: camelCase (`useAuth.ts`) AND kebab-case (`use-theme.ts`)

**Target conventions:**
| Layer | Convention | Example |
|-------|-----------|---------|
| Backend services | kebab-case.service.ts | `contact.service.ts` |
| Backend API routes | kebab-case.ts | `task-contributors.ts` |
| Frontend hooks | camelCase with use prefix | `useAuth.ts` |
| Frontend components | PascalCase.tsx | `DossierCard.tsx` |
| Frontend UI primitives | kebab-case.tsx | `button.tsx` |
| Types | kebab-case.types.ts | `work-item.types.ts` |

**Tool:** ESLint with `eslint-plugin-filenames` or a custom Knip configuration for naming consistency. Rename via `git mv` to preserve history.

### Phase 3: Domain Repository Consolidation (depends on Phase 2)

**Why third:** This is the most impactful pattern enforcement. Currently hooks call APIs directly with raw fetch. All data access must go through domain repositories.

**Target state for each domain:**

```
frontend/src/domains/{feature}/
  ├── types/           # TypeScript types for this domain
  ├── repositories/    # API clients (one per backend resource)
  ├── hooks/           # TanStack Query hooks (call repositories, never fetch)
  ├── services/        # Client-side business logic (rare)
  └── index.ts         # Barrel export
```

**Current gap:** Only 3 domains exist (document, engagement, relationship). Need domains for: country, organization, forum, topic, working-group, person, elected-official, work-item, calendar, intelligence, position, search, ai-briefing.

**Migration strategy:**

1. For each backend API area, create matching frontend domain directory
2. Extract `fetch()` calls from hooks into repository classes
3. Hooks become thin wrappers: `useQuery({ queryKey: [...], queryFn: () => repo.get(id) })`
4. Co-locate query key factories in each domain: `domains/{feature}/keys.ts`

### Phase 4: Design System Architecture (depends on Phase 1)

**Why here:** After dead code is removed, consolidate the UI layer.

See detailed section below on RTL/Theming architecture.

### Phase 5: Backend Service Deduplication (depends on Phase 1, 2)

**Why last on backend:** Services are the most complex to refactor. Need naming conventions settled first.

**Current problem:** 90+ services with overlapping responsibilities and inconsistent patterns.

**Strategy:**

1. Map service-to-route dependencies (which API routes use which services)
2. Identify true duplicates (e.g., `contact-service.ts` vs `ContactService.ts`)
3. Consolidate into domain-aligned services matching the hexagonal architecture
4. Every service should be injectable via the existing `container/` DI setup

## RTL/LTR Theming Architecture (System-Wide)

### Problem Statement

RTL support is currently handled per-component with `isRTL ? 'rtl' : 'ltr'` checks scattered everywhere. This is fragile and leads to inconsistency. The CLAUDE.md has React Native RTL rules that no longer apply (mobile cancelled), while web uses Tailwind logical properties inconsistently.

### Recommended Architecture: Three-Layer RTL System

```
Layer 1: Document Direction (set ONCE at root)
  ├── <html dir="rtl" lang="ar"> or <html dir="ltr" lang="en">
  └── Set by LanguageProvider on language change

Layer 2: CSS Logical Properties (enforced by linter)
  ├── Tailwind: ms-*, me-*, ps-*, pe-*, text-start, text-end
  ├── BANNED: ml-*, mr-*, pl-*, pr-*, text-left, text-right
  └── ESLint rule: custom or tailwindcss/no-physical-properties

Layer 3: Component-Level RTL (ONLY for exceptions)
  ├── Directional icons: className={isRTL ? 'rotate-180' : ''}
  ├── Third-party components without logical property support
  └── Canvas/SVG rendering that needs manual flip
```

### Implementation Details

**Layer 1 -- Root Direction Provider:**

```typescript
// frontend/src/providers/direction-provider.tsx
// Single source of truth for document direction
export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [dir, i18n.language]);

  return <DirectionContext.Provider value={{ dir, isRTL: dir === 'rtl' }}>{children}</DirectionContext.Provider>;
}
```

**Key principle:** Individual components should NEVER set `dir=` on their containers. Direction flows from the document root. The only exception is embedding LTR content inside RTL (e.g., code blocks, English quotes inside Arabic text).

**Layer 2 -- ESLint Enforcement:**

```javascript
// .eslintrc.js addition
// Ban physical directional classes in Tailwind
rules: {
  'no-restricted-syntax': ['error', {
    selector: 'Literal[value=/\\b(ml-|mr-|pl-|pr-|text-left|text-right|left-|right-|rounded-l-|rounded-r-)\\b/]',
    message: 'Use logical properties (ms-*, me-*, ps-*, pe-*, text-start, text-end, start-*, end-*, rounded-s-*, rounded-e-*)'
  }]
}
```

**Layer 3 -- RTL Utility Hook:**

```typescript
// frontend/src/hooks/useDirection.ts
export function useDirection() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  return {
    isRTL,
    dir: isRTL ? 'rtl' : 'ltr',
    flipIcon: (className?: string) =>
      isRTL ? `${className ?? ''} rotate-180`.trim() : (className ?? ''),
  };
}
```

### Theming Architecture

The existing HeroUI v3 theme system (oklch variables, dark/light/system modes) is correct. The cleanup should:

1. **Consolidate CSS custom properties** in `index.css` under clear sections: colors, spacing, radius, typography
2. **Remove duplicate theme logic** -- ensure `ThemeProvider` and `use-theme.ts` are the single source of truth
3. **Design tokens as CSS variables** (already partially done with `--heroui-*`):

```css
/* frontend/src/index.css -- organized token sections */
@layer base {
  :root {
    /* === Spacing Scale === */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;

    /* === Radius (multiplicative via HeroUI) === */
    --radius: 0.5rem;

    /* === Colors (oklch via HeroUI) === */
    /* Defined per-theme in existing system */
  }
}
```

## Responsive Design System Architecture

### Problem Statement

Mobile-first is mandated but not systematically enforced. Each component independently decides its responsive behavior, leading to inconsistent breakpoint usage and missing responsive states.

### Recommended Architecture: Layout Primitives

Instead of every component independently handling responsiveness, create layout primitives that encode responsive patterns:

```typescript
// frontend/src/components/layout/page-layout.tsx
// Standard page wrapper with responsive padding and max-width
export function PageLayout({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6', className)}>
      {children}
    </div>
  );
}

// frontend/src/components/layout/responsive-grid.tsx
// Standard responsive grid for card layouts
export function ResponsiveGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
      {children}
    </div>
  );
}

// frontend/src/components/layout/split-layout.tsx
// Sidebar + content pattern (stacks on mobile)
export function SplitLayout({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
      <aside className="w-full lg:w-80 xl:w-96 shrink-0">{sidebar}</aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
```

### Touch Target Enforcement

```typescript
// frontend/src/components/ui/touch-target.tsx (already exists, needs enforcement)
// All interactive elements must meet 44x44 minimum
// Enforce via ESLint or code review checklist:
// - Every <Button> inherits min-h-11 min-w-11 from heroui-button.tsx
// - Every clickable <div> or <span> must use role="button" + min-h-11 min-w-11
```

### Responsive Breakpoint Contract

| Breakpoint       | Layout                         | Navigation              | Content                     |
| ---------------- | ------------------------------ | ----------------------- | --------------------------- |
| base (0-639px)   | Single column, stacked         | Bottom nav or hamburger | Full-width cards            |
| sm (640-767px)   | 2-column grid where applicable | Same as base            | 2-column cards              |
| md (768-1023px)  | Sidebar appears as overlay     | Sidebar toggle          | Mixed layout                |
| lg (1024-1279px) | Persistent sidebar + content   | Always visible sidebar  | 3-column grids              |
| xl (1280px+)     | Same + wider sidebar           | Same                    | 4-column grids, data tables |

## Patterns to Follow

### Pattern 1: Query Key Factory

**What:** Centralize TanStack Query keys per domain to prevent key collisions and enable precise cache invalidation.

**When:** Every domain repository should have a companion key factory.

**Example:**

```typescript
// frontend/src/domains/country/keys.ts
export const countryKeys = {
  all: ['countries'] as const,
  lists: () => [...countryKeys.all, 'list'] as const,
  list: (filters: CountryFilters) => [...countryKeys.lists(), filters] as const,
  details: () => [...countryKeys.all, 'detail'] as const,
  detail: (id: string) => [...countryKeys.details(), id] as const,
};

// frontend/src/domains/country/hooks/useCountry.ts
export function useCountry(id: string) {
  return useQuery({
    queryKey: countryKeys.detail(id),
    queryFn: () => countryRepo.getById(id),
  });
}
```

### Pattern 2: Backend Service Registration

**What:** All services registered in DI container, never instantiated directly in route handlers.

**When:** Every service should be created via the container.

**Example:**

```typescript
// backend/src/container/index.ts
container.register(
  'countryService',
  new CountryService(container.resolve('countryRepository'), container.resolve('cacheService'))
);

// backend/src/api/countries.ts
router.get('/:id', authenticateToken, async (req, res) => {
  const service = container.resolve<CountryService>('countryService');
  const country = await service.getById(req.params.id);
  res.json(country);
});
```

### Pattern 3: Consistent Error Handling

**What:** All API endpoints use the same error response shape.

**When:** Every route handler.

**Example:**

```typescript
// backend/src/middleware/error-handler.ts
interface ApiError {
  error: {
    code: string; // Machine-readable: 'COUNTRY_NOT_FOUND'
    message: string; // Human-readable
    details?: unknown; // Optional validation errors
  };
  status: number;
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Per-Component Direction Setting

**What:** Components individually setting `dir={isRTL ? 'rtl' : 'ltr'}` on their root element.

**Why bad:** Creates nested direction contexts that can conflict. Every component becomes responsible for direction, leading to missed instances and visual bugs.

**Instead:** Set direction ONCE at `<html>` level via `DirectionProvider`. Components inherit direction automatically. Only override for explicit LTR-in-RTL embedding.

### Anti-Pattern 2: Raw Fetch in Hooks

**What:** Hooks calling `fetch('/api/...')` directly instead of going through a domain repository.

**Why bad:** Duplicates URL construction, header management, error handling. Makes it impossible to mock for tests or add middleware (logging, retry).

**Instead:** Every API call goes through `domains/{feature}/repositories/{feature}.repository.ts`.

### Anti-Pattern 3: God Services

**What:** Services like `ContactService.ts` + `contact-service.ts` + `contact-service-enhanced.ts` that overlap in responsibility.

**Why bad:** Unclear which service to use, logic duplication, impossible to test in isolation.

**Instead:** One service per domain concept. If a service needs enhancement, refactor the existing one.

### Anti-Pattern 4: Naming Inconsistency

**What:** Mixed PascalCase and kebab-case in the same directory (e.g., `ContactService.ts` alongside `contact-service.ts`).

**Why bad:** Makes autocomplete unreliable, grep results confusing, new developers uncertain which convention to follow.

**Instead:** Enforce one convention per layer (see naming table above).

## Scalability Considerations

| Concern               | Current (small team)         | At 10K daily users                                                | At enterprise scale                                   |
| --------------------- | ---------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| **Bundle size**       | Acceptable with lazy loading | Add route-level code splitting audit, remove unused UI components | Consider module federation                            |
| **API response time** | Adequate                     | Redis caching layer (partially done), database indexes            | Read replicas, query optimization                     |
| **RTL consistency**   | Manual review                | ESLint enforcement catches physical properties at CI              | Automated visual regression testing (Chromatic/Percy) |
| **Service coupling**  | Low impact                   | DI container enforces boundaries                                  | Service extraction to separate processes if needed    |

## Build Order Implications

```
Phase 1: Dead Code → MUST be first (reduces scope for everything else)
  ↓
Phase 2: Naming → Depends on dead code removal (don't rename dead files)
  ↓
Phase 3: Domain Repos → Depends on naming (consistent file structure)
  ↓
Phase 4: Design System → Can parallel with Phase 3 (independent layer)
  ↓
Phase 5: Backend Services → Depends on naming, benefits from domain repos showing which services are actually used
```

**Critical dependency:** Phase 1 (dead code) MUST complete before Phase 2+ begins. Running Knip after removing mobile code and duplicate services will give a clean baseline.

**Parallelizable:** Phase 3 (frontend domain repos) and Phase 5 (backend service dedup) can run in parallel once naming is settled, as they operate on different workspaces.

## Sources

- [Knip - Dead code detection for TypeScript monorepos](https://knip.dev/) (HIGH confidence)
- [Tailwind CSS v4 RTL with logical properties](https://flowbite.com/docs/customize/rtl/) (HIGH confidence)
- [Tailwind CSS v4 Complete Guide](https://devtoolbox.dedyn.io/blog/tailwind-css-v4-complete-guide) (MEDIUM confidence)
- [Clean Architecture in Express.js](https://merlino.agency/blog/clean-architecture-in-express-js-applications) (MEDIUM confidence)
- [Hexagonal Architecture in 2026](https://dev.to/dev_tips/hexagonal-vs-clean-vs-onion-which-one-actually-survives-your-app-in-2026-273f) (MEDIUM confidence)
- [React Design Patterns 2025](https://www.uxpin.com/studio/blog/react-design-patterns/) (MEDIUM confidence)

---

_Architecture research: 2026-03-23_
