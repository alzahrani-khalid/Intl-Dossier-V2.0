# Phase 8: Navigation & Route Consolidation - Research

**Researched:** 2026-03-28
**Domain:** Frontend navigation architecture, route management, command palette, mobile tab bar
**Confidence:** HIGH

## Summary

Phase 8 restructures the app's navigation from its current 6-category flat layout (with ~77 route files, ~15 duplicates, and 14 demo pages) to a clean 3-group hub-based sidebar on desktop and a 4-tab bottom bar on mobile. The existing codebase provides strong foundations: shadcn Sidebar primitives are already in use (SidebarGroup, SidebarMenu, SidebarMenuButton, etc.), the CommandPalette already uses cmdk 1.1.1 with grouped results, and safe-area-inset patterns are already established in the codebase (heroui-modal, context-aware-fab, dialog, thumb-zone-safe-area).

The primary work involves (1) restructuring `navigation-config.ts` from 6 categories to 3 groups, (2) adding `beforeLoad` guards to 14 demo routes with `VITE_DEV_MODE` check, (3) converting ~15 duplicate top-level routes (e.g., `/countries` vs `/dossiers/countries/`) into redirects, (4) building a `MobileBottomTabBar` component with scroll-aware auto-hide, and (5) enhancing the existing CommandPalette with recent items, entity search groups, and mobile full-screen overlay.

**Primary recommendation:** Refactor `navigation-config.ts` and `AppSidebar.tsx` in place (not replace). Reuse all existing shadcn sidebar primitives. Enhance the existing CommandPalette rather than rebuilding it. Build the mobile bottom tab bar as a new component rendered conditionally via `useResponsive().isMobile`.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Three groups: **Operations** (Dashboard, Engagements, After-Actions, Tasks/Work Items, Calendar, Briefs/Briefing Books, Analytics, Activity, Advanced Search, Availability Polling), **Dossiers** (Countries, Organizations, Persons, Forums, Topics, Working Groups, Engagements cross-link), **Administration** (AI Settings, System Settings, Field Permissions, Audit Logs, Data Retention, Approvals)
- **D-02:** Standalone pages (Analytics, Activity, Advanced Search, Availability Polling) placed under Operations group as secondary items
- **D-03:** Engagements appear in BOTH Operations (as workflow entry) AND Dossiers (as entity type) -- cross-linked
- **D-04:** Badge counts shown on key items only: Tasks (pending count), Approvals (pending count), Engagements (active count). No badges on dossier type links.
- **D-05:** Brand area at sidebar top includes logo + small user avatar/name. User menu moves from footer to header area.
- **D-06:** 4 bottom tabs: Dashboard, Dossiers, Tasks, More
- **D-07:** Active tab indicator uses filled icon + colored label. Inactive tabs use outline icons + muted labels.
- **D-08:** Tab bar auto-hides on scroll down, reappears on scroll up (iOS Safari pattern)
- **D-09:** Safe area inset bottom padding for modern phones with notch/home indicator
- **D-10:** Demo pages gated with `VITE_DEV_MODE` route-level guard -- `beforeLoad` checks `import.meta.env.VITE_DEV_MODE`, redirects to `/dashboard` in production
- **D-11:** 14 identified demo pages: progressive-form-demo, responsive-demo, plugin-demo, duplicate-detection-demo, modern-nav-demo, form-auto-save-demo, export-import, compliance-demo, field-history-demo, entity-templates-demo, bulk-actions-demo, validation-demo, meeting-minutes-demo, actionable-errors-demo
- **D-12:** Search scope covers ALL entity types: dossiers (all 7 types), navigation pages, work items (tasks/commitments/intake), commands (create engagement, switch language, toggle theme), and any other searchable content
- **D-13:** Show last 5-10 recently visited items when palette opens (before typing). Stored in localStorage.
- **D-14:** Results grouped by type: Recents, Dossiers, Pages, Work Items, Commands -- each section shows top 3-5 matches (VS Code/Raycast style)
- **D-15:** Most performant data source: hybrid approach -- search TanStack Query cache first for instant results, fall back to API search endpoint (debounced) for cache misses
- **D-16:** Mobile accessible via search icon in header that opens full-screen command palette overlay

### Claude's Discretion

- Sidebar group collapse default state (all expanded vs selective collapse based on item count)
- Icon-rail behavior (768-1023px) -- whether to show group icons with flyout or flat icon list
- After-Actions placement: own sidebar item vs nested under Engagements (decide based on workflow patterns)
- "More" tab content format on mobile (bottom sheet with groups vs flat list)
- "Dossiers" tab expansion behavior on mobile (hub page vs inline picker)
- Old/duplicate route redirect strategy (redirect to canonical vs 404)
- modern-nav-standalone.tsx treatment (demo gate vs removal)

### Deferred Ideas (OUT OF SCOPE)

