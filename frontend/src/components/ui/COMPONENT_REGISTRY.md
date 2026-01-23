# UI Component Registry

> **Last Updated:** 2025-01-23
> **Total Components:** 68

This document serves as the canonical registry of all UI components in the project, categorizing them by source library and providing guidelines for component selection.

## Component Hierarchy (Selection Order)

When choosing UI components, follow this hierarchy:

1. **Aceternity UI** (Primary) - Use for all animated, interactive components
2. **Kibo-UI** (Secondary) - Use only when Aceternity doesn't have equivalent
3. **shadcn/ui** (Tertiary) - Use only for basic primitives not available elsewhere
4. **Custom** (Last Resort) - Build custom only when no library has the component

---

## Component Inventory

### Aceternity UI Components (19)

These components come from [ui.aceternity.com](https://ui.aceternity.com) and provide rich animations and interactions.

| Component                   | File                                | Description                               |
| --------------------------- | ----------------------------------- | ----------------------------------------- |
| 3D Card                     | `3d-card.tsx`                       | Interactive 3D hover effect card          |
| Animated Tooltip            | `animated-tooltip.tsx`              | Animated avatar tooltips on hover         |
| Background Boxes            | `background-boxes.tsx`              | Animated grid background effect           |
| Bento Grid                  | `bento-grid.tsx`                    | Modern dashboard-style grid layout        |
| Expandable Card             | `expandable-card.tsx`               | Card that expands on click with animation |
| File Upload                 | `file-upload.tsx`                   | Animated drag-and-drop file upload        |
| Floating Dock               | `floating-dock.tsx`                 | macOS-style dock navigation               |
| Floating Navbar             | `floating-navbar.tsx`               | Scroll-reactive floating navigation       |
| Layout Grid                 | `layout-grid.tsx`                   | Interactive image layout grid             |
| Link Preview                | `link-preview.tsx`                  | Hover-triggered link preview cards        |
| Moving Border               | `moving-border.tsx`                 | Animated gradient border effect           |
| Placeholders & Vanish Input | `placeholders-and-vanish-input.tsx` | Animated input with rotating placeholders |
| Text Generate Effect        | `text-generate-effect.tsx`          | Word-by-word text animation               |
| Timeline                    | `timeline.tsx`                      | Scroll-animated vertical timeline         |
| World Map                   | `world-map.tsx`                     | Interactive dotted world map              |

### Kibo-UI Components (1)

These components come from [kibo-ui.com](https://www.kibo-ui.com) and provide specialized functionality.

| Component | File         | Description                |
| --------- | ------------ | -------------------------- |
| Kanban    | `kanban.tsx` | Drag-and-drop Kanban board |

### shadcn/ui Components (42)

These are Radix-based primitives from [ui.shadcn.com](https://ui.shadcn.com). Use only when Aceternity/Kibo alternatives don't exist.

| Component           | File                      | Aceternity Alternative?         |
| ------------------- | ------------------------- | ------------------------------- |
| Accordion           | `accordion.tsx`           | No                              |
| Alert               | `alert.tsx`               | No                              |
| Alert Dialog        | `alert-dialog.tsx`        | Consider Aceternity Modal       |
| Avatar              | `avatar.tsx`              | Use Animated Tooltip for groups |
| Badge               | `badge.tsx`               | No                              |
| Button              | `button.tsx`              | Consider Moving Border Button   |
| Calendar            | `calendar.tsx`            | No                              |
| Card                | `card.tsx`                | Consider 3D Card, Bento Grid    |
| Checkbox            | `checkbox.tsx`            | No                              |
| Collapsible         | `collapsible.tsx`         | No                              |
| Command             | `command.tsx`             | No                              |
| Dialog              | `dialog.tsx`              | Consider Aceternity Modal       |
| Drawer              | `drawer.tsx`              | No                              |
| Dropdown Menu       | `dropdown-menu.tsx`       | No                              |
| Form                | `form.tsx`                | No (use with Aceternity inputs) |
| Hover Card          | `hover-card.tsx`          | Use Link Preview                |
| Input               | `input.tsx`               | Use Placeholders & Vanish Input |
| Label               | `label.tsx`               | No                              |
| Navigation Menu     | `navigation-menu.tsx`     | Use Floating Navbar             |
| Pagination          | `pagination.tsx`          | No                              |
| Popover             | `popover.tsx`             | Use Link Preview                |
| Progress            | `progress.tsx`            | No                              |
| Radio Group         | `radio-group.tsx`         | No                              |
| Scroll Area         | `scroll-area.tsx`         | No                              |
| Select              | `select.tsx`              | No                              |
| Separator           | `separator.tsx`           | No                              |
| Sheet               | `sheet.tsx`               | No                              |
| Sidebar             | `sidebar.tsx`             | Use Floating Dock               |
| Sidebar Collapsible | `sidebar-collapsible.tsx` | Use Floating Dock               |
| Skeleton            | `skeleton.tsx`            | No                              |
| Slider              | `slider.tsx`              | No                              |
| Switch              | `switch.tsx`              | No                              |
| Table               | `table.tsx`               | No                              |
| Tabs                | `tabs.tsx`                | Consider Aceternity Tabs        |
| Textarea            | `textarea.tsx`            | No                              |
| Toast               | `toast.tsx`               | No                              |
| Toggle              | `toggle.tsx`              | No                              |
| Toggle Group        | `toggle-group.tsx`        | No                              |
| Tooltip             | `tooltip.tsx`             | Use Animated Tooltip            |

### Custom Components (14)

Project-specific components built for mobile-first and RTL support.

| Component                 | File                            | Description                       |
| ------------------------- | ------------------------------- | --------------------------------- |
| Bottom Sheet              | `bottom-sheet.tsx`              | Mobile bottom sheet pattern       |
| Content Skeletons         | `content-skeletons.tsx`         | Loading skeleton patterns         |
| Context-Aware FAB         | `context-aware-fab.tsx`         | Smart floating action button      |
| Enhanced Progress         | `enhanced-progress.tsx`         | Progress with percentage display  |
| Floating Action Button    | `floating-action-button.tsx`    | Material-style FAB                |
| Form Wizard               | `form-wizard.tsx`               | Multi-step form container         |
| Mobile Action Bar         | `mobile-action-bar.tsx`         | Bottom action bar for mobile      |
| Pull to Refresh Container | `pull-to-refresh-container.tsx` | Mobile pull-to-refresh            |
| Pull to Refresh Indicator | `pull-to-refresh-indicator.tsx` | PTR spinner indicator             |
| Related Entity Carousel   | `related-entity-carousel.tsx`   | Entity card carousel              |
| Swipeable Card            | `swipeable-card.tsx`            | Card with swipe gestures          |
| Thumb Zone Safe Area      | `thumb-zone-safe-area.tsx`      | Safe area for thumb reach         |
| Touch Target              | `touch-target.tsx`              | 44px minimum touch target wrapper |

---

## Migration Recommendations

The following shadcn/ui components should be considered for Aceternity upgrades:

### High Priority (Visual Impact)

1. **Card** → **3D Card** or **Bento Grid** for dashboard cards
2. **Input** → **Placeholders & Vanish Input** for forms
3. **Tooltip** → **Animated Tooltip** for user avatars/lists
4. **Dialog** → Consider Aceternity modal with backdrop blur

### Medium Priority (UX Enhancement)

1. **Navigation Menu** → **Floating Navbar** for scroll-reactive nav
2. **Hover Card** → **Link Preview** for rich link previews
3. **Sidebar** → **Floating Dock** for navigation

### Low Priority (Keep shadcn/ui)

- Form primitives (checkbox, radio, select, switch)
- Layout utilities (separator, scroll-area)
- Feedback components (alert, badge, toast)

---

## Installation Commands

### Aceternity UI

```bash
npx shadcn@latest add "https://ui.aceternity.com/registry/[component].json" --yes
```

### Kibo-UI

```bash
npx shadcn@latest add "@kibo-ui/[component]"
```

### shadcn/ui (Last Resort)

```bash
npx shadcn@latest add [component]
```

---

## Component Usage Guidelines

### 1. Import from `@/components/ui`

```tsx
import { Button } from '@/components/ui/button'
import { BentoGrid } from '@/components/ui/bento-grid'
```

### 2. Mobile-First & RTL Requirements

All components must support:

- Logical properties (ms-_, me-_, ps-_, pe-_)
- 44px minimum touch targets
- RTL direction via `dir` attribute

### 3. Framer Motion Dependency

Aceternity components require `motion/react`:

```tsx
import { motion } from 'motion/react'
```

---

## Audit Checklist

Before adding a new component:

- [ ] Check Aceternity UI catalog first
- [ ] Check Kibo-UI if Aceternity doesn't have it
- [ ] Only use shadcn/ui for basic primitives
- [ ] Ensure mobile-first responsive design
- [ ] Verify RTL support with logical properties
- [ ] Add to this registry with source annotation
