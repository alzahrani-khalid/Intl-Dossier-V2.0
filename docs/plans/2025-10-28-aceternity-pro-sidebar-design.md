# Aceternity Pro Collapsible Sidebar Implementation Design

**Date**: 2025-10-28
**Status**: Design Approved
**Approach**: Aceternity Pro + Feature Enhancements

## Overview

Replace existing sidebar implementations with Aceternity Pro's Collapsible Sidebar component, extended with custom features for badge counts, grouped navigation, and RTL support.

## 1. Component Architecture

### Components to Delete

- `frontend/src/components/Layout/Sidebar.tsx` - Old manual sidebar implementation
- `frontend/src/components/Layout/AnimatedSidebar.tsx` - Current shadcn/ui-based sidebar
- `frontend/src/components/ui/sidebar.tsx` - Keep temporarily for reference, delete after migration

### New Component Structure

```
frontend/src/components/Layout/
└── ProCollapsibleSidebar.tsx       # New Aceternity Pro-based sidebar
    ├── SidebarProvider (from Aceternity Pro)
    ├── Sidebar (collapsible container)
    ├── SidebarContent (navigation sections)
    ├── SidebarFooter (user profile + controls)
    └── Custom Extensions:
        ├── BadgeCounter (work queue badges)
        ├── GroupedSections (My Work, Main, Browse, Tools, etc.)
        └── RTLWrapper (dir, logical properties)
```

## 2. Navigation Mapping

### Route Preservation

All 40+ existing routes preserved exactly:

#### My Work Section (Priority - with badge counts)

- **My Assignments** → `/tasks` (badge: assignments count)
- **Intake Queue** → `/my-work/intake` (badge: intake count)
- **Waiting Queue** → `/my-work/waiting` (badge: waiting count)

#### Main Section

- Dashboard → `/dashboard`
- Approvals → `/approvals`
- Dossiers → `/dossiers`
- Positions → `/positions`
- After Actions → `/after-actions`

#### Browse Section (7 Unified Dossier Types)

- Countries → `/countries`
- Organizations → `/organizations`
- Forums → `/forums`
- Engagements → `/engagements`
- Themes → `/themes`
- Working Groups → `/working-groups`
- Persons → `/persons`

#### Tools Section

- Calendar → `/calendar`
- Briefs → `/briefs`
- Intelligence → `/intelligence`
- Analytics → `/analytics`
- Reports → `/reports`

#### Documents Section

- Data Library → `/data-library`
- Word Assistant → `/word-assistant`

#### Admin Section (role-based: `isAdmin`)

- Users → `/users`
- Monitoring → `/monitoring`
- Export → `/export`

#### Bottom Section

- Settings → `/settings`
- Help → `/help`

### Data Integration

- **Work Queue Counts**: Use existing `useWorkQueueCounts()` hook
- **Active Route Detection**: Use TanStack Router's `useLocation()` for highlighting
- **User Context**: Use existing `useAuth()` for user profile and role checks
- **Icons**: All icons from `lucide-react` preserved exactly as in current implementation

## 3. RTL Support & Mobile-First

### RTL (Right-to-Left) Requirements

#### Language Detection

```tsx
const { i18n } = useTranslation();
const isRTL = i18n.language === 'ar';
```

#### Logical Properties (MANDATORY)

- Replace all `ml-*`, `mr-*`, `pl-*`, `pr-*` with `ms-*`, `me-*`, `ps-*`, `pe-*`
- Use `text-start`/`text-end` instead of `text-left`/`text-right`
- Use `start-*`/`end-*` for positioning instead of `left-*`/`right-*`

#### Directional Attributes

- Set `dir={isRTL ? 'rtl' : 'ltr'}` on sidebar container
- Set `side={isRTL ? 'right' : 'left'}` on Aceternity Sidebar component

#### Icon Flipping

- Directional icons (chevrons, arrows): `className={isRTL ? 'rotate-180' : ''}`

### Mobile-First Responsive Design

#### Touch Targets

- Minimum 44x44px: `min-h-11 min-w-11` on all interactive elements
- Adequate spacing: `gap-4` between menu items

#### Breakpoint Strategy

```tsx
// Base (mobile 320-640px) → sm → md → lg → xl → 2xl
className = 'px-4 sm:px-6 lg:px-8'; // Container padding
className = 'text-sm sm:text-base'; // Typography scaling
```

#### Mobile Behavior

- Sheet/drawer overlay on mobile (< 768px)
- Full sidebar on tablet/desktop (≥ 768px)
- Touch-friendly swipe gestures for opening/closing

## 4. Aceternity Pro Styling

### Core Styling from Aceternity Pro

#### Container & Layout

```tsx
// Desktop sidebar
className="hidden md:flex md:flex-col h-full w-[300px] flex-shrink-0 px-4 py-4
           bg-neutral-100 dark:bg-neutral-800"

// Mobile sidebar (sheet/drawer)
className="fixed inset-0 z-[100]"
```