- **Start absorbing standalone pages earlier** -- User expressed interest in moving analytics/briefs/network-graph into contextual locations during Phase 8, but this is Phase 13 (Feature Absorption) scope. Consider accelerating Phase 13 or merging some absorption work earlier if time allows.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                                                        | Research Support                                                                                                                                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NAV-01 | User sees hub-based sidebar with 3 groups (Operations, Dossiers, Administration) replacing current flat navigation | Restructure `navigation-config.ts` from 6 categories to 3 groups; existing shadcn Sidebar primitives (SidebarGroup, SidebarGroupLabel, Collapsible) fully support this                                                       |
| NAV-02 | User can navigate to all 8 dossier types under `/dossiers/{type}/` with consistent URL structure                   | Dossier routes already structured correctly under `routes/_protected/dossiers/`; `dossier-routes.ts` provides helpers; elected_official is a person_subtype (7 types + 1 subtype = 8)                                        |
| NAV-03 | User does not encounter duplicate or orphan routes -- ~15 duplicates eliminated                                    | 15+ duplicate top-level routes identified (countries.tsx, organizations.tsx, forums.tsx, engagements.tsx, working-groups.tsx, persons.tsx, contacts.tsx, etc.); TanStack Router `beforeLoad` + `redirect()` pattern verified |
| NAV-04 | User does not see demo pages in production -- 10+ demo pages moved behind VITE_DEV_MODE flag                       | 14 demo pages identified; `beforeLoad` guard pattern with `import.meta.env.VITE_DEV_MODE` check; no existing demo pages use this pattern yet                                                                                 |
| NAV-05 | User on mobile sees bottom tab bar with 4 items replacing sidebar                                                  | `useResponsive()` hook provides `isMobile` breakpoint detection; safe-area-inset patterns already in codebase; scroll-aware hide requires custom `useScrollDirection` hook                                                   |
| NAV-06 | User can access Cmd+K quick switcher from any page to search and navigate globally                                 | Existing CommandPalette uses cmdk 1.1.1 with `useQuickSwitcherSearch` hook; needs enhancement for recent items (localStorage), grouped results, and mobile full-screen overlay                                               |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **RTL-first**: All navigation components MUST use logical properties (ms-_, me-_, ps-_, pe-_, text-start, text-end). Never `ml-*`, `mr-*`, `text-left`, `text-right`.
- **Mobile-first**: Start with mobile layout (320px+), then scale up. Minimum 44x44px touch targets.
- **Component hierarchy**: HeroUI v3 > Aceternity > Kibo-UI > shadcn/ui
- **Bundle budget**: 200KB budget enforced via size-limit
- **Bilingual**: Arabic (RTL) and English (LTR) must both work
- **Code style**: No semicolons, single quotes, trailing commas, explicit return types, no explicit `any`
- **Naming**: PascalCase components, camelCase functions/hooks (use- prefix), CONSTANT_CASE rarely

## Standard Stack

### Core (Already Installed)

| Library                   | Version   | Purpose                                               | Why Standard                                                                           |
| ------------------------- | --------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| cmdk                      | 1.1.1     | Command palette primitives                            | Already installed; used by existing CommandPalette via `components/ui/command.tsx`     |
| @tanstack/react-router    | 1.168.8   | File-based routing, `beforeLoad` guards, `redirect()` | Already core router; `createFileRoute` + `beforeLoad` is the established guard pattern |
| @tanstack/react-query     | v5        | Server state, cache-first search                      | Already core; TanStack Query cache provides instant search results                     |
| shadcn sidebar primitives | N/A       | SidebarGroup, SidebarMenu, SidebarMenuButton, etc.    | Already in `components/ui/sidebar.tsx`; full compound component set                    |
| @radix-ui/react-dialog    | 1.1.15    | Dialog for command palette                            | Already installed; used by cmdk CommandDialog                                          |
| framer-motion             | 12.38.0   | Animation for tab bar show/hide                       | Already installed; provides `AnimatePresence` + `motion.div`                           |
| lucide-react              | installed | Navigation icons                                      | Already standard icon library                                                          |

### Supporting (Already Available)

| Library                      | Version     | Purpose                                              | When to Use                                         |
| ---------------------------- | ----------- | ---------------------------------------------------- | --------------------------------------------------- |
| useResponsive()              | custom hook | Breakpoint detection (isMobile, isTablet, isDesktop) | Conditional rendering of sidebar vs. bottom tab bar |
| useDirection()               | custom hook | RTL detection (isRTL)                                | Directional icon logic, sidebar side                |
| useSidebar()                 | custom hook | Sidebar state (open, collapsed, mobile)              | Sidebar expand/collapse behavior                    |
| useWorkQueueCounts()         | custom hook | Badge count data                                     | Tasks, Approvals, Engagements badge display         |
| useKeyboardShortcutContext() | custom hook | Cmd+K registration                                   | CommandPalette open/close from anywhere             |
| useQuickSwitcherSearch()     | domain hook | Dossier/work item search                             | Entity search in command palette                    |

### No New Dependencies Needed

All required functionality is covered by existing installed libraries. No new npm packages are needed for Phase 8.

