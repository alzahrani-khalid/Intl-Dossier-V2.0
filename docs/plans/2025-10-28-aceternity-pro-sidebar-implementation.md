# Aceternity Pro Collapsible Sidebar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace existing sidebar implementations with Aceternity Pro's Collapsible Sidebar component, extended with badge counts, grouped navigation, and RTL support.

**Architecture:** Install Aceternity Pro component as foundation, wrap with custom React component that preserves all existing navigation routes, adds work queue badge counts, implements RTL support with logical properties, and maintains mobile-first responsive design.

**Tech Stack:** React 19, TypeScript 5.8+, Aceternity Pro, Framer Motion, TanStack Router v5, i18next, Tailwind CSS, lucide-react

---

## Task 1: Install Aceternity Pro Collapsible Sidebar

**Files:**

- Check: `frontend/.env.local` (verify API key exists)
- Check: `frontend/components.json` (verify shadcn config)
- Create: `frontend/.aceternity/sidebar-installation.md` (installation notes)

**Step 1: Verify Aceternity Pro API key**

Run:

```bash
cd frontend
grep ACETERNITY_PRO_API_KEY .env.local
```

Expected: `ACETERNITY_PRO_API_KEY=aceternity_90f92c066a18e6a7c9ae2f9bfdf420e33f75fa2a10beb070e412075d0cf63551`

**Step 2: Check for Aceternity Pro component installation command**

Action: Visit https://pro.aceternity.com/products/sidebars in browser
Note: Copy the exact installation command for the Collapsible Sidebar component

**Step 3: Install Aceternity Pro Collapsible Sidebar**

Run:

```bash
cd frontend
# Use exact command from Pro docs - example format:
npx shadcn@latest add @aceternity-pro/sidebar-collapsible --yes
```

Expected: Component files installed to `frontend/src/components/ui/`

**Step 4: Verify dependencies installed**

Run:

```bash
cd frontend
pnpm list framer-motion clsx tailwind-merge
```

Expected: All three packages listed (should already be installed)

**Step 5: Document installation**

Create `frontend/.aceternity/sidebar-installation.md`:

```markdown
# Aceternity Pro Sidebar Installation

**Date:** 2025-10-28
**Component:** Collapsible Sidebar
**Command:** [paste exact command used]

## Installed Files

- List files that were created/modified

## Dependencies

- framer-motion: [version]
- clsx: [version]
- tailwind-merge: [version]
```

**Step 6: Commit installation**

```bash
git add frontend/src/components/ui/ frontend/.aceternity/sidebar-installation.md frontend/package.json frontend/pnpm-lock.yaml
git commit -m "feat: install aceternity pro collapsible sidebar component

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create Navigation Data Structure

**Files:**

- Create: `frontend/src/components/Layout/navigation-config.ts`

**Step 1: Create navigation types**

Create `frontend/src/components/Layout/navigation-config.ts`:

```typescript
import type { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badgeCount?: number;
  adminOnly?: boolean;
}

export interface NavigationSection {
  id: string;
  label: string;
  items: NavigationItem[];
}
```

**Step 2: Define navigation sections**

Add to same file:

```typescript
import {
  LayoutDashboard,
  Globe2,
  Building2,
  FileText,
  CalendarDays,
  Brain,
  Database,
  Users,
  CheckSquare,
  Inbox,
  Clock,
  Settings,
  HelpCircle,
  Folder,
  Briefcase,
  MessageSquare,
  ClipboardList,
  ScrollText,
  TrendingUp,
  BarChart3,
  Activity,
  Download,
  UserCog,
  ListChecks,
  PenTool,
  Target,
} from 'lucide-react';