#### Navigation Link Styling

```tsx
// Base state
className="relative px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-200
           transition-all duration-150"

// Hover state (with Framer Motion layoutId)
className="absolute inset-0 bg-neutral-200 dark:bg-neutral-900 rounded-lg z-10"

// Active state
className="bg-neutral-200 dark:bg-neutral-900 font-medium"

// Icon translate on hover
className="group-hover/sidebar:translate-x-1 transition-transform duration-150"
```

#### Collapsible Animation

```tsx
// Width animation
animate={{ width: open ? "300px" : "60px" }}
transition={{ duration: 0.3, ease: "easeInOut" }}

// Mobile slide animation
initial={{ x: "-100%", opacity: 0 }}  // RTL: x: "100%"
animate={{ x: 0, opacity: 1 }}
exit={{ x: "-100%", opacity: 0 }}     // RTL: x: "100%"
```

#### Typography & Spacing

- Text sizes: `text-sm` (labels), `text-xs` (section headers)
- Gaps: `gap-1` (menu items), `gap-2` (sections)
- Padding: `px-3 py-2` (menu items), `px-4 py-4` (container)

### Theme Integration

Replace Aceternity's `neutral-*` colors with our theme variables:

- `bg-sidebar`, `bg-sidebar-accent`, `text-sidebar-foreground`
- `border-sidebar-border`, `text-sidebar-accent-foreground`

### Custom Styling

#### Badge Styling

```tsx
// Work queue badges
className="absolute end-1 flex h-5 min-w-5 items-center justify-center
           rounded-md px-1 bg-primary text-primary-foreground
           text-xs font-medium tabular-nums"
```

#### Section Headers

```tsx
// Group labels (My Work, Main, Browse, etc.)
className="px-2 text-xs font-semibold text-muted-foreground
           uppercase tracking-wider mb-2"
```

## 5. Implementation Strategy

### Installation Steps

1. **Install Aceternity Pro Component**

```bash
cd frontend
# Note: Verify exact command from Aceternity Pro docs
npx shadcn@latest add [aceternity-pro-collapsible-sidebar-command]
```

2. **Create New Component**

- File: `frontend/src/components/Layout/ProCollapsibleSidebar.tsx`
- Import Aceternity Pro base components
- Wrap with custom extensions (badges, grouping, RTL)

3. **Update Layout Integration**

- Replace `AnimatedSidebar` import in `MainLayout.tsx` with `ProCollapsibleSidebar`
- Update `SidebarProvider` usage if needed

4. **Delete Old Components**

```bash
rm frontend/src/components/Layout/Sidebar.tsx
rm frontend/src/components/Layout/AnimatedSidebar.tsx
# Keep sidebar.tsx temporarily for reference during migration
```

### Dependencies

Auto-installed via Aceternity Pro:

- `framer-motion` - Animations
- `@tabler/icons-react` - Icons (if needed, we use lucide-react)
- `clsx` - Classname utilities
- `tailwind-merge` - Tailwind class merging

## 6. Testing Checklist

### Functionality

- ✅ All 40+ routes navigate correctly
- ✅ Badge counts display for My Work items
- ✅ Role-based admin section shows/hides correctly
- ✅ Active route highlighting works
- ✅ User profile displays with logout functionality

### Responsive & Accessibility

- ✅ Mobile: Sheet/drawer opens and closes smoothly
- ✅ Desktop: Sidebar expands/collapses smoothly
- ✅ Touch targets ≥ 44x44px on mobile
- ✅ Keyboard navigation works (Tab, Enter, Escape)

### RTL & Internationalization

- ✅ Arabic: Sidebar appears on right, icons flip correctly
- ✅ English: Sidebar appears on left
- ✅ All logical properties working (`ms-*`, `me-*`, `ps-*`, `pe-*`)
- ✅ Translations load from i18n correctly

### Visual & Animation

- ✅ Hover animations smooth (150ms transitions)
- ✅ Collapse/expand animations (300ms ease-in-out)
- ✅ Theme colors from CSS variables apply correctly
- ✅ Dark mode styling works

## 7. Rollback Plan

If issues arise during implementation:

1. Keep old `AnimatedSidebar.tsx` in a backup branch
2. Can quickly revert layout import to previous sidebar
3. Test thoroughly in dev environment before production deployment

## 8. Success Criteria

Implementation is complete when:

1. ✅ All existing navigation routes work
2. ✅ Badge counts display correctly
3. ✅ RTL layout functions properly for Arabic
4. ✅ Mobile responsive behavior works
5. ✅ Aceternity Pro animations smooth and performant
6. ✅ Theme integration matches design system
7. ✅ No accessibility regressions
8. ✅ All tests pass

## Next Steps

1. Set up git worktree for isolated development
2. Create detailed implementation plan with tasks
3. Install Aceternity Pro component
4. Build ProCollapsibleSidebar.tsx
5. Update layout integration
6. Run full testing checklist
7. Delete old sidebar components