## Architecture Patterns

### Recommended Changes to Existing Structure

```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── navigation-config.ts      # REFACTOR: 6 categories -> 3 groups
│   │   ├── AppSidebar.tsx             # REFACTOR: Use new 3-group config
│   │   ├── nav-main.tsx               # REFACTOR: Collapsible groups for all 3
│   │   ├── nav-user.tsx               # MOVE: User menu from footer to header area
│   │   ├── MobileBottomTabBar.tsx     # NEW: 4-tab bottom bar for mobile
│   │   ├── SiteHeader.tsx             # ENHANCE: Add search icon for mobile
│   │   └── MainLayout.tsx             # ENHANCE: Conditionally render tab bar
│   ├── keyboard-shortcuts/
│   │   └── CommandPalette.tsx          # ENHANCE: Recent items, groups, mobile overlay
│   └── modern-nav/
│       └── navigationData.ts           # DEPRECATE: Old 6-category data (replaced)
├── hooks/
│   ├── useScrollDirection.ts           # NEW: Scroll-aware tab bar hide/show
│   └── useRecentNavigation.ts          # NEW: localStorage recent items tracker
├── lib/
│   └── dev-mode-guard.ts              # NEW: Shared VITE_DEV_MODE beforeLoad guard
└── routes/_protected/
    ├── countries.tsx                    # CONVERT: Add redirect to /dossiers/countries/
    ├── organizations.tsx               # CONVERT: Add redirect to /dossiers/organizations/
    ├── forums.tsx                      # CONVERT: Add redirect to /dossiers/forums/
    ├── engagements.tsx                 # KEEP: Layout route with Outlet (has child routes)
    ├── working-groups.tsx              # CONVERT: Add redirect to /dossiers/working_groups/
    ├── persons.tsx                     # KEEP: Has child routes (persons/$personId, persons/create)
    ├── *-demo.tsx (14 files)           # GATE: Add beforeLoad dev-mode guard
    └── modern-nav-demo.tsx             # GATE: Add beforeLoad dev-mode guard
```

### Pattern 1: Navigation Config Restructure (3 Groups)

**What:** Replace `createNavigationSections` to return 3 groups instead of 6 categories
**When to use:** Sidebar rendering in `NavMain` and `AppSidebar`

```typescript
// navigation-config.ts - new structure
export interface NavigationGroup {
  id: 'operations' | 'dossiers' | 'administration'
  label: string
  icon: LucideIcon
  items: NavigationItem[]
  collapsible?: boolean
  defaultOpen?: boolean
}

export const createNavigationGroups = (
  counts: { tasks: number; approvals: number; engagements: number },
  isAdmin: boolean,
): NavigationGroup[] => [
  {
    id: 'operations',
    label: 'navigation.operations',
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { id: 'dashboard', label: 'navigation.dashboard', path: '/dashboard', icon: LayoutDashboard },
      {
        id: 'engagements',
        label: 'navigation.engagements',
        path: '/engagements',
        icon: Briefcase,
        badgeCount: counts.engagements,
      },
      {
        id: 'after-actions',
        label: 'navigation.afterActions',
        path: '/after-actions',
        icon: ClipboardList,
      },
      {
        id: 'tasks',
        label: 'navigation.tasks',
        path: '/my-work',
        icon: CheckSquare,
        badgeCount: counts.tasks,
      },
      { id: 'calendar', label: 'navigation.calendar', path: '/calendar', icon: CalendarDays },
      { id: 'briefs', label: 'navigation.briefs', path: '/briefs', icon: ScrollText },
      {
        id: 'briefing-books',
        label: 'navigation.briefingBooks',
        path: '/briefing-books',
        icon: BookOpen,
      },
      // Secondary items
      {
        id: 'analytics',
        label: 'navigation.analytics',
        path: '/analytics',
        icon: TrendingUp,
        secondary: true,
      },
      {
        id: 'activity',
        label: 'navigation.activity',
        path: '/activity',
        icon: Activity,
        secondary: true,
      },
      {
        id: 'advanced-search',
        label: 'navigation.advancedSearch',
        path: '/advanced-search',
        icon: Search,
        secondary: true,
      },
      {
        id: 'availability-polling',
        label: 'navigation.polling',
        path: '/availability-polling',
        icon: Clock,
        secondary: true,
      },
    ],
  },
  {
    id: 'dossiers',
    label: 'navigation.dossiers',
    icon: FolderOpen,
    defaultOpen: true,
    items: [
      { id: 'countries', label: 'navigation.countries', path: '/dossiers/countries', icon: Globe },
      {
        id: 'organizations',
        label: 'navigation.organizations',
        path: '/dossiers/organizations',
        icon: Building2,
      },
      { id: 'persons', label: 'navigation.persons', path: '/dossiers/persons', icon: Users },
      { id: 'forums', label: 'navigation.forums', path: '/dossiers/forums', icon: MessageSquare },
      { id: 'topics', label: 'navigation.topics', path: '/dossiers/topics', icon: Tag },
      {
        id: 'working-groups',
        label: 'navigation.workingGroups',
        path: '/dossiers/working_groups',
        icon: UsersRound,
      },
      {
        id: 'engagements-dossier',
        label: 'navigation.engagements',
        path: '/dossiers/engagements',
        icon: Briefcase,
      },
    ],
  },
  // Administration group only if admin
  ...(isAdmin
    ? [
        {
          id: 'administration' as const,
          label: 'navigation.administration',
          icon: Settings,
          collapsible: true,
          defaultOpen: false,
          items: [
            {
              id: 'ai-settings',
              label: 'navigation.aiSettings',
              path: '/admin/ai-settings',
              icon: Sparkles,
            },
            {
              id: 'system',
              label: 'navigation.systemSettings',
              path: '/admin/system',
              icon: Wrench,
            },
            {
              id: 'field-permissions',
              label: 'navigation.fieldPermissions',
              path: '/admin/field-permissions',
              icon: Shield,
            },
            { id: 'audit-logs', label: 'navigation.auditLogs', path: '/audit-logs', icon: History },
            {
              id: 'data-retention',
              label: 'navigation.dataRetention',
              path: '/admin/data-retention',
              icon: Database,
            },
            {
              id: 'approvals',
              label: 'navigation.approvals',
              path: '/approvals',
              icon: CheckSquare,
              badgeCount: counts.approvals,
            },
          ],
        },
      ]
    : []),
]
```

