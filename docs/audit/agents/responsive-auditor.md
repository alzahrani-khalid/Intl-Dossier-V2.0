# Responsive Auditor

**Purpose:** Inspect mobile-first design compliance — touch targets, breakpoint ordering, layout adaptivity, and mobile-specific components.

## File Scope

**Primary:**

- `frontend/src/components/layout/MainLayout.tsx`
- `frontend/src/components/layout/MobileBottomTabBar.tsx`
- `frontend/src/components/layout/AppSidebar.tsx`
- `frontend/src/components/ui/context-aware-fab.tsx`
- `frontend/src/components/ui/touch-target.tsx`
- `frontend/src/components/ui/thumb-zone-safe-area.tsx`
- `frontend/src/components/ui/mobile-action-bar.tsx`
- `frontend/src/hooks/useResponsive*`

**Secondary (check usage):**

- All route components for the current journey
- Form components (input sizing, button sizing)
- Table/list components (scroll, overflow)

## Checklist

### Mobile-First Breakpoints

- [ ] Base styles target mobile (320px+), NOT desktop
- [ ] Breakpoint order: base → `sm:` → `md:` → `lg:` → `xl:` → `2xl:`
- [ ] No desktop-first patterns (`lg:hidden` without mobile-first base)
- [ ] `xs:` breakpoint (320px) used where needed for very small screens

### Touch Targets

- [ ] All interactive elements >= 44x44px (`min-h-11 min-w-11`)
- [ ] Minimum 8px gap between adjacent touch targets
- [ ] Click/tap areas don't overlap
- [ ] Touch targets accessible in thumb zone on mobile

### Layout Adaptivity

- [ ] Grid columns collapse on mobile (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- [ ] Sidebar hidden on mobile, bottom tab bar shown
- [ ] Tables become scrollable or card-layout on mobile
- [ ] Modals/dialogs use full-screen on mobile (`sm:max-w-lg` pattern)
- [ ] No horizontal overflow causing horizontal scrollbar

### Typography Scaling

- [ ] Font sizes scale with breakpoints (`text-sm sm:text-base md:text-lg`)
- [ ] Headings don't overflow containers on mobile
- [ ] Line lengths stay readable (not too wide on desktop, not too cramped on mobile)

### Navigation

- [ ] Mobile bottom tab bar shows correct items
- [ ] FAB (floating action button) doesn't overlap with bottom nav
- [ ] Breadcrumbs truncate or scroll on mobile
- [ ] Header height appropriate for mobile (not too tall)

### Content Layout

- [ ] Images/media scale within containers
- [ ] Long text truncates with ellipsis or wraps correctly
- [ ] Action buttons stack vertically on mobile, horizontal on desktop
- [ ] Card layouts adapt to screen width
- [ ] Padding increases with screen size (`px-4 sm:px-6 lg:px-8`)

### Scroll Behavior

- [ ] No double scrollbars (nested scroll containers)
- [ ] Sticky headers/footers work correctly
- [ ] Scroll position preserved during navigation
- [ ] Pull-to-refresh doesn't conflict with scroll

### useResponsive Hook

- [ ] `useResponsive()` or `useMediaQuery()` used for conditional rendering
- [ ] No `window.innerWidth` checks without SSR guard
- [ ] Responsive state updates on resize

## Output Format

```markdown
### [SEVERITY] Description

- **File:** path:line
- **Agent:** responsive-auditor
- **Journey:** {journey-id}
- **Issue:** What's wrong
- **Expected:** What it should be
- **Fix:** How to fix
- **Affects:** [journeys]
```

## Severity Guide

- **CRITICAL:** Content inaccessible on mobile, horizontal overflow hides content, touch targets unreachable
- **WARNING:** Non-mobile-first breakpoints, small touch targets, layout doesn't adapt
- **INFO:** Minor spacing inconsistency, optimization opportunity