export const createNavigationSections = (
  counts: { assignments: number; intake: number; waiting: number },
  isAdmin: boolean
): NavigationSection[] => {
  const sections: NavigationSection[] = [
    {
      id: 'my-work',
      label: 'navigation.myWork',
      items: [
        {
          id: 'my-assignments',
          label: 'navigation.myAssignments',
          path: '/tasks',
          icon: CheckSquare,
          badgeCount: counts.assignments,
        },
        {
          id: 'intake-queue',
          label: 'navigation.intakeQueue',
          path: '/my-work/intake',
          icon: Inbox,
          badgeCount: counts.intake,
        },
        {
          id: 'waiting-queue',
          label: 'navigation.waitingQueue',
          path: '/my-work/waiting',
          icon: Clock,
          badgeCount: counts.waiting,
        },
      ],
    },
    {
      id: 'main',
      label: 'Main',
      items: [
        {
          id: 'dashboard',
          label: 'navigation.dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'approvals',
          label: 'navigation.approvals',
          path: '/approvals',
          icon: CheckSquare,
        },
        {
          id: 'dossiers',
          label: 'navigation.dossiers',
          path: '/dossiers',
          icon: Folder,
        },
        {
          id: 'positions',
          label: 'navigation.positions',
          path: '/positions',
          icon: MessageSquare,
        },
        {
          id: 'after-actions',
          label: 'navigation.afterActions',
          path: '/after-actions',
          icon: ClipboardList,
        },
      ],
    },
    {
      id: 'browse',
      label: 'navigation.browse',
      items: [
        {
          id: 'countries',
          label: 'navigation.countries',
          path: '/countries',
          icon: Globe2,
        },
        {
          id: 'organizations',
          label: 'navigation.organizations',
          path: '/organizations',
          icon: Building2,
        },
        {
          id: 'forums',
          label: 'navigation.forums',
          path: '/forums',
          icon: Users,
        },
        {
          id: 'engagements',
          label: 'navigation.engagements',
          path: '/engagements',
          icon: CalendarDays,
        },
        {
          id: 'themes',
          label: 'navigation.themes',
          path: '/themes',
          icon: Target,
        },
        {
          id: 'working-groups',
          label: 'navigation.workingGroups',
          path: '/working-groups',
          icon: Briefcase,
        },
        {
          id: 'persons',
          label: 'navigation.persons',
          path: '/persons',
          icon: Users,
        },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [
        {
          id: 'calendar',
          label: 'navigation.calendar',
          path: '/calendar',
          icon: CalendarDays,
        },
        {
          id: 'briefs',
          label: 'navigation.briefs',
          path: '/briefs',
          icon: ScrollText,
        },
        {
          id: 'intelligence',
          label: 'navigation.intelligence',
          path: '/intelligence',
          icon: Brain,
        },
        {
          id: 'analytics',
          label: 'navigation.analytics',
          path: '/analytics',
          icon: TrendingUp,
        },
        {
          id: 'reports',
          label: 'navigation.reports',
          path: '/reports',
          icon: BarChart3,
        },
      ],
    },
    {
      id: 'documents',
      label: 'Documents',
      items: [
        {
          id: 'data-library',
          label: 'navigation.dataLibrary',
          path: '/data-library',
          icon: Database,
        },
        {
          id: 'word-assistant',
          label: 'navigation.wordAssistant',
          path: '/word-assistant',
          icon: PenTool,
        },
      ],
    },
  ];

  // Add admin section if user is admin
  if (isAdmin) {
    sections.push({
      id: 'admin',
      label: 'Admin',
      items: [
        {
          id: 'users',
          label: 'navigation.users',
          path: '/users',
          icon: UserCog,
          adminOnly: true,
        },
        {
          id: 'monitoring',
          label: 'navigation.monitoring',
          path: '/monitoring',
          icon: Activity,
          adminOnly: true,
        },
        {
          id: 'export',
          label: 'navigation.export',
          path: '/export',
          icon: Download,
          adminOnly: true,
        },
      ],
    });
  }

  return sections;
};

export const bottomNavigationItems: NavigationItem[] = [
  {
    id: 'settings',
    label: 'navigation.settings',
    path: '/settings',
    icon: Settings,
  },
  {
    id: 'help',
    label: 'navigation.getHelp',
    path: '/help',
    icon: HelpCircle,
  },
];
```

**Step 3: Commit navigation config**

```bash
git add frontend/src/components/Layout/navigation-config.ts
git commit -m "feat: create navigation data structure for sidebar

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Create ProCollapsibleSidebar Component (Part 1: Structure)

**Files:**

- Create: `frontend/src/components/Layout/ProCollapsibleSidebar.tsx`

**Step 1: Create component file with imports**

Create `frontend/src/components/Layout/ProCollapsibleSidebar.tsx`:

```typescript
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth.context';
import { useWorkQueueCounts } from '@/hooks/useWorkQueueCounts';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeSelector } from '@/components/theme-selector/theme-selector';
import {
  createNavigationSections,
  bottomNavigationItems,
  type NavigationItem,
  type NavigationSection,
} from './navigation-config';

// TODO: Import Aceternity Pro Sidebar components
// This will be added after we verify the exact import paths from installation
```

**Step 2: Add component interface and state**

Add to same file:

```typescript
interface ProCollapsibleSidebarProps {
  className?: string;
}

export function ProCollapsibleSidebar({ className }: ProCollapsibleSidebarProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isRTL = i18n.language === 'ar';

  // Fetch work queue counts
  const { data: workQueueCounts, isLoading: isLoadingCounts } = useWorkQueueCounts();
  const counts = workQueueCounts || { assignments: 0, intake: 0, waiting: 0 };

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Generate navigation sections
  const navigationSections = useMemo(
    () => createNavigationSections(counts, isAdmin),
    [counts, isAdmin]
  );

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  const userInitials = useMemo(() => {
    if (!user?.name && !user?.email) return 'GA';
    const source = user.name ?? user.email ?? 'User';
    return source
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  }, [user]);

  // TODO: Implement sidebar rendering with Aceternity Pro components

  return null;
}
```

**Step 3: Commit component structure**

```bash
git add frontend/src/components/Layout/ProCollapsibleSidebar.tsx
git commit -m "feat: create ProCollapsibleSidebar component structure

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Implement Sidebar Rendering (Part 2: Desktop Layout)

**Files:**

- Modify: `frontend/src/components/Layout/ProCollapsibleSidebar.tsx`

**Step 1: Add desktop sidebar container**

Replace `return null` in `ProCollapsibleSidebar` with:

```typescript
return (
  <div
    className={cn(
      'hidden md:flex md:flex-col h-full w-[300px] flex-shrink-0',
      'bg-sidebar text-sidebar-foreground',
      className
    )}
    dir={isRTL ? 'rtl' : 'ltr'}
  >
    {/* Header */}
    <div className="px-4 py-4">
      <Link
        to="/dashboard"
        className="flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-sm font-bold">G</span>
        </div>
        <div className="grid flex-1 text-start text-sm leading-tight">
          <span className="truncate font-semibold">GASTAT Dossier</span>
          <span className="truncate text-xs text-muted-foreground">
            {t('common.internationalRelations', 'International Relations')}
          </span>
        </div>
      </Link>
    </div>

    {/* Navigation Content */}
    <div className="flex-1 overflow-y-auto px-4">
      {navigationSections.map((section) => (
        <div key={section.id} className="mb-6">
          <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t(section.label, section.label)}
          </h3>
          <div className="space-y-1">
            {section.items.map((item) => (
              <SidebarLink
                key={item.id}
                item={item}
                isActive={
                  location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`)
                }
                isRTL={isRTL}
              />
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* Footer */}
    <div className="px-4 py-4 border-t border-sidebar-border">
      {/* Settings & Help */}
      <div className="space-y-1 mb-4">
        {bottomNavigationItems.map((item) => (
          <SidebarLink
            key={item.id}
            item={item}
            isActive={location.pathname === item.path}
            isRTL={isRTL}
          />
        ))}
      </div>

      {/* Theme & Language Controls */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <LanguageToggle compact />
        <ThemeSelector />
      </div>

      {/* User Profile */}
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
        <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <span className="text-sm font-bold">{userInitials}</span>
        </div>
        <div className="grid flex-1 text-start text-sm leading-tight min-w-0">
          <span className="truncate font-semibold text-sidebar-foreground">
            {user?.name ?? user?.email}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {user?.role ?? t('common.administrator', 'Administrator')}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className={cn(
            'rounded-md p-1.5 hover:bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground transition-all',
            'hover:scale-105 active:scale-95',
            isRTL && 'me-auto ms-0'
          )}
          aria-label={t('common.logout', 'Sign out')}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
)
```

**Step 2: Commit desktop layout**

```bash
git add frontend/src/components/Layout/ProCollapsibleSidebar.tsx
git commit -m "feat: implement desktop sidebar layout

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Create SidebarLink Component with Animations

**Files:**

- Modify: `frontend/src/components/Layout/ProCollapsibleSidebar.tsx`

**Step 1: Add SidebarLink component before ProCollapsibleSidebar**

Add before `export function ProCollapsibleSidebar`:

```typescript
interface SidebarLinkProps {
  item: NavigationItem
  isActive: boolean
  isRTL: boolean
}

function SidebarLink({ item, isActive, isRTL }: SidebarLinkProps) {
  const { t } = useTranslation()
  const Icon = item.icon

  return (
    <Link
      to={item.path}
      className="group/link relative block"
    >
      {/* Hover background animation */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="active-sidebar-link"
            className="absolute inset-0 bg-sidebar-accent rounded-lg z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      {/* Link content */}
      <div
        className={cn(
          'relative z-20 flex items-center gap-3 px-3 py-2 rounded-lg',
          'text-sidebar-foreground transition-all duration-150',
          'group-hover/link:bg-sidebar-accent/50',
          isActive && 'font-medium text-sidebar-accent-foreground'
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4 shrink-0 transition-transform duration-150',
            'group-hover/link:translate-x-1',
            isRTL && 'group-hover/link:-translate-x-1'
          )}
        />
        <span className="text-sm">{t(item.label, item.label)}</span>

        {/* Badge for work queue counts */}
        {item.badgeCount !== undefined && item.badgeCount > 0 && (
          <div
            className={cn(
              'ms-auto flex h-5 min-w-5 items-center justify-center',
              'rounded-md px-1 bg-primary text-primary-foreground',
              'text-xs font-medium tabular-nums'
            )}
          >
            {item.badgeCount > 99 ? '99+' : item.badgeCount}
          </div>
        )}
      </div>
    </Link>
  )
}
```

**Step 2: Commit SidebarLink component**

```bash
git add frontend/src/components/Layout/ProCollapsibleSidebar.tsx
git commit -m "feat: add SidebarLink component with hover animations

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Add Mobile Sidebar with Sheet

**Files:**

- Modify: `frontend/src/components/Layout/ProCollapsibleSidebar.tsx`

**Step 1: Add Sheet import**

Add to imports:

```typescript
import { Sheet, SheetContent } from '@/components/ui/sheet';
```

**Step 2: Add mobile state and wrapper component**

After imports, add:

```typescript
import { useState } from 'react'

export function ProCollapsibleSidebarWrapper({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <>
      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side={isRTL ? 'right' : 'left'}
          className="w-[300px] p-0 bg-sidebar"
        >
          <ProCollapsibleSidebar className="md:hidden" />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <ProCollapsibleSidebar className="hidden md:flex" />

      {/* Main Content */}
      {children}
    </>
  )
}
```

**Step 3: Export wrapper as default**

Add at end of file:

```typescript
export default ProCollapsibleSidebarWrapper;
```

**Step 4: Commit mobile sidebar**

```bash
git add frontend/src/components/Layout/ProCollapsibleSidebar.tsx
git commit -m "feat: add mobile sidebar with sheet overlay

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Integrate New Sidebar into Layout

**Files:**

- Modify: `frontend/src/components/Layout/MainLayout.tsx`

**Step 1: Read current MainLayout**

Run:

```bash
cat frontend/src/components/Layout/MainLayout.tsx
```

Note: Identify where `AnimatedSidebar` is imported and used

**Step 2: Replace sidebar import**

Find:

```typescript
import { AnimatedSidebar } from './AnimatedSidebar';
```

Replace with:

```typescript
import { ProCollapsibleSidebarWrapper } from './ProCollapsibleSidebar';
```

**Step 3: Replace sidebar usage**

Find where `<AnimatedSidebar />` is rendered and replace with:

```typescript
<ProCollapsibleSidebarWrapper>
  {/* existing main content */}
</ProCollapsibleSidebarWrapper>
```

**Step 4: Run dev server to test**

Run:

```bash
cd frontend
pnpm dev
```

Expected: Dev server starts without errors

**Step 5: Commit layout integration**

```bash
git add frontend/src/components/Layout/MainLayout.tsx
git commit -m "feat: integrate ProCollapsibleSidebar into MainLayout

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Test Navigation Routes

**Files:**

- None (testing only)

**Step 1: Start dev server**

Run:

```bash
cd frontend
pnpm dev
```

**Step 2: Test My Work section**

Open: http://localhost:5173
Navigate to:

- /tasks (My Assignments)
- /my-work/intake (Intake Queue)
- /my-work/waiting (Waiting Queue)

Expected: All routes load, badge counts display

**Step 3: Test Main section**

Navigate to:

- /dashboard
- /approvals
- /dossiers
- /positions
- /after-actions

Expected: All routes load, active highlighting works

**Step 4: Test Browse section**

Navigate to all 7 dossier types:

- /countries
- /organizations
- /forums
- /engagements
- /themes
- /working-groups
- /persons

Expected: All routes load correctly

**Step 5: Test Tools, Documents, Admin, Bottom sections**

Navigate through remaining routes
Expected: All routes work, admin section shows/hides based on role

**Step 6: Document test results**

Create note of any issues found for Task 9

---

## Task 9: Test RTL Support

**Files:**

- None (testing only)

**Step 1: Switch to Arabic**

In running app, use language toggle to switch to Arabic

**Step 2: Verify sidebar position**

Expected: Sidebar appears on right side of screen

**Step 3: Verify icon flipping**

Expected: Directional icons (chevrons) flip 180 degrees

**Step 4: Verify text alignment**

Expected: All text aligns to start (right for Arabic)

**Step 5: Verify badge positioning**

Expected: Badges appear on start side (right for Arabic)

**Step 6: Switch back to English**

Expected: Sidebar returns to left, icons flip back, text aligns left

---

## Task 10: Test Mobile Responsive Behavior

**Files:**

- None (testing only)

**Step 1: Open browser DevTools**

Press F12, open Device Toolbar (Ctrl+Shift+M)

**Step 2: Test mobile viewport (375px)**

Expected:

- Sidebar hidden by default
- Sheet/drawer can open via trigger button
- Touch targets ≥ 44px
- All navigation items visible

**Step 3: Test tablet viewport (768px)**

Expected:

- Sidebar appears as permanent fixture
- Full navigation visible
- Responsive padding applied

**Step 4: Test desktop viewport (1440px)**

Expected:

- Full sidebar with optimal spacing
- Hover animations smooth
- All features functional

---

## Task 11: Delete Old Sidebar Components

**Files:**

- Delete: `frontend/src/components/Layout/Sidebar.tsx`
- Delete: `frontend/src/components/Layout/AnimatedSidebar.tsx`
- Delete: `frontend/src/components/ui/sidebar.tsx`

**Step 1: Verify new sidebar is working**

Ensure all tests from Tasks 8-10 pass

**Step 2: Delete old Sidebar.tsx**

Run:

```bash
git rm frontend/src/components/Layout/Sidebar.tsx
```

**Step 3: Delete old AnimatedSidebar.tsx**

Run:

```bash
git rm frontend/src/components/Layout/AnimatedSidebar.tsx
```

**Step 4: Delete shadcn sidebar primitives**

Run:

```bash
git rm frontend/src/components/ui/sidebar.tsx
```

**Step 5: Check for any remaining imports**

Run:

```bash
grep -r "from './Sidebar'" frontend/src/
grep -r "from './AnimatedSidebar'" frontend/src/
grep -r "from '@/components/ui/sidebar'" frontend/src/
```

Expected: No results (all imports removed in Task 7)

**Step 6: Commit deletions**

```bash
git commit -m "chore: remove old sidebar implementations

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 12: Run Full Test Suite

**Files:**

- None (testing only)

**Step 1: Run TypeScript type check**

Run:

```bash
cd frontend
pnpm typecheck
```

Expected: No type errors

**Step 2: Run linter**

Run:

```bash
cd frontend
pnpm lint
```

Expected: No linting errors (or only warnings)

**Step 3: Run unit tests (if any exist)**

Run:

```bash
cd frontend
pnpm test
```

Expected: All tests pass

**Step 4: Build production bundle**

Run:

```bash
cd frontend
pnpm build
```

Expected: Build succeeds without errors

**Step 5: Document any issues**

If any errors found, document them for resolution

---

## Task 13: Final Verification & Documentation

**Files:**

- Create: `frontend/.aceternity/sidebar-implementation-notes.md`

**Step 1: Create implementation notes**

Create `frontend/.aceternity/sidebar-implementation-notes.md`:

```markdown
# ProCollapsibleSidebar Implementation Notes

**Completed:** 2025-10-28
**Component:** `frontend/src/components/Layout/ProCollapsibleSidebar.tsx`

## Features Implemented

- ✅ Aceternity Pro Collapsible Sidebar base
- ✅ 40+ navigation routes preserved
- ✅ Work queue badge counts (My Work section)
- ✅ Role-based admin section visibility
- ✅ RTL support with logical properties
- ✅ Mobile-first responsive design
- ✅ Framer Motion hover animations
- ✅ Theme integration (CSS variables)
- ✅ i18n translations

## Component Structure

- `ProCollapsibleSidebar` - Main sidebar component
- `ProCollapsibleSidebarWrapper` - Wrapper with mobile sheet
- `SidebarLink` - Animated navigation link
- `navigation-config.ts` - Navigation data structure

## Navigation Sections

1. My Work (with badges)
2. Main
3. Browse (7 dossier types)
4. Tools
5. Documents
6. Admin (role-based)
7. Bottom (Settings, Help)

## Testing Completed

- ✅ All routes navigate correctly
- ✅ Badge counts display
- ✅ RTL layout (Arabic)
- ✅ Mobile responsive (375px - 1440px)
- ✅ Touch targets ≥ 44px
- ✅ Hover animations smooth
- ✅ TypeScript type checks pass
- ✅ Production build succeeds

## Files Modified

- Created: `ProCollapsibleSidebar.tsx`
- Created: `navigation-config.ts`
- Modified: `MainLayout.tsx`
- Deleted: `Sidebar.tsx`, `AnimatedSidebar.tsx`, `ui/sidebar.tsx`

## Dependencies

- framer-motion (animations)
- lucide-react (icons)
- @tanstack/router (navigation)
- i18next (translations)

## Known Issues

[List any known issues or future enhancements]

## Maintenance Notes

- Badge counts sourced from `useWorkQueueCounts()` hook
- RTL detection via `i18n.language === 'ar'`
- Admin visibility via `user?.role === 'admin' || 'super_admin'`
```

**Step 2: Commit documentation**

```bash
git add frontend/.aceternity/sidebar-implementation-notes.md
git commit -m "docs: add ProCollapsibleSidebar implementation notes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Step 3: Create final summary commit**

Run:

```bash
git log --oneline -13
```

Verify all 13 commits are present

**Step 4: Push to remote (if applicable)**

Run:

```bash
git push origin 027-contact-directory
```

---

## Success Criteria

Implementation complete when:

- ✅ All 40+ navigation routes work
- ✅ Badge counts display correctly for My Work section
- ✅ RTL layout functions properly (Arabic on right, English on left)
- ✅ Mobile responsive behavior works (375px - 1440px)
- ✅ Hover animations smooth (150ms transitions)
- ✅ Theme colors from CSS variables apply correctly
- ✅ TypeScript type checks pass
- ✅ Production build succeeds
- ✅ Old sidebar components deleted
- ✅ Documentation complete

## Rollback Procedure

If critical issues arise:

1. Revert layout integration: `git revert [Task 7 commit]`
2. Restore old sidebar: `git revert [Task 11 commit]`
3. Remove new component: `git revert [Task 3-6 commits]`
4. Test that old sidebar works
5. Investigate issues before retry