### Pattern 2: Route-Level Dev Mode Guard

**What:** Shared `beforeLoad` guard for demo pages
**When to use:** All 14 demo route files

```typescript
// lib/dev-mode-guard.ts
import { redirect } from '@tanstack/react-router'

export function devModeGuard(): void {
  if (import.meta.env.VITE_DEV_MODE !== 'true') {
    throw redirect({ to: '/dashboard' })
  }
}

// Usage in any demo route:
// progressive-form-demo.tsx
import { createFileRoute } from '@tanstack/react-router'
import { devModeGuard } from '@/lib/dev-mode-guard'

export const Route = createFileRoute('/_protected/progressive-form-demo')({
  beforeLoad: devModeGuard,
  component: ProgressiveFormDemo,
})
```

### Pattern 3: Duplicate Route Redirect

**What:** Convert duplicate top-level routes to permanent redirects
**When to use:** Routes like `/countries` that should redirect to `/dossiers/countries/`

```typescript
// routes/_protected/countries.tsx - CONVERTED to redirect
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/countries')({
  beforeLoad: () => {
    throw redirect({ to: '/dossiers/countries' })
  },
})
```

### Pattern 4: Mobile Bottom Tab Bar with Scroll-Aware Hide

**What:** Fixed bottom navigation bar that hides on scroll down, shows on scroll up
**When to use:** Mobile viewport only (< 768px)

```typescript
// hooks/useScrollDirection.ts
import { useState, useEffect, useRef } from 'react'

export function useScrollDirection(threshold = 10): 'up' | 'down' | null {
  const [direction, setDirection] = useState<'up' | 'down' | null>(null)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = (): void => {
      const currentY = window.scrollY
      const diff = currentY - lastScrollY.current

      if (Math.abs(diff) < threshold) return

      setDirection(diff > 0 ? 'down' : 'up')
      lastScrollY.current = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return direction
}
```

```tsx
// components/layout/MobileBottomTabBar.tsx (simplified structure)
import { motion, AnimatePresence } from 'framer-motion'

export function MobileBottomTabBar(): React.ReactElement | null {
  const scrollDirection = useScrollDirection()
  const { isMobile } = useResponsive()
  const isVisible = scrollDirection !== 'down'

  if (!isMobile) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed bottom-0 start-0 end-0 z-50',
            'border-t bg-background/95 backdrop-blur-md',
            'pb-[max(0.5rem,env(safe-area-inset-bottom))]',
          )}
        >
          {/* 4 tabs: Dashboard, Dossiers, Tasks, More */}
        </motion.nav>
      )}
    </AnimatePresence>
  )
}
```

### Pattern 5: Recent Navigation Tracking (localStorage)

**What:** Track last 5-10 visited entities for CommandPalette "Recents" group
**When to use:** On every navigation event

```typescript
// hooks/useRecentNavigation.ts
const STORAGE_KEY = 'recent_navigation'
const MAX_ITEMS = 10

interface RecentItem {
  path: string
  title: string
  type: 'page' | 'dossier' | 'work-item'
  icon?: string
  timestamp: number
}

export function useRecentNavigation(): {
  recentItems: RecentItem[]
  addRecent: (item: Omit<RecentItem, 'timestamp'>) => void
  clearRecents: () => void
} {
  // Read from localStorage, write on navigation
}
```

### Anti-Patterns to Avoid

