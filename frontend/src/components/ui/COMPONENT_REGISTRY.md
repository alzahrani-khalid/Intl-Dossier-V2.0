# UI Component Registry

> **Last Updated:** 2026-05-12 (Phase 48 — aligned with CLAUDE.md primitive cascade)

This document is the canonical registry of UI primitives in the project. The visual source of truth is the **IntelDossier prototype** at `frontend/design-system/inteldossier_handoff_design/`. Primitives in this directory are token-bound — visual styling, color, spacing, type, borders, and shadows always come from the prototype tokens (`var(--*)` or `@theme`-mapped Tailwind utilities).

## Component Hierarchy (Selection Order)

Per CLAUDE.md "Component Library Strategy":

1. **HeroUI v3** (Primary) — accessible primitives (Modal, Popover, Combobox, etc.). Override colors/spacing/radius via design tokens; never accept default chrome.
2. **Radix UI** (Secondary) — headless primitives HeroUI doesn't cover (already in via `@radix-ui/react-slot`).
3. **Custom** (Tertiary) — build mirroring a prototype component if no primitive fits.

### Banned without explicit user request

- **Aceternity UI** — animation-heavy, marketing aesthetic. Conflicts with IntelDossier's restrained motion language. Do not install or import. Existing legacy files are scheduled for removal.
- **Kibo UI** — different visual system. Do not install or import. Local kibo-ui aliases are banned for new code.
- **shadcn/ui defaults** — the wrappers in `components/ui/heroui-*.tsx` exist for API compatibility, not visual fidelity. Re-skin them via tokens.

If a feature seems to require Aceternity-style motion or shadcn defaults, **stop and ask** before installing anything.

---

## Component Inventory

### HeroUI v3 wrappers (token-bound)

| Component | File           | Notes                                                                                   |
| --------- | -------------- | --------------------------------------------------------------------------------------- |
| (To-do)   | `heroui-*.tsx` | Wrappers exist for API compatibility; re-skin via design tokens before relying on them. |

### Radix-based primitives (shadcn shells, re-skinned via tokens)

These are Radix-based primitives. Token-bind their visual chrome before use; do not accept defaults.

| Component           | File                      |
| ------------------- | ------------------------- |
| Accordion           | `accordion.tsx`           |
| Alert               | `alert.tsx`               |
| Alert Dialog        | `alert-dialog.tsx`        |
| Avatar              | `avatar.tsx`              |
| Badge               | `badge.tsx`               |
| Button              | `button.tsx`              |
| Calendar            | `calendar.tsx`            |
| Card                | `card.tsx`                |
| Checkbox            | `checkbox.tsx`            |
| Collapsible         | `collapsible.tsx`         |
| Command             | `command.tsx`             |
| Dialog              | `dialog.tsx`              |
| Drawer              | `drawer.tsx`              |
| Dropdown Menu       | `dropdown-menu.tsx`       |
| Form                | `form.tsx`                |
| Hover Card          | `hover-card.tsx`          |
| Input               | `input.tsx`               |
| Label               | `label.tsx`               |
| Navigation Menu     | `navigation-menu.tsx`     |
| Pagination          | `pagination.tsx`          |
| Popover             | `popover.tsx`             |
| Progress            | `progress.tsx`            |
| Radio Group         | `radio-group.tsx`         |
| Scroll Area         | `scroll-area.tsx`         |
| Select              | `select.tsx`              |
| Separator           | `separator.tsx`           |
| Sheet               | `sheet.tsx`               |
| Sidebar             | `sidebar.tsx`             |
| Sidebar Collapsible | `sidebar-collapsible.tsx` |
| Skeleton            | `skeleton.tsx`            |
| Slider              | `slider.tsx`              |
| Switch              | `switch.tsx`              |
| Table               | `table.tsx`               |
| Tabs                | `tabs.tsx`                |
| Textarea            | `textarea.tsx`            |
| Toast               | `toast.tsx`               |
| Toggle              | `toggle.tsx`              |
| Toggle Group        | `toggle-group.tsx`        |
| Tooltip             | `tooltip.tsx`             |

### Custom (Tertiary — mirror prototype patterns)

Project-specific components built for the IntelDossier design system, mobile-first, and RTL.

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

## Banned — legacy / scheduled for removal

These files exist on disk for historical reasons. **Do not import them in new code.** The lint config (`no-restricted-imports`) bans the upstream npm packages; remaining local re-exports are tracked for refactor to HeroUI v3 / Radix primitives.

### Aceternity UI (BANNED)

Phase 48 deleted three orphan wrappers (`3d-card.tsx`, `bento-grid.tsx`, `floating-navbar.tsx`). The remaining files below are legacy and will be removed as their call sites migrate to HeroUI / Radix.

| Component                   | File                                |
| --------------------------- | ----------------------------------- |
| Animated Tooltip            | `animated-tooltip.tsx`              |
| Background Boxes            | `background-boxes.tsx`              |
| Expandable Card             | `expandable-card.tsx`               |
| File Upload                 | `file-upload.tsx`                   |
| Floating Dock               | `floating-dock.tsx`                 |
| Layout Grid                 | `layout-grid.tsx`                   |
| Link Preview                | `link-preview.tsx`                  |
| Moving Border               | `moving-border.tsx`                 |
| Placeholders & Vanish Input | `placeholders-and-vanish-input.tsx` |
| Text Generate Effect        | `text-generate-effect.tsx`          |
| Timeline                    | `timeline.tsx`                      |
| World Map                   | `world-map.tsx`                     |

### Kibo-UI (BANNED)

| Component | File                | Active call sites (refactor pending)                                                              |
| --------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| Kanban    | removed in Phase 52 | Replaced by `frontend/src/components/kanban/` using HeroUI/Radix-compatible primitives + @dnd-kit |

---

## Component Usage Guidelines

### 1. Import from `@/components/ui`

```tsx
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
```

### 2. Token binding (non-negotiable)

All colors via `var(--*)` tokens or the `@theme`-mapped Tailwind utilities (`bg-bg`, `bg-surface`, `text-ink`, `border-line`, `bg-accent`, etc.). No raw hex. No Tailwind color literals like `text-blue-500`.

### 3. Mobile-first & RTL

- Logical properties only: `ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`, `rounded-s-*`, `rounded-e-*`
- 44×44 minimum touch targets below 768px; density tokens (`--row-h`) above
- Render with `dir={isRTL ? 'rtl' : 'ltr'}` on containers
- Never use `textAlign: "right"`; use `writingDirection: "rtl"` (RN) or logical text utilities (web)

---

## Installation

New primitives are added by extending HeroUI v3 wrappers or wrapping Radix headless primitives. **Do not** add Aceternity or Kibo packages — both are banned by `no-restricted-imports` in `eslint.config.mjs` and by CLAUDE.md.

---

## Audit Checklist

Before adding a new component:

- [ ] Check HeroUI v3 first (use `mcp__heroui-react__list_components` or v3 docs)
- [ ] Check Radix headless primitives next
- [ ] Build custom only when no primitive fits — mirror the closest match in `frontend/design-system/inteldossier_handoff_design/src/`
- [ ] Token-bind all colors via `var(--*)` — no raw hex, no Tailwind color literals
- [ ] Borders `1px solid var(--line)`; no card shadows; no gradient backgrounds
- [ ] Logical properties for spacing and text direction
- [ ] 44×44 touch targets below 768px; row heights via `var(--row-h)` above
- [ ] Render and test at 1024px and 1400px; verify RTL with `dir="rtl"` and Tajawal font
- [ ] Add to this registry under the correct tier