- **Do NOT replace the sidebar entirely:** Refactor `navigation-config.ts` and `NavMain` in place. The shadcn sidebar primitives (SidebarGroup, SidebarMenu, etc.) are well-tested.
- **Do NOT duplicate navigation state:** Mobile tab bar and desktop sidebar must share the same navigation config source.
- **Do NOT use `NavigationShell` from modern-nav:** The `navigationData.ts` 6-category structure is being replaced, not enhanced.
- **Do NOT delete duplicate route files:** Convert them to redirects so bookmarks and shared links still work.
- **Do NOT add `viewport-fit=cover` to index.html without testing:** Current viewport meta does not include it; safe-area-inset works with existing `env()` patterns even without it.

## Don't Hand-Roll

| Problem                | Don't Build                  | Use Instead                                                    | Why                                                                           |
| ---------------------- | ---------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Command palette dialog | Custom modal + input + list  | cmdk 1.1.1 (already installed) via `components/ui/command.tsx` | Handles keyboard nav, filtering, grouping, accessibility                      |
| Sidebar primitives     | Custom nav components        | shadcn sidebar.tsx (already exists)                            | SidebarGroup, SidebarMenu, SidebarMenuButton, badges, collapsible all built   |
| Route guards           | Custom middleware system     | TanStack Router `beforeLoad` + `redirect()`                    | Built-in, type-safe, works with file-based routing                            |
| Breakpoint detection   | Custom media query listeners | `useResponsive()` hook (already exists)                        | Provides isMobile, isTablet, isDesktop with proper breakpoints                |
| RTL detection          | Custom dir checks            | `useDirection()` hook (already exists)                         | Centralized, consistent RTL/LTR behavior                                      |
| Animation for tab bar  | CSS transitions              | framer-motion `AnimatePresence` (already installed)            | Smooth enter/exit animations with gesture support                             |
| Badge counts           | Custom query hooks           | `useWorkQueueCounts()` (already exists)                        | Already fetches intake/waiting counts; extend for tasks/approvals/engagements |

**Key insight:** This phase is primarily a restructure/reorganize phase. Nearly all required primitives already exist in the codebase. The risk is in introducing unnecessary new abstractions rather than reusing what's there.

## Common Pitfalls

### Pitfall 1: Breaking Existing Bookmarks/Shared Links

**What goes wrong:** Deleting duplicate route files (e.g., `/countries`) causes 404 for users who bookmarked the old URL
**Why it happens:** Natural instinct is to delete duplicates rather than redirect
**How to avoid:** Convert every duplicate route to a `beforeLoad` redirect to the canonical `/dossiers/{type}/` path. Keep the file, replace the component with a redirect.
**Warning signs:** Any route file deletion without a corresponding redirect

### Pitfall 2: Sidebar State Desync Between Mobile and Desktop

**What goes wrong:** Mobile tab bar and desktop sidebar show different active states or navigate to different routes
**Why it happens:** Building two completely separate navigation systems
**How to avoid:** Share a single `navigation-config.ts` source. Both sidebar and tab bar derive their items from the same config. Use `useLocation()` for active state in both.
**Warning signs:** Hardcoded paths in the tab bar component instead of referencing config

### Pitfall 3: Demo Gate Leaking in Development

**What goes wrong:** Dev mode guard blocks demos in development because `VITE_DEV_MODE` is not set
**Why it happens:** Forgetting to add `VITE_DEV_MODE=true` to `.env.development`
**How to avoid:** Default to `true` in development mode: `import.meta.env.VITE_DEV_MODE !== 'false' || import.meta.env.DEV`. Use Vite's built-in `import.meta.env.DEV` as fallback.
**Warning signs:** Demo pages returning 404 during local development

### Pitfall 4: CommandPalette Bundle Size

**What goes wrong:** Enhancing CommandPalette with API search, recent items, and entity data causes bundle bloat
**Why it happens:** Importing heavy search logic eagerly
**How to avoid:** The CommandPalette is already in `__root.tsx` (always loaded). Keep search hooks lazy -- `useQuickSwitcherSearch` already exists and is debounced. Recent items use lightweight localStorage.
**Warning signs:** Bundle size increase > 5KB for navigation changes

### Pitfall 5: Safe Area Inset Not Working

**What goes wrong:** Bottom tab bar overlaps phone home indicator
**Why it happens:** Missing `viewport-fit=cover` in the viewport meta tag, or incorrect CSS
**How to avoid:** Use `pb-[max(0.5rem,env(safe-area-inset-bottom))]` pattern (already proven in codebase). Add `viewport-fit=cover` to the viewport meta tag in `index.html`.
**Warning signs:** Tab bar content touching the bottom edge on iPhone X+ devices

### Pitfall 6: RTL Icon Direction in Tab Bar

**What goes wrong:** Directional icons (chevrons, arrows) point wrong way in Arabic
**Why it happens:** Not applying RTL icon rules from CLAUDE.md
**How to avoid:** Follow Rule 5: back arrow = `arrow-forward`, forward/next = `arrow-back`. Use `useDirection()` for conditional icon rendering.
**Warning signs:** Icons that look correct in English but wrong in Arabic

### Pitfall 7: Engagements Route Conflict

**What goes wrong:** `/engagements` already exists as a layout route with child routes (`$engagementId`). Converting it to a redirect breaks the engagement detail pages.
**Why it happens:** Treating all top-level routes the same as simple redirects
**How to avoid:** The `/engagements` route has child routes (`/engagements/$engagementId`) -- it MUST be kept as a layout route. Only add a redirect for `/engagements` INDEX to `/dossiers/engagements/`, not the layout route itself.
**Warning signs:** Engagement detail pages (/engagements/uuid) returning 404

## Duplicate Routes Inventory

The following top-level routes duplicate functionality under `/dossiers/`:

| Duplicate Route              | Canonical Route              | Route Type        | Action                               |
| ---------------------------- | ---------------------------- | ----------------- | ------------------------------------ |
| `/countries`                 | `/dossiers/countries/`       | Simple component  | Redirect via `beforeLoad`            |
| `/organizations`             | `/dossiers/organizations/`   | Simple component  | Redirect via `beforeLoad`            |
| `/forums`                    | `/dossiers/forums/`          | Simple component  | Redirect via `beforeLoad`            |
| `/working-groups`            | `/dossiers/working_groups/`  | Simple component  | Redirect via `beforeLoad`            |
| `/contacts`                  | `/dossiers/persons/`         | Simple component  | Redirect via `beforeLoad`            |
| `/engagements`               | Layout route (keep)          | Layout + children | Redirect INDEX only, keep layout     |
| `/engagements/$engagementId` | `/dossiers/engagements/$id`  | Detail page       | Keep both for now (Phase 11 unifies) |
| `/persons`                   | `/dossiers/persons/`         | Layout + children | Redirect INDEX, keep children        |
| `/persons/$personId`         | `/dossiers/persons/$id`      | Detail page       | Keep both (different components)     |
| `/persons/create`            | `/dossiers/create` (unified) | Create form       | Redirect via `beforeLoad`            |

**Other potential orphans to audit:**

| Route                           | Status                             | Action                                                 |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| `/themes`                       | Orphan (not in current nav config) | Redirect to `/dossiers/topics/` or remove              |
| `/contacts`                     | Orphan (not in current nav config) | Redirect to `/dossiers/persons/`                       |
| `/mous`                         | Orphan (not in current nav config) | Keep or redirect (MoUs are a feature, not a duplicate) |
| `/commitments`                  | Used in CommandPalette             | Keep (work item, not a dossier duplicate)              |
| `/positions`                    | In current nav config              | Keep (distinct feature)                                |
| `/delegations`                  | Not in nav config                  | Audit -- may be orphan                                 |
| `/legislation`                  | Not in nav config                  | Audit -- may be orphan                                 |
| `/compare`                      | Not in nav config                  | Keep (utility page)                                    |
| `/scenario-sandbox`             | Not in nav config                  | Demo gate or remove                                    |
| `/stakeholder-influence`        | Not in nav config                  | Audit -- may be orphan                                 |
| `/geographic-visualization`     | Not in nav config                  | Audit -- may be orphan                                 |
| `/events`                       | In modern-nav config               | Redirect to `/calendar` or keep                        |
| `/custom-dashboard`             | In current nav config              | Keep (distinct page)                                   |
| `/dashboard.project-management` | Dot-notation route                 | Nested under dashboard -- keep                         |
| `/kanban`                       | Not in nav config                  | Redirect to `/my-work/board`                           |
| `/export`                       | In admin nav config                | Keep under admin                                       |
| `/monitoring`                   | In admin nav config                | Keep under admin                                       |

## Demo Pages Inventory (14 files)

All require `beforeLoad` dev-mode guard:

| File                           | Route Path                             |
| ------------------------------ | -------------------------------------- |
| `progressive-form-demo.tsx`    | `/_protected/progressive-form-demo`    |
| `responsive-demo.tsx`          | `/_protected/responsive-demo`          |
| `plugin-demo.tsx`              | `/_protected/plugin-demo`              |
| `duplicate-detection-demo.tsx` | `/_protected/duplicate-detection-demo` |
| `modern-nav-demo.tsx`          | `/_protected/modern-nav-demo`          |
| `form-auto-save-demo.tsx`      | `/_protected/form-auto-save-demo`      |
| `export-import.tsx`            | `/_protected/export-import`            |
| `compliance-demo.tsx`          | `/_protected/compliance-demo`          |
| `field-history-demo.tsx`       | `/_protected/field-history-demo`       |
| `entity-templates-demo.tsx`    | `/_protected/entity-templates-demo`    |
| `bulk-actions-demo.tsx`        | `/_protected/bulk-actions-demo`        |
| `validation-demo.tsx`          | `/_protected/validation-demo`          |
| `meeting-minutes-demo.tsx`     | `/_protected/meeting-minutes-demo`     |
| `actionable-errors-demo.tsx`   | `/_protected/actionable-errors-demo`   |

## Code Examples

### TanStack Router Redirect (Verified Pattern)

The project already uses `redirect()` in `_protected.tsx`. This is the verified pattern:

```typescript
// Source: frontend/src/routes/_protected.tsx (lines 17-21)
import { redirect } from '@tanstack/react-router'

// In beforeLoad:
throw redirect({
  to: '/login',
})

// For route consolidation:
throw redirect({
  to: '/dossiers/countries',
})
```

### Safe Area Inset (Verified Pattern from Codebase)

```typescript
// Source: frontend/src/components/ui/context-aware-fab.tsx (line 420)
'bottom-[max(1rem,env(safe-area-inset-bottom))]'

// Source: frontend/src/components/ui/heroui-modal.tsx (line 209)
'pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4'

// For bottom tab bar:
'pb-[max(0.5rem,env(safe-area-inset-bottom))]'
```

### Admin Route Guard (Verified Pattern from Codebase)

```typescript
// Source: frontend/src/routes/_protected/admin/ai-settings.tsx (lines 48-57)
beforeLoad: async () => {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin'
  if (!isAdmin) {
    throw new Error('Admin access required')
  }
},
```

### Existing CommandPalette Groups (Verified Pattern)

```typescript
// Source: frontend/src/components/keyboard-shortcuts/CommandPalette.tsx
// Already uses cmdk grouped results:
<CommandGroup heading={t('quickActions.title')}>
  {quickActions.map(action => (
    <CommandItem key={action.id} onSelect={action.action}>
      <action.icon className="me-2 size-4" />
      <span>{action.label}</span>
    </CommandItem>
  ))}
</CommandGroup>
```

## State of the Art

| Old Approach                                           | Current Approach                        | When Changed | Impact                             |
| ------------------------------------------------------ | --------------------------------------- | ------------ | ---------------------------------- |
| 6-category flat nav (navigationData.ts)                | 3-group hub sidebar (D-01)              | Phase 8      | Cleaner mental model, fewer clicks |
| Duplicate routes (/countries AND /dossiers/countries/) | Single canonical route + redirect       | Phase 8      | No 404s, consistent URLs           |
| Demo pages visible in production                       | VITE_DEV_MODE gated                     | Phase 8      | Cleaner production experience      |
| No mobile bottom nav                                   | 4-tab bottom bar                        | Phase 8      | Mobile-optimized navigation        |
| CommandPalette with shortcuts only                     | Full entity search + recents + commands | Phase 8      | Power user productivity            |

**Deprecated/outdated:**

- `navigationData.ts` (6-category structure): Replaced by new 3-group `navigation-config.ts`
- `NavigationShell` / `responsive-nav.tsx`: Superseded by sidebar + mobile tab bar approach
- Duplicate top-level entity routes: All redirected to `/dossiers/{type}/`

## Open Questions

1. **`/engagements` route handling**
   - What we know: `/engagements` is a layout route with child routes (`$engagementId`). It cannot be simply redirected.
   - What's unclear: Whether engagement detail pages should redirect to `/dossiers/engagements/$id` now or in Phase 11
   - Recommendation: Keep `/engagements/$engagementId` working for Phase 8; Phase 11 (Engagement Workspace) will unify the engagement route structure

2. **`/persons` route handling**
   - What we know: `/persons` has child routes (`/$personId`, `/create`). Dossier routes also have `/dossiers/persons/$id`.
   - What's unclear: Whether both person detail routes render the same component
   - Recommendation: Redirect `/persons` index to `/dossiers/persons/`, keep child routes functional until Phase 12

3. **Elected Officials as 8th dossier type in sidebar**
   - What we know: `elected_official` is a `person_subtype`, not a separate dossier type. Only 7 types in route map.
   - What's unclear: Whether DOSS-08 (Phase 12) will create a separate route or keep it under persons
   - Recommendation: Show 7 types in Dossiers sidebar group for Phase 8. Phase 12 will handle elected officials.

4. **`modern-nav-standalone.tsx` vs `modern-nav-demo.tsx`**
   - What we know: Only `modern-nav-demo.tsx` exists in routes. `navigationData.ts` exists in `components/modern-nav/`.
   - Recommendation: Gate `modern-nav-demo.tsx` with dev mode guard. Deprecate but don't delete `navigationData.ts` until Phase 8 is verified.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified). Phase 8 is purely frontend code/config changes using existing installed packages.

## Validation Architecture

### Test Framework

| Property           | Value                                    |
| ------------------ | ---------------------------------------- |
| Framework          | Vitest (via `frontend/vitest.config.ts`) |
| Config file        | `frontend/vitest.config.ts`              |
| Quick run command  | `cd frontend && pnpm test -- --run`      |
| Full suite command | `cd frontend && pnpm test`               |

### Phase Requirements to Test Map

| Req ID | Behavior                                              | Test Type | Automated Command                                           | File Exists? |
| ------ | ----------------------------------------------------- | --------- | ----------------------------------------------------------- | ------------ |
| NAV-01 | Sidebar renders 3 groups                              | unit      | `cd frontend && pnpm test -- --run -t "navigation-config"`  | No -- Wave 0 |
| NAV-02 | All 8 dossier types navigable under /dossiers/{type}/ | unit      | `cd frontend && pnpm test -- --run -t "dossier-routes"`     | No -- Wave 0 |
| NAV-03 | Duplicate routes redirect correctly                   | unit      | `cd frontend && pnpm test -- --run -t "route-redirects"`    | No -- Wave 0 |
| NAV-04 | Demo pages gated in production                        | unit      | `cd frontend && pnpm test -- --run -t "dev-mode-guard"`     | No -- Wave 0 |
| NAV-05 | Mobile bottom tab bar renders 4 items                 | unit      | `cd frontend && pnpm test -- --run -t "MobileBottomTabBar"` | No -- Wave 0 |
| NAV-06 | Cmd+K opens and searches entities                     | unit      | `cd frontend && pnpm test -- --run -t "CommandPalette"`     | No -- Wave 0 |

### Sampling Rate

- **Per task commit:** `cd frontend && pnpm test -- --run`
- **Per wave merge:** `cd frontend && pnpm test && pnpm build && pnpm lint`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/__tests__/navigation-config.test.ts` -- covers NAV-01 (3-group structure)
- [ ] `frontend/src/__tests__/dev-mode-guard.test.ts` -- covers NAV-04 (demo page gating)
- [ ] `frontend/src/__tests__/MobileBottomTabBar.test.tsx` -- covers NAV-05 (tab bar rendering)
- [ ] `frontend/src/__tests__/useScrollDirection.test.ts` -- covers NAV-05 (auto-hide)
- [ ] `frontend/src/__tests__/useRecentNavigation.test.ts` -- covers NAV-06 (recent items)

## Discretion Recommendations

Based on research, here are recommendations for areas marked as Claude's Discretion:

| Area                            | Recommendation                                                           | Rationale                                                                     |
| ------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Sidebar collapse default        | Operations and Dossiers expanded, Administration collapsed               | Most-used groups visible by default; admin is low-frequency                   |
| Icon-rail behavior (768-1023px) | Flat icon list (current `collapsible="icon"` behavior)                   | Already works well with existing SidebarRail; flyout adds complexity          |
| After-Actions placement         | Own sidebar item under Operations                                        | After-actions are a distinct workflow step, not a sub-feature of engagements  |
| "More" tab on mobile            | Bottom sheet with grouped list (Operations secondaries + Administration) | Matches iOS conventions; consistent with bottom tab bar metaphor              |
| "Dossiers" tab on mobile        | Navigate to `/dossiers` hub page                                         | Hub page already exists at `dossiers/index.tsx`; avoids complex inline picker |
| Duplicate route strategy        | Redirect to canonical (not 404)                                          | Preserves bookmarks and shared links; zero user friction                      |
| modern-nav-standalone.tsx       | No standalone file exists; gate `modern-nav-demo.tsx` with dev guard     | Only the demo exists; treat as demo page                                      |

## Sources

### Primary (HIGH confidence)

- Codebase analysis: `navigation-config.ts`, `AppSidebar.tsx`, `CommandPalette.tsx`, `sidebar.tsx`, `_protected.tsx`, `dossier-routes.ts`, `MainLayout.tsx`, `SiteHeader.tsx` -- direct inspection of all canonical files
- Route inventory: Full listing of `routes/_protected/` (77 files)
- Existing patterns: `beforeLoad` guards in admin routes, safe-area-inset in 5 existing components

### Secondary (MEDIUM confidence)

- [TanStack Router Authenticated Routes](https://tanstack.com/router/v1/docs/framework/react/guide/authenticated-routes) -- `beforeLoad` + `redirect()` pattern
- [TanStack Router Route Guards](https://www.mintlify.com/TanStack/router/router/guides/route-guards) -- guard patterns
- [cmdk npm](https://www.npmjs.com/package/cmdk) -- command palette primitives (version 1.1.1 confirmed)
- [CSS Safe Area Insets](https://theosoti.com/short/safe-area-inset/) -- `env(safe-area-inset-bottom)` patterns
- [Understanding env() Safe Area Insets](https://medium.com/@developerr.ayush/understanding-env-safe-area-insets-in-css-from-basics-to-react-and-tailwind-a0b65811a8ab) -- Tailwind integration

### Tertiary (LOW confidence)

- None -- all findings verified against codebase or official documentation

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries already installed, versions verified against package.json
- Architecture: HIGH -- patterns derived from existing codebase, not theoretical
- Pitfalls: HIGH -- based on analysis of actual duplicate routes, existing guard patterns, and codebase conventions
- Route inventory: HIGH -- direct file listing and content inspection
- Mobile patterns: MEDIUM -- scroll-aware hide is a custom implementation (no library), but framer-motion is already available

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- no expected breaking changes in stack)
